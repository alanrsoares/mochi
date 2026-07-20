// The prelude utilities ported from prelude-js: List (map/filter/reduce/length),
// Func (identity/always/compose), Str (capitalize). Curried (data-last) so they
// compose with `|>`. Checks both the inferred types and the standalone runtime.
import { expect, test } from "bun:test";
import { unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv } from "../src/prelude";

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  const env = unwrapOk(inferProgram(prog, preludeEnv, { open: true }));
  return showScheme(env.get(name)!);
};

// Compile standalone (prelude inlined) and return the named binding's value.
const val = (src: string, name: string): unknown =>
  new Function(`${unwrapOk(compile(src))}\nreturn ${name};`)();

test("map has the expected polymorphic type", () => {
  expect(schemeOf("let f = map", "f")).toMatch(/^\('t\d+ -> 't\d+\) -> \['t\d+\] -> \['t\d+\]$/);
});

test("map applies a function over a list", () => {
  const src = "let double = x => mul(x, 2)\nlet ys = map(double)([1, 2, 3])";
  expect(val(src, "ys")).toEqual([2, 4, 6]);
});

test("map composes with the pipe operator", () => {
  const src = "let double = x => mul(x, 2)\nlet ys = [1, 2, 3] |> map(double)";
  expect(val(src, "ys")).toEqual([2, 4, 6]);
});

test("filter keeps elements matching a predicate", () => {
  const src = "let big = x => gt(x, 2)\nlet ys = [1, 2, 3, 4] |> filter(big)";
  expect(val(src, "ys")).toEqual([3, 4]);
});

test("reduce folds a list to a single value", () => {
  const src = "let sum = a => b => add(a, b)\nlet total = [1, 2, 3, 4] |> reduce(sum)(0)";
  expect(val(src, "total")).toBe(10);
});

test("length counts the elements", () => {
  expect(val("let n = [10, 20, 30] |> length", "n")).toBe(3);
});

test("compose chains two functions right-to-left", () => {
  const src =
    "let double = x => mul(x, 2)\nlet inc = x => add(x, 1)\nlet f = compose(double)(inc)\nlet r = f(10)";
  expect(val(src, "r")).toBe(22); // (10 + 1) * 2
});

test("always ignores its second argument", () => {
  expect(val("let r = always(7)(99)", "r")).toBe(7);
});

test("identity returns its argument", () => {
  expect(val("let r = identity(42)", "r")).toBe(42);
});

test("capitalize upper-cases the first character", () => {
  expect(val('let r = capitalize("prelude")', "r")).toBe("Prelude");
});

test("map/filter/reduce compose in one pipeline", () => {
  const src = [
    "let double = x => mul(x, 2)",
    "let big = x => gt(x, 4)",
    "let sum = a => b => add(a, b)",
    "let total = [1, 2, 3, 4] |> map(double) |> filter(big) |> reduce(sum)(0)",
  ].join("\n");
  // [1,2,3,4] -> [2,4,6,8] -> [6,8] -> 14
  expect(val(src, "total")).toBe(14);
});
