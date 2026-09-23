import type { Tok } from "./lexer";
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
  _Map_delete,
  _Map_get,
  _Map_has,
  _Map_keys,
  _Map_set,
  _Map_size,
  _Option_flatMap,
  _Option_map,
  _Option_unwrapOr,
  _Set_add,
  _Set_fromArray,
  _Set_has,
  _Str_codeAt,
  _Str_fromCode,
  _Str_get,
  _Str_join,
  _Str_length,
  _Str_slice,
  _Str_startsWith,
  _Str_trim,
  _curry,
  _tuple,
  add,
  and,
  compare,
  eq,
  filter,
  gt,
  length,
  lte,
  map,
  not,
  or,
  show,
  sub,
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

export const tsEnv: _Curry<[vars: Map<number, string>, recs: Map<string, string>], TsEnv> = _curry(
  2,
  (vars: Map<number, string>, recs: Map<string, string>) => ({ vars: vars, recs: recs }),
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
export const plainEnv: (vars: Map<number, string>) => TsEnv = (vars: Map<number, string>) =>
  tsEnv(vars, noRecs);
/**
 * Index but no letters: a fully concrete type has no generic head to name.
 */
export const recsEnv: (recs: Map<string, string>) => TsEnv = (recs: Map<string, string>) =>
  tsEnv(noVars, recs);
const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
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
 * Nested records are sorted too: `unify` reorders fields at every depth, and
 * an unsorted nested row would miss the alias even when the nested row itself
 * still folds (ADR 0107).
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
            _Array_prepend(`${label}${optional ? "?" : ""}: ${shapeType(fieldType, vars)}`, fs),
          shapeFieldsFrom(rest, vars),
        ),
      )
      .exhaustive(),
);
const shapeJoined: _Curry<[ts: Ty[], vars: Map<number, string>], string> = _curry(
  2,
  (ts: Ty[], vars: Map<number, string>) =>
    _Str_join(
      ", ",
      map((t: Ty) => shapeType(t, vars), ts),
    ),
);
/**
 * Type text for a shape key. Same spelling as `tsOf` with an empty index,
 * except a closed record's fields are sorted at every depth.
 */
const shapeType: _Curry<[t: Ty, vars: Map<number, string>], string> = _curry(
  2,
  (t: Ty, vars: Map<number, string>) =>
    match(widenLits(t))
      .with({ _tag: "TyRecord" }, ({ row }) =>
        match(shapeFieldsFrom(row, vars))
          .with({ _tag: "None" }, () => tsOf(t, plainEnv(vars)))
          .with({ _tag: "Some" }, ({ value: fs }) =>
            eq(length(fs), 0) ? "{}" : `{ ${_Str_join("; ", _Array_sort(fs))} }`,
          )
          .exhaustive(),
      )
      .with(
        (_v): _v is Extract<Ty, { _tag: "TyCon" }> => {
          const _g: any = _v;
          return _g._tag === "TyCon" && _g.name === "Array" && _g.args.length === 1;
        },
        ({ args: [elem] }) =>
          ((inner: string) =>
            match(widenLits(elem))
              .with({ _tag: "TyFn" }, () => `(${inner})[]`)
              .with({ _tag: "TyOneOf" }, () => `(${inner})[]`)
              .otherwise(() => `${inner}[]`))(shapeType(elem, vars)),
      )
      .with(
        (_v): _v is Extract<Ty, { _tag: "TyCon" }> => {
          const _g: any = _v;
          return _g._tag === "TyCon" && _g.name === "List" && _g.args.length === 1;
        },
        ({ args: [elem] }) => `Iterable<${shapeType(elem, vars)}>`,
      )
      .with(
        (_v): _v is Extract<Ty, { _tag: "TyCon" }> => {
          const _g: any = _v;
          return _g._tag === "TyCon" && _g.name === "Task" && _g.args.length === 2;
        },
        ({ args: [value, error] }) =>
          `() => Promise<Result<${shapeType(value, vars)}, ${shapeType(error, vars)}>>`,
      )
      .with({ _tag: "TyCon", name: "tuple" }, ({ args: elems }) => `[${shapeJoined(elems, vars)}]`)
      .with({ _tag: "TyCon" }, ({ name, args }) =>
        eq(length(args), 0) ? primitiveTs(name) : `${name}<${shapeJoined(args, vars)}>`,
      )
      .with({ _tag: "TyOneOf" }, ({ members }) =>
        _Str_join(
          " | ",
          map((m: Ty) => shapeType(m, vars), members),
        ),
      )
      .otherwise(() => tsOf(t, plainEnv(vars))),
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
      : _Option_flatMap(
          (k: string) =>
            match(_Map_get(k, env.recs))
              .with({ _tag: "Some", value: "" }, () => None as Option<string>)
              .with({ _tag: "Some" }, ({ value: name }) => Some(name) as Option<string>)
              .with({ _tag: "None" }, () => None as Option<string>)
              .exhaustive(),
          rowShapeKey(row, env.vars),
        ),
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
/**
 * A scheme variable prints as `A`, `B`, … then `T26`. A nominal type named
 * `Tok` is not one of those letters, so it must not be treated as a hole.
 */
const isDigitChar: (ch: string) => boolean = (ch: string) =>
  match(_Str_codeAt(0, ch))
    .with({ _tag: "Some" }, ({ value: n }) => and(n >= 48, n <= 57))
    .with({ _tag: "None" }, () => false)
    .exhaustive();
const isUpperChar: (ch: string) => boolean = (ch: string) =>
  match(_Str_codeAt(0, ch))
    .with({ _tag: "Some" }, ({ value: n }) => and(n >= 65, n <= 90))
    .with({ _tag: "None" }, () => false)
    .exhaustive();
const allDigitsFrom: _Curry<[s: string, i: number], boolean> = _curry(2, (s: string, i: number) =>
  i >= _Str_length(s) ? i > 1 : and(isDigitChar(_Str_slice(i, i + 1, s)), allDigitsFrom(s, i + 1)),
);
const isTypeLetter: (s: string) => boolean = (s: string) =>
  eq(_Str_length(s), 1)
    ? isUpperChar(s)
    : and(and(_Str_length(s) > 1, eq(_Str_slice(0, 1, s), "T")), allDigitsFrom(s, 1));
const depthStep: _Curry<[s: string, i: number, depth: number], number> = _curry(
  3,
  (s: string, i: number, depth: number) => {
    const ch: string = _Str_slice(i, i + 1, s);
    return or(or(or(eq(ch, "<"), eq(ch, "{")), eq(ch, "(")), eq(ch, "["))
      ? depth + 1
      : or(or(eq(ch, "}"), eq(ch, ")")), eq(ch, "]"))
        ? depth - 1
        : and(eq(ch, ">"), or(eq(i, 0), not(eq(_Str_slice(i - 1, i, s), "="))))
          ? depth - 1
          : depth;
  },
);
const hasSuffix: _Curry<[suf: string, s: string], boolean> = _curry(2, (suf: string, s: string) => {
  const n: number = _Str_length(suf);
  const m: number = _Str_length(s);
  return and(m >= n, eq(_Str_slice(m - n, m, s), suf));
});
/**
 * Split on `sep` only at bracket depth 0, so a nested `{ end: number; start: number }`
 * stays one field.
 */
const splitTop: _Curry<[sep: string, s: string], string[]> = _curry(2, (sep: string, s: string) =>
  splitTopAt(sep, s, 0, 0, 0, [] as string[]),
);
const splitTopAt: _Curry<
  [sep: string, s: string, i: number, depth: number, start: number, acc: string[]],
  string[]
> = _curry(6, (sep: string, s: string, i: number, depth: number, start: number, acc: string[]) =>
  i >= _Str_length(s)
    ? _Array_append(_Str_slice(start, _Str_length(s), s), acc)
    : ((n: number) =>
        and(and(eq(depth, 0), i + n <= _Str_length(s)), eq(_Str_slice(i, i + n, s), sep))
          ? splitTopAt(sep, s, i + n, 0, i + n, _Array_append(_Str_slice(start, i, s), acc))
          : splitTopAt(sep, s, i + 1, depthStep(s, i, depth), start, acc))(_Str_length(sep)),
);
const findTop: _Curry<[ch: string, s: string, i: number, depth: number], Option<number>> = _curry(
  4,
  (ch: string, s: string, i: number, depth: number) =>
    i >= _Str_length(s)
      ? (None as Option<number>)
      : and(eq(depth, 0), eq(_Str_slice(i, i + 1, s), ch))
        ? (Some(i) as Option<number>)
        : findTop(ch, s, i + 1, depthStep(s, i, depth)),
);
const bindLetter: <A, B>(letter: A, concrete: B, subst: Map<A, B>) => Option<Map<A, B>> = _curry(
  3,
  <A, B>(letter: A, concrete: B, subst: Map<A, B>) =>
    match(_Map_get(letter, subst))
      .with({ _tag: "None" }, () => Some(_Map_set(letter, concrete, subst)))
      .with({ _tag: "Some" }, ({ value: prev }) => (eq(prev, concrete) ? Some(subst) : None))
      .exhaustive(),
);
const agreeList: _Curry<
  [useTs: string[], aliasTs: string[], subst: Map<string, string>, i: number],
  Option<Map<string, string>>
> = _curry(4, (useTs: string[], aliasTs: string[], subst: Map<string, string>, i: number) =>
  not(eq(length(useTs), length(aliasTs)))
    ? (None as Option<Map<string, string>>)
    : i >= length(useTs)
      ? (Some(subst) as Option<Map<string, string>>)
      : match(_Array_get(i, useTs))
          .with({ _tag: "None" }, () => None as Option<Map<string, string>>)
          .with({ _tag: "Some" }, ({ value: u }) =>
            match(_Array_get(i, aliasTs))
              .with({ _tag: "None" }, () => None as Option<Map<string, string>>)
              .with({ _tag: "Some" }, ({ value: a }) =>
                match(typesAgree(u, a, subst))
                  .with({ _tag: "None" }, () => None as Option<Map<string, string>>)
                  .with({ _tag: "Some" }, ({ value: subst1 }) =>
                    agreeList(useTs, aliasTs, subst1, i + 1),
                  )
                  .exhaustive(),
              )
              .exhaustive(),
          )
          .exhaustive(),
);
const peelApp: (s: string) => Option<{ name: string; args: string }> = (s: string) =>
  match(findTop("<", s, 0, 0))
    .with({ _tag: "None" }, () => None as Option<{ name: string; args: string }>)
    .with({ _tag: "Some" }, ({ value: i }) =>
      and(hasSuffix(">", s), i > 0)
        ? (Some({
            name: _Str_slice(0, i, s),
            args: _Str_slice(i + 1, _Str_length(s) - 1, s),
          }) as Option<{ name: string; args: string }>)
        : (None as Option<{ name: string; args: string }>),
    )
    .exhaustive();
const wrapped: _Curry<[open: string, close: string, s: string], boolean> = _curry(
  3,
  (open: string, close: string, s: string) =>
    and(and(_Str_startsWith(open, s), hasSuffix(close, s)), _Str_length(s) >= 2),
);
const innerOf: (s: string) => string = (s: string) => _Str_slice(1, _Str_length(s) - 1, s);
const stripParens: (s: string) => string = (s: string) =>
  wrapped("(", ")", s) ? _Str_slice(1, _Str_length(s) - 1, s) : s;
const agreeArray: _Curry<
  [useT: string, aliasT: string, subst: Map<string, string>],
  Option<Map<string, string>>
> = _curry(3, (useT: string, aliasT: string, subst: Map<string, string>) =>
  and(hasSuffix("[]", useT), hasSuffix("[]", aliasT))
    ? typesAgree(
        stripParens(_Str_slice(0, _Str_length(useT) - 2, useT)),
        stripParens(_Str_slice(0, _Str_length(aliasT) - 2, aliasT)),
        subst,
      )
    : (None as Option<Map<string, string>>),
);
const agreeApp: _Curry<
  [useT: string, aliasT: string, subst: Map<string, string>],
  Option<Map<string, string>>
> = _curry(3, (useT: string, aliasT: string, subst: Map<string, string>) =>
  match(peelApp(useT))
    .with({ _tag: "None" }, () => None as Option<Map<string, string>>)
    .with({ _tag: "Some" }, ({ value: u }) =>
      match(peelApp(aliasT))
        .with({ _tag: "None" }, () => None as Option<Map<string, string>>)
        .with({ _tag: "Some" }, ({ value: a }) =>
          eq(u.name, a.name)
            ? agreeList(splitTop(", ", u.args), splitTop(", ", a.args), subst, 0)
            : (None as Option<Map<string, string>>),
        )
        .exhaustive(),
    )
    .exhaustive(),
);
const splitLabel: (s: string) => Option<{ label: string; ty: string }> = (s: string) =>
  match(findTop(":", s, 0, 0))
    .with({ _tag: "None" }, () => None as Option<{ label: string; ty: string }>)
    .with(
      { _tag: "Some" },
      ({ value: i }) =>
        Some({ label: _Str_slice(0, i, s), ty: _Str_slice(i + 1, _Str_length(s), s) }) as Option<{
          label: string;
          ty: string;
        }>,
    )
    .exhaustive();
const fieldAgree: _Curry<
  [useF: string, aliasF: string, subst: Map<string, string>],
  Option<Map<string, string>>
> = _curry(3, (useF: string, aliasF: string, subst: Map<string, string>) =>
  match(splitLabel(useF))
    .with({ _tag: "None" }, () => None as Option<Map<string, string>>)
    .with({ _tag: "Some" }, ({ value: u }) =>
      match(splitLabel(aliasF))
        .with({ _tag: "None" }, () => None as Option<Map<string, string>>)
        .with({ _tag: "Some" }, ({ value: a }) =>
          eq(_Str_trim(u.label), _Str_trim(a.label))
            ? typesAgree(_Str_trim(u.ty), _Str_trim(a.ty), subst)
            : (None as Option<Map<string, string>>),
        )
        .exhaustive(),
    )
    .exhaustive(),
);
const fieldsAgree: _Curry<
  [useFs: string[], aliasFs: string[], subst: Map<string, string>],
  Option<Map<string, string>>
> = _curry(3, (useFs: string[], aliasFs: string[], subst: Map<string, string>) =>
  agreeFields(useFs, aliasFs, subst, 0),
);
const agreeFields: _Curry<
  [useFs: string[], aliasFs: string[], subst: Map<string, string>, i: number],
  Option<Map<string, string>>
> = _curry(4, (useFs: string[], aliasFs: string[], subst: Map<string, string>, i: number) =>
  not(eq(length(useFs), length(aliasFs)))
    ? (None as Option<Map<string, string>>)
    : i >= length(useFs)
      ? (Some(subst) as Option<Map<string, string>>)
      : match(_Array_get(i, useFs))
          .with({ _tag: "None" }, () => None as Option<Map<string, string>>)
          .with({ _tag: "Some" }, ({ value: u }) =>
            match(_Array_get(i, aliasFs))
              .with({ _tag: "None" }, () => None as Option<Map<string, string>>)
              .with({ _tag: "Some" }, ({ value: a }) =>
                match(fieldAgree(u, a, subst))
                  .with({ _tag: "None" }, () => None as Option<Map<string, string>>)
                  .with({ _tag: "Some" }, ({ value: subst1 }) =>
                    agreeFields(useFs, aliasFs, subst1, i + 1),
                  )
                  .exhaustive(),
              )
              .exhaustive(),
          )
          .exhaustive(),
);
const agreeBrace: _Curry<
  [useT: string, aliasT: string, subst: Map<string, string>],
  Option<Map<string, string>>
> = _curry(3, (useT: string, aliasT: string, subst: Map<string, string>) =>
  and(wrapped("{", "}", useT), wrapped("{", "}", aliasT))
    ? fieldsAgree(splitTop("; ", innerOf(useT)), splitTop("; ", innerOf(aliasT)), subst)
    : (None as Option<Map<string, string>>),
);
const agreeTuple: _Curry<
  [useT: string, aliasT: string, subst: Map<string, string>],
  Option<Map<string, string>>
> = _curry(3, (useT: string, aliasT: string, subst: Map<string, string>) =>
  and(wrapped("[", "]", useT), wrapped("[", "]", aliasT))
    ? agreeList(splitTop(", ", innerOf(useT)), splitTop(", ", innerOf(aliasT)), subst, 0)
    : (None as Option<Map<string, string>>),
);
const agreeUnion: _Curry<
  [useT: string, aliasT: string, subst: Map<string, string>],
  Option<Map<string, string>>
> = _curry(3, (useT: string, aliasT: string, subst: Map<string, string>) => {
  const us: string[] = splitTop(" | ", useT);
  const als: string[] = splitTop(" | ", aliasT);
  return and(length(us) > 1, eq(length(us), length(als)))
    ? agreeList(us, als, subst, 0)
    : (None as Option<Map<string, string>>);
});
const firstSome: <A>(a: Option<A>, b: Option<A>) => Option<A> = _curry(
  2,
  <A>(a: Option<A>, b: Option<A>) =>
    match(a)
      .with({ _tag: "Some" }, () => a)
      .with({ _tag: "None" }, () => b)
      .exhaustive(),
);
/**
 * `useT` matches `aliasT` exactly, or by binding a scheme letter (`A`, `T26`)
 * to the alias's concrete spelling. The binding has to be consistent: `A`
 * cannot be `number` in one field and `string` in another.
 */
const typesAgree: _Curry<
  [useT: string, aliasT: string, subst: Map<string, string>],
  Option<Map<string, string>>
> = _curry(3, (useT: string, aliasT: string, subst: Map<string, string>) =>
  eq(useT, aliasT)
    ? (Some(subst) as Option<Map<string, string>>)
    : isTypeLetter(useT)
      ? bindLetter(useT, aliasT, subst)
      : firstSome(
          agreeArray(useT, aliasT, subst),
          firstSome(
            agreeApp(useT, aliasT, subst),
            firstSome(
              agreeBrace(useT, aliasT, subst),
              firstSome(agreeTuple(useT, aliasT, subst), agreeUnion(useT, aliasT, subst)),
            ),
          ),
        ),
);
/**
 * One alias explains this closed row. Two aliases (a `{ x: A, y: B }` that
 * matches both a numeric point and a string point) explain nothing — folding
 * either name would be a guess.
 */
const uniqueSubst: _Curry<
  [useKey: string, keys: string[], i: number, found: Option<Map<string, string>>],
  Option<Map<string, string>>
> = _curry(4, (useKey: string, keys: string[], i: number, found: Option<Map<string, string>>) =>
  match(_Array_get(i, keys))
    .with({ _tag: "None" }, () => found)
    .with({ _tag: "Some" }, ({ value: k }) =>
      match(fieldsAgree(splitTop("; ", useKey), splitTop("; ", k), new Map<string, string>()))
        .with({ _tag: "None" }, () => uniqueSubst(useKey, keys, i + 1, found))
        .with({ _tag: "Some" }, ({ value: subst }) =>
          match(found)
            .with({ _tag: "None" }, () =>
              uniqueSubst(useKey, keys, i + 1, Some(subst) as Option<Map<string, string>>),
            )
            .with({ _tag: "Some" }, () =>
              uniqueSubst(
                useKey,
                keys,
                i + 1,
                Some(new Map([["*", ""]])) as Option<Map<string, string>>,
              ),
            )
            .exhaustive(),
        )
        .exhaustive(),
    )
    .exhaustive(),
);
const substOf: <A, B>(
  useKey: string,
  env: { recs: Map<string, A> } & B,
) => Option<Map<string, string>> = _curry(
  2,
  <A, B>(useKey: string, env: { recs: Map<string, A> } & B) =>
    match(uniqueSubst(useKey, _Map_keys(env.recs), 0, None as Option<Map<string, string>>))
      .with({ _tag: "None" }, () => None as Option<Map<string, string>>)
      .with({ _tag: "Some" }, ({ value: subst }) =>
        _Map_has("*", subst)
          ? (None as Option<Map<string, string>>)
          : (Some(subst) as Option<Map<string, string>>),
      )
      .exhaustive(),
);
const idForLetter: <A, B>(letter: A, ids: B[], vars: Map<B, A>, i: number) => Option<B> = _curry(
  4,
  <A, B>(letter: A, ids: B[], vars: Map<B, A>, i: number) =>
    match(_Array_get(i, ids))
      .with({ _tag: "None" }, () => None)
      .with({ _tag: "Some" }, ({ value: id }) =>
        match(_Map_get(id, vars))
          .with({ _tag: "Some" }, ({ value: name }) =>
            eq(name, letter) ? Some(id) : idForLetter(letter, ids, vars, i + 1),
          )
          .with({ _tag: "None" }, () => idForLetter(letter, ids, vars, i + 1))
          .exhaustive(),
      )
      .exhaustive(),
);
/**
 * A variable pinned to two different concrete types is dropped. Printing it
 * as either one would make the other occurrence not assignable.
 */
const notePin: <A, B>(
  id: A,
  concrete: B,
  st: { bad: Set<A>; pins: Map<A, B> },
) => { bad: Set<A>; pins: Map<A, B> } = _curry(
  3,
  <A, B>(id: A, concrete: B, st: { bad: Set<A>; pins: Map<A, B> }) =>
    _Set_has(id, st.bad)
      ? st
      : match(_Map_get(id, st.pins))
          .with({ _tag: "None" }, () => ({ pins: _Map_set(id, concrete, st.pins), bad: st.bad }))
          .with({ _tag: "Some" }, ({ value: prev }) =>
            eq(prev, concrete) ? st : { pins: _Map_delete(id, st.pins), bad: _Set_add(id, st.bad) },
          )
          .exhaustive(),
);
const mergeSubst: <A, B, C>(
  letters: A[],
  subst: Map<A, B>,
  vars: Map<C, A>,
  ids: C[],
  st: { bad: Set<C>; pins: Map<C, B> },
  i: number,
) => { bad: Set<C>; pins: Map<C, B> } = _curry(
  6,
  <A, B, C>(
    letters: A[],
    subst: Map<A, B>,
    vars: Map<C, A>,
    ids: C[],
    st: { bad: Set<C>; pins: Map<C, B> },
    i: number,
  ) =>
    match(_Array_get(i, letters))
      .with({ _tag: "None" }, () => st)
      .with({ _tag: "Some" }, ({ value: letter }) =>
        match(_Map_get(letter, subst))
          .with({ _tag: "None" }, () => mergeSubst(letters, subst, vars, ids, st, i + 1))
          .with({ _tag: "Some" }, ({ value: concrete }) =>
            match(idForLetter(letter, ids, vars, 0))
              .with({ _tag: "None" }, () => mergeSubst(letters, subst, vars, ids, st, i + 1))
              .with({ _tag: "Some" }, ({ value: id }) =>
                mergeSubst(letters, subst, vars, ids, notePin(id, concrete, st), i + 1),
              )
              .exhaustive(),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const emptyPins: { pins: Map<number, string>; bad: Set<number> } = {
  pins: new Map([]),
  bad: _Set_fromArray([]),
};
const considerClosed: <A, B>(
  row: Row,
  env: { vars: Map<number, string>; recs: Map<string, A> } & B,
  st: { bad: Set<number>; pins: Map<number, string> },
) => { bad: Set<number>; pins: Map<number, string> } = _curry(
  3,
  <A, B>(
    row: Row,
    env: { vars: Map<number, string>; recs: Map<string, A> } & B,
    st: { bad: Set<number>; pins: Map<number, string> },
  ) =>
    match(rowShapeKey(row, env.vars))
      .with({ _tag: "None" }, () => st)
      .with({ _tag: "Some" }, ({ value: key }) =>
        match(_Map_get(key, env.recs))
          .with({ _tag: "Some" }, () => st)
          .with({ _tag: "None" }, () =>
            match(substOf(key, env))
              .with({ _tag: "None" }, () => st)
              .with({ _tag: "Some" }, ({ value: subst }) =>
                mergeSubst(_Map_keys(subst), subst, env.vars, _Map_keys(env.vars), st, 0),
              )
              .exhaustive(),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const pinInTys: <A, B>(
  ts: Ty[],
  env: { vars: Map<number, string>; recs: Map<string, A> } & B,
  st: { bad: Set<number>; pins: Map<number, string> },
  i: number,
) => { bad: Set<number>; pins: Map<number, string> } = _curry(
  4,
  <A, B>(
    ts: Ty[],
    env: { vars: Map<number, string>; recs: Map<string, A> } & B,
    st: { bad: Set<number>; pins: Map<number, string> },
    i: number,
  ) =>
    match(_Array_get(i, ts))
      .with({ _tag: "None" }, () => st)
      .with({ _tag: "Some" }, ({ value: t }) => pinInTys(ts, env, pinInTy(t, env, st), i + 1))
      .exhaustive(),
);
const pinInRow: <A, B>(
  row: Row,
  env: { vars: Map<number, string>; recs: Map<string, A> } & B,
  st: { bad: Set<number>; pins: Map<number, string> },
) => { bad: Set<number>; pins: Map<number, string> } = _curry(
  3,
  <A, B>(
    row: Row,
    env: { vars: Map<number, string>; recs: Map<string, A> } & B,
    st: { bad: Set<number>; pins: Map<number, string> },
  ) =>
    match(row)
      .with({ _tag: "RowExtend" }, ({ fieldType: ft, rest }) =>
        pinInRow(rest, env, pinInTy(ft, env, st)),
      )
      .otherwise(() => st),
);
const pinInTy: <A, B>(
  t: Ty,
  env: { vars: Map<number, string>; recs: Map<string, A> } & B,
  st: { bad: Set<number>; pins: Map<number, string> },
) => { bad: Set<number>; pins: Map<number, string> } = _curry(
  3,
  <A, B>(
    t: Ty,
    env: { vars: Map<number, string>; recs: Map<string, A> } & B,
    st: { bad: Set<number>; pins: Map<number, string> },
  ) =>
    match(t)
      .with({ _tag: "TyRecord" }, ({ row }) => pinInRow(row, env, considerClosed(row, env, st)))
      .with({ _tag: "TyFn" }, ({ from: a, to: b }) => pinInTy(b, env, pinInTy(a, env, st)))
      .with({ _tag: "TyCon" }, ({ args }) => pinInTys(args, env, st, 0))
      .with({ _tag: "TyOneOf" }, ({ members: ms }) => pinInTys(ms, env, st, 0))
      .otherwise(() => st),
);
/**
 * Variables a unique in-scope record alias explains, as concrete type text.
 * Open rows are skipped: `{ start: A, end: B } & R` is not the alias. An
 * exact key needs no pin — `aliasNameFor` already prints the name.
 */
const pinAliasVars: <A, B>(
  t: Ty,
  env: { vars: Map<number, string>; recs: Map<string, A> } & B,
) => Map<number, string> = _curry(
  2,
  <A, B>(t: Ty, env: { vars: Map<number, string>; recs: Map<string, A> } & B) =>
    pinInTy(t, env, emptyPins).pins,
);
const overlayPins: <A, B>(ids: A[], pins: Map<A, B>, names: Map<A, B>, i: number) => Map<A, B> =
  _curry(4, <A, B>(ids: A[], pins: Map<A, B>, names: Map<A, B>, i: number) =>
    match(_Array_get(i, ids))
      .with({ _tag: "None" }, () => names)
      .with({ _tag: "Some" }, ({ value: id }) =>
        match(_Map_get(id, pins))
          .with({ _tag: "Some" }, ({ value: concrete }) =>
            overlayPins(ids, pins, _Map_set(id, concrete, names), i + 1),
          )
          .with({ _tag: "None" }, () => overlayPins(ids, pins, names, i + 1))
          .exhaustive(),
      )
      .exhaustive(),
  );
const headLetters: <A, B>(names: Map<A, string>, pins: Map<A, B>) => string = _curry(
  2,
  <A, B>(names: Map<A, string>, pins: Map<A, B>) => {
    const letters: string[] = map(
      (id: A) => _Option_unwrapOr("", _Map_get(id, names)),
      filter((id: A) => not(_Map_has(id, pins)), _Map_keys(names)),
    );
    return eq(length(letters), 0) ? "" : `<${_Str_join(", ", letters)}>`;
  },
);
/**
 * Render a scheme with record-alias pins applied (ADR 0106). The same
 * substitution covers every occurrence of a variable, so a parameter and the
 * return cannot disagree about it. `head` omits pinned letters — they are
 * concrete type text now, not parameters. `pins` is the id → text map a
 * non-function binding can print with, leaving every unpinned var `unknown`.
 */
export const schemeRender: <B>(
  sc: { vars: number[]; rvars: number[]; ty: Ty } & B,
  recs: Map<string, string>,
) => { env: TsEnv; head: string; pins: Map<number, string> } = _curry(
  2,
  <B>(sc: { vars: number[]; rvars: number[]; ty: Ty } & B, recs: Map<string, string>) => {
    const names: Map<number, string> = genericNames(sc);
    const pins: Map<number, string> = pinAliasVars(sc.ty, tsEnv(names, recs));
    return {
      env: tsEnv(overlayPins(_Map_keys(pins), pins, names, 0), recs),
      head: headLetters(names, pins),
      pins: pins,
    };
  },
);
