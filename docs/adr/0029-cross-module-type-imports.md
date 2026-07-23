# 0029 — Cross-module type imports & extern `.d.ts` (TS backend, gap 3)

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-22; `docs/TS_EMIT_CHECKPOINT.md` (gap 3);
  `src/module.ts` (`compileGraphTs`, `crossModuleTypeImports`, `relSpec`);
  `src/dts.ts` (`externModuleDts`); `src/cli.ts` (output writer);
  `docs/adr/0026` (TS backend); `docs/adr/0028` (typed lambda params)

## Context

ADR 0026's `build --emit=ts` emits a typed `.ts` beside each `.mochi` in a module
graph. Against the self-hosted `bootstrap/` it left two classes of `tsc --strict`
error that are purely about *resolution*, not types:

- **TS2307 "cannot find module" (19).** `bootstrap/` binds host IO and the
  generated prelude through `extern name : T = "./host.js" "jsName"`. Codegen
  emits `import { jsName } from "./host.js"`, but those are real external JS files
  with no declarations, so tsc can't resolve them.
- **TS2304 "cannot find name" (11).** mochi has **no type-name imports** — every
  top-level `type` is globally visible across the closed-world graph (this is why
  `infer.mochi` can write `[AliasField]` without importing `ast.mochi`). The old TS
  emitter approximated this by emitting `import type { …all exported types… }`
  only from the modules a file *directly value-imports*. That misses a type
  referenced with no import edge: `compile.mochi` never imports `ast.mochi`, yet its
  binding annotations mention `Stmt`/`Ty` (they arrive via `check`/`inferProgram`
  return types).

Both are mechanical: every type the emitter prints is already emitted as
`export type` in its declaring module (`typeDecl` always exports), so the name is
importable — the emitter just wasn't pointing at it.

## Decision

**Resolve type references graph-wide by declaring module, and emit a
self-contained `.d.ts` per extern module.**

1. **Cross-module `import type` (TS2304).** Build one graph-wide
   `typeOwner: Map<typeName, declaringPath>` from every module's `type` decls.
   Emit each module's body first with no type-import lines, then scan the emitted
   text for every `typeOwner` name that is non-local, not already bound by a
   *value* import (a value + type import of the same name is a TS2300 duplicate),
   and actually referenced (`\bname\b`). Group by declaring module and prepend one
   `import type { … } from "./rel"` per owner (`relSpec` = path relative to the
   importer). This replaces the direct-import-only loop — it is a strict superset
   (a directly-imported dep's referenced types still resolve) that also covers the
   no-edge case, and imports only what's referenced instead of all exports.
2. **Extern `.d.ts` (TS2307).** `externModuleDts` (in `dts.ts`) emits a `.d.ts`
   per distinct extern module specifier, keyed by resolved path so a specifier
   imported by several modules (`./prelude.gen.js` from `compile` and `module`)
   emits once. Each imported binding becomes `export declare const`: a **function**
   extern gets the same OVERLOADED signature as a runtime builtin (`flatFnType`),
   so both curried (`f(a)(b)`) and uncurried (`f(a, b)`) call sites resolve; a
   **value** extern renders free type vars as `any` (a const has no generic head
   to bind them, and the JS boundary is genuinely untyped past the signature).
   Referenced builtin variants (e.g. `Result`) are inlined via `typeDecl` so the
   file needs no imports. The type comes from the extern's inferred **scheme**
   (`env.get(name)`), not its surface `TypeExpr`, so transparent record aliases
   (`Diag`) are already expanded structurally — no dangling alias name.
3. The CLI writer treats an output `path` already ending in `.ts` as final (the
   `.d.ts` files) and only maps `.mochi → .ts/.js` otherwise.

## Consequences

- **−33 `tsc` errors: 299 → 266.** TS2307 19 → 0 and TS2304 11 → 0 (both classes
  eliminated), plus a small TS2345/TS2322 knock-on (−3) as newly-resolved types
  sharpen call sites. The remaining 266 are gap 2 (row-poly records: TS2339 23,
  TS2322 7, and a large share of TS2345) and the polymorphic higher-order tail
  left open by ADR 0028 (TS7006 40, TS18046 24).
- **JS backend untouched.** All of this lives in `compileGraphTs` (the TS driver)
  and `dts.ts`; `compileGraph`/`buildModules` are unchanged, so the fixpoint
  self-host build stays byte-identical (guarded by `bun run check`).
- **Type imports are now demand-driven**, not export-dump: a module gets exactly
  the `import type`s its emitted text uses. Unused-import noise disappears, and
  the no-edge case is covered.
- New guards in `test/build-emit-ts.spec.ts`: a 3-module graph where `main`
  imports only from `ops` yet is typed `Shape` (owned by `shapes`) — asserting the
  no-edge `import type` — plus an `extern` forcing a `host.d.ts`, and the whole
  graph must `tsc --strict`-clean together.

## Alternatives rejected

- **Structurally collect referenced type names from schemes/aliases/type decls
  instead of scanning the emitted text.** Rejected: the names are printed by
  several rendering paths (`bindingTsType`, `lambdaParamTypesTs`, `aliasTsDecl`,
  `typeDecl` fields, `ctorFactoryTs`); re-deriving the union duplicates all of
  them. A `\bname\b` scan of the text the emitter already produced is simpler and
  exact, and unused-import over-matching is harmless (no `noUnusedLocals`); the
  only real hazard, a value/type name collision, is guarded explicitly.
- **Give externs `any`-typed declarations.** Rejected: it clears TS2307 but throws
  away the extern's declared signature and would relax real call-site checking.
  The scheme is already inferred — rendering it (overloaded for functions) is both
  faithful and free.
- **Emit an ambient `declare module "./host.js" { … }`** instead of a `.d.ts`
  file. Rejected: ambient module declarations with relative specifiers are
  brittle across module-resolution modes; a real sibling `.d.ts` resolves cleanly
  under `bundler` (proven by the bootstrap differential).
- **Export type names from mochi source and import them explicitly.** Rejected:
  mochi deliberately has no type-name imports (types are globally visible in the
  closed world); forcing per-name type imports into the language to satisfy the TS
  backend is the tail wagging the dog. The backend reconstructs the imports the
  target language needs.
