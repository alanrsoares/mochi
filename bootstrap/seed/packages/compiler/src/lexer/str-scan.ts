import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Option_contains,
  _Option_match,
  _Str_get,
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
