# 0019 — Slice F: codegen in mochi + the self-hosting fixpoint

- **Status:** Accepted
- **Source:** Slice F (`docs/PATH_TO_BOOTSTRAP.md` §4) — the final slice. Three
  of four pipeline stages were already self-hosted (Slices C/D/E); codegen and
  the fixpoint ceremony were all that remained.

## Context

`bootstrap/codegen.al` (~790 LOC) ports `src/codegen.ts`: the pure AST→JS pass.
Like the other bootstrap modules it redeclares the AST with matching `_tag`
strings (no modules yet — PATH §6). The port was straightforward except for two
decisions the ceremony forced into the open.

## Decision

**1. The prelude runtime tables are passed in, not reimplemented.**
`namespaceRuntime` / `preludeJsDefs` / `runtimeDeps` (the tables that map
`Ns.member`→JS id, builtin→its runtime string, and runtime→its deps) stay in
`src/prelude.ts` and are handed to `codegen.al` as three `Map` arguments. Only
the four builtin ctor keys (Some/None/Ok/Err) are hardcoded, matching
`infer.al`'s precedent for `builtinTypeDecls`. One prelude, consumed by both
codegens — never forked (PATH §6).

**2. The fixpoint "compiler" is `lex→parse→codegen` only.**
`check` and `infer` are validation gates that never alter the AST fed to
codegen, so the emitted JS is fixed by those three passes alone. The fixpoint
driver (`test/bootstrap-fixpoint.spec.ts`) composes the three, but compiles all
**five** bootstrap modules as *targets* at every stage. check/infer parity is
pinned separately by `bootstrap-{check,infer}.spec.ts`.

**3. `escChar` drops its `\r` arm** — the real bug this slice flushed. The TS
lexer's `scanString` decodes only `\n \t \\ \"`; `\r` falls through to a literal
`r`. So `codegen.al`'s pattern `| "\r" => …` was matching the *letter* `r`,
mangling every `Err`→`E\r\r`. A decoded mochi string value can therefore never
contain a CR from an escape, so the arm was both wrong and unreachable — removed
it, and corrected the comment that had claimed the lexer decodes `\r`.

## Consequences

- **Fixpoint reached.** `test/bootstrap-fixpoint.spec.ts` runs the three-stage
  ceremony: stage 1 = TS compiler emits each module; stage 2 = the stage-1
  compiler (evaluated from that JS) re-emits them; stage 3 = the stage-2
  compiler re-emits again. `stage2 ≡ stage3` byte-for-byte for all five modules,
  and the stronger `stage1 ≡ stage2` (TS emit ≡ bootstrap self-emit) holds too.
  **mochi is self-hosting.**
- **Differential codegen guard.** `test/bootstrap-codegen.spec.ts` diffs the
  bootstrap codegen's JS against the TS codegen's on every `.al` file in the repo
  (including `codegen.al` itself) plus 13 targeted emit cases (nested patterns,
  guards, lazy List, `let?`, ternary, map literals, string escapes).
- The driver is not a shipped CLI: host IO (reading files, writing `.js`) is
  still shimmed by the test harness, as PATH §6 permits indefinitely. Porting
  `module.ts`/CLI is future work, not part of the fixpoint claim.
- The `escChar` fix is a latent-bug find, not a language change — the lexer's
  `\r` behavior is unchanged (extending it to decode `\r` would be its own slice
  with lexer/parser differential re-verification).
