---
id: C6
title: "ADR: collection literals + prelude namespace principle (absorbs C8)"
status: done
type: task
blocked-by: []
---

> **DECIDED 2026-07-26 (user-grilled), all three sub-questions:**
>
> 1. **`@{}` stays.** Keep the lazy-List sigil; pay the novelty with one great docs
>    paragraph + hover showing the `List` type.
> 2. **Empty Set = `Set.empty`** — polymorphic `Set.empty : Set<A>` prelude value; no
>    grammar change; `#{}` stays Map. Add `List.empty`/`Map.empty` for symmetry if
>    they fall out free.
> 3. **Namespace rule, documented as-is:** unqualified = the universal layer — math,
>    structural `eq`/`show`/`compare`, and Array conveniences (Array is THE default
>    collection); every other type namespaces (`List.*`/`Set.*`/`Map.*`/`Str.*`/
>    `Task.*`). No code moves.
>
> Ticket becomes: retro-ADR recording the above + `Set.empty` prelude addition +
> the wrong-collection diagnostic + `language.md` paragraphs.

# C6 — Collection literal gaps + the unstated namespace rule

**Corrections from sanity check:** empty `#{}` is **not** ambiguous — `parser.ts:648-655`
deterministically parses it as an empty **Map** (`new Map([])`), documented in the
parser docstring. The real literal defect is the mirror image: **an empty `Set` literal
is unwritable** (Set form requires ≥1 element or spread, `parser.ts:657+`), forcing
`Set.fromArray([])` (`prelude.ts:474`).

**Remaining problems:**

1. Empty-Set gap above — decide: a written form, or bless `Set.fromArray([])` as the
   documented answer.
2. `@{}` (lazy List) has zero prior-art transfer (Clojure `@` = deref); learnability
   cost vs `List.from([...])`. Sigils are near-impossible to change post-users.
3. **(absorbs C8)** The prelude namespace rule is unstated and wider than "math vs
   `Str.*`": `map`, `filter`, `length`, `eq`, `show`, `concat` are unqualified
   (`prelude.ts:93-94` — bare `map`/`filter` are Array-typed aliases) while
   `List.*`/`Set.*`/`Map.*`/`Str.*`/`Task.*` are namespaced. Any honest principle must
   cover the Array aliases — which makes this and the sigil audit one decision.
4. Piping a `List`/`Set` into bare Array-typed `map` must produce a targeted error
   naming the qualified fix (`List.map`), or users read it as a language bug.

- [x] ADR: sigil survival (`@{}` keep/drop), empty-Set answer, and the namespace
      principle in one document; rejected alternatives recorded.
- [x] `docs/language.md`: empty-`#{}` = Map, the unqualified-=-Array rule, and the
      namespace principle, each stated in one paragraph.
- [x] Targeted wrong-collection diagnostic with test.
- [x] Bootstrap impact: none unless a sigil changes (then parser mirror + parity).
