# Tooling

All tooling is driven from the compiler itself — the LSP, formatter, and `.d.ts`
generator are surfaces over the same passes, not separate reimplementations.

## CLI

`bun run mochi` is `bun src/cli.ts`. With no subcommand it compiles one file to JS on
stdout; the subcommands select another output:

```bash
bun run mochi <file.mochi>          # compile to JavaScript (stdout)
bun run mochi ts   <file.mochi>     # emit typed, strict-clean TypeScript
bun run mochi fmt  <file.mochi>     # pretty-print (add --write to edit in place)
bun run mochi dts  <file.mochi>     # emit a .d.ts
bun run mochi build <entry.mochi>   # compile a module graph, writing a .js beside each source
                                    #   build --emit=ts writes .ts for the whole graph
```

`extern` bindings name a host module by path (`extern log : … = "./host.mjs" "log"`);
codegen emits that specifier verbatim, so host runtimes are plain `.mjs` files Bun
resolves at runtime, and the TS backend emits a matching `.d.mts` for them.

## QA gate

```bash
bun run check          # biome check . && tsc --noEmit && fmt:check && bun test
bun run fixpoint       # self-host reproduces itself (stage2 ≡ stage3 ≡ TS)
bun run bootstrap:tsc  # count tsc --strict errors on the self-host (north-star: 0)
```

Individual pieces: `test`, `typecheck`, `lint` / `lint:fix`, `format`, `loc`,
`gen:prelude` / `gen:runtime` (regenerate the parity-guarded shims), `fmt:al` (dogfood
the `.mochi` formatter on `bootstrap/`), `build:ext` (VS Code extension).

## Editor surfaces

- **Hover** — types on demand, folded back to named record aliases where they match, with
  `///` doc comments attached.
- **Go to definition / document highlight** — lexical symbol index (values, types, ctors);
  works when typecheck fails. Prelude names have no location. Cross-module F12 follows
  import origins to the exporting module ([tracer bullets](dx-tracer-bullets.md)).
- **Find references / rename** — same-file and across the import graph; skips `$`/`_`
  synthetics and prelude. F2 rewrites every occurrence of the binding.
- **Document / workspace symbols** — outline of top-level lets/types/ctors; workspace
  search over the open module graph.
- **Code actions** — `Diagnostic.suggestions` become quick fixes (e.g. did-you-mean on
  unbound names in **strict** inference). Open-world compile still treats unknown
  names as host globals, so typo suggestions are not guessed there.
- **Diagnostics** — the same `Diagnostic` values the compiler produces, with spans; a
  `--json` structured form is available for machine consumers. The LSP maps each to a
  `PublishDiagnostic` (range + message + `related` from labels; help is appended to the
  message). Suggestions ride along for code actions
  ([ADR 0003](adr/0003-rich-diagnostics.md), [tracer bullets](dx-tracer-bullets.md)).
- **Formatter** — width-based pretty-printing that runs on lex + parse only (no type
  information needed), which is why it can format even code that doesn't yet type-check.
- **`.d.ts`** — HM types lowered to TypeScript declarations, including declarations for
  `extern` host modules.

Spans travel on every token, node, and type through the whole pipeline — hover,
diagnostics, and formatting all depend on that. Synthetic identifiers are marked by
convention: `_`-prefixed names are emitted runtime helpers, `$`-prefixed names are
synthetic destructure temporaries (both excluded from hover and exports).
