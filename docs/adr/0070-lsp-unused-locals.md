# 0070 — Unused local bindings are LSP warnings

- **Status:** Accepted
- **Source:** `packages/compiler/src/check/symbols.ts`, `packages/dx/src/diagnostics.ts`

## Context

Unused parameters, local lets, loop variables, and pattern binds are usually mistakes,
but they must not make a valid program fail to compile. The LSP already owns the editor
diagnostic surface and the compiler's symbol index already knows each binding's exact
definition and uses across shadowed scopes.

## Decision

The LSP publishes an `unused-local` warning when a named local value binding has no use.
Top-level declarations and imports are excluded (unexported top-level bindings were
later brought in by [ADR 0094](0094-lsp-unused-top-level.md)). A leading `_` explicitly marks a local
as intentionally unused. The warning is derived from the shared lexical symbol index,
not a second AST walk.

## Consequences

- Compilation and CLI diagnostics remain unchanged: this is editor feedback.
- Shadowed locals and adjacent recursive lambdas are counted by binding identity.
- Destructuring parameters without individual source spans remain unflagged.

## Alternatives rejected

Promoting unused locals to checker errors would make harmless code fail to compile.
Re-walking the AST in the LSP would duplicate scope and recursion rules already encoded
by the symbol index.
