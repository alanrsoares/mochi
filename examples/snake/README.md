# Mochi Canvas Snake

A Canvas Snake game written in [Mochi](https://github.com/alanrsoares/mochi), served with real-time WebSockets and REST persistence via `Bun.serve`.

## Quick Start

```bash
bun example:snake
```

This builds the production app into `examples/snake/dist`, starts the local
game server, and serves it at `http://localhost:3000`.

## Features

- **Pure Functional Logic**: Game state, collision detection, and step logic are written in pure Mochi (`snake.mochi`).
- **re-reduced container**: `App.mochi` `defineContainer` wraps those reducers; tick/keyboard/persist/WS are effects over `store.actions`.
- **Buffered Direction Queue**: FIFO input queueing guarantees ordered handling of rapid keypresses (e.g. sharp diagonal turns) without accidental self-reversal.
- **`Bun.serve` Backend**: `server.mts` auto-compiles on boot, serves static assets, WebSockets (`/ws`) for live leaderboard sync, and score persistence (`POST /api/score`).
- **Canvas Visuals**: `CanvasBoard.mochi` owns motion and every rendered pixel; `@mochi/web/canvas` provides the Canvas2D and rAF capability boundary.

## Architecture

| File / Dir | Purpose |
|---|---|
| `snake.mochi` | Pure functional game logic: direction queue, step tick & collision checks |
| `src/App.mochi` | Container + Preact UI (chrome, overlay, leaderboard) |
| `src/components/CanvasBoard.mochi` | Board component; animation, particles, and Canvas2D drawing |
| `@mochi/web/{dom,canvas}` | Typed browser capabilities: input, storage, timers, Canvas2D, rAF |
| `src/host/leaderboard.host.ts` | REST + WebSocket client |
| `server.mts` | `Bun.serve` backend (build, static, WS, REST) |
