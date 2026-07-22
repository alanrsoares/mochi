# 0041 — A scheme's bound vars are opaque when reading its free vars

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-23; `src/infer.ts` (`freeInScheme` walks the scheme's type resolving through the `Subst` but stops at the scheme's own quantified vars); follows `docs/adr/0040` (generalize under the substitution)

## Context

ADR 0040 made `freeInScheme` zonk each env scheme before collecting its free
vars, so a monomorphic binding whose var was later unified to `{ … | 'r }` no
longer hid `'r` from `generalize`. That fix cleared six errors but **surfaced
three** it had been masking: after ADR 0040 the self-hosted `bootstrap/` emitted
**8 `tsc --strict` errors**, three of them one cluster —
`freeInScheme`/`freeInEnvFrom` (`infer.ts` 90/93/96) inferring
`{ tv: Set<unknown>; rv: Set<unknown> }` instead of `VarSets`.

The two record-combinators are trivially polymorphic:

```al
let unionVarSets = (a, b) =>
  { tv: Set.union(a.tv, b.tv), rv: Set.union(a.rv, b.rv) }
```

In isolation they generalize fine (`<A, B, …>`, `Set<A>`/`Set<B>`). In the
bootstrap graph they emitted **no generic head** — the element vars rendered
`unknown`, i.e. they were *not* quantified. Instrumenting `generalize` showed
why: when it generalized `unionVarSets` (element vars `1151`/`1158`), those vars
were reported **env-bound** — via the scheme for `mkSt` (imported from
`types.al`):

```
GEN type={ rv: Set<'t1151>, tv: Set<'t1158> | 'r } -> … suppressed=1151,1158
  via env[mkSt] vars=[1165,1166,1167,1168,1169]
       zonk='t1165 -> { tv: Map<Set<'t1158>, 't1169>, rv: Map<Set<'t1151>, …>, next: 't1165 }
```

`mkSt`'s scheme **quantifies** `1166` (its map-key var), yet `1166` is also a key
in the global substitution, mapping to `Set<'t1158>`. ADR 0040's `zonk` **expands
that bound var**, so `1158` surfaces as a free var of `mkSt`'s scheme — and
`generalize` then treats `unionVarSets`'s own `1158` as already env-constrained
and refuses to quantify it. The env binding suppresses a sibling's *legitimate*
generalization. (That a quantified var is a subst key at all is a separate,
pre-existing over-generalization upstream; it was harmless until ADR 0040 began
following it.)

## Decision

**`freeInScheme` treats the scheme's own quantified vars as opaque:** it walks
the scheme's type resolving type/row vars through the substitution, but **stops
at any var in `sc.vars`/`sc.rvars`** (adds nothing, follows nothing). A bound var
has no identity outside its scheme, so whatever the substitution says it equals
is irrelevant to what the *environment* constrains — the scheme's declared
interface says the caller picks that var.

This subsumes both prior behaviors, correctly:

- **Mono scheme** (`vars=[]`, `rvars=[]`): nothing is opaque, the walk resolves
  fully through the substitution — exactly ADR 0040's zonk-then-collect.
- **Generalized scheme:** bound vars stay opaque (the pre-0040 raw read for
  *those* vars) while genuinely-free vars are still resolved through the
  substitution (ADR 0040's benefit). Neither the row-hiding leak nor the
  bound-var-expansion leak can occur.

The fix is in the shared inference core, not behind the TS-backend flag — like
ADR 0040 it is a soundness correction to free-variable computation. The JS
backend is untyped, so no `.js` output changes.

## Consequences

- **Bootstrap: 8 → 5 `tsc --strict` errors (−3).** The `Set<unknown>` cluster
  (`infer.ts` 90/93/96) clears; `unionVarSets`/`diffVarSets`/`freeInScheme` emit
  their proper generic heads and `freeInScheme` returns `VarSets`.
- **JS byte-identical.** `bun run check` green (799 pass); the self-host fixpoint
  (`build ok` ×2) confirms every emitted `.js` is unchanged.
- **Guarded** by the `test/bootstrap-tsc.spec.ts` ratchet, lowered to ≤ 5. A
  focused `.al` corpus was attempted but not landed: the trigger is a
  whole-graph phenomenon — it needs a *generalized* scheme (here the
  cross-module `mkSt`) whose bound var is also a live substitution key, which
  single-file and two-file reductions did not reproduce. The bootstrap graph is
  the reliable regression detector, consistent with the rest of this track.
- **Cheaper, too.** The walk allocates two small `Set`s per scheme and resolves
  lazily; it never materializes a fully-zonked copy of the scheme's type the way
  ADR 0040's `zonk` + `freeInType` did.

## Alternatives rejected

- **Keep ADR 0040's `zonk` and delete bound vars afterward** — too late: `zonk`
  has already replaced the bound var `1166` with `Set<'t1158>`, so deleting
  `1166` from the free set does nothing and `1158` leaks. Deleting bound vars
  only works on an *un*-expanded read.
- **Chase the upstream over-generalization that puts a quantified var in the
  substitution** — the real root, but far larger and higher-risk; opacity is the
  correct local invariant regardless (bound vars are opaque *by definition*), and
  it fixes the observed leak without disturbing the rest of generalization.
- **Clone the substitution with the bound keys removed, then `zonk`** — same
  result, but an O(subst) copy per scheme per `generalize`; the guarded walk is
  O(reachable) and allocation-light.

## What remains (next lever)

Of the 5, by root cause: **empty-collection seeds in a returned record**
(`module.ts` 83/91 — `emptyReg`'s `#{}` seeds infer `Map<unknown, unknown>`
where the key/element is fixed only by a later caller; ADR 0035 extension);
**`cli.ts` 21** `writeAll`'s recursive `Result` union; and two scattered
`unknown` reads (`check.ts` 192, `infer.ts` 156). Each its own ADR.
