# 0069 — Fast pipe inserts into a call's first argument

- **Status:** accepted
- **Date:** 2026-08-25

## Context

Mochi's `|>` composes naturally with its curried, data-last prelude:
`value |> f(arg)` means `f(arg)(value)`. JavaScript and many FFI APIs instead
place their principal value first, making that spelling awkward.

## Decision

`value -> f(args)` is a fast pipe and lowers as `f(value, args)`. Its
right-hand side must be a call. `->` remains the type
arrow inside type expressions; parser context makes the two uses unambiguous.

Fast pipe has the same left-associative precedence as `|>`, so
`a -> f(b) -> g(c)` becomes `g(f(a, b), c)`.

Inference and code generation reuse the existing call path. The AST retains the
surface form so the formatter can print ReScript-style snug `a->f(b)` syntax.

## Consequences

- Curried data-last APIs keep using `|>`.
- Data-first FFI and direct multi-argument calls gain a concise pipeline form.
- A bare right-hand reference (`a -> f`) is rejected because there is no
  argument insertion position.
