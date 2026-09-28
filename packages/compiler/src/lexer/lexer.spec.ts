import { expect, test } from "bun:test";
import { lex } from "@mochi/compiler/lexer";
import { unwrapOk } from "@onrails/result";

// Keyword lookup must not reach `Object.prototype`.
test.each(["valueOf", "toString", "constructor", "hasOwnProperty", "__proto__"])(
  "%p lexes as an identifier",
  (word) => {
    expect(unwrapOk(lex(word))[0]).toMatchObject({ t: "id", v: word });
  },
);

// `>>` is two touching `>` tokens; the parser glues them (ADR 0116).
test("`>>` lexes as two touching `>`", () => {
  const toks = unwrapOk(lex(">>"));
  expect(toks.slice(0, 2).map((t) => [t.t, t.span.start, t.span.end])).toEqual([
    ["gt", 0, 1],
    ["gt", 1, 2],
  ]);
});
