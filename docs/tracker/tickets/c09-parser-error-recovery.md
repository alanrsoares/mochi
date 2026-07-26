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
- [ ] Slice e
- [ ] Slice f
