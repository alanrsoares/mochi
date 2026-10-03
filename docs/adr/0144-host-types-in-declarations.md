# 0144 — Host type spellings in declarations

- **Status:** accepted
- **Date:** 2026-10-03
- **Source:** [#176](https://github.com/alanrsoares/mochi/issues/176)
- **Extends:** ADR 0055, ADR 0011

## Context

The JSX plugin infers `VNode` but deliberately prints `any` for component
returns and VNode-valued bindings. ADR 0055 avoids an undeclared framework type
in host-independent output. This loses downstream result checking even when a
host knows the real type: the Preact playground and declaration sidecars do.
The sidecar generator's VNode alias covered written prop fields but could not
recover an erased return type.

## Decision

Add `dtsTypeNames`, a declaration-only map from inferred nominal names to host
TypeScript spellings. Hosts can pass `{ VNode: 'import("preact").VNode' }` to
`emitDts`, `compileTargets`, or graph-aware declaration emit. Local type
declarations and namespace-qualified imported types retain their own meaning.
The map supplies trusted type text; the host is responsible for making its
referenced modules and types available to TypeScript.

The declaration printer adds these names to its existing nominal-name index.
All declaration positions use it, including record fields, containers, and
plugin type rendering. The JSX binding hook uses the mapped VNode for ordinary
and curried component returns, standalone nodes, and explicitly typed VNode
parameters. Unmapped VNode bindings keep ADR 0055's `any`; unconstrained props
and the compatibility fields of open prop rows retain their existing behavior.

The map does not affect parsing, inference, JS, or typed TypeScript emit. The
shared JSX hook still sees the original type printer in typed TS, preserving
the strict-clean contract. This revises ADR 0055's declaration erasure only
when the host opts in.

`@mochi/plugin-preact` exports `preactDtsTypeNames`. Both playground compilation
paths and the sidecar generator use it. The generator no longer adds a VNode
alias by inspecting output strings.

## Validation

Full-pipeline guards cover the issue's component and app, alternate hosts,
local-name precedence, curried components, VNode props, and arrays of nodes.
A strict TypeScript consumer accepts declared nodes and both curry call forms,
and rejects incorrect props and a scalar assigned to an app result. Playground
sync and graph-aware sidecar guards verify the actual host integrations; browser
verification exercises the playground worker. Seed freshness, self-hosting,
and the ordinary typed TypeScript corpus remain required gates.
