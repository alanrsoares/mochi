# TS-emit checkpoint — 2026-07-23 (rev 6)

Working state of the TypeScript backend track (ADR 0026 / `docs/TS_DIALECT.md`),
so a fresh session can pick up. Goal: emit **fully working, `tsc --strict`-clean
TypeScript** from alang, including the self-hosted `bootstrap/`.

## TL;DR

Single-file and well-behaved multi-module programs emit **strict-clean today**.
The self-hosted `bootstrap/` emits and links, but is **not yet strict-clean** —
**14 `tsc` errors** (was 537). Measure any time with `bun run bootstrap:tsc`
(`scripts/bootstrap-tsc.ts`, replaces the old `/tmp/bts` recipe). Twelve gaps have
shipped: the per-node lambda-param
type table (gap 1, ADR 0028, −238), cross-module `import type` + extern `.d.ts`
(gap 3, ADR 0029, −33; TS2307/TS2304 → 0), guard-form arms as **type predicates**
(gap 2, ADR 0031, −23; TS2339 23 → 1), **generic value-lambda emission + flat
`let?` bind** (ADR 0032, 243 → 94, −149), **flat function-type emission + overload
ordering** (ADR 0033, 94 → 58, −36), **open-row → generic-intersection record
emission** (ADR 0034, 58 → 33, −25), **empty-collection seeds annotated at the
binding** (ADR 0035, 33 → 26, −7), **tuple literals via `_tuple`** (ADR 0036, 26
→ 22, −4), and — this session — **partial-application overloads** (ADR 0037, 22 →
16, −6). ADR 0037: every function is curried (`_curry`), so `inRange(48, 57)`
returns a `(n) => …` at runtime, but a flat `(a, b, c) => R` binding type has
three *required* params and rejects the 2-arg call (TS2554). Builtins already type
as an overload-per-composition set (`flatFnType`); the fix routes CONCRETE user
bindings through the same `curriedOverloads` helper. Generic bindings stay flat —
overloading them regressed 22 → 116 (contextual-typing + type-arg-inference
collapse), so a `head === ""` gate confines overloads to inference-neutral
concrete functions. Then — also this session — **a throwing `.otherwise` for
array-partition matches** (ADR 0038, 16 → 15, −1). ADR 0038: an eager-array
`switch` with no catch-all is the `[]` + `[h, ...t]` length partition; its guard
arms test `.length` and don't narrow `A[]`, so ts-pattern's `.exhaustive()` types
the chain as `NonExhaustiveError<A[]>` (TS2322). The TS backend closes such
matches with a throwing `.otherwise` (dead branch, `never` return); JS keeps
`.exhaustive()`. This cleared `infer.ts` `letsOfFrom`; `cli.ts` `writeAll`'s
residual is a *different* root cause (the recursive `Result` union under the
`& A` open-row leak). Finally — also this session — **concrete annotation for
parametric nullary constructors** (ADR 0039, 15 → 14, −1). ADR 0039: `None` is the
variant analogue of an empty collection — `Option<never>` at the reference. In
`lexer.al` `mkTok` the first ts-pattern arm returns `doc: None`, fixing the chain
type before the widening `Some(str)` arm (TS2322). Recorded in infer (parametric
nullary ctor: uppercase + `con` with args) and annotated in place (`None as
Option<string>`), reusing ADR 0035's empty-literal machinery. The remaining 14
decompose (see below) into **open-row state** (6, biggest) + **generic-leak HOF**
(the polymorphic-HOF tail proper) and scattered `unknown` leaks — each its own
lever.

## Landed this session (all on `main`, committed)

| Commit | What |
|---|---|
| `27acc69` | fix(lsp): module-aware diagnostics + hover for files with imports |
| `ba2d3f8` | feat(format): dogfood `.al` formatter on bootstrap; fix 2 comment bugs |
| `91b8df9` | feat(codegen): TypeScript backend — emit strict-clean typed `.ts` (ADR 0026) |
| `248e239` | fix(codegen): curry-aware TS types + pipe flattening — pipelines typecheck |
| `704081b` | feat(codegen): `build --emit=ts` — typed `.ts` for module graphs |
| `adea790` | feat(codegen): flat fn-type emission + overload order (ADR 0033) |
| `68d93b6` | feat(codegen): open-row records → generic intersections (ADR 0034) |
| `93f25a6` | feat(codegen): empty-collection seeds annotated at binding (ADR 0035) |
| `ea4b8c2` | feat(codegen): tuple literals via `_tuple` — tsc infers tuples (ADR 0036) |
| `0a8f2ce` | feat(codegen): partial-application overloads for concrete fns (ADR 0037) |
| `d5b08c7` | feat(codegen): throwing otherwise for array-partition matches (ADR 0038) |
| `937f1ad` | feat(codegen): annotate nullary ctors concretely (ADR 0039) |

`bun run check` is green (799 tests). JS backend byte-identical throughout
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

### 4. Open-row records → generic intersections — DONE (ADR 0034, −25: 58 → 33)
An open row `{ next: Int | r }` was emitted CLOSED (`{ next: number }`), dropping
the row var, so `freshVar`-shape state threading (`st => { ...st, next: … }`)
returned a partial record that failed against the full `{ tv, rv, next }` state
(TS2345). Fix, three coordinated TS-only changes: (a) `genericNames` (`dts.ts`)
assigns generic letters to `sc.rvars` too — tv/rv share one id counter (`types.ts`)
so one `Map<number,string>` serves both `tsOf` (type var) and `tsRow` (open tail);
(b) `tsRow` renders an open tail as `({ …fields } & R)` — parens mandatory, `&`
binds looser than the `[]` an array wrapper appends; (c) the generic-head gate in
`codegen-ts.ts` widens `sc.vars.length > 0` → `|| sc.rvars.length > 0`, so a
row-poly-only binding (no type vars, like `freshVar`) still gets the `<R>` head.
Fallout: opening scrutinee rows broke ADR 0031 guard predicates (closed `base` no
longer assignable to the open param → TS2677); fix in `genGuardArm` (`codegen.ts`)
emits a type predicate ONLY when it refines (`patTarget !== base`), else a plain
boolean guard. TS2345 48 → 23 (whole `infer.ts` "partial record vs full state"
class gone), TS2677 stayed 0. JS backend byte-identical.

### 5. Empty-collection seeds annotated at the binding — DONE (ADR 0035, −7: 33 → 26)
An empty `#{}` emits `new Map([])` → `Map<unknown, unknown>`; `Set.fromArray([])`
→ `Set<never>`. Two shapes: a **concrete** seed (fold pins it to `Map<number,
number>`) now emits `new Map<K, V>()` in place (`recordEmpty` records empty-literal
spans; `dts.emptyCollTs` renders the type when fully concrete, else null). A
**`let`-generalized** seed (`let initSt = { index: #{}, … } in …`) keeps quantified
vars — the empty literal can't be annotated in place, and the IIFE lowering blocks
tsc from flowing the fold's requirement back. Fix: `infer.ts` collects each `let`
scheme's body instantiations (`noteUse`/`noteLet`), and `resolveLetParams` exposes
the single monomorphic use type (`InferResult.letParams`, kept off `types` so
hover/inlay are untouched); `codegen-ts` annotates the IIFE param / top-level
`const` with it, so contextual typing pins the empties inside. Rule is strict —
annotate ONLY when every use agrees and is fully concrete; a binding that also
flows into a generic position stays bare (pinning it over-constrains that call +
its sibling empties → the polymorphic-HOF tail). Killed the `infer.ts`
empty-collection TS2345 class; the 2 `module.ts` `emptyReg` cases remain (entangled
with the HOF tail). JS backend byte-identical.

### 6. Publish `@alang/runtime` (packaging, not code)
Emitted `.ts` imports `@alang/runtime`, which isn't a resolvable package. Options:
publish it, or default `build --emit=ts` to write `runtime.ts` into the output
tree + import relatively. Needed for emitted `.ts` to run/typecheck outside this
repo.

## How to reproduce the bootstrap impact measurement

```bash
bun run bootstrap:tsc          # summary: counts by code + by file, then total
bun run bootstrap:tsc --list   # every raw `path.ts(l,c): error TSxxxx: …` line
bun run bootstrap:tsc --json    # {total, byCode, byFile, errors} for tooling
bun run bootstrap:tsc --keep    # leave the scratch dir on disk (path logged)
```
`scripts/bootstrap-tsc.ts` emits the graph via `buildModulesTs` with
`runtimeImport` pointed at `src/runtime` (no `sed`), writes the outputs + a strict
tsconfig to an OS temp dir, runs the repo's `tsc`, and tallies. No files are left
in `bootstrap/`. The `test/bootstrap-tsc.spec.ts` ratchet asserts total ≤ 14.

## Suggested next step

Gaps 1 (ADR 0028), 2 (ADR 0031), 3 (ADR 0029), polymorphic-HOF starter (ADR 0032),
combinator tail (ADR 0033), row-poly records (ADR 0034), empty-collection seeds
(ADR 0035), tuple literals (ADR 0036), partial-application overloads (ADR 0037),
array-partition `.otherwise` (ADR 0038), and nullary-ctor annotation (ADR 0039)
done — **14 `tsc` errors left**, decomposing into three clusters:

1. **Open-row state** (6 — the biggest single prize) — `infer.ts:429` `.sccs` on
   `{…} & A` (an over-opened Tarjan state whose `sccs` field hid in the row tail),
   `infer.ts:545/557`, the 2 `module.ts` `emptyReg` seeds, and `cli.ts:21`
   `writeAll`'s recursive `Result` union — all entangled with the `& A`
   intersection (ADR 0034 territory).
2. **Generic-leak HOF** (polymorphic-HOF tail proper) — `B[]` vs `string[]`
   (`check.ts:217`), `Set<A>`/`Map<A,…>` (`codegen.ts:382`), `A[]` vs `Stmt[]`
   (`infer.ts:545`). Generic inner callbacks with no contextual type. Both (1) and
   (2) need generics scoping over more value positions than ADR 0032 reaches.
3. **Scattered `unknown` leaks** — `check.ts:192`, `infer.ts:156` — plus the
   `parser.ts:294/314` span/`Option` leaks that ride the generic chain.

## Verify
`bun run check` green; the self-host fixpoint (`build ok`) confirms the JS backend
stays byte-identical after ADR 0039.

## Not part of this track (uncommitted in tree)
Rebrand (README, logos, `docs/REBRAND.md`, `docs/V1.md`) and ADRs 0024 (llvm) /
0025 (json-diagnostics) with their `docs/adr/README.md` index lines. Leave for
their own commits — this commit drops the 0024/0025 index rows so it stays on the
TS-dialect track. (ADR index now lists 0026–0034.)
