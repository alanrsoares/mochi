import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { format } from "@mochi/dx/format";
import { compileJs } from "@mochi/test-support";
import { match } from "@onrails/pattern";
import { isErr, unwrapOk } from "@onrails/result";

const run = (src: string): unknown => {
  const js = compileJs(src, { stripImports: true, runtime: true });
  return new Function("match", `${js}\nreturn result;`)(match);
};

test("fast pipe inserts its value as the first call argument", () => {
  expect(run("let result = 40 -> add(2)")).toBe(42);
  expect(unwrapOk(compile("let result = 40 -> add(2)"))).toContain("add(40, 2)");
});

test("fast pipe chains left-to-right", () => {
  expect(run("let result = 5 -> add(3) -> mul(2)")).toBe(16);
});

test("fast pipe keeps type arrows available in annotations", () => {
  expect(
    isErr(
      compile("let apply : (number -> number) -> number = f => f(2)\nlet result = 40 -> add(2)"),
    ),
  ).toBe(false);
});

test("fast pipe requires a call on its right", () => {
  expect(isErr(compile("let result = 1 -> add"))).toBe(true);
});

test("formatter keeps fast pipe snug", () => {
  expect(unwrapOk(format("let result=40 -> foo(2)"))).toBe("let result = 40->foo(2)\n");
});

test("fast pipe binds tighter than ++ (ADR 0073)", () => {
  expect(
    run('let gen = (c, n) => c.x\nlet ctx = { x: "!" }\nlet result = "hi" ++ ctx->gen(1)'),
  ).toBe("hi!");
  expect(
    unwrapOk(compile('let foo = (c, n) => "z"\nlet x = 1\nlet result = "a" ++ x->foo(1)')),
  ).toContain("foo(x, 1)");
  expect(unwrapOk(format('let s = "hi" ++ ctx->gen(1)'))).toBe('let s = "hi" ++ ctx->gen(1)\n');
  expect(unwrapOk(format('let s = ("hi" ++ ctx)->gen(1)'))).toBe('let s = ("hi" ++ ctx)->gen(1)\n');
});
