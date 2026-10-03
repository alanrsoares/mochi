import type { Tok } from "../lexer/lexer";
import type {
  AliasField,
  CtorField,
  Expr,
  Field,
  InterpPart,
  LamParam,
  LoopParam,
  MapEntry,
  MatchArm,
  PatField,
  Pattern,
  SeqElem,
  Stmt,
  TypeExpr,
} from "../ast/ast";
import type { Row, SpanAt, St, Ty, TypeAt } from "./types";
import type { Doc } from "../doc/doc";
import type { FormatApi } from "../format/format-api";
import type { Scheme, VarSets } from "./schemes";
import type { PErr } from "../parser/parser";
import type { TSt } from "./scc";

export type Suggestion = { title: string; start: number; end: number; replaceWith: string };
export type IErr = {
  message: string;
  start: number;
  end: number;
  help: Option<string>;
  suggestions: Suggestion[];
};
/**
 * A group member that failed to type: its diagnostic, and the state the rest
 * of the group resumes from. src/infer.ts mutates its substitution in place,
 * so whatever a member solved before failing stays solved; carrying the
 * state back is the same thing, done functionally.
 */
export type MemberErr = { err: IErr; st: St };
export type QualAliasField = {
  name: string;
  nameSpan: SpanAt;
  fieldType: TypeExpr;
  optional: boolean;
};
export type QualAliasInfo = { params: string[]; fields: AliasField[]; expr: Option<TypeExpr> };
export type QualScope = { aliases: Map<string, QualAliasInfo> };
/**
 * The API an `inferCall` plugin hook is handed (ADR 0011 6).
 */
export type InferApi = {
  inferExpr: (a: Expr, b: St) => Result<[Ty, St], IErr>;
  unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, IErr>;
};
/**
 * A located token as the PARSE hook sees it. Inference never inspects one, so
 * `tok` stays a type parameter — that keeps the record nameable here without
 * importing parser.mochi (which declares the real `Tok`) just to spell it.
 * Structural, so it still unifies with the parser's own `LocTok`.
 */
export type LocTok<A> = { tok: A; start: number; end: number; doc: Option<string> };
/**
 * Parse-hook failure. Not `IErr`: parse has no help or suggestions, and an
 * inline record is not a legal type argument here.
 */
export type HookErr = { message: string; start: number; end: number };
/**
 * What a `bindingType` hook renders with (ADR 0055): the TS text of a type,
 * and the record alias a closed row prints as, if the module declared one.
 */
export type TsApi = { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> };
/**
 * A plugin as every pass sees it (ADR 0011, 0109). `format` rewrites a node
 * before the printer lays it out; `formatDoc` lays a node out itself, for sugar
 * no node can spell (JSX, ADR 0112); `dtsBinding` supplies a binding's `.d.ts`
 * type text from its name, value, and inferred type. The parse hook is written INLINE rather than
 * behind its own alias: a parameterized alias whose body is an arrow emits as
 * an opaque brand, not a transparent type.
 */
export type Plugin<A> = {
  name: string;
  parse: Option<
    (
      a: { tok: A; start: number; end: number; doc: Option<string> }[],
      b: number,
      c: (
        a: { tok: A; start: number; end: number; doc: Option<string> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>
  >;
  inferCall: Option<
    (a: Expr, b: Expr[], c: Option<string>, d: St, e: InferApi) => Result<Option<[Ty, St]>, IErr>
  >;
  format: Option<(a: Expr) => Option<Expr>>;
  formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
  dtsBinding: Option<(a: string, b: Expr, c: Ty, d: TsApi) => Option<string>>;
  bindingType: Option<(a: Expr, b: Ty, c: TsApi) => Option<string>>;
};
/**
 * `Plugin` at the lexer's token type: the list a host hands the compile and
 * module drivers (ADR 0109). Spelled out rather than `Plugin<Lexer.Tok>`
 * because only a parameterless alias folds to its name in the TS backend.
 */
export type HostPlugin = {
  name: string;
  parse: Option<
    (
      a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>
  >;
  inferCall: Option<
    (a: Expr, b: Expr[], c: Option<string>, d: St, e: InferApi) => Result<Option<[Ty, St]>, IErr>
  >;
  format: Option<(a: Expr) => Option<Expr>>;
  formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
  dtsBinding: Option<(a: string, b: Expr, c: Ty, d: TsApi) => Option<string>>;
  bindingType: Option<(a: Expr, b: Ty, c: TsApi) => Option<string>>;
};
/**
 * The context threaded through Algorithm W. Declared and annotated at every
 * `ctx` parameter for the same reason scc.mochi pins `TSt` (ADR 0044): each
 * reader generalizes the record's open tail on its own, so the emitted TS
 * reprinted `{ ns: Map<string, Map<string, { ty; rvars; vars } & C>>; ... }`
 * once per function instead of naming it.
 */
export type Ctx<A> = {
  env: Map<string, Scheme>;
  open: boolean;
  ns: Map<string, Map<string, Scheme>>;
  aliasMap: Map<string, QualAliasInfo>;
  plugins: {
    name: string;
    parse: Option<
      (
        a: { tok: A; start: number; end: number; doc: Option<string> }[],
        b: number,
        c: (
          a: { tok: A; start: number; end: number; doc: Option<string> }[],
          b: number,
        ) => Result<[Expr, number], PErr>,
      ) => Result<Option<[Expr, number]>, PErr>
    >;
    inferCall: Option<
      (a: Expr, b: Expr[], c: Option<string>, d: St, e: InferApi) => Result<Option<[Ty, St]>, IErr>
    >;
    format: Option<(a: Expr) => Option<Expr>>;
    formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
    dtsBinding: Option<(a: string, b: Expr, c: Ty, d: TsApi) => Option<string>>;
    bindingType: Option<(a: Expr, b: Ty, c: TsApi) => Option<string>>;
  }[];
  loopStack: Ty[][];
  letOwner: Map<string, SpanAt>;
  localNames: Set<string>;
  scopeNames: string[];
};

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_append,
  _Array_concat,
  _Array_find,
  _Array_flatMap,
  _Array_get,
  _Array_head,
  _Array_prepend,
  _Map_delete,
  _Map_get,
  _Map_getOr,
  _Map_has,
  _Map_keys,
  _Map_set,
  _Option_map,
  _Option_match,
  _Option_unwrapOr,
  _Result_flatMap,
  _Result_map,
  _Result_match,
  _Set_add,
  _Set_fromArray,
  _Set_has,
  _Set_size,
  _Set_toArray,
  _Str_length,
  _Str_replace,
  _Str_split,
  _Str_startsWith,
  _curry,
  _done,
  _recur,
  _tuple,
  add,
  and,
  eq,
  length,
  map,
  not,
  or,
  reduce,
  sub,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import {
  TyVar,
  TyCon,
  TyFn,
  TyRecord,
  RowEmpty,
  RowVar,
  RowExtend,
  tCon,
  tArrow,
  tRecord,
  tTuple,
  tUnit,
  tLit,
  rVar,
  rExtend,
  rField,
  showType,
  mkSt,
  recordAt,
  recordBinder,
  noteLet,
  noteUse,
  freshVar,
  freshRowVar,
  resolve,
  zonk,
  recordedTypes,
  unify,
  fits,
} from "./types";
import * as Ast from "../ast/ast";
import * as Layout from "../doc/doc";
import * as Fmt from "../format/format-api";
import { localBinderNames } from "./local-names";
import { closestName } from "../errors/suggest";
import * as Types from "./types";
import * as Lexer from "../lexer/lexer";
const setLetBindMonad = _curry(2, ($receiver, $value) => ($receiver["monad"] = $value));
/**
 * Inference discovers that `p.field` reads an optional row field; preserve
 * that runtime fact on the AST so JS codegen wraps it as `Option<T>`.
 */
const setFieldOptional = _curry(2, ($receiver, $value) => ($receiver["optional"] = $value));
import {
  inferCallHooksOf,
  resolvePluginsDefault,
  runInferCallHooks,
} from "../extensions/extensions";
import { builtinDeclsFor } from "../ast/ctors";
import {
  mono,
  tNumber,
  tBool,
  tString,
  generalize,
  generalizeOver,
  instantiate,
  typeExprToType,
  ctorScheme,
  freeInType,
  widenLits,
} from "./schemes";
import * as Schemes from "./schemes";
import { stronglyConnected } from "./scc";
/**
 * Exported for the TS backend: hooks look node types up by span.
 */
export const exprSpan: (e: Expr) => SpanAt = (e: Expr) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      const { span: sp } = $match;
      return sp;
    }
    case "EUnit": {
      const { span: sp } = $match;
      return sp;
    }
    case "EBool": {
      const { span: sp } = $match;
      return sp;
    }
    case "EStr": {
      const { span: sp } = $match;
      return sp;
    }
    case "ERef": {
      const { span: sp } = $match;
      return sp;
    }
    case "ECall": {
      const { span: sp } = $match;
      return sp;
    }
    case "ELambda": {
      const { span: sp } = $match;
      return sp;
    }
    case "ELetIn": {
      const { span: sp } = $match;
      return sp;
    }
    case "ELetBind": {
      const { span: sp } = $match;
      return sp;
    }
    case "EPipe": {
      const { span: sp } = $match;
      return sp;
    }
    case "EDo": {
      const { span: sp } = $match;
      return sp;
    }
    case "ETernary": {
      const { span: sp } = $match;
      return sp;
    }
    case "EMatch": {
      const { span: sp } = $match;
      return sp;
    }
    case "ELoop": {
      const { span: sp } = $match;
      return sp;
    }
    case "ERecur": {
      const { span: sp } = $match;
      return sp;
    }
    case "ERecord": {
      const { span: sp } = $match;
      return sp;
    }
    case "EField": {
      const { span: sp } = $match;
      return sp;
    }
    case "ETuple": {
      const { span: sp } = $match;
      return sp;
    }
    case "EArr": {
      const { span: sp } = $match;
      return sp;
    }
    case "EList": {
      const { span: sp } = $match;
      return sp;
    }
    case "ESet": {
      const { span: sp } = $match;
      return sp;
    }
    case "EMap": {
      const { span: sp } = $match;
      return sp;
    }
    case "EInterp": {
      const { span: sp } = $match;
      return sp;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
export const patSpan: (p: Pattern) => SpanAt = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PWild": {
      const { span: sp } = $match;
      return sp;
    }
    case "PUnit": {
      const { span: sp } = $match;
      return sp;
    }
    case "PBind": {
      const { span: sp } = $match;
      return sp;
    }
    case "PAs": {
      const { span: sp } = $match;
      return sp;
    }
    case "PLit": {
      const { span: sp } = $match;
      return sp;
    }
    case "PBool": {
      const { span: sp } = $match;
      return sp;
    }
    case "PStr": {
      const { span: sp } = $match;
      return sp;
    }
    case "PTuple": {
      const { span: sp } = $match;
      return sp;
    }
    case "PRecord": {
      const { span: sp } = $match;
      return sp;
    }
    case "PCtor": {
      const { span: sp } = $match;
      return sp;
    }
    case "PArr": {
      const { span: sp } = $match;
      return sp;
    }
    case "PList": {
      const { span: sp } = $match;
      return sp;
    }
    case "POr": {
      const { span: sp } = $match;
      return sp;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};

const noSuggestions: Suggestion[] = [] as Suggestion[];

const noErrs: IErr[] = [] as IErr[];
const annotSpan: (t: TypeExpr) => SpanAt = (t: TypeExpr) => {
  const $match = t;
  switch ($match._tag) {
    case "TyName": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyArrow": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyApp": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyTuple": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyList": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyQual": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyLit": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyUnion": {
      const { span: sp } = $match;
      return sp;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const typeErr: _Curry<[msg: string, sp: SpanAt], IErr> = _curry(2, (msg: string, sp: SpanAt) => ({
  message: msg,
  start: sp.start,
  end: sp.end,
  help: None as Option<string>,
  suggestions: noSuggestions,
}));
const typeErrHelp: _Curry<[msg: string, sp: SpanAt, help: string], IErr> = _curry(
  3,
  (msg: string, sp: SpanAt, help: string) => ({
    message: msg,
    start: sp.start,
    end: sp.end,
    help: Some(help) as Option<string>,
    suggestions: noSuggestions,
  }),
);
const typeErrSuggest: _Curry<[msg: string, sp: SpanAt, help: string, hint: string], IErr> = _curry(
  4,
  (msg: string, sp: SpanAt, help: string, hint: string) => ({
    message: msg,
    start: sp.start,
    end: sp.end,
    help: Some(help) as Option<string>,
    suggestions: [
      { title: `Did you mean '${hint}'?`, start: sp.start, end: sp.end, replaceWith: hint },
    ],
  }),
);
const lastSeg: (name: string) => string = (name: string) => {
  const parts: string[] = _Str_split(".", name);
  return _Option_unwrapOr(name, _Array_get(length(parts) - 1, parts));
};
const aliasRowFrom: <A>(
  fields: ({ fieldType: TypeExpr; name: string; optional: boolean } & A)[],
  aliases: Map<string, QualAliasInfo>,
  i: number,
) => Row = _curry(
  3,
  <A>(
    fields: ({ fieldType: TypeExpr; name: string; optional: boolean } & A)[],
    aliases: Map<string, QualAliasInfo>,
    i: number,
  ) =>
    _Option_match(
      _Array_get(i, fields),
      () => RowEmpty as Row,
      (f) =>
        (([t, _vars, _st]: [Ty, Map<string, Ty>, St]) =>
          rField(f.name, t, aliasRowFrom(fields, aliases, i + 1), f.optional))(
          typeExprToType(
            f.fieldType,
            new Map<string, Ty>(),
            mkSt(0),
            aliases,
            _Set_fromArray([] as string[]),
          ),
        ),
    ),
);
const shownOfAlias: <A, B, C, D>(
  info: {
    params: A[];
    expr: Option<B>;
    fields: ({ fieldType: TypeExpr; name: string; optional: boolean } & C)[];
  } & D,
  aliases: Map<string, QualAliasInfo>,
) => Option<string> = _curry(
  2,
  <A, B, C, D>(
    info: {
      params: A[];
      expr: Option<B>;
      fields: ({ fieldType: TypeExpr; name: string; optional: boolean } & C)[];
    } & D,
    aliases: Map<string, QualAliasInfo>,
  ) =>
    length(info.params) !== 0
      ? (None as Option<string>)
      : _Option_match(
          info.expr,
          () =>
            length(info.fields) === 0
              ? (None as Option<string>)
              : (Some(showType(tRecord(aliasRowFrom(info.fields, aliases, 0)))) as Option<string>),
          () => None as Option<string>,
        ),
);
const longerPrint: <A, B>(p: { shown: string } & A, q: { shown: string } & B) => boolean = _curry(
  2,
  <A, B>(p: { shown: string } & A, q: { shown: string } & B) =>
    _Str_length(p.shown) >= _Str_length(q.shown),
);
const insertPrint: <A>(
  p: { shown: string } & A,
  xs: ({ shown: string } & A)[],
) => ({ shown: string } & A)[] = _curry(
  2,
  <A>(p: { shown: string } & A, xs: ({ shown: string } & A)[]) =>
    match(xs)
      .with(
        (_v) => _v.length === 0,
        () => [p],
      )
      .with(
        (_v) => _v.length >= 1,
        ([q, ...rest]) =>
          longerPrint(p, q) ? _Array_prepend(p, xs) : _Array_prepend(q, insertPrint(p, rest)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const printsFrom: _Curry<
  [
    keys: string[],
    aliases: Map<string, QualAliasInfo>,
    i: number,
    acc: { shown: string; name: string }[],
  ],
  { shown: string; name: string }[]
> = _curry(
  4,
  (
    keys: string[],
    aliases: Map<string, QualAliasInfo>,
    i: number,
    acc: { shown: string; name: string }[],
  ) =>
    _Option_match(
      _Array_get(i, keys),
      () => acc,
      (key) =>
        _Option_match(
          _Map_get(key, aliases),
          () => printsFrom(keys, aliases, i + 1, acc),
          (info) =>
            _Option_match(
              shownOfAlias(info, aliases),
              () => printsFrom(keys, aliases, i + 1, acc),
              (shown) =>
                printsFrom(
                  keys,
                  aliases,
                  i + 1,
                  insertPrint({ shown: shown, name: lastSeg(key) }, acc),
                ),
            ),
        ),
    ),
);
const applyPrints: <A>(
  msg: string,
  prints: ({ shown: string; name: string } & A)[],
  i: number,
) => string = _curry(
  3,
  <A>(msg: string, prints: ({ shown: string; name: string } & A)[], i: number) =>
    _Option_match(
      _Array_get(i, prints),
      () => msg,
      (p) => applyPrints(_Str_replace(p.shown, p.name, msg), prints, i + 1),
    ),
);
const nameAliases: _Curry<[msg: string, aliases: Map<string, QualAliasInfo>], string> = _curry(
  2,
  (msg: string, aliases: Map<string, QualAliasInfo>) =>
    applyPrints(
      msg,
      printsFrom(_Map_keys(aliases), aliases, 0, [] as { shown: string; name: string }[]),
      0,
    ),
);
const u: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    left: Ty,
    right: Ty,
    st: St,
    sp: SpanAt,
  ],
  Result<St, IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    left: Ty,
    right: Ty,
    st: St,
    sp: SpanAt,
  ) =>
    _Result_match(
      unify(left, right, st),
      (e) => Err(typeErr(nameAliases(e.message, ctx.aliasMap), sp)) as Result<St, IErr>,
      (newSt) => Ok(newSt) as Result<St, IErr>,
    ),
);
/**
 * `actual` may be used as `expected` (ADR 0098 optional fields).
 */
const checkFits: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    actual: Ty,
    expected: Ty,
    st: St,
    sp: SpanAt,
  ],
  Result<St, IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    actual: Ty,
    expected: Ty,
    st: St,
    sp: SpanAt,
  ) =>
    _Result_match(
      fits(actual, expected, st),
      (e) => Err(typeErr(nameAliases(e.message, ctx.aliasMap), sp)) as Result<St, IErr>,
      (newSt) => Ok(newSt) as Result<St, IErr>,
    ),
);
const bindParamNamesFrom: <A>(
  names: A[],
  env: Map<A, Scheme>,
  st: St,
) => [Ty[], Map<A, Scheme>, St] = _curry(3, <A>(names: A[], env: Map<A, Scheme>, st: St) =>
  match(names)
    .with(
      (_v) => _v.length === 0,
      () => _tuple([] as Ty[], env, st),
    )
    .with(
      (_v) => _v.length >= 1,
      ([n, ...rest]) =>
        (([t, st1]: [Ty, St]) =>
          (([restTs, env2, st2]: [Ty[], Map<A, Scheme>, St]) =>
            _tuple(_Array_prepend(t, restTs), env2, st2))(
            bindParamNamesFrom(rest, _Map_set(n, mono(t), env), st1),
          ))(freshVar(st)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const bindParamFieldsFrom: _Curry<
  [fields: string[], env: Map<string, Scheme>, row: Row, st: St],
  [Row, Map<string, Scheme>, St]
> = _curry(4, (fields: string[], env: Map<string, Scheme>, row: Row, st: St) =>
  ((_v) =>
    _v.length === 0
      ? _tuple(row, env, st)
      : _v.length >= 1
        ? (([f, ...rest]) =>
            (([ft, st1]: [Ty, St]) =>
              bindParamFieldsFrom(rest, _Map_set(f, mono(ft), env), rExtend(f, ft, row), st1))(
              freshVar(st),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(fields),
);
const recordParamNamesFrom: _Curry<
  [names: string[], spans: SpanAt[], types: Ty[], i: number, st: St],
  St
> = _curry(5, (names: string[], spans: SpanAt[], types: Ty[], i: number, st: St) =>
  ((_v) =>
    _v[0]._tag === "Some" && _v[1]._tag === "Some" && _v[2]._tag === "Some"
      ? (([{ value: n }, { value: sp }, { value: t }]) =>
          recordParamNamesFrom(
            names,
            spans,
            types,
            i + 1,
            recordBinder(sp, t, "parameter", n, None as Option<string>, st),
          ))(
          _v as [
            Extract<[Option<string>, Option<SpanAt>, Option<Ty>][0], { _tag: "Some" }>,
            Extract<[Option<string>, Option<SpanAt>, Option<Ty>][1], { _tag: "Some" }>,
            Extract<[Option<string>, Option<SpanAt>, Option<Ty>][2], { _tag: "Some" }>,
          ],
        )
      : st)(_tuple(_Array_get(i, names), _Array_get(i, spans), _Array_get(i, types))),
);
const envTypesOf: <A, B, C>(names: A[], env: Map<A, { ty: B } & C>) => B[] = _curry(
  2,
  <A, B, C>(names: A[], env: Map<A, { ty: B } & C>) =>
    _Array_flatMap(
      (n: A) =>
        _Option_match(
          _Map_get(n, env),
          () => [] as B[],
          (sc) => [sc.ty],
        ),
      names,
    ),
);
const bindParam: _Curry<
  [p: LamParam, env: Map<string, Scheme>, st: St],
  [Ty, Map<string, Scheme>, St]
> = _curry(3, (p: LamParam, env: Map<string, Scheme>, st: St) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner, nameSpans: spans } = $match;
      return (([t, env1, st1]: [Ty, Map<string, Scheme>, St]) => {
        const $match$ = inner;
        switch ($match$._tag) {
          case "LPTuple": {
            const { names } = $match$;
            const elems: Ty[] = ((_v) =>
              _v._tag === "TyCon" ? (({ args: ts }) => ts)(_v) : ([] as Ty[]))(t);
            return _tuple(t, env1, recordParamNamesFrom(names, spans, elems, 0, st1));
          }
          case "LPRecord": {
            const { fields } = $match$;
            return _tuple(
              t,
              env1,
              recordParamNamesFrom(fields, spans, envTypesOf(fields, env1), 0, st1),
            );
          }
          default: {
            return _tuple(t, env1, st1);
          }
        }
      })(bindParam(inner, env, st));
    }
    case "LPName": {
      const { name } = $match;
      return (([t, st1]: [Ty, St]) => _tuple(t, _Map_set(name, mono(t), env), st1))(freshVar(st));
    }
    case "LPTuple": {
      const { names } = $match;
      return (([elems, env1, st1]: [Ty[], Map<string, Scheme>, St]) =>
        _tuple(tTuple(elems), env1, st1))(bindParamNamesFrom(names, env, st));
    }
    case "LPRecord": {
      const { fields } = $match;
      return (([rowBase, st1]: [Row, St]) =>
        (([row, env1, st2]: [Row, Map<string, Scheme>, St]) => _tuple(tRecord(row), env1, st2))(
          bindParamFieldsFrom(fields, env, rowBase, st1),
        ))(freshRowVar(st));
    }
    case "LPLabeled": {
      const { name } = $match;
      return (([t, st1]: [Ty, St]) => _tuple(t, _Map_set(name, mono(t), env), st1))(freshVar(st));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
const bindParamsFrom: _Curry<
  [params: LamParam[], env: Map<string, Scheme>, st: St],
  [Ty[], Map<string, Scheme>, St]
> = _curry(3, (params: LamParam[], env: Map<string, Scheme>, st: St) =>
  ((_v) =>
    _v.length === 0
      ? _tuple([] as Ty[], env, st)
      : _v.length >= 1
        ? (([p, ...rest]) =>
            (([t, env1, st1]: [Ty, Map<string, Scheme>, St]) =>
              (([restTs, env2, st2]: [Ty[], Map<string, Scheme>, St]) =>
                _tuple(_Array_prepend(t, restTs), env2, st2))(bindParamsFrom(rest, env1, st1)))(
              bindParam(p, env, st),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(params),
);
const constrainParamAnnotsFrom: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    params: LamParam[],
    paramTypes: Ty[],
    vars: Map<string, Ty>,
    st: St,
  ],
  Result<[Map<string, Ty>, St], IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    params: LamParam[],
    paramTypes: Ty[],
    vars: Map<string, Ty>,
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(_tuple(vars, st)) as Result<[Map<string, Ty>, St], IErr>)
        : _v.length >= 1
          ? (([param, ...rest]) =>
              ((_v) =>
                _v.length === 0
                  ? (Ok(_tuple(vars, st)) as Result<[Map<string, Ty>, St], IErr>)
                  : _v.length >= 1
                    ? (([paramT, ...restTypes]) =>
                        ((_v) =>
                          _v._tag === "LPSpanned" &&
                          _v.param._tag === "LPName" &&
                          _v.param.annot._tag === "Some"
                            ? (({
                                param: {
                                  annot: { value: te },
                                },
                              }) =>
                                (([annotT, vars1, st1]: [Ty, Map<string, Ty>, St]) =>
                                  _Result_flatMap(
                                    (st2) =>
                                      constrainParamAnnotsFrom(ctx, rest, restTypes, vars1, st2),
                                    checkFits(ctx, paramT, annotT, st1, annotSpan(te)),
                                  ))(
                                  typeExprToType(
                                    te,
                                    vars,
                                    st,
                                    ctx.aliasMap,
                                    _Set_fromArray([] as string[]),
                                  ),
                                ))(
                                _v as Extract<LamParam, { _tag: "LPSpanned" }> & {
                                  param: Extract<
                                    Extract<LamParam, { _tag: "LPSpanned" }>["param"],
                                    { _tag: "LPName" }
                                  > & {
                                    annot: Extract<
                                      Extract<
                                        Extract<LamParam, { _tag: "LPSpanned" }>["param"],
                                        { _tag: "LPName" }
                                      >["annot"],
                                      { _tag: "Some" }
                                    >;
                                  };
                                },
                              )
                            : constrainParamAnnotsFrom(ctx, rest, restTypes, vars, st))(param))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(paramTypes))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(params),
);
const arrowChain: _Curry<[paramTypes: Ty[], resultT: Ty], Ty> = _curry(
  2,
  (paramTypes: Ty[], resultT: Ty) =>
    ((_v) =>
      _v.length === 0
        ? tArrow(tUnit, resultT)
        : _v.length === 1
          ? (([p]) => tArrow(p, resultT))(_v)
          : _v.length >= 1
            ? (([p, ...rest]) => tArrow(p, arrowChain(rest, resultT)))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(paramTypes),
);
const ctxWithEnv: <B>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, QualAliasInfo>;
    plugins: HostPlugin[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
    localNames: Set<string>;
    scopeNames: string[];
  },
  env: B,
) => {
  env: B;
  open: boolean;
  ns: Map<string, Map<string, Scheme>>;
  aliasMap: Map<string, QualAliasInfo>;
  plugins: HostPlugin[];
  loopStack: Ty[][];
  letOwner: Map<string, SpanAt>;
  localNames: Set<string>;
  scopeNames: string[];
} = _curry(
  2,
  <B>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    env: B,
  ) => ({
    env: env,
    open: ctx.open,
    ns: ctx.ns,
    aliasMap: ctx.aliasMap,
    plugins: ctx.plugins,
    loopStack: ctx.loopStack,
    letOwner: ctx.letOwner,
    localNames: ctx.localNames,
    scopeNames: ctx.scopeNames,
  }),
);
const ctxWithGroup: <B>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, QualAliasInfo>;
    plugins: HostPlugin[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
    localNames: Set<string>;
    scopeNames: string[];
  },
  env: B,
  names: string[],
) => {
  env: B;
  open: boolean;
  ns: Map<string, Map<string, Scheme>>;
  aliasMap: Map<string, QualAliasInfo>;
  plugins: HostPlugin[];
  loopStack: Ty[][];
  letOwner: Map<string, SpanAt>;
  localNames: Set<string>;
  scopeNames: string[];
} = _curry(
  3,
  <B>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    env: B,
    names: string[],
  ) => ({
    env: env,
    open: ctx.open,
    ns: ctx.ns,
    aliasMap: ctx.aliasMap,
    plugins: ctx.plugins,
    loopStack: ctx.loopStack,
    letOwner: ctx.letOwner,
    localNames: ctx.localNames,
    scopeNames: _Array_concat(names, ctx.scopeNames),
  }),
);
const ctxWithLets: <B, C>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, QualAliasInfo>;
    plugins: HostPlugin[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
    localNames: Set<string>;
    scopeNames: string[];
  },
  env: B,
  letOwner: C,
) => {
  env: B;
  open: boolean;
  ns: Map<string, Map<string, Scheme>>;
  aliasMap: Map<string, QualAliasInfo>;
  plugins: HostPlugin[];
  loopStack: Ty[][];
  letOwner: C;
  localNames: Set<string>;
  scopeNames: string[];
} = _curry(
  3,
  <B, C>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    env: B,
    letOwner: C,
  ) => ({
    env: env,
    open: ctx.open,
    ns: ctx.ns,
    aliasMap: ctx.aliasMap,
    plugins: ctx.plugins,
    loopStack: ctx.loopStack,
    letOwner: letOwner,
    localNames: ctx.localNames,
    scopeNames: ctx.scopeNames,
  }),
);
const ctxWithLoop: <B, C>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, QualAliasInfo>;
    plugins: HostPlugin[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
    localNames: Set<string>;
    scopeNames: string[];
  },
  env: B,
  frame: Ty[],
  letOwner: C,
) => {
  env: B;
  open: boolean;
  ns: Map<string, Map<string, Scheme>>;
  aliasMap: Map<string, QualAliasInfo>;
  plugins: HostPlugin[];
  loopStack: Ty[][];
  letOwner: C;
  localNames: Set<string>;
  scopeNames: string[];
} = _curry(
  4,
  <B, C>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    env: B,
    frame: Ty[],
    letOwner: C,
  ) => ({
    env: env,
    open: ctx.open,
    ns: ctx.ns,
    aliasMap: ctx.aliasMap,
    plugins: ctx.plugins,
    loopStack: _Array_prepend(frame, ctx.loopStack),
    letOwner: letOwner,
    localNames: ctx.localNames,
    scopeNames: ctx.scopeNames,
  }),
);
const inferLoopParamsFrom: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    params: LoopParam[],
    i: number,
    envAcc: Map<string, Scheme>,
    frameAcc: Ty[],
    ownerAcc: Map<string, SpanAt>,
    st: St,
  ],
  Result<[Ty[], Map<string, Scheme>, Map<string, SpanAt>, St], IErr>
> = _curry(
  7,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    params: LoopParam[],
    i: number,
    envAcc: Map<string, Scheme>,
    frameAcc: Ty[],
    ownerAcc: Map<string, SpanAt>,
    st: St,
  ) =>
    _Option_match(
      _Array_get(i, params),
      () =>
        Ok(_tuple(frameAcc, envAcc, ownerAcc, st)) as Result<
          [Ty[], Map<string, Scheme>, Map<string, SpanAt>, St],
          IErr
        >,
      (p) =>
        _Result_flatMap(
          ([t, st1]) =>
            ((sp: SpanAt) =>
              inferLoopParamsFrom(
                ctx,
                params,
                i + 1,
                _Map_set(p.name, mono(t), envAcc),
                _Array_append(t, frameAcc),
                _Map_set(p.name, sp, ownerAcc),
                noteLet(
                  sp,
                  recordBinder(p.nameSpan, t, "let", p.name, None as Option<string>, st1),
                ),
              ))(exprSpan(p.init)),
          inferExpr(ctx, p.init, st),
        ),
    ),
);
const unifyRecurArgsFrom: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    args: Expr[],
    frame: Ty[],
    i: number,
    st: St,
  ],
  Result<St, IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    args: Expr[],
    frame: Ty[],
    i: number,
    st: St,
  ) =>
    _Option_match(
      _Array_get(i, args),
      () => Ok(st) as Result<St, IErr>,
      (a) =>
        _Result_flatMap(
          ([at, st1]) =>
            _Option_match(
              _Array_get(i, frame),
              () => unifyRecurArgsFrom(ctx, args, frame, i + 1, st1),
              (pt) =>
                _Result_flatMap(
                  (st2) => unifyRecurArgsFrom(ctx, args, frame, i + 1, st2),
                  u(ctx, at, pt, st1, exprSpan(a)),
                ),
            ),
          inferExpr(ctx, a, st),
        ),
    ),
);
const inferRecur: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    args: Expr[],
    sp: SpanAt,
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  4,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    args: Expr[],
    sp: SpanAt,
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Err(typeErr("'recur' is only legal inside a loop body", sp)) as Result<[Ty, St], IErr>)
        : _v.length >= 1
          ? (([frame]) =>
              _Result_flatMap(
                (st1) =>
                  (([t, st2]: [Ty, St]) => Ok(_tuple(t, st2)) as Result<[Ty, St], IErr>)(
                    freshVar(st1),
                  ),
                unifyRecurArgsFrom(ctx, args, frame, 0, st),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(ctx.loopStack),
);
const rowHasOptional: (row: Row) => boolean = (row: Row) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { optional, rest } = $match;
      return or(optional, rowHasOptional(rest));
    }
    default: {
      return false;
    }
  }
};
const domainNeedsFits: _Curry<[t: Ty, st: St], boolean> = _curry(2, (t: Ty, st: St) => {
  const $match = zonk(t, st);
  switch ($match._tag) {
    case "TyRecord": {
      const { row } = $match;
      return rowHasOptional(row);
    }
    default: {
      return false;
    }
  }
});
/**
 * True when every known field is optional. This is what makes `f()` legal:
 * the nullary call applies `{}`, which only `fits` an all-optional domain.
 */
const rowAllOptional: (row: Row) => boolean = (row: Row) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { optional, rest } = $match;
      return and(optional, rowAllOptional(rest));
    }
    default: {
      return true;
    }
  }
};
const domainIsOmittableRecord: _Curry<[t: Ty, st: St], boolean> = _curry(2, (t: Ty, st: St) => {
  const $match = zonk(t, st);
  switch ($match._tag) {
    case "TyRecord": {
      const { row } = $match;
      return rowAllOptional(row);
    }
    default: {
      return false;
    }
  }
});
const isLabeledParam: (p: LamParam) => boolean = (p: LamParam) => {
  const $match = p;
  switch ($match._tag) {
    case "LPLabeled": {
      return true;
    }
    case "LPSpanned": {
      const { param: inner } = $match;
      return isLabeledParam(inner);
    }
    default: {
      return false;
    }
  }
};
const splitLamParams: _Curry<
  [params: LamParam[], positional: LamParam[], labeled: LamParam[]],
  [LamParam[], LamParam[]]
> = _curry(3, (params: LamParam[], positional: LamParam[], labeled: LamParam[]) =>
  ((_v) =>
    _v.length === 0
      ? _tuple(positional, labeled)
      : _v.length >= 1
        ? (([p, ...rest]) =>
            isLabeledParam(p)
              ? splitLamParams(rest, positional, _Array_append(p, labeled))
              : splitLamParams(rest, _Array_append(p, positional), labeled))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(params),
);
/**
 * One pass per label, threading `st` but NOT `env`: a default is inferred in
 * the positional-only scope, so one label's default cannot read another's.
 */
const labFieldsFrom: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    labs: LamParam[],
    env: Map<string, Scheme>,
    vars: Map<string, Ty>,
    st: St,
  ],
  Result<[{ name: string; fieldType: Ty; omittable: boolean; bodyType: Ty }[], St], IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    labs: LamParam[],
    env: Map<string, Scheme>,
    vars: Map<string, Ty>,
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(
            _tuple([] as { name: string; fieldType: Ty; omittable: boolean; bodyType: Ty }[], st),
          ) as Result<
            [{ name: string; fieldType: Ty; omittable: boolean; bodyType: Ty }[], St],
            IErr
          >)
        : _v.length >= 1
          ? (([lab, ...rest]) =>
              ((_v) =>
                _v._tag === "LPSpanned"
                  ? (({ param: inner }) => labFieldsFrom(ctx, [inner, ...rest], env, vars, st))(_v)
                  : _v._tag === "LPLabeled"
                    ? (({ name, annot, optional, defaultValue }) =>
                        (([fieldT, vars1, st1]: [Ty, Map<string, Ty>, St]) =>
                          _Result_flatMap(
                            ([fieldT1, st2]) =>
                              ((bodyT: Ty) =>
                                ((omittable: boolean) =>
                                  _Result_flatMap(
                                    ([fields, stN]) =>
                                      Ok(
                                        _tuple(
                                          _Array_prepend(
                                            {
                                              name: name,
                                              fieldType: fieldT1,
                                              omittable: omittable,
                                              bodyType: bodyT,
                                            },
                                            fields,
                                          ),
                                          stN,
                                        ),
                                      ) as Result<
                                        [
                                          {
                                            name: string;
                                            fieldType: Ty;
                                            omittable: boolean;
                                            bodyType: Ty;
                                          }[],
                                          St,
                                        ],
                                        IErr
                                      >,
                                    labFieldsFrom(ctx, rest, env, vars1, st2),
                                  ))(
                                  or(
                                    optional,
                                    _Option_match(
                                      defaultValue,
                                      () => false,
                                      () => true,
                                    ),
                                  ),
                                ))(
                                _Option_match(
                                  defaultValue,
                                  () => (optional ? tCon("Option", [fieldT1]) : fieldT1),
                                  () => fieldT1,
                                ),
                              ),
                            _Option_match(
                              defaultValue,
                              () => Ok(_tuple(fieldT, st1)) as Result<[Ty, St], IErr>,
                              (d) =>
                                _Result_flatMap(
                                  ([dt, s2]) =>
                                    _Option_match(
                                      annot,
                                      () => {
                                        const widened: Ty = widenLits(zonk(dt, s2));
                                        return _Result_flatMap(
                                          (s3) => Ok(_tuple(widened, s3)) as Result<[Ty, St], IErr>,
                                          u(ctx, fieldT, widened, s2, exprSpan(d)),
                                        );
                                      },
                                      () =>
                                        _Result_flatMap(
                                          (s3) => Ok(_tuple(fieldT, s3)) as Result<[Ty, St], IErr>,
                                          checkFits(ctx, dt, fieldT, s2, exprSpan(d)),
                                        ),
                                    ),
                                  inferExpr(ctxWithEnv(ctx, env), d, st1),
                                ),
                            ),
                          ))(
                          _Option_match(
                            annot,
                            () => (([t, s1]: [Ty, St]) => _tuple(t, vars, s1))(freshVar(st)),
                            (te) =>
                              typeExprToType(
                                te,
                                vars,
                                st,
                                ctx.aliasMap,
                                _Set_fromArray([] as string[]),
                              ),
                          ),
                        ))(_v)
                    : labFieldsFrom(ctx, rest, env, vars, st))(lab))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(labs),
);
const rowOfLabFields: <A>(
  fields: ({ name: string; fieldType: Ty; omittable: boolean } & A)[],
) => Row = <A>(fields: ({ name: string; fieldType: Ty; omittable: boolean } & A)[]) =>
  match(fields)
    .with(
      (_v) => _v.length === 0,
      () => RowEmpty as Row,
    )
    .with(
      (_v) => _v.length >= 1,
      ([f, ...rest]) => rField(f.name, f.fieldType, rowOfLabFields(rest), f.omittable),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    });
const envWithLabFields: <A, E>(
  fields: ({ name: A; bodyType: Ty } & E)[],
  env: Map<A, Scheme>,
) => Map<A, Scheme> = _curry(
  2,
  <A, E>(fields: ({ name: A; bodyType: Ty } & E)[], env: Map<A, Scheme>) =>
    match(fields)
      .with(
        (_v) => _v.length === 0,
        () => env,
      )
      .with(
        (_v) => _v.length >= 1,
        ([f, ...rest]) => envWithLabFields(rest, _Map_set(f.name, mono(f.bodyType), env)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * Each labeled param at its name span, typed as the body sees it.
 */
const recordLabParamsFrom: <A>(
  labs: LamParam[],
  fields: ({ name: string; bodyType: Ty } & A)[],
  st: St,
) => St = _curry(3, <A>(labs: LamParam[], fields: ({ name: string; bodyType: Ty } & A)[], st: St) =>
  ((_v) =>
    _v.length === 0
      ? st
      : _v.length >= 1 &&
          _v[0]._tag === "LPSpanned" &&
          _v[0].param._tag === "LPLabeled" &&
          _v[0].nameSpans.length >= 1
        ? (([
            {
              param: { name },
              nameSpans: [sp],
            },
            ...rest
          ]) =>
            recordLabParamsFrom(
              rest,
              fields,
              _Option_match(
                _Array_find((f: { name: string; bodyType: Ty } & A) => eq(f.name, name), fields),
                () => st,
                (f) => recordBinder(sp, f.bodyType, "parameter", name, None as Option<string>, st),
              ),
            ))(
            _v as [
              Extract<LamParam[][number], { _tag: "LPSpanned" }> & {
                param: Extract<
                  Extract<LamParam[][number], { _tag: "LPSpanned" }>["param"],
                  { _tag: "LPLabeled" }
                >;
              },
              ...LamParam[],
            ],
          )
        : _v.length >= 1
          ? (([, ...rest]) => recordLabParamsFrom(rest, fields, st))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(labs),
);
/**
 * Each plain positional name at its span, after the body has constrained it.
 */
const recordNameParamsFrom: _Curry<[params: LamParam[], types: Ty[], st: St], St> = _curry(
  3,
  (params: LamParam[], types: Ty[], st: St) =>
    ((_v) =>
      _v[0].length >= 1 &&
      _v[0][0]._tag === "LPSpanned" &&
      _v[0][0].param._tag === "LPName" &&
      _v[0][0].nameSpans.length >= 1 &&
      _v[1].length >= 1
        ? (([
            [
              {
                param: { name },
                nameSpans: [sp],
              },
              ...rest
            ],
            [t, ...ts],
          ]) =>
            recordNameParamsFrom(
              rest,
              ts,
              recordBinder(sp, t, "parameter", name, None as Option<string>, st),
            ))(
            _v as [
              [
                Extract<[LamParam[], Ty[]][0][number], { _tag: "LPSpanned" }> & {
                  param: Extract<
                    Extract<[LamParam[], Ty[]][0][number], { _tag: "LPSpanned" }>["param"],
                    { _tag: "LPName" }
                  >;
                },
                ...[LamParam[], Ty[]][0],
              ],
              [LamParam[], Ty[]][1],
            ],
          )
        : _v[0].length >= 1 && _v[1].length >= 1
          ? (([[, ...rest], [, ...ts]]) => recordNameParamsFrom(rest, ts, st))(_v)
          : st)(_tuple(params, types)),
);
const inferCallArgs: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    fnT: Ty,
    args: Expr[],
    st: St,
    callSpan: SpanAt,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    fnT: Ty,
    args: Expr[],
    st: St,
    callSpan: SpanAt,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(_tuple(fnT, st)) as Result<[Ty, St], IErr>)
        : _v.length >= 1
          ? (([arg, ...rest]) =>
              _Result_flatMap(
                ([argT, st1]) =>
                  ((_v) =>
                    _v._tag === "TyFn"
                      ? (({ from: fromT, to: toT }) =>
                          domainNeedsFits(fromT, st1)
                            ? _Result_flatMap(
                                (st2) => inferCallArgs(ctx, toT, rest, st2, callSpan),
                                checkFits(ctx, argT, fromT, st1, exprSpan(arg)),
                              )
                            : (([resultT, st2]: [Ty, St]) =>
                                _Result_flatMap(
                                  (st3) => inferCallArgs(ctx, resultT, rest, st3, callSpan),
                                  u(ctx, fnT, tArrow(argT, resultT), st2, exprSpan(arg)),
                                ))(freshVar(st1)))(_v)
                      : (([resultT, st2]: [Ty, St]) =>
                          _Result_flatMap(
                            (st3) => inferCallArgs(ctx, resultT, rest, st3, callSpan),
                            u(ctx, fnT, tArrow(argT, resultT), st2, exprSpan(arg)),
                          ))(freshVar(st1)))(resolve(fnT, st1)),
                inferExpr(ctx, arg, st),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(args),
);
const isTupleParam: (p: LamParam) => boolean = (p: LamParam) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return isTupleParam(inner);
    }
    case "LPTuple": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const inferTupleLet: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    param: LamParam,
    body: Expr,
    lamSpan: SpanAt,
    value: Expr,
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  6,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    param: LamParam,
    body: Expr,
    lamSpan: SpanAt,
    value: Expr,
    st: St,
  ) =>
    _Result_flatMap(
      ([valueT, st1]) =>
        (([paramT, bodyEnv, st2]: [Ty, Map<string, Scheme>, St]) =>
          _Result_flatMap(
            (st3) =>
              _Result_flatMap(
                ([bodyT, st4]) =>
                  Ok(_tuple(bodyT, recordAt(lamSpan, tArrow(paramT, bodyT), st4))) as Result<
                    [Ty, St],
                    IErr
                  >,
                inferExpr(ctxWithEnv(ctx, bodyEnv), body, st3),
              ),
            u(ctx, paramT, valueT, st2, exprSpan(value)),
          ))(bindParam(param, ctx.env, st1)),
      inferExpr(ctx, value, st),
    ),
);
const inferApplied: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    fn: Expr,
    args: Expr[],
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  4,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    fn: Expr,
    args: Expr[],
    st: St,
  ) =>
    _Result_flatMap(
      ([fnT, st1]) =>
        ((_v) =>
          _v.length === 0
            ? ((_v) =>
                _v._tag === "TyFn"
                  ? (({ from: fromT, to: toT }) =>
                      domainIsOmittableRecord(fromT, st1)
                        ? _Result_flatMap(
                            (st2) => Ok(_tuple(toT, st2)) as Result<[Ty, St], IErr>,
                            checkFits(ctx, tRecord(RowEmpty as Row), fromT, st1, exprSpan(fn)),
                          )
                        : (([resultT, st2]: [Ty, St]) =>
                            _Result_flatMap(
                              (st3) => Ok(_tuple(resultT, st3)) as Result<[Ty, St], IErr>,
                              u(ctx, fnT, tArrow(tUnit, resultT), st2, exprSpan(fn)),
                            ))(freshVar(st1)))(_v)
                  : (([resultT, st2]: [Ty, St]) =>
                      _Result_flatMap(
                        (st3) => Ok(_tuple(resultT, st3)) as Result<[Ty, St], IErr>,
                        u(ctx, fnT, tArrow(tUnit, resultT), st2, exprSpan(fn)),
                      ))(freshVar(st1)))(resolve(fnT, st1))
            : inferCallArgs(ctx, fnT, args, st1, exprSpan(fn)))(args),
      inferExpr(ctx, fn, st),
    ),
);
const inferNormalCall: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    fn: Expr,
    args: Expr[],
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  4,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    fn: Expr,
    args: Expr[],
    st: St,
  ) =>
    ((_v) =>
      _v[0]._tag === "ELambda" && _v[0].params.length === 1 && _v[1].length === 1
        ? (([
            {
              params: [param],
              body,
              span: lamSpan,
            },
            [value],
          ]) =>
            isTupleParam(param)
              ? inferTupleLet(ctx, param, body, lamSpan, value, st)
              : inferApplied(ctx, fn, args, st))(
            _v as [Extract<[Expr, Expr[]][0], { _tag: "ELambda" }>, [Expr, Expr[]][1]],
          )
        : inferApplied(ctx, fn, args, st))(_tuple(fn, args)),
);
const inferTernary: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    cond: Expr,
    thenE: Expr,
    elseE: Expr,
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    cond: Expr,
    thenE: Expr,
    elseE: Expr,
    st: St,
  ) =>
    _Result_flatMap(
      ([condT, st1]) =>
        _Result_flatMap(
          (st2) =>
            _Result_flatMap(
              ([thenT, st3]) =>
                _Result_flatMap(
                  ([elseT, st4]) =>
                    _Result_flatMap(
                      (st5) => Ok(_tuple(thenT, st5)) as Result<[Ty, St], IErr>,
                      u(ctx, thenT, elseT, st4, exprSpan(elseE)),
                    ),
                  inferExpr(ctx, elseE, st3),
                ),
              inferExpr(ctx, thenE, st2),
            ),
          u(ctx, condT, tBool, st1, exprSpan(cond)),
        ),
      inferExpr(ctx, cond, st),
    ),
);
const bindNameOf: (p: LamParam) => Option<string> = (p: LamParam) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return bindNameOf(inner);
    }
    case "LPName": {
      const { name } = $match;
      return Some(name) as Option<string>;
    }
    default: {
      return None as Option<string>;
    }
  }
};
const inferBindBody: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    param: LamParam,
    paramSpan: SpanAt,
    body: Expr,
    payloadT: Ty,
    mkBody: (a: Ty) => Ty,
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  7,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    param: LamParam,
    paramSpan: SpanAt,
    body: Expr,
    payloadT: Ty,
    mkBody: (a: Ty) => Ty,
    st: St,
  ) =>
    (([paramT, bodyEnv, st1]: [Ty, Map<string, Scheme>, St]) =>
      _Result_flatMap(
        (st2) =>
          ((stNamed: St) =>
            _Result_flatMap(
              ([bodyT, st3]) =>
                (([resT, st4]: [Ty, St]) => {
                  const wantBody: Ty = mkBody(resT);
                  return _Result_flatMap(
                    (st5) => Ok(_tuple(wantBody, st5)) as Result<[Ty, St], IErr>,
                    u(ctx, bodyT, wantBody, st4, exprSpan(body)),
                  );
                })(freshVar(st3)),
              inferExpr(ctxWithEnv(ctx, bodyEnv), body, stNamed),
            ))(
            _Option_match(
              bindNameOf(param),
              () => st2,
              (name) => recordBinder(paramSpan, payloadT, "let", name, None as Option<string>, st2),
            ),
          ),
        u(ctx, paramT, payloadT, st1, paramSpan),
      ))(bindParam(param, ctx.env, st)),
);
const inferTwoSlotBind: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    param: LamParam,
    paramSpan: SpanAt,
    value: Expr,
    body: Expr,
    valT: Ty,
    ctor: string,
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  8,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    param: LamParam,
    paramSpan: SpanAt,
    value: Expr,
    body: Expr,
    valT: Ty,
    ctor: string,
    st: St,
  ) =>
    (([payloadT, st1]: [Ty, St]) =>
      (([errT, st2]: [Ty, St]) =>
        _Result_flatMap(
          (st3) =>
            inferBindBody(
              ctx,
              param,
              paramSpan,
              body,
              payloadT,
              (resT: Ty) => tCon(ctor, [resT, errT]),
              st3,
            ),
          u(ctx, valT, tCon(ctor, [payloadT, errT]), st2, exprSpan(value)),
        ))(freshVar(st1)))(freshVar(st)),
);
const inferQuestionBind: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    bind: Expr,
    param: LamParam,
    paramSpan: SpanAt,
    value: Expr,
    body: Expr,
    valT: Ty,
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  8,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    bind: Expr,
    param: LamParam,
    paramSpan: SpanAt,
    value: Expr,
    body: Expr,
    valT: Ty,
    st: St,
  ) => {
    const $match = resolve(valT, st);
    switch ($match._tag) {
      case "TyVar": {
        const $written = setLetBindMonad(bind, "Result");
        return inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Result", st);
      }
      case "TyCon": {
        const { name } = $match;
        return name === "Option"
          ? (($written) =>
              (([payloadT, st1]: [Ty, St]) =>
                _Result_flatMap(
                  (st2) =>
                    inferBindBody(
                      ctx,
                      param,
                      paramSpan,
                      body,
                      payloadT,
                      (resT: Ty) => tCon("Option", [resT]),
                      st2,
                    ),
                  u(ctx, valT, tCon("Option", [payloadT]), st1, exprSpan(value)),
                ))(freshVar(st)))(setLetBindMonad(bind, "Option"))
          : name === "Result"
            ? (($written) =>
                inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Result", st))(
                setLetBindMonad(bind, "Result"),
              )
            : (Err(
                typeErr(
                  `let? requires Option or Result, got ${showType(zonk(valT, st))}`,
                  exprSpan(value),
                ),
              ) as Result<[Ty, St], IErr>);
      }
      default: {
        return Err(
          typeErr(
            `let? requires Option or Result, got ${showType(zonk(valT, st))}`,
            exprSpan(value),
          ),
        ) as Result<[Ty, St], IErr>;
      }
    }
  },
);
const inferLetBind: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    bind: Expr,
    param: LamParam,
    paramSpan: SpanAt,
    monad: string,
    value: Expr,
    body: Expr,
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  8,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    bind: Expr,
    param: LamParam,
    paramSpan: SpanAt,
    monad: string,
    value: Expr,
    body: Expr,
    st: St,
  ) =>
    _Result_flatMap(
      ([valT, st1]) =>
        monad === "Task"
          ? inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Task", st1)
          : inferQuestionBind(ctx, bind, param, paramSpan, value, body, valT, st1),
      inferExpr(ctx, value, st),
    ),
);
const inferRecordRow: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    fields: Field[],
    st: St,
  ],
  Result<[Row, St], IErr>
> = _curry(
  3,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    fields: Field[],
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(_tuple(RowEmpty as Row, st)) as Result<[Row, St], IErr>)
        : _v.length >= 1
          ? (([f, ...rest]) =>
              _Result_flatMap(
                ([restRow, st1]) =>
                  _Result_flatMap(
                    ([ft, st2]) =>
                      Ok(_tuple(rExtend(f.name, ft, restRow), st2)) as Result<[Row, St], IErr>,
                    inferExpr(ctx, f.value, st1),
                  ),
                inferRecordRow(ctx, rest, st),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(fields),
);
const rWithTail: _Curry<[row: Row, tail: Row], Row> = _curry(2, (row: Row, tail: Row) => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return tail;
    }
    case "RowVar": {
      const { id } = $match;
      return rVar(id);
    }
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return rField(label, fieldType, rWithTail(rest, tail), optional);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
const lookupField: _Curry<[row: Row, name: string], Option<[Ty, boolean]>> = _curry(
  2,
  (row: Row, name: string) => {
    const $match = row;
    switch ($match._tag) {
      case "RowExtend": {
        const { label, fieldType, optional, rest } = $match;
        return eq(label, name)
          ? (Some(_tuple(fieldType, optional)) as Option<[Ty, boolean]>)
          : lookupField(rest, name);
      }
      default: {
        return None as Option<[Ty, boolean]>;
      }
    }
  },
);
const rowEndsEmpty: (row: Row) => boolean = (row: Row) => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return true;
    }
    case "RowExtend": {
      const { rest } = $match;
      return rowEndsEmpty(rest);
    }
    case "RowVar": {
      return false;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const inferFieldAccess: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    field: Expr,
    target: Expr,
    name: string,
    sp: SpanAt,
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  6,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    field: Expr,
    target: Expr,
    name: string,
    sp: SpanAt,
    st: St,
  ) =>
    _Result_flatMap(
      ([targetT, st1]) =>
        ((zonked: Ty) =>
          ((_v) =>
            _v._tag === "TyRecord"
              ? (({ row }) =>
                  ((_v) =>
                    _v._tag === "Some"
                      ? (({ value: [ft, optional] }) =>
                          optional
                            ? (($written) =>
                                Ok(_tuple(tCon("Option", [ft]), st1)) as Result<[Ty, St], IErr>)(
                                setFieldOptional(field, true),
                              )
                            : (Ok(_tuple(ft, st1)) as Result<[Ty, St], IErr>))(
                          _v as Extract<Option<[Ty, boolean]>, { _tag: "Some" }>,
                        )
                      : _v._tag === "None"
                        ? rowEndsEmpty(row)
                          ? (Err(typeErr(`record missing field '${name}'`, sp)) as Result<
                              [Ty, St],
                              IErr
                            >)
                          : inferDuckField(ctx, targetT, name, sp, st1)
                        : (() => {
                            throw new Error("non-exhaustive match");
                          })())(lookupField(row, name)))(_v)
              : inferDuckField(ctx, targetT, name, sp, st1))(zonked))(zonk(targetT, st1)),
      inferExpr(ctx, target, st),
    ),
);
const inferDuckField: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    targetT: Ty,
    name: string,
    sp: SpanAt,
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    targetT: Ty,
    name: string,
    sp: SpanAt,
    st: St,
  ) =>
    (([fieldT, st2]: [Ty, St]) =>
      (([restRow, st3]: [Row, St]) =>
        _Result_flatMap(
          (st4) => Ok(_tuple(fieldT, st4)) as Result<[Ty, St], IErr>,
          u(ctx, targetT, tRecord(rExtend(name, fieldT, restRow)), st3, sp),
        ))(freshRowVar(st2)))(freshVar(st)),
);
const inferNsField: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    tname: string,
    name: string,
    sp: SpanAt,
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    tname: string,
    name: string,
    sp: SpanAt,
    st: St,
  ) =>
    _Option_match(
      _Map_get(name, _Map_getOr(new Map<string, Scheme>(), tname, ctx.ns)),
      () => Err(typeErr(`'${tname}' has no member '${name}'`, sp)) as Result<[Ty, St], IErr>,
      (sc) =>
        (([t, st1]: [Ty, St]) => Ok(_tuple(t, st1)) as Result<[Ty, St], IErr>)(instantiate(sc, st)),
    ),
);
const inferInterpParts: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    parts: InterpPart[],
    st: St,
  ],
  Result<St, IErr>
> = _curry(
  3,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    parts: InterpPart[],
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(st) as Result<St, IErr>)
        : _v.length >= 1 && _v[0]._tag === "IPLit"
          ? (([, ...rest]) => inferInterpParts(ctx, rest, st))(
              _v as [Extract<InterpPart[][number], { _tag: "IPLit" }>, ...InterpPart[]],
            )
          : _v.length >= 1 && _v[0]._tag === "IPExpr"
            ? (([{ expr: ex }, ...rest]) =>
                _Result_flatMap(
                  ([t, st1]) =>
                    _Result_flatMap(
                      (st2) => inferInterpParts(ctx, rest, st2),
                      u(ctx, t, tString, st1, exprSpan(ex)),
                    ),
                  inferExpr(ctx, ex, st),
                ))(_v as [Extract<InterpPart[][number], { _tag: "IPExpr" }>, ...InterpPart[]])
            : (() => {
                throw new Error("non-exhaustive match");
              })())(parts),
);
const inferTupleElems: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    elements: Expr[],
    st: St,
  ],
  Result<[Ty[], St], IErr>
> = _curry(
  3,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    elements: Expr[],
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(_tuple([] as Ty[], st)) as Result<[Ty[], St], IErr>)
        : _v.length >= 1
          ? (([el, ...rest]) =>
              _Result_flatMap(
                ([t, st1]) =>
                  _Result_flatMap(
                    ([restTs, st2]) =>
                      Ok(_tuple(_Array_prepend(t, restTs), st2)) as Result<[Ty[], St], IErr>,
                    inferTupleElems(ctx, rest, st1),
                  ),
                inferExpr(ctx, el, st),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(elements),
);
const seqElemExpr: (el: SeqElem) => Expr = (el: SeqElem) => {
  const $match = el;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: e } = $match;
      return e;
    }
    case "SESpread": {
      const { expr: e } = $match;
      return e;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const inferSeqSlotsElems: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    con: string,
    elem: Ty,
    elements: SeqElem[],
    st: St,
  ],
  Result<St, IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    con: string,
    elem: Ty,
    elements: SeqElem[],
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(st) as Result<St, IErr>)
        : _v.length >= 1
          ? (([slot, ...rest]) =>
              ((ex: Expr) =>
                _Result_flatMap(
                  ([et, st1]) =>
                    ((want: Ty) =>
                      _Result_flatMap(
                        (st2) => inferSeqSlotsElems(ctx, con, elem, rest, st2),
                        u(ctx, want, et, st1, exprSpan(ex)),
                      ))(
                      ((_v) =>
                        _v._tag === "SEExpr"
                          ? elem
                          : _v._tag === "SESpread"
                            ? tCon(con, [elem])
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(slot),
                    ),
                  inferExpr(ctx, ex, st),
                ))(seqElemExpr(slot)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(elements),
);
const inferSeqSlots: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    con: string,
    elements: SeqElem[],
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  4,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    con: string,
    elements: SeqElem[],
    st: St,
  ) =>
    (([elem, st1]: [Ty, St]) =>
      _Result_flatMap(
        (st2) => Ok(_tuple(tCon(con, [elem]), st2)) as Result<[Ty, St], IErr>,
        inferSeqSlotsElems(ctx, con, elem, elements, st1),
      ))(freshVar(st)),
);
const inferMapEntries: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    k: Ty,
    v: Ty,
    entries: MapEntry[],
    st: St,
  ],
  Result<St, IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    k: Ty,
    v: Ty,
    entries: MapEntry[],
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(st) as Result<St, IErr>)
        : _v.length >= 1
          ? (([ent, ...rest]) =>
              _Result_flatMap(
                ([kt, st1]) =>
                  _Result_flatMap(
                    (st2) =>
                      _Result_flatMap(
                        ([vt, st3]) =>
                          _Result_flatMap(
                            (st4) => inferMapEntries(ctx, k, v, rest, st4),
                            u(ctx, v, vt, st3, exprSpan(ent.value)),
                          ),
                        inferExpr(ctx, ent.value, st2),
                      ),
                    u(ctx, k, kt, st1, exprSpan(ent.key)),
                  ),
                inferExpr(ctx, ent.key, st),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(entries),
);
const inferMapExpr: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    entries: MapEntry[],
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  3,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    entries: MapEntry[],
    st: St,
  ) =>
    (([k, st1]: [Ty, St]) =>
      (([v, st2]: [Ty, St]) =>
        _Result_flatMap(
          (st3) => Ok(_tuple(tCon("Map", [k, v]), st3)) as Result<[Ty, St], IErr>,
          inferMapEntries(ctx, k, v, entries, st2),
        ))(freshVar(st1)))(freshVar(st)),
);
const mergeBindingMapsFrom: <A, B>(keys: A[], src: Map<A, B>, dest: Map<A, B>) => Map<A, B> =
  _curry(3, <A, B>(keys: A[], src: Map<A, B>, dest: Map<A, B>) =>
    match(keys)
      .with(
        (_v) => _v.length === 0,
        () => dest,
      )
      .with(
        (_v) => _v.length >= 1,
        ([k, ...rest]) =>
          _Option_match(
            _Map_get(k, src),
            () => mergeBindingMapsFrom(rest, src, dest),
            (v) => mergeBindingMapsFrom(rest, src, _Map_set(k, v, dest)),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
  );
const mergeBindingMaps: <A, B>(dest: Map<A, B>, src: Map<A, B>) => Map<A, B> = _curry(
  2,
  <A, B>(dest: Map<A, B>, src: Map<A, B>) => mergeBindingMapsFrom(_Map_keys(src), src, dest),
);
const mergeEnvBindingsFrom: <A>(
  keys: A[],
  bindings: Map<A, Ty>,
  env: Map<A, Scheme>,
) => Map<A, Scheme> = _curry(3, <A>(keys: A[], bindings: Map<A, Ty>, env: Map<A, Scheme>) =>
  match(keys)
    .with(
      (_v) => _v.length === 0,
      () => env,
    )
    .with(
      (_v) => _v.length >= 1,
      ([k, ...rest]) =>
        _Option_match(
          _Map_get(k, bindings),
          () => mergeEnvBindingsFrom(rest, bindings, env),
          (t) => mergeEnvBindingsFrom(rest, bindings, _Map_set(k, mono(t), env)),
        ),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const mergeEnvBindings: <A>(bindings: Map<A, Ty>, env: Map<A, Scheme>) => Map<A, Scheme> = _curry(
  2,
  <A>(bindings: Map<A, Ty>, env: Map<A, Scheme>) =>
    mergeEnvBindingsFrom(_Map_keys(bindings), bindings, env),
);
const inferArms: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    scrutT: Ty,
    resultT: Ty,
    arms: MatchArm[],
    st: St,
  ],
  Result<St, IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    scrutT: Ty,
    resultT: Ty,
    arms: MatchArm[],
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(st) as Result<St, IErr>)
        : _v.length >= 1
          ? (([arm, ...rest]) =>
              _Result_flatMap(
                ([patT, bindings, st1]) =>
                  _Result_flatMap(
                    (st2) =>
                      ((armCtx) =>
                        _Result_flatMap(
                          (st3) =>
                            _Result_flatMap(
                              ([bodyT, st4]) =>
                                _Result_flatMap(
                                  (st5) => inferArms(ctx, scrutT, resultT, rest, st5),
                                  u(ctx, resultT, bodyT, st4, exprSpan(arm.body)),
                                ),
                              inferExpr(armCtx, arm.body, st3),
                            ),
                          _Option_match(
                            arm.guard,
                            () => Ok(st2) as Result<St, IErr>,
                            (g) =>
                              _Result_flatMap(
                                ([guardT, stg]) => u(ctx, tBool, guardT, stg, exprSpan(g)),
                                inferExpr(armCtx, g, st2),
                              ),
                          ),
                        ))(ctxWithEnv(ctx, mergeEnvBindings(bindings, ctx.env))),
                    u(ctx, scrutT, patT, st1, patSpan(arm.pattern)),
                  ),
                inferPat(ctx, arm.pattern, st),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(arms),
);
const inferMatch: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    scrutinee: Expr,
    arms: MatchArm[],
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  4,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    scrutinee: Expr,
    arms: MatchArm[],
    st: St,
  ) =>
    _Result_flatMap(
      ([scrutT, st1]) =>
        (([resultT, st2]: [Ty, St]) =>
          _Result_flatMap(
            (st3) => Ok(_tuple(resultT, st3)) as Result<[Ty, St], IErr>,
            inferArms(ctx, scrutT, resultT, arms, st2),
          ))(freshVar(st1)),
      inferExpr(ctx, scrutinee, st),
    ),
);
/**
 * Recording wrapper over `inferExprRaw` (mirrors src/infer.ts's `infer`):
 * every expression node's inferred type lands in `st.recorded`, keyed by span,
 * so the TS backend can annotate lambda params and empty literals (ADR 0090).
 */
const inferExpr: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    e: Expr,
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  3,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    e: Expr,
    st: St,
  ) =>
    _Result_flatMap(
      ([t, st1]) =>
        Ok(
          _tuple(
            t,
            ((_v) =>
              _v._tag === "EField"
                ? (({ name, span: sp }) =>
                    recordBinder(sp, t, "property", name, None as Option<string>, st1))(_v)
                : recordAt(exprSpan(e), t, st1))(e),
          ),
        ) as Result<[Ty, St], IErr>,
      inferExprRaw(ctx, e, st),
    ),
);
const inferExprRaw: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    e: Expr,
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  3,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    e: Expr,
    st: St,
  ) =>
    ((_v) =>
      _v._tag === "ENum"
        ? (Ok(_tuple(tNumber, st)) as Result<[Ty, St], IErr>)
        : _v._tag === "EUnit"
          ? (Ok(_tuple(tUnit, st)) as Result<[Ty, St], IErr>)
          : _v._tag === "EBool"
            ? (Ok(_tuple(tBool, st)) as Result<[Ty, St], IErr>)
            : _v._tag === "EStr"
              ? (({ value }) => Ok(_tuple(tLit(value), st)) as Result<[Ty, St], IErr>)(_v)
              : _v._tag === "ERef"
                ? (({ name, span: sp }) =>
                    _Option_match(
                      _Map_get(name, ctx.env),
                      () =>
                        ctx.open
                          ? _Set_has(name, ctx.localNames)
                            ? (Err(
                                typeErrHelp(
                                  `'${name}' is not in scope here`,
                                  sp,
                                  "it is bound elsewhere in this file, but not around this use — check the binder's extent",
                                ),
                              ) as Result<[Ty, St], IErr>)
                            : (([t, st1]: [Ty, St]) =>
                                Ok(_tuple(t, st1)) as Result<[Ty, St], IErr>)(freshVar(st))
                          : _Option_match(
                              closestName(name, _Map_keys(ctx.env)),
                              () =>
                                Err(
                                  typeErrHelp(
                                    `unbound variable '${name}'`,
                                    sp,
                                    "bind the name before using it, or check the spelling",
                                  ),
                                ) as Result<[Ty, St], IErr>,
                              (hint) =>
                                Err(
                                  typeErrSuggest(
                                    `unbound variable '${name}'`,
                                    sp,
                                    `did you mean '${hint}'?`,
                                    hint,
                                  ),
                                ) as Result<[Ty, St], IErr>,
                            ),
                      (sc) =>
                        (([t, st1]: [Ty, St]) =>
                          Ok(
                            _tuple(
                              t,
                              _Option_match(
                                _Map_get(name, ctx.letOwner),
                                () => st1,
                                (vsp) => noteUse(vsp, t, st1),
                              ),
                            ),
                          ) as Result<[Ty, St], IErr>)(instantiate(sc, st)),
                    ))(_v)
                : _v._tag === "ELambda"
                  ? (({ params, body }) =>
                      (([posParams, labParams]: [LamParam[], LamParam[]]) =>
                        (([paramTypes, bodyEnv, st1]: [Ty[], Map<string, Scheme>, St]) =>
                          _Result_flatMap(
                            ([annotVars, st2]) =>
                              _Result_flatMap(
                                ([labFields, st3]) =>
                                  ((allTypes: Ty[]) =>
                                    ((st3Labs: St) =>
                                      _Result_flatMap(
                                        ([bodyT, st4]) =>
                                          Ok(
                                            _tuple(
                                              arrowChain(allTypes, bodyT),
                                              recordNameParamsFrom(posParams, paramTypes, st4),
                                            ),
                                          ) as Result<[Ty, St], IErr>,
                                        inferExpr(
                                          ctxWithEnv(ctx, envWithLabFields(labFields, bodyEnv)),
                                          body,
                                          st3Labs,
                                        ),
                                      ))(recordLabParamsFrom(labParams, labFields, st3)))(
                                    ((_v) =>
                                      _v.length === 0
                                        ? paramTypes
                                        : _Array_append(
                                            tRecord(rowOfLabFields(labFields)),
                                            paramTypes,
                                          ))(labParams),
                                  ),
                                labFieldsFrom(ctx, labParams, bodyEnv, annotVars, st2),
                              ),
                            constrainParamAnnotsFrom(
                              ctx,
                              posParams,
                              paramTypes,
                              new Map<string, Ty>(),
                              st1,
                            ),
                          ))(bindParamsFrom(posParams, ctx.env, st)))(
                        splitLamParams(params, [] as LamParam[], [] as LamParam[]),
                      ))(_v)
                  : _v._tag === "ELetIn"
                    ? (({ name, nameSpan, annot, value, body, span: _span }) =>
                        ((_v) =>
                          _v._tag === "ELambda"
                            ? ((lets: Stmt[]) =>
                                ((idxOf: Map<string, number>) =>
                                  ((tail: Expr) =>
                                    (([localCtx, localSt, localErrs]: [
                                      {
                                        env: Map<string, Scheme>;
                                        open: boolean;
                                        ns: Map<string, Map<string, Scheme>>;
                                        aliasMap: Map<string, QualAliasInfo>;
                                        plugins: HostPlugin[];
                                        loopStack: Ty[][];
                                        letOwner: Map<string, SpanAt>;
                                        localNames: Set<string>;
                                        scopeNames: string[];
                                      },
                                      St,
                                      IErr[],
                                    ]) =>
                                      _Option_match(
                                        _Array_get(0, localErrs),
                                        () => inferExpr(localCtx, tail, localSt),
                                        (firstErr) => Err(firstErr) as Result<[Ty, St], IErr>,
                                      ))(
                                      processGroupsFrom(
                                        ctx,
                                        stronglyConnected(adjOf(lets, idxOf)),
                                        lets,
                                        st,
                                        noErrs,
                                      ),
                                    ))(localTail(e)))(idxOfMap(lets)))(localLetsFrom(e))
                            : _Result_flatMap(
                                ([valT, st1]) =>
                                  _Result_flatMap(
                                    ([pinned, st2]) =>
                                      ((widen: boolean) =>
                                        ((sc: Scheme) =>
                                          ((vsp: SpanAt) =>
                                            (($ctx) =>
                                              inferExpr(
                                                $ctx,
                                                body,
                                                noteLet(
                                                  vsp,
                                                  recordBinder(
                                                    nameSpan,
                                                    pinned,
                                                    "let",
                                                    name,
                                                    None as Option<string>,
                                                    st2,
                                                  ),
                                                ),
                                              ))(
                                              ctxWithLets(
                                                ctx,
                                                _Map_set(name, sc, ctx.env),
                                                _Map_set(name, vsp, ctx.letOwner),
                                              ),
                                            ))(exprSpan(value)))(
                                          generalizeOver(
                                            ctx.env,
                                            ctx.scopeNames,
                                            pinned,
                                            st2,
                                            widen,
                                          ),
                                        ))(
                                        _Option_match(
                                          annot,
                                          () => true,
                                          () => false,
                                        ),
                                      ),
                                    _Option_match(
                                      annot,
                                      () => Ok(_tuple(valT, st1)) as Result<[Ty, St], IErr>,
                                      (te) =>
                                        (([at, , stA]: [Ty, Map<string, Ty>, St]) =>
                                          _Result_map(
                                            (stB: St) => _tuple(at, stB),
                                            checkFits(ctx, valT, at, stA, annotSpan(te)),
                                          ))(
                                          typeExprToType(
                                            te,
                                            new Map<string, Ty>(),
                                            st1,
                                            ctx.aliasMap,
                                            _Set_fromArray([] as string[]),
                                          ),
                                        ),
                                    ),
                                  ),
                                inferExpr(ctx, value, st),
                              ))(value))(_v)
                    : _v._tag === "ELetBind"
                      ? (({ param, paramSpan, monad, value, body }) =>
                          inferLetBind(ctx, e, param, paramSpan, monad, value, body, st))(_v)
                      : _v._tag === "ECall"
                        ? (({ fn, args, origin }) =>
                            ((api: InferApi) =>
                              _Result_flatMap(
                                (claimed) =>
                                  _Option_match(
                                    claimed,
                                    () => inferNormalCall(ctx, fn, args, st),
                                    (r) => Ok(r) as Result<[Ty, St], IErr>,
                                  ),
                                runInferCallHooks(
                                  inferCallHooksOf(ctx.plugins),
                                  fn,
                                  args,
                                  origin,
                                  st,
                                  api,
                                ),
                              ))({
                              inferExpr: _curry(2, (e: Expr, st0: St) => inferExpr(ctx, e, st0)),
                              unify: _curry(4, (left: Ty, right: Ty, st0: St, sp: SpanAt) =>
                                u(ctx, left, right, st0, sp),
                              ),
                            }))(_v)
                        : _v._tag === "EPipe" && _v.fast === true
                          ? (({ left, right, span: sp }) =>
                              ((_v) =>
                                _v._tag === "ECall"
                                  ? (({ fn: rfn, args: rargs, origin }) =>
                                      inferExpr(
                                        ctx,
                                        Ast.ECall(rfn, _Array_prepend(left, rargs), origin, sp),
                                        st,
                                      ))(_v)
                                  : inferExpr(
                                      ctx,
                                      Ast.ECall(right, [left], None as Option<string>, sp),
                                      st,
                                    ))(right))(_v)
                          : _v._tag === "EPipe"
                            ? (({ left, right, span: sp }) =>
                                inferExpr(
                                  ctx,
                                  Ast.ECall(right, [left], None as Option<string>, sp),
                                  st,
                                ))(_v)
                            : _v._tag === "EDo"
                              ? (({ exprs }) => inferDo(ctx, exprs, st))(_v)
                              : _v._tag === "ETernary"
                                ? (({ cond, thenE, elseE }) =>
                                    inferTernary(ctx, cond, thenE, elseE, st))(_v)
                                : _v._tag === "ERecord"
                                  ? (({ fields, spread, span: sp }) =>
                                      _Option_match(
                                        spread,
                                        () =>
                                          _Result_flatMap(
                                            ([row, st1]) =>
                                              Ok(_tuple(tRecord(row), st1)) as Result<
                                                [Ty, St],
                                                IErr
                                              >,
                                            inferRecordRow(ctx, fields, st),
                                          ),
                                        (spreadExpr) =>
                                          _Result_flatMap(
                                            ([row, st1]) =>
                                              _Result_flatMap(
                                                ([baseT, st2]) =>
                                                  (([tailVar, st3]: [Row, St]) =>
                                                    _Result_flatMap(
                                                      (st4) =>
                                                        Ok(_tuple(baseT, st4)) as Result<
                                                          [Ty, St],
                                                          IErr
                                                        >,
                                                      u(
                                                        ctx,
                                                        baseT,
                                                        tRecord(rWithTail(row, tailVar)),
                                                        st3,
                                                        sp,
                                                      ),
                                                    ))(freshRowVar(st2)),
                                                inferExpr(ctx, spreadExpr, st1),
                                              ),
                                            inferRecordRow(ctx, fields, st),
                                          ),
                                      ))(_v)
                                  : _v._tag === "EField"
                                    ? (({ target, name, span: sp }) =>
                                        ((_v) =>
                                          _v._tag === "ERef"
                                            ? (({ name: tname }) =>
                                                and(
                                                  _Map_has(tname, ctx.ns),
                                                  !_Map_has(tname, ctx.env),
                                                )
                                                  ? inferNsField(ctx, tname, name, sp, st)
                                                  : inferFieldAccess(ctx, e, target, name, sp, st))(
                                                _v,
                                              )
                                            : inferFieldAccess(ctx, e, target, name, sp, st))(
                                          target,
                                        ))(_v)
                                    : _v._tag === "ETuple"
                                      ? (({ elements }) =>
                                          _Result_flatMap(
                                            ([elems, st1]) =>
                                              Ok(_tuple(tTuple(elems), st1)) as Result<
                                                [Ty, St],
                                                IErr
                                              >,
                                            inferTupleElems(ctx, elements, st),
                                          ))(_v)
                                      : _v._tag === "EArr"
                                        ? (({ elements }) =>
                                            inferSeqSlots(ctx, "Array", elements, st))(_v)
                                        : _v._tag === "EList"
                                          ? (({ elements }) =>
                                              inferSeqSlots(ctx, "List", elements, st))(_v)
                                          : _v._tag === "ESet"
                                            ? (({ elements }) =>
                                                inferSeqSlots(ctx, "Set", elements, st))(_v)
                                            : _v._tag === "EMap"
                                              ? (({ entries }) => inferMapExpr(ctx, entries, st))(
                                                  _v,
                                                )
                                              : _v._tag === "EMatch"
                                                ? (({ scrutinee, arms }) =>
                                                    inferMatch(ctx, scrutinee, arms, st))(_v)
                                                : _v._tag === "ELoop"
                                                  ? (({ params, body }) =>
                                                      _Result_flatMap(
                                                        ([frame, bodyEnv, bodyOwner, st1]) =>
                                                          inferExpr(
                                                            ctxWithLoop(
                                                              ctx,
                                                              bodyEnv,
                                                              frame,
                                                              bodyOwner,
                                                            ),
                                                            body,
                                                            st1,
                                                          ),
                                                        inferLoopParamsFrom(
                                                          ctx,
                                                          params,
                                                          0,
                                                          ctx.env,
                                                          [] as Ty[],
                                                          ctx.letOwner,
                                                          st,
                                                        ),
                                                      ))(_v)
                                                  : _v._tag === "ERecur"
                                                    ? (({ args, span: sp }) =>
                                                        inferRecur(ctx, args, sp, st))(_v)
                                                    : _v._tag === "EInterp"
                                                      ? (({ parts }) =>
                                                          _Result_flatMap(
                                                            (st1) =>
                                                              Ok(_tuple(tString, st1)) as Result<
                                                                [Ty, St],
                                                                IErr
                                                              >,
                                                            inferInterpParts(ctx, parts, st),
                                                          ))(_v)
                                                      : (() => {
                                                          throw new Error("non-exhaustive match");
                                                        })())(e),
);
const inferDo: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    exprs: Expr[],
    st: St,
  ],
  Result<[Ty, St], IErr>
> = _curry(
  3,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    exprs: Expr[],
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Err(typeErr("internal: empty do block", { start: 0, end: 0 })) as Result<[Ty, St], IErr>)
        : _v.length === 1
          ? (([last]) => inferExpr(ctx, last, st))(_v)
          : _v.length >= 1
            ? (([first, ...rest]) =>
                _Result_flatMap(([, st1]) => inferDo(ctx, rest, st1), inferExpr(ctx, first, st)))(
                _v,
              )
            : (() => {
                throw new Error("non-exhaustive match");
              })())(exprs),
);
const inferPatRecordFrom: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    fields: PatField[],
    row: Row,
    bindings: Map<string, Ty>,
    st: St,
  ],
  Result<[Row, Map<string, Ty>, St], IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    fields: PatField[],
    row: Row,
    bindings: Map<string, Ty>,
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(_tuple(row, bindings, st)) as Result<[Row, Map<string, Ty>, St], IErr>)
        : _v.length >= 1
          ? (([f, ...rest]) =>
              _Result_flatMap(
                ([subT, subBindings, st1]) =>
                  inferPatRecordFrom(
                    ctx,
                    rest,
                    rExtend(f.label, subT, row),
                    mergeBindingMaps(bindings, subBindings),
                    recordBinder(
                      f.labelSpan,
                      subT,
                      "property",
                      f.label,
                      None as Option<string>,
                      st1,
                    ),
                  ),
                inferPat(ctx, f.pat, st),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(fields),
);
const inferPatRecord: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    fields: PatField[],
    st: St,
  ],
  Result<[Ty, Map<string, Ty>, St], IErr>
> = _curry(
  3,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    fields: PatField[],
    st: St,
  ) =>
    (([rowBase, st1]: [Row, St]) =>
      _Result_flatMap(
        ([row, bindings, st2]) =>
          Ok(_tuple(tRecord(row), bindings, st2)) as Result<[Ty, Map<string, Ty>, St], IErr>,
        inferPatRecordFrom(ctx, fields, rowBase, new Map<string, Ty>(), st1),
      ))(freshRowVar(st)),
);
const inferPatCtorArgs: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    ctor: string,
    curT: Ty,
    args: Pattern[],
    st: St,
    bindings: Map<string, Ty>,
    sp: SpanAt,
  ],
  Result<[Ty, Map<string, Ty>, St], IErr>
> = _curry(
  7,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    ctor: string,
    curT: Ty,
    args: Pattern[],
    st: St,
    bindings: Map<string, Ty>,
    sp: SpanAt,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(_tuple(curT, bindings, st)) as Result<[Ty, Map<string, Ty>, St], IErr>)
        : _v.length >= 1
          ? (([argPat, ...rest]) =>
              ((_v) =>
                _v._tag === "TyFn"
                  ? (({ from: fromT, to: toT }) =>
                      _Result_flatMap(
                        ([subT, subBindings, st1]) =>
                          _Result_flatMap(
                            (st2) =>
                              inferPatCtorArgs(
                                ctx,
                                ctor,
                                toT,
                                rest,
                                st2,
                                mergeBindingMaps(bindings, subBindings),
                                sp,
                              ),
                            u(ctx, fromT, subT, st1, patSpan(argPat)),
                          ),
                        inferPat(ctx, argPat, st),
                      ))(_v)
                  : (Err(
                      typeErr(`constructor '${ctor}' applied to too many arguments`, sp),
                    ) as Result<[Ty, Map<string, Ty>, St], IErr>))(resolve(curT, st)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(args),
);
const inferPatTupleFrom: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    elems: Pattern[],
    st: St,
  ],
  Result<[Ty[], Map<string, Ty>, St], IErr>
> = _curry(
  3,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    elems: Pattern[],
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(_tuple([] as Ty[], new Map<string, Ty>(), st)) as Result<
            [Ty[], Map<string, Ty>, St],
            IErr
          >)
        : _v.length >= 1
          ? (([ep, ...rest]) =>
              _Result_flatMap(
                ([t, bindings, st1]) =>
                  _Result_flatMap(
                    ([restTs, restBindings, st2]) =>
                      Ok(
                        _tuple(
                          _Array_prepend(t, restTs),
                          mergeBindingMaps(restBindings, bindings),
                          st2,
                        ),
                      ) as Result<[Ty[], Map<string, Ty>, St], IErr>,
                    inferPatTupleFrom(ctx, rest, st1),
                  ),
                inferPat(ctx, ep, st),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(elems),
);
const inferPatTuple: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    elems: Pattern[],
    st: St,
  ],
  Result<[Ty, Map<string, Ty>, St], IErr>
> = _curry(
  3,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    elems: Pattern[],
    st: St,
  ) =>
    _Result_flatMap(
      ([elemTs, bindings, st1]) =>
        Ok(_tuple(tTuple(elemTs), bindings, st1)) as Result<[Ty, Map<string, Ty>, St], IErr>,
      inferPatTupleFrom(ctx, elems, st),
    ),
);
const inferSeqPatElems: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    elem: Ty,
    elems: Pattern[],
    st: St,
  ],
  Result<[Map<string, Ty>, St], IErr>
> = _curry(
  4,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    elem: Ty,
    elems: Pattern[],
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(_tuple(new Map<string, Ty>(), st)) as Result<[Map<string, Ty>, St], IErr>)
        : _v.length >= 1
          ? (([ep, ...rest]) =>
              _Result_flatMap(
                ([subT, subBindings, st1]) =>
                  _Result_flatMap(
                    (st2) =>
                      _Result_flatMap(
                        ([restBindings, st3]) =>
                          Ok(_tuple(mergeBindingMaps(restBindings, subBindings), st3)) as Result<
                            [Map<string, Ty>, St],
                            IErr
                          >,
                        inferSeqPatElems(ctx, elem, rest, st2),
                      ),
                    u(ctx, elem, subT, st1, patSpan(ep)),
                  ),
                inferPat(ctx, ep, st),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(elems),
);
const inferSeqPat: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    con: string,
    elems: Pattern[],
    restPat: Option<Pattern>,
    st: St,
  ],
  Result<[Ty, Map<string, Ty>, St], IErr>
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    con: string,
    elems: Pattern[],
    restPat: Option<Pattern>,
    st: St,
  ) =>
    (([elem, st1]: [Ty, St]) => {
      const seqT: Ty = tCon(con, [elem]);
      return _Result_flatMap(
        ([bindings, st2]) =>
          _Option_match(
            restPat,
            () => Ok(_tuple(seqT, bindings, st2)) as Result<[Ty, Map<string, Ty>, St], IErr>,
            (r) =>
              _Result_flatMap(
                ([subT, subBindings, st3]) =>
                  _Result_flatMap(
                    (st4) =>
                      Ok(_tuple(seqT, mergeBindingMaps(bindings, subBindings), st4)) as Result<
                        [Ty, Map<string, Ty>, St],
                        IErr
                      >,
                    u(ctx, subT, seqT, st3, patSpan(r)),
                  ),
                inferPat(ctx, r, st2),
              ),
          ),
        inferSeqPatElems(ctx, elem, elems, st1),
      );
    })(freshVar(st)),
);
/**
 * Pattern-side analogue of `inferExpr` — records every pattern node's span
 * and type, so a pattern-bound param can be annotated by span.
 */
const inferPat: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    p: Pattern,
    st: St,
  ],
  Result<[Ty, Map<string, Ty>, St], IErr>
> = _curry(
  3,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    p: Pattern,
    st: St,
  ) =>
    _Result_flatMap(
      ([t, bindings, st1]) =>
        Ok(
          _tuple(
            t,
            bindings,
            ((_v) =>
              _v._tag === "PBind"
                ? (({ name, span: sp }) =>
                    recordBinder(sp, t, "parameter", name, None as Option<string>, st1))(_v)
                : recordAt(patSpan(p), t, st1))(p),
          ),
        ) as Result<[Ty, Map<string, Ty>, St], IErr>,
      inferPatRaw(ctx, p, st),
    ),
);
const inferPatRaw: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    p: Pattern,
    st: St,
  ],
  Result<[Ty, Map<string, Ty>, St], IErr>
> = _curry(
  3,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    p: Pattern,
    st: St,
  ) => {
    const $match = p;
    switch ($match._tag) {
      case "PAs": {
        const { pat, name, nameSpan } = $match;
        return _Result_flatMap(
          ([t, bindings, st1]) =>
            Ok(
              _tuple(
                t,
                _Map_set(name, t, bindings),
                recordBinder(nameSpan, t, "parameter", name, None as Option<string>, st1),
              ),
            ) as Result<[Ty, Map<string, Ty>, St], IErr>,
          inferPat(ctx, pat, st),
        );
      }
      case "PWild": {
        return (([t, st1]: [Ty, St]) =>
          Ok(_tuple(t, new Map<string, Ty>(), st1)) as Result<[Ty, Map<string, Ty>, St], IErr>)(
          freshVar(st),
        );
      }
      case "PUnit": {
        return Ok(_tuple(tUnit, new Map<string, Ty>(), st)) as Result<
          [Ty, Map<string, Ty>, St],
          IErr
        >;
      }
      case "PLit": {
        return Ok(_tuple(tNumber, new Map<string, Ty>(), st)) as Result<
          [Ty, Map<string, Ty>, St],
          IErr
        >;
      }
      case "PBool": {
        return Ok(_tuple(tBool, new Map<string, Ty>(), st)) as Result<
          [Ty, Map<string, Ty>, St],
          IErr
        >;
      }
      case "PStr": {
        const { value } = $match;
        return Ok(_tuple(tLit(value), new Map<string, Ty>(), st)) as Result<
          [Ty, Map<string, Ty>, St],
          IErr
        >;
      }
      case "PBind": {
        const { name } = $match;
        return (([t, st1]: [Ty, St]) =>
          Ok(_tuple(t, _Map_set(name, t, new Map<string, Ty>()), st1)) as Result<
            [Ty, Map<string, Ty>, St],
            IErr
          >)(freshVar(st));
      }
      case "PRecord": {
        const { fields } = $match;
        return inferPatRecord(ctx, fields, st);
      }
      case "PCtor": {
        const { ctor, args, ns, span: sp } = $match;
        return _Option_match(
          ns,
          () =>
            _Option_match(
              _Map_get(ctor, ctx.env),
              () =>
                Err(typeErr(`unknown constructor '${ctor}'`, sp)) as Result<
                  [Ty, Map<string, Ty>, St],
                  IErr
                >,
              (sc) =>
                (([curT, st1]: [Ty, St]) =>
                  inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map<string, Ty>(), sp))(
                  instantiate(sc, st),
                ),
            ),
          (alias) =>
            _Option_match(
              _Map_get(ctor, _Map_getOr(new Map<string, Scheme>(), alias, ctx.ns)),
              () =>
                Err(typeErr(`'${alias}' has no member '${ctor}'`, sp)) as Result<
                  [Ty, Map<string, Ty>, St],
                  IErr
                >,
              (sc) =>
                (([curT, st1]: [Ty, St]) =>
                  inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map<string, Ty>(), sp))(
                  instantiate(sc, st),
                ),
            ),
        );
      }
      case "PTuple": {
        const { elems } = $match;
        return inferPatTuple(ctx, elems, st);
      }
      case "PArr": {
        const { elems, rest } = $match;
        return inferSeqPat(ctx, "Array", elems, rest, st);
      }
      case "PList": {
        const { elems, rest } = $match;
        return inferSeqPat(ctx, "List", elems, rest, st);
      }
      case "POr": {
        const { alts, span: sp } = $match;
        return inferOrPat(ctx, alts, sp, st);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const unifyOrPatBinding: <B>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, QualAliasInfo>;
    plugins: HostPlugin[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
    localNames: Set<string>;
    scopeNames: string[];
  },
  name: B,
  altBindings: Map<B, Ty>,
  bindings: Map<B, Ty>,
  st: St,
  sp: SpanAt,
) => Result<St, IErr> = _curry(
  6,
  <B>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    name: B,
    altBindings: Map<B, Ty>,
    bindings: Map<B, Ty>,
    st: St,
    sp: SpanAt,
  ) =>
    _Option_match(
      _Map_get(name, bindings),
      () => Ok(st) as Result<St, IErr>,
      (prevT) =>
        _Option_match(
          _Map_get(name, altBindings),
          () => Ok(st) as Result<St, IErr>,
          (ty) => u(ctx, prevT, ty, st, sp),
        ),
    ),
);
const unifyOrPatBindings: <B>(
  ctx: {
    env: Map<string, Scheme>;
    open: boolean;
    ns: Map<string, Map<string, Scheme>>;
    aliasMap: Map<string, QualAliasInfo>;
    plugins: HostPlugin[];
    loopStack: Ty[][];
    letOwner: Map<string, SpanAt>;
    localNames: Set<string>;
    scopeNames: string[];
  },
  names: B[],
  altBindings: Map<B, Ty>,
  bindings: Map<B, Ty>,
  st: St,
  sp: SpanAt,
) => Result<St, IErr> = _curry(
  6,
  <B>(
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    names: B[],
    altBindings: Map<B, Ty>,
    bindings: Map<B, Ty>,
    st: St,
    sp: SpanAt,
  ) =>
    match(names)
      .with(
        (_v) => _v.length === 0,
        () => Ok(st) as Result<St, IErr>,
      )
      .with(
        (_v) => _v.length >= 1,
        ([name, ...rest]) =>
          _Result_flatMap(
            (st1) => unifyOrPatBindings(ctx, rest, altBindings, bindings, st1, sp),
            unifyOrPatBinding(ctx, name, altBindings, bindings, st, sp),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferOrPatAlts: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    alts: Pattern[],
    i: number,
    t: Ty,
    bindings: Map<string, Ty>,
    st: St,
  ],
  Result<St, IErr>
> = _curry(
  6,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    alts: Pattern[],
    i: number,
    t: Ty,
    bindings: Map<string, Ty>,
    st: St,
  ) =>
    _Option_match(
      _Array_get(i, alts),
      () => Ok(st) as Result<St, IErr>,
      (alt) =>
        _Result_flatMap(
          ([altT, altBindings, st1]) =>
            _Result_flatMap(
              (st2) =>
                _Result_flatMap(
                  (st3) => inferOrPatAlts(ctx, alts, i + 1, t, bindings, st3),
                  unifyOrPatBindings(
                    ctx,
                    _Map_keys(altBindings),
                    altBindings,
                    bindings,
                    st2,
                    patSpan(alt),
                  ),
                ),
              u(ctx, t, altT, st1, patSpan(alt)),
            ),
          inferPat(ctx, alt, st),
        ),
    ),
);
const inferOrPat: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    alts: Pattern[],
    sp: SpanAt,
    st: St,
  ],
  Result<[Ty, Map<string, Ty>, St], IErr>
> = _curry(
  4,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    alts: Pattern[],
    sp: SpanAt,
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Err(typeErr("or-pattern needs at least one alternative", sp)) as Result<
            [Ty, Map<string, Ty>, St],
            IErr
          >)
        : _v.length >= 1
          ? (([first, ...rest]) =>
              _Result_flatMap(
                ([t, bindings, st1]) =>
                  _Result_flatMap(
                    (st2) =>
                      Ok(_tuple(t, bindings, st2)) as Result<[Ty, Map<string, Ty>, St], IErr>,
                    inferOrPatAlts(ctx, rest, 0, t, bindings, st1),
                  ),
                inferPat(ctx, first, st),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(alts),
);
const patternBindsOpt: (rest: Option<Pattern>) => string[] = (rest: Option<Pattern>) =>
  _Option_match(
    rest,
    () => [] as string[],
    (r) => patternBinds(r),
  );
const patternBinds: (p: Pattern) => string[] = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat, name } = $match;
      return _Array_append(name, patternBinds(pat));
    }
    case "PBind": {
      const { name } = $match;
      return [name];
    }
    case "PRecord": {
      const { fields } = $match;
      return _Array_flatMap((f: PatField) => patternBinds(f.pat), fields);
    }
    case "PCtor": {
      const { args } = $match;
      return _Array_flatMap(patternBinds, args);
    }
    case "PTuple": {
      const { elems } = $match;
      return _Array_flatMap(patternBinds, elems);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return _Array_concat(_Array_flatMap(patternBinds, elems), patternBindsOpt(rest));
    }
    case "PList": {
      const { elems, rest } = $match;
      return _Array_concat(_Array_flatMap(patternBinds, elems), patternBindsOpt(rest));
    }
    case "POr": {
      const { alts } = $match;
      return _Option_match(
        _Array_head(alts),
        () => [] as string[],
        (first) => patternBinds(first),
      );
    }
    default: {
      return [] as string[];
    }
  }
};
const addAllFrom: <A>(names: A[], set: Set<A>) => Set<A> = _curry(2, <A>(names: A[], set: Set<A>) =>
  match(names)
    .with(
      (_v) => _v.length === 0,
      () => set,
    )
    .with(
      (_v) => _v.length >= 1,
      ([n, ...rest]) => addAllFrom(rest, _Set_add(n, set)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const paramBound: _Curry<[p: LamParam, bound: Set<string>], Set<string>> = _curry(
  2,
  (p: LamParam, bound: Set<string>) => {
    const $match = p;
    switch ($match._tag) {
      case "LPSpanned": {
        const { param: inner } = $match;
        return paramBound(inner, bound);
      }
      case "LPName": {
        const { name } = $match;
        return _Set_add(name, bound);
      }
      case "LPTuple": {
        const { names } = $match;
        return addAllFrom(names, bound);
      }
      case "LPRecord": {
        const { fields } = $match;
        return addAllFrom(fields, bound);
      }
      case "LPLabeled": {
        const { name } = $match;
        return _Set_add(name, bound);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const lambdaBound: _Curry<[params: LamParam[], bound: Set<string>], Set<string>> = _curry(
  2,
  (params: LamParam[], bound: Set<string>) =>
    ((_v) =>
      _v.length === 0
        ? bound
        : _v.length >= 1
          ? (([p, ...rest]) => lambdaBound(rest, paramBound(p, bound)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(params),
);
/**
 * A labeled default names the enclosing scope, not the lambda's own params,
 * so its refs are free in the lambda — the SCC needs that edge (ADR 0098 §2).
 */
const labeledDefaultRefs: _Curry<
  [params: LamParam[], bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(3, (params: LamParam[], bound: Set<string>, acc: Set<string>) =>
  ((_v) =>
    _v.length === 0
      ? acc
      : _v.length >= 1
        ? (([p, ...rest]) =>
            ((_v) =>
              _v._tag === "LPSpanned"
                ? (({ param: inner }) => labeledDefaultRefs([inner, ...rest], bound, acc))(_v)
                : _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some"
                  ? (({ defaultValue: { value: d } }) =>
                      labeledDefaultRefs(rest, bound, freeRefs(d, bound, acc)))(
                      _v as Extract<LamParam, { _tag: "LPLabeled" }> & {
                        defaultValue: Extract<
                          Extract<LamParam, { _tag: "LPLabeled" }>["defaultValue"],
                          { _tag: "Some" }
                        >;
                      },
                    )
                  : labeledDefaultRefs(rest, bound, acc))(p))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(params),
);
const loopBound: <A, B>(params: ({ name: A } & B)[], bound: Set<A>) => Set<A> = _curry(
  2,
  <A, B>(params: ({ name: A } & B)[], bound: Set<A>) =>
    reduce(
      _curry(2, (b: Set<A>, p: { name: A } & B) => _Set_add(p.name, b)),
      bound,
      params,
    ),
);
const loopInitRefsFrom: _Curry<
  [params: LoopParam[], i: number, bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(4, (params: LoopParam[], i: number, bound: Set<string>, acc: Set<string>) =>
  _Option_match(
    _Array_get(i, params),
    () => acc,
    (p) => loopInitRefsFrom(params, i + 1, bound, freeRefs(p.init, bound, acc)),
  ),
);
const freeRefsList: _Curry<
  [es: Expr[], bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(3, (es: Expr[], bound: Set<string>, acc: Set<string>) =>
  ((_v) =>
    _v.length === 0
      ? acc
      : _v.length >= 1
        ? (([e, ...rest]) => freeRefsList(rest, bound, freeRefs(e, bound, acc)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(es),
);
const freeRefsFields: _Curry<
  [fields: Field[], bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(3, (fields: Field[], bound: Set<string>, acc: Set<string>) =>
  ((_v) =>
    _v.length === 0
      ? acc
      : _v.length >= 1
        ? (([f, ...rest]) => freeRefsFields(rest, bound, freeRefs(f.value, bound, acc)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(fields),
);
const freeRefsEntries: _Curry<
  [entries: MapEntry[], bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(3, (entries: MapEntry[], bound: Set<string>, acc: Set<string>) =>
  ((_v) =>
    _v.length === 0
      ? acc
      : _v.length >= 1
        ? (([ent, ...rest]) =>
            freeRefsEntries(
              rest,
              bound,
              freeRefs(ent.value, bound, freeRefs(ent.key, bound, acc)),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(entries),
);
const freeRefsInterpParts: _Curry<
  [parts: InterpPart[], bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(3, (parts: InterpPart[], bound: Set<string>, acc: Set<string>) =>
  ((_v) =>
    _v.length === 0
      ? acc
      : _v.length >= 1 && _v[0]._tag === "IPLit"
        ? (([, ...rest]) => freeRefsInterpParts(rest, bound, acc))(
            _v as [Extract<InterpPart[][number], { _tag: "IPLit" }>, ...InterpPart[]],
          )
        : _v.length >= 1 && _v[0]._tag === "IPExpr"
          ? (([{ expr: ex }, ...rest]) =>
              freeRefsInterpParts(rest, bound, freeRefs(ex, bound, acc)))(
              _v as [Extract<InterpPart[][number], { _tag: "IPExpr" }>, ...InterpPart[]],
            )
          : (() => {
              throw new Error("non-exhaustive match");
            })())(parts),
);
const freeRefsArms: _Curry<
  [arms: MatchArm[], bound: Set<string>, acc: Set<string>],
  Set<string>
> = _curry(3, (arms: MatchArm[], bound: Set<string>, acc: Set<string>) =>
  ((_v) =>
    _v.length === 0
      ? acc
      : _v.length >= 1
        ? (([arm, ...rest]) =>
            ((armBound: Set<string>) =>
              ((acc1: Set<string>) =>
                freeRefsArms(rest, bound, freeRefs(arm.body, armBound, acc1)))(
                _Option_match(
                  arm.guard,
                  () => acc,
                  (g) => freeRefs(g, armBound, acc),
                ),
              ))(addAllFrom(patternBinds(arm.pattern), bound)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(arms),
);
const freeRefs: _Curry<[e: Expr, bound: Set<string>, acc: Set<string>], Set<string>> = _curry(
  3,
  (e: Expr, bound: Set<string>, acc: Set<string>) => {
    const $match = e;
    switch ($match._tag) {
      case "ENum": {
        return acc;
      }
      case "EUnit": {
        return acc;
      }
      case "EBool": {
        return acc;
      }
      case "EStr": {
        return acc;
      }
      case "ERef": {
        const { name } = $match;
        return _Set_has(name, bound) ? acc : _Set_add(name, acc);
      }
      case "ECall": {
        const { fn, args } = $match;
        return freeRefsList(args, bound, freeRefs(fn, bound, acc));
      }
      case "ELambda": {
        const { params, body } = $match;
        return freeRefs(body, lambdaBound(params, bound), labeledDefaultRefs(params, bound, acc));
      }
      case "ELetIn": {
        const { name, value, body } = $match;
        const valueBound: Set<string> = ((_v) =>
          _v._tag === "ELambda" ? _Set_add(name, bound) : bound)(value);
        const acc1: Set<string> = freeRefs(value, valueBound, acc);
        return freeRefs(body, _Set_add(name, bound), acc1);
      }
      case "ELetBind": {
        const { param, value, body } = $match;
        const acc1: Set<string> = freeRefs(value, bound, acc);
        return freeRefs(body, paramBound(param, bound), acc1);
      }
      case "EPipe": {
        const { left, right } = $match;
        return freeRefs(right, bound, freeRefs(left, bound, acc));
      }
      case "EDo": {
        const { exprs } = $match;
        return freeRefsList(exprs, bound, acc);
      }
      case "ETernary": {
        const { cond, thenE, elseE } = $match;
        return freeRefs(elseE, bound, freeRefs(thenE, bound, freeRefs(cond, bound, acc)));
      }
      case "EMatch": {
        const { scrutinee, arms } = $match;
        return freeRefsArms(arms, bound, freeRefs(scrutinee, bound, acc));
      }
      case "ELoop": {
        const { params, body } = $match;
        return freeRefs(body, loopBound(params, bound), loopInitRefsFrom(params, 0, bound, acc));
      }
      case "ERecur": {
        const { args } = $match;
        return freeRefsList(args, bound, acc);
      }
      case "ERecord": {
        const { fields, spread } = $match;
        return freeRefsFields(
          fields,
          bound,
          _Option_match(
            spread,
            () => acc,
            (s) => freeRefs(s, bound, acc),
          ),
        );
      }
      case "EField": {
        const { target } = $match;
        return freeRefs(target, bound, acc);
      }
      case "ETuple": {
        const { elements } = $match;
        return freeRefsList(elements, bound, acc);
      }
      case "EArr": {
        const { elements } = $match;
        return freeRefsList(map(seqElemExpr, elements), bound, acc);
      }
      case "EList": {
        const { elements } = $match;
        return freeRefsList(map(seqElemExpr, elements), bound, acc);
      }
      case "ESet": {
        const { elements } = $match;
        return freeRefsList(map(seqElemExpr, elements), bound, acc);
      }
      case "EMap": {
        const { entries } = $match;
        return freeRefsEntries(entries, bound, acc);
      }
      case "EInterp": {
        const { parts } = $match;
        return freeRefsInterpParts(parts, bound, acc);
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  },
);
const seedBuiltinsFrom: <A>(
  keys: A[],
  builtins: Map<A, Ty>,
  env: Map<A, Scheme>,
  st: St,
) => Map<A, Scheme> = _curry(4, <A>(keys: A[], builtins: Map<A, Ty>, env: Map<A, Scheme>, st: St) =>
  match(keys)
    .with(
      (_v) => _v.length === 0,
      () => env,
    )
    .with(
      (_v) => _v.length >= 1,
      ([n, ...rest]) =>
        _Option_match(
          _Map_get(n, builtins),
          () => seedBuiltinsFrom(rest, builtins, env, st),
          (t) =>
            seedBuiltinsFrom(rest, builtins, _Map_set(n, generalize(env, t, st, true), env), st),
        ),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const seedBuiltins: <A>(builtins: Map<A, Ty>, env: Map<A, Scheme>, st: St) => Map<A, Scheme> =
  _curry(3, <A>(builtins: Map<A, Ty>, env: Map<A, Scheme>, st: St) =>
    seedBuiltinsFrom(_Map_keys(builtins), builtins, env, st),
  );
const seedNsMembersFrom: <A, B, C>(
  keys: A[],
  members: Map<A, Ty>,
  env: Map<B, { ty: Ty; rvars: number[]; vars: number[] } & C>,
  st: St,
  acc: Map<A, Scheme>,
) => Map<A, Scheme> = _curry(
  5,
  <A, B, C>(
    keys: A[],
    members: Map<A, Ty>,
    env: Map<B, { ty: Ty; rvars: number[]; vars: number[] } & C>,
    st: St,
    acc: Map<A, Scheme>,
  ) =>
    match(keys)
      .with(
        (_v) => _v.length === 0,
        () => acc,
      )
      .with(
        (_v) => _v.length >= 1,
        ([m, ...rest]) =>
          _Option_match(
            _Map_get(m, members),
            () => seedNsMembersFrom(rest, members, env, st, acc),
            (t) =>
              seedNsMembersFrom(
                rest,
                members,
                env,
                st,
                _Map_set(m, generalize(env, t, st, true), acc),
              ),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const seedNsFrom: <A, B, C, D>(
  nsNames: A[],
  namespaces: Map<A, Map<B, Ty>>,
  env: Map<C, { ty: Ty; rvars: number[]; vars: number[] } & D>,
  st: St,
  acc: Map<A, Map<B, Scheme>>,
) => Map<A, Map<B, Scheme>> = _curry(
  5,
  <A, B, C, D>(
    nsNames: A[],
    namespaces: Map<A, Map<B, Ty>>,
    env: Map<C, { ty: Ty; rvars: number[]; vars: number[] } & D>,
    st: St,
    acc: Map<A, Map<B, Scheme>>,
  ) =>
    match(nsNames)
      .with(
        (_v) => _v.length === 0,
        () => acc,
      )
      .with(
        (_v) => _v.length >= 1,
        ([nsName, ...rest]) =>
          _Option_match(
            _Map_get(nsName, namespaces),
            () => seedNsFrom(rest, namespaces, env, st, acc),
            (members) =>
              seedNsFrom(
                rest,
                namespaces,
                env,
                st,
                _Map_set(
                  nsName,
                  seedNsMembersFrom(_Map_keys(members), members, env, st, new Map<B, Scheme>()),
                  acc,
                ),
              ),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const seedNs: <A, B, C, D>(
  namespaces: Map<A, Map<B, Ty>>,
  env: Map<C, { ty: Ty; rvars: number[]; vars: number[] } & D>,
  st: St,
) => Map<A, Map<B, Scheme>> = _curry(
  3,
  <A, B, C, D>(
    namespaces: Map<A, Map<B, Ty>>,
    env: Map<C, { ty: Ty; rvars: number[]; vars: number[] } & D>,
    st: St,
  ) => seedNsFrom(_Map_keys(namespaces), namespaces, env, st, new Map<A, Map<B, Scheme>>()),
);
const seedNsImportsFrom: <A, B>(aliases: A[], nsImports: Map<A, B>, ns: Map<A, B>) => Map<A, B> =
  _curry(3, <A, B>(aliases: A[], nsImports: Map<A, B>, ns: Map<A, B>) =>
    match(aliases)
      .with(
        (_v) => _v.length === 0,
        () => ns,
      )
      .with(
        (_v) => _v.length >= 1,
        ([alias, ...rest]) =>
          _Option_match(
            _Map_get(alias, nsImports),
            () => seedNsImportsFrom(rest, nsImports, ns),
            (members) => seedNsImportsFrom(rest, nsImports, _Map_set(alias, members, ns)),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
  );
const seedNsImports: <A, B>(nsImports: Map<A, B>, ns: Map<A, B>) => Map<A, B> = _curry(
  2,
  <A, B>(nsImports: Map<A, B>, ns: Map<A, B>) =>
    seedNsImportsFrom(_Map_keys(nsImports), nsImports, ns),
);
const aliasMapFrom: _Curry<
  [stmts: Stmt[], acc: Map<string, QualAliasInfo>],
  Map<string, QualAliasInfo>
> = _curry(2, (stmts: Stmt[], acc: Map<string, QualAliasInfo>) =>
  ((_v) =>
    _v.length === 0
      ? acc
      : _v.length >= 1
        ? (([s, ...rest]) =>
            ((_v) =>
              _v._tag === "SType" && _v.alias._tag === "Some"
                ? (({ name, params, alias: { value: fields } }) =>
                    aliasMapFrom(
                      rest,
                      _Map_set(
                        name,
                        { params: params, fields: fields, expr: None as Option<TypeExpr> },
                        acc,
                      ),
                    ))(
                    _v as Extract<Stmt, { _tag: "SType" }> & {
                      alias: Extract<Extract<Stmt, { _tag: "SType" }>["alias"], { _tag: "Some" }>;
                    },
                  )
                : _v._tag === "SType" && _v.aliasType._tag === "Some"
                  ? (({ name, params, aliasType: { value: te } }) =>
                      aliasMapFrom(
                        rest,
                        _Map_set(
                          name,
                          {
                            params: params,
                            fields: [] as AliasField[],
                            expr: Some(te) as Option<TypeExpr>,
                          },
                          acc,
                        ),
                      ))(
                      _v as Extract<Stmt, { _tag: "SType" }> & {
                        aliasType: Extract<
                          Extract<Stmt, { _tag: "SType" }>["aliasType"],
                          { _tag: "Some" }
                        >;
                      },
                    )
                  : aliasMapFrom(rest, acc))(s))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(stmts),
);
const registerCtorsFrom: <A, B>(
  ctors: ({ fields: CtorField[]; name: A } & B)[],
  typeName: string,
  params: string[],
  aliasMap: Map<string, QualAliasInfo>,
  env: Map<A, Scheme>,
  st: St,
) => [Map<A, Scheme>, St] = _curry(
  6,
  <A, B>(
    ctors: ({ fields: CtorField[]; name: A } & B)[],
    typeName: string,
    params: string[],
    aliasMap: Map<string, QualAliasInfo>,
    env: Map<A, Scheme>,
    st: St,
  ) =>
    match(ctors)
      .with(
        (_v) => _v.length === 0,
        () => _tuple(env, st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([c, ...rest]) =>
          (([sc, st1]: [Scheme, St]) =>
            registerCtorsFrom(rest, typeName, params, aliasMap, _Map_set(c.name, sc, env), st1))(
            ctorScheme(typeName, params, c, st, aliasMap),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const registerUserCtorsFrom: _Curry<
  [stmts: Stmt[], aliasMap: Map<string, QualAliasInfo>, env: Map<string, Scheme>, st: St],
  [Map<string, Scheme>, St]
> = _curry(
  4,
  (stmts: Stmt[], aliasMap: Map<string, QualAliasInfo>, env: Map<string, Scheme>, st: St) =>
    ((_v) =>
      _v.length === 0
        ? _tuple(env, st)
        : _v.length >= 1
          ? (([s, ...rest]) =>
              ((_v) =>
                _v._tag === "SType"
                  ? (({ name, params, ctors }) =>
                      (([env1, st1]: [Map<string, Scheme>, St]) =>
                        registerUserCtorsFrom(rest, aliasMap, env1, st1))(
                        registerCtorsFrom(ctors, name, params, aliasMap, env, st),
                      ))(_v)
                  : registerUserCtorsFrom(rest, aliasMap, env, st))(s))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(stmts),
);
const registerBuiltinCtorGroup: <A, B>(
  ctors: ({ name: A; fields: CtorField[] } & B)[],
  typeName: string,
  params: string[],
  aliasMap: Map<string, QualAliasInfo>,
  env: Map<A, Scheme>,
  st: St,
) => [Map<A, Scheme>, St] = _curry(
  6,
  <A, B>(
    ctors: ({ name: A; fields: CtorField[] } & B)[],
    typeName: string,
    params: string[],
    aliasMap: Map<string, QualAliasInfo>,
    env: Map<A, Scheme>,
    st: St,
  ) =>
    match(ctors)
      .with(
        (_v) => _v.length === 0,
        () => _tuple(env, st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([c, ...rest]) =>
          _Map_has(c.name, env)
            ? registerBuiltinCtorGroup(rest, typeName, params, aliasMap, env, st)
            : (([sc, st1]: [Scheme, St]) =>
                registerBuiltinCtorGroup(
                  rest,
                  typeName,
                  params,
                  aliasMap,
                  _Map_set(c.name, sc, env),
                  st1,
                ))(ctorScheme(typeName, params, c, st, aliasMap)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const registerBuiltinCtorsFrom: <A, B, C>(
  decls: ({
    ctors: ({ name: A; fields: CtorField[] } & B)[];
    name: string;
    params: string[];
  } & C)[],
  aliasMap: Map<string, QualAliasInfo>,
  env: Map<A, Scheme>,
  st: St,
) => [Map<A, Scheme>, St] = _curry(
  4,
  <A, B, C>(
    decls: ({
      ctors: ({ name: A; fields: CtorField[] } & B)[];
      name: string;
      params: string[];
    } & C)[],
    aliasMap: Map<string, QualAliasInfo>,
    env: Map<A, Scheme>,
    st: St,
  ) =>
    match(decls)
      .with(
        (_v) => _v.length === 0,
        () => _tuple(env, st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([d, ...rest]) =>
          (([env1, st1]: [Map<A, Scheme>, St]) =>
            registerBuiltinCtorsFrom(rest, aliasMap, env1, st1))(
            registerBuiltinCtorGroup(d.ctors, d.name, d.params, aliasMap, env, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const registerExternsFrom: _Curry<
  [stmts: Stmt[], aliasMap: Map<string, QualAliasInfo>, env: Map<string, Scheme>, st: St],
  [Map<string, Scheme>, St]
> = _curry(
  4,
  (stmts: Stmt[], aliasMap: Map<string, QualAliasInfo>, env: Map<string, Scheme>, st: St) =>
    ((_v) =>
      _v.length === 0
        ? _tuple(env, st)
        : _v.length >= 1
          ? (([s, ...rest]) =>
              ((_v) =>
                _v._tag === "SExtern"
                  ? (({ name, nameSpan, params, typeExpr, doc }) =>
                      (([vars, st0]: [Map<string, Ty>, St]) =>
                        (([t, , st1]: [Ty, Map<string, Ty>, St]) => {
                          const sc: Scheme = generalize(env, t, st1, false);
                          return registerExternsFrom(
                            rest,
                            aliasMap,
                            _Map_set(name, sc, env),
                            recordBinder(nameSpan, sc.ty, "extern", name, doc, st1),
                          );
                        })(
                          typeExprToType(
                            typeExpr,
                            vars,
                            st0,
                            aliasMap,
                            _Set_fromArray([] as string[]),
                          ),
                        ))(
                        reduce(
                          _curry(2, ([vs, s]: [Map<string, Ty>, St], param: string) =>
                            (([v, s1]: [Ty, St]) => _tuple(_Map_set(param, v, vs), s1))(
                              freshVar(s),
                            ),
                          ),
                          _tuple(new Map<string, Ty>(), st),
                          params,
                        ),
                      ))(_v)
                  : registerExternsFrom(rest, aliasMap, env, st))(s))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(stmts),
);
const letsOfFrom: (stmts: Stmt[]) => Stmt[] = (stmts: Stmt[]) =>
  ((_v) =>
    _v.length === 0
      ? ([] as Stmt[])
      : _v.length >= 1
        ? (([s, ...rest]) =>
            ((_v) => (_v._tag === "SLet" ? _Array_prepend(s, letsOfFrom(rest)) : letsOfFrom(rest)))(
              s,
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(stmts);
const localLetsFrom: (e: Expr) => Stmt[] = (e: Expr) => {
  const collect: (a: Expr, b: Stmt[]) => Stmt[] = _curry(2, (current: Expr, acc: Stmt[]) => {
    const $match = current;
    switch ($match._tag) {
      case "ELetIn": {
        const { name, nameSpan, annot, value, body, span } = $match;
        const $match$ = value;
        switch ($match$._tag) {
          case "ELambda": {
            return collect(
              body,
              _Array_append(
                Ast.SLet(name, nameSpan, annot, value, false, None as Option<string>, span),
                acc,
              ),
            );
          }
          default: {
            return acc;
          }
        }
      }
      default: {
        return acc;
      }
    }
  });
  return collect(e, [] as Stmt[]);
};
const localTail: (e: Expr) => Expr = (e: Expr) =>
  ((_v) =>
    _v._tag === "ELetIn" && _v.value._tag === "ELambda"
      ? (({ body }) => localTail(body))(
          _v as Extract<Expr, { _tag: "ELetIn" }> & {
            value: Extract<Extract<Expr, { _tag: "ELetIn" }>["value"], { _tag: "ELambda" }>;
          },
        )
      : e)(e);
const idxOfFrom: _Curry<
  [lets: Stmt[], i0: number, acc0: Map<string, number>],
  Map<string, number>
> = _curry(3, (lets: Stmt[], i0: number, acc0: Map<string, number>) => {
  let i: number = i0;
  let acc: Map<string, number> = acc0;
  while (true) {
    const _step = ((_v) =>
      _v._tag === "None"
        ? _done(acc)
        : _v._tag === "Some" && _v.value._tag === "SLet"
          ? (({ value: { name } }) => _recur(i + 1, _Map_set(name, i, acc)))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
              },
            )
          : _v._tag === "Some"
            ? _recur(i + 1, acc)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, lets));
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
});
const idxOfMap: (lets: Stmt[]) => Map<string, number> = (lets: Stmt[]) =>
  idxOfFrom(lets, 0, new Map<string, number>());
const depsOf: <A>(letStmt: Stmt, idxOf: Map<string, A>) => A[] = _curry(
  2,
  <A>(letStmt: Stmt, idxOf: Map<string, A>) => {
    const $match = letStmt;
    switch ($match._tag) {
      case "SLet": {
        const { value } = $match;
        return _Array_flatMap(
          (r: string) =>
            _Option_match(
              _Map_get(r, idxOf),
              () => [] as A[],
              (j) => [j],
            ),
          _Set_toArray(
            freeRefs(value, _Set_fromArray([] as string[]), _Set_fromArray([] as string[])),
          ),
        );
      }
      default: {
        return [] as A[];
      }
    }
  },
);
const adjOf: <A>(lets: Stmt[], idxOf: Map<string, A>) => A[][] = _curry(
  2,
  <A>(lets: Stmt[], idxOf: Map<string, A>) => map((s: Stmt) => depsOf(s, idxOf), lets),
);
const groupOfFrom: <A>(idxs: number[], lets: A[]) => A[] = _curry(
  2,
  <A>(idxs: number[], lets: A[]) =>
    ((_v) =>
      _v.length === 0
        ? ([] as A[])
        : _v.length >= 1
          ? (([i, ...rest]) =>
              _Option_match(
                _Array_get(i, lets),
                () => groupOfFrom(rest, lets),
                (s) => _Array_prepend(s, groupOfFrom(rest, lets)),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(idxs),
);
const preBindGroupFrom: _Curry<
  [group: Stmt[], env: Map<string, Scheme>, st: St],
  [Map<string, Scheme>, St]
> = _curry(3, (group: Stmt[], env: Map<string, Scheme>, st: St) =>
  ((_v) =>
    _v.length === 0
      ? _tuple(env, st)
      : _v.length >= 1
        ? (([s, ...rest]) =>
            ((_v) =>
              _v._tag === "SLet"
                ? (({ name }) =>
                    (([v, st1]: [Ty, St]) =>
                      preBindGroupFrom(rest, _Map_set(name, mono(v), env), st1))(freshVar(st)))(_v)
                : preBindGroupFrom(rest, env, st))(s))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(group),
);

const inferMember: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    name: string,
    annot: Option<TypeExpr>,
    value: Expr,
    span: SpanAt,
    st: St,
  ],
  Result<[Ty, St], MemberErr>
> = _curry(
  6,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    name: string,
    annot: Option<TypeExpr>,
    value: Expr,
    span: SpanAt,
    st: St,
  ) =>
    ((_v) =>
      _v._tag === "Err"
        ? (({ error: e }) => Err({ err: e, st: st }) as Result<[Ty, St], MemberErr>)(_v)
        : _v._tag === "Ok"
          ? (({ value: [t, st1] }) =>
              _Option_match(
                _Map_get(name, ctx.env),
                () =>
                  Err({
                    err: typeErr(`internal: missing self-binding for '${name}'`, span),
                    st: st1,
                  }) as Result<[Ty, St], MemberErr>,
                (selfSc) =>
                  _Result_match(
                    u(ctx, selfSc.ty, t, st1, span),
                    (e) => Err({ err: e, st: st1 }) as Result<[Ty, St], MemberErr>,
                    (st2) =>
                      _Option_match(
                        annot,
                        () => Ok(_tuple(t, st2)) as Result<[Ty, St], MemberErr>,
                        (te) =>
                          (([at, , stA]: [Ty, Map<string, Ty>, St]) =>
                            _Result_match(
                              checkFits(ctx, t, at, stA, annotSpan(te)),
                              (e) => Err({ err: e, st: stA }) as Result<[Ty, St], MemberErr>,
                              (stB) => Ok(_tuple(at, stB)) as Result<[Ty, St], MemberErr>,
                            ))(
                            typeExprToType(
                              te,
                              new Map<string, Ty>(),
                              st2,
                              ctx.aliasMap,
                              _Set_fromArray([] as string[]),
                            ),
                          ),
                      ),
                  ),
              ))(_v as Extract<Result<[Ty, St], IErr>, { _tag: "Ok" }>)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(inferExpr(ctx, value, st)),
);
const inferGroupFrom: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    group: Stmt[],
    st: St,
    errs: IErr[],
  ],
  [Map<string, Ty>, St, IErr[]]
> = _curry(
  4,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    group: Stmt[],
    st: St,
    errs: IErr[],
  ) =>
    ((_v) =>
      _v.length === 0
        ? _tuple(new Map<string, Ty>(), st, errs)
        : _v.length >= 1
          ? (([s, ...rest]) =>
              ((_v) =>
                _v._tag === "SLet"
                  ? (({ name, nameSpan, annot, value, doc, span }) =>
                      ((_v) =>
                        _v._tag === "Err"
                          ? (({ error: me }) =>
                              inferGroupFrom(ctx, rest, me.st, _Array_append(me.err, errs)))(_v)
                          : _v._tag === "Ok"
                            ? (({ value: [pinned, st3] }) =>
                                ((stNamed: St) =>
                                  (([restTypes, st4, errs1]: [Map<string, Ty>, St, IErr[]]) =>
                                    _tuple(_Map_set(name, pinned, restTypes), st4, errs1))(
                                    inferGroupFrom(ctx, rest, stNamed, errs),
                                  ))(
                                  _Str_startsWith("$", name)
                                    ? st3
                                    : recordBinder(nameSpan, pinned, "let", name, doc, st3),
                                ))(_v as Extract<Result<[Ty, St], MemberErr>, { _tag: "Ok" }>)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(inferMember(ctx, name, annot, value, span, st)))(_v)
                  : inferGroupFrom(ctx, rest, st, errs))(s))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(group),
);
const dropGroupFrom: <A>(group: Stmt[], env: Map<string, A>) => Map<string, A> = _curry(
  2,
  <A>(group: Stmt[], env: Map<string, A>) =>
    ((_v) =>
      _v.length === 0
        ? env
        : _v.length >= 1
          ? (([s, ...rest]) =>
              ((_v) =>
                _v._tag === "SLet"
                  ? (({ name }) => dropGroupFrom(rest, _Map_delete(name, env)))(_v)
                  : dropGroupFrom(rest, env))(s))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(group),
);
const groupNamesFrom: _Curry<[group: Stmt[], acc: string[]], string[]> = _curry(
  2,
  (group: Stmt[], acc: string[]) =>
    ((_v) =>
      _v.length === 0
        ? acc
        : _v.length >= 1
          ? (([s, ...rest]) =>
              ((_v) =>
                _v._tag === "SLet"
                  ? (({ name }) => groupNamesFrom(rest, _Array_append(name, acc)))(_v)
                  : groupNamesFrom(rest, acc))(s))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(group),
);
const generalizeGroupFrom: _Curry<
  [
    group: Stmt[],
    bodyTypes: Map<string, Ty>,
    preEnv: Map<string, Scheme>,
    env: Map<string, Scheme>,
    names: string[],
    st: St,
  ],
  Map<string, Scheme>
> = _curry(
  6,
  (
    group: Stmt[],
    bodyTypes: Map<string, Ty>,
    preEnv: Map<string, Scheme>,
    env: Map<string, Scheme>,
    names: string[],
    st: St,
  ) =>
    ((_v) =>
      _v.length === 0
        ? env
        : _v.length >= 1
          ? (([s, ...rest]) =>
              ((_v) =>
                _v._tag === "SLet"
                  ? (({ name, annot }) =>
                      _Option_match(
                        _Map_get(name, bodyTypes),
                        () =>
                          generalizeGroupFrom(
                            rest,
                            bodyTypes,
                            preEnv,
                            _Option_match(
                              _Map_get(name, preEnv),
                              () => env,
                              (sc) => _Map_set(name, sc, env),
                            ),
                            names,
                            st,
                          ),
                        (t) => {
                          const widen: boolean = _Option_match(
                            annot,
                            () => true,
                            () => false,
                          );
                          return generalizeGroupFrom(
                            rest,
                            bodyTypes,
                            preEnv,
                            _Map_set(name, generalizeOver(env, names, t, st, widen), env),
                            names,
                            st,
                          );
                        },
                      ))(_v)
                  : generalizeGroupFrom(rest, bodyTypes, preEnv, env, names, st))(s))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(group),
);
const noteGroupLets: _Curry<
  [group: Stmt[], letOwner: Map<string, SpanAt>, st: St],
  [Map<string, SpanAt>, St]
> = _curry(3, (group: Stmt[], letOwner: Map<string, SpanAt>, st: St) =>
  ((_v) =>
    _v.length === 0
      ? _tuple(letOwner, st)
      : _v.length >= 1
        ? (([s, ...rest]) =>
            ((_v) =>
              _v._tag === "SLet" && (({ name, value }) => !_Str_startsWith("$", name))(_v)
                ? (({ name, value }) =>
                    ((sp: SpanAt) =>
                      noteGroupLets(rest, _Map_set(name, sp, letOwner), noteLet(sp, st)))(
                      exprSpan(value),
                    ))(_v)
                : noteGroupLets(rest, letOwner, st))(s))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(group),
);
const processGroupsFrom: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    sccs: number[][],
    lets: Stmt[],
    st: St,
    errs: IErr[],
  ],
  [
    {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    St,
    IErr[],
  ]
> = _curry(
  5,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    sccs: number[][],
    lets: Stmt[],
    st: St,
    errs: IErr[],
  ) =>
    ((_v) =>
      _v.length === 0
        ? _tuple(ctx, st, errs)
        : _v.length >= 1
          ? (([comp, ...restSccs]) =>
              ((group: Stmt[]) =>
                (([preEnv, st1]: [Map<string, Scheme>, St]) => {
                  const preCtx = ctxWithGroup(ctx, preEnv, groupNamesFrom(group, [] as string[]));
                  return (([bodyTypes, st2, errs1]: [Map<string, Ty>, St, IErr[]]) => {
                    const finalEnv: Map<string, Scheme> = generalizeGroupFrom(
                      group,
                      bodyTypes,
                      preEnv,
                      dropGroupFrom(group, preEnv),
                      ctx.scopeNames,
                      st2,
                    );
                    return (([finalOwner, st3]: [Map<string, SpanAt>, St]) =>
                      processGroupsFrom(
                        ctxWithLets(ctx, finalEnv, finalOwner),
                        restSccs,
                        lets,
                        st3,
                        errs1,
                      ))(noteGroupLets(group, ctx.letOwner, st2));
                  })(inferGroupFrom(preCtx, group, st1, errs));
                })(preBindGroupFrom(group, ctx.env, st)))(groupOfFrom(comp, lets)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(sccs),
);
const inferExprStmtsFrom: _Curry<
  [
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    stmts: Stmt[],
    st: St,
    errs: IErr[],
  ],
  [St, IErr[]]
> = _curry(
  4,
  (
    ctx: {
      env: Map<string, Scheme>;
      open: boolean;
      ns: Map<string, Map<string, Scheme>>;
      aliasMap: Map<string, QualAliasInfo>;
      plugins: HostPlugin[];
      loopStack: Ty[][];
      letOwner: Map<string, SpanAt>;
      localNames: Set<string>;
      scopeNames: string[];
    },
    stmts: Stmt[],
    st: St,
    errs: IErr[],
  ) =>
    ((_v) =>
      _v.length === 0
        ? _tuple(st, errs)
        : _v.length >= 1
          ? (([s, ...rest]) =>
              ((_v) =>
                _v._tag === "SExpr"
                  ? (({ value, span }) =>
                      ((_v) =>
                        _v._tag === "Err"
                          ? (({ error: e }) =>
                              inferExprStmtsFrom(ctx, rest, st, _Array_append(e, errs)))(_v)
                          : _v._tag === "Ok"
                            ? (({ value: [t, st1] }) =>
                                _Result_match(
                                  u(ctx, t, tUnit, st1, span),
                                  (e) => inferExprStmtsFrom(ctx, rest, st1, _Array_append(e, errs)),
                                  (st2) => inferExprStmtsFrom(ctx, rest, st2, errs),
                                ))(_v as Extract<Result<[Ty, St], IErr>, { _tag: "Ok" }>)
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(inferExpr(ctx, value, st)))(_v)
                  : inferExprStmtsFrom(ctx, rest, st, errs))(s))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(stmts),
);
const seedImportsFrom: <A, B>(keys: A[], imports: Map<A, B>, env: Map<A, B>) => Map<A, B> = _curry(
  3,
  <A, B>(keys: A[], imports: Map<A, B>, env: Map<A, B>) =>
    match(keys)
      .with(
        (_v) => _v.length === 0,
        () => env,
      )
      .with(
        (_v) => _v.length >= 1,
        ([k, ...rest]) =>
          _Option_match(
            _Map_get(k, imports),
            () => seedImportsFrom(rest, imports, env),
            (sc) => seedImportsFrom(rest, imports, _Map_set(k, sc, env)),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * Re-point a dep alias's OWN type references at the dep. A field written in
 * the dep names a sibling alias BARE (`letSpans: Map<string, SpanAt>`), but the
 * seeded table lives in the IMPORTER, where that bare name means nothing — so
 * `SpanAt` would lower nominally and then refuse to unify with the row it
 * stands for. src/schemes.ts has no such problem: it expands an alias in the
 * DECLARING module's scope (`TypeScope`), where the sibling is in plain sight.
 * Qualifying the reference at seed time is that same resolution, done once and
 * carried in the TypeExpr, so nothing downstream needs a scope threaded
 * through it.
 *
 * Only names the dep declares as ALIASES move: a variant crosses under its
 * bare name already, and a type PARAM is lowercase and never an alias key.
 */
const qualifyTe: <A>(te: TypeExpr, alias: string, from: Map<string, A>) => TypeExpr = _curry(
  3,
  <A>(te: TypeExpr, alias: string, from: Map<string, A>) => {
    const $match = te;
    switch ($match._tag) {
      case "TyName": {
        const { name, span: sp } = $match;
        return _Map_has(name, from) ? Ast.TyQual(alias, name, sp, [] as TypeExpr[], sp) : te;
      }
      case "TyApp": {
        const { ctor, args, span: sp } = $match;
        const args1: TypeExpr[] = map((a: TypeExpr) => qualifyTe(a, alias, from), args);
        return _Map_has(ctor, from)
          ? Ast.TyQual(alias, ctor, sp, args1, sp)
          : Ast.TyApp(ctor, args1, sp);
      }
      case "TyArrow": {
        const { from: fromTe, to: toTe, span: sp } = $match;
        return Ast.TyArrow(qualifyTe(fromTe, alias, from), qualifyTe(toTe, alias, from), sp);
      }
      case "TyTuple": {
        const { elems, span: sp } = $match;
        return Ast.TyTuple(
          map((e: TypeExpr) => qualifyTe(e, alias, from), elems),
          sp,
        );
      }
      case "TyList": {
        const { elem, span: sp } = $match;
        return Ast.TyList(qualifyTe(elem, alias, from), sp);
      }
      case "TyUnion": {
        const { members, span: sp } = $match;
        return Ast.TyUnion(
          map((m: TypeExpr) => qualifyTe(m, alias, from), members),
          sp,
        );
      }
      case "TyQual": {
        const { alias: inner, name, nameSpan: nsp, args, span: sp } = $match;
        const args1: TypeExpr[] = map((a: TypeExpr) => qualifyTe(a, alias, from), args);
        return _Map_has(`${inner}.${name}`, from)
          ? Ast.TyQual(alias, `${inner}.${name}`, nsp, args1, sp)
          : Ast.TyQual(inner, name, nsp, args1, sp);
      }
      default: {
        return te;
      }
    }
  },
);
const qualifyField: <D, E>(
  fld: {
    optional: boolean;
    fieldType: TypeExpr;
    nameSpan: { end: number; start: number };
    name: string;
  } & E,
  alias: string,
  from: Map<string, D>,
) => AliasField = _curry(
  3,
  <D, E>(
    fld: {
      optional: boolean;
      fieldType: TypeExpr;
      nameSpan: { end: number; start: number };
      name: string;
    } & E,
    alias: string,
    from: Map<string, D>,
  ) => ({
    name: fld.name,
    nameSpan: fld.nameSpan,
    fieldType: qualifyTe(fld.fieldType, alias, from),
    optional: fld.optional,
  }),
);
const qualifyInfo: <E, F, G>(
  info: {
    expr: Option<TypeExpr>;
    fields: ({
      optional: boolean;
      fieldType: TypeExpr;
      nameSpan: { end: number; start: number };
      name: string;
    } & F)[];
    params: string[];
  } & G,
  alias: string,
  from: Map<string, E>,
) => QualAliasInfo = _curry(
  3,
  <E, F, G>(
    info: {
      expr: Option<TypeExpr>;
      fields: ({
        optional: boolean;
        fieldType: TypeExpr;
        nameSpan: { end: number; start: number };
        name: string;
      } & F)[];
      params: string[];
    } & G,
    alias: string,
    from: Map<string, E>,
  ) => ({
    params: info.params,
    fields: map(
      (
        f: {
          optional: boolean;
          fieldType: TypeExpr;
          nameSpan: { end: number; start: number };
          name: string;
        } & F,
      ) => qualifyField(f, alias, from),
      info.fields,
    ),
    expr: _Option_map((te: TypeExpr) => qualifyTe(te, alias, from), info.expr),
  }),
);
const qualAliasSeedFrom: <E, F>(
  names: string[],
  alias: string,
  from: Map<
    string,
    {
      expr: Option<TypeExpr>;
      fields: ({
        optional: boolean;
        fieldType: TypeExpr;
        nameSpan: { end: number; start: number };
        name: string;
      } & E)[];
      params: string[];
    } & F
  >,
  acc: Map<string, QualAliasInfo>,
) => Map<string, QualAliasInfo> = _curry(
  4,
  <E, F>(
    names: string[],
    alias: string,
    from: Map<
      string,
      {
        expr: Option<TypeExpr>;
        fields: ({
          optional: boolean;
          fieldType: TypeExpr;
          nameSpan: { end: number; start: number };
          name: string;
        } & E)[];
        params: string[];
      } & F
    >,
    acc: Map<string, QualAliasInfo>,
  ) =>
    ((_v) =>
      _v.length === 0
        ? acc
        : _v.length >= 1
          ? (([n, ...rest]) =>
              qualAliasSeedFrom(
                rest,
                alias,
                from,
                _Option_match(
                  _Map_get(n, from),
                  () => acc,
                  (info) => _Map_set(`${alias}.${n}`, qualifyInfo(info, alias, from), acc),
                ),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(names),
);
const qualAliasSeed: <E, F, G>(
  stmts: Stmt[],
  quals: Map<
    string,
    {
      aliases: Map<
        string,
        {
          expr: Option<TypeExpr>;
          fields: ({
            optional: boolean;
            fieldType: TypeExpr;
            nameSpan: { end: number; start: number };
            name: string;
          } & E)[];
          params: string[];
        } & F
      >;
    } & G
  >,
  acc: Map<string, QualAliasInfo>,
) => Map<string, QualAliasInfo> = _curry(
  3,
  <E, F, G>(
    stmts: Stmt[],
    quals: Map<
      string,
      {
        aliases: Map<
          string,
          {
            expr: Option<TypeExpr>;
            fields: ({
              optional: boolean;
              fieldType: TypeExpr;
              nameSpan: { end: number; start: number };
              name: string;
            } & E)[];
            params: string[];
          } & F
        >;
      } & G
    >,
    acc: Map<string, QualAliasInfo>,
  ) =>
    ((_v) =>
      _v.length === 0
        ? acc
        : _v.length >= 1
          ? (([s, ...rest]) =>
              qualAliasSeed(
                rest,
                quals,
                ((_v) =>
                  _v._tag === "SImportNs"
                    ? (({ alias }) =>
                        _Option_match(
                          _Map_get(alias.name, quals),
                          () => acc,
                          (dep) =>
                            qualAliasSeedFrom(_Map_keys(dep.aliases), alias.name, dep.aliases, acc),
                        ))(_v)
                    : acc)(s),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(stmts),
);
/**
 * Zonk every recorded node type against the FINAL state and restore source
 * order (`recordAt` prepends). Mirrors src/infer.ts: types are only resolved
 * once the whole program's substitution is settled, and later records win when
 * two nodes share a span.
 */
const zonkRecorded: (st: St) => TypeAt[] = (st: St) =>
  map((r: TypeAt) => ({ span: r.span, ty: zonk(r.ty, st), sym: r.sym }), recordedTypes(st));
/**
 * A type with no free type OR row vars — the only kind worth annotating from:
 * a generic position has nowhere to bind letters at a `const` / IIFE param.
 */
const isConcrete: (t: Ty) => boolean = (t: Ty) => {
  const f: VarSets = freeInType(t);
  return and(_Set_size(f.tv) === 0, _Set_size(f.rv) === 0);
};
const allSameConcreteFrom: _Curry<[shown: string, uses: Ty[], i: number], boolean> = _curry(
  3,
  (shown: string, uses: Ty[], i: number) =>
    _Option_match(
      _Array_get(i, uses),
      () => true,
      (t) =>
        and(isConcrete(t), eq(showType(t), shown))
          ? allSameConcreteFrom(shown, uses, i + 1)
          : false,
    ),
);
const allSameConcrete: _Curry<[shown: string, uses: Ty[]], boolean> = _curry(
  2,
  (shown: string, uses: Ty[]) => allSameConcreteFrom(shown, uses, 0),
);
/**
 * Resolve `letParams` for TS emit (ADR 0035): a noted `let` is annotated only
 * when its body instantiated it at ONE fully-concrete type. Uses zonk against
 * the FINAL state, like `zonkRecorded` — a use recorded mid-inference is still
 * full of unsolved vars.
 */
const resolveLetParamsFrom: _Curry<[keys: string[], st: St], TypeAt[]> = _curry(
  2,
  (keys: string[], st: St) =>
    ((_v) =>
      _v.length === 0
        ? ([] as TypeAt[])
        : _v.length >= 1
          ? (([k, ...rest]) =>
              ((tail) =>
                ((uses: Ty[]) =>
                  _Option_match(
                    _Array_get(0, uses),
                    () => tail,
                    (first) =>
                      allSameConcrete(showType(first), uses)
                        ? _Option_match(
                            _Map_get(k, st.letSpans),
                            () => tail,
                            (span) => _Array_prepend({ span: span, ty: first, sym: None }, tail),
                          )
                        : tail,
                  ))(map((t: Ty) => zonk(t, st), _Map_getOr([] as Ty[], k, st.letUses))))(
                resolveLetParamsFrom(rest, st),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(keys),
);
const resolveLetParams: (st: St) => TypeAt[] = (st: St) =>
  resolveLetParamsFrom(_Map_keys(st.letSpans), st);
/**
 * Full inference result — the metadata the TS backend needs on top of `env`
 * (ADR 0090), including `letParams` (ADR 0035).
 */
const runInferImports: <A, B, C>(
  stmts: Stmt[],
  builtins: Map<string, Ty>,
  namespaces: Map<string, Map<string, Ty>>,
  openMode: boolean,
  imports: Map<string, Scheme>,
  nsImports: Map<string, Map<string, Scheme>>,
  quals: Map<
    string,
    {
      aliases: Map<
        string,
        {
          expr: Option<TypeExpr>;
          fields: ({
            optional: boolean;
            fieldType: TypeExpr;
            nameSpan: SpanAt;
            name: string;
          } & A)[];
          params: string[];
        } & B
      >;
    } & C
  >,
  pluginsOpt: Option<HostPlugin[]>,
) => Result<
  {
    env: Map<string, Scheme>;
    types: TypeAt[];
    aliases: Map<string, QualAliasInfo>;
    letParams: TypeAt[];
  },
  IErr[]
> = _curry(
  8,
  <A, B, C>(
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    imports: Map<string, Scheme>,
    nsImports: Map<string, Map<string, Scheme>>,
    quals: Map<
      string,
      {
        aliases: Map<
          string,
          {
            expr: Option<TypeExpr>;
            fields: ({
              optional: boolean;
              fieldType: TypeExpr;
              nameSpan: SpanAt;
              name: string;
            } & A)[];
            params: string[];
          } & B
        >;
      } & C
    >,
    pluginsOpt: Option<HostPlugin[]>,
  ) => {
    const plugins: {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: Expr,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: InferApi,
        ) => Result<Option<[Ty, St]>, IErr>
      >;
      format: Option<(a: Expr) => Option<Expr>>;
      formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
      dtsBinding: Option<(a: string, b: Expr, c: Ty, d: TsApi) => Option<string>>;
      bindingType: Option<(a: Expr, b: Ty, c: TsApi) => Option<string>>;
    }[] = resolvePluginsDefault(pluginsOpt);
    const st0: St = mkSt(1000);
    const env0: Map<string, Scheme> = seedBuiltins(builtins, new Map<string, Scheme>(), st0);
    const ns0: Map<string, Map<string, Scheme>> = seedNsImports(
      nsImports,
      seedNs(namespaces, env0, st0),
    );
    const aliasMap: Map<string, QualAliasInfo> = aliasMapFrom(
      stmts,
      qualAliasSeed(stmts, quals, new Map<string, QualAliasInfo>()),
    );
    return (([env1, st1]: [Map<string, Scheme>, St]) =>
      (([env2, st2]: [Map<string, Scheme>, St]) =>
        (([env3, st3]: [Map<string, Scheme>, St]) => {
          const env4: Map<string, Scheme> = seedImportsFrom(_Map_keys(imports), imports, env3);
          const lets: Stmt[] = letsOfFrom(stmts);
          const idxOf: Map<string, number> = idxOfMap(lets);
          const sccs: number[][] = stronglyConnected(adjOf(lets, idxOf));
          const localNames: Set<string> = localBinderNames(stmts);
          return (([finalCtx, st4, errs]: [
            {
              env: Map<string, Scheme>;
              open: boolean;
              ns: Map<string, Map<string, Scheme>>;
              aliasMap: Map<string, QualAliasInfo>;
              plugins: HostPlugin[];
              loopStack: Ty[][];
              letOwner: Map<string, SpanAt>;
              localNames: Set<string>;
              scopeNames: string[];
            },
            St,
            IErr[],
          ]) =>
            (([st5, errs1]: [St, IErr[]]) =>
              ((_v) =>
                _v.length === 0
                  ? (Ok({
                      env: finalCtx.env,
                      types: zonkRecorded(st5),
                      aliases: aliasMap,
                      letParams: resolveLetParams(st5),
                    }) as Result<
                      {
                        env: Map<string, Scheme>;
                        types: TypeAt[];
                        aliases: Map<string, QualAliasInfo>;
                        letParams: TypeAt[];
                      },
                      IErr[]
                    >)
                  : (Err(errs1) as Result<
                      {
                        env: Map<string, Scheme>;
                        types: TypeAt[];
                        aliases: Map<string, QualAliasInfo>;
                        letParams: TypeAt[];
                      },
                      IErr[]
                    >))(errs1))(inferExprStmtsFrom(finalCtx, stmts, st4, errs)))(
            processGroupsFrom(
              {
                env: env4,
                open: openMode,
                ns: ns0,
                aliasMap: aliasMap,
                plugins: plugins,
                loopStack: [] as Ty[][],
                letOwner: new Map<string, SpanAt>(),
                localNames: localNames,
                scopeNames: _Set_toArray(localNames),
              },
              sccs,
              lets,
              st3,
              noErrs,
            ),
          );
        })(registerExternsFrom(stmts, aliasMap, env2, st2)))(
        registerBuiltinCtorsFrom(builtinDeclsFor(stmts), aliasMap, env1, st1),
      ))(registerUserCtorsFrom(stmts, aliasMap, env0, st0));
  },
);
/**
 * Every record alias a module's own type expressions can name: its
 * declarations plus each namespace import's, qualified (`Types.St`). An
 * importer seeds from THIS map rather than the dep's declarations alone, so a
 * qualified name inside a dep's alias still expands (`Infer.Types.St`).
 */
export const scopeAliases: <A, B, C>(
  stmts: Stmt[],
  quals: Map<
    string,
    {
      aliases: Map<
        string,
        {
          expr: Option<TypeExpr>;
          fields: ({
            optional: boolean;
            fieldType: TypeExpr;
            nameSpan: SpanAt;
            name: string;
          } & A)[];
          params: string[];
        } & B
      >;
    } & C
  >,
) => Map<string, QualAliasInfo> = _curry(
  2,
  <A, B, C>(
    stmts: Stmt[],
    quals: Map<
      string,
      {
        aliases: Map<
          string,
          {
            expr: Option<TypeExpr>;
            fields: ({
              optional: boolean;
              fieldType: TypeExpr;
              nameSpan: SpanAt;
              name: string;
            } & A)[];
            params: string[];
          } & B
        >;
      } & C
    >,
  ) => aliasMapFrom(stmts, qualAliasSeed(stmts, quals, new Map<string, QualAliasInfo>())),
);
/**
 * Env-only view — the shape every existing caller (compile.mochi,
 * module.mochi) and the host façades expect.
 */
export const inferProgramImports: <A, B, C>(
  stmts: Stmt[],
  builtins: Map<string, Ty>,
  namespaces: Map<string, Map<string, Ty>>,
  openMode: boolean,
  imports: Map<string, Scheme>,
  nsImports: Map<string, Map<string, Scheme>>,
  quals: Map<
    string,
    {
      aliases: Map<
        string,
        {
          expr: Option<TypeExpr>;
          fields: ({
            optional: boolean;
            fieldType: TypeExpr;
            nameSpan: SpanAt;
            name: string;
          } & A)[];
          params: string[];
        } & B
      >;
    } & C
  >,
  pluginsOpt: Option<HostPlugin[]>,
) => Result<Map<string, Scheme>, IErr[]> = _curry(
  8,
  <A, B, C>(
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    imports: Map<string, Scheme>,
    nsImports: Map<string, Map<string, Scheme>>,
    quals: Map<
      string,
      {
        aliases: Map<
          string,
          {
            expr: Option<TypeExpr>;
            fields: ({
              optional: boolean;
              fieldType: TypeExpr;
              nameSpan: SpanAt;
              name: string;
            } & A)[];
            params: string[];
          } & B
        >;
      } & C
    >,
    pluginsOpt: Option<HostPlugin[]>,
  ) =>
    _Result_map(
      (r: {
        env: Map<string, Scheme>;
        types: TypeAt[];
        aliases: Map<string, QualAliasInfo>;
        letParams: TypeAt[];
      }) => r.env,
      runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt),
    ),
);

const emptyQuals: Map<string, QualScope> = new Map<string, QualScope>();
export const inferProgram: _Curry<
  [
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ],
  Result<Map<string, Scheme>, IErr[]>
> = _curry(
  4,
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ) =>
    inferProgramImports(
      stmts,
      builtins,
      namespaces,
      openMode,
      new Map<string, Scheme>(),
      new Map<string, Map<string, Scheme>>(),
      emptyQuals,
      None as Option<HostPlugin[]>,
    ),
);
/**
 * The imports-aware full result — what the TS GRAPH driver needs (ADR 0090).
 * `inferProgramImports` throws away everything but `env`; a module in a graph
 * still has to annotate from its span -> type table, so the driver calls this
 * instead and reads `env` off the record itself.
 */
export const inferProgramImportsTypes: <A, B, C>(
  stmts: Stmt[],
  builtins: Map<string, Ty>,
  namespaces: Map<string, Map<string, Ty>>,
  openMode: boolean,
  imports: Map<string, Scheme>,
  nsImports: Map<string, Map<string, Scheme>>,
  quals: Map<
    string,
    {
      aliases: Map<
        string,
        {
          expr: Option<TypeExpr>;
          fields: ({
            optional: boolean;
            fieldType: TypeExpr;
            nameSpan: SpanAt;
            name: string;
          } & A)[];
          params: string[];
        } & B
      >;
    } & C
  >,
  pluginsOpt: Option<HostPlugin[]>,
) => Result<
  {
    env: Map<string, Scheme>;
    types: TypeAt[];
    aliases: Map<string, QualAliasInfo>;
    letParams: TypeAt[];
  },
  IErr[]
> = _curry(
  8,
  <A, B, C>(
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    imports: Map<string, Scheme>,
    nsImports: Map<string, Map<string, Scheme>>,
    quals: Map<
      string,
      {
        aliases: Map<
          string,
          {
            expr: Option<TypeExpr>;
            fields: ({
              optional: boolean;
              fieldType: TypeExpr;
              nameSpan: SpanAt;
              name: string;
            } & A)[];
            params: string[];
          } & B
        >;
      } & C
    >,
    pluginsOpt: Option<HostPlugin[]>,
  ) =>
    runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt),
);
/**
 * Like `inferProgram`, but also returns the span -> type map and alias scope
 * the TS backend drives annotation from (ADR 0090).
 */
export const inferProgramTypes: _Curry<
  [
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ],
  Result<
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    IErr[]
  >
> = _curry(
  4,
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
  ) =>
    runInferImports(
      stmts,
      builtins,
      namespaces,
      openMode,
      new Map<string, Scheme>(),
      new Map<string, Map<string, Scheme>>(),
      emptyQuals,
      None as Option<HostPlugin[]>,
    ),
);
/**
 * `inferProgramTypes` under a host plugin list (ADR 0109).
 */
export const inferProgramTypesWith: _Curry<
  [
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    pluginsOpt: Option<HostPlugin[]>,
  ],
  Result<
    {
      env: Map<string, Scheme>;
      types: TypeAt[];
      aliases: Map<string, QualAliasInfo>;
      letParams: TypeAt[];
    },
    IErr[]
  >
> = _curry(
  5,
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    pluginsOpt: Option<HostPlugin[]>,
  ) =>
    runInferImports(
      stmts,
      builtins,
      namespaces,
      openMode,
      new Map<string, Scheme>(),
      new Map<string, Map<string, Scheme>>(),
      emptyQuals,
      pluginsOpt,
    ),
);
export const inferProgramWith: _Curry<
  [
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    pluginsOpt: Option<HostPlugin[]>,
  ],
  Result<Map<string, Scheme>, IErr[]>
> = _curry(
  5,
  (
    stmts: Stmt[],
    builtins: Map<string, Ty>,
    namespaces: Map<string, Map<string, Ty>>,
    openMode: boolean,
    pluginsOpt: Option<HostPlugin[]>,
  ) =>
    inferProgramImports(
      stmts,
      builtins,
      namespaces,
      openMode,
      new Map<string, Scheme>(),
      new Map<string, Map<string, Scheme>>(),
      emptyQuals,
      pluginsOpt,
    ),
);
const takeScheme: <A, B>(name: A, env: Map<A, B>, acc: Map<A, B>) => Map<A, B> = _curry(
  3,
  <A, B>(name: A, env: Map<A, B>, acc: Map<A, B>) =>
    _Option_match(
      _Map_get(name, env),
      () => acc,
      (sc) => _Map_set(name, sc, acc),
    ),
);
const exportCtorsInto: <A, B, C>(
  ctors: ({ name: A } & C)[],
  i: number,
  env: Map<A, B>,
  acc: Map<A, B>,
) => Map<A, B> = _curry(
  4,
  <A, B, C>(ctors: ({ name: A } & C)[], i: number, env: Map<A, B>, acc: Map<A, B>) =>
    _Option_match(
      _Array_get(i, ctors),
      () => acc,
      (c) => exportCtorsInto(ctors, i + 1, env, takeScheme(c.name, env, acc)),
    ),
);
const exportedSchemesFrom: <A>(
  stmts: Stmt[],
  i0: number,
  env: Map<string, A>,
  acc0: Map<string, A>,
) => Map<string, A> = _curry(
  4,
  <A>(stmts: Stmt[], i0: number, env: Map<string, A>, acc0: Map<string, A>) => {
    let i: number = i0;
    let acc = acc0;
    while (true) {
      const _step = ((_v) =>
        _v._tag === "None"
          ? _done(acc)
          : _v._tag === "Some" && _v.value._tag === "SLet" && _v.value.exported === true
            ? (({ value: { name } }) => _recur(i + 1, takeScheme(name, env, acc)))(
                _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                  value: Extract<
                    Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                    { _tag: "SLet" }
                  >;
                },
              )
            : _v._tag === "Some" && _v.value._tag === "SExtern" && _v.value.exported === true
              ? (({ value: { name } }) => _recur(i + 1, takeScheme(name, env, acc)))(
                  _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                    value: Extract<
                      Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                      { _tag: "SExtern" }
                    >;
                  },
                )
              : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true
                ? (({ value: { ctors } }) => _recur(i + 1, exportCtorsInto(ctors, 0, env, acc)))(
                    _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                      value: Extract<
                        Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                        { _tag: "SType" }
                      >;
                    },
                  )
                : _v._tag === "Some"
                  ? _recur(i + 1, acc)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(_Array_get(i, stmts));
      if (_step._tag === "recur") {
        [i, acc] = _step.args;
        continue;
      }
      return _step.value;
    }
  },
);
export const exportedSchemes: <A>(stmts: Stmt[], env: Map<string, A>) => Map<string, A> = _curry(
  2,
  <A>(stmts: Stmt[], env: Map<string, A>) =>
    exportedSchemesFrom(stmts, 0, env, new Map<string, A>()),
);
