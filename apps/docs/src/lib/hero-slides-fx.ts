/**
 * Host effects for the hero carousel: pointer swipe bookkeeping and the
 * auto-advance timer. Slide copy and timings live in `hero-slides.mochi`; these
 * stay in TS because they touch `PointerEvent`, pointer capture, and `matchMedia`.
 */

type MutableNum = { current: number };

/**
 * Pointer swipe helpers — `clientX` + capture stay in the host.
 * Prefer pointer events over touch*: one path for finger, pen, and mouse drag.
 */
export const swipePointerDown = (start: MutableNum, e: PointerEvent): void => {
  if (!e.isPrimary || e.button !== 0) return;
  start.current = e.clientX;
  const el = e.currentTarget;
  if (el instanceof HTMLElement) {
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      // capture unsupported / already released
    }
  }
};

/** Horizontal delta since `swipePointerDown`; 0 if this isn't the primary pointer. */
export const swipePointerDx = (start: MutableNum, e: PointerEvent): number =>
  !e.isPrimary ? 0 : e.clientX - start.current;

/**
 * Start the auto-advance timer, or no-op under reduced motion.
 * Returns a cleanup for `useEffect`.
 */
export const startHeroTick = (onTick: () => void, ms: number): (() => void) => {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return () => {};
  }
  const id = window.setInterval(onTick, ms);
  return () => window.clearInterval(id);
};
