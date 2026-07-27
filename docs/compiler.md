# The compiler

## Pipeline

A two-track railway. Lex/parse return `Result<_, Diagnostic>`; check/infer return
`Result<_, Diagnostic[]>` (ADR 0004). Codegen/`format` do not fail with diagnostics.
Pipeline seams wrap a single lex/parse error as a one-element array.

```
string ─lex→ Located[] ─parse→ Program ─check→ Program ─typecheck→ Program ─codegen→ string
```

| Stage | Module | Responsibility |
|---|---|---|
| lex | `lexer/` | text → tokens, each with a half-open `Span`; `///` docs attach via `pendingDoc` |
| parse | `parser/` | Pratt parser → `Program` (throws `ParseAbort` internally, caught at the boundary) |
| check | `check/` | name registry, duplicate-decl, `switch` exhaustiveness (incl. imported variants) |
| typecheck | `infer/` | Algorithm W (mutual recursion via Tarjan SCC), row+type unification (`unify`, `schemes`) |
| codegen | `codegen/` | **pure, non-failing** AST → JS; TS backend in `codegen-ts` |

Sources live under `packages/compiler/src/<component>/` — each folder has an `index.ts`
barrel and colocated unit specs. `@mochi/compiler/*` export URLs are unchanged.

`module/` (`buildModules`) drives multi-file graphs: DFS load, cycle detection,
cross-module inference and exhaustiveness. `prelude/` holds the builtin HM signatures,
the JS runtime strings, and the namespace tables. `compile/` is the single-file
railway; `@mochi/cli` is the host CLI; `@mochi/lsp` is a thin adapter over `@mochi/dx`
surfaces ([ADR 0048](adr/0048-core-dx-package-boundary.md)).

## The plugin seam

Core (`lexer.ts` / `parser.ts` / `infer.ts` / `dts.ts`) and DX `format`
(`@mochi/dx`) carry no kit-specific or JSX-specific knowledge. `extensions.ts`
defines `LanguagePlugin` —
optional `parse` / `inferCall` / `format` / `bindingType` / `dtsBinding` hooks,
consulted at one seam per pass — and `resolvePlugins`, the single opt-in/opt-out rule
every entry point (`compile`, the module graph, `dts`, `@mochi/vite-plugin`, the LSP) uses:
a caller's `plugins` list omitted resolves to the builtin list; `[]` is a hard opt-out
(no plugins, not even builtins); a non-empty list gets builtins **prepended**. JSX is
the first builtin, `plugins/jsx.ts`'s `jsxPlugin` — parsing `<tag/>` into
`h(tag, props, children)`, its prop-row inference, the formatter's re-fold (as a `Doc`,
`doc.ts`), and its component `.d.ts`/TS binding type, all in one file instead of four
core seams. `@mochi/plugin-styled-cva` is a vendor plugin built the same way, outside
the compiler tree. See [ADR 0011](adr/0011-language-plugins.md).

Host interop end state ([ADR 0012](adr/0012-host-interop-end-state.md)): prefer typed
`extern`, then core literal/union formers, then thin sugar plugins that *assign*
those formers; keep heavy host generics in outbound `.d.mochi.ts`. Wave 6 AST→string
dts adapters are bridges (ReScript: declared FFI type is ground truth; genType is
outbound-only). Tracker: Wave 7 in [`dx-tracer-bullets.md`](dx-tracer-bullets.md).

The one error-type seam worth knowing: `unify.ts` speaks a narrow `TypeErr`; it becomes
the unified `Diagnostic` (`kind: lex | parse | check | type`) only at `infer.ts`'s `u()`
seam, which is where the span gets attached.

## Two backends, one codegen

mochi emits **JavaScript** and **strict-`tsc`-clean TypeScript** from the same AST. The
JS backend (`codegen.ts`) is pure and non-failing. `codegen-ts.ts` wraps it, feeding type
annotations pulled from the inference table; it does not re-emit — the two outputs are
byte-identical apart from the annotations TS adds. The result typechecks under
`tsc --strict` with no `any` and no escape hatches.

`@onrails/pattern`'s `.exhaustive()` runs *inside* the compiler (a missing `Expr`
case is a TS error at build time) and is also *emitted into* the user's JS.

## Self-hosting

The compiler is re-implemented in mochi under `bootstrap/` (`lexer.mochi`,
`parser.mochi`, `check.mochi`, `infer.mochi`, `codegen.mochi`, `module.mochi`, …). Two
host files stay hand-written as `.mjs`: `host.mjs` (IO/resolver shims) and
`prelude.gen.mjs` (the generated, parity-guarded prelude-table shim). Everything else is
compiled from the `.mochi` sources.

`bootstrap/` mirrors the JSX-as-plugin seam (Wave 8 / ADR 0011 §6): parse +
inferCall live in `bootstrap/plugins/jsx.mochi`, registered through
`bootstrap/extensions.mochi` (`resolvePlugins` — same opt-in/opt-out rule as
`src/`). Hooks are Result/(toks, pos) shaped (no imperative `ParserApi`);
format/dts hooks are absent because those passes do not exist in bootstrap.
`fixpoint` (below) still compares *emitted output*.

Two invariants are enforced in CI-style scripts:

- **`bun run fixpoint`** — the shipped binary compiles `bootstrap/`, and the output
  reproduces itself byte-for-byte across stages (stage2 ≡ stage3), and matches the TS
  reference build (stage2 ≡ TS).
- **`bun run bootstrap:tsc`** — emit the whole graph as TypeScript and count
  `tsc --strict` errors. The north-star number is **0**; a ratchet fails the build if it
  regresses above 0.

Both invariants run in CI: mochi compiles mochi, and the emitted TypeScript typechecks.
