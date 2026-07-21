# 0012 — Nested patterns: guard-form emission + conservative exhaustiveness

- **Status:** Accepted
- **Source:** `docs/PATH_TO_BOOTSTRAP.md` §2.2 (Slice B′); bug found while
  auditing bootstrap readiness

## Context

Nested constructor patterns (`Sm(Sm(n))`) **typechecked and silently
miscompiled**: `infer.ts` recurses into ctor-arg sub-patterns, but codegen's
ctor arm only handled `pbind`/`plit`/`pwild` — nested `pctor`/`precord`/
`ptuple`/`parr` and even flat `pstr`/`pbool` args were dropped, leaving free
variables in the emitted body (`// nested pctor is v2`). Related holes: a
narrowing arm counted as covering its whole constructor in exhaustiveness
(`| Sm(Sm(n)) | Nn` passed check, threw `.exhaustive()` at runtime), nested
ctors skipped known/arity validation, record pattern fields were parser-blocked
from nesting, and the checker had no opinion on lazy-List patterns in nested
positions.

The constraint that shaped v1: `@onrails/pattern`'s matcher compares
matcher-object values **shallowly** (`!==`), so `{ value: { _tag: "Sm" } }` can
never match — nested matcher objects are a dead end. But `.with(guardFn,
handler)` accepts a predicate, and the array/tuple arms already emitted that
form.

## Decision

- **A general pattern compiler in codegen**: `patConds(p, path)` renders the
  refutable tests against a path expression (`_v._tag === "Sm" &&
  _v._0._tag === "Sm"`); `patSlot(p)` renders the JS destructuring target that
  binds the names (`{ _0: { _0: n } }`, `""` = hole). Any arm with non-flat
  sub-patterns lowers to the guard form `.with((_v) => conds, (slot) => body)`.
- **The flat matcher-object fast path stays.** Ctor/record arms whose
  sub-patterns are all bind/wildcard/primitive-literal keep today's readable
  `.with({ _tag: "Ok" }, ({ value }) => …)` output (primitives compare fine
  under `!==`). `pstr`/`pbool` ctor args join the matcher object.
- **Array/tuple/lazy-List arms reuse the compiler** — `genArrArm`/`genTupleArm`
  collapsed into it (their emit shape *was* the guard form); `genListArm`
  guards/binds nested element patterns against the pull buffer (`_b[i]` is
  already forced, so nested tests pull nothing extra).
- **Conservative exhaustiveness**: a ctor arm covers its constructor only when
  every argument is irrefutable (bind/wildcard, all-binding record/tuple).
  Narrowing arms (`Sm(Sm(n))`, `Sm(0)`) don't count; the error hints
  `add Sm(_) or a '_' catch-all`. Full usefulness analysis (Maranget matrices)
  is explicitly deferred — this rule is sound, just occasionally stricter than
  necessary (e.g. `Sm(Sm(_))` + `Sm(Leaf(_))` + `Sm(Nn)` won't be recognized
  as covering `Sm`; write `Sm(_)` or `_`).
- **Nested patterns are validated recursively** in check (unknown ctor, arity)
  with errors at the nested span, instead of surfacing as cryptic unify
  failures.
- **Lazy-List patterns cannot nest** inside another pattern: matching pulls
  from the generator — an effect a guard predicate must not hide. Top-level
  `@{…}` arms (where `genListMatch` owns the pulling discipline) are unchanged,
  including nested sub-patterns *within* their elements.
- **The parser restriction on record-field sub-patterns is lifted** — its
  rationale ("runtime match is shallow") is obsolete now that nested arms
  bypass matcher objects.

## Consequences

- `Sm(Sm(n))`, `Ok((a, b))`, `(Leaf(n), y)`, `[Leaf(n), ...rest]`,
  `{ v: Sm(x) }` all compile, bind, and narrow correctly
  (`test/nested-patterns.spec.ts`).
- Previously-unsound programs now fail check: narrowing arms without a covering
  arm need `C(_)` or `_`. No working code regresses — those programs
  miscompiled before.
- Emitted output for existing flat code is byte-identical (goldens unchanged).
- `check`/`infer`-in-alang ports (bootstrap slices D–E) can dispatch on nested
  AST shapes directly instead of nesting switches.

## Alternatives rejected

- **Reject nesting in check** (make the v2 hole explicit): honest but wrong
  direction — the bootstrap ports want nesting more than any other consumer.
- **Nested matcher objects**: impossible against @onrails/pattern's shallow
  `!==` compare; deep-matching the runtime instead would change match semantics
  for every emitted program and drag the emitted-JS dependency.
- **Full usefulness/exhaustiveness matrices (Maranget)**: correct and strictly
  more permissive, but a large algorithm for a case (`C(_)`-less narrowing
  coverage) that a one-token catch-all arm resolves. Revisit if the bootstrap
  ports fight the conservative rule in practice.
