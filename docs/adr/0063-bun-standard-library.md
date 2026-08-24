# 0063 — Bun standard-library bindings

- **Status:** Accepted
- **Source:** `examples/{cli,life}`, `packages/bun/{cli,terminal}.mochi`

## Context

The CLI and Life examples each carried local JavaScript runtimes for ordinary Bun process
and terminal effects. Their Mochi programs could not share a typed, documented capability
surface, and each host had to re-implement the lazy `Task` result convention.

## Decision

Ship an optional `@mochi/bun` package, not compiler syntax. Its initial modules are
`@mochi/bun/cli` (`args`, `log`, `error`) and `@mochi/bun/terminal` (`enter`, `draw`,
`leave`). Terminal operations return `Task<(), string>` so sequencing and recovery stay
in Mochi; the runtime owns only process I/O and ANSI control sequences.

## Consequences

Node/Bun-specific programs have a small reusable boundary without making Mochi itself
host-specific. The package is intentionally Bun-named: a portable Node/Deno abstraction
would need a separately designed contract. HTTP and WebSocket remain `@mochi/web` work.

## Alternatives rejected

- Keep example-local runtimes: repeats an already solved FFI boundary.
- Put process APIs in the compiler prelude: couples every target to Bun.
- Name the package `@mochi/node`: promises portability the implementation does not have.
