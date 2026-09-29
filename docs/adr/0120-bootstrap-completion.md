# 0120. Completion on the bootstrap core

- **Status:** Accepted
- **Date:** 2026-09-29
- **Source:** [ADR 0013](0013-lsp-completion.md), [ADR 0109](0109-bootstrap-ast-is-the-public-ast.md),
  [ADR 0118](0118-bootstrap-symbol-index.md), [ADR 0119](0119-bootstrap-binder-records.md),
  `bootstrap/symbols.mochi`, `bootstrap/compile.mochi`, `packages/dx/src/bootstrap-complete.ts`,
  `packages/dx/src/complete.ts`, `test/bootstrap-symbols.spec.ts`, `test/bootstrap-complete.spec.ts`, #103

## Context

Completion was the last #103 query still on the TypeScript core. It needs
three things bootstrap did not have:

- the value bindings visible at a cursor, including nested locals. That is the
  TS index's `bindingsAt`, built from scope frames;
- a typed query that survives a hole elsewhere in the buffer, which is
  `toTypedProgramRecovering`;
- a component's props row for JSX attribute names and literal values.

## Decision

- **Scope frames in the symbol index.** `SymIndex` gains
  `frames: [ScopeFrame]`, where `ScopeFrame = { start, end, binds }`. Each
  frame is one local scope and the value binders it introduces, live across
  the span the oracle snapshots: the lambda, the `let … in` / `let?` / loop
  body, the match arm from pattern to body, and the tail of a recursive
  let-run. Frames are threaded through the existing `Walked` / `BoundScope`
  accumulators, so there is still one walker. A frame lists only binders it
  adds or rebinds, and `$` temps are skipped.
- **The host overlays them.** `FileIndex.bindingsAt(offset)` in
  `dx/src/bootstrap-index.ts` starts from module scope (prelude, then
  top-level) and applies every frame containing the offset, widest first, so
  an inner binder shadows an outer one.
- **Recovering typed query.** `compile.mochi` gains `inferTypesRecoveringWith`:
  it lexes, keeps what a recovering parse keeps, drops the parse diagnostics,
  then checks and infers. It is exposed as `inferTypesRecoveringBootstrapSync`.
- **Completion routes to bootstrap by default.** `completeAt` and
  `moduleCompleteAt` answer through `dx/src/bootstrap-complete.ts` unless the
  caller passes TypeScript-core plugins or import schemes (`dxPlugins`, ADR
  0109). Their `inferCall` and `completeMembers` hooks have no bootstrap form
  yet, so those callers keep the TS path. The lexical triggers the two paths
  share move to `dx/src/complete-triggers.ts`.
- **The module path reads the graph.** Imported bindings resolve through
  export origins. `import * as` members come from the target's origins. Record
  and JSX-prop types come from the graph's inference, with the project's
  self-hosted-core plugins, so a `styled-cva` component completes its
  `$tone` values without a TS plugin. A graph that fails to type falls back to
  the single-file recovering answer, as the TS path falls back from
  `moduleContext`. The language server passes `bootstrapPlugins` and the
  per-project bootstrap cache.

## Consequences

- Parity is checked twice. `test/bootstrap-symbols.spec.ts` compares the
  bootstrap `bindingsAt` with the TS one on every corpus file, at every frame
  edge and occurrence start. `test/bootstrap-complete.spec.ts` compares
  completion output with the TS core at sampled value, member and JSX
  positions on every import-free file. A full sweep, 1,905 single-file and
  1,609 module positions, agreed when this landed.
- With no `dxPlugins`, completion no longer touches the TS lexer, parser,
  checker, inferrer, symbol index or module cache. The prelude name tables and
  the generated HTML schema are still read as data.
- The TS completion path stays for `dxPlugins`, and `tw.` member completion is
  still TS-only. Moving it needs a host-side `completeMembers` hook on
  `BootstrapPlugin`, which is the next step toward dropping the TS path.
