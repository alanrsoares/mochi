import {
  COLOR_SCHEME_KEY,
  type ColorSchemePref,
  cyclePref,
  isPref,
  prefIcon,
  prefLabel,
  type ResolvedScheme,
  resolveSchemeWithSystem,
} from "./color-scheme.mochi";

export {
  COLOR_SCHEME_KEY,
  type ColorSchemePref,
  cyclePref,
  prefIcon,
  prefLabel,
  type ResolvedScheme,
};

export const readPref = (): ColorSchemePref => {
  try {
    const raw = localStorage.getItem(COLOR_SCHEME_KEY);
    return raw && isPref(raw) ? (raw as ColorSchemePref) : "system";
  } catch {
    return "system";
  }
};

export const systemPrefersDark = (): boolean =>
  typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;

export const resolveScheme = (pref: ColorSchemePref): ResolvedScheme =>
  resolveSchemeWithSystem(pref, systemPrefersDark()) as ResolvedScheme;

export const applyScheme = (pref: ColorSchemePref): ResolvedScheme => {
  const resolved = resolveScheme(pref);
  const root = document.documentElement;
  root.setAttribute("data-theme", resolved);
  root.style.colorScheme = resolved;
  return resolved;
};

export const setPref = (pref: ColorSchemePref): ResolvedScheme => {
  try {
    localStorage.setItem(COLOR_SCHEME_KEY, pref);
  } catch {
    /* private mode — still apply in-session */
  }
  return applyScheme(pref);
};

export const listenStorage = (onStorage: (key: string) => void): (() => void) => {
  const handler = (e: StorageEvent) => onStorage(e.key ?? "");
  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
};

/** Apply stored pref + listen for system / cross-tab changes. Returns cleanup. */
export const initColorScheme = (): (() => void) => {
  applyScheme(readPref());

  const mq = matchMedia("(prefers-color-scheme: dark)");
  const onMq = () => {
    if (readPref() === "system") applyScheme("system");
  };
  mq.addEventListener("change", onMq);

  const onStorage = (e: StorageEvent) => {
    if (e.key === COLOR_SCHEME_KEY) applyScheme(readPref());
  };
  window.addEventListener("storage", onStorage);

  return () => {
    mq.removeEventListener("change", onMq);
    window.removeEventListener("storage", onStorage);
  };
};
