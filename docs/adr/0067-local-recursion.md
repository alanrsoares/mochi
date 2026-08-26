# 0067 — Local recursion: a `let … in` whose RHS is a lambda scopes its own name

- **Status:** Accepted — implemented (`infer/infer.ts` `inferLocalLambdaGroup`; mirrored and dogfooded in `bootstrap/infer.mochi`)
- **Date:** 2026-08-25
- **Source:** owner request during a language-gap review ("what high value expressiveness are we lacking")

## Context

Top-level bindings are grouped into recursive components by Tarjan SCC and
inferred together, so mutual recursion typechecks *regardless of definition
order* (`docs/language.md`, "Bindings and functions"). Local bindings get none
of that — `docs/language.md` calls them "local, **non-recursive**,
let-polymorphic", and the checker agrees:

```
let f = n => let go = k => switch k { | 0 => 0 | _ => go(k - 1) } in go(n)
→ TypeError at 1:55: unbound variable 'go'   help: did you mean 'gt'?
```

`loop`/`recur` (ADR 0056) covers the **tail** case and only the tail case. A
non-tail local helper — tree walk, parser combinator, anything that recurses in
argument position — has exactly one workaround: lift it to the top level. That
is the wrong shape twice over. It pushes a private helper into the module's
export surface and its symbol index, and it separates the helper from the only
binding that uses it. In an ML-family language the local named recursive helper
is the ordinary unit of work, so the gap is felt on most non-trivial functions.

Making *every* `let … in` recursive is not available, because shadow-rebind is
live syntax today and resolves the RHS in the **outer** scope:

```
let x = 10
let f = () => let x = x + 1 in x     // emits ((x) => x)(add(x, 1))  — outer x
```

Blanket recursion turns that into unbound-or-diverging. So the rule has to
distinguish the two intents without a new keyword if possible.

## Decision

**A `let name = … in body` binds `name` in its own RHS when — and only when —
the RHS is syntactically a lambda.** Any other RHS keeps today's outer-scope
resolution.

- **Why the lambda restriction is the whole design.** It exactly separates the
  two idioms: shadow-rebind (`let x = x + 1`) always has a non-lambda RHS, and a
  recursive helper always has a lambda RHS. Neither case needs to be annotated,
  and no existing program changes meaning — a lambda RHS that mentions its own
  name is an *unbound variable error* today, so there is no behavior to break.
- **The restriction is also forced by the emit, not merely convenient.** OCaml
  admits a much larger class via `Rec_check`
  (`~/dev/rescript/compiler/ml/rec_check.ml`), which classifies each
  self-reference as `Dereferenced` / `Guarded` / `Unguarded` and accepts any
  definition whose self-references are guarded — so `let rec ones = 1 :: ones`
  is legal there. Mochi cannot follow, because it lowers to a JS `const` and JS
  has no such cycle:

  ```
  const go = (k) => k <= 0 ? 0 : go(k-1);   // fine — 0
  const xs = [1, ...xs];                    // ReferenceError: Cannot access 'xs' before initialization
  ```

  `Rec_check`'s own doc comment notes that "a variable dereferenced within a
  function body … is considered guarded". The lambda rule is precisely that
  clause, and under a strict JS-`const` emit it is the *only* guarded form
  available. So mochi's rule is the degenerate case of the general analysis,
  arrived at from the backend rather than borrowed for taste.
- **No `rec` keyword.** Consistent with the top level, which is already
  implicitly recursive with no marker. Adding `let rec` locally while the top
  level needs nothing would be the inconsistency, not the fix.
- **Mutual recursion via SCC, reusing the existing machinery.** A maximal run of
  **adjacent** lambda `let … in` bindings forms one group; run Tarjan over the
  group's reference edges and infer each component together, exactly as
  `infer/`'s top-level pass does. `let a = k => b(k) in let b = k => a(k) in a(n)`
  then typechecks; today it reports `unbound variable 'b'`. Adjacency is the
  boundary because a non-lambda binding between them can observe the outer scope
  and must not be pulled into a component.
- **Typing.** Within its own component a recursive binding is **monomorphic** —
  no polymorphic recursion — and generalizes at the component boundary. Same
  rule, same code path, as the top level.
- **Codegen is unchanged.** A lambda `let … in` already lowers to a `const` in a
  block, not an IIFE: `let go = k => k in go(3)` emits
  `{ const go = (k) => k; return go(3); }`. A JS `const` arrow may reference its
  own binding — the TDZ resolves at call time, not definition time — so
  self-reference and adjacent mutual reference both emit correctly with **no
  codegen change at all**. The non-lambda form keeps its IIFE lowering, which is
  what preserves shadow-rebind.
- **`check/` gains one rule:** a self- or mutual reference from a **non**-lambda
  local RHS stays the existing unbound-variable diagnostic, so the restriction is
  taught at the point of confusion rather than diverging at runtime.

## Consequences

- Private helpers stop leaking into module scope. This directly shrinks the
  self-host's top-level surface, where helpers are lifted purely for recursion
  and then show up in `symbols`, hover, and `.d.ts`.
- `loop`/`recur` narrows to what it is actually for — iteration with an
  idiomatic `while` emit — instead of doubling as the only local-recursion tool.
- Zero codegen diff and zero corpus migration; the change is confined to
  scoping in `infer/` (component construction) plus one `check/` rule.
- **Fixpoint cost:** `bootstrap/` must mirror the scoping change before the
  self-host may *use* local recursion, the same staging ADR 0056 recorded — land
  TS, mirror, then adopt.
- Guard: `test/examples.spec.ts` cases for self-recursion, adjacent mutual
  recursion, non-tail recursion, and — most important — a **regression case
  pinning shadow-rebind** (`let x = x + 1 in x` still reads the outer `x`).

## Alternatives rejected

- **All `let … in` recursive.** Breaks shadow-rebind, which compiles today and
  emits outer-scope semantics. Silent meaning change, not a compile error.
- **Explicit `let rec` / `let rec … and …`.** Safe and familiar, but adds a
  keyword and a second binding form to lexer, parser, formatter, and `.d.ts`
  printers to express something the RHS shape already determines — and leaves
  the top level inconsistent, since it needs no marker.
- **A general guardedness analysis (OCaml's `Rec_check`).** Strictly more
  permissive, but it buys only definitions mochi cannot emit — cyclic values
  need laziness or mutation after allocation, and mochi has neither. Several
  hundred lines of analysis for zero reachable programs.
- **Y-combinator in the prelude.** Expressible, but it forces the helper into
  fixpoint style, prices in a closure allocation per call, and the emitted JS
  stops looking like JS anyone would write — against the readable-output pitch.
- **Extend `loop`/`recur` to non-tail positions.** `recur` is defined as a
  rebind-and-`continue` lowering (ADR 0056); non-tail use has no `while` form and
  would need a trampoline, which is exactly the opaque emit 0056 rejected.
