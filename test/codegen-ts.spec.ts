// TypeScript backend (ADR 0026) — typed `.ts` emission.
import { expect, test } from "bun:test";
import { unwrapOk } from "@onrails/result";
import { codegenTs } from "../src/codegen-ts";

const ts = (src: string): string => unwrapOk(codegenTs(src)).trim();

test("a function binding is annotated with its inferred type", () => {
  expect(ts("let inc = x => add(x, 1)")).toContain("const inc: (x: number) => number = (x) =>");
});

test("a multi-param function annotates uncurried, matching the emitted value", () => {
  const out = ts("let sum = (a, b) => add(a, b)");
  expect(out).toContain("const sum: (a: number, b: number) => number = _curry(2,");
});

test("a non-function binding is left for TS to infer (no annotation)", () => {
  expect(ts("let answer = 42")).toBe("const answer = 42;");
});

test("a variant decl emits an export type union alongside its typed ctor factories", () => {
  const out = ts("type Color = | Red | Green");
  expect(out).toContain('export type Color =\n  | { _tag: "Red" }\n  | { _tag: "Green" };');
  // Nullary ctors are annotated so `_tag` stays a literal, not widened to string.
  expect(out).toContain('const Red: Color = { _tag: "Red" };');
});

test("a payload ctor factory is typed: params from fields, return the variant", () => {
  const out = ts("type Shape = | Circle(float) | Rect(float, float)");
  expect(out).toContain('const Circle = (_0: number): Shape => ({ _tag: "Circle", _0 });');
  expect(out).toContain(
    'const Rect = _curry(2, (_0, _1) => ({ _tag: "Rect", _0, _1 })) as (_0: number, _1: number) => Shape;',
  );
});

test("runtime builtins are imported from the typed runtime, not inlined", () => {
  const out = ts("let inc = x => add(x, 1)");
  expect(out).toContain('import { _curry, add } from "@alang/runtime";');
  expect(out).not.toContain("const add = _curry"); // no inlined preamble
});

test("a polymorphic function keeps its generics in the annotation", () => {
  const src =
    "type Result a e = | Ok(a) | Err(e)\nlet fmap = f => r => switch r { | Ok(v) => Ok(f(v)) | Err(e) => Err(e) }";
  const out = ts(src);
  expect(out).toContain(
    "const fmap: <A, B, C>(f: (x: A) => B) => (r: Result<A, C>) => Result<B, C> =",
  );
});

test("exported bindings keep the export keyword and gain the annotation", () => {
  expect(ts("export let inc = x => add(x, 1)")).toContain(
    "export const inc: (x: number) => number =",
  );
});
