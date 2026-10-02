# ADR 0136 — Run Task-valued playground previews

Date: 2026-10-02
Status: Accepted

## Context

The playground evaluated generated JavaScript and rendered a vnode bound to
`app`. Its async preset built a Task but never ran it; the preview showed a
hardcoded assertion about the result. Compiling all three targets did not detect
that missing behavior.

## Decision

A playground program may bind `app` to a vnode or a lazy `Task<VNode, E>`.
The preview host runs a Task-valued `app`, displays loading, then renders its
`Ok` vnode or displays its `Err`. Building the Task remains lazy. Running the
preview is the effect boundary; the compiler and emitted output are unchanged.

Each preview run has a generation. A new output, tab switch, or unmount invalidates
previous work, so late completions cannot replace a newer preview. This discards
stale results; it does not cancel the underlying effect. The async preset uses
bounded deterministic delays with success and failure, without network access.

The docs integration example shows a Mochi data function consumed by a TypeScript
Preact component, alongside those actual source files and the working UI.
Examples are checked for visible results as well as compilability.

## Consequences

A function-valued `app` is interpreted as a Task thunk; a component should be
instantiated as JSX instead. Tasks rerun when a new preview is requested.
The host owns Task execution and error rendering, while presets stay standalone
Mochi with no playground-only imports. Browser checks cover asynchronous rendering
and stale completion behavior.
