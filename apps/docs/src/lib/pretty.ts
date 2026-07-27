/**
 * Pretty-printing for the emitted JS / TS / .d.ts the playground shows.
 *
 * The compiler's codegen optimises for being a faithful translation, not for
 * line width — a few prelude helpers come out as one very long line. That's
 * fine for a bundler and bad for a reader, so we run the output through a
 * formatter before it hits the pane.
 *
 * Biome would be the obvious choice given the rest of the repo uses it, but its
 * WebAssembly build is 37 MB (9.4 MB gzipped) — an unreasonable download for a
 * docs page. Prettier's standalone build with the TypeScript parser is ~300 KB
 * gzipped and produces the same shape for this code, so it's what ships here.
 * It's loaded lazily on first use and every failure falls back to the raw emit:
 * cosmetics must never be able to break the playground.
 */

type Formatter = (source: string) => Promise<string>;

let formatter: Promise<Formatter> | null = null;

const load = async (): Promise<Formatter> => {
  const [prettier, estree, typescript] = await Promise.all([
    import("prettier/standalone"),
    import("prettier/plugins/estree"),
    import("prettier/plugins/typescript"),
  ]);
  // The TypeScript parser handles plain JS too, so all three panes share one
  // plugin set instead of pulling in babel as well.
  return (source: string) =>
    prettier.format(source, {
      parser: "typescript",
      plugins: [estree, typescript],
      printWidth: 88,
      semi: true,
    });
};

/**
 * Formats emitted code, returning it unchanged if the formatter can't be
 * loaded or the input doesn't parse.
 */
export const pretty = async (source: string): Promise<string> => {
  if (source.trim() === "") return source;
  try {
    formatter ??= load();
    return (await (await formatter)(source)).trimEnd();
  } catch {
    return source;
  }
};
