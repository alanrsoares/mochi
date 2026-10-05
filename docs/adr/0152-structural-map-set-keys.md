# 0152 — Structural keys for `Map` and `Set`

- **Status:** Accepted
- **Date:** 2026-10-05
- **Source:** [#165](https://github.com/alanrsoares/mochi/issues/165) (subtask 3.2)

## Context

`Map` and `Set` are native JS collections, so composite keys (records, tuples,
arrays, variants) compare by reference (`SameValueZero`). `Map.get((1, 2), m)`
misses a key inserted from a different `(1, 2)`, although `==` says they are equal.

## Decision

Keep the native `Map`/`Set` representation and the `Map.*`/`Set.*` surface. Every
keyed operation resolves its key through `_keyOf(collection, k)`:

- primitives (and `null`) take the native path, so behaviour and speed are unchanged;
- an object key resolves to the stored key it `eq`s (linear scan), else to itself.

`Set.add`/`fromArray`/`union` therefore never store two `eq` elements, and
`Map.set` overwrites in place, keeping the original key.

No type, parser or codegen change; the fix is runtime-only.

## Consequences

- Composite-key lookups are O(n); primitive-key lookups stay O(1). A hashed or
  persistent structure (#163) is the route to sub-linear composite keys.
- `#{}` literals and maps built by JS code are not normalised on construction;
  later `Map.*`/`Set.*` calls still match against stored keys by `eq`.
- Mutating a stored key after insertion is unsupported (as with any hashed key).
