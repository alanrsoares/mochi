# 0020 — Reject JS reserved words in binding positions

- **Status:** Accepted
- **Source:** [0016](0016-ternary-expressions.md) hazard note; `src/check.ts`
  (`checkReservedWords`); `test/reserved-words.spec.ts`

## Context

mochi identifiers are lexed liberally: any lowercase name that isn't a keyword
is a legal identifier, including JS reserved words like `else`, `new`, `class`,
`in`, `default`. Most reach codegen as JS **binding** positions — a `let`
lowers to `const <name>`, a lambda parameter to `(<name>) =>`, a labelled ctor
field to a `{ _tag, <name> }` factory + destructure. When the name is a JS
reserved word the emitted JS is a `SyntaxError` (`const else = 1`) — and nothing
in the pipeline caught it, so it was a **silent miscompile** discovered only at
runtime. [ADR 0016](0016-ternary-expressions.md) hit this (the ternary node's
`else` field) and dodged it locally with a `thenE`/`elseE` rename, leaving the
general hole open: "codegen should mangle or check should reject."

## Decision

**Reject, don't mangle.** A new `checkReservedWords` pass (alongside the
existing `checkReservedNames` collection-namespace guard) walks every binding
position — `let`/`extern` names, lambda/`let…in`/`let?` parameters, pattern
binds (recursively), and labelled ctor fields — and fails with a rename hint if
the bound name is a JS reserved word:

```
'else' is a JavaScript reserved word and can't be used as a binding name; rename it
```

Object **keys** and member names (`{ default: 1 }`, `r.default`) are legal JS
and are **not** binding positions, so they stay allowed — the reject is scoped
precisely to where a `SyntaxError` would actually occur.

## Consequences

- Emitted JS stays pristine — no `else$`/`_else` mangling, no leak into the
  `.d.ts` FFI surface, no cross-module mangle-agreement to thread. This protects
  mochi's core value proposition (readable, idiomatic JS output).
- A handful of JS keywords become illegal mochi binding names; each is trivially
  renamed. The full reserved set is rejected even for names mochi could in
  principle emit safely, keeping the rule "mochi binding names ⊆ legal JS
  binding names" simple and honest.
- The silent-miscompile class is closed: a reserved-word binding is now a
  first-error `check` failure with a span, not runtime `SyntaxError`.

## Alternatives rejected

- **Mangle in codegen** (append `$`/`_`) — more expressive (ReScript does this),
  but injects output noise, leaks mangled names into exported `.d.ts`, and must
  thread consistently through def → every use → export → cross-module import.
  The blast radius and the output-cleanliness cost outweigh the expressiveness
  for names users rarely want.
