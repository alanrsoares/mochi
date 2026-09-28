/**
 * `mochi fmt`: the self-hosted formatter (`bootstrap/format.mochi`) behind the
 * `Result` surface the CLI, the LSP and `scripts/fmt.ts` call. Parsing recovers
 * (ADR 0045), so a file with parse errors still formats and every region it
 * skipped passes through verbatim; a lex error is the only failure.
 *
 * `plugins` are self-hosted-core plugins (ADR 0109): omitted = builtins (JSX),
 * `[]` = hard opt-out. Their `format` hooks rewrite nodes before layout.
 */

import type { BootstrapPlugin } from "@mochi/compiler/bootstrap/options";
import { formatStmts, parseProgram } from "@mochi/compiler/bootstrap/syntax";
import type { Diagnostic } from "@mochi/compiler/errors";
import { err, ok, type Result } from "@onrails/result";

export type FormatOptions = { plugins?: readonly BootstrapPlugin[] };

export const format = (src: string, opts: FormatOptions = {}): Result<string, Diagnostic[]> => {
  const parsed = parseProgram(src, opts.plugins);
  if (parsed._tag === "Err") {
    const { message, start, end } = parsed.error;
    return err([{ kind: "lex", message, span: { start, end } }]);
  }
  return ok(formatStmts(parsed.value.stmts, src, opts.plugins));
};
