# 0106 — pin scheme variables that one record alias explains

- **Status:** Accepted
- **Date:** 2026-09-23
- **Source:** `bootstrap/ts-types.mochi` (`schemeRender`), `bootstrap/codegen-ts.mochi` (`bindingTsType`, `genericLambdaParams`)
- **Refines:** [0092](0092-record-alias-index.md)

## Context

ADR 0092 re-attaches a record alias at the print boundary by an exact row-shape
key. Inference does not keep the name, so a use that never looks at every
field generalizes the unread ones. `LocTok`'s `doc: Option<string>` is then
printed `doc: Option<A>`, the key misses, and every use repeats the row.

Folding one row in isolation is not safe. `jxSpanOf`'s parameter is an open
row and its result is the closed span of those same variables. Naming only the
result `Span` leaves the parameter generic, and the body that copies the fields
is then not assignable.

## Decision

Before rendering a scheme, walk its closed rows. When exactly one in-scope
nullary alias matches a row by binding scheme letters (`A`, `T26`) to that
alias's concrete field types, pin those variables to that text for the whole
scheme. The existing exact key then hits.

- The same pin applies everywhere the variable occurs, including open rows,
  which themselves never match an alias.
- Two aliases, or two concrete types for one variable, pin nothing.
- Pinned letters leave the generic head. A head that becomes empty renders as
  the concrete curry type (ADR 0093). A non-function binding still prints
  unpinned variables as `unknown`. Nested annotations in that binding use the
  same pin, so a cast does not mention a letter the head dropped.
- Parameterised aliases stay out of the index. A bare name declared in two
  modules (`LocTok` and `LocTok<t>`) is printed only by the module whose own
  alias is the nullary record. The import table has one owner for that name,
  and it may be the parameterised declaration.

This can make a TS signature narrower than the HM scheme when a polymorphic
row coincides with one alias. That is the fold. `tsc --strict` on the emit is
what checks the body still assigns.
