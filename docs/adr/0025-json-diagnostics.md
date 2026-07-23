# 0025 — Structured JSON diagnostics (`--json` CLI flag)

- **Status:** Proposed
- **Source:** conversation 2026-07-22; `src/errors.ts` (`AlangError`); `src/diagnostics.ts`
  (existing LSP-shaped computation); `src/cli.ts` (current stderr prose path);
  `src/lsp/server.ts`; `docs/adr/0001-result-threading-over-exceptions.md`

## Context

`mochic` today has two diagnostic surfaces that already **disagree** on shape:

1. **CLI** (`cli.ts`): on failure, `formatError(e, src)` prints one line of prose to
   stderr — `"TypeError at 3:14: message"` — and exits 1. Line:col is **1-based**
   (`lineCol` in `span.ts`).
2. **LSP** (`lsp/server.ts` via `diagnostics.ts`): computes a `Diagnostic { range, message }`
   already close to the real LSP protocol shape, range is **0-based** (`posAt`/`rangeOf`),
   and `kind` is folded into the message string (`` `${e.kind}: ${e.message}` ``) rather
   than kept as its own field.

Neither is machine-parseable in a stable, general way — the CLI path is prose-only, and
the LSP path is structured internally but embeds `kind` in text and is only reachable
through the LSP protocol, not standalone. An agent driving `mochic` from a shell (the
common loop: run compiler, read error, retry) has to regex-parse prose today. That
prose format isn't a contract — it can change wording without anyone treating it as a
break.

One more structural fact this ADR must respect, not paper over: mochi's `Result`-threading
(`ADR 0001`) means the pipeline **short-circuits at the first error**. `diagnostics.ts`
already documents this — "pipeline short-circuits first error, so yields 0 or 1
diagnostics." Any JSON schema here describes an array of **0 or 1** items today, honestly,
not a multi-error report it can't produce.

## Decision

Add a `--json` flag to `mochic`'s relevant subcommands (`build`, `check`-style entry
points), reusing — not reinventing — `src/diagnostics.ts`'s existing computation.

1. **One computation, two renderers.** `diagnostics.ts` keeps being the single source of
   diagnostic data; `formatError` (prose) and a new `toJsonDiagnostic` (structured) both
   render from the same `AlangError`, the way LSP and CLI should have shared all along.
   `kind` becomes its own field on the JSON diagnostic instead of being folded into text —
   the LSP path's current `` `${e.kind}: ${e.message}` `` string-fold does not carry over.
2. **Position convention: reuse LSP's 0-based `range`, not CLI's 1-based `line:col`.**
   `diagnostics.ts` already computes it (`posAt`/`rangeOf`); inventing a third convention
   for this schema would mean three position formats live in one codebase for no reason.
   The raw byte-offset `Span` ships alongside it (`{ start, end }`, already on `AlangError`)
   for tools that want offsets directly rather than re-deriving them from `range`.
3. **Envelope wraps both outcomes, not just errors.** `{ schemaVersion: 1, ok: boolean,
   output?: string, diagnostics: Diagnostic[] }`. On success, `ok: true`, `output` is the
   compiled program text, `diagnostics: []`. On failure, `ok: false`, `output` absent,
   `diagnostics` has exactly 0 or 1 entries (per the short-circuit fact above — never
   fabricate a longer array). One predictable shape on stdout regardless of outcome,
   instead of "raw JS text on success, prose on stderr on failure" — the asymmetry an
   agent currently has to special-case.
4. **Diagnostic shape (v0):**
   ```ts
   type JsonDiagnostic = {
     kind: "lex" | "parse" | "check" | "type";
     message: string;
     span?: { start: number; end: number };   // byte offsets, raw AlangError.span
     range?: { start: {line, character}, end: {line, character} }; // 0-based, LSP-shaped
   };
   ```
   No `code` (rustc-style `E0308`) and no `help`/suggested-fix field in v0 — mochi has
   neither an error-code registry nor a suggestion engine today (confirmed: no
   "did you mean"/Levenshtein machinery exists anywhere in `src/`). Reserving those names
   for a real follow-up is honest; populating them with `null` today is not.
5. **stdout, not stderr.** JSON mode writes the envelope to stdout in both outcomes; exit
   code stays the existing contract (0 success, 1 failure) so scripts that only check
   exit status keep working unchanged. Human (non-`--json`) mode is untouched: prose to
   stderr on failure, compiled output to stdout on success, exactly as today.
6. **`schemaVersion` from day one.** This becomes a contract other tools depend on the
   moment it ships; a version field lets a future breaking change (e.g. `code` field
   arriving, or the short-circuit constraint lifting if `Result`-threading ever changes)
   be detected instead of silently breaking consumers.

## Alternatives rejected

- **NDJSON / streaming, one diagnostic per line.** Suggests a multi-error future the
  architecture can't produce today (`ADR 0001`'s short-circuit is load-bearing, not an
  oversight) — an array of 0-or-1 is honest to what the pipeline actually yields. Adopting
  streaming now would misrepresent the current architecture; revisit only alongside a
  separate ADR that changes `Result`-threading to accumulate multiple errors.
- **Machine-strippable annotations on the existing prose format** (SGR-style tags around
  spans, stripped for humans) — cheaper to bolt on, but still text-shaped parsing with an
  implicit grammar instead of real JSON; doesn't fix the actual problem (fragile parsing).
- **A second, independently-designed JSON schema for the CLI**, separate from
  `diagnostics.ts`'s LSP-facing shape — rejected in favor of one computation, two thin
  renderers; two independently-evolving diagnostic shapes in one codebase is the exact
  divergence this ADR exists to close.
- **1-based line:col in the JSON schema** (matching today's CLI prose) instead of LSP's
  0-based range — keeps CLI-prose muscle memory, but `diagnostics.ts` already computes
  the 0-based form for free; picking 1-based would mean *adding* a conversion rather than
  reusing one that exists.

## Consequences

- `kind` splits out of the LSP diagnostic's message string — a small, compatible change
  to `diagnostics.ts`'s internal shape (LSP `Diagnostic.message` can still fold it back in
  for display; the structured `kind` field is additive).
- This is now a public contract (`schemaVersion`) — changes to it need the same care as
  any other user-facing surface, not ad-hoc edits.
- No error codes or fix suggestions ship here; a registry (`code: "E..."`) and a
  suggestion engine (`help:`) are explicit, separate follow-ups, not implied by this ADR.
- Because the array is honestly 0-or-1 today, this schema needs **no breaking change**
  if `Result`-threading ever grows multi-error accumulation later — the shape already
  supports it; only the pipeline's short-circuit behavior would need to change.
- CLI and LSP now share one diagnostic computation end to end — reduces the chance of
  the two surfaces silently disagreeing again (the divergence that motivated this ADR).
