/**
 * Slice c of C9 (ADR 0045, decision 4 — the no-cascade rule): `check` and `infer` must
 * tolerate a `Program` containing `error` stmts (from `parseRecovering`) without
 * cascading — an error node contributes no bindings, no type vars, no diagnostics of
 * its own, and suppresses no other diagnostic. A reference to a name that only ever
 * lived in a skipped region is a genuine unresolved reference and is reported normally.
 */
import { expect, test } from "bun:test";
import { isErr, unwrapErr, unwrapOk } from "@onrails/result";
import { check } from "../src/check";
import { inferProgram } from "../src/infer";
import { lex } from "../src/lexer";
import { parseRecovering } from "../src/parser";
import { preludeEnv } from "../src/prelude";

const recover = (src: string) => parseRecovering(unwrapOk(lex(src)));

test("multi-error file: both parse diagnostics survive, and a genuine type error in a surviving decl is still reported", () => {
  const src = 'let x = )\nlet y = "hello"\nlet z = *\nlet w = add(1, "nope")\n';
  const { program, diagnostics: parseDiags } = recover(src);

  // (i) both parse diagnostics appear.
  expect(parseDiags).toHaveLength(2);
  expect(parseDiags.every((d) => d.kind === "parse")).toBe(true);
  expect(program.stmts.map((s) => s.kind)).toEqual(["error", "let", "error", "let"]);

  // `check` never sees the broken regions as let/type/extern, so it passes clean.
  const checked = check(program);
  expect(isErr(checked)).toBe(false);

  // (ii) the type error in the good region (`w`) is still reported …
  const inferred = inferProgram(program, preludeEnv);
  expect(isErr(inferred)).toBe(true);
  const typeDiags = unwrapErr(inferred);
  expect(typeDiags).toHaveLength(1);
  expect(typeDiags[0]!.kind).toBe("type");
  expect(typeDiags[0]!.message).toContain("nope");

  // (iii) … and no diagnostic is attributed to either error-node span (no cascade).
  const errorSpans = program.stmts.filter((s) => s.kind === "error").map((s) => s.span);
  for (const diag of typeDiags) {
    expect(diag.span).toBeDefined();
    const diagSpan = diag.span!;
    for (const span of errorSpans) {
      const overlaps = diagSpan.start < span.end && span.start < diagSpan.end;
      expect(overlaps).toBe(false);
    }
  }
});

test("a reference to a name that only ever lived in a skipped region is a genuine unresolved reference, not cascade noise", () => {
  // `helper`'s only declaration is inside the broken (skipped) region.
  const src = "let helper = )\nlet useIt = add(helper, 1)\n";
  const { program, diagnostics: parseDiags } = recover(src);
  expect(parseDiags).toHaveLength(1);
  expect(program.stmts.map((s) => s.kind)).toEqual(["error", "let"]);

  const inferred = inferProgram(program, preludeEnv);
  expect(isErr(inferred)).toBe(true);
  const typeDiags = unwrapErr(inferred);
  expect(typeDiags).toHaveLength(1);
  expect(typeDiags[0]!.message).toBe("unbound variable 'helper'");
});

test("an all-error program (no surviving decl) checks and infers with no diagnostics of its own", () => {
  const src = "let a = )\nlet b = *\n";
  const { program, diagnostics: parseDiags } = recover(src);
  expect(parseDiags).toHaveLength(2);
  expect(program.stmts.every((s) => s.kind === "error")).toBe(true);

  expect(isErr(check(program))).toBe(false);
  // No surviving `let` means no new bindings beyond ctors/externs seeded by `infer` itself.
  expect(isErr(inferProgram(program, preludeEnv))).toBe(false);
});
