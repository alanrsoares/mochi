---
id: C7
title: Task concurrency combinators — all / race / traverse
status: open
type: task
blocked-by: []
---

# C7 — Task has sequencing but no fan-out

> **DECIDED 2026-07-26 (user-grilled): fail-fast; no `allLimit` in v1.** First `Err`
> settles the chain; in-flight tasks are abandoned (ignored — no cancellation story,
> documented). v1 ships `all` / `race` / `traverse` only; `allLimit(n, …)` deferred
> until real demand, named in the ADR as planned. Semantics question closed.

**Problem:** the `Task.*` table covers `of`/`map`/`andThen`/`recover`/`match`/`delay`/
`run` — sequencing only. The first real program needs parallel fan-out (`all`), and
without it users escape to host `Promise.all` at the edge, losing the typed error
channel that is Task's whole point.

**What to build (after a small ADR on partial-failure semantics):**

- `Task.all : [Task a e] -> Task [a] e` — fail-fast on first `Err` (document whether
  in-flight effects are abandoned; no cancellation story yet, so "abandoned" = ignored).
- `Task.race : [Task a e] -> Task a e`.
- `Task.traverse : (a -> Task b e) -> [a] -> Task [b] e` (and `sequence` as the
  identity special case if it falls out free).
- Bounded parallelism (`allLimit(n, …)`) — decide in the ADR whether v1 ships it.
- Chains stay mono-`e` (existing rule): callers `mapErr` before combining.

- [ ] ADR: partial-failure + abandonment semantics; `allLimit` in or out.
- [ ] Prelude signatures + JS runtime (`prelude.ts`), `_curry`-safe like `Task.delay`.
- [ ] `examples/async/` gains a fan-out example that exercises the `Err` path.
- [ ] Case in `test/examples.spec.ts`; `.d.ts` output checked.
- [ ] `bun run check:full` green.
