# 0123. Plugin manifests drop `dxPlugins`

- **Status:** Accepted
- **Date:** 2026-09-30
- **Source:** [ADR 0110](0110-plugin-manifest-bootstrap-first.md), [ADR 0120](0120-bootstrap-completion.md),
  [ADR 0121](0121-bootstrap-complete-members.md), [ADR 0122](0122-bootstrap-hover.md),
  `packages/lsp/src/load-plugins.ts`, `packages/lsp/src/server.ts`, #103

## Context

ADR 0110 made the self-hosted-core `plugins` list the manifest's primary
export. It kept an optional `dxPlugins`, which was a TypeScript-core copy for
the editor queries still on the TypeScript core. With ADRs 0120 to 0122,
completion, hover and go-to-type all run on bootstrap and take the project's
`plugins`. Nothing reads `dxPlugins` any more.

## Decision

- **A manifest exports `default` or named `plugins`, and nothing else.** The
  loader ignores a leftover `dxPlugins` export instead of rejecting it, so an
  old manifest keeps loading.
- **The TypeScript-core claim-clash check is gone from the loader.** Claims
  (ADR 0050) are declared by TypeScript-core `inferCall.refs`, and only
  `dxPlugins` could carry them. Bootstrap hooks filter their own calls.
- **`completeMembers` joins the hooks the loader checks are functions.**
- **The language server keeps one kind of cache**, the bootstrap graph cache
  for each manifest. The TypeScript `ModuleCache` is gone. Every DX query
  takes `{ cache, plugins }`, with a bootstrap cache and bootstrap plugins.

## Consequences

- The in-repo manifests (`apps/docs`, `examples/snake`) and the vendor
  READMEs list only `/bootstrap` entries.
- `@mochi/dx` and `@mochi/lsp` no longer import the TypeScript `extensions`
  or `module` passes. The TypeScript `LanguagePlugin` exports stay in each
  vendor package for the TypeScript compile path until #102 and #104.
