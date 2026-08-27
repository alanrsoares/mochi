// Top-level expression statements must have type `()` (ADR 0087).

import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { compileJs } from "@mochi/test-support";
import { formatSrc as fmt } from "@mochi/test-support/format";
import { isErr, isOk, unwrapErr, unwrapOk } from "@onrails/result";

test("a unit call at top level emits without a binding", () => {
  const js = compileJs("let f = () => ()\nf()");
  expect(js).toContain("f();");
  expect(js).not.toMatch(/const _ =/);
});

test("ignore at top level compiles", () => {
  expect(isOk(compile("ignore(1)"))).toBe(true);
  expect(compileJs("ignore(1)")).toContain("ignore(1);");
});

test("a non-unit expression statement is a type error", () => {
  const result = compile("1 + 1");
  expect(isErr(result)).toBe(true);
  expect(unwrapErr(result).some((d) => d.message.includes("cannot unify"))).toBe(true);
});

test("optional trailing semicolon is consumed", () => {
  const prog = unwrapOk(parse(unwrapOk(lex("ignore(1); ignore(2)"))));
  expect(prog.stmts.map((s) => s.kind)).toEqual(["expr", "expr"]);
});

test("a do-block whose last expr is unit is a legal statement", () => {
  expect(isOk(compile("do { ignore(1); ignore(2) }"))).toBe(true);
});

test("formatter prints expression statements without let _ =", () => {
  expect(fmt("ignore(1)\nignore(2)")).toBe("ignore(1)\nignore(2)\n");
});
