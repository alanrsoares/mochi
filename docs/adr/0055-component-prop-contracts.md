# 0055 — Component prop contracts: named types as the JSX seam

- **Status:** proposed
- **Date:** 2026-07-28
- **Source:** owner request during apps/docs architecture review ("clear pattern for user defined types as component contract"); `apps/docs/src/host/widgets.host.mochi`; `apps/docs/src/components/PlaygroundView.mochi`
- **Deepens:** ADR 0011 (JSX attr checking when tag is `record -> VNode`), ADR 0044 (binding type annotations)

## Context

mochi components today take a bare `props` parameter and read fields
row-polymorphically. This compiles, but the contract is implicit on both sides
of the FFI seam:

1. **mochi components:** `PlaygroundView.mochi` reads ten distinct `props.*`
   fields; renaming a prop at the TSX call site fails only if inference happens
   to reach the mochi call site. There is no place to *state* the contract.
2. **Host externs:** `widgets.host.mochi` types every first-party TSX widget as
   `: a` — `Icon`'s `IconName` is a real closed union the HM side could hold,
   and doesn't. ADR 0011's attr checking only fires when the tag is
   `record -> VNode`; `: a` opts out entirely.
3. **Generated sidecars:** `gen-mochi-dts` emits
   `(props: {…} & Record<string, unknown>) => any` — open props bag, `any`
   return — so TSX consumers of mochi components get no children/ref checking.

The pieces already exist: ADR 0011 checks attrs against a `record -> VNode`
tag; ADR 0044 gives `let x : T = v`. What is missing is the *idiom* connecting
them and the two seam directions honoring it.

## Decision (proposed)

1. Bless the pattern: `type Props = { … }` +
   `let Comp : Props -> VNode = props => …` — the annotation pins the row, so
   prop renames break at the definition, not at some distant call site.
2. Host externs for first-party components declare real prop records
   (`extern Icon : IconProps -> VNode`), reserving `: a` for third-party
   generics whose types genuinely live outside HM.
3. `gen-mochi-dts` emits the closed prop record and a real `VNode` return type
   for annotated components, restoring checking in the TSX → mochi direction.

## Consequences

- The JSX plugin's ADR 0011 checking becomes reachable for the code that most
  needs it (first-party seams) instead of only intra-mochi calls.
- Requires `VNode` to be nameable in surface type expressions (today it is a
  plugin-internal notion).
- Open question: whether `Props` rows stay closed (exact record) or accept a
  row-variable escape hatch for spread-through props.
- Open question: `VNode` needs an empty inhabitant. JSX ternaries today cannot
  say "render nothing" — `cond ? <Icon … /> : null` fails to unify, forcing
  `<span />` placeholders (see `PlaygroundView.mochi`). An `Html.none` /
  null-accepting `VNode` should land with the nameable `VNode` type.

## Alternatives rejected

- **Keep `: a` externs + comments** — status quo; erases exactly the types the
  seam exists to carry.
- **Infer-only contracts (no annotation)** — leaves the contract implicit;
  renames keep failing at a distance.
