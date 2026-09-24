# 0108 — the Bun `.mochi` loader ships in `@mochi/bun`

- **Status:** Accepted
- **Date:** 2026-09-24
- **Source:** `packages/bun/src/{plugin,preload}.ts`, `package.json` (`example`, `example:life`)
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

Scope is runtime only. Type-checking TypeScript against `.mochi` needs `.d.mochi.ts`
sidecars (`scripts/gen-mochi-dts.ts`, `mochi dts`); `bun build` needs the plugin
passed to `Bun.build({ plugins })`. Neither is wired by the preload.

## Consequences

`@mochi/test` now depends on `@mochi/bun`. The loader compiles each graph on first
import with the bootstrap seed, so a cold start pays one graph compile per entry.

## Alternatives rejected

- Rewrite bare package imports to the built `.js` in `mochi build`: emits a
  repo-relative path that breaks once the package is installed from a registry.
- Conditional `exports` (`import` → `.js`, `default` → `.mochi`): the compiler also
  resolves through Bun, so it would read the built JS instead of the source.
- Keep the loader in `@mochi/test`: runtime consumers would depend on a test package.
