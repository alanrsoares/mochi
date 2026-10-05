# 0154 — Record type spread

- **Status:** Accepted
- **Date:** 2026-10-05
- **Source:** [#164](https://github.com/alanrsoares/mochi/issues/164) (record type spreads)

## Context

A record alias could not build on another: `type B = { ...A, extra: string }`
forced copying every field of `A`, so the two drifted apart.

## Decision

A record alias body accepts `...T` entries beside `name: type` fields. `T` is a
record alias, applied (`P<T>`) or qualified (`M.A`). Its fields are spliced in at
that position; the later of two same-named entries wins, as in an object literal — a field
after a spread overrides it, and a spread after a field overrides that field.

- Parser: `AliasField` gains `spread: bool`; a spread entry has no name and holds
  the spread type in `fieldType`. The formatter prints it back as `...T`.
- Inference: `aliasFieldsFrom` and the alias-folding template splice the spread
  row ahead of the later fields, dropping overridden labels. Expansion stays at
  `typeExprToType`, so a spread resolves in the declaring module like any alias.
- TypeScript / `.d.ts`: `A & { extra: string }`. A spread label a later field
  overrides is dropped with `Omit<A, "name">`, so the intersection never demands
  the spread's own, differing, type.

A spread of something that is not a closed record (a variant, an unknown name)
contributes no fields rather than failing; there is no dedicated diagnostic yet.
