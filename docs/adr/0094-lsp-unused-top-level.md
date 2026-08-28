# 0094 — Unexported top-level bindings are LSP warnings

- **Status:** Accepted
- **Date:** 2026-08-29
- **Source:** `packages/dx/src/diagnostics.ts`,
  [ADR 0070](0070-lsp-unused-locals.md) (extends)

## Context

ADR 0070 publishes an `unused-local` warning for named local bindings and states
that "top-level declarations and imports are excluded". The exclusion was
conservative rather than principled: a top-level name might be imported by
another module, and the LSP analyses one file.

That reasoning only holds for **exported** names. An unexported module-scope
`let` is file-private by construction, so the file the editor already has open
is the entire search space — the same closed world the local analysis enjoys.

Running the check over this repo's own `.mochi` corpus found three dead
bindings in the self-hosted compiler (`bootstrap/parser.mochi`'s
`setExternExported`, `bootstrap/plugins/jsx.mochi`'s `jxSpanning`) that no
existing gate reports.

## Decision

The LSP publishes an `unused-top-level` warning for a module-scope `let` that
is not exported and has no reference outside its own statement. Exported
bindings, `type`/`extern` declarations, and imports stay excluded. A leading
`_` suppresses it, matching the local convention.

References from *inside* the binding's own statement do not count, or every
self-recursive function would keep itself alive.

## Consequences

- Compilation and CLI diagnostics remain unchanged: this is editor feedback.
- A mutually recursive dead group still reads as used. Detecting it needs
  reachability from an exported root, not liveness — a different analysis, and
  the same blind spot `tsc` has.
- Effectful top-level bindings are flagged. Mochi has no top-level expression
  statement, so an entry point is written `let runEntry = isCliEntry(()) ? …`
  (`bootstrap/cli.mochi`); the name exists to hold an effect, not to be read.
  `_` is the marker for that, as it is for a parked local.
- Showcase files bind values to demonstrate syntax and now warn throughout —
  95 warnings across the corpus, 56 of them in `examples/example.mochi`. This
  is accurate, not a defect, and it is warning-only.

## Alternatives rejected

**Restrict the warning to lambda-valued bindings.** It would quiet the showcase
files (95 warnings down to 25), but it drops real finds: `setExternExported` is
a partial application and `runEntry` a conditional, and both are as dead as any
unused function.

**Keep the ADR 0070 exclusion and rely on a separate dead-code pass.** A
whole-graph reachability pass is the stronger analysis, but it belongs to the
build, not to per-file editor feedback, and it would not have been written now.
