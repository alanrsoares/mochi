// The prelude: builtin signatures the inferencer starts with, plus the JS
// runtime that backs them. Kept tiny for now — arithmetic and comparison.
import { type Type, tArrow, tBool, tNumber } from "./types";

const bin = (a: Type, b: Type, r: Type): Type => tArrow(a, tArrow(b, r));
const num2 = bin(tNumber, tNumber, tNumber); // number -> number -> number
const cmp = bin(tNumber, tNumber, tBool); // number -> number -> bool

// name → type scheme (all monomorphic for now)
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
};

// The whole runtime as one blob — for tests / tooling that want every builtin in
// scope regardless of what a snippet references.
export const preludeJs = Object.values(preludeJsDefs).join("\n");
