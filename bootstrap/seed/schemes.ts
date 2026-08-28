import type { AliasField, CtorField, TypeExpr } from "./ast";
import type { Row, St, Ty } from "./types";

export type Option<A> = { _tag: "Some"; value: A } | { _tag: "None" };
export type Scheme = { vars: number[]; rvars: number[]; ty: Ty };
export type VarSets = { tv: Set<number>; rv: Set<number> };
export type AliasInfo = { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> };

import {
  _curry,
  Some,
  None,
  eq,
  gte,
  lte,
  and,
  map,
  _Set_has,
  _Set_add,
  _Set_toArray,
  _Set_fromArray,
  _Set_union,
  _Set_diff,
  _Map_getOr,
  _Map_set,
  _Map_values,
  _Map_get,
  _Array_prepend,
  _Array_contains,
  _Str_codeAt,
  _tuple,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "./ast";
import {
  TyVar,
  TyCon,
  TyFn,
  TyRecord,
  TySingleton,
  TyOneOf,
  RowEmpty,
  RowVar,
  RowExtend,
  tCon,
  tArrow,
  tRecord,
  tPrim,
  tTuple,
  tLit,
  tUnion,
  rExtend,
  freshVar,
  freshRowVar,
  zonk,
} from "./types";
import * as Types from "./types";
import { primTypeNames } from "./ctors";

export const mono: <A, B, C>(t: A) => { vars: B[]; rvars: C[]; ty: A } = <A, B, C>(t: A) => ({
  vars: [] as B[],
  rvars: [] as C[],
  ty: t,
});
export const tNumber: Ty = tPrim("number");
export const tBool: Ty = tPrim("bool");
export const tString: Ty = tPrim("string");
export const primType: (name: string) => Ty = (name: string) =>
  match(name)
    .with("float", () => tNumber)
    .with("int", () => tNumber)
    .with("string", () => tString)
    .with("bool", () => tBool)
    .otherwise(() => tPrim(name));

export const emptyVarSets: VarSets = { tv: _Set_fromArray([]), rv: _Set_fromArray([]) };
const unionVarSets: <A, B, C, D>(
  a: { rv: Set<A>; tv: Set<B> } & C,
  b: { rv: Set<A>; tv: Set<B> } & D,
) => { tv: Set<B>; rv: Set<A> } = _curry(
  2,
  <A, B, C, D>(a: { rv: Set<A>; tv: Set<B> } & C, b: { rv: Set<A>; tv: Set<B> } & D) => ({
    tv: _Set_union(a.tv, b.tv),
    rv: _Set_union(a.rv, b.rv),
  }),
);
const diffVarSets: <A, B, C, D>(
  a: { rv: Set<A>; tv: Set<B> } & C,
  b: { rv: Set<A>; tv: Set<B> } & D,
) => { tv: Set<B>; rv: Set<A> } = _curry(
  2,
  <A, B, C, D>(a: { rv: Set<A>; tv: Set<B> } & C, b: { rv: Set<A>; tv: Set<B> } & D) => ({
    tv: _Set_diff(a.tv, b.tv),
    rv: _Set_diff(a.rv, b.rv),
  }),
);
export const collect: { (t: Ty): (acc: VarSets) => VarSets; (t: Ty, acc: VarSets): VarSets } =
  _curry(2, (t: Ty, acc: VarSets) =>
    match(t)
      .with({ _tag: "TyVar" }, ({ id }) => ({ tv: _Set_add(id, acc.tv), rv: acc.rv }))
      .with({ _tag: "TyCon" }, ({ args }) => collectArgs(args, acc))
      .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => collect(toT, collect(fromT, acc)))
      .with({ _tag: "TyRecord" }, ({ row }) => collectRow(row, acc))
      .with({ _tag: "TySingleton" }, () => acc)
      .with({ _tag: "TyOneOf" }, ({ members }) => collectArgs(members, acc))
      .exhaustive(),
  );
const collectArgs: {
  (args: Ty[]): (acc: VarSets) => VarSets;
  (args: Ty[], acc: VarSets): VarSets;
} = _curry(2, (args: Ty[], acc: VarSets) =>
  match(args)
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
      ([a, ...rest]) => collectArgs(rest, collect(a, acc)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const collectRow: { (row: Row): (acc: VarSets) => VarSets; (row: Row, acc: VarSets): VarSets } =
  _curry(2, (row: Row, acc: VarSets) =>
    match(row)
      .with({ _tag: "RowVar" }, ({ id }) => ({ tv: acc.tv, rv: _Set_add(id, acc.rv) }))
      .with({ _tag: "RowExtend" }, ({ fieldType, rest }) =>
        collectRow(rest, collect(fieldType, acc)),
      )
      .with({ _tag: "RowEmpty" }, () => acc)
      .exhaustive(),
  );
export const freeInType: (t: Ty) => VarSets = (t: Ty) => collect(t, emptyVarSets);
const freeInScheme: <A>(sc: { ty: Ty; rvars: number[]; vars: number[] } & A) => VarSets = <A>(
  sc: { ty: Ty; rvars: number[]; vars: number[] } & A,
) => {
  const f: VarSets = freeInType(sc.ty);
  return diffVarSets(f, { tv: _Set_fromArray(sc.vars), rv: _Set_fromArray(sc.rvars) });
};
const freeInEnvFrom: <A>(
  schemes: ({ ty: Ty; rvars: number[]; vars: number[] } & A)[],
  acc: VarSets,
) => VarSets = _curry(
  2,
  <A>(schemes: ({ ty: Ty; rvars: number[]; vars: number[] } & A)[], acc: VarSets) =>
    match(schemes)
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
        ([sc, ...rest]) => freeInEnvFrom(rest, unionVarSets(acc, freeInScheme(sc))),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const freeInEnv: <A, B>(env: Map<A, { ty: Ty; rvars: number[]; vars: number[] } & B>) => VarSets = <
  A,
  B,
>(
  env: Map<A, { ty: Ty; rvars: number[]; vars: number[] } & B>,
) => freeInEnvFrom(_Map_values(env), emptyVarSets);
export const generalize: <A, B>(
  env: Map<A, { ty: Ty; rvars: number[]; vars: number[] } & B>,
  t: Ty,
  st: St,
  widen: boolean,
) => Scheme = _curry(
  4,
  <A, B>(
    env: Map<A, { ty: Ty; rvars: number[]; vars: number[] } & B>,
    t: Ty,
    st: St,
    widen: boolean,
  ) => {
    const zt: Ty = widen ? widenLits(zonk(t, st)) : zonk(t, st);
    const free: VarSets = diffVarSets(freeInType(zt), freeInEnv(env));
    return { vars: _Set_toArray(free.tv), rvars: _Set_toArray(free.rv), ty: zt };
  },
);
export const widenLits: (t: Ty) => Ty = (t: Ty) =>
  match(t)
    .with({ _tag: "TySingleton", base: "string" }, () => tString)
    .with({ _tag: "TySingleton" }, () => tNumber)
    .with({ _tag: "TyOneOf" }, ({ members }) =>
      tUnion(
        map(
          (m: Ty) =>
            match(m)
              .with({ _tag: "TySingleton" }, () => m)
              .otherwise(() => widenLits(m)),
          members,
        ),
      ),
    )
    .with({ _tag: "TyCon" }, ({ name, args }) => tCon(name, map(widenLits, args)))
    .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tArrow(widenLits(fromT), widenLits(toT)))
    .with({ _tag: "TyRecord" }, ({ row }) => tRecord(widenRow(row)))
    .with({ _tag: "TyVar" }, () => t)
    .exhaustive();
const widenRow: (row: Row) => Row = (row: Row) =>
  match(row)
    .with({ _tag: "RowEmpty" }, () => row)
    .with({ _tag: "RowVar" }, () => row)
    .with({ _tag: "RowExtend" }, ({ label, fieldType, rest }) =>
      rExtend(label, widenLits(fieldType), widenRow(rest)),
    )
    .exhaustive();
const instMapFrom: <A>(vars: A[], acc: Map<A, Ty>, st: St) => [Map<A, Ty>, St] = _curry(
  3,
  <A>(vars: A[], acc: Map<A, Ty>, st: St) =>
    match(vars)
      .with(
        (_v) => _v.length === 0,
        () => _tuple(acc, st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([v, ...rest]) =>
          (([fv, st1]: [Ty, St]) => instMapFrom(rest, _Map_set(v, fv, acc), st1))(freshVar(st)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const instRowMapFrom: <A>(vars: A[], acc: Map<A, Row>, st: St) => [Map<A, Row>, St] = _curry(
  3,
  <A>(vars: A[], acc: Map<A, Row>, st: St) =>
    match(vars)
      .with(
        (_v) => _v.length === 0,
        () => _tuple(acc, st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([v, ...rest]) =>
          (([fr, st1]: [Row, St]) => instRowMapFrom(rest, _Map_set(v, fr, acc), st1))(
            freshRowVar(st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const instSub: {
  (t: Ty): (tmap: Map<number, Ty>) => (rmap: Map<number, Row>) => Ty;
  (t: Ty): (tmap: Map<number, Ty>, rmap: Map<number, Row>) => Ty;
  (t: Ty, tmap: Map<number, Ty>): (rmap: Map<number, Row>) => Ty;
  (t: Ty, tmap: Map<number, Ty>, rmap: Map<number, Row>): Ty;
} = _curry(3, (t: Ty, tmap: Map<number, Ty>, rmap: Map<number, Row>) =>
  match(t)
    .with({ _tag: "TyVar" }, ({ id }) => _Map_getOr(t, id, tmap))
    .with({ _tag: "TyCon" }, ({ name, args }) =>
      tCon(
        name,
        map((a: Ty) => instSub(a, tmap, rmap), args),
      ),
    )
    .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
      tArrow(instSub(fromT, tmap, rmap), instSub(toT, tmap, rmap)),
    )
    .with({ _tag: "TyRecord" }, ({ row }) => tRecord(instSubRow(row, tmap, rmap)))
    .with({ _tag: "TySingleton" }, ({ base, value }) => TySingleton(base, value))
    .with({ _tag: "TyOneOf" }, ({ members }) =>
      tUnion(map((m: Ty) => instSub(m, tmap, rmap), members)),
    )
    .exhaustive(),
);
const instSubRow: {
  (row: Row): (tmap: Map<number, Ty>) => (rmap: Map<number, Row>) => Row;
  (row: Row): (tmap: Map<number, Ty>, rmap: Map<number, Row>) => Row;
  (row: Row, tmap: Map<number, Ty>): (rmap: Map<number, Row>) => Row;
  (row: Row, tmap: Map<number, Ty>, rmap: Map<number, Row>): Row;
} = _curry(3, (row: Row, tmap: Map<number, Ty>, rmap: Map<number, Row>) =>
  match(row)
    .with({ _tag: "RowVar" }, ({ id }) => _Map_getOr(row, id, rmap))
    .with({ _tag: "RowExtend" }, ({ label, fieldType, rest }) =>
      rExtend(label, instSub(fieldType, tmap, rmap), instSubRow(rest, tmap, rmap)),
    )
    .with({ _tag: "RowEmpty" }, () => row)
    .exhaustive(),
);
export const instantiate: <A>(
  sc: { ty: Ty; rvars: number[]; vars: number[] } & A,
  st: St,
) => [Ty, St] = _curry(2, <A>(sc: { ty: Ty; rvars: number[]; vars: number[] } & A, st: St) =>
  (([tmap, st1]: [Map<number, Ty>, St]) =>
    (([rmap, st2]: [Map<number, Row>, St]) => _tuple(instSub(sc.ty, tmap, rmap), st2))(
      instRowMapFrom(sc.rvars, new Map<number, Row>(), st1),
    ))(instMapFrom(sc.vars, new Map<number, Ty>(), st)),
);
export const isUpperStart: (s: string) => boolean = (s: string) =>
  match(_Str_codeAt(0, s))
    .with({ _tag: "Some" }, ({ value: c }) => and(gte(c, 65), lte(c, 90)))
    .with({ _tag: "None" }, () => false)
    .exhaustive();

export const typeExprListToType: <A>(
  tes: TypeExpr[],
  vars: Map<string, Ty>,
  st: St,
  aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A>,
  expanding: Set<string>,
) => [Ty[], Map<string, Ty>, St] = _curry(
  5,
  <A>(
    tes: TypeExpr[],
    vars: Map<string, Ty>,
    st: St,
    aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A>,
    expanding: Set<string>,
  ) =>
    match(tes)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => _tuple([] as Ty[], vars, st),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([te, ...rest]) =>
          (([t, vars1, st1]: [Ty, Map<string, Ty>, St]) =>
            (([restTs, vars2, st2]: [Ty[], Map<string, Ty>, St]) =>
              _tuple(_Array_prepend(t, restTs), vars2, st2))(
              typeExprListToType(rest, vars1, st1, aliases, expanding),
            ))(typeExprToType(te, vars, st, aliases, expanding)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
export const typeExprName: <A>(
  name: string,
  vars: Map<string, Ty>,
  st: St,
  aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A>,
  expanding: Set<string>,
) => [Ty, Map<string, Ty>, St] = _curry(
  5,
  <A>(
    name: string,
    vars: Map<string, Ty>,
    st: St,
    aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A>,
    expanding: Set<string>,
  ) =>
    _Array_contains(name, primTypeNames)
      ? _tuple(primType(name), vars, st)
      : match(_Map_get(name, vars))
          .with({ _tag: "Some" }, ({ value: v }) => _tuple(v, vars, st))
          .with({ _tag: "None" }, () =>
            match(_Map_get(name, aliases))
              .with({ _tag: "Some" }, ({ value: info }) =>
                (([t, st1]: [Ty, St]) => _tuple(t, vars, st1))(
                  aliasRow(name, info, [] as Ty[], st, aliases, expanding),
                ),
              )
              .with({ _tag: "None" }, () =>
                isUpperStart(name)
                  ? _tuple(tPrim(name), vars, st)
                  : (([v, st1]: [Ty, St]) => _tuple(v, _Map_set(name, v, vars), st1))(freshVar(st)),
              )
              .exhaustive(),
          )
          .exhaustive(),
);
export const typeExprToType: <A>(
  te: TypeExpr,
  vars: Map<string, Ty>,
  st: St,
  aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A>,
  expanding: Set<string>,
) => [Ty, Map<string, Ty>, St] = _curry(
  5,
  <A>(
    te: TypeExpr,
    vars: Map<string, Ty>,
    st: St,
    aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A>,
    expanding: Set<string>,
  ) =>
    match(te)
      .with({ _tag: "TyArrow" }, ({ from: fromTe, to: toTe }) =>
        (([fromT, vars1, st1]: [Ty, Map<string, Ty>, St]) =>
          (([toT, vars2, st2]: [Ty, Map<string, Ty>, St]) =>
            _tuple(tArrow(fromT, toT), vars2, st2))(
            typeExprToType(toTe, vars1, st1, aliases, expanding),
          ))(typeExprToType(fromTe, vars, st, aliases, expanding)),
      )
      .with({ _tag: "TyApp" }, ({ ctor, args: argTes }) =>
        (([args, vars1, st1]: [Ty[], Map<string, Ty>, St]) =>
          match(_Map_get(ctor, aliases))
            .with({ _tag: "Some" }, ({ value: info }) =>
              (([t, st2]: [Ty, St]) => _tuple(t, vars1, st2))(
                aliasRow(ctor, info, args, st1, aliases, expanding),
              ),
            )
            .with({ _tag: "None" }, () => _tuple(tCon(ctor, args), vars1, st1))
            .exhaustive())(typeExprListToType(argTes, vars, st, aliases, expanding)),
      )
      .with({ _tag: "TyTuple" }, ({ elems: elemTes }) =>
        (([elems, vars1, st1]: [Ty[], Map<string, Ty>, St]) => _tuple(tTuple(elems), vars1, st1))(
          typeExprListToType(elemTes, vars, st, aliases, expanding),
        ),
      )
      .with({ _tag: "TyList" }, ({ elem: elemTe }) =>
        (([elemT, vars1, st1]: [Ty, Map<string, Ty>, St]) =>
          _tuple(tCon("Array", [elemT]), vars1, st1))(
          typeExprToType(elemTe, vars, st, aliases, expanding),
        ),
      )
      .with({ _tag: "TyName" }, ({ name }) => typeExprName(name, vars, st, aliases, expanding))
      .with({ _tag: "TyQual" }, ({ alias, name, args: argTes }) =>
        (([args, vars1, st1]: [Ty[], Map<string, Ty>, St]) =>
          match(_Map_get(`${alias}.${name}`, aliases))
            .with({ _tag: "Some" }, ({ value: info }) =>
              (([t, st2]: [Ty, St]) => _tuple(t, vars1, st2))(
                aliasRow(name, info, args, st1, aliases, expanding),
              ),
            )
            .with({ _tag: "None" }, () => _tuple(tCon(name, args), vars1, st1))
            .exhaustive())(typeExprListToType(argTes, vars, st, aliases, expanding)),
      )
      .with({ _tag: "TyLit" }, ({ value }) => _tuple(tLit(value), vars, st))
      .with({ _tag: "TyUnion" }, ({ members }) =>
        (([ts, vars1, st1]: [Ty[], Map<string, Ty>, St]) => _tuple(tUnion(ts), vars1, st1))(
          typeExprListToType(members, vars, st, aliases, expanding),
        ),
      )
      .exhaustive(),
);
const aliasLocalVarsFrom: <A>(params: A[], args: Ty[], st: St) => [Map<A, Ty>, St] = _curry(
  3,
  <A>(params: A[], args: Ty[], st: St) =>
    match(params)
      .with(
        (_v) => _v.length === 0,
        () => _tuple(new Map<A, Ty>(), st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([p, ...restParams]) =>
          match(args)
            .with(
              (_v) => {
                const _g: any = _v;
                return _g.length >= 1;
              },
              ([a, ...restArgs]) =>
                (([restMap, st1]: [Map<A, Ty>, St]) => _tuple(_Map_set(p, a, restMap), st1))(
                  aliasLocalVarsFrom(restParams, restArgs, st),
                ),
            )
            .with(
              (_v) => {
                const _g: any = _v;
                return _g.length === 0;
              },
              () =>
                (([v, st1]: [Ty, St]) =>
                  (([restMap, st2]: [Map<A, Ty>, St]) => _tuple(_Map_set(p, v, restMap), st2))(
                    aliasLocalVarsFrom(restParams, [] as Ty[], st1),
                  ))(freshVar(st)),
            )
            .otherwise(() => {
              throw new Error("non-exhaustive match");
            }),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const aliasFieldsFrom: <A>(
  fields: AliasField[],
  vars: Map<string, Ty>,
  st: St,
  aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A>,
  expanding: Set<string>,
) => [Row, St] = _curry(
  5,
  <A>(
    fields: AliasField[],
    vars: Map<string, Ty>,
    st: St,
    aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A>,
    expanding: Set<string>,
  ) =>
    match(fields)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => _tuple(RowEmpty as Row, st),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([fld, ...rest]) =>
          (([ft, vars1, st1]: [Ty, Map<string, Ty>, St]) =>
            (([restRow, st2]: [Row, St]) => _tuple(rExtend(fld.name, ft, restRow), st2))(
              aliasFieldsFrom(rest, vars1, st1, aliases, expanding),
            ))(typeExprToType(fld.fieldType, vars, st, aliases, expanding)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
export const aliasRow: <A>(
  name: string,
  info: { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A,
  args: Ty[],
  st: St,
  aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A>,
  expanding: Set<string>,
) => [Ty, St] = _curry(
  6,
  <A>(
    name: string,
    info: { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A,
    args: Ty[],
    st: St,
    aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A>,
    expanding: Set<string>,
  ) =>
    _Set_has(name, expanding)
      ? _tuple(tCon(name, args), st)
      : match(info.expr)
          .with({ _tag: "Some" }, ({ value: te }) =>
            (([local, st1]: [Map<string, Ty>, St]) =>
              (([t, _, st2]: [Ty, Map<string, Ty>, St]) => _tuple(t, st2))(
                typeExprToType(te, local, st1, aliases, _Set_add(name, expanding)),
              ))(aliasLocalVarsFrom(info.params, args, st)),
          )
          .with({ _tag: "None" }, () =>
            (([local, st1]: [Map<string, Ty>, St]) => {
              const next: Set<string> = _Set_add(name, expanding);
              return (([row, st2]: [Row, St]) => _tuple(tRecord(row), st2))(
                aliasFieldsFrom(info.fields, local, st1, aliases, next),
              );
            })(aliasLocalVarsFrom(info.params, args, st)),
          )
          .exhaustive(),
);
const pvarsFrom: <A>(params: A[], st: St) => [Map<A, Ty>, Ty[], St] = _curry(
  2,
  <A>(params: A[], st: St) =>
    match(params)
      .with(
        (_v) => _v.length === 0,
        () => _tuple(new Map<A, Ty>(), [] as Ty[], st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([p, ...rest]) =>
          (([v, st1]: [Ty, St]) =>
            (([restMap, restVars, st2]: [Map<A, Ty>, Ty[], St]) =>
              _tuple(_Map_set(p, v, restMap), _Array_prepend(v, restVars), st2))(
              pvarsFrom(rest, st1),
            ))(freshVar(st)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const ctorFieldsArrowFrom: <A>(
  fields: CtorField[],
  pvars: Map<string, Ty>,
  st: St,
  aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A>,
  result: Ty,
) => [Ty, St] = _curry(
  5,
  <A>(
    fields: CtorField[],
    pvars: Map<string, Ty>,
    st: St,
    aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & A>,
    result: Ty,
  ) =>
    match(fields)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => _tuple(result, st),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([fld, ...rest]) =>
          (([ft, _, st1]: [Ty, Map<string, Ty>, St]) =>
            (([restT, st2]: [Ty, St]) => _tuple(tArrow(ft, restT), st2))(
              ctorFieldsArrowFrom(rest, pvars, st1, aliases, result),
            ))(typeExprToType(fld.fieldType, pvars, st, aliases, _Set_fromArray([] as string[]))),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
export const ctorScheme: <A, B>(
  typeName: string,
  params: string[],
  c: { fields: CtorField[] } & A,
  st: St,
  aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & B>,
) => [Scheme, St] = _curry(
  5,
  <A, B>(
    typeName: string,
    params: string[],
    c: { fields: CtorField[] } & A,
    st: St,
    aliases: Map<string, { expr: Option<TypeExpr>; params: string[]; fields: AliasField[] } & B>,
  ) =>
    (([pvars, pvarTypes, st1]: [Map<string, Ty>, Ty[], St]) => {
      const result: Ty = tCon(typeName, pvarTypes);
      return (([ty, st2]: [Ty, St]) => {
        const sets: VarSets = collect(ty, emptyVarSets);
        return _tuple({ vars: _Set_toArray(sets.tv), rvars: _Set_toArray(sets.rv), ty: ty }, st2);
      })(ctorFieldsArrowFrom(c.fields, pvars, st1, aliases, result));
    })(pvarsFrom(params, st)),
);
