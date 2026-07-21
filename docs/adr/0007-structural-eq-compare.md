# 0007 — Structural `eq`/`compare`, not typeclasses

- **Status:** Accepted
- **Source:** `docs/CRITIQUE.md` §2.1, §2.4; commit `f19dcd2`

## Context

`eq`/`compare` want to work on any type, but alang has no abstraction mechanism over
types (no typeclasses). The naive fix — Haskell-style dictionary passing — would clutter
the clean JS codegen that is alang's differentiator.

## Decision

Generalize `eq : a -> a -> bool` and `compare : a -> a -> number` via **runtime
structural** deep-equal/compare: primitives by `===`, arrays/records/variants
recursively, functions/`Set`/`Map` by reference. Where a projection is needed, `-By`
variants (`sortBy`, `maxBy`, …) take it explicitly — dictionary passing done by hand,
with no language change.

## Consequences

- Polymorphic equality/ordering with zero new type machinery; codegen stays clean.
- The cost is honest: structural compare is runtime work and won't order functions.
- This is a *tactical* answer for eq/ord only — the general abstraction-over-types
  question stays open ([0000](0000-open-questions.md)).

## Alternatives rejected

Typeclasses / dictionary passing (`eq(dict)(a)(b)`) — muddies the JS output; deferred
until/unless higher-kinded types become part of the thesis.
