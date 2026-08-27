# 0080 — Collection literals, `Set.empty`, and the prelude namespace rule

- **Status:** Accepted
- **Date:** 2026-08-27
- **Source:** tracker ticket C6; `packages/compiler/src/{prelude,parser,infer,codegen}/`; `docs/language.md`

## Context

Empty `#{}` already parses as Map. An empty Set has no literal form — a Set
needs at least one element or a spread — so the only empty Set was
`Set.fromArray([])`. Lazy List uses `@{}`, a sigil with no prior-art transfer.
Unqualified `map`/`filter`/`length` are Array aliases; piping a List or Set
into them produces a raw unify mismatch that reads as a language bug.

## Decision

`@{}` stays as the lazy-List literal. Empty Set is the prelude value
`Set.empty : Set a` (no grammar change; `#{}` remains Map). `List.empty` and
`Map.empty` exist for symmetry and lower to the same runtime as `@{}` / `#{}`.

The namespace rule is: unqualified names are the universal layer — math,
structural `eq`/`show`/`compare`, and Array conveniences (Array is the default
collection). Every other type is namespaced (`List.*` / `Set.*` / `Map.*` /
`Str.*` / `Task.*`). Unifying two distinct collection constructors reports that
they are distinct and, when one side is Array, names the qualified fix
(`List.map`, `Set.toArray`).

## Consequences

- Empty Set is writable without a new sigil or an overloaded `#{}`.
- Docs and hover can state the Array-default rule in one place.
- A List piped into bare `map` names `List.map` instead of only `cannot unify`.

## Alternatives rejected

**A written empty-Set sigil.** It extends the `#{}` / `#{a}` / `#{k: v}`
disambiguation for a case `Set.empty` already covers.

**Drop `@{}`.** The lazy List literal is in use; changing the sigil after the
fact is more expensive than documenting it.

**Move Array `map`/`filter` under `Array.*` only.** It breaks the "Array is
the default collection" rule and every existing pipeline.
