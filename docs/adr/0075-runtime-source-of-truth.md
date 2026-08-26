# 0075 — The runtime is TypeScript source; the JS-backend table is generated from it

- **Status:** Accepted
- **Date:** 2026-08-26
- **Source:** owner request ("shouldn't the TS source be the SoT?"); `packages/compiler/src/prelude/{runtime,prelude,js-defs.gen}.ts`, `scripts/gen-prelude-defs.ts`

## Context

The runtime existed twice. `prelude.ts` held every builtin as a **JS string** in
`preludeJsDefs` (the JS backend inlines the ones a program references), and
`scripts/gen-runtime.ts` re-emitted those strings as a typed module, `runtime.ts`, for
the TypeScript backend (ADR 0026). Alongside them sat a hand-written `runtimeDeps`
graph saying which def references which — the input to the inliner's reachability
closure.

Three costs, all paid on every builtin added:

- **The runtime was not code.** A 380-character single-quoted string is not formatted,
  not linted, not typechecked, and not directly testable. Quoting fought back: escaping
  a string literal inside a JS body inside a TS string literal is a hazard with no
  upside.
- **`runtimeDeps` was hand-maintained** and unverifiable by eye. Adding
  `Task.traverse` meant *guessing* `["_Task_all", "_curry"]` and hoping. A wrong edge
  emits a program that references an uninlined builtin — a `ReferenceError` at runtime,
  in generated code, far from the table that caused it.
- **Generation ran the wrong way.** The typed module was derived from the untyped one,
  so the artifact a human would want to read and edit was the one marked *do not edit*.

## Decision

**`packages/compiler/src/prelude/runtime.ts` is the source of truth for both backends**
— ordinary TypeScript, checked by `tsc --strict`, formatted and linted by biome, and
importable by a spec. `scripts/gen-prelude-defs.ts` strips its types and writes
`packages/compiler/src/prelude/js-defs.gen.ts`, which exports the two tables codegen
needs: `preludeJsDefs` and `runtimeDeps`. `prelude.ts` re-exports them, so every
consumer's import is unchanged.

- **`runtimeDeps` is derived, not written.** The generator tokenizes each body,
  skipping comments, string literals and property names (so `r._tag === "Ok"` does not
  claim a dependency on `Ok` and `xs.map(f)` does not claim one on `map`), and
  intersects the identifiers with the def names. Regenerating against the old
  hand-written table reproduced it **exactly, all 143 defs** — which is the evidence
  that the derivation is the same relation the table was trying to state, minus the
  chance to get it wrong.
- **Type stripping is `Bun.Transpiler`.** Bun is already the runtime; a parser
  dependency for this would not earn its place. The consequence is that the emitted
  text is Bun's printer output rather than the source's own spacing — some bodies now
  span several lines in the emitted preamble. That is deterministic per Bun version,
  and a version that prints differently surfaces as a `gen:prelude-defs --check`
  failure, fixed by regenerating.
- **HM signatures stay in `prelude.ts`.** They are the language's type table, not
  runtime code. What the old generator gave for free — the guarantee that each public
  annotation *is* the HM signature — becomes an explicit check:
  `scripts/runtime-types.ts` renders the annotation each builtin should carry and
  `test/prelude-defs.spec.ts` fails with the exact replacement text when the two drift.
  Comparison is whitespace-blind, so re-wrapping by the formatter is not drift.
- **Runtime plumbing is exempt from that check** (`_curry`, `_list`, `_tuple`,
  `_recur`, `_done`): they have no HM signature because no program can name them.
- **`scripts/gen-runtime.ts` is deleted**, and `runtimeArity` / `preludeJs` keep
  deriving from `preludeJsDefs` as before.

## Consequences

- Adding a builtin is now: write the typed definition in `runtime.ts`, add its HM
  signature, run `bun run gen:prelude-defs`. The dependency edge is inferred and the
  annotation is checked against the signature.
- The runtime is testable as a module — `import { _Task_all } from "…/runtime"` in a
  spec, rather than `new Function(preludeJs, …)`.
- Emitted prelude text changed once, cosmetically (Bun's printer). This exposed one
  latent bug in a test harness — `@mochi/test-support`'s duplicate-`const` dedupe ended
  a statement at the first line ending in `;`, which is only correct for single-line
  defs; it now tracks bracket depth.
- It also exposed a real printer bug: `dts.ts` parenthesized arrow and union array
  elements but not `Task`, which *prints* as an arrow, so `[Task<a, e>]` emitted
  `() => Promise<Result<A, B>>[]` — a function returning an array. Fixed here, since
  `Task.all`'s signature is the first builtin to take an array of tasks.
- Two generated artifacts now exist downstream of the runtime (`js-defs.gen.ts` and
  `bootstrap/prelude.gen.mjs`), both parity-guarded by specs, so a stale one fails the
  gate rather than the build.

## Alternatives rejected

- **Keep the string table, generate `runtime.ts` from it.** The status quo: the file
  humans should edit is the generated one, and the runtime stays unlintable.
- **A plain `.js` runtime as the source, with types only in a generated `.d.ts`.** Real
  source, but it gives up `tsc --strict` on the runtime itself and leaves the TS backend
  importing types nothing checks against the bodies.
- **Byte-identical stripping via a type-blanking pass (`ts-blank-space`) plus a
  whitespace collapser.** Would have avoided the one-time emit churn, at the price of a
  new dependency and a bespoke scanner that has to know which spaces sit inside string
  literals. The churn is a one-time cost; the scanner would be permanent.
- **Hand-typed bodies with no `any`.** Attractive, but the structural builtins (`eq`,
  `compare`, `show`) walk values whose shape no HM type describes; forcing honest types
  onto them means casts that assert the same thing less clearly. The annotation is the
  contract, and the differential tests prove the bodies.
