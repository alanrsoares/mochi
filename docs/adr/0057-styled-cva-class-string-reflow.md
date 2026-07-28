# 0057 — styled-cva class-string reflow in the formatter

- **Status:** accepted
- **Date:** 2026-07-28
- **Source:** owner request ("styled-cva formatter should breakdown long-ass
  classNames into multiline concat strings")
- **Deepens:** ADR 0011 (plugin `format` hooks), ADR 0025 (Doc IR)

## Context

styled-cva base/variant class strings routinely exceed the formatter's 80-col
width (`apps/docs/src/ui/primitives.mochi` had 20 lines over 100 chars, worst
297). A string literal prints as one atomic `txt`, so the formatter could only
push it to its own line, not shrink it. The one hand-written `++` split in the
repo (GhostPillBtn) had dropped the separator spaces — `"…colors" ++ "hover:…"`
concatenates to `…colorshover:…`, silently fusing three Tailwind classes. That
is exactly the failure mode a human makes and a formatter must not.

The formatter must not reflow strings *in general* — string content is data,
and hand-split `++` chains elsewhere (bootstrap's JS-runtime strings) choose
their boundaries semantically. Only styled-cva knows its strings are
space-separated class lists. That makes this a vendor `format` hook, not core.

## Decision

1. **The styled-cva plugin gains a `format` hook.** In a `tw.*` factory call it
   canonically re-fills class-string values — the base string arg and string
   fields (recursively) of the config record. Over-width strings split into a
   `++` chain; existing pure-string chains re-fill; a chain that fits collapses
   back to one literal. Chains with dynamic parts are left alone.
2. **Value preservation is absolute.** Segments concatenate byte-identically to
   the source string: breaks land only on spaces, and the space stays *visible*
   at the head of the continuation (`"…colors" ++ " hover:…"`). Joining a
   broken hand-split does NOT invent spaces — fused classes stay fused (fix the
   source, not silently in the formatter).
3. **Layout is delegated to core.** The hook rewrites the AST (a synthesized
   `concat` spine) and returns `api.exprD(rewritten)` — the core `concatD`
   printer lays it out exactly like a hand-written chain, and the hook,
   re-entered on its own output, finds it canonical and returns null (fixed
   point, so `format∘format = format` holds).
4. **Leading `++` stays.** Surveyed: Elm (`elm-format`, the same `++`),
   Haskell, OCaml, F#, Rust, PEP 8 all break *before* the operator; trailing
   operators are a JS/Prettier convention. mochi keeps the ML-family style.
5. **`scripts/fmt.ts` formats each tree with its vendor plugins** (static
   imports mirroring `gen-mochi-dts`), so the gate agrees with the LSP (which
   already loads `mochi.plugins.ts`). The CLI `fmt` still formats with builtins
   only — a plugin-blind run leaves an existing canonical chain untouched (core
   `concatD` is stable on it); it just won't split virgin long strings.

## Consequences

- `apps/docs` and `examples/snake` primitives reformat once; GhostPillBtn's
  fused classes were repaired at the source (restored to the correct
  single string, then auto-split).
- Width budgets are computed from the canonical layout (arg col 2, chain
  indent +2, `++ ` prefix, 2 cols per record nesting level + field name) — an
  approximation of the real render column, deterministic and therefore
  idempotent even where it is off by a few columns.
- Each `++` link costs one curried `concat` call at module init (the prelude's
  polymorphic `concat`); class factories run once per module, so this is noise.
- Guards: `test/styled-cva-format.spec.ts` (split, fixed point, byte-identical
  reconstruction, fused-stay-fused, dynamic/short/non-tw untouched, variants
  reflow, plugin-off inertness).

## Alternatives rejected

- **Core `concatD` re-fill for all pure-string chains** — would rewrite
  bootstrap's hand-segmented JS-runtime strings, whose boundaries are chosen
  for meaning, and collapse intentional short chains (existing spec pins both).
- **Trailing `++` (Prettier style)** — against kin-language precedent; would
  also churn every existing chain.
- **Normalizing whitespace while joining** — repairs fused classes silently but
  makes the formatter change runtime values. Never.
