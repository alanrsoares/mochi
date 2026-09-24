# 0107 — prefer a printable alias when the winning name is ambiguous

- **Status:** Accepted
- **Date:** 2026-09-23
- **Source:** `bootstrap/codegen-ts.mochi` (`withoutAmbiguousAlias`)
- **Refines:** [0092](0092-record-alias-index.md), [0106](0106-pin-record-alias-vars.md)

## Context

Several nullary aliases can share one row. The index keeps a single name, the
last sorted key. A qualified copy sorts after the bare one (`Schemes.AliasInfo`
after `QualAliasInfo`), so the stored name is the bare duplicate.

[0106](0106-pin-record-alias-vars.md) then blanks that name outside the module
that declares the nullary alias: `AliasInfo` is also `AliasInfo` in
`codegen-ts.mochi`, and printing it would import the wrong declaration. The
shape stays, so the row still prints — `{ params: string[]; fields:
QualAliasField[]; expr: Option<TypeExpr> }` — even though `QualAliasInfo` is
the same row and safe to name.

## Decision

When the winning name is ambiguous and this module does not declare it, print
another nullary alias of that shape whose bare name is not ambiguous. Blank the
name only when no such alias exists.

The module that declares the ambiguous alias still prints its own name. The
choice among printable aliases is the last sorted key, the same rule the index
already uses.

A shape key sorts closed records at every depth, not only the outermost row.
`unify` reorders fields inside a nested record too. The outer key used to embed
that nested row in extension order, so it missed the alias while the nested row
itself still folded (`fields: QualAliasField[]` inside an unfolded
`QualAliasInfo`).

## Consequences

`QualScope` and the alias maps in `compile`, `dts`, and `module` print
`QualAliasInfo` instead of the row. A shape whose only name is ambiguous
(`LocTok` next to `LocTok<t>`) still prints structurally.

## Alternatives rejected

- **Delete the ambiguous name from the index.** Pins and the remaining alias
  both need the shape. Blanking the name was what kept the shape; it should
  not also drop the other alias.
- **Stop qualifying dep aliases into the index.** `Ast.AliasField` has to
  expand or `AliasInfo` and `QualAliasInfo` never share a key, and the fold
  misses for the opposite reason.
