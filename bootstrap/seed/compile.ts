import type { Stmt } from "./ast";
import type { SpanAt, Ty, TypeAt } from "./types";
import type { Scheme } from "./schemes";
import type { IErr, QualAliasInfo } from "./infer";

/**
 * Caller-supplied knobs: `open` selects open-world inference (host globals
 * resolve to fresh vars), `runtime` inlines the prelude helpers a program
 * uses, `docs` keeps `///` comments in the emitted text, and `moduleExt` is
 * the suffix rewritten onto relative import paths — `.js` for the CLI,
 * `.mochi` for Vite, so sibling modules re-enter its plugin. Ports the
 * non-plugin `CompileOptions` from `src/compile/compile.ts`.
 * `strictEntry` only reaches the module-graph drivers (`module.mochi`); a
 * single file is always its own entry, so honouring the directive here would
 * make the flag mean "ignore the directive", which no caller wants.
 */
export type Opts = {
  open: boolean;
  runtime: boolean;
  docs: boolean;
  moduleExt: string;
  strictEntry: boolean;
};
export type Suggestion = { title: string; start: number; end: number; replaceWith: string };
export type StageErr = { message: string; start: number; end: number };
export type Stamped = {
  kind: string;
  message: string;
  start: number;
  end: number;
  help: Option<string>;
  suggestions: Suggestion[];
};

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Result_flatMap,
  _Result_map,
  _Result_mapErr,
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
import { parseRecovering } from "./parser";
import { checkAll } from "./check";
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
export const defaultOpts: Opts = {
  open: false,
  runtime: true,
  docs: true,
  moduleExt: ".js",
  strictEntry: false,
};
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

const noSuggestions: Suggestion[] = [] as Suggestion[];

const stampStage: _Curry<[kind: string, e: StageErr], Stamped> = _curry(
  2,
  (kind: string, e: StageErr) => ({
    kind: kind,
    message: e.message,
    start: e.start,
    end: e.end,
    help: None as Option<string>,
    suggestions: noSuggestions,
  }),
);
const stampType: <F>(
  e: {
    suggestions: { end: number; replaceWith: string; start: number; title: string }[];
    help: Option<string>;
    end: number;
    start: number;
    message: string;
  } & F,
) => Stamped = <F>(
  e: {
    suggestions: { end: number; replaceWith: string; start: number; title: string }[];
    help: Option<string>;
    end: number;
    start: number;
    message: string;
  } & F,
) => ({
  kind: "type",
  message: e.message,
  start: e.start,
  end: e.end,
  help: e.help,
  suggestions: e.suggestions,
});
const typecheckWith: _Curry<[prog: Stmt[], open: boolean], Result<Stmt[], Stamped[]>> = _curry(
  2,
  (prog: Stmt[], open: boolean) =>
    _Result_mapErr(
      (e: IErr) => [stampType(e)],
      _Result_map((_: Map<string, Scheme>) => prog, inferProgram(prog, builtins, namespaces, open)),
    ),
);
const frontend: (src: string) => Result<Stmt[], Stamped[]> = (src: string) =>
  match(lex(src))
    .with(
      { _tag: "Err" },
      ({ error: e }) => Err([stampStage("lex", e)]) as Result<Stmt[], Stamped[]>,
    )
    .with({ _tag: "Ok" }, ({ value: tokens }) =>
      ((parsed: { stmts: Stmt[]; diagnostics: StageErr[] }) =>
        match(parsed.diagnostics)
          .with(
            (_v) => {
              const _g: any = _v;
              return _g.length === 0;
            },
            () =>
              _Result_mapErr(
                (es: StageErr[]) => map((e: StageErr) => stampStage("check", e), es),
                checkAll(parsed.stmts),
              ),
          )
          .otherwise(
            (ds) =>
              Err(map((e: StageErr) => stampStage("parse", e), ds)) as Result<Stmt[], Stamped[]>,
          ))(parseRecovering(tokens, None)),
    )
    .exhaustive();
const pipelineWith: _Curry<[src: string, open: boolean], Result<Stmt[], Stamped[]>> = _curry(
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
        aliases: Map<string, QualAliasInfo>;
        letParams: TypeAt[];
      },
    ],
    Stamped[]
  >
> = _curry(2, (src: string, opts: Opts) =>
  _Result_flatMap(
    (stmts) =>
      _Result_mapErr(
        (e: IErr) => [stampType(e)],
        _Result_map(
          (r: {
            env: Map<string, Scheme>;
            types: TypeAt[];
            aliases: Map<string, QualAliasInfo>;
            letParams: TypeAt[];
          }) => _tuple(stmts, r),
          inferProgramTypes(stmts, builtins, namespaces, openMode(src, opts.open)),
        ),
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
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
  ],
  Stamped[]
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
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    Stamped[]
  >
> = _curry(2, (src: string, opts: Opts) =>
  _Result_flatMap(
    (stmts) =>
      _Result_mapErr(
        (e: IErr) => [stampType(e)],
        _Result_map(
          (r: {
            letParams: TypeAt[];
            aliases: Map<string, QualAliasInfo>;
            types: TypeAt[];
            env: Map<string, Scheme>;
          }) => ({
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
          }),
          inferProgramTypes(stmts, builtins, namespaces, openMode(src, opts.open)),
        ),
      ),
    frontend(src),
  ),
);
export const inferTypes: (src: string) => Result<
  {
    env: Map<string, Scheme>;
    types: { span: SpanAt; ty: Ty; display: string }[];
    aliases: Map<string, QualAliasInfo>;
    letParams: TypeAt[];
  },
  Stamped[]
> = (src: string) => inferTypesWith(src, defaultOpts);
/**
 * compileWith : string -> Opts -> Result string Err
 */
export const compileWith: _Curry<[src: string, opts: Opts], Result<string, Stamped[]>> = _curry(
  2,
  (src: string, opts: Opts) =>
    _Result_map(
      (prog: Stmt[]) =>
        codegenWith(
          prog,
          new Map<string, string[]>(),
          opts.runtime,
          namespaceRuntime,
          preludeJsDefs,
          runtimeDeps,
          { ...jsGenOpts, docs: opts.docs, moduleExt: opts.moduleExt },
        ),
      pipelineWith(src, openMode(src, opts.open)),
    ),
);
/**
 * compile : string -> Result string Err
 */
export const compile: (src: string) => Result<string, Stamped[]> = (src: string) =>
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
  Result<string, Stamped[]>
> = _curry(3, (src: string, runtimeImport: string, opts: Opts) =>
  _Result_flatMap(
    (stmts) =>
      _Result_mapErr(
        (e: IErr) => [stampType(e)],
        _Result_map(
          (r: {
            env: Map<string, Scheme>;
            types: TypeAt[];
            letParams: TypeAt[];
            aliases: Map<string, QualAliasInfo>;
          }) =>
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
          inferProgramTypes(stmts, builtins, namespaces, openMode(src, opts.open)),
        ),
      ),
    frontend(src),
  ),
);
export const compileTs: _Curry<
  [src: string, runtimeImport: string],
  Result<string, Stamped[]>
> = _curry(2, (src: string, runtimeImport: string) =>
  compileTsWith(src, runtimeImport, defaultOpts),
);
