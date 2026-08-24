# 0065 — `fmt` canonicalizes `f(a)(b)` to `f(a, b)` where arity is known statically

- **Status:** Accepted
- **Source:** `packages/dx/src/format.ts`, `packages/compiler/src/prelude/prelude.ts` (`runtimeArity`), `test/call-flattening.spec.ts`
- **Refs:** #50

## Context

Every mochi function of arity ≥ 2 lowers to one flat JS function wrapped in
`_curry`, which accepts its arguments in any grouping. So `f(a, b)`, `f(a)(b)`,
and `f(a)(b)` under a pipe are the same call at runtime — but the source shows
whichever grouping the author happened to type. Real examples in this repo:

```mochi
Array.contains(head)(body)
Array.append(newDir)(state.dirQueue)
Array.take(Array.length(lines) - 1)(lines)
reduce(plus)(0)
```

`fmt` already canonicalizes every other such choice (type application to angle
brackets, record destructure re-folding, operator sugar), so leaving call grouping
alone was an inconsistency, not a policy.

The blocker was thought to be types: knowing whether a call is saturated seems to
need inference, and `fmt` deliberately parses only — it must format files that do
not typecheck (ADR 0045). That framing is too strong. What the rewrite needs is
not the HM type but the **emitted arity**, and for two large classes of callee
that is available syntactically.

## Decision

`fmt` rewrites a multi-group call spine into one flat call **when it can know the
callee's flat arity without inference**, and leaves every other call untouched.

Two sources of arity, both static:

1. **Same-file top-level `let`s** — the collapsed parameter count of the value's
   lambda chain, exactly what `collapseLambda` gives codegen. `x => y => e` and
   `(x, y) => e` both count 2.
2. **Prelude builtins**, via a new `runtimeArity` table in `prelude.ts` derived
   from the emitted `preludeJsDefs` (`_curry(N, …)` states `N`). This is ground
   truth for what the runtime accepts, which is why it is derived from the
   definitions rather than from the HM signature — `unit` domains and
   callback-shaped results make those two disagree. Namespace members
   (`Array.contains` → `_Array_contains`) resolve through `namespaceRuntime`.
   `scripts/gen-runtime.ts` had its own copy of this derivation; it now imports
   the shared table, and the regenerated `runtime.ts` is byte-identical.

The printer has no scopes, so shadowing is handled by over-approximation: a name
bound *anywhere* in the file as a lambda param, `let … in`, loop param, or pattern
binding loses its entry, and a top-level `let`/`extern`/import of a name (or of a
namespace root like `Array`) suppresses the prelude entry for it.

It bails on everything it cannot see through:

| Case | Why |
|---|---|
| imported or `extern` callee | arity is a fact about another file or a host |
| a `let`-bound *value* (not a lambda chain) | no syntactic arity |
| over-application past known arity | the extra groups apply the *result* |
| a nullary group, `f()(x)` | `f()` passes `unit`; merging would drop it |
| `origin`-tagged calls (JSX) | plugin sugar owns its own printing |

Partial applications are regrouped but stay partial: `reduce(plus)(0)` becomes
`reduce(plus, 0)` — two of three arguments, still awaiting the third, still the
same call.

## Consequences

- The canonical form is the one that reads as a call: `Array.contains(head, body)`
  rather than `Array.contains(head)(body)`. Applied to the repo, this rewrote 7
  call sites across `examples/` and `apps/docs/`, and left `bootstrap/` untouched.
- Because the rule is syntactic, it works in a file that does not typecheck, which
  is the constraint that made the type-directed version of this idea unsafe.
- It is deliberately incomplete. An imported helper's `f(a)(b)` stays as written,
  even though a module-aware tool could resolve it. Cross-module arity would put
  the module graph inside the formatter; a same-file-plus-prelude rule needs
  nothing but the AST it already has.
- `runtimeArity` is now a published part of the prelude surface, with one
  derivation shared by the formatter and `gen-runtime`.
- Pipelines are unaffected: `xs |> map(f)` is a pipe whose right side is a single
  partial application, not a multi-group spine.

## Alternatives rejected

- **Type-directed flattening.** Resolves every callee, including imports. Needs
  inference in a tool contractually limited to parsing, and would silently stop
  working on the broken files it most needs to format.
- **Emitted-arity metadata threaded from codegen.** Same information, but it makes
  the formatter depend on a compile, contradicting ADR 0048's DX/compiler split.
- **Flattening any saturated-looking spine without knowing arity.** Unsound: for a
  unary binding returning a callback (`getHandler = x => makeCb(x)`, type
  `a -> b -> c` but a one-parameter JS arrow), `getHandler(x)(y)` must stay nested.
  This is exactly the case the arity check excludes.
- **Leaving call grouping to the author.** Defensible, and what mochi did until
  now — but inconsistent with a formatter that normalizes every other equivalent
  spelling.
