# 0013 — LSP completion provider (compiler-first + plugin member hook)

- **Status:** Accepted
- **Source:** `docs/dx-tracer-bullets.md` Wave 3 #13; ADR 0003 (thin LSP);
  ADR 0009 (no fake `tw` extern types); ADR 0011 (`LanguagePlugin` seam)

## Context

Opaque host factories (`extern tw : a`) and prelude namespaces (`Task.`,
`Result.`) give no editor member hints without a completion provider. Hover and
nav already live in the compiler with the LSP as a thin adapter (ADR 0003);
completion should follow the same shape. Faking fixed-arity `tw` types was
rejected in ADR 0009 — member lists for kits belong in the plugin, not core HM.

## Decision

1. **Compiler API first:** `completeAt` / `moduleCompleteAt` in `src/complete.ts`
   return protocol-free `CompletionItem[]`. The LSP maps them to
   `vscode-languageserver` items and advertises `completionProvider` with
   `triggerCharacters: ["."]`.

2. **Incomplete `.` via lexical rewrite:** trailing `Ident.` / `Ident.partial`
   fails parse today. Detect `\bIdent.prefix` left of the cursor; for
   type-driven fields, strip `.prefix` before typechecking so the receiver's
   zonked record row is readable. Prelude / `import * as` namespaces list
   members from tables — no typecheck required.

3. **`LanguagePlugin.completeMembers`:** when core has no namespace or record
   fields (opaque `tw`), the first plugin hook that returns a list wins.
   `@mochi/plugin-styled-cva` supplies HTML tag factories for `receiver === "tw"`.

4. **Value completions v1:** top-level lets/externs/ctors/types + imports +
   prelude / namespace names. Nested locals deferred.

5. **Task façades stay `() => Promise<SharedResult>`** (docs playground /
   share-link hosts): that shape mirrors emitted mochi `Task a e` (lazy thunk;
   ADR 0006). It is **not** `ResultAsync` — `ResultAsync` is eager and carries
   methods the emitted plain `Promise` does not have. Hand-rolled
   `{_tag:"Ok"|"Err"}` aliases avoid the literal `Promise<Result<…>>` grit ban
   while staying byte-compatible with `@onrails/result`.

## Consequences

- `tw.*` completion works only when the project's vendor plugin list is
  registered on the LSP (same list as Vite / dts — #20).
- Nested-scope value completion needs a follow-up (`bindingsAt` on the symbol
  index).

## Alternatives rejected

- Fake `tw` record/overload types in HM — rejected by ADR 0009.
- Partial-parse recovery before shipping completion — larger change; rewrite
  suffices for the `.` trigger.
- `ResultAsync` for Task host façades — wrong laziness and wrong runtime shape.
