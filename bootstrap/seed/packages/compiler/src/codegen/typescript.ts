import type { LocTok } from "../lexer/lexer";
import type {
  AliasField,
  Ctor,
  CtorField,
  Expr,
  Field,
  InterpPart,
  LamParam,
  LoopParam,
  MapEntry,
  MatchArm,
  SeqElem,
  Span,
  Stmt,
  TypeExpr,
} from "../ast/ast";
import type { Row, SpanAt, St, Ty } from "../infer/types";
import type { AliasInfo } from "../infer/schemes";
import type { TsApi } from "../infer/infer";
import type { CtorFactoryTs, GenOpts, ParamAnnots } from "./codegen";
import type { TsEnv } from "../dts/ts-types";

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_concat,
  _Array_contains,
  _Array_dedupeBy,
  _Array_drop,
  _Array_get,
  _Array_prepend,
  _Array_reverse,
  _Array_sort,
  _Array_sortBy,
  _Array_take,
  _List_concat,
  _Map_delete,
  _Map_get,
  _Map_keys,
  _Map_set,
  _Map_size,
  _Map_values,
  _Option_flatMap,
  _Option_isSome,
  _Option_map,
  _Option_match,
  _Option_unwrapOr,
  _Set_add,
  _Set_fromArray,
  _Set_has,
  _Str_contains,
  _Str_fromCode,
  _Str_join,
  _Str_split,
  _Str_startsWith,
  _compare,
  _compareFieldNames,
  _compareFirstKey,
  _compareRecords,
  _compareSortedKeys,
  _curry,
  _keyOf,
  _list,
  _setAdd,
  _tuple,
  add,
  and,
  compare,
  concat,
  eq,
  filter,
  gt,
  gte,
  length,
  lt,
  lte,
  map,
  not,
  or,
  reduce,
  show,
  sub,
} from "@mochi/compiler/runtime";

import * as Ast from "../ast/ast";
import * as Schemes from "../infer/schemes";
import {
  mkSt,
  freshVar,
  tVar,
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
} from "../infer/types";
import {
  typeExprToType,
  collect,
  emptyVarSets,
  spreadRowInto,
  rowHasLabel,
} from "../infer/schemes";
import { builtinTypeDecls, keysOf } from "../ast/ctors";
import { codegenWith, jsDoc, jsGenOpts, runtimeDepNames } from "./codegen";
import { inferProgramTypes, exprSpan } from "../infer/infer";
import { bindingHooksFor, runBindingHooks } from "../extensions/extensions";
import {
  genericNames,
  letterAt,
  plainEnv,
  recsEnv,
  rowAliasName,
  rowShapeKey,
  schemeRender,
  tsEnv,
  tsOf,
} from "../dts/ts-types";
/**
 * Type params are bound POSITIONALLY: the i-th param is var `i`, rendered as
 * the i-th letter. Both maps are built from one index so a field type and the
 * declaration head always agree on a param's letter.
 */
const paramVarsFrom: <A>(params: A[], i: number) => Map<A, Ty> = _curry(
  2,
  <A>(params: A[], i: number) =>
    _Option_match(
      _Array_get(i, params),
      () => new Map<A, Ty>(),
      (p) => _Map_set(p, tVar(i), paramVarsFrom(params, i + 1)),
    ),
);
const paramNamesFrom: <A>(params: A[], i: number) => Map<number, string> = _curry(
  2,
  <A>(params: A[], i: number) =>
    _Option_match(
      _Array_get(i, params),
      () => new Map<number, string>(),
      () => _Map_set(i, letterAt(i), paramNamesFrom(params, i + 1)),
    ),
);
/**
 * `<A, B>` for a parameterised decl, `""` for a nullary one.
 */
const genericHead: <A>(params: A[], i: number, acc: string[]) => string = _curry(
  3,
  <A>(params: A[], i: number, acc: string[]) =>
    _Option_match(
      _Array_get(i, params),
      () => (length(acc) === 0 ? "" : `<${_Str_join(", ", acc)}>`),
      () => genericHead(params, i + 1, _Array_append(letterAt(i), acc)),
    ),
);
const fieldTs$ = (
  te: TypeExpr,
  params: string[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
): string => {
  const vars: Map<string, Ty> = paramVarsFrom(params, 0);
  const names: Map<number, string> = paramNamesFrom(params, 0);
  return (([t, _vars, _st]: [Ty, Map<string, Ty>, St]) => tsOf(t, tsEnv(names, recs)))(
    typeExprToType(te, vars, mkSt(length(params)), aliases, _Set_fromArray([] as string[])),
  );
};
/**
 * A ctor field's type is a full TypeExpr (ADR 0015). Lower it to a Ty first —
 * params bound positionally, aliases left nominal — then render through `tsOf`,
 * so the TS grammar has exactly one encoder.
 */
const fieldTs: _Curry<
  [te: TypeExpr, params: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>],
  string
> = _curry(4, fieldTs$);
const ctorFieldsFrom$ = (
  fields: CtorField[],
  keys: string[],
  params: string[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, fields),
    () => [] as string[],
    (fld) =>
      _Array_prepend(
        `${_Option_unwrapOr(`_${show(i)}`, _Array_get(i, keys))}: ${fieldTs$(fld.fieldType, params, aliases, recs)}`,
        ctorFieldsFrom$(fields, keys, params, aliases, recs, i + 1),
      ),
  );
/**
 * Keys come from `keysOf` (the same projection the runtime shape uses, so a
 * declared field name and its emitted key can never drift); this loop only
 * ever reads `fieldType`.
 */
const ctorFieldsFrom: _Curry<
  [
    fields: CtorField[],
    keys: string[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(6, ctorFieldsFrom$);
const ctorVariant$ = (
  c: Ctor,
  params: string[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
): string => {
  const fields: string[] = ctorFieldsFrom$(c.fields, keysOf(c.fields), params, aliases, recs, 0);
  return length(fields) === 0
    ? `{ ${c.tagKey}: "${c.tagLit}" }`
    : `{ ${c.tagKey}: "${c.tagLit}"; ${_Str_join("; ", fields)} }`;
};
/**
 * One ctor's runtime shape: its discriminant (`_tag` unless `@tag`/`@as`, ADR 0156) plus its fields.
 */
const ctorVariant: _Curry<
  [c: Ctor, params: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>],
  string
> = _curry(4, ctorVariant$);
const ctorVariantsFrom$ = (
  ctors: Ctor[],
  params: string[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, ctors),
    () => [] as string[],
    (c) =>
      _Array_prepend(
        `  | ${ctorVariant$(c, params, aliases, recs)}`,
        ctorVariantsFrom$(ctors, params, aliases, recs, i + 1),
      ),
  );
const ctorVariantsFrom: _Curry<
  [
    ctors: Ctor[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(5, ctorVariantsFrom$);
const typeDecl$ = (
  name: string,
  params: string[],
  ctors: Ctor[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
): string => {
  const head: string = `${name}${genericHead(params, 0, [] as string[])}`;
  return `export type ${head} =
${_Str_join("\n", ctorVariantsFrom$(ctors, params, aliases, recs, 0))};`;
};
/**
 * A `type` decl -> an exported tagged union matching the runtime shape.
 */
export const typeDecl: _Curry<
  [
    name: string,
    params: string[],
    ctors: Ctor[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  string
> = _curry(5, typeDecl$);
const aliasFieldsFrom$ = (
  fields: AliasField[],
  params: string[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, fields),
    () => [] as string[],
    (f) =>
      or(f.spread, _Array_contains(f.name, laterSpreadLabelsFrom$(fields, params, aliases, i + 1)))
        ? aliasFieldsFrom$(fields, params, aliases, recs, i + 1)
        : _Array_prepend(
            `${f.name}${f.optional ? "?" : ""}: ${fieldTs$(f.fieldType, params, aliases, recs)}`,
            aliasFieldsFrom$(fields, params, aliases, recs, i + 1),
          ),
  );
const aliasFieldsFrom: _Curry<
  [
    fields: AliasField[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(5, aliasFieldsFrom$);
const spreadLabelsOf$ = (
  te: TypeExpr,
  params: string[],
  aliases: Map<string, AliasInfo>,
): string[] =>
  (([t, _vars, _st]: [Ty, Map<string, Ty>, St]) => {
    const $match = t;
    switch ($match._tag) {
      case "TyRecord": {
        const { row } = $match;
        return rowLabelsOf$(row, [] as string[]);
      }
      default: {
        return [] as string[];
      }
    }
  })(
    typeExprToType(
      te,
      paramVarsFrom(params, 0),
      mkSt(length(params)),
      aliases,
      _Set_fromArray([] as string[]),
    ),
  );
/**
 * Labels a `...A` spread brings in — its record row's, as inference sees them.
 */
const spreadLabelsOf: _Curry<
  [te: TypeExpr, params: string[], aliases: Map<string, AliasInfo>],
  string[]
> = _curry(3, spreadLabelsOf$);
const rowLabelsOf$ = (row: Row, acc: string[]): string[] => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { label: l, rest } = $match;
      return rowLabelsOf$(rest, _Array_append(l, acc));
    }
    default: {
      return acc;
    }
  }
};
const rowLabelsOf: _Curry<[row: Row, acc: string[]], string[]> = _curry(2, rowLabelsOf$);
const laterLabelsFrom$ = (
  fields: AliasField[],
  params: string[],
  aliases: Map<string, AliasInfo>,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, fields),
    () => [] as string[],
    (f) =>
      _Array_concat(
        f.spread ? spreadLabelsOf$(f.fieldType, params, aliases) : [f.name],
        laterLabelsFrom$(fields, params, aliases, i + 1),
      ),
  );
/**
 * Labels written after spread `i` — they override it (ADR 0154), so the TS
 * intersection must not also demand the spread's own, possibly differing, type.
 */
const laterLabelsFrom: _Curry<
  [fields: AliasField[], params: string[], aliases: Map<string, AliasInfo>, i: number],
  string[]
> = _curry(4, laterLabelsFrom$);
const laterSpreadLabelsFrom$ = (
  fields: AliasField[],
  params: string[],
  aliases: Map<string, AliasInfo>,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, fields),
    () => [] as string[],
    (f) =>
      _Array_concat(
        f.spread ? spreadLabelsOf$(f.fieldType, params, aliases) : ([] as string[]),
        laterSpreadLabelsFrom$(fields, params, aliases, i + 1),
      ),
  );
/**
 * Labels brought in by spreads written after position `i` — they override an
 * earlier own field of the same name.
 */
const laterSpreadLabelsFrom: _Curry<
  [fields: AliasField[], params: string[], aliases: Map<string, AliasInfo>, i: number],
  string[]
> = _curry(4, laterSpreadLabelsFrom$);
const spreadPartsFrom$ = (
  fields: AliasField[],
  params: string[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, fields),
    () => [] as string[],
    (f) => {
      const rest: string[] = spreadPartsFrom$(fields, params, aliases, recs, i + 1);
      return f.spread
        ? ((own: string) =>
            ((shadowed: string[]) =>
              _Array_prepend(
                length(shadowed) === 0
                  ? own
                  : `Omit<${own}, ${_Str_join(
                      " | ",
                      map((l: string) => `"${l}"`, shadowed),
                    )}>`,
                rest,
              ))(
              filter(
                (l: string) => _Array_contains(l, laterLabelsFrom$(fields, params, aliases, i + 1)),
                spreadLabelsOf$(f.fieldType, params, aliases),
              ),
            ))(fieldTs$(f.fieldType, params, aliases, recs))
        : rest;
    },
  );
const spreadPartsFrom: _Curry<
  [
    fields: AliasField[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(5, spreadPartsFrom$);
const recordAliasDecl$ = (
  name: string,
  params: string[],
  fields: AliasField[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
): string => {
  const head: string = `${name}${genericHead(params, 0, [] as string[])}`;
  const body: string[] = aliasFieldsFrom$(fields, params, aliases, recs, 0);
  const spreads: string[] = spreadPartsFrom$(fields, params, aliases, recs, 0);
  const own: string[] =
    length(body) === 0
      ? length(spreads) === 0
        ? ["{}"]
        : ([] as string[])
      : [`{ ${_Str_join("; ", body)} }`];
  return `export type ${head} = ${_Str_join(" & ", _Array_concat(spreads, own))};`;
};
/**
 * A record alias (`type Point = { x: number, y: number }`) -> an exported
 * object type. Structural, so it renders through the same `tsOf` encoder. A
 * `...A` spread becomes an intersection member ahead of the object literal.
 */
export const recordAliasDecl: _Curry<
  [
    name: string,
    params: string[],
    fields: AliasField[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  string
> = _curry(5, recordAliasDecl$);
const aliasTsDecl$ = (
  name: string,
  params: string[],
  template: TypeExpr,
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
): string => {
  const head: string = `${name}${genericHead(params, 0, [] as string[])}`;
  return `export type ${head} = ${fieldTs$(template, params, aliases, recs)};`;
};
/**
 * A transparent type alias (`type Id = number`) -> the aliased type directly.
 */
export const aliasTsDecl: _Curry<
  [
    name: string,
    params: string[],
    template: TypeExpr,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  string
> = _curry(5, aliasTsDecl$);
/**
 * An opaque `extern type` has no structure to print: a unique-symbol brand
 * keeps it nominal and unforgeable on the TS side.
 */
export const opaqueTypeDecl: (name: string) => string = (
  name: string,
) => `declare const ${name}: unique symbol;
export type ${name} = { readonly [${name}]: never };`;
/**
 * Union the letter maps of several schemes — ids are globally unique, so a
 * later scheme never clobbers an earlier one's letter (ADR 0042).
 */
const mergeInto: <A, B>(keys: A[], src: Map<A, B>, acc: Map<A, B>, i: number) => Map<A, B> = _curry(
  4,
  <A, B>(keys: A[], src: Map<A, B>, acc: Map<A, B>, i: number) =>
    _Option_match(
      _Array_get(i, keys),
      () => acc,
      (k) =>
        mergeInto(
          keys,
          src,
          _Option_match(
            _Map_get(k, src),
            () => acc,
            (v) => _Map_set(k, v, acc),
          ),
          i + 1,
        ),
    ),
);
const unionNamesFrom: <A, B>(
  schemes: ({ vars: A[]; rvars: A[] } & B)[],
  i: number,
  acc: Map<A, string>,
) => Map<A, string> = _curry(
  3,
  <A, B>(schemes: ({ vars: A[]; rvars: A[] } & B)[], i: number, acc: Map<A, string>) =>
    _Option_match(
      _Array_get(i, schemes),
      () => acc,
      (sc) => {
        const names = genericNames(sc);
        return unionNamesFrom(schemes, i + 1, mergeInto(_Map_keys(names), names, acc, 0));
      },
    ),
);
export const unionGenericNames: <A, B>(
  schemes: ({ vars: A[]; rvars: A[] } & B)[],
) => Map<A, string> = <A, B>(schemes: ({ vars: A[]; rvars: A[] } & B)[]) =>
  unionNamesFrom(schemes, 0, new Map<A, string>());
/**
 * Every type AND row var in a (zonked) type is a key of `names`. Unlike
 * `freeInType` (type vars only) this also inspects a record's trailing row
 * var, so an open record `{ … } & R` counts as fully in scope only when `R`
 * too carries a letter — the precondition for rendering the tail rather than
 * dropping it. An empty `names` therefore means "fully concrete".
 */
const allVarsIn: <A>(t: Ty, names: Map<number, A>) => boolean = _curry(
  2,
  <A>(t: Ty, names: Map<number, A>) => {
    const $match = t;
    switch ($match._tag) {
      case "TyVar": {
        const { id } = $match;
        return _Option_isSome(_Map_get(id, names));
      }
      case "TyCon": {
        const { args } = $match;
        return allVarsInAll(args, names, 0);
      }
      case "TyFn": {
        const { from: fromT, to: toT } = $match;
        return and(allVarsIn(fromT, names), allVarsIn(toT, names));
      }
      case "TyRecord": {
        const { row } = $match;
        return allVarsInRow(row, names);
      }
      case "TySingleton": {
        return true;
      }
      case "TyOneOf": {
        const { members } = $match;
        return allVarsInAll(members, names, 0);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const allVarsInAll: <A>(ts: Ty[], names: Map<number, A>, i: number) => boolean = _curry(
  3,
  <A>(ts: Ty[], names: Map<number, A>, i: number) =>
    _Option_match(
      _Array_get(i, ts),
      () => true,
      (t) => and(allVarsIn(t, names), allVarsInAll(ts, names, i + 1)),
    ),
);
const allVarsInRow: <A>(row: Row, names: Map<number, A>) => boolean = _curry(
  2,
  <A>(row: Row, names: Map<number, A>) => {
    const $match = row;
    switch ($match._tag) {
      case "RowEmpty": {
        return true;
      }
      case "RowVar": {
        const { id } = $match;
        return _Option_isSome(_Map_get(id, names));
      }
      case "RowExtend": {
        const { fieldType, rest } = $match;
        return and(allVarsIn(fieldType, names), allVarsInRow(rest, names));
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
/**
 * No `names` in scope, so this is true exactly when the type is fully concrete.
 */
const isConcrete: (t: Ty) => boolean = (t: Ty) => allVarsIn(t, new Map([]));
const emptyCollTs$ = (t: Ty, env: TsEnv): Option<string> =>
  allVarsIn(t, env.vars) ? (Some(tsOf(t, env)) as Option<string>) : (None as Option<string>);
/**
 * TS type for an EMPTY literal (`#{}` / `[]` / `@{}` / `Set.empty`). Such a
 * seed infers `Map<unknown, unknown>` / `never[]` / `Set<never>`, which will
 * not flow into a concretely-typed position (ADR 0035). `names` carries an
 * enclosing generic binding's letters (ADR 0042), so a seed whose element type
 * is one of those renders as the letter instead of being skipped; with no such
 * scope only a fully concrete type renders, since a free var would become
 * `unknown` — no better than tsc's own guess.
 */
export const emptyCollTs: _Curry<[t: Ty, env: TsEnv], Option<string>> = _curry(2, emptyCollTs$);
const ctorCallTs$ = (t: Ty, recs: Map<string, string>): Option<string> => {
  const $match = t;
  switch ($match._tag) {
    case "TyCon": {
      const { args } = $match;
      return or(length(args) === 0, !isConcrete(t))
        ? (None as Option<string>)
        : (Some(tsOf(t, recsEnv(recs))) as Option<string>);
    }
    default: {
      return None as Option<string>;
    }
  }
};
/**
 * TS type for an APPLIED parametric ctor call (`Ok(x)`), else `None`. A ctor's
 * argument pins only the params it mentions; a phantom one (`Ok`'s error type)
 * stays free and widens to `unknown`, which then fails to unify with a sibling
 * match arm (ADR 0043). Fully-concrete applied cons only — a nullary con or a
 * free var would render no better than tsc manages alone.
 */
export const ctorCallTs: _Curry<[t: Ty, recs: Map<string, string>], Option<string>> = _curry(
  2,
  ctorCallTs$,
);
const guardParamTs$ = (t: Ty, recs: Map<string, string>): Option<string> =>
  isConcrete(t) ? (Some(tsOf(t, recsEnv(recs))) as Option<string>) : (None as Option<string>);
/**
 * A match scrutinee's concrete TS type — the base a guard-form arm's predicate
 * narrows FROM (ADR 0031). Concrete only: a scrutinee with free vars cannot
 * name its generics in value position (TS2304), so those keep the bare boolean
 * guard and their handlers keep the polymorphic tail.
 */
export const guardParamTs: _Curry<[t: Ty, recs: Map<string, string>], Option<string>> = _curry(
  2,
  guardParamTs$,
);
const lambdaParamsFrom$ = (t: Ty, arity: number, env: TsEnv, i: number): Option<string>[] =>
  i >= arity
    ? ([] as Option<string>[])
    : ((_v) =>
        _v._tag === "TyFn"
          ? (({ from: fromT, to: toT }) =>
              _Array_prepend(
                allVarsIn(fromT, env.vars)
                  ? (Some(tsOf(fromT, env)) as Option<string>)
                  : isConcrete(fromT)
                    ? (Some(tsOf(fromT, recsEnv(env.recs))) as Option<string>)
                    : (None as Option<string>),
                lambdaParamsFrom$(toT, arity, env, i + 1),
              ))(_v)
          : _Array_prepend(None as Option<string>, lambdaParamsFrom$(t, arity, env, i + 1)))(t);
/**
 * Peel one arrow per collapsed lambda param, annotating each (ADR 0028).
 * A param whose vars are ALL in scope renders with those letters (ADR 0042);
 * otherwise only a fully concrete param renders, because a generic binding's
 * letters live on the const's TYPE head and naming one in a value position
 * would be an out-of-scope TS2304.
 */
const lambdaParamsFrom: _Curry<[t: Ty, arity: number, env: TsEnv, i: number], Option<string>[]> =
  _curry(4, lambdaParamsFrom$);
const lambdaParamTypesTs$ = (lamType: Ty, arity: number, env: TsEnv): Option<string>[] =>
  lambdaParamsFrom$(lamType, arity, env, 0);
export const lambdaParamTypesTs: _Curry<
  [lamType: Ty, arity: number, env: TsEnv],
  Option<string>[]
> = _curry(3, lambdaParamTypesTs$);
const genericParamsFrom$ = (t: Ty, arity: number, env: TsEnv, i: number): Option<string>[] =>
  i >= arity
    ? ([] as Option<string>[])
    : ((_v) =>
        _v._tag === "TyFn"
          ? (({ from: fromT, to: toT }) =>
              _Array_prepend(
                Some(tsOf(fromT, env)) as Option<string>,
                genericParamsFrom$(toT, arity, env, i + 1),
              ))(_v)
          : _Array_prepend(None as Option<string>, genericParamsFrom$(t, arity, env, i + 1)))(t);
/**
 * Every param annotated with the scheme's OWN letters, scoped by a generic
 * head on the arrow itself (ADR 0032). This closes the polymorphic
 * higher-order tail ADR 0028 leaves open: `lambdaParamTypesTs` skips generic
 * params precisely because their letters are out of scope in the value
 * expression, so `_curry` erased them to `any`. Scoping the SAME letters on
 * the lambda brings them into value scope. `None` when the binding is not
 * generic — the concrete-only path already covers it.
 */
const genericParamsFrom: _Curry<[t: Ty, arity: number, env: TsEnv, i: number], Option<string>[]> =
  _curry(4, genericParamsFrom$);
export const genericLambdaParams: <A>(
  sc: { vars: number[]; rvars: number[]; ty: Ty } & A,
  arity: number,
  recs: Map<string, string>,
) => Option<ParamAnnots> = _curry(
  3,
  <A>(
    sc: { vars: number[]; rvars: number[]; ty: Ty } & A,
    arity: number,
    recs: Map<string, string>,
  ) =>
    _Map_size(genericNames(sc)) === 0
      ? (None as Option<ParamAnnots>)
      : ((rendered: { env: TsEnv; head: string; pins: Map<number, string> }) =>
          Some({
            generics: rendered.head,
            params: genericParamsFrom$(sc.ty, arity, rendered.env, 0),
          }) as Option<ParamAnnots>)(schemeRender(sc, recs)),
);
/**
 * The typing for one variant ctor's factory (`GenOpts.annotateCtor`).
 * `retMono` pins every param to `never` so a NULLARY ctor's const keeps its
 * literal `_tag` instead of widening to `string`.
 */
const neverArgs: <A>(params: A[], i: number, acc: string[]) => string[] = _curry(
  3,
  <A>(params: A[], i: number, acc: string[]) =>
    _Option_match(
      _Array_get(i, params),
      () => acc,
      () => neverArgs(params, i + 1, _Array_append("never", acc)),
    ),
);
const ctorParamTypes$ = (
  fields: CtorField[],
  params: string[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, fields),
    () => [] as string[],
    (fld) =>
      _Array_prepend(
        fieldTs$(fld.fieldType, params, aliases, recs),
        ctorParamTypes$(fields, params, aliases, recs, i + 1),
      ),
  );
const ctorParamTypes: _Curry<
  [
    fields: CtorField[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(5, ctorParamTypes$);
const ctorFactoryTs$ = (
  typeName: string,
  params: string[],
  c: Ctor,
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
): CtorFactoryTs => {
  const head: string = genericHead(params, 0, [] as string[]);
  const monos: string[] = neverArgs(params, 0, [] as string[]);
  return {
    generics: head,
    paramTypes: ctorParamTypes$(c.fields, params, aliases, recs, 0),
    ret: `${typeName}${head}`,
    retMono: length(monos) === 0 ? typeName : `${typeName}<${_Str_join(", ", monos)}>`,
  };
};
export const ctorFactoryTs: _Curry<
  [
    typeName: string,
    params: string[],
    c: Ctor,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  CtorFactoryTs
> = _curry(5, ctorFactoryTs$);
/**
 * A lambda param's declared NAME (destructuring params take a positional
 * placeholder — the type is what matters here, not the binder shape).
 */
const paramDeclName: <A>(p: LamParam, i: A) => string = _curry(2, <A>(p: LamParam, i: A) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return paramDeclName(inner, i);
    }
    case "LPName": {
      const { name } = $match;
      return name;
    }
    case "LPLabeled": {
      return "$lab";
    }
    default: {
      return `_${show(i)}`;
    }
  }
});
/**
 * Every ordered composition of `n` — `3` gives [1,1,1], [1,2], [2,1], [3].
 * Longest first, so the flat all-at-once signature is emitted LAST.
 */
const compositions: (n: number) => number[][] = (n: number) =>
  n === 0 ? [[] as number[]] : compositionsFrom$(n, 1);
const compositionsFrom$ = (n: number, k: number): number[][] =>
  k > n
    ? ([] as number[][])
    : _Array_concat(map(_Array_prepend(k), compositions(n - k)), compositionsFrom$(n, k + 1));
const compositionsFrom: _Curry<[n: number, k: number], number[][]> = _curry(2, compositionsFrom$);
/**
 * Slice `params` into consecutive groups of the given sizes.
 */
const sliceGroups: <A>(params: A[], groups: number[], i: number, at: number) => A[][] = _curry(
  4,
  <A>(params: A[], groups: number[], i: number, at: number) =>
    _Option_match(
      _Array_get(i, groups),
      () => [] as A[][],
      (g) =>
        _Array_prepend(
          _Array_take(g, _Array_drop(at, params)),
          sliceGroups(params, groups, i + 1, at + g),
        ),
    ),
);
const curriedTail$ = (slices: string[][], i: number, acc: string): string =>
  i < 1
    ? acc
    : curriedTail$(
        slices,
        i - 1,
        `(${_Str_join(", ", _Option_unwrapOr([] as string[], _Array_get(i, slices)))}) => ${acc}`,
      );
/**
 * Fold the trailing groups into a curried tail: `(c) => (d) => R`.
 */
const curriedTail: _Curry<[slices: string[][], i: number, acc: string], string> = _curry(
  3,
  curriedTail$,
);
const overloadSig$ = (head: string, params: string[], ret: string, groups: number[]): string => {
  const slices: string[][] = sliceGroups(params, groups, 0, 0);
  const tail: string = curriedTail$(slices, length(slices) - 1, ret);
  return `${head}(${_Str_join(", ", _Option_unwrapOr([] as string[], _Array_get(0, slices)))}): ${tail};`;
};
const overloadSig: _Curry<[head: string, params: string[], ret: string, groups: number[]], string> =
  _curry(4, overloadSig$);
const curriedOverloads$ = (head: string, params: string[], ret: string): string =>
  length(params) <= 1
    ? `${head}(${_Str_join(", ", params)}) => ${ret}`
    : `{ ${_Str_join(
        " ",
        map(
          overloadSig(head, params, ret),
          _Array_sortBy((g: number[]) => 0 - length(g), compositions(length(params))),
        ),
      )} }`;
/**
 * A curry-compatible function type. The JS backend curries every arity->=2
 * function through `_curry`, so a call site may partially apply in ANY
 * grouping — `f(a, b)`, `f(a)(b)`, `f(a, b)(c)`. One flat `(a, b) => R` rejects
 * all but the all-at-once form, so emit an OVERLOAD per composition of the
 * arity (ADR 0037). `head` scopes generics INSIDE each call signature, so it is
 * threaded here rather than prepended by the caller.
 */
export const curriedOverloads: _Curry<[head: string, params: string[], ret: string], string> =
  _curry(3, curriedOverloads$);
const curriedFnType$ = (params: string[], ret: string): string =>
  length(params) <= 1
    ? `(${_Str_join(", ", params)}) => ${ret}`
    : `_Curry<[${_Str_join(", ", params)}], ${ret}>`;
/**
 * The CONCRETE curry-compatible function type. Same contract as
 * `curriedOverloads` — every partial-application grouping `_curry` accepts must
 * typecheck — but expressed once as `_Curry<[params], ret>` instead of one
 * signature per composition of the arity. A monomorphic arity-n binding cost
 * 2^(n-1) lines; this costs one (ADR 0093). Only CONCRETE bindings can use it:
 * `infer` erases a generic head, so a generic binding keeps the nested arrow.
 */
export const curriedFnType: _Curry<[params: string[], ret: string], string> = _curry(
  2,
  curriedFnType$,
);
const flatParamsFrom$ = (
  t: Ty,
  value: Expr,
  env: TsEnv,
  n: number,
  acc: string[],
): [string[], string] => {
  const $match = value;
  switch ($match._tag) {
    case "ELambda": {
      const { params, body } = $match;
      return length(params) === 0
        ? ((next: Ty) => flatParamsFrom$(next, body, env, n, acc))(
            ((_v) =>
              _v._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_v)
                ? (({ from: fromT, to: toT }) => toT)(_v)
                : t)(t),
          )
        : (([t1, n1, acc1]: [Ty, number, string[]]) => flatParamsFrom$(t1, body, env, n1, acc1))(
            takeParams$(t, params, env, 0, n, acc),
          );
    }
    default: {
      return _tuple(acc, tsOf(t, env));
    }
  }
};
/**
 * Walk the value's lambda spine and the type's arrow spine together,
 * collecting one rendered `name: T` per param. A zero-param lambda consumes
 * the `unit` arrow the JS side erases.
 */
const flatParamsFrom: _Curry<
  [t: Ty, value: Expr, env: TsEnv, n: number, acc: string[]],
  [string[], string]
> = _curry(5, flatParamsFrom$);
const takeParams$ = (
  t: Ty,
  params: LamParam[],
  env: TsEnv,
  i: number,
  n: number,
  acc: string[],
): [Ty, number, string[]] =>
  _Option_match(
    _Array_get(i, params),
    () => _tuple(t, n, acc),
    (p) => {
      const $match = t;
      switch ($match._tag) {
        case "TyFn": {
          const { from: fromT, to: toT } = $match;
          return takeParams$(
            toT,
            params,
            env,
            i + 1,
            n + 1,
            _Array_append(`${paramDeclName(p, n)}: ${tsOf(fromT, env)}`, acc),
          );
        }
        default: {
          return _tuple(t, n, acc);
        }
      }
    },
  );
const takeParams: _Curry<
  [t: Ty, params: LamParam[], env: TsEnv, i: number, n: number, acc: string[]],
  [Ty, number, string[]]
> = _curry(6, takeParams$);
const declType$ = (t: Ty, value: Expr, env: TsEnv): string => {
  const $match = value;
  switch ($match._tag) {
    case "ELambda": {
      const { params, body } = $match;
      return length(params) === 0
        ? ((next: Ty) => `() => ${declType$(next, body, env)}`)(
            ((_v) =>
              _v._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_v)
                ? (({ from: fromT, to: toT }) => toT)(_v)
                : t)(t),
          )
        : (([t1, _n, ps]: [Ty, number, string[]]) =>
            `(${_Str_join(", ", ps)}) => ${declType$(t1, body, env)}`)(
            takeParams$(t, params, env, 0, 0, [] as string[]),
          );
    }
    default: {
      return tsOf(t, env);
    }
  }
};
/**
 * Arity-aware nested form: one arrow peeled per param, recursing into the body
 * so a curried definition keeps its shape.
 */
const declType: _Curry<[t: Ty, value: Expr, env: TsEnv], string> = _curry(3, declType$);
/**
 * What a `bindingType` or `dtsBinding` hook renders with (ADR 0055, 0109).
 */
export const tsApiFor: (recs: Map<string, string>) => TsApi = (recs: Map<string, string>) => ({
  tsType: (t: Ty) => tsOf(t, recsEnv(recs)),
  aliasOf: (row: Row) => rowAliasName(row, recs),
});
/**
 * The TS type of a binding, WITHOUT the `const name:` wrapper — the piece the
 * declaration writer and the TS backend share.
 *
 * A CONCRETE function emits partial-application overloads so `_curry`'d calls
 * typecheck (ADR 0037). A GENERIC one keeps the nested arrow: overloads there
 * wreck tsc's callback contextual typing and type-argument inference. A
 * scheme whose variables a single record alias explains renders as that alias
 * (ADR 0106); once no letters remain it is concrete and takes the curry form.
 * A non-function polymorphic binding has nowhere to bind generics, so its
 * escaped vars fall back to `unknown` — except variables the alias pin
 * resolved, which print as that concrete text.
 * A plugin `bindingType` hook (ADR 0055) may replace the whole type first.
 */
export const bindingTsType: <A>(
  sc: { ty: Ty; vars: number[]; rvars: number[] } & A,
  value: Expr,
  recs: Map<string, string>,
  bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
) => string = _curry(
  4,
  <A>(
    sc: { ty: Ty; vars: number[]; rvars: number[] } & A,
    value: Expr,
    recs: Map<string, string>,
    bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
  ) =>
    _Option_match(
      runBindingHooks(bindingHooks, value, sc.ty, tsApiFor(recs)),
      () => coreBindingTsType(sc, value, recs),
      (ts) => ts,
    ),
);
/**
 * The RETURN type of a MONOMORPHIC top-level function's raw twin (ADR 0149);
 * `None` declines the twin. Annotated on the arrow, so a self-recursive arrow
 * is no implicit-any cycle (TS7023). A generic binding declines: its explicit
 * return type exposes `Result<unknown, E>` inference gaps in `_Result_match`
 * chains that the `_curry` wrapper's inferred return used to hide.
 */
const rawReturnTs: <A>(
  sc: { vars: number[]; rvars: number[]; ty: Ty } & A,
  value: Expr,
  recs: Map<string, string>,
) => Option<string> = _curry(
  3,
  <A>(
    sc: { vars: number[]; rvars: number[]; ty: Ty } & A,
    value: Expr,
    recs: Map<string, string>,
  ) => {
    const rendered: { env: TsEnv; head: string; pins: Map<number, string> } = schemeRender(
      sc,
      recs,
    );
    return rendered.head === ""
      ? (([_params, ret]: [string[], string]) => Some(`: ${ret}`) as Option<string>)(
          flatParamsFrom$(sc.ty, value, rendered.env, 0, [] as string[]),
        )
      : (None as Option<string>);
  },
);
const coreBindingTsType: <A>(
  sc: { vars: number[]; rvars: number[]; ty: Ty } & A,
  value: Expr,
  recs: Map<string, string>,
) => string = _curry(
  3,
  <A>(
    sc: { vars: number[]; rvars: number[]; ty: Ty } & A,
    value: Expr,
    recs: Map<string, string>,
  ) => {
    const rendered: { env: TsEnv; head: string; pins: Map<number, string> } = schemeRender(
      sc,
      recs,
    );
    const $match = value;
    switch ($match._tag) {
      case "ELambda": {
        return rendered.head === ""
          ? (([params, ret]: [string[], string]) => curriedFnType$(params, ret))(
              flatParamsFrom$(sc.ty, value, rendered.env, 0, [] as string[]),
            )
          : `${rendered.head}${declType$(sc.ty, value, rendered.env)}`;
      }
      default: {
        return tsOf(sc.ty, tsEnv(rendered.pins, recs));
      }
    }
  },
);
/**
 * Per-node types are keyed by span text, so a lookup is one Map hit.
 */
const spanKey: <A, B, C>(sp: { start: A; end: B } & C) => string = <A, B, C>(
  sp: { start: A; end: B } & C,
) => `${show(sp.start)}:${show(sp.end)}`;
const typeAtFrom: <A, B, C, D, E>(
  types: ({ span: { start: A; end: B } & D; ty: C } & E)[],
  i: number,
  acc: Map<string, C>,
) => Map<string, C> = _curry(
  3,
  <A, B, C, D, E>(
    types: ({ span: { start: A; end: B } & D; ty: C } & E)[],
    i: number,
    acc: Map<string, C>,
  ) =>
    _Option_match(
      _Array_get(i, types),
      () => acc,
      (r) => typeAtFrom(types, i + 1, _Map_set(spanKey(r.span), r.ty, acc)),
    ),
);
/**
 * Later records win when two nodes share a span — `zonkRecorded` already put
 * them in source order, so a plain left fold gets that for free.
 */
export const typeAtTable: <A, B, C, D, E>(
  types: ({ span: { start: A; end: B } & D; ty: C } & E)[],
) => Map<string, C> = <A, B, C, D, E>(types: ({ span: { start: A; end: B } & D; ty: C } & E)[]) =>
  typeAtFrom(types, 0, new Map<string, C>());
const consInTy$ = (t: Ty, acc: Set<string>): Set<string> =>
  ((_v) =>
    _v._tag === "TyCon" && _v.name === "Task" && _v.args.length === 2
      ? (({ args: [value, error] }) =>
          consInTy$(error, consInTy$(value, _Set_add("Result", _Set_add("Task", acc)))))(
          _v as Extract<Ty, { _tag: "TyCon" }>,
        )
      : _v._tag === "TyCon"
        ? (({ name, args }) => consInAll$(args, _Set_add(name, acc), 0))(_v)
        : _v._tag === "TyFn"
          ? (({ from: fromT, to: toT }) => consInTy$(toT, consInTy$(fromT, acc)))(_v)
          : _v._tag === "TyRecord"
            ? (({ row }) => consInRow$(row, acc))(_v)
            : _v._tag === "TyOneOf"
              ? (({ members }) => consInAll$(members, acc, 0))(_v)
              : acc)(t);
/**
 * Every `con` name a type mentions — used to decide which builtin variant
 * decls a module has to carry so its own references resolve.
 */
const consInTy: _Curry<[t: Ty, acc: Set<string>], Set<string>> = _curry(2, consInTy$);
const consInAll$ = (ts: Ty[], acc: Set<string>, i: number): Set<string> =>
  _Option_match(
    _Array_get(i, ts),
    () => acc,
    (t) => consInAll$(ts, consInTy$(t, acc), i + 1),
  );
const consInAll: _Curry<[ts: Ty[], acc: Set<string>, i: number], Set<string>> = _curry(
  3,
  consInAll$,
);
const consInRow$ = (row: Row, acc: Set<string>): Set<string> => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { fieldType, rest } = $match;
      return consInRow$(rest, consInTy$(fieldType, acc));
    }
    default: {
      return acc;
    }
  }
};
const consInRow: _Curry<[row: Row, acc: Set<string>], Set<string>> = _curry(2, consInRow$);
const declaredTypeNames$ = (stmts: Stmt[], i: number, acc: Set<string>): Set<string> =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some" && _v.value._tag === "SType"
        ? (({ value: { name } }) => declaredTypeNames$(stmts, i + 1, _Set_add(name, acc)))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
            },
          )
        : _v._tag === "Some"
          ? declaredTypeNames$(stmts, i + 1, acc)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts));
export const declaredTypeNames: _Curry<
  [stmts: Stmt[], i: number, acc: Set<string>],
  Set<string>
> = _curry(3, declaredTypeNames$);
const nullaryLocalNames$ = (stmts: Stmt[], i: number, acc: Set<string>): Set<string> =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.alias._tag === "Some"
        ? (({
            value: {
              name,
              params,
              alias: { value: fields },
            },
          }) =>
            nullaryLocalNames$(
              stmts,
              i + 1,
              and(length(params) === 0, length(fields) > 0) ? _Set_add(name, acc) : acc,
            ))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<
                Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                { _tag: "SType" }
              > & {
                alias: Extract<
                  Extract<
                    Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                    { _tag: "SType" }
                  >["alias"],
                  { _tag: "Some" }
                >;
              };
            },
          )
        : _v._tag === "Some"
          ? nullaryLocalNames$(stmts, i + 1, acc)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts));
/**
 * Nullary record aliases this module declares. Same test as `nullaryDeclared`:
 * a parameterised homonym (`LocTok<t>`) shares the bare name but is not an
 * owner of it. Passing every declared name would print that bare name for a
 * dep's nullary row, and `tsc` reports TS2314.
 */
export const nullaryLocalNames: _Curry<
  [stmts: Stmt[], i: number, acc: Set<string>],
  Set<string>
> = _curry(3, nullaryLocalNames$);
export const referencedCons: <A>(
  stmts: Stmt[],
  env: Map<string, { ty: Ty } & A>,
  i: number,
  acc: Set<string>,
) => Set<string> = _curry(
  4,
  <A>(stmts: Stmt[], env: Map<string, { ty: Ty } & A>, i: number, acc: Set<string>) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some" && _v.value._tag === "SLet"
          ? (({ value: { name } }) =>
              referencedCons(
                stmts,
                env,
                i + 1,
                _Str_startsWith("$", name)
                  ? acc
                  : _Option_match(
                      _Map_get(name, env),
                      () => acc,
                      (sc) => consInTy$(sc.ty, acc),
                    ),
              ))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
              },
            )
          : _v._tag === "Some"
            ? referencedCons(stmts, env, i + 1, acc)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, stmts)),
);
const builtinTypeNamesFor$ = (
  declared: Set<string>,
  wanted: Set<string>,
  body: string,
  i: number,
): string[] =>
  _Option_match(
    _Array_get(i, builtinTypeDecls),
    () => [] as string[],
    (bt) => {
      const rest: string[] = builtinTypeNamesFor$(declared, wanted, body, i + 1);
      return and(
        !_Set_has(bt.name, declared),
        or(_Set_has(bt.name, wanted), _Str_contains(bt.name, body)),
      )
        ? _Array_prepend(bt.name, rest)
        : rest;
    },
  );
/**
 * Builtin variant TYPES a module references but does not itself declare, so
 * those references resolve (`Option<number>` from `Map.get`, etc). They ride
 * an `import type` off the runtime rather than a decl per module — the same
 * trade `_Curry` takes (ADR 0093), and these are two decls x every file in a
 * graph. A module declaring its own `Result` keeps it and takes no import.
 *
 * `wanted` is the scheme scan; a guard predicate can name a builtin it missed,
 * since it looks at binding types, not match-scrutinee types — `match(opt)` on
 * an `Option<Stmt>` never surfaces `Option`. The body text covers that (ADR 0031).
 */
export const builtinTypeNamesFor: _Curry<
  [declared: Set<string>, wanted: Set<string>, body: string, i: number],
  string[]
> = _curry(4, builtinTypeNamesFor$);
const aliasRowOf$ = (fields: AliasField[], aliases: Map<string, AliasInfo>, i: number): Row =>
  _Option_match(
    _Array_get(i, fields),
    () => RowEmpty as Row,
    (f) =>
      (([t, _vars, _st]: [Ty, Map<string, Ty>, St]) => {
        const rest: Row = aliasRowOf$(fields, aliases, i + 1);
        return f.spread
          ? spreadRowInto(t, rest)
          : rowHasLabel(f.name, rest)
            ? rest
            : RowExtend(f.name, t, f.optional, rest);
      })(
        typeExprToType(
          f.fieldType,
          new Map<string, Ty>(),
          mkSt(0),
          aliases,
          _Set_fromArray([] as string[]),
        ),
      ),
  );
/**
 * A declared record alias lowered back to the row its USES carry. ADR 0005
 * expands a record alias at `typeExprToType`, so this reproduces exactly what
 * inference will have put in the type table for a value of that alias.
 */
const aliasRowOf: _Curry<[fields: AliasField[], aliases: Map<string, AliasInfo>, i: number], Row> =
  _curry(3, aliasRowOf$);
const aliasShapeKey$ = (fields: AliasField[], aliases: Map<string, AliasInfo>): Option<string> =>
  rowShapeKey(aliasRowOf$(fields, aliases, 0), new Map<number, string>());
const aliasShapeKey: _Curry<
  [fields: AliasField[], aliases: Map<string, AliasInfo>],
  Option<string>
> = _curry(2, aliasShapeKey$);
/**
 * Every record alias IN SCOPE, keyed by canonical row shape (ADR 0092). Built
 * from the merged alias map rather than this module's own `SType`s, so a dep's
 * alias counts too: `crossModuleTypeImports` derives `import type` lines from
 * the emitted TEXT, so naming one here is exactly what makes its import appear.
 *
 * Nullary only — a parameterised alias would have to match a row up to
 * substitution. The inverse, a use whose fields are still scheme variables,
 * is pinned at `schemeRender` (ADR 0106), not here.
 *
 * A dep reached through `import * as Ast` seeds only the QUALIFIED key
 * `"Ast.Span"` (infer.mochi's `qualAliasSeed`), so index under the last
 * segment: a type crosses a module boundary under its bare name, which is both
 * what the dep's own header declares and what `groupByOwner` matches on.
 */
const bareName: (name: string) => string = (name: string) => {
  const parts: string[] = _Str_split(".", name);
  return _Option_unwrapOr(name, _Array_get(length(parts) - 1, parts));
};
const indexAlias: <A>(
  key: string,
  name: A,
  aliases: Map<string, AliasInfo>,
  acc: Map<string, A>,
) => Map<string, A> = _curry(
  4,
  <A>(key: string, name: A, aliases: Map<string, AliasInfo>, acc: Map<string, A>) =>
    _Option_match(
      _Map_get(key, aliases),
      () => acc,
      (info) =>
        _Option_match(
          info.expr,
          () =>
            or(length(info.params) !== 0, length(info.fields) === 0)
              ? acc
              : _Option_match(
                  aliasShapeKey$(info.fields, aliases),
                  () => acc,
                  (k) => _Map_set(k, name, acc),
                ),
          () => acc,
        ),
    ),
);
const recordAliasIndexFrom$ = (
  keys: string[],
  aliases: Map<string, AliasInfo>,
  i: number,
  acc: Map<string, string>,
): Map<string, string> =>
  _Option_match(
    _Array_get(i, keys),
    () => acc,
    (key) =>
      recordAliasIndexFrom$(keys, aliases, i + 1, indexAlias(key, bareName(key), aliases, acc)),
  );
const recordAliasIndexFrom: _Curry<
  [keys: string[], aliases: Map<string, AliasInfo>, i: number, acc: Map<string, string>],
  Map<string, string>
> = _curry(4, recordAliasIndexFrom$);
export const recordAliasIndex: (aliases: Map<string, AliasInfo>) => Map<string, string> = (
  aliases: Map<string, AliasInfo>,
) => recordAliasIndexFrom$(_Array_sort(_Map_keys(aliases)), aliases, 0, new Map<string, string>());
const parameterizedBares$ = (
  keys: string[],
  aliases: Map<string, AliasInfo>,
  i: number,
  acc: Set<string>,
): Set<string> =>
  _Option_match(
    _Array_get(i, keys),
    () => acc,
    (key) =>
      _Option_match(
        _Map_get(key, aliases),
        () => parameterizedBares$(keys, aliases, i + 1, acc),
        (info) =>
          parameterizedBares$(
            keys,
            aliases,
            i + 1,
            length(info.params) > 0 ? _Set_add(bareName(key), acc) : acc,
          ),
      ),
  );
/**
 * Bare names of parameterised aliases. `LocTok` and `LocTok<t>` share one,
 * and printing the nullary name then imports the parameterised one.
 */
const parameterizedBares: _Curry<
  [keys: string[], aliases: Map<string, AliasInfo>, i: number, acc: Set<string>],
  Set<string>
> = _curry(4, parameterizedBares$);
const printableName$ = (
  keys: string[],
  shape: string,
  aliases: Map<string, AliasInfo>,
  bad: Set<string>,
  acc: string,
  i: number,
): string =>
  _Option_match(
    _Array_get(i, keys),
    () => acc,
    (key) => {
      const bare: string = bareName(key);
      return _Option_match(
        _Map_get(key, aliases),
        () => printableName$(keys, shape, aliases, bad, acc, i + 1),
        (info) =>
          printableName$(
            keys,
            shape,
            aliases,
            bad,
            _Option_match(
              info.expr,
              () =>
                or(or(_Set_has(bare, bad), length(info.params) !== 0), length(info.fields) === 0)
                  ? acc
                  : _Option_match(
                      aliasShapeKey$(info.fields, aliases),
                      () => acc,
                      (k) => (eq(k, shape) ? bare : acc),
                    ),
              () => acc,
            ),
            i + 1,
          ),
      );
    },
  );
/**
 * Last nullary alias of `shape` whose bare name is safe to print, or `""`
 * when every owner is ambiguous. Keys are sorted, so a later qualified copy
 * (`Schemes.AliasInfo`) cannot bury an earlier unique name (`QualAliasInfo`).
 */
const printableName: _Curry<
  [
    keys: string[],
    shape: string,
    aliases: Map<string, AliasInfo>,
    bad: Set<string>,
    acc: string,
    i: number,
  ],
  string
> = _curry(6, printableName$);
const dropAmbiguous$ = (
  keys: string[],
  recs: Map<string, string>,
  aliases: Map<string, AliasInfo>,
  bad: Set<string>,
  localNames: Set<string>,
  aliasKeys: string[],
  i: number,
): Map<string, string> =>
  _Option_match(
    _Array_get(i, keys),
    () => recs,
    (k) =>
      _Option_match(
        _Map_get(k, recs),
        () => dropAmbiguous$(keys, recs, aliases, bad, localNames, aliasKeys, i + 1),
        (name) =>
          dropAmbiguous$(
            keys,
            and(_Set_has(name, bad), !_Set_has(name, localNames))
              ? _Map_set(k, printableName$(aliasKeys, k, aliases, bad, "", 0), recs)
              : recs,
            aliases,
            bad,
            localNames,
            aliasKeys,
            i + 1,
          ),
      ),
  );
const dropAmbiguous: _Curry<
  [
    keys: string[],
    recs: Map<string, string>,
    aliases: Map<string, AliasInfo>,
    bad: Set<string>,
    localNames: Set<string>,
    aliasKeys: string[],
    i: number,
  ],
  Map<string, string>
> = _curry(7, dropAmbiguous$);
const withoutAmbiguousAlias$ = (
  recs: Map<string, string>,
  aliases: Map<string, AliasInfo>,
  localNames: Set<string>,
): Map<string, string> => {
  const aliasKeys: string[] = _Array_sort(_Map_keys(aliases));
  return dropAmbiguous$(
    _Map_keys(recs),
    recs,
    aliases,
    parameterizedBares$(aliasKeys, aliases, 0, _Set_fromArray([] as string[])),
    localNames,
    aliasKeys,
    0,
  );
};
/**
 * A shape whose bare name is also a parameterised alias keeps its key, so a
 * use can still pin its variables. The printed name stays when `localNames`
 * contains that nullary alias (`nullaryLocalNames`, not every declared type).
 * Otherwise another nullary alias of the same shape is printed, and only when
 * there is none does the name go blank and the row print structurally (ADR 0107).
 */
export const withoutAmbiguousAlias: _Curry<
  [recs: Map<string, string>, aliases: Map<string, AliasInfo>, localNames: Set<string>],
  Map<string, string>
> = _curry(3, withoutAmbiguousAlias$);
/**
 * The index an alias's OWN body renders against — itself removed, so it cannot
 * come out as `export type Span = Span;`.
 */
export const withoutOwnShape: <A, B>(
  fields: AliasField[],
  params: A[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, B>,
) => Map<string, B> = _curry(
  4,
  <A, B>(
    fields: AliasField[],
    params: A[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, B>,
  ) =>
    _Option_match(
      _Array_get(0, params),
      () =>
        _Option_match(
          aliasShapeKey$(fields, aliases),
          () => recs,
          (k) => _Map_delete(k, recs),
        ),
      () => recs,
    ),
);
const typeHeaderFrom$ = (
  stmts: Stmt[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, string>,
  docs: boolean,
  i: number,
): string[] =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some" && _v.value._tag === "SType"
        ? (({ value: { name, params, ctors, alias, aliasType, doc } }) =>
            ((rest: string[]) =>
              ((docComment: string) =>
                _Option_match(
                  alias,
                  () =>
                    _Option_match(
                      aliasType,
                      () =>
                        length(ctors) === 0
                          ? _Array_prepend(
                              `declare const ${name}: unique symbol;
${docComment}type ${name} = { readonly [${name}]: never };`,
                              rest,
                            )
                          : _Array_prepend(
                              `${docComment}${typeDecl$(name, params, ctors, aliases, recs)}`,
                              rest,
                            ),
                      (te) =>
                        _Array_prepend(
                          `${docComment}${aliasTsDecl$(name, params, te, aliases, recs)}`,
                          rest,
                        ),
                    ),
                  (fields) =>
                    _Array_prepend(
                      `${docComment}${recordAliasDecl$(name, params, fields, aliases, withoutOwnShape(fields, params, aliases, recs))}`,
                      rest,
                    ),
                ))(docs ? jsDoc(doc) : ""))(typeHeaderFrom$(stmts, aliases, recs, docs, i + 1)))(
            _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
              value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
            },
          )
        : _v._tag === "Some"
          ? typeHeaderFrom$(stmts, aliases, recs, docs, i + 1)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts));
const typeHeaderFrom: _Curry<
  [
    stmts: Stmt[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    docs: boolean,
    i: number,
  ],
  string[]
> = _curry(5, typeHeaderFrom$);
/**
 * Generic top-level function bindings, keyed by their value-lambda span ->
 * scheme (ADR 0032). Such a lambda gets a generic head plus ALL params
 * annotated, so its polymorphic inner params name the letters instead of being
 * erased to `any` by `_curry`. Row vars count too: a row-polymorphic binding
 * with no type vars still needs the head so its open-row params emit
 * `{…} & R` rather than a closed record dropping the tail (ADR 0034).
 */
const genericLambdasFrom: <A, B, C>(
  stmts: Stmt[],
  env: Map<string, { vars: A[]; rvars: B[] } & C>,
  i: number,
  acc: Map<string, { vars: A[]; rvars: B[] } & C>,
) => Map<string, { vars: A[]; rvars: B[] } & C> = _curry(
  4,
  <A, B, C>(
    stmts: Stmt[],
    env: Map<string, { vars: A[]; rvars: B[] } & C>,
    i: number,
    acc: Map<string, { vars: A[]; rvars: B[] } & C>,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some" && _v.value._tag === "SLet"
          ? (({ value: { name, value } }) =>
              genericLambdasFrom(
                stmts,
                env,
                i + 1,
                ((_v) =>
                  _v._tag === "ELambda" && (({ span: sp }) => !_Str_startsWith("$", name))(_v)
                    ? (({ span: sp }) =>
                        _Option_match(
                          _Map_get(name, env),
                          () => acc,
                          (sc) =>
                            or(length(sc.vars) > 0, length(sc.rvars) > 0)
                              ? _Map_set(spanKey(sp), sc, acc)
                              : acc,
                        ))(_v)
                    : acc)(value),
              ))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
              },
            )
          : _v._tag === "Some"
            ? genericLambdasFrom(stmts, env, i + 1, acc)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, stmts)),
);
/**
 * Spans of every lambda AND every empty-collection literal (`#{}` / `[]` /
 * `@{}` / `Set.empty`) in an expression subtree, root included (ADR 0042).
 * A generic binding's `<A, B>` head lexically scopes its whole body, so each
 * of these nodes may name those letters: an inner lambda param renders the
 * letter instead of `unknown`, and an empty seed renders `Map<string, A>`
 * instead of inferring `Map<unknown, unknown>`. The binding's OWN value-lambda
 * span is collected too, but `annotateParams` resolves that one through
 * `genericLams` first, so the extra entry is harmless.
 */
const scopedSpans: (e: Expr) => SpanAt[] = (e: Expr) => {
  const $match = e;
  switch ($match._tag) {
    case "ELambda": {
      const { body, span: sp } = $match;
      return _Array_prepend(sp, scopedSpans(body));
    }
    case "ECall": {
      const { fn, args } = $match;
      return _Array_concat(scopedSpans(fn), scopedSpansAt$(args, 0));
    }
    case "ELetIn": {
      const { value, body } = $match;
      return _Array_concat(scopedSpans(value), scopedSpans(body));
    }
    case "ELetBind": {
      const { value, body } = $match;
      return _Array_concat(scopedSpans(value), scopedSpans(body));
    }
    case "EPipe": {
      const { left, right } = $match;
      return _Array_concat(scopedSpans(left), scopedSpans(right));
    }
    case "EDo": {
      const { exprs } = $match;
      return scopedSpansAt$(exprs, 0);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return _Array_concat(
        scopedSpans(cond),
        _Array_concat(scopedSpans(thenE), scopedSpans(elseE)),
      );
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return _Array_concat(scopedSpans(scrutinee), scopedSpansInArms$(arms, 0));
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return _Array_concat(
        scopedSpansInFields$(fields, 0),
        _Option_match(
          spread,
          () => [] as SpanAt[],
          (s) => scopedSpans(s),
        ),
      );
    }
    case "EField": {
      const { target, name, span: sp } = $match;
      const rest: SpanAt[] = scopedSpans(target);
      return and(name === "empty", isRefExpr(target)) ? _Array_prepend(sp, rest) : rest;
    }
    case "ETuple": {
      const { elements } = $match;
      return scopedSpansAt$(elements, 0);
    }
    case "EArr": {
      const { elements, span: sp } = $match;
      return scopedSpansInSeq$(elements, sp);
    }
    case "EList": {
      const { elements, span: sp } = $match;
      return scopedSpansInSeq$(elements, sp);
    }
    case "ESet": {
      const { elements, span: sp } = $match;
      return scopedSpansInSeq$(elements, sp);
    }
    case "EMap": {
      const { entries, span: sp } = $match;
      const inner: SpanAt[] = scopedSpansInEntries$(entries, 0);
      return length(entries) === 0 ? _Array_prepend(sp, inner) : inner;
    }
    case "ELoop": {
      const { params, body } = $match;
      return _Array_concat(scopedSpansInLoop$(params, 0), scopedSpans(body));
    }
    case "ERecur": {
      const { args } = $match;
      return scopedSpansAt$(args, 0);
    }
    case "EInterp": {
      const { parts } = $match;
      return scopedSpansInParts$(parts, 0);
    }
    default: {
      return [] as SpanAt[];
    }
  }
};
const isRefExpr: (e: Expr) => boolean = (e: Expr) => {
  const $match = e;
  switch ($match._tag) {
    case "ERef": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const scopedSpansAt$ = (exprs: Expr[], i: number): SpanAt[] =>
  _Option_match(
    _Array_get(i, exprs),
    () => [] as SpanAt[],
    (e) => _Array_concat(scopedSpans(e), scopedSpansAt$(exprs, i + 1)),
  );
const scopedSpansAt: _Curry<[exprs: Expr[], i: number], SpanAt[]> = _curry(2, scopedSpansAt$);
const scopedSpansInArms$ = (arms: MatchArm[], i: number): SpanAt[] =>
  _Option_match(
    _Array_get(i, arms),
    () => [] as SpanAt[],
    (a) =>
      _Array_concat(
        _Option_match(
          a.guard,
          () => [] as SpanAt[],
          (g) => scopedSpans(g),
        ),
        _Array_concat(scopedSpans(a.body), scopedSpansInArms$(arms, i + 1)),
      ),
  );
const scopedSpansInArms: _Curry<[arms: MatchArm[], i: number], SpanAt[]> = _curry(
  2,
  scopedSpansInArms$,
);
const scopedSpansInFields$ = (fields: Field[], i: number): SpanAt[] =>
  _Option_match(
    _Array_get(i, fields),
    () => [] as SpanAt[],
    (f) => _Array_concat(scopedSpans(f.value), scopedSpansInFields$(fields, i + 1)),
  );
const scopedSpansInFields: _Curry<[fields: Field[], i: number], SpanAt[]> = _curry(
  2,
  scopedSpansInFields$,
);
const scopedSpansInEntries$ = (entries: MapEntry[], i: number): SpanAt[] =>
  _Option_match(
    _Array_get(i, entries),
    () => [] as SpanAt[],
    (en) =>
      _Array_concat(
        scopedSpans(en.key),
        _Array_concat(scopedSpans(en.value), scopedSpansInEntries$(entries, i + 1)),
      ),
  );
const scopedSpansInEntries: _Curry<[entries: MapEntry[], i: number], SpanAt[]> = _curry(
  2,
  scopedSpansInEntries$,
);
const scopedSpansInElems$ = (elements: SeqElem[], i: number): SpanAt[] =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as SpanAt[])
      : _v._tag === "Some" && _v.value._tag === "SEExpr"
        ? (({ value: { expr: e } }) =>
            _Array_concat(scopedSpans(e), scopedSpansInElems$(elements, i + 1)))(
            _v as Extract<Option<SeqElem>, { _tag: "Some" }> & {
              value: Extract<
                Extract<Option<SeqElem>, { _tag: "Some" }>["value"],
                { _tag: "SEExpr" }
              >;
            },
          )
        : _v._tag === "Some" && _v.value._tag === "SESpread"
          ? (({ value: { expr: e } }) =>
              _Array_concat(scopedSpans(e), scopedSpansInElems$(elements, i + 1)))(
              _v as Extract<Option<SeqElem>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<SeqElem>, { _tag: "Some" }>["value"],
                  { _tag: "SESpread" }
                >;
              },
            )
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, elements));
const scopedSpansInElems: _Curry<[elements: SeqElem[], i: number], SpanAt[]> = _curry(
  2,
  scopedSpansInElems$,
);
const scopedSpansInSeq$ = (elements: SeqElem[], sp: SpanAt): SpanAt[] => {
  const inner: SpanAt[] = scopedSpansInElems$(elements, 0);
  return length(elements) === 0 ? _Array_prepend(sp, inner) : inner;
};
/**
 * An EMPTY `[]` / `@{}` / `#{}` is itself annotatable; a populated one only
 * carries its elements' nested nodes.
 */
const scopedSpansInSeq: _Curry<[elements: SeqElem[], sp: SpanAt], SpanAt[]> = _curry(
  2,
  scopedSpansInSeq$,
);
const scopedSpansInLoop$ = (params: LoopParam[], i: number): SpanAt[] =>
  _Option_match(
    _Array_get(i, params),
    () => [] as SpanAt[],
    (p) => _Array_concat(scopedSpans(p.init), scopedSpansInLoop$(params, i + 1)),
  );
const scopedSpansInLoop: _Curry<[params: LoopParam[], i: number], SpanAt[]> = _curry(
  2,
  scopedSpansInLoop$,
);
const scopedSpansInParts$ = (parts: InterpPart[], i: number): SpanAt[] =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as SpanAt[])
      : _v._tag === "Some" && _v.value._tag === "IPExpr"
        ? (({ value: { expr: e } }) =>
            _Array_concat(scopedSpans(e), scopedSpansInParts$(parts, i + 1)))(
            _v as Extract<Option<InterpPart>, { _tag: "Some" }> & {
              value: Extract<
                Extract<Option<InterpPart>, { _tag: "Some" }>["value"],
                { _tag: "IPExpr" }
              >;
            },
          )
        : _v._tag === "Some"
          ? scopedSpansInParts$(parts, i + 1)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, parts));
const scopedSpansInParts: _Curry<[parts: InterpPart[], i: number], SpanAt[]> = _curry(
  2,
  scopedSpansInParts$,
);
const scopedNamesAt: <A, B, C, D>(
  spans: ({ start: A; end: B } & D)[],
  i: number,
  names: C,
  acc: Map<string, C>,
) => Map<string, C> = _curry(
  4,
  <A, B, C, D>(spans: ({ start: A; end: B } & D)[], i: number, names: C, acc: Map<string, C>) =>
    _Option_match(
      _Array_get(i, spans),
      () => acc,
      (sp) => scopedNamesAt(spans, i + 1, names, _Map_set(spanKey(sp), names, acc)),
    ),
);
/**
 * Each annotatable node nested in a GENERIC binding's value body -> that
 * binding's letter map (ADR 0042), after record-alias pins (ADR 0106). Scoped
 * PER binding, never a global union: letters are positional, so the same var
 * id can be `A` under one scheme and `C` under another, and a nested node
 * must use exactly the assignment of the head it renders under. A pinned
 * variable prints as its concrete type here too, so a cast inside the body
 * does not mention a letter the head no longer binds.
 */
const scopedNamesFrom: <A>(
  stmts: Stmt[],
  env: Map<string, { vars: number[]; rvars: number[]; ty: Ty } & A>,
  recs: Map<string, string>,
  i: number,
  acc: Map<string, Map<number, string>>,
) => Map<string, Map<number, string>> = _curry(
  5,
  <A>(
    stmts: Stmt[],
    env: Map<string, { vars: number[]; rvars: number[]; ty: Ty } & A>,
    recs: Map<string, string>,
    i: number,
    acc: Map<string, Map<number, string>>,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some" && _v.value._tag === "SLet"
          ? (({ value: { name, value } }) =>
              scopedNamesFrom(
                stmts,
                env,
                recs,
                i + 1,
                ((_v) =>
                  _v._tag === "ELambda" && !_Str_startsWith("$", name)
                    ? _Option_match(
                        _Map_get(name, env),
                        () => acc,
                        (sc) =>
                          or(length(sc.vars) > 0, length(sc.rvars) > 0)
                            ? scopedNamesAt(
                                scopedSpans(value),
                                0,
                                schemeRender(sc, recs).env.vars,
                                acc,
                              )
                            : acc,
                      )
                    : acc)(value),
              ))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
              },
            )
          : _v._tag === "Some"
            ? scopedNamesFrom(stmts, env, recs, i + 1, acc)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, stmts)),
);
/**
 * The TS-backend options: every hook resolved against this module's inference
 * metadata. This is where `inferProgramTypes` and `codegenWith` actually meet.
 */
export const tsGenOpts: <A, B, C, D, E, F, G, H, I>(
  stmts: Stmt[],
  env: Map<string, { vars: number[]; rvars: number[]; ty: Ty } & E>,
  types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[],
  letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[],
  aliases: Map<string, AliasInfo>,
  bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
) => GenOpts = _curry(
  6,
  <A, B, C, D, E, F, G, H, I>(
    stmts: Stmt[],
    env: Map<string, { vars: number[]; rvars: number[]; ty: Ty } & E>,
    types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[],
    letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[],
    aliases: Map<string, AliasInfo>,
    bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
  ) => {
    const typeAt: Map<string, Ty> = typeAtTable(types);
    const letParamAt: Map<string, Ty> = typeAtTable(letParams);
    const genericLams = genericLambdasFrom(
      stmts,
      env,
      0,
      new Map<string, { vars: number[]; rvars: number[]; ty: Ty } & E>(),
    );
    const recs: Map<string, string> = withoutAmbiguousAlias$(
      recordAliasIndex(aliases),
      aliases,
      nullaryLocalNames$(stmts, 0, _Set_fromArray([] as string[])),
    );
    const scopedNames: Map<string, Map<number, string>> = scopedNamesFrom(
      stmts,
      env,
      recs,
      0,
      new Map<string, Map<number, string>>(),
    );
    const typeOf: (a: Expr) => Option<Ty> = (e: Expr) => _Map_get(spanKey(exprSpan(e)), typeAt);
    const envAt: (a: string) => TsEnv = (key: string) =>
      _Option_match(
        _Map_get(key, scopedNames),
        () => recsEnv(recs),
        (vars) => tsEnv(vars, recs),
      );
    return {
      ...jsGenOpts,
      annotateLet: Some(
        _curry(2, (name: string, value: Expr) =>
          _Str_startsWith("$", name)
            ? (None as Option<string>)
            : ((_v) =>
                _v._tag === "ELambda"
                  ? _Option_match(
                      _Map_get(name, env),
                      () => None as Option<string>,
                      (sc) =>
                        Some(`: ${bindingTsType(sc, value, recs, bindingHooks)}`) as Option<string>,
                    )
                  : _Option_map(
                      (ts: string) => `: ${ts}`,
                      _Option_flatMap(
                        (t: Ty) => emptyCollTs$(t, recsEnv(recs)),
                        _Map_get(spanKey(exprSpan(value)), letParamAt),
                      ),
                    ))(value),
        ),
      ) as Option<(a: string, b: Expr) => Option<string>>,
      annotateRaw: Some(
        _curry(2, (name: string, value: Expr) =>
          _Str_startsWith("$", name)
            ? (None as Option<string>)
            : ((_v) =>
                _v._tag === "ELambda"
                  ? _Option_match(
                      _Map_get(name, env),
                      () => None as Option<string>,
                      (sc) => rawReturnTs(sc, value, recs),
                    )
                  : (None as Option<string>))(value),
        ),
      ) as Option<(a: string, b: Expr) => Option<string>>,
      annotateCtor: Some(
        _curry(2, (s: Stmt, c: Ctor) => {
          const $match = s;
          switch ($match._tag) {
            case "SType": {
              const { name, params } = $match;
              return Some(ctorFactoryTs$(name, params, c, aliases, recs)) as Option<CtorFactoryTs>;
            }
            default: {
              return None as Option<CtorFactoryTs>;
            }
          }
        }),
      ) as Option<(a: Stmt, b: Ctor) => Option<CtorFactoryTs>>,
      annotateParams: Some(
        _curry(2, (sp: SpanAt, arity: number) =>
          _Option_match(
            _Map_get(spanKey(sp), genericLams),
            () => ({
              generics: "",
              params: _Option_match(
                _Map_get(spanKey(sp), typeAt),
                () => [] as Option<string>[],
                (t) => lambdaParamTypesTs$(t, arity, envAt(spanKey(sp))),
              ),
            }),
            (sc) =>
              _Option_unwrapOr(
                { generics: "", params: [] as Option<string>[] },
                genericLambdaParams(sc, arity, recs),
              ),
          ),
        ),
      ) as Option<(a: SpanAt, b: number) => ParamAnnots>,
      annotateEmpty: Some((e: Expr) => {
        const key: string = spanKey(exprSpan(e));
        return _Option_flatMap((t: Ty) => emptyCollTs$(t, envAt(key)), _Map_get(key, typeAt));
      }) as Option<(a: Expr) => Option<string>>,
      annotateLetin: Some((value: Expr) =>
        _Option_flatMap(
          (t: Ty) => emptyCollTs$(t, recsEnv(recs)),
          _Map_get(spanKey(exprSpan(value)), letParamAt),
        ),
      ) as Option<(a: Expr) => Option<string>>,
      annotateCall: Some((e: Expr) =>
        _Option_flatMap((t: Ty) => ctorCallTs$(t, recs), typeOf(e)),
      ) as Option<(a: Expr) => Option<string>>,
      guardBaseType: Some((e: Expr) =>
        _Option_flatMap((t: Ty) => guardParamTs$(t, recs), typeOf(e)),
      ) as Option<(a: Expr) => Option<string>>,
      flattenPipe: true,
      tupleHelper: true,
      preserveInfix: true,
      preserveJsx: true,
      moduleExt: "",
    };
  },
);
const anyOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) =>
    reduce(
      _curry(2, (acc: boolean, x: A) => or(acc, f(x))),
      false,
      xs,
    ),
);
const hasJsxExpr: (e: Expr) => boolean = (e: Expr) =>
  ((_v) =>
    _v._tag === "ECall" && _v.origin._tag === "Some" && _v.origin.value === "jsx"
      ? true
      : _v._tag === "ECall"
        ? (({ fn, args }) => or(hasJsxExpr(fn), anyOf(hasJsxExpr, args)))(_v)
        : _v._tag === "ELambda"
          ? (({ body }) => hasJsxExpr(body))(_v)
          : _v._tag === "ELetIn"
            ? (({ value, body }) => or(hasJsxExpr(value), hasJsxExpr(body)))(_v)
            : _v._tag === "ELetBind"
              ? (({ value, body }) => or(hasJsxExpr(value), hasJsxExpr(body)))(_v)
              : _v._tag === "EPipe"
                ? (({ left, right }) => or(hasJsxExpr(left), hasJsxExpr(right)))(_v)
                : _v._tag === "EDo"
                  ? (({ exprs }) => anyOf(hasJsxExpr, exprs))(_v)
                  : _v._tag === "ETernary"
                    ? (({ cond, thenE, elseE }) =>
                        or(or(hasJsxExpr(cond), hasJsxExpr(thenE)), hasJsxExpr(elseE)))(_v)
                    : _v._tag === "EMatch"
                      ? (({ scrutinee, arms }) =>
                          or(
                            hasJsxExpr(scrutinee),
                            anyOf(
                              (a: MatchArm) =>
                                or(
                                  _Option_match(
                                    a.guard,
                                    () => false,
                                    (g) => hasJsxExpr(g),
                                  ),
                                  hasJsxExpr(a.body),
                                ),
                              arms,
                            ),
                          ))(_v)
                      : _v._tag === "ERecord"
                        ? (({ fields, spread }) =>
                            or(
                              anyOf((f: Field) => hasJsxExpr(f.value), fields),
                              _Option_match(
                                spread,
                                () => false,
                                (value) => hasJsxExpr(value),
                              ),
                            ))(_v)
                        : _v._tag === "EField"
                          ? (({ target }) => hasJsxExpr(target))(_v)
                          : _v._tag === "ETuple"
                            ? (({ elements }) => anyOf(hasJsxExpr, elements))(_v)
                            : _v._tag === "EArr"
                              ? (({ elements }) =>
                                  anyOf((el: SeqElem) => {
                                    const $match = el;
                                    switch ($match._tag) {
                                      case "SEExpr": {
                                        const { expr: value } = $match;
                                        return hasJsxExpr(value);
                                      }
                                      case "SESpread": {
                                        const { expr: value } = $match;
                                        return hasJsxExpr(value);
                                      }
                                      default: {
                                        throw new Error("non-exhaustive match");
                                      }
                                    }
                                  }, elements))(_v)
                              : _v._tag === "EList"
                                ? (({ elements }) =>
                                    anyOf((el: SeqElem) => {
                                      const $match = el;
                                      switch ($match._tag) {
                                        case "SEExpr": {
                                          const { expr: value } = $match;
                                          return hasJsxExpr(value);
                                        }
                                        case "SESpread": {
                                          const { expr: value } = $match;
                                          return hasJsxExpr(value);
                                        }
                                        default: {
                                          throw new Error("non-exhaustive match");
                                        }
                                      }
                                    }, elements))(_v)
                                : _v._tag === "ESet"
                                  ? (({ elements }) =>
                                      anyOf((el: SeqElem) => {
                                        const $match = el;
                                        switch ($match._tag) {
                                          case "SEExpr": {
                                            const { expr: value } = $match;
                                            return hasJsxExpr(value);
                                          }
                                          case "SESpread": {
                                            const { expr: value } = $match;
                                            return hasJsxExpr(value);
                                          }
                                          default: {
                                            throw new Error("non-exhaustive match");
                                          }
                                        }
                                      }, elements))(_v)
                                  : _v._tag === "EMap"
                                    ? (({ entries }) =>
                                        anyOf(
                                          (entry: MapEntry) =>
                                            or(hasJsxExpr(entry.key), hasJsxExpr(entry.value)),
                                          entries,
                                        ))(_v)
                                    : _v._tag === "ELoop"
                                      ? (({ params, body }) =>
                                          or(
                                            anyOf((p: LoopParam) => hasJsxExpr(p.init), params),
                                            hasJsxExpr(body),
                                          ))(_v)
                                      : _v._tag === "ERecur"
                                        ? (({ args }) => anyOf(hasJsxExpr, args))(_v)
                                        : _v._tag === "EInterp"
                                          ? (({ parts }) =>
                                              anyOf((part: InterpPart) => {
                                                const $match = part;
                                                switch ($match._tag) {
                                                  case "IPLit": {
                                                    return false;
                                                  }
                                                  case "IPExpr": {
                                                    const { expr: value } = $match;
                                                    return hasJsxExpr(value);
                                                  }
                                                  default: {
                                                    throw new Error("non-exhaustive match");
                                                  }
                                                }
                                              }, parts))(_v)
                                          : false)(e);
const hasJsxStmts: (stmts: Stmt[]) => boolean = (stmts: Stmt[]) =>
  anyOf((stmt: Stmt) => {
    const $match = stmt;
    switch ($match._tag) {
      case "SLet": {
        const { value } = $match;
        return hasJsxExpr(value);
      }
      case "SExpr": {
        const { value } = $match;
        return hasJsxExpr(value);
      }
      default: {
        return false;
      }
    }
  }, stmts);
/**
 * Emit one module's typed TS: type header, then any cross-module imports, then
 * the runtime import, then the codegen body with per-binding / per-ctor
 * annotations and pipe flattening.
 *
 * `imported` / `importLines` are the GRAPH seam (TS's `TsEmitContext`): a
 * single file passes `#{}` / `[]`, a module in a graph passes its deps' ctor
 * field keys (so destructuring an imported ctor emits the right names) and the
 * `import type { … }` lines its driver computed from the emitted text.
 */
export const emitTsModuleWith: <A, B, C, D, E, F, G, H, I>(
  stmts: Stmt[],
  env: Map<string, { ty: Ty; vars: number[]; rvars: number[] } & E>,
  types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[],
  letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[],
  aliases: Map<string, AliasInfo>,
  imported: Map<string, string[]>,
  importLines: string[],
  ns: Map<string, Map<string, string>>,
  jsDefs: Map<string, string>,
  runtimeDeps: Map<string, string[]>,
  runtimeImport: string,
  docs: boolean,
  bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
) => string = _curry(
  13,
  <A, B, C, D, E, F, G, H, I>(
    stmts: Stmt[],
    env: Map<string, { ty: Ty; vars: number[]; rvars: number[] } & E>,
    types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[],
    letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[],
    aliases: Map<string, AliasInfo>,
    imported: Map<string, string[]>,
    importLines: string[],
    ns: Map<string, Map<string, string>>,
    jsDefs: Map<string, string>,
    runtimeDeps: Map<string, string[]>,
    runtimeImport: string,
    docs: boolean,
    bindingHooks: ((a: Expr, b: Ty, c: TsApi) => Option<string>)[],
  ) => {
    const declared: Set<string> = declaredTypeNames$(stmts, 0, _Set_fromArray([] as string[]));
    const wanted: Set<string> = referencedCons(stmts, env, 0, _Set_fromArray([] as string[]));
    const recs: Map<string, string> = withoutAmbiguousAlias$(
      recordAliasIndex(aliases),
      aliases,
      nullaryLocalNames$(stmts, 0, _Set_fromArray([] as string[])),
    );
    const typeHeader: string[] = typeHeaderFrom$(stmts, aliases, recs, docs, 0);
    const body: string = codegenWith(stmts, imported, false, ns, jsDefs, runtimeDeps, {
      ...tsGenOpts(stmts, env, types, letParams, aliases, bindingHooks),
      docs: docs,
    });
    const deps0: string[] = runtimeDepNames(stmts, imported, ns, jsDefs, runtimeDeps);
    const deps: string[] = _Str_contains("_tuple(", body) ? _Array_append("_tuple", deps0) : deps0;
    return ((deps: string[]) =>
      ((runtimeLine: string) =>
        ((header: string[]) =>
          ((typeDeps: string[]) =>
            ((typeImportLine: string) =>
              concat(
                `${hasJsxStmts(stmts) ? "/** @jsx h */\n\n" : ""}${_Str_join(
                  "\n\n",
                  filter(
                    (part: string) => part !== "",
                    [
                      _Str_join("\n", header),
                      _Str_join("\n", importLines),
                      typeImportLine,
                      runtimeLine,
                      body,
                    ],
                  ),
                )}`,
                "\n",
              ))(
              length(typeDeps) === 0
                ? ""
                : `import type { ${_Str_join(", ", _Array_sort(typeDeps))} } from "${runtimeImport}";`,
            ))(
            _Array_concat(
              _Str_contains(
                "_Curry<",
                `${_Str_join("\n", header)}
${body}`,
              )
                ? ["_Curry"]
                : ([] as string[]),
              builtinTypeNamesFor$(declared, wanted, body, 0),
            ),
          ))(typeHeader))(
        length(deps) === 0
          ? ""
          : `import { ${_Str_join(", ", _Array_sort(deps))} } from "${runtimeImport}";`,
      ))(
      filter(
        (d: string) =>
          or(
            and(
              and(
                and(
                  and(
                    and(
                      and(
                        and(and(and(d !== "add", d !== "sub"), d !== "mul"), d !== "div"),
                        d !== "lt",
                      ),
                      d !== "lte",
                    ),
                    d !== "gt",
                  ),
                  d !== "gte",
                ),
                d !== "eq",
              ),
              d !== "not",
            ),
            _Str_contains(d, body),
          ),
        deps,
      ),
    );
  },
);
/**
 * The docstring-retaining default (ADR 0099); `--no-docs` callers reach for
 * `emitTsModuleWith`.
 */
export const emitTsModule: <A, B, C, D, E, F, G, H, I>(
  stmts: Stmt[],
  env: Map<string, { ty: Ty; vars: number[]; rvars: number[] } & E>,
  types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[],
  letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[],
  aliases: Map<string, AliasInfo>,
  imported: Map<string, string[]>,
  importLines: string[],
  ns: Map<string, Map<string, string>>,
  jsDefs: Map<string, string>,
  runtimeDeps: Map<string, string[]>,
  runtimeImport: string,
) => string = _curry(
  11,
  <A, B, C, D, E, F, G, H, I>(
    stmts: Stmt[],
    env: Map<string, { ty: Ty; vars: number[]; rvars: number[] } & E>,
    types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[],
    letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[],
    aliases: Map<string, AliasInfo>,
    imported: Map<string, string[]>,
    importLines: string[],
    ns: Map<string, Map<string, string>>,
    jsDefs: Map<string, string>,
    runtimeDeps: Map<string, string[]>,
    runtimeImport: string,
  ) =>
    emitTsModuleWith(
      stmts,
      env,
      types,
      letParams,
      aliases,
      imported,
      importLines,
      ns,
      jsDefs,
      runtimeDeps,
      runtimeImport,
      true,
      bindingHooksFor(None),
    ),
);
const freeIdsIn$ = (t: Ty, acc: number[]): number[] => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return _Array_contains(id, acc) ? acc : _Array_append(id, acc);
    }
    case "TyCon": {
      const { args } = $match;
      return freeIdsInAll$(args, acc);
    }
    case "TyFn": {
      const { from: fromT, to: toT } = $match;
      return freeIdsIn$(toT, freeIdsIn$(fromT, acc));
    }
    case "TyRecord": {
      const { row } = $match;
      return freeIdsInRow$(row, acc);
    }
    case "TySingleton": {
      return acc;
    }
    case "TyOneOf": {
      const { members } = $match;
      return freeIdsInAll$(members, acc);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
/**
 * Free TYPE vars in FIRST-OCCURRENCE order. Not `freeInType`: its Sets lose the
 * order letters are assigned in, and it also collects row vars, which a bare
 * type has no head to bind — a record's trailing row var is skipped here and
 * the declaration prints the closed body.
 */
const freeIdsIn: _Curry<[t: Ty, acc: number[]], number[]> = _curry(2, freeIdsIn$);
const freeIdsInAll$ = (ts: Ty[], acc: number[]): number[] =>
  reduce(
    _curry(2, (a: number[], t: Ty) => freeIdsIn$(t, a)),
    acc,
    ts,
  );
const freeIdsInAll: _Curry<[ts: Ty[], acc: number[]], number[]> = _curry(2, freeIdsInAll$);
const freeIdsInRow$ = (row: Row, acc: number[]): number[] => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { fieldType, rest } = $match;
      return freeIdsInRow$(rest, freeIdsIn$(fieldType, acc));
    }
    default: {
      return acc;
    }
  }
};
const freeIdsInRow: _Curry<[row: Row, acc: number[]], number[]> = _curry(2, freeIdsInRow$);
/**
 * id -> letter, positionally. Accumulator-first so `Map.values` comes back in
 * index order — the generic head and the rendered params must agree.
 */
const lettersFor: <A>(ids: A[], i: number, acc: Map<A, string>) => Map<A, string> = _curry(
  3,
  <A>(ids: A[], i: number, acc: Map<A, string>) =>
    _Option_match(
      _Array_get(i, ids),
      () => acc,
      (id) => lettersFor(ids, i + 1, _Map_set(id, letterAt(i), acc)),
    ),
);
/**
 * id -> `any`. A VALUE extern is a const: it has no generic head to bind its
 * escaped vars to, and the host is untyped JS, so `any` is the honest boundary.
 */
const anyFor: <A>(ids: A[]) => Map<A, string> = <A>(ids: A[]) =>
  reduce(
    _curry(2, (acc: Map<A, string>, id: A) => _Map_set(id, "any", acc)),
    new Map<A, string>(),
    ids,
  );
const genericHeadOf: <A, B>(ids: A[], names: Map<B, string>) => string = _curry(
  2,
  <A, B>(ids: A[], names: Map<B, string>) =>
    length(ids) === 0 ? "" : `<${_Str_join(", ", _Map_values(names))}>`,
);
/**
 * Arrows on the spine — the extern's declared arity.
 */
const arrowCount: (t: Ty) => number = (t: Ty) => {
  const $match = t;
  switch ($match._tag) {
    case "TyFn": {
      const { to: toT } = $match;
      return 1 + arrowCount(toT);
    }
    default: {
      return 0;
    }
  }
};
const hostParams$ = (t: Ty, arity: number, names: Map<number, string>, i: number): string[] =>
  i >= arity
    ? ([] as string[])
    : ((_v) =>
        _v._tag === "TyFn"
          ? (({ from: fromT, to: toT }) =>
              _Array_prepend(
                `${_Str_fromCode(97 + i)}: ${tsOf(fromT, plainEnv(names))}`,
                hostParams$(toT, arity, names, i + 1),
              ))(_v)
          : ([] as string[]))(t);
/**
 * Peel `arity` arrows into `a: T`, `b: T`, … — the same positional naming
 * `tsArrow` uses, so a declaration and a call site read alike.
 */
const hostParams: _Curry<[t: Ty, arity: number, names: Map<number, string>, i: number], string[]> =
  _curry(4, hostParams$);
const hostReturn$ = (t: Ty, arity: number, i: number): Ty =>
  i >= arity
    ? t
    : ((_v) => (_v._tag === "TyFn" ? (({ to: toT }) => hostReturn$(toT, arity, i + 1))(_v) : t))(t);
const hostReturn: _Curry<[t: Ty, arity: number, i: number], Ty> = _curry(3, hostReturn$);
const curriedHostType$ = (t: Ty, arity: number): string => {
  const ids: number[] = freeIdsIn$(t, [] as number[]);
  const names: Map<number, string> = lettersFor(ids, 0, new Map<number, string>());
  return `${genericHeadOf(ids, names)}${reduce(
    _curry(2, (acc: string, p: string) => `(${p}) => ${acc}`),
    tsOf(hostReturn$(t, arity, 0), plainEnv(names)),
    _Array_reverse(hostParams$(t, arity, names, 0)),
  )}`;
};
/**
 * `(a: A) => (b: B) => R` — a CURRIED host's own shape (ADR 0064). Unlike
 * `flatHostType` there are no partial-application overloads to offer: `_curry`
 * is built AROUND this host, not exported by it, so it takes exactly one
 * argument per call. Folded right-to-left, hence the reverse.
 */
const curriedHostType: _Curry<[t: Ty, arity: number], string> = _curry(2, curriedHostType$);
const flatHostType$ = (t: Ty, arity: number): string => {
  const ids: number[] = freeIdsIn$(t, [] as number[]);
  const names: Map<number, string> = lettersFor(ids, 0, new Map<number, string>());
  const head: string = genericHeadOf(ids, names);
  return arity === 0
    ? `${head}${tsOf(t, plainEnv(names))}`
    : curriedOverloads$(
        head,
        hostParams$(t, arity, names, 0),
        tsOf(hostReturn$(t, arity, 0), plainEnv(names)),
      );
};
/**
 * An UNCURRIED function host gets the same overloaded signature a runtime
 * builtin does, so both `f(a)(b)` and `f(a, b)` call sites resolve (ADR 0037).
 */
export const flatHostType: _Curry<[t: Ty, arity: number], string> = _curry(2, flatHostType$);
/**
 * One `export declare const` for a host binding. `e` is
 * `{ imported, scheme, curried }` — `imported` is the JS export name the
 * emitted `import { … }` binds, not the mochi-side name.
 */
const externDecl: <A, B>(
  e: { scheme: { ty: Ty } & A; curried: boolean; imported: string } & B,
) => string = <A, B>(e: { scheme: { ty: Ty } & A; curried: boolean; imported: string } & B) => {
  const t: Ty = e.scheme.ty;
  const n: number = arrowCount(t);
  return and(n >= 1, e.curried)
    ? `export declare const ${e.imported}: ${curriedHostType$(t, n)};`
    : n === 0
      ? `export declare const ${e.imported}: ${tsOf(t, plainEnv(anyFor(freeIdsIn$(t, [] as number[]))))};`
      : `export declare const ${e.imported}: ${flatHostType$(t, n)};`;
};
/**
 * One extern host module's declaration file. Referenced builtin variants are
 * inlined, so the sidecar is self-contained and needs no import of its own.
 * `dedupeBy` keeps the FIRST of two mochi bindings aliasing one host export —
 * a repeated `export declare const` is a TS2323.
 */
export const externModuleDts: <A, B>(
  externs: ({ scheme: { ty: Ty } & A; imported: string; curried: boolean } & B)[],
  aliases: Map<string, AliasInfo>,
) => string = _curry(
  2,
  <A, B>(
    externs: ({ scheme: { ty: Ty } & A; imported: string; curried: boolean } & B)[],
    aliases: Map<string, AliasInfo>,
  ) => {
    const wanted: Set<string> = reduce(
      _curry(
        2,
        (acc: Set<string>, e: { scheme: { ty: Ty } & A; imported: string; curried: boolean } & B) =>
          consInTy$(e.scheme.ty, acc),
      ),
      _Set_fromArray([] as string[]),
      externs,
    );
    return concat(
      _Str_join(
        "\n",
        _Array_concat(
          map(
            (bt: { name: string; params: string[]; ctors: Ctor[] }) =>
              typeDecl$(bt.name, bt.params, bt.ctors, aliases, new Map<string, string>()),
            filter(
              (bt: { name: string; params: string[]; ctors: Ctor[] }) => _Set_has(bt.name, wanted),
              builtinTypeDecls,
            ),
          ),
          map(
            externDecl,
            _Array_dedupeBy(
              (e: { imported: string; scheme: { ty: Ty } & A; curried: boolean } & B) => e.imported,
              externs,
            ),
          ),
        ),
      ),
      "\n",
    );
  },
);
