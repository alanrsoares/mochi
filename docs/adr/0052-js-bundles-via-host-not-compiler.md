# 0052 — JS bundles via host bundler; compiler ships clean ESM

- **Status:** Accepted
- **Date:** 2026-07-28
- **Source:** conversation (owner direction); `packages/compiler/src/{codegen,module}`;
  `packages/vite-plugin`; `packages/cli` `build`; [ADR 0008](0008-vite-mochi-docs-app.md);
  [ADR 0026](0026-codegen-ts-strict-clean-backend.md); [ADR 0048](0048-core-dx-package-boundary.md);
  [ADR 0053](0053-path-to-wasm3.md)

## Context

mochi already emits ESM (`import` / `export`) from one codegen shared by the JS and
strict-clean TS backends. `mochi build <entry>` resolves the `.mochi` graph and writes
a `.js` (or `.ts`) **beside each source** — multi-file emit, not a bundle. Apps that
need a browser/Node artifact (docs, snake, …) compile through `@mochi/vite-plugin` and
let Vite/Rollup pack.

That leaves an open product question: should the **compiler** grow a linker /
tree-shaker / minifier so `mochi` alone can ship a single JS bundle, or should bundling
stay a host concern while the compiler doubles down on emit quality?

Today the Vite transform still papers over emit gaps (re-`export` of top-level consts,
a synthetic `default`, keeping `.mochi` import extensions so Vite re-enters the plugin).
Graph JS emit also inlines the prelude **per module** (`runtime: true`), which duplicates
helpers until the host bundler DCE's them. Spans exist for IDE diagnostics but there is
no sourcemap emit.

## Decision

1. **Bundling is a host job.** The compiler's deliverable for JS packaging is **correct,
   honest ESM modules** (and the typed-TS sibling). Single-file / multi-chunk / minified
   artifacts come from Vite, Bun, esbuild, or similar — not from a mochi-owned linker.

2. **`mochi build` stays per-module emit.** It remains the graph driver for check +
   infer + codegen (and `build --emit=ts`). It does not become `bundle`.

3. **Emit-quality work that unblocks host bundlers is in scope** (ordered):
   - Codegen honors `exported` so consumers do not need Vite's re-export / default hacks.
   - Graph JS prefer one shared `@mochi/runtime` import (as the TS backend already does)
     over N copies of inlined prelude defs — or a documented graph-level “emit runtime
     once” mode.
   - Sourcemaps from existing spans.
   - Clear extern / bare-spec policy for what stays `import` vs what a host may pack
     (`extern` host seams, npm packages).
   - Optional thin CLI glue (`mochi bundle` shelling to `bun build` / esbuild on an emit
     directory) — **orchestration only**, not a new compiler pass.

4. **A native mochi bundler is explicitly deferred.** Linker, reachability DCE, cross-module
   scope hygiene, minify, chunking, and composed sourcemaps are a product of their own.
   If revisited, they share prerequisites with the Wasm path — notably a typed core IR
   between infer and codegen ([ADR 0053](0053-path-to-wasm3.md) decision 4.1) — and must not
   land as ad-hoc AST walks.

5. **Out of scope for the compiler forever (under this ADR):** CSS/assets/HMR, JSX host
   runtime packaging, and npm library layout beyond ESM + `package.json` `exports`. Those
   stay with Vite / app tooling / host kits ([ADR 0008](0008-vite-mochi-docs-app.md),
   [ADR 0012](0012-host-interop-end-state.md)).

## Consequences

- Apps keep depending on a host bundler; dogfood stays Vite-first until emit hacks die.
- Compiler surface stays small: no second “bundle” railway next to `buildModules`.
- Fixpoint / `bootstrap:tsc` north-stars continue to guard **module** emit, not packed
  artifacts.
- Core IR work (when scheduled) benefits JS/TS opts and a future Wasm backend without
  forcing a bundler into the critical path.
- Accepting this ADR does not schedule the emit-quality items; it only pins direction so
  “should we write a bundler?” stays answered until superseded.

## Alternatives rejected

- **Homegrown single-file / multi-chunk bundler in `@mochi/compiler`.** Duplicates
  Vite/esbuild/Bun; large surface (linker, DCE, minify, maps, extern policy); fights
  the “readable ESM + host ecosystem” story that already ships apps.
- **Replace `mochi build` with bundle-only output.** Breaks the self-host graph emit,
  TS backend parity, and any workflow that wants one `.js` per `.mochi`.
- **Treat Vite plugin hacks as the long-term ESM contract.** Keeps packaging knowledge
  in `@mochi/vite-plugin` instead of codegen; every new host bundler re-discovers the
  same gaps.
