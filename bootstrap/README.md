# Bootstrap seed

`bootstrap/seed/` is the committed stage-1 compiler graph. It is generated,
manifested, and executed by Bun; never hand-edit its files. The emitted modules
mirror repository source paths beneath the seed directory. Host bundle and type
contract entry points remain at the seed root.

Author compiler behavior in `packages/compiler/src/<component>/*.mochi`, with
specs beside those modules. The self-hosted CLI is
`packages/cli/src/driver.mochi`; TypeScript host façades live with their owners.
See [ADR 0143](../docs/adr/0143-compiler-module-layout.md).

Refresh the seed after a compiler source change:

```bash
bun run seed:freeze
bun run check:full
```

The full gate checks frozen artifact freshness, strict TS self-emission,
conformance, binary fixpoint, and Mochi coverage. Bootstrap terminology describes
this build chain; ordinary compiler APIs use operation names and `Compiler`
types. See [the compiler guide](../docs/compiler.md).
