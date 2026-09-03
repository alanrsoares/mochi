import type { Stmt } from "./ast";
import type { SpanAt, Ty, TypeAt } from "./types";
import type { PErr } from "./parser";
import type { Scheme } from "./schemes";
import type { AliasInfo } from "./codegen-ts";

/**
 * Caller-supplied knobs: `open` selects open-world inference (host globals
 * resolve to fresh vars), `docs` keeps `///` comments in the emitted text, and
 * `moduleExt` is the suffix rewritten onto relative import paths — `.js` for
 * the CLI, `.mochi` for Vite, so sibling modules re-enter its plugin. Ports
 * `CompileOptions` from `src/compile/compile.ts`.
 * `strictEntry` only reaches the module-graph drivers (`module.mochi`); a
 * single file is always its own entry, so honouring the directive here would
 * make the flag mean "ignore the directive", which no caller wants.
 */
export type Opts = { open: boolean; docs: boolean; moduleExt: string; strictEntry: boolean };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Ok,
  Some,
  _Result_flatMap,
  _Str_get,
  _Str_startsWith,
  _Str_trim,
  _curry,
  _tuple,
  and,
  map,
  or,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import { lex } from "./lexer";
import { parse } from "./parser";
import { check } from "./check";
import { inferProgram, inferProgramTypes } from "./infer";
import { codegenWith, jsGenOpts } from "./codegen";
import { emitTsModuleWith } from "./codegen-ts";
import { showType } from "./types";
import { widenLits } from "./schemes";
import { builtins } from "./prelude.gen.mjs";
import { namespaces } from "./prelude.gen.mjs";
import { namespaceRuntime } from "./prelude.gen.mjs";
import { preludeJsDefs } from "./prelude.gen.mjs";
import { runtimeDeps } from "./prelude.gen.mjs";

/**
 * The default every arity-preserving entrypoint below passes: strict
 * inference, docstrings retained.
 */
export const defaultOpts: Opts = { open: false, docs: true, moduleExt: ".js", strictEntry: false };
const afterBlanks: _Curry<[s: string, i: number], Option<string>> = _curry(
  2,
  (s: string, i: number) =>
    match(_Str_get(i, s))
      .with({ _tag: "Some", value: " " }, () => afterBlanks(s, i + 1))
      .with({ _tag: "Some", value: "\t" }, () => afterBlanks(s, i + 1))
      .otherwise((other) => other),
);
/**
 * The `"use open"` file-local directive (`src/compile/open-mode.ts`). A file
 * that intentionally reaches for host globals opts itself in, so a graph can
 * mix strict modules with one adapter without an all-or-nothing caller flag.
 */
export const openDirective: (src: string) => boolean = (src: string) => {
  const t: string = _Str_trim(src);
  return and(
    _Str_startsWith('"use open"', t),
    match(afterBlanks(t, 10))
      .with({ _tag: "None" }, () => true)
      .with({ _tag: "Some", value: "\n" }, () => true)
      .with({ _tag: "Some", value: "r" }, () => true)
      .otherwise(() => false),
  );
};
/**
 * The directive wins over the caller's default; it never turns open off.
 */
export const openMode: _Curry<[src: string, requested: boolean], boolean> = _curry(
  2,
  (src: string, requested: boolean) => or(requested, openDirective(src)),
);
const typecheckWith: _Curry<[prog: Stmt[], open: boolean], Result<Stmt[], PErr>> = _curry(
  2,
  (prog: Stmt[], open: boolean) =>
    _Result_flatMap(
      ($env) => Ok(prog) as Result<Stmt[], PErr>,
      inferProgram(prog, builtins, namespaces, open),
    ),
);
const frontend: ($x: string) => Result<Stmt[], PErr> = ($x: string) =>
  _Result_flatMap(check)((($x) => _Result_flatMap(parse)(lex($x)))($x));
const pipelineWith: _Curry<[src: string, open: boolean], Result<Stmt[], PErr>> = _curry(
  2,
  (src: string, open: boolean) =>
    _Result_flatMap((stmts) => typecheckWith(stmts, open), frontend(src)),
);
/**
 * typedProgram : string -> Result (stmts, InferResult) Err — the AST *and* its
 * inference, for passes that print declarations (`dts.mochi`) rather than
 * answering span queries. `inferTypes` deliberately drops the AST.
 */
export const typedProgramWith: _Curry<
  [src: string, opts: Opts],
  Result<
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
  >
> = _curry(2, (src: string, opts: Opts) =>
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
        inferProgramTypes(stmts, builtins, namespaces, openMode(src, opts.open)),
      ),
    frontend(src),
  ),
);
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
> = (src: string) => typedProgramWith(src, defaultOpts);
/**
 * inferTypes : string -> Result InferResult Err — strict typed-query seam
 * for host DX. Keeps the recorded span -> type table instead of discarding it.
 */
export const inferTypesWith: _Curry<
  [src: string, opts: Opts],
  Result<
    {
      env: Map<string, Scheme>;
      types: { span: SpanAt; ty: Ty; display: string }[];
      aliases: Map<string, AliasInfo>;
      letParams: TypeAt[];
    },
    PErr
  >
> = _curry(2, (src: string, opts: Opts) =>
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
        inferProgramTypes(stmts, builtins, namespaces, openMode(src, opts.open)),
      ),
    frontend(src),
  ),
);
export const inferTypes: (src: string) => Result<
  {
    env: Map<string, Scheme>;
    types: { span: SpanAt; ty: Ty; display: string }[];
    aliases: Map<string, AliasInfo>;
    letParams: TypeAt[];
  },
  PErr
> = (src: string) => inferTypesWith(src, defaultOpts);
/**
 * compileWith : string -> Opts -> Result string Err
 */
export const compileWith: _Curry<[src: string, opts: Opts], Result<string, PErr>> = _curry(
  2,
  (src: string, opts: Opts) =>
    _Result_flatMap(
      (prog) =>
        Ok(
          codegenWith(
            prog,
            new Map<string, string[]>(),
            true,
            namespaceRuntime,
            preludeJsDefs,
            runtimeDeps,
            { ...jsGenOpts, docs: opts.docs, moduleExt: opts.moduleExt },
          ),
        ) as Result<string, PErr>,
      pipelineWith(src, openMode(src, opts.open)),
    ),
);
/**
 * compile : string -> Result string Err
 */
export const compile: (src: string) => Result<string, PErr> = (src: string) =>
  compileWith(src, defaultOpts);
const noImportedKeys: Map<string, string[]> = new Map<string, string[]>();
/**
 * compileTs : string -> Result string Err — the SAME railway, but the typed
 * TypeScript backend (ADR 0026 / 0090). Inference runs through
 * `inferProgramTypes` so the emitter gets the span -> type table its
 * annotation hooks are driven from, not just the final env.
 */
export const compileTsWith: _Curry<
  [src: string, runtimeImport: string, opts: Opts],
  Result<string, PErr>
> = _curry(3, (src: string, runtimeImport: string, opts: Opts) =>
  _Result_flatMap(
    (stmts) =>
      _Result_flatMap(
        (r) =>
          Ok(
            emitTsModuleWith(
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
              opts.docs,
            ),
          ) as Result<string, PErr>,
        inferProgramTypes(stmts, builtins, namespaces, openMode(src, opts.open)),
      ),
    frontend(src),
  ),
);
export const compileTs: _Curry<[src: string, runtimeImport: string], Result<string, PErr>> = _curry(
  2,
  (src: string, runtimeImport: string) => compileTsWith(src, runtimeImport, defaultOpts),
);
