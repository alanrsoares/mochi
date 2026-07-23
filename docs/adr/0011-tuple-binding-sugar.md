# 0011 — Tuple-binding sugar (lambda param + `let (a, b) = … in`)

- **Status:** Accepted
- **Source:** follow-up to ADR 0010; `docs/bootstrap.md` (lexer-spike prep)

## Context

ADR 0010 shipped tuples but left destructuring `switch`-only, which is painful
for the code that most wants tuples: parser/scanner combinators that thread a
`(value, rest)` pair through every step. Writing `switch p { | (a, b) => … }`
for each peel is noise. Binding sugar is the ergonomic payoff tuples were added
for, and the natural thing to do before the lexer-in-mochi spike.

## Decision

Add **one** real feature and derive the rest by desugaring.

- **Tuple lambda param.** `LamParam` gains `{ kind: "ptuple"; names }`. A param
  written `((a, b))` types as a tuple whose positions bind `a`, `b` (monomorphic,
  like every lambda-bound name), and lowers to JS array destructuring
  `([a, b]) => …`. Parallels the existing `({ x, y })` record param.
- **`let (a, b) = value in body` is pure parser desugar** into an applied
  tuple-param lambda: `((a, b)) => body` called with `value`. No new AST node, no
  new infer/codegen path — it rides entirely on the lambda param above. Bindings
  are therefore monomorphic (standard for pattern-bound names in ML).
- **Disambiguation is by paren depth.** `(a, b) => …` is two params; `((a, b))
  => …` is one tuple param. A lone `(x)` param collapses to a plain name (not a
  1-tuple).

## Consequences

- Scanner-style code reads naturally: `let (tok, rest) = scan(s) in …`,
  `((a, b)) => …`. The tuple ergonomics gap from ADR 0010 is closed.
- **The `let (a, b) = … in` form is not sugar-preserving in the formatter.**
  Because it desugars at parse time, `format` prints the desugared
  `(((a, b)) => body)(value)`. Re-formatting is stable (idempotent), just not
  round-tripping to the original surface. The `let x = … in` (single name) form
  *is* preserved — it is a real AST node. Accepted for now; making the tuple form
  fidelity-preserving would mean promoting it to a real node (a pattern-binding
  `letin`), deferred until it demonstrably matters.
- Top-level `let (a, b) = e` (statement, module scope) is still unsupported — it
  can't desugar to a closure and would need index-access lowering. Rare; deferred.

## Alternatives rejected

- **A pattern-binding `letin` AST node** — preserves format fidelity but adds a
  binder-is-a-pattern shape threaded through infer/codegen/hover. The
  desugar-to-lambda approach delivers the ergonomics for near-zero cost; promote
  later if fidelity matters.
- **Generalizing the destructured bindings (let-polymorphism)** — tuple
  positions are almost never polymorphic functions; monomorphic matches ML and
  keeps the desugar a plain lambda application.
