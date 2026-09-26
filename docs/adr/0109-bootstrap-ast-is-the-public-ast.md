# 0109 — The bootstrap AST is the public AST

- **Status:** Accepted
- **Date:** 2026-09-26
- **Source:** [issue #70](https://github.com/alanrsoares/mochi/issues/70), [issue #106](https://github.com/alanrsoares/mochi/issues/106), [ADR 0011](0011-language-plugins.md), [ADR 0101](0101-bootstrap-query-boundary.md), [ADR 0105](0105-bootstrap-conformance-oracle.md)

## Context

Deleting the hand-authored TypeScript core (#70) needs every consumer off it. The
CLI, Vite without host plugins, and most editor queries are already on the
bootstrap graph. The remaining consumers are held by two public surfaces typed
against the TypeScript AST (`ast/`: `{ kind: "num" | "call" | … }`):

- **`LanguagePlugin`** (ADR 0011). Host plugins (`@mochi/plugin-styled-cva`,
  project `mochi.plugins.ts` manifests loaded by `lsp/load-plugins`) implement
  `inferCall`, `format`, `dtsBinding`, and `completeMembers` over TS `Expr`,
  `Scheme`, and `Doc`. Whenever a project registers one, Vite, `lint-mochi`,
  `gen-mochi-dts`, and DX fall back to the TypeScript core. ADR 0101 names
  these as temporary TypeScript-host seams.
- **`@mochi/codemod`**: `CodemodTransform = (prog: Program) => Program` over the
  TS `Program`, printed by the TS-AST formatter in `@mochi/dx`.

The bootstrap graph has its own AST (`bootstrap/ast.mochi`, `_tag`-tagged
variants such as `SLet`), its own plugin record (`{ name, parse, inferCall }`
with `(toks, pos, parseExpr) → Result<Option<…>>` hooks), and its own formatter
(`bootstrap/format.mochi`). Its strict-clean TypeScript emit gives these values
real types.

## Decision

The bootstrap AST is Mochi's only AST, including at public host boundaries.

- **Types.** Host packages get AST and type types from the TypeScript emitted
  for `bootstrap/ast.mochi` / `types.mochi`, re-exported through the typed
  `@mochi/compiler/bootstrap/types` façade (ADR 0101). The seed freeze copies
  those aliases out of the emit into `bootstrap/seed/host-types.d.ts`, so hosts
  never compile seed files under their own compiler flags.
  `packages/compiler/src/ast/` is deleted along with the rest of the core.
- **Plugins.** `LanguagePlugin` is redefined over the bootstrap values and hook
  shapes. `bootstrap/extensions.mochi` gains the hooks host plugins use today,
  in the narrowest shape that serves them:
  - `format` rewrites a node before the printer lays it out (`Expr → Option<Expr>`).
    It gets no `Doc` or printer API: the one host hook reflows class strings,
    which is an AST rewrite followed by ordinary printing.
  - `dtsBinding` supplies a binding's `.d.ts` type text from its name and value.
  - `inferCall` keeps its existing signature. Hooks filter calls themselves, so
    the TypeScript `refs`/`memberTargets` dispatch lists are not ported.
  - `completeMembers` moves with DX (#103).

  On the host side every hook is an optional plain function (`null` = fall
  through); the façade wraps them into the seed's `Option`-shaped record. The
  seed façades accept host plugin lists so plugin-bearing paths stop falling
  back. `@mochi/plugin-styled-cva` and the in-repo manifests are ported in the
  same change.

  Plugin behavior is pinned with conformance cases (ADR 0105) before the port.
  Cases name the plugins they compile under. The seed cannot run them yet, so
  they start in the manifest's `coverage.pending` list with expectations
  captured once from the pre-deletion compiler and reviewed like any other
  fixture. A pending case may fail, but one that passes fails the run until it
  is moved to `coverage.required`.
- **Codemods.** `CodemodTransform` takes and returns the bootstrap `Program`, and
  output is printed by the bootstrap formatter. `@mochi/codemod` is private, so
  this is a breaking change with no migration shim.

## Consequences

- Once the port lands, nothing outside the core needs the TypeScript AST, so
  #70's deletion slices can proceed.
- Third-party plugins break once. The hook set stays the same, but hook payloads
  become bootstrap values. ADR 0011 remains the plugin *model*; this ADR replaces
  its TypeScript payload types.
- The seed's TypeScript AST becomes an API. Changing `bootstrap/ast.mochi` is now
  a public-surface change, and `seed:check` plus the conformance corpus guard it.

## Alternatives rejected

**Adapter from bootstrap AST to TS AST.** Keeps plugin and codemod authors
unaffected, but makes the parity normalizer permanent and keeps two AST
definitions in sync forever, which is the doubling #70 exists to remove.

**Keep the TypeScript core only for plugin-bearing paths.** Leaves two compilers
whose behavior diverges exactly when a project adds a plugin, and never lets #70
close.
