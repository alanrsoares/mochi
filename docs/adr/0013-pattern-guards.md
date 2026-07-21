# 0013 — Pattern guards: `| pattern when expr => body`

- **Status:** Accepted
- **Source:** `docs/PATH_TO_BOOTSTRAP.md` §2.4; pre-bootstrap ergonomics review

## Context

The `check`/`infer` bootstrap ports are full of "match this shape AND this
predicate" dispatch (`| Leaf(n) if n < 0`, cursor arms keyed on char classes).
Without guards each such arm becomes a nested `switch bool` inside the body —
noise that compounds across a compiler-sized program. ADR 0012's pattern
compiler made guards nearly free: nested arms already lower to a predicate form
(`.with((_v) => conds, (slot) => body)`), so a guard is one more `&&`-clause,
and the conservative-coverage rule ("a narrowing arm doesn't count") already
expresses "this arm can decline".

## Decision

- **Surface:** `| pattern when expr => body`. `when` is a contextual keyword
  (like `in`): a pattern never continues with a bare identifier, so no
  reservation — `when` remains a valid binding name (`| when => when`).
- **Typing:** the guard is inferred with the pattern's binds in scope and must
  unify with `bool`.
- **Exhaustiveness:** a guarded arm **never** counts toward coverage — not as a
  catch-all, not as ctor/bool/list coverage — because the guard can be false.
  Same conservative stance as ADR 0012; a `C(_)`/`_` companion arm is required.
- **Codegen:** a guarded arm always takes the guard form. Structural tests run
  first, then the guard, rebinding the pattern's names from `_v` via the same
  destructuring slot the handler uses — `conds && ((slot) => guard)(_v)`:
  `.with((_v) => _v._tag === "Some" && (({ value: x }) => gt(x)(0))(_v), …)`.
  `&&`-short-circuit means the guard only runs on values that structurally
  matched.
- **Lazy-List switches reject guards.** `genListMatch`'s pull/buffer discipline
  has no guard slot, and a guarded arm still pulls elements to test its
  pattern; reject in check ("`when` guards are unsupported in a lazy-List
  switch") rather than miscompile. Eager `[x, ...xs]` arms take guards fine.
- **Unreachable arms are now errors:** any arm below an unguarded catch-all is
  rejected. Previously codegen silently hoisted such arms above the
  `.otherwise` (a pre-existing hazard); with guards in the mix that reordering
  would visibly change results, so the pattern-order lie is closed for all
  arms, guarded or not.

## Consequences

- `| Some(x) when gt(x)(0) => …` works at any pattern depth, on tuples,
  records, arrays; guards chain in source order (`test/guards.spec.ts`).
- Programs relying on dead arms after a `_` now fail check — previously those
  arms silently shadowed the catch-all at runtime, so no correct code regresses.
- The bootstrap's per-arm predicate dispatch drops a layer of nesting.

## Alternatives rejected

- **`if` as the guard keyword** (Rust/OCaml): `if` isn't in the expression
  grammar today; introducing it only as an arm infix invites confusion with a
  future conditional expression. `when` (F#/Elixir) is unambiguous.
- **Guards counting toward exhaustiveness when provably total** (`when true`):
  requires deciding predicate totality — same slope as Maranget matrices,
  deferred with it.
- **Allowing guards in lazy-List switches**: needs a guard-aware pull protocol
  (re-buffering between failed guarded arms); defer until a real consumer asks.
