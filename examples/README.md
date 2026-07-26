# Mochi Language Examples

Runnable examples demonstrating Mochi language features, compiler backends, and Bun integration.

## Quick Run

Run any example directly using Bun one-liner scripts:

```bash
bun example         # Launch interactive CLI example router
bun example:snake   # Canvas Snake game (Bun.serve + WebSockets)
bun example:life    # Conway's Game of Life
bun example:async   # Async & Promise integration
bun example:modules # Multi-file module imports
bun example:pipelines # Pipeline operator (|>) showcase
```

## Example Directory

| Directory / File | Description |
|---|---|
| [`snake/`](./snake/) | Canvas Snake game with pure functional logic (`snake.mochi`), `Bun.serve` backend (`server.mts`), WebSockets leaderboard (`/ws`), and retro Web Audio API |
| [`cli.mochi`](./cli.mochi) | Interactive command-line example router written in Mochi |
| [`life/`](./life/) | Conway's Game of Life cellular automaton |
| [`async/`](./async/) | Asynchronous tasks, `Task` combinator pipelines, and the `Task a e` error channel (`mapErr` / `recover` / `match`) |
| [`modules/`](./modules/) | Multi-file module graph resolution and exports |
| [`pipelines.mochi`](./pipelines.mochi) | Data processing pipelines using `\|>` and standard library combinators |
| [`example.mochi`](./example.mochi) | Comprehensive language showcase (variants, pattern matching, Hindley-Milner type inference, ROP) |
