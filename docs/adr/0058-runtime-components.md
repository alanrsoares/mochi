# 0058 — Runtime components are separate from compiler plugins

- **Status:** Accepted
- **Date:** 2026-08-21
- **Source:** owner request (Cordis paper review);
  `packages/runtime-components/src/index.ts`

## Context

`LanguagePlugin` is a static, cross-pass compiler seam: it extends parsing,
inference, formatting, and TS emission while a source graph is compiled. It is
not a lifecycle or dependency-management mechanism for code loaded into a
running process. Treating it as one would add mutation, teardown, and reload
concerns to every compiler entry point.

The Cordis model usefully distinguishes temporal composition (a component
reverses the registrations it owns) from spatial composition (components
declare needs and react to providers arriving or leaving). Mochi needs this
only for a future live host, not ordinary compilation.

## Decision

Add `@mochi/runtime-components` as an opt-in host library. Its small interface
is `capability`, `mount`, `unmount`, and `replace`:

- A `RuntimeComponent` declares typed capability `needs` and `provides`.
- `activate` returns a `Resource`: its provided values and a `ResultAsync`
  disposer. The host owns that resource and invokes the disposer at most once.
- Missing needs leave a component waiting. A newly available provider triggers
  reconciliation; removing a provider deactivates transitive dependents before
  the provider.
- `replace` disposes the old component, tries the replacement, and re-mounts
  the previous working component when replacement activation fails.
- `@mochi/vite-plugin` is the first host integration: it adapts the configured
  `LanguagePlugin[]` to a runtime component at `buildStart`. A caller may also
  supply a watched `RuntimePluginSource`; on a successful replacement Vite
  issues a full browser reload, while a failed replacement leaves the previous
  component active. The docs dev server uses that watched source for its
  `mochi.plugins.ts` manifest.
- `@mochi/lsp` is the second host integration: a project manifest reload is a
  component replacement, so a broken save retains the last working plugin set
  while reporting the reload error to the editor.

The host is a runtime API only. `LanguagePlugin`, the static module graph, and
Mochi's no-effect-row decision remain unchanged.

## Consequences

The first slice has executable coverage for delayed activation,
dependency-ordered teardown, failed-replacement rollback, Vite's build-start /
watched-replacement lifecycle, and LSP's last-known-good project plugins. It
establishes the vocabulary of owned registrations and declared capabilities
without adding surface syntax or changing Algorithm W.

The LSP path is additionally covered at the protocol boundary: a running
server receives the watched-files notification that VSCode forwards and
republishes diagnostics from the reloaded manifest without a restart.

The reversibility guarantee is intentionally narrow: it covers only work the
component represents in its `Resource.dispose` result. Arbitrary JS mutation,
network requests, files, and emitted messages need a host adapter with a real
inverse or compensation. Concurrent transitions, provider multiplexing,
isolation/interception, and configuration reconciliation remain follow-ups.

## Alternatives rejected

- **Extend `LanguagePlugin` with lifecycle hooks.** Compiler plugins have no
  runtime ownership context, and their existing pure cross-pass contract is a
  useful invariant.
- **Add effect rows or handlers to Mochi.** The paper's core contribution is a
  runtime model and does not prove arbitrary host effects reversible; this
  would overturn ADR 0005 without evidence from a real component API.
- **Require a framework.** A host library has a narrower seam and works with
  Bun/Vite applications, agent harnesses, or other JS hosts.
