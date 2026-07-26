# 0039 — Annotate nullary-constructor refs like empty-collection seeds

- **Status:** Accepted
- **Source:** `src/codegen.ts:116,162`, `src/dts.ts:215`, `test/ts-emit-tsc.spec.ts:148`

## Context

A nullary variant constructor reference (e.g. `None`, or a match arm's first
returned value being a bare `ref` to a nullary ctor) carries no value-level
type parameter for `tsc` to key off — the same shape of problem ADR-0035
solved for empty collection literals: `tsc` erases/widens the phantom type
argument instead of keeping the one HM already solved.

## Decision

Annotate a nullary-ctor `ref` the same way an empty collection seed is
annotated (ADR-0035's `annotateEmpty`): pull the concrete type-parameter
values from the inference table at that ref's span and emit them explicitly,
rather than leaving `tsc` to infer the phantom parameter from zero
information. This is the nullary analogue that ADR-0043 later extends to
*applied* constructor calls with phantom (unused) type parameters.

## Consequences

- A `switch` whose first arm returns a bare nullary constructor keeps its
  full parametric type instead of collapsing to `Option<never>`/`any` for
  every other arm that unifies against it.
- Establishes `annotateEmpty` as the shared mechanism for "value carries no
  runtime evidence of its own type parameter" cases — reused verbatim by
  ADR-0043's applied-ctor case.

## Alternatives rejected

- **Explicit type argument syntax required on nullary ctor refs** — pushes
  an annotation burden onto the source language for a fact HM already knows.
