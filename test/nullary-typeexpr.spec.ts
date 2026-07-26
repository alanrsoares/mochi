// `() -> T` in TypeExpr / extern signatures (ADR 0014 surface + ADR 0015).
import { expect, test } from "bun:test";
import { isOk, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { hoverAt } from "../src/hover";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";

test("() parses as a type atom (nullary domain)", () => {
  const prog = unwrapOk(parse(unwrapOk(lex('extern f : () -> number = "./m" "f"'))));
  const s = prog.stmts[0];
  expect(s?.kind).toBe("extern");
  if (s?.kind !== "extern") throw new Error("unreachable");
  expect(s.typeExpr.kind).toBe("tarrow");
  if (s.typeExpr.kind !== "tarrow") throw new Error("unreachable");
  expect(s.typeExpr.from.kind).toBe("tname");
  if (s.typeExpr.from.kind !== "tname") throw new Error("unreachable");
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
