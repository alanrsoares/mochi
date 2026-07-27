/** The pipeline as a two-track railway: lex → parse → check → typecheck → codegen. Lex/parse fail with one Diagnostic; check/infer with Diagnostic[] (ADR 0004). Ok carries the emitted JS / typed program. */
import { err, isErr, map, ok, type Result } from "@onrails/result";
import type { Program } from "../ast/ast";
import { check, type Registry } from "../check/check";
import { codegen } from "../codegen/codegen";
import { type Diagnostic, oneDiag } from "../errors/errors";
import type { LanguagePlugin } from "../extensions/extensions";
import {
  type Env,
  type InferOptions,
  type InferResult,
  inferProgram,
  inferProgramTypes,
  type QualMap,
} from "../infer/infer";
import { lex } from "../lexer/lexer";
import { parse, parseRecovering } from "../parser/parser";
import { preludeEnv, preludeNamespaces } from "../prelude/prelude";

/** The typed program: the parsed `Program` plus the inference result (env, span→type table, aliases) that tooling reads back. */
export type TypedProgram = { prog: Program; res: InferResult };

/** Source → typed Program: lex → parse → check → infer. Open-world by default so host globals infer; callers pass `namespaces`/`imports` when they need them. */
export const toTypedProgram = (
  src: string,
  opts: InferOptions = { open: true },
): Result<TypedProgram, Diagnostic[]> => {
  const lexed = lex(src);
  if (isErr(lexed)) return err(oneDiag(lexed.error));
  // Same `plugins` list drives parse and infer: syntax a plugin owns and the
  // typing of what it desugars to can never come from different lists.
  const parsed = parse(lexed.value, { plugins: opts.plugins });
  if (isErr(parsed)) return err(parsed.error); // already Diagnostic[] (ADR 0045)
  const checked = check(parsed.value);
  if (isErr(checked)) return checked;
  return map(inferProgramTypes(checked.value, preludeEnv, opts), (res) => ({
    prog: checked.value,
    res,
  }));
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
  opts: InferOptions = { open: true },
): Result<TypedProgram, Diagnostic[]> => {
  const lexed = lex(src);
  if (isErr(lexed)) return err(oneDiag(lexed.error));
  const { program } = parseRecovering(lexed.value, { plugins: opts.plugins });
  const checked = check(program);
  if (isErr(checked)) return checked;
  return map(inferProgramTypes(checked.value, preludeEnv, opts), (res) => ({
    prog: checked.value,
    res,
  }));
};

/** What a module's imports resolve to, as this seam needs it: export SCHEMES (inference) and the variant REGISTRY (cross-module exhaustiveness). A structural subset of `module.ts`'s `ModuleContext`, so a full context passes. */
export type ImportedContext = {
  imports: Env;
  nsImports?: Map<string, Env>;
  importedReg: Registry;
  /** alias → the dep's exported TYPE scope, so `D.Shape` resolves (C5 slice b). */
  qualTypes?: QualMap;
};

/** Options for `toTypedProgramWith` beyond the imported context — `plugins` (styled-cva, …) and `open` (default `true` for emit; LSP diagnostics pass `false`). */
export type TypedProgramWithOptions = { plugins?: LanguagePlugin[]; open?: boolean };

/** Parsed Program → typed Program, with an imported context: the module-aware sibling of `toTypedProgram`. Owns the prelude-seeding invariant — `preludeEnv` + `preludeNamespaces` + open-world — that the graph drivers (`compileGraph`, `compileGraphTs`, `moduleContext`) and the LSP surfaces (`moduleDiagnostics`, `moduleHoverAt`) previously each re-assembled. */
export function toTypedProgramWith(
  prog: Program,
  ctx: ImportedContext,
  opts: TypedProgramWithOptions = {},
): Result<TypedProgram, Diagnostic[]> {
  const checked = check(prog, ctx.importedReg, ctx.qualTypes);
  if (isErr(checked)) return checked;
  return map(
    inferProgramTypes(checked.value, preludeEnv, {
      open: opts.open ?? true,
      imports: ctx.imports,
      namespaces: preludeNamespaces,
      nsImports: ctx.nsImports,
      quals: ctx.qualTypes,
      plugins: opts.plugins,
    }),
    (res) => ({ prog: checked.value, res }),
  );
}

/** `runtime` (default on): inline the prelude builtins the program uses so the emitted module runs standalone. Off yields prelude-free lowering — for tests that supply their own prelude, or callers that bundle it separately. `moduleExt` (default `.js`): suffix rewritten onto relative import paths — Vite uses `.mochi` so sibling modules re-enter the plugin. `plugins`: host kits (styled-cva) plus builtins (`resolvePlugins`, ADR 0011). */
export type CompileOptions = {
  runtime?: boolean;
  moduleExt?: string;
  plugins?: LanguagePlugin[];
};

export function compile(src: string, opts: CompileOptions = {}): Result<string, Diagnostic[]> {
  const lexed = lex(src);
  if (isErr(lexed)) return err(oneDiag(lexed.error));
  const parsed = parse(lexed.value, { plugins: opts.plugins });
  if (isErr(parsed)) return err(parsed.error); // already Diagnostic[] (ADR 0045)
  const checked = check(parsed.value);
  if (isErr(checked)) return checked;
  const typed = map(
    inferProgram(checked.value, preludeEnv, {
      open: true,
      namespaces: preludeNamespaces,
      plugins: opts.plugins,
    }),
    () => checked.value,
  );
  if (isErr(typed)) return typed;
  return ok(
    codegen(typed.value, undefined, {
      runtime: opts.runtime ?? true,
      moduleExt: opts.moduleExt,
    }),
  );
}

export { codegenTs } from "../codegen/codegen-ts";
export { emitDts } from "../dts/dts";
export type { Diagnostic } from "../errors/errors";
export { formatError } from "../errors/errors";
export type { HostExtension, LanguagePlugin } from "../extensions/extensions";
export { lex } from "../lexer/lexer";
export { type CompileTargets, compileTargets } from "./compile-targets";
