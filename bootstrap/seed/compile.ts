import type { Stmt } from "./ast";
import type { PErr } from "./parser";

export type Result<A, B> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: B };

import { _curry, Ok, _Result_flatMap } from "@mochi/compiler/runtime";

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
const typecheck: (prog: Stmt[]) => Result<Stmt[], PErr> = (prog: Stmt[]) =>
  _Result_flatMap(
    ($env) => Ok(prog) as Result<Stmt[], PErr>,
    inferProgram(prog, builtins, namespaces, false),
  );
const frontend: ($x: string) => Result<Stmt[], PErr> = ($x: string) =>
  _Result_flatMap(check)((($x) => _Result_flatMap(parse)(lex($x)))($x));
const pipeline: ($x: string) => Result<Stmt[], PErr> = ($x: string) =>
  _Result_flatMap(typecheck)(frontend($x));
export const compile: (src: string) => Result<string, PErr> = (src: string) =>
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
      ) as Result<string, PErr>,
    pipeline(src),
  );
const noImportedKeys: Map<string, string[]> = new Map<string, string[]>();
export const compileTs: {
  (src: string): (runtimeImport: string) => Result<string, PErr>;
  (src: string, runtimeImport: string): Result<string, PErr>;
} = _curry(2, (src: string, runtimeImport: string) =>
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
          ) as Result<string, PErr>,
        inferProgramTypes(stmts, builtins, namespaces, false),
      ),
    frontend(src),
  ),
);
