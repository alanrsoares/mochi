# Tail-switch recur benchmark

Measured on 2026-10-03, macOS arm64, Bun 1.4.2 and Node 22.22.3.
Reproduce with `bun scripts/bench-tail-switch.ts`. Frozen standalone fixtures
and raw timing logs live in `.cache/bench/tail-switch/`.

Compile under Bun, then time each variant in a fresh process. Each operation
runs two million iterations, with 30 full-size warmups and 12 measured samples.
Compilation and array-input construction are excluded. Check independently
calculated results at zero, small, odd/even and full-size inputs.

`previous` reconstructs the pre-change emitted run binding and step helpers;
`emitted` uses actual production output; `candidate` uses hand-written statement
lowering. Arithmetic and Array.get runtime helpers remain identical. The Option
scan still constructs Options through Array.get: this optimization removes the
loop's step transport, not the collection API's representation.

Median milliseconds per operation, from the final run with QA stopped:

| Fixture | Bun previous | Bun emitted | Bun candidate | Node previous | Node emitted | Node candidate |
|---|---:|---:|---:|---:|---:|---:|
| Count | 29.24 | 3.83 | 3.84 | 28.21 | 1.92 | 1.92 |
| Sum | 31.29 | 11.19 | 11.26 | 41.79 | 2.93 | 2.92 |
| Option scan | 45.58 | 15.65 | 16.87 | 40.25 | 7.63 | 7.59 |

Production is about 2.8–7.6x faster on Bun and 5.3–14.7x on Node in these
fixtures, closely matching the statement candidate. An earlier investigation
run reproduced the direction before implementation.

These are laptop microbenchmarks with fixed variant order; they do not establish
application throughput or allocation counts. Guards, nested patterns, lazy Lists,
escaping closures and typed TS are tested separately from these timing fixtures.

## Compiler and formatter check

Compare merged main (`d954593`) with the refreshed seed on identical current
sources. Warm each operation three times, then alternate old/new order across
12 samples, without QA running concurrently. Full bootstrap graph
check+infer+codegen medians were 1598.34 versus 1638.98 ms (+2.5%). Formatter
medians were 96.29 versus 92.03 ms for the parser, 99.13 versus 102.46 ms for
inference and 15.88 versus 14.35 ms for the snake component. These small,
mixed wall-time differences do not establish a compiler speed improvement or
a substantial regression. Raw results: `.cache/bench/tail-switch-compiler.jsonl`.
