# 0141 — Cache primitive projection keys in Array.dedupeBy

- **Status:** Accepted
- **Date:** 2026-10-03
- **Source:** issue #163, `docs/dedupe-by-benchmark.md`
- **Extends:** ADR 0084; equality semantics remain unchanged.

## Context

Array.dedupeBy scans all prior retained keys with eq. Unique primitive projections
therefore require quadratic work, including common record-ID projections.
Native Set membership agrees with eq on primitives except NaN: eq(NaN, NaN)
is false, whereas Set coalesces NaNs. Plain Array.dedupe has a different legacy
NaN result and rereads input elements through findIndex, including host getters.

## Decision

Cache primitive projection keys in a native Set. Include null, undefined,
functions and symbols; retain every projected NaN explicitly. Set membership
coalesces signed zeros, while filter retains the first original representative.

Keep an ordered array of retained non-null object keys, compared with eq as
before. Primitive/object pairs cannot compare equal and eq does not traverse
their fields, so skipping those cross-category comparisons preserves getter
effects. Evaluate the projection exactly once for each visited item, inside the
existing filter traversal. Sparse slots, projection mutations and result order
keep their current behavior. Object-key comparison remains quadratic, with
the existing lazy-List exception and native Map/Set identity-key policy.

Leave plain Array.dedupe unchanged. Structural hashing and replacing native
Map/Set key semantics are separate decisions.

## Validation

Benchmark frozen previous and emitted runtimes in isolated Bun/Node processes.
Property tests compare mixed keys against the previous scan model; integration
guards cover first representatives, projection effects and structural keys.
Runtime guards cover NaN, signed zero, references, sparse slots, getter order and
projection mutations. Regenerate runtime definitions, prelude shim and seed via
the repository scripts and pass the full gate.
