# 0046 — Qualified type names in type position (`Alias.T`)

- **Status:** Accepted
- **Source:** `src/ast.ts:141` (`TypeExpr` union), `src/parser.ts:1061` (`parseTypeAtom`/`parseTypeApp`), `src/{check,schemes,format,symbols,dts}.ts`

## Context

[C5](../tracker/tickets/c05-type-name-imports.md) tracks the fact that a type
imported from another module cannot be named in type position: `let g : D.Shape
= …` fails to parse (`expected eq, got dot`). Cross-module *constructor*
matching already works (`D.Circle(r)` patterns, `module.ts` ctor-table merge),
but `TypeExpr` has no qualified form at all — only bare `tname`/`tapp`. This
blocks C1 (strict-by-default), whose escape hatch is `extern f : T -> U`
annotations that need to name host/imported types across module edges.

This ADR covers **slice a only**: making `Alias.T` (and `Alias.T a b`)
*parseable* in type-annotation position, with every existing `TypeExpr`
consumer updated to not crash on it. Resolving the qualified name through the
import graph — so `let g : D.Shape = …` actually typechecks — is a later C5
slice.

## Decision

Add one new `TypeExpr` variant:

```ts
| { kind: "tqual"; alias: string; name: string; nameSpan: Span; args: readonly TypeExpr[]; span: Span }
```

`args` is `[]` for the nullary case (`D.Shape`) and non-empty for the applied
case (`D.Result e a`). This deliberately collapses the unqualified
`tname`/`tapp` split into **one** variant: `tname` splits from `tapp` because a
*bare* uppercase name could still be a nullary constructor while a lowercase
one is a type variable, and that ambiguity needs its own leaf node before an
application loop can run. A qualified name has no such ambiguity — a name
after `Alias.` is always a constructor reference, never a type variable — so
there's nothing for a separate nullary/applied split to disambiguate. One
variant with an `args` array covers both arities.

`QualTypeExpr = Extract<TypeExpr, { kind: "tqual" }>` is added alongside the
other narrowed-union aliases (`LambdaExpr`, `TupleExpr`, …) per the file's
existing convention.

Parsing (`parseTypeAtom`): after `expectId()` yields an uppercase-initial
name, if the next token is `dot`, consume it and `expectId()` again. If that
second name is lowercase, the parser reports a diagnostic — "a type variable
cannot be qualified" — since a bare lowercase name after a dot can't mean
anything: it isn't a constructor, and a module alias can't parenthesize a type
variable. This uses `fail()`, the same non-fatal-at-the-statement-boundary
diagnostic path every other parser production error uses (ADR 0045
recovery), so a bad qualified type name doesn't abort the whole parse.

`parseTypeApp`'s juxtaposition-application loop (shared via a new
`parseTypeAppArgs` helper) runs identically for `tqual` as it does for
`tapp`, so `D.Result e a` collects its args the same way `Result e a` does.

Every existing `TypeExpr` consumer gets a `tqual` arm. For this slice the
behavior split is:

- **`format.ts`** — prints `Alias.Name` (+ parenthesized args), exact
  round-trip. Required, not deferred, since formatting doesn't depend on
  resolution.
- **`symbols.ts`** — records a `type` use keyed on the alias-qualified name
  (`"Alias.Name"`) at the name's span, so hover/go-to-def don't crash; it
  simply won't resolve to a real declaration yet.
- **`check.ts`'s `strayTypeVar`** — a `tqual` head is never itself a stray
  type variable (per the reasoning above); it recurses into `args` only,
  since those can still hide one.
- **`schemes.ts`'s `typeExprToType`** — lowers to `tCon("<unresolved
  Alias.Name>", args)` rather than either (a) silently resolving to
  something real (there's no import graph wired in yet — that would be
  slice b's job, not this one) or (b) crashing. The bracketed, clearly-named
  placeholder con doesn't unify with anything a real program produces, so
  `let x : D.Shape = 5` still fails to typecheck after this slice — that's
  expected and pinned by a test — but the failure now reads as an
  unresolved-alias mismatch instead of an opaque one.
- **`dts.ts`'s free-name collection (`teConNames`)** — collects the
  alias-qualified form (`"Alias.Name"`); folding it back to an emitted,
  resolved TS import is deferred.

## Consequences

- `Alias.T` and `Alias.T a b` parse in every type position (`let x : T`,
  `extern f : T -> U`, ctor/alias field types) without touching resolution.
- No behavior change for any program that doesn't use qualified type names —
  `tname`/`tapp`/`tarrow`/`ttuple`/`tlist` are untouched.
- `let x : D.Shape = …` still doesn't typecheck after this slice (by design —
  pinned in `test/infer.spec.ts`), and hover/dts don't yet fold a qualified
  name back to the real declaration. Both are explicitly later C5 slices;
  resolving them here would be premature (no import-graph plumbing exists at
  the `TypeExpr`-lowering call sites yet — see the C5 slice-b handoff note in
  the roadmap/tracker for where that plumbing needs to land).
- `bootstrap/parser.mochi` does not produce `tqual` yet (C5 slice d); the
  `test/bootstrap-parser.spec.ts` differential canonicalizer gained a `tqual`
  case purely so the TS-side switch stays exhaustive — it is unreachable
  until the bootstrap mirror is taught the same grammar.

## Alternatives rejected

- **Keep the `tname`/`tapp` split and add `tqualname`/`tqualapp` as two
  variants** — mirrors the unqualified split's *shape* but not its
  *reason*: the split exists to distinguish "could be a type variable" from
  "definitely a constructor, possibly applied." A qualified name is always
  the latter, so a second split would just be two variants differing only in
  whether `args` is empty — better modeled as one variant with an array.
- **Resolve `tqual` to a real type during this slice** (e.g. reach into
  `module.ts`'s already-working ctor-table merge to look up `Alias.Name`) —
  explicitly out of scope per the ticket; doing it here would couple parsing
  to import-graph plumbing that slice b is meant to introduce deliberately,
  and would make it harder to review each concern in isolation.
