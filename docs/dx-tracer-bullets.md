# Editor DX — tracer bullets

Parent track for rustc/gleam-like editor DX. Decisions: [ADR 0003](./adr/0003-rich-diagnostics.md), glossary in `CONTEXT.md` (Diagnostics & editor DX).

Each slice is a vertical tracer bullet: compiler + tests + LSP surface where applicable.

| # | Title | Type | Blocked by | Issue | Status |
|---|---|---|---|---|---|
| 0 | Rename `AlangError` → `Diagnostic` (+ `PublishDiagnostic`); optional rich fields stubbed | AFK | — | [#2](https://github.com/alanrsoares/mochi/issues/2) | done ([#11](https://github.com/alanrsoares/mochi/pull/11)) |
| 1 | Lexical symbol index (same-file values/types/ctors) + unit tests | AFK | 0 | [#3](https://github.com/alanrsoares/mochi/issues/3) | done ([#11](https://github.com/alanrsoares/mochi/pull/11)) |
| 2 | Document highlight + go-to-definition (same-file, all name spaces) via LSP | AFK | 1 | [#4](https://github.com/alanrsoares/mochi/issues/4) | done ([#11](https://github.com/alanrsoares/mochi/pull/11)) |
| 3 | Find refs + rename (same-file) | AFK | 2 | [#5](https://github.com/alanrsoares/mochi/issues/5) | done ([#11](https://github.com/alanrsoares/mochi/pull/11)) |
| 4 | CLI/LSP render labels + help | AFK | 0 | [#6](https://github.com/alanrsoares/mochi/issues/6) | done ([#11](https://github.com/alanrsoares/mochi/pull/11)) |
| 5 | First rich checker error (e.g. unbound + did-you-mean `Suggestion`) + code actions | AFK | 1, 4 | [#7](https://github.com/alanrsoares/mochi/issues/7) | done ([#11](https://github.com/alanrsoares/mochi/pull/11)) |
| 6 | Cross-module `Location` — export origins; F12 + “defined here” across imports | AFK | 2, 5 | [#8](https://github.com/alanrsoares/mochi/issues/8) | done ([#12](https://github.com/alanrsoares/mochi/pull/12)) |
| 7 | Cross-module refs + rename | AFK | 3, 6 | [#9](https://github.com/alanrsoares/mochi/issues/9) | done ([#12](https://github.com/alanrsoares/mochi/pull/12)) |
| 8 | Document / workspace symbols | AFK | 6 | [#10](https://github.com/alanrsoares/mochi/issues/10) | done ([#12](https://github.com/alanrsoares/mochi/pull/12)) |

Parent epic: [#1](https://github.com/alanrsoares/mochi/issues/1) (wave 1 + wave 2 shipped).

## Wave 2 (was deferred)

| # | Title | Type | Blocked by | Status |
|---|---|---|---|---|
| 9 | Prelude virtual defs — F12 / “defined here” for builtins (virtual `Location`) | AFK | — | done |
| 10 | Record-field nav (same-file) — `p.x` ↔ type-alias / literal / pattern field sites | AFK | — | done |
| 11 | Go-to-type at expression (uses infer table; degrades when typecheck fails) | AFK | — | done |
| 12 | Multi-error collection (honest recovery; ADR 0004) | HITL→AFK | design | done |

## Wave 3 (host-interop DX — from ADR 0009 / 0010)

Surfaced dogfooding `*.host.mochi` seams in the docs app: opaque host externs
give no hints and there is no completion. Split into Gap A (host factories /
`defineContainer`) and Gap B (styled components / JSX props) —
see [ADR 0010](./adr/0010-host-type-interop.md) and the
[ADR 0009](./adr/0009-styled-cva-host-interop.md) amendment.

| # | Title | Type | Blocked by | Status |
|---|---|---|---|---|
| 13 | LSP completion provider — value/field/import members (enables `tw.*`) | HITL→AFK | design | done |
| 14 | JSX-attr checking against component prop types (enables `$tone`/prop hints) | HITL | design | done |
| 15 | Overloaded / variadic extern signatures so `tw.div` types honestly at both arities | HITL | design | done (host ext) |
| 16 | Typed host factory externs (`defineContainer`) + container dts (Gap A) | HITL→AFK | design | done |
| 17 | Component dts emit: prop record → `(props: P) => any` (+ CVA variant unions) | HITL→AFK | 14, 15 | done |

## Wave 4 (plugin plumbing — unquestionable)

Architecture pass on extensibility seams. **No** JSX-out-of-core, **no** full
`LanguagePlugin` design yet — those need a grill / ADR reopen. These slices fix
known leakage under *today’s* `HostExtension` (inferCall + dtsBinding only).

**Vendor plugins** (not language core): typed interop for host libraries —
`styled-cva`, `re-reduced`, future kits — ship as *adapters* the project
registers. `packages/plugin-styled-cva` (`@mochi/plugin-styled-cva`) is the
first one: a workspace package that only depends on the compiler’s plugin
interface. Core keeps HM + (for now) universal JSX; it does not grow
kit-specific AST walks.

| # | Title | Type | Blocked by | Status |
|---|---|---|---|---|
| 18 | Thread `extensions` through `toTypedProgramWith` + module graph | AFK | — | done |
| 19 | LSP hover/diagnostics use same `extensions` as Vite/dts | AFK | 18 | done |
| 20 | One project vendor-plugin list (vite + gen-dts + LSP) | AFK | 18, 19 | done |
| 21 | ADR hygiene: 0007 status + 0009 amendment vs JSX-attr reality | AFK | — | done |
| 22 | Dead-API cleanup: unused `jsxPragmaName`, unused `collect*` helpers | AFK | — | done |
| 23 | Move `styled-cva` out of `src/ext/` into a vendor plugin package | AFK | 20 | done |

Out of wave (needs grill / ADR): deepen `HostExtension` → cross-pass
`LanguagePlugin`; move JSX behind a plugin adapter; sugar provenance on AST;
CONTEXT.md core vs **vendor plugin** glossary.

## Wave 5 (JSX as the first builtin plugin — ADR 0011)

The grill Wave 4 parked. [ADR 0011](./adr/0011-language-plugins.md) widens
`HostExtension` into a cross-pass `LanguagePlugin` (optional parse / inferCall
/ format / dtsBinding hooks, one registration seam) and moves JSX's four core
seams (`parseJsx`, `inferJsxCall`, formatter re-fold, `VNode` dts) out of
`parser.ts` / `infer.ts` / `format.ts` / `dts.ts` into a builtin `jsxPlugin`,
default-registered everywhere so behavior and `fixpoint` are unchanged. An
empty plugin list becomes the non-UI opt-out. `HostExtension` stays a
back-compat alias so `@mochi/plugin-styled-cva` and `apps/docs/mochi.plugins.ts`
need no changes.

| # | Title | Type | Blocked by | Status |
|---|---|---|---|---|
| 24 | ADR 0011 LanguagePlugin + JSX-as-plugin; Wave 5 opened | AFK | — | done |
| 25 | Sugar provenance on AST (`call.origin`) replaces WeakSet / `name === "h"` | AFK | 24 | done |
| 26 | `LanguagePlugin` interface + registry (widen `HostExtension`, thread everywhere) | AFK | 24 | done |
| 27 | Builtin `jsxPlugin`: infer + format + dts JSX move out of core (default-registered) | AFK | 25, 26 | done |
| 28 | Parse hook: `parseJsx` moves behind the plugin seam (`ParserApi`) | AFK | 26, 27 | done |
| 29 | Empty-plugin-list JSX opt-out test; `fixpoint` / `build:ext` verify; docs reconcile | AFK | 27, 28 | done |

**Wave 5 shipped:** JSX is now the first builtin `LanguagePlugin` — parse,
`inferCall`, `format` (as a `Doc`), and `bindingType` all live in
`src/plugins/jsx.ts`, and core (`parser.ts` / `infer.ts` / `format.ts` /
`dts.ts`) is grep-clean of JSX. Two real adapters (builtin `jsxPlugin`, vendor
`@mochi/plugin-styled-cva`) prove the seam is general. `plugins: []` is the
supported non-UI opt-out, proven end-to-end through `compile`,
`moduleDiagnostics`, and (for the vendor-prepend case) an explicit
plugin-only list — not just spot-checked at one hook.

Out of wave (deliberate, tracked, not this wave's job):

- `bootstrap/parser.mochi` / `bootstrap/infer.mochi` still parse and infer JSX
  inline — the self-hosted mirror of ADR 0011's move was explicitly deferred
  (ADR 0011 §6). `fixpoint` compares emitted output, not internal structure,
  so this is safe today; a future slice ports `plugins/jsx.mochi` into
  `bootstrap/` to close the structural gap.
- The lexical nav helpers (`definitionAt`, `highlightsAt`, `referencesAt`,
  `renameAt`, `documentSymbolsAt`, `workspaceSymbolsAt`, and their `module*`
  twins other than `moduleTypeDefinitionAt`) take no `plugins` option and
  always resolve to builtins — accepted as good DX (nav still works on a
  JSX file in an opt-out project) rather than a gap to close (ADR 0011
  Consequences).

## Wave 6 (machine-driven host DX — Gap A via vendor plugin)

Principle: humans declare intent once (`extern` + project `plugins` list);
the machine fills types and sidecars. Hand files that only exist to appease
the typechecker are debt. Docs interop section is **worked examples**, not a
blessed kit catalog.

**First win:** kill `apps/docs/src/state/counter.ts` cast bridge via
`@mochi/plugin-re-reduced` — same pattern as Gap B / styled-cva. Opaque
`extern defineContainer : a` stays; plugin recovers `ContainerDef<…>` in
`.d.mochi.ts` so TSX imports `.mochi` cast-free.

Deferred (later Wave 6 / out of wave): auto-generating `*.host.mochi`; hooks
inside `.mochi` (Rules of Hooks); LSP `tw.*` completion (#13).

| # | Title | Type | Blocked by | Status |
|---|---|---|---|---|
| 30 | Docs copy: interop section = examples only (+ vite pragma sniff fix) | AFK | — | done |
| 31 | ADR / brief: Gap A via vendor plugin, not hand TS bridge | AFK | — | done |
| 32 | `@mochi/plugin-re-reduced` — infer/dts for `defineContainer` call sites | AFK | 31 | done |
| 33 | Docs app: delete `counter.ts`; Counter.tsx imports `.mochi`; register plugin | AFK | 32 | done |
| 34 | Gate: `apps/docs check` + no cast bridge under `apps/docs/src/state/` | AFK | 33 | done |

**Wave 6 (first win) shipped:** docs interop reframed as examples; Gap A
honesty is `@mochi/plugin-re-reduced` → `.d.mochi.ts` `ContainerDef`;
`apps/docs/src/state/counter.ts` cast bridge deleted; `Counter.tsx` imports
`.mochi` directly.

## Wave 7 (host interop end state — ADR 0012)

Principle (ReScript-informed): **typed `extern` first**; core owns
**literal + union** formers; sugar plugins only *derive* what signatures
cannot say (CVA variant keys → unions); heavy host generics stay in
**outbound** `.d.mochi.ts` (`import("pkg").Type<…>`). Wave 6 AST walkers
are bridges — shrink, don’t clone.

| # | Title | Type | Blocked by | Status |
|---|---|---|---|---|
| 35 | ADR 0012 + index + 0010 amendment + CONTEXT vocabulary | AFK | — | done |
| 36 | Core string literal types + finite unions (`tLit` / `tUnion`) | AFK | 35 | done |
| 37 | styled-cva infer: `$tone` → literal union (JSX attr check) | AFK | 36 | done |
| 38 | re-reduced: mark bridge; plan shrink toward structural HM + thin dts | AFK | 35 | done |
| 39 | language.md / compiler.md: interop preference order + ReScript pointers | AFK | 35 | done |

## Slice briefs

### 0 — Rename to `Diagnostic`

## What to build

Rename the compiler error union to `Diagnostic`. Rename the LSP DTO in `diagnostics.ts` to `PublishDiagnostic`. Stub optional `labels` / `help` / `suggestions` (and `Location`) so later slices can fill them without another type migration. Update docs (`AGENTS.md`, `docs/compiler.md`, `docs/tooling.md`).

## Acceptance criteria

- [x] No `AlangError` type name in `src/` or docs (historical mentions in ADR 0003 only)
- [x] `Result<_, Diagnostic>` railway unchanged in behaviour
- [x] `bun run check` green

## Blocked by

None — can start immediately

---

### 1 — Lexical symbol index

## What to build

A same-file lexical def/use index over a `Program` (values, types, ctors). Binding identity is the def span. No typechecking required. Unit tests cover shadowing.

## Acceptance criteria

- [x] Index API queryable by offset → binding (+ defs/uses)
- [x] Shadowed names resolve to the correct binding
- [x] Types and constructors are distinct namespaces from values
- [x] `bun run check` green

## Blocked by

Slice 0

---

### 2 — Highlight + go-to-definition (same-file)

## What to build

`documentHighlight` + `definition` LSP providers backed by the symbol index. Works when typecheck fails. Prelude / builtins → no location.

## Acceptance criteria

- [x] F12 on a value/type/ctor use jumps to its def in the same file
- [x] Document highlight marks def + uses for the binding under the cursor
- [x] Unit tests for the compiler nav API; LSP is a thin adapter
- [x] `bun run check` green

## Blocked by

Slice 1

---

### 3 — Find refs + rename (same-file)

## What to build

`references` + `rename` for same-file bindings. Skip `$` / `_` synthetics. Reuse edit plumbing intended for suggestions/code actions.

## Acceptance criteria

- [x] Shift+F12 lists def + all uses for that binding (shadowing-correct)
- [x] F2 renames the binding and all its uses in the file
- [x] Synthetics and prelude are not renameable
- [x] `bun run check` green

## Blocked by

Slice 2

---

### 4 — Render labels + help

## What to build

`formatError` and LSP `PublishDiagnostic` mapping render `labels` and `help` when present (`relatedInformation` in the editor). No new checker messages required — fixtures/tests can construct rich `Diagnostic` values.

## Acceptance criteria

- [x] CLI output shows labels/help in a rustc/gleam-like layout
- [x] LSP publishes related spans for labels
- [x] Tests assert on structured fields and rendered form
- [x] `bun run check` green

## Blocked by

Slice 0

---

### 5 — First rich checker error + code actions

## What to build

One real checker path emits labels and/or a did-you-mean `Suggestion` (e.g. unbound variable). Advertise `codeActionProvider` and apply suggestions as edits.

## Acceptance criteria

- [x] At least one production error path attaches label and/or suggestion via the symbol index
- [x] Quick fix applies the suggestion edit
- [x] Help (if any) is prose-only; Suggestion is machine-applicable
- [x] `bun run check` green

## Blocked by

Slices 1, 4

---

### 6 — Cross-module Location

## What to build

Thread export origins (`path` + `nameSpan`) through module context into the symbol index. F12 and “defined here” labels cross files.

## Acceptance criteria

- [x] F12 on an imported use or import name opens the exporting module at the def
- [x] A diagnostic label can point at another file’s `Location`
- [x] `bun run check` green

## Blocked by

Slices 2, 5

---

### 7 — Cross-module refs + rename

## What to build

Find-refs and rename across the import graph for one binding.

## Acceptance criteria

- [x] Refs include other modules that import/use the binding
- [x] Rename updates all graph sites (or clearly refuses unsafe cases)
- [x] `bun run check` green

## Blocked by

Slices 3, 6

---

### 8 — Document / workspace symbols

## What to build

Document outline and workspace symbol search over lets/types/ctors.

## Acceptance criteria

- [x] Document symbols list top-level declarations
- [x] Workspace symbol query finds declarations across the open graph
- [x] `bun run check` green

## Blocked by

Slice 6

---

### 9 — Prelude virtual defs

## What to build

Give builtins (`map`, `Some`, `Option`, …) a navigable `Location` (virtual URI or generated prelude buffer) so F12 / “defined here” work. Not renameable.

## Acceptance criteria

- [x] F12 on a prelude value/type/ctor opens a readable def site
- [x] Rename still refuses prelude names
- [x] `bun run check` green

## Blocked by

None

---

### 10 — Record-field nav (same-file)

## What to build

Index record field names (type-alias fields, literals, patterns, `e.field` uses). F12 / highlight / refs within the file. Row polymorphism: resolve to same-name field defs in scope / file heuristics without requiring typecheck for the first cut.

## Acceptance criteria

- [x] F12 on `p.x` jumps to a same-file field def (alias / literal / pattern)
- [x] Highlight marks field def + uses for that field name binding
- [x] `bun run check` green

## Blocked by

None

---

### 11 — Go-to-type

## What to build

From an expression / value binding, jump to the nominal type’s def (variant / alias) using the infer table when available; no location when typecheck failed or type is structural/prelude-only.

## Acceptance criteria

- [x] LSP `typeDefinition` (or equivalent) on a typed expression opens the type decl
- [x] Degrades cleanly when inference failed
- [x] `bun run check` green

## Blocked by

None (uses infer; independent of lexical index)

---

### 12 — Multi-error collection

## What to build

HITL: design recovery so stages can return several `Diagnostic`s without cascading junk. ADR / CONTEXT update before code.

## Acceptance criteria

- [x] Accepted ADR for multi-error + recovery rules
- [x] (Follow-on AFK) railway + CLI/LSP publish many diags

## Blocked by

Design (HITL) — resolved in ADR 0004

---

### 18 — Thread `extensions` through module graph

## What to build

`toTypedProgramWith` (and whatever `module.ts` uses for per-file typecheck) accepts
`HostExtension[]` the same way `compile` / `inferProgram` already do. Module-graph
typechecking sees `tw.*` factory schemes when extensions are passed.

## Acceptance criteria

- [x] `toTypedProgramWith(..., { extensions })` reaches `inferProgram`
- [x] Module-graph path can type a `tw.div(...)` binding as `Record → VNode` with `styledCvaExtension`
- [x] Existing callers without extensions unchanged
- [x] `bun run check` green

## Blocked by

None

---

### 19 — LSP uses project extensions

## What to build

Hover / diagnostics (and later completion) run inference with the same extension
list Vite and `gen-mochi-dts` use for the docs app. Editor stops lying about
`BadgeShell: unknown` while Vite types it honestly.

## Acceptance criteria

- [x] LSP server (or module-hover path) accepts / loads `extensions`
- [x] Hover on a `tw.*` factory in docs sources shows a component scheme, not `'t0`
- [x] No per-request hardcode of styled-cva inside LSP — list comes from #20 or opts
- [x] `bun run check` green

## Blocked by

18

---

### 20 — One project vendor-plugin list

## What to build

Single place that lists **vendor plugins** for a project (docs today:
`styledCvaExtension`; later re-reduced, …). Vite plugin, `gen-mochi-dts`, and
LSP all consume it — no hand-duplicated arrays. Naming in code/docs: *vendor
plugin* (library-owned adapter), not “core extension”.

## Acceptance criteria

- [x] One module or config export owns the docs (or generic project) plugin list
- [x] `vite.config.ts`, `scripts/gen-mochi-dts.ts`, and LSP path import that list
- [x] Adding a vendor kit is one edit
- [x] `bun run check` green

## Blocked by

18, 19

## Notes

`apps/docs/mochi.plugins.ts` exports `docsVendorPlugins: HostExtension[]`
(today `[styledCvaExtension]`, imported from `@mochi/plugin-styled-cva`
since #23).
`apps/docs/vite.config.ts` and `scripts/gen-mochi-dts.ts` both import it
instead of hand-listing `styledCvaExtension`. LSP gets it via a new thin
entry `src/lsp/docs-server.ts` (`startServer({ extensions: docsVendorPlugins })`);
`scripts/build-extension.mjs` now bundles that entry instead of
`src/lsp/server.ts` directly, so the shipped VS Code extension dogfoods the
same list. `startServer` itself stays plugin-agnostic — no styled-cva
hardcode. Confirmed by #23: moving the plugin to a package changed only the
`import { styledCvaExtension } from …` line inside `apps/docs/mochi.plugins.ts`
— `vite.config.ts`, `gen-mochi-dts.ts`, and `docs-server.ts` were untouched.

---

### 21 — ADR hygiene (0007 / 0009)

## What to build

Align ADRs with shipped code: ADR 0007 is landed (status + note that infer/format/dts
*did* grow `h`/`VNode` special cases). ADR 0009 amendment claim “Mochi does not check
JSX attrs” is stale — point at #14 / `inferJsxCall`. Do **not** reopen JSX-in-core here.

## Acceptance criteria

- [x] ADR 0007 status reflects shipped desugar; “zero infer changes” corrected or struck
- [x] ADR 0009 amendment updated for JSX-attr checking
- [x] Cross-links to 0010 boundary (JSX core vs **vendor plugins**) stay consistent
- [x] Note in 0010 / 0009: styled-cva (and later re-reduced) are vendor plugins, not core
- [x] No new LanguagePlugin ADR in this slice

## Blocked by

None

## Notes

0007 → **Accepted**; decision §3 no longer claims zero infer/format/dts changes —
lists `inferJsxCall`, formatter re-fold, `VNode` dts. 0009 amendment: JSX-attr
check shipped (#14); Gap B partly closed via `@mochi/plugin-styled-cva` vendor
plugin + core prop-row check; completion (#13) still open. 0010 boundary wording
aligned (vendor plugins, cross-links to plugin README + `mochi.plugins.ts`).
`docs/adr/README.md` index updated. No LanguagePlugin ADR added.

---

### 22 — Dead extension / JSX API cleanup

## What to build

~~Delete or wire dead surfaces left by the partial plugin / JSX story:
`MochiPluginOptions.jsxPragmaName` (declared, unused); unused
`collectInferCallHooks` / `collectDtsBindingHooks` if still dead (either use from
infer/dts or remove and keep the inline `flatMap`).~~

## Acceptance criteria

- [x] No unused public options / helpers in the extension/vite surface
- [x] Grep-clean for the removed names
- [x] `bun run check` green

## Blocked by

None

## Notes

Deleted `MochiPluginOptions.jsxPragmaName` (+ JSDoc) from `src/vite-plugin.ts`;
only `jsxPragmaHeader` remains. `collectInferCallHooks` / `collectDtsBindingHooks`
already gone (#23); grep-clean except this slice's historical mention.

---

### 23 — styled-cva as a vendor plugin package

## What to build

Lift `src/ext/styled-cva.ts` out of the compiler tree into a vendor (or
`@mochi/plugin-styled-cva`) package that depends only on the public
`HostExtension` / plugin interface. Docs app depends on that package.
`src/compile.ts` stops re-exporting `styledCvaExtension`. Distinct from the
rejected ADR 0009 alternative `@styled-cva/mochi` *runtime* shim — this is a
**compiler** plugin, not a JS interop layer.

## Acceptance criteria

- [x] No `styled-cva` / `tw`-specific logic under `src/` (except generic hooks)
- [x] Docs vite + gen-dts + tests import the vendor plugin package
- [x] Package README: register via project plugin list (#20)
- [x] `bun run check` green

## Blocked by

20

## Notes

Landed as `packages/plugin-styled-cva` (`@mochi/plugin-styled-cva`), a private
workspace package (`"packages/*"` added to the root `workspaces`; declared as a
dependency of the root and of `apps/docs`, so bun links it into `node_modules`
and every consumer — bun test, `tsc`, Vite, the `build:ext` esbuild bundle —
resolves it by name). It imports the compiler’s plugin surface (`extensions.ts`,
`ast.ts`, `errors.ts`, `types.ts`) directly; no new re-export layer. The dead
`collect{InferCall,DtsBinding}Hooks` helpers did not move — `extensions.ts`
already owns the generic `run*Hooks` runners, so #22 has one less name to chase.
`src/compile.ts` no longer re-exports `styledCvaExtension`; `src/ext/` is gone.

---

### 24 — ADR 0011 + Wave 5 opened

## What to build

Write [ADR 0011](./adr/0011-language-plugins.md) recording the owner's decision
to deepen `HostExtension` into a cross-pass `LanguagePlugin` and move JSX
behind a builtin `jsxPlugin`. Amend ADR 0010 (§5 + the LanguagePlugin
non-goal, superseded); cross-link ADR 0007 (desugar stays, seams relocate).
Open this Wave 5 table + briefs. Docs only — no code in this slice.

## Acceptance criteria

- [x] ADR 0011 exists, house style, records decisions 1–6 + interface sketch
- [x] ADR 0010 amended (dated, non-destructive); ADR 0007 cross-linked; index row added
- [x] Wave 5 table + briefs 24–29 recorded in this file
- [x] `bun run check` green

## Blocked by

None — can start immediately

---

### 25 — Sugar provenance on AST

## What to build

Add an optional `origin` field to call nodes (e.g. `{ kind: "jsx", tag }` or
similar), written once by the parser that produces the desugared node.
`format.ts` reads `origin` instead of the `JSX_ORIGIN` WeakSet /
`src[span.start] === "<"` sniffing; `infer.ts` reads `origin` instead of
`fn.name === "h"` (fixing the false-positive on a hand-written `h(...)` call).

## Acceptance criteria

- [x] `Expr.call` (and any other desugared node touched) carries optional `origin`
- [x] `format.ts` no longer references a `JSX_ORIGIN` WeakSet or span-sniffing
- [x] `infer.ts` no longer branches on `fn.name === "h"`
- [x] A hand-written `h(...)` call no longer misidentifies as JSX-sourced
- [x] `bun run check` green

## Blocked by

24

## Notes

`Expr.call` gained `origin?: "jsx"` (`src/ast.ts`), set once by `makeJsxCall`
(`src/parser.ts`) — the single site that synthesizes JSX calls; every other
`kind: "call"` construction site compiles unchanged since the field is
optional. `format.ts` lost the `JSX_ORIGIN` WeakSet and the
`src[e.span.start] === "<"` sniff in `collectAnchors` (which also dropped its
now-unused `src` param); `jsxShape` / `jsxChildD` read `e.origin === "jsx"`
instead. `infer.ts`'s `isJsxPragmaCall` is now `e.origin === "jsx" &&
e.args.length >= 2` (no `fn.name` test). `dts.ts`'s `isJsxComponentLambda`
checks `body.origin === "jsx"` instead of `body.fn.name === "h"`. Fixed the
false-positive: `let h = (a, b) => add(a, b)` then `h(1, 2)` now infers
`number` against the user's own binding instead of hitting `inferJsxCall`
(new test, `test/infer.spec.ts`). No existing test asserted the old wrong
behavior, so none needed correcting — `test/format.spec.ts`'s "does not
rewrite an explicit h call as JSX" already passed both before and after
(the old span-sniff also happened to get this one right; only `infer`/`dts`
had the real bug). Codegen untouched — `origin` is metadata `codegen.ts`
never reads; emitted JS for JSX sources is byte-for-byte identical. Next
(#26): widen `HostExtension` → `LanguagePlugin`; `origin: "jsx"` is exactly
the provenance `jsxPlugin`'s `format`/`inferCall` hooks will key off in #27.

---

### 26 — `LanguagePlugin` interface + registry

## What to build

Widen `src/extensions.ts`: introduce `LanguagePlugin` (optional `parse` /
`inferCall` / `format` / `dtsBinding` hooks) per the ADR 0011 interface
sketch, refining hook signatures as needed. Keep `HostExtension` as a
back-compat alias/subset type. Thread the widened type through `compile.ts`,
`module.ts`, `dts.ts`, `vite-plugin.ts`, and `src/lsp/server.ts` — same
registration seam Wave 4 already threads, wider hook set.

## Acceptance criteria

- [x] `LanguagePlugin` type exists with optional parse/inferCall/format/dtsBinding hooks
- [x] `HostExtension` still type-checks as a subset of `LanguagePlugin` (no breaking rename)
- [x] `compile`, module graph, dts, Vite plugin, and LSP all accept `LanguagePlugin[]`
- [x] `@mochi/plugin-styled-cva` and `apps/docs/mochi.plugins.ts` compile unchanged
- [x] `bun run check` green

## Blocked by

24

## Notes

`LanguagePlugin` ships as `{ name; inferCall?; dtsBinding? }` — the same two
hooks `HostExtension` already had. `parse`/`format` stay out of this slice
(no consumer until #27/#28 wire `jsxPlugin`; declaring them now would be dead
public API per `AGENTS.md`/biome's plugin precedent, #22). `HostExtension`
becomes `Pick<LanguagePlugin, "name" | "inferCall" | "dtsBinding">` — an
identity alias today, a real subset once #27/#28 add fields; both
`packages/plugin-styled-cva` and `apps/docs/mochi.plugins.ts` compile
unchanged. `src/extensions.ts` keeps its filename (ADR 0011 and `CONTEXT.md`
already link it by path; renaming would only add doc churn for no behavior
change).

The option renamed `extensions` → `plugins` on every surface named in the
brief (`InferOptions`, `EmitDtsOptions`, `CompileOptions`,
`TypedProgramWithOptions`, `ModuleGraphOptions`/`BuildTsOptions`,
`MochiPluginOptions`, `ServerOptions`, `ModuleHoverOptions`,
`ModuleDiagnosticsOptions`, `ModuleNavOptions`) plus every call site
(`apps/docs/vite.config.ts`, `apps/docs/mochi.plugins.ts` consumers,
`scripts/gen-mochi-dts.ts`, `src/lsp/docs-server.ts`, tests). No deprecated
`extensions` alias kept — grep for the option name returns nothing (repo is
pre-1.0, #22 precedent).

One helper owns ADR 0011 decision 3, `resolvePlugins(plugins, builtins =
DEFAULT_PLUGINS)` in `src/extensions.ts`: `undefined` → `builtins`; `[]` →
`[]` (hard opt-out); `[a, b, …]` → `[...builtins, a, b, …]` (**builtins
prepended**, not replaced — a project adding `styled-cva` doesn't silently
lose a builtin it never opted out of). `DEFAULT_PLUGINS` is `[]` until #27
lands `jsxPlugin`. `infer.ts`'s `run` and `dts.ts`'s `emitDts` — the only two
places that turn a plugin list into hooks — both call it; every other
surface just threads `plugins` through to one of those two. `test/extensions.spec.ts`
proves the three resolution cases against an explicit fake `builtins` list
(`resolvePlugins(undefined, [b])` vs `resolvePlugins([], [b])` vs
`resolvePlugins([a, b], [builtin])`), so the proof doesn't wait on #27.

`bun run check`: green.

For #27: `jsxPlugin` adds `parse`/`format` to `LanguagePlugin` and becomes
the first entry in `DEFAULT_PLUGINS`; `resolvePlugins`'s prepend semantics
mean registering it there is enough for every existing `plugins: [vendor]`
call site to keep seeing JSX without an edit.

---

### 27 — Builtin `jsxPlugin`

## What to build

Move `inferJsxCall`, the formatter's `<tag>` re-fold, and `VNode` component
dts out of `infer.ts` / `format.ts` / `dts.ts` into a `jsxPlugin` implementing
`LanguagePlugin` (using `origin` provenance from #25). Register `jsxPlugin` by
default on every standard compile path (CLI, `compile()`, module graph, Vite,
LSP) so behavior and emitted JS are unchanged.

## Acceptance criteria

- [x] `infer.ts` contains no `"h"` / `"VNode"` JSX-specific branches (deletion test)
- [x] `format.ts` contains no JSX-specific re-fold logic outside the plugin
- [x] `dts.ts` contains no JSX component-dts special case outside the plugin
- [x] `jsxPlugin` is registered by default on CLI, `compile()`, module graph, Vite, LSP
- [x] Existing JSX example/tests pass unchanged (same emitted JS)
- [x] `bun run check` green
- [x] `bun run fixpoint` green (stage2 ≡ TS, byte-for-byte)

## Blocked by

25, 26

## Notes

`src/plugins/jsx.ts` (new) owns every post-parse JSX seam: `inferCall`
(component prop-row unification, heterogeneous children, intrinsic tags →
`tCon("VNode")`), `format` (the `<tag …>` / `<>…</>` re-fold), and
`bindingType` (component `(props: P) => any`). `DEFAULT_PLUGINS =
[jsxPlugin]`, so `resolvePlugins`'s prepend semantics (#26) mean every
existing `plugins: [vendor]` call site keeps JSX with no edit, and `plugins:
[]` is the hard opt-out. `infer.ts` / `format.ts` / `dts.ts` are grep-clean of
`"h"` / `VNode` / `Fragment` / `jsx` (`escFragment` → `escStrBody` so the
deletion grep is honest).

Two hazards, both solved rather than papered over:

**The formatter is a `Doc` pretty-printer, so ADR 0011's `format?: … =>
string | null` sketch is wrong for this codebase** — a string can't break or
indent inside the enclosing group. The document IR + combinators + layout
engine moved to **`src/doc.ts`**, the hook returns `Doc`, and `FormatApi`
carries only formatter-context pieces (`exprD`, `memberD`, `flat`, `strLit`);
combinators are imported from `doc.ts` instead of being handed through the
api. Hooks dispatch at one seam (`exprRaw`) from a module-level resolved-hook
list set by `format(src, opts)`, matching how the comment tables are already
module-level — the printers reference each other by name (`e.args.map(exprD)`),
so a threaded context would touch every function. `format` still runs lex +
parse only; the hook never sees a type.

**`bindingTsType` is shared with the TS backend** (`codegen-ts.ts:171`), so a
hook only `emitDts` ran would have silently dropped component typing from the
emitted `.ts`. The new `bindingType` hook is consulted *inside*
`bindingTsType`, whose `hooks` parameter is **required** — the type checker,
not reviewer vigilance, forces both callers to pass a resolved list.
`TsEmitContext.bindingTypeHooks` (also required) carries it through
`emitTsModule`; `module.ts` resolves it from the same `opts.plugins` its
per-module `toTypedProgramWith` calls use. `dtsBinding` keeps its `.d.ts`-only
meaning and still wraps `bindingTsType`, so styled-cva's `$tone` override
still wins over the builtin component signature.

Hook ordering: builtins are prepended, so `jsxPlugin.inferCall` now runs
before `styledCvaExtension`'s. They key off disjoint shapes (`origin === "jsx"`
vs a `tw.<tag>(…)` field call) so neither shadows the other —
`test/ext-styled-cva.spec.ts`'s "JSX core: invalid component prop fails when
tag is a component" still passes, as does the whole styled-cva suite.

Verified: `bun run check` green; `bun run fixpoint` PASS (stage2 ≡ stage3 ≡ TS
reference, byte-for-byte); `bun run bootstrap:tsc` still **0** errors; `bun run
fmt:check` green (JSX formatting unchanged and idempotent); `bun run
gen:mochi-dts:check` green — the JSX-heavy `apps/docs` tree re-emits
byte-identical `.d.ts` through the vendor plugin list; `bun run build:ext` ok.
New guards in `test/extensions.spec.ts` pair each moved hook's default
behavior with its `plugins: []` opt-out, including the `.d.ts`-and-TS-backend
agreement on component bindings.

For #28: the `parse` hook is still undeclared on `LanguagePlugin` — `parser.ts`
owns `<…>` dispatch, so the field would be dead API. `origin: "jsx"` is written
by `makeJsxCall` and read by all three hooks here, so a `parse` hook must keep
writing it. `test/extensions.spec.ts`'s opt-out cases currently assert "parses
but nothing checks/re-folds it"; once #28 lands, `plugins: []` should make
`<…>` fail to *parse*, and those expectations tighten (that is #29's test).

---

### 28 — Parse hook for JSX

## What to build

Move `parseJsx` behind the plugin seam via a `parse` hook (`ParserApi`
exposing whatever the parser needs — token stream position, sub-expression
parsing, span helpers). Core `parser.ts` calls into registered plugins for
prefix/atom parsing of unrecognized leading tokens (e.g. `<`) instead of
hard-coding JSX dispatch.

## Acceptance criteria

- [x] `parser.ts` has no hard-coded `<tag>` dispatch — routes through the plugin `parse` hook
- [x] `jsxPlugin.parse` produces the same `h(tag, props, children)` desugar as before
- [x] Non-JSX programs parse identically (no perf/behavior regression)
- [x] `bun run check` green
- [x] `bun run fixpoint` green (stage2 ≡ TS, byte-for-byte)

## Blocked by

26, 27

## Notes

`LanguagePlugin` is complete: `parse` · `inferCall` · `format` · `bindingType` ·
`dtsBinding`. `parseJsx` / `parseJsxChildren` / `makeJsxCall` moved verbatim from
`src/parser.ts` into `src/plugins/jsx.ts` behind `parse?: ParseHook`, and
`parser.ts` is grep-clean of `jsx` / `Jsx` / `"h"` / `Fragment`. The lexer never
changed — it already emitted plain `lt` / `gt` / `slash` / `str` tokens.

**Hook shape: one `parse` consulted at atom position, not token-keyed
registration.** `parseAtom` tries core's own prefix tokens first, then runs each
`parse` hook; a hook peeks and returns `null` — consuming nothing — to fall
through. Same `null`-means-fall-through convention as the other four hooks, one
optional field instead of a `{ token, parse }` shape, and unbounded lookahead
rather than one leading token. Running *after* core's atoms means a plugin can
extend the grammar but never shadow it; running *before* the `unexpected token`
fallback is what makes `plugins: []` yield a real parse `Diagnostic`.

**`ParseAbort` stays parser-owned.** `AGENTS.md` allows exactly one throw, so it
is not exported: `ParserApi.fail(message, span?)` raises the marker inside
`parser.ts`, and the public `parse` boundary remains the only place converting it
to `Result<_, Diagnostic>`. `span` defaults to the token under the cursor — what
core's `fail` did — so every JSX parse error is byte-identical, message *and*
span: `unclosed JSX tag '<div>'`, `unclosed JSX fragment`, `mismatched JSX
closing tag: expected '</a>', got '</b>'`, `unexpected token in JSX children: …`,
`expected string or '{expr}' for attribute '…'`.

**`ParserApi` exposes the cursor, not the parser:** `peek(offset?)` (clamped to
the terminal `eof`, so lookahead is total) · `next` · `expect` (generic, so hooks
get a narrowed token instead of casting) · `expectId` · `expectLabel` (`$tone`,
ADR 0009) · `parseExpr` · `spanFrom` · `fail`. Hooks share the parser's live
cursor, so consuming tokens advances the position core resumes from.

`parse(toks, opts)` now takes the same `plugins` option as every other pass, and
the ripple is one argument at each site that already had a list: `compile` and
`toTypedProgram` (hence `emitDts` / `codegenTs`), `format`, `module.ts`'s
`loadGraph` (hence `buildModules`, `buildModulesTs`, `moduleContext`, and
`loadModuleGraph`'s new optional `opts`), `moduleDiagnostics`, `moduleHoverAt`,
`moduleTypeDefinitionAt`. Single-file plugin-free entry points (`hoverAt`,
`diagnostics`, the lexical nav helpers) keep resolving to builtins — same as
their infer calls already did, since they expose no `plugins` option.

`plugins: []` + `<div />` now yields `parse` / `unexpected token lt` uniformly
from `parse`, `compile`, `format`, and `emitDts`. The three #27 opt-out
assertions in `test/extensions.spec.ts` tightened accordingly (they asserted
"parses but nothing checks/re-folds it"), plus two new guards: the parse hook's
default `origin: "jsx"` vs its empty-list Diagnostic, and core grammar formatting
identically with `plugins: []`.

Verified: `bun run check` green (1070 pass); `bun run fixpoint` PASS (stage2 ≡
stage3 ≡ TS reference, byte-for-byte — `bootstrap/parser.mochi` keeps its inline
`parseJsx`, the structural divergence ADR 0011 §6 defers); `bun run
bootstrap:tsc` **0** errors; `bun run fmt:check` green; `bun run docs:build`
green; `bun run gen:mochi-dts:check` green; `bun run build:ext` ok.

For #29: the headline empty-list test can now assert a parse `Diagnostic` end to
end (`compile(jsxSrc, { plugins: [] })`), which `test/extensions.spec.ts` only
spot-checks. Two known residuals to weigh: the lexical nav helpers listed above
still index JSX with builtins because they take no `plugins` option, and
`bootstrap/parser.mochi` still parses `<…>` inline.

---

### 29 — Empty-plugin-list opt-out + verification

## What to build

Add a test proving an **empty** plugin list is a hard JSX opt-out: compiling a
JSX source with no plugins registered produces a parse diagnostic (the
`.ts`/`.tsx` equivalent). Verify `bun run fixpoint` and `bun run build:ext`
still succeed with `jsxPlugin` default-registered. Reconcile any doc drift
(ADR 0007/0010/0011, `CONTEXT.md`) against the shipped code.

## Acceptance criteria

- [x] Compiling `<div/>`-style source with `plugins: []` yields a parse `Diagnostic`, not a crash
- [x] Default compile paths (no explicit empty list) still parse JSX as before
- [x] `bun run build:ext` still bundles the LSP extension successfully
- [x] `bun run fixpoint` green (stage2 ≡ TS, byte-for-byte)
- [x] Docs (ADRs, `CONTEXT.md`) match shipped behavior — no stale claims
- [x] `bun run check` green

## Blocked by

27, 28

## Notes

Five new `test/extensions.spec.ts` guards prove the opt-out is systemic, not
compile-only: `compile()` default vs `plugins: []` (parse `Diagnostic`,
`unexpected token lt`); the same contrast through `moduleDiagnostics()` (async,
LSP-shaped surface, not just the sync compiler entry point); and an explicit
vendor-only list (`plugins: [styledCvaExtension]`) still parsing `<Btn …/>`,
proving `resolvePlugins`'s builtins-prepended semantics end to end rather than
only at the unit level (already covered in #26's `resolvePlugins` tests).

All seven gates run clean: `bun run check` (1075 pass), `bun run fixpoint`
(stage2 ≡ stage3 ≡ TS, byte-for-byte), `bun run bootstrap:tsc` (**0** errors),
`bun run fmt:check`, `bun run docs:build`, `bun run gen:mochi-dts:check`,
`bun run build:ext`.

Docs reconciled: `AGENTS.md`'s module table gained `extensions.ts` /
`plugins/jsx.ts` / `doc.ts` rows and dropped a stale TS-backend claim on the
`codegen.ts` row. `docs/compiler.md` gained a "plugin seam" section and a
bootstrap-JSX-deferral note under self-hosting. `docs/tooling.md` gained a
short "Plugins" section (it previously didn't document the option under
either name). ADR 0011 gained a single "Final shape (as shipped)" section so
a first-time reader doesn't have to read #26/#27/#28's reconciliation notes to
find the final `LanguagePlugin`, plus a Consequences bullet documenting the
lexical-nav residual as a deliberate call. `CONTEXT.md`'s "Language plugins"
section already matched the shipped five-hook shape — no drift found.
`packages/plugin-styled-cva/README.md` already used `plugins` correctly — no
drift found there either.

Not touched: `docs/adr/0007-jsx-desugar.md` / `0009` / `0010` — #21 already
reconciled these against the plugin-vs-core boundary; re-reading them for this
slice turned up no new drift attributable to #26–#28.

---

### 30 — Docs copy: interop examples (+ pragma sniff)

## What to build

Reframe `apps/docs` `#interop` as **worked examples of host glue**, not a kit
catalog. Ship the vite pragma sniff fix (string literal `"import { h } from …"`
must not suppress the real pragma).

## Acceptance criteria

- [x] Nav / title / lead say "Interop examples"; rows lead with pattern not kit marketing
- [x] `h` pragma still prepended when emit text mentions `import { h }` in a string (test)
- [x] `bun run check` green

## Blocked by

None

---

### 31 — Gap A via vendor plugin (ADR note)

## What to build

Amend ADR 0010: Gap A's near-term typed *hand* bridge is superseded by a
**vendor plugin** that emits `ContainerDef<…>` into `.d.mochi.ts`. Wave 6 table
opened.

## Acceptance criteria

- [x] ADR 0010 amendment points Gap A at `@mochi/plugin-re-reduced` / Wave 6
- [x] Tracer Wave 6 table + briefs present
- [x] `bun run check` green

## Blocked by

None

---

### 32 — `@mochi/plugin-re-reduced`

## What to build

Vendor package mirroring styled-cva: `inferCall` + `dtsBinding` for
`defineContainer(name, { state, actions })` call sites. Dts emits
`import("@re-reduced/preact").ContainerDef<S, R, …> & { name: string }` from
the config AST (flat state literals; void-payload actions for first cut).

## Acceptance criteria

- [x] Package under `packages/plugin-re-reduced`, workspace-wired
- [x] Unit tests: defineContainer binding dts is not `unknown`; contains `ContainerDef`
- [x] `bun run check` green

## Blocked by

31

---

### 33 — Docs app drops `counter.ts`

## What to build

Register `reReducedExtension` in `mochi.plugins.ts`. Delete
`apps/docs/src/state/counter.ts`. `Counter.tsx` imports from `counter.mochi`.
Update host seam comments.

## Acceptance criteria

- [x] No `counter.ts` cast bridge
- [x] `Counter.tsx` imports `.mochi` and typechecks via generated sidecar
- [x] `bun run --cwd apps/docs check` green

## Blocked by

32

---

### 34 — Gate

## What to build

Verify QA gates; mark Wave 6 slices done.

## Acceptance criteria

- [x] Grep-clean of cast bridges under `apps/docs/src/state/`
- [x] `bun run check` green (includes docs vite build)
- [x] Wave 6 rows 30–34 → done

---

### 35 — ADR 0012 + vocabulary

## What to build

Accept ADR 0012 (typed seam + thin sugar; ReScript-informed). Index it.
Amend ADR 0010 end-state pointer. Open Wave 7. Update `CONTEXT.md`
interop vocabulary.

## Acceptance criteria

- [x] `docs/adr/0012-host-interop-end-state.md` Accepted; README row
- [x] ADR 0010 amendment points Gap A/B *means* at 0012
- [x] Wave 7 table + briefs; CONTEXT host-interop paragraph

## Blocked by

None

---

### 36 — Core literal + union types

## What to build

Add string singleton (`tLit`) and finite union (`tUnion`) to the type
algebra; unify / show / dts / hover. Literals subtype their base
(`"rose" ⊑ string`). Finite unions distribute sensibly under unify.
No surface syntax yet beyond what plugins / annotations need for tests —
prefer constructing via constructors; optional later: `"a" | "b"` in
type exprs.

## Acceptance criteria

- [x] `Type` carries lit + union; unify + show + dts round-trip
- [x] Unit / PBT: lit ⊑ string; union member check; no kit code in core
- [x] `bun run check` green

## Blocked by

35

---

### 37 — styled-cva `$tone` as literal union

## What to build

`@mochi/plugin-styled-cva` `inferCall` builds core `tUnion` of `tLit`s from
`variants.$tone` keys (not `tString`). JSX attr `"taupe"` fails; `"rose"`
ok. Dts already emits string unions — keep that path in sync with core
formers where possible.

## Acceptance criteria

- [x] Infer prop type for `$tone` is `"rose" | …` (show / hover)
- [x] JSX / call site rejects unknown tone with type diagnostic
- [x] Docs Badge / Counter still green; `bun run check` green

## Blocked by

36

---

### 38 — re-reduced bridge hygiene

## What to build

Document in package README + tracer that Wave 6 AST→`ContainerDef` string
template is a **bridge** under ADR 0012. Sketch shrink path: structural
HM record for hover + thin outbound `import()` dts; no new kit walkers
without typed-extern or sugar-derive justification.

## Acceptance criteria

- [x] README states bridge + 0012 preference order
- [x] No new reverse-typechecker surface added in this slice
- [x] `bun run check` green

## Blocked by

35

---

### 39 — Docs: interop preference order

## What to build

Short section in `docs/language.md` and/or `docs/compiler.md`: write typed
extern when honest; `: a` + sugar only when signature would lie; outbound
`.d.mochi.ts` for heavy host types; ReScript pointers (external FFI types,
JSX V4, genType outbound-only).

## Acceptance criteria

- [x] Docs state preference order matching ADR 0012
- [x] Link ADR 0012 + Wave 7
- [x] No kit marketed as language surface

## Blocked by

35

