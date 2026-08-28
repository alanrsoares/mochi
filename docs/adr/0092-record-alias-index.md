# 0092 — the TS backend re-attaches record alias names at the print boundary

- **Status:** Accepted
- **Date:** 2026-08-28
- **Source:** `bootstrap/ts-types.mochi` (`rowShapeKey`, `tsRow`), `bootstrap/codegen-ts.mochi` (`recordAliasIndex`), `bootstrap/ts-types.spec.mochi`, `bootstrap/codegen-ts.spec.mochi`
- **Refines:** [0026](0026-codegen-ts-strict-clean-backend.md) / [0090](0090-bootstrap-chain.md) (the TS backend), [0046](0046-qualified-type-names.md) (how a dep's alias is keyed)

## Context

A record alias is **structural** — the rule `schemes.mochi` cites as ADR 0005
at `aliasRow`, though no ADR file carries that number for it. `typeExprToType`
expands
`type Span = { start: number, end: number }` into a row at lowering, via
`aliasRow`. By the time a `Ty` reaches `tsOf`, the name is gone — a row has no
name to carry. Variants do not suffer this, because they lower to `TyCon(name,
args)` and `tsOfRaw` prints a `con` nominally.

So the TS backend re-printed one record type at every site that mentioned it.
In the stage-1 emit of `bootstrap/infer.mochi`:

| shape | occurrences | declared as |
|---|---|---|
| `{ start: number; end: number }` | 896 | `Span` (`ast.mochi`) |
| `{ ty: Ty; rvars: number[]; vars: number[] }` (+ reordered) | 254 | — |
| `{ name: string; fieldType: TypeExpr }` | 68 | `QualAliasField` |
| `{ message: string; start: B; end: A }` | 55 | `IErr` |

`export type QualScope` printed `QualAliasInfo`'s body inline three lines below
its own `export type QualAliasInfo` declaration. Correct, and structurally
identical to what a reader wants, but it is what drives the emitted line count:
these types nest, and each level of expansion pushes the next past the print
width, so the cost lands in wrapping rather than in bytes.

## Decision

Keep expansion exactly where it is — the structural rule is a *typing* rule and stays
untouched — and re-attach the name at the **print boundary only**.

`ts-types.mochi` threads a `recs` index (canonical row shape → alias name)
through every renderer. `tsRow` consults it before expanding:

- **Closed rows only.** An open `{ … } & R` is a row the alias merely prefixes,
  not the alias, so it keeps its structure.
- **The key is sorted by label.** A row carries its fields in the order `unify`
  extended it, so the same record type arrives as both `{ ty; rvars; vars }` and
  `{ vars; rvars; ty }`. Both must key alike.
- **The key is rendered index-free.** Building the index and looking a row up in
  it therefore cannot disagree about a nested field's spelling.
- **Nullary aliases only.** A parameterised alias would have to match a row up
  to substitution.

`codegen-ts.mochi` builds the index from the merged alias map rather than the
module's own `SType`s, so a dep's alias counts too. A dep reached through
`import * as Ast` seeds only the qualified key `"Ast.Span"`, so the index is
keyed under the last segment: a type crosses a module edge under its bare name,
which is what the dep's own header declares and what `groupByOwner` matches. No
new import plumbing is needed — `crossModuleTypeImports` derives `import type`
lines from the emitted **text**, so naming a type is exactly what makes its
import appear.

An alias's own declaration renders against the index with its own entry removed,
or it would come out as `export type Span = Span;`.

This is behaviour-preserving: TS object types are structural too, so `Span` and
`{ start: number; end: number }` are the same type to `tsc`.

## Consequences

- Stage-1 emit of the `bootstrap/` graph: **845,700 → 791,233 bytes (−6.4%)**;
  `infer` −13.3%, `parser` −13.9%.
- `scripts/bootstrap-self-tsc.ts` holds at its pre-change count (57), and
  `bun run bootstrap:tsc` holds at 0 — the rename is invisible to `tsc`.
- Rendering with `#{}` is unchanged behaviour, and the empty-index
  short-circuit in `aliasNameFor` keeps the key off that path entirely. The
  extern `.d.mts` sidecar renders with `#{}` deliberately: it is its own module
  and carries no alias declarations.
- **The oracle reaches the same goal by a different route, and keeps it.**
  `foldAliases` (`packages/compiler/src/ast/types.ts`) rewrites a matching
  closed row back to `con(Name, …)`, which the printers already render
  nominally. It also handles parameterised aliases, which the index declines.
  It was already wired into the value paths; the two gaps closed here are:

  1. its alias list was the module's OWN aliases, so a dep's `Span` never
     folded. `module.ts` now threads a graph-wide, deps-first list into
     `emitTsModule` — **for emission only**. Inference keeps its local list, so
     diagnostics still name types the way the reporting module can see them.
  2. the type-header path (`typeDecl` / `aliasTsDecl`) did not fold at all, so
     a declaration re-printed its neighbour's body inline. `fieldTs` now folds,
     with the declaration's own entry removed.

  Repeated names across modules matter here: `emitTsModule`'s `aliasByName` must
  keep the FIRST of a name (locals lead the list), or a dep's same-named alias
  displaces the declaration the module is actually emitting — which is a real
  `tsc` error, not a cosmetic one, and is what the graph has in `QualScope`.

- Frozen seed (`bootstrap/seed/`, both sides measured at `79c0cf8`):
  **33,372 → 33,162 lines**. That net is two opposing effects:

  | | lines |
  |---|---|
  | folding, across files whose sources are untouched (`infer` −809, `module` −305, `parser` −130, `ctors` −46, `codegen` −29, `check` −27, …) | **−1,371** |
  | the self-host's own new code (`codegen-ts` +884, `ts-types` +273) | **+1,161** |

  The growth is not the index itself but the `recs` PARAMETER: `curriedOverloads`
  emits one signature per composition of a function's arity (ADR 0037), so
  widening ~20 functions by one argument roughly doubles their overload blocks.
  Folding `recs` into the existing `names` argument as one record would carry the
  index at unchanged arity, and is the obvious follow-up.
