---
id: C9
title: Parser error recovery — a track of slices, not one bullet
status: open
type: track
blocked-by: []
---

# C9 — One parse error kills the whole editor experience

**Problem (fact-checked):** `parser.ts:43` defines `ParseAbort`; throws at `:65, :69,
:107, :577, :595`; caught once at `:1145` returning a **single** `Diagnostic`. A file
with 2 parse errors reports 1, and `fmt` on it emits nothing. check/infer already
return `Diagnostic[]` (ADR 0004). While editing, code is mid-keystroke broken most of
the time, so one parse error suppresses all downstream diagnostics, hover, and
formatting for the whole file. Highest-leverage editor-DX investment remaining.

**Scope note from sanity check:** as one ticket this is 3–4× the house ticket size —
it is a *track*. Slices, in order (each independently shippable):

| Slice | What | Gate |
|---|---|---|
| a | ADR: recovery points (top-level `let`/`type`/`import`/`extern` at col 0 + plugin sync tokens), error-node representation in `ast.ts`, no-cascade rule for check/infer | decision |
| b | `parser.ts`: panic-mode sync + `Diagnostic[]` from `parse`; `ParseAbort` stays internal; existing single-error tests updated | `bun run check` |
| c | check/infer skip error nodes without cascading; multi-error file test | `bun run check` |
| d | Formatter: raw-slice passthrough for error-node spans (never destroys unparsable code); idempotency + PBT (format of broken file round-trips source bytes) | `bun run check` |
| e | LSP: hover/symbols/diagnostics verified against a file with 2+ parse errors | `bun run check` |
| f | Bootstrap parity: `bootstrap/parser.mochi` mirrors recovery; differential message + span parity | `bun run check:full` |

- [x] Slice a (ADR — blocked by C12 numbering repair)
- [x] Slice b
- [x] Slice c
- [x] Slice d
- [x] Slice e. `diagnostics` / `moduleDiagnostics` already published every parse
      diagnostic (slice b), so the residual gap was the *other* direction: hover,
      symbols, nav and completion each called the hard-fail `parse` and returned
      `null`, blanking the editor on exactly the files recovery exists for. Added
      `toTypedProgramRecovering` in `src/compile.ts` (the editor's
      `toTypedProgram`; drops parse diagnostics on purpose — `diagnostics` is the
      surface that reports them) and switched `hover.ts` (`docAt`, `hoverAt`,
      `moduleHoverAt`), `nav.ts` (`parseProgram`, `typeDefinitionAt`,
      `moduleTypeDefinitionAt`) and `complete.ts` (`parseProgram`, `typedOf`'s
      single-file branch) to recovering parse. `compile` stays hard-fail: emitting
      from a file with a hole would be a silent lie. Guard:
      `test/lsp-recovery.spec.ts` — a file with two unparsable regions still
      yields ≥2 diagnostics, hover on bindings before *and* after both holes,
      document symbols, completion, and go-to-definition across a hole. Also
      corrected the stale `diagnostics()` doc ("Lex/parse still yield one" — only
      lex does, post-ADR-0045).
      **Deferred, not blocking:** `moduleContext` loads the *entry* through the
      module graph with a hard-fail parse, so for a file that both imports and has
      a typo, the module-aware surfaces fall back to their single-file open-world
      form (which can still fail `check` on an imported-variant `switch`). Making
      the graph's entry load recovering touches `module.ts` and its bootstrap
      mirror `module.mochi`, so it is its own slice.
- [x] Slice f — `bootstrap/parser.mochi` mirrors recovery. `SError(span)` added to
      `bootstrap/ast.mochi`, with the pass-through arms in `bootstrap/check.mochi`
      (`boundNamesFrom`, `checkReservedNames`) and the loud invariant throw in
      `bootstrap/codegen.mochi`. The mirror forced one amendment to ADR 0045 that
      also improves the TS side: **recovery restarts at the token the diagnostic
      points at, by span**, not at wherever the failing production left the cursor.
      A `Result` failure in the bootstrap parser discards the cursor, and the error
      record's `{ message, start, end }` shape is shared by lexer/parser/check/infer
      on the railway, so a resume field would contaminate four passes — the span is
      information both parsers already have. It is also kinder: when the offending
      token is a declaration keyword (`let x let y = 2`), the next declaration
      survives. Guard: `test/bootstrap-parser.spec.ts`'s `expectSameError` widened
      from first-error-only to **every diagnostic (message + span, source order) plus
      each `SError` hole's span**, over 5 new recovery cases; the hard-fail wrappers
      are still checked to agree on the first diagnostic.
      **Found en route (not C9's scope):** mochi puts `&&` and `||` at *one*
      left-associative precedence level, so `a || b && c` groups as `(a || b) && c`.
      That silently made `skipToSync`'s stop condition non-terminating. Parenthesized
      with a comment; the wart itself wants its own ADR.
