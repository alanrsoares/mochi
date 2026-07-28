import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * GSAP scroll choreography for the about page. Owns everything imperative:
 * plate crossfade + scale drift keyed to `section.about-chapter` scroll bands,
 * and a one-shot stagger reveal of each chapter's `.about-beat` children.
 *
 * `gsap.matchMedia` splits on prefers-reduced-motion: the reduce branch swaps
 * plates instantly (content stays correct) and skips reveals entirely.
 * Returns a cleanup for `useEffect`.
 */
export const startAboutScrollFx = (): (() => void) => {
  const sections = gsap.utils.toArray<HTMLElement>("section.about-chapter");
  const plates = gsap.utils.toArray<HTMLElement>("img.about-plate");
  if (sections.length === 0) return () => {};

  const plateFor = (id: string): HTMLElement | undefined =>
    plates.find((plate) => plate.id === `plate-${id}`);

  const ctx = gsap.context(() => {
    const mm = gsap.matchMedia();
    mm.add(
      {
        reduce: "(prefers-reduced-motion: reduce)",
        animate: "(prefers-reduced-motion: no-preference)",
      },
      (mmCtx) => {
        const instant = Boolean(mmCtx.conditions?.reduce);

        gsap.set(plates, { autoAlpha: 0, scale: 1.06 });
        let current = plates[0];
        if (current) gsap.set(current, { autoAlpha: 1, scale: 1 });

        const showPlate = (next: HTMLElement | undefined) => {
          if (!next || next === current) return;
          if (instant) {
            if (current) gsap.set(current, { autoAlpha: 0 });
            gsap.set(next, { autoAlpha: 1, scale: 1 });
          } else {
            if (current)
              gsap.to(current, {
                autoAlpha: 0,
                scale: 1.06,
                duration: 0.45,
                ease: "power2.out",
                overwrite: true,
              });
            gsap.to(next, {
              autoAlpha: 1,
              scale: 1,
              duration: 0.65,
              ease: "power2.out",
              overwrite: true,
            });
          }
          current = next;
        };

        for (const section of sections) {
          ScrollTrigger.create({
            trigger: section,
            start: "top 55%",
            end: "bottom 45%",
            onToggle: (self) => {
              if (self.isActive) showPlate(plateFor(section.id));
            },
          });
          if (!instant) {
            gsap.from(section.querySelectorAll(".about-beat"), {
              y: 26,
              autoAlpha: 0,
              duration: 0.6,
              ease: "power2.out",
              stagger: 0.1,
              scrollTrigger: { trigger: section, start: "top 78%", once: true },
            });
          }
        }
      },
    );
  });

  return () => ctx.revert();
};
