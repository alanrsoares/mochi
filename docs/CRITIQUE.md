# alang — design critique

A deep review of alang's language design as of the current tree (HM inference,
row-polymorphic records, parametric variants, curried data-last prelude, the
`[...] / @{...} / #{...} / ${...}` collection family, qualified collection
namespaces, `extern` FFI, module graph, and span-carrying tooling).

Verdict up front: **the type-system core and the JS-interop story are
senior-level. The two things holding the design back are both consequences of
one missing feature (an abstraction mechanism over types), plus one aesthetic
gamble (the sigil family) that fights the target audience's muscle memory.**

---

## 1. What is genuinely strong

### 1.1 The type system is textbook-correct, not cargo-culted
- Algorithm W with a mutable, union-find-style substitution (`unify.ts`).
  Occurs-check present for both type vars and row vars. Deep generics fall out
  of positional `con` arg unification — no special-casing per constructor.
- **Row polymorphism is implemented properly.** `rewriteRow` brings a label to
  the head and *grows an open tail* with a fresh field + fresh row var
  (`unify.ts:163`). That is the correct Rémy/Leijen-style row unification, and
  most hobby languages get it wrong or fake it with subtyping. This is the
  single most impressive artifact in the repo.
- Let-polymorphism with generalization at top-level `let`, monomorphic lambda
  params, and **mutual recursion via SCC grouping** (`isEven`/`isOdd` forward
  reference type-checks). That's real HM, not "infer left-to-right and hope".
- Exhaustiveness + constructor-arity checking as a dedicated semantic pass
  (`check.ts`), including exhaustiveness against *imported* variants whose
  constructors the importer never named (forces a catch-all). Thoughtful.

### 1.2 Interop is the differentiator
This is the part a language committee would never think of and a working
engineer immediately values:
- Named constructor fields lower to the exact `@onrails/result` / `@onrails/maybe`
  runtime shape (`Ok(value: a)` → `{ _tag: "Ok", value }`). alang values flow
  through existing JS combinators with zero marshalling.
- `Set`/`Map` **erase to native `Set`/`Map` at the `.d.ts` boundary**
  (`set-map.spec.ts:60`). The emitted types are honest to JS consumers.
- `extern name : type = "module" "export"` is a clean, typed FFI, and the async
  example shows `Task a` composing through the same `|>` pipe as everything else
  with no `async`/`await` keyword. Effects-as-values by construction.

### 1.3 Tooling-first, from day one
Every AST node carries a `Span`. `hover`, `inlay`, `dts`, `diagnostics`, and a
`format` pass all exist *now*, and there's property-based testing (fast-check)
on the lexer, parser, formatter, spans, hover, and destructuring. This is where
the project punches far above its weight class for its size (~3.4k LOC).

### 1.4 The thesis is coherent
Curried, data-last prelude → everything composes through `|>`. Records are
structural/open → duck typing without ceremony. Railway-oriented programming
isn't a library bolted on; it's what the whole surface is *shaped for*. There is
a point of view here, and the design commits to it. That is the rarest and most
valuable thing on this list.

---

## 2. The central weakness: no abstraction over types

Everything below is one problem wearing different clothes. alang has HM
inference but **no mechanism to abstract over a type** — no typeclasses, no
ML-style modules/functors, no traits. Consequences cascade:

### 2.1 The monomorphic-primitive ceiling
`eq`, `lt`, `gt` are `number -> number -> bool`. `add` is `number` only. You
**cannot** write:
- generic structural equality (`eq` on records, variants, strings),
- a generic `sort` / `max` / `min` over "anything orderable",
- a generic `sum` / `fold`-with-a-monoid,
- `show` / `toString` over arbitrary values.

For a language whose entire identity is *composition of small generic
combinators*, this is the ceiling that will be hit first and hardest. The
moment a user writes `let contains = x => xs => ...` they need `eq` at an
arbitrary type and there is no way to ask for it.

**Alternatives (short of a full abstraction mechanism, see 2.4):**
- *Compiler-magic polymorphic equality* (OCaml's `=`, Erlang's comparison):
  give `eq`/`lt` the type `a -> a -> bool` and implement them as deep
  structural comparison in the runtime. Unsound at function types, but cheap,
  and the JS target makes structural walks easy. This is the pragmatic bridge
  most ML-family languages shipped with for decades.
- *Per-namespace explicit variants*: `Str.eq`, `Num.lt`, `Array.eqBy(eqElem)`.
  Verbose but honest; composes with the qualified-namespace system already in
  place. `eqBy`/`sortBy`/`maxBy` taking an explicit comparator is the
  dictionary-passing encoding done by hand — and it needs *no* language change.
- *Leaning on JS semantics*: define `eq : a -> a -> bool` as `===`. Zero cost,
  but silently wrong for records/variants (reference equality), which would
  betray the structural-typing story. Listed for completeness; not recommended.

### 2.2 `List.map` vs `Array.map` is a symptom, not a feature
Qualified namespaces (`List.map`, `Array.map`, `Set.union`) are presented as a
design choice ("the collection carries its own ops"), but they are really a
**workaround for the absence of a Functor/Foldable abstraction**. The cost model
is N×M: every operation must be re-declared for every collection, in three
places each (`preludeNamespaces` type, `namespaceRuntime` name,
`preludeJsDefs` body). Add `Traversable`-style ops or a new collection and the
matrix grows multiplicatively. This works at four collections; it will not scale
to the standard library a "real" language needs.

There is also a **redundancy trap**: unqualified `map`/`filter`/`reduce` still
exist and are eager (`Array`), so there are now *two* correct ways to map an
array — `map(f)(xs)` and `Array.map(f)(xs)` — with no principled rule for which
to teach.

**Alternatives:**
- *Unqualified wins*: keep bare `map`/`filter`/`reduce` as the blessed Array
  ops, delete the `Array.*` namespace. Shortest code for the common case; the
  qualified system stays for List/Set/Map only. Cost: asymmetry (Array is
  special).
- *Qualified wins*: remove the bare forms; everything is `Ns.op`. Uniform,
  self-documenting, and the formatter/linter can enforce it. Cost: the most
  common operations get longer, and the pipe chains lose some terseness.
- *Bare names as sugar*: keep bare `map` but define it as an alias that the
  formatter rewrites to `Array.map` (or vice versa). One canonical form in the
  tree, one ergonomic form at the keyboard.
- *Structural dispatch* (the long game): if typeclasses land (2.4), bare `map`
  becomes `Functor f => (a -> b) -> f a -> f b` and the namespaces become
  instances. Then today's choice is only about what the interim looks like —
  another reason to decide 2.4 first.

### 2.3 The `float` / `number` surface lie
`example.al` writes `Circle(float)` but the type system only has `number`
(`types.ts`). Today that's cosmetic, but it is a *tell* that there is no numeric
hierarchy and no decision yet about int vs float vs bignum.

**Alternatives:**
- *Align the surface* (cheapest): `number` everywhere, `float` becomes a parse
  error or a warned alias. One JS-faithful numeric type, decision deferred
  honestly instead of implied falsely.
- *Alias now, split later*: accept `float` (and `int`) as aliases for `number`
  today, reserving the names. Existing code keeps compiling if a real split
  ever ships. Risk: aliases leak into codebases and acquire false meaning.
- *Real `int`/`float` split*: `int` erases to JS number with integer
  operations (`(x | 0)`, `Math.trunc` division), `float` is IEEE double.
  ReScript does exactly this and it pays off in FFI honesty (array indices,
  bit ops). Cost: two numeric types through the whole prelude, literals need
  defaulting rules — this reopens the abstraction question (2.4) because `+`
  now wants to be overloaded.
- Whichever way: make it *one* deliberate decision, recorded, instead of a
  surface/typechecker disagreement.

### 2.4 Path forward (this is the big fork in the road)
Three viable directions, in rough order of fit:
1. **Dictionary-passing typeclasses (Haskell-style).** Best fit for the
   pipe/combinator thesis; gives `Eq`, `Ord`, `Show`, `Functor`, `Monoid`
   directly. Cost: constraint solving on top of W, plus a defaulting story, plus
   the principal-types subtleties (ambiguous constraints, the dreaded
   `show . read`). This is a real research-grade addition, not a weekend.
2. **ML modules / functors.** Explicit, no inference complexity, matches the
   "collection carries its ops" instinct you already have. Cost: verbose,
   less "it just composes", cuts against the terse pipe aesthetic.
3. **Deliberately stay monomorphic + lean on `extern`.** Legitimate if alang's
   scope is "a nice typed skin over a JS runtime". But then say so, and drop the
   pretense of a growable generic standard library.

**Recommendation:** decide this *before* adding more prelude surface. Every
`Ns.op` added now is future migration debt if (1) lands. Prototype `Eq`/`Ord` as
the smallest possible constraint system and see whether inference stays
principal and error messages stay legible — that experiment tells you if (1) is
affordable.

---

## 3. The sigil family: the aesthetic gamble

`[...]` = eager Array, `@{...}` = lazy List, `${...}` = Set, `#{...}` = Map.
This is the design decision most likely to be regretted, for reasons that have
nothing to do with the (good) semantics underneath.

### 3.1 It fights the target audience's muscle memory
alang compiles to JS and its users are JS/TS developers. `${...}` is
**template-literal interpolation** in that population's fingers and eyes. Using
it for Set literals means every reader's first parse of `${1, 2, 3}` is wrong.
`#{...}` collides with Ruby (`#{}` interpolation) and reads as a comment or a
"private" marker in several other languages. You are spending your users'
existing knowledge as a *tax*, not leveraging it.

### 3.2 Low visual distance, high error rate
The four literals are distinguished by a one-character leading sigil plus a
brace-vs-bracket flip. `@{` / `#{` / `${` are one keystroke apart and visually
near-identical at a glance, in a domain (collection choice) where picking the
wrong one is a real semantic bug (eager vs lazy, Set vs Map). Good syntax makes
*semantically different things look different*; these look the same.

### 3.3 The sigils are non-mnemonic
There is no reason `@` means "lazy list", `#` means "map", `$` means "set". The
mapping is arbitrary and must be memorized by rote, which means it will be
misremembered. Compare with sigils that carry meaning elsewhere (`?` optional,
`!` effect/assert). Nothing about `$` says "set".

### 3.4 The eager/lazy distinction is double-encoded
Array is `[...]` (bracket, no sigil); List is `@{...}` (brace, sigil). The
eager-vs-lazy axis is encoded in *two* independent visual features at once
(sigil presence AND bracket shape), and the result is that the *default,
most-common* collection (Array) is the syntactic odd-one-out. If anything, the
common case should be the unmarked one and the exotic case (lazy) should carry
the mark — which is *almost* what you have, except the mark is also a brace
flip, so the relationship isn't clean.

### 3.5 Options, least-invasive first
- **Keep `[...]` for Array; drop literal sigils for Set/Map.** `Set.of(1, 2, 3)`
  and `Map.of(["a", 1])` are marginally longer and *far* more readable, remove
  two sigil collisions, and compose with the namespace system you already have.
  Sets and maps are constructed far less often than arrays; a literal isn't
  earning its syntactic cost.
- **Keep a lazy-list literal but pick a non-colliding, more mnemonic marker.**
  Avoid `${`. If lazy needs sugar at all, something like `lazy[...]` or a
  postfix marker keeps the bracket family coherent.
- **If you keep the sigils, at least never use `${`** — it is the one guaranteed
  to misfire for a JS audience.

This is subjective, and it's *your* language — but the burden of proof for
"four one-char-apart bracket sigils, two of which collide with the host
language" is high, and right now the semantics are carrying the syntax rather
than the syntax serving the semantics.

---

## 4. Smaller, sharper issues

### 4.1 No named record types
`type` declares variants only (`ast.ts:69`). There is no way to give a record a
name — no `type Point = { x: number, y: number }`. Consequences:
- Errors and hover show structural blobs (`{ x: number, y: number }`) instead of
  `Point`, which erodes the good tooling you built.
- No place to hang documentation or a nominal identity.
Row-polymorphic structural records and *named* record aliases are not in
tension; OCaml and PureScript have both. This is a real gap for readability at
scale.

**Alternatives:**
- *Transparent aliases* (recommended first step): `type Point = { x: number,
  y: number }` is purely a name for a structural type. Inference and
  unification are untouched; only `showType`, hover, and diagnostics learn to
  prefer the alias when a type matches one. Cheap, and it directly compounds
  the tooling investment.
- *Nominal records*: the name creates a distinct type; `{ x: 1.0, y: 2.0 }`
  needs an annotation or constructor to *be* a `Point`. Stronger domain
  modeling (a `UserId` isn't a `PostId`), but it fights the open-row duck
  typing that is currently a headline feature. If wanted, offer it as an
  opt-in (`type Point = new { ... }` or similar), not the default.
- *Single-constructor variants as the idiom*: `type Point = | Point(x: number,
  y: number)` already works today and gives nominal identity through the
  existing variant machinery. Zero new features — but pattern-matching
  ceremony at every use site, and it lowers to `{ _tag, ... }` rather than a
  bare record, so it's not FFI-transparent.
- *Display-only naming*: keep the type system alias-free and let `.d.ts`
  emission/hover use a name registry. Weakest option — names that exist only
  in tooling drift from the source of truth.

### 4.2 Lazy-list patterns are half-implemented
Array patterns support `[]`, `[x]`, `[x, y]`, `[head, ...tail]`, fixed-length
narrowing, and `_`. Lazy-List patterns (`plist`) support only empty +
single-head cons (slice 1, per `check.ts`). Two features that look identical to
the user (`[head, ...tail]` vs `@{head, ...tail}`) have different capability. A
user will hit the cliff without warning.

**Alternatives:**
- *Reach parity*: implement fixed-length and multi-element-head lazy patterns
  by pulling exactly as many elements as the longest pattern needs (a bounded
  `take` under the hood), then dispatching. Fully doable — laziness only
  forbids patterns that would need the *whole* sequence, and none of the array
  pattern forms do.
- *Diagnose the gap*: keep slice-1 semantics but make the parser/checker emit a
  specific error — "lazy List patterns support `@{}` and `@{head, ...tail}`;
  for fixed-length matching, `toArray` first" — instead of a generic failure.
  Cheapest honest option.
- *Remove lazy patterns entirely*: force `toArray`/`take` before matching.
  Simplest semantics (matching never forces implicitly), but gives up the ML
  idiom for the most common recursion scheme, which slice 1 clearly wanted.
- *Uncons as a function*: drop `plist` sugar, provide `List.uncons : List a ->
  Option<(a, List a)>` and let users match on the Option. Explicit about the
  forcing point; more ceremony per recursion.

### 4.3 Purity/effects are convention, not type
`Task a` composing through `|>` is elegant, but nothing in the type system
distinguishes an effectful value from a pure one — it's discipline, enforced by
`extern` boundaries and good taste. That's a legitimate choice, but it should be
*named* as a choice. If effect tracking is ever wanted, retrofitting it into a
plain-HM core is expensive; decide early whether you care.

**Alternatives:**
- *Document the convention* (cheapest, likely right for now): a design note
  stating "alang is pure by convention; all effects live behind `extern` values
  like `Task`, and `run` is the only escape hatch". Costs a paragraph; sets
  expectations; keeps the door open.
- *IO-typed externs*: require every `extern` whose JS body performs effects to
  return `Task a` (or an `IO a` synonym). No inference changes — it's a
  linting/convention rule at the FFI boundary, which is the only place effects
  can enter anyway. This makes the convention *mechanically checkable* at the
  one place it matters.
- *Effect rows*: you already have row unification; effect systems à la Koka
  reuse exactly that machinery on the arrow type (`a ->{io} b`). Technically
  the row engine is the hard part and it's built — but this doubles the
  cognitive surface of every function type and infects every signature.
  Research-grade commitment; only if effects become the language's thesis.
- *Monadic sequencing sugar*: a `do`-style block over `Task`/`Result` (like
  Gleam's `use` or OCaml's `let*`) doesn't track purity but makes the
  convention pleasant enough that nobody reaches for hidden side effects.
  Ergonomics as enforcement.

### 4.4 Currying-by-default vs the JS target
**Resolved** — *Uncurry in codegen* (the first alternative below), via a runtime
`_curry` bridge that also closed a latent soundness bug (partial application and
mixed call styles type-checked but crashed). See [docs/currying.md](docs/currying.md).

Data-last currying is right for the pipe thesis, but every binary op is
`a -> b -> c` and lowers to nested closures (`add = (a) => (b) => a + b`).
That's idiomatic FP but has real allocation cost on a JS runtime for hot paths,
and it makes arity errors show up as "returns a function" rather than "too few
args".

**Alternatives:**
- *Uncurry in codegen* (the ReScript/OCaml play): keep curried types in the
  surface language, but compile known-arity calls `add(1)(2)` (and saturated
  multi-arg lambdas) to a flat `add(1, 2)` JS call, emitting a curried wrapper
  only where a function is partially applied or passed first-class. All the
  ergonomics, none of the closure tax on the 95% saturated-call path. This is
  well-trodden compiler territory.
- *Uncurried primitives + curried veneer*: prelude arithmetic is flat JS
  (`const add = (a, b) => a + b`); the inferencer treats `add(x, y)` as full
  application and `add(x)` as sugar for `(y) => add(x, y)`. Simpler than full
  uncurrying optimization, covers the hottest names.
- *Status quo + document*: nested closures are fine until profiling says
  otherwise; modern JITs inline the common shapes. Legitimate — but write the
  note *now* so the choice is visible, and revisit when there's a benchmark.
- *Arity-aware diagnostics* (orthogonal, do regardless): when unification fails
  with `expected X, got A -> B`, special-case the message to "this call may be
  missing an argument" — turning the worst symptom (baffling arity errors)
  into a good one without touching the runtime story.

---

## 5. Prioritized recommendations

1. **Decide the abstraction story (Section 2.4) before growing the prelude.**
   This is the fork that determines whether alang is a toy-with-taste or a real
   small language. Prototype minimal `Eq`/`Ord` constraints and judge inference
   quality + error legibility.
2. **Fix the `float`/`number` surface lie** (Section 2.3). Small, and it's a
   correctness tell.
3. **Resolve the `map` vs `Array.map` redundancy** (Section 2.2). Pick one
   canonical form and teach it.
4. **Reconsider `${...}` and `#{...}`** (Section 3). At minimum kill `${` for a
   JS audience; ideally demote Set/Map literals to `Set.of` / `Map.of`.
5. **Add named record types** (Section 4.1) — cheap, and it compounds the
   tooling investment you've already made.
6. **Reach array/lazy-list pattern parity, or diagnose the gap** (Section 4.2).

---

## 6. Score

For a solo language at this stage: **strong. ~8/10.** The type-system core and
the interop story are the work of someone with real taste and real
understanding — not a tutorial follower. The points off are for one deferred
decision (abstraction over types) that everything else is quietly waiting on,
and one syntactic bet (the sigil family) that spends user goodwill without
enough return. Neither is fatal; both are cheaper to address now than in a year.

The highest compliment: the critique above is almost entirely about *scaling*
the design, not fixing it. The foundation is sound enough that "what happens at
100× the standard library" is the interesting question.
