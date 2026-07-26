---
id: C1
title: Strict inference by default; open-world opt-in
status: open
type: task
blocked-by: [C5, C10]
---

# C1 — Open-world default is a typo blackhole (and strict is unreachable)

> **DECIDED 2026-07-26 (user-grilled): opt-in surface = per-file pragma + CLI/LSP
> flag.** Pragma (e.g. `// @mochi open`) is the documented path for surgical
> host-global-heavy files; `--open` flag is the project-wide emergency lever for
> migration/scripts. The "small ADR" below records this — surface question closed.

**Problem (fact-checked — worse than first stated):** `src/infer.ts:231-232` returns a
fresh var for any unknown name when `ctx.open`; `InferOptions.open` defaults to `false`
(`infer.ts:790`) but **all 9 real entry points hardcode `open: true`** (`compile.ts:25,
61,87`, `compile-targets.ts:27`, `codegen-ts.ts:307`, `hover.ts:89`, `dts.ts:829`,
`complete.ts:222`, `nav.ts:137`). No CLI flag or pragma exists — strict mode is
unreachable from any user-facing surface. `let x = lenght("hi")` compiles clean.
Did-you-mean suggestions only fire in strict (per `docs/tooling.md`), so the default
mode delivers neither compile errors nor hints.

**Blocked by:**

- **C5 (type-name imports):** strict's escape hatch is `extern f : T -> U`, which
  pushes host seams through `TypeExpr` — today that can't name imported types. Strict
  first = mandatory annotations users can't write.
- **C10 (docs pass):** `examples/example.mochi` — the README's "full feature tour" —
  has **7 unbound names under `open:false`** (`zero`, `hot`, `format`, `empty2`,
  `atOrigin`, `even`, …); `infer.ts:231` names `empty2` in a comment as the reason
  suggestions are suppressed. The tour compiles *because of* the hole. C1's migration
  and C10's sweep are the same work — land together.

**What to build:** flip the 9 entry points to strict; open-world becomes explicit
opt-in (per-file pragma and/or CLI/LSP flag) for genuinely host-global-heavy files.

- [ ] Small ADR: opt-in surface (pragma vs flag vs both).
- [ ] Flip defaults across the 9 call sites; open-world path unchanged behind opt-in.
- [ ] Unbound-name diagnostics with `Suggestion` did-you-mean fire by default; case in
      `test/examples.spec.ts`.
- [ ] Migrate `examples/` (incl. `example.mochi`'s 7 pseudo-literals), `apps/docs`,
      bootstrap — real deps become `extern`, rest gets the opt-in.
- [ ] Docs: `language.md` + `tooling.md` describe the new default + escape hatch.
- [ ] Bootstrap impact: bootstrap infer mirror gains the same default (parity tests).
- [ ] `bun run check:full` green.
