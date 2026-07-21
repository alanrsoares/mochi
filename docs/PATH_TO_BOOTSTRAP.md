# Path to bootstrap

What it takes for alang to compile itself. The spec is the existing compiler:
~3.4k LOC of TypeScript (`lexer → parser → check → infer → codegen`, plus
`dts`/`format`/`module`), all Result-threaded, all pattern-matched — i.e. code
that is already *shaped* like alang. This doc inventories what the language
has, what blocks the port, and the slice order to get there.
(Live status checklist: `docs/bootstrap.md`.)

**Distance, honestly (updated 2026-07-21): the front half of the pipeline is
self-hosted.** Local `let … in` (ADR 0009), tuples + binding sugar (ADR
0010/0011), the char cursor, nested patterns (ADR 0012), guards (ADR 0013),
composite ctor fields (ADR 0015), and the prelude pieces all landed — and
**Slices C and D shipped**: `bootstrap/lexer.al` + `bootstrap/parser.al`
reproduce the TS lexer's tokens and the TS parser's AST on every `.al` file
in the repo, including themselves (`test/bootstrap-{lexer,parser}.spec.ts`).
Next: check + infer (Slice E).

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
| Local bindings | `let x = e in body` (ADR 0009) — let-polymorphic, `in` contextual keyword, IIFE codegen | ✓ |
| Tuples | `(a, b)` literal / switch pattern / type (ADR 0010) + binding sugar `((a, b)) => …`, `let (a, b) = e in …` (ADR 0011) | ✓ |
| Char-level cursor | `Str.get`/`Str.codeAt` (bounds-safe → `Option`), `Str.fromCode`, `Str.chars`, `Str.toNumber` | ✓ |
| Predicate branching | Boolean-literal patterns: `switch p { \| true => … \| false => … }` | ✓ |
| String equality | Polymorphic structural `eq : a -> a -> bool` covers ident-vs-ident comparison | ✓ |

---

## 2. Gaps, ranked by blockage

### 2.1 ~~Local bindings — THE wall~~ DONE (ADR 0009)
`let x = e in body` shipped: let-polymorphic, non-recursive, `in` a contextual
keyword, IIFE codegen. Tuple-binding sugar (ADR 0011) followed, so scanner /
cursor state threads cleanly (`let (tok, rest) = next(cursor) in …`).

### 2.2 ~~Nested ctor patterns miscompile~~ DONE (ADR 0012)
Was: `Sm(Sm(n))` typechecked but silently emitted broken JS (free variables).
Now: a general pattern compiler lowers nested arms to the guard form
(`.with((_v) => conds, (slot) => body)`); flat arms keep the readable
matcher-object emit. Exhaustiveness is conservative (a narrowing arm doesn't
cover its ctor — add `C(_)` or `_`), nested ctors are validated (known/arity),
record fields may nest, lazy-List patterns may not. Guard:
`test/nested-patterns.spec.ts`.

### 2.3 ~~Prelude one-liners~~ DONE
1. ~~`Str.toNumber`~~ **DONE** — shipped with the char cursor
   (`Str.get`/`codeAt`/`fromCode`/`chars`).
2. ~~`show`~~ **DONE** — shipped as polymorphic structural `show : a -> string`
   (ADR 0007 addendum), not the monomorphic `number -> string` this doc first
   asked for: same cost, covers diagnostics/tests too.
3. ~~`Str.concat : string -> string -> string`~~ **DONE** — data-first
   (`Str.concat(a)(b) = a ++ b`), mirroring `Array.concat`.
4. ~~`Str.eq`~~ **DONE by construction** — builtin `eq : a -> a -> bool` is
   polymorphic structural equality; ident-vs-ident comparison just works.
5. ~~`Array.prepend`~~ **DONE** — cons (`a -> [a] -> [a]`); found missing by
   the micro-lexer spike, which had faked it O(n²) via `Array.concat([x])`.

### 2.4 Nice-to-have, explicitly non-blocking
- ~~**Tuples**~~ **DONE** (ADR 0010 + 0011 binding sugar).
- ~~**do-notation / `let? x = e in …` monadic bind**~~ **DONE** (ADR 0017) —
  `let? param = value in body`, Result-only monadic bind, first-class AST node
  (formatter round-trips it; type errors speak `let?`). Lowers to
  `_Result_flatMap((param) => body)(value)`.
  The history: the parser port threads `Result` through every production;
  manual `flatMapOk` nesting is the swamp the TS compiler avoids via early
  returns. Deliberately deferred until the lexer spike measured the real pain.
  **Slice D verdict:** pain real but shallow — `Result.flatMap` with
  tuple-destructure lambdas (`((node, p)) => …`) reads fine at 2–3 steps;
  the worst chains (`parseExtern`, `parseLetIn`) nest 6–7 continuations of
  pure position-threading. `let?` flattens exactly those, shipped before
  Slice E (infer threads two states, not one). parser.al then migrated:
  ~31 chain sites became flat `let?` binds (parseExtern is seven lines, one
  per step); 11 legitimate single-step combinator uses remain. The bootstrap
  parser gained `ELetBind` for parity; the differential suite pins both.
  The louder Slice D signal was **bool-switch ceremony**: ~25 of parser.al's
  switches were `switch cond { | true => … | false => … }`.
  ~~a ternary / if-expression cuts noise everywhere~~ **DONE** (ADR 0016) —
  `cond ? then : else` shipped; 38 bool-switches across lexer.al/parser.al
  became ternaries (differential suites pin the behavior). Found in passing:
  ctor field labels named after JS reserved words (`else`) miscompile — the
  `thenE`/`elseE` dodge in parser.al, same family as `fieldType`.
- **Record update sugar** (`{ ...r, field: v }` as an expression) — `infer`
  threads state records; rebuilding every field by hand is noise.
- ~~**Pattern guards**~~ **DONE** (ADR 0013) — `| p when expr => body`; nearly
  free on top of ADR 0012's guard-form emission. Guarded arms never count
  toward exhaustiveness. **Or-patterns** remain future work; not required.
- **String interpolation** — would make codegen pleasant; `Str.concat` is
  sufficient.

---

## 3. Known hazards (survivable, note them now)

- **Quadratic substitution.** `Map.set` copies the whole map (`new Map(m)`), and
  inference performs thousands of binds — O(n²) on large modules. The
  bootstrap survives (modules are small); when it hurts, shim a mutable ref
  via `extern` (host-provided union-find) or add a persistent map. Do not
  redesign the language for this.
- ~~**Stack depth.**~~ **RESOLVED (ADR 0014).** JSC (Bun) does proper tail
  calls in strict mode, emitted modules are ESM (strict), and `_curry`'s
  saturated path is now a tail call — so tail-recursive alang functions run in
  O(1) stack (~2M depth measured). The lexer spike hit this wall on day one
  (per-token recursion overflowed on the two biggest corpus files) and the
  `_curry` fix removed it. Caveat: harnesses eval'ing emitted JS via
  `new Function` must prepend `"use strict"`, and non-tail recursion still
  costs O(n) frames.
- ~~**No generic `eq`/`show`.**~~ Both exist now as polymorphic structural
  builtins (ADR 0007 + addendum). Caveat: `show` renders the runtime shape —
  fine for tests/diagnostics; pretty-printers with language-specific syntax
  (`showType`'s `a -> b`) are still hand-written per type. See "forcing
  function" below.

---

## 4. Slice plan

Each slice is shippable and independently verifiable, in the existing
one-feature-per-slice style.

### Slice A — prelude one-liners — DONE
`Str.toNumber` ✓, `Str.eq` ✓ (polymorphic `eq`), `show` ✓ (structural, ADR 0007
addendum), `Str.concat` ✓, `Array.prepend` ✓ (cons).
*Exit met: a `.al` program round-trips `"42"` → number → string
(`Str.toNumber` + `show`) and compares two strings (`eq`).*

### Slice B — local bindings — DONE (ADR 0009, 0011)
`let … in` (let-polymorphic — generalized, not monomorphic; choice recorded in
the ADR) + tuple-binding sugar. Parser, inference, codegen, formatter, hover.
*Exit met: multi-binding functions read cleanly; gate green.*

### Slice B′ — nested-pattern codegen — DONE (ADR 0012)
General pattern compiler (`patConds`/`patSlot`) + conservative exhaustiveness
+ nested validation + record-field nesting; lazy-List nesting rejected.
*Exit met: `Sm(Sm(n)) => n` (and tuple/record/array nestings) evaluate
correctly; `test/nested-patterns.spec.ts` guards it.*

### Slice C — lexer in alang (first self-hosting artifact) — DONE
`bootstrap/lexer.al` (~250 LOC): `Tok` variant, `go` tail-recursion over the
char cursor, doc-comment state threaded as parameters, keyword/digraph/punct
tables as string-literal switches. `test/bootstrap-lexer.spec.ts` diffs
canonical token streams against the TS lexer on every `.al` file in the repo
plus 17 edge cases and error parity (same messages, same spans).
*Exit met: identical streams on the whole corpus — including `lexer.al`
lexing itself.* The spike also flushed out two compiler bugs (record-literal
arm bodies emitted unparenthesized; `_curry` breaking tail calls → ADR 0014)
— differential testing paying for itself on day one.

### Slice D — parser in alang — DONE
`bootstrap/parser.al` (~760 LOC): AST as variants, every production
`(toks, pos) -> Result((node, pos), err)`, mutually recursive productions on
SCC inference, generic `sepBy`/`listUntil` comma-list machinery.
`test/bootstrap-parser.spec.ts` maps both ASTs into one canonical JSON shape
and diffs them on every `.al` file in the repo — including parser.al itself —
plus edge cases and error parity (same messages, same spans).
Two prerequisites got built on the way:
- **ADR 0015** — ctor fields carry full type expressions (`[Expr]`,
  `Option Expr`, tuples, arrows); the AST was inexpressible without it.
- **ADR 0014 addendum** — `@onrails/pattern`'s dispatch broke proper tail
  calls (for..of return + result-sentinel check → ~14.6k ceiling); fixed
  upstream (`findCase`), pinned here via bun patch. Self-parse flushed it.
*Exit met: canonical AST JSON identical on the corpus; parser.al parses
itself.*

### Slice E — check + infer in alang ← NEXT
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

- Don't add guards, do-notation, or typeclasses *as bootstrap prerequisites* —
  each is a detour dressed as a shortcut. Bootstrap on what exists plus
  §2.2/§2.3; let the pain collected en route prioritize what comes after.
- Don't chase inference performance before the quadratic subst actually hurts.
- Don't port `module.ts`/CLI early — host shims via `extern` are fine
  indefinitely; the fixpoint ceremony only needs the four core passes.
- Don't let the bootstrap fork the prelude. One prelude, consumed by both
  implementations, or the two compilers drift.
