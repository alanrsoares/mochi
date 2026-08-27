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
const sub = _curry(2, (a, b) => a - b);
const _Result_mapErr = _curry(2, (f, r) => r._tag === "Err" ? Err(f(r.error)) : r);
const _Result_flatMap = _curry(2, (f, r) => r._tag === "Ok" ? f(r.value) : r);
const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);
const _Str_length = (s) => s.length;
const _Str_slice = _curry(3, (start, end, s) => s.slice(start, end));

import { compile } from "./compile.js";
import { buildModules } from "./module.js";

import { readFile } from "./host.mjs";
import { writeFile as $writeFile } from "./host.mjs";
const writeFile = _curry(2, $writeFile);
import { argv } from "./host.mjs";
import { isCliEntry } from "./host.mjs";
import { print } from "./host.mjs";
import { die } from "./host.mjs";
import { formatError as $formatError } from "./host.mjs";
const formatError = _curry(3, $formatError);
export const outPath = (path) => `${_Str_slice(0, sub(_Str_length(path), 6), path)}.js`;
export const buildOne = (path) => _Result_flatMap((src) => _Result_flatMap((js) => writeFile(outPath(path), js))(_Result_mapErr((e) => formatError(path, src, e))(compile(src))))(readFile(path));
export const writeAll = (outs) => { let remaining = outs; while (true) { const _step = match(remaining)
  .with((_v) => _v.length === 0, () => _done(Ok("")))
  .with((_v) => _v.length >= 1, ([o, ...rest]) => match(writeFile(outPath(o.path), o.js))
  .with({ _tag: "Err" }, ({ error: e }) => _done(Err(e)))
  .with({ _tag: "Ok" }, ({ value: w }) => (() => { print(`  wrote ${w}`); return _recur(rest); })())
  .exhaustive())
  .exhaustive(); if (_step._tag === "recur") { remaining = _step.args[0]; continue; } return _step.value; } };
export const buildMulti = (entry) => _Result_flatMap(writeAll)(_Result_mapErr((e) => e.message)(buildModules(entry)));
const runEntry = (isCliEntry(undefined) ? match(_Array_get(0, argv))
  .with({ _tag: "None" }, () => die("usage: mochic <file.mochi>  |  mochic build <entry.mochi>"))
  .with({ _tag: "Some", value: "build" }, () => match(_Array_get(1, argv))
  .with({ _tag: "None" }, () => die("usage: mochic build <entry.mochi>"))
  .with({ _tag: "Some" }, ({ value: entry }) => match(buildMulti(entry))
  .with({ _tag: "Ok" }, () => print("build ok"))
  .with({ _tag: "Err" }, ({ error: msg }) => die(msg))
  .exhaustive())
  .exhaustive())
  .with({ _tag: "Some" }, ({ value: path }) => match(buildOne(path))
  .with({ _tag: "Ok" }, ({ value: out }) => print(`wrote ${out}`))
  .with({ _tag: "Err" }, ({ error: msg }) => die(msg))
  .exhaustive())
  .exhaustive() : "");
