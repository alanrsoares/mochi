# 0017 — `let? param = value in body`: monadic bind on Result/Task

- **Status:** Accepted
- **Source:** `src/ast.ts` (`{ kind: "letbind"; monad: "Result" | "Task" }`), `test/letbind.spec.ts`, `bootstrap/parser.mochi`

## Context

Chaining `Result`/`Task`-returning calls with `switch` on every step is
correct but noisy — the common case is "bind the Ok payload, short-circuit on
Err" (or the `Task` analogue), which is exactly monadic bind and deserves its
own syntax rather than repeated pattern matches.

## Decision

Add `let? param = value in body`, a dedicated expression node tagged with
which monad it binds (`"Result" | "Task"`). `value`'s `Ok`/resolved payload
binds `param` in `body`; an `Err`/rejection short-circuits the whole
expression. Lowers to `_Result_flatMap((param) => body)(value)` (or the
`Task` runtime equivalent).

## Consequences

- One syntax form covers both monads instead of two near-duplicate ones;
  the `monad` tag on the node picks the runtime helper at codegen time.
- Composes with pipe-flattening (ADR-0032) so the TS backend can still infer
  `param`'s type from `value` rather than the flat helper call's own generic
  signature.

## Alternatives rejected

- **Separate `let?result`/`let?task` keywords** — same semantics, more
  surface syntax for no expressive gain.
