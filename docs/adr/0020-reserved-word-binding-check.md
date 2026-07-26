# 0020 — Reject JS-reserved-word binding names (no mangling)

- **Status:** Accepted
- **Source:** `src/check.ts:441-460` (`JS_RESERVED` set + binding-position check), `test/reserved-words.spec.ts`

## Context

mochi identifiers lower 1:1 to JS bindings. A lowercase identifier used in a
*binding* position — `let`/`extern` name, lambda/`letin`/`letbind` param,
pattern bind, labelled constructor field — that happens to be a JS reserved
word (`else`, `default`, `class`, …) would emit `const else = …` or
`(else) => …`: a JS `SyntaxError` at runtime, or worse, a silent miscompile if
some backend path tolerated it.

## Decision

mochi keeps its emitted JS pristine — no automatic name-mangling to dodge the
collision. Instead `check.ts` maintains a `JS_RESERVED` word set and rejects
any reserved word in a binding position at check time, with a rename hint.
Object **keys** and member-access names (`{ default: 1 }`, `r.default`) are
legal JS and are *not* binding positions, so they stay allowed unchanged.

## Consequences

- Errors surface at compile time with a specific rename suggestion instead of
  a cryptic downstream JS syntax error or, worse, silently-wrong output.
- Binding-position detection must stay in sync with every AST shape that
  introduces a name (`let`, `extern`, lambda/`letin`/`letbind` params, pattern
  binds, labelled ctor fields) — missing one reopens the hazard.

## Alternatives rejected

- **Auto-mangle reserved names** (e.g. `else` → `else_`) — breaks the
  "emitted JS reads like the source" property and complicates hover/dts.
