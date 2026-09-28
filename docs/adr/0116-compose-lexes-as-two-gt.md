# 0116 — `>>` lexes as two `>`; nested type arguments close without a space

- **Status:** Accepted
- **Date:** 2026-09-29

## Context

Both lexers read `>>` as one composition token. A nested type argument list
ends in two `>` in a row, so `Map<string, Map<string, a>>` failed with
"expected gt, got compose". Sources had to write `Map<string, Map<string, a> >`,
and the printers added that space after every type argument ending in `>`, even
mid-list (`Result<Option<a> , string>`).

## Decision

- The lexers emit `>>` as two `>` tokens. The type parser then closes each
  argument list with its own `>`, at any depth.
- The expression parser reads two **touching** `>` tokens (the first ends
  where the second starts) as composition. With a space between them they
  are two separate `>` tokens, as with any other operator.
- Comparison skips a `>` that touches another `>`. Composition binds looser
  than `&&` and comparison binds tighter, so without this, `x && f >> g`
  would read the first `>` as a comparison.
- Hover shows the composition hint on either touching `>`.
- The type printers no longer pad. `Map<string, Map<string, a> >` still
  parses, and the formatter rewrites it to `>>`.

This is how C#, and Java since generics, handle the same clash. Their lexers
read `>` as a single token and the parser joins them where a shift or
composition makes sense.

## Consequences

- Expressions are unchanged: `f >> g` is composition, and `f > > g` is still
  two `>` tokens and a parse error.
- The repo's `> >` spellings are reformatted to `>>`.
- Found while fixing this: the TypeScript lexer looked keywords up in a plain
  object, so identifiers such as `valueOf` and `toString` found
  `Object.prototype` members and lexed as tokens with no tag. It now checks
  `Object.hasOwn`. The TypeScript codegen's runtime-dependency walk had the
  same lookup and crashed on a binding named `valueOf`; it checks
  `Object.hasOwn` too. The Mochi lexer matches keywords with a `switch` and was
  never affected.
