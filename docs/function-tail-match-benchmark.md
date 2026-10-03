# Function-tail match benchmarks

Measured locally on 2026-10-03 with Bun 1.4.2 and Node v22.22.3. Compare actual
compiler output before this change (`fa4a89a`) with the new native switch output.
The previous builtin fixtures use Result/Option runtime dispatch; the custom
Shape fixtures use ternary tests and destructuring IIFEs. The runtime table's
ratios are previous/native switch; higher means faster native switches.

## Runtime results

Milliseconds per 65,536 calls, using the median of four fresh-process medians.

| Fixture | Bun previous | Bun switch | Ratio | Node previous | Node switch | Ratio |
|---|---:|---:|---:|---:|---:|---:|
| result-captured | 0.870 | 0.575 | 1.51× | 0.290 | 0.289 | 1.01× |
| result-skewed | 0.814 | 0.565 | 1.44× | 0.287 | 0.290 | 0.99× |
| option-captured | 0.638 | 0.531 | 1.20× | 0.275 | 0.284 | 0.97× |
| option-skewed | 0.741 | 0.518 | 1.43× | 0.285 | 0.283 | 1.01× |
| result-effects | 7.156 | 7.120 | 1.01× | 20.091 | 14.553 | 1.38× |
| option-effects | 6.962 | 6.890 | 1.01× | 18.703 | 14.182 | 1.32× |
| shape-captured | 1.009 | 0.577 | 1.75× | 0.299 | 0.302 | 0.99× |
| shape-effects | 1.365 | 0.604 | 2.26× | 0.687 | 0.325 | 2.11× |

Cheap Bun matches improve in these fixtures; expensive builtin Bun handlers are
roughly at parity. Cheap Node cases are within a few percent, with a small
regression for balanced Option. Effectful Node cases and custom Shape matches
show gains. These are local exploratory measurements, not universal speedups.

## Compiler and formatter

Milliseconds per operation, median of two fresh-process medians on Bun.

| Workload | Previous | Switch seed | Ratio |
|---|---:|---:|---:|
| compile-tour | 12.296 | 11.287 | 1.09× |
| format-codegen | 70.560 | 68.105 | 1.04× |

The tour compiles with runtime definitions omitted. Its emitted text changes as
expected; both variants check successful, deterministic output. The formatter
workload includes lex, parse and format of the same current codegen source, and
both variants produce the same output hash. These small samples suggest no
material tooling regression; the formatted native switches occupy more lines.

## Method and reproduction

```sh
bun scripts/bench-function-tail-match.ts
bun scripts/bench-function-tail-match-tools.ts
```

The runtime script uses checked-in previous emitted JS and current compiler
output. Each variant runs in a separate fresh process, alternating engine and
variant order across four rounds: 128 processes total. Each process builds 1,024
frozen inputs, warms up 20 batches, and records 20 batches of 65,536 calls. The
median is sorted sample index 10. Factory creation stays outside timing; match
execution and any callback construction are inside it. Independent checksum and
selected-effect checks run outside the clock after every batch.

Cases cover captured locals, balanced and skewed tags, selected effects,
20-iteration arithmetic handlers, and a custom three-constructor variant with
named and positional payloads. The longer warmup checks an initial short-warmup
Node skewed-Option slowdown; it did not persist in the four-round run. JIT,
thermal state and sub-millisecond measurements limit precision. No claim is made
that the host eliminates allocations or that arbitrary matches become faster.

The tooling script retrieves the previous seed from git and loads each seed in
separate fresh Bun processes. It records two rounds with reversed variant order,
20 warmup iterations and 20 timed samples per process. Benchmarks run separately
from QA. Strict-TS, language, docs-output and self-hosted gates establish
correctness independently of these timings.

Raw sources and samples:
[previous emitted JS](benchmarks/function-tail-match-baseline.json),
[runtime runs and both emitted outputs](benchmarks/function-tail-match.json),
[compiler/formatter runs](benchmarks/function-tail-match-tools.json).
See [ADR 0147](adr/0147-function-tail-match-statements.md) for eligibility and
fallback decisions.
