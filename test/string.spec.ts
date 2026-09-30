// String literals.
import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler";
import { compileJs, typeOf } from "@mochi/test-support";
import { isErr, unwrapErr } from "@onrails/result";

const js = (src: string) => compileJs(src, { runtime: true });

test("a string literal compiles to a JS string", () => {
  expect(js(`let m = "hello"`)).toBe(`const m = "hello";\n`);
});

test("a string literal has type string", () => {
  expect(typeOf(`let m = "hi"`, "m")).toBe("string");
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
