# 0142 — Separate optimization snapshots from JS comparisons

Status: Accepted

## Context

The README's runtime card shows gains against earlier Mochi implementations.
An algorithmic improvement over a quadratic baseline can produce a large ratio
without establishing how current emitted code compares with handwritten JS.
The existing CodSpeed cases measure compiler/tooling operations and do not
provide that runtime comparison either.

## Decision

Label the card as historical runtime optimization snapshots, disclose the unique
ID distribution, and keep its recorded before/after measurements intact. Publish
a separate comparison of actual current generated JS and equivalent handwritten
JS, including a collection pipeline and unique/repeated-key distributions.

Run four independent fresh-process rounds with alternating implementation and
engine order. Warm and measure batches, consume results, check outputs outside
timing, and retain raw samples plus emitted fixtures and compiler/engine versions.
Report medians of process medians and their range. Benchmarks run explicitly;
docs builds only regenerate assets from recorded measurements.

## Consequences

Historical ratios establish the effect of individual Mochi optimizations. JS
comparisons establish remaining overhead for the stated workloads. Neither
establishes application throughput or memory savings. Results and unfavorable
comparisons are published together; timing regressions are not CI test failures.
