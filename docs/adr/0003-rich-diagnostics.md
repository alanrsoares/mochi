# 0003 — Rich diagnostics in the compiler

- **Status:** Accepted
- **Source:** conversation (DX architecture), `src/errors.ts`, `src/diagnostics.ts`

## Context

Hover already lives in the compiler; the LSP is a thin adapter. Go-to-definition,
find-refs, rename, and rustc/gleam-style helpful errors all need structured
locations and related spans — not flat `message + optional span`. Putting that
structure only in a CLI pretty-printer or LSP layer would drift (nice CLI, dumb
editor, or the reverse) and duplicate the symbol knowledge the checker already
has when it fails.

The historical name `AlangError` is leftover from a pre-mochi rename and should
not survive the rich-diagnostic work.

## Decision

1. **Rename `AlangError` → `Diagnostic`.** The railway is `Result<T, Diagnostic>`.
   Kind stays `lex | parse | check | type`. The LSP-facing DTO in `diagnostics.ts`
   becomes **`PublishDiagnostic`** so the compiler type and the wire shape stay
   distinct.

2. **Enrich `Diagnostic` in the compiler** with primary span + labels + help +
   suggestions. Passes *produce* the rich shape; CLI and LSP only render it
   (squiggles, `relatedInformation`, code actions, terminal labels). **Labels and
   suggestions use `Location = { path, span }`** (absolute path), not bare same-file
   spans — so cross-module “defined here” does not require a later type widen.
   Same-file sites still set `path` to the file under check; the LSP maps `path` →
   `file:` URI.

3. **Suggestions are machine-applicable from the start.** A `Suggestion` is
   `{ location, replaceWith }` (and optional title). The first slice that *emits*
   suggestions also advertises `codeActionProvider` and applies them as edits.
   Display-only “try X” strings are `Help`, not `Suggestion`. Rename later reuses
   the same edit plumbing.

4. **Keep `TypeErr` narrow** inside `unify.ts`. Enrichment happens at the existing
   `u()` seam in `infer.ts` when it becomes `Diagnostic`.

5. **Symbol index is lexical** (scope walk over the AST + import origins), shared
   by navigation and by diagnostic labels (e.g. "defined here", did-you-mean).
   Binding identity is the def span, not the name string. Index construction does
   not require typechecking.

6. **No post-hoc diagnostic invention** outside the checker — adapters must not
   synthesize labels/help the passes did not emit.

7. **Keep the one-error railway** — stages still return `Result<T, Diagnostic>`
   (first failure wins). Richness goes into labels / help / suggestions on that
   single value. Multi-diagnostic collection is deferred until recovery can avoid
   cascading junk.

## Consequences

- Mechanical rename across `src/`, tests, docs, and bootstrap comments that still
  say `AlangError`; constructors (`lexErr` / …) can stay until a later tidy.
- `formatError` / LSP mapping grow to render labels, help, and suggestions; tests
  assert on the structured value, not only the rendered string.
- First suggestion-emitting checker improvement ships with LSP code actions; rename
  reuses that edit path.
- Nav (definition / references / rename / highlight) and richer errors land as
  slices on the same substrate, not parallel stacks.
- New `Diagnostic` fields stay optional so existing call sites keep working until
  enriched.
- Editor surfaces section in docs/tooling.md should mention nav + code actions as
  they land; bootstrap `CErr` can converge on `Diagnostic` later.

## Alternatives rejected

- **Flat error + pretty-print/LSP wrapper** — two sources of truth; helpful
  structure never reaches both surfaces evenly.
- **Piggyback symbol resolution on infer** — nav and "defined here" die whenever
  typechecking fails; worse DX than rust-analyzer / Gleam under broken code.
- **`Diagnostic` beside `Result` as a second channel** — splits the railway; every
  pass would juggle two channels for one failure story.
- **Collect many diagnostics from day one** — better rustc surface eventually, but
  needs honest recovery; fake multi-error cascades are worse than one precise
  diagnostic. Deferred.
- **Same-file `Span` only on labels, widen later** — cheaper for the first PR, but
  forces a second migration the moment an import-site error points at an export.
- **Display-only suggestions first, code actions later** — cheaper, but splits
  “fix text” from “apply fix” and redoes edit plumbing for rename. Rejected in
  favour of long-run DX.
- **Keep the name `AlangError` or use `MochiError`** — legacy / undersells the
  structured diagnostic model.
