import { expect, test } from "bun:test";
import { inferTypesRecoveringSync } from "@mochi/compiler/compile/sync";
import { parseProgram } from "@mochi/compiler/syntax";
import { unwrapErr, unwrapOk } from "@onrails/result";

test("recovered declarations report their type errors without cascading from parse holes", () => {
  const src = 'let x = )\nlet y = "hello"\nlet z = *\nlet w = add(1, "nope")\n';
  const parsed = unwrapOk(parseProgram(src));
  expect(parsed.diagnostics).toHaveLength(2);
  expect(parsed.stmts.map((s) => s._tag)).toEqual(["SError", "SLet", "SError", "SLet"]);
  const diags = unwrapErr(inferTypesRecoveringSync(src));
  expect(diags).toHaveLength(1);
  expect(diags[0]).toMatchObject({ kind: "type", message: expect.stringContaining("nope") });
  for (const diag of diags) {
    for (const stmt of parsed.stmts.filter((s) => s._tag === "SError")) {
      expect(diag.start < stmt.span.end && stmt.span.start < diag.end).toBe(false);
    }
  }
});

test("a name declared only in a skipped region remains unresolved", () => {
  const src = "let helper = )\nlet useIt = add(helper, 1)\n";
  expect(unwrapOk(parseProgram(src)).diagnostics).toHaveLength(1);
  expect(unwrapErr(inferTypesRecoveringSync(src))).toMatchObject([
    { kind: "type", message: "unbound variable 'helper'" },
  ]);
});

test("an all-error program contributes no inference diagnostics or bindings", () => {
  const src = "let a = )\nlet b = *\n";
  const parsed = unwrapOk(parseProgram(src));
  expect(parsed.diagnostics).toHaveLength(2);
  expect(parsed.stmts.every((s) => s._tag === "SError")).toBe(true);
  expect(unwrapOk(inferTypesRecoveringSync(src)).types).toEqual([]);
});
