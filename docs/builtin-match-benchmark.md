# Builtin match dispatch benchmark

ADR [0146](adr/0146-builtin-match-dispatch.md) emits flat runtime dispatch for
eligible builtin Result and Option matches. It replaces nested ternaries at those
sites while retaining callbacks and the existing fallback for complex patterns.

Run `bun scripts/bench-builtin-match.ts` separately from QA. The committed
[baseline](benchmarks/builtin-match-baseline.json) contains actual JS emitted by
parent revision `dab9de6`; the script compiles the same Mochi sources with the
current compiler and saves sources, both outputs and raw samples in
[builtin-match.json](benchmarks/builtin-match.json).

Recorded on 2026-10-03 with Bun 1.4.2 and Node v22.22.3. Two rounds used 48 fresh
processes, reversing engine and variant order in round two. Each process warms up
five times and takes twelve samples of 65,536 matches over 1,024 frozen values.
The emitted factory captures bias and an effect callback. Independent result and
selected-branch effect checks run outside timing. Skewed inputs select Err/None
once every eight calls; other inputs are balanced. Effectful cases also perform
twenty arithmetic iterations per selected arm. Factory creation is outside timing;
callback creation at the match site is included.

Times are milliseconds per 65,536 matches, averaged across the two process
medians. Speedup is previous/current; below one means slower.

| Fixture | Engine | Ternaries | Dispatch | Speedup |
|---|---|---:|---:|---:|
| Result, captured | Bun | 0.861 | 0.728 | 1.18× |
| Result, captured | Node | 0.295 | 0.296 | 1.00× |
| Result, skewed | Bun | 0.978 | 0.919 | 1.06× |
| Result, skewed | Node | 0.286 | 0.288 | 0.99× |
| Option, captured | Bun | 0.866 | 0.682 | 1.27× |
| Option, captured | Node | 0.278 | 0.286 | 0.97× |
| Option, skewed | Bun | 0.964 | 0.760 | 1.27× |
| Option, skewed | Node | 0.288 | 0.286 | 1.01× |
| Result, effects and arithmetic | Bun | 7.462 | 6.817 | 1.09× |
| Result, effects and arithmetic | Node | 26.110 | 19.609 | 1.33× |
| Option, effects and arithmetic | Bun | 7.280 | 6.576 | 1.11× |
| Option, effects and arithmetic | Node | 24.134 | 18.568 | 1.30× |

Cheap Node cases are effectively at parity, including small slowdowns. These
measurements support the selected scope, not a universal performance guarantee
or a claim that closures are allocation-free.

`bun scripts/bench-builtin-match-tools.ts` compares the parent/current frozen
compiler and syntax bundles in eight fresh Bun processes, with reversed variant
order, twenty warmup iterations and twenty samples per process. Both versions use
the same tour and current codegen source. Output hashes agree across all runs.
Raw sources and measurements are in [builtin-match-tools.json](benchmarks/builtin-match-tools.json).

| Workload | Previous | Dispatch | Speedup |
|---|---:|---:|---:|
| Compile `examples/example.mochi`, runtime disabled | 12.782 ms | 12.771 ms | 1.00× |
| Lex, parse and format `codegen.mochi` | 67.557 ms | 65.864 ms | 1.03× |

These workloads are roughly at parity. An initial short-warmup formatter run
suggested a 10% slowdown; the longer run above did not reproduce it. JIT warmup,
GC and host noise matter. This is a local benchmark with two process repetitions
per variant, not a statistically powered regression threshold.
