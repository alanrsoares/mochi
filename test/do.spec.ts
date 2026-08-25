import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { format } from "@mochi/dx/format";
import { compileAndEval } from "@mochi/test-support";
import { isErr, unwrapOk } from "@onrails/result";

test("do evaluates expressions in order and returns the final value", () => {
  const seen: number[] = [];
  const src = "let run = log => do { log(1); log(2); 42 }";
  const run = compileAndEval(src, "run") as (log: (n: number) => void) => number;
  expect(run((n) => seen.push(n))).toBe(42);
  expect(seen).toEqual([1, 2]);
});

test("do keeps a final recur in the loop tail", () => {
  const src = "let result = loop (i = 0) { i == 2 ? i : do { ignore(i); recur(i + 1) } }";
  expect(compileAndEval(src, "result")).toBe(2);
});

test("do requires at least one final expression and no trailing separator", () => {
  expect(isErr(compile("let result = do {}"))).toBe(true);
  expect(isErr(compile("let result = do { 1; }"))).toBe(true);
});

test("formatter expands do and canonicalizes discarded let chains", () => {
  expect(unwrapOk(format("let result=do {f(1);g(2);3}"))).toBe(
    "let result = do {\n  f(1);\n  g(2);\n  3\n}\n",
  );
  expect(unwrapOk(format("let result = let _ = f(1) in let _ = g(2) in 3"))).toBe(
    "let result = do {\n  f(1);\n  g(2);\n  3\n}\n",
  );
});
