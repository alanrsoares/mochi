# Editor DX — tracer bullets

Parent track for rustc/gleam-like editor DX. Decisions: [ADR 0003](./adr/0003-rich-diagnostics.md), glossary in `CONTEXT.md` (Diagnostics & editor DX).

Each slice is a vertical tracer bullet: compiler + tests + LSP surface where applicable.

| # | Title | Type | Blocked by | Issue |
|---|---|---|---|---|
| 0 | Rename `AlangError` → `Diagnostic` (+ `PublishDiagnostic`); optional rich fields stubbed | AFK | — | [#2](https://github.com/alanrsoares/mochi/issues/2) |
| 1 | Lexical symbol index (same-file values/types/ctors) + unit tests | AFK | 0 | [#3](https://github.com/alanrsoares/mochi/issues/3) |
| 2 | Document highlight + go-to-definition (same-file, all name spaces) via LSP | AFK | 1 | [#4](https://github.com/alanrsoares/mochi/issues/4) |
| 3 | Find refs + rename (same-file) | AFK | 2 | [#5](https://github.com/alanrsoares/mochi/issues/5) |
| 4 | CLI/LSP render labels + help | AFK | 0 | [#6](https://github.com/alanrsoares/mochi/issues/6) |
| 5 | First rich checker error (e.g. unbound + did-you-mean `Suggestion`) + code actions | AFK | 1, 4 | [#7](https://github.com/alanrsoares/mochi/issues/7) |
| 6 | Cross-module `Location` — export origins; F12 + “defined here” across imports | AFK | 2, 5 | [#8](https://github.com/alanrsoares/mochi/issues/8) |
| 7 | Cross-module refs + rename | AFK | 3, 6 | [#9](https://github.com/alanrsoares/mochi/issues/9) |
| 8 | Document / workspace symbols | AFK | 6 | [#10](https://github.com/alanrsoares/mochi/issues/10) |

Parent epic: [#1](https://github.com/alanrsoares/mochi/issues/1).

**Deferred:** multi-error collection, record-field nav, go-to-type/implementation, prelude virtual defs.

## Slice briefs

### 0 — Rename to `Diagnostic`

## What to build

Rename the compiler error union to `Diagnostic`. Rename the LSP DTO in `diagnostics.ts` to `PublishDiagnostic`. Stub optional `labels` / `help` / `suggestions` (and `Location`) so later slices can fill them without another type migration. Update docs (`AGENTS.md`, `docs/compiler.md`, `docs/tooling.md`).

## Acceptance criteria

- [ ] No `AlangError` type name in `src/` or docs (historical mentions in ADR 0003 only)
- [ ] `Result<_, Diagnostic>` railway unchanged in behaviour
- [ ] `bun run check` green

## Blocked by

None — can start immediately

---

### 1 — Lexical symbol index

## What to build

A same-file lexical def/use index over a `Program` (values, types, ctors). Binding identity is the def span. No typechecking required. Unit tests cover shadowing.

## Acceptance criteria

- [ ] Index API queryable by offset → binding (+ defs/uses)
- [ ] Shadowed names resolve to the correct binding
- [ ] Types and constructors are distinct namespaces from values
- [ ] `bun run check` green

## Blocked by

Slice 0

---

### 2 — Highlight + go-to-definition (same-file)

## What to build

`documentHighlight` + `definition` LSP providers backed by the symbol index. Works when typecheck fails. Prelude / builtins → no location.

## Acceptance criteria

- [ ] F12 on a value/type/ctor use jumps to its def in the same file
- [ ] Document highlight marks def + uses for the binding under the cursor
- [ ] Unit tests for the compiler nav API; LSP is a thin adapter
- [ ] `bun run check` green

## Blocked by

Slice 1

---

### 3 — Find refs + rename (same-file)

## What to build

`references` + `rename` for same-file bindings. Skip `$` / `_` synthetics. Reuse edit plumbing intended for suggestions/code actions.

## Acceptance criteria

- [ ] Shift+F12 lists def + all uses for that binding (shadowing-correct)
- [ ] F2 renames the binding and all its uses in the file
- [ ] Synthetics and prelude are not renameable
- [ ] `bun run check` green

## Blocked by

Slice 2

---

### 4 — Render labels + help

## What to build

`formatError` and LSP `PublishDiagnostic` mapping render `labels` and `help` when present (`relatedInformation` in the editor). No new checker messages required — fixtures/tests can construct rich `Diagnostic` values.

## Acceptance criteria

- [ ] CLI output shows labels/help in a rustc/gleam-like layout
- [ ] LSP publishes related spans for labels
- [ ] Tests assert on structured fields and rendered form
- [ ] `bun run check` green

## Blocked by

Slice 0

---

### 5 — First rich checker error + code actions

## What to build

One real checker path emits labels and/or a did-you-mean `Suggestion` (e.g. unbound variable). Advertise `codeActionProvider` and apply suggestions as edits.

## Acceptance criteria

- [ ] At least one production error path attaches label and/or suggestion via the symbol index
- [ ] Quick fix applies the suggestion edit
- [ ] Help (if any) is prose-only; Suggestion is machine-applicable
- [ ] `bun run check` green

## Blocked by

Slices 1, 4

---

### 6 — Cross-module Location

## What to build

Thread export origins (`path` + `nameSpan`) through module context into the symbol index. F12 and “defined here” labels cross files.

## Acceptance criteria

- [ ] F12 on an imported use or import name opens the exporting module at the def
- [ ] A diagnostic label can point at another file’s `Location`
- [ ] `bun run check` green

## Blocked by

Slices 2, 5

---

### 7 — Cross-module refs + rename

## What to build

Find-refs and rename across the import graph for one binding.

## Acceptance criteria

- [ ] Refs include other modules that import/use the binding
- [ ] Rename updates all graph sites (or clearly refuses unsafe cases)
- [ ] `bun run check` green

## Blocked by

Slices 3, 6

---

### 8 — Document / workspace symbols

## What to build

Document outline and workspace symbol search over lets/types/ctors.

## Acceptance criteria

- [ ] Document symbols list top-level declarations
- [ ] Workspace symbol query finds declarations across the open graph
- [ ] `bun run check` green

## Blocked by

Slice 6
