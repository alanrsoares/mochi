# 0077 — mochi keywords are legal in label positions

- **Status:** Accepted
- **Source:** `packages/compiler/src/parser/parser.ts` (`expectLabel`, `parseField`, `parsePatField`, `parseAliasField`), `packages/compiler/src/lexer/lexer.ts` (`keywordText`), `packages/compiler/src/parser/keyword-labels.spec.ts`

## Context

`expectLabel` — the seam record fields, `.field` projection, and plugin
attribute lists parse names through — was an alias for `expectId`, so it
required a token of kind `id`. mochi's keywords (`let`, `type`, `extern`,
`switch`, `loop`, `recur`, `do`, `import`, `export`) lex to their own token
kinds and were therefore rejected everywhere a *label* was expected, not just
where a keyword would actually be ambiguous.

The practical cost was that ordinary host shapes became unreachable. Writing
`<button type="button">` in the docs theme toggle failed with
`ParseError: expected id, got type`, and the component shipped without the
attribute; `{ type: … }`, `props.type`, and `type Btn = { type: string }` were
equally unwritable. This is the exact hazard ADR 0020 already ruled on for
JavaScript reserved words, decided the other way round by accident: 0020
deliberately keeps keys and member names legal because they are not bindings.

## Decision

A keyword token is a legal label. `expectLabel` reads the keyword's spelling
back out of the token via `keywordText`, derived from the lexer's `KEYWORDS`
table so the two cannot drift, and yields it as an ordinary name. This covers
record field keys, `.field` projection, record-type fields, record-pattern
field names, and — through `parserApi` — plugin attribute names, which is what
makes JSX `type="button"` parse.

Nothing in a label position can begin a statement or an expression, so no
ambiguity is introduced: the parser has already committed to a record, a
projection, a type, or an attribute list before it reads the label.

**Puns stay rejected.** `{ type }` desugars to `{ type: type }` and
`| { type }` binds a variable — both are *binding* positions, and neither mochi
nor the emitted JS can spell `do` or `export` as an identifier. Those forms
fail with a diagnostic naming the explicit spelling to use instead
(`write 'type: <expr>'`).

`true`/`false` are excluded. They lex to `bool`, which carries a value rather
than a spelling, so a token cannot be mapped back to a word; they remain
unusable as labels.

## Consequences

- Host and DOM shapes whose field names collide with mochi keywords are now
  expressible without an escape hatch or a renaming seam in TypeScript.
- The keyword set may grow. Every new keyword silently becomes legal as a label
  the moment it enters `KEYWORDS`, which is the intended direction — a new
  keyword should not retroactively make a host field unreachable.
- The pun restriction is the one place a keyword label is not symmetric with an
  identifier label, and it is enforced at parse time with a specific fix, not
  discovered as a downstream JS `SyntaxError`.

## Alternatives rejected

- **Quoted labels** (`{ "type": 1 }`) — a second spelling for the same concept,
  and it does not help JSX attributes at all.
- **Escaping** (`{ \type: 1 }`, backticks) — new syntax for a problem that
  disappears once the parser stops asking for a token kind it never needed.
- **Contextual keywords** (make `type` an `id` and disambiguate by position) —
  a far larger change to the lexer/parser contract, and it would reopen the
  ambiguity this decision avoids by construction.
