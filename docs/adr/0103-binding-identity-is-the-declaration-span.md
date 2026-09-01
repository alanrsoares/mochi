# 0103 — Binding identity is the declaration span

- **Status:** Accepted
- **Date:** 2026-09-01
- **Source:** [ADR 0101](0101-bootstrap-query-boundary.md), [ADR 0102](0102-lambda-param-name-spans.md), `bootstrap/symbols.mochi`, `packages/dx/src/bootstrap-highlights.ts`

## Context

Document highlight, find-all-references, and rename all answer the same
question: *which occurrences in this file mean the same thing as the one under
the cursor?* Answering it by name is wrong the moment a name is shadowed —

```
let x = 1
let f = let x = 2 in x
let g = x
```

— where the four `x` tokens are two distinct bindings. A rename keyed on the
string renames all four and changes the meaning of the program.

The bootstrap graph needed its own answer to this, because the DX layer is
migrating query-by-query onto the self-host (ADR 0101) and the TypeScript
navigation index is not part of the bootstrap-covered core.

## Decision

`bootstrap/symbols.mochi` walks the statement tree carrying a lexical
environment `Map<string, Binding>`, where `Binding` records the declaration's
span. It emits a flat list of occurrences:

```
{ name, defStart, defEnd, start, end, role }
```

`role` is `"def"` or `"use"`. **`(defStart, defEnd)` is the binding's identity.**
`name` is carried for display and filtering only; nothing keys on it. Two
occurrences belong together exactly when their declaration spans are equal, so
the shadowed `x` above yields two groups with no special shadowing logic —
ordinary lexical scoping in the walk produces the right grouping for free.

A binder appears in the index only if its declaration has an exact span. With
ADR 0102 that now includes lambda, tuple, record, and labeled parameters
alongside top-level `let`, `let…in`, and match-arm pattern bindings. Synthetic
binders have no span and are simply absent — the index under-reports rather
than guessing.

The host boundary follows ADR 0101: `symbolOccurrences` is exported from
`bootstrap/module.mochi`, surfaced as `symbolOccurrencesBootstrap` with a typed
`BootstrapOccurrence` payload, and adapted into DX protocol values by
`packages/dx/src/bootstrap-highlights.ts`. DX filters by declaration span; it
never sees the seed's internals.

## Consequences

- Highlight, references, and rename over the bootstrap graph share one index and
  one identity rule, so they cannot disagree about what a binding is.
- Shadowing is correct by construction rather than by a special case, and the
  guard for it is a unit spec in `bootstrap/symbols.spec.mochi`.
- The index emits declarations ahead of the bodies they scope, so it is not in
  source order. Consumers that want source order sort by offset;
  `bootstrapHighlightsAt` does.
- Coverage gaps are silent. A binder the walk does not yet visit produces no
  occurrence, which reads as "nothing to highlight" rather than as an error.
  New binder forms need a spec that asserts their occurrences.

## Alternatives rejected

**Key on `name` plus enclosing scope id.** Requires the walk to mint and thread
scope identifiers that exist for no other reason, and two bindings of the same
name in the same scope (sequential `let…in`) still collide. The declaration span
is already unique and already threaded.

**Reuse the inferred types index.** Type information is keyed by expression
span and says nothing about which declaration a reference resolves to; it would
answer a different question.

**Adapt the TypeScript navigation index for bootstrap buffers.** Rejected under
ADR 0101 — it would leave editor behaviour for the self-host pinned to the
mirror, which is the coupling the query boundary exists to remove.
