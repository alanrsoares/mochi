# TS-emit checkpoint — 2026-07-22

Working state of the TypeScript backend track (ADR 0026 / `docs/TS_DIALECT.md`),
so a fresh session can pick up. Goal: emit **fully working, `tsc --strict`-clean
TypeScript** from alang, including the self-hosted `bootstrap/`.

## TL;DR

Single-file and well-behaved multi-module programs emit **strict-clean today**.
The self-hosted `bootstrap/` emits and links, but is **not yet strict-clean** —
**58 `tsc` errors** (was 537). Six gaps have shipped: the per-node lambda-param
type table (gap 1, ADR 0028, −238), cross-module `import type` + extern `.d.ts`
(gap 3, ADR 0029, −33; TS2307/TS2304 → 0), guard-form arms as **type predicates**
(gap 2, ADR 0031, −23; TS2339 23 → 1), **generic value-lambda emission + flat
`let?` bind** (ADR 0032, 243 → 94, −149), and — this session — **flat
function-type emission + overload ordering** (ADR 0033, 94 → 58, −36): `tsOf`
renders nested function types FLAT (`(a) -> (b) -> R` → `(a, b) => R`) to match
codegen's uncurried convention and the flat binding types `declType` already
emits, killing the `parser.ts` combinator cluster (35 → 4); and `flatFnType`
overloads reordered so the flat all-at-once signature lands LAST, so TS infers a
call's type args through a passed overloaded builtin correctly (`reduce(add, 0,
xs)` pins both vars). The remaining blocker is now the **row-poly record tail**:
TS2345 (48, mostly `infer.ts` 33) where a partial record literal `{ next }` flows
where the full state `{ tv, rv, next }` is expected — alang's open row emitted as
a CLOSED record, dropping the row variable.

## Landed this session (all on `main`, committed)

| Commit | What |
|---|---|
| `27acc69` | fix(lsp): module-aware diagnostics + hover for files with imports |
| `ba2d3f8` | feat(format): dogfood `.al` formatter on bootstrap; fix 2 comment bugs |
| `91b8df9` | feat(codegen): TypeScript backend — emit strict-clean typed `.ts` (ADR 0026) |
| `248e239` | fix(codegen): curry-aware TS types + pipe flattening — pipelines typecheck |
| `704081b` | feat(codegen): `build --emit=ts` — typed `.ts` for module graphs |
| _(pending)_ | feat(codegen): flat fn-type emission + overload order (ADR 0033) |

`bun run check` is green (793 tests). JS backend byte-identical throughout
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

### 1. Per-node type table — DONE (ADR 0028, −238 errors: 537 → 299)
Threaded the `TypeAt` table into `codegen-ts` via an `annotateParams` callback;
lambda params are annotated by peeling the lambda's recorded curried type
(`dts.lambdaParamTypesTs`). **Concrete param types only** — a generic binding's
`<A,B>` letters aren't in scope in the value expression (would be TS2304), and
generic params get contextual typing from the head / their HOF anyway. Result:
TS7006 131 → 40, TS18046 103 → 24, TS2345 214 → 170, TS2739/2740 19 → 0.
Remaining tail here = the *polymorphic* higher-order case (generic inner callbacks
with no contextual type), which needs generics scoping over the value — out of
this ADR's scope. Small side-effect: TS2304 6 → 11 (concrete param names a sibling
module's type that isn't imported — folds into gap 3).

### 2. Guard-form arms as type predicates — DONE (ADR 0031, −23: 266 → 243)
The original "row-poly records" framing was wrong. The dominant TS2339 cause was
that nested patterns lower to `.with((_v) => <boolean>, handler)` (ADR 0012), and
ts-pattern's `Narrow` refines the handler input ONLY for `x is U` guards — a plain
boolean guard leaves the handler at the full union, so the handler's variant-field
destructure is TS2339. Fix: emit `.with((_v): _v is <TARGET> => { const _g: any =
_v; return <test>; }, handler)`, where `patTarget` (in `codegen.ts`) renders the
pattern's narrowed type (`Extract<base, {_tag}>` + indexed-access field refinement
+ array-head tuples). `builtinDeclsIn` (`dts.ts`) injects any builtin variant
(`Option`) a predicate names but the type header missed (fixes the TS2749
knock-on). TS2339 23 → 1 (the lone survivor is a real row-poly `{...st, sccs}`
update). JS backend byte-identical (`guardBaseType` hook null off-TS).

### 3. Extern `.d.ts` + cross-module type imports — DONE (ADR 0029, −33: 299 → 266)
`compileGraphTs` now emits a self-contained `.d.ts` per extern module
(`dts.externModuleDts`: overloaded fn sigs via `flatFnType`, `any`-typed value
vars, inlined builtin variant decls) and prepends `import type` for every
referenced type resolved to its declaring module (`crossModuleTypeImports`,
scan-based, superset of the old direct-import loop). TS2307 19 → 0, TS2304 11 → 0.

### 4. Publish `@alang/runtime` (packaging, not code)
Emitted `.ts` imports `@alang/runtime`, which isn't a resolvable package. Options:
publish it, or default `build --emit=ts` to write `runtime.ts` into the output
tree + import relatively. Needed for emitted `.ts` to run/typecheck outside this
repo.

## How to reproduce the bootstrap impact measurement

```bash
mkdir -p /tmp/bts
bun run alang build --emit=ts bootstrap/cli.al >/dev/null 2>&1
# copies both the module .ts AND the emitted extern .d.ts (host.d.ts, prelude.gen.d.ts)
for f in bootstrap/*.ts; do sed 's#"@alang/runtime"#"<ABS>/src/runtime"#' "$f" > "/tmp/bts/$(basename $f)"; done
rm -f bootstrap/*.ts   # IMPORTANT: glob also removes *.d.ts — don't leave any in bootstrap/ (check scans it)
# strict tsconfig (strict, noEmit, skipLibCheck, moduleResolution bundler) in /tmp/bts,
# with `paths` mapping @onrails/pattern + @onrails/result to <ABS>/node_modules/.../dist/index.d.ts
cd /tmp/bts && bunx tsc -p tsconfig.json 2>&1 | grep -oE 'error TS[0-9]+' | sort | uniq -c | sort -rn
```
Note: `alang build --emit=ts` writes `.ts` (and extern `.d.ts`) **beside the
`.al`**; always `rm -f bootstrap/*.ts` after — a stray `.ts`/`.d.ts` in
`bootstrap/` breaks `bun run check`. `@onrails/*` resolve via tsconfig `paths` to
the repo `node_modules` (so tsc can run in `/tmp/bts`).

## Suggested next step

Gaps 1 (ADR 0028), 2 (ADR 0031), 3 (ADR 0029), the polymorphic higher-order tail
(ADR 0032), and the first-class combinator tail (ADR 0033) done — **58 `tsc`
errors left**. The remaining blocker is the **row-poly record tail**: TS2345 (48),
concentrated in `infer.ts` (33). These are all one shape — a partial record
literal `{ next }` flowing where the full inference state `{ tv, rv, next }` is
expected. Algorithm W threads an open-row state record (`{ next: Int | r }`); alang
emits it as a CLOSED record `{ next: number }`, dropping the row variable `r`, so
tsc rejects it against the concrete full-state param. Fix direction: emit an open
row as a generic record — a fresh `<R>` intersected (`{ next: number } & R`) or the
param kept generic — so field-subset records unify. This is its own ADR (open-row →
generic record emission). Smaller residuals: TS2322 4, TS2554 3 (arity), TS2741 1,
TS2339 1 (the real `{...st, sccs}` row update), TS18046 1.

## Not part of this track (uncommitted in tree)
Rebrand (README, logos, `docs/REBRAND.md`, `docs/V1.md`) and ADRs 0024 (llvm) /
0025 (json-diagnostics) with their `docs/adr/README.md` index lines. ADR index
does NOT yet list 0026. Leave for their own commits.
