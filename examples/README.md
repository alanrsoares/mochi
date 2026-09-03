# Mochi Language Examples

Runnable examples demonstrating Mochi language features, compiler backends, and Bun integration.

## Quick Run

Run the scripted examples from the repository root:

```bash
bun run example              # Launch interactive CLI example router
bun run example:snake        # Build and run the Canvas Snake app
bun run example:life         # Conway's Game of Life
bun run example:async        # Async Task integration
bun run example:modules      # Multi-file module imports
bun run example:pipelines    # Pipeline operator (|>) showcase
bun run example:showcase     # Comprehensive language tour
```

## Example Directory

| Directory / File | Description |
|---|---|
| [`snake/`](./snake/) | Canvas Snake game with pure functional logic (`snake.mochi`), `Bun.serve` backend (`server.mts`), WebSockets leaderboard (`/ws`), and retro Web Audio API |
| [`cli.mochi`](./cli.mochi) | Interactive command-line example router written in Mochi |
| [`life/`](./life/) | Conway's Game of Life — `Task` animation loop; failed draws recover (skip frame) |
| [`async/`](./async/) | Asynchronous tasks, `Task` combinator pipelines, and the `Task<A, E>` error channel (`mapErr` / `recover` / `match`) |
| [`modules/`](./modules/) | Multi-file module graph resolution and exports |
| [`pipelines.mochi`](./pipelines.mochi) | Data processing pipelines using `\|>` and standard library combinators |
| [`example.mochi`](./example.mochi) | Comprehensive language showcase (variants, pattern matching, Hindley-Milner type inference, ROP) |
| [`loops.mochi`](./loops.mochi) | Tail-recursive `loop` / `recur` lowered to a JavaScript `while` loop |
| [`interop/`](./interop/) | Typed JavaScript interop: globals, properties, methods, constructors, and opaque types |
| [`qualified-types/`](./qualified-types/) | Namespace-qualified types across a module graph |
| [`jsx.mochi`](./jsx.mochi) | Builtin JSX parsing, inference, formatting, and emit |
| [`styled-cva.mochi`](./styled-cva.mochi) | Styled-CVA vendor plugin interop |

The graph examples (`async`, `life`, `modules`, and `qualified-types`) need the
`build` subcommand. For standalone source files, use
`bun run mochi <file.mochi>`; for a graph, use
`bun run mochi build <entry.mochi>`.
