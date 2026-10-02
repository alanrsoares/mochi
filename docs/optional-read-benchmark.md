# Optional record reads: benchmark investigation

Measured on 2026-10-02, macOS arm64, Bun 1.4.2 and Node 22.22.3.
The initial investigation left the compiler unchanged; production validation is
recorded below. Run `bun scripts/bench-optional-read.ts` from the repo
root; standalone fixtures and raw samples are saved under
`.cache/bench/optional-read/`.

Each fresh engine process warms its function with 20 calls, then measures 12
calls of one million reads. Compilation is excluded. Inputs alternate absent
fields and present numeric values over 256 records. A checksum consumes every
result. The escaping case stores all one million Options in an array before
summing them, preventing them from being merely transient match inputs.
Untimed guards check absence, zero, nullish values and one getter evaluation.

The initial two candidates were experiments: a hoisted Option wrapper
with the same representation, and a hand-written specialization of
`switch row.value { | Some(v) => v | None => 0 }` that reads once and returns
the number directly. The latter changes only this whole function. It does not
establish that arbitrary patterns, guards or typed output can use that lowering.

First run, median milliseconds per million reads:

| Workload | Bun emitted | Bun candidate | Node emitted | Node candidate |
|---|---:|---:|---:|---:|
| Option read, immediately consumed by host | 4.04 | 3.49 | 2.75 | 2.89 |
| Option read, stored then consumed | 7.29 | 5.49 | 26.45 | 26.52 |
| Optional read immediately matched in Mochi | 7.98 | 1.26 | 4.08 | 1.47 |

The strongest result is eliminating the intermediate Option and generic match
for immediate scrutiny. Simply hoisting the wrapper is not a consistent
cross-engine improvement and does not remove escaping Option objects.

These timings do not measure allocation counts, prove one heap allocation per
read, or predict application throughput. The fixed variant order, GC and laptop
load can bias results. Repeated samples and a separate GC study are needed
before claiming memory savings. A repeat run overlapping the full QA gate was
discarded for interference.

A subsequent run after QA completed reproduced the main result: immediate-match
medians were 8.37 versus 1.30 ms on Bun and 3.98 versus 1.55 ms on Node. Hoisted
wrappers again slowed immediately consumed reads on Node (2.74 versus 2.98 ms).
Escaping-read medians varied (Bun 7.75 versus 5.10 ms; Node 30.02 versus 26.61 ms),
so do not infer a stable memory or application benefit from those samples.

## Production lowering (ADR 0139)

The shared compiler now fuses an optional field read followed by exactly two
unguarded, unqualified Some/None arms. The Some payload must bind a name or be
a wildcard, and the registry must use builtin constructor field layouts.
The emitted IIFE reads the member once, branches on nullishness and binds the
raw payload inside the present branch. Other patterns keep ordinary lowering.
Typed fallback wrappers preserve tag literal types with `as const`.

The harness now retains the frozen previous immediate-match body as `previous`,
measures actual production output as `emitted`, and keeps the original direct
function as `candidate`. Its single-read and result guards check all variants.
After freezing the seed, warmed median milliseconds per million matches:

| Engine | Previous output | Production output | Hand-written candidate |
|---|---:|---:|---:|
| Bun 1.4.2 | 7.79 | 2.65 | 1.36 |
| Node 22.22.3 | 4.16 | 1.44 | 1.46 |

Production improved this fixture by about 2.9x on both engines. Bun's gap from
the direct candidate remains: production wraps the branch in an IIFE within the
source lambda, while the candidate branches directly in its function body.
These microbenchmarks do not establish an application speedup or measured heap
savings. Raw production logs and all standalone variants are in the cache folder.

Seed-owned specs cover eligibility and layout fallbacks. Integration and strict-TS
guards cover both arm orders, discarded payloads, single target/getter evaluation,
falsy/nullish values, generics, nested matches, record results, closures, name
collisions and guarded/catch-all/nested-pattern fallbacks.

No broad optional-read rewrite is justified by this measurement.
