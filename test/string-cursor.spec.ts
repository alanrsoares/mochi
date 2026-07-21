// Char-cursor string ops — the low-level primitives a hand-written scanner (the
// self-hosted lexer) needs: bounds-safe indexed access (Option), char↔code, and
// numeric parsing. Guards types (they compile) + runtime behavior.
import { expect, test } from "bun:test";
import { match } from "@onrails/pattern";
import { unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";

const run = (expr: string): unknown => {
  const js = unwrapOk(compile(`let r = ${expr}`)).replace(/^import .*$/gm, "");
  return new Function("match", `${js}\nreturn r;`)(match);
};
const Some = (value: unknown) => ({ _tag: "Some", value });
const None = { _tag: "None" };

test("Str.get is bounds-safe indexed char access", () => {
  expect(run('Str.get(0, "abc")')).toEqual(Some("a"));
  expect(run('Str.get(2, "abc")')).toEqual(Some("c"));
  expect(run('Str.get(9, "abc")')).toEqual(None);
  expect(run('Str.get(0, "")')).toEqual(None);
});

test("Str.codeAt returns the char code as an Option number", () => {
  expect(run('Str.codeAt(0, "A")')).toEqual(Some(65));
  expect(run('Str.codeAt(5, "A")')).toEqual(None);
});

test("Str.fromCode builds a one-char string from a code", () => {
  expect(run("Str.fromCode(65)")).toBe("A");
});

test("Str.chars splits into code points", () => {
  expect(run('Str.chars("abc")')).toEqual(["a", "b", "c"]);
  expect(run('Str.chars("")')).toEqual([]);
});

test("Str.toNumber parses, None on non-numeric", () => {
  expect(run('Str.toNumber("42")')).toEqual(Some(42));
  expect(run('Str.toNumber("3.5")')).toEqual(Some(3.5));
  expect(run('Str.toNumber("nope")')).toEqual(None);
});

test("codeAt round-trips through fromCode", () => {
  // Str.codeAt(0, "Z") is Option; unwrap via switch, feed back to fromCode.
  const src = 'switch Str.codeAt(0, "Z") { | Some(c) => Str.fromCode(c) | None => "?" }';
  expect(run(src)).toBe("Z");
});
