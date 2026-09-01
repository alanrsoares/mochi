import type { Stmt } from "./ast";
import type { SpanAt, Ty, TypeAt } from "./types";
import type { PErr } from "./parser";
import type { Scheme } from "./schemes";
import type { AliasInfo } from "./codegen-ts";

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import { Ok, _Result_flatMap, _curry, _tuple, map } from "@mochi/compiler/runtime";

import { lex } from "./lexer";
import { parse } from "./parser";
import { check } from "./check";
import { inferProgram, inferProgramTypes } from "./infer";
import { codegen } from "./codegen";
import { emitTsModule } from "./codegen-ts";
import { showType } from "./types";
import { widenLits } from "./schemes";
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
/**
 * typedProgram : string -> Result (stmts, InferResult) Err — the AST *and* its
 * inference, for passes that print declarations (`dts.mochi`) rather than
 * answering span queries. `inferTypes` deliberately drops the AST.
 */
export const typedProgram: (src: string) => Result<
  [
    Stmt[],
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, AliasInfo>;
      letParams: TypeAt[];
    },
  ],
  PErr
> = (src: string) =>
  _Result_flatMap(
    (stmts) =>
      _Result_flatMap(
        (r) =>
          Ok(_tuple(stmts, r)) as Result<
            [
              Stmt[],
              {
                env: Map<string, Scheme>;
                types: TypeAt[];
                aliases: Map<string, AliasInfo>;
                letParams: TypeAt[];
              },
            ],
            PErr
          >,
        inferProgramTypes(stmts, builtins, namespaces, false),
      ),
    frontend(src),
  );
/**
 * inferTypes : string -> Result InferResult Err — strict typed-query seam
 * for host DX. Keeps the recorded span -> type table instead of discarding it.
 */
export const inferTypes: (src: string) => Result<
  {
    env: Map<string, Scheme>;
    types: { span: SpanAt; ty: Ty; display: string }[];
    aliases: Map<string, AliasInfo>;
    letParams: TypeAt[];
  },
  PErr
> = (src: string) =>
  _Result_flatMap(
    (stmts) =>
      _Result_flatMap(
        (r) =>
          Ok({
            env: r.env,
            types: map(
              (hit: TypeAt) => ({
                span: hit.span,
                ty: hit.ty,
                display: showType(widenLits(hit.ty)),
              }),
              r.types,
            ),
            aliases: r.aliases,
            letParams: r.letParams,
          }) as Result<
            {
              env: Map<string, Scheme>;
              types: { span: SpanAt; ty: Ty; display: string }[];
              aliases: Map<string, AliasInfo>;
              letParams: TypeAt[];
            },
            PErr
          >,
        inferProgramTypes(stmts, builtins, namespaces, false),
      ),
    frontend(src),
  );
/**
 * compile : string -> Result string Err
 */
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
/**
 * compileTs : string -> Result string Err — the SAME railway, but the typed
 * TypeScript backend (ADR 0026 / 0090). Inference runs through
 * `inferProgramTypes` so the emitter gets the span -> type table its
 * annotation hooks are driven from, not just the final env.
 */
export const compileTs: _Curry<[src: string, runtimeImport: string], Result<string, PErr>> = _curry(
  2,
  (src: string, runtimeImport: string) =>
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
