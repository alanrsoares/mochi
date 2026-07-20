// Record-destructuring lambda parameters: `({ x, y }) => ...`.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv } from "../src/prelude";

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  return showScheme(unwrapOk(inferProgram(prog, preludeEnv, { open: true })).get(name)!);
};

const run = (src: string, ret: string): unknown => {
  const js = unwrapOk(compile(src, { runtime: false })).replace(/^import .*$/m, "");
  const prelude = "const hypot=(a,b)=>Math.hypot(a,b);const add=(a,b)=>a+b;";
  return new Function("match", `${prelude}\n${js}\nreturn ${ret};`)(match);
};

test("a destructuring param lowers to native JS object destructuring", () => {
  expect(unwrapOk(compile("let f = ({x, y}) => add(x, y)"))).toContain("({ x, y }) => add(x, y)");
});

test("a destructuring param types as an open record (duck typing)", () => {
  // accepts any record with at least x and y
  expect(schemeOf("let g = ({x, y}) => add(x, y)", "g")).toMatch(/x: number/);
  expect(schemeOf("let g = ({x, y}) => add(x, y)", "g")).toMatch(/-> number$/);
});

test("extra fields on the argument are allowed", () => {
  const src = "let dist = ({x, y}) => hypot(x, y)\nlet d = dist({ x: 3, y: 4, label: 9 })";
  expect(isErr(compile(src))).toBe(false);
  expect(run(src, "d")).toBe(5);
});

test("destructuring and plain params mix in one lambda", () => {
  const src = "let f = ({a}, b) => add(a, b)\nlet r = f({ a: 10 }, 5)";
  expect(run(src, "r")).toBe(15);
});
