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
    "/p/math.mochi": MATH,
    "/p/main.mochi": 'import { double, inc } from "./math"\nlet r = 5 |> double |> inc\n',
  };
  const outs = unwrapOk(await build(files, "/p/main.mochi"));
  expect(outs.map((o) => o.path)).toEqual(["/p/math.mochi", "/p/main.mochi"]); // dep before dependent
  expect(jsFor(outs, "main.mochi")).toContain('import { double, inc } from "./math.js";');
  expect(jsFor(outs, "math.mochi")).toContain("export const double");
});

test("an exported binding's type crosses the boundary", async () => {
  const files = {
    "/p/math.mochi": MATH,
    "/p/main.mochi": 'import { double } from "./math"\nlet bad = double("hi")\n',
  };
  const r = await build(files, "/p/main.mochi");
  expect(isErr(r)).toBe(true); // double : number -> number, applied to a string
});

test("a polymorphic export instantiates fresh at each use site", async () => {
  const files = {
    "/p/id.mochi": "export let id = x => x\n",
    "/p/main.mochi": 'import { id } from "./id"\nlet n = id(42)\nlet s = id("hi")\n',
  };
  expect(isErr(await build(files, "/p/main.mochi"))).toBe(false);
});

test("importing a name the module does not export is an error", async () => {
  const files = {
    "/p/math.mochi": MATH,
    "/p/main.mochi": 'import { nope } from "./math"\nlet x = nope\n',
  };
  expect(isErr(await build(files, "/p/main.mochi"))).toBe(true);
});

test("an import cycle is reported, not looped on", async () => {
  const files = {
    "/p/a.mochi": 'import { b } from "./b"\nexport let a = b\n',
    "/p/b.mochi": 'import { a } from "./a"\nexport let b = a\n',
  };
  expect(isErr(await build(files, "/p/a.mochi"))).toBe(true);
});

test("an exported variant's constructors are importable", async () => {
  const files = {
    "/p/opt.mochi": "export type Option a =\n  | Some(value: a)\n  | None\n",
    "/p/main.mochi": 'import { Some, None } from "./opt"\nlet x = Some(1)\nlet y = None\n',
  };
  const outs = unwrapOk(await build(files, "/p/main.mochi"));
  expect(jsFor(outs, "opt.mochi")).toContain(
    'export const Some = (value) => ({ _tag: "Some", value });',
  );
  expect(jsFor(outs, "main.mochi")).toContain("const x = Some(1);");
});

const OPT = "export type Option a =\n  | Some(value: a)\n  | None\n";

test("a switch on an imported variant is exhaustiveness-checked and destructures its named field", async () => {
  const files = {
    "/p/opt.mochi": OPT,
    "/p/main.mochi":
      'import { Some, None } from "./opt"\n' +
      "let get = o => switch o { | Some(v) => v | None => 0 }\n",
  };
  const outs = unwrapOk(await build(files, "/p/main.mochi"));
  // Pattern must destructure the imported ctor's KEY (`value`), not positional `_0`.
  expect(jsFor(outs, "main.mochi")).toContain('.with({ _tag: "Some" }, ({ value: v }) =>');
});

test("a non-exhaustive switch on an imported variant is rejected", async () => {
  const files = {
    "/p/opt.mochi": OPT,
    "/p/main.mochi":
      'import { Some, None } from "./opt"\n' + "let get = o => switch o { | Some(v) => v }\n", // missing None, no catch-all
  };
  expect(isErr(await build(files, "/p/main.mochi"))).toBe(true);
});
