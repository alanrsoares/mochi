---
id: C3
title: "ADR: generic monadic bind vs per-monad sigils (let? / let!)"
status: in-progress
type: task
blocked-by: []
---

> **DECIDED 2026-07-26 (user-grilled): dual-purpose `let?` via head-ctor dispatch
> (Rust-`?` style). Sigil set capped forever at `let?`/`let!`.**
>
> - `let? x = e in …` works over **Option or Result**, dispatched per-binding on the
>   inferred head constructor of `e` (infer resolves `e` first; codegen consults the
>   infer table — same mechanism the typed-TS backend uses).
> - Head must be **concrete** at the bind site; unresolved tyvar = diagnostic
>   "cannot determine monad for let?".
> - **No implicit mixing** in one chain: Option-chain returns Option, Result-chain
>   returns Result; mixing is a type error — lift explicitly (`Result.fromOption`).
>   No auto-lift (rejected: error type becomes magic).
> - `let!` stays Task-only. No third sigil ever.
>
> Ticket becomes: write the ADR recording the above, then implement dispatch in
> infer/codegen (+ `_Option_flatMap` runtime, bootstrap parity, tests).

# C3 — Two hardcoded binds don't scale

**Problem:** `let?` (Result) and `let!` (Task) are per-monad keywords. Each new monad
(Option is the obvious next) costs a new sigil, new parser production, new bootstrap
parity work. Two sigils is fine; the third is where the pattern locks in.

**What to decide (ADR, before any third sigil ships):**

- One generic form — e.g. `let* x = e in …` dispatching on the type of `e`, or
  F#-style computation blocks — vs. deliberately capping at exactly `let?`/`let!`
  and rejecting further monads at the syntax level.
- If generic: how dispatch interacts with HM inference (bind's type must be known at
  the binding site — annotation or unambiguous inference required).
- Desugaring target(s): keep `Result.andThen` / `Task.andThen` as the compiled form.

- [x] ADR in `docs/adr/` with dispatch rules, error behavior when the monad is
      ambiguous, and rejected alternatives (ADR 0079).
- [ ] Implement dispatch in bootstrap first, then port it to TypeScript with
      differential tests and fixpoint parity.
