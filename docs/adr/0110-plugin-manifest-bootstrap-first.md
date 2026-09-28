# 0110 — Plugin manifests list self-hosted-core plugins first

- **Status:** Accepted
- **Date:** 2026-09-28
- **Source:** [issue #106](https://github.com/alanrsoares/mochi/issues/106), [issue #103](https://github.com/alanrsoares/mochi/issues/103), [ADR 0109](0109-bootstrap-ast-is-the-public-ast.md), [ADR 0011](0011-language-plugins.md), [ADR 0050](0050-plugin-claims-table-dispatch.md)

## Context

ADR 0109 gives host plugins a self-hosted-core shape (`BootstrapPlugin`), and
each in-repo vendor plugin now ships one (`@mochi/plugin-*/bootstrap`). A
project's `mochi.plugins.ts` is read by Vite, `gen-mochi-dts`, `lint-mochi`,
and the LSP. Those readers move to the bootstrap graph at different times:
compile, `.d.ts`, and diagnostics move now; hover, completion, navigation, and
formatting stay on the TypeScript core until #103. The manifest has to serve
both for that window, and every loader needs the same answer about its shape.

## Decision

- The `default` (or named `plugins`) export is `BootstrapPlugin[]`. It is the
  list the project compiles, emits `.d.ts`, and gets diagnostics under.
- An optional named `dxPlugins` export is `LanguagePlugin[]`, the
  TypeScript-core copy. Only the DX queries still on the TypeScript core read
  it. It is deleted with #103, and the manifest loses nothing else.
- The LSP loader (`pluginsForDocument`) returns `{ plugins, dxPlugins? }`. It
  rejects a `plugins` entry whose hook is not a function, so a manifest still
  listing TypeScript-core plugins fails to load (reported through `onError`)
  instead of running them as bootstrap hooks.
- Claim clashes (ADR 0050) are checked on `dxPlugins` only: bootstrap hooks
  filter their own calls and declare no claims table.
- A bootstrap graph cache is only valid for the plugin list it was filled
  under. The LSP and `lint-mochi` keep one per manifest.

## Consequences

- Vite, `gen-mochi-dts`, `lint-mochi`, and LSP diagnostics never run a
  TypeScript-core plugin. The TypeScript core is reached only by DX queries,
  and only with `dxPlugins`.
- For now, a vendor plugin is listed twice in each manifest, once per core.
- A manifest without `dxPlugins` still works; its DX queries run on the
  bootstrap graph with builtins only.

## Alternatives rejected

**One list mixing both shapes.** Every loader would have to sniff each entry to
tell them apart, and `inferCall` is a function in one shape and a record in the
other. Named exports keep the split explicit and let #103 delete one of them.

**Keep `default` as `LanguagePlugin[]` and add `bootstrapPlugins`.** It works,
but the transitional name would end up as the permanent one, and every
manifest would have to be edited again after #103.
