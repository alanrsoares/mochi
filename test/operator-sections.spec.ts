// Haskell-style operator sections: `(x op)` (left, missing right operand) and
// `(op x)` (right, missing left operand) desugar to a one-param lambda calling
// the same prelude builtin every infix operator already lowers to (see
// `sectionLeft`/`tryParseRightSection` in `parser.ts`) — no new AST node.
import { expect, test } from "bun:test";
import { unwrapOk } from "@onrails/result";
import { codegenTs } from "../src/codegen-ts";
import { compile } from "../src/compile";

const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src)).replace(/^import .*$/m, "");
  return new Function(`${js}\nreturn ${ret};`)();
};

test("a left section fixes the left operand", () => {
  expect(run("let double = (2 *)\nlet a = double(21)", "a")).toBe(42);
  expect(run('let greet = ("Hello, " ++)\nlet a = greet("world")', "a")).toBe("Hello, world");
  expect(run("let over10 = (10 <)\nlet a = over10(20)", "a")).toBe(true);
});

test("a right section fixes the right operand", () => {
  expect(run("let addFive = (+ 5)\nlet a = addFive(10)", "a")).toBe(15);
  expect(run("let half = (/ 2)\nlet a = half(10)", "a")).toBe(5);
  expect(run("let isPositive = (> 0)\nlet a = isPositive(-3)", "a")).toBe(false);
});

test("left and right sections of a non-commutative op differ", () => {
  expect(run("let a = (2 /)(10)", "a")).toBe(0.2); // 2 / 10
  expect(run("let a = (/ 2)(10)", "a")).toBe(5); // 10 / 2
});

test("`!=` sections desugar to the same not/eq composition as the infix form", () => {
  expect(run("let notZero = (!= 0)\nlet a = notZero(0)", "a")).toBe(false);
  expect(run("let notZero = (!= 0)\nlet a = notZero(1)", "a")).toBe(true);
});

test("`(- x)` stays unary negation, not a right section", () => {
  expect(run("let a = (- 2)", "a")).toBe(-2);
});

test("`(x -)` is still a valid left section", () => {
  expect(run("let sub5 = (5 -)\nlet a = sub5(2)", "a")).toBe(3); // 5 - 2
});

test("a section is a first-class function usable as a call argument", () => {
  const src = "let apply = (f, x) => f(x)\nlet a = apply((2 *), 21)";
  expect(run(src, "a")).toBe(42);
});

test("a right section's operand parses at full expression precedence", () => {
  // (+ 2 * 3) = \s -> s + (2 * 3), not (s + 2) * 3
  expect(run("let a = (+ 2 * 3)(1)", "a")).toBe(7);
});

test("sections emit clean strict TypeScript", () => {
  const out = unwrapOk(codegenTs("let double = (2 *)")).trim();
  expect(out).toContain("($s: number) => number");
});
