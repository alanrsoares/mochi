# ADR 0132 — Simplify the seed's host seams

Status: Accepted
Date: 2026-10-01

## Context

The compiler core is self-hosted (ADR 0131), but migration-era host layers
still assemble a synthetic compiler object, hand-declare seed contracts, and
retain the unused TypeScript plugin implementation. The playground also
compiles each source three times despite the single-inference targets driver.

## Decision

Use `compileTargets` once in both playground paths with an explicit in-repo
runtime import. Keep worker transport and formatting outside compilation.
Export graph queries directly instead of constructing `loadBootstrapCore`.
Retain editor-buffer loading, recovery policy, and dependency-slice caches.

Retire the legacy `LanguagePlugin` implementation, plugin-kit and TS JSX
plugin exports. Keep the shared JSX schema and the shipped `BootstrapPlugin`
protocol. The private workspace has no consumers of the retired protocol.

Generate seed compile/module contracts from emitted annotations during freeze,
as already done for type constructors. Host adapters own DTO conversion and
runtime loading, not a separately maintained compiler signature. Normalize
seed diagnostics structurally in one compiler helper; editor help and
import-site positioning remain DX policy. Completion's public names re-export
the real implementation rather than forwarding each invocation.

## Consequences

Host adapters remain where they hide real differences: browser versus Node,
language values versus host DTOs, plugin options, worker transport, and editor
recovery/caching. Pass-through object construction and unused protocol code
are gone. Existing graph/cache, plugin, diagnostics, completion, and playground
contracts guard behavior; `seed:check` also guards the generated interfaces.
