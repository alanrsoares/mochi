---
id: 0002
title: "Prototype: compose the passes without an AST-type clash"
status: done
verdict: "(a) opaque composition works — 0003 dropped. See docs/plan/PLAN.md."
type: prototype
assignee:
blocked-by: []
---

# 0002 — Prototype: does the driver compose the passes without an AST clash?

**What to build:** the smallest `.al` program that imports two-or-more bootstrap
passes (`lex` + `parse`, ideally + `codegen`) into one module and threads their
results through, to answer the open design question that gates the whole
self-hoster: **can a driver compose the passes while treating the AST
opaquely** — never naming `Tok`/`Stmt`/`Expr`, so no duplicate-type declaration
clashes — **or must the shared AST be consolidated into one module first?**

Context: today each `bootstrap/*.al` redeclares the AST with identical `_tag`
strings, and the fixpoint harness composes `lex→parse→codegen` at the *JS*
level, where the tags line up at runtime. Composing them through alang's own
`import` is untested: importing two modules that each `export` a `Tok`/`Stmt`
type may or may not clash in the importer's registry, and the inferred schemes
may or may not unify by con-name across modules.

This is HITL — the outcome is a **decision**, to be grilled before the frontier
advances.

**Blocked by:** None — can start immediately.

- [ ] A prototype `.al` imports at least `lex` and `parse` from the bootstrap
      modules and threads `parse(lex(src))` without redeclaring any AST type.
- [ ] Recorded verdict: does it typecheck as-is (opaque threading), and do the
      runtime `_tag`s still align when the composed program runs?
- [ ] Decision documented: **(a)** opaque function-only composition works →
      ticket 0003 is dropped; or **(b)** consolidation required → 0003 proceeds.
- [ ] If any duplicate-type or scheme-unification error appears, its exact
      message + the minimal trigger are captured for 0003's scope.
