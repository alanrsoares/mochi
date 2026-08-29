// Multi-file module driver: graph resolution, dependency order, and
// cross-module type inference. Files live in an in-memory map (no fs).
import { expect, test } from "bun:test";
import {
  buildModules,
  createModuleCache,
  type ModuleCache,
  type ModuleOutput,
} from "@mochi/compiler/module";
import { moduleDiagnostics } from "@mochi/dx/diagnostics";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";

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

test("an exported binding is reachable via import * as", async () => {
  const files = {
    "/p/math.mochi": MATH,
    "/p/main.mochi": 'import * as M from "./math"\nlet r = 5 |> M.double |> M.inc\n',
  };
  const outs = unwrapOk(await build(files, "/p/main.mochi"));
  expect(jsFor(outs, "main.mochi")).toContain('import * as M from "./math.js";');
  expect(jsFor(outs, "main.mochi")).toContain("M.double");
});

test("a switch on a namespace-imported variant uses qualified patterns", async () => {
  const files = {
    "/p/opt.mochi": OPT,
    "/p/main.mochi":
      'import * as Opt from "./opt"\n' +
      "let get = o => switch o { | Opt.Some(v) => v | Opt.None => 0 }\n" +
      "let x = Opt.Some(1)\n",
  };
  const outs = unwrapOk(await build(files, "/p/main.mochi"));
  expect(jsFor(outs, "main.mochi")).toContain('import * as Opt from "./opt.js";');
  expect(jsFor(outs, "main.mochi")).toContain('.with({ _tag: "Some" }, ({ value: v }) =>');
  expect(jsFor(outs, "main.mochi")).toContain("Opt.Some(1)");
});

test("import * as a reserved prelude namespace is rejected", async () => {
  const files = {
    "/p/math.mochi": MATH,
    "/p/main.mochi": 'import * as List from "./math"\nlet x = List.double\n',
  };
  expect(isErr(await build(files, "/p/main.mochi"))).toBe(true);
});

const SHAPE =
  "export type Shape =\n  | Circle(r: number)\n  | Square(s: number)\nexport let origin = 0\n";

test("a named import does not leak sibling constructors (ADR 0082)", async () => {
  const files = {
    "/p/shapes.mochi": SHAPE,
    "/p/main.mochi":
      'import { origin } from "./shapes"\n' + "let f = s => switch s { | Circle(r) => r }\n",
  };
  const r = await build(files, "/p/main.mochi");
  expect(isErr(r)).toBe(true);
  if (isErr(r)) expect(unwrapErr(r)[0]!.message).toContain("unknown constructor 'Circle'");
});

test("importing one ctor still exhausts the whole owning type (ADR 0082)", async () => {
  const files = {
    "/p/shapes.mochi": SHAPE,
    "/p/main.mochi":
      'import { Circle } from "./shapes"\n' + "let f = s => switch s { | Circle(r) => r }\n",
  };
  const r = await build(files, "/p/main.mochi");
  expect(isErr(r)).toBe(true);
  if (isErr(r)) expect(unwrapErr(r)[0]!.message).toContain("non-exhaustive");
});

test("a namespace import requires qualified ctor patterns (ADR 0082)", async () => {
  const files = {
    "/p/shapes.mochi": SHAPE,
    "/p/main.mochi":
      'import * as S from "./shapes"\n' +
      "let f = s => switch s { | S.Circle(r) => r | S.Square(w) => w }\n",
  };
  expect(isErr(await build(files, "/p/main.mochi"))).toBe(false);

  const bare = {
    "/p/shapes.mochi": SHAPE,
    "/p/main.mochi":
      'import * as S from "./shapes"\n' +
      "let f = s => switch s { | Circle(r) => r | Square(w) => w }\n",
  };
  const r = await build(bare, "/p/main.mochi");
  expect(isErr(r)).toBe(true);
  if (isErr(r)) expect(unwrapErr(r)[0]!.message).toMatch(/unknown constructor/);
});

test("same-name ctors from two deps collide at the second import (ADR 0082)", async () => {
  const files = {
    "/p/a.mochi": "export type A = | Empty\n",
    "/p/b.mochi": "export type B = | Empty\n",
    "/p/main.mochi": 'import { Empty } from "./a"\nimport { Empty } from "./b"\nlet x = Empty\n',
  };
  const r = await build(files, "/p/main.mochi");
  expect(isErr(r)).toBe(true);
  if (isErr(r)) expect(unwrapErr(r)[0]!.message).toContain("duplicate constructor 'Empty'");
});

test("the same ctor imported twice from one module is the same type (ADR 0082)", async () => {
  const files = {
    "/p/opt.mochi": "export type Box a = | Hold(a)\n",
    "/p/wrap.mochi": 'import { Hold } from "./opt"\nexport let wrap = x => Hold(x)\n',
    "/p/main.mochi":
      'import { Hold } from "./opt"\n' +
      'import { wrap } from "./wrap"\n' +
      "let x = wrap(1)\n" +
      "let n = switch x { | Hold(v) => v }\n",
  };
  expect(isErr(await build(files, "/p/main.mochi"))).toBe(false);
});

// --- moduleContext cache (ADR 0095) -----------------------------------------
//
// `moduleContext` infers every dependency of its entry, so checking N modules
// that share a graph re-infers that graph N times. The cache removes that
// redundancy; these guard that it never changes an ANSWER.

/** Diagnostics for `entry` against a `{ path: source }` fixture. */
const diagnose = (files: Record<string, string>, entry: string, cache?: ModuleCache) => {
  const read = async (p: string): Promise<string> => {
    const src = files[p];
    if (src === undefined) throw new Error(`no such file ${p}`);
    return src;
  };
  return moduleDiagnostics(entry, files[entry]!, read, { cache });
};

test("a cached run answers exactly what an uncached run answers", async () => {
  const files = {
    "/lib.mochi": 'export let one = 1\nexport let name = "mochi"\n',
    "/mid.mochi": 'import { one } from "/lib.mochi"\nexport let two = one + 1\n',
    "/app.mochi": 'import { two } from "/mid.mochi"\nexport let three = two + 1\n',
  };
  const cache = createModuleCache();
  for (const entry of ["/lib.mochi", "/mid.mochi", "/app.mochi"]) {
    expect(await diagnose(files, entry, cache)).toEqual(await diagnose(files, entry));
  }
  // The shared dependency was inferred once, not once per entry.
  expect(cache.entries.size).toBeGreaterThan(0);
});

test("editing a dependency invalidates the modules downstream of it", async () => {
  const cache = createModuleCache();
  const before = {
    "/lib.mochi": "export let one = 1\n",
    "/app.mochi": 'import { one } from "/lib.mochi"\nexport let sum = one + 1\n',
  };
  expect(await diagnose(before, "/app.mochi", cache)).toEqual([]);

  // `one` is a string now, so `one + 1` in the UNCHANGED entry must start failing.
  const after = {
    "/lib.mochi": 'export let one = "1"\n',
    "/app.mochi": before["/app.mochi"],
  };
  const stale = await diagnose(after, "/app.mochi", cache);
  expect(stale.map((d) => d.message)).toEqual(
    (await diagnose(after, "/app.mochi")).map((d) => d.message),
  );
  expect(stale.length).toBeGreaterThan(0);
});

test("a dependency that reverts is answered as it was, not as it briefly became", async () => {
  const cache = createModuleCache();
  const good = {
    "/lib.mochi": "export let one = 1\n",
    "/app.mochi": 'import { one } from "/lib.mochi"\nexport let sum = one + 1\n',
  };
  const bad = { ...good, "/lib.mochi": 'export let one = "1"\n' };
  expect(await diagnose(good, "/app.mochi", cache)).toEqual([]);
  expect((await diagnose(bad, "/app.mochi", cache)).length).toBeGreaterThan(0);
  expect(await diagnose(good, "/app.mochi", cache)).toEqual([]);
});

test("plugin lists are part of the cache key", async () => {
  const cache = createModuleCache();
  const files = {
    "/lib.mochi": "export let one = 1\n",
    "/app.mochi": 'import { one } from "/lib.mochi"\nexport let sum = one + 1\n',
  };
  const read = async (p: string): Promise<string> => files[p as keyof typeof files]!;
  // Two distinct lists must not share an entry, even though both are empty.
  await moduleDiagnostics("/app.mochi", files["/app.mochi"], read, { cache, plugins: [] });
  const afterFirst = cache.entries.size;
  await moduleDiagnostics("/app.mochi", files["/app.mochi"], read, { cache, plugins: [] });
  expect(cache.entries.size).toBe(afterFirst * 2);
});

test("an entry seen earlier as a dependency reuses that inference", async () => {
  const files = {
    "/lib.mochi": "export let one = 1\n",
    "/app.mochi": 'import { one } from "/lib.mochi"\nexport let sum = one + 1\n',
  };
  const cache = createModuleCache();
  // Diagnosing the importer infers `/lib.mochi` as a dependency...
  expect(await diagnose(files, "/app.mochi", cache)).toEqual([]);
  const beforeEntries = cache.entries.size;
  // ...so asking about `/lib.mochi` itself must not infer it a second time.
  expect(await diagnose(files, "/lib.mochi", cache)).toEqual(await diagnose(files, "/lib.mochi"));
  expect(cache.entries.size).toBe(beforeEntries);
});

test("a reused entry still reports the diagnostics it had as a dependency", async () => {
  const files = {
    "/lib.mochi": 'export let bad = 1 + "nope"\n',
    "/app.mochi": 'import { bad } from "/lib.mochi"\nexport let use = bad\n',
  };
  const cache = createModuleCache();
  await diagnose(files, "/app.mochi", cache);
  const reused = await diagnose(files, "/lib.mochi", cache);
  expect(reused.map((d) => d.message)).toEqual(
    (await diagnose(files, "/lib.mochi")).map((d) => d.message),
  );
  expect(reused.length).toBeGreaterThan(0);
});

test('a "use open" entry does not reuse its lenient dependency inference', async () => {
  // As a dependency this file infers OPEN, so `hostGlobal` is allowed. As an
  // entry the editor infers it STRICT, so the same bytes must still be flagged.
  const files = {
    "/open.mochi": '"use open"\nexport let value = hostGlobal + 1\n',
    "/app.mochi": 'import { value } from "/open.mochi"\nexport let use = value\n',
  };
  const cache = createModuleCache();
  expect(await diagnose(files, "/app.mochi", cache)).toEqual([]);
  const asEntry = await diagnose(files, "/open.mochi", cache);
  expect(asEntry.map((d) => d.message)).toEqual(
    (await diagnose(files, "/open.mochi")).map((d) => d.message),
  );
  expect(asEntry.some((d) => d.message.includes("hostGlobal"))).toBe(true);
});
