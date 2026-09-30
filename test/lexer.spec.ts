import { expect, test } from "bun:test";
import type { BootstrapDiagnostic, BootstrapResult } from "@mochi/compiler/bootstrap";
import { lex as seedLex } from "@mochi/compiler/bootstrap/syntax";
import type { LocTok, Tok } from "@mochi/compiler/bootstrap/types";
import { unwrapOk } from "@onrails/result";

const lex = (src: string) => seedLex(src) as BootstrapResult<LocTok<Tok>[], BootstrapDiagnostic>;

// Keyword lookup must not reach `Object.prototype`.
test.each(["valueOf", "toString", "constructor", "hasOwnProperty", "__proto__"])(
  "%p lexes as an identifier",
  (word) => {
    expect(unwrapOk(lex(word))[0]).toMatchObject({ tok: { _tag: "TId", value: word } });
  },
);

// `>>` is two touching `>` tokens; the parser glues them (ADR 0116).
test("`>>` lexes as two touching `>`", () => {
  const toks = unwrapOk(lex(">>"));
  expect(toks.slice(0, 2).map((t) => [t.tok._tag, t.start, t.end])).toEqual([
    ["TGt", 0, 1],
    ["TGt", 1, 2],
  ]);
});
