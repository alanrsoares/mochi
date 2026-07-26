# 0021 — Record update via leading spread

- **Status:** Accepted
- **Source:** `src/ast.ts` (`{ kind: "record"; spread?: Expr }`), `src/parser.ts` (`parseRecord`), `bootstrap/parser.mochi`, `test/record-update.spec.ts`

## Context

Records are immutable; "change a few fields, keep the rest" needs syntax that
doesn't require re-listing every field. A `{ ...base, x: 1 }` spread reads
naturally as "update", but only if its type behaves like an update — not an
open-ended merge that could add fields a consumer doesn't expect.

## Decision

A record literal may carry one leading `...base` spread (`{ ...base, x: 1 }`);
a stray, trailing, or second `...` is a parse error. Semantically this is a
functional **update**, not a merge: `base` must already carry every listed
field at a unifiable type, and the result has `base`'s own record type —
fields are replaced in-kind, never added.

## Consequences

- No "structural extension" escape hatch via spread — keeps record row types
  closed under update the same way HM row polymorphism expects.
- Parser enforces spread-must-be-first/only via `parseRecord`; mirrored in
  `bootstrap/parser.mochi` for self-hosting parity.

## Alternatives rejected

- **Merge semantics (spread can add new fields)** — would make record types
  unpredictable at the call site and complicate row unification.
