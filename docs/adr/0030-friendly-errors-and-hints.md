# 0030 — Friendly compile errors: source snippets + structured suggestions

- **Status:** Proposed
- **Source:** conversation 2026-07-22; `src/errors.ts` (`AlangError`, `formatError`);
  `src/diagnostics.ts` (LSP-shaped computation); `src/span.ts` (`lineCol`, `Span`);
  `src/cli.ts` (stderr prose path); `src/infer.ts` (`unbound`, `no member` sites);
  `src/check.ts` (`unknown constructor`, `no export`, reserved-word sites);
  `docs/adr/0001` (Result short-circuit); `docs/adr/0025` (JSON diagnostics — reserved
  `help`/`code`, "no did-you-mean/Levenshtein machinery exists anywhere in `src/`")

## Context

mochi's errors today are one prose line. `formatError(e, src)` →
`"TypeError at 3:14: <message>"`. No source snippet, no caret under the offending
range, no "did you mean". Every `AlangError` already carries a `span` (always for
`lex`; usually elsewhere), and `span.ts`'s `lineCol` already maps offset → line:col —
the location data for a rich render is present and unused past the one-liner.

Two gaps, independent:

1. **Presentation.** A user (or agent) reading `at 3:14` must open the file and count
   to the column. Elm/rustc render the offending source line with a caret underline
   in place. That is pure formatting over data mochi already has — **no error
   producer changes**.

2. **Guidance.** Most real errors are typos against a set that is *in hand at the
   error site*: `unbound 'x'` knows the environment; `no member 'x'` knows the
   record's row labels; `unknown constructor 'X'` knows the registry; `'from' no
   export 'x'` knows the module's exports. Nothing computes "did you mean `y`?" —
   ADR 0025 confirmed no edit-distance machinery exists and explicitly *reserved*
   the JSON `help`/`code` fields for this follow-up rather than populating them null.

ADR 0025 chose a scalar `help: string`. This ADR revisits that: a **structured**
suggestion (a candidate *plus the span it replaces*) is what turns a hint into an
LSP quick-fix / `mochic --fix`. A prose string cannot be applied automatically; a
`{span, replacement}` can. The scalar was the right minimum for 0025's JSON-only
scope; it is the wrong shape once suggestions must also drive editor code-actions.

## Decision

Ship **friendly errors in two phases, presentation first**, and model hints as
**structured, applicable suggestions** — not prose.

### Phase A — source-snippet renderer (no producer changes)

New module `src/render.ts`, a pure function `renderError(e: AlangError, src): string`
that emits an Elm-style block:

```
TypeError — test.al:3:14

3 │   foo bar baz
  │       ^^^ was used where a value was expected; a call may be missing an argument
```

- Reads only `src` + `e.span` + `e.message`; reuses `lineCol`. Multi-line spans
  underline the first line and note the extent.
- `errors.ts`'s `formatError` **stays** as the terse single-line form (logs, tests,
  compact contexts). `render.ts` is the rich path; `errors.ts` remains pure data with
  no presentation growth (this is why a new module, not a `formatError` option).
- `cli.ts`'s human path swaps `console.error(formatError(...))` →
  `console.error(renderError(...))`. JSON mode (ADR 0025) untouched.

### Phase B — structured suggestions + did-you-mean

1. **Data.** Add to `AlangError`:
   ```ts
   type Suggestion = { replace: Span; with: string; note?: string };
   //  ...on every AlangError:  suggestions?: Suggestion[]
   ```
   `replace` defaults to the error's own `span` at construction; `note` is optional
   human framing ("did you mean"). Empty/absent array = no suggestion, exactly as
   today.

2. **Edit-distance helper.** One small `levenshtein` in a new `src/suggest.ts` plus
   `closest(name, candidates): string[]` — bounded (distance ≤ 2, or ≤ ⌈len/3⌉),
   returns best 1–3. No dependency.

3. **Populate at the four name-typo sites** where the candidate set is already local:
   - `infer.ts` `unbound 'x'` → environment keys
   - `infer.ts` `no member 'x'` → record row labels
   - `check.ts` `unknown constructor 'X'` → registry constructor names
   - `check.ts` `'from' no export 'x'` → the module's export names
   Each: run `closest`, attach a `Suggestion` per hit. The `TypeErr → AlangError`
   `u()` seam in `infer.ts` (which attaches the span) is where infer-side suggestions
   are populated — the narrower `TypeErr` stays suggestion-free.

4. **Render.** `render.ts` prints suggestions under the caret line
   (`help: did you mean 'bar'?`). JSON renderer (ADR 0025) gains
   `suggestions: Suggestion[]` in place of the reserved scalar `help` — a superset,
   version-bumped.

5. **LSP quick-fix.** `diagnostics.ts` carries `suggestions` through; `lsp/server.ts`
   maps each to a `CodeAction` (title from `note`, edit from `replace`→`with`). This
   is the payoff that justified structured-over-scalar.

### Non-goals

- **Error codes** (`E0308`). No registry today; deferred, as in 0025.
- **Multi-error batches.** ADR 0001's short-circuit still holds — 0 or 1 error per
  compile. Suggestions are *per error*, not a second diagnostics channel.
- **Type-mismatch structural fix-its** ("add argument", "wrap in `Some`"). Phase B
  targets *name typos* only; unification-shaped suggestions are a later ADR.
- **Wording as a contract.** Prose stays free to change; `--json` is the stable one.

## Consequences

- Phase A is pure win: every existing error renders better with zero risk to
  producers, guarded by a `render.spec.ts` snapshot.
- `AlangError` grows one optional field; all constructors stay source-compatible
  (`suggestions` optional). The bootstrap's `errors.al` mirror must add the field
  when Phase B lands — a language-visible change, so it needs an `examples.spec.ts`
  case per populated site (per Definition of Done).
- Diverging from 0025's scalar `help` means 0025's JSON schema is amended before it
  ships (it is still **Proposed**), not broken after — cheap now, not later.
- `closest` is bounded and candidate-local, so no full-corpus scan; cost is
  negligible and only paid on the error path.

## Alternatives rejected

- **Scalar `hint?: string` (ADR 0025's original `help`).** Simplest, Elm-faithful,
  but not machine-applicable — no quick-fix, no `--fix`. Rejected once suggestions
  must drive editor actions; the structured shape is a superset the prose renderer
  can still flatten.
- **Grow `formatError` with a `{snippet: true}` option.** Fewer files, but mixes
  presentation into the pure-data error module and complicates the terse callers.
  A dedicated `render.ts` keeps the seam clean.
- **Suggestion engine as a post-hoc pass over the finished error.** Would re-derive
  candidate sets the producer already held (re-walk env / registry / row). Producing
  suggestions *at the site* is strictly less work and strictly more accurate.
- **Fuzzy match across the whole prelude + program.** Noisy; a typo'd local is not
  usefully "corrected" to an unrelated prelude name. Candidate set stays scoped to
  what was actually in scope at the error.
