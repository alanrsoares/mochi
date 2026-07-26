# 0016 — Ternary as a boolean conditional expression

- **Status:** Accepted
- **Source:** `src/ast.ts` (`{ kind: "ternary" }`), `src/parser.ts:494`, `src/infer.ts:373`/`697`, `src/codegen.ts:227`/`866`/`927`

## Context

`switch`/`match` is the general branching form, but a plain two-way boolean
choice used as an expression (`cond ? then : else`) is common enough to want
dedicated surface syntax rather than forcing a `switch true { … }` or a
`letin` detour.

## Decision

Add a `ternary` expression node: `cond ? then : else`, right-associative,
binding looser than `|>` so `a |> f ? b : c` parses as `(a |> f) ? b : c`.
Both branches are full expressions and must unify to one type; `cond` must be
`bool`. Codegen always parenthesizes the emitted JS conditional so it composes
safely inside larger expressions.

## Consequences

- One more `Expr` variant threading through parser/infer/codegen/format —
  kept intentionally minimal (no `elif` chain sugar; chain by nesting).
- Shares the reserved-word hazard noted in ADR-0020: JS's own `?:` has no
  binding-name risk, so no interaction there.

## Alternatives rejected

- **No ternary, `switch true { … }` only** — noisy for the common two-way
  case that every branch of the language otherwise treats as an expression.
