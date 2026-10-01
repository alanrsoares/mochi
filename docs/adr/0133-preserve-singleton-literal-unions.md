# ADR 0133 — Preserve singleton literal unions

Status: Accepted
Date: 2026-10-01
Issue: #108

## Context

The styled-cva plugin builds finite unions from configured variant keys.
`tUnion` collapsed one member to a bare literal, so generalizing an
unannotated component widened its only allowed prop value to `string`.
Two-key variants stayed precise, and declarations already printed the
single-key constraint.

## Decision

Keep a one-member literal union as `TyOneOf`, including after flattening
and deduplication. Bare literal values still widen as specified in ADR 0081.
Empty unions retain the existing string fallback; a single nonliteral
member still unwraps. No plugin-specific inference exception is needed.

## Consequences

Single-key variants reject unknown literals consistently with multi-key
variants. Generalization, substitution, and copied component bindings
preserve the constraint; type display and declaration output keep their
existing spelling. Seed-owned tests and a full-pipeline JSX guard cover it.
