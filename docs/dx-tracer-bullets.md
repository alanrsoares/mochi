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
