# 0084 — Structural `eq` / `show` / `compare` forever

- **Status:** Accepted
- **Date:** 2026-08-27
- **Source:** tracker C4 (design half); `packages/compiler/src/prelude/runtime.ts`
  (`eq`, `compare`, `show`); bug fix `8c47e39`
- **Amends:** none

## Context

`eq : a -> a -> bool`, `compare`, and `show` are polymorphic deep walks in the
runtime, not typeclass methods. Emitted JS stays dictionary-free. The plugin
seam has no equality hook, and the HM signatures have no place to hang an
override.

The walk used to use `Object.keys`, so any two Maps/Sets/Lists compared equal
and `show` of a Map was `"[object Map]"`. That bug is fixed. The remaining
question was the extension exit: instances, a per-nominal registry, or none.

## Decision

**Structural only, permanently.** Customization is the `-By` family
(`sortBy`, `dedupeBy`, `maxBy`, …): an explicit projection, dictionary-passing
by hand. No override registry. No instances.

Accepted costs, named:

- **Functions** compare by reference (`===`). `eq(x => x, x => x)` is `false`.
- **Opaque host values** `show` their enumerable fields (or `String(x)` when
  there are none). There is no "hide this type" hook.
- **Hot loops** pay O(n) structural work. The call site does not say so;
  pick a cheaper projection via `-By` when that matters.
- **List** is lazy: `eq` / `compare` throw (`force it first with List.toArray`);
  `show` prints `<List>` without pulling.
- **Map/Set keys** use the host table (`SameValueZero`). Record keys in a Set
  do not unify by deep `eq`.

## Consequences

- Emitted JS never grows a hidden dictionary argument.
- Docs must state the function / opaque / cost / List cases next to the
  "works at any type" pitch, or the pitch is a lie.

## Alternatives rejected

**Scoped instances / typeclass dictionaries.** New elaboration, new codegen
shape, and every call site that today is `eq(a, b)` would thread a dictionary.
Rejected to keep JS readable.

**A per-nominal override registry** on the plugin seam. Equality would depend
on which plugins were loaded — two programs with the same source could disagree.
The `-By` family already covers "compare by this field" without ambient state.
