import type { LocTok } from "../lexer/lexer";
import type { AliasField, Stmt, TypeExpr } from "../ast/ast";
import type { BinderSym, SpanAt, Ty, TypeAt } from "../infer/types";
import type { AliasInfo, Scheme } from "../infer/schemes";
import type { HookTok, HostPlugin, IErr, Plugin } from "../infer/infer";
import type { Occurrence, Origins, SymIndex, SymPrelude } from "../check/symbols";
import type { Opts, StageErr, Stamped } from "../compile/compile";

export type Loaded = { path: string; src: string; stmts: Stmt[] };
export type ModuleOutput = { path: string; js: string };
export type ExportOrigins = {
  values: Map<string, SpanAt>;
  types: Map<string, SpanAt>;
  ctors: Map<string, SpanAt>;
};
export type MErr = { kind: string; message: string; start: number; end: number };
export type Acc = { state: Map<string, string>; order: Loaded[] };
export type CtorInfo = { owner: string; arity: number };
export type Registry = { ctors: Map<string, CtorInfo>; types: Map<string, string[]> };
export type GraphRecovery = { outputs: ModuleOutput[]; errors: MErr[] };
export type RecoveryAliasInfo = { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> };
export type RecoveryQualScope = { types: Set<string>; aliases: Map<string, AliasInfo> };
export type RecoveryScheme = { vars: number[]; rvars: number[]; ty: Ty };
export type RecoveryCtx = {
  exportsByPath: Map<string, Map<string, Scheme>>;
  regByPath: Map<string, Registry>;
  keysByPath: Map<string, Map<string, string[]>>;
  qualsByPath: Map<string, RecoveryQualScope>;
  outputs: ModuleOutput[];
};
export type RecoveryGraphState = { ctx: RecoveryCtx; errors: MErr[] };

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
  _Option_match,
  _Option_unwrapOr,
  _Result_flatMap,
  _Result_mapErr,
  _Result_match,
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
  _compare,
  _compareFieldNames,
  _compareFirstKey,
  _compareRecords,
  _compareSortedKeys,
  _curry,
  _keyOf,
  _setAdd,
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

import { lex } from "../lexer/lexer";
import { parseWith } from "../parser/parser";
import { checkAllWith, checkWith } from "../check/check";
import { exportedRegistry, exportedCtorKeys, tagEntryOf } from "../ast/ctors";
import {
  inferProgramImports,
  inferProgramImportsTypes,
  exportedSchemes,
  scopeAliases,
} from "../infer/infer";
import { codegenWith, jsGenOpts } from "../codegen/codegen";
import * as Infer from "../infer/infer";
import * as Compile from "../compile/compile";
import { emitTsModuleWith, externModuleDts } from "../codegen/typescript";
import { showType, tVar } from "../infer/types";
import { widenLits } from "../infer/schemes";
import { index, indexWith, originsOf } from "../check/symbols";
import { emitDtsFromTypedWith, emitDtsText, qualifierMapOf } from "../dts/dts";
import { bindingHooksFor, dtsHooksFor } from "../extensions/extensions";
import { openMode } from "../compile/compile";
import { builtins } from "../prelude/prelude.gen.mjs";
import { namespaces } from "../prelude/prelude.gen.mjs";
import { namespaceRuntime } from "../prelude/prelude.gen.mjs";
import { preludeJsDefs } from "../prelude/prelude.gen.mjs";
import { runtimeDeps } from "../prelude/prelude.gen.mjs";
import * as Ast from "../ast/ast";
const emitDts$ = (src: string, runtimeImport: string): Result<string, Stamped[]> =>
  emitDtsText(src, runtimeImport);
/**
 * Host-facing `.d.ts` emit. Lives here for the same reason the TypeScript
 * mirror puts `emitDtsForFile` in its module driver: declaration emit is a
 * whole-file query the graph owns, not a single-expression one.
 */
export const emitDts: _Curry<
  [src: string, runtimeImport: string],
  Result<string, Stamped[]>
> = _curry(2, emitDts$);
/**
 * Host-facing lexical occurrence query. The index itself is source-owned;
 * this re-export makes it reachable from the frozen graph without teaching
 * host DX code about bootstrap's internal module layout.
 */
export const symbolOccurrences: (stmts: Stmt[]) => Occurrence[] = (stmts: Stmt[]) => index(stmts);
const symbolIndex$ = (
  path: string,
  origins: Origins,
  prelude: SymPrelude,
  stmts: Stmt[],
): SymIndex => indexWith(path, origins, prelude, stmts);
/**
 * Host-facing symbol index over all four spaces, imports resolved through
 * `origins` and builtins through the host's virtual `prelude`.
 */
export const symbolIndex: _Curry<
  [path: string, origins: Origins, prelude: SymPrelude, stmts: Stmt[]],
  SymIndex
> = _curry(4, symbolIndex$);
const exportedOrigins$ = (path: string, stmts: Stmt[]): Origins => originsOf(path, stmts);
/**
 * A module's export sites, the `origins` an importer's `symbolIndex` takes.
 */
export const exportedOrigins: _Curry<[path: string, stmts: Stmt[]], Origins> = _curry(
  2,
  exportedOrigins$,
);
const defaultOpts: Opts = {
  open: false,
  runtime: true,
  docs: true,
  moduleExt: ".js",
  strictEntry: false,
  plugins: None as Option<HostPlugin[]>,
  dtsTypeNames: new Map<string, string>(),
};

import { readFile } from "./host.mjs";
import { resolveImport as $resolveImport } from "./host.mjs";
const resolveImport = _curry(2, $resolveImport);
import { absPath } from "./host.mjs";
const mErr: (message: string) => MErr = (message: string) => ({
  kind: "check",
  message: message,
  start: 0,
  end: 0,
});
const stamp: <D>(kind: string, e: { end: number; start: number; message: string } & D) => MErr =
  _curry(2, <D>(kind: string, e: { end: number; start: number; message: string } & D) => ({
    kind: kind,
    message: e.message,
    start: e.start,
    end: e.end,
  }));
const recoveryScheme = { vars: [0], rvars: [], ty: tVar(0) };
const atPath: <C>(
  kind: string,
  path: string,
  e: { end: number; start: number; message: string } & C,
) => MErr = _curry(
  3,
  <C>(kind: string, path: string, e: { end: number; start: number; message: string } & C) => ({
    kind: kind,
    message: `module '${path}': ${e.message}`,
    start: e.start,
    end: e.end,
  }),
);
const firstAtPath: <A>(
  path: string,
  es: ({ end: number; start: number; message: string } & A)[],
) => MErr = _curry(
  2,
  <A>(path: string, es: ({ end: number; start: number; message: string } & A)[]) =>
    _Option_match(
      _Array_get(0, es),
      () => ({ kind: "type", message: `module '${path}': type error`, start: 0, end: 0 }),
      (e) => atPath("type", path, e),
    ),
);
const parseModule$ = (src: string, plugins: Option<HostPlugin[]>): Result<Stmt[], MErr> =>
  _Result_match(
    lex(src),
    (e) => Err(stamp("lex", e)) as Result<Stmt[], MErr>,
    (toks) =>
      _Result_match(
        parseWith(toks, plugins),
        (e) => Err(stamp("parse", e)) as Result<Stmt[], MErr>,
        (stmts) => Ok(stmts) as Result<Stmt[], MErr>,
      ),
  );
const parseModule: _Curry<
  [src: string, plugins: Option<HostPlugin[]>],
  Result<Stmt[], MErr>
> = _curry(2, parseModule$);
const importFromsFrom$ = (stmts: Stmt[], i: number, acc: string[]): string[] =>
  _Option_match(
    _Array_get(i, stmts),
    () => acc,
    (s) => {
      const $match = s;
      switch ($match._tag) {
        case "SImport": {
          const { from } = $match;
          return importFromsFrom$(stmts, i + 1, _Array_append(from, acc));
        }
        case "SImportNs": {
          const { from } = $match;
          return importFromsFrom$(stmts, i + 1, _Array_append(from, acc));
        }
        default: {
          return importFromsFrom$(stmts, i + 1, acc);
        }
      }
    },
  );
const importFromsFrom: _Curry<[stmts: Stmt[], i: number, acc: string[]], string[]> = _curry(
  3,
  importFromsFrom$,
);
const importFroms: (stmts: Stmt[]) => string[] = (stmts: Stmt[]) =>
  importFromsFrom$(stmts, 0, [] as string[]);

const visit$ = (path: string, acc: Acc, plugins: Option<HostPlugin[]>): Result<Acc, MErr> =>
  ((_v) =>
    _v._tag === "Some" && _v.value === "done"
      ? (Ok(acc) as Result<Acc, MErr>)
      : _v._tag === "Some" && _v.value === "loading"
        ? (Err(mErr(`import cycle through '${path}'`)) as Result<Acc, MErr>)
        : ((acc1: Acc) =>
            _Result_match(
              readFile(path),
              () => Err(mErr(`cannot read module '${path}'`)) as Result<Acc, MErr>,
              (src) =>
                _Result_match(
                  parseModule$(src, plugins),
                  (e) => Err(e) as Result<Acc, MErr>,
                  (stmts) =>
                    _Result_match(
                      visitAll$(importFroms(stmts), path, acc1, plugins),
                      (e) => Err(e) as Result<Acc, MErr>,
                      (acc2) =>
                        Ok({
                          state: _Map_set(path, "done", acc2.state),
                          order: _Array_append({ path: path, src: src, stmts: stmts }, acc2.order),
                        }) as Result<Acc, MErr>,
                    ),
                ),
            ))({ state: _Map_set(path, "loading", acc.state), order: acc.order }))(
    _Map_get(path, acc.state),
  );
const visit: _Curry<
  [path: string, acc: Acc, plugins: Option<HostPlugin[]>],
  Result<Acc, MErr>
> = _curry(3, visit$);
const visitAll$ = (
  froms: string[],
  importer: string,
  acc: Acc,
  plugins: Option<HostPlugin[]>,
): Result<Acc, MErr> =>
  ((_v) =>
    _v.length === 0
      ? (Ok(acc) as Result<Acc, MErr>)
      : _v.length >= 1
        ? (([from, ...rest]) =>
            _Result_match(
              visit$(resolveImport(importer, from), acc, plugins),
              (e) => Err(e) as Result<Acc, MErr>,
              (acc1) => visitAll$(rest, importer, acc1, plugins),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(froms);
const visitAll: _Curry<
  [froms: string[], importer: string, acc: Acc, plugins: Option<HostPlugin[]>],
  Result<Acc, MErr>
> = _curry(4, visitAll$);
const loadGraphWith$ = (entry: string, plugins: Option<HostPlugin[]>): Result<Loaded[], MErr> =>
  _Result_flatMap(
    (acc) => Ok(acc.order) as Result<Loaded[], MErr>,
    visit$(absPath(entry), { state: new Map<string, string>(), order: [] as Loaded[] }, plugins),
  );
/**
 * loadGraphWith : string -> Option [Plugin] -> Result [Loaded] MErr
 * Load every module reachable from `entry`, in dependency order, parsing
 * each under the host's plugin list (ADR 0109).
 */
export const loadGraphWith: _Curry<
  [entry: string, plugins: Option<HostPlugin[]>],
  Result<Loaded[], MErr>
> = _curry(2, loadGraphWith$);
/**
 * loadGraph : string -> Result [Loaded] MErr — default plugins.
 */
export const loadGraph: (entry: string) => Result<Loaded[], MErr> = (entry: string) =>
  loadGraphWith$(entry, None as Option<HostPlugin[]>);

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
            _Option_match(
              _Map_get(k, from),
              () => into,
              (v) => _Map_set(k, v, into),
            ),
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
const aliasesOf: (stmts: Stmt[]) => Map<string, AliasInfo> = (stmts: Stmt[]) =>
  reduce(
    _curry(2, (acc: Map<string, AliasInfo>, s: Stmt) =>
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
    new Map<string, AliasInfo>(),
    stmts,
  );
const qualScopeOf: <A, B>(
  stmts: Stmt[],
  quals: Map<
    string,
    {
      aliases: Map<string, { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] } & A>;
    } & B
  >,
) => RecoveryQualScope = _curry(
  2,
  <A, B>(
    stmts: Stmt[],
    quals: Map<
      string,
      {
        aliases: Map<
          string,
          { expr: Option<TypeExpr>; fields: AliasField[]; params: string[] } & A
        >;
      } & B
    >,
  ) => ({ types: exportedTypeNames(stmts), aliases: scopeAliases(stmts, quals) }),
);
const withTagEntry$ = (
  name: string,
  depKeys: Map<string, string[]>,
  keys: Map<string, string[]>,
): Map<string, string[]> =>
  _Option_match(
    _Map_get(tagEntryOf(name), depKeys),
    () => keys,
    (t) => _Map_set(tagEntryOf(name), t, keys),
  );
const withTagEntry: _Curry<
  [name: string, depKeys: Map<string, string[]>, keys: Map<string, string[]>],
  Map<string, string[]>
> = _curry(3, withTagEntry$);
const withNamedCtor: <A, B, C, D, E, F, G, H, I>(
  name: string,
  info: { owner: A } & F,
  depReg: { types: Map<A, B> } & G,
  depKeys: Map<string, string[]>,
  res: {
    quals: C;
    keys: Map<string, string[]>;
    reg: { types: Map<A, B>; ctors: Map<string, { owner: A } & F> } & H;
    nsImports: D;
    imports: E;
  } & I,
) => {
  imports: E;
  nsImports: D;
  reg: { ctors: Map<string, { owner: A } & F>; types: Map<A, B> };
  keys: Map<string, string[]>;
  quals: C;
} = _curry(
  5,
  <A, B, C, D, E, F, G, H, I>(
    name: string,
    info: { owner: A } & F,
    depReg: { types: Map<A, B> } & G,
    depKeys: Map<string, string[]>,
    res: {
      quals: C;
      keys: Map<string, string[]>;
      reg: { types: Map<A, B>; ctors: Map<string, { owner: A } & F> } & H;
      nsImports: D;
      imports: E;
    } & I,
  ) => ({
    imports: res.imports,
    nsImports: res.nsImports,
    reg: {
      ctors: _Map_set(name, info, res.reg.ctors),
      types: _Option_match(
        _Map_get(info.owner, depReg.types),
        () => res.reg.types,
        (cs) => _Map_set(info.owner, cs, res.reg.types),
      ),
    },
    keys: _Option_match(
      _Map_get(name, depKeys),
      () => res.keys,
      (ks) => withTagEntry$(name, depKeys, _Map_set(name, ks, res.keys)),
    ),
    quals: res.quals,
  }),
);
const takeNamedCtor: <C, D, E, F, G, H, I, J>(
  name: string,
  span: { end: number; start: number } & H,
  depReg: { ctors: Map<string, { owner: C } & I>; types: Map<C, D> } & J,
  depKeys: Map<string, string[]>,
  res: {
    reg: { ctors: Map<string, { owner: C } & I>; types: Map<C, D> };
    quals: E;
    keys: Map<string, string[]>;
    nsImports: F;
    imports: G;
  },
) => Result<
  {
    reg: { ctors: Map<string, { owner: C } & I>; types: Map<C, D> };
    quals: E;
    keys: Map<string, string[]>;
    nsImports: F;
    imports: G;
  },
  MErr
> = _curry(
  5,
  <C, D, E, F, G, H, I, J>(
    name: string,
    span: { end: number; start: number } & H,
    depReg: { ctors: Map<string, { owner: C } & I>; types: Map<C, D> } & J,
    depKeys: Map<string, string[]>,
    res: {
      reg: { ctors: Map<string, { owner: C } & I>; types: Map<C, D> };
      quals: E;
      keys: Map<string, string[]>;
      nsImports: F;
      imports: G;
    },
  ) =>
    _Option_match(
      _Map_get(name, depReg.ctors),
      () => Ok(res),
      (info) =>
        _Option_match(
          _Map_get(name, res.reg.ctors),
          () => Ok(withNamedCtor(name, info, depReg, depKeys, res)),
          (prior) =>
            !eq(prior.owner, info.owner)
              ? Err({
                  kind: "check",
                  message: `duplicate constructor '${name}'`,
                  start: span.start,
                  end: span.end,
                })
              : Ok(withNamedCtor(name, info, depReg, depKeys, res)),
        ),
    ),
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
                _Option_match(
                  _Map_get(k, from),
                  () => into,
                  (v) => _Map_set(`${alias}.${k}`, v, into),
                ),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(keys),
);
const resolveNames: <D, E, F, G, H, I, J, K>(
  names: ({ name: string; span: { end: number; start: number } & H } & I)[],
  from: string,
  depExports: Map<string, Scheme>,
  depReg: { ctors: Map<string, { owner: D } & J>; types: Map<D, E> } & K,
  depKeys: Map<string, string[]>,
  res: {
    quals: F;
    keys: Map<string, string[]>;
    reg: { ctors: Map<string, { owner: D } & J>; types: Map<D, E> };
    nsImports: G;
    imports: Map<string, Scheme>;
  },
  recovering: boolean,
) => Result<
  {
    quals: F;
    keys: Map<string, string[]>;
    reg: { ctors: Map<string, { owner: D } & J>; types: Map<D, E> };
    nsImports: G;
    imports: Map<string, Scheme>;
  },
  MErr
> = _curry(
  7,
  <D, E, F, G, H, I, J, K>(
    names: ({ name: string; span: { end: number; start: number } & H } & I)[],
    from: string,
    depExports: Map<string, Scheme>,
    depReg: { ctors: Map<string, { owner: D } & J>; types: Map<D, E> } & K,
    depKeys: Map<string, string[]>,
    res: {
      quals: F;
      keys: Map<string, string[]>;
      reg: { ctors: Map<string, { owner: D } & J>; types: Map<D, E> };
      nsImports: G;
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
          _Option_match(
            _Map_get(n.name, depExports),
            () =>
              recovering
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
                    kind: "check",
                    message: `'${from}' has no export '${n.name}'`,
                    start: n.span.start,
                    end: n.span.end,
                  }),
            (sc) =>
              _Result_match(
                takeNamedCtor(n.name, n.span, depReg, depKeys, {
                  imports: _Map_set(n.name, sc, res.imports),
                  nsImports: res.nsImports,
                  reg: res.reg,
                  keys: res.keys,
                  quals: res.quals,
                }),
                (e) => Err(e),
                (res1) => resolveNames(rest, from, depExports, depReg, depKeys, res1, recovering),
              ),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const resolveImportsFrom: <B, C>(
  ctx: {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, B>;
  } & C,
  stmts: Stmt[],
  i: number,
  path: string,
  res: {
    quals: Map<string, B>;
    keys: Map<string, string[]>;
    reg: Registry;
    nsImports: Map<string, Map<string, Scheme>>;
    imports: Map<string, Scheme>;
  },
  recovering: boolean,
) => Result<
  {
    quals: Map<string, B>;
    keys: Map<string, string[]>;
    reg: Registry;
    nsImports: Map<string, Map<string, Scheme>>;
    imports: Map<string, Scheme>;
  },
  MErr
> = _curry(
  6,
  <B, C>(
    ctx: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, B>;
    } & C,
    stmts: Stmt[],
    i: number,
    path: string,
    res: {
      quals: Map<string, B>;
      keys: Map<string, string[]>;
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
                    ((depKeys: Map<string, string[]>) =>
                      _Result_match(
                        resolveNames(names, from, depExports, depReg, depKeys, res, recovering),
                        (e) => Err(e),
                        (res1) => resolveImportsFrom(ctx, stmts, i + 1, path, res1, recovering),
                      ))(_Map_getOr(new Map<string, string[]>(), dp, ctx.keysByPath)))(
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
                      ((depKeys: Map<string, string[]>) =>
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
                            quals: _Option_match(
                              _Map_get(dp, ctx.qualsByPath),
                              () => res.quals,
                              (q) => _Map_set(alias.name, q, res.quals),
                            ),
                          },
                          recovering,
                        ))(_Map_getOr(new Map<string, string[]>(), dp, ctx.keysByPath)))(
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
const openFor$ = (loaded: Loaded, isEntry: boolean, opts: Opts): boolean =>
  and(isEntry, opts.strictEntry) ? opts.open : openMode(loaded.src, opts.open);
const openFor: _Curry<[loaded: Loaded, isEntry: boolean, opts: Opts], boolean> = _curry(
  3,
  openFor$,
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
) => Result<RecoveryCtx, MErr[]> = _curry(
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
    _Result_match(
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
      (e) => Err([atPath("check", loaded.path, e)]) as Result<RecoveryCtx, MErr[]>,
      (res) =>
        _Result_match(
          checkWith(loaded.stmts, res.reg, res.quals),
          (e) => Err([atPath("check", loaded.path, e)]) as Result<RecoveryCtx, MErr[]>,
          () =>
            _Result_match(
              inferProgramImports(
                loaded.stmts,
                builtins,
                namespaces,
                openFor$(loaded, isEntry, opts),
                res.imports,
                res.nsImports,
                res.quals,
                opts.plugins,
              ),
              (es) =>
                Err(map((e: IErr) => atPath("type", loaded.path, e), es)) as Result<
                  RecoveryCtx,
                  MErr[]
                >,
              (env) => {
                const js: string = codegenWith(
                  loaded.stmts,
                  res.keys,
                  opts.runtime,
                  namespaceRuntime,
                  preludeJsDefs,
                  runtimeDeps,
                  { ...jsGenOpts, docs: opts.docs, moduleExt: opts.moduleExt },
                );
                return Ok({
                  exportsByPath: _Map_set(
                    loaded.path,
                    exportedSchemes(loaded.stmts, env),
                    ctx.exportsByPath,
                  ),
                  regByPath: _Map_set(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath),
                  keysByPath: _Map_set(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath),
                  qualsByPath: _Map_set(
                    loaded.path,
                    qualScopeOf(loaded.stmts, res.quals),
                    ctx.qualsByPath,
                  ),
                  outputs: [...ctx.outputs, { path: loaded.path, js: js }],
                }) as Result<RecoveryCtx, MErr[]>;
              },
            ),
        ),
    ),
);
const compileAll$ = (
  ctx: RecoveryCtx,
  graph: Loaded[],
  opts: Opts,
): Result<ModuleOutput[], MErr[]> =>
  ((_v) =>
    _v.length === 0
      ? (Ok(ctx.outputs) as Result<ModuleOutput[], MErr[]>)
      : _v.length >= 1
        ? (([m, ...rest]) =>
            _Result_match(
              compileOne(ctx, m, false, length(rest) === 0, opts),
              (e) => Err(e) as Result<ModuleOutput[], MErr[]>,
              (ctx1) => compileAll$(ctx1, rest, opts),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(graph);
const compileAll: _Curry<
  [ctx: RecoveryCtx, graph: Loaded[], opts: Opts],
  Result<ModuleOutput[], MErr[]>
> = _curry(3, compileAll$);
const compileGraphWith$ = (graph: Loaded[], opts: Opts): Result<ModuleOutput[], MErr[]> =>
  compileAll$(
    {
      exportsByPath: new Map<string, Map<string, Scheme>>(),
      regByPath: new Map<string, Registry>(),
      keysByPath: new Map<string, Map<string, string[]>>(),
      qualsByPath: new Map<string, RecoveryQualScope>(),
      outputs: [] as ModuleOutput[],
    },
    graph,
    opts,
  );
/**
 * compileGraph : [Loaded] -> Result [ModuleOutput] [MErr]
 * Spelled out (not point-free `compileAll(ctx0)`): the TS backend types a
 * multi-param function uncurried, so a partial application is a tsc error.
 */
export const compileGraphWith: _Curry<
  [graph: Loaded[], opts: Opts],
  Result<ModuleOutput[], MErr[]>
> = _curry(2, compileGraphWith$);
export const compileGraph: (graph: Loaded[]) => Result<ModuleOutput[], MErr[]> = (
  graph: Loaded[],
) => compileGraphWith$(graph, defaultOpts);

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
const checkErrorsRecovering: <B, C>(
  ctx: {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, { types: Set<string> } & B>;
  } & C,
  loaded: Loaded,
) => MErr[] = _curry(
  2,
  <B, C>(
    ctx: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, { types: Set<string> } & B>;
    } & C,
    loaded: Loaded,
  ) => {
    const importErrors: MErr[] = depsPublished(ctx, loaded.stmts, 0, loaded.path)
      ? _Result_match(
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
              quals: new Map<string, { types: Set<string> } & B>(),
            },
            false,
          ),
          (e) => [atPath("check", loaded.path, e)],
          () => [] as MErr[],
        )
      : ([] as MErr[]);
    return _Result_match(
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
          quals: new Map<string, { types: Set<string> } & B>(),
        },
        true,
      ),
      (e) => [atPath("check", loaded.path, e)],
      (res) =>
        _Result_match(
          checkAllWith(loaded.stmts, res.reg, res.quals),
          (es) =>
            _Array_concat(
              importErrors,
              map((e: StageErr) => atPath("check", loaded.path, e), es),
            ),
          () => importErrors,
        ),
    );
  },
);
const sameErr$ = (a: MErr, b: MErr): boolean =>
  and(
    and(and(eq(a.kind, b.kind), eq(a.message, b.message)), eq(a.start, b.start)),
    eq(a.end, b.end),
  );
const sameErr: _Curry<[a: MErr, b: MErr], boolean> = _curry(2, sameErr$);
const mergeRecovered$ = (es: MErr[], checks: MErr[]): MErr[] =>
  _Array_concat(
    checks,
    filter((e: MErr) => length(filter((c: MErr) => sameErr$(c, e), checks)) === 0, es),
  );
const mergeRecovered: _Curry<[es: MErr[], checks: MErr[]], MErr[]> = _curry(2, mergeRecovered$);
const recoverOne$ = (
  ctx: RecoveryCtx,
  m: Loaded,
  isEntry: boolean,
  errors: MErr[],
  opts: Opts,
): RecoveryGraphState =>
  _Result_match(
    compileOne(ctx, m, true, isEntry, opts),
    (es) => {
      const checks: MErr[] = checkErrorsRecovering(ctx, m);
      return { ctx: ctx, errors: _Array_concat(errors, mergeRecovered$(es, checks)) };
    },
    (ctx1) => ({ ctx: ctx1, errors: errors }),
  );
const recoverOne: _Curry<
  [ctx: RecoveryCtx, m: Loaded, isEntry: boolean, errors: MErr[], opts: Opts],
  RecoveryGraphState
> = _curry(5, recoverOne$);
const compileAllRecovering$ = (
  ctx: RecoveryCtx,
  graph: Loaded[],
  errors: MErr[],
  opts: Opts,
): RecoveryGraphState =>
  ((_v) =>
    _v.length === 0
      ? { ctx: ctx, errors: errors }
      : _v.length >= 1
        ? (([m, ...rest]) =>
            ((next: RecoveryGraphState) =>
              compileAllRecovering$(next.ctx, rest, next.errors, opts))(
              recoverOne$(ctx, m, length(rest) === 0, errors, opts),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(graph);
const compileAllRecovering: _Curry<
  [ctx: RecoveryCtx, graph: Loaded[], errors: MErr[], opts: Opts],
  RecoveryGraphState
> = _curry(4, compileAllRecovering$);
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
  errors: [] as MErr[],
});
/**
 * recoverGraphFrom : RecoveryGraphState -> [Loaded] -> RecoveryGraphState
 * Advance a graph recovery state by a dependency-ordered suffix.
 */
export const recoverGraphFromWith: <A>(
  state: { ctx: RecoveryCtx; errors: MErr[] } & A,
  graph: Loaded[],
  opts: Opts,
) => RecoveryGraphState = _curry(
  3,
  <A>(state: { ctx: RecoveryCtx; errors: MErr[] } & A, graph: Loaded[], opts: Opts) =>
    compileAllRecovering$(state.ctx, graph, state.errors, opts),
);
export const recoverGraphFrom: <A>(
  state: { ctx: RecoveryCtx; errors: MErr[] } & A,
  graph: Loaded[],
) => RecoveryGraphState = _curry(
  2,
  <A>(state: { ctx: RecoveryCtx; errors: MErr[] } & A, graph: Loaded[]) =>
    recoverGraphFromWith(state, graph, defaultOpts),
);
const recoverModuleWith$ = (
  state: RecoveryGraphState,
  loaded: Loaded,
  isEntry: boolean,
  opts: Opts,
): RecoveryGraphState => recoverOne$(state.ctx, loaded, isEntry, state.errors, opts);
/**
 * recoverModuleWith : RecoveryGraphState -> Loaded -> bool -> Compile.Opts -> RecoveryGraphState
 * Recover one module on top of a state that already holds its dependencies.
 * A host stepping module by module says which one is the entry: a one-module
 * suffix cannot tell, and `strictEntry` judges only the entry strictly.
 */
export const recoverModuleWith: _Curry<
  [state: RecoveryGraphState, loaded: Loaded, isEntry: boolean, opts: Opts],
  RecoveryGraphState
> = _curry(4, recoverModuleWith$);
const keepOnly: <A, B>(key: A, keys: A[], i: number, m: Map<A, B>) => Map<A, B> = _curry(
  4,
  <A, B>(key: A, keys: A[], i: number, m: Map<A, B>) =>
    _Option_match(
      _Array_get(i, keys),
      () => m,
      (k) => keepOnly(key, keys, i + 1, eq(k, key) ? m : _Map_delete(k, m)),
    ),
);
const onlyAt: <A, B>(key: A, m: Map<A, B>) => Map<A, B> = _curry(2, <A, B>(key: A, m: Map<A, B>) =>
  keepOnly(key, _Map_keys(m), 0, m),
);
const recoverySliceOf$ = (state: RecoveryGraphState, path: string): RecoveryGraphState => ({
  ctx: {
    exportsByPath: onlyAt(path, state.ctx.exportsByPath),
    regByPath: onlyAt(path, state.ctx.regByPath),
    keysByPath: onlyAt(path, state.ctx.keysByPath),
    qualsByPath: onlyAt(path, state.ctx.qualsByPath),
    outputs: filter((o: ModuleOutput) => eq(o.path, path), state.ctx.outputs),
  },
  errors: [] as { end: number; kind: string; message: string; start: number }[],
});
/**
 * recoverySliceOf : RecoveryGraphState -> string -> RecoveryGraphState
 * The entries `path` published into `state`, and no errors: the host keeps
 * each module's errors itself, as the suffix `recoverModuleWith` appended.
 */
export const recoverySliceOf: _Curry<
  [state: RecoveryGraphState, path: string],
  RecoveryGraphState
> = _curry(2, recoverySliceOf$);
const mergeRecoveryStates$ = (
  a: RecoveryGraphState,
  b: RecoveryGraphState,
): RecoveryGraphState => ({
  ctx: {
    exportsByPath: mergeMap(b.ctx.exportsByPath, a.ctx.exportsByPath),
    regByPath: mergeMap(b.ctx.regByPath, a.ctx.regByPath),
    keysByPath: mergeMap(b.ctx.keysByPath, a.ctx.keysByPath),
    qualsByPath: mergeMap(b.ctx.qualsByPath, a.ctx.qualsByPath),
    outputs: _Array_concat(a.ctx.outputs, b.ctx.outputs),
  },
  errors: _Array_concat(a.errors, b.errors),
});
/**
 * mergeRecoveryStates : RecoveryGraphState -> RecoveryGraphState -> RecoveryGraphState
 * `b`'s modules after `a`'s. Slices hold disjoint paths, so no entry is lost.
 */
export const mergeRecoveryStates: _Curry<
  [a: RecoveryGraphState, b: RecoveryGraphState],
  RecoveryGraphState
> = _curry(2, mergeRecoveryStates$);
const compileGraphRecoveringWith$ = (graph: Loaded[], opts: Opts): GraphRecovery => {
  const state: RecoveryGraphState = recoverGraphFromWith(freshRecoveryGraphState(), graph, opts);
  return { outputs: state.ctx.outputs, errors: state.errors };
};
/**
 * Recovery graph driver: keeps checking after failures and gives downstream
 * imports a polymorphic placeholder rather than an unbound-name cascade.
 */
export const compileGraphRecoveringWith: _Curry<[graph: Loaded[], opts: Opts], GraphRecovery> =
  _curry(2, compileGraphRecoveringWith$);
export const compileGraphRecovering: (graph: Loaded[]) => GraphRecovery = (graph: Loaded[]) =>
  compileGraphRecoveringWith$(graph, defaultOpts);
const inferOne: <A, B>(
  ctx: {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    outputs: {
      path: string;
      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
      aliases: Map<string, AliasInfo>;
      imports: Map<string, Scheme>;
      quals: Map<string, RecoveryQualScope>;
    }[];
    aliases: Map<string, AliasInfo>;
  } & A,
  loaded: { stmts: Stmt[]; path: string; src: string } & B,
  opts: Opts,
) => Result<
  {
    exportsByPath: Map<string, Map<string, Scheme>>;
    regByPath: Map<string, Registry>;
    keysByPath: Map<string, Map<string, string[]>>;
    qualsByPath: Map<string, RecoveryQualScope>;
    aliases: Map<string, AliasInfo>;
    outputs: {
      path: string;
      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
      aliases: Map<string, AliasInfo>;
      imports: Map<string, Scheme>;
      quals: Map<string, RecoveryQualScope>;
    }[];
  },
  MErr
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
        types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
        aliases: Map<string, AliasInfo>;
        imports: Map<string, Scheme>;
        quals: Map<string, RecoveryQualScope>;
      }[];
      aliases: Map<string, AliasInfo>;
    } & A,
    loaded: { stmts: Stmt[]; path: string; src: string } & B,
    opts: Opts,
  ) =>
    _Result_match(
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
      (e) =>
        Err(atPath("check", loaded.path, e)) as Result<
          {
            exportsByPath: Map<string, Map<string, Scheme>>;
            regByPath: Map<string, Registry>;
            keysByPath: Map<string, Map<string, string[]>>;
            qualsByPath: Map<string, RecoveryQualScope>;
            aliases: Map<string, AliasInfo>;
            outputs: {
              path: string;
              types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
              aliases: Map<string, AliasInfo>;
              imports: Map<string, Scheme>;
              quals: Map<string, RecoveryQualScope>;
            }[];
          },
          MErr
        >,
      (res) =>
        _Result_match(
          checkWith(loaded.stmts, res.reg, res.quals),
          (e) =>
            Err(atPath("check", loaded.path, e)) as Result<
              {
                exportsByPath: Map<string, Map<string, Scheme>>;
                regByPath: Map<string, Registry>;
                keysByPath: Map<string, Map<string, string[]>>;
                qualsByPath: Map<string, RecoveryQualScope>;
                aliases: Map<string, AliasInfo>;
                outputs: {
                  path: string;
                  types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
                  aliases: Map<string, AliasInfo>;
                  imports: Map<string, Scheme>;
                  quals: Map<string, RecoveryQualScope>;
                }[];
              },
              MErr
            >,
          () =>
            _Result_match(
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
              (es) =>
                Err(firstAtPath(loaded.path, es)) as Result<
                  {
                    exportsByPath: Map<string, Map<string, Scheme>>;
                    regByPath: Map<string, Registry>;
                    keysByPath: Map<string, Map<string, string[]>>;
                    qualsByPath: Map<string, RecoveryQualScope>;
                    aliases: Map<string, AliasInfo>;
                    outputs: {
                      path: string;
                      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
                      aliases: Map<string, AliasInfo>;
                      imports: Map<string, Scheme>;
                      quals: Map<string, RecoveryQualScope>;
                    }[];
                  },
                  MErr
                >,
              (r) =>
                Ok({
                  exportsByPath: _Map_set(
                    loaded.path,
                    exportedSchemes(loaded.stmts, r.env),
                    ctx.exportsByPath,
                  ),
                  regByPath: _Map_set(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath),
                  keysByPath: _Map_set(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath),
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
                          sym: hit.sym,
                        }),
                        r.types,
                      ),
                      aliases: mergeMap(r.aliases, ctx.aliases),
                      imports: res.imports,
                      quals: res.quals,
                    },
                  ],
                }) as Result<
                  {
                    exportsByPath: Map<string, Map<string, Scheme>>;
                    regByPath: Map<string, Registry>;
                    keysByPath: Map<string, Map<string, string[]>>;
                    qualsByPath: Map<string, RecoveryQualScope>;
                    aliases: Map<string, AliasInfo>;
                    outputs: {
                      path: string;
                      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
                      aliases: Map<string, AliasInfo>;
                      imports: Map<string, Scheme>;
                      quals: Map<string, RecoveryQualScope>;
                    }[];
                  },
                  MErr
                >,
            ),
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
      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
      aliases: Map<string, AliasInfo>;
      imports: Map<string, Scheme>;
      quals: Map<string, RecoveryQualScope>;
    }[];
    aliases: Map<string, AliasInfo>;
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
      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
      aliases: Map<string, AliasInfo>;
      imports: Map<string, Scheme>;
      quals: Map<string, RecoveryQualScope>;
    }[];
    aliases: Map<string, AliasInfo>;
  },
  MErr
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
        types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
        aliases: Map<string, AliasInfo>;
        imports: Map<string, Scheme>;
        quals: Map<string, RecoveryQualScope>;
      }[];
      aliases: Map<string, AliasInfo>;
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
                types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
                aliases: Map<string, AliasInfo>;
                imports: Map<string, Scheme>;
                quals: Map<string, RecoveryQualScope>;
              }[];
              aliases: Map<string, AliasInfo>;
            },
            MErr
          >,
      )
      .with(
        (_v) => _v.length >= 1,
        ([m, ...rest]) =>
          _Result_match(
            inferOne(ctx, m, opts),
            (e) =>
              Err(e) as Result<
                {
                  exportsByPath: Map<string, Map<string, Scheme>>;
                  regByPath: Map<string, Registry>;
                  keysByPath: Map<string, Map<string, string[]>>;
                  qualsByPath: Map<string, RecoveryQualScope>;
                  outputs: {
                    path: string;
                    types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
                    aliases: Map<string, AliasInfo>;
                    imports: Map<string, Scheme>;
                    quals: Map<string, RecoveryQualScope>;
                  }[];
                  aliases: Map<string, AliasInfo>;
                },
                MErr
              >,
            (ctx1) => inferAll(ctx1, rest, opts),
          ),
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
      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
      aliases: Map<string, AliasInfo>;
      imports: Map<string, Scheme>;
      quals: Map<string, RecoveryQualScope>;
    }[];
    aliases: Map<string, AliasInfo>;
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
      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
      aliases: Map<string, AliasInfo>;
      imports: Map<string, Scheme>;
      quals: Map<string, RecoveryQualScope>;
    }[];
    aliases: Map<string, AliasInfo>;
  },
  MErr
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
        types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
        aliases: Map<string, AliasInfo>;
        imports: Map<string, Scheme>;
        quals: Map<string, RecoveryQualScope>;
      }[];
      aliases: Map<string, AliasInfo>;
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
      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
      aliases: Map<string, AliasInfo>;
      imports: Map<string, Scheme>;
      quals: Map<string, RecoveryQualScope>;
    }[];
    aliases: Map<string, AliasInfo>;
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
      types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
      aliases: Map<string, AliasInfo>;
      imports: Map<string, Scheme>;
      quals: Map<string, RecoveryQualScope>;
    }[];
    aliases: Map<string, AliasInfo>;
  },
  MErr
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
        types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
        aliases: Map<string, AliasInfo>;
        imports: Map<string, Scheme>;
        quals: Map<string, RecoveryQualScope>;
      }[];
      aliases: Map<string, AliasInfo>;
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
    types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
    aliases: Map<string, AliasInfo>;
    imports: Map<string, Scheme>;
    quals: Map<string, RecoveryQualScope>;
  }[],
  MErr
> = _curry(2, <A>(graph: ({ stmts: Stmt[]; path: string; src: string } & A)[], opts: Opts) =>
  _Result_flatMap(
    (state) =>
      Ok(state.outputs) as Result<
        {
          path: string;
          types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
          aliases: Map<string, AliasInfo>;
          imports: Map<string, Scheme>;
          quals: Map<string, RecoveryQualScope>;
        }[],
        MErr
      >,
    inferGraphTypesFromWith(freshInferGraphState(), graph, opts),
  ),
);
export const inferGraphTypes: <A>(
  graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
) => Result<
  {
    path: string;
    types: { span: SpanAt; ty: Ty; display: string; sym: Option<BinderSym> }[];
    aliases: Map<string, AliasInfo>;
    imports: Map<string, Scheme>;
    quals: Map<string, RecoveryQualScope>;
  }[],
  MErr
> = <A>(graph: ({ stmts: Stmt[]; path: string; src: string } & A)[]) =>
  inferGraphTypesWith(graph, defaultOpts);
const buildModulesWith$ = (entry: string, opts: Opts): Result<ModuleOutput[], MErr[]> =>
  _Result_match(
    loadGraphWith$(entry, opts.plugins),
    (e) => Err([e]) as Result<ModuleOutput[], MErr[]>,
    (graph) => {
      const recovered: GraphRecovery = compileGraphRecoveringWith$(graph, opts);
      return length(recovered.errors) === 0
        ? compileGraphWith$(graph, opts)
        : (Err(recovered.errors) as Result<ModuleOutput[], MErr[]>);
    },
  );
/**
 * buildModules : string -> Result [ModuleOutput] [MErr]
 * Resolve the graph, collect every recoverable module diagnostic, then emit.
 * Graph-load failures are singular but normalize to `[MErr]` at this public
 * boundary, matching the single-file compiler railway.
 */
export const buildModulesWith: _Curry<
  [entry: string, opts: Opts],
  Result<ModuleOutput[], MErr[]>
> = _curry(2, buildModulesWith$);
export const buildModules: (entry: string) => Result<ModuleOutput[], MErr[]> = (entry: string) =>
  buildModulesWith$(entry, defaultOpts);
import { relSpec as $relSpec } from "./host.mjs";
const relSpec = _curry(2, $relSpec);
import { externDtsPath as $externDtsPath } from "./host.mjs";
const externDtsPath = _curry(2, $externDtsPath);
const isIdentChar: (c: string) => boolean = (c: string) =>
  _Option_match(
    _Str_codeAt(0, c),
    () => false,
    (n) =>
      or(
        or(or(or(and(n >= 48, n <= 57), and(n >= 65, n <= 90)), and(n >= 97, n <= 122)), n === 95),
        n === 36,
      ),
  );
const endsAtBoundary: (part: string) => boolean = (part: string) =>
  _Str_length(part) === 0
    ? true
    : !isIdentChar(_Option_unwrapOr("", _Str_get(_Str_length(part) - 1, part)));
const startsAtBoundary: (part: string) => boolean = (part: string) =>
  _Str_length(part) === 0 ? true : !isIdentChar(_Option_unwrapOr("", _Str_get(0, part)));
const occursAsWordFrom$ = (parts: string[], i: number): boolean =>
  _Option_match(
    _Array_get(i, parts),
    () => false,
    (after) =>
      and(_Option_mapOr(false, endsAtBoundary, _Array_get(i - 1, parts)), startsAtBoundary(after))
        ? true
        : occursAsWordFrom$(parts, i + 1),
  );
const occursAsWordFrom: _Curry<[parts: string[], i: number], boolean> = _curry(
  2,
  occursAsWordFrom$,
);
const occursAsWord$ = (name: string, text: string): boolean =>
  occursAsWordFrom$(_Str_split(name, text), 1);
const occursAsWord: _Curry<[name: string, text: string], boolean> = _curry(2, occursAsWord$);
const importedBinding: (spec: string) => string = (spec: string) => {
  const parts: string[] = _Str_split(" as ", spec);
  return _Str_trim(_Option_unwrapOr(spec, _Array_get(length(parts) - 1, parts)));
};
const bindingsInLine$ = (line: string, acc: Set<string>): Set<string> =>
  _Option_match(
    _Array_get(1, _Str_split("{", line)),
    () => acc,
    (rest) =>
      _Option_match(
        _Array_get(0, _Str_split("}", rest)),
        () => acc,
        (names) =>
          reduce(
            _curry(2, (a: Set<string>, n: string) => _Set_add(importedBinding(n), a)),
            acc,
            _Str_split(",", names),
          ),
      ),
  );
const bindingsInLine: _Curry<[line: string, acc: Set<string>], Set<string>> = _curry(
  2,
  bindingsInLine$,
);
const valueImported: (ts: string) => Set<string> = (ts: string) =>
  reduce(
    _curry(2, (acc: Set<string>, line: string) => bindingsInLine$(line, acc)),
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
      _curry(2, (a: { owner: Map<string, A>; dups: Set<string>; dupNames: string[] }, s: Stmt) => {
        const $match = s;
        switch ($match._tag) {
          case "SType": {
            const { name } = $match;
            return _Map_has(name, a.owner)
              ? {
                  owner: _Map_set(name, path, a.owner),
                  dups: _Set_add(name, a.dups),
                  dupNames: _Set_has(name, a.dups) ? a.dupNames : _Array_append(name, a.dupNames),
                }
              : { owner: _Map_set(name, path, a.owner), dups: a.dups, dupNames: a.dupNames };
          }
          default: {
            return a;
          }
        }
      }),
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
 * A bare name declared in two modules (`LocTok` in lexer and `HookTok<t>` in
 * infer) must not be the fold target outside the module whose own alias is
 * the nullary record. The import table keeps one owner, and it may be the
 * parameterised declaration.
 */
const nullaryDeclared: <A, B, C, D>(
  name: A,
  local: Map<A, { params: B[]; fields: C[] } & D>,
) => boolean = _curry(2, <A, B, C, D>(name: A, local: Map<A, { params: B[]; fields: C[] } & D>) =>
  _Option_match(
    _Map_get(name, local),
    () => false,
    (info) => and(length(info.params) === 0, length(info.fields) > 0),
  ),
);
/**
 * A synthetic parameterised homonym makes `withoutAmbiguousAlias` blank the
 * printed name while the nullary shape stays in the index, so the variables
 * still pin and the row prints structurally.
 */
const addDupMarkers: <A, B, E>(
  names: string[],
  local: Map<string, { params: A[]; fields: B[] } & E>,
  acc: Map<string, AliasInfo>,
  i: number,
) => Map<string, AliasInfo> = _curry(
  4,
  <A, B, E>(
    names: string[],
    local: Map<string, { params: A[]; fields: B[] } & E>,
    acc: Map<string, AliasInfo>,
    i: number,
  ) =>
    _Option_match(
      _Array_get(i, names),
      () => acc,
      (name) =>
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
                    spread: boolean;
                  }[],
                  expr: None,
                },
                acc,
              ),
          i + 1,
        ),
    ),
);
const aliasesForTs: <C, D, E>(
  merged: Map<string, AliasInfo>,
  local: Map<string, { params: C[]; fields: D[] } & E>,
  dupNames: string[],
) => Map<string, AliasInfo> = _curry(
  3,
  <C, D, E>(
    merged: Map<string, AliasInfo>,
    local: Map<string, { params: C[]; fields: D[] } & E>,
    dupNames: string[],
  ) => addDupMarkers(dupNames, local, merged, 0),
);
const localTypeNames: (stmts: Stmt[]) => Set<string> = (stmts: Stmt[]) =>
  _Set_fromArray(
    _Array_flatMap((s: Stmt) => {
      const $match = s;
      switch ($match._tag) {
        case "SType": {
          const { name } = $match;
          return [name];
        }
        default: {
          return [] as string[];
        }
      }
    }, stmts),
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
          !occursAsWord$(name, ctx.ts),
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
const crossModuleTypeImports$ = (
  ts: string,
  importer: string,
  localTypes: Set<string>,
  typeOwner: Map<string, string>,
): string[] => {
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
};
/**
 * `import type { … }` lines for every non-local type name the EMITTED text
 * references, grouped by declaring module. Builtin variants never appear in
 * `typeOwner` — the emitter inlines their decls instead (ADR 0031).
 */
const crossModuleTypeImports: _Curry<
  [ts: string, importer: string, localTypes: Set<string>, typeOwner: Map<string, string>],
  string[]
> = _curry(4, crossModuleTypeImports$);
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
      _curry(2, (a: Map<string, { imported: string; scheme: A; curried: boolean }[]>, s: Stmt) => {
        const $match = s;
        switch ($match._tag) {
          case "SExtern": {
            const { name, module: hostModule, imported, curried } = $match;
            return _Str_startsWith("mochi:", hostModule)
              ? a
              : _Option_match(
                  _Map_get(name, env),
                  () => a,
                  (sc) => {
                    const dp: string = externDtsPath(path, hostModule);
                    return _Map_set(
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
                    );
                  },
                );
          }
          default: {
            return a;
          }
        }
      }),
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
    aliases: Map<string, AliasInfo>;
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
    aliases: Map<string, AliasInfo>;
    typeOwner: Map<string, string>;
    dupNames: string[];
    runtimeImport: string;
    externs: Map<string, { imported: string; scheme: Scheme; curried: boolean }[]>;
    outputs: ModuleOutput[];
  },
  MErr
> = _curry(
  3,
  <A, B>(
    ctx: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      aliases: Map<string, AliasInfo>;
      dupNames: string[];
      runtimeImport: string;
      typeOwner: Map<string, string>;
      outputs: ModuleOutput[];
      externs: Map<string, { imported: string; scheme: Scheme; curried: boolean }[]>;
    } & A,
    loaded: { stmts: Stmt[]; path: string; src: string } & B,
    opts: Opts,
  ) =>
    _Result_match(
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
      (e) =>
        Err(atPath("check", loaded.path, e)) as Result<
          {
            exportsByPath: Map<string, Map<string, Scheme>>;
            regByPath: Map<string, Registry>;
            keysByPath: Map<string, Map<string, string[]>>;
            qualsByPath: Map<string, RecoveryQualScope>;
            aliases: Map<string, AliasInfo>;
            typeOwner: Map<string, string>;
            dupNames: string[];
            runtimeImport: string;
            externs: Map<string, { imported: string; scheme: Scheme; curried: boolean }[]>;
            outputs: ModuleOutput[];
          },
          MErr
        >,
      (res) =>
        _Result_match(
          checkWith(loaded.stmts, res.reg, res.quals),
          (e) =>
            Err(atPath("check", loaded.path, e)) as Result<
              {
                exportsByPath: Map<string, Map<string, Scheme>>;
                regByPath: Map<string, Registry>;
                keysByPath: Map<string, Map<string, string[]>>;
                qualsByPath: Map<string, RecoveryQualScope>;
                aliases: Map<string, AliasInfo>;
                typeOwner: Map<string, string>;
                dupNames: string[];
                runtimeImport: string;
                externs: Map<string, { imported: string; scheme: Scheme; curried: boolean }[]>;
                outputs: ModuleOutput[];
              },
              MErr
            >,
          () =>
            _Result_match(
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
              (es) =>
                Err(firstAtPath(loaded.path, es)) as Result<
                  {
                    exportsByPath: Map<string, Map<string, Scheme>>;
                    regByPath: Map<string, Registry>;
                    keysByPath: Map<string, Map<string, string[]>>;
                    qualsByPath: Map<string, RecoveryQualScope>;
                    aliases: Map<string, AliasInfo>;
                    typeOwner: Map<string, string>;
                    dupNames: string[];
                    runtimeImport: string;
                    externs: Map<string, { imported: string; scheme: Scheme; curried: boolean }[]>;
                    outputs: ModuleOutput[];
                  },
                  MErr
                >,
              (r) => {
                const body: string = emitTsModuleWith(
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
                );
                const lines: string[] = crossModuleTypeImports$(
                  body,
                  loaded.path,
                  localTypeNames(loaded.stmts),
                  ctx.typeOwner,
                );
                const ts: string =
                  length(lines) === 0
                    ? body
                    : `${_Str_join("\n", lines)}

${body}`;
                return Ok({
                  exportsByPath: _Map_set(
                    loaded.path,
                    exportedSchemes(loaded.stmts, r.env),
                    ctx.exportsByPath,
                  ),
                  regByPath: _Map_set(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath),
                  keysByPath: _Map_set(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath),
                  qualsByPath: _Map_set(
                    loaded.path,
                    qualScopeOf(loaded.stmts, res.quals),
                    ctx.qualsByPath,
                  ),
                  aliases: mergeMap(r.aliases, ctx.aliases),
                  typeOwner: ctx.typeOwner,
                  dupNames: ctx.dupNames,
                  runtimeImport: ctx.runtimeImport,
                  externs: externBindingsInto(loaded.stmts, loaded.path, r.env, ctx.externs),
                  outputs: [...ctx.outputs, { path: loaded.path, js: ts }],
                }) as Result<
                  {
                    exportsByPath: Map<string, Map<string, Scheme>>;
                    regByPath: Map<string, Registry>;
                    keysByPath: Map<string, Map<string, string[]>>;
                    qualsByPath: Map<string, RecoveryQualScope>;
                    aliases: Map<string, AliasInfo>;
                    typeOwner: Map<string, string>;
                    dupNames: string[];
                    runtimeImport: string;
                    externs: Map<string, { imported: string; scheme: Scheme; curried: boolean }[]>;
                    outputs: ModuleOutput[];
                  },
                  MErr
                >;
              },
            ),
        ),
    ),
);
const noAliases: Map<string, AliasInfo> = aliasesOf([] as Stmt[]);
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
    aliases: Map<string, AliasInfo>;
    dupNames: string[];
    runtimeImport: string;
    typeOwner: Map<string, string>;
  },
  graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
  opts: Opts,
) => Result<ModuleOutput[], MErr> = _curry(
  3,
  <A>(
    ctx: {
      outputs: ModuleOutput[];
      externs: Map<string, { scheme: Scheme; imported: string; curried: boolean }[]>;
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      aliases: Map<string, AliasInfo>;
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
            MErr
          >,
      )
      .with(
        (_v) => _v.length >= 1,
        ([m, ...rest]) =>
          _Result_match(
            compileOneTs(ctx, m, opts),
            (e) => Err(e) as Result<ModuleOutput[], MErr>,
            (ctx1) => compileAllTs(ctx1, rest, opts),
          ),
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
) => Result<ModuleOutput[], MErr> = _curry(
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
        aliases: new Map<string, AliasInfo>(),
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
) => Result<ModuleOutput[], MErr> = _curry(
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
    aliases: Map<string, AliasInfo>;
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
    aliases: Map<string, AliasInfo>;
    runtimeImport: string;
    target: string;
    dts: string;
  },
  MErr
> = _curry(
  3,
  <A, B>(
    ctx: {
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      target: string;
      aliases: Map<string, AliasInfo>;
      runtimeImport: string;
      dts: string;
    } & A,
    loaded: { stmts: Stmt[]; path: string; src: string } & B,
    opts: Opts,
  ) =>
    _Result_match(
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
      (e) =>
        Err(atPath("check", loaded.path, e)) as Result<
          {
            exportsByPath: Map<string, Map<string, Scheme>>;
            regByPath: Map<string, Registry>;
            keysByPath: Map<string, Map<string, string[]>>;
            qualsByPath: Map<string, RecoveryQualScope>;
            aliases: Map<string, AliasInfo>;
            runtimeImport: string;
            target: string;
            dts: string;
          },
          MErr
        >,
      (res) =>
        _Result_match(
          checkWith(loaded.stmts, res.reg, res.quals),
          (e) =>
            Err(atPath("check", loaded.path, e)) as Result<
              {
                exportsByPath: Map<string, Map<string, Scheme>>;
                regByPath: Map<string, Registry>;
                keysByPath: Map<string, Map<string, string[]>>;
                qualsByPath: Map<string, RecoveryQualScope>;
                aliases: Map<string, AliasInfo>;
                runtimeImport: string;
                target: string;
                dts: string;
              },
              MErr
            >,
          () =>
            _Result_match(
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
              (es) =>
                Err(firstAtPath(loaded.path, es)) as Result<
                  {
                    exportsByPath: Map<string, Map<string, Scheme>>;
                    regByPath: Map<string, Registry>;
                    keysByPath: Map<string, Map<string, string[]>>;
                    qualsByPath: Map<string, RecoveryQualScope>;
                    aliases: Map<string, AliasInfo>;
                    runtimeImport: string;
                    target: string;
                    dts: string;
                  },
                  MErr
                >,
              (r) =>
                Ok({
                  exportsByPath: _Map_set(
                    loaded.path,
                    exportedSchemes(loaded.stmts, r.env),
                    ctx.exportsByPath,
                  ),
                  regByPath: _Map_set(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath),
                  keysByPath: _Map_set(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath),
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
                        opts.dtsTypeNames,
                      )
                    : ctx.dts,
                }) as Result<
                  {
                    exportsByPath: Map<string, Map<string, Scheme>>;
                    regByPath: Map<string, Registry>;
                    keysByPath: Map<string, Map<string, string[]>>;
                    qualsByPath: Map<string, RecoveryQualScope>;
                    aliases: Map<string, AliasInfo>;
                    runtimeImport: string;
                    target: string;
                    dts: string;
                  },
                  MErr
                >,
            ),
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
    aliases: Map<string, AliasInfo>;
    runtimeImport: string;
  },
  graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
  opts: Opts,
) => Result<string, MErr> = _curry(
  3,
  <A>(
    ctx: {
      dts: string;
      exportsByPath: Map<string, Map<string, Scheme>>;
      regByPath: Map<string, Registry>;
      keysByPath: Map<string, Map<string, string[]>>;
      qualsByPath: Map<string, RecoveryQualScope>;
      target: string;
      aliases: Map<string, AliasInfo>;
      runtimeImport: string;
    },
    graph: ({ stmts: Stmt[]; path: string; src: string } & A)[],
    opts: Opts,
  ) =>
    match(graph)
      .with(
        (_v) => _v.length === 0,
        () => Ok(ctx.dts) as Result<string, MErr>,
      )
      .with(
        (_v) => _v.length >= 1,
        ([m, ...rest]) =>
          _Result_match(
            dtsOne(ctx, m, opts),
            (e) => Err(e) as Result<string, MErr>,
            (ctx1) => dtsAll(ctx1, rest, opts),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const emitDtsForFileWith$ = (
  entry: string,
  runtimeImport: string,
  opts: Opts,
): Result<string, MErr> =>
  _Result_flatMap(
    (graph) =>
      dtsAll(
        {
          exportsByPath: new Map<string, Map<string, Scheme>>(),
          regByPath: new Map<string, Registry>(),
          keysByPath: new Map<string, Map<string, string[]>>(),
          qualsByPath: new Map<string, RecoveryQualScope>(),
          aliases: new Map<string, AliasInfo>(),
          runtimeImport: runtimeImport,
          target: absPath(entry),
          dts: "",
        },
        graph,
        opts,
      ),
    loadGraphWith$(entry, opts.plugins),
  );
/**
 * emitDtsForFile : string -> string -> Result string MErr — `.d.ts` for one
 * file, typed through its own import graph so `Alias.T` resolves (ADR 0046).
 */
export const emitDtsForFileWith: _Curry<
  [entry: string, runtimeImport: string, opts: Opts],
  Result<string, MErr>
> = _curry(3, emitDtsForFileWith$);
const emitDtsForFile$ = (entry: string, runtimeImport: string): Result<string, MErr> =>
  emitDtsForFileWith$(entry, runtimeImport, defaultOpts);
export const emitDtsForFile: _Curry<
  [entry: string, runtimeImport: string],
  Result<string, MErr>
> = _curry(2, emitDtsForFile$);
const buildModulesTsWith$ = (
  entry: string,
  runtimeImport: string,
  opts: Opts,
): Result<ModuleOutput[], MErr[]> =>
  _Result_match(
    loadGraphWith$(entry, opts.plugins),
    (e) => Err([e]) as Result<ModuleOutput[], MErr[]>,
    (graph) => {
      const recovered: GraphRecovery = compileGraphRecoveringWith$(graph, {
        ...opts,
        strictEntry: false,
      });
      return length(recovered.errors) === 0
        ? _Result_mapErr((e: MErr) => [e], compileGraphTsWith(graph, runtimeImport, opts))
        : (Err(recovered.errors) as Result<ModuleOutput[], MErr[]>);
    },
  );
/**
 * buildModulesTs : string -> string -> Result [ModuleOutput] [MErr]
 * Typed graph emit shares the recovery preflight with JS graph emit, so both
 * CLI targets render the same complete diagnostic set.
 */
export const buildModulesTsWith: _Curry<
  [entry: string, runtimeImport: string, opts: Opts],
  Result<ModuleOutput[], MErr[]>
> = _curry(3, buildModulesTsWith$);
const buildModulesTs$ = (entry: string, runtimeImport: string): Result<ModuleOutput[], MErr[]> =>
  buildModulesTsWith$(entry, runtimeImport, defaultOpts);
export const buildModulesTs: _Curry<
  [entry: string, runtimeImport: string],
  Result<ModuleOutput[], MErr[]>
> = _curry(2, buildModulesTs$);
