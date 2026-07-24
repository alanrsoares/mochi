# Architectural Decision Records

Each ADR records one decision: the context, what was chosen, the consequences, and the
alternatives rejected — with a source (commit + file/section) so the reasoning is
traceable.

Keep them short (a screen or less). Status is one of **Proposed**, **Accepted**,
**Superseded by NNNN**. Number sequentially from `0000`. Don't rewrite history —
supersede.

> This log was reset to a clean slate. The decisions behind the current design are
> summarized in [`../compiler.md`](../compiler.md) and [`../language.md`](../language.md);
> the prior ADR history remains in git.

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

| ADR | Title | Status |
|---|---|---|
| [0000](0000-operator-sections.md) | Operator sections | Accepted |
| [0001](0001-array-spread.md) | Sequence expression spread (Array / List / Set) | Accepted |
| [0002](0002-namespace-imports.md) | Namespace imports (`import * as`) | Accepted |
| [0003](0003-rich-diagnostics.md) | Rich diagnostics in the compiler | Accepted |
| [0004](0004-multi-error-diagnostics.md) | Multi-error diagnostics (check + infer) | Accepted |
| [0005](0005-prelude-task.md) | Prelude `Task` (lazy async values) | Accepted |
