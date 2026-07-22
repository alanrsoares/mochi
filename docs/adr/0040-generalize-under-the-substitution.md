# 0040 — Generalize under the current substitution (sound row generalization)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-23; `src/infer.ts` (`freeInScheme`/`freeInEnv` now take `Subst` and zonk; `generalize` threads it); `docs/adr/0034` (open-row `& A` emission); `docs/adr/0009` (`let … in` let-polymorphism); `docs/adr/0026` (TS backend)

## Context

After ADR 0039 the self-hosted `bootstrap/` emitted **14 `tsc --strict` errors**.
Six were one cluster: a leaked open-row generic `& A` where a **closed** record
was intended. The anchor was `infer.ts` Tarjan SCC (`stronglyConnected`):

```al
let connect = (v, adj, st) =>
  let st1 = { ...st, index: …, low: …, onStack: …, stack: …, counter: … } in
  let st2 = visitNeighbors(v, neighborsOf(v, adj), adj, st1) in
  eq(lowOfV(v, st2), indexOfV(v, st2))
    ? { ...st2, onStack: …, stack: …, sccs: Array.append(comp, st2.sccs) }
    : st2
```

`connect` and `visitNeighbors` are mutually recursive — one SCC, so they are
pre-bound monomorphically and should share one state row. Yet `connect` emitted
`<A, B>` with **two** tails: param `{ … } & A`, return `{ …, sccs } & B`. Because
`sccs` sat in the generic `B`, `st2.sccs` failed with **TS2339** (“Property 'sccs'
does not exist on `{ … } & A`”).

Root cause was **`generalize`**. It zonked the type being generalized but read
the environment’s schemes **raw**:

```ts
const generalize = (env, t, s) => {
  const zt = zonk(t, s);
  const bound = freeInEnv(env);       // ← no substitution applied
  …
};
```

A lambda parameter is bound as `mono('t)`. Once its var is unified to a record
`{ … | 'r }`, the scheme in the env still *reads* as the bare `'t` — `'r` is
reachable only through the substitution. `freeInEnv` therefore missed `'r`, so
the `let st2 = … in` generalizer treated `'r` as free and **quantified a row var
the environment already constrained**. That over-generalization made a
monomorphic local spuriously polymorphic; ADR 0034 then rendered the spurious
`∀`-bound row as a leaked `& A`.

This is the classic Hindley–Milner rule violation: *generalize with respect to
the substitution-applied environment*, never the raw one.

## Decision

**`freeInScheme` / `freeInEnv` take the current `Subst` and zonk each scheme’s
type before collecting free variables; `generalize` threads it in.** A row (or
type) var reachable through a monomorphic env binding is now correctly seen as
env-bound and is **not** quantified.

The fix is in the shared inference core, not behind the TS-backend flag — it is a
soundness correction, not a codegen tweak. The JS backend is untyped, so no
`.js` output changes (the fixpoint confirms it).

## Consequences

- **Bootstrap: 14 → 8 `tsc --strict` errors (−6).** The whole open-row cluster
  collapses: `infer.ts` `.sccs` (429), `infer.ts` 545×2 / 557, `codegen.ts` 382×2
  (`Set<A>`/`Map<A,…>`), `check.ts` 217 (`B[]` vs `string[]`), and the
  `parser.ts` 294/314 span/`Option` leaks that rode the same over-generalized
  chain all clear at once — they were all the *same* bug surfacing in different
  files.
- **JS byte-identical.** `bun run check` green (799 pass); the self-host fixpoint
  (`build ok` ×2) confirms every emitted `.js` is unchanged.
- **Sound, not merely tidier.** Quantifying an env-constrained var is unsound in
  general (it lets a caller pick a type the environment has already fixed). No
  existing program regressed — the corpus and bootstrap graph still typecheck —
  because the affected vars were never legitimately polymorphic.
- **Three latent leaks surfaced** (net still −6): `bootstrap/infer.al`’s own
  `freeInScheme`/`freeInEnv` build empty `VarSets` (`Set.fromArray([])`) that now
  infer `Set<unknown>` (previously masked by the over-generalization). That is an
  empty-collection-annotation gap (ADR 0035 territory), tracked as the next
  lever — not a regression from this change.
- **Guarded** by `test/ts-emit-tsc.spec.ts` (`monoRecurRow`: the mutual-recursion
  + intermediate-`let` + sibling-field-read shape, tsc-clean) and the
  `test/bootstrap-tsc.spec.ts` ratchet lowered to ≤ 8.

## Alternatives rejected

- **Emit the declared `type TSt` alias for the state param** — masks the symptom
  in one file; the bug (unsound generalization) would keep leaking `& A`
  elsewhere (it did: `parser.ts`, `check.ts`, `codegen.ts`).
- **Post-process the emitted TS to drop “unused” generics** — the generics are
  not unused; they carry accessed fields. Dropping them would be wrong TS, and
  the root inference bug would remain.
- **Zonk the env eagerly on every `env.set`** — pays the cost everywhere; only
  `generalize` needs the substitution-applied view, so zonk lazily there.

## What remains (next lever)

Of the 8, by root cause: **empty-collection annotation in a returned record**
(`infer.ts` 90/93/96, `module.ts` 83/91 — empty `#{}`/`Set` seeds inferring
`Map<unknown,unknown>` / `Set<unknown>` where the key/element is fixed by later
use; ADR 0035 extension); **`cli.ts` 21** `writeAll`’s recursive `Result` union
(the first ts-pattern arm fixes a narrow `Result` the fold widens); and the two
scattered `unknown` reads (`check.ts` 192, `infer.ts` 156). Each its own ADR.
