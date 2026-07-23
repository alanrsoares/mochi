# 0026 — TypeScript backend (`.ts` emission)

- **Status:** Accepted (Axis A of `docs/TS_DIALECT.md`; strict-`tsc`-clean emission)
- **Source:** conversation 2026-07-22; `docs/TS_DIALECT.md` (the dialect design —
  this ADR implements its Axis A only); `src/codegen.ts` (JS backend), `src/dts.ts`
  (HM type → TS type emitter, reused here); `docs/adr/0003` (curried surface,
  uncurried codegen — the arity-peeling `declType` depends on it); `docs/adr/0024`
  (sibling-backend shape — this ADR follows it, for a TS target instead of LLVM)

## Context

`docs/TS_DIALECT.md` reframes "make mochi a superset of TypeScript" (infeasible —
would delete the HM core) into an achievable dialect: keep HM + FP semantics, adopt
TS-shaped surface, emit typed `.ts`. That note splits the work into two independent
axes: **A. output target** (emit `.ts`) and **B. surface syntax** (accept
TS-looking syntax). This ADR is **Axis A only** — the output target. Surface syntax
(Axis B) and checked annotations are deliberately not decided here.

The repo already contains most of a TS emitter:

- `src/codegen.ts` emits readable JS per statement (`genStmt`): flat arrows,
  `_curry(n, f)` wrappers, `{ _tag, ... }` variant factories, native template
  literals. Retargeting to `.ts` is *additive* at the value level.
- `src/dts.ts` already maps HM `Type`/`Row` → TS type syntax (`tsOf`), renders
  variants as tagged unions matching the `{ _tag, _0 }` runtime, and peels arrows by
  lambda arity so `(a, b) => …` declares as `(a: A, b: B) => R` (ADR 0003). This is
  the `.d.ts` *writer*; a `.ts` file is the same types woven *inline* at each value.

The gap between `.js`+`.d.ts` and `.ts` is purely the weave: put each binding's type
on its `export const`, and emit the variant/alias `export type`s in the same file.

## Decision

Add `src/codegen-ts.ts` as a sibling backend (ADR 0024 shape: `Result<string,
AlangError>`, front end untouched). It does **not** re-implement value emission or
type rendering — it orchestrates the two existing backends:

1. **Types** come from `dts.ts`. Three of its helpers are promoted to exports
   (`bindingTsType`, `typeDecl`, `aliasTsDecl`, `referencedBuiltinTypeDecls`); their
   bodies are unchanged, so `emitDts`'s output stays byte-identical (pinned by
   `test/dts.spec.ts`). `bindingTsType` is the type string *without* the
   `export declare const name:` wrapper — the one piece both the `.d.ts` writer and
   the `.ts` backend share.
2. **Values** come from `codegen.ts`, via two small non-invasive hooks (both
   threaded through module-level slots, the pattern the existing `ctorKeys` uses;
   both absent for the JS backend, whose output stays byte-identical):
   - `annotate?: (name, value) => string | null` — for a top-level `let`, `genStmt`
     splices the returned annotation after the name: `export const area: (shape:
     Shape) => number = …`.
   - `annotateCtor?: (typeStmt, ctor) => …` — types each variant's ctor factory
     from `dts`'s `ctorFactoryTs` (params from the ctor's field `TypeExpr`s — ADR
     0015; return type = the variant), so `Circle(2)` is a `Shape`, not `any`.
3. **Runtime is imported, not inlined.** The emitted `.ts` does `import { _curry,
   add, … } from "@mochi/runtime"` (specifier configurable via `runtimeImport`)
   instead of inlining an untyped preamble. The target is `src/runtime.ts`, a typed
   module **generated** by `scripts/gen-runtime.ts` (`bun run gen:runtime`) from the
   single source of truth (`preludeJsDefs` bodies + the HM signatures in
   `preludeEnv`/`preludeNamespaces`). Each export is `export const NAME: <flat HM
   type> = <body>`: the annotation gives importers real types; the body's params
   and bare-array locals are made explicit-`any` so the trusted body just runs.
   `_curry`/`_list` are hand-typed; the 4 builtin ctors are hardcoded.

Per-binding decisions:

- **Annotate function-valued lets only.** Lambda parameters are exactly where TS
  inference is weakest (an un-annotated `(shape) => …` infers `any` params under
  `noImplicitAny`) and where the generic/nominal signature is the payoff. A
  non-function polymorphic binding has nowhere to bind generics — `dts.ts` renders
  its escaped vars as `unknown` — so annotating it would be *strictly worse* than
  letting TS infer. Those are left un-annotated.
- **Variant `type` decls are emitted as `export type` unions** (from `dts.ts`) in a
  header, alongside the typed ctor factories. No clash: TS keeps type and value
  namespaces separate.
- **Nullary ctors are annotated** (`const Red: Color = …`; a generic nullary takes
  the `never`-instance, `const Leaf: Tree<never> = …`, mirroring `None:
  Option<never>`) — otherwise `_tag` widens to `string` and won't match the union.

CLI: `bun src/cli.ts ts <file.al>` prints the typed `.ts`, mirroring the `dts`
subcommand.

## Consequences

- Front end (lex/parse/check/typecheck) untouched. `codegen.ts` gains one optional
  hook, inert unless a caller passes `annotate`. `dts.ts` gains exports, no
  behavior change. `codegen-ts.ts` is new and additive. The `.js` backend is
  unchanged and remains the default target.
- `emitDts` output is byte-stable (its internals were only extracted, not altered).
- **Emitted `.ts` is strict-`tsc`-clean end to end** — API surface *and* runtime.
  Guarded by `test/ts-emit-tsc.spec.ts` (a differential tier: emit a closed-world
  corpus, assert `tsc --strict` reports nothing) and `test/runtime.spec.ts` (the
  generated runtime's bodies behave, not just type-check).
- **New generated artifact.** `src/runtime.ts` is generated and committed;
  regenerate with `bun run gen:runtime` after any `preludeJsDefs`/signature change.
  Bodies are duplicated from `preludeJsDefs` at generation time — the "one prelude"
  invariant holds because the generator is the single derivation, not a hand-fork.
- Emitted `.ts` is **no longer self-contained**: it needs `@mochi/runtime`
  resolvable (like any codegen that imports `tslib`/`@babel/runtime`). This is the
  deliberate trade chosen over inlining a typed preamble (see Alternatives).
- **Deferred to follow-ups** (each explicit, not silent divergence):
  - *Per-node type table.* This backend only needs top-level env schemes (what
    `inferProgramTypes` already returns), not the span→type table ADR 0024 flagged.
    Inline sub-expression annotations (if ever wanted) would need that plumbing.
  - *Packaging `@mochi/runtime`.* The specifier defaults to a package name not yet
    published; consumers set `runtimeImport` (the differential test points it at
    `src/runtime`). Shipping the runtime as a real package is unbuilt.
  - *Module graphs.* `codegen-ts` covers single files; a `build --emit=ts` over the
    `module.ts` graph is unbuilt.
- Does not touch the bootstrap self-hosting track (`docs/V1.md`) — independent, no
  priority claim over it.

## Alternatives rejected

- **String-splice post-processor over `codegen()` output** (regex `const name =` →
  `const name: T =`). Fragile and violates the "pure `Program → string`" backend
  invariant (ADR 0024). The `annotate` hook threads the type through the real
  emission point instead.
- **Fully independent value emitter in `codegen-ts.ts`.** Would duplicate all of
  `genExpr`/pattern-compilation and drift from the JS backend. Rejected — reuse the
  one backend via the hook.
- **Inline a typed runtime** (keep the emitted `.ts` self-contained, but emit the
  preamble with types) instead of importing `@mochi/runtime`. Rejected: it forks
  the prelude def strings (the JS backend needs untyped ones, the TS backend typed
  ones) and forces a codegen "TS target" mode to type the preamble. Importing a
  generated typed module keeps one derivation and matches how real compilers ship a
  runtime (`tslib`, `@babel/runtime`). The cost — emitted `.ts` is no longer
  self-contained — was accepted deliberately.
- **`--emit=ts` flag on the default compile command** instead of a `ts` subcommand.
  The subcommand mirrors `dts`/`build`/`fmt` and keeps the default path's type
  (`compile: src → JS`) unchanged. Minor; revisit if a flag reads better.
