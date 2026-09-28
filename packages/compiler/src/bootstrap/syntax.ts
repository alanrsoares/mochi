import { type BootstrapPlugin, toSeedPlugins } from "./options.ts";
import { loadSeed } from "./seed-path.ts";

type SeedSyntax = {
  lex: (src: string) => unknown;
  parse: (tokens: unknown) => unknown;
  parseWith: (tokens: unknown, plugins: unknown) => unknown;
  parseRecovering: (tokens: unknown, plugins?: unknown) => unknown;
  formatProgramWith: (stmts: unknown, src: string, formatHooks: unknown) => string;
  formatHooksFor: (pluginsOpt: unknown) => unknown;
};

const seed = loadSeed<SeedSyntax>("syntax.bundle.cjs");

export const lex = seed.lex;
export const parse = seed.parse;
export const parseWith = seed.parseWith;
export const parseRecovering = seed.parseRecovering;

type Lexed = { _tag: "Ok"; value: unknown } | { _tag: "Err"; error: unknown };

/**
 * `mochi fmt` over the bootstrap printer. The recovering parse never fails, so
 * a lex error is the only way to get `null`. Plugins parse, and their `format`
 * hooks may rewrite nodes before layout (ADR 0109).
 */
export const formatBootstrap = (
  src: string,
  plugins?: readonly BootstrapPlugin[],
): string | null => {
  const lexed = lex(src) as Lexed;
  if (lexed._tag === "Err") return null;
  const pluginsOpt = toSeedPlugins(plugins);
  const parsed = parseRecovering(lexed.value, pluginsOpt) as { stmts: unknown };
  return seed.formatProgramWith(parsed.stmts, src, seed.formatHooksFor(pluginsOpt));
};
