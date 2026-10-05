import type { Stmt } from "../ast/ast";
import type { BinderSym, SpanAt, Ty, TypeAt } from "../infer/types";
import type { AliasInfo, Scheme } from "../infer/schemes";
import type { HostPlugin, IErr, Suggestion } from "../infer/infer";
import type { Origins, SymIndex, SymPrelude } from "../check/symbols";

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
  dtsTypeNames: Map<string, string>;
};
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
  _Map_get,
  _Map_keys,
  _Option_flatMap,
  _Option_map,
  _Option_match,
  _Option_unwrapOr,
  _Result_flatMap,
  _Result_map,
  _Result_mapErr,
  _Result_match,
  _Str_get,
  _Str_startsWith,
  _Str_trim,
  _curry,
  _keyOf,
  _tuple,
  and,
  eq,
  map,
  or,
  reduce,
} from "@mochi/compiler/runtime";

import { lex } from "../lexer/lexer";
import { parseRecovering } from "../parser/parser";
import { checkAll } from "../check/check";
import { inferProgramWith, inferProgramTypesWith } from "../infer/infer";
import { codegenWith, jsGenOpts } from "../codegen/codegen";
import * as Infer from "../infer/infer";
import { emitTsModuleWith, flatHostType } from "../codegen/typescript";
import { bindingHooksFor } from "../extensions/extensions";
import { showType } from "../infer/types";
import { widenLits } from "../infer/schemes";
import * as Schemes from "../infer/schemes";
import { indexWith } from "../check/symbols";
import { builtins } from "../prelude/prelude.gen.mjs";
import { namespaces } from "../prelude/prelude.gen.mjs";
import { namespaceRuntime } from "../prelude/prelude.gen.mjs";
import { preludeJsDefs } from "../prelude/prelude.gen.mjs";
import { runtimeDeps } from "../prelude/prelude.gen.mjs";
const runtimeAnnotation$ = (name: string, arity: number): Option<string> => {
  const ty: Option<Ty> = _Option_match(
    _Map_get(name, builtins),
    () =>
      reduce(
        _curry(2, (found, ns: string) => {
          const members: Map<string, string> = _Option_unwrapOr(
            new Map<string, string>(),
            _Map_get(ns, namespaceRuntime),
          );
          return reduce(
            _curry(2, (acc, key: string) =>
              eq(_Map_get(key, members), Some(name) as Option<string>)
                ? _Option_flatMap(_Map_get(key), _Map_get(ns, namespaces))
                : acc,
            ),
            found,
            _Map_keys(members),
          );
        }),
        None,
        _Map_keys(namespaceRuntime),
      ),
    (t) => Some(t),
  );
  return _Option_map((t: Ty) => flatHostType(t, arity), ty);
};
/**
 * Runtime annotation from the same prelude signatures and printer as host FFI.
 */
export const runtimeAnnotation: _Curry<[name: string, arity: number], Option<string>> = _curry(
  2,
  runtimeAnnotation$,
);

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
  dtsTypeNames: new Map<string, string>(),
};
const afterBlanks$ = (s: string, i: number): Option<string> =>
  ((_v) =>
    _v._tag === "Some" && _v.value === " "
      ? afterBlanks$(s, i + 1)
      : _v._tag === "Some" && _v.value === "\t"
        ? afterBlanks$(s, i + 1)
        : ((other) => other)(_v))(_Str_get(i, s));
const afterBlanks: _Curry<[s: string, i: number], Option<string>> = _curry(2, afterBlanks$);
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
            : false)(afterBlanks$(t, 10)),
  );
};
const openMode$ = (src: string, requested: boolean): boolean => or(requested, openDirective(src));
/**
 * The directive wins over the caller's default; it never turns open off.
 */
export const openMode: _Curry<[src: string, requested: boolean], boolean> = _curry(2, openMode$);
const noSuggestions: Suggestion[] = [] as Suggestion[];

const stampStage$ = (kind: string, e: StageErr): Stamped => ({
  kind: kind,
  message: e.message,
  start: e.start,
  end: e.end,
  help: None as Option<string>,
  suggestions: noSuggestions,
});
const stampStage: _Curry<[kind: string, e: StageErr], Stamped> = _curry(2, stampStage$);
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
const typecheckWith$ = (
  prog: Stmt[],
  open: boolean,
  plugins: Option<HostPlugin[]>,
): Result<Stmt[], Stamped[]> =>
  _Result_mapErr(
    (es: IErr[]) => map(stampType, es),
    _Result_map(
      (_: Map<string, Scheme>) => prog,
      inferProgramWith(prog, builtins, namespaces, open, plugins),
    ),
  );
const typecheckWith: _Curry<
  [prog: Stmt[], open: boolean, plugins: Option<HostPlugin[]>],
  Result<Stmt[], Stamped[]>
> = _curry(3, typecheckWith$);
const frontend$ = (src: string, plugins: Option<HostPlugin[]>): Result<Stmt[], Stamped[]> =>
  _Result_match(
    lex(src),
    (e) => Err([stampStage$("lex", e)]) as Result<Stmt[], Stamped[]>,
    (tokens) => {
      const parsed: { stmts: Stmt[]; diagnostics: StageErr[] } = parseRecovering(tokens, plugins);
      return ((_v) =>
        _v.length === 0
          ? _Result_mapErr(
              (es: StageErr[]) => map((e: StageErr) => stampStage$("check", e), es),
              checkAll(parsed.stmts),
            )
          : ((ds) =>
              Err(map((e: StageErr) => stampStage$("parse", e), ds)) as Result<Stmt[], Stamped[]>)(
              _v,
            ))(parsed.diagnostics);
    },
  );
const frontend: _Curry<
  [src: string, plugins: Option<HostPlugin[]>],
  Result<Stmt[], Stamped[]>
> = _curry(2, frontend$);
const pipelineWith$ = (
  src: string,
  open: boolean,
  plugins: Option<HostPlugin[]>,
): Result<Stmt[], Stamped[]> =>
  _Result_flatMap((stmts) => typecheckWith$(stmts, open, plugins), frontend$(src, plugins));
const pipelineWith: _Curry<
  [src: string, open: boolean, plugins: Option<HostPlugin[]>],
  Result<Stmt[], Stamped[]>
> = _curry(3, pipelineWith$);
const typedProgramWith$ = (
  src: string,
  opts: Opts,
): Result<
  [
    Stmt[],
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, AliasInfo>;
      letParams: TypeAt[];
    },
  ],
  Stamped[]
> =>
  _Result_flatMap(
    (stmts) =>
      _Result_mapErr(
        (es: IErr[]) => map(stampType, es),
        _Result_map(
          (r: {
            env: Map<string, Scheme>;
            types: TypeAt[];
            aliases: Map<string, AliasInfo>;
            letParams: TypeAt[];
          }) => _tuple(stmts, r),
          inferProgramTypesWith(
            stmts,
            builtins,
            namespaces,
            openMode$(src, opts.open),
            opts.plugins,
          ),
        ),
      ),
    frontend$(src, opts.plugins),
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
    Stamped[]
  >
> = _curry(2, typedProgramWith$);
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
  Stamped[]
> = (src: string) => typedProgramWith$(src, defaultOpts);
const typedQuery$ = (
  src: string,
  stmts: Stmt[],
  opts: Opts,
): Result<
  {
    env: Map<string, Scheme>;
    types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
    aliases: Map<string, AliasInfo>;
    letParams: TypeAt[];
  },
  Stamped[]
> =>
  _Result_mapErr(
    (es: IErr[]) => map(stampType, es),
    _Result_map(
      (r: {
        letParams: TypeAt[];
        aliases: Map<string, AliasInfo>;
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
      inferProgramTypesWith(stmts, builtins, namespaces, openMode$(src, opts.open), opts.plugins),
    ),
  );
const typedQuery: _Curry<
  [src: string, stmts: Stmt[], opts: Opts],
  Result<
    {
      env: Map<string, Scheme>;
      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
      aliases: Map<string, AliasInfo>;
      letParams: TypeAt[];
    },
    Stamped[]
  >
> = _curry(3, typedQuery$);
const inferTypesWith$ = (
  src: string,
  opts: Opts,
): Result<
  {
    env: Map<string, Scheme>;
    types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
    aliases: Map<string, AliasInfo>;
    letParams: TypeAt[];
  },
  Stamped[]
> => _Result_flatMap((stmts) => typedQuery$(src, stmts, opts), frontend$(src, opts.plugins));
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
      aliases: Map<string, AliasInfo>;
      letParams: TypeAt[];
    },
    Stamped[]
  >
> = _curry(2, inferTypesWith$);
const inferTypesRecoveringWith$ = (
  src: string,
  opts: Opts,
): Result<
  {
    env: Map<string, Scheme>;
    types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
    aliases: Map<string, AliasInfo>;
    letParams: TypeAt[];
  },
  Stamped[]
> =>
  _Result_match(
    lex(src),
    (e) =>
      Err([stampStage$("lex", e)]) as Result<
        {
          env: Map<string, Scheme>;
          types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
          aliases: Map<string, AliasInfo>;
          letParams: TypeAt[];
        },
        Stamped[]
      >,
    (tokens) => {
      const parsed: { stmts: Stmt[]; diagnostics: StageErr[] } = parseRecovering(
        tokens,
        opts.plugins,
      );
      return _Result_flatMap(
        (stmts: Stmt[]) => typedQuery$(src, stmts, opts),
        _Result_mapErr(
          (es: StageErr[]) => map((e: StageErr) => stampStage$("check", e), es),
          checkAll(parsed.stmts),
        ),
      );
    },
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
      aliases: Map<string, AliasInfo>;
      letParams: TypeAt[];
    },
    Stamped[]
  >
> = _curry(2, inferTypesRecoveringWith$);
export const inferTypes: (src: string) => Result<
  {
    env: Map<string, Scheme>;
    types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
    aliases: Map<string, AliasInfo>;
    letParams: TypeAt[];
  },
  Stamped[]
> = (src: string) => inferTypesWith$(src, defaultOpts);
const nominalTypeName$ = (ty: Ty, aliases: Map<string, AliasInfo>): Option<string> =>
  Schemes.nominalTypeName(ty, aliases);
/**
 * The declared type a recorded type names, for go-to-type (ADR 0119).
 */
export const nominalTypeName: _Curry<
  [ty: Ty, aliases: Map<string, AliasInfo>],
  Option<string>
> = _curry(2, nominalTypeName$);
const symbolIndexSync$ = (
  path: string,
  origins: Origins,
  prelude: SymPrelude,
  stmts: Stmt[],
): SymIndex => indexWith(path, origins, prelude, stmts);
/**
 * The symbol index (ADR 0118) in the synchronous bundle, which the browser
 * loads too: hover resolves a builtin reference to its prelude docstring
 * through it (#103). module.mochi's `symbolIndex` is the same query.
 */
export const symbolIndexSync: _Curry<
  [path: string, origins: Origins, prelude: SymPrelude, stmts: Stmt[]],
  SymIndex
> = _curry(4, symbolIndexSync$);
const emitJsWith$ = (stmts: Stmt[], opts: Opts): string =>
  codegenWith(
    stmts,
    new Map<string, string[]>(),
    opts.runtime,
    namespaceRuntime,
    preludeJsDefs,
    runtimeDeps,
    { ...jsGenOpts, docs: opts.docs, moduleExt: opts.moduleExt },
  );
/**
 * The JS a checked program emits under `opts`. Shared with `dts.mochi`'s
 * `compileTargetsWith`, which prints every target from one inference.
 */
export const emitJsWith: _Curry<[stmts: Stmt[], opts: Opts], string> = _curry(2, emitJsWith$);
const compileWith$ = (src: string, opts: Opts): Result<string, Stamped[]> =>
  _Result_map(
    (prog: Stmt[]) => emitJsWith$(prog, opts),
    pipelineWith$(src, openMode$(src, opts.open), opts.plugins),
  );
/**
 * compileWith : string -> Opts -> Result string Err
 */
export const compileWith: _Curry<[src: string, opts: Opts], Result<string, Stamped[]>> = _curry(
  2,
  compileWith$,
);
/**
 * compile : string -> Result string Err
 */
export const compile: (src: string) => Result<string, Stamped[]> = (src: string) =>
  compileWith$(src, defaultOpts);
const noImportedKeys: Map<string, string[]> = new Map<string, string[]>();
/**
 * The typed TypeScript a single file emits from its inference result `r`.
 * Shared with `dts.mochi`'s `compileTargetsWith`.
 */
export const emitTsWith: <A, B, C, D, E, F, G, H, I, J>(
  stmts: Stmt[],
  r: {
    env: Map<string, { ty: Ty; vars: number[]; rvars: number[] } & E>;
    types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[];
    letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[];
    aliases: Map<string, AliasInfo>;
  } & J,
  runtimeImport: string,
  opts: Opts,
) => string = _curry(
  4,
  <A, B, C, D, E, F, G, H, I, J>(
    stmts: Stmt[],
    r: {
      env: Map<string, { ty: Ty; vars: number[]; rvars: number[] } & E>;
      types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[];
      letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[];
      aliases: Map<string, AliasInfo>;
    } & J,
    runtimeImport: string,
    opts: Opts,
  ) =>
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
);
const compileTsWith$ = (
  src: string,
  runtimeImport: string,
  opts: Opts,
): Result<string, Stamped[]> =>
  _Result_flatMap(
    (stmts) =>
      _Result_mapErr(
        (es: IErr[]) => map(stampType, es),
        _Result_map(
          (r: {
            env: Map<string, Scheme>;
            types: TypeAt[];
            letParams: TypeAt[];
            aliases: Map<string, AliasInfo>;
          }) => emitTsWith(stmts, r, runtimeImport, opts),
          inferProgramTypesWith(
            stmts,
            builtins,
            namespaces,
            openMode$(src, opts.open),
            opts.plugins,
          ),
        ),
      ),
    frontend$(src, opts.plugins),
  );
/**
 * compileTs : string -> Result string Err — the SAME railway, but the typed
 * TypeScript backend (ADR 0026 / 0090). Inference runs through
 * `inferProgramTypes` so the emitter gets the span -> type table its
 * annotation hooks are driven from, not just the final env.
 */
export const compileTsWith: _Curry<
  [src: string, runtimeImport: string, opts: Opts],
  Result<string, Stamped[]>
> = _curry(3, compileTsWith$);
const compileTs$ = (src: string, runtimeImport: string): Result<string, Stamped[]> =>
  compileTsWith$(src, runtimeImport, defaultOpts);
export const compileTs: _Curry<
  [src: string, runtimeImport: string],
  Result<string, Stamped[]>
> = _curry(2, compileTs$);
