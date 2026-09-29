# 0117 — Generalize against the names that can be open, not the whole env

- **Status:** Accepted
- **Date:** 2026-09-29
- **Source:** [ADR 0115](0115-curry-fast-paths-and-exact-comparisons.md) (the profile that followed it)

## Context

`generalize` quantifies the variables of a type that are not free in the
environment. It found those by walking every scheme in the env. The env holds
the whole prelude, the module's constructors, its imports and every top-level
`let` inferred so far, and nearly all of those are closed. After ADR 0115,
`bun run bench compile --profile` put a quarter of the `bootstrap/cli.mochi`
graph's check+infer+codegen time under `generalize`, almost all of it in that
walk.

## Decision

- `generalizeOver(env, names, t, …)` (`schemes.mochi`, ported to `schemes.ts`)
  reads free variables only from the env entries named in `names`.
- Inference passes `ctx.scopeNames`: every local binder name in the module
  (`localBinderNames`, which open mode already computes), plus the names of
  each enclosing top-level group while its bodies are inferred. Those are the
  only bindings that can hold a free variable: parameters, pattern and loop
  binders, a `let … in` generalized under a lambda it captures from, and a
  group's own names, bound monomorphically until the group generalizes.
- Every other entry is closed, which is the invariant this relies on:
  - builtins, externs and namespace members, generalized against a closed env;
  - constructors, whose schemes quantify all their parameters;
  - imports, which are a dependency's top-level schemes;
  - a top-level `let`, generalized when the only other open entries are its
    own group's names, and those are removed first.
- `generalize` keeps its full walk and still serves the seeding sites, where
  the env is closed and the walk is already cheap.
- Both versions of `generalize` return early for a type with no free
  variables. The TypeScript version now does this too.

A new way to put a monomorphic binding into the env must add its name to
`scopeNames`, or add it to `localBinderNames` if it is a local binder.

## Consequences

| `bun run bench compile` (best of 8) | before | after |
|---|---|---|
| check+infer+codegen, `bootstrap/cli.mochi` graph (28 modules) | ~1240ms | ~886ms |

- `generalize` falls from ~25% of inclusive time to ~7.5%. What is left is
  zonking the type and walking it.
- During development, `generalizeOver` also ran the full walk and aborted if
  the two quantified different variables, since a narrower walk can only
  quantify more. The full test suite, bootstrap conformance, `lint:mochi` over
  the repo, and the north-star specs never tripped it. With `names` left empty,
  it tripped at once.
- The kept guards are `bootstrap/infer.spec.mochi` and
  `packages/compiler/src/infer/infer.spec.ts`. Each has a program that type
  checks only if a `let … in` wrongly generalizes a captured parameter, and
  another for the enclosing group's own name. Both fail with `names` empty.

## Alternatives rejected

**Level-based generalization** (Rémy). It gives each type variable the depth
of the `let` that created it and generalizes those deeper than the current
one, so generalization never looks at the env. That is the standard fix, but it
threads a level through `freshVar`, `unify` and every binder, in both
implementations. The name list gets most of the gain for a much smaller change.

**Caching each scheme's closedness.** Mochi has no `WeakMap`, and a field on
`Scheme` would reach the `.d.ts` emit, the TS backend and the plugin host
types.
