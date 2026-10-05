# 0153 — Pipe placeholder `_`

- **Status:** Accepted
- **Date:** 2026-10-05
- **Source:** [#165](https://github.com/alanrsoares/mochi/issues/165) (subtask 3.4)

## Context

`->` always fills argument 1 and `|>` appends the last argument, so piping into a middle slot needed an explicit lambda.

## Decision

A bare `_` argument in the call on the right of `|>` or `->` marks the slot the piped value fills: `x |> f(a, _, b)` is `f(a, x, b)`. Lowering is a rewrite to an ordinary call in infer and codegen (same place as the fast-pipe lowering); the AST is unchanged, so the formatter prints it as written. A pipe with no `_` argument behaves as before.

## Consequences

- No parser, AST or seed-shape change; only the infer/codegen lowering.
- Only a top-level `_` argument counts; nested `_` is not a placeholder. Several `_` all receive the piped value.
- `_` is not a value elsewhere (unbound variable), so no existing program changes meaning.
