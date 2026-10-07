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

## Options

1. **Status quo.** No work; quadratic folds stay.
2. **Replace the representation with an ordered HAMT.** Uniformly fast writes; breaks the native bridge (`instanceof`, `.d.ts`, host callers), slower reads everywhere, reseeds the compiler.
3. **Separate persistent type** (`PMap`/`PSet`, like `Dict`, ADR 0150). Opt-in and no bridge risk; duplicates the API and leaves existing `Map.set` folds quadratic.
4. **Adaptive promotion (recommended).** Collections below a threshold (~512 entries) stay native and unchanged. `Map.set`/`Set.add` on a larger one returns an ordered persistent structure that *subclasses* `Map`/`Set`, so `instanceof`, iteration, `.size`, `eq`, `compare` and `show` keep working. Insertion order is kept by pairing the key trie with a persistent sequence indexed by insertion counter (tombstones plus compaction on delete). Host-created native maps simply take the existing copy path until a mochi write promotes them.

## Decision (proposed)

Adopt option 4, staged:

1. Ordered persistent map prototype with a model-based fast-check property test against native `Map` (random set/delete/get/iterate, structural keys, order) and the same benchmark; go/no-go on read cost and the promotion threshold.
2. `Map` writes, then `Set`.
3. Seed refreeze and a CodSpeed case for a large fold.

## Consequences

- Fold-built collections above the threshold go from O(N²) to O(N log₃₂ N); small collections are bit-for-bit unchanged, so no perf drop on the compiler's own (small) maps.
- Reads on promoted collections cost ~3–4× native; acceptable only if the threshold keeps typical maps native.
- A promoted value is a `Map` subclass: host code that *mutates* it (`m.set`) must throw or copy; this must be decided and tested in slice 1.
- Native-only host identity tricks (`Object.getPrototypeOf(m) === Map.prototype`) see a difference.

## Alternatives rejected

- **Baker rerooting (diff chains over one native map):** live version is fast and native, but undoing a delete re-inserts at the end, breaking insertion order, and reads of old versions mutate shared state.
- **Linear-ownership in-place mutation:** needs uniqueness analysis the language does not have.
