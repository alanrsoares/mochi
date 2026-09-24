# 0108 — the Bun `.mochi` loader ships in `@mochi/bun`

- **Status:** Accepted
- **Date:** 2026-09-24
- **Source:** `packages/bun/src/{plugin,preload}.ts`, `packages/cli/src/cli.ts` (`dts --write`), `scripts/gen-mochi-dts.ts`
- **Refines:** [0063](0063-bun-standard-library.md), [0086](0086-bun-test-bindings.md)

## Context

`@mochi/bun/{cli,terminal}` export `.mochi` source. Vite users get it compiled by
`@mochi/vite-plugin`; a plain Bun process had nothing, so `bun examples/life/main.js`
failed on the first `extern` since 0063 shipped the package. The only Bun loader was
`@mochi/test/plugin` (0086), which exists to run `*.spec.mochi` — the wrong home for
the thing every Bun consumer of a Mochi package needs.

## Decision

The Bun loader moves to `@mochi/bun`: `@mochi/bun/plugin` (the `BunPlugin`, plus
`compileMochiGraph` / `compileMochiFile`) and `@mochi/bun/preload` (registers it).
A Bun program that imports `.mochi`, directly or through a package export, runs with
`bun --preload @mochi/bun/preload` or bunfig `preload = ["@mochi/bun/preload"]`.
`@mochi/test/{plugin,preload}` stay as re-exports, so 0086's wiring is unchanged.

The preload covers running. The other two phases of a Bun TypeScript codebase get one
tool each:

- **Types:** `mochi dts --write <file|dir>` writes an `X.d.mochi.ts` sidecar (TS 5
  `allowArbitraryExtensions`) beside every non-spec module. It is graph-aware: a
  module's imported schemes and types resolve, and cross-module types come out as
  `import type * as S from "./shapes.mochi"`. `scripts/gen-mochi-dts.ts` (the docs
  tree's generator, which adds vendor plugins and a default export for Vite) moves
  from single-file `emitDts` to graph-aware `emitDtsForFile` for the same reason: it
  reported every imported name as unbound.
- **Bundling:** `mochiPlugin` is a `BunPlugin`, so `Bun.build({ plugins: [mochiPlugin] })`
  inlines the compiled graph; the bundle needs no preload.

## Consequences

`@mochi/test` now depends on `@mochi/bun`. The loader compiles each graph on first
import with the bootstrap seed, so a cold start pays one graph compile per entry.
Sidecars are a build step, not live: after editing a `.mochi` export, rerun
`mochi dts --write` or `tsc` checks against stale types. Compiled Mochi imports
`@onrails/pattern`, so a host project must depend on it.

## Alternatives rejected

- Rewrite bare package imports to the built `.js` in `mochi build`: emits a
  repo-relative path that breaks once the package is installed from a registry.
- Conditional `exports` (`import` → `.js`, `default` → `.mochi`): the compiler also
  resolves through Bun, so it would read the built JS instead of the source.
- Keep the loader in `@mochi/test`: runtime consumers would depend on a test package.
