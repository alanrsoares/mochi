import type { StageErr, Stamped } from "../../compiler/src/compile/compile";

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
  _Str_join,
  _Str_length,
  _Str_slice,
  _Str_startsWith,
  _curry,
  _done,
  _recur,
  map,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import { compile, compileTs } from "../../compiler/src/compile/compile";
import { formatProgram } from "../../compiler/src/format/format";
import { lex } from "../../compiler/src/lexer/lexer";
import { parseRecovering } from "../../compiler/src/parser/parser";
import { emitDtsText } from "../../compiler/src/dts/dts";
import { buildModules, buildModulesTs } from "../../compiler/src/module/module";

import { readFile } from "../../compiler/src/module/host.mjs";
import { writeFile as $writeFile } from "../../compiler/src/module/host.mjs";
const writeFile = _curry(2, $writeFile);
import { argv } from "../../compiler/src/module/host.mjs";
import { isCliEntry } from "../../compiler/src/module/host.mjs";
import { print } from "../../compiler/src/module/host.mjs";
import { emit } from "../../compiler/src/module/host.mjs";
import { die } from "../../compiler/src/module/host.mjs";
import { formatError as $formatError } from "../../compiler/src/module/host.mjs";
const formatError = _curry(3, $formatError);
const formatErrors: <A>(
  path: string,
  src: string,
  errors: ({ end: number; start: number; message: string } & A)[],
) => string = _curry(
  3,
  <A>(path: string, src: string, errors: ({ end: number; start: number; message: string } & A)[]) =>
    _Str_join(
      "\n",
      map(
        (e: { end: number; start: number; message: string } & A) =>
          formatError(path, src, { message: e.message, start: e.start, end: e.end }),
        errors,
      ),
    ),
);
const formatModuleErrors: <A>(errors: ({ message: string } & A)[]) => string = <A>(
  errors: ({ message: string } & A)[],
) =>
  _Str_join(
    "\n",
    map((e: { message: string } & A) => e.message, errors),
  );
export const outPath: (path: string) => string = (path: string) =>
  `${_Str_slice(0, _Str_length(path) - 6, path)}.js`;
export const tsOutPath: (path: string) => string = (path: string) =>
  `${_Str_slice(0, _Str_length(path) - 6, path)}.ts`;
export const dtsOutPath: (path: string) => string = (path: string) =>
  `${_Str_slice(0, _Str_length(path) - 6, path)}.d.mochi.ts`;
export const formatSrc: (src: string) => Result<string, StageErr> = (src: string) =>
  _Result_flatMap(
    (toks) => Ok(formatProgram(parseRecovering(toks, None).stmts, src)) as Result<string, StageErr>,
    lex(src),
  );
export const fmtText: (path: string) => Result<string, string> = (path: string) =>
  _Result_flatMap(
    (src) => _Result_mapErr((e: StageErr) => formatError(path, src, e), formatSrc(src)),
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
        _Result_mapErr((es: Stamped[]) => formatErrors(path, src, es), compile(src)),
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
        _Result_mapErr(
          (es: Stamped[]) => formatErrors(path, src, es),
          compileTs(src, runtimeImport),
        ),
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
        _Result_mapErr(
          (es: Stamped[]) => formatErrors(path, src, es),
          emitDtsText(src, runtimeImport),
        ),
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
          ((_v) =>
            _v._tag === "Err"
              ? (({ error: e }) => _done(Err(e) as Result<string, string>))(_v)
              : _v._tag === "Ok"
                ? (({ value: w }) => ((_printed) => _recur(rest))(print(`  wrote ${w}`)))(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(writeFile(outPath(o.path), o.js)),
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
            ((_v) =>
              _v._tag === "Err"
                ? (({ error: e }) => _done(Err(e) as Result<string, string>))(_v)
                : _v._tag === "Ok"
                  ? (({ value: w }) => ((_printed) => _recur(rest))(print(`  wrote ${w}`)))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(writeFile(tsWritePath(o.path, o.js), o.js)),
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
    _Result_mapErr(formatModuleErrors, buildModulesTs(entry, runtimeImport)),
  ),
);
export const buildMulti: (entry: string) => Result<string, string> = (entry: string) =>
  _Result_flatMap(writeAll, _Result_mapErr(formatModuleErrors, buildModules(entry)));
/**
 * Invoke only when Bun executes cli.js / cli.ts directly. Importing it from a
 * colocated unit spec must expose the helpers above without exiting the test process.
 * `_`-prefixed because the name exists to hold an effect, not to be read — mochi
 * has no top-level expression statement (ADR 0094).
 */
const _runEntry = isCliEntry(undefined)
  ? ((_v) =>
      _v._tag === "None"
        ? die(
            "usage: mochic <file.mochi>  |  mochic fmt [--write] <file.mochi>  |  mochic ts <file.mochi>  |  mochic dts <file.mochi>  |  mochic build [--emit=ts] <entry.mochi>",
          )
        : _v._tag === "Some" && _v.value === "fmt"
          ? ((write: boolean) =>
              ((_v) =>
                _v._tag === "None"
                  ? die("usage: mochic fmt [--write] <file.mochi>")
                  : _v._tag === "Some"
                    ? (({ value: path }) =>
                        ((_v) =>
                          _v._tag === "Ok"
                            ? ""
                            : _v._tag === "Err"
                              ? (({ error: msg }) => die(msg))(_v)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(fmtOne(path, write)))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(_Array_get(write ? 2 : 1, argv)))(
              ((_v) => (_v._tag === "Some" && _v.value === "--write" ? true : false))(
                _Array_get(1, argv),
              ),
            )
          : _v._tag === "Some" && _v.value === "ts"
            ? ((_v) =>
                _v._tag === "None"
                  ? die("usage: mochic ts <file.mochi>")
                  : _v._tag === "Some"
                    ? (({ value: path }) =>
                        ((_v) =>
                          _v._tag === "Ok"
                            ? (({ value: out }) => print(`wrote ${out}`))(_v)
                            : _v._tag === "Err"
                              ? (({ error: msg }) => die(msg))(_v)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(buildOneTs(path, "@mochi/runtime")))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(_Array_get(1, argv))
            : _v._tag === "Some" && _v.value === "dts"
              ? ((_v) =>
                  _v._tag === "None"
                    ? die("usage: mochic dts <file.mochi>")
                    : _v._tag === "Some"
                      ? (({ value: path }) =>
                          ((_v) =>
                            _v._tag === "Ok"
                              ? (({ value: out }) => print(`wrote ${out}`))(_v)
                              : _v._tag === "Err"
                                ? (({ error: msg }) => die(msg))(_v)
                                : (() => {
                                    throw new Error("non-exhaustive match");
                                  })())(buildOneDts(path, "@mochi/runtime")))(_v)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(_Array_get(1, argv))
              : _v._tag === "Some" && _v.value === "build"
                ? ((_v) =>
                    _v._tag === "None"
                      ? die("usage: mochic build [--emit=ts] <entry.mochi>")
                      : _v._tag === "Some" && _v.value === "--emit=ts"
                        ? ((_v) =>
                            _v._tag === "None"
                              ? die("usage: mochic build --emit=ts <entry.mochi>")
                              : _v._tag === "Some"
                                ? (({ value: entry }) =>
                                    ((_v) =>
                                      _v._tag === "Ok"
                                        ? print("build ok")
                                        : _v._tag === "Err"
                                          ? (({ error: msg }) => die(msg))(_v)
                                          : (() => {
                                              throw new Error("non-exhaustive match");
                                            })())(buildMultiTs(entry, "@mochi/runtime")))(_v)
                                : (() => {
                                    throw new Error("non-exhaustive match");
                                  })())(_Array_get(2, argv))
                        : _v._tag === "Some"
                          ? (({ value: entry }) =>
                              ((_v) =>
                                _v._tag === "Ok"
                                  ? print("build ok")
                                  : _v._tag === "Err"
                                    ? (({ error: msg }) => die(msg))(_v)
                                    : (() => {
                                        throw new Error("non-exhaustive match");
                                      })())(buildMulti(entry)))(_v)
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(_Array_get(1, argv))
                : _v._tag === "Some"
                  ? (({ value: path }) =>
                      ((_v) =>
                        _v._tag === "Ok"
                          ? (({ value: out }) => print(`wrote ${out}`))(_v)
                          : _v._tag === "Err"
                            ? (({ error: msg }) => die(msg))(_v)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(buildOne(path)))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(_Array_get(0, argv))
  : "";
