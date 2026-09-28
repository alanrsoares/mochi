# 0113 — `switch` lowers to a ternary chain

- **Status:** Accepted
- **Date:** 2026-09-29
- **Source:** [issue #103](https://github.com/alanrsoares/mochi/issues/103), [ADR 0038](0038-eager-array-match-catchall.md)
- **Amends:** the `@onrails/pattern` target for emitted `switch`

## Context

A `switch` compiled to an `@onrails/pattern` chain:
`match(x).with(p1, h1).with(p2, h2).exhaustive()`. Each `.with` copies the
builder's list of cases, and the whole chain is built before any arm is tried.
So every evaluation allocates about one builder per arm and walks a matcher per
arm.

Moving `mochi fmt` and the LSP onto the bootstrap formatter (#103) made that
cost visible. With the algorithmic fixes of #116 in place, the matchers were
about 70% of the bootstrap printer's time. The printer took ~350ms on
`bootstrap/parser.mochi`, against ~25ms for the TypeScript formatter. Every
compiled Mochi program pays the same cost wherever it matches.

## Decision

- A `switch` lowers to one expression, a ternary chain over its scrutinee bound
  once as `_v`:
  ```js
  ((_v) => _v._tag === "Circle"
      ? (({ _0: r }) => (square(r)))(_v)
      : _v._tag === "Rect"
      ? (({ _0: w, _1: h }) => (mul(w, h)))(_v)
      : (() => { throw new Error("non-exhaustive match"); })())(shape)
  ```
  The tests are the ones the pattern compiler already built for guard-form
  arms (`patConds`), and bindings use the same destructuring slot (`patSlot`).
  A catch-all ends the chain. Without one, the chain ends in a throw that the
  exhaustiveness check proved dead, as ADR 0038 already did for eager arrays.
- **TypeScript:** a discriminant or literal test on `_v` narrows it, so a
  shallow arm destructures `_v` directly. An arm that tests a nested field
  would only narrow that field, so its bindings read `(_v as T)`, where `T` is
  the arm's existing `patTarget` (ADR 0031). The cast states what the arm's
  tests just proved, which is what the old `_v is T` predicate did.
- When the TS backend cannot name the scrutinee's type (a generic scrutinee)
  and some arm is nested, the `switch` keeps the `match()` chain. There is no
  cast target, and the library's handler inference is what types the
  bindings. JS output never uses the library.
- Lazy-List switches keep their bounded-pull IIFE.
- Both codegens change together (`bootstrap/codegen.mochi`, then
  `packages/compiler/src/codegen/codegen-match.ts`). The parity specs pin
  them to the same output.

## Consequences

- JS output no longer imports `@onrails/pattern`. TS output imports it only
  for the fallback above: 49 `match()` chains across 12 seed modules.
- Measured on `bootstrap/parser.mochi` (best of eight):

  | | before | after |
  |---|---|---|
  | lex | ~142ms | ~70ms |
  | parse | ~95ms | ~41ms |
  | print | ~350ms | ~73ms |

  Formatting the whole repo takes ~2.7s instead of ~7.6s, with byte-identical
  output on all 167 files. A single-file `mochi ts bootstrap/infer.mochi` takes
  ~541ms instead of ~714ms.
- The emitted code is longer per arm but reads top to bottom. The seed lint
  turns off `noUselessTernary`, which fires on a `Bool`-returning switch
  (`? true : false`).
- `bootstrap:tsc` and `bootstrap:self-tsc` stay at 0 errors.

## Alternatives rejected

**Keep `match()` and make the library faster.** Caching the builder per call
site would need a module-level constant per `switch` and would change the
library's API. It would also keep an allocation and an indirect call per arm.
The ternary chain has neither, and it needs no runtime dependency.

**`switch (_v._tag)` statements in an IIFE.** Fast, but a statement form in an
expression position needs a block-bodied IIFE per match. It also covers only
ctor tags, not literals, tuples, or guards, so a second lowering would still be
needed.

**Cast every arm, shallow or not.** Simpler, but a needless `as` on every arm
hides the cases where TypeScript's own narrowing already does the job.
