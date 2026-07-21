---
id: 0006
title: "cli.al — the build command end-to-end"
status: done
type: task
assignee:
blocked-by: [0001, 0005]
---

# 0006 — `cli.al`: the `build` command end-to-end

**What to build:** `bootstrap/cli.al` — the shipped entry point. Reads a path
from argv, reads the file, runs `compile.al`, and on success writes the emitted
JS to a sibling `.js` (or stdout); on failure prints the formatted error with
`line:col` and exits nonzero. This is the tracer bullet: a self-hosted `alangc`
that compiles one `.al` file to `.js` on disk, runnable under Bun.

Single-file only — a source with no `import` statements. Multi-file `import`
graphs (porting `module.ts`) are out of scope here (tracked as fog).

**Blocked by:** 0001 (host IO shims), 0005 (`compile.al`).

- [ ] `alangc build <file.al>` compiles a no-import source and writes runnable
      JS beside it (or to stdout).
- [ ] A compile error prints the formatted `line:col` message and exits nonzero;
      no `.js` is written on failure.
- [ ] The command runs as emitted JS under Bun with only `@onrails/{pattern,
      result}` as deps.
- [ ] Demo: an `examples/*.al` file builds and its emitted JS runs.
- [ ] `bun run check` green.
