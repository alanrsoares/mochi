# 0099 — Retain docstrings in emitted JS, TS, and .d.ts

- **Status:** Accepted
- **Date:** 2026-08-29
- **Source:** [ADR 0026](0026-codegen-ts-strict-clean-backend.md), [ADR 0078](0078-mochi-first-self-hosted-core.md), [ADR 0090](0090-bootstrap-chain.md)

## Context

Mochi attaches `///` leading doc comments to top-level `let`, `type`, and `extern` statements during lexing and parsing (`Stmt.doc`). This metadata has been surfaced in Mochi-side IDE hover queries (`packages/dx/src/hover.ts`).

However, the code generators (`packages/compiler/src/codegen/` and `packages/compiler/src/dts/`) previously dropped `doc` entirely during emission. As a result:
- Emitted JavaScript, TypeScript (`.ts`), and declaration (`.d.ts`) files lost all author documentation.
- Downstream JavaScript and TypeScript consumers importing compiled Mochi libraries had no hover tooltips or autocomplete docstrings in their editors.
- Documentation tools (TypeDoc, API Extractor) could not discover module or function documentation from emitted artifacts.

## Decision

Retain `doc` comments by formatting them as standard JSDoc `/** ... */` block comments on declarations across all emitter backends:

1. **JSDoc Formatting (`jsDoc`)**:
   - A pure formatter converts `doc?: string` into a standard multi-line JSDoc block `/**\n * ...\n */\n`.
   - Paragraph breaks (`\n\n`) are preserved as blank comment lines (` *`).
   - Premature comment closers (`*/`) within doc text are safely escaped as `*\/`.

2. **JavaScript Codegen (`codegen-decl.ts` & `bootstrap/codegen.mochi`)**:
   - `let`: Prepend `jsDoc(s.doc)` before `const ${s.name} = ...` / `export const ${s.name} = ...`. Synthetic destructuring temporaries (`$d0`) are excluded.
   - `extern`: Prepend `jsDoc(s.doc)` before the emitted binding.

3. **TypeScript Codegen (`codegen-ts.ts` & `bootstrap/codegen-ts.mochi`)**:
   - `type`: Prepend `jsDoc(s.doc)` before `export type ${name} = ...` (variant unions and record aliases alike).
   - `let` and `extern`: Emitted via the shared codegen pass with type annotations.

4. **Declaration Emit (`dts.ts`)**:
   - Prepend `jsDoc(s.doc)` before `export declare const ${letin.name}: ${ty};` and `export type ${type.name} = ...;`.

5. **Configurability (`docs?: boolean` & `--no-docs`)**:
   - Docstring retention is enabled by default across all passes (`docs: true`).
   - Callers can opt out programmatically by passing `docs: false` in `CodegenOptions`, `CodegenTsOptions`, `EmitDtsOptions`, `CompileOptions`, and `ModuleGraphOptions`.
   - CLI commands (`mochi`, `mochi ts`, `mochi dts`, `mochi build`) accept `--no-docs` to strip doc comments during emission.

6. **Self-Hosted Bootstrap Parity (`bootstrap/`)**:
   - `bootstrap/codegen.mochi` and `bootstrap/codegen-ts.mochi` mirror the TypeScript oracle's `jsDoc` formatting logic and `docs: bool` threading to maintain byte-for-byte fixpoint parity (`bun run fixpoint`) and strict typing (`bun run bootstrap:tsc`).

## Consequences

- All exported and top-level functions, values, types, and externs carry clean JSDoc comments into emitted `.js`, `.ts`, and `.d.ts` files by default.
- Programmatic callers and CLI users can opt out via `docs: false` / `--no-docs`.
- Full IDE hover documentation and autocomplete descriptions work seamlessly for downstream TypeScript and JavaScript consumers.
- Self-hosted compiler maintains byte-for-byte fixpoint reproducibility (`stage2 ≡ stage3 ≡ TS reference`).
