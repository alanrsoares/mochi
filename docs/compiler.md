# The compiler

## Pipeline

A two-track railway. Every stage but `codegen`/`format` returns `Result<_, AlangError>`
(`@onrails/result`) — errors are values, not exceptions.

```
string ─lex→ Located[] ─parse→ Program ─check→ Program ─typecheck→ Program ─codegen→ string
```

| Stage | Module | Responsibility |
|---|---|---|
| lex | `lexer.ts` | text → tokens, each with a half-open `Span`; `///` docs attach via `pendingDoc` |
| parse | `parser.ts` | Pratt parser → `Program` (throws `ParseAbort` internally, caught at the boundary) |
| check | `check.ts` | name registry, duplicate-decl, `switch` exhaustiveness (incl. imported variants) |
| typecheck | `infer.ts` / `unify.ts` | Algorithm W (mutual recursion via Tarjan SCC) / row + type unification |
| codegen | `codegen.ts` | **pure, non-failing** AST → JS; also → TS behind the TS-backend hooks |

`module.ts` (`buildModules`) drives multi-file graphs: DFS load, cycle detection,
cross-module inference and exhaustiveness. `prelude.ts` holds the builtin HM signatures,
the JS runtime strings, and the namespace tables. `compile.ts` is the single-file
railway; `cli.ts` is the CLI; `lsp/server.ts` is a thin adapter over compiler surfaces.

The one error-type seam worth knowing: `unify.ts` speaks a narrow `TypeErr`; it becomes
the unified `AlangError` (`kind: lex | parse | check | type`) only at `infer.ts`'s `u()`
seam, which is where the span gets attached.

## Two backends, one codegen

mochi emits **JavaScript** and **strict-`tsc`-clean TypeScript** from the same AST. The
JS backend (`codegen.ts`) is pure and non-failing. `codegen-ts.ts` wraps it, feeding type
annotations pulled from the inference table; it does not re-emit — the two outputs are
byte-identical apart from the annotations TS adds. The result typechecks under
`tsc --strict` with no `any` and no escape hatches.

Two pattern-matching libraries live at different layers, and are not interchangeable:
`ts-pattern`'s `.exhaustive()` runs *inside* the compiler (a missing `Expr` case is a TS
error at build time), while `@onrails/pattern` is *emitted into* the user's JS.

## Self-hosting

The compiler is re-implemented in mochi under `bootstrap/` (`lexer.mochi`,
`parser.mochi`, `check.mochi`, `infer.mochi`, `codegen.mochi`, `module.mochi`, …). Two
host files stay hand-written as `.mjs`: `host.mjs` (IO/resolver shims) and
`prelude.gen.mjs` (the generated, parity-guarded prelude-table shim). Everything else is
compiled from the `.mochi` sources.

Two invariants are enforced in CI-style scripts:

- **`bun run fixpoint`** — the shipped binary compiles `bootstrap/`, and the output
  reproduces itself byte-for-byte across stages (stage2 ≡ stage3), and matches the TS
  reference build (stage2 ≡ TS).
- **`bun run bootstrap:tsc`** — emit the whole graph as TypeScript and count
  `tsc --strict` errors. The north-star number is **0**; a ratchet fails the build if it
  regresses above 0.

So the claim mochi makes is concrete and checked: *mochi compiles mochi*, and the
language it is written in emits TypeScript that typechecks.
