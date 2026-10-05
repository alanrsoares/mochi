# 0156 — Custom variant discriminants (`@tag` / `@as`)

- **Status:** Accepted
- **Date:** 2026-10-06
- **Source:** issue #166; relaxes the fixed `_tag` shape (ADR 0012, `docs/compiler.md`)

## Decision

A variant type may override its runtime discriminant so mochi can construct and match TypeScript
discriminated unions directly:

```mochi
@tag("type")
export type Ev =
  | @as("click") Click(x: number, y: number)
  | @as("key") Key(k: string)
  | Idle
// { type: "click", x, y } | { type: "key", k } | { type: "Idle" }
```

- `@tag("key")` precedes the type (and its `export`); it sets the discriminant **key** for every
  constructor. Default `_tag`.
- `@as("lit")` precedes a constructor; it sets that constructor's discriminant **literal**. Default
  the constructor name. The two are independent.
- Both are plain `@name("string")` attributes. `as` is not a keyword; `@{…}` stays a lazy list
  (the statement parser only reads `@tag` followed by an identifier).
- `Ast.Ctor` carries the resolved `tagKey` / `tagLit` (defaults `_tag` / name). The parser stamps the
  type-level key on every constructor; the formatter prints an attribute only when it differs from the
  default.
- Codegen reads the discriminant through one lookup, `tagOf(ctorKeys, ctor)`. A custom ctor publishes
  `[key, literal]` under `@tag:<ctor>` in the existing ctor-key registry, so imports, patterns,
  `switch` lowering, nullary `==` tests, factories, the TS union and `.d.ts` all agree with no new
  plumbing. Default ctors add no entry, so unannotated output is byte-identical.
- `check` rejects: a key that is not a plain property name, a key equal to one of a constructor's
  field keys, two constructors with the same literal, and `@tag` before anything but a variant type.
- Builtin `Option` / `Result` / `List` keep `_tag`.

## Consequences

- The `@onrails` type guards (`isOk`/`isSome`) only recognise `_tag`, so a custom-tagged type is not
  covered by them; match it with mochi `switch` or the host union.
- Runtime `show` and `==` treat a custom-tagged value as a plain record (the discriminant is a normal
  field). Equality is unchanged in outcome; `show` prints the record form.
- `@as` alone changes only the literal and keeps the `_tag` key.
- `compare` and `==` also see a custom-tagged value as a plain record; `compare` orders by field values, not by constructor order.
- A named import carries the constructor's `@tag:` registry entry with its field keys (namespace imports merge the whole registry), so an importer lowers patterns and `==` with the same discriminant.
- Constructor metadata is keyed by bare name, as the field keys and the checker's registry already are (ADR 0082). A local constructor sharing a bare name with a namespace-imported one (`E.Click` vs `Click`) is already mis-checked today with no tags involved (`non-exhaustive switch: 'Other' is not matched`), so it never reaches codegen. Qualified keys across check, module and codegen would fix that collision for fields and discriminants together; it is a separate change.
