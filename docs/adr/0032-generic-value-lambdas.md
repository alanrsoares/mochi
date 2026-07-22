# 0032 — Generic value-lambda emission + flat `let?` bind (TS backend, ADR 0028's tail)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-22; `docs/TS_EMIT_CHECKPOINT.md` (polymorphic
  higher-order tail); `src/dts.ts` (`genericLambdaParams`, `genericNames`,
  `bindingTsType`); `src/codegen.ts` (`annotateParams` option, lambda emitter,
  `letbind` case, `flattenPipe`); `src/codegen-ts.ts` (`emitTsModule`
  `genericBindingLambda` map, `annotateParams` closure); `docs/adr/0028`
  (typed lambda params — this closes its deferred tail); `docs/adr/0026` (TS
  backend); `docs/adr/0003` (curried surface, uncurried `_curry` codegen)

## Context

ADR 0028 annotated **concrete** inner-lambda params and explicitly left the
**polymorphic higher-order tail** open: a generic binding's letters
(`const f: <A, B>(…) => …`) are declared on the const's *type*, **not in scope in
the value expression**, so `const f: <A,B>… = _curry(2, (a: A, b: B) => …)` fails
`TS2304 Cannot find name 'A'`. ADR 0028 therefore left generic params bare and
relied on tsc's contextual typing to fill them. But the bootstrap's dominant style
is a generic binding whose value is `_curry(n, (…) => …)`: `_curry`'s runtime type
is `(n, f: (...args: any[]) => any) => (...args: any[]) => any`, so it **erases**
the contextual type — the inner params fall to `any`, and generic helpers
(`_Array_get<A>`, `match`) then resolve `A` to `unknown`, poisoning the body with
**TS18046** (unknown), **TS7006** (implicit any), and **TS2345** (arg).

A second, adjacent cause: `let? p = v in b` lowered to the **curried** bind
`_Result_flatMap((p) => b)(v)` (ADR 0003 shape). Split across two call groupings,
tsc can't flow `v`'s type back to `p` — `p` stays unconstrained (`unknown`) — the
same inference gap `flattenPipe` (ADR 0026) already fixes for pipes.

Baseline entering this ADR: **243 `tsc` errors** on the emitted bootstrap
(TS2345 168, TS7006 40, TS18046 24).

## Decision

Two independent levers, both TS-backend-only (behind existing codegen flags → JS
output byte-identical).

### Lever 1 — scope the generics on the value lambda itself

For a **generic, function-valued top-level `let`**, emit its value lambda as a
**generic arrow** carrying the *same* letters the const head declares:
`const f: <A, B>(…) => R = _curry(2, <A, B>(a: A, b: B) => …)`. The letters are now
declared *on the arrow*, in scope for its params — so **every** param is annotated
(generic letters and concrete types alike), not just the concrete ones. `_curry`'s
`any` signature still erases the *result* type (harmless — the const annotation
supplies `f`'s public type), but the arrow body now typechecks against real params.

- `dts.genericLambdaParams(sc, arity, aliases)`: returns `{ generics, params }` —
  the head `<A, B>` from the scheme's `genericNames` (identical to what
  `bindingTsType` puts on the const, so the letters line up) plus one type per
  param, peeling one arrow of `sc.type` per collapsed param. Null when the binding
  is non-generic (the ADR-0028 concrete-only path handles those).
- `codegen.ts`'s `annotateParams` option now returns `{ generics, params }` instead
  of `(string | null)[]`; the lambda emitter splices `generics` before the arrow's
  `(`. `generics` is `""` for every lambda except a generic binding's value lambda.
- `codegen-ts.ts` builds a `Map<spanKey, Scheme>` of each generic function
  binding's value-lambda span (`s.value.span`) up front; `annotateParams` consults
  it first (→ `genericLambdaParams`), else falls back to the ADR-0028 concrete-only
  `lambdaParamTypesTs`. Only the *binding's* value lambda gets a head — inner
  lambdas (callbacks to `map`, etc.) stay contextually typed as before.

### Lever 2 — flatten `let?` to the all-at-once bind grouping

Under `flattenPipe` (TS backend only), lower `let? p = v in b` to
`_Result_flatMap((p) => b, v)` instead of the curried `_Result_flatMap((p) => b)(v)`.
`_Result_flatMap = _curry(2, …)` accepts the 2-arg grouping at runtime, and its
all-at-once overload infers `p` from `v`. Exactly the pipe-flatten move (ADR 0026)
applied to the bind desugaring; the JS backend keeps the curried form.

## Consequences

- **243 → 94 `tsc` errors (−149, −61%).** Lever 1: 243 → 175 (−68) — TS18046
  24 → 3, TS7006 40 → 2. Lever 2: 175 → 94 (−81) — TS2345 168 → 79, TS7006 → 0.
  The two dominant ADR-0028-tail kinds (implicit-any, unknown) are essentially gone.
- **JS backend untouched.** Lever 1 rides `annotateParams` (null for JS →
  `generics` defaults `""`); lever 2 rides `flattenPipe` (false for JS). The
  fixpoint self-host build stays byte-identical (guarded by `bun run check`).
- **Remaining tail (94):** almost all TS2345 (79), concentrated in `parser.ts` (89
  across kinds) and `infer.ts` (51) — first-class **combinator** plumbing where a
  (now generic) function is passed as an argument to another curried HOF whose own
  param type is still `unknown`-erased. This is the hard residue: it needs
  inference to flow through first-class function *values*, not just direct calls.
  Smaller residuals: TS2322 5, TS2554 4 (arity), TS2677/TS2339/TS2741/TS18046.
- New guards in `test/codegen-ts.spec.ts`: the generic-value-lambda shape
  (`_curry(2, <A, B>(f: (x: A) => B, x: A) => f(x))`) and the flat `let?` bind
  (`_Result_flatMap((v) => …, r)`). The ADR-0028 "generic param stays bare" test is
  **superseded** and rewritten — that behavior was the very limitation this ADR lifts.

## Alternatives rejected

- **Share the const head's letters on value params without re-declaring them**
  (ADR 0028's rejected attempt). Still `TS2304` — a const's *type* head never
  scopes its initializer. Re-declaring the letters *on the arrow* is what brings
  them into value scope; that is the whole of lever 1.
- **Emit the binding as a generic `function` declaration** (`function f<A>(…) {…}`)
  instead of `const f = _curry(n, <A>(…) => …)`. Rejected: abandons the uniform
  `_curry` lowering (ADR 0003) that makes every partial-application grouping work,
  for a shape that would need its own curry story. The generic *arrow* keeps the
  existing runtime and only adds a type-level head.
- **Annotate generic params `unknown`.** Same objection as ADR 0028: trades TS7006
  for TS18046/TS2345 downstream. Real letters typecheck the body; `unknown` doesn't.
- **Leave `let?` curried and special-case the bind in the type of `_Result_flatMap`.**
  Rejected: the flat grouping is already a valid `_curry` overload and mirrors the
  pipe-flatten precedent — no new type machinery, one branch in the `letbind` case.
