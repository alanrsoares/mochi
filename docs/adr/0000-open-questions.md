# 0000 — Open questions (not yet decided)

- **Status:** Open — do NOT cite any of these as settled.
- **Source:** `docs/CRITIQUE.md`; `docs/PATH_TO_BOOTSTRAP.md`; `docs/effects.md`

A register of live design questions with no decision yet. When one is resolved, it
graduates to its own numbered, **Accepted** ADR and is struck from this list.

## 1. Abstraction mechanism over types

The central open question. Typeclasses vs. ML modules/functors vs. staying
monomorphic-with-`extern`. Structural eq/compare ([0007](0007-structural-eq-compare.md))
is a tactical answer for equality/ordering only — the general question is open. Decide
before adding much more prelude surface. Source: `docs/CRITIQUE.md` §2.4; `docs/PATH_TO_BOOTSTRAP.md` §5.

A bounded experiment is proposed in [0018](0018-type-abstraction-traits.md): a single
toy trait, monomorphic call sites only, no surface syntax, measuring whether a
constraint solver stays principal/legible before any full trait system is designed.
Still Proposed, not Accepted — this question stays open until the experiment reports.

## 2. `map` vs `Array.map` — namespace redundancy

Bare prelude names vs. per-collection namespaces overlap. A symptom of #1; alternatives
(document the redundancy, bare-name-as-sugar, structural dispatch) are listed but
unresolved. Source: `docs/CRITIQUE.md` §2.2.

## 3. Local / block-bodied bindings

alang has only top-level `let`. Local bindings (ML `let … in` vs. a block form) are "the
wall" (~80% of the distance) to self-hosting — well-articulated, not yet decided.
Source: `docs/PATH_TO_BOOTSTRAP.md` §2.1.

## 4. Monadic `do`/`use` sequencing sugar

Ergonomics for chaining `Task`/`Result`. Orthogonal to effects-by-convention
([0004](0004-effects-by-convention.md)); not yet scoped. Source: `docs/CRITIQUE.md` §4.3; `docs/effects.md`.

## 5. Effect rows as a future migration path

`docs/effects.md` sketches a *path* to typed effect rows should the convention prove
insufficient. It is a contingency note, not a chosen direction.
