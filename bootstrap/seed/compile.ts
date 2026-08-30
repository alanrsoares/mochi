import type { Stmt } from "./ast";

import type { Result, _Curry } from "@mochi/compiler/runtime";

import { Ok, _Result_flatMap, _curry } from "@mochi/compiler/runtime";

import { lex } from "./lexer";
import { parse } from "./parser";
import { check } from "./check";
import { inferProgram, inferProgramTypes } from "./infer";
import { codegen } from "./codegen";
import { emitTsModule } from "./codegen-ts";
import { builtins } from "./prelude.gen.mjs";
import { namespaces } from "./prelude.gen.mjs";
import { namespaceRuntime } from "./prelude.gen.mjs";
import { preludeJsDefs } from "./prelude.gen.mjs";
import { runtimeDeps } from "./prelude.gen.mjs";
const typecheck: (prog: Stmt[]) => Result<Stmt[], { message: string; start: number; end: number }> =
  (prog: Stmt[]) =>
    _Result_flatMap(
      ($env) => Ok(prog) as Result<Stmt[], { message: string; start: number; end: number }>,
      inferProgram(prog, builtins, namespaces, false),
    );
const frontend: ($x: string) => Result<Stmt[], { message: string; start: number; end: number }> = (
  $x: string,
) => _Result_flatMap(check)((($x) => _Result_flatMap(parse)(lex($x)))($x));
const pipeline: ($x: string) => Result<Stmt[], { message: string; start: number; end: number }> = (
  $x: string,
) => _Result_flatMap(typecheck)(frontend($x));
/**
 * compile : string -> Result string Err
 */
export const compile: (
  src: string,
) => Result<string, { message: string; start: number; end: number }> = (src: string) =>
  _Result_flatMap(
    (prog) =>
      Ok(
        codegen(
          prog,
          new Map<string, string[]>(),
          true,
          namespaceRuntime,
          preludeJsDefs,
          runtimeDeps,
        ),
      ) as Result<string, { message: string; start: number; end: number }>,
    pipeline(src),
  );
const noImportedKeys: Map<string, string[]> = new Map<string, string[]>();
/**
 * compileTs : string -> Result string Err — the SAME railway, but the typed
 * TypeScript backend (ADR 0026 / 0090). Inference runs through
 * `inferProgramTypes` so the emitter gets the span -> type table its
 * annotation hooks are driven from, not just the final env.
 */
export const compileTs: _Curry<
  [src: string, runtimeImport: string],
  Result<string, { message: string; start: number; end: number }>
> = _curry(2, (src: string, runtimeImport: string) =>
  _Result_flatMap(
    (stmts) =>
      _Result_flatMap(
        (r) =>
          Ok(
            emitTsModule(
              stmts,
              r.env,
              r.types,
              r.letParams,
              r.aliases,
              noImportedKeys,
              [] as string[],
              namespaceRuntime,
              preludeJsDefs,
              runtimeDeps,
              runtimeImport,
            ),
          ) as Result<string, { message: string; start: number; end: number }>,
        inferProgramTypes(stmts, builtins, namespaces, false),
      ),
    frontend(src),
  ),
);
