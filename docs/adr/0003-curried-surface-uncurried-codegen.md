# 0003 — Curried surface types, uncurried codegen via `_curry`

- **Status:** Accepted
- **Source:** `docs/currying.md`; `docs/CRITIQUE.md` §4.4; commit `46bebd4`

## Context

The data-last prelude and `|>` thesis want curried surface types (`a -> b -> c`). But
naive nested-closure codegen both allocates on every call and — worse — created two
incompatible calling conventions (flat arithmetic vs. curried-chain HOFs) that
type-checked yet crashed at runtime.

## Decision

Keep types curried at the surface. Compile every arity-≥2 definition to a **flat** JS
function wrapped in `_curry(n, f)`, an over-application-safe bridge: a saturated call
invokes `f` directly (zero extra closures); an under-application returns a partial;
extra args are applied left-to-right. `collapseLambda` flattens `x => y => body` chains;
multi-field constructors are wrapped the same way.

## Consequences

- One calling convention everywhere — the runtime soundness bug is gone.
- Saturated calls allocate no closures; partial application still works.
- `_curry` is a load-bearing prelude helper emitted into output that needs it.

## Alternatives rejected

- Status-quo nested closures ("wait for a benchmark") — left the soundness bug live.
- Leaving arity mismatches as raw `unify` failures — addressed separately by the
  arity-mismatch diagnostic (backlog), which is worth doing regardless.
