# 0015 — Constructor fields carry full type expressions

- **Status:** Accepted
- **Source:** Slice D, the bootstrap parser — the AST is inexpressible without it (`docs/PATH_TO_BOOTSTRAP.md` §4)

## Context

A constructor field's type used to be a bare identifier (`CtorField.type: string`):
`Ok(value: a)`, `Circle(float)`, `Node(Tree, Tree)`. Resolution was
param-var → prim → nullary `tCon(name)`. That was enough for every example in
the repo — until Slice D. The parser's AST needs payloads like

```
| ECall(fn: Expr, args: [Expr])
| EMatch(scrutinee: Expr, arms: [MatchArm])
| SLet(name: string, value: Expr, doc: Option string)
```

— lists, applied types, tuples, and arrows in constructor fields. No encoding
dodges it: wrapping payloads in record aliases fails too, because a bare alias
name in a ctor field resolved to a *nullary constructor*, not the alias's row.

## Decision

`CtorField.type` is a full `TypeExpr`, same grammar as `extern` signatures and
alias fields.

- **Parser** — `parseCtorField` distinguishes `label: type` from a positional
  type with one token of lookahead (`id` followed by `:` is a label), then
  parses a full type expression either way.
- **Inference** — `ctorScheme` converts fields with the existing
  `typeExprToType`, seeding its var map with the declaration's parameters. So
  params resolve to the scheme's quantified vars, aliases expand to their rows,
  and `[t]` / `Option t` / `(a, b)` / arrows all mean what they mean in an
  `extern`. The scheme quantifies every var the fields introduced (`collect`
  over the built type) — a ctor scheme is closed by construction.
- **Check** — a lowercase leaf name in a ctor field that is not a declared
  parameter (and not a prim) is a check error: it would be existential — a
  `switch` could never recover its type. The error suggests declaring it:
  `unknown type parameter 'a' in constructor 'Mk' — declare it: type Foo a = ...`.
- **Formatter** — reuses the `typeExpr` printer (`EOpt(guard: Option Expr)`
  round-trips idempotently).
- **.d.ts** — a small `TypeExpr → TS` printer in `tsOf`'s style: `[t]` → `t[]`,
  `Option a` → `Option<A>`, tuples → TS tuples, arrows → function types.
- **Builtins** — `builtinTypeDecls` (Option/Result) construct `tname` nodes
  with a synthetic zero span.

## Consequences

- Every previously legal declaration parses and infers exactly as before: a
  bare name is the degenerate `TypeExpr` (`tname`), and `typeExprToType` on a
  `tname` reproduces the old param/prim/nullary-con behavior.
- Recursive AST-shaped variants are now first-class — the precondition for
  porting the parser (and later check/infer) to mochi.
- New soundness check: stray type variables in ctor fields are rejected at
  `check` instead of silently becoming a bogus nullary constructor named `a`
  (the old behavior).
- Codegen is untouched: runtime keys come from field *labels*, never types.

Guard: `test/ctor-field-types.spec.ts` (eval + .d.ts + formatter idempotence +
the stray-var error).
