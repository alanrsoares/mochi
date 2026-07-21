---
id: 0003
title: Consolidate the shared bootstrap AST into a module (conditional on 0002)
status: dropped
note: "0002 verdict = (a); opaque composition works, no consolidation needed."
type: task
assignee:
blocked-by: [0002]
---

# 0003 — Consolidate shared AST into a module (only if 0002 ⇒ b)

**What to build:** *(only if 0002's verdict is (b) — opaque composition does not
work.)* Extract the AST that every bootstrap pass currently redeclares — `Tok`,
`Expr`/`Pattern`/`TypeExpr`/`Stmt` and their record aliases — into shared
module(s) (`bootstrap/ast.al`, and `types.al` if the HM `Ty`/`Row` shape is also
shared), and migrate `lexer`/`parser`/`check`/`infer`/`codegen` to `import`
them instead of declaring their own copies. The end state: the bootstrap is a
clean multi-module alang program with one definition of each AST type.

This is a **wide refactor** — the AST types are referenced across all five
modules. Sequence it expand–contract: add the shared module beside the existing
duplicates (nothing breaks), migrate one pass at a time to import it, then delete
the per-file duplicate once no pass declares it. Each migration batch keeps the
differential suites green on its own.

**Blocked by:** 0002 (and only lands if 0002 chose consolidation).

- [ ] Shared AST module(s) added; each defines every shared type exactly once.
- [ ] Each of the five passes imports the shared types rather than redeclaring
      them, migrated one pass per batch.
- [ ] Every `test/bootstrap-*.spec.ts` differential suite stays green after each
      batch (lexer, parser, check, infer, codegen, fixpoint).
- [ ] No duplicate type declaration for any shared AST type remains.
- [ ] `bun run check` green.
