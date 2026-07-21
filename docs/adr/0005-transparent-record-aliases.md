# 0005 — Transparent (structural) record-type aliases

- **Status:** Accepted
- **Source:** `docs/CRITIQUE.md` §4.1; commit `4f3d4e2`; `example.al`

## Context

`type Point = { x: number, y: number }` needs a meaning. Nominal records (distinct
types) would fight the open-row, duck-typing story that is alang's headline feature.

## Decision

A record-type alias is purely a **name** for a structural row type. Inference and
unification are untouched — an alias and its expansion are the same type. Only display
layers (`showType`, hover, `.d.ts`) learn to prefer the alias name: `foldAliases` folds a
closed record that matches an alias back to the alias name.

## Consequences

- No annotations forced, no new type distinctions — structural typing stays intact.
- Better readouts: tooling shows `Point`, not `{ x: number, y: number }`, when it folds.
- An alias never changes what unifies; it is display sugar over rows.

## Alternatives rejected

- Nominal records — distinct types requiring annotations; conflicts with structural typing.
- Single-constructor variant idiom — already possible, but not FFI-transparent.
- Display-only naming with no real alias binding — no single source for the name.
