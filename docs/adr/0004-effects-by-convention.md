# 0004 — Effects tracked by convention, not by the type system

- **Status:** Accepted
- **Source:** `docs/effects.md`; `docs/CRITIQUE.md` §4.3; commit `418dd5d`

## Context

alang's HM core is pure-by-omission. The question was whether to make effects visible in
types (an effect row, an enforced `IO`/`Task`) or keep them a discipline.

## Decision

Do not track effects in the type system. Effects live at the `extern` (FFI) boundary: an
effectful extern *should* be typed to return `Task a`, and pure code stays pure. This is
a convention, enforced by review — not by the checker.

## Consequences

- Signatures stay small; no effect annotation doubles every type.
- The guarantee is unenforceable mechanically: the compiler cannot inspect a JS export's
  body, so a mistyped `extern` can lie. Accepted cost.
- `CONTEXT.md` states plainly that alang has no effect system, so nobody expects one.

## Alternatives rejected

- Effect rows (Koka-style `a ->{io} b`) — the row engine already exists, but this doubles
  the cognitive surface of every signature for a language that isn't sold on it.
- A mechanical FFI lint — not decidable from the alang side of the boundary.

## Related (not decided)

Monadic `do`/`use` sequencing sugar over `Task`/`Result` — orthogonal ergonomics, still
open (see [0000](0000-open-questions.md)).
