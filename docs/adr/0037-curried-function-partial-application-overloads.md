# 0037 — Partial-application overloads for concrete curried functions

- **Status:** Superseded in part by [0093](0093-curry-type-not-overloads.md) — user bindings now type as `_Curry<[params], R>`; the overload set survives for prelude builtins (`flatFnType`) and extern hosts (`flatHostType`), whose types are generic
- **Source:** `src/dts.ts:467`, `test/codegen-ts.spec.ts:40`, `test/dts.spec.ts:27`, `test/ts-emit-tsc.spec.ts:120`

## Context

mochi functions curry; a concrete multi-param function's natural TS shape is
nested arrows (`(a: A) => (b: B) => C`). Calling it fully applied,
`tsc` infers the whole chain fine — but calling it *partially* applied and
storing the intermediate result loses precision: without an overload set,
partial application on a curried arrow type collapses parameter types to
`Option<never>`/`any` at the point `tsc` can't otherwise pin them down.

## Decision

A concrete (fully-monomorphic, non-generic) multi-param function/lambda
declares partial-application overloads in its `.d.ts`/typed-TS signature —
one overload per prefix-arity call shape — instead of a single nested-arrow
type, so calling with any prefix of its arguments returns a precisely-typed
remaining curried function rather than losing the tail's parameter types.

## Consequences

- Partially-applied concrete functions keep full type precision through
  `tsc --strict`, matching how they already behave at the value level.
- Overload sets only apply to concrete signatures — a still-generic curried
  function keeps its single nested-arrow type (no monomorphic prefix to
  overload against).

## Alternatives rejected

- **Single nested-arrow type, no overloads** — the status quo before this
  change; correct for full application, imprecise (`any`/`never`) for
  partial application.
