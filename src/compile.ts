// The pipeline as a two-track railway: lex → parse → check → typecheck →
// codegen. First Err short-circuits; Ok carries the emitted JS.
import { flatMap, map, pipe, type Result } from "@onrails/result";
import type { Program } from "./ast";
import { check } from "./check";
import { codegen } from "./codegen";
import type { AlangError } from "./errors";
import { inferProgram } from "./infer";
import { lex } from "./lexer";
import { parse } from "./parser";
import { preludeEnv } from "./prelude";

// Type-check stage: run HM inference (open-world, so JS host globals are legal)
// and pass the program through unchanged on success.
const typecheck = (prog: Program): Result<Program, AlangError> =>
  map(inferProgram(prog, preludeEnv, { open: true }), () => prog);

export const compile = (src: string): Result<string, AlangError> =>
  pipe(lex(src), flatMap(parse), flatMap(check), flatMap(typecheck), map(codegen));
