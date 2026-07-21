# 0018 — Trait constraint prototype (narrowed scope)

- **Status:** Proposed (experiment, not a commitment to a full trait system)
- **Source:** `docs/CRITIQUE.md` §2.1, §2.4; `docs/adr/0000-open-questions.md` #1;
  `docs/adr/0007-structural-eq-compare.md`

## Context

`alang` has no general mechanism to abstract over types. `map`/`filter`/`fold`
stay monomorphic per collection (`Array.map`, `List.map`, …) — open question
#2. `eq`/`compare`/`show` got a tactical, non-typeclass answer (runtime
structural walk, [0007](0007-structural-eq-compare.md)); the general question
stays open ([0000](0000-open-questions.md) #1).

An earlier draft of this ADR proposed a full `trait`/`impl` surface with a
$\mathcal{W}+\mathcal{C}$ constraint solver and "zero-cost" codegen
specialization for any trait, any call site. Review surfaced four problems
with going straight there:

1. **Runs against the language's own design lineage.** The stated north star
   for alang design calls is ReScript/Reason taste — and that lineage's
   answer to typeclasses is *no typeclasses*, deliberately. A full trait
   system is a real divergence, not a natural extension; it needs to be
   chosen with eyes open, not backed into via one ADR.
2. **Skips the experiment CRITIQUE itself asks for.** §2.4's recommendation
   is to prototype the *smallest* constraint system first and check whether
   inference stays principal and errors stay legible — before committing to
   surface syntax. The full draft did the opposite: syntax + general solver
   + general codegen, no prototype, no data.
3. **"Zero-cost" only covers the easy case.** Dispatch on a trait method
   called on a statically-known concrete type (`map` on an `Array`) is cheap.
   A function generic over a trait-constrained type parameter, called later
   at multiple concrete types, needs whole-program monomorphization
   (copy-per-instantiation, Rust/C++-style) or a dictionary-passing fallback
   — the exact JS-output clutter [0007](0007-structural-eq-compare.md)
   already rejected. That case is undesigned.
4. **Collides with an explicit bootstrap non-goal.** `docs/PATH_TO_BOOTSTRAP.md`
   §6: "Don't add guards, do-notation, or typeclasses *as bootstrap
   prerequisites*." A trait system is typeclasses under a different keyword.

## Decision

Narrow this ADR to a bounded experiment, decoupled from bootstrap:

1. **One toy trait, not a language feature yet.** Pick a single trait (e.g.
   a `Show`-shaped single-method trait) purely as a testbed for the
   constraint machinery. This does **not** touch or replace
   [0007](0007-structural-eq-compare.md)'s runtime structural `eq`/`compare`/
   `show` — those stay as-is regardless of outcome.
2. **Monomorphic call sites only.** The experiment covers calling a trait
   method where the concrete type is known at the call site (dispatch
   resolves during inference, codegen emits the concrete implementation
   directly). It explicitly does **not** attempt constraint propagation
   through a generic function body — no whole-program monomorphization, no
   dictionary fallback. If a call site's type isn't concrete, the experiment
   is out of scope for that case, not "solved with a fallback."
3. **Measure, don't ship.** Success criteria: inferred types stay principal
   (no solver-introduced ambiguity), type errors stay legible (a failed
   constraint reads as clearly as today's unify errors), and the constraint
   pass doesn't materially worsen the already-known quadratic-substitution
   hazard (`docs/PATH_TO_BOOTSTRAP.md` §3).
4. **Explicitly not a bootstrap prerequisite.** This track runs independent
   of Slice E/F; bootstrap proceeds on the existing monomorphic prelude
   regardless of this experiment's outcome.

A follow-up ADR only proposes real `trait`/`impl` surface syntax, general
codegen specialization, and (if pursued) a monomorphization or
dictionary-passing story for the polymorphic case — and only after this
experiment produces evidence one way or the other.

## Consequences

- No language surface, parser, or codegen changes ship from this ADR alone.
- Gives CRITIQUE §2.4 the missing data point: whether a constraint solver is
  affordable *before* any surface syntax is designed around it.
- Keeps [0000](0000-open-questions.md) #1 open — this experiment informs
  that decision, it doesn't resolve it.
- Namespace redundancy (open question #2, `map` vs `Array.map`) stays
  unresolved; not addressed here.

## Alternatives rejected

- **Full trait/impl system now** (this ADR's original draft) — no prototype
  data, undesigned polymorphic-dispatch case, collides with bootstrap
  non-goals. Rejected for this ADR; may return as a follow-up once the
  experiment reports.
- **Runtime dictionary passing (Haskell-style)** — clutters emitted JS;
  already rejected in [0007](0007-structural-eq-compare.md).
- **ML modules / functors** — verbose, clashes with the pipe-oriented
  surface; remains a listed alternative in [0000](0000-open-questions.md) #1.
- **Do nothing / stay monomorphic-with-`extern` indefinitely** — legitimate
  per CRITIQUE §2.4, but forecloses the abstraction question rather than
  answering it; this ADR chooses to gather evidence instead.
