# 0159 — Persistent `Map`/`Set` for large collections

- **Status:** Proposed
- **Date:** 2026-10-07
- **Source:** issue #163 (item 3), `scripts/bench-persistent-map.ts`
- **Extends:** ADR 0150, ADR 0152 (native `Map`/`Set`, structural keys). No change to `==`, `compare`, `show` or the surface.

## Context

`Map.set`/`delete` and `Set.add`/`delete` copy the whole collection (`new Map(m).set(k, v)`), so
folding N writes is O(N²). Bun, string keys, `bun scripts/bench-persistent-map.ts`:

| entries | build by folding `Map.set` | trie build | 200 single updates, copy vs trie |
|--:|--:|--:|--:|
| 1,000 | 1.6 ms | 0.3 ms | 0.2 ms vs 0.04 ms |
| 5,000 | 48 ms | 0.9 ms | 4.8 ms vs 0.04 ms |
| 20,000 | 862 ms | 5.5 ms | 19 ms vs 0.05 ms |

Below ~1k entries the native copy is as fast as a trie. A trie reads 3–4× slower than native
(`get` over 20,000 keys: 0.13 ms vs 0.55 ms). Native mutable building (0.4 ms for 20,000) is
unavailable: values are persistent.

Constraints any design must keep:

- **Native bridge.** `Map<K, V>` prints as the TS `Map<K, V>`; `eq`, `compare`, `show`, `_keyOf` and host code use `instanceof Map` and the iteration protocol. 26 compiler `.mochi` files fold `Map.set`/`Set.add` (scopes, registries, module state).
- **Insertion order is observable** (`Map.keys`, `Map.values`, `Set.toArray`, `show`, deterministic emit). A plain hash trie iterates in hash order, so the sizing prototype is not enough.
- **Structural keys** (ADR 0152): lookup is by `eq`, not `SameValueZero`; a trie needs `_eqHash` (ADR 0158) for object keys.

## Stage 0 finding (workload survey)

Probing `new Map(m)`/`new Set(s)` copy sizes while building the compiler graph
(`mochi build --emit=ts packages/cli/src/driver.mochi`, 14.8 s): 447k Map copies,
63.5k of them ≥512 entries (max 9,856), 215M elements copied, 577 ms (~4% of the
build). A single site accounts for all of it: `typeAtFrom` in
`codegen/typescript.mochi`, which folds every inferred type's span into a `Map`
(`Map.set(spanKey(r.span), r.ty, acc)`) before TS emit. Sets never exceed 525
entries (58 copies ≥512, 30k elements); `mochi fmt` copies nothing over 103.

So the quadratic fold is real, but it is one fold-built table, not general
persistent-map use. A bulk builder fixes it without touching the representation.

## Options

1. **Status quo.** No work; quadratic folds stay.
2. **Replace the representation with an ordered HAMT.** Uniformly fast writes; breaks the native bridge (`instanceof`, `.d.ts`, host callers), slower reads everywhere, reseeds the compiler.
3. **Separate persistent type** (`PMap`/`PSet`, like `Dict`, ADR 0150). Opt-in and no bridge risk; duplicates the API and leaves existing `Map.set` folds quadratic.
4. **Bulk builders** (`Map.fromEntries`, `Map.setAll`). `Map` has none today (`Dict` has `fromEntries`; `Set` has `fromArray`). Linear, no representation change, fixes the common "fold N writes" shape. Does not help incremental updates of a large existing map.
5. **Adaptive promotion.** Collections below a threshold (~512 entries) stay native and unchanged. `Map.set`/`Set.add` on a larger one returns an ordered persistent structure that *subclasses* `Map`/`Set`, so `instanceof`, iteration, `.size`, `eq`, `compare` and `show` keep working. Insertion order is kept by pairing the key trie with a persistent sequence indexed by insertion counter (tombstones plus compaction on delete). Host-created native maps simply take the existing copy path until a mochi write promotes them.

## Decision (proposed)

Options 4 then 5, staged, each stage gated on evidence:

0. **Find a real workload.** Locate a mochi program (compiler graph, examples, user-shaped fixtures) whose `Map.set`/`Set.add` fold exceeds ~1k entries. The compiler's own maps are small and stay native, so without one the trie is speculative and, under the perf trade-off rule, is deferred. Ship option 4 alone and stop. **Result: the survey found one fold (above), which option 4 removes; the trie stays deferred unless a workload that incremental-updates a large map turns up.**
1. **Bulk builders** (`Map.fromEntries`, `Map.setAll`), with `eq`-key semantics identical to repeated `Map.set`.
2. **Ordered persistent prototype** with a model-based fast-check property test against native `Map`: random set/delete/get/iterate, structural keys, insertion order, and *branching* histories (fork a version, write to both), because tombstone compaction amortizes badly when old versions are reused. Keyed by `_eqHash` (ADR 0158) with the unhashable ordered-scan fallback, otherwise object keys gain nothing: `_keyOf` is already an O(N) scan for them. Fuse the `has`+`get` pair so a promoted lookup walks the trie once. Go/no-go on read cost and the threshold, with hysteresis so a map near it does not flip between native and promoted.
3. `Map` writes, then `Set`; seed refreeze and a CodSpeed case for a large fold.

## Consequences

- Fold-built collections above the threshold go from O(N²) to O(N log₃₂ N); small collections are bit-for-bit unchanged, so no perf drop on the compiler's own (small) maps.
- Reads on promoted collections cost ~3–4× native; acceptable only if the threshold keeps typical maps native.
- A promoted value is a `Map` subclass: every method must be overridden (`forEach`, `entries`, `clear`, `Symbol.iterator`, …); inherited mutators (`set`, `delete`, `clear`) must throw or copy (decided in stage 2). `Map.prototype.get.call(promoted)` sees empty native slots, and each promoted object carries an unused native `Map`.
- Native-only host identity tricks (`Object.getPrototypeOf(m) === Map.prototype`) see a difference.

## Alternatives rejected

- **Baker rerooting (diff chains over one native map):** live version is fast and native, but undoing a delete re-inserts at the end, breaking insertion order, and reads of old versions mutate shared state.
- **Linear-ownership in-place mutation:** needs uniqueness analysis the language does not have.
