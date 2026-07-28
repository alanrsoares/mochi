# 0054 — `unit` as an ordinary type: the `()` value, the `()` pattern, and `ignore`

- **Status:** accepted
- **Date:** 2026-07-28
- **Source:** owner decision ("need the real unit support"); `examples/snake/src/App.mochi` keyboard dispatch
- **Deepens:** ADR 0014 (nullary lambdas/calls use `unit -> T`), ADR 0015 (`()` in TypeExpr)

## Context

ADR 0014 introduced `unit` as a *compiler-internal* type: the domain synthesized
for `() => e` and for the call `f()`. It was deliberately unspeakable — `tUnit`
existed, `()` parsed in type position, but nothing in the surface language could
produce or match an inhabitant. Three gaps followed:

1. **No unit value.** `()` in expression position was a parse error, so an
   expression that means "nothing" had to invent a value. The snake keyboard
   dispatch paid for this in every arm: re-reduced action creators return `{}`,
   so `| MoveUp => store.actions.up()` failed to unify with the sibling arms and
   the only shape that typechecked was `| MoveUp => let _ = store.actions.up() in 0`
   — a fake `0` plus a fake binding, thirteen times over.
2. **No sanctioned discard.** `ignore` was absent from the prelude, so dropping a
   result *required* the `let _ = … in` dance above.
3. **No unit pattern.** `type Color = Red` gives `| Red => …`, but `unit`'s sole
   inhabitant could only be matched with `_`.

An earlier revision of this work shipped (1) and (2) and explicitly excluded (3)
on the grounds that `_` matches unit losslessly. That reasoning was wrong in
kind, not in degree: it kept `unit` a special case at exactly the point where a
user would notice it. **This ADR reverses that exclusion.**

## Decision

**`unit` is an ordinary one-inhabitant type, and `()` is its literal in all
three positions — value, type, and pattern.** Nothing about it is
compiler-internal magic:

| Position | Surface | Lowering |
|---|---|---|
| value | `let x = ()` | `{ kind: "unit" }` → `tUnit`, emits `undefined` |
| type | `let f : () -> number`, `unit -> number` | `tname "unit"` → `primType("unit")` |
| pattern | `switch u { \| () => … }` | `{ kind: "punit" }` → unifies scrutinee with `tUnit` |

Consequences of "ordinary":

- **`unit` is in `PRIM_TYPE_NAMES`** (`ast/ctors.ts`), so `schemes.ts` lowers it
  through the same `primType` path as `int`/`bool`/`string`. The former
  hardcoded `if (tname.name === UNIT) return tUnit;` is gone.
- **`showType` prints `()` in every position** — a unit result hovers as
  `number -> ()`, not `number -> unit`. This subsumes the old arrow-branch
  special case (which printed `()` only as a nullary domain); both the TS
  `showType` and `bootstrap/types.mochi` lost that branch.
- **`ignore : a -> unit`** is the sanctioned discard (`preludeEnv` +
  `preludeJsDefs`, `const ignore = (x) => undefined`).
- **Unit is TS `undefined`** (`PRIM_TS.unit`), which matches the emitted JS
  exactly and stays assignment-precise under `strict` where `void` would not.
- **The `()` pattern is irrefutable.** `unit` has exactly one inhabitant, so the
  type alone decides the arm: `punit` joins `isCatchAll` in both `check` (it
  satisfies exhaustiveness with no `_`) and `codegen` (it emits no test). It is
  deliberately **not** a `NarrowingPattern` and not `isFlatSub` — there is
  nothing to narrow and nothing to destructure.

The snake dispatch now reads as intended:

```
| None => ()
| MoveUp => ignore(store.actions.up())
| Restart => store.$derived.gameOver.value ? ignore(store.actions.restart()) : ()
```

### `f(())` and `f()` are the same call

When `f : () -> T`, both spellings typecheck: `inferCall`'s 1-arg path unifies
`argT = tUnit` against the very domain its 0-arg path synthesizes. This aliasing
is **blessed, not fixed** — it is what "unit is an ordinary type" *means*.
`()()` still correctly errors (`tCon("unit")` is not an arrow).

### The 0-arity AST stays

The obvious tidier design is to desugar at parse time — `f()` → `f(())` and
`() => e` → a one-unit-param lambda — which would delete the two arity branches
in `inferLambda`/`inferCall`. **Rejected, with evidence:** roughly fifteen sites
key on `args.length === 0` (`plugin-re-reduced/src/index.ts:85,304,450,479,568`;
`dx/format.ts:112,446,602,612,637`), and plugin `inferCall` hooks run *before*
any desugar point would, so a nullary `.on()` would start looking like a 1-arg
call to code that reads arity to decide meaning. The 0-arity node therefore
stays, and the **0-arity ≡ unit-arity convention** is named here instead of
being deleted: `inferLambda` and `inferCall` are the two places allowed to know
it, and both do so by synthesizing exactly the `tUnit` that the 1-arg path would
have unified against.

## Alternatives rejected

- **`()` value without the `()` pattern** (the first cut) — cheaper, and it did
  unblock the snake dispatch, but it left `unit` the only type whose inhabitant
  cannot be named in a pattern. The owner's verdict: "a lot of work for a half
  assed solution".
- **A user-writable `type unit = ()` in the prelude** — would make `()` a real
  nullary ctor, but ctor names are Uppercase by construction and the ctor tables
  (arity, runtime keys, exhaustiveness) would have to carry a member that no
  `switch` can usefully discriminate. Prim-type treatment is the smaller change
  with the same surface.
- **`void` instead of `undefined` in `.d.ts`** — loses assignability precision
  under `strict`; `undefined` is what the runtime actually produces.

## Consequences

- Any future `Expr`/`Pattern` walker must handle `unit`/`punit`. Note the trap:
  `.exhaustive()` does **not** catch an omission when the match's result type is
  `void` (TS accepts `NonExhaustiveError` as assignable to `void`), so
  void-returning walkers are found by grep, not by `tsc`. Bootstrap has no such
  hole — mochi's own exhaustiveness is a hard error, so a clean
  `build bootstrap/compile.mochi` proves every self-hosted site was updated.
- Guards: `test/unit-value.spec.ts` (value, pattern, `ignore`, `eq`/`show`,
  `f(())` ≡ `f()`, `()()` rejected, plus parser non-regressions for `() => 0`,
  `(+ 1)`, `f()`, `(1)`, `(1, 2)`), `dts.spec.ts` (unit result → `undefined`),
  `format.spec.ts` (both round-trips), `test/module-diagnostics.spec.ts` (the
  snake arm text).
- `bootstrap/prelude.gen.mjs` and `prelude/runtime.ts` carry `ignore`; the
  byte-parity guard in `test/prelude-shim.spec.ts` keeps them in step.
