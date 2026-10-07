import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_get,
  _Option_match,
  _Str_codeAt,
  _Str_get,
  _Str_length,
  _Str_startsWith,
  _curry,
  _keyOf,
  _tuple,
  and,
  eq,
  floor,
  gt,
  max,
  min,
  or,
} from "@mochi/compiler/runtime";

const at: <A>(xs: A[], i: number, fallback: A) => A = _curry(
  3,
  <A>(xs: A[], i: number, fallback: A) =>
    _Option_match(
      _Array_get(i, xs),
      () => fallback,
      (v) => v,
    ),
);
const charsEq = (a: string, i: number, b: string, j: number): boolean =>
  ((_v) =>
    _v[0]._tag === "Some" && _v[1]._tag === "Some"
      ? (([{ value: x }, { value: y }]) => eq(x, y))(
          _v as [
            Extract<[Option<string>, Option<string>][0], { _tag: "Some" }>,
            Extract<[Option<string>, Option<string>][1], { _tag: "Some" }>,
          ],
        )
      : false)(_tuple(_Str_get(i, a), _Str_get(j, b)));
const initRow: (n: number) => number[] = (n: number) => {
  let j: number = 0;
  let row: number[] = [] as number[];
  while (true) {
    if (j > n) {
      return row;
    } else {
      {
        const $recur0: number = j + 1;
        const $recur1: number[] = _Array_append(j, row);
        j = $recur0;
        row = $recur1;
        continue;
      }
    }
  }
};
const cellAt = (
  a: string,
  b: string,
  i: number,
  j: number,
  prev: number[],
  cur: number[],
): number => {
  const cost: number = charsEq(a, i - 1, b, j - 1) ? 0 : 1;
  return min(min(at(cur, j - 1, 0) + 1, at(prev, j, 0) + 1), at(prev, j - 1, 0) + cost);
};
const fillRow = (a: string, b: string, i: number, prev: number[], n: number): number[] => {
  let j: number = 1;
  let cur: number[] = [i];
  while (true) {
    if (j > n) {
      return cur;
    } else {
      {
        const $recur0: number = j + 1;
        const $recur1: number[] = _Array_append(cellAt(a, b, i, j, prev, cur), cur);
        j = $recur0;
        cur = $recur1;
        continue;
      }
    }
  }
};
const levFrom = (a: string, b: string, m: number, n: number): number => {
  let i: number = 1;
  let prev: number[] = initRow(n);
  while (true) {
    if (i > m) {
      return at(prev, n, n);
    } else {
      {
        const $recur0: number = i + 1;
        const $recur1: number[] = fillRow(a, b, i, prev, n);
        i = $recur0;
        prev = $recur1;
        continue;
      }
    }
  }
};
const lev = (a: string, b: string): number => {
  const m: number = _Str_length(a);
  const n: number = _Str_length(b);
  return m === 0 ? n : n === 0 ? m : levFrom(a, b, m, n);
};
/**
 * `^[A-Z]` — identifier heads are ASCII. Empty and non-letters are lower.
 */
const upperStart: (s: string) => boolean = (s: string) =>
  _Option_match(
    _Str_codeAt(0, s),
    () => false,
    (n) => and(n >= 65, n <= 90),
  );
const sameCaseClass = (a: string, b: string): boolean => eq(upperStart(a), upperStart(b));
const skipName = (want: string, n: string): boolean =>
  or(
    or(or(or(n === "", eq(n, want)), _Str_startsWith("$", n)), _Str_startsWith("_", n)),
    !sameCaseClass(want, n),
  );
const consider = (
  want: string,
  budget: number,
  best: Option<string>,
  bestDist: number,
  n: string,
): [Option<string>, number] =>
  skipName(want, n)
    ? _tuple(best, bestDist)
    : ((d: number) =>
        and(d <= budget, d < bestDist)
          ? _tuple(Some(n) as Option<string>, d)
          : _tuple(best, bestDist))(lev(want, n));
const closestFrom = (
  want: string,
  names: string[],
  i: number,
  budget: number,
  best: Option<string>,
  bestDist: number,
): Option<string> =>
  _Option_match(
    _Array_get(i, names),
    () => best,
    (n) =>
      (([next, dist]: [Option<string>, number]) =>
        closestFrom(want, names, i + 1, budget, next, dist))(
        consider(want, budget, best, bestDist, n),
      ),
  );
const closestName$ = (want: string, names: string[]): Option<string> => {
  const budget: number = max(1, floor(_Str_length(want) / 3));
  return closestFrom(want, names, 0, budget, None as Option<string>, _Str_length(want) + 2);
};
/**
 * Closest candidate within the edit-distance budget, or None.
 */
export const closestName: _Curry<[want: string, names: string[]], Option<string>> = _curry(
  2,
  closestName$,
);
