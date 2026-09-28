import type {
  Ctor,
  CtorField,
  Expr,
  Field,
  InterpPart,
  LamParam,
  LoopParam,
  MapEntry,
  MatchArm,
  Name,
  PatField,
  Pattern,
  SeqElem,
  Stmt,
  TypeExpr,
} from "./ast";
import type { SpanAt } from "./types";
import type { TSt } from "./scc";

/**
 * What a typed ctor factory carries (TS's `CtorFactoryTs`).
 */
export type CtorFactoryTs = {
  generics: string;
  paramTypes: string[];
  ret: string;
  retMono: string;
};
/**
 * A lambda's generic head plus one annotation per collapsed param (`None` =
 * leave it bare, i.e. generic or JS mode).
 */
export type ParamAnnots = { generics: string; params: Option<string>[] };
/**
 * Structural stand-ins for a ctor and its fields. NOT `Ast.Ctor`: naming the
 * imported alias makes the record nominal across the module boundary, and the
 * frozen stage-1 seed cannot expand a cross-module record alias against an
 * open row (ADR 0046 landed after it was frozen). Declared here, these expand
 * locally and still unify structurally with the real AST values.
 */
export type CtorFieldLike = { name: Option<string>; fieldType: TypeExpr };
export type CtorLike = { name: string; fields: CtorField[]; span: SpanAt };
export type GenOpts = {
  annotateLet: Option<(a: string, b: Expr) => Option<string>>;
  annotateCtor: Option<(a: Stmt, b: Ctor) => Option<CtorFactoryTs>>;
  annotateParams: Option<(a: SpanAt, b: number) => ParamAnnots>;
  annotateEmpty: Option<(a: Expr) => Option<string>>;
  annotateLetin: Option<(a: Expr) => Option<string>>;
  annotateCall: Option<(a: Expr) => Option<string>>;
  guardBaseType: Option<(a: Expr) => Option<string>>;
  flattenPipe: boolean;
  tupleHelper: boolean;
  preserveInfix: boolean;
  preserveJsx: boolean;
  moduleExt: string;
  docs: boolean;
};
/**
 * Everything threaded through the generators: the `GenOpts` knobs, flattened,
 * plus the ctor field-key registry, the namespace runtime table, and the
 * value-reference set. Declared and annotated at every `ctx` parameter for the
 * reason scc.mochi pins `TSt` (ADR 0044) — each generator generalizes the
 * record's open tail on its own, so the emitted TS reprinted the whole shape
 * once per function instead of naming it.
 */
export type GCtx = {
  keys: Map<string, string[]>;
  ns: Map<string, Map<string, string>>;
  annotateLet: Option<(a: string, b: Expr) => Option<string>>;
  annotateCtor: Option<(a: Stmt, b: Ctor) => Option<CtorFactoryTs>>;
  annotateParams: Option<(a: SpanAt, b: number) => ParamAnnots>;
  annotateEmpty: Option<(a: Expr) => Option<string>>;
  annotateLetin: Option<(a: Expr) => Option<string>>;
  annotateCall: Option<(a: Expr) => Option<string>>;
  guardBaseType: Option<(a: Expr) => Option<string>>;
  flattenPipe: boolean;
  tupleHelper: boolean;
  preserveInfix: boolean;
  preserveJsx: boolean;
  moduleExt: string;
  valueRefs: Set<string>;
  docs: boolean;
};

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_concat,
  _Array_get,
  _Array_head,
  _Array_prepend,
  _List_concat,
  _Map_get,
  _Map_getOr,
  _Map_keys,
  _Option_contains,
  _Option_exists,
  _Option_isNone,
  _Option_isSome,
  _Option_unwrapOr,
  _Set_add,
  _Set_fromArray,
  _Set_has,
  _Set_toArray,
  _Set_union,
  _Str_chars,
  _Str_codeAt,
  _Str_concat,
  _Str_endsWith,
  _Str_join,
  _Str_length,
  _Str_replace,
  _Str_slice,
  _Str_split,
  _Str_startsWith,
  _curry,
  _done,
  _list,
  _recur,
  _tuple,
  add,
  and,
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
import { keysOf, ctorKeysFromStmts, seedBuiltinCtorKeys } from "./ctors";

/**
 * The JS backend's knobs: no annotation, no rewriting, `.js` siblings.
 * Annotated so the emitted TS keeps the hook types instead of widening the
 * bare `None`s to `Option<unknown>` (ADR 0044).
 */
export const jsGenOpts: GenOpts = {
  annotateLet: None as Option<(a: string, b: Expr) => Option<string>>,
  annotateCtor: None as Option<(a: Stmt, b: Ctor) => Option<CtorFactoryTs>>,
  annotateParams: None as Option<(a: SpanAt, b: number) => ParamAnnots>,
  annotateEmpty: None as Option<(a: Expr) => Option<string>>,
  annotateLetin: None as Option<(a: Expr) => Option<string>>,
  annotateCall: None as Option<(a: Expr) => Option<string>>,
  guardBaseType: None as Option<(a: Expr) => Option<string>>,
  flattenPipe: false,
  tupleHelper: false,
  preserveInfix: false,
  preserveJsx: false,
  moduleExt: ".js",
  docs: true,
};
/**
 * Apply a one-argument `Option<fn>` hook, flattening "no hook" and "hook
 * declined" into the same `None` — TS's `ctx.hook?.(x) ?? null`.
 */
const hook1: <A, B>(h: Option<(a: A) => Option<B>>, x: A) => Option<B> = _curry(
  2,
  <A, B>(h: Option<(a: A) => Option<B>>, x: A) =>
    ((_v) =>
      _v._tag === "None"
        ? None
        : _v._tag === "Some"
          ? (({ value: f }) => f(x))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(h),
);
/**
 * `hook1` for the two-argument hooks.
 */
const hook2: <A, B, C>(h: Option<(a: A, b: B) => Option<C>>, x: A, y: B) => Option<C> = _curry(
  3,
  <A, B, C>(h: Option<(a: A, b: B) => Option<C>>, x: A, y: B) =>
    ((_v) =>
      _v._tag === "None"
        ? None
        : _v._tag === "Some"
          ? (({ value: f }) => f(x, y))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(h),
);
/**
 * `new Map<K, V>()` when annotated, `new Map()` otherwise.
 */
const emptyNsCtor: _Curry<[con: string, ann: Option<string>], string> = _curry(
  2,
  (con: string, ann: Option<string>) =>
    ((_v) =>
      _v._tag === "None"
        ? `new ${con}()`
        : _v._tag === "Some"
          ? (({ value: t }) => `new ${t}()`)(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(ann),
);
/**
 * Uppercase-initial name — a constructor, not an ordinary binding.
 * A record field name emits BARE only when it is a valid JS identifier;
 * anything else (`data-testid`, `aria-label`) must be quoted or the object
 * literal is a syntax error. Mirrors the oracle's `/^[$A-Za-z_][\w$]*$/`.
 */
const isIdentStart: (c: number) => boolean = (c: number) =>
  or(or(or(and(c >= 65, c <= 90), and(c >= 97, c <= 122)), c === 95), c === 36);
const isIdentPart: (c: number) => boolean = (c: number) =>
  or(isIdentStart(c), and(c >= 48, c <= 57));
const identPartsFrom: _Curry<[s: string, i: number], boolean> = _curry(2, (s: string, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? true
      : _v._tag === "Some"
        ? (({ value: c }) => and(isIdentPart(c), identPartsFrom(s, i + 1)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Str_codeAt(i, s)),
);
const isJsIdent: (s: string) => boolean = (s: string) =>
  ((_v) =>
    _v._tag === "None"
      ? false
      : _v._tag === "Some"
        ? (({ value: c }) => and(isIdentStart(c), identPartsFrom(s, 1)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Str_codeAt(0, s));
const isUpperStart: (s: string) => boolean = (s: string) =>
  _Option_exists((n: number) => and(n >= 65, n <= 90), _Str_codeAt(0, s));
/**
 * A 0-field ctor reference (`None`), per this program's ctor-key table.
 */
const isNullaryCtor: <A, B>(name: A, keys: Map<A, B[]>) => boolean = _curry(
  2,
  <A, B>(name: A, keys: Map<A, B[]>) =>
    _Option_exists((ks: B[]) => length(ks) === 0, _Map_get(name, keys)),
);
/**
 * Callee that is a bare uppercase ref — gates the applied-ctor cast.
 */
const isCtorRef: (fn: Expr) => boolean = (fn: Expr) =>
  ((_v) => (_v._tag === "ERef" ? (({ name }) => isUpperStart(name))(_v) : false))(fn);
/**
 * `name: T` when annotated, bare name otherwise.
 */
const suffixOr: _Curry<[name: string, ann: Option<string>], string> = _curry(
  2,
  (name: string, ann: Option<string>) =>
    ((_v) =>
      _v._tag === "None"
        ? name
        : _v._tag === "Some"
          ? (({ value: t }) => `${name}: ${t}`)(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(ann),
);
/**
 * No annotations at all — the JS backend's shape for every lambda.
 */
const bareParamAnnots: ParamAnnots = { generics: "", params: [] as Option<string>[] };
const paramAnnotsFor: <A, B>(
  h: Option<(a: A, b: B) => ParamAnnots>,
  sp: A,
  arity: B,
) => ParamAnnots = _curry(3, <A, B>(h: Option<(a: A, b: B) => ParamAnnots>, sp: A, arity: B) =>
  ((_v) =>
    _v._tag === "None"
      ? bareParamAnnots
      : _v._tag === "Some"
        ? (({ value: f }) => f(sp, arity))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(h),
);
/**
 * Zip collapsed params with their annotations; a missing or `None` entry
 * leaves the param bare (generic position, or JS mode).
 */
const annotatedParams: _Curry<
  [cparams: LamParam[], annots: Option<string>[], i: number],
  string[]
> = _curry(3, (cparams: LamParam[], annots: Option<string>[], i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: p }) =>
            _Array_prepend(
              suffixOr(
                genParam(p),
                _Option_unwrapOr(None as Option<string>, _Array_get(i, annots)),
              ),
              annotatedParams(cparams, annots, i + 1),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, cparams)),
);
/**
 * `expr as T` when annotated, bare otherwise.
 */
const castOr: _Curry<[js: string, ann: Option<string>], string> = _curry(
  2,
  (js: string, ann: Option<string>) =>
    ((_v) =>
      _v._tag === "None"
        ? js
        : _v._tag === "Some"
          ? (({ value: t }) => `(${js} as ${t})`)(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(ann),
);
const bindRuntime: (monad: string) => string = (monad: string) =>
  monad === "Option" ? "_Option_flatMap" : monad === "Result" ? "_Result_flatMap" : "_Task_andThen";
const allOfFrom: <A>(f: (a: A) => boolean, xs: A[], i: number) => boolean = _curry(
  3,
  <A>(f: (a: A) => boolean, xs: A[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? true
        : _v._tag === "Some"
          ? (({ value: x }) => (f(x) ? allOfFrom(f, xs, i + 1) : false))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, xs)),
);
const allOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) => allOfFrom(f, xs, 0),
);
const someOfFrom: <A>(f: (a: A) => boolean, xs: A[], i: number) => boolean = _curry(
  3,
  <A>(f: (a: A) => boolean, xs: A[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? false
        : _v._tag === "Some"
          ? (({ value: x }) => (f(x) ? true : someOfFrom(f, xs, i + 1)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, xs)),
);
const someOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) => someOfFrom(f, xs, 0),
);
const escChar: (c: string) => string = (c: string) =>
  ((_v) =>
    _v === "\\" ? "\\\\" : _v === '"' ? '\\"' : _v === "\n" ? "\\n" : _v === "\t" ? "\\t" : c)(c);
const jsStringLit: (s: string) => string = (s: string) =>
  `"${_Str_join("", map(escChar, _Str_chars(s)))}"`;
const escTemplateLoop: _Curry<[chars: string[], i0: number, acc0: string], string> = _curry(
  3,
  (chars: string[], i0: number, acc0: string) => {
    let i: number = i0;
    let acc: string = acc0;
    while (true) {
      const _step = ((_v) =>
        _v._tag === "None"
          ? _done(acc)
          : _v._tag === "Some" && _v.value === "\\"
            ? _recur(i + 1, `${acc}\\\\`)
            : _v._tag === "Some" && _v.value === "`"
              ? _recur(i + 1, `${acc}\\\``)
              : _v._tag === "Some" &&
                  _v.value === "$" &&
                  _Option_contains("{", _Array_get(i + 1, chars))
                ? _recur(i + 2, `${acc}\\\${`)
                : _v._tag === "Some"
                  ? (({ value: c }) => _recur(i + 1, `${acc}${c}`))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(_Array_get(i, chars));
      if (_step._tag === "recur") {
        [i, acc] = _step.args;
        continue;
      }
      return _step.value;
    }
  },
);
const escapeTemplateLiteral: (s: string) => string = (s: string) =>
  escTemplateLoop(_Str_chars(s), 0, "");
const keyAt: _Curry<[ctx: GCtx, ctor: string, i: number], string> = _curry(
  3,
  (ctx: GCtx, ctor: string, i: number) =>
    ((_v) =>
      _v._tag === "Some"
        ? (({ value: ks }) => _Option_unwrapOr(`_${show(i)}`, _Array_get(i, ks)))(_v)
        : _v._tag === "None"
          ? `_${show(i)}`
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Map_get(ctor, ctx.keys)),
);
const nsRuntimeId: _Curry<[ctx: GCtx, target: Expr, name: string], Option<string>> = _curry(
  3,
  (ctx: GCtx, target: Expr, name: string) =>
    ((_v) =>
      _v._tag === "ERef"
        ? (({ name: refName }) =>
            ((_v) =>
              _v._tag === "Some"
                ? (({ value: members }) => _Map_get(name, members))(_v)
                : _v._tag === "None"
                  ? (None as Option<string>)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(_Map_get(refName, ctx.ns)))(_v)
        : (None as Option<string>))(target),
);
/**
 * `Set.empty` / `Map.empty` / `List.empty` lower to the same runtime as
 * `@{}` / `#{}` (ADR 0080). `ann` is the resolved element typing when the TS
 * backend supplies one — a bare `new Set()` infers `Set<never>` (ADR 0035).
 */
const emptyNsEmit: _Curry<
  [target: Expr, name: string, ann: Option<string>],
  Option<string>
> = _curry(3, (target: Expr, name: string, ann: Option<string>) =>
  ((_v) =>
    _v._tag === "ERef"
      ? (({ name: refName }) =>
          name === "empty"
            ? refName === "Set"
              ? (Some(emptyNsCtor("Set", ann)) as Option<string>)
              : refName === "Map"
                ? (Some(emptyNsCtor("Map", ann)) as Option<string>)
                : refName === "List"
                  ? (Some("_list(function* () {})") as Option<string>)
                  : (None as Option<string>)
            : (None as Option<string>))(_v)
      : (None as Option<string>))(target),
);
const isLabeledParam: (p: LamParam) => boolean = (p: LamParam) =>
  ((_v) =>
    _v._tag === "LPLabeled"
      ? true
      : _v._tag === "LPSpanned"
        ? (({ param: inner }) => isLabeledParam(inner))(_v)
        : false)(p);
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
const absorbParams: _Curry<
  [
    params: LamParam[],
    acc: LamParam[],
    fills: { labVar: string; labs: LamParam[] }[],
    labN: number,
  ],
  [LamParam[], { labVar: string; labs: LamParam[] }[], number]
> = _curry(
  4,
  (
    params: LamParam[],
    acc: LamParam[],
    fills: { labVar: string; labs: LamParam[] }[],
    labN: number,
  ) =>
    (([positional, labeled]: [LamParam[], LamParam[]]) => {
      const acc1: LamParam[] = _Array_concat(acc, positional);
      return ((_v) =>
        _v.length === 0
          ? _tuple(acc1, fills, labN)
          : ((labVar: string) =>
              _tuple(
                _Array_append(Ast.LPName(labVar, None as Option<TypeExpr>), acc1),
                _Array_append({ labVar: labVar, labs: labeled }, fills),
                labN + 1,
              ))(labN === 0 ? "$lab" : `$lab${show(labN)}`))(labeled);
    })(splitLamParams(params, [] as LamParam[], [] as LamParam[])),
);
const collapseLambdaFrom: _Curry<
  [
    params: LamParam[],
    body: Expr,
    acc: LamParam[],
    fills: { labVar: string; labs: LamParam[] }[],
    labN: number,
  ],
  [LamParam[], Expr, { labVar: string; labs: LamParam[] }[]]
> = _curry(
  5,
  (
    params: LamParam[],
    body: Expr,
    acc: LamParam[],
    fills: { labVar: string; labs: LamParam[] }[],
    labN: number,
  ) =>
    (([acc1, fills1, labN1]: [LamParam[], { labVar: string; labs: LamParam[] }[], number]) =>
      ((_v) =>
        _v._tag === "ELambda"
          ? (({ params: params2, body: body2 }) =>
              collapseLambdaFrom(params2, body2, acc1, fills1, labN1))(_v)
          : _tuple(acc1, body, fills1))(body))(absorbParams(params, acc, fills, labN)),
);
const collapseLambda: _Curry<
  [params: LamParam[], body: Expr],
  [LamParam[], Expr, { labVar: string; labs: LamParam[] }[]]
> = _curry(2, (params: LamParam[], body: Expr) =>
  collapseLambdaFrom(
    params,
    body,
    [] as LamParam[],
    [] as { labVar: string; labs: LamParam[] }[],
    0,
  ),
);
/**
 * A string, number or bool literal.
 */
const isPrimLit: (e: Expr) => boolean = (e: Expr) =>
  ((_v) =>
    _v._tag === "ENum" ? true : _v._tag === "EStr" ? true : _v._tag === "EBool" ? true : false)(e);
/**
 * Structural `eq` as a JavaScript comparison, where the two agree exactly
 * (ADR 0115): against a primitive literal it is `===`, and against a nullary
 * ctor (a bare `{ _tag }`) it is a tag test. `op` is `===` or `!==`.
 */
const eqTest: _Curry<[ctx: GCtx, left: Expr, right: Expr, op: string], Option<string>> = _curry(
  4,
  (ctx: GCtx, left: Expr, right: Expr, op: string) =>
    ((_v) =>
      _v[1]._tag === "ERef" &&
      (([, { name: c }]) => isNullaryCtor(c, ctx.keys))(
        _v as [[Expr, Expr][0], Extract<[Expr, Expr][1], { _tag: "ERef" }>],
      )
        ? (([, { name: c }]) =>
            Some(`(${genMember(ctx, left)}._tag ${op} "${c}")`) as Option<string>)(
            _v as [[Expr, Expr][0], Extract<[Expr, Expr][1], { _tag: "ERef" }>],
          )
        : _v[0]._tag === "ERef" &&
            (([{ name: c }]) => isNullaryCtor(c, ctx.keys))(
              _v as [Extract<[Expr, Expr][0], { _tag: "ERef" }>, [Expr, Expr][1]],
            )
          ? (([{ name: c }]) =>
              Some(`(${genMember(ctx, right)}._tag ${op} "${c}")`) as Option<string>)(
              _v as [Extract<[Expr, Expr][0], { _tag: "ERef" }>, [Expr, Expr][1]],
            )
          : or(isPrimLit(left), isPrimLit(right))
            ? (Some(`(${genExpr(ctx, left)} ${op} ${genExpr(ctx, right)})`) as Option<string>)
            : (None as Option<string>))(_tuple(left, right)),
);
/**
 * The calls whose saturated runtime behavior is exactly JavaScript's infix
 * behavior: the numeric operators, `not`, and the `eq` / `!=` cases of
 * `eqTest`. General `eq` is structural and `mod` is true modulo, so neither
 * belongs here. `and` / `or` evaluate both sides, unlike `&&` / `||`.
 */
const tsInfix: _Curry<[ctx: GCtx, fn: Expr, args: Expr[]], Option<string>> = _curry(
  3,
  (ctx: GCtx, fn: Expr, args: Expr[]) =>
    !ctx.preserveInfix
      ? (None as Option<string>)
      : ((_v) =>
          _v[0]._tag === "ERef" && _v[0].name === "eq" && _v[1].length === 2
            ? (([, [left, right]]) => eqTest(ctx, left, right, "==="))(
                _v as [Extract<[Expr, Expr[]][0], { _tag: "ERef" }>, [Expr, Expr[]][1]],
              )
            : _v[0]._tag === "ERef" && _v[0].name === "not" && _v[1].length === 1
              ? (([, [operand]]) =>
                  ((_v) =>
                    _v._tag === "ECall" &&
                    _v.fn._tag === "ERef" &&
                    _v.fn.name === "eq" &&
                    _v.args.length === 2
                      ? (({ args: [left, right] }) =>
                          ((_v) =>
                            _v._tag === "Some"
                              ? (({ value: test }) => Some(test) as Option<string>)(_v)
                              : _v._tag === "None"
                                ? (Some(`!(${genExpr(ctx, operand)})`) as Option<string>)
                                : (() => {
                                    throw new Error("non-exhaustive match");
                                  })())(eqTest(ctx, left, right, "!==")))(
                          _v as Extract<Expr, { _tag: "ECall" }> & {
                            fn: Extract<Extract<Expr, { _tag: "ECall" }>["fn"], { _tag: "ERef" }>;
                          },
                        )
                      : (Some(`!(${genExpr(ctx, operand)})`) as Option<string>))(operand))(
                  _v as [Extract<[Expr, Expr[]][0], { _tag: "ERef" }>, [Expr, Expr[]][1]],
                )
              : _v[0]._tag === "ERef" && _v[1].length === 2
                ? (([{ name }, [left, right]]) =>
                    ((_v) =>
                      _v === "add"
                        ? (Some(
                            `(${genExpr(ctx, left)} + ${genExpr(ctx, right)})`,
                          ) as Option<string>)
                        : _v === "sub"
                          ? (Some(
                              `(${genExpr(ctx, left)} - ${genExpr(ctx, right)})`,
                            ) as Option<string>)
                          : _v === "mul"
                            ? (Some(
                                `(${genExpr(ctx, left)} * ${genExpr(ctx, right)})`,
                              ) as Option<string>)
                            : _v === "div"
                              ? (Some(
                                  `(${genExpr(ctx, left)} / ${genExpr(ctx, right)})`,
                                ) as Option<string>)
                              : _v === "lt"
                                ? (Some(
                                    `(${genExpr(ctx, left)} < ${genExpr(ctx, right)})`,
                                  ) as Option<string>)
                                : _v === "lte"
                                  ? (Some(
                                      `(${genExpr(ctx, left)} <= ${genExpr(ctx, right)})`,
                                    ) as Option<string>)
                                  : _v === "gt"
                                    ? (Some(
                                        `(${genExpr(ctx, left)} > ${genExpr(ctx, right)})`,
                                      ) as Option<string>)
                                    : _v === "gte"
                                      ? (Some(
                                          `(${genExpr(ctx, left)} >= ${genExpr(ctx, right)})`,
                                        ) as Option<string>)
                                      : (None as Option<string>))(name))(
                    _v as [Extract<[Expr, Expr[]][0], { _tag: "ERef" }>, [Expr, Expr[]][1]],
                  )
                : (None as Option<string>))(_tuple(fn, args)),
);
const jsxHasSpread: (children: SeqElem[]) => boolean = (children: SeqElem[]) =>
  ((_v) =>
    _v.length === 0
      ? false
      : _v.length >= 1 && _v[0]._tag === "SESpread"
        ? true
        : _v.length >= 1
          ? (([, ...rest]) => jsxHasSpread(rest))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(children);
const jsxAttrs: _Curry<[ctx: GCtx, fields: Field[], spread: Option<Expr>], string> = _curry(
  3,
  (ctx: GCtx, fields: Field[], spread: Option<Expr>) => {
    const head: string = ((_v) =>
      _v._tag === "None"
        ? ""
        : _v._tag === "Some"
          ? (({ value }) => ` {...${genExpr(ctx, value)}}`)(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(spread);
    return `${head}${_Str_join(
      "",
      map(
        (f: Field) =>
          ((_v) =>
            _v._tag === "EBool" && _v.value === true
              ? ` ${f.name}`
              : ((value) => ` ${f.name}={${genExpr(ctx, value)}}`)(_v))(f.value),
        fields,
      ),
    )}`;
  },
);
/**
 * Re-fold only the parser's provenance-tagged `h(tag, props, children)`.
 * A source-written `h(...)` remains a call, and child spreads retain that
 * call form because JSX has no equivalent spread-child syntax.
 */
const tsxArgs: _Curry<[ctx: GCtx, args: Expr[]], Option<string>> = _curry(
  2,
  (ctx: GCtx, args: Expr[]) =>
    ((_v) =>
      _v.length === 3 && _v[1]._tag === "ERecord" && _v[2]._tag === "EArr"
        ? (([tag, { fields, spread }, { elements: children }]) =>
            jsxHasSpread(children)
              ? (None as Option<string>)
              : ((fragment: boolean) =>
                  ((name: string) =>
                    ((attrs: string) =>
                      and(length(children) === 0, !fragment)
                        ? (Some(`<${name}${attrs} />`) as Option<string>)
                        : ((body: string) =>
                            fragment
                              ? (Some(`<>${body}</>`) as Option<string>)
                              : (Some(`<${name}${attrs}>${body}</${name}>`) as Option<string>))(
                            _Str_join(
                              "",
                              map(
                                (child: SeqElem) =>
                                  ((_v) =>
                                    _v._tag === "SEExpr"
                                      ? (({ expr: value }) => `{${genExpr(ctx, value)}}`)(_v)
                                      : _v._tag === "SESpread"
                                        ? ""
                                        : (() => {
                                            throw new Error("non-exhaustive match");
                                          })())(child),
                                children,
                              ),
                            ),
                          ))(jsxAttrs(ctx, fields, spread)))(
                    fragment
                      ? ""
                      : ((_v) =>
                          _v._tag === "EStr" ? (({ value }) => value)(_v) : genMember(ctx, tag))(
                          tag,
                        ),
                  ))(
                  ((_v) => (_v._tag === "EStr" && _v.value === "Fragment" ? true : false))(tag),
                ))(
            _v as [
              Expr[][number],
              Extract<Expr[][number], { _tag: "ERecord" }>,
              Extract<Expr[][number], { _tag: "EArr" }>,
            ],
          )
        : (None as Option<string>))(args),
);
const tsxCall: _Curry<
  [ctx: GCtx, fn: Expr, args: Expr[], origin: Option<string>],
  Option<string>
> = _curry(4, (ctx: GCtx, fn: Expr, args: Expr[], origin: Option<string>) =>
  !ctx.preserveJsx
    ? (None as Option<string>)
    : ((_v) =>
        _v._tag === "Some" && _v.value === "jsx"
          ? ((_v) =>
              _v._tag === "ERef" && _v.name === "h"
                ? tsxArgs(ctx, args)
                : (None as Option<string>))(fn)
          : (None as Option<string>))(origin),
);
const genExpr: _Curry<[ctx: GCtx, e: Expr], string> = _curry(2, (ctx: GCtx, e: Expr) =>
  ((_v) =>
    _v._tag === "ENum"
      ? (({ raw }) => raw)(_v)
      : _v._tag === "EUnit"
        ? "undefined"
        : _v._tag === "EBool"
          ? (({ value }) => (value ? "true" : "false"))(_v)
          : _v._tag === "EStr"
            ? (({ value }) => jsStringLit(value))(_v)
            : _v._tag === "ERef"
              ? (({ name }) =>
                  castOr(
                    name,
                    isNullaryCtor(name, ctx.keys)
                      ? hook1(ctx.annotateEmpty, e)
                      : (None as Option<string>),
                  ))(_v)
              : _v._tag === "ECall"
                ? (({ fn, args, origin }) =>
                    ((_v) =>
                      _v._tag === "Some"
                        ? (({ value: jsx }) => jsx)(_v)
                        : _v._tag === "None"
                          ? ((_v) =>
                              _v._tag === "Some"
                                ? (({ value: infix }) => infix)(_v)
                                : _v._tag === "None"
                                  ? ((inner: string) =>
                                      castOr(
                                        inner,
                                        isCtorRef(fn)
                                          ? hook1(ctx.annotateCall, e)
                                          : (None as Option<string>),
                                      ))(
                                      `${genCallee(ctx, fn)}(${_Str_join(
                                        ", ",
                                        map((a: Expr) => genExpr(ctx, a), args),
                                      )})`,
                                    )
                                  : (() => {
                                      throw new Error("non-exhaustive match");
                                    })())(tsInfix(ctx, fn, args))
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(tsxCall(ctx, fn, args, origin)))(_v)
                : _v._tag === "ELambda"
                  ? (({ params, body, span: sp }) =>
                      (([cparams, cbody, fills]: [
                        LamParam[],
                        Expr,
                        { labVar: string; labs: LamParam[] }[],
                      ]) => {
                        const bound: Set<string> = fillNames(
                          fills,
                          paramNameSet(cparams, 0, _Set_fromArray([] as string[])),
                        );
                        const annots: ParamAnnots = paramAnnotsFor(
                          ctx.annotateParams,
                          sp,
                          length(cparams),
                        );
                        const arrow: string = `${annots.generics}(${_Str_join(", ", annotatedParams(cparams, annots.params, 0))}) => ${genLambdaBodyIn(ctx, cbody, bound, genFillDecls(ctx, fills))}`;
                        return length(cparams) >= 2
                          ? `_curry(${show(length(cparams))}, ${arrow})`
                          : arrow;
                      })(collapseLambda(params, body)))(_v)
                  : _v._tag === "ELetIn"
                    ? (({ name, value, body }) =>
                        ((param: string) =>
                          `((${param}) => ${genLambdaBody(ctx, body)})(${genExpr(ctx, value)})`)(
                          suffixOr(name, hook1(ctx.annotateLetin, value)),
                        ))(_v)
                    : _v._tag === "ELetBind"
                      ? (({ param, monad, value, body }) =>
                          ((rt: string) =>
                            ((f: string) =>
                              ((v: string) =>
                                ctx.flattenPipe ? `${rt}(${f}, ${v})` : `${rt}(${f})(${v})`)(
                                genExpr(ctx, value),
                              ))(`(${genParam(param)}) => ${genLambdaBody(ctx, body)}`))(
                            bindRuntime(monad),
                          ))(_v)
                      : _v._tag === "EPipe"
                        ? (({ left, right, fast, span: sp }) =>
                            fast
                              ? ((_v) =>
                                  _v._tag === "ECall"
                                    ? (({ fn: rfn, args: rargs, origin }) =>
                                        genExpr(
                                          ctx,
                                          Ast.ECall(rfn, _Array_prepend(left, rargs), origin, sp),
                                        ))(_v)
                                    : genExpr(
                                        ctx,
                                        Ast.ECall(right, [left], None as Option<string>, sp),
                                      ))(right)
                              : ((_v) =>
                                  _v._tag === "ECall" &&
                                  (({ fn: rfn, args: rargs }) => ctx.flattenPipe)(_v)
                                    ? (({ fn: rfn, args: rargs }) =>
                                        `${genCallee(ctx, rfn)}(${_Str_join(
                                          ", ",
                                          map(
                                            (a: Expr) => genExpr(ctx, a),
                                            _Array_append(left, rargs),
                                          ),
                                        )})`)(_v)
                                    : `${genCallee(ctx, right)}(${genExpr(ctx, left)})`)(right))(_v)
                        : _v._tag === "EDo"
                          ? (({ exprs }) => genDo(ctx, exprs))(_v)
                          : _v._tag === "ETernary"
                            ? (({ cond, thenE, elseE }) =>
                                `(${genExpr(ctx, cond)} ? ${genExpr(ctx, thenE)} : ${genExpr(ctx, elseE)})`)(
                                _v,
                              )
                            : _v._tag === "EMatch"
                              ? (({ scrutinee, arms }) => genMatch(ctx, scrutinee, arms))(_v)
                              : _v._tag === "ELoop"
                                ? (({ params, body }) =>
                                    `(() => { ${genLoopBlock(ctx, params, body)} })()`)(_v)
                                : _v._tag === "ERecur"
                                  ? (({ args }) =>
                                      `_recur(${_Str_join(
                                        ", ",
                                        map((a: Expr) => genExpr(ctx, a), args),
                                      )})`)(_v)
                                  : _v._tag === "ERecord"
                                    ? (({ fields, spread }) =>
                                        ((fieldStrs: string) =>
                                          ((_v) =>
                                            _v._tag === "None"
                                              ? length(fields) === 0
                                                ? "{}"
                                                : `{ ${fieldStrs} }`
                                              : _v._tag === "Some"
                                                ? (({ value: s }) =>
                                                    ((spreadStr: string) =>
                                                      length(fields) === 0
                                                        ? `{ ${spreadStr} }`
                                                        : `{ ${spreadStr}, ${fieldStrs} }`)(
                                                      `...${genExpr(ctx, s)}`,
                                                    ))(_v)
                                                : (() => {
                                                    throw new Error("non-exhaustive match");
                                                  })())(spread))(
                                          _Str_join(
                                            ", ",
                                            map(
                                              (f: Field) =>
                                                `${isJsIdent(f.name) ? f.name : jsStringLit(f.name)}: ${genExpr(ctx, f.value)}`,
                                              fields,
                                            ),
                                          ),
                                        ))(_v)
                                    : _v._tag === "EField"
                                      ? (({ target, name, optional }) =>
                                          ((_v) =>
                                            _v._tag === "Some"
                                              ? (({ value: js }) => js)(_v)
                                              : _v._tag === "None"
                                                ? ((_v) =>
                                                    _v._tag === "Some"
                                                      ? (({ value: rt }) => rt)(_v)
                                                      : _v._tag === "None"
                                                        ? ((member: string) =>
                                                            optional
                                                              ? `((v) => v != null ? { _tag: "Some", value: v } : { _tag: "None" })(${member})`
                                                              : member)(
                                                            `${genMember(ctx, target)}.${name}`,
                                                          )
                                                        : (() => {
                                                            throw new Error("non-exhaustive match");
                                                          })())(nsRuntimeId(ctx, target, name))
                                                : (() => {
                                                    throw new Error("non-exhaustive match");
                                                  })())(
                                            emptyNsEmit(target, name, hook1(ctx.annotateEmpty, e)),
                                          ))(_v)
                                      : _v._tag === "ETuple"
                                        ? (({ elements }) =>
                                            ((elems: string) =>
                                              ctx.tupleHelper ? `_tuple(${elems})` : `[${elems}]`)(
                                              _Str_join(
                                                ", ",
                                                map((el: Expr) => genExpr(ctx, el), elements),
                                              ),
                                            ))(_v)
                                        : _v._tag === "EArr"
                                          ? (({ elements }) =>
                                              ((body: string) =>
                                                castOr(
                                                  body,
                                                  length(elements) === 0
                                                    ? hook1(ctx.annotateEmpty, e)
                                                    : (None as Option<string>),
                                                ))(
                                                `[${_Str_join(
                                                  ", ",
                                                  map(
                                                    (el: SeqElem) => genSeqSlot(ctx, el),
                                                    elements,
                                                  ),
                                                )}]`,
                                              ))(_v)
                                          : _v._tag === "EList"
                                            ? (({ elements }) => genList(ctx, elements))(_v)
                                            : _v._tag === "ESet"
                                              ? (({ elements }) =>
                                                  `new Set([${_Str_join(
                                                    ", ",
                                                    map(
                                                      (el: SeqElem) => genSeqSlot(ctx, el),
                                                      elements,
                                                    ),
                                                  )}])`)(_v)
                                              : _v._tag === "EMap"
                                                ? (({ entries }) =>
                                                    ((_v) =>
                                                      _v._tag === "Some"
                                                        ? (({ value: t }) => `new ${t}()`)(_v)
                                                        : _v._tag === "None"
                                                          ? `new Map([${_Str_join(
                                                              ", ",
                                                              map(
                                                                (en: MapEntry) =>
                                                                  `[${genExpr(ctx, en.key)}, ${genExpr(ctx, en.value)}]`,
                                                                entries,
                                                              ),
                                                            )}])`
                                                          : (() => {
                                                              throw new Error(
                                                                "non-exhaustive match",
                                                              );
                                                            })())(
                                                      length(entries) === 0
                                                        ? hook1(ctx.annotateEmpty, e)
                                                        : (None as Option<string>),
                                                    ))(_v)
                                                : _v._tag === "EInterp"
                                                  ? (({ parts }) =>
                                                      ((body: string) => `\`${body}\``)(
                                                        _Str_join(
                                                          "",
                                                          map(
                                                            (p: InterpPart) =>
                                                              ((_v) =>
                                                                _v._tag === "IPLit"
                                                                  ? (({ value }) =>
                                                                      escapeTemplateLiteral(value))(
                                                                      _v,
                                                                    )
                                                                  : _v._tag === "IPExpr"
                                                                    ? (({ expr: ex }) =>
                                                                        `\${${genExpr(ctx, ex)}}`)(
                                                                        _v,
                                                                      )
                                                                    : (() => {
                                                                        throw new Error(
                                                                          "non-exhaustive match",
                                                                        );
                                                                      })())(p),
                                                            parts,
                                                          ),
                                                        ),
                                                      ))(_v)
                                                  : (() => {
                                                      throw new Error("non-exhaustive match");
                                                    })())(e),
);
const genDo: _Curry<[ctx: GCtx, exprs: Expr[]], string> = _curry(
  2,
  (ctx: GCtx, exprs: Expr[]) => `(() => { ${genDoSteps(ctx, exprs)} })()`,
);
const genDoSteps: _Curry<[ctx: GCtx, exprs: Expr[]], string> = _curry(
  2,
  (ctx: GCtx, exprs: Expr[]) =>
    ((_v) =>
      _v.length === 1
        ? (([last]) => `return ${genExpr(ctx, last)};`)(_v)
        : _v.length >= 1
          ? (([first, ...rest]) => `${genExpr(ctx, first)}; ${genDoSteps(ctx, rest)}`)(_v)
          : _v.length === 0
            ? 'throw new Error("empty do block");'
            : (() => {
                throw new Error("non-exhaustive match");
              })())(exprs),
);
const genSeqSlot: _Curry<[ctx: GCtx, el: SeqElem], string> = _curry(2, (ctx: GCtx, el: SeqElem) =>
  ((_v) =>
    _v._tag === "SEExpr"
      ? (({ expr: ex }) => genExpr(ctx, ex))(_v)
      : _v._tag === "SESpread"
        ? (({ expr: ex }) => `...${genExpr(ctx, ex)}`)(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(el),
);
const genList: _Curry<[ctx: GCtx, elements: SeqElem[]], string> = _curry(
  2,
  (ctx: GCtx, elements: SeqElem[]) => {
    const yields: string = _Str_join(
      " ",
      map(
        (el: SeqElem) =>
          ((_v) =>
            _v._tag === "SEExpr"
              ? (({ expr: ex }) => `yield (${genExpr(ctx, ex)});`)(_v)
              : _v._tag === "SESpread"
                ? (({ expr: ex }) => `yield* (${genExpr(ctx, ex)});`)(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(el),
        elements,
      ),
    );
    return `_list(function* () {${yields === "" ? "" : ` ${yields} `}})`;
  },
);
const genParam: (p: LamParam) => string = (p: LamParam) =>
  ((_v) =>
    _v._tag === "LPSpanned"
      ? (({ param: inner }) => genParam(inner))(_v)
      : _v._tag === "LPName"
        ? (({ name }) => name)(_v)
        : _v._tag === "LPTuple"
          ? (({ names }) => `[${_Str_join(", ", names)}]`)(_v)
          : _v._tag === "LPRecord"
            ? (({ fields }) => `{ ${_Str_join(", ", fields)} }`)(_v)
            : _v._tag === "LPLabeled"
              ? (({ name }) => name)(_v)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(p);
const genCallee: _Curry<[ctx: GCtx, e: Expr], string> = _curry(2, (ctx: GCtx, e: Expr) =>
  ((_v) => (_v._tag === "ELambda" ? `(${genExpr(ctx, e)})` : genExpr(ctx, e)))(e),
);
const genMember: _Curry<[ctx: GCtx, e: Expr], string> = _curry(2, (ctx: GCtx, e: Expr) =>
  ((_v) =>
    _v._tag === "ERecord"
      ? `(${genExpr(ctx, e)})`
      : _v._tag === "ELambda"
        ? `(${genExpr(ctx, e)})`
        : genExpr(ctx, e))(e),
);
const seqElemExpr: (el: SeqElem) => Expr = (el: SeqElem) =>
  ((_v) =>
    _v._tag === "SEExpr"
      ? (({ expr: e }) => e)(_v)
      : _v._tag === "SESpread"
        ? (({ expr: e }) => e)(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(el);
const hasRecur: (e: Expr) => boolean = (e: Expr) =>
  ((_v) =>
    _v._tag === "ERecur"
      ? true
      : _v._tag === "ELoop"
        ? false
        : _v._tag === "ELambda"
          ? false
          : _v._tag === "ELetBind"
            ? false
            : _v._tag === "EInterp"
              ? (({ parts }) =>
                  someOf(
                    (p: InterpPart) =>
                      ((_v) =>
                        _v._tag === "IPExpr"
                          ? (({ expr: x }) => hasRecur(x))(_v)
                          : _v._tag === "IPLit"
                            ? false
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(p),
                    parts,
                  ))(_v)
              : _v._tag === "ECall"
                ? (({ fn, args }) => or(hasRecur(fn), someOf(hasRecur, args)))(_v)
                : _v._tag === "ELetIn"
                  ? (({ value, body }) => or(hasRecur(value), hasRecur(body)))(_v)
                  : _v._tag === "EPipe"
                    ? (({ left, right }) => or(hasRecur(left), hasRecur(right)))(_v)
                    : _v._tag === "EDo"
                      ? (({ exprs }) => someOf(hasRecur, exprs))(_v)
                      : _v._tag === "ETernary"
                        ? (({ cond, thenE, elseE }) =>
                            or(hasRecur(cond), or(hasRecur(thenE), hasRecur(elseE))))(_v)
                        : _v._tag === "EMatch"
                          ? (({ scrutinee, arms }) =>
                              or(
                                hasRecur(scrutinee),
                                someOf(
                                  (a: MatchArm) =>
                                    or(
                                      ((_v) =>
                                        _v._tag === "Some"
                                          ? (({ value: g }) => hasRecur(g))(_v)
                                          : _v._tag === "None"
                                            ? false
                                            : (() => {
                                                throw new Error("non-exhaustive match");
                                              })())(a.guard),
                                      hasRecur(a.body),
                                    ),
                                  arms,
                                ),
                              ))(_v)
                          : _v._tag === "ERecord"
                            ? (({ fields, spread }) =>
                                or(
                                  ((_v) =>
                                    _v._tag === "Some"
                                      ? (({ value: sp }) => hasRecur(sp))(_v)
                                      : _v._tag === "None"
                                        ? false
                                        : (() => {
                                            throw new Error("non-exhaustive match");
                                          })())(spread),
                                  someOf((f: Field) => hasRecur(f.value), fields),
                                ))(_v)
                            : _v._tag === "EField"
                              ? (({ target }) => hasRecur(target))(_v)
                              : _v._tag === "ETuple"
                                ? (({ elements }) => someOf(hasRecur, elements))(_v)
                                : _v._tag === "EArr"
                                  ? (({ elements }) =>
                                      someOf((el: SeqElem) => hasRecur(seqElemExpr(el)), elements))(
                                      _v,
                                    )
                                  : _v._tag === "EList"
                                    ? (({ elements }) =>
                                        someOf(
                                          (el: SeqElem) => hasRecur(seqElemExpr(el)),
                                          elements,
                                        ))(_v)
                                    : _v._tag === "ESet"
                                      ? (({ elements }) =>
                                          someOf(
                                            (el: SeqElem) => hasRecur(seqElemExpr(el)),
                                            elements,
                                          ))(_v)
                                      : _v._tag === "EMap"
                                        ? (({ entries }) =>
                                            someOf(
                                              (en: MapEntry) =>
                                                or(hasRecur(en.key), hasRecur(en.value)),
                                              entries,
                                            ))(_v)
                                        : false)(e);
const loopNeedsStep: (e: Expr) => boolean = (e: Expr) =>
  ((_v) =>
    _v._tag === "ETernary"
      ? (({ thenE, elseE }) => or(loopNeedsStep(thenE), loopNeedsStep(elseE)))(_v)
      : _v._tag === "ELetIn"
        ? (({ body }) => loopNeedsStep(body))(_v)
        : _v._tag === "EDo"
          ? (({ exprs }) => loopNeedsStep(lastDoExpr(exprs)))(_v)
          : _v._tag === "EMatch"
            ? hasRecur(e)
            : false)(e);
const lastDoExpr: (exprs: Expr[]) => Expr = (exprs: Expr[]) =>
  ((_v) =>
    _v.length === 1
      ? (([last]) => last)(_v)
      : _v.length >= 1
        ? (([, ...rest]) => lastDoExpr(rest))(_v)
        : _v.length === 0
          ? Ast.EUnit({ start: 0, end: 0 })
          : (() => {
              throw new Error("non-exhaustive match");
            })())(exprs);
const wrapStepTails: _Curry<[e: Expr, sp: SpanAt], Expr> = _curry(2, (e: Expr, sp: SpanAt) =>
  ((_v) =>
    _v._tag === "ERecur"
      ? e
      : _v._tag === "ETernary"
        ? (({ cond, thenE, elseE, span: tsp }) =>
            Ast.ETernary(cond, wrapStepTails(thenE, sp), wrapStepTails(elseE, sp), tsp))(_v)
        : _v._tag === "ELetIn"
          ? (({ name, nameSpan, annot, value, body, span: lsp }) =>
              Ast.ELetIn(name, nameSpan, annot, value, wrapStepTails(body, sp), lsp))(_v)
          : _v._tag === "EDo"
            ? (({ exprs, span: dsp }) => Ast.EDo(wrapDoStepTail(exprs, sp), dsp))(_v)
            : _v._tag === "EMatch"
              ? (({ scrutinee, arms, span: msp }) =>
                  Ast.EMatch(
                    scrutinee,
                    map(
                      (a: MatchArm) => ({
                        pattern: a.pattern,
                        guard: a.guard,
                        body: wrapStepTails(a.body, sp),
                      }),
                      arms,
                    ),
                    msp,
                  ))(_v)
              : Ast.ECall(Ast.ERef("_done", sp), [e], None as Option<string>, sp))(e),
);
const wrapDoStepTail: _Curry<[exprs: Expr[], sp: SpanAt], Expr[]> = _curry(
  2,
  (exprs: Expr[], sp: SpanAt) =>
    ((_v) =>
      _v.length === 1
        ? (([last]) => [wrapStepTails(last, sp)])(_v)
        : _v.length >= 1
          ? (([first, ...rest]) => [first, ...wrapDoStepTail(rest, sp)])(_v)
          : _v.length === 0
            ? ([] as Expr[])
            : (() => {
                throw new Error("non-exhaustive match");
              })())(exprs),
);
const loopParamNames: <A>(params: ({ name: string } & A)[]) => string = <A>(
  params: ({ name: string } & A)[],
) =>
  _Str_join(
    ", ",
    map((p: { name: string } & A) => p.name, params),
  );
const genLoopTail: _Curry<[ctx: GCtx, e: Expr, params: LoopParam[]], string> = _curry(
  3,
  (ctx: GCtx, e: Expr, params: LoopParam[]) =>
    ((_v) =>
      _v._tag === "ERecur"
        ? (({ args }) =>
            ((_v) =>
              _v[0].length === 1 && _v[1].length === 1
                ? (([[p], [a]]) => `${p.name} = ${genExpr(ctx, a)}; continue;`)(_v)
                : `[${loopParamNames(params)}] = [${_Str_join(
                    ", ",
                    map((a: Expr) => genExpr(ctx, a), args),
                  )}]; continue;`)(_tuple(params, args)))(_v)
        : _v._tag === "ETernary"
          ? (({ cond, thenE, elseE }) =>
              hasRecur(e)
                ? `if (${genExpr(ctx, cond)}) { ${genLoopTail(ctx, thenE, params)} } else { ${genLoopTail(ctx, elseE, params)} }`
                : `return ${genExpr(ctx, e)};`)(_v)
          : _v._tag === "ELetIn"
            ? (({ name, value, body }) =>
                hasRecur(e)
                  ? `{ const ${suffixOr(name, hook1(ctx.annotateLetin, value))} = ${genExpr(ctx, value)}; ${genLoopTail(ctx, body, params)} }`
                  : `return ${genExpr(ctx, e)};`)(_v)
            : _v._tag === "EDo"
              ? (({ exprs }) =>
                  hasRecur(e)
                    ? `{ ${genDoLoopTail(ctx, exprs, params)} }`
                    : `return ${genExpr(ctx, e)};`)(_v)
              : _v._tag === "EMatch"
                ? (({ span: sp }) =>
                    hasRecur(e)
                      ? ((step: string) =>
                          ((rebind: string) =>
                            `const _step = ${step}; if (_step._tag === ${jsStringLit("recur")}) { ${rebind} continue; } return _step.value;`)(
                            ((_v) =>
                              _v.length === 1
                                ? (([p]) => `${p.name} = _step.args[0];`)(_v)
                                : `[${loopParamNames(params)}] = _step.args;`)(params),
                          ))(genExpr(ctx, wrapStepTails(e, sp)))
                      : `return ${genExpr(ctx, e)};`)(_v)
                : `return ${genExpr(ctx, e)};`)(e),
);
const genDoLoopTail: _Curry<[ctx: GCtx, exprs: Expr[], params: LoopParam[]], string> = _curry(
  3,
  (ctx: GCtx, exprs: Expr[], params: LoopParam[]) =>
    ((_v) =>
      _v.length === 1
        ? (([last]) => genLoopTail(ctx, last, params))(_v)
        : _v.length >= 1
          ? (([first, ...rest]) => `${genExpr(ctx, first)}; ${genDoLoopTail(ctx, rest, params)}`)(
              _v,
            )
          : _v.length === 0
            ? "return undefined;"
            : (() => {
                throw new Error("non-exhaustive match");
              })())(exprs),
);
const genLoopBlock: _Curry<[ctx: GCtx, params: LoopParam[], body: Expr], string> = _curry(
  3,
  (ctx: GCtx, params: LoopParam[], body: Expr) => {
    const decls: string = _Str_join(
      " ",
      map(
        (p: LoopParam) =>
          `let ${suffixOr(p.name, hook1(ctx.annotateLetin, p.init))} = ${genExpr(ctx, p.init)};`,
        params,
      ),
    );
    return `${decls} while (true) { ${genLoopTail(ctx, body, params)} }`;
  },
);
const loopParamFree: <A, B>(params: ({ name: A } & B)[], i: number, seen: Set<A>) => boolean =
  _curry(3, <A, B>(params: ({ name: A } & B)[], i: number, seen: Set<A>) =>
    ((_v) =>
      _v._tag === "None"
        ? true
        : _v._tag === "Some"
          ? (({ value: p }) =>
              _Set_has(p.name, seen) ? false : loopParamFree(params, i + 1, seen))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, params)),
  );
const genLambdaBody: _Curry<[ctx: GCtx, e: Expr], string> = _curry(2, (ctx: GCtx, e: Expr) =>
  ((_v) => (_v._tag === "ERecord" ? `(${genExpr(ctx, e)})` : genExpr(ctx, e)))(e),
);
const paramNames: (p: LamParam) => string[] = (p: LamParam) =>
  ((_v) =>
    _v._tag === "LPSpanned"
      ? (({ param: inner }) => paramNames(inner))(_v)
      : _v._tag === "LPName"
        ? (({ name }) => [name])(_v)
        : _v._tag === "LPTuple"
          ? (({ names }) => names)(_v)
          : _v._tag === "LPRecord"
            ? (({ fields }) => fields)(_v)
            : _v._tag === "LPLabeled"
              ? (({ name }) => [name])(_v)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(p);
const genLabeledFill: _Curry<[ctx: GCtx, labVar: string, lab: LamParam], string> = _curry(
  3,
  (ctx: GCtx, labVar: string, lab: LamParam) =>
    ((_v) =>
      _v._tag === "LPSpanned"
        ? (({ param: inner }) => genLabeledFill(ctx, labVar, inner))(_v)
        : _v._tag === "LPLabeled"
          ? (({ name, optional, defaultValue }) =>
              ((access: string) =>
                ((_v) =>
                  _v._tag === "Some"
                    ? (({ value: d }) =>
                        `const ${name} = ${access} != null ? ${access} : ${genExpr(ctx, d)};`)(_v)
                    : _v._tag === "None"
                      ? optional
                        ? `const ${name} = ${access} != null ? { _tag: "Some", value: ${access} } : { _tag: "None" };`
                        : `const ${name} = ${access};`
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(defaultValue))(`(${labVar} ?? {}).${name}`))(_v)
          : "")(lab),
);
const genFillDecls: _Curry<[ctx: GCtx, fills: { labVar: string; labs: LamParam[] }[]], string> =
  _curry(2, (ctx: GCtx, fills: { labVar: string; labs: LamParam[] }[]) =>
    ((_v) =>
      _v.length === 0
        ? ""
        : `${_Str_join(
            " ",
            map(
              (g: { labVar: string; labs: LamParam[] }) =>
                _Str_join(
                  " ",
                  map((lab: LamParam) => genLabeledFill(ctx, g.labVar, lab), g.labs),
                ),
              fills,
            ),
          )} `)(fills),
  );
const fillNames: <A>(fills: ({ labs: LamParam[] } & A)[], acc: Set<string>) => Set<string> = _curry(
  2,
  <A>(fills: ({ labs: LamParam[] } & A)[], acc: Set<string>) =>
    match(fills)
      .with(
        (_v) => _v.length === 0,
        () => acc,
      )
      .with(
        (_v) => _v.length >= 1,
        ([g, ...rest]) =>
          fillNames(
            rest,
            reduce(
              _curry(2, (s: Set<string>, lab: LamParam) =>
                ((_v) =>
                  _v._tag === "LPSpanned"
                    ? (({ param: inner }) =>
                        ((_v) =>
                          _v._tag === "LPLabeled" ? (({ name }) => _Set_add(name, s))(_v) : s)(
                          inner,
                        ))(_v)
                    : _v._tag === "LPLabeled"
                      ? (({ name }) => _Set_add(name, s))(_v)
                      : s)(lab),
              ),
              acc,
              g.labs,
            ),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const addNames: <A>(names: A[], i: number, acc: Set<A>) => Set<A> = _curry(
  3,
  <A>(names: A[], i: number, acc: Set<A>) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some"
          ? (({ value: n }) => addNames(names, i + 1, _Set_add(n, acc)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, names)),
);
const paramNameSet: _Curry<[params: LamParam[], i: number, acc: Set<string>], Set<string>> = _curry(
  3,
  (params: LamParam[], i: number, acc: Set<string>) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some"
          ? (({ value: p }) => paramNameSet(params, i + 1, addNames(paramNames(p), 0, acc)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, params)),
);
const letBlockLoop: _Curry<
  [ctx: GCtx, e: Expr, seen: Set<string>, decls: string[]],
  [string[], Expr, Set<string>]
> = _curry(4, (ctx: GCtx, e: Expr, seen: Set<string>, decls: string[]) =>
  ((_v) =>
    _v._tag === "ELetIn"
      ? (({ name, value, body }) =>
          or(
            _Set_has(name, seen),
            ((_v) =>
              _v._tag === "ELambda"
                ? false
                : _Set_has(name, exprRefs(ctx, value, _Set_fromArray([] as string[]))))(value),
          )
            ? _tuple(decls, e, seen)
            : letBlockLoop(
                ctx,
                body,
                _Set_add(name, seen),
                _Array_append(
                  `const ${suffixOr(name, hook1(ctx.annotateLetin, value))} = ${genExpr(ctx, value)};`,
                  decls,
                ),
              ))(_v)
      : _tuple(decls, e, seen))(e),
);
const genLambdaBodyIn: _Curry<[ctx: GCtx, e: Expr, bound: Set<string>, prefix: string], string> =
  _curry(4, (ctx: GCtx, e: Expr, bound: Set<string>, prefix: string) =>
    (([decls, rest, seen]: [string[], Expr, Set<string>]) =>
      length(decls) === 0
        ? ((_v) =>
            _v._tag === "ELoop"
              ? (({ params, body }) =>
                  loopParamFree(params, 0, bound)
                    ? `{ ${prefix}${genLoopBlock(ctx, params, body)} }`
                    : prefix === ""
                      ? genLambdaBody(ctx, e)
                      : `{ ${prefix}return ${genLambdaBody(ctx, e)}; }`)(_v)
              : prefix === ""
                ? genLambdaBody(ctx, e)
                : `{ ${prefix}return ${genLambdaBody(ctx, e)}; }`)(e)
        : ((block: string) =>
            ((_v) =>
              _v._tag === "ELoop"
                ? (({ params, body }) =>
                    loopParamFree(params, 0, seen)
                      ? `{ ${prefix}${block} ${genLoopBlock(ctx, params, body)} }`
                      : `{ ${prefix}${block} return ${genExpr(ctx, rest)}; }`)(_v)
                : `{ ${prefix}${block} return ${genExpr(ctx, rest)}; }`)(rest))(
            _Str_join(" ", decls),
          ))(letBlockLoop(ctx, e, bound, [] as string[])),
  );
const isCatchAll: (p: Pattern) => boolean = (p: Pattern) =>
  ((_v) =>
    _v._tag === "PAs"
      ? (({ pat }) => isCatchAll(pat))(_v)
      : _v._tag === "PWild"
        ? true
        : _v._tag === "PUnit"
          ? true
          : _v._tag === "PBind"
            ? true
            : _v._tag === "PRecord"
              ? (({ fields }) => allOf((f: PatField) => isCatchAll(f.pat), fields))(_v)
              : _v._tag === "PTuple"
                ? (({ elems }) => allOf(isCatchAll, elems))(_v)
                : _v._tag === "PArr"
                  ? (({ elems, rest }) => and(length(elems) === 0, _Option_isSome(rest)))(_v)
                  : _v._tag === "PList"
                    ? (({ elems, rest }) => and(length(elems) === 0, _Option_isSome(rest)))(_v)
                    : false)(p);
const isPList: (p: Pattern) => boolean = (p: Pattern) =>
  ((_v) => (_v._tag === "PList" ? true : false))(p);
const keyedSlot: _Curry<[key: string, sub: string], string> = _curry(
  2,
  (key: string, sub: string) => (eq(sub, key) ? key : `${key}: ${sub}`),
);
const pctorEntries: _Curry<[ctx: GCtx, ctor: string, args: Pattern[], i: number], string[]> =
  _curry(4, (ctx: GCtx, ctor: string, args: Pattern[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: a }) =>
              ((s: string) =>
                ((restEntries: string[]) =>
                  s === ""
                    ? restEntries
                    : _Array_prepend(keyedSlot(keyAt(ctx, ctor, i), s), restEntries))(
                  pctorEntries(ctx, ctor, args, i + 1),
                ))(patSlot(ctx, a)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, args)),
  );
const precordEntries: _Curry<[ctx: GCtx, fields: PatField[], i: number], string[]> = _curry(
  3,
  (ctx: GCtx, fields: PatField[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: f }) =>
              ((s: string) =>
                ((restEntries: string[]) =>
                  s === "" ? restEntries : _Array_prepend(keyedSlot(f.label, s), restEntries))(
                  precordEntries(ctx, fields, i + 1),
                ))(patSlot(ctx, f.pat)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, fields)),
);
const patSlot: _Curry<[ctx: GCtx, p: Pattern], string> = _curry(2, (ctx: GCtx, p: Pattern) =>
  ((_v) =>
    _v._tag === "PAs"
      ? (({ pat, name }) =>
          ((inner: string) => (inner === "" ? name : `${inner}, ${name}`))(patSlot(ctx, pat)))(_v)
      : _v._tag === "PBind"
        ? (({ name }) => name)(_v)
        : _v._tag === "PWild"
          ? ""
          : _v._tag === "PUnit"
            ? ""
            : _v._tag === "PLit"
              ? ""
              : _v._tag === "PBool"
                ? ""
                : _v._tag === "PStr"
                  ? ""
                  : _v._tag === "PList"
                    ? ""
                    : _v._tag === "PCtor"
                      ? (({ ctor, args }) =>
                          ((entries: string[]) =>
                            length(entries) === 0 ? "" : `{ ${_Str_join(", ", entries)} }`)(
                            pctorEntries(ctx, ctor, args, 0),
                          ))(_v)
                      : _v._tag === "PRecord"
                        ? (({ fields }) =>
                            ((entries: string[]) =>
                              length(entries) === 0 ? "" : `{ ${_Str_join(", ", entries)} }`)(
                              precordEntries(ctx, fields, 0),
                            ))(_v)
                        : _v._tag === "PTuple"
                          ? (({ elems }) =>
                              ((slots: string[]) =>
                                someOf((s: string) => s !== "", slots)
                                  ? `[${_Str_join(", ", slots)}]`
                                  : "")(map((el: Pattern) => patSlot(ctx, el), elems)))(_v)
                          : _v._tag === "PArr"
                            ? (({ elems, rest }) =>
                                ((slots: string[]) =>
                                  ((slots2: string[]) =>
                                    someOf((s: string) => s !== "", slots2)
                                      ? `[${_Str_join(", ", slots2)}]`
                                      : "")(
                                    ((_v) =>
                                      _v._tag === "Some" && _v.value._tag === "PBind"
                                        ? (({ value: { name } }) =>
                                            _Array_append(`...${name}`, slots))(
                                            _v as Extract<Option<Pattern>, { _tag: "Some" }> & {
                                              value: Extract<
                                                Extract<Option<Pattern>, { _tag: "Some" }>["value"],
                                                { _tag: "PBind" }
                                              >;
                                            },
                                          )
                                        : slots)(rest),
                                  ))(map((el: Pattern) => patSlot(ctx, el), elems)))(_v)
                            : _v._tag === "POr"
                              ? (({ alts }) =>
                                  ((_v) =>
                                    _v._tag === "Some"
                                      ? (({ value: first }) => patSlot(ctx, first))(_v)
                                      : _v._tag === "None"
                                        ? ""
                                        : (() => {
                                            throw new Error("non-exhaustive match");
                                          })())(_Array_head(alts)))(_v)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(p),
);
const pctorConds: _Curry<
  [ctx: GCtx, ctor: string, args: Pattern[], i: number, path: string],
  string[]
> = _curry(5, (ctx: GCtx, ctor: string, args: Pattern[], i: number, path: string) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: a }) =>
            _Array_concat(
              patConds(ctx, a, `${path}.${keyAt(ctx, ctor, i)}`),
              pctorConds(ctx, ctor, args, i + 1, path),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, args)),
);
const precordConds: _Curry<[ctx: GCtx, fields: PatField[], i: number, path: string], string[]> =
  _curry(4, (ctx: GCtx, fields: PatField[], i: number, path: string) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: f }) =>
              _Array_concat(
                patConds(ctx, f.pat, `${path}.${f.label}`),
                precordConds(ctx, fields, i + 1, path),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, fields)),
  );
const ptupleConds: _Curry<[ctx: GCtx, elems: Pattern[], i: number, path: string], string[]> =
  _curry(4, (ctx: GCtx, elems: Pattern[], i: number, path: string) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: el }) =>
              _Array_concat(
                patConds(ctx, el, `${path}[${show(i)}]`),
                ptupleConds(ctx, elems, i + 1, path),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, elems)),
  );
const parrConds: _Curry<[ctx: GCtx, elems: Pattern[], i: number, path: string], string[]> = _curry(
  4,
  (ctx: GCtx, elems: Pattern[], i: number, path: string) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: el }) =>
              _Array_concat(
                patConds(ctx, el, `${path}[${show(i)}]`),
                parrConds(ctx, elems, i + 1, path),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, elems)),
);
const patConds: _Curry<[ctx: GCtx, p: Pattern, path: string], string[]> = _curry(
  3,
  (ctx: GCtx, p: Pattern, path: string) =>
    ((_v) =>
      _v._tag === "PAs"
        ? (({ pat }) => patConds(ctx, pat, path))(_v)
        : _v._tag === "PWild"
          ? ([] as string[])
          : _v._tag === "PUnit"
            ? ([] as string[])
            : _v._tag === "PBind"
              ? ([] as string[])
              : _v._tag === "PList"
                ? ([] as string[])
                : _v._tag === "PLit"
                  ? [`${path} === ${litValue(p)}`]
                  : _v._tag === "PBool"
                    ? [`${path} === ${litValue(p)}`]
                    : _v._tag === "PStr"
                      ? [`${path} === ${litValue(p)}`]
                      : _v._tag === "PCtor"
                        ? (({ ctor, args }) =>
                            _Array_prepend(
                              `${path}._tag === ${jsStringLit(ctor)}`,
                              pctorConds(ctx, ctor, args, 0, path),
                            ))(_v)
                        : _v._tag === "PRecord"
                          ? (({ fields }) => precordConds(ctx, fields, 0, path))(_v)
                          : _v._tag === "PTuple"
                            ? (({ elems }) => ptupleConds(ctx, elems, 0, path))(_v)
                            : _v._tag === "PArr"
                              ? (({ elems, rest }) =>
                                  _Array_prepend(
                                    `${path}.length ${_Option_isSome(rest) ? ">=" : "==="} ${show(length(elems))}`,
                                    parrConds(ctx, elems, 0, path),
                                  ))(_v)
                              : _v._tag === "POr"
                                ? (({ alts }) =>
                                    ((altCond: (a: Pattern) => string) => [
                                      _Str_join(
                                        " || ",
                                        map((alt: Pattern) => `(${altCond(alt)})`, alts),
                                      ),
                                    ])((alt: Pattern) => {
                                      const conds: string[] = patConds(ctx, alt, path);
                                      return length(conds) === 0
                                        ? "true"
                                        : _Str_join(
                                            " && ",
                                            map((c: string) => `(${c})`, conds),
                                          );
                                    }))(_v)
                                : (() => {
                                    throw new Error("non-exhaustive match");
                                  })())(p),
);
const catchAllParam: _Curry<[ctx: GCtx, p: Pattern], string> = _curry(2, (ctx: GCtx, p: Pattern) =>
  ((_v) =>
    _v._tag === "PArr"
      ? (({ rest }) =>
          ((_v) =>
            _v._tag === "Some" && _v.value._tag === "PBind"
              ? (({ value: { name } }) => `(${name})`)(
                  _v as Extract<Option<Pattern>, { _tag: "Some" }> & {
                    value: Extract<
                      Extract<Option<Pattern>, { _tag: "Some" }>["value"],
                      { _tag: "PBind" }
                    >;
                  },
                )
              : "()")(rest))(_v)
      : _v._tag === "PList"
        ? (({ rest }) =>
            ((_v) =>
              _v._tag === "Some" && _v.value._tag === "PBind"
                ? (({ value: { name } }) => `(${name})`)(
                    _v as Extract<Option<Pattern>, { _tag: "Some" }> & {
                      value: Extract<
                        Extract<Option<Pattern>, { _tag: "Some" }>["value"],
                        { _tag: "PBind" }
                      >;
                    },
                  )
                : "()")(rest))(_v)
        : ((slot: string) => (slot === "" ? "()" : `(${slot})`))(patSlot(ctx, p)))(p),
);
const isListMatch: <A>(arms: ({ pattern: Pattern } & A)[]) => boolean = <A>(
  arms: ({ pattern: Pattern } & A)[],
) => someOf((a: { pattern: Pattern } & A) => and(isPList(a.pattern), !isCatchAll(a.pattern)), arms);
const listTail: <A>(from: A) => string = <A>(from: A) =>
  concat(
    concat(
      concat("_list(function* () { for (let _i = ", show(from)),
      "; _i < _b.length; _i++) yield _b[_i]; ",
    ),
    "if (!_done) { let _s; while (!(_s = _it.next()).done) yield _s.value; } })",
  );
const listArmGuards: _Curry<[ctx: GCtx, elems: Pattern[], i: number], string[]> = _curry(
  3,
  (ctx: GCtx, elems: Pattern[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: el }) =>
              _Array_concat(patConds(ctx, el, `_b[${show(i)}]`), listArmGuards(ctx, elems, i + 1)))(
              _v,
            )
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, elems)),
);
const listArmBinds: _Curry<[ctx: GCtx, elems: Pattern[], i: number], [string[], string[]]> = _curry(
  3,
  (ctx: GCtx, elems: Pattern[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? _tuple([] as string[], [] as string[])
        : _v._tag === "Some"
          ? (({ value: el }) =>
              (([restParams, restArgs]: [string[], string[]]) => {
                const slot: string = patSlot(ctx, el);
                return slot === ""
                  ? _tuple(restParams, restArgs)
                  : _tuple(
                      _Array_prepend(slot, restParams),
                      _Array_prepend(`_b[${show(i)}]`, restArgs),
                    );
              })(listArmBinds(ctx, elems, i + 1)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, elems)),
);
const genListArm: _Curry<[ctx: GCtx, p: Pattern, body: Expr], string> = _curry(
  3,
  (ctx: GCtx, p: Pattern, body: Expr) =>
    ((_v) =>
      _v._tag === "PList"
        ? (({ elems, rest }) =>
            ((n: number) =>
              ((guards: string[]) =>
                ((head: string) =>
                  ((cond: string) =>
                    (([params0, args0]: [string[], string[]]) =>
                      (([params, args]: [string[], string[]]) =>
                        `  if (${cond}) return ((${_Str_join(", ", params)}) => ${genLambdaBody(ctx, body)})(${_Str_join(", ", args)});`)(
                        ((_v) =>
                          _v._tag === "Some" && _v.value._tag === "PBind"
                            ? (({ value: { name } }) =>
                                _tuple(
                                  _Array_append(name, params0),
                                  _Array_append(listTail(n), args0),
                                ))(
                                _v as Extract<Option<Pattern>, { _tag: "Some" }> & {
                                  value: Extract<
                                    Extract<Option<Pattern>, { _tag: "Some" }>["value"],
                                    { _tag: "PBind" }
                                  >;
                                },
                              )
                            : _tuple(params0, args0))(rest),
                      ))(listArmBinds(ctx, elems, 0)))(
                    _Str_join(" && ", _Array_prepend(head, guards)),
                  ))(
                  _Option_isSome(rest)
                    ? `_pull(${show(n)})`
                    : `!_pull(${show(n + 1)}) && _b.length === ${show(n)}`,
                ))(listArmGuards(ctx, elems, 0)))(length(elems)))(_v)
        : "")(p),
);
const listMatchLoop: _Curry<[ctx: GCtx, arms: MatchArm[], i: number], [string[], string]> = _curry(
  3,
  (ctx: GCtx, arms: MatchArm[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? _tuple(
            [] as string[],
            '(() => { throw new Error("non-exhaustive lazy-list switch"); })()',
          )
        : _v._tag === "Some"
          ? (({ value: a }) =>
              and(isPList(a.pattern), !isCatchAll(a.pattern))
                ? (([restLines, fallback]: [string[], string]) =>
                    _tuple(
                      _Array_prepend(genListArm(ctx, a.pattern, a.body), restLines),
                      fallback,
                    ))(listMatchLoop(ctx, arms, i + 1))
                : isCatchAll(a.pattern)
                  ? ((restName: Option<string>) =>
                      ((fallback: string) => _tuple([] as string[], fallback))(
                        ((_v) =>
                          _v._tag === "Some"
                            ? (({ value: name }) =>
                                `((${name}) => ${genLambdaBody(ctx, a.body)})(${listTail(0)})`)(_v)
                            : _v._tag === "None"
                              ? genExpr(ctx, a.body)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(restName),
                      ))(
                      ((_v) =>
                        _v._tag === "PList" &&
                        _v.rest._tag === "Some" &&
                        _v.rest.value._tag === "PBind"
                          ? (({
                              rest: {
                                value: { name },
                              },
                            }) => Some(name) as Option<string>)(
                              _v as Extract<Pattern, { _tag: "PList" }> & {
                                rest: Extract<
                                  Extract<Pattern, { _tag: "PList" }>["rest"],
                                  { _tag: "Some" }
                                > & {
                                  value: Extract<
                                    Extract<
                                      Extract<Pattern, { _tag: "PList" }>["rest"],
                                      { _tag: "Some" }
                                    >["value"],
                                    { _tag: "PBind" }
                                  >;
                                };
                              },
                            )
                          : (None as Option<string>))(a.pattern),
                    )
                  : listMatchLoop(ctx, arms, i + 1))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, arms)),
);
const genListMatch: _Curry<[ctx: GCtx, scrutinee: Expr, arms: MatchArm[]], string> = _curry(
  3,
  (ctx: GCtx, scrutinee: Expr, arms: MatchArm[]) =>
    (([armLines, fallback]: [string[], string]) =>
      concat(
        concat(
          concat(
            concat(
              concat(
                concat(
                  concat(
                    concat(
                      "((_it) => { const _b = []; let _done = false; ",
                      "const _pull = (_n) => { while (_b.length < _n && !_done) { const _s = _it.next(); ",
                    ),
                    "if (_s.done) _done = true; else _b.push(_s.value); } return _b.length >= _n; };\n",
                  ),
                  _Str_join("\n", armLines),
                ),
                "\n  return ",
              ),
              fallback,
            ),
            ";\n})(",
          ),
          genExpr(ctx, scrutinee),
        ),
        "[Symbol.iterator]())",
      ))(listMatchLoop(ctx, arms, 0)),
);
const matchArmsLoop: _Curry<
  [ctx: GCtx, arms: MatchArm[], i: number, base: Option<string>],
  [string[], Option<[Pattern, Expr]>]
> = _curry(4, (ctx: GCtx, arms: MatchArm[], i: number, base: Option<string>) =>
  ((_v) =>
    _v._tag === "None"
      ? _tuple([] as string[], None as Option<[Pattern, Expr]>)
      : _v._tag === "Some"
        ? (({ value: a }) =>
            (([restLines, restCatch]: [string[], Option<[Pattern, Expr]>]) =>
              ((_v) =>
                _v._tag === "Some"
                  ? (({ value: g }) =>
                      _tuple(
                        _Array_prepend(
                          `  ${genGuardArm(ctx, a.pattern, a.body, Some(g) as Option<Expr>, base)}`,
                          restLines,
                        ),
                        restCatch,
                      ))(_v)
                  : _v._tag === "None"
                    ? isCatchAll(a.pattern)
                      ? _tuple(
                          restLines,
                          Some(_tuple(a.pattern, a.body)) as Option<[Pattern, Expr]>,
                        )
                      : _tuple(
                          _Array_prepend(
                            `  ${genWithArm(ctx, a.pattern, a.body, base)}`,
                            restLines,
                          ),
                          restCatch,
                        )
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(a.guard))(matchArmsLoop(ctx, arms, i + 1, base)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, arms)),
);
/**
 * Any eager-array arm? Decides the ADR 0038 close-out below.
 */
const hasArrArm: <A>(arms: ({ pattern: Pattern } & A)[]) => boolean = <A>(
  arms: ({ pattern: Pattern } & A)[],
) =>
  someOf(
    (a: { pattern: Pattern } & A) => ((_v) => (_v._tag === "PArr" ? true : false))(a.pattern),
    arms,
  );
/**
 * Does TypeScript's own narrowing on `_v` type this arm's bindings? A
 * discriminant or literal test on `_v` itself does; a test on a nested field
 * narrows only that field, so a destructuring that reaches past it needs the
 * arm's `patTarget` (ADR 0031).
 */
const isShallowArm: _Curry<[ctx: GCtx, p: Pattern], boolean> = _curry(2, (ctx: GCtx, p: Pattern) =>
  ((_v) =>
    _v._tag === "PAs"
      ? (({ pat }) => isShallowPat(pat))(_v)
      : or(isShallowPat(p), patSlot(ctx, p) === ""))(p),
);
const isShallowPat: (p: Pattern) => boolean = (p: Pattern) =>
  ((_v) =>
    _v._tag === "PCtor"
      ? (({ args }) => allOf(isFlatSub, args))(_v)
      : _v._tag === "PRecord"
        ? (({ fields }) => allOf((f: PatField) => isFlatSub(f.pat), fields))(_v)
        : _v._tag === "PLit"
          ? true
          : _v._tag === "PBool"
            ? true
            : _v._tag === "PStr"
              ? true
              : isCatchAll(p))(p);
/**
 * `_v` as an arm's bindings see it: cast to the arm's narrowed type when the
 * tests do not narrow it themselves and that type refines the base. The tests just proved the cast, as they
 * prove the `_v is T` predicate of the `match()` form.
 */
const armView: _Curry<[ctx: GCtx, p: Pattern, base: Option<string>], string> = _curry(
  3,
  (ctx: GCtx, p: Pattern, base: Option<string>) =>
    ((_v) =>
      _v._tag === "Some" && (({ value: b }) => !isShallowArm(ctx, p))(_v)
        ? (({ value: b }) =>
            ((target: string) => (eq(target, b) ? "_v" : `(_v as ${target})`))(
              patTarget(ctx, p, b),
            ))(_v)
        : "_v")(base),
);
/**
 * Run `body` under the pattern's bindings, destructured from `view`.
 */
const underBinds: _Curry<[ctx: GCtx, p: Pattern, view: string, body: string], string> = _curry(
  4,
  (ctx: GCtx, p: Pattern, view: string, body: string) =>
    ((_v) =>
      _v._tag === "PAs"
        ? (({ pat, name }) =>
            ((slot: string) =>
              slot === ""
                ? `((${name}) => ${body})(${view})`
                : `((${name}) => ((${slot}) => ${body})(${name}))(${view})`)(patSlot(ctx, pat)))(_v)
        : ((slot: string) => (slot === "" ? body : `((${slot}) => ${body})(${view})`))(
            patSlot(ctx, p),
          ))(p),
);
const ternArmTest: _Curry<
  [ctx: GCtx, p: Pattern, guardOpt: Option<Expr>, base: Option<string>],
  string
> = _curry(4, (ctx: GCtx, p: Pattern, guardOpt: Option<Expr>, base: Option<string>) => {
  const conds: string[] = patConds(ctx, p, "_v");
  const all: string[] = ((_v) =>
    _v._tag === "Some"
      ? (({ value: g }) =>
          _Array_append(underBinds(ctx, p, armView(ctx, p, base), `(${genExpr(ctx, g)})`), conds))(
          _v,
        )
      : _v._tag === "None"
        ? conds
        : (() => {
            throw new Error("non-exhaustive match");
          })())(guardOpt);
  return length(all) === 0 ? "true" : _Str_join(" && ", all);
});
const ternArms: _Curry<[ctx: GCtx, arms: MatchArm[], i: number, base: Option<string>], string> =
  _curry(4, (ctx: GCtx, arms: MatchArm[], i: number, base: Option<string>) =>
    ((_v) =>
      _v._tag === "None"
        ? '(() => { throw new Error("non-exhaustive match"); })()'
        : _v._tag === "Some"
          ? (({ value: a }) =>
              ((body: string) =>
                and(_Option_isNone(a.guard), isCatchAll(a.pattern))
                  ? ((_v) => (_v === "()" ? body : ((param) => `(${param} => ${body})(_v)`)(_v)))(
                      catchAllParam(ctx, a.pattern),
                    )
                  : `${ternArmTest(ctx, a.pattern, a.guard, base)}
    ? ${underBinds(ctx, a.pattern, armView(ctx, a.pattern, base), body)}
    : ${ternArms(ctx, arms, i + 1, base)}`)(`(${genLambdaBody(ctx, a.body)})`))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, arms)),
  );
/**
 * A match lowers to a ternary chain over `_v` (ADR 0113), except where the
 * TypeScript backend could not type an arm's bindings: a nested pattern on a
 * scrutinee whose type it cannot name keeps the `match()` form.
 */
const ternaryTypes: <A, B>(
  ctx: GCtx,
  arms: ({ pattern: Pattern } & B)[],
  base: Option<A>,
) => boolean = _curry(3, <A, B>(ctx: GCtx, arms: ({ pattern: Pattern } & B)[], base: Option<A>) =>
  or(
    or(_Option_isNone(ctx.guardBaseType), _Option_isSome(base)),
    allOf((a: { pattern: Pattern } & B) => isShallowArm(ctx, a.pattern), arms),
  ),
);
const genMatch: _Curry<[ctx: GCtx, scrutinee: Expr, arms: MatchArm[]], string> = _curry(
  3,
  (ctx: GCtx, scrutinee: Expr, arms: MatchArm[]) =>
    isListMatch(arms)
      ? genListMatch(ctx, scrutinee, arms)
      : ((base: Option<string>) =>
          ternaryTypes(ctx, arms, base)
            ? `((_v) => ${ternArms(ctx, arms, 0, base)})(${genExpr(ctx, scrutinee)})`
            : genMatchChain(ctx, scrutinee, arms, base))(hook1(ctx.guardBaseType, scrutinee)),
);
/**
 * The `@onrails/pattern` chain.
 */
const genMatchChain: _Curry<
  [ctx: GCtx, scrutinee: Expr, arms: MatchArm[], base: Option<string>],
  string
> = _curry(4, (ctx: GCtx, scrutinee: Expr, arms: MatchArm[], base: Option<string>) =>
  (([armLines, catchAll]: [string[], Option<[Pattern, Expr]>]) => {
    const tail: string = ((_v) =>
      _v._tag === "Some"
        ? (({ value: [p, body] }) =>
            `  .otherwise(${catchAllParam(ctx, p)} => ${genLambdaBody(ctx, body)})`)(
            _v as Extract<Option<[Pattern, Expr]>, { _tag: "Some" }>,
          )
        : _v._tag === "None"
          ? and(_Option_isSome(ctx.guardBaseType), hasArrArm(arms))
            ? '  .otherwise(() => { throw new Error("non-exhaustive match"); })'
            : "  .exhaustive()"
          : (() => {
              throw new Error("non-exhaustive match");
            })())(catchAll);
    return _Str_join(
      "\n",
      _Array_concat(_Array_prepend(`match(${genExpr(ctx, scrutinee)})`, armLines), [tail]),
    );
  })(matchArmsLoop(ctx, arms, 0, base)),
);
const litValue: (p: Pattern) => string = (p: Pattern) =>
  ((_v) =>
    _v._tag === "PStr"
      ? (({ value: v }) => jsStringLit(v))(_v)
      : _v._tag === "PLit"
        ? (({ raw }) => raw)(_v)
        : _v._tag === "PBool"
          ? (({ value: v }) => (v ? "true" : "false"))(_v)
          : "")(p);
/**
 * A field's refined type when its sub-pattern narrows it, else `None` — a
 * bind/wildcard/literal needs no narrowing and keeps its declared type.
 * Tuple and array sub-patterns recurse: a ctor under `[Call(f, [g], _, _)]`
 * is two slots down, and without this the predicate stopped at the top level
 * while the handler destructured all the way (TS2339 on the inner field).
 */
const fieldRefine: _Curry<[ctx: GCtx, p: Pattern, fieldBase: string], Option<string>> = _curry(
  3,
  (ctx: GCtx, p: Pattern, fieldBase: string) =>
    ((_v) =>
      _v._tag === "PCtor"
        ? (Some(patTarget(ctx, p, fieldBase)) as Option<string>)
        : _v._tag === "PRecord"
          ? ((t: string) =>
              eq(t, fieldBase) ? (None as Option<string>) : (Some(t) as Option<string>))(
              patTarget(ctx, p, fieldBase),
            )
          : _v._tag === "PTuple"
            ? ((t: string) =>
                eq(t, fieldBase) ? (None as Option<string>) : (Some(t) as Option<string>))(
                patTarget(ctx, p, fieldBase),
              )
            : _v._tag === "PArr"
              ? ((t: string) =>
                  eq(t, fieldBase) ? (None as Option<string>) : (Some(t) as Option<string>))(
                  patTarget(ctx, p, fieldBase),
                )
              : (None as Option<string>))(p),
);
const ctorRefines: _Curry<
  [ctx: GCtx, args: Pattern[], keys: string[], member: string, i: number],
  string[]
> = _curry(5, (ctx: GCtx, args: Pattern[], keys: string[], member: string, i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? ([] as string[])
      : _v._tag === "Some"
        ? (({ value: a }) =>
            ((rest: string[]) =>
              ((key: string) =>
                ((_v) =>
                  _v._tag === "Some"
                    ? (({ value: sub }) => _Array_prepend(`${jsStringLit(key)}: ${sub}`, rest))(_v)
                    : _v._tag === "None"
                      ? rest
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(fieldRefine(ctx, a, `${member}[${jsStringLit(key)}]`)))(
                _Option_unwrapOr(`_${show(i)}`, _Array_get(i, keys)),
              ))(ctorRefines(ctx, args, keys, member, i + 1)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, args)),
);
const recordRefines: _Curry<[ctx: GCtx, fields: PatField[], base: string, i: number], string[]> =
  _curry(4, (ctx: GCtx, fields: PatField[], base: string, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: f }) =>
              ((rest: string[]) =>
                ((_v) =>
                  _v._tag === "Some"
                    ? (({ value: sub }) => _Array_prepend(`${jsStringLit(f.label)}: ${sub}`, rest))(
                        _v,
                      )
                    : _v._tag === "None"
                      ? rest
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(fieldRefine(ctx, f.pat, `${base}[${jsStringLit(f.label)}]`)))(
                recordRefines(ctx, fields, base, i + 1),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, fields)),
  );
/**
 * A tuple slot is indexed positionally, so each element has its own base.
 */
const tupleSlotBase: <A>(base: string, i: A) => string = _curry(
  2,
  <A>(base: string, i: A) => `(${base})[${show(i)}]`,
);
const tupleTargets: _Curry<[ctx: GCtx, elems: Pattern[], base: string, i: number], string[]> =
  _curry(4, (ctx: GCtx, elems: Pattern[], base: string, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: el }) =>
              ((slotBase: string) =>
                _Array_prepend(
                  _Option_unwrapOr(slotBase, fieldRefine(ctx, el, slotBase)),
                  tupleTargets(ctx, elems, base, i + 1),
                ))(tupleSlotBase(base, i)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, elems)),
  );
const tupleRefines: _Curry<[ctx: GCtx, elems: Pattern[], base: string, i: number], boolean> =
  _curry(4, (ctx: GCtx, elems: Pattern[], base: string, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? false
        : _v._tag === "Some"
          ? (({ value: el }) =>
              or(
                _Option_isSome(fieldRefine(ctx, el, tupleSlotBase(base, i))),
                tupleRefines(ctx, elems, base, i + 1),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, elems)),
  );
/**
 * Array elements all share one element base (`T[number]`).
 */
const arrTargets: _Curry<[ctx: GCtx, elems: Pattern[], elemBase: string, i: number], string[]> =
  _curry(4, (ctx: GCtx, elems: Pattern[], elemBase: string, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: el }) =>
              _Array_prepend(
                _Option_unwrapOr(elemBase, fieldRefine(ctx, el, elemBase)),
                arrTargets(ctx, elems, elemBase, i + 1),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, elems)),
  );
const arrRefines: _Curry<[ctx: GCtx, elems: Pattern[], elemBase: string, i: number], boolean> =
  _curry(4, (ctx: GCtx, elems: Pattern[], elemBase: string, i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? false
        : _v._tag === "Some"
          ? (({ value: el }) =>
              or(
                _Option_isSome(fieldRefine(ctx, el, elemBase)),
                arrRefines(ctx, elems, elemBase, i + 1),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, elems)),
  );
/**
 * Refine `base` by everything the pattern structurally tests. An or-pattern
 * keeps the base — per-alternative narrowing would need a union target.
 */
const patTarget: _Curry<[ctx: GCtx, p: Pattern, base: string], string> = _curry(
  3,
  (ctx: GCtx, p: Pattern, base: string) =>
    ((_v) =>
      _v._tag === "PAs"
        ? (({ pat }) => patTarget(ctx, pat, base))(_v)
        : _v._tag === "PCtor"
          ? (({ ctor, args }) =>
              ((member: string) =>
                ((keys: string[]) =>
                  ((refines: string[]) =>
                    length(refines) === 0 ? member : `${member} & { ${_Str_join("; ", refines)} }`)(
                    ctorRefines(ctx, args, keys, member, 0),
                  ))(_Option_unwrapOr([] as string[], _Map_get(ctor, ctx.keys))))(
                `Extract<${base}, { _tag: ${jsStringLit(ctor)} }>`,
              ))(_v)
          : _v._tag === "PRecord"
            ? (({ fields }) =>
                ((refines: string[]) =>
                  length(refines) === 0 ? base : `${base} & { ${_Str_join("; ", refines)} }`)(
                  recordRefines(ctx, fields, base, 0),
                ))(_v)
            : _v._tag === "PTuple"
              ? (({ elems }) =>
                  !tupleRefines(ctx, elems, base, 0)
                    ? base
                    : `[${_Str_join(", ", tupleTargets(ctx, elems, base, 0))}]`)(_v)
              : _v._tag === "PArr"
                ? (({ elems, rest: restOpt }) =>
                    ((elemBase: string) =>
                      !arrRefines(ctx, elems, elemBase, 0)
                        ? base
                        : ((heads: string) =>
                            ((_v) =>
                              _v._tag === "Some"
                                ? `[${heads}, ...${base}]`
                                : _v._tag === "None"
                                  ? `[${heads}]`
                                  : (() => {
                                      throw new Error("non-exhaustive match");
                                    })())(restOpt))(
                            _Str_join(", ", arrTargets(ctx, elems, elemBase, 0)),
                          ))(`(${base})[number]`))(_v)
                : base)(p),
);
const genGuardArm: _Curry<
  [ctx: GCtx, p: Pattern, body: Expr, guardOpt: Option<Expr>, base: Option<string>],
  string
> = _curry(5, (ctx: GCtx, p: Pattern, body: Expr, guardOpt: Option<Expr>, base: Option<string>) => {
  const root: string = _Option_isSome(base) ? "_g" : "_v";
  const conds0: string[] = patConds(ctx, p, root);
  const slot: string = ((_v) =>
    _v._tag === "PAs" ? (({ pat }) => patSlot(ctx, pat))(_v) : patSlot(ctx, p))(p);
  const conds: string[] = ((_v) =>
    _v._tag === "Some"
      ? (({ value: g }) =>
          ((_v) =>
            _v._tag === "PAs"
              ? (({ name }) =>
                  _Array_append(
                    slot === ""
                      ? `((${name}) => ${genExpr(ctx, g)})(${root})`
                      : `((${name}) => ((${slot}) => ${genExpr(ctx, g)})(${name}))(${root})`,
                    conds0,
                  ))(_v)
              : _Array_append(
                  slot === ""
                    ? `(${genExpr(ctx, g)})`
                    : `((${slot}) => ${genExpr(ctx, g)})(${root})`,
                  conds0,
                ))(p))(_v)
      : _v._tag === "None"
        ? conds0
        : (() => {
            throw new Error("non-exhaustive match");
          })())(guardOpt);
  const test: string = length(conds) === 0 ? "true" : _Str_join(" && ", conds);
  const handler: string = ((_v) =>
    _v._tag === "PAs"
      ? (({ name }) =>
          `(${name}) => ${slot === "" ? genLambdaBody(ctx, body) : `((${slot}) => ${genLambdaBody(ctx, body)})(${name})`}`)(
          _v,
        )
      : `${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody(ctx, body)}`)(p);
  return ((_v) =>
    _v._tag === "None"
      ? `.with((_v) => ${test}, ${handler})`
      : _v._tag === "Some"
        ? (({ value: b }) =>
            ((target: string) =>
              eq(target, b)
                ? `.with((_v) => { const _g: any = _v; return ${test}; }, ${handler})`
                : `.with((_v): _v is ${target} => { const _g: any = _v; return ${test}; }, ${handler})`)(
              patTarget(ctx, p, b),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(base);
});
const isFlatSub: (p: Pattern) => boolean = (p: Pattern) =>
  ((_v) =>
    _v._tag === "PAs"
      ? false
      : _v._tag === "PBind"
        ? true
        : _v._tag === "PWild"
          ? true
          : _v._tag === "PLit"
            ? true
            : _v._tag === "PBool"
              ? true
              : _v._tag === "PStr"
                ? true
                : false)(p);
const recordLits: <A>(fields: ({ pat: Pattern; label: string } & A)[], i: number) => string[] =
  _curry(2, <A>(fields: ({ pat: Pattern; label: string } & A)[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: f }) =>
              ((rest: string[]) =>
                ((_v) =>
                  _v._tag === "PLit"
                    ? _Array_prepend(`${f.label}: ${litValue(f.pat)}`, rest)
                    : _v._tag === "PBool"
                      ? _Array_prepend(`${f.label}: ${litValue(f.pat)}`, rest)
                      : _v._tag === "PStr"
                        ? _Array_prepend(`${f.label}: ${litValue(f.pat)}`, rest)
                        : rest)(f.pat))(recordLits(fields, i + 1)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, fields)),
  );
const ctorArgParts: _Curry<
  [ctx: GCtx, ctor: string, args: Pattern[], i: number],
  [string[], string[]]
> = _curry(4, (ctx: GCtx, ctor: string, args: Pattern[], i: number) =>
  ((_v) =>
    _v._tag === "None"
      ? _tuple([] as string[], [] as string[])
      : _v._tag === "Some"
        ? (({ value: a }) =>
            (([restBinds, restLits]: [string[], string[]]) => {
              const key: string = keyAt(ctx, ctor, i);
              return ((_v) =>
                _v._tag === "PBind"
                  ? (({ name }) =>
                      _tuple(_Array_prepend(keyedSlot(key, name), restBinds), restLits))(_v)
                  : _v._tag === "PLit"
                    ? _tuple(restBinds, _Array_prepend(`${key}: ${litValue(a)}`, restLits))
                    : _v._tag === "PBool"
                      ? _tuple(restBinds, _Array_prepend(`${key}: ${litValue(a)}`, restLits))
                      : _v._tag === "PStr"
                        ? _tuple(restBinds, _Array_prepend(`${key}: ${litValue(a)}`, restLits))
                        : _tuple(restBinds, restLits))(a);
            })(ctorArgParts(ctx, ctor, args, i + 1)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, args)),
);
const genWithArm: _Curry<[ctx: GCtx, p: Pattern, body: Expr, base: Option<string>], string> =
  _curry(4, (ctx: GCtx, p: Pattern, body: Expr, base: Option<string>) =>
    ((_v) =>
      _v._tag === "PAs"
        ? genGuardArm(ctx, p, body, None as Option<Expr>, base)
        : _v._tag === "PArr"
          ? genGuardArm(ctx, p, body, None as Option<Expr>, base)
          : _v._tag === "PTuple"
            ? genGuardArm(ctx, p, body, None as Option<Expr>, base)
            : _v._tag === "POr"
              ? genGuardArm(ctx, p, body, None as Option<Expr>, base)
              : _v._tag === "PLit"
                ? `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`
                : _v._tag === "PBool"
                  ? `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`
                  : _v._tag === "PStr"
                    ? `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`
                    : _v._tag === "PRecord"
                      ? (({ fields }) =>
                          allOf((f: PatField) => isFlatSub(f.pat), fields)
                            ? ((lits: string[]) =>
                                ((slot: string) =>
                                  `.with({ ${_Str_join(", ", lits)} }, ${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody(ctx, body)})`)(
                                  patSlot(ctx, p),
                                ))(recordLits(fields, 0))
                            : genGuardArm(ctx, p, body, None as Option<Expr>, base))(_v)
                      : _v._tag === "PCtor"
                        ? (({ ctor, args }) =>
                            allOf(isFlatSub, args)
                              ? (([binds, litFields]: [string[], string[]]) => {
                                  const patObj: string = _Str_join(
                                    ", ",
                                    _Array_prepend(`_tag: ${jsStringLit(ctor)}`, litFields),
                                  );
                                  const param: string =
                                    length(binds) === 0 ? "()" : `({ ${_Str_join(", ", binds)} })`;
                                  return `.with({ ${patObj} }, ${param} => ${genLambdaBody(ctx, body)})`;
                                })(ctorArgParts(ctx, ctor, args, 0))
                              : genGuardArm(ctx, p, body, None as Option<Expr>, base))(_v)
                        : genGuardArm(ctx, p, body, None as Option<Expr>, base))(p),
  );
/**
 * `k0: T0, k1: T1` — a typed factory's parameter list.
 */
const typedCtorParams: _Curry<[keys: string[], paramTypes: string[], i: number], string[]> = _curry(
  3,
  (keys: string[], paramTypes: string[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: k }) =>
              _Array_prepend(
                `${k}: ${_Option_unwrapOr("unknown", _Array_get(i, paramTypes))}`,
                typedCtorParams(keys, paramTypes, i + 1),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, keys)),
);
const genCtor: <A, B, C>(
  c: { name: string; fields: ({ name: Option<string> } & A)[] } & B,
  ts: Option<{ retMono: string; generics: string; paramTypes: string[]; ret: string } & C>,
) => string = _curry(
  2,
  <A, B, C>(
    c: { name: string; fields: ({ name: Option<string> } & A)[] } & B,
    ts: Option<{ retMono: string; generics: string; paramTypes: string[]; ret: string } & C>,
  ) => {
    const tag: string = jsStringLit(c.name);
    return length(c.fields) === 0
      ? ((_v) =>
          _v._tag === "Some"
            ? (({ value: t }) => `const ${c.name}: ${t.retMono} = { _tag: ${tag} };`)(_v)
            : _v._tag === "None"
              ? `const ${c.name} = { _tag: ${tag} };`
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(ts)
      : ((keys: string[]) =>
          ((params: string) =>
            ((impl: string) =>
              length(c.fields) >= 2
                ? ((curried: string) =>
                    ((_v) =>
                      _v._tag === "Some"
                        ? (({ value: t }) =>
                            `const ${c.name} = ${curried} as ${t.generics}(${_Str_join(", ", typedCtorParams(keys, t.paramTypes, 0))}) => ${t.ret};`)(
                            _v,
                          )
                        : _v._tag === "None"
                          ? `const ${c.name} = ${curried};`
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(ts))(`_curry(${show(length(c.fields))}, ${impl})`)
                : ((_v) =>
                    _v._tag === "Some"
                      ? (({ value: t }) =>
                          `const ${c.name} = ${t.generics}(${_Str_join(", ", typedCtorParams(keys, t.paramTypes, 0))}): ${t.ret} => ({ _tag: ${tag}, ${params} });`)(
                          _v,
                        )
                      : _v._tag === "None"
                        ? `const ${c.name} = ${impl};`
                        : (() => {
                            throw new Error("non-exhaustive match");
                          })())(ts))(`(${params}) => ({ _tag: ${tag}, ${params} })`))(
            _Str_join(", ", keys),
          ))(keysOf(c.fields));
  },
);
const genCtorsFrom: <A, B, C, D>(
  s: A,
  ctors: ({ name: string; fields: ({ name: Option<string> } & B)[] } & C)[],
  h: Option<
    (
      a: A,
      b: { name: string; fields: ({ name: Option<string> } & B)[] } & C,
    ) => Option<{ retMono: string; generics: string; paramTypes: string[]; ret: string } & D>
  >,
  refs: Set<string>,
  exported: boolean,
  i: number,
) => string[] = _curry(
  6,
  <A, B, C, D>(
    s: A,
    ctors: ({ name: string; fields: ({ name: Option<string> } & B)[] } & C)[],
    h: Option<
      (
        a: A,
        b: { name: string; fields: ({ name: Option<string> } & B)[] } & C,
      ) => Option<{ retMono: string; generics: string; paramTypes: string[]; ret: string } & D>
    >,
    refs: Set<string>,
    exported: boolean,
    i: number,
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: c }) =>
              ((rest: string[]) =>
                or(exported, _Set_has(c.name, refs))
                  ? _Array_prepend(genCtor(c, hook2(h, s, c)), rest)
                  : rest)(genCtorsFrom(s, ctors, h, refs, exported, i + 1)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, ctors)),
);
const genType: _Curry<[ctx: GCtx, s: Stmt], string> = _curry(2, (ctx: GCtx, s: Stmt) =>
  ((_v) =>
    _v._tag === "SType"
      ? (({ ctors, exported }) =>
          _Str_join("\n", genCtorsFrom(s, ctors, ctx.annotateCtor, ctx.valueRefs, exported, 0)))(_v)
      : "")(s),
);
/**
 * Top-level arrow spine length (`a -> b -> c` → 2).
 */
const typeExprArity: (te: TypeExpr) => number = (te: TypeExpr) =>
  ((_v) => (_v._tag === "TyArrow" ? (({ to }) => 1 + typeExprArity(to))(_v) : 0))(te);
/**
 * `$a0, $a1, …` — must stay byte-for-byte aligned with TS codegen.
 */
const externArgs: (n: number) => string = (n: number) => {
  let i: number = 0;
  let acc: string = "";
  while (true) {
    if (i >= n) {
      return acc;
    } else {
      [i, acc] = [i + 1, acc === "" ? `$a${show(i)}` : `${acc}, $a${show(i)}`];
      continue;
    }
  }
};
/**
 * `($a0)($a1)…` — one argument per call, for a `curried` host (ADR 0064).
 */
const externApplied: (n: number) => string = (n: number) => {
  let i: number = 0;
  let acc: string = "";
  while (true) {
    if (i >= n) {
      return acc;
    } else {
      [i, acc] = [i + 1, `${acc}($a${show(i)})`];
      continue;
    }
  }
};
/**
 * extern → ESM import. Arity ≥ 2 wraps the host in `_curry` (ADR 0005 / #24).
 * `imported == "default"` emits a default import (ADR 0009 / styled-cva).
 */
const genExtern: (s: Stmt) => string = (s: Stmt) =>
  ((_v) =>
    _v._tag === "SExtern"
      ? (({ name, typeExpr, module: modName, imported, curried }) =>
          _Str_startsWith("mochi:global:", modName)
            ? ((target: string) =>
                ((base: string) =>
                  `const ${name} = ${imported === "" ? base : `${base}[${jsStringLit(imported)}]`};`)(
                  `globalThis[${jsStringLit(target)}]`,
                ))(_Str_slice(13, _Str_length(modName), modName))
            : _Str_startsWith("mochi:get:", modName)
              ? ((target: string) =>
                  `const ${name} = ($receiver) => $receiver[${jsStringLit(target)}];`)(
                  _Str_slice(10, _Str_length(modName), modName),
                )
              : _Str_startsWith("mochi:set:", modName)
                ? ((target: string) =>
                    `const ${name} = _curry(2, ($receiver, $value) => ($receiver[${jsStringLit(target)}] = $value));`)(
                    _Str_slice(10, _Str_length(modName), modName),
                  )
                : _Str_startsWith("mochi:new:", modName)
                  ? ((target: string) =>
                      ((arity: number) =>
                        ((args: string) =>
                          imported !== ""
                            ? ((raw: string) =>
                                ((importLine: string) =>
                                  ((ctor: string) =>
                                    arity === 0
                                      ? `${importLine}
const ${name} = () => ${ctor};`
                                      : `${importLine}
const ${name} = _curry(${show(arity)}, (${args}) => ${ctor});`)(`new ${raw}(${args})`))(
                                  `import { ${imported} as ${raw} } from ${jsStringLit(target)};`,
                                ))(_Str_concat("$", name))
                            : arity === 0
                              ? `const ${name} = () => new globalThis[${jsStringLit(target)}]();`
                              : `const ${name} = _curry(${show(arity)}, (${args}) => new globalThis[${jsStringLit(target)}](${args}));`)(
                          externArgs(arity),
                        ))(typeExprArity(typeExpr)))(_Str_slice(10, _Str_length(modName), modName))
                  : _Str_startsWith("mochi:send:", modName)
                    ? ((target: string) =>
                        ((arity: number) =>
                          ((args: string) =>
                            ((fn: string) =>
                              arity < 2
                                ? `const ${name} = ${fn};`
                                : `const ${name} = _curry(${show(arity)}, ${fn});`)(
                              args === ""
                                ? `($receiver) => $receiver[${jsStringLit(target)}]()`
                                : `($receiver, ${args}) => $receiver[${jsStringLit(target)}](${args})`,
                            ))(externArgs(arity - 1)))(typeExprArity(typeExpr)))(
                        _Str_slice(11, _Str_length(modName), modName),
                      )
                    : imported === "default"
                      ? `import ${name} from ${jsStringLit(modName)};`
                      : ((arity: number) =>
                          arity <= 1
                            ? ((spec: string) =>
                                `import { ${spec} } from ${jsStringLit(modName)};`)(
                                eq(imported, name) ? name : `${imported} as ${name}`,
                              )
                            : ((raw: string) =>
                                ((
                                  flat: string,
                                ) => `import { ${imported} as ${raw} } from ${jsStringLit(modName)};
const ${name} = _curry(${show(arity)}, ${flat});`)(
                                  curried
                                    ? `(${externArgs(arity)}) => ${raw}${externApplied(arity)}`
                                    : raw,
                                ))(_Str_concat("$", name)))(typeExprArity(typeExpr)))(_v)
      : "")(s);
const stripAlExt: (s: string) => string = (s: string) =>
  _Str_endsWith(".mochi", s) ? _Str_slice(0, _Str_length(s) - 6, s) : s;
/**
 * Relative `./` / `../` get `ext` (`.js` for the JS backend, `""` for TS —
 * tsc resolves the extensionless sibling); bare package specs keep their
 * name, since a suffix would break package `exports` (ADR 0015).
 */
const rewriteImportPath: _Curry<[from: string, ext: string], string> = _curry(
  2,
  (from: string, ext: string) => {
    const bare: string = stripAlExt(from);
    return or(_Str_startsWith("./", bare), _Str_startsWith("../", bare)) ? `${bare}${ext}` : bare;
  },
);
const genImport: _Curry<[s: Stmt, ext: string], string> = _curry(2, (s: Stmt, ext: string) =>
  ((_v) =>
    _v._tag === "SImport"
      ? (({ names, from }) =>
          ((nameList: string) =>
            ((path: string) => `import { ${nameList} } from ${jsStringLit(path)};`)(
              rewriteImportPath(from, ext),
            ))(
            _Str_join(
              ", ",
              map((n: Name) => n.name, names),
            ),
          ))(_v)
      : _v._tag === "SImportNs"
        ? (({ alias, from }) =>
            ((path: string) => `import * as ${alias.name} from ${jsStringLit(path)};`)(
              rewriteImportPath(from, ext),
            ))(_v)
        : "")(s),
);
const exportLine: (l: string) => string = (l: string) => `export ${l}`;
const jsDocLine: (l: string) => string = (l: string) =>
  _Str_length(l) > 0 ? ` * ${_Str_replace("*/", "*\\/", l)}` : " *";
export const jsDoc: (docOpt: Option<string>) => string = (docOpt: Option<string>) =>
  ((_v) =>
    _v._tag === "None"
      ? ""
      : _v._tag === "Some"
        ? (({ value: doc }) =>
            ((lines: string[]) => `/**
${_Str_join("\n", lines)}
 */
`)(map(jsDocLine, _Str_split("\n", doc))))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(docOpt);
const genStmt: _Curry<[ctx: GCtx, s: Stmt], string> = _curry(2, (ctx: GCtx, s: Stmt) =>
  ((_v) =>
    _v._tag === "SError"
      ? (({ span: sp }) =>
          `throw new Error("codegen invariant: error node reached codegen at ${show(sp.start)}");`)(
          _v,
        )
      : _v._tag === "SImport"
        ? genImport(s, ctx.moduleExt)
        : _v._tag === "SImportNs"
          ? genImport(s, ctx.moduleExt)
          : _v._tag === "SType"
            ? (({ exported }) =>
                ((decls: string) =>
                  decls === ""
                    ? ""
                    : exported
                      ? _Str_join("\n", map(exportLine, _Str_split("\n", decls)))
                      : decls)(genType(ctx, s)))(_v)
            : _v._tag === "SExtern"
              ? (({ name, exported, doc }) =>
                  ((docComment: string) =>
                    exported
                      ? `${docComment}${genExtern(s)}
export { ${name} };`
                      : `${docComment}${genExtern(s)}`)(ctx.docs ? jsDoc(doc) : ""))(_v)
              : _v._tag === "SLet"
                ? (({ name, value, exported, doc }) =>
                    ((doExport: boolean) =>
                      ((docComment: string) =>
                        `${docComment}${doExport ? "export " : ""}const ${name}${_Option_unwrapOr("", hook2(ctx.annotateLet, name, value))} = ${genExpr(ctx, value)};`)(
                        and(ctx.docs, !_Str_startsWith("$", name)) ? jsDoc(doc) : "",
                      ))(and(exported, !_Str_startsWith("$", name))))(_v)
                : _v._tag === "SExpr"
                  ? (({ value }) => `${genExpr(ctx, value)};`)(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(s),
);
const usesMatchLibArm: _Curry<[ctx: GCtx, a: MatchArm], boolean> = _curry(
  2,
  (ctx: GCtx, a: MatchArm) =>
    or(
      ((_v) =>
        _v._tag === "Some"
          ? (({ value: g }) => usesMatchLib(ctx, g))(_v)
          : _v._tag === "None"
            ? false
            : (() => {
                throw new Error("non-exhaustive match");
              })())(a.guard),
      usesMatchLib(ctx, a.body),
    ),
);
const usesMatchLib: _Curry<[ctx: GCtx, e: Expr], boolean> = _curry(2, (ctx: GCtx, e: Expr) =>
  ((_v) =>
    _v._tag === "ENum"
      ? false
      : _v._tag === "EUnit"
        ? false
        : _v._tag === "EBool"
          ? false
          : _v._tag === "EStr"
            ? false
            : _v._tag === "ERef"
              ? false
              : _v._tag === "ECall"
                ? (({ fn, args }) =>
                    or(
                      usesMatchLib(ctx, fn),
                      someOf((x: Expr) => usesMatchLib(ctx, x), args),
                    ))(_v)
                : _v._tag === "ELambda"
                  ? (({ body }) => usesMatchLib(ctx, body))(_v)
                  : _v._tag === "ELetIn"
                    ? (({ value, body }) => or(usesMatchLib(ctx, value), usesMatchLib(ctx, body)))(
                        _v,
                      )
                    : _v._tag === "ELetBind"
                      ? (({ value, body }) =>
                          or(usesMatchLib(ctx, value), usesMatchLib(ctx, body)))(_v)
                      : _v._tag === "EPipe"
                        ? (({ left, right }) =>
                            or(usesMatchLib(ctx, left), usesMatchLib(ctx, right)))(_v)
                        : _v._tag === "EDo"
                          ? (({ exprs }) => someOf((x: Expr) => usesMatchLib(ctx, x), exprs))(_v)
                          : _v._tag === "ETernary"
                            ? (({ cond, thenE, elseE }) =>
                                or(
                                  usesMatchLib(ctx, cond),
                                  or(usesMatchLib(ctx, thenE), usesMatchLib(ctx, elseE)),
                                ))(_v)
                            : _v._tag === "EMatch"
                              ? (({ scrutinee, arms }) =>
                                  or(
                                    and(
                                      !isListMatch(arms),
                                      !ternaryTypes(ctx, arms, hook1(ctx.guardBaseType, scrutinee)),
                                    ),
                                    or(
                                      usesMatchLib(ctx, scrutinee),
                                      someOf((a: MatchArm) => usesMatchLibArm(ctx, a), arms),
                                    ),
                                  ))(_v)
                              : _v._tag === "ELoop"
                                ? (({ params, body }) =>
                                    or(
                                      someOf((p: LoopParam) => usesMatchLib(ctx, p.init), params),
                                      usesMatchLib(ctx, body),
                                    ))(_v)
                                : _v._tag === "ERecur"
                                  ? (({ args }) => someOf((x: Expr) => usesMatchLib(ctx, x), args))(
                                      _v,
                                    )
                                  : _v._tag === "ERecord"
                                    ? (({ fields, spread }) =>
                                        or(
                                          ((_v) =>
                                            _v._tag === "Some"
                                              ? (({ value: s }) => usesMatchLib(ctx, s))(_v)
                                              : _v._tag === "None"
                                                ? false
                                                : (() => {
                                                    throw new Error("non-exhaustive match");
                                                  })())(spread),
                                          someOf((f: Field) => usesMatchLib(ctx, f.value), fields),
                                        ))(_v)
                                    : _v._tag === "EField"
                                      ? (({ target }) => usesMatchLib(ctx, target))(_v)
                                      : _v._tag === "ETuple"
                                        ? (({ elements }) =>
                                            someOf((x: Expr) => usesMatchLib(ctx, x), elements))(_v)
                                        : _v._tag === "EArr"
                                          ? (({ elements }) =>
                                              someOf(
                                                (el: SeqElem) =>
                                                  usesMatchLib(
                                                    ctx,
                                                    ((_v) =>
                                                      _v._tag === "SEExpr"
                                                        ? (({ expr: e }) => e)(_v)
                                                        : _v._tag === "SESpread"
                                                          ? (({ expr: e }) => e)(_v)
                                                          : (() => {
                                                              throw new Error(
                                                                "non-exhaustive match",
                                                              );
                                                            })())(el),
                                                  ),
                                                elements,
                                              ))(_v)
                                          : _v._tag === "EList"
                                            ? (({ elements }) =>
                                                someOf(
                                                  (el: SeqElem) =>
                                                    usesMatchLib(
                                                      ctx,
                                                      ((_v) =>
                                                        _v._tag === "SEExpr"
                                                          ? (({ expr: e }) => e)(_v)
                                                          : _v._tag === "SESpread"
                                                            ? (({ expr: e }) => e)(_v)
                                                            : (() => {
                                                                throw new Error(
                                                                  "non-exhaustive match",
                                                                );
                                                              })())(el),
                                                    ),
                                                  elements,
                                                ))(_v)
                                            : _v._tag === "ESet"
                                              ? (({ elements }) =>
                                                  someOf(
                                                    (el: SeqElem) =>
                                                      usesMatchLib(
                                                        ctx,
                                                        ((_v) =>
                                                          _v._tag === "SEExpr"
                                                            ? (({ expr: e }) => e)(_v)
                                                            : _v._tag === "SESpread"
                                                              ? (({ expr: e }) => e)(_v)
                                                              : (() => {
                                                                  throw new Error(
                                                                    "non-exhaustive match",
                                                                  );
                                                                })())(el),
                                                      ),
                                                    elements,
                                                  ))(_v)
                                              : _v._tag === "EMap"
                                                ? (({ entries }) =>
                                                    someOf(
                                                      (en: MapEntry) =>
                                                        or(
                                                          usesMatchLib(ctx, en.key),
                                                          usesMatchLib(ctx, en.value),
                                                        ),
                                                      entries,
                                                    ))(_v)
                                                : _v._tag === "EInterp"
                                                  ? (({ parts }) =>
                                                      someOf(
                                                        (p: InterpPart) =>
                                                          ((_v) =>
                                                            _v._tag === "IPLit"
                                                              ? false
                                                              : _v._tag === "IPExpr"
                                                                ? (({ expr: ex }) =>
                                                                    usesMatchLib(ctx, ex))(_v)
                                                                : (() => {
                                                                    throw new Error(
                                                                      "non-exhaustive match",
                                                                    );
                                                                  })())(p),
                                                        parts,
                                                      ))(_v)
                                                  : (() => {
                                                      throw new Error("non-exhaustive match");
                                                    })())(e),
);
const loopInitRefsFrom: _Curry<
  [ctx: GCtx, params: LoopParam[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, params: LoopParam[], i: number, acc: Set<string>) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: p }) => loopInitRefsFrom(ctx, params, i + 1, exprRefs(ctx, p.init, acc)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, params)),
);
const exprRefsListFrom: _Curry<
  [ctx: GCtx, xs: Expr[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, xs: Expr[], i: number, acc: Set<string>) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: x }) => exprRefsListFrom(ctx, xs, i + 1, exprRefs(ctx, x, acc)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, xs)),
);
const exprRefsInterpPartsFrom: _Curry<
  [ctx: GCtx, parts: InterpPart[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, parts: InterpPart[], i: number, acc: Set<string>) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: p }) =>
            exprRefsInterpPartsFrom(
              ctx,
              parts,
              i + 1,
              ((_v) =>
                _v._tag === "IPLit"
                  ? acc
                  : _v._tag === "IPExpr"
                    ? (({ expr: ex }) => exprRefs(ctx, ex, acc))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(p),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, parts)),
);
const exprRefsArmsFrom: _Curry<
  [ctx: GCtx, arms: MatchArm[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, arms: MatchArm[], i: number, acc: Set<string>) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: a }) =>
            ((acc1: Set<string>) =>
              exprRefsArmsFrom(ctx, arms, i + 1, exprRefs(ctx, a.body, acc1)))(
              ((_v) =>
                _v._tag === "Some"
                  ? (({ value: g }) => exprRefs(ctx, g, acc))(_v)
                  : _v._tag === "None"
                    ? acc
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(a.guard),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, arms)),
);
const exprRefsFieldsFrom: _Curry<
  [ctx: GCtx, fields: Field[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, fields: Field[], i: number, acc: Set<string>) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: f }) => exprRefsFieldsFrom(ctx, fields, i + 1, exprRefs(ctx, f.value, acc)))(
            _v,
          )
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, fields)),
);
const exprRefsEntriesFrom: _Curry<
  [ctx: GCtx, entries: MapEntry[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, entries: MapEntry[], i: number, acc: Set<string>) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: en }) =>
            exprRefsEntriesFrom(
              ctx,
              entries,
              i + 1,
              exprRefs(ctx, en.value, exprRefs(ctx, en.key, acc)),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, entries)),
);
const exprRefs: _Curry<[ctx: GCtx, e: Expr, acc: Set<string>], Set<string>> = _curry(
  3,
  (ctx: GCtx, e: Expr, acc: Set<string>) =>
    ((_v) =>
      _v._tag === "ENum"
        ? acc
        : _v._tag === "EUnit"
          ? acc
          : _v._tag === "EBool"
            ? acc
            : _v._tag === "EStr"
              ? acc
              : _v._tag === "ERef"
                ? (({ name }) => _Set_add(name, acc))(_v)
                : _v._tag === "ECall"
                  ? (({ fn, args }) => exprRefsListFrom(ctx, args, 0, exprRefs(ctx, fn, acc)))(_v)
                  : _v._tag === "ELambda"
                    ? (({ params, body }) =>
                        (([cparams, cbody, fills]: [
                          LamParam[],
                          Expr,
                          { labVar: string; labs: LamParam[] }[],
                        ]) => {
                          const acc2: Set<string> =
                            length(cparams) >= 2 ? _Set_add("_curry", acc) : acc;
                          const acc3: Set<string> = reduce(
                            _curry(2, (a: Set<string>, g: { labs: LamParam[]; labVar: string }) =>
                              reduce(
                                _curry(2, (b: Set<string>, lab: LamParam) =>
                                  ((_v) =>
                                    _v._tag === "LPSpanned" &&
                                    _v.param._tag === "LPLabeled" &&
                                    _v.param.defaultValue._tag === "Some"
                                      ? (({
                                          param: {
                                            defaultValue: { value: d },
                                          },
                                        }) => exprRefs(ctx, d, b))(
                                          _v as Extract<LamParam, { _tag: "LPSpanned" }> & {
                                            param: Extract<
                                              Extract<LamParam, { _tag: "LPSpanned" }>["param"],
                                              { _tag: "LPLabeled" }
                                            > & {
                                              defaultValue: Extract<
                                                Extract<
                                                  Extract<LamParam, { _tag: "LPSpanned" }>["param"],
                                                  { _tag: "LPLabeled" }
                                                >["defaultValue"],
                                                { _tag: "Some" }
                                              >;
                                            };
                                          },
                                        )
                                      : _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some"
                                        ? (({ defaultValue: { value: d } }) => exprRefs(ctx, d, b))(
                                            _v as Extract<LamParam, { _tag: "LPLabeled" }> & {
                                              defaultValue: Extract<
                                                Extract<
                                                  LamParam,
                                                  { _tag: "LPLabeled" }
                                                >["defaultValue"],
                                                { _tag: "Some" }
                                              >;
                                            },
                                          )
                                        : b)(lab),
                                ),
                                a,
                                g.labs,
                              ),
                            ),
                            acc2,
                            fills,
                          );
                          return exprRefs(ctx, cbody, acc3);
                        })(collapseLambda(params, body)))(_v)
                    : _v._tag === "ELetIn"
                      ? (({ value, body }) => exprRefs(ctx, body, exprRefs(ctx, value, acc)))(_v)
                      : _v._tag === "ELetBind"
                        ? (({ monad, value, body }) =>
                            exprRefs(
                              ctx,
                              body,
                              exprRefs(ctx, value, _Set_add(bindRuntime(monad), acc)),
                            ))(_v)
                        : _v._tag === "EPipe"
                          ? (({ left, right }) => exprRefs(ctx, right, exprRefs(ctx, left, acc)))(
                              _v,
                            )
                          : _v._tag === "EDo"
                            ? (({ exprs }) => exprRefsListFrom(ctx, exprs, 0, acc))(_v)
                            : _v._tag === "ETernary"
                              ? (({ cond, thenE, elseE }) =>
                                  exprRefs(
                                    ctx,
                                    elseE,
                                    exprRefs(ctx, thenE, exprRefs(ctx, cond, acc)),
                                  ))(_v)
                              : _v._tag === "EMatch"
                                ? (({ scrutinee, arms }) =>
                                    ((acc1: Set<string>) =>
                                      ((acc2: Set<string>) => exprRefsArmsFrom(ctx, arms, 0, acc2))(
                                        someOf(
                                          (a: MatchArm) =>
                                            ((_v) =>
                                              _v._tag === "PList" &&
                                              _v.rest._tag === "Some" &&
                                              _v.rest.value._tag === "PBind"
                                                ? true
                                                : false)(a.pattern),
                                          arms,
                                        )
                                          ? _Set_add("_list", acc1)
                                          : acc1,
                                      ))(exprRefs(ctx, scrutinee, acc)))(_v)
                                : _v._tag === "ERecord"
                                  ? (({ fields, spread }) =>
                                      exprRefsFieldsFrom(
                                        ctx,
                                        fields,
                                        0,
                                        ((_v) =>
                                          _v._tag === "Some"
                                            ? (({ value: s }) => exprRefs(ctx, s, acc))(_v)
                                            : _v._tag === "None"
                                              ? acc
                                              : (() => {
                                                  throw new Error("non-exhaustive match");
                                                })())(spread),
                                      ))(_v)
                                  : _v._tag === "EField"
                                    ? (({ target, name }) =>
                                        ((_v) =>
                                          _v._tag === "Some"
                                            ? ((_v) =>
                                                _v._tag === "ERef" && _v.name === "List"
                                                  ? _Set_add("_list", acc)
                                                  : acc)(target)
                                            : _v._tag === "None"
                                              ? ((_v) =>
                                                  _v._tag === "Some"
                                                    ? (({ value: rt }) => _Set_add(rt, acc))(_v)
                                                    : _v._tag === "None"
                                                      ? exprRefs(ctx, target, acc)
                                                      : (() => {
                                                          throw new Error("non-exhaustive match");
                                                        })())(nsRuntimeId(ctx, target, name))
                                              : (() => {
                                                  throw new Error("non-exhaustive match");
                                                })())(
                                          emptyNsEmit(target, name, None as Option<string>),
                                        ))(_v)
                                    : _v._tag === "ELoop"
                                      ? (({ params, body }) =>
                                          ((acc1: Set<string>) =>
                                            ((acc2: Set<string>) => exprRefs(ctx, body, acc2))(
                                              loopInitRefsFrom(ctx, params, 0, acc1),
                                            ))(
                                            loopNeedsStep(body)
                                              ? _Set_add("_recur", _Set_add("_done", acc))
                                              : acc,
                                          ))(_v)
                                      : _v._tag === "ERecur"
                                        ? (({ args }) => exprRefsListFrom(ctx, args, 0, acc))(_v)
                                        : _v._tag === "ETuple"
                                          ? (({ elements }) =>
                                              exprRefsListFrom(ctx, elements, 0, acc))(_v)
                                          : _v._tag === "EArr"
                                            ? (({ elements }) =>
                                                exprRefsListFrom(
                                                  ctx,
                                                  map(
                                                    (el: SeqElem) =>
                                                      ((_v) =>
                                                        _v._tag === "SEExpr"
                                                          ? (({ expr: e }) => e)(_v)
                                                          : _v._tag === "SESpread"
                                                            ? (({ expr: e }) => e)(_v)
                                                            : (() => {
                                                                throw new Error(
                                                                  "non-exhaustive match",
                                                                );
                                                              })())(el),
                                                    elements,
                                                  ),
                                                  0,
                                                  acc,
                                                ))(_v)
                                            : _v._tag === "EList"
                                              ? (({ elements }) =>
                                                  exprRefsListFrom(
                                                    ctx,
                                                    map(
                                                      (el: SeqElem) =>
                                                        ((_v) =>
                                                          _v._tag === "SEExpr"
                                                            ? (({ expr: e }) => e)(_v)
                                                            : _v._tag === "SESpread"
                                                              ? (({ expr: e }) => e)(_v)
                                                              : (() => {
                                                                  throw new Error(
                                                                    "non-exhaustive match",
                                                                  );
                                                                })())(el),
                                                      elements,
                                                    ),
                                                    0,
                                                    _Set_add("_list", acc),
                                                  ))(_v)
                                              : _v._tag === "ESet"
                                                ? (({ elements }) =>
                                                    exprRefsListFrom(
                                                      ctx,
                                                      map(
                                                        (el: SeqElem) =>
                                                          ((_v) =>
                                                            _v._tag === "SEExpr"
                                                              ? (({ expr: e }) => e)(_v)
                                                              : _v._tag === "SESpread"
                                                                ? (({ expr: e }) => e)(_v)
                                                                : (() => {
                                                                    throw new Error(
                                                                      "non-exhaustive match",
                                                                    );
                                                                  })())(el),
                                                        elements,
                                                      ),
                                                      0,
                                                      acc,
                                                    ))(_v)
                                                : _v._tag === "EMap"
                                                  ? (({ entries }) =>
                                                      exprRefsEntriesFrom(ctx, entries, 0, acc))(_v)
                                                  : _v._tag === "EInterp"
                                                    ? (({ parts }) =>
                                                        exprRefsInterpPartsFrom(
                                                          ctx,
                                                          parts,
                                                          0,
                                                          acc,
                                                        ))(_v)
                                                    : (() => {
                                                        throw new Error("non-exhaustive match");
                                                      })())(e),
);
const boundNamesFrom: _Curry<
  [valueRefs: Set<string>, stmts: Stmt[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (valueRefs: Set<string>, stmts: Stmt[], i: number, acc: Set<string>) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: s }) =>
            boundNamesFrom(
              valueRefs,
              stmts,
              i + 1,
              ((_v) =>
                _v._tag === "SLet"
                  ? (({ name }) => _Set_add(name, acc))(_v)
                  : _v._tag === "SExtern"
                    ? (({ name }) => _Set_add(name, acc))(_v)
                    : _v._tag === "SType"
                      ? (({ ctors, exported }) =>
                          _Set_union(
                            acc,
                            _Set_fromArray(
                              map(
                                (c: Ctor) => c.name,
                                filter(
                                  (c: Ctor) => or(exported, _Set_has(c.name, valueRefs)),
                                  ctors,
                                ),
                              ),
                            ),
                          ))(_v)
                      : _v._tag === "SImport"
                        ? (({ names }) =>
                            _Set_union(acc, _Set_fromArray(map((n: Name) => n.name, names))))(_v)
                        : _v._tag === "SImportNs"
                          ? (({ alias }) => _Set_add(alias.name, acc))(_v)
                          : _v._tag === "SError"
                            ? acc
                            : _v._tag === "SExpr"
                              ? acc
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(s),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, stmts)),
);
const boundNames: _Curry<[valueRefs: Set<string>, stmts: Stmt[]], Set<string>> = _curry(
  2,
  (valueRefs: Set<string>, stmts: Stmt[]) =>
    boundNamesFrom(valueRefs, stmts, 0, _Set_fromArray([] as string[])),
);
/**
 * Names referenced in let/expr values — not patterns. `| TLet =>` does not
 * count, so a local unused ctor factory can be dropped.
 */
const collectValueRefs: _Curry<
  [ctx: GCtx, stmts: Stmt[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, stmts: Stmt[], i: number, acc: Set<string>) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: s }) =>
            collectValueRefs(
              ctx,
              stmts,
              i + 1,
              ((_v) =>
                _v._tag === "SLet"
                  ? (({ value }) => exprRefs(ctx, value, acc))(_v)
                  : _v._tag === "SExpr"
                    ? (({ value }) => exprRefs(ctx, value, acc))(_v)
                    : acc)(s),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, stmts)),
);
const refsForStmt: _Curry<[ctx: GCtx, s: Stmt], Set<string>> = _curry(2, (ctx: GCtx, s: Stmt) =>
  ((_v) =>
    _v._tag === "SLet"
      ? (({ value }) => exprRefs(ctx, value, _Set_fromArray([] as string[])))(_v)
      : _v._tag === "SExpr"
        ? (({ value }) => exprRefs(ctx, value, _Set_fromArray([] as string[])))(_v)
        : _v._tag === "SType"
          ? (({ ctors, exported }) =>
              someOf(
                (c: Ctor) =>
                  and(length(c.fields) >= 2, or(exported, _Set_has(c.name, ctx.valueRefs))),
                ctors,
              )
                ? _Set_add("_curry", _Set_fromArray([] as string[]))
                : _Set_fromArray([] as string[]))(_v)
          : _v._tag === "SExtern"
            ? (({ typeExpr }) =>
                typeExprArity(typeExpr) >= 2
                  ? _Set_add("_curry", _Set_fromArray([] as string[]))
                  : _Set_fromArray([] as string[]))(_v)
            : _Set_fromArray([] as string[]))(s),
);
const collectRefsFrom: _Curry<
  [ctx: GCtx, stmts: Stmt[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, stmts: Stmt[], i: number, acc: Set<string>) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: s }) =>
            collectRefsFrom(ctx, stmts, i + 1, _Set_union(acc, refsForStmt(ctx, s))))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, stmts)),
);
const addDepsFrom: <A>(deps: A[], j: number, refs: Set<A>, queue: A[]) => [Set<A>, A[]] = _curry(
  4,
  <A>(deps: A[], j: number, refs: Set<A>, queue: A[]) =>
    ((_v) =>
      _v._tag === "None"
        ? _tuple(refs, queue)
        : _v._tag === "Some"
          ? (({ value: d }) =>
              _Set_has(d, refs)
                ? addDepsFrom(deps, j + 1, refs, queue)
                : addDepsFrom(deps, j + 1, _Set_add(d, refs), _Array_append(d, queue)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(j, deps)),
);
const closeRefsFrom: <A>(queue: A[], i: number, refs: Set<A>, runtimeDeps: Map<A, A[]>) => Set<A> =
  _curry(4, <A>(queue: A[], i: number, refs: Set<A>, runtimeDeps: Map<A, A[]>) =>
    ((_v) =>
      _v._tag === "None"
        ? refs
        : _v._tag === "Some"
          ? (({ value: r }) =>
              ((deps) =>
                (([refs2, queue2]: [Set<A>, A[]]) =>
                  closeRefsFrom(queue2, i + 1, refs2, runtimeDeps))(
                  addDepsFrom(deps, 0, refs, queue),
                ))(_Option_unwrapOr([] as A[], _Map_get(r, runtimeDeps))))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, queue)),
  );
/**
 * The runtime helper names a program actually references, transitively closed
 * over `runtimeDeps` and minus anything the program binds itself. The JS
 * backend inlines their defs (`preludePreamble`); the TS backend imports them
 * from the typed runtime instead (ADR 0026 / 0075), so both start here.
 */
const runtimeRefNames: <A>(
  ctx: GCtx,
  stmts: Stmt[],
  jsDefs: Map<string, A>,
  runtimeDeps: Map<string, string[]>,
) => string[] = _curry(
  4,
  <A>(ctx: GCtx, stmts: Stmt[], jsDefs: Map<string, A>, runtimeDeps: Map<string, string[]>) => {
    const refs0: Set<string> = collectRefsFrom(ctx, stmts, 0, _Set_fromArray([] as string[]));
    const refs: Set<string> = closeRefsFrom(_Set_toArray(refs0), 0, refs0, runtimeDeps);
    const bound: Set<string> = boundNames(ctx.valueRefs, stmts);
    return filter((n: string) => and(_Set_has(n, refs), !_Set_has(n, bound)), _Map_keys(jsDefs));
  },
);
const preludePreamble: _Curry<
  [ctx: GCtx, stmts: Stmt[], jsDefs: Map<string, string>, runtimeDeps: Map<string, string[]>],
  string
> = _curry(
  4,
  (ctx: GCtx, stmts: Stmt[], jsDefs: Map<string, string>, runtimeDeps: Map<string, string[]>) => {
    const names: string[] = runtimeRefNames(ctx, stmts, jsDefs, runtimeDeps);
    const defs: string[] = map((n: string) => _Map_getOr("", n, jsDefs), names);
    return length(defs) === 0
      ? ""
      : `${_Str_join("\n", defs)}

`;
  },
);
const genStmtAllFrom: _Curry<[ctx: GCtx, stmts: Stmt[], i: number], string[]> = _curry(
  3,
  (ctx: GCtx, stmts: Stmt[], i: number) =>
    ((_v) =>
      _v._tag === "None"
        ? ([] as string[])
        : _v._tag === "Some"
          ? (({ value: s }) => _Array_prepend(genStmt(ctx, s), genStmtAllFrom(ctx, stmts, i + 1)))(
              _v,
            )
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, stmts)),
);
/**
 * `useRuntime`: inline the prelude builtins the program uses, so the emitted
 * module runs standalone. `ns`/`jsDefs`/`runtimeDeps` are the TS prelude's
 * `namespaceRuntime`/`preludeJsDefs`/`runtimeDeps` tables, converted to
 * mochi Maps — the same tables the TS codegen consults, not a fork of them.
 * Emit one program under explicit backend options. The JS backend calls
 * `codegen` (all hooks `None`); the TS backend supplies annotation hooks and
 * the `flattenPipe` / `tupleHelper` / `moduleExt` switches (ADR 0026 / 0090).
 */
export const codegenWith: <A>(
  stmts: Stmt[],
  imported: Map<string, string[]>,
  useRuntime: boolean,
  ns: Map<string, Map<string, string>>,
  jsDefs: Map<string, string>,
  runtimeDeps: Map<string, string[]>,
  opts: {
    docs: boolean;
    moduleExt: string;
    preserveJsx: boolean;
    preserveInfix: boolean;
    tupleHelper: boolean;
    flattenPipe: boolean;
    guardBaseType: Option<(a: Expr) => Option<string>>;
    annotateCall: Option<(a: Expr) => Option<string>>;
    annotateLetin: Option<(a: Expr) => Option<string>>;
    annotateEmpty: Option<(a: Expr) => Option<string>>;
    annotateParams: Option<(a: SpanAt, b: number) => ParamAnnots>;
    annotateCtor: Option<(a: Stmt, b: Ctor) => Option<CtorFactoryTs>>;
    annotateLet: Option<(a: string, b: Expr) => Option<string>>;
  } & A,
) => string = _curry(
  7,
  <A>(
    stmts: Stmt[],
    imported: Map<string, string[]>,
    useRuntime: boolean,
    ns: Map<string, Map<string, string>>,
    jsDefs: Map<string, string>,
    runtimeDeps: Map<string, string[]>,
    opts: {
      docs: boolean;
      moduleExt: string;
      preserveJsx: boolean;
      preserveInfix: boolean;
      tupleHelper: boolean;
      flattenPipe: boolean;
      guardBaseType: Option<(a: Expr) => Option<string>>;
      annotateCall: Option<(a: Expr) => Option<string>>;
      annotateLetin: Option<(a: Expr) => Option<string>>;
      annotateEmpty: Option<(a: Expr) => Option<string>>;
      annotateParams: Option<(a: SpanAt, b: number) => ParamAnnots>;
      annotateCtor: Option<(a: Stmt, b: Ctor) => Option<CtorFactoryTs>>;
      annotateLet: Option<(a: string, b: Expr) => Option<string>>;
    } & A,
  ) => {
    const keys0: Map<string, string[]> = ctorKeysFromStmts(stmts, imported);
    const keys: Map<string, string[]> = seedBuiltinCtorKeys(stmts, keys0);
    const ctx0: GCtx = {
      keys: keys,
      ns: ns,
      annotateLet: opts.annotateLet,
      annotateCtor: opts.annotateCtor,
      annotateParams: opts.annotateParams,
      annotateEmpty: opts.annotateEmpty,
      annotateLetin: opts.annotateLetin,
      annotateCall: opts.annotateCall,
      guardBaseType: opts.guardBaseType,
      flattenPipe: opts.flattenPipe,
      tupleHelper: opts.tupleHelper,
      preserveInfix: opts.preserveInfix,
      preserveJsx: opts.preserveJsx,
      moduleExt: opts.moduleExt,
      valueRefs: _Set_fromArray([]),
      docs: opts.docs,
    };
    const valueRefs: Set<string> = collectValueRefs(ctx0, stmts, 0, _Set_fromArray([] as string[]));
    const ctx: GCtx = { ...ctx0, valueRefs: valueRefs };
    const needsMatch: boolean = someOf(
      (s: Stmt) =>
        ((_v) =>
          _v._tag === "SLet"
            ? (({ value }) => usesMatchLib(ctx, value))(_v)
            : _v._tag === "SExpr"
              ? (({ value }) => usesMatchLib(ctx, value))(_v)
              : false)(s),
      stmts,
    );
    const header: string = needsMatch ? 'import { match } from "@onrails/pattern";\n\n' : "";
    const preamble: string = useRuntime ? preludePreamble(ctx, stmts, jsDefs, runtimeDeps) : "";
    const body: string = _Str_join("\n", genStmtAllFrom(ctx, stmts, 0));
    return `${header}${preamble}${body}
`;
  },
);
/**
 * The runtime helpers a program references, for the TS backend's
 * `import { … } from "@mochi/runtime"` line. Builds the same ctx `codegenWith`
 * does, so the two agree on ctor keys and namespace ids.
 */
export const runtimeDepNames: <A>(
  stmts: Stmt[],
  imported: Map<string, string[]>,
  ns: Map<string, Map<string, string>>,
  jsDefs: Map<string, A>,
  runtimeDeps: Map<string, string[]>,
) => string[] = _curry(
  5,
  <A>(
    stmts: Stmt[],
    imported: Map<string, string[]>,
    ns: Map<string, Map<string, string>>,
    jsDefs: Map<string, A>,
    runtimeDeps: Map<string, string[]>,
  ) => {
    const keys: Map<string, string[]> = seedBuiltinCtorKeys(
      stmts,
      ctorKeysFromStmts(stmts, imported),
    );
    const ctx0: GCtx = {
      keys: keys,
      ns: ns,
      annotateLet: None,
      annotateCtor: None,
      annotateParams: None,
      annotateEmpty: None,
      annotateLetin: None,
      annotateCall: None,
      guardBaseType: None,
      flattenPipe: false,
      tupleHelper: false,
      preserveInfix: false,
      preserveJsx: false,
      moduleExt: ".js",
      valueRefs: _Set_fromArray([]),
      docs: false,
    };
    const valueRefs: Set<string> = collectValueRefs(ctx0, stmts, 0, _Set_fromArray([] as string[]));
    return runtimeRefNames({ ...ctx0, valueRefs: valueRefs }, stmts, jsDefs, runtimeDeps);
  },
);
/**
 * The JS backend: no annotations, `.js` siblings — byte-identical to the
 * output before `codegenWith` existed.
 */
export const codegen: _Curry<
  [
    stmts: Stmt[],
    imported: Map<string, string[]>,
    useRuntime: boolean,
    ns: Map<string, Map<string, string>>,
    jsDefs: Map<string, string>,
    runtimeDeps: Map<string, string[]>,
  ],
  string
> = _curry(
  6,
  (
    stmts: Stmt[],
    imported: Map<string, string[]>,
    useRuntime: boolean,
    ns: Map<string, Map<string, string>>,
    jsDefs: Map<string, string>,
    runtimeDeps: Map<string, string[]>,
  ) => codegenWith(stmts, imported, useRuntime, ns, jsDefs, runtimeDeps, jsGenOpts),
);
