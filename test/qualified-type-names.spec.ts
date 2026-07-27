// C5 slice a (ADR 0046): `Alias.T` becomes parseable in type-annotation position.
// Resolution through the import graph — folding a qualified name back to the real
// declaration in check/infer/dts/hover — is a later C5 slice; this file only pins the
// parser, formatter, and the still-expected-to-fail typecheck behavior.
import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { compile } from "../src/compile";
import { format } from "../src/format";
import { lex } from "../src/lexer";
import { parse } from "../src/parser";

const parseType = (typeExprSrc: string) => {
  const src = `extern f : ${typeExprSrc} = "./m" "f"`;
  const prog = unwrapOk(parse(unwrapOk(lex(src))));
  const s = prog.stmts[0];
  if (s?.kind !== "extern") throw new Error("unreachable");
  return s.typeExpr;
};

test("nullary qualified type name: D.Shape", () => {
  const te = parseType("D.Shape -> number");
  if (te.kind !== "tarrow") throw new Error("unreachable");
  const from = te.from;
  expect(from.kind).toBe("tqual");
  if (from.kind !== "tqual") throw new Error("unreachable");
  expect(from.alias).toBe("D");
  expect(from.name).toBe("Shape");
  expect(from.args).toEqual([]);
});

test("applied qualified type name: D.Result e a", () => {
  const te = parseType("D.Result e a -> number");
  if (te.kind !== "tarrow") throw new Error("unreachable");
  const from = te.from;
  expect(from.kind).toBe("tqual");
  if (from.kind !== "tqual") throw new Error("unreachable");
  expect(from.alias).toBe("D");
  expect(from.name).toBe("Result");
  expect(from.args.map((a) => a.kind)).toEqual(["tname", "tname"]);
});

test("nested qualified type name: D.Result (E.Foo) a", () => {
  const te = parseType("D.Result (E.Foo) a -> number");
  if (te.kind !== "tarrow") throw new Error("unreachable");
  const from = te.from;
  expect(from.kind).toBe("tqual");
  if (from.kind !== "tqual") throw new Error("unreachable");
  expect(from.args.length).toBe(2);
  const [first, second] = from.args;
  expect(first?.kind).toBe("tqual");
  if (first?.kind !== "tqual") throw new Error("unreachable");
  expect(first.alias).toBe("E");
  expect(first.name).toBe("Foo");
  expect(second?.kind).toBe("tname");
});

test("qualified type name on both sides of an arrow", () => {
  const te = parseType("D.Shape -> D.Other");
  if (te.kind !== "tarrow") throw new Error("unreachable");
  expect(te.from.kind).toBe("tqual");
  expect(te.to.kind).toBe("tqual");
});

test("qualified type name in a `let` binding annotation", () => {
  const src = "let x : D.Shape = 5";
  const prog = unwrapOk(parse(unwrapOk(lex(src))));
  const s = prog.stmts[0];
  if (s?.kind !== "let") throw new Error("unreachable");
  expect(s.annot?.kind).toBe("tqual");
});

test("a lowercase name after the dot is rejected — a type variable cannot be qualified", () => {
  const r = parse(unwrapOk(lex('extern f : D.shape -> number = "./m" "f"')));
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)[0]!.message).toContain("type variable cannot be qualified");
});

test("formatter round-trips a qualified type name, nullary and applied", () => {
  const src = 'extern f : D.Shape -> D.Result e a = "./m" "f"';
  const once = unwrapOk(format(src));
  expect(once).toContain("D.Shape");
  expect(once).toContain("D.Result e a");
  expect(unwrapOk(format(once))).toBe(once);
});

test("D.Shape still fails to typecheck after slice a — resolution is a later C5 slice", () => {
  // Pinned: the alias-qualified name lowers to a distinctly-named placeholder
  // con (schemes.ts, ADR 0046) that unifies with nothing real, so this still
  // reports a type error rather than silently accepting `5` as a `D.Shape`.
  // Slice b teaches `typeExprToType` to resolve `D` through the import graph —
  // when it does, this test's expectation flips and the comment above updates.
  const r = compile("let x : D.Shape = 5");
  expect(isErr(r)).toBe(true);
});
