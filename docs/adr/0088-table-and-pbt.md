# 0088 — Table tests and property-based tests

- **Status:** Accepted
- **Date:** 2026-08-27
- **Source:** `packages/test/`
- **Deepens:** [ADR 0086](0086-bun-test-bindings.md)
- **Informed by:** ReScript mocha helpers; `fast-check` in the TypeScript specs

## Context

ADR 0086 shipped `test` / `describe` / `assertEq` and deferred table tests plus
property-based helpers. Closed enumerable cases still wanted one assertion over
many rows; algebraic laws still wanted a generator, not a handwritten list.
`bun:test`'s `test.each` spreads each row. Mochi tuples are JS arrays, so a
1-arg callback would see three arguments. `extern type` is not parametric, so a
host `Arbitrary a` cannot be declared that way.

## Decision

1. **`testEach : string -> [a] -> (a -> ()) -> ()`** — one bun:test per row,
   passing the row as a single argument. A string `label` field on a record row
   becomes the case name; otherwise `JSON.stringify`. An empty table fails
   rather than silently registering nothing.

2. **`check : string -> Arbitrary a -> (a -> ()) -> ()`** — a bun:test wrapping
   `fc.assert(fc.property(arb, fn))`. `assertEq` / `ok` throws fail the
   property. Combinators: `int` / `nat` / `float` / `bool` / `text` (not
   `string`), `constant` / `array` / `oneof` / `pair` / `triple` / `option` /
   `result`, plus `mapArb` / `filterArb` so they do not shadow prelude `map` /
   `filter`.

3. **Opaque `type Arbitrary a = | FcArb`** in `test.mochi`, unexported. Importers
   never write `Arbitrary` or `FcArb`; schemes still print `Arbitrary number`.

```mochi
testEach("sum", [(1, 2, 3), (0, 0, 0)], ((a, b, want)) =>
  a + b |> assertEq(want)
)

check("addition commutes", pair(int, int), ((a, b)) =>
  a + b == b + a |> ok
)
```

`fast-check` is a dependency of `@mochi/test`. Async Task tests: [ADR 0089](0089-task-tests.md).

## Consequences

- Tuple-row tables typecheck as `[ (a, b, c) ]` and destructure with
  `((a, b, want)) =>` (ADR 0083).
- Value `int` (the generator) and type `int` (the number alias, ADR 0085) live
  in different namespaces.

## Alternatives rejected

- **`test.each`.** Spreads array rows. Mochi tuples are arrays.
- **`extern type Arbitrary a`.** `parseExtern` hardcodes `params: []`.
- **Export `map` / `filter` / `string`.** Shadows prelude `map`/`filter`; `string`
  reads as the type in docs even though value/type namespaces are distinct.
- **Rank-n `arb` record of combinators.** Polymorphic fields need rank-2; keep
  top-level functions.
