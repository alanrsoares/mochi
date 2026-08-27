---
id: C4
title: Structural eq/show/compare — BUG on Map/Set/List, then ADR the extension exit path
status: done
type: bug + task
blocked-by: []
---

> **DECIDED 2026-07-26 (user-grilled): structural-only forever.** eq/show/compare are
> permanently deep-structural; the `-By` family is the customization point. No override
> registry, no instances — emitted JS stays dictionary-free. Accepted costs (document
> loudly): opaque types `show` internals; functions compare by reference. The ADR below
> records this as a guarantee, not a placeholder.

# C4 — eq/show/compare are silently wrong on every collection sigil

**Bug (found in sanity check; correctness, high):** the deep walk in `prelude.ts:156`
(`eq`), `:159` (`compare`), `:165` (`show`) recurses via `Object.keys`, which is `[]`
for `Map`, `Set`, and the generator-backed `List`. Verified at runtime:

- `eq(#{"x": 1}, #{"y": 99})` → **`true`**
- `eq(@{1, 2}, @{3})` → **`true`**
- `show(#{"x": 1})` → **`"[object Map]"`**

Universal equality returns `true` for any two Maps/Sets/Lists. `#{}`/`@{}` are headline
features; this is data-corruption-class, not a style concern.

**Then the deferred design problem:** even fixed, the deep walk has no user-extension
exit: functions inside data make `eq` lie, an opaque handle type `show`s its internals,
O(n) deep equality in a hot loop is invisible at the call site. The plugin seam
(`extensions.ts:176-180`) has no dispatch hook, and `eq : a -> a -> bool`
(`prelude.ts:71-73`) gives no typeclass-shaped place to hang an override.

- [x] **Bug fix:** `_eq`/`_compare`/`_show` runtime handles `Map`/`Set` structurally
      (decide `compare` ordering semantics — insertion-order vs sorted — in the same
      change) and either forces or rejects `List` (lazy: probably reject with a clear
      error naming `List.toArray`).
- [x] Cases in `test/examples.spec.ts` + a PBT invariant (`eq(x, x)` true,
      `eq(a, b)` false for structurally distinct Map/Set fixtures).
- [x] ADR: extension exit path — scoped instances / per-nominal override registry /
      permanent-structural-only — with the accepted failure modes named.
- [x] `docs/language.md` documents `eq`-on-functions and hot-loop cost.
- [x] Bootstrap impact: none expected (runtime string change; bootstrap emits the same
      prelude runtime) — verify via fixpoint.
- [x] `bun run check:full` green.
