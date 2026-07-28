# 0055 — Component prop contracts: named types as the JSX seam

- **Status:** accepted
- **Date:** 2026-07-28
- **Source:** owner request during the apps/docs architecture review ("clear pattern for user defined types as component contract"); `apps/docs/src/host/widgets.host.mochi`; `apps/docs/src/components/PlaygroundView.mochi`
- **Deepens:** ADR 0011 (JSX attr checking when the tag is `record -> VNode`), ADR 0044 (binding type annotations)

## Context

mochi components took a bare `props` parameter and read fields
row-polymorphically. That compiles, but the contract is implicit on both sides
of the FFI seam:

1. **mochi components:** `PlaygroundView.mochi` reads eleven distinct `props.*`
   fields; renaming a prop at the TSX call site fails only if inference happens
   to reach the mochi call site. There was no place to *state* the contract.
2. **Host externs:** `widgets.host.mochi` typed every first-party TSX widget
   `: a` — ADR 0011's attr checking only fires when the tag is
   `record -> VNode`; `: a` opts out entirely.
3. **Generated sidecars:** component declarations emitted
   `(props: Record<string, unknown>) => any` — an open props bag — so TSX
   consumers of mochi components got no prop checking.

## Decision

1. **Bless the idiom:** `type Props = { … }` +
   `let Comp : Props -> VNode = props => …`. The annotation pins a *closed* row
   (alias expansion is exact), so prop reads in the body and attrs at every JSX
   call site are both checked. **This already worked** — `VNode` is nameable
   because any uppercase bare type name lowers to a `tCon`
   (`schemes.ts`), and ADR 0044 unifies the annotation before generalization.
2. **Type host externs with record aliases:** `type IconProps = { … }` +
   `extern Icon : IconProps -> VNode = …` makes ADR 0011 attr checking fire at
   the first-party seam. `: a` stays as the *explicit* opt-out for widgets whose
   props need optional fields (inexpressible in HM rows today) — record the
   reason in a comment.
3. **Fix the emit side** (where the real bugs were):
   - The jsx plugin's `bindingType` hook received the *folded* type
     (`tCon("Props") -> tCon("VNode")`), failed its `from.kind === "record"`
     gate, and **degraded** annotated components to
     `(props: Record<string, unknown>) => any` — also a `strictFunctionTypes`
     error in the TS backend, since the lambda param is typed `Props`. It now
     names the alias: `(props: Props) => any`, with the `export type Props`
     decl co-emitted.
   - A component is any arrow whose *final return* is `VNode` (the
     record-param gate is gone), and a bare `VNode` binding renders `any`, so
     the plugin's type name never dangles in TS output.
   - `unit` in arrow-*return* position renders `void` (not `undefined`):
     a declared `onRun: () => undefined` prop would reject the host's ordinary
     `() => void` callbacks. Standalone unit values keep `undefined` (ADR 0054).
   - `gen-mochi-dts` pins `VNode` to `import("preact").VNode` in any sidecar
     that names it — the docs trees render with Preact, and *host tooling* may
     name the host even though the compiler must not (ADR 0011 deletion test).
4. **Render-nothing arm:** `<></>` is the empty inhabitant. It already typed as
   `VNode` but emitted `h("Fragment", …)` with `Fragment` never imported. The
   emit stays (core remains Fragment-free); the *host* `h` maps the tag — the
   vite-plugin's default pragma header and the playground preview both wrap
   Preact's `h` to resolve `"Fragment"` to `Fragment`. No `Html.none` module.

## Consequences

- ADR 0011's attr checking is reachable where it is most needed (first-party
  seams), not only intra-mochi calls. `apps/docs` adopts the idiom:
  `PlaygroundView` is the exemplar, `Icon` the typed extern.
- Guards: `dts.spec.ts` (alias-named component decl, no dangling `VNode`,
  return-position `void`), `extensions.spec.ts` (annotated component agrees in
  BOTH backends), `jsx.spec.ts` (alias-extern attr checking, `: a` opt-out,
  `<></>` ternary), `examples.spec.ts` (docs exemplar sidecar).
- Open rows still emit the synthesized `children?: any; className?: string`;
  closed aliases emit exactly their fields — spread-through props keep using an
  unannotated component (row variable), which remains legal.

## Follow-ups (out of scope)

- **Plugin-declared type names:** a `LanguagePlugin` field registering `VNode`
  (and a value like a fragment) with check/infer, making it first-class instead
  of an accidental `tCon` — would also let `check` diagnose unknown type names
  (today `let x : Tpyo = …` silently generalizes; so does a lowercase
  `boolean`, which is a type *variable* — the prim is `bool`).
- **Literal-union type exprs** (`type IconName = "play" | "pause"`) — HM has
  `tLit`/`tUnion` but only plugins mint them; `IconName` stays `string`
  (docs/language.md Wave 7).
- **Optional record fields** — until then, widgets with optional props keep
  `: a` externs.

## Alternatives rejected

- **Keep `: a` externs + comments** — the status quo; erases exactly the types
  the seam exists to carry.
- **Infer-only contracts (no annotation)** — leaves the contract implicit;
  renames keep failing at a distance.
- **`Html.none` host extern** — worked (a one-line module exporting `null`),
  but per-app and a second idiom; `<></>` is jsx-owned and fixes the broken
  fragment sugar at the same time.
- **`VNode` in core `PRIM_TS` / prelude** — violates ADR 0011's deletion test
  (core greps clean of `"VNode"`).
