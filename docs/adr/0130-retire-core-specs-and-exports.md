# ADR 0130 — Retire TypeScript-core specs and public subpaths

Status: Accepted
Date: 2026-10-01
Issue: #104 (slice d), prerequisite for #105

## Context

The public compiler barrel and its consumers already run on the frozen
self-hosted graph (ADRs 0127–0129). Twenty colocated TypeScript-core specs
still imported the hand-authored passes. An assertion-level audit found
uncovered behavior in those specs, so deleting the files alone would lose
regression protection.

## Decision

Move compiler contracts onto the shipped seed: retain black-box tests under
`test/`, exercise symbol queries through the DX bootstrap index, and test
unification directly in `bootstrap/unify.spec.mochi`. Preserve lexer and
parser span properties through bootstrap syntax façades. Delete the redundant
composition suite only after confirming its seed-owned guards.

Drop public core subpaths, including the DTS printer and inference helpers.
All non-core sources, including specs and scripts, must observe the boundary.
The boundary guard checks both imports and the package export map.

Retire the TypeScript-only `LanguagePlugin.syncTokens` recovery hook from the
public contract. No builtin or remaining vendor plugin declares it, and the
shipped seed resumes only at core declaration keywords. Plugins continue to
extend expression parsing; custom recovery anchors would require a future
seed-side design. This supersedes ADR 0045's plugin sync-token provision.
Seed `parse` returns its first diagnostic; `parseProgram` preserves all parse
diagnostics and partial statements, while `compile` reports every diagnostic.
Codegen stays pure and emits an explicit invariant failure for an `SError`.

Fold the TS-oracle `bootstrap:tsc` ratchet into `bootstrap:self-tsc`, which
already checks the same graph with zero strict TypeScript errors. Retire the
duplicate script, test, and command. Fixpoint, conformance, `seed:check`, and
the self-hosted strict-TS ratchet remain mandatory.

Runtime-annotation drift checks use the seed's host-FFI printer and generated
prelude signatures through a synchronous bootstrap façade. They no longer
depend on the core DTS printer. This exposed an array-of-Task printing bug:
Task prints as an arrow, so an array element must be parenthesized, just like
an ordinary function. The shared seed TS printer now preserves that grouping.

## Consequences

The hand-authored core remains an internal deletion target for #105. Its
public subpaths and external consumers are gone; removing the directories
and ending the dual-write policy remain separate work.

Typed emission now honors `docs: false` for every type-header declaration.
Reviewed conformance cases guard documentation suppression and DTS basics,
including arrays of Task functions. The conformance manifest accepts a
per-case `docs` flag, using the compiler's existing option.
