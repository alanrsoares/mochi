# 0128. Bootstrap plugins shadow builtins by name; claims and clash checks retire

- **Status:** Accepted
- **Date:** 2026-09-30
- **Source:** [ADR 0049](0049-plugin-name-shadowing.md), [ADR 0050](0050-plugin-claims-table-dispatch.md),
  [ADR 0127](0127-barrel-takes-bootstrap-plugins.md), #104, `bootstrap/extensions.mochi`
- **Supersedes:** ADR 0050

## Context

The TypeScript core's `LanguagePlugin` seam had three features that the
self-hosted seam (`bootstrap/extensions.mochi`) lacked:

1. **Name shadowing (ADR 0049).** A caller plugin named like a builtin replaces
   it in place, and a hook-less stub (`{ name: "jsx" }`) disables it while
   keeping the other plugins. `docs/tooling.md` documented this for every host,
   but hosts on the seed got the builtin *and* the stub.
2. **Claim declarations and table dispatch (ADR 0050).** `parse.tokens`,
   `inferCall.refs` and `inferCall.memberTargets` declared what a hook owns, so
   a hook ran only for its claims.
3. **Clash rejection (ADR 0050).** `pluginClashes` turned two plugins claiming
   the same name, token or callee into a `Diagnostic` at the parser.

Every host now passes `BootstrapPlugin`s (ADR 0127), so only the TypeScript core
and `test/extensions.spec.ts` exercise 2 and 3.

## Decision

- **Port name shadowing to the seed.** `resolvePlugins` maps each builtin to a
  same-named caller plugin if there is one, then appends the caller plugins
  that shadow nothing. The format, dts and binding-type collectors all go
  through it, so one change covers every pass. `bootstrap/extensions.spec.mochi`
  pins the rule, and `bootstrap/plugins.spec.ts` pins the stub end to end.
- **Retire claims, table dispatch and clash rejection.** Bootstrap hooks return
  `None` for anything they do not handle, and the first `Some` wins in list
  order. With no ownership declared up front there is nothing to clash. Two
  plugins that both answer for one node are resolved by order, as the format
  and dts hooks always were. The features go with the TypeScript core in #105.
- **Duplicate names in a project manifest stay a load error**
  (`packages/lsp/src/load-plugins.ts`). Under shadowing, a repeated name is
  almost always a mistake.

## Consequences

- `{ name: "jsx" }` now disables the builtin JSX plugin on every seed-backed
  host (CLI, Vite, LSP, barrel), as `docs/tooling.md` says.
- A plugin that claims too much is no longer caught when it loads. It shows up
  as a wrong type or parse result, and only when it is listed before the
  plugin it overlaps.
- The claim-related cases in `test/extensions.spec.ts` have no bootstrap
  counterpart by design. They are deleted with that spec.
