# 0049 — Builtin plugin replacement via name shadowing

- **Status:** accepted
- **Date:** 2026-07-28
- **Source:** owner decision (LSP/plugin architecture review follow-up F4); `packages/compiler/src/extensions/extensions.ts`
- **Deepens:** ADR 0011 (language plugins, decision 3's opt-in/opt-out semantics)

## Context

ADR 0011 decision 3 gave `resolvePlugins` three cases: `undefined` → builtins,
`[]` → hard opt-out, non-empty list → builtins **prepended** then the caller's
list. Prepending protects a project that registers only a vendor plugin
(styled-cva) from silently losing JSX — but it also made two things
inexpressible:

1. **Replace a builtin.** A project cannot swap `jsxPlugin` for its own JSX
   implementation: the builtin runs first and its `parse` hook claims `<…>`
   before the replacement is ever consulted (first-non-null wins).
2. **Drop one builtin, keep the rest.** `[]` is all-or-nothing: opting out of
   JSX also drops every vendor plugin the project registered.

Both were tolerable with a single builtin, but they are structural: each new
builtin widens the gap.

## Decision

**A caller plugin whose `name` matches a builtin replaces that builtin in
place** — the same slot in the run order, so hook precedence relative to other
builtins is preserved. Since a `LanguagePlugin` with no hooks is valid, a
hook-less stub (`{ name: "jsx" }`) *disables* a builtin while keeping every
other plugin. One mechanism covers replace and per-builtin opt-out.

```ts
// replace:  the project's own JSX takes jsxPlugin's slot
plugins: [myJsxPlugin /* name: "jsx" */, styledCvaExtension]
// disable jsx, keep vendors:
plugins: [{ name: "jsx" }, styledCvaExtension]
```

`resolvePlugins` stays the single source of truth; the other cases are
unchanged (`undefined` → builtins, `[]` → hard opt-out, non-shadowing lists →
builtins prepended). Shadowing entries are removed from the tail of the list
so a plugin never runs twice.

## Alternatives rejected

- **Options object** (`plugins: { builtins: false | [...], list: [...] }`) —
  grows every consumer's option surface (CLI, Vite, LSP init, `emitDts`,
  `moduleDiagnostics`) for a rare need; the array shape is already threaded
  everywhere and name identity already exists.
- **Keep the wart** — fine today, but each future builtin compounds it, and
  the fix is one function either way.

## Consequences

- `name` is now load-bearing identity: naming a vendor plugin after a builtin
  is always a shadow, never a coexistence. Vendor plugins must not casually
  reuse `"jsx"`. The LSP manifest loader already rejects duplicate names
  *within* a manifest (`load-plugins.ts`), which keeps accidental double
  entries from turning into silent last-wins.
- Behavior is observable end-to-end: shadowing `"jsx"` with a stub removes the
  syntax itself (plain parse error), same as ADR 0011's `[]` opt-out but
  scoped to one builtin. Guards live in `test/extensions.spec.ts`.
