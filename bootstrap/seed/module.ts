import type { HostPlugin, LocTok, Plugin } from "./infer";
import type { AliasField, Stmt, TypeExpr } from "./ast";
import type { SpanAt, Ty, TypeAt } from "./types";
import type { Scheme } from "./schemes";
import type { StageErr, Stamped } from "./compile";
import type { Occurrence, Origins, SymIndex, SymPrelude } from "./symbols";

export type Opts = {
  open: boolean;
  runtime: boolean;
  docs: boolean;
  moduleExt: string;
  strictEntry: boolean;
  plugins: Option<HostPlugin[]>;
};
export type Loaded = { path: string; src: string; stmts: Stmt[] };
export type ModuleOutput = { path: string; js: string };
export type ExportOrigins = {
  values: Map<string, SpanAt>;
  types: Map<string, SpanAt>;
  ctors: Map<string, SpanAt>;
};
export type MErr = { message: string; start: number; end: number };
export type Acc = { state: Map<string, string>; order: Loaded[] };
export type CtorInfo = { owner: string; arity: number };
export type Registry = { ctors: Map<string, CtorInfo>; types: Map<string, string[]> };
export type GraphRecovery = { outputs: ModuleOutput[]; errors: StageErr[] };
export type RecoveryAliasInfo = { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> };
export type RecoveryQualScope = { types: Set<string>; aliases: Map<string, RecoveryAliasInfo> };
export type RecoveryScheme = { vars: number[]; rvars: number[]; ty: Ty };
export type RecoveryCtx = {
  exportsByPath: Map<string, Map<string, Scheme>>;
  regByPath: Map<string, Registry>;
  keysByPath: Map<string, Map<string, string[]>>;
  qualsByPath: Map<string, RecoveryQualScope>;
  outputs: ModuleOutput[];
};
export type RecoveryGraphState = { ctx: RecoveryCtx; errors: StageErr[] };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_append,
  _Array_concat,
  _Array_flatMap,
  _Array_get,
  _Array_sort,
  _Map_delete,
  _Map_get,
  _Map_getOr,
  _Map_has,
  _Map_keys,
  _Map_set,
  _Option_mapOr,
  _Option_unwrapOr,
  _Result_flatMap,
  _Result_mapErr,
  _Set_add,
  _Set_fromArray,
  _Set_has,
  _Str_codeAt,
  _Str_get,
  _Str_join,
  _Str_length,
  _Str_split,
  _Str_startsWith,
  _Str_trim,
  _curry,
  add,
  and,
  compare,
  eq,
  filter,
  gt,
  length,
  lte,
  map,
  not,
  or,
  reduce,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import { lex } from "./lexer";
import { parseWith } from "./parser";
import { checkAllWith, checkWith } from "./check";
import { exportedRegistry, exportedCtorKeys } from "./ctors";
import {
  inferProgramImports,
  inferProgramImportsTypes,
  exportedSchemes,
  scopeAliases,
} from "./infer";
import { codegenWith, jsGenOpts } from "./codegen";
import * as Infer from "./infer";
import { emitTsModuleWith, externModuleDts } from "./codegen-ts";
import { showType, tVar } from "./types";
import { widenLits } from "./schemes";
import { index, indexWith, originsOf } from "./symbols";
import { emitDtsFromTypedWith, emitDtsText, qualifierMapOf } from "./dts";
import { bindingHooksFor, dtsHooksFor } from "./extensions";
import { openMode } from "./compile";
import { builtins } from "./prelude.gen.mjs";
import { namespaces } from "./prelude.gen.mjs";
import { namespaceRuntime } from "./prelude.gen.mjs";
import { preludeJsDefs } from "./prelude.gen.mjs";
import { runtimeDeps } from "./prelude.gen.mjs";
import * as Ast from "./ast";
/**
 * Host-facing `.d.ts` emit. Lives here for the same reason the TypeScript
 * mirror puts `emitDtsForFile` in its module driver: declaration emit is a
 * whole-file query the graph owns, not a single-expression one.
 */
export const emitDts: _Curry<
  [src: string, runtimeImport: string],
  Result<string, Stamped[]>
> = _curry(2, (src: string, runtimeImport: string) => emitDtsText(src, runtimeImport));
/**
 * Host-facing lexical occurrence query. The index itself is source-owned;
 * this re-export makes it reachable from the frozen graph without teaching
 * host DX code about bootstrap's internal module layout.
 */
export const symbolOccurrences: (stmts: Stmt[]) => Occurrence[] = (stmts: Stmt[]) => index(stmts);
/**
 * Host-facing symbol index over all four spaces, imports resolved through
 * `origins` and builtins through the host's virtual `prelude`.
 */
export const symbolIndex: _Curry<
  [path: string, origins: Origins, prelude: SymPrelude, stmts: Stmt[]],
  SymIndex
> = _curry(4, (path: string, origins: Origins, prelude: SymPrelude, stmts: Stmt[]) =>
  indexWith(path, origins, prelude, stmts),
);
/**
 * A module's export sites, the `origins` an importer's `symbolIndex` takes.
 */
export const exportedOrigins: _Curry<[path: string, stmts: Stmt[]], Origins> = _curry(
  2,
  (path: string, stmts: Stmt[]) => originsOf(path, stmts),
);

const defaultOpts: Opts = {
  open: false,
  runtime: true,
  docs: true,
  moduleExt: ".js",
  strictEntry: false,
  plugins: None as Option<HostPlugin[]>,
};

import { readFile } from "./host.mjs";
import { resolveImport as $resolveImport } from "./host.mjs";
const resolveImport = _curry(2, $resolveImport);
import { absPath } from "./host.mjs";
const mErr: (message: string) => StageErr = (message: string) => ({
  message: message,
  start: 0,
  end: 0,
});
const recoveryScheme = { vars: [0], rvars: [], ty: tVar(0) };
const atPath: <C>(
  path: string,
  e: { end: number; start: number; message: string } & C,
) => StageErr = _curry(
  2,
  <C>(path: string, e: { end: number; start: number; message: string } & C) => ({
    message: `module '${path}': ${e.message}`,
    start: e.start,
    end: e.end,
  }),
);
const parseModule: _Curry<
  [src: string, plugins: Option<HostPlugin[]>],
  Result<Stmt[], StageErr>
> = _curry(2, (src: string, plugins: Option<HostPlugin[]>) =>
  _Result_flatMap((toks) => parseWith(toks, plugins), lex(src)),
);
const importFromsFrom: _Curry<[stmts: Stmt[], i: number, acc: string[]], string[]> = _curry(
  3,
  (stmts: Stmt[], i: number, acc: string[]) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some"
          ? (({ value: s }) =>
              ((_v) =>
                _v._tag === "SImport"
                  ? (({ from }) => importFromsFrom(stmts, i + 1, _Array_append(from, acc)))(_v)
                  : _v._tag === "SImportNs"
                    ? (({ from }) => importFromsFrom(stmts, i + 1, _Array_append(from, acc)))(_v)
                    : importFromsFrom(stmts, i + 1, acc))(s))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts)),
);
const importFroms: (stmts: Stmt[]) => string[] = (stmts: Stmt[]) =>
  importFromsFrom(stmts, 0, [] as string[]);

const visit: _Curry<
  [path: string, acc: Acc, plugins: Option<HostPlugin[]>],
  Result<Acc, StageErr>
> = _curry(3, (path: string, acc: Acc, plugins: Option<HostPlugin[]>) =>
  ((_v) =>
    _v._tag === "Some" && _v.value === "done"
      ? (Ok(acc) as Result<Acc, StageErr>)
      : _v._tag === "Some" && _v.value === "loading"
        ? (Err(mErr(`import cycle through '${path}'`)) as Result<Acc, StageErr>)
        : ((acc1: Acc) =>
            ((_v) =>
              _v._tag === "Err"
                ? (Err(mErr(`cannot read module '${path}'`)) as Result<Acc, StageErr>)
                : _v._tag === "Ok"
                  ? (({ value: src }) =>
                      ((_v) =>
                        _v._tag === "Err"
                          ? (({ error: e }) => Err(e) as Result<Acc, StageErr>)(_v)
                          : _v._tag === "Ok"
                            ? (({ value: stmts }) =>
                                ((_v) =>
                                  _v._tag === "Err"
                                    ? (({ error: e }) => Err(e) as Result<Acc, StageErr>)(_v)
                                    : _v._tag === "Ok"
                                      ? (({ value: acc2 }) =>
                                          Ok({
                                            state: _Map_set(path, "done", acc2.state),
                                            order: _Array_append(
                                              { path: path, src: src, stmts: stmts },
                                              acc2.order,
                                            ),
                                          }) as Result<Acc, StageErr>)(_v)
                                      : (() => {
                                          throw new Error("non-exhaustive match");
                                        })())(visitAll(importFroms(stmts), path, acc1, plugins)))(
                                _v,
                              )
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(parseModule(src, plugins)))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(readFile(path)))({
            state: _Map_set(path, "loading", acc.state),
            order: acc.order,
          }))(_Map_get(path, acc.state)),
);
const visitAll: _Curry<
  [froms: string[], importer: string, acc: Acc, plugins: Option<HostPlugin[]>],
  Result<Acc, StageErr>
> = _curry(4, (froms: string[], importer: string, acc: Acc, plugins: Option<HostPlugin[]>) =>
  ((_v) =>
    _v.length === 0
      ? (Ok(acc) as Result<Acc, StageErr>)
      : _v.length >= 1
        ? (([from, ...rest]) =>
            ((_v) =>
              _v._tag === "Err"
                ? (({ error: e }) => Err(e) as Result<Acc, StageErr>)(_v)
                : _v._tag === "Ok"
                  ? (({ value: acc1 }) => visitAll(rest, importer, acc1, plugins))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(visit(resolveImport(importer, from), acc, plugins)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(froms),
);
/**
 * loadGraphWith : string -> Option [Plugin] -> Result [Loaded] MErr
 * Load every module reachable from `entry`, in dependency order, parsing
 * each under the host's plugin list (ADR 0109).
 */
export const loadGraphWith: _Curry<
  [entry: string, plugins: Option<HostPlugin[]>],
  Result<Loaded[], StageErr>
> = _curry(2, (entry: string, plugins: Option<HostPlugin[]>) =>
  _Result_flatMap(
    (acc) => Ok(acc.order) as Result<Loaded[], StageErr>,
    visit(absPath(entry), { state: new Map<string, string>(), order: [] as Loaded[] }, plugins),
  ),
);
/**
 * loadGraph : string -> Result [Loaded] MErr — default plugins.
 */
export const loadGraph: (entry: string) => Result<Loaded[], StageErr> = (entry: string) =>
  loadGraphWith(entry, None as Option<HostPlugin[]>);

const emptyReg: Registry = {
  ctors: new Map<string, CtorInfo>(),
  types: new Map<string, string[]>(),
};
const mergeInto: <A, B>(keys: A[], from: Map<A, B>, into: Map<A, B>) => Map<A, B> = _curry(
  3,
  <A, B>(keys: A[], from: Map<A, B>, into: Map<A, B>) =>
    match(keys)
      .with(
        (_v) => _v.length === 0,
        () => into,
      )
      .with(
        (_v) => _v.length >= 1,
        ([k, ...rest]) =>
          mergeInto(
            rest,
            from,
            ((_v) =>
              _v._tag === "Some"
                ? (({ value: v }) => _Map_set(k, v, into))(_v)
                : _v._tag === "None"
                  ? into
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(_Map_get(k, from)),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const mergeMap: <A, B>(from: Map<A, B>, into: Map<A, B>) => Map<A, B> = _curry(
  2,
  <A, B>(from: Map<A, B>, into: Map<A, B>) => mergeInto(_Map_keys(from), from, into),
);
const exportedTypeNames: (stmts: Stmt[]) => Set<string> = (stmts: Stmt[]) =>
  _Set_fromArray(
    _Array_flatMap(
      (s: Stmt) =>
        ((_v) =>
          _v._tag === "SType" && _v.exported === true
            ? (({ name }) => [name])(_v)
            : ([] as string[]))(s),
      stmts,
    ),
  );
const aliasesOf: (stmts: Stmt[]) => Map<string, RecoveryAliasInfo> = (stmts: Stmt[]) =>
  reduce(
    _curry(2, (acc: Map<string, RecoveryAliasInfo>, s: Stmt) =>
      ((_v) =>
        _v._tag === "SType" && _v.alias._tag === "Some"
          ? (({ name, params, alias: { value: fields } }) =>
              _Map_set(
                name,
                { params: params, fields: fields, expr: None as Option<TypeExpr> },
                acc,
              ))(
              _v as Extract<Stmt, { _tag: "SType" }> & {
                alias: Extract<Extract<Stmt, { _tag: "SType" }>["alias"], { _tag: "Some" }>;
              },
            )
          : _v._tag === "SType" && _v.aliasType._tag === "Some"
            ? (({ name, params, aliasType: { value: te } }) =>
                _Map_set(
                  name,
                  {
                    params: params,
                    fields: [] as AliasField[],
                    expr: Some(te) as Option<TypeExpr>,
                  },
                  acc,
                ))(
                _v as Extract<Stmt, { _tag: "SType" }> & {
                  aliasType: Extract<
                    Extract<Stmt, { _tag: "SType" }>["aliasType"],
                    { _tag: "Some" }
                  >;
                },
              )
            : acc)(s),
    ),
    new Map<string, RecoveryAliasInfo>(),
    stmts,
  );
const qualScopeOf: <A, B, C>(
  stmts: Stmt[],
  quals: Map<
    string,
    {
      aliases: Map<
        string,
        {
          expr: Option<TypeExpr>;
          fields: ({
            optional: boolean;
            fieldType: TypeExpr;
            nameSpan: SpanAt;
            name: string;
          } & A)[];
          params: string[];
        } & B
      >;
    } & C
  >,
) => RecoveryQualScope = _curry(
  2,
  <A, B, C>(
    stmts: Stmt[],
    quals: Map<
      string,
      {
        aliases: Map<
          string,
          {
            expr: Option<TypeExpr>;
            fields: ({
              optional: boolean;
              fieldType: TypeExpr;
              nameSpan: SpanAt;
              name: string;
            } & A)[];
            params: string[];
          } & B
        >;
      } & C
    >,
  ) => ({ types: exportedTypeNames(stmts), aliases: scopeAliases(stmts, quals) }),
);
const withNamedCtor: <A, B, C, D, E, F, G, H, I, J, K>(
  name: A,
  info: { owner: B } & H,
  depReg: { types: Map<B, C> } & I,
  depKeys: Map<A, D>,
  res: {
    quals: E;
    keys: Map<A, D>;
    reg: { types: Map<B, C>; ctors: Map<A, { owner: B } & H> } & J;
    nsImports: F;
    imports: G;
  } & K,
) => {
  imports: G;
  nsImports: F;
  reg: { ctors: Map<A, { owner: B } & H>; types: Map<B, C> };
  keys: Map<A, D>;
  quals: E;
} = _curry(
  5,
  <A, B, C, D, E, F, G, H, I, J, K>(
    name: A,
    info: { owner: B } & H,
    depReg: { types: Map<B, C> } & I,
    depKeys: Map<A, D>,
    res: {
      quals: E;
      keys: Map<A, D>;
      reg: { types: Map<B, C>; ctors: Map<A, { owner: B } & H> } & J;
      nsImports: F;
      imports: G;
    } & K,
  ) => ({
    imports: res.imports,
    nsImports: res.nsImports,
    reg: {
      ctors: _Map_set(name, info, res.reg.ctors),
      types: ((_v) =>
        _v._tag === "Some"
          ? (({ value: cs }) => _Map_set(info.owner, cs, res.reg.types))(_v)
          : _v._tag === "None"
            ? res.reg.types
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Map_get(info.owner, depReg.types)),
    },
    keys: ((_v) =>
      _v._tag === "Some"
        ? (({ value: ks }) => _Map_set(name, ks, res.keys))(_v)
        : _v._tag === "None"
          ? res.keys
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Map_get(name, depKeys)),
    quals: res.quals,
  }),
);
const takeNamedCtor: <C, D, E, F, G, H, I, J, K>(
  name: string,
  span: { end: number; start: number } & I,
  depReg: { ctors: Map<string, { owner: C } & J>; types: Map<C, D> } & K,
  depKeys: Map<string, E>,
  res: {
    reg: { ctors: Map<string, { owner: C } & J>; types: Map<C, D> };
    quals: F;
    keys: Map<string, E>;
    nsImports: G;
    imports: H;
  },
) => Result<
  {
    reg: { ctors: Map<string, { owner: C } & J>; types: Map<C, D> };
    quals: F;
    keys: Map<string, E>;
    nsImports: G;
    imports: H;
  },
  StageErr
> = _curry(
  5,
  <C, D, E, F, G, H, I, J, K>(
    name: string,
    span: { end: number; start: number } & I,
    depReg: { ctors: Map<string, { owner: C } & J>; types: Map<C, D> } & K,
    depKeys: Map<string, E>,
    res: {
      reg: { ctors: Map<string, { owner: C } & J>; types: Map<C, D> };
      quals: F;
      keys: Map<string, E>;
      nsImports: G;
      imports: H;
    },
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? Ok(res)
        : _v._tag === "Some"
          ? (({ value: info }) =>
              ((_v) =>
                _v._tag === "Some"
                  ? (({ value: prior }) =>
                      !eq(prior.owner, info.owner)
                        ? Err({
                            message: `duplicate constructor '${name}'`,
                            start: span.start,
                            end: span.end,
                          })
                        : Ok(withNamedCtor(name, info, depReg, depKeys, res)))(_v)
                  : _v._tag === "None"
                    ? Ok(withNamedCtor(name, info, depReg, depKeys, res))
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(_Map_get(name, res.reg.ctors)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Map_get(name, depReg.ctors)),
);
const prefixCtorsInto: <A>(
  keys: string[],
  alias: string,
  from: Map<string, A>,
  into: Map<string, A>,
) => Map<string, A> = _curry(
  4,
  <A>(keys: string[], alias: string, from: Map<string, A>, into: Map<string, A>) =>
    ((_v) =>
      _v.length === 0
        ? into
        : _v.length >= 1
          ? (([k, ...rest]) =>
              prefixCtorsInto(
                rest,
                alias,
                from,
                ((_v) =>
                  _v._tag === "Some"
                    ? (({ value: v }) => _Map_set(`${alias}.${k}`, v, into))(_v)
                    : _v._tag === "None"
                      ? into
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(_Map_get(k, from)),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(keys),
);
const resolveNames: <D, E, F, G, H, I, J, K, L>(
  names: ({ name: string; span: { end: number; start: number } & I } & J)[],
  from: string,
  depExports: Map<string, Scheme>,
  depReg: { ctors: Map<string, { owner: D } & K>; types: Map<D, E> } & L,
  depKeys: Map<string, F>,
  res: {
    quals: G;
    keys: Map<string, F>;
    reg: { ctors: Map<string, { owner: D } & K>; types: Map<D, E> };
    nsImports: H;
    imports: Map<string, Scheme>;
  },
  recovering: boolean,
) => Result<
  {
    quals: G;
    keys: Map<string, F>;
    reg: { ctors: Map<string, { owner: D } & K>; types: Map<D, E> };
    nsImports: H;
    imports: Map<string, Scheme>;
  },
  StageErr
> = _curry(
  7,
  <D, E, F, G, H, I, J, K, L>(
    names: ({ name: string; span: { end: number; start: number } & I } & J)[],
    from: string,
    depExports: Map<string, Scheme>,
    depReg: { ctors: Map<string, { owner: D } & K>; types: Map<D, E> } & L,
    depKeys: Map<string, F>,
    res: {
      quals: G;
      keys: Map<string, F>;
      reg: { ctors: Map<string, { owner: D } & K>; types: Map<D, E> };
      nsImports: H;
      imports: Map<string, Scheme>;
    },
    recovering: boolean,
  ) =>
    match(names)
      .with(
        (_v) => _v.length === 0,
        () => Ok(res),
      )
      .with(
        (_v) => _v.length >= 1,
        ([n, ...rest]) =>
          ((_v) =>
            _v._tag === "None"
              ? recovering
                ? resolveNames(
                    rest,
                    from,
                    depExports,
                    depReg,
                    depKeys,
                    {
                      imports: _Map_set(n.name, recoveryScheme, res.imports),
                      nsImports: res.nsImports,
                      reg: res.reg,
                      keys: res.keys,
                      quals: res.quals,
                    },
                    recovering,
                  )
                : Err({
                    message: `'${from}' has no export '${n.name}'`,
                    start: n.span.start,
                    end: n.span.end,
                  })
              : _v._tag === "Some"
                ? (({ value: sc }) =>
                    ((_v) =>
                      _v._tag === "Err"
                        ? (({ error: e }) => Err(e))(_v)
                        : _v._tag === "Ok"
                          ? (({ value: res1 }) =>
                              resolveNames(
                                rest,
                                from,
                                depExports,
                                depReg,
                                depKeys,
                                res1,
                                recovering,
                              ))(_v)
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(
                      takeNamedCtor(n.name, n.span, depReg, depKeys, {
                        imports: _Map_set(n.name, sc, res.imports),
                        nsImports: res.nsImports,
                        reg: res.reg,
                        keys: res.keys,
                        quals: res.quals,
                      }),
                    ))(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(_Map_get(n.name, depExports)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const resolveImportsFrom: <B, C, D>(
  ctx: {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, B>>;
    qualsByPath: Map<string, C>;
  } & D,
  stmts: Stmt[],
  i: number,
  path: string,
  res: {
    quals: Map<string, C>;
    keys: Map<string, B>;
    reg: Registry;
    nsImports: Map<string, Map<string, Scheme>>;
    imports: Map<string, Scheme>;
  },
  recovering: boolean,
) => Result<
  {
    quals: Map<string, C>;
    keys: Map<string, B>;
    reg: Registry;
    nsImports: Map<string, Map<string, Scheme>>;
    imports: Map<string, Scheme>;
  },
  StageErr
> = _curry(
  6,
  <B, C, D>(
    ctx: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, B>>;
      qualsByPath: Map<string, C>;
    } & D,
    stmts: Stmt[],
    i: number,
    path: string,
    res: {
      quals: Map<string, C>;
      keys: Map<string, B>;
      reg: Registry;
      nsImports: Map<string, Map<string, Scheme>>;
      imports: Map<string, Scheme>;
    },
    recovering: boolean,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? Ok(res)
        : _v._tag === "Some" && _v.value._tag === "SImport"
          ? (({ value: { names, from } }) =>
              ((dp: string) =>
                ((depExports) =>
                  ((depReg: Registry) =>
                    ((depKeys) =>
                      ((_v) =>
                        _v._tag === "Err"
                          ? (({ error: e }) => Err(e))(_v)
                          : _v._tag === "Ok"
                            ? (({ value: res1 }) =>
                                resolveImportsFrom(ctx, stmts, i + 1, path, res1, recovering))(_v)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(
                        resolveNames(names, from, depExports, depReg, depKeys, res, recovering),
                      ))(_Map_getOr(new Map<string, B>(), dp, ctx.keysByPath)))(
                    _Map_getOr(emptyReg, dp, ctx.regByPath),
                  ))(_Map_getOr(new Map<string, Scheme>(), dp, ctx.exportsByPath)))(
                resolveImport(path, from),
              ))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                  { _tag: "SImport" }
                >;
              },
            )
          : _v._tag === "Some" && _v.value._tag === "SImportNs"
            ? (({ value: { alias, from } }) =>
                ((dp: string) =>
                  ((depExports) =>
                    ((depReg: Registry) =>
                      ((depKeys) =>
                        resolveImportsFrom(
                          ctx,
                          stmts,
                          i + 1,
                          path,
                          {
                            imports: res.imports,
                            nsImports: _Map_set(alias.name, depExports, res.nsImports),
                            reg: {
                              ctors: prefixCtorsInto(
                                _Map_keys(depReg.ctors),
                                alias.name,
                                depReg.ctors,
                                res.reg.ctors,
                              ),
                              types: mergeMap(depReg.types, res.reg.types),
                            },
                            keys: mergeMap(depKeys, res.keys),
                            quals: ((_v) =>
                              _v._tag === "Some"
                                ? (({ value: q }) => _Map_set(alias.name, q, res.quals))(_v)
                                : _v._tag === "None"
                                  ? res.quals
                                  : (() => {
                                      throw new Error("non-exhaustive match");
                                    })())(_Map_get(dp, ctx.qualsByPath)),
                          },
                          recovering,
                        ))(_Map_getOr(new Map<string, B>(), dp, ctx.keysByPath)))(
                      _Map_getOr(emptyReg, dp, ctx.regByPath),
                    ))(_Map_getOr(new Map<string, Scheme>(), dp, ctx.exportsByPath)))(
                  resolveImport(path, from),
                ))(
                _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                  value: Extract<
                    Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                    { _tag: "SImportNs" }
                  >;
                },
              )
            : _v._tag === "Some"
              ? resolveImportsFrom(ctx, stmts, i + 1, path, res, recovering)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(_Array_get(i, stmts)),
);
const openFor: _Curry<[loaded: Loaded, isEntry: boolean, opts: Opts], boolean> = _curry(
  3,
  (loaded: Loaded, isEntry: boolean, opts: Opts) =>
    and(isEntry, opts.strictEntry) ? opts.open : openMode(loaded.src, opts.open),
);
const compileOne: <A>(
  ctx: {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    outputs: ModuleOutput[];
  } & A,
  loaded: Loaded,
  recovering: boolean,
  isEntry: boolean,
  opts: Opts,
) => Result<RecoveryCtx, StageErr> = _curry(
  5,
  <A>(
    ctx: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      outputs: ModuleOutput[];
    } & A,
    loaded: Loaded,
    recovering: boolean,
    isEntry: boolean,
    opts: Opts,
  ) =>
    ((_v) =>
      _v._tag === "Err"
        ? (({ error: e }) => Err(atPath(loaded.path, e)) as Result<RecoveryCtx, StageErr>)(_v)
        : _v._tag === "Ok"
          ? (({ value: res }) =>
              ((_v) =>
                _v._tag === "Err"
                  ? (({ error: e }) =>
                      Err(atPath(loaded.path, e)) as Result<RecoveryCtx, StageErr>)(_v)
                  : _v._tag === "Ok"
                    ? ((_v) =>
                        _v._tag === "Err"
                          ? (({ error: e }) =>
                              Err(atPath(loaded.path, e)) as Result<RecoveryCtx, StageErr>)(_v)
                          : _v._tag === "Ok"
                            ? (({ value: env }) =>
                                ((js: string) =>
                                  Ok({
                                    exportsByPath: _Map_set(
                                      loaded.path,
                                      exportedSchemes(loaded.stmts, env),
                                      ctx.exportsByPath,
                                    ),
                                    regByPath: _Map_set(
                                      loaded.path,
                                      exportedRegistry(loaded.stmts),
                                      ctx.regByPath,
                                    ),
                                    keysByPath: _Map_set(
                                      loaded.path,
                                      exportedCtorKeys(loaded.stmts),
                                      ctx.keysByPath,
                                    ),
                                    qualsByPath: _Map_set(
                                      loaded.path,
                                      qualScopeOf(loaded.stmts, res.quals),
                                      ctx.qualsByPath,
                                    ),
                                    outputs: [...ctx.outputs, { path: loaded.path, js: js }],
                                  }) as Result<RecoveryCtx, StageErr>)(
                                  codegenWith(
                                    loaded.stmts,
                                    res.keys,
                                    opts.runtime,
                                    namespaceRuntime,
                                    preludeJsDefs,
                                    runtimeDeps,
                                    { ...jsGenOpts, docs: opts.docs, moduleExt: opts.moduleExt },
                                  ),
                                ))(_v)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(
                        inferProgramImports(
                          loaded.stmts,
                          builtins,
                          namespaces,
                          openFor(loaded, isEntry, opts),
                          res.imports,
                          res.nsImports,
                          res.quals,
                          opts.plugins,
                        ),
                      )
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(checkWith(loaded.stmts, res.reg, res.quals)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(
      resolveImportsFrom(
        ctx,
        loaded.stmts,
        0,
        loaded.path,
        {
          imports: new Map<string, Scheme>(),
          nsImports: new Map<string, Map<string, Scheme>>(),
          reg: emptyReg,
          keys: new Map<string, string[]>(),
          quals: new Map<string, RecoveryQualScope>(),
        },
        recovering,
      ),
    ),
);
const compileAll: _Curry<
  [ctx: RecoveryCtx, graph: Loaded[], opts: Opts],
  Result<ModuleOutput[], StageErr>
> = _curry(3, (ctx: RecoveryCtx, graph: Loaded[], opts: Opts) =>
  ((_v) =>
    _v.length === 0
      ? (Ok(ctx.outputs) as Result<ModuleOutput[], StageErr>)
      : _v.length >= 1
        ? (([m, ...rest]) =>
            ((_v) =>
              _v._tag === "Err"
                ? (({ error: e }) => Err(e) as Result<ModuleOutput[], StageErr>)(_v)
                : _v._tag === "Ok"
                  ? (({ value: ctx1 }) => compileAll(ctx1, rest, opts))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(compileOne(ctx, m, false, length(rest) === 0, opts)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(graph),
);
/**
 * compileGraph : [Loaded] -> Result [ModuleOutput] MErr
 * Spelled out (not point-free `compileAll(ctx0)`): the TS backend types a
 * multi-param function uncurried, so a partial application is a tsc error.
 */
export const compileGraphWith: _Curry<
  [graph: Loaded[], opts: Opts],
  Result<ModuleOutput[], StageErr>
> = _curry(2, (graph: Loaded[], opts: Opts) =>
  compileAll(
    {
      exportsByPath: new Map<string, Map<string, Scheme>>(),
      regByPath: new Map<string, Registry>(),
      keysByPath: new Map<string, Map<string, string[]>>(),
      qualsByPath: new Map<string, RecoveryQualScope>(),
      outputs: [] as ModuleOutput[],
    },
    graph,
    opts,
  ),
);
export const compileGraph: (graph: Loaded[]) => Result<ModuleOutput[], StageErr> = (
  graph: Loaded[],
) => compileGraphWith(graph, defaultOpts);

const depsPublished: <A, B>(
  ctx: { exportsByPath: Map<string, A> } & B,
  stmts: Stmt[],
  i: number,
  path: string,
) => boolean = _curry(
  4,
  <A, B>(ctx: { exportsByPath: Map<string, A> } & B, stmts: Stmt[], i: number, path: string) =>
    ((_v) =>
      _v._tag === "None"
        ? true
        : _v._tag === "Some" && _v.value._tag === "SImport"
          ? (({ value: { from } }) =>
              and(
                _Map_has(resolveImport(path, from), ctx.exportsByPath),
                depsPublished(ctx, stmts, i + 1, path),
              ))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                  { _tag: "SImport" }
                >;
              },
            )
          : _v._tag === "Some"
            ? depsPublished(ctx, stmts, i + 1, path)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, stmts)),
);
const checkErrorsRecovering: <B, C, D>(
  ctx: {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, B>>;
    qualsByPath: Map<string, { types: Set<string> } & C>;
  } & D,
  loaded: Loaded,
) => StageErr[] = _curry(
  2,
  <B, C, D>(
    ctx: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, B>>;
      qualsByPath: Map<string, { types: Set<string> } & C>;
    } & D,
    loaded: Loaded,
  ) => {
    const importErrors: StageErr[] = depsPublished(ctx, loaded.stmts, 0, loaded.path)
      ? ((_v) =>
          _v._tag === "Err"
            ? (({ error: e }) => [atPath(loaded.path, e)])(_v)
            : _v._tag === "Ok"
              ? ([] as StageErr[])
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(
          resolveImportsFrom(
            ctx,
            loaded.stmts,
            0,
            loaded.path,
            {
              imports: new Map<string, Scheme>(),
              nsImports: new Map<string, Map<string, Scheme>>(),
              reg: emptyReg,
              keys: new Map<string, B>(),
              quals: new Map<string, { types: Set<string> } & C>(),
            },
            false,
          ),
        )
      : ([] as StageErr[]);
    return ((_v) =>
      _v._tag === "Err"
        ? (({ error: e }) => [atPath(loaded.path, e)])(_v)
        : _v._tag === "Ok"
          ? (({ value: res }) =>
              ((_v) =>
                _v._tag === "Err"
                  ? (({ error: es }) =>
                      _Array_concat(
                        importErrors,
                        map((e: StageErr) => atPath(loaded.path, e), es),
                      ))(_v)
                  : _v._tag === "Ok"
                    ? importErrors
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(checkAllWith(loaded.stmts, res.reg, res.quals)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(
      resolveImportsFrom(
        ctx,
        loaded.stmts,
        0,
        loaded.path,
        {
          imports: new Map<string, Scheme>(),
          nsImports: new Map<string, Map<string, Scheme>>(),
          reg: emptyReg,
          keys: new Map<string, B>(),
          quals: new Map<string, { types: Set<string> } & C>(),
        },
        true,
      ),
    );
  },
);
const sameErr: _Curry<[a: StageErr, b: StageErr], boolean> = _curry(2, (a: StageErr, b: StageErr) =>
  and(and(eq(a.message, b.message), eq(a.start, b.start)), eq(a.end, b.end)),
);
const mergeRecovered: _Curry<[e: StageErr, checks: StageErr[]], StageErr[]> = _curry(
  2,
  (e: StageErr, checks: StageErr[]) =>
    length(filter((c: StageErr) => sameErr(c, e), checks)) > 0
      ? checks
      : _Array_concat(checks, [e]),
);
const recoverOne: _Curry<
  [ctx: RecoveryCtx, m: Loaded, isEntry: boolean, errors: StageErr[], opts: Opts],
  RecoveryGraphState
> = _curry(5, (ctx: RecoveryCtx, m: Loaded, isEntry: boolean, errors: StageErr[], opts: Opts) =>
  ((_v) =>
    _v._tag === "Err"
      ? (({ error: e }) =>
          ((checks: StageErr[]) => ({
            ctx: ctx,
            errors: _Array_concat(errors, mergeRecovered(e, checks)),
          }))(checkErrorsRecovering(ctx, m)))(_v)
      : _v._tag === "Ok"
        ? (({ value: ctx1 }) => ({ ctx: ctx1, errors: errors }))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(compileOne(ctx, m, true, isEntry, opts)),
);
const compileAllRecovering: _Curry<
  [ctx: RecoveryCtx, graph: Loaded[], errors: StageErr[], opts: Opts],
  RecoveryGraphState
> = _curry(4, (ctx: RecoveryCtx, graph: Loaded[], errors: StageErr[], opts: Opts) =>
  ((_v) =>
    _v.length === 0
      ? { ctx: ctx, errors: errors }
      : _v.length >= 1
        ? (([m, ...rest]) =>
            ((next: RecoveryGraphState) => compileAllRecovering(next.ctx, rest, next.errors, opts))(
              recoverOne(ctx, m, length(rest) === 0, errors, opts),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(graph),
);
/**
 * freshRecoveryGraphState : unit -> RecoveryGraphState
 * Opaque open-world graph context plus accumulated errors. Hosts retain this
 * at dependency prefixes so recovery queries can resume at a sibling entry.
 */
export const freshRecoveryGraphState: () => RecoveryGraphState = () => ({
  ctx: {
    exportsByPath: new Map<string, Map<string, Scheme>>(),
    regByPath: new Map<string, Registry>(),
    keysByPath: new Map<string, Map<string, string[]>>(),
    qualsByPath: new Map<string, RecoveryQualScope>(),
    outputs: [] as ModuleOutput[],
  },
  errors: [] as StageErr[],
});
/**
 * recoverGraphFrom : RecoveryGraphState -> [Loaded] -> RecoveryGraphState
 * Advance a graph recovery state by a dependency-ordered suffix.
 */
export const recoverGraphFromWith: <A>(
  state: { ctx: RecoveryCtx; errors: StageErr[] } & A,
  graph: Loaded[],
  opts: Opts,
) => RecoveryGraphState = _curry(
  3,
  <A>(state: { ctx: RecoveryCtx; errors: StageErr[] } & A, graph: Loaded[], opts: Opts) =>
    compileAllRecovering(state.ctx, graph, state.errors, opts),
);
export const recoverGraphFrom: <A>(
  state: { ctx: RecoveryCtx; errors: StageErr[] } & A,
  graph: Loaded[],
) => RecoveryGraphState = _curry(
  2,
  <A>(state: { ctx: RecoveryCtx; errors: StageErr[] } & A, graph: Loaded[]) =>
    recoverGraphFromWith(state, graph, defaultOpts),
);
/**
 * recoverModuleWith : RecoveryGraphState -> Loaded -> bool -> Opts -> RecoveryGraphState
 * Recover one module on top of a state that already holds its dependencies.
 * A host stepping module by module says which one is the entry: a one-module
 * suffix cannot tell, and `strictEntry` judges only the entry strictly.
 */
export const recoverModuleWith: _Curry<
  [state: RecoveryGraphState, loaded: Loaded, isEntry: boolean, opts: Opts],
  RecoveryGraphState
> = _curry(4, (state: RecoveryGraphState, loaded: Loaded, isEntry: boolean, opts: Opts) =>
  recoverOne(state.ctx, loaded, isEntry, state.errors, opts),
);
const keepOnly: <A, B>(key: A, keys: A[], i: number, m: Map<A, B>) => Map<A, B> = _curry(
  4,
  <A, B>(key: A, keys: A[], i: number, m: Map<A, B>) =>
    ((_v) =>
      _v._tag === "None"
        ? m
        : _v._tag === "Some"
          ? (({ value: k }) => keepOnly(key, keys, i + 1, eq(k, key) ? m : _Map_delete(k, m)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, keys)),
);
const onlyAt: <A, B>(key: A, m: Map<A, B>) => Map<A, B> = _curry(2, <A, B>(key: A, m: Map<A, B>) =>
  keepOnly(key, _Map_keys(m), 0, m),
);
/**
 * recoverySliceOf : RecoveryGraphState -> string -> RecoveryGraphState
 * The entries `path` published into `state`, and no errors: the host keeps
 * each module's errors itself, as the suffix `recoverModuleWith` appended.
 */
export const recoverySliceOf: _Curry<
  [state: RecoveryGraphState, path: string],
  RecoveryGraphState
> = _curry(2, (state: RecoveryGraphState, path: string) => ({
  ctx: {
    exportsByPath: onlyAt(path, state.ctx.exportsByPath),
    regByPath: onlyAt(path, state.ctx.regByPath),
    keysByPath: onlyAt(path, state.ctx.keysByPath),
    qualsByPath: onlyAt(path, state.ctx.qualsByPath),
    outputs: filter((o: ModuleOutput) => eq(o.path, path), state.ctx.outputs),
  },
  errors: [] as { end: number; message: string; start: number }[],
}));
/**
 * mergeRecoveryStates : RecoveryGraphState -> RecoveryGraphState -> RecoveryGraphState
 * `b`'s modules after `a`'s. Slices hold disjoint paths, so no entry is lost.
 */
export const mergeRecoveryStates: _Curry<
  [a: RecoveryGraphState, b: RecoveryGraphState],
  RecoveryGraphState
> = _curry(2, (a: RecoveryGraphState, b: RecoveryGraphState) => ({
  ctx: {
    exportsByPath: mergeMap(b.ctx.exportsByPath, a.ctx.exportsByPath),
    regByPath: mergeMap(b.ctx.regByPath, a.ctx.regByPath),
    keysByPath: mergeMap(b.ctx.keysByPath, a.ctx.keysByPath),
    qualsByPath: mergeMap(b.ctx.qualsByPath, a.ctx.qualsByPath),
    outputs: _Array_concat(a.ctx.outputs, b.ctx.outputs),
  },
  errors: _Array_concat(a.errors, b.errors),
}));
/**
 * Recovery graph driver: keeps checking after failures and gives downstream
 * imports a polymorphic placeholder rather than an unbound-name cascade.
 */
export const compileGraphRecoveringWith: _Curry<[graph: Loaded[], opts: Opts], GraphRecovery> =
  _curry(2, (graph: Loaded[], opts: Opts) => {
    const state: RecoveryGraphState = recoverGraphFromWith(freshRecoveryGraphState(), graph, opts);
    return { outputs: state.ctx.outputs, errors: state.errors };
  });
export const compileGraphRecovering: (graph: Loaded[]) => GraphRecovery = (graph: Loaded[]) =>
  compileGraphRecoveringWith(graph, defaultOpts);
const inferOne: <A, B>(
  ctx: {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    outputs: {
      path: string;
      types: { span: SpanAt; ty: Ty; display: string }[];
      aliases: Map<string, RecoveryAliasInfo>;
    }[];
    aliases: Map<string, RecoveryAliasInfo>;
  } & A,
  loaded: { stmts: Stmt[]; path: string; src: string } & B,
  opts: Opts,
) => Result<
  {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    aliases: Map<string, RecoveryAliasInfo>;
    outputs: {
      path: string;
      types: { span: SpanAt; ty: Ty; display: string }[];
      aliases: Map<string, RecoveryAliasInfo>;
    }[];
  },
  StageErr
> = _curry(
  3,
  <A, B>(
    ctx: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      outputs: {
        path: string;
        types: { span: SpanAt; ty: Ty; display: string }[];
        aliases: Map<string, RecoveryAliasInfo>;
      }[];
      aliases: Map<string, RecoveryAliasInfo>;
    } & A,
    loaded: { stmts: Stmt[]; path: string; src: string } & B,
    opts: Opts,
  ) =>
    ((_v) =>
      _v._tag === "Err"
        ? (({ error: e }) =>
            Err(atPath(loaded.path, e)) as Result<
              {
                exportsByPath: Map<string, Map<string, Scheme>>;
                regByPath: Map<string, Registry>;
                keysByPath: Map<string, Map<string, string[]>>;
                qualsByPath: Map<string, RecoveryQualScope>;
                aliases: Map<string, RecoveryAliasInfo>;
                outputs: {
                  path: string;
                  types: { span: SpanAt; ty: Ty; display: string }[];
                  aliases: Map<string, RecoveryAliasInfo>;
                }[];
              },
              StageErr
            >)(_v)
        : _v._tag === "Ok"
          ? (({ value: res }) =>
              ((_v) =>
                _v._tag === "Err"
                  ? (({ error: e }) =>
                      Err(atPath(loaded.path, e)) as Result<
                        {
                          exportsByPath: Map<string, Map<string, Scheme>>;
                          regByPath: Map<string, Registry>;
                          keysByPath: Map<string, Map<string, string[]>>;
                          qualsByPath: Map<string, RecoveryQualScope>;
                          aliases: Map<string, RecoveryAliasInfo>;
                          outputs: {
                            path: string;
                            types: { span: SpanAt; ty: Ty; display: string }[];
                            aliases: Map<string, RecoveryAliasInfo>;
                          }[];
                        },
                        StageErr
                      >)(_v)
                  : _v._tag === "Ok"
                    ? ((_v) =>
                        _v._tag === "Err"
                          ? (({ error: e }) =>
                              Err(atPath(loaded.path, e)) as Result<
                                {
                                  exportsByPath: Map<string, Map<string, Scheme>>;
                                  regByPath: Map<string, Registry>;
                                  keysByPath: Map<string, Map<string, string[]>>;
                                  qualsByPath: Map<string, RecoveryQualScope>;
                                  aliases: Map<string, RecoveryAliasInfo>;
                                  outputs: {
                                    path: string;
                                    types: { span: SpanAt; ty: Ty; display: string }[];
                                    aliases: Map<string, RecoveryAliasInfo>;
                                  }[];
                                },
                                StageErr
                              >)(_v)
                          : _v._tag === "Ok"
                            ? (({ value: r }) =>
                                Ok({
                                  exportsByPath: _Map_set(
                                    loaded.path,
                                    exportedSchemes(loaded.stmts, r.env),
                                    ctx.exportsByPath,
                                  ),
                                  regByPath: _Map_set(
                                    loaded.path,
                                    exportedRegistry(loaded.stmts),
                                    ctx.regByPath,
                                  ),
                                  keysByPath: _Map_set(
                                    loaded.path,
                                    exportedCtorKeys(loaded.stmts),
                                    ctx.keysByPath,
                                  ),
                                  qualsByPath: _Map_set(
                                    loaded.path,
                                    qualScopeOf(loaded.stmts, res.quals),
                                    ctx.qualsByPath,
                                  ),
                                  aliases: mergeMap(r.aliases, ctx.aliases),
                                  outputs: [
                                    ...ctx.outputs,
                                    {
                                      path: loaded.path,
                                      types: map(
                                        (hit: TypeAt) => ({
                                          span: hit.span,
                                          ty: hit.ty,
                                          display: showType(widenLits(hit.ty)),
                                        }),
                                        r.types,
                                      ),
                                      aliases: mergeMap(r.aliases, ctx.aliases),
                                    },
                                  ],
                                }) as Result<
                                  {
                                    exportsByPath: Map<string, Map<string, Scheme>>;
                                    regByPath: Map<string, Registry>;
                                    keysByPath: Map<string, Map<string, string[]>>;
                                    qualsByPath: Map<string, RecoveryQualScope>;
                                    aliases: Map<string, RecoveryAliasInfo>;
                                    outputs: {
                                      path: string;
                                      types: { span: SpanAt; ty: Ty; display: string }[];
                                      aliases: Map<string, RecoveryAliasInfo>;
                                    }[];
                                  },
                                  StageErr
                                >)(_v)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(
                        inferProgramImportsTypes(
                          loaded.stmts,
                          builtins,
                          namespaces,
                          openMode(loaded.src, opts.open),
                          res.imports,
                          res.nsImports,
                          res.quals,
                          opts.plugins,
                        ),
                      )
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(checkWith(loaded.stmts, res.reg, res.quals)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(
      resolveImportsFrom(
        ctx,
        loaded.stmts,
        0,
        loaded.path,
        {
          imports: new Map<string, Scheme>(),
          nsImports: new Map<string, Map<string, Scheme>>(),
          reg: emptyReg,
          keys: new Map<string, string[]>(),
          quals: new Map<string, RecoveryQualScope>(),
        },
        false,
      ),
    ),
);
const inferAll: <A>(
  ctx: {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    outputs: {
      path: string;
      types: { span: SpanAt; ty: Ty; display: string }[];
      aliases: Map<string, RecoveryAliasInfo>;
    }[];
    aliases: Map<string, RecoveryAliasInfo>;
  },
  graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
  opts: Opts,
) => Result<
  {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    outputs: {
      path: string;
      types: { span: SpanAt; ty: Ty; display: string }[];
      aliases: Map<string, RecoveryAliasInfo>;
    }[];
    aliases: Map<string, RecoveryAliasInfo>;
  },
  StageErr
> = _curry(
  3,
  <A>(
    ctx: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      outputs: {
        path: string;
        types: { span: SpanAt; ty: Ty; display: string }[];
        aliases: Map<string, RecoveryAliasInfo>;
      }[];
      aliases: Map<string, RecoveryAliasInfo>;
    },
    graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
    opts: Opts,
  ) =>
    match(graph)
      .with(
        (_v) => _v.length === 0,
        () =>
          Ok(ctx) as Result<
            {
              exportsByPath: Map<string, Map<string, Scheme>>;
              regByPath: Map<string, Registry>;
              keysByPath: Map<string, Map<string, string[]>>;
              qualsByPath: Map<string, RecoveryQualScope>;
              outputs: {
                path: string;
                types: { span: SpanAt; ty: Ty; display: string }[];
                aliases: Map<string, RecoveryAliasInfo>;
              }[];
              aliases: Map<string, RecoveryAliasInfo>;
            },
            StageErr
          >,
      )
      .with(
        (_v) => _v.length >= 1,
        ([m, ...rest]) =>
          ((_v) =>
            _v._tag === "Err"
              ? (({ error: e }) =>
                  Err(e) as Result<
                    {
                      exportsByPath: Map<string, Map<string, Scheme>>;
                      regByPath: Map<string, Registry>;
                      keysByPath: Map<string, Map<string, string[]>>;
                      qualsByPath: Map<string, RecoveryQualScope>;
                      outputs: {
                        path: string;
                        types: { span: SpanAt; ty: Ty; display: string }[];
                        aliases: Map<string, RecoveryAliasInfo>;
                      }[];
                      aliases: Map<string, RecoveryAliasInfo>;
                    },
                    StageErr
                  >)(_v)
              : _v._tag === "Ok"
                ? (({ value: ctx1 }) => inferAll(ctx1, rest, opts))(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(inferOne(ctx, m, opts)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * freshInferGraphState : unit -> InferGraphState
 * Opaque imports-aware inference context for host-owned graph caching. A state
 * records every dependency's exports plus its accumulated typed outputs.
 */
export const freshInferGraphState: <A, B, C, D, E, F, G, H, I, J, K>() => {
  exportsByPath: Map<A, B>;
  regByPath: Map<C, D>;
  keysByPath: Map<E, F>;
  qualsByPath: Map<G, H>;
  aliases: Map<I, J>;
  outputs: K[];
} = <A, B, C, D, E, F, G, H, I, J, K>() => ({
  exportsByPath: new Map<A, B>(),
  regByPath: new Map<C, D>(),
  keysByPath: new Map<E, F>(),
  qualsByPath: new Map<G, H>(),
  aliases: new Map<I, J>(),
  outputs: [] as K[],
});
/**
 * inferGraphTypesFrom : InferGraphState -> [Loaded] -> Result InferGraphState MErr
 * Advance an existing dependency-ordered graph state. The host may retain a
 * state at a shared dependency prefix, then infer only a sibling entry tail.
 */
export const inferGraphTypesFromWith: <A>(
  state: {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    outputs: {
      path: string;
      types: { span: SpanAt; ty: Ty; display: string }[];
      aliases: Map<string, RecoveryAliasInfo>;
    }[];
    aliases: Map<string, RecoveryAliasInfo>;
  },
  graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
  opts: Opts,
) => Result<
  {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    outputs: {
      path: string;
      types: { span: SpanAt; ty: Ty; display: string }[];
      aliases: Map<string, RecoveryAliasInfo>;
    }[];
    aliases: Map<string, RecoveryAliasInfo>;
  },
  StageErr
> = _curry(
  3,
  <A>(
    state: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      outputs: {
        path: string;
        types: { span: SpanAt; ty: Ty; display: string }[];
        aliases: Map<string, RecoveryAliasInfo>;
      }[];
      aliases: Map<string, RecoveryAliasInfo>;
    },
    graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
    opts: Opts,
  ) => inferAll(state, graph, opts),
);
export const inferGraphTypesFrom: <A>(
  state: {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    outputs: {
      path: string;
      types: { span: SpanAt; ty: Ty; display: string }[];
      aliases: Map<string, RecoveryAliasInfo>;
    }[];
    aliases: Map<string, RecoveryAliasInfo>;
  },
  graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
) => Result<
  {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    outputs: {
      path: string;
      types: { span: SpanAt; ty: Ty; display: string }[];
      aliases: Map<string, RecoveryAliasInfo>;
    }[];
    aliases: Map<string, RecoveryAliasInfo>;
  },
  StageErr
> = _curry(
  2,
  <A>(
    state: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      outputs: {
        path: string;
        types: { span: SpanAt; ty: Ty; display: string }[];
        aliases: Map<string, RecoveryAliasInfo>;
      }[];
      aliases: Map<string, RecoveryAliasInfo>;
    },
    graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
  ) => inferGraphTypesFromWith(state, graph, defaultOpts),
);
/**
 * inferSliceOf : InferGraphState -> string -> InferGraphState
 * The entries and typed output `path` added to `state` (ADR 0111). `aliases`
 * is the whole accumulated scope, which merging leaves unchanged.
 */
export const inferSliceOf: <A, B, C, D, E, F, G, H>(
  state: {
    outputs: ({ path: A } & G)[];
    aliases: B;
    qualsByPath: Map<A, C>;
    keysByPath: Map<A, D>;
    regByPath: Map<A, E>;
    exportsByPath: Map<A, F>;
  } & H,
  path: A,
) => {
  exportsByPath: Map<A, F>;
  regByPath: Map<A, E>;
  keysByPath: Map<A, D>;
  qualsByPath: Map<A, C>;
  aliases: B;
  outputs: ({ path: A } & G)[];
} = _curry(
  2,
  <A, B, C, D, E, F, G, H>(
    state: {
      outputs: ({ path: A } & G)[];
      aliases: B;
      qualsByPath: Map<A, C>;
      keysByPath: Map<A, D>;
      regByPath: Map<A, E>;
      exportsByPath: Map<A, F>;
    } & H,
    path: A,
  ) => ({
    exportsByPath: onlyAt(path, state.exportsByPath),
    regByPath: onlyAt(path, state.regByPath),
    keysByPath: onlyAt(path, state.keysByPath),
    qualsByPath: onlyAt(path, state.qualsByPath),
    aliases: state.aliases,
    outputs: filter((o: { path: A } & G) => eq(o.path, path), state.outputs),
  }),
);
/**
 * mergeInferStates : InferGraphState -> InferGraphState -> InferGraphState
 * `b`'s modules after `a`'s.
 */
export const mergeInferStates: <A, B, C, D, E, F, G, H, I, J, K, L, M>(
  a: {
    outputs: A[];
    aliases: Map<B, C>;
    qualsByPath: Map<D, E>;
    keysByPath: Map<F, G>;
    regByPath: Map<H, I>;
    exportsByPath: Map<J, K>;
  } & L,
  b: {
    outputs: A[];
    aliases: Map<B, C>;
    qualsByPath: Map<D, E>;
    keysByPath: Map<F, G>;
    regByPath: Map<H, I>;
    exportsByPath: Map<J, K>;
  } & M,
) => {
  exportsByPath: Map<J, K>;
  regByPath: Map<H, I>;
  keysByPath: Map<F, G>;
  qualsByPath: Map<D, E>;
  aliases: Map<B, C>;
  outputs: A[];
} = _curry(
  2,
  <A, B, C, D, E, F, G, H, I, J, K, L, M>(
    a: {
      outputs: A[];
      aliases: Map<B, C>;
      qualsByPath: Map<D, E>;
      keysByPath: Map<F, G>;
      regByPath: Map<H, I>;
      exportsByPath: Map<J, K>;
    } & L,
    b: {
      outputs: A[];
      aliases: Map<B, C>;
      qualsByPath: Map<D, E>;
      keysByPath: Map<F, G>;
      regByPath: Map<H, I>;
      exportsByPath: Map<J, K>;
    } & M,
  ) => ({
    exportsByPath: mergeMap(b.exportsByPath, a.exportsByPath),
    regByPath: mergeMap(b.regByPath, a.regByPath),
    keysByPath: mergeMap(b.keysByPath, a.keysByPath),
    qualsByPath: mergeMap(b.qualsByPath, a.qualsByPath),
    aliases: mergeMap(b.aliases, a.aliases),
    outputs: _Array_concat(a.outputs, b.outputs),
  }),
);
/**
 * inferGraphTypes : [Loaded] -> Result [{ path, types, aliases }] MErr
 * Infer every dependency-ordered module with the exact import environment its
 * emitter would use. This is the bootstrap graph typed-query boundary.
 */
export const inferGraphTypesWith: <A>(
  graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
  opts: Opts,
) => Result<
  {
    path: string;
    types: { span: SpanAt; ty: Ty; display: string }[];
    aliases: Map<string, RecoveryAliasInfo>;
  }[],
  StageErr
> = _curry(2, <A>(graph: ({ stmts: Stmt[]; path: string; src: string } & A)[], opts: Opts) =>
  _Result_flatMap(
    (state) =>
      Ok(state.outputs) as Result<
        {
          path: string;
          types: { span: SpanAt; ty: Ty; display: string }[];
          aliases: Map<string, RecoveryAliasInfo>;
        }[],
        StageErr
      >,
    inferGraphTypesFromWith(freshInferGraphState(), graph, opts),
  ),
);
export const inferGraphTypes: <A>(
  graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
) => Result<
  {
    path: string;
    types: { span: SpanAt; ty: Ty; display: string }[];
    aliases: Map<string, RecoveryAliasInfo>;
  }[],
  StageErr
> = <A>(graph: ({ stmts: Stmt[]; path: string; src: string } & A)[]) =>
  inferGraphTypesWith(graph, defaultOpts);
/**
 * buildModules : string -> Result [ModuleOutput] [MErr]
 * Resolve the graph, collect every recoverable module diagnostic, then emit.
 * Graph-load failures are singular but normalize to `[MErr]` at this public
 * boundary, matching the single-file compiler railway.
 */
export const buildModulesWith: _Curry<
  [entry: string, opts: Opts],
  Result<ModuleOutput[], StageErr[]>
> = _curry(2, (entry: string, opts: Opts) =>
  ((_v) =>
    _v._tag === "Err"
      ? (({ error: e }) => Err([e]) as Result<ModuleOutput[], StageErr[]>)(_v)
      : _v._tag === "Ok"
        ? (({ value: graph }) =>
            ((recovered: GraphRecovery) =>
              length(recovered.errors) === 0
                ? _Result_mapErr((e: StageErr) => [e], compileGraphWith(graph, opts))
                : (Err(recovered.errors) as Result<ModuleOutput[], StageErr[]>))(
              compileGraphRecoveringWith(graph, opts),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(loadGraphWith(entry, opts.plugins)),
);
export const buildModules: (entry: string) => Result<ModuleOutput[], StageErr[]> = (
  entry: string,
) => buildModulesWith(entry, defaultOpts);
import { relSpec as $relSpec } from "./host.mjs";
const relSpec = _curry(2, $relSpec);
import { externDtsPath as $externDtsPath } from "./host.mjs";
const externDtsPath = _curry(2, $externDtsPath);
const isIdentChar: (c: string) => boolean = (c: string) =>
  ((_v) =>
    _v._tag === "None"
      ? false
      : _v._tag === "Some"
        ? (({ value: n }) =>
            or(
              or(
                or(or(and(n >= 48, n <= 57), and(n >= 65, n <= 90)), and(n >= 97, n <= 122)),
                n === 95,
              ),
              n === 36,
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Str_codeAt(0, c));
const endsAtBoundary: (part: string) => boolean = (part: string) =>
  _Str_length(part) === 0
    ? true
    : !isIdentChar(_Option_unwrapOr("", _Str_get(_Str_length(part) - 1, part)));
const startsAtBoundary: (part: string) => boolean = (part: string) =>
  _Str_length(part) === 0 ? true : !isIdentChar(_Option_unwrapOr("", _Str_get(0, part)));
const occursAsWordFrom: _Curry<[parts: string[], i: number], boolean> = _curry(
  2,
  (parts: string[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? false
        : _v._tag === "Some"
          ? (({ value: after }) =>
              and(
                _Option_mapOr(false, endsAtBoundary, _Array_get(i - 1, parts)),
                startsAtBoundary(after),
              )
                ? true
                : occursAsWordFrom(parts, i + 1))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, parts)),
);
const occursAsWord: _Curry<[name: string, text: string], boolean> = _curry(
  2,
  (name: string, text: string) => occursAsWordFrom(_Str_split(name, text), 1),
);
const importedBinding: (spec: string) => string = (spec: string) => {
  const parts: string[] = _Str_split(" as ", spec);
  return _Str_trim(_Option_unwrapOr(spec, _Array_get(length(parts) - 1, parts)));
};
const bindingsInLine: _Curry<[line: string, acc: Set<string>], Set<string>> = _curry(
  2,
  (line: string, acc: Set<string>) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some"
          ? (({ value: rest }) =>
              ((_v) =>
                _v._tag === "None"
                  ? acc
                  : _v._tag === "Some"
                    ? (({ value: names }) =>
                        reduce(
                          _curry(2, (a: Set<string>, n: string) => _Set_add(importedBinding(n), a)),
                          acc,
                          _Str_split(",", names),
                        ))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(_Array_get(0, _Str_split("}", rest))))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(1, _Str_split("{", line))),
);
const valueImported: (ts: string) => Set<string> = (ts: string) =>
  reduce(
    _curry(2, (acc: Set<string>, line: string) => bindingsInLine(line, acc)),
    _Set_fromArray([] as string[]),
    filter(_Str_startsWith("import {"), _Str_split("\n", ts)),
  );
const ownTypesInto: <A>(
  stmts: Stmt[],
  path: A,
  acc: { owner: Map<string, A>; dups: Set<string>; dupNames: string[] },
) => { owner: Map<string, A>; dups: Set<string>; dupNames: string[] } = _curry(
  3,
  <A>(
    stmts: Stmt[],
    path: A,
    acc: { owner: Map<string, A>; dups: Set<string>; dupNames: string[] },
  ) =>
    reduce(
      _curry(2, (a: { owner: Map<string, A>; dups: Set<string>; dupNames: string[] }, s: Stmt) =>
        ((_v) =>
          _v._tag === "SType"
            ? (({ name }) =>
                _Map_has(name, a.owner)
                  ? {
                      owner: _Map_set(name, path, a.owner),
                      dups: _Set_add(name, a.dups),
                      dupNames: _Set_has(name, a.dups)
                        ? a.dupNames
                        : _Array_append(name, a.dupNames),
                    }
                  : { owner: _Map_set(name, path, a.owner), dups: a.dups, dupNames: a.dupNames })(
                _v,
              )
            : a)(s),
      ),
      acc,
      stmts,
    ),
);
const typeOwnerOf: <A, B>(
  graph: ({ stmts: Stmt[]; path: A } & B)[],
) => { owner: Map<string, A>; dups: Set<string>; dupNames: string[] } = <A, B>(
  graph: ({ stmts: Stmt[]; path: A } & B)[],
) =>
  reduce(
    _curry(
      2,
      (
        acc: { owner: Map<string, A>; dups: Set<string>; dupNames: string[] },
        m: { stmts: Stmt[]; path: A } & B,
      ) => ownTypesInto(m.stmts, m.path, acc),
    ),
    { owner: new Map<string, A>(), dups: _Set_fromArray([] as string[]), dupNames: [] as string[] },
    graph,
  );
/**
 * A bare name declared in two modules (`LocTok` in parser and `LocTok<t>` in
 * infer) must not be the fold target outside the module whose own alias is
 * the nullary record. The import table keeps one owner, and it may be the
 * parameterised declaration.
 */
const nullaryDeclared: <A, B, C, D>(
  name: A,
  local: Map<A, { params: B[]; fields: C[] } & D>,
) => boolean = _curry(2, <A, B, C, D>(name: A, local: Map<A, { params: B[]; fields: C[] } & D>) =>
  ((_v) =>
    _v._tag === "None"
      ? false
      : _v._tag === "Some"
        ? (({ value: info }) => and(length(info.params) === 0, length(info.fields) > 0))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Map_get(name, local)),
);
/**
 * A synthetic parameterised homonym makes `withoutAmbiguousAlias` blank the
 * printed name while the nullary shape stays in the index, so the variables
 * still pin and the row prints structurally.
 */
const addDupMarkers: <A, B, E>(
  names: string[],
  local: Map<string, { params: A[]; fields: B[] } & E>,
  acc: Map<string, RecoveryAliasInfo>,
  i: number,
) => Map<string, RecoveryAliasInfo> = _curry(
  4,
  <A, B, E>(
    names: string[],
    local: Map<string, { params: A[]; fields: B[] } & E>,
    acc: Map<string, RecoveryAliasInfo>,
    i: number,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some"
          ? (({ value: name }) =>
              addDupMarkers(
                names,
                local,
                nullaryDeclared(name, local)
                  ? acc
                  : _Map_set(
                      `dup.${name}`,
                      {
                        params: ["_"],
                        fields: [] as {
                          fieldType: TypeExpr;
                          name: string;
                          nameSpan: { end: number; start: number };
                          optional: boolean;
                        }[],
                        expr: None,
                      },
                      acc,
                    ),
                i + 1,
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, names)),
);
const aliasesForTs: <C, D, E>(
  merged: Map<string, RecoveryAliasInfo>,
  local: Map<string, { params: C[]; fields: D[] } & E>,
  dupNames: string[],
) => Map<string, RecoveryAliasInfo> = _curry(
  3,
  <C, D, E>(
    merged: Map<string, RecoveryAliasInfo>,
    local: Map<string, { params: C[]; fields: D[] } & E>,
    dupNames: string[],
  ) => addDupMarkers(dupNames, local, merged, 0),
);
const localTypeNames: (stmts: Stmt[]) => Set<string> = (stmts: Stmt[]) =>
  _Set_fromArray(
    _Array_flatMap(
      (s: Stmt) =>
        ((_v) => (_v._tag === "SType" ? (({ name }) => [name])(_v) : ([] as string[])))(s),
      stmts,
    ),
  );
const groupByOwner: <A>(
  names: string[],
  ctx: {
    typeOwner: Map<string, string>;
    importer: string;
    localTypes: Set<string>;
    bound: Set<string>;
    ts: string;
  } & A,
) => Map<string, string[]> = _curry(
  2,
  <A>(
    names: string[],
    ctx: {
      typeOwner: Map<string, string>;
      importer: string;
      localTypes: Set<string>;
      bound: Set<string>;
      ts: string;
    } & A,
  ) =>
    reduce(
      _curry(2, (acc: Map<string, string[]>, name: string) => {
        const owner: string = _Map_getOr("", name, ctx.typeOwner);
        return or(
          or(
            or(eq(owner, ctx.importer), _Set_has(name, ctx.localTypes)),
            _Set_has(name, ctx.bound),
          ),
          !occursAsWord(name, ctx.ts),
        )
          ? acc
          : ((spec: string) =>
              _Map_set(spec, _Array_append(name, _Map_getOr([] as string[], spec, acc)), acc))(
              relSpec(ctx.importer, owner),
            );
      }),
      new Map<string, string[]>(),
      names,
    ),
);
/**
 * `import type { … }` lines for every non-local type name the EMITTED text
 * references, grouped by declaring module. Builtin variants never appear in
 * `typeOwner` — the emitter inlines their decls instead (ADR 0031).
 */
const crossModuleTypeImports: _Curry<
  [ts: string, importer: string, localTypes: Set<string>, typeOwner: Map<string, string>],
  string[]
> = _curry(
  4,
  (ts: string, importer: string, localTypes: Set<string>, typeOwner: Map<string, string>) => {
    const byOwner: Map<string, string[]> = groupByOwner(_Map_keys(typeOwner), {
      ts: ts,
      importer: importer,
      localTypes: localTypes,
      typeOwner: typeOwner,
      bound: valueImported(ts),
    });
    return map(
      (spec: string) =>
        `import type { ${_Str_join(", ", _Array_sort(_Map_getOr([] as string[], spec, byOwner)))} } from "${spec}";`,
      _Map_keys(byOwner),
    );
  },
);
const externBindingsInto: <A>(
  stmts: Stmt[],
  path: string,
  env: Map<string, A>,
  acc: Map<string, { imported: string; scheme: A; curried: boolean }[]>,
) => Map<string, { imported: string; scheme: A; curried: boolean }[]> = _curry(
  4,
  <A>(
    stmts: Stmt[],
    path: string,
    env: Map<string, A>,
    acc: Map<string, { imported: string; scheme: A; curried: boolean }[]>,
  ) =>
    reduce(
      _curry(2, (a: Map<string, { imported: string; scheme: A; curried: boolean }[]>, s: Stmt) =>
        ((_v) =>
          _v._tag === "SExtern"
            ? (({ name, module: hostModule, imported, curried }) =>
                _Str_startsWith("mochi:", hostModule)
                  ? a
                  : ((_v) =>
                      _v._tag === "None"
                        ? a
                        : _v._tag === "Some"
                          ? (({ value: sc }) =>
                              ((dp: string) =>
                                _Map_set(
                                  dp,
                                  _Array_append(
                                    { imported: imported, scheme: sc, curried: curried },
                                    _Map_getOr(
                                      [] as { imported: string; scheme: A; curried: boolean }[],
                                      dp,
                                      a,
                                    ),
                                  ),
                                  a,
                                ))(externDtsPath(path, hostModule)))(_v)
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(_Map_get(name, env)))(_v)
            : a)(s),
      ),
      acc,
      stmts,
    ),
);
const compileOneTs: <A, B>(
  ctx: {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    aliases: Map<string, RecoveryAliasInfo>;
    dupNames: string[];
    runtimeImport: string;
    typeOwner: Map<string, string>;
    outputs: ModuleOutput[];
    externs: Map<string, { imported: string; scheme: Scheme; curried: boolean }[]>;
  } & A,
  loaded: { stmts: Stmt[]; path: string; src: string } & B,
  opts: Opts,
) => Result<
  {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    aliases: Map<string, RecoveryAliasInfo>;
    typeOwner: Map<string, string>;
    dupNames: string[];
    runtimeImport: string;
    externs: Map<string, { imported: string; scheme: Scheme; curried: boolean }[]>;
    outputs: ModuleOutput[];
  },
  StageErr
> = _curry(
  3,
  <A, B>(
    ctx: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      aliases: Map<string, RecoveryAliasInfo>;
      dupNames: string[];
      runtimeImport: string;
      typeOwner: Map<string, string>;
      outputs: ModuleOutput[];
      externs: Map<string, { imported: string; scheme: Scheme; curried: boolean }[]>;
    } & A,
    loaded: { stmts: Stmt[]; path: string; src: string } & B,
    opts: Opts,
  ) =>
    ((_v) =>
      _v._tag === "Err"
        ? (({ error: e }) =>
            Err(atPath(loaded.path, e)) as Result<
              {
                exportsByPath: Map<string, Map<string, Scheme>>;
                regByPath: Map<string, Registry>;
                keysByPath: Map<string, Map<string, string[]>>;
                qualsByPath: Map<string, RecoveryQualScope>;
                aliases: Map<string, RecoveryAliasInfo>;
                typeOwner: Map<string, string>;
                dupNames: string[];
                runtimeImport: string;
                externs: Map<string, { imported: string; scheme: Scheme; curried: boolean }[]>;
                outputs: ModuleOutput[];
              },
              StageErr
            >)(_v)
        : _v._tag === "Ok"
          ? (({ value: res }) =>
              ((_v) =>
                _v._tag === "Err"
                  ? (({ error: e }) =>
                      Err(atPath(loaded.path, e)) as Result<
                        {
                          exportsByPath: Map<string, Map<string, Scheme>>;
                          regByPath: Map<string, Registry>;
                          keysByPath: Map<string, Map<string, string[]>>;
                          qualsByPath: Map<string, RecoveryQualScope>;
                          aliases: Map<string, RecoveryAliasInfo>;
                          typeOwner: Map<string, string>;
                          dupNames: string[];
                          runtimeImport: string;
                          externs: Map<
                            string,
                            { imported: string; scheme: Scheme; curried: boolean }[]
                          >;
                          outputs: ModuleOutput[];
                        },
                        StageErr
                      >)(_v)
                  : _v._tag === "Ok"
                    ? ((_v) =>
                        _v._tag === "Err"
                          ? (({ error: e }) =>
                              Err(atPath(loaded.path, e)) as Result<
                                {
                                  exportsByPath: Map<string, Map<string, Scheme>>;
                                  regByPath: Map<string, Registry>;
                                  keysByPath: Map<string, Map<string, string[]>>;
                                  qualsByPath: Map<string, RecoveryQualScope>;
                                  aliases: Map<string, RecoveryAliasInfo>;
                                  typeOwner: Map<string, string>;
                                  dupNames: string[];
                                  runtimeImport: string;
                                  externs: Map<
                                    string,
                                    { imported: string; scheme: Scheme; curried: boolean }[]
                                  >;
                                  outputs: ModuleOutput[];
                                },
                                StageErr
                              >)(_v)
                          : _v._tag === "Ok"
                            ? (({ value: r }) =>
                                ((body: string) =>
                                  ((lines: string[]) =>
                                    ((ts: string) =>
                                      Ok({
                                        exportsByPath: _Map_set(
                                          loaded.path,
                                          exportedSchemes(loaded.stmts, r.env),
                                          ctx.exportsByPath,
                                        ),
                                        regByPath: _Map_set(
                                          loaded.path,
                                          exportedRegistry(loaded.stmts),
                                          ctx.regByPath,
                                        ),
                                        keysByPath: _Map_set(
                                          loaded.path,
                                          exportedCtorKeys(loaded.stmts),
                                          ctx.keysByPath,
                                        ),
                                        qualsByPath: _Map_set(
                                          loaded.path,
                                          qualScopeOf(loaded.stmts, res.quals),
                                          ctx.qualsByPath,
                                        ),
                                        aliases: mergeMap(r.aliases, ctx.aliases),
                                        typeOwner: ctx.typeOwner,
                                        dupNames: ctx.dupNames,
                                        runtimeImport: ctx.runtimeImport,
                                        externs: externBindingsInto(
                                          loaded.stmts,
                                          loaded.path,
                                          r.env,
                                          ctx.externs,
                                        ),
                                        outputs: [...ctx.outputs, { path: loaded.path, js: ts }],
                                      }) as Result<
                                        {
                                          exportsByPath: Map<string, Map<string, Scheme>>;
                                          regByPath: Map<string, Registry>;
                                          keysByPath: Map<string, Map<string, string[]>>;
                                          qualsByPath: Map<string, RecoveryQualScope>;
                                          aliases: Map<string, RecoveryAliasInfo>;
                                          typeOwner: Map<string, string>;
                                          dupNames: string[];
                                          runtimeImport: string;
                                          externs: Map<
                                            string,
                                            { imported: string; scheme: Scheme; curried: boolean }[]
                                          >;
                                          outputs: ModuleOutput[];
                                        },
                                        StageErr
                                      >)(
                                      length(lines) === 0
                                        ? body
                                        : `${_Str_join("\n", lines)}

${body}`,
                                    ))(
                                    crossModuleTypeImports(
                                      body,
                                      loaded.path,
                                      localTypeNames(loaded.stmts),
                                      ctx.typeOwner,
                                    ),
                                  ))(
                                  emitTsModuleWith(
                                    loaded.stmts,
                                    r.env,
                                    r.types,
                                    r.letParams,
                                    aliasesForTs(
                                      mergeMap(r.aliases, ctx.aliases),
                                      aliasesOf(loaded.stmts),
                                      ctx.dupNames,
                                    ),
                                    res.keys,
                                    [] as string[],
                                    namespaceRuntime,
                                    preludeJsDefs,
                                    runtimeDeps,
                                    ctx.runtimeImport,
                                    opts.docs,
                                    bindingHooksFor(opts.plugins),
                                  ),
                                ))(_v)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(
                        inferProgramImportsTypes(
                          loaded.stmts,
                          builtins,
                          namespaces,
                          openMode(loaded.src, opts.open),
                          res.imports,
                          res.nsImports,
                          res.quals,
                          opts.plugins,
                        ),
                      )
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(checkWith(loaded.stmts, res.reg, res.quals)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(
      resolveImportsFrom(
        ctx,
        loaded.stmts,
        0,
        loaded.path,
        {
          imports: new Map<string, Scheme>(),
          nsImports: new Map<string, Map<string, Scheme>>(),
          reg: emptyReg,
          keys: new Map<string, string[]>(),
          quals: new Map<string, RecoveryQualScope>(),
        },
        false,
      ),
    ),
);
const noAliases: Map<string, RecoveryAliasInfo> = aliasesOf([] as Stmt[]);
const externOutputs: <B, C>(
  externs: Map<string, ({ scheme: { ty: Ty } & B; imported: string; curried: boolean } & C)[]>,
) => ModuleOutput[] = <B, C>(
  externs: Map<string, ({ scheme: { ty: Ty } & B; imported: string; curried: boolean } & C)[]>,
) =>
  map(
    (dp: string) => ({
      path: dp,
      js: externModuleDts(
        _Map_getOr(
          [] as ({ scheme: { ty: Ty } & B; imported: string; curried: boolean } & C)[],
          dp,
          externs,
        ),
        noAliases,
      ),
    }),
    _Map_keys(externs),
  );
const compileAllTs: <A>(
  ctx: {
    outputs: ModuleOutput[];
    externs: Map<string, { scheme: Scheme; imported: string; curried: boolean }[]>;
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    aliases: Map<string, RecoveryAliasInfo>;
    dupNames: string[];
    runtimeImport: string;
    typeOwner: Map<string, string>;
  },
  graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
  opts: Opts,
) => Result<ModuleOutput[], StageErr> = _curry(
  3,
  <A>(
    ctx: {
      outputs: ModuleOutput[];
      externs: Map<string, { scheme: Scheme; imported: string; curried: boolean }[]>;
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      aliases: Map<string, RecoveryAliasInfo>;
      dupNames: string[];
      runtimeImport: string;
      typeOwner: Map<string, string>;
    },
    graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
    opts: Opts,
  ) =>
    match(graph)
      .with(
        (_v) => _v.length === 0,
        () =>
          Ok(_Array_concat(ctx.outputs, externOutputs(ctx.externs))) as Result<
            ModuleOutput[],
            StageErr
          >,
      )
      .with(
        (_v) => _v.length >= 1,
        ([m, ...rest]) =>
          ((_v) =>
            _v._tag === "Err"
              ? (({ error: e }) => Err(e) as Result<ModuleOutput[], StageErr>)(_v)
              : _v._tag === "Ok"
                ? (({ value: ctx1 }) => compileAllTs(ctx1, rest, opts))(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(compileOneTs(ctx, m, opts)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * compileGraphTs : [Loaded] -> string -> Result [ModuleOutput] MErr
 * Emit the whole ordered graph as typed TypeScript (ADR 0090). Outputs are the
 * `.mochi` module paths (the writer swaps the extension) followed by the extern
 * sidecars, which already carry their own `.d.ts` / `.d.mts` extension.
 */
export const compileGraphTsWith: <A>(
  graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
  runtimeImport: string,
  opts: Opts,
) => Result<ModuleOutput[], StageErr> = _curry(
  3,
  <A>(
    graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
    runtimeImport: string,
    opts: Opts,
  ) => {
    const noted: { owner: Map<string, string>; dups: Set<string>; dupNames: string[] } =
      typeOwnerOf(graph);
    return compileAllTs(
      {
        exportsByPath: new Map<string, Map<string, Scheme>>(),
        regByPath: new Map<string, Registry>(),
        keysByPath: new Map<string, Map<string, string[]>>(),
        qualsByPath: new Map<string, RecoveryQualScope>(),
        aliases: new Map<string, RecoveryAliasInfo>(),
        typeOwner: noted.owner,
        dupNames: noted.dupNames,
        runtimeImport: runtimeImport,
        externs: new Map<string, { scheme: Scheme; imported: string; curried: boolean }[]>(),
        outputs: [] as ModuleOutput[],
      },
      graph,
      opts,
    );
  },
);
export const compileGraphTs: <A>(
  graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
  runtimeImport: string,
) => Result<ModuleOutput[], StageErr> = _curry(
  2,
  <A>(graph: ({ stmts: Stmt[]; path: string; src: string } & A)[], runtimeImport: string) =>
    compileGraphTsWith(graph, runtimeImport, defaultOpts),
);
const dtsOne: <A, B>(
  ctx: {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    target: string;
    aliases: Map<string, RecoveryAliasInfo>;
    runtimeImport: string;
    dts: string;
  } & A,
  loaded: { stmts: Stmt[]; path: string; src: string } & B,
  opts: Opts,
) => Result<
  {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    aliases: Map<string, RecoveryAliasInfo>;
    runtimeImport: string;
    target: string;
    dts: string;
  },
  StageErr
> = _curry(
  3,
  <A, B>(
    ctx: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      target: string;
      aliases: Map<string, RecoveryAliasInfo>;
      runtimeImport: string;
      dts: string;
    } & A,
    loaded: { stmts: Stmt[]; path: string; src: string } & B,
    opts: Opts,
  ) =>
    ((_v) =>
      _v._tag === "Err"
        ? (({ error: e }) =>
            Err(atPath(loaded.path, e)) as Result<
              {
                exportsByPath: Map<string, Map<string, Scheme>>;
                regByPath: Map<string, Registry>;
                keysByPath: Map<string, Map<string, string[]>>;
                qualsByPath: Map<string, RecoveryQualScope>;
                aliases: Map<string, RecoveryAliasInfo>;
                runtimeImport: string;
                target: string;
                dts: string;
              },
              StageErr
            >)(_v)
        : _v._tag === "Ok"
          ? (({ value: res }) =>
              ((_v) =>
                _v._tag === "Err"
                  ? (({ error: e }) =>
                      Err(atPath(loaded.path, e)) as Result<
                        {
                          exportsByPath: Map<string, Map<string, Scheme>>;
                          regByPath: Map<string, Registry>;
                          keysByPath: Map<string, Map<string, string[]>>;
                          qualsByPath: Map<string, RecoveryQualScope>;
                          aliases: Map<string, RecoveryAliasInfo>;
                          runtimeImport: string;
                          target: string;
                          dts: string;
                        },
                        StageErr
                      >)(_v)
                  : _v._tag === "Ok"
                    ? ((_v) =>
                        _v._tag === "Err"
                          ? (({ error: e }) =>
                              Err(atPath(loaded.path, e)) as Result<
                                {
                                  exportsByPath: Map<string, Map<string, Scheme>>;
                                  regByPath: Map<string, Registry>;
                                  keysByPath: Map<string, Map<string, string[]>>;
                                  qualsByPath: Map<string, RecoveryQualScope>;
                                  aliases: Map<string, RecoveryAliasInfo>;
                                  runtimeImport: string;
                                  target: string;
                                  dts: string;
                                },
                                StageErr
                              >)(_v)
                          : _v._tag === "Ok"
                            ? (({ value: r }) =>
                                Ok({
                                  exportsByPath: _Map_set(
                                    loaded.path,
                                    exportedSchemes(loaded.stmts, r.env),
                                    ctx.exportsByPath,
                                  ),
                                  regByPath: _Map_set(
                                    loaded.path,
                                    exportedRegistry(loaded.stmts),
                                    ctx.regByPath,
                                  ),
                                  keysByPath: _Map_set(
                                    loaded.path,
                                    exportedCtorKeys(loaded.stmts),
                                    ctx.keysByPath,
                                  ),
                                  qualsByPath: _Map_set(
                                    loaded.path,
                                    qualScopeOf(loaded.stmts, res.quals),
                                    ctx.qualsByPath,
                                  ),
                                  aliases: mergeMap(r.aliases, ctx.aliases),
                                  runtimeImport: ctx.runtimeImport,
                                  target: ctx.target,
                                  dts: eq(loaded.path, ctx.target)
                                    ? emitDtsFromTypedWith(
                                        loaded.stmts,
                                        r.env,
                                        mergeMap(r.aliases, ctx.aliases),
                                        qualifierMapOf(res.quals, localTypeNames(loaded.stmts)),
                                        ctx.runtimeImport,
                                        opts.docs,
                                        dtsHooksFor(opts.plugins),
                                        bindingHooksFor(opts.plugins),
                                      )
                                    : ctx.dts,
                                }) as Result<
                                  {
                                    exportsByPath: Map<string, Map<string, Scheme>>;
                                    regByPath: Map<string, Registry>;
                                    keysByPath: Map<string, Map<string, string[]>>;
                                    qualsByPath: Map<string, RecoveryQualScope>;
                                    aliases: Map<string, RecoveryAliasInfo>;
                                    runtimeImport: string;
                                    target: string;
                                    dts: string;
                                  },
                                  StageErr
                                >)(_v)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(
                        inferProgramImportsTypes(
                          loaded.stmts,
                          builtins,
                          namespaces,
                          openMode(loaded.src, opts.open),
                          res.imports,
                          res.nsImports,
                          res.quals,
                          opts.plugins,
                        ),
                      )
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(checkWith(loaded.stmts, res.reg, res.quals)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(
      resolveImportsFrom(
        ctx,
        loaded.stmts,
        0,
        loaded.path,
        {
          imports: new Map<string, Scheme>(),
          nsImports: new Map<string, Map<string, Scheme>>(),
          reg: emptyReg,
          keys: new Map<string, string[]>(),
          quals: new Map<string, RecoveryQualScope>(),
        },
        false,
      ),
    ),
);
const dtsAll: <A>(
  ctx: {
    dts: string;
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    target: string;
    aliases: Map<string, RecoveryAliasInfo>;
    runtimeImport: string;
  },
  graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
  opts: Opts,
) => Result<string, StageErr> = _curry(
  3,
  <A>(
    ctx: {
      dts: string;
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      target: string;
      aliases: Map<string, RecoveryAliasInfo>;
      runtimeImport: string;
    },
    graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
    opts: Opts,
  ) =>
    match(graph)
      .with(
        (_v) => _v.length === 0,
        () => Ok(ctx.dts) as Result<string, StageErr>,
      )
      .with(
        (_v) => _v.length >= 1,
        ([m, ...rest]) =>
          ((_v) =>
            _v._tag === "Err"
              ? (({ error: e }) => Err(e) as Result<string, StageErr>)(_v)
              : _v._tag === "Ok"
                ? (({ value: ctx1 }) => dtsAll(ctx1, rest, opts))(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(dtsOne(ctx, m, opts)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * emitDtsForFile : string -> string -> Result string MErr — `.d.ts` for one
 * file, typed through its own import graph so `Alias.T` resolves (ADR 0046).
 */
export const emitDtsForFileWith: _Curry<
  [entry: string, runtimeImport: string, opts: Opts],
  Result<string, StageErr>
> = _curry(3, (entry: string, runtimeImport: string, opts: Opts) =>
  _Result_flatMap(
    (graph) =>
      dtsAll(
        {
          exportsByPath: new Map<string, Map<string, Scheme>>(),
          regByPath: new Map<string, Registry>(),
          keysByPath: new Map<string, Map<string, string[]>>(),
          qualsByPath: new Map<string, RecoveryQualScope>(),
          aliases: new Map<string, RecoveryAliasInfo>(),
          runtimeImport: runtimeImport,
          target: absPath(entry),
          dts: "",
        },
        graph,
        opts,
      ),
    loadGraphWith(entry, opts.plugins),
  ),
);
export const emitDtsForFile: _Curry<
  [entry: string, runtimeImport: string],
  Result<string, StageErr>
> = _curry(2, (entry: string, runtimeImport: string) =>
  emitDtsForFileWith(entry, runtimeImport, defaultOpts),
);
/**
 * buildModulesTs : string -> string -> Result [ModuleOutput] [MErr]
 * Typed graph emit shares the recovery preflight with JS graph emit, so both
 * CLI targets render the same complete diagnostic set.
 */
export const buildModulesTsWith: _Curry<
  [entry: string, runtimeImport: string, opts: Opts],
  Result<ModuleOutput[], StageErr[]>
> = _curry(3, (entry: string, runtimeImport: string, opts: Opts) =>
  ((_v) =>
    _v._tag === "Err"
      ? (({ error: e }) => Err([e]) as Result<ModuleOutput[], StageErr[]>)(_v)
      : _v._tag === "Ok"
        ? (({ value: graph }) =>
            ((recovered: GraphRecovery) =>
              length(recovered.errors) === 0
                ? _Result_mapErr(
                    (e: StageErr) => [e],
                    compileGraphTsWith(graph, runtimeImport, opts),
                  )
                : (Err(recovered.errors) as Result<ModuleOutput[], StageErr[]>))(
              compileGraphRecoveringWith(graph, { ...opts, strictEntry: false }),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(loadGraphWith(entry, opts.plugins)),
);
export const buildModulesTs: _Curry<
  [entry: string, runtimeImport: string],
  Result<ModuleOutput[], StageErr[]>
> = _curry(2, (entry: string, runtimeImport: string) =>
  buildModulesTsWith(entry, runtimeImport, defaultOpts),
);
