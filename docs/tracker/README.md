# Language design & DX critique — tracker

Snapshot critique of the mochi surface language and its DX (2026-07-26), captured as
actionable findings, then **adversarially fact-checked against the source** by a second
agent (verdicts below). Each finding has a ticket in [`tickets/`](tickets/); the
implementation sequence lives in [`tracer-bullets.md`](tracer-bullets.md).

Format follows [`../dx-tracer-bullets.md`](../dx-tracer-bullets.md) (vertical slices)
and `docs/plan/tickets/` (frontmatter + checklist). Numbering is
local (`C1`–`C13`) to avoid colliding with `docs/plan/tickets/` ids.

> **Closed out 2026-09-03.** Every finding below has since been resolved or
> settled by decision — see [Resolution](#resolution-2026-09-03). The findings
> and priority order are kept as the historical snapshot they were; **do not
> mine them for work.** The verdict/pain columns describe the tree as of
> 2026-07-26 and several source citations in them are now stale.

## What's working (don't touch)

- **Coherent core bet:** HM + row-polymorphic records + parametric variants, curried
  data-last surface, `|>`, readable JS + strict-clean TS from one AST. Self-host at
  0 `tsc --strict` errors is credibility no marketing buys.
- **Tooling-first architecture:** LSP/formatter/`.d.ts` are surfaces over the same
  compiler passes; spans travel everywhere; formatter runs on lex+parse only.
- **Errors as values** (two-track railway, one `Diagnostic` union), **plugin seam**
  (JSX is a plugin, not core), **Task as IO-action** (re-fires per `run`, not a
  memoized promise). All correct calls.

## Findings (post-fact-check)

| # | Finding | Verdict | Kind | Pain |
|---|---|---|---|---|
| C1 | Open-world compile: unknown names become fresh vars → typo compiles clean, crashes at runtime. Strict mode exists but is **unreachable** — all 9 entry points hardcode `open: true`, no flag or pragma | confirmed, worse than stated | safety | high |
| C2 | `((a, b))` tuple-param vs `(a, b)` two-arg vs `(x)` name-param — paren nesting is the only discriminator; `ptuple` has no spans, so a good error isn't even possible yet | confirmed | syntax trap | high (grows with users) |
| C3 | `let?`/`let!` hardcoded per-monad (5 sites: `ast.ts:48`, `parser.ts:275`, `infer.ts:173`, `codegen.ts:212,919`) — 3rd monad = 3rd sigil | confirmed | design debt | medium |
| C4 | **BUG:** `eq`/`compare`/`show` deep-walk uses `Object.keys` → `eq(#{"x":1}, #{"y":99})` is `true`; `show` a Map = `"[object Map]"`. Wrong on every collection sigil. Plus: no user-extension exit path | confirmed + upgraded | **correctness** | **high** |
| C5 | Type names can't cross modules — `TypeExpr` has no qualified form, `let g : D.Shape` is a parse error. (Original ctor-matching half was **wrong** — that works; residual split to C13) | partially wrong, corrected | expressiveness | high |
| C6 | Empty `Set` literal unwritable (`#{}` is deterministically Map — original ambiguity claim **wrong**); `@{}` novelty; unqualified `map`/`filter` = Array rule unstated (absorbs C8's namespace-principle question) | partially wrong, reframed | learnability | medium |
| C7 | `Task.*` = 10 members, sequencing only — no `all`/`race`/`traverse`; real apps escape to host promises and lose the error channel | confirmed | stdlib gap | high |
| C9 | Parse stops at first error (`ParseAbort` → single `Diagnostic` at `parser.ts:1145`); one error kills diagnostics/hover/formatting file-wide. check/infer already multi-error | confirmed | editor DX | highest |
| C10 | Doc drift: mixed example register; `example.mochi` moved to `examples/` (commit `c84df4d`), 4 stale links; "no annotation tax" pitch vs annotation reality (absorbs C11: `int`/`float` aliases — already half-documented, just needs the ADR) | confirmed | docs / trust | low (cheap) |
| C12 | **New (sanity check):** ADR namespace corrupted — `docs/adr/` holds 0000–0015, but ~23 citations reference ADRs 0016–0044, colliding with `docs/plan/tickets/` ids | new | infra | gates all new ADRs |
| C13 | **New (sanity check):** `module.ts:98-102` merges a dep's **entire** ctor table on any import edge — `import { helper }` leaks every ctor; two deps exporting `None` will collide silently | new | module system | medium-high |

Retired: C8 → merged into C6. C11 → merged into C10.

## Priority order (post-sanity-check)

1. **C9 parser recovery** (track of 6 slices) — zero design debate, multiplies every
   editor surface.
2. **C4 collection eq/show/compare bug** — data-corruption-class, shipped, headline
   features affected. Fix before anything markets the sigils.
3. **C12 ADR numbering repair** — cheap; gates every ADR item below.
4. **C5 type-name imports** — moved **above** C1: strict-by-default's escape hatch is
   `extern` annotations, which flow through the `TypeExpr` C5 unlocks.
5. **C1 strict-by-default** — lands together with **C10** (the feature-tour example has
   7 unbound pseudo-literals that only compile because of the hole).
6. **C7 Task.all/traverse** — first real async app needs it day one.
7. **C13 ctor-merge scoping** — real hole, but bites at 2+ modules exporting same-name
   ctors; after the above.
8. **C3 + C6** — decisions locked 2026-07-26 (see DECIDED blocks in tickets); now
   ADR-writing + implementation, after C12 unblocks numbering.
9. **C2** — decided: keep paren rule + spans + diagnostic; needs `LamParam` spans.

**2026-07-26: every HITL item was grilled and locked** — the whole tracker is now AFK.
See the decisions note at the top of [`tracer-bullets.md`](tracer-bullets.md).

## Resolution (2026-09-03)

Each finding, and what closed it. "Decided" means the critique was answered by
choosing the existing behaviour on purpose, not by changing it.

| # | Outcome | Closed by |
|---|---|---|
| C1 | resolved | Inference is strict by default; open-world is opt-in per file via `"use open"` or `open: true` (`compile/compile.ts`, `compile/open-mode.ts`) |
| C2 | decided + resolved | [ADR 0083](../adr/0083-lambda-paren-rule.md) keeps the paren rule and names it in the diagnostic; [ADR 0102](../adr/0102-lambda-param-name-spans.md) adds the `LamParam` name spans the good error needed |
| C3 | partly resolved, rest decided | [ADR 0079](../adr/0079-generic-let-question-bind.md) makes one `let?` dispatch between `Option` and `Result`. `let!` stays Task's own sigil — two sigils by choice, not five hardcoded sites |
| C4 | resolved | [ADR 0084](../adr/0084-structural-eq.md) — `eq`/`show`/`compare` walk collections structurally; `-By` is the override seam |
| C5 | resolved | [ADR 0046](../adr/0046-qualified-type-names.md) — `TyQual` gives type position its qualified form |
| C6 | decided | No empty-`Set` literal by design: write `Set.empty` ([`docs/language.md`](../language.md) §collections). The unqualified `map`/`filter` = Array rule is now stated there *and* enforced as a diagnostic that names `List.map` |
| C7 | resolved | [ADR 0074](../adr/0074-task-fan-out.md) — `Task.all` / `race` / `traverse`, fail-fast and input-ordered |
| C9 | resolved | [ADR 0045](../adr/0045-parser-error-recovery.md) — sync points, `SError` nodes, no cascade; `parseRecovering` never fails |
| C10 | resolved | [ADR 0085](../adr/0085-int-float-aliases.md) for the `int`/`float` half. Doc drift is continuous upkeep, not a ticket |
| C12 | resolved | `docs/adr/` now runs 0000–0103 contiguously with an index in [`README.md`](../adr/README.md) |
| C13 | resolved | [ADR 0082](../adr/0082-scoped-ctor-imports.md) — named and namespace imports scope the ctor registry instead of merging the dep's whole table |
