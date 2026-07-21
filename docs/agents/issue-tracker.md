# Issue tracker

This repo has **no remote** — work is tracked as **local Markdown** under `docs/plan/`.
The planning/design skills (`wayfinder`, `triage`, `to-tickets`) read this file to learn
how tickets are expressed here. Regenerate it any time with `/setup-matt-pocock-skills`.

- **Tracker:** local-markdown.
- **Tickets:** one Markdown file per ticket at `docs/plan/tickets/NNNN-slug.md`.
- **Ticket front-matter:** `id`, `title`, `status` (`open`/`in-progress`/`done`),
  `type`, `assignee`, `blocked-by` (list of ticket ids).

## Wayfinding operations

For `wayfinder`, which plans work too large for one session:

- **The map** is a single file, `docs/plan/wayfinder-map.md`. It is an **index**: it
  gists each decision and links to the ticket that holds the detail — it never restates
  what a ticket already says.
- **Tickets** are the map's children, `docs/plan/tickets/NNNN-slug.md`, each tagged with
  a **type**: `research` · `prototype` · `grilling` · `task`. Classify every ticket as
  **HITL** (human-in-the-loop: `grilling`, `prototype`) or **AFK** (agent-alone:
  `research`; `task` is either).
- **Claim by assignment.** A session claims a ticket by setting its `assignee` to the
  driving dev before doing any work; an unassigned ticket is unclaimed. Concurrent
  sessions skip claimed tickets.
- **Blocking** is `blocked-by: [NNNN, …]` in front-matter. A ticket is on the
  **frontier** (takeable now) when it is open, unassigned, and all its blockers are done.
- **Fog vs. out of scope.** The map has two sections: `## Not yet specified` (in-scope
  fog that graduates into tickets as the frontier advances) and `## Out of scope` (ruled
  beyond the destination — never graduates, never reads as frontier).
- **Frontier query:** open + unassigned tickets whose `blocked-by` are all `done`.
