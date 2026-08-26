---
id: C7
title: Task concurrency combinators — all / race / traverse
status: done
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

- `Task.all : [Task<A, E>] -> Task<[A], E>` — fail-fast on first `Err` (document whether
  in-flight effects are abandoned; no cancellation story yet, so "abandoned" = ignored).
- `Task.race : [Task<A, E>] -> Task<A, E>`.
- `Task.traverse : (A -> Task<B, E>) -> [A] -> Task<[B], E>` (and `sequence` as the
  identity special case if it falls out free).
- Bounded parallelism (`allLimit(n, …)`) — decide in the ADR whether v1 ships it. **Out of v1** (ADR 0074).
- Chains stay mono-`e` (existing rule): callers `mapErr` before combining.

- [x] ADR: partial-failure + abandonment semantics; `allLimit` in or out.
- [x] Prelude signatures + JS runtime (`prelude.ts`), `_curry`-safe like `Task.delay`.
- [x] `examples/async/` gains a fan-out example that exercises the `Err` path.
- [x] Case in `test/examples.spec.ts`; `.d.ts` output checked.
- [x] `bun run check:full` green.

**Shipped 2026-08-26** — ADR [0074](../../adr/0074-task-fan-out.md); `Task.all` / `race` /
`traverse` in `prelude.ts` (bootstrap shim + typed runtime regenerated); fan-out section in
`examples/async/main.mochi`; guard in `test/examples.spec.ts`. `check:full`, `fixpoint` and
`bootstrap:tsc` all green.
