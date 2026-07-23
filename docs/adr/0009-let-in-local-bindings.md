# 0009 — Local `let … in` bindings

- **Status:** Accepted
- **Source:** `docs/bootstrap.md` (blocker #1); `mochi-roadmap` memory

## Context

`let` was a top-level `Stmt` only. A function body was a single `Expr` with no
way to name an intermediate result — every step had to be threaded through a
lambda applied inline or through a `match` scrutinee. At compiler scale (the
bootstrap target) and in ordinary user code alike, this is the sharpest
ergonomic gap: `let toks = lex(src) in …` is unwritable. Named bindings inside
an expression are table stakes for an ML-family language.

## Decision

Add a `letin` `Expr` node — `let x = value in body` — scoped to `body`.

- **Non-recursive.** `x` is NOT in scope in `value`; the value evaluates in the
  enclosing scope. (Recursion stays a top-level-`let` affair, where the SCC
  machinery already handles it soundly.)
- **Let-polymorphic.** The bound value is generalized against the current env
  before inferring the body — the textbook Algorithm-W `let` rule — so a local
  `id = x => x` can be used at multiple types, exactly like a top-level binding.
- **`in` is a contextual keyword**, not a reserved word. An expression never
  continues with a bare identifier, so the `in` following `value` is
  unambiguous; keeping it unreserved avoids breaking any existing `.mochi` that
  uses `in` as a name. (Mirrors the existing contextual `from` in `import`.)
- **Codegen: an IIFE.** `((x) => body)(value)` — non-recursive, so a plain
  argument application suffices. Nested let-ins chain as curried IIFEs.

## Consequences

- Function bodies can name intermediates; the #1 bootstrap blocker is cleared
  and all user code benefits.
- Emitted JS grows one closure per binding. Readable and debuggable, but not the
  tightest possible output; a later pass could flatten chains to `const`s in a
  block if it matters.
- `letin` joins every `Expr` walker (infer, check, codegen×3, format, the span
  pbt). The `.exhaustive()` discipline (ADR 0002) forced each to be updated.
- Hover works on the local binding: its `nameSpan` is recorded with a `let`
  symbol, so it reads `let x: T` like a top-level one.

## Alternatives rejected

- **Reserve `in` as a real keyword token** — cleaner in the lexer, but risks
  breaking existing sources and buys nothing the contextual form lacks.
- **`let` blocks / multiple bindings per `let`** — chaining `let … in let … in`
  already expresses sequences; a block form is sugar that can come later without
  changing this core.
- **Recursive local bindings** — unneeded for the bootstrap path and would drag
  in local SCC analysis. Deferred until a concrete use appears.
- **Codegen to a `const` block** (`(() => { const x = v; return b; })()`) —
  marginally flatter for chains but no clearer for the common single binding;
  the arrow form reuses the existing record-body paren helper.
