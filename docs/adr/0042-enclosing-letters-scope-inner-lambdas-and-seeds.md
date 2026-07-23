# 0042 — A generic binding's letters scope the lambdas and seeds nested in its body

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-23; `src/codegen-ts.ts` (`forEachScopedSpan`, `scopedNames`, `annotateParams`/`annotateEmpty` wiring); `src/dts.ts` (`allVarsIn`, `unionGenericNames`, `lambdaParamTypesTs`/`emptyCollTs` gain a `names` param); `docs/adr/0032` (generic value-lambdas), `docs/adr/0035` (empty-collection seeds), `docs/adr/0028` (typed lambda params), `docs/adr/0034` (open-row records)

## Context

After ADR 0041 the self-hosted `bootstrap/` emitted **5 `tsc --strict`
errors**. Three were one shape — the **polymorphic higher-order tail** ADR 0028
and ADR 0035 both flagged as deferred:

- `check.ts:192` — `checkSeqExhaustive`'s inner `map`/`filter` callbacks
  (`a => a.pattern`) inferred `a: unknown`. The binding is generic
  (`arms: ({ guard: Option<A>; pattern: Pattern } & B)[]`); tsc cannot recover
  the callback param through a *nested* higher-order call
  (`map(f, filter(g, arms))`), so `a` fell to `unknown` (TS18046 on `a.pattern`).
- `infer.ts:156` — `inferNsField`'s `Map.getOr(#{}, tname, ctx.ns)`: the empty
  `#{}` default's element type is `Map<string, Scheme & D>` (`D` an enclosing
  letter). ADR 0035 skipped it — not *fully concrete* — so it emitted
  `new Map([])` = `Map<unknown, unknown>` and rejected the concrete slot (TS2345).
- `module.ts:83` — the same, once `resolveImportsFrom`'s inner lambdas were left
  un-monomorphized.

The common cause: ADR 0032 gives a generic binding's **own** value lambda a
generic head (`<A, B>`) and annotates its params with those letters, but the
lambdas and empty literals **nested deeper in the body** were still handled by
the concrete-only paths (`lambdaParamTypesTs`, `emptyCollTs`), which emit
nothing when a type carries a free var. Yet a var free at such a node is, in the
common case, one of the *enclosing binding's* quantified letters — and ADR
0032's `<A, B>` head lexically scopes the entire value body, so those letters
are already in scope at the nested node. They were simply never named there.

## Decision

**Scope a generic binding's letters over the annotatable nodes nested in its
body.** For each generic top-level binding, walk its value expression
(`forEachScopedSpan`) and map every nested lambda span AND every empty-collection
literal span to that binding's own id → letter assignment (the same
`genericNames` map its head renders under). Annotation then names those letters:

- **Inner lambda params** (`lambdaParamTypesTs` gains a `names` argument): a param
  whose every type/row var is in `names` renders with the letters
  (`(a: { … } & B) => …`); otherwise it falls back to ADR 0028 (concrete-only,
  else bare).
- **Empty seeds** (`emptyCollTs` gains a `names` argument): a `#{}`/`[]`/`@{}`
  whose element type's vars are all in `names` renders them
  (`new Map<string, … & D>()`); otherwise ADR 0035's concrete-only rule stands.

The scope map is built **per binding, not as a global union.** Letters are
positional (`[...vars, ...rvars]` → `A, B, …`), so the same var id could be `A`
in one scheme and `C` in another; a nested node must use exactly its own
binding's assignment to match the head it renders under. A first attempt with a
global union regressed 5 → 12 (`infer.ts` state-threading tuples emitted `& A`
where the head declared `& C`). `allVarsIn` — unlike ADR 0035's `hasFreeVar`,
which counts type vars only — also checks a record's trailing row var, so an
open record `{ … } & R` is annotated only when `R` too carries a letter.

All behind the TS-backend hooks; the JS backend never reads these annotations.

## Consequences

- **Bootstrap: 5 → 2 `tsc --strict` errors (−3).** `check.ts:192`,
  `infer.ts:156`, and `module.ts:83` clear; annotating `resolveImportsFrom`'s
  inner lambdas also monomorphized its registry, which is what fixed
  `module.ts:83`.
- **JS byte-identical.** `bun run check` green (799 pass); the self-host
  fixpoint (`build ok` ×2) confirms every emitted `.js` is unchanged.
- **Guarded**, unlike ADR 0040/0041, by a *minimal* corpus: a
  `test/ts-emit-tsc.spec.ts` program (`innerGenericScope` — a generic binding
  with a nested `map`/`filter` callback and a nested empty seed, tsc-clean) plus
  two `test/codegen-ts.spec.ts` emit-shape assertions. The whole-graph ratchet
  drops to ≤ 2.
- **No new escape hatch.** A node whose vars are *not* all in the enclosing
  scope (a locally-generalized inner `let`, a var free in the module env) still
  stays bare — rendering it would be `unknown`, no better than tsc's own guess.

## Alternatives rejected

- **Global union of all bindings' letters** — one map keyed by var id. Simpler to
  build, but letters are positional per scheme, so an id that is `C` under its
  own binding's head can be overwritten to `A` by another binding's union entry;
  the nested annotation then contradicts the head it sits under (5 → 12).
- **Emit explicit type arguments at the call site** (`map<T, U>(…)`) instead of
  annotating the callback param — more places to get wrong, and it does nothing
  for the empty-seed case, which has no call to parameterize.
- **Chase the two remaining errors here** — the top-level `emptyReg` seed
  (`module.ts:91`) is *not* inside a generic binding, so its letters have no
  lexical scope to borrow (ADR 0035 §3's entanglement); and `cli.ts:21` is the
  `Result`-union analogue of ADR 0038. Each is a distinct lever with its own ADR.

## What remains (next lever)

2 errors: **`module.ts:91`** — the top-level `let emptyReg = { ctors: #{}, … }`
seed, passed into the generic `resolveImportsFrom` where annotating it alone
gives tsc contradictory type-arg constraints (ADR 0035 §3); and **`cli.ts:21`** —
`writeAll`'s recursive `Result` union (the `Result` analogue of ADR 0038's
array-partition close). Each its own ADR.
