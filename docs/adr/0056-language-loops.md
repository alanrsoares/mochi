# 0056 — Loops in the surface language

- **Status:** proposed
- **Date:** 2026-07-28
- **Source:** owner request during apps/docs architecture review ("also language loops")

## Context

mochi is recursion-only. That is the right default for an ML-family core, but
two costs show up at the host seam:

1. **Emit readability.** The compiler's promise is *readable* JS/TS output.
   Hand-written host code for iteration-heavy work (the playground editor's
   cursor/line math, byte chunking in `shared-code.ts`) uses plain loops; the
   equivalent mochi must be written as recursion and emits as recursion —
   noticeably less readable than what a person would write, which undercuts the
   "JS you'd have written by hand" pitch for hot paths.
2. **Interop pressure.** Code that would be one `for` in the host gets pushed
   *to* the host (stays TSX/TS) purely to avoid recursive phrasing, moving the
   FFI seam for a reason that has nothing to do with effects or types.

## Decision (proposed)

Add a loop construct to the surface language. Shape to be designed — candidate
directions, not yet chosen:

- `for x in xs { … }` / `while cond { … }` as `unit`-typed statements
  (ADR 0054 gives `unit` a value, so loop bodies have an honest type), or
- a `loop`/`recur` tail-recursion sugar that *emits* a JS loop while keeping
  expression semantics.

Whichever shape wins, the codegen requirement is fixed: the emitted JS/TS must
be an idiomatic loop, and the TS emit must stay `tsc --strict`-clean.

## Consequences

- Purity story must be stated: loop bodies are effectful (`unit`), which is
  consistent with ADR 0054's `ignore`/`()` direction.
- Exhaustiveness/inference untouched — loops are statements, not a new
  expression form (unless the `loop`/`recur` direction is chosen).
- Bootstrap self-host would eventually want the construct too (parser/infer
  loops are recursion-heavy today by necessity).

## Alternatives rejected

- **Stay recursion-only** — keeps the core minimal but permanently cedes
  iteration-heavy modules to the host and produces non-idiomatic emit.
- **Compiler-side tail-call optimization only** — fixes stack safety, not emit
  readability; recursion still emits as recursion or as an opaque trampoline.
