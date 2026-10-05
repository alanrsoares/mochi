# 0155 — Cooperative `Task` cancellation via `AbortSignal`

- **Status:** Accepted
- **Date:** 2026-10-06
- **Source:** issue #166; amends ADR 0074 ("in-flight effects are abandoned, not cancelled")

## Decision

A `Task` thunk may receive an optional `AbortSignal`: at runtime `(signal?: AbortSignal) => Promise<Result<A, E>>`.
The Mochi type `Task<A, E>` and every emitted `.d.ts` signature are unchanged, so a
zero-argument thunk from a host extern is still a valid `Task`, and a signal-aware thunk is still
assignable to `() => Promise<…>`.

- `map`, `mapErr`, `andThen`, `recover`, `match` forward the signal to the task they wrap and to the
  continuation task they build.
- `Task.all` / `Task.race` run their children under a linked `AbortController` (also aborted when the
  caller's signal aborts) and abort it as soon as the fan-out settles, so the losers of a `race` and the
  siblings of a failed `all` are cancelled instead of abandoned.
- `Task.delay` clears its timer on abort. An aborted delay never settles: cancellation is cooperative
  and the result of a cancelled arm is dropped, so no `e` has to be invented for it.
- `Task.runWith : AbortSignal -> Task a e -> Promise (Result a e)` is the kick-off that supplies a
  signal. `Task.run` is unchanged. Host externs opt in by reading the signal argument.

## Consequences

- No breaking change; tasks that ignore the signal behave exactly as before (abandoned, ADR 0074).
- A cancelled arm never settles, so a caller of `runWith` that aborts its own signal should not await
  the promise for a value.
