# 0118 Full symbol index in bootstrap

- **Status:** Accepted
- **Date:** 2026-09-29
- **Source:** [ADR 0101](0101-bootstrap-query-boundary.md), [ADR 0103](0103-binding-identity-is-the-declaration-span.md), `bootstrap/symbols.mochi`, `bootstrap/symbols.spec.mochi`, `packages/compiler/src/check/symbols.ts`, #103

## Context

ADR 0103 gave bootstrap a lexical index for one file's values. Go-to-definition,
graph-wide references and rename also need what the TS `indexProgram` gives:
types, ctors and record fields, imported names resolved to their export site,
and builtins resolved to the virtual prelude buffer. Until bootstrap has all of
that, `@mochi/dx`'s navigation stays on the TS core.

## Decision

`bootstrap/symbols.mochi` exports `indexWith(path, origins, prelude, stmts)`,
a port of `indexProgram`. It returns every occurrence, in the oracle's walk
order:

```
{ name, space, defPath, defStart, defEnd, start, end, role }
```

`space` is `"value"`, `"type"`, `"ctor"` or `"field"`. A binding's identity is
`(space, defPath, defStart, defEnd)`, which extends ADR 0103 across files.

- **The host supplies the cross-file inputs.** `origins` holds the export sites
  of the modules this file imports, from `originsOf(path, stmts)` on each
  dependency. `prelude` holds the virtual prelude's defs and its `Ns.member`
  table (`preludeBootstrap()` in `@mochi/compiler/prelude-virtual`). The index
  never reads a file. Which modules count as dependencies is the caller's call:
  direct imports for parity, the whole graph for navigation.
- **Module scope and local scopes are kept apart.** Locals are one small map
  that gets extended as binders come into scope. Module bindings and the prelude
  are looked up behind it. Binding a local never copies the module-wide maps.
- **Field names are threaded through the walk.** The first site of a field name
  is its def and every later site is a use, as in the oracle. So the field table
  is the one piece of state that passes through the walk in order.
- **One walker.** The single-file `index` from ADR 0103 is now a projection of
  `indexWith`: this file's value bindings, excluding imports. `bootstrap-unused`
  and the single-file highlight path keep their inputs.
- **Parity was exact at landing.** A temporary differential suite compared the
  frozen seed's occurrences and dependency origins with the TypeScript index on
  every `.mochi` file. #104 slice c retired it after direct symbol, façade, and
  DX query specs covered the shipped path.

Labeled parameters now anchor on their name. The TS parser's `span` for
`~timing?: string` covers the whole parameter, so the TS index recorded that
span as the def, and a rename would have overwritten the whole parameter. The
TS AST gains `nameSpan` for labeled params, and the oracle binds on it. That
matches bootstrap's `LPSpanned`.

## Consequences

- DX navigation runs on this index: `packages/dx/src/nav.ts` through
  `bootstrap-index.ts`. `bootstrap-nav.ts` from ADR 0103 is folded into it, and
  the language server no longer picks an index per query. The index has no scope
  frames yet (`bindingsAt`), so completion keeps the TS index until a later
  slice adds them.
- `exportedOrigins` now takes the module path and follows the oracle's
  `originsOf`: type name spans, ctor spans, and ctors as values. Before this it
  used declaration spans and left ctors out of values.
- Qualified type references (`Alias.Name`) still resolve to nothing, as in the
  oracle.
