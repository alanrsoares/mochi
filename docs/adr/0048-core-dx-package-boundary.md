# 0048 — Core vs DX package boundary (bootstrap = core)

- **Status:** Accepted
- **Date:** 2026-07-27
- **Source:** conversation (owner decision); `bootstrap/`; `packages/{compiler,dx,lsp,vite-plugin}`;
  [ADR 0011](0011-language-plugins.md); [ADR 0025](0025-doc-ir-layout-engine.md);
  [ADR 0026](0026-codegen-ts-strict-clean-backend.md)

## Context

The repo already has a workspace (`packages/plugin-*`, `apps/docs`, `packages/vscode`),
but the TypeScript compiler still lives as one flat `src/` tree: the self-hosted
pipeline and the DX surfaces (formatter, `.d.ts` entrypoints, IDE queries, Vite
plugin, LSP adapter) share a namespace. That blurs what must stay in fixpoint
parity with `bootstrap/` versus what can evolve freely.

`bootstrap/` already answers “what is core?” — it mirrors the railway
(lex → parse → check → infer → codegen), `module`, `extensions` + builtin JSX,
and a compile/build-only `cli`. It has no format/dts/LSP/Vite. Several `src/`-only
modules are still **foundation**, not DX (`unify`, `span`, `errors`, `prelude`,
`runtime`, `doc`, `suggest`, `symbols`, and for now `dts` / `codegen-ts`).

## Decision

1. **Core = the bootstrap mirror plus non-self-hosted foundation.** Anything
   `bootstrap/` owns (or will own for parity) plus shared types/helpers the
   pipeline needs (`unify`, spans, diagnostics values, prelude/runtime, `Doc`
   IR for `FormatApi`, did-you-mean `suggest`, lexical `symbols`, …) lives under
   **`@mochi/compiler`**. Fixpoint / `bootstrap:tsc` north-stars apply only here.

2. **DX packages depend inward; core never imports them.**
   - **`@mochi/dx`** — formatter and IDE query APIs (`format`, hover, complete,
     nav, publish-diagnostics). One bag, not one package per file.
   - **`@mochi/lsp`** — thin `vscode-languageserver` adapter over `@mochi/dx`.
   - **`@mochi/vite-plugin`** — Vite transform over `@mochi/compiler`’s `compile`.

3. **Pin `@mochi/compiler`’s public exports.** DX and apps import named
   subpaths (`@mochi/compiler/ast`, `…/infer`, …) or the main compile barrel —
   not deep relative paths into an undifferentiated `src/`. New core surface
   for DX must be added deliberately to the export map.

4. **`codegen-ts` and most of `dts.ts` stay in `@mochi/compiler` for now.**
   The TS backend reuses HM→TS printing inside `dts.ts` ([ADR 0026](0026-codegen-ts-strict-clean-backend.md));
   `module.ts` emits extern `.d.ts` helpers from the same module. Splitting
   “type printer” from the user-facing `emitDts` entry is deferred until the
   TS backend’s ownership is decided. `emitDts` remains a compiler export;
   DX does not own it yet.

5. **Break reverse edges before / as DX lifts.** Concrete first cut:
   `showTypeExpr` moves out of `format` into core so `infer` does not import
   DX; `compile.ts` stops re-exporting format/hover/complete/vite.

6. **Host CLI is `@mochi/cli`.** Composes `@mochi/compiler` (compile / `ts` / `dts` /
   `build`) and `@mochi/dx` (`fmt`). Not in `@mochi/compiler` — core never imports
   DX. Bootstrap CLI stays compile/build-only.

7. **Physical layout.** Compiler sources live in `packages/compiler/src/<component>/` (pipeline-aligned folders with `index.ts` barrels and colocated specs). `@mochi/compiler` export URLs are unchanged; only filesystem paths move. Vite app configs import `@mochi/vite-plugin` / `@mochi/vite-plugin/workspace-aliases` by package name; the plugin imports `@mochi/compiler/*` the same way. Run Vite under **Bun** (`bunx --bun vite`) so config loading can follow those TS package exports — Node's ESM loader still cannot resolve the compiler's extensionless relative graph. App/module aliases (`mochiWorkspaceAliases`) map the same packages into sources for the browser bundle.

## Consequences

- Dependency direction is enforceable: DX → compiler, never the reverse.
- Self-host scope stays obvious; LSP/formatter growth does not look like a
  bootstrap obligation.
- Docs / snake / VS Code bundling import `@mochi/dx` / `@mochi/vite-plugin` /
  `@mochi/lsp` instead of treating `compile.ts` as a DX facade.
- Physical layout: `packages/compiler/src/<component>/` is the compiler home; root `src/` removed.

## Alternatives rejected

- **Everything not in bootstrap → a package.** False friends (`unify`,
  `prelude`, `doc`, …) are core foundation; dumping them into DX recreates the
  reverse-edge problem.
- **Micro-packages (`@mochi/hover`, `@mochi/nav`, …).** Shallow surfaces, more
  workspace churn than leverage; one `@mochi/dx` is enough until publish/version
  needs diverge.
- **Move `dts` + `codegen-ts` into DX in the same cut.** Would force the TS
  backend to depend on a “tooling” package or a messy split mid-flight.
