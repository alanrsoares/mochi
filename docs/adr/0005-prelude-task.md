# 0005 — Prelude `Task` (lazy async values)

- **Status:** Accepted
- **Source:** conversation (life demo delay regression; async examples), `examples/async/`, `examples/life/`, `CONTEXT.md` § Effects

## Context

Async today is a **convention**: programs invent an open applied ctor `Task a`,
re-declare `of` / `mapT` / `andThen` / `delay` / `run` as `extern`s, and ship a
hand-rolled host that implements lazy `() => Promise<a>`. Effects are not tracked
by the type system (deliberate), but the boilerplate and host curry shape diverge
from how mochi emits multi-arg calls (`f(a, b)` expects `_curry`). That mismatch
made the Life demo run frames with no sleep after an idiomatic `delay(90, 0)`
rewrite.

We want one shared `Task` namespace in the prelude (like `Option` / `Result` /
`List`), keep effects at the FFI, and avoid inventing `async`/`await`.

## Decision

1. **`Task a` is an opaque applied constructor** — List/Map-style, **not** a
   tagged variant. No `switch` on tasks; no user-visible constructors. The JS
   representation is a lazy thunk `() => Promise<a>`.

2. **Prelude namespace `Task.*`** (data-last, arity ≥ 2 wrapped in `_curry`):
   - `Task.of : a -> Task a`
   - `Task.map : (a -> b) -> Task a -> Task b`
   - `Task.andThen : (a -> Task b) -> Task a -> Task b` — keep the examples' name;
     do not rename to `flatMap` in v1 (Option/Result stay `flatMap`).
   - `Task.delay : number -> a -> Task a`
   - `Task.run : Task a -> Promise a` — the only kick-off; returns a host
     `Promise` (also an open applied ctor at the type level).

3. **Domain effects stay `extern`.** Examples drop redeclared combinators; hosts
   only bind terminal/IO primitives (`draw`, `setup`, …) that return `Task _`.

4. **Effects remain a convention**, not a checked effect system. The checker does
   not require `Task` at the FFI; prelude `Task` makes the *good* path the easy
   path. No effect rows, no colored functions, no `async`/`await` keyword in this
   ADR.

5. **Deferred (follow-up slices / ADRs):** bind sugar (`>>=`, `do`, or `let!`
   mirroring `let?` for Result); auto-wrapping multi-arg `extern` imports with
   `_curry` from signature arity.

## Consequences

- `prelude.ts` / `prelude-virtual.ts` / `gen:prelude` / `gen:runtime` grow a
  `Task` namespace; `Task` becomes a reserved namespace name like `Option`.
- `examples/async` and `examples/life` shrink to domain `extern`s + `Task.*`.
- Docs (`language.md`, `CONTEXT.md`) describe `Task` as the async value type;
  the old “ADR 0004” cite for effects policy is corrected (0004 is multi-error
  diagnostics; this ADR owns the Task/effects stance).
- Host authors who still hand-roll curried helpers must match `_curry` for
  multi-arg emit, until the extern-wrap slice lands.

## Alternatives rejected

- **`async`/`await` keywords** — fights “Task is an ordinary value” and the
  pipe-first style already shown in examples; sugar can come later as desugar.
- **Tagged `Task` variants** — wrong runtime model (lazy thunk ≠ `Some`/`None`);
  would invite exhaustive matches that cannot observe completion.
- **`Task.flatMap` only** — consistent with Option/Result, but breaks the
  vocabulary already taught by `examples/async` / life; rename is cheap later.
- **Effect rows / algebraic effects** — high cost, opaque JS, out of scope for
  a language whose north-star is readable `tsc`-clean emit.
- **Host-only `delay`** — the Life regression was exactly “multi-arg + sleep”;
  prelude `Task.delay` under `_curry` closes that footgun for everyone.
