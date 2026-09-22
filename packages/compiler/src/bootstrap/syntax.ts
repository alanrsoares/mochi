import { loadSeed } from "./seed-path.ts";

type SeedSyntax = {
  lex: (src: string) => unknown;
  parse: (tokens: unknown) => unknown;
  parseRecovering: (tokens: unknown, plugins?: unknown) => unknown;
};

const seed = loadSeed<SeedSyntax>("syntax.bundle.cjs");

export const lex = seed.lex;
export const parse = seed.parse;
export const parseRecovering = seed.parseRecovering;
