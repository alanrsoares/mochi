import type { BootstrapDiagnostic } from "@mochi/compiler/bootstrap";
import type { BootstrapPlugin } from "@mochi/compiler/bootstrap/options";
import { formatStmts, parseProgram } from "@mochi/compiler/bootstrap/syntax";
import type { Stmt } from "@mochi/compiler/bootstrap/types";
import { err, ok, type Result } from "@onrails/result";

/** A module's statements, as the bootstrap parser builds them (ADR 0109). */
export type Program = readonly Stmt[];

export type CodemodContext = { src: string; path?: string };

export type CodemodTransform = (prog: Program, ctx: CodemodContext) => Program;

export type CodemodOptions = {
  /** Host plugins, added to the builtins (JSX); `[]` turns the builtins off too. */
  plugins?: readonly BootstrapPlugin[];
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
): Result<string, BootstrapDiagnostic[]> => {
  const parsed = parseProgram(src, opts.plugins);
  if (parsed._tag === "Err") return err([parsed.error]);
  const { stmts, diagnostics } = parsed.value;
  if (opts.strict && diagnostics.length) return err([...diagnostics]);

  const ctx: CodemodContext = { src, path: opts.path };
  return ok(formatStmts(transform(stmts, ctx), src, opts.plugins));
};
