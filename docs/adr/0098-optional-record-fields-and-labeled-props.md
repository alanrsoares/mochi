# 0098 — Optional record fields and labeled props

- **Status:** Accepted
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

## Decision

Two changes, sequenced. Both are accepted: §1 is the type-system feature, §2 is
ergonomics built on top of it and adds no new HM machinery.

### 1. Optional fields in rows

Extend `Row` so a field carries an optionality flag:

```
{ kind: "extend"; label: string; type: Type; optional: boolean; rest: Row }
```

HM `unify` stays **invariant** (optionality must match when both sides have the
field). Optional-field *assignment* is directional subtyping via `fits`:

- A closed row may omit an optional expected field.
- A required actual field satisfies an optional expected field; the reverse does
  not.
- Extra actual fields vs a closed expected row still fail.
- `fits` is used at annotations, and at application only when the known arrow
  domain is a record that has at least one optional field. Other calls stay on
  invariant `unify` (recursive lets with record parameters would otherwise
  occur-check).

Surface syntax `{ name?: string }`. Construction still takes raw `T`. Field
access on an optional field is `Option<T>`. Codegen erases it (the field is
simply absent at runtime); `.d.ts` / `showType` / the formatter print `name?:`.

### 2. Labeled parameters with optional/default arguments

`let f = (~tone: string = "rose", ~size?: number) => …`, called as
`f(~tone="amber")`. This is **sugar over §1**, not a second calling convention,
and that is what keeps it sound: it introduces no new HM machinery.

- A **trailing** labeled group is one record parameter. Positionals keep their
  curried arrow (`(x: number, ~tone: string)` is `number -> { tone: string } -> number`).
  A positional after a label is a parse error, so the record is always last.
- A label is an **optional row field** when written `~x?` or given a default;
  omitting it at the call site is then the ordinary `fits` subset check.
- `f(~tone="amber")` desugars in the parser to `f({ tone: "amber" })`, tagged
  `origin: "labeled"` (sugar provenance, ADR 0011 §5) so the formatter re-folds
  the surface syntax. `~tone` alone is punning for `~tone=tone`.
- `f()` applies `{}` when the domain is an all-optional record — every label
  omitted — alongside the existing `unit ->` peel (ADR 0014).
- **Defaults are filled in the callee, not at the call site.** The body sees a
  plain `T` for a defaulted label and `Option<T>` for a bare `~x?`. Filling in
  the callee means the default lives in exactly one place, `f()` stays callable,
  and a plain record argument typechecks the same as the sugar — a call-site fill
  would make the parameter required from the outside and duplicate the default
  expression at every call.

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
- **A labeled binding needs a named option type to stay annotated.** A record
  type is only spellable in a `type` declaration, so
  `let f : bool -> { ok?: bool } -> T` does not parse; the row must be named
  (`type Opts = { ok?: bool }`). This is a pre-existing limit of `TypeExpr`
  rather than something labels introduce, and it points the same way as
  `no-inline-struct-type`, so we leave it. Dropping the annotation entirely
  also works, since the labeled group is inferred.
- **With a positional prefix, the whole labeled group cannot be omitted.**
  `f(x)` on `f = (x, ~dx = 0) => …` is an ordinary partial application of the
  curried `x -> { dx?: number } -> T`, so it yields a function, not a result.
  Only the nullary case `f()` can auto-apply `{}` (see above) — everywhere else
  currying and "all labels defaulted" are indistinguishable, and preserving
  partial application wins. Callers that must omit everything write `f(x, {})`.
  In practice this steers labels toward params that are usually supplied.

## Open questions

- Do optional fields interact with the record-alias index (ADR 0092) and the
  emitted TS well enough to keep `bootstrap:tsc` at 0?
- Labels are a lambda-parameter feature; `extern` signatures stay positional.

Optionality belongs on the field flag, not as `Option<T>` in a normal field:
the latter forces `Some`/`None` at every JSX attribute, which is not acceptable
ergonomics for `<div id="x" />`.

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
