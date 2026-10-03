# Structural comparison benchmark

ADR [0145](adr/0145-structural-ordering.md) replaces JSON-text ordering of records
and variants with recursive field comparison. This fixes numeric ordering and
insertion-order dependence; it does not guarantee a speedup for every shape.

Run `bun scripts/bench-structural-compare.ts` from the repository root. The
script freezes the current generated runtime into executable fixtures in
`.cache/bench/structural-compare`, uses the committed pre-change runtime in
[`benchmarks/structural-compare-baseline.mjs`](benchmarks/structural-compare-baseline.mjs),
and writes inputs, both runtime sources and all raw samples to
[`benchmarks/structural-compare.json`](benchmarks/structural-compare.json).

Recorded on 2026-10-03 with Bun 1.4.2 and Node v22.22.3. Two rounds used 32 fresh
processes, reversing variant and engine order in the second round. Each process
sorted 1,500 deterministic shuffled values, warmed up with ten sorts, and
collected twelve samples of ten sorts each. Copying the input array is included
in the timing. Inputs are frozen; result order and original object identity are
validated outside the timer against an independent model for each variant.
Benchmarking ran separately from QA.

Times below are milliseconds per sort, using the median of the two process
medians. Speedup is previous/current; values below 1 mean slower.

| Shape | Engine | JSON fallback | Structural | Speedup |
|---|---|---:|---:|---:|
| Two-field records | Bun | 1.893 | 0.841 | 2.25× |
| Two-field records | Node | 4.545 | 1.156 | 3.93× |
| Nested records | Bun | 2.407 | 1.319 | 1.82× |
| Nested records | Node | 5.435 | 2.070 | 2.63× |
| Thirteen-field records | Bun | 6.410 | 9.280 | 0.69× |
| Thirteen-field records | Node | 19.013 | 12.671 | 1.50× |
| Two constructors with payloads | Bun | 2.290 | 2.057 | 1.11× |
| Two constructors with payloads | Node | 5.401 | 2.778 | 1.94× |

The wide-record Bun case takes about 45% longer. Key sorting and traversal costs
depend on shape: small fixtures already have keys in comparison order, whereas
the wide fixture has `field0` through `field11` in numeric insertion order and
must reorder them lexically. The implementation skips sorting already ordered
key lists and uses an uncurried internal recursive function; the public compare
still supports currying.

The two versions intentionally produce different numeric ordering. The old
variant is checked against JSON-text order; the new one against numeric fields
and constructor tags. Their sort comparison counts can differ, so these are
end-to-end workload timings, not isolated comparator throughput. Equal records,
late differences, different key distributions, identity-keyed collections and
application throughput are not measured. No allocation measurement is claimed.
