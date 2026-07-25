# 0009 — Host styled-cva interop (`$`-labels + default `extern`)

- **Status:** Accepted
- **Source:** `src/lexer.ts`, `src/parser.ts`, `src/codegen.ts`, `src/vite-plugin.ts`
  (`moduleExt: ".mochi"`); docs kit in `apps/docs/src/ui/primitives.mochi`

## Context

Mochi JSX desugars to `h(tag, props, children)` ([ADR 0007](0007-jsx-desugar.md)). Host UI
kits like `@styled-cva/react` (Preact via `preact/compat`) need two surface seams that the
language lacked: (1) `$`-prefixed **labels** for transient variant props (`$tone`, `$size`),
and (2) a way to bind a package **default** export as `tw` without a shim.

Tagged templates (`` tw.button`…` ``) are out of scope — styled-cva’s preferred call form
`tw.button("base", { variants })` already fits Mochi’s field+call AST.

## Decision

1. **`$`-labels only in label position.** JSX attribute names and record field names accept
   `$` + id via `expectLabel()` (lexer emits `dollar`). Value bindings and expression refs
   stay `[A-Za-z_]…` — `$d` / `$x` / `$s` synthetics remain reserved and users cannot write
   `let $tone = …`.
2. **`extern … "default"`** emits `import name from "module"` (not `import { default as … }`).
3. **No CVA runtime in Mochi.** Factories and `$` stripping stay in the host library; codegen
   still emits plain records and `h(...)`.
4. **Loose extern types** (`extern tw : a = … "default"`) — open-world field access opens a
   row; we do not model `VariantProps` in HM.

## Consequences

- Docs and apps can author styled-cva factories in `.mochi` (docs
  `primitives.mochi` is the dogfood) or keep a host TSX kit and compose from
  Mochi.
- Formatter round-trips `$tone` attrs and record fields; TextMate treats `\$?` attr names.
- Multi-arg default externs are not `_curry`-wrapped (default import is the whole value).

## Alternatives rejected

- **General `$` identifiers:** Collides with synthetic temps and invites `$foo` as bindings.
- **Shim-only default export:** Works but every consumer needs a TS re-export; language fix is
  smaller.
- **Tagged-template sugar:** Large lexer/parser surface for a form styled-cva is deprecating.
- **`@styled-cva/mochi` package:** Unnecessary — zero-overhead host interop is the point.
