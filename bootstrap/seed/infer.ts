import type { PErr, Tok } from "./parser";
import type {
  AliasField,
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
  Span,
  Stmt,
  TypeExpr,
} from "./ast";
import type { Row, St, Ty, TypeAt } from "./types";
import type { Scheme, VarSets } from "./schemes";

export type Option<A> = { _tag: "Some"; value: A } | { _tag: "None" };
export type Result<A, B> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: B };
export type IErr = PErr;
export type QualAliasField = AliasField;
export type QualAliasInfo = { params: string[]; fields: QualAliasField[]; expr: Option<TypeExpr> };
export type QualScope = { aliases: Map<string, QualAliasInfo> };

import {
  _curry,
  _recur,
  _done,
  Some,
  None,
  Ok,
  Err,
  add,
  eq,
  not,
  and,
  map,
  reduce,
  _Set_has,
  _Set_add,
  _Set_size,
  _Set_toArray,
  _Set_fromArray,
  _Map_has,
  _Map_getOr,
  _Map_set,
  _Map_delete,
  _Map_keys,
  _Map_get,
  _Result_map,
  _Result_flatMap,
  _Array_head,
  _Array_get,
  _Array_reverse,
  _Array_concat,
  _Array_append,
  _Array_prepend,
  _Array_flatMap,
  _Str_startsWith,
  _tuple,
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
  tPrim,
  tTuple,
  tUnit,
  tLit,
  rVar,
  rExtend,
  showType,
  mkSt,
  recordAt,
  noteLet,
  noteUse,
  freshVar,
  freshRowVar,
  resolve,
  zonk,
  occurs,
  unify,
  unifyRows,
} from "./types";
import * as Ast from "./ast";
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
  typeExprListToType,
  ctorScheme,
  isUpperStart,
  freeInType,
} from "./schemes";
import { stronglyConnected } from "./scc";
export const exprSpan: (e: Expr) => Span = (e: Expr) =>
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
const patSpan: (p: Pattern) => Span = (p: Pattern) =>
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

const annotSpan: (t: TypeExpr) => Span = (t: TypeExpr) =>
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
const u: <A, B, C, D>(
  a: Ty,
  b: Ty,
  st: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & C,
  sp: { end: A; start: B } & D,
) => Result<
  { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & C,
  { message: string; start: B; end: A }
> = _curry(
  4,
  <A, B, C, D>(
    a: Ty,
    b: Ty,
    st: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & C,
    sp: { end: A; start: B } & D,
  ) =>
    match(unify(a, b, st))
      .with({ _tag: "Ok" }, ({ value: newSt }) => Ok(newSt))
      .with({ _tag: "Err" }, ({ error: e }) => Err(typeErr(e.message, sp)))
      .exhaustive(),
);
const bindParamNamesFrom: <A, B, C, D>(
  names: A[],
  env: Map<A, { vars: B[]; rvars: C[]; ty: Ty }>,
  st: { next: number } & D,
) => [Ty[], Map<A, { vars: B[]; rvars: C[]; ty: Ty }>, { next: number } & D] = _curry(
  3,
  <A, B, C, D>(
    names: A[],
    env: Map<A, { vars: B[]; rvars: C[]; ty: Ty }>,
    st: { next: number } & D,
  ) =>
    match(names)
      .with(
        (_v) => _v.length === 0,
        () => _tuple([] as Ty[], env, st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([n, ...rest]) =>
          (([t, st1]: [Ty, { next: number } & D]) =>
            (([restTs, env2, st2]: [
              Ty[],
              Map<A, { vars: B[]; rvars: C[]; ty: Ty }>,
              { next: number } & D,
            ]) => _tuple(_Array_prepend(t, restTs), env2, st2))(
              bindParamNamesFrom(rest, _Map_set(n, mono(t), env), st1),
            ))(freshVar(st)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const bindParamFieldsFrom: <A, B, C>(
  fields: string[],
  env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
  row: Row,
  st: { next: number } & C,
) => [Row, Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, { next: number } & C] = _curry(
  4,
  <A, B, C>(
    fields: string[],
    env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
    row: Row,
    st: { next: number } & C,
  ) =>
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
          (([ft, st1]: [Ty, { next: number } & C]) =>
            bindParamFieldsFrom(rest, _Map_set(f, mono(ft), env), rExtend(f, ft, row), st1))(
            freshVar(st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const bindParam: <A, B, C>(
  p: LamParam,
  env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
  st: { next: number } & C,
) => [Ty, Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, { next: number } & C] = _curry(
  3,
  <A, B, C>(
    p: LamParam,
    env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
    st: { next: number } & C,
  ) =>
    match(p)
      .with({ _tag: "LPName" }, ({ name }) =>
        (([t, st1]: [Ty, { next: number } & C]) => _tuple(t, _Map_set(name, mono(t), env), st1))(
          freshVar(st),
        ),
      )
      .with({ _tag: "LPTuple" }, ({ names }) =>
        (([elems, env1, st1]: [
          Ty[],
          Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
          { next: number } & C,
        ]) => _tuple(tTuple(elems), env1, st1))(bindParamNamesFrom(names, env, st)),
      )
      .with({ _tag: "LPRecord" }, ({ fields }) =>
        (([rowBase, st1]: [Row, { next: number } & C]) =>
          (([row, env1, st2]: [
            Row,
            Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
            { next: number } & C,
          ]) => _tuple(tRecord(row), env1, st2))(bindParamFieldsFrom(fields, env, rowBase, st1)))(
          freshRowVar(st),
        ),
      )
      .exhaustive(),
);
const bindParamsFrom: <A, B, C>(
  params: LamParam[],
  env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
  st: { next: number } & C,
) => [Ty[], Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, { next: number } & C] = _curry(
  3,
  <A, B, C>(
    params: LamParam[],
    env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
    st: { next: number } & C,
  ) =>
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
          (([t, env1, st1]: [
            Ty,
            Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
            { next: number } & C,
          ]) =>
            (([restTs, env2, st2]: [
              Ty[],
              Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
              { next: number } & C,
            ]) => _tuple(_Array_prepend(t, restTs), env2, st2))(bindParamsFrom(rest, env1, st1)))(
            bindParam(p, env, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const constrainParamAnnotsFrom: <A, B, C, D>(
  ctx: {
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & A)[];
      } & B
    >;
  } & C,
  params: LamParam[],
  paramTypes: Ty[],
  vars: Map<string, Ty>,
  st: { next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
) => Result<{ next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & D, IErr> = _curry(
  5,
  <A, B, C, D>(
    ctx: {
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & A)[];
        } & B
      >;
    } & C,
    params: LamParam[],
    paramTypes: Ty[],
    vars: Map<string, Ty>,
    st: { next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ) =>
    match(params)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st),
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
              () => Ok(st),
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
                      (([annotT, vars1, st1]: [
                        Ty,
                        Map<string, Ty>,
                        { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
                      ]) =>
                        _Result_flatMap(
                          (st2) => constrainParamAnnotsFrom(ctx, rest, restTypes, vars1, st2),
                          u(paramT, annotT, st1, annotSpan(te)),
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
const arrowChain: { (paramTypes: Ty[]): (resultT: Ty) => Ty; (paramTypes: Ty[], resultT: Ty): Ty } =
  _curry(2, (paramTypes: Ty[], resultT: Ty) =>
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
const ctxWithEnv: <A, B, C, D, E, F, G, H>(
  ctx: { letOwner: A; loopStack: B; plugins: C; aliasMap: D; ns: E; open: F } & H,
  env: G,
) => { env: G; open: F; ns: E; aliasMap: D; plugins: C; loopStack: B; letOwner: A } = _curry(
  2,
  <A, B, C, D, E, F, G, H>(
    ctx: { letOwner: A; loopStack: B; plugins: C; aliasMap: D; ns: E; open: F } & H,
    env: G,
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
const ctxWithLets: <A, B, C, D, E, F, G, H>(
  ctx: { loopStack: A; plugins: B; aliasMap: C; ns: D; open: E } & H,
  env: F,
  letOwner: G,
) => { env: F; open: E; ns: D; aliasMap: C; plugins: B; loopStack: A; letOwner: G } = _curry(
  3,
  <A, B, C, D, E, F, G, H>(
    ctx: { loopStack: A; plugins: B; aliasMap: C; ns: D; open: E } & H,
    env: F,
    letOwner: G,
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
const ctxWithLoop: <A, B, C, D, E, F, G, H>(
  ctx: { loopStack: A[]; plugins: B; aliasMap: C; ns: D; open: E } & H,
  env: F,
  frame: A,
  letOwner: G,
) => { env: F; open: E; ns: D; aliasMap: C; plugins: B; loopStack: A[]; letOwner: G } = _curry(
  4,
  <A, B, C, D, E, F, G, H>(
    ctx: { loopStack: A[]; plugins: B; aliasMap: C; ns: D; open: E } & H,
    env: F,
    frame: A,
    letOwner: G,
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
const inferLoopParamsFrom: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  params: LoopParam[],
  i: number,
  envAcc: Map<string, Scheme>,
  frameAcc: Ty[],
  ownerAcc: Map<string, Span>,
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  [
    Ty[],
    Map<string, Scheme>,
    Map<string, Span>,
    {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ],
  IErr
> = _curry(
  7,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    params: LoopParam[],
    i: number,
    envAcc: Map<string, Scheme>,
    frameAcc: Ty[],
    ownerAcc: Map<string, Span>,
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ) =>
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => Ok(_tuple(frameAcc, envAcc, ownerAcc, st)))
      .with({ _tag: "Some" }, ({ value: p }) =>
        _Result_flatMap(
          ([t, st1]) =>
            ((sp: Span) =>
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
const unifyRecurArgsFrom: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  args: Expr[],
  frame: Ty[],
  i: number,
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
  IErr
> = _curry(
  5,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    args: Expr[],
    frame: Ty[],
    i: number,
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ) =>
    match(_Array_get(i, args))
      .with({ _tag: "None" }, () => Ok(st))
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
const inferRecur: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    loopStack: Ty[][];
    env: Map<string, Scheme>;
    letOwner: Map<string, Span>;
    open: boolean;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & C)[];
      } & D
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & E,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & E,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & E,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
              d: { end: A; start: B } & G,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & E,
            ]
          >,
          IErr
        >
      >;
    } & H)[];
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
  },
  args: Expr[],
  sp: Span,
  st: {
    next: number;
    letUses: Map<string, Ty[]>;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
  } & E,
) => Result<
  [
    Ty,
    {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & E,
  ],
  IErr
> = _curry(
  4,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      loopStack: Ty[][];
      env: Map<string, Scheme>;
      letOwner: Map<string, Span>;
      open: boolean;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & C)[];
        } & D
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & E,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & E,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & E,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
                d: { end: A; start: B } & G,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & E,
              ]
            >,
            IErr
          >
        >;
      } & H)[];
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
    },
    args: Expr[],
    sp: Span,
    st: {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & E,
  ) =>
    match(ctx.loopStack)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Err(typeErr("'recur' is only legal inside a loop body", sp)),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([frame]) =>
          _Result_flatMap(
            (st1) =>
              (([t, st2]: [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & E,
              ]) => Ok(_tuple(t, st2)))(freshVar(st1)),
            unifyRecurArgsFrom(ctx, args, frame, 0, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferCallArgs: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  fnT: Ty,
  args: Expr[],
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
  callSpan: Span,
) => Result<
  [
    Ty,
    {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ],
  IErr
> = _curry(
  5,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    fnT: Ty,
    args: Expr[],
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
    callSpan: Span,
  ) =>
    match(args)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(fnT, st)),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([arg, ...rest]) =>
          _Result_flatMap(
            ([argT, st1]) =>
              (([resultT, st2]: [
                Ty,
                {
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  next: number;
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]) =>
                _Result_flatMap(
                  (st3) => inferCallArgs(ctx, resultT, rest, st3, callSpan),
                  u(fnT, tArrow(argT, resultT), st2, exprSpan(arg)),
                ))(freshVar(st1)),
            inferExpr(ctx, arg, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferNormalCall: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  fn: Expr,
  args: Expr[],
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  [
    Ty,
    {
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      next: number;
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & F,
  ],
  IErr
> = _curry(
  4,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    fn: Expr,
    args: Expr[],
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
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
              (([resultT, st2]: [
                Ty,
                {
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  next: number;
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]) =>
                _Result_flatMap(
                  (st3) => Ok(_tuple(resultT, st3)),
                  u(fnT, tArrow(tUnit, resultT), st2, exprSpan(fn)),
                ))(freshVar(st1)),
          )
          .otherwise(() => inferCallArgs(ctx, fnT, args, st1, exprSpan(fn))),
      inferExpr(ctx, fn, st),
    ),
);
const inferTernary: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  cond: Expr,
  thenE: Expr,
  elseE: Expr,
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  [
    Ty,
    {
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      next: number;
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & F,
  ],
  IErr
> = _curry(
  5,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    cond: Expr,
    thenE: Expr,
    elseE: Expr,
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
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
                      (st5) => Ok(_tuple(thenT, st5)),
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
const inferBindBody: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    letOwner: Map<string, Span>;
    loopStack: Ty[][];
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & C,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & C,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & C,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
              d: { end: A; start: B } & E,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & C,
            ]
          >,
          IErr
        >
      >;
    } & F)[];
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & G)[];
      } & H
    >;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
    open: boolean;
    env: Map<string, Scheme>;
  },
  param: LamParam,
  paramSpan: Span,
  body: Expr,
  payloadT: Ty,
  mkBody: (a: Ty) => Ty,
  st: {
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
  } & C,
) => Result<
  [
    Ty,
    {
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      next: number;
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & C,
  ],
  IErr
> = _curry(
  7,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      letOwner: Map<string, Span>;
      loopStack: Ty[][];
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & C,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & C,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & C,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
                d: { end: A; start: B } & E,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & C,
              ]
            >,
            IErr
          >
        >;
      } & F)[];
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & G)[];
        } & H
      >;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
      open: boolean;
      env: Map<string, Scheme>;
    },
    param: LamParam,
    paramSpan: Span,
    body: Expr,
    payloadT: Ty,
    mkBody: (a: Ty) => Ty,
    st: {
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & C,
  ) =>
    (([paramT, bodyEnv, st1]: [
      Ty,
      Map<string, Scheme>,
      {
        tv: Map<number, Ty>;
        rv: Map<number, Row>;
        next: number;
        letUses: Map<string, Ty[]>;
        letSpans: Map<string, Span>;
        recorded: TypeAt[];
      } & C,
    ]) =>
      _Result_flatMap(
        (st2) =>
          _Result_flatMap(
            ([bodyT, st3]) =>
              (([resT, st4]: [
                Ty,
                {
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  next: number;
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & C,
              ]) => {
                const wantBody: Ty = mkBody(resT);
                return _Result_flatMap(
                  (st5) => Ok(_tuple(wantBody, st5)),
                  u(bodyT, wantBody, st4, exprSpan(body)),
                );
              })(freshVar(st3)),
            inferExpr(ctxWithEnv(ctx, bodyEnv), body, st2),
          ),
        u(paramT, payloadT, st1, paramSpan),
      ))(bindParam(param, ctx.env, st)),
);
const inferTwoSlotBind: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  param: LamParam,
  paramSpan: Span,
  value: Expr,
  body: Expr,
  valT: Ty,
  ctor: string,
  st: {
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
  } & F,
) => Result<
  [
    Ty,
    {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & F,
  ],
  IErr
> = _curry(
  8,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    param: LamParam,
    paramSpan: Span,
    value: Expr,
    body: Expr,
    valT: Ty,
    ctor: string,
    st: {
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & F,
  ) =>
    (([payloadT, st1]: [
      Ty,
      {
        next: number;
        tv: Map<number, Ty>;
        rv: Map<number, Row>;
        letUses: Map<string, Ty[]>;
        letSpans: Map<string, Span>;
        recorded: TypeAt[];
      } & F,
    ]) =>
      (([errT, st2]: [
        Ty,
        {
          tv: Map<number, Ty>;
          rv: Map<number, Row>;
          next: number;
          letUses: Map<string, Ty[]>;
          letSpans: Map<string, Span>;
          recorded: TypeAt[];
        } & F,
      ]) =>
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
const inferQuestionBind: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  bind: Expr,
  param: LamParam,
  paramSpan: Span,
  value: Expr,
  body: Expr,
  valT: Ty,
  st: {
    tv: Map<number, Ty>;
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    rv: Map<number, Row>;
  } & F,
) => Result<
  [
    Ty,
    {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & F,
  ],
  IErr
> = _curry(
  8,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    bind: Expr,
    param: LamParam,
    paramSpan: Span,
    value: Expr,
    body: Expr,
    valT: Ty,
    st: {
      tv: Map<number, Ty>;
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      rv: Map<number, Row>;
    } & F,
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
              (([payloadT, st1]: [
                Ty,
                {
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  next: number;
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]) =>
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
            : Err(
                typeErr(
                  `let? requires Option or Result, got ${showType(zonk(valT, st))}`,
                  exprSpan(value),
                ),
              ),
      )
      .otherwise(() =>
        Err(
          typeErr(
            `let? requires Option or Result, got ${showType(zonk(valT, st))}`,
            exprSpan(value),
          ),
        ),
      ),
);
const inferLetBind: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  bind: Expr,
  param: LamParam,
  paramSpan: Span,
  monad: string,
  value: Expr,
  body: Expr,
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  [
    Ty,
    {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & F,
  ],
  IErr
> = _curry(
  8,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    bind: Expr,
    param: LamParam,
    paramSpan: Span,
    monad: string,
    value: Expr,
    body: Expr,
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ) =>
    _Result_flatMap(
      ([valT, st1]) =>
        eq(monad, "Task")
          ? inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Task", st1)
          : inferQuestionBind(ctx, bind, param, paramSpan, value, body, valT, st1),
      inferExpr(ctx, value, st),
    ),
);
const inferRecordRow: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    letOwner: Map<string, Span>;
    open: boolean;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & C)[];
      } & D
    >;
    loopStack: Ty[][];
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & E,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & E,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & E,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
              d: { end: A; start: B } & G,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & E,
            ]
          >,
          IErr
        >
      >;
    } & H)[];
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
  },
  fields: Field[],
  st: {
    next: number;
    letUses: Map<string, Ty[]>;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
  } & E,
) => Result<
  [
    Row,
    {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & E,
  ],
  IErr
> = _curry(
  3,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      letOwner: Map<string, Span>;
      open: boolean;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & C)[];
        } & D
      >;
      loopStack: Ty[][];
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & E,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & E,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & E,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
                d: { end: A; start: B } & G,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & E,
              ]
            >,
            IErr
          >
        >;
      } & H)[];
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
    },
    fields: Field[],
    st: {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & E,
  ) =>
    match(fields)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(RowEmpty as Row, st)),
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
                ([ft, st2]) => Ok(_tuple(rExtend(f.name, ft, restRow), st2)),
                inferExpr(ctx, f.value, st1),
              ),
            inferRecordRow(ctx, rest, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const rWithTail: { (row: Row): (tail: Row) => Row; (row: Row, tail: Row): Row } = _curry(
  2,
  (row: Row, tail: Row) =>
    match(row)
      .with({ _tag: "RowEmpty" }, () => tail)
      .with({ _tag: "RowVar" }, ({ id }) => rVar(id))
      .with({ _tag: "RowExtend" }, ({ label, fieldType, rest }) =>
        rExtend(label, fieldType, rWithTail(rest, tail)),
      )
      .exhaustive(),
);
const inferFieldAccess: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  target: Expr,
  name: string,
  sp: Span,
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  [
    Ty,
    {
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      next: number;
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & F,
  ],
  IErr
> = _curry(
  5,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    target: Expr,
    name: string,
    sp: Span,
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ) =>
    _Result_flatMap(
      ([targetT, st1]) =>
        (([fieldT, st2]: [
          Ty,
          {
            next: number;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letUses: Map<string, Ty[]>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
        ]) =>
          (([restRow, st3]: [
            Row,
            {
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              next: number;
              letUses: Map<string, Ty[]>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
          ]) =>
            _Result_flatMap(
              (st4) => Ok(_tuple(fieldT, st4)),
              u(targetT, tRecord(rExtend(name, fieldT, restRow)), st3, sp),
            ))(freshRowVar(st2)))(freshVar(st1)),
      inferExpr(ctx, target, st),
    ),
);
const inferNsField: <A, B, C, D, E, F>(
  ctx: { ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>> } & D,
  tname: string,
  name: string,
  sp: { end: A; start: B } & E,
  st: { next: number } & F,
) => Result<[Ty, { next: number } & F], { message: string; start: B; end: A }> = _curry(
  5,
  <A, B, C, D, E, F>(
    ctx: { ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>> } & D,
    tname: string,
    name: string,
    sp: { end: A; start: B } & E,
    st: { next: number } & F,
  ) =>
    match(
      _Map_get(
        name,
        _Map_getOr(
          new Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>(),
          tname,
          ctx.ns,
        ),
      ),
    )
      .with({ _tag: "Some" }, ({ value: sc }) =>
        (([t, st1]: [Ty, { next: number } & F]) => Ok(_tuple(t, st1)))(instantiate(sc, st)),
      )
      .with({ _tag: "None" }, () => Err(typeErr(`'${tname}' has no member '${name}'`, sp)))
      .exhaustive(),
);
const inferInterpParts: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    letOwner: Map<string, Span>;
    open: boolean;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & C)[];
      } & D
    >;
    loopStack: Ty[][];
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & E,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & E,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & E,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
              d: { end: A; start: B } & G,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & E,
            ]
          >,
          IErr
        >
      >;
    } & H)[];
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
  },
  parts: InterpPart[],
  st: {
    next: number;
    letUses: Map<string, Ty[]>;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
  } & E,
) => Result<
  {
    next: number;
    letUses: Map<string, Ty[]>;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
  } & E,
  IErr
> = _curry(
  3,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      letOwner: Map<string, Span>;
      open: boolean;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & C)[];
        } & D
      >;
      loopStack: Ty[][];
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & E,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & E,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & E,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
                d: { end: A; start: B } & G,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & E,
              ]
            >,
            IErr
          >
        >;
      } & H)[];
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
    },
    parts: InterpPart[],
    st: {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & E,
  ) =>
    match(parts)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st),
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
const inferTupleElems: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  elements: Expr[],
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  [
    Ty[],
    {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ],
  IErr
> = _curry(
  3,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    elements: Expr[],
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ) =>
    match(elements)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple([] as Ty[], st)),
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
                ([restTs, st2]) => Ok(_tuple(_Array_prepend(t, restTs), st2)),
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
const inferSeqSlotsElems: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  con: string,
  elem: Ty,
  elements: SeqElem[],
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
  IErr
> = _curry(
  5,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    con: string,
    elem: Ty,
    elements: SeqElem[],
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ) =>
    match(elements)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st),
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
const inferSeqSlots: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    letOwner: Map<string, Span>;
    open: boolean;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & C)[];
      } & D
    >;
    loopStack: Ty[][];
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & E,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & E,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & E,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
              d: { end: A; start: B } & G,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & E,
            ]
          >,
          IErr
        >
      >;
    } & H)[];
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
  },
  con: string,
  elements: SeqElem[],
  st: {
    next: number;
    letUses: Map<string, Ty[]>;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
  } & E,
) => Result<
  [
    Ty,
    {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & E,
  ],
  IErr
> = _curry(
  4,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      letOwner: Map<string, Span>;
      open: boolean;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & C)[];
        } & D
      >;
      loopStack: Ty[][];
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & E,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & E,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & E,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
                d: { end: A; start: B } & G,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & E,
              ]
            >,
            IErr
          >
        >;
      } & H)[];
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
    },
    con: string,
    elements: SeqElem[],
    st: {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & E,
  ) =>
    (([elem, st1]: [
      Ty,
      {
        next: number;
        letUses: Map<string, Ty[]>;
        tv: Map<number, Ty>;
        rv: Map<number, Row>;
        letSpans: Map<string, Span>;
        recorded: TypeAt[];
      } & E,
    ]) =>
      _Result_flatMap(
        (st2) => Ok(_tuple(tCon(con, [elem]), st2)),
        inferSeqSlotsElems(ctx, con, elem, elements, st1),
      ))(freshVar(st)),
);
const inferMapEntries: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  k: Ty,
  v: Ty,
  entries: MapEntry[],
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
  IErr
> = _curry(
  5,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    k: Ty,
    v: Ty,
    entries: MapEntry[],
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ) =>
    match(entries)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st),
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
const inferMapExpr: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    letOwner: Map<string, Span>;
    open: boolean;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & C)[];
      } & D
    >;
    loopStack: Ty[][];
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & E,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & E,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & E,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
              d: { end: A; start: B } & G,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & E,
            ]
          >,
          IErr
        >
      >;
    } & H)[];
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
  },
  entries: MapEntry[],
  st: {
    next: number;
    letUses: Map<string, Ty[]>;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
  } & E,
) => Result<
  [
    Ty,
    {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & E,
  ],
  IErr
> = _curry(
  3,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      letOwner: Map<string, Span>;
      open: boolean;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & C)[];
        } & D
      >;
      loopStack: Ty[][];
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & E,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & E,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & E,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
                d: { end: A; start: B } & G,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & E,
              ]
            >,
            IErr
          >
        >;
      } & H)[];
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
    },
    entries: MapEntry[],
    st: {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & E,
  ) =>
    (([k, st1]: [
      Ty,
      {
        next: number;
        letUses: Map<string, Ty[]>;
        tv: Map<number, Ty>;
        rv: Map<number, Row>;
        letSpans: Map<string, Span>;
        recorded: TypeAt[];
      } & E,
    ]) =>
      (([v, st2]: [
        Ty,
        {
          next: number;
          letUses: Map<string, Ty[]>;
          tv: Map<number, Ty>;
          rv: Map<number, Row>;
          letSpans: Map<string, Span>;
          recorded: TypeAt[];
        } & E,
      ]) =>
        _Result_flatMap(
          (st3) => Ok(_tuple(tCon("Map", [k, v]), st3)),
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
const inferArms: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    env: Map<string, Scheme>;
    letOwner: Map<string, Span>;
    loopStack: Ty[][];
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & D,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & D,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & D,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & E,
              d: { end: A; start: B } & F,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & E,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & D,
            ]
          >,
          IErr
        >
      >;
    } & G)[];
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & H)[];
      } & I
    >;
    open: boolean;
  },
  scrutT: Ty,
  resultT: Ty,
  arms: MatchArm[],
  st: {
    next: number;
    recorded: TypeAt[];
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
  } & D,
) => Result<
  {
    next: number;
    recorded: TypeAt[];
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
  } & D,
  IErr
> = _curry(
  5,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      env: Map<string, Scheme>;
      letOwner: Map<string, Span>;
      loopStack: Ty[][];
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & D,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & D,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & D,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & E,
                d: { end: A; start: B } & F,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & E,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & D,
              ]
            >,
            IErr
          >
        >;
      } & G)[];
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & H)[];
        } & I
      >;
      open: boolean;
    },
    scrutT: Ty,
    resultT: Ty,
    arms: MatchArm[],
    st: {
      next: number;
      recorded: TypeAt[];
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
    } & D,
  ) =>
    match(arms)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st),
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
                        .with({ _tag: "None" }, () => Ok(st2))
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
const inferMatch: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  scrutinee: Expr,
  arms: MatchArm[],
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  [
    Ty,
    {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & F,
  ],
  IErr
> = _curry(
  4,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    scrutinee: Expr,
    arms: MatchArm[],
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ) =>
    _Result_flatMap(
      ([scrutT, st1]) =>
        (([resultT, st2]: [
          Ty,
          {
            next: number;
            letUses: Map<string, Ty[]>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
          } & F,
        ]) =>
          _Result_flatMap(
            (st3) => Ok(_tuple(resultT, st3)),
            inferArms(ctx, scrutT, resultT, arms, st2),
          ))(freshVar(st1)),
      inferExpr(ctx, scrutinee, st),
    ),
);
const inferExpr: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  e: Expr,
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  [
    Ty,
    {
      recorded: TypeAt[];
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ],
  IErr
> = _curry(
  3,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    e: Expr,
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ) =>
    _Result_flatMap(
      ([t, st1]) => Ok(_tuple(t, recordAt(exprSpan(e), t, st1))),
      inferExprRaw(ctx, e, st),
    ),
);
const inferExprRaw: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    letOwner: Map<string, Span>;
    open: boolean;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & C)[];
      } & D
    >;
    loopStack: Ty[][];
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & E,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & E,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & E,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
              d: { end: A; start: B } & G,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & E,
            ]
          >,
          IErr
        >
      >;
    } & H)[];
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
  },
  e: Expr,
  st: {
    next: number;
    letUses: Map<string, Ty[]>;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
  } & E,
) => Result<
  [
    Ty,
    {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & E,
  ],
  IErr
> = _curry(
  3,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      letOwner: Map<string, Span>;
      open: boolean;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & C)[];
        } & D
      >;
      loopStack: Ty[][];
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & E,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & E,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & E,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
                d: { end: A; start: B } & G,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & F,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & E,
              ]
            >,
            IErr
          >
        >;
      } & H)[];
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
    },
    e: Expr,
    st: {
      next: number;
      letUses: Map<string, Ty[]>;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
    } & E,
  ) =>
    match(e)
      .with({ _tag: "ENum" }, () => Ok(_tuple(tNumber, st)))
      .with({ _tag: "EUnit" }, () => Ok(_tuple(tUnit, st)))
      .with({ _tag: "EBool" }, () => Ok(_tuple(tBool, st)))
      .with({ _tag: "EStr" }, ({ value }) => Ok(_tuple(tLit(value), st)))
      .with({ _tag: "ERef" }, ({ name, span: sp }) =>
        match(_Map_get(name, ctx.env))
          .with({ _tag: "Some" }, ({ value: sc }) =>
            (([t, st1]: [
              Ty,
              {
                letUses: Map<string, Ty[]>;
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & E,
            ]) =>
              Ok(
                _tuple(
                  t,
                  match(_Map_get(name, ctx.letOwner))
                    .with({ _tag: "Some" }, ({ value: vsp }) => noteUse(vsp, t, st1))
                    .with({ _tag: "None" }, () => st1)
                    .exhaustive(),
                ),
              ))(instantiate(sc, st)),
          )
          .with({ _tag: "None" }, () =>
            ctx.open
              ? (([t, st1]: [
                  Ty,
                  {
                    next: number;
                    letUses: Map<string, Ty[]>;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                  } & E,
                ]) => Ok(_tuple(t, st1)))(freshVar(st))
              : Err(typeErr(`unbound variable '${name}'`, sp)),
          )
          .exhaustive(),
      )
      .with({ _tag: "ELambda" }, ({ params, body }) =>
        (([paramTypes, bodyEnv, st1]: [
          Ty[],
          Map<string, Scheme>,
          {
            next: number;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letUses: Map<string, Ty[]>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & E,
        ]) =>
          _Result_flatMap(
            (st2) =>
              _Result_flatMap(
                ([bodyT, st3]) => Ok(_tuple(arrowChain(paramTypes, bodyT), st3)),
                inferExpr(ctxWithEnv(ctx, bodyEnv), body, st2),
              ),
            constrainParamAnnotsFrom(ctx, params, paramTypes, new Map<string, Ty>(), st1),
          ))(bindParamsFrom(params, ctx.env, st)),
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
                  ((vsp: Span) =>
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
        ((api) =>
          _Result_flatMap(
            (claimed) =>
              match(claimed)
                .with({ _tag: "Some" }, ({ value: r }) => Ok(r))
                .with({ _tag: "None" }, () => inferNormalCall(ctx, fn, args, st))
                .exhaustive(),
            runInferCallHooks(inferCallHooksOf(ctx.plugins), fn, args, origin, st, api),
          ))({
          inferExpr: _curry(
            2,
            (
              e: Expr,
              st0: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & E,
            ) => inferExpr(ctx, e, st0),
          ),
          unify: u,
        }),
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
              ([row, st1]) => Ok(_tuple(tRecord(row), st1)),
              inferRecordRow(ctx, fields, st),
            ),
          )
          .with({ _tag: "Some" }, ({ value: spreadExpr }) =>
            _Result_flatMap(
              ([row, st1]) =>
                _Result_flatMap(
                  ([baseT, st2]) =>
                    (([tailVar, st3]: [
                      Row,
                      {
                        tv: Map<number, Ty>;
                        rv: Map<number, Row>;
                        next: number;
                        letUses: Map<string, Ty[]>;
                        letSpans: Map<string, Span>;
                        recorded: TypeAt[];
                      } & E,
                    ]) =>
                      _Result_flatMap(
                        (st4) => Ok(_tuple(baseT, st4)),
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
          ([elems, st1]) => Ok(_tuple(tTuple(elems), st1)),
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
        _Result_flatMap((st1) => Ok(_tuple(tString, st1)), inferInterpParts(ctx, parts, st)),
      )
      .exhaustive(),
);
const inferDo: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  exprs: Expr[],
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  [
    Ty,
    {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ],
  IErr
> = _curry(
  3,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    exprs: Expr[],
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ) =>
    match(exprs)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Err(typeErr("internal: empty do block", { start: 0, end: 0 })),
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
const inferPatRecordFrom: <A, B, C, D>(
  ctx: {
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
  } & C,
  fields: PatField[],
  row: Row,
  bindings: Map<string, Ty>,
  st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
) => Result<
  [
    Row,
    Map<string, Ty>,
    { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ],
  IErr
> = _curry(
  5,
  <A, B, C, D>(
    ctx: {
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
      env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
    } & C,
    fields: PatField[],
    row: Row,
    bindings: Map<string, Ty>,
    st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ) =>
    match(fields)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(row, bindings, st)),
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
const inferPatRecord: <A, B, C, D>(
  ctx: {
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
  } & C,
  fields: PatField[],
  st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
) => Result<
  [
    Ty,
    Map<string, Ty>,
    { recorded: TypeAt[]; next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ],
  IErr
> = _curry(
  3,
  <A, B, C, D>(
    ctx: {
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
      env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
    } & C,
    fields: PatField[],
    st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ) =>
    (([rowBase, _st1]: [
      Row,
      { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
    ]) =>
      _Result_flatMap(
        ([row, bindings, st2]) => Ok(_tuple(tRecord(row), bindings, st2)),
        inferPatRecordFrom(ctx, fields, rowBase, new Map<string, Ty>(), st),
      ))(freshRowVar(st)),
);
const inferPatCtorArgs: <A, B, C, D>(
  ctx: {
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
  } & C,
  ctor: string,
  curT: Ty,
  args: Pattern[],
  st: { tv: Map<number, Ty>; next: number; recorded: TypeAt[]; rv: Map<number, Row> } & D,
  bindings: Map<string, Ty>,
  sp: Span,
) => Result<
  [
    Ty,
    Map<string, Ty>,
    { tv: Map<number, Ty>; next: number; recorded: TypeAt[]; rv: Map<number, Row> } & D,
  ],
  IErr
> = _curry(
  7,
  <A, B, C, D>(
    ctx: {
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
      env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
    } & C,
    ctor: string,
    curT: Ty,
    args: Pattern[],
    st: { tv: Map<number, Ty>; next: number; recorded: TypeAt[]; rv: Map<number, Row> } & D,
    bindings: Map<string, Ty>,
    sp: Span,
  ) =>
    match(args)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(curT, bindings, st)),
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
            .otherwise(() =>
              Err(typeErr(`constructor '${ctor}' applied to too many arguments`, sp)),
            ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferPatTupleFrom: <A, B, C, D>(
  ctx: {
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
  } & C,
  elems: Pattern[],
  st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
) => Result<
  [
    Ty[],
    Map<string, Ty>,
    { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ],
  IErr
> = _curry(
  3,
  <A, B, C, D>(
    ctx: {
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
      env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
    } & C,
    elems: Pattern[],
    st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ) =>
    match(elems)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple([] as Ty[], new Map<string, Ty>(), st)),
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
                  ),
                inferPatTupleFrom(ctx, rest, st1),
              ),
            inferPat(ctx, ep, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferPatTuple: <A, B, C, D>(
  ctx: {
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
  } & C,
  elems: Pattern[],
  st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
) => Result<
  [
    Ty,
    Map<string, Ty>,
    { recorded: TypeAt[]; next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ],
  IErr
> = _curry(
  3,
  <A, B, C, D>(
    ctx: {
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
      env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
    } & C,
    elems: Pattern[],
    st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ) =>
    _Result_flatMap(
      ([elemTs, bindings, st1]) => Ok(_tuple(tTuple(elemTs), bindings, st1)),
      inferPatTupleFrom(ctx, elems, st),
    ),
);
const inferSeqPatElems: <A, B, C, D>(
  ctx: {
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
  } & C,
  elem: Ty,
  elems: Pattern[],
  st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
) => Result<
  [
    Map<string, Ty>,
    { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ],
  IErr
> = _curry(
  4,
  <A, B, C, D>(
    ctx: {
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
      env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
    } & C,
    elem: Ty,
    elems: Pattern[],
    st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ) =>
    match(elems)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(new Map<string, Ty>(), st)),
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
                      Ok(_tuple(mergeBindingMaps(restBindings, subBindings), st3)),
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
const inferSeqPat: <A, B, C, D>(
  ctx: {
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
  } & C,
  con: string,
  elems: Pattern[],
  restPat: Option<Pattern>,
  st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
) => Result<
  [
    Ty,
    Map<string, Ty>,
    { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ],
  IErr
> = _curry(
  5,
  <A, B, C, D>(
    ctx: {
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
      env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
    } & C,
    con: string,
    elems: Pattern[],
    restPat: Option<Pattern>,
    st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ) =>
    (([elem, st1]: [
      Ty,
      { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
    ]) => {
      const seqT: Ty = tCon(con, [elem]);
      return _Result_flatMap(
        ([bindings, st2]) =>
          match(restPat)
            .with({ _tag: "None" }, () => Ok(_tuple(seqT, bindings, st2)))
            .with({ _tag: "Some" }, ({ value: r }) =>
              _Result_flatMap(
                ([subT, subBindings, st3]) =>
                  _Result_flatMap(
                    (st4) => Ok(_tuple(seqT, mergeBindingMaps(bindings, subBindings), st4)),
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
const inferPat: <A, B, C, D>(
  ctx: {
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
  } & C,
  p: Pattern,
  st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
) => Result<
  [
    Ty,
    Map<string, Ty>,
    { recorded: TypeAt[]; next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ],
  IErr
> = _curry(
  3,
  <A, B, C, D>(
    ctx: {
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
      env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
    } & C,
    p: Pattern,
    st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ) =>
    _Result_flatMap(
      ([t, bindings, st1]) => Ok(_tuple(t, bindings, recordAt(patSpan(p), t, st1))),
      inferPatRaw(ctx, p, st),
    ),
);
const inferPatRaw: <A, B, C, D>(
  ctx: {
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
  } & C,
  p: Pattern,
  st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
) => Result<
  [
    Ty,
    Map<string, Ty>,
    { recorded: TypeAt[]; next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ],
  IErr
> = _curry(
  3,
  <A, B, C, D>(
    ctx: {
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
      env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
    } & C,
    p: Pattern,
    st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ) =>
    match(p)
      .with({ _tag: "PAs" }, ({ pat, name }) =>
        _Result_flatMap(
          ([t, bindings, st1]) => Ok(_tuple(t, _Map_set(name, t, bindings), st1)),
          inferPat(ctx, pat, st),
        ),
      )
      .with({ _tag: "PWild" }, () =>
        (([t, st1]: [
          Ty,
          { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
        ]) => Ok(_tuple(t, new Map<string, Ty>(), st1)))(freshVar(st)),
      )
      .with({ _tag: "PUnit" }, () => Ok(_tuple(tUnit, new Map<string, Ty>(), st)))
      .with({ _tag: "PLit" }, () => Ok(_tuple(tNumber, new Map<string, Ty>(), st)))
      .with({ _tag: "PBool" }, () => Ok(_tuple(tBool, new Map<string, Ty>(), st)))
      .with({ _tag: "PStr" }, ({ value }) => Ok(_tuple(tLit(value), new Map<string, Ty>(), st)))
      .with({ _tag: "PBind" }, ({ name }) =>
        (([t, st1]: [
          Ty,
          { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
        ]) => Ok(_tuple(t, _Map_set(name, t, new Map<string, Ty>()), st1)))(freshVar(st)),
      )
      .with({ _tag: "PRecord" }, ({ fields }) => inferPatRecord(ctx, fields, st))
      .with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) =>
        match(ns)
          .with({ _tag: "Some" }, ({ value: alias }) =>
            match(
              _Map_get(
                ctor,
                _Map_getOr(
                  new Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>(),
                  alias,
                  ctx.ns,
                ),
              ),
            )
              .with({ _tag: "None" }, () => Err(typeErr(`'${alias}' has no member '${ctor}'`, sp)))
              .with({ _tag: "Some" }, ({ value: sc }) =>
                (([curT, st1]: [
                  Ty,
                  {
                    next: number;
                    recorded: TypeAt[];
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & D,
                ]) => inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map<string, Ty>(), sp))(
                  instantiate(sc, st),
                ),
              )
              .exhaustive(),
          )
          .with({ _tag: "None" }, () =>
            match(_Map_get(ctor, ctx.env))
              .with({ _tag: "None" }, () => Err(typeErr(`unknown constructor '${ctor}'`, sp)))
              .with({ _tag: "Some" }, ({ value: sc }) =>
                (([curT, st1]: [
                  Ty,
                  {
                    next: number;
                    recorded: TypeAt[];
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & D,
                ]) => inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map<string, Ty>(), sp))(
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
const unifyOrPatBinding: <A, B, C, D, E>(
  name: A,
  altBindings: Map<A, Ty>,
  bindings: Map<A, Ty>,
  st: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
  sp: { end: B; start: C } & E,
) => Result<
  { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
  { message: string; start: C; end: B }
> = _curry(
  5,
  <A, B, C, D, E>(
    name: A,
    altBindings: Map<A, Ty>,
    bindings: Map<A, Ty>,
    st: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
    sp: { end: B; start: C } & E,
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
const unifyOrPatBindings: <A, B, C, D, E>(
  names: A[],
  altBindings: Map<A, Ty>,
  bindings: Map<A, Ty>,
  st: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
  sp: { end: B; start: C } & E,
) => Result<
  { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
  { message: string; start: C; end: B }
> = _curry(
  5,
  <A, B, C, D, E>(
    names: A[],
    altBindings: Map<A, Ty>,
    bindings: Map<A, Ty>,
    st: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
    sp: { end: B; start: C } & E,
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
const inferOrPatAlts: <A, B, C, D>(
  ctx: {
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
  } & C,
  alts: Pattern[],
  i: number,
  t: Ty,
  bindings: Map<string, Ty>,
  st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
) => Result<
  { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  IErr
> = _curry(
  6,
  <A, B, C, D>(
    ctx: {
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
      env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
    } & C,
    alts: Pattern[],
    i: number,
    t: Ty,
    bindings: Map<string, Ty>,
    st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ) =>
    match(_Array_get(i, alts))
      .with({ _tag: "None" }, () => Ok(st))
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
const inferOrPat: <A, B, C, D>(
  ctx: {
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
    env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
  } & C,
  alts: Pattern[],
  sp: Span,
  st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
) => Result<
  [
    Ty,
    Map<string, Ty>,
    { recorded: TypeAt[]; next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ],
  IErr
> = _curry(
  4,
  <A, B, C, D>(
    ctx: {
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & A>>;
      env: Map<string, { ty: Ty; rvars: number[]; vars: number[] } & B>;
    } & C,
    alts: Pattern[],
    sp: Span,
    st: { next: number; recorded: TypeAt[]; tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  ) =>
    match(alts)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Err(typeErr("or-pattern needs at least one alternative", sp)),
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
                (st2) => Ok(_tuple(t, bindings, st2)),
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
const paramBound: {
  (p: LamParam): (bound: Set<string>) => Set<string>;
  (p: LamParam, bound: Set<string>): Set<string>;
} = _curry(2, (p: LamParam, bound: Set<string>) =>
  match(p)
    .with({ _tag: "LPName" }, ({ name }) => _Set_add(name, bound))
    .with({ _tag: "LPTuple" }, ({ names }) => addAllFrom(names, bound))
    .with({ _tag: "LPRecord" }, ({ fields }) => addAllFrom(fields, bound))
    .exhaustive(),
);
const lambdaBound: {
  (params: LamParam[]): (bound: Set<string>) => Set<string>;
  (params: LamParam[], bound: Set<string>): Set<string>;
} = _curry(2, (params: LamParam[], bound: Set<string>) =>
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
const loopBound: <A, B>(params: ({ name: A } & B)[], bound: Set<A>) => Set<A> = _curry(
  2,
  <A, B>(params: ({ name: A } & B)[], bound: Set<A>) =>
    reduce(
      _curry(2, (b: Set<A>, p: { name: A } & B) => _Set_add(p.name, b)),
      bound,
      params,
    ),
);
const loopInitRefsFrom: {
  (params: LoopParam[]): (i: number) => (bound: Set<string>) => (acc: Set<string>) => Set<string>;
  (params: LoopParam[]): (i: number) => (bound: Set<string>, acc: Set<string>) => Set<string>;
  (params: LoopParam[]): (i: number, bound: Set<string>) => (acc: Set<string>) => Set<string>;
  (params: LoopParam[], i: number): (bound: Set<string>) => (acc: Set<string>) => Set<string>;
  (params: LoopParam[]): (i: number, bound: Set<string>, acc: Set<string>) => Set<string>;
  (params: LoopParam[], i: number): (bound: Set<string>, acc: Set<string>) => Set<string>;
  (params: LoopParam[], i: number, bound: Set<string>): (acc: Set<string>) => Set<string>;
  (params: LoopParam[], i: number, bound: Set<string>, acc: Set<string>): Set<string>;
} = _curry(4, (params: LoopParam[], i: number, bound: Set<string>, acc: Set<string>) =>
  match(_Array_get(i, params))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: p }) =>
      loopInitRefsFrom(params, add(i, 1), bound, freeRefs(p.init, bound, acc)),
    )
    .exhaustive(),
);
const freeRefsList: {
  (es: Expr[]): (bound: Set<string>) => (acc: Set<string>) => Set<string>;
  (es: Expr[]): (bound: Set<string>, acc: Set<string>) => Set<string>;
  (es: Expr[], bound: Set<string>): (acc: Set<string>) => Set<string>;
  (es: Expr[], bound: Set<string>, acc: Set<string>): Set<string>;
} = _curry(3, (es: Expr[], bound: Set<string>, acc: Set<string>) =>
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
const freeRefsFields: {
  (fields: Field[]): (bound: Set<string>) => (acc: Set<string>) => Set<string>;
  (fields: Field[]): (bound: Set<string>, acc: Set<string>) => Set<string>;
  (fields: Field[], bound: Set<string>): (acc: Set<string>) => Set<string>;
  (fields: Field[], bound: Set<string>, acc: Set<string>): Set<string>;
} = _curry(3, (fields: Field[], bound: Set<string>, acc: Set<string>) =>
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
const freeRefsEntries: {
  (entries: MapEntry[]): (bound: Set<string>) => (acc: Set<string>) => Set<string>;
  (entries: MapEntry[]): (bound: Set<string>, acc: Set<string>) => Set<string>;
  (entries: MapEntry[], bound: Set<string>): (acc: Set<string>) => Set<string>;
  (entries: MapEntry[], bound: Set<string>, acc: Set<string>): Set<string>;
} = _curry(3, (entries: MapEntry[], bound: Set<string>, acc: Set<string>) =>
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
const freeRefsInterpParts: {
  (parts: InterpPart[]): (bound: Set<string>) => (acc: Set<string>) => Set<string>;
  (parts: InterpPart[]): (bound: Set<string>, acc: Set<string>) => Set<string>;
  (parts: InterpPart[], bound: Set<string>): (acc: Set<string>) => Set<string>;
  (parts: InterpPart[], bound: Set<string>, acc: Set<string>): Set<string>;
} = _curry(3, (parts: InterpPart[], bound: Set<string>, acc: Set<string>) =>
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
const freeRefsArms: {
  (arms: MatchArm[]): (bound: Set<string>) => (acc: Set<string>) => Set<string>;
  (arms: MatchArm[]): (bound: Set<string>, acc: Set<string>) => Set<string>;
  (arms: MatchArm[], bound: Set<string>): (acc: Set<string>) => Set<string>;
  (arms: MatchArm[], bound: Set<string>, acc: Set<string>): Set<string>;
} = _curry(3, (arms: MatchArm[], bound: Set<string>, acc: Set<string>) =>
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
const freeRefs: {
  (e: Expr): (bound: Set<string>) => (acc: Set<string>) => Set<string>;
  (e: Expr): (bound: Set<string>, acc: Set<string>) => Set<string>;
  (e: Expr, bound: Set<string>): (acc: Set<string>) => Set<string>;
  (e: Expr, bound: Set<string>, acc: Set<string>): Set<string>;
} = _curry(3, (e: Expr, bound: Set<string>, acc: Set<string>) =>
  match(e)
    .with({ _tag: "ENum" }, () => acc)
    .with({ _tag: "EUnit" }, () => acc)
    .with({ _tag: "EBool" }, () => acc)
    .with({ _tag: "EStr" }, () => acc)
    .with({ _tag: "ERef" }, ({ name }) => (_Set_has(name, bound) ? acc : _Set_add(name, acc)))
    .with({ _tag: "ECall" }, ({ fn, args }) => freeRefsList(args, bound, freeRefs(fn, bound, acc)))
    .with({ _tag: "ELambda" }, ({ params, body }) =>
      freeRefs(body, lambdaBound(params, bound), acc),
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
    .with({ _tag: "EArr" }, ({ elements }) => freeRefsList(map(seqElemExpr, elements), bound, acc))
    .with({ _tag: "EList" }, ({ elements }) => freeRefsList(map(seqElemExpr, elements), bound, acc))
    .with({ _tag: "ESet" }, ({ elements }) => freeRefsList(map(seqElemExpr, elements), bound, acc))
    .with({ _tag: "EMap" }, ({ entries }) => freeRefsEntries(entries, bound, acc))
    .with({ _tag: "EInterp" }, ({ parts }) => freeRefsInterpParts(parts, bound, acc))
    .exhaustive(),
);
const seedBuiltinsFrom: <A, B>(
  keys: A[],
  builtins: Map<A, Ty>,
  env: Map<A, Scheme>,
  st: { tv: Map<number, Ty>; rv: Map<number, Row> } & B,
) => Map<A, Scheme> = _curry(
  4,
  <A, B>(
    keys: A[],
    builtins: Map<A, Ty>,
    env: Map<A, Scheme>,
    st: { tv: Map<number, Ty>; rv: Map<number, Row> } & B,
  ) =>
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
const seedBuiltins: <A, B>(
  builtins: Map<A, Ty>,
  env: Map<A, Scheme>,
  st: { tv: Map<number, Ty>; rv: Map<number, Row> } & B,
) => Map<A, Scheme> = _curry(
  3,
  <A, B>(
    builtins: Map<A, Ty>,
    env: Map<A, Scheme>,
    st: { tv: Map<number, Ty>; rv: Map<number, Row> } & B,
  ) => seedBuiltinsFrom(_Map_keys(builtins), builtins, env, st),
);
const seedNsMembersFrom: <A, B, C, D>(
  keys: A[],
  members: Map<A, Ty>,
  env: Map<B, { ty: Ty; rvars: number[]; vars: number[] } & C>,
  st: { tv: Map<number, Ty>; rv: Map<number, Row> } & D,
  acc: Map<A, Scheme>,
) => Map<A, Scheme> = _curry(
  5,
  <A, B, C, D>(
    keys: A[],
    members: Map<A, Ty>,
    env: Map<B, { ty: Ty; rvars: number[]; vars: number[] } & C>,
    st: { tv: Map<number, Ty>; rv: Map<number, Row> } & D,
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
const seedNsFrom: <A, B, C, D, E>(
  nsNames: A[],
  namespaces: Map<A, Map<B, Ty>>,
  env: Map<C, { ty: Ty; rvars: number[]; vars: number[] } & D>,
  st: { tv: Map<number, Ty>; rv: Map<number, Row> } & E,
  acc: Map<A, Map<B, Scheme>>,
) => Map<A, Map<B, Scheme>> = _curry(
  5,
  <A, B, C, D, E>(
    nsNames: A[],
    namespaces: Map<A, Map<B, Ty>>,
    env: Map<C, { ty: Ty; rvars: number[]; vars: number[] } & D>,
    st: { tv: Map<number, Ty>; rv: Map<number, Row> } & E,
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
const seedNs: <A, B, C, D, E>(
  namespaces: Map<A, Map<B, Ty>>,
  env: Map<C, { ty: Ty; rvars: number[]; vars: number[] } & D>,
  st: { tv: Map<number, Ty>; rv: Map<number, Row> } & E,
) => Map<A, Map<B, Scheme>> = _curry(
  3,
  <A, B, C, D, E>(
    namespaces: Map<A, Map<B, Ty>>,
    env: Map<C, { ty: Ty; rvars: number[]; vars: number[] } & D>,
    st: { tv: Map<number, Ty>; rv: Map<number, Row> } & E,
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
const aliasMapFrom: {
  (stmts: Stmt[]): (acc: Map<string, QualAliasInfo>) => Map<string, QualAliasInfo>;
  (stmts: Stmt[], acc: Map<string, QualAliasInfo>): Map<string, QualAliasInfo>;
} = _curry(2, (stmts: Stmt[], acc: Map<string, QualAliasInfo>) =>
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
const registerCtorsFrom: <A, B, C, D, E, F>(
  ctors: ({ name: A; fields: ({ fieldType: TypeExpr } & B)[] } & C)[],
  typeName: string,
  params: string[],
  aliasMap: Map<
    string,
    {
      expr: Option<TypeExpr>;
      params: string[];
      fields: ({ name: string; fieldType: TypeExpr } & D)[];
    } & E
  >,
  env: Map<A, Scheme>,
  st: { next: number } & F,
) => [Map<A, Scheme>, { next: number } & F] = _curry(
  6,
  <A, B, C, D, E, F>(
    ctors: ({ name: A; fields: ({ fieldType: TypeExpr } & B)[] } & C)[],
    typeName: string,
    params: string[],
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >,
    env: Map<A, Scheme>,
    st: { next: number } & F,
  ) =>
    match(ctors)
      .with(
        (_v) => _v.length === 0,
        () => _tuple(env, st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([c, ...rest]) =>
          (([sc, st1]: [Scheme, { next: number } & F]) =>
            registerCtorsFrom(rest, typeName, params, aliasMap, _Map_set(c.name, sc, env), st1))(
            ctorScheme(typeName, params, c, st, aliasMap),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const registerUserCtorsFrom: <A, B, C>(
  stmts: Stmt[],
  aliasMap: Map<
    string,
    {
      expr: Option<TypeExpr>;
      params: string[];
      fields: ({ name: string; fieldType: TypeExpr } & A)[];
    } & B
  >,
  env: Map<string, Scheme>,
  st: { next: number } & C,
) => [Map<string, Scheme>, { next: number } & C] = _curry(
  4,
  <A, B, C>(
    stmts: Stmt[],
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & A)[];
      } & B
    >,
    env: Map<string, Scheme>,
    st: { next: number } & C,
  ) =>
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
              (([env1, st1]: [Map<string, Scheme>, { next: number } & C]) =>
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
const registerBuiltinCtorGroup: <A, B, C, D, E, F>(
  ctors: ({ name: A; fields: ({ fieldType: TypeExpr } & B)[] } & C)[],
  typeName: string,
  params: string[],
  aliasMap: Map<
    string,
    {
      expr: Option<TypeExpr>;
      params: string[];
      fields: ({ name: string; fieldType: TypeExpr } & D)[];
    } & E
  >,
  env: Map<A, Scheme>,
  st: { next: number } & F,
) => [Map<A, Scheme>, { next: number } & F] = _curry(
  6,
  <A, B, C, D, E, F>(
    ctors: ({ name: A; fields: ({ fieldType: TypeExpr } & B)[] } & C)[],
    typeName: string,
    params: string[],
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >,
    env: Map<A, Scheme>,
    st: { next: number } & F,
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
            : (([sc, st1]: [Scheme, { next: number } & F]) =>
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
const registerBuiltinCtorsFrom: <A, B, C, D, E, F, G>(
  decls: ({
    ctors: ({ name: A; fields: ({ fieldType: TypeExpr } & B)[] } & C)[];
    name: string;
    params: string[];
  } & D)[],
  aliasMap: Map<
    string,
    {
      expr: Option<TypeExpr>;
      params: string[];
      fields: ({ name: string; fieldType: TypeExpr } & E)[];
    } & F
  >,
  env: Map<A, Scheme>,
  st: { next: number } & G,
) => [Map<A, Scheme>, { next: number } & G] = _curry(
  4,
  <A, B, C, D, E, F, G>(
    decls: ({
      ctors: ({ name: A; fields: ({ fieldType: TypeExpr } & B)[] } & C)[];
      name: string;
      params: string[];
    } & D)[],
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & E)[];
      } & F
    >,
    env: Map<A, Scheme>,
    st: { next: number } & G,
  ) =>
    match(decls)
      .with(
        (_v) => _v.length === 0,
        () => _tuple(env, st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([d, ...rest]) =>
          (([env1, st1]: [Map<A, Scheme>, { next: number } & G]) =>
            registerBuiltinCtorsFrom(rest, aliasMap, env1, st1))(
            registerBuiltinCtorGroup(d.ctors, d.name, d.params, aliasMap, env, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const registerExternsFrom: <A, B, C>(
  stmts: Stmt[],
  aliasMap: Map<
    string,
    {
      expr: Option<TypeExpr>;
      params: string[];
      fields: ({ name: string; fieldType: TypeExpr } & A)[];
    } & B
  >,
  env: Map<string, Scheme>,
  st: { next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & C,
) => [Map<string, Scheme>, { next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & C] =
  _curry(
    4,
    <A, B, C>(
      stmts: Stmt[],
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & A)[];
        } & B
      >,
      env: Map<string, Scheme>,
      st: { next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & C,
    ) =>
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
                (([vars, st0]: [
                  Map<string, Ty>,
                  { next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & C,
                ]) =>
                  (([t, _, st1]: [
                    Ty,
                    Map<string, Ty>,
                    { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & C,
                  ]) =>
                    registerExternsFrom(
                      rest,
                      aliasMap,
                      _Map_set(name, generalize(env, t, st1, false), env),
                      st1,
                    ))(
                    typeExprToType(typeExpr, vars, st0, aliasMap, _Set_fromArray([] as string[])),
                  ))(
                  reduce(
                    _curry(
                      2,
                      (
                        [vs, s]: [
                          Map<string, Ty>,
                          { next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & C,
                        ],
                        param: string,
                      ) =>
                        (([v, s1]: [
                          Ty,
                          { next: number; tv: Map<number, Ty>; rv: Map<number, Row> } & C,
                        ]) => _tuple(_Map_set(param, v, vs), s1))(freshVar(s)),
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
const idxOfFrom: {
  (lets: Stmt[]): (i0: number) => (acc0: Map<string, number>) => Map<string, number>;
  (lets: Stmt[]): (i0: number, acc0: Map<string, number>) => Map<string, number>;
  (lets: Stmt[], i0: number): (acc0: Map<string, number>) => Map<string, number>;
  (lets: Stmt[], i0: number, acc0: Map<string, number>): Map<string, number>;
} = _curry(3, (lets: Stmt[], i0: number, acc0: Map<string, number>) => {
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
const preBindGroupFrom: <A, B, C>(
  group: Stmt[],
  env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
  st: { next: number } & C,
) => [Map<string, { vars: A[]; rvars: B[]; ty: Ty }>, { next: number } & C] = _curry(
  3,
  <A, B, C>(
    group: Stmt[],
    env: Map<string, { vars: A[]; rvars: B[]; ty: Ty }>,
    st: { next: number } & C,
  ) =>
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
              (([v, st1]: [Ty, { next: number } & C]) =>
                preBindGroupFrom(rest, _Map_set(name, mono(v), env), st1))(freshVar(st)),
            )
            .otherwise(() => preBindGroupFrom(rest, env, st)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferGroupFrom: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  group: Stmt[],
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  [
    Map<string, Ty>,
    {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ],
  IErr
> = _curry(
  3,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    group: Stmt[],
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ) =>
    match(group)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(_tuple(new Map<string, Ty>(), st)),
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
                                  Ok(_tuple(_Map_set(name, pinned, restTypes), st4)),
                                inferGroupFrom(ctx, rest, st3),
                              ),
                            match(annot)
                              .with({ _tag: "Some" }, ({ value: te }) =>
                                (([at, _, stA]: [
                                  Ty,
                                  Map<string, Ty>,
                                  {
                                    tv: Map<number, Ty>;
                                    rv: Map<number, Row>;
                                    next: number;
                                    letUses: Map<string, Ty[]>;
                                    letSpans: Map<string, Span>;
                                    recorded: TypeAt[];
                                  } & F,
                                ]) =>
                                  _Result_map(
                                    (
                                      stB: {
                                        tv: Map<number, Ty>;
                                        rv: Map<number, Row>;
                                        next: number;
                                        letUses: Map<string, Ty[]>;
                                        letSpans: Map<string, Span>;
                                        recorded: TypeAt[];
                                      } & F,
                                    ) => _tuple(at, stB),
                                    u(t, at, stA, annotSpan(te)),
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
                              .with({ _tag: "None" }, () => Ok(_tuple(t, st2)))
                              .exhaustive(),
                          ),
                        u(selfSc.ty, t, st1, span),
                      ),
                    )
                    .with({ _tag: "None" }, () =>
                      Err(typeErr(`internal: missing self-binding for '${name}'`, span)),
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
const generalizeGroupFrom: <A>(
  group: Stmt[],
  bodyTypes: Map<string, Ty>,
  env: Map<string, Scheme>,
  st: { tv: Map<number, Ty>; rv: Map<number, Row> } & A,
) => Map<string, Scheme> = _curry(
  4,
  <A>(
    group: Stmt[],
    bodyTypes: Map<string, Ty>,
    env: Map<string, Scheme>,
    st: { tv: Map<number, Ty>; rv: Map<number, Row> } & A,
  ) =>
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
const noteGroupLets: <A, B>(
  group: Stmt[],
  letOwner: Map<string, Span>,
  st: { letUses: Map<string, A[]>; letSpans: Map<string, Span> } & B,
) => [Map<string, Span>, { letUses: Map<string, A[]>; letSpans: Map<string, Span> } & B] = _curry(
  3,
  <A, B>(
    group: Stmt[],
    letOwner: Map<string, Span>,
    st: { letUses: Map<string, A[]>; letSpans: Map<string, Span> } & B,
  ) =>
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
                ((sp: Span) => noteGroupLets(rest, _Map_set(name, sp, letOwner), noteLet(sp, st)))(
                  exprSpan(value),
                ),
            )
            .otherwise(() => noteGroupLets(rest, letOwner, st)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const processGroupsFrom: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    letOwner: Map<string, Span>;
    loopStack: Ty[][];
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & C,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & C,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & C,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
              d: { end: A; start: B } & E,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & C,
            ]
          >,
          IErr
        >
      >;
    } & F)[];
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & G)[];
      } & H
    >;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
    open: boolean;
    env: Map<string, Scheme>;
  },
  sccs: number[][],
  lets: Stmt[],
  st: {
    next: number;
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & C,
) => Result<
  [
    {
      letOwner: Map<string, Span>;
      loopStack: Ty[][];
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & C,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & C,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & C,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
                d: { end: A; start: B } & E,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & C,
              ]
            >,
            IErr
          >
        >;
      } & F)[];
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & G)[];
        } & H
      >;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
      open: boolean;
      env: Map<string, Scheme>;
    },
    {
      next: number;
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & C,
  ],
  IErr
> = _curry(
  4,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      letOwner: Map<string, Span>;
      loopStack: Ty[][];
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & C,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & C,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & C,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
                d: { end: A; start: B } & E,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & D,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & C,
              ]
            >,
            IErr
          >
        >;
      } & F)[];
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & G)[];
        } & H
      >;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & I>>;
      open: boolean;
      env: Map<string, Scheme>;
    },
    sccs: number[][],
    lets: Stmt[],
    st: {
      next: number;
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & C,
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
            (([preEnv, st1]: [
              Map<string, Scheme>,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & C,
            ]) => {
              const preCtx = ctxWithEnv(ctx, preEnv);
              return _Result_flatMap(
                ([bodyTypes, st2]) =>
                  ((finalEnv: Map<string, Scheme>) =>
                    (([finalOwner, st3]: [
                      Map<string, Span>,
                      {
                        next: number;
                        letUses: Map<string, Ty[]>;
                        tv: Map<number, Ty>;
                        rv: Map<number, Row>;
                        letSpans: Map<string, Span>;
                        recorded: TypeAt[];
                      } & C,
                    ]) =>
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
const inferExprStmtsFrom: <A, B, C, D, E, F, G, H, I>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
    aliasMap: Map<
      string,
      {
        expr: Option<TypeExpr>;
        params: string[];
        fields: ({ name: string; fieldType: TypeExpr } & D)[];
      } & E
    >;
    plugins: ({
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: {
            next: number;
            letUses: Map<string, Ty[]>;
            tv: Map<number, Ty>;
            rv: Map<number, Row>;
            letSpans: Map<string, Span>;
            recorded: TypeAt[];
          } & F,
          e: {
            inferExpr: (
              a: Expr,
              b: {
                letUses: Map<string, Ty[]>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
                next: number;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
              } & F,
            ) => Result<
              [
                Ty,
                {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ],
              IErr
            >;
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              d: { end: A; start: B } & H,
            ) => Result<
              { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
              { message: string; start: B; end: A }
            >;
          },
        ) => Result<
          Option<
            [
              Ty,
              {
                next: number;
                letUses: Map<string, Ty[]>;
                tv: Map<number, Ty>;
                rv: Map<number, Row>;
                letSpans: Map<string, Span>;
                recorded: TypeAt[];
              } & F,
            ]
          >,
          IErr
        >
      >;
    } & I)[];
    loopStack: Ty[][];
    letOwner: Map<string, Span>;
  },
  stmts: Stmt[],
  st: {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
) => Result<
  {
    letUses: Map<string, Ty[]>;
    letSpans: Map<string, Span>;
    recorded: TypeAt[];
    next: number;
    tv: Map<number, Ty>;
    rv: Map<number, Row>;
  } & F,
  IErr
> = _curry(
  3,
  <A, B, C, D, E, F, G, H, I>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, { ty: Ty; rvars: number[]; vars: number[] } & C>>;
      aliasMap: Map<
        string,
        {
          expr: Option<TypeExpr>;
          params: string[];
          fields: ({ name: string; fieldType: TypeExpr } & D)[];
        } & E
      >;
      plugins: ({
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: {
              next: number;
              letUses: Map<string, Ty[]>;
              tv: Map<number, Ty>;
              rv: Map<number, Row>;
              letSpans: Map<string, Span>;
              recorded: TypeAt[];
            } & F,
            e: {
              inferExpr: (
                a: Expr,
                b: {
                  letUses: Map<string, Ty[]>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                  next: number;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                } & F,
              ) => Result<
                [
                  Ty,
                  {
                    letUses: Map<string, Ty[]>;
                    letSpans: Map<string, Span>;
                    recorded: TypeAt[];
                    next: number;
                    tv: Map<number, Ty>;
                    rv: Map<number, Row>;
                  } & F,
                ],
                IErr
              >;
              unify: (
                a: Ty,
                b: Ty,
                c: { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                d: { end: A; start: B } & H,
              ) => Result<
                { tv: Map<number, Ty>; rv: Map<number, Row>; next: number } & G,
                { message: string; start: B; end: A }
              >;
            },
          ) => Result<
            Option<
              [
                Ty,
                {
                  next: number;
                  letUses: Map<string, Ty[]>;
                  tv: Map<number, Ty>;
                  rv: Map<number, Row>;
                  letSpans: Map<string, Span>;
                  recorded: TypeAt[];
                } & F,
              ]
            >,
            IErr
          >
        >;
      } & I)[];
      loopStack: Ty[][];
      letOwner: Map<string, Span>;
    },
    stmts: Stmt[],
    st: {
      letUses: Map<string, Ty[]>;
      letSpans: Map<string, Span>;
      recorded: TypeAt[];
      next: number;
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
    } & F,
  ) =>
    match(stmts)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st),
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
const qualAliasSeedFrom: <A>(
  names: string[],
  alias: string,
  from: Map<string, A>,
  acc: Map<string, A>,
) => Map<string, A> = _curry(
  4,
  <A>(names: string[], alias: string, from: Map<string, A>, acc: Map<string, A>) =>
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
              .with({ _tag: "Some" }, ({ value: info }) => _Map_set(`${alias}.${n}`, info, acc))
              .with({ _tag: "None" }, () => acc)
              .exhaustive(),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const qualAliasSeed: <A, B>(
  stmts: Stmt[],
  quals: Map<string, { aliases: Map<string, A> } & B>,
  acc: Map<string, A>,
) => Map<string, A> = _curry(
  3,
  <A, B>(stmts: Stmt[], quals: Map<string, { aliases: Map<string, A> } & B>, acc: Map<string, A>) =>
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
const zonkRecorded: <A, B, C>(
  recorded: ({ ty: Ty; span: A } & B)[],
  st: { tv: Map<number, Ty>; rv: Map<number, Row> } & C,
) => { span: A; ty: Ty }[] = _curry(
  2,
  <A, B, C>(
    recorded: ({ ty: Ty; span: A } & B)[],
    st: { tv: Map<number, Ty>; rv: Map<number, Row> } & C,
  ) =>
    map(
      (r: { ty: Ty; span: A } & B) => ({ span: r.span, ty: zonk(r.ty, st) }),
      _Array_reverse(recorded),
    ),
);
const isConcrete: (t: Ty) => boolean = (t: Ty) => {
  const f: VarSets = freeInType(t);
  return and(eq(_Set_size(f.tv), 0), eq(_Set_size(f.rv), 0));
};
const allSameConcreteFrom: {
  (shown: string): (uses: Ty[]) => (i: number) => boolean;
  (shown: string): (uses: Ty[], i: number) => boolean;
  (shown: string, uses: Ty[]): (i: number) => boolean;
  (shown: string, uses: Ty[], i: number): boolean;
} = _curry(3, (shown: string, uses: Ty[], i: number) =>
  match(_Array_get(i, uses))
    .with({ _tag: "None" }, () => true)
    .with({ _tag: "Some" }, ({ value: t }) =>
      and(isConcrete(t), eq(showType(t), shown))
        ? allSameConcreteFrom(shown, uses, add(i, 1))
        : false,
    )
    .exhaustive(),
);
const allSameConcrete: {
  (shown: string): (uses: Ty[]) => boolean;
  (shown: string, uses: Ty[]): boolean;
} = _curry(2, (shown: string, uses: Ty[]) => allSameConcreteFrom(shown, uses, 0));
const resolveLetParamsFrom: <A, B, C>(
  keys: A[],
  st: { tv: Map<number, Ty>; rv: Map<number, Row>; letUses: Map<A, Ty[]>; letSpans: Map<A, B> } & C,
) => { span: B; ty: Ty }[] = _curry(
  2,
  <A, B, C>(
    keys: A[],
    st: {
      tv: Map<number, Ty>;
      rv: Map<number, Row>;
      letUses: Map<A, Ty[]>;
      letSpans: Map<A, B>;
    } & C,
  ) =>
    match(keys)
      .with(
        (_v) => _v.length === 0,
        () => [] as { span: B; ty: Ty }[],
      )
      .with(
        (_v) => _v.length >= 1,
        ([k, ...rest]) =>
          ((tail) =>
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
const resolveLetParams: <A, B, C>(
  st: { letSpans: Map<A, B>; tv: Map<number, Ty>; rv: Map<number, Row>; letUses: Map<A, Ty[]> } & C,
) => { span: B; ty: Ty }[] = <A, B, C>(
  st: { letSpans: Map<A, B>; tv: Map<number, Ty>; rv: Map<number, Row>; letUses: Map<A, Ty[]> } & C,
) => resolveLetParamsFrom(_Map_keys(st.letSpans), st);
const runInferImports: <A, B>(
  stmts: Stmt[],
  builtins: Map<string, Ty>,
  namespaces: Map<string, Map<string, Ty>>,
  openMode: boolean,
  imports: Map<string, Scheme>,
  nsImports: Map<string, Map<string, Scheme>>,
  quals: Map<string, { aliases: Map<string, QualAliasInfo> } & B>,
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
            b: number,
          ) => Result<[Expr, number], IErr>,
        ) => Result<Option<[Expr, number]>, IErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: Span) => Result<St, IErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], IErr>;
          },
        ) => Result<Option<[Ty, St]>, IErr>
      >;
    }[]
  >,
) => Result<
  {
    env: Map<string, Scheme>;
    types: TypeAt[];
    aliases: Map<string, QualAliasInfo>;
    letParams: TypeAt[];
  },
  IErr
> = _curry(
  8,
  <A, B>(
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    imports: Map<string, Scheme>,
    nsImports: Map<string, Map<string, Scheme>>,
    quals: Map<string, { aliases: Map<string, QualAliasInfo> } & B>,
    pluginsOpt: Option<
      {
        name: string;
        parse: Option<
          (
            a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
            b: number,
            c: (
              a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
              b: number,
            ) => Result<[Expr, number], IErr>,
          ) => Result<Option<[Expr, number]>, IErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: {
              unify: (a: Ty, b: Ty, c: St, d: Span) => Result<St, IErr>;
              inferExpr: (a: Expr, b: St) => Result<[Ty, St], IErr>;
            },
          ) => Result<Option<[Ty, St]>, IErr>
        >;
      }[]
    >,
  ) => {
    const plugins = resolvePluginsDefault(pluginsOpt);
    const st0: St = mkSt(1000);
    const env0: Map<string, Scheme> = seedBuiltins(builtins, new Map<string, Scheme>(), st0);
    const ns0: Map<string, Map<string, Scheme>> = seedNsImports(
      nsImports,
      seedNs(namespaces, env0, st0),
    );
    const aliasMap: Map<string, QualAliasInfo> = aliasMapFrom(
      stmts,
      qualAliasSeed(stmts, quals, new Map<string, QualAliasInfo>()),
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
                letOwner: new Map<string, Span>(),
              },
              sccs,
              lets,
              st3,
            ),
          )
            .with(
              (_v) => _v._tag === "Ok",
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
                          aliases: Map<string, QualAliasInfo>;
                          letParams: TypeAt[];
                        },
                        IErr
                      >,
                  )
                  .with(
                    { _tag: "Err" },
                    ({ error: e }) =>
                      Err(e) as Result<
                        {
                          env: Map<string, Scheme>;
                          types: TypeAt[];
                          aliases: Map<string, QualAliasInfo>;
                          letParams: TypeAt[];
                        },
                        IErr
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
                    aliases: Map<string, QualAliasInfo>;
                    letParams: TypeAt[];
                  },
                  IErr
                >,
            )
            .exhaustive();
        })(registerExternsFrom(stmts, aliasMap, env2, st2)))(
        registerBuiltinCtorsFrom(builtinDeclsFor(stmts), aliasMap, env1, st1),
      ))(registerUserCtorsFrom(stmts, aliasMap, env0, st0));
  },
);
export const inferProgramImports: <A, B>(
  stmts: Stmt[],
  builtins: Map<string, Ty>,
  namespaces: Map<string, Map<string, Ty>>,
  openMode: boolean,
  imports: Map<string, Scheme>,
  nsImports: Map<string, Map<string, Scheme>>,
  quals: Map<string, { aliases: Map<string, QualAliasInfo> } & B>,
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
            b: number,
          ) => Result<[Expr, number], IErr>,
        ) => Result<Option<[Expr, number]>, IErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: Span) => Result<St, IErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], IErr>;
          },
        ) => Result<Option<[Ty, St]>, IErr>
      >;
    }[]
  >,
) => Result<Map<string, Scheme>, IErr> = _curry(
  8,
  <A, B>(
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    imports: Map<string, Scheme>,
    nsImports: Map<string, Map<string, Scheme>>,
    quals: Map<string, { aliases: Map<string, QualAliasInfo> } & B>,
    pluginsOpt: Option<
      {
        name: string;
        parse: Option<
          (
            a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
            b: number,
            c: (
              a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
              b: number,
            ) => Result<[Expr, number], IErr>,
          ) => Result<Option<[Expr, number]>, IErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: {
              unify: (a: Ty, b: Ty, c: St, d: Span) => Result<St, IErr>;
              inferExpr: (a: Expr, b: St) => Result<[Ty, St], IErr>;
            },
          ) => Result<Option<[Ty, St]>, IErr>
        >;
      }[]
    >,
  ) =>
    _Result_map(
      (r: {
        env: Map<string, Scheme>;
        types: TypeAt[];
        aliases: Map<string, QualAliasInfo>;
        letParams: TypeAt[];
      }) => r.env,
      runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt),
    ),
);

const emptyQuals: Map<string, QualScope> = new Map<string, QualScope>();
export const inferProgram: {
  (
    stmts: Stmt[],
  ): (
    builtins: Map<string, Ty>,
  ) => (
    namespaces: Map<string, Map<string, Ty>>,
  ) => (openMode: boolean) => Result<Map<string, Scheme>, IErr>;
  (
    stmts: Stmt[],
  ): (
    builtins: Map<string, Ty>,
  ) => (
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ) => Result<Map<string, Scheme>, IErr>;
  (
    stmts: Stmt[],
  ): (
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
  ) => (openMode: boolean) => Result<Map<string, Scheme>, IErr>;
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
  ): (
    namespaces: Map<string, Map<string, Ty>>,
  ) => (openMode: boolean) => Result<Map<string, Scheme>, IErr>;
  (
    stmts: Stmt[],
  ): (
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ) => Result<Map<string, Scheme>, IErr>;
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
  ): (
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ) => Result<Map<string, Scheme>, IErr>;
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
  ): (openMode: boolean) => Result<Map<string, Scheme>, IErr>;
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ): Result<Map<string, Scheme>, IErr>;
} = _curry(
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
      None,
    ),
);
export const inferProgramImportsTypes: <A, B>(
  stmts: Stmt[],
  builtins: Map<string, Ty>,
  namespaces: Map<string, Map<string, Ty>>,
  openMode: boolean,
  imports: Map<string, Scheme>,
  nsImports: Map<string, Map<string, Scheme>>,
  quals: Map<string, { aliases: Map<string, QualAliasInfo> } & B>,
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
            b: number,
          ) => Result<[Expr, number], IErr>,
        ) => Result<Option<[Expr, number]>, IErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: Span) => Result<St, IErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], IErr>;
          },
        ) => Result<Option<[Ty, St]>, IErr>
      >;
    }[]
  >,
) => Result<
  {
    env: Map<string, Scheme>;
    types: TypeAt[];
    aliases: Map<string, QualAliasInfo>;
    letParams: TypeAt[];
  },
  IErr
> = _curry(
  8,
  <A, B>(
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    imports: Map<string, Scheme>,
    nsImports: Map<string, Map<string, Scheme>>,
    quals: Map<string, { aliases: Map<string, QualAliasInfo> } & B>,
    pluginsOpt: Option<
      {
        name: string;
        parse: Option<
          (
            a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
            b: number,
            c: (
              a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
              b: number,
            ) => Result<[Expr, number], IErr>,
          ) => Result<Option<[Expr, number]>, IErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: {
              unify: (a: Ty, b: Ty, c: St, d: Span) => Result<St, IErr>;
              inferExpr: (a: Expr, b: St) => Result<[Ty, St], IErr>;
            },
          ) => Result<Option<[Ty, St]>, IErr>
        >;
      }[]
    >,
  ) =>
    runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt),
);
export const inferProgramTypes: {
  (
    stmts: Stmt[],
  ): (builtins: Map<string, Ty>) => (namespaces: Map<string, Map<string, Ty>>) => (
    openMode: boolean,
  ) => Result<
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    IErr
  >;
  (
    stmts: Stmt[],
  ): (builtins: Map<string, Ty>) => (
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ) => Result<
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    IErr
  >;
  (
    stmts: Stmt[],
  ): (
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
  ) => (openMode: boolean) => Result<
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    IErr
  >;
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
  ): (namespaces: Map<string, Map<string, Ty>>) => (openMode: boolean) => Result<
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    IErr
  >;
  (
    stmts: Stmt[],
  ): (
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ) => Result<
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    IErr
  >;
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
  ): (
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ) => Result<
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    IErr
  >;
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
  ): (openMode: boolean) => Result<
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    IErr
  >;
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ): Result<
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    IErr
  >;
} = _curry(
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
      None,
    ),
);
export const inferProgramWith: <A>(
  stmts: Stmt[],
  builtins: Map<string, Ty>,
  namespaces: Map<string, Map<string, Ty>>,
  openMode: boolean,
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
            b: number,
          ) => Result<[Expr, number], IErr>,
        ) => Result<Option<[Expr, number]>, IErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: Span) => Result<St, IErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], IErr>;
          },
        ) => Result<Option<[Ty, St]>, IErr>
      >;
    }[]
  >,
) => Result<Map<string, Scheme>, IErr> = _curry(
  5,
  <A>(
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    pluginsOpt: Option<
      {
        name: string;
        parse: Option<
          (
            a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
            b: number,
            c: (
              a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
              b: number,
            ) => Result<[Expr, number], IErr>,
          ) => Result<Option<[Expr, number]>, IErr>
        >;
        inferCall: Option<
          (
            a: Expr,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: {
              unify: (a: Ty, b: Ty, c: St, d: Span) => Result<St, IErr>;
              inferExpr: (a: Expr, b: St) => Result<[Ty, St], IErr>;
            },
          ) => Result<Option<[Ty, St]>, IErr>
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
