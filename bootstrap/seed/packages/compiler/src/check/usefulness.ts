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
const isWildMP: (mp: MP) => boolean = (mp: MP) =>
  ((_v) => (_v._tag === "MWild" ? true : false))(mp);
/**
 * Split top-level or-patterns into separate rows — each alt is its own row.
 */
export const explodePat: (p: Pattern) => Pattern[] = (p: Pattern) =>
  ((_v) =>
    _v._tag === "PAs"
      ? (({ pat }) => explodePat(pat))(_v)
      : _v._tag === "POr"
        ? (({ alts }) => _Array_flatMap(explodePat, alts))(_v)
        : [p])(p);
const toMP: (p: Pattern) => MP = (p: Pattern) =>
  ((_v) =>
    _v._tag === "PAs"
      ? (({ pat }) => toMP(pat))(_v)
      : _v._tag === "PWild"
        ? (MWild as MP)
        : _v._tag === "PUnit"
          ? (MWild as MP)
          : _v._tag === "PBind"
            ? (MWild as MP)
            : _v._tag === "PLit"
              ? (({ value: v }) => MNum(v))(_v)
              : _v._tag === "PBool"
                ? (({ value: v }) => MBool(v))(_v)
                : _v._tag === "PStr"
                  ? (({ value: v }) => MStr(v))(_v)
                  : _v._tag === "PTuple"
                    ? (({ elems }) => MTuple(map(toMP, elems)))(_v)
                    : _v._tag === "PCtor"
                      ? (({ ctor: name, args }) => MCtor(name, map(toMP, args)))(_v)
                      : _v._tag === "PRecord"
                        ? (({ fields }) =>
                            MRecord(
                              map((f: PatField) => f.label, fields),
                              map((f: PatField) => toMP(f.pat), fields),
                            ))(_v)
                        : _v._tag === "PArr"
                          ? (({ elems, rest }) => MArr(map(toMP, elems), _Option_isSome(rest)))(_v)
                          : _v._tag === "PList"
                            ? (MOpaque as MP)
                            : _v._tag === "POr"
                              ? (MOpaque as MP)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(p);
const headOf: (mp: MP) => Option<MHead> = (mp: MP) =>
  ((_v) =>
    _v._tag === "MWild"
      ? (None as Option<MHead>)
      : _v._tag === "MOpaque"
        ? (None as Option<MHead>)
        : _v._tag === "MCtor"
          ? (({ name: n }) => Some(HCtor(n)) as Option<MHead>)(_v)
          : _v._tag === "MBool"
            ? (({ value: v }) => Some(HBool(v)) as Option<MHead>)(_v)
            : _v._tag === "MNum"
              ? (({ value: v }) => Some(HNum(v)) as Option<MHead>)(_v)
              : _v._tag === "MStr"
                ? (({ value: v }) => Some(HStr(v)) as Option<MHead>)(_v)
                : _v._tag === "MTuple"
                  ? (({ elems }) => Some(HTuple(length(elems))) as Option<MHead>)(_v)
                  : _v._tag === "MRecord"
                    ? (Some(HRecord as MHead) as Option<MHead>)
                    : _v._tag === "MArr"
                      ? (({ elems }) => Some(HArr(length(elems))) as Option<MHead>)(_v)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(mp);
const colOf: <A>(m: A[][]) => A[] = <A>(m: A[][]) =>
  _Array_flatMap(
    (row: A[]) =>
      ((_v) =>
        _v._tag === "None"
          ? ([] as A[])
          : _v._tag === "Some"
            ? (({ value: hd }) => [hd])(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_head(row)),
    m,
  );
const headsOf: (col: MP[]) => MHead[] = (col: MP[]) =>
  _Array_flatMap(
    (mp: MP) =>
      ((_v) =>
        _v._tag === "None"
          ? ([] as MHead[])
          : _v._tag === "Some"
            ? (({ value: h }) => [h])(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(headOf(mp)),
    col,
  );
const addLabel: <A>(acc: A[], l: A) => A[] = _curry(2, <A>(acc: A[], l: A) =>
  _Array_contains(l, acc) ? acc : _Array_append(l, acc),
);
const labelsOfMP: _Curry<[acc: string[], mp: MP], string[]> = _curry(2, (acc: string[], mp: MP) =>
  ((_v) => (_v._tag === "MRecord" ? (({ labels: ls }) => reduce(addLabel, acc, ls))(_v) : acc))(mp),
);
const recordLabelsOf: (col: MP[]) => string[] = (col: MP[]) =>
  reduce(labelsOfMP, [] as string[], col);
const indexOfLabel: <A>(l: A, labels: A[], i: number) => number = _curry(
  3,
  <A>(l: A, labels: A[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? sub(0, 1)
        : _v._tag === "Some"
          ? (({ value: x }) => (eq(x, l) ? i : indexOfLabel(l, labels, i + 1)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, labels)),
);
const fieldOf: <A>(l: A, labels: A[], pats: MP[]) => MP = _curry(
  3,
  <A>(l: A, labels: A[], pats: MP[]) => {
    const i: number = indexOfLabel(l, labels, 0);
    return i < 0 ? (MWild as MP) : _Option_unwrapOr(MWild as MP, _Array_get(i, pats));
  },
);

const arrShapeStep: _Curry<[acc: ArrShape, mp: MP], ArrShape> = _curry(2, (acc: ArrShape, mp: MP) =>
  ((_v) =>
    _v._tag === "MArr"
      ? (({ elems, rest }) =>
          ((n: number) =>
            rest
              ? {
                  fixed: acc.fixed,
                  restFrom: ((_v) =>
                    _v._tag === "None"
                      ? (Some(n) as Option<number>)
                      : _v._tag === "Some"
                        ? (({ value: m }) => Some(m < n ? m : n) as Option<number>)(_v)
                        : (() => {
                            throw new Error("non-exhaustive match");
                          })())(acc.restFrom),
                }
              : {
                  fixed: _Array_contains(n, acc.fixed) ? acc.fixed : _Array_append(n, acc.fixed),
                  restFrom: acc.restFrom,
                })(length(elems)))(_v)
      : acc)(mp),
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
) =>
  ((_v) =>
    _v._tag === "None"
      ? false
      : _v._tag === "Some"
        ? (({ value: r }) => rangeCovered(shape, 0, r))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(shape.restFrom);
const arrMissingLen: <A>(
  shape: { fixed: number[]; restFrom: Option<number> } & A,
  n: number,
) => number = _curry(2, <A>(shape: { fixed: number[]; restFrom: Option<number> } & A, n: number) =>
  and(
    !_Array_contains(n, shape.fixed),
    ((_v) =>
      _v._tag === "None"
        ? true
        : _v._tag === "Some"
          ? (({ value: r }) => n < r)(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(shape.restFrom),
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
  (h: MHead, mp: MP, labels: string[]) =>
    ((_v) =>
      _v._tag === "HCtor"
        ? (({ name }) =>
            ((_v) =>
              _v._tag === "MCtor"
                ? (({ name: n, args }) =>
                    eq(n, name) ? (Some(args) as Option<MP[]>) : (None as Option<MP[]>))(_v)
                : (None as Option<MP[]>))(mp))(_v)
        : _v._tag === "HBool"
          ? (({ value: v }) =>
              ((_v) =>
                _v._tag === "MBool"
                  ? (({ value: b }) =>
                      eq(b, v) ? (Some([] as MP[]) as Option<MP[]>) : (None as Option<MP[]>))(_v)
                  : (None as Option<MP[]>))(mp))(_v)
          : _v._tag === "HNum"
            ? (({ value: v }) =>
                ((_v) =>
                  _v._tag === "MNum"
                    ? (({ value: x }) =>
                        eq(x, v) ? (Some([] as MP[]) as Option<MP[]>) : (None as Option<MP[]>))(_v)
                    : (None as Option<MP[]>))(mp))(_v)
            : _v._tag === "HStr"
              ? (({ value: v }) =>
                  ((_v) =>
                    _v._tag === "MStr"
                      ? (({ value: x }) =>
                          eq(x, v) ? (Some([] as MP[]) as Option<MP[]>) : (None as Option<MP[]>))(
                          _v,
                        )
                      : (None as Option<MP[]>))(mp))(_v)
              : _v._tag === "HTuple"
                ? ((_v) =>
                    _v._tag === "MTuple"
                      ? (({ elems }) => Some(elems) as Option<MP[]>)(_v)
                      : (None as Option<MP[]>))(mp)
                : _v._tag === "HRecord"
                  ? ((_v) =>
                      _v._tag === "MRecord"
                        ? (({ labels: ls, pats: ps }) =>
                            Some(map((l: string) => fieldOf(l, ls, ps), labels)) as Option<MP[]>)(
                            _v,
                          )
                        : (None as Option<MP[]>))(mp)
                  : _v._tag === "HArr"
                    ? (({ len }) =>
                        ((_v) =>
                          _v._tag === "MArr"
                            ? (({ elems, rest }) =>
                                ((k: number) =>
                                  rest
                                    ? k <= len
                                      ? (Some(_Array_concat(elems, mWilds(sub(len, k)))) as Option<
                                          MP[]
                                        >)
                                      : (None as Option<MP[]>)
                                    : eq(k, len)
                                      ? (Some(elems) as Option<MP[]>)
                                      : (None as Option<MP[]>))(length(elems)))(_v)
                            : (None as Option<MP[]>))(mp))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(h),
);
const specializeOne: _Curry<[h: MHead, arity: number, labels: string[], row: MP[]], MP[][]> =
  _curry(4, (h: MHead, arity: number, labels: string[], row: MP[]) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as MP[][])
        : _v._tag === "Some"
          ? (({ value: hd }) =>
              ((rest: MP[]) =>
                isWildMP(hd)
                  ? [_Array_concat(mWilds(arity), rest)]
                  : ((_v) =>
                      _v._tag === "None"
                        ? ([] as MP[][])
                        : _v._tag === "Some"
                          ? (({ value: sub }) => [_Array_concat(sub, rest)])(_v)
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(specializeRow(h, hd, labels)))(_Array_tail(row)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_head(row)),
  );
const specializeM: _Curry<[m: MP[][], h: MHead, arity: number, labels: string[]], MP[][]> = _curry(
  4,
  (m: MP[][], h: MHead, arity: number, labels: string[]) =>
    _Array_flatMap((row: MP[]) => specializeOne(h, arity, labels, row), m),
);
const defaultM: (m: MP[][]) => MP[][] = (m: MP[][]) =>
  _Array_flatMap(
    (row: MP[]) =>
      ((_v) =>
        _v._tag === "None"
          ? ([] as MP[][])
          : _v._tag === "Some"
            ? (({ value: hd }) => (isWildMP(hd) ? [_Array_tail(row)] : ([] as MP[][])))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_head(row)),
    m,
  );
const rebuild: _Curry<[h: MHead, args: MP[], labels: string[]], MP> = _curry(
  3,
  (h: MHead, args: MP[], labels: string[]) =>
    ((_v) =>
      _v._tag === "HCtor"
        ? (({ name }) => MCtor(name, args))(_v)
        : _v._tag === "HTuple"
          ? MTuple(args)
          : _v._tag === "HRecord"
            ? MRecord(labels, args)
            : _v._tag === "HArr"
              ? MArr(args, false)
              : _v._tag === "HBool"
                ? (({ value: v }) => MBool(v))(_v)
                : _v._tag === "HNum"
                  ? (({ value: v }) => MNum(v))(_v)
                  : _v._tag === "HStr"
                    ? (({ value: v }) => MStr(v))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(h),
);
const takenNums: (heads: MHead[]) => number[] = (heads: MHead[]) =>
  _Array_flatMap(
    (h: MHead) =>
      ((_v) => (_v._tag === "HNum" ? (({ value: v }) => [v])(_v) : ([] as number[])))(h),
    heads,
  );
const freshNum: _Curry<[taken: number[], i: number], number> = _curry(
  2,
  (taken: number[], i: number) => (_Array_contains(i, taken) ? freshNum(taken, i + 1) : i),
);
const takenStrs: (heads: MHead[]) => string[] = (heads: MHead[]) =>
  _Array_flatMap(
    (h: MHead) =>
      ((_v) => (_v._tag === "HStr" ? (({ value: v }) => [v])(_v) : ([] as string[])))(h),
    heads,
  );
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
  _Array_flatMap(
    (h: MHead) =>
      ((_v) => (_v._tag === "HCtor" ? (({ name: n }) => [n])(_v) : ([] as string[])))(h),
    heads,
  );
const boolVals: (heads: MHead[]) => boolean[] = (heads: MHead[]) =>
  _Array_flatMap(
    (h: MHead) =>
      ((_v) => (_v._tag === "HBool" ? (({ value: v }) => [v])(_v) : ([] as boolean[])))(h),
    heads,
  );
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
  (reg: Registry, n: string) =>
    ((_v) =>
      _v._tag === "Some"
        ? (({ value: info }) => Some(info) as Option<CtorInfo>)(_v)
        : _v._tag === "None"
          ? ctorInfoSuffixed(_Map_keys(reg.ctors), reg, n)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Map_get(n, reg.ctors)),
);
const arityOfCtor: _Curry<[reg: Registry, n: string], number> = _curry(
  2,
  (reg: Registry, n: string) =>
    ((_v) =>
      _v._tag === "None"
        ? 0
        : _v._tag === "Some"
          ? (({ value: info }) => info.arity)(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(ctorInfoOf(reg, n)),
);
const ownerOfCtor: _Curry<[reg: Registry, n: string], Option<string>> = _curry(
  2,
  (reg: Registry, n: string) =>
    ((_v) =>
      _v._tag === "None"
        ? (None as Option<string>)
        : _v._tag === "Some"
          ? (({ value: info }) => Some(info.owner) as Option<string>)(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(ctorInfoOf(reg, n)),
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
    return ((_v) =>
      _v._tag === "None"
        ? prependWitness(MWild as MP, useful(defaultM(m), sub(width, 1), reg, fuel))
        : _v._tag === "Some"
          ? (({ value: h0 }) => usefulHead(m, col, heads, h0, width, reg, fuel))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_head(heads));
  },
);
const prependWitness: _Curry<[mp: MP, r: URes], URes> = _curry(2, (mp: MP, r: URes) =>
  ((_v) =>
    _v._tag === "UFuel"
      ? (UFuel as URes)
      : _v._tag === "UNone"
        ? (({ fuel: f }) => UNone(f))(_v)
        : _v._tag === "USome"
          ? (({ row, fuel: f }) => USome(_Array_prepend(mp, row), f))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(r),
);
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
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? UNone(fuel)
        : _v._tag === "Some"
          ? (({ value: h }) =>
              ((arity: number) =>
                ((_v) =>
                  _v._tag === "UFuel"
                    ? (UFuel as URes)
                    : _v._tag === "UNone"
                      ? (({ fuel: f2 }) =>
                          tryHeads(m, heads, arities, labels, width, reg, f2, i + 1))(_v)
                      : _v._tag === "USome"
                        ? (({ row, fuel: f2 }) =>
                            USome(
                              _Array_prepend(
                                rebuild(h, _Array_take(arity, row), labels),
                                _Array_drop(arity, row),
                              ),
                              f2,
                            ))(_v)
                        : (() => {
                            throw new Error("non-exhaustive match");
                          })())(
                  useful(specializeM(m, h, arity, labels), sub(arity + width, 1), reg, fuel),
                ))(_Option_unwrapOr(0, _Array_get(i, arities))))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, heads)),
);
const usefulHead: _Curry<
  [m: MP[][], col: MP[], heads: MHead[], h0: MHead, width: number, reg: Registry, fuel: number],
  URes
> = _curry(
  7,
  (m: MP[][], col: MP[], heads: MHead[], h0: MHead, width: number, reg: Registry, fuel: number) =>
    ((_v) =>
      _v._tag === "HTuple"
        ? (({ arity }) =>
            tryHeads(m, [HTuple(arity)], [arity], [] as string[], width, reg, fuel, 0))(_v)
        : _v._tag === "HRecord"
          ? ((labels: string[]) =>
              tryHeads(m, [HRecord as MHead], [length(labels)], labels, width, reg, fuel, 0))(
              recordLabelsOf(col),
            )
          : _v._tag === "HCtor"
            ? usefulCtor(m, heads, width, reg, fuel)
            : _v._tag === "HBool"
              ? usefulBool(m, heads, width, reg, fuel)
              : _v._tag === "HArr"
                ? usefulArr(m, col, width, reg, fuel)
                : _v._tag === "HNum"
                  ? prependWitness(
                      MNum(freshNum(takenNums(heads), 0)),
                      useful(defaultM(m), sub(width, 1), reg, fuel),
                    )
                  : _v._tag === "HStr"
                    ? prependWitness(
                        MStr(freshStr(takenStrs(heads), 0)),
                        useful(defaultM(m), sub(width, 1), reg, fuel),
                      )
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(h0),
);
const usefulCtor: _Curry<
  [m: MP[][], heads: MHead[], width: number, reg: Registry, fuel: number],
  URes
> = _curry(5, (m: MP[][], heads: MHead[], width: number, reg: Registry, fuel: number) => {
  const names: string[] = ctorNames(heads);
  const ownerOpt: Option<string> = ((_v) =>
    _v._tag === "None"
      ? (None as Option<string>)
      : _v._tag === "Some"
        ? (({ value: n }) => ownerOfCtor(reg, n))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_head(names));
  const all: string[] = ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: o }) => _Map_getOr([] as string[], o, reg.types))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(ownerOpt);
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
        ((_v) =>
          _v._tag === "None"
            ? (MWild as MP)
            : _v._tag === "Some"
              ? (({ value: n }) => MCtor(n, mWilds(arityOfCtor(reg, n))))(_v)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(_Array_head(filter((n: string) => !_Array_contains(n, names), all))),
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
  (labels: string[], pats: MP[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: l }) =>
              _Array_prepend(
                `${l}: ${showWitness(_Option_unwrapOr(MWild as MP, _Array_get(i, pats)))}`,
                showFields(labels, pats, i + 1),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, labels)),
);
/**
 * Render a witness the way the user would have to write it as an arm.
 */
export const showWitness: (mp: MP) => string = (mp: MP) =>
  ((_v) =>
    _v._tag === "MWild"
      ? "_"
      : _v._tag === "MOpaque"
        ? "_"
        : _v._tag === "MBool"
          ? (({ value: v }) => show(v))(_v)
          : _v._tag === "MNum"
            ? (({ value: v }) => show(v))(_v)
            : _v._tag === "MStr"
              ? (({ value: v }) => show(v))(_v)
              : _v._tag === "MCtor"
                ? (({ name: n, args }) =>
                    length(args) === 0 ? n : `${n}(${_Str_join(", ", map(showWitness, args))})`)(_v)
                : _v._tag === "MTuple"
                  ? (({ elems }) => `(${_Str_join(", ", map(showWitness, elems))})`)(_v)
                  : _v._tag === "MRecord"
                    ? (({ labels, pats }) => `{ ${_Str_join(", ", showFields(labels, pats, 0))} }`)(
                        _v,
                      )
                    : _v._tag === "MArr"
                      ? (({ elems, rest }) =>
                          `[${_Str_join(", ", _Array_concat(map(showWitness, elems), rest ? ["..."] : ([] as string[])))}]`)(
                          _v,
                        )
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(mp);
/**
 * A witness that is one constructor over nothing but wildcards is the shape the
 * pre-matrix checker reported as `missing X` — check.mochi keeps that wording
 * for it, so the everyday "you forgot a variant" case reads as it always has.
 * Witnesses that say nothing a constructor name would not say better: a bare
 * wildcard (every arm was guarded, so nothing is covered) or one constructor
 * over wildcards. For these check.mochi keeps the legacy `missing X` wording.
 */
export const isWideWitnessM: (mp: MP) => boolean = (mp: MP) =>
  ((_v) =>
    _v._tag === "MWild"
      ? true
      : _v._tag === "MCtor"
        ? (({ args }) =>
            reduce(
              _curry(2, (acc: boolean, a: MP) => and(acc, isWildMP(a))),
              true,
              args,
            ))(_v)
        : false)(mp);
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
    return ((_v) =>
      _v._tag === "UFuel"
        ? (ExFuel as ExhaustVerdict)
        : _v._tag === "UNone"
          ? (ExOk as ExhaustVerdict)
          : _v._tag === "USome"
            ? (({ row }) => ExWitness(_Option_unwrapOr(MWild as MP, _Array_head(row))))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(useful(rows, 1, reg, 20000));
  });
