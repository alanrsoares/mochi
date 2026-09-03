# 0105 — Bootstrap conformance corpus replaces the TS core oracle

- **Status:** Accepted
- **Date:** 2026-09-04
- **Source:** [ADR 0090](0090-bootstrap-chain.md), [issue #66](https://github.com/alanrsoares/mochi/issues/66), [issue #70](https://github.com/alanrsoares/mochi/issues/70)

## Context

The frozen stage-1 graph is already TypeScript emitted from `bootstrap/*.mochi`.
The CLI and editor graph paths execute that graph.  The remaining hand-authored
TypeScript core is retained by one important invariant: `scripts/fixpoint.ts`
also builds the graph with that core and requires byte-for-byte agreement.

That comparison is a useful migration oracle, but it cannot survive deletion of
the implementation it executes.  Removing it without a replacement would leave
only a self-reproducing binary fixpoint: evidence of reproducibility, not of
language behaviour.  ADR 0090 therefore requires an explicitly justified,
independent validation story before the duplicated core can be retired.

## Decision

Replace the TypeScript-core parity build with a reviewed, committed black-box
**bootstrap conformance corpus**.  The corpus is an executable contract, not an
output cache and not another compiler implementation.

Each case owns a Mochi input plus checked-in expectations for the relevant
observable result:

- successful single-file compile: emitted JavaScript bytes;
- rejected input: diagnostic kind, message, and half-open span;
- module graph: dependency-ordered emitted outputs and error location;
- executable program: its declared observable runtime result;
- typed emission: strict `tsc` outcome where the case exercises that backend.

The runner invokes the shipped bootstrap seed through its typed host façade; it
does not import `packages/compiler/src/{lexer,parser,check,infer,codegen,module,compile}`.
Expected data is captured from the accepted pre-deletion behavior, reviewed in
the same change as a fixture, and may change only by an intentional language
decision with an accompanying regression test.  A `conformance:freeze` helper
may create candidate expectations for review, but the normal gate never rewrites
them.

`bun run check:full` must run the corpus before #70 may remove the TypeScript
core.  The existing stage-2/stage-3 fixpoint and `bootstrap:self-tsc` remain;
the corpus supplies behavioural regression evidence that neither provides.

## Consequences

- The bootstrap chain remains self-hosting and strict-TS-clean while its
  behaviour is checked independently of its current implementation.
- The first delivery slice is infrastructure plus a representative cross-section
  of compile, diagnostics, graph, runtime, and typed-emission cases.  It runs
  alongside TS parity until coverage is accepted.
- The final deletion slice replaces `stage2 ≡ TS` in `fixpoint` with the corpus,
  removes the TypeScript-core imports from tests and host paths, then deletes the
  duplicated passes.  It cannot merely remove the comparison.
- New language-visible behaviour adds a corpus case when its observable output,
  diagnostic, graph semantics, or runtime result is part of this boundary.

## Alternatives rejected

**Keep the TypeScript core solely as an oracle.** It preserves a strong
differential check but fails the stated goal: two hand-authored cores remain
forever.

**Use stage-2 == stage-3 alone.** A compiler that consistently reproduces the
same wrong output passes a binary fixpoint, so this measures reproducibility
rather than conformance.

**Regenerate expectations on every run.** That makes the compiler approve its
own output and turns regressions into updates.  Candidate regeneration is useful
only as a reviewed authoring aid.
