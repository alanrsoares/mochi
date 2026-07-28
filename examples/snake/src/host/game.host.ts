/**
 * Host seam for the game loop (ADR 0012 taste — real HM types where
 * practical, `snake.mochi`'s pure `State`/tuple shapes stay opaque here).
 * Timer/keyboard/localStorage access lives in the host; `App.mochi` only
 * calls these through `extern` declarations (mirrors
 * `apps/docs/src/lib/hero-slides.ts` / `startHeroTick`).
 */

/** Start the game tick, or no-op while not playing. Returns a `useEffect` cleanup. */
export const startTick = (onTick: () => void, ms: number): (() => void) => {
  const id = window.setInterval(onTick, ms);
  return () => window.clearInterval(id);
};

const KEY_MAP: Record<string, string> = {
  arrowup: "up",
  w: "up",
  arrowdown: "down",
  s: "down",
  arrowleft: "left",
  a: "left",
  arrowright: "right",
  d: "right",
  " ": "space",
  r: "restart",
};

/**
 * Normalizes keydown events to `"up" | "down" | "left" | "right" | "space" |
 * "restart"` and calls `cb` with the token — ignored while a text input has
 * focus. Returns a `useEffect` cleanup.
 */
export const onKeyDown = (cb: (key: string) => void): (() => void) => {
  const handler = (e: KeyboardEvent) => {
    const active = document.activeElement;
    if (active && active.tagName === "INPUT") return;
    const token = KEY_MAP[e.key.toLowerCase()];
    if (!token) return;
    if (token === "space") e.preventDefault();
    cb(token);
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
};

/** Random `(x, y)` (mochi tuples emit as arrays) not currently occupied by the snake. */
export const randomFood = (
  cols: number,
  rows: number,
  snake: [number, number][],
): [number, number] => {
  let candidate: [number, number] = [0, 0];
  let valid = false;
  while (!valid) {
    const rx = Math.floor(Math.random() * cols);
    const ry = Math.floor(Math.random() * rows);
    candidate = [rx, ry];
    valid = !snake.some(([sx, sy]) => sx === rx && sy === ry);
  }
  return candidate;
};

/**
 * Exported so the container can name it in an `Intent.storageSet` — the write
 * side is a declared reaction now, and only the read stays here.
 * `makeStorageInterpreter` writes `JSON.stringify(value)`, which for a number
 * is the same text `parseInt` reads back.
 */
export const HIGH_SCORE_KEY = "mochi_snake_highscore";

export const readHighScore = (): number =>
  Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10);
