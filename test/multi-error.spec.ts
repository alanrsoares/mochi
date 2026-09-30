import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler";
import { diagnostics } from "@mochi/dx/diagnostics";
import { isErr, unwrapErr } from "@onrails/result";

test("check collects two independent non-exhaustive switches", () => {
  const src =
    "type C = | A | B\n" +
    "let f = c => switch c { | A => 1 }\n" +
    "let g = c => switch c { | B => 2 }\n";
  const r = compile(src);
  expect(isErr(r)).toBe(true);
  const diags = unwrapErr(r);
  expect(diags).toHaveLength(2);
  expect(diags.every((d) => d.kind === "check")).toBe(true);
  expect(diags[0]!.message).toContain("missing B");
  expect(diags[1]!.message).toContain("missing A");
});

test("infer collects type errors across two top-level lets", () => {
  const r = compile('let a = add(1, true)\nlet b = mul("x", 2)\n');
  expect(isErr(r)).toBe(true);
  const diags = unwrapErr(r);
  expect(diags).toHaveLength(2);
  expect(diags.every((d) => d.kind === "type")).toBe(true);
  expect(diags.map((d) => d.message)).toEqual([
    "cannot unify number with bool",
    'cannot unify number with "x"',
  ]);
});

test("infer stays first-error-wins inside one expression", () => {
  // One bad call — should not invent follow-on junk from the same tree.
  const r = compile("let bad = add(true, add(false, 1))\n");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)).toHaveLength(1);
  expect(unwrapErr(r)[0]!.kind).toBe("type");
});

test("diagnostics() publishes every check/type finding", () => {
  const src =
    "type C = | A | B\n" +
    "let f = c => switch c { | A => 1 }\n" +
    "let g = c => switch c { | B => 2 }\n";
  const ds = diagnostics(src);
  expect(ds.length).toBeGreaterThanOrEqual(2);
});

test("compile Err is Diagnostic[] (lex still one-element)", () => {
  const r = compile("let x = ^");
  expect(isErr(r)).toBe(true);
  expect(unwrapErr(r)).toHaveLength(1);
  expect(unwrapErr(r)[0]!.kind).toBe("lex");
});
