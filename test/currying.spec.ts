// Currying coherence (CRITIQUE §4.4). mochi functions have curried types
// (`a -> b -> c`) but flat JS runtime impls. Every arity-≥2 definition — a
// prelude op, a user lambda (`(x, y) =>` or `x => y =>`), or a multi-field
// constructor — is wrapped in the over-application-safe `_curry`, so ALL call
// groupings agree: `f(a, b)`, `f(a)(b)`, partial `f(a)` passed first-class, and
// over-application. Before this, type-valid programs like `map(add(10))(xs)`
// compiled but crashed at runtime.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";

// Compile standalone (runtime inlined, the default) and evaluate a binding.
// `match` is injected for any snippet that lowers a catch-all to a match() chain.
const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function("match", `${js}\nreturn ${ret};`)(match);
};

// ---- prelude arithmetic (flat impl) ----------------------------------------

test("a flat prelude op takes native multi-arg calls", () => {
  expect(run("let a = add(2, 3)", "a")).toBe(5);
});

test("a flat prelude op takes curried application", () => {
  expect(run("let a = add(2)(3)", "a")).toBe(5);
});

test("a partially-applied prelude op is a first-class function", () => {
  // `map(add(10))` — the canonical case that used to crash: `add(10)` is NaN
  // under a flat 2-arg `add`, so the mapped fn was not callable.
  expect(run("let a = map(add(10))([1, 2, 3])", "a")).toEqual([11, 12, 13]);
});

// ---- curried HOFs ----------------------------------------------------------

test("a curried HOF still takes curried application", () => {
  expect(run("let a = toArray(take(2)(range(0)(9)))", "a")).toEqual([0, 1]);
});

test("a curried HOF also takes a native multi-arg call", () => {
  expect(run("let a = toArray(take(2, range(0, 9)))", "a")).toEqual([0, 1]);
});

// ---- user lambdas: both syntaxes, both call styles -------------------------

test("a multi-param lambda `(x, y) =>` accepts f(a, b) and f(a)(b)", () => {
  const g = "let g = (x, y) => add(x, y)\n";
  expect(run(`${g}let a = g(2, 3)`, "a")).toBe(5);
  expect(run(`${g}let a = g(2)(3)`, "a")).toBe(5);
});

test("a curried lambda `x => y =>` accepts f(a)(b) and f(a, b)", () => {
  const h = "let h = x => y => add(x, y)\n";
  expect(run(`${h}let a = h(2)(3)`, "a")).toBe(5);
  expect(run(`${h}let a = h(2, 3)`, "a")).toBe(5);
});

test("a partially-applied user lambda is first-class", () => {
  const src = "let addN = (x, y) => add(x, y)\nlet a = map(addN(100))([1, 2, 3])";
  expect(run(src, "a")).toEqual([101, 102, 103]);
});

test("a ternary lambda collapses to one arity-3 function", () => {
  const src = "let f = a => b => c => add(add(a, b), c)\n";
  expect(run(`${src}let r = f(1, 2, 3)`, "r")).toBe(6);
  expect(run(`${src}let r = f(1)(2)(3)`, "r")).toBe(6);
  expect(run(`${src}let r = f(1, 2)(3)`, "r")).toBe(6);
});

// ---- constructors ----------------------------------------------------------

test("a multi-field constructor accepts native and curried application", () => {
  const ty = "type Pair = | Pair(number, number)\n";
  const get = "let fst = p => switch p { | Pair(x, _) => x }\n";
  expect(run(`${ty}${get}let a = fst(Pair(7, 8))`, "a")).toBe(7);
  expect(run(`${ty}${get}let a = fst(Pair(7)(8))`, "a")).toBe(7);
});

test("a partially-applied constructor is first-class", () => {
  const ty = "type Pair = | Pair(number, number)\n";
  const src = `${ty}let sndOf = p => switch p { | Pair(_, y) => y }\nlet a = map(Pair(0))([1, 2])`;
  // a = [Pair(0, 1), Pair(0, 2)]; map sndOf over it → [1, 2].
  expect(run(`${src}\nlet b = map(sndOf)(a)`, "b")).toEqual([1, 2]);
});

// ---- emitted shape ---------------------------------------------------------

test("arity-1 functions are NOT wrapped (single arg always saturates)", () => {
  const out = unwrapOk(compile("let f = x => add(x, 1)", { runtime: false }));
  expect(out).toContain("const f = (x) => add(x, 1);");
  expect(out).not.toContain("_curry(1");
});
