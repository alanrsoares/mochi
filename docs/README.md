# mochi docs

`mochi` is a small statically-typed functional language. It runs on [Bun](https://bun.sh)
(~3.4k LOC of TypeScript) and compiles a single surface language to **two** backends that
share one codegen: readable JavaScript, and typed TypeScript that is clean under
`tsc --strict`.

**Current state (factual):**

- **Self-hosting.** The compiler is re-implemented in mochi under `bootstrap/`. The
  shipped binary compiles that source and reproduces itself byte-for-byte at the
  fixpoint — `bun run fixpoint` is green.
- **Dual backend, strict-clean.** The self-hosted graph emits **0 `tsc --strict`
  errors** (`bun run bootstrap:tsc`), and the JS and TS emitters are byte-identical up
  to the type annotations the TS backend adds.
- **Tooling is first-class.** Hover, a width-based formatter, `.d.ts` generation, and
  structured diagnostics all ship, driven from the compiler (the LSP is a thin adapter).

## Map

| Doc | What's in it |
|---|---|
| [`language.md`](language.md) | The surface language: types, variants, records, patterns, collections, bindings — with examples. |
| [`compiler.md`](compiler.md) | The pipeline, the two backends, and how self-hosting works. |
| [`tooling.md`](tooling.md) | The CLI, the LSP surfaces, the formatter, and `.d.ts` emission. |
| [`dx-tracer-bullets.md`](dx-tracer-bullets.md) | Editor DX slices (rich diagnostics + navigation) — tracked as GitHub issues. |
| [`adr/`](adr/) | Architectural Decision Records — one file per decision, going forward. |

For working *in* the repo (commands, conventions, definition of done) see
[`../AGENTS.md`](../AGENTS.md); for the precise domain vocabulary see
[`../CONTEXT.md`](../CONTEXT.md). The complete, runnable feature tour is
[`../example.mochi`](../example.mochi).
