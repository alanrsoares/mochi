# 0002 — Namespace imports (`import * as`)

- **Status:** Accepted
- **Source:** `src/ast.ts` (`ImportStmt.alias`, `CtorPat.ns`), `src/module.ts` (`nsImports`),
  `src/infer.ts` (`InferOptions.nsImports`), `src/format.ts` (`importStmtD` / `braced`)

## Context

Named imports force every used export onto one line (or a hand-broken list the
formatter then flattens). Bootstrap modules that pull a whole AST (`check.mochi`,
`codegen.mochi`, …) already hit that wall. Prelude already has qualified
namespaces (`List.map`, `Str.length`); modules need the same shape.

## Decision

1. **Surface:** `import * as Alias from "./mod"` beside `import { a, b } from "./mod"`.
   `as` / `from` stay contextual ids (not keywords). Alias may not be a reserved
   prelude namespace (`List`, `Map`, …).

2. **Semantics:** Alias binds a *user namespace* — same table as `List.*`. Members
   resolve via field access (`Alias.export`) and via **qualified ctor patterns**
   (`| Alias.Ok(x)`). Bare `Alias` is not a value. The dep's full ctor registry
   and field keys still merge into the importer (exhaustiveness / destructuring),
   keyed by the bare ctor name; the qualifier is only for name resolution.

3. **Codegen:** Emit ESM `import * as Alias from "./mod.js"`; leave
   `Alias.member` as property access (no `namespaceRuntime` rewrite).

4. **Formatter:** Named import lists reuse `braced` — flat within 80 cols, else
   one name per line. Namespace imports are always one short line.

## Consequences

- `ModuleContext` gains `nsImports: Map<alias, Env>`; `toTypedProgramWith` merges
  those schemes into infer's `ns` beside `preludeNamespaces`.
- `pctor` carries optional `ns`; check still validates the bare ctor against the
  registry; infer looks the scheme up under `ns` when qualified.
- Long `import { … }` lines wrap; re-format of bootstrap AST imports is mechanical.

## Alternatives rejected

- **Module-as-record value** (`let m = import "./mod"`) — new type, first-class
  modules; overkill when field-access namespaces already exist.
- **Star import seeds bare names** (no qualifier) — defeats the point of avoiding
  the name list and collides with local bindings.
- **Value-only star import, no qualified patterns** — can't `switch` on imported
  variants without also naming every ctor.
- **Pack-as-many-as-fit wrapping** for named imports — fights every other
  breakable list in the formatter.
