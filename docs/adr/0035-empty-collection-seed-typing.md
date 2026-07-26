# 0035 — Type empty collection literals from their inferred element type

- **Status:** Accepted
- **Source:** `src/codegen-ts.ts:162,174,237,249`, `test/ts-emit-tsc.spec.ts:95`

## Context

An empty collection literal (`#{}`, `@{}`, `[]`) carries no element-typed
value for `tsc`'s own inference to key off of — `tsc` types the empty
literal itself as `never[]`/`{}`-ish and then widens or erases whatever HM
already solved for its element type, producing a downstream type error the
first time an element is pushed or read.

## Decision

When codegen emits an empty collection literal, annotate it directly from
the inference table's solved element type for that literal's span (keyed by
`infer.letParams`), rather than letting `tsc` infer from the empty value.
This applies recursively to empty collections nested inside another value
(e.g. a struct field seeded empty) and to collections threaded as a
generic-bound "state" value across a loop/fold, so the seed's type flows to
every field/branch that later concretely populates it.

## Consequences

- `tsc --strict` sees a concrete element type at the point of declaration
  instead of inferring `never`/`unknown` and erroring on first use.
- Requires the codegen pass to look up the inference table by literal span,
  not just by AST shape — an empty collection's type isn't visible from its
  own syntax.

## Alternatives rejected

- **Explicit user-written type annotation required on every empty literal**
  — pushes an annotation burden onto the source language for a fact HM
  already knows.
