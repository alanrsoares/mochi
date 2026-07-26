# 0032 — Flatten `|>` pipelines before typed-arrow inference

- **Status:** Accepted
- **Source:** `src/infer.ts`, `src/codegen-ts.ts` (commit d185384)

## Context

`a |> f |> g` desugars to nested calls (`g(f(a))`); inferring each lambda
parameter's type in isolation, arrow-by-arrow, loses the concrete type `a`
supplies at the head of the pipe — a typed-TS emission for an intermediate
lambda could fall back to a generic/`unknown` parameter type instead of the
concrete one flowing through the pipe.

## Decision

Flatten a `|>` chain to its full argument list before running typed-arrow
inference on any lambda that appears as a pipe stage, so each stage's
parameter type is solved against the concrete type actually flowing through
the pipe at that position, not an isolated unification with no head type
to anchor it.

## Consequences

- Typed TS emission for piped lambdas gets concrete parameter types instead
  of falling back to `unknown`/generic — this was one contributor to the
  strict-`tsc`-error count chased down under ADR-0026.
- Pipe desugaring and typed-arrow inference are no longer independent passes
  for this case — flattening order matters and is fixed at the `|>` site.

## Alternatives rejected

- **Infer each pipe stage in isolation** — the status quo before this
  change; left piped lambda parameters under-typed in the TS backend.
