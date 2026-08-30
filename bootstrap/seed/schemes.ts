import type { AliasField, CtorField, TypeExpr } from "./ast";
import type { Row, St, Ty } from "./types";

/**
 * A generalized binding type: the quantified type vars, the quantified ROW
 * vars, and the body. Declared purely so the TS backend has a NAME to fold
 * this row back to (ADR 0092) — a record alias is structural and nothing
 * annotates with it, so this changes no inference.
 */
export type Scheme = { vars: number[]; rvars: number[]; ty: Ty };
export type VarSets = { tv: Set<number>; rv: Set<number> };
export type AliasInfo = { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_contains,
  _Array_prepend,
  _Map_get,
  _Map_getOr,
  _Map_set,
  _Map_values,
  _Set_add,
  _Set_diff,
  _Set_fromArray,
  _Set_has,
  _Set_toArray,
  _Str_codeAt,
  _curry,
  _tuple,
  and,
  eq,
  gte,
  lte,
  map,
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
  rField,
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
/**
 * surface `float`/`int`/`string`/`bool` type-expr names -> HM primitive type
 * (used by typeExprToType, further down, for extern signatures)
 */
export const primType: (name: string) => Ty = (name: string) =>
  match(name)
    .with("float", () => tNumber)
    .with("int", () => tNumber)
    .with("string", () => tString)
    .with("bool", () => tBool)
    .otherwise(() => tPrim(name));

export const emptyVarSets: VarSets = { tv: _Set_fromArray([]), rv: _Set_fromArray([]) };
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
export const collect: _Curry<[t: Ty, acc: VarSets], VarSets> = _curry(2, (t: Ty, acc: VarSets) =>
  match(t)
    .with({ _tag: "TyVar" }, ({ id }) => ({ tv: _Set_add(id, acc.tv), rv: acc.rv }))
    .with({ _tag: "TyCon" }, ({ args }) => collectArgs(args, acc))
    .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => collect(toT, collect(fromT, acc)))
    .with({ _tag: "TyRecord" }, ({ row }) => collectRow(row, acc))
    .with({ _tag: "TySingleton" }, () => acc)
    .with({ _tag: "TyOneOf" }, ({ members }) => collectArgs(members, acc))
    .exhaustive(),
);
const collectArgs: _Curry<[args: Ty[], acc: VarSets], VarSets> = _curry(
  2,
  (args: Ty[], acc: VarSets) =>
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
const collectRow: _Curry<[row: Row, acc: VarSets], VarSets> = _curry(2, (row: Row, acc: VarSets) =>
  match(row)
    .with({ _tag: "RowVar" }, ({ id }) => ({ tv: acc.tv, rv: _Set_add(id, acc.rv) }))
    .with({ _tag: "RowExtend" }, ({ fieldType, rest }) => collectRow(rest, collect(fieldType, acc)))
    .with({ _tag: "RowEmpty" }, () => acc)
    .exhaustive(),
);
export const freeInType: (t: Ty) => VarSets = (t: Ty) => collect(t, emptyVarSets);
/**
 * Free vars of an env type, resolved THROUGH the substitution. An env scheme
 * keeps the var it was built with, and unification may since have pointed that
 * var at another one; reading `sc.ty` raw reports a var the env no longer owns
 * and misses the one it now does, so `generalize` quantifies a var that is
 * still monomorphic (issue #72 — `let … in` over-generalization). Bound vars
 * stay OPAQUE, and the check precedes the resolve: a generalized scheme's own
 * quantified var can collide with a subst key.
 */
const collectFree: _Curry<[t: Ty, bound: VarSets, st: St, acc: VarSets], VarSets> = _curry(
  4,
  (t: Ty, bound: VarSets, st: St, acc: VarSets) =>
    match(t)
      .with({ _tag: "TyVar" }, ({ id }) =>
        _Set_has(id, bound.tv)
          ? acc
          : match(_Map_get(id, st.tv))
              .with({ _tag: "Some" }, ({ value: next }) => collectFree(next, bound, st, acc))
              .with({ _tag: "None" }, () => ({ tv: _Set_add(id, acc.tv), rv: acc.rv }))
              .exhaustive(),
      )
      .with({ _tag: "TyCon" }, ({ args }) => collectFreeArgs(args, bound, st, acc))
      .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
        collectFree(toT, bound, st, collectFree(fromT, bound, st, acc)),
      )
      .with({ _tag: "TyRecord" }, ({ row }) => collectFreeRow(row, bound, st, acc))
      .with({ _tag: "TySingleton" }, () => acc)
      .with({ _tag: "TyOneOf" }, ({ members }) => collectFreeArgs(members, bound, st, acc))
      .exhaustive(),
);
const collectFreeArgs: _Curry<[args: Ty[], bound: VarSets, st: St, acc: VarSets], VarSets> = _curry(
  4,
  (args: Ty[], bound: VarSets, st: St, acc: VarSets) =>
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
        ([a, ...rest]) => collectFreeArgs(rest, bound, st, collectFree(a, bound, st, acc)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const collectFreeRow: _Curry<[row: Row, bound: VarSets, st: St, acc: VarSets], VarSets> = _curry(
  4,
  (row: Row, bound: VarSets, st: St, acc: VarSets) =>
    match(row)
      .with({ _tag: "RowVar" }, ({ id }) =>
        _Set_has(id, bound.rv)
          ? acc
          : match(_Map_get(id, st.rv))
              .with({ _tag: "Some" }, ({ value: next }) => collectFreeRow(next, bound, st, acc))
              .with({ _tag: "None" }, () => ({ tv: acc.tv, rv: _Set_add(id, acc.rv) }))
              .exhaustive(),
      )
      .with({ _tag: "RowExtend" }, ({ fieldType, rest }) =>
        collectFreeRow(rest, bound, st, collectFree(fieldType, bound, st, acc)),
      )
      .with({ _tag: "RowEmpty" }, () => acc)
      .exhaustive(),
);
const freeInScheme: <A>(
  sc: { ty: Ty; rvars: number[]; vars: number[] } & A,
  st: St,
  acc: VarSets,
) => VarSets = _curry(
  3,
  <A>(sc: { ty: Ty; rvars: number[]; vars: number[] } & A, st: St, acc: VarSets) =>
    collectFree(sc.ty, { tv: _Set_fromArray(sc.vars), rv: _Set_fromArray(sc.rvars) }, st, acc),
);
const freeInEnvFrom: <A>(
  schemes: ({ ty: Ty; rvars: number[]; vars: number[] } & A)[],
  st: St,
  acc: VarSets,
) => VarSets = _curry(
  3,
  <A>(schemes: ({ ty: Ty; rvars: number[]; vars: number[] } & A)[], st: St, acc: VarSets) =>
    match(schemes)
      .with(
        (_v) => _v.length === 0,
        () => acc,
      )
      .with(
        (_v) => _v.length >= 1,
        ([sc, ...rest]) => freeInEnvFrom(rest, st, freeInScheme(sc, st, acc)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const freeInEnv: <A, B>(
  env: Map<A, { ty: Ty; rvars: number[]; vars: number[] } & B>,
  st: St,
) => VarSets = _curry(
  2,
  <A, B>(env: Map<A, { ty: Ty; rvars: number[]; vars: number[] } & B>, st: St) =>
    freeInEnvFrom(_Map_values(env), st, emptyVarSets),
);
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
    const free: VarSets = diffVarSets(freeInType(zt), freeInEnv(env, st));
    return { vars: _Set_toArray(free.tv), rvars: _Set_toArray(free.rv), ty: zt };
  },
);
/**
 * Bare string/number singletons widen to their base prim at generalization
 * of an unannotated binding (TypeScript `let`). Written types skip this
 * pass so `"hi"` stays `"hi"` (ADR 0081). Finite unions of lits stay precise.
 */
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
    .with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) =>
      rField(label, widenLits(fieldType), widenRow(rest), optional),
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
const instSub: _Curry<[t: Ty, tmap: Map<number, Ty>, rmap: Map<number, Row>], Ty> = _curry(
  3,
  (t: Ty, tmap: Map<number, Ty>, rmap: Map<number, Row>) =>
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
const instSubRow: _Curry<[row: Row, tmap: Map<number, Ty>, rmap: Map<number, Row>], Row> = _curry(
  3,
  (row: Row, tmap: Map<number, Ty>, rmap: Map<number, Row>) =>
    match(row)
      .with({ _tag: "RowVar" }, ({ id }) => _Map_getOr(row, id, rmap))
      .with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) =>
        rField(label, instSub(fieldType, tmap, rmap), instSubRow(rest, tmap, rmap), optional),
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

export const typeExprListToType: _Curry<
  [
    tes: TypeExpr[],
    vars: Map<string, Ty>,
    st: St,
    aliases: Map<string, AliasInfo>,
    expanding: Set<string>,
  ],
  [Ty[], Map<string, Ty>, St]
> = _curry(
  5,
  (
    tes: TypeExpr[],
    vars: Map<string, Ty>,
    st: St,
    aliases: Map<string, AliasInfo>,
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
/**
 * `unit` is an ordinary primitive name (ADR 0054), so `()` in TypeExpr — which the
 * parser lowers to `TyName("unit")` — needs no special case here.
 */
export const typeExprName: _Curry<
  [
    name: string,
    vars: Map<string, Ty>,
    st: St,
    aliases: Map<string, AliasInfo>,
    expanding: Set<string>,
  ],
  [Ty, Map<string, Ty>, St]
> = _curry(
  5,
  (
    name: string,
    vars: Map<string, Ty>,
    st: St,
    aliases: Map<string, AliasInfo>,
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
/**
 * surface type-expr -> HM type. Prim names map to their type; Uppercase names
 * are nullary constructors (unless a transparent alias expands them);
 * lowercase names are type variables, shared by name within one signature
 * via the threaded `vars` cache.
 */
export const typeExprToType: _Curry<
  [
    te: TypeExpr,
    vars: Map<string, Ty>,
    st: St,
    aliases: Map<string, AliasInfo>,
    expanding: Set<string>,
  ],
  [Ty, Map<string, Ty>, St]
> = _curry(
  5,
  (
    te: TypeExpr,
    vars: Map<string, Ty>,
    st: St,
    aliases: Map<string, AliasInfo>,
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
const aliasFieldsFrom: _Curry<
  [
    fields: AliasField[],
    vars: Map<string, Ty>,
    st: St,
    aliases: Map<string, AliasInfo>,
    expanding: Set<string>,
  ],
  [Row, St]
> = _curry(
  5,
  (
    fields: AliasField[],
    vars: Map<string, Ty>,
    st: St,
    aliases: Map<string, AliasInfo>,
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
            (([restRow, st2]: [Row, St]) =>
              _tuple(rField(fld.name, ft, restRow, fld.optional), st2))(
              aliasFieldsFrom(rest, vars1, st1, aliases, expanding),
            ))(typeExprToType(fld.fieldType, vars, st, aliases, expanding)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * Expand a record alias to its structural row. `args` binds its type params
 * positionally; params past `args.length` become fresh generic vars.
 * `expanding` breaks reference cycles (`type T = { self: T }`) by falling
 * back to the bare nominal `con(name, args)` — finite, though that field
 * then unifies nominally.
 */
export const aliasRow: _Curry<
  [
    name: string,
    info: AliasInfo,
    args: Ty[],
    st: St,
    aliases: Map<string, AliasInfo>,
    expanding: Set<string>,
  ],
  [Ty, St]
> = _curry(
  6,
  (
    name: string,
    info: AliasInfo,
    args: Ty[],
    st: St,
    aliases: Map<string, AliasInfo>,
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
const ctorFieldsArrowFrom: _Curry<
  [
    fields: CtorField[],
    pvars: Map<string, Ty>,
    st: St,
    aliases: Map<string, AliasInfo>,
    result: Ty,
  ],
  [Ty, St]
> = _curry(
  5,
  (
    fields: CtorField[],
    pvars: Map<string, Ty>,
    st: St,
    aliases: Map<string, AliasInfo>,
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
/**
 * A variant's constructors become curried functions into that variant type,
 * polymorphic over the type's parameters. `type Result a e = | Ok(a) | Err(e)`
 * gives `Ok : forall a e. a -> Result a e` — a ctor scheme is closed by
 * construction (quantifies every var the fields introduced), nothing leaks
 * from env.
 */
export const ctorScheme: <A>(
  typeName: string,
  params: string[],
  c: { fields: CtorField[] } & A,
  st: St,
  aliases: Map<string, AliasInfo>,
) => [Scheme, St] = _curry(
  5,
  <A>(
    typeName: string,
    params: string[],
    c: { fields: CtorField[] } & A,
    st: St,
    aliases: Map<string, AliasInfo>,
  ) =>
    (([pvars, pvarTypes, st1]: [Map<string, Ty>, Ty[], St]) => {
      const result: Ty = tCon(typeName, pvarTypes);
      return (([ty, st2]: [Ty, St]) => {
        const sets: VarSets = collect(ty, emptyVarSets);
        return _tuple({ vars: _Set_toArray(sets.tv), rvars: _Set_toArray(sets.rv), ty: ty }, st2);
      })(ctorFieldsArrowFrom(c.fields, pvars, st1, aliases, result));
    })(pvarsFrom(params, st)),
);
