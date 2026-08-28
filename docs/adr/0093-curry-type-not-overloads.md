# 0093 — a concrete curried binding types as `_Curry<[params], R>`, not an overload set

- **Status:** Accepted
- **Date:** 2026-08-29
- **Source:** `packages/compiler/src/prelude/runtime.ts` (`_Curry`), `packages/compiler/src/dts/dts.ts` (`curriedFnType`), `packages/compiler/src/codegen/codegen-ts.ts`, `bootstrap/codegen-ts.mochi`
- **Supersedes (partly):** [0037](0037-curried-function-partial-application-overloads.md) — the overload set survives for prelude builtins and extern hosts, not for user bindings
- **Refines:** [0026](0026-codegen-ts-strict-clean-backend.md) (the TS backend), [0075](0075-runtime-source-of-truth.md) (why the type lives in the runtime)

## Context

The JS backend curries every arity-≥2 binding through `_curry`, so a call site
may partially apply in any grouping — `f(a, b)`, `f(a)(b)`, `f(a, b)(c)`. A flat
`(a, b) => R` rejects all but the all-at-once form.

ADR 0037 answered this with an OVERLOAD per composition of the arity: 2^(n−1)
signatures, each written twice (declaration and inner lambda). That is correct
but quadratic in the wrong place — adding one parameter DOUBLES a function's
type. Measured on the frozen stage-1 seed, the overload blocks of the 302
monomorphic curried bindings came to 5,602 lines, 22.9% of the whole seed.

## Decision

Emit one type instead:

```ts
const sum: _Curry<[a: number, b: number], number> = _curry(2, …);
```

`_Curry` is exported from the runtime (ADR 0075) and reached by an `import type`
line, in both the emitted `.ts` and the emitted `.d.ts`. It is NOT redeclared per
module: the decls are ~13 lines and a graph emits one file per module.

```ts
export type _CurryPre<A extends unknown[]> = A extends [infer H, ...infer R]
  ? [H] | [H, ..._CurryPre<R>]
  : never;
export type _Curry<A extends unknown[], R> = [A] extends [[]]
  ? R
  : <T extends _CurryPre<A>>(
      ...args: T
    ) => [_CurryDrop<A, T>] extends [[]] ? R : _Curry<_CurryDrop<A, T>, R>;
```

Three details are load-bearing, each found by a failing typecheck:

- **Prefixes are EXACT, not `Partial<A>`.** `Partial` makes every parameter
  `T | undefined`, so `f(undefined, b)` typechecks and `_curry` binds the hole.
- **Prefixes are NON-EMPTY.** A zero-argument `f()` is faithful to `_curry` at
  runtime, but the `[]` case widens every partial-application result to a union.
- **Both conditionals are tuple-wrapped** (`[A] extends [[]]`). A `T` inferred
  as a union of prefixes otherwise distributes and leaves the call site looking
  at a union of functions rather than the return type.

## Consequences

- Seed 24,438 → 19,447 lines (−20.4%); `bootstrap:tsc` stays 0.
- Error messages improve: a mismatch now reports
  `'[string] | [string, number] | [string, number, boolean]'` — the readable
  prefix set — instead of a wall of numbered overloads.
- **`_Curry` is stricter than the overload set**, and the self-hosted emit
  measure regressed 54 → 58 (`scripts/bootstrap-self-tsc.ts`), since recovered
  to 56 by the ADR 0092 same-shape fix. All the remaining new errors
  are pre-existing MIRROR inference gaps that the overload set happened to
  accept: the self-host generalizes a `Map<string, …>` to `Map<A, …>` where the
  oracle infers it concretely. The oracle emit is unaffected (0 errors), so this
  measures the mirror, not the encoding.
- GENERIC bindings keep the nested arrow. `F extends (…a: infer A) => infer R`
  instantiates a generic signature with `unknown`, erasing the type parameters,
  so `_Curry` cannot express them. This costs nothing: a generic binding already
  emitted ONE signature, never the 2^(n−1) block.
- Prelude builtins (`flatFnType`) and extern hosts (`flatHostType`) still use
  `curriedOverloads` — their types are generic, which is exactly the case
  `_Curry` cannot serve.
