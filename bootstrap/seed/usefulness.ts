import type { PatField, Pattern } from "./ast";

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
  gte,
  length,
  lt,
  lte,
  map,
  not,
  reduce,
  show,
  sub,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "./ast";
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
  lte(n, 0) ? ([] as MP[]) : _Array_prepend(MWild as MP, mWilds(sub(n, 1)));
const isWildMP: (mp: MP) => boolean = (mp: MP) =>
  match(mp)
    .with({ _tag: "MWild" }, () => true)
    .otherwise(() => false);
/**
 * Split top-level or-patterns into separate rows — each alt is its own row.
 */
export const explodePat: (p: Pattern) => Pattern[] = (p: Pattern) =>
  match(p)
    .with({ _tag: "PAs" }, ({ pat }) => explodePat(pat))
    .with({ _tag: "POr" }, ({ alts }) => _Array_flatMap(explodePat, alts))
    .otherwise(() => [p]);
const toMP: (p: Pattern) => MP = (p: Pattern) =>
  match(p)
    .with({ _tag: "PAs" }, ({ pat }) => toMP(pat))
    .with({ _tag: "PWild" }, () => MWild as MP)
    .with({ _tag: "PUnit" }, () => MWild as MP)
    .with({ _tag: "PBind" }, () => MWild as MP)
    .with({ _tag: "PLit" }, ({ value: v }) => MNum(v))
    .with({ _tag: "PBool" }, ({ value: v }) => MBool(v))
    .with({ _tag: "PStr" }, ({ value: v }) => MStr(v))
    .with({ _tag: "PTuple" }, ({ elems }) => MTuple(map(toMP, elems)))
    .with({ _tag: "PCtor" }, ({ ctor: name, args }) => MCtor(name, map(toMP, args)))
    .with({ _tag: "PRecord" }, ({ fields }) =>
      MRecord(
        map((f: PatField) => f.label, fields),
        map((f: PatField) => toMP(f.pat), fields),
      ),
    )
    .with({ _tag: "PArr" }, ({ elems, rest }) => MArr(map(toMP, elems), _Option_isSome(rest)))
    .with({ _tag: "PList" }, () => MOpaque as MP)
    .with({ _tag: "POr" }, () => MOpaque as MP)
    .exhaustive();
const headOf: (mp: MP) => Option<MHead> = (mp: MP) =>
  match(mp)
    .with({ _tag: "MWild" }, () => None as Option<MHead>)
    .with({ _tag: "MOpaque" }, () => None as Option<MHead>)
    .with({ _tag: "MCtor" }, ({ name: n }) => Some(HCtor(n)) as Option<MHead>)
    .with({ _tag: "MBool" }, ({ value: v }) => Some(HBool(v)) as Option<MHead>)
    .with({ _tag: "MNum" }, ({ value: v }) => Some(HNum(v)) as Option<MHead>)
    .with({ _tag: "MStr" }, ({ value: v }) => Some(HStr(v)) as Option<MHead>)
    .with({ _tag: "MTuple" }, ({ elems }) => Some(HTuple(length(elems))) as Option<MHead>)
    .with({ _tag: "MRecord" }, () => Some(HRecord as MHead) as Option<MHead>)
    .with({ _tag: "MArr" }, ({ elems }) => Some(HArr(length(elems))) as Option<MHead>)
    .exhaustive();
const colOf: <A>(m: A[][]) => A[] = <A>(m: A[][]) =>
  _Array_flatMap(
    (row: A[]) =>
      match(_Array_head(row))
        .with({ _tag: "None" }, () => [] as A[])
        .with({ _tag: "Some" }, ({ value: hd }) => [hd])
        .exhaustive(),
    m,
  );
const headsOf: (col: MP[]) => MHead[] = (col: MP[]) =>
  _Array_flatMap(
    (mp: MP) =>
      match(headOf(mp))
        .with({ _tag: "None" }, () => [] as MHead[])
        .with({ _tag: "Some" }, ({ value: h }) => [h])
        .exhaustive(),
    col,
  );
const addLabel: <A>(acc: A[], l: A) => A[] = _curry(2, <A>(acc: A[], l: A) =>
  _Array_contains(l, acc) ? acc : _Array_append(l, acc),
);
const labelsOfMP: _Curry<[acc: string[], mp: MP], string[]> = _curry(2, (acc: string[], mp: MP) =>
  match(mp)
    .with({ _tag: "MRecord" }, ({ labels: ls }) => reduce(addLabel, acc, ls))
    .otherwise(() => acc),
);
const recordLabelsOf: (col: MP[]) => string[] = (col: MP[]) =>
  reduce(labelsOfMP, [] as string[], col);
const indexOfLabel: <A>(l: A, labels: A[], i: number) => number = _curry(
  3,
  <A>(l: A, labels: A[], i: number) =>
    match(_Array_get(i, labels))
      .with({ _tag: "None" }, () => sub(0, 1))
      .with({ _tag: "Some" }, ({ value: x }) => (eq(x, l) ? i : indexOfLabel(l, labels, add(i, 1))))
      .exhaustive(),
);
const fieldOf: <A>(l: A, labels: A[], pats: MP[]) => MP = _curry(
  3,
  <A>(l: A, labels: A[], pats: MP[]) => {
    const i: number = indexOfLabel(l, labels, 0);
    return lt(i, 0) ? (MWild as MP) : _Option_unwrapOr(MWild as MP, _Array_get(i, pats));
  },
);

const arrShapeStep: _Curry<[acc: ArrShape, mp: MP], ArrShape> = _curry(2, (acc: ArrShape, mp: MP) =>
  match(mp)
    .with({ _tag: "MArr" }, ({ elems, rest }) =>
      ((n: number) =>
        rest
          ? {
              fixed: acc.fixed,
              restFrom: match(acc.restFrom)
                .with({ _tag: "None" }, () => Some(n) as Option<number>)
                .with({ _tag: "Some" }, ({ value: m }) => Some(lt(m, n) ? m : n) as Option<number>)
                .exhaustive(),
            }
          : {
              fixed: _Array_contains(n, acc.fixed) ? acc.fixed : _Array_append(n, acc.fixed),
              restFrom: acc.restFrom,
            })(length(elems)),
    )
    .otherwise(() => acc),
);
const arrShapeOf: (col: MP[]) => ArrShape = (col: MP[]) =>
  reduce(arrShapeStep, { fixed: [] as number[], restFrom: None as Option<number> }, col);
const rangeCovered: <A>(shape: { fixed: number[] } & A, i: number, n: number) => boolean = _curry(
  3,
  <A>(shape: { fixed: number[] } & A, i: number, n: number) =>
    gte(i, n) ? true : and(_Array_contains(i, shape.fixed), rangeCovered(shape, add(i, 1), n)),
);
const arrComplete: <A>(shape: { restFrom: Option<number>; fixed: number[] } & A) => boolean = <A>(
  shape: { restFrom: Option<number>; fixed: number[] } & A,
) =>
  match(shape.restFrom)
    .with({ _tag: "None" }, () => false)
    .with({ _tag: "Some" }, ({ value: r }) => rangeCovered(shape, 0, r))
    .exhaustive();
const arrMissingLen: <A>(
  shape: { fixed: number[]; restFrom: Option<number> } & A,
  n: number,
) => number = _curry(2, <A>(shape: { fixed: number[]; restFrom: Option<number> } & A, n: number) =>
  and(
    not(_Array_contains(n, shape.fixed)),
    match(shape.restFrom)
      .with({ _tag: "None" }, () => true)
      .with({ _tag: "Some" }, ({ value: r }) => lt(n, r))
      .exhaustive(),
  )
    ? n
    : arrMissingLen(shape, add(n, 1)),
);
const rangeArr: _Curry<[i: number, top: number], number[]> = _curry(2, (i: number, top: number) =>
  gt(i, top) ? ([] as number[]) : _Array_prepend(i, rangeArr(add(i, 1), top)),
);
const arrLengths: <A>(shape: { restFrom: Option<number>; fixed: number[] } & A) => number[] = <A>(
  shape: { restFrom: Option<number>; fixed: number[] } & A,
) => {
  const top: number = reduce(
    _curry(2, (a: number, x: number) => (gt(x, a) ? x : a)),
    _Option_unwrapOr(0, shape.restFrom),
    shape.fixed,
  );
  return rangeArr(0, top);
};
const specializeRow: _Curry<[h: MHead, mp: MP, labels: string[]], Option<MP[]>> = _curry(
  3,
  (h: MHead, mp: MP, labels: string[]) =>
    match(h)
      .with({ _tag: "HCtor" }, ({ name }) =>
        match(mp)
          .with({ _tag: "MCtor" }, ({ name: n, args }) =>
            eq(n, name) ? (Some(args) as Option<MP[]>) : (None as Option<MP[]>),
          )
          .otherwise(() => None as Option<MP[]>),
      )
      .with({ _tag: "HBool" }, ({ value: v }) =>
        match(mp)
          .with({ _tag: "MBool" }, ({ value: b }) =>
            eq(b, v) ? (Some([] as MP[]) as Option<MP[]>) : (None as Option<MP[]>),
          )
          .otherwise(() => None as Option<MP[]>),
      )
      .with({ _tag: "HNum" }, ({ value: v }) =>
        match(mp)
          .with({ _tag: "MNum" }, ({ value: x }) =>
            eq(x, v) ? (Some([] as MP[]) as Option<MP[]>) : (None as Option<MP[]>),
          )
          .otherwise(() => None as Option<MP[]>),
      )
      .with({ _tag: "HStr" }, ({ value: v }) =>
        match(mp)
          .with({ _tag: "MStr" }, ({ value: x }) =>
            eq(x, v) ? (Some([] as MP[]) as Option<MP[]>) : (None as Option<MP[]>),
          )
          .otherwise(() => None as Option<MP[]>),
      )
      .with({ _tag: "HTuple" }, () =>
        match(mp)
          .with({ _tag: "MTuple" }, ({ elems }) => Some(elems) as Option<MP[]>)
          .otherwise(() => None as Option<MP[]>),
      )
      .with({ _tag: "HRecord" }, () =>
        match(mp)
          .with(
            { _tag: "MRecord" },
            ({ labels: ls, pats: ps }) =>
              Some(map((l: string) => fieldOf(l, ls, ps), labels)) as Option<MP[]>,
          )
          .otherwise(() => None as Option<MP[]>),
      )
      .with({ _tag: "HArr" }, ({ len }) =>
        match(mp)
          .with({ _tag: "MArr" }, ({ elems, rest }) =>
            ((k: number) =>
              rest
                ? lte(k, len)
                  ? (Some(_Array_concat(elems, mWilds(sub(len, k)))) as Option<MP[]>)
                  : (None as Option<MP[]>)
                : eq(k, len)
                  ? (Some(elems) as Option<MP[]>)
                  : (None as Option<MP[]>))(length(elems)),
          )
          .otherwise(() => None as Option<MP[]>),
      )
      .exhaustive(),
);
const specializeOne: _Curry<[h: MHead, arity: number, labels: string[], row: MP[]], MP[][]> =
  _curry(4, (h: MHead, arity: number, labels: string[], row: MP[]) =>
    match(_Array_head(row))
      .with({ _tag: "None" }, () => [] as MP[][])
      .with({ _tag: "Some" }, ({ value: hd }) =>
        ((rest: MP[]) =>
          isWildMP(hd)
            ? [_Array_concat(mWilds(arity), rest)]
            : match(specializeRow(h, hd, labels))
                .with({ _tag: "None" }, () => [] as MP[][])
                .with({ _tag: "Some" }, ({ value: sub }) => [_Array_concat(sub, rest)])
                .exhaustive())(_Array_tail(row)),
      )
      .exhaustive(),
  );
const specializeM: _Curry<[m: MP[][], h: MHead, arity: number, labels: string[]], MP[][]> = _curry(
  4,
  (m: MP[][], h: MHead, arity: number, labels: string[]) =>
    _Array_flatMap((row: MP[]) => specializeOne(h, arity, labels, row), m),
);
const defaultM: (m: MP[][]) => MP[][] = (m: MP[][]) =>
  _Array_flatMap(
    (row: MP[]) =>
      match(_Array_head(row))
        .with({ _tag: "None" }, () => [] as MP[][])
        .with({ _tag: "Some" }, ({ value: hd }) =>
          isWildMP(hd) ? [_Array_tail(row)] : ([] as MP[][]),
        )
        .exhaustive(),
    m,
  );
const rebuild: _Curry<[h: MHead, args: MP[], labels: string[]], MP> = _curry(
  3,
  (h: MHead, args: MP[], labels: string[]) =>
    match(h)
      .with({ _tag: "HCtor" }, ({ name }) => MCtor(name, args))
      .with({ _tag: "HTuple" }, () => MTuple(args))
      .with({ _tag: "HRecord" }, () => MRecord(labels, args))
      .with({ _tag: "HArr" }, () => MArr(args, false))
      .with({ _tag: "HBool" }, ({ value: v }) => MBool(v))
      .with({ _tag: "HNum" }, ({ value: v }) => MNum(v))
      .with({ _tag: "HStr" }, ({ value: v }) => MStr(v))
      .exhaustive(),
);
const takenNums: (heads: MHead[]) => number[] = (heads: MHead[]) =>
  _Array_flatMap(
    (h: MHead) =>
      match(h)
        .with({ _tag: "HNum" }, ({ value: v }) => [v])
        .otherwise(() => [] as number[]),
    heads,
  );
const freshNum: _Curry<[taken: number[], i: number], number> = _curry(
  2,
  (taken: number[], i: number) => (_Array_contains(i, taken) ? freshNum(taken, add(i, 1)) : i),
);
const takenStrs: (heads: MHead[]) => string[] = (heads: MHead[]) =>
  _Array_flatMap(
    (h: MHead) =>
      match(h)
        .with({ _tag: "HStr" }, ({ value: v }) => [v])
        .otherwise(() => [] as string[]),
    heads,
  );
const starsOf: (n: number) => string = (n: number) =>
  lte(n, 0) ? "" : _Str_concat("*", starsOf(sub(n, 1)));
const freshStr: _Curry<[taken: string[], i: number], string> = _curry(
  2,
  (taken: string[], i: number) => {
    const s: string = starsOf(i);
    return _Array_contains(s, taken) ? freshStr(taken, add(i, 1)) : s;
  },
);
const ctorNames: (heads: MHead[]) => string[] = (heads: MHead[]) =>
  _Array_flatMap(
    (h: MHead) =>
      match(h)
        .with({ _tag: "HCtor" }, ({ name: n }) => [n])
        .otherwise(() => [] as string[]),
    heads,
  );
const boolVals: (heads: MHead[]) => boolean[] = (heads: MHead[]) =>
  _Array_flatMap(
    (h: MHead) =>
      match(h)
        .with({ _tag: "HBool" }, ({ value: v }) => [v])
        .otherwise(() => [] as boolean[]),
    heads,
  );
const ctorInfoSuffixed: _Curry<
  [keys: string[], reg: Registry, n: string],
  Option<CtorInfo>
> = _curry(3, (keys: string[], reg: Registry, n: string) =>
  match(keys)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => None as Option<CtorInfo>,
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([k, ...rest]) =>
        _Str_endsWith(`.${n}`, k) ? _Map_get(k, reg.ctors) : ctorInfoSuffixed(rest, reg, n),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const ctorInfoOf: _Curry<[reg: Registry, n: string], Option<CtorInfo>> = _curry(
  2,
  (reg: Registry, n: string) =>
    match(_Map_get(n, reg.ctors))
      .with({ _tag: "Some" }, ({ value: info }) => Some(info) as Option<CtorInfo>)
      .with({ _tag: "None" }, () => ctorInfoSuffixed(_Map_keys(reg.ctors), reg, n))
      .exhaustive(),
);
const arityOfCtor: _Curry<[reg: Registry, n: string], number> = _curry(
  2,
  (reg: Registry, n: string) =>
    match(ctorInfoOf(reg, n))
      .with({ _tag: "None" }, () => 0)
      .with({ _tag: "Some" }, ({ value: info }) => info.arity)
      .exhaustive(),
);
const ownerOfCtor: _Curry<[reg: Registry, n: string], Option<string>> = _curry(
  2,
  (reg: Registry, n: string) =>
    match(ctorInfoOf(reg, n))
      .with({ _tag: "None" }, () => None as Option<string>)
      .with({ _tag: "Some" }, ({ value: info }) => Some(info.owner) as Option<string>)
      .exhaustive(),
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
    lte(fuel, 0)
      ? (UFuel as URes)
      : eq(width, 0)
        ? eq(length(m), 0)
          ? USome([] as MP[], sub(fuel, 1))
          : UNone(sub(fuel, 1))
        : eq(length(m), 0)
          ? USome(mWilds(width), sub(fuel, 1))
          : usefulSplit(m, width, reg, sub(fuel, 1)),
);
const usefulSplit: _Curry<[m: MP[][], width: number, reg: Registry, fuel: number], URes> = _curry(
  4,
  (m: MP[][], width: number, reg: Registry, fuel: number) => {
    const col: MP[] = colOf(m);
    const heads: MHead[] = headsOf(col);
    return match(_Array_head(heads))
      .with({ _tag: "None" }, () =>
        prependWitness(MWild as MP, useful(defaultM(m), sub(width, 1), reg, fuel)),
      )
      .with({ _tag: "Some" }, ({ value: h0 }) => usefulHead(m, col, heads, h0, width, reg, fuel))
      .exhaustive();
  },
);
const prependWitness: _Curry<[mp: MP, r: URes], URes> = _curry(2, (mp: MP, r: URes) =>
  match(r)
    .with({ _tag: "UFuel" }, () => UFuel as URes)
    .with({ _tag: "UNone" }, ({ fuel: f }) => UNone(f))
    .with({ _tag: "USome" }, ({ row, fuel: f }) => USome(_Array_prepend(mp, row), f))
    .exhaustive(),
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
    match(_Array_get(i, heads))
      .with({ _tag: "None" }, () => UNone(fuel))
      .with({ _tag: "Some" }, ({ value: h }) =>
        ((arity: number) =>
          match(useful(specializeM(m, h, arity, labels), sub(add(arity, width), 1), reg, fuel))
            .with({ _tag: "UFuel" }, () => UFuel as URes)
            .with({ _tag: "UNone" }, ({ fuel: f2 }) =>
              tryHeads(m, heads, arities, labels, width, reg, f2, add(i, 1)),
            )
            .with({ _tag: "USome" }, ({ row, fuel: f2 }) =>
              USome(
                _Array_prepend(
                  rebuild(h, _Array_take(arity, row), labels),
                  _Array_drop(arity, row),
                ),
                f2,
              ),
            )
            .exhaustive())(_Option_unwrapOr(0, _Array_get(i, arities))),
      )
      .exhaustive(),
);
const usefulHead: _Curry<
  [m: MP[][], col: MP[], heads: MHead[], h0: MHead, width: number, reg: Registry, fuel: number],
  URes
> = _curry(
  7,
  (m: MP[][], col: MP[], heads: MHead[], h0: MHead, width: number, reg: Registry, fuel: number) =>
    match(h0)
      .with({ _tag: "HTuple" }, ({ arity }) =>
        tryHeads(m, [HTuple(arity)], [arity], [] as string[], width, reg, fuel, 0),
      )
      .with({ _tag: "HRecord" }, () =>
        ((labels: string[]) =>
          tryHeads(m, [HRecord as MHead], [length(labels)], labels, width, reg, fuel, 0))(
          recordLabelsOf(col),
        ),
      )
      .with({ _tag: "HCtor" }, () => usefulCtor(m, heads, width, reg, fuel))
      .with({ _tag: "HBool" }, () => usefulBool(m, heads, width, reg, fuel))
      .with({ _tag: "HArr" }, () => usefulArr(m, col, width, reg, fuel))
      .with({ _tag: "HNum" }, () =>
        prependWitness(
          MNum(freshNum(takenNums(heads), 0)),
          useful(defaultM(m), sub(width, 1), reg, fuel),
        ),
      )
      .with({ _tag: "HStr" }, () =>
        prependWitness(
          MStr(freshStr(takenStrs(heads), 0)),
          useful(defaultM(m), sub(width, 1), reg, fuel),
        ),
      )
      .exhaustive(),
);
const usefulCtor: _Curry<
  [m: MP[][], heads: MHead[], width: number, reg: Registry, fuel: number],
  URes
> = _curry(5, (m: MP[][], heads: MHead[], width: number, reg: Registry, fuel: number) => {
  const names: string[] = ctorNames(heads);
  const ownerOpt: Option<string> = match(_Array_head(names))
    .with({ _tag: "None" }, () => None as Option<string>)
    .with({ _tag: "Some" }, ({ value: n }) => ownerOfCtor(reg, n))
    .exhaustive();
  const all: string[] = match(ownerOpt)
    .with({ _tag: "None" }, () => [] as string[])
    .with({ _tag: "Some" }, ({ value: o }) => _Map_getOr([] as string[], o, reg.types))
    .exhaustive();
  return and(gt(length(all), 0), allNamesIn(all, names))
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
        match(_Array_head(filter((n: string) => not(_Array_contains(n, names)), all)))
          .with({ _tag: "None" }, () => MWild as MP)
          .with({ _tag: "Some" }, ({ value: n }) => MCtor(n, mWilds(arityOfCtor(reg, n))))
          .exhaustive(),
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
    : prependWitness(MBool(not(hasTrue)), useful(defaultM(m), sub(width, 1), reg, fuel));
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
    match(_Array_get(i, labels))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: l }) =>
        _Array_prepend(
          `${l}: ${showWitness(_Option_unwrapOr(MWild as MP, _Array_get(i, pats)))}`,
          showFields(labels, pats, add(i, 1)),
        ),
      )
      .exhaustive(),
);
/**
 * Render a witness the way the user would have to write it as an arm.
 */
export const showWitness: (mp: MP) => string = (mp: MP) =>
  match(mp)
    .with({ _tag: "MWild" }, () => "_")
    .with({ _tag: "MOpaque" }, () => "_")
    .with({ _tag: "MBool" }, ({ value: v }) => show(v))
    .with({ _tag: "MNum" }, ({ value: v }) => show(v))
    .with({ _tag: "MStr" }, ({ value: v }) => show(v))
    .with({ _tag: "MCtor" }, ({ name: n, args }) =>
      eq(length(args), 0) ? n : `${n}(${_Str_join(", ", map(showWitness, args))})`,
    )
    .with({ _tag: "MTuple" }, ({ elems }) => `(${_Str_join(", ", map(showWitness, elems))})`)
    .with(
      { _tag: "MRecord" },
      ({ labels, pats }) => `{ ${_Str_join(", ", showFields(labels, pats, 0))} }`,
    )
    .with(
      { _tag: "MArr" },
      ({ elems, rest }) =>
        `[${_Str_join(", ", _Array_concat(map(showWitness, elems), rest ? ["..."] : ([] as string[])))}]`,
    )
    .exhaustive();
/**
 * A witness that is one constructor over nothing but wildcards is the shape the
 * pre-matrix checker reported as `missing X` — check.mochi keeps that wording
 * for it, so the everyday "you forgot a variant" case reads as it always has.
 * Witnesses that say nothing a constructor name would not say better: a bare
 * wildcard (every arm was guarded, so nothing is covered) or one constructor
 * over wildcards. For these check.mochi keeps the legacy `missing X` wording.
 */
export const isWideWitnessM: (mp: MP) => boolean = (mp: MP) =>
  match(mp)
    .with({ _tag: "MWild" }, () => true)
    .with({ _tag: "MCtor" }, ({ args }) =>
      reduce(
        _curry(2, (acc: boolean, a: MP) => and(acc, isWildMP(a))),
        true,
        args,
      ),
    )
    .otherwise(() => false);
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
    return match(useful(rows, 1, reg, 20000))
      .with({ _tag: "UFuel" }, () => ExFuel as ExhaustVerdict)
      .with({ _tag: "UNone" }, () => ExOk as ExhaustVerdict)
      .with({ _tag: "USome" }, ({ row }) =>
        ExWitness(_Option_unwrapOr(MWild as MP, _Array_head(row))),
      )
      .exhaustive();
  });
