---
id: 0001
title: Host IO FFI shims (read-file, write-file, argv)
status: done
type: task
assignee:
blocked-by: []
---

# 0001 — Host IO FFI shims

**What to build:** an alang program can read a file, write a file, and read
process arguments — all through `extern` bindings wired to Bun host shims. This
is the disk/argv surface the self-hoster's CLI needs; no compiler pipeline is
touched yet.

The binary target is decided: **alangc runs as emitted JS under Bun**, with
`@onrails/{pattern,result}` as ordinary npm deps — so the shims are plain Bun
calls (`Bun.file(p).text()`, `Bun.write`, `process.argv`), reached from alang
via `extern`.

**Blocked by:** None — can start immediately.

- [ ] `extern` bindings exist for: read a file to a string, write a string to a
      path, and read the argument vector.
- [ ] Signatures thread through the type checker (IO surfaced as `Result`/async
      shape consistent with the existing railway, per the `extern` FFI
      conventions and the no-`Promise<Result>` rule).
- [ ] A trivial `.al` reads a path from argv, reads that file, and writes it to a
      second path — demoable end-to-end under Bun.
- [ ] `bun run check` green.
