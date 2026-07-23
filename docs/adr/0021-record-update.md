# 0021 — Record update `{ ...base, f: v }`

- **Status:** Accepted
- **Source:** `docs/CRITIQUE.md` (ergonomics); bootstrap dogfooding (`bootstrap/infer.al`,
  `bootstrap/check.al` thread immutable state by hand); `src/infer.ts` record
  case; `test/record-update.spec.ts`

## Context

mochi records are immutable, and the only way to produce a near-copy of a record
was to spell out every field. Porting the compiler to mochi made this acute:
`infer.al`/`check.al` thread immutable state (`St`, `TSt`, registries) where all
but one or two fields are copied verbatim on each step. A functional-update form
is the standard ergonomic answer (ReScript `{...r, x: 1}`), and mochi's existing
row-polymorphic records already carry the machinery to type it soundly.

## Decision

Add a **record update** expression: `{ ...base, f: v, … }`.

- **Syntax.** One `...base` spread, at the front only; any fields after it need
  a comma. Reuses the existing `spread` token — no lexer change. `{` is a record,
  `#{` a Map, so there is no ambiguity. Represented as an optional `spread?: Expr`
  on the existing `record` AST node (a literal is just an update with no base),
  so every existing record path is unaffected.
- **Type rule — update-only.** infer the base; each listed field must already
  exist on the base at a **unifiable** type (the update value is unified against
  the field's existing type); the **result type is the base's type**. This falls
  straight out of row unification:
  - a **closed** base rejects both a wrong-typed value (`{...r, x: "s"}` when
    `r.x : number`) and a field absent from the base (`{...r, z: 1}`);
  - an **open** base (e.g. a lambda parameter) has the field *required* on its
    inferred row and duck-types as usual.
  Fields are replaced in-kind, never added and never retyped.
- **Codegen.** Native JS object spread: `{ ...base, f: v }`. Matches the
  immutable-data convention (a fresh object each update).

## Consequences

- Immutable state-threading in the largest mochi program (the self-hosted
  compiler) and in user code loses its field-by-field boilerplate.
- Result type = base type keeps updates principal and predictable; the "with"
  mental model holds — you get the same shape back.
- No `.d.ts` change: an update's type is a plain record row, rendered as today.

## Scope-outs

- **No nested-path sugar** (`{...r, a.b: 1}`) — compose:
  `{ ...r, a: { ...r.a, b: 1 } }`.
- **No type-changing / field-adding update** — would need a row-override in
  unification and a result type that diverges from the base; rejected as less
  principal and off the ReScript lineage.
- **No multiple or non-leading spreads.**
- **No spread in destructuring patterns** — a separate feature, not part of this.
- `bootstrap/parser.al` is **not** yet taught this form; the bootstrap corpus
  doesn't use it, so the differential suites and the fixpoint stay green without
  a port. Porting is future work, gated on the self-hoster needing the syntax.

## Alternatives rejected

- **Allow type-changing / extending updates** — more JS-permissive but needs a
  row-override mechanism (not plain unification) and breaks "result type = base
  type". Rejected.
- **A distinct `recordUpdate` AST node** — forces `.exhaustive()` churn across
  every Expr walker for no gain; an optional `spread?` on `record` is lighter and
  models the literal as the base-less case.
