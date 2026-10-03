# mochi docs

`mochi` is a small statically-typed functional language. It runs on [Bun](https://bun.sh)
with a Mochi-authored core and TypeScript host tooling, and compiles a single surface language to **two** backends that
share one codegen: readable JavaScript, and typed TypeScript that is clean under
`tsc --strict`.

**Current state:**

- **Self-hosting.** The compiler is authored only in mochi under `packages/compiler/src/` (ADR 0131). The
  shipped binary compiles that source and reproduces itself byte-for-byte at the
  fixpoint — `bun run fixpoint` is green.
- **Dual backend, strict-clean.** The self-hosted graph emits **0 `tsc --strict`
  errors** (`bun run bootstrap:self-tsc`). JS and TS share one emitter, with
  inferred TS annotations and targeted differences in arithmetic and generic
  pattern lowering ([compiler](compiler.md#two-backends-one-codegen)).
- **Tooling.** Hover, a width-based formatter, `.d.ts` generation, and structured
  diagnostics all ship, driven from the compiler (the LSP is a thin adapter).

## Map

| Doc | What's in it |
|---|---|
| [`language.md`](language.md) | The surface language: types, variants, records, patterns, collections, `Task`, bindings — with examples. |
| [`compiler.md`](compiler.md) | The pipeline, the two backends, and how self-hosting works. |
| [`tooling.md`](tooling.md) | The CLI, the LSP surfaces, the formatter, and `.d.ts` emission. |
| [`runtime-comparison-benchmark.md`](runtime-comparison-benchmark.md) | Current Mochi versus handwritten JS: repeated runs, raw samples, fixtures and limits. |
| [`structural-compare-benchmark.md`](structural-compare-benchmark.md) | Record and variant ordering versus the previous JSON fallback, with timing limits and raw samples. |
| [`function-tail-match-benchmark.md`](function-tail-match-benchmark.md) | Native custom-variant function-tail switches versus previous ternary output, with runtime and tooling measurements. |
| [`dx-tracer-bullets.md`](dx-tracer-bullets.md) | Editor DX slices (rich diagnostics + navigation) — tracked as GitHub issues. |
| [`docs-reframe.md`](docs-reframe.md) | Directed execution plan for reframing `apps/docs` content & positioning. |
| [`adr/0053-path-to-wasm3.md`](adr/0053-path-to-wasm3.md) | Proposed: WasmGC as eventual third backend — no Rust rewrite, prerequisites, gates. (`PATH_TO_WASM3.md` stubs here.) |
| [`adr/0058-runtime-components.md`](adr/0058-runtime-components.md) | Accepted: opt-in runtime composition, separate from compiler plugins. |
| [`adr/`](adr/) | Architectural Decision Records — one file per decision, going forward. |

For working *in* the repo (commands, conventions, definition of done) see
[`../AGENTS.md`](../AGENTS.md); for the precise domain vocabulary see
[`../CONTEXT.md`](../CONTEXT.md). The complete, runnable feature tour is
[`../examples/example.mochi`](../examples/example.mochi).

- [0143 — Compiler module layout](adr/0143-compiler-module-layout.md)
