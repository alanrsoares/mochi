import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_get,
  _Str_codeAt,
  _Str_get,
  _Str_length,
  _Str_startsWith,
  _curry,
  _tuple,
  and,
  eq,
  floor,
  gt,
  max,
  min,
  not,
  or,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

const at: <A>(xs: A[], i: number, fallback: A) => A = _curry(
  3,
  <A>(xs: A[], i: number, fallback: A) =>
    match(_Array_get(i, xs))
      .with({ _tag: "Some" }, ({ value: v }) => v)
      .with({ _tag: "None" }, () => fallback)
      .exhaustive(),
);
const charsEq: _Curry<[a: string, i: number, b: string, j: number], boolean> = _curry(
  4,
  (a: string, i: number, b: string, j: number) =>
    match(_tuple(_Str_get(i, a), _Str_get(j, b)))
      .with(
        (
          _v,
        ): _v is [
          Extract<[Option<string>, Option<string>][0], { _tag: "Some" }>,
          Extract<[Option<string>, Option<string>][1], { _tag: "Some" }>,
        ] => {
          const _g: any = _v;
          return _g[0]._tag === "Some" && _g[1]._tag === "Some";
        },
        ([{ value: x }, { value: y }]) => eq(x, y),
      )
      .otherwise(() => false),
);
const initRow: (n: number) => number[] = (n: number) => {
  let j: number = 0;
  let row: number[] = [] as number[];
  while (true) {
    if (j > n) {
      return row;
    } else {
      [j, row] = [j + 1, _Array_append(j, row)];
      continue;
    }
  }
};
const cellAt: _Curry<
  [a: string, b: string, i: number, j: number, prev: number[], cur: number[]],
  number
> = _curry(6, (a: string, b: string, i: number, j: number, prev: number[], cur: number[]) => {
  const cost: number = charsEq(a, i - 1, b, j - 1) ? 0 : 1;
  return min(min(at(cur, j - 1, 0) + 1, at(prev, j, 0) + 1), at(prev, j - 1, 0) + cost);
});
const fillRow: _Curry<[a: string, b: string, i: number, prev: number[], n: number], number[]> =
  _curry(5, (a: string, b: string, i: number, prev: number[], n: number) => {
    let j: number = 1;
    let cur: number[] = [i];
    while (true) {
      if (j > n) {
        return cur;
      } else {
        [j, cur] = [j + 1, _Array_append(cellAt(a, b, i, j, prev, cur), cur)];
        continue;
      }
    }
  });
const levFrom: _Curry<[a: string, b: string, m: number, n: number], number> = _curry(
  4,
  (a: string, b: string, m: number, n: number) => {
    let i: number = 1;
    let prev: number[] = initRow(n);
    while (true) {
      if (i > m) {
        return at(prev, n, n);
      } else {
        [i, prev] = [i + 1, fillRow(a, b, i, prev, n)];
        continue;
      }
    }
  },
);
const lev: _Curry<[a: string, b: string], number> = _curry(2, (a: string, b: string) => {
  const m: number = _Str_length(a);
  const n: number = _Str_length(b);
  return eq(m, 0) ? n : eq(n, 0) ? m : levFrom(a, b, m, n);
});
/**
 * `^[A-Z]` — identifier heads are ASCII. Empty and non-letters are lower.
 */
const upperStart: (s: string) => boolean = (s: string) =>
  match(_Str_codeAt(0, s))
    .with({ _tag: "Some" }, ({ value: n }) => and(n >= 65, n <= 90))
    .with({ _tag: "None" }, () => false)
    .exhaustive();
const sameCaseClass: _Curry<[a: string, b: string], boolean> = _curry(2, (a: string, b: string) =>
  eq(upperStart(a), upperStart(b)),
);
const skipName: _Curry<[want: string, n: string], boolean> = _curry(2, (want: string, n: string) =>
  or(
    or(or(or(eq(n, ""), eq(n, want)), _Str_startsWith("$", n)), _Str_startsWith("_", n)),
    not(sameCaseClass(want, n)),
  ),
);
const consider: _Curry<
  [want: string, budget: number, best: Option<string>, bestDist: number, n: string],
  [Option<string>, number]
> = _curry(5, (want: string, budget: number, best: Option<string>, bestDist: number, n: string) =>
  skipName(want, n)
    ? _tuple(best, bestDist)
    : ((d: number) =>
        and(d <= budget, d < bestDist)
          ? _tuple(Some(n) as Option<string>, d)
          : _tuple(best, bestDist))(lev(want, n)),
);
const closestFrom: _Curry<
  [
    want: string,
    names: string[],
    i: number,
    budget: number,
    best: Option<string>,
    bestDist: number,
  ],
  Option<string>
> = _curry(
  6,
  (
    want: string,
    names: string[],
    i: number,
    budget: number,
    best: Option<string>,
    bestDist: number,
  ) =>
    match(_Array_get(i, names))
      .with({ _tag: "None" }, () => best)
      .with({ _tag: "Some" }, ({ value: n }) =>
        (([next, dist]: [Option<string>, number]) =>
          closestFrom(want, names, i + 1, budget, next, dist))(
          consider(want, budget, best, bestDist, n),
        ),
      )
      .exhaustive(),
);
/**
 * Closest candidate within the edit-distance budget, or None.
 */
export const closestName: _Curry<[want: string, names: string[]], Option<string>> = _curry(
  2,
  (want: string, names: string[]) => {
    const budget: number = max(1, floor(_Str_length(want) / 3));
    return closestFrom(want, names, 0, budget, None as Option<string>, _Str_length(want) + 2);
  },
);
