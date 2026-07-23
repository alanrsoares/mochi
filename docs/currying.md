# Currying: curried types, flat runtime (CRITIQUE §4.4)

## Status

**Resolved: uncurry in codegen via a runtime `_curry` bridge.** Surface types stay
curried (`a -> b -> c`) — the data-last thesis is intact — but every function of
arity ≥ 2 lowers to a **flat** JS implementation wrapped in `_curry`, so all call
groupings agree and the saturated path allocates no intermediate closures.

## The bug this fixes

Before this, mochi's runtime had *two* incompatible calling conventions and the
type system knew about neither:

- Arithmetic (`add`, `mul`, …) was a flat 2-arg JS function. `add(2, 3)` worked;
  `add(2)(3)` and `map(add(10))(xs)` **crashed** (`add(2)` is `NaN`).
- Curried HOFs (`map`, `take`, …) and nested user lambdas (`x => y => …`) were
  arity-1 closure chains. `take(2)(xs)` worked; `take(2, xs)` returned the wrong
  thing.

Every one of these type-checks — the type is `a -> b -> c` regardless — so the
mismatch surfaced only as a runtime crash. That is a soundness gap, not just a
performance wart.

## The mechanism

```js
const _curry = (n, f) => function c(...a) {
  if (a.length < n) return (...b) => c(...a, ...b);      // under-applied: collect
  const r = f(...a.slice(0, n));                          // saturated: one flat call
  return a.length === n ? r : a.slice(n).reduce((g, x) => g(x), r); // over: fold surplus
};
```

`_curry(n, flatImpl)` accepts arguments grouped any way:

| call             | path                                    |
| ---------------- | --------------------------------------- |
| `f(a, b)`        | fast path — `flatImpl(a, b)`, no closure |
| `f(a)(b)`        | one closure for the partial, then flat  |
| `f(a)` (partial) | first-class function, safe to pass on   |
| `f(a, b, c)`     | apply first `n`, fold the rest          |

Because it is over-application-safe, it needs **no arity information from the type
system** — codegen stays type-free (inference still runs first and guarantees
soundness). Arity comes from syntax alone: a lambda's collapsed parameter count,
a constructor's field count, a prelude op's known shape.

### What gets wrapped

- **Prelude** — every arity-≥2 def is `_curry(n, flat)`; its curried-chain body
  was flattened to real multi-arg JS. Arity-1 ops (`sqrt`, `length`, `toArray`, …)
  stay bare. `_curry` is pulled in transitively via `runtimeDeps`.
- **User lambdas** — `collapseLambda` folds a chain (`x => y => body`, or a mix
  with multi-param lambdas — the type system treats them identically) into one
  flat parameter list; arity ≥ 2 → `_curry(n, (p…) => body)`.
- **Constructors** — a multi-field ctor (`Pair(a, b)`) curries too, so partial
  application (`map(Pair(0))`) works.

### What is deliberately left alone

- **Call sites** are emitted verbatim — `f(a, b)` and `f(a)(b)` both just work
  against a `_curry`d callee. No call-spine flattening, so the change never
  touches the codegen of every call (the risk the critique flagged).
- **Externs** are *not* wrapped. An extern's mochi type says `a -> b -> c`, but
  the compiler cannot know whether the backing JS export is flat 2-ary or a
  curried-1-returning-1 function — the two are indistinguishable from the arrow
  chain, and guessing wrong would silently corrupt the FFI. Externs therefore
  keep today's behavior: call them the way the host function is actually shaped.
  This is the FFI boundary and is the author's responsibility (see
  [effects.md](effects.md) for the parallel `extern`-discipline argument).

## Performance

The saturated call — the 95% path — now allocates **zero** intermediate closures
(one flat call after a single argument-array spread). That is strictly better than
the old nested-closure chains *and* better than the flat-but-broken arithmetic,
which couldn't be partially applied at all. Only genuinely partial application
(`f(a)` held as a value) allocates a closure, which is exactly when you want one.
