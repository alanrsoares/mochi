# 0001 — Result-threading over exceptions

- **Status:** Accepted
- **Source:** pervasive across `src/*.ts`; `docs/PATH_TO_BOOTSTRAP.md` §1; dep `@onrails/result`

## Context

A compiler is a long pipeline where many stages can fail with a located error. The
control-flow choice — exceptions vs. errors-as-values — sets the shape of every module
and every seam between them.

## Decision

Every pass (`lexer`, `parser`, `check`, `infer`, `unify`, `compile`, `format`, `dts`)
returns `Result<T, AlangError>`; the async module driver returns `ResultAsync`. Errors
are ordinary values threaded through the railway, short-circuiting at the first `Err`.

## Consequences

- The failure surface is visible in every signature; a stage can't silently throw past
  its caller. Diagnostics fall out naturally (`diagnostics.ts` is 0-or-1 because the
  railway stops at the first error).
- Directly ports toward self-hosting: mochi source is already `Result`-shaped, so the
  TypeScript compiler's structure maps onto the language it compiles.
- `throw` survives only as a local implementation detail (ADR 0002's `ParseAbort`, one
  codegen invariant) — never as cross-module plumbing.

## Alternatives rejected

Exception-based propagation as the default — hides the failure surface and fights the
data-last, value-oriented style the rest of the language leans on.
