import type { PErr } from "./parser";

export type Result<A, B> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: B };
export type Diag = PErr;

import {
  _curry,
  _recur,
  _done,
  Some,
  None,
  Ok,
  Err,
  sub,
  _Result_mapErr,
  _Result_flatMap,
  _Array_get,
  _Str_length,
  _Str_endsWith,
  _Str_slice,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import { compile, compileTs } from "./compile";
import { buildModules, buildModulesTs } from "./module";

import { readFile } from "./host.mjs";
import { writeFile as $writeFile } from "./host.mjs";
const writeFile = _curry(2, $writeFile);
import { argv } from "./host.mjs";
import { isCliEntry } from "./host.mjs";
import { print } from "./host.mjs";
import { die } from "./host.mjs";
import { formatError as $formatError } from "./host.mjs";
const formatError = _curry(3, $formatError);
export const outPath: (path: string) => string = (path: string) =>
  `${_Str_slice(0, sub(_Str_length(path), 6), path)}.js`;
export const tsOutPath: (path: string) => string = (path: string) =>
  `${_Str_slice(0, sub(_Str_length(path), 6), path)}.ts`;
export const buildOne: (path: string) => Result<string, string> = (path: string) =>
  _Result_flatMap(
    (src) =>
      _Result_flatMap(
        (js) => writeFile(outPath(path), js),
        _Result_mapErr((e: Diag) => formatError(path, src, e), compile(src)),
      ),
    readFile(path),
  );
export const buildOneTs: {
  (path: string): (runtimeImport: string) => Result<string, string>;
  (path: string, runtimeImport: string): Result<string, string>;
} = _curry(2, (path: string, runtimeImport: string) =>
  _Result_flatMap(
    (src) =>
      _Result_flatMap(
        (ts) => writeFile(tsOutPath(path), ts),
        _Result_mapErr((e: Diag) => formatError(path, src, e), compileTs(src, runtimeImport)),
      ),
    readFile(path),
  ),
);
export const writeAll: <A>(outs: ({ path: string; js: string } & A)[]) => Result<string, string> = <
  A,
>(
  outs: ({ path: string; js: string } & A)[],
) => {
  let remaining = outs;
  while (true) {
    const _step = match(remaining)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => _done(Ok("") as Result<string, string>),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([o, ...rest]) =>
          match(writeFile(outPath(o.path), o.js))
            .with({ _tag: "Err" }, ({ error: e }) => _done(Err(e) as Result<string, string>))
            .with({ _tag: "Ok" }, ({ value: w }) =>
              (() => {
                print(`  wrote ${w}`);
                return _recur(rest);
              })(),
            )
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      });
    if (_step._tag === "recur") {
      remaining = _step.args[0];
      continue;
    }
    return _step.value;
  }
};
const tsWritePath: (path: string) => string = (path: string) =>
  _Str_endsWith(".mochi", path) ? tsOutPath(path) : path;
export const writeAllTs: <A>(outs: ({ path: string; js: string } & A)[]) => Result<string, string> =
  <A>(outs: ({ path: string; js: string } & A)[]) => {
    let remaining = outs;
    while (true) {
      const _step = match(remaining)
        .with(
          (_v) => {
            const _g: any = _v;
            return _g.length === 0;
          },
          () => _done(Ok("") as Result<string, string>),
        )
        .with(
          (_v) => {
            const _g: any = _v;
            return _g.length >= 1;
          },
          ([o, ...rest]) =>
            match(writeFile(tsWritePath(o.path), o.js))
              .with({ _tag: "Err" }, ({ error: e }) => _done(Err(e) as Result<string, string>))
              .with({ _tag: "Ok" }, ({ value: w }) =>
                (() => {
                  print(`  wrote ${w}`);
                  return _recur(rest);
                })(),
              )
              .exhaustive(),
        )
        .otherwise(() => {
          throw new Error("non-exhaustive match");
        });
      if (_step._tag === "recur") {
        remaining = _step.args[0];
        continue;
      }
      return _step.value;
    }
  };
export const buildMultiTs: {
  (entry: string): (runtimeImport: string) => Result<string, string>;
  (entry: string, runtimeImport: string): Result<string, string>;
} = _curry(2, (entry: string, runtimeImport: string) =>
  _Result_flatMap(
    writeAllTs,
    _Result_mapErr((e: Diag) => e.message, buildModulesTs(entry, runtimeImport)),
  ),
);
export const buildMulti: (entry: string) => Result<string, string> = (entry: string) =>
  _Result_flatMap(
    writeAll,
    _Result_mapErr((e: Diag) => e.message, buildModules(entry)),
  );
const runEntry = isCliEntry(undefined)
  ? match(_Array_get(0, argv))
      .with({ _tag: "None" }, () =>
        die(
          "usage: mochic <file.mochi>  |  mochic ts <file.mochi>  |  mochic build [--emit=ts] <entry.mochi>",
        ),
      )
      .with({ _tag: "Some", value: "ts" }, () =>
        match(_Array_get(1, argv))
          .with({ _tag: "None" }, () => die("usage: mochic ts <file.mochi>"))
          .with({ _tag: "Some" }, ({ value: path }) =>
            match(buildOneTs(path, "@mochi/runtime"))
              .with({ _tag: "Ok" }, ({ value: out }) => print(`wrote ${out}`))
              .with({ _tag: "Err" }, ({ error: msg }) => die(msg))
              .exhaustive(),
          )
          .exhaustive(),
      )
      .with({ _tag: "Some", value: "build" }, () =>
        match(_Array_get(1, argv))
          .with({ _tag: "None" }, () => die("usage: mochic build [--emit=ts] <entry.mochi>"))
          .with({ _tag: "Some", value: "--emit=ts" }, () =>
            match(_Array_get(2, argv))
              .with({ _tag: "None" }, () => die("usage: mochic build --emit=ts <entry.mochi>"))
              .with({ _tag: "Some" }, ({ value: entry }) =>
                match(buildMultiTs(entry, "@mochi/runtime"))
                  .with({ _tag: "Ok" }, () => print("build ok"))
                  .with({ _tag: "Err" }, ({ error: msg }) => die(msg))
                  .exhaustive(),
              )
              .exhaustive(),
          )
          .with({ _tag: "Some" }, ({ value: entry }) =>
            match(buildMulti(entry))
              .with({ _tag: "Ok" }, () => print("build ok"))
              .with({ _tag: "Err" }, ({ error: msg }) => die(msg))
              .exhaustive(),
          )
          .exhaustive(),
      )
      .with({ _tag: "Some" }, ({ value: path }) =>
        match(buildOne(path))
          .with({ _tag: "Ok" }, ({ value: out }) => print(`wrote ${out}`))
          .with({ _tag: "Err" }, ({ error: msg }) => die(msg))
          .exhaustive(),
      )
      .exhaustive()
  : "";
