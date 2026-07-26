/** The pipeline as a two-track railway: lex → parse → check → typecheck → codegen. Lex/parse fail with one Diagnostic; check/infer with Diagnostic[] (ADR 0004). Ok carries the emitted JS / typed program. */
import { err, isErr, map, ok, type Result } from "@onrails/result";
import type { Program } from "./ast";
import { check, type Registry } from "./check";
import { codegen } from "./codegen";
import { type Diagnostic, oneDiag } from "./errors";
import type { LanguagePlugin } from "./extensions";
import {
  type Env,
  type InferOptions,
  type InferResult,
  inferProgram,
  inferProgramTypes,
} from "./infer";
import { lex } from "./lexer";
import { parse } from "./parser";
import { preludeEnv, preludeNamespaces } from "./prelude";

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
  if (isErr(parsed)) return err(oneDiag(parsed.error));
  const checked = check(parsed.value);
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
};

/** Options for `toTypedProgramWith` beyond the imported context — currently just `plugins` (styled-cva, …), threaded the same way `compile`/`inferProgram` take them. */
export type TypedProgramWithOptions = { plugins?: LanguagePlugin[] };

/** Parsed Program → typed Program, with an imported context: the module-aware sibling of `toTypedProgram`. Owns the prelude-seeding invariant — `preludeEnv` + `preludeNamespaces` + open-world — that the graph drivers (`compileGraph`, `compileGraphTs`, `moduleContext`) and the LSP surfaces (`moduleDiagnostics`, `moduleHoverAt`) previously each re-assembled. */
export function toTypedProgramWith(
  prog: Program,
  ctx: ImportedContext,
  opts: TypedProgramWithOptions = {},
): Result<TypedProgram, Diagnostic[]> {
  const checked = check(prog, ctx.importedReg);
  if (isErr(checked)) return checked;
  return map(
    inferProgramTypes(checked.value, preludeEnv, {
      open: true,
      imports: ctx.imports,
      namespaces: preludeNamespaces,
      nsImports: ctx.nsImports,
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
  if (isErr(parsed)) return err(oneDiag(parsed.error));
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

export { codegenTs } from "./codegen-ts";
export { type CompileTargets, compileTargets } from "./compile-targets";
export { emitDts } from "./dts";
export type { Diagnostic } from "./errors";
export { formatError } from "./errors";
export type { HostExtension, LanguagePlugin } from "./extensions";
export { format } from "./format";
export { type HoverInfo, hoverAt } from "./hover";
export { lex } from "./lexer";
export { type MochiPluginOptions, mochiPlugin } from "./vite-plugin";
