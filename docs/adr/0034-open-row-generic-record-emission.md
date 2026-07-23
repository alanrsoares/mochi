# 0034 — Open-row records emit as generic intersections (TS backend, ADR 0033's tail)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-23; `docs/TS_EMIT_CHECKPOINT.md` (row-poly record tail, TS2345 in `infer.ts`); `src/dts.ts` (`genericNames`, `tsRow`); `src/codegen-ts.ts` (`genericBindingLambda` gate); `src/codegen.ts` (`genGuardArm` predicate emission); `docs/adr/0033` (flat function types); `docs/adr/0032` (generic value-lambdas); `docs/adr/0031` (guard-form type predicates); `docs/adr/0028` (typed lambda params); `docs/adr/0026` (TS backend)

## Context

After ADR 0033 the self-hosted `bootstrap/` emitted **58 `tsc --strict` errors**,
dominated by **TS2345 (48)**, concentrated in `infer.ts` (33). All one shape: a
partial record literal `{ next }` flowing where the full inference state
`{ tv, rv, next }` is expected.

Root cause is `types.mochi`'s state threading —
`freshVar = st => (tVar(st.next), { ...st, next: add(st.next, 1) })`. Algorithm W
infers an **open-row** parameter `st: { next: Int | r }` and returns it spread
unchanged, so the binding's scheme is `∀ r. { next: Int | r } -> (Ty, { next: Int
| r })`. But the TS backend rendered the open row as a **CLOSED** record
`{ next: number }`, dropping the row variable `r`. Callers pass the full state
`{ tv, rv, next }`; `freshVar`'s emitted return `{ next: number }` is then missing
`tv`/`rv` and rejected against the full-state param — TS2345.

The row variable was invisible on two counts: `Scheme.rvars` was never assigned
generic letters (only `Scheme.vars` was, in `genericNames`), and `tsRow` walked
the `extend` chain but discarded whatever tail it ended on.

## Decision

**Emit an open row as `{ …fields } & R`, binding `R` as a generic on the
enclosing scheme.** Row-polymorphism is structural subtyping; TS spells that as an
open object type via intersection with a fresh type parameter. A field-subset
record then unifies with the full state (the caller binds `R` to the extra
fields) and the spread result flows back into it.

Three coordinated changes, all behind TS-backend options (JS backend untouched):

**1. `genericNames` assigns letters to row vars too.** `freshVar`/`freshRowVar`
draw from a single shared id counter (`types.ts`), so type-var and row-var ids
never collide — one `Map<number, string>` keyed by id serves both: `tsOf` looks
up a type var, `tsRow` looks up an open row's tail. The scheme's generic head
(`bindingTsType`, `genericLambdaParams`) is built from all the map's values, so
row-var letters join it automatically.

**2. `tsRow` renders an open tail as `({ …fields } & R)`.** The parentheses
matter: `&` binds looser than the `[]` an array wrapper appends, so a bare
`{ … } & R` element would mis-parse as `{ … } & (R[])`. A quantified rvar carries
a letter; an **unbound** one (a non-lambda binding, which has no head to scope a
generic on) falls back to the closed record — the pre-0034 behavior, unchanged.

**3. The generic-head gate widens to rvar-only schemes.** `codegen-ts.ts`
registered a binding for full generic-head treatment (ADR 0032) only when
`sc.vars.length > 0`. A row-poly binding like `freshVar` has **no** type vars —
just an rvar — so it was skipped and its param fell to a concrete closed record.
The gate is now `sc.vars.length > 0 || sc.rvars.length > 0`.

### Fallout: guard predicates vs. open scrutinees

Opening scrutinee rows collided with ADR 0031's type-predicate guards. A
whole-value pattern (`[]`, `_ when g`) lowers to `.with((_v): _v is <base> =>
…)`, where `<base>` is `guardBaseType`'s **closed** rendering of the scrutinee.
Once the param is open (`{ … } & R`), that closed `base` is no longer assignable
to it — TS2677.

Such predicates never *refined* anything (target `=== base`); they existed only
to satisfy ADR 0031's nested-narrowing need, which these arms don't have. So
`genGuardArm` now emits a type predicate **only when it genuinely refines**
(`patTarget(p, base) !== base`); otherwise it emits a plain boolean guard, which
leaves `_v` at its declared open type. The guard body still binds `const _g: any
= _v` in both forms (the test expression references `_g`).

## Consequences

- **Bootstrap: 58 → 33 `tsc --strict` errors (−25).** TS2345 48 → 23; the entire
  `infer.ts` "partial record vs full state" class eliminated; TS2677 stayed at 0.
- `bump`-shaped state threading now emits `<A>(st: ({ n: number } & A)) => ({ n:
  number } & A)`; field access emits `<A, B>(r: ({ x: A } & B)) => A`. Guarded by
  `test/codegen-ts.spec.ts`.
- JS backend byte-identical — all three changes are gated on TS-backend context
  (`guardBaseType` null off-TS; the generic head/`& R` only fire through the
  typed emitter). Self-host differential build green; `bun run check` 793 pass.
- A non-lambda polymorphic binding with an open row still degrades to a closed
  record (no head to bind `R`); unchanged and out of scope.

## What remains (next lever)

The remaining 23 TS2345 are no longer one shape — the row-poly class is gone.
They split into two *different* gaps: **empty-collection inference** (`Map.empty`
→ `Map<unknown, unknown>` flowing where a concrete map is expected, e.g.
`module.ts`, `infer.ts` Tarjan state) and the **polymorphic higher-order tail**
(generic inner callbacks with no contextual type — `A[]` vs `Stmt[]`, `Set<A>` vs
`Set<B>`, `Stmt` vs `(a: Stmt) => unknown`), the same class ADR 0028 deferred.
Smaller residuals: TS2322 5, TS2554 3 (arity), TS2339 1, TS18046 1. Each is its
own ADR.
