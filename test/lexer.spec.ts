import { expect, test } from "bun:test";
import type { CompilerDiagnostic } from "@mochi/compiler/graph";
import type { LocTok, Tok } from "@mochi/compiler/infer/types";
import { lex as seedLex } from "@mochi/compiler/syntax";
import type { Result } from "@onrails/result";
import { unwrapOk } from "@onrails/result";

const lex = (src: string) => seedLex(src) as Result<LocTok<Tok>[], CompilerDiagnostic>;

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
