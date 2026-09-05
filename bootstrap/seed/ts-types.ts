import type { Row, Ty } from "./types";

/**
 * The rendering environment: generic letters for type AND row vars, plus the
 * record alias index. ONE record rather than two threaded arguments — every
 * emitted function is curried and `curriedOverloads` writes a signature per
 * composition of its arity (ADR 0037), so a second argument DOUBLES the
 * overload block of every renderer carrying it. Annotated at each use so the
 * row stays closed and folds to `TsEnv` rather than printing `{ vars: … } & R`.
 */
export type TsEnv = { vars: Map<number, string>; recs: Map<string, string> };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_concat,
  _Array_get,
  _Array_prepend,
  _Array_sort,
  _Map_get,
  _Map_set,
  _Map_size,
  _Option_flatMap,
  _Option_map,
  _Option_unwrapOr,
  _Str_fromCode,
  _Str_get,
  _Str_join,
  _curry,
  _tuple,
  compare,
  eq,
  length,
  map,
  not,
  show,
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
} from "./types";
import { widenLits } from "./schemes";

export const tsEnv: <A, B>(vars: A, recs: B) => { vars: A; recs: B } = _curry(
  2,
  <A, B>(vars: A, recs: B) => ({ vars: vars, recs: recs }),
);
/**
 * Pinned (ADR 0044): a bare `#{}` generalizes to `Map<unknown, unknown>`, which
 * `_Curry`'s exact argument prefixes reject where the old overload block let it
 * through.
 */
const noVars: Map<number, string> = new Map<number, string>();
const noRecs: Map<string, string> = new Map<string, string>();
/**
 * Letters but no index — the many call sites with no module scope to fold in.
 */
export const plainEnv: <A>(vars: A) => { vars: A; recs: Map<string, string> } = <A>(vars: A) =>
  tsEnv(vars, noRecs);
/**
 * Index but no letters: a fully concrete type has no generic head to name.
 */
export const recsEnv: <A>(recs: A) => { vars: Map<number, string>; recs: A } = <A>(recs: A) =>
  tsEnv(noVars, recs);
const letters: string = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
/**
 * `A`, `B`, … then `T26`, `T27`, … past the alphabet.
 */
export const letterAt: (i: number) => string = (i: number) =>
  _Option_unwrapOr(`T${show(i)}`, _Str_get(i, letters));
/**
 * Generic names for both type and row variables. The fresh supply is shared,
 * so the two lists have no colliding ids.
 */
export const genericNames: <A, B>(sc: { vars: A[]; rvars: A[] } & B) => Map<A, string> = <A, B>(
  sc: { vars: A[]; rvars: A[] } & B,
) => genericNamesFrom(_Array_concat(sc.vars, sc.rvars), 0, new Map<A, string>());
const genericNamesFrom: <A>(ids: A[], i: number, names: Map<A, string>) => Map<A, string> = _curry(
  3,
  <A>(ids: A[], i: number, names: Map<A, string>) =>
    match(_Array_get(i, ids))
      .with({ _tag: "None" }, () => names)
      .with({ _tag: "Some" }, ({ value: id }) =>
        genericNamesFrom(ids, i + 1, _Map_set(id, letterAt(i), names)),
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
const namesOf: _Curry<[ts: Ty[], env: TsEnv], string> = _curry(2, (ts: Ty[], env: TsEnv) =>
  _Str_join(
    ", ",
    map((t: Ty) => tsOfRaw(t, env), ts),
  ),
);
const nominal: _Curry<[name: string, args: Ty[], env: TsEnv], string> = _curry(
  3,
  (name: string, args: Ty[], env: TsEnv) =>
    eq(length(args), 0) ? primitiveTs(name) : `${name}<${namesOf(args, env)}>`,
);
const tsRowFields: _Curry<[row: Row, env: TsEnv], [string[], Option<number>]> = _curry(
  2,
  (row: Row, env: TsEnv) =>
    match(row)
      .with({ _tag: "RowEmpty" }, () => _tuple([] as string[], None as Option<number>))
      .with({ _tag: "RowVar" }, ({ id }) => _tuple([] as string[], Some(id) as Option<number>))
      .with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) =>
        (([fields, tail]: [string[], Option<number>]) =>
          _tuple(
            _Array_prepend(`${label}${optional ? "?" : ""}: ${tsOfRaw(fieldType, env)}`, fields),
            tail,
          ))(tsRowFields(rest, env)),
      )
      .exhaustive(),
);
/**
 * Fields of a CLOSED row, each rendered with NO index. `None` for an open row:
 * `{ … } & R` is not the alias, only its prefix, so it has no name to take.
 */
const shapeFieldsFrom: _Curry<[row: Row, vars: Map<number, string>], Option<string[]>> = _curry(
  2,
  (row: Row, vars: Map<number, string>) =>
    match(row)
      .with({ _tag: "RowEmpty" }, () => Some([] as string[]) as Option<string[]>)
      .with({ _tag: "RowVar" }, () => None as Option<string[]>)
      .with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) =>
        _Option_map(
          (fs: string[]) =>
            _Array_prepend(
              `${label}${optional ? "?" : ""}: ${tsOf(fieldType, plainEnv(vars))}`,
              fs,
            ),
          shapeFieldsFrom(rest, vars),
        ),
      )
      .exhaustive(),
);
/**
 * The index key for a row. Sorted, because a row carries fields in the order
 * `unify` extended it: the same record type reaches `tsRow` as both
 * `{ ty; rvars; vars }` and `{ vars; rvars; ty }`, and both must key alike.
 * Rendered index-free so building the index and looking a row up in it can
 * never disagree about a nested field's spelling.
 */
export const rowShapeKey: _Curry<[row: Row, vars: Map<number, string>], Option<string>> = _curry(
  2,
  (row: Row, vars: Map<number, string>) =>
    _Option_map((fs: string[]) => _Str_join("; ", _Array_sort(fs)), shapeFieldsFrom(row, vars)),
);
/**
 * The declared name for a row, when the emitting module declared one. The
 * empty-index short-circuit keeps the key off the hot path for the many call
 * sites that render with no index at all.
 */
const aliasNameFor: _Curry<[row: Row, env: TsEnv], Option<string>> = _curry(
  2,
  (row: Row, env: TsEnv) =>
    eq(_Map_size(env.recs), 0)
      ? (None as Option<string>)
      : _Option_flatMap((k: string) => _Map_get(k, env.recs), rowShapeKey(row, env.vars)),
);
const tsRow: _Curry<[row: Row, env: TsEnv], string> = _curry(2, (row: Row, env: TsEnv) =>
  match(aliasNameFor(row, env))
    .with({ _tag: "Some" }, ({ value: alias }) => alias)
    .with({ _tag: "None" }, () =>
      (([fields, tail]: [string[], Option<number>]) => {
        const body: string = eq(length(fields), 0) ? "{}" : `{ ${_Str_join("; ", fields)} }`;
        return match(tail)
          .with({ _tag: "None" }, () => body)
          .with({ _tag: "Some" }, ({ value: id }) =>
            match(_Map_get(id, env.vars))
              .with({ _tag: "None" }, () => body)
              .with({ _tag: "Some" }, ({ value: name }) =>
                eq(length(fields), 0) ? name : `(${body} & ${name})`,
              )
              .exhaustive(),
          )
          .exhaustive();
      })(tsRowFields(row, env)),
    )
    .exhaustive(),
);
const tsArrow: _Curry<[fromT: Ty, toT: Ty, env: TsEnv], string> = _curry(
  3,
  (fromT: Ty, toT: Ty, env: TsEnv) =>
    isUnit(fromT)
      ? `() => ${tsOfRaw(toT, env)}`
      : tsArrowParams(fromT, toT, env, 0, [] as string[]),
);
const tsArrowParams: _Curry<[fromT: Ty, toT: Ty, env: TsEnv, i: number, params: string[]], string> =
  _curry(5, (fromT: Ty, toT: Ty, env: TsEnv, i: number, params: string[]) => {
    const params1: string[] = _Array_append(
      `${_Str_fromCode(97 + i)}: ${tsOfRaw(fromT, env)}`,
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
        ({ from: nextFrom, to: nextTo }) => tsArrowParams(nextFrom, nextTo, env, i + 1, params1),
      )
      .otherwise(() => `(${_Str_join(", ", params1)}) => ${tsOfRaw(toT, env)}`);
  });
/**
 * Render an already-zonked HM type into strict TypeScript syntax. Bare
 * singleton types widen at this boundary just as the TS backend does.
 */
export const tsOf: _Curry<[t: Ty, env: TsEnv], string> = _curry(2, (t: Ty, env: TsEnv) =>
  tsOfRaw(widenLits(t), env),
);
const tsOfRaw: _Curry<[t: Ty, env: TsEnv], string> = _curry(2, (t: Ty, env: TsEnv) =>
  match(t)
    .with({ _tag: "TyVar" }, ({ id }) => _Option_unwrapOr("unknown", _Map_get(id, env.vars)))
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
            .otherwise(() => `${inner}[]`))(tsOfRaw(elem, env)),
    )
    .with(
      (_v): _v is Extract<Ty, { _tag: "TyCon" }> => {
        const _g: any = _v;
        return _g._tag === "TyCon" && _g.name === "List" && _g.args.length === 1;
      },
      ({ args: [elem] }) => `Iterable<${tsOfRaw(elem, env)}>`,
    )
    .with(
      (_v): _v is Extract<Ty, { _tag: "TyCon" }> => {
        const _g: any = _v;
        return _g._tag === "TyCon" && _g.name === "Task" && _g.args.length === 2;
      },
      ({ args: [value, error] }) =>
        `() => Promise<Result<${tsOfRaw(value, env)}, ${tsOfRaw(error, env)}>>`,
    )
    .with({ _tag: "TyCon", name: "tuple" }, ({ args: elems }) => `[${namesOf(elems, env)}]`)
    .with({ _tag: "TyCon" }, ({ name, args }) => nominal(name, args, env))
    .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tsArrow(fromT, toT, env))
    .with({ _tag: "TyRecord" }, ({ row }) => tsRow(row, env))
    .with({ _tag: "TySingleton", base: "string" }, ({ value }) => `"${value}"`)
    .with({ _tag: "TySingleton" }, ({ value }) => value)
    .with({ _tag: "TyOneOf" }, ({ members }) =>
      _Str_join(
        " | ",
        map((m: Ty) => tsOfRaw(m, env), members),
      ),
    )
    .exhaustive(),
);
