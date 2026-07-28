# 0051 — Rank-2 builder DSLs: type the call sites, never the builder

- **Status:** accepted
- **Date:** 2026-07-28
- **Source:** `packages/compiler/src/extensions/plugin-kit.ts`, `packages/plugin-re-reduced/src/index.ts`
- **Deepens:** ADR 0011 (language plugins), ADR 0050 (plugin claims)

## Context

A common shape in JS/TS host libraries is the **builder-callback config**: the
library hands you a polymorphic builder and you call it once per entry.

```ts
defineContainer("game", {
  state: { count: 0, name: "" },
  actions: (on) => ({
    bump: on((s) => ({ count: s.count + 1 })),
    setName: on((s, n: string) => ({ name: n })),
  }),
  effects: (fx) => [
    fx.onChange((s) => s.count.value, (value, prev, ctx) => [/* … */]),
    fx.onAction("setName", (n, ctx) => [/* … */]),
  ],
});
```

In TypeScript this works because `on` is a **rank-2** parameter: its own type is
`<P = void>(reduce: (s: S, p: P) => Partial<S>) => ActionSpec<S, P>`, so each
application instantiates `P` on its own — `bump` gets `void`, `setName` gets
`string`.

Hindley–Milner has no rank-2 types. A lambda parameter is monomorphic, so
inferring `on => { … }` as one expression gives `on` **one** type shared by
every application inside the body. Concretely, in mochi:

- two actions cannot carry different payloads — the second `on(…)` unifies its
  reducer against the first one's, so `bump` and `setName` collapse and you get
  `cannot unify unit with string`;
- two `fx.onChange`s cannot watch different types, for the same reason;
- a plugin that *does* nothing sees the whole config as an opaque function and
  the store degrades to open rows: no `store.actions.` completion, no payload
  checking, `unknown` in the emitted `.d.mochi.ts`.

Adding rank-2 types to the language was never on the table: it costs
higher-rank inference (annotation-driven, no longer Algorithm W) to buy one
call-shape that only appears at *host* boundaries, which is exactly what the
`LanguagePlugin` seam exists to absorb.

## Decision

**Never infer the builder lambda. Decompose it and infer each application
independently.** `plugin-kit` grows one primitive, `builderBody`, that
recognizes a builder lambda and returns its call sites:

```ts
export const builderBody: (e: Expr) => BuilderBody | null;

type BuilderBody = {
  readonly binder: string;
  readonly shape: "record" | "seq" | "single";
  readonly sites: readonly LabelledSite[];
};
type BuilderSite = { method: string | null; args: readonly Expr[]; call: CallExpr };
```

It matches `b => …` (exactly one named parameter) whose body is a record literal
of `b(…)` / `b.m(…)` applications (`shape: "record"`), an array of them
(`"seq"`), or a single one (`"single"`). Anything else returns `null`.

The binder is never given a type and never unified. Each site's arguments are
closed expressions — they do not mention `b` — so a plugin infers each one
directly and gets exactly the per-site instantiation the host's generic
signature promised. Rank-2 polymorphism is *emulated by not needing it*.

Three properties make this safe to build on:

1. **`null` means "fall back".** `builderBody` is a recognizer, not a
   requirement. A config held in a binding, spread in, or written in a shape the
   walk does not know falls through to ordinary structural inference — the
   plugin degrades to the pre-ADR behavior rather than erroring.
2. **The plugin owns the domain knowledge, the kit owns the shape.** `plugin-kit`
   says nothing about actions, reducers, or reactions; it hands over labelled
   sites. `plugin-re-reduced` decides that `on`'s single argument is a reducer
   and that `fx.onChange`'s two arguments are a selector and a handler.
3. **Dependency order is the plugin's to choose.** Walking sites means the
   plugin also chooses what to type first. `plugin-re-reduced` infers `state`,
   derives the signal row from it, then types every reducer against that state,
   then feeds the resulting payload map to `effects` so `fx.onAction("setName",
   h)` can look `setName`'s payload up **by literal name** — strictly more
   precise than the host library, which types that payload `unknown`.

### The partial-patch rule

Decomposition alone leaves payloads free: `on((s, n) => ({ name: n }))` says
nothing about `n` until the patch meets the state. The patch is a *partial*
state, which no single row type expresses (mochi rows are exact or open, not
optional), so the plugin unifies **label by label**: every label the patch
mentions is unified with that field of `state`; labels the state lacks are left
to the host's own `Partial<S>` check. That is the step that turns `setName` into
`S -> string -> { name: string }` and makes `store.actions.setName(1)` an error
at the call site.

## Consequences

- One reusable primitive, not a re-reduced special case. Any vendor plugin over
  a builder-callback config (a router's `r => [r.get(…), r.post(…)]`, a schema
  DSL, a test-table builder) gets per-site typing for the cost of a `switch` on
  `site.method`.
- The compiler learns nothing about rank-2 types; `infer/` is untouched. The
  emulation lives entirely in `extensions/` + the vendor package, which is the
  ADR 0011 boundary working as intended.
- The recognizer is syntactic, so it is only as good as the written shape. A
  user who hoists a reducer into a `let` still gets it typed (the site's
  argument is just a `ref`), but a user who builds the actions record
  programmatically falls back to open rows. That is the intended trade: precise
  when the DSL is written as documented, never wrong otherwise.
- `builderBody` returns the `call` node alongside the args, so a future hook can
  attach hover/`noteType` information per site without a second walk.

## Alternatives considered

- **Rank-2 / higher-rank inference in the language.** Rejected: annotation-driven
  inference is a different type system, and the only demand comes from host
  boundaries the plugin seam already owns.
- **Ask users to annotate the builder.** Requires a way to *write* a rank-2 type
  in mochi — the same feature, plus surface syntax and per-consumer boilerplate.
- **Give up and type the config opaquely.** What we had: no payload checking, no
  completion, `unknown` in `.d.mochi.ts` — the whole reason the vendor plugin
  exists.
