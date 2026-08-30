# 0100 — Readable TypeScript and TSX emission

- **Status:** Accepted
- **Date:** 2026-08-30
- **Source:** [ADR 0026](0026-codegen-ts-strict-clean-backend.md), [ADR 0084](0084-structural-eq.md), [ADR 0090](0090-bootstrap-chain.md)

## Context

The typed backend shared its value emitter with JavaScript, so Mochi source
operators appeared as runtime helper calls such as `gte(a, b)`. JSX also stayed
in its parser-lowered `h(tag, props, children)` form. Both forms are correct,
but make generated TypeScript needlessly unlike the source and unlike idiomatic
TypeScript.

## Decision

The typed backend re-folds only semantics-preserving, fully-applied numeric
prelude calls:

- `add`, `sub`, `mul`, `div`
- `lt`, `lte`, `gt`, `gte`

It does not re-fold `eq`: Mochi equality is structural (ADR 0084), unlike
JavaScript `===`. It also leaves `mod` as a call because Mochi implements true
modulo, not JavaScript remainder.

Parser-originated JSX calls (`origin: "jsx"`) re-fold into TSX. A source-written
`h(...)` remains a normal call, and a JSX child spread retains the call form
because JSX has no equivalent spread-child syntax. TSX-bearing typed modules
start with `/** @jsx h */`; both CLI writers use that leading marker to choose
the `.tsx` extension.

The shared JavaScript backend does none of these rewrites. The bootstrap Mochi
sources and frozen seed mirror the TypeScript oracle.

## Consequences

- Typed output reads as normal TypeScript/TSX and no longer imports helpers that
  were fully re-folded.
- Runtime semantics remain unchanged for structural equality and true modulo.
- `mochi build --emit=ts` writes JSX modules as `.tsx`; other typed modules stay
  `.ts`.
