/** The pipeline as a two-track railway: lex → parse → check → typecheck → codegen. Lex/parse fail with one Diagnostic; check/infer with Diagnostic[] (ADR 0004). Ok carries the emitted JS / typed program. */
import { err, isErr, map, ok, type Result } from "@onrails/result";
import type { Program } from "./ast";
import { check, type Registry } from "./check";
import { codegen } from "./codegen";
import { type Diagnostic, oneDiag } from "./errors";
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
  const parsed = parse(lexed.value);
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

/** Parsed Program → typed Program, with an imported context: the module-aware sibling of `toTypedProgram`. Owns the prelude-seeding invariant — `preludeEnv` + `preludeNamespaces` + open-world — that the graph drivers (`compileGraph`, `compileGraphTs`, `moduleContext`) and the LSP surfaces (`moduleDiagnostics`, `moduleHoverAt`) previously each re-assembled. */
export function toTypedProgramWith(
  prog: Program,
  ctx: ImportedContext,
): Result<TypedProgram, Diagnostic[]> {
  const checked = check(prog, ctx.importedReg);
  if (isErr(checked)) return checked;
  return map(
    inferProgramTypes(checked.value, preludeEnv, {
      open: true,
      imports: ctx.imports,
      namespaces: preludeNamespaces,
      nsImports: ctx.nsImports,
    }),
    (res) => ({ prog: checked.value, res }),
  );
}

/** Type-check stage: run HM inference (open-world, so JS host globals are legal) and pass the program through unchanged on success. */
const typecheck = (prog: Program): Result<Program, Diagnostic[]> =>
  map(
    inferProgram(prog, preludeEnv, {
      open: true,
      namespaces: preludeNamespaces,
    }),
    () => prog,
  );

/** `runtime` (default on): inline the prelude builtins the program uses so the emitted module runs standalone. Off yields prelude-free lowering — for tests that supply their own prelude, or callers that bundle it separately. */
export type CompileOptions = { runtime?: boolean };

export function compile(src: string, opts: CompileOptions = {}): Result<string, Diagnostic[]> {
  const lexed = lex(src);
  if (isErr(lexed)) return err(oneDiag(lexed.error));
  const parsed = parse(lexed.value);
  if (isErr(parsed)) return err(oneDiag(parsed.error));
  const checked = check(parsed.value);
  if (isErr(checked)) return checked;
  const typed = typecheck(checked.value);
  if (isErr(typed)) return typed;
  return ok(codegen(typed.value, undefined, { runtime: opts.runtime ?? true }));
}
