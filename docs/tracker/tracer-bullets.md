# Critique tracker — tracer bullets

Parent track for the findings in [`README.md`](README.md), sequenced after the
adversarial fact-check. Each slice is a vertical tracer bullet: compiler + tests +
LSP/docs surface where applicable. Same table shape as
[`../dx-tracer-bullets.md`](../dx-tracer-bullets.md).

Type legend: **AFK** = agent-executable once designed; **HITL** = needs a human design
decision first (usually an ADR); **HITL→AFK** = decision then mechanical.

> **2026-07-26 — all open HITL decisions were grilled and locked** (recorded as
> `DECIDED` blocks at the top of each ticket): C2 keep-parens+diagnostic ·
> C3 dual-purpose `let?` (Option|Result, Rust-`?` style), sigils capped ·
> C4 structural-only forever · C1 pragma+flag opt-in · C7 fail-fast, no `allLimit` v1 ·
> C12 backfill retro ADRs · C6 keep `@{}` + `Set.empty` + namespace rule documented
> as-is. Every ticket below is now **AFK** (ADR-writing included — content is decided);
> only C9 slice (a) retains technical design latitude (recovery points).

## Wave 1 — correctness + highest-leverage DX

| # | Title | Ticket | Type | Blocked by | Status |
|---|---|---|---|---|---|
| 0 | Parser error recovery — slices a–f (ADR → parser multi-error → no-cascade check/infer → formatter passthrough → LSP → bootstrap parity) | [C9](tickets/c09-parser-error-recovery.md) | HITL→AFK | 2 (ADR slice only) | a,b,c,d done (ADR 0045) |
| 1 | **Bug:** `eq`/`compare`/`show` wrong on Map/Set/List (`Object.keys` walk) — fix runtime + PBT invariants | [C4](tickets/c04-collection-eq-bug-and-exit-adr.md) | AFK | — | bug fixed (`8c47e39`) |
| 2 | ADR namespace repair (0016–0044 dangling / colliding with plan tickets) | [C12](tickets/c12-adr-namespace-repair.md) | AFK | — | done (`232936b`) |

## Wave 2 — module system, then the safety flip

Ordering is load-bearing: C5 unlocks the annotation surface C1's migration needs, and
C1 + C10 touch the same example files, so they land together.

| # | Title | Ticket | Type | Blocked by | Status |
|---|---|---|---|---|---|
| 3 | Type-name imports — qualified `TypeExpr` (`Alias.T`) parser → infer → dts/hover, TS + bootstrap parity | [C5](tickets/c05-type-name-imports.md) | AFK | — | a,b done (ADR 0046) |
| 4 | Strict inference by default (flip 9 hardcoded `open: true` sites); opt-in = pragma + CLI flag (decided) | [C1](tickets/c01-strict-by-default.md) | AFK | 3, 5 | open |
| 5 | Docs pass: canonical example register, 4 stale `example.mochi` links, annotation pitch, int/float ADR (absorbs C11) | [C10](tickets/c10-docs-pass.md) | AFK | 2 (ADR part) | open |
| 6 | `Task.all` / `race` / `traverse` — fail-fast, no `allLimit` v1 (decided) | [C7](tickets/c07-task-concurrency.md) | AFK | 2 (ADR part) | open |
| 7 | Ctor-merge scoping: imports bring only what they name; collision diagnostic; re-export nominal identity | [C13](tickets/c13-unscoped-ctor-merge.md) | AFK | 3 | open |

## Wave 3 — syntax decisions (DECIDED — now ADR-writing + implementation)

| # | Title | Ticket | Type | Blocked by | Status |
|---|---|---|---|---|---|
| 8 | Dual-purpose `let?` (Option\|Result head-ctor dispatch, Rust-`?` style); sigils capped — ADR + infer/codegen impl + bootstrap parity | [C3](tickets/c03-generic-bind-adr.md) | AFK | 2 | open |
| 9 | Collection literals: keep `@{}`; add `Set.empty`; namespace rule documented as-is — ADR + prelude + diagnostic | [C6](tickets/c06-collection-literals-adr.md) | AFK | 2 | open |
| 10 | Tuple-param: keep paren rule; spans on `LamParam` + targeted diagnostic — ADR + impl | [C2](tickets/c02-tuple-param-trap.md) | AFK | 2 | open |
| 11 | eq/show/compare: structural-only-forever guarantee — retro ADR + loud docs (design half of C4, after bug fix) | [C4](tickets/c04-collection-eq-bug-and-exit-adr.md) | AFK | 1, 2 | open |
