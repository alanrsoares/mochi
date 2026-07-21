# 0017 — `let?`: monadic bind on Result

- **Status:** Accepted
- **Source:** Slice D verdict (`docs/PATH_TO_BOOTSTRAP.md` §2.4) — the bootstrap
  parser threads `Result((node, pos), err)` through every production; the worst
  chains (`parseExtern`, `parseLetIn`) nest 6–7 `Result.flatMap` continuations
  of pure position-threading

## Context

Railway code in alang is written with combinators:

```
expectTok(TLet, toks, pos) |> Result.flatMap(p =>
expectId(toks, p) |> Result.flatMap(((nm, p1)) =>
expectTok(TEq, toks, p1) |> Result.flatMap(p2 =>
  ...)))
```

Fine at 2–3 steps; at 6–7 the nesting is all ceremony. The TS compiler avoids
this with early returns (`if (isErr(r)) return r`); an expression language
needs a binder. This was deliberately deferred until the bootstrap ports
measured real pain (PATH §6: no do-notation as a prerequisite) — Slice D
measured it, and Slice E (infer threads substitution *and* env) will be worse.

## Decision

`let? param = value in body` — monadic bind, **Result only**.

- **Syntax** — `let` followed by the existing `?` token (ADR 0016), then any
  lambda-param form: a name, an `(a, b)` tuple, or an `{ a, b }` record
  destructure. `in` stays the contextual keyword from `let … in` (ADR 0009).
  Whitespace between `let` and `?` is accepted; the formatter prints `let?`.
- **Types** — `value` unifies with `Result a e`; the param binds `a`
  **monomorphically** (it's a lambda param under the hood, same as tuple-binding
  sugar, ADR 0011 — unlike `let … in`, which generalizes); `body` unifies with
  `Result b e` — the **same error type** `e` — and the whole expression is
  `Result b e`. Errors point at the value / param / body spans respectively.
- **First-class AST node** (`letbind`), not a parser desugar: the bootstrap
  sources will be saturated with it, so the formatter must round-trip the sugar
  (the tuple-binding precedent of desugar-at-parse prints its expansion — fine
  for a corner form, not for a mainline one), and the type errors above must
  speak in terms of `let?`, not of a synthetic `flatMap` call.
- **Codegen** — `_Result_flatMap((param) => body)(value)`, the existing prelude
  runtime (`r._tag === "Ok" ? f(r.value) : r`). `exprRefs` pulls
  `_Result_flatMap` into the standalone preamble; `runtimeDeps` closes over
  `_curry`.

## Alternatives rejected

- **Monad-generic bind** (`let?` over Option/Task/List too) — needs
  type-directed elaboration, i.e. typeclasses; the "bridge, not typeclasses"
  decision (CRITIQUE reflection) rules that out. Option chains lift with
  `Option.okOr`-style adapters or stay on `Option.flatMap`.
- **Gleam-style `use param <- fn(args)`** — fully general CPS sugar (works for
  any callback-last function), but the capture rule ("the rest of the enclosing
  block becomes the callback") is alien to alang's expression grammar, which
  has no blocks.
- **Rust-style postfix `?`** (`let x = e? in …`) — the same semantics with
  non-local continuation capture: the `?` has to reach out and wrap the rest of
  an enclosing expression it can't see. `let?` keeps the capture explicit at
  the binder.

## Consequences

- Exactly the measured chains flatten: a 7-deep `parseExtern` becomes seven
  flat `let?` lines ending in an `Ok(…)`. A trailing `Result.map(f)` becomes
  `let? x = … in Ok(f(x))` — one wrap, same meaning.
- `let?` assumes the **builtin Result shape** (`{_tag: "Ok", value}`). A user
  redeclaration of `Result` still unifies (same con name/arity), but if its Ok
  ctor doesn't carry a `value` field the runtime bind reads `undefined` — the
  same hazard every `Result.*` combinator already has. Redeclare compatibly or
  don't use `let?` against it.
- Slice E inherits the binder before porting infer — its two-state threading
  was the reason to do this now.
- The bootstrap lexer needs no change (`?` already lexes); the bootstrap parser
  gains `ELetBind` for parity, and both `.al` files migrate their deep chains
  (differential suites pin behavior).
