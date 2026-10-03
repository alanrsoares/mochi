# ADR 0143 — Colocate compiler modules and retire migration names

Status: Accepted
Date: 2026-10-03

## Context

ADR 0131 retired the TypeScript compiler core. Authored Mochi modules still live
in a root bootstrap tree, while host façades retain Bootstrap-qualified public
names and a separate directory. The distinction now describes migration history
rather than ownership. ADR 0048's component layout needs to apply to the actual
compiler sources, not just the former TS implementation.

## Decision

Colocate authored Mochi modules, their unit specs, and TypeScript host façades
under `packages/compiler/src/<component>/`. Keep the self-hosted CLI driver and
its specs in `packages/cli/src/`; the host CLI remains separate.

| Owner | Authored behaviors |
|---|---|
| `ast` | AST, constructors, type-expression display |
| `lexer`, `parser` | Tokenization/string scanning and Pratt parsing |
| `check` | Semantic validation, usefulness, symbol index |
| `infer` | HM types, schemes, SCCs, local names, inference |
| `codegen` | Shared expression emission, structural patterns, literals, TS backend |
| `dts` | Declaration emission and TS type printing |
| `doc`, `format` | Doc IR, formatter protocol and layout |
| `extensions` | Plugin registration, options, shipped plugin implementations |
| `prelude`, `module`, `compile` | Prelude shim, graph/IO driver, compile railway |
| `seed` | Host loader for frozen artifacts |

Within `codegen/`, use `pattern.mochi`, `literals.mochi`, and `typescript.mochi`
with matching specs; the directory already supplies the codegen context.

Name host DTOs and façades separately from their Mochi siblings. Bun can resolve
an import of an emitted `.js` file to a same-named `.ts` source; names such as
`dto.ts`, `host.ts`, and `api.ts` prevent that ambiguity. Do not emit a typed graph
beside authored sources; seed and verification builds use isolated directories.

Replace normal Bootstrap-qualified APIs with operation names and `Compiler`
types (`CompilerPlugin`, `CompilerOptions`, `compileSyncWith`, `buildModulesWith`).
Compiler exports follow ownership: `graph`, `module`, `extensions`, `syntax`,
`infer/types`, and `compile/sync`/`compile/browser`. Keep the normal compile barrel.
Use the shared `Result` from `@onrails/result` rather than a duplicate compiler
result union. Async graph-result boundaries return `ResultAsync`; seed-emitted
contracts retain their generated runtime-compatible signatures.
DX adapters use responsibility names; vendor plugins export their plugin from
the package root. Update the private workspace's callers directly, without
migration aliases for retired names.

Keep `bootstrap/seed/` as the generated trust anchor. Its module graph mirrors
repository-relative source paths, preserving ordinary relative imports across
compiler and CLI packages. Freeze, fixpoint, strict TS checks, cache inventories,
coverage, generators, benchmarks, and isolated module evaluation follow the new
locations. Retain bootstrap names for actual seed/build-chain machinery.

## Consequences

Compiler behavior remains Mochi-owned, with no TS twin. Generated seed files
change paths through `seed:freeze`, never through manual edits. The conformance
corpus and full gate continue to guard semantics, strict TS, reproducibility,
and coverage. Historical ADR paths describe their original implementation;
current instructions and guides describe the new layout.

This is a layout and API naming change. It does not introduce the next module
analysis extraction from the core-depth plan or new ecosystem adapters.
