# 0147 — Flat switches for function-tail constructor matches

- **Status:** Accepted
- **Date:** 2026-10-03
- **Source:** issue #182
- **Amends:** ADR 0113 for eligible function tails; ADR 0146 keeps priority.

## Context

Function-tail matches still introduce nested ternaries, destructuring IIFEs or
builtin dispatch callbacks. A function body already provides a statement context:
its branches can return directly without constructing handlers. Builtin
Result/Option pairs already have compact, readable dispatch helpers; preserve
that form.

## Decision

Emit one scrutinee temporary and a native `switch (temporary._tag)` for matches
directly at a lambda's tail, including after a safely flattened let chain. Accept
unguarded, distinct constructor arms whose payloads are bindings or wildcards,
and an optional final binding or wildcard catch-all. Eligible builtin
Result/Option pairs retain `_Result_match` / `_Option_match`, including function tails, after let
chains and inside custom switch cases. Reuse the existing builtin match planner
so constructor layouts, guards, namespaces and helper-name capture retain their
eligibility rules. Other eligible matches use statements, including local and
imported constructors; field layout still comes from the constructor registry.
Each case has its own block, destructures the narrowed scrutinee and
returns directly. A match without a catch-all retains a throwing default for an
invalid runtime tag.

Flatten safe let chains and eligible nested tail matches inside the cases. Keep
the existing direct loop emitter where its binding checks allow it. Reserve each
scrutinee temporary in the nested emission context: reusing an outer temporary
inside its case would capture the preceding destructuring in the temporal dead
zone. Pattern bindings occupy the case's lexical scope; existing let-chain
checks preserve same-name rebinding through the expression fallback.

Guards, repeated constructor tags, nested payload patterns and non-constructor
matches retain their ordered expression lowering. Immediate optional-field
matches keep their existing fusion. Matches used as arguments, binding values,
record fields or other larger expressions keep ADR 0113/0146 lowering. This is
not a general expression-to-statement pass, and it does not change loop-tail
matching or the runtime helper ABI.

Evaluate the scrutinee once and only execute the selected case. Native switch
narrowing handles both concrete and generic variants in strict TypeScript.
As with builtin runtime dispatch, this path assumes stable ADT data tags;
effectful host discriminant getters have no added evaluation-order contract.
Dependency collection may conservatively retain unused runtime helpers.

## Validation and costs

Language guards cover one scrutinee evaluation, selected effects, named and
positional fields, captures, catch-all bindings, shadowing, nested matches,
synthetic-name collisions and invalid tags. Seed-owned guards pin eligibility
and expression-context dispatch; strict TypeScript guards include generic
variants and catch-all narrowing. Regenerate the seed and docs JS/TS examples
through their existing scripts. Full checks, conformance and the self-hosted
strict TypeScript north-star must remain green.

This removes match-site handler construction and indirect dispatch calls on the
statement path, but emitted blocks occupy more formatted lines and engine
optimization remains workload-dependent. The [benchmark report](../function-tail-match-benchmark.md)
compares actual emitted code on Bun and Node, plus compiler/formatter workloads.
