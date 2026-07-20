// The prelude: builtin signatures the inferencer starts with, plus the JS
// runtime that backs them. Kept tiny for now — arithmetic and comparison.
import { type Type, tArrow, tBool, tCon, tNumber, tString, tVar } from "./types";

const bin = (a: Type, b: Type, r: Type): Type => tArrow(a, tArrow(b, r));
const num2 = bin(tNumber, tNumber, tNumber); // number -> number -> number
const cmp = bin(tNumber, tNumber, tBool); // number -> number -> bool

// Polymorphic prelude type vars. Any ids < the inference fresh-supply start
// (1000) are safe: builtins are generalized, then instantiated fresh per use, so
// these ids never surface during a program's inference.
const a = tVar(0);
const b = tVar(1);
const c = tVar(2);
const arr = (t: Type): Type => tCon("Array", [t]); // [t] — eager JS array
const list = (t: Type): Type => tCon("List", [t]); // List t — lazy pull-sequence (@{...})

// name → type. Monomorphic entries (arithmetic) carry no vars; the collection /
// function utilities are polymorphic and generalize at bind time. Curried
// (data-last) so they compose with `|>`: `xs |> map(f) |> filter(p)`.
export const preludeEnv: Record<string, Type> = {
  add: num2,
  sub: num2,
  mul: num2,
  div: num2,
  square: tArrow(tNumber, tNumber),
  sqrt: tArrow(tNumber, tNumber),
  hypot: num2,
  pi: tNumber,
  eq: cmp,
  lt: cmp,
  gt: cmp,
  // --- Array ops (ported from prelude-js List; a lazy `List` is future work) ---
  length: tArrow(arr(a), tNumber), // [a] -> number
  map: tArrow(tArrow(a, b), tArrow(arr(a), arr(b))), // (a -> b) -> [a] -> [b]
  filter: tArrow(tArrow(a, tBool), tArrow(arr(a), arr(a))), // (a -> bool) -> [a] -> [a]
  reduce: tArrow(tArrow(b, tArrow(a, b)), tArrow(b, tArrow(arr(a), b))), // (b -> a -> b) -> b -> [a] -> b
  // --- Func ---
  identity: tArrow(a, a), // a -> a
  always: tArrow(a, tArrow(b, a)), // a -> b -> a  (prelude-js `const`)
  compose: tArrow(tArrow(b, c), tArrow(tArrow(a, b), tArrow(a, c))), // (b -> c) -> (a -> b) -> a -> c
  // --- Str ---
  capitalize: tArrow(tString, tString),
  // --- List (lazy sequence, `@{...}`) — generator-backed, supports infinite ---
  range: tArrow(tNumber, tArrow(tNumber, list(tNumber))), // number -> number -> List number
  iterate: tArrow(tArrow(a, a), tArrow(a, list(a))), // (a -> a) -> a -> List a  (infinite)
  repeat: tArrow(a, list(a)), // a -> List a  (infinite)
  take: tArrow(tNumber, tArrow(list(a), list(a))), // number -> List a -> List a
  takeWhile: tArrow(tArrow(a, tBool), tArrow(list(a), list(a))), // (a -> bool) -> List a -> List a
  drop: tArrow(tNumber, tArrow(list(a), list(a))), // number -> List a -> List a
  fromArray: tArrow(arr(a), list(a)), // [a] -> List a
  toArray: tArrow(list(a), arr(a)), // List a -> [a]  (materializes — infinite hangs)
};

// Matching JS definitions, keyed by name so codegen can inline just the ones a
// program actually references (and doesn't shadow) — a standalone module carries
// only the runtime it uses.
export const preludeJsDefs: Record<string, string> = {
  // List core: a List is an iterable factory `{ [Symbol.iterator]: () => Iterator }`.
  // Force-included by codegen whenever a `@{...}` literal or List producer is used.
  _list: "const _list = (g) => ({ [Symbol.iterator]: g });",
  add: "const add = (a, b) => a + b;",
  sub: "const sub = (a, b) => a - b;",
  mul: "const mul = (a, b) => a * b;",
  div: "const div = (a, b) => a / b;",
  square: "const square = (x) => x * x;",
  sqrt: "const sqrt = (x) => Math.sqrt(x);",
  hypot: "const hypot = (a, b) => Math.hypot(a, b);",
  pi: "const pi = Math.PI;",
  eq: "const eq = (a, b) => a === b;",
  lt: "const lt = (a, b) => a < b;",
  gt: "const gt = (a, b) => a > b;",
  // Curried (data-last) to compose with `|>`; each takes the collection last.
  length: "const length = (xs) => xs.length;",
  map: "const map = (f) => (xs) => xs.map((x) => f(x));",
  filter: "const filter = (f) => (xs) => xs.filter((x) => f(x));",
  reduce: "const reduce = (f) => (init) => (xs) => xs.reduce((acc, x) => f(acc)(x), init);",
  identity: "const identity = (x) => x;",
  always: "const always = (x) => (_y) => x;",
  compose: "const compose = (f) => (g) => (x) => f(g(x));",
  capitalize: "const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);",
  // --- List (lazy sequence) — generator-backed; producers/slicers stay lazy ---
  range:
    "const range = (lo) => (hi) => _list(function* () { for (let i = lo; i < hi; i++) yield i; });",
  iterate:
    "const iterate = (f) => (x) => _list(function* () { let v = x; for (;;) { yield v; v = f(v); } });",
  repeat: "const repeat = (x) => _list(function* () { for (;;) yield x; });",
  take: "const take = (n) => (xs) => _list(function* () { let i = 0; for (const x of xs) { if (i >= n) break; yield x; i++; } });",
  takeWhile:
    "const takeWhile = (p) => (xs) => _list(function* () { for (const x of xs) { if (!p(x)) break; yield x; } });",
  drop: "const drop = (n) => (xs) => _list(function* () { let i = 0; for (const x of xs) { if (i < n) { i++; continue; } yield x; } });",
  fromArray: "const fromArray = (xs) => _list(function* () { yield* xs; });",
  toArray: "const toArray = (xs) => [...xs];",
};

// The whole runtime as one blob — for tests / tooling that want every builtin in
// scope regardless of what a snippet references.
export const preludeJs = Object.values(preludeJsDefs).join("\n");
