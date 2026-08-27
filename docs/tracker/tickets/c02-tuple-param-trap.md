---
id: C2
title: "ADR: ((a, b)) tuple-param vs (a, b) two-arg — one paren changes semantics"
status: done
type: task
blocked-by: []
---

> **DECIDED 2026-07-26 (user-grilled): keep the paren rule + spans + targeted
> diagnostic.** No grammar change. Work below = spans on `LamParam`/`ptuple`, the
> arity/type-mismatch diagnostic naming the paren rule, formatter test, retro ADR.

# C2 — Tuple-destructure param is distinguished from a two-arg lambda by paren count

**Problem (fact-checked):** `parser.ts:244-264` (`parseLambda`) consumes the outer
`lparen` as the param list; `parseParam` (`:209-242`) consumes an inner `lparen` as a
`ptuple` — nesting is the only discriminator. Emitted TS proves the semantic fork:
`((x, y)) => x` → `(_0: [A, B]) => A` vs `(x, y) => x` → `_curry(2, (x, y) => …)`.
Third case the original finding missed: a lone `(x)` silently collapses to a plain name
param (`parser.ts:236-238`). Invisible in prose fonts, unteachable, formatter can't
render it more clearly.

**Prerequisite found in sanity check:** `ptuple` carries `names` only, **no spans**
(`parser.ts:238`) — any targeted diagnostic needs spans on `LamParam` first.

**What to decide (ADR):** keep, replace, or augment:

- Keep as-is; add spans to `LamParam`, then a dedicated arity-mismatch diagnostic that
  names the paren rule and suggests the fix when a tuple meets a two-arg lambda.
- Require explicit destructure: `p => let (a, b) = p in …` (drop the param form).
- Distinct pattern syntax in param position that isn't paren-count-based.

- [x] ADR with the chosen direction + rejected alternatives (blocked by C12 numbering).
- [x] Spans on `LamParam`/`ptuple` regardless of direction (hover/diagnostics want
      them anyway).
- [x] If kept: targeted diagnostic + formatter test locking the rendering.
- [ ] If changed: parser + `bootstrap/parser.mochi` parity + migration note.
- [x] `docs/language.md` documents the rule (all three paren cases) either way.
