# 0038 — Eager-array match with no catch-all: emit an exhaustive-check helper

- **Status:** Accepted
- **Source:** `src/codegen.ts:565`, `test/ts-emit-tsc.spec.ts:131`

## Context

An array/list pattern match (`switch xs { [] => …, [h, ...t] => … }`) that
mochi's exhaustiveness checker accepts as covering every case has no
catch-all arm by construction — the checker already proved coverage. `tsc`,
however, doesn't know that from the emitted `if`/`else` chain alone: without
a final `else` its own control-flow analysis can leave the match's result
type as possibly-`undefined`, or a downstream `@onrails/pattern` `.exhaustive()`
call sees a non-exhaustive-looking switch.

## Decision

For the TS backend, an eager-array match with no catch-all arm (because
exhaustiveness already proved coverage) emits an explicit
exhaustive-check helper as the final fallback branch instead of leaving the
chain open — giving `tsc` a terminal branch to close out control flow
without changing runtime behavior (the helper is unreachable given mochi's
own coverage proof, but its presence satisfies `tsc`'s narrower reachability
model).

## Consequences

- `tsc --strict` accepts the emitted match as covering every path without
  requiring mochi to weaken its own (already-sound) exhaustiveness proof.
- The eager-array codegen path and the checker's exhaustiveness proof must
  stay in lockstep — the helper is only safe to emit where the checker has
  actually verified coverage.

## Alternatives rejected

- **Emit no fallback, rely on `tsc`'s control-flow narrowing** — `tsc`'s
  narrowing over array/tuple length patterns isn't precise enough to always
  agree with mochi's own coverage proof.
