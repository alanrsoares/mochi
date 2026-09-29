# 0121. Plugin member completion on the bootstrap core

- **Status:** Accepted
- **Date:** 2026-09-30
- **Source:** [ADR 0013](0013-lsp-completion.md), [ADR 0109](0109-bootstrap-ast-is-the-public-ast.md),
  [ADR 0120](0120-bootstrap-completion.md), `packages/compiler/src/bootstrap/options.ts`,
  `packages/dx/src/bootstrap-complete.ts`, `packages/plugin-styled-cva/src/bootstrap.ts`, #103

## Context

ADR 0120 moved completion onto the self-hosted core, but kept the TypeScript
path for callers that pass TypeScript-core plugins (`dxPlugins`). Most of what
those plugins add to completion already comes through bootstrap. Their
`inferCall` has a bootstrap twin, so the types of `tw.div(…)` components and
`re-reduced` stores are the same on both cores. The one thing left was
`LanguagePlugin.completeMembers`: styled-cva's list of `tw.<tag>` factories
after `tw.`, where `extern tw : a` gives the core no members to list.

## Decision

- **`BootstrapPlugin` gains `completeMembers`.** It has the same signature as
  the TypeScript hook: `({ receiver, prefix }) => CompletionItem[] | null`. The
  hook is **host-only**. The editor calls it and `toSeedPlugin` drops it, so the
  seed and `host-types.d.ts` do not change. Completion is an editor query and
  not part of compiling, so nothing in Mochi needs to see the hook.
- **Same order as the TypeScript path.** Namespace members come first, then
  the receiver's record fields, then the first plugin hook that returns a
  non-null answer, in list order. Plugin members are only asked for when the
  receiver has no fields.
- **The completion types move to `bootstrap/options.ts`.** `CompletionItem`,
  `CompletionKind`, `CompleteMemberApi` and `CompleteMemberHook` are defined
  there, and `extensions` re-exports them, so the two plugin shapes share one
  definition.
- **The TypeScript completion path is removed from `@mochi/dx`.** `completeAt`
  and `moduleCompleteAt` take `{ cache, plugins }`, with bootstrap plugins
  only. The TypeScript answer lives on only as a test oracle
  (`test/oracles/complete-ts.ts`), which `test/bootstrap-complete.spec.ts`
  compares against until #104 retires the oracles.

## Consequences

- The language server no longer reads `dxPlugins` for completion. Hover and
  go-to-type still take them until their own bootstrap cut-over (#103).
- styled-cva's `twMembers` lives in its `/bootstrap` entry, and the TypeScript
  extension imports it from there.
