# Current Mochi output versus handwritten JavaScript

This comparison measures warmed execution of current generated JavaScript and
equivalent handwritten JavaScript on synthetic workloads. Historical optimization
speedups are a separate experiment; they do not measure competitiveness with JS.

Reproduce with `bun scripts/bench-runtime-comparison.ts`. Compilation and input
construction happen before timing. Standalone JS fixtures and raw samples are
written to `.cache/bench/runtime-comparison/`. The recorded run includes generated
code, source fixtures, engine versions, compiler revision and all timing samples
in [runtime-comparison.json](benchmarks/runtime-comparison.json).

## Method

Five workloads, two implementations, two engines and four independent rounds
produce 80 fresh-process results. Alternating rounds reverse both implementation
order and engine order. Each process warms 20 batches and measures nine batches;
batch sizes are 32 operations for dedupe, four for sum and optional matches, and
16 for the pipeline. Timings are milliseconds per operation, including result
consumption. Input construction, compilation, process startup and output checks
are excluded. Every warmup result and each measured batch's last result is
checked outside timing. Edge checks cover first representative identity, empty
inputs, filter order, small sums, optional nullish/falsy values and a single getter
evaluation.

Each process reports the middle of nine samples. The table reports the median of
four process medians (the average of the middle two), giving each process equal
weight. The ranges below are the minimum and maximum process medians; they are
not confidence intervals. QA did not run concurrently with the recorded timings.

## Results

Measured October 3, 2026 (local time), macOS arm64, Bun 1.4.2 and Node
22.22.3, compiler revision `bd42ab4`. Milliseconds per operation:

| Workload | Bun Mochi | Bun JS | Node Mochi | Node JS |
|---|---:|---:|---:|---:|
| 4,000 unique IDs | 0.081 | 0.071 | 0.187 | 0.185 |
| 4,000 records / 64 IDs | 0.017 | 0.015 | 0.050 | 0.047 |
| Tail sum / 2 million iterations | 11.199 | 0.842 | 2.919 | 1.966 |
| Immediate optional match / 1 million reads | 4.440 | 1.922 | 2.211 | 2.205 |
| Record pipeline / 20,000 rows | 0.379 | 0.275 | 0.804 | 0.719 |

Process-median ranges, in milliseconds:

| Workload | Bun Mochi | Bun JS | Node Mochi | Node JS |
|---|---:|---:|---:|---:|
| Unique IDs | 0.076–0.084 | 0.068–0.080 | 0.185–0.188 | 0.182–0.190 |
| Repeated IDs | 0.017–0.017 | 0.014–0.015 | 0.049–0.051 | 0.047–0.051 |
| Tail sum | 11.167–11.295 | 0.842–0.850 | 2.917–2.965 | 1.965–1.998 |
| Optional match | 4.165–4.985 | 1.914–1.926 | 2.200–2.215 | 2.201–2.241 |
| Record pipeline | 0.347–0.383 | 0.268–0.299 | 0.798–0.824 | 0.715–0.727 |

The unique-ID dedupe median is about 1.14x the JS time on Bun and 1.01x on Node;
overlapping process ranges do not establish a meaningful Node difference. The
pipeline takes about 1.38x the JS time on Bun and 1.12x on Node. The tail sum is
still about 13.3x slower on Bun and 1.5x on Node despite its historical improvement.
Immediate optional matching takes about 2.3x the JS time on Bun, while Node's
ranges overlap. Ratios use unrounded medians; smaller is better in this table.

The optional-read timings are not a remeasurement of the historical card: batch
warming, edge probes and the shared host driver differ from that original
experiment. Preserve the two experiments' context rather than combining their
timings into a new before/after ratio. The old investigation scripts retain their
original fixed-order protocols. These new repeated rounds measure current Mochi
versus JS only; no confidence interval or universal speed ranking is implied.

## What is being compared

- **Unique IDs:** 4,000 records with distinct finite numeric IDs. Both retain the
  original records using a filter and Set membership. Mochi's general primitive
  projection runtime also retains its type dispatch and fallback machinery.
- **Repeated IDs:** the same count, cycling through 64 IDs. Both keep the first
  representative in source order. These two fixtures do not compare structural
  equality, NaN policy or arbitrary host effects against native Set semantics.
- **Tail sum:** sum integers from zero to two million minus one. Mochi uses a
  tail-switch loop; JS uses a direct `for` loop and native arithmetic. This tests
  remaining emitted loop/arithmetic overhead against an idiomatic implementation.
- **Optional match:** a shared host loop calls either the compiled Mochi read or
  a handwritten nullish branch one million times, cycling through 256 records.
  It isolates the immediate-read function, rather than Mochi collection indexing.
- **Record pipeline:** 20,000 records with 5,000 IDs. Filter inactive records,
  keep the first active row per ID, normalize missing amounts to zero, then sum.
  Both implementations use filter/filter/map/reduce stages and materialize
  intermediate arrays. JS uses a numeric-ID Set; Mochi uses its general dedupeBy
  runtime. An independent imperative oracle checks the final checksum.

The pipeline combines common collection operations, but remains synthetic. A
fused JS loop, IO, JSON decoding, compiler latency, cold execution, allocation
counts and other engines/hardware are outside this experiment. Input shapes are
reused after warming. These results support conclusions about these fixtures,
not whole-language or application throughput rankings.
