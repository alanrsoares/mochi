# 0006 — `Task` gets an error channel (`Task a e`, `ResultAsync`-aligned)

- **Status:** Proposed
- **Source:** conversation; `@onrails/result`'s `ResultAsync`
  ([alanrsoares/onrails](https://github.com/alanrsoares/onrails),
  `packages/result/src/async.ts`, `async-lift.ts`); `src/prelude.ts`;
  `src/infer.ts:157-165`; `docs/adr/0005-prelude-task.md`

## Context

`Task a` (ADR 0005) has no error channel — it is `() => Promise<a>`. A rejected
promise has nowhere to go: `Task.run` propagates a bare host rejection, `Task.map`/
`Task.andThen` can't observe or recover from failure, and there is no `Task`
counterpart to `Result.mapErr`/`recover`. This is a correctness gap, not just an
ergonomics one.

It also shows up as an asymmetry in the compiler itself: `infer.ts:165`'s
`inferLetBind` only allocates a fresh error type variable when
`e.monad === "Result"` — `let?`/`let!` are meant to be parallel sugar (ADR 0005
decision 5), but `let!` (Task) can't participate in error-typed binding because
`Task` has no error slot to unify against.

Meanwhile the compiler's own implementation already leans on
`@onrails/result`'s `ResultAsync<T,E>` throughout `src/*.ts` for exactly this
shape of problem — a lazy async railway with a typed error channel. Rather than
inventing a bespoke design, this ADR ports `ResultAsync`'s proven shape into the
prelude, reading its actual source (not just its `.d.ts`) to separate what
transfers to mochi's plain HM from what doesn't.

## Decision

1. **`Task a e`** — two type parameters, mirroring `Result a e`. Runtime
   representation becomes `() => Promise<Result<a, e>>` (still an opaque applied
   ctor, still not switchable — ADR 0005 decision 1 stands).

2. **`infer.ts:165`'s fork is deleted.** `let!` and `let?` become genuinely
   parallel: both bind against a two-slot monad and both get an error type
   variable. No more Task-only special case.

3. **Prelude `Task.*` v1 surface:**
   `of`, `fail`, `map`, `mapErr`, `andThen`, `recover`, `fromResult`, `match`,
   `run`, `delay`. `Task.run : Task a e -> Promise (Result a e)` — signature
   change from today's `Task a -> Promise a`.
   `combine`/`combineParallel` and any heterogeneous-tuple-typed join are
   **deferred** to a later ADR — no concrete multi-task-join use case in this
   codebase yet, and `combineTuple`'s per-index typing needs machinery
   (variadic/mapped tuples) mochi's HM doesn't have.

4. **No default memoization — `Task` follows the IO-action model, not the
   Promise model.** `Task.run = (t) => t()` — calling `run` twice re-executes
   the underlying effect. This is a deliberate divergence from
   `ResultAsync.resolve()`, which caches `this.promise` so a value can be
   `await`ed from multiple call sites without re-running its factory — but
   `ResultAsync` is modeling *a promise of a value* (even its lazy `defer`
   constructor is documented as running "at most once, only on resolve"),
   which is the right call for its own domain: a `Result` is data, and a
   `ResultAsync` should behave like the typed-Promise a `Result` eventually
   becomes.

   `Task` is not that. Per `CONTEXT.md`'s Effects section, `Task` exists
   specifically to mark the FFI/effect boundary — the discipline that
   effectful `extern`s return `Task` and pure functions don't depends on
   `Task` staying visibly, repeatably effectful. Memoizing `run` would let a
   `Task` be stashed and reused like a value, quietly erasing that boundary.
   The closer analog is fp-ts's `Task`/`TaskEither` — a bare repeatable thunk
   (`() => Promise<A>`), diverging from `Promise`'s cached/eager semantics for
   the same reason. So this ADR borrows `ResultAsync`'s *railway operations*
   (`map`/`mapErr`/`andThen`/`recover`) but not its *execution model*:
   `Task`'s value shape follows `Result`/`ResultAsync`; `Task`'s execution
   semantics follow the IO/`fp-ts` tradition. Concretely: `run`ning the same
   `Task` twice must fire the effect twice, matching what the underlying
   extern actually does (and required for `examples/life`'s per-frame
   effects, which must re-run every frame, not replay a cached result). If
   sharing is ever wanted, it becomes an explicit opt-in `Task.share`
   combinator later, not default representation behavior.

5. **Naming deviations from `ResultAsync`, each with a reason:**
   - `run`, not `resolve` — matches the name ADR 0005 already established;
     no reason to churn it.
   - `recover` only, no `orElse` alias — mochi's `Option.orElse` already means
     something else in the same prelude; keeping one name per namespace avoids
     a name meaning two different things depending on which module it's read
     next to.
   - No user-facing `fromPromise` — promise-lifting happens implicitly at the
     `extern` FFI boundary, per ADR 0005 decision 3 ("domain effects stay
     `extern`"). There's no boundary inside mochi code where a bare `Promise`
     shows up for a user to lift.

6. **`@onrails/result` stays a compiler-internal dependency only** (already
   true today — `package.json` lists it as a compiler dependency, not part of
   any emitted runtime). Emitted `Task`/`Result`/`Option` JS stays hand-inlined
   and dependency-free, matching `ResultAsync`'s shape and semantics without
   importing it — the same precedent already documented at `prelude.ts:30`
   ("runtime shape matches `@onrails/result` + `@onrails/maybe`"). Never a
   literal npm import into a compiled mochi program.

7. **`Task.mapErr` ships in this same ADR/PR, not later.** Existing
   `let!`/`Task.andThen` chains assume one error type per chain (mono-`e`, the
   same convention `Result` already follows — no `E | F` widening, see
   Alternatives). Without `mapErr`, there is no way to align two externs with
   different error shapes before binding them in one chain, which would make
   `Task a e` unusable for its main motivating case on day one.

## Consequences

- **Breaking change.** Every existing `Task` usage needs an error type:
  `examples/async` and `examples/life`'s externs (`setup : number -> Task
  number`, `draw : string -> string -> Task number`, `teardown : number ->
  Task number`) become e.g. `Task number string` or a proper domain error
  variant. No compatibility shim — per project convention, fix the call sites.
- `prelude.ts`'s `Task` JS defs grow from five (`_Task_of/_map/_andThen/
  _delay/_run`) to include `_Task_fail`, `_Task_mapErr`, `_Task_recover`,
  `_Task_fromResult`, `_Task_match`; `_Task_run`'s returned promise now
  resolves to a `Result`, not a bare value.
- `docs/language.md`'s Task section and `CONTEXT.md`'s Effects section need
  updating to describe the two-parameter shape and the deleted `infer.ts`
  special case.
- `let!`/`let?` become symmetric monadic bind sugar over the same two-slot
  shape — one shared mental model instead of "`let?` has errors, `let!`
  doesn't."

## Alternatives rejected

- **`Task.attempt : Task a -> Task (Result a e)` escape hatch**, keeping
  `Task a` single-param — rejected. Forces nesting `let?` inside `let!` at
  every call site that wants errors, hand-rolling `ExceptT` at the syntax
  level instead of fixing the base type once.
- **Porting `ResultAsync.resolve()`'s memoization verbatim** — rejected (see
  Decision 4). Its motivation doesn't transfer to a not-yet-started `Task`,
  and porting it anyway would make `run` silently value-identity-sensitive.
- **`E | F` union-widening in `andThen`**, matching `ResultAsync`'s TS
  overload-resolution trick — rejected. Not expressible in mochi's plain HM
  without row-typed error unions or ad hoc overloading; out of scope. Mono-`e`
  stays the rule, same as `Result` today.
- **`combineTuple`'s heterogeneous per-index typing** — rejected for v1, same
  reason: needs variadic/mapped-tuple types mochi doesn't have. Revisit once a
  concrete multi-task-join need shows up.
- **Importing `@onrails/result` directly into emitted programs** — rejected,
  breaks the zero-runtime-dependency emit story `Option`/`Result`/`List`
  already hold to.
- **A separate `TaskResult a e` namespace, leaving `Task a` as-is** — rejected,
  fragments one concept into two async vocabularies for no benefit over
  widening the `Task` that already exists.
