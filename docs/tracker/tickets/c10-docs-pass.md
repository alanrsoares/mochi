---
id: C10
title: Docs pass — canonical style, dead links, annotation pitch, int/float honesty (absorbs C11)
status: done
type: task
blocked-by: []
---

# C10 — Doc drift undermines the trust the docs exist to build

**Problems (fact-checked):**

1. Examples oscillate between `add(a, b)`, infix `n2 + n2`, and sections `(+ 1)` —
   reader can't tell which is canonical.
2. README pitches "no annotation tax" while `let x : T = v` exists precisely because
   inference sometimes generalizes the wrong thing. Needs one honest sentence:
   annotations optional, occasionally wanted at exports/seams. (The decision is cited
   as "ADR 0044" in memory/comments but no such file exists — see
   [C12](c12-adr-namespace-repair.md).)
3. `example.mochi` moved to `examples/example.mochi` in commit `c84df4d`; stale links
   remain at `README.md:29`, `README.md:102`, `docs/language.md:7`, `docs/README.md:32`.
4. **(absorbs C11)** `int`/`float` are unchecked aliases of `number` (`ctors.ts:12`,
   `schemes.ts:45`); `let z : int = 2.5` compiles silently and the annotation erases in
   TS output. Sanity check found this already half-documented — `docs/language.md:57`
   states the alias, and `schemes.ts:42` carries a 6-line deliberate-decision comment.
   Remaining work is one line here: promote that comment into a short ADR and link it
   from `language.md` ("documentation aliases, zero semantics — `int` accepts `1.5`").

**What to build:**

- [x] Pick the canonical example register (recommend: infix where it exists, named fns
      elsewhere); sweep README + `docs/language.md`.
- [x] Fix the four stale `example.mochi` links; add a CI guard that compiles
      `examples/example.mochi` (or confirm `test/examples.spec.ts` already covers it).
- [x] Annotation-pitch sentence in README + `language.md`.
- [x] Promote the `schemes.ts:42` numeric-decision comment into a retroactive ADR
      (after C12 fixes numbering); link from `language.md`.
- [x] Relative-link check over README + `docs/`.
- [x] `bun run check` green.

Note: C1's strict-by-default migration touches the same example files (7 unbound
pseudo-literals in `example.mochi`) — coordinate; ideally the sweeps land together.
