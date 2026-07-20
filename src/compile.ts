// The pipeline as a two-track railway: lex → parse → codegen.
// First Err short-circuits; Ok carries the emitted TS.
import { flatMap, map, pipe, type Result } from "@onrails/result";
import { check } from "./check";
import { codegen } from "./codegen";
import type { AlangError } from "./errors";
import { lex } from "./lexer";
import { parse } from "./parser";

export const compile = (src: string): Result<string, AlangError> =>
  pipe(lex(src), flatMap(parse), flatMap(check), map(codegen));
