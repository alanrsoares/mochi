# 0033 — Flat function-type emission + overload ordering for inference (TS backend, ADR 0028's tail)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-22; `docs/TS_EMIT_CHECKPOINT.md` (first-class
  combinator tail, TS2345); `src/dts.ts` (`tsOf` arrow case, `compositions`);
  `scripts/gen-runtime.ts` → `src/runtime.ts` (regenerated); `docs/adr/0028`
  (typed lambda params); `docs/adr/0032` (generic value-lambdas); `docs/adr/0026`
  (TS backend); `docs/adr/0003` (curried surface, uncurried `_curry` codegen)

## Context

After ADRs 0028/0029/0031/0032 the self-hosted `bootstrap/` still emitted **94
`tsc --strict` errors**, dominated by **TS2345 (79)** — the "first-class
combinator tail". The checkpoint framed it as inference through function *values*
and guessed the lever was typing `_curry`'s public signature generically.

Measuring the actual errors showed a simpler root cause. alang's codegen is
**uncurried**: a user function of arity *n* emits as a flat arrow `(a, b) => …`
and is called flat `f(a, b)` (the `_curry` runtime wrapper makes every grouping
work at runtime — ADR 0003). Two emission paths rendered function *types*
inconsistently with that convention:

- `declType` (a binding's own params) peeled the lambda's arity into ONE flat
  arrow — `const sepBy: (parseItem, toks, pos, acc) => R`. **Flat. Correct.**
- `tsOf` (every NESTED function type — e.g. a HOF's function-typed param)
  rendered each arrow as a single-param curried step — `parseItem: (x) => (x) => R`.
  **Curried. Wrong.**

So a flat top-level binding (`expectId: <A>(toks, pos) => R`) passed as an
argument into `sepBy(parseItem, …)` — whose `parseItem` slot was typed curried —
was a shape mismatch: `(toks, pos) => R` ⊄ `(x) => (x) => R`. That single
inconsistency accounted for the entire `parser.ts` cluster (35 of the 79).

## Decision

**1. `tsOf` renders arrow types FLAT.** Collapse a whole arrow chain into one
multi-param arrow — `(a) -> (b) -> (c) -> R` → `(a: …, b: …, c: …) => R` — so
nested function-typed values agree with the flat binding types `declType` already
emits and with codegen's flat call sites. Params are named `a, b, c…`
(`String.fromCharCode(97 + i)`), matching `flatFnType`'s sibling convention.

**2. `flatFnType` overloads are ordered longest-composition-first, so the flat
all-at-once signature lands LAST.** A builtin is typed as an OVERLOADED set (one
call signature per `_curry` grouping). TS resolves a *call* against the first
*matching* overload regardless of order — but when it infers a call's type
arguments from a **passed overloaded function**, it uses that function's **last**
overload only. With the fully-curried form last, `reduce(add, 0, xs)` inferred
`reduce`'s element var from `add`'s 1-ary curried overload, leaving the second
var `unknown` → `add` (needs `number`) rejected against `(a: number, b: unknown)
=> …`. Putting the flat `[n]` signature last makes that inference pin every var.

Both changes flow through `tsOf`, so `src/runtime.ts` is regenerated
(`bun run gen:runtime`); the `.d.ts` writer and TS backend share the same
now-flat rendering.

## Consequences

- **Bootstrap: 94 → 58 `tsc --strict` errors (−36).** TS2345 79 → 48; the
  `parser.ts` combinator cluster 35 → 4; TS2677 2 → 0. No new error kinds.
- `.d.ts` output for function-typed positions changes from curried to flat
  (`(x: A) => (x: B) => C` → `(a: A, b: B) => C`) — now consistent with how
  top-level bindings were already declared. Snapshot assertions in
  `test/dts.spec.ts` and `test/codegen-ts.spec.ts` updated (`x` → `a`). A
  genuinely curried *definition* (`f => r => …`) still declares curried, because
  `declType` follows the lambda's syntactic nesting; only leaf function types
  flatten.
- JS backend byte-identical (neither `tsOf` nor `flatFnType` feeds it; self-host
  differential build green).
- The overload reorder is inference-only; call-site resolution is unchanged
  (verified by `test/ts-emit-tsc.spec.ts` — pipelines/collections/arity-3 corpus).

## What remains (next lever)

The now-dominant cluster is **`infer.ts` (33 TS2345)**, a *different* root cause:
a partial record literal `{ next }` flowing where the full inference state
`{ tv, rv, next }` is expected — alang's **row-polymorphic record** emitted as a
CLOSED record, dropping the open row variable. That is its own ADR (open-row →
generic record emission), not part of this one. Smaller residuals: TS2322 4,
TS2554 3 (arity), TS2741 1, TS2339 1 (the real `{...st, sccs}` row update),
TS18046 1.
