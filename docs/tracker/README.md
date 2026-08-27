# Language design & DX critique — tracker

Snapshot critique of the mochi surface language and its DX (2026-07-26), captured as
actionable findings, then **adversarially fact-checked against the source** by a second
agent (verdicts below). Each finding has a ticket in [`tickets/`](tickets/); the
implementation sequence lives in [`tracer-bullets.md`](tracer-bullets.md).

Format follows [`../dx-tracer-bullets.md`](../dx-tracer-bullets.md) (vertical slices)
and `docs/plan/tickets/` (frontmatter + checklist). Numbering is
local (`C1`–`C13`) to avoid colliding with `docs/plan/tickets/` ids.

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
