// The pipeline as a two-track railway: lex → parse → check → typecheck →
// codegen. First Err short-circuits; Ok carries the emitted JS.
import { flatMap, map, pipe, type Result } from "@onrails/result";
import type { Program } from "./ast";
import { check, type Registry } from "./check";
import { codegen } from "./codegen";
import type { AlangError } from "./errors";
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

// The typed program: the parsed `Program` plus the inference result (env,
// span→type table, aliases) that tooling reads back.
export type TypedProgram = { prog: Program; res: InferResult };

// Source → typed Program: lex → parse → check → infer, first Err short-circuits.
// The single-file seam behind `codegenTs`, `emitDts`, and `hoverAt`, which
// each open-coded this exact pipe. Open-world by default so
// host globals infer; callers pass `namespaces`/`imports` when they need them.
export const toTypedProgram = (
  src: string,
  opts: InferOptions = { open: true },
): Result<TypedProgram, AlangError> =>
  pipe(
    lex(src),
    flatMap(parse),
    flatMap(check),
    flatMap((prog) => map(inferProgramTypes(prog, preludeEnv, opts), (res) => ({ prog, res }))),
  );

// What a module's imports resolve to, as this seam needs it: export SCHEMES
// (inference) and the variant REGISTRY (cross-module exhaustiveness). A
// structural subset of `module.ts`'s `ModuleContext`, so a full context passes.
export type ImportedContext = { imports: Env; importedReg: Registry };

// Parsed Program → typed Program, WITH an imported context: the module-aware
// sibling of `toTypedProgram` (0023's Seam B). Owns the prelude-seeding
// invariant — `preludeEnv` + `preludeNamespaces` + open-world — that the graph
// drivers (`compileGraph`, `compileGraphTs`, `moduleContext`) and the LSP
// surfaces (`moduleDiagnostics`, `moduleHoverAt`) previously each re-assembled.
export const toTypedProgramWith = (
  prog: Program,
  ctx: ImportedContext,
): Result<TypedProgram, AlangError> =>
  pipe(
    check(prog, ctx.importedReg),
    flatMap((p) =>
      map(
        inferProgramTypes(p, preludeEnv, {
          open: true,
          imports: ctx.imports,
          namespaces: preludeNamespaces,
        }),
        (res) => ({ prog: p, res }),
      ),
    ),
  );

// Type-check stage: run HM inference (open-world, so JS host globals are legal)
// and pass the program through unchanged on success.
const typecheck = (prog: Program): Result<Program, AlangError> =>
  map(inferProgram(prog, preludeEnv, { open: true, namespaces: preludeNamespaces }), () => prog);

// `runtime` (default on): inline the prelude builtins the program uses so the
// emitted module runs standalone. Off yields prelude-free lowering — for tests
// that supply their own prelude, or callers that bundle it separately.
export type CompileOptions = { runtime?: boolean };

export const compile = (src: string, opts: CompileOptions = {}): Result<string, AlangError> =>
  pipe(
    lex(src),
    flatMap(parse),
    flatMap(check),
    flatMap(typecheck),
    map((prog) => codegen(prog, undefined, { runtime: opts.runtime ?? true })),
  );
