import type { AliasField, Ctor, CtorField, Expr, LamParam, Span, Stmt, TypeExpr } from "./ast";
import type { Row, St, Ty } from "./types";
import type { CtorFactoryTs, GenOpts, ParamAnnots } from "./codegen";
import type { TsEnv } from "./ts-types";

export type Result<A, B> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: B };
export type Option<A> = { _tag: "Some"; value: A } | { _tag: "None" };
export type AliasInfo = { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> };

import type { _Curry } from "@mochi/compiler/runtime";

import {
  _list,
  _curry,
  Some,
  None,
  add,
  sub,
  concat,
  eq,
  compare,
  show,
  lt,
  gt,
  gte,
  lte,
  not,
  and,
  or,
  length,
  map,
  filter,
  reduce,
  _List_concat,
  _Set_has,
  _Set_add,
  _Set_fromArray,
  _Map_set,
  _Map_delete,
  _Map_size,
  _Map_keys,
  _Map_values,
  _Map_get,
  _Option_map,
  _Option_flatMap,
  _Option_unwrapOr,
  _Option_isSome,
  _Array_get,
  _Array_reverse,
  _Array_concat,
  _Array_append,
  _Array_prepend,
  _Array_take,
  _Array_drop,
  _Array_contains,
  _Array_sort,
  _Array_sortBy,
  _Array_dedupeBy,
  _Str_split,
  _Str_join,
  _Str_contains,
  _Str_startsWith,
  _Str_fromCode,
  _tuple,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "./ast";
import {
  mkSt,
  freshVar,
  tVar,
  TyVar,
  TyCon,
  TyFn,
  TyRecord,
  TySingleton,
  TyOneOf,
  RowEmpty,
  RowVar,
  RowExtend,
  isUnit,
} from "./types";
import { typeExprToType, collect, emptyVarSets } from "./schemes";
import { builtinTypeDecls, keysOf } from "./ctors";
import { codegenWith, jsGenOpts, runtimeDepNames } from "./codegen";
import { inferProgramTypes, exprSpan } from "./infer";
import { genericNames, letterAt, plainEnv, recsEnv, rowShapeKey, tsEnv, tsOf } from "./ts-types";
const paramVarsFrom: <A>(params: A[], i: number) => Map<A, Ty> = _curry(
  2,
  <A>(params: A[], i: number) =>
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => new Map<A, Ty>())
      .with({ _tag: "Some" }, ({ value: p }) =>
        _Map_set(p, tVar(i), paramVarsFrom(params, add(i, 1))),
      )
      .exhaustive(),
);
const paramNamesFrom: <A>(params: A[], i: number) => Map<number, string> = _curry(
  2,
  <A>(params: A[], i: number) =>
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => new Map<number, string>())
      .with({ _tag: "Some" }, () => _Map_set(i, letterAt(i), paramNamesFrom(params, add(i, 1))))
      .exhaustive(),
);
const genericHead: <A>(params: A[], i: number, acc: string[]) => string = _curry(
  3,
  <A>(params: A[], i: number, acc: string[]) =>
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => (eq(length(acc), 0) ? "" : `<${_Str_join(", ", acc)}>`))
      .with({ _tag: "Some" }, () => genericHead(params, add(i, 1), _Array_append(letterAt(i), acc)))
      .exhaustive(),
);
const fieldTs: _Curry<
  [te: TypeExpr, params: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>],
  string
> = _curry(
  4,
  (te: TypeExpr, params: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>) => {
    const vars: Map<string, Ty> = paramVarsFrom(params, 0);
    const names: Map<number, string> = paramNamesFrom(params, 0);
    return (([t, _vars, _st]: [Ty, Map<string, Ty>, St]) => tsOf(t, tsEnv(names, recs)))(
      typeExprToType(te, vars, mkSt(length(params)), aliases, _Set_fromArray([] as string[])),
    );
  },
);
const ctorFieldsFrom: _Curry<
  [
    fields: CtorField[],
    keys: string[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(
  6,
  (
    fields: CtorField[],
    keys: string[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: fld }) =>
        _Array_prepend(
          `${_Option_unwrapOr(`_${show(i)}`, _Array_get(i, keys))}: ${fieldTs(fld.fieldType, params, aliases, recs)}`,
          ctorFieldsFrom(fields, keys, params, aliases, recs, add(i, 1)),
        ),
      )
      .exhaustive(),
);
const ctorVariant: _Curry<
  [c: Ctor, params: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>],
  string
> = _curry(
  4,
  (c: Ctor, params: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>) => {
    const fields: string[] = ctorFieldsFrom(c.fields, keysOf(c.fields), params, aliases, recs, 0);
    return eq(length(fields), 0)
      ? `{ _tag: "${c.name}" }`
      : `{ _tag: "${c.name}"; ${_Str_join("; ", fields)} }`;
  },
);
const ctorVariantsFrom: _Curry<
  [
    ctors: Ctor[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(
  5,
  (
    ctors: Ctor[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ) =>
    match(_Array_get(i, ctors))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: c }) =>
        _Array_prepend(
          `  | ${ctorVariant(c, params, aliases, recs)}`,
          ctorVariantsFrom(ctors, params, aliases, recs, add(i, 1)),
        ),
      )
      .exhaustive(),
);
export const typeDecl: _Curry<
  [
    name: string,
    params: string[],
    ctors: Ctor[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  string
> = _curry(
  5,
  (
    name: string,
    params: string[],
    ctors: Ctor[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ) => {
    const head: string = `${name}${genericHead(params, 0, [] as string[])}`;
    return `export type ${head} =
${_Str_join("\n", ctorVariantsFrom(ctors, params, aliases, recs, 0))};`;
  },
);
const aliasFieldsFrom: _Curry<
  [
    fields: AliasField[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(
  5,
  (
    fields: AliasField[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: f }) =>
        _Array_prepend(
          `${f.name}: ${fieldTs(f.fieldType, params, aliases, recs)}`,
          aliasFieldsFrom(fields, params, aliases, recs, add(i, 1)),
        ),
      )
      .exhaustive(),
);
export const recordAliasDecl: _Curry<
  [
    name: string,
    params: string[],
    fields: AliasField[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  string
> = _curry(
  5,
  (
    name: string,
    params: string[],
    fields: AliasField[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ) => {
    const head: string = `${name}${genericHead(params, 0, [] as string[])}`;
    const body: string[] = aliasFieldsFrom(fields, params, aliases, recs, 0);
    return eq(length(body), 0)
      ? `export type ${head} = {};`
      : `export type ${head} = { ${_Str_join("; ", body)} };`;
  },
);
export const aliasTsDecl: _Curry<
  [
    name: string,
    params: string[],
    template: TypeExpr,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  string
> = _curry(
  5,
  (
    name: string,
    params: string[],
    template: TypeExpr,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ) => {
    const head: string = `${name}${genericHead(params, 0, [] as string[])}`;
    return `export type ${head} = ${fieldTs(template, params, aliases, recs)};`;
  },
);
export const opaqueTypeDecl: (name: string) => string = (
  name: string,
) => `declare const ${name}: unique symbol;
export type ${name} = { readonly [${name}]: never };`;
const mergeInto: <A, B>(keys: A[], src: Map<A, B>, acc: Map<A, B>, i: number) => Map<A, B> = _curry(
  4,
  <A, B>(keys: A[], src: Map<A, B>, acc: Map<A, B>, i: number) =>
    match(_Array_get(i, keys))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: k }) =>
        mergeInto(
          keys,
          src,
          match(_Map_get(k, src))
            .with({ _tag: "Some" }, ({ value: v }) => _Map_set(k, v, acc))
            .with({ _tag: "None" }, () => acc)
            .exhaustive(),
          add(i, 1),
        ),
      )
      .exhaustive(),
);
const unionNamesFrom: <A, B>(
  schemes: ({ vars: A[]; rvars: A[] } & B)[],
  i: number,
  acc: Map<A, string>,
) => Map<A, string> = _curry(
  3,
  <A, B>(schemes: ({ vars: A[]; rvars: A[] } & B)[], i: number, acc: Map<A, string>) =>
    match(_Array_get(i, schemes))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: sc }) =>
        ((names) => unionNamesFrom(schemes, add(i, 1), mergeInto(_Map_keys(names), names, acc, 0)))(
          genericNames(sc),
        ),
      )
      .exhaustive(),
);
export const unionGenericNames: <A, B>(
  schemes: ({ vars: A[]; rvars: A[] } & B)[],
) => Map<A, string> = <A, B>(schemes: ({ vars: A[]; rvars: A[] } & B)[]) =>
  unionNamesFrom(schemes, 0, new Map<A, string>());
const allVarsIn: <A>(t: Ty, names: Map<number, A>) => boolean = _curry(
  2,
  <A>(t: Ty, names: Map<number, A>) =>
    match(t)
      .with({ _tag: "TyVar" }, ({ id }) => _Option_isSome(_Map_get(id, names)))
      .with({ _tag: "TyCon" }, ({ args }) => allVarsInAll(args, names, 0))
      .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
        and(allVarsIn(fromT, names), allVarsIn(toT, names)),
      )
      .with({ _tag: "TyRecord" }, ({ row }) => allVarsInRow(row, names))
      .with({ _tag: "TySingleton" }, () => true)
      .with({ _tag: "TyOneOf" }, ({ members }) => allVarsInAll(members, names, 0))
      .exhaustive(),
);
const allVarsInAll: <A>(ts: Ty[], names: Map<number, A>, i: number) => boolean = _curry(
  3,
  <A>(ts: Ty[], names: Map<number, A>, i: number) =>
    match(_Array_get(i, ts))
      .with({ _tag: "None" }, () => true)
      .with({ _tag: "Some" }, ({ value: t }) =>
        and(allVarsIn(t, names), allVarsInAll(ts, names, add(i, 1))),
      )
      .exhaustive(),
);
const allVarsInRow: <A>(row: Row, names: Map<number, A>) => boolean = _curry(
  2,
  <A>(row: Row, names: Map<number, A>) =>
    match(row)
      .with({ _tag: "RowEmpty" }, () => true)
      .with({ _tag: "RowVar" }, ({ id }) => _Option_isSome(_Map_get(id, names)))
      .with({ _tag: "RowExtend" }, ({ fieldType, rest }) =>
        and(allVarsIn(fieldType, names), allVarsInRow(rest, names)),
      )
      .exhaustive(),
);
const isConcrete: (t: Ty) => boolean = (t: Ty) => allVarsIn(t, new Map([]));
export const emptyCollTs: _Curry<[t: Ty, env: TsEnv], Option<string>> = _curry(
  2,
  (t: Ty, env: TsEnv) =>
    allVarsIn(t, env.vars) ? (Some(tsOf(t, env)) as Option<string>) : (None as Option<string>),
);
export const ctorCallTs: _Curry<[t: Ty, recs: Map<string, string>], Option<string>> = _curry(
  2,
  (t: Ty, recs: Map<string, string>) =>
    match(t)
      .with({ _tag: "TyCon" }, ({ args }) =>
        or(eq(length(args), 0), not(isConcrete(t)))
          ? (None as Option<string>)
          : (Some(tsOf(t, recsEnv(recs))) as Option<string>),
      )
      .otherwise(() => None as Option<string>),
);
export const guardParamTs: _Curry<[t: Ty, recs: Map<string, string>], Option<string>> = _curry(
  2,
  (t: Ty, recs: Map<string, string>) =>
    isConcrete(t) ? (Some(tsOf(t, recsEnv(recs))) as Option<string>) : (None as Option<string>),
);
const lambdaParamsFrom: _Curry<[t: Ty, arity: number, env: TsEnv, i: number], Option<string>[]> =
  _curry(4, (t: Ty, arity: number, env: TsEnv, i: number) =>
    gte(i, arity)
      ? ([] as Option<string>[])
      : match(t)
          .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
            _Array_prepend(
              allVarsIn(fromT, env.vars)
                ? (Some(tsOf(fromT, env)) as Option<string>)
                : isConcrete(fromT)
                  ? (Some(tsOf(fromT, recsEnv(env.recs))) as Option<string>)
                  : (None as Option<string>),
              lambdaParamsFrom(toT, arity, env, add(i, 1)),
            ),
          )
          .otherwise(() =>
            _Array_prepend(None as Option<string>, lambdaParamsFrom(t, arity, env, add(i, 1))),
          ),
  );
export const lambdaParamTypesTs: _Curry<
  [lamType: Ty, arity: number, env: TsEnv],
  Option<string>[]
> = _curry(3, (lamType: Ty, arity: number, env: TsEnv) => lambdaParamsFrom(lamType, arity, env, 0));
const genericParamsFrom: _Curry<[t: Ty, arity: number, env: TsEnv, i: number], Option<string>[]> =
  _curry(4, (t: Ty, arity: number, env: TsEnv, i: number) =>
    gte(i, arity)
      ? ([] as Option<string>[])
      : match(t)
          .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
            _Array_prepend(
              Some(tsOf(fromT, env)) as Option<string>,
              genericParamsFrom(toT, arity, env, add(i, 1)),
            ),
          )
          .otherwise(() =>
            _Array_prepend(None as Option<string>, genericParamsFrom(t, arity, env, add(i, 1))),
          ),
  );
export const genericLambdaParams: <A>(
  sc: { vars: number[]; rvars: number[]; ty: Ty } & A,
  arity: number,
  recs: Map<string, string>,
) => Option<ParamAnnots> = _curry(
  3,
  <A>(
    sc: { vars: number[]; rvars: number[]; ty: Ty } & A,
    arity: number,
    recs: Map<string, string>,
  ) => {
    const names: Map<number, string> = genericNames(sc);
    const env: TsEnv = tsEnv(names, recs);
    return eq(_Map_size(names), 0)
      ? (None as Option<ParamAnnots>)
      : (Some({
          generics: `<${_Str_join(", ", _Map_values(names))}>`,
          params: genericParamsFrom(sc.ty, arity, env, 0),
        }) as Option<ParamAnnots>);
  },
);
const neverArgs: <A>(params: A[], i: number, acc: string[]) => string[] = _curry(
  3,
  <A>(params: A[], i: number, acc: string[]) =>
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, () => neverArgs(params, add(i, 1), _Array_append("never", acc)))
      .exhaustive(),
);
const ctorParamTypes: _Curry<
  [
    fields: CtorField[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(
  5,
  (
    fields: CtorField[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: fld }) =>
        _Array_prepend(
          fieldTs(fld.fieldType, params, aliases, recs),
          ctorParamTypes(fields, params, aliases, recs, add(i, 1)),
        ),
      )
      .exhaustive(),
);
export const ctorFactoryTs: _Curry<
  [
    typeName: string,
    params: string[],
    c: Ctor,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  CtorFactoryTs
> = _curry(
  5,
  (
    typeName: string,
    params: string[],
    c: Ctor,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ) => {
    const head: string = genericHead(params, 0, [] as string[]);
    const monos: string[] = neverArgs(params, 0, [] as string[]);
    return {
      generics: head,
      paramTypes: ctorParamTypes(c.fields, params, aliases, recs, 0),
      ret: `${typeName}${head}`,
      retMono: eq(length(monos), 0) ? typeName : `${typeName}<${_Str_join(", ", monos)}>`,
    };
  },
);
const paramDeclName: <A>(p: LamParam, i: A) => string = _curry(2, <A>(p: LamParam, i: A) =>
  match(p)
    .with({ _tag: "LPName" }, ({ name }) => name)
    .otherwise(() => `_${show(i)}`),
);
const compositions: (n: number) => number[][] = (n: number) =>
  eq(n, 0) ? [[] as number[]] : compositionsFrom(n, 1);
const compositionsFrom: _Curry<[n: number, k: number], number[][]> = _curry(
  2,
  (n: number, k: number) =>
    gt(k, n)
      ? ([] as number[][])
      : _Array_concat(
          map(_Array_prepend(k), compositions(sub(n, k))),
          compositionsFrom(n, add(k, 1)),
        ),
);
const sliceGroups: <A>(params: A[], groups: number[], i: number, at: number) => A[][] = _curry(
  4,
  <A>(params: A[], groups: number[], i: number, at: number) =>
    match(_Array_get(i, groups))
      .with({ _tag: "None" }, () => [] as A[][])
      .with({ _tag: "Some" }, ({ value: g }) =>
        _Array_prepend(
          _Array_take(g, _Array_drop(at, params)),
          sliceGroups(params, groups, add(i, 1), add(at, g)),
        ),
      )
      .exhaustive(),
);
const curriedTail: _Curry<[slices: string[][], i: number, acc: string], string> = _curry(
  3,
  (slices: string[][], i: number, acc: string) =>
    lt(i, 1)
      ? acc
      : curriedTail(
          slices,
          sub(i, 1),
          `(${_Str_join(", ", _Option_unwrapOr([] as string[], _Array_get(i, slices)))}) => ${acc}`,
        ),
);
const overloadSig: _Curry<[head: string, params: string[], ret: string, groups: number[]], string> =
  _curry(4, (head: string, params: string[], ret: string, groups: number[]) => {
    const slices: string[][] = sliceGroups(params, groups, 0, 0);
    const tail: string = curriedTail(slices, sub(length(slices), 1), ret);
    return `${head}(${_Str_join(", ", _Option_unwrapOr([] as string[], _Array_get(0, slices)))}): ${tail};`;
  });
export const curriedOverloads: _Curry<[head: string, params: string[], ret: string], string> =
  _curry(3, (head: string, params: string[], ret: string) =>
    lte(length(params), 1)
      ? `${head}(${_Str_join(", ", params)}) => ${ret}`
      : `{ ${_Str_join(
          " ",
          map(
            overloadSig(head, params, ret),
            _Array_sortBy((g: number[]) => sub(0, length(g)), compositions(length(params))),
          ),
        )} }`,
  );

export const curriedFnType: _Curry<[params: string[], ret: string], string> = _curry(
  2,
  (params: string[], ret: string) =>
    lte(length(params), 1)
      ? `(${_Str_join(", ", params)}) => ${ret}`
      : `_Curry<[${_Str_join(", ", params)}], ${ret}>`,
);
const flatParamsFrom: _Curry<
  [t: Ty, value: Expr, env: TsEnv, n: number, acc: string[]],
  [string[], string]
> = _curry(5, (t: Ty, value: Expr, env: TsEnv, n: number, acc: string[]) =>
  match(value)
    .with({ _tag: "ELambda" }, ({ params, body }) =>
      eq(length(params), 0)
        ? ((next: Ty) => flatParamsFrom(next, body, env, n, acc))(
            match(t)
              .with(
                (_v): _v is Extract<Ty, { _tag: "TyFn" }> => {
                  const _g: any = _v;
                  return _g._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_g);
                },
                ({ from: fromT, to: toT }) => toT,
              )
              .otherwise(() => t),
          )
        : (([t1, n1, acc1]: [Ty, number, string[]]) => flatParamsFrom(t1, body, env, n1, acc1))(
            takeParams(t, params, env, 0, n, acc),
          ),
    )
    .otherwise(() => _tuple(acc, tsOf(t, env))),
);
const takeParams: _Curry<
  [t: Ty, params: LamParam[], env: TsEnv, i: number, n: number, acc: string[]],
  [Ty, number, string[]]
> = _curry(6, (t: Ty, params: LamParam[], env: TsEnv, i: number, n: number, acc: string[]) =>
  match(_Array_get(i, params))
    .with({ _tag: "None" }, () => _tuple(t, n, acc))
    .with({ _tag: "Some" }, ({ value: p }) =>
      match(t)
        .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
          takeParams(
            toT,
            params,
            env,
            add(i, 1),
            add(n, 1),
            _Array_append(`${paramDeclName(p, n)}: ${tsOf(fromT, env)}`, acc),
          ),
        )
        .otherwise(() => _tuple(t, n, acc)),
    )
    .exhaustive(),
);
const declType: _Curry<[t: Ty, value: Expr, env: TsEnv], string> = _curry(
  3,
  (t: Ty, value: Expr, env: TsEnv) =>
    match(value)
      .with({ _tag: "ELambda" }, ({ params, body }) =>
        eq(length(params), 0)
          ? ((next: Ty) => `() => ${declType(next, body, env)}`)(
              match(t)
                .with(
                  (_v): _v is Extract<Ty, { _tag: "TyFn" }> => {
                    const _g: any = _v;
                    return _g._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_g);
                  },
                  ({ from: fromT, to: toT }) => toT,
                )
                .otherwise(() => t),
            )
          : (([t1, _n, ps]: [Ty, number, string[]]) =>
              `(${_Str_join(", ", ps)}) => ${declType(t1, body, env)}`)(
              takeParams(t, params, env, 0, 0, [] as string[]),
            ),
      )
      .otherwise(() => tsOf(t, env)),
);
export const bindingTsType: <A>(
  sc: { vars: number[]; rvars: number[]; ty: Ty } & A,
  value: Expr,
  recs: Map<string, string>,
) => string = _curry(
  3,
  <A>(
    sc: { vars: number[]; rvars: number[]; ty: Ty } & A,
    value: Expr,
    recs: Map<string, string>,
  ) => {
    const names: Map<number, string> = genericNames(sc);
    const env: TsEnv = tsEnv(names, recs);
    const head: string = eq(_Map_size(names), 0) ? "" : `<${_Str_join(", ", _Map_values(names))}>`;
    return match(value)
      .with({ _tag: "ELambda" }, () =>
        eq(head, "")
          ? (([params, ret]: [string[], string]) => curriedFnType(params, ret))(
              flatParamsFrom(sc.ty, value, env, 0, [] as string[]),
            )
          : `${head}${declType(sc.ty, value, env)}`,
      )
      .otherwise(() => tsOf(sc.ty, recsEnv(recs)));
  },
);
const spanKey: <A, B, C>(sp: { start: A; end: B } & C) => string = <A, B, C>(
  sp: { start: A; end: B } & C,
) => `${show(sp.start)}:${show(sp.end)}`;
const typeAtFrom: <A, B, C, D, E>(
  types: ({ span: { start: A; end: B } & D; ty: C } & E)[],
  i: number,
  acc: Map<string, C>,
) => Map<string, C> = _curry(
  3,
  <A, B, C, D, E>(
    types: ({ span: { start: A; end: B } & D; ty: C } & E)[],
    i: number,
    acc: Map<string, C>,
  ) =>
    match(_Array_get(i, types))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: r }) =>
        typeAtFrom(types, add(i, 1), _Map_set(spanKey(r.span), r.ty, acc)),
      )
      .exhaustive(),
);
export const typeAtTable: <A, B, C, D, E>(
  types: ({ span: { start: A; end: B } & D; ty: C } & E)[],
) => Map<string, C> = <A, B, C, D, E>(types: ({ span: { start: A; end: B } & D; ty: C } & E)[]) =>
  typeAtFrom(types, 0, new Map<string, C>());
const consInTy: _Curry<[t: Ty, acc: Set<string>], Set<string>> = _curry(
  2,
  (t: Ty, acc: Set<string>) =>
    match(t)
      .with(
        (_v): _v is Extract<Ty, { _tag: "TyCon" }> => {
          const _g: any = _v;
          return _g._tag === "TyCon" && _g.name === "Task" && _g.args.length === 2;
        },
        ({ args: [value, error] }) =>
          consInTy(error, consInTy(value, _Set_add("Result", _Set_add("Task", acc)))),
      )
      .with({ _tag: "TyCon" }, ({ name, args }) => consInAll(args, _Set_add(name, acc), 0))
      .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => consInTy(toT, consInTy(fromT, acc)))
      .with({ _tag: "TyRecord" }, ({ row }) => consInRow(row, acc))
      .with({ _tag: "TyOneOf" }, ({ members }) => consInAll(members, acc, 0))
      .otherwise(() => acc),
);
const consInAll: _Curry<[ts: Ty[], acc: Set<string>, i: number], Set<string>> = _curry(
  3,
  (ts: Ty[], acc: Set<string>, i: number) =>
    match(_Array_get(i, ts))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: t }) => consInAll(ts, consInTy(t, acc), add(i, 1)))
      .exhaustive(),
);
const consInRow: _Curry<[row: Row, acc: Set<string>], Set<string>> = _curry(
  2,
  (row: Row, acc: Set<string>) =>
    match(row)
      .with({ _tag: "RowExtend" }, ({ fieldType, rest }) =>
        consInRow(rest, consInTy(fieldType, acc)),
      )
      .otherwise(() => acc),
);
const declaredTypeNames: _Curry<[stmts: Stmt[], i: number, acc: Set<string>], Set<string>> = _curry(
  3,
  (stmts: Stmt[], i: number, acc: Set<string>) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => acc)
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SType";
        },
        ({ value: { name } }) => declaredTypeNames(stmts, add(i, 1), _Set_add(name, acc)),
      )
      .with({ _tag: "Some" }, () => declaredTypeNames(stmts, add(i, 1), acc))
      .exhaustive(),
);
const referencedCons: <A>(
  stmts: Stmt[],
  env: Map<string, { ty: Ty } & A>,
  i: number,
  acc: Set<string>,
) => Set<string> = _curry(
  4,
  <A>(stmts: Stmt[], env: Map<string, { ty: Ty } & A>, i: number, acc: Set<string>) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => acc)
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SLet";
        },
        ({ value: { name } }) =>
          referencedCons(
            stmts,
            env,
            add(i, 1),
            _Str_startsWith("$", name)
              ? acc
              : match(_Map_get(name, env))
                  .with({ _tag: "Some" }, ({ value: sc }) => consInTy(sc.ty, acc))
                  .with({ _tag: "None" }, () => acc)
                  .exhaustive(),
          ),
      )
      .with({ _tag: "Some" }, () => referencedCons(stmts, env, add(i, 1), acc))
      .exhaustive(),
);
const builtinDeclsFor: _Curry<
  [
    declared: Set<string>,
    wanted: Set<string>,
    i: number,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  string[]
> = _curry(
  5,
  (
    declared: Set<string>,
    wanted: Set<string>,
    i: number,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ) =>
    match(_Array_get(i, builtinTypeDecls))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: bt }) =>
        ((rest: string[]) =>
          and(_Set_has(bt.name, wanted), not(_Set_has(bt.name, declared)))
            ? _Array_prepend(typeDecl(bt.name, bt.params, bt.ctors, aliases, recs), rest)
            : rest)(builtinDeclsFor(declared, wanted, add(i, 1), aliases, recs)),
      )
      .exhaustive(),
);
const builtinDeclsInBody: _Curry<
  [
    body: string,
    header: string,
    i: number,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  string[]
> = _curry(
  5,
  (
    body: string,
    header: string,
    i: number,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ) =>
    match(_Array_get(i, builtinTypeDecls))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: bt }) =>
        ((rest: string[]) =>
          and(not(_Str_contains(`type ${bt.name}`, header)), _Str_contains(bt.name, body))
            ? _Array_prepend(typeDecl(bt.name, bt.params, bt.ctors, aliases, recs), rest)
            : rest)(builtinDeclsInBody(body, header, add(i, 1), aliases, recs)),
      )
      .exhaustive(),
);
const aliasRowOf: _Curry<[fields: AliasField[], aliases: Map<string, AliasInfo>, i: number], Row> =
  _curry(3, (fields: AliasField[], aliases: Map<string, AliasInfo>, i: number) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => RowEmpty as Row)
      .with({ _tag: "Some" }, ({ value: f }) =>
        (([t, _vars, _st]: [Ty, Map<string, Ty>, St]) =>
          RowExtend(f.name, t, aliasRowOf(fields, aliases, add(i, 1))))(
          typeExprToType(
            f.fieldType,
            new Map<string, Ty>(),
            mkSt(0),
            aliases,
            _Set_fromArray([] as string[]),
          ),
        ),
      )
      .exhaustive(),
  );
const aliasShapeKey: _Curry<
  [fields: AliasField[], aliases: Map<string, AliasInfo>],
  Option<string>
> = _curry(2, (fields: AliasField[], aliases: Map<string, AliasInfo>) =>
  rowShapeKey(aliasRowOf(fields, aliases, 0), new Map<number, string>()),
);
const bareName: (name: string) => string = (name: string) => {
  const parts: string[] = _Str_split(".", name);
  return _Option_unwrapOr(name, _Array_get(sub(length(parts), 1), parts));
};
const indexAlias: <A>(
  key: string,
  name: A,
  aliases: Map<string, AliasInfo>,
  acc: Map<string, A>,
) => Map<string, A> = _curry(
  4,
  <A>(key: string, name: A, aliases: Map<string, AliasInfo>, acc: Map<string, A>) =>
    match(_Map_get(key, aliases))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: info }) =>
        match(info.expr)
          .with({ _tag: "Some" }, () => acc)
          .with({ _tag: "None" }, () =>
            or(not(eq(length(info.params), 0)), eq(length(info.fields), 0))
              ? acc
              : match(aliasShapeKey(info.fields, aliases))
                  .with({ _tag: "Some" }, ({ value: k }) => _Map_set(k, name, acc))
                  .with({ _tag: "None" }, () => acc)
                  .exhaustive(),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const recordAliasIndexFrom: _Curry<
  [keys: string[], aliases: Map<string, AliasInfo>, i: number, acc: Map<string, string>],
  Map<string, string>
> = _curry(
  4,
  (keys: string[], aliases: Map<string, AliasInfo>, i: number, acc: Map<string, string>) =>
    match(_Array_get(i, keys))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: key }) =>
        recordAliasIndexFrom(
          keys,
          aliases,
          add(i, 1),
          indexAlias(key, bareName(key), aliases, acc),
        ),
      )
      .exhaustive(),
);
export const recordAliasIndex: (aliases: Map<string, AliasInfo>) => Map<string, string> = (
  aliases: Map<string, AliasInfo>,
) => recordAliasIndexFrom(_Array_sort(_Map_keys(aliases)), aliases, 0, new Map<string, string>());
const withoutOwnShape: <A, B>(
  fields: AliasField[],
  params: A[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, B>,
) => Map<string, B> = _curry(
  4,
  <A, B>(
    fields: AliasField[],
    params: A[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, B>,
  ) =>
    match(_Array_get(0, params))
      .with({ _tag: "Some" }, () => recs)
      .with({ _tag: "None" }, () =>
        match(aliasShapeKey(fields, aliases))
          .with({ _tag: "Some" }, ({ value: k }) => _Map_delete(k, recs))
          .with({ _tag: "None" }, () => recs)
          .exhaustive(),
      )
      .exhaustive(),
);
const typeHeaderFrom: _Curry<
  [stmts: Stmt[], aliases: Map<string, AliasInfo>, recs: Map<string, string>, i: number],
  string[]
> = _curry(
  4,
  (stmts: Stmt[], aliases: Map<string, AliasInfo>, recs: Map<string, string>, i: number) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => [] as string[])
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SType";
        },
        ({ value: { name, params, ctors, alias, aliasType } }) =>
          ((rest: string[]) =>
            match(alias)
              .with({ _tag: "Some" }, ({ value: fields }) =>
                _Array_prepend(
                  recordAliasDecl(
                    name,
                    params,
                    fields,
                    aliases,
                    withoutOwnShape(fields, params, aliases, recs),
                  ),
                  rest,
                ),
              )
              .with({ _tag: "None" }, () =>
                match(aliasType)
                  .with({ _tag: "Some" }, ({ value: te }) =>
                    _Array_prepend(aliasTsDecl(name, params, te, aliases, recs), rest),
                  )
                  .with({ _tag: "None" }, () =>
                    eq(length(ctors), 0)
                      ? _Array_prepend(opaqueTypeDecl(name), rest)
                      : _Array_prepend(typeDecl(name, params, ctors, aliases, recs), rest),
                  )
                  .exhaustive(),
              )
              .exhaustive())(typeHeaderFrom(stmts, aliases, recs, add(i, 1))),
      )
      .with({ _tag: "Some" }, () => typeHeaderFrom(stmts, aliases, recs, add(i, 1)))
      .exhaustive(),
);
const genericLambdasFrom: <A, B, C>(
  stmts: Stmt[],
  env: Map<string, { vars: A[]; rvars: B[] } & C>,
  i: number,
  acc: Map<string, { vars: A[]; rvars: B[] } & C>,
) => Map<string, { vars: A[]; rvars: B[] } & C> = _curry(
  4,
  <A, B, C>(
    stmts: Stmt[],
    env: Map<string, { vars: A[]; rvars: B[] } & C>,
    i: number,
    acc: Map<string, { vars: A[]; rvars: B[] } & C>,
  ) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => acc)
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SLet";
        },
        ({ value: { name, value } }) =>
          genericLambdasFrom(
            stmts,
            env,
            add(i, 1),
            match(value)
              .with(
                (_v): _v is Extract<Expr, { _tag: "ELambda" }> => {
                  const _g: any = _v;
                  return (
                    _g._tag === "ELambda" && (({ span: sp }) => not(_Str_startsWith("$", name)))(_g)
                  );
                },
                ({ span: sp }) =>
                  match(_Map_get(name, env))
                    .with({ _tag: "Some" }, ({ value: sc }) =>
                      or(gt(length(sc.vars), 0), gt(length(sc.rvars), 0))
                        ? _Map_set(spanKey(sp), sc, acc)
                        : acc,
                    )
                    .with({ _tag: "None" }, () => acc)
                    .exhaustive(),
              )
              .otherwise(() => acc),
          ),
      )
      .with({ _tag: "Some" }, () => genericLambdasFrom(stmts, env, add(i, 1), acc))
      .exhaustive(),
);
export const tsGenOpts: <A, B, C, D, E, F, G, H, I>(
  stmts: Stmt[],
  env: Map<string, { vars: number[]; rvars: number[]; ty: Ty } & E>,
  types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[],
  letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[],
  aliases: Map<string, AliasInfo>,
) => GenOpts = _curry(
  5,
  <A, B, C, D, E, F, G, H, I>(
    stmts: Stmt[],
    env: Map<string, { vars: number[]; rvars: number[]; ty: Ty } & E>,
    types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[],
    letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[],
    aliases: Map<string, AliasInfo>,
  ) => {
    const typeAt: Map<string, Ty> = typeAtTable(types);
    const letParamAt: Map<string, Ty> = typeAtTable(letParams);
    const genericLams = genericLambdasFrom(
      stmts,
      env,
      0,
      new Map<string, { vars: number[]; rvars: number[]; ty: Ty } & E>(),
    );
    const recs: Map<string, string> = recordAliasIndex(aliases);
    const typeOf: (a: Expr) => Option<Ty> = (e: Expr) => _Map_get(spanKey(exprSpan(e)), typeAt);
    return {
      ...jsGenOpts,
      annotateLet: Some(
        _curry(2, (name: string, value: Expr) =>
          _Str_startsWith("$", name)
            ? (None as Option<string>)
            : match(value)
                .with({ _tag: "ELambda" }, () =>
                  match(_Map_get(name, env))
                    .with(
                      { _tag: "Some" },
                      ({ value: sc }) =>
                        Some(`: ${bindingTsType(sc, value, recs)}`) as Option<string>,
                    )
                    .with({ _tag: "None" }, () => None as Option<string>)
                    .exhaustive(),
                )
                .otherwise(() =>
                  _Option_map(
                    (ts: string) => `: ${ts}`,
                    _Option_flatMap(
                      (t: Ty) => emptyCollTs(t, recsEnv(recs)),
                      _Map_get(spanKey(exprSpan(value)), letParamAt),
                    ),
                  ),
                ),
        ),
      ) as Option<(a: string, b: Expr) => Option<string>>,
      annotateCtor: Some(
        _curry(2, (s: Stmt, c: Ctor) =>
          match(s)
            .with(
              { _tag: "SType" },
              ({ name, params }) =>
                Some(ctorFactoryTs(name, params, c, aliases, recs)) as Option<CtorFactoryTs>,
            )
            .otherwise(() => None as Option<CtorFactoryTs>),
        ),
      ) as Option<(a: Stmt, b: Ctor) => Option<CtorFactoryTs>>,
      annotateParams: Some(
        _curry(2, (sp: Span, arity: number) =>
          match(_Map_get(spanKey(sp), genericLams))
            .with({ _tag: "Some" }, ({ value: sc }) =>
              _Option_unwrapOr(
                { generics: "", params: [] as Option<string>[] },
                genericLambdaParams(sc, arity, recs),
              ),
            )
            .with({ _tag: "None" }, () => ({
              generics: "",
              params: match(_Map_get(spanKey(sp), typeAt))
                .with({ _tag: "Some" }, ({ value: t }) =>
                  lambdaParamTypesTs(t, arity, recsEnv(recs)),
                )
                .with({ _tag: "None" }, () => [] as Option<string>[])
                .exhaustive(),
            }))
            .exhaustive(),
        ),
      ) as Option<(a: Span, b: number) => { generics: string; params: Option<string>[] }>,
      annotateEmpty: Some((e: Expr) =>
        _Option_flatMap((t: Ty) => emptyCollTs(t, recsEnv(recs)), typeOf(e)),
      ) as Option<(a: Expr) => Option<string>>,
      annotateLetin: Some((value: Expr) =>
        _Option_flatMap(
          (t: Ty) => emptyCollTs(t, recsEnv(recs)),
          _Map_get(spanKey(exprSpan(value)), letParamAt),
        ),
      ) as Option<(a: Expr) => Option<string>>,
      annotateCall: Some((e: Expr) =>
        _Option_flatMap((t: Ty) => ctorCallTs(t, recs), typeOf(e)),
      ) as Option<(a: Expr) => Option<string>>,
      guardBaseType: Some((e: Expr) =>
        _Option_flatMap((t: Ty) => guardParamTs(t, recs), typeOf(e)),
      ) as Option<(a: Expr) => Option<string>>,
      flattenPipe: true,
      tupleHelper: true,
      moduleExt: "",
    };
  },
);
export const emitTsModule: <A, B, C, D, E, F, G, H, I>(
  stmts: Stmt[],
  env: Map<string, { ty: Ty; vars: number[]; rvars: number[] } & E>,
  types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[],
  letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[],
  aliases: Map<string, AliasInfo>,
  imported: Map<string, string[]>,
  importLines: string[],
  ns: Map<string, Map<string, string>>,
  jsDefs: Map<string, string>,
  runtimeDeps: Map<string, string[]>,
  runtimeImport: string,
) => string = _curry(
  11,
  <A, B, C, D, E, F, G, H, I>(
    stmts: Stmt[],
    env: Map<string, { ty: Ty; vars: number[]; rvars: number[] } & E>,
    types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[],
    letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[],
    aliases: Map<string, AliasInfo>,
    imported: Map<string, string[]>,
    importLines: string[],
    ns: Map<string, Map<string, string>>,
    jsDefs: Map<string, string>,
    runtimeDeps: Map<string, string[]>,
    runtimeImport: string,
  ) => {
    const declared: Set<string> = declaredTypeNames(stmts, 0, _Set_fromArray([] as string[]));
    const wanted: Set<string> = referencedCons(stmts, env, 0, _Set_fromArray([] as string[]));
    const recs: Map<string, string> = recordAliasIndex(aliases);
    const typeHeader: string[] = _Array_concat(
      builtinDeclsFor(declared, wanted, 0, aliases, recs),
      typeHeaderFrom(stmts, aliases, recs, 0),
    );
    const body: string = codegenWith(
      stmts,
      imported,
      false,
      ns,
      jsDefs,
      runtimeDeps,
      tsGenOpts(stmts, env, types, letParams, aliases),
    );
    const deps0: string[] = runtimeDepNames(stmts, imported, ns, jsDefs, runtimeDeps);
    const deps: string[] = _Str_contains("_tuple(", body) ? _Array_append("_tuple", deps0) : deps0;
    const runtimeLine: string = eq(length(deps), 0)
      ? ""
      : `import { ${_Str_join(", ", _Array_sort(deps))} } from "${runtimeImport}";`;
    const headerText: string = _Str_join("\n", typeHeader);
    const header: string[] = _Array_concat(
      builtinDeclsInBody(body, headerText, 0, aliases, recs),
      typeHeader,
    );
    const curryLine: string = _Str_contains(
      "_Curry<",
      `${_Str_join("\n", header)}
${body}`,
    )
      ? `import type { _Curry } from "${runtimeImport}";`
      : "";
    return concat(
      _Str_join(
        "\n\n",
        filter(
          (part: string) => not(eq(part, "")),
          [_Str_join("\n", header), _Str_join("\n", importLines), curryLine, runtimeLine, body],
        ),
      ),
      "\n",
    );
  },
);
const freeIdsIn: _Curry<[t: Ty, acc: number[]], number[]> = _curry(2, (t: Ty, acc: number[]) =>
  match(t)
    .with({ _tag: "TyVar" }, ({ id }) => (_Array_contains(id, acc) ? acc : _Array_append(id, acc)))
    .with({ _tag: "TyCon" }, ({ args }) => freeIdsInAll(args, acc))
    .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => freeIdsIn(toT, freeIdsIn(fromT, acc)))
    .with({ _tag: "TyRecord" }, ({ row }) => freeIdsInRow(row, acc))
    .with({ _tag: "TySingleton" }, () => acc)
    .with({ _tag: "TyOneOf" }, ({ members }) => freeIdsInAll(members, acc))
    .exhaustive(),
);
const freeIdsInAll: _Curry<[ts: Ty[], acc: number[]], number[]> = _curry(
  2,
  (ts: Ty[], acc: number[]) =>
    reduce(
      _curry(2, (a: number[], t: Ty) => freeIdsIn(t, a)),
      acc,
      ts,
    ),
);
const freeIdsInRow: _Curry<[row: Row, acc: number[]], number[]> = _curry(
  2,
  (row: Row, acc: number[]) =>
    match(row)
      .with({ _tag: "RowExtend" }, ({ fieldType, rest }) =>
        freeIdsInRow(rest, freeIdsIn(fieldType, acc)),
      )
      .otherwise(() => acc),
);
const lettersFor: <A>(ids: A[], i: number, acc: Map<A, string>) => Map<A, string> = _curry(
  3,
  <A>(ids: A[], i: number, acc: Map<A, string>) =>
    match(_Array_get(i, ids))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: id }) =>
        lettersFor(ids, add(i, 1), _Map_set(id, letterAt(i), acc)),
      )
      .exhaustive(),
);
const anyFor: <A>(ids: A[]) => Map<A, string> = <A>(ids: A[]) =>
  reduce(
    _curry(2, (acc: Map<A, string>, id: A) => _Map_set(id, "any", acc)),
    new Map<A, string>(),
    ids,
  );
const genericHeadOf: <A, B>(ids: A[], names: Map<B, string>) => string = _curry(
  2,
  <A, B>(ids: A[], names: Map<B, string>) =>
    eq(length(ids), 0) ? "" : `<${_Str_join(", ", _Map_values(names))}>`,
);
const arrowCount: (t: Ty) => number = (t: Ty) =>
  match(t)
    .with({ _tag: "TyFn" }, ({ to: toT }) => add(1, arrowCount(toT)))
    .otherwise(() => 0);
const hostParams: _Curry<[t: Ty, arity: number, names: Map<number, string>, i: number], string[]> =
  _curry(4, (t: Ty, arity: number, names: Map<number, string>, i: number) =>
    gte(i, arity)
      ? ([] as string[])
      : match(t)
          .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
            _Array_prepend(
              `${_Str_fromCode(add(97, i))}: ${tsOf(fromT, plainEnv(names))}`,
              hostParams(toT, arity, names, add(i, 1)),
            ),
          )
          .otherwise(() => [] as string[]),
  );
const hostReturn: _Curry<[t: Ty, arity: number, i: number], Ty> = _curry(
  3,
  (t: Ty, arity: number, i: number) =>
    gte(i, arity)
      ? t
      : match(t)
          .with({ _tag: "TyFn" }, ({ to: toT }) => hostReturn(toT, arity, add(i, 1)))
          .otherwise(() => t),
);
const curriedHostType: _Curry<[t: Ty, arity: number], string> = _curry(
  2,
  (t: Ty, arity: number) => {
    const ids: number[] = freeIdsIn(t, [] as number[]);
    const names: Map<number, string> = lettersFor(ids, 0, new Map<number, string>());
    return `${genericHeadOf(ids, names)}${reduce(
      _curry(2, (acc: string, p: string) => `(${p}) => ${acc}`),
      tsOf(hostReturn(t, arity, 0), plainEnv(names)),
      _Array_reverse(hostParams(t, arity, names, 0)),
    )}`;
  },
);
const flatHostType: _Curry<[t: Ty, arity: number], string> = _curry(2, (t: Ty, arity: number) => {
  const ids: number[] = freeIdsIn(t, [] as number[]);
  const names: Map<number, string> = lettersFor(ids, 0, new Map<number, string>());
  const head: string = genericHeadOf(ids, names);
  return eq(arity, 0)
    ? `${head}${tsOf(t, plainEnv(names))}`
    : curriedOverloads(
        head,
        hostParams(t, arity, names, 0),
        tsOf(hostReturn(t, arity, 0), plainEnv(names)),
      );
});
const externDecl: <A, B>(
  e: { scheme: { ty: Ty } & A; curried: boolean; imported: string } & B,
) => string = <A, B>(e: { scheme: { ty: Ty } & A; curried: boolean; imported: string } & B) => {
  const t: Ty = e.scheme.ty;
  const n: number = arrowCount(t);
  return and(gte(n, 1), e.curried)
    ? `export declare const ${e.imported}: ${curriedHostType(t, n)};`
    : eq(n, 0)
      ? `export declare const ${e.imported}: ${tsOf(t, plainEnv(anyFor(freeIdsIn(t, [] as number[]))))};`
      : `export declare const ${e.imported}: ${flatHostType(t, n)};`;
};
export const externModuleDts: <A, B>(
  externs: ({ scheme: { ty: Ty } & A; imported: string; curried: boolean } & B)[],
  aliases: Map<string, AliasInfo>,
) => string = _curry(
  2,
  <A, B>(
    externs: ({ scheme: { ty: Ty } & A; imported: string; curried: boolean } & B)[],
    aliases: Map<string, AliasInfo>,
  ) => {
    const wanted: Set<string> = reduce(
      _curry(
        2,
        (acc: Set<string>, e: { scheme: { ty: Ty } & A; imported: string; curried: boolean } & B) =>
          consInTy(e.scheme.ty, acc),
      ),
      _Set_fromArray([] as string[]),
      externs,
    );
    return concat(
      _Str_join(
        "\n",
        _Array_concat(
          map(
            (bt: { name: string; params: string[]; ctors: Ctor[] }) =>
              typeDecl(bt.name, bt.params, bt.ctors, aliases, new Map<string, string>()),
            filter(
              (bt: { name: string; params: string[]; ctors: Ctor[] }) => _Set_has(bt.name, wanted),
              builtinTypeDecls,
            ),
          ),
          map(
            externDecl,
            _Array_dedupeBy(
              (e: { imported: string; scheme: { ty: Ty } & A; curried: boolean } & B) => e.imported,
              externs,
            ),
          ),
        ),
      ),
      "\n",
    );
  },
);
