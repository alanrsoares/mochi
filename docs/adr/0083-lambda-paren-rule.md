# 0083 — Keep the lambda paren rule

- **Status:** Accepted
- **Date:** 2026-08-27
- **Source:** tracker C2; `packages/compiler/src/parser/parser.ts` (`parseParam`);
  `packages/compiler/src/infer/unify.ts`; `bootstrap/types.mochi`
- **Amends:** none

## Context

The outer `(…)` of a lambda is the param list; an inner `(a, b)` is a tuple
destructure. One extra pair of parens forks the type: `(x, y) => x` is
`A -> B -> A` (two-arg, curried); `((x, y)) => x` is `(A, B) -> A`. A lone
`(x)` is grouping, not a 1-tuple, and the formatter drops it to `x =>`. The
difference is invisible in many fonts and unteachable without a named error.

`LamParam` already carries `nameSpans` on `ptuple` (hover and nav use them).
The remaining hole was the type error: `f((3, 4))` on a two-arg lambda, or
`f(3, 4)` on a tuple-param lambda, was a raw `cannot unify number with
(number, number)`.

## Decision

Keep the paren rule. No grammar change. When unification fails with a tuple on
exactly one side, the message names both forms:

`((a, b)) => takes one tuple; (a, b) => takes two arguments`

## Consequences

- Formatter keeps `((a, b))` distinct from `(a, b)` and still collapses `(x)`
  to `x`.
- Docs list all three cases next to other destructure forms.

## Alternatives rejected

**Require `p => let (a, b) = p in …`.** Drops a form bootstrap already uses
(`((t, st1)) =>`). The `let (a, b) =` sugar stays; it is not a replacement.

**A distinct param-position pattern syntax** that is not paren-count-based.
New grammar for a trap a diagnostic and the formatter already make visible.
