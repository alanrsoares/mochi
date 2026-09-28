# 0112 — Bootstrap plugins may lay a node out themselves

- **Status:** Accepted
- **Date:** 2026-09-28
- **Source:** [issue #101](https://github.com/alanrsoares/mochi/issues/101), [issue #103](https://github.com/alanrsoares/mochi/issues/103), [ADR 0011](0011-language-plugins.md), [ADR 0078](0078-mochi-first-self-hosted-core.md), [ADR 0109](0109-bootstrap-ast-is-the-public-ast.md)
- **Amends:** ADR 0078 (the JSX parity exclusion)

## Context

The self-hosted formatter's only plugin hook was `format: Expr -> Option<Expr>`
(ADR 0109): a plugin could swap a node for another before layout. That covers
styled-cva's class-string reflow, but not JSX. The JSX plugin parses
`<tag …>` into `h(tag, props, children)`, and no node prints as a tag, so the
bootstrap printer wrote every element back as the `h(...)` call. JSX files were
the documented exclusion from formatter parity (ADR 0078), and moving
`@mochi/codemod` (#101) or `mochi fmt` (#103) onto the bootstrap core would have
rewritten every JSX file in the repository as calls: 31 of 166 files differed
from the TypeScript formatter, all of them JSX.

The TypeScript core's `FormatHook` returns a layout `Doc`, and receives a
`FormatApi` of the formatter's own printers (ADR 0011).

## Decision

- A plugin gains an optional `formatDoc: Expr -> FormatApi -> Option<Doc>`
  hook next to `format`. The first hook to return `Some(doc)` supplies the
  node's layout; `None` falls through to the next hook and then the core
  printer. `formatDoc` sees a node after any `format` rewrite of it.
- `FormatApi` (`bootstrap/format-api.mochi`) carries `exprD`, `memberD`,
  `flat`, and `strLit` as in the TypeScript core, plus `sourceText(start, end)`.
  The bootstrap AST's `Field` has no name span, so the JSX plugin tells a
  shorthand attribute from an explicit `={true}` by reading the value's source
  instead.
- `FormatApi` is its own module because the plugin type (`infer.mochi`), the
  printer (`format.mochi`), and the JSX plugin all name it, and none of them
  may import another. It is a parameterless alias so the TypeScript backend
  prints its name instead of inlining the record at every use.
- `formatHooksFor` returns both lists (`{ rewrite, layout }`), and
  `formatProgram` now applies the builtin plugins' hooks, as the TypeScript
  `format` does without options.
- The builtin JSX plugin ports `formatJsx` to `bootstrap/plugins/jsx.mochi`.
- Host plugins do not get `formatDoc` yet: `toSeedPlugin` sets it to `None`.
  A host hook would need the `Doc` constructors through a typed façade, and no
  host plugin needs one today.

## Consequences

- Both formatters agree byte for byte on all 166 `.mochi` files, JSX included.
  `test/bootstrap-format-file.spec.ts` drops its JSX exclusion, so JSX
  formatting is now held to parity like everything else.
- `bootstrap/format-api.mochi` joins the fixpoint module lists.
- Codemod (#101) and `mochi fmt` (#103) can move to the bootstrap printer
  without losing JSX.

## Alternatives rejected

**Change `format` to return a `Doc`.** One hook, as in the TypeScript core, but
styled-cva's host hook rewrites nodes and would have to re-enter the printer
itself. Two hooks keep the node-rewriting one as ADR 0109 shipped it.

**Add a name span to the AST's `Field`.** It would let `formatJsx` match the
TypeScript hook exactly, but it is an AST change that reaches the parser, every
record walk, and the parity normalizers, for one formatting decision.
