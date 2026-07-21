---
id: 0009
title: String interpolation — bootstrap parity
status: open
type: task
assignee:
blocked-by: [0008]
---

# 0009 — String interpolation, bootstrap parity

**What to build:** teach the self-hosted compiler ADR 0023. `bootstrap/lexer.al`
scanString gains the `${}` mode (mirror src/lexer.ts token-for-token);
`bootstrap/parser.al` gains `EInterp` + exprSpan case; `bootstrap/codegen.al` emits
the backtick template. Differential suites pin it.

- [ ] bootstrap-lexer differential: interp edge cases (nested, escapes, unterminated
      hole error parity — message + span).
- [ ] bootstrap-parser differential: `EInterp` canon case.
- [ ] bootstrap-codegen differential: emitted template byte-identical to TS.
- [ ] Fixpoint stays green (corpus may not use interp yet — 0012 does that).
- [ ] `bun run check` green.
