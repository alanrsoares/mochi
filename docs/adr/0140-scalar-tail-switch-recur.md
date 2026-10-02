# 0140 — Scalar recur for shallow tail switches

- **Status:** Accepted
- **Date:** 2026-10-03
- **Amends:** ADR 0056's tail-switch step protocol; extends ADR 0134.

## Context

Tail switches still transport loop updates through `_recur` objects and argument
arrays. The [benchmark](../tail-switch-benchmark.md) measures a substantial cost
in numeric loops and Option scans on both Bun and Node after full-size warmup.

## Decision

Lower unguarded tail switches with literal, unit, wildcard, binding or flat
constructor patterns to statements. Evaluate the scrutinee once into a
collision-free `$loopMatch` constant. Reuse `codegen-pattern` tests and binding
slots; each selected arm uses the existing loop-tail lowering. Recur evaluates
arguments left to right into scalar temporaries before assigning loop parameters.

Flat constructor payloads may bind or discard values. Bindings that shadow loop
parameters retain the step protocol, as do guards, aliases, nested payload
patterns, records, tuples, arrays and lazy Lists. Supported outer switches may
contain fallback switches. A fallback whose every tail recurs rebinds and
continues directly, without a nonexistent done-value access in typed output.

Preserve ADR 0139's optional-field fusion in the statement path: the same
constructor-layout and exact Some/None checks select a nullish branch over one
raw member read. Escaping Option values keep their representation.

## Consequences

This changes emitted code without changing surface syntax or runtime semantics.
Arm order, payload scope, captures and argument ordering remain intact. General
matches keep their existing lowering. Helper collection follows the same
eligibility decision so simple loops omit step helpers entirely.

Guards cover effects, swaps, mutable-state captures, synthetic names, optional
fields and mixed statement/fallback nesting. Seed-owned specs, strict typed
output, self-compilation and fixpoint validate the shared Mochi emitter.
