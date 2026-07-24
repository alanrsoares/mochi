# 0007 — Universal JSX/TSX syntax desugaring (`<tag />` to `h(tag, props, children)`)

- **Status:** Proposed
- **Source:** conversation; `src/ast.ts`; `src/lexer.ts`; `src/parser.ts`; `src/codegen.ts`

## Context

`mochi` compiles to clean JavaScript and strict `tsc`-clean TypeScript. To build full-stack web applications and documentation viewers (such as Next.js/Fumadocs, React, Preact, Hono JSX, or custom Virtual DOM engines) in Mochi, the language needs a first-class story for component tree representation.

Rather than inventing a custom template engine or adding a heavy runtime virtual DOM to Mochi's standard library, Mochi can leverage its zero-overhead interop model by desugaring JSX/TSX surface syntax into calls to a universal JSX pragma function (defaulting to `h`).

## Decision

1. **Surface Syntax:**
   - **Element tags:** `<tag attr="val" prop={expr}>...children</tag>`
   - **Component tags:** `<Card title={t} count={42}>...children</Card>` (capitalized tag names map to identifier references `ref("Card")`; lowercase names map to string literals `"div"`).
   - **Self-closing tags:** `<img src="logo.png" />`
   - **Fragments:** `<>...children</>` desugars to `h(Fragment, {}, [...children])` (where `Fragment` defaults to `"div"` or `Fragment` identifier).

2. **Attribute & Prop Desugaring:**
   - String literal attribute: `title="Hello"` $\rightarrow$ record field `{ title: "Hello" }`
   - Expression attribute: `count={x + 1}` $\rightarrow$ record field `{ count: x + 1 }`
   - Boolean attribute: `disabled` $\rightarrow$ record field `{ disabled: true }`
   - Attribute spread: `{...props}` $\rightarrow$ record spread `{ ...props, extra: 1 }`

3. **Parse-Time Desugaring to Standard AST:**
   Parsing JSX constructs standard Mochi AST `Expr.call` nodes targeting the pragma function:
   ```ts
   h(tag, propsRecord, childrenList)
   ```
   Because desugaring happens directly into standard AST call nodes during parsing, the semantic checker (`check.ts`), Hindley-Milner type inference (`infer.ts`), and code generators (`codegen.ts` / `codegen-ts.ts`) require **zero modifications** to handle JSX calls.

4. **Universal Pragma Resolution:**
   - Default pragma identifier is `h`.
   - The pragma name can be configured per-file via a leading doc comment directive: `/// @jsx myPragma`.
   - Importing `h` from Preact (`import { h } from "preact"`), React (`import { h } from "hono/jsx"`), or custom host modules allows Mochi's type checker to infer and validate component props and children against host signatures automatically.

## Consequences

- **Zero Runtime Overhead:** No custom runtime library is shipped or bundled with Mochi for JSX.
- **Strict TypeScript Compatibility:** Codegen emits plain calls `h(...)` which compile cleanly under `tsc --strict` when host declarations for `h` are in scope.
- **Lexer & Parser Updates:** `lexer.ts` must disambiguate `<` as a binary comparison operator vs `<` as the start of a JSX tag in expression contexts.
- **Formatter Support:** `src/format.ts` formats desugared calls or preserves JSX syntax when formatting.

## Alternatives Rejected

- **First-class `Expr.jsx` AST Node throughout Checker & Infer:** Rejected. Adding a dedicated AST node would require updating every compiler pass (`check`, `infer`, `unify`, `codegen`, `codegen-ts`, `dts`, `symbols`, `nav`, `lsp`). Immediate parse-time desugar into `Expr.call` keeps the compiler pipeline lean and completely type-checked.
- **Builtin Mochi Virtual DOM:** Rejected. A custom VDOM would create a runtime dependency and fragment interop with popular JS UI ecosystems (React/Preact/Hono/Solid).
