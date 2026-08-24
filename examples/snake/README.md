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
- **Canvas Visuals**: `CanvasBoard.mochi` syncs pixels via effects; Canvas2D / rAF / particles live in `canvas.host.ts` (host APIs not yet in the surface).

## Architecture

| File / Dir | Purpose |
|---|---|
| `snake.mochi` | Pure functional game logic: direction queue, step tick & collision checks |
| `src/App.mochi` | Container + Preact UI (chrome, overlay, leaderboard) |
| `src/components/CanvasBoard.mochi` | Board component; effects call into `canvas.host` |
| `src/host/canvas.host.ts` | Canvas2D paint, eat particles, short rAF loop |
| `src/host/game.host.ts` | Timer, keyboard, localStorage, random food |
| `src/host/leaderboard.host.ts` | REST + WebSocket client |
| `server.mts` | `Bun.serve` backend (build, static, WS, REST) |
