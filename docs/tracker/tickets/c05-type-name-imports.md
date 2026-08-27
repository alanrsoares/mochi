---
id: C5
title: Type-name imports (qualified TypeExpr) — parser through dts
status: done
type: task
blocked-by: []
---

# C5 — Type names cannot cross module edges

**Problem (fact-checked):** `TypeExpr` (`ast.ts:141-146`) has no qualified form —
`tname.name` / `tapp.ctor` are bare strings, and there is no record TypeExpr at all.
`let g : D.Shape = …` fails with `ParseError: expected eq, got dot`. The self-host paid
for this: the bootstrap graph was reshaped into shared `bootstrap/ast.mochi` /
`bootstrap/types.mochi` modules purely to keep type names same-file.

**Correction from sanity check:** cross-module **ctor matching already works** —
`module.ts:98-102` merges the dep's exported ctor table, `parser.ts:812` parses
`D.Circle(r)` patterns, and cross-module exhaustiveness fires correctly. That half of
the original finding was wrong. The residual ctor issues (nominal identity for
re-exported/aliased variants; the unscoped merge itself) are split out to
[C13](c13-unscoped-ctor-merge.md).

**What to build (type-name half only):**

- `Alias.T` (and `import { T }`) usable in type-annotation position: `let x : Alias.T`,
  `extern f : Alias.T -> …`, and inside variant/record alias declarations.
- Hover + `.d.ts` / `.d.mochi.ts` fold back to the alias-qualified name.

**Why it gates C1:** strict-by-default's escape hatch is `extern f : T -> U` — it
pushes every host seam through `TypeExpr`, which today can't name imported types.
Strict before this ships = mandatory annotations that can't be written.

- [x] `ast.ts`: qualified `TypeExpr` form; `parser.ts` accepts `Alias.T` in type
      position (TS side). — ADR 0046
- [x] check/infer resolve qualified names through the import graph; case in
      `test/examples.spec.ts`. — `qualsByPath` in `module.ts` → `ModuleContext.qualTypes`;
      record aliases expand in the DECLARING module's scope; both
      `checkQualifiedTypeNames` diagnostics fire. **Constraint discovered:** no
      checked-in `.mochi` file may use `Alias.T` until slice d —
      `test/bootstrap-parser.spec.ts:517` globs `**/*.mochi` into the differential
      corpus, so a fixture fails on `bootstrap/parser.mochi`'s missing production.
      The examples case is an in-memory graph until then.
- [x] **hover** fold-back to qualified alias names. `qualifyTypeNames` in `src/types.ts`
      is a display-only `Type -> Type` nominal rename (identity-preserving: untouched
      nodes are returned by reference), composed in front of `showType` rather than
      threaded through its recursion. `moduleHoverAt` builds the `name -> Alias.name` map
      from `ModuleContext.qualTypes`; a locally declared type wins (already writable bare,
      and it shadows), first alias wins on a tie. `hoverAt` (single-file) passes no map, so
      it is byte-identical. Before: `let circle: Shape` — a name the importer cannot write.
      After: `let circle: D.Shape`, `let boxed: D.Box<number>`, `let sizeOf: D.Shape -> number`.
      Two cases in `test/module-hover.spec.ts` (qualification + local shadowing).
      **Known limitation:** a qualified *record* alias (`D.Pair number`) still hovers
      expanded (`{ fst: number, snd: number }`) — aliases are structural (ADR 0005), so a
      record carries no nominal name to rename. Row-level alias provenance is its own
      problem, not this slice's.
- [x] **dts** fold-back — split out, not blocking. `emitDts` is single-file
      (`toTypedProgram`) and `src/dts.ts:652,731` drop `{ kind: "import" }`, so a qualified
      annotation emits a *dangling* nominal: `export let f : D.Shape -> number` →
      `export declare const f: (s: Shape) => number;` with no import for `Shape`. Nothing
      gated fails today: sidecars are `X.d.mochi.ts`, outside the root `tsconfig.json`
      `include`, and already carry dangling names (`VNode`). Fixing it means emitting a
      resolvable type-only import (`import type * as D from "./shapes.mochi"`, or inline
      `import("./shapes.mochi").Shape`) — viable because `allowArbitraryExtensions: true`
      is exactly the TS feature that maps `./shapes.mochi` onto `shapes.d.mochi.ts`, and
      `apps/docs/tsconfig.json` already sets it. Specifiers would need normalizing to carry
      the `.mochi` extension. Single-file dts can only fold back names written qualified
      (an inferred type has no alias provenance), which is all the surface needs.
      **Done:** `emitDtsFromTyped` qualifies via `qualifierMap` (graph) or written
      `tqual` nodes (single-file), and prepends `import type * as Alias from "….mochi"`.
      `emitDtsForFile` / `mochi dts` run the import graph so inferred `Shape` prints as
      `D.Shape`. Record aliases still expand (ADR 0005), same as hover.
- [ ] Bootstrap impact: **large** — `bootstrap/parser.mochi` + `infer`/`check` mirrors
      need the same production (differential tests, message + span parity); afterwards,
      check whether any shared-module workaround in the bootstrap graph can unwind.
      Sliced: **d-1/d-2 done** — `TyQual` in the shared `bootstrap/ast.mochi` (one
      variant for both arities), the `parseTypeAtom`/`parseTypeApp` productions with
      byte-exact message *and* span parity, `strayTypeVar`, and `typeExprToType`
      lowering to the bare nominal `con(name, args)`. Two differential cases pin it
      (AST + error). **d-3 done:** `qualsByPath` + `ModuleContext` seed in
      `bootstrap/module.mochi`, `checkQualifiedTypeNames` + 3-ary `checkWith` in
      `bootstrap/check.mochi` (both messages byte-exact), and a `quals` scope threaded
      into `inferProgramImports` → `schemes.mochi`'s `TyQual` arm. Rather than mirror
      `src/schemes.ts`'s mutually-recursive `TypeScope`/`QualScope`, the importer's
      alias map is pre-seeded with composite `"Alias.Name"` keys (a dot cannot occur in
      a type name, so nothing shadows) — so a qualified record alias still expands
      across the edge. The corpus constraint above is **lifted**:
      `examples/qualified-types/` is checked in and both compilers build it. Two
      side-effects of the fixture entering the differential corpus: the two
      `inferProgram*` wrappers needed an annotated `emptyQuals` (ADR 0044) to keep
      `bootstrap:tsc` at 0, and the binding-annotation diagnostic now spans the
      WRITTEN type, matching `src/infer.ts`'s `s.annot.span`.
- [x] `bun run check:full` green.
