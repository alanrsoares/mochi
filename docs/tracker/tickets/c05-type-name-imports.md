---
id: C5
title: Type-name imports (qualified TypeExpr) — parser through dts
status: open
type: task
blocked-by: []
---

# C5 — Type names cannot cross module edges

**Problem (fact-checked):** `TypeExpr` (`ast.ts:141-146`) has no qualified form —
`tname.name` / `tapp.ctor` are bare strings, and there is no record TypeExpr at all.
`let g : D.Shape = …` fails with `ParseError: expected eq, got dot`. The self-host paid
for this: the bootstrap graph was reshaped into shared `bootstrap/ast.mochi` /
`bootstrap/types.mochi` modules purely to keep type names same-file.

**Correction from sanity check:** cross-module **ctor matching already works** —
`module.ts:98-102` merges the dep's exported ctor table, `parser.ts:812` parses
`D.Circle(r)` patterns, and cross-module exhaustiveness fires correctly. That half of
the original finding was wrong. The residual ctor issues (nominal identity for
re-exported/aliased variants; the unscoped merge itself) are split out to
[C13](c13-unscoped-ctor-merge.md).

**What to build (type-name half only):**

- `Alias.T` (and `import { T }`) usable in type-annotation position: `let x : Alias.T`,
  `extern f : Alias.T -> …`, and inside variant/record alias declarations.
- Hover + `.d.ts` / `.d.mochi.ts` fold back to the alias-qualified name.

**Why it gates C1:** strict-by-default's escape hatch is `extern f : T -> U` — it
pushes every host seam through `TypeExpr`, which today can't name imported types.
Strict before this ships = mandatory annotations that can't be written.

- [x] `ast.ts`: qualified `TypeExpr` form; `parser.ts` accepts `Alias.T` in type
      position (TS side). — ADR 0046
- [ ] check/infer resolve qualified names through the import graph; case in
      `test/examples.spec.ts`.
- [ ] dts/hover fold-back to qualified alias names.
- [ ] Bootstrap impact: **large** — `bootstrap/parser.mochi` + `infer`/`check` mirrors
      need the same production (differential tests, message + span parity); afterwards,
      check whether any shared-module workaround in the bootstrap graph can unwind.
- [ ] `bun run check:full` green.
