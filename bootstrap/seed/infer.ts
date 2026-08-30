import type { Tok } from "./lexer";
import type {
  CtorField,
  Expr,
  Field,
  InterpPart,
  LamParam,
  LoopParam,
  MapEntry,
  MatchArm,
  PatField,
  Pattern,
  SeqElem,
  Stmt,
  TypeExpr,
} from "./ast";
import type { Row, SpanAt, St, Ty, TypeAt } from "./types";
import type { PErr } from "./parser";
import type { Scheme, VarSets } from "./schemes";
import type { AliasInfo } from "./codegen-ts";
import type { TSt } from "./scc";

export type IErr = { message: string; start: number; end: number };
export type QualAliasField = { name: string; fieldType: TypeExpr; optional: boolean };
export type QualAliasInfo = { params: string[]; fields: QualAliasField[]; expr: Option<TypeExpr> };
export type QualScope = { aliases: Map<string, AliasInfo> };
/**
 * The API an `inferCall` plugin hook is handed (ADR 0011 6).
 */
export type InferApi = {
  inferExpr: (a: Expr, b: St) => Result<[Ty, St], PErr>;
  unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, PErr>;
};
/**
 * A located token as the PARSE hook sees it. Inference never inspects one, so
 * `tok` stays a type parameter — that keeps the record nameable here without
 * importing parser.mochi (which declares the real `Tok`) just to spell it.
 * Structural, so it still unifies with the parser's own `LocTok`.
 */
export type LocTok<A> = { tok: A; start: number; end: number; doc: Option<string> };
/**
 * A plugin as INFERENCE sees it. The parse hook is written INLINE rather than
 * behind its own alias: a parameterized alias whose body is an arrow emits as
 * an opaque brand, not a transparent type.
 */
export type Plugin<A> = {
  name: string;
  parse: Option<
    (
      a: { tok: A; start: number; end: number; doc: Option<string> }[],
      b: number,
      c: (
        a: { tok: A; start: number; end: number; doc: Option<string> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>
  >;
  inferCall: Option<
    (a: Expr, b: Expr[], c: Option<string>, d: St, e: InferApi) => Result<Option<[Ty, St]>, PErr>
  >;
};
/**
 * The context threaded through Algorithm W. Declared and annotated at every
 * `ctx` parameter for the same reason scc.mochi pins `TSt` (ADR 0044): each
 * reader generalizes the record's open tail on its own, so the emitted TS
 * reprinted `{ ns: Map<string, Map<string, { ty; rvars; vars } & C>>; ... }`
 * once per function instead of naming it.
 */
export type Ctx<A> = {
  env: Map<string, Scheme>;
  open: boolean;
  ns: Map<string, Map<string, Scheme>>;
  aliasMap: Map<string, AliasInfo>;
  plugins: {
    name: string;
    parse: Option<
      (
        a: { tok: A; start: number; end: number; doc: Option<string> }[],
        b: number,
        c: (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
        ) => Result<[Expr, number], PErr>,
      ) => Result<Option<[Expr, number]>, PErr>
    >;
    inferCall: Option<
      (a: Expr, b: Expr[], c: Option<string>, d: St, e: InferApi) => Result<Option<[Ty, St]>, PErr>
    >;
  }[];
  loopStack: Ty[][];
  letOwner: Map<string, SpanAt>;
};

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
  _Array_head,
  _Array_prepend,
  _Array_reverse,
  _Map_delete,
  _Map_get,
  _Map_getOr,
  _Map_has,
  _Map_keys,
  _Map_set,
  _Option_map,
  _Result_flatMap,
  _Result_map,
  _Set_add,
  _Set_fromArray,
  _Set_has,
  _Set_size,
  _Set_toArray,
  _Str_startsWith,
  _curry,
  _done,
  _recur,
  _tuple,
  add,
  and,
  eq,
  map,
  not,
  or,
  reduce,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import {
  TyVar,
  TyCon,
  TyFn,
  TyRecord,
  RowEmpty,
  RowVar,
  RowExtend,
  tCon,
  tArrow,
  tRecord,
  tTuple,
  tUnit,
  tLit,
  rVar,
  rExtend,
  rField,
  showType,
  mkSt,
  recordAt,
  noteLet,
  noteUse,
  freshVar,
  freshRowVar,
  resolve,
  zonk,
  unify,
  fits,
} from "./types";
import * as Ast from "./ast";
import * as Types from "./types";
const setLetBindMonad = _curry(2, ($receiver, $value) => ($receiver["monad"] = $value));
import { inferCallHooksOf, resolvePluginsDefault, runInferCallHooks } from "./extensions";
import { builtinDeclsFor } from "./ctors";
import {
  mono,
  tNumber,
  tBool,
  tString,
  generalize,
  instantiate,
  typeExprToType,
  ctorScheme,
  freeInType,
  widenLits,
} from "./schemes";
import * as Schemes from "./schemes";
import { stronglyConnected } from "./scc";
/**
 * Exported for the TS backend: hooks look node types up by span.
 */
export const exprSpan: (e: Expr) => SpanAt = (e: Expr) =>
  match(e)
    .with({ _tag: "ENum" }, ({ span: sp }) => sp)
    .with({ _tag: "EUnit" }, ({ span: sp }) => sp)
    .with({ _tag: "EBool" }, ({ span: sp }) => sp)
    .with({ _tag: "EStr" }, ({ span: sp }) => sp)
    .with({ _tag: "ERef" }, ({ span: sp }) => sp)
    .with({ _tag: "ECall" }, ({ span: sp }) => sp)
    .with({ _tag: "ELambda" }, ({ span: sp }) => sp)
    .with({ _tag: "ELetIn" }, ({ span: sp }) => sp)
    .with({ _tag: "ELetBind" }, ({ span: sp }) => sp)
    .with({ _tag: "EPipe" }, ({ span: sp }) => sp)
    .with({ _tag: "EDo" }, ({ span: sp }) => sp)
    .with({ _tag: "ETernary" }, ({ span: sp }) => sp)
    .with({ _tag: "EMatch" }, ({ span: sp }) => sp)
    .with({ _tag: "ELoop" }, ({ span: sp }) => sp)
    .with({ _tag: "ERecur" }, ({ span: sp }) => sp)
    .with({ _tag: "ERecord" }, ({ span: sp }) => sp)
    .with({ _tag: "EField" }, ({ span: sp }) => sp)
    .with({ _tag: "ETuple" }, ({ span: sp }) => sp)
    .with({ _tag: "EArr" }, ({ span: sp }) => sp)
    .with({ _tag: "EList" }, ({ span: sp }) => sp)
    .with({ _tag: "ESet" }, ({ span: sp }) => sp)
    .with({ _tag: "EMap" }, ({ span: sp }) => sp)
    .with({ _tag: "EInterp" }, ({ span: sp }) => sp)
    .exhaustive();
const patSpan: (p: Pattern) => SpanAt = (p: Pattern) =>
  match(p)
    .with({ _tag: "PWild" }, ({ span: sp }) => sp)
    .with({ _tag: "PUnit" }, ({ span: sp }) => sp)
    .with({ _tag: "PBind" }, ({ span: sp }) => sp)
    .with({ _tag: "PAs" }, ({ span: sp }) => sp)
    .with({ _tag: "PLit" }, ({ span: sp }) => sp)
    .with({ _tag: "PBool" }, ({ span: sp }) => sp)
    .with({ _tag: "PStr" }, ({ span: sp }) => sp)
    .with({ _tag: "PTuple" }, ({ span: sp }) => sp)
    .with({ _tag: "PRecord" }, ({ span: sp }) => sp)
    .with({ _tag: "PCtor" }, ({ span: sp }) => sp)
    .with({ _tag: "PArr" }, ({ span: sp }) => sp)
    .with({ _tag: "PList" }, ({ span: sp }) => sp)
    .with({ _tag: "POr" }, ({ span: sp }) => sp)
    .exhaustive();

const annotSpan: (t: TypeExpr) => SpanAt = (t: TypeExpr) =>
  match(t)
    .with({ _tag: "TyName" }, ({ span: sp }) => sp)
    .with({ _tag: "TyArrow" }, ({ span: sp }) => sp)
    .with({ _tag: "TyApp" }, ({ span: sp }) => sp)
    .with({ _tag: "TyTuple" }, ({ span: sp }) => sp)
    .with({ _tag: "TyList" }, ({ span: sp }) => sp)
    .with({ _tag: "TyQual" }, ({ span: sp }) => sp)
    .with({ _tag: "TyLit" }, ({ span: sp }) => sp)
    .with({ _tag: "TyUnion" }, ({ span: sp }) => sp)
    .exhaustive();
const typeErr: <A, B, C, D>(
  msg: A,
  sp: { end: B; start: C } & D,
) => { message: A; start: C; end: B } = _curry(
  2,
  <A, B, C, D>(msg: A, sp: { end: B; start: C } & D) => ({
    message: msg,
    start: sp.start,
    end: sp.end,
  }),
);
const u: <A, B, C>(
  a: Ty,
  b: Ty,
  st: St,
  sp: { end: A; start: B } & C,
) => Result<St, { message: string; start: B; end: A }> = _curry(
  4,
  <A, B, C>(a: Ty, b: Ty, st: St, sp: { end: A; start: B } & C) =>
    match(unify(a, b, st))
      .with({ _tag: "Ok" }, ({ value: newSt }) => Ok(newSt))
      .with({ _tag: "Err" }, ({ error: e }) => Err(typeErr(e.message, sp)))
      .exhaustive(),
);
/**
 * `actual` may be used as `expected` (ADR 0098 optional fields).
 */
const checkFits: <A, B, C>(
  actual: Ty,
  expected: Ty,
  st: St,
  sp: { end: A; start: B } & C,
) => Result<St, { message: string; start: B; end: A }> = _curry(
  4,
  <A, B, C>(actual: Ty, expected: Ty, st: St, sp: { end: A; start: B } & C) =>
    match(fits(actual, expected, st))
      .with({ _tag: "Ok" }, ({ value: newSt }) => Ok(newSt))
      .with({ _tag: "Err" }, ({ error: e }) => Err(typeErr(e.message, sp)))
      .exhaustive(),
);
const bindParamNamesFrom: <A, B, C>(
  names: A[],
  env: Map<A, { vars: B[]; rvars: C[]; ty: Ty }>,
  st: St,
) => [Ty[], Map<A, { vars: B[]; rvars: C[]; ty: Ty }>, St] = _curry(
  3,
  <A, B, C>(names: A[], env: Map<A, { vars: B[]; rvars: C[]; ty: Ty }>, st: St) =>
    match(names)
      .with(
        (_v) => _v.length === 0,
        () => _tuple([] as Ty[], env, st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([n, ...rest]) =>
          (([t, st1]: [Ty, St]) =>
            (([restTs, env2, st2]: [Ty[], Map<A, { vars: B[]; rvars: C[]; ty: Ty }>, St]) =>
              _tuple(_Array_prepend(t, restTs), env2, st2))(
              bindParamNamesFrom(rest, _Map_set(n, mono(t), env), st1),
            ))(freshVar(st)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const bindParamFieldsFrom: <A, B>(
  fields: string[],
  env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
  row: Row,
  st: St,
) => [Row, Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, St] = _curry(
  4,
  <A, B>(fields: string[], env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, row: Row, st: St) =>
    match(fields)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => _tuple(row, env, st),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([f, ...rest]) =>
          (([ft, st1]: [Ty, St]) =>
            bindParamFieldsFrom(rest, _Map_set(f, mono(ft), env), rExtend(f, ft, row), st1))(
            freshVar(st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const bindParam: <A, B>(
  p: LamParam,
  env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
  st: St,
) => [Ty, Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, St] = _curry(
  3,
  <A, B>(p: LamParam, env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, st: St) =>
    match(p)
      .with({ _tag: "LPName" }, ({ name }) =>
        (([t, st1]: [Ty, St]) => _tuple(t, _Map_set(name, mono(t), env), st1))(freshVar(st)),
      )
      .with({ _tag: "LPTuple" }, ({ names }) =>
        (([elems, env1, st1]: [Ty[], Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, St]) =>
          _tuple(tTuple(elems), env1, st1))(bindParamNamesFrom(names, env, st)),
      )
      .with({ _tag: "LPRecord" }, ({ fields }) =>
        (([rowBase, st1]: [Row, St]) =>
          (([row, env1, st2]: [Row, Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, St]) =>
            _tuple(tRecord(row), env1, st2))(bindParamFieldsFrom(fields, env, rowBase, st1)))(
          freshRowVar(st),
        ),
      )
      .with({ _tag: "LPLabeled" }, ({ name }) =>
        (([t, st1]: [Ty, St]) => _tuple(t, _Map_set(name, mono(t), env), st1))(freshVar(st)),
      )
      .exhaustive(),
);
const bindParamsFrom: <A, B>(
  params: LamParam[],
  env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
  st: St,
) => [Ty[], Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, St] = _curry(
  3,
  <A, B>(params: LamParam[], env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, st: St) =>
    match(params)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => _tuple([] as Ty[], env, st),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([p, ...rest]) =>
          (([t, env1, st1]: [Ty, Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, St]) =>
            (([restTs, env2, st2]: [Ty[], Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, St]) =>
              _tuple(_Array_prepend(t, restTs), env2, st2))(bindParamsFrom(rest, env1, st1)))(
            bindParam(p, env, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const constrainParamAnnotsFrom: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  params: LamParam[],
  paramTypes: Ty[],
  vars: Map<string, Ty>,
  st: St,
) => Result<[Map<string, Ty>, St], PErr> = _curry(
  5,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    params: LamParam[],
    paramTypes: Ty[],
    vars: Map<string, Ty>,
    st: St,
  ) =>
    match(params)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(vars, st)) as Result<[Map<string, Ty>, St], PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([param, ...rest]) =>
          match(paramTypes)
            .with(
              (_v) => {
                const _g: any = _v;
                return _g.length === 0;
              },
              () => Ok(_tuple(vars, st)) as Result<[Map<string, Ty>, St], PErr>,
            )
            .with(
              (_v) => {
                const _g: any = _v;
                return _g.length >= 1;
              },
              ([paramT, ...restTypes]) =>
                match(param)
                  .with(
                    (
                      _v,
                    ): _v is Extract<LamParam, { _tag: "LPName" }> & {
                      annot: Extract<
                        Extract<LamParam, { _tag: "LPName" }>["annot"],
                        { _tag: "Some" }
                      >;
                    } => {
                      const _g: any = _v;
                      return _g._tag === "LPName" && _g.annot._tag === "Some";
                    },
                    ({ annot: { value: te } }) =>
                      (([annotT, vars1, st1]: [Ty, Map<string, Ty>, St]) =>
                        _Result_flatMap(
                          (st2) => constrainParamAnnotsFrom(ctx, rest, restTypes, vars1, st2),
                          checkFits(paramT, annotT, st1, annotSpan(te)),
                        ))(
                        typeExprToType(te, vars, st, ctx.aliasMap, _Set_fromArray([] as string[])),
                      ),
                  )
                  .otherwise(() => constrainParamAnnotsFrom(ctx, rest, restTypes, vars, st)),
            )
            .otherwise(() => {
              throw new Error("non-exhaustive match");
            }),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const arrowChain: _Curry<[paramTypes: Ty[], resultT: Ty], Ty> = _curry(
  2,
  (paramTypes: Ty[], resultT: Ty) =>
    match(paramTypes)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => tArrow(tUnit, resultT),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 1;
        },
        ([p]) => tArrow(p, resultT),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([p, ...rest]) => tArrow(p, arrowChain(rest, resultT)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const ctxWithEnv: <A, B>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  env: B,
) => {
  env: B;
  open: boolean;
  ns: Map<string, Map<string, Scheme>>;
  aliasMap: Map<string, AliasInfo>;
  plugins: {
    name: string;
    parse: Option<
      (
        a: { tok: A; start: number; end: number; doc: Option<string> }[],
        b: number,
        c: (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
        ) => Result<[Expr, number], PErr>,
      ) => Result<Option<[Expr, number]>, PErr>
    >;
    inferCall: Option<
      (a: Expr, b: Expr[], c: Option<string>, d: St, e: InferApi) => Result<Option<[Ty, St]>, PErr>
    >;
  }[];
  loopStack: Ty[][];
  letOwner: Map<string, SpanAt>;
} = _curry(
  2,
  <A, B>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    env: B,
  ) => ({
    env: env,
    open: ctx.open,
    ns: ctx.ns,
    aliasMap: ctx.aliasMap,
    plugins: ctx.plugins,
    loopStack: ctx.loopStack,
    letOwner: ctx.letOwner,
  }),
);
const ctxWithLets: <A, B, C>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  env: B,
  letOwner: C,
) => {
  env: B;
  open: boolean;
  ns: Map<string, Map<string, Scheme>>;
  aliasMap: Map<string, AliasInfo>;
  plugins: {
    name: string;
    parse: Option<
      (
        a: { tok: A; start: number; end: number; doc: Option<string> }[],
        b: number,
        c: (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
        ) => Result<[Expr, number], PErr>,
      ) => Result<Option<[Expr, number]>, PErr>
    >;
    inferCall: Option<
      (a: Expr, b: Expr[], c: Option<string>, d: St, e: InferApi) => Result<Option<[Ty, St]>, PErr>
    >;
  }[];
  loopStack: Ty[][];
  letOwner: C;
} = _curry(
  3,
  <A, B, C>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    env: B,
    letOwner: C,
  ) => ({
    env: env,
    open: ctx.open,
    ns: ctx.ns,
    aliasMap: ctx.aliasMap,
    plugins: ctx.plugins,
    loopStack: ctx.loopStack,
    letOwner: letOwner,
  }),
);
const ctxWithLoop: <A, B, C>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  env: B,
  frame: Ty[],
  letOwner: C,
) => {
  env: B;
  open: boolean;
  ns: Map<string, Map<string, Scheme>>;
  aliasMap: Map<string, AliasInfo>;
  plugins: {
    name: string;
    parse: Option<
      (
        a: { tok: A; start: number; end: number; doc: Option<string> }[],
        b: number,
        c: (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
        ) => Result<[Expr, number], PErr>,
      ) => Result<Option<[Expr, number]>, PErr>
    >;
    inferCall: Option<
      (a: Expr, b: Expr[], c: Option<string>, d: St, e: InferApi) => Result<Option<[Ty, St]>, PErr>
    >;
  }[];
  loopStack: Ty[][];
  letOwner: C;
} = _curry(
  4,
  <A, B, C>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    env: B,
    frame: Ty[],
    letOwner: C,
  ) => ({
    env: env,
    open: ctx.open,
    ns: ctx.ns,
    aliasMap: ctx.aliasMap,
    plugins: ctx.plugins,
    loopStack: _Array_prepend(frame, ctx.loopStack),
    letOwner: letOwner,
  }),
);
const inferLoopParamsFrom: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  params: LoopParam[],
  i: number,
  envAcc: Map<string, Scheme>,
  frameAcc: Ty[],
  ownerAcc: Map<string, SpanAt>,
  st: St,
) => Result<[Ty[], Map<string, Scheme>, Map<string, SpanAt>, St], PErr> = _curry(
  7,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    params: LoopParam[],
    i: number,
    envAcc: Map<string, Scheme>,
    frameAcc: Ty[],
    ownerAcc: Map<string, SpanAt>,
    st: St,
  ) =>
    match(_Array_get(i, params))
      .with(
        { _tag: "None" },
        () =>
          Ok(_tuple(frameAcc, envAcc, ownerAcc, st)) as Result<
            [Ty[], Map<string, Scheme>, Map<string, SpanAt>, St],
            PErr
          >,
      )
      .with({ _tag: "Some" }, ({ value: p }) =>
        _Result_flatMap(
          ([t, st1]) =>
            ((sp: SpanAt) =>
              inferLoopParamsFrom(
                ctx,
                params,
                add(i, 1),
                _Map_set(p.name, mono(t), envAcc),
                _Array_append(t, frameAcc),
                _Map_set(p.name, sp, ownerAcc),
                noteLet(sp, st1),
              ))(exprSpan(p.init)),
          inferExpr(ctx, p.init, st),
        ),
      )
      .exhaustive(),
);
const unifyRecurArgsFrom: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  args: Expr[],
  frame: Ty[],
  i: number,
  st: St,
) => Result<St, PErr> = _curry(
  5,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    args: Expr[],
    frame: Ty[],
    i: number,
    st: St,
  ) =>
    match(_Array_get(i, args))
      .with({ _tag: "None" }, () => Ok(st) as Result<St, PErr>)
      .with({ _tag: "Some" }, ({ value: a }) =>
        _Result_flatMap(
          ([at, st1]) =>
            match(_Array_get(i, frame))
              .with({ _tag: "None" }, () => unifyRecurArgsFrom(ctx, args, frame, add(i, 1), st1))
              .with({ _tag: "Some" }, ({ value: pt }) =>
                _Result_flatMap(
                  (st2) => unifyRecurArgsFrom(ctx, args, frame, add(i, 1), st2),
                  u(at, pt, st1, exprSpan(a)),
                ),
              )
              .exhaustive(),
          inferExpr(ctx, a, st),
        ),
      )
      .exhaustive(),
);
const inferRecur: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  args: Expr[],
  sp: SpanAt,
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  4,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    args: Expr[],
    sp: SpanAt,
    st: St,
  ) =>
    match(ctx.loopStack)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () =>
          Err(typeErr("'recur' is only legal inside a loop body", sp)) as Result<[Ty, St], PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([frame]) =>
          _Result_flatMap(
            (st1) =>
              (([t, st2]: [Ty, St]) => Ok(_tuple(t, st2)) as Result<[Ty, St], PErr>)(freshVar(st1)),
            unifyRecurArgsFrom(ctx, args, frame, 0, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const rowHasOptional: (row: Row) => boolean = (row: Row) =>
  match(row)
    .with({ _tag: "RowExtend" }, ({ optional, rest }) => or(optional, rowHasOptional(rest)))
    .otherwise(() => false);
const domainNeedsFits: _Curry<[t: Ty, st: St], boolean> = _curry(2, (t: Ty, st: St) =>
  match(zonk(t, st))
    .with({ _tag: "TyRecord" }, ({ row }) => rowHasOptional(row))
    .otherwise(() => false),
);
/**
 * True when every known field is optional. This is what makes `f()` legal:
 * the nullary call applies `{}`, which only `fits` an all-optional domain.
 */
const rowAllOptional: (row: Row) => boolean = (row: Row) =>
  match(row)
    .with({ _tag: "RowExtend" }, ({ optional, rest }) => and(optional, rowAllOptional(rest)))
    .otherwise(() => true);
const domainIsOmittableRecord: _Curry<[t: Ty, st: St], boolean> = _curry(2, (t: Ty, st: St) =>
  match(zonk(t, st))
    .with({ _tag: "TyRecord" }, ({ row }) => rowAllOptional(row))
    .otherwise(() => false),
);
const isLabeledParam: (p: LamParam) => boolean = (p: LamParam) =>
  match(p)
    .with({ _tag: "LPLabeled" }, () => true)
    .otherwise(() => false);
const splitLamParams: _Curry<
  [params: LamParam[], positional: LamParam[], labeled: LamParam[]],
  [LamParam[], LamParam[]]
> = _curry(3, (params: LamParam[], positional: LamParam[], labeled: LamParam[]) =>
  match(params)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => _tuple(positional, labeled),
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([p, ...rest]) =>
        isLabeledParam(p)
          ? splitLamParams(rest, positional, _Array_append(p, labeled))
          : splitLamParams(rest, _Array_append(p, positional), labeled),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
/**
 * One pass per label, threading `st` but NOT `env`: a default is inferred in
 * the positional-only scope, so one label's default cannot read another's.
 */
const labFieldsFrom: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  labs: LamParam[],
  env: Map<string, Scheme>,
  vars: Map<string, Ty>,
  st: St,
) => Result<[{ name: string; fieldType: Ty; omittable: boolean; bodyType: Ty }[], St], PErr> =
  _curry(
    5,
    <A>(
      ctx: {
        env: Map<string, Scheme>;
        open: boolean;
        ns: Map<string, Map<string, Scheme>>;
        aliasMap: Map<string, AliasInfo>;
        plugins: {
          name: string;
          parse: Option<
            (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
              c: (
                a: { tok: A; start: number; end: number; doc: Option<string> }[],
                b: number,
              ) => Result<[Expr, number], PErr>,
            ) => Result<Option<[Expr, number]>, PErr>
          >;
          inferCall: Option<
            (
              a: Expr,
              b: Expr[],
              c: Option<string>,
              d: St,
              e: InferApi,
            ) => Result<Option<[Ty, St]>, PErr>
          >;
        }[];
        loopStack: Ty[][];
        letOwner: Map<string, SpanAt>;
      },
      labs: LamParam[],
      env: Map<string, Scheme>,
      vars: Map<string, Ty>,
      st: St,
    ) =>
      match(labs)
        .with(
          (_v) => {
            const _g: any = _v;
            return _g.length === 0;
          },
          () =>
            Ok(
              _tuple([] as { name: string; fieldType: Ty; omittable: boolean; bodyType: Ty }[], st),
            ) as Result<
              [{ name: string; fieldType: Ty; omittable: boolean; bodyType: Ty }[], St],
              PErr
            >,
        )
        .with(
          (_v) => {
            const _g: any = _v;
            return _g.length >= 1;
          },
          ([lab, ...rest]) =>
            match(lab)
              .with({ _tag: "LPLabeled" }, ({ name, annot, optional, defaultValue }) =>
                (([fieldT, vars1, st1]: [Ty, Map<string, Ty>, St]) =>
                  _Result_flatMap(
                    ([fieldT1, st2]) =>
                      ((bodyT: Ty) =>
                        ((omittable: boolean) =>
                          _Result_flatMap(
                            ([fields, stN]) =>
                              Ok(
                                _tuple(
                                  _Array_prepend(
                                    {
                                      name: name,
                                      fieldType: fieldT1,
                                      omittable: omittable,
                                      bodyType: bodyT,
                                    },
                                    fields,
                                  ),
                                  stN,
                                ),
                              ) as Result<
                                [
                                  {
                                    name: string;
                                    fieldType: Ty;
                                    omittable: boolean;
                                    bodyType: Ty;
                                  }[],
                                  St,
                                ],
                                PErr
                              >,
                            labFieldsFrom(ctx, rest, env, vars1, st2),
                          ))(
                          or(
                            optional,
                            match(defaultValue)
                              .with({ _tag: "Some" }, () => true)
                              .with({ _tag: "None" }, () => false)
                              .exhaustive(),
                          ),
                        ))(
                        match(defaultValue)
                          .with({ _tag: "Some" }, () => fieldT1)
                          .with({ _tag: "None" }, () =>
                            optional ? tCon("Option", [fieldT1]) : fieldT1,
                          )
                          .exhaustive(),
                      ),
                    match(defaultValue)
                      .with(
                        { _tag: "None" },
                        () => Ok(_tuple(fieldT, st1)) as Result<[Ty, St], PErr>,
                      )
                      .with({ _tag: "Some" }, ({ value: d }) =>
                        _Result_flatMap(
                          ([dt, s2]) =>
                            match(annot)
                              .with({ _tag: "Some" }, () =>
                                _Result_flatMap(
                                  (s3) => Ok(_tuple(fieldT, s3)) as Result<[Ty, St], PErr>,
                                  checkFits(dt, fieldT, s2, exprSpan(d)),
                                ),
                              )
                              .with({ _tag: "None" }, () =>
                                ((widened: Ty) =>
                                  _Result_flatMap(
                                    (s3) => Ok(_tuple(widened, s3)) as Result<[Ty, St], PErr>,
                                    u(fieldT, widened, s2, exprSpan(d)),
                                  ))(widenLits(zonk(dt, s2))),
                              )
                              .exhaustive(),
                          inferExpr(ctxWithEnv(ctx, env), d, st1),
                        ),
                      )
                      .exhaustive(),
                  ))(
                  match(annot)
                    .with({ _tag: "Some" }, ({ value: te }) =>
                      typeExprToType(te, vars, st, ctx.aliasMap, _Set_fromArray([] as string[])),
                    )
                    .with({ _tag: "None" }, () =>
                      (([t, s1]: [Ty, St]) => _tuple(t, vars, s1))(freshVar(st)),
                    )
                    .exhaustive(),
                ),
              )
              .otherwise(() => labFieldsFrom(ctx, rest, env, vars, st)),
        )
        .otherwise(() => {
          throw new Error("non-exhaustive match");
        }),
  );
const rowOfLabFields: <A>(
  fields: ({ name: string; fieldType: Ty; omittable: boolean } & A)[],
) => Row = <A>(fields: ({ name: string; fieldType: Ty; omittable: boolean } & A)[]) =>
  match(fields)
    .with(
      (_v) => _v.length === 0,
      () => RowEmpty as Row,
    )
    .with(
      (_v) => _v.length >= 1,
      ([f, ...rest]) => rField(f.name, f.fieldType, rowOfLabFields(rest), f.omittable),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    });
const envWithLabFields: <A, B, C, D, E>(
  fields: ({ name: A; bodyType: B } & E)[],
  env: Map<A, { vars: C[]; rvars: D[]; ty: B }>,
) => Map<A, { vars: C[]; rvars: D[]; ty: B }> = _curry(
  2,
  <A, B, C, D, E>(
    fields: ({ name: A; bodyType: B } & E)[],
    env: Map<A, { vars: C[]; rvars: D[]; ty: B }>,
  ) =>
    match(fields)
      .with(
        (_v) => _v.length === 0,
        () => env,
      )
      .with(
        (_v) => _v.length >= 1,
        ([f, ...rest]) => envWithLabFields(rest, _Map_set(f.name, mono(f.bodyType), env)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferCallArgs: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  fnT: Ty,
  args: Expr[],
  st: St,
  callSpan: SpanAt,
) => Result<[Ty, St], PErr> = _curry(
  5,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    fnT: Ty,
    args: Expr[],
    st: St,
    callSpan: SpanAt,
  ) =>
    match(args)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(fnT, st)) as Result<[Ty, St], PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([arg, ...rest]) =>
          _Result_flatMap(
            ([argT, st1]) =>
              match(resolve(fnT, st1))
                .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
                  domainNeedsFits(fromT, st1)
                    ? _Result_flatMap(
                        (st2) => inferCallArgs(ctx, toT, rest, st2, callSpan),
                        checkFits(argT, fromT, st1, exprSpan(arg)),
                      )
                    : (([resultT, st2]: [Ty, St]) =>
                        _Result_flatMap(
                          (st3) => inferCallArgs(ctx, resultT, rest, st3, callSpan),
                          u(fnT, tArrow(argT, resultT), st2, exprSpan(arg)),
                        ))(freshVar(st1)),
                )
                .otherwise(() =>
                  (([resultT, st2]: [Ty, St]) =>
                    _Result_flatMap(
                      (st3) => inferCallArgs(ctx, resultT, rest, st3, callSpan),
                      u(fnT, tArrow(argT, resultT), st2, exprSpan(arg)),
                    ))(freshVar(st1)),
                ),
            inferExpr(ctx, arg, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferNormalCall: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  fn: Expr,
  args: Expr[],
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  4,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    fn: Expr,
    args: Expr[],
    st: St,
  ) =>
    _Result_flatMap(
      ([fnT, st1]) =>
        match(args)
          .with(
            (_v) => {
              const _g: any = _v;
              return _g.length === 0;
            },
            () =>
              match(resolve(fnT, st1))
                .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
                  domainIsOmittableRecord(fromT, st1)
                    ? _Result_flatMap(
                        (st2) => Ok(_tuple(toT, st2)) as Result<[Ty, St], PErr>,
                        checkFits(tRecord(RowEmpty as Row), fromT, st1, exprSpan(fn)),
                      )
                    : (([resultT, st2]: [Ty, St]) =>
                        _Result_flatMap(
                          (st3) => Ok(_tuple(resultT, st3)) as Result<[Ty, St], PErr>,
                          u(fnT, tArrow(tUnit, resultT), st2, exprSpan(fn)),
                        ))(freshVar(st1)),
                )
                .otherwise(() =>
                  (([resultT, st2]: [Ty, St]) =>
                    _Result_flatMap(
                      (st3) => Ok(_tuple(resultT, st3)) as Result<[Ty, St], PErr>,
                      u(fnT, tArrow(tUnit, resultT), st2, exprSpan(fn)),
                    ))(freshVar(st1)),
                ),
          )
          .otherwise(() => inferCallArgs(ctx, fnT, args, st1, exprSpan(fn))),
      inferExpr(ctx, fn, st),
    ),
);
const inferTernary: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  cond: Expr,
  thenE: Expr,
  elseE: Expr,
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  5,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    cond: Expr,
    thenE: Expr,
    elseE: Expr,
    st: St,
  ) =>
    _Result_flatMap(
      ([condT, st1]) =>
        _Result_flatMap(
          (st2) =>
            _Result_flatMap(
              ([thenT, st3]) =>
                _Result_flatMap(
                  ([elseT, st4]) =>
                    _Result_flatMap(
                      (st5) => Ok(_tuple(thenT, st5)) as Result<[Ty, St], PErr>,
                      u(thenT, elseT, st4, exprSpan(elseE)),
                    ),
                  inferExpr(ctx, elseE, st3),
                ),
              inferExpr(ctx, thenE, st2),
            ),
          u(condT, tBool, st1, exprSpan(cond)),
        ),
      inferExpr(ctx, cond, st),
    ),
);
const inferBindBody: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  param: LamParam,
  paramSpan: SpanAt,
  body: Expr,
  payloadT: Ty,
  mkBody: (a: Ty) => Ty,
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  7,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    param: LamParam,
    paramSpan: SpanAt,
    body: Expr,
    payloadT: Ty,
    mkBody: (a: Ty) => Ty,
    st: St,
  ) =>
    (([paramT, bodyEnv, st1]: [Ty, Map<string, Scheme>, St]) =>
      _Result_flatMap(
        (st2) =>
          _Result_flatMap(
            ([bodyT, st3]) =>
              (([resT, st4]: [Ty, St]) => {
                const wantBody: Ty = mkBody(resT);
                return _Result_flatMap(
                  (st5) => Ok(_tuple(wantBody, st5)) as Result<[Ty, St], PErr>,
                  u(bodyT, wantBody, st4, exprSpan(body)),
                );
              })(freshVar(st3)),
            inferExpr(ctxWithEnv(ctx, bodyEnv), body, st2),
          ),
        u(paramT, payloadT, st1, paramSpan),
      ))(bindParam(param, ctx.env, st)),
);
const inferTwoSlotBind: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  param: LamParam,
  paramSpan: SpanAt,
  value: Expr,
  body: Expr,
  valT: Ty,
  ctor: string,
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  8,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    param: LamParam,
    paramSpan: SpanAt,
    value: Expr,
    body: Expr,
    valT: Ty,
    ctor: string,
    st: St,
  ) =>
    (([payloadT, st1]: [Ty, St]) =>
      (([errT, st2]: [Ty, St]) =>
        _Result_flatMap(
          (st3) =>
            inferBindBody(
              ctx,
              param,
              paramSpan,
              body,
              payloadT,
              (resT: Ty) => tCon(ctor, [resT, errT]),
              st3,
            ),
          u(valT, tCon(ctor, [payloadT, errT]), st2, exprSpan(value)),
        ))(freshVar(st1)))(freshVar(st)),
);
const inferQuestionBind: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  bind: Expr,
  param: LamParam,
  paramSpan: SpanAt,
  value: Expr,
  body: Expr,
  valT: Ty,
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  8,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    bind: Expr,
    param: LamParam,
    paramSpan: SpanAt,
    value: Expr,
    body: Expr,
    valT: Ty,
    st: St,
  ) =>
    match(resolve(valT, st))
      .with({ _tag: "TyVar" }, () =>
        (($written) => inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Result", st))(
          setLetBindMonad(bind, "Result"),
        ),
      )
      .with({ _tag: "TyCon" }, ({ name }) =>
        eq(name, "Option")
          ? (($written) =>
              (([payloadT, st1]: [Ty, St]) =>
                _Result_flatMap(
                  (st2) =>
                    inferBindBody(
                      ctx,
                      param,
                      paramSpan,
                      body,
                      payloadT,
                      (resT: Ty) => tCon("Option", [resT]),
                      st2,
                    ),
                  u(valT, tCon("Option", [payloadT]), st1, exprSpan(value)),
                ))(freshVar(st)))(setLetBindMonad(bind, "Option"))
          : eq(name, "Result")
            ? (($written) =>
                inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Result", st))(
                setLetBindMonad(bind, "Result"),
              )
            : (Err(
                typeErr(
                  `let? requires Option or Result, got ${showType(zonk(valT, st))}`,
                  exprSpan(value),
                ),
              ) as Result<[Ty, St], PErr>),
      )
      .otherwise(
        () =>
          Err(
            typeErr(
              `let? requires Option or Result, got ${showType(zonk(valT, st))}`,
              exprSpan(value),
            ),
          ) as Result<[Ty, St], PErr>,
      ),
);
const inferLetBind: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  bind: Expr,
  param: LamParam,
  paramSpan: SpanAt,
  monad: string,
  value: Expr,
  body: Expr,
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  8,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    bind: Expr,
    param: LamParam,
    paramSpan: SpanAt,
    monad: string,
    value: Expr,
    body: Expr,
    st: St,
  ) =>
    _Result_flatMap(
      ([valT, st1]) =>
        eq(monad, "Task")
          ? inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Task", st1)
          : inferQuestionBind(ctx, bind, param, paramSpan, value, body, valT, st1),
      inferExpr(ctx, value, st),
    ),
);
const inferRecordRow: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  fields: Field[],
  st: St,
) => Result<[Row, St], PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    fields: Field[],
    st: St,
  ) =>
    match(fields)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(RowEmpty as Row, st)) as Result<[Row, St], PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([f, ...rest]) =>
          _Result_flatMap(
            ([restRow, st1]) =>
              _Result_flatMap(
                ([ft, st2]) =>
                  Ok(_tuple(rExtend(f.name, ft, restRow), st2)) as Result<[Row, St], PErr>,
                inferExpr(ctx, f.value, st1),
              ),
            inferRecordRow(ctx, rest, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const rWithTail: _Curry<[row: Row, tail: Row], Row> = _curry(2, (row: Row, tail: Row) =>
  match(row)
    .with({ _tag: "RowEmpty" }, () => tail)
    .with({ _tag: "RowVar" }, ({ id }) => rVar(id))
    .with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) =>
      rField(label, fieldType, rWithTail(rest, tail), optional),
    )
    .exhaustive(),
);
const lookupField: _Curry<[row: Row, name: string], Option<[Ty, boolean]>> = _curry(
  2,
  (row: Row, name: string) =>
    match(row)
      .with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) =>
        eq(label, name)
          ? (Some(_tuple(fieldType, optional)) as Option<[Ty, boolean]>)
          : lookupField(rest, name),
      )
      .otherwise(() => None as Option<[Ty, boolean]>),
);
const rowEndsEmpty: (row: Row) => boolean = (row: Row) =>
  match(row)
    .with({ _tag: "RowEmpty" }, () => true)
    .with({ _tag: "RowExtend" }, ({ rest }) => rowEndsEmpty(rest))
    .with({ _tag: "RowVar" }, () => false)
    .exhaustive();
const inferFieldAccess: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  target: Expr,
  name: string,
  sp: SpanAt,
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  5,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    target: Expr,
    name: string,
    sp: SpanAt,
    st: St,
  ) =>
    _Result_flatMap(
      ([targetT, st1]) =>
        ((zonked: Ty) =>
          match(zonked)
            .with({ _tag: "TyRecord" }, ({ row }) =>
              match(lookupField(row, name))
                .with(
                  (_v): _v is Extract<Option<[Ty, boolean]>, { _tag: "Some" }> => {
                    const _g: any = _v;
                    return _g._tag === "Some";
                  },
                  ({ value: [ft, optional] }) =>
                    Ok(_tuple(optional ? tCon("Option", [ft]) : ft, st1)) as Result<[Ty, St], PErr>,
                )
                .with({ _tag: "None" }, () =>
                  rowEndsEmpty(row)
                    ? (Err(typeErr(`record missing field '${name}'`, sp)) as Result<[Ty, St], PErr>)
                    : inferDuckField(targetT, name, sp, st1),
                )
                .exhaustive(),
            )
            .otherwise(() => inferDuckField(targetT, name, sp, st1)))(zonk(targetT, st1)),
      inferExpr(ctx, target, st),
    ),
);
const inferDuckField: <A, B, C>(
  targetT: Ty,
  name: string,
  sp: { end: A; start: B } & C,
  st: St,
) => Result<[Ty, St], { message: string; start: B; end: A }> = _curry(
  4,
  <A, B, C>(targetT: Ty, name: string, sp: { end: A; start: B } & C, st: St) =>
    (([fieldT, st2]: [Ty, St]) =>
      (([restRow, st3]: [Row, St]) =>
        _Result_flatMap(
          (st4) => Ok(_tuple(fieldT, st4)),
          u(targetT, tRecord(rExtend(name, fieldT, restRow)), st3, sp),
        ))(freshRowVar(st2)))(freshVar(st)),
);
const inferNsField: <A, B, C, D>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  tname: string,
  name: string,
  sp: { end: B; start: C } & D,
  st: St,
) => Result<[Ty, St], { message: string; start: C; end: B }> = _curry(
  5,
  <A, B, C, D>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    tname: string,
    name: string,
    sp: { end: B; start: C } & D,
    st: St,
  ) =>
    match(_Map_get(name, _Map_getOr(new Map<string, Scheme>(), tname, ctx.ns)))
      .with({ _tag: "Some" }, ({ value: sc }) =>
        (([t, st1]: [Ty, St]) => Ok(_tuple(t, st1)))(instantiate(sc, st)),
      )
      .with({ _tag: "None" }, () => Err(typeErr(`'${tname}' has no member '${name}'`, sp)))
      .exhaustive(),
);
const inferInterpParts: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  parts: InterpPart[],
  st: St,
) => Result<St, PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    parts: InterpPart[],
    st: St,
  ) =>
    match(parts)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st) as Result<St, PErr>,
      )
      .with(
        (_v): _v is [Extract<InterpPart[][number], { _tag: "IPLit" }>, ...InterpPart[]] => {
          const _g: any = _v;
          return _g.length >= 1 && _g[0]._tag === "IPLit";
        },
        ([, ...rest]) => inferInterpParts(ctx, rest, st),
      )
      .with(
        (_v): _v is [Extract<InterpPart[][number], { _tag: "IPExpr" }>, ...InterpPart[]] => {
          const _g: any = _v;
          return _g.length >= 1 && _g[0]._tag === "IPExpr";
        },
        ([{ expr: ex }, ...rest]) =>
          _Result_flatMap(
            ([t, st1]) =>
              _Result_flatMap(
                (st2) => inferInterpParts(ctx, rest, st2),
                u(t, tString, st1, exprSpan(ex)),
              ),
            inferExpr(ctx, ex, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferTupleElems: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  elements: Expr[],
  st: St,
) => Result<[Ty[], St], PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    elements: Expr[],
    st: St,
  ) =>
    match(elements)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple([] as Ty[], st)) as Result<[Ty[], St], PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([el, ...rest]) =>
          _Result_flatMap(
            ([t, st1]) =>
              _Result_flatMap(
                ([restTs, st2]) =>
                  Ok(_tuple(_Array_prepend(t, restTs), st2)) as Result<[Ty[], St], PErr>,
                inferTupleElems(ctx, rest, st1),
              ),
            inferExpr(ctx, el, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const seqElemExpr: (el: SeqElem) => Expr = (el: SeqElem) =>
  match(el)
    .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
    .with({ _tag: "SESpread" }, ({ expr: e }) => e)
    .exhaustive();
const inferSeqSlotsElems: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  con: string,
  elem: Ty,
  elements: SeqElem[],
  st: St,
) => Result<St, PErr> = _curry(
  5,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    con: string,
    elem: Ty,
    elements: SeqElem[],
    st: St,
  ) =>
    match(elements)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st) as Result<St, PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([slot, ...rest]) =>
          ((ex: Expr) =>
            _Result_flatMap(
              ([et, st1]) =>
                ((want: Ty) =>
                  _Result_flatMap(
                    (st2) => inferSeqSlotsElems(ctx, con, elem, rest, st2),
                    u(want, et, st1, exprSpan(ex)),
                  ))(
                  match(slot)
                    .with({ _tag: "SEExpr" }, () => elem)
                    .with({ _tag: "SESpread" }, () => tCon(con, [elem]))
                    .exhaustive(),
                ),
              inferExpr(ctx, ex, st),
            ))(seqElemExpr(slot)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferSeqSlots: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  con: string,
  elements: SeqElem[],
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  4,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    con: string,
    elements: SeqElem[],
    st: St,
  ) =>
    (([elem, st1]: [Ty, St]) =>
      _Result_flatMap(
        (st2) => Ok(_tuple(tCon(con, [elem]), st2)) as Result<[Ty, St], PErr>,
        inferSeqSlotsElems(ctx, con, elem, elements, st1),
      ))(freshVar(st)),
);
const inferMapEntries: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  k: Ty,
  v: Ty,
  entries: MapEntry[],
  st: St,
) => Result<St, PErr> = _curry(
  5,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    k: Ty,
    v: Ty,
    entries: MapEntry[],
    st: St,
  ) =>
    match(entries)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st) as Result<St, PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([ent, ...rest]) =>
          _Result_flatMap(
            ([kt, st1]) =>
              _Result_flatMap(
                (st2) =>
                  _Result_flatMap(
                    ([vt, st3]) =>
                      _Result_flatMap(
                        (st4) => inferMapEntries(ctx, k, v, rest, st4),
                        u(v, vt, st3, exprSpan(ent.value)),
                      ),
                    inferExpr(ctx, ent.value, st2),
                  ),
                u(k, kt, st1, exprSpan(ent.key)),
              ),
            inferExpr(ctx, ent.key, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferMapExpr: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  entries: MapEntry[],
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    entries: MapEntry[],
    st: St,
  ) =>
    (([k, st1]: [Ty, St]) =>
      (([v, st2]: [Ty, St]) =>
        _Result_flatMap(
          (st3) => Ok(_tuple(tCon("Map", [k, v]), st3)) as Result<[Ty, St], PErr>,
          inferMapEntries(ctx, k, v, entries, st2),
        ))(freshVar(st1)))(freshVar(st)),
);
const mergeBindingMapsFrom: <A, B>(keys: A[], src: Map<A, B>, dest: Map<A, B>) => Map<A, B> =
  _curry(3, <A, B>(keys: A[], src: Map<A, B>, dest: Map<A, B>) =>
    match(keys)
      .with(
        (_v) => _v.length === 0,
        () => dest,
      )
      .with(
        (_v) => _v.length >= 1,
        ([k, ...rest]) =>
          match(_Map_get(k, src))
            .with({ _tag: "Some" }, ({ value: v }) =>
              mergeBindingMapsFrom(rest, src, _Map_set(k, v, dest)),
            )
            .with({ _tag: "None" }, () => mergeBindingMapsFrom(rest, src, dest))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
  );
const mergeBindingMaps: <A, B>(dest: Map<A, B>, src: Map<A, B>) => Map<A, B> = _curry(
  2,
  <A, B>(dest: Map<A, B>, src: Map<A, B>) => mergeBindingMapsFrom(_Map_keys(src), src, dest),
);
const mergeEnvBindingsFrom: <A, B, C, D>(
  keys: A[],
  bindings: Map<A, B>,
  env: Map<A, { vars: C[]; rvars: D[]; ty: B }>,
) => Map<A, { vars: C[]; rvars: D[]; ty: B }> = _curry(
  3,
  <A, B, C, D>(keys: A[], bindings: Map<A, B>, env: Map<A, { vars: C[]; rvars: D[]; ty: B }>) =>
    match(keys)
      .with(
        (_v) => _v.length === 0,
        () => env,
      )
      .with(
        (_v) => _v.length >= 1,
        ([k, ...rest]) =>
          match(_Map_get(k, bindings))
            .with({ _tag: "Some" }, ({ value: t }) =>
              mergeEnvBindingsFrom(rest, bindings, _Map_set(k, mono(t), env)),
            )
            .with({ _tag: "None" }, () => mergeEnvBindingsFrom(rest, bindings, env))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const mergeEnvBindings: <A, B, C, D>(
  bindings: Map<A, B>,
  env: Map<A, { vars: C[]; rvars: D[]; ty: B }>,
) => Map<A, { vars: C[]; rvars: D[]; ty: B }> = _curry(
  2,
  <A, B, C, D>(bindings: Map<A, B>, env: Map<A, { vars: C[]; rvars: D[]; ty: B }>) =>
    mergeEnvBindingsFrom(_Map_keys(bindings), bindings, env),
);
const inferArms: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  scrutT: Ty,
  resultT: Ty,
  arms: MatchArm[],
  st: St,
) => Result<St, PErr> = _curry(
  5,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    scrutT: Ty,
    resultT: Ty,
    arms: MatchArm[],
    st: St,
  ) =>
    match(arms)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st) as Result<St, PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([arm, ...rest]) =>
          _Result_flatMap(
            ([patT, bindings, st1]) =>
              _Result_flatMap(
                (st2) =>
                  ((armCtx) =>
                    _Result_flatMap(
                      (st3) =>
                        _Result_flatMap(
                          ([bodyT, st4]) =>
                            _Result_flatMap(
                              (st5) => inferArms(ctx, scrutT, resultT, rest, st5),
                              u(resultT, bodyT, st4, exprSpan(arm.body)),
                            ),
                          inferExpr(armCtx, arm.body, st3),
                        ),
                      match(arm.guard)
                        .with({ _tag: "None" }, () => Ok(st2) as Result<St, PErr>)
                        .with({ _tag: "Some" }, ({ value: g }) =>
                          _Result_flatMap(
                            ([guardT, stg]) => u(tBool, guardT, stg, exprSpan(g)),
                            inferExpr(armCtx, g, st2),
                          ),
                        )
                        .exhaustive(),
                    ))(ctxWithEnv(ctx, mergeEnvBindings(bindings, ctx.env))),
                u(scrutT, patT, st1, patSpan(arm.pattern)),
              ),
            inferPat(ctx, arm.pattern, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferMatch: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  scrutinee: Expr,
  arms: MatchArm[],
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  4,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    scrutinee: Expr,
    arms: MatchArm[],
    st: St,
  ) =>
    _Result_flatMap(
      ([scrutT, st1]) =>
        (([resultT, st2]: [Ty, St]) =>
          _Result_flatMap(
            (st3) => Ok(_tuple(resultT, st3)) as Result<[Ty, St], PErr>,
            inferArms(ctx, scrutT, resultT, arms, st2),
          ))(freshVar(st1)),
      inferExpr(ctx, scrutinee, st),
    ),
);
/**
 * Recording wrapper over `inferExprRaw` (mirrors src/infer.ts's `infer`):
 * every expression node's inferred type lands in `st.recorded`, keyed by span,
 * so the TS backend can annotate lambda params and empty literals (ADR 0090).
 */
const inferExpr: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  e: Expr,
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    e: Expr,
    st: St,
  ) =>
    _Result_flatMap(
      ([t, st1]) => Ok(_tuple(t, recordAt(exprSpan(e), t, st1))) as Result<[Ty, St], PErr>,
      inferExprRaw(ctx, e, st),
    ),
);
const inferExprRaw: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  e: Expr,
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    e: Expr,
    st: St,
  ) =>
    match(e)
      .with({ _tag: "ENum" }, () => Ok(_tuple(tNumber, st)) as Result<[Ty, St], PErr>)
      .with({ _tag: "EUnit" }, () => Ok(_tuple(tUnit, st)) as Result<[Ty, St], PErr>)
      .with({ _tag: "EBool" }, () => Ok(_tuple(tBool, st)) as Result<[Ty, St], PErr>)
      .with({ _tag: "EStr" }, ({ value }) => Ok(_tuple(tLit(value), st)) as Result<[Ty, St], PErr>)
      .with({ _tag: "ERef" }, ({ name, span: sp }) =>
        match(_Map_get(name, ctx.env))
          .with({ _tag: "Some" }, ({ value: sc }) =>
            (([t, st1]: [Ty, St]) =>
              Ok(
                _tuple(
                  t,
                  match(_Map_get(name, ctx.letOwner))
                    .with({ _tag: "Some" }, ({ value: vsp }) => noteUse(vsp, t, st1))
                    .with({ _tag: "None" }, () => st1)
                    .exhaustive(),
                ),
              ) as Result<[Ty, St], PErr>)(instantiate(sc, st)),
          )
          .with({ _tag: "None" }, () =>
            ctx.open
              ? (([t, st1]: [Ty, St]) => Ok(_tuple(t, st1)) as Result<[Ty, St], PErr>)(freshVar(st))
              : (Err(typeErr(`unbound variable '${name}'`, sp)) as Result<[Ty, St], PErr>),
          )
          .exhaustive(),
      )
      .with({ _tag: "ELambda" }, ({ params, body }) =>
        (([posParams, labParams]: [LamParam[], LamParam[]]) =>
          (([paramTypes, bodyEnv, st1]: [Ty[], Map<string, Scheme>, St]) =>
            _Result_flatMap(
              ([annotVars, st2]) =>
                _Result_flatMap(
                  ([labFields, st3]) =>
                    ((allTypes: Ty[]) =>
                      _Result_flatMap(
                        ([bodyT, st4]) =>
                          Ok(_tuple(arrowChain(allTypes, bodyT), st4)) as Result<[Ty, St], PErr>,
                        inferExpr(ctxWithEnv(ctx, envWithLabFields(labFields, bodyEnv)), body, st3),
                      ))(
                      match(labParams)
                        .with(
                          (_v) => {
                            const _g: any = _v;
                            return _g.length === 0;
                          },
                          () => paramTypes,
                        )
                        .otherwise(() =>
                          _Array_append(tRecord(rowOfLabFields(labFields)), paramTypes),
                        ),
                    ),
                  labFieldsFrom(ctx, labParams, bodyEnv, annotVars, st2),
                ),
              constrainParamAnnotsFrom(ctx, posParams, paramTypes, new Map<string, Ty>(), st1),
            ))(bindParamsFrom(posParams, ctx.env, st)))(
          splitLamParams(params, [] as LamParam[], [] as LamParam[]),
        ),
      )
      .with({ _tag: "ELetIn" }, ({ name, nameSpan: _nameSpan, value, body, span: _span }) =>
        match(value)
          .with({ _tag: "ELambda" }, () =>
            ((lets: Stmt[]) =>
              ((idxOf: Map<string, number>) =>
                ((tail: Expr) =>
                  _Result_flatMap(
                    ([localCtx, localSt]) => inferExpr(localCtx, tail, localSt),
                    processGroupsFrom(ctx, stronglyConnected(adjOf(lets, idxOf)), lets, st),
                  ))(localTail(e)))(idxOfMap(lets)))(localLetsFrom(e)),
          )
          .otherwise(() =>
            _Result_flatMap(
              ([valT, st1]) =>
                ((sc: Scheme) =>
                  ((vsp: SpanAt) =>
                    (($ctx) => inferExpr($ctx, body, noteLet(vsp, st1)))(
                      ctxWithLets(
                        ctx,
                        _Map_set(name, sc, ctx.env),
                        _Map_set(name, vsp, ctx.letOwner),
                      ),
                    ))(exprSpan(value)))(generalize(ctx.env, valT, st1, true)),
              inferExpr(ctx, value, st),
            ),
          ),
      )
      .with({ _tag: "ELetBind" }, ({ param, paramSpan, monad, value, body }) =>
        inferLetBind(ctx, e, param, paramSpan, monad, value, body, st),
      )
      .with({ _tag: "ECall" }, ({ fn, args, origin }) =>
        ((api: {
          inferExpr: (a: Expr, b: St) => Result<[Ty, St], PErr>;
          unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, PErr>;
        }) =>
          _Result_flatMap(
            (claimed) =>
              match(claimed)
                .with({ _tag: "Some" }, ({ value: r }) => Ok(r) as Result<[Ty, St], PErr>)
                .with({ _tag: "None" }, () => inferNormalCall(ctx, fn, args, st))
                .exhaustive(),
            runInferCallHooks(inferCallHooksOf(ctx.plugins), fn, args, origin, st, api),
          ))({ inferExpr: _curry(2, (e: Expr, st0: St) => inferExpr(ctx, e, st0)), unify: u }),
      )
      .with({ _tag: "EPipe" }, ({ left, right, span: sp }) =>
        inferExpr(ctx, Ast.ECall(right, [left], None as Option<string>, sp), st),
      )
      .with({ _tag: "EDo" }, ({ exprs }) => inferDo(ctx, exprs, st))
      .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
        inferTernary(ctx, cond, thenE, elseE, st),
      )
      .with({ _tag: "ERecord" }, ({ fields, spread, span: sp }) =>
        match(spread)
          .with({ _tag: "None" }, () =>
            _Result_flatMap(
              ([row, st1]) => Ok(_tuple(tRecord(row), st1)) as Result<[Ty, St], PErr>,
              inferRecordRow(ctx, fields, st),
            ),
          )
          .with({ _tag: "Some" }, ({ value: spreadExpr }) =>
            _Result_flatMap(
              ([row, st1]) =>
                _Result_flatMap(
                  ([baseT, st2]) =>
                    (([tailVar, st3]: [Row, St]) =>
                      _Result_flatMap(
                        (st4) => Ok(_tuple(baseT, st4)) as Result<[Ty, St], PErr>,
                        u(baseT, tRecord(rWithTail(row, tailVar)), st3, sp),
                      ))(freshRowVar(st2)),
                  inferExpr(ctx, spreadExpr, st1),
                ),
              inferRecordRow(ctx, fields, st),
            ),
          )
          .exhaustive(),
      )
      .with({ _tag: "EField" }, ({ target, name, span: sp }) =>
        match(target)
          .with({ _tag: "ERef" }, ({ name: tname }) =>
            and(_Map_has(tname, ctx.ns), not(_Map_has(tname, ctx.env)))
              ? inferNsField(ctx, tname, name, sp, st)
              : inferFieldAccess(ctx, target, name, sp, st),
          )
          .otherwise(() => inferFieldAccess(ctx, target, name, sp, st)),
      )
      .with({ _tag: "ETuple" }, ({ elements }) =>
        _Result_flatMap(
          ([elems, st1]) => Ok(_tuple(tTuple(elems), st1)) as Result<[Ty, St], PErr>,
          inferTupleElems(ctx, elements, st),
        ),
      )
      .with({ _tag: "EArr" }, ({ elements }) => inferSeqSlots(ctx, "Array", elements, st))
      .with({ _tag: "EList" }, ({ elements }) => inferSeqSlots(ctx, "List", elements, st))
      .with({ _tag: "ESet" }, ({ elements }) => inferSeqSlots(ctx, "Set", elements, st))
      .with({ _tag: "EMap" }, ({ entries }) => inferMapExpr(ctx, entries, st))
      .with({ _tag: "EMatch" }, ({ scrutinee, arms }) => inferMatch(ctx, scrutinee, arms, st))
      .with({ _tag: "ELoop" }, ({ params, body }) =>
        _Result_flatMap(
          ([frame, bodyEnv, bodyOwner, st1]) =>
            inferExpr(ctxWithLoop(ctx, bodyEnv, frame, bodyOwner), body, st1),
          inferLoopParamsFrom(ctx, params, 0, ctx.env, [] as Ty[], ctx.letOwner, st),
        ),
      )
      .with({ _tag: "ERecur" }, ({ args, span: sp }) => inferRecur(ctx, args, sp, st))
      .with({ _tag: "EInterp" }, ({ parts }) =>
        _Result_flatMap(
          (st1) => Ok(_tuple(tString, st1)) as Result<[Ty, St], PErr>,
          inferInterpParts(ctx, parts, st),
        ),
      )
      .exhaustive(),
);
const inferDo: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  exprs: Expr[],
  st: St,
) => Result<[Ty, St], PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    exprs: Expr[],
    st: St,
  ) =>
    match(exprs)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () =>
          Err(typeErr("internal: empty do block", { start: 0, end: 0 })) as Result<[Ty, St], PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 1;
        },
        ([last]) => inferExpr(ctx, last, st),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([first, ...rest]) =>
          _Result_flatMap(([_, st1]) => inferDo(ctx, rest, st1), inferExpr(ctx, first, st)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferPatRecordFrom: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  fields: PatField[],
  row: Row,
  bindings: Map<string, Ty>,
  st: St,
) => Result<[Row, Map<string, Ty>, St], PErr> = _curry(
  5,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    fields: PatField[],
    row: Row,
    bindings: Map<string, Ty>,
    st: St,
  ) =>
    match(fields)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(row, bindings, st)) as Result<[Row, Map<string, Ty>, St], PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([f, ...rest]) =>
          _Result_flatMap(
            ([subT, subBindings, st1]) =>
              inferPatRecordFrom(
                ctx,
                rest,
                rExtend(f.label, subT, row),
                mergeBindingMaps(bindings, subBindings),
                st1,
              ),
            inferPat(ctx, f.pat, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferPatRecord: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  fields: PatField[],
  st: St,
) => Result<[Ty, Map<string, Ty>, St], PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    fields: PatField[],
    st: St,
  ) =>
    (([rowBase, st1]: [Row, St]) =>
      _Result_flatMap(
        ([row, bindings, st2]) =>
          Ok(_tuple(tRecord(row), bindings, st2)) as Result<[Ty, Map<string, Ty>, St], PErr>,
        inferPatRecordFrom(ctx, fields, rowBase, new Map<string, Ty>(), st1),
      ))(freshRowVar(st)),
);
const inferPatCtorArgs: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  ctor: string,
  curT: Ty,
  args: Pattern[],
  st: St,
  bindings: Map<string, Ty>,
  sp: SpanAt,
) => Result<[Ty, Map<string, Ty>, St], PErr> = _curry(
  7,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    ctor: string,
    curT: Ty,
    args: Pattern[],
    st: St,
    bindings: Map<string, Ty>,
    sp: SpanAt,
  ) =>
    match(args)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(curT, bindings, st)) as Result<[Ty, Map<string, Ty>, St], PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([argPat, ...rest]) =>
          match(resolve(curT, st))
            .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
              _Result_flatMap(
                ([subT, subBindings, st1]) =>
                  _Result_flatMap(
                    (st2) =>
                      inferPatCtorArgs(
                        ctx,
                        ctor,
                        toT,
                        rest,
                        st2,
                        mergeBindingMaps(bindings, subBindings),
                        sp,
                      ),
                    u(fromT, subT, st1, patSpan(argPat)),
                  ),
                inferPat(ctx, argPat, st),
              ),
            )
            .otherwise(
              () =>
                Err(typeErr(`constructor '${ctor}' applied to too many arguments`, sp)) as Result<
                  [Ty, Map<string, Ty>, St],
                  PErr
                >,
            ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferPatTupleFrom: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  elems: Pattern[],
  st: St,
) => Result<[Ty[], Map<string, Ty>, St], PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    elems: Pattern[],
    st: St,
  ) =>
    match(elems)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () =>
          Ok(_tuple([] as Ty[], new Map<string, Ty>(), st)) as Result<
            [Ty[], Map<string, Ty>, St],
            PErr
          >,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([ep, ...rest]) =>
          _Result_flatMap(
            ([t, bindings, st1]) =>
              _Result_flatMap(
                ([restTs, restBindings, st2]) =>
                  Ok(
                    _tuple(
                      _Array_prepend(t, restTs),
                      mergeBindingMaps(restBindings, bindings),
                      st2,
                    ),
                  ) as Result<[Ty[], Map<string, Ty>, St], PErr>,
                inferPatTupleFrom(ctx, rest, st1),
              ),
            inferPat(ctx, ep, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferPatTuple: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  elems: Pattern[],
  st: St,
) => Result<[Ty, Map<string, Ty>, St], PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    elems: Pattern[],
    st: St,
  ) =>
    _Result_flatMap(
      ([elemTs, bindings, st1]) =>
        Ok(_tuple(tTuple(elemTs), bindings, st1)) as Result<[Ty, Map<string, Ty>, St], PErr>,
      inferPatTupleFrom(ctx, elems, st),
    ),
);
const inferSeqPatElems: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  elem: Ty,
  elems: Pattern[],
  st: St,
) => Result<[Map<string, Ty>, St], PErr> = _curry(
  4,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    elem: Ty,
    elems: Pattern[],
    st: St,
  ) =>
    match(elems)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(new Map<string, Ty>(), st)) as Result<[Map<string, Ty>, St], PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([ep, ...rest]) =>
          _Result_flatMap(
            ([subT, subBindings, st1]) =>
              _Result_flatMap(
                (st2) =>
                  _Result_flatMap(
                    ([restBindings, st3]) =>
                      Ok(_tuple(mergeBindingMaps(restBindings, subBindings), st3)) as Result<
                        [Map<string, Ty>, St],
                        PErr
                      >,
                    inferSeqPatElems(ctx, elem, rest, st2),
                  ),
                u(elem, subT, st1, patSpan(ep)),
              ),
            inferPat(ctx, ep, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferSeqPat: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  con: string,
  elems: Pattern[],
  restPat: Option<Pattern>,
  st: St,
) => Result<[Ty, Map<string, Ty>, St], PErr> = _curry(
  5,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    con: string,
    elems: Pattern[],
    restPat: Option<Pattern>,
    st: St,
  ) =>
    (([elem, st1]: [Ty, St]) => {
      const seqT: Ty = tCon(con, [elem]);
      return _Result_flatMap(
        ([bindings, st2]) =>
          match(restPat)
            .with(
              { _tag: "None" },
              () => Ok(_tuple(seqT, bindings, st2)) as Result<[Ty, Map<string, Ty>, St], PErr>,
            )
            .with({ _tag: "Some" }, ({ value: r }) =>
              _Result_flatMap(
                ([subT, subBindings, st3]) =>
                  _Result_flatMap(
                    (st4) =>
                      Ok(_tuple(seqT, mergeBindingMaps(bindings, subBindings), st4)) as Result<
                        [Ty, Map<string, Ty>, St],
                        PErr
                      >,
                    u(subT, seqT, st3, patSpan(r)),
                  ),
                inferPat(ctx, r, st2),
              ),
            )
            .exhaustive(),
        inferSeqPatElems(ctx, elem, elems, st1),
      );
    })(freshVar(st)),
);
/**
 * Pattern-side analogue of `inferExpr` — records every pattern node's span
 * and type, so a pattern-bound param can be annotated by span.
 */
const inferPat: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  p: Pattern,
  st: St,
) => Result<[Ty, Map<string, Ty>, St], PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    p: Pattern,
    st: St,
  ) =>
    _Result_flatMap(
      ([t, bindings, st1]) =>
        Ok(_tuple(t, bindings, recordAt(patSpan(p), t, st1))) as Result<
          [Ty, Map<string, Ty>, St],
          PErr
        >,
      inferPatRaw(ctx, p, st),
    ),
);
const inferPatRaw: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  p: Pattern,
  st: St,
) => Result<[Ty, Map<string, Ty>, St], PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    p: Pattern,
    st: St,
  ) =>
    match(p)
      .with({ _tag: "PAs" }, ({ pat, name }) =>
        _Result_flatMap(
          ([t, bindings, st1]) =>
            Ok(_tuple(t, _Map_set(name, t, bindings), st1)) as Result<
              [Ty, Map<string, Ty>, St],
              PErr
            >,
          inferPat(ctx, pat, st),
        ),
      )
      .with({ _tag: "PWild" }, () =>
        (([t, st1]: [Ty, St]) =>
          Ok(_tuple(t, new Map<string, Ty>(), st1)) as Result<[Ty, Map<string, Ty>, St], PErr>)(
          freshVar(st),
        ),
      )
      .with(
        { _tag: "PUnit" },
        () =>
          Ok(_tuple(tUnit, new Map<string, Ty>(), st)) as Result<[Ty, Map<string, Ty>, St], PErr>,
      )
      .with(
        { _tag: "PLit" },
        () =>
          Ok(_tuple(tNumber, new Map<string, Ty>(), st)) as Result<[Ty, Map<string, Ty>, St], PErr>,
      )
      .with(
        { _tag: "PBool" },
        () =>
          Ok(_tuple(tBool, new Map<string, Ty>(), st)) as Result<[Ty, Map<string, Ty>, St], PErr>,
      )
      .with(
        { _tag: "PStr" },
        ({ value }) =>
          Ok(_tuple(tLit(value), new Map<string, Ty>(), st)) as Result<
            [Ty, Map<string, Ty>, St],
            PErr
          >,
      )
      .with({ _tag: "PBind" }, ({ name }) =>
        (([t, st1]: [Ty, St]) =>
          Ok(_tuple(t, _Map_set(name, t, new Map<string, Ty>()), st1)) as Result<
            [Ty, Map<string, Ty>, St],
            PErr
          >)(freshVar(st)),
      )
      .with({ _tag: "PRecord" }, ({ fields }) => inferPatRecord(ctx, fields, st))
      .with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) =>
        match(ns)
          .with({ _tag: "Some" }, ({ value: alias }) =>
            match(_Map_get(ctor, _Map_getOr(new Map<string, Scheme>(), alias, ctx.ns)))
              .with(
                { _tag: "None" },
                () =>
                  Err(typeErr(`'${alias}' has no member '${ctor}'`, sp)) as Result<
                    [Ty, Map<string, Ty>, St],
                    PErr
                  >,
              )
              .with({ _tag: "Some" }, ({ value: sc }) =>
                (([curT, st1]: [Ty, St]) =>
                  inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map<string, Ty>(), sp))(
                  instantiate(sc, st),
                ),
              )
              .exhaustive(),
          )
          .with({ _tag: "None" }, () =>
            match(_Map_get(ctor, ctx.env))
              .with(
                { _tag: "None" },
                () =>
                  Err(typeErr(`unknown constructor '${ctor}'`, sp)) as Result<
                    [Ty, Map<string, Ty>, St],
                    PErr
                  >,
              )
              .with({ _tag: "Some" }, ({ value: sc }) =>
                (([curT, st1]: [Ty, St]) =>
                  inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map<string, Ty>(), sp))(
                  instantiate(sc, st),
                ),
              )
              .exhaustive(),
          )
          .exhaustive(),
      )
      .with({ _tag: "PTuple" }, ({ elems }) => inferPatTuple(ctx, elems, st))
      .with({ _tag: "PArr" }, ({ elems, rest }) => inferSeqPat(ctx, "Array", elems, rest, st))
      .with({ _tag: "PList" }, ({ elems, rest }) => inferSeqPat(ctx, "List", elems, rest, st))
      .with({ _tag: "POr" }, ({ alts, span: sp }) => inferOrPat(ctx, alts, sp, st))
      .exhaustive(),
);
const unifyOrPatBinding: <A, B, C, D>(
  name: A,
  altBindings: Map<A, Ty>,
  bindings: Map<A, Ty>,
  st: St,
  sp: { end: B; start: C } & D,
) => Result<St, { message: string; start: C; end: B }> = _curry(
  5,
  <A, B, C, D>(
    name: A,
    altBindings: Map<A, Ty>,
    bindings: Map<A, Ty>,
    st: St,
    sp: { end: B; start: C } & D,
  ) =>
    match(_Map_get(name, bindings))
      .with({ _tag: "None" }, () => Ok(st))
      .with({ _tag: "Some" }, ({ value: prevT }) =>
        match(_Map_get(name, altBindings))
          .with({ _tag: "None" }, () => Ok(st))
          .with({ _tag: "Some" }, ({ value: ty }) => u(prevT, ty, st, sp))
          .exhaustive(),
      )
      .exhaustive(),
);
const unifyOrPatBindings: <A, B, C, D>(
  names: A[],
  altBindings: Map<A, Ty>,
  bindings: Map<A, Ty>,
  st: St,
  sp: { end: B; start: C } & D,
) => Result<St, { message: string; start: C; end: B }> = _curry(
  5,
  <A, B, C, D>(
    names: A[],
    altBindings: Map<A, Ty>,
    bindings: Map<A, Ty>,
    st: St,
    sp: { end: B; start: C } & D,
  ) =>
    match(names)
      .with(
        (_v) => _v.length === 0,
        () => Ok(st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([name, ...rest]) =>
          _Result_flatMap(
            (st1) => unifyOrPatBindings(rest, altBindings, bindings, st1, sp),
            unifyOrPatBinding(name, altBindings, bindings, st, sp),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferOrPatAlts: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  alts: Pattern[],
  i: number,
  t: Ty,
  bindings: Map<string, Ty>,
  st: St,
) => Result<St, PErr> = _curry(
  6,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    alts: Pattern[],
    i: number,
    t: Ty,
    bindings: Map<string, Ty>,
    st: St,
  ) =>
    match(_Array_get(i, alts))
      .with({ _tag: "None" }, () => Ok(st) as Result<St, PErr>)
      .with({ _tag: "Some" }, ({ value: alt }) =>
        _Result_flatMap(
          ([altT, altBindings, st1]) =>
            _Result_flatMap(
              (st2) =>
                _Result_flatMap(
                  (st3) => inferOrPatAlts(ctx, alts, add(i, 1), t, bindings, st3),
                  unifyOrPatBindings(
                    _Map_keys(altBindings),
                    altBindings,
                    bindings,
                    st2,
                    patSpan(alt),
                  ),
                ),
              u(t, altT, st1, patSpan(alt)),
            ),
          inferPat(ctx, alt, st),
        ),
      )
      .exhaustive(),
);
const inferOrPat: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  alts: Pattern[],
  sp: SpanAt,
  st: St,
) => Result<[Ty, Map<string, Ty>, St], PErr> = _curry(
  4,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    alts: Pattern[],
    sp: SpanAt,
    st: St,
  ) =>
    match(alts)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () =>
          Err(typeErr("or-pattern needs at least one alternative", sp)) as Result<
            [Ty, Map<string, Ty>, St],
            PErr
          >,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([first, ...rest]) =>
          _Result_flatMap(
            ([t, bindings, st1]) =>
              _Result_flatMap(
                (st2) => Ok(_tuple(t, bindings, st2)) as Result<[Ty, Map<string, Ty>, St], PErr>,
                inferOrPatAlts(ctx, rest, 0, t, bindings, st1),
              ),
            inferPat(ctx, first, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const patternBindsOpt: (rest: Option<Pattern>) => string[] = (rest: Option<Pattern>) =>
  match(rest)
    .with({ _tag: "Some" }, ({ value: r }) => patternBinds(r))
    .with({ _tag: "None" }, () => [] as string[])
    .exhaustive();
const patternBinds: (p: Pattern) => string[] = (p: Pattern) =>
  match(p)
    .with({ _tag: "PAs" }, ({ pat, name }) => _Array_append(name, patternBinds(pat)))
    .with({ _tag: "PBind" }, ({ name }) => [name])
    .with({ _tag: "PRecord" }, ({ fields }) =>
      _Array_flatMap((f: PatField) => patternBinds(f.pat), fields),
    )
    .with({ _tag: "PCtor" }, ({ args }) => _Array_flatMap(patternBinds, args))
    .with({ _tag: "PTuple" }, ({ elems }) => _Array_flatMap(patternBinds, elems))
    .with({ _tag: "PArr" }, ({ elems, rest }) =>
      _Array_concat(_Array_flatMap(patternBinds, elems), patternBindsOpt(rest)),
    )
    .with({ _tag: "PList" }, ({ elems, rest }) =>
      _Array_concat(_Array_flatMap(patternBinds, elems), patternBindsOpt(rest)),
    )
    .with({ _tag: "POr" }, ({ alts }) =>
      match(_Array_head(alts))
        .with({ _tag: "Some" }, ({ value: first }) => patternBinds(first))
        .with({ _tag: "None" }, () => [] as string[])
        .exhaustive(),
    )
    .otherwise(() => [] as string[]);
const addAllFrom: <A>(names: A[], set: Set<A>) => Set<A> = _curry(2, <A>(names: A[], set: Set<A>) =>
  match(names)
    .with(
      (_v) => _v.length === 0,
      () => set,
    )
    .with(
      (_v) => _v.length >= 1,
      ([n, ...rest]) => addAllFrom(rest, _Set_add(n, set)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const paramBound: _Curry<[p: LamParam, bound: Set<string>], Set<string>> = _curry(
  2,
  (p: LamParam, bound: Set<string>) =>
    match(p)
      .with({ _tag: "LPName" }, ({ name }) => _Set_add(name, bound))
      .with({ _tag: "LPTuple" }, ({ names }) => addAllFrom(names, bound))
      .with({ _tag: "LPRecord" }, ({ fields }) => addAllFrom(fields, bound))
      .with({ _tag: "LPLabeled" }, ({ name }) => _Set_add(name, bound))
      .exhaustive(),
);
const lambdaBound: _Curry<[params: LamParam[], bound: Set<string>], Set<string>> = _curry(
  2,
  (params: LamParam[], bound: Set<string>) =>
    match(params)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => bound,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([p, ...rest]) => lambdaBound(rest, paramBound(p, bound)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * A labeled default names the enclosing scope, not the lambda's own params,
 * so its refs are free in the lambda — the SCC needs that edge (ADR 0098 §2).
 */
const labeledDefaultRefs: _Curry<
  [params: LamParam[], bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(3, (params: LamParam[], bound: Set<string>, acc: Set<string>) =>
  match(params)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => acc,
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([p, ...rest]) =>
        match(p)
          .with(
            (
              _v,
            ): _v is Extract<LamParam, { _tag: "LPLabeled" }> & {
              defaultValue: Extract<
                Extract<LamParam, { _tag: "LPLabeled" }>["defaultValue"],
                { _tag: "Some" }
              >;
            } => {
              const _g: any = _v;
              return _g._tag === "LPLabeled" && _g.defaultValue._tag === "Some";
            },
            ({ defaultValue: { value: d } }) =>
              labeledDefaultRefs(rest, bound, freeRefs(d, bound, acc)),
          )
          .otherwise(() => labeledDefaultRefs(rest, bound, acc)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const loopBound: <A, B>(params: ({ name: A } & B)[], bound: Set<A>) => Set<A> = _curry(
  2,
  <A, B>(params: ({ name: A } & B)[], bound: Set<A>) =>
    reduce(
      _curry(2, (b: Set<A>, p: { name: A } & B) => _Set_add(p.name, b)),
      bound,
      params,
    ),
);
const loopInitRefsFrom: _Curry<
  [params: LoopParam[], i: number, bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(4, (params: LoopParam[], i: number, bound: Set<string>, acc: Set<string>) =>
  match(_Array_get(i, params))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: p }) =>
      loopInitRefsFrom(params, add(i, 1), bound, freeRefs(p.init, bound, acc)),
    )
    .exhaustive(),
);
const freeRefsList: _Curry<
  [es: Expr[], bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(3, (es: Expr[], bound: Set<string>, acc: Set<string>) =>
  match(es)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => acc,
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([e, ...rest]) => freeRefsList(rest, bound, freeRefs(e, bound, acc)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const freeRefsFields: _Curry<
  [fields: Field[], bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(3, (fields: Field[], bound: Set<string>, acc: Set<string>) =>
  match(fields)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => acc,
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([f, ...rest]) => freeRefsFields(rest, bound, freeRefs(f.value, bound, acc)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const freeRefsEntries: _Curry<
  [entries: MapEntry[], bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(3, (entries: MapEntry[], bound: Set<string>, acc: Set<string>) =>
  match(entries)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => acc,
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([ent, ...rest]) =>
        freeRefsEntries(rest, bound, freeRefs(ent.value, bound, freeRefs(ent.key, bound, acc))),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const freeRefsInterpParts: _Curry<
  [parts: InterpPart[], bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(3, (parts: InterpPart[], bound: Set<string>, acc: Set<string>) =>
  match(parts)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => acc,
    )
    .with(
      (_v): _v is [Extract<InterpPart[][number], { _tag: "IPLit" }>, ...InterpPart[]] => {
        const _g: any = _v;
        return _g.length >= 1 && _g[0]._tag === "IPLit";
      },
      ([, ...rest]) => freeRefsInterpParts(rest, bound, acc),
    )
    .with(
      (_v): _v is [Extract<InterpPart[][number], { _tag: "IPExpr" }>, ...InterpPart[]] => {
        const _g: any = _v;
        return _g.length >= 1 && _g[0]._tag === "IPExpr";
      },
      ([{ expr: ex }, ...rest]) => freeRefsInterpParts(rest, bound, freeRefs(ex, bound, acc)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const freeRefsArms: _Curry<
  [arms: MatchArm[], bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(3, (arms: MatchArm[], bound: Set<string>, acc: Set<string>) =>
  match(arms)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => acc,
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([arm, ...rest]) =>
        ((armBound: Set<string>) =>
          ((acc1: Set<string>) => freeRefsArms(rest, bound, freeRefs(arm.body, armBound, acc1)))(
            match(arm.guard)
              .with({ _tag: "Some" }, ({ value: g }) => freeRefs(g, armBound, acc))
              .with({ _tag: "None" }, () => acc)
              .exhaustive(),
          ))(addAllFrom(patternBinds(arm.pattern), bound)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const freeRefs: _Curry<[e: Expr, bound: Set<string>, acc: Set<string>], Set<string>> = _curry(
  3,
  (e: Expr, bound: Set<string>, acc: Set<string>) =>
    match(e)
      .with({ _tag: "ENum" }, () => acc)
      .with({ _tag: "EUnit" }, () => acc)
      .with({ _tag: "EBool" }, () => acc)
      .with({ _tag: "EStr" }, () => acc)
      .with({ _tag: "ERef" }, ({ name }) => (_Set_has(name, bound) ? acc : _Set_add(name, acc)))
      .with({ _tag: "ECall" }, ({ fn, args }) =>
        freeRefsList(args, bound, freeRefs(fn, bound, acc)),
      )
      .with({ _tag: "ELambda" }, ({ params, body }) =>
        freeRefs(body, lambdaBound(params, bound), labeledDefaultRefs(params, bound, acc)),
      )
      .with({ _tag: "ELetIn" }, ({ name, value, body }) =>
        ((valueBound: Set<string>) =>
          ((acc1: Set<string>) => freeRefs(body, _Set_add(name, bound), acc1))(
            freeRefs(value, valueBound, acc),
          ))(
          match(value)
            .with({ _tag: "ELambda" }, () => _Set_add(name, bound))
            .otherwise(() => bound),
        ),
      )
      .with({ _tag: "ELetBind" }, ({ param, value, body }) =>
        ((acc1: Set<string>) => freeRefs(body, paramBound(param, bound), acc1))(
          freeRefs(value, bound, acc),
        ),
      )
      .with({ _tag: "EPipe" }, ({ left, right }) =>
        freeRefs(right, bound, freeRefs(left, bound, acc)),
      )
      .with({ _tag: "EDo" }, ({ exprs }) => freeRefsList(exprs, bound, acc))
      .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
        freeRefs(elseE, bound, freeRefs(thenE, bound, freeRefs(cond, bound, acc))),
      )
      .with({ _tag: "EMatch" }, ({ scrutinee, arms }) =>
        freeRefsArms(arms, bound, freeRefs(scrutinee, bound, acc)),
      )
      .with({ _tag: "ELoop" }, ({ params, body }) =>
        freeRefs(body, loopBound(params, bound), loopInitRefsFrom(params, 0, bound, acc)),
      )
      .with({ _tag: "ERecur" }, ({ args }) => freeRefsList(args, bound, acc))
      .with({ _tag: "ERecord" }, ({ fields, spread }) =>
        freeRefsFields(
          fields,
          bound,
          match(spread)
            .with({ _tag: "Some" }, ({ value: s }) => freeRefs(s, bound, acc))
            .with({ _tag: "None" }, () => acc)
            .exhaustive(),
        ),
      )
      .with({ _tag: "EField" }, ({ target }) => freeRefs(target, bound, acc))
      .with({ _tag: "ETuple" }, ({ elements }) => freeRefsList(elements, bound, acc))
      .with({ _tag: "EArr" }, ({ elements }) =>
        freeRefsList(map(seqElemExpr, elements), bound, acc),
      )
      .with({ _tag: "EList" }, ({ elements }) =>
        freeRefsList(map(seqElemExpr, elements), bound, acc),
      )
      .with({ _tag: "ESet" }, ({ elements }) =>
        freeRefsList(map(seqElemExpr, elements), bound, acc),
      )
      .with({ _tag: "EMap" }, ({ entries }) => freeRefsEntries(entries, bound, acc))
      .with({ _tag: "EInterp" }, ({ parts }) => freeRefsInterpParts(parts, bound, acc))
      .exhaustive(),
);
const seedBuiltinsFrom: <A>(
  keys: A[],
  builtins: Map<A, Ty>,
  env: Map<A, Scheme>,
  st: St,
) => Map<A, Scheme> = _curry(4, <A>(keys: A[], builtins: Map<A, Ty>, env: Map<A, Scheme>, st: St) =>
  match(keys)
    .with(
      (_v) => _v.length === 0,
      () => env,
    )
    .with(
      (_v) => _v.length >= 1,
      ([n, ...rest]) =>
        match(_Map_get(n, builtins))
          .with({ _tag: "Some" }, ({ value: t }) =>
            seedBuiltinsFrom(rest, builtins, _Map_set(n, generalize(env, t, st, true), env), st),
          )
          .with({ _tag: "None" }, () => seedBuiltinsFrom(rest, builtins, env, st))
          .exhaustive(),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const seedBuiltins: <A>(builtins: Map<A, Ty>, env: Map<A, Scheme>, st: St) => Map<A, Scheme> =
  _curry(3, <A>(builtins: Map<A, Ty>, env: Map<A, Scheme>, st: St) =>
    seedBuiltinsFrom(_Map_keys(builtins), builtins, env, st),
  );
const seedNsMembersFrom: <A, B, C>(
  keys: A[],
  members: Map<A, Ty>,
  env: Map<B, { ty: Ty; rvars: number[]; vars: number[] } & C>,
  st: St,
  acc: Map<A, Scheme>,
) => Map<A, Scheme> = _curry(
  5,
  <A, B, C>(
    keys: A[],
    members: Map<A, Ty>,
    env: Map<B, { ty: Ty; rvars: number[]; vars: number[] } & C>,
    st: St,
    acc: Map<A, Scheme>,
  ) =>
    match(keys)
      .with(
        (_v) => _v.length === 0,
        () => acc,
      )
      .with(
        (_v) => _v.length >= 1,
        ([m, ...rest]) =>
          match(_Map_get(m, members))
            .with({ _tag: "Some" }, ({ value: t }) =>
              seedNsMembersFrom(
                rest,
                members,
                env,
                st,
                _Map_set(m, generalize(env, t, st, true), acc),
              ),
            )
            .with({ _tag: "None" }, () => seedNsMembersFrom(rest, members, env, st, acc))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const seedNsFrom: <A, B, C, D>(
  nsNames: A[],
  namespaces: Map<A, Map<B, Ty>>,
  env: Map<C, { ty: Ty; rvars: number[]; vars: number[] } & D>,
  st: St,
  acc: Map<A, Map<B, Scheme>>,
) => Map<A, Map<B, Scheme>> = _curry(
  5,
  <A, B, C, D>(
    nsNames: A[],
    namespaces: Map<A, Map<B, Ty>>,
    env: Map<C, { ty: Ty; rvars: number[]; vars: number[] } & D>,
    st: St,
    acc: Map<A, Map<B, Scheme>>,
  ) =>
    match(nsNames)
      .with(
        (_v) => _v.length === 0,
        () => acc,
      )
      .with(
        (_v) => _v.length >= 1,
        ([nsName, ...rest]) =>
          match(_Map_get(nsName, namespaces))
            .with({ _tag: "Some" }, ({ value: members }) =>
              seedNsFrom(
                rest,
                namespaces,
                env,
                st,
                _Map_set(
                  nsName,
                  seedNsMembersFrom(_Map_keys(members), members, env, st, new Map<B, Scheme>()),
                  acc,
                ),
              ),
            )
            .with({ _tag: "None" }, () => seedNsFrom(rest, namespaces, env, st, acc))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const seedNs: <A, B, C, D>(
  namespaces: Map<A, Map<B, Ty>>,
  env: Map<C, { ty: Ty; rvars: number[]; vars: number[] } & D>,
  st: St,
) => Map<A, Map<B, Scheme>> = _curry(
  3,
  <A, B, C, D>(
    namespaces: Map<A, Map<B, Ty>>,
    env: Map<C, { ty: Ty; rvars: number[]; vars: number[] } & D>,
    st: St,
  ) => seedNsFrom(_Map_keys(namespaces), namespaces, env, st, new Map<A, Map<B, Scheme>>()),
);
const seedNsImportsFrom: <A, B>(aliases: A[], nsImports: Map<A, B>, ns: Map<A, B>) => Map<A, B> =
  _curry(3, <A, B>(aliases: A[], nsImports: Map<A, B>, ns: Map<A, B>) =>
    match(aliases)
      .with(
        (_v) => _v.length === 0,
        () => ns,
      )
      .with(
        (_v) => _v.length >= 1,
        ([alias, ...rest]) =>
          match(_Map_get(alias, nsImports))
            .with({ _tag: "Some" }, ({ value: members }) =>
              seedNsImportsFrom(rest, nsImports, _Map_set(alias, members, ns)),
            )
            .with({ _tag: "None" }, () => seedNsImportsFrom(rest, nsImports, ns))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
  );
const seedNsImports: <A, B>(nsImports: Map<A, B>, ns: Map<A, B>) => Map<A, B> = _curry(
  2,
  <A, B>(nsImports: Map<A, B>, ns: Map<A, B>) =>
    seedNsImportsFrom(_Map_keys(nsImports), nsImports, ns),
);
const aliasMapFrom: _Curry<
  [stmts: Stmt[], acc: Map<string, AliasInfo>],
  Map<string, AliasInfo>
> = _curry(2, (stmts: Stmt[], acc: Map<string, AliasInfo>) =>
  match(stmts)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => acc,
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([s, ...rest]) =>
        match(s)
          .with(
            (
              _v,
            ): _v is Extract<Stmt, { _tag: "SType" }> & {
              alias: Extract<Extract<Stmt, { _tag: "SType" }>["alias"], { _tag: "Some" }>;
            } => {
              const _g: any = _v;
              return _g._tag === "SType" && _g.alias._tag === "Some";
            },
            ({ name, params, alias: { value: fields } }) =>
              aliasMapFrom(
                rest,
                _Map_set(
                  name,
                  { params: params, fields: fields, expr: None as Option<TypeExpr> },
                  acc,
                ),
              ),
          )
          .with(
            (
              _v,
            ): _v is Extract<Stmt, { _tag: "SType" }> & {
              aliasType: Extract<Extract<Stmt, { _tag: "SType" }>["aliasType"], { _tag: "Some" }>;
            } => {
              const _g: any = _v;
              return _g._tag === "SType" && _g.aliasType._tag === "Some";
            },
            ({ name, params, aliasType: { value: te } }) =>
              aliasMapFrom(
                rest,
                _Map_set(
                  name,
                  {
                    params: params,
                    fields: [] as QualAliasField[],
                    expr: Some(te) as Option<TypeExpr>,
                  },
                  acc,
                ),
              ),
          )
          .otherwise(() => aliasMapFrom(rest, acc)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const registerCtorsFrom: <A, B>(
  ctors: ({ name: A; fields: CtorField[] } & B)[],
  typeName: string,
  params: string[],
  aliasMap: Map<string, AliasInfo>,
  env: Map<A, Scheme>,
  st: St,
) => [Map<A, Scheme>, St] = _curry(
  6,
  <A, B>(
    ctors: ({ name: A; fields: CtorField[] } & B)[],
    typeName: string,
    params: string[],
    aliasMap: Map<string, AliasInfo>,
    env: Map<A, Scheme>,
    st: St,
  ) =>
    match(ctors)
      .with(
        (_v) => _v.length === 0,
        () => _tuple(env, st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([c, ...rest]) =>
          (([sc, st1]: [Scheme, St]) =>
            registerCtorsFrom(rest, typeName, params, aliasMap, _Map_set(c.name, sc, env), st1))(
            ctorScheme(typeName, params, c, st, aliasMap),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const registerUserCtorsFrom: _Curry<
  [stmts: Stmt[], aliasMap: Map<string, AliasInfo>, env: Map<string, Scheme>, st: St],
  [Map<string, Scheme>, St]
> = _curry(4, (stmts: Stmt[], aliasMap: Map<string, AliasInfo>, env: Map<string, Scheme>, st: St) =>
  match(stmts)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => _tuple(env, st),
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([s, ...rest]) =>
        match(s)
          .with({ _tag: "SType" }, ({ name, params, ctors }) =>
            (([env1, st1]: [Map<string, Scheme>, St]) =>
              registerUserCtorsFrom(rest, aliasMap, env1, st1))(
              registerCtorsFrom(ctors, name, params, aliasMap, env, st),
            ),
          )
          .otherwise(() => registerUserCtorsFrom(rest, aliasMap, env, st)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const registerBuiltinCtorGroup: <A, B>(
  ctors: ({ name: A; fields: CtorField[] } & B)[],
  typeName: string,
  params: string[],
  aliasMap: Map<string, AliasInfo>,
  env: Map<A, Scheme>,
  st: St,
) => [Map<A, Scheme>, St] = _curry(
  6,
  <A, B>(
    ctors: ({ name: A; fields: CtorField[] } & B)[],
    typeName: string,
    params: string[],
    aliasMap: Map<string, AliasInfo>,
    env: Map<A, Scheme>,
    st: St,
  ) =>
    match(ctors)
      .with(
        (_v) => _v.length === 0,
        () => _tuple(env, st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([c, ...rest]) =>
          _Map_has(c.name, env)
            ? registerBuiltinCtorGroup(rest, typeName, params, aliasMap, env, st)
            : (([sc, st1]: [Scheme, St]) =>
                registerBuiltinCtorGroup(
                  rest,
                  typeName,
                  params,
                  aliasMap,
                  _Map_set(c.name, sc, env),
                  st1,
                ))(ctorScheme(typeName, params, c, st, aliasMap)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const registerBuiltinCtorsFrom: <A, B, C>(
  decls: ({
    ctors: ({ name: A; fields: CtorField[] } & B)[];
    name: string;
    params: string[];
  } & C)[],
  aliasMap: Map<string, AliasInfo>,
  env: Map<A, Scheme>,
  st: St,
) => [Map<A, Scheme>, St] = _curry(
  4,
  <A, B, C>(
    decls: ({
      ctors: ({ name: A; fields: CtorField[] } & B)[];
      name: string;
      params: string[];
    } & C)[],
    aliasMap: Map<string, AliasInfo>,
    env: Map<A, Scheme>,
    st: St,
  ) =>
    match(decls)
      .with(
        (_v) => _v.length === 0,
        () => _tuple(env, st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([d, ...rest]) =>
          (([env1, st1]: [Map<A, Scheme>, St]) =>
            registerBuiltinCtorsFrom(rest, aliasMap, env1, st1))(
            registerBuiltinCtorGroup(d.ctors, d.name, d.params, aliasMap, env, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const registerExternsFrom: _Curry<
  [stmts: Stmt[], aliasMap: Map<string, AliasInfo>, env: Map<string, Scheme>, st: St],
  [Map<string, Scheme>, St]
> = _curry(4, (stmts: Stmt[], aliasMap: Map<string, AliasInfo>, env: Map<string, Scheme>, st: St) =>
  match(stmts)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => _tuple(env, st),
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([s, ...rest]) =>
        match(s)
          .with({ _tag: "SExtern" }, ({ name, params, typeExpr }) =>
            (([vars, st0]: [Map<string, Ty>, St]) =>
              (([t, _, st1]: [Ty, Map<string, Ty>, St]) =>
                registerExternsFrom(
                  rest,
                  aliasMap,
                  _Map_set(name, generalize(env, t, st1, false), env),
                  st1,
                ))(typeExprToType(typeExpr, vars, st0, aliasMap, _Set_fromArray([] as string[]))))(
              reduce(
                _curry(2, ([vs, s]: [Map<string, Ty>, St], param: string) =>
                  (([v, s1]: [Ty, St]) => _tuple(_Map_set(param, v, vs), s1))(freshVar(s)),
                ),
                _tuple(new Map<string, Ty>(), st),
                params,
              ),
            ),
          )
          .otherwise(() => registerExternsFrom(rest, aliasMap, env, st)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const letsOfFrom: (stmts: Stmt[]) => Stmt[] = (stmts: Stmt[]) =>
  match(stmts)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => [] as Stmt[],
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([s, ...rest]) =>
        match(s)
          .with({ _tag: "SLet" }, () => _Array_prepend(s, letsOfFrom(rest)))
          .otherwise(() => letsOfFrom(rest)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    });
const localLetsFrom: (e: Expr) => Stmt[] = (e: Expr) => {
  const collect: (a: Expr, b: Stmt[]) => Stmt[] = _curry(2, (current: Expr, acc: Stmt[]) =>
    match(current)
      .with({ _tag: "ELetIn" }, ({ name, nameSpan, value, body, span }) =>
        match(value)
          .with({ _tag: "ELambda" }, () =>
            collect(
              body,
              _Array_append(
                Ast.SLet(
                  name,
                  nameSpan,
                  None as Option<TypeExpr>,
                  value,
                  false,
                  None as Option<string>,
                  span,
                ),
                acc,
              ),
            ),
          )
          .otherwise(() => acc),
      )
      .otherwise(() => acc),
  );
  return collect(e, [] as Stmt[]);
};
const localTail: (e: Expr) => Expr = (e: Expr) =>
  match(e)
    .with(
      (
        _v,
      ): _v is Extract<Expr, { _tag: "ELetIn" }> & {
        value: Extract<Extract<Expr, { _tag: "ELetIn" }>["value"], { _tag: "ELambda" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "ELetIn" && _g.value._tag === "ELambda";
      },
      ({ body }) => localTail(body),
    )
    .otherwise(() => e);
const idxOfFrom: _Curry<
  [lets: Stmt[], i0: number, acc0: Map<string, number>],
  Map<string, number>
> = _curry(3, (lets: Stmt[], i0: number, acc0: Map<string, number>) => {
  let i: number = i0;
  let acc: Map<string, number> = acc0;
  while (true) {
    const _step = match(_Array_get(i, lets))
      .with({ _tag: "None" }, () => _done(acc))
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SLet";
        },
        ({ value: { name } }) => _recur(add(i, 1), _Map_set(name, i, acc)),
      )
      .with({ _tag: "Some" }, () => _recur(add(i, 1), acc))
      .exhaustive();
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
});
const idxOfMap: (lets: Stmt[]) => Map<string, number> = (lets: Stmt[]) =>
  idxOfFrom(lets, 0, new Map<string, number>());
const depsOf: <A>(letStmt: Stmt, idxOf: Map<string, A>) => A[] = _curry(
  2,
  <A>(letStmt: Stmt, idxOf: Map<string, A>) =>
    match(letStmt)
      .with({ _tag: "SLet" }, ({ value }) =>
        _Array_flatMap(
          (r: string) =>
            match(_Map_get(r, idxOf))
              .with({ _tag: "Some" }, ({ value: j }) => [j])
              .with({ _tag: "None" }, () => [] as A[])
              .exhaustive(),
          _Set_toArray(
            freeRefs(value, _Set_fromArray([] as string[]), _Set_fromArray([] as string[])),
          ),
        ),
      )
      .otherwise(() => [] as A[]),
);
const adjOf: <A>(lets: Stmt[], idxOf: Map<string, A>) => A[][] = _curry(
  2,
  <A>(lets: Stmt[], idxOf: Map<string, A>) => map((s: Stmt) => depsOf(s, idxOf), lets),
);
const groupOfFrom: <A>(idxs: number[], lets: A[]) => A[] = _curry(
  2,
  <A>(idxs: number[], lets: A[]) =>
    match(idxs)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => [] as A[],
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([i, ...rest]) =>
          match(_Array_get(i, lets))
            .with({ _tag: "Some" }, ({ value: s }) => _Array_prepend(s, groupOfFrom(rest, lets)))
            .with({ _tag: "None" }, () => groupOfFrom(rest, lets))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const preBindGroupFrom: <A, B>(
  group: Stmt[],
  env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
  st: St,
) => [Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, St] = _curry(
  3,
  <A, B>(group: Stmt[], env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, st: St) =>
    match(group)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => _tuple(env, st),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([s, ...rest]) =>
          match(s)
            .with({ _tag: "SLet" }, ({ name }) =>
              (([v, st1]: [Ty, St]) => preBindGroupFrom(rest, _Map_set(name, mono(v), env), st1))(
                freshVar(st),
              ),
            )
            .otherwise(() => preBindGroupFrom(rest, env, st)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferGroupFrom: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  group: Stmt[],
  st: St,
) => Result<[Map<string, Ty>, St], PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    group: Stmt[],
    st: St,
  ) =>
    match(group)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(new Map<string, Ty>(), st)) as Result<[Map<string, Ty>, St], PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([s, ...rest]) =>
          match(s)
            .with({ _tag: "SLet" }, ({ name, annot, value, span }) =>
              _Result_flatMap(
                ([t, st1]) =>
                  match(_Map_get(name, ctx.env))
                    .with({ _tag: "Some" }, ({ value: selfSc }) =>
                      _Result_flatMap(
                        (st2) =>
                          _Result_flatMap(
                            ([pinned, st3]) =>
                              _Result_flatMap(
                                ([restTypes, st4]) =>
                                  Ok(_tuple(_Map_set(name, pinned, restTypes), st4)) as Result<
                                    [Map<string, Ty>, St],
                                    PErr
                                  >,
                                inferGroupFrom(ctx, rest, st3),
                              ),
                            match(annot)
                              .with({ _tag: "Some" }, ({ value: te }) =>
                                (([at, _, stA]: [Ty, Map<string, Ty>, St]) =>
                                  _Result_map(
                                    (stB: St) => _tuple(at, stB),
                                    checkFits(t, at, stA, annotSpan(te)),
                                  ))(
                                  typeExprToType(
                                    te,
                                    new Map<string, Ty>(),
                                    st2,
                                    ctx.aliasMap,
                                    _Set_fromArray([] as string[]),
                                  ),
                                ),
                              )
                              .with(
                                { _tag: "None" },
                                () => Ok(_tuple(t, st2)) as Result<[Ty, St], PErr>,
                              )
                              .exhaustive(),
                          ),
                        u(selfSc.ty, t, st1, span),
                      ),
                    )
                    .with(
                      { _tag: "None" },
                      () =>
                        Err(
                          typeErr(`internal: missing self-binding for '${name}'`, span),
                        ) as Result<[Map<string, Ty>, St], PErr>,
                    )
                    .exhaustive(),
                inferExpr(ctx, value, st),
              ),
            )
            .otherwise(() => inferGroupFrom(ctx, rest, st)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const dropGroupFrom: <A>(group: Stmt[], env: Map<string, A>) => Map<string, A> = _curry(
  2,
  <A>(group: Stmt[], env: Map<string, A>) =>
    match(group)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => env,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([s, ...rest]) =>
          match(s)
            .with({ _tag: "SLet" }, ({ name }) => dropGroupFrom(rest, _Map_delete(name, env)))
            .otherwise(() => dropGroupFrom(rest, env)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const generalizeGroupFrom: _Curry<
  [group: Stmt[], bodyTypes: Map<string, Ty>, env: Map<string, Scheme>, st: St],
  Map<string, Scheme>
> = _curry(4, (group: Stmt[], bodyTypes: Map<string, Ty>, env: Map<string, Scheme>, st: St) =>
  match(group)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => env,
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([s, ...rest]) =>
        match(s)
          .with({ _tag: "SLet" }, ({ name, annot }) =>
            match(_Map_get(name, bodyTypes))
              .with({ _tag: "Some" }, ({ value: t }) =>
                ((widen: boolean) =>
                  generalizeGroupFrom(
                    rest,
                    bodyTypes,
                    _Map_set(name, generalize(env, t, st, widen), env),
                    st,
                  ))(
                  match(annot)
                    .with({ _tag: "None" }, () => true)
                    .with({ _tag: "Some" }, () => false)
                    .exhaustive(),
                ),
              )
              .with({ _tag: "None" }, () => generalizeGroupFrom(rest, bodyTypes, env, st))
              .exhaustive(),
          )
          .otherwise(() => generalizeGroupFrom(rest, bodyTypes, env, st)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const noteGroupLets: _Curry<
  [group: Stmt[], letOwner: Map<string, SpanAt>, st: St],
  [Map<string, SpanAt>, St]
> = _curry(3, (group: Stmt[], letOwner: Map<string, SpanAt>, st: St) =>
  match(group)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => _tuple(letOwner, st),
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([s, ...rest]) =>
        match(s)
          .with(
            (_v): _v is Extract<Stmt, { _tag: "SLet" }> => {
              const _g: any = _v;
              return (
                _g._tag === "SLet" && (({ name, value }) => not(_Str_startsWith("$", name)))(_g)
              );
            },
            ({ name, value }) =>
              ((sp: SpanAt) => noteGroupLets(rest, _Map_set(name, sp, letOwner), noteLet(sp, st)))(
                exprSpan(value),
              ),
          )
          .otherwise(() => noteGroupLets(rest, letOwner, st)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const processGroupsFrom: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  sccs: number[][],
  lets: Stmt[],
  st: St,
) => Result<
  [
    {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    St,
  ],
  PErr
> = _curry(
  4,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    sccs: number[][],
    lets: Stmt[],
    st: St,
  ) =>
    match(sccs)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(ctx, st)),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([comp, ...restSccs]) =>
          ((group: Stmt[]) =>
            (([preEnv, st1]: [Map<string, Scheme>, St]) => {
              const preCtx = ctxWithEnv(ctx, preEnv);
              return _Result_flatMap(
                ([bodyTypes, st2]) =>
                  ((finalEnv: Map<string, Scheme>) =>
                    (([finalOwner, st3]: [Map<string, SpanAt>, St]) =>
                      processGroupsFrom(
                        ctxWithLets(ctx, finalEnv, finalOwner),
                        restSccs,
                        lets,
                        st3,
                      ))(noteGroupLets(group, ctx.letOwner, st2)))(
                    generalizeGroupFrom(group, bodyTypes, dropGroupFrom(group, preEnv), st2),
                  ),
                inferGroupFrom(preCtx, group, st1),
              );
            })(preBindGroupFrom(group, ctx.env, st)))(groupOfFrom(comp, lets)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferExprStmtsFrom: <A>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, AliasInfo>;
    plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
  },
  stmts: Stmt[],
  st: St,
) => Result<St, PErr> = _curry(
  3,
  <A>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, AliasInfo>;
      plugins: {
        name: string;
        parse: Option<
          (
            a: { tok: A; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: A; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
    },
    stmts: Stmt[],
    st: St,
  ) =>
    match(stmts)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st) as Result<St, PErr>,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([s, ...rest]) =>
          match(s)
            .with({ _tag: "SExpr" }, ({ value, span }) =>
              _Result_flatMap(
                ([t, st1]) =>
                  _Result_flatMap(
                    (st2) => inferExprStmtsFrom(ctx, rest, st2),
                    u(t, tUnit, st1, span),
                  ),
                inferExpr(ctx, value, st),
              ),
            )
            .otherwise(() => inferExprStmtsFrom(ctx, rest, st)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const seedImportsFrom: <A, B>(keys: A[], imports: Map<A, B>, env: Map<A, B>) => Map<A, B> = _curry(
  3,
  <A, B>(keys: A[], imports: Map<A, B>, env: Map<A, B>) =>
    match(keys)
      .with(
        (_v) => _v.length === 0,
        () => env,
      )
      .with(
        (_v) => _v.length >= 1,
        ([k, ...rest]) =>
          match(_Map_get(k, imports))
            .with({ _tag: "Some" }, ({ value: sc }) =>
              seedImportsFrom(rest, imports, _Map_set(k, sc, env)),
            )
            .with({ _tag: "None" }, () => seedImportsFrom(rest, imports, env))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * Re-point a dep alias's OWN type references at the dep. A field written in
 * the dep names a sibling alias BARE (`letSpans: Map<string, SpanAt>`), but the
 * seeded table lives in the IMPORTER, where that bare name means nothing — so
 * `SpanAt` would lower nominally and then refuse to unify with the row it
 * stands for. src/schemes.ts has no such problem: it expands an alias in the
 * DECLARING module's scope (`TypeScope`), where the sibling is in plain sight.
 * Qualifying the reference at seed time is that same resolution, done once and
 * carried in the TypeExpr, so nothing downstream needs a scope threaded
 * through it.
 *
 * Only names the dep declares as ALIASES move: a variant crosses under its
 * bare name already, and a type PARAM is lowercase and never an alias key.
 */
const qualifyTe: <A>(te: TypeExpr, alias: string, from: Map<string, A>) => TypeExpr = _curry(
  3,
  <A>(te: TypeExpr, alias: string, from: Map<string, A>) =>
    match(te)
      .with({ _tag: "TyName" }, ({ name, span: sp }) =>
        _Map_has(name, from) ? Ast.TyQual(alias, name, sp, [] as TypeExpr[], sp) : te,
      )
      .with({ _tag: "TyApp" }, ({ ctor, args, span: sp }) =>
        ((args1: TypeExpr[]) =>
          _Map_has(ctor, from)
            ? Ast.TyQual(alias, ctor, sp, args1, sp)
            : Ast.TyApp(ctor, args1, sp))(map((a: TypeExpr) => qualifyTe(a, alias, from), args)),
      )
      .with({ _tag: "TyArrow" }, ({ from: fromTe, to: toTe, span: sp }) =>
        Ast.TyArrow(qualifyTe(fromTe, alias, from), qualifyTe(toTe, alias, from), sp),
      )
      .with({ _tag: "TyTuple" }, ({ elems, span: sp }) =>
        Ast.TyTuple(
          map((e: TypeExpr) => qualifyTe(e, alias, from), elems),
          sp,
        ),
      )
      .with({ _tag: "TyList" }, ({ elem, span: sp }) =>
        Ast.TyList(qualifyTe(elem, alias, from), sp),
      )
      .with({ _tag: "TyUnion" }, ({ members, span: sp }) =>
        Ast.TyUnion(
          map((m: TypeExpr) => qualifyTe(m, alias, from), members),
          sp,
        ),
      )
      .otherwise(() => te),
);
const qualifyField: <A, B, C, D>(
  fld: { optional: A; fieldType: TypeExpr; name: B } & D,
  alias: string,
  from: Map<string, C>,
) => { name: B; fieldType: TypeExpr; optional: A } = _curry(
  3,
  <A, B, C, D>(
    fld: { optional: A; fieldType: TypeExpr; name: B } & D,
    alias: string,
    from: Map<string, C>,
  ) => ({
    name: fld.name,
    fieldType: qualifyTe(fld.fieldType, alias, from),
    optional: fld.optional,
  }),
);
const qualifyInfo: <A, B, C, D, E, F>(
  info: {
    expr: Option<TypeExpr>;
    fields: ({ optional: A; fieldType: TypeExpr; name: B } & E)[];
    params: C;
  } & F,
  alias: string,
  from: Map<string, D>,
) => {
  params: C;
  fields: { name: B; fieldType: TypeExpr; optional: A }[];
  expr: Option<TypeExpr>;
} = _curry(
  3,
  <A, B, C, D, E, F>(
    info: {
      expr: Option<TypeExpr>;
      fields: ({ optional: A; fieldType: TypeExpr; name: B } & E)[];
      params: C;
    } & F,
    alias: string,
    from: Map<string, D>,
  ) => ({
    params: info.params,
    fields: map(
      (f: { optional: A; fieldType: TypeExpr; name: B } & E) => qualifyField(f, alias, from),
      info.fields,
    ),
    expr: _Option_map((te: TypeExpr) => qualifyTe(te, alias, from), info.expr),
  }),
);
const qualAliasSeedFrom: <A, B, C, D, E>(
  names: string[],
  alias: string,
  from: Map<
    string,
    {
      expr: Option<TypeExpr>;
      fields: ({ optional: A; fieldType: TypeExpr; name: B } & D)[];
      params: C;
    } & E
  >,
  acc: Map<
    string,
    { params: C; fields: { name: B; fieldType: TypeExpr; optional: A }[]; expr: Option<TypeExpr> }
  >,
) => Map<
  string,
  { params: C; fields: { name: B; fieldType: TypeExpr; optional: A }[]; expr: Option<TypeExpr> }
> = _curry(
  4,
  <A, B, C, D, E>(
    names: string[],
    alias: string,
    from: Map<
      string,
      {
        expr: Option<TypeExpr>;
        fields: ({ optional: A; fieldType: TypeExpr; name: B } & D)[];
        params: C;
      } & E
    >,
    acc: Map<
      string,
      { params: C; fields: { name: B; fieldType: TypeExpr; optional: A }[]; expr: Option<TypeExpr> }
    >,
  ) =>
    match(names)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => acc,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([n, ...rest]) =>
          qualAliasSeedFrom(
            rest,
            alias,
            from,
            match(_Map_get(n, from))
              .with({ _tag: "Some" }, ({ value: info }) =>
                _Map_set(`${alias}.${n}`, qualifyInfo(info, alias, from), acc),
              )
              .with({ _tag: "None" }, () => acc)
              .exhaustive(),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const qualAliasSeed: <A, B, C, D, E, F>(
  stmts: Stmt[],
  quals: Map<
    string,
    {
      aliases: Map<
        string,
        {
          expr: Option<TypeExpr>;
          fields: ({ optional: A; fieldType: TypeExpr; name: B } & D)[];
          params: C;
        } & E
      >;
    } & F
  >,
  acc: Map<
    string,
    { params: C; fields: { name: B; fieldType: TypeExpr; optional: A }[]; expr: Option<TypeExpr> }
  >,
) => Map<
  string,
  { params: C; fields: { name: B; fieldType: TypeExpr; optional: A }[]; expr: Option<TypeExpr> }
> = _curry(
  3,
  <A, B, C, D, E, F>(
    stmts: Stmt[],
    quals: Map<
      string,
      {
        aliases: Map<
          string,
          {
            expr: Option<TypeExpr>;
            fields: ({ optional: A; fieldType: TypeExpr; name: B } & D)[];
            params: C;
          } & E
        >;
      } & F
    >,
    acc: Map<
      string,
      { params: C; fields: { name: B; fieldType: TypeExpr; optional: A }[]; expr: Option<TypeExpr> }
    >,
  ) =>
    match(stmts)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => acc,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([s, ...rest]) =>
          qualAliasSeed(
            rest,
            quals,
            match(s)
              .with({ _tag: "SImportNs" }, ({ alias }) =>
                match(_Map_get(alias.name, quals))
                  .with({ _tag: "Some" }, ({ value: dep }) =>
                    qualAliasSeedFrom(_Map_keys(dep.aliases), alias.name, dep.aliases, acc),
                  )
                  .with({ _tag: "None" }, () => acc)
                  .exhaustive(),
              )
              .otherwise(() => acc),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * Zonk every recorded node type against the FINAL state and restore source
 * order (`recordAt` prepends). Mirrors src/infer.ts: types are only resolved
 * once the whole program's substitution is settled, and later records win when
 * two nodes share a span.
 */
const zonkRecorded: <A, B>(recorded: ({ ty: Ty; span: A } & B)[], st: St) => { span: A; ty: Ty }[] =
  _curry(2, <A, B>(recorded: ({ ty: Ty; span: A } & B)[], st: St) =>
    map(
      (r: { ty: Ty; span: A } & B) => ({ span: r.span, ty: zonk(r.ty, st) }),
      _Array_reverse(recorded),
    ),
  );
/**
 * A type with no free type OR row vars — the only kind worth annotating from:
 * a generic position has nowhere to bind letters at a `const` / IIFE param.
 */
const isConcrete: (t: Ty) => boolean = (t: Ty) => {
  const f: VarSets = freeInType(t);
  return and(eq(_Set_size(f.tv), 0), eq(_Set_size(f.rv), 0));
};
const allSameConcreteFrom: _Curry<[shown: string, uses: Ty[], i: number], boolean> = _curry(
  3,
  (shown: string, uses: Ty[], i: number) =>
    match(_Array_get(i, uses))
      .with({ _tag: "None" }, () => true)
      .with({ _tag: "Some" }, ({ value: t }) =>
        and(isConcrete(t), eq(showType(t), shown))
          ? allSameConcreteFrom(shown, uses, add(i, 1))
          : false,
      )
      .exhaustive(),
);
const allSameConcrete: _Curry<[shown: string, uses: Ty[]], boolean> = _curry(
  2,
  (shown: string, uses: Ty[]) => allSameConcreteFrom(shown, uses, 0),
);
/**
 * Resolve `letParams` for TS emit (ADR 0035): a noted `let` is annotated only
 * when its body instantiated it at ONE fully-concrete type. Uses zonk against
 * the FINAL state, like `zonkRecorded` — a use recorded mid-inference is still
 * full of unsolved vars.
 */
const resolveLetParamsFrom: _Curry<[keys: string[], st: St], TypeAt[]> = _curry(
  2,
  (keys: string[], st: St) =>
    match(keys)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => [] as TypeAt[],
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([k, ...rest]) =>
          ((tail: TypeAt[]) =>
            ((uses: Ty[]) =>
              match(_Array_get(0, uses))
                .with({ _tag: "None" }, () => tail)
                .with({ _tag: "Some" }, ({ value: first }) =>
                  allSameConcrete(showType(first), uses)
                    ? match(_Map_get(k, st.letSpans))
                        .with({ _tag: "Some" }, ({ value: span }) =>
                          _Array_prepend({ span: span, ty: first }, tail),
                        )
                        .with({ _tag: "None" }, () => tail)
                        .exhaustive()
                    : tail,
                )
                .exhaustive())(map((t: Ty) => zonk(t, st), _Map_getOr([] as Ty[], k, st.letUses))))(
            resolveLetParamsFrom(rest, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const resolveLetParams: (st: St) => TypeAt[] = (st: St) =>
  resolveLetParamsFrom(_Map_keys(st.letSpans), st);
/**
 * Full inference result — the metadata the TS backend needs on top of `env`
 * (ADR 0090), including `letParams` (ADR 0035).
 */
const runInferImports: <A, B, C>(
  stmts: Stmt[],
  builtins: Map<string, Ty>,
  namespaces: Map<string, Map<string, Ty>>,
  openMode: boolean,
  imports: Map<string, Scheme>,
  nsImports: Map<string, Map<string, Scheme>>,
  quals: Map<
    string,
    {
      aliases: Map<
        string,
        {
          expr: Option<TypeExpr>;
          fields: ({ optional: boolean; fieldType: TypeExpr; name: string } & A)[];
          params: string[];
        } & B
      >;
    } & C
  >,
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[]
  >,
) => Result<
  {
    env: Map<string, Scheme>;
    types: TypeAt[];
    aliases: Map<string, AliasInfo>;
    letParams: TypeAt[];
  },
  PErr
> = _curry(
  8,
  <A, B, C>(
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    imports: Map<string, Scheme>,
    nsImports: Map<string, Map<string, Scheme>>,
    quals: Map<
      string,
      {
        aliases: Map<
          string,
          {
            expr: Option<TypeExpr>;
            fields: ({ optional: boolean; fieldType: TypeExpr; name: string } & A)[];
            params: string[];
          } & B
        >;
      } & C
    >,
    pluginsOpt: Option<
      {
        name: string;
        parse: Option<
          (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[]
    >,
  ) => {
    const plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[] = resolvePluginsDefault(pluginsOpt);
    const st0: St = mkSt(1000);
    const env0: Map<string, Scheme> = seedBuiltins(builtins, new Map<string, Scheme>(), st0);
    const ns0: Map<string, Map<string, Scheme>> = seedNsImports(
      nsImports,
      seedNs(namespaces, env0, st0),
    );
    const aliasMap: Map<string, AliasInfo> = aliasMapFrom(
      stmts,
      qualAliasSeed(stmts, quals, new Map<string, AliasInfo>()),
    );
    return (([env1, st1]: [Map<string, Scheme>, St]) =>
      (([env2, st2]: [Map<string, Scheme>, St]) =>
        (([env3, st3]: [Map<string, Scheme>, St]) => {
          const env4: Map<string, Scheme> = seedImportsFrom(_Map_keys(imports), imports, env3);
          const lets: Stmt[] = letsOfFrom(stmts);
          const idxOf: Map<string, number> = idxOfMap(lets);
          const sccs: number[][] = stronglyConnected(adjOf(lets, idxOf));
          return match(
            processGroupsFrom(
              {
                env: env4,
                open: openMode,
                ns: ns0,
                aliasMap: aliasMap,
                plugins: plugins,
                loopStack: [] as Ty[][],
                letOwner: new Map<string, SpanAt>(),
              },
              sccs,
              lets,
              st3,
            ),
          )
            .with(
              (
                _v,
              ): _v is Extract<
                Result<
                  [
                    {
                      env: Map<string, Scheme>;
                      open: boolean;
                      ns: Map<string, Map<string, Scheme>>;
                      aliasMap: Map<string, AliasInfo>;
                      plugins: {
                        name: string;
                        parse: Option<
                          (
                            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
                            b: number,
                            c: (
                              a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
                              b: number,
                            ) => Result<[Expr, number], PErr>,
                          ) => Result<Option<[Expr, number]>, PErr>
                        >;
                        inferCall: Option<
                          (
                            a: Expr,
                            b: Expr[],
                            c: Option<string>,
                            d: St,
                            e: InferApi,
                          ) => Result<Option<[Ty, St]>, PErr>
                        >;
                      }[];
                      loopStack: Ty[][];
                      letOwner: Map<string, SpanAt>;
                    },
                    St,
                  ],
                  PErr
                >,
                { _tag: "Ok" }
              > => {
                const _g: any = _v;
                return _g._tag === "Ok";
              },
              ({ value: [finalCtx, st4] }) =>
                match(inferExprStmtsFrom(finalCtx, stmts, st4))
                  .with(
                    { _tag: "Ok" },
                    ({ value: st5 }) =>
                      Ok({
                        env: finalCtx.env,
                        types: zonkRecorded(st5.recorded, st5),
                        aliases: aliasMap,
                        letParams: resolveLetParams(st5),
                      }) as Result<
                        {
                          env: Map<string, Scheme>;
                          types: TypeAt[];
                          aliases: Map<string, AliasInfo>;
                          letParams: TypeAt[];
                        },
                        PErr
                      >,
                  )
                  .with(
                    { _tag: "Err" },
                    ({ error: e }) =>
                      Err(e) as Result<
                        {
                          env: Map<string, Scheme>;
                          types: TypeAt[];
                          aliases: Map<string, AliasInfo>;
                          letParams: TypeAt[];
                        },
                        PErr
                      >,
                  )
                  .exhaustive(),
            )
            .with(
              { _tag: "Err" },
              ({ error: e }) =>
                Err(e) as Result<
                  {
                    env: Map<string, Scheme>;
                    types: TypeAt[];
                    aliases: Map<string, AliasInfo>;
                    letParams: TypeAt[];
                  },
                  PErr
                >,
            )
            .exhaustive();
        })(registerExternsFrom(stmts, aliasMap, env2, st2)))(
        registerBuiltinCtorsFrom(builtinDeclsFor(stmts), aliasMap, env1, st1),
      ))(registerUserCtorsFrom(stmts, aliasMap, env0, st0));
  },
);
/**
 * Env-only view — the shape every existing caller (compile.mochi,
 * module.mochi) and the TS parity oracle expect.
 */
export const inferProgramImports: <A, B, C>(
  stmts: Stmt[],
  builtins: Map<string, Ty>,
  namespaces: Map<string, Map<string, Ty>>,
  openMode: boolean,
  imports: Map<string, Scheme>,
  nsImports: Map<string, Map<string, Scheme>>,
  quals: Map<
    string,
    {
      aliases: Map<
        string,
        {
          expr: Option<TypeExpr>;
          fields: ({ optional: boolean; fieldType: TypeExpr; name: string } & A)[];
          params: string[];
        } & B
      >;
    } & C
  >,
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[]
  >,
) => Result<Map<string, Scheme>, PErr> = _curry(
  8,
  <A, B, C>(
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    imports: Map<string, Scheme>,
    nsImports: Map<string, Map<string, Scheme>>,
    quals: Map<
      string,
      {
        aliases: Map<
          string,
          {
            expr: Option<TypeExpr>;
            fields: ({ optional: boolean; fieldType: TypeExpr; name: string } & A)[];
            params: string[];
          } & B
        >;
      } & C
    >,
    pluginsOpt: Option<
      {
        name: string;
        parse: Option<
          (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[]
    >,
  ) =>
    _Result_map(
      (r: {
        env: Map<string, Scheme>;
        types: TypeAt[];
        aliases: Map<string, AliasInfo>;
        letParams: TypeAt[];
      }) => r.env,
      runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt),
    ),
);

const emptyQuals: Map<string, QualScope> = new Map<string, QualScope>();
export const inferProgram: _Curry<
  [
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ],
  Result<Map<string, Scheme>, PErr>
> = _curry(
  4,
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ) =>
    inferProgramImports(
      stmts,
      builtins,
      namespaces,
      openMode,
      new Map<string, Scheme>(),
      new Map<string, Map<string, Scheme>>(),
      emptyQuals,
      None as Option<
        {
          name: string;
          parse: Option<
            (
              a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
              b: number,
              c: (
                a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
                b: number,
              ) => Result<[Expr, number], PErr>,
            ) => Result<Option<[Expr, number]>, PErr>
          >;
          inferCall: Option<
            (
              a: Expr,
              b: Expr[],
              c: Option<string>,
              d: St,
              e: InferApi,
            ) => Result<Option<[Ty, St]>, PErr>
          >;
        }[]
      >,
    ),
);
/**
 * The imports-aware full result — what the TS GRAPH driver needs (ADR 0090).
 * `inferProgramImports` throws away everything but `env`; a module in a graph
 * still has to annotate from its span -> type table, so the driver calls this
 * instead and reads `env` off the record itself.
 */
export const inferProgramImportsTypes: <A, B, C>(
  stmts: Stmt[],
  builtins: Map<string, Ty>,
  namespaces: Map<string, Map<string, Ty>>,
  openMode: boolean,
  imports: Map<string, Scheme>,
  nsImports: Map<string, Map<string, Scheme>>,
  quals: Map<
    string,
    {
      aliases: Map<
        string,
        {
          expr: Option<TypeExpr>;
          fields: ({ optional: boolean; fieldType: TypeExpr; name: string } & A)[];
          params: string[];
        } & B
      >;
    } & C
  >,
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, PErr>
      >;
    }[]
  >,
) => Result<
  {
    env: Map<string, Scheme>;
    types: TypeAt[];
    aliases: Map<string, AliasInfo>;
    letParams: TypeAt[];
  },
  PErr
> = _curry(
  8,
  <A, B, C>(
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    imports: Map<string, Scheme>,
    nsImports: Map<string, Map<string, Scheme>>,
    quals: Map<
      string,
      {
        aliases: Map<
          string,
          {
            expr: Option<TypeExpr>;
            fields: ({ optional: boolean; fieldType: TypeExpr; name: string } & A)[];
            params: string[];
          } & B
        >;
      } & C
    >,
    pluginsOpt: Option<
      {
        name: string;
        parse: Option<
          (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[]
    >,
  ) =>
    runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt),
);
/**
 * Like `inferProgram`, but also returns the span -> type map and alias scope
 * the TS backend drives annotation from (ADR 0090).
 */
export const inferProgramTypes: _Curry<
  [
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ],
  Result<
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, AliasInfo>;
      letParams: TypeAt[];
    },
    PErr
  >
> = _curry(
  4,
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ) =>
    runInferImports(
      stmts,
      builtins,
      namespaces,
      openMode,
      new Map<string, Scheme>(),
      new Map<string, Map<string, Scheme>>(),
      emptyQuals,
      None as Option<
        {
          name: string;
          parse: Option<
            (
              a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
              b: number,
              c: (
                a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
                b: number,
              ) => Result<[Expr, number], PErr>,
            ) => Result<Option<[Expr, number]>, PErr>
          >;
          inferCall: Option<
            (
              a: Expr,
              b: Expr[],
              c: Option<string>,
              d: St,
              e: InferApi,
            ) => Result<Option<[Ty, St]>, PErr>
          >;
        }[]
      >,
    ),
);
export const inferProgramWith: _Curry<
  [
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    pluginsOpt: Option<
      {
        name: string;
        parse: Option<
          (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[]
    >,
  ],
  Result<Map<string, Scheme>, PErr>
> = _curry(
  5,
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    pluginsOpt: Option<
      {
        name: string;
        parse: Option<
          (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
            c: (
              a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
              b: number,
            ) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: InferApi,
          ) => Result<Option<[Ty, St]>, PErr>
        >;
      }[]
    >,
  ) =>
    inferProgramImports(
      stmts,
      builtins,
      namespaces,
      openMode,
      new Map<string, Scheme>(),
      new Map<string, Map<string, Scheme>>(),
      emptyQuals,
      pluginsOpt,
    ),
);
const takeScheme: <A, B>(name: A, env: Map<A, B>, acc: Map<A, B>) => Map<A, B> = _curry(
  3,
  <A, B>(name: A, env: Map<A, B>, acc: Map<A, B>) =>
    match(_Map_get(name, env))
      .with({ _tag: "Some" }, ({ value: sc }) => _Map_set(name, sc, acc))
      .with({ _tag: "None" }, () => acc)
      .exhaustive(),
);
const exportCtorsInto: <A, B, C>(
  ctors: ({ name: A } & C)[],
  i: number,
  env: Map<A, B>,
  acc: Map<A, B>,
) => Map<A, B> = _curry(
  4,
  <A, B, C>(ctors: ({ name: A } & C)[], i: number, env: Map<A, B>, acc: Map<A, B>) =>
    match(_Array_get(i, ctors))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: c }) =>
        exportCtorsInto(ctors, add(i, 1), env, takeScheme(c.name, env, acc)),
      )
      .exhaustive(),
);
const exportedSchemesFrom: <A>(
  stmts: Stmt[],
  i0: number,
  env: Map<string, A>,
  acc0: Map<string, A>,
) => Map<string, A> = _curry(
  4,
  <A>(stmts: Stmt[], i0: number, env: Map<string, A>, acc0: Map<string, A>) => {
    let i: number = i0;
    let acc = acc0;
    while (true) {
      const _step = match(_Array_get(i, stmts))
        .with({ _tag: "None" }, () => _done(acc))
        .with(
          (
            _v,
          ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
            value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
          } => {
            const _g: any = _v;
            return _g._tag === "Some" && _g.value._tag === "SLet" && _g.value.exported === true;
          },
          ({ value: { name } }) => _recur(add(i, 1), takeScheme(name, env, acc)),
        )
        .with(
          (
            _v,
          ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
            value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SExtern" }>;
          } => {
            const _g: any = _v;
            return _g._tag === "Some" && _g.value._tag === "SExtern" && _g.value.exported === true;
          },
          ({ value: { name } }) => _recur(add(i, 1), takeScheme(name, env, acc)),
        )
        .with(
          (
            _v,
          ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
            value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
          } => {
            const _g: any = _v;
            return _g._tag === "Some" && _g.value._tag === "SType" && _g.value.exported === true;
          },
          ({ value: { ctors } }) => _recur(add(i, 1), exportCtorsInto(ctors, 0, env, acc)),
        )
        .with({ _tag: "Some" }, () => _recur(add(i, 1), acc))
        .exhaustive();
      if (_step._tag === "recur") {
        [i, acc] = _step.args;
        continue;
      }
      return _step.value;
    }
  },
);
export const exportedSchemes: <A>(stmts: Stmt[], env: Map<string, A>) => Map<string, A> = _curry(
  2,
  <A>(stmts: Stmt[], env: Map<string, A>) =>
    exportedSchemesFrom(stmts, 0, env, new Map<string, A>()),
);
