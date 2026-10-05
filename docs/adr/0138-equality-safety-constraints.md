# 0138 — Static safety for structural equality and ordering

- **Status:** Accepted (stage 1 shipped; scheme obligations pending)
- **Date:** 2026-10-02
- **Source:** `.scratch/issues-syntax-and-codegen-traps.md`, `packages/compiler/src/prelude/runtime.ts` (`eq`, `compare`), ADR 0084
- **Would amend:** ADR 0084's lazy-List exception policy; stage 1 (resolved types only) ships; the scheme obligations are still a proposal and change no behavior yet.

## Context

`eq : a -> a -> bool` accepts records containing lazy Lists, then throws if its
structural walk reaches distinct List values. Following ADR 0145, `compare`
also reaches Lists through records and variants, as well as arrays, Map keys/values
and Set elements. Equality and ordering still need different eligibility rules
because collection keys have different traversal semantics. Identity shortcuts and earlier mismatches can avoid the
exception. An apparently harmless change from Array to List can therefore break
a generic consumer at runtime.

## Proposed decision

Prefer static eligibility constraints to implicitly evaluating lazy sequences.
Carry equality/ordering obligations through generalized schemes, instantiation,
unification and module exports. A resolved List anywhere the runtime walks is
ineligible. An unresolved variable or open row retains an obligation; it must not
be silently assumed safe. Equality remains structural and dictionary-free.

Functions retain reference equality. Map/Set keys retain host identity; Map
values and Array/tuple/record/variant contents are traversed. Ordering needs its
own eligibility rules matching `compare`, rather than borrowing equality's rules.
Recursive variants require a visited-type traversal. Opaque FFI types need an
explicit trust policy: the compiler cannot inspect hidden iterable contents.

## Implementation gates

1. Specify constraints on schemes and rows, FFI trust, and outbound `.d.ts`:
   ordinary TS generics cannot express this obligation automatically.
2. Prototype inference with direct/nested Lists, recursive variants, open rows,
   partial application, generic wrappers and cross-module imports. Diagnose at
   the comparison or the application that resolves an obligation to List.
3. Add language guards and ADR 0105 conformance cases; refresh the seed and pass
   fixpoint, strict self-TS and the full gate before accepting this proposal.

Until those gates pass, ADR 0084 remains in force. Convert a known finite List
with `List.toArray` before comparison; convert nested fields explicitly or
compare a safe projection. This proposal does not promise totality for cyclic or
host-supplied values.

## Alternatives rejected for this proposal

- **Only reject direct List arguments:** misses nested and generalized cases.
- **Automatically pull Lists:** may consume iterators, execute effects or never
  terminate. Finite sequence comparison should be an explicit operation.
- **Compare distinct Lists by identity:** removes the exception by changing the
  meaning of structural equality inside otherwise ordinary records.

## Gate 1 — constraint specification

- **Representation.** An obligation is a flag on a quantified variable in a scheme (`Eq`, later `Ord`), not a dictionary: runtime stays structural and dictionary-free. Instantiation copies the flag onto the fresh variable; unifying a flagged variable with a type re-runs the eligibility walk on that type; unifying two variables merges flags. Rows carry the flag on their tail variable.
- **Walk.** Mirrors the runtime: arrays, tuples, record fields, variant payloads and `Map` values are walked; `Map` keys and `Set` elements keep host identity and are not; functions compare by reference. A `List` reached by the walk is ineligible. Recursive variants use a visited set keyed by type name.
- **`.d.ts`.** TypeScript generics cannot express the obligation, so emitted declarations stay unconstrained and the check is Mochi-side only. A doc line `@requires Eq <T>` is emitted on affected exports so TS consumers see the contract.
- **FFI.** Opaque `extern` types are trusted eligible by default (the compiler cannot see hidden iterables); declaring an `extern type` as an iterable host collection is the explicit opt-out.

## Stage 1 — shipped

`==` and `compare` reject a resolved type that reaches a `List` by the walk above, at the call. Still-open variables and rows are assumed eligible, and variant payloads are not yet inspected. Guard: ADR 0105 case `eq-lazy-list`. Stage 2 (scheme obligations, exports, `.d.ts` doc line, variants) is the remaining work on #164.

Stage 1 refinements: the gate skips a name bound locally anywhere in the module (a conservative stand-in for real binding identity; the runtime guard still covers it), and `compare` also walks `Map` keys and `Set` elements, since it sorts them structurally, while `==` keeps them on host identity.
