# 0034 — Open-row record params emit as a scoped `<R>` generic

- **Status:** Accepted
- **Source:** `src/codegen-ts.ts:202`, `src/dts.ts:147,291`, `test/codegen-ts.spec.ts:133,140`

## Context

A function parameter typed as an open record row (`{ x: int | 'r }`) is
polymorphic in the rest of its fields — HM keeps `'r` as a genuine row
variable. Emitting the TS parameter type as the closed record it happens to
see at one call site would drop that row variable and reject callers passing
extra fields, or silently narrow the type.

## Decision

An open-row record parameter emits as a scoped generic `<R>` on the
function/method, with the annotated parameter type `{ x: number } & R`
(intersection with the generic), not a closed object literal type that drops
the row var. `dts.ts` mirrors the same generic in `.d.ts` emission so a
spread that threads open-row state round-trips through `& R` across module
boundaries too.

## Consequences

- Callers may pass records with extra fields through an open-row parameter,
  matching HM's row polymorphism, without a `tsc --strict` error.
- `codegen-ts.ts` and `dts.ts` must agree on when a row is "open" (has an
  unresolved row var after generalization) versus closed — divergence here
  reopens a `tsc` error class this ADR closed.

## Alternatives rejected

- **Emit the closed record type seen at first use** — rejects legal callers
  with extra fields and contradicts the source-level row-polymorphic type.
