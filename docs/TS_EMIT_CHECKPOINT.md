# TS-emit checkpoint — 2026-07-23 (rev 10)

Working state of the TypeScript backend track (ADR 0026 / `docs/TS_DIALECT.md`),
so a fresh session can pick up. Goal: emit **fully working, `tsc --strict`-clean
TypeScript** from alang, including the self-hosted `bootstrap/`.

## TL;DR

Single-file and well-behaved multi-module programs emit **strict-clean today**.
The self-hosted `bootstrap/` emits and links, but is **not yet strict-clean** —
**1 `tsc` error** (was 537). Measure any time with `bun run bootstrap:tsc`
(`scripts/bootstrap-tsc.ts`, replaces the old `/tmp/bts` recipe). Sixteen gaps have
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
Option<string>`), reusing ADR 0035's empty-literal machinery. Most recently —
also this session — **generalize under the substitution** (ADR 0040, 14 → 8, −6).
The open-row `& A` cluster was one bug: `generalize` read env schemes *raw*, so a
`mono('t)` param later unified to `{ … | 'r }` hid `'r`, and the row var was
quantified though the env constrained it — unsound over-generalization that made
Tarjan-state locals spuriously polymorphic and leaked `& A` across
infer/codegen/check/parser. Zonking the env before collecting free vars cleared
all six at once — but **surfaced three** it had masked. Most recently — also this
session — **bound vars opaque in `freeInScheme`** (ADR 0041, 8 → 5, −3). ADR 0040's
`zonk` expanded a *generalized* scheme's bound var that happened to be a live
substitution key (`mkSt`'s map-key var → `Set<'t1158>`), leaking the inner var as
false-free and **suppressing** a sibling's legitimate generalization
(`unionVarSets`/`diffVarSets`/`freeInScheme` emitting `Set<unknown>`). Fix:
`freeInScheme` walks the scheme's type resolving through the subst but **stops at
the scheme's own quantified vars** (opaque) — subsuming both the mono case (ADR
0040) and the generalized case correctly. Most recently — also this session —
**a generic binding's letters scope the lambdas and seeds nested in its body**
(ADR 0042, 5 → 2, −3). ADR 0032 gave a generic binding's *own* value lambda a
`<A, B>` head, but the lambdas and empty literals deeper in the body still fell
to the concrete-only paths — so an inner `map`/`filter` callback param
(`check.ts:192`) tsc couldn't infer through the nested call went `unknown`, and
an inner empty `#{}` seed whose element type was an enclosing letter
(`infer.ts:156`) emitted `Map<unknown,unknown>`. The `<A, B>` head lexically
scopes the whole body, so both are annotated with those letters — mapped **per
binding** (a global union clobbers positional letters: 5 → 12). Most recently —
also this session — **applied parametric ctor calls cast to their concrete type**
(ADR 0043, 2 → 1, −1). A ctor's argument pins only the params it mentions; a
phantom one (`Ok`'s error, `Err`'s ok) stays free and tsc widens it to `unknown`.
In `writeAll` (`cli.ts:21`) the arms `Ok("")` / `Err(e)` gave `Result<string,
unknown>` / `Result<unknown, string>`, whose union with the recursive
`Result<string, string>` wasn't assignable to the declared head. Cast the call to
its resolved concrete type (`Ok("") as Result<string, string>`) when fully known
— the applied-ctor analogue of ADR 0039's nullary rule, reading the per-node type
table. The remaining 1: **the top-level `emptyReg` seed** (`module.ts:91` — not
inside a generic binding, so no letters to borrow; ADR 0035 §3's entanglement,
and no binding-annotation syntax to pin it as `src/module.ts` does with
`importedReg: Registry`).

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
| `57da9ff` | fix(infer): generalize under the substitution (ADR 0040) |
| `9065338` | docs(codegen): checkpoint rev 7 (14 -> 8) |
| `f3615e1` | fix(infer): treat a scheme's bound vars as opaque (ADR 0041) |
| `5a7bd26` | docs(codegen): checkpoint rev 8 (8 -> 5) |
| `8e75869` | feat(codegen): scope enclosing letters over inner lambdas/seeds (ADR 0042) |
| `dd95489` | docs(codegen): checkpoint rev 9 (5 -> 2) |
| `a43721c` | feat(codegen): cast applied ctor calls to their concrete type (ADR 0043) |

`bun run check` is green (803 tests). JS backend byte-identical throughout
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
empty-collection TS2345 class; the 2 `module.ts` `emptyReg` cases remained then
(entangled with the HOF tail) — ADR 0042 later cleared `module.ts:83`, leaving
only the top-level seed at `:91`. JS backend byte-identical.

### 6. Enclosing letters scope inner lambdas + seeds — DONE (ADR 0042, −3: 5 → 2)
ADR 0032 put a generic binding's `<A, B>` head on its *own* value lambda, but the
lambdas and empty literals **nested deeper in the body** still fell to the
concrete-only paths, so an inner `map`/`filter` callback param tsc can't infer
through the nested call went `unknown` (`check.ts:192`), and an inner `#{}` seed
whose element type is an enclosing letter emitted `Map<unknown,unknown>`
(`infer.ts:156`). The `<A, B>` head lexically scopes the whole body, so
`forEachScopedSpan` (`codegen-ts.ts`) maps every nested lambda / empty-literal span
to that binding's own letter map, and `lambdaParamTypesTs`/`emptyCollTs` gain a
`names` arg that renders a node whose vars are all in scope with the letters.
Scoped **per binding** — a global union clobbers positional letters (an id that is
`C` under its head became `A`: 5 → 12). Cleared `check.ts:192`, `infer.ts:156`,
and `module.ts:83` (its inner lambdas monomorphized the registry). JS byte-identical.

### 7. Publish `@alang/runtime` (packaging, not code)
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
in `bootstrap/`. The `test/bootstrap-tsc.spec.ts` ratchet asserts total ≤ 1.

## Suggested next step

Gaps 1 (ADR 0028), 2 (ADR 0031), 3 (ADR 0029), polymorphic-HOF starter (ADR 0032),
combinator tail (ADR 0033), row-poly records (ADR 0034), empty-collection seeds
(ADR 0035), tuple literals (ADR 0036), partial-application overloads (ADR 0037),
array-partition `.otherwise` (ADR 0038), nullary-ctor annotation (ADR 0039),
sound row generalization (ADR 0040), opaque bound vars (ADR 0041),
enclosing-letter scoping for inner lambdas/seeds (ADR 0042), and applied-ctor
concrete casts (ADR 0043) done — **1 `tsc` error left**. The open-row cluster is
GONE (ADR 0040), the `Set<unknown>` `VarSets` cluster is GONE (ADR 0041), the
inner-lambda / inner-seed polymorphic-HOF cluster is GONE (ADR 0042 —
`check.ts:192`, `infer.ts:156`, `module.ts:83` cleared), and `writeAll`'s
recursive `Result` union is GONE (ADR 0043 — `cli.ts:21`). The last one:

1. **The top-level `emptyReg` seed** (`module.ts:91`) — `let emptyReg = { ctors:
   #{}, … }` is NOT inside a generic binding, so ADR 0042 has no lexical letters
   to borrow, and annotating it alone gives tsc contradictory type-arg constraints
   where it flows into the generic `resolveImportsFrom` (ADR 0035 §3's
   entanglement). The hand-written `src/module.ts` pins it with an explicit
   `importedReg: Registry` annotation; alang has neither binding type-annotation
   syntax nor a cross-module `Registry` name, so closing it needs either that
   language feature or a codegen pass that monomorphizes a single-instantiation
   binding. Its own lever, its own ADR.

## Verify
`bun run check` green (803 pass); the self-host fixpoint (`build ok` ×2) confirms
the JS backend stays byte-identical after ADR 0043.

## Not part of this track (uncommitted in tree)
Rebrand (README, logos, `docs/REBRAND.md`, `docs/V1.md`) and ADRs 0024 (llvm) /
0025 (json-diagnostics) with their `docs/adr/README.md` index lines. Leave for
their own commits — this commit drops the 0024/0025 index rows so it stays on the
TS-dialect track. (ADR index now lists 0026–0034.)
