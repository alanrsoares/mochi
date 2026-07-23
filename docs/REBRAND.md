# Rebrand Proposal: `alang` → `mochi`

> **Motto**: *"Short legs, huge leaps. Chewy syntax, rock-solid Hindley–Milner types."*

![Mochi Corgi Logo](../logo_mochi_kanji_vector.jpg)

## Context

`alang` is a functional, statically-typed language with Hindley–Milner type inference, row-polymorphic records, and zero-overhead JS codegen. Rebranding the language to **Mochi** (inspired by Mochi the Corgi 🐾) provides a distinctive, warm, and memorable identity while preserving 100% of the underlying type-system architecture.

---

## Core Brand Vocabulary

| Concept | Language Feature | Description |
| :--- | :--- | :--- |
| **Pembroke Tail Calls** | Proper Tail Calls (TCO) | *"No tail, no stack overflow."* Constant stack space for recursive iterations. |
| **Herding Records** | Row Polymorphism | Duck-typing with static safety. Herding arbitrary fields without nominal class ceremony. |
| **Sploot Values** | Immutability | Pure, stationary values that never mutate under your feet. |
| **Barks, Not Bites** | Errors as Values | Clear compile-time diagnostics & `Result` types instead of uncaught runtime exceptions. |
| **Fetching** | Pipeline Operator (`\|>`) | Data flows smoothly through curried functions. |

---

## Technical Migration Plan

Decided: extension `.mochi`; full-sweep `alang` → `mochi` (including historical
ADR bodies) for one consistent name. Two phases keep the self-host fixpoint green
between landings.

### Survey (current tree)
- **114 files** reference `alang`: ~87 literal `alang`, 7 `alangc`, 2 `source.alang`.
- `.al` is load-bearing in **code**, not just filenames: `src/{module,codegen,cli}.ts`
  and the self-host mirror `bootstrap/{module,codegen}.al`, plus
  `scripts/{fmt-al,bootstrap-tsc}.ts` and `test/support/bootstrap.ts`.
- `.al` files **import with explicit extension** (`from "./compile.al"`) — the
  extension rename must rewrite in-file import specifiers, not just `mv` files.
- **16 tracked `.al` files** (11 `bootstrap/`, 4 `examples/`, `example.al`).
  The 20 in `.fixpoint-work/` are **gitignored** (regenerated — skip).
- `.al` as a bare substring is a sed hazard (`internAL`, `additionAL`): replace
  only anchored forms — `\balang\b`, `Alang`, `ALANG`, `alangc`, `source.alang`,
  and `.al` only at path/extension boundaries.

### Phase 1 — Brand rename `alang` → `mochi` (no extension change) ✅ DONE
Low risk, self-contained; fixpoint unaffected.
- `package.json`: `name`, `bin.alang` → `mochi`, script `alang` → `mochi`.
- CLI: usage strings; bootstrap binary `alangc` → `mochic`.
- LSP: server id; `alang.restartLsp` → `mochi.restartLsp`.
- VS Code ext (`editors/vscode/package.json`): name/displayName/publisher/id/aliases;
  language id `alang` → `mochi`.
- TextMate: `source.alang` → `source.mochi`; all `*.alang` scope suffixes;
  rename `syntaxes/alang.tmLanguage.json` → `mochi.tmLanguage.json`.
- Prose: README, AGENTS.md, CONTEXT.md, `docs/**` **and** `docs/adr/**` (full sweep).
- Gate: `bun run check`.

### Phase 2 — File extension `.al` → `.mochi`
Higher risk; touches self-host + fixpoint.
- `git mv` the 16 tracked files; rewrite in-file `"./x.al"` import specs → `"./x.mochi"`.
- Extension logic: `src/{module,codegen,cli}.ts` regexes/appends **and** mirror
  `bootstrap/{module,codegen}.al`.
- `scripts/{fmt-al,bootstrap-tsc}.ts`, `test/support/bootstrap.ts`, all `.al` fixtures.
- Gate: `bun run check` + `bun run bootstrap:tsc` (must stay **0**) + fixpoint byte-≡.

### Out of code scope (follow-ups)
- Repo dir `/dev/alang` → `/dev/mochi`, git remote / GitHub repo name.
- Domain: `mochi.dev`/`mochi.org` likely taken (spaced-repetition app + prior
  `i2y/mochi` lang) → plan for `mochi-lang.org` or a coined domain.
- npm publish name collision (`mochi` exists).

### Assets
- Primary mascot: [`logo_mochi_kanji_vector.jpg`](../logo_mochi_kanji_vector.jpg)
  (kawaii pastel corgi + 餅). Drop the unused variants
  (`logo_mochi.jpg`, `logo_mochila.jpg`, `logo_mochi_kanji.jpg`).
