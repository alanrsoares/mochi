# 0014 — Recursion depth via proper tail calls (strict-mode JSC)

- **Status:** Accepted
- **Source:** Slice C, the bootstrap lexer (`bootstrap/lexer.al`); `docs/PATH_TO_BOOTSTRAP.md` §3 "Stack depth"

## Context

alang has no loops; iteration is recursion. The bootstrap lexer's `go` loop
recurses once per char-or-token step, so lexing a realistic module (~12k chars)
needs ~10k+ live activations — past the "known hazard" line in
PATH_TO_BOOTSTRAP §3. The first corpus run overflowed the stack on the two
biggest files.

Two facts turned this from a redesign into two one-line fixes:

1. **JSC (Bun's engine) implements ES2015 proper tail calls** in strict mode —
   the only major engine that does. Emitted alang modules are ESM, which is
   always strict. `@onrails/pattern`'s dispatch keeps handler calls in tail
   position, so a `switch` whose arm ends in a recursive call already chains
   tail-to-tail (~2M depth measured). *(Corrected by the Slice D addendum
   below: the library's dispatch was NOT tail-position; it is as of the
   `findCase` fix.)*
2. The chain had one break: `_curry`'s saturated path was
   `const r = f(...a); return a.length === n ? r : …` — a non-tail call that
   pinned a frame per crossing, capping depth at ~10–50k.

## Decision

- **`_curry`'s exact-arity path must be a proper tail call:**
  `if (a.length === n) return f(...a);`. The over-application fold stays
  non-tail (rare, unavoidable).
- **Tail-position recursion is the supported iteration idiom.** Recursive alang
  functions whose recursive calls are arm/let bodies (tail position) run in
  O(1) stack on the supported runtime (Bun/JSC). Non-tail recursion (e.g.
  `add(head, sum(tail))`) keeps O(n) frames — fine for tree-shaped work, the
  usual caveat for list-shaped work.
- **Test harnesses must eval emitted JS in strict mode** (`"use strict"`
  prologue when using `new Function`, which is sloppy by default) or PTC
  silently vanishes and big inputs overflow.

## Consequences

- The bootstrap lexer lexes the whole repo corpus — including itself — without
  restructuring into an accumulator-driver shape; ports can stay line-for-line.
- Portability note: on V8/SpiderMonkey (no PTC) deep tail recursion overflows.
  The bootstrap targets Bun; if other runtimes ever matter, that's when a
  trampoline or codegen-level loop lowering earns its complexity.
- Any future prelude runtime helper on a recursion hot path must keep the
  call chain tail-to-tail (same rule as `_curry`).

## Alternatives rejected

- **Trampoline in the prelude** (`go` returns `More(state) | Done(r)`): the
  driver itself needs a loop, so it must live in JS anyway; infects every
  recursive function's shape. Unnecessary while PTC holds.
- **Codegen loop-lowering for self-tail-calls**: real compiler work (detect
  self-tail position, emit `while`), duplicates what the engine already does.
- **Bigger stacks** (`BUN_JSC_maxPerThreadStackUsage`): a config workaround
  that moves the cliff instead of removing it.

## Addendum (Slice D): the match library was a second chain-breaker

The original "~2M depth through match machinery" claim was wrong — the probe
that produced it did not route through `@onrails/pattern`. When the bootstrap
parser's self-parse overflowed, a strict-mode probe through a real compiled
`switch` measured a **~14.6k ceiling**. Two breaks inside the library:

1. `runCases` returned the handler's result from inside a `for..of` — the spec
   requires IteratorClose to run after an abrupt `return`, so the call is not
   in tail position.
2. `run()`/`otherwise()` compared that result against a `NO_MATCH` sentinel —
   inspecting a call's result disqualifies it from tail position by definition.

Fix (upstream, `@onrails/pattern`): split *finding* the case from *invoking*
its handler — `findCase` (index loop, returns the case or `null`), then
`return c.run(value)` as the caller's final statement. Dropping the sentinel
also removes the handler-returned-`undefined` ambiguity outright. alang pins
the fix via `patches/@onrails%2Fpattern@0.3.2.patch` (bun patch) until the
next published release; the source fix lives in the onrails repo.

Verified: 1M-deep `switch` recursion runs in constant stack; the corpus suites
(including parser.al self-parse, the file that flushed this) guard it.
