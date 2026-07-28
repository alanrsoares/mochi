import {
  bootstrapPartyImg,
  coderMascotImg,
  compilerMagicImg,
  cosmicTypesImg,
  lspInspectorImg,
  stickersImg,
} from "./illustrations";

export type HeroSlide = {
  src: string;
  alt: string;
  kicker: string;
  title: string;
};

export const heroSlides: HeroSlide[] = [
  {
    src: coderMascotImg,
    alt: "Mochi coder mascot",
    kicker: "mascot",
    title: "At the keyboard",
  },
  {
    src: compilerMagicImg,
    alt: "Compiler Magic",
    kicker: "codegen",
    title: "AST → JS & strict TS",
  },
  {
    src: cosmicTypesImg,
    alt: "Cosmic Type System",
    kicker: "inference",
    title: "Smart type inference",
  },
  {
    src: lspInspectorImg,
    alt: "LSP Inspector",
    kicker: "lsp",
    title: "Hover & diagnostics",
  },
  {
    src: bootstrapPartyImg,
    alt: "Bootstrap Party",
    kicker: "self-host",
    title: "0 tsc --strict errors",
  },
  {
    src: stickersImg,
    alt: "Sticker sheet",
    kicker: "stickers",
    title: "Mascot sticker sheet",
  },
];

export const HERO_INTERVAL_MS = 5200;

/** Minimum horizontal travel (px) before a pointer gesture counts as a swipe. */
export const SWIPE_MIN_PX = 40;

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
