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

/**
 * Forwards every keydown as a lowercased raw key — `App.mochi`'s `keyOf` owns
 * the binding table, so the only decisions left here are DOM ones: skip while a
 * text input has focus, and stop space from scrolling the page. Returns a
 * `useEffect` cleanup.
 */
export const onKeyDown = (cb: (key: string) => void): (() => void) => {
  const handler = (e: KeyboardEvent) => {
    const active = document.activeElement;
    if (active && active.tagName === "INPUT") return;
    if (e.key === " ") e.preventDefault();
    cb(e.key.toLowerCase());
  };
  window.addEventListener("keydown", handler);
  return () => window.removeEventListener("keydown", handler);
};

/**
 * Uniform choice from `xs`, or `fallback` when it is empty — the only part of
 * food placement that cannot be pure (`snake.mochi`'s `freeCells` decides
 * *which* cells are legal). Mochi tuples emit as arrays, so `a` stays opaque.
 */
export const pickRandom = <T>(fallback: T, xs: readonly T[]): T =>
  xs.length === 0 ? fallback : (xs[Math.floor(Math.random() * xs.length)] as T);

/**
 * Exported so the container can name it in an `Intent.storageSet` — the write
 * side is a declared reaction now, and only the read stays here.
 * `makeStorageInterpreter` writes `JSON.stringify(value)`, which for a number
 * is the same text `parseInt` reads back.
 */
export const HIGH_SCORE_KEY = "mochi_snake_highscore";

export const readHighScore = (): number =>
  Number.parseInt(localStorage.getItem(HIGH_SCORE_KEY) || "0", 10);
