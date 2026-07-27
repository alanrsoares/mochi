# 0047 — `$` is an identifier character

- **Status:** Accepted
- **Date:** 2026-07-27
- **Source:** `src/lexer.ts`, `src/parser.ts`, `bootstrap/lexer.mochi`,
  `bootstrap/parser.mochi`, `bootstrap/plugins/jsx.mochi`, `test/styled-cva.spec.ts`
- **Supersedes:** [ADR 0009](0009-styled-cva-host-interop.md) decision 1

## Context

[ADR 0009](0009-styled-cva-host-interop.md) admitted `$`-prefixed **labels** for
styled-cva transient props (`$tone`, `$size`) by lexing `$` as its own punctuation
token (`dollar`) and consuming it in one place, `expectLabel()` — legal in record keys,
JSX attribute names, and (since `7f9fb92`) after `.` in a field access.

That covered writing and reading a `$` field but not *binding* one. Every form that
needs the name in a pattern or parameter position failed with `expected id, got dollar`:

```mochi
let Chip = ({ $tone }) => <Button $tone={$tone}>{"hi"}</Button>   // ✗
let at = r => switch r { | { $tone: t } => t }                     // ✗
```

So a component could read `props.$tone` but could not destructure its own props — the
one shape idiomatic host-UI code is written in. Widening `expectLabel` to more positions
would have meant teaching every pattern and parameter production about a two-token name,
in both the TS parser and its bootstrap mirror.

## Decision

**`$` is an ordinary identifier character.** The lexer's identifier rule becomes
`[A-Za-z_$][A-Za-z0-9_$]*`; the `dollar` token is deleted. `$tone` is a single `id`
token, so *every* production that already accepts an identifier accepts it for free:
bindings, lambda parameters, record patterns and their shorthand, references, and labels.

`expectLabel` survives as a name — it is an alias of `expectId`, kept because
`parserApi` exposes it to language plugins (`src/plugins/jsx.ts`).

Consequences:

- `let $tone = 1`, `($tone) => $tone` and `({ $tone }) => $tone` are now legal. Two
  guards in `test/styled-cva.spec.ts` that asserted the opposite are inverted.
- No codegen work: `$` is already a legal JS identifier character, so names emit
  verbatim and the JS/TS backends are untouched.
- **Reserved-prefix convention unchanged.** Codegen's synthetic destructure temps are
  `$`-prefixed, and ~12 sites treat a leading `$` as "synthetic, don't surface"
  (`codegen.ts:852` skips exporting them; `dts.ts`, `nav.ts`, `symbols.ts`, `suggest.ts`
  and `codegen-ts.ts` hide them). A user-written `export let $tone` therefore still does
  not export, and `$`-named bindings stay out of hover/completion. This is a wart we
  accept for now: the alternative is renaming the temps to a sigil users cannot type,
  which is a mechanical follow-up, not a language decision.

## Alternatives rejected

- **Widen `expectLabel` to pattern/param positions.** Same surface, but the two-token
  name spreads across `precord` shorthand, `pbind`, lambda params and their bootstrap
  mirrors — more code for strictly less capability.
- **Desugar `$name` to a hidden binding.** Keeps `$` non-identifier at the cost of a
  rename layer between source and JS, breaking the "names emit verbatim" property that
  hover, `.d.ts` and the host seam all rely on.

## Not included: ML-style prime identifiers

Widening identifiers to `$` invites the sibling question — `xs'`, `ys''`, as in ML. We
considered it here and **rejected it**.

`$` was cheap precisely because it is *already* a legal JS identifier character: names
still emit verbatim, and no backend changed. `'` is not legal in JS, so it would need a
mangling scheme (`xs'` → `xs$`, or a suffix chain) applied at every site that writes a
name into output — ~15 in `codegen.ts` plus `codegen-ts.ts`, `dts.ts` and
`vite-plugin.ts` — and mirrored byte-exactly in the bootstrap codegen, since the fixpoint
gate compares emitted bytes.

The cost is not the mangling, it is what mangling breaks:

- **Names stop emitting verbatim.** Hover, `.d.ts` and the host seam all assume the name
  you write is the name JS sees. A rename layer means every surface has to fold back.
- **Every scheme collides.** `'` → `$` collides with the now-legal `xs$`; `'` → `_p`
  collides with ordinary `xs_p`. Collisions are catchable with a new check pass, but that
  is a diagnostic users would hit for a purely cosmetic naming affordance.
- **Restricting `'` to non-exported names** would keep the seam clean, at the cost of a
  positional rule (illegal in exports, record fields and JSX attributes) that has no
  analogue anywhere else in the language.

`'` remains a lex error (`unexpected char '''`). Shadowing in a `let … in` chain or a
distinct name covers the cases prime notation is reached for. If this comes back, it comes
back as its own ADR with a single `jsName()` chokepoint in codegen as step one.
