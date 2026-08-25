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

An arrow body may omit the `do` keyword: `x => { step(); result }` is the same
sequencing expression and is the formatter's canonical callback form. Arrow
braces without a top-level semicolon retain their existing record meaning, so
`x => { value: x }` remains a record-valued lambda.

## Consequences

- Existing `let _ = … in` source remains valid and formats to the shorter form.
- Non-final expressions may discard any value; Mochi has no effect system that could
  soundly require unit at this boundary.
- The parser, inference, codegen, formatter, and bootstrap mirror carry one `EDo`
  expression variant.
- Hook calls can appear as non-final arrow-body expressions without a synthetic
  `let _ = … in` binder.

## Alternatives rejected

A bare sequencing operator would add a low-precedence operator with unclear visual
scope. A Canvas-specific receiver cascade would not solve ordered effects elsewhere.
