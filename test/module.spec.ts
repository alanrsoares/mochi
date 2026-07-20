// Multi-file module driver: graph resolution, dependency order, and
// cross-module type inference. Files live in an in-memory map (no fs).
import { expect, test } from "bun:test";
import { isErr, unwrapOk } from "@onrails/result";
import { buildModules, type ModuleOutput } from "../src/module";

// Build from a `{ path: source }` fixture; paths are absolute so node:path
// resolution is deterministic across machines.
const build = (files: Record<string, string>, entry: string) => {
  const read = async (p: string): Promise<string> => {
    const src = files[p];
    if (src === undefined) throw new Error(`no such file ${p}`);
    return src;
  };
  return buildModules(entry, read);
};

const jsFor = (outs: ModuleOutput[], suffix: string): string =>
  outs.find((o) => o.path.endsWith(suffix))!.js;

const MATH = "export let double = x => mul(x, 2)\nexport let inc = x => add(x, 1)\n";

test("a module graph compiles both files, dependency-first", async () => {
  const files = {
    "/p/math.al": MATH,
    "/p/main.al": 'import { double, inc } from "./math"\nlet r = 5 |> double |> inc\n',
  };
  const outs = unwrapOk(await build(files, "/p/main.al"));
  expect(outs.map((o) => o.path)).toEqual(["/p/math.al", "/p/main.al"]); // dep before dependent
  expect(jsFor(outs, "main.al")).toContain('import { double, inc } from "./math.js";');
  expect(jsFor(outs, "math.al")).toContain("export const double");
});

test("an exported binding's type crosses the boundary", async () => {
  const files = {
    "/p/math.al": MATH,
    "/p/main.al": 'import { double } from "./math"\nlet bad = double("hi")\n',
  };
  const r = await build(files, "/p/main.al");
  expect(isErr(r)).toBe(true); // double : number -> number, applied to a string
});

test("a polymorphic export instantiates fresh at each use site", async () => {
  const files = {
    "/p/id.al": "export let id = x => x\n",
    "/p/main.al": 'import { id } from "./id"\nlet n = id(42)\nlet s = id("hi")\n',
  };
  expect(isErr(await build(files, "/p/main.al"))).toBe(false);
});

test("importing a name the module does not export is an error", async () => {
  const files = {
    "/p/math.al": MATH,
    "/p/main.al": 'import { nope } from "./math"\nlet x = nope\n',
  };
  expect(isErr(await build(files, "/p/main.al"))).toBe(true);
});

test("an import cycle is reported, not looped on", async () => {
  const files = {
    "/p/a.al": 'import { b } from "./b"\nexport let a = b\n',
    "/p/b.al": 'import { a } from "./a"\nexport let b = a\n',
  };
  expect(isErr(await build(files, "/p/a.al"))).toBe(true);
});

test("an exported variant's constructors are importable", async () => {
  const files = {
    "/p/opt.al": "export type Option a =\n  | Some(value: a)\n  | None\n",
    "/p/main.al": 'import { Some, None } from "./opt"\nlet x = Some(1)\nlet y = None\n',
  };
  const outs = unwrapOk(await build(files, "/p/main.al"));
  expect(jsFor(outs, "opt.al")).toContain(
    'export const Some = (value) => ({ _tag: "Some", value });',
  );
  expect(jsFor(outs, "main.al")).toContain("const x = Some(1);");
});
