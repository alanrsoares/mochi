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

## Backlog (well-evidenced, not yet written)

Row-polymorphic record unification · spans-on-every-node (tooling-first) · mutual
recursion via Tarjan SCC · lazy-List pattern parity · arity-mismatch diagnostics ·
symbol-led hover + doc comments · the `///` doc-comment delimiter.
