# 0016 — Ternary expressions

- **Status:** Accepted
- **Source:** user feature request; evidenced by Slice D — the bootstrap `.mochi` files grew ~25 two-arm boolean `switch`es (`docs/PATH_TO_BOOTSTRAP.md` §2.4)

## Context

mochi's only conditional was `switch`:

```
switch gt(n, 0) {
  | true => n
  | false => mul(n, -1)
}
```

Four lines and a pattern-match dispatch for a boolean choice. The bootstrap
lexer/parser ports made the cost concrete: ~25 of these two-arm boolean
switches, each lowering to an `@onrails/pattern` `match()` chain at runtime —
noise in the source *and* in the emitted JS. A boolean conditional deserves
first-class expression syntax with a direct JS lowering.

## Decision

`cond ? then : else` — the familiar C-family ternary, as an expression.

- **Syntax** — `?` is a new token. The ternary binds **looser than `|>`**
  (`a |> f ? x : y` conditions on the piped result) and is
  **right-associative** (`a ? x : b ? y : z` chains as else-if). Both fall out
  of the parser shape: the `?` check sits after the pipe loop in `parseExpr`,
  and the else branch recurses into `parseExpr`. Branches are full
  expressions.
- **Types** — `cond` unifies with `bool`; the two branches unify with each
  other; the whole expression has the branch type. Errors point at the cond
  span / else span respectively.
- **Codegen** — the JS conditional, always parenthesized:
  `(c ? a : b)`. The parens make the output position-independent (callee,
  member target, argument — all safe) at the cost of an occasionally
  redundant pair.
- **Formatter** — prints flat `c ? a : b`; parenthesizes a ternary in cond
  position (`(a ? b : c) ? x : y` — flat would reparse as the else-chain),
  in pipe-operand position (looser binding would swallow the pipe), and in
  callee/member position.

## Consequences

- The `:` overload with `#{…}` map entries is deterministic: a ternary always
  owns the first `:` after its `?`, so `#{ true ? 1 : 2 : "v" }` parses as
  key `(true ? 1 : 2)`, entry-colon, value `"v"` — no parens needed in either
  key or value position. An entry whose key is a ternary and whose value is
  missing fails with the ordinary "expected `:`" parse error.
- Boolean `switch` stays legal — `when` guards and mixed-pattern matches
  still want it. The bootstrap files migrate their two-arm boolean switches
  to ternaries (differential suites pin the behavior).
- The bootstrap lexer/parser gain `TQuestion`/`ETernary` for parity; the
  differential harness pins both against this implementation.
- Found in passing: mochi identifiers that are JS reserved words miscompile —
  `ETernary(…, else: Expr, …)` emitted a ctor with parameter `else`
  (`SyntaxError`). Dodged with `thenE`/`elseE` field labels (the `fieldType`
  family). The general hole — `let else = 1` → `const else` — is open;
  codegen should mangle or check should reject reserved-word identifiers.
