# 0087 — Top-level expression statements are unit

- **Status:** Accepted
- **Date:** 2026-08-27
- **Source:** `packages/compiler/src/parser/parser.ts`, `bootstrap/parser.mochi`
- **Deepens:** [ADR 0054](0054-unit-value-and-ignore.md) (`()` / `ignore`), [ADR 0071](0071-do-notation.md) (`do`), [ADR 0086](0086-bun-test-bindings.md)
- **Supersedes:** ADR 0086's rejected alternative "top-level `test(...)` statements"

## Context

Top-level was declarations only. Effectful entry points paid `let _ = log(msg)`
or a discarded `let _ = do { test(...); test(...) }` — the shape ADR 0086
shipped for `*.spec.mochi`. ReScript writes `test("name", () => …)` at module
scope. The discard was the last thing standing between that and Mochi.

## Decision

A top-level expression is a statement when it is not a declaration keyword.
It must infer as `()`. Codegen emits `expr;`. A trailing semicolon is optional.

```mochi
test("numbers", () => 1 + 1 |> assertEq(2))
log(message)
do { ignore(setup()); run() }
```

`1 + 1` at top level is a type error (`cannot unify number with ()`). Bind it
with `let`, or discard with `ignore`.

Lets still SCC-generalize first; expression statements typecheck against the
final env, in source order for emit.

## Consequences

- Spec files drop `let _ = do { … }`.
- Formatter hugs `})` on trailing-lambda `do` / discarded-`let _` brace bodies
  (same rule as `switch` / `loop`).
- Recovery still syncs on declaration keywords; a parse error in one `test(…)`
  may skip following expression statements until the next `let`/`type`/eof.

## Alternatives rejected

- **Keep `let _ = do { … }`.** Honest, already in the language, and ugly in
  every spec.
- **`test`/`describe` as keywords.** Magic; ReScript didn't need it.
- **Any type, discarded.** OCaml warns; requiring `()` is the same rule `ignore`
  already teaches.
- **Calls and `do` only at parse time.** Better errors for a forgotten `let`,
  worse language. Unit-checking is the one rule.
