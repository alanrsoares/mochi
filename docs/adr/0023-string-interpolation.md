# 0023 — String interpolation (`"…${expr}…"`)

- **Status:** Accepted
- **Source:** `src/lexer.ts` (`tmplstart`/`tmplmid`/`tmplend`), `src/ast.ts` (`{ kind: "interp" }`), `src/codegen.ts`, `bootstrap/{lexer,parser,codegen}.mochi`, `test/interp.spec.ts`

## Context

String building via concatenation (`"a" + str(x) + "b"`) is noisy for the
common case of embedding a few expressions in literal text. Native JS
template literals already solve this at the runtime level, so the surface
syntax and codegen can piggyback on them directly instead of inventing a
different runtime representation.

## Decision

Lex `"…${a}…${b}…"` into a bracketed token stream — `tmplstart <holeTokens>
tmplmid <holeTokens> … tmplend` — where each hole's tokens parse as an
ordinary expression via the normal expression parser. The literal chunk
before/between/after holes is a plain string segment; a hole-free literal
lexes as an ordinary `str` token (no interpolation machinery for the common
non-interpolated case). Every hole unifies to `string` in HM (values are
`str`-ed, not implicitly coerced). Codegen emits a native JS template literal
with each chunk safely re-escaped, so the emitted JS reads like the source.

## Consequences

- Interpolation holes are full mochi expressions, not a restricted
  mini-language — parser reuses `parseExpr` unchanged.
- `bootstrap/{lexer,parser,codegen}.mochi` mirror the token bracketing and
  codegen shape for self-hosting parity.

## Alternatives rejected

- **`str(x) + str(y)` concatenation sugar only** — no lexer/parser change,
  but noisier at every call site and loses the 1:1 mapping to JS template
  literals in emitted output.
