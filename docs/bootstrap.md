# Bootstrapping alang (self-hosting)

## Status

**Proposed, not started. North star, not next commit.** alang runs, is
Turing-complete, and has the hard part done — HM inference, ADTs + exhaustive
match, row-poly records, Map, mutual recursion, modules, Result/Option,
structural eq. The type-theory core most languages stall on is shipped. But
writing the compiler *in alang* needs surface ergonomics it still lacks. This
doc is the readiness checklist and the incremental path.

## Why bootstrap at all

Not for its own sake. Self-hosting is the **forcing function**: it exercises the
language at real scale and surfaces every ergonomic gap that toy examples hide.
Each blocker below was found by asking "how would I write `lex`/`parse`/`infer`
in alang today?" — the answer keeps hitting the same missing pieces.

## Readiness checklist

### Blockers — cannot write a compiler without these

1. **Local `let … in` bindings.** Today `let` is a top-level `Stmt` only
   (`src/ast.ts:75`); a function body is a single `Expr` with no way to name an
   intermediate. Every compiler pass names steps (`let toks = lex(src) in …`).
   Threading intermediates through lambdas or `match` scrutinees is unbearable at
   compiler scale. **This is #1** — and it's useful everywhere, not just here.
2. **Tuples.** Flagged open in the roadmap (needed for `zip` too). Recursive
   descent lives on `(node, rest)` pairs. Records `{ node, rest }` work but cost
   a named type and verbose construction on every combinator. Parsers want the
   anonymous product.
3. **Low-level string/char ops.** A lexer scans char-by-char: `charCodeAt`,
   `fromCharCode`, index slicing. `Str.slice`/`split` exist but not a char
   cursor. **Mostly externable** — mechanical FFI, not a language change.

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

1. **let-in** — ship local `let … in` (blocker #1). Biggest single unlock;
   pays off in all user code, not only the compiler. New `Expr` variant + parser
   + infer (generalize the bound value in its body scope) + codegen (IIFE or
   `const` in a block).
2. **tuples** — ship the anonymous product type (blocker #2). Literal `(a, b)`,
   pattern `(x, y)`, `tuple` `TypeExpr`. Unblocks `zip` as a bonus.
3. **char/string externs** — bind `charCodeAt`/`fromCharCode`/index slicing
   (blocker #3). Mechanical.
4. **Spike: lexer-in-alang** — the smallest real self-host proof. Write alang's
   lexer *in alang*, run it under the current TS host, diff its token stream
   against `src/lexer.ts` on the existing corpus. Validates ergonomics on a
   contained target before committing to parser/infer/codegen.
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
