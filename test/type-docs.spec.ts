import { expect, test } from "bun:test";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { hoverAt } from "@mochi/dx/hover";
import { isOk } from "@onrails/result";

const src = `/// A successful or failed computation.
export type Result<A, E> = | Ok(A) | Err(E)`;

test("a doc comment attaches to an exported type declaration", () => {
  const tokens = lex(src);
  expect(isOk(tokens)).toBe(true);
  if (!isOk(tokens)) return;
  const program = parse(tokens.value);
  expect(isOk(program)).toBe(true);
  if (!isOk(program)) return;
  expect(program.value.stmts[0]).toMatchObject({
    kind: "type",
    doc: "A successful or failed computation.",
  });
});

test("type declaration hover includes its doc comment", () => {
  expect(hoverAt(src, src.indexOf("Result"))).toEqual({
    code: "type Result<A, E> = Ok(A) | Err(E)",
    doc: "A successful or failed computation.",
  });
});
