# TS-emit checkpoint — 2026-07-22

Working state of the TypeScript backend track (ADR 0026 / `docs/TS_DIALECT.md`),
so a fresh session can pick up. Goal: emit **fully working, `tsc --strict`-clean
TypeScript** from alang, including the self-hosted `bootstrap/`.

## TL;DR

Single-file and well-behaved multi-module programs emit **strict-clean today**.
The self-hosted `bootstrap/` emits and links, but is **not yet strict-clean** —
537 `tsc` errors, ~75% of them one deferred feature (per-node type table for
lambda params). That feature is the highest-leverage next step.

## Landed this session (all on `main`, committed)

| Commit | What |
|---|---|
| `27acc69` | fix(lsp): module-aware diagnostics + hover for files with imports |
| `ba2d3f8` | feat(format): dogfood `.al` formatter on bootstrap; fix 2 comment bugs |
| `91b8df9` | feat(codegen): TypeScript backend — emit strict-clean typed `.ts` (ADR 0026) |
| `248e239` | fix(codegen): curry-aware TS types + pipe flattening — pipelines typecheck |
| `704081b` | feat(codegen): `build --emit=ts` — typed `.ts` for module graphs |

`bun run check` is green (788 tests). JS backend byte-identical throughout
(all TS-only behavior is behind codegen options that default off).

## What works now

- **`alang ts <file.al>`** → single-file typed `.ts` (`src/codegen-ts.ts`).
- **`alang build --emit=ts <entry.al>`** → typed `.ts` beside each `.al` in a
  module graph (`src/module.ts` `buildModulesTs`/`compileGraphTs`).
- **Curry/pipelines**: runtime builtins typed as OVERLOADED signatures (one per
  arity composition) via `flatFnType` in `src/dts.ts`; `xs |> map(f)` lowers to
  `map(f, xs)` (flattened) via codegen's `flattenPipe` option so tsc infers
  element types. Proven by `test/ts-emit-tsc.spec.ts` (pipelines/collections/
  interpolation/arity-3 corpus) and `test/build-emit-ts.spec.ts` (2-module graph).
- **Typed runtime**: `src/runtime.ts` is GENERATED (`bun run gen:runtime` →
  `scripts/gen-runtime.ts`) from `preludeJsDefs` bodies + HM sigs. Biome-excluded,
  tsc-checked. Emitted `.ts` imports it from `@alang/runtime` (specifier
  configurable via `runtimeImport` / `emitTsModule` ctx).

## Key files (TS-emit)

- `src/codegen-ts.ts` — `emitTsModule` (reusable per-module emitter), `codegenTs`
  (single-file), `DEFAULT_RUNTIME_IMPORT`.
- `src/codegen.ts` — options `annotate`, `annotateCtor`, `flattenPipe`,
  `moduleExt` (all module-level slots; JS backend unaffected when unset).
- `src/dts.ts` — `flatFnType` (overloaded curry types), `ctorFactoryTs`,
  `bindingTsType`, `referencedBuiltinTypeDecls` (now scans ctor/alias FIELD
  types too), `typeDecl`, `aliasTsDecl`.
- `src/module.ts` — `buildModulesTs`, `compileGraphTs`, `moduleContext`,
  `gatherImports`.
- `scripts/gen-runtime.ts` → `src/runtime.ts`.
- Tests: `test/ts-emit-tsc.spec.ts`, `test/build-emit-ts.spec.ts`,
  `test/codegen-ts.spec.ts`, `test/runtime.spec.ts`.

## Remaining gaps (ranked by leverage)

### 1. Per-node type table — THE big one (~75% of bootstrap errors)
The bootstrap's polymorphic higher-order style (`firstSome`, `reduce`, generic
index loops) emits lambdas whose params tsc can't infer → TS7006 (implicit any,
131), TS18046 (unknown, 103), most TS2345 (232). Fix: thread inference's
per-expression type info (`TypeAt` table from `inferProgramTypes`) into
`codegen-ts` and annotate lambda params. Deferred in ADR 0024/0026 because
closed-world didn't need it; the open bootstrap does. **This is the dominant
blocker for a strict-clean bootstrap** and would also sharpen single-file output.

### 2. Row-polymorphic record emission (~40 errors)
Partial record construction (`{ ...st, next: n }` inferred as `{next}` where a
full `{tv, rv, next}` is expected) doesn't fit TS structural typing. TS2339 (30),
TS2322 (11). Needs a row-poly → TS strategy (structural widening, or emit
records with the full inferred field set).

### 3. Extern module `.d.ts` (19 errors)
`bootstrap/` imports externs `./host` and `./prelude.gen` (real external JS).
Emitted `.ts` has no declarations for them → TS2307. Fix: emit/point to `.d.ts`
for extern modules in the graph.

### 4. Publish `@alang/runtime` (packaging, not code)
Emitted `.ts` imports `@alang/runtime`, which isn't a resolvable package. Options:
publish it, or default `build --emit=ts` to write `runtime.ts` into the output
tree + import relatively. Needed for emitted `.ts` to run/typecheck outside this
repo.

## How to reproduce the bootstrap impact measurement

```bash
mkdir -p /tmp/bts
bun run alang build --emit=ts bootstrap/cli.al >/dev/null 2>&1
for f in bootstrap/*.ts; do sed 's#"@alang/runtime"#"<ABS>/src/runtime"#' "$f" > "/tmp/bts/$(basename $f)"; done
rm -f bootstrap/*.ts   # IMPORTANT: don't leave .ts in bootstrap/ (check scans it)
# add a strict tsconfig (strict, noEmit, skipLibCheck, moduleResolution bundler) in /tmp/bts
cd /tmp/bts && bunx tsc -p tsconfig.json 2>&1 | grep -oE 'error TS[0-9]+' | sort | uniq -c | sort -rn
```
Note: `alang build --emit=ts` writes `.ts` **beside the `.al`**; always
`rm -f bootstrap/*.ts` after — a stray `.ts` in `bootstrap/` breaks `bun run check`.
`@onrails/pattern`/`@onrails/result` only resolve inside the repo, so tsc there.

## Suggested next step

Scope the per-node type table (gap 1) as an ADR + plan — it unblocks the bootstrap
dogfood and is the bulk of the remaining distance. Cheap parallel wins: extern
`.d.ts` (gap 3) and row-poly records (gap 2), ~60 errors combined.

## Not part of this track (uncommitted in tree)
Rebrand (README, logos, `docs/REBRAND.md`, `docs/V1.md`) and ADRs 0024 (llvm) /
0025 (json-diagnostics) with their `docs/adr/README.md` index lines. ADR index
does NOT yet list 0026. Leave for their own commits.
