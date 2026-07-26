# 0042 — Scope a binding's generic "letters" (type-param names) to its subtree

- **Status:** Accepted
- **Source:** `src/codegen-ts.ts:45,190,215,241` (commit 8e75869), `test/ts-emit-tsc.spec.ts:181`

## Context

Emitting readable generic type-parameter names (`T`, `U`, `R`, …) for a
generic binding needs those "letters" available to every expression in that
binding's value subtree — including a nested lambda inside it, or an empty
collection seed (ADR-0035) that should be typed using the *enclosing*
binding's letter rather than inventing an unrelated fresh one. Without a
scoped map from binding to its assigned letters, a nested lambda or empty
seed had no way to look up which letter its enclosing generic binding
already claimed.

## Decision

Maintain a map from each generic binding's value-body span to that binding's
own assigned letters (a "letters map"), scoped to that value's expression
subtree, root included. A nested lambda inside a generic binding's body
looks up and reuses the enclosing binding's letters instead of allocating
its own; similarly, an empty seed (ADR-0035) inside a generic binding's body
may be annotated using that enclosing binding's letter rather than a fresh
unrelated one.

## Consequences

- Generic type-parameter names stay consistent and readable across nested
  lambdas/seeds within one generic binding's body, instead of each nested
  construct inventing its own unrelated letter.
- Reduced the strict-`tsc` self-host error count from 5 to 2 as one of the
  final steps of the ADR-0026 TS-dialect track.

## Alternatives rejected

- **Let each nested construct pick its own fresh letter independently** —
  produces readable-but-inconsistent generic names and, in some cases,
  `tsc` errors from an unrelated letter not actually being in scope.
