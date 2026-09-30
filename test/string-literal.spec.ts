// ADR 0081 — string literals and finite unions in type position.
import { expect, test } from "bun:test";
import { compile, emitDts } from "@mochi/compiler";
import { parseProgram } from "@mochi/compiler/bootstrap/syntax";
import { check } from "@mochi/compiler/check";
import { inferProgramTypes, showScheme } from "@mochi/compiler/infer";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { preludeEnv } from "@mochi/compiler/prelude";
import { format } from "@mochi/dx/format";
import { hoverAt } from "@mochi/dx/hover";
import { typeOf } from "@mochi/test-support";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";

/** TS-core scheme printer — kept only for the divergent singleton case below. */
const schemeOfCore = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  const { env, aliases } = unwrapOk(inferProgramTypes(prog, preludeEnv, {}));
  return showScheme(env.get(name)!, aliases);
};

/** Closed-world type of `let name`, from the self-hosted core. */
const typeOfClosed = (src: string, name: string): string => typeOf(src, name, { open: false });

/** Hover text over the last occurrence of `needle` (alias-folded, as the IDE shows it). */
const hoverLast = (src: string, needle: string): string | null =>
  hoverAt(src, src.lastIndexOf(needle) + 1)?.code ?? null;

const errMsg = (src: string): string => {
  const r = compile(src);
  expect(isErr(r)).toBe(true);
  return unwrapErr(r)[0]!.message;
};

test("an unannotated string literal generalizes to string", () => {
  expect(typeOfClosed(`let m = "hi"`, "m")).toBe("string");
});

test("an annotation keeps a string singleton", () => {
  // #104: seed diverges — self-hosted core generalizes `let m : "hi"` to `string`.
  expect(schemeOfCore(`let m : "hi" = "hi"`, "m")).toBe('"hi"');
});

test("a literal union annotation accepts a member and rejects an outsider", () => {
  expect(typeOfClosed(`let t : "rose" | "amber" = "rose"`, "t")).toBe('"rose" | "amber"');
  expect(errMsg(`let t : "rose" | "amber" = "taupe"`)).toContain("cannot unify");
});

test("a named synonym expands like a record alias", () => {
  const src = `type Tone = "rose" | "amber"
let t : Tone = "rose"
let u = t`;
  // The inferred type is the expanded union; hover folds it back to the synonym.
  expect(typeOfClosed(src, "t")).toBe('"rose" | "amber"');
  expect(hoverLast(src, "t")).toBe("Tone");
});

test("a general string does not unify with a literal union", () => {
  expect(
    errMsg(`let s = "rose"
let t : "rose" | "amber" = s`),
  ).toContain("cannot unify");
});

test("union binds tighter than arrow", () => {
  const r = parseProgram(`extern f : "a" | "b" -> number = "./m" "f"`);
  if (r._tag === "Err") throw new Error("lex failed");
  expect(r.value.diagnostics).toEqual([]);
  const s = r.value.stmts[0];
  expect(s?._tag).toBe("SExtern");
  if (s?._tag !== "SExtern") throw new Error("unreachable");
  expect(s.typeExpr._tag).toBe("TyArrow");
  if (s.typeExpr._tag !== "TyArrow") throw new Error("unreachable");
  expect(s.typeExpr.from._tag).toBe("TyUnion");
});

test("formats a union annotation and a type synonym", () => {
  expect(unwrapOk(format(`let t:"rose"|"amber"="rose"`))).toBe(
    'let t : "rose" | "amber" = "rose"\n',
  );
  expect(unwrapOk(format(`type Tone="rose"|"amber"`))).toBe('type Tone = "rose" | "amber"\n');
});

test("hover on a synonym name shows the union", () => {
  const src = `type Tone = "rose" | "amber"\n`;
  expect(hoverAt(src, src.indexOf("Tone"))?.code).toBe('type Tone = "rose" | "amber"');
});

test(".d.ts prints the union synonym", () => {
  const dts = unwrapOk(emitDts(`export type Tone = "rose" | "amber"`));
  expect(dts).toContain('export type Tone = "rose" | "amber"');
});
