import { expect, test } from "bun:test";
import { None } from "@mochi/compiler/runtime";
import { formatStmts, lex, parseProgram, parseRecovering } from "./syntax.ts";

test("bootstrap syntax exposes plural parse recovery", () => {
  const tokens = lex("let =\nlet =\n") as
    | { _tag: "Ok"; value: unknown }
    | { _tag: "Err"; error: unknown };
  expect(tokens._tag).toBe("Ok");
  if (tokens._tag !== "Ok") return;

  const recovered = parseRecovering(tokens.value, None) as {
    diagnostics: Array<{ message: string }>;
  };
  expect(recovered).toMatchObject({
    diagnostics: expect.arrayContaining([expect.objectContaining({ message: expect.any(String) })]),
  });
});

test("parseProgram and formatStmts round-trip a module", () => {
  const src = "// kept\nlet x = 1\nlet =\n";
  const parsed = parseProgram(src);
  expect(parsed._tag).toBe("Ok");
  if (parsed._tag !== "Ok") return;
  expect(parsed.value.stmts.map((s) => s._tag)).toEqual(["SLet", "SError"]);
  expect(parsed.value.diagnostics).toHaveLength(1);
  expect(formatStmts(parsed.value.stmts, src)).toBe(src);
});

test("parseProgram fails only on a lex error", () => {
  expect(parseProgram('let s = "open')._tag).toBe("Err");
});
