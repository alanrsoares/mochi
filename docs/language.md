# The mochi language

A small ML-family language: Hindley–Milner inference (Algorithm W), parametric variants,
row-polymorphic records, exhaustive pattern matching. Type annotations are optional —
write `let x : T = v` at an export or a seam when inference would generalize the wrong
shape ([ADR 0044](adr/0044-let-binding-type-annotations.md)). A curried surface compiles
to uncurried JS.

Prose examples use infix (`+`, `*`, `|>`) where the operator exists; named prelude
functions (`square`, `hypot`, `map`) elsewhere. `(+ 1)` is a section ([ADR 0000](adr/0000-operator-sections.md)).

The single source of truth for "what compiles today" is
[`../examples/example.mochi`](../examples/example.mochi), which type-checks end to end.
This doc summarizes it.

## Bindings and functions

```mochi
let double = x => x * 2              // lambda
let hypot = (a, b) => sqrt(square(a) + square(b))  // multi-arg
let one = () => 1                    // nullary → `() -> number` (ADR 0014)
let pipeline = 5 |> double |> inc |> double            // left-to-right pipe
let shifted = 5 -> (+ 3)                               // add(5, 3), fast pipe
let glued = "hi" ++ ctx->label()                       // "hi" ++ label(ctx) — `->` tighter than `++` (ADR 0073)
```

Use `do { … }` to sequence expressions and return the final one. An arrow body
can omit `do`, which keeps callback-heavy code compact:

```mochi
let draw = ctx => {
  ctx->beginPath();
  ctx->stroke();
  ()
}
```

The formatter canonicalizes a nested `let _ = … in` chain to `do { … }`, and
uses the brace form for arrow bodies. Because `{ field: value }` remains a
record-valued arrow body, braces select sequencing only when they contain a
top-level semicolon; use explicit `do` for a one-expression sequence.

A top-level expression of type `()` is a statement ([ADR 0087](adr/0087-expr-statements.md)) —
`test(...)`, `log(msg)`, `do { … }` whose last expr is unit. `1 + 1` at top level
is a type error; bind it with `let` or discard with `ignore`.

Annotations / `extern` may write the same domain as `() -> T` (ADR 0015).

Top-level bindings are grouped into recursive components (Tarjan SCC) and inferred
together, so **mutual recursion type-checks regardless of definition order**:

```mochi
let isEven = n => switch n { | 0 => true  | _ => isOdd(n - 1) }
let isOdd  = n => switch n { | 0 => false | _ => isEven(n - 1) }
```

Local, non-recursive, let-polymorphic bindings scope to a body and chains flatten:

```mochi
let norm = (a, b) =>
  let a2 = square(a) in
  let b2 = square(b) in
  sqrt(a2 + b2)
```

## Types

**Variants (sum types)**, optionally parametric; constructors may carry named fields:

```mochi
type Shape = | Circle(float) | Rect(float, float)
type Result<A, E> = | Ok(value: A) | Err(error: E)
```

**Records** are transparent structural rows — no nominal identity, no runtime tag. A
named alias folds back in hover and `.d.ts`; duck typing falls out of row polymorphism:

```mochi
type Point = { x: number, y: number }
let distToOrigin = p => hypot(p.x, p.y)   // works on ANY record with x and y
let translate = (p, dx, dy) => { x: p.x + dx, y: p.y + dy }
```

A field marked `?` may be omitted at construction. Reading it yields `Option<T>`;
a required field still yields `T`. A record that *has* the field may be used where
an optional field is expected; the reverse is not
([ADR 0098](adr/0098-optional-record-fields-and-labeled-props.md) §1). JS emit
leaves the field absent at runtime.

```mochi
type Props = { id?: string, n: number }
let ok : Props = { n: 1 }
let getId = (p: Props) => p.id   // Option<string>
```

**Tuples** are real product types that erase to JS arrays. **One numeric type**
(`number`); `int`/`float` are documentation aliases with zero extra semantics —
`let z : int = 2.5` typechecks ([ADR 0085](adr/0085-int-float-aliases.md)).

**String literals and finite unions** are TypeScript-shaped ([ADR 0081](adr/0081-string-literal-unions.md)).
A string literal is a singleton (`"rose"`). A finite union is written with `|` in type
position. Unannotated `let x = "hi"` generalizes to `string` (TS `let`). An annotation
or a named synonym keeps the precise type:

```mochi
type Tone = "rose" | "amber"
let ok : Tone = "rose"
let greeting = "hi"                          // string
extern setTone : Tone -> () = "./ui.js" "setTone"
```

Union binds tighter than `->`, so `"a" | "b" -> T` is `("a" | "b") -> T`, and
`a -> b | c` is `a -> (b | c)`. Parenthesize an arrow that is a union member:
`(T -> T) | T`. A general `string` does not unify with a literal union.

**`unit`** is the one-inhabitant type, and `()` is its literal in every position — value,
type, and pattern ([ADR 0054](adr/0054-unit-value-and-ignore.md)). It is also the domain
of a nullary function, so `() -> T` and `unit -> T` are the same type and `f()` and `f(())`
are the same call ([ADR 0014](adr/0014-nullary-unit.md)). It emits `undefined`:

```mochi
let nothing = ()                             // () : ()
let f : () -> number = _ => 1
let a = f()                                  // same call as f(())
let describe = u => switch u { | () => "done" }
```

`ignore : a -> ()` is the sanctioned discard for a call whose result you do not want —
useful when the sibling arms of a `switch` or a ternary must agree on a type:

```mochi
| Save => ignore(persist(state))   // persist returns an id nobody reads here
| Cancel => ()
```

Prefer fixing the seam over discarding: an `extern` or plugin sketch for something that
really returns nothing should say `-> ()`, and then its calls need no `ignore` at all.

## Pattern matching

`switch` is exhaustive — a missing case is a compile error, including for imported
variants. Arms match constructors, literals, wildcards, a binding catch-all, records
(shallow, may narrow on a literal field), tuples, and lists:

```mochi
let area = shape => switch shape {
  | Circle(r) => pi * square(r)
  | Rect(w, h) => w * h
}

let handle = event => switch event {          // narrow on a string discriminant
  | { kind: "click", x, y } => hypot(x, y)
  | { kind: "scroll", by } => by
  | _ => zero
}

let sum = xs => switch xs {                   // [] / [head, ...tail]
  | [] => 0
  | [head, ...tail] => head + sum(tail)
}
```

A `when` clause adds a guard (no exhaustiveness credit). Destructuring also works in
lambda params (`({ x, y }) => …`, `((a, b)) => …`) and in `let` (`let { x, y } = r`,
`let (a, b) = p in …`). Lambda parens are load-bearing
([ADR 0083](adr/0083-lambda-paren-rule.md)): `(x) =>` is grouping (formatter writes
`x =>`); `(a, b) =>` is two arguments; `((a, b)) =>` is one tuple. Mixing them
(`f((1, 2))` on a two-arg lambda, or `f(1, 2)` on a tuple-param lambda) is a type
error that names this rule.

## Collections

Three literal forms, each a distinct type:

| Syntax | Type | Runtime |
|---|---|---|
| `[1, 2, 3]` | `[number]` (Array, eager) | JS array |
| `@{1, 2, 3}` | `List<number>` (lazy) | generator-backed pull sequence |
| `#{1, 2}` | `Set<number>` | native JS `Set` (dedupes) |
| `#{ "a": 1 }` | `Map<K, V>` | native JS `Map` |

Array / List / Set literals may splice with `...` (`[a, ...xs]`, `@{a, ...xs}`,
`#{a, ...s}` — ADR 0001). Each spread must be the **same** collection kind.
Empty `#{}` is Map; `#{k: v}` is Map; `#{a, b}` (no colons) is Set.
There is no empty-Set literal — write `Set.empty`. `List.empty` / `Map.empty`
are the named forms of `@{}` / `#{}`.

There is no overloading, so each collection carries its own qualified
namespace — `Array.*`, `List.*`, `Set.*`, `Map.*` — while the unqualified
`map`/`filter`/`reduce`/`length` are eager Array aliases (Array is the default
collection; math and structural `eq`/`show`/`compare` stay unqualified too).
Piping a List or Set into bare `map` is a type error that names the qualified
fix (`List.map`, `Set.toArray`). `List.*` transformers stay **lazy and fuse**:
nothing computes until `toArray` or a `take` pulls, so infinite sequences work
as long as you force a finite prefix. `@{}` is the lazy List literal
([ADR 0080](adr/0080-collection-literals.md)).

```mochi
let evens = iterate(x => x + 2)(0)        // INFINITE
let evens5 = evens |> take(5) |> toArray      // [0, 2, 4, 6, 8]
```

## Loops (`loop` / `recur`)

Tail recursion as an expression that emits an idiomatic JS `while` loop
(ADR 0056). `loop (name = init, …) { body }` binds its params for the body;
`recur(e, …)` in **tail position** rebinds them and continues; any other tail
value is the loop's result. No mutation surfaces — rebinding is confined to
the emitted code.

```mochi
let sum = (xs) =>
  loop (acc = 0, i = 0) {
    switch Array.get(i, xs) {
      | None => acc
      | Some(x) => recur(acc + x, i + 1)
    }
  }
```

`recur` outside a loop, outside tail position, with the wrong arity, or beyond
a lambda boundary is a check error; `recur` always targets the *nearest*
enclosing loop. For iteration purely for effect, use
`Array.forEach : (a -> unit) -> [a] -> unit` with `ignore` (ADR 0054).

## Prelude highlights

- Math ops unqualified (`add`, `mul`, `mod` = true modulo …); strings under `Str.*`.
- **Structural `eq`/`compare`/`show`** work at any type by a deep walk — the pragmatic
  bridge instead of typeclasses, keeping emitted JS free of hidden dictionaries
  ([ADR 0084](adr/0084-structural-eq.md)). That is a **guarantee**, not a placeholder:
  there is no instance registry and no plugin override. The `-By` family (`sortBy`,
  `dedupeBy`, `maxBy`, …) is the customization point — pass an explicit projection.
  Named costs: functions compare by reference (`eq(x => x, x => x)` is `false`);
  opaque host values `show` enumerable fields; a hot loop pays O(n) with no call-site
  warning. `eq`/`compare` on a lazy List throw (`List.toArray` first); `show` prints
  `<List>` without pulling. Map/Set **keys** use host identity, not deep `eq`.
- Builtin `Option` (`Some`/`None`) and `Result` (`Ok`/`Err`); `Map.get`/`Array.head`
  return `Option`. Field names match `@onrails/result`/`@onrails/maybe`, so values flow
  straight into those combinators at the JS boundary.
  `let? x = e in …` binds over **Option or Result**, dispatched from the inferred
  head constructor of `e` ([ADR 0079](adr/0079-generic-let-question-bind.md)).
  An unresolved type variable defaults to Result; a resolved `Option` head
  selects Option. A chain cannot mix the two; lift explicitly.
  `let!` is Task-only.
- Builtin `Task<A, E>` — opaque lazy async value with an error channel
  (`() => Promise<Result<A, E>>` at runtime). Not a tagged variant; not
  switchable. See [Task](#task) below.

## Task

Async without `async`/`await`. A `Task<A, E>` is an ordinary value: building one runs
no effect; `Task.run` is the only kick-off and yields a host `Promise<Result<A, E>>`.
Combinators are data-last under `Task.*` and compose with `|>`
([ADR 0005](adr/0005-prelude-task.md), [ADR 0006](adr/0006-task-result-async.md)):

| Member | Type | Role |
|---|---|---|
| `Task.of` | `A -> Task<A, E>` | pure lift |
| `Task.fail` | `E -> Task<A, E>` | error lift |
| `Task.map` | `(A -> B) -> Task<A, E> -> Task<B, E>` | map the payload |
| `Task.mapErr` | `(E -> F) -> Task<A, E> -> Task<A, F>` | map the error |
| `Task.andThen` | `(A -> Task<B, E>) -> Task<A, E> -> Task<B, E>` | sequence (v1 name; not `flatMap`) |
| `Task.recover` | `(E -> Task<A, F>) -> Task<A, E> -> Task<A, F>` | error-track bind |
| `Task.fromResult` | `Result<A, E> -> Task<A, E>` | lift a settled `Result` |
| `Task.match` | `(A -> C) -> (E -> C) -> Task<A, E> -> Task<C, F>` | fold both tracks, stays a `Task` |
| `Task.delay` | `number -> A -> Task<A, E>` | sleep then yield (`_curry`-safe) |
| `Task.run` | `Task<A, E> -> Promise<Result<A, E>>` | kick-off at the JS edge |
| `Task.all` | `[Task<A, E>] -> Task<[A], E>` | fan-out, fail-fast, input-ordered |
| `Task.race` | `[Task<A, E>] -> Task<A, E>` | first to **settle** (`Ok` or `Err`) |
| `Task.traverse` | `(A -> Task<B, E>) -> [A] -> Task<[B], E>` | `all` after `map` (`_curry`-safe) |

```mochi
let program =
  let! n = Task.of(20) |> Task.map((+ 1)) in
  let! n2 = Task.delay(10, n) in
  Task.of(n2 + n2)
export let result = Task.run(program)   // Promise<Result<number, E>> — await in the host
```

`let! x = task in …` is monadic bind over `Task` (mirrors `let?` for Option/Result);
it desugars to `Task.andThen`. Infix bind for both is deferred.

Unlike `ResultAsync`'s memoized `resolve()`, `Task.run` re-fires the underlying effect
on every call — `Task` follows the IO-action model, not the cached-Promise model (ADR
0006 decision 4). Chains stay mono-`e`: `mapErr`/`recover` swap the error type before
binding two externs with different error shapes into one chain. `examples/async/`
runs that end to end against a failing host: string failures map onto a domain
`ApiError`, a 404 is recovered, and an unreachable host still settles as `Err`.

Fan-out is [ADR 0074](adr/0074-task-fan-out.md). `Task.all` settles `Err` on the *first*
error rather than waiting for the rest, and results keep **input** order. mochi has no
cancellation, so tasks still in flight are **abandoned**: their host effects run to
completion and their results are dropped — if a failure must stop later writes, the
program has to arrange that itself. `Task.race` races *settlement*, so the first `Err`
wins as readily as the first `Ok`, and `race([])` never settles (like `Promise.race([])`).
Combining tasks needs one error type: `mapErr` first.

```mochi
// three lookups at once; one ApiError channel for all of them
let profile = ids =>
  Task.traverse(id => fetchUser(id) |> Task.mapErr(classify(id)), ids)
```

Effects stay a **convention**, not a checked effect system: domain IO is thin `extern`s
that *should* return `Task<A, E>` (see `examples/life/`); sequencing uses prelude `Task.*`.
The checker does not force that shape. Multi-arg `extern`s are `_curry`-wrapped at
emit so flat host exports `(a, b) => …` match mochi’s `f(a, b)` call convention.

## Host interop (preference order)

When binding JS/TS hosts ([ADR 0012](adr/0012-host-interop-end-state.md),
ReScript-informed):

1. **Typed `extern`** — declare an honest HM type on the seam when you can.
2. **Core literals / unions** — so prop types like `$tone: "rose" | "amber"` are
   real in infer (Wave 7), not only in generated `.d.mochi.ts`.
3. **Thin sugar plugins** — derive what a signature cannot name (e.g. CVA
   variant keys → literal unions). Assign core types; do not invent a kit
   typechecker.
4. **Heavy host generics** — approximate in HM; put `import("pkg").Type<…>` (or
   structural) honesty in outbound `.d.mochi.ts`. Opaque `: a` only when a
   precise arrow would lie (dual-arity factories).

Host kits in the docs app are **worked examples**, not language surface.
Inbound “read host `.d.ts` into HM” is not the default FFI path.

`extern` also has small JavaScript calling conventions ([ADR 0059](adr/0059-js-extern-conventions.md)).
They preserve the typed seam and emit direct JavaScript—no conversion runtime:

```mochi
extern random : () -> number = global "Math" "random"
extern map<T, U> : (T -> U) -> T -> U = "./runtime.js" "map"
extern getId : Document -> string -> Element = send "getElementById"
extern title : Document -> string = get "title"
extern setTitle : Document -> string -> () = set "title"
extern date : number -> Date = new "Date"
```

`send`, `get`, and `set` take the JS receiver as their first argument. The existing
`extern f : T = "module" "export"` form remains the module-import convention.

A signature always describes **mochi-side usage**, so `a -> (b -> c)` and `a -> b -> c`
are one type and `fmt` normalizes the parentheses away. What the *host* looks like is a
separate fact, and `curried` states it ([ADR 0064](adr/0064-curried-extern-hosts.md)):

```mochi
extern add       : number -> number -> number = "./m" "add"                // host is (a, b) => c
extern makeAdder : number -> number -> number = curried "./m" "makeAdder"  // host is a => b => c
```

Both bind a normal curried mochi function — `f(a, b)`, `f(a)(b)`, and partial application
all work either way. `curried` only changes how the host is reached: mochi adapts it with
`_curry(2, ($a0, $a1) => $makeAdder($a0)($a1))` instead of wrapping it directly. Without
it, a curried host would receive both arguments at once and never invoke its callback.

For a host class, declare an opaque foreign type and use the two-string `new`
form. It imports the constructor from the package while keeping the host value
nominal in Mochi—there is no invented Mochi representation of a `Vector3`.

```mochi
extern type Vector3
extern vector3 : number -> number -> number -> Vector3 = new "three" "Vector3"
extern setVector3 : Vector3 -> number -> number -> number -> Vector3 = send "set"
```

Opaque foreign types have no runtime output. They exist only to make incompatible
host values a type error at `extern` boundaries.

## Other surface features

Ternary `cond ? a : b` (looser than `|>` / `->`, right-associative), operator sections
`(x +)` / `(+ x)` (ADR 0000; `(- x)` stays negation), string interpolation,
`let?` / `let!` (monadic bind over `Option`|`Result` / `Task`), `///` doc comments that attach
to the following binding and surface in hover and `.d.ts`, and namespace imports
`import * as Alias from "./mod"` with qualified access / ctor patterns
`Alias.member` / `| Alias.Ctor(…)` (ADR 0002 / [0082](adr/0082-scoped-ctor-imports.md)).
A named import does not leak sibling constructors; `import * as S` does not
seed bare `| Circle` — write `| S.Circle`. Fast pipe `->` is method-call tight
(tighter than `++` / `+` / `*`); `|>` stays pipeline-loose ([ADR 0073](adr/0073-fast-pipe-precedence.md)).
