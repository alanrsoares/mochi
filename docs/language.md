# The mochi language

A small ML-family language: Hindley–Milner inference (Algorithm W), parametric variants,
row-polymorphic records, exhaustive pattern matching. There is no type-annotation burden —
everything below is inferred. A curried surface compiles to uncurried JS.

The single source of truth for "what compiles today" is [`../example.mochi`](../example.mochi),
which type-checks end to end. This doc summarizes it.

## Bindings and functions

```mochi
let double = x => mul(x, 2)          // lambda
let hypot = (a, b) => sqrt(add(square(a), square(b)))  // multi-arg
let pipeline = 5 |> double |> inc |> double            // left-to-right pipe
```

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
| `#{ "a": 1 }` | `Map k v` | native JS `Map` |

`Set` has no literal (`Set.fromArray([...])`). There is no overloading, so each
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

## Other surface features

Ternary `cond ? a : b` (looser than `|>`, right-associative), operator sections
`(x +)` / `(+ x)` (ADR 0000; `(- x)` stays negation), string interpolation,
`let? x = value in …` (monadic bind over `Result`), and `///` doc comments that attach
to the following binding and surface in hover and `.d.ts`.
