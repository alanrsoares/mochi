# 0004 — Multi-error diagnostics (check + infer)

- **Status:** Accepted
- **Source:** DX slice 12 grilling, ADR 0003 decision 7 (superseded here)

## Context

ADR 0003 kept a one-error railway (`Result<T, Diagnostic>`) so multi-diagnostic
collection would not invent cascading junk without recovery rules. Editor DX now
needs several independent check/type findings in one publish (CLI + LSP). Lex and
parse recovery remain expensive (`ParseAbort`, sequential lex) and are out of
scope.

## Decision

1. **Check and infer return `Result<T, Diagnostic[]>`.** Hard fail: no value when
   any diagnostic is present. Lex and parse stay `Result<T, Diagnostic>`; pipeline
   seams (`compile`, `toTypedProgram`, module drivers, CLI/LSP) wrap a single
   error as a one-element array.

2. **Check collects all independent findings** in one walk (reserved names, stray
   ctor fields, non-exhaustive switches, …). Do not stop after the first.

3. **Infer collect-and-bails per top-level / SCC member.** Inner expression
   inference stays first-error-wins (`Result<Type, Diagnostic>`). On failure for a
   binding: record the diagnostic, leave the pre-bound fresh mono type var in the
   env (so later bindings do not cascade unbound noise), skip generalizing that
   member, continue siblings and later SCCs.

4. **CLI and LSP publish every diagnostic** in the array. No artificial cap.
   Codegen still only runs on `Ok`.

5. **Poison / error types and soft typed-programs are deferred.** Soft
   `TypedProgram` + diags (hover under broken code) and unify-with-error types are
   a later slice if collect-and-bail proves too thin.

## Consequences

- `compile` / `toTypedProgram*` / module graph Err type becomes `Diagnostic[]`.
- Call sites that read `result.error` as a single `Diagnostic` must take arrays.
- ADR 0003 decision 7 is superseded; richness (labels/help/suggestions) still
  rides on each individual `Diagnostic`.
- Tests cover multi-check, multi-infer across lets, and single-diag-inside-one-expr.

## Alternatives rejected

- **Whole-pipeline multi-error (lex/parse recovery)** — high cost; not needed for
  the editor win of “several type/check squiggles.”
- **Soft `{ value?, diagnostics }`** — enables hover under errors but widens every
  tooling seam; revisit with poison types.
- **Poison / error type in v1** — correct long-term for intra-expression recovery,
  but unused while the railway stays hard-fail with no partial `T`.
- **Keep one-error railway** — rejects the DX goal of slice 12.
