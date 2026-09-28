import type { Stmt } from "../../../../bootstrap/seed/host-types";
import * as seedModule from "../../../../bootstrap/seed/syntax.bundle.mjs";
import type { BootstrapDiagnostic, BootstrapResult } from "./index.ts";
import { type BootstrapPlugin, toSeedPlugins } from "./options.ts";

type SeedSyntax = {
  lex: (src: string) => unknown;
  parse: (tokens: unknown) => unknown;
  parseWith: (tokens: unknown, plugins: unknown) => unknown;
  parseRecovering: (tokens: unknown, plugins?: unknown) => unknown;
  formatProgramWith: (stmts: unknown, src: string, formatHooks: unknown) => string;
  formatHooksFor: (pluginsOpt: unknown) => unknown;
};

// A static ESM import, not `loadSeed`: `@mochi/dx/format` runs in the browser.
const seed = seedModule as unknown as SeedSyntax;

export const lex = seed.lex;
export const parse = seed.parse;
export const parseWith = seed.parseWith;
export const parseRecovering = seed.parseRecovering;

type Lexed = { _tag: "Ok"; value: unknown } | { _tag: "Err"; error: unknown };

/** A parse that kept going: the statements it built, and what it skipped. */
export type ParsedProgram = {
  stmts: readonly Stmt[];
  diagnostics: readonly BootstrapDiagnostic[];
};

/**
 * Lex and parse with recovery (ADR 0045): the tree comes back with an `SError`
 * for every region it skipped, and a diagnostic for each. Only a lex error fails.
 */
export const parseProgram = (
  src: string,
  plugins?: readonly BootstrapPlugin[],
): BootstrapResult<ParsedProgram, BootstrapDiagnostic> => {
  const lexed = lex(src) as BootstrapResult<unknown, BootstrapDiagnostic>;
  if (lexed._tag === "Err") return lexed;
  return {
    _tag: "Ok",
    value: parseRecovering(lexed.value, toSeedPlugins(plugins)) as ParsedProgram,
  };
};

/**
 * Print statements with the bootstrap formatter. `src` is the text they were
 * parsed from: comments and `SError` regions are read back out of it by span.
 */
export const formatStmts = (
  stmts: readonly Stmt[],
  src: string,
  plugins?: readonly BootstrapPlugin[],
): string => seed.formatProgramWith(stmts, src, seed.formatHooksFor(toSeedPlugins(plugins)));

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
  const parsed = parseRecovering(lexed.value, toSeedPlugins(plugins)) as ParsedProgram;
  return formatStmts(parsed.stmts, src, plugins);
};
