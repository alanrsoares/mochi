# Self-hosted compiler

`bootstrap/` is Mochi's authoring source for the self-hosted compiler core. It
implements lexing, parsing, checking, inference, code generation, module builds,
and the compile/build CLI. The emitted `.js` files are build artefacts; edit the
matching `.mochi` source instead.

For a bootstrap-covered core change, work in this directory first, then port the
same behavior to `packages/compiler/src/`. `seed/` is the checked-in,
SHA-256-manifested TypeScript stage-1 graph (ADR 0090): an emitted artifact
Bun executes, never an authoring source. Compiler behavior remains a change
to `bootstrap/*.mochi`. The TypeScript compiler remains the independent
parity oracle; it is not a second design source.

Keep these checks green before handing off a core change:

```bash
bun run fixpoint       # frozen stage 1 -> stage 2 == stage 3 == TS reference
bun run bootstrap:tsc  # emitted graph remains strict-tsc clean
```

Refresh the stage-1 snapshot with `bun run seed:freeze` when today's sources
need a compiler feature the current seed does not have.

The boundary is intentional. `host.mjs` is the small hand-written IO/resolver
seam, `prelude.gen.mjs` is generated from the TypeScript runtime/prelude, and
formatter, declaration emit, IDE/LSP, Vite, codemods, and apps remain outside
the self-hosted graph. See [ADR 0078](../docs/adr/0078-mochi-first-self-hosted-core.md).
