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

Recorded on 2026-10-03 with Bun 1.4.2 and Node v22.22.3. Two rounds used 48 fresh
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
| Two-field records | Bun | 1.884 | 0.744 | 2.53× |
| Two-field records | Node | 4.480 | 1.015 | 4.41× |
| Nested records | Bun | 2.456 | 1.232 | 1.99× |
| Nested records | Node | 5.432 | 2.047 | 2.65× |
| Wide records, early difference | Bun | 6.183 | 2.135 | 2.90× |
| Wide records, early difference | Node | 18.856 | 2.305 | 8.18× |
| Two constructors with payloads | Bun | 2.215 | 1.279 | 1.73× |
| Two constructors with payloads | Node | 5.411 | 1.918 | 2.82× |
| Wide records, late difference | Bun | 7.477 | 7.201 | 1.04× |
| Wide records, late difference | Node | 19.918 | 10.006 | 1.99× |
| Wide records, all equal | Bun | 0.847 | 0.750 | 1.13× |
| Wide records, all equal | Node | 2.125 | 1.039 | 2.05× |

The initial revision took about 45% longer on Bun for wide records with an early
field difference. Profiling identified repeated key sorting as a major cost.
The revised path finds the first ordered key before sorting the rest, reuses
that result and the sorted key list when both fresh field lists match, and
checks equal field values directly before recursive dispatch. Small unsorted
key lists use a private insertion-sort buffer (at most 16 keys); larger shapes
retain native sorting. No object-key cache or payload cache is introduced.

The expanded suite includes late differences and equal records rather than
only the original early-difference workload. Bun's late-difference result is
roughly parity: a 4% point estimate from two process medians is not a reliable
speedup claim. The original wide-record regression is absent in these runs;
that does not establish regression-free behavior for every shape. The public
compare still supports currying.

The two versions intentionally produce different numeric ordering. The old
variant is checked against JSON-text order; the new one against numeric fields
and constructor tags. Their sort comparison counts can differ, so these are
end-to-end workload timings, not isolated comparator throughput. Different key distributions, larger shapes, identity-keyed collections and
application throughput are not measured. No allocation measurement is claimed.
