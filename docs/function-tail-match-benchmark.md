# Function-tail match benchmarks

Measured locally on 2026-10-03 with Bun 1.4.2 and Node v22.22.3. Compare actual
compiler output before this change (`fa4a89a`) with the current compiler. Native
switches apply to custom constructor matches; eligible builtin Result/Option
pairs retain their compact runtime dispatch, including at function tails.
Ratios are previous/current; higher means faster current output.

## Builtin controls

All six Result/Option fixtures from the previous dispatch benchmark emit
byte-identical JS to the previous compiler: captured locals, balanced/skewed tags
and effectful arithmetic handlers. The script checks this on every run rather
than timing identical code and interpreting measurement noise as a change.
There is no new builtin match-site lowering or runtime-helper performance claim.

## Custom variant runtime results

Milliseconds per 65,536 calls, using the median of four fresh-process medians.
The previous Shape output uses ternary tests and destructuring IIFEs; current
output uses scoped native switch cases with direct returns.

| Fixture | Bun previous | Bun current | Ratio | Node previous | Node current | Ratio |
|---|---:|---:|---:|---:|---:|---:|
| shape-captured | 0.990 | 0.586 | 1.69× | 0.306 | 0.305 | 1.00× |
| shape-effects | 1.445 | 0.602 | 2.40× | 0.699 | 0.328 | 2.13× |

The custom captured case improves on Bun and is near parity on Node. The
custom effectful case improves on both engines. These are local exploratory
measurements, not universal speedups.

## Compiler and formatter

Milliseconds per operation, median of two fresh-process medians on Bun.

| Workload | Previous | Current seed | Ratio |
|---|---:|---:|---:|
| compile-tour | 13.929 | 12.325 | 1.13× |
| format-codegen | 71.585 | 68.287 | 1.05× |

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

The runtime script checks all eight fixtures using checked-in previous emitted
JS and current compiler output, then times the two custom Shape fixtures. Each
variant runs in a separate fresh process, alternating engine and variant order
across four rounds: 32 timed processes total. Each process builds 1,024 frozen
inputs, warms up 20 batches, and records 20 batches of 65,536 calls. The median is
sorted sample index 10. Factory creation stays outside timing; match execution
and any callback construction are inside it. Independent checksum and selected
effect checks run outside the clock after every batch.

Custom cases cover captured locals and selected effects over a three-constructor
variant with named and positional payloads. JIT, thermal state and
sub-millisecond measurements limit precision. No claim is made that the host
eliminates allocations or that arbitrary matches become faster.

The tooling script retrieves the previous seed from git and loads each seed in
separate fresh Bun processes. It records two rounds with reversed variant order,
20 warmup iterations and 20 timed samples per process. Benchmarks run separately
from QA. Strict-TS, language, docs-output and self-hosted gates establish
correctness independently of these timings.

Raw sources and samples:
[previous emitted JS](benchmarks/function-tail-match-baseline.json),
[runtime runs and both emitted outputs, including builtin controls](benchmarks/function-tail-match.json),
[compiler/formatter runs](benchmarks/function-tail-match-tools.json).
See [ADR 0147](adr/0147-function-tail-match-statements.md) for eligibility and
fallback decisions.
