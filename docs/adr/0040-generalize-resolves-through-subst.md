# 0040 — `generalize` resolves mono-scheme bindings through the substitution

- **Status:** Accepted
- **Source:** `src/schemes.ts:93`

## Context

A `mono('t)` binding whose type variable was later unified to a row type
(`{ … | 'r }`) still reads as the bare `'t` in its scheme if the scheme
isn't resolved through the current substitution — hiding the row variable
`'r` from `generalize`'s free-variable walk. `generalize` then treats `'r` as
free (not environment-bound) and **quantifies** a row variable the
environment already constrains: an unsound over-generalization that makes a
monomorphic local spuriously polymorphic, which leaked as an unwanted `& A`
intersection type in the TS backend.

## Decision

Resolve a scheme's bound type fully through the current substitution before
computing its free variables for `generalize`. Mono schemes bind nothing, so
nothing is opaque and the walk resolves in full — this is the correctness
fix: without it, the row variable a mono scheme's binding was unified to
stays invisible to `generalize` and gets wrongly quantified.

## Consequences

- Fixes an unsoundness class where mutually-recursive functions threading
  shared row-typed state could each get a spurious extra row variable
  quantified in their inferred type, visible as a stray `& A` in TS emission.
- `generalize`'s free-variable computation is now substitution-aware by
  construction — any future scheme representation change must preserve this.

## Alternatives rejected

- **Leave mono schemes unresolved, filter their apparent free vars
  heuristically** — treats the symptom (stray `& A`) rather than the cause
  (an unresolved binding hiding a constrained row var).
