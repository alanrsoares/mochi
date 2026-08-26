# 0076 — Open mode does not trust locally-bound names

- **Status:** Accepted
- **Source:** `packages/compiler/src/infer/local-names.ts`, `packages/compiler/src/infer/infer.ts` (`inferRef`)

## Context

Open-world mode (ADR 0072) hands any unknown reference a fresh type var, so a file can
call `localStorage`, `window`, or an ambient `h` without declaring it. `inferRef` cannot
tell a host global from a mistake, so it assumed global for everything.

That assumption swallowed a whole class of scoping bug. `let n = … in setPref(n); setPrefState(n)`
binds `n` only over `setPref(n)`; the `;` sequences a second expression outside the
binder. Both passes accepted it, codegen emitted `((n) => setPref(n))(…); return setPrefState(n)`,
and the docs theme toggle threw `ReferenceError: n is not defined` on click. `check:full`
— including the bootstrap north-stars — was green the whole time. The escape hatch was
meant to trade away *checking of names the file never binds*, not of its own binders.

## Decision

Open mode reports a reference whose name is bound by some local binder anywhere in the
same program: lambda params, `let … in`, monadic binds (`let?` / `let!`), `switch`
pattern binders, and `loop` params. Everything else still gets a fresh type var.

`localBinderNames` collects that set once per program; `inferRef` consults it only on
the open-world path. The diagnostic (`'n' is not in scope here`) points at the use, not
the binder, and its help text names the likely cause — a binder whose extent is shorter
than it looks.

Top-level `let`s are deliberately excluded from the set. They are in `env` at every use
site, so a reference to one never reaches the open-world branch.

## Consequences

- Open mode keeps its purpose — undeclared host globals still infer — while a name the
  file demonstrably binds can no longer be silently reinterpreted as a global.
- The rule is whole-program, not scope-precise: a name bound in one function and used
  out of scope in a sibling is reported. That is the intended reading. A file that binds
  `render` locally and elsewhere wants the *global* `render` must now declare it with
  `extern`, which was always the honest spelling.
- Strict mode is untouched; it already errored, with did-you-mean suggestions that stay
  off under open mode (they false-positive on globals with near-miss names).

## Alternatives rejected

**Full scope resolution in `check/`.** The right long-term home, but `check.ts`'s walkers
are scope-blind and would duplicate the binding logic `infer` already performs exactly.
Reusing `ctx.env` gets precise scope for free.

**Reporting every unbound name under open mode.** That is just strict mode, and it
deletes the escape hatch the directive exists to provide.

**Leaving it to the emitted TS backend.** `tsc --strict` does catch this, but only the TS
backend runs it — the JS backend, the playground, and `bun run mochi` would all still
emit code that throws.
