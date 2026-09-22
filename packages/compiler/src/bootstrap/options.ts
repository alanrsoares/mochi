/**
 * The knobs the self-hosted core takes: `open` selects open-world inference (a
 * file's own `"use open"` directive still wins), `runtime` inlines prelude
 * helpers, `docs` keeps `///` comments in the emitted text, and `moduleExt` is
 * the suffix rewritten onto relative import paths. Mirrors the non-plugin
 * `CompileOptions` in `../compile/compile.ts`.
 *
 * `strictEntry` is an editor policy rather than a compiler one: dependencies
 * always honour their own `"use open"`, but under it the graph entry takes
 * `open` verbatim, so a typo in a host-global-heavy file is still reported
 * (`../../dx/src/diagnostics.ts` does the same on its TypeScript path).
 */
export type BootstrapOptions = {
  open: boolean;
  runtime: boolean;
  docs: boolean;
  moduleExt: string;
  strictEntry: boolean;
};

/** Strict inference, docstrings retained, `.js` siblings, directive in charge. */
export const defaultBootstrapOptions: BootstrapOptions = {
  open: false,
  runtime: true,
  docs: true,
  moduleExt: ".js",
  strictEntry: false,
};

/** What editor queries use: the entry is judged strictly. */
export const editorBootstrapOptions: BootstrapOptions = {
  ...defaultBootstrapOptions,
  strictEntry: true,
};
