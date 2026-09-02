import type { PErr } from "./parser";

export type Diag = { message: string; start: number; end: number };

import type { Result, _Curry } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_get,
  _Result_flatMap,
  _Result_map,
  _Result_mapErr,
  _Str_endsWith,
  _Str_length,
  _Str_slice,
  _Str_startsWith,
  _curry,
  _done,
  _recur,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import { compile, compileTs } from "./compile";
import { formatProgram } from "./format";
import { lex } from "./lexer";
import { parseRecovering } from "./parser";
import { emitDtsText } from "./dts";
import { buildModules, buildModulesTs } from "./module";

import { readFile } from "./host.mjs";
import { writeFile as $writeFile } from "./host.mjs";
const writeFile = _curry(2, $writeFile);
import { argv } from "./host.mjs";
import { isCliEntry } from "./host.mjs";
import { print } from "./host.mjs";
import { emit } from "./host.mjs";
import { die } from "./host.mjs";
import { formatError as $formatError } from "./host.mjs";
const formatError = _curry(3, $formatError);
export const outPath: (path: string) => string = (path: string) =>
  `${_Str_slice(0, _Str_length(path) - 6, path)}.js`;
export const tsOutPath: (path: string) => string = (path: string) =>
  `${_Str_slice(0, _Str_length(path) - 6, path)}.ts`;
export const dtsOutPath: (path: string) => string = (path: string) =>
  `${_Str_slice(0, _Str_length(path) - 6, path)}.d.mochi.ts`;
export const formatSrc: (src: string) => Result<string, PErr> = (src: string) =>
  _Result_flatMap(
    (toks) => Ok(formatProgram(parseRecovering(toks, None).stmts, src)) as Result<string, PErr>,
    lex(src),
  );
export const fmtText: (path: string) => Result<string, string> = (path: string) =>
  _Result_flatMap(
    (src) => _Result_mapErr((e: PErr) => formatError(path, src, e), formatSrc(src)),
    readFile(path),
  );
export const fmtOne: _Curry<[path: string, write: boolean], Result<string, string>> = _curry(
  2,
  (path: string, write: boolean) =>
    _Result_flatMap(
      (out) =>
        write
          ? _Result_map((p: string) => print(`wrote ${p}`), writeFile(path, out))
          : (Ok(emit(out)) as Result<string, string>),
      fmtText(path),
    ),
);
export const buildOne: (path: string) => Result<string, string> = (path: string) =>
  _Result_flatMap(
    (src) =>
      _Result_flatMap(
        (js) => writeFile(outPath(path), js),
        _Result_mapErr((e: PErr) => formatError(path, src, e), compile(src)),
      ),
    readFile(path),
  );
export const buildOneTs: _Curry<
  [path: string, runtimeImport: string],
  Result<string, string>
> = _curry(2, (path: string, runtimeImport: string) =>
  _Result_flatMap(
    (src) =>
      _Result_flatMap(
        (ts) => writeFile(tsOutPath(path), ts),
        _Result_mapErr((e: PErr) => formatError(path, src, e), compileTs(src, runtimeImport)),
      ),
    readFile(path),
  ),
);
export const buildOneDts: _Curry<
  [path: string, runtimeImport: string],
  Result<string, string>
> = _curry(2, (path: string, runtimeImport: string) =>
  _Result_flatMap(
    (src) =>
      _Result_flatMap(
        (dts) => writeFile(dtsOutPath(path), dts),
        _Result_mapErr((e: PErr) => formatError(path, src, e), emitDtsText(src, runtimeImport)),
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
        (_v) => _v.length === 0,
        () => _done(Ok("") as Result<string, string>),
      )
      .with(
        (_v) => _v.length >= 1,
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
const tsWritePath: _Curry<[path: string, body: string], string> = _curry(
  2,
  (path: string, body: string) =>
    _Str_endsWith(".mochi", path)
      ? _Str_startsWith("/** @jsx h */", body)
        ? `${_Str_slice(0, _Str_length(path) - 6, path)}.tsx`
        : tsOutPath(path)
      : path,
);
export const writeAllTs: <A>(outs: ({ path: string; js: string } & A)[]) => Result<string, string> =
  <A>(outs: ({ path: string; js: string } & A)[]) => {
    let remaining = outs;
    while (true) {
      const _step = match(remaining)
        .with(
          (_v) => _v.length === 0,
          () => _done(Ok("") as Result<string, string>),
        )
        .with(
          (_v) => _v.length >= 1,
          ([o, ...rest]) =>
            match(writeFile(tsWritePath(o.path, o.js), o.js))
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
export const buildMultiTs: _Curry<
  [entry: string, runtimeImport: string],
  Result<string, string>
> = _curry(2, (entry: string, runtimeImport: string) =>
  _Result_flatMap(
    writeAllTs,
    _Result_mapErr((e: PErr) => e.message, buildModulesTs(entry, runtimeImport)),
  ),
);
export const buildMulti: (entry: string) => Result<string, string> = (entry: string) =>
  _Result_flatMap(
    writeAll,
    _Result_mapErr((e: PErr) => e.message, buildModules(entry)),
  );
/**
 * Invoke only when Bun executes cli.js / cli.ts directly. Importing it from a
 * colocated unit spec must expose the helpers above without exiting the test process.
 * `_`-prefixed because the name exists to hold an effect, not to be read — mochi
 * has no top-level expression statement (ADR 0094).
 */
const _runEntry = isCliEntry(undefined)
  ? match(_Array_get(0, argv))
      .with({ _tag: "None" }, () =>
        die(
          "usage: mochic <file.mochi>  |  mochic fmt [--write] <file.mochi>  |  mochic ts <file.mochi>  |  mochic dts <file.mochi>  |  mochic build [--emit=ts] <entry.mochi>",
        ),
      )
      .with({ _tag: "Some", value: "fmt" }, () =>
        ((write: boolean) =>
          match(_Array_get(write ? 2 : 1, argv))
            .with({ _tag: "None" }, () => die("usage: mochic fmt [--write] <file.mochi>"))
            .with({ _tag: "Some" }, ({ value: path }) =>
              match(fmtOne(path, write))
                .with({ _tag: "Ok" }, () => "")
                .with({ _tag: "Err" }, ({ error: msg }) => die(msg))
                .exhaustive(),
            )
            .exhaustive())(
          match(_Array_get(1, argv))
            .with({ _tag: "Some", value: "--write" }, () => true)
            .otherwise(() => false),
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
      .with({ _tag: "Some", value: "dts" }, () =>
        match(_Array_get(1, argv))
          .with({ _tag: "None" }, () => die("usage: mochic dts <file.mochi>"))
          .with({ _tag: "Some" }, ({ value: path }) =>
            match(buildOneDts(path, "@mochi/runtime"))
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
