import { match } from "@onrails/pattern";

const _curry = (n, f) => function c(...a) {
  if (a.length < n)
    return (...b) => c(...a, ...b);
  if (a.length === n)
    return f(...a);
  return a.slice(n).reduce((g, x) => g(x), f(...a.slice(0, n)));
};
const _recur = (...args) => ({
  _tag: "recur",
  args
});
const _done = (value) => ({ _tag: "done", value });
const Some = (value) => ({ _tag: "Some", value });
const None = { _tag: "None" };
const Ok = (value) => ({ _tag: "Ok", value });
const Err = (error) => ({ _tag: "Err", error });
const add = _curry(2, (a, b) => a + b);
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
const not = (b) => !b;
const and = _curry(2, (a, b) => a && b);
const map = _curry(2, (f, xs) => xs.map((x) => f(x)));
const reduce = _curry(3, (f, init, xs) => xs.reduce((acc, x) => f(acc)(x), init));
const _Set_has = _curry(2, (x, s) => s.has(x));
const _Set_add = _curry(2, (x, s) => new Set(s).add(x));
const _Set_toArray = (s) => [...s];
const _Set_fromArray = (xs) => new Set(xs);
const _Map_has = _curry(2, (k, m) => m.has(k));
const _Map_getOr = _curry(3, (d, k, m) => m.has(k) ? m.get(k) : d);
const _Map_set = _curry(3, (k, v, m) => {
  const n = new Map(m);
  n.set(k, v);
  return n;
});
const _Map_delete = _curry(2, (k, m) => {
  const n = new Map(m);
  n.delete(k);
  return n;
});
const _Map_keys = (m) => [...m.keys()];
const _Map_get = _curry(2, (k, m) => m.has(k) ? Some(m.get(k)) : None);
const _Result_map = _curry(2, (f, r) => r._tag === "Ok" ? Ok(f(r.value)) : r);
const _Result_flatMap = _curry(2, (f, r) => r._tag === "Ok" ? f(r.value) : r);
const _Array_head = (xs) => xs.length > 0 ? Some(xs[0]) : None;
const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);
const _Array_concat = _curry(2, (xs, ys) => xs.concat(ys));
const _Array_append = _curry(2, (x, xs) => [...xs, x]);
const _Array_prepend = _curry(2, (x, xs) => [x, ...xs]);
const _Array_flatMap = _curry(2, (f, xs) => xs.flatMap((x) => f(x)));

import { TyVar, TyCon, TyFn, TyRecord, RowEmpty, RowVar, RowExtend, tCon, tArrow, tRecord, tPrim, tTuple, tUnit, tLit, rVar, rExtend, showType, mkSt, freshVar, freshRowVar, resolve, zonk, occurs, unify, unifyRows } from "./types.js";
import * as Ast from "./ast.js";
const setLetBindMonad = _curry(2, ($receiver, $value) => ($receiver["monad"] = $value));
import { inferCallHooksOf, resolvePluginsDefault, runInferCallHooks } from "./extensions.js";
import { builtinDeclsFor } from "./ctors.js";
import { mono, tNumber, tBool, tString, generalize, instantiate, typeExprToType, typeExprListToType, ctorScheme, isUpperStart } from "./schemes.js";
import { stronglyConnected } from "./scc.js";
const exprSpan = (e) => match(e)
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
const patSpan = (p) => match(p)
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

const annotSpan = (t) => match(t)
  .with({ _tag: "TyName" }, ({ span: sp }) => sp)
  .with({ _tag: "TyArrow" }, ({ span: sp }) => sp)
  .with({ _tag: "TyApp" }, ({ span: sp }) => sp)
  .with({ _tag: "TyTuple" }, ({ span: sp }) => sp)
  .with({ _tag: "TyList" }, ({ span: sp }) => sp)
  .with({ _tag: "TyQual" }, ({ span: sp }) => sp)
  .with({ _tag: "TyLit" }, ({ span: sp }) => sp)
  .with({ _tag: "TyUnion" }, ({ span: sp }) => sp)
  .exhaustive();
const typeErr = _curry(2, (msg, sp) => ({ message: msg, start: sp.start, end: sp.end }));
const u = _curry(4, (a, b, st, sp) => match(unify(a, b, st))
  .with({ _tag: "Ok" }, ({ value: newSt }) => Ok(newSt))
  .with({ _tag: "Err" }, ({ error: e }) => Err(typeErr(e.message, sp)))
  .exhaustive());
const bindParamNamesFrom = _curry(3, (names, env, st) => match(names)
  .with((_v) => _v.length === 0, () => [[], env, st])
  .with((_v) => _v.length >= 1, ([n, ...rest]) => (([t, st1]) => (([restTs, env2, st2]) => [_Array_prepend(t, restTs), env2, st2])(bindParamNamesFrom(rest, _Map_set(n, mono(t), env), st1)))(freshVar(st)))
  .exhaustive());
const bindParamFieldsFrom = _curry(4, (fields, env, row, st) => match(fields)
  .with((_v) => _v.length === 0, () => [row, env, st])
  .with((_v) => _v.length >= 1, ([f, ...rest]) => (([ft, st1]) => bindParamFieldsFrom(rest, _Map_set(f, mono(ft), env), rExtend(f, ft, row), st1))(freshVar(st)))
  .exhaustive());
const bindParam = _curry(3, (p, env, st) => match(p)
  .with({ _tag: "LPName" }, ({ name }) => (([t, st1]) => [t, _Map_set(name, mono(t), env), st1])(freshVar(st)))
  .with({ _tag: "LPTuple" }, ({ names }) => (([elems, env1, st1]) => [tTuple(elems), env1, st1])(bindParamNamesFrom(names, env, st)))
  .with({ _tag: "LPRecord" }, ({ fields }) => (([rowBase, st1]) => (([row, env1, st2]) => [tRecord(row), env1, st2])(bindParamFieldsFrom(fields, env, rowBase, st1)))(freshRowVar(st)))
  .exhaustive());
const bindParamsFrom = _curry(3, (params, env, st) => match(params)
  .with((_v) => _v.length === 0, () => [[], env, st])
  .with((_v) => _v.length >= 1, ([p, ...rest]) => (([t, env1, st1]) => (([restTs, env2, st2]) => [_Array_prepend(t, restTs), env2, st2])(bindParamsFrom(rest, env1, st1)))(bindParam(p, env, st)))
  .exhaustive());
const constrainParamAnnotsFrom = _curry(5, (ctx, params, paramTypes, vars, st) => match(params)
  .with((_v) => _v.length === 0, () => Ok(st))
  .with((_v) => _v.length >= 1, ([param, ...rest]) => match(paramTypes)
  .with((_v) => _v.length === 0, () => Ok(st))
  .with((_v) => _v.length >= 1, ([paramT, ...restTypes]) => match(param)
  .with((_v) => _v._tag === "LPName" && _v.annot._tag === "Some", ({ annot: { value: te } }) => (([annotT, vars1, st1]) => _Result_flatMap((st2) => constrainParamAnnotsFrom(ctx, rest, restTypes, vars1, st2))(u(paramT, annotT, st1, annotSpan(te))))(typeExprToType(te, vars, st, ctx.aliasMap, _Set_fromArray([]))))
  .otherwise(() => constrainParamAnnotsFrom(ctx, rest, restTypes, vars, st)))
  .exhaustive())
  .exhaustive());
const arrowChain = _curry(2, (paramTypes, resultT) => match(paramTypes)
  .with((_v) => _v.length === 0, () => tArrow(tUnit, resultT))
  .with((_v) => _v.length === 1, ([p]) => tArrow(p, resultT))
  .with((_v) => _v.length >= 1, ([p, ...rest]) => tArrow(p, arrowChain(rest, resultT)))
  .exhaustive());
const ctxWithEnv = _curry(2, (ctx, env) => ({ env: env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: ctx.loopStack }));
const ctxWithLoop = _curry(3, (ctx, env, frame) => ({ env: env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: _Array_prepend(frame, ctx.loopStack) }));
const inferLoopParamsFrom = _curry(6, (ctx, params, i, envAcc, frameAcc, st) => match(_Array_get(i, params))
  .with({ _tag: "None" }, () => Ok([frameAcc, envAcc, st]))
  .with({ _tag: "Some" }, ({ value: p }) => _Result_flatMap(([t, st1]) => inferLoopParamsFrom(ctx, params, add(i, 1), _Map_set(p.name, mono(t), envAcc), _Array_append(t, frameAcc), st1))(inferExpr(ctx, p.init, st)))
  .exhaustive());
const unifyRecurArgsFrom = _curry(5, (ctx, args, frame, i, st) => match(_Array_get(i, args))
  .with({ _tag: "None" }, () => Ok(st))
  .with({ _tag: "Some" }, ({ value: a }) => _Result_flatMap(([at, st1]) => match(_Array_get(i, frame))
  .with({ _tag: "None" }, () => unifyRecurArgsFrom(ctx, args, frame, add(i, 1), st1))
  .with({ _tag: "Some" }, ({ value: pt }) => _Result_flatMap((st2) => unifyRecurArgsFrom(ctx, args, frame, add(i, 1), st2))(u(at, pt, st1, exprSpan(a))))
  .exhaustive())(inferExpr(ctx, a, st)))
  .exhaustive());
const inferRecur = _curry(4, (ctx, args, sp, st) => match(ctx.loopStack)
  .with((_v) => _v.length === 0, () => Err(typeErr("'recur' is only legal inside a loop body", sp)))
  .with((_v) => _v.length >= 1, ([frame]) => _Result_flatMap((st1) => (([t, st2]) => Ok([t, st2]))(freshVar(st1)))(unifyRecurArgsFrom(ctx, args, frame, 0, st)))
  .exhaustive());
const inferCallArgs = _curry(5, (ctx, fnT, args, st, callSpan) => match(args)
  .with((_v) => _v.length === 0, () => Ok([fnT, st]))
  .with((_v) => _v.length >= 1, ([arg, ...rest]) => _Result_flatMap(([argT, st1]) => (([resultT, st2]) => _Result_flatMap((st3) => inferCallArgs(ctx, resultT, rest, st3, callSpan))(u(fnT, tArrow(argT, resultT), st2, exprSpan(arg))))(freshVar(st1)))(inferExpr(ctx, arg, st)))
  .exhaustive());
const inferNormalCall = _curry(4, (ctx, fn, args, st) => _Result_flatMap(([fnT, st1]) => match(args)
  .with((_v) => _v.length === 0, () => (([resultT, st2]) => _Result_flatMap((st3) => Ok([resultT, st3]))(u(fnT, tArrow(tUnit, resultT), st2, exprSpan(fn))))(freshVar(st1)))
  .otherwise(() => inferCallArgs(ctx, fnT, args, st1, exprSpan(fn))))(inferExpr(ctx, fn, st)));
const inferTernary = _curry(5, (ctx, cond, thenE, elseE, st) => _Result_flatMap(([condT, st1]) => _Result_flatMap((st2) => _Result_flatMap(([thenT, st3]) => _Result_flatMap(([elseT, st4]) => _Result_flatMap((st5) => Ok([thenT, st5]))(u(thenT, elseT, st4, exprSpan(elseE))))(inferExpr(ctx, elseE, st3)))(inferExpr(ctx, thenE, st2)))(u(condT, tBool, st1, exprSpan(cond))))(inferExpr(ctx, cond, st)));
const inferBindBody = _curry(7, (ctx, param, paramSpan, body, payloadT, mkBody, st) => (([paramT, bodyEnv, st1]) => _Result_flatMap((st2) => _Result_flatMap(([bodyT, st3]) => (([resT, st4]) => { const wantBody = mkBody(resT); return _Result_flatMap((st5) => Ok([wantBody, st5]))(u(bodyT, wantBody, st4, exprSpan(body))); })(freshVar(st3)))(inferExpr(ctxWithEnv(ctx, bodyEnv), body, st2)))(u(paramT, payloadT, st1, paramSpan)))(bindParam(param, ctx.env, st)));
const inferTwoSlotBind = _curry(8, (ctx, param, paramSpan, value, body, valT, ctor, st) => (([payloadT, st1]) => (([errT, st2]) => _Result_flatMap((st3) => inferBindBody(ctx, param, paramSpan, body, payloadT, (resT) => tCon(ctor, [resT, errT]), st3))(u(valT, tCon(ctor, [payloadT, errT]), st2, exprSpan(value))))(freshVar(st1)))(freshVar(st)));
const inferQuestionBind = _curry(8, (ctx, bind, param, paramSpan, value, body, valT, st) => match(resolve(valT, st))
  .with({ _tag: "TyVar" }, () => (($written) => inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Result", st))(setLetBindMonad(bind, "Result")))
  .with({ _tag: "TyCon" }, ({ name }) => (eq(name, "Option") ? (($written) => (([payloadT, st1]) => _Result_flatMap((st2) => inferBindBody(ctx, param, paramSpan, body, payloadT, (resT) => tCon("Option", [resT]), st2))(u(valT, tCon("Option", [payloadT]), st1, exprSpan(value))))(freshVar(st)))(setLetBindMonad(bind, "Option")) : (eq(name, "Result") ? (($written) => inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Result", st))(setLetBindMonad(bind, "Result")) : Err(typeErr(`let? requires Option or Result, got ${showType(zonk(valT, st))}`, exprSpan(value))))))
  .otherwise(() => Err(typeErr(`let? requires Option or Result, got ${showType(zonk(valT, st))}`, exprSpan(value)))));
const inferLetBind = _curry(8, (ctx, bind, param, paramSpan, monad, value, body, st) => _Result_flatMap(([valT, st1]) => (eq(monad, "Task") ? inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Task", st1) : inferQuestionBind(ctx, bind, param, paramSpan, value, body, valT, st1)))(inferExpr(ctx, value, st)));
const inferRecordRow = _curry(3, (ctx, fields, st) => match(fields)
  .with((_v) => _v.length === 0, () => Ok([RowEmpty, st]))
  .with((_v) => _v.length >= 1, ([f, ...rest]) => _Result_flatMap(([restRow, st1]) => _Result_flatMap(([ft, st2]) => Ok([rExtend(f.name, ft, restRow), st2]))(inferExpr(ctx, f.value, st1)))(inferRecordRow(ctx, rest, st)))
  .exhaustive());
const rWithTail = _curry(2, (row, tail) => match(row)
  .with({ _tag: "RowEmpty" }, () => tail)
  .with({ _tag: "RowVar" }, ({ id }) => rVar(id))
  .with({ _tag: "RowExtend" }, ({ label, fieldType, rest }) => rExtend(label, fieldType, rWithTail(rest, tail)))
  .exhaustive());
const inferFieldAccess = _curry(5, (ctx, target, name, sp, st) => _Result_flatMap(([targetT, st1]) => (([fieldT, st2]) => (([restRow, st3]) => _Result_flatMap((st4) => Ok([fieldT, st4]))(u(targetT, tRecord(rExtend(name, fieldT, restRow)), st3, sp)))(freshRowVar(st2)))(freshVar(st1)))(inferExpr(ctx, target, st)));
const inferNsField = _curry(5, (ctx, tname, name, sp, st) => match(_Map_get(name, _Map_getOr(new Map([]), tname, ctx.ns)))
  .with({ _tag: "Some" }, ({ value: sc }) => (([t, st1]) => Ok([t, st1]))(instantiate(sc, st)))
  .with({ _tag: "None" }, () => Err(typeErr(`'${tname}' has no member '${name}'`, sp)))
  .exhaustive());
const inferInterpParts = _curry(3, (ctx, parts, st) => match(parts)
  .with((_v) => _v.length === 0, () => Ok(st))
  .with((_v) => _v.length >= 1 && _v[0]._tag === "IPLit", ([, ...rest]) => inferInterpParts(ctx, rest, st))
  .with((_v) => _v.length >= 1 && _v[0]._tag === "IPExpr", ([{ expr: ex }, ...rest]) => _Result_flatMap(([t, st1]) => _Result_flatMap((st2) => inferInterpParts(ctx, rest, st2))(u(t, tString, st1, exprSpan(ex))))(inferExpr(ctx, ex, st)))
  .exhaustive());
const inferTupleElems = _curry(3, (ctx, elements, st) => match(elements)
  .with((_v) => _v.length === 0, () => Ok([[], st]))
  .with((_v) => _v.length >= 1, ([el, ...rest]) => _Result_flatMap(([t, st1]) => _Result_flatMap(([restTs, st2]) => Ok([_Array_prepend(t, restTs), st2]))(inferTupleElems(ctx, rest, st1)))(inferExpr(ctx, el, st)))
  .exhaustive());
const seqElemExpr = (el) => match(el)
  .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
  .with({ _tag: "SESpread" }, ({ expr: e }) => e)
  .exhaustive();
const inferSeqSlotsElems = _curry(5, (ctx, con, elem, elements, st) => match(elements)
  .with((_v) => _v.length === 0, () => Ok(st))
  .with((_v) => _v.length >= 1, ([slot, ...rest]) => ((ex) => _Result_flatMap(([et, st1]) => ((want) => _Result_flatMap((st2) => inferSeqSlotsElems(ctx, con, elem, rest, st2))(u(want, et, st1, exprSpan(ex))))(match(slot)
  .with({ _tag: "SEExpr" }, () => elem)
  .with({ _tag: "SESpread" }, () => tCon(con, [elem]))
  .exhaustive()))(inferExpr(ctx, ex, st)))(seqElemExpr(slot)))
  .exhaustive());
const inferSeqSlots = _curry(4, (ctx, con, elements, st) => (([elem, st1]) => _Result_flatMap((st2) => Ok([tCon(con, [elem]), st2]))(inferSeqSlotsElems(ctx, con, elem, elements, st1)))(freshVar(st)));
const inferMapEntries = _curry(5, (ctx, k, v, entries, st) => match(entries)
  .with((_v) => _v.length === 0, () => Ok(st))
  .with((_v) => _v.length >= 1, ([ent, ...rest]) => _Result_flatMap(([kt, st1]) => _Result_flatMap((st2) => _Result_flatMap(([vt, st3]) => _Result_flatMap((st4) => inferMapEntries(ctx, k, v, rest, st4))(u(v, vt, st3, exprSpan(ent.value))))(inferExpr(ctx, ent.value, st2)))(u(k, kt, st1, exprSpan(ent.key))))(inferExpr(ctx, ent.key, st)))
  .exhaustive());
const inferMapExpr = _curry(3, (ctx, entries, st) => (([k, st1]) => (([v, st2]) => _Result_flatMap((st3) => Ok([tCon("Map", [k, v]), st3]))(inferMapEntries(ctx, k, v, entries, st2)))(freshVar(st1)))(freshVar(st)));
const mergeBindingMapsFrom = _curry(3, (keys, src, dest) => match(keys)
  .with((_v) => _v.length === 0, () => dest)
  .with((_v) => _v.length >= 1, ([k, ...rest]) => match(_Map_get(k, src))
  .with({ _tag: "Some" }, ({ value: v }) => mergeBindingMapsFrom(rest, src, _Map_set(k, v, dest)))
  .with({ _tag: "None" }, () => mergeBindingMapsFrom(rest, src, dest))
  .exhaustive())
  .exhaustive());
const mergeBindingMaps = _curry(2, (dest, src) => mergeBindingMapsFrom(_Map_keys(src), src, dest));
const mergeEnvBindingsFrom = _curry(3, (keys, bindings, env) => match(keys)
  .with((_v) => _v.length === 0, () => env)
  .with((_v) => _v.length >= 1, ([k, ...rest]) => match(_Map_get(k, bindings))
  .with({ _tag: "Some" }, ({ value: t }) => mergeEnvBindingsFrom(rest, bindings, _Map_set(k, mono(t), env)))
  .with({ _tag: "None" }, () => mergeEnvBindingsFrom(rest, bindings, env))
  .exhaustive())
  .exhaustive());
const mergeEnvBindings = _curry(2, (bindings, env) => mergeEnvBindingsFrom(_Map_keys(bindings), bindings, env));
const inferArms = _curry(5, (ctx, scrutT, resultT, arms, st) => match(arms)
  .with((_v) => _v.length === 0, () => Ok(st))
  .with((_v) => _v.length >= 1, ([arm, ...rest]) => _Result_flatMap(([patT, bindings, st1]) => _Result_flatMap((st2) => ((armCtx) => _Result_flatMap((st3) => _Result_flatMap(([bodyT, st4]) => _Result_flatMap((st5) => inferArms(ctx, scrutT, resultT, rest, st5))(u(resultT, bodyT, st4, exprSpan(arm.body))))(inferExpr(armCtx, arm.body, st3)))(match(arm.guard)
  .with({ _tag: "None" }, () => Ok(st2))
  .with({ _tag: "Some" }, ({ value: g }) => _Result_flatMap(([guardT, stg]) => u(tBool, guardT, stg, exprSpan(g)))(inferExpr(armCtx, g, st2)))
  .exhaustive()))(ctxWithEnv(ctx, mergeEnvBindings(bindings, ctx.env))))(u(scrutT, patT, st1, patSpan(arm.pattern))))(inferPat(ctx, arm.pattern, st)))
  .exhaustive());
const inferMatch = _curry(4, (ctx, scrutinee, arms, st) => _Result_flatMap(([scrutT, st1]) => (([resultT, st2]) => _Result_flatMap((st3) => Ok([resultT, st3]))(inferArms(ctx, scrutT, resultT, arms, st2)))(freshVar(st1)))(inferExpr(ctx, scrutinee, st)));
const inferExpr = _curry(3, (ctx, e, st) => match(e)
  .with({ _tag: "ENum" }, () => Ok([tNumber, st]))
  .with({ _tag: "EUnit" }, () => Ok([tUnit, st]))
  .with({ _tag: "EBool" }, () => Ok([tBool, st]))
  .with({ _tag: "EStr" }, ({ value }) => Ok([tLit(value), st]))
  .with({ _tag: "ERef" }, ({ name, span: sp }) => match(_Map_get(name, ctx.env))
  .with({ _tag: "Some" }, ({ value: sc }) => (([t, st1]) => Ok([t, st1]))(instantiate(sc, st)))
  .with({ _tag: "None" }, () => (ctx.open ? (([t, st1]) => Ok([t, st1]))(freshVar(st)) : Err(typeErr(`unbound variable '${name}'`, sp))))
  .exhaustive())
  .with({ _tag: "ELambda" }, ({ params, body }) => (([paramTypes, bodyEnv, st1]) => _Result_flatMap((st2) => _Result_flatMap(([bodyT, st3]) => Ok([arrowChain(paramTypes, bodyT), st3]))(inferExpr(ctxWithEnv(ctx, bodyEnv), body, st2)))(constrainParamAnnotsFrom(ctx, params, paramTypes, new Map([]), st1)))(bindParamsFrom(params, ctx.env, st)))
  .with({ _tag: "ELetIn" }, ({ name, nameSpan: _nameSpan, value, body, span: _span }) => match(value)
  .with({ _tag: "ELambda" }, () => ((lets) => ((idxOf) => ((tail) => _Result_flatMap(([localCtx, localSt]) => inferExpr(localCtx, tail, localSt))(processGroupsFrom(ctx, stronglyConnected(adjOf(lets, idxOf)), lets, st)))(localTail(e)))(idxOfMap(lets)))(localLetsFrom(e)))
  .otherwise(() => _Result_flatMap(([valT, st1]) => ((sc) => (($ctx) => inferExpr($ctx, body, st1))(ctxWithEnv(ctx, _Map_set(name, sc, ctx.env))))(generalize(ctx.env, valT, st1, true)))(inferExpr(ctx, value, st))))
  .with({ _tag: "ELetBind" }, ({ param, paramSpan, monad, value, body }) => inferLetBind(ctx, e, param, paramSpan, monad, value, body, st))
  .with({ _tag: "ECall" }, ({ fn, args, origin }) => ((api) => _Result_flatMap((claimed) => match(claimed)
  .with({ _tag: "Some" }, ({ value: r }) => Ok(r))
  .with({ _tag: "None" }, () => inferNormalCall(ctx, fn, args, st))
  .exhaustive())(runInferCallHooks(inferCallHooksOf(ctx.plugins), fn, args, origin, st, api)))({ inferExpr: _curry(2, (e, st0) => inferExpr(ctx, e, st0)), unify: u }))
  .with({ _tag: "EPipe" }, ({ left, right, span: sp }) => inferExpr(ctx, Ast.ECall(right, [left], None, sp), st))
  .with({ _tag: "EDo" }, ({ exprs }) => inferDo(ctx, exprs, st))
  .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => inferTernary(ctx, cond, thenE, elseE, st))
  .with({ _tag: "ERecord" }, ({ fields, spread, span: sp }) => match(spread)
  .with({ _tag: "None" }, () => _Result_flatMap(([row, st1]) => Ok([tRecord(row), st1]))(inferRecordRow(ctx, fields, st)))
  .with({ _tag: "Some" }, ({ value: spreadExpr }) => _Result_flatMap(([row, st1]) => _Result_flatMap(([baseT, st2]) => (([tailVar, st3]) => _Result_flatMap((st4) => Ok([baseT, st4]))(u(baseT, tRecord(rWithTail(row, tailVar)), st3, sp)))(freshRowVar(st2)))(inferExpr(ctx, spreadExpr, st1)))(inferRecordRow(ctx, fields, st)))
  .exhaustive())
  .with({ _tag: "EField" }, ({ target, name, span: sp }) => match(target)
  .with({ _tag: "ERef" }, ({ name: tname }) => (and(_Map_has(tname, ctx.ns), not(_Map_has(tname, ctx.env))) ? inferNsField(ctx, tname, name, sp, st) : inferFieldAccess(ctx, target, name, sp, st)))
  .otherwise(() => inferFieldAccess(ctx, target, name, sp, st)))
  .with({ _tag: "ETuple" }, ({ elements }) => _Result_flatMap(([elems, st1]) => Ok([tTuple(elems), st1]))(inferTupleElems(ctx, elements, st)))
  .with({ _tag: "EArr" }, ({ elements }) => inferSeqSlots(ctx, "Array", elements, st))
  .with({ _tag: "EList" }, ({ elements }) => inferSeqSlots(ctx, "List", elements, st))
  .with({ _tag: "ESet" }, ({ elements }) => inferSeqSlots(ctx, "Set", elements, st))
  .with({ _tag: "EMap" }, ({ entries }) => inferMapExpr(ctx, entries, st))
  .with({ _tag: "EMatch" }, ({ scrutinee, arms }) => inferMatch(ctx, scrutinee, arms, st))
  .with({ _tag: "ELoop" }, ({ params, body }) => _Result_flatMap(([frame, bodyEnv, st1]) => inferExpr(ctxWithLoop(ctx, bodyEnv, frame), body, st1))(inferLoopParamsFrom(ctx, params, 0, ctx.env, [], st)))
  .with({ _tag: "ERecur" }, ({ args, span: sp }) => inferRecur(ctx, args, sp, st))
  .with({ _tag: "EInterp" }, ({ parts }) => _Result_flatMap((st1) => Ok([tString, st1]))(inferInterpParts(ctx, parts, st)))
  .exhaustive());
const inferDo = _curry(3, (ctx, exprs, st) => match(exprs)
  .with((_v) => _v.length === 0, () => Err(typeErr("internal: empty do block", { start: 0, end: 0 })))
  .with((_v) => _v.length === 1, ([last]) => inferExpr(ctx, last, st))
  .with((_v) => _v.length >= 1, ([first, ...rest]) => _Result_flatMap(([_, st1]) => inferDo(ctx, rest, st1))(inferExpr(ctx, first, st)))
  .exhaustive());
const inferPatRecordFrom = _curry(5, (ctx, fields, row, bindings, st) => match(fields)
  .with((_v) => _v.length === 0, () => Ok([row, bindings, st]))
  .with((_v) => _v.length >= 1, ([f, ...rest]) => _Result_flatMap(([subT, subBindings, st1]) => inferPatRecordFrom(ctx, rest, rExtend(f.label, subT, row), mergeBindingMaps(bindings, subBindings), st1))(inferPat(ctx, f.pat, st)))
  .exhaustive());
const inferPatRecord = _curry(3, (ctx, fields, st) => (([rowBase, _st1]) => _Result_flatMap(([row, bindings, st2]) => Ok([tRecord(row), bindings, st2]))(inferPatRecordFrom(ctx, fields, rowBase, new Map([]), st)))(freshRowVar(st)));
const inferPatCtorArgs = _curry(7, (ctx, ctor, curT, args, st, bindings, sp) => match(args)
  .with((_v) => _v.length === 0, () => Ok([curT, bindings, st]))
  .with((_v) => _v.length >= 1, ([argPat, ...rest]) => match(resolve(curT, st))
  .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => _Result_flatMap(([subT, subBindings, st1]) => _Result_flatMap((st2) => inferPatCtorArgs(ctx, ctor, toT, rest, st2, mergeBindingMaps(bindings, subBindings), sp))(u(fromT, subT, st1, patSpan(argPat))))(inferPat(ctx, argPat, st)))
  .otherwise(() => Err(typeErr(`constructor '${ctor}' applied to too many arguments`, sp))))
  .exhaustive());
const inferPatTupleFrom = _curry(3, (ctx, elems, st) => match(elems)
  .with((_v) => _v.length === 0, () => Ok([[], new Map([]), st]))
  .with((_v) => _v.length >= 1, ([ep, ...rest]) => _Result_flatMap(([t, bindings, st1]) => _Result_flatMap(([restTs, restBindings, st2]) => Ok([_Array_prepend(t, restTs), mergeBindingMaps(restBindings, bindings), st2]))(inferPatTupleFrom(ctx, rest, st1)))(inferPat(ctx, ep, st)))
  .exhaustive());
const inferPatTuple = _curry(3, (ctx, elems, st) => _Result_flatMap(([elemTs, bindings, st1]) => Ok([tTuple(elemTs), bindings, st1]))(inferPatTupleFrom(ctx, elems, st)));
const inferSeqPatElems = _curry(4, (ctx, elem, elems, st) => match(elems)
  .with((_v) => _v.length === 0, () => Ok([new Map([]), st]))
  .with((_v) => _v.length >= 1, ([ep, ...rest]) => _Result_flatMap(([subT, subBindings, st1]) => _Result_flatMap((st2) => _Result_flatMap(([restBindings, st3]) => Ok([mergeBindingMaps(restBindings, subBindings), st3]))(inferSeqPatElems(ctx, elem, rest, st2)))(u(elem, subT, st1, patSpan(ep))))(inferPat(ctx, ep, st)))
  .exhaustive());
const inferSeqPat = _curry(5, (ctx, con, elems, restPat, st) => (([elem, st1]) => { const seqT = tCon(con, [elem]); return _Result_flatMap(([bindings, st2]) => match(restPat)
  .with({ _tag: "None" }, () => Ok([seqT, bindings, st2]))
  .with({ _tag: "Some" }, ({ value: r }) => _Result_flatMap(([subT, subBindings, st3]) => _Result_flatMap((st4) => Ok([seqT, mergeBindingMaps(bindings, subBindings), st4]))(u(subT, seqT, st3, patSpan(r))))(inferPat(ctx, r, st2)))
  .exhaustive())(inferSeqPatElems(ctx, elem, elems, st1)); })(freshVar(st)));
const inferPat = _curry(3, (ctx, p, st) => match(p)
  .with({ _tag: "PAs" }, ({ pat, name }) => _Result_flatMap(([t, bindings, st1]) => Ok([t, _Map_set(name, t, bindings), st1]))(inferPat(ctx, pat, st)))
  .with({ _tag: "PWild" }, () => (([t, st1]) => Ok([t, new Map([]), st1]))(freshVar(st)))
  .with({ _tag: "PUnit" }, () => Ok([tUnit, new Map([]), st]))
  .with({ _tag: "PLit" }, () => Ok([tNumber, new Map([]), st]))
  .with({ _tag: "PBool" }, () => Ok([tBool, new Map([]), st]))
  .with({ _tag: "PStr" }, ({ value }) => Ok([tLit(value), new Map([]), st]))
  .with({ _tag: "PBind" }, ({ name }) => (([t, st1]) => Ok([t, _Map_set(name, t, new Map([])), st1]))(freshVar(st)))
  .with({ _tag: "PRecord" }, ({ fields }) => inferPatRecord(ctx, fields, st))
  .with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) => match(ns)
  .with({ _tag: "Some" }, ({ value: alias }) => match(_Map_get(ctor, _Map_getOr(new Map([]), alias, ctx.ns)))
  .with({ _tag: "None" }, () => Err(typeErr(`'${alias}' has no member '${ctor}'`, sp)))
  .with({ _tag: "Some" }, ({ value: sc }) => (([curT, st1]) => inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map([]), sp))(instantiate(sc, st)))
  .exhaustive())
  .with({ _tag: "None" }, () => match(_Map_get(ctor, ctx.env))
  .with({ _tag: "None" }, () => Err(typeErr(`unknown constructor '${ctor}'`, sp)))
  .with({ _tag: "Some" }, ({ value: sc }) => (([curT, st1]) => inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map([]), sp))(instantiate(sc, st)))
  .exhaustive())
  .exhaustive())
  .with({ _tag: "PTuple" }, ({ elems }) => inferPatTuple(ctx, elems, st))
  .with({ _tag: "PArr" }, ({ elems, rest }) => inferSeqPat(ctx, "Array", elems, rest, st))
  .with({ _tag: "PList" }, ({ elems, rest }) => inferSeqPat(ctx, "List", elems, rest, st))
  .with({ _tag: "POr" }, ({ alts, span: sp }) => inferOrPat(ctx, alts, sp, st))
  .exhaustive());
const unifyOrPatBinding = _curry(5, (name, altBindings, bindings, st, sp) => match(_Map_get(name, bindings))
  .with({ _tag: "None" }, () => Ok(st))
  .with({ _tag: "Some" }, ({ value: prevT }) => match(_Map_get(name, altBindings))
  .with({ _tag: "None" }, () => Ok(st))
  .with({ _tag: "Some" }, ({ value: ty }) => u(prevT, ty, st, sp))
  .exhaustive())
  .exhaustive());
const unifyOrPatBindings = _curry(5, (names, altBindings, bindings, st, sp) => match(names)
  .with((_v) => _v.length === 0, () => Ok(st))
  .with((_v) => _v.length >= 1, ([name, ...rest]) => _Result_flatMap((st1) => unifyOrPatBindings(rest, altBindings, bindings, st1, sp))(unifyOrPatBinding(name, altBindings, bindings, st, sp)))
  .exhaustive());
const inferOrPatAlts = _curry(6, (ctx, alts, i, t, bindings, st) => match(_Array_get(i, alts))
  .with({ _tag: "None" }, () => Ok(st))
  .with({ _tag: "Some" }, ({ value: alt }) => _Result_flatMap(([altT, altBindings, st1]) => _Result_flatMap((st2) => _Result_flatMap((st3) => inferOrPatAlts(ctx, alts, add(i, 1), t, bindings, st3))(unifyOrPatBindings(_Map_keys(altBindings), altBindings, bindings, st2, patSpan(alt))))(u(t, altT, st1, patSpan(alt))))(inferPat(ctx, alt, st)))
  .exhaustive());
const inferOrPat = _curry(4, (ctx, alts, sp, st) => match(alts)
  .with((_v) => _v.length === 0, () => Err(typeErr("or-pattern needs at least one alternative", sp)))
  .with((_v) => _v.length >= 1, ([first, ...rest]) => _Result_flatMap(([t, bindings, st1]) => _Result_flatMap((st2) => Ok([t, bindings, st2]))(inferOrPatAlts(ctx, rest, 0, t, bindings, st1)))(inferPat(ctx, first, st)))
  .exhaustive());
const patternBindsOpt = (rest) => match(rest)
  .with({ _tag: "Some" }, ({ value: r }) => patternBinds(r))
  .with({ _tag: "None" }, () => [])
  .exhaustive();
const patternBinds = (p) => match(p)
  .with({ _tag: "PAs" }, ({ pat, name }) => _Array_append(name, patternBinds(pat)))
  .with({ _tag: "PBind" }, ({ name }) => [name])
  .with({ _tag: "PRecord" }, ({ fields }) => _Array_flatMap((f) => patternBinds(f.pat))(fields))
  .with({ _tag: "PCtor" }, ({ args }) => _Array_flatMap(patternBinds)(args))
  .with({ _tag: "PTuple" }, ({ elems }) => _Array_flatMap(patternBinds)(elems))
  .with({ _tag: "PArr" }, ({ elems, rest }) => _Array_concat(_Array_flatMap(patternBinds)(elems), patternBindsOpt(rest)))
  .with({ _tag: "PList" }, ({ elems, rest }) => _Array_concat(_Array_flatMap(patternBinds)(elems), patternBindsOpt(rest)))
  .with({ _tag: "POr" }, ({ alts }) => match(_Array_head(alts))
  .with({ _tag: "Some" }, ({ value: first }) => patternBinds(first))
  .with({ _tag: "None" }, () => [])
  .exhaustive())
  .otherwise(() => []);
const addAllFrom = _curry(2, (names, set) => match(names)
  .with((_v) => _v.length === 0, () => set)
  .with((_v) => _v.length >= 1, ([n, ...rest]) => addAllFrom(rest, _Set_add(n, set)))
  .exhaustive());
const paramBound = _curry(2, (p, bound) => match(p)
  .with({ _tag: "LPName" }, ({ name }) => _Set_add(name, bound))
  .with({ _tag: "LPTuple" }, ({ names }) => addAllFrom(names, bound))
  .with({ _tag: "LPRecord" }, ({ fields }) => addAllFrom(fields, bound))
  .exhaustive());
const lambdaBound = _curry(2, (params, bound) => match(params)
  .with((_v) => _v.length === 0, () => bound)
  .with((_v) => _v.length >= 1, ([p, ...rest]) => lambdaBound(rest, paramBound(p, bound)))
  .exhaustive());
const loopBound = _curry(2, (params, bound) => reduce(_curry(2, (b, p) => _Set_add(p.name, b)), bound, params));
const loopInitRefsFrom = _curry(4, (params, i, bound, acc) => match(_Array_get(i, params))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: p }) => loopInitRefsFrom(params, add(i, 1), bound, freeRefs(p.init, bound, acc)))
  .exhaustive());
const freeRefsList = _curry(3, (es, bound, acc) => match(es)
  .with((_v) => _v.length === 0, () => acc)
  .with((_v) => _v.length >= 1, ([e, ...rest]) => freeRefsList(rest, bound, freeRefs(e, bound, acc)))
  .exhaustive());
const freeRefsFields = _curry(3, (fields, bound, acc) => match(fields)
  .with((_v) => _v.length === 0, () => acc)
  .with((_v) => _v.length >= 1, ([f, ...rest]) => freeRefsFields(rest, bound, freeRefs(f.value, bound, acc)))
  .exhaustive());
const freeRefsEntries = _curry(3, (entries, bound, acc) => match(entries)
  .with((_v) => _v.length === 0, () => acc)
  .with((_v) => _v.length >= 1, ([ent, ...rest]) => freeRefsEntries(rest, bound, freeRefs(ent.value, bound, freeRefs(ent.key, bound, acc))))
  .exhaustive());
const freeRefsInterpParts = _curry(3, (parts, bound, acc) => match(parts)
  .with((_v) => _v.length === 0, () => acc)
  .with((_v) => _v.length >= 1 && _v[0]._tag === "IPLit", ([, ...rest]) => freeRefsInterpParts(rest, bound, acc))
  .with((_v) => _v.length >= 1 && _v[0]._tag === "IPExpr", ([{ expr: ex }, ...rest]) => freeRefsInterpParts(rest, bound, freeRefs(ex, bound, acc)))
  .exhaustive());
const freeRefsArms = _curry(3, (arms, bound, acc) => match(arms)
  .with((_v) => _v.length === 0, () => acc)
  .with((_v) => _v.length >= 1, ([arm, ...rest]) => ((armBound) => ((acc1) => freeRefsArms(rest, bound, freeRefs(arm.body, armBound, acc1)))(match(arm.guard)
  .with({ _tag: "Some" }, ({ value: g }) => freeRefs(g, armBound, acc))
  .with({ _tag: "None" }, () => acc)
  .exhaustive()))(addAllFrom(patternBinds(arm.pattern), bound)))
  .exhaustive());
const freeRefs = _curry(3, (e, bound, acc) => match(e)
  .with({ _tag: "ENum" }, () => acc)
  .with({ _tag: "EUnit" }, () => acc)
  .with({ _tag: "EBool" }, () => acc)
  .with({ _tag: "EStr" }, () => acc)
  .with({ _tag: "ERef" }, ({ name }) => (_Set_has(name, bound) ? acc : _Set_add(name, acc)))
  .with({ _tag: "ECall" }, ({ fn, args }) => freeRefsList(args, bound, freeRefs(fn, bound, acc)))
  .with({ _tag: "ELambda" }, ({ params, body }) => freeRefs(body, lambdaBound(params, bound), acc))
  .with({ _tag: "ELetIn" }, ({ name, value, body }) => ((valueBound) => ((acc1) => freeRefs(body, _Set_add(name, bound), acc1))(freeRefs(value, valueBound, acc)))(match(value)
  .with({ _tag: "ELambda" }, () => _Set_add(name, bound))
  .otherwise(() => bound)))
  .with({ _tag: "ELetBind" }, ({ param, value, body }) => ((acc1) => freeRefs(body, paramBound(param, bound), acc1))(freeRefs(value, bound, acc)))
  .with({ _tag: "EPipe" }, ({ left, right }) => freeRefs(right, bound, freeRefs(left, bound, acc)))
  .with({ _tag: "EDo" }, ({ exprs }) => freeRefsList(exprs, bound, acc))
  .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => freeRefs(elseE, bound, freeRefs(thenE, bound, freeRefs(cond, bound, acc))))
  .with({ _tag: "EMatch" }, ({ scrutinee, arms }) => freeRefsArms(arms, bound, freeRefs(scrutinee, bound, acc)))
  .with({ _tag: "ELoop" }, ({ params, body }) => freeRefs(body, loopBound(params, bound), loopInitRefsFrom(params, 0, bound, acc)))
  .with({ _tag: "ERecur" }, ({ args }) => freeRefsList(args, bound, acc))
  .with({ _tag: "ERecord" }, ({ fields, spread }) => freeRefsFields(fields, bound, match(spread)
  .with({ _tag: "Some" }, ({ value: s }) => freeRefs(s, bound, acc))
  .with({ _tag: "None" }, () => acc)
  .exhaustive()))
  .with({ _tag: "EField" }, ({ target }) => freeRefs(target, bound, acc))
  .with({ _tag: "ETuple" }, ({ elements }) => freeRefsList(elements, bound, acc))
  .with({ _tag: "EArr" }, ({ elements }) => freeRefsList(map(seqElemExpr)(elements), bound, acc))
  .with({ _tag: "EList" }, ({ elements }) => freeRefsList(map(seqElemExpr)(elements), bound, acc))
  .with({ _tag: "ESet" }, ({ elements }) => freeRefsList(map(seqElemExpr)(elements), bound, acc))
  .with({ _tag: "EMap" }, ({ entries }) => freeRefsEntries(entries, bound, acc))
  .with({ _tag: "EInterp" }, ({ parts }) => freeRefsInterpParts(parts, bound, acc))
  .exhaustive());
const seedBuiltinsFrom = _curry(4, (keys, builtins, env, st) => match(keys)
  .with((_v) => _v.length === 0, () => env)
  .with((_v) => _v.length >= 1, ([n, ...rest]) => match(_Map_get(n, builtins))
  .with({ _tag: "Some" }, ({ value: t }) => seedBuiltinsFrom(rest, builtins, _Map_set(n, generalize(env, t, st, true), env), st))
  .with({ _tag: "None" }, () => seedBuiltinsFrom(rest, builtins, env, st))
  .exhaustive())
  .exhaustive());
const seedBuiltins = _curry(3, (builtins, env, st) => seedBuiltinsFrom(_Map_keys(builtins), builtins, env, st));
const seedNsMembersFrom = _curry(5, (keys, members, env, st, acc) => match(keys)
  .with((_v) => _v.length === 0, () => acc)
  .with((_v) => _v.length >= 1, ([m, ...rest]) => match(_Map_get(m, members))
  .with({ _tag: "Some" }, ({ value: t }) => seedNsMembersFrom(rest, members, env, st, _Map_set(m, generalize(env, t, st, true), acc)))
  .with({ _tag: "None" }, () => seedNsMembersFrom(rest, members, env, st, acc))
  .exhaustive())
  .exhaustive());
const seedNsFrom = _curry(5, (nsNames, namespaces, env, st, acc) => match(nsNames)
  .with((_v) => _v.length === 0, () => acc)
  .with((_v) => _v.length >= 1, ([nsName, ...rest]) => match(_Map_get(nsName, namespaces))
  .with({ _tag: "Some" }, ({ value: members }) => seedNsFrom(rest, namespaces, env, st, _Map_set(nsName, seedNsMembersFrom(_Map_keys(members), members, env, st, new Map([])), acc)))
  .with({ _tag: "None" }, () => seedNsFrom(rest, namespaces, env, st, acc))
  .exhaustive())
  .exhaustive());
const seedNs = _curry(3, (namespaces, env, st) => seedNsFrom(_Map_keys(namespaces), namespaces, env, st, new Map([])));
const seedNsImportsFrom = _curry(3, (aliases, nsImports, ns) => match(aliases)
  .with((_v) => _v.length === 0, () => ns)
  .with((_v) => _v.length >= 1, ([alias, ...rest]) => match(_Map_get(alias, nsImports))
  .with({ _tag: "Some" }, ({ value: members }) => seedNsImportsFrom(rest, nsImports, _Map_set(alias, members, ns)))
  .with({ _tag: "None" }, () => seedNsImportsFrom(rest, nsImports, ns))
  .exhaustive())
  .exhaustive());
const seedNsImports = _curry(2, (nsImports, ns) => seedNsImportsFrom(_Map_keys(nsImports), nsImports, ns));
const aliasMapFrom = _curry(2, (stmts, acc) => match(stmts)
  .with((_v) => _v.length === 0, () => acc)
  .with((_v) => _v.length >= 1, ([s, ...rest]) => match(s)
  .with((_v) => _v._tag === "SType" && _v.alias._tag === "Some", ({ name, params, alias: { value: fields } }) => aliasMapFrom(rest, _Map_set(name, { params: params, fields: fields, expr: None }, acc)))
  .with((_v) => _v._tag === "SType" && _v.aliasType._tag === "Some", ({ name, params, aliasType: { value: te } }) => aliasMapFrom(rest, _Map_set(name, { params: params, fields: [], expr: Some(te) }, acc)))
  .otherwise(() => aliasMapFrom(rest, acc)))
  .exhaustive());
const registerCtorsFrom = _curry(6, (ctors, typeName, params, aliasMap, env, st) => match(ctors)
  .with((_v) => _v.length === 0, () => [env, st])
  .with((_v) => _v.length >= 1, ([c, ...rest]) => (([sc, st1]) => registerCtorsFrom(rest, typeName, params, aliasMap, _Map_set(c.name, sc, env), st1))(ctorScheme(typeName, params, c, st, aliasMap)))
  .exhaustive());
const registerUserCtorsFrom = _curry(4, (stmts, aliasMap, env, st) => match(stmts)
  .with((_v) => _v.length === 0, () => [env, st])
  .with((_v) => _v.length >= 1, ([s, ...rest]) => match(s)
  .with({ _tag: "SType" }, ({ name, params, ctors }) => (([env1, st1]) => registerUserCtorsFrom(rest, aliasMap, env1, st1))(registerCtorsFrom(ctors, name, params, aliasMap, env, st)))
  .otherwise(() => registerUserCtorsFrom(rest, aliasMap, env, st)))
  .exhaustive());
const registerBuiltinCtorGroup = _curry(6, (ctors, typeName, params, aliasMap, env, st) => match(ctors)
  .with((_v) => _v.length === 0, () => [env, st])
  .with((_v) => _v.length >= 1, ([c, ...rest]) => (_Map_has(c.name, env) ? registerBuiltinCtorGroup(rest, typeName, params, aliasMap, env, st) : (([sc, st1]) => registerBuiltinCtorGroup(rest, typeName, params, aliasMap, _Map_set(c.name, sc, env), st1))(ctorScheme(typeName, params, c, st, aliasMap))))
  .exhaustive());
const registerBuiltinCtorsFrom = _curry(4, (decls, aliasMap, env, st) => match(decls)
  .with((_v) => _v.length === 0, () => [env, st])
  .with((_v) => _v.length >= 1, ([d, ...rest]) => (([env1, st1]) => registerBuiltinCtorsFrom(rest, aliasMap, env1, st1))(registerBuiltinCtorGroup(d.ctors, d.name, d.params, aliasMap, env, st)))
  .exhaustive());
const registerExternsFrom = _curry(4, (stmts, aliasMap, env, st) => match(stmts)
  .with((_v) => _v.length === 0, () => [env, st])
  .with((_v) => _v.length >= 1, ([s, ...rest]) => match(s)
  .with({ _tag: "SExtern" }, ({ name, params, typeExpr }) => (([vars, st0]) => (([t, _, st1]) => registerExternsFrom(rest, aliasMap, _Map_set(name, generalize(env, t, st1, false), env), st1))(typeExprToType(typeExpr, vars, st0, aliasMap, _Set_fromArray([]))))(reduce(_curry(2, ([vs, s], param) => (([v, s1]) => [_Map_set(param, v, vs), s1])(freshVar(s))), [new Map([]), st], params)))
  .otherwise(() => registerExternsFrom(rest, aliasMap, env, st)))
  .exhaustive());
const letsOfFrom = (stmts) => match(stmts)
  .with((_v) => _v.length === 0, () => [])
  .with((_v) => _v.length >= 1, ([s, ...rest]) => match(s)
  .with({ _tag: "SLet" }, () => _Array_prepend(s, letsOfFrom(rest)))
  .otherwise(() => letsOfFrom(rest)))
  .exhaustive();
const localLetsFrom = (e) => { const collect = _curry(2, (current, acc) => match(current)
  .with({ _tag: "ELetIn" }, ({ name, nameSpan, value, body, span }) => match(value)
  .with({ _tag: "ELambda" }, () => collect(body, _Array_append(Ast.SLet(name, nameSpan, None, value, false, None, span), acc)))
  .otherwise(() => acc))
  .otherwise(() => acc)); return collect(e, []); };
const localTail = (e) => match(e)
  .with((_v) => _v._tag === "ELetIn" && _v.value._tag === "ELambda", ({ body }) => localTail(body))
  .otherwise(() => e);
const idxOfFrom = _curry(3, (lets, i0, acc0) => { let i = i0; let acc = acc0; while (true) { const _step = match(_Array_get(i, lets))
  .with({ _tag: "None" }, () => _done(acc))
  .with((_v) => _v._tag === "Some" && _v.value._tag === "SLet", ({ value: { name } }) => _recur(add(i, 1), _Map_set(name, i, acc)))
  .with({ _tag: "Some" }, () => _recur(add(i, 1), acc))
  .exhaustive(); if (_step._tag === "recur") { [i, acc] = _step.args; continue; } return _step.value; } });
const idxOfMap = (lets) => idxOfFrom(lets, 0, new Map([]));
const depsOf = _curry(2, (letStmt, idxOf) => match(letStmt)
  .with({ _tag: "SLet" }, ({ value }) => _Array_flatMap((r) => match(_Map_get(r, idxOf))
  .with({ _tag: "Some" }, ({ value: j }) => [j])
  .with({ _tag: "None" }, () => [])
  .exhaustive())(_Set_toArray(freeRefs(value, _Set_fromArray([]), _Set_fromArray([])))))
  .otherwise(() => []));
const adjOf = _curry(2, (lets, idxOf) => map((s) => depsOf(s, idxOf))(lets));
const groupOfFrom = _curry(2, (idxs, lets) => match(idxs)
  .with((_v) => _v.length === 0, () => [])
  .with((_v) => _v.length >= 1, ([i, ...rest]) => match(_Array_get(i, lets))
  .with({ _tag: "Some" }, ({ value: s }) => _Array_prepend(s, groupOfFrom(rest, lets)))
  .with({ _tag: "None" }, () => groupOfFrom(rest, lets))
  .exhaustive())
  .exhaustive());
const preBindGroupFrom = _curry(3, (group, env, st) => match(group)
  .with((_v) => _v.length === 0, () => [env, st])
  .with((_v) => _v.length >= 1, ([s, ...rest]) => match(s)
  .with({ _tag: "SLet" }, ({ name }) => (([v, st1]) => preBindGroupFrom(rest, _Map_set(name, mono(v), env), st1))(freshVar(st)))
  .otherwise(() => preBindGroupFrom(rest, env, st)))
  .exhaustive());
const inferGroupFrom = _curry(3, (ctx, group, st) => match(group)
  .with((_v) => _v.length === 0, () => Ok([new Map([]), st]))
  .with((_v) => _v.length >= 1, ([s, ...rest]) => match(s)
  .with({ _tag: "SLet" }, ({ name, annot, value, span }) => _Result_flatMap(([t, st1]) => match(_Map_get(name, ctx.env))
  .with({ _tag: "Some" }, ({ value: selfSc }) => _Result_flatMap((st2) => _Result_flatMap(([pinned, st3]) => _Result_flatMap(([restTypes, st4]) => Ok([_Map_set(name, pinned, restTypes), st4]))(inferGroupFrom(ctx, rest, st3)))(match(annot)
  .with({ _tag: "Some" }, ({ value: te }) => (([at, _, stA]) => _Result_map((stB) => [at, stB])(u(t, at, stA, annotSpan(te))))(typeExprToType(te, new Map([]), st2, ctx.aliasMap, _Set_fromArray([]))))
  .with({ _tag: "None" }, () => Ok([t, st2]))
  .exhaustive()))(u(selfSc.ty, t, st1, span)))
  .with({ _tag: "None" }, () => Err(typeErr(`internal: missing self-binding for '${name}'`, span)))
  .exhaustive())(inferExpr(ctx, value, st)))
  .otherwise(() => inferGroupFrom(ctx, rest, st)))
  .exhaustive());
const dropGroupFrom = _curry(2, (group, env) => match(group)
  .with((_v) => _v.length === 0, () => env)
  .with((_v) => _v.length >= 1, ([s, ...rest]) => match(s)
  .with({ _tag: "SLet" }, ({ name }) => dropGroupFrom(rest, _Map_delete(name, env)))
  .otherwise(() => dropGroupFrom(rest, env)))
  .exhaustive());
const generalizeGroupFrom = _curry(4, (group, bodyTypes, env, st) => match(group)
  .with((_v) => _v.length === 0, () => env)
  .with((_v) => _v.length >= 1, ([s, ...rest]) => match(s)
  .with({ _tag: "SLet" }, ({ name, annot }) => match(_Map_get(name, bodyTypes))
  .with({ _tag: "Some" }, ({ value: t }) => ((widen) => generalizeGroupFrom(rest, bodyTypes, _Map_set(name, generalize(env, t, st, widen), env), st))(match(annot)
  .with({ _tag: "None" }, () => true)
  .with({ _tag: "Some" }, () => false)
  .exhaustive()))
  .with({ _tag: "None" }, () => generalizeGroupFrom(rest, bodyTypes, env, st))
  .exhaustive())
  .otherwise(() => generalizeGroupFrom(rest, bodyTypes, env, st)))
  .exhaustive());
const processGroupsFrom = _curry(4, (ctx, sccs, lets, st) => match(sccs)
  .with((_v) => _v.length === 0, () => Ok([ctx, st]))
  .with((_v) => _v.length >= 1, ([comp, ...restSccs]) => ((group) => (([preEnv, st1]) => { const preCtx = ctxWithEnv(ctx, preEnv); return _Result_flatMap(([bodyTypes, st2]) => ((finalEnv) => processGroupsFrom(ctxWithEnv(ctx, finalEnv), restSccs, lets, st2))(generalizeGroupFrom(group, bodyTypes, dropGroupFrom(group, preEnv), st2)))(inferGroupFrom(preCtx, group, st1)); })(preBindGroupFrom(group, ctx.env, st)))(groupOfFrom(comp, lets)))
  .exhaustive());
const inferExprStmtsFrom = _curry(3, (ctx, stmts, st) => match(stmts)
  .with((_v) => _v.length === 0, () => Ok(st))
  .with((_v) => _v.length >= 1, ([s, ...rest]) => match(s)
  .with({ _tag: "SExpr" }, ({ value, span }) => _Result_flatMap(([t, st1]) => _Result_flatMap((st2) => inferExprStmtsFrom(ctx, rest, st2))(u(t, tUnit, st1, span)))(inferExpr(ctx, value, st)))
  .otherwise(() => inferExprStmtsFrom(ctx, rest, st)))
  .exhaustive());
const seedImportsFrom = _curry(3, (keys, imports, env) => match(keys)
  .with((_v) => _v.length === 0, () => env)
  .with((_v) => _v.length >= 1, ([k, ...rest]) => match(_Map_get(k, imports))
  .with({ _tag: "Some" }, ({ value: sc }) => seedImportsFrom(rest, imports, _Map_set(k, sc, env)))
  .with({ _tag: "None" }, () => seedImportsFrom(rest, imports, env))
  .exhaustive())
  .exhaustive());
const qualAliasSeedFrom = _curry(4, (names, alias, from, acc) => match(names)
  .with((_v) => _v.length === 0, () => acc)
  .with((_v) => _v.length >= 1, ([n, ...rest]) => qualAliasSeedFrom(rest, alias, from, match(_Map_get(n, from))
  .with({ _tag: "Some" }, ({ value: info }) => _Map_set(`${alias}.${n}`, info, acc))
  .with({ _tag: "None" }, () => acc)
  .exhaustive()))
  .exhaustive());
const qualAliasSeed = _curry(3, (stmts, quals, acc) => match(stmts)
  .with((_v) => _v.length === 0, () => acc)
  .with((_v) => _v.length >= 1, ([s, ...rest]) => qualAliasSeed(rest, quals, match(s)
  .with({ _tag: "SImportNs" }, ({ alias }) => match(_Map_get(alias.name, quals))
  .with({ _tag: "Some" }, ({ value: dep }) => qualAliasSeedFrom(_Map_keys(dep.aliases), alias.name, dep.aliases, acc))
  .with({ _tag: "None" }, () => acc)
  .exhaustive())
  .otherwise(() => acc)))
  .exhaustive());
export const inferProgramImports = _curry(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => { const plugins = resolvePluginsDefault(pluginsOpt); const st0 = mkSt(1000); const env0 = seedBuiltins(builtins, new Map([]), st0); const ns0 = seedNsImports(nsImports, seedNs(namespaces, env0, st0)); const aliasMap = aliasMapFrom(stmts, qualAliasSeed(stmts, quals, new Map([]))); return (([env1, st1]) => (([env2, st2]) => (([env3, st3]) => { const env4 = seedImportsFrom(_Map_keys(imports), imports, env3); const lets = letsOfFrom(stmts); const idxOf = idxOfMap(lets); const sccs = stronglyConnected(adjOf(lets, idxOf)); return match(processGroupsFrom({ env: env4, open: openMode, ns: ns0, aliasMap: aliasMap, plugins: plugins, loopStack: [] }, sccs, lets, st3))
  .with((_v) => _v._tag === "Ok", ({ value: [finalCtx, st4] }) => match(inferExprStmtsFrom(finalCtx, stmts, st4))
  .with({ _tag: "Ok" }, () => Ok(finalCtx.env))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .exhaustive())
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .exhaustive(); })(registerExternsFrom(stmts, aliasMap, env2, st2)))(registerBuiltinCtorsFrom(builtinDeclsFor(stmts), aliasMap, env1, st1)))(registerUserCtorsFrom(stmts, aliasMap, env0, st0)); });



const emptyQuals = new Map([]);
export const inferProgram = _curry(4, (stmts, builtins, namespaces, openMode) => inferProgramImports(stmts, builtins, namespaces, openMode, new Map([]), new Map([]), emptyQuals, None));
export const inferProgramWith = _curry(5, (stmts, builtins, namespaces, openMode, pluginsOpt) => inferProgramImports(stmts, builtins, namespaces, openMode, new Map([]), new Map([]), emptyQuals, pluginsOpt));
const takeScheme = _curry(3, (name, env, acc) => match(_Map_get(name, env))
  .with({ _tag: "Some" }, ({ value: sc }) => _Map_set(name, sc, acc))
  .with({ _tag: "None" }, () => acc)
  .exhaustive());
const exportCtorsInto = _curry(4, (ctors, i, env, acc) => match(_Array_get(i, ctors))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: c }) => exportCtorsInto(ctors, add(i, 1), env, takeScheme(c.name, env, acc)))
  .exhaustive());
const exportedSchemesFrom = _curry(4, (stmts, i0, env, acc0) => { let i = i0; let acc = acc0; while (true) { const _step = match(_Array_get(i, stmts))
  .with({ _tag: "None" }, () => _done(acc))
  .with((_v) => _v._tag === "Some" && _v.value._tag === "SLet" && _v.value.exported === true, ({ value: { name } }) => _recur(add(i, 1), takeScheme(name, env, acc)))
  .with((_v) => _v._tag === "Some" && _v.value._tag === "SExtern" && _v.value.exported === true, ({ value: { name } }) => _recur(add(i, 1), takeScheme(name, env, acc)))
  .with((_v) => _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true, ({ value: { ctors } }) => _recur(add(i, 1), exportCtorsInto(ctors, 0, env, acc)))
  .with({ _tag: "Some" }, () => _recur(add(i, 1), acc))
  .exhaustive(); if (_step._tag === "recur") { [i, acc] = _step.args; continue; } return _step.value; } });
export const exportedSchemes = _curry(2, (stmts, env) => exportedSchemesFrom(stmts, 0, env, new Map([])));
