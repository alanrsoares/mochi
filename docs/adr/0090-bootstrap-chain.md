# 0090 — Mochi-emitted TypeScript for stage 1

- **Status:** Accepted
- **Date:** 2026-08-28
- **Source:** [issue #68](https://github.com/alanrsoares/mochi/issues/68),
  `scripts/fixpoint.ts`, [ADR 0078](0078-mochi-first-self-hosted-core.md)

## Context

ADR 0078 makes `bootstrap/*.mochi` the authoring source for the self-hosted
core, while the TypeScript compiler still builds the stage-1 binary and serves
as a differential parity oracle. That leaves a hand-authored TypeScript core
in the bootstrap chain indefinitely. A binary fixpoint only establishes that a
compiler reproduces its own output; it does not establish agreement with a
separate implementation.

Stage 1 therefore needs a durable source that does not recreate the core in
TypeScript. Two candidates were considered: freeze a known-good emitted
bootstrap binary, or emit the TypeScript graph from Mochi via `codegen-ts` and
the type-rendering machinery it shares with declaration emission.

## Decision

Stage 1 will be a TypeScript graph emitted from `bootstrap/*.mochi`, executed
by Bun and checked with `tsc --strict`. `codegen-ts` and the shared
declaration/type-rendering layer must first be self-hosted. The emitted graph
is a build product, never an authoring source: compiler behavior remains a
change to `bootstrap/*.mochi`.

The chain is:

```text
Mochi -> emitted stage-1 TS -> stage-2 JS -> stage-3 JS
                                  |             |
                                  +-- byte-for-byte fixpoint --+
```

`stage-2 == stage-3` remains the reproducibility guard. During the migration,
the current hand-authored TypeScript compiler remains an independent
differential oracle: its closed-world build must still agree byte-for-byte
with the bootstrap stage's output. It is removed only by a later ADR that
replaces that agreement check with an explicitly justified independent
validation mechanism.

A frozen JavaScript graph may bridge the migration while the typed backend is
ported, but it is not the target seed. It remains manifest-verified and is
deleted once the emitted TypeScript graph is the executable stage 1.

## Consequences

- The bootstrap chain can eventually run without a hand-authored TypeScript
  implementation of the core while retaining strict TypeScript validation.
- The bootstrap graph gains a typed-emission backend and graph driver before
  the TypeScript core is deleted.
- The TypeScript core and its differential build remain temporarily; this ADR
  does not authorize deleting either one.
- `tsc --strict` validates the emitted stage-1 program, but does not substitute
  for differential semantic agreement.

## Alternatives rejected

**Keep a frozen JavaScript binary as the permanent seed.** It is a workable
bridge but a static artifact. It cannot naturally advance with new bootstrap
syntax or typed-emission improvements, and each refresh needs a separate
escape hatch.

**Keep the TypeScript-built seed indefinitely.** It preserves a strong
differential check but prevents retiring the hand-authored core clone.

**Delete the differential check with the TypeScript core.** Fixpoint equality
alone is insufficient evidence of agreement. That removal requires its own
decision and a replacement independent validation story.
