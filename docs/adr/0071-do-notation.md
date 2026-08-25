# 0071 — `do` is the canonical sequencing expression

- **Status:** Accepted
- **Source:** `packages/compiler/src/parser/parser.ts`, `packages/dx/src/format.ts`

## Context

Effects in an expression-oriented language were sequenced with nested
`let _ = … in` bindings. The form is semantically clear but noisy in host-facing
code such as Canvas drawing loops, and repeated `_` binders need careful lowering.

## Decision

`do { e1; e2; result }` evaluates its expressions left-to-right and returns the
final expression. Semicolons separate expressions; the formatter always prints one
expression per line. It canonicalizes a `let _ = … in` chain into `do` notation.

`do` preserves loop tail position: a final `recur(…)` remains a direct loop recur,
not an IIFE-wrapped expression.

## Consequences

- Existing `let _ = … in` source remains valid and formats to the shorter form.
- Non-final expressions may discard any value; Mochi has no effect system that could
  soundly require unit at this boundary.
- The parser, inference, codegen, formatter, and bootstrap mirror carry one `EDo`
  expression variant.

## Alternatives rejected

A bare sequencing operator would add a low-precedence operator with unclear visual
scope. A Canvas-specific receiver cascade would not solve ordered effects elsewhere.
