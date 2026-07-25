/**
 * TSX-only chrome (cva class factories).
 *
 * Shared site chrome that can be honest `tw.*` components lives in
 * `primitives.mochi` (GhostPillBtn, TypeHint, CarouselNav, …).
 *
 * This module keeps pieces that still need host-side `cva` boolean variants
 * (`active: true/false` — Mochi record labels cannot be `true`/`false` keywords)
 * or editor-only overlays (textarea mirror).
 */
import { cva } from "@styled-cva/react";

export const pillSelect = cva(
  "rounded-full border-2 border-line bg-foam px-3 py-1 font-mono text-ink text-xs focus:border-fur focus:outline-none",
);

export const segTab = cva(
  "rounded-full px-3 py-1 font-mono font-semibold text-2xs transition-colors",
  {
    variants: {
      active: {
        true: "bg-fur text-white",
        false: "text-mute hover:text-ink",
      },
    },
    defaultVariants: { active: false },
  },
);

export const editorMirror = cva(
  "pointer-events-none absolute inset-0 m-0 overflow-auto whitespace-pre p-4 font-mono text-ink text-xs leading-relaxed",
);

export const editorInput = cva(
  "absolute inset-0 m-0 h-full w-full resize-none overflow-auto whitespace-pre border-0 bg-transparent p-4 font-mono font-normal text-transparent text-xs leading-relaxed caret-fur-deep selection:bg-fur/30 focus:outline-none",
);

export const diagBox = cva(
  "max-h-87.5 overflow-auto whitespace-pre-wrap rounded-panel border-2 border-fur bg-fur-tint p-4 font-mono text-fur-deep text-xs",
);

export const previewPane = cva(
  "flex min-h-80 flex-1 items-center justify-center rounded-panel border-2 border-line bg-foam p-6",
);

export const emitPane = cva(
  "max-h-87.5 flex-1 overflow-auto rounded-panel border-2 border-line bg-foam p-4 font-mono text-ink text-xs leading-relaxed",
);

export const statusLabel = cva("font-bold", {
  variants: {
    ok: {
      true: "text-ok",
      false: "text-fur-deep",
    },
  },
  defaultVariants: { ok: true },
});

export const carouselDot = cva(
  "h-2 rounded-full transition-all focus-visible:outline-2 focus-visible:outline-fur focus-visible:outline-offset-2",
  {
    variants: {
      active: {
        true: "w-5 bg-fur",
        false: "w-2 bg-line-strong hover:bg-mute",
      },
    },
    defaultVariants: { active: false },
  },
);

export const carouselImg = cva(
  "hero-carousel__img absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out",
  {
    variants: {
      active: {
        true: "opacity-100",
        false: "opacity-0",
      },
    },
    defaultVariants: { active: false },
  },
);

/** Token chrome for hoverable spans. Merge token color via `cn(hoverToken(), cls)`. */
export const hoverToken = cva(
  "group relative cursor-help rounded px-0.5 underline decoration-fur/40 underline-offset-4 transition-colors hover:bg-fur-glow hover:decoration-fur-deep",
);

export const tooltipAnchor = cva(
  "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-max max-w-xs -translate-x-1/2 group-hover:block",
);

export const tooltipCard = cva(
  "block rounded-panel border-2 border-line-strong bg-foam p-2.5 font-mono text-2xs text-ink leading-tight shadow-soft",
);
