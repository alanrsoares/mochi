<div align="center">

<img src="logo_mochi_kanji_vector.jpg" alt="mochi logo" width="200" />

<h1>mochi</h1>

<p><em>A small statically-typed functional language that compiles to readable JavaScript — and to strict-<code>tsc</code>-clean TypeScript.</em></p>

<a href="https://github.com/alanrsoares/mochi/actions/workflows/ci.yml"><img src="https://github.com/alanrsoares/mochi/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>

</div>

- **Types:** Hindley–Milner (Algorithm W) with row-polymorphic records and parametric variants.
- **Runtime:** compiles to plain JS; data-last prelude designed to compose under `|>`.
- **Tooling:** LSP hover + inlay hints, `.d.ts` emission, and a formatter — first-class, not bolted on.

## Quick start

```bash
bun install
bun run mochi example.mochi        # compile a file to JS on stdout
bun run check                   # lint + typecheck + tests
```

## A taste

### ADTs & Exhaustive Matching
```
type Shape =
  | Circle(number)
  | Rect(number, number)

let area = shape => switch shape {
  | Circle(r) => mul(pi, square(r))
  | Rect(w, h) => mul(w, h)
}
```

### Row-Polymorphic Records (Duck Typing)
```
// Works on any record with x and y fields, regardless of other fields
let dist = p => sqrt(add(square(p.x), square(p.y)))

let origin = { x: 3, y: 4, label: "home" }
let d = dist(origin) // 5
```

### Pipelines & Collections (Eager & Lazy)
```
// Eager arrays and curried prelude utilities in a pipe
let doubled = [1, 2, 3] |> map(x => mul(x, 2)) // [2, 4, 6]

// Lazy generator-backed pull sequences (infinite lists)
let evens = iterate(x => add(x, 2))(0)        // 0, 2, 4, 6, ...
let firstThree = evens |> take(3) |> toArray  // [0, 2, 4]
```

### Local `let ... in` Bindings
```
// Scoped, non-recursive, let-polymorphic bindings
let hypot = (a, b) =>
  let a2 = square(a) in
  let b2 = square(b) in
  sqrt(add(a2, b2))
```

### Tuples & Destructuring
```
// Product types that erase to JS arrays
let pair = (1, "hello")

// Destructure tuples via local let binding
let sumPair = p =>
  let (a, b) = p in
  add(a, b)

// Destructure tuple parameters directly
let swap = ((a, b)) => (b, a)
```

### Pattern Matching & String Interpolation
```
// Eager array pattern matching with list head/tail destructuring
let sum = xs => switch xs {
  | [] => 0
  | [head, ...tail] => add(head, sum(tail))
}

// String interpolation using the standard ${expr} syntax
let greet = name => "Hello, ${name}!"
```

See [`example.mochi`](example.mochi) for a full feature tour and [`examples/`](examples/) for
multi-file, async, and pipeline programs.

## Learn more

- [`AGENTS.md`](AGENTS.md) — build/verify commands, the compiler pipeline, conventions.
- [`CONTEXT.md`](CONTEXT.md) — the domain model and vocabulary.
- [`docs/`](docs/) — the [language](docs/language.md), the [compiler](docs/compiler.md)
  (pipeline, backends, self-hosting), and the [tooling](docs/tooling.md).
- [`docs/adr/`](docs/adr/) — architectural decision records.
