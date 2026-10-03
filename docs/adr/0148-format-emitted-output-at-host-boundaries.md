# 0148 — Format emitted output at host boundaries

- **Status:** Accepted
- **Date:** 2026-10-03
- **Source:** owner request

## Context

Readable lowering still emits compact strings. Native switch cases are especially
hard to scan without indentation. The compiler is a pure, non-failing emitter;
embedding an external formatter there would add work and failure modes to every
compile, including bootstrap comparisons and runtime loaders.

## Decision

The host CLI formats JS, TS, TSX and declaration output with the installed Biome
formatter before writing stdout or files. Use `biome format`, with two spaces and
a line width of 88, through a dedicated config independent of the caller's
project. Do not run lint fixes or import organization on generated code. Biome
is a CLI runtime dependency; formatting does not download tools on demand.

The formatter returns a `Result`. A formatting failure exits the CLI with an
error before emitting output. Graph builds and declaration directory writes
prepare every formatted file before starting writes, so a later formatter
failure does not leave a partially updated graph. File-system write failures
retain the existing CLI behavior; this is not a transactional file writer.

The playground keeps its existing lazy browser Prettier formatter. Apply it to
the worker-less fallback too, including calls after a worker failure. Compiler
timing excludes formatting on both paths. Browser formatting remains cosmetic:
the existing formatter returns raw code if formatting fails.

Core codegen, compiler APIs and runtime loaders retain their raw string contract.
Formatting belongs to presentation and file output, not language semantics.
`seed:freeze` formats JS/TS modules and declaration files, excluding `.bundle.*`
artifacts, using a dedicated config at the repository's width of 100. Bundles
retain Bun's emitted bytes. Preserve the existing two formatter passes for large generic arrows.
Record raw emitted hashes before formatting and artifact hashes afterward;
regenerate the seed through this script rather than editing generated files.

## Validation and costs

Integration tests cover CLI JS/TS stdout, graph builds, TSX parsing, independence
from consumer config, unchanged raw compiler output and execution of formatted
JS. Unit guards ensure import order and unused bindings survive formatting, and
formatter failures leave existing build output intact. Playground guards compare
fallback JS, TS and declarations against the browser formatter.

CLI output incurs one formatter subprocess per nonempty emitted file and holds
formatted graph output in memory before writing. Compiler API calls and runtime
execution incur no added formatting cost.
