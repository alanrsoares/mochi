# 0119. Binder records in bootstrap infer

- **Status:** Accepted
- **Date:** 2026-09-29
- **Source:** [ADR 0090](0090-bootstrap-chain.md), [ADR 0118](0118-bootstrap-symbol-index.md),
  `bootstrap/types.mochi`, `bootstrap/infer.mochi`, `bootstrap/schemes.mochi`,
  `packages/dx/src/hover.ts`, `packages/dx/src/nav.ts`, `bootstrap/infer.spec.mochi`, #103

## Context

Bootstrap infer recorded one type per expression and pattern span. It did not
record the type at a binder's name span. With the cursor on the `c` in
`let c = Circle(1)`, the bootstrap table had nothing there. Hover and
go-to-type both fell back to the TS table, which records every binder with a
`SymbolInfo` (`let`, `parameter`, `property` or `extern`, plus the name and
any `///` doc).

## Decision

Each entry in the bootstrap record log gains an optional symbol:

```
type BinderSym = { kind: string, name: string, doc: Option<string> }
type TypeAt = { span: SpanAt, ty: Ty, sym: Option<BinderSym> }
```

`recordAt` stays as it was and records `sym: None`. `recordBinder(span, t, kind,
name, doc, st)` records a binder. Both append to the same chunked log. There is
no second table, because hover and go-to-type both want the tightest record at
the cursor, whatever kind it is.

- **Same sites as the oracle.** Top-level `let` (with its doc, skipping `$`
  temps), extern names (with doc), `let … in` and local lambda groups, `let?` /
  `let!` over a plain name, loop params, lambda params (plain, tuple, record
  and labeled), pattern binds, `pat as name`, record-pattern labels, and field
  reads (`property`, at the whole `r.q` span, as the TS `infer` wrapper does).
- **Parity was checked at landing.** A temporary differential suite compared
  every binder record—span, kind, name, doc, and alpha-normalized type—with the
  TypeScript table on every `.mochi` file. #104 slice c retired it after direct
  infer, DX binder, and graph façade specs covered the shipped path.
- **Labeled params anchor on their name.** The oracle recorded a labeled
  param's symbol at its whole-parameter span. It now uses `nameSpan`, as its
  symbol index already does (ADR 0118).
- **The host sees the symbol.** `BootstrapTypeAt` carries
  `sym: Option<BootstrapBinderSym>`.
- **Go-to-type folds aliases in bootstrap.** `Schemes.nominalTypeName(ty,
  aliases)` returns a capitalised constructor head, or the first record alias
  whose closed row the type fits. It ports `matchTemplate`, so generic aliases
  (`Boxed<a>`) fold too, and it skips a phantom param. It is exposed as
  `nominalTypeNameBootstrap`.

## Consequences

- Go-to-type is bootstrap-only. `typeDefinitionAt` uses
  `inferTypesBootstrapSync`, and `moduleTypeDefinitionAt` no longer falls back
  to `moduleContext` + `toTypedProgramWith`.
- One difference from the oracle: the matcher widens literals first, so
  `let p = { name: "Mochi" }` jumps to `type Person = { name: string }`. The
  TS table kept the singleton and found no alias. Every other position on the
  corpus agrees with the old TS path.
- Hover answers binders from bootstrap with the `let x: T` /
  `(parameter) x: T` / `(property) x: T` lead and doc. It still defers to the
  TS `hoverFrom` for alias folding, extern leads, free type or row variables,
  and leads longer than the 72-column layout width. On the corpus, every hover
  bootstrap answers matches the TS one.
- `hover.ts` and `docAt` still call TS `indexProgram` for prelude docs and
  for positions with no symbol. Moving them to `bootstrap-index.ts` is a
  separate slice, because that module is not browser-safe yet.
