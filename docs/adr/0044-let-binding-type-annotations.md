# 0044 — `let x : T = v` binding type annotations (a language feature)

- **Status:** Accepted
- **Source:** `src/parser.ts:320`, `src/{ast,infer,check,codegen}.ts`, `bootstrap/{ast,parser,infer,check,codegen}.mochi`, `test/infer.spec.ts:61`

## Context

A `let` binding's value sometimes needs its declared type unified against
the value's inferred type *before* generalization, not after — e.g. an empty
registry seed (`let emptyReg : Registry = …`) needs `Registry`'s concrete
row pinned immediately so a later `resolveImportsFrom` doesn't generalize
open fields the declared type already closes. This is a real gap in what the
source language can express, not a codegen workaround: no existing
mochi syntax lets a `let` pin its value's type against a declared one.

## Decision

Add optional `: TypeExpr` binding-type-annotation syntax after a `let`'s
name: `let x : T = v`. The annotation unifies the value's inferred type
against `T` *before* generalization runs, so `T`'s row shape (open/closed)
governs generalization rather than being inferred purely from `v`. Threaded
as a `SLet` `annot` field across the full self-hosted mirror
(`bootstrap/{ast,parser,infer,check,codegen}.mochi`), not just `src/`,
because bootstrap needed the same feature to express `emptyReg`'s pinned
type in its own module-registry code. Type-only — emits byte-identical JS to
an unannotated `let`.

## Consequences

- Closed the last strict-`tsc` self-host error (1 → 0), completing the
  ADR-0026 TS-dialect track's ratchet to zero.
- A genuine new piece of concrete syntax (not sugar over an existing form),
  so it had to be taught to lexer/parser/infer/check/codegen on both `src/`
  and `bootstrap/` sides, and to the self-hosted compiler's own bootstrap of
  itself.

## Alternatives rejected

- **Monomorphize the binding instead of annotating it** — loses reusability
  at other call sites that need the same value genuinely generalized.
- **A dedicated `exportedRegistry()` wrapper function as a workaround** —
  papers over the missing language feature rather than fixing the gap.
