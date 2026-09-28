# 0111 — Bootstrap graph caches hold one slice per module

- **Status:** Accepted
- **Date:** 2026-09-28
- **Source:** `bun run lint:mochi 'bootstrap/*.mochi'` taking ~256s, [ADR 0095](0095-module-context-cache.md), [ADR 0101](0101-bootstrap-query-boundary.md)
- **Deepens:** ADR 0095 (caller-owned graph memo)

## Context

The bootstrap graph caches (`BootstrapGraphCache`, `BootstrapRecoveryGraphCache`)
saved the fold state after each dependency-ordered prefix of an entry's graph,
keyed by that exact prefix. That order is the entry's depth-first import walk,
so it differs from entry to entry (`cli.mochi` starts `str-scan, lexer, ast`,
while `dts.mochi` starts `ast, ctors, types`). Two entries almost never shared a
prefix, so each entry re-inferred nearly its whole graph, once per pass
(strict inference, then recovery). Across the 51 `bootstrap/` entries that came
to 276 module inferences per pass, when there are 52 distinct modules. Sorting
the graph into a canonical order only saved 3: one missing leaf is enough to
break a prefix.

A module reads only its own imports' entries out of a graph state, and every
read is keyed by the dependency's path (`exportsByPath`, `regByPath`,
`keysByPath`, `qualsByPath`). So a module's result depends on its source and
its dependency closure, not on where the walk visited it.

## Decision

- **Slices in the seed.** `bootstrap/module.mochi` exports `inferSliceOf` /
  `mergeInferStates` and `recoverySliceOf` / `mergeRecoveryStates`. A slice is
  the entries one module published. `recoverModuleWith` recovers one module
  with an explicit `isEntry`, since a one-module suffix cannot tell which
  module is the entry.
- **Merkle keys in the host.** The caches hold one slice per module, keyed by
  a hash of its path, its source, and its imports' keys. The recovery key also
  records whether the module is the entry, because `strictEntry` judges only
  the entry strictly. An edit anywhere below a module changes its key, so there
  is no invalidation API.
- **Rebuilt states.** The host infers a module over a state merged from its
  closure's slices, in graph order. Outputs and recovery errors are
  concatenated in graph order, so a query returns what the one-pass fold did.
  A slice's errors are the ones its own module appended.
- **Parse memo.** Each cache also memoizes parses by path and source.
- The whole-graph `entries` memo stays in front of all of this.

The TypeScript core's `ModuleCache` (ADR 0095) is unchanged. These seed exports
serve the host façade only and have no TypeScript-core counterpart to port.

## Consequences

- The `bootstrap/` sweep infers each module about once per pass: 256s → 44s,
  and most of what remains is the first cold graph.
- Stepping recovery one module at a time used to pass every module to the seed
  as the entry. Under `strictEntry` that judged a `"use open"` dependency
  strictly. `isEntry` fixes it, and a spec pins it.
- Each module's output `aliases` holds only its closure's aliases, where the
  fold also carried every module visited before it. Only a module's own types
  can name those aliases, so what is shown does not change.
- A cache is still only valid for one plugin list (ADR 0110).

## Alternatives rejected

**A canonical graph order with the prefix cache.** Cheap, but it saves 3 of 276
inferences on this repository.

**Assembling slices in the host.** The host would have to know the seed's
state shape, which ADR 0101 keeps opaque. With the seed exports, the shape
stays in Mochi.
