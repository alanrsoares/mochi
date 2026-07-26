# 0009 — Host styled-cva interop (`$`-labels + default `extern`)

- **Status:** Accepted
- **Source:** `src/lexer.ts`, `src/parser.ts`, `src/codegen.ts`, `src/vite-plugin.ts`
  (`moduleExt: ".mochi"`); docs kit in `apps/docs/src/ui/primitives.mochi`;
  vendor plugin [`packages/plugin-styled-cva`](../../packages/plugin-styled-cva/README.md)

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

## Amendment — `*.host.mochi` FFI seams (2026-07-25)

Non-core host bindings (`extern` into npm/TSX) now live in dedicated
`*.host.mochi` modules — one per host package — instead of inline in logic
files. Core `.mochi` files carry **zero** `extern`; they `import { … }` from a
seam. The suffix is a greppable boundary between the language and its host glue
(`apps/docs/src/host/{styled-cva,re-reduced,widgets}.host.mochi`). `export extern`
codegens to a clean ESM re-export (`import x from "pkg"; export { x }`), so
seams compose through the Vite plugin and the module graph unchanged.

**Seam bindings stay opaque (`: a`) where precise HM would lie — deliberately,
not lazily.** What is still infeasible or harmful in the current language:

- `tw.<tag>` is overloaded (`tw.div("x")` **and** `tw.div("x", { variants })`).
  A fixed-arity HM arrow types the 1-arg sites as *partial application* (a
  function) when they are components — a wrong type leaking into `.d.mochi.ts`.
  The `tw` overload is **not** modeled in core infer; [`@mochi/plugin-styled-cva`](../../packages/plugin-styled-cva/README.md)
  is a **vendor plugin** (project plugin list — [`apps/docs/mochi.plugins.ts`](../../apps/docs/mochi.plugins.ts);
  boundary in [ADR 0010](0010-host-type-interop.md)), not language core.
- JSX desugars to `h(tag, props, children)`. **Core** now checks attrs against a
  component tag's prop row when the tag types as `record → VNode` (`inferJsxCall`,
  tracer bullet #14 / [ADR 0010](0010-host-type-interop.md)). String/intrinsic
  tags stay open-world on props.

**Gap B is partly closed:** the vendor plugin hooks `inferCall` + `dtsBinding`
for `$tone` literal unions on `tw.*` factories; JSX-attr checking covers prop
usage at `<Component … />` sites. `re-reduced` will follow the same vendor-plugin
pattern (Gap A). Seam `extern` lines can stay `: a` — honesty at the FFI boundary
without fake fixed-arity `tw` arrows.

LSP completion for `tw.*` / record fields shipped as tracer bullet #13 /
[ADR 0013](0013-lsp-completion.md). Nested-scope value completion ships via
`bindingsAt` on the symbol index (Wave 9 / #44).

## Consequences

- Docs and apps can author styled-cva factories in `.mochi` (docs
  `primitives.mochi` is the dogfood) or keep a host TSX kit and compose from
  Mochi.
- Non-core FFI is isolated behind `*.host.mochi`; `rg 'export extern'` /
  `**/*.host.mochi` enumerates every host dependency of a Mochi app.
- styled-cva (and later re-reduced) ship as **vendor plugins** under
  `packages/plugin-*`, registered per project — not baked into core `src/`.
- Formatter round-trips `$tone` attrs and record fields; TextMate treats `\$?` attr names.
- Multi-arg default externs are not `_curry`-wrapped (default import is the whole value).

## Alternatives rejected

- **General `$` identifiers:** Collides with synthetic temps and invites `$foo` as bindings.
- **Shim-only default export:** Works but every consumer needs a TS re-export; language fix is
  smaller.
- **Tagged-template sugar:** Large lexer/parser surface for a form styled-cva is deprecating.
- **`@styled-cva/mochi` package:** Unnecessary — zero-overhead host interop is the point.
