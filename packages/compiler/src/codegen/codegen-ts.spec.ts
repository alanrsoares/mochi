// TypeScript backend (ADR 0026) — typed `.ts` emission.
import { expect, test } from "bun:test";
import { codegenTs } from "@mochi/compiler/codegen-ts";
import { unwrapOk } from "@onrails/result";

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
  expect(out).toContain("(y: number) => (y + 1)");
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
  // The value's head must be concrete at the bind site (ADR 0079).
  const out = ts("let chain = n => let? v = Ok(n) in Ok(add(v, 1))");
  expect(out).toContain("_Result_flatMap((v) => Ok((v + 1)), Ok(n))");
});

test("Option let? flattens to the all-at-once Option flatMap grouping (ADR 0079)", () => {
  const out = ts("let chain = n => let? v = Some(n) in Some(add(v, 1))");
  expect(out).toContain(
    "_Option_flatMap((v) => (Some((v + 1)) as Option<number>), (Some(n) as Option<number>))",
  );
});

test("a concrete multi-param function annotates with a curry-compatible type (ADR 0093)", () => {
  const out = ts("let sum = (a, b) => add(a, b)");
  expect(out).toContain("const sum: _Curry<[a: number, b: number], number> = _curry(2,");
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

test("a let-generalized empty seed is pinned via its emitted binding (ADR 0035)", () => {
  // `let m = #{} in …` generalizes `m`, so the seed stays polymorphic; the empty
  // map can't be annotated in place. Annotating the binding it lowers to instead
  // flows the monomorphic use type in contextually, typing `new Map([])` as
  // `Map<K, V>` — a `const` under a lambda, an IIFE param anywhere else.
  const out = ts("let run = () => let m = #{} in Map.set(1, 2, m)");
  expect(out).toContain("const m: Map<number, number> = new Map([]);");
});

test("a top-level polymorphic-but-single-use seed gets a const annotation (ADR 0035)", () => {
  const out = ts("let seed = #{}\nlet use = () => Map.set(1, 2, seed)");
  expect(out).toContain("const seed: Map<number, number> = new Map([]);");
});

test("an inner lambda param over the enclosing binding's letters names them (ADR 0042)", () => {
  // `firstUp`/`get` are generic; the `map`/`filter` callback param is the
  // enclosing element type. tsc infers it `unknown` through the nested
  // higher-order call, so annotate it with the binding's in-scope letters.
  const out = ts("let firstNames = xs => xs |> filter(a => a.ok) |> map(a => a.name)");
  expect(out).toContain("(a: ({ name: A; ok: boolean } & B)) => a.name");
});

test("an empty seed over the enclosing binding's letters names them (ADR 0042)", () => {
  // The `#{}` default's element type is a binding letter; bare it emits
  // `Map<unknown, unknown>`. Annotate it with the letters in lexical scope.
  const out = ts("let nested = (k1, k2, m) => Map.get(k2, Map.getOr(#{}, k1, m))");
  expect(out).toContain("new Map<B, C>()");
});

test("an applied ctor call is cast to its concrete type (ADR 0043)", () => {
  // `Ok(1)`/`Err("bad")` each leave one Result param free (the arg pins the
  // other); in an `@onrails/pattern` arm that widens to `unknown`. The binding's return
  // is concrete `Result<number, string>`, so both arms cast to it.
  const out = ts('let step = x => x ? Ok(1) : Err("bad")');
  expect(out).toContain("(Ok(1) as Result<number, string>)");
  expect(out).toContain('(Err("bad") as Result<number, string>)');
});

test("a ctor call with a free type param stays bare (ADR 0043)", () => {
  // `id`'s result Result is generic (`Result<A, B>`), so annotating would render
  // `unknown` — no better than tsc's own inference. Leave it uncast.
  const out = ts("let wrap = x => Ok(x)");
  expect(out).not.toContain(" as Result");
});

test("a variant decl emits an export type union alongside its typed ctor factories", () => {
  const out = ts("type Color = | Red | Green\nlet r = Red");
  expect(out).toContain('export type Color =\n  | { _tag: "Red" }\n  | { _tag: "Green" };');
  // Nullary ctors are annotated so `_tag` stays a literal, not widened to string.
  expect(out).toContain('const Red: Color = { _tag: "Red" };');
  expect(out).not.toContain("const Green:");
});

test("a payload ctor factory is typed: params from fields, return the variant", () => {
  const out = ts("type Shape = | Circle(float) | Rect(float, float)\nlet c = Circle\nlet r = Rect");
  expect(out).toContain('const Circle = (_0: number): Shape => ({ _tag: "Circle", _0 });');
  expect(out).toContain(
    'const Rect = _curry(2, (_0, _1) => ({ _tag: "Rect", _0, _1 })) as (_0: number, _1: number) => Shape;',
  );
});

test("pattern-only local ctors omit factories but keep the union", () => {
  const out = ts(
    "type Color = | Red | Green\nlet name = c => switch c { | Red => 0 | Green => 1 }",
  );
  expect(out).toContain('export type Color =\n  | { _tag: "Red" }\n  | { _tag: "Green" };');
  expect(out).not.toContain("const Red");
  expect(out).not.toContain("const Green");
});

test("runtime builtins are imported from the typed runtime, not inlined", () => {
  const out = ts("let inc = x => add(x, 1)");
  expect(out).toContain('import { _curry } from "@mochi/runtime";');
  expect(out).not.toContain("const add = _curry"); // no inlined preamble
});

test("runtime-equivalent numeric calls re-fold to TS operators", () => {
  const out = ts("let compare = (a, b) => gte(add(a, 1), b)");
  expect(out).toContain("((a + 1) >= b)");
  expect(out).not.toContain("add(");
  expect(out).not.toContain("gte(");
});

test("structural equality remains a runtime call", () => {
  const out = ts("let same = (a, b) => eq(a, b)");
  expect(out).toContain("eq(a, b)");
  expect(out).toContain('import { _curry, eq } from "@mochi/runtime";');
});

test("parser-originated JSX re-folds to TSX while handwritten h remains a call", () => {
  const jsx = ts('let el = <button disabled>{"go"}</button>');
  expect(jsx).toContain("/** @jsx h */");
  expect(jsx).toContain('<button disabled>{"go"}</button>');
  expect(ts('extern h : a = "./host" "h"\nlet el = h("button", {}, [])')).toContain(
    'h("button", {}, [])',
  );
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

test("docstrings on let bindings emit as JSDoc comments", () => {
  const src = "/// Increment by one.\nlet inc = x => add(x, 1)";
  expect(ts(src)).toContain("/**\n * Increment by one.\n */\nconst inc: (x: number) => number =");
});

test("multi-line docstrings on let bindings preserve paragraph breaks", () => {
  const src = "/// First line.\n///\n/// Second line.\nexport let inc = x => add(x, 1)";
  expect(ts(src)).toContain(
    "/**\n * First line.\n *\n * Second line.\n */\nexport const inc: (x: number) => number =",
  );
});

test("docstrings on type declarations emit as JSDoc comments in type header", () => {
  const src = "/// A 2D point.\ntype Point = { x: number, y: number }";
  expect(ts(src)).toContain(
    "/**\n * A 2D point.\n */\nexport type Point = { x: number; y: number };",
  );
});

test("docstrings on variant types emit as JSDoc comments", () => {
  const src = "/// Result type.\ntype Result a e = | Ok(a) | Err(e)";
  expect(ts(src)).toContain("/**\n * Result type.\n */\nexport type Result<A, B> =");
});

test("docstrings with comment terminators are safely escaped", () => {
  const src = "/// Contains */ terminator.\nlet safe = 42";
  expect(ts(src)).toContain("/**\n * Contains *\\/ terminator.\n */\nconst safe = 42;");
});

test("docstrings are omitted when docs: false is passed", () => {
  const src =
    "/// Increment by one.\nlet inc = x => add(x, 1)\n\n/// A point.\ntype Point = { x: number }";
  const out = unwrapOk(codegenTs(src, { docs: false }));
  expect(out).not.toContain("/**");
});
