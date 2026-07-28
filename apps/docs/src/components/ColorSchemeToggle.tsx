import { useEffect, useState } from "preact/hooks";
import {
  COLOR_SCHEME_KEY,
  type ColorSchemePref,
  cyclePref,
  readPref,
  resolveScheme,
  setPref,
} from "../lib/color-scheme";
import { Icon } from "./Icon";

const LABEL: Record<ColorSchemePref, string> = {
  system: "auto",
  light: "light",
  dark: "dark",
};

const ICON: Record<ColorSchemePref, "monitor" | "sun" | "moon"> = {
  system: "monitor",
  light: "sun",
  dark: "moon",
};

/** Cycles system → light → dark. Persists; derives from `prefers-color-scheme` when auto. */
export function ColorSchemeToggle() {
  const [pref, setPrefState] = useState<ColorSchemePref>(() => readPref());

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === COLOR_SCHEME_KEY || e.key == null) setPrefState(readPref());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const resolved = resolveScheme(pref);
  const next = cyclePref(pref);

  return (
    <button
      type="button"
      className="inline-flex size-8 items-center justify-center rounded-full border-2 border-line-strong bg-foam text-ink transition-colors hover:border-fur hover:bg-peach focus-visible:outline-2 focus-visible:outline-bao focus-visible:outline-offset-2"
      aria-label={`Color scheme ${LABEL[pref]} (showing ${resolved}). Click for ${LABEL[next]}.`}
      title={`Scheme: ${LABEL[pref]} → ${LABEL[next]}`}
      onClick={() => {
        const n = cyclePref(readPref());
        setPref(n);
        setPrefState(n);
      }}
    >
      <Icon name={ICON[pref]} className="size-3.5" />
    </button>
  );
}
