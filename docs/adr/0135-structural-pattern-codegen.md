# 0135 — Structural pattern compilation behind a small interface

- **Status:** accepted
- **Date:** 2026-10-02

## Context

The shared JS/TS emitter passes its full `GCtx` through recursive pattern
conditions, destructuring, and type refinement. These functions use only
constructor field keys. Changing a nested pattern requires navigating expression
emission, annotation hooks, and runtime analysis in the same large module.

## Decision

Move structural pattern compilation into `bootstrap/codegen-pattern.mochi`.
Its interface has three pure operations, each accepting constructor field keys
and a checked pattern:

- `patConds` takes a scrutinee path and returns ordered structural tests.
- `patSlot` returns the JS destructuring slot, or an empty string if nothing binds.
- `patTarget` takes a TS base type and returns the refined type text.

Keep recursive constructor, record, tuple, array, and or-pattern handling
private. Callers provide checked patterns: tuple arity and or-pattern binding
alignment are established by the checker, which also rejects nested lazy Lists.
Conditions retain their ordering so outer tests protect nested field accesses.

Use separate operations rather than an aggregate `PatternPlan`: lazy-List
consumers need only conditions or slots, shallow TS arms need no refinement,
and JS compilation must not calculate unused TS targets. The interface receives
no expression-emission callbacks and has no dependency back to codegen.

Move the existing string and pattern literal encoders into
`bootstrap/codegen-literals.mochi`, shared by both modules, so escaping stays
identical without a dependency cycle or an injected rendering callback.

Match-arm expression assembly, flat matcher objects, TS shallow-arm selection,
and lazy iterator pulling remain with their existing codegen owners. This is
one extraction; it does not split the mutually recursive expression emitter.

## Consequences

Structural pattern changes and focused specs live together. The ternary emitter,
TS guard emitter, and lazy-List element emitter cross the same small interface.
No language behavior or emitted JS/TS text changes. Existing conformance
snapshots, semantic guards, strict TS checks, and self-hosting gates remain the
integration contract; colocated Mochi specs exercise the extracted interface.
