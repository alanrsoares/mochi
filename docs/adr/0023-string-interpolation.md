# 0023 — String interpolation

- **Status:** Accepted (2026-07-22)
- **Deciders:** user + assistant

## Context

mochi strings are plain literals; composite strings are built by hand. The bootstrap
compiler alone has **123 `cat([...])` call sites** (`cat = parts => Str.join("", parts)`),
83 of them in `bootstrap/codegen.mochi` — a string emitter written without interpolation.
Error messages (the chosen v1 quality axis) in check/infer/parser account for ~40 more.

This is the highest-leverage surface addition left: it serves both v1 pillars
(error-message quality, self-host showcase readability) at once. See `docs/V1.md`.

## Decision

`"expected ${x}, got ${y}"` — string interpolation, **first-class AST node**, holes
**typed `string`**, codegen to a **JS template literal**.

1. **Lexer.** `scanString` gains a `${` mode: on `${`, the literal-so-far closes as a
   part and tokens are scanned until the matching `}` (brace-depth tracked, so record
   literals and switches inside holes work). Strings inside holes scan recursively —
   nested interpolation is legal. New escape `\$` for a literal `$` before `{`
   (a `$` not followed by `{` needs no escape). Existing escapes unchanged.
2. **AST.** New `interp` Expr: `parts: (string | Expr)[]` (alternating, starts/ends
   free). A `"…"` with no holes stays the existing `str` node — zero churn.
3. **Types.** Every hole unifies with `string`. Non-strings are explicit: `${show(n)}`.
   No implicit toString — magic coercion is overloading by the back door (bridge
   decision lineage, ADR 0018 context).
4. **Codegen.** Backtick template: `` `expected ${x}, got ${y}` `` — emitted JS reads
   exactly like the source. Parts re-encoded with template-safe escaping
   (`` ` ``, `${`, `\`).
5. **Formatter** round-trips the sugar (first-class node, like `let?` — ADR 0017).
6. **Walkers.** Every Expr walker recurses hole exprs (infer, freeRefs, check
   forEachMatch + checkReservedWords, codegen exprRefs + usesMatchLib, format) —
   `.exhaustive()` forces each.

## Alternatives rejected

- **Pure parser desugar to `Str.join("", [...])`** — zero infer/codegen change, but
  emitted JS turns into join-of-array noise (mochi's differentiator is readable
  output), error spans point at desugared calls, and the formatter can't round-trip.
- **Implicit `show` on non-string holes** — convenient, but it's ad-hoc overloading;
  mochi's answer to polymorphic rendering is the explicit structural `show`.

## Consequences

- Per the v1 parity gate, this lands in `src/` and `bootstrap/` (lexer.mochi scanString
  mode + parser.mochi `EInterp`) with differential coverage before bootstrap sources may
  use it (fixpoint stages compile bootstrap with the bootstrap compiler).
- Follow-up dogfood sweep migrates `cat([...])` sites where interpolation reads better.
- Hazard: template-literal escaping in codegen is new surface — pin with tests that
  round-trip `` ` ``/`$`/`\` through compile-and-eval.
