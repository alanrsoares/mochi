import type { Row, Ty } from "./types";

export type Result<A, B> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: B };
export type Option<A> = { _tag: "Some"; value: A } | { _tag: "None" };

import {
  _curry,
  Some,
  None,
  add,
  eq,
  compare,
  show,
  not,
  length,
  map,
  _Map_set,
  _Map_size,
  _Map_get,
  _Option_map,
  _Option_flatMap,
  _Option_unwrapOr,
  _Array_get,
  _Array_concat,
  _Array_append,
  _Array_prepend,
  _Array_sort,
  _Str_join,
  _Str_get,
  _Str_fromCode,
  _tuple,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import {
  TyVar,
  TyCon,
  TyFn,
  TyRecord,
  TySingleton,
  TyOneOf,
  RowEmpty,
  RowVar,
  RowExtend,
  isUnit,
  tCon,
  tArrow,
  tRecord,
} from "./types";
import { widenLits } from "./schemes";
const letters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const letterAt: (i: number) => string = (i: number) =>
  _Option_unwrapOr(`T${show(i)}`, _Str_get(i, letters));
export const genericNames: <A, B>(sc: { vars: A[]; rvars: A[] } & B) => Map<A, string> = <A, B>(
  sc: { vars: A[]; rvars: A[] } & B,
) => genericNamesFrom(_Array_concat(sc.vars, sc.rvars), 0, new Map<A, string>());
const genericNamesFrom: <A>(ids: A[], i: number, names: Map<A, string>) => Map<A, string> = _curry(
  3,
  <A>(ids: A[], i: number, names: Map<A, string>) =>
    match(_Array_get(i, ids))
      .with({ _tag: "None" }, () => names)
      .with({ _tag: "Some" }, ({ value: id }) =>
        genericNamesFrom(ids, add(i, 1), _Map_set(id, letterAt(i), names)),
      )
      .exhaustive(),
);
const primitiveTs: (name: string) => string = (name: string) =>
  match(name)
    .with("number", () => "number")
    .with("int", () => "number")
    .with("float", () => "number")
    .with("string", () => "string")
    .with("bool", () => "boolean")
    .with("unit", () => "undefined")
    .otherwise(() => name);
const namesOf: {
  (ts: Ty[]): (names: Map<number, string>) => (recs: Map<string, string>) => string;
  (ts: Ty[]): (names: Map<number, string>, recs: Map<string, string>) => string;
  (ts: Ty[], names: Map<number, string>): (recs: Map<string, string>) => string;
  (ts: Ty[], names: Map<number, string>, recs: Map<string, string>): string;
} = _curry(3, (ts: Ty[], names: Map<number, string>, recs: Map<string, string>) =>
  _Str_join(
    ", ",
    map((t: Ty) => tsOfRaw(t, names, recs), ts),
  ),
);
const nominal: {
  (
    name: string,
  ): (args: Ty[]) => (names: Map<number, string>) => (recs: Map<string, string>) => string;
  (name: string): (args: Ty[]) => (names: Map<number, string>, recs: Map<string, string>) => string;
  (name: string): (args: Ty[], names: Map<number, string>) => (recs: Map<string, string>) => string;
  (name: string, args: Ty[]): (names: Map<number, string>) => (recs: Map<string, string>) => string;
  (name: string): (args: Ty[], names: Map<number, string>, recs: Map<string, string>) => string;
  (name: string, args: Ty[]): (names: Map<number, string>, recs: Map<string, string>) => string;
  (name: string, args: Ty[], names: Map<number, string>): (recs: Map<string, string>) => string;
  (name: string, args: Ty[], names: Map<number, string>, recs: Map<string, string>): string;
} = _curry(4, (name: string, args: Ty[], names: Map<number, string>, recs: Map<string, string>) =>
  eq(length(args), 0) ? primitiveTs(name) : `${name}<${namesOf(args, names, recs)}>`,
);
const tsRowFields: {
  (
    row: Row,
  ): (names: Map<number, string>) => (recs: Map<string, string>) => [string[], Option<number>];
  (row: Row): (names: Map<number, string>, recs: Map<string, string>) => [string[], Option<number>];
  (row: Row, names: Map<number, string>): (recs: Map<string, string>) => [string[], Option<number>];
  (row: Row, names: Map<number, string>, recs: Map<string, string>): [string[], Option<number>];
} = _curry(3, (row: Row, names: Map<number, string>, recs: Map<string, string>) =>
  match(row)
    .with({ _tag: "RowEmpty" }, () => _tuple([] as string[], None as Option<number>))
    .with({ _tag: "RowVar" }, ({ id }) => _tuple([] as string[], Some(id) as Option<number>))
    .with({ _tag: "RowExtend" }, ({ label, fieldType, rest }) =>
      (([fields, tail]: [string[], Option<number>]) =>
        _tuple(_Array_prepend(`${label}: ${tsOfRaw(fieldType, names, recs)}`, fields), tail))(
        tsRowFields(rest, names, recs),
      ),
    )
    .exhaustive(),
);
const shapeFieldsFrom: {
  (row: Row): (names: Map<number, string>) => Option<string[]>;
  (row: Row, names: Map<number, string>): Option<string[]>;
} = _curry(2, (row: Row, names: Map<number, string>) =>
  match(row)
    .with({ _tag: "RowEmpty" }, () => Some([] as string[]) as Option<string[]>)
    .with({ _tag: "RowVar" }, () => None as Option<string[]>)
    .with({ _tag: "RowExtend" }, ({ label, fieldType, rest }) =>
      _Option_map(
        (fs: string[]) =>
          _Array_prepend(`${label}: ${tsOf(fieldType, names, new Map<string, string>())}`, fs),
        shapeFieldsFrom(rest, names),
      ),
    )
    .exhaustive(),
);
export const rowShapeKey: {
  (row: Row): (names: Map<number, string>) => Option<string>;
  (row: Row, names: Map<number, string>): Option<string>;
} = _curry(2, (row: Row, names: Map<number, string>) =>
  _Option_map((fs: string[]) => _Str_join("; ", _Array_sort(fs)), shapeFieldsFrom(row, names)),
);
const aliasNameFor: {
  (row: Row): (names: Map<number, string>) => (recs: Map<string, string>) => Option<string>;
  (row: Row): (names: Map<number, string>, recs: Map<string, string>) => Option<string>;
  (row: Row, names: Map<number, string>): (recs: Map<string, string>) => Option<string>;
  (row: Row, names: Map<number, string>, recs: Map<string, string>): Option<string>;
} = _curry(3, (row: Row, names: Map<number, string>, recs: Map<string, string>) =>
  eq(_Map_size(recs), 0)
    ? (None as Option<string>)
    : _Option_flatMap((k: string) => _Map_get(k, recs), rowShapeKey(row, names)),
);
const tsRow: {
  (row: Row): (names: Map<number, string>) => (recs: Map<string, string>) => string;
  (row: Row): (names: Map<number, string>, recs: Map<string, string>) => string;
  (row: Row, names: Map<number, string>): (recs: Map<string, string>) => string;
  (row: Row, names: Map<number, string>, recs: Map<string, string>): string;
} = _curry(3, (row: Row, names: Map<number, string>, recs: Map<string, string>) =>
  match(aliasNameFor(row, names, recs))
    .with({ _tag: "Some" }, ({ value: alias }) => alias)
    .with({ _tag: "None" }, () =>
      (([fields, tail]: [string[], Option<number>]) => {
        const body: string = eq(length(fields), 0) ? "{}" : `{ ${_Str_join("; ", fields)} }`;
        return match(tail)
          .with({ _tag: "None" }, () => body)
          .with({ _tag: "Some" }, ({ value: id }) =>
            match(_Map_get(id, names))
              .with({ _tag: "None" }, () => body)
              .with({ _tag: "Some" }, ({ value: name }) =>
                eq(length(fields), 0) ? name : `(${body} & ${name})`,
              )
              .exhaustive(),
          )
          .exhaustive();
      })(tsRowFields(row, names, recs)),
    )
    .exhaustive(),
);
const tsArrow: {
  (fromT: Ty): (toT: Ty) => (names: Map<number, string>) => (recs: Map<string, string>) => string;
  (fromT: Ty): (toT: Ty) => (names: Map<number, string>, recs: Map<string, string>) => string;
  (fromT: Ty): (toT: Ty, names: Map<number, string>) => (recs: Map<string, string>) => string;
  (fromT: Ty, toT: Ty): (names: Map<number, string>) => (recs: Map<string, string>) => string;
  (fromT: Ty): (toT: Ty, names: Map<number, string>, recs: Map<string, string>) => string;
  (fromT: Ty, toT: Ty): (names: Map<number, string>, recs: Map<string, string>) => string;
  (fromT: Ty, toT: Ty, names: Map<number, string>): (recs: Map<string, string>) => string;
  (fromT: Ty, toT: Ty, names: Map<number, string>, recs: Map<string, string>): string;
} = _curry(4, (fromT: Ty, toT: Ty, names: Map<number, string>, recs: Map<string, string>) =>
  isUnit(fromT)
    ? `() => ${tsOfRaw(toT, names, recs)}`
    : tsArrowParams(fromT, toT, names, recs, 0, [] as string[]),
);
const tsArrowParams: {
  (
    fromT: Ty,
  ): (
    toT: Ty,
  ) => (
    names: Map<number, string>,
  ) => (recs: Map<string, string>) => (i: number) => (params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
  ) => (
    names: Map<number, string>,
  ) => (recs: Map<string, string>) => (i: number, params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
  ) => (
    names: Map<number, string>,
  ) => (recs: Map<string, string>, i: number) => (params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
  ) => (
    names: Map<number, string>,
    recs: Map<string, string>,
  ) => (i: number) => (params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
    names: Map<number, string>,
  ) => (recs: Map<string, string>) => (i: number) => (params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
  ): (
    names: Map<number, string>,
  ) => (recs: Map<string, string>) => (i: number) => (params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
  ) => (
    names: Map<number, string>,
  ) => (recs: Map<string, string>, i: number, params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
  ) => (
    names: Map<number, string>,
    recs: Map<string, string>,
  ) => (i: number, params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
  ) => (
    names: Map<number, string>,
    recs: Map<string, string>,
    i: number,
  ) => (params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
    names: Map<number, string>,
  ) => (recs: Map<string, string>) => (i: number, params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
    names: Map<number, string>,
  ) => (recs: Map<string, string>, i: number) => (params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
    names: Map<number, string>,
    recs: Map<string, string>,
  ) => (i: number) => (params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
  ): (
    names: Map<number, string>,
  ) => (recs: Map<string, string>) => (i: number, params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
  ): (
    names: Map<number, string>,
  ) => (recs: Map<string, string>, i: number) => (params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
  ): (
    names: Map<number, string>,
    recs: Map<string, string>,
  ) => (i: number) => (params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
    names: Map<number, string>,
  ): (recs: Map<string, string>) => (i: number) => (params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
  ) => (
    names: Map<number, string>,
    recs: Map<string, string>,
    i: number,
    params: string[],
  ) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
    names: Map<number, string>,
  ) => (recs: Map<string, string>, i: number, params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
    names: Map<number, string>,
    recs: Map<string, string>,
  ) => (i: number, params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
    names: Map<number, string>,
    recs: Map<string, string>,
    i: number,
  ) => (params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
  ): (
    names: Map<number, string>,
  ) => (recs: Map<string, string>, i: number, params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
  ): (
    names: Map<number, string>,
    recs: Map<string, string>,
  ) => (i: number, params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
  ): (
    names: Map<number, string>,
    recs: Map<string, string>,
    i: number,
  ) => (params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
    names: Map<number, string>,
  ): (recs: Map<string, string>) => (i: number, params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
    names: Map<number, string>,
  ): (recs: Map<string, string>, i: number) => (params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
    names: Map<number, string>,
    recs: Map<string, string>,
  ): (i: number) => (params: string[]) => string;
  (
    fromT: Ty,
  ): (
    toT: Ty,
    names: Map<number, string>,
    recs: Map<string, string>,
    i: number,
    params: string[],
  ) => string;
  (
    fromT: Ty,
    toT: Ty,
  ): (names: Map<number, string>, recs: Map<string, string>, i: number, params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
    names: Map<number, string>,
  ): (recs: Map<string, string>, i: number, params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
    names: Map<number, string>,
    recs: Map<string, string>,
  ): (i: number, params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
    names: Map<number, string>,
    recs: Map<string, string>,
    i: number,
  ): (params: string[]) => string;
  (
    fromT: Ty,
    toT: Ty,
    names: Map<number, string>,
    recs: Map<string, string>,
    i: number,
    params: string[],
  ): string;
} = _curry(
  6,
  (
    fromT: Ty,
    toT: Ty,
    names: Map<number, string>,
    recs: Map<string, string>,
    i: number,
    params: string[],
  ) => {
    const params1: string[] = _Array_append(
      `${_Str_fromCode(add(97, i))}: ${tsOfRaw(fromT, names, recs)}`,
      params,
    );
    return match(toT)
      .with(
        (_v): _v is Extract<Ty, { _tag: "TyFn" }> => {
          const _g: any = _v;
          return (
            _g._tag === "TyFn" && (({ from: nextFrom, to: nextTo }) => not(isUnit(nextFrom)))(_g)
          );
        },
        ({ from: nextFrom, to: nextTo }) =>
          tsArrowParams(nextFrom, nextTo, names, recs, add(i, 1), params1),
      )
      .otherwise(() => `(${_Str_join(", ", params1)}) => ${tsOfRaw(toT, names, recs)}`);
  },
);
export const tsOf: {
  (t: Ty): (names: Map<number, string>) => (recs: Map<string, string>) => string;
  (t: Ty): (names: Map<number, string>, recs: Map<string, string>) => string;
  (t: Ty, names: Map<number, string>): (recs: Map<string, string>) => string;
  (t: Ty, names: Map<number, string>, recs: Map<string, string>): string;
} = _curry(3, (t: Ty, names: Map<number, string>, recs: Map<string, string>) =>
  tsOfRaw(widenLits(t), names, recs),
);
const tsOfRaw: {
  (t: Ty): (names: Map<number, string>) => (recs: Map<string, string>) => string;
  (t: Ty): (names: Map<number, string>, recs: Map<string, string>) => string;
  (t: Ty, names: Map<number, string>): (recs: Map<string, string>) => string;
  (t: Ty, names: Map<number, string>, recs: Map<string, string>): string;
} = _curry(3, (t: Ty, names: Map<number, string>, recs: Map<string, string>) =>
  match(t)
    .with({ _tag: "TyVar" }, ({ id }) => _Option_unwrapOr("unknown", _Map_get(id, names)))
    .with(
      (_v): _v is Extract<Ty, { _tag: "TyCon" }> => {
        const _g: any = _v;
        return _g._tag === "TyCon" && _g.name === "Array" && _g.args.length === 1;
      },
      ({ args: [elem] }) =>
        ((inner: string) =>
          match(elem)
            .with({ _tag: "TyFn" }, () => `(${inner})[]`)
            .with({ _tag: "TyOneOf" }, () => `(${inner})[]`)
            .otherwise(() => `${inner}[]`))(tsOfRaw(elem, names, recs)),
    )
    .with(
      (_v): _v is Extract<Ty, { _tag: "TyCon" }> => {
        const _g: any = _v;
        return _g._tag === "TyCon" && _g.name === "List" && _g.args.length === 1;
      },
      ({ args: [elem] }) => `Iterable<${tsOfRaw(elem, names, recs)}>`,
    )
    .with(
      (_v): _v is Extract<Ty, { _tag: "TyCon" }> => {
        const _g: any = _v;
        return _g._tag === "TyCon" && _g.name === "Task" && _g.args.length === 2;
      },
      ({ args: [value, error] }) =>
        `() => Promise<Result<${tsOfRaw(value, names, recs)}, ${tsOfRaw(error, names, recs)}>>`,
    )
    .with({ _tag: "TyCon", name: "tuple" }, ({ args: elems }) => `[${namesOf(elems, names, recs)}]`)
    .with({ _tag: "TyCon" }, ({ name, args }) => nominal(name, args, names, recs))
    .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tsArrow(fromT, toT, names, recs))
    .with({ _tag: "TyRecord" }, ({ row }) => tsRow(row, names, recs))
    .with({ _tag: "TySingleton", base: "string" }, ({ value }) => `"${value}"`)
    .with({ _tag: "TySingleton" }, ({ value }) => value)
    .with({ _tag: "TyOneOf" }, ({ members }) =>
      _Str_join(
        " | ",
        map((m: Ty) => tsOfRaw(m, names, recs), members),
      ),
    )
    .exhaustive(),
);
