# 0002 — Exhaustiveness via ts-pattern (internal) + @onrails/pattern (emitted)

- **Status:** Accepted
- **Source:** `src/codegen.ts` (comments + dispatch); `docs/CRITIQUE.md` §1.1; commits `f43fdc9`, `795195d`

## Context

Two separate exhaustiveness problems: (1) the compiler's own dispatch over the `Expr`
AST union must not silently miss a node kind; (2) the JS the compiler emits for a user's
`switch` must be exhaustive over the variant's constructors.

## Decision

- **Inside the compiler:** dispatch on `Expr` with `ts-pattern` ending in
  `.exhaustive()` (in `genExpr`, `usesMatchLib`, `exprRefs`). Adding an `Expr` kind and
  forgetting a case becomes a TypeScript compile error.
- **In emitted code:** lower `switch` to `@onrails/pattern`'s runtime
  `match(...).with(...).exhaustive()` over a `_tag` discriminant. Exhaustiveness over
  imported variants is checked in `check.ts` before codegen.

## Consequences

- Two `match` dependencies with different jobs (`ts-pattern` = dev/compiler-internal;
  `@onrails/pattern` = emitted runtime). Do not conflate them.
- Lazy-`List` matches are the exception: not length-indexable, so they lower to a
  buffered pull IIFE instead of `@onrails/pattern`.

## Alternatives rejected

Ad-hoc `if/else` chains or manual completeness review — no compile-time guarantee that a
new AST node or variant constructor is handled everywhere.
