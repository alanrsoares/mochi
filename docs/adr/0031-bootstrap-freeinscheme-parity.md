# 0031 — `freeInScheme` parity between `src/` and `bootstrap/`

- **Status:** Accepted
- **Source:** `src/schemes.ts`, `bootstrap/schemes.mochi`

## Context

Generalization (turning an inferred `Type` into a `Scheme` by quantifying the
free type variables not already bound in the environment) depends on
`freeInScheme`/`freeInType` computing the exact same free-variable set in
both the TS compiler and its self-hosted mochi mirror — any divergence here
silently changes which programs the self-hosted checker accepts versus the
TS one, defeating the "self-host is accountable to the same rules" property.

## Decision

`bootstrap/schemes.mochi` mirrors `src/schemes.ts`'s `freeInScheme`/
`freeInType` traversal structurally, field-for-field, rather than
approximating it — including row-type free-variable collection, so
row-polymorphic schemes generalize identically on both sides.

## Consequences

- A change to free-variable computation in `src/schemes.ts` must be ported to
  `bootstrap/schemes.mochi` in the same change, or the two checkers diverge
  on which programs typecheck.
- Row polymorphism's free-variable rules are exercised by the self-host graph
  itself (bootstrap compiles bootstrap), not just by `test/`.

## Alternatives rejected

- **Let bootstrap use a simpler/approximate free-variable rule** — would let
  the self-hosted checker silently accept or reject different programs than
  the TS one, breaking the "self-host is the same language" guarantee.
