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
const length = (xs) => xs.length;
const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);
const _Array_concat = _curry(2, (xs, ys) => xs.concat(ys));
const _Array_append = _curry(2, (x, xs) => [...xs, x]);

import { jsxPlugin } from "./plugins/jsx.js";
export const DEFAULT_PLUGINS = [jsxPlugin];
export const resolvePlugins = _curry(2, (pluginsOpt, builtins) => match(pluginsOpt)
  .with({ _tag: "None" }, () => builtins)
  .with({ _tag: "Some" }, ({ value: ps }) => (eq(length(ps), 0) ? [] : _Array_concat(builtins, ps)))
  .exhaustive());
export const resolvePluginsDefault = (pluginsOpt) => resolvePlugins(pluginsOpt, DEFAULT_PLUGINS);
const parseHooksFrom = _curry(3, (plugins, i, acc) => match(_Array_get(i, plugins))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: p }) => match(p.parse)
  .with({ _tag: "Some" }, ({ value: hook }) => parseHooksFrom(plugins, add(i, 1), _Array_append(hook, acc)))
  .with({ _tag: "None" }, () => parseHooksFrom(plugins, add(i, 1), acc))
  .exhaustive())
  .exhaustive());
export const parseHooksOf = (plugins) => parseHooksFrom(plugins, 0, []);
const inferHooksFrom = _curry(3, (plugins, i, acc) => match(_Array_get(i, plugins))
  .with({ _tag: "None" }, () => acc)
  .with({ _tag: "Some" }, ({ value: p }) => match(p.inferCall)
  .with({ _tag: "Some" }, ({ value: hook }) => inferHooksFrom(plugins, add(i, 1), _Array_append(hook, acc)))
  .with({ _tag: "None" }, () => inferHooksFrom(plugins, add(i, 1), acc))
  .exhaustive())
  .exhaustive());
export const inferCallHooksOf = (plugins) => inferHooksFrom(plugins, 0, []);
export const runParseHooks = _curry(4, (hooks, toks, pos, parseExpr) => match(hooks)
  .with((_v) => _v.length === 0, () => Ok(None))
  .with((_v) => _v.length >= 1, ([hook, ...rest]) => match(hook(toks, pos, parseExpr))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, ({ value: v }) => match(v)
  .with({ _tag: "None" }, () => runParseHooks(rest, toks, pos, parseExpr))
  .with({ _tag: "Some" }, ({ value: claim }) => Ok(Some(claim)))
  .exhaustive())
  .exhaustive())
  .exhaustive());
export const runInferCallHooks = _curry(6, (hooks, fn, args, origin, st, api) => match(hooks)
  .with((_v) => _v.length === 0, () => Ok(None))
  .with((_v) => _v.length >= 1, ([hook, ...rest]) => match(hook(fn, args, origin, st, api))
  .with({ _tag: "Err" }, ({ error: e }) => Err(e))
  .with({ _tag: "Ok" }, ({ value: v }) => match(v)
  .with({ _tag: "None" }, () => runInferCallHooks(rest, fn, args, origin, st, api))
  .with({ _tag: "Some" }, ({ value: claim }) => Ok(Some(claim)))
  .exhaustive())
  .exhaustive())
  .exhaustive());
