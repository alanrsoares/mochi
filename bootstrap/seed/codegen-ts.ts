import type {
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
} from "./ast";
import type { Row, SpanAt, St, Ty } from "./types";
import type { QualAliasField } from "./infer";
import type { CtorFactoryTs, CtorFieldLike, CtorLike, GenOpts, ParamAnnots } from "./codegen";
import type { TsEnv } from "./ts-types";

/**
 * A declared type alias as the printer reads it: its parameters, plus EITHER a
 * record body (`fields`) or a transparent template (`expr`). Declared here as
 * well as in schemes.mochi rather than shared through an import — a local
 * record alias expands, so both copies unify structurally (ADR 0044).
 */
export type AliasInfo = { params: string[]; fields: QualAliasField[]; expr: Option<TypeExpr> };

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
  _Option_unwrapOr,
  _Set_add,
  _Set_fromArray,
  _Set_has,
  _Str_contains,
  _Str_fromCode,
  _Str_join,
  _Str_split,
  _Str_startsWith,
  _curry,
  _list,
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

import { match } from "@onrails/pattern";

import * as Ast from "./ast";
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
} from "./types";
import { typeExprToType, collect, emptyVarSets } from "./schemes";
import { builtinTypeDecls, keysOf } from "./ctors";
import { codegenWith, jsDoc, jsGenOpts, runtimeDepNames } from "./codegen";
import { inferProgramTypes, exprSpan } from "./infer";
import { genericNames, letterAt, plainEnv, recsEnv, rowShapeKey, tsEnv, tsOf } from "./ts-types";
/**
 * Type params are bound POSITIONALLY: the i-th param is var `i`, rendered as
 * the i-th letter. Both maps are built from one index so a field type and the
 * declaration head always agree on a param's letter.
 */
const paramVarsFrom: <A>(params: A[], i: number) => Map<A, Ty> = _curry(
  2,
  <A>(params: A[], i: number) =>
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => new Map<A, Ty>())
      .with({ _tag: "Some" }, ({ value: p }) => _Map_set(p, tVar(i), paramVarsFrom(params, i + 1)))
      .exhaustive(),
);
const paramNamesFrom: <A>(params: A[], i: number) => Map<number, string> = _curry(
  2,
  <A>(params: A[], i: number) =>
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => new Map<number, string>())
      .with({ _tag: "Some" }, () => _Map_set(i, letterAt(i), paramNamesFrom(params, i + 1)))
      .exhaustive(),
);
/**
 * `<A, B>` for a parameterised decl, `""` for a nullary one.
 */
const genericHead: <A>(params: A[], i: number, acc: string[]) => string = _curry(
  3,
  <A>(params: A[], i: number, acc: string[]) =>
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => (eq(length(acc), 0) ? "" : `<${_Str_join(", ", acc)}>`))
      .with({ _tag: "Some" }, () => genericHead(params, i + 1, _Array_append(letterAt(i), acc)))
      .exhaustive(),
);
/**
 * A ctor field's type is a full TypeExpr (ADR 0015). Lower it to a Ty first —
 * params bound positionally, aliases left nominal — then render through `tsOf`,
 * so the TS grammar has exactly one encoder.
 */
const fieldTs: _Curry<
  [te: TypeExpr, params: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>],
  string
> = _curry(
  4,
  (te: TypeExpr, params: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>) => {
    const vars: Map<string, Ty> = paramVarsFrom(params, 0);
    const names: Map<number, string> = paramNamesFrom(params, 0);
    return (([t, _vars, _st]: [Ty, Map<string, Ty>, St]) => tsOf(t, tsEnv(names, recs)))(
      typeExprToType(te, vars, mkSt(length(params)), aliases, _Set_fromArray([] as string[])),
    );
  },
);
/**
 * Keys come from `keysOf` (the same projection the runtime shape uses, so a
 * declared field name and its emitted key can never drift); this loop only
 * ever reads `fieldType`.
 */
const ctorFieldsFrom: _Curry<
  [
    fields: CtorFieldLike[],
    keys: string[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(
  6,
  (
    fields: CtorFieldLike[],
    keys: string[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: fld }) =>
        _Array_prepend(
          `${_Option_unwrapOr(`_${show(i)}`, _Array_get(i, keys))}: ${fieldTs(fld.fieldType, params, aliases, recs)}`,
          ctorFieldsFrom(fields, keys, params, aliases, recs, i + 1),
        ),
      )
      .exhaustive(),
);
/**
 * One ctor's runtime shape: the `_tag` discriminant plus its fields.
 */
const ctorVariant: _Curry<
  [c: CtorLike, params: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>],
  string
> = _curry(
  4,
  (c: CtorLike, params: string[], aliases: Map<string, AliasInfo>, recs: Map<string, string>) => {
    const fields: string[] = ctorFieldsFrom(c.fields, keysOf(c.fields), params, aliases, recs, 0);
    return eq(length(fields), 0)
      ? `{ _tag: "${c.name}" }`
      : `{ _tag: "${c.name}"; ${_Str_join("; ", fields)} }`;
  },
);
const ctorVariantsFrom: _Curry<
  [
    ctors: CtorLike[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(
  5,
  (
    ctors: CtorLike[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ) =>
    match(_Array_get(i, ctors))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: c }) =>
        _Array_prepend(
          `  | ${ctorVariant(c, params, aliases, recs)}`,
          ctorVariantsFrom(ctors, params, aliases, recs, i + 1),
        ),
      )
      .exhaustive(),
);
/**
 * A `type` decl -> an exported tagged union matching the runtime shape.
 */
export const typeDecl: _Curry<
  [
    name: string,
    params: string[],
    ctors: CtorLike[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  string
> = _curry(
  5,
  (
    name: string,
    params: string[],
    ctors: CtorLike[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ) => {
    const head: string = `${name}${genericHead(params, 0, [] as string[])}`;
    return `export type ${head} =
${_Str_join("\n", ctorVariantsFrom(ctors, params, aliases, recs, 0))};`;
  },
);
const aliasFieldsFrom: _Curry<
  [
    fields: QualAliasField[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(
  5,
  (
    fields: QualAliasField[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: f }) =>
        _Array_prepend(
          `${f.name}${f.optional ? "?" : ""}: ${fieldTs(f.fieldType, params, aliases, recs)}`,
          aliasFieldsFrom(fields, params, aliases, recs, i + 1),
        ),
      )
      .exhaustive(),
);
/**
 * A record alias (`type Point = { x: number, y: number }`) -> an exported
 * object type. Structural, so it renders through the same `tsOf` encoder.
 */
export const recordAliasDecl: _Curry<
  [
    name: string,
    params: string[],
    fields: QualAliasField[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  string
> = _curry(
  5,
  (
    name: string,
    params: string[],
    fields: QualAliasField[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ) => {
    const head: string = `${name}${genericHead(params, 0, [] as string[])}`;
    const body: string[] = aliasFieldsFrom(fields, params, aliases, recs, 0);
    return eq(length(body), 0)
      ? `export type ${head} = {};`
      : `export type ${head} = { ${_Str_join("; ", body)} };`;
  },
);
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
> = _curry(
  5,
  (
    name: string,
    params: string[],
    template: TypeExpr,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ) => {
    const head: string = `${name}${genericHead(params, 0, [] as string[])}`;
    return `export type ${head} = ${fieldTs(template, params, aliases, recs)};`;
  },
);
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
    match(_Array_get(i, keys))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: k }) =>
        mergeInto(
          keys,
          src,
          match(_Map_get(k, src))
            .with({ _tag: "Some" }, ({ value: v }) => _Map_set(k, v, acc))
            .with({ _tag: "None" }, () => acc)
            .exhaustive(),
          i + 1,
        ),
      )
      .exhaustive(),
);
const unionNamesFrom: <A, B>(
  schemes: ({ vars: A[]; rvars: A[] } & B)[],
  i: number,
  acc: Map<A, string>,
) => Map<A, string> = _curry(
  3,
  <A, B>(schemes: ({ vars: A[]; rvars: A[] } & B)[], i: number, acc: Map<A, string>) =>
    match(_Array_get(i, schemes))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: sc }) =>
        ((names) => unionNamesFrom(schemes, i + 1, mergeInto(_Map_keys(names), names, acc, 0)))(
          genericNames(sc),
        ),
      )
      .exhaustive(),
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
  <A>(t: Ty, names: Map<number, A>) =>
    match(t)
      .with({ _tag: "TyVar" }, ({ id }) => _Option_isSome(_Map_get(id, names)))
      .with({ _tag: "TyCon" }, ({ args }) => allVarsInAll(args, names, 0))
      .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
        and(allVarsIn(fromT, names), allVarsIn(toT, names)),
      )
      .with({ _tag: "TyRecord" }, ({ row }) => allVarsInRow(row, names))
      .with({ _tag: "TySingleton" }, () => true)
      .with({ _tag: "TyOneOf" }, ({ members }) => allVarsInAll(members, names, 0))
      .exhaustive(),
);
const allVarsInAll: <A>(ts: Ty[], names: Map<number, A>, i: number) => boolean = _curry(
  3,
  <A>(ts: Ty[], names: Map<number, A>, i: number) =>
    match(_Array_get(i, ts))
      .with({ _tag: "None" }, () => true)
      .with({ _tag: "Some" }, ({ value: t }) =>
        and(allVarsIn(t, names), allVarsInAll(ts, names, i + 1)),
      )
      .exhaustive(),
);
const allVarsInRow: <A>(row: Row, names: Map<number, A>) => boolean = _curry(
  2,
  <A>(row: Row, names: Map<number, A>) =>
    match(row)
      .with({ _tag: "RowEmpty" }, () => true)
      .with({ _tag: "RowVar" }, ({ id }) => _Option_isSome(_Map_get(id, names)))
      .with({ _tag: "RowExtend" }, ({ fieldType, rest }) =>
        and(allVarsIn(fieldType, names), allVarsInRow(rest, names)),
      )
      .exhaustive(),
);
/**
 * No `names` in scope, so this is true exactly when the type is fully concrete.
 */
const isConcrete: (t: Ty) => boolean = (t: Ty) => allVarsIn(t, new Map([]));
/**
 * TS type for an EMPTY literal (`#{}` / `[]` / `@{}` / `Set.empty`). Such a
 * seed infers `Map<unknown, unknown>` / `never[]` / `Set<never>`, which will
 * not flow into a concretely-typed position (ADR 0035). `names` carries an
 * enclosing generic binding's letters (ADR 0042), so a seed whose element type
 * is one of those renders as the letter instead of being skipped; with no such
 * scope only a fully concrete type renders, since a free var would become
 * `unknown` — no better than tsc's own guess.
 */
export const emptyCollTs: _Curry<[t: Ty, env: TsEnv], Option<string>> = _curry(
  2,
  (t: Ty, env: TsEnv) =>
    allVarsIn(t, env.vars) ? (Some(tsOf(t, env)) as Option<string>) : (None as Option<string>),
);
/**
 * TS type for an APPLIED parametric ctor call (`Ok(x)`), else `None`. A ctor's
 * argument pins only the params it mentions; a phantom one (`Ok`'s error type)
 * stays free and widens to `unknown`, which then fails to unify with a sibling
 * match arm (ADR 0043). Fully-concrete applied cons only — a nullary con or a
 * free var would render no better than tsc manages alone.
 */
export const ctorCallTs: _Curry<[t: Ty, recs: Map<string, string>], Option<string>> = _curry(
  2,
  (t: Ty, recs: Map<string, string>) =>
    match(t)
      .with({ _tag: "TyCon" }, ({ args }) =>
        or(eq(length(args), 0), not(isConcrete(t)))
          ? (None as Option<string>)
          : (Some(tsOf(t, recsEnv(recs))) as Option<string>),
      )
      .otherwise(() => None as Option<string>),
);
/**
 * A match scrutinee's concrete TS type — the base a guard-form arm's predicate
 * narrows FROM (ADR 0031). Concrete only: a scrutinee with free vars cannot
 * name its generics in value position (TS2304), so those keep the bare boolean
 * guard and their handlers keep the polymorphic tail.
 */
export const guardParamTs: _Curry<[t: Ty, recs: Map<string, string>], Option<string>> = _curry(
  2,
  (t: Ty, recs: Map<string, string>) =>
    isConcrete(t) ? (Some(tsOf(t, recsEnv(recs))) as Option<string>) : (None as Option<string>),
);
/**
 * Peel one arrow per collapsed lambda param, annotating each (ADR 0028).
 * A param whose vars are ALL in scope renders with those letters (ADR 0042);
 * otherwise only a fully concrete param renders, because a generic binding's
 * letters live on the const's TYPE head and naming one in a value position
 * would be an out-of-scope TS2304.
 */
const lambdaParamsFrom: _Curry<[t: Ty, arity: number, env: TsEnv, i: number], Option<string>[]> =
  _curry(4, (t: Ty, arity: number, env: TsEnv, i: number) =>
    i >= arity
      ? ([] as Option<string>[])
      : match(t)
          .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
            _Array_prepend(
              allVarsIn(fromT, env.vars)
                ? (Some(tsOf(fromT, env)) as Option<string>)
                : isConcrete(fromT)
                  ? (Some(tsOf(fromT, recsEnv(env.recs))) as Option<string>)
                  : (None as Option<string>),
              lambdaParamsFrom(toT, arity, env, i + 1),
            ),
          )
          .otherwise(() =>
            _Array_prepend(None as Option<string>, lambdaParamsFrom(t, arity, env, i + 1)),
          ),
  );
export const lambdaParamTypesTs: _Curry<
  [lamType: Ty, arity: number, env: TsEnv],
  Option<string>[]
> = _curry(3, (lamType: Ty, arity: number, env: TsEnv) => lambdaParamsFrom(lamType, arity, env, 0));
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
  _curry(4, (t: Ty, arity: number, env: TsEnv, i: number) =>
    i >= arity
      ? ([] as Option<string>[])
      : match(t)
          .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
            _Array_prepend(
              Some(tsOf(fromT, env)) as Option<string>,
              genericParamsFrom(toT, arity, env, i + 1),
            ),
          )
          .otherwise(() =>
            _Array_prepend(None as Option<string>, genericParamsFrom(t, arity, env, i + 1)),
          ),
  );
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
  ) => {
    const names: Map<number, string> = genericNames(sc);
    const env: TsEnv = tsEnv(names, recs);
    return eq(_Map_size(names), 0)
      ? (None as Option<ParamAnnots>)
      : (Some({
          generics: `<${_Str_join(", ", _Map_values(names))}>`,
          params: genericParamsFrom(sc.ty, arity, env, 0),
        }) as Option<ParamAnnots>);
  },
);
/**
 * The typing for one variant ctor's factory (`GenOpts.annotateCtor`).
 * `retMono` pins every param to `never` so a NULLARY ctor's const keeps its
 * literal `_tag` instead of widening to `string`.
 */
const neverArgs: <A>(params: A[], i: number, acc: string[]) => string[] = _curry(
  3,
  <A>(params: A[], i: number, acc: string[]) =>
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, () => neverArgs(params, i + 1, _Array_append("never", acc)))
      .exhaustive(),
);
const ctorParamTypes: _Curry<
  [
    fields: CtorFieldLike[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ],
  string[]
> = _curry(
  5,
  (
    fields: CtorFieldLike[],
    params: string[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
    i: number,
  ) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: fld }) =>
        _Array_prepend(
          fieldTs(fld.fieldType, params, aliases, recs),
          ctorParamTypes(fields, params, aliases, recs, i + 1),
        ),
      )
      .exhaustive(),
);
export const ctorFactoryTs: _Curry<
  [
    typeName: string,
    params: string[],
    c: CtorLike,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ],
  CtorFactoryTs
> = _curry(
  5,
  (
    typeName: string,
    params: string[],
    c: CtorLike,
    aliases: Map<string, AliasInfo>,
    recs: Map<string, string>,
  ) => {
    const head: string = genericHead(params, 0, [] as string[]);
    const monos: string[] = neverArgs(params, 0, [] as string[]);
    return {
      generics: head,
      paramTypes: ctorParamTypes(c.fields, params, aliases, recs, 0),
      ret: `${typeName}${head}`,
      retMono: eq(length(monos), 0) ? typeName : `${typeName}<${_Str_join(", ", monos)}>`,
    };
  },
);
/**
 * A lambda param's declared NAME (destructuring params take a positional
 * placeholder — the type is what matters here, not the binder shape).
 */
const paramDeclName: <A>(p: LamParam, i: A) => string = _curry(2, <A>(p: LamParam, i: A) =>
  match(p)
    .with({ _tag: "LPSpanned" }, ({ param: inner }) => paramDeclName(inner, i))
    .with({ _tag: "LPName" }, ({ name }) => name)
    .with({ _tag: "LPLabeled" }, () => "$lab")
    .otherwise(() => `_${show(i)}`),
);
/**
 * Every ordered composition of `n` — `3` gives [1,1,1], [1,2], [2,1], [3].
 * Longest first, so the flat all-at-once signature is emitted LAST.
 */
const compositions: (n: number) => number[][] = (n: number) =>
  eq(n, 0) ? [[] as number[]] : compositionsFrom(n, 1);
const compositionsFrom: _Curry<[n: number, k: number], number[][]> = _curry(
  2,
  (n: number, k: number) =>
    k > n
      ? ([] as number[][])
      : _Array_concat(map(_Array_prepend(k), compositions(n - k)), compositionsFrom(n, k + 1)),
);
/**
 * Slice `params` into consecutive groups of the given sizes.
 */
const sliceGroups: <A>(params: A[], groups: number[], i: number, at: number) => A[][] = _curry(
  4,
  <A>(params: A[], groups: number[], i: number, at: number) =>
    match(_Array_get(i, groups))
      .with({ _tag: "None" }, () => [] as A[][])
      .with({ _tag: "Some" }, ({ value: g }) =>
        _Array_prepend(
          _Array_take(g, _Array_drop(at, params)),
          sliceGroups(params, groups, i + 1, at + g),
        ),
      )
      .exhaustive(),
);
/**
 * Fold the trailing groups into a curried tail: `(c) => (d) => R`.
 */
const curriedTail: _Curry<[slices: string[][], i: number, acc: string], string> = _curry(
  3,
  (slices: string[][], i: number, acc: string) =>
    i < 1
      ? acc
      : curriedTail(
          slices,
          i - 1,
          `(${_Str_join(", ", _Option_unwrapOr([] as string[], _Array_get(i, slices)))}) => ${acc}`,
        ),
);
const overloadSig: _Curry<[head: string, params: string[], ret: string, groups: number[]], string> =
  _curry(4, (head: string, params: string[], ret: string, groups: number[]) => {
    const slices: string[][] = sliceGroups(params, groups, 0, 0);
    const tail: string = curriedTail(slices, length(slices) - 1, ret);
    return `${head}(${_Str_join(", ", _Option_unwrapOr([] as string[], _Array_get(0, slices)))}): ${tail};`;
  });
/**
 * A curry-compatible function type. The JS backend curries every arity->=2
 * function through `_curry`, so a call site may partially apply in ANY
 * grouping — `f(a, b)`, `f(a)(b)`, `f(a, b)(c)`. One flat `(a, b) => R` rejects
 * all but the all-at-once form, so emit an OVERLOAD per composition of the
 * arity (ADR 0037). `head` scopes generics INSIDE each call signature, so it is
 * threaded here rather than prepended by the caller.
 */
export const curriedOverloads: _Curry<[head: string, params: string[], ret: string], string> =
  _curry(3, (head: string, params: string[], ret: string) =>
    length(params) <= 1
      ? `${head}(${_Str_join(", ", params)}) => ${ret}`
      : `{ ${_Str_join(
          " ",
          map(
            overloadSig(head, params, ret),
            _Array_sortBy((g: number[]) => 0 - length(g), compositions(length(params))),
          ),
        )} }`,
  );

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
  (params: string[], ret: string) =>
    length(params) <= 1
      ? `(${_Str_join(", ", params)}) => ${ret}`
      : `_Curry<[${_Str_join(", ", params)}], ${ret}>`,
);
/**
 * Walk the value's lambda spine and the type's arrow spine together,
 * collecting one rendered `name: T` per param. A zero-param lambda consumes
 * the `unit` arrow the JS side erases.
 */
const flatParamsFrom: _Curry<
  [t: Ty, value: Expr, env: TsEnv, n: number, acc: string[]],
  [string[], string]
> = _curry(5, (t: Ty, value: Expr, env: TsEnv, n: number, acc: string[]) =>
  match(value)
    .with({ _tag: "ELambda" }, ({ params, body }) =>
      eq(length(params), 0)
        ? ((next: Ty) => flatParamsFrom(next, body, env, n, acc))(
            match(t)
              .with(
                (_v): _v is Extract<Ty, { _tag: "TyFn" }> => {
                  const _g: any = _v;
                  return _g._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_g);
                },
                ({ from: fromT, to: toT }) => toT,
              )
              .otherwise(() => t),
          )
        : (([t1, n1, acc1]: [Ty, number, string[]]) => flatParamsFrom(t1, body, env, n1, acc1))(
            takeParams(t, params, env, 0, n, acc),
          ),
    )
    .otherwise(() => _tuple(acc, tsOf(t, env))),
);
const takeParams: _Curry<
  [t: Ty, params: LamParam[], env: TsEnv, i: number, n: number, acc: string[]],
  [Ty, number, string[]]
> = _curry(6, (t: Ty, params: LamParam[], env: TsEnv, i: number, n: number, acc: string[]) =>
  match(_Array_get(i, params))
    .with({ _tag: "None" }, () => _tuple(t, n, acc))
    .with({ _tag: "Some" }, ({ value: p }) =>
      match(t)
        .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
          takeParams(
            toT,
            params,
            env,
            i + 1,
            n + 1,
            _Array_append(`${paramDeclName(p, n)}: ${tsOf(fromT, env)}`, acc),
          ),
        )
        .otherwise(() => _tuple(t, n, acc)),
    )
    .exhaustive(),
);
/**
 * Arity-aware nested form: one arrow peeled per param, recursing into the body
 * so a curried definition keeps its shape.
 */
const declType: _Curry<[t: Ty, value: Expr, env: TsEnv], string> = _curry(
  3,
  (t: Ty, value: Expr, env: TsEnv) =>
    match(value)
      .with({ _tag: "ELambda" }, ({ params, body }) =>
        eq(length(params), 0)
          ? ((next: Ty) => `() => ${declType(next, body, env)}`)(
              match(t)
                .with(
                  (_v): _v is Extract<Ty, { _tag: "TyFn" }> => {
                    const _g: any = _v;
                    return _g._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_g);
                  },
                  ({ from: fromT, to: toT }) => toT,
                )
                .otherwise(() => t),
            )
          : (([t1, _n, ps]: [Ty, number, string[]]) =>
              `(${_Str_join(", ", ps)}) => ${declType(t1, body, env)}`)(
              takeParams(t, params, env, 0, 0, [] as string[]),
            ),
      )
      .otherwise(() => tsOf(t, env)),
);
/**
 * The TS type of a binding, WITHOUT the `const name:` wrapper — the piece the
 * declaration writer and the TS backend share.
 *
 * A CONCRETE function emits partial-application overloads so `_curry`'d calls
 * typecheck (ADR 0037). A GENERIC one keeps the nested arrow: overloads there
 * wreck tsc's callback contextual typing and type-argument inference. A
 * non-function polymorphic binding has nowhere to bind generics, so its
 * escaped vars fall back to `unknown`.
 */
export const bindingTsType: <A>(
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
    const names: Map<number, string> = genericNames(sc);
    const env: TsEnv = tsEnv(names, recs);
    const head: string = eq(_Map_size(names), 0) ? "" : `<${_Str_join(", ", _Map_values(names))}>`;
    return match(value)
      .with({ _tag: "ELambda" }, () =>
        eq(head, "")
          ? (([params, ret]: [string[], string]) => curriedFnType(params, ret))(
              flatParamsFrom(sc.ty, value, env, 0, [] as string[]),
            )
          : `${head}${declType(sc.ty, value, env)}`,
      )
      .otherwise(() => tsOf(sc.ty, recsEnv(recs)));
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
    match(_Array_get(i, types))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: r }) =>
        typeAtFrom(types, i + 1, _Map_set(spanKey(r.span), r.ty, acc)),
      )
      .exhaustive(),
);
/**
 * Later records win when two nodes share a span — `zonkRecorded` already put
 * them in source order, so a plain left fold gets that for free.
 */
export const typeAtTable: <A, B, C, D, E>(
  types: ({ span: { start: A; end: B } & D; ty: C } & E)[],
) => Map<string, C> = <A, B, C, D, E>(types: ({ span: { start: A; end: B } & D; ty: C } & E)[]) =>
  typeAtFrom(types, 0, new Map<string, C>());
/**
 * Every `con` name a type mentions — used to decide which builtin variant
 * decls a module has to carry so its own references resolve.
 */
const consInTy: _Curry<[t: Ty, acc: Set<string>], Set<string>> = _curry(
  2,
  (t: Ty, acc: Set<string>) =>
    match(t)
      .with(
        (_v): _v is Extract<Ty, { _tag: "TyCon" }> => {
          const _g: any = _v;
          return _g._tag === "TyCon" && _g.name === "Task" && _g.args.length === 2;
        },
        ({ args: [value, error] }) =>
          consInTy(error, consInTy(value, _Set_add("Result", _Set_add("Task", acc)))),
      )
      .with({ _tag: "TyCon" }, ({ name, args }) => consInAll(args, _Set_add(name, acc), 0))
      .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => consInTy(toT, consInTy(fromT, acc)))
      .with({ _tag: "TyRecord" }, ({ row }) => consInRow(row, acc))
      .with({ _tag: "TyOneOf" }, ({ members }) => consInAll(members, acc, 0))
      .otherwise(() => acc),
);
const consInAll: _Curry<[ts: Ty[], acc: Set<string>, i: number], Set<string>> = _curry(
  3,
  (ts: Ty[], acc: Set<string>, i: number) =>
    match(_Array_get(i, ts))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: t }) => consInAll(ts, consInTy(t, acc), i + 1))
      .exhaustive(),
);
const consInRow: _Curry<[row: Row, acc: Set<string>], Set<string>> = _curry(
  2,
  (row: Row, acc: Set<string>) =>
    match(row)
      .with({ _tag: "RowExtend" }, ({ fieldType, rest }) =>
        consInRow(rest, consInTy(fieldType, acc)),
      )
      .otherwise(() => acc),
);
export const declaredTypeNames: _Curry<
  [stmts: Stmt[], i: number, acc: Set<string>],
  Set<string>
> = _curry(3, (stmts: Stmt[], i: number, acc: Set<string>) =>
  match(_Array_get(i, stmts))
    .with({ _tag: "None" }, () => acc)
    .with(
      (
        _v,
      ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "SType";
      },
      ({ value: { name } }) => declaredTypeNames(stmts, i + 1, _Set_add(name, acc)),
    )
    .with({ _tag: "Some" }, () => declaredTypeNames(stmts, i + 1, acc))
    .exhaustive(),
);
export const referencedCons: <A>(
  stmts: Stmt[],
  env: Map<string, { ty: Ty } & A>,
  i: number,
  acc: Set<string>,
) => Set<string> = _curry(
  4,
  <A>(stmts: Stmt[], env: Map<string, { ty: Ty } & A>, i: number, acc: Set<string>) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => acc)
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SLet";
        },
        ({ value: { name } }) =>
          referencedCons(
            stmts,
            env,
            i + 1,
            _Str_startsWith("$", name)
              ? acc
              : match(_Map_get(name, env))
                  .with({ _tag: "Some" }, ({ value: sc }) => consInTy(sc.ty, acc))
                  .with({ _tag: "None" }, () => acc)
                  .exhaustive(),
          ),
      )
      .with({ _tag: "Some" }, () => referencedCons(stmts, env, i + 1, acc))
      .exhaustive(),
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
> = _curry(4, (declared: Set<string>, wanted: Set<string>, body: string, i: number) =>
  match(_Array_get(i, builtinTypeDecls))
    .with({ _tag: "None" }, () => [] as string[])
    .with({ _tag: "Some" }, ({ value: bt }) =>
      ((rest: string[]) =>
        and(
          not(_Set_has(bt.name, declared)),
          or(_Set_has(bt.name, wanted), _Str_contains(bt.name, body)),
        )
          ? _Array_prepend(bt.name, rest)
          : rest)(builtinTypeNamesFor(declared, wanted, body, i + 1)),
    )
    .exhaustive(),
);
/**
 * A declared record alias lowered back to the row its USES carry. ADR 0005
 * expands a record alias at `typeExprToType`, so this reproduces exactly what
 * inference will have put in the type table for a value of that alias.
 */
const aliasRowOf: _Curry<
  [fields: QualAliasField[], aliases: Map<string, AliasInfo>, i: number],
  Row
> = _curry(3, (fields: QualAliasField[], aliases: Map<string, AliasInfo>, i: number) =>
  match(_Array_get(i, fields))
    .with({ _tag: "None" }, () => RowEmpty as Row)
    .with({ _tag: "Some" }, ({ value: f }) =>
      (([t, _vars, _st]: [Ty, Map<string, Ty>, St]) =>
        RowExtend(f.name, t, f.optional, aliasRowOf(fields, aliases, i + 1)))(
        typeExprToType(
          f.fieldType,
          new Map<string, Ty>(),
          mkSt(0),
          aliases,
          _Set_fromArray([] as string[]),
        ),
      ),
    )
    .exhaustive(),
);
const aliasShapeKey: _Curry<
  [fields: QualAliasField[], aliases: Map<string, AliasInfo>],
  Option<string>
> = _curry(2, (fields: QualAliasField[], aliases: Map<string, AliasInfo>) =>
  rowShapeKey(aliasRowOf(fields, aliases, 0), new Map<number, string>()),
);
/**
 * Every record alias IN SCOPE, keyed by canonical row shape (ADR 0092). Built
 * from the merged alias map rather than this module's own `SType`s, so a dep's
 * alias counts too: `crossModuleTypeImports` derives `import type` lines from
 * the emitted TEXT, so naming one here is exactly what makes its import appear.
 *
 * Nullary only — a parameterised alias would have to match a row up to
 * substitution.
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
    match(_Map_get(key, aliases))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: info }) =>
        match(info.expr)
          .with({ _tag: "Some" }, () => acc)
          .with({ _tag: "None" }, () =>
            or(not(eq(length(info.params), 0)), eq(length(info.fields), 0))
              ? acc
              : match(aliasShapeKey(info.fields, aliases))
                  .with({ _tag: "Some" }, ({ value: k }) => _Map_set(k, name, acc))
                  .with({ _tag: "None" }, () => acc)
                  .exhaustive(),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const recordAliasIndexFrom: _Curry<
  [keys: string[], aliases: Map<string, AliasInfo>, i: number, acc: Map<string, string>],
  Map<string, string>
> = _curry(
  4,
  (keys: string[], aliases: Map<string, AliasInfo>, i: number, acc: Map<string, string>) =>
    match(_Array_get(i, keys))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: key }) =>
        recordAliasIndexFrom(keys, aliases, i + 1, indexAlias(key, bareName(key), aliases, acc)),
      )
      .exhaustive(),
);
export const recordAliasIndex: (aliases: Map<string, AliasInfo>) => Map<string, string> = (
  aliases: Map<string, AliasInfo>,
) => recordAliasIndexFrom(_Array_sort(_Map_keys(aliases)), aliases, 0, new Map<string, string>());
/**
 * The index an alias's OWN body renders against — itself removed, so it cannot
 * come out as `export type Span = Span;`.
 */
export const withoutOwnShape: <A, B>(
  fields: QualAliasField[],
  params: A[],
  aliases: Map<string, AliasInfo>,
  recs: Map<string, B>,
) => Map<string, B> = _curry(
  4,
  <A, B>(
    fields: QualAliasField[],
    params: A[],
    aliases: Map<string, AliasInfo>,
    recs: Map<string, B>,
  ) =>
    match(_Array_get(0, params))
      .with({ _tag: "Some" }, () => recs)
      .with({ _tag: "None" }, () =>
        match(aliasShapeKey(fields, aliases))
          .with({ _tag: "Some" }, ({ value: k }) => _Map_delete(k, recs))
          .with({ _tag: "None" }, () => recs)
          .exhaustive(),
      )
      .exhaustive(),
);
const typeHeaderFrom: _Curry<
  [stmts: Stmt[], aliases: Map<string, AliasInfo>, recs: Map<string, string>, i: number],
  string[]
> = _curry(
  4,
  (stmts: Stmt[], aliases: Map<string, AliasInfo>, recs: Map<string, string>, i: number) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => [] as string[])
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SType" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SType";
        },
        ({ value: { name, params, ctors, alias, aliasType, doc } }) =>
          ((rest: string[]) =>
            ((docComment: string) =>
              match(alias)
                .with({ _tag: "Some" }, ({ value: fields }) =>
                  _Array_prepend(
                    `${docComment}${recordAliasDecl(name, params, fields, aliases, withoutOwnShape(fields, params, aliases, recs))}`,
                    rest,
                  ),
                )
                .with({ _tag: "None" }, () =>
                  match(aliasType)
                    .with({ _tag: "Some" }, ({ value: te }) =>
                      _Array_prepend(
                        `${docComment}${aliasTsDecl(name, params, te, aliases, recs)}`,
                        rest,
                      ),
                    )
                    .with({ _tag: "None" }, () =>
                      eq(length(ctors), 0)
                        ? _Array_prepend(
                            `declare const ${name}: unique symbol;
${docComment}type ${name} = { readonly [${name}]: never };`,
                            rest,
                          )
                        : _Array_prepend(
                            `${docComment}${typeDecl(name, params, ctors, aliases, recs)}`,
                            rest,
                          ),
                    )
                    .exhaustive(),
                )
                .exhaustive())(jsDoc(doc)))(typeHeaderFrom(stmts, aliases, recs, i + 1)),
      )
      .with({ _tag: "Some" }, () => typeHeaderFrom(stmts, aliases, recs, i + 1))
      .exhaustive(),
);
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
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => acc)
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SLet";
        },
        ({ value: { name, value } }) =>
          genericLambdasFrom(
            stmts,
            env,
            i + 1,
            match(value)
              .with(
                (_v): _v is Extract<Expr, { _tag: "ELambda" }> => {
                  const _g: any = _v;
                  return (
                    _g._tag === "ELambda" && (({ span: sp }) => not(_Str_startsWith("$", name)))(_g)
                  );
                },
                ({ span: sp }) =>
                  match(_Map_get(name, env))
                    .with({ _tag: "Some" }, ({ value: sc }) =>
                      or(length(sc.vars) > 0, length(sc.rvars) > 0)
                        ? _Map_set(spanKey(sp), sc, acc)
                        : acc,
                    )
                    .with({ _tag: "None" }, () => acc)
                    .exhaustive(),
              )
              .otherwise(() => acc),
          ),
      )
      .with({ _tag: "Some" }, () => genericLambdasFrom(stmts, env, i + 1, acc))
      .exhaustive(),
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
const scopedSpans: (e: Expr) => SpanAt[] = (e: Expr) =>
  match(e)
    .with({ _tag: "ELambda" }, ({ body, span: sp }) => _Array_prepend(sp, scopedSpans(body)))
    .with({ _tag: "ECall" }, ({ fn, args }) =>
      _Array_concat(scopedSpans(fn), scopedSpansAt(args, 0)),
    )
    .with({ _tag: "ELetIn" }, ({ value, body }) =>
      _Array_concat(scopedSpans(value), scopedSpans(body)),
    )
    .with({ _tag: "ELetBind" }, ({ value, body }) =>
      _Array_concat(scopedSpans(value), scopedSpans(body)),
    )
    .with({ _tag: "EPipe" }, ({ left, right }) =>
      _Array_concat(scopedSpans(left), scopedSpans(right)),
    )
    .with({ _tag: "EDo" }, ({ exprs }) => scopedSpansAt(exprs, 0))
    .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
      _Array_concat(scopedSpans(cond), _Array_concat(scopedSpans(thenE), scopedSpans(elseE))),
    )
    .with({ _tag: "EMatch" }, ({ scrutinee, arms }) =>
      _Array_concat(scopedSpans(scrutinee), scopedSpansInArms(arms, 0)),
    )
    .with({ _tag: "ERecord" }, ({ fields, spread }) =>
      _Array_concat(
        scopedSpansInFields(fields, 0),
        match(spread)
          .with({ _tag: "Some" }, ({ value: s }) => scopedSpans(s))
          .with({ _tag: "None" }, () => [] as SpanAt[])
          .exhaustive(),
      ),
    )
    .with({ _tag: "EField" }, ({ target, name, span: sp }) =>
      ((rest: SpanAt[]) =>
        and(eq(name, "empty"), isRefExpr(target)) ? _Array_prepend(sp, rest) : rest)(
        scopedSpans(target),
      ),
    )
    .with({ _tag: "ETuple" }, ({ elements }) => scopedSpansAt(elements, 0))
    .with({ _tag: "EArr" }, ({ elements, span: sp }) => scopedSpansInSeq(elements, sp))
    .with({ _tag: "EList" }, ({ elements, span: sp }) => scopedSpansInSeq(elements, sp))
    .with({ _tag: "ESet" }, ({ elements, span: sp }) => scopedSpansInSeq(elements, sp))
    .with({ _tag: "EMap" }, ({ entries, span: sp }) =>
      ((inner: SpanAt[]) => (eq(length(entries), 0) ? _Array_prepend(sp, inner) : inner))(
        scopedSpansInEntries(entries, 0),
      ),
    )
    .with({ _tag: "ELoop" }, ({ params, body }) =>
      _Array_concat(scopedSpansInLoop(params, 0), scopedSpans(body)),
    )
    .with({ _tag: "ERecur" }, ({ args }) => scopedSpansAt(args, 0))
    .with({ _tag: "EInterp" }, ({ parts }) => scopedSpansInParts(parts, 0))
    .otherwise(() => [] as SpanAt[]);
const isRefExpr: (e: Expr) => boolean = (e: Expr) =>
  match(e)
    .with({ _tag: "ERef" }, () => true)
    .otherwise(() => false);
const scopedSpansAt: _Curry<[exprs: Expr[], i: number], SpanAt[]> = _curry(
  2,
  (exprs: Expr[], i: number) =>
    match(_Array_get(i, exprs))
      .with({ _tag: "None" }, () => [] as SpanAt[])
      .with({ _tag: "Some" }, ({ value: e }) =>
        _Array_concat(scopedSpans(e), scopedSpansAt(exprs, i + 1)),
      )
      .exhaustive(),
);
const scopedSpansInArms: _Curry<[arms: MatchArm[], i: number], SpanAt[]> = _curry(
  2,
  (arms: MatchArm[], i: number) =>
    match(_Array_get(i, arms))
      .with({ _tag: "None" }, () => [] as SpanAt[])
      .with({ _tag: "Some" }, ({ value: a }) =>
        _Array_concat(
          match(a.guard)
            .with({ _tag: "Some" }, ({ value: g }) => scopedSpans(g))
            .with({ _tag: "None" }, () => [] as SpanAt[])
            .exhaustive(),
          _Array_concat(scopedSpans(a.body), scopedSpansInArms(arms, i + 1)),
        ),
      )
      .exhaustive(),
);
const scopedSpansInFields: _Curry<[fields: Field[], i: number], SpanAt[]> = _curry(
  2,
  (fields: Field[], i: number) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as SpanAt[])
      .with({ _tag: "Some" }, ({ value: f }) =>
        _Array_concat(scopedSpans(f.value), scopedSpansInFields(fields, i + 1)),
      )
      .exhaustive(),
);
const scopedSpansInEntries: _Curry<[entries: MapEntry[], i: number], SpanAt[]> = _curry(
  2,
  (entries: MapEntry[], i: number) =>
    match(_Array_get(i, entries))
      .with({ _tag: "None" }, () => [] as SpanAt[])
      .with({ _tag: "Some" }, ({ value: en }) =>
        _Array_concat(
          scopedSpans(en.key),
          _Array_concat(scopedSpans(en.value), scopedSpansInEntries(entries, i + 1)),
        ),
      )
      .exhaustive(),
);
const scopedSpansInElems: _Curry<[elements: SeqElem[], i: number], SpanAt[]> = _curry(
  2,
  (elements: SeqElem[], i: number) =>
    match(_Array_get(i, elements))
      .with({ _tag: "None" }, () => [] as SpanAt[])
      .with(
        (
          _v,
        ): _v is Extract<Option<SeqElem>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<SeqElem>, { _tag: "Some" }>["value"], { _tag: "SEExpr" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SEExpr";
        },
        ({ value: { expr: e } }) =>
          _Array_concat(scopedSpans(e), scopedSpansInElems(elements, i + 1)),
      )
      .with(
        (
          _v,
        ): _v is Extract<Option<SeqElem>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<SeqElem>, { _tag: "Some" }>["value"], { _tag: "SESpread" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SESpread";
        },
        ({ value: { expr: e } }) =>
          _Array_concat(scopedSpans(e), scopedSpansInElems(elements, i + 1)),
      )
      .exhaustive(),
);
/**
 * An EMPTY `[]` / `@{}` / `#{}` is itself annotatable; a populated one only
 * carries its elements' nested nodes.
 */
const scopedSpansInSeq: _Curry<[elements: SeqElem[], sp: SpanAt], SpanAt[]> = _curry(
  2,
  (elements: SeqElem[], sp: SpanAt) => {
    const inner: SpanAt[] = scopedSpansInElems(elements, 0);
    return eq(length(elements), 0) ? _Array_prepend(sp, inner) : inner;
  },
);
const scopedSpansInLoop: _Curry<[params: LoopParam[], i: number], SpanAt[]> = _curry(
  2,
  (params: LoopParam[], i: number) =>
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => [] as SpanAt[])
      .with({ _tag: "Some" }, ({ value: p }) =>
        _Array_concat(scopedSpans(p.init), scopedSpansInLoop(params, i + 1)),
      )
      .exhaustive(),
);
const scopedSpansInParts: _Curry<[parts: InterpPart[], i: number], SpanAt[]> = _curry(
  2,
  (parts: InterpPart[], i: number) =>
    match(_Array_get(i, parts))
      .with({ _tag: "None" }, () => [] as SpanAt[])
      .with(
        (
          _v,
        ): _v is Extract<Option<InterpPart>, { _tag: "Some" }> & {
          value: Extract<
            Extract<Option<InterpPart>, { _tag: "Some" }>["value"],
            { _tag: "IPExpr" }
          >;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "IPExpr";
        },
        ({ value: { expr: e } }) => _Array_concat(scopedSpans(e), scopedSpansInParts(parts, i + 1)),
      )
      .with({ _tag: "Some" }, () => scopedSpansInParts(parts, i + 1))
      .exhaustive(),
);
const scopedNamesAt: <A, B, C, D>(
  spans: ({ start: A; end: B } & D)[],
  i: number,
  names: C,
  acc: Map<string, C>,
) => Map<string, C> = _curry(
  4,
  <A, B, C, D>(spans: ({ start: A; end: B } & D)[], i: number, names: C, acc: Map<string, C>) =>
    match(_Array_get(i, spans))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: sp }) =>
        scopedNamesAt(spans, i + 1, names, _Map_set(spanKey(sp), names, acc)),
      )
      .exhaustive(),
);
/**
 * Each annotatable node nested in a GENERIC binding's value body -> that
 * binding's letter map (ADR 0042). Scoped PER binding, never a global union:
 * letters are positional, so the same var id can be `A` under one scheme and
 * `C` under another, and a nested node must use exactly the assignment of the
 * head it renders under.
 */
const scopedNamesFrom: <A, B>(
  stmts: Stmt[],
  env: Map<string, { vars: A[]; rvars: A[] } & B>,
  i: number,
  acc: Map<string, Map<A, string>>,
) => Map<string, Map<A, string>> = _curry(
  4,
  <A, B>(
    stmts: Stmt[],
    env: Map<string, { vars: A[]; rvars: A[] } & B>,
    i: number,
    acc: Map<string, Map<A, string>>,
  ) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => acc)
      .with(
        (
          _v,
        ): _v is Extract<Option<Stmt>, { _tag: "Some" }> & {
          value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
        } => {
          const _g: any = _v;
          return _g._tag === "Some" && _g.value._tag === "SLet";
        },
        ({ value: { name, value } }) =>
          scopedNamesFrom(
            stmts,
            env,
            i + 1,
            match(value)
              .with(
                (_v): _v is Extract<Expr, { _tag: "ELambda" }> => {
                  const _g: any = _v;
                  return _g._tag === "ELambda" && not(_Str_startsWith("$", name));
                },
                () =>
                  match(_Map_get(name, env))
                    .with({ _tag: "Some" }, ({ value: sc }) =>
                      or(length(sc.vars) > 0, length(sc.rvars) > 0)
                        ? scopedNamesAt(scopedSpans(value), 0, unionGenericNames([sc]), acc)
                        : acc,
                    )
                    .with({ _tag: "None" }, () => acc)
                    .exhaustive(),
              )
              .otherwise(() => acc),
          ),
      )
      .with({ _tag: "Some" }, () => scopedNamesFrom(stmts, env, i + 1, acc))
      .exhaustive(),
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
) => GenOpts = _curry(
  5,
  <A, B, C, D, E, F, G, H, I>(
    stmts: Stmt[],
    env: Map<string, { vars: number[]; rvars: number[]; ty: Ty } & E>,
    types: ({ span: { start: A; end: B } & F; ty: Ty } & G)[],
    letParams: ({ span: { start: C; end: D } & H; ty: Ty } & I)[],
    aliases: Map<string, AliasInfo>,
  ) => {
    const typeAt: Map<string, Ty> = typeAtTable(types);
    const letParamAt: Map<string, Ty> = typeAtTable(letParams);
    const genericLams = genericLambdasFrom(
      stmts,
      env,
      0,
      new Map<string, { vars: number[]; rvars: number[]; ty: Ty } & E>(),
    );
    const scopedNames: Map<string, Map<number, string>> = scopedNamesFrom(
      stmts,
      env,
      0,
      new Map<string, Map<number, string>>(),
    );
    const recs: Map<string, string> = recordAliasIndex(aliases);
    const typeOf: (a: Expr) => Option<Ty> = (e: Expr) => _Map_get(spanKey(exprSpan(e)), typeAt);
    const envAt: (a: string) => TsEnv = (key: string) =>
      match(_Map_get(key, scopedNames))
        .with({ _tag: "Some" }, ({ value: vars }) => tsEnv(vars, recs))
        .with({ _tag: "None" }, () => recsEnv(recs))
        .exhaustive();
    return {
      ...jsGenOpts,
      annotateLet: Some(
        _curry(2, (name: string, value: Expr) =>
          _Str_startsWith("$", name)
            ? (None as Option<string>)
            : match(value)
                .with({ _tag: "ELambda" }, () =>
                  match(_Map_get(name, env))
                    .with(
                      { _tag: "Some" },
                      ({ value: sc }) =>
                        Some(`: ${bindingTsType(sc, value, recs)}`) as Option<string>,
                    )
                    .with({ _tag: "None" }, () => None as Option<string>)
                    .exhaustive(),
                )
                .otherwise(() =>
                  _Option_map(
                    (ts: string) => `: ${ts}`,
                    _Option_flatMap(
                      (t: Ty) => emptyCollTs(t, recsEnv(recs)),
                      _Map_get(spanKey(exprSpan(value)), letParamAt),
                    ),
                  ),
                ),
        ),
      ) as Option<(a: string, b: Expr) => Option<string>>,
      annotateCtor: Some(
        _curry(2, (s: Stmt, c: CtorLike) =>
          match(s)
            .with(
              { _tag: "SType" },
              ({ name, params }) =>
                Some(ctorFactoryTs(name, params, c, aliases, recs)) as Option<CtorFactoryTs>,
            )
            .otherwise(() => None as Option<CtorFactoryTs>),
        ),
      ) as Option<(a: Stmt, b: CtorLike) => Option<CtorFactoryTs>>,
      annotateParams: Some(
        _curry(2, (sp: SpanAt, arity: number) =>
          match(_Map_get(spanKey(sp), genericLams))
            .with({ _tag: "Some" }, ({ value: sc }) =>
              _Option_unwrapOr(
                { generics: "", params: [] as Option<string>[] },
                genericLambdaParams(sc, arity, recs),
              ),
            )
            .with({ _tag: "None" }, () => ({
              generics: "",
              params: match(_Map_get(spanKey(sp), typeAt))
                .with({ _tag: "Some" }, ({ value: t }) =>
                  lambdaParamTypesTs(t, arity, envAt(spanKey(sp))),
                )
                .with({ _tag: "None" }, () => [] as Option<string>[])
                .exhaustive(),
            }))
            .exhaustive(),
        ),
      ) as Option<(a: SpanAt, b: number) => ParamAnnots>,
      annotateEmpty: Some((e: Expr) => {
        const key: string = spanKey(exprSpan(e));
        return _Option_flatMap((t: Ty) => emptyCollTs(t, envAt(key)), _Map_get(key, typeAt));
      }) as Option<(a: Expr) => Option<string>>,
      annotateLetin: Some((value: Expr) =>
        _Option_flatMap(
          (t: Ty) => emptyCollTs(t, recsEnv(recs)),
          _Map_get(spanKey(exprSpan(value)), letParamAt),
        ),
      ) as Option<(a: Expr) => Option<string>>,
      annotateCall: Some((e: Expr) =>
        _Option_flatMap((t: Ty) => ctorCallTs(t, recs), typeOf(e)),
      ) as Option<(a: Expr) => Option<string>>,
      guardBaseType: Some((e: Expr) =>
        _Option_flatMap((t: Ty) => guardParamTs(t, recs), typeOf(e)),
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
  match(e)
    .with(
      (
        _v,
      ): _v is Extract<Expr, { _tag: "ECall" }> & {
        origin: Extract<Extract<Expr, { _tag: "ECall" }>["origin"], { _tag: "Some" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "ECall" && _g.origin._tag === "Some" && _g.origin.value === "jsx";
      },
      () => true,
    )
    .with({ _tag: "ECall" }, ({ fn, args }) => or(hasJsxExpr(fn), anyOf(hasJsxExpr, args)))
    .with({ _tag: "ELambda" }, ({ body }) => hasJsxExpr(body))
    .with({ _tag: "ELetIn" }, ({ value, body }) => or(hasJsxExpr(value), hasJsxExpr(body)))
    .with({ _tag: "ELetBind" }, ({ value, body }) => or(hasJsxExpr(value), hasJsxExpr(body)))
    .with({ _tag: "EPipe" }, ({ left, right }) => or(hasJsxExpr(left), hasJsxExpr(right)))
    .with({ _tag: "EDo" }, ({ exprs }) => anyOf(hasJsxExpr, exprs))
    .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
      or(or(hasJsxExpr(cond), hasJsxExpr(thenE)), hasJsxExpr(elseE)),
    )
    .with({ _tag: "EMatch" }, ({ scrutinee, arms }) =>
      or(
        hasJsxExpr(scrutinee),
        anyOf(
          (a: MatchArm) =>
            or(
              match(a.guard)
                .with({ _tag: "Some" }, ({ value: g }) => hasJsxExpr(g))
                .with({ _tag: "None" }, () => false)
                .exhaustive(),
              hasJsxExpr(a.body),
            ),
          arms,
        ),
      ),
    )
    .with({ _tag: "ERecord" }, ({ fields, spread }) =>
      or(
        anyOf((f: Field) => hasJsxExpr(f.value), fields),
        match(spread)
          .with({ _tag: "Some" }, ({ value }) => hasJsxExpr(value))
          .with({ _tag: "None" }, () => false)
          .exhaustive(),
      ),
    )
    .with({ _tag: "EField" }, ({ target }) => hasJsxExpr(target))
    .with({ _tag: "ETuple" }, ({ elements }) => anyOf(hasJsxExpr, elements))
    .with({ _tag: "EArr" }, ({ elements }) =>
      anyOf(
        (el: SeqElem) =>
          match(el)
            .with({ _tag: "SEExpr" }, ({ expr: value }) => hasJsxExpr(value))
            .with({ _tag: "SESpread" }, ({ expr: value }) => hasJsxExpr(value))
            .exhaustive(),
        elements,
      ),
    )
    .with({ _tag: "EList" }, ({ elements }) =>
      anyOf(
        (el: SeqElem) =>
          match(el)
            .with({ _tag: "SEExpr" }, ({ expr: value }) => hasJsxExpr(value))
            .with({ _tag: "SESpread" }, ({ expr: value }) => hasJsxExpr(value))
            .exhaustive(),
        elements,
      ),
    )
    .with({ _tag: "ESet" }, ({ elements }) =>
      anyOf(
        (el: SeqElem) =>
          match(el)
            .with({ _tag: "SEExpr" }, ({ expr: value }) => hasJsxExpr(value))
            .with({ _tag: "SESpread" }, ({ expr: value }) => hasJsxExpr(value))
            .exhaustive(),
        elements,
      ),
    )
    .with({ _tag: "EMap" }, ({ entries }) =>
      anyOf((entry: MapEntry) => or(hasJsxExpr(entry.key), hasJsxExpr(entry.value)), entries),
    )
    .with({ _tag: "ELoop" }, ({ params, body }) =>
      or(
        anyOf((p: LoopParam) => hasJsxExpr(p.init), params),
        hasJsxExpr(body),
      ),
    )
    .with({ _tag: "ERecur" }, ({ args }) => anyOf(hasJsxExpr, args))
    .with({ _tag: "EInterp" }, ({ parts }) =>
      anyOf(
        (part: InterpPart) =>
          match(part)
            .with({ _tag: "IPLit" }, () => false)
            .with({ _tag: "IPExpr" }, ({ expr: value }) => hasJsxExpr(value))
            .exhaustive(),
        parts,
      ),
    )
    .otherwise(() => false);
const hasJsxStmts: (stmts: Stmt[]) => boolean = (stmts: Stmt[]) =>
  anyOf(
    (stmt: Stmt) =>
      match(stmt)
        .with({ _tag: "SLet" }, ({ value }) => hasJsxExpr(value))
        .with({ _tag: "SExpr" }, ({ value }) => hasJsxExpr(value))
        .otherwise(() => false),
    stmts,
  );
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
  ) => {
    const declared: Set<string> = declaredTypeNames(stmts, 0, _Set_fromArray([] as string[]));
    const wanted: Set<string> = referencedCons(stmts, env, 0, _Set_fromArray([] as string[]));
    const recs: Map<string, string> = recordAliasIndex(aliases);
    const typeHeader: string[] = typeHeaderFrom(stmts, aliases, recs, 0);
    const body: string = codegenWith(
      stmts,
      imported,
      false,
      ns,
      jsDefs,
      runtimeDeps,
      tsGenOpts(stmts, env, types, letParams, aliases),
    );
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
                    (part: string) => not(eq(part, "")),
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
              eq(length(typeDeps), 0)
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
              builtinTypeNamesFor(declared, wanted, body, 0),
            ),
          ))(typeHeader))(
        eq(length(deps), 0)
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
                      and(and(not(eq(d, "add")), not(eq(d, "sub"))), not(eq(d, "mul"))),
                      not(eq(d, "div")),
                    ),
                    not(eq(d, "lt")),
                  ),
                  not(eq(d, "lte")),
                ),
                not(eq(d, "gt")),
              ),
              not(eq(d, "gte")),
            ),
            _Str_contains(d, body),
          ),
        deps,
      ),
    );
  },
);
/**
 * Free TYPE vars in FIRST-OCCURRENCE order. Not `freeInType`: its Sets lose the
 * order letters are assigned in, and it also collects row vars, which a bare
 * type has no head to bind — a record's trailing row var is skipped here and
 * the declaration prints the closed body.
 */
const freeIdsIn: _Curry<[t: Ty, acc: number[]], number[]> = _curry(2, (t: Ty, acc: number[]) =>
  match(t)
    .with({ _tag: "TyVar" }, ({ id }) => (_Array_contains(id, acc) ? acc : _Array_append(id, acc)))
    .with({ _tag: "TyCon" }, ({ args }) => freeIdsInAll(args, acc))
    .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => freeIdsIn(toT, freeIdsIn(fromT, acc)))
    .with({ _tag: "TyRecord" }, ({ row }) => freeIdsInRow(row, acc))
    .with({ _tag: "TySingleton" }, () => acc)
    .with({ _tag: "TyOneOf" }, ({ members }) => freeIdsInAll(members, acc))
    .exhaustive(),
);
const freeIdsInAll: _Curry<[ts: Ty[], acc: number[]], number[]> = _curry(
  2,
  (ts: Ty[], acc: number[]) =>
    reduce(
      _curry(2, (a: number[], t: Ty) => freeIdsIn(t, a)),
      acc,
      ts,
    ),
);
const freeIdsInRow: _Curry<[row: Row, acc: number[]], number[]> = _curry(
  2,
  (row: Row, acc: number[]) =>
    match(row)
      .with({ _tag: "RowExtend" }, ({ fieldType, rest }) =>
        freeIdsInRow(rest, freeIdsIn(fieldType, acc)),
      )
      .otherwise(() => acc),
);
/**
 * id -> letter, positionally. Accumulator-first so `Map.values` comes back in
 * index order — the generic head and the rendered params must agree.
 */
const lettersFor: <A>(ids: A[], i: number, acc: Map<A, string>) => Map<A, string> = _curry(
  3,
  <A>(ids: A[], i: number, acc: Map<A, string>) =>
    match(_Array_get(i, ids))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: id }) =>
        lettersFor(ids, i + 1, _Map_set(id, letterAt(i), acc)),
      )
      .exhaustive(),
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
    eq(length(ids), 0) ? "" : `<${_Str_join(", ", _Map_values(names))}>`,
);
/**
 * Arrows on the spine — the extern's declared arity.
 */
const arrowCount: (t: Ty) => number = (t: Ty) =>
  match(t)
    .with({ _tag: "TyFn" }, ({ to: toT }) => 1 + arrowCount(toT))
    .otherwise(() => 0);
/**
 * Peel `arity` arrows into `a: T`, `b: T`, … — the same positional naming
 * `tsArrow` uses, so a declaration and a call site read alike.
 */
const hostParams: _Curry<[t: Ty, arity: number, names: Map<number, string>, i: number], string[]> =
  _curry(4, (t: Ty, arity: number, names: Map<number, string>, i: number) =>
    i >= arity
      ? ([] as string[])
      : match(t)
          .with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) =>
            _Array_prepend(
              `${_Str_fromCode(97 + i)}: ${tsOf(fromT, plainEnv(names))}`,
              hostParams(toT, arity, names, i + 1),
            ),
          )
          .otherwise(() => [] as string[]),
  );
const hostReturn: _Curry<[t: Ty, arity: number, i: number], Ty> = _curry(
  3,
  (t: Ty, arity: number, i: number) =>
    i >= arity
      ? t
      : match(t)
          .with({ _tag: "TyFn" }, ({ to: toT }) => hostReturn(toT, arity, i + 1))
          .otherwise(() => t),
);
/**
 * `(a: A) => (b: B) => R` — a CURRIED host's own shape (ADR 0064). Unlike
 * `flatHostType` there are no partial-application overloads to offer: `_curry`
 * is built AROUND this host, not exported by it, so it takes exactly one
 * argument per call. Folded right-to-left, hence the reverse.
 */
const curriedHostType: _Curry<[t: Ty, arity: number], string> = _curry(
  2,
  (t: Ty, arity: number) => {
    const ids: number[] = freeIdsIn(t, [] as number[]);
    const names: Map<number, string> = lettersFor(ids, 0, new Map<number, string>());
    return `${genericHeadOf(ids, names)}${reduce(
      _curry(2, (acc: string, p: string) => `(${p}) => ${acc}`),
      tsOf(hostReturn(t, arity, 0), plainEnv(names)),
      _Array_reverse(hostParams(t, arity, names, 0)),
    )}`;
  },
);
/**
 * An UNCURRIED function host gets the same overloaded signature a runtime
 * builtin does, so both `f(a)(b)` and `f(a, b)` call sites resolve (ADR 0037).
 */
const flatHostType: _Curry<[t: Ty, arity: number], string> = _curry(2, (t: Ty, arity: number) => {
  const ids: number[] = freeIdsIn(t, [] as number[]);
  const names: Map<number, string> = lettersFor(ids, 0, new Map<number, string>());
  const head: string = genericHeadOf(ids, names);
  return eq(arity, 0)
    ? `${head}${tsOf(t, plainEnv(names))}`
    : curriedOverloads(
        head,
        hostParams(t, arity, names, 0),
        tsOf(hostReturn(t, arity, 0), plainEnv(names)),
      );
});
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
    ? `export declare const ${e.imported}: ${curriedHostType(t, n)};`
    : eq(n, 0)
      ? `export declare const ${e.imported}: ${tsOf(t, plainEnv(anyFor(freeIdsIn(t, [] as number[]))))};`
      : `export declare const ${e.imported}: ${flatHostType(t, n)};`;
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
          consInTy(e.scheme.ty, acc),
      ),
      _Set_fromArray([] as string[]),
      externs,
    );
    return concat(
      _Str_join(
        "\n",
        _Array_concat(
          map(
            (bt: { name: string; params: string[]; ctors: CtorLike[] }) =>
              typeDecl(bt.name, bt.params, bt.ctors, aliases, new Map<string, string>()),
            filter(
              (bt: { name: string; params: string[]; ctors: CtorLike[] }) =>
                _Set_has(bt.name, wanted),
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
