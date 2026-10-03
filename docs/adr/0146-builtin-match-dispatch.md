# 0146 — Flat dispatch for builtin Result and Option matches

- **Status:** Accepted
- **Date:** 2026-10-03
- **Source:** issue #179
- **Amends:** ADR 0113 for eligible builtin matches.

## Context

Nested ternaries and immediately invoked destructuring functions obscure even
simple Err/Ok and None/Some matches. Matcher builders previously added substantial
overhead. Readability should improve without bringing those builders back.

## Decision

Emit `_Result_match(value, onErr, onOk)` and
`_Option_match(value, onNone, onSome)` for exhaustive, unguarded two-arm matches
on the builtin constructors. Payload patterns must be a binding or wildcard;
None has no payload. Either source arm order is accepted. Runtime dispatch tests
the builtin tag and invokes only the selected callback with its payload. Invalid
runtime tags retain the non-exhaustive-match invariant failure.

Use flat, uncurried internal runtime helpers. Their TypeScript signatures infer
the payload types from the first argument, then contextually type callbacks.
Separate callback return parameters preserve unions, including mixed done/recur
loop steps. Handlers use the existing lambda-body emitter, which turns let chains
into readable blocks. JS includes the helper definition through runtime dependency
collection; typed TS imports the same authored runtime definition.

Require the builtin constructor layouts, and exclude local or imported
constructor declarations even when their names and fields coincide. Qualified
constructors, guarded arms, nested payload patterns and other matches retain
their existing lowering. Also fall back when a user binding would capture the
helper name. Immediate optional-field fusion and existing direct loop statement
lowering retain their precedence. This decision does not add general statement
lowering for function tails or arbitrary expression matches.

Evaluate the scrutinee once, at the original expression position. Callback bodies
remain lazy and retain captures and lexical scope. Canonical negative/positive
handler order is safe for the disjoint builtin tags; source order matters for
guarded or overlapping patterns, which do not take this path. Builtin ADTs have
stable data tags; effectful host tag getters have no added evaluation-order
contract. No handler hoisting or matcher-builder allocation is introduced.

## Costs and validation

Both callback expressions are constructed at each match site; dispatch adds an
indirect call. We do not assume engines eliminate callback allocation or promise
a speedup for every workload. The [benchmark report](../builtin-match-benchmark.md)
compares actual old/new compiler output in fresh Bun and Node processes, including
captures, branch skew and effects, and measures compiler/formatter workloads.

Language guards cover evaluation count, selected-arm effects, reversed arms,
custom layouts, guards, nested patterns and helper-name capture. Strict TypeScript
guards include generic payloads and mixed loop steps. Seed-owned codegen cases
cover both families and arm orders; generated runtime definitions and the frozen
self-hosted seed are refreshed through repository scripts. Self-hosted TS must
remain strictly clean.
