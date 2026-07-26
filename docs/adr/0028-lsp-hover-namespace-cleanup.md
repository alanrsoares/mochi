# 0028 — Drop inlay hints; hover-only type surface, namespace cleanup

- **Status:** Accepted
- **Source:** `src/hover.ts`, `src/lsp/server.ts`

## Context

Early LSP work exposed both inlay hints (inline ghost-text type annotations)
and hover tooltips for type information. Inlay hints for a language this
densely typed turned into visual noise — nearly every binding grows a hint —
without adding information hover doesn't already give on demand.

## Decision

Drop inlay hints entirely; hover is the sole on-demand type surface. The LSP
server (`lsp/server.ts`) does not advertise or implement
`textDocument/inlayHint`; `hover.ts` is the single source of type-at-position
text, cleaned up to use consistent namespace-qualified type names so the same
type reads identically whether shown via hover, `.d.ts` emission, or a
diagnostic.

## Consequences

- Editor surface for types is opt-in (hover on demand) rather than
  always-on — matches `alang-lsp-taste` design taste for this language.
- One code path (`hover.ts`) owns type-name rendering, so `.d.ts`/hover/
  diagnostics can't drift into inconsistent naming independently.

## Alternatives rejected

- **Keep inlay hints, tune density** — still competes with hover for the
  same information with no distinct use case gained.
