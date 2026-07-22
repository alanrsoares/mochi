# 0027 — Dogfood the `.al` formatter on `bootstrap/` as a QA gate

- **Status:** Accepted (implemented)
- **Source:** conversation 2026-07-22; `src/format.ts` (Wadler/Prettier printer, ADR 0025-era);
  `src/ast.ts` (`Ctor`); `src/parser.ts` (`parseCtor`); `src/prelude.ts` (`builtinTypeDecls`);
  `scripts/fmt-al.ts`; `package.json` (`check`); `docs/PATH_TO_BOOTSTRAP.md`

## Context

The formatter (`src/format.ts`) had unit tests over small hand-written snippets, but was
never run against a large body of real alang. Meanwhile the repo grew one: the self-hosted
compiler in `bootstrap/*.al` (~3.4k lines). Those two facts never met — the formatter's
only proof of correctness was its own curated fixtures, which by construction avoid the
shapes their author didn't think to test.

Running the formatter over `bootstrap/` immediately exposed two real bugs that the fixture
suite never provoked:

1. **Comment reposition in `type` bodies.** A comment sitting *between* constructors
   (`| A` / `// doc` / `| B`) migrated to the *following statement*. Cause: `collectAnchors`
   only treated expressions-under-`let` and statements as comment anchors, and `typeStmt`
   rendered the whole variant block as one monolithic string with no slot for an interior
   comment — so the comment bound to the next node with a span, the import after the type.

2. **`let … in` value trailing comment swallowed `in`.** `letLikeD` emitted `" in"` *after*
   `exprD(value)`, but a trailing `//` comment on the value ends its line — so `in` landed
   on the commented-out line and the output **no longer parsed**. This is worse than
   cosmetic: `format` produced invalid source (caught only because re-formatting the output
   errored). `bootstrap/codegen.al` hit it.

A formatter that can silently corrupt real source, and only its author's fixtures say
otherwise, is not trustworthy. The fix is not just the two patches — it is closing the
gap that let them exist: make our own source the formatter's standing test corpus.

## Decision

**Dogfood: `bootstrap/*.al` must always equal its own formatted output, enforced in the
QA gate.**

1. **`scripts/fmt-al.ts`** — formats every `bootstrap/*.al` with `src/format.ts`. Default
   rewrites in place (`bun run fmt:al`); `--check` (`bun run fmt:check`) exits non-zero on
   any drift or format error, listing the files.
2. **`bun run check`** gains `fmt:check`: `biome … && tsc && fmt:check && bun test`. Every
   QA run now exercises the formatter on ~3.4k lines and blocks any regression that would
   move, drop, or corrupt our source.
3. **`Ctor` gains a `span`** (`ast.ts`), set by `parseCtor` (`parser.ts`) and by the four
   synthetic `builtinTypeDecls` constructors (`prelude.ts`, zero span like other synthetic
   nodes). This makes constructors first-class comment anchors, honoring the repo-wide
   "spans travel on every node" convention rather than special-casing the formatter.
4. `typeStmt` becomes `typeStmtD` returning a `Doc`: each arm is `withComments(ctor, …)`,
   so an interior comment prints as a leading line, indented to the arm.
5. `letLikeD` splices the value's own comments manually — leading before the value, trailing
   *after* the `in` keyword — so `in` can never be commented out.

## Consequences

- The formatter is now proven against real, adversarial code on every `check`, not just
  fixtures. Regressions surface as a red gate with the offending file named.
- Adding a `span` to `Ctor` is metadata only: it changes no emitted JS and no check/infer
  verdict, so the bootstrap differential (`test/bootstrap-parser.spec.ts`, which canonicalizes
  ctors to `{ name, fields }`) and the fixpoint self-host build stay byte-identical. Verified:
  reformatting all of `bootstrap/` left the fixpoint build output unchanged.
- New guards in `test/format.spec.ts` pin both bugs (interior + trailing ctor comments;
  `in`-before-comment) and their idempotence.
- The gate currently covers `bootstrap/` only. Extending it to other checked-in `.al`
  (examples, fixtures) is a follow-up — same script, wider file set.

## Alternatives rejected

- **Keep fixture-only testing.** Rejected: it is exactly what let both bugs live. A curated
  corpus tests what its author anticipated; the self-host source tests what the language
  actually contains.
- **Format `bootstrap/` once, no gate.** Rejected: a one-time cleanup rots. Without
  `fmt:check` the next formatter change (or hand-edit) silently re-drifts and the corpus
  stops being a test.
- **Special-case interior comments in the formatter without `Ctor` spans.** Rejected:
  approximating constructor positions by rescanning source for `|` is fragile and
  duplicates what a span already is; the convention is that nodes carry spans.
