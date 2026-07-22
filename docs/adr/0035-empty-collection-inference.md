# 0035 — Empty-collection seeds get an annotation at the binding (TS backend, ADR 0034's tail)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-23; `docs/TS_EMIT_CHECKPOINT.md` (empty-collection gap, TS2345 in `infer.ts`/`module.ts`); `src/infer.ts` (`recordEmpty`, `noteLet`/`noteUse`, `resolveLetParams`, `letParams`); `src/dts.ts` (`emptyCollTs`, `hasFreeVar`); `src/codegen.ts` (`annotateEmpty`, `annotateLetin`); `src/codegen-ts.ts` (wiring); `docs/adr/0034` (open-row records); `docs/adr/0032` (generic value-lambdas); `docs/adr/0028` (typed lambda params); `docs/adr/0026` (TS backend)

## Context

After ADR 0034 the self-hosted `bootstrap/` emitted **33 `tsc --strict` errors**,
no longer one shape. One of the two remaining classes: **empty-collection
inference**. An empty `#{}` emits `new Map([])` → tsc infers `Map<unknown,
unknown>`; an empty `Set.fromArray([])` → `Set<never>`. These seed the state of
the Tarjan SCC pass (`infer.ts`) and the module registry (`module.ts`), where a
concrete `Map<number, number>` / `Map<string, …>` is expected — TS2345.

Two sub-shapes, distinguished by how HM treats the seed:

1. **Concrete seed.** `{ index: #{}, counter: 0 }` where the fold pins the map
   to `Map<number, number>`. Here the seed's zonked type IS concrete; it just
   wasn't rendered onto the empty literal.
2. **`let`-generalized seed.** `let initSt = { index: #{}, … } in …`. The
   `let` binder is **generalized**, so `initSt` gets scheme `∀ k v. { index:
   Map<k, v>, … }` and each *use* instantiates fresh vars. The body's fold pins
   those fresh copies to `number`, but the seed's own vars stay quantified —
   free after zonk. The emitted `let … in` IIFE (`((initSt) => body)(value)`)
   makes it worse: tsc infers the untyped param from the argument (empty
   collections → `unknown`), then checks `body` against that, so the fold's
   concrete requirement never flows back to the seed. Top-level `let emptyReg =
   { ctors: #{}, … }` is the same story with a `const` instead of an IIFE.

## Decision

**Annotate at the binding, not (only) at the literal.** Contextual typing flows
from a param/`const` type annotation into the value expression, which is exactly
what an empty literal needs and what arg-based inference through an IIFE cannot
provide.

Three coordinated changes, all behind TS-backend options (JS backend untouched):

**1. Concrete empty literals annotate in place.** `infer.ts`'s `recordEmpty`
records the span→type of an empty `#{}`/`[]`/`@{}` (only empties — a non-empty
literal's element type is inferable from its members). `dts.emptyCollTs` renders
that type when it is **fully concrete** (`hasFreeVar` false), else null — a free
var would render `unknown`, no better than tsc's own guess. `codegen` emits
`new Map<K, V>()` for a map and `([] as E[])` for an array.

**2. A `let`-bound value used at one monomorphic type annotates its binding.**
`infer.ts` collects, per `let` scheme, every instantiation the body makes
(`noteUse`, fired from the `ref` case) against the scheme it registered
(`noteLet`, for both `let … in` binders and top-level lets). `resolveLetParams`
keeps a binding only when **every** use is the same fully-concrete type, and
exposes it as `InferResult.letParams` (kept apart from `types` so hover/inlay are
untouched). `codegen-ts` annotates the emitted IIFE param (`((initSt: { … }) =>
…)`) or top-level `const` (`const emptyReg: { … } = …`) with it; contextual
typing then types the empty collections inside the value — no in-place literal
annotation needed there.

**3. "Every use agrees" is deliberately strict.** A binding that ALSO flows into
a generic position (leaving its type open there) stays bare. Pinning it concrete
would over-constrain that call *and its sibling empties*: e.g. `emptyReg` passed
into a generic `resolveImportsFrom(…, { imports: #{}, reg: emptyReg, keys: #{} })`
— annotating `emptyReg` alone, while `imports`/`keys` stay `Map<unknown,
unknown>`, gives tsc contradictory type-arg constraints and emits *more* errors
(28 vs 26 when the rule was loosened). That entanglement is the polymorphic-HOF
tail, a separate gap; the strict rule leaves it alone.

## Consequences

- **Bootstrap: 33 → 26 `tsc --strict` errors (−7).** The empty-collection
  let-generalized-seed class in `infer.ts` (Tarjan state, `instantiate`
  substitution maps) is eliminated. The two `module.ts` `emptyReg` errors remain
  — they are entangled with the polymorphic-HOF tail (see above), not this gap.
- Guarded by `test/ts-emit-tsc.spec.ts` (`emptyColl` corpus program: a `#{}`
  seed threaded through a fold via both a `let … in` binder and a top-level one,
  tsc-clean) and three `test/codegen-ts.spec.ts` emit-shape assertions
  (in-place `new Map<number, number>()`, IIFE-param annotation, `const`
  annotation).
- JS backend byte-identical — `recordEmpty`/`noteLet`/`noteUse`/`letParams` only
  populate the inference result the JS codegen never reads, and `annotateEmpty`/
  `annotateLetin` default null off-TS. Self-host differential build green; `bun
  run check` 798 pass.
- Hover/inlay unaffected: the monomorphic use types live in `letParams`, a field
  separate from the `types` table those surfaces key off.

## What remains (next lever)

**The polymorphic higher-order tail** (ADR 0028's deferred class) is now the
dominant remaining shape: generic inner callbacks with no contextual type — `A[]`
vs `Stmt[]` (`infer.ts`), `Set<A>` vs `Set<B>` (`codegen.ts`), `Stmt` vs `(a:
Stmt) => unknown` (`parser.ts`), plus the two entangled `module.ts` `emptyReg`
seeds. It needs generics scoping over more value positions than ADR 0032 reaches.
Smaller residuals: TS2322 5, TS2554 3 (arity), TS2339 1, TS18046 1. Each its own
ADR.
