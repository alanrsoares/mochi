/**
 * The directive prologue the parser dropped (ADR 0160): the raw text of each
 * `"..."` literal that opens the source before `limit`, with only blanks and
 * `//` comments around them, and the offset just past the last one. The
 * caller passes the first statement's start, so this agrees with the parser
 * without a second lex.
 */
export type Prologue = { directives: string[]; end: number };

import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Option_contains,
  _Option_match,
  _Str_get,
  _Str_slice,
  _Str_trim,
  _curry,
  _done,
  _keyOf,
  _recur,
} from "@mochi/compiler/runtime";

const skipStrLoop = (src: string, j0: number): Option<number> => {
  let j: number = j0;
  while (true) {
    const _step = ((_v) =>
      _v._tag === "None"
        ? _done(None as Option<number>)
        : _v._tag === "Some" && _v.value === '"'
          ? _done(Some(j + 1) as Option<number>)
          : _v._tag === "Some" && _v.value === "\\"
            ? _Option_match(
                _Str_get(j + 1, src),
                () => _recur(j + 1),
                () => _recur(j + 2),
              )
            : _v._tag === "Some" && _v.value === "$" && _Option_contains("{", _Str_get(j + 1, src))
              ? _Option_match(
                  findHoleEnd$(src, j + 2),
                  () => _done(None as Option<number>),
                  (hEnd) => _recur(hEnd),
                )
              : _v._tag === "Some"
                ? _recur(j + 1)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(_Str_get(j, src));
    if (_step._tag === "recur") {
      j = _step.args[0];
      continue;
    }
    return _step.value;
  }
};
const skipStringLiteral$ = (src: string, i: number): Option<number> => skipStrLoop(src, i + 1);
export const skipStringLiteral: _Curry<[src: string, i: number], Option<number>> = _curry(
  2,
  skipStringLiteral$,
);
const skipLineCommentTo$ = (src: string, j: number): number =>
  ((_v) =>
    _v._tag === "None"
      ? j
      : _v._tag === "Some" && _v.value === "\n"
        ? j
        : _v._tag === "Some"
          ? skipLineCommentTo$(src, j + 1)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Str_get(j, src));
export const skipLineCommentTo: _Curry<[src: string, j: number], number> = _curry(
  2,
  skipLineCommentTo$,
);

const noDirectives: string[] = [] as string[];
const scanPrologue$ = (src: string, limit: number): Prologue => {
  let i: number = 0;
  let acc: string[] = noDirectives;
  let stop: number = 0;
  while (true) {
    if (i >= limit) {
      return { directives: acc, end: stop };
    } else {
      const _step = ((_v) =>
        _v._tag === "None"
          ? _done({ directives: acc, end: stop })
          : _v._tag === "Some" && _v.value === '"'
            ? _Option_match(
                skipStringLiteral$(src, i),
                () => _done({ directives: acc, end: stop }),
                (j) => _recur(j, _Array_append(_Str_slice(i, j, src), acc), j),
              )
            : _v._tag === "Some" && _v.value === "/" && _Option_contains("/", _Str_get(i + 1, src))
              ? _recur(skipLineCommentTo$(src, i), acc, stop)
              : _v._tag === "Some"
                ? (({ value: c }) =>
                    _Str_trim(c) === ""
                      ? _recur(i + 1, acc, stop)
                      : _done({ directives: acc, end: stop }))(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(_Str_get(i, src));
      if (_step._tag === "recur") {
        [i, acc, stop] = _step.args;
        continue;
      }
      return _step.value;
    }
  }
};
export const scanPrologue: _Curry<[src: string, limit: number], Prologue> = _curry(
  2,
  scanPrologue$,
);
const findHoleLoop = (src: string, j0: number, depth0: number): Option<number> => {
  let j: number = j0;
  let depth: number = depth0;
  while (true) {
    const _step = ((_v) =>
      _v._tag === "None"
        ? _done(None as Option<number>)
        : _v._tag === "Some" && _v.value === '"'
          ? _Option_match(
              skipStringLiteral$(src, j),
              () => _done(None as Option<number>),
              (stop) => _recur(stop, depth),
            )
          : _v._tag === "Some" && _v.value === "/" && _Option_contains("/", _Str_get(j + 1, src))
            ? _recur(skipLineCommentTo$(src, j), depth)
            : _v._tag === "Some" && _v.value === "{"
              ? _recur(j + 1, depth + 1)
              : _v._tag === "Some" && _v.value === "}"
                ? depth === 1
                  ? _done(Some(j + 1) as Option<number>)
                  : _recur(j + 1, depth - 1)
                : _v._tag === "Some"
                  ? _recur(j + 1, depth)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(_Str_get(j, src));
    if (_step._tag === "recur") {
      [j, depth] = _step.args;
      continue;
    }
    return _step.value;
  }
};
const findHoleEnd$ = (src: string, start: number): Option<number> => findHoleLoop(src, start, 1);
export const findHoleEnd: _Curry<[src: string, start: number], Option<number>> = _curry(
  2,
  findHoleEnd$,
);
