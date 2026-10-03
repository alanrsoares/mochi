import type { AliasField, CtorField, Name, TypeExpr } from "../ast/ast";
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
/**
 * One alias's display template: its expansion with each type param held by
 * a template var, as src/infer/infer.ts builds `AliasDef.template`.
 */
export type FoldTemplate = { name: string; ids: number[]; tpl: Ty };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_contains,
  _Array_find,
  _Array_get,
  _Array_prepend,
  _Map_get,
  _Map_getOr,
  _Map_has,
  _Map_keys,
  _Map_set,
  _Map_values,
  _Option_flatMap,
  _Option_match,
  _Option_unwrapOr,
  _Set_add,
  _Set_diff,
  _Set_fromArray,
  _Set_has,
  _Set_size,
  _Set_toArray,
  _Str_codeAt,
  _Str_split,
  _curry,
  _tuple,
  add,
  and,
  eq,
  filter,
  length,
  lte,
  map,
  not,
  reduce,
  sub,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "../ast/ast";
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
  idGet,
} from "./types";
import * as Types from "./types";
import { primTypeNames } from "../ast/ctors";

export const mono: (t: Ty) => Scheme = (t: Ty) => ({
  vars: [] as number[],
  rvars: [] as number[],
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
  ((_v) =>
    _v === "float"
      ? tNumber
      : _v === "int"
        ? tNumber
        : _v === "string"
          ? tString
          : _v === "bool"
            ? tBool
            : tPrim(name))(name);

export const emptyVarSets: VarSets = { tv: _Set_fromArray([]), rv: _Set_fromArray([]) };
const diffVarSets: <C, D>(
  a: { rv: Set<number>; tv: Set<number> } & C,
  b: { rv: Set<number>; tv: Set<number> } & D,
) => VarSets = _curry(
  2,
  <C, D>(
    a: { rv: Set<number>; tv: Set<number> } & C,
    b: { rv: Set<number>; tv: Set<number> } & D,
  ) => ({ tv: _Set_diff(a.tv, b.tv), rv: _Set_diff(a.rv, b.rv) }),
);
export const collect: _Curry<[t: Ty, acc: VarSets], VarSets> = _curry(2, (t: Ty, acc: VarSets) => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return { tv: _Set_add(id, acc.tv), rv: acc.rv };
    }
    case "TyCon": {
      const { args } = $match;
      return collectArgs(args, acc);
    }
    case "TyFn": {
      const { from: fromT, to: toT } = $match;
      return collect(toT, collect(fromT, acc));
    }
    case "TyRecord": {
      const { row } = $match;
      return collectRow(row, acc);
    }
    case "TySingleton": {
      return acc;
    }
    case "TyOneOf": {
      const { members } = $match;
      return collectArgs(members, acc);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
const collectArgs: _Curry<[args: Ty[], acc: VarSets], VarSets> = _curry(
  2,
  (args: Ty[], acc: VarSets) => collectArgsFrom(args, 0, acc),
);
const collectArgsFrom: _Curry<[args: Ty[], i: number, acc: VarSets], VarSets> = _curry(
  3,
  (args: Ty[], i: number, acc: VarSets) => {
    const $match = _Array_get(i, args);
    switch ($match._tag) {
      case "None": {
        return acc;
      }
      case "Some": {
        const { value: a } = $match;
        return collectArgsFrom(args, i + 1, collect(a, acc));
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const collectRow: _Curry<[row: Row, acc: VarSets], VarSets> = _curry(
  2,
  (row: Row, acc: VarSets) => {
    const $match = row;
    switch ($match._tag) {
      case "RowVar": {
        const { id } = $match;
        return { tv: acc.tv, rv: _Set_add(id, acc.rv) };
      }
      case "RowExtend": {
        const { fieldType, rest } = $match;
        return collectRow(rest, collect(fieldType, acc));
      }
      case "RowEmpty": {
        return acc;
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
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
  (t: Ty, bound: VarSets, st: St, acc: VarSets) => {
    const $match = t;
    switch ($match._tag) {
      case "TyVar": {
        const { id } = $match;
        return _Set_has(id, bound.tv)
          ? acc
          : _Option_match(
              idGet(id, st.tv),
              () => ({ tv: _Set_add(id, acc.tv), rv: acc.rv }),
              (next) => collectFree(next, bound, st, acc),
            );
      }
      case "TyCon": {
        const { args } = $match;
        return collectFreeArgs(args, bound, st, acc);
      }
      case "TyFn": {
        const { from: fromT, to: toT } = $match;
        return collectFree(toT, bound, st, collectFree(fromT, bound, st, acc));
      }
      case "TyRecord": {
        const { row } = $match;
        return collectFreeRow(row, bound, st, acc);
      }
      case "TySingleton": {
        return acc;
      }
      case "TyOneOf": {
        const { members } = $match;
        return collectFreeArgs(members, bound, st, acc);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const collectFreeArgs: _Curry<[args: Ty[], bound: VarSets, st: St, acc: VarSets], VarSets> = _curry(
  4,
  (args: Ty[], bound: VarSets, st: St, acc: VarSets) =>
    collectFreeArgsFrom(args, 0, bound, st, acc),
);
const collectFreeArgsFrom: _Curry<
  [args: Ty[], i: number, bound: VarSets, st: St, acc: VarSets],
  VarSets
> = _curry(5, (args: Ty[], i: number, bound: VarSets, st: St, acc: VarSets) => {
  const $match = _Array_get(i, args);
  switch ($match._tag) {
    case "None": {
      return acc;
    }
    case "Some": {
      const { value: a } = $match;
      return collectFreeArgsFrom(args, i + 1, bound, st, collectFree(a, bound, st, acc));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
const collectFreeRow: _Curry<[row: Row, bound: VarSets, st: St, acc: VarSets], VarSets> = _curry(
  4,
  (row: Row, bound: VarSets, st: St, acc: VarSets) => {
    const $match = row;
    switch ($match._tag) {
      case "RowVar": {
        const { id } = $match;
        return _Set_has(id, bound.rv)
          ? acc
          : _Option_match(
              idGet(id, st.rv),
              () => ({ tv: acc.tv, rv: _Set_add(id, acc.rv) }),
              (next) => collectFreeRow(next, bound, st, acc),
            );
      }
      case "RowExtend": {
        const { fieldType, rest } = $match;
        return collectFreeRow(rest, bound, st, collectFree(fieldType, bound, st, acc));
      }
      case "RowEmpty": {
        return acc;
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
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
  i: number,
  st: St,
  acc: VarSets,
) => VarSets = _curry(
  4,
  <A>(
    schemes: ({ ty: Ty; rvars: number[]; vars: number[] } & A)[],
    i: number,
    st: St,
    acc: VarSets,
  ) => {
    const $match = _Array_get(i, schemes);
    switch ($match._tag) {
      case "None": {
        return acc;
      }
      case "Some": {
        const { value: sc } = $match;
        return freeInEnvFrom(schemes, i + 1, st, freeInScheme(sc, st, acc));
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const freeInEnv: <A, B>(
  env: Map<A, { ty: Ty; rvars: number[]; vars: number[] } & B>,
  st: St,
) => VarSets = _curry(
  2,
  <A, B>(env: Map<A, { ty: Ty; rvars: number[]; vars: number[] } & B>, st: St) =>
    freeInEnvFrom(_Map_values(env), 0, st, emptyVarSets),
);
const freeInNamedFrom: <A, B>(
  names: A[],
  i: number,
  env: Map<A, { ty: Ty; rvars: number[]; vars: number[] } & B>,
  st: St,
  acc: VarSets,
) => VarSets = _curry(
  5,
  <A, B>(
    names: A[],
    i: number,
    env: Map<A, { ty: Ty; rvars: number[]; vars: number[] } & B>,
    st: St,
    acc: VarSets,
  ) => {
    const $match = _Array_get(i, names);
    switch ($match._tag) {
      case "None": {
        return acc;
      }
      case "Some": {
        const { value: n } = $match;
        return freeInNamedFrom(
          names,
          i + 1,
          env,
          st,
          _Option_match(
            _Map_get(n, env),
            () => acc,
            (sc) => freeInScheme(sc, st, acc),
          ),
        );
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const generalizeAgainst: <A>(
  envFree: () => { rv: Set<number>; tv: Set<number> } & A,
  t: Ty,
  st: St,
  widen: boolean,
) => Scheme = _curry(
  4,
  <A>(envFree: () => { rv: Set<number>; tv: Set<number> } & A, t: Ty, st: St, widen: boolean) => {
    const zt: Ty = widen ? widenLits(zonk(t, st)) : zonk(t, st);
    const own: VarSets = freeInType(zt);
    const free: VarSets = and(_Set_size(own.tv) === 0, _Set_size(own.rv) === 0)
      ? own
      : diffVarSets(own, envFree());
    return { vars: _Set_toArray(free.tv), rvars: _Set_toArray(free.rv), ty: zt };
  },
);
/**
 * A type with no free variables generalizes to itself, whatever the env
 * holds, so the env walk is skipped.
 */
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
  ) => generalizeAgainst(() => freeInEnv(env, st), t, st, widen),
);
/**
 * `generalize`, reading free variables only from the env entries named in
 * `names`. The caller promises every other entry is closed — a builtin, an
 * import, a constructor, or a top-level `let` already generalized — so
 * skipping it changes nothing. Inference passes the module's local binder
 * names plus the enclosing top-level group: the only bindings that can be
 * monomorphic, or generalized under a lambda whose parameters they capture.
 */
export const generalizeOver: <A, B>(
  env: Map<A, { ty: Ty; rvars: number[]; vars: number[] } & B>,
  names: A[],
  t: Ty,
  st: St,
  widen: boolean,
) => Scheme = _curry(
  5,
  <A, B>(
    env: Map<A, { ty: Ty; rvars: number[]; vars: number[] } & B>,
    names: A[],
    t: Ty,
    st: St,
    widen: boolean,
  ) => generalizeAgainst(() => freeInNamedFrom(names, 0, env, st, emptyVarSets), t, st, widen),
);
/**
 * Bare string/number singletons widen to their base prim at generalization
 * of an unannotated binding (TypeScript `let`). Written types skip this
 * pass so `"hi"` stays `"hi"` (ADR 0081). Finite unions of lits stay precise.
 */
export const widenLits: (t: Ty) => Ty = (t: Ty) =>
  ((_v) =>
    _v._tag === "TySingleton" && _v.base === "string"
      ? tString
      : _v._tag === "TySingleton"
        ? tNumber
        : _v._tag === "TyOneOf"
          ? (({ members }) =>
              tUnion(
                map((m: Ty) => {
                  const $match = m;
                  switch ($match._tag) {
                    case "TySingleton": {
                      return m;
                    }
                    default: {
                      return widenLits(m);
                    }
                  }
                }, members),
              ))(_v)
          : _v._tag === "TyCon"
            ? (({ name, args }) => tCon(name, map(widenLits, args)))(_v)
            : _v._tag === "TyFn"
              ? (({ from: fromT, to: toT }) => tArrow(widenLits(fromT), widenLits(toT)))(_v)
              : _v._tag === "TyRecord"
                ? (({ row }) => tRecord(widenRow(row)))(_v)
                : _v._tag === "TyVar"
                  ? t
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(t);
const widenRow: (row: Row) => Row = (row: Row) => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return row;
    }
    case "RowVar": {
      return row;
    }
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return rField(label, widenLits(fieldType), widenRow(rest), optional);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
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
  (t: Ty, tmap: Map<number, Ty>, rmap: Map<number, Row>) => {
    const $match = t;
    switch ($match._tag) {
      case "TyVar": {
        const { id } = $match;
        return _Map_getOr(t, id, tmap);
      }
      case "TyCon": {
        const { name, args } = $match;
        return tCon(
          name,
          map((a: Ty) => instSub(a, tmap, rmap), args),
        );
      }
      case "TyFn": {
        const { from: fromT, to: toT } = $match;
        return tArrow(instSub(fromT, tmap, rmap), instSub(toT, tmap, rmap));
      }
      case "TyRecord": {
        const { row } = $match;
        return tRecord(instSubRow(row, tmap, rmap));
      }
      case "TySingleton": {
        const { base, value } = $match;
        return TySingleton(base, value);
      }
      case "TyOneOf": {
        const { members } = $match;
        return tUnion(map((m: Ty) => instSub(m, tmap, rmap), members));
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const instSubRow: _Curry<[row: Row, tmap: Map<number, Ty>, rmap: Map<number, Row>], Row> = _curry(
  3,
  (row: Row, tmap: Map<number, Ty>, rmap: Map<number, Row>) => {
    const $match = row;
    switch ($match._tag) {
      case "RowVar": {
        const { id } = $match;
        return _Map_getOr(row, id, rmap);
      }
      case "RowExtend": {
        const { label, fieldType, optional, rest } = $match;
        return rField(
          label,
          instSub(fieldType, tmap, rmap),
          instSubRow(rest, tmap, rmap),
          optional,
        );
      }
      case "RowEmpty": {
        return row;
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
export const instantiate: <A>(
  sc: { vars: number[]; rvars: number[]; ty: Ty } & A,
  st: St,
) => [Ty, St] = _curry(2, <A>(sc: { vars: number[]; rvars: number[]; ty: Ty } & A, st: St) =>
  (([tmap, st1]: [Map<number, Ty>, St]) =>
    (([rmap, st2]: [Map<number, Row>, St]) => _tuple(instSub(sc.ty, tmap, rmap), st2))(
      instRowMapFrom(sc.rvars, new Map<number, Row>(), st1),
    ))(instMapFrom(sc.vars, new Map<number, Ty>(), st)),
);
export const isUpperStart: (s: string) => boolean = (s: string) => {
  const $match = _Str_codeAt(0, s);
  switch ($match._tag) {
    case "Some": {
      const { value: c } = $match;
      return and(c >= 65, c <= 90);
    }
    case "None": {
      return false;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};

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
    ((_v) =>
      _v.length === 0
        ? _tuple([] as Ty[], vars, st)
        : _v.length >= 1
          ? (([te, ...rest]) =>
              (([t, vars1, st1]: [Ty, Map<string, Ty>, St]) =>
                (([restTs, vars2, st2]: [Ty[], Map<string, Ty>, St]) =>
                  _tuple(_Array_prepend(t, restTs), vars2, st2))(
                  typeExprListToType(rest, vars1, st1, aliases, expanding),
                ))(typeExprToType(te, vars, st, aliases, expanding)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(tes),
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
      : _Option_match(
          _Map_get(name, vars),
          () => {
            const $match = _Map_get(name, aliases);
            switch ($match._tag) {
              case "Some": {
                const { value: info } = $match;
                return (([t, st1]: [Ty, St]) => _tuple(t, vars, st1))(
                  aliasRow(name, info, [] as Ty[], st, aliases, expanding),
                );
              }
              case "None": {
                return isUpperStart(name)
                  ? _tuple(tPrim(name), vars, st)
                  : (([v, st1]: [Ty, St]) => _tuple(v, _Map_set(name, v, vars), st1))(freshVar(st));
              }
              default: {
                throw new Error("non-exhaustive match");
              }
            }
          },
          (v) => _tuple(v, vars, st),
        ),
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
  ) => {
    const $match = te;
    switch ($match._tag) {
      case "TyArrow": {
        const { from: fromTe, to: toTe } = $match;
        return (([fromT, vars1, st1]: [Ty, Map<string, Ty>, St]) =>
          (([toT, vars2, st2]: [Ty, Map<string, Ty>, St]) =>
            _tuple(tArrow(fromT, toT), vars2, st2))(
            typeExprToType(toTe, vars1, st1, aliases, expanding),
          ))(typeExprToType(fromTe, vars, st, aliases, expanding));
      }
      case "TyApp": {
        const { ctor, args: argTes } = $match;
        return (([args, vars1, st1]: [Ty[], Map<string, Ty>, St]) => {
          const $match$ = _Map_get(ctor, aliases);
          switch ($match$._tag) {
            case "Some": {
              const { value: info } = $match$;
              return (([t, st2]: [Ty, St]) => _tuple(t, vars1, st2))(
                aliasRow(ctor, info, args, st1, aliases, expanding),
              );
            }
            case "None": {
              return _tuple(tCon(ctor, args), vars1, st1);
            }
            default: {
              throw new Error("non-exhaustive match");
            }
          }
        })(typeExprListToType(argTes, vars, st, aliases, expanding));
      }
      case "TyTuple": {
        const { elems: elemTes } = $match;
        return (([elems, vars1, st1]: [Ty[], Map<string, Ty>, St]) =>
          _tuple(tTuple(elems), vars1, st1))(
          typeExprListToType(elemTes, vars, st, aliases, expanding),
        );
      }
      case "TyList": {
        const { elem: elemTe } = $match;
        return (([elemT, vars1, st1]: [Ty, Map<string, Ty>, St]) =>
          _tuple(tCon("Array", [elemT]), vars1, st1))(
          typeExprToType(elemTe, vars, st, aliases, expanding),
        );
      }
      case "TyName": {
        const { name } = $match;
        return typeExprName(name, vars, st, aliases, expanding);
      }
      case "TyQual": {
        const { alias, name, args: argTes } = $match;
        return (([args, vars1, st1]: [Ty[], Map<string, Ty>, St]) => {
          const $match$ = _Map_get(`${alias}.${name}`, aliases);
          switch ($match$._tag) {
            case "Some": {
              const { value: info } = $match$;
              return (([t, st2]: [Ty, St]) => _tuple(t, vars1, st2))(
                aliasRow(name, info, args, st1, aliases, expanding),
              );
            }
            case "None": {
              return _tuple(tCon(name, args), vars1, st1);
            }
            default: {
              throw new Error("non-exhaustive match");
            }
          }
        })(typeExprListToType(argTes, vars, st, aliases, expanding));
      }
      case "TyLit": {
        const { value } = $match;
        return _tuple(tLit(value), vars, st);
      }
      case "TyUnion": {
        const { members } = $match;
        return (([ts, vars1, st1]: [Ty[], Map<string, Ty>, St]) => _tuple(tUnion(ts), vars1, st1))(
          typeExprListToType(members, vars, st, aliases, expanding),
        );
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
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
          ((_v) =>
            _v.length >= 1
              ? (([a, ...restArgs]) =>
                  (([restMap, st1]: [Map<A, Ty>, St]) => _tuple(_Map_set(p, a, restMap), st1))(
                    aliasLocalVarsFrom(restParams, restArgs, st),
                  ))(_v)
              : _v.length === 0
                ? (([v, st1]: [Ty, St]) =>
                    (([restMap, st2]: [Map<A, Ty>, St]) => _tuple(_Map_set(p, v, restMap), st2))(
                      aliasLocalVarsFrom(restParams, [] as Ty[], st1),
                    ))(freshVar(st))
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(args),
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
    ((_v) =>
      _v.length === 0
        ? _tuple(RowEmpty as Row, st)
        : _v.length >= 1
          ? (([fld, ...rest]) =>
              (([ft, vars1, st1]: [Ty, Map<string, Ty>, St]) =>
                (([restRow, st2]: [Row, St]) =>
                  _tuple(rField(fld.name, ft, restRow, fld.optional), st2))(
                  aliasFieldsFrom(rest, vars1, st1, aliases, expanding),
                ))(typeExprToType(fld.fieldType, vars, st, aliases, expanding)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(fields),
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
      : _Option_match(
          info.expr,
          () =>
            (([local, st1]: [Map<string, Ty>, St]) => {
              const next: Set<string> = _Set_add(name, expanding);
              return (([row, st2]: [Row, St]) => _tuple(tRecord(row), st2))(
                aliasFieldsFrom(info.fields, local, st1, aliases, next),
              );
            })(aliasLocalVarsFrom(info.params, args, st)),
          (te) =>
            (([local, st1]: [Map<string, Ty>, St]) =>
              (([t, , st2]: [Ty, Map<string, Ty>, St]) => _tuple(t, st2))(
                typeExprToType(te, local, st1, aliases, _Set_add(name, expanding)),
              ))(aliasLocalVarsFrom(info.params, args, st)),
        ),
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
    ((_v) =>
      _v.length === 0
        ? _tuple(result, st)
        : _v.length >= 1
          ? (([fld, ...rest]) =>
              (([ft, , st1]: [Ty, Map<string, Ty>, St]) =>
                (([restT, st2]: [Ty, St]) => _tuple(tArrow(ft, restT), st2))(
                  ctorFieldsArrowFrom(rest, pvars, st1, aliases, result),
                ))(
                typeExprToType(fld.fieldType, pvars, st, aliases, _Set_fromArray([] as string[])),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(fields),
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
const matchTysFrom: _Curry<
  [tpls: Ty[], actuals: Ty[], params: Set<number>, binds: Map<number, Ty>, i: number],
  Option<Map<number, Ty>>
> = _curry(5, (tpls: Ty[], actuals: Ty[], params: Set<number>, binds: Map<number, Ty>, i: number) =>
  ((_v) =>
    _v[0]._tag === "Some" && _v[1]._tag === "Some"
      ? (([{ value: tpl }, { value: actual }]) =>
          _Option_flatMap(
            (b: Map<number, Ty>) => matchTysFrom(tpls, actuals, params, b, i + 1),
            matchTy(tpl, actual, params, binds),
          ))(
          _v as [
            Extract<[Option<Ty>, Option<Ty>][0], { _tag: "Some" }>,
            Extract<[Option<Ty>, Option<Ty>][1], { _tag: "Some" }>,
          ],
        )
      : (Some(binds) as Option<Map<number, Ty>>))(
    _tuple(_Array_get(i, tpls), _Array_get(i, actuals)),
  ),
);
/**
 * A closed row's fields; `None` for an open one, which never folds.
 */
const closedFieldsOf: _Curry<
  [row: Row, acc: { label: string; fieldType: Ty; optional: boolean }[]],
  Option<{ label: string; fieldType: Ty; optional: boolean }[]>
> = _curry(2, (row: Row, acc: { label: string; fieldType: Ty; optional: boolean }[]) => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return Some(acc) as Option<{ label: string; fieldType: Ty; optional: boolean }[]>;
    }
    case "RowVar": {
      return None as Option<{ label: string; fieldType: Ty; optional: boolean }[]>;
    }
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return closedFieldsOf(
        rest,
        _Array_append({ label: label, fieldType: fieldType, optional: optional }, acc),
      );
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
const matchFieldsFrom: _Curry<
  [
    tpls: { label: string; optional: boolean; fieldType: Ty }[],
    actuals: { label: string; optional: boolean; fieldType: Ty }[],
    params: Set<number>,
    binds: Map<number, Ty>,
    i: number,
  ],
  Option<Map<number, Ty>>
> = _curry(
  5,
  (
    tpls: { label: string; optional: boolean; fieldType: Ty }[],
    actuals: { label: string; optional: boolean; fieldType: Ty }[],
    params: Set<number>,
    binds: Map<number, Ty>,
    i: number,
  ) => {
    const $match = _Array_get(i, tpls);
    switch ($match._tag) {
      case "None": {
        return Some(binds) as Option<Map<number, Ty>>;
      }
      case "Some": {
        const { value: t } = $match;
        const $match$ = _Array_find(
          (a: { label: string; optional: boolean; fieldType: Ty }) => eq(a.label, t.label),
          actuals,
        );
        switch ($match$._tag) {
          case "Some": {
            const { value: a } = $match$;
            return eq(a.optional, t.optional)
              ? _Option_flatMap(
                  (b: Map<number, Ty>) => matchFieldsFrom(tpls, actuals, params, b, i + 1),
                  matchTy(t.fieldType, a.fieldType, params, binds),
                )
              : (None as Option<Map<number, Ty>>);
          }
          case "None": {
            return None as Option<Map<number, Ty>>;
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
/**
 * Does `actual` fit the template `tpl`? A var in `params` binds, and a repeat
 * must agree; a record matches only closed, with the same labels.
 */
const matchTy: _Curry<
  [tpl: Ty, actual: Ty, params: Set<number>, binds: Map<number, Ty>],
  Option<Map<number, Ty>>
> = _curry(4, (tpl: Ty, actual: Ty, params: Set<number>, binds: Map<number, Ty>) =>
  ((_v) =>
    _v[0]._tag === "TyVar" &&
    (([{ id }]) => _Set_has(id, params))(
      _v as [Extract<[Ty, Ty][0], { _tag: "TyVar" }>, [Ty, Ty][1]],
    )
      ? (([{ id }]) =>
          _Option_match(
            _Map_get(id, binds),
            () => Some(_Map_set(id, actual, binds)) as Option<Map<number, Ty>>,
            (prev) =>
              eq(Types.showType(prev), Types.showType(actual))
                ? (Some(binds) as Option<Map<number, Ty>>)
                : (None as Option<Map<number, Ty>>),
          ))(_v as [Extract<[Ty, Ty][0], { _tag: "TyVar" }>, [Ty, Ty][1]])
      : _v[0]._tag === "TyVar" && _v[1]._tag === "TyVar"
        ? (([{ id: a }, { id: b }]) =>
            eq(a, b)
              ? (Some(binds) as Option<Map<number, Ty>>)
              : (None as Option<Map<number, Ty>>))(
            _v as [
              Extract<[Ty, Ty][0], { _tag: "TyVar" }>,
              Extract<[Ty, Ty][1], { _tag: "TyVar" }>,
            ],
          )
        : _v[0]._tag === "TyCon" && _v[1]._tag === "TyCon"
          ? (([{ name: n, args: targs }, { name: m, args: aargs }]) =>
              and(eq(n, m), eq(length(targs), length(aargs)))
                ? matchTysFrom(targs, aargs, params, binds, 0)
                : (None as Option<Map<number, Ty>>))(
              _v as [
                Extract<[Ty, Ty][0], { _tag: "TyCon" }>,
                Extract<[Ty, Ty][1], { _tag: "TyCon" }>,
              ],
            )
          : _v[0]._tag === "TyFn" && _v[1]._tag === "TyFn"
            ? (([{ from: tf, to: tt }, { from: af, to: at }]) =>
                _Option_flatMap(
                  (b: Map<number, Ty>) => matchTy(tt, at, params, b),
                  matchTy(tf, af, params, binds),
                ))(
                _v as [
                  Extract<[Ty, Ty][0], { _tag: "TyFn" }>,
                  Extract<[Ty, Ty][1], { _tag: "TyFn" }>,
                ],
              )
            : _v[0]._tag === "TyRecord" && _v[1]._tag === "TyRecord"
              ? (([{ row: trow }, { row: arow }]) =>
                  ((_v) =>
                    _v[0]._tag === "Some" && _v[1]._tag === "Some"
                      ? (([{ value: tfs }, { value: afs }]) =>
                          eq(length(tfs), length(afs))
                            ? matchFieldsFrom(tfs, afs, params, binds, 0)
                            : (None as Option<Map<number, Ty>>))(
                          _v as [
                            Extract<
                              [
                                Option<{ label: string; fieldType: Ty; optional: boolean }[]>,
                                Option<{ label: string; fieldType: Ty; optional: boolean }[]>,
                              ][0],
                              { _tag: "Some" }
                            >,
                            Extract<
                              [
                                Option<{ label: string; fieldType: Ty; optional: boolean }[]>,
                                Option<{ label: string; fieldType: Ty; optional: boolean }[]>,
                              ][1],
                              { _tag: "Some" }
                            >,
                          ],
                        )
                      : (None as Option<Map<number, Ty>>))(
                    _tuple(
                      closedFieldsOf(
                        trow,
                        [] as { label: string; fieldType: Ty; optional: boolean }[],
                      ),
                      closedFieldsOf(
                        arow,
                        [] as { label: string; fieldType: Ty; optional: boolean }[],
                      ),
                    ),
                  ))(
                  _v as [
                    Extract<[Ty, Ty][0], { _tag: "TyRecord" }>,
                    Extract<[Ty, Ty][1], { _tag: "TyRecord" }>,
                  ],
                )
              : _v[0]._tag === "TySingleton" && _v[1]._tag === "TySingleton"
                ? (([{ base: tb, value: tv }, { base: ab, value: av }]) =>
                    and(eq(tb, ab), eq(tv, av))
                      ? (Some(binds) as Option<Map<number, Ty>>)
                      : (None as Option<Map<number, Ty>>))(
                    _v as [
                      Extract<[Ty, Ty][0], { _tag: "TySingleton" }>,
                      Extract<[Ty, Ty][1], { _tag: "TySingleton" }>,
                    ],
                  )
                : _v[0]._tag === "TyOneOf" && _v[1]._tag === "TyOneOf"
                  ? eq(Types.showType(tpl), Types.showType(actual))
                    ? (Some(binds) as Option<Map<number, Ty>>)
                    : (None as Option<Map<number, Ty>>)
                  : (None as Option<Map<number, Ty>>))(_tuple(tpl, actual)),
);
const templateRowFrom: _Curry<
  [fields: AliasField[], vars: Map<string, Ty>, aliases: Map<string, AliasInfo>, i: number],
  Row
> = _curry(
  4,
  (fields: AliasField[], vars: Map<string, Ty>, aliases: Map<string, AliasInfo>, i: number) => {
    const $match = _Array_get(i, fields);
    switch ($match._tag) {
      case "None": {
        return RowEmpty as Row;
      }
      case "Some": {
        const { value: f } = $match;
        return (([t, _vars, _st]: [Ty, Map<string, Ty>, St]) =>
          RowExtend(f.name, t, f.optional, templateRowFrom(fields, vars, aliases, i + 1)))(
          typeExprToType(f.fieldType, vars, Types.mkSt(0), aliases, _Set_fromArray([] as string[])),
        );
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
/**
 * Template ids sit far below the inferrer's (which start at 1000), so a
 * template var never collides with a var of the type it is matched against.
 */
const templateVars: <A>(params: A[]) => [Map<A, Ty>, number[]] = <A>(params: A[]) =>
  reduce(
    _curry(2, ([vs, ids]: [Map<A, Ty>, number[]], p: A) => {
      const id: number = -1000000 - length(ids);
      return _tuple(_Map_set(p, TyVar(id), vs), _Array_append(id, ids));
    }),
    _tuple(new Map<A, Ty>(), [] as number[]),
    params,
  );
const allBound: _Curry<[ids: number[], binds: Map<number, Ty>], boolean> = _curry(
  2,
  (ids: number[], binds: Map<number, Ty>) =>
    length(filter((id: number) => !_Map_has(id, binds), ids)) === 0,
);
const bareAliasName: (key: string) => string = (key: string) => {
  const parts: string[] = _Str_split(".", key);
  return _Option_unwrapOr(key, _Array_get(length(parts) - 1, parts));
};
const foldingAliasFrom: _Curry<
  [t: Ty, keys: string[], aliases: Map<string, AliasInfo>, i: number],
  Option<string>
> = _curry(4, (t: Ty, keys: string[], aliases: Map<string, AliasInfo>, i: number) => {
  const $match = _Array_get(i, keys);
  switch ($match._tag) {
    case "None": {
      return None as Option<string>;
    }
    case "Some": {
      const { value: key } = $match;
      const next: () => Option<string> = () => foldingAliasFrom(t, keys, aliases, i + 1);
      const $match$ = _Map_get(key, aliases);
      switch ($match$._tag) {
        case "Some": {
          const { value: info } = $match$;
          const $match$$ = info.expr;
          switch ($match$$._tag) {
            case "Some": {
              return next();
            }
            case "None": {
              return (([vars, ids]: [Map<string, Ty>, number[]]) => {
                const tpl: Ty = TyRecord(templateRowFrom(info.fields, vars, aliases, 0));
                const $match$$$ = matchTy(tpl, t, _Set_fromArray(ids), new Map<number, Ty>());
                switch ($match$$$._tag) {
                  case "Some": {
                    const { value: binds } = $match$$$;
                    return allBound(ids, binds)
                      ? (Some(bareAliasName(key)) as Option<string>)
                      : next();
                  }
                  case "None": {
                    return next();
                  }
                  default: {
                    throw new Error("non-exhaustive match");
                  }
                }
              })(templateVars(info.params));
            }
            default: {
              throw new Error("non-exhaustive match");
            }
          }
        }
        case "None": {
          return next();
        }
        default: {
          throw new Error("non-exhaustive match");
        }
      }
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
/**
 * The declared type a recorded type names, for go-to-type: a capitalised
 * constructor head, or the first record alias (in declaration order) whose
 * closed row it fits once literals widen. A phantom alias param cannot be
 * named from the row, so that alias is skipped, as in src/ast/types.ts.
 */
export const nominalTypeName: _Curry<
  [t: Ty, aliases: Map<string, AliasInfo>],
  Option<string>
> = _curry(2, (t: Ty, aliases: Map<string, AliasInfo>) => {
  const $match = widenLits(t);
  switch ($match._tag) {
    case "TyCon": {
      const { name } = $match;
      return isUpperStart(name) ? (Some(name) as Option<string>) : (None as Option<string>);
    }
    case "TyRecord": {
      const { row } = $match;
      return foldingAliasFrom(TyRecord(row), _Map_keys(aliases), aliases, 0);
    }
    default: {
      return None as Option<string>;
    }
  }
});

const foldTemplatesFrom: _Curry<
  [keys: string[], aliases: Map<string, AliasInfo>, i: number, acc: FoldTemplate[]],
  FoldTemplate[]
> = _curry(4, (keys: string[], aliases: Map<string, AliasInfo>, i: number, acc: FoldTemplate[]) => {
  const $match = _Array_get(i, keys);
  switch ($match._tag) {
    case "None": {
      return acc;
    }
    case "Some": {
      const { value: key } = $match;
      const $match$ = _Map_get(key, aliases);
      switch ($match$._tag) {
        case "None": {
          return foldTemplatesFrom(keys, aliases, i + 1, acc);
        }
        case "Some": {
          const { value: info } = $match$;
          return (([_vars, ids]: [Map<string, Ty>, number[]]) => {
            const name: string = bareAliasName(key);
            return (([tpl, _st]: [Ty, St]) =>
              foldTemplatesFrom(
                keys,
                aliases,
                i + 1,
                _Array_append({ name: name, ids: ids, tpl: tpl }, acc),
              ))(
              aliasRow(
                name,
                info,
                map((id: number) => TyVar(id), ids),
                Types.mkSt(0),
                aliases,
                _Set_fromArray([] as string[]),
              ),
            );
          })(templateVars(info.params));
        }
        default: {
          throw new Error("non-exhaustive match");
        }
      }
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
/**
 * The first template (declaration order) `t` fits, as the alias name and its
 * arguments. A phantom param cannot be read off `t`, so that alias is skipped.
 */
const foldHeadFrom: _Curry<
  [t: Ty, tpls: FoldTemplate[], i: number],
  Option<[string, Ty[]]>
> = _curry(3, (t: Ty, tpls: FoldTemplate[], i: number) => {
  const $match = _Array_get(i, tpls);
  switch ($match._tag) {
    case "None": {
      return None as Option<[string, Ty[]]>;
    }
    case "Some": {
      const { value: a } = $match;
      const $match$ = matchTy(a.tpl, t, _Set_fromArray(a.ids), new Map<number, Ty>());
      switch ($match$._tag) {
        case "Some": {
          const { value: binds } = $match$;
          return allBound(a.ids, binds)
            ? (Some(
                _tuple(
                  a.name,
                  map((id: number) => _Map_getOr(t, id, binds), a.ids),
                ),
              ) as Option<[string, Ty[]]>)
            : foldHeadFrom(t, tpls, i + 1);
        }
        case "None": {
          return foldHeadFrom(t, tpls, i + 1);
        }
        default: {
          throw new Error("non-exhaustive match");
        }
      }
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
/**
 * Top-down: a node is tried whole first, then its children fold too.
 */
const foldWith: _Curry<[t: Ty, tpls: FoldTemplate[]], Ty> = _curry(
  2,
  (t: Ty, tpls: FoldTemplate[]) =>
    ((_v) =>
      _v._tag === "Some"
        ? (({ value: [name, args] }) =>
            tCon(
              name,
              map((a: Ty) => foldWith(a, tpls), args),
            ))(_v as Extract<Option<[string, Ty[]]>, { _tag: "Some" }>)
        : _v._tag === "None"
          ? ((_v) =>
              _v._tag === "TyCon"
                ? (({ name, args }) =>
                    tCon(
                      name,
                      map((a: Ty) => foldWith(a, tpls), args),
                    ))(_v)
                : _v._tag === "TyFn"
                  ? (({ from: fromT, to: toT }) =>
                      tArrow(foldWith(fromT, tpls), foldWith(toT, tpls)))(_v)
                  : _v._tag === "TyRecord"
                    ? (({ row }) => tRecord(foldRowWith(row, tpls)))(_v)
                    : _v._tag === "TyOneOf"
                      ? (({ members }) => tUnion(map((m: Ty) => foldWith(m, tpls), members)))(_v)
                      : t)(t)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(foldHeadFrom(t, tpls, 0)),
);
const foldRowWith: _Curry<[row: Row, tpls: FoldTemplate[]], Row> = _curry(
  2,
  (row: Row, tpls: FoldTemplate[]) => {
    const $match = row;
    switch ($match._tag) {
      case "RowExtend": {
        const { label, fieldType, optional, rest } = $match;
        return RowExtend(label, foldWith(fieldType, tpls), optional, foldRowWith(rest, tpls));
      }
      default: {
        return row;
      }
    }
  },
);
/**
 * `t` with every node that fits an alias rewritten to `Name<args>`. Fold
 * before widening literals, as hover does: a literal fits no primitive.
 */
export const foldAliases: _Curry<[t: Ty, aliases: Map<string, AliasInfo>], Ty> = _curry(
  2,
  (t: Ty, aliases: Map<string, AliasInfo>) => foldAliasesAt(t, _Map_keys(aliases), aliases),
);
/**
 * `foldAliases` over only the aliases `keys` names, tried in that order. The
 * `.d.ts` writer passes the file's own aliases in declaration order, so a
 * dependency's alias stays structural (ADR 0092).
 */
export const foldAliasesAt: _Curry<[t: Ty, keys: string[], aliases: Map<string, AliasInfo>], Ty> =
  _curry(3, (t: Ty, keys: string[], aliases: Map<string, AliasInfo>) =>
    foldWith(t, foldTemplatesFrom(keys, aliases, 0, [] as FoldTemplate[])),
  );
