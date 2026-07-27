// String literals.
import { expect, test } from "bun:test";
import { check } from "@mochi/compiler/check";
import { compile } from "@mochi/compiler/compile";
import { inferProgram, showScheme } from "@mochi/compiler/infer";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { preludeEnv } from "@mochi/compiler/prelude";
import { compileJs } from "@mochi/test-support";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";

const js = (src: string) => compileJs(src, { runtime: true });

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  return showScheme(unwrapOk(inferProgram(prog, preludeEnv, { open: true })).get(name)!);
};

test("a string literal compiles to a JS string", () => {
  expect(js(`let m = "hello"`)).toBe(`const m = "hello";\n`);
});

test("a string literal has type string", () => {
  expect(schemeOf(`let m = "hi"`, "m")).toBe("string");
});

test("escapes are decoded then safely re-encoded", () => {
  expect(js(`let m = "a\\nb"`)).toBe(`const m = "a\\nb";\n`);
});

test("an unterminated string is a lex error", () => {
  const r = compile(`let m = "oops`);
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.kind).toBe("lex");
  expect(unwrapErr(r)[0]!.message).toBe("unterminated string literal");
});

test("strings mismatch numbers under inference", () => {
  // add : number -> number -> number
  expect(isErr(compile(`let bad = add("x", 1)`))).toBe(true);
});
