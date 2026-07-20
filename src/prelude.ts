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
const list = (t: Type): Type => tCon("List", [t]); // [t]

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
  // --- List (ported from prelude-js) ---
  length: tArrow(list(a), tNumber), // [a] -> number
  map: tArrow(tArrow(a, b), tArrow(list(a), list(b))), // (a -> b) -> [a] -> [b]
  filter: tArrow(tArrow(a, tBool), tArrow(list(a), list(a))), // (a -> bool) -> [a] -> [a]
  reduce: tArrow(tArrow(b, tArrow(a, b)), tArrow(b, tArrow(list(a), b))), // (b -> a -> b) -> b -> [a] -> b
  // --- Func ---
  identity: tArrow(a, a), // a -> a
  always: tArrow(a, tArrow(b, a)), // a -> b -> a  (prelude-js `const`)
  compose: tArrow(tArrow(b, c), tArrow(tArrow(a, b), tArrow(a, c))), // (b -> c) -> (a -> b) -> a -> c
  // --- Str ---
  capitalize: tArrow(tString, tString),
};

// Matching JS definitions, keyed by name so codegen can inline just the ones a
// program actually references (and doesn't shadow) — a standalone module carries
// only the runtime it uses.
export const preludeJsDefs: Record<string, string> = {
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
};

// The whole runtime as one blob — for tests / tooling that want every builtin in
// scope regardless of what a snippet references.
export const preludeJs = Object.values(preludeJsDefs).join("\n");
