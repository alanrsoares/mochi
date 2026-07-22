# Architectural Decision Records

Each ADR records one decision: the context, what was chosen, the consequences, and the
alternatives rejected — with a source (commit + doc) so the reasoning is traceable.

Keep them short (a screen or less). Status is one of **Proposed**, **Accepted**,
**Superseded by NNNN**. Number sequentially. Don't rewrite history — supersede.

## Template

```markdown
# NNNN — Title

- **Status:** Accepted
- **Source:** <commit hash>, <file/section>

## Context
Why a decision was needed.

## Decision
What we chose.

## Consequences
What follows — good and bad.

## Alternatives rejected
What else was on the table and why not.
```

## Index

| # | Decision | Status |
|---|---|---|
| [0000](0000-open-questions.md) | Open questions (not yet decided) | Open |
| [0001](0001-result-threading-over-exceptions.md) | Result-threading over exceptions | Accepted |
| [0002](0002-exhaustiveness-via-pattern-matching.md) | Exhaustiveness via ts-pattern (internal) + @onrails/pattern (emitted) | Accepted |
| [0003](0003-curried-surface-uncurried-codegen.md) | Curried surface types, uncurried codegen via `_curry` | Accepted |
| [0004](0004-effects-by-convention.md) | Effects tracked by convention, not by the type system | Accepted |
| [0005](0005-transparent-record-aliases.md) | Transparent (structural) record-type aliases | Accepted |
| [0006](0006-one-numeric-type.md) | One numeric type; `int`/`float` are aliases | Accepted |
| [0007](0007-structural-eq-compare.md) | Structural `eq`/`compare`, not typeclasses | Accepted |
| [0008](0008-drop-set-dollar-sigil.md) | Drop the `${…}` Set literal | Accepted |
| [0009](0009-let-in-local-bindings.md) | Local `let … in` bindings (non-recursive, let-polymorphic) | Accepted |
| [0010](0010-tuples.md) | Tuples via a reserved `con("tuple", …)`; erase to JS arrays | Accepted |
| [0011](0011-tuple-binding-sugar.md) | Tuple lambda param + `let (a, b) = … in` (desugar) | Accepted |
| [0012](0012-nested-patterns.md) | Nested patterns: guard-form emission + conservative exhaustiveness | Accepted |
| [0013](0013-pattern-guards.md) | Pattern guards: `when` clause, guard-form codegen, no coverage credit | Accepted |
| [0014](0014-recursion-via-proper-tail-calls.md) | Recursion depth via proper tail calls (strict-mode JSC); `_curry` tail path | Accepted |
| [0015](0015-ctor-fields-carry-type-expressions.md) | Constructor fields carry full type expressions (`[Expr]`, `Option a`, tuples, arrows) | Accepted |
| [0016](0016-ternary-expressions.md) | Ternary expressions: `cond ? then : else`, looser than `\|>`, right-assoc | Accepted |
| [0017](0017-let-bind.md) | `let? param = value in body` — monadic bind, Result only, first-class node | Accepted |
| [0018](0018-type-abstraction-traits.md) | Trait constraint prototype (narrowed scope, not a full trait system) | Proposed |
| [0026](0026-typescript-backend.md) | TypeScript backend — emit strict-`tsc`-clean typed `.ts` | Accepted |
| [0027](0027-dogfood-al-formatter.md) | Dogfood the `.al` formatter on `bootstrap/` as a QA gate | Accepted |
| [0028](0028-typed-lambda-params.md) | Typed lambda parameters via the per-node inference table | Accepted |
| [0029](0029-cross-module-type-imports.md) | Cross-module `import type` + extern `.d.ts` (TS backend, gap 3) | Accepted |
| [0031](0031-guard-form-type-predicates.md) | Guard-form arms as type predicates (TS backend, gap 2) | Accepted |


## Backlog (well-evidenced, not yet written)

Row-polymorphic record unification · spans-on-every-node (tooling-first) · mutual
recursion via Tarjan SCC · lazy-List pattern parity · arity-mismatch diagnostics ·
symbol-led hover + doc comments · the `///` doc-comment delimiter.
