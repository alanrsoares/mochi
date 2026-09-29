# 0122. Hover on the bootstrap core

- **Status:** Accepted
- **Date:** 2026-09-30
- **Source:** [ADR 0101](0101-bootstrap-query-boundary.md), [ADR 0118](0118-bootstrap-symbol-index.md),
  [ADR 0119](0119-bootstrap-binder-records.md), [ADR 0121](0121-bootstrap-complete-members.md),
  `bootstrap/schemes.mochi`, `bootstrap/compile.mochi`, `bootstrap/module.mochi`,
  `bootstrap/plugins/jsx.mochi`, `packages/dx/src/hover.ts`, `packages/dx/src/bootstrap-hover.ts`, #103

## Context

After ADR 0119, hover asked bootstrap first, but it still used the TypeScript
core for everything bootstrap's rendered `display` string could not express:

- alias folding;
- width-aware layout;
- namespace qualification (`D.E`);
- import-name schemes;
- JSX attribute prop types;
- prelude docstrings, found through the TS symbol index;
- declaration syntax, read from the TS parser's tree.

The module path ran entirely on the TS `moduleContext`.

## Decision

- **Hover renders bootstrap values, not strings.** `hover-type.ts` lays out
  the seed's `Ty` and `TypeExpr` values, and the bootstrap `SType` statement, with
  the same `Doc` layout as before. No bootstrap type is converted into a
  TypeScript one.
- **Alias folding is Mochi.** `schemes.mochi` exports `foldAliases`. It is the
  twin of `ast/types.ts`'s version: each alias's template is its `aliasRow`
  expansion over template vars, a node is tried whole first and then its
  children, aliases are tried in declaration order, and an alias with a phantom
  parameter is skipped. The syntax bundle exposes it next to `widenLits`.
- **The symbol index is in the synchronous bundle.** `compile.mochi` exports
  `symbolIndexSync`, and `sync.ts` exposes it as `symbolIndexBootstrapSync`.
  `bootstrap-index.ts` uses it, so `hoverAt` can resolve a builtin reference to
  its prelude docstring in the browser. The graph-wide index moves to
  `bootstrap-module-index.ts`, which is Node-only.
- **Graph outputs say what imports bound.** Each module's infer output from
  `module.mochi` gains `imports`, the scheme of each named import (constructors
  included), and `quals`, each `import * as` scope. Import-name hover and `D.E`
  qualification read these.
- **The JSX plugin records attribute prop types.** `jsx.mochi` records a
  `property` binder at each attribute name. The recorded type is the expected
  prop type: the intrinsic schema's, or the component's row field. These are
  the same sites as the TypeScript plugin's `noteType` calls.
- **Two entry points.** `hoverAt` in `@mochi/dx/hover` is single-file and
  browser-safe. `moduleHoverAt` moved to `@mochi/dx/bootstrap-hover`, because
  the graph loader is Node-only. It takes `{ plugins, cache }` with bootstrap
  plugins and a bootstrap graph cache, and falls back to `hoverAt` when the
  graph does not type.

## Consequences

- Hover no longer imports the TypeScript lexer, parser, checker, inferrer,
  symbol index or module cache. The LSP hovers with the project's `plugins`.
- A sweep of 2,061 positions over the import-free corpus matched the old
  answer at every position except one class of difference, which was a bug
  fix. A constructor of a type with no parameters used to print
  `-> Shape<>`, and now prints `-> Shape`.
- Type variables still print as `'t<id>`, with bootstrap's ids.
- The `sym` on `BootstrapTypeAt` now also marks JSX attribute names.
