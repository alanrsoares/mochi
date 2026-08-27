import { match } from "@onrails/pattern";

const _curry = (n, f) => function c(...a) {
  if (a.length < n)
    return (...b) => c(...a, ...b);
  if (a.length === n)
    return f(...a);
  return a.slice(n).reduce((g, x) => g(x), f(...a.slice(0, n)));
};
const Some = (value) => ({ _tag: "Some", value });
const None = { _tag: "None" };
const eq = _curry(2, (x, y) => {
  if (x === y)
    return true;
  if (typeof x !== "object" || x === null || typeof y !== "object" || y === null)
    return false;
  const ax = Array.isArray(x);
  if (ax !== Array.isArray(y))
    return false;
  if (ax) {
    if (x.length !== y.length)
      return false;
    for (let i = 0;i < x.length; i++)
      if (!eq(x[i], y[i]))
        return false;
    return true;
  }
  if (x instanceof Map || y instanceof Map) {
    if (!(x instanceof Map) || !(y instanceof Map))
      return false;
    if (x.size !== y.size)
      return false;
    for (const [k, v] of x) {
      if (!y.has(k) || !eq(v, y.get(k)))
        return false;
    }
    return true;
  }
  if (x instanceof Set || y instanceof Set) {
    if (!(x instanceof Set) || !(y instanceof Set))
      return false;
    if (x.size !== y.size)
      return false;
    for (const v of x)
      if (!y.has(v))
        return false;
    return true;
  }
  if (typeof x[Symbol.iterator] === "function" || typeof y[Symbol.iterator] === "function")
    throw new TypeError("eq on List: force it first with List.toArray");
  const kx = Object.keys(x), ky = Object.keys(y);
  if (kx.length !== ky.length)
    return false;
  for (const k of kx)
    if (!eq(x[k], y[k]))
      return false;
  return true;
});
const gte = _curry(2, (a, b) => a >= b);
const lte = _curry(2, (a, b) => a <= b);
const and = _curry(2, (a, b) => a && b);
const map = _curry(2, (f, xs) => xs.map((x) => f(x)));
const _Set_has = _curry(2, (x, s) => s.has(x));
const _Set_add = _curry(2, (x, s) => new Set(s).add(x));
const _Set_toArray = (s) => [...s];
const _Set_fromArray = (xs) => new Set(xs);
const _Set_union = _curry(2, (a, b) => new Set([...a, ...b]));
const _Set_diff = _curry(2, (a, b) => new Set([...a].filter((x) => !b.has(x))));
const _Map_getOr = _curry(3, (d, k, m) => m.has(k) ? m.get(k) : d);
const _Map_set = _curry(3, (k, v, m) => {
  const n = new Map(m);
  n.set(k, v);
  return n;
});
const _Map_values = (m) => [...m.values()];
const _Map_get = _curry(2, (k, m) => m.has(k) ? Some(m.get(k)) : None);
const _Array_prepend = _curry(2, (x, xs) => [x, ...xs]);
const _Array_contains = _curry(2, (x, xs) => xs.some((y) => eq(x, y)));
const _Str_codeAt = _curry(2, (i, s) => i >= 0 && i < s.length ? Some(s.charCodeAt(i)) : None);

import * as Ast from "./ast.js";
import { TyVar, TyCon, TyFn, TyRecord, TySingleton, TyOneOf, RowEmpty, RowVar, RowExtend, tCon, tArrow, tRecord, tPrim, tTuple, tLit, tUnion, rExtend, freshVar, freshRowVar, zonk, resolve } from "./types.js";
import { primTypeNames } from "./ctors.js";
export const mono = (t) => ({ vars: [], rvars: [], ty: t });
export const tNumber = tPrim("number");
export const tBool = tPrim("bool");
export const tString = tPrim("string");
export const primType = (name) => match(name)
  .with("float", () => tNumber)
  .with("int", () => tNumber)
  .with("string", () => tString)
  .with("bool", () => tBool)
  .otherwise(() => tPrim(name));

export const emptyVarSets = { tv: _Set_fromArray([]), rv: _Set_fromArray([]) };
const unionVarSets = _curry(2, (a, b) => ({ tv: _Set_union(a.tv, b.tv), rv: _Set_union(a.rv, b.rv) }));
const diffVarSets = _curry(2, (a, b) => ({ tv: _Set_diff(a.tv, b.tv), rv: _Set_diff(a.rv, b.rv) }));
export const collect = _curry(2, (t, acc) => match(t)
  .with({ _tag: "TyVar" }, ({ id }) => ({ tv: _Set_add(id, acc.tv), rv: acc.rv }))
  .with({ _tag: "TyCon" }, ({ args }) => collectArgs(args, acc))
  .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => collect(toT, collect(fromT, acc)))
  .with({ _tag: "TyRecord" }, ({ row }) => collectRow(row, acc))
  .with({ _tag: "TySingleton" }, () => acc)
  .with({ _tag: "TyOneOf" }, ({ members }) => collectArgs(members, acc))
  .exhaustive());
const collectArgs = _curry(2, (args, acc) => match(args)
  .with((_v) => _v.length === 0, () => acc)
  .with((_v) => _v.length >= 1, ([a, ...rest]) => collectArgs(rest, collect(a, acc)))
  .exhaustive());
const collectRow = _curry(2, (row, acc) => match(row)
  .with({ _tag: "RowVar" }, ({ id }) => ({ tv: acc.tv, rv: _Set_add(id, acc.rv) }))
  .with({ _tag: "RowExtend" }, ({ fieldType, rest }) => collectRow(rest, collect(fieldType, acc)))
  .with({ _tag: "RowEmpty" }, () => acc)
  .exhaustive());
export const freeInType = (t) => collect(t, emptyVarSets);
const freeInScheme = (sc) => { const f = freeInType(sc.ty); return diffVarSets(f, { tv: _Set_fromArray(sc.vars), rv: _Set_fromArray(sc.rvars) }); };
const freeInEnvFrom = _curry(2, (schemes, acc) => match(schemes)
  .with((_v) => _v.length === 0, () => acc)
  .with((_v) => _v.length >= 1, ([sc, ...rest]) => freeInEnvFrom(rest, unionVarSets(acc, freeInScheme(sc))))
  .exhaustive());
const freeInEnv = (env) => freeInEnvFrom(_Map_values(env), emptyVarSets);
export const generalize = _curry(4, (env, t, st, widen) => { const zt = (widen ? widenLits(zonk(t, st)) : zonk(t, st)); const free = diffVarSets(freeInType(zt), freeInEnv(env)); return { vars: _Set_toArray(free.tv), rvars: _Set_toArray(free.rv), ty: zt }; });
export const widenLits = (t) => match(t)
  .with({ _tag: "TySingleton", base: "string" }, () => tString)
  .with({ _tag: "TySingleton" }, () => tNumber)
  .with({ _tag: "TyOneOf" }, ({ members }) => tUnion(map((m) => match(m)
  .with({ _tag: "TySingleton" }, () => m)
  .otherwise(() => widenLits(m)))(members)))
  .with({ _tag: "TyCon" }, ({ name, args }) => tCon(name, map(widenLits)(args)))
  .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tArrow(widenLits(fromT), widenLits(toT)))
  .with({ _tag: "TyRecord" }, ({ row }) => tRecord(widenRow(row)))
  .with({ _tag: "TyVar" }, () => t)
  .exhaustive();
const widenRow = (row) => match(row)
  .with({ _tag: "RowEmpty" }, () => row)
  .with({ _tag: "RowVar" }, () => row)
  .with({ _tag: "RowExtend" }, ({ label, fieldType, rest }) => rExtend(label, widenLits(fieldType), widenRow(rest)))
  .exhaustive();
const instMapFrom = _curry(3, (vars, acc, st) => match(vars)
  .with((_v) => _v.length === 0, () => [acc, st])
  .with((_v) => _v.length >= 1, ([v, ...rest]) => (([fv, st1]) => instMapFrom(rest, _Map_set(v, fv, acc), st1))(freshVar(st)))
  .exhaustive());
const instRowMapFrom = _curry(3, (vars, acc, st) => match(vars)
  .with((_v) => _v.length === 0, () => [acc, st])
  .with((_v) => _v.length >= 1, ([v, ...rest]) => (([fr, st1]) => instRowMapFrom(rest, _Map_set(v, fr, acc), st1))(freshRowVar(st)))
  .exhaustive());
const instSub = _curry(3, (t, tmap, rmap) => match(t)
  .with({ _tag: "TyVar" }, ({ id }) => _Map_getOr(t, id, tmap))
  .with({ _tag: "TyCon" }, ({ name, args }) => tCon(name, map((a) => instSub(a, tmap, rmap))(args)))
  .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tArrow(instSub(fromT, tmap, rmap), instSub(toT, tmap, rmap)))
  .with({ _tag: "TyRecord" }, ({ row }) => tRecord(instSubRow(row, tmap, rmap)))
  .with({ _tag: "TySingleton" }, ({ base, value }) => TySingleton(base, value))
  .with({ _tag: "TyOneOf" }, ({ members }) => tUnion(map((m) => instSub(m, tmap, rmap))(members)))
  .exhaustive());
const instSubRow = _curry(3, (row, tmap, rmap) => match(row)
  .with({ _tag: "RowVar" }, ({ id }) => _Map_getOr(row, id, rmap))
  .with({ _tag: "RowExtend" }, ({ label, fieldType, rest }) => rExtend(label, instSub(fieldType, tmap, rmap), instSubRow(rest, tmap, rmap)))
  .with({ _tag: "RowEmpty" }, () => row)
  .exhaustive());
export const instantiate = _curry(2, (sc, st) => (([tmap, st1]) => (([rmap, st2]) => [instSub(sc.ty, tmap, rmap), st2])(instRowMapFrom(sc.rvars, new Map([]), st1)))(instMapFrom(sc.vars, new Map([]), st)));
export const isUpperStart = (s) => match(_Str_codeAt(0, s))
  .with({ _tag: "Some" }, ({ value: c }) => and(gte(c, 65), lte(c, 90)))
  .with({ _tag: "None" }, () => false)
  .exhaustive();

export const typeExprListToType = _curry(5, (tes, vars, st, aliases, expanding) => match(tes)
  .with((_v) => _v.length === 0, () => [[], vars, st])
  .with((_v) => _v.length >= 1, ([te, ...rest]) => (([t, vars1, st1]) => (([restTs, vars2, st2]) => [_Array_prepend(t, restTs), vars2, st2])(typeExprListToType(rest, vars1, st1, aliases, expanding)))(typeExprToType(te, vars, st, aliases, expanding)))
  .exhaustive());
export const typeExprName = _curry(5, (name, vars, st, aliases, expanding) => (_Array_contains(name, primTypeNames) ? [primType(name), vars, st] : match(_Map_get(name, vars))
  .with({ _tag: "Some" }, ({ value: v }) => [v, vars, st])
  .with({ _tag: "None" }, () => match(_Map_get(name, aliases))
  .with({ _tag: "Some" }, ({ value: info }) => (([t, st1]) => [t, vars, st1])(aliasRow(name, info, [], st, aliases, expanding)))
  .with({ _tag: "None" }, () => (isUpperStart(name) ? [tPrim(name), vars, st] : (([v, st1]) => [v, _Map_set(name, v, vars), st1])(freshVar(st))))
  .exhaustive())
  .exhaustive()));
export const typeExprToType = _curry(5, (te, vars, st, aliases, expanding) => match(te)
  .with({ _tag: "TyArrow" }, ({ from: fromTe, to: toTe }) => (([fromT, vars1, st1]) => (([toT, vars2, st2]) => [tArrow(fromT, toT), vars2, st2])(typeExprToType(toTe, vars1, st1, aliases, expanding)))(typeExprToType(fromTe, vars, st, aliases, expanding)))
  .with({ _tag: "TyApp" }, ({ ctor, args: argTes }) => (([args, vars1, st1]) => match(_Map_get(ctor, aliases))
  .with({ _tag: "Some" }, ({ value: info }) => (([t, st2]) => [t, vars1, st2])(aliasRow(ctor, info, args, st1, aliases, expanding)))
  .with({ _tag: "None" }, () => [tCon(ctor, args), vars1, st1])
  .exhaustive())(typeExprListToType(argTes, vars, st, aliases, expanding)))
  .with({ _tag: "TyTuple" }, ({ elems: elemTes }) => (([elems, vars1, st1]) => [tTuple(elems), vars1, st1])(typeExprListToType(elemTes, vars, st, aliases, expanding)))
  .with({ _tag: "TyList" }, ({ elem: elemTe }) => (([elemT, vars1, st1]) => [tCon("Array", [elemT]), vars1, st1])(typeExprToType(elemTe, vars, st, aliases, expanding)))
  .with({ _tag: "TyName" }, ({ name }) => typeExprName(name, vars, st, aliases, expanding))
  .with({ _tag: "TyQual" }, ({ alias, name, args: argTes }) => (([args, vars1, st1]) => match(_Map_get(`${alias}.${name}`, aliases))
  .with({ _tag: "Some" }, ({ value: info }) => (([t, st2]) => [t, vars1, st2])(aliasRow(name, info, args, st1, aliases, expanding)))
  .with({ _tag: "None" }, () => [tCon(name, args), vars1, st1])
  .exhaustive())(typeExprListToType(argTes, vars, st, aliases, expanding)))
  .with({ _tag: "TyLit" }, ({ value }) => [tLit(value), vars, st])
  .with({ _tag: "TyUnion" }, ({ members }) => (([ts, vars1, st1]) => [tUnion(ts), vars1, st1])(typeExprListToType(members, vars, st, aliases, expanding)))
  .exhaustive());
const aliasLocalVarsFrom = _curry(3, (params, args, st) => match(params)
  .with((_v) => _v.length === 0, () => [new Map([]), st])
  .with((_v) => _v.length >= 1, ([p, ...restParams]) => match(args)
  .with((_v) => _v.length >= 1, ([a, ...restArgs]) => (([restMap, st1]) => [_Map_set(p, a, restMap), st1])(aliasLocalVarsFrom(restParams, restArgs, st)))
  .with((_v) => _v.length === 0, () => (([v, st1]) => (([restMap, st2]) => [_Map_set(p, v, restMap), st2])(aliasLocalVarsFrom(restParams, [], st1)))(freshVar(st)))
  .exhaustive())
  .exhaustive());
const aliasFieldsFrom = _curry(5, (fields, vars, st, aliases, expanding) => match(fields)
  .with((_v) => _v.length === 0, () => [RowEmpty, st])
  .with((_v) => _v.length >= 1, ([fld, ...rest]) => (([ft, vars1, st1]) => (([restRow, st2]) => [rExtend(fld.name, ft, restRow), st2])(aliasFieldsFrom(rest, vars1, st1, aliases, expanding)))(typeExprToType(fld.fieldType, vars, st, aliases, expanding)))
  .exhaustive());
export const aliasRow = _curry(6, (name, info, args, st, aliases, expanding) => (_Set_has(name, expanding) ? [tCon(name, args), st] : match(info.expr)
  .with({ _tag: "Some" }, ({ value: te }) => (([local, st1]) => (([t, _, st2]) => [t, st2])(typeExprToType(te, local, st1, aliases, _Set_add(name, expanding))))(aliasLocalVarsFrom(info.params, args, st)))
  .with({ _tag: "None" }, () => (([local, st1]) => { const next = _Set_add(name, expanding); return (([row, st2]) => [tRecord(row), st2])(aliasFieldsFrom(info.fields, local, st1, aliases, next)); })(aliasLocalVarsFrom(info.params, args, st)))
  .exhaustive()));
const pvarsFrom = _curry(2, (params, st) => match(params)
  .with((_v) => _v.length === 0, () => [new Map([]), [], st])
  .with((_v) => _v.length >= 1, ([p, ...rest]) => (([v, st1]) => (([restMap, restVars, st2]) => [_Map_set(p, v, restMap), _Array_prepend(v, restVars), st2])(pvarsFrom(rest, st1)))(freshVar(st)))
  .exhaustive());
const ctorFieldsArrowFrom = _curry(5, (fields, pvars, st, aliases, result) => match(fields)
  .with((_v) => _v.length === 0, () => [result, st])
  .with((_v) => _v.length >= 1, ([fld, ...rest]) => (([ft, _, st1]) => (([restT, st2]) => [tArrow(ft, restT), st2])(ctorFieldsArrowFrom(rest, pvars, st1, aliases, result)))(typeExprToType(fld.fieldType, pvars, st, aliases, _Set_fromArray([]))))
  .exhaustive());
export const ctorScheme = _curry(5, (typeName, params, c, st, aliases) => (([pvars, pvarTypes, st1]) => { const result = tCon(typeName, pvarTypes); return (([ty, st2]) => { const sets = collect(ty, emptyVarSets); return [{ vars: _Set_toArray(sets.tv), rvars: _Set_toArray(sets.rv), ty: ty }, st2]; })(ctorFieldsArrowFrom(c.fields, pvars, st1, aliases, result)); })(pvarsFrom(params, st)));
