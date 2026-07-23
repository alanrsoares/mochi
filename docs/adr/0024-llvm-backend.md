# 0024 — LLVM backend (native codegen target)

- **Status:** Proposed (scoping decision, not yet implemented)
- **Source:** conversation 2026-07-22; `src/codegen.ts` (JS backend shape);
  `CONTEXT.md` (pipeline, currying, collection sigils); `docs/adr/0003` (curried
  surface, uncurried codegen); `docs/adr/0006` (one numeric type)

## Context

mochi's pipeline is railway-shaped and codegen is the only stage that produces a
new representation (`CONTEXT.md`): `lex → parse → check → typecheck → codegen`.
Today `codegen.ts` targets JS text only, and it works because JS gives the
backend three things for free — a GC, closures, and structurally-typed objects
(records erase to plain JS objects with no layout decision needed). An LLVM
target gets none of these for free; the front end (lex/parse/check/typecheck)
is fully reusable unchanged, but codegen needs a parallel backend plus a native
runtime, and several load-bearing JS-backend assumptions need an explicit
answer instead of an implicit one.

Confirmed from the current source, load-bearing for this decision:

- **One numeric type** (`ADR 0006`): `number` is the only runtime numeric type,
  `int`/`float` are transparent aliases → trivial, always `double`.
- **Closures are real JS closures.** `codegen.ts` (`collapseLambda` + the
  `lambda` arm, lines 54–91): a curried chain collapses to one flat arrow;
  arity ≥ 2 wraps in `_curry(n, f)` (`ADR 0003`), arity 1 stays a bare arrow —
  either way the JS engine's own closure captures free variables. LLVM has no
  closures — this needs an explicit closure-conversion pass.
- **Records are row-polymorphic** (`src/unify.ts`, `rewriteRow`) and erase to
  plain JS objects at codegen — no layout decision needed because JS objects
  are structurally duck-typed. LLVM needs a concrete struct layout per call
  site — this is the single biggest new decision surface.
- **`List` is lazy** (a pull-sequence) and its patterns lower to "a
  self-contained pull IIFE," not `@onrails/pattern` (`CONTEXT.md` collection
  sigils, invariants). That IIFE leans on JS generators/closures/GC. `Map` is
  the native JS `Map`.
- **Variants** lower to a `{ _tag, ... }` object matched via `@onrails/pattern`
  (`CONTEXT.md` invariants) — straightforward to re-target as a tagged struct.
- `check.ts`/`infer.ts` never touch the AST (`Program` passes through
  unchanged); only `codegen` differs per target — but codegen is **untyped**
  today: it consumes a bare `Program`. Per-node inferred types exist (span →
  zonked type, the `record` hook feeding LSP hover), yet the compile path
  (`inferProgram`) drops them; only `inferProgramTypes` returns them. An LLVM
  backend needs them threaded through — new plumbing, not new inference.

## Decision

Add `codegen-llvm.ts` as a sibling backend, following the same shape as the JS
backend: **pure, non-failing, `Program → string`** — text is textual LLVM IR
(`.ll`), not bytecode via bindings. A new native runtime (`runtime/rt.c`, or
hand-written `.ll`) supplies everything the JS engine currently gives away for
free, compiled once and linked at build time (`clang out.ll rt.o -o binary`).

Per-concern decisions:

1. **Toolchain shape.** Emit textual `.ll`, shell out to `clang` for object
   code and linking (`clang` compiles `.ll` directly; no separate `llc` step)
   — mirrors the existing "pure AST → string" codegen invariant instead of
   introducing a native LLVM-binding dependency (no `llvm-node`/inkwell
   equivalent; keeps the compiler itself dependency-light on Bun). `clang`
   becomes a **build-time**, not compiler-runtime, dependency — same
   relationship the JS backend has with `node`/`bun` to run the emitted `.js`.
2. **Memory management: conservative GC (Boehm/`libgc`) for v0.** Link
   `libgc`, route allocation through `GC_malloc`. Two reasons: zero
   collector-implementation work, and — decisive for textual-IR emission —
   conservative stack/register scanning needs no stack maps or safepoints,
   where a precise GC through LLVM means the `gc.statepoint` machinery.
   (Cycles are *not* the argument: mochi data is immutable, so ordinary
   values can't form heap cycles — see the refcounting alternative below.)
   Perf tuning (a precise GC, or refcounting) is an explicit follow-up, not a
   v0 blocker.
3. **Closures: lambda-lifting + explicit environment struct.** Every lambda
   with free variables lowers to a top-level function taking an extra `env*`
   argument, plus a heap-allocated (GC'd) struct holding the captured values.
   A closure value becomes a two-word `{ code_ptr, env_ptr }` pair. Under- and
   over-application keep the "safe bridge" idea from `_curry` (`ADR 0003`), but
   as an explicit partial-application struct (already-supplied args + arity
   counter) instead of a JS runtime wrapper — same concept, different substrate.
4. **Records/row polymorphism: monomorphize per concrete instantiation.**
   Inference already computes each use site's concrete row (instantiation +
   final-subst `zonk` — the same per-node types hover displays), but the
   compile path drops them (Context bullet above): the backend must consume a
   *typed* `Program` (per-node type table keyed by span). Each polymorphic
   function is specialized (copied) per distinct concrete row it's used at,
   deduped by resolved type; a generic never used concretely gets no
   specialization. Sound and terminating because mochi's HM is rank-1 with no
   polymorphic recursion, and v0 is one translation unit (multi-module linking
   deferred below). Gives every record a fixed, known-at-compile-time struct
   layout — no runtime field-offset dictionary.
5. **Variants: tagged union struct.** `{ i32 tag; <payload> }`, mirroring the
   `{ _tag, ... }` shape the JS backend already emits — same discriminant
   concept, concrete layout instead of a duck-typed object.
6. **Numeric: always `double`.** Matches JS-backend semantics exactly
   (`ADR 0006`) — no int-overflow surprises to reconcile between backends.
7. **Tail calls are load-bearing, not an optimization.** mochi has no loops;
   iteration is recursion, and the JS backend leans on JSC's proper tail calls
   (`ADR 0014`). LLVM guarantees nothing by default (`tail` is a hint): lower
   self-tail-calls to loops and emit `musttail` under a TCO-capable convention
   (`fastcc`) for the rest — including the partial-application bridge's
   saturated path, the exact frame-pinning hazard `ADR 0014` fixed in
   `_curry`. Without this the existing corpus overflows the stack.
8. **Strings: length-prefixed buffer, not null-terminated.** Literals only
   escape `\n \t \\ \" \$` (`lexer.ts`), but runtime strings are full JS
   strings — `Str` ops can produce NUL-bearing content, and `Str.length` is
   O(1); a C-string assumption regresses both silently. Open parity hazard:
   JS `length` counts UTF-16 code units, so the native representation must
   store code units or document byte-length divergence on non-ASCII — decided
   at runtime-design time, flagged here. Interpolation (`ADR 0023`) lowers to
   runtime string-builder calls instead of a JS template literal.
9. **Runtime.** `prelude.ts`'s builtin signatures need a parallel native
   implementation (`Str`, `Array`, arithmetic) in `runtime/rt.c`, linked as
   `rt.o` — a full reimplementation of the JS backend's inlined runtime
   strings, not a thin shim. One casualty of monomorphization: structural
   `eq`/`compare`/`show` (`ADR 0007`) are a *reflective* object walk in JS,
   but monomorphized structs carry no runtime shape info — so these become
   compiler-generated per concrete layout (type-directed, coherent with
   decision 4), not a single `rt.c` walker.
10. **Testing.** New differential tier: compile the shared `.mochi` test corpus
   through both backends, run each native binary, diff stdout against the JS
   backend's output for the same input — same spirit as the bootstrap
   fixpoint differential suites (`AGENTS.md`), applied across backends instead
   of across compiler generations.

Out of scope for v0 — each an explicit deferral, not silent divergence:

- **Lazy `List`.** Its pull-IIFE lowering leans on JS generators/closures/GC
  (`CONTEXT.md` invariants); porting it needs the same closure-conversion
  machinery (decision 3) applied to an iterator-state struct. Real work, not
  free once closures exist — deferred to a follow-up ticket rather than
  bundled into the v0 backend.
- **`Map`/`Set`.** Currently native JS `Map`/`Set.fromArray` (`ADR 0008`); need
  native hash-table implementations in the runtime. Deferred.
- **`extern`/FFI.** `extern` lowers to a JS `import` (`CONTEXT.md`) — meaningless
  for a native target. Any prelude piece implemented via `extern` needs a
  native reimplementation instead; out of scope for v0, which covers only the
  numeric/bool/string/record/variant/`Array` core.
- **Effects/`Task`.** Effects are convention-only, unenforced by the checker
  (`ADR 0004`); no LLVM-specific change implied, but nothing here validates the
  convention holds for a native async story — not attempted.
- **Multi-module linking.** `module.ts`'s DFS/cycle-detection graph currently
  compiles each module against its dependencies' `Env` and emits one `.js` per
  module. A native target needs a real link step (object-per-module + link),
  not just one flat translation unit — deferred; v0 targets single-file
  programs.

## Alternatives rejected

- **Emit C instead of LLVM IR**, compiled by any C99 compiler. Genuinely less
  work to hand-write (a text emitter, not IR-shape-specific knowledge), and
  still needs a C compiler as a build-time dependency either way — but gives
  up direct access to LLVM opt passes and non-C backends, which is the actual
  premise of "target LLVM." Rejected on those terms, not on effort.
- **Native LLVM bindings (inkwell-equivalent) over textual `.ll` emission.**
  More typo-safety, but adds a native dependency to a Bun/TypeScript compiler
  and breaks the "pure AST → string" invariant every other backend (JS, `.d.ts`)
  already follows. Textual emission stays consistent with the existing
  architecture.
- **Refcounting (ARC-style) over tracing GC for v0.** Plausibly the better
  long-term fit: immutable data can't form cycles through ordinary values, so
  mochi may not need a cycle collector at all (only closure environments could
  cycle, and lambda-lifted code pointers are static). But RC threads inc/dec
  traffic through every emitted binding — codegen stops being a simple tree
  walk — and that acyclicity claim must be audited before any program runs
  correctly. Boehm defers all of it; RC is a legitimate follow-up once perf,
  not delivery, is the question.
- **Dictionary-passing over monomorphization for row-polymorphic records.**
  Uniform representation, no code-size blowup — but adds a new runtime
  indirection (field-offset dictionaries) the JS backend has no analog for,
  when inference already computes every concrete instantiation (decision 4
  threads it to the backend — plumbing, not new inference). Dictionary-passing
  would be new runtime infrastructure for a problem monomorphization solves at
  compile time. (The same fork was flagged for the unrelated trait-constraint
  question, where `ADR 0018` deliberately deferred *both* branches; this ADR
  takes the monomorphization branch for records only, without prejudging
  traits.)

## Consequences

- Front end (lex/parse/check/typecheck) is semantically untouched; the one
  plumbing change is exposing the per-node type table to the compile path
  (today only `inferProgramTypes`/LSP sees it — decision 4). Otherwise this is
  purely a new codegen backend plus a new runtime, additive to the existing
  architecture.
- New build-time toolchain dependency (`clang` + `libgc`) for anyone building
  the LLVM target, in dev and in CI.
- Monomorphization risks code-size blowup on heavily polymorphic code; needs a
  dedup pass keyed by resolved type from day one, not as a later optimization.
- v0 is feature-*narrower* than the JS backend (no `List`/`Map`/`Set`/`extern`)
  — an explicit, documented gap, not silent divergence.
- A new differential-testing tier is required before this backend can be
  trusted: same source, two backends, diffed output.
- This does not touch bootstrap (`docs/PATH_TO_BOOTSTRAP.md`) or v1 scope
  (`docs/V1.md`) — independent track, no claim of priority over either.
