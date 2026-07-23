# 0028 — Typed lambda parameters via the per-node inference table

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-22; `docs/TS_EMIT_CHECKPOINT.md` (gap 1);
  `src/infer.ts` (`inferProgramTypes`, `TypeAt`); `src/codegen.ts` (`genParam`,
  `collapseLambda`, `annotate` hook); `src/codegen-ts.ts` (`emitTsModule`,
  `codegenTs`); `src/dts.ts` (HM type → TS type rendering, arity peeling);
  `docs/adr/0003` (curried surface, uncurried codegen); `docs/adr/0026` (TS backend)

## Context

ADR 0026's TypeScript backend emits `tsc --strict`-clean `.ts` for single-file and
well-behaved multi-module programs, but the self-hosted `bootstrap/` still produces
**537 `tsc` errors**. ~75% are one missing feature: the emitter annotates only
top-level function-valued `let`s (via the `annotate` hook + `bindingTsType`), and
leaves every **inner lambda parameter** bare. Under `strict`, a bare `(x) => …`
infers `any` → **TS7006** (implicit any, 131), and the `unknown`/`any` then poisons
downstream uses → **TS18046** (103) and most **TS2345** (214). The bootstrap's
higher-order style (`firstSome`, `reduce`, generic index loops) is dense with such
lambdas.

The inference pass already computes what we need. `inferProgramTypes` records a
`TypeAt[]` table (`{ span, type }`) — every expression node's zonked type, anchored
to its span, the same table hover/inlay query. `codegenTs` calls it but keeps only
`env` + `aliases` and **drops `res.types`**. The per-node types were sitting unused.

A complication shaped the design: `LamParam` carries **no span** (only the enclosing
`lambda` node does), and `bindParam` records nothing for lambda params. So we cannot
look a param up directly. But the lambda expression *itself* is recorded at `l.span`
with its full curried type `A -> B -> C`.

## Decision

**Thread the `TypeAt` table into codegen and annotate lambda params by peeling the
lambda's own recorded type — no parser/AST/infer change.**

1. `codegenTs`/`emitTsModule` keep `res.types` and build a `Map<spanKey, Type>`
   (keyed on `start:end`), exposed to `codegen` through a new `annotateParams`
   callback option (a module-level slot alongside `annotate`/`annotateCtor`; null
   for the JS backend → byte-identical output).
2. In `genExpr`'s `lambda` case, `collapseLambda` to the flat param list `[p1…pN]`,
   call `annotateParams(l.span, N)` — which looks up `l.span` in the table and peels
   N arrows off the curried type (`dts`'s `lambdaParamTypesTs`, reusing the same
   HM → TS renderer `bindingTsType` uses) — and splice each returned type after its
   param. Records/tuples/functions print consistently.
3. **Only CONCRETE param types are emitted; a type with any free type variable is
   left bare.** This was forced by a scoping fact discovered during implementation:
   a generic binding's letters (`const f: <A, B>(…) = …`) are declared on the
   const's *type*, and are **not in scope in the value expression**. Emitting `A`
   on a value-position param is therefore an out-of-scope `TS2304`, not a shared
   generic. So a param whose peeled type has a free var (`freeVars` non-empty) is
   skipped: an outer binding's generic params are already supplied contextually by
   its head, and generic inner-lambda params are usually supplied contextually by
   the higher-order function they're passed to. The params that *actually* infer
   `any` are the concrete ones (`Expr`, `string`, records of concrete fields) — no
   context pins them — and those are exactly the ones this annotates.
4. Concrete types render with an empty generics map (`tsOf(t, new Map())`), so
   records/tuples/functions print structurally and destructure params
   (`{ x, y }: { x: T; … }`, `[a, b]: [T, U]`) get a matching type too.

## Consequences

- The dominant bootstrap blocker (gap 1) drops: **537 → 299 `tsc` errors (−238,
  −44%)**. By error kind: TS7006 (implicit any) 131 → 40, TS18046 (unknown) 103 →
  24, TS2345 (arg) 214 → 170, and TS2739/TS2740 (missing props) 19 → 0. TS7006 in
  particular is designed away rather than suppressed.
- **One new-error tail as a side-effect:** TS2304 (cannot find name) 6 → 11. The
  extra 5 are concrete param types naming a variant/alias from a *sibling* module
  the importer doesn't directly import (`Stmt`, `Ty`, `AliasField`) — previously
  those params were bare `any`, so the name was never referenced. This is the
  cross-module type-import gap (adjacent to gap 3, extern `.d.ts`) surfacing, not a
  generic-letter leak: the concrete-only rule emits zero generic letters in value
  position. Net still −238; the next step (cross-module `import type` resolution)
  subsumes it.
- **JS backend untouched.** `paramTypeAt` defaults null; when unset `genParam` emits
  the bare name exactly as before, so the fixpoint self-host build stays
  byte-identical (guarded by the bootstrap differential + `bun run check`).
- Single-file `mochi ts` output also sharpens — inner lambdas now carry types, not
  just top-level bindings.
- Leaving generic params bare means the *polymorphic* higher-order tail (a truly
  generic inner callback with no contextual type) is untouched by this ADR — it
  needs generics that scope over the value, which our `const f: <A>… = …` shape
  does not provide. That, plus row-poly records (gap 2) and cross-module type
  imports, is the remaining distance. This ADR does not claim a clean bootstrap —
  it removes the largest single cause.
- New guards: `test/ts-emit-tsc.spec.ts` gains a `higherOrder` program (inner
  concrete callbacks + a generic `compose`) that emits typed params and passes
  `tsc --strict`; `test/codegen-ts.spec.ts` pins concrete inner-param annotation
  and the generic-param-stays-bare rule.

## Alternatives rejected

- **Add a `span` to `LamParam` and record each param type directly (Option A).**
  Rejected: touches the parser, AST, `bindParam`, and every LamParam producer for
  no extra information — the lambda's recorded curried type already yields each
  param type by peeling. Peeling reuses ADR 0003's uncurried-codegen shape and the
  existing `dts` arity logic.
- **Share the enclosing binding's generic letters on value-position params** (the
  first design attempted). Rejected empirically: `const f: <A,B>… = _curry(2, (a:
  A, b: B) => …)` fails with `TS2304 Cannot find name 'A'` — the `<A,B>` scopes the
  const's *type*, not its initializer. Hence the concrete-only rule.
- **Annotate every param `unknown` (with `unknown` for free vars).** Rejected: it
  clears TS7006 but manufactures TS18046/TS2345 downstream (`unknown` isn't
  assignable to `add`'s `number`), often a net wash. Emitting nothing for generic
  params and letting tsc's contextual typing fill them is strictly better.
- **Infer param types structurally in the emitter (re-derive from body usage).**
  Rejected: reinvents inference in codegen, the exact split ADR 0026 avoids —
  codegen stays a pure AST → text pass; types come from `infer.ts` via the table.
