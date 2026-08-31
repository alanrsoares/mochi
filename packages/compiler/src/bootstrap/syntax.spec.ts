import { expect, test } from "bun:test";
import { None } from "@mochi/compiler/runtime";
import { lex, parseRecovering } from "./syntax.ts";

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
