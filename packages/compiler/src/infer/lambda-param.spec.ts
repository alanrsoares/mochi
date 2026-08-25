// Record-destructuring lambda parameters: `({ x, y }) => ...`.
import { expect, test } from "bun:test";
import { check } from "@mochi/compiler/check";
import { compile } from "@mochi/compiler/compile";
import { inferProgram, showScheme } from "@mochi/compiler/infer";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { preludeEnv, preludeJsDefs } from "@mochi/compiler/prelude";
import { compileJs } from "@mochi/test-support";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  return showScheme(unwrapOk(inferProgram(prog, preludeEnv, { open: true })).get(name)!);
};

const run = (src: string, ret: string): unknown => {
  const js = compileJs(src, { stripImports: true });
  // `_curry` from the real prelude — arity-≥2 lambdas now lower to `_curry(...)`.
  const prelude = `${preludeJsDefs._curry}\nconst hypot=(a,b)=>Math.hypot(a,b);const add=(a,b)=>a+b;`;
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

test("a parameter annotation constrains the lambda argument", () => {
  expect(schemeOf("let double = (n: number) => add(n, n)", "double")).toBe("number -> number");
  expect(isErr(compile('let double = (n: number) => add(n, n)\nlet r = double("no")'))).toBe(true);
});
