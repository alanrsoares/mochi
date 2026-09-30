/** The TypeScript core's typed-program railway: lex → parse → check → infer (ADR 0004). The barrel compiles through the self-hosted core (`../bootstrap/compile.ts`); this serves the core's own emitters until #105. */
import { err, isErr, map, type Result } from "@onrails/result";
import type { Program } from "../ast/ast";
import { check, type Registry } from "../check/check";
import { type Diagnostic, oneDiag } from "../errors/errors";
import type { LanguagePlugin } from "../extensions/extensions";
import {
  type Env,
  type InferOptions,
  type InferResult,
  inferProgramTypes,
  type QualMap,
} from "../infer/infer";
import { lex } from "../lexer/lexer";
import { parse, parseRecovering } from "../parser/parser";
import { preludeEnv, preludeNamespaces } from "../prelude/prelude";
import { openMode } from "./open-mode";

/** The typed program: the parsed `Program` plus the inference result (env, span→type table, aliases) that tooling reads back. */
export type TypedProgram = { prog: Program; res: InferResult };

/** Source → typed Program: lex → parse → check → infer. Strict by default; `"use open"` or `open: true` permits host globals. */
export const toTypedProgram = (
  src: string,
  opts: InferOptions = {},
): Result<TypedProgram, Diagnostic[]> => {
  const lexed = lex(src);
  if (isErr(lexed)) return err(oneDiag(lexed.error));
  // Same `plugins` list drives parse and infer: syntax a plugin owns and the
  // typing of what it desugars to can never come from different lists.
  const parsed = parse(lexed.value, { plugins: opts.plugins });
  if (isErr(parsed)) return err(parsed.error); // already Diagnostic[] (ADR 0045)
  const checked = check(parsed.value);
  return isErr(checked)
    ? checked
    : map(
        inferProgramTypes(checked.value, preludeEnv, { ...opts, open: openMode(src, opts.open) }),
        (res) => ({
          prog: checked.value,
          res,
        }),
      );
};

/**
 * The editor's `toTypedProgram` (C9 slice e): identical, except parse errors do
 * not sink the file. `parseRecovering` yields a `Program` whose unparsable
 * regions are `error` stmts (ADR 0045) and check/infer tolerate those without
 * cascading (slice c), so the *surviving* declarations still get types. Parse
 * diagnostics are dropped here on purpose — `diagnostics` / `moduleDiagnostics`
 * is the surface that reports them; hover and completion just need the tree.
 *
 * Compilation never calls this: emitting code from a file with a hole in it
 * would be a silent lie, so `compile` keeps the hard-fail `parse`.
 */
export const toTypedProgramRecovering = (
  src: string,
  opts: InferOptions = {},
): Result<TypedProgram, Diagnostic[]> => {
  const lexed = lex(src);
  if (isErr(lexed)) return err(oneDiag(lexed.error));
  const { program } = parseRecovering(lexed.value, { plugins: opts.plugins });
  const checked = check(program);
  return isErr(checked)
    ? checked
    : map(
        inferProgramTypes(checked.value, preludeEnv, { ...opts, open: openMode(src, opts.open) }),
        (res) => ({
          prog: checked.value,
          res,
        }),
      );
};

/** What a module's imports resolve to, as this seam needs it: export SCHEMES (inference) and the variant REGISTRY (cross-module exhaustiveness). A structural subset of `module.ts`'s `ModuleContext`, so a full context passes. */
export type ImportedContext = {
  imports: Env;
  nsImports?: Map<string, Env>;
  importedReg: Registry;
  /** alias → the dep's exported TYPE scope, so `D.Shape` resolves (C5 slice b). */
  qualTypes?: QualMap;
};

/** Options for `toTypedProgramWith` beyond the imported context — `plugins` (styled-cva, …) and explicit open-world inference. */
export type TypedProgramWithOptions = { plugins?: LanguagePlugin[]; open?: boolean };

/** Parsed Program → typed Program, with an imported context: the module-aware sibling of `toTypedProgram`. */
export function toTypedProgramWith(
  prog: Program,
  ctx: ImportedContext,
  opts: TypedProgramWithOptions = {},
): Result<TypedProgram, Diagnostic[]> {
  const checked = check(prog, ctx.importedReg, ctx.qualTypes);
  return isErr(checked)
    ? checked
    : map(
        inferProgramTypes(checked.value, preludeEnv, {
          open: opts.open ?? false,
          imports: ctx.imports,
          namespaces: preludeNamespaces,
          nsImports: ctx.nsImports,
          quals: ctx.qualTypes,
          plugins: opts.plugins,
        }),
        (res) => ({ prog: checked.value, res }),
      );
}
