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

// Matching JS definitions, prepended when emitting a runnable module.
export const preludeJs = [
  "const add = (a, b) => a + b;",
  "const sub = (a, b) => a - b;",
  "const mul = (a, b) => a * b;",
  "const div = (a, b) => a / b;",
  "const square = (x) => x * x;",
  "const sqrt = (x) => Math.sqrt(x);",
  "const hypot = (a, b) => Math.hypot(a, b);",
  "const pi = Math.PI;",
  "const eq = (a, b) => a === b;",
  "const lt = (a, b) => a < b;",
  "const gt = (a, b) => a > b;",
].join("\n");
