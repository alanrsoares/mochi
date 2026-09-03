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

## Amendment — the formatter moves to Mochi-first core (2026-09-02)

The original boundary listed the formatter under **TypeScript-owned DX**,
alongside IDE queries, LSP, Vite, codemods, and apps. That grouping was correct
when written: `bootstrap/format.mochi` was a partial hand-port with no command
that reached it, no place in the fixpoint graph, and no coverage from
`bootstrap:tsc` — the north-stars could not have caught a regression in it, so
naming it a source of truth would have been aspiration rather than a rule with
teeth. A warn-only `pre-push` hook stood in for the missing gate.

Three conditions have since been met, in this order:

1. **Byte parity, gated.** `test/bootstrap-format-file.spec.ts` formats every
   non-JSX `.mochi` file in the repo through both implementations and compares
   byte for byte, in the default `bun run check`. A one-sided change now fails
   the gate, which retires the drift hook and makes authoring order free.
2. **Reachable and shippable.** `mochic fmt [--write]` in `bootstrap/cli.mochi`
   composes `lex → parseRecovering → formatProgram`, so `format` is reachable
   from the `bootstrap:tsc` entry and typechecks strict-clean with the rest.
3. **In the fixpoint graph.** `format`, and its `doc` and `show-type-expr`
   dependencies, are registered in `scripts/fixpoint.ts`: stage2 ≡ stage3 ≡ TS.

The boundary is therefore amended:

- **Mochi-first core** additionally covers `bootstrap/{format,doc,show-type-expr}`.
- **TypeScript-owned DX** is now IDE queries, LSP, Vite, codemods, and apps.

`packages/dx/src/format.ts` remains the *shipped* formatter and the parity
oracle — this amendment changes which implementation leads a change, not which
one users run. Two consequences follow from that split:

- Plugin `format` hooks stay a TypeScript-host seam; bootstrap has no format
  hook protocol (ADR 0011 §6). JSX files are the one parity exclusion, and a
  formatting rule that exists only inside a plugin hook is out of scope for
  `format.mochi` until that protocol is designed.
- The `@mochi/dx` API surface around the formatter (option records, the
  `Result` shape, exports the LSP and CLI consume) is not core; it may change
  in TypeScript alone so long as the printed bytes still match.

Retiring `format.ts` altogether would mean routing `@mochi/dx`, the LSP, and
the Vite plugin through built bootstrap output. That is the same
seed/host-chain question ADR 0090 governs, and it stays a separate decision.
