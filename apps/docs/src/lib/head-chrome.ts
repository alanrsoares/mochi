/**
 * Shared `<head>` chrome for the three MPA entry pages, injected by the
 * `docs-head-chrome` Vite plugin (see `vite.config.ts`) in place of the
 * `<!-- head-chrome -->` marker. One definition instead of three hand-copied
 * HTML blocks — the pre-paint theme script is generated here so the storage
 * key can never drift from `color-scheme.ts`.
 *
 * Node-safe: imported by the Vite config, so nothing here touches the DOM at
 * module scope.
 */
import { COLOR_SCHEME_KEY } from "./color-scheme.ts";

/** Mirrors `--color-paper` (light/dark) from `index.css` `@theme` — browser UI chrome needs hex. */
export const themeColors = { light: "#fdf4e8", dark: "#2e2552" } as const;

/**
 * Pre-paint FOUC guard: resolve the stored pref (or system) and stamp
 * `data-theme` before first paint. Inline re-implementation of
 * `readPref`/`resolveScheme`/`applyScheme` — it must run before any module
 * loads, so it cannot import them; the storage key is shared instead.
 */
const colorSchemeBootstrap = `(() => {
        const key = ${JSON.stringify(COLOR_SCHEME_KEY)};
        let pref = "system";
        try {
          const raw = localStorage.getItem(key);
          if (raw === "light" || raw === "dark" || raw === "system") pref = raw;
        } catch {}
        const dark =
          pref === "dark" ||
          (pref === "system" &&
            matchMedia("(prefers-color-scheme: dark)").matches);
        const theme = dark ? "dark" : "light";
        document.documentElement.setAttribute("data-theme", theme);
        document.documentElement.style.colorScheme = theme;
      })();`;

export const headChromeHtml = `<meta name="theme-color" media="(prefers-color-scheme: light)" content="${themeColors.light}" />
    <meta name="theme-color" media="(prefers-color-scheme: dark)" content="${themeColors.dark}" />
    <link rel="icon" type="image/png" href="/logo.png" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@400;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <script>
      ${colorSchemeBootstrap}
    </script>`;
