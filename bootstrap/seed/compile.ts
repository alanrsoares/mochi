import type { Stmt } from "./ast";
import type { BinderSym, SpanAt, Ty, TypeAt } from "./types";
import type { Scheme } from "./schemes";
import type { HostPlugin, IErr, QualAliasInfo } from "./infer";
import type { Origins, SymIndex, SymPrelude } from "./symbols";

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
 * `plugins` is the host's plugin list (ADR 0109): None = builtins (JSX on),
 * Some([]) = hard opt-out, Some(ps) = builtins then `ps`.
 */
export type Opts = {
  open: boolean;
  runtime: boolean;
  docs: boolean;
  moduleExt: string;
  strictEntry: boolean;
  plugins: Option<HostPlugin[]>;
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

import { lex } from "./lexer";
import { parseRecovering } from "./parser";
import { checkAll } from "./check";
import { inferProgramWith, inferProgramTypesWith } from "./infer";
import { codegenWith, jsGenOpts } from "./codegen";
import * as Infer from "./infer";
import { emitTsModuleWith } from "./codegen-ts";
import { bindingHooksFor } from "./extensions";
import { showType } from "./types";
import { widenLits } from "./schemes";
import * as Schemes from "./schemes";
import { indexWith } from "./symbols";
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
  plugins: None as Option<HostPlugin[]>,
};
const afterBlanks: _Curry<[s: string, i: number], Option<string>> = _curry(
  2,
  (s: string, i: number) =>
    ((_v) =>
      _v._tag === "Some" && _v.value === " "
        ? afterBlanks(s, i + 1)
        : _v._tag === "Some" && _v.value === "\t"
          ? afterBlanks(s, i + 1)
          : ((other) => other)(_v))(_Str_get(i, s)),
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
    ((_v) =>
      _v._tag === "None"
        ? true
        : _v._tag === "Some" && _v.value === "\n"
          ? true
          : _v._tag === "Some" && _v.value === "r"
            ? true
            : false)(afterBlanks(t, 10)),
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
const typecheckWith: _Curry<
  [prog: Stmt[], open: boolean, plugins: Option<HostPlugin[]>],
  Result<Stmt[], Stamped[]>
> = _curry(3, (prog: Stmt[], open: boolean, plugins: Option<HostPlugin[]>) =>
  _Result_mapErr(
    (e: IErr) => [stampType(e)],
    _Result_map(
      (_: Map<string, Scheme>) => prog,
      inferProgramWith(prog, builtins, namespaces, open, plugins),
    ),
  ),
);
const frontend: _Curry<
  [src: string, plugins: Option<HostPlugin[]>],
  Result<Stmt[], Stamped[]>
> = _curry(2, (src: string, plugins: Option<HostPlugin[]>) =>
  ((_v) =>
    _v._tag === "Err"
      ? (({ error: e }) => Err([stampStage("lex", e)]) as Result<Stmt[], Stamped[]>)(_v)
      : _v._tag === "Ok"
        ? (({ value: tokens }) =>
            ((parsed: { stmts: Stmt[]; diagnostics: StageErr[] }) =>
              ((_v) =>
                _v.length === 0
                  ? _Result_mapErr(
                      (es: StageErr[]) => map((e: StageErr) => stampStage("check", e), es),
                      checkAll(parsed.stmts),
                    )
                  : ((ds) =>
                      Err(map((e: StageErr) => stampStage("parse", e), ds)) as Result<
                        Stmt[],
                        Stamped[]
                      >)(_v))(parsed.diagnostics))(parseRecovering(tokens, plugins)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(lex(src)),
);
const pipelineWith: _Curry<
  [src: string, open: boolean, plugins: Option<HostPlugin[]>],
  Result<Stmt[], Stamped[]>
> = _curry(3, (src: string, open: boolean, plugins: Option<HostPlugin[]>) =>
  _Result_flatMap((stmts) => typecheckWith(stmts, open, plugins), frontend(src, plugins)),
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
          inferProgramTypesWith(
            stmts,
            builtins,
            namespaces,
            openMode(src, opts.open),
            opts.plugins,
          ),
        ),
      ),
    frontend(src, opts.plugins),
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
const typedQuery: _Curry<
  [src: string, stmts: Stmt[], opts: Opts],
  Result<
    {
      env: Map<string, Scheme>;
      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    Stamped[]
  >
> = _curry(3, (src: string, stmts: Stmt[], opts: Opts) =>
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
            sym: hit.sym,
          }),
          r.types,
        ),
        aliases: r.aliases,
        letParams: r.letParams,
      }),
      inferProgramTypesWith(stmts, builtins, namespaces, openMode(src, opts.open), opts.plugins),
    ),
  ),
);
/**
 * inferTypes : string -> Result InferResult Err — strict typed-query seam
 * for host DX. Keeps the recorded span -> type table instead of discarding it.
 */
export const inferTypesWith: _Curry<
  [src: string, opts: Opts],
  Result<
    {
      env: Map<string, Scheme>;
      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    Stamped[]
  >
> = _curry(2, (src: string, opts: Opts) =>
  _Result_flatMap((stmts) => typedQuery(src, stmts, opts), frontend(src, opts.plugins)),
);
/**
 * The typed query over the statements a recovering parse keeps, its parse
 * diagnostics dropped (ADR 0120). Completion is most wanted mid-edit, when a
 * hole elsewhere in the buffer would fail `inferTypesWith`. Mirrors
 * src/compile.ts's `toTypedProgramRecovering`.
 */
export const inferTypesRecoveringWith: _Curry<
  [src: string, opts: Opts],
  Result<
    {
      env: Map<string, Scheme>;
      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    Stamped[]
  >
> = _curry(2, (src: string, opts: Opts) =>
  ((_v) =>
    _v._tag === "Err"
      ? (({ error: e }) =>
          Err([stampStage("lex", e)]) as Result<
            {
              env: Map<string, Scheme>;
              types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
              aliases: Map<string, QualAliasInfo>;
              letParams: TypeAt[];
            },
            Stamped[]
          >)(_v)
      : _v._tag === "Ok"
        ? (({ value: tokens }) =>
            ((parsed: { stmts: Stmt[]; diagnostics: StageErr[] }) =>
              _Result_flatMap(
                (stmts: Stmt[]) => typedQuery(src, stmts, opts),
                _Result_mapErr(
                  (es: StageErr[]) => map((e: StageErr) => stampStage("check", e), es),
                  checkAll(parsed.stmts),
                ),
              ))(parseRecovering(tokens, opts.plugins)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(lex(src)),
);
export const inferTypes: (src: string) => Result<
  {
    env: Map<string, Scheme>;
    types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
    aliases: Map<string, QualAliasInfo>;
    letParams: TypeAt[];
  },
  Stamped[]
> = (src: string) => inferTypesWith(src, defaultOpts);
/**
 * The declared type a recorded type names, for go-to-type (ADR 0119).
 */
export const nominalTypeName: _Curry<
  [ty: Ty, aliases: Map<string, QualAliasInfo>],
  Option<string>
> = _curry(2, (ty: Ty, aliases: Map<string, QualAliasInfo>) =>
  Schemes.nominalTypeName(ty, aliases),
);
/**
 * The symbol index (ADR 0118) in the synchronous bundle, which the browser
 * loads too: hover resolves a builtin reference to its prelude docstring
 * through it (#103). module.mochi's `symbolIndex` is the same query.
 */
export const symbolIndexSync: _Curry<
  [path: string, origins: Origins, prelude: SymPrelude, stmts: Stmt[]],
  SymIndex
> = _curry(4, (path: string, origins: Origins, prelude: SymPrelude, stmts: Stmt[]) =>
  indexWith(path, origins, prelude, stmts),
);
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
      pipelineWith(src, openMode(src, opts.open), opts.plugins),
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
              bindingHooksFor(opts.plugins),
            ),
          inferProgramTypesWith(
            stmts,
            builtins,
            namespaces,
            openMode(src, opts.open),
            opts.plugins,
          ),
        ),
      ),
    frontend(src, opts.plugins),
  ),
);
export const compileTs: _Curry<
  [src: string, runtimeImport: string],
  Result<string, Stamped[]>
> = _curry(2, (src: string, runtimeImport: string) =>
  compileTsWith(src, runtimeImport, defaultOpts),
);
