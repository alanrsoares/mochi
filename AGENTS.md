# AGENTS.md — working in the `mochi` repo

`mochi` is a small statically-typed functional language that compiles to readable JS
**and** to strict-`tsc`-clean typed TypeScript — the two backends share one codegen
(`docs/compiler.md`). ~3.4k LOC of TypeScript on [Bun](https://bun.sh). Hindley–Milner
(Algorithm W) with row-polymorphic records and parametric variants; LSP/`.d.ts`/formatter
are first-class. The self-hosted `bootstrap/` graph emits **0 `tsc --strict` errors** —
the compiler is written in a language whose TS output typechecks.

Read this, then `CONTEXT.md` for vocabulary and `docs/` for the language, compiler, and tooling.

## Commands

```bash
bun run check                 # QA gate = biome check . && tsc --noEmit && bun test
bun run mochi <file.mochi>       # compile one file to JS on stdout (also: ts, fmt, dts, build)
bun src/cli.ts ts <file.mochi>   # emit typed TypeScript (build --emit=ts for the graph)
bun run bootstrap:tsc         # north-star: count tsc --strict errors on the self-host (0)
bun test | typecheck | lint | lint:fix | format | build:ext | loc
```

## Pipeline

Two-track railway; lex/parse return `Result<_, Diagnostic>`; check/infer return
`Result<_, Diagnostic[]>` (ADR 0004). Codegen/`format` do not fail with diagnostics.

```
string ─lex→ Located[] ─parse→ Program ─check→ Program ─typecheck→ Program ─codegen→ string
```

| Module | Responsibility |
|---|---|
| `lexer.ts` | text → tokens, each with a half-open `Span`; `///` docs attach via `pendingDoc` |
| `parser.ts` | Pratt parser → `Program`; throws `ParseAbort` internally, caught at the `parse` boundary |
| `ast.ts` / `types.ts` | `Expr`/`Pattern`/`TypeExpr`/`Stmt` unions; `Type`/`Row` representation |
| `check.ts` | name registry, duplicate-decl, `switch` exhaustiveness (incl. imported variants) |
| `infer.ts` / `unify.ts` | Algorithm W (mutual recursion via Tarjan SCC) / row+type unification |
| `codegen.ts` | **pure, non-failing** AST → JS; behind TS-backend hooks (default off) also → TS |
| `codegen-ts.ts` | wraps `codegen.ts`, feeding type annotations from the inference table → strict-clean TS (ADR 0026) |
| `module.ts` | `buildModules(): ResultAsync<…>` — DFS load, cycle detection, compile graph |
| `prelude.ts` | builtin HM signatures + JS runtime strings + namespace tables |
| `dts` · `format` · `hover` · `diagnostics` | `.d.ts`; pretty-print (lex+parse only); LSP surfaces |
| `compile.ts` · `cli.ts` · `lsp/server.ts` | the railway; CLI; thin LSP adapter (logic lives in the compiler) |

## Conventions

- **Errors are values.** Every pass returns `Result`/`ResultAsync` (`@onrails/result`).
  One union `Diagnostic` (`kind: lex|parse|check|type`). `unify.ts`'s narrower `TypeErr`
  becomes `Diagnostic` only at `infer.ts`'s `u()` seam (which attaches the span) — keep it.
- **No throws** except `parser.ts`'s `ParseAbort` marker and one codegen invariant.
- **`ResultAsync<T,E>`, never `Promise<Result<…>>`** (`no-promise-result.grit`).
- **Two match libs, don't conflate:** `ts-pattern` `.exhaustive()` runs *inside* the
  compiler (missing an `Expr` case = TS error); `@onrails/pattern` is *emitted* into user JS.
- **Spans travel** on every token/node/type — hover/diagnostics depend on it.
- **Named types, not inline object params** (`no-inline-struct-type.grit`).
- **Immutable data** — `prefer-immutable-{arrays,objects}.grit` (not enforced under tests).
- **Naming:** `tVar`/`tCon`/… type constructors; `_`-prefixed emitted runtime helpers;
  `$`-prefixed synthetic destructure temps (excluded from hover/export).

## Definition of done

1. `bun run check` green.
2. Language-visible change adds a guard: a case in `test/examples.spec.ts` and/or a
   `*.pbt.spec.ts` invariant (fast-check).
3. A decision (not just an impl) gets an ADR in `docs/adr/`.

## Biome plugins (`biome/plugins/*.grit`)

`no-promise-result` · `no-inline-struct-type` · `prefer-immutable-arrays` (`.push` exempt)
· `prefer-immutable-objects`. `biome-ignore` cannot suppress plugin diagnostics — fix the code.

## Docs

`CONTEXT.md` (domain model) · `docs/README.md` (index) · `docs/language.md` (the surface
language) · `docs/compiler.md` (pipeline, backends, self-hosting) · `docs/tooling.md`
(CLI/LSP/formatter/dts) · `docs/adr/` (decisions, going forward).
