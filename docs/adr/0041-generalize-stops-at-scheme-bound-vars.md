# 0041 — `generalize`'s free-variable walk stops at a scheme's own bound vars

- **Status:** Accepted
- **Source:** `src/schemes.ts:95`

## Context

A *generalized* scheme's bound variable may itself, elsewhere, be a
substitution key — for instance if an unsound over-generalization upstream
(the class ADR-0040 fixes) left it bound. If `generalize`'s free-variable
walk zonked (fully resolved) through a scheme's own bound vars instead of
stopping at them, it would expand the binding's inner variables and leak
them as false-free to a sibling — suppressing that sibling's own legitimate
generalization.

## Decision

`generalize`'s free-variable walk stops at a scheme's bound variables and
does not zonk through them. A scheme's bound vars have no identity outside
the scheme — the scheme's declared interface says its caller/instantiator
picks them — so they impose no constraint a sibling binding must respect,
and treating them as opaque at this boundary is exactly correct, not merely
a heuristic.

## Consequences

- Prevents a resolved-but-should-be-opaque scheme boundary from leaking
  quantified variables into an unrelated sibling's generalization, which
  would wrongly suppress that sibling's own polymorphism.
- Complements ADR-0040 (resolve mono-scheme bindings fully) — the two ADRs
  fix opposite failure modes of the same free-variable walk: 0040 resolves
  where a mono scheme was hiding a constraint; 0041 stops resolving at a
  polymorphic scheme's own declared boundary.

## Alternatives rejected

- **Always zonk fully regardless of scheme boundary** — reopens the
  cross-sibling leak this ADR closes.
