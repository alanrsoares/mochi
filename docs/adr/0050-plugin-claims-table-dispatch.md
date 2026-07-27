# 0050 — Plugin claims as declarations, table dispatch, and clash rejection

- **Status:** accepted
- **Date:** 2026-07-28
- **Source:** `packages/compiler/src/extensions/extensions.ts`, `packages/compiler/src/parser/parser.ts`, `packages/lsp/src/load-plugins.ts`
- **Deepens:** ADR 0011 (language plugins), ADR 0049 (name shadowing)

## Context

ADR 0011 gave every `LanguagePlugin` hook chained dispatch: for a given pass,
every registered hook runs in registration order until one returns non-null.
That is the right shape for hooks whose match is structural (JSX's
`inferCall` matches on `origin: "jsx"` provenance, not a callee name) — but
most hooks are actually name-keyed (`parse`'s leading token, `inferCall`'s
callee `ref`), and chaining them means:

1. **O(plugins) work per parse atom / per call**, even though at most one
   hook can ever match a given token or name.
2. **Silent last-registrant-wins** when two plugins both claim the same
   token or name — nothing rejects it, and which one "wins" depends on
   registration order a reader can't see from either plugin's own file.
3. **No way to say "this hook can only ever run here"** — a reviewer has to
   read the hook's body to learn what it actually handles, because the type
   system doesn't know.

ADR 0049 fixed *coexistence* (replace vs. disable a builtin by name). This
ADR fixes *ownership*: what a plugin is allowed to claim, and what happens
when two plugins claim the same thing.

## Decision

**Claims are declarations, and a declaration is a dispatch table, not a
guard.** `LanguagePlugin.parse` and `.inferCall` are no longer bare hooks —
they are `{ tokens, hook }` / `{ refs?, memberTargets?, hook }` records. The
claim fields (`parse.tokens`, `inferCall.refs`, `inferCall.memberTargets`)
are the plugin's declared ownership; `parseHookTable` and
`inferCallDispatch` build a `Map` from those claims over a **resolved**
plugin list (ADR 0049's `resolvePlugins` output — shadowing has already
happened), and the parser/inferrer do a single lookup instead of walking
every plugin:

```ts
export type ParseDecl = { tokens: readonly Tok["t"][]; hook: ParseHook };
export type InferCallDecl = {
  refs?: readonly string[];
  memberTargets?: readonly string[];
  hook: InferCallHook;
};
```

This makes illegal states unrepresentable rather than merely checked: a
hook claiming `refs: ["useThing"]` is *physically* unreachable for any other
callee name — `runInferCallHooks` only ever calls it when
`dispatch.refs.get(e.fn.name)` matches. There is no code path left where a
misbehaving hook could see a call it didn't declare, so there's nothing to
unit-test there beyond the table construction itself.

**Clash detection is `pluginClashes`, a pure function over a diagnostic.**
Given a resolved plugin list, it walks every claim (`name`, `parse.tokens`,
`inferCall.refs`, `inferCall.memberTargets`) through a small `owners: Map`
helper and emits one `check`-kind `Diagnostic` per second claimant, using a
zero-width `NO_SPAN` — a clash is a configuration fact, not a source
location. It is pure on purpose: the same function is reused at two call
sites that have very different failure-handling conventions (below), and
neither should own the detection logic.

**Two choke points reject clashes as ordinary diagnostics, no throws:**

1. **`parseRecovering`** (`packages/compiler/src/parser/parser.ts`), the
   actual choke point every pipeline funnels through — `parse` is a thin
   hard-fail wrapper over it, and `compile.ts`'s `toTypedProgramRecovering`,
   `dx`'s `hover`/`complete`/`nav`/`format`, and `codemod/transform.ts` all
   call `parseRecovering` directly. Plugins are resolved once at the top of
   the function (as before); `pluginClashes(plugins)` runs immediately after
   — once per parse, **O(plugins)**, not re-done per token — and its
   diagnostics seed the same `diagnostics` array every other parse error
   lands in. A clash is now a `Diagnostic` a caller sees through whichever
   surface it uses, exactly like a syntax error, never a thrown exception.
   (`toTypedProgramRecovering` still drops parse diagnostics by design,
   documented in its own docstring — that's pre-existing tolerant-editing
   behavior, unchanged by this ADR. The dedicated diagnostics surfaces,
   `diagnostics()` and `moduleDiagnostics()`, call the hard-fail `parse()`
   instead, so a clash reaches the editor through them.)
2. **LSP manifest load** (`packages/lsp/src/load-plugins.ts`). A manifest
   that loads successfully but resolves (with builtins) to clashing claims
   is treated the same as a manifest that fails to load: `pluginsForDocument`
   checks `pluginClashes(resolvePlugins(plugins))` inside the cached-promise
   `.then`, and throws (with the joined clash messages) into the existing
   `.catch` → `onError` path if any are found. The editor sees the same
   warning it would for a syntax-broken manifest and falls back to builtins,
   rather than running an ambiguous dispatch table silently.

**What deliberately stays chained.** `format`, `bindingType`, `dtsBinding`,
and `completeMembers` keep first-non-null chaining with no claim fields.
These hooks are refold/override shaped — "given this whole expression (or
binding), do you want to re-render it?" — not name-keyed at the call site,
so there is no natural claim to declare, and a clash between two such hooks
is cosmetic (one prints slightly differently than the other would have),
not an ownership conflict a program can silently get wrong.

**Claim-less hooks still exist and still chain within their pass.** A hook
that declares no claims (`inferCall` with neither `refs` nor
`memberTargets` — `jsxPlugin`, matching on AST provenance rather than a
name) goes into `InferCallDispatch.unclaimed` and is consulted on *every*
call, merged back into original registration order with the (at most one)
matched claimant so first-non-null semantics are unchanged from the old
whole-chain behavior. Declaring no claims is a legitimate, deliberate
choice — not every hook's match is name-keyed — and `pluginClashes` places
no requirement on it.

**`syncTokens` stays a separate field from `parse.tokens`.** They answer
different questions: `parse.tokens` is "my expression atom *starts* here"
(a dispatch claim, checked by `pluginClashes`); `syncTokens` is "error
recovery may *resume* at my top-level keyword" (ADR 0045's panic-mode sync
set). Merging them would let resync tokens accidentally participate in
parse-atom dispatch, or vice versa — two different pipeline concerns that
happen to both be `Tok["t"][]`.

**The expressiveness restriction, stated plainly:** two plugins can no
longer share a leading `parse` token, or a callee name in `inferCall.refs`
/ `memberTargets`. Before this change that configuration silently ran
first-registered-wins; now it is a rejected `Diagnostic`. This is by
design — a shared claim was never a supported configuration, only an
unchecked one, and the goal of this ADR is to make that visible rather than
to expand what two plugins can jointly express.

**Plugin-kit lift.** `extensions/plugin-kit.ts` factors the small pieces of
AST shape-matching every `inferCall` hook was reimplementing —
`CallExpr`/`RecordExpr` narrowing, `isRefCall`, row-walking helpers, and
`inferArgs` — into one shared module. It ships alongside this hardening
because claim declarations only pay off if a hook's own matching logic is
equally uniform: a hook that claims `refs: ["useThing"]` but then
re-derives "is this actually a call to a ref named useThing" by hand is
duplicating what the claim already told the dispatcher.

## Alternatives rejected

- **Keep chained dispatch, add a clash lint as a separate CLI check** —
  detached from the pipeline, so a clash is only caught if someone
  remembers to run the lint; the whole point is that misconfiguration is
  visible at the same place every other compile error is.
- **Throw on clash instead of returning a `Diagnostic`** — violates
  AGENTS.md's errors-as-values contract and ADR 0004's `Diagnostic[]`
  boundary; a plugin misconfiguration is not different in kind from a
  syntax error, and both compiler passes already have a diagnostics
  channel built for exactly this.
- **Validate claims once at plugin-list construction time, cache the
  result across parses** — tempting, but plugin lists are resolved
  per-call (`opts.plugins` can differ between compiler invocations in the
  same process, e.g. Vite watch mode or the LSP serving multiple
  workspaces with different manifests), so there is no single "the" plugin
  list to validate once; `pluginClashes` is already O(plugins), which is
  the actual bound that matters (plugin counts are small, single digits in
  practice).
- **Reject clashes only in the LSP, not in the compiler itself** — would
  leave `mochi build`/`bun run mochi` silently first-wins on a clash a CLI
  user hits without an editor in the loop; the compiler's own `parse` is
  the correctness-bearing surface, the LSP is an additional convenience
  layer on top.

## Consequences

- A hook is provably unreachable outside its declared claims — reading the
  claim tells a reviewer everything `runParseHooks`/`runInferCallHooks` can
  ever hand it, no need to trust the hook body's own guard.
- Dispatch is O(1) per token/call-site lookup instead of O(plugins),
  measurable as pipeline size grows (more builtins, more vendor plugins).
- A misconfigured plugin list (two plugins claiming the same token or
  name) is now a `Diagnostic` at the parse choke point and a load failure
  at the LSP manifest boundary — visible through every existing
  diagnostics-reporting surface (`diagnostics()`, `moduleDiagnostics()`,
  the LSP's `onError`) with no new API surface for callers to learn.
  Guards: `test/extensions.spec.ts` (`pluginClashes` unit tests, the parser
  choke-point test, the `moduleDiagnostics` editor-surfacing test) and
  `packages/lsp/src/load-plugins.spec.ts` (`onError` fires with a
  "clash"-containing message, `pluginsForDocument` falls back to
  `undefined`).
- Two plugins can no longer coexist while claiming the same leading token
  or callee name — previously an unchecked, first-wins configuration, now
  a rejected one. A plugin author who needs two plugins to cooperate on
  one name must either merge them into one plugin or use ADR 0049's
  shadowing to pick a single owner explicitly.
- `format`/`bindingType`/`dtsBinding`/`completeMembers` are unchanged:
  still chained, still no claims, still O(plugins) per call — a deliberate
  scope limit, not an oversight, since their match shape doesn't fit a
  claim table.
