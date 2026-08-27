# 0081 — String literal types and finite unions

- **Status:** Accepted
- **Date:** 2026-08-27
- **Source:** [ADR 0012](0012-host-interop-end-state.md) Wave 7; `bootstrap/{ast,parser,types,schemes,infer}.mochi`; `packages/compiler/src/{ast,parser,infer}/`

## Context

ADR 0012 put string (and later number) singletons plus a finite union former in
the HM algebra so `$tone: "rose" | "amber"` is a real type, not plugin fiction.
The TypeScript seed already inferred `"click"` as `tLit` and unified lit ∈ union.
The surface language could not write those types: `TypeExpr` had no lit/union
nodes, the parser's type atom was identifiers only, and bootstrap infer still
lowered `EStr` to `string`. ReScript keeps `@string` as *codegen* on polyvars;
Mochi already chose core formers (ADR 0012) and a TypeScript-shaped spelling.

`|` already starts variant constructors in `type Name = | Ctor`. A TypeExpr
union in an annotation or synonym body does not collide: variants begin with an
Uppercase id or a leading bar, never `"…"` / `(` / `[`.

## Decision

1. **Surface.** `"rose"` is a `TypeExpr` atom. `"rose" | "amber"` is a finite
   union. Union binds tighter than `->`. `type Tone = "rose" | "amber"` is a
   transparent TypeExpr synonym (same expansion/folding as a record alias).
2. **Inference.** `EStr` / `PStr` are `tLit`. Bare singletons widen to `string`
   at generalization (TS `let`). An annotation pins the written type, so
   `let x : Tone = "rose"` stays `Tone`. Lit ∈ union; lit widens to `string`;
   general `string` does *not* unify with a literal union.
3. **Bootstrap first.** Surface TypeExpr uses `TyLit` / `TyUnion`; HM uses
   `TySingleton` / `TyOneOf` (same name split as `TyArrow` vs `TyFn`). The
   TypeScript seed is the parity oracle.

Number literals in type position stay reserved (ADR 0012).

## Consequences

- `extern` / annotations / JSX `$tone` can name the same union the `.d.ts`
  already printed.
- `type Shape = Circle | Rect` is unchanged.
- Exhaustiveness of string-union `switch` is not claimed here.

## Alternatives rejected

**Polyvars (`#rose`) as the only literal-union form.** ReScript's model; it
fights the TS-shaped host seam ADR 0012 chose.

**Union looser than arrow.** `"a" | "b" -> T` would mean `"a" | ("b" -> T)`.
The TS reading people write needs union tighter than arrow; mixed unions of
arrows use parentheses.
