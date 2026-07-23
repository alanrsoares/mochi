# Docstrings: a prettier doc language for mochi

## Status

**Delimiter shipped; structured docs still proposed.** Today the lexer attaches
an own-line leading `///` block to the next token as `doc` (`src/lexer.ts`), the
parser rides it onto the `let` node (`doc?: string`, `src/ast.ts`), and the LSP
server renders it verbatim into hover markdown below the type fence
(`src/lsp/server.ts:40`). `//` is always an ordinary comment. There is no
structure, no summary/body split, no doctest pass, and no link resolution yet.
This doc plans that real docstring language on top of the chosen delimiter.

## Why

Every mainstream doc language (JSDoc, Javadoc, docstrings-with-types) spends most
of its syntax **restating types** — `@param {number} x`, `@returns {string}`.
mochi infers types with Hindley-Milner. Restating them is pure noise and, worse,
a second source of truth that drifts from the real signature.

So the design lever is sharp: **a docstring must carry only what the type system
cannot express.** That is a short list —

- **intent** — what the function is *for*, the one thing the type can't say;
- **examples** — concrete input → output, ideally executable;
- **laws / invariants** — `reverse(reverse(xs)) == xs`, edge-case behavior;
- **cross-references** — "see also [[clamp]]".

Everything a docstring *shouldn't* do (parameter types, return types, generic
bounds) mochi already renders in hover from inference. The doc language stays
small because the type system does the heavy lifting.

## Design (syntax-independent)

The extracted doc should have the same shape regardless of delimiter:

1. **Summary** — the first paragraph (up to the first blank line). Short, one
   line ideally. Surfaced wherever docs are useful: hover first, completion
   `detail` once mochi has a completion provider, and optionally inlay. This is
   the split we lack today.
2. **Body** — Markdown, flowed to hover as-is (hover already renders markdown).
3. **`mochi` example blocks** — fenced ` ```mochi ` blocks hold *real mochi*.
   The check pipeline lexes/parses/typechecks each block against the current
   module so a lying example fails `bun run check` (doctests). A `// ⇒ value`
   or `// value` trailing comment is the expected result; a later slice can
   actually evaluate it via codegen.
4. **`[[symbol]]` links** — resolve to a declaration in scope; hover-navigable,
   flagged if dangling. Never a type annotation.

Explicitly **out of scope**: any `@param`/`@returns`/`@type` tag. If a reader
needs a parameter's type, they hover it. Param *intent* that isn't obvious from
the name is written as prose ("`lo` and `hi` may be passed in either order").

### Rendering targets

- **Hover** (`src/hover.ts` → `src/lsp/server.ts`): fence the inferred signature,
  then summary, then body, then rendered examples. Roughly what ships now, but
  reading a *structured* doc instead of a raw string.
- **Completion detail**: summary line only, after a completion provider exists.
- **`bun run check`**: add a new doctest pass so the existing check command
  typechecks every `mochi` example block.
- **`src/dts.ts`**: carry the summary into generated `.d.ts` as a leading `/** */`
  so TS consumers see it.

## Syntax Decision

`///` line docs are the implemented delimiter. The alternatives below are kept
as decision context; all options would have produced the same extracted
structure above.

### Option A — `///` line docs (Rust/Swift) — SHIPPED

```mochi
/// Clamp `x` into [lo, hi]. Returns lo if below, hi if above.
///
/// ```mochi
/// clamp(5, 0, 10)   // 5
/// clamp(-3, 0, 10)  // 0
/// ```
///
/// See also [[min]], [[max]].
let clamp = (x, lo, hi) => ...

// an ordinary throwaway comment — NOT a doc
```

- **Pros**: no close delimiter to balance; distinguishes doc from throwaway `//`
  cleanly; composes with the existing pending-doc lexer state. Cheng-Lou-minimal.
- **Cons**: repeated sigil on every line; multi-line examples carry `/// ` margins
  the lexer must strip (one rule: drop leading `/// ` / `///`).

### Option B — `/** */` block docs (JSDoc-ish)

```mochi
/**
 * Clamp `x` into [lo, hi].
 *
 * ```mochi
 * clamp(5, 0, 10)  // 5
 * ```
 */
let clamp = (x, lo, hi) => ...
```

- **Pros**: familiar to JS/TS eyes; one open/close pair, no per-line sigil.
- **Cons**: the lexer has no block-comment scanner today — new state to add;
  margin-star (` * `) stripping is fiddly and a classic source of mangled code
  blocks; a missing `*/` swallows the file.

### Option C — keep `//`, formalize on top

```mochi
// Clamp `x` into [lo, hi].
//
// ```mochi
// clamp(5, 0, 10)  // 5
// ```
let clamp = (x, lo, hi) => ...
```

- **Pros**: would have preserved the old pending-doc delimiter behavior with the
  least migration churn.
- **Cons**: **no way to tell a doc from an ordinary comment** — every own-line
  `//` block becomes a docstring whether you meant it or not. This is the wart
  that motivated the proposal; keeping it caps how pretty things get.

## Recommendation

**Option A (`///`) shipped.** It is the smallest change that fixes the core wart
(doc-vs-throwaway ambiguity), needs no new comment-scanner, and reuses the
pending-doc machinery almost verbatim. `/** */` buys familiarity at real lexer
cost and the margin-star mangling it's meant to avoid; `//` can't distinguish
intent from noise.

## Remaining build sequence

1. **AST/parser**: replace `doc?: string` with `doc?: DocBlock` where
   `DocBlock = { summary: string; body: string; examples: DocExample[] }`; parse
   the raw text into that shape (summary = up to first blank line; scan fenced
   ` ```mochi ` blocks out of the body).
2. **Hover/completion**: render the structured block; summary into completion
   detail.
3. **Doctests**: a `bun run check` pass that lexes+parses+typechecks each
   example against its module; failures are diagnostics with the example's span.
4. **`[[ref]]` resolution**: resolve links against module scope; dangling links
   warn. (Navigable go-to-def is a later LSP slice.)
5. **`.d.ts`**: emit the summary as `/** */` in `src/dts.ts`.

Structured docs in hover are the minimum that makes docs "prettier"; doctests,
links, and `.d.ts` output are the payoff that no types-in-docstrings language
can match.
