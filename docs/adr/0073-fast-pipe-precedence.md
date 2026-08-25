# 0073 — Fast pipe is method-call tight

- **Status:** Accepted
- **Source:** `packages/compiler/src/parser/parser.ts`, `bootstrap/parser.mochi`, `packages/dx/src/format.ts`

## Context

[ADR 0069](0069-fast-pipe.md) gave `->` the same left-associative binding power as
`|>`. That made `a ++ x->f(y)` parse as `(a ++ x)->f(y)` — concat first, then a
call — which is the opposite of the ReScript-style method-call reading the snug
`x->f(y)` spelling suggests. `++` (BP 10) outranked `->` (BP 5).

## Decision

`->` is postfix-tight: binding power 21, above every infix (`*` is 20, `++`/`+`
are 10). `|>` stays pipeline-loose at BP 5. Chains remain left-associative:
`a -> f(b) -> g(c)` is still `g(f(a, b), c)`.

So `a ++ x->f(y)` is `a ++ f(x, y)`. Concat-first grouping is explicit:
`(a ++ x)->f(y)`.

## Consequences

- String-build plus a data-first call needs no parens: `"hi" ++ ctx->gen(1)`.
- `fmt` prints that form without wrapping the pipe; `(a ++ x)->f(y)` keeps its
  parens because dropping them would reparse.
- `|>` is unchanged: `a ++ b |> f` is still `(a ++ b) |> f`.

## Alternatives rejected

Raising `->` to just above `++` (BP 12) still lets `a * x->f(y)` mean
`f(a * x, y)`. True method-call tightness wants to outrank every infix.
Keeping shared precedence with `|>` forces parens on the common `++` case.
