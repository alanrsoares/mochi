# ADR 0131 — Delete the hand-authored TypeScript compiler core

Status: Accepted
Date: 2026-10-01
Issues: #105, completes #70

## Context

The public compiler barrel, CLI, DX, LSP, Vite, and vendor plugins run through
the frozen self-hosted graph. ADR 0130 migrated the remaining core specs,
retired public core subpaths and the duplicate TS-oracle ratchet, and moved
runtime annotation printing onto the seed. No surviving consumer needs the
hand-authored passes.

## Decision

Delete the TypeScript lexer, parser, checker, inference, codegen, module,
compile, and declaration-emission directories. Keep the used AST/type DTOs,
diagnostics, document utilities, compatibility plugin seam, prelude/runtime,
bootstrap façades, and DX. They are host-facing modules, not a second compiler.
The core-boundary guard rejects retired imports, exports, and directories.

Author compiler behavior only in `bootstrap/*.mochi`. Refresh the checked-in
generated `bootstrap/seed/` through `seed:freeze`; never hand-edit it. The
committed stage-1 seed emits its successor. `seed:check` detects stale artifacts,
fixpoint proves stage2 equals stage3, `bootstrap:self-tsc` requires zero strict
TypeScript errors, and reviewed conformance guards observable behavior.

This supersedes ADR 0078's requirement to port each Mochi change to a
hand-authored TypeScript twin, its dual-write consequence, and its independent
TS seed/reference role. Its historical text remains intact. ADR 0090 still
governs the generated seed chain; ADR 0105 governs behavioral contracts.

## Consequences

There is one compiler authoring source. Deleting the unused twin changes no
language behavior and requires no seed refresh. Regression protection remains
in seed-owned unit and property specs, conformance, and host integration tests.

TypeScript remains the language of host tooling, the runtime source of truth,
and the generated stage-1 execution artifact. The repository is not Mochi-only,
and an independently maintained TypeScript reference no longer exists.
