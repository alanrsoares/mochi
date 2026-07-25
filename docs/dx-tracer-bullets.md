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
| 13 | LSP completion provider — value/field/import members (enables `tw.*`) | HITL→AFK | design | todo |
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
CONTEXT.md core vs **vendor plugin** glossary; re-reduced infer/dts vendor
plugin (Gap A still mostly typed TS bridge).

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
