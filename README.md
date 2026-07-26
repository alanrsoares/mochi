<div align="center">

<img src="illustrations/mochi_coder_mascot.jpg" alt="mochi mascot at the keyboard" width="720" />

<h1>mochi</h1>

<p><em>An ML-family language for the JS world — inferred types, readable output, strict TypeScript when you want it.</em></p>

<a href="https://github.com/alanrsoares/mochi/actions/workflows/ci.yml"><img src="https://github.com/alanrsoares/mochi/actions/workflows/ci.yml/badge.svg" alt="CI status" /></a>

</div>

**mochi** is a small statically-typed functional language: Hindley–Milner inference (Algorithm W), parametric variants, row-polymorphic records, and exhaustive `switch`. You write curried, data-last code; the compiler emits plain JavaScript you can read, or TypeScript that typechecks under `tsc --strict`. Both backends share one AST and one codegen.

Day-to-day code needs no type annotations. The LSP (hover), `.d.ts` generation, and formatter are driven from the compiler itself. The compiler is also self-hosted: the mochi implementation of itself emits TypeScript with 0 `tsc --strict` errors, checked in CI.

<div align="center">
<img src="illustrations/mochi_compiler_magic.jpg" alt="mochi compiling to JS and TS with zero errors" width="560" />
</div>

- **Types:** Algorithm W with open/closed rows and parametric variants; records are structural, matching is exhaustive.
- **Runtime:** plain JS; the prelude is curried and data-last, so it composes under `|>`.
- **Tooling:** LSP, `.d.ts`, and formatter, all driven from the compiler's own passes.

## Quick start

```bash
bun install
bun run mochi example.mochi        # compile a file to JS on stdout
bun run check                   # lint + typecheck + tests (local default)
bun run check:full              # + self-host north-stars (CI / pre-push)
```

## A taste

### ADTs & Exhaustive Matching
```reason
type Shape =
  | Circle(number)
  | Rect(number, number)

let area = shape => switch shape {
  | Circle(r) => mul(pi, square(r))
  | Rect(w, h) => mul(w, h)
}
```

### Row-Polymorphic Records (Duck Typing)
```reason
// Works on any record with x and y fields, regardless of other fields
let dist = p => sqrt(add(square(p.x), square(p.y)))

let origin = { x: 3, y: 4, label: "home" }
let d = dist(origin) // 5
```

### Pipelines & Collections (Eager & Lazy)
```reason
// Eager arrays and curried prelude utilities in a pipe
let doubled = [1, 2, 3] |> map(x => mul(x, 2)) // [2, 4, 6]

// Lazy generator-backed pull sequences (infinite lists)
let evens = iterate(x => add(x, 2))(0)        // 0, 2, 4, 6, ...
let firstThree = evens |> take(3) |> toArray  // [0, 2, 4]
```

### Local `let ... in` Bindings
```reason
// Scoped, non-recursive, let-polymorphic bindings
let hypot = (a, b) =>
  let a2 = square(a) in
  let b2 = square(b) in
  sqrt(add(a2, b2))
```

### Tuples & Destructuring
```reason
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
```reason
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
