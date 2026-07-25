# Mochi UI aesthetics (from illustrations)

Source of truth: the mascot sheet in this directory + [`logo.png`](../logo.png).
Docs (`apps/docs`) should follow these tokens — do not invent a colder “compiler dark” look that fights the art.

## Mood

**Cozy kawaii-tech.** Soft, rounded, warm. Technical symbols float inside pastel space;
success feels rewarding (`0 errors` pills), never punishing. Approachable professional —
jargon stays, stress drops.

## Shape

| Rule | Value |
|------|--------|
| Corners | Soft always. UI: `12–20px`; badges/pills: fully round or near-round |
| Outlines | Thick, consistent (sticker / vector). Prefer `2px` borders in warm plum-brown |
| Geometry | Circles, squircles, blobs. Avoid hairline grids and sharp cards |
| Depth | Soft diffuse shadow or faint bloom — not multi-layer neon glow stacks |

## Color (sampled)

| Token | Hex | Role |
|-------|-----|------|
| `--paper` | `#fdf4e8` | Page ground (cream) |
| `--peach` | `#fae7e0` | Raised surfaces, hero wash |
| `--foam` | `#fff9f2` | Cards / editor chrome |
| `--ink` | `#3d2a28` | Body text (warm brown, not black) |
| `--mute` | `#8a6b63` | Secondary text |
| `--line` | `#e5cfc4` | Borders |
| `--fur` | `#e69e4d` | Brand accent (mascot coat) |
| `--plum` | `#63445d` | Outline / strong accent (logo leaves) |
| `--lavender` | `#d3b6dc` | Soft accent wash |
| `--bao` | `#f5c84c` | Highlight / “餅” glow |
| `--ok` | `#3d9a5f` | Success (`0 errors`) |
| `--lime` | `#9ce239` | Sticker punch — rare, festive only |
| `--nebula` | `#4c4377` | Cosmic panel / code night (syntax dark exception) |

**Light by default.** Most plates are peach/cream. Cosmic violet is a *scene*, not the chrome.
Code panels may use cream editors (LSP plate) or a contained nebula inset — never paint the whole site pure black.

## Type

- Display / UI: rounded geometric sans (Outfit). Bold, chunky headers.
- Code: JetBrains Mono (or equal). Soft syntax colors on cream — brown keywords, muted blue types, coral strings — not acid neon on void.
- Labels: mono, wide tracking, sentence or quiet uppercase — never shouting industrial ALL CAPS walls.

## Motion

Soft and slightly springy (mascot is squishy). Crossfades, gentle hover lift.
Respect `prefers-reduced-motion`. Sparkles/stars only as micro-accent, not wallpaper.

## Do / Don't

**Do:** peach paper, thick warm borders, round corners, mascot-led hero, green success pills, lavender/peach washes.

**Don't:** cold near-black shells, hairline slate borders, sharp cards, purple-on-white SaaS gradients, Inter/Roboto defaults, “terminal cyberpunk” chrome that ignores the corgi.
