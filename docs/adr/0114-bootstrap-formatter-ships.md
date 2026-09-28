# 0114 — The self-hosted formatter ships; the TypeScript one is retired

- **Status:** Accepted
- **Date:** 2026-09-29
- **Source:** [issue #103](https://github.com/alanrsoares/mochi/issues/103)
- **Amends:** [ADR 0078](0078-mochi-first-self-hosted-core.md) (formatter
  amendment), [ADR 0011](0011-language-plugins.md) (`LanguagePlugin.format`)

## Context

Two formatters were kept in step by hand: `packages/dx/src/format.ts` shipped
(`mochi fmt`, the LSP, `bun run fmt:mochi`), and `bootstrap/format.mochi` was
the Mochi-first port that led every change (ADR 0078). Two parity specs held
them byte-identical across the repo's `.mochi` corpus. Each formatting change
was written twice, and the TypeScript copy needed its own plugin hook API
(`FormatHook`, `FormatApi`) beside the self-hosted one (ADR 0109, 0112).

The self-hosted formatter used to be too slow to ship. #116 made its lexer and
comment attachment linear, and ADR 0113 removed the per-arm matcher cost.

## Decision

- `@mochi/dx/format`'s `format` parses and prints with the seed's formatter
  (`parseProgram` / `formatStmts` from `@mochi/compiler/bootstrap/syntax`).
  Its signature stays `Result<string, Diagnostic[]>`. A lex error is still
  the only failure, and parsing still recovers (ADR 0045).
- `FormatOptions.plugins` takes self-hosted-core plugins (`BootstrapPlugin[]`),
  with the ADR 0109 meaning: omitted = builtins, `[]` = hard opt-out. The LSP
  formats with the manifest's `plugins`, and `fmt:mochi` with the same
  per-tree vendor list the other scripts use.
- The TypeScript formatter is deleted, along with its plugin surface:
  `LanguagePlugin.format`, `FormatHook`, `FormatApi`, `runFormatHooks`, and
  the TypeScript copies of the JSX and styled-cva format hooks. Their
  self-hosted versions are unchanged.
- The two parity specs (`test/bootstrap-format{,-file}.spec.ts`) are deleted.
  With one formatter they would only compare the in-tree graph against the
  seed, which `seed:check` already does. The dx format specs, which ran
  against the TypeScript formatter, now run against the self-hosted one and
  pass unchanged.

## Consequences

- A formatting change is written once, in `bootstrap/format.mochi`, then
  frozen into the seed.
- Measured (best of eight, warm):

  | | TypeScript | self-hosted |
  |---|---|---|
  | `bootstrap/parser.mochi` (2062 lines) | ~36ms | ~147ms |
  | `bootstrap/infer.mochi` (2291 lines) | ~23ms | ~138ms |
  | `examples/snake/src/app.mochi` (391 lines) | ~3ms | ~22ms |
  | `bun run fmt:check`, whole repo | ~0.47s | ~1.9s |

  The largest file in the repo formats in well under the time a
  format-on-save allows. Slow printing is now a seed performance bug to fix
  in Mochi, not a reason to keep a second formatter.
- `dxPlugins` in `mochi.plugins.ts` is still read by the TypeScript-core
  hover, completion and navigation queries. It no longer affects formatting.
- The TypeScript `doc/` IR stays: hover lays out type text with it.

## Alternatives rejected

**Keep both, with the TypeScript one shipping.** This is the old arrangement:
every change written twice, plus two plugin hook APIs, to save about 100ms on
the largest file.

**Keep the parity specs against a frozen copy of the TypeScript output.** They
would pin the formatter to its current output, which the dx format specs and
`fmt:check` over the corpus already do, and they would have to be regenerated
on every intended change.
