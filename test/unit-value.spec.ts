// The unit value `()`, its pattern, and `ignore` (ADR 0054). `unit` is an ordinary
// one-inhabitant type: `()` is writable as a value, as a type, and as a pattern.

import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { hoverAt } from "@mochi/dx/hover";
import { compileAndEval, compileJs } from "@mochi/test-support";
import { isErr, isOk } from "@onrails/result";

test("() is a value that emits and evaluates to undefined", () => {
  expect(compileJs("let x = ()")).toContain("undefined");
  expect(compileAndEval("let x = ()", "x")).toBeUndefined();
});

test("ignore discards a record result", () => {
  const src = "let f = _ => { a: 1 }\nlet r = ignore(f(0))";
  expect(isOk(compile(src, { runtime: true }))).toBe(true);
  expect(compileAndEval(src, "r")).toBeUndefined();
});

test("an ignore call hovers with () as its result", () => {
  const src = "let r = ignore(1)";
  expect(hoverAt(src, src.indexOf("ignore"))?.code).toBe("number -> ()");
});

test("unit is structurally comparable and showable", () => {
  const src = "let same = eq((), ())\nlet shown = show(())";
  expect(compileAndEval(src, "same", {})).toBe(true);
  expect(compileAndEval(src, "shown", {})).toBe("undefined");
});

test("unit is writable as a type name and () aliases the nullary call", () => {
  expect(isOk(compile("let f : () -> number = _ => 1\nlet a = f()\nlet b = f(())"))).toBe(true);
  expect(isOk(compile("let f : unit -> number = _ => 1\nlet a = f(())"))).toBe(true);
});

test("() is not callable", () => {
  expect(isErr(compile("let bad = ()()"))).toBe(true);
});

test("() matches as a pattern", () => {
  const src = "let f = u => switch u { | () => 1 }\nlet r = f(())";
  expect(isOk(compile(src))).toBe(true);
  expect(compileAndEval(src, "r")).toBe(1);
});

test("a () pattern is irrefutable, so it needs no runtime test", () => {
  // Irrefutable like `_`: unit has one inhabitant, so the type alone decides the arm.
  expect(compileJs("let f = u => switch u { | () => 1 }")).not.toContain("undefined ===");
});

test("() in pattern position rejects a non-unit scrutinee", () => {
  expect(isErr(compile("let bad = switch 1 { | () => 1 }"))).toBe(true);
});

test("parser non-regressions around the () atom", () => {
  expect(compileAndEval("let f = () => 0\nlet r = f()", "r")).toBe(0);
  expect(compileAndEval("let inc = (+ 1)\nlet r = inc(1)", "r")).toBe(2);
  expect(compileAndEval("let r = (1)", "r")).toBe(1);
  expect(compileAndEval("let r = switch (1, 2) { | (_, b) => b }", "r")).toBe(2);
});
