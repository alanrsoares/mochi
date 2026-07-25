# 0011 — Language plugins (`HostExtension` → `LanguagePlugin`; JSX as the first builtin plugin)

- **Status:** Accepted
- **Source:** conversation (owner decision); `src/extensions.ts`; `src/compile.ts`;
  `src/module.ts`; `src/dts.ts`; `src/vite-plugin.ts`; `src/lsp/server.ts`;
  `apps/docs/mochi.plugins.ts`; Wave 4 in `docs/dx-tracer-bullets.md`;
  [ADR 0007](0007-jsx-desugar.md); [ADR 0009](0009-styled-cva-host-interop.md);
  [ADR 0010](0010-host-type-interop.md)

## Context

Wave 4 (`docs/dx-tracer-bullets.md`, #18–#23) threaded `HostExtension[]` through
`toTypedProgramWith` and the module graph (#18), gave the LSP the same
extensions as Vite/dts (#19), collapsed the project's vendor plugins into one
list — `apps/docs/mochi.plugins.ts`, consumed by Vite, `gen-mochi-dts`, and the
docs LSP entry (#20) — and lifted `styled-cva` out of `src/` entirely into
`packages/plugin-styled-cva` (`@mochi/plugin-styled-cva`, #23).

That pass exposed a shape, not a plan: `HostExtension` (`src/extensions.ts`) is
`{ name, inferCall?, dtsBinding? }` — two optional hooks, both single-pass. The
interface is nearly as thin as its implementation. Meanwhile JSX — accepted as
"universal" and core in [ADR 0007](0007-jsx-desugar.md) and pinned there again
in [ADR 0010](0010-host-type-interop.md) §5 — grew real seams in **four** core
passes: `parser.ts` (`parseJsx`, tag/attr/children desugar to `h(tag, props,
children)`), `infer.ts` (`inferJsxCall`, prop-row checking against `record →
VNode`), `format.ts` (re-fold `h(...)` back to `<tag>` via a `JSX_ORIGIN`
WeakSet + `src[span.start] === "<"` sniffing), and `dts.ts` (component dts:
prop record → `(props: P) => any`). `infer.ts` additionally guesses JSX-ness by
`fn.name === "h"`, which false-positives on a user's own explicit `h(...)`
call — a real (if narrow) correctness gap, not just an aesthetic one.

Wave 4 deliberately parked this ("Out of wave (needs grill / ADR): deepen
`HostExtension` → cross-pass `LanguagePlugin`; move JSX behind a plugin
adapter; sugar provenance on AST"). This ADR is that grill's answer.

## Decision

1. **Deepen `HostExtension` into a cross-pass `LanguagePlugin`.** One
   registration seam — optional stage hooks for parse (prefix-token / atom),
   `inferCall`, `format`, `dtsBinding` — consumed by `compile`, the module
   graph, dts generation, the Vite plugin, and the LSP. Same seam Wave 4 already
   threads (`extensions?: HostExtension[]` on `CompileOptions` /
   `TypedProgramWithOptions`); this widens the hook set and the name, it does
   not add a second registration path.

2. **JSX becomes the first full-stack builtin plugin.** Parsing `<…>` into
   `h(tag, props, children)`, `inferJsxCall` prop-row checking, the formatter's
   `<tag>` re-fold, and `VNode` component dts all move out of the four core
   passes into a `jsxPlugin` that implements `LanguagePlugin`. Core keeps HM +
   rows + variants + `Expr.call`; after this lands, core must contain no
   `"h"` / `"VNode"` / JSX-literal knowledge — the same "deletion test" Wave 4
   already applies to `styled-cva` (#23).

3. **Default-on, hard opt-out.** `jsxPlugin` is registered by default on every
   standard compile path (CLI, `compile()`, module graph, Vite, LSP) — behavior
   and emitted JS are unchanged, and `bun run fixpoint` (stage2 ≡ TS reference,
   byte-for-byte) still holds. Passing an **empty plugin list** is the opt-out:
   `<…>` then fails to parse. This is the `.ts` vs `.tsx` equivalent for
   non-UI projects — one flag, not a file-extension split (see Alternatives).

4. **Rationale.** Code scalability — kit and sugar knowledge stops re-growing
   across four passes every time a new surface form ships — and dogfooding the
   plugin system with two real adapters instead of one: the builtin `jsxPlugin`
   and the vendor `@mochi/plugin-styled-cva`. Mochi stays UI-friendly by
   default while gaining a real, honest opt-out for non-UI compiles.

5. **Sugar provenance on the AST.** An optional `origin` field on call nodes
   (and other desugared forms as they arise), written once at parse time,
   replaces `format.ts`'s `JSX_ORIGIN` WeakSet + `src[span.start] === "<"`
   sniffing and `infer.ts`'s `fn.name === "h"` heuristic. Provenance is
   structural (set by the parser that produced the node), so it does not
   false-positive on a hand-written `h(...)` call the way the name heuristic
   does.

6. **Non-goals / deferred.**
   - Mirroring the seam in the self-hosted `bootstrap/*.mochi` copies of
     `parseJsx` / JSX infer — deferred. `fixpoint` compares emitted output, not
     internal structure, so the TS-side refactor is safe today; `bootstrap/`
     structurally diverges from `src/` until a follow-on slice ports it.
   - A `.mochi` / `.ui.mochi` file-extension split — rejected, see below.
   - Moving kit knowledge (`tw`, CVA, `re-reduced`) into core — stays vendor
     plugins, unchanged from [ADR 0010](0010-host-type-interop.md) §5's
     vendor-plugin half (only the JSX-in-core half of that decision is
     superseded — see the ADR 0010 amendment).

## Final shape (as shipped)

Wave 5 (#26–#28) closed the seam. This is the accepted final shape — read this
first; the interface sketch and the per-slice "As shipped" reconciliation notes
that follow are the decision history of how the sketch below was reached, kept
for context, not the thing to reconstruct the design from.

```ts
// src/extensions.ts — the complete, shipped LanguagePlugin.
export type LanguagePlugin = {
  name: string;
  parse?: ParseHook; //             (api) => Expr | null
  inferCall?: InferCallHook; //     (e, api) => Result<Type, Diagnostic> | null
  format?: FormatHook; //           (e, api) => Doc | null
  bindingType?: BindingTypeHook; // (value, api) => string | null
  dtsBinding?: DtsBindingHook; //   (name, sc, value, aliases, fallback) => string | null
};

/** Back-compat subset: today's `HostExtension` shape, unchanged. */
export type HostExtension = Pick<LanguagePlugin, "name" | "inferCall" | "dtsBinding">;
```

Five hooks, consulted in pipeline order, `null` always meaning "fall through to
the next hook, then to core":

- **`parse`** — consulted at atom position, *after* core's own prefix tokens, so
  a plugin can extend the grammar but never shadow it. A hook peeks and returns
  `null` — having consumed nothing — to fall through. With no plugin claiming a
  token, core's `unexpected token` error is what makes `plugins: []` a real
  parse-time opt-out, not a silent one.
- **`inferCall`** — handle a call expression during Algorithm W, or fall
  through to core's default call-inference.
- **`format`** — re-fold a desugared `Expr` back to this plugin's surface
  syntax. Returns a **`Doc`** (`src/doc.ts`), not a string: the formatter is a
  Wadler-style pretty-printer, and a raw string is an opaque atom that cannot
  break or indent inside the enclosing `group`.
- **`bindingType`** — override a binding's rendered TS type *inside*
  `bindingTsType`, the function the `.d.ts` writer and the TS backend
  (`codegen-ts.ts`) both call, so a plugin cannot type a binding one way in
  `.d.ts` and another in emitted `.ts`.
- **`dtsBinding`** — override a binding's `.d.ts`-only type string (wraps
  `bindingTsType`; lets a vendor plugin's literal-union override still win over
  a builtin's structural signature).

Registration and opt-out — `resolvePlugins(plugins, builtins = DEFAULT_PLUGINS)`,
the one function every entry point that turns a `plugins` option into hooks
calls (`infer.ts`'s `run`, `dts.ts`'s `emitDts`, and everything that threads
through them):

- `plugins` omitted (`undefined`) → `DEFAULT_PLUGINS` (today: `[jsxPlugin]`).
- `plugins: []` → the hard opt-out — no plugins at all, not even builtins.
  `<…>` then fails to *parse* (a plain `Diagnostic`, `kind: "parse"`) — the
  `.ts`/`.tsx` split expressed as configuration instead of a file extension.
- `plugins: [a, b, …]` → `[...builtins, a, b, …]`: builtins **prepended**, so a
  project that registers only a vendor plugin (styled-cva) never silently
  loses a builtin (JSX) it never asked to drop.

`HostExtension` stays a back-compat alias, so `@mochi/plugin-styled-cva` and any
project's `mochi.plugins.ts` type-check against `LanguagePlugin` unchanged.

### Interface sketch (illustrative — implementation slices may refine)

**Superseded by the final shape above** — kept verbatim as the ADR's opening
bid, for history.

```ts
// src/extensions.ts — intent sketch for the widened seam. Exact hook
// signatures (ParserApi, FormatApi, …) are decided by the implementation
// slices (Wave 5, #26–#28), not fixed here. See "As shipped (#27)" below —
// the `format` hook returns a Doc, not a string, and a fourth hook
// (`bindingType`) was needed that this sketch does not name.

/** A cross-pass adapter: builtin (jsx) or vendor (styled-cva, …). */
export type LanguagePlugin = {
  name: string;

  /** Parse hook — register a prefix/atom parser for a leading token
   *  (e.g. `<` for JSX). Returns an Expr, or `null` to fall through. */
  parse?: (api: ParserApi) => Expr | null;

  /** Existing infer-call hook, unchanged shape. */
  inferCall?: InferCallHook;

  /** Format hook — re-fold a call/expr back to sugar when this plugin's
   *  provenance marks it, or `null` to fall through to the default printer. */
  format?: (e: Expr, api: FormatApi) => string | null;

  /** Existing dts-binding hook, unchanged shape. */
  dtsBinding?: DtsBindingHook;
};

/**
 * Back-compat alias: today's shape is exactly the `inferCall` +
 * `dtsBinding` subset of `LanguagePlugin`. Existing vendor plugins
 * (`@mochi/plugin-styled-cva`) satisfy `LanguagePlugin` unchanged —
 * they just don't populate `parse` / `format`.
 */
export type HostExtension = Pick<LanguagePlugin, "name" | "inferCall" | "dtsBinding">;
```

### Slice-by-slice history (superseded by "Final shape" above)

The three reconciliation notes below (#26, #27, #28) are the accepted record
of how the interface sketch became the final shape — read them for *why* a
decision landed the way it did; read "Final shape (as shipped)" above for
*what* shipped.

### As shipped (#26 reconciliation)

`#26` lands the type + the registry, not every hook the sketch names.
`LanguagePlugin` today is exactly `{ name; inferCall?; dtsBinding? }` — the
same two hooks `HostExtension` already had — because `parse` and `format`
have no consumer until `#27`/`#28` wire `jsxPlugin`; declaring them earlier
would be dead public API (`AGENTS.md`, biome plugins, `#22`'s precedent).
`HostExtension` is `Pick<LanguagePlugin, "name" | "inferCall" | "dtsBinding">`
— today an identity alias, and a real subset once `#27`/`#28` add fields.

The option is named **`plugins`** on every surface (`InferOptions`,
`EmitDtsOptions`, `CompileOptions`, `TypedProgramWithOptions`,
`ModuleGraphOptions`, `MochiPluginOptions`, LSP `ServerOptions` /
`ModuleHoverOptions` / `ModuleDiagnosticsOptions` / `ModuleNavOptions`) — no
`extensions` name survives (the repo is pre-1.0; `#22` already set the
no-deprecated-alias precedent).

One helper, `resolvePlugins(plugins, builtins = DEFAULT_PLUGINS)`, is the
single source of truth for decision 3's opt-in/opt-out semantics, called by
the two places that actually turn plugins into hooks (`infer.ts`'s `run`,
`dts.ts`'s `emitDts`):

- `plugins` omitted (`undefined`) → `builtins` (the default/builtin list).
- `plugins: []` → `[]` — the hard opt-out, not even builtins.
- `plugins: [a, b, …]` → `[...builtins, a, b, …]` — builtins **prepended**,
  so a project that registers only a vendor plugin (styled-cva) doesn't
  silently lose a builtin (JSX) it never asked to drop.

`DEFAULT_PLUGINS` is `[]` until `#27` lands `jsxPlugin` — the mechanism ships
ahead of the first builtin so `#29`'s empty-list opt-out test has something
to prove against as soon as `jsxPlugin` exists.

### As shipped (#27 reconciliation)

`#27` lands `jsxPlugin` as the sole entry of `DEFAULT_PLUGINS`, and with it the
two hooks it needed. The shipped `LanguagePlugin` is:

```ts
export type LanguagePlugin = {
  name: string;
  inferCall?: InferCallHook; // (e, api) => Result<Type, Diagnostic> | null
  format?: FormatHook; //     (e, api) => Doc | null
  bindingType?: BindingTypeHook; // (value, api) => string | null
  dtsBinding?: DtsBindingHook; // (name, sc, value, aliases, fallback) => string | null
};
```

Two deliberate departures from the sketch above:

1. **`format` returns a `Doc`, not a `string`.** The formatter is a
   Wadler-style pretty-printer (ADR 0025): a raw string would be an opaque
   atom that cannot break, indent, or participate in the enclosing `group`, so
   JSX would stop wrapping at 80 columns the moment it moved behind the hook.
   The document IR and its combinators therefore moved out of `format.ts` into
   **`src/doc.ts`** — a hook `import`s `txt`/`cat`/`indent`/`softline`/… from
   there, and `FormatApi` carries only what needs formatter context: `exprD`
   (recursive, comment-aware, hook-re-entrant), `memberD`, `flat`, `strLit`.
   Hooks run ahead of the core printer at the single `exprRaw` seam and see the
   AST only — `format` still lexes and parses, never typechecks.

2. **A fourth hook, `bindingType`.** The sketch assumed component dts could
   ride on `dtsBinding`, but `bindingTsType` is shared: `dts.ts`'s `declOf`
   *and* the TS backend (`codegen-ts.ts`, ADR 0026) both call it. A hook that
   only `emitDts` ran would have made the emitted `.ts` and the emitted `.d.ts`
   disagree about every component. `bindingType` is consulted *inside*
   `bindingTsType`, whose `hooks` parameter is **required** (not defaulted to
   `[]`) so the compiler — not reviewer vigilance — forces both callers to pass
   a resolved list; `TsEmitContext.bindingTypeHooks` carries it through
   `emitTsModule` for the graph path (`build --emit=ts`). `dtsBinding` keeps
   its `.d.ts`-only meaning (styled-cva's `$tone` unions) and still wraps
   `bindingTsType`, so vendor overrides continue to win over builtin ones.

`parse` remains undeclared: `parser.ts` still dispatches `<…>` itself, so the
field would be dead API until `#28`.

### As shipped (#28 reconciliation)

`#28` lands the last hook, `parse`, and with it decision 3's teeth: `<…>` is no
longer core syntax at all. The complete `LanguagePlugin` is:

```ts
export type LanguagePlugin = {
  name: string;
  parse?: ParseHook; //           (api) => Expr | null
  inferCall?: InferCallHook; //   (e, api) => Result<Type, Diagnostic> | null
  format?: FormatHook; //         (e, api) => Doc | null
  bindingType?: BindingTypeHook; // (value, api) => string | null
  dtsBinding?: DtsBindingHook; // (name, sc, value, aliases, fallback) => string | null
};
```

Three decisions the sketch left open:

1. **A single `parse` hook consulted at atom position, not token-keyed
   registration.** `parseAtom` runs core's own prefix tokens first, then calls
   every `parse` hook in order; a hook peeks and returns `null` — having consumed
   nothing — to fall through. This matches the `null`-means-fall-through
   convention all four other hooks already use, keeps registration a plain
   optional field (no second `{ token, parse }` shape to declare and validate),
   and lets a hook use unbounded lookahead rather than one leading token. Because
   hooks run *after* core's atoms, a plugin can extend the grammar but never
   shadow it; because they run *before* the `unexpected token` fallback, `<…>`
   with `plugins: []` is a normal parse `Diagnostic` (`unexpected token lt`) —
   not a crash and not silence.

2. **`ParseAbort` is not exported.** `AGENTS.md` allows exactly one throw, and it
   stays parser-owned: `ParserApi.fail(message, span?)` raises the marker
   *inside* `parser.ts`, so the public `parse` boundary is still the only place
   that converts it to `Result<_, Diagnostic>`. `span` defaults to the token
   under the cursor, which is what the core `fail` did — every JSX parse error
   message and span is byte-identical to before the move.

3. **`ParserApi` exposes the cursor, not the parser.** `peek(offset?)` (clamped
   to the terminal `eof`, so lookahead is total) · `next` · `expect` (generic, so
   a hook gets a narrowed token instead of casting) · `expectId` · `expectLabel`
   (`$tone`, ADR 0009) · `parseExpr` (for `{expr}` attribute values and children)
   · `spanFrom` (close a span at the last consumed token) · `fail`. Hooks share
   the parser's live cursor, so a hook that consumes tokens advances the position
   core resumes from. The lexer is untouched: `<`, `>`, `/`, strings and
   identifiers stay plain tokens, and the grammar that gives them JSX meaning
   lives entirely in `plugins/jsx.ts`.

`parse` now takes the same `plugins` option as every other pass
(`ParseOptions`), threaded by `compile` / `toTypedProgram` (hence `emitDts` and
`codegenTs`), `format`, the module graph's `loadGraph` (hence `buildModules`,
`buildModulesTs`, `moduleContext`), `moduleDiagnostics`, `moduleHoverAt`, and
`moduleTypeDefinitionAt`. Single-file, plugin-free entry points (`hoverAt`,
`definitionAt` and the other lexical nav helpers, `diagnostics`) keep resolving
to the builtins, exactly as their infer calls already did — they expose no
`plugins` option to thread.

## Consequences

- Two real adapters (`jsxPlugin` builtin, `@mochi/plugin-styled-cva` vendor)
  prove the seam is general, not JSX-shaped-with-extra-steps.
- Core `infer.ts` (and `parser.ts`, `format.ts`, `dts.ts`) pass the same
  deletion test #23 already applies to `styled-cva`: grep for `"h"` /
  `"VNode"` / JSX literals in core returns nothing.
- An empty plugin list is a legitimate, supported "non-UI mode" — the
  `.ts`/`.tsx` split, expressed as configuration instead of a file extension.
- `bootstrap/` temporarily diverges from `src/` in *structure* (where JSX
  lives) but not in *emitted output* — `fixpoint` stays the safety net until a
  follow-on slice ports the self-hosted copy.
- Vendor plugin packages (`packages/plugin-*`) gain more hooks to opt into
  (`parse`, `format`) without a breaking rename — `HostExtension` keeps typing
  as a subset of `LanguagePlugin`.
- `HostExtension` stays as a name in the public surface (back-compat alias),
  so `packages/plugin-styled-cva` and any project's `mochi.plugins.ts` needs no
  changes to keep compiling.
- **Known, accepted limitation:** the lexical nav helpers (`definitionAt`,
  `highlightsAt`, `referencesAt`, `renameAt`, `documentSymbolsAt`,
  `workspaceSymbolsAt`, and their `module*` twins — all but
  `moduleTypeDefinitionAt`) take no `plugins` option, so they always parse
  with builtins regardless of a project's `plugins: []` opt-out. This is a
  deliberate call, not an oversight (#29): these helpers are built to degrade
  gracefully when typecheck fails (that's their whole reason to exist
  alongside `toTypedProgram`-based surfaces), and the same posture serves an
  opt-out project well — a `.mochi` file with JSX in it still gets F12 /
  highlight / rename / outline instead of losing nav entirely because the
  project compiles non-UI. Threading `plugins` through these surfaces is a
  follow-up only if a project needs nav to *also* honor a plugin-specific
  opt-out, which no project has needed yet.

## Alternatives rejected

- **Keep JSX in core (status quo).** This is what [ADR 0010](0010-host-type-interop.md)
  §5 decided ("Universal JSX … stays in language core") and what this ADR
  supersedes. The owner overrode it here because Wave 4 proved the plugin seam
  works end-to-end for a real kit (`styled-cva`) and because JSX's own
  core footprint (four passes, two heuristic-based provenance hacks) is the
  same kind of cross-pass leakage the plugin seam exists to contain — leaving
  JSX in core after building the seam for everything else would make the
  language's own most complex piece of sugar the one thing the seam doesn't
  dogfood. Scalability (no more per-passes JSX seams as new sugar arrives) and
  dogfooding both point the same direction.
- **A `.mochi` / `.ui.mochi` file-extension split** instead of a plugin list.
  Rejected — a second extension is a tooling tax that cuts across the module
  graph (`moduleExt` resolution), the Vite plugin, `gen-mochi-dts`, the LSP,
  the TextMate grammar, and every test fixture path, for the same
  default-on/opt-out behavior a plugin-list default already gives for free.
- **A JSX-only compiler pragma/flag** (e.g. `--jsx=off`) instead of routing
  JSX through the general plugin mechanism. Rejected — it would special-case
  the exact thing the plugin seam is meant to generalize, and would not
  dogfood the seam for JSX itself, leaving JSX as a permanent one-off inside
  the compiler rather than an adapter alongside vendor plugins.
