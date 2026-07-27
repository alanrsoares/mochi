# 0045 — Parser error recovery: sync points, error nodes, no-cascade

- **Status:** Accepted
- **Source:** `docs/tracker/tickets/c09-parser-error-recovery.md` slice a; amends
  [ADR 0004](0004-multi-error-diagnostics.md); `src/parser.ts` (`ParseAbort` at :43,
  throws at :65/:69/:107/:577/:595, single catch at :1145)

## Context

`parse` throws an internal `ParseAbort` on the first unexpected token and the one catch
at the module boundary turns it into a **single** `Diagnostic`. Consequences, all
editor-facing: a file with two parse errors reports one; `fmt` on a broken file emits
nothing; every downstream surface (check, infer, hover, symbols, completion) is dark for
the whole file because there is no `Program`. While editing, source is mid-keystroke
broken most of the time, so this is the common case, not the edge case.

ADR 0004 deliberately left lex/parse on the one-error railway because multi-error
collection without *recovery rules* invents cascading junk. This ADR supplies the
recovery rules.

## Decision

### 1. Panic-mode recovery, synchronising on declaration keywords at bracket depth 0

On `ParseAbort` the parser records the diagnostic, then **skips tokens** until it reaches
a *sync point*, and resumes the top-level statement loop there.

A token is a sync point when both hold:

- its tag is in the **sync set**: the core declaration keywords `let`, `type`, `extern`,
  `import`, `export`, plus any tags contributed by language plugins (below), plus `eof`
  (which always terminates);
- the **bracket depth accumulated since recovery started is 0**, counting
  `lparen`/`lbrace`/`lbracket` as +1 and `rparen`/`rbrace`/`rbracket` as −1, clamped at 0.

The depth guard is what stops recovery from resuming inside a half-open record, argument
list, or `switch` block, where a `let` is a `let … in` expression rather than a
declaration.

**The skip starts at the token the diagnostic points at, not at wherever the cursor was
left** (added by slice f). The failing production may have consumed arbitrarily far past
the real error before aborting, so `recoverFrom` re-seeks from the statement's first token
to the first token whose `start >= diagnostic.span.start`, and scans for a sync point from
there. Two reasons, both load-bearing:

- **Mirrorable.** `bootstrap/parser.mochi` is `Result`-based: a failure discards the
  cursor, and the error record it returns is the `{ message, start, end }` shape shared by
  lexer/parser/check/infer on the railway (`bootstrap/module.mochi`'s
  `lex >> Result.flatMap(parse)`). Threading a new resume field through that record would
  contaminate all four passes. The offending token's *span* is information both parsers
  already have, so the rule is expressible in each without new plumbing.
- **Strictly kinder.** When the offending token is itself a declaration keyword
  (`let x let y = 2`), resuming at it means the second declaration parses instead of being
  swallowed.

Forward progress is preserved by consuming one token when the re-seek lands back on the
statement's own first token (the ordinary case: the statement failed at its head).

**Column 0 is explicitly *not* the anchor.** The tracker proposed it; it is not
implementable at this seam and would be worse if it were. `parse` receives `Located[]`,
and a `Located` carries only a byte-offset `Span` (`src/lexer.ts`) — there is no
line/column on a token, so a column-0 rule would force the parser to take the source
string purely to recompute layout the token stream already implies. Bracket depth is
strictly more information than indentation: it is derived from the same tokens the parser
already consumes, and it is correct for a declaration that a user wrote indented.

**Known imprecision, accepted:** a `let … in` whose *opening* `let` sits at depth 0 (a
top-level binding whose value is a `letin` chain, with the error before the inner `let`)
can be chosen as a sync point, producing one extra downstream diagnostic. Panic-mode
recovery trades exactly this. The error cap (decision 5) bounds the blast radius, and the
first diagnostic — the real one — is always first in the array.

### 2. Plugins contribute sync tokens; the sync set never names JSX

`LanguagePlugin` (ADR 0011) grows one optional field:

```ts
syncTokens?: readonly Tok["t"][];
```

`parse` unions these into the sync set through the same `resolvePlugins` opt-in/opt-out
path as `parse`/`format` hooks, so `plugins: []` yields the core sync set alone. The
builtin `jsxPlugin` contributes **nothing**: JSX is expression-level syntax with no
declaration keyword, so it needs no recovery point. This is the point of the seam — core
must not know that JSX exists, and a future plugin that *does* own a top-level form
(`component Foo = …`) can register its keyword without editing `parser.ts`.

### 3. `SError` — one statement-level error node

`ast.ts` grows exactly one node, in `Stmt`:

```ts
| { kind: "error"; span: Span }
```

- The `span` covers **every byte skipped during recovery**, from the token that failed
  through the last token consumed before the sync point. That is what makes slice d
  possible: the formatter slices `src.slice(span.start, span.end)` and passes it through
  **verbatim**, so formatting a broken file can never destroy unparsable code.
- It is a discriminated `kind`, not an optional flag on `let`/`type`/`extern`/`import`.
  A flag would make every existing consumer silently wrong-by-default; a new union member
  makes `@onrails/pattern`'s `.exhaustive()` and `tsc` enumerate the blast radius for us.
- There is **no `EError`**. Recovery only ever resynchronises at declaration boundaries,
  so a recovered region is always statement-shaped. Expression-level recovery (and the
  poison/error *type* ADR 0004 decision 5 deferred) stays deferred; if it lands it adds
  `EError` under this same no-cascade rule.
- `SError` carries no message. The diagnostics are the diagnostic channel; duplicating
  them into the tree would create two sources of truth for one error.

### 4. No-cascade rule for check / infer (makes slice c mechanical)

For every `SError` node, in one sentence each:

1. **No bindings.** It registers no name in `check.ts`'s registry and no scheme in
   `infer.ts`'s env. It cannot collide with, shadow, or duplicate anything.
2. **No type vars.** Inference does not visit it and does not allocate a fresh var for
   it — so it cannot unify, cannot leak an unbound var into a later binding, and cannot
   appear in a generalised scheme.
3. **No diagnostics of its own.** The parse diagnostic was already reported. `SError`
   never produces a second finding about the same bytes.
4. **It suppresses nothing else.** Every *other* statement in the file is checked and
   inferred normally and reports its own findings. A file with one broken declaration and
   one genuine type error reports both.
5. **Unresolved references are not errors *because of* it.** A name whose only definition
   was inside the unparsable region will be reported as unbound by the normal rules. That
   is honest — the compiler cannot see the definition — and it is not a cascade, because
   it is one diagnostic per use site with a real span, not a chain of derived failures.

### 5. All parse diagnostics, capped

`parse` returns **every** parse diagnostic, in source order, up to
`MAX_PARSE_ERRORS = 100`. On the 100th, one final `parse` diagnostic is appended
(`too many parse errors; stopping`) and the remaining tokens are skipped to `eof`. A cap
is warranted for the same reason a stack limit is: a pathological or wrong-language input
otherwise turns one keystroke into a hundred-kilobyte diagnostic publish in the editor. It
is high enough that no hand-written file reaches it, and a two-error file reports two
errors.

**Forward progress is guaranteed structurally:** recovery consumes **at least one token
before scanning** for a sync point, and the top-level loop asserts the cursor strictly
advanced on every iteration. Both together mean the number of iterations is bounded by the
token count for any input, adversarial or not. A test proves termination on adversarial
input.

### 6. `ParseAbort` stays internal; codegen stays non-failing

`ParseAbort` remains the module-private marker and the compiler's only throw outside the
codegen invariant (AGENTS.md). It is now caught **per statement** rather than once at the
end, and still cannot escape `parse`.

Codegen never sees an `SError`: the railway stops on parse diagnostics, so a `Program`
that reaches `codegen.ts` has none. Codegen therefore **asserts the invariant** on
`kind: "error"` rather than emitting a placeholder — emitting garbage for an
unrepresentable node is worse than a loud bug report, and this is the same class as the
existing codegen invariant, not a new failure mode.

### 7. Amendment to ADR 0004

ADR 0004 decision 1 reads "Lex and parse stay `Result<T, Diagnostic>`" and its rejected
alternatives list "Whole-pipeline multi-error (lex/parse recovery) — high cost". **The
parse half of both is superseded here.**

- `parse: (toks, opts) => Result<Program, Diagnostic[]>`. Seams that wrapped
  `parsed.error` in `oneDiag(...)` now pass the array through.
- **Lex stays single-error.** Nothing in this ADR changes it; the lexer is sequential and
  its recovery is a separate question.
- The **hard-fail invariant survives**: `parse` still returns `Err` with no `Program` when
  any diagnostic is present, so `compile`, the module graph, and the CLI keep exactly
  today's semantics.
- The partial tree is reachable through a second, explicit entry point:

  ```ts
  parseRecovering(toks, opts): { program: Program; diagnostics: Diagnostic[] }
  ```

  `parse` is a thin wrapper over it. This is what slice d (formatter raw-slice
  passthrough) and slice e (hover/symbols under a broken file) consume. Keeping the soft
  shape behind a named function — rather than widening `parse` to
  `{ value?, diagnostics }` — is the narrow version of the "soft `TypedProgram`"
  alternative ADR 0004 rejected for widening every tooling seam: exactly one extra export,
  and no existing caller changes shape.

A pointer line is added to ADR 0004 so it does not read as still-current.

## Consequences

- Two parse errors report as two; the editor keeps working on a mid-keystroke file.
- Adding `SError` to `Stmt` breaks every `.exhaustive()` match over the union — that is
  the intended blast-radius report: `codegen.ts`, `codegen-ts.ts`, `dts.ts`, `format.ts`,
  `check.ts`, `infer.ts`, `symbols.ts`, `module.ts`, `hover`/`nav` indexers each state
  their own answer.
- `bootstrap/parser.mochi` mirrors recovery (slice f). The differential parse tests pin
  parity over the *whole* recovery — every diagnostic's message and span in source order,
  plus each `SError` hole's span in the partial tree — not just the first error.
  `bootstrap/parse` stays a hard-fail wrapper reporting the first diagnostic, so no
  bootstrap caller changed shape.
- `parseRecovering` is a second entry point to keep honest: anything that wants the
  partial tree must say so at the call site.

## Alternatives rejected

- **Column-0 anchoring for sync points** — unavailable at this seam (`Located` has no
  line/column, only byte offsets) and strictly weaker than bracket depth, which is
  derived from the tokens the parser already reads and is correct for indented
  declarations.
- **Error-tolerant Pratt continuation** (insert/delete a token, keep parsing the same
  expression) — better *local* recovery and how a production TS/Roslyn parser does it,
  but it needs a per-production expected-token model and invents plausible-looking nodes
  that then produce fabricated type errors. Panic-mode to declaration boundaries gives
  most of the editor win for a fraction of the surface. Revisitable per-production later
  without changing this ADR's contract.
- **Re-lex-and-retry** (drop the offending region from the source, lex and parse again) —
  quadratic in the error count, loses spans relative to the original source, and would
  make the formatter's byte-preservation guarantee unstateable.
- **No error node, diagnostics only** (skip the region, emit nothing) — cheapest, but the
  formatter then cannot know which bytes it must not touch, and slice d's guarantee
  (format never destroys unparsable code) becomes unimplementable.
- **Optional `error?: true` flag on existing `Stmt` members** — no compiler-enforced
  blast radius; every consumer would be silently wrong until someone noticed.
- **Widening `parse` to a soft `{ value?, diagnostics }` shape** — changes every existing
  caller and re-opens the ADR 0004 hard-fail question for no gain over one extra named
  export.
- **No cap on parse diagnostics** — ADR 0004 decision 4 rules out an artificial cap for
  check/infer, and rightly: those are bounded by declaration count. Recovery is bounded by
  *token* count, which is a different order of magnitude on garbage input.
