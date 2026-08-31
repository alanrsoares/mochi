import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

type SeedSyntax = {
  lex: (src: string) => unknown;
  parse: (tokens: unknown) => unknown;
};

const seed = createRequire(import.meta.url)(
  fileURLToPath(new URL("../../../../bootstrap/seed/syntax.bundle.cjs", import.meta.url)),
) as SeedSyntax;

export const lex = seed.lex;
export const parse = seed.parse;
