// String literals.
import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { compile } from "../src/compile";
import { inferProgram, showScheme } from "../src/infer";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";
import { preludeEnv } from "../src/prelude";

const js = (src: string): string => unwrapOk(compile(src));

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
  expect(unwrapErr(r).kind).toBe("lex");
  expect(unwrapErr(r).message).toBe("unterminated string literal");
});

test("strings mismatch numbers under inference", () => {
  // add : number -> number -> number
  expect(isErr(compile(`let bad = add("x", 1)`))).toBe(true);
});
