# 0101 — Bootstrap typed-query boundary

- **Status:** Accepted
- **Date:** 2026-08-31
- **Source:** ADR 0090, `bootstrap/compile.mochi`, `packages/compiler/src/bootstrap/`

## Context

Bootstrap already infers recorded source-span types, but host DX consumes the
TypeScript compiler's internal inference objects directly. That prevents hover,
completion, navigation, and rename from moving independently to the self-hosted
compiler.

## Decision

The frozen bootstrap graph exposes typed-query results through explicit host
facades. The stable payload contains recorded spans and bootstrap types; host
adapters own conversion into DX display and protocol values. Browser consumers
use the ESM seed façade, while synchronous Node integrations use the CJS façade.
Graph queries extend this same payload rather than exposing seed internals.

## Consequences

- DX can migrate query-by-query without importing bootstrap implementation files.
- Seed representation changes are contained at one typed host boundary.
- Project-plugin and cache-aware paths remain temporary TypeScript-host seams
  until bootstrap gains equivalent extension and incremental-query protocols.

## Alternatives rejected

Letting DX import generated seed modules directly would couple public editor
behavior to an untyped generated artifact and make seed regeneration a breaking
change.
