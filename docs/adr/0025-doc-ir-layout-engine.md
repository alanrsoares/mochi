# 0025 — Wadler/Prettier-style `Doc` IR and layout engine

- **Status:** Accepted
- **Source:** `src/doc.ts`

## Context

The formatter (`format.ts`) needs to decide, per construct, whether it fits
on one line or must break across several with correct indentation. Emitting
strings directly forces that decision too early and can't be revisited once
concatenated. `LanguagePlugin`'s `format` hook (ADR-0011) needs the same
capability for plugin-owned syntax (e.g. JSX) — a hook that returned a raw
string would lose line-breaking/indentation the moment its output landed
inside a group.

## Decision

Split a Wadler/Prettier-style document IR out of `format.ts` into its own
module, `doc.ts`, as shared vocabulary rather than a private one. `Doc` is a
small union (`text`, `line`/`softline`/`hardline`, `cat`, `indent`, `group`,
`breakparent`, …); `group` asks "does the flat rendering fit the rest of this
line?" and picks flat-or-broken; `breakparent` is zero-width but forces every
enclosing group to break (used after a trailing `//` comment so following
content lands on a fresh line rather than being commented out). `format.ts`
lowers the AST to a `Doc` and renders it at 80 columns; plugin `format` hooks
build `Doc`s directly.

## Consequences

- Formatting decisions (break vs. flat) are made once, at render time, with
  full lookahead — not baked in eagerly during AST-to-string lowering.
- Any plugin wanting pretty output (not just JSX) gets the same layout
  primitives for free instead of reimplementing line-breaking.

## Alternatives rejected

- **Keep the IR private inside `format.ts`** — blocks plugin `format` hooks
  from composing with the surrounding layout (ADR-0011).
