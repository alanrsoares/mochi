// Ticket 0013 (part b) — bootstrap/module.mochi's compileGraph / buildModules.
// Having loaded the graph (part a) and added the four cross-module seams, we
// now compile a real multi-module program end to end and DIFFERENTIAL-check it
// against the TS driver (src/module.ts): same module order, byte-identical JS
// per module. Then we assert the cross-module gates actually fire — a
// non-exhaustive switch over an IMPORTED variant, and a missing export.

import { beforeAll, expect, test } from "bun:test";
import { mkdtempSync, writeFileSync } from "node:fs";
import { readFile as fsRead } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { buildModulesTs, buildModules as tsBuild } from "@mochi/compiler/module";
import { repoRoot } from "@mochi/test-support";
import { ensureInTreeBootstrapBuild } from "@mochi/test-support/bootstrap";

const root = repoRoot(import.meta.url);

type Out = { path: string; js: string };
type MErr = { message: string; start: number; end: number };
type Res = { _tag: "Ok"; value: Out[] } | { _tag: "Err"; error: MErr };

let buildModules: (entry: string) => Res;

const bases = (outs: Out[]): string[] => outs.map((o) => basename(o.path));

beforeAll(async () => {
  // Shared cache → bootstrap/module.js (+ deps). Import the shipped driver.
  ensureInTreeBootstrapBuild();
  ({ buildModules } = await import(join(root, "bootstrap/module.js")));
});

test("compiles examples/modules end to end", () => {
  const r = buildModules(join(root, "examples/modules/main.mochi"));
  expect(r._tag).toBe("Ok");
  if (r._tag !== "Ok") return;
  // geometry before main — dependency order.
  expect(bases(r.value)).toEqual(["geometry.mochi", "main.mochi"]);
  for (const o of r.value) expect(o.js.length).toBeGreaterThan(0);
});

test("matches the TS buildModules driver byte for byte", async () => {
  const ts = await tsBuild(join(root, "examples/modules/main.mochi"), (p) => fsRead(p, "utf8"));
  expect(ts._tag).toBe("Ok");
  const boot = buildModules(join(root, "examples/modules/main.mochi"));
  expect(boot._tag).toBe("Ok");
  if (ts._tag !== "Ok" || boot._tag !== "Ok") return;

  const tsBy = new Map(ts.value.map((o) => [basename(o.path), o.js]));
  const bootBy = new Map(boot.value.map((o) => [basename(o.path), o.js]));
  expect([...bootBy.keys()].sort()).toEqual([...tsBy.keys()].sort());
  for (const [name, tsJs] of tsBy) expect(bootBy.get(name)).toBe(tsJs);
});

test("cross-module exhaustiveness fires: dropping an imported ctor arm fails", () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-mod-"));
  writeFileSync(
    join(dir, "shapes.mochi"),
    "export type Shape = Circle(r: number) | Square(s: number)\n",
  );
  // Missing the Square arm — only catchable with shapes' registry imported.
  writeFileSync(
    join(dir, "app.mochi"),
    'import { Circle, Square } from "./shapes"\nlet f = s => switch s { | Circle(r) => r }\n',
  );
  const r = buildModules(join(dir, "app.mochi"));
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") expect(r.error.message).toContain("non-exhaustive");
});

test("reports a missing export against the import site", () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-mod-"));
  writeFileSync(join(dir, "lib.mochi"), "export let a = 1\n");
  writeFileSync(join(dir, "use.mochi"), 'import { a, nope } from "./lib"\nlet x = a\n');
  const r = buildModules(join(dir, "use.mochi"));
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") {
    expect(r.error.message).toContain("has no export 'nope'");
    expect(r.error.end).toBeGreaterThan(r.error.start); // pinned to the name span
  }
});

test("a named import does not leak sibling constructors (ADR 0082)", () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-mod-"));
  writeFileSync(
    join(dir, "shapes.mochi"),
    "export type Shape =\n  | Circle(r: number)\n  | Square(s: number)\nexport let origin = 0\n",
  );
  writeFileSync(
    join(dir, "app.mochi"),
    'import { origin } from "./shapes"\nlet f = s => switch s { | Circle(r) => r }\n',
  );
  const r = buildModules(join(dir, "app.mochi"));
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") expect(r.error.message).toContain("unknown constructor 'Circle'");
});

test("same-name ctors from two deps collide at the second import (ADR 0082)", () => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-mod-"));
  writeFileSync(join(dir, "a.mochi"), "export type A = | Empty\n");
  writeFileSync(join(dir, "b.mochi"), "export type B = | Empty\n");
  writeFileSync(
    join(dir, "app.mochi"),
    'import { Empty } from "./a"\nimport { Empty } from "./b"\nlet x = Empty\n',
  );
  const r = buildModules(join(dir, "app.mochi"));
  expect(r._tag).toBe("Err");
  if (r._tag === "Err") expect(r.error.message).toContain("duplicate constructor 'Empty'");
});

// A record alias reached through `import * as` whose field names a SIBLING
// alias bare. The dep wrote `SpanAt` in its own scope; the importer has no such
// name, so the reference has to resolve where it was WRITTEN. src/schemes.ts
// expands in the declaring module's `TypeScope`; the mirror seeds the dep's
// aliases under `"D.Name"` keys and qualifies their own references at seed time
// (`qualifyTe`). Before that, the field lowered nominally and then refused to
// unify with the row it stands for.
const NESTED_ALIAS = {
  "state.mochi": [
    "export type SpanAt = { start: number, end: number }",
    "export type St = { at: SpanAt, n: number }",
    "export let mk : number -> St = n => { at: { start: 0, end: n }, n: n }",
    "",
  ].join("\n"),
  "app.mochi": [
    'import * as S from "./state"',
    'import { mk } from "./state"',
    "let width = (s : S.St) => s.at.end - s.at.start",
    "export let go = () => width(mk(3))",
    "",
  ].join("\n"),
};

// Two modules declaring a STRUCTURALLY IDENTICAL record alias under different
// names. The ADR 0092 alias index is keyed by shape, so emitting `Info`'s body
// used to fold it to the other module's `Pair` and vice versa — a mutually
// circular `type Info = Pair;` / `type Pair = Info;` that tsc rejects (TS2456).
// A decl now drops every SAME-SHAPED alias, not just its own name.
const TWIN_ALIAS = {
  "a.mochi": [
    "export type Pair = { lo: number, hi: number }",
    "export let mkPair : number -> Pair = n => { lo: 0, hi: n }",
    "",
  ].join("\n"),
  "b.mochi": [
    'import { mkPair } from "./a"',
    "export type Info = { lo: number, hi: number }",
    "export let widen : Info -> Info = i => { lo: i.lo - 1, hi: i.hi + 1 }",
    "export let go = () => widen(mkPair(3))",
    "",
  ].join("\n"),
};

const writeFixture = (files: Record<string, string>): string => {
  const dir = mkdtempSync(join(tmpdir(), "mochi-mod-"));
  for (const [name, src] of Object.entries(files)) writeFileSync(join(dir, name), src);
  return dir;
};

test("a nested alias resolves in the DECLARING module, not the importer", () => {
  const r = buildModules(join(writeFixture(NESTED_ALIAS), "app.mochi"));
  expect(r._tag).toBe("Ok");
  if (r._tag === "Err") throw new Error(r.error.message);
});

test("the TS driver agrees on the nested alias", async () => {
  const dir = writeFixture(NESTED_ALIAS);
  const ts = await tsBuild(join(dir, "app.mochi"), (p) => fsRead(p, "utf8"));
  expect(ts._tag).toBe("Ok");
  const boot = buildModules(join(dir, "app.mochi"));
  expect(boot._tag).toBe("Ok");
  if (ts._tag !== "Ok" || boot._tag !== "Ok") return;
  const tsBy = new Map(ts.value.map((o) => [basename(o.path), o.js]));
  for (const o of boot.value) {
    const want = tsBy.get(basename(o.path));
    expect(want).toBeDefined();
    expect(o.js).toBe(want as string);
  }
});

test("same-shaped aliases in different modules do not fold into a cycle", async () => {
  const dir = writeFixture(TWIN_ALIAS);
  const ts = await buildModulesTs(join(dir, "b.mochi"), (p) => fsRead(p, "utf8"));
  expect(ts._tag).toBe("Ok");
  if (ts._tag !== "Ok") return;
  const byName = new Map(ts.value.map((o) => [basename(o.path), o.js]));
  expect(byName.get("a.mochi") ?? byName.get("a.ts") ?? "").toContain(
    "export type Pair = { lo: number; hi: number };",
  );
  expect(byName.get("b.mochi") ?? byName.get("b.ts") ?? "").toContain(
    "export type Info = { lo: number; hi: number };",
  );
});
