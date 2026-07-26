# 0022 — Or-patterns (`p1 | p2 => body`) with shared bindings

- **Status:** Accepted
- **Source:** `src/ast.ts`, `bootstrap/check.mochi` (or-pattern flattening + guard sharing), `test/or-pattern.spec.ts`

## Context

Several `switch` arms often want the same handler for structurally different
patterns (e.g. two constructors that should be treated alike). Without
or-patterns this means duplicating the arm body or falling back to a nested
`switch`/guard, both worse than naming the alternative set once.

## Decision

An arm may list alternatives separated by `|` (same token that opens an arm,
disambiguated by absence of a following `when`/`=>` ending the run):
`p1 | p2 => body`. All alternatives must bind the **same names** at the same
structural position; each bound name's type unifies across the alternatives
so one body serves all of them. A guard on an or-pattern arm applies to every
alternative (checked by flattening the arm into one leaf per alternative that
shares the arm's guard, before exhaustiveness/coverage analysis).

## Consequences

- Exhaustiveness checking (`check.ts` / `bootstrap/check.mochi`) treats each
  alternative as separate coverage but shares one guard and one body —
  flattening keeps that logic in one place instead of duplicating it per
  alternative.
- Binding-name mismatch across alternatives is a check-time error, not a
  runtime surprise.

## Alternatives rejected

- **No or-patterns; require nested `switch` or duplicated arms** — pushes the
  duplication (and the risk of the bodies drifting apart) onto every call
  site instead of handling it once in the checker.
