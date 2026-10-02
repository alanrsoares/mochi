# 0139 — Fuse immediate optional-field matches

- **Status:** Accepted
- **Date:** 2026-10-02
- **Source:** `bootstrap/codegen.mochi` (`genOptionalMatch`), `docs/optional-read-benchmark.md`

## Context

Optional record reads produce `Option<T>`. An immediate Some/None switch wraps
the raw property value, tests the tag, and destructures the temporary object.
The benchmark's specialized match was substantially faster on Bun and Node.
Hoisting the wrapper alone did not consistently improve both engines.

## Decision

Fuse only an optional `EField` scrutinized by exactly two unguarded, unqualified
arms: `Some(binding)` or `Some(_)`, and `None`, in either order. Require the
constructor registry's builtin layout (`Some.value`, nullary `None`). Emit one
raw member read into a collision-free IIFE parameter, one nullish branch and
only the selected body. The payload binding lives in the present branch.

Retain ordinary lowering for guards, catch-all bindings, aliases, nested payload
patterns, qualified constructors and other layouts. Do not rewrite an escaping
Option. Typed fallback wrappers keep `_tag` literals with `as const`, so ordinary
Some/None narrowing survives TypeScript inference.

## Consequences

The fused path emits no intermediate Option object. Target evaluation, getters,
nullish handling, branch effects, captures and source binding scopes retain their
behavior. JS and TS share eligibility and lowering; TS infers the raw value from
the member expression and narrows it at the nullish branch.

Seed-owned specs pin eligibility and layout fallbacks. Integration guards cover
single evaluation, both branch orders, wildcards, falsy values and name collisions;
strict-TS fixtures include generics, nested matches, closures and guarded fallbacks.
The benchmark compares production output with the frozen previous match body.

## Alternatives rejected

- **Read the property twice in a ternary:** repeats getters or target effects.
- **Hoist every wrapper:** keeps escaping Option objects and lacks a consistent
  cross-engine timing win.
- **Fuse arbitrary patterns and guards now:** requires a broader pattern plan and
  preservation of observable Option values; the narrow case has measured value.
