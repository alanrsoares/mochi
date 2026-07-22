# 0037 — Concrete function bindings emit partial-application overloads (TS backend)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-23; `scripts/bootstrap-tsc.ts` (measurement); `src/dts.ts` (`curriedOverloads`, `flatBindingParams`, `bindingTsType`, `flatFnType`); `docs/adr/0003` (curried surface, uncurried codegen via `_curry`); `docs/adr/0033` (flat function-type emission); `docs/adr/0026` (TS backend)

## Context

After ADR 0036 the self-hosted `bootstrap/` emitted **22 `tsc --strict` errors**.
The largest single-cause cluster was **3× TS2554 "Expected N arguments, but got
M"** plus their downstream TS2345s — all **partial application of concrete
curried functions**:

- `lexer.ts` `inRange(48, 57)` — a 3-arg `(lo, hi, n) => boolean` applied to 2.
- `parser.ts` `setLetMeta(true, doc)` — a 3-arg `(exported, doc, s) => Stmt`
  applied to 2, then handed to `map`.

Every alang function is curried at the surface (ADR 0003); the JS backend
uncurries calls and wraps arity-≥2 definitions in `_curry`, so `inRange(48, 57)`
returns a `(n) => boolean` *at runtime*. But ADR 0033 emits the binding's TS type
**flat** — `(lo: number, hi: number, n: number) => boolean` — which has three
*required* parameters and rejects the 2-arg call. Builtins never hit this: their
runtime `.d.ts` types (`flatFnType`) already emit an **overload per composition
of the arity**, so `map(f, xs)`, `map(f)(xs)`, `foldl(f)(z)(xs)` all typecheck.
User function bindings simply didn't share that treatment.

## Decision

**Type a CONCRETE (non-generic) function binding with the same
partial-application overload set builtins already use.** Extract the composition
machinery `flatFnType` carried into a shared `curriedOverloads(head, params,
ret)` — one call signature per `compositions(arity)` grouping, flat signature
**last** — and route concrete lambda bindings through it via `flatBindingParams`
(which flattens params across nested `a => b => …` lambdas and a single
multi-param `(a, b) => …` alike). `bindingTsType`:

```ts
if (head === "") {                       // concrete: no generics to bind
  const { params, ret } = flatBindingParams(folded, value, names);
  return curriedOverloads("", params, ret);
}
return `${head}${declType(folded, value, names)}`;  // generic: unchanged
```

So `sum = (a, b) => add(a, b)` now declares
`{ (a: number): (b: number) => number; (a: number, b: number): number; }` — both
`sum(a, b)` and `sum(a)(b)` typecheck.

**Generic functions keep the flat/nested arrow.** Overloading them was tried and
**regressed the graph 22 → 116**: an overload set defeats tsc's contextual typing
of callback arguments (`_v` params collapse to `any`, TS7006) and its type-arg
inference (results collapse to `Option<never>`). The `head === ""` gate confines
overloads to the concrete bindings that actually need them and where they are
inference-neutral (no type vars to infer, no polymorphic callback params).

## Consequences

- **Bootstrap: 22 → 16 `tsc --strict` errors (−6).** All 3 TS2554 partial-app
  sites clear, plus 3 downstream TS2345s that fed on the mistyped results. No new
  errors; the fixpoint (`build ok`) confirms **JS byte-identical** — `_curry`,
  runtime, and every emitted `.js` are unchanged (`flatFnType`'s refactor is
  output-identical; the runtime files don't move).
- **`.d.ts` for concrete multi-param functions now shows the overload set**, not
  the flat arrow. This is *more* accurate — it matches the `_curry` runtime, the
  same way builtin `.d.ts` signatures already read. Generic-function `.d.ts` is
  unchanged.
- **Guarded** by `test/ts-emit-tsc.spec.ts` (`partialApp` corpus: a concrete
  3-arg function partially applied as a `map` callback and again bound-then-called,
  tsc-clean), updated `test/dts.spec.ts` + `test/codegen-ts.spec.ts` goldens (the
  overload shape), and the `test/bootstrap-tsc.spec.ts` ratchet lowered to ≤ 16.
- **Readability cost:** a concrete multi-param signature is now an overload object
  rather than a one-line arrow. Judged worth it — it encodes the currying the
  runtime already does and is the same shape builtins carry.

## Alternatives rejected

- **Overload generic functions too** — regressed 22 → 116 (contextual-typing and
  type-arg-inference collapse). Rejected; gated out.
- **Emit `f(a)(b)` curried CALLS instead** — would need changing codegen call
  emission, breaking the ADR 0003 uncurried-codegen / byte-identical-JS invariant.
- **`as` casts at each partial call site** — per-site, invasive, and reintroduces
  the generic-scope hazard ADR 0028/0032 fight.

## What remains (next lever)

Of the 16, by root cause: **generic-leak HOF** (`B[]`/`Set<A>`/`Map<A,…>` where a
concrete type is expected — `check.ts:217`, `codegen.ts:382`); **open-row state**
(`infer.ts` `.sccs` on `& A`, the `module.ts` `emptyReg` seeds); the
**`NonExhaustiveError`/`never` match-return** class (`cli.ts:21`, `infer.ts:487` —
guard-predicate arms + `.exhaustive()` that ts-pattern can't prove); and a
scattering of empty-collection / `Option<never>` leaks. The generic-leak and
open-row clusters are the polymorphic-HOF tail proper — they need generics scoping
over more value positions than ADR 0032 reaches. Each its own ADR.
