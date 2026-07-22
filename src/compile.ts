// The pipeline as a two-track railway: lex → parse → check → typecheck →
// codegen. First Err short-circuits; Ok carries the emitted JS.
import { flatMap, map, pipe, type Result } from "@onrails/result";
import type { Program } from "./ast";
import { check } from "./check";
import { codegen } from "./codegen";
import type { AlangError } from "./errors";
import { type InferOptions, type InferResult, inferProgram, inferProgramTypes } from "./infer";
import { lex } from "./lexer";
import { parse } from "./parser";
import { preludeEnv, preludeNamespaces } from "./prelude";

// The typed program: the parsed `Program` plus the inference result (env,
// span→type table, aliases) that tooling reads back.
export type TypedProgram = { prog: Program; res: InferResult };

// Source → typed Program: lex → parse → check → infer, first Err short-circuits.
// The single-file seam behind `codegenTs`, `emitDts`, `hoverAt`, and
// `inlayHints`, which each open-coded this exact pipe. Open-world by default so
// host globals infer; callers pass `namespaces`/`imports` when they need them.
// The module-aware surfaces (`moduleHoverAt`, `diagnostics`) build their own
// registry + imports first and stay with the module driver.
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
