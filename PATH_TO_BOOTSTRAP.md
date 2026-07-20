# Path to bootstrap

What it takes for alang to compile itself. The spec is the existing compiler:
~3.4k LOC of TypeScript (`lexer → parser → check → infer → codegen`, plus
`dts`/`format`/`module`), all Result-threaded, all pattern-matched — i.e. code
that is already *shaped* like alang. This doc inventories what the language
has, what blocks the port, and the slice order to get there.

**Distance, honestly: one language feature + four prelude one-liners, then
grunt work.** No remaining *design* unknowns — the hard prerequisites are
already proven in the tree.

---

## 1. Verified prerequisites (already work)

| Compiler need | alang feature | Status |
|---|---|---|
| AST as data | Recursive parametric variants: `type Expr = \| Num(number) \| Neg(Expr) \| Add(Expr, Expr)` compiles and evaluates (verified 2026-07-21) | ✓ |
| Error plumbing | Builtin `Option`/`Result` + railway combinators — the TS compiler is Result-everywhere; the same shape ports directly | ✓ |
| Case analysis over AST | Exhaustive `switch` with ctor patterns, record patterns, string-literal patterns (keyword/token dispatch) | ✓ |
| Envs, registries, substitutions | `Map k v` with `has/get/getOr/set/delete/keys/values` | ✓ |
| Char-level lexing | `Str.split("")` → char array; `Str.slice/length/contains/startsWith` for classification | ✓ |
| Token cursor | `Array.head/tail/take/drop` (Option-returning safe accessors) | ✓ |
| Mutually recursive productions | Top-level SCC grouping — parser functions can forward-reference | ✓ |
| File IO, CLI | `extern` FFI to host shims — every bootstrap in history shims IO through the host; this is normal, not cheating | ✓ |
| Generic containers of own types | Deep generics: `[Token]`, `Map<string, Scheme>`, `Result<Program, Error>` all unify positionally | ✓ |

---

## 2. Gaps, ranked by blockage

### 2.1 Local bindings — THE wall (~80% of the distance)
Every compiler function binds 3–5 intermediates (peek a token, compute a span,
build a node, thread a substitution). alang today has only top-level `let`;
function bodies are single expressions. Without locals, `parseExpr` becomes
unreadable pipe contortion or an explosion of tiny top-level helpers.

This is a real language feature touching parser, inference, and codegen:
- Surface: either ML-style `let x = e1 in e2` or block bodies
  `{ let x = e1; e2 }`. Block form reads more natural next to the existing
  `switch { ... }` braces and JS heritage; `in`-chaining nests badly.
- Inference: local `let` should generalize like top-level `let`
  (let-polymorphism) or deliberately stay monomorphic (simpler, and fine for
  bootstrap purposes — document the choice).
- Codegen: blocks lower to an IIFE or to statement sequences when the context
  allows. Statement lowering keeps output readable.

Nothing else in this document matters until this lands.

### 2.2 Prelude one-liners (a day, total)
1. `Str.toNumber : string -> Option<number>` — the lexer must parse numeric
   literals. (`Number(s)` + `isNaN` check under the hood.)
2. `show : number -> string` (or `Str.fromNumber`) — codegen emits numbers
   into JS text.
3. `Str.concat : string -> string -> string` (or a `++` operator) — codegen is
   string-building all the way down. `Str.join("")([...])` fakes it today but
   the ergonomics are brutal for emit-heavy code.
4. `Str.eq : string -> string -> bool` — identifier comparison. Builtin `eq`
   is `number -> number -> bool`; string-literal *patterns* cover keyword
   dispatch, but general ident-vs-ident comparison needs a function.

### 2.3 Nice-to-have, explicitly non-blocking
- **Tuples** — `(Token, rest)` pairs are fakeable as `{ fst, snd }` records.
  Add real tuples later; don't gate bootstrap on them.
- **Pattern guards / or-patterns / nested ctor patterns** — each removes
  boilerplate in `check`/`infer` ports; none is required.
- **String interpolation** — would make codegen pleasant; `Str.concat` is
  sufficient.

---

## 3. Known hazards (survivable, note them now)

- **Quadratic substitution.** `Map.set` copies the whole map (`new Map(m)`), and
  inference performs thousands of binds — O(n²) on large modules. The
  bootstrap survives (modules are small); when it hurts, shim a mutable ref
  via `extern` (host-provided union-find) or add a persistent map. Do not
  redesign the language for this.
- **Stack depth.** Compiles to JS with no TCO; deeply nested expressions recurse
  the compiler deeply. JS engines give ~10k frames — fine for realistic
  modules. If a pathological file breaks it, that's a "known limitation" line,
  not a blocker.
- **No generic `eq`/`show`.** The port will want structural equality and
  printing on every type (tests, error messages, `showType`). Interim answer:
  hand-written per-type `showExpr`/`eqType` functions — verbose but honest.
  See "forcing function" below.

---

## 4. Slice plan

Each slice is shippable and independently verifiable, in the existing
one-feature-per-slice style.

### Slice A — prelude one-liners
`Str.toNumber`, `show`, `Str.concat`, `Str.eq`. Types + runtime + tests.
*Exit: a `.al` program can round-trip `"42"` → number → string and compare two
strings.*

### Slice B — local bindings
Block-bodied expressions with local `let` (monomorphic locals acceptable;
record the choice). Parser, inference, codegen, formatter, hover.
*Exit: a nontrivial multi-binding function reads cleanly; all existing tests
green.*

### Slice C — lexer in alang (first self-hosting artifact)
Port `lexer.ts` (~170 LOC) to `bootstrap/lexer.al`. Token type is a variant;
lexing is `unfold`-style recursion over a char array. Host test harness: run
the alang-emitted JS lexer against the TS lexer on the whole test corpus and
diff token streams.
*Exit: `lexer.al` lexes every `.al` file in the repo identically to the TS
lexer — including `lexer.al` itself. This is the demo moment; ship it loud.*

### Slice D — parser in alang
Port recursive descent (~590 LOC). Mutually recursive productions lean on SCC
inference. Cursor threading via records until tuples exist. Differential-test
AST output (JSON) against the TS parser.
*Exit: byte-identical AST JSON on the corpus.*

### Slice E — check + infer in alang
The heavy slice. Registry and exhaustiveness port mechanically; inference needs
substitution threading (immutable `Map` first; extern union-find shim if too
slow). Differential-test inferred schemes against TS on the corpus.
*Exit: same schemes, same errors (message text may differ; codes/spans must
match).*

### Slice F — codegen + closing the loop
Port codegen + prelude inlining. Then the ceremony:
1. **Stage 1:** TS compiler compiles `bootstrap/*.al` → `alangc.js`.
2. **Stage 2:** `alangc.js` compiles `bootstrap/*.al` → `alangc2.js`.
3. **Fixpoint:** `alangc2.js` compiles `bootstrap/*.al` → `alangc3.js`;
   `alangc2.js ≡ alangc3.js` byte-for-byte.
*Exit: fixpoint reached. alang is self-hosting.*

---

## 5. What bootstrap buys beyond bragging rights

- **The ultimate dogfood.** 3.4k LOC of real, typed, recursive,
  pattern-matching-heavy code — the exact workload the language claims to be
  good at. Every ergonomic gap becomes personally painful within a week.
- **A forcing function for the abstraction decision** (CRITIQUE.md §2.4).
  Compiler code wants `eq`/`show`/`ord` at every type. Writing per-type
  versions by hand is exactly the dictionary-passing encoding — doing it
  manually for a month is the cheapest possible experiment for whether
  typeclasses earn their complexity.
- **A permanent regression corpus.** The compiler-in-alang becomes the largest
  alang program in existence; every future language change must keep it
  compiling.
- **Differential testing for free.** During the transition, two independent
  implementations must agree on every file in the repo — a bug-finding engine
  that disappears the day it's no longer needed.

---

## 6. What NOT to do on the way

- Don't add tuples, guards, or typeclasses *as bootstrap prerequisites* — each
  is a detour dressed as a shortcut. Bootstrap on what exists plus §2.1/§2.2;
  let the pain collected en route prioritize what comes after.
- Don't chase inference performance before the quadratic subst actually hurts.
- Don't port `module.ts`/CLI early — host shims via `extern` are fine
  indefinitely; the fixpoint ceremony only needs the four core passes.
- Don't let the bootstrap fork the prelude. One prelude, consumed by both
  implementations, or the two compilers drift.
