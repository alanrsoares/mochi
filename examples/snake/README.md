# Mochi Canvas Snake

A Canvas Snake game written in [Mochi](https://github.com/alanrsoares/mochi), served with real-time WebSockets and REST persistence via `Bun.serve`.

## Quick Start

```bash
bun example:snake
```

Open `http://localhost:3000` in your browser.

## Features

- **Pure Functional Logic**: Game state, collision detection, and step logic are written in pure Mochi (`snake.mochi`).
- **Buffered Direction Queue**: FIFO input queueing guarantees ordered handling of rapid keypresses (e.g. sharp diagonal turns) without accidental self-reversal.
- **`Bun.serve` Backend**: `server.mts` auto-compiles `snake.mochi` on boot, serves static assets, provides WebSockets (`/ws`) for live leaderboard sync across browser windows, and handles score persistence (`POST /api/score`).
- **Canvas Visuals & Sound**: Smooth outer corner curvature, directional head eyes, particle explosion FX, and a Web Audio API synthesizer.

## Architecture

| File / Dir | Purpose |
|---|---|
| `snake.mochi` | Pure functional game logic: direction queue, step tick & collision checks |
| `src/App.mochi` | Full Mochi + Preact + styled-cva UI component |
| `src/host/` | Host TS/TSX seams: canvas rendering (`widgets.host.tsx`), audio/keyboard (`game.host.ts`), WS/REST client (`leaderboard.host.ts`) |
| `server.mts` | `Bun.serve` backend (auto-builds dist, serves static app, handles WebSockets & REST API) |
