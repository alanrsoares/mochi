// Record update `{ ...base, f: v }` — a functional (immutable) update. The base
// must already carry each listed field at a unifiable type; the result has the
// base's type (fields replaced in-kind, never added). Update-only, one leading
// spread. See ADR 0021.

import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { format } from "@mochi/dx/format";
import { compileAndEval } from "@mochi/test-support";
import { isErr, unwrapOk } from "@onrails/result";

const run = (src: string): unknown => compileAndEval(src, "r");

// --- runtime + codegen ------------------------------------------------------

test("update replaces one field, keeps the rest", () => {
  const src = 'let base = { x: 1, y: "hi" }\nlet r = { ...base, x: 42 }';
  expect(run(src)).toEqual({ x: 42, y: "hi" });
});

test("update emits a native JS object spread", () => {
  const js = unwrapOk(compile("let base = { x: 1, y: 2 }\nlet r = { ...base, x: 9 }"));
  expect(js).toContain("...base");
});

test("multiple fields update at once", () => {
  const src = "let base = { x: 1, y: 2, z: 3 }\nlet r = { ...base, x: 10, z: 30 }";
  expect(run(src)).toEqual({ x: 10, y: 2, z: 30 });
});

test("bare spread with no updates copies the record", () => {
  const src = "let base = { x: 1, y: 2 }\nlet r = { ...base }";
  expect(run(src)).toEqual({ x: 1, y: 2 });
});

test("record shorthand reads the matching local binding", () => {
  const src = "let x = 42\nlet r = { x }";
  expect(run(src)).toEqual({ x: 42 });
  expect(unwrapOk(compile(src))).toContain("{ x: x }");
});

// --- typing (update-only) ---------------------------------------------------

test("updating a field with a wrong-typed value is a type error", () => {
  expect(isErr(compile('let base = { x: 1, y: "hi" }\nlet r = { ...base, x: "no" }'))).toBe(true);
});

test("adding a field absent from a closed base is a type error", () => {
  expect(isErr(compile("let base = { x: 1 }\nlet r = { ...base, z: 2 }"))).toBe(true);
});

test("open base (lambda param) duck-types the required field", () => {
  // `bump` requires its arg to have `x : number`; result has the same row.
  const src = "let bump = r => { ...r, x: add(r.x, 1) }\nlet r = bump({ x: 5, tag: 7 })";
  expect(run(src)).toEqual({ x: 6, tag: 7 });
});

// --- formatter --------------------------------------------------------------

test("formatter round-trips a record update", () => {
  const src = "let r = { ...base, x: 1 }\n";
  const once = unwrapOk(format(src));
  expect(once).toContain("{ ...base, x: 1 }");
  expect(unwrapOk(format(once))).toBe(once);
});

test("formatter expands record shorthand to its canonical field form", () => {
  expect(unwrapOk(format("let x=1\nlet r={x}\n"))).toBe("let x = 1\nlet r = { x: x }\n");
});
