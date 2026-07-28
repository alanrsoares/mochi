# Mochi UI aesthetics (from illustrations)

Source of truth: mascot plates + [`logo.png`](../logo.png) for **light**, and
[`mochi_cosmic_types.jpg`](./mochi_cosmic_types.jpg) for **dark**.
Docs (`apps/docs`) follow these tokens via `prefers-color-scheme`.

## Mood

**Cozy kawaii-tech** (light) / **cosmic kawaii-tech** (dark). Soft, rounded, warm.
Technical symbols float in pastel space or glow as constellations; success feels
rewarding (`0 errors` pills), never punishing. Approachable professional —
jargon stays, stress drops.

## Shape

| Rule | Value |
|------|--------|
| Corners | Soft always. UI: `12–20px`; badges/pills: fully round or near-round |
| Outlines | Thick, consistent (sticker / vector). Prefer `2px` borders |
| Geometry | Circles, squircles, blobs. Avoid hairline grids and sharp cards |
| Depth | Soft diffuse shadow or faint bloom — not multi-layer neon glow stacks |

## Light theme (default — mascot / cream)

| Token | oklch | Role |
|-------|-------|------|
| `--paper` | `oklch(97.1% 0.0186 75.33)` | Page ground (cream) |
| `--peach` | `oklch(94.1% 0.0229 41.41)` | Raised surfaces, hero wash |
| `--foam` | `oklch(98.5% 0.0113 71.9)` | Cards / editor chrome |
| `--ink` | `oklch(30.7% 0.0288 25.66)` | Body text (warm brown) |
| `--mute` | `oklch(55.6% 0.0418 34.89)` | Secondary text |
| `--line` | `oklch(87% 0.0289 48.37)` | Borders |
| `--fur` | `oklch(75.5% 0.1291 66.7)` | Brand accent (mascot coat) |
| `--fur-deep` | `oklch(68.2% 0.1374 62.09)` | Emphatic fur (darker on light) |
| `--plum` | `oklch(43% 0.0568 333.58)` | Outline / keywords |
| `--lavender` | `oklch(81.3% 0.0612 318.12)` | Soft accent wash |
| `--bao` | `oklch(85.1% 0.1465 88.56)` | Highlight / “餅” glow |
| `--ok` | `oklch(61.5% 0.1256 152.79)` | Success (`0 errors`) |
| `--lime` | `oklch(83.6% 0.2041 129.98)` | Sticker punch — rare |
| `--nebula` | `oklch(41.7% 0.0852 290.14)` | Contained dark inset |

## Dark theme (cosmic — `mochi_cosmic_types.jpg`)

| Token | oklch | Hex sample | Role |
|-------|-------|------------|------|
| `--paper` | `oklch(30.0% 0.0790 290.00)` | `#2e2552` | Page ground (indigo void) |
| `--peach` | `oklch(39.7% 0.0832 294.26)` | `#4a3d6f` | Raised chrome, hero wash |
| `--foam` | `oklch(43.6% 0.0786 295.41)` | `#554878` | Panels / editors |
| `--ink` | `oklch(92.8% 0.0438 66.13)` | `#fce2c9` | Body text (warm cream) |
| `--mute` | `oklch(71.5% 0.0605 299.38)` | `#a89bc4` | Secondary text (lilac) |
| `--line` | `oklch(52.0% 0.0861 293.19)` | `#6b5f96` | Borders |
| `--fur` | `oklch(78.2% 0.1198 64.48)` | `#eda761` | Brand accent |
| `--fur-deep` | `oklch(82.7% 0.1074 67.65)` | `#f5b978` | Emphatic fur (lighter on dark) |
| `--plum` | `oklch(82.5% 0.0701 345.19)` | `#e8b4d0` | Soft mauve / keywords |
| `--lavender` | `oklch(80.9% 0.0822 296.38)` | `#c5b6f0` | Soft accent wash |
| `--bao` | `oklch(94.3% 0.0189 67.60)` | `#f5eadf` | Helmet cream glow |
| `--ok` | `oklch(77.1% 0.1440 154.29)` | `#5ecf8a` | Success on dark |
| `--code-number` | `oklch(81.3% 0.0933 268.18)` | `#a8c0ff` | Cyan star accent |

**Light by default.** Cosmic is the dark theme. Docs derive from
`prefers-color-scheme` when preference is `system` (`auto`), and honor a manual
override (`light` / `dark`) via the header switch (`localStorage` key
`mochi-color-scheme`). Applied as `html[data-theme]`.

## Type

- Display / UI: rounded geometric sans (Outfit). Bold, chunky headers.
- Code: JetBrains Mono. Soft syntax — light: brown keywords on cream; dark: mauve
  keywords / fur types on foam.
- Labels: mono, wide tracking, quiet uppercase.

## Motion

Soft and slightly springy. Crossfades, gentle hover lift.
Respect `prefers-reduced-motion`. Sparkles/stars only as micro-accent.

## Do / Don't

**Do:** cream paper in light, nebula indigo in dark; thick borders; round corners;
fur CTAs; green success pills; system pref + manual theme switch.

**Don't:** force one theme only; hairline slate borders; sharp cards;
purple-on-white SaaS gradients; Inter/Roboto defaults; terminal cyberpunk with no
corgi warmth.
