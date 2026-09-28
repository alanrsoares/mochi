# 0115 — `_curry` fast paths, and exact comparisons as operators

- **Status:** Accepted
- **Date:** 2026-09-29
- **Source:** [ADR 0114](0114-bootstrap-formatter-ships.md) (the formatter's cost)
- **Amends:** [ADR 0100](0100-readable-ts-and-tsx-emit.md) (which calls the typed backend re-folds)

## Context

After ADR 0114 the shipped formatter took ~142ms on `bootstrap/parser.mochi`.
A CPU profile put about a third of that in the runtime's `_curry` wrapper.
Every multi-argument binding and prelude function goes through it, and it
collected its arguments with a rest parameter and called `f(...a)`. In Bun,
a spread call costs several times more than a direct one. The next biggest
cost was structural `eq`, called through the same wrapper, mostly on
comparisons like `c == " "` and `tok == TQuestion`.

ADR 0100 re-folds only the numeric operators, since they are the only calls
whose JavaScript operator behaves exactly like the runtime function.

## Decision

- **`_curry`** (`prelude/runtime.ts`) takes a fast path for saturated and
  one-argument-short calls at arities 2 and 3. It reads the arguments by
  index from the rest array and calls `f` with fixed arguments. Other arities
  and groupings use the old general path, whose saturated call is also spelled
  out by arity up to 6. It counts `arguments`, never checks for `undefined`,
  because unit is a real argument. The semantics are unchanged: any grouping
  of the arguments, over-application included, gives the plain call.
- **The typed backend** (`preserveInfix`) re-folds more calls, each exactly
  equivalent to the runtime function:
  - `not(x)` becomes `!(x)`.
  - `a == b` / `a != b` with a string, number or bool **literal** on either
    side becomes `===` / `!==`. The runtime `eq` returns `x === y`, and
    otherwise `false` whenever either side is not an object.
  - `a == C` / `a != C` with a **nullary constructor** `C` on either side
    becomes `a._tag === "C"`. A nullary constructor is a bare `{ _tag }`, and
    type checking gives both sides the same variant type, so structural
    equality reduces to the tag test.
  - A runtime import is dropped once nothing references it, as it already
    was for the numeric names.
  - No rewrite applies to a name the module binds itself, at any scope (a
    top-level `let eq`, a parameter named `add`). Such a call is the user's
    function, and the JS backend calls it. This also covers ADR 0100's numeric
    re-folds, which had the same gap.
- `and` / `or` stay calls. `&&` / `||` would skip the right side, which would
  change what runs. That is a language decision, not an optimization.
- The JavaScript backend still emits no rewrites (ADR 0100). It gets the
  `_curry` change, which lives in the shared runtime.

## Consequences

Best of eight, warm:

| | before | after |
|---|---|---|
| format `bootstrap/parser.mochi` (2062 lines) | ~142ms | ~58ms |
| format `bootstrap/infer.mochi` (2291 lines) | ~141ms | ~53ms |
| format `examples/snake/src/app.mochi` (391 lines) | ~21ms | ~10ms |
| `bun run fmt:check`, whole repo | ~1.87s | ~0.89s |
| `bun run lint:mochi 'bootstrap/*.mochi'` | ~16.8s | ~12.2s |

- The formatter is now within about 2× of the retired TypeScript one (ADR
  0114: ~36ms on `parser.mochi`).
- `curry.pbt.spec.ts` checks that every grouping of a call's arguments,
  over-application and `undefined` arguments included, gives the plain
  call.
- Both codegens change together, and their specs pin the new output.
  `bootstrap:tsc` and `bootstrap:self-tsc` stay at 0 errors.
- The runtime's JS view (`js-defs.gen.ts`, `bootstrap/prelude.gen.mjs`) and
  the two JS conformance goldens are regenerated.

## Alternatives rejected

**Rewrite every `eq` to `===` using type information.** That would need the
operand types at every call site. Literals and nullary constructors cover the
hot cases with no type information, and they are exactly equivalent.

**Uncurried direct calls for local saturated calls.** This would emit an
uncurried `go$` beside each curried binding and call it directly. It removes
the wrapper entirely but changes emit shape, exports and recursion. Worth
revisiting if `_curry` shows up in profiles again.
