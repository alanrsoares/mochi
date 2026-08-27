# 0082 — Scoped constructor imports

- **Status:** Accepted
- **Date:** 2026-08-27
- **Source:** tracker C13; `bootstrap/module.mochi`; `packages/compiler/src/module/module.ts`
- **Amends:** [ADR 0002](0002-namespace-imports.md) §2 (bare ctor-table merge)

## Context

Any import edge merged the dependency's entire constructor registry into the
importer. `import { origin } from "./shapes"` made `| Circle` a known pattern
and ran Shape's exhaustiveness as if every ctor had been named. Two modules
exporting `Empty` silently overwrote each other. ADR 0002 kept that merge so
`| Alias.Ctor` could reuse the bare-name registry; infer already looked up
qualified patterns in `nsImports`, so the merge was only serving check.

## Decision

1. **Named import.** `import { Circle }` brings `Circle` as a value and as a
   bare ctor. The owning type's *full* ctor list still lands in the type map, so
   a switch that names only `Circle` is non-exhaustive. Sibling ctors are not
   pattern-valid until imported.
2. **Namespace import.** `import * as S` does not seed bare ctor names. Check
   looks up `| S.Circle` under the key `S.Circle`. The type map still receives
   the dep's exported variants so exhaustiveness stays sound.
3. **Collision.** A second named import of the same ctor name from a different
   owning type is `duplicate constructor 'Empty'` at the later import name.

Re-exporting the same ctor through two files that both import it from one
declaring module is the same constructor (no structural twin).

## Consequences

- Check's ctor table may contain qualified keys; pattern lookup uses `ns`.
- ADR 0002's "full registry still merges under the bare name" no longer holds
  for namespace imports.

## Alternatives rejected

**Keep the bare merge for namespace imports only.** Bare `| Circle` after
`import * as S` would still typecheck in check and fail in infer.

**Importing one ctor does not publish the owning type.** `| Circle` with no
`Square` arm would look exhaustive. Unsound.
