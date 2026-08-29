# ReScript ergonomics worth implementing for Mochi

**Question.** Which ReScript surface and compiler ergonomics would actually pay off in Mochi — not a feature dump, a ranked shortlist against Mochi's current language and ADRs.

**Sources.** Local ReScript tree at `~/dev/rescript` (compiler FFI, stdlib, changelog, syntax tests) plus the official language manual. Mochi side: `docs/language.md`, ADRs 0012 / 0059 / 0068 / 0072 / 0080 / 0098, and current codegen (`_tag` variants, tagged `Option`).

## How ReScript earns its reputation

ReScript's best ideas are not "more OCaml." They are the tricks that make a small typed language **feel native on JavaScript** without becoming TypeScript:

1. The declared FFI type is ground truth; calling convention is a small closed sum that only affects codegen (`compiler/frontend/external_ffi_types.ml`, `ast_external_process.ml`). Mochi already copied this posture ([ADR 0012](../adr/0012-host-interop-end-state.md), [ADR 0059](../adr/0059-js-extern-conventions.md)).
2. Call sites that would be positional soup in JS get **labels, optionals, and defaults**, then still emit flat JS. Manual: [Function](https://rescript-lang.org/docs/manual/function/).
3. Records, variants, and Option have **JS-shaped runtime encodings** (`None` → `undefined`, untagged variants, `@tag`/`@as`, `dict{}` → plain objects). Manual: [Record](https://rescript-lang.org/docs/manual/record/), [Variant](https://rescript-lang.org/docs/manual/variant/), [Dict](https://rescript-lang.org/docs/manual/dict/).
4. Pipe-first `->` plus `@send` makes method chaining look like JS without a class system. Manual: [Pipe](https://rescript-lang.org/docs/manual/pipe/), [Bind to JS Function](https://rescript-lang.org/docs/manual/bind-to-js-function/).

Mochi already has the skeleton of 1 and 4. The remaining high-leverage gaps are 2 and 3.

## Already in Mochi (do not re-copy)

| ReScript thing | Mochi equivalent |
|---|---|
| `->` pipe-first | Fast pipe `->` ([ADR 0069](../adr/0069-fast-pipe.md), [0073](../adr/0073-fast-pipe-precedence.md)); data-last `|>` is extra |
| `switch` + exhaustiveness + or-patterns + `if` guards + as-patterns | `switch` / or-patterns / `when` / `as` ([0022](../adr/0022-or-patterns.md), [0066](../adr/0066-pattern-matrix-exhaustiveness.md), [0068](../adr/0068-parse-only-syntax-batch.md)) |
| Record punning `{x, y}`, spread `{...r, x: 1}` | Same ([0068](../adr/0068-parse-only-syntax-batch.md), [0021](../adr/0021-record-update-spread.md)) |
| Param type annotations | `(x: number) =>` ([0068](../adr/0068-parse-only-syntax-batch.md)) |
| JSX as desugar-then-unify | JSX plugin ([0007](../adr/0007-jsx-desugar.md), [0011](../adr/0011-language-plugins.md)); V4 record props are the same idea ([`docs/JSXV4.md`](file:///Users/alanrsoares/dev/rescript/docs/JSXV4.md)) |
| `@send` / `@get` / `@set` / `@new` / `@val` / `@module` | `send` / `get` / `set` / `new` / `global` / module-string ([0059](../adr/0059-js-extern-conventions.md)) |
| String interpolation, `ignore`, `()`, `let rec` via SCC | All present |
| Operator sections `(+ 1)` | [ADR 0000](../adr/0000-operator-sections.md) — covers the operator half of ReScript's pipe placeholders |
| String literal unions | [ADR 0081](../adr/0081-string-literal-unions.md) — ADR 0012 already rejected full polyvariants + `@as` *until codegen mapping demands them* |
| Outbound TS, not inbound `.d.ts` | [ADR 0026](../adr/0026-codegen-ts-strict-clean-backend.md) + 0012 |
| Formatter + LSP + spans | First-class |
| Structural records (row poly) | **Better than ReScript records**, which are nominal and cannot say "any value with `age`" ([Record: "Record Types Are Found By Field Name"](https://rescript-lang.org/docs/manual/record/)) |

## In flight — finish these first

[ADR 0098](../adr/0098-optional-record-fields-and-labeled-props.md) (proposed 2026-08-29) already names ReScript's two highest-leverage remaining features:

1. **Optional record fields** `{ name?: string }` — the type-system change. Unblocks intrinsic JSX props (retire the schema validator from [0096](../adr/0096-jsx-intrinsic-element-prop-types.md) / [0097](../adr/0097-jsx-schema-single-source.md)) and styled-cva closed prop contracts.
2. **Labeled parameters** as *sugar over that row*, not a second calling convention. ReScript's labels are a distinct arity/reorder machine that still emit positional JS ([Function](https://rescript-lang.org/docs/manual/function/), [FFI labels](https://rescript-lang.org/docs/manual/bind-to-js-function/)). Mochi should **not** copy that machinery: JSX already desugars to records, and rows are the native representation. `f(~tone="rose")` → `f({ tone: "rose" })` is the Mochi-shaped port.

Section 2 of 0098 is marked unproven. The research below treats optional fields as mandatory and labeled sugar as high-value once fields land.

---

## Ranked: implement

Each item is scored on *pain it removes in Mochi today*, *fit with existing bets* (HM, rows, curry, Task, tagged `_tag` variants, `@onrails` Option/Result), and *cost*.

### 1. Optional record fields — ship 0098 §1

**ReScript.** v10 optional fields: omit at construction, access is `option`, pattern-match on the record treats the field as the raw type, `?None` / `?Some(_)` to test presence. Updates can set `name: ?maybeName`. Manual: [Optional Record Fields](https://rescript-lang.org/docs/manual/record/).

**Why it is #1.** Every large JS API is "a config object with 40 optional keys." Mochi's rows can only say present or absent. That is why JSX went through a plugin-side schema instead of unifying against `domProps`, and why styled-cva cannot close a prop row. ReScript's own docs call this out: optional fields exist *because* JS config objects were annoying as mandatory records.

**Do not substitute `Option<T>` fields.** 0098 already rejects `<div id={Some("x")} />`. ReScript's trick is that optionality is a *field flag*, not a payload wrapper at the construction site.

**Cost.** Real: `Row` / unify / generalize / `.d.ts` / fmt / bootstrap. Worth it. This is the last type-system hole that host UI keeps tripping over.

### 2. Labeled / optional / default arguments — 0098 §2, as record sugar

**ReScript.** `~x`, `~radius=?` (body sees `option`), `~radius=1` (body sees raw), punning `~name`, reorder at call site, explicit optional `~radius=?payloadRadius` to forward an `option` without a `switch`. Labels on `external`s relabel a positional JS function without a wrapper. Manual: [Function](https://rescript-lang.org/docs/manual/function/).

**Mochi port.** Lower to one record parameter (0098). That gives:

- JSX and ordinary functions share one calling convention.
- Defaults evaluate at the call site (0098).
- Punning `~tone` and forwarding `~tone=?opt` fall out of optional-field construction (`tone: ?opt`).
- Reordering is record-field order, not a second arity table.

**Skip ReScript's signature/body type split** (`int=?` outside, `option<int>` inside) if the lowering is a record: the outside type is `{ tone?: string, size?: number }`, the inside is the same row with fields projected. That is simpler than ReScript's dual view.

**When to land.** After optional fields unify. Do not invent labeled arrows in HM.

### 3. Dict — JS objects with uniform values

**ReScript.** `dict{"A": 5}` compiles to a plain object. Values share one type. Pattern match `dict{"name": JSON.String(name)}`. Stdlib is `@get_index` / `@set_index` over objects (`packages/@rescript/runtime/Stdlib_Dict.res`). Manual: [Dictionary](https://rescript-lang.org/docs/manual/dict/). v13 adds dict spreads and dict rest patterns ([CHANGELOG 13.0.0-alpha.4/5](file:///Users/alanrsoares/dev/rescript/CHANGELOG.md)).

**Mochi gap.** `#{ "a": 1 }` is a native `Map`, not an object ([ADR 0080](../adr/0080-collection-literals.md)). Records are heterogeneous named fields. There is no "string-keyed object of `a`" that round-trips JSON / `dataset` / CSS / `import.meta` / `process.env`.

That missing third collection is why host objects get faked as open records (`{ | 'r }`) or escape to `extern`. Open records do not mean "unknown keys of the same type"; they mean "more named fields of unknown types."

**Mochi-shaped design.**

- New type `Dict<a>` (or reuse a prelude constructor) emitting `{}` / `Object.*`.
- Literal: do **not** steal `#{}`. Map stays Map. A distinct sigil or `dict { "a": 1 }` / `Dict.of({ "a": 1 })` keeps ADR 0080's disambiguation intact.
- `Dict.get : string -> Dict<a> -> Option<a>` data-last; no mutation in the surface (ReScript dicts are mutable — reject that). Updates are `Dict.set` returning a new object, or a spread form if one is added later.
- Pattern matching is optional sugar; combinators would already unlock JSON decode.

**Cost.** Medium: new AST literal or prelude-only API, codegen, eq/show (C4 already taught that collections need their own walk). High leverage for any JSON-shaped host.

### 4. Finish the FFI convention set — variadic, index, as, return-nullable

ADR 0059 already named the leftovers: "Future optional arguments, variadics, and tagged templates require separate decisions."

ReScript's closed `external_spec` sum (`compiler/frontend/external_ffi_types.ml`) is:

| ReScript | Role | Mochi today |
|---|---|---|
| `Js_var` / module / call | import / global | yes (`global`, module-string) |
| `Js_send` / `Js_get` / `Js_set` / `Js_new` | methods, fields, ctor | yes |
| `Js_get_index` / `Js_set_index` | `obj[key]`, `arr[i]` | **no** |
| `splice` (variadic) | `Math.max(...xs)`, `path.join` | **no** |
| `@as("exit")` placeholder args | bake a literal into the JS call | **no** |
| `@return(nullable)` | `null`/`undefined` → `option` | **no** (Option is tagged `{ _tag }`) |
| `@unwrap` + polyvariant | `string \| number` arg, strip ctor | **no** — string unions cover some of this |
| `@this` | JS `this` callbacks | **no** |
| `@obj` | build an object from labeled optionals | **defer** — optional fields + record construction replace it |
| `@taggedTemplate` → first-class `taggedTemplate` in 13 | `` sql`...` `` | **later** (bun `$`, `gql`, `css`) |
| `@scope` | `Math.random` nested | yes, as `global "Math" "random"` |

**Implement next, in this order:**

1. **`variadic`** — last argument is an array spliced into the JS call. Unlocks `console.log`, `Math.max`, `path.join`, `Array.push`. Homogeneous rest only, same restriction as ReScript ([Bind to JS Function](https://rescript-lang.org/docs/manual/bind-to-js-function/)).
2. **`get_index` / `set_index`** — receiver + key. Needed for Dict and for `headers["content-type"]` without a method.
3. **`as` literal args** — `@as("exit") _` so `process.on("exit", cb)` does not take the string at the Mochi call site. Small, high-clarity FFI.
4. **`return nullable`** — *only* as a codegen wrapper at the extern boundary (`null`/`undefined` → `None`, else `Some`). Do not change Option's runtime (see §5).

Keep the ADR 0012 rule: conventions stay a closed sum after `=`, never an unbounded attribute language.

### 5. Variant `@tag` / `@as` — JS-shaped discriminants, not untagged-everything

**ReScript.** Nullary variants emit the constructor name as a string; payload variants emit `{ TAG, _0, ... }` (or inline-record field names). `@tag` renames the discriminant; `@as("UP")` / `@as(null)` / `@as(true)` sets the runtime tag or, with `@unboxed`, the whole payload. Untagged `@unboxed` strips constructors when runtime representations do not overlap — this is how `JSON.t` and `string | number | bool` arrays work. Manual: [Variant](https://rescript-lang.org/docs/manual/variant/), [blog: customizable variants](https://rescript-lang.org/blog/improving-interop/).

**Mochi today.** Every ctor is `{ _tag: "Circle", _0 }` / `{ _tag: "Some", value }` (`codegen-decl.ts`, prelude `Some`/`None`). That matches `@onrails/pattern` and `@onrails/maybe`. It does **not** match TS string enums, `"success" | "error"` objects with a different key, or JSON.

**Port, in two slices:**

- **Slice A (cheaper, higher hit rate):** per-variant codegen attributes for discriminant key and per-ctor `@as` payload, so a Mochi variant can be *the same object* a TS discriminated union already is. String-literal unions ([0081](../adr/0081-string-literal-unions.md)) already cover the no-payload string-enum case; this covers `{ type: "click", x, y }` vs `{ _tag: "Click", x, y }`. ADR 0012 said to revisit `@as` "if codegen mapping demands it" — host UI and JSON now do.
- **Slice B (expensive):** untagged variants with overlap checking. Worth it for a prelude `Json` type and `string | number | bool` host values. Do not take it before Slice A; it is a second representation, a second match compiler, and a bootstrap-tsc risk.

**Do not unbox `Option`.** ReScript's `None = undefined` / `Some(x) = x` (with a nested encoding for `Some(None)`, `Primitive_option.res`) is the reason `@return(nullable)` works. Mochi's Option is a tagged variant on purpose so it is `switch`-able and `@onrails/maybe`-shaped. Keep the tagged runtime; convert at the *extern* with `return nullable`, not in the prelude.

### 6. Pipe placeholders `_`

**ReScript.** `add3(3, _, 4)` and `getName(input)->namePerson(~name=_)` mark which argument the pipe fills. Manual: [Pipe placeholders](https://rescript-lang.org/docs/manual/pipe/). Also: pipe into a constructor (`name->preprocess->Some`).

**Mochi.** Data-last `|>` already puts the interesting value last. Fast pipe `->` always fills first. Operator sections cover `|> map((+ 1))`. The remaining hole is piping into a *non-first, non-last, or labeled* slot of a host-shaped function: `ctx -> drawImage(img, _, 0)` or, once labels exist, `opts -> connect(~timeout=_)`.

**Design.** A hole `_` only in application position, only consumed by `->` / `|>` (and maybe sections). Parse-only: rewrite `f(a, _, b)` under a pipe into a lambda. Do not make `_` a general partial-application operator — ReScript itself added explicit `add(5, ...)` in 11.0 *because* it went uncurried; Mochi is still curried, so `add(5)` already works.

Pipe-into-constructor (`x -> Some`) is a one-line special case in fast-pipe codegen and is worth bundling.

### 7. Explicit optional forwarding (comes free with 1+2)

ReScript's `~radius=?opt` / record `name: ?maybeName` is the difference between "optional fields exist" and "optional fields are usable in pipelines." Implement it as part of 0098, not as a later surprise. Without it, every optional call site grows a `switch`.

---

## Worth later (real, not now)

| Item | Why wait |
|---|---|
| **Tagged templates** | ReScript 11.1 decorator, 13.0 first-class `taggedTemplate` type ([CHANGELOG 13.0.0-alpha.5](file:///Users/alanrsoares/dev/rescript/CHANGELOG.md)). Pays off for `sql` / `gql` / bun `$`. Need the FFI sum to grow once; not blocking UI. |
| **`@this`** | Niche DOM/XHR callbacks. Add when a host binding needs it. |
| **Untagged / `Json` prelude** | Slice B of §5. Pair with Dict. |
| **Record type spreads** `type c = { ...a, ...b }` | ReScript v11 copy-paste of fields. Mochi aliases + rows may make this less necessary; nice for `domProps` + extra keys. Cheap after optional fields. |
| **Variant type spreads** `type animals = \| ...pets \| ...fish` plus match `\| ...pets as pet` | Elegant subtype match. Wait until ctor-merge (C13) and qualified types (C5) are solid. |
| **Record rest patterns** | ReScript 13 (`...rest` in record match). Useful; not a language identity feature. |
| **`@deprecated` / warning numbers** | Library-author DX. LSP already has unused bindings. Cheap whenever. |
| **Array index sugar `xs[i]`** | ReScript has it; Mochi has `Array.get` → `Option`. Sugar that returns `Option` (not a crash) would be Mochi-shaped. Low urgency. |
| **Export hiding / `.resi`** | ReScript files-as-modules + interfaces. Mochi is explicit `export`. A future `export type` / opaque alias story is enough; do not grow interface files. |
| **`@directive` / `"use client"`** | ReScript compiles these through. Mochi already has `"use open"` ([0072](../adr/0072-use-open-directive.md)). Add other directives if a bundler target needs them. |

---

## Explicitly do not copy

These are ReScript successes that fight Mochi's bets, or that Mochi already solved a different way.

| ReScript | Why not |
|---|---|
| **Uncurried-by-default** (v11+) and `add(5, ...)` | Mochi's surface *is* curry ([0093](../adr/0093-curry-type-not-overloads.md)). Keep `_curry` at the JS edge. |
| **`async` / `await` / `promise<'a>`** | Task is the IO-action bet ([0005](../adr/0005-prelude-task.md), [0006](../adr/0006-task-result-async.md)). `await` would reintroduce memoized-Promise culture. |
| **`%raw` / `%%raw` as normal practice** | Fights the typed seam. Keep `extern`. |
| **`@obj` extern builders** | Optional fields + record construction are the replacement; `@obj` exists because ReScript records used to be all-mandatory. |
| **Nominal records + a second Object type `{. x: int}` / `{..}`** | Row polymorphism already is the "any record with these fields" story ReScript objects exist to provide. |
| **Record coercion `a :> b`** | Width/optional-field flow should come from unify, not an explicit cast operator. |
| **Mutable record fields, mutable Dict** | Immutability is a grit rule. Emit copies. |
| **`rec` / `and` for recursion** | Top-level SCC already infers mutual recursion regardless of order. |
| **Files-as-modules, nested modules, functors, `.resi`** | Explicit imports ([0002](../adr/0002-namespace-imports.md), [0082](../adr/0082-scoped-ctor-imports.md)) are the module story. |
| **`open Belt` ambient opening** | `"use open"` is an inference mode, not a namespace dump. Keep qualified `List.map`. |
| **Exception match in `switch` / `try` as the error path** | `Result` + `Task` + `let?` / `let!`. Bind JS throws at the extern. |
| **`for` / `for-of` / `break` / `continue`** (v13) | `loop` / `recur` ([0056](../adr/0056-language-loops.md)) is the expression-shaped loop. |
| **int vs float operators** | One `number` ([0085](../adr/0085-int-float-aliases.md)). |
| **Polyvariants `#foo` as a second variant system** | String unions + ordinary variants. ADR 0012 already parked the `@as` polyvariant stack. |
| **Unboxed Option / `None = undefined` globally** | Breaks `@onrails/maybe` and `switch` on Option. Convert at FFI only. |
| **GenType as a separate pipeline** | One codegen, two backends ([0026](../adr/0026-codegen-ts-strict-clean-backend.md)). |
| **Belt / extra mutable collections** | Array / List / Set / Map is enough; Dict is the one missing JS-shaped collection. |

---

## Suggested sequence

```
0098 §1 optional fields     ← type system; unblocks JSX/CVA
    └─ 0098 §2 labels + ?forwarding + punning   ← sugar over rows
FFI: variadic → get_index → as → return nullable
Dict<a> (immutable, distinct from Map)
Variant @tag/@as (keep _tag default)
Pipe placeholder _  (+ pipe into ctor)
[later] untagged Json, tagged templates, record type spreads
```

Parser recovery (C9) and collection `eq` (C4) stay ahead of all of this in the tracker. None of the items above replace those.

## Fit test for any future ReScript borrow

Before taking another ReScript feature, it should pass all three:

1. **It makes the JS seam honest**, not the ML surface larger. (Labels, optional fields, Dict, FFI conventions, `@tag` all pass. Functors, objects-as-a-second-record, `async` fail.)
2. **It is sugar or codegen over types Mochi already has** (rows, variants, `Option`, `extern`). New unify rules are allowed only when sugar cannot say it (`?` on a field).
3. **It does not fork a runtime encoding** the prelude and `@onrails` already committed to — unless the fork is *local to one extern*.
