# 0010 — Tuples (anonymous heterogeneous products)

- **Status:** Accepted
- **Source:** `docs/bootstrap.md` (blocker #2)

## Context

Recursive-descent parsing — the bootstrap target — lives on `(node, rest)`
pairs. A record `{ node, rest }` works but costs a named type and verbose
construction on every combinator. An anonymous product is the natural shape. It
also unblocks `zip`. Blocker #2 on the bootstrap path.

## Decision

Add tuples as a surface form over the existing type machinery, rather than a new
`Type` variant.

- **Type representation: a reserved constructor.** A tuple is `con("tuple",
  elems)` — the name `"tuple"` is lowercase, so it is unspeakable as a user type
  (user types are always Uppercase). Arity is the arg count, so `(a, b)` and
  `(a, b, c)` are distinct types that never unify — all for free through the
  existing con paths (unify, occurs, zonk, instantiate, generalize, foldAliases,
  typeEq). The **only** type-side additions are display (`showType` → `(a, b)`,
  `dts` → TS tuple `[A, B]`).
- **Surface syntax.** Literal `(a, b)`, pattern `(x, y)`, type `(a, b)` — all
  arity ≥ 2. A lone `(e)` / `(p)` / `(t)` stays grouping. Disambiguated from a
  lambda param list by the existing `looksLikeLambda` lookahead (no trailing
  `=>` ⇒ not a lambda ⇒ tuple).
- **Codegen: erase to a JS array.** `(a, b)` → `[a, b]` (like ReScript). The
  type system keeps tuples distinct from `mochi` Arrays; the runtime shares the
  shape, so structural `eq`/`compare` work unchanged. A tuple `switch` arm
  lowers like a fixed-length array arm: catch-all → destructure, a literal
  position → an index guard.

## Consequences

- Pairs are first-class with no named type. `zip` is now expressible.
- Tuples and Arrays are the same thing at runtime — a deliberate ReScript-style
  trade. Type safety comes entirely from the checker.
- **Destructuring is `switch`-only for now.** No `let (a, b) = e` and no
  `((a, b)) => …` lambda param yet (would need index-access lowering or a new
  `LamParam` shape). `switch p { | (a, b) => … }` is the current idiom —
  functional but verbose for parser code. Binding ergonomics are the natural
  next increment (see `docs/bootstrap.md`).
- Nested constructor sub-patterns inside a tuple pattern are treated as holes
  (bind / wildcard / literal only) — the same limitation array patterns already
  carry.

## Alternatives rejected

- **A dedicated `Type` variant `{ kind: "tuple"; elems }`** — would touch every
  type walker (unify, occurs, zonk, instantiate, collect, foldAliases). The
  reserved-con encoding reuses all of them; the name being unspeakable removes
  the only collision risk.
- **Records with `_0`/`_1` fields** — leaks positional keys into hover and
  `.d.ts`, and row-polymorphism would wrongly let a 2-tuple unify with a 3-tuple
  prefix. Rejected.
- **`let (a, b) = e` in this slice** — real ergonomic win but needs index-access
  lowering; deferred so the core lands small and verified.
