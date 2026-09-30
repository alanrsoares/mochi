# 0124. Plugin-seam types live outside the TypeScript core

- **Status:** Accepted
- **Date:** 2026-09-30
- **Source:** [ADR 0011](0011-language-plugins.md), #70, #102,
  `packages/compiler/src/ast/token.ts`, `test/core-boundary.spec.ts`

## Context

#70 deletes `packages/compiler/src/{lexer,parser,check,infer,codegen,module,compile}`.
The `LanguagePlugin` seam (`extensions/`), its JSX builtin and the virtual
prelude outlive that deletion, but still took a few types and one helper from
it: the lexer's `Tok`/`Located`, infer's `Scheme`, `infer/suggest`'s
`closestName`, and `check/symbols`'s `Origins`/`emptyOrigins`.

## Decision

- **`Tok` and `Located` move to `ast/token.ts`.** The lexer re-exports them.
- **`Scheme` moves to `ast/types.ts`**, next to `Type`. `infer/schemes`
  re-exports it.
- **`suggest.ts` moves to `errors/`.** It only builds did-you-mean text for
  diagnostics. The `./suggest` subpath export follows it.
- **`Origins` and `emptyOrigins` move to `prelude/prelude-virtual.ts`**, the
  surviving module that builds them. `check/symbols` re-exports them.
- **`test/core-boundary.spec.ts` guards the line.** `ast/`, `errors/`,
  `extensions/`, `prelude/`, `@mochi/dx` and `@mochi/lsp` may not import a
  core directory, by relative path or `@mochi/compiler/*` subpath. Specs are
  exempt until #104 retires them.

## Consequences

- #105 can delete the core directories without touching the plugin seam.
- The re-exports keep every existing import path working until #104 and #105
  remove the core.
