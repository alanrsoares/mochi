// `() -> T` in TypeExpr / extern signatures (ADR 0014 surface + ADR 0015).
import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler";
import { lex, parse } from "@mochi/compiler/bootstrap/syntax";
import type { Stmt } from "@mochi/compiler/bootstrap/types";
import { hoverAt } from "@mochi/dx/hover";
import { isOk, unwrapOk } from "@onrails/result";

type Lexed = { _tag: "Ok"; value: unknown } | { _tag: "Err"; error: unknown };
type Parsed = { _tag: "Ok"; value: Stmt[] } | { _tag: "Err"; error: unknown };

const parseSrc = (src: string): Stmt[] => {
  const lexed = lex(src) as Lexed;
  if (lexed._tag === "Err") throw new Error("lex failed");
  return unwrapOk(parse(lexed.value) as Parsed);
};

test("() parses as a type atom (nullary domain)", () => {
  const s = parseSrc('extern f : () -> number = "./m" "f"')[0];
  expect(s?._tag).toBe("SExtern");
  if (s?._tag !== "SExtern") throw new Error("unreachable");
  expect(s.typeExpr._tag).toBe("TyArrow");
  if (s.typeExpr._tag !== "TyArrow") throw new Error("unreachable");
  expect(s.typeExpr.from._tag).toBe("TyName");
  if (s.typeExpr.from._tag !== "TyName") throw new Error("unreachable");
  expect(s.typeExpr.from.name).toBe("unit");
});

test("() -> number extern schemes as () -> number", () => {
  const src = 'extern f : () -> number = "./m" "f"\nlet r = f()';
  expect(isOk(compile(src))).toBe(true);
  expect(hoverAt(src, src.indexOf("f()"))?.code).toBe("() -> number");
});

test("nested () -> in extern arity", () => {
  const src = 'extern g : (() -> string) -> number = "./m" "g"';
  expect(isOk(compile(src))).toBe(true);
});
