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
| lex | `bootstrap/lexer.mochi` | text → tokens with half-open spans and attached docs |
| parse | `bootstrap/parser.mochi` | Pratt parser → `Program`; errors are values, recovery preserves holes |
| check | `bootstrap/check.mochi` | name registry, duplicate-decl, `switch` exhaustiveness (incl. imported variants) |
| typecheck | `bootstrap/infer.mochi` | Algorithm W (mutual recursion via Tarjan SCC), row+type unification (`unify`, `schemes`) |
| codegen | `bootstrap/codegen.mochi` | **pure, non-failing** AST → JS; TS backend in `codegen-ts.mochi` |

Compiler sources live under `bootstrap/`; the hand-authored TypeScript core
has been deleted (ADR 0131). The public API runs through TypeScript bootstrap
façades in `packages/compiler/src/bootstrap/`. Compiler contracts live in seed-owned specs,
conformance cases, and host integration tests.

`bootstrap/module.mochi` drives multi-file graphs: DFS load, cycle detection,
cross-module inference and exhaustiveness. `packages/compiler/src/prelude/` holds the builtin HM signatures
and the namespace tables; its `runtime.ts` is the runtime itself — TypeScript source
both backends share, with `js-defs.gen.ts` the type-stripped view the JS backend
inlines from ([ADR 0075](adr/0075-runtime-source-of-truth.md)). `bootstrap/compile.mochi` is the single-file
railway; `@mochi/cli` is the host CLI; `@mochi/lsp` is a thin adapter over `@mochi/dx`
surfaces ([ADR 0048](adr/0048-core-dx-package-boundary.md)).

## The plugin seam

Core (`bootstrap/{lexer,parser,infer,dts,format}.mochi`) carries no
kit-specific or JSX-specific knowledge. `bootstrap/extensions.mochi`
defines the `BootstrapPlugin` protocol, exposed by the host options façade.
Parse, inference, formatting, binding-type, and completion hooks are
consulted at their pass seams. `resolvePlugins` implements the opt-in/opt-out rule
every entry point (`compile`, the module graph, `dts`, `@mochi/vite-plugin`, the LSP) uses:
a caller's `plugins` list omitted resolves to the builtin list; `[]` is a hard opt-out
(no plugins, not even builtins); a non-empty list gets builtins **prepended**. JSX is
the first builtin, `bootstrap/plugins/jsx.mochi`'s plugin — parsing `<tag/>` into
`h(tag, props, children)`, its prop-row inference, the formatter's re-fold (as a `Doc`,
`bootstrap/doc.mochi`), and its component `.d.ts`/TS binding type, all in one file instead of four
core seams. `@mochi/plugin-styled-cva` is a vendor plugin built the same way, outside
the compiler tree. See [ADR 0011](adr/0011-language-plugins.md).

Host interop end state ([ADR 0012](adr/0012-host-interop-end-state.md)): prefer typed
`extern`, then core literal/union formers, then thin sugar plugins that *assign*
those formers; keep heavy host generics in outbound `.d.mochi.ts`. Wave 6 AST→string
dts adapters are bridges (ReScript: declared FFI type is ground truth; genType is
outbound-only). Tracker: Wave 7 in [`dx-tracer-bullets.md`](dx-tracer-bullets.md).

Unification failures gain their source spans at the inference seam. Bootstrap
tagged diagnostics become host `Diagnostic` values (`kind: lex | parse | check | type`)
through the façades.

## Two backends, one codegen

Structural pattern compilation lives in `bootstrap/codegen-pattern.mochi`.
Its three operations render ordered tests, binding slots, and refined TS types
from a checked pattern and constructor field keys. Both emitters and lazy-List
arm elements use this interface; expression emission and iterator pulling stay
in `codegen.mochi` ([ADR 0135](adr/0135-structural-pattern-codegen.md)).

mochi emits **JavaScript** and **strict-`tsc`-clean TypeScript** from the same AST. The
JS backend (`bootstrap/codegen.mochi`) is pure and non-failing. `codegen-ts.mochi` wraps it, feeding type
annotations pulled from the inference table; it does not re-emit — the two outputs are
byte-identical apart from the annotations TS adds. The result typechecks under
`tsc --strict` with no `any` and no escape hatches.

What ships runs `bootstrap/codegen-ts.mochi` and
`bootstrap/dts.mochi`. That covers the CLI `ts`/`dts`/`build --emit=ts`
commands, `gen-mochi-dts`, and the `@mochi/compiler` barrel's `compile`,
`codegenTs`, `emitDts` and `compileTargets`, whose `plugins` are
`BootstrapPlugin`s ([ADR 0125](adr/0125-bootstrap-compile-targets.md),
[ADR 0126](adr/0126-barrel-typed-emit-on-bootstrap.md),
[ADR 0127](adr/0127-barrel-takes-bootstrap-plugins.md)). There are no
hand-authored TypeScript emitters or differential oracle (ADR 0131).

Core Mochi uses exhaustive `switch`; TypeScript host tooling uses
`@onrails/pattern`'s `.exhaustive()`. Ordinary emitted code does not use it: a `switch`
lowers to a ternary chain over its scrutinee, and only the TS backend falls back to a
`match()` chain for a nested arm on a scrutinee type it cannot name
([ADR 0113](adr/0113-switch-lowers-to-ternaries.md)).

## Self-hosting

The compiler is authored in mochi under `bootstrap/` (`lexer.mochi`,
`parser.mochi`, `check.mochi`, `infer.mochi`, `codegen.mochi`, `module.mochi`, …).
The graph retains `.mjs` host seams: hand-written `host.mjs` (IO/resolver shims)
and generated, checked prelude/plugin tables. Compiler passes are compiled from
the `.mochi` sources.

`bootstrap/` mirrors the JSX-as-plugin seam (Wave 8 / ADR 0011 §6): parse +
inferCall live in `bootstrap/plugins/jsx.mochi`, registered through
`bootstrap/extensions.mochi` (`resolvePlugins` — same opt-in/opt-out rule as
the host façades). Hooks are Result/(toks, pos) shaped (no imperative `ParserApi`);
typed and declaration emission share binding-type hooks. The JSX
plugin's `formatDoc` hook re-folds its `h(...)` calls back into tags in
`format.mochi` (ADR 0112), which is also the formatter used by DX.
`fixpoint` (below) still compares *emitted output*. The checked-in
`bootstrap/seed/` graph is the stage-1 TypeScript snapshot. It is a
reviewed emitted artifact with a SHA-256 manifest, not an editable source;
ADR 0090's chain is Mochi → that graph → stage-2 JS → stage-3 JS. ADR 0105's
reviewed conformance corpus replaced the temporary TypeScript differential build;
the CLI itself has no TypeScript path. `mochi <file>`, `ts`, `dts` and `build` all run the frozen
graph under every flag, because the self-hosted core takes `open`, `docs`,
`moduleExt` and `strictEntry` as real options
([ADR 0104](adr/0104-self-hosted-core-takes-the-compile-options.md)).

Three invariants are enforced in CI-style scripts:

- **`bun run fixpoint`** — the frozen stage-1 TypeScript graph compiles `bootstrap/`,
  and the output reproduces itself byte-for-byte across stages (stage2 ≡ stage3).
  Refresh the snapshot with `bun run seed:freeze`.
- **`bun run bootstrap:conformance`** — checked-in black-box contracts guard
  emitted output, diagnostics, graph behavior, runtime behavior, and typed TS.
- **`bun run bootstrap:self-tsc`** — emit the whole graph with the self-hosted
  backend as TypeScript and count
  `tsc --strict` errors. The north-star number is **0**; a ratchet fails the build if it
  regresses above 0.

`check:full` runs these invariants alongside `seed:check`. The duplicate
TypeScript-oracle `bootstrap:tsc` ratchet was folded into `bootstrap:self-tsc`
(ADR 0130).

### Development ownership

For compiler behavior covered by `bootstrap/`, Mochi is the authoring source:
make the semantic change in the self-hosted graph and extend its conformance
contract when it changes an observable. Refresh the generated seed with
`seed:freeze`; do not hand-edit it or maintain a TypeScript twin. This does
**not** make the whole repository Mochi-only: the runtime, host seams, and DX
adapters remain TypeScript-owned. Strict TS and declaration emission are
self-hosted. See [ADR 0131](adr/0131-delete-hand-authored-typescript-core.md),
which supersedes ADR 0078's dual-write requirement.
