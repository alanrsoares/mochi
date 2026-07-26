---
id: C13
title: Unscoped ctor-table merge on import + nominal identity for re-exports
status: open
type: task
blocked-by: []
---

# C13 — Any import edge merges the dep's entire ctor table (found in sanity check)

**Problem:** `module.ts:98-102` merges a dependency's **entire** exported constructor
table into the importer on *any* import edge, regardless of what the `import` statement
named. `import { helper } from "./dep"` silently brings every exported ctor of `./dep`
into the importer's pattern namespace, where it can shadow or collide — this bites the
moment two modules export a `None` or an `Empty`.

Split from C5 (whose original ctor claim was wrong — cross-module ctor matching
*works*; the problem is that it works too broadly).

**What to build:**

- Scope the merge to what the import names: `import { Circle }` brings `Circle`;
  `import * as D` brings the table behind the `D.` qualifier only.
- Collision rule: same-name ctors from two deps = duplicate-decl diagnostic at the
  import site, not silent shadowing.
- Nominal identity: a re-exported / aliased variant is the same type across the graph,
  not a structural twin (verify current behavior first — unconfirmed in sanity check).

- [ ] Failing-first tests: unnamed-ctor leak; two-dep `None` collision; re-export
      identity.
- [ ] `module.ts` merge scoping + duplicate-decl diagnostic in `check.ts`.
- [ ] Audit `examples/` + `apps/docs` + bootstrap for code accidentally relying on
      the leak.
- [ ] Bootstrap impact: `bootstrap/module.mochi` mirrors the scoping (differential
      parity).
- [ ] `bun run check:full` green.
