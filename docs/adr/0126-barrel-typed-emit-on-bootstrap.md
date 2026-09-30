# 0126. The barrel's typed emit runs on bootstrap

- **Status:** Accepted
- **Date:** 2026-09-30
- **Source:** [ADR 0125](0125-bootstrap-compile-targets.md), #70, #102, #104, #105,
  `packages/compiler/src/compile/compile.ts`

## Context

The CLI, `gen-mochi-dts`, the Vite plugin and the conformance runner already
emit typed TS and `.d.ts` through the self-hosted core. The `@mochi/compiler`
barrel did not. Its `codegenTs`, `emitDts` and `compileTargets` were the
TypeScript core's, and the docs playground calls `compileTargets`. The barrel's
`compile` had already moved, keeping the TypeScript core only for a caller's
`plugins` list.

## Decision

- **`codegenTs`, `emitDts` and `compileTargets` in `compile/compile.ts` are
  thin adapters over `bootstrap/sync.ts`.** They take the barrel's options,
  apply the barrel's defaults (`runtime`, `docs` on; runtime import
  `@mochi/runtime`), and map seed diagnostics to `Diagnostic`, as `compile`
  does.
- **A caller's `plugins` list still runs the TypeScript core,** as in
  `compile`. The barrel's `LanguagePlugin` is a TypeScript-core plugin, and the
  seed cannot run one. `emitDts` also falls back for a graph `qualify` map,
  which single-file bootstrap emit does not take. #104 turns the barrel's
  plugin type into `BootstrapPlugin`, and then the fallbacks go.
- **The TypeScript `compileTargets` becomes `compileTargetsWithTsCore`,** an
  internal of `compile/`. The `./compile-targets` subpath export is dropped.
- **The TypeScript emitters stay for now.** Core `module/module.ts`, and the
  `bootstrap:tsc` north-star built on it, call `emitTsModule` and
  `emitDtsFromTyped` on TypeScript ASTs, so there is nothing to adapt them to.
  They are deleted with the rest of the core in #105. The `./codegen-ts` and
  `./dts` subpaths only serve specs until #104.

## Consequences

- The playground now shows the same TS and `.d.ts` output as the CLI. It
  differs from the TypeScript core in the ways ADR 0125 lists.
- `test/compile-targets.spec.ts` pins that the barrel's TS and `.d.ts` output
  equals the seed's. The `compileTargets` cases in `examples`, `extern` and
  `dollar-label-projection` now run against the barrel.
