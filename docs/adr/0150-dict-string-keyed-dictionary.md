# 0150 — `Dict<a>`: uniform string-keyed dictionary

- **Status:** Accepted
- **Date:** 2026-10-05
- **Source:** [#165](https://github.com/alanrsoares/mochi/issues/165) (subtask 3.1); [#163](https://github.com/alanrsoares/mochi/issues/163) host-interop guard

## Context

Mochi has `Map<K, V>` (reference-identity keys, native JS `Map`) and structural
row records (statically known fields). Neither models a dynamic string-keyed
object whose values share one type: JSON objects, HTTP headers, query params,
`process.env`, `dataset`. A `Json` AST (`JObj(Dict<Json>)`) needs this first.

## Decision

`Dict<a>` is a builtin type constructor with a `Dict.*` namespace, data-last:
`empty`, `has`, `get` (-> `Option`), `getOr`, `set`, `remove`, `size`, `keys`,
`values`, `entries`, `fromEntries`, `map`.

- **Runtime:** a null-prototype plain object (`Object.create(null)`),
  copy-on-write. `__proto__`, `constructor` and friends are ordinary keys; reads
  use `Object.hasOwn`. `Dict.empty` is one shared frozen object.
- **TypeScript:** `Dict<a>` prints as `Record<string, A>`, so host objects flow
  in and out without conversion (JS backend: same object).
- **Equality / ordering:** the existing structural `eq`/`compare` already walk
  plain objects, so `==` on Dicts is by key set and values.
- **No literal syntax** in this slice; build with `Dict.empty |> Dict.set(…)` or
  `Dict.fromEntries`. `Dict` joins the reserved collection names.

## Consequences

- Writes copy: `Dict.set` is O(N), like `Map.set`. This does **not** address the
  persistent-collection item of #163; that stays a separate, dedicated type so
  native `Map`/`Set` keep their direct JS bridge. A plain-object `Dict` cannot
  also be a HAMT.
- Keys are strings only; non-string keys remain `Map`.
- Insertion order follows JS own-key order (integer-like keys sort first).
- Unblocks the `Json` AST (#165 subtask 3.3).
