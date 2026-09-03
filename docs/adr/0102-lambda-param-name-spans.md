# 0102 — Lambda parameter name spans

- **Status:** Accepted
- **Date:** 2026-09-01
- **Source:** [ADR 0078](0078-mochi-first-self-hosted-core.md), [ADR 0098](0098-optional-record-fields-and-labeled-props.md), [ADR 0101](0101-bootstrap-query-boundary.md), `bootstrap/ast.mochi`, `packages/compiler/src/ast/ast.ts`

## Context

Every token and node in mochi carries a `Span`; hover, go-to-definition, and
diagnostics all depend on it. Lambda parameters were the one binder that did
not. `LamParam` in `bootstrap/ast.mochi` was

```
| LPName(name: string, annot: Option<TypeExpr>)
| LPRecord(fields: [string])
| LPTuple(names: [string])
| LPLabeled(name: string, annot: Option<TypeExpr>, optional: bool, defaultValue: Option<Expr>)
```

— names, no locations. A binder with no span cannot be the target of rename,
document highlight, or references, so the symbol index (ADR 0103) had to skip
lambda and destructure parameters entirely rather than manufacture a location by
searching the source text for the name.

The TypeScript mirror (`packages/compiler/src/ast/ast.ts`) had already solved
this the obvious way: a required `span` on `name`/`labeled`, and required
`nameSpans` / `fieldSpans` arrays on `ptuple` / `precord`.

That option is not open to the bootstrap AST, because not every `LamParam` comes
from source. Codegen and desugaring synthesise parameters — operator sections
build `$s` lambdas, labeled-call lowering builds record parameters — and those
have no text to point at. Making the span field required would force every
synthetic site to invent a span, and an invented span is worse than an absent
one: it silently sends the editor to the wrong place.

## Decision

Add a **wrapper** variant rather than a field on each shape:

```
| LPSpanned(param: LamParam, nameSpans: [Span])
```

The parser wraps every source-authored parameter; synthetic parameters stay
unwrapped. One exact span per bound name, so a tuple or record destructure
carries one entry per binder in binding order.

Consumers that do not care about locations match `LPSpanned(inner, _)` and
recurse into `inner`, which is a one-line arm in `infer.mochi`, `codegen.mochi`,
and `codegen-ts.mochi`. Consumers that do care — currently only
`bootstrap/symbols.mochi` — match the wrapper and the inner shape together.

**The TypeScript mirror keeps its inline spans.** The two representations stay
different on purpose. The mirror is the seed and the parity oracle (ADR 0078),
not a consumer with synthetic-parameter problems, and its `LamParam` values all
originate in the TS parser. Forcing the wrapper on it would add an unwrapping
step to every one of its `LamParam` matches to buy nothing.

The parity harness (`test/bootstrap-parser.spec.ts`) already maps both ASTs into
one canonical shape that drops spans, so the representations are compared where
they agree — on structure — and the unwrap is one line in `aParam`.

## Consequences

- Lambda, tuple, record, and labeled parameters are now first-class binders for
  editor queries; ADR 0103's index binds them from their own spans.
- A synthetic parameter remains legitimately spanless, and the type makes that
  state expressible instead of requiring a lie.
- Every `LamParam` match in the bootstrap graph needs an `LPSpanned` arm.
  Omitting one is a `.exhaustive()` failure at compile time, not a runtime
  surprise.
- Bootstrap and mirror ASTs are no longer structurally identical for parameters.
  The canonical-shape harness is what keeps them honest; a future span-level
  parity check would have to translate between the two forms.

## Alternatives rejected

**Optional span field on each variant** (`LPName(name, annot, span: Option<Span>)`).
Four variants each grow a field, every construction site grows an argument, and
the `[Span]` arity relationship for `LPTuple`/`LPRecord` — one span per name — is
still unenforced. Same expressiveness, four times the churn.

**Required span, synthesised where absent.** Rejected because a fabricated span
navigates the editor to a location the user did not write. An empty result is a
missing feature; a wrong result is a bug report.

**Port `LPSpanned` to the TypeScript mirror for symmetry.** Rejected: the mirror
has no spanless parameters to model, and the parity harness compares canonical
structure, not constructor shape.
