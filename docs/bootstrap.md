# Bootstrapping alang (self-hosting)

## Status

**In progress. North star, not next commit.** alang runs, is Turing-complete,
and has the hard part done — HM inference, ADTs + exhaustive match, row-poly
records, Map, mutual recursion, modules, Result/Option, structural eq. The
type-theory core most languages stall on is shipped. **All three surface-syntax
blockers are now cleared** (let-in ADR 0009, tuples ADR 0010, char cursor in the
prelude). Next is the lexer-in-alang spike. This doc is the readiness checklist
and the incremental path.

## Why bootstrap at all

Not for its own sake. Self-hosting is the **forcing function**: it exercises the
language at real scale and surfaces every ergonomic gap that toy examples hide.
Each blocker below was found by asking "how would I write `lex`/`parse`/`infer`
in alang today?" — the answer keeps hitting the same missing pieces.

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

4. **do-notation / `>>=`.** Already flagged FUTURE in the roadmap. Threading
   `Result` + parser state without bind is a swamp. Bootstrapping is the use case
   that justifies building it — but defer the decision until the lexer spike
   (below) shows how much manual `Result` threading actually hurts.
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
4. **Spike: lexer-in-alang** — the smallest real self-host proof. Write alang's
   lexer *in alang*, run it under the current TS host, diff its token stream
   against `src/lexer.ts` on the existing corpus. Validates ergonomics on a
   contained target before committing to parser/infer/codegen. ← NEXT.
   **Tuple-binding sugar is now in** (ADR 0011): `((a, b)) => …` lambda params
   and `let (a, b) = value in body`, so scanner state threads cleanly. (Caveat:
   the `let (a, b)` form desugars at parse time, so the formatter prints the
   applied lambda rather than the sugar — idempotent, not round-tripping.)
5. **Reassess do-notation** — the spike reveals whether manual `Result`
   threading (item 4 above) is tolerable or must be sugared before going further.
6. **Then** parser → check → infer → codegen in alang, one pass at a time, each
   diffed against its TS counterpart. Full self-host is the sum of these; do not
   attempt it as one leap.

## Guardrail

Bootstrapping is the right *direction* but the wrong *next commit*. Start with
**let-in** (independently valuable), then a **lexer spike** (contained, honest
signal), and let each step's findings order the next. The type core is ready;
the surface language needs three concrete pieces first.
