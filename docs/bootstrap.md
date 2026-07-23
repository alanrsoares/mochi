# Bootstrapping mochi (self-hosting)

## Status

**In progress, three of four stages self-hosted.** mochi runs, is Turing-complete,
and has the hard part done — HM inference, ADTs + exhaustive match, row-poly
records, Map, mutual recursion, modules, Result/Option, structural eq. The
type-theory core most languages stall on is shipped. **All three surface-syntax
blockers are now cleared** (let-in ADR 0009, tuples ADR 0010, char cursor in the
prelude), and **lex → parse → check → infer are all ported to mochi and
differentially tested against the TS compiler** on the whole repo corpus
(`bootstrap/{lexer,parser,check,infer}.al`,
`test/bootstrap-{lexer,parser,check,infer}.spec.ts` — see
`docs/PATH_TO_BOOTSTRAP.md` for the slice-by-slice detail). Only Slice F
(codegen + the fixpoint ceremony) remains. This doc is the readiness checklist
and the incremental path; see `PATH_TO_BOOTSTRAP.md` for current slice status.

## Why bootstrap at all

Not for its own sake. Self-hosting is the **forcing function**: it exercises the
language at real scale and surfaces every ergonomic gap that toy examples hide.
Each blocker below was found by asking "how would I write `lex`/`parse`/`infer`
in mochi today?" — the answer keeps hitting the same missing pieces.

## Readiness checklist

### Blockers — cannot write a compiler without these

1. ~~**Local `let … in` bindings.**~~ **DONE** (ADR 0009). `letin` `Expr` node,
   non-recursive, let-polymorphic, `in` a contextual keyword, codegen to an IIFE.
   Function bodies can now name intermediates (`let toks = lex(src) in …`). Was
   #1; the biggest single ergonomic + bootstrap unlock.
2. ~~**Tuples.**~~ **DONE** (ADR 0010). `(a, b)` literal / pattern / type via a
   reserved `con("tuple", …)`, erasing to JS arrays. Unblocks `zip`. Caveat:
   destructuring is `switch`-only so far — no `let (a, b) = e` / `((a,b)) => …`
   yet (binding ergonomics are the next increment).
3. ~~**Low-level string/char ops.**~~ **DONE**. Added a char cursor to the `Str`
   namespace: `Str.get`/`Str.codeAt` (bounds-safe, return `Option`),
   `Str.fromCode`, `Str.chars`, `Str.toNumber`. A "char" is a 1-char string (no
   char type). Pure prelude/FFI, no language change — as predicted.

### Strong ergonomics — painful without, not strictly blocking

4. **do-notation / `>>=`.** Already flagged FUTURE in the roadmap. Resolved
   for bootstrap: the lexer spike showed manual `Result` threading (later
   `let?`, ADR 0017) was tolerable through lexer/parser/check/infer — not a
   bootstrap prerequisite (`docs/PATH_TO_BOOTSTRAP.md` §6). Still open as a
   general ergonomics question independent of bootstrap.
5. **String interpolation.** Nice for diagnostics. Minor; skip for now.

### Already have (the load-bearing parts)

HM inference + generalization, variants + exhaustive `switch`, records/row-poly
field access, `Map` (symbol tables), mutual recursion (SCC-ordered), file
modules (`import`/`export`), builtin `Result`/`Option`, structural
`eq`/`compare`. None of this needs to change to bootstrap.

## Path — incremental, not big-bang

1. ~~**let-in**~~ **DONE** — local `let … in` shipped (ADR 0009). `Expr` variant
   + parser + infer (generalize the bound value in its body scope) + codegen
   (IIFE). Next: tuples.
2. ~~**tuples**~~ **DONE** (ADR 0010) — literal `(a, b)`, pattern `(x, y)`,
   `ttuple` `TypeExpr`, reserved-con type, JS-array codegen. `zip` now
   expressible. Follow-up: `let`/lambda tuple destructure.
3. ~~**char/string externs**~~ **DONE** — `Str.get`/`codeAt`/`fromCode`/`chars`/
   `toNumber` added to the prelude (blocker #3).
3b. ~~**nested patterns**~~ **DONE** (ADR 0012) — `Sm(Sm(n))` had silently
   miscompiled (free vars in emitted JS); now lowers to a guard-form arm.
   Conservative exhaustiveness: narrowing arms need a `C(_)`/`_` companion.
   The check/infer ports can dispatch on nested AST shapes directly.
4. ~~**Spike: lexer-in-mochi**~~ **DONE** — `bootstrap/lexer.al` reproduces
   `src/lexer.ts`'s token stream on the full repo corpus
   (`test/bootstrap-lexer.spec.ts`). Tuple-binding sugar (ADR 0011,
   `((a, b)) => …` and `let (a, b) = value in body`) let scanner state thread
   cleanly. The spike's answer: manual `Result` threading was tolerable —
   do-notation was NOT added as a bootstrap prerequisite (see
   `docs/PATH_TO_BOOTSTRAP.md` §6).
5. ~~**parser**~~ **DONE** — `bootstrap/parser.al` reproduces `src/parser.ts`'s
   AST on the full corpus (`test/bootstrap-parser.spec.ts`).
6. ~~**check + infer**~~ **DONE** — `bootstrap/check.al` and `bootstrap/infer.al`
   reproduce the TS checker's verdicts and the TS inferrer's schemes on the
   full corpus (`test/bootstrap-{check,infer}.spec.ts`).
7. **Remaining: codegen + the fixpoint ceremony (Slice F)** — port
   `src/codegen.ts` to mochi, diffed against its TS counterpart, then the
   three-stage fixpoint compile (`docs/PATH_TO_BOOTSTRAP.md` §4, Slice F).
   This is the only slice left before mochi self-hosts.

## Guardrail

Bootstrapping proceeded direction-first: **let-in** (independently valuable),
then a **lexer spike** (contained, honest signal) — and each step's findings
ordered the next, through parser/check/infer. That approach paid off: lex,
parse, check, and infer are all self-hosted and differentially tested.
**Codegen (Slice F) is what's left** — see `docs/PATH_TO_BOOTSTRAP.md` for the
fixpoint-ceremony plan.
