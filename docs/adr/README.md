# Architectural Decision Records

Each ADR records one decision: the context, what was chosen, the consequences, and the
alternatives rejected — with a source (commit + file/section) so the reasoning is
traceable.

Keep them short (a screen or less). Status is one of **Proposed**, **Accepted**,
**Superseded by NNNN**. Don't rewrite history — supersede.

## Numbering rule

- ADRs are numbered **`ADR-00NN`**, monotonically increasing from `0000`, assigned once
  and **never reused or renumbered** — even a rejected/superseded ADR keeps its number.
- Plan tickets (`docs/plan/tickets/`) are a *separate* namespace, numbered **`T-00NN`**.
  The two counters are independent and their numbers collide on purpose — the `ADR-`/`T-`
  prefix is what disambiguates a citation, not the digits. Always cite the prefixed form
  (`ADR-0025`, `T-0019`), never a bare number, in source comments, docs, or commit
  messages.
- A citation to a decision that hasn't been written up yet is a bug: either it's an ADR
  that needs backfilling (write the retro record, keep the number the citation already
  uses) or it was actually a plan-ticket self-reference miscited as an ADR (fix the
  prefix, don't invent a record).

## Adding an ADR

1. Pick the next unused number after the current highest ADR below.
2. Copy the template, fill in Context / Decision / Consequences / Alternatives rejected,
   and a real **Source** (commit hash and/or file/section) so a reader can verify the
   claim against code.
3. Add a row to the index table below, in number order.
4. If the ADR is written after the fact (the decision already shipped, just undocumented
   until now), add a line: `Recorded retroactively (<date>) — implemented in <files>.`

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
| [0006](0006-task-result-async.md) | `Task` gets an error channel (`Task a e`, `ResultAsync`-aligned) | Accepted |
| [0007](0007-jsx-desugar.md) | Universal JSX/TSX syntax desugaring (`<tag />` to `h(tag, props, children)`) | Accepted |
| [0008](0008-vite-mochi-docs-app.md) | Vite Plugin & GitHub Pages Documentation Architecture | Proposed |
| [0009](0009-styled-cva-host-interop.md) | Host styled-cva interop (`$`-labels + default `extern`) | Accepted |
| [0010](0010-host-type-interop.md) | Host type interop (Mochi → TS/TSX) | Accepted |
| [0011](0011-language-plugins.md) | Language plugins (`HostExtension` → `LanguagePlugin`; JSX as builtin plugin) | Accepted |
| [0012](0012-host-interop-end-state.md) | Host interop end state (typed seam + thin sugar; ReScript-informed) | Accepted |
| [0013](0013-lsp-completion.md) | LSP completion provider (compiler-first + plugin member hook) | Accepted |
| [0014](0014-nullary-unit.md) | Nullary functions via internal `unit` | Accepted |
| [0015](0015-preact-host-adapter.md) | Preact/React host adapter (typed hooks module) | Accepted |
| [0016](0016-ternary-expression.md) | Ternary as a boolean conditional expression | Accepted |
| [0017](0017-letbind-monadic.md) | `let? param = value in body`: monadic bind on Result/Task | Accepted |
| [0020](0020-reserved-word-binding-check.md) | Reject JS-reserved-word binding names (no mangling) | Accepted |
| [0021](0021-record-update-spread.md) | Record update via leading spread | Accepted |
| [0022](0022-or-patterns.md) | Or-patterns (`p1 \| p2 => body`) with shared bindings | Accepted |
| [0023](0023-string-interpolation.md) | String interpolation (`"…${expr}…"`) | Accepted |
| [0025](0025-doc-ir-layout-engine.md) | Wadler/Prettier-style `Doc` IR and layout engine | Accepted |
| [0026](0026-codegen-ts-strict-clean-backend.md) | `codegen-ts.ts`: strict-`tsc`-clean typed TS backend | Accepted |
| [0028](0028-lsp-hover-namespace-cleanup.md) | Drop inlay hints; hover-only type surface, namespace cleanup | Accepted |
| [0031](0031-bootstrap-freeinscheme-parity.md) | `freeInScheme` parity between `src/` and `bootstrap/` | Accepted |
| [0032](0032-pipe-flattening-typed-arrow-inference.md) | Flatten `\|>` pipelines before typed-arrow inference | Accepted |
| [0034](0034-open-row-record-generic-param.md) | Open-row record params emit as a scoped `<R>` generic | Accepted |
| [0035](0035-empty-collection-seed-typing.md) | Type empty collection literals from their inferred element type | Accepted |
| [0036](0036-tuple-literal-helper.md) | Emit tuple literals via a `_tuple(a, b)` runtime helper | Accepted |
| [0037](0037-curried-function-partial-application-overloads.md) | Partial-application overloads for concrete curried functions | Accepted |
| [0038](0038-eager-array-match-catchall.md) | Eager-array match with no catch-all: emit an exhaustive-check helper | Accepted |
| [0039](0039-nullary-ctor-empty-seed-annotation.md) | Annotate nullary-constructor refs like empty-collection seeds | Accepted |
| [0040](0040-generalize-resolves-through-subst.md) | `generalize` resolves mono-scheme bindings through the substitution | Accepted |
| [0041](0041-generalize-stops-at-scheme-bound-vars.md) | `generalize`'s free-variable walk stops at a scheme's own bound vars | Accepted |
| [0042](0042-enclosing-letters-scope.md) | Scope a binding's generic "letters" (type-param names) to its subtree | Accepted |
| [0043](0043-applied-ctor-phantom-param-widening.md) | Applied-constructor phantom type param widens to `unknown` | Accepted |
| [0044](0044-let-binding-type-annotations.md) | `let x : T = v` binding type annotations (a language feature) | Accepted |

Numbers not listed above (`0018`, `0019`, `0024`, `0027`, `0029`, `0030`, `0033`) have
never been assigned to an ADR — no source citation pins a decision to them, so none was
backfilled. If a future citation appears for one of these, treat it the same as any
dangling citation: verify whether it's a real unwritten decision (write the retro ADR
using that number) or a miscited plan-ticket id (fix the citation to `T-00NN` instead).
