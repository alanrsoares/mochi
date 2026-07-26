# 0036 — Emit tuple literals via a `_tuple(a, b)` runtime helper

- **Status:** Accepted
- **Source:** `src/codegen.ts:73`, `src/codegen-ts.ts:276,286`, `src/prelude.ts:135`, `test/ts-emit-tsc.spec.ts:107`

## Context

A tuple literal has no contextual tuple type for `tsc` to infer from at a
bare array-literal call site (`[a, b]` infers as `(A | B)[]`, not `[A, B]`)
unless the surrounding context already expects a tuple — which isn't always
true (e.g. passed through a generic, or stored in an inferred local).

## Decision

For the TS backend, emit a tuple literal as a call to a small runtime helper,
`_tuple(a, b)`, typed in the prelude so `tsc` infers the call's return type
as the fixed-length tuple `[A, B]` instead of widening to an array. The JS
backend keeps the plain `[a, b]` array literal (`codegen.ts`) since JS has no
such inference to protect.

## Consequences

- Tuple-typed values keep their fixed arity/positional types through `tsc`
  inference regardless of surrounding context, at the cost of one extra
  runtime call per tuple literal in the TS backend's output text.
- The prelude's `_tuple` signature is now part of the TS backend's "public"
  runtime surface, alongside the other `_`-prefixed emitted helpers.

## Alternatives rejected

- **Rely on contextual typing at each call site** — works only where a tuple
  type is already expected; breaks the moment a tuple flows through a
  generic or an inferred (unannotated) local.
