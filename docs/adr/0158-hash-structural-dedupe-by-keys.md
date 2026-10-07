# 0158 — Hash structural keys in Array.dedupeBy

- **Status:** Accepted
- **Date:** 2026-10-07
- **Source:** issue #163, `docs/dedupe-by-benchmark.md`
- **Extends:** ADR 0141, ADR 0084; equality semantics remain unchanged.

## Context

ADR 0141 left object projection keys on an ordered `eq` scan, so deduplicating
records by value stayed quadratic (4,000 nested records: about 184 ms on Bun).
`eq` is structural, so a native `Set` cannot index them, and `eq` observably
reads getters and throws on lazy Lists.

## Decision

Index retained object keys by `_eqHash`, a hash consistent with `eq`: eq-equal
values hash alike (integers and strings by value, zeros coalesced, records
order-insensitively over own enumerable keys, arrays by element, depth-limited).
A candidate is compared with `eq` only against its bucket.

A key is *unhashable* when inspecting it could be observable or `eq` could throw:
accessor properties, array holes, Maps, Sets and other iterables. Unhashable keys
keep the previous behaviour exactly: they are scanned against every retained key
in order. A hashable candidate additionally scans retained unhashable keys, but
only those retained before its first bucket match, which is exactly the set the
plain scan would have reached. Hash computation reads data descriptors only and
never invokes a getter.

Primitive keys, NaN retention, signed-zero representatives, one projection call
per visited item and result order are unchanged. Plain `Array.dedupe` stays
as it is.

## Consequences

Hashable object keys cost O(1) expected comparisons; the benchmark shows the
quadratic cliff gone (4,000 nested records 184 → 0.7 ms). Adversarial inputs that
collide on one hash degrade to the old scan, never to a different result.
A `Proxy` key is inspected through its traps once more than before (ownKeys and
descriptor reads for hashing); this is the one accepted observable difference.

## Alternatives rejected

- **Hash every key and read through getters:** changes getter read counts and order.
- **Sort-and-adjacent comparison:** changes the retained representative and order.
