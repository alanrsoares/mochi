---
id: 0007
title: Fixpoint via the shipped binary
status: done
type: task
assignee:
blocked-by: [0006]
---

# 0007 — Fixpoint via the shipped binary

**What to build:** prove the *shipped* `alangc` (the `cli.al` binary from 0006,
not the TS test harness) fixpoints on itself. The binary compiles every
bootstrap `.al` on disk to `.js`; a stage-2 binary built from those outputs
recompiles the bootstrap; stage2 ≡ stage3 byte-for-byte. This upgrades the
current in-harness fixpoint (`test/bootstrap-fixpoint.spec.ts`) to one driven
through real disk IO and the real CLI.

**Blocked by:** 0006 (the `build` command).

- [ ] A repeatable procedure (script or spec) runs the ceremony through the
      shipped `alangc`, reading and writing real files.
- [ ] stage2 ≡ stage3 byte-for-byte across all bootstrap modules, driven by the
      binary rather than the TS harness.
- [ ] The check is wired into `bun run check` (or a documented `bun run` script)
      as a permanent self-hosting guard.
- [ ] `bun run check` green.
