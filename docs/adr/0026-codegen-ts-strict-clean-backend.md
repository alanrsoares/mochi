# 0026 — `codegen-ts.ts`: strict-`tsc`-clean typed TS backend

- **Status:** Accepted
- **Source:** `src/codegen-ts.ts` (commit 91b8df9), `src/codegen.ts`, `test/codegen-ts.spec.ts`, `test/ts-emit-tsc.spec.ts`

## Context

mochi already emits plain JS via `codegen.ts`. A second backend that emits
typed TypeScript needed to exist without duplicating the AST-to-output
traversal — and needed a real, checkable bar for "typed" beyond "has some
annotations": `tsc --strict` must accept the output with zero errors.

## Decision

`codegen-ts.ts` wraps `codegen.ts` rather than reimplementing lowering: it
walks the same AST shape but feeds type annotations sourced from the
inference table (`infer.ts`'s solved types) at each binding/parameter/return
position `codegen.ts` leaves untyped. The self-hosted `bootstrap/` graph is
the accountability target — `bun run bootstrap:tsc` measures `tsc --strict`
error count on its own emitted TS and is a ratchet: it must not regress
above the last recorded count (0, since 2026-07-23; ADRs 0032–0044 chased it
down from 537).

## Consequences

- One AST traversal, two backends — bugs in either share the same shape-level
  fix instead of drifting apart.
- `bun run bootstrap:tsc` is a standing regression guard for every future
  change to inference or codegen, not just a one-time migration checkpoint.

## Alternatives rejected

- **A separate typed-TS-specific AST-to-string pass** — duplicates every
  future codegen fix across two independent traversals.
