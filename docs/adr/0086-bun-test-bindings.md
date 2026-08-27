# 0086 — bun:test bindings for Mochi specs

- **Status:** Accepted
- **Date:** 2026-08-27
- **Source:** `packages/test/`, `bunfig.toml`, [ADR 0063](0063-bun-standard-library.md)
- **Deepens:** ADR 0063 (Bun host package), ADR 0012 (typed `extern` first)
- **Informed by:** ReScript `tests/tests/src/{mocha,test_utils}.res`

## Context

Mochi-first core work (ADR 0078) still had to prove behavior in TypeScript
`*.spec.ts` files: `bun test` does not load `.mochi`, and `bun:test`'s `expect(x).toBe(y)`
is a method chain HM cannot name honestly. Without a typed runner seam, bootstrap
changes could not be guarded in the language that owns them.

ReScript's compiler tests are ReScript: thin `external test`/`describe` from mocha,
then `eq` / `ok` / `throws` in `Test_utils` — not a fluent matcher object.

## Decision

1. **`@mochi/test`** — typed `extern`s over a thin runtime adapter
   (`@mochi/test/runtime`). Surface matches ReScript's mocha helpers:
   `test` / `describe` / `testSkip` / `testOnly`, plus `assertEq` / `ok` / `throws`.
   `assertEq` is expected-first, actual-last so `got |> assertEq(want)` pipes.
   Not named `eq`: Mochi `==` desugars to prelude `eq`, and inlined `Array.contains`
   calls it — a test-module `eq` would shadow both. Boolean compare stays `==`.
   Distinct from `@mochi/test-support` (TypeScript compiler-test harness).

2. **Bun plugin** — `@mochi/test/plugin` compiles `.mochi` through `buildModules`
   with `moduleExt: ".mochi"`, so imported names keep their schemes. `bunfig.toml`
   `[test] preload` registers it.

3. **Discovery** — bunfig `[loader] ".mochi" = "js"` makes the scanner treat
   `.mochi` as JS-like, so `*.spec.mochi` (and `*_test.mochi`) match Bun's
   filename rule. The mapping is a scanner lie; the plugin compiles. No
   TypeScript trampoline.

A spec file is top-level `test(...)` / `describe(...)` statements ([ADR 0087](0087-expr-statements.md)).

## Consequences

`bun test` runs `*.spec.mochi` next to `*.spec.ts`. Bootstrap tests can be
authored in Mochi. Async `Task` tests and property-based helpers are deferred.

## Alternatives rejected

- **Re-export `expect` as a fluent object.** HM has no method-chain type; the
  wrapper is the ReScript-shaped extern (ADR 0012).
- **Single-file `compile` in the plugin (Vite's open-world cheat).** Tests that
  import bootstrap modules would typecheck as unbound names — the opposite of
  confidence.
- **Per-file `*.spec.ts` trampoline (`import "./foo.spec.mochi"`).** Works, but
  every Mochi spec pays a TypeScript sidecar. The loader mapping removes it.
- **Keep bindings on `@mochi/bun`.** Process/terminal (ADR 0063) is a host
  stdlib; the test runner is a different consumer (ReScript keeps mocha
  bindings in the test tree, not in the runtime stdlib).
- **Top-level `test(...)` statements.** Landed as [ADR 0087](0087-expr-statements.md):
  any top-level expression of type `()` is a statement. This ADR's `let _ = do { … }`
  workaround is gone.
