/**
 * Vite's configured base path. `import.meta.env` is a bundler intrinsic with no
 * mochi surface, so this one-line seam stays in TS and everything downstream
 * (`illustrations.mochi`, `site.tsx`) reads the resolved string.
 */
export const BASE_URL: string = import.meta.env.BASE_URL;
