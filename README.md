# alang

A small statically-typed functional language that compiles to readable JavaScript.

- **Types:** Hindley–Milner (Algorithm W) with row-polymorphic records and parametric variants.
- **Runtime:** compiles to plain JS; data-last prelude designed to compose under `|>`.
- **Tooling:** LSP hover + inlay hints, `.d.ts` emission, and a formatter — first-class, not bolted on.

## Quick start

```bash
bun install
bun run alang example.al        # compile a file to JS on stdout
bun run check                   # lint + typecheck + tests
```

## A taste

```
type Shape =
  | Circle(float)
  | Rect(float, float)

let double = x => mul(x, 2)
let pipeline = 5 |> double |> double        // 20

let area = shape => switch shape {
  | Circle(r) => mul(pi, square(r))
  | Rect(w, h) => mul(w, h)
}
```

See [`example.al`](example.al) for a full feature tour and [`examples/`](examples/) for
multi-file, async, and pipeline programs.

## Learn more

- [`AGENTS.md`](AGENTS.md) — build/verify commands, the compiler pipeline, conventions.
- [`CONTEXT.md`](CONTEXT.md) — the domain model and vocabulary.
- [`docs/adr/`](docs/adr/) — architectural decisions and open questions.
- [`docs/CRITIQUE.md`](docs/CRITIQUE.md) · [`docs/PATH_TO_BOOTSTRAP.md`](docs/PATH_TO_BOOTSTRAP.md) — design critique and the road to self-hosting.
