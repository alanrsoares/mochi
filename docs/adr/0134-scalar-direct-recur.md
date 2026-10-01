# 0134 — Scalar temporaries for direct recur

- **Status:** accepted
- **Date:** 2026-10-02

## Context

ADR 0056 lowers direct multi-parameter recur to array destructuring. The
[loop benchmark](../loop-recur-benchmark.md) shows significant runtime costs
on Bun and allocation churn in Node's large numeric sum. Other Node workloads
optimize the arrays away, so syntactic array construction alone is insufficient
evidence of heap allocation.

## Decision

Emit direct multi-parameter recur as a block that evaluates arguments left to
right into scalar `const` temporaries, assigns all loop parameters, then
continues. No assignment happens until every argument has been evaluated.

Temporary names start at `$recur0`, `$recur1`, etc. Append `$` until each avoids
both module-wide user bindings and value references, including open-world
references. The block isolates temporaries at each recur site, including nested
loops. TS temporaries reuse each loop parameter's inferred monomorphic type;
this preserves contextual typing and prevents circular TS inference through
reassignment. JS temporaries have no annotation.

Keep single-parameter assignment and the tail-switch `_recur`/`_done` protocol.
The latter needs a separate investigation of match lowering and step values.

## Consequences

Swaps, old-value dependencies, argument effects, and captures of mutable loop
parameters retain their existing behavior. Direct recur no longer constructs
an intermediate array. The shared JS/TS emitter owns the change.

The benchmark measures actual scalar output against a reconstructed array
baseline, keeping all other compiled helpers identical. Full pipeline guards,
strict TS checks, fixpoint, and compiler/formatter timings validate the change.
