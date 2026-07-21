---
id: 0008
title: String interpolation — core (ADR 0023)
status: open
type: task
assignee:
blocked-by: []
---

# 0008 — String interpolation, core

**What to build:** `"expected ${x}, got ${y}"` in `src/` per ADR 0023. First-class
`interp` Expr (`parts: (string | Expr)[]`); no-hole strings stay `str` (zero churn).
Lexer `scanString` gains `${}` mode (brace-depth tracked, strings in holes scan
recursively, new `\$` escape). Holes unify with `string` — explicit `show(x)` for the
rest. Codegen = native JS backtick template literal, template-safe re-escaping
(`` ` ``, `${`, `\`). Formatter round-trips the sugar.

- [ ] Every Expr walker recurses hole exprs (infer + freeRefs, check forEachMatch +
      checkReservedWords, codegen genExpr + exprRefs + usesMatchLib, format,
      parser.pbt children) — `.exhaustive()` forces each.
- [ ] Hover works inside holes (spans on hole exprs).
- [ ] test/interp.spec.ts: type error on non-string hole; nested interpolation;
      escaping round-trip through compile-and-eval (`` ` ``, `$`, `\`, `${` literal).
- [ ] `bun run build:ext` (stale LSP bundle hazard).
- [ ] `bun run check` green.
