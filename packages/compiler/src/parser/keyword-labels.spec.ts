// MOCHI keywords in a LABEL position — record field keys, `.field` projection,
// record-type fields, record-pattern field names, and plugin attribute names.
// These are not binding positions and cannot start a statement or expression, so
// `{ type: "button" }` / `props.type` / JSX `type="button"` are unambiguous.
// Rejecting them made ordinary host shapes unreachable from mochi. See ADR 0077;
// ADR 0020 is the sibling rule for JavaScript reserved words.

import { expect, test } from "bun:test";
import { compile } from "@mochi/compiler/compile";
import { isErr, isOk, unwrapErr, unwrapOk } from "@onrails/result";

const errMsg = (src: string): string => unwrapErr(compile(src))[0]!.message;

// --- label positions accept keywords ----------------------------------------

test("record field key may be a keyword", () => {
  const r = compile('let p = { type: "button", export: 1 }\n');
  expect(isOk(r)).toBe(true);
  expect(unwrapOk(r)).toContain('type: "button"');
});

test("field projection may name a keyword", () => {
  const r = compile('let p = { type: "button" }\nlet t = p.type\n');
  expect(isOk(r)).toBe(true);
  expect(unwrapOk(r)).toContain("p.type");
});

test("record type declares a keyword-named field", () => {
  const src = "type Btn = { type: string }\nlet f = (b: Btn) => b.type\n";
  expect(isOk(compile(src))).toBe(true);
});

test("record pattern matches a keyword-named field when renamed", () => {
  const src = "let f = r => switch r { | { type: t } => t }\n";
  expect(isOk(compile(src))).toBe(true);
});

test("every keyword is usable as a field key", () => {
  // `true`/`false` lex to `bool`, carry a value rather than a spelling, and are
  // deliberately excluded — see `KEYWORD_TEXT`.
  for (const kw of ["let", "type", "extern", "switch", "loop", "recur", "do", "import", "export"])
    expect(isOk(compile(`let p = { ${kw}: 1 }\nlet v = p.${kw}\n`))).toBe(true);
});

// --- puns stay rejected: they would bind, not label --------------------------

test("record field pun on a keyword is rejected", () => {
  // `{ do }` desugars to `{ do: do }` — a bare `do` as an identifier, which
  // neither mochi nor the emitted JS can spell.
  expect(errMsg("let p = { do }\n")).toContain("'do' is a keyword");
});

test("record-pattern pun on a keyword is rejected", () => {
  const src = "let f = r => switch r { | { type } => type }\n";
  expect(errMsg(src)).toContain("'type' is a keyword");
});

test("the pun diagnostic names the explicit form to write instead", () => {
  expect(errMsg("let p = { type }\n")).toContain("write 'type: <expr>'");
});

// --- keywords are still keywords everywhere else -----------------------------

test("a keyword is still not a binding name", () => {
  expect(isErr(compile("let type = 1\n"))).toBe(true);
});
