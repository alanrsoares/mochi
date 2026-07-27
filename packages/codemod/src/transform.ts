import type { Program } from "@mochi/compiler/ast";
import { type Diagnostic, oneDiag } from "@mochi/compiler/errors";
import { lex } from "@mochi/compiler/lexer";
import { parse, parseRecovering } from "@mochi/compiler/parser";
import { type FormatOptions, formatProgram } from "@mochi/dx/format";
import { err, isErr, ok, type Result } from "@onrails/result";

export type CodemodContext = { src: string; path?: string };

export type CodemodTransform = (prog: Program, ctx: CodemodContext) => Program;

export type CodemodOptions = FormatOptions & {
  /** Source path (passed through to transform context). */
  path?: string;
  /** Fail when parse recovery reports diagnostics (default false). */
  strict?: boolean;
};

/** Parse → transform → format. Uses parse recovery by default (like `format`). */
export const transformSource = (
  src: string,
  transform: CodemodTransform,
  opts: CodemodOptions = {},
): Result<string, Diagnostic[]> => {
  const lexed = lex(src);
  if (isErr(lexed)) return err(oneDiag(lexed.error));

  const ctx: CodemodContext = { src, path: opts.path };
  if (opts.strict) {
    const parsed = parse(lexed.value, { plugins: opts.plugins });
    if (isErr(parsed)) return parsed;
    return ok(formatProgram(transform(parsed.value, ctx), src, opts));
  }

  const recovered = parseRecovering(lexed.value, { plugins: opts.plugins });
  return ok(formatProgram(transform(recovered.program, ctx), src, opts));
};
