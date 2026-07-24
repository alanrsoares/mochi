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

| File | Purpose |
|---|---|
| `snake.mochi` | Pure functional state, direction queue, step tick & collision checks |
| `index.html` | HTML5 Canvas UI, Web Audio synth, particles & WS leaderboard client |
| `server.mts` | `Bun.serve` backend (auto-compilation, static server, WebSockets, REST API) |
