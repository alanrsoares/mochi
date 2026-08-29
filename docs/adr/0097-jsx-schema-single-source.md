# 0097 — One source of truth for the intrinsic JSX schema

- **Status:** Accepted
- **Date:** 2026-08-29
- **Source:** [ADR 0096](0096-jsx-intrinsic-element-prop-types.md), [ADR 0075](0075-runtime-source-of-truth.md), [ADR 0078](0078-mochi-first-self-hosted-core.md), `scripts/gen-jsx-schema.ts`

## Context

ADR 0096 put the intrinsic element schema — ~600 lines of tag → attribute →
type — inside `packages/compiler/src/extensions/plugins/jsx.ts`. The self-hosted
plugin then grew its own copy of the same knowledge as predicate chains
(`isBoolAttr`, `isStringAttr`, …) covering a subset of it.

That is two hand-written implementations of one rule, and the usual guard does
not see the divergence. `fixpoint` compares emitted output for the bootstrap
sources, and no bootstrap source contains JSX, so both stages agree while the
mirror silently accepts `<button disbaled="yes">` and the oracle rejects it.
Every new HTML attribute would need two edits, forever, with nothing failing
when only one lands.

The schema is not compiler logic. It is a list of facts about the web platform.

## Decision

`packages/compiler/src/extensions/plugins/jsx-schema.ts` holds the schema as
plain data with no compiler imports. `jsx.ts` and `@mochi/dx` import it directly.
`scripts/gen-jsx-schema.ts` projects it into
`bootstrap/plugins/jsx-schema.gen.mjs`, which the self-hosted plugin reads
through `extern` declarations.

The projection crosses the **host seam** rather than entering the compiled
graph, exactly as `prelude.gen.mjs` carries the prelude tables (ADR 0075). The
plugin only looks attributes up; it never pattern matches over the schema's
shape. Keeping it out of the graph costs nothing and keeps the reviewed
`bootstrap/seed/` snapshot from carrying the table.

Attribute kinds cross as strings (`"string"`, `"bool"`, `"enum:a,b,c"`, …)
rather than as a variant type mirrored on both sides — the seam should not
require keeping two type declarations in step either.

Adding an attribute is one line in the schema module plus
`bun run gen:jsx-schema`. `test/jsx-schema.spec.ts` fails if the generated file
is stale, and if the schema grows a kind the self-hosted plugin does not read.

## Consequences

- The data has one home; a second implementation of it cannot drift, because
  there is no second copy to drift from.
- ADR 0078's Mochi-first rule still governs the plugin's *logic*; this ADR only
  removes the duplicated *data*.
- The self-hosted plugin's diagnostics are still behind the oracle's: it checks
  attribute types but does not yet emit the unknown-attribute error, the
  migration hints, or `noteType`. That gap needs `nameSpan` on bootstrap's
  `Field` and a `closestName` port, and is tracked separately — it is a logic
  port, which this ADR does not attempt.
- A generated 4.7k-line artifact is checked in. It is deduplicated by shared
  attribute table (34 distinct tables across ~120 tags) rather than repeating the
  globals per tag, which is the difference between a reviewable diff and noise.

## Alternatives rejected

**Hand-port the tables into `bootstrap/plugins/jsx.mochi`.** Honest to ADR 0078's
letter and the only option that guarantees permanent drift: two lists, no
mechanism keeping them equal, and a gate that structurally cannot notice.

**Compile the schema as a `.mochi` module in the graph.** Type-checked as Mochi,
but it enters `fixpoint`, grows the reviewed seed by the whole table, and buys
nothing — the plugin never matches over the schema's shape.

**Express the schema as a `domProps` record type in the prelude.** ReScript's
approach, and the right end state, but it needs record fields that may be absent.
mochi's rows are `empty | rvar | extend` with no optionality, so a closed
`domProps` would force every `<div>` to list every attribute — exactly the
objection ADR 0096 raises. Revisit if optional fields land.
