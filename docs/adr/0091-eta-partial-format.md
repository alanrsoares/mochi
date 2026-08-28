# 0091 — `fmt` eta-contracts `x => f(a, x)` to `f(a)` when that is a clean refactor

- **Status:** Accepted
- **Date:** 2026-08-28
- **Source:** `packages/dx/src/format.ts` (`etaPartial`), `test/eta-partial.spec.ts`
- **Amends:** [0065](0065-canonical-flat-calls.md) (same arity table, a second rewrite)

## Context

Mochi functions of arity ≥ 2 lower to one `_curry`-wrapped JS function, so a
saturating trailing lambda and the equivalent partial are the same callable:

```mochi
map(foo => bar(baz, foo), xs)   // unary lambda, calls `bar` per element
map(bar(baz), xs)               // partial, remaining arity 1
```

Authors write the lambda because it reads as "the argument goes last". `fmt`
already canonicalizes the other spelling of the same call (`bar(baz)(foo)` →
`bar(baz, foo)`, ADR 0065). Leaving the eta form next to that was the same
inconsistency 0065 closed for grouping.

The rewrite is not free. `x => f(g(), x)` evaluates `g()` per call; `f(g())`
evaluates it once. `x => f(a, x)` when `f` has arity 3 is a unary function
returning a partial; `f(a)` is a 2-arg `_curry` residual — different calling
convention. Unknown callees (`import { bar }`) have no emitted arity, so
`bar(baz, foo)` might be applying a unary host and ignoring `foo`.

## Decision

`fmt` rewrites a unary name-param lambda `x => f(a₁, …, aₙ, x)` to the partial
`f(a₁, …, aₙ)` when every one of these holds, and leaves the lambda otherwise:

1. **Known flat arity** — same table as ADR 0065 (same-file top-level lambda
   chain, or prelude / namespace builtin). No inference, no imports, no externs.
2. **Saturating last slot** — `n + 1` equals that arity. The residual is a
   1-arg function, matching the lambda's calling convention. A curried chain
   `a => b => f(a, b)` is excluded: eta of the inner param would drop it from
   `collapseLambda` and change a 2-arg `_curry` binding into a unary arrow.
3. **Inert prefix** — `f` and each `aᵢ` are a ref, literal, `()`, or a field
   chain of those. Lifting them out of the lambda cannot change how often they
   run.
4. **`x` not free** in `f` or the prefix (`x => f(x, x)` stays).
5. **No load-bearing syntax** — param has no annotation; name is not `$`-prefixed
   (sections / compose own those); the eta argument has no attached comment.

`(x => f(a, x))(b)` is flattened in the same pass as `f(a)(b)` so the printer
does not emit `f(a)(b)` and wait for a second `fmt` to settle.

## Consequences

- `map(foo => add(1, foo), xs)` becomes `map(add(1), xs)`. Applied to the repo
  this is a one-time corpus `fmt` diff, same class as 0065 / 0068.
- The rule is deliberately incomplete: an imported `bar`, a call in the prefix,
  or an unsaturated `x => f(a, x)` (arity 3) stay written as lambdas.
- Idempotent with ADR 0065: the collapsed partial is a single argument group,
  which 0065 leaves alone; re-parsing it is not a lambda, so paren decisions
  must see through eta (`printsAsLambda`) or pass one would leave sticky `()`.

## Alternatives rejected

- **Eta any trailing `x => f(…, x)` without knowing arity.** Unsound for a unary
  host that ignores extra JS arguments: `map(foo => bar(baz, foo))` calls `bar`
  per element, `map(bar(baz))` uses `bar`'s return value as the mapper.
- **Eta unsaturated residuals (`x => f(a, x)` at arity 3 → `f(a)`).** The lambda
  is unary; `f(a)` is a 2-arg `_curry` value. Binding-position rewrite would
  change `let g = x => f(a, x)` from arity 1 to arity 2.
- **Eta the inner param of `a => b => f(a, b)`.** Drops `b` from `collapseLambda`,
  so `let plus = a => b => a + b` would emit a unary `a => add(a)` instead of
  `_curry(2, …)` and `reduce(plus, 0)` would break. Callbacks nested *inside*
  a lambda body still contract.
- **Treat calls as inert when they look pure.** `fmt` does not infer. `g()` in
  the prefix stays a lambda; authors who want the lift write `f(g())` themselves.
- **Canonicalize to operator sections (`x => add(1, x)` → `(1 +)`).** Sections
  already round-trip `$s` lambdas (ADR 0000). A user-written name is a partial
  application, not a section; `add(1)` is the matching spelling.
