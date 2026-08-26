# 0074 — Task fan-out: `all`, `race`, `traverse` (fail-fast, no cancellation)

- **Status:** Accepted
- **Date:** 2026-08-26
- **Source:** tracker ticket [C7](../tracker/tickets/c07-task-concurrency.md) (decision grilled 2026-07-26)

## Context

`Task.*` shipped sequencing only — `of`/`fail`/`map`/`mapErr`/`andThen`/`recover`/
`fromResult`/`match`/`delay`/`run`. Every combinator is one-task-at-a-time, so the first
program that needs two independent effects at once has to leave the language: build the
thunks, call `Task.run` on each, and hand the promises to host `Promise.all`. That drops
the value back into the host's rejection channel, which is exactly the typed error channel
`Task` exists to preserve (ADR 0006).

## Decision

Three combinators in the prelude `Task` namespace. No new syntax, no compiler change —
they are prelude values like `Task.delay`.

```
Task.all      : [Task<a, e>] -> Task<[a], e>
Task.race     : [Task<a, e>] -> Task<a, e>
Task.traverse : (a -> Task<b, e>) -> [a] -> Task<[b], e>
```

- **Fail-fast.** `all` settles `Err` the moment the *first* error arrives — it does not
  wait for the remaining tasks. Results keep **input order**, not completion order.
- **In-flight effects are abandoned, not cancelled.** mochi has no cancellation story, and
  inventing one here would be a language-shaped decision made by a stdlib function. An
  abandoned task's effect still runs to completion in the host; its result is dropped.
  This is documented, not hidden.
- **`race` settles on the first task to settle, `Ok` or `Err` alike** — it races
  *settlement*, not success. An error-preferring `any`-style combinator is a different
  function and is not shipped.
- **Empty arrays.** `all([])` is `Task.of([])`. `race([])` never settles, matching
  `Promise.race([])`. The alternative — an `Err` — would need an error value the signature
  cannot produce (`e` is universally quantified), so "never" is the only total answer.
- **`traverse` is `all` after `map`**, curried like `Task.delay` (ADR 0005) so both
  `Task.traverse(f, xs)` and `Task.traverse(f)` work.
- **Chains stay mono-`e`** — the existing rule. Callers `mapErr` onto a common error type
  before combining; `all` cannot unify two error types for you.
- **No `allLimit(n, …)` in v1.** Bounded parallelism is a scheduling policy with its own
  ordering and error-timing questions; it ships when a real program asks for it.
- **No `sequence`.** `Task.all` *is* sequence for `[Task]`; a second name for the same
  function is a synonym, not a feature.

## Consequences

- The escape to host `Promise.all` disappears for the common case, so the error channel
  survives fan-out.
- Abandonment is observable: a `Task` whose effect writes to a store may complete *after*
  the chain settled `Err`. Programs needing "nothing happened after the failure" must
  make that guarantee themselves — the stdlib does not.
- `race([])` hanging is a footgun the type system cannot catch (no non-empty array type).
  Documented in `docs/language.md`; revisit if a non-empty list type ever lands.
- Bootstrap parity is free: `bootstrap/prelude.gen.mjs` is generated from `prelude.ts`
  (`bun run gen:prelude`), and the JS-backend def table from the typed runtime
  (`bun run gen:prelude-defs`, ADR 0075).
