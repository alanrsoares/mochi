# 0022 — Or-patterns `| A | B => body`

- **Status:** Accepted
- **Source:** `docs/CRITIQUE.md` (ergonomics); pattern-matching dogfooding
  (variant dispatch where several constructors share a body); `src/infer.ts`
  pattern inference; `test/or-pattern.spec.ts`

## Context

A `switch` arm matched exactly one pattern, so dispatching several constructors
or literals to the same body meant repeating the body per arm
(`| Red => c | Green => c | Blue => c`). Or-patterns — one arm, several
alternatives — are the standard fix (OCaml/Rust `A | B`), and mochi's guard-form
codegen and row/HM inference already have the machinery to type and lower them.

## Decision

Add an **or-pattern**: an arm may list alternatives, `| A | B | … => body`.

- **Syntax.** Parsed at the arm level: `arm = "|" pat ("|" pat)* ("when" g)? "=>"
  body`. Reuses the existing `bar` token — no lexer change. Each alternative
  stops at `=>`, so the next arm's leading `|` is never over-consumed. Represented
  as a new `por` pattern node holding `alts: Pattern[]`, produced only at the arm
  top level (≥2 alts) — so a `por` never nests inside another pattern.
- **Binding — consistent binds.** Every alternative must bind the **same names at
  the same structural position** (`check.ts`'s `binderPaths` compares a private
  path per binder); their types then unify in `infer.ts` (all alts describe one
  scrutinee, so their types unify too). The arm's binder env is the first alt's,
  refined by those unifications. This makes `| Add(l, r) | Sub(l, r) => …` bind
  `l`/`r` once for one shared body.
- **Exhaustiveness.** Each alternative contributes to coverage, sharing the arm's
  guard: `| Red | Green | Blue => …` covers all three constructors and
  `| true | false => …` is total — flattened to leaves in `checkMatch`.
- **Codegen.** A `por` arm always takes the guard form: `patConds` is the `||` of
  the alternatives (each alt's own conditions `&&`-joined first); `patSlot` is the
  first alternative's slot (position-equality guarantees it serves every alt).

## Consequences

- Variant dispatch loses its per-constructor body repetition; the self-hosted
  compiler's many `switch`es over token/AST kinds can collapse shared cases.
- Result binder env = first alt's (unified) keeps the arm body principal — it
  sees exactly the names every alt guarantees, at one type each.

## Scope-outs

- **No nested or-patterns** (`Some(1 | 2)`) — `por` is produced only at the arm
  top level. Compose with separate arms.
- **No catch-all alternative** (`| "a" | _ => …`) — an alt that always matches
  makes the arm non-narrowing; rejected with a rename-free hint.
- **No array/list alternative** — eager/lazy sequence arms need the length /
  `genListMatch` machinery the guard form can't host as an alt; rejected.
- **Labelled-ctor args with differing labels across alts** are rejected by the
  same-position rule (no single destructure serves them). Positional ctors — the
  common case — are fine.
- `bootstrap/parser.mochi` is **not** yet taught this form; the bootstrap corpus
  doesn't use it, so the differential suites and the fixpoint stay green without
  a port. Porting is future work, gated on the self-hoster needing the syntax.

## Alternatives rejected

- **No-bind MVP** (alternatives may not bind) — simpler (drops `binderPaths` and
  the cross-alt binder unification) but caps or-patterns at enums/literals; the
  binding case (`Add(l, r) | Sub(l, r)`) is the one dogfooding wants most.
  Rejected.
- **A `pats: Pattern[]` on `MatchArm`** instead of a `por` node — spreads the
  concept across every arm consumer and can't express the (deliberately barred)
  nested case uniformly; a `por` pattern node is the smaller, more regular change.
