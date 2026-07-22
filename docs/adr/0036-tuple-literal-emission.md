# 0036 — Tuple literals emit via a `_tuple` helper so tsc infers tuples (TS backend)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-23; `docs/TS_EMIT_CHECKPOINT.md` (the 26-error tail decomposed by root cause); `scripts/bootstrap-tsc.ts` (measurement); `src/codegen.ts` (`tupleHelper` flag, tuple case); `src/prelude.ts` (`_tuple` JS def); `scripts/gen-runtime.ts` (`_tuple` TS type override); `src/codegen-ts.ts` (wiring + dep injection); `docs/adr/0026` (TS backend); `docs/adr/0035` (empty-collection seeds)

## Context

After ADR 0035 the self-hosted `bootstrap/` emitted **26 `tsc --strict` errors**.
The checkpoint labelled the whole remainder "polymorphic-HOF tail", but running
the freshly-promoted `bun run bootstrap:tsc` and grouping by *root cause* (not TS
code) showed several distinct clusters. The largest clean one — **tuple
widening**, 4 errors with a single cause:

A tuple erases to a JS array `[a, b]` (ADR 0015-era decision, like ReScript). In
TypeScript a bare array literal is inferred as an array, not a tuple: `[x, rest]`
with `x: Pattern` and `rest: Option<Pattern>` infers `(Pattern | Option<Pattern>)[]`,
not `[Pattern[], Option<Pattern>]`. Where a contextual tuple type is in scope tsc
would keep the tuple, but the failing sites have none — the literal sits inside a
generic call (`Some(…)`, `Ok(…)`), a ts-pattern arm return, or a monomorphic
binding whose declared type (from HM) *is* a tuple. So the widened array is
checked against the declared tuple and fails:

- `check.ts:94` `Option<[Pattern[], Option<Pattern>]>` built via `Some((…, …))` — TS2322.
- `types.ts:51`, `codegen.ts:187`, `parser.ts:260` — annotated tuple return / tuple-in-`Ok` — TS2345.

## Decision

**Emit a tuple literal as `_tuple(a, b)` in the TS backend**, where `_tuple` is a
runtime identity typed `<T extends unknown[]>(...xs: T): T`. A rest parameter
constrained to an array is inferred by tsc as a **tuple**, so `_tuple(x, rest)`
is typed `[typeof x, typeof rest]` — the tuple survives with no contextual type
and, crucially, **without naming the element types** at the call site. Naming
them (`[a, b] as [T0, T1]`) was the obvious alternative but reintroduces the
TS2304 hazard ADR 0028/0032 fight: a generic element letter (`A`) is out of scope
in a value position. Inference through the rest param sidesteps that entirely.

Behind a TS-only `tupleHelper` codegen flag (default off):

1. `src/prelude.ts` gains `_tuple: "const _tuple = (...xs) => xs;"`. JS emit never
   references it (tuples stay bare `[a, b]`), so `collectRuntimeDeps` tree-shakes
   it out of every JS module — it exists **only** so the generated typed runtime
   can carry a `_tuple`.
2. `scripts/gen-runtime.ts` `OVERRIDES` types it `<T extends unknown[]>(...xs: T): T`
   (structural, no HM signature — same treatment as `_list`/`_curry`).
3. `src/codegen.ts` emits `_tuple(…)` for `{ kind: "tuple" }` when `tupleHelper`
   is set, else the bare `[…]`.
4. `src/codegen-ts.ts` sets `tupleHelper: true` and, since a tuple AST node
   carries no runtime-name reference for `collectRuntimeDeps` to find, injects
   `_tuple` into the import list when the emitted body text uses it (mirroring how
   `builtinDeclsIn` post-scans the body for guard-predicate variant names).

## Consequences

- **Bootstrap: 26 → 22 `tsc --strict` errors (−4).** All four tuple-widening
  errors clear; no new errors. The remaining 22 are other clusters (generic-leak
  HOF, open-row state, the `NonExhaustiveError`/`never` match-return class, the
  `_curry` arity gap) — each its own lever.
- **Measurement is now in-repo.** `scripts/bootstrap-tsc.ts` (`bun run
  bootstrap:tsc`) emits the graph via `buildModulesTs` (pointing `runtimeImport`
  at `src/runtime`, so no `sed`), runs the repo's `tsc` over a strict tsconfig in
  a scratch dir, and reports counts by code/file — replacing the ad-hoc `/tmp/bts`
  recipe the checkpoint carried. `--json`/`--list`/`--keep` for detail.
- **Guarded** by `test/ts-emit-tsc.spec.ts` (`tuples` corpus: a concrete tuple
  return and a generic tuple built in a match arm and wrapped in `Some`, tsc-clean)
  and `test/bootstrap-tsc.spec.ts` — a **ratchet** asserting the whole-graph count
  stays ≤ 22, to be lowered as future levers land.
- **JS backend byte-identical.** `tupleHelper` defaults off; JS tuples stay `[a,
  b]` and `_tuple` is never inlined. Self-host fixpoint (`build ok`) confirms it;
  `bun run check` 798 pass.
- **Readability cost:** TS emit shows `_tuple(a, b)` rather than `[a, b]`. Judged
  worth it — the wrapper is a named identity and the output now typechecks, which
  is the track's whole point. Concrete `as`-annotation was rejected for the
  generic-scope hazard above.

## What remains (next lever)

Of the 22, by root cause: **generic-leak HOF** (`B[]`/`Set<A>`/`Map<A,…>` where
concrete expected — `check.ts`, `codegen.ts`, `infer.ts`); **open-row state**
(`infer.ts:429` `.sccs` on `& A`, `infer.ts:545`, the two `module.ts` `emptyReg`
seeds); the **`NonExhaustiveError`/`never` match-return** class (`cli.ts:21`,
`infer.ts:487`, and the `swap`-style single-arm tuple case that surfaced while
writing this ADR's guard); and the **`_curry` arity** gap (`parser.ts:310/314`
TS2554 "expected 3, got 2"). The generic-leak and open-row clusters are the
polymorphic-HOF tail proper — they need generics scoping over more value positions
than ADR 0032 reaches. Each its own ADR.
