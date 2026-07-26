---
id: C12
title: ADR namespace repair — cited ADRs 0016–0044 don't exist / collide with plan tickets
status: done
type: task
blocked-by: []
---

# C12 — The ADR numbering is corrupted (found in sanity check)

> **DECIDED 2026-07-26 (user-grilled): backfill retroactive ADRs.** Write short retro
> ADRs at the cited numbers (0026 typed-TS backend, 0044 binding annotations, …) so
> existing citations become true; `docs/adr/README.md` documents the ADR-#### vs
> plan-ticket disambiguation. Citations and commit-message references stay untouched.

**Problem:** `docs/adr/` contains only `0000`–`0015`, yet source comments, `AGENTS.md`,
memory, and this tracker cite ADRs `0016, 0023, 0026, 0028, 0035, 0039, 0042, 0043,
0044` — and those numbers **collide with real files in `docs/plan/tickets/`** (e.g.
`0026-codegen-hook-context.md` is a ticket, while `codegen-ts.ts` is annotated
"ADR 0026" meaning the typed-TS-backend decision). ~23 cited numbers are dangling or
double-booked.

This gates every "write an ADR" item in this tracker (C3, C4, C6, C7-semantics,
C2) — new ADRs would land in a namespace that's already inconsistent.

**What to build:**

- [x] Inventory: grep the repo for `ADR \d{4}` citations; classify each as
      (a) exists in `docs/adr/`, (b) meant a decision that was never written down,
      (c) actually refers to a plan ticket.
- [x] Decide the repair: backfill missing ADRs as short retroactive records, or
      renumber citations to a new contiguous range, or namespace plan-ticket ids apart
      from ADR ids (e.g. `T-0026` vs `ADR-0026`).
- [x] Fix citations in source comments, `AGENTS.md`, docs, and this tracker.
- [x] Add the numbering rule to `docs/adr/README.md` (create if absent) so it can't
      drift again.
- [x] `bun run check` green.
