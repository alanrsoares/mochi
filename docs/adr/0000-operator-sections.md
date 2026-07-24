# 0000 — Operator sections

- **Status:** Accepted
- **Source:** `src/parser.ts` (`sectionLeft` / `tryParseRightSection`), `bootstrap/parser.mochi`

## Context

Partial application of infix ops is common (`mapT((+ 1))`, `(2 *)`). Without sections,
callers write lambdas or host `add` that must accept both curried and multi-arg shapes
(codegen emits `add(x, y)`).

## Decision

Haskell-style sections: `(x +)` and `(+ x)` desugar to a one-param `$s` lambda over the
same prelude builtin the infix already lowers to. No new AST node. `(- x)` stays unary
negation. Formatter refolds `$s` lambdas back to section syntax.

## Consequences

- Sections compose with `|>` and work as first-class function values.
- Bootstrap parser must stay in lockstep with the TS parser (agreement + fixpoint).
- Shadowing a prelude op name (e.g. host `extern add`) breaks multi-arg emit — prefer
  prelude arithmetic in examples.

## Alternatives rejected

- New AST/`Section` node — codegen and hover would need a second path for the same call.
- Only left *or* only right sections — both are useful for non-commutative ops.
- Keep forcing `x => x + 1` / curried `add(x)(x)` — fights the surface language.
