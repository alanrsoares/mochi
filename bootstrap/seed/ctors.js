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
const show = (x) => {
  const t = typeof x;
  if (t === "string")
    return JSON.stringify(x);
  if (t !== "object" || x === null)
    return String(x);
  if (Array.isArray(x))
    return `[${x.map(show).join(", ")}]`;
  if (x instanceof Map)
    return `#{${[...x.entries()].map((e) => `${show(e[0])}: ${show(e[1])}`).join(", ")}}`;
  if (x instanceof Set)
    return `#{${[...x].map(show).join(", ")}}`;
  if (typeof x[Symbol.iterator] === "function")
    return "<List>";
  if (typeof x._tag === "string") {
    const ks = Object.keys(x).filter((k) => k !== "_tag");
    return ks.length === 0 ? x._tag : `${x._tag}(${ks.map((k) => show(x[k])).join(", ")})`;
  }
  const ks = Object.keys(x);
  if (ks.length === 0)
    return String(x);
  return `{ ${ks.map((k) => `${k}: ${show(x[k])}`).join(", ")} }`;
};
const not = (b) => !b;
const length = (xs) => xs.length;
const map = _curry(2, (f, xs) => xs.map((x) => f(x)));
const filter = _curry(2, (f, xs) => xs.filter((x) => f(x)));
const _Map_has = _curry(2, (k, m) => m.has(k));
const _Map_set = _curry(3, (k, v, m) => {
  const n = new Map(m);
  n.set(k, v);
  return n;
});
const _Option_unwrapOr = _curry(2, (d, o) => o._tag === "Some" ? o.value : d);
const _Result_map = _curry(2, (f, r) => r._tag === "Ok" ? Ok(f(r.value)) : r);
const _Result_flatMap = _curry(2, (f, r) => r._tag === "Ok" ? f(r.value) : r);
const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);
const _Array_prepend = _curry(2, (x, xs) => [x, ...xs]);

import * as Ast from "./ast.js";


const emptyRegistry = { ctors: new Map([]), types: new Map([]) };
export const primTypeNames = ["number", "int", "float", "string", "bool", "unit"];
const keysOfFrom = _curry(2, (fields, i) => match(_Array_get(i, fields))
  .with({ _tag: "None" }, () => [])
  .with({ _tag: "Some" }, ({ value: f }) => _Array_prepend(_Option_unwrapOr(`_${show(i)}`, f.name), keysOfFrom(fields, add(i, 1))))
  .exhaustive());
export const keysOf = (fields) => keysOfFrom(fields, 0);
const builtinSpan = { start: 0, end: 0 };
export const builtinTypeDecls = [{ name: "Option", params: ["a"], ctors: [{ name: "Some", fields: [{ name: Some("value"), fieldType: Ast.TyName("a", builtinSpan) }] }, { name: "None", fields: [] }] }, { name: "Result", params: ["a", "e"], ctors: [{ name: "Ok", fields: [{ name: Some("value"), fieldType: Ast.TyName("a", builtinSpan) }] }, { name: "Err", fields: [{ name: Some("error"), fieldType: Ast.TyName("e", builtinSpan) }] }] }];
const declaresType = _curry(3, (stmts, i, name) => match(_Array_get(i, stmts))
  .with({ _tag: "None" }, () => false)
  .with((_v) => _v._tag === "Some" && _v.value._tag === "SType", ({ value: { name: n } }) => (eq(n, name) ? true : declaresType(stmts, add(i, 1), name)))
  .with({ _tag: "Some" }, () => declaresType(stmts, add(i, 1), name))
  .exhaustive());
export const builtinDeclsFor = (stmts) => filter((bt) => not(declaresType(stmts, 0, bt.name)))(builtinTypeDecls);
const seedRegCtorsFrom = _curry(4, (ctors, i, owner, acc) => match(_Array_get(i, ctors))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: c }) => seedRegCtorsFrom(ctors, add(i, 1), owner, (_Map_has(c.name, acc) ? acc : _Map_set(c.name, { owner: owner, arity: length(c.fields) }, acc))))
  .exhaustive());
const seedRegDeclsFrom = _curry(3, (decls, i, reg) => match(_Array_get(i, decls))
  .with({ _tag: "None" }, () => reg)
  .with({ _tag: "Some" }, ({ value: bt }) => seedRegDeclsFrom(decls, add(i, 1), { ctors: seedRegCtorsFrom(bt.ctors, 0, bt.name, reg.ctors), types: _Map_set(bt.name, map((c) => c.name)(bt.ctors), reg.types) }))
  .exhaustive());
const ctorErr = _curry(2, (message, sp) => ({ message: message, start: sp.start, end: sp.end }));
const ctorsInto = _curry(5, (ctors, i, owner, sp, acc) => match(_Array_get(i, ctors))
  .with({ _tag: "None" }, () => Ok(acc))
  .with({ _tag: "Some" }, ({ value: c }) => (_Map_has(c.name, acc) ? Err(ctorErr(`duplicate constructor '${c.name}'`, sp)) : ctorsInto(ctors, add(i, 1), owner, sp, _Map_set(c.name, { owner: owner, arity: length(c.fields) }, acc))))
  .exhaustive());
const buildLoop = _curry(3, (stmts, i, reg) => match(_Array_get(i, stmts))
  .with({ _tag: "None" }, () => Ok(reg))
  .with((_v) => _v._tag === "Some" && _v.value._tag === "SType", ({ value: { name, ctors, span: sp } }) => (_Map_has(name, reg.types) ? Err(ctorErr(`duplicate type '${name}'`, sp)) : _Result_flatMap((cs) => buildLoop(stmts, add(i, 1), { ctors: cs, types: _Map_set(name, map((c) => c.name)(ctors), reg.types) }))(ctorsInto(ctors, 0, name, sp, reg.ctors))))
  .with({ _tag: "Some" }, () => buildLoop(stmts, add(i, 1), reg))
  .exhaustive());
export const buildRegistry = (stmts) => _Result_map((reg) => seedRegDeclsFrom(builtinDeclsFor(stmts), 0, reg))(buildLoop(stmts, 0, emptyRegistry));
const exportedRegLoop = _curry(3, (stmts, i0, reg0) => { let i = i0; let reg = reg0; while (true) { const _step = match(_Array_get(i)(stmts))
  .with({ _tag: "None" }, () => _done(reg))
  .with((_v) => _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true, ({ value: { name, ctors } }) => _recur(add(i, 1), { ctors: seedRegCtorsFrom(ctors, 0, name, reg.ctors), types: _Map_set(name, map((c) => c.name)(ctors), reg.types) }))
  .with({ _tag: "Some" }, () => _recur(add(i, 1), reg))
  .exhaustive(); if (_step._tag === "recur") { [i, reg] = _step.args; continue; } return _step.value; } });
export const exportedRegistry = (stmts) => exportedRegLoop(stmts, 0, emptyRegistry);
const ctorKeysInto = _curry(3, (ctors, i, m) => match(_Array_get(i)(ctors))
  .with({ _tag: "None" }, () => m)
  .with((_v) => _v._tag === "Some", ({ value: { name, fields } }) => ctorKeysInto(ctors, add(i, 1), _Map_set(name, keysOf(fields))(m)))
  .exhaustive());
const ctorKeysFrom = _curry(3, (stmts, i, m) => match(_Array_get(i, stmts))
  .with({ _tag: "None" }, () => m)
  .with((_v) => _v._tag === "Some" && _v.value._tag === "SType", ({ value: { ctors } }) => ctorKeysFrom(stmts, add(i, 1), ctorKeysInto(ctors, 0, m)))
  .with({ _tag: "Some" }, () => ctorKeysFrom(stmts, add(i, 1), m))
  .exhaustive());
export const ctorKeysFromStmts = _curry(2, (stmts, m) => ctorKeysFrom(stmts, 0, m));
const seedKeyCtorsFrom = _curry(3, (ctors, i, m) => match(_Array_get(i)(ctors))
  .with({ _tag: "None" }, () => m)
  .with((_v) => _v._tag === "Some", ({ value: { name, fields } }) => seedKeyCtorsFrom(ctors, add(i, 1), (_Map_has(name)(m) ? m : _Map_set(name, keysOf(fields))(m))))
  .exhaustive());
const seedKeyDeclsFrom = _curry(3, (decls, i, m) => match(_Array_get(i)(decls))
  .with({ _tag: "None" }, () => m)
  .with((_v) => _v._tag === "Some", ({ value: { ctors } }) => seedKeyDeclsFrom(decls, add(i, 1), seedKeyCtorsFrom(ctors, 0, m)))
  .exhaustive());
export const seedBuiltinCtorKeys = _curry(2, (stmts, m) => seedKeyDeclsFrom(builtinDeclsFor(stmts), 0, m));
const exportedCtorKeysFrom = _curry(3, (stmts, i, m) => match(_Array_get(i, stmts))
  .with({ _tag: "None" }, () => m)
  .with((_v) => _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true, ({ value: { ctors } }) => exportedCtorKeysFrom(stmts, add(i, 1), ctorKeysInto(ctors, 0, m)))
  .with({ _tag: "Some" }, () => exportedCtorKeysFrom(stmts, add(i, 1), m))
  .exhaustive());
export const exportedCtorKeys = (stmts) => exportedCtorKeysFrom(stmts, 0, new Map([]));
