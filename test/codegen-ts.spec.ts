// TypeScript backend (ADR 0026) — typed `.ts` emission.
import { expect, test } from "bun:test";
import { unwrapOk } from "@onrails/result";
import { codegenTs } from "../src/codegen-ts";

const ts = (src: string): string => unwrapOk(codegenTs(src)).trim();

test("a function binding is annotated with its inferred type", () => {
  // The value-position param is also typed now (ADR 0028) — a concrete param is
  // no longer left bare, so the `_curry`/arrow arg to tsc isn't implicit-any.
  expect(ts("let inc = x => add(x, 1)")).toContain(
    "const inc: (x: number) => number = (x: number) =>",
  );
});

test("an inner lambda's concrete params are annotated (ADR 0028)", () => {
  // `y` inside the map callback would infer `any` under strict tsc; annotate it.
  const out = ts("let mapInc = xs => xs |> map(y => add(y, 1))");
  expect(out).toContain("(y: number) => add(y, 1)");
});

test("a generic binding's value lambda scopes the letters so its params can name them (ADR 0032)", () => {
  // The binding head declares `<A, B>`; ADR 0032 re-declares the SAME letters on
  // the value lambda, so its (fully annotated) params name them instead of being
  // erased to `any`/`unknown` by `_curry`. This closes ADR 0028's polymorphic tail.
  const out = ts("let apply = (f, x) => f(x)");
  expect(out).toContain("const apply: <A, B>(f: (a: A) => B, x: A) => B =");
  expect(out).toContain("_curry(2, <A, B>(f: (a: A) => B, x: A) => f(x))");
});

test("let? flattens to the all-at-once flatMap grouping so tsc infers the bind param (ADR 0032)", () => {
  // Curried `_Result_flatMap(f)(v)` leaves `f`'s param unconstrained across the
  // two calls (`unknown`); the flat `_Result_flatMap(f, v)` infers it from `v`.
  const out = ts(
    "type Result a e = | Ok(a) | Err(e)\nlet chain = r => let? v = r in Ok(add(v, 1))",
  );
  expect(out).toContain("_Result_flatMap((v) => Ok(add(v, 1)), r)");
});

test("a multi-param function annotates uncurried, matching the emitted value", () => {
  const out = ts("let sum = (a, b) => add(a, b)");
  expect(out).toContain("const sum: (a: number, b: number) => number = _curry(2,");
});

test("a non-function binding is left for TS to infer (no annotation)", () => {
  expect(ts("let answer = 42")).toBe("const answer = 42;");
});

test("a concrete empty collection literal is annotated with its element types (ADR 0035)", () => {
  // A monomorphic empty map otherwise infers `Map<unknown, unknown>`; the resolved
  // key/value types let it flow where a concrete map is expected.
  const out = ts("let seed = () => Map.set(1, 2, #{})");
  expect(out).toContain("new Map<number, number>()");
});

test("a let-generalized empty seed is pinned via the IIFE param (ADR 0035)", () => {
  // `let m = #{} in …` generalizes `m`, so the seed stays polymorphic; the empty
  // map can't be annotated in place. Annotating the IIFE param instead flows the
  // monomorphic use type in contextually, typing `new Map([])` as `Map<K, V>`.
  const out = ts("let run = () => let m = #{} in Map.set(1, 2, m)");
  expect(out).toContain("((m: Map<number, number>) =>");
});

test("a top-level polymorphic-but-single-use seed gets a const annotation (ADR 0035)", () => {
  const out = ts("let seed = #{}\nlet use = () => Map.set(1, 2, seed)");
  expect(out).toContain("const seed: Map<number, number> = new Map([]);");
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
    "const fmap: <A, B, C>(f: (a: A) => B) => (r: Result<A, C>) => Result<B, C> =",
  );
});

test("an open-row record param emits the row var as a generic (ADR 0034)", () => {
  // Field access infers `{ x: A | r } -> A`; the open tail `r` must survive as a
  // scoped generic `& B`, not be dropped to a closed `{ x: A }` that rejects any
  // record carrying extra fields.
  expect(ts("let getX = r => r.x")).toContain("const getX: <A, B>(r: ({ x: A } & B)) => A =");
});

test("a spread that threads open-row state round-trips through `& R` (ADR 0034)", () => {
  // The `freshVar`-shape: `st => { ...st, n: … }` infers `{ n: Int | r } -> { n:
  // Int | r }`. Emitting the param AND return as `{ n: number } & A` lets the
  // full state bind `A` and the returned record flow back into it — the whole
  // TS2345 "partial record vs full state" class the bootstrap tripped on.
  const out = ts("let bump = st => { ...st, n: add(st.n, 1) }");
  expect(out).toContain("const bump: <A>(st: ({ n: number } & A)) => ({ n: number } & A) =");
});

test("exported bindings keep the export keyword and gain the annotation", () => {
  expect(ts("export let inc = x => add(x, 1)")).toContain(
    "export const inc: (x: number) => number =",
  );
});
