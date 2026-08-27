# 0089 — Async Task tests

- **Status:** Accepted
- **Date:** 2026-08-27
- **Source:** `packages/test/`
- **Deepens:** [ADR 0086](0086-bun-test-bindings.md), [ADR 0006](0006-task-result-async.md)

## Context

ADR 0086 deferred async tests. `test` is `string -> (() -> ()) -> ()`. bun:test
waits only if the callback returns a Promise. Mochi has no `async`/`await`.
`Task.run` yields `Promise<Result<a, e>>`, which is not `()`.
`ignore(Task.run(t))` fires and forgets — the runner does not wait.

## Decision

**`testTask : string -> Task () e -> ()`.** The runtime registers a bun:test
whose callback awaits the Task thunk (ADR 0006 kick-off lives in the helper,
not the spec). `Err` throws and fails the test. Sync `assertEq` / `ok` thrown
inside `Task.map` reject the Promise and fail the same way.

The payload is `()`. A bare `Task.delay(1, 2)` does not typecheck as a body —
map an assertion onto it (or recover an expected `Err` into `Task.of(())`).

Same unwrap for the rest of the async surface:

- `testTaskSkip` / `testTaskOnly` — bun `test.skip` / `test.only`
- `testEachTask : string -> [a] -> (a -> Task () e) -> ()` — one awaited Task
  per row, row passed whole (same anti-spread rule as `testEach`)
- `checkTask : string -> Arbitrary a -> (a -> Task () e) -> ()` — `fc.asyncProperty`
  plus the same unwrap

Timeouts are a first `number` (milliseconds, bun's `timeout` option), not an
optional last argument (HM has no optionals):

- `testTimeout` / `testTaskTimeout` / `testEachTimeout` / `testEachTaskTimeout`
- `checkTimeout` / `checkTaskTimeout`

```mochi
testTask("delay", Task.delay(1, 2) |> Task.map(assertEq(2)))

testTaskTimeout(50, "of", Task.of(1) |> Task.map(assertEq(1)))

testEachTask("delay identity", [(1, 1), (2, 2)], ((n, want)) =>
  Task.delay(1, n) |> Task.map(assertEq(want))
)

checkTask("Task.of addition commutes", pair(int, int), ((a, b)) =>
  Task.of(a + b) |> Task.map(assertEq(b + a))
)
```

`test` stays sync. No `async` keyword. Specs do not call `Task.run`.

## Consequences

The `@mochi/test` runner surface is complete for sync, table, PBT, Task, and
timeouts. Retries / repeats stay with bun's own CLI flags.

## Alternatives rejected

- **Widen `test` to `() -> a` or `() -> Promise a`.** Current specs break, or
  `test("x", () => 1)` typechecks.
- **`testPromise : string -> Promise a -> ()`.** Leaks the JS edge into specs
  and forgets Result-unwrap. `Task.run` stays the host kick-off; the helper
  is that kick-off for tests.
- **`testTask : string -> Task a e -> ()` (any payload).** A successful Task
  with no assertion would pass.
- **Timeout as an optional last argument.** HM has no optional params. First
  `number` is bun milliseconds.
