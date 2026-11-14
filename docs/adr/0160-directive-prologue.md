# 0160 — Directive prologue passes host directives through

- **Status:** Accepted
- **Date:** 2026-11-14
- **Source:** port of `~/dev/alanrsoares.me` (Next.js App Router) to Mochi
- **Extends:** [ADR 0072](0072-use-open-directive.md) (`"use open"`), [ADR 0087](0087-expr-statements.md) (top-level expressions are unit)

## Context

React Server Components bundlers (Next.js, Vite RSC) find a module's boundary
from a JavaScript directive such as `"use client"` or `"use server"`. The
directive must be the first statement of the emitted module, before every import.

Mochi had one directive, `"use open"`, and the parser dropped it only at token 0.
Any other leading string was parsed as an expression statement. ADR 0087 types such
a statement as `()`, so `"use client"` failed with
`cannot unify "use client" with ()`. A Mochi file could not be a client component.

## Decision

1. **A directive prologue.** The parser drops each leading string literal whose
   next token can start a statement but cannot continue an expression (a string,
   template, identifier, number, boolean, `let`, `type`, `extern`, `import`,
   `export`, `switch`, `loop`, `do`, or end of file). `"use client"->log()`
   stays an expression. A bare string statement never types as `()`, so this
   changes no valid program.
2. **Host directives emit first.** Every JS and TS emit path (single file, module
   graph, `compileTargets`) puts each directive except `"use open"` at the top of
   the output, as `"…";`, in source order. Codegen stays pure: the compile layer
   adds the prologue after it.
3. **`"use open"` is one directive among many.** It still selects open-world
   inference, but it may sit anywhere in the prologue. It never emits.
4. **One source of truth, no second lex.** `scanPrologue(src, limit)`
   (`lexer/str-scan.mochi`) reads the leading literals from source text, bounded by
   the first statement's span. The parser dropped exactly the literals before that
   span, so the scan and the parser cannot disagree.
5. **`fmt` keeps the prologue as written.** The printer restores the prologue source
   text (comments among it included, trailing blanks trimmed), then a blank line,
   then the body.

## Consequences

- A `.mochi` module can be a Next.js client or server component boundary.
- Mochi does not validate directive names. A typo such as `"use clinet"` emits as
  written, and the host bundler ignores it, as it does in JavaScript.
- `"use open"` followed by a token that continues an expression is now an
  expression, not a directive. No real file has this shape.

## Alternatives rejected

- **A `SDirective` AST statement.** It is the most explicit design, but every pass
  (check, infer, both backends, dts, format, symbols, the parity normalizer) must
  learn to skip or print it. The span-bounded scan gives the same result with no
  AST change.
- **An allowlist of known directives.** Bundlers add directives over time
  (`"use cache"`, `"use workflow"`). Mochi has no reason to track them.
