# 0127. The barrel takes bootstrap plugins, and exports only compile and emit

- **Status:** Accepted
- **Date:** 2026-09-30
- **Source:** [ADR 0109](0109-bootstrap-ast-is-the-public-ast.md), [ADR 0126](0126-barrel-typed-emit-on-bootstrap.md),
  #70, #104, `packages/compiler/src/bootstrap/compile.ts`

## Context

After ADR 0126 the barrel's `compile`, `codegenTs`, `emitDts` and
`compileTargets` ran on the self-hosted core, except when a caller passed
`plugins`. The barrel's plugin type was the TypeScript core's `LanguagePlugin`,
which the seed cannot run, so a plugin list sent the call back to the TypeScript
core. `emitDts` also fell back for a graph `qualify` map. The barrel also
exported `lex`, `toTypedProgram`, `toTypedProgramRecovering`,
`toTypedProgramWith`, `ImportedContext` and the `TypedProgram*` types, all of
them TypeScript core.

No production caller used any of that. The docs playground, the only consumer
of the barrel outside the compiler, calls `compileTargets` and imports
`Diagnostic` and `formatError`. Hosts that need plugins (Vite, the LSP, the CLI,
the conformance runner) already pass `BootstrapPlugin`s to the bootstrap
façades.

## Decision

- **The barrel's `plugins` option is `readonly BootstrapPlugin[]`,** passed to
  the seed with the same meaning as elsewhere: omitted = builtins, `[]` = hard
  opt-out, otherwise builtins then the list (ADR 0109). The TypeScript-core
  fallbacks are gone, and so is `compile/compile-targets.ts`.
- **`emitDts` drops `qualify`.** Single-file emit binds no imports. Graph
  declarations go through `emitDtsForFileBootstrapWith`.
- **The barrel's implementation moves to `bootstrap/compile.ts`.** It is outside
  the core directories #105 deletes, and `test/core-boundary.spec.ts` now guards
  `src/index.ts` and `src/bootstrap/` against core imports.
- **The barrel exports only compile and emit:** `compile`, `codegenTs`,
  `emitDts`, `compileTargets`, their option and result types,
  `DEFAULT_RUNTIME_IMPORT`, `BootstrapPlugin`, `Diagnostic` and `formatError`.
  `lex`, `toTypedProgram*`, `ImportedContext`, `TypedProgram*`, `LanguagePlugin`
  and `HostExtension` leave the barrel. The TypeScript `toTypedProgram*` stay on
  the `./compile` subpath for the core's own emitters and for specs, until #104
  drops the core subpaths.

## Consequences

- Specs that only use `compile`, `codegenTs`, `emitDts` or `compileTargets`
  import them from `@mochi/compiler`. The TypeScript-core `plugins` path of
  `compile` has no callers left. `test/extensions.spec.ts` now proves that
  builtins are prepended to a vendor-only list by passing `styledCvaBootstrap`.
- A `LanguagePlugin` feature the bootstrap seam lacks is no longer reachable
  through the barrel: name shadowing of builtins (ADR 0049), clash detection
  (ADR 0050) and claim-table dispatch. The rest of #104 decides whether to port
  them or retire them.
