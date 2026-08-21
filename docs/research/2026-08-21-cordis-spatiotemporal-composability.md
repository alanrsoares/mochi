# Cordis and Mochi: spatiotemporal composability

**Question.** What from *A Programming Paradigm for Spatiotemporal Composability*
could usefully apply to Mochi?

**Source status.** The paper is an August 13, 2026 draft preprint and says that it
is under active revision. Findings below are therefore design input, not settled
facts or an implementation commitment. [Paper repository README](https://github.com/cordiverse/paper/blob/main/README.md).

## What the paper contributes

The paper names two requirements for a runtime-extensible system:

- **Temporal composability:** removing a component restores the shared context it
  changed. A *revertible effect* returns an inverse when it is applied; the runtime
  records inverses and can unwind them. Independent effects can be removed in an
  order other than strict LIFO only when their transformations commute.
  [§§3.1–3.1.3, pp. 9–17](https://github.com/cordiverse/paper/blob/main/paper.pdf)
- **Spatial composability:** a component declares the capabilities it needs. A
  *reactive coeffect* context re-evaluates that specification on every context
  transition, activating a dependent once needs are present and deactivating it
  when a need disappears. Teardown is ordered so dependents finish before the
  provider they need is withdrawn. [§3.2, pp. 17–22; §5.1, pp. 57–60](https://github.com/cordiverse/paper/blob/main/paper.pdf)

The resulting runtime component model also includes derived contexts for isolation
and interception, asynchronous lifecycle transitions, configuration reconciliation,
and transactional hot-module replacement. [§§3.2.3, 4.3, 5.2, pp. 20–22, 33–38,
61–66](https://github.com/cordiverse/paper/blob/main/paper.pdf)

Two boundaries are especially important. The paper requires authors to provide
atomic inverses; its runtime does not prove that arbitrary host effects are
reversible. It also treats restoration observationally: exact heap identity or
external emissions may not be recoverable, so external effects require withholding
or compensation instead of a literal rollback. [§3.3.2, pp. 23–26; §5.1.1 and
§6.1, pp. 56, 67–68](https://github.com/cordiverse/paper/blob/main/paper.pdf)

## Fit with Mochi

Mochi is already well positioned to *describe* a component's capability surface:
its HM inference and row-polymorphic records can model structural `needs` and
`provides` records. Its existing `Task a e` supplies lazy asynchronous work and
an explicit error channel. But Mochi deliberately does **not** track effects in
the type system: domain effects are a convention at the `extern` boundary.
[CONTEXT.md](../../CONTEXT.md#effects--a-convention-not-a-feature) and
[ADR 0005](../adr/0005-prelude-task.md) make that choice explicit.

Therefore this paper is not a reason to add effect rows, algebraic-effect handlers,
or dynamic component lifecycle rules to the compiler. Mochi's `LanguagePlugin`
mechanism is a compile-time, cross-pass syntax/type/tooling extension seam; its
module graph is statically compiled. They solve a different problem from runtime
loading and unloading. [ADR 0011](../adr/0011-language-plugins.md).

The useful application is a separate, opt-in runtime package (for example
`@mochi/runtime-components`) with a small host API and optional Mochi declarations
or thin surface sugar:

```text
Component<Needs, Provides, Config>
provide : key -> value -> Resource
use     : key -> Task value error
```

`Resource` would own a disposer. The runtime would track resources per component,
resolve typed capability keys, activate a component only after its declared needs
are available, and deactivate dependents before disposing a provider. `Task a e`
would sequence asynchronous setup and cleanup. This makes an existing boundary
more explicit without changing normal Mochi programs or Algorithm W.

## A bounded first experiment

Build the host library before language changes. Its acceptance tests should cover:

1. Provider removal deactivates dependents before provider disposal.
2. Replacing a provider reconciles dependents without leaking registrations.
3. Async setup/teardown and failure rollback leave no owned registrations behind.
4. A failed development reload retains the previous working configuration.
5. Runtime dependency cycles produce diagnostics rather than unresolved waiting.

The contract must state the system boundary precisely: only registrations and
resources owned through `Resource` are reversible. Files, network requests,
arbitrary JS mutation, and already-emitted messages are outside that guarantee
unless their host adapter provides a compensating action. Similarly, same-key
registrations such as ordered middleware must declare ordering rather than claim
the paper's independent-removal result.

## Recommendation

Adopt the vocabulary—especially *owned reversible registration*, *declared needs*,
and *dependency-ordered teardown*—for any future Mochi agent/runtime or live plugin
host. Keep it a library-level experiment first. Only consider language-level
capability typing after real component APIs demonstrate a stable, useful shape;
the paper itself is a runtime model and does not mechanically verify host-provided
inverses.
