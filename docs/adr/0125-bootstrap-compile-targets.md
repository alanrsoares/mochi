# 0125. Every emit target from one bootstrap inference

- **Status:** Accepted
- **Date:** 2026-09-30
- **Source:** [ADR 0026](0026-codegen-ts-strict-clean-backend.md), [ADR 0090](0090-bootstrap-chain.md), #102,
  `bootstrap/dts.mochi`, `packages/compiler/src/bootstrap/sync.ts`

## Context

The docs playground shows JS, typed TS and `.d.ts` for one buffer. It calls
the TypeScript core's `compileTargets`, which infers once and prints all three.
The bootstrap core could not do that in the browser. `emitDtsTextWith` lives in
`dts.mochi`, which imports `compile.mochi`, and the synchronous compile bundle
(the only seed bundle a browser loads) was built from `compile.ts` alone.

## Decision

- **`dts.mochi` exports `compileTargetsWith(src, runtimeImport, opts)`.** It
  returns `{ js, ts, dts }` from one `typedProgramWith`. `compile.mochi` exports
  the two printers it composes, `emitJsWith` and `emitTsWith`, and its own
  `compileWith` / `compileTsWith` use them, so each target matches its
  single-target entrypoint byte for byte.
- **The compile bundle is built from a generated `compile-entry.ts`.** It
  re-exports `compile.ts` and adds `dts.ts`'s `compileTargetsWith` and
  `emitDtsTextWith`. The freeze script writes and removes it, like
  `syntax-entry.ts`.
- **`bootstrap/sync.ts` exposes `compileTargetsBootstrapSyncWith` and
  `emitDtsBootstrapSyncWith`.** They are browser-safe.

## Consequences

- A corpus sweep (examples, conformance, docs app, `bootstrap/*.mochi`; 147
  files) matched the TypeScript core's JS on every file. TS and `.d.ts` differ
  on 55 files, in the ways the CLI already ships: runtime import order, JSX
  children in `{…}`, dropped lambda annotations under contextual typing, alias
  folding, and declaration order. `tsc --strict` error totals over those files
  are unchanged.
- `packages/compiler/src/bootstrap/sync.spec.ts` pins the lockstep: each
  `compileTargets` field equals its own entrypoint.
