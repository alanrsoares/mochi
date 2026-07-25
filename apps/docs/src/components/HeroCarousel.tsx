import bootstrapPartyImg from "@mochi/root/illustrations/mochi_bootstrap_party.jpg";
import coderMascotImg from "@mochi/root/illustrations/mochi_coder_mascot.jpg";
import compilerMagicImg from "@mochi/root/illustrations/mochi_compiler_magic.jpg";
import cosmicTypesImg from "@mochi/root/illustrations/mochi_cosmic_types.jpg";
import lspInspectorImg from "@mochi/root/illustrations/mochi_lsp_inspector.jpg";
import stickersImg from "@mochi/root/illustrations/mochi_stickers.jpg";
import { useCallback, useEffect, useState } from "preact/hooks";
import { CarouselDot, CarouselImg, CarouselNav } from "../ui/primitives.mochi";

type Slide = {
  src: string;
  alt: string;
  kicker: string;
  title: string;
};

const SLIDES: Slide[] = [
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
    title: "Algorithm W + rows",
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

const INTERVAL_MS = 5200;

export function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => go(index + 1), INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [go, index, paused]);

  const slide = SLIDES[index];

  return (
    <figure
      className="hero-carousel relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="hero-carousel__frame relative aspect-4/3 overflow-hidden bg-foam">
        {SLIDES.map((s, i) => (
          <CarouselImg
            key={s.src}
            src={s.src}
            alt={s.alt}
            $active={i === index ? "on" : "off"}
            loading={i === 0 ? "eager" : "lazy"}
            decoding="async"
          />
        ))}
      </div>

      <figcaption className="mt-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="font-bold font-mono text-3xs text-fur-deep uppercase tracking-kicker">
            {slide.kicker}
          </div>
          <div className="mt-1 truncate font-display font-semibold text-ink text-lg tracking-tight">
            {slide.title}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <CarouselNav type="button" aria-label="Previous artwork" onClick={() => go(index - 1)}>
            ←
          </CarouselNav>
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Artwork slides">
            {SLIDES.map((s, i) => (
              <CarouselDot
                key={s.src}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`${s.title} (${i + 1} of ${SLIDES.length})`}
                $active={i === index ? "on" : "off"}
                onClick={() => go(i)}
              />
            ))}
          </div>
          <CarouselNav type="button" aria-label="Next artwork" onClick={() => go(index + 1)}>
            →
          </CarouselNav>
        </div>
      </figcaption>
    </figure>
  );
}
