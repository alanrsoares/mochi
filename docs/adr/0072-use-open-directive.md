# 0072 — Open-world mode uses a header directive

- **Status:** Accepted
- **Source:** `packages/compiler/src/compile/open-mode.ts`, `packages/compiler/src/parser/parser.ts`, `packages/dx/src/format.ts`

## Context

Open-world inference is an intentional per-file escape hatch for host-global-heavy
adapters. Its `// @mochi open` comment pragma was easy to overlook and placed at the
end of several files, away from the mode it selected.

## Decision

`"use open"` is the file's first string-literal directive and enables open-world
inference. It is parser metadata, so it does not become a program expression or emit
to JavaScript. `fmt` always writes it as the first line, followed by a blank line.

## Consequences

- Open-world mode is visible at the file header, alongside familiar JavaScript
  directives such as `"use client"`.
- The former comment pragma is not supported; files must use the directive.
- The parser and bootstrap parser must both discard the leading directive token.

## Alternatives rejected

Keeping a comment-only pragma preserves a non-language surface and cannot guarantee
its placement. Adding an AST-level program directive would add codegen and bootstrap
representation work even though inference alone consumes the mode.
