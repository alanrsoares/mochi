/** Color scheme: derive from system, persist override, apply `data-theme`. */

export type ColorSchemePref = "system" | "light" | "dark";
export type ResolvedScheme = "light" | "dark";

export const COLOR_SCHEME_KEY = "mochi-color-scheme";

const isPref = (v: string | null): v is ColorSchemePref =>
  v === "system" || v === "light" || v === "dark";

export const readPref = (): ColorSchemePref => {
  try {
    const raw = localStorage.getItem(COLOR_SCHEME_KEY);
    return isPref(raw) ? raw : "system";
  } catch {
    return "system";
  }
};

export const systemPrefersDark = (): boolean =>
  typeof matchMedia === "function" && matchMedia("(prefers-color-scheme: dark)").matches;

export const resolveScheme = (pref: ColorSchemePref): ResolvedScheme =>
  pref === "dark" || (pref === "system" && systemPrefersDark()) ? "dark" : "light";

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

export const cyclePref = (pref: ColorSchemePref): ColorSchemePref =>
  pref === "system" ? "light" : pref === "light" ? "dark" : "system";

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
