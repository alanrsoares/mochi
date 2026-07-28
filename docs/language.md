# The mochi language

A small ML-family language: Hindley–Milner inference (Algorithm W), parametric variants,
row-polymorphic records, exhaustive pattern matching. Type annotations are optional —
everything below is inferred. A curried surface compiles to uncurried JS.

The single source of truth for "what compiles today" is [`../example.mochi`](../example.mochi),
which type-checks end to end. This doc summarizes it.

## Bindings and functions

```mochi
let double = x => mul(x, 2)          // lambda
let hypot = (a, b) => sqrt(add(square(a), square(b)))  // multi-arg
let one = () => 1                    // nullary → `() -> number` (ADR 0014)
let pipeline = 5 |> double |> inc |> double            // left-to-right pipe
```

Annotations / `extern` may write the same domain as `() -> T` (ADR 0015).

Top-level bindings are grouped into recursive components (Tarjan SCC) and inferred
together, so **mutual recursion type-checks regardless of definition order**:

```mochi
let isEven = n => switch n { | 0 => true  | _ => isOdd(sub(n, 1)) }
let isOdd  = n => switch n { | 0 => false | _ => isEven(sub(n, 1)) }
```

Local, non-recursive, let-polymorphic bindings scope to a body and chains flatten:

```mochi
let norm = (a, b) =>
  let a2 = square(a) in
  let b2 = square(b) in
  sqrt(add(a2, b2))
```

## Types

**Variants (sum types)**, optionally parametric; constructors may carry named fields:

```mochi
type Shape = | Circle(float) | Rect(float, float)
type Result a e = | Ok(value: a) | Err(error: e)
```

**Records** are transparent structural rows — no nominal identity, no runtime tag. A
named alias folds back in hover and `.d.ts`; duck typing falls out of row polymorphism:

```mochi
type Point = { x: number, y: number }
let distToOrigin = p => hypot(p.x, p.y)   // works on ANY record with x and y
let translate = (p, dx, dy) => { x: add(p.x, dx), y: add(p.y, dy) }
```

**Tuples** are real product types that erase to JS arrays. **One numeric type** (`number`);
`int`/`float` are aliases.

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
| MoveUp => ignore(store.actions.up())
| None => ()
```

## Pattern matching

`switch` is exhaustive — a missing case is a compile error, including for imported
variants. Arms match constructors, literals, wildcards, a binding catch-all, records
(shallow, may narrow on a literal field), tuples, and lists:

```mochi
let area = shape => switch shape {
  | Circle(r) => mul(pi, square(r))
  | Rect(w, h) => mul(w, h)
}

let handle = event => switch event {          // narrow on a string discriminant
  | { kind: "click", x, y } => hypot(x, y)
  | { kind: "scroll", by } => by
  | _ => zero
}

let sum = xs => switch xs {                   // [] / [head, ...tail]
  | [] => 0
  | [head, ...tail] => add(head, sum(tail))
}
```

A `when` clause adds a guard (no exhaustiveness credit). Destructuring also works in
lambda params (`({ x, y }) => …`, `((a, b)) => …`) and in `let` (`let { x, y } = r`,
`let (a, b) = p in …`).

## Collections

Three literal forms, each a distinct type:

| Syntax | Type | Runtime |
|---|---|---|
| `[1, 2, 3]` | `[number]` (Array, eager) | JS array |
| `@{1, 2, 3}` | `List number` (lazy) | generator-backed pull sequence |
| `#{1, 2}` | `Set number` | native JS `Set` (dedupes) |
| `#{ "a": 1 }` | `Map k v` | native JS `Map` |

Array / List / Set literals may splice with `...` (`[a, ...xs]`, `@{a, ...xs}`,
`#{a, ...s}` — ADR 0001). Each spread must be the **same** collection kind.
Empty `#{}` is Map; `#{k: v}` is Map; `#{a, b}` (no colons) is Set.

`Set.fromArray([...])` still works. There is no overloading, so each
collection carries its own qualified namespace — `Array.*`, `List.*`, `Set.*`, `Map.*` —
while the unqualified `map`/`filter`/`reduce`/`length` are eager Array aliases. `List.*`
transformers stay **lazy and fuse**: nothing computes until `toArray` or a `take` pulls,
so infinite sequences work as long as you force a finite prefix.

```mochi
let evens = iterate(x => add(x, 2))(0)        // INFINITE
let evens5 = evens |> take(5) |> toArray      // [0, 2, 4, 6, 8]
```

## Prelude highlights

- Math ops unqualified (`add`, `mul`, `mod` = true modulo …); strings under `Str.*`.
- **Structural `eq`/`compare`/`show`** work at any type by deep walk — the pragmatic
  bridge instead of typeclasses, keeping emitted JS free of hidden dictionaries. The
  `-By` family (`sortBy`, `dedupeBy`, …) takes an explicit projection.
- Builtin `Option` (`Some`/`None`) and `Result` (`Ok`/`Err`); `Map.get`/`Array.head`
  return `Option`. Field names match `@onrails/result`/`@onrails/maybe`, so values flow
  straight into those combinators at the JS boundary.
- Builtin `Task a e` — opaque lazy async value with an error channel
  (`() => Promise<Result<a, e>>` at runtime). Not a tagged variant; not
  switchable. See [Task](#task) below.

## Task

Async without `async`/`await`. A `Task a e` is an ordinary value: building one runs
no effect; `Task.run` is the only kick-off and yields a host `Promise (Result a e)`.
Combinators are data-last under `Task.*` and compose with `|>`
([ADR 0005](adr/0005-prelude-task.md), [ADR 0006](adr/0006-task-result-async.md)):

| Member | Type | Role |
|---|---|---|
| `Task.of` | `a -> Task a e` | pure lift |
| `Task.fail` | `e -> Task a e` | error lift |
| `Task.map` | `(a -> b) -> Task a e -> Task b e` | map the payload |
| `Task.mapErr` | `(e -> f) -> Task a e -> Task a f` | map the error |
| `Task.andThen` | `(a -> Task b e) -> Task a e -> Task b e` | sequence (v1 name; not `flatMap`) |
| `Task.recover` | `(e -> Task a f) -> Task a e -> Task a f` | error-track bind |
| `Task.fromResult` | `Result a e -> Task a e` | lift a settled `Result` |
| `Task.match` | `(a -> c) -> (e -> c) -> Task a e -> Task c f` | fold both tracks, stays a `Task` |
| `Task.delay` | `number -> a -> Task a e` | sleep then yield (`_curry`-safe) |
| `Task.run` | `Task a e -> Promise (Result a e)` | kick-off at the JS edge |

```mochi
let program =
  let! n = Task.of(20) |> Task.map((+ 1)) in
  let! n2 = Task.delay(10, n) in
  Task.of(n2 + n2)
export let result = Task.run(program)   // Promise (Result number e) — await in the host
```

`let! x = task in …` is monadic bind over `Task` (mirrors `let?` for `Result`);
it desugars to `Task.andThen`. Infix bind for both is deferred.

Unlike `ResultAsync`'s memoized `resolve()`, `Task.run` re-fires the underlying effect
on every call — `Task` follows the IO-action model, not the cached-Promise model (ADR
0006 decision 4). Chains stay mono-`e`: `mapErr`/`recover` swap the error type before
binding two externs with different error shapes into one chain. `examples/async/`
runs that end to end against a failing host: string failures map onto a domain
`ApiError`, a 404 is recovered, and an unreachable host still settles as `Err`.

Effects stay a **convention**, not a checked effect system: domain IO is thin `extern`s
that *should* return `Task _` (see `examples/life/`); sequencing uses prelude `Task.*`.
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

## Other surface features

Ternary `cond ? a : b` (looser than `|>`, right-associative), operator sections
`(x +)` / `(+ x)` (ADR 0000; `(- x)` stays negation), string interpolation,
`let?` / `let!` (monadic bind over `Result` / `Task`), `///` doc comments that attach
to the following binding and surface in hover and `.d.ts`, and namespace imports
`import * as Alias from "./mod"` with qualified access / ctor patterns
`Alias.member` / `| Alias.Ctor(…)` (ADR 0002).
