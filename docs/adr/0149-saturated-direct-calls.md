# 0149 — Saturated calls go direct to a raw twin

- **Status:** Accepted
- **Date:** 2026-10-04
- **Source:** [#163](https://github.com/alanrsoares/mochi/issues/163) slice; [ADR 0115](0115-curry-fast-paths-and-exact-comparisons.md) (`_curry` fast paths)
- **Amends:** [ADR 0037](0037-curried-function-partial-application-overloads.md) (call-shape contract is unchanged)

## Context

Every top-level function of arity >= 2 is `_curry(n, (a, b) => …)`. Even with the
ADR 0115 fast paths, a call that passes exactly `n` arguments still crosses the
wrapper's rest parameter and length dispatch. In self-hosted code nearly every
call is saturated, and recursion calls itself through the wrapper.

## Decision

A top-level `let f = (a, b, …) => …` emits a **raw twin** plus the unchanged
public binding:

```js
const f$ = (a, b) => …;
const f = _curry(2, f$);
```

A call whose callee is the bare name `f` and whose argument count equals the
arity emits `f$(…)`. This covers `f(a, b)`, a fast pipe `a->f(b)`, and — under
`flattenPipe` — `a |> f(b)` (`f$(b, a)`). Partial, over-applied and regrouped
calls (`f(a)`, `f(a, b, c)`, `f(a)(b)`) and value uses (`let g = f`) keep the
public binding, so the call-shape contract of ADR 0037 is untouched. Runtime,
exports and `.d.ts` are unchanged: `f$` is module-internal.

### Eligibility

- The value is a lambda whose spine collapses to >= 2 params with no labeled
  group (ADR 0098 fills stay on the curried path).
- The name is not `$`-prefixed (destructure temps).
- **Shadow rule:** the name is not in `localBinderNames(stmts)` — no lambda
  param, `let … in`, bind, `switch` binder or loop param anywhere in the module
  reuses it. Deliberately module-wide and conservative: no scope tracking, so a
  call by that name can only be the top-level function.
- The raw ident comes from `tempName("${name}$")`, so it cannot capture a bound
  name or value reference.

### TypeScript backend

A self-recursive raw arrow is an implicit-any cycle (TS7023), so the backend
supplies `GenOpts.annotateRaw`, which returns the arrow's **return type**
(`const go$ = (n: number, acc: number): number => …`). It is attached to the
arrow, not the const: a separately generic annotated const loses the arrow's own
letters and its contextual return typing.

The hook declines (no twin) for a **generic** binding. An explicit return type
there exposes `Result<unknown, E>` inference gaps in `_Result_match` chains that
the `_curry` wrapper's inferred return used to hide; the self-emit hit five
TS2322 errors. Monomorphic bindings, which are the hot ones, keep the twin. The
JS backend has no hook and twins every eligible function.

## Consequences

- `bun run bench --compare` (20 runs, compiler compiled by itself): compile
  load −7.0%, check+infer+codegen −9.2%, `fmt:repo` −7.8%, per-file `fmt`
  −15% to −23%.
- Seed regenerates three times to a fixed point (the compiler self-uses the
  change); `seed:check` is stable.
- The bootstrap test harness dedupes `const name$` with its public binding.

### Amendment: private functions drop the public binding

A twin whose function is not exported and whose public name is never referenced
emits only the function, under the public name (`const f = (a, b) => …`, calls
`f(a, b)`). "Referenced" mirrors the lowering: a saturated plain call, a saturated
fast pipe (`a->f(b)`) and `a |> f(b)` under `flattenPipe` reach the twin and do not
count; every other mention (value use, partial or over-applied call, JSX call,
hole pipe) does, so the wrapper stays. Nothing outside the module can see a
private binding, so no behavior changes. A module left with no wrapper no longer
inlines `_curry`.

The self-hosted seed carried 704 `_curry` wrappers, 614 of them dead: about 29 KB
raw / 4.6 KB gzipped per bundle and one `_curry` call per function at load. Test
helpers that look a private binding up by name (`compileAndEval`) are unaffected
for functions that keep a twin; tests of the curried public binding export the
function or use it as a value.

## Out of scope

Cross-module raw exports; over-application (`f(a, b, c)` on an arity-2 function);
local (let-in) lambdas; externs; the non-flattened `a |> f(x)` pipe (`f(x)(a)`);
raw twins for generic bindings on the TypeScript backend.
