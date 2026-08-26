# 0068 — Three parse-only syntax additions: param annotations, as-patterns, field shorthand

- **Status:** Accepted — implemented (parser/format/bootstrap parity for all three forms)
- **Date:** 2026-08-25
- **Source:** owner request during a language-gap review ("what high value expressiveness are we lacking")

## Context

Three independent gaps share one property: each is a **grammar** gap with no
semantic content. Each desugars or lowers into a node the compiler already has,
so `infer/` and `codegen/` see nothing new. They are batched into one ADR because
the decision is the same decision three times — *is the surface worth the token* —
and separating them would triple the ceremony without adding information.

```
let f = (x: number) => x + 1         → ParseError at 1:11: expected rparen, got colon
| [x, ...r] as whole => whole        → ParseError at 1:37: expected arrow, got id
let r = { x }                        → ParseError at 2:13: expected colon, got rbrace
```

## Decision

Add all three. Each is parse-time only.

### 1. Lambda parameter type annotations — `(x: number) => …`

ADR 0044 gave `let x : T = v` binding annotations; parameters never got the same
treatment, so **there is no way to pin a type locally**. Inference is global by
construction, so an over-general parameter surfaces as a unification failure at
some distant call site rather than at the definition the author was reasoning
about. An annotation is the standard tool for localizing that, and its absence is
felt most exactly where mochi is hardest to debug.

- Grammar: `param := id (":" typeExpr)?` in `parseParam`, alongside the existing
  `precord` / `ptuple` destructure forms.
- Infer: the annotation unifies with the fresh param var at binder creation — the
  same `u()` seam and span attachment annotated `let`s already use. It constrains;
  it never widens.
- Emit: JS drops it. TS emit **uses** it, tightening a param that previously
  printed as an inferred type.

### 2. As-patterns — `pattern as name`

Bind the whole while destructuring the parts. Today: match twice, or rebuild the
value in the arm body — the second silently allocates and can drift from the
scrutinee.

- Grammar: a postfix in `parsePattern`, lowest precedence within a pattern, one
  new `pas` node (`{ kind: "pas", pat, name, nameSpan, span }`).
- Coverage: `pas` is transparent — `isCatchAll(pas)` is `isCatchAll(pat)`, and
  under ADR 0066 it specializes as its inner pattern. It must **not** be treated
  as a bind (that would make `[x, ...r] as w` a catch-all). ReScript enforces
  this structurally: `Tpat_alias` is stripped during normalization
  (`~/dev/rescript/compiler/ml/parmatch.ml:621`) and its arrival at the
  signature table is an `assert false` (`:881`), so the mistake is unrepresentable
  rather than merely avoided.
- Emit: ts-pattern has no `as`; lower to a binding of the scrutinee temp in the
  arm body, reusing the `$`-prefixed synthetic temps (ADR 0047).
- `name` goes through the existing reserved-word guard
  (`parser/reserved-words.spec.ts:42`).

### 3. Record field shorthand — `{ x, y }`

The binding side already puns — `let { x, y } = p`, `| { x, y } =>`,
`({ x, y }) => …` — while the construction side demands `{ x: x, y: y }`. The
asymmetry has no justification beyond the parser never having been asked.

- Grammar: in `parseField`, the `colon` becomes optional when the lookahead is
  `comma` or `rbrace`; desugar to `{ name, nameSpan: id.span, value: ref(id) }`.
  LL(2), no backtracking. Unambiguous because `{` in expression position is
  *always* a record — mochi has no block expressions (`parser.ts:582`), which is
  what makes this cheap here and expensive in TS or Rust.
- Reserved words rejected, as in the pattern form.
- **DX span policy** — the one real decision. Shorthand collapses `f.nameSpan`
  and `f.value.span` onto the same span, in two namespaces: `symbols.ts:328`
  records a field touch, then `walkExpr` records a value use. Rule: **emit both
  occurrences; hover and goto-definition prefer the value binding** (the
  variable is what the author is reading), and **renaming the field first
  expands the shorthand** to `{ x: x }`, then renames the label. Renaming the
  variable rewrites the shorthand in place.
- **`fmt` canonicalizes toward shorthand**, collapsing `{ x: x }` to `{ x }` —
  following ADR 0065, which established that `fmt` normalizes to one spelling
  when the alternatives are statically equivalent. `format.ts:1144` has the
  pattern-side shorthand logic to extend.

## Consequences

- No new semantics: `infer/`, `unify`, and the JS backend are untouched by (2)
  and (3); (1) only adds a constraint at an existing seam. TS emit improves for
  (1). All three are `tsc --strict` neutral.
- All three are **additive** — each currently parses as an error, so no program
  changes meaning and there is no corpus migration.
- `fmt` canonicalization in (3) will produce a **one-time whole-corpus diff**.
  Land it as its own commit, separate from the parser change, so the noise is
  reviewable.
- Formatter, `.d.ts` printers, and the LSP each need a case per node; the
  bootstrap mirror needs all three before the self-host may use them (the ADR
  0056 staging: land TS, mirror, adopt).
- Guard: `test/examples.spec.ts` cases per feature; reserved-word rejection specs
  for (2) and (3); a `formatSrc` idempotence check for the (3) canonicalization;
  and an ADR 0066 interaction case asserting `[x, ...r] as w` is not a catch-all.

## Alternatives rejected

- **Three separate ADRs.** Identical rationale and identical risk profile; the
  split would record ceremony, not decisions.
- **Skip (1); annotate the whole binding via ADR 0044.** `let f : number -> number = x => …`
  works but forces the *entire* arrow to be spelled to pin one parameter — the
  cost scales with arity, and the payoff (localizing an error) shrinks as the
  annotation grows.
- **Skip (2); bind and rebuild in the arm body.** Rebuilding a record or array
  allocates and can silently drift from the scrutinee; that is the bug
  as-patterns exist to prevent.
- **Skip (3); keep `{ x: x }` explicit.** Defensible in isolation, but the
  binding side already puns, so the language would be teaching that punning is
  fine except in the one position where the reader has the most context.
- **`fmt` canonicalizes toward explicit `{ x: x }`** instead of shorthand.
  Consistent with the pattern side is the stronger pull, and `fmt` collapsing
  shorthand it just permitted would read as the formatter fighting the grammar.
