---
id: 0005
title: "compile.al — the full pipeline as one Result-returning function"
status: done
type: task
assignee:
blocked-by: [0002, 0004]
---

# 0005 — `compile.al`: the full pipeline as one function

**What to build:** `bootstrap/compile.al` — one function that composes the whole
pipeline `lex → parse → check → infer → codegen` and returns `Result js Err`.
Unlike the fixpoint harness (which composes only `lex→parse→codegen`), this runs
**check and infer as real gates**: a program with a duplicate declaration,
non-exhaustive switch, or type error is rejected with the error and its span,
never reaches codegen.

Uses the runtime prelude tables from 0004 and composes the passes per the
verdict from 0002 (opaque threading, or the consolidated AST from 0003 if that
was taken).

**Blocked by:** 0002 (composition verdict; 0003 if consolidation was chosen),
0004 (runtime prelude tables).

- [ ] `compile.al` exposes a single `string -> Result string Err` entry that runs
      all five passes in order.
- [ ] A well-typed source yields the same JS the current codegen path produces
      (spot-check against the TS `compile`).
- [ ] A source with a check error and one with a type error each yield the error
      with its correct span, and never emit JS.
- [ ] `bun run check` green.
