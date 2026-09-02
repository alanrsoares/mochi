# 0104 — The self-hosted core takes the compile options

- **Status:** Accepted
- **Date:** 2026-09-03
- **Source:** [ADR 0090](0090-bootstrap-chain.md),
  [ADR 0078](0078-mochi-first-self-hosted-core.md), `bootstrap/compile.mochi`,
  `bootstrap/module.mochi`, `packages/cli/src/cli.ts`

## Context

`mochi`'s four compile commands each carried the same shape:

```ts
if (!open && docs) { …frozen bootstrap graph… }
else { …hand-authored TypeScript compiler… }
```

The self-hosted core took no options, so `--open` and `--no-docs` were not
flags it understood but a fallback into the TypeScript compiler. Two flags kept
that compiler in the shipped CLI, which made ADR 0090's eventual deletion a
migration rather than bookkeeping.

Options also leaked back the other way. `moduleExt` (`.js` for the CLI,
`.mochi` so Vite and the Bun test loader re-enter their plugins) was faked by a
regex over emitted text in the host facade, applied to every caller. And the
graph driver passed `!recovering` where the inferrer expects `open`, so a
non-recovering `mochi build` inferred open-world: it accepted an unbound name
that the single-file railway rejected. The facade papered over that with a
strict single-file re-check, which only fired for import-free buffers.

## Decision

The self-hosted core takes the options directly. `bootstrap/compile.mochi` and
`bootstrap/module.mochi` share one record:

```mochi
type Opts = { open: bool, docs: bool, moduleExt: string, strictEntry: bool }
```

Every entry point gains a `…With` variant taking it, with the existing arity
preserved as a wrapper over `defaultOpts` — the same shape `codegen` /
`codegenWith` already used. `"use open"` is resolved inside the graph, per
module, from the source each `Loaded` now carries.

The CLI has no TypeScript path left: `mochi <file>`, `ts`, `dts` and `build`
all call the frozen graph under every flag combination.

`strictEntry` is an editor policy, not a compiler one. Dependencies always
honour their own `"use open"`; under `strictEntry` the entry takes `open`
verbatim, so a typo in a host-global-heavy file is still reported. It exists
because `dx/diagnostics.ts` passes `open: false` on the entry for that reason,
and the graph had no way to express it.

ADR 0090's differential oracle keeps its own entry point,
`scripts/ts-oracle-build.ts`. It previously rode in on `--open`; a flag that
happens to fall through to TypeScript is not a door worth keeping.

## Consequences

- The hand-authored TypeScript compiler is no longer reachable from the CLI. It
  remains the parity oracle and the host for `@mochi/compiler`'s public
  surface; this ADR does not authorize deleting it (ADR 0090 still governs).
- The graph rejects unbound names. That is a behaviour change for
  `mochi build`, and it is the one the single-file railway always had.
- Bootstrap graph output is now byte-identical to the oracle's without any
  rewrite, so the parity specs compare emitted text directly.
- `moduleExt` is a caller's choice again: the CLI takes `.js`, the Vite plugin
  and the Bun `.mochi` test loader ask for `.mochi`.
- Anything constructing graph modules for the façade must supply `src`
  alongside `path` and `stmts`.

## Alternatives rejected

**Keep the fallback and delete it later.** The two flags were the whole reason
the TypeScript compiler shipped. Deferring meant deferring the delete.

**Let the facade keep faking options over emitted text.** The `.mochi` rewrite
was already wrong for the CLI and for the fixpoint comparison; a second such
knob would have compounded it. Options belong to the compiler that honours
them.

**Make the entry honour its own `"use open"` everywhere.** That matches the
compiler, but it silently drops typo diagnostics in exactly the files most
likely to have them. The editor's stricter reading is deliberate, so it needed
a name.
