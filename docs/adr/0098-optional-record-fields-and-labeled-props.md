# 0098 — Optional record fields and labeled props

- **Status:** Proposed (draft)
- **Date:** 2026-08-29
- **Source:** [ADR 0096](0096-jsx-intrinsic-element-prop-types.md), [ADR 0097](0097-jsx-schema-single-source.md), [ADR 0055](0055-component-prop-contracts.md), `packages/plugin-styled-cva/src/index.ts`, ReasonReact / ReScript `JsxDOM.domProps`

## Context

A record type in mochi is a row: `empty | rvar | extend`. A field is present or
it is absent. There is no way to say "this field may be supplied, and has this
type when it is".

Two independent pieces of work have now hit that wall from different directions.

**Intrinsic JSX props (ADR 0096).** ReScript validates lowercase tags by
unifying their props against one declared record type, `JsxDOM.domProps`, whose
fields are optional. Unknown attribute becomes the ordinary "no such field"
error; wrong type becomes the ordinary unification error; no bespoke validator
exists. mochi could not take that route, so ADR 0096 built a schema plus a
hand-written validator inside the plugin, and ADR 0097 then had to add a
generator so the self-host would not need a second copy of the data. Both are
scaffolding around a missing type-system feature.

**Styled component prop contracts.** `@mochi/plugin-styled-cva` infers
`tw.button(base, { variants })` as `{ …variants | 'r } -> VNode`. The open row
tail is not a preference — it is the only option. Closing the row would force
every `<Btn>` call site to pass every attribute; leaving it open means
`<Btn disbaled />` is never checked. The plugin cannot give a styled component
the prop contract of the element it wraps, which is the main thing users expect
of it.

Both want the same thing: **a record type where a field may be absent.**

A related gap sits next to it. JSX attributes are already labeled — `<Btn tone="rose" />`
desugars to a record — but ordinary mochi functions have only positional
parameters. ReasonReact's ergonomics come from labeled arguments with defaults
(`~tone: string=?`), which is the same optionality applied to call syntax rather
than record syntax.

## Decision (proposed)

Two changes, sequenced. The first is the load-bearing one; the second is
ergonomics on top and could be deferred or dropped.

### 1. Optional fields in rows

Extend `Row` so a field carries an optionality flag:

```
{ kind: "extend"; label: string; type: Type; optional: boolean; rest: Row }
```

Unification rules to settle in the spike:

- A closed row missing an optional field unifies with a row declaring it.
- A supplied field unifies against the declared type as today.
- Optionality is part of the type, so `{ a?: number }` and `{ a: number }` are
  distinct; assigning the latter to the former is fine, the reverse is not.
- Row polymorphism composes with it: `{ a?: number | 'r }` stays meaningful.

Surface syntax `{ name?: string }`. Codegen erases it (the field is simply
absent at runtime); `.d.ts` emits `name?: string`, which is already how the TS
backend would want to print it. `showType` renders the `?`.

### 2. Labeled parameters with optional/default arguments

`let f = (~tone: string = "rose", ~size?: number) => …`, called as
`f(~tone="amber")`. Lowered to a single record parameter, so it is sugar over 1
rather than a second calling convention. Defaults evaluate at the call site.

## Consequences

- ADR 0096's schema can become a declared `domProps` record: validation returns
  to ordinary unification, the bespoke validator shrinks to nothing, and the
  self-host inherits it for free because it already unifies rows.
- ADR 0097's generator can retire — no data to project across the seam once the
  schema is a type.
- The unresolved parity gap in ADR 0097 (the mirror lacking unknown-attribute
  diagnostics, `nameSpan`, and a `closestName` port) disappears rather than
  needing to be closed by hand.
- styled-cva can seed a component's row from its tag's attributes and get real
  prop checking without forcing every attribute at every call site.
- Cost is real and lands in the most delicate part of the compiler: `unify`,
  generalization, `.d.ts` emission, the formatter, and both implementations.
  ADR 0078 makes it Mochi-first, so `bootstrap/` leads and the oracle follows.
- Every consumer of `Row` must handle the new field. That is a wide but
  mechanical change, and the exhaustiveness rules make the compiler enumerate
  the sites.

## Open questions

- Does optionality belong on the field, or is `Option<T>` in a normal field
  enough? The latter needs no type-system change but forces `Some`/`None` at
  every JSX attribute, which is not acceptable ergonomics for `<div id="x" />`.
- Do optional fields interact with the record-alias index (ADR 0092) and the
  emitted TS well enough to keep `bootstrap:tsc` at 0?
- Should labeled parameters land at all, or is the record-based prop pattern
  already sufficient? Section 2 is separable and unproven.

## Alternatives rejected

**Keep the plugin-side validator permanently (status quo).** Works, and is
shipped, but every schema-shaped problem re-pays the same cost: a table, a
validator, a generator, and a parity gap. The styled-cva case shows it does not
generalize — that plugin cannot express its contract at all.

**`Option<T>` fields with no syntax change.** Cheapest, and genuinely fine for
data modeling, but `<div id={Some("x")} />` is not a real option for JSX.

**Structural subtyping / width subtyping instead of optionality.** Would let a
record with fewer fields flow into one expecting more, but that is a much larger
change to inference than adding a per-field flag, and it weakens the errors that
make the existing prop contracts useful.
