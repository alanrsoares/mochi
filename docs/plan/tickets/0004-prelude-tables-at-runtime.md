---
id: 0004
title: Prelude tables available at runtime without TypeScript
status: done
decision: "generated JS shim (bootstrap/prelude.gen.js) from scripts/gen-prelude.ts; single source = src/prelude.ts + infer.al Ty ctors; drift guarded by test/prelude-shim.spec.ts parity."
type: prototype
assignee:
blocked-by: []
---

# 0004 — Prelude tables available at runtime, no TS

**What to build:** the prelude data the codegen and inferrer need — the three
codegen tables (`namespaceRuntime`, `preludeJsDefs`, `runtimeDeps`) and the two
inference tables (`preludeEnv`, `preludeNamespaces`) — available to a standalone
alang compiler **without importing anything from `src/`**. Today they are TS
objects the test harness passes in as Map arguments; a shipped `alangc` has no
TS to import them from.

Decide between **embedding them as alang data literals** (a `bootstrap/
prelude-tables.al` that builds the same Maps in alang) versus **a small
generated `.js` shim** the emitted compiler imports. Weigh drift risk (PATH §6:
one prelude, never forked — an embedded copy must be kept in sync or generated
from the TS source) against simplicity. Implement the chosen option.

Binary target is Bun-run emitted JS with npm deps allowed, so a generated JS
shim is a legitimate option; the `@onrails` runtimes need not be inlined.

**Blocked by:** None — can start immediately.

- [ ] Decision recorded: embed-as-alang-literals vs generated-JS-shim, with the
      drift-control mechanism named (single source of truth, or a generator).
- [ ] The five tables are reachable by a standalone compiler with no `src/`
      import, in the same shape the codegen/inferrer consume today.
- [ ] The prelude is provably not forked: either one source generates both, or a
      check fails when the alang copy and the TS copy diverge.
- [ ] `bun run check` green.
