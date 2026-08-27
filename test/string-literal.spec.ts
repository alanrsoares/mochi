// ADR 0081 — string literals and finite unions in type position.
import { expect, test } from "bun:test";
import { check } from "@mochi/compiler/check";
import { compile } from "@mochi/compiler/compile";
import { emitDts } from "@mochi/compiler/dts";
import { inferProgramTypes, showScheme } from "@mochi/compiler/infer";
import { lex } from "@mochi/compiler/lexer";
import { parse } from "@mochi/compiler/parser";
import { preludeEnv } from "@mochi/compiler/prelude";
import { format } from "@mochi/dx/format";
import { hoverAt } from "@mochi/dx/hover";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";

const schemeOf = (src: string, name: string): string => {
  const prog = unwrapOk(check(unwrapOk(parse(unwrapOk(lex(src))))));
  const { env, aliases } = unwrapOk(inferProgramTypes(prog, preludeEnv, {}));
  return showScheme(env.get(name)!, aliases);
};

const errMsg = (src: string): string => {
  const r = compile(src);
  expect(isErr(r)).toBe(true);
  return unwrapErr(r)[0]!.message;
};

test("an unannotated string literal generalizes to string", () => {
  expect(schemeOf(`let m = "hi"`, "m")).toBe("string");
});

test("an annotation keeps a string singleton", () => {
  expect(schemeOf(`let m : "hi" = "hi"`, "m")).toBe('"hi"');
});

test("a literal union annotation accepts a member and rejects an outsider", () => {
  expect(schemeOf(`let t : "rose" | "amber" = "rose"`, "t")).toBe('"rose" | "amber"');
  expect(errMsg(`let t : "rose" | "amber" = "taupe"`)).toContain("cannot unify");
});

test("a named synonym expands like a record alias", () => {
  const src = `type Tone = "rose" | "amber"
let t : Tone = "rose"`;
  expect(schemeOf(src, "t")).toBe("Tone");
});

test("a general string does not unify with a literal union", () => {
  expect(
    errMsg(`let s = "rose"
let t : "rose" | "amber" = s`),
  ).toContain("cannot unify");
});

test("union binds tighter than arrow", () => {
  const prog = unwrapOk(parse(unwrapOk(lex(`extern f : "a" | "b" -> number = "./m" "f"`))));
  const s = prog.stmts[0];
  expect(s?.kind).toBe("extern");
  if (s?.kind !== "extern") throw new Error("unreachable");
  expect(s.typeExpr.kind).toBe("tarrow");
  if (s.typeExpr.kind !== "tarrow") throw new Error("unreachable");
  expect(s.typeExpr.from.kind).toBe("tunion");
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
