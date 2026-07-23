# 0044 — Binding type annotations (`let x : T = v`)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-23; `src/ast.ts` (`annot?` on `let`/`letin`); `src/parser.ts` (`parseOptAnnot`); `src/infer.ts` (unify the inferred value against the annotation, top-level SCC group + `letin`; `aliasMap` threaded onto `Ctx`); `src/format.ts` (print the annotation); the bootstrap mirror `bootstrap/{ast,parser,infer,check,codegen}.mochi` (`SLet` gains an `annot` field); `bootstrap/module.mochi` (`emptyReg : Registry`); `docs/adr/0005` (transparent record aliases), `docs/adr/0035` (empty-collection seeds), `docs/adr/0043` (applied-ctor casts), `docs/adr/0026` (TS backend)

## Context

After ADR 0043 the self-hosted `bootstrap/` emitted **1 `tsc --strict` error**:
`module.ts:91`, the top-level seed `let emptyReg = { ctors: #{}, types: #{} }`.

Its empty maps infer `Map<'a, 'b>`. Threaded into the generic `resolveImportsFrom`
— whose `ctx.regByPath` is inferred `Map<string, { ctors: Map<B,C>, types:
Map<D,E> }>` because nothing constrains the registry's map types — the seed left
`B,C,D,E` ungeneralized, and the emitted `.ts` failed to reconcile the
`Map<unknown,unknown>` seed with the concrete `Registry` that `checkWith` wants.
Every earlier lever was a codegen tweak; this one had no codegen fix:

- ADR 0042's letter-scoping can't reach `emptyReg` — it is not inside a generic
  binding, so there are no lexical letters to borrow.
- Annotating the seed concretely at the *emit* level (ADR 0035's `letParams`) is
  refused, and rightly: pinning the seed alone while `resolveImportsFrom` stays
  generic gives tsc contradictory type-arg constraints (ADR 0035 §3).

The hand-written `src/module.ts` has none of this trouble because it *annotates*:
`const importedReg: Registry = …`, `regByPath: Map<string, Registry>`. The gap
was in the language, not the codegen — mochi had no way to write a type
annotation, so HM generalized maximally and the emit had nothing concrete to
render. The fix is the annotation itself.

## Decision

**Add an optional type annotation to a `let` binding: `let x : T = v`** (both
top-level and `let … in`). It is a normal HM ascription — the inferred value type
is unified with the declared type before generalization — so a too-general value
is pinned to `T`, and a value that cannot be `T` is a type error at the
annotation's span.

- **Parser** (`parseOptAnnot`): after the bound name, an optional `: TypeExpr`
  (the same type-expression grammar `extern` already uses). No inline record
  syntax — a record type is named (an alias or ctor), matching the repo's
  "named types, not inline object params" convention.
- **Infer**: resolve the annotation with the existing `typeExprToType` (so a
  named record alias expands to its row) and `unify` it with the inferred value
  type. `aliasMap` — previously local to `run` — is threaded onto the inference
  `Ctx` so the `letin` case can resolve annotations too.
- **Codegen**: annotations are type-only; JS ignores them entirely, so JS output
  is byte-identical.
- **Self-host**: because `bootstrap/` compiles *itself*, the bootstrap compiler
  must also understand the new syntax to compile an annotated `module.mochi`. The
  mirror sources gain the feature for top-level `SLet` (the only form bootstrap
  uses): `SLet` carries an `annot: Option TypeExpr`, the parser fills it, and
  `inferGroupFrom` unifies it. `bootstrap/module.mochi` then declares a local
  transparent `Registry` alias (ADR 0005 — structural, so no cross-module type
  import is needed) and annotates `let emptyReg : Registry = …`.

## Consequences

- **Bootstrap: 1 → 0 `tsc --strict` errors. The self-hosted graph is
  strict-clean (537 → 0 over the ADR 0026–0044 arc).** The `test/bootstrap-tsc.spec.ts`
  ratchet is now a regression guard at 0 — the count may never rise.
- **JS byte-identical.** The self-host fixpoint (`build ok` ×2) confirms every
  emitted `.js` is unchanged; `bun run check` green (807 pass). The bootstrap
  compiler parses, infers, AND enforces the annotation, so src and self-host
  verdicts agree on `module.mochi`.
- **A real language feature, not a workaround.** Annotations are how a typed
  language pins an over-general binding; this is exactly what `src/module.ts`
  does by hand. Beyond the seed, they document intent and localize type errors.
- **Guarded** by `test/infer.spec.ts` (an annotation pins a too-general value;
  a wrong annotation is a type error; a `let … in` annotation pins a local) and
  `test/format.spec.ts` (both forms round-trip).
- **Scope held to what's used.** The bootstrap mirror covers top-level `SLet`
  only; `let … in` annotations work in the src compiler but bootstrap has no
  source that uses them, so that path is deferred there rather than gold-plated.

## Alternatives rejected

- **A codegen monomorphization pass** — detect a generic binding instantiated at
  one concrete type program-wide and emit it monomorphically. Reaches 0 with no
  language change, but it is a special-purpose whole-program analysis whose only
  purpose is to synthesize the annotation the programmer couldn't write. More
  code, less principle; the missing feature was the annotation.
- **Seed via a typed call** (`let emptyReg = exportedRegistry([])`) to launder the
  concrete type through an existing function's return. One line, no language
  change — but it changes runtime behavior to dodge a type gap and reads as a
  puzzle, not an intent. A workaround, which the annotation is not.
- **Stop at 1 error.** 99.8% strict-clean is a real milestone, but the remaining
  error had a principled fix the language wanted anyway.
- **Inline record annotations** (`let x : { … } = v`). Deferred: `TypeExpr` has no
  record form, and named types are the house style; adding inline records is a
  separate grammar decision.
