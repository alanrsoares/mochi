# `loop/recur` rebinding benchmark

Investigation of `.scratch/issues-syntax-and-codegen-traps.md`, issue 1.
Measured on 2026-10-02, macOS arm64, Bun 1.4.2 and Node 22.22.3, against
`cb83290` plus the benchmark harness. The compiler was unchanged.

Scalar temporaries are worth investigating as a compiler optimization. The
current array lowering costs time on Bun in every tested case, and causes
substantial allocation churn for the large numeric sum on Node. The draft's
claim that every loop iteration necessarily allocates a heap array is too broad:
the other Node fixtures show no comparable churn.

Reproduce from the repository root:

```sh
bun run bench loop --runs 12 --save loop-recur-bun
bun scripts/bench-loop-node.ts
```

The Bun suite uses the existing wall-time harness. The Node script compiles the
same fixtures under Bun, freezes their JS into `.cache/bench/loop-recur/`, and
measures each variant in a fresh Node process. It saves untraced timing logs and
separate `--trace-gc-nvp` logs there. Trace timings are excluded from the table.

Each operation runs 2,000,000 iterations. Each function receives 30 full-size
warmup calls before 12 measured calls; compilation is excluded. Full-size warmup
matters because the sum accumulator grows beyond the small-integer range. Both
variants are checked against independent expected results at zero, small,
odd/even, and full-size inputs. Fixtures cover counting, summing, simultaneous
rotation, and mixed string/boolean/number state.

The scalar candidate replaces only the single direct rebinding statement in
the actual compiled JS. All runtime helpers stay identical. It evaluates every
argument left to right into a temporary before assigning any loop parameter,
preserving swaps and dependencies on old values. This is a benchmark-only
transformation; the compiler still emits array destructuring.

| Fixture | Bun emitted best / median (ms) | Bun scalar best / median (ms) | Node emitted best / median (ms) | Node scalar best / median (ms) |
|---|---:|---:|---:|---:|
| count, 2 parameters | 6.0 / 8.2 | 2.5 / 2.5 | 1.23 / 1.31 | 1.23 / 1.24 |
| sum, 2 parameters | 97.4 / 99.4 | 7.0 / 7.1 | 5.93 / 5.99 | 1.88 / 1.91 |
| rotation, 4 parameters | 11.5 / 12.2 | 2.0 / 2.0 | 1.20 / 1.24 | 0.99 / 1.01 |
| mixed state, 4 parameters | 11.3 / 12.8 | 4.7 / 4.9 | 1.85 / 1.90 | 0.99 / 1.08 |

A second Bun process reproduced the direction: count 6.6 versus 2.5 ms, sum
95.4 versus 7.1 ms, rotation 11.5 versus 2.0 ms, and mixed state 10.1 versus
4.6 ms (best times). The first fully warmed process is reported in the table.

Node's separate GC run covers 24,000,000 measured iterations. The sum's emitted
variant has 746 GC events, including the forced final collection, and a sum of
768,651,488 bytes in the trace's `allocated` fields. Its scalar variant has only
the forced final collection and 651,296 traced bytes. Every other variant has
only the forced final collection and approximately 650 KB of traced allocation.
These process-level traces include measurement overhead and do not identify
which object types were allocated. They demonstrate the difference between the
two lowerings, rather than proving an array allocation on each iteration.

Limitations: laptop wall times are noisy, the fixed variant order can bias them,
and these are microbenchmarks rather than application throughput measurements.
Bun allocation counts were not measured. The tail-switch `_recur`/`_done`
protocol, single-parameter loops, escaping closures, effectful extern arguments,
and typed TypeScript output are outside this comparison. A production change
needs guards for argument evaluation order, old-value captures, scope and name
collisions, and strict TS output; it should then be checked with compiler and
formatter benchmarks as well as this suite.
