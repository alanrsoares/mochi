# Primitive projection keys in Array.dedupeBy

Measured on 2026-10-03, macOS arm64, Bun 1.4.2 and Node 22.22.3.
Reproduce with `bun scripts/bench-dedupe-by.ts`. Frozen standalone runtime JS
and raw timing samples are saved under `.cache/bench/dedupe-by/`.

## Scope and method

Compare the previous ordered eq scan with the actual generated runtime definition
from the production TypeScript source. Both use the same current eq and _curry
helpers. Production uses native Set membership for primitive projection keys and
an ordered eq scan for non-null objects. Projected NaNs remain distinct, signed
zeros coalesce, and the first original item is retained. See [ADR 0141](adr/0141-primitive-dedupe-by.md).

Each fixture/variant/engine runs in a fresh process. Construct inputs outside
timing, warm eight calls, measure twelve calls and check every result's length,
order and representative identity outside the timed interval. Repeat the full
experiment with reversed variant order: 64 process results. Edge guards check
NaN, signed zero, null/undefined, sparse slots, functions, symbols, bigint,
structural objects, mixed primitive types and projection evaluation order.
QA completed before timing; no QA processes overlapped the production benchmark.

## Production results

Median milliseconds per operation from round two:

| Workload | Bun previous | Bun emitted | Node previous | Node emitted |
|---|---:|---:|---:|---:|
| 1,000 unique numbers | 1.721 | 0.039 | 3.207 | 0.061 |
| 4,000 unique numbers | 27.038 | 0.140 | 50.821 | 0.262 |
| 4,000 unique strings | 38.961 | 0.158 | 56.417 | 0.265 |
| 4,000 numbers, 64 keys | 0.516 | 0.051 | 0.663 | 0.079 |
| 4,000 identical numbers | 0.112 | 0.056 | 0.092 | 0.061 |
| 4,000 records projected to numeric ID | 27.031 | 0.145 | 50.825 | 0.251 |
| 400 structurally compared record keys | 3.167 | 3.095 | 4.589 | 4.641 |
| 4,000 mixed unique numbers/strings | 41.829 | 0.160 | 55.177 | 0.264 |

Primitive gains repeated in both rounds. Four thousand unique numeric keys
improved roughly 193–210x on Bun and 194–199x on Node. Growing that fixture from
1,000 to 4,000 items increased the previous time about 16x, versus about 3–4x
for production. Repeated-key gains were smaller: about 8–10x for 64 keys and
1.4–2.3x for one key. These are microbenchmarks of a quadratic baseline, not
predictions of application throughput or measured allocation reductions.

Object-key comparison remains quadratic. Its first-round medians were Bun
3.182 → 3.420 ms and Node 4.254 → 4.614 ms, about 7–8% slower. The second round
was about 2% faster on Bun and 1% slower on Node. No consistent object-key gain
is established; this change targets primitive projections. These short timings
can vary with JIT, GC and laptop load despite reversed variant order.

## Plain Array.dedupe remains unchanged

The initial investigation also timed a primitive candidate for plain dedupe,
but its findIndex scans reread source elements. On a two-element host array
whose first slot is a getter, current dedupe performs three getter reads while
a Set-based filter performs one. The same output does not preserve those effects.
Plain dedupe also drops NaNs, while dedupeBy retains them; adopting Set semantics
without an explicit exception changes both APIs' legacy results. Only dedupeBy
ships in this change. Structural hashing and equality-policy changes remain
separate work under #163 and ADR 0138.

Runtime property tests compare mixed JSON/undefined/NaN/zero keys against the
previous scan model. Additional guards cover getter order, sparse visitation,
projection mutations and first representative identity. Compiled-language guards
exercise effectful ID projections and structural record projections. The runtime
definitions, bootstrap prelude and seed are regenerated through repo scripts;
the full gate includes strict self-TS, fixpoint and artifact freshness.

## Structural keys (ADR 0158)

Object projection keys are now hashed (`_eqHash`) and compared with eq only within
a bucket; accessor, hole and iterable keys keep the ordered scan. Median ms per
operation, previous scan versus emitted (mean of the two rounds):

| Workload | Bun previous | Bun emitted | Node previous | Node emitted |
|---|---:|---:|---:|---:|
| 400 record keys | 1.85 | 0.042 | 2.27 | 0.10 |
| 4,000 nested record keys | 184.5 | 0.68 | 231.1 | 0.77 |
| 4,000 keys, 100 distinct | 5.05 | 0.73 | 6.76 | 0.97 |
