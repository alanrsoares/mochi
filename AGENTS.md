# AGENTS.md — working in the `mochi` repo

This is the canonical instruction file for every coding agent. Tool-specific files
(`CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`) only point here; do not
duplicate policy in editor-specific configuration.

`mochi` is a small statically-typed functional language that compiles to readable JS
**and** to strict-`tsc`-clean typed TypeScript — the two backends share one codegen
(`docs/compiler.md`). A self-hosted core with TypeScript host tooling on [Bun](https://bun.sh). Hindley–Milner
(Algorithm W) with row-polymorphic records and parametric variants; LSP/`.d.ts`/formatter
are first-class. The self-hosted `bootstrap/` graph emits **0 `tsc --strict` errors** —
the compiler is written in a language whose TS output typechecks.

Read this, then `CONTEXT.md` for vocabulary and `docs/` for the language, compiler, and tooling.

## Commands

```bash
bun run check                 # default gate = biome + tsc + workspace + fmt + tests (skip north-stars)
bun run check:full            # CI / pre-push gate = check, check:north-star, test:mochi:coverage
bun run check:north-star      # fixpoint + bootstrap:self-tsc + seed:check (own CI job)
bun run mochi <file.mochi>       # compile one file to JS on stdout (also: ts, fmt, dts, build)
bun packages/cli/src/cli.ts ts <file.mochi>   # emit typed TypeScript (build --emit=ts for the graph)
bun run bootstrap:self-tsc    # north-star: self-hosted emitter emits itself with 0 tsc --strict errors
bun run test | test:north-star | test:full | typecheck | lint | lint:fix | format | build:ext | loc
bun run lint:mochi [globs…]     # LSP diagnostics over .mochi sources (graph-aware; not in the gate)
bun run bench [suite…]          # fmt / fmt:repo / compile timings; --save, --compare, --profile (docs/tooling.md)
codspeed run -m simulation      # CodSpeed cases (codspeed.yml → scripts/bench-case.ts), as CI runs them
```

## Pipeline

Two-track railway; lex/parse return `Result<_, Diagnostic>`; check/infer return
`Result<_, Diagnostic[]>` (ADR 0004). Codegen/`format` do not fail with diagnostics.

```
string ─lex→ Located[] ─parse→ Program ─check→ Program ─typecheck→ Program ─codegen→ string
```

| Module | Responsibility |
|---|---|
| `bootstrap/lexer.mochi` | text → tokens with half-open spans and attached docs |
| `bootstrap/parser.mochi` | Pratt parser → `Program`; errors are values, with recovery holes |
| `bootstrap/ast.mochi` · `packages/compiler/src/ast/` | core tagged AST and host DTOs; types, spans, ctors |
| `bootstrap/check.mochi` · `bootstrap/symbols.mochi` | name registry, duplicate-decl, exhaustiveness; symbol index for IDE |
| `bootstrap/infer.mochi` | Algorithm W (SCC), unification, schemes, type display |
| `bootstrap/codegen.mochi` · `bootstrap/codegen-ts.mochi` | **pure, non-failing** AST → JS / strict-clean TS |
| `bootstrap/extensions.mochi` | `BootstrapPlugin` seam; `bootstrap/plugins/jsx.mochi` builtin |
| `doc/` | Wadler-style `Doc` IR + layout engine for hover type text; the formatter is `bootstrap/format.mochi` (ADR 0114) |
| `bootstrap/module.mochi` | DFS load, cycle detection, compile graph; host façade returns `ResultAsync` |
| `prelude/` | builtin HM signatures + namespace tables; `runtime.ts` is the runtime source of truth, `js-defs.gen.ts` its stripped JS view (ADR 0075) |
| `bootstrap/dts.mochi` | `.d.ts` emit (TS backend shares printers) |
| `bootstrap/compile.mochi` · `packages/compiler/src/bootstrap/` | single-file railway and host compile/emit façades |
| `@mochi/cli` | host CLI — composes compiler + `@mochi/dx` (`fmt`) + `@mochi/codemod` |
| `@mochi/codemod` · `@mochi/dx` · `@mochi/lsp` · `@mochi/vite-plugin` | codemods; format + IDE queries; LSP adapter; Vite (ADR 0048) |

## Conventions

- **Errors are values.** Every pass returns `Result`/`ResultAsync` (`@onrails/result`).
  One host union `Diagnostic` (`kind: lex|parse|check|type`); bootstrap passes use
  tagged diagnostics. Inference attaches spans to unification errors.
- **No throws** in ordinary compiler control flow; codegen may emit an invariant failure.
- **Core is authored only in Mochi.** Change `bootstrap/*.mochi`, extend seed-owned
  specs or ADR 0105 conformance, then refresh the generated `bootstrap/seed/` with
  `bun run seed:freeze`. Never hand-edit the seed or port changes to a TS twin:
  the hand-authored core is gone (ADR 0131, superseding ADR 0078's dual-write rule).
- **`ResultAsync<T,E>`, never `Promise<Result<…>>`** (`no-promise-result.grit`).
- **One host match lib:** `@onrails/pattern` `.exhaustive()` in TypeScript tooling.
  Core Mochi uses exhaustive `switch`; emitted switches normally use ternaries (ADR 0113).
- **Spans travel** on every token/node/type — hover/diagnostics depend on it.
- **Named types, not inline object params** (`no-inline-struct-type.grit`).
- **Immutable data** — `prefer-immutable-{arrays,objects}.grit` (not enforced under tests).
- **Naming:** `tVar`/`tCon`/… type constructors; `_`-prefixed emitted runtime helpers;
  `$`-prefixed synthetic destructure temps (excluded from hover/export).
- **No attribution trailers** on commits/PRs — no `Co-Authored-By`, “Made with X”,
  “Generated by …”, or other tool credit. Issue lines (`Closes #N` / `Refs #N`) are fine.
  **Enforced for every agent** via lefthook `prepare-commit-msg` (strip) +
  `commit-msg` (refuse if any remain). Enable with `bun install` → `prepare`
  (`scripts/setup-hooks.ts` → `lefthook install`). Also lefthook `pre-commit`
  runs `bun run check`; `pre-push` runs `bun run check:full` (same as CI). Cursor
  users should also turn off **Settings → Agents → Attribution** (commit + PR).

## Definition of done

1. `bun run check:full` green.
2. Language-visible change adds a guard: a case in `test/examples.spec.ts` and/or a
   `*.pbt.spec.ts` invariant (fast-check).
3. A decision (not just an impl) gets an ADR in `docs/adr/`.

## Tests

- **Unit / package specs** — colocated as `packages/<pkg>/src/**/*.spec.ts` (compiler
  passes, DX queries, plugins). Test one module or package surface in isolation.
  Mochi specs are `*.spec.mochi` (`import { test, testEach, testTask, check, checkTask, assertEq, ok } from "@mochi/test"`,
  ADR 0086 / 0088 / 0089) — `bun test` discovers them via bunfig `[loader] ".mochi" = "js"`.
  Bootstrap unit specs colocate as `bootstrap/*.spec.mochi`; black-box compiler
  contracts live in the ADR 0105 conformance corpus.
- **Smoke / integration** — `test/` only: bootstrap façades and north-stars,
  module graphs, examples, playground, cross-package seams, and language guards that
  exercise the full pipeline.
- **Shared harness** — `@mochi/test-support` (`compileJs`, `compileAndEval`, `pos`,
  `memRead`, `repoRoot`/`readRepo`, `formatSrc`; `./bootstrap` for self-host diffs).
  Dev-only; not published.

## Biome plugins (`biome/plugins/*.grit`)

`no-promise-result` · `no-inline-struct-type` · `prefer-immutable-arrays` (`.push` exempt)
· `prefer-immutable-objects`. `biome-ignore` cannot suppress plugin diagnostics — fix the code.

## Docs

`CONTEXT.md` (domain model) · `docs/README.md` (index) · `docs/language.md` (the surface
language) · `docs/compiler.md` (pipeline, backends, self-hosting) · `docs/tooling.md`
(CLI/LSP/formatter/dts) · `docs/adr/` (decisions, going forward).
