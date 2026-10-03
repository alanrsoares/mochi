import type { PatField, Pattern } from "../ast/ast";

export type MP =
  | { _tag: "MWild" }
  | { _tag: "MCtor"; name: string; args: MP[] }
  | { _tag: "MBool"; value: boolean }
  | { _tag: "MNum"; value: number }
  | { _tag: "MStr"; value: string }
  | { _tag: "MTuple"; elems: MP[] }
  | { _tag: "MRecord"; labels: string[]; pats: MP[] }
  | { _tag: "MArr"; elems: MP[]; rest: boolean }
  | { _tag: "MOpaque" };
export type MHead =
  | { _tag: "HCtor"; name: string }
  | { _tag: "HBool"; value: boolean }
  | { _tag: "HNum"; value: number }
  | { _tag: "HStr"; value: string }
  | { _tag: "HTuple"; arity: number }
  | { _tag: "HRecord" }
  | { _tag: "HArr"; len: number };
export type URes =
  | { _tag: "UNone"; fuel: number }
  | { _tag: "USome"; row: MP[]; fuel: number }
  | { _tag: "UFuel" };
export type ExhaustVerdict =
  | { _tag: "ExOk" }
  | { _tag: "ExWitness"; witness: MP }
  | { _tag: "ExFuel" };
/**
 * The ctor registry as usefulness reads it. Declared here rather than imported
 * from check.mochi, which imports THIS module — a local record alias expands,
 * so it still unifies structurally with the caller's registry (ADR 0044).
 */
export type CtorInfo = { owner: string; arity: number };
export type Registry = { ctors: Map<string, CtorInfo>; types: Map<string, string[]> };
export type ArrShape = { fixed: number[]; restFrom: Option<number> };

import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_concat,
  _Array_contains,
  _Array_drop,
  _Array_flatMap,
  _Array_get,
  _Array_head,
  _Array_prepend,
  _Array_tail,
  _Array_take,
  _Map_get,
  _Map_getOr,
  _Map_keys,
  _Option_isSome,
  _Option_match,
  _Option_unwrapOr,
  _Str_concat,
  _Str_endsWith,
  _Str_join,
  _curry,
  add,
  and,
  eq,
  filter,
  gt,
  length,
  lt,
  lte,
  map,
  not,
  reduce,
  show,
  sub,
} from "@mochi/compiler/runtime";

import * as Ast from "../ast/ast";
const MWild: MP = { _tag: "MWild" };
const MCtor = _curry(2, (name, args) => ({ _tag: "MCtor", name, args })) as (
  name: string,
  args: MP[],
) => MP;
const MBool = (value: boolean): MP => ({ _tag: "MBool", value });
const MNum = (value: number): MP => ({ _tag: "MNum", value });
const MStr = (value: string): MP => ({ _tag: "MStr", value });
const MTuple = (elems: MP[]): MP => ({ _tag: "MTuple", elems });
const MRecord = _curry(2, (labels, pats) => ({ _tag: "MRecord", labels, pats })) as (
  labels: string[],
  pats: MP[],
) => MP;
const MArr = _curry(2, (elems, rest) => ({ _tag: "MArr", elems, rest })) as (
  elems: MP[],
  rest: boolean,
) => MP;
const MOpaque: MP = { _tag: "MOpaque" };
const HCtor = (name: string): MHead => ({ _tag: "HCtor", name });
const HBool = (value: boolean): MHead => ({ _tag: "HBool", value });
const HNum = (value: number): MHead => ({ _tag: "HNum", value });
const HStr = (value: string): MHead => ({ _tag: "HStr", value });
const HTuple = (arity: number): MHead => ({ _tag: "HTuple", arity });
const HRecord: MHead = { _tag: "HRecord" };
const HArr = (len: number): MHead => ({ _tag: "HArr", len });
const UNone = (fuel: number): URes => ({ _tag: "UNone", fuel });
const USome = _curry(2, (row, fuel) => ({ _tag: "USome", row, fuel })) as (
  row: MP[],
  fuel: number,
) => URes;
const UFuel: URes = { _tag: "UFuel" };
export const ExOk: ExhaustVerdict = { _tag: "ExOk" };
export const ExWitness = (witness: MP): ExhaustVerdict => ({ _tag: "ExWitness", witness });
export const ExFuel: ExhaustVerdict = { _tag: "ExFuel" };
const mWilds: (n: number) => MP[] = (n: number) =>
  n <= 0 ? ([] as MP[]) : _Array_prepend(MWild as MP, mWilds(sub(n, 1)));
const isWildMP: (mp: MP) => boolean = (mp: MP) => {
  const $match = mp;
  switch ($match._tag) {
    case "MWild": {
      return true;
    }
    default: {
      return false;
    }
  }
};
/**
 * Split top-level or-patterns into separate rows — each alt is its own row.
 */
export const explodePat: (p: Pattern) => Pattern[] = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return explodePat(pat);
    }
    case "POr": {
      const { alts } = $match;
      return _Array_flatMap(explodePat, alts);
    }
    default: {
      return [p];
    }
  }
};
const toMP: (p: Pattern) => MP = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return toMP(pat);
    }
    case "PWild": {
      return MWild as MP;
    }
    case "PUnit": {
      return MWild as MP;
    }
    case "PBind": {
      return MWild as MP;
    }
    case "PLit": {
      const { value: v } = $match;
      return MNum(v);
    }
    case "PBool": {
      const { value: v } = $match;
      return MBool(v);
    }
    case "PStr": {
      const { value: v } = $match;
      return MStr(v);
    }
    case "PTuple": {
      const { elems } = $match;
      return MTuple(map(toMP, elems));
    }
    case "PCtor": {
      const { ctor: name, args } = $match;
      return MCtor(name, map(toMP, args));
    }
    case "PRecord": {
      const { fields } = $match;
      return MRecord(
        map((f: PatField) => f.label, fields),
        map((f: PatField) => toMP(f.pat), fields),
      );
    }
    case "PArr": {
      const { elems, rest } = $match;
      return MArr(map(toMP, elems), _Option_isSome(rest));
    }
    case "PList": {
      return MOpaque as MP;
    }
    case "POr": {
      return MOpaque as MP;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const headOf: (mp: MP) => Option<MHead> = (mp: MP) => {
  const $match = mp;
  switch ($match._tag) {
    case "MWild": {
      return None as Option<MHead>;
    }
    case "MOpaque": {
      return None as Option<MHead>;
    }
    case "MCtor": {
      const { name: n } = $match;
      return Some(HCtor(n)) as Option<MHead>;
    }
    case "MBool": {
      const { value: v } = $match;
      return Some(HBool(v)) as Option<MHead>;
    }
    case "MNum": {
      const { value: v } = $match;
      return Some(HNum(v)) as Option<MHead>;
    }
    case "MStr": {
      const { value: v } = $match;
      return Some(HStr(v)) as Option<MHead>;
    }
    case "MTuple": {
      const { elems } = $match;
      return Some(HTuple(length(elems))) as Option<MHead>;
    }
    case "MRecord": {
      return Some(HRecord as MHead) as Option<MHead>;
    }
    case "MArr": {
      const { elems } = $match;
      return Some(HArr(length(elems))) as Option<MHead>;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const colOf: <A>(m: A[][]) => A[] = <A>(m: A[][]) =>
  _Array_flatMap((row: A[]) => {
    const $match = _Array_head(row);
    switch ($match._tag) {
      case "None": {
        return [] as A[];
      }
      case "Some": {
        const { value: hd } = $match;
        return [hd];
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  }, m);
const headsOf: (col: MP[]) => MHead[] = (col: MP[]) =>
  _Array_flatMap((mp: MP) => {
    const $match = headOf(mp);
    switch ($match._tag) {
      case "None": {
        return [] as MHead[];
      }
      case "Some": {
        const { value: h } = $match;
        return [h];
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  }, col);
const addLabel: <A>(acc: A[], l: A) => A[] = _curry(2, <A>(acc: A[], l: A) =>
  _Array_contains(l, acc) ? acc : _Array_append(l, acc),
);
const labelsOfMP: _Curry<[acc: string[], mp: MP], string[]> = _curry(2, (acc: string[], mp: MP) => {
  const $match = mp;
  switch ($match._tag) {
    case "MRecord": {
      const { labels: ls } = $match;
      return reduce(addLabel, acc, ls);
    }
    default: {
      return acc;
    }
  }
});
const recordLabelsOf: (col: MP[]) => string[] = (col: MP[]) =>
  reduce(labelsOfMP, [] as string[], col);
const indexOfLabel: <A>(l: A, labels: A[], i: number) => number = _curry(
  3,
  <A>(l: A, labels: A[], i: number) => {
    const $match = _Array_get(i, labels);
    switch ($match._tag) {
      case "None": {
        return sub(0, 1);
      }
      case "Some": {
        const { value: x } = $match;
        return eq(x, l) ? i : indexOfLabel(l, labels, i + 1);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const fieldOf: <A>(l: A, labels: A[], pats: MP[]) => MP = _curry(
  3,
  <A>(l: A, labels: A[], pats: MP[]) => {
    const i: number = indexOfLabel(l, labels, 0);
    return i < 0 ? (MWild as MP) : _Option_unwrapOr(MWild as MP, _Array_get(i, pats));
  },
);

const arrShapeStep: _Curry<[acc: ArrShape, mp: MP], ArrShape> = _curry(
  2,
  (acc: ArrShape, mp: MP) => {
    const $match = mp;
    switch ($match._tag) {
      case "MArr": {
        const { elems, rest } = $match;
        const n: number = length(elems);
        return rest
          ? {
              fixed: acc.fixed,
              restFrom: _Option_match(
                acc.restFrom,
                () => Some(n) as Option<number>,
                (m) => Some(m < n ? m : n) as Option<number>,
              ),
            }
          : {
              fixed: _Array_contains(n, acc.fixed) ? acc.fixed : _Array_append(n, acc.fixed),
              restFrom: acc.restFrom,
            };
      }
      default: {
        return acc;
      }
    }
  },
);
const arrShapeOf: (col: MP[]) => ArrShape = (col: MP[]) =>
  reduce(arrShapeStep, { fixed: [] as number[], restFrom: None as Option<number> }, col);
const rangeCovered: <A>(shape: { fixed: number[] } & A, i: number, n: number) => boolean = _curry(
  3,
  <A>(shape: { fixed: number[] } & A, i: number, n: number) =>
    i >= n ? true : and(_Array_contains(i, shape.fixed), rangeCovered(shape, i + 1, n)),
);
const arrComplete: <A>(shape: { restFrom: Option<number>; fixed: number[] } & A) => boolean = <A>(
  shape: { restFrom: Option<number>; fixed: number[] } & A,
) => {
  const $match = shape.restFrom;
  switch ($match._tag) {
    case "None": {
      return false;
    }
    case "Some": {
      const { value: r } = $match;
      return rangeCovered(shape, 0, r);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const arrMissingLen: <A>(
  shape: { fixed: number[]; restFrom: Option<number> } & A,
  n: number,
) => number = _curry(2, <A>(shape: { fixed: number[]; restFrom: Option<number> } & A, n: number) =>
  and(
    !_Array_contains(n, shape.fixed),
    _Option_match(
      shape.restFrom,
      () => true,
      (r) => n < r,
    ),
  )
    ? n
    : arrMissingLen(shape, n + 1),
);
const rangeArr: _Curry<[i: number, top: number], number[]> = _curry(2, (i: number, top: number) =>
  i > top ? ([] as number[]) : _Array_prepend(i, rangeArr(i + 1, top)),
);
const arrLengths: <A>(shape: { restFrom: Option<number>; fixed: number[] } & A) => number[] = <A>(
  shape: { restFrom: Option<number>; fixed: number[] } & A,
) => {
  const top: number = reduce(
    _curry(2, (a: number, x: number) => (x > a ? x : a)),
    _Option_unwrapOr(0, shape.restFrom),
    shape.fixed,
  );
  return rangeArr(0, top);
};
const specializeRow: _Curry<[h: MHead, mp: MP, labels: string[]], Option<MP[]>> = _curry(
  3,
  (h: MHead, mp: MP, labels: string[]) => {
    const $match = h;
    switch ($match._tag) {
      case "HCtor": {
        const { name } = $match;
        const $match$ = mp;
        switch ($match$._tag) {
          case "MCtor": {
            const { name: n, args } = $match$;
            return eq(n, name) ? (Some(args) as Option<MP[]>) : (None as Option<MP[]>);
          }
          default: {
            return None as Option<MP[]>;
          }
        }
      }
      case "HBool": {
        const { value: v } = $match;
        const $match$ = mp;
        switch ($match$._tag) {
          case "MBool": {
            const { value: b } = $match$;
            return eq(b, v) ? (Some([] as MP[]) as Option<MP[]>) : (None as Option<MP[]>);
          }
          default: {
            return None as Option<MP[]>;
          }
        }
      }
      case "HNum": {
        const { value: v } = $match;
        const $match$ = mp;
        switch ($match$._tag) {
          case "MNum": {
            const { value: x } = $match$;
            return eq(x, v) ? (Some([] as MP[]) as Option<MP[]>) : (None as Option<MP[]>);
          }
          default: {
            return None as Option<MP[]>;
          }
        }
      }
      case "HStr": {
        const { value: v } = $match;
        const $match$ = mp;
        switch ($match$._tag) {
          case "MStr": {
            const { value: x } = $match$;
            return eq(x, v) ? (Some([] as MP[]) as Option<MP[]>) : (None as Option<MP[]>);
          }
          default: {
            return None as Option<MP[]>;
          }
        }
      }
      case "HTuple": {
        const $match$ = mp;
        switch ($match$._tag) {
          case "MTuple": {
            const { elems } = $match$;
            return Some(elems) as Option<MP[]>;
          }
          default: {
            return None as Option<MP[]>;
          }
        }
      }
      case "HRecord": {
        const $match$ = mp;
        switch ($match$._tag) {
          case "MRecord": {
            const { labels: ls, pats: ps } = $match$;
            return Some(map((l: string) => fieldOf(l, ls, ps), labels)) as Option<MP[]>;
          }
          default: {
            return None as Option<MP[]>;
          }
        }
      }
      case "HArr": {
        const { len } = $match;
        const $match$ = mp;
        switch ($match$._tag) {
          case "MArr": {
            const { elems, rest } = $match$;
            const k: number = length(elems);
            return rest
              ? k <= len
                ? (Some(_Array_concat(elems, mWilds(sub(len, k)))) as Option<MP[]>)
                : (None as Option<MP[]>)
              : eq(k, len)
                ? (Some(elems) as Option<MP[]>)
                : (None as Option<MP[]>);
          }
          default: {
            return None as Option<MP[]>;
          }
        }
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const specializeOne: _Curry<[h: MHead, arity: number, labels: string[], row: MP[]], MP[][]> =
  _curry(4, (h: MHead, arity: number, labels: string[], row: MP[]) => {
    const $match = _Array_head(row);
    switch ($match._tag) {
      case "None": {
        return [] as MP[][];
      }
      case "Some": {
        const { value: hd } = $match;
        const rest: MP[] = _Array_tail(row);
        return isWildMP(hd)
          ? [_Array_concat(mWilds(arity), rest)]
          : _Option_match(
              specializeRow(h, hd, labels),
              () => [] as MP[][],
              (sub) => [_Array_concat(sub, rest)],
            );
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  });
const specializeM: _Curry<[m: MP[][], h: MHead, arity: number, labels: string[]], MP[][]> = _curry(
  4,
  (m: MP[][], h: MHead, arity: number, labels: string[]) =>
    _Array_flatMap((row: MP[]) => specializeOne(h, arity, labels, row), m),
);
const defaultM: (m: MP[][]) => MP[][] = (m: MP[][]) =>
  _Array_flatMap((row: MP[]) => {
    const $match = _Array_head(row);
    switch ($match._tag) {
      case "None": {
        return [] as MP[][];
      }
      case "Some": {
        const { value: hd } = $match;
        return isWildMP(hd) ? [_Array_tail(row)] : ([] as MP[][]);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  }, m);
const rebuild: _Curry<[h: MHead, args: MP[], labels: string[]], MP> = _curry(
  3,
  (h: MHead, args: MP[], labels: string[]) => {
    const $match = h;
    switch ($match._tag) {
      case "HCtor": {
        const { name } = $match;
        return MCtor(name, args);
      }
      case "HTuple": {
        return MTuple(args);
      }
      case "HRecord": {
        return MRecord(labels, args);
      }
      case "HArr": {
        return MArr(args, false);
      }
      case "HBool": {
        const { value: v } = $match;
        return MBool(v);
      }
      case "HNum": {
        const { value: v } = $match;
        return MNum(v);
      }
      case "HStr": {
        const { value: v } = $match;
        return MStr(v);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const takenNums: (heads: MHead[]) => number[] = (heads: MHead[]) =>
  _Array_flatMap((h: MHead) => {
    const $match = h;
    switch ($match._tag) {
      case "HNum": {
        const { value: v } = $match;
        return [v];
      }
      default: {
        return [] as number[];
      }
    }
  }, heads);
const freshNum: _Curry<[taken: number[], i: number], number> = _curry(
  2,
  (taken: number[], i: number) => (_Array_contains(i, taken) ? freshNum(taken, i + 1) : i),
);
const takenStrs: (heads: MHead[]) => string[] = (heads: MHead[]) =>
  _Array_flatMap((h: MHead) => {
    const $match = h;
    switch ($match._tag) {
      case "HStr": {
        const { value: v } = $match;
        return [v];
      }
      default: {
        return [] as string[];
      }
    }
  }, heads);
const starsOf: (n: number) => string = (n: number) =>
  n <= 0 ? "" : _Str_concat("*", starsOf(sub(n, 1)));
const freshStr: _Curry<[taken: string[], i: number], string> = _curry(
  2,
  (taken: string[], i: number) => {
    const s: string = starsOf(i);
    return _Array_contains(s, taken) ? freshStr(taken, i + 1) : s;
  },
);
const ctorNames: (heads: MHead[]) => string[] = (heads: MHead[]) =>
  _Array_flatMap((h: MHead) => {
    const $match = h;
    switch ($match._tag) {
      case "HCtor": {
        const { name: n } = $match;
        return [n];
      }
      default: {
        return [] as string[];
      }
    }
  }, heads);
const boolVals: (heads: MHead[]) => boolean[] = (heads: MHead[]) =>
  _Array_flatMap((h: MHead) => {
    const $match = h;
    switch ($match._tag) {
      case "HBool": {
        const { value: v } = $match;
        return [v];
      }
      default: {
        return [] as boolean[];
      }
    }
  }, heads);
const ctorInfoSuffixed: _Curry<
  [keys: string[], reg: Registry, n: string],
  Option<CtorInfo>
> = _curry(3, (keys: string[], reg: Registry, n: string) =>
  ((_v) =>
    _v.length === 0
      ? (None as Option<CtorInfo>)
      : _v.length >= 1
        ? (([k, ...rest]) =>
            _Str_endsWith(`.${n}`, k) ? _Map_get(k, reg.ctors) : ctorInfoSuffixed(rest, reg, n))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(keys),
);
const ctorInfoOf: _Curry<[reg: Registry, n: string], Option<CtorInfo>> = _curry(
  2,
  (reg: Registry, n: string) => {
    const $match = _Map_get(n, reg.ctors);
    switch ($match._tag) {
      case "Some": {
        const { value: info } = $match;
        return Some(info) as Option<CtorInfo>;
      }
      case "None": {
        return ctorInfoSuffixed(_Map_keys(reg.ctors), reg, n);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const arityOfCtor: _Curry<[reg: Registry, n: string], number> = _curry(
  2,
  (reg: Registry, n: string) => {
    const $match = ctorInfoOf(reg, n);
    switch ($match._tag) {
      case "None": {
        return 0;
      }
      case "Some": {
        const { value: info } = $match;
        return info.arity;
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const ownerOfCtor: _Curry<[reg: Registry, n: string], Option<string>> = _curry(
  2,
  (reg: Registry, n: string) => {
    const $match = ctorInfoOf(reg, n);
    switch ($match._tag) {
      case "None": {
        return None as Option<string>;
      }
      case "Some": {
        const { value: info } = $match;
        return Some(info.owner) as Option<string>;
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const allNamesIn: <A>(all: A[], names: A[]) => boolean = _curry(2, <A>(all: A[], names: A[]) =>
  reduce(
    _curry(2, (acc: boolean, n: A) => and(acc, _Array_contains(n, names))),
    true,
    all,
  ),
);
const useful: _Curry<[m: MP[][], width: number, reg: Registry, fuel: number], URes> = _curry(
  4,
  (m: MP[][], width: number, reg: Registry, fuel: number) =>
    fuel <= 0
      ? (UFuel as URes)
      : width === 0
        ? length(m) === 0
          ? USome([] as MP[], sub(fuel, 1))
          : UNone(sub(fuel, 1))
        : length(m) === 0
          ? USome(mWilds(width), sub(fuel, 1))
          : usefulSplit(m, width, reg, sub(fuel, 1)),
);
const usefulSplit: _Curry<[m: MP[][], width: number, reg: Registry, fuel: number], URes> = _curry(
  4,
  (m: MP[][], width: number, reg: Registry, fuel: number) => {
    const col: MP[] = colOf(m);
    const heads: MHead[] = headsOf(col);
    const $match = _Array_head(heads);
    switch ($match._tag) {
      case "None": {
        return prependWitness(MWild as MP, useful(defaultM(m), sub(width, 1), reg, fuel));
      }
      case "Some": {
        const { value: h0 } = $match;
        return usefulHead(m, col, heads, h0, width, reg, fuel);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const prependWitness: _Curry<[mp: MP, r: URes], URes> = _curry(2, (mp: MP, r: URes) => {
  const $match = r;
  switch ($match._tag) {
    case "UFuel": {
      return UFuel as URes;
    }
    case "UNone": {
      const { fuel: f } = $match;
      return UNone(f);
    }
    case "USome": {
      const { row, fuel: f } = $match;
      return USome(_Array_prepend(mp, row), f);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
const tryHeads: _Curry<
  [
    m: MP[][],
    heads: MHead[],
    arities: number[],
    labels: string[],
    width: number,
    reg: Registry,
    fuel: number,
    i: number,
  ],
  URes
> = _curry(
  8,
  (
    m: MP[][],
    heads: MHead[],
    arities: number[],
    labels: string[],
    width: number,
    reg: Registry,
    fuel: number,
    i: number,
  ) => {
    const $match = _Array_get(i, heads);
    switch ($match._tag) {
      case "None": {
        return UNone(fuel);
      }
      case "Some": {
        const { value: h } = $match;
        const arity: number = _Option_unwrapOr(0, _Array_get(i, arities));
        const $match$ = useful(specializeM(m, h, arity, labels), sub(arity + width, 1), reg, fuel);
        switch ($match$._tag) {
          case "UFuel": {
            return UFuel as URes;
          }
          case "UNone": {
            const { fuel: f2 } = $match$;
            return tryHeads(m, heads, arities, labels, width, reg, f2, i + 1);
          }
          case "USome": {
            const { row, fuel: f2 } = $match$;
            return USome(
              _Array_prepend(rebuild(h, _Array_take(arity, row), labels), _Array_drop(arity, row)),
              f2,
            );
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const usefulHead: _Curry<
  [m: MP[][], col: MP[], heads: MHead[], h0: MHead, width: number, reg: Registry, fuel: number],
  URes
> = _curry(
  7,
  (m: MP[][], col: MP[], heads: MHead[], h0: MHead, width: number, reg: Registry, fuel: number) => {
    const $match = h0;
    switch ($match._tag) {
      case "HTuple": {
        const { arity } = $match;
        return tryHeads(m, [HTuple(arity)], [arity], [] as string[], width, reg, fuel, 0);
      }
      case "HRecord": {
        const labels: string[] = recordLabelsOf(col);
        return tryHeads(m, [HRecord as MHead], [length(labels)], labels, width, reg, fuel, 0);
      }
      case "HCtor": {
        return usefulCtor(m, heads, width, reg, fuel);
      }
      case "HBool": {
        return usefulBool(m, heads, width, reg, fuel);
      }
      case "HArr": {
        return usefulArr(m, col, width, reg, fuel);
      }
      case "HNum": {
        return prependWitness(
          MNum(freshNum(takenNums(heads), 0)),
          useful(defaultM(m), sub(width, 1), reg, fuel),
        );
      }
      case "HStr": {
        return prependWitness(
          MStr(freshStr(takenStrs(heads), 0)),
          useful(defaultM(m), sub(width, 1), reg, fuel),
        );
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const usefulCtor: _Curry<
  [m: MP[][], heads: MHead[], width: number, reg: Registry, fuel: number],
  URes
> = _curry(5, (m: MP[][], heads: MHead[], width: number, reg: Registry, fuel: number) => {
  const names: string[] = ctorNames(heads);
  const ownerOpt: Option<string> = _Option_match(
    _Array_head(names),
    () => None as Option<string>,
    (n) => ownerOfCtor(reg, n),
  );
  const all: string[] = _Option_match(
    ownerOpt,
    () => [] as string[],
    (o) => _Map_getOr([] as string[], o, reg.types),
  );
  return and(length(all) > 0, allNamesIn(all, names))
    ? tryHeads(
        m,
        map((n: string) => HCtor(n), all),
        map((n: string) => arityOfCtor(reg, n), all),
        [] as string[],
        width,
        reg,
        fuel,
        0,
      )
    : prependWitness(
        _Option_match(
          _Array_head(filter((n: string) => !_Array_contains(n, names), all)),
          () => MWild as MP,
          (n) => MCtor(n, mWilds(arityOfCtor(reg, n))),
        ),
        useful(defaultM(m), sub(width, 1), reg, fuel),
      );
});
const usefulBool: _Curry<
  [m: MP[][], heads: MHead[], width: number, reg: Registry, fuel: number],
  URes
> = _curry(5, (m: MP[][], heads: MHead[], width: number, reg: Registry, fuel: number) => {
  const vs: boolean[] = boolVals(heads);
  const hasTrue: boolean = _Array_contains(true, vs);
  return and(hasTrue, _Array_contains(false, vs))
    ? tryHeads(m, [HBool(true), HBool(false)], [0, 0], [] as string[], width, reg, fuel, 0)
    : prependWitness(MBool(!hasTrue), useful(defaultM(m), sub(width, 1), reg, fuel));
});
const usefulArr: _Curry<[m: MP[][], col: MP[], width: number, reg: Registry, fuel: number], URes> =
  _curry(5, (m: MP[][], col: MP[], width: number, reg: Registry, fuel: number) => {
    const shape: ArrShape = arrShapeOf(col);
    return arrComplete(shape)
      ? ((lens: number[]) =>
          tryHeads(
            m,
            map((n: number) => HArr(n), lens),
            lens,
            [] as string[],
            width,
            reg,
            fuel,
            0,
          ))(arrLengths(shape))
      : prependWitness(
          MArr(mWilds(arrMissingLen(shape, 0)), false),
          useful(defaultM(m), sub(width, 1), reg, fuel),
        );
  });
const showFields: _Curry<[labels: string[], pats: MP[], i: number], string[]> = _curry(
  3,
  (labels: string[], pats: MP[], i: number) => {
    const $match = _Array_get(i, labels);
    switch ($match._tag) {
      case "None": {
        return [] as string[];
      }
      case "Some": {
        const { value: l } = $match;
        return _Array_prepend(
          `${l}: ${showWitness(_Option_unwrapOr(MWild as MP, _Array_get(i, pats)))}`,
          showFields(labels, pats, i + 1),
        );
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
/**
 * Render a witness the way the user would have to write it as an arm.
 */
export const showWitness: (mp: MP) => string = (mp: MP) => {
  const $match = mp;
  switch ($match._tag) {
    case "MWild": {
      return "_";
    }
    case "MOpaque": {
      return "_";
    }
    case "MBool": {
      const { value: v } = $match;
      return show(v);
    }
    case "MNum": {
      const { value: v } = $match;
      return show(v);
    }
    case "MStr": {
      const { value: v } = $match;
      return show(v);
    }
    case "MCtor": {
      const { name: n, args } = $match;
      return length(args) === 0 ? n : `${n}(${_Str_join(", ", map(showWitness, args))})`;
    }
    case "MTuple": {
      const { elems } = $match;
      return `(${_Str_join(", ", map(showWitness, elems))})`;
    }
    case "MRecord": {
      const { labels, pats } = $match;
      return `{ ${_Str_join(", ", showFields(labels, pats, 0))} }`;
    }
    case "MArr": {
      const { elems, rest } = $match;
      return `[${_Str_join(", ", _Array_concat(map(showWitness, elems), rest ? ["..."] : ([] as string[])))}]`;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
/**
 * A witness that is one constructor over nothing but wildcards is the shape the
 * pre-matrix checker reported as `missing X` — check.mochi keeps that wording
 * for it, so the everyday "you forgot a variant" case reads as it always has.
 * Witnesses that say nothing a constructor name would not say better: a bare
 * wildcard (every arm was guarded, so nothing is covered) or one constructor
 * over wildcards. For these check.mochi keeps the legacy `missing X` wording.
 */
export const isWideWitnessM: (mp: MP) => boolean = (mp: MP) => {
  const $match = mp;
  switch ($match._tag) {
    case "MWild": {
      return true;
    }
    case "MCtor": {
      const { args } = $match;
      return reduce(
        _curry(2, (acc: boolean, a: MP) => and(acc, isWildMP(a))),
        true,
        args,
      );
    }
    default: {
      return false;
    }
  }
};
/**
 * Is this set of (unguarded) arm patterns total? Guarded arms must not be
 * passed — a guard can be false, so such an arm proves nothing.
 */
export const checkExhaustiveM: _Curry<[patterns: Pattern[], reg: Registry], ExhaustVerdict> =
  _curry(2, (patterns: Pattern[], reg: Registry) => {
    const rows: MP[][] = _Array_flatMap(
      (p: Pattern) => map((alt: Pattern) => [toMP(alt)], explodePat(p)),
      patterns,
    );
    const $match = useful(rows, 1, reg, 20000);
    switch ($match._tag) {
      case "UFuel": {
        return ExFuel as ExhaustVerdict;
      }
      case "UNone": {
        return ExOk as ExhaustVerdict;
      }
      case "USome": {
        const { row } = $match;
        return ExWitness(_Option_unwrapOr(MWild as MP, _Array_head(row)));
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  });
