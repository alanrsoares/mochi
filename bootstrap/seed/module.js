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
const reduce = _curry(3, (f, init, xs) => xs.reduce((acc, x) => f(acc)(x), init));
const _Set_fromArray = (xs) => new Set(xs);
const _Map_getOr = _curry(3, (d, k, m) => m.has(k) ? m.get(k) : d);
const _Map_set = _curry(3, (k, v, m) => {
  const n = new Map(m);
  n.set(k, v);
  return n;
});
const _Map_keys = (m) => [...m.keys()];
const _Map_get = _curry(2, (k, m) => m.has(k) ? Some(m.get(k)) : None);
const _Result_flatMap = _curry(2, (f, r) => r._tag === "Ok" ? f(r.value) : r);
const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);
const _Array_append = _curry(2, (x, xs) => [...xs, x]);
const _Array_flatMap = _curry(2, (f, xs) => xs.flatMap((x) => f(x)));

import { lex } from "./lexer.js";
import { parse } from "./parser.js";
import { checkWith } from "./check.js";
import { exportedRegistry, exportedCtorKeys } from "./ctors.js";
import { inferProgramImports, exportedSchemes } from "./infer.js";
import { codegen } from "./codegen.js";
import { builtins } from "./prelude.gen.mjs";
import { namespaces } from "./prelude.gen.mjs";
import { namespaceRuntime } from "./prelude.gen.mjs";
import { preludeJsDefs } from "./prelude.gen.mjs";
import { runtimeDeps } from "./prelude.gen.mjs";
import * as Ast from "./ast.js";


import { readFile } from "./host.mjs";
import { resolveImport as $resolveImport } from "./host.mjs";
const resolveImport = _curry(2, $resolveImport);
import { absPath } from "./host.mjs";
const mErr = (message) => ({ message: message, start: 0, end: 0 });
const parseModule = ($x) => _Result_flatMap(parse)(lex($x));
const importFromsFrom = _curry(3, (stmts, i, acc) => match(_Array_get(i, stmts))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: s }) => match(s)
  .with({ _tag: "SImport" }, ({ from }) => importFromsFrom(stmts, add(i, 1), _Array_append(from, acc)))
  .with({ _tag: "SImportNs" }, ({ from }) => importFromsFrom(stmts, add(i, 1), _Array_append(from, acc)))
  .otherwise(() => importFromsFrom(stmts, add(i, 1), acc)))
  .exhaustive());
const importFroms = (stmts) => importFromsFrom(stmts, 0, []);

const visit = _curry(2, (path, acc) => match(_Map_get(path, acc.state))
  .with({ _tag: "Some", value: "done" }, () => Ok(acc))
  .with({ _tag: "Some", value: "loading" }, () => Err(mErr(`import cycle through '${path}'`)))
  .otherwise(() => ((acc1) => match(readFile(path))
  .with({ _tag: "Err" }, () => Err(mErr(`cannot read module '${path}'`)))
  .with({ _tag: "Ok" }, ({ value: src }) => match(parseModule(src))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, ({ value: stmts }) => match(visitAll(importFroms(stmts), path, acc1))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, ({ value: acc2 }) => Ok({ state: _Map_set(path, "done", acc2.state), order: _Array_append({ path: path, stmts: stmts }, acc2.order) }))
  .exhaustive())
  .exhaustive())
  .exhaustive())({ state: _Map_set(path, "loading", acc.state), order: acc.order })));
const visitAll = _curry(3, (froms, importer, acc) => match(froms)
  .with((_v) => _v.length === 0, () => Ok(acc))
  .with((_v) => _v.length >= 1, ([from, ...rest]) => match(visit(resolveImport(importer, from), acc))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, ({ value: acc1 }) => visitAll(rest, importer, acc1))
  .exhaustive())
  .exhaustive());
export const loadGraph = (entry) => _Result_flatMap((acc) => Ok(acc.order))(visit(absPath(entry), { state: new Map([]), order: [] }));


const emptyReg = { ctors: new Map([]), types: new Map([]) };
const mergeInto = _curry(3, (keys, from, into) => match(keys)
  .with((_v) => _v.length === 0, () => into)
  .with((_v) => _v.length >= 1, ([k, ...rest]) => mergeInto(rest, from, match(_Map_get(k, from))
  .with({ _tag: "Some" }, ({ value: v }) => _Map_set(k, v, into))
  .with({ _tag: "None" }, () => into)
  .exhaustive()))
  .exhaustive());
const mergeMap = _curry(2, (from, into) => mergeInto(_Map_keys(from), from, into));
const exportedTypeNames = (stmts) => _Set_fromArray(_Array_flatMap((s) => match(s)
  .with({ _tag: "SType", exported: true }, ({ name }) => [name])
  .otherwise(() => []))(stmts));
const aliasesOf = (stmts) => reduce(_curry(2, (acc, s) => match(s)
  .with((_v) => _v._tag === "SType" && _v.alias._tag === "Some", ({ name, params, alias: { value: fields } }) => _Map_set(name, { params: params, fields: fields, expr: None })(acc))
  .with((_v) => _v._tag === "SType" && _v.aliasType._tag === "Some", ({ name, params, aliasType: { value: te } }) => _Map_set(name, { params: params, fields: [], expr: Some(te) })(acc))
  .otherwise(() => acc)), new Map([]))(stmts);
const qualScopeOf = (stmts) => ({ types: exportedTypeNames(stmts), aliases: aliasesOf(stmts) });
const withNamedCtor = _curry(5, (name, info, depReg, depKeys, res) => ({ imports: res.imports, nsImports: res.nsImports, reg: { ctors: _Map_set(name, info, res.reg.ctors), types: match(_Map_get(info.owner, depReg.types))
  .with({ _tag: "Some" }, ({ value: cs }) => _Map_set(info.owner, cs, res.reg.types))
  .with({ _tag: "None" }, () => res.reg.types)
  .exhaustive() }, keys: match(_Map_get(name)(depKeys))
  .with({ _tag: "Some" }, ({ value: ks }) => _Map_set(name, ks)(res.keys))
  .with({ _tag: "None" }, () => res.keys)
  .exhaustive(), quals: res.quals }));
const takeNamedCtor = _curry(5, (name, span, depReg, depKeys, res) => match(_Map_get(name, depReg.ctors))
  .with({ _tag: "None" }, () => Ok(res))
  .with({ _tag: "Some" }, ({ value: info }) => match(_Map_get(name, res.reg.ctors))
  .with({ _tag: "Some" }, ({ value: prior }) => (not(eq(prior.owner, info.owner)) ? Err({ message: `duplicate constructor '${name}'`, start: span.start, end: span.end }) : Ok(withNamedCtor(name, info, depReg, depKeys, res))))
  .with({ _tag: "None" }, () => Ok(withNamedCtor(name, info, depReg, depKeys, res)))
  .exhaustive())
  .exhaustive());
const prefixCtorsInto = _curry(4, (keys, alias, from, into) => match(keys)
  .with((_v) => _v.length === 0, () => into)
  .with((_v) => _v.length >= 1, ([k, ...rest]) => prefixCtorsInto(rest, alias, from, match(_Map_get(k, from))
  .with({ _tag: "Some" }, ({ value: v }) => _Map_set(`${alias}.${k}`, v, into))
  .with({ _tag: "None" }, () => into)
  .exhaustive()))
  .exhaustive());
const resolveNames = _curry(6, (names, from, depExports, depReg, depKeys, res) => match(names)
  .with((_v) => _v.length === 0, () => Ok(res))
  .with((_v) => _v.length >= 1, ([n, ...rest]) => match(_Map_get(n.name, depExports))
  .with({ _tag: "None" }, () => Err({ message: `'${from}' has no export '${n.name}'`, start: n.span.start, end: n.span.end }))
  .with({ _tag: "Some" }, ({ value: sc }) => match(takeNamedCtor(n.name, n.span, depReg, depKeys, { imports: _Map_set(n.name, sc, res.imports), nsImports: res.nsImports, reg: res.reg, keys: res.keys, quals: res.quals }))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, ({ value: res1 }) => resolveNames(rest, from, depExports, depReg, depKeys, res1))
  .exhaustive())
  .exhaustive())
  .exhaustive());
const resolveImportsFrom = _curry(5, (ctx, stmts, i, path, res) => match(_Array_get(i, stmts))
  .with({ _tag: "None" }, () => Ok(res))
  .with((_v) => _v._tag === "Some" && _v.value._tag === "SImport", ({ value: { names, from } }) => ((dp) => ((depExports) => ((depReg) => ((depKeys) => match(resolveNames(names, from, depExports, depReg, depKeys, res))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, ({ value: res1 }) => resolveImportsFrom(ctx, stmts, add(i, 1), path, res1))
  .exhaustive())(_Map_getOr(new Map([]), dp, ctx.keysByPath)))(_Map_getOr(emptyReg, dp, ctx.regByPath)))(_Map_getOr(new Map([]), dp, ctx.exportsByPath)))(resolveImport(path, from)))
  .with((_v) => _v._tag === "Some" && _v.value._tag === "SImportNs", ({ value: { alias, from } }) => ((dp) => ((depExports) => ((depReg) => ((depKeys) => resolveImportsFrom(ctx, stmts, add(i, 1), path, { imports: res.imports, nsImports: _Map_set(alias.name, depExports, res.nsImports), reg: { ctors: prefixCtorsInto(_Map_keys(depReg.ctors), alias.name, depReg.ctors, res.reg.ctors), types: mergeMap(depReg.types, res.reg.types) }, keys: mergeMap(depKeys, res.keys), quals: match(_Map_get(dp, ctx.qualsByPath))
  .with({ _tag: "Some" }, ({ value: q }) => _Map_set(alias.name, q, res.quals))
  .with({ _tag: "None" }, () => res.quals)
  .exhaustive() }))(_Map_getOr(new Map([]), dp, ctx.keysByPath)))(_Map_getOr(emptyReg, dp, ctx.regByPath)))(_Map_getOr(new Map([]), dp, ctx.exportsByPath)))(resolveImport(path, from)))
  .with({ _tag: "Some" }, () => resolveImportsFrom(ctx, stmts, add(i, 1), path, res))
  .exhaustive());
const compileOne = _curry(2, (ctx, loaded) => match(resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, { imports: new Map([]), nsImports: new Map([]), reg: emptyReg, keys: new Map([]), quals: new Map([]) }))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, ({ value: res }) => match(checkWith(loaded.stmts, res.reg, res.quals))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, () => match(inferProgramImports(loaded.stmts, builtins, namespaces, true, res.imports, res.nsImports, res.quals, None))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, ({ value: env }) => ((js) => Ok({ exportsByPath: _Map_set(loaded.path, exportedSchemes(loaded.stmts, env), ctx.exportsByPath), regByPath: _Map_set(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath), keysByPath: _Map_set(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath), qualsByPath: _Map_set(loaded.path, qualScopeOf(loaded.stmts), ctx.qualsByPath), outputs: [...ctx.outputs, { path: loaded.path, js: js }] }))(codegen(loaded.stmts, res.keys, true, namespaceRuntime, preludeJsDefs, runtimeDeps)))
  .exhaustive())
  .exhaustive())
  .exhaustive());
const compileAll = _curry(2, (ctx, graph) => match(graph)
  .with((_v) => _v.length === 0, () => Ok(ctx.outputs))
  .with((_v) => _v.length >= 1, ([m, ...rest]) => match(compileOne(ctx, m))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, ({ value: ctx1 }) => compileAll(ctx1, rest))
  .exhaustive())
  .exhaustive());
export const compileGraph = (graph) => compileAll({ exportsByPath: new Map([]), regByPath: new Map([]), keysByPath: new Map([]), qualsByPath: new Map([]), outputs: [] }, graph);
export const buildModules = (entry) => _Result_flatMap((graph) => compileGraph(graph))(loadGraph(entry));
