# 0138 — Static safety for structural equality and ordering

- **Status:** Proposed
- **Date:** 2026-10-02
- **Source:** `.scratch/issues-syntax-and-codegen-traps.md`, `packages/compiler/src/prelude/runtime.ts` (`eq`, `compare`), ADR 0084
- **Would amend:** ADR 0084's lazy-List exception policy; no behavior change ships with this proposal.

## Context

`eq : a -> a -> bool` accepts records containing lazy Lists, then throws if its
structural walk reaches distinct List values. `compare` reaches Lists through
arrays, Map keys/values and Set elements; ordinary records and variants instead
use its `JSON.stringify` fallback. Equality and ordering thus need different
eligibility rules. Identity shortcuts and earlier mismatches can avoid the
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
