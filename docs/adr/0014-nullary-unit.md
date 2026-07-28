# 0014 — Nullary functions via internal `unit`

- **Status:** Accepted
- **Source:** Wave 11 follow-on (store action leaves); `src/types.ts` / `src/infer.ts`
- **Deepened by:** [ADR 0054](0054-unit-value-and-ignore.md) — `unit` is no longer
  unspeakable: `()` is its literal as a value and a pattern, and `showType` prints
  `()` in every position, so decisions 1 and 4 above are superseded in that respect.

## Context

Mochi inferred `() => T` as bare `T` (empty `reduceRight` over param arrows). That
made nullary values look like their results — so `store.actions.increment` could
not be a function in HM, and completion could not classify leaf actions as
methods. Call `f()` similarly did not peel a function type.

## Decision

1. Reserved nullary constructor `unit` (lowercase, unspeakable — same trick as
   `tuple`).
2. `() => T` infers as `unit -> T`.
3. `f()` unifies the callee with `unit -> R` and yields `R`.
4. Show / dts render leading or mid-chain `unit` domains as `()` /
   `() => …` without exposing the `unit` name.
5. Vendor sketches (re-reduced action leaves) use `unit -> {}` so LSP can mark
   them `method`.

## Consequences

- Hover / schemes show `() -> number` for thunks.
- Calling a non-function as `x()` is a type error (was previously a no-op).
- Bootstrap `arrowChain` / nullary call mirror the same rules.
- Payloadful actions still deferred; this only restores nullary honesty.

## Alternatives rejected

- **Completion-only Method icon** — lies about the type; hover would still say `{}`.
- **Surface `Unit` type** — unnecessary vocabulary; reserved con is enough.
- **Keep erasure** — blocks Store action DX permanently.
