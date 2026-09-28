// `>>` lexes as two `>` so nested type arguments close one at a time (ADR
// 0116). In an expression, two touching `>` are composition, which binds looser
// than `&&`; with a space between they are two comparisons.
import { expect, test } from "bun:test";
import type { Expr } from "@mochi/compiler/ast";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { isErr, unwrapOk } from "@onrails/result";

const parsed = (src: string) => parse(unwrapOk(lex(src)));
const letValue = (src: string): Expr => {
  const stmt = unwrapOk(parsed(src)).stmts[0]!;
  if (stmt.kind !== "let") throw new Error("not a let");
  return stmt.value;
};

test.each(["let h = f >> g", "let h = x && f >> g", "let h = f >> g >> k"])(
  "touching `>` compose: %p",
  (src) => {
    expect(letValue(src).kind).toBe("lambda");
  },
);

test("`> >` with a space is not composition", () => {
  expect(isErr(parsed("let h = f > > g"))).toBe(true);
});

test("a single `>` is still a comparison", () => {
  const v = letValue("let b = a > c");
  expect(v.kind === "call" && v.fn.kind === "ref" && v.fn.name).toBe("gt");
});

test.each([
  'extern m : Map<string, Map<string, a>> = "m" "m"',
  'extern m : Option<Option<Option<a>>> = "m" "m"',
  'extern m : Map<string, Map<string, a> > = "m" "m"',
])("nested type arguments close: %p", (src) => {
  expect(isErr(parsed(src))).toBe(false);
});
