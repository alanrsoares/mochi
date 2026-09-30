# 0129. Seed parity: per-let type errors, graph diagnostic kinds, `.d.ts` alias folding

- **Status:** Accepted
- **Date:** 2026-09-30
- **Source:** [ADR 0004](0004-multi-error-diagnostics.md), [ADR 0092](0092-record-alias-index.md),
  [ADR 0105](0105-bootstrap-conformance-oracle.md), [ADR 0106](0106-pin-record-alias-vars.md), #104,
  `bootstrap/infer.mochi`, `bootstrap/module.mochi`, `bootstrap/dts.mochi`
- **Amends:** ADR 0004 §3, ADR 0105

## Context

Moving the `test/*` language guards onto the seed (#104 slice b2) turned up
three places where the self-hosted compiler did less than the TypeScript core
it replaces:

1. **Type errors.** The seed stopped at the first failing top-level `let`. The
   TypeScript core collected one error per failing SCC member and per top-level
   expression statement (ADR 0004 §3).
2. **Graph diagnostic kinds.** Seed graph errors (`module.mochi` `MErr`, host
   `bootstrap/index.ts`) had no `kind`, so editors printed graph check errors as
   `type: …`. The conformance runner also compared only message and span, even
   though ADR 0105 names the kind as part of the contract.
3. **`.d.ts` aliases.** The seed's `.d.ts` folded only parameterless aliases,
   through the `recs` shape index. The core folded parametric and tuple aliases
   on binding types (`b: Box<number>`), taking the first alias in declaration
   order.

## Decision

- **The seed collects type errors per top-level `let`** (`inferGroupFrom`,
  `processGroupsFrom`, `inferExprStmtsFrom`). A failed member keeps its
  pre-bound mono var, which stays *fresh*: the seed's state is a value, so the
  failed body's partial solution is dropped. The TypeScript core's in-place
  substitution kept it. If a member fails *after* its value typed (the
  self-unify or the annotation check), the value's solution stands. Inner
  expressions stay first-error-wins, including adjacent local lambda groups
  (ADR 0067). Single-file compile, module JS and editor recovery report every
  error. The typed-query, TS-emit and dts graph rails still return the first
  error at the host API.
- **Graph diagnostics carry `kind`**, as the TypeScript core's did:
  - `check`: cycle, unreadable module, missing export, duplicate constructor,
    per-module check-pass errors.
  - `type`: inference errors.
  - `lex` / `parse`: a module's own lex and parse errors.

  The conformance runner compares `kind` in every `diagnostic` and
  `graph-diagnostic` expectation.
- **The seed's `.d.ts` folds binding types with hover's folder**
  (`schemes.foldAliasesAt`). It folds over the file's own aliases in declaration
  order, and the first match wins. Dependency aliases stay structural (ADR 0092),
  and phantom parameters are skipped. The `dtsBinding` hook still sees the
  unfolded type. The nullary `recs` index (ADR 0106) still drives declaration
  bodies, constructor fields and the typed-TS backend. Folding there is
  deferred: a shared `fieldTs` change would reopen the `LocTok` / `LocTok<t>`
  import-owner collision.

## Consequences

- Error order follows SCC order (dependencies first), as in the TypeScript core.
- At landing, the temporary differential suite compared full error lists with
  alpha-normalised type variables, except the documented `infer.mochi` cascade
  divergence. #104 slice c retired that suite; direct inference specs and the
  required conformance cases below now own the behavior.
- New required conformance cases: `multiple-type-errors`,
  `graph-qualified-missing-type`, `graph-type-error` and `dts-param-alias`.
  Every diagnostic expectation now records its `kind`.
- Still diverging from the core: `.d.ts` declaration bodies and the typed-TS
  backend print parametric aliases structurally. Graph errors put the module in
  a `module '<path>': ` message prefix rather than a `path` field. Dependency
  lex/parse errors from the seed's `loadGraph` carry no path. The rest of #104
  and #105 track these.
