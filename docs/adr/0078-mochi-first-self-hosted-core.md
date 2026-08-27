# 0078 — Mochi-first authoring for the self-hosted core

- **Status:** Accepted
- **Date:** 2026-08-27
- **Source:** `bootstrap/`, `scripts/fixpoint.ts`, `scripts/bootstrap-tsc.ts`, [compiler self-hosting](../compiler.md#self-hosting)

## Context

Mochi's core compiler has reached a verified fixpoint: the shipped self-hosted
compiler rebuilds its graph byte-for-byte, agrees with the TypeScript build, and
its emitted TypeScript is clean under `tsc --strict`. Yet core changes have
continued to treat `packages/compiler/src/` and `bootstrap/` as equal
hand-authored implementations. That duplicates design work and leaves no clear
answer to which implementation should lead a change.

The self-hosted graph is intentionally not the whole product. It excludes DX
surfaces (formatter, IDE, LSP, Vite), and retains a small host boundary:
`bootstrap/host.mjs` and generated `bootstrap/prelude.gen.mjs`. The TypeScript
compiler also remains the trusted seed and an independently maintained parity
reference.

## Decision

For every feature or correction covered by `bootstrap/`, author the semantic
change in Mochi first. The bootstrap source defines the intended core behavior.
Port the corresponding TypeScript implementation in the same change, then run
the differential and north-star checks. TypeScript is the seed compiler and
reference oracle, not a second source of language design.

The boundary is explicit:

- **Mochi-first core:** `bootstrap/{ast,lexer,parser,check,infer,codegen,module,compile,cli,extensions,plugins}`.
- **TypeScript-owned foundation and host seams:** the bootstrap seed, strict TS
  backend and declaration emit, prelude/runtime generators, `host.mjs`, and test
  harnesses.
- **TypeScript-owned DX:** formatter, IDE queries, LSP, Vite, codemods, and apps.

Every Mochi-first core change must keep `bun run fixpoint` and `bun run
bootstrap:tsc` green. A scope-expanding feature may be designed in TypeScript
first only when the existing bootstrap compiler cannot parse or typecheck the
required Mochi form; it must add the bootstrap support before the new form is
used in `bootstrap/`.

## Consequences

- Core work has one design source while preserving the independent TS oracle
  that catches self-hosting regressions.
- A core PR still normally changes both representations, but the order and
  review question are clear: Mochi defines behavior; TS must agree.
- Full-project Mochi-only development is not claimed. Removing the remaining
  TS seed/reference role requires a later, separately approved bootstrap-chain
  decision.

## Alternatives rejected

**Keep dual-form authoring indefinitely.** It preserves a useful oracle but
makes every core design decision twice and obscures ownership.

**Declare all TypeScript generated from Mochi now.** Mochi has no compiler-to-TS
source generator for its own implementation, and the seed, host, strict TS, and
DX boundaries are real responsibilities rather than accidental duplication.

**Drop the TypeScript reference now.** A fixpoint alone proves reproducibility,
not agreement with an independent implementation or strict TypeScript output.
