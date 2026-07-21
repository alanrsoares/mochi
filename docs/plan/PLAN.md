# Self-hoster ship — execution plan (tickets 0001–0007)

**Decisions locked (2026-07-21):** A → consolidate AST if the 0002 prototype
clashes (verdict b). B → generated `.js` shim for prelude tables.

Ground state: the 5 bootstrap modules exist and the fixpoint is proved
*in-harness* (`test/bootstrap-fixpoint.spec.ts` wires modules in TS). This epic
lifts that to a **shipped `alangc`** — real disk IO, a CLI, and a fixpoint
driven through the binary rather than the TS harness.

## Dependency graph

```
0001 Host IO FFI ─────────────────────────────┐
0002 composition prototype (HITL) ──┬─→ 0003 (only if verdict = b)
                                    └───────────┼─→ 0005 compile.al ─→ 0006 cli.al ─→ 0007 fixpoint via binary
0004 prelude tables (HITL) ─────────────────────┘                     ↑
                                                                (0006 also needs 0001)
```

## STATUS (2026-07-21): epic COMPLETE

0001 ✓ · 0002 ✓ (verdict a) · 0003 dropped · 0004 ✓ · 0005 ✓ · 0006 ✓ · 0007 ✓.
The shipped `alangc` (`bootstrap/cli.al`) compiles `.al` → `.js` over real disk
IO and fixpoints on itself: stage2 ≡ stage3 ≡ TS single-file output across all
seven modules (`bun run fixpoint`, guarded by
`test/bootstrap-fixpoint-binary.spec.ts`). `bun run check` green (645 tests).

## Recommended order

1. **0001, 0002, 0004 in parallel** — all unblocked. 0001 is pure task; 0002
   and 0004 are decision-gates (below) that must resolve before 0005.
2. **Resolve decision gates** (0002 → a|b, 0004 → shim|embed).
3. **0003** — *only* if 0002 verdict = (b).
4. **0005 → 0006 → 0007** — the tracer bullet, in order.

## TDD seams (pre-agreed)

| Ticket | Guard |
|---|---|
| 0001 | differential: an `.al` reads a path, writes to a second path; assert file contents round-trip under Bun |
| 0004 | **parity test**: generated shim ≡ live `src/prelude.ts` tables (fails if prelude edited without regen) |
| 0005 | spot-check: `compile.al` output byte-≡ TS `compile` for a well-typed source; check/type errors yield correct span + no JS |
| 0006 | build an `examples/*.al`, run the emitted `.js` under Bun, assert output |
| 0007 | stage2 ≡ stage3 byte-for-byte, driven through the shipped binary + real files |

---

## DECISION A — ticket 0002: does alang's own `import` compose the passes?

**Question.** Can a `.al` module `import { lex }` from lexer + `import { parse }`
from parser and thread `parse(lex(src))` **without redeclaring** any AST type —
and (a) typecheck, (b) run with `_tag`s still aligned?

**Two independent risks.**
- *Type-level:* lexer exports things typed with its own `Tok`/`Stmt` decls;
  parser expects its own. Cross-module unification is by con-name — if two
  modules each declare `Tok`, the importer may see two distinct schemes that
  refuse to unify, OR structural equivalence may let them thread opaquely.
- *Runtime:* `_tag` strings must match across separately-compiled modules.
  **Low risk** — every module goes through the same `codegen`, same `_tag`
  scheme; the in-harness fixpoint already proves lex→parse→codegen interop when
  wired in TS. Runtime alignment failing would be surprising.

**Branches.**
- **(a) opaque function-only composition works** → ticket **0003 dropped**.
  `compile.al` just threads values through imported function signatures.
- **(b) duplicate-type / scheme-unification error** → **0003 proceeds**: extract
  `bootstrap/ast.al` (+ `types.al`) as single source of each AST type, migrate
  all 5 passes to `import` it. Wide but mechanical refactor.

**Recommendation.** Run the minimal prototype first (import lex+parse, thread
once). My prior: **(a) is plausible** because the passes were written to a
shared runtime `_tag` contract and alang records are structural — but this is
exactly the untested seam, so treat the prototype output as authoritative, not
this prior. If it errors, capture the exact message + minimal trigger (0003's
scope needs it).

**Your pre-decision needed:** if the prototype errors with a duplicate-decl /
unification failure, do we (b) consolidate AST into shared modules now, or
pause to reconsider surface (e.g. opaque/abstract type export)? Default: **(b)
consolidate** — it's the ticketed path and keeps one definition per type.

### VERDICT (2026-07-21): **(a)** — 0003 dropped.

Prototype `bootstrap/_proto_compose.al` (`lex(src) |> Result.flatMap(parse)`,
each module keeping its own `type Tok`) **built clean through the module graph**
(check + infer, exit 0) and, run under Bun, returned `Ok` with 3 statements and
`_tag: "SLet"` intact. Both risks cleared: cross-module structural records
unify by shape, and `_tag`s align across separately-compiled modules.
`compile.al` (0005) can thread values opaquely through imported function
signatures. **No AST consolidation needed.**

## DECISION B — ticket 0004: how do prelude tables reach the shipped binary?

**Question.** The 5 tables (`preludeEnv`, `preludeNamespaces` for inference;
`namespaceRuntime`, `preludeJsDefs`, `runtimeDeps` for codegen) live in
`src/prelude.ts`. The shipped `alangc` cannot import from `src/`. Two options:

- **Embed as alang literals** — `bootstrap/prelude-tables.al` builds the same
  Maps in alang.
- **Generated `.js` shim** — a script emits the tables as a plain module the
  compiler imports.

**Constraint.** PATH §6: *one prelude, never forked* — whichever option, the
single source of truth stays `src/prelude.ts`, with a **generator** + a parity
guard test so an edit to `prelude.ts` that skips regen fails CI.

**Recommendation: generated `.js` shim.** Binary target is Bun-run emitted JS
with npm deps allowed (per 0001), and PATH §6 explicitly blesses host shims via
`extern` indefinitely — a generated JS table module is squarely in that spirit.
Avoids hand-maintaining an alang copy (drift), avoids forcing alang to express
these nested Map literals. Wire: `bun run gen:prelude` emits
`bootstrap/prelude.gen.js`; a test asserts it matches the live tables.

**Your pre-decision needed:** generated JS shim (recommended) vs embed-as-alang
(purer self-hosting aesthetic, more drift surface)? Default: **generated JS
shim**.

---

## Notes / risks

- 0001 no-`Promise<Result>` rule: host IO extern sigs must pick a consistent
  shape (likely sync `Bun.file(p).text()` / `Bun.write` wrapped to `Result`, or
  async returning `Task`/`Promise` — not `Promise<Result>`). Decide shape when
  implementing 0001; it's a convention, not a gate.
- 0006/0007 single-file only — no multi-file `import` graph porting (that's
  `module.ts`, explicitly deferred by PATH §6).
