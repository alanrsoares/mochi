# 0056 — Loops in the surface language: `loop`/`recur`

- **Status:** accepted
- **Date:** 2026-07-28
- **Source:** owner request during apps/docs architecture review ("also language loops")

## Context

mochi was recursion-only. That is the right default for an ML-family core, but
two costs showed up at the host seam:

1. **Emit readability.** The compiler's promise is *readable* JS/TS output.
   Iteration-heavy code had to be written as recursion and emitted as
   recursion — undercutting the "JS you'd have written by hand" pitch.
2. **Stack-depth fragility.** The self-host depended on JSC's strict-mode
   proper tail calls for depth (prelude `_curry` comment,
   bootstrap-parser.spec's `"use strict"` prologue) — a target-specific
   guarantee neither the LLVM ticket (0022) nor the Wasm path (ADR 0053) gets
   for free.

## Decision

**Clojure-style `loop`/`recur` expression**, plus prelude **`Array.forEach`**
(`(a -> unit) -> [a] -> unit`) for pure effect iteration.

```
let sum = (xs) =>
  loop (acc = 0, i = 0) {
    switch Array.get(i, xs) {
      | None => acc
      | Some(x) => recur(acc + x, i + 1)
    }
  }
```

- `loop (name = init, …) { body }` is an **expression**; `recur(e, …)` in tail
  position rebinds the params and continues; any non-recur tail value is the
  loop's result. No mutation surfaces — it stays confined to the emit.
- **Keywords.** `loop`/`recur` are real keywords (lexer). Corpus cost: one
  rename (`examples/life` bound `let loop`, now `tick`).
- **Types.** Inits infer in the outer context; params bind **monomorphic**;
  `recur` args unify with the nearest loop's param types and the node itself
  types as a fresh var (bottom-like, so it unifies with the other tails);
  the loop's type is its body's. Param monotypes ride the existing `letParams`
  channel so TS emit annotates the loop `let`s (ADR 0035 mechanism).
- **Checks** (`checkLoops`): `recur` only in tail position of the *nearest*
  loop (tails: loop body, ternary branches, switch arm bodies, letin bodies;
  lambda/letbind are hard boundaries); arity must match; duplicate params and
  letin shadowing a loop param are rejected (the rebind emit depends on it).
- **Emit.** Statement context (a loop directly under a lambda body, or at the
  tail of a `genLetBlock` const chain) emits a bare block
  `{ let acc = 0, i = 0; while (true) { … } }`; any other position wraps in an
  IIFE. Value tails `return`; `recur` tails rebind (`[acc, i] = […]; continue`);
  ternary/letin tails lower to `if`/`else` and `const`s. A **switch tail keeps
  its ts-pattern chain** as an expression whose arms yield `_recur(…)`/`_done(…)`
  step objects the loop dispatches on — pattern compilation is never
  reimplemented as statements, and match-free loops never reference the
  helpers. TS emit is `tsc --strict`-clean (the step helpers' typed forms live
  in the generated runtime; the rest-param infers the args tuple).

## Consequences

- Iteration-heavy mochi now emits idiomatic loops and no longer leans on JSC
  TCO — the same lowering ticket 0022 plans for LLVM.
- Bootstrap mirrors the whole node (ast/lexer/parser/check/infer/codegen
  `.mochi`), byte-parity with the TS emit across the differential corpus
  (`examples/loops.mochi`). Gotcha recorded: `plugins/jsx.mochi` re-declares
  `Tok` locally — hook signatures must stay structurally identical to the
  parser's or the TS emit trips strictFunctionTypes at the module boundary.
- **Follow-up:** adopting `loop` *inside* `bootstrap/` needs a released
  generation that parses it (fixpoint constraint) — the mirror is written in
  recursion style for now.

## Alternatives rejected

- **`for x in xs { … }` / `while cond { … }` statements** — mochi has no
  statement grammar below the top level and **zero mutability** (no `mut`, no
  `:=`, no cells): `while` would be meaningless, and `for` only covers effect
  iteration (now `Array.forEach`) while the cited cases (cursor math, byte
  chunking) accumulate values.
- **Compiler-side TCO only** — fixes stack safety on some targets, not emit
  readability; recursion still emits as recursion or an opaque trampoline.
- **Stay recursion-only** — permanently cedes iteration-heavy modules to the
  host.
