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
} from "../ast/ast";
import type { SpanAt } from "../infer/types";
import type { TSt } from "../infer/scc";

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
  annotateRaw: Option<(a: string, b: Expr) => Option<string>>;
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
  customCtorKeys: Map<string, string[]>;
  ns: Map<string, Map<string, string>>;
  annotateLet: Option<(a: string, b: Expr) => Option<string>>;
  annotateRaw: Option<(a: string, b: Expr) => Option<string>>;
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
  rawNames: Map<string, string>;
  rawArity: Map<string, number>;
  valueRefs: Set<string>;
  userNames: Set<string>;
  docs: boolean;
};
export type OptionalMatch = { binding: string; present: Expr; absent: Expr };
export type BuiltinMatchPlan = {
  helper: string;
  leftBinding: string;
  left: Expr;
  rightBinding: string;
  right: Expr;
};

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_append,
  _Array_concat,
  _Array_flatMap,
  _Array_get,
  _Array_prepend,
  _List_concat,
  _Map_get,
  _Map_getOr,
  _Map_has,
  _Map_keys,
  _Map_set,
  _Option_contains,
  _Option_exists,
  _Option_isNone,
  _Option_isSome,
  _Option_match,
  _Option_unwrapOr,
  _Set_add,
  _Set_fromArray,
  _Set_has,
  _Set_size,
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
  _keyOf,
  _list,
  _recur,
  _setAdd,
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

import * as Ast from "../ast/ast";
import { patSlot, patConds, patTarget } from "./pattern";
import { jsStringLit, litValue } from "./literals";
import { localBinderNames } from "../infer/local-names";
import { keysOf, ctorKeysFromStmts, seedBuiltinCtorKeys } from "../ast/ctors";

/**
 * The JS backend's knobs: no annotation, no rewriting, `.js` siblings.
 * Annotated so the emitted TS keeps the hook types instead of widening the
 * bare `None`s to `Option<unknown>` (ADR 0044).
 */
export const jsGenOpts: GenOpts = {
  annotateLet: None as Option<(a: string, b: Expr) => Option<string>>,
  annotateRaw: None as Option<(a: string, b: Expr) => Option<string>>,
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
    _Option_match(
      h,
      () => None,
      (f) => f(x),
    ),
);
/**
 * `hook1` for the two-argument hooks.
 */
const hook2: <A, B, C>(h: Option<(a: A, b: B) => Option<C>>, x: A, y: B) => Option<C> = _curry(
  3,
  <A, B, C>(h: Option<(a: A, b: B) => Option<C>>, x: A, y: B) =>
    _Option_match(
      h,
      () => None,
      (f) => f(x, y),
    ),
);
const emptyNsCtor$ = (con: string, ann: Option<string>): string =>
  _Option_match(
    ann,
    () => `new ${con}()`,
    (t) => `new ${t}()`,
  );
/**
 * `new Map<K, V>()` when annotated, `new Map()` otherwise.
 */
const emptyNsCtor: _Curry<[con: string, ann: Option<string>], string> = _curry(2, emptyNsCtor$);
/**
 * Uppercase-initial name — a constructor, not an ordinary binding.
 * A record field name emits BARE only when it is a valid JS identifier;
 * anything else (`data-testid`, `aria-label`) must be quoted or the object
 * literal is a syntax error. Mirrors JavaScript's identifier shape.
 */
const isIdentStart: (c: number) => boolean = (c: number) =>
  or(or(or(and(c >= 65, c <= 90), and(c >= 97, c <= 122)), c === 95), c === 36);
const isIdentPart: (c: number) => boolean = (c: number) =>
  or(isIdentStart(c), and(c >= 48, c <= 57));
const identPartsFrom$ = (s: string, i: number): boolean =>
  _Option_match(
    _Str_codeAt(i, s),
    () => true,
    (c) => and(isIdentPart(c), identPartsFrom$(s, i + 1)),
  );
const identPartsFrom: _Curry<[s: string, i: number], boolean> = _curry(2, identPartsFrom$);
const isJsIdent: (s: string) => boolean = (s: string) =>
  _Option_match(
    _Str_codeAt(0, s),
    () => false,
    (c) => and(isIdentStart(c), identPartsFrom$(s, 1)),
  );
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
const isCtorRef: (fn: Expr) => boolean = (fn: Expr) => {
  const $match = fn;
  switch ($match._tag) {
    case "ERef": {
      const { name } = $match;
      return isUpperStart(name);
    }
    default: {
      return false;
    }
  }
};
const suffixOr$ = (name: string, ann: Option<string>): string =>
  _Option_match(
    ann,
    () => name,
    (t) => `${name}: ${t}`,
  );
/**
 * `name: T` when annotated, bare name otherwise.
 */
const suffixOr: _Curry<[name: string, ann: Option<string>], string> = _curry(2, suffixOr$);
/**
 * No annotations at all — the JS backend's shape for every lambda.
 */
const bareParamAnnots: ParamAnnots = { generics: "", params: [] as Option<string>[] };
const paramAnnotsFor: <A, B>(
  h: Option<(a: A, b: B) => ParamAnnots>,
  sp: A,
  arity: B,
) => ParamAnnots = _curry(3, <A, B>(h: Option<(a: A, b: B) => ParamAnnots>, sp: A, arity: B) =>
  _Option_match(
    h,
    () => bareParamAnnots,
    (f) => f(sp, arity),
  ),
);
const annotatedParams$ = (cparams: LamParam[], annots: Option<string>[], i: number): string[] =>
  _Option_match(
    _Array_get(i, cparams),
    () => [] as string[],
    (p) =>
      _Array_prepend(
        suffixOr$(genParam(p), _Option_unwrapOr(None as Option<string>, _Array_get(i, annots))),
        annotatedParams$(cparams, annots, i + 1),
      ),
  );
/**
 * Zip collapsed params with their annotations; a missing or `None` entry
 * leaves the param bare (generic position, or JS mode).
 */
const annotatedParams: _Curry<
  [cparams: LamParam[], annots: Option<string>[], i: number],
  string[]
> = _curry(3, annotatedParams$);
const castOr$ = (js: string, ann: Option<string>): string =>
  _Option_match(
    ann,
    () => js,
    (t) => `(${js} as ${t})`,
  );
/**
 * `expr as T` when annotated, bare otherwise.
 */
const castOr: _Curry<[js: string, ann: Option<string>], string> = _curry(2, castOr$);
const bindRuntime: (monad: string) => string = (monad: string) =>
  monad === "Option" ? "_Option_flatMap" : monad === "Result" ? "_Result_flatMap" : "_Task_andThen";
const allOfFrom: <A>(f: (a: A) => boolean, xs: A[], i: number) => boolean = _curry(
  3,
  <A>(f: (a: A) => boolean, xs: A[], i: number) =>
    _Option_match(
      _Array_get(i, xs),
      () => true,
      (x) => (f(x) ? allOfFrom(f, xs, i + 1) : false),
    ),
);
const allOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) => allOfFrom(f, xs, 0),
);
const someOfFrom: <A>(f: (a: A) => boolean, xs: A[], i: number) => boolean = _curry(
  3,
  <A>(f: (a: A) => boolean, xs: A[], i: number) =>
    _Option_match(
      _Array_get(i, xs),
      () => false,
      (x) => (f(x) ? true : someOfFrom(f, xs, i + 1)),
    ),
);
const someOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) => someOfFrom(f, xs, 0),
);
const escTemplateLoop$ = (chars: string[], i0: number, acc0: string): string => {
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
};
const escTemplateLoop: _Curry<[chars: string[], i0: number, acc0: string], string> = _curry(
  3,
  escTemplateLoop$,
);
const escapeTemplateLiteral: (s: string) => string = (s: string) =>
  escTemplateLoop$(_Str_chars(s), 0, "");
const keyAt$ = (ctx: GCtx, ctor: string, i: number): string =>
  _Option_match(
    _Map_get(ctor, ctx.keys),
    () => `_${show(i)}`,
    (ks) => _Option_unwrapOr(`_${show(i)}`, _Array_get(i, ks)),
  );
const keyAt: _Curry<[ctx: GCtx, ctor: string, i: number], string> = _curry(3, keyAt$);
const nsRuntimeId$ = (ctx: GCtx, target: Expr, name: string): Option<string> => {
  const $match = target;
  switch ($match._tag) {
    case "ERef": {
      const { name: refName } = $match;
      return _Option_match(
        _Map_get(refName, ctx.ns),
        () => None as Option<string>,
        (members) => _Map_get(name, members),
      );
    }
    default: {
      return None as Option<string>;
    }
  }
};
const nsRuntimeId: _Curry<[ctx: GCtx, target: Expr, name: string], Option<string>> = _curry(
  3,
  nsRuntimeId$,
);
const emptyNsEmit$ = (target: Expr, name: string, ann: Option<string>): Option<string> => {
  const $match = target;
  switch ($match._tag) {
    case "ERef": {
      const { name: refName } = $match;
      return name === "empty"
        ? refName === "Set"
          ? (Some(emptyNsCtor$("Set", ann)) as Option<string>)
          : refName === "Map"
            ? (Some(emptyNsCtor$("Map", ann)) as Option<string>)
            : refName === "List"
              ? (Some("_list(function* () {})") as Option<string>)
              : (None as Option<string>)
        : (None as Option<string>);
    }
    default: {
      return None as Option<string>;
    }
  }
};
/**
 * `Set.empty` / `Map.empty` / `List.empty` lower to the same runtime as
 * `@{}` / `#{}` (ADR 0080). `ann` is the resolved element typing when the TS
 * backend supplies one — a bare `new Set()` infers `Set<never>` (ADR 0035).
 */
const emptyNsEmit: _Curry<
  [target: Expr, name: string, ann: Option<string>],
  Option<string>
> = _curry(3, emptyNsEmit$);
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
const splitLamParams$ = (
  params: LamParam[],
  positional: LamParam[],
  labeled: LamParam[],
): [LamParam[], LamParam[]] =>
  ((_v) =>
    _v.length === 0
      ? _tuple(positional, labeled)
      : _v.length >= 1
        ? (([p, ...rest]) =>
            isLabeledParam(p)
              ? splitLamParams$(rest, positional, _Array_append(p, labeled))
              : splitLamParams$(rest, _Array_append(p, positional), labeled))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(params);
const splitLamParams: _Curry<
  [params: LamParam[], positional: LamParam[], labeled: LamParam[]],
  [LamParam[], LamParam[]]
> = _curry(3, splitLamParams$);
const absorbParams$ = (
  params: LamParam[],
  acc: LamParam[],
  fills: { labVar: string; labs: LamParam[] }[],
  labN: number,
): [LamParam[], { labVar: string; labs: LamParam[] }[], number] =>
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
  })(splitLamParams$(params, [] as LamParam[], [] as LamParam[]));
const absorbParams: _Curry<
  [
    params: LamParam[],
    acc: LamParam[],
    fills: { labVar: string; labs: LamParam[] }[],
    labN: number,
  ],
  [LamParam[], { labVar: string; labs: LamParam[] }[], number]
> = _curry(4, absorbParams$);
const collapseLambdaFrom$ = (
  params: LamParam[],
  body: Expr,
  acc: LamParam[],
  fills: { labVar: string; labs: LamParam[] }[],
  labN: number,
): [LamParam[], Expr, { labVar: string; labs: LamParam[] }[]] =>
  (([acc1, fills1, labN1]: [LamParam[], { labVar: string; labs: LamParam[] }[], number]) => {
    const $match = body;
    switch ($match._tag) {
      case "ELambda": {
        const { params: params2, body: body2 } = $match;
        return collapseLambdaFrom$(params2, body2, acc1, fills1, labN1);
      }
      default: {
        return _tuple(acc1, body, fills1);
      }
    }
  })(absorbParams$(params, acc, fills, labN));
const collapseLambdaFrom: _Curry<
  [
    params: LamParam[],
    body: Expr,
    acc: LamParam[],
    fills: { labVar: string; labs: LamParam[] }[],
    labN: number,
  ],
  [LamParam[], Expr, { labVar: string; labs: LamParam[] }[]]
> = _curry(5, collapseLambdaFrom$);
const collapseLambda$ = (
  params: LamParam[],
  body: Expr,
): [LamParam[], Expr, { labVar: string; labs: LamParam[] }[]] =>
  collapseLambdaFrom$(
    params,
    body,
    [] as LamParam[],
    [] as { labVar: string; labs: LamParam[] }[],
    0,
  );
const collapseLambda: _Curry<
  [params: LamParam[], body: Expr],
  [LamParam[], Expr, { labVar: string; labs: LamParam[] }[]]
> = _curry(2, collapseLambda$);
/**
 * A string, number or bool literal.
 */
const isPrimLit: (e: Expr) => boolean = (e: Expr) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return true;
    }
    case "EStr": {
      return true;
    }
    case "EBool": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const eqTest$ = (ctx: GCtx, left: Expr, right: Expr, op: string): Option<string> =>
  ((_v) =>
    _v[1]._tag === "ERef" &&
    (([, { name: c }]) => isNullaryCtor(c, ctx.keys))(
      _v as [[Expr, Expr][0], Extract<[Expr, Expr][1], { _tag: "ERef" }>],
    )
      ? (([, { name: c }]) =>
          Some(`(${genMember$(ctx, left)}._tag ${op} "${c}")`) as Option<string>)(
          _v as [[Expr, Expr][0], Extract<[Expr, Expr][1], { _tag: "ERef" }>],
        )
      : _v[0]._tag === "ERef" &&
          (([{ name: c }]) => isNullaryCtor(c, ctx.keys))(
            _v as [Extract<[Expr, Expr][0], { _tag: "ERef" }>, [Expr, Expr][1]],
          )
        ? (([{ name: c }]) =>
            Some(`(${genMember$(ctx, right)}._tag ${op} "${c}")`) as Option<string>)(
            _v as [Extract<[Expr, Expr][0], { _tag: "ERef" }>, [Expr, Expr][1]],
          )
        : or(isPrimLit(left), isPrimLit(right))
          ? (Some(`(${genExpr$(ctx, left)} ${op} ${genExpr$(ctx, right)})`) as Option<string>)
          : (None as Option<string>))(_tuple(left, right));
/**
 * Structural `eq` as a JavaScript comparison, where the two agree exactly
 * (ADR 0115): against a primitive literal it is `===`, and against a nullary
 * ctor (a bare `{ _tag }`) it is a tag test. `op` is `===` or `!==`.
 */
const eqTest: _Curry<[ctx: GCtx, left: Expr, right: Expr, op: string], Option<string>> = _curry(
  4,
  eqTest$,
);
const isUserCall$ = (ctx: GCtx, fn: Expr): boolean => {
  const $match = fn;
  switch ($match._tag) {
    case "ERef": {
      const { name } = $match;
      return _Set_has(name, ctx.userNames);
    }
    default: {
      return false;
    }
  }
};
/**
 * A call to a name the module binds itself, not the prelude function.
 */
const isUserCall: _Curry<[ctx: GCtx, fn: Expr], boolean> = _curry(2, isUserCall$);
const tsInfix$ = (ctx: GCtx, fn: Expr, args: Expr[]): Option<string> =>
  or(!ctx.preserveInfix, isUserCall$(ctx, fn))
    ? (None as Option<string>)
    : ((_v) =>
        _v[0]._tag === "ERef" && _v[0].name === "eq" && _v[1].length === 2
          ? (([, [left, right]]) => eqTest$(ctx, left, right, "==="))(
              _v as [Extract<[Expr, Expr[]][0], { _tag: "ERef" }>, [Expr, Expr[]][1]],
            )
          : _v[0]._tag === "ERef" && _v[0].name === "not" && _v[1].length === 1
            ? (([, [operand]]) =>
                ((_v) =>
                  _v._tag === "ECall" &&
                  _v.fn._tag === "ERef" &&
                  _v.fn.name === "eq" &&
                  _v.args.length === 2 &&
                  (({ args: [left, right] }) => !_Set_has("eq", ctx.userNames))(
                    _v as Extract<Expr, { _tag: "ECall" }> & {
                      fn: Extract<Extract<Expr, { _tag: "ECall" }>["fn"], { _tag: "ERef" }>;
                    },
                  )
                    ? (({ args: [left, right] }) =>
                        _Option_match(
                          eqTest$(ctx, left, right, "!=="),
                          () => Some(`!(${genExpr$(ctx, operand)})`) as Option<string>,
                          (test) => Some(test) as Option<string>,
                        ))(
                        _v as Extract<Expr, { _tag: "ECall" }> & {
                          fn: Extract<Extract<Expr, { _tag: "ECall" }>["fn"], { _tag: "ERef" }>;
                        },
                      )
                    : (Some(`!(${genExpr$(ctx, operand)})`) as Option<string>))(operand))(
                _v as [Extract<[Expr, Expr[]][0], { _tag: "ERef" }>, [Expr, Expr[]][1]],
              )
            : _v[0]._tag === "ERef" && _v[1].length === 2
              ? (([{ name }, [left, right]]) =>
                  ((_v) =>
                    _v === "add"
                      ? (Some(
                          `(${genExpr$(ctx, left)} + ${genExpr$(ctx, right)})`,
                        ) as Option<string>)
                      : _v === "sub"
                        ? (Some(
                            `(${genExpr$(ctx, left)} - ${genExpr$(ctx, right)})`,
                          ) as Option<string>)
                        : _v === "mul"
                          ? (Some(
                              `(${genExpr$(ctx, left)} * ${genExpr$(ctx, right)})`,
                            ) as Option<string>)
                          : _v === "div"
                            ? (Some(
                                `(${genExpr$(ctx, left)} / ${genExpr$(ctx, right)})`,
                              ) as Option<string>)
                            : _v === "lt"
                              ? (Some(
                                  `(${genExpr$(ctx, left)} < ${genExpr$(ctx, right)})`,
                                ) as Option<string>)
                              : _v === "lte"
                                ? (Some(
                                    `(${genExpr$(ctx, left)} <= ${genExpr$(ctx, right)})`,
                                  ) as Option<string>)
                                : _v === "gt"
                                  ? (Some(
                                      `(${genExpr$(ctx, left)} > ${genExpr$(ctx, right)})`,
                                    ) as Option<string>)
                                  : _v === "gte"
                                    ? (Some(
                                        `(${genExpr$(ctx, left)} >= ${genExpr$(ctx, right)})`,
                                      ) as Option<string>)
                                    : (None as Option<string>))(name))(
                  _v as [Extract<[Expr, Expr[]][0], { _tag: "ERef" }>, [Expr, Expr[]][1]],
                )
              : (None as Option<string>))(_tuple(fn, args));
/**
 * The calls whose saturated runtime behavior is exactly JavaScript's infix
 * behavior: the numeric operators, `not`, and the `eq` / `!=` cases of
 * `eqTest`. General `eq` is structural and `mod` is true modulo, so neither
 * belongs here. `and` / `or` evaluate both sides, unlike `&&` / `||`.
 */
const tsInfix: _Curry<[ctx: GCtx, fn: Expr, args: Expr[]], Option<string>> = _curry(3, tsInfix$);
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
const jsxAttrs$ = (ctx: GCtx, fields: Field[], spread: Option<Expr>): string => {
  const head: string = _Option_match(
    spread,
    () => "",
    (value) => ` {...${genExpr$(ctx, value)}}`,
  );
  return `${head}${_Str_join(
    "",
    map(
      (f: Field) =>
        ((_v) =>
          _v._tag === "EBool" && _v.value === true
            ? ` ${f.name}`
            : ((value) => ` ${f.name}={${genExpr$(ctx, value)}}`)(_v))(f.value),
      fields,
    ),
  )}`;
};
const jsxAttrs: _Curry<[ctx: GCtx, fields: Field[], spread: Option<Expr>], string> = _curry(
  3,
  jsxAttrs$,
);
const tsxArgs$ = (ctx: GCtx, args: Expr[]): Option<string> =>
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
                            map((child: SeqElem) => {
                              const $match = child;
                              switch ($match._tag) {
                                case "SEExpr": {
                                  const { expr: value } = $match;
                                  return `{${genExpr$(ctx, value)}}`;
                                }
                                case "SESpread": {
                                  return "";
                                }
                                default: {
                                  throw new Error("non-exhaustive match");
                                }
                              }
                            }, children),
                          ),
                        ))(jsxAttrs$(ctx, fields, spread)))(
                  fragment
                    ? ""
                    : ((_v) =>
                        _v._tag === "EStr" ? (({ value }) => value)(_v) : genMember$(ctx, tag))(
                        tag,
                      ),
                ))(((_v) => (_v._tag === "EStr" && _v.value === "Fragment" ? true : false))(tag)))(
          _v as [
            Expr[][number],
            Extract<Expr[][number], { _tag: "ERecord" }>,
            Extract<Expr[][number], { _tag: "EArr" }>,
          ],
        )
      : (None as Option<string>))(args);
/**
 * Re-fold only the parser's provenance-tagged `h(tag, props, children)`.
 * A source-written `h(...)` remains a call, and child spreads retain that
 * call form because JSX has no equivalent spread-child syntax.
 */
const tsxArgs: _Curry<[ctx: GCtx, args: Expr[]], Option<string>> = _curry(2, tsxArgs$);
const tsxCall$ = (ctx: GCtx, fn: Expr, args: Expr[], origin: Option<string>): Option<string> =>
  !ctx.preserveJsx
    ? (None as Option<string>)
    : ((_v) =>
        _v._tag === "Some" && _v.value === "jsx"
          ? ((_v) =>
              _v._tag === "ERef" && _v.name === "h"
                ? tsxArgs$(ctx, args)
                : (None as Option<string>))(fn)
          : (None as Option<string>))(origin);
const tsxCall: _Curry<
  [ctx: GCtx, fn: Expr, args: Expr[], origin: Option<string>],
  Option<string>
> = _curry(4, tsxCall$);
const genArrow$ = (
  ctx: GCtx,
  params: LamParam[],
  body: Expr,
  sp: SpanAt,
  ret: string,
): [string, number] =>
  (([cparams, cbody, fills]: [LamParam[], Expr, { labVar: string; labs: LamParam[] }[]]) => {
    const bound: Set<string> = fillNames(
      fills,
      paramNameSet$(cparams, 0, _Set_fromArray([] as string[])),
    );
    const annots: ParamAnnots = paramAnnotsFor(ctx.annotateParams, sp, length(cparams));
    return _tuple(
      `${annots.generics}(${_Str_join(", ", annotatedParams$(cparams, annots.params, 0))})${ret} => ${genLambdaBodyIn$(ctx, cbody, bound, genFillDecls$(ctx, fills))}`,
      length(cparams),
    );
  })(collapseLambda$(params, body));
/**
 * The arrow for a lambda, collapsed over its curried spine, and its collapsed
 * arity. Shared by the `_curry`-wrapped expression form and a top-level raw
 * twin (ADR 0149).
 */
const genArrow: _Curry<
  [ctx: GCtx, params: LamParam[], body: Expr, sp: SpanAt, ret: string],
  [string, number]
> = _curry(5, genArrow$);
const genCalleeFor$ = (ctx: GCtx, fn: Expr, argc: number): string => {
  const $match = fn;
  switch ($match._tag) {
    case "ERef": {
      const { name } = $match;
      return ((_v) =>
        _v[0]._tag === "Some" &&
        _v[1]._tag === "Some" &&
        (([{ value: n }, { value: raw }]) => eq(n, argc))(
          _v as [
            Extract<[Option<number>, Option<string>][0], { _tag: "Some" }>,
            Extract<[Option<number>, Option<string>][1], { _tag: "Some" }>,
          ],
        )
          ? (([{ value: n }, { value: raw }]) => raw)(
              _v as [
                Extract<[Option<number>, Option<string>][0], { _tag: "Some" }>,
                Extract<[Option<number>, Option<string>][1], { _tag: "Some" }>,
              ],
            )
          : genCallee$(ctx, fn))(
        _tuple(_Map_get(name, ctx.rawArity), _Map_get(name, ctx.rawNames)),
      );
    }
    default: {
      return genCallee$(ctx, fn);
    }
  }
};
/**
 * The callee text for a call with `argc` arguments: the raw twin when the
 * callee is a top-level function of exactly that arity (ADR 0149), else the
 * ordinary callee.
 */
const genCalleeFor: _Curry<[ctx: GCtx, fn: Expr, argc: number], string> = _curry(3, genCalleeFor$);
const isPipeHole: (a: Expr) => boolean = (a: Expr) =>
  ((_v) => (_v._tag === "ERef" && _v.name === "_" ? true : false))(a);
const hasPipeHole: (right: Expr) => boolean = (right: Expr) => {
  const $match = right;
  switch ($match._tag) {
    case "ECall": {
      const { args: rargs } = $match;
      return someOf(isPipeHole, rargs);
    }
    default: {
      return false;
    }
  }
};
const isPipeAtom: (e: Expr) => boolean = (e: Expr) => {
  const $match = e;
  switch ($match._tag) {
    case "ERef": {
      return true;
    }
    case "ENum": {
      return true;
    }
    case "EStr": {
      return true;
    }
    case "EBool": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const fillPipeHole$ = (left: Expr, right: Expr, sp: SpanAt): Expr => {
  const $match = right;
  switch ($match._tag) {
    case "ECall": {
      const { fn: rfn, args: rargs, origin } = $match;
      const v: Expr = isPipeAtom(left) ? left : Ast.ERef("$pipe", sp);
      const call: Expr = Ast.ECall(
        rfn,
        map((a: Expr) => (isPipeHole(a) ? v : a), rargs),
        origin,
        sp,
      );
      return isPipeAtom(left)
        ? call
        : Ast.ELetIn("$pipe", sp, None as Option<TypeExpr>, left, call, sp);
    }
    default: {
      return right;
    }
  }
};
const fillPipeHole: _Curry<[left: Expr, right: Expr, sp: SpanAt], Expr> = _curry(3, fillPipeHole$);
const genExpr$ = (ctx: GCtx, e: Expr): string => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      const { raw } = $match;
      return raw;
    }
    case "EUnit": {
      return "undefined";
    }
    case "EBool": {
      const { value } = $match;
      return value ? "true" : "false";
    }
    case "EStr": {
      const { value } = $match;
      return jsStringLit(value);
    }
    case "ERef": {
      const { name } = $match;
      return castOr$(
        name,
        isNullaryCtor(name, ctx.keys) ? hook1(ctx.annotateEmpty, e) : (None as Option<string>),
      );
    }
    case "ECall": {
      const { fn, args, origin } = $match;
      return _Option_match(
        tsxCall$(ctx, fn, args, origin),
        () =>
          _Option_match(
            tsInfix$(ctx, fn, args),
            () => {
              const inner: string = `${genCalleeFor$(ctx, fn, length(args))}(${_Str_join(
                ", ",
                map((a: Expr) => genExpr$(ctx, a), args),
              )})`;
              return castOr$(
                inner,
                isCtorRef(fn) ? hook1(ctx.annotateCall, e) : (None as Option<string>),
              );
            },
            (infix) => infix,
          ),
        (jsx) => jsx,
      );
    }
    case "ELambda": {
      const { params, body, span: sp } = $match;
      return (([arrow, arity]: [string, number]) =>
        arity >= 2 ? `_curry(${show(arity)}, ${arrow})` : arrow)(
        genArrow$(ctx, params, body, sp, ""),
      );
    }
    case "ELetIn": {
      const { name, value, body } = $match;
      const param: string = suffixOr$(name, hook1(ctx.annotateLetin, value));
      return `((${param}) => ${genLambdaBody$(ctx, body)})(${genExpr$(ctx, value)})`;
    }
    case "ELetBind": {
      const { param, monad, value, body } = $match;
      const rt: string = bindRuntime(monad);
      const f: string = `(${genParam(param)}) => ${genLambdaBody$(ctx, body)}`;
      const v: string = genExpr$(ctx, value);
      return ctx.flattenPipe ? `${rt}(${f}, ${v})` : `${rt}(${f})(${v})`;
    }
    case "EPipe": {
      const { left, right, fast, span: sp } = $match;
      return hasPipeHole(right)
        ? genExpr$(ctx, fillPipeHole$(left, right, sp))
        : fast
          ? ((_v) =>
              _v._tag === "ECall"
                ? (({ fn: rfn, args: rargs, origin }) =>
                    genExpr$(ctx, Ast.ECall(rfn, _Array_prepend(left, rargs), origin, sp)))(_v)
                : genExpr$(ctx, Ast.ECall(right, [left], None as Option<string>, sp)))(right)
          : ((_v) =>
              _v._tag === "ECall" && (({ fn: rfn, args: rargs }) => ctx.flattenPipe)(_v)
                ? (({ fn: rfn, args: rargs }) =>
                    `${genCalleeFor$(ctx, rfn, length(rargs) + 1)}(${_Str_join(
                      ", ",
                      map((a: Expr) => genExpr$(ctx, a), _Array_append(left, rargs)),
                    )})`)(_v)
                : `${genCallee$(ctx, right)}(${genExpr$(ctx, left)})`)(right);
    }
    case "EDo": {
      const { exprs } = $match;
      return genDo$(ctx, exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return `(${genExpr$(ctx, cond)} ? ${genExpr$(ctx, thenE)} : ${genExpr$(ctx, elseE)})`;
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return genMatch$(ctx, scrutinee, arms);
    }
    case "ELoop": {
      const { params, body } = $match;
      return `(() => { ${genLoopBlock$(ctx, params, body)} })()`;
    }
    case "ERecur": {
      const { args } = $match;
      return `_recur(${_Str_join(
        ", ",
        map((a: Expr) => genExpr$(ctx, a), args),
      )})`;
    }
    case "ERecord": {
      const { fields, spread } = $match;
      const fieldStrs: string = _Str_join(
        ", ",
        map(
          (f: Field) =>
            `${isJsIdent(f.name) ? f.name : jsStringLit(f.name)}: ${genExpr$(ctx, f.value)}`,
          fields,
        ),
      );
      return _Option_match(
        spread,
        () => (length(fields) === 0 ? "{}" : `{ ${fieldStrs} }`),
        (s) => {
          const spreadStr: string = `...${genExpr$(ctx, s)}`;
          return length(fields) === 0 ? `{ ${spreadStr} }` : `{ ${spreadStr}, ${fieldStrs} }`;
        },
      );
    }
    case "EField": {
      const { target, name, optional } = $match;
      return _Option_match(
        emptyNsEmit$(target, name, hook1(ctx.annotateEmpty, e)),
        () =>
          _Option_match(
            nsRuntimeId$(ctx, target, name),
            () => {
              const member: string = `${genMember$(ctx, target)}.${name}`;
              return optional
                ? ((tagType: string) =>
                    `((v) => v != null ? { _tag: "Some"${tagType}, value: v } : { _tag: "None"${tagType} })(${member})`)(
                    _Option_isSome(ctx.guardBaseType) ? " as const" : "",
                  )
                : member;
            },
            (rt) => rt,
          ),
        (js) => js,
      );
    }
    case "ETuple": {
      const { elements } = $match;
      const elems: string = _Str_join(
        ", ",
        map((el: Expr) => genExpr$(ctx, el), elements),
      );
      return ctx.tupleHelper ? `_tuple(${elems})` : `[${elems}]`;
    }
    case "EArr": {
      const { elements } = $match;
      const body: string = `[${_Str_join(
        ", ",
        map((el: SeqElem) => genSeqSlot$(ctx, el), elements),
      )}]`;
      return castOr$(
        body,
        length(elements) === 0 ? hook1(ctx.annotateEmpty, e) : (None as Option<string>),
      );
    }
    case "EList": {
      const { elements } = $match;
      return genList$(ctx, elements);
    }
    case "ESet": {
      const { elements } = $match;
      return `new Set([${_Str_join(
        ", ",
        map((el: SeqElem) => genSeqSlot$(ctx, el), elements),
      )}])`;
    }
    case "EMap": {
      const { entries } = $match;
      return _Option_match(
        length(entries) === 0 ? hook1(ctx.annotateEmpty, e) : (None as Option<string>),
        () =>
          `new Map([${_Str_join(
            ", ",
            map(
              (en: MapEntry) => `[${genExpr$(ctx, en.key)}, ${genExpr$(ctx, en.value)}]`,
              entries,
            ),
          )}])`,
        (t) => `new ${t}()`,
      );
    }
    case "EInterp": {
      const { parts } = $match;
      const body: string = _Str_join(
        "",
        map((p: InterpPart) => {
          const $match$ = p;
          switch ($match$._tag) {
            case "IPLit": {
              const { value } = $match$;
              return escapeTemplateLiteral(value);
            }
            case "IPExpr": {
              const { expr: ex } = $match$;
              return `\${${genExpr$(ctx, ex)}}`;
            }
            default: {
              throw new Error("non-exhaustive match");
            }
          }
        }, parts),
      );
      return `\`${body}\``;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const genExpr: _Curry<[ctx: GCtx, e: Expr], string> = _curry(2, genExpr$);
const genDo$ = (ctx: GCtx, exprs: Expr[]): string => `(() => { ${genDoSteps$(ctx, exprs)} })()`;
const genDo: _Curry<[ctx: GCtx, exprs: Expr[]], string> = _curry(2, genDo$);
const genDoSteps$ = (ctx: GCtx, exprs: Expr[]): string =>
  ((_v) =>
    _v.length === 1
      ? (([last]) => `return ${genExpr$(ctx, last)};`)(_v)
      : _v.length >= 1
        ? (([first, ...rest]) => `${genExpr$(ctx, first)}; ${genDoSteps$(ctx, rest)}`)(_v)
        : _v.length === 0
          ? 'throw new Error("empty do block");'
          : (() => {
              throw new Error("non-exhaustive match");
            })())(exprs);
const genDoSteps: _Curry<[ctx: GCtx, exprs: Expr[]], string> = _curry(2, genDoSteps$);
const genSeqSlot$ = (ctx: GCtx, el: SeqElem): string => {
  const $match = el;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: ex } = $match;
      return genExpr$(ctx, ex);
    }
    case "SESpread": {
      const { expr: ex } = $match;
      return `...${genExpr$(ctx, ex)}`;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const genSeqSlot: _Curry<[ctx: GCtx, el: SeqElem], string> = _curry(2, genSeqSlot$);
const genList$ = (ctx: GCtx, elements: SeqElem[]): string => {
  const yields: string = _Str_join(
    " ",
    map((el: SeqElem) => {
      const $match = el;
      switch ($match._tag) {
        case "SEExpr": {
          const { expr: ex } = $match;
          return `yield (${genExpr$(ctx, ex)});`;
        }
        case "SESpread": {
          const { expr: ex } = $match;
          return `yield* (${genExpr$(ctx, ex)});`;
        }
        default: {
          throw new Error("non-exhaustive match");
        }
      }
    }, elements),
  );
  return `_list(function* () {${yields === "" ? "" : ` ${yields} `}})`;
};
const genList: _Curry<[ctx: GCtx, elements: SeqElem[]], string> = _curry(2, genList$);
const genParam: (p: LamParam) => string = (p: LamParam) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return genParam(inner);
    }
    case "LPName": {
      const { name } = $match;
      return name;
    }
    case "LPTuple": {
      const { names } = $match;
      const slots: string = _Str_join(
        ", ",
        map((name: string) => (name === "_" ? "" : name), names),
      );
      const tail: string = ((_v) => (_v._tag === "Some" && _v.value === "_" ? "," : ""))(
        _Array_get(length(names) - 1, names),
      );
      return `[${slots}${tail}]`;
    }
    case "LPRecord": {
      const { fields } = $match;
      return `{ ${_Str_join(", ", fields)} }`;
    }
    case "LPLabeled": {
      const { name } = $match;
      return name;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const genCallee$ = (ctx: GCtx, e: Expr): string => {
  const $match = e;
  switch ($match._tag) {
    case "ELambda": {
      return `(${genExpr$(ctx, e)})`;
    }
    default: {
      return genExpr$(ctx, e);
    }
  }
};
const genCallee: _Curry<[ctx: GCtx, e: Expr], string> = _curry(2, genCallee$);
const genMember$ = (ctx: GCtx, e: Expr): string => {
  const $match = e;
  switch ($match._tag) {
    case "ERecord": {
      return `(${genExpr$(ctx, e)})`;
    }
    case "ELambda": {
      return `(${genExpr$(ctx, e)})`;
    }
    default: {
      return genExpr$(ctx, e);
    }
  }
};
const genMember: _Curry<[ctx: GCtx, e: Expr], string> = _curry(2, genMember$);
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
const hasRecur: (e: Expr) => boolean = (e: Expr) => {
  const $match = e;
  switch ($match._tag) {
    case "ERecur": {
      return true;
    }
    case "ELoop": {
      return false;
    }
    case "ELambda": {
      return false;
    }
    case "ELetBind": {
      return false;
    }
    case "EInterp": {
      const { parts } = $match;
      return someOf((p: InterpPart) => {
        const $match$ = p;
        switch ($match$._tag) {
          case "IPExpr": {
            const { expr: x } = $match$;
            return hasRecur(x);
          }
          case "IPLit": {
            return false;
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    case "ECall": {
      const { fn, args } = $match;
      return or(hasRecur(fn), someOf(hasRecur, args));
    }
    case "ELetIn": {
      const { value, body } = $match;
      return or(hasRecur(value), hasRecur(body));
    }
    case "EPipe": {
      const { left, right } = $match;
      return or(hasRecur(left), hasRecur(right));
    }
    case "EDo": {
      const { exprs } = $match;
      return someOf(hasRecur, exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return or(hasRecur(cond), or(hasRecur(thenE), hasRecur(elseE)));
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return or(
        hasRecur(scrutinee),
        someOf(
          (a: MatchArm) =>
            or(
              _Option_match(
                a.guard,
                () => false,
                (g) => hasRecur(g),
              ),
              hasRecur(a.body),
            ),
          arms,
        ),
      );
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return or(
        _Option_match(
          spread,
          () => false,
          (sp) => hasRecur(sp),
        ),
        someOf((f: Field) => hasRecur(f.value), fields),
      );
    }
    case "EField": {
      const { target } = $match;
      return hasRecur(target);
    }
    case "ETuple": {
      const { elements } = $match;
      return someOf(hasRecur, elements);
    }
    case "EArr": {
      const { elements } = $match;
      return someOf((el: SeqElem) => hasRecur(seqElemExpr(el)), elements);
    }
    case "EList": {
      const { elements } = $match;
      return someOf((el: SeqElem) => hasRecur(seqElemExpr(el)), elements);
    }
    case "ESet": {
      const { elements } = $match;
      return someOf((el: SeqElem) => hasRecur(seqElemExpr(el)), elements);
    }
    case "EMap": {
      const { entries } = $match;
      return someOf((en: MapEntry) => or(hasRecur(en.key), hasRecur(en.value)), entries);
    }
    default: {
      return false;
    }
  }
};
const loopNeedsStep: <A>(ctx: GCtx, e: Expr, params: ({ name: string } & A)[]) => boolean = _curry(
  3,
  <A>(ctx: GCtx, e: Expr, params: ({ name: string } & A)[]) => {
    const $match = e;
    switch ($match._tag) {
      case "ETernary": {
        const { thenE, elseE } = $match;
        return or(loopNeedsStep(ctx, thenE, params), loopNeedsStep(ctx, elseE, params));
      }
      case "ELetIn": {
        const { body } = $match;
        return loopNeedsStep(ctx, body, params);
      }
      case "EDo": {
        const { exprs } = $match;
        return loopNeedsStep(ctx, lastDoExpr(exprs), params);
      }
      case "EMatch": {
        const { arms } = $match;
        return and(
          hasRecur(e),
          or(
            !canStatementMatch(arms, params),
            someOf((a: MatchArm) => loopNeedsStep(ctx, a.body, params), arms),
          ),
        );
      }
      default: {
        return false;
      }
    }
  },
);
const loopBindingSafe: <A, B>(name: A, params: ({ name: A } & B)[]) => boolean = _curry(
  2,
  <A, B>(name: A, params: ({ name: A } & B)[]) =>
    !someOf((p: { name: A } & B) => eq(p.name, name), params),
);
const loopPayloadSafe: <A>(pattern: Pattern, params: ({ name: string } & A)[]) => boolean = _curry(
  2,
  <A>(pattern: Pattern, params: ({ name: string } & A)[]) => {
    const $match = pattern;
    switch ($match._tag) {
      case "PBind": {
        const { name } = $match;
        return loopBindingSafe(name, params);
      }
      case "PWild": {
        return true;
      }
      default: {
        return false;
      }
    }
  },
);
const loopPatternSafe: <A>(pattern: Pattern, params: ({ name: string } & A)[]) => boolean = _curry(
  2,
  <A>(pattern: Pattern, params: ({ name: string } & A)[]) => {
    const $match = pattern;
    switch ($match._tag) {
      case "PCtor": {
        const { args } = $match;
        return allOf((p: Pattern) => loopPayloadSafe(p, params), args);
      }
      case "PBind": {
        const { name } = $match;
        return loopBindingSafe(name, params);
      }
      case "PWild": {
        return true;
      }
      case "PBool": {
        return true;
      }
      case "PLit": {
        return true;
      }
      case "PStr": {
        return true;
      }
      case "PUnit": {
        return true;
      }
      default: {
        return false;
      }
    }
  },
);
const canStatementMatch: <A, B, C>(
  arms: ({ guard: Option<A>; pattern: Pattern } & B)[],
  params: ({ name: string } & C)[],
) => boolean = _curry(
  2,
  <A, B, C>(
    arms: ({ guard: Option<A>; pattern: Pattern } & B)[],
    params: ({ name: string } & C)[],
  ) =>
    allOf(
      (a: { guard: Option<A>; pattern: Pattern } & B) =>
        and(_Option_isNone(a.guard), loopPatternSafe(a.pattern, params)),
      arms,
    ),
);
const genLoopMatchArms$ = (
  ctx: GCtx,
  arms: MatchArm[],
  i: number,
  root: string,
  params: LoopParam[],
): string =>
  _Option_match(
    _Array_get(i, arms),
    () => 'throw new Error("non-exhaustive match");',
    (a) => {
      const slot: string = patSlot(ctx.keys, a.pattern);
      const bind: string = slot === "" ? "" : `const ${slot} = ${root}; `;
      const body: string = `{ ${bind}${genLoopTail$(ctx, a.body, params)} }`;
      return isCatchAll(a.pattern)
        ? body
        : ((conds: string[]) =>
            `if (${_Str_join(" && ", conds)}) ${body} ${genLoopMatchArms$(ctx, arms, i + 1, root, params)}`)(
            patConds(ctx.keys, a.pattern, root),
          );
    },
  );
const genLoopMatchArms: _Curry<
  [ctx: GCtx, arms: MatchArm[], i: number, root: string, params: LoopParam[]],
  string
> = _curry(5, genLoopMatchArms$);
const genLoopMatch$ = (ctx: GCtx, scrutinee: Expr, arms: MatchArm[], params: LoopParam[]): string =>
  _Option_match(
    genOptionalLoopMatch$(ctx, scrutinee, arms, params),
    () => {
      const root: string = tempName$(ctx, "$loopMatch");
      return `{ const ${root} = ${genExpr$(ctx, scrutinee)}; ${genLoopMatchArms$(ctx, arms, 0, root, params)} }`;
    },
    (fused) => fused,
  );
const genLoopMatch: _Curry<
  [ctx: GCtx, scrutinee: Expr, arms: MatchArm[], params: LoopParam[]],
  string
> = _curry(4, genLoopMatch$);
const genOptionalLoopMatch$ = (
  ctx: GCtx,
  scrutinee: Expr,
  arms: MatchArm[],
  params: LoopParam[],
): Option<string> =>
  ((_v) =>
    _v._tag === "EField" && _v.optional === true
      ? (({ target, name }) =>
          ((_v) =>
            _v[0]._tag === "Some" &&
            _v[0].value.length === 1 &&
            _v[0].value[0] === "value" &&
            _v[1]._tag === "Some" &&
            _v[1].value.length === 0
              ? _Option_match(
                  optionalMatch(arms),
                  () => None as Option<string>,
                  (plan) => {
                    const value: string = tempName$(ctx, "$optional");
                    const bind: string =
                      plan.binding === "" ? "" : `const ${plan.binding} = ${value}; `;
                    return Some(
                      `{ const ${value} = ${genMember$(ctx, target)}.${name}; if (${value} != null) { ${bind}${genLoopTail$(ctx, plan.present, params)} } else { ${genLoopTail$(ctx, plan.absent, params)} } }`,
                    ) as Option<string>;
                  },
                )
              : (None as Option<string>))(
            _tuple(_Map_get("Some", ctx.keys), _Map_get("None", ctx.keys)),
          ))(_v)
      : (None as Option<string>))(scrutinee);
const genOptionalLoopMatch: _Curry<
  [ctx: GCtx, scrutinee: Expr, arms: MatchArm[], params: LoopParam[]],
  Option<string>
> = _curry(4, genOptionalLoopMatch$);
const alwaysRecur: (e: Expr) => boolean = (e: Expr) => {
  const $match = e;
  switch ($match._tag) {
    case "ERecur": {
      return true;
    }
    case "ETernary": {
      const { thenE: a, elseE: b } = $match;
      return and(alwaysRecur(a), alwaysRecur(b));
    }
    case "ELetIn": {
      const { body } = $match;
      return alwaysRecur(body);
    }
    case "EDo": {
      const { exprs } = $match;
      return alwaysRecur(lastDoExpr(exprs));
    }
    case "EMatch": {
      const { arms } = $match;
      return and(
        length(arms) > 0,
        allOf((a: MatchArm) => alwaysRecur(a.body), arms),
      );
    }
    default: {
      return false;
    }
  }
};
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
const wrapStepTails$ = (e: Expr, sp: SpanAt): Expr => {
  const $match = e;
  switch ($match._tag) {
    case "ERecur": {
      return e;
    }
    case "ETernary": {
      const { cond, thenE, elseE, span: tsp } = $match;
      return Ast.ETernary(cond, wrapStepTails$(thenE, sp), wrapStepTails$(elseE, sp), tsp);
    }
    case "ELetIn": {
      const { name, nameSpan, annot, value, body, span: lsp } = $match;
      return Ast.ELetIn(name, nameSpan, annot, value, wrapStepTails$(body, sp), lsp);
    }
    case "EDo": {
      const { exprs, span: dsp } = $match;
      return Ast.EDo(wrapDoStepTail$(exprs, sp), dsp);
    }
    case "EMatch": {
      const { scrutinee, arms, span: msp } = $match;
      return Ast.EMatch(
        scrutinee,
        map(
          (a: MatchArm) => ({
            pattern: a.pattern,
            guard: a.guard,
            body: wrapStepTails$(a.body, sp),
          }),
          arms,
        ),
        msp,
      );
    }
    default: {
      return Ast.ECall(Ast.ERef("_done", sp), [e], None as Option<string>, sp);
    }
  }
};
const wrapStepTails: _Curry<[e: Expr, sp: SpanAt], Expr> = _curry(2, wrapStepTails$);
const wrapDoStepTail$ = (exprs: Expr[], sp: SpanAt): Expr[] =>
  ((_v) =>
    _v.length === 1
      ? (([last]) => [wrapStepTails$(last, sp)])(_v)
      : _v.length >= 1
        ? (([first, ...rest]) => [first, ...wrapDoStepTail$(rest, sp)])(_v)
        : _v.length === 0
          ? ([] as Expr[])
          : (() => {
              throw new Error("non-exhaustive match");
            })())(exprs);
const wrapDoStepTail: _Curry<[exprs: Expr[], sp: SpanAt], Expr[]> = _curry(2, wrapDoStepTail$);
const loopParamNames: <A>(params: ({ name: string } & A)[]) => string = <A>(
  params: ({ name: string } & A)[],
) =>
  _Str_join(
    ", ",
    map((p: { name: string } & A) => p.name, params),
  );
const tempName$ = (ctx: GCtx, name: string): string =>
  or(_Set_has(name, ctx.userNames), _Set_has(name, ctx.valueRefs))
    ? tempName$(ctx, `${name}$`)
    : name;
const tempName: _Curry<[ctx: GCtx, name: string], string> = _curry(2, tempName$);
const genRecurTemps$ = (ctx: GCtx, args: Expr[], params: LoopParam[], i: number): string =>
  ((_v) =>
    _v[0]._tag === "Some" && _v[1]._tag === "Some"
      ? (([{ value: a }, { value: p }]) =>
          ((name: string) =>
            `const ${suffixOr$(name, hook1(ctx.annotateLetin, p.init))} = ${genExpr$(ctx, a)}; ${genRecurTemps$(ctx, args, params, i + 1)}`)(
            tempName$(ctx, `$recur${show(i)}`),
          ))(
          _v as [
            Extract<[Option<Expr>, Option<LoopParam>][0], { _tag: "Some" }>,
            Extract<[Option<Expr>, Option<LoopParam>][1], { _tag: "Some" }>,
          ],
        )
      : "")(_tuple(_Array_get(i, args), _Array_get(i, params)));
const genRecurTemps: _Curry<[ctx: GCtx, args: Expr[], params: LoopParam[], i: number], string> =
  _curry(4, genRecurTemps$);
const genRecurAssignments: <A>(ctx: GCtx, params: ({ name: string } & A)[], i: number) => string =
  _curry(3, <A>(ctx: GCtx, params: ({ name: string } & A)[], i: number) =>
    _Option_match(
      _Array_get(i, params),
      () => "",
      (p) =>
        `${p.name} = ${tempName$(ctx, `$recur${show(i)}`)}; ${genRecurAssignments(ctx, params, i + 1)}`,
    ),
  );
const genLoopTail$ = (ctx: GCtx, e: Expr, params: LoopParam[]): string => {
  const $match = e;
  switch ($match._tag) {
    case "ERecur": {
      const { args } = $match;
      return ((_v) =>
        _v[0].length === 1 && _v[1].length === 1
          ? (([[p], [a]]) => `${p.name} = ${genExpr$(ctx, a)}; continue;`)(_v)
          : `{ ${genRecurTemps$(ctx, args, params, 0)}${genRecurAssignments(ctx, params, 0)}continue; }`)(
        _tuple(params, args),
      );
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return hasRecur(e)
        ? `if (${genExpr$(ctx, cond)}) { ${genLoopTail$(ctx, thenE, params)} } else { ${genLoopTail$(ctx, elseE, params)} }`
        : `return ${genExpr$(ctx, e)};`;
    }
    case "ELetIn": {
      const { name, value, body } = $match;
      return hasRecur(e)
        ? `{ const ${suffixOr$(name, hook1(ctx.annotateLetin, value))} = ${genExpr$(ctx, value)}; ${genLoopTail$(ctx, body, params)} }`
        : `return ${genExpr$(ctx, e)};`;
    }
    case "EDo": {
      const { exprs } = $match;
      return hasRecur(e)
        ? `{ ${genDoLoopTail$(ctx, exprs, params)} }`
        : `return ${genExpr$(ctx, e)};`;
    }
    case "EMatch": {
      const { scrutinee, arms, span: sp } = $match;
      return hasRecur(e)
        ? canStatementMatch(arms, params)
          ? genLoopMatch$(ctx, scrutinee, arms, params)
          : ((step: string) =>
              ((rebind: string) =>
                alwaysRecur(e)
                  ? `const _step = ${step}; ${rebind} continue;`
                  : `const _step = ${step}; if (_step._tag === ${jsStringLit("recur")}) { ${rebind} continue; } return _step.value;`)(
                ((_v) =>
                  _v.length === 1
                    ? (([p]) => `${p.name} = _step.args[0];`)(_v)
                    : `[${loopParamNames(params)}] = _step.args;`)(params),
              ))(genExpr$(ctx, wrapStepTails$(e, sp)))
        : `return ${genExpr$(ctx, e)};`;
    }
    default: {
      return `return ${genExpr$(ctx, e)};`;
    }
  }
};
const genLoopTail: _Curry<[ctx: GCtx, e: Expr, params: LoopParam[]], string> = _curry(
  3,
  genLoopTail$,
);
const genDoLoopTail$ = (ctx: GCtx, exprs: Expr[], params: LoopParam[]): string =>
  ((_v) =>
    _v.length === 1
      ? (([last]) => genLoopTail$(ctx, last, params))(_v)
      : _v.length >= 1
        ? (([first, ...rest]) => `${genExpr$(ctx, first)}; ${genDoLoopTail$(ctx, rest, params)}`)(
            _v,
          )
        : _v.length === 0
          ? "return undefined;"
          : (() => {
              throw new Error("non-exhaustive match");
            })())(exprs);
const genDoLoopTail: _Curry<[ctx: GCtx, exprs: Expr[], params: LoopParam[]], string> = _curry(
  3,
  genDoLoopTail$,
);
const genLoopBlock$ = (ctx: GCtx, params: LoopParam[], body: Expr): string => {
  const decls: string = _Str_join(
    " ",
    map(
      (p: LoopParam) =>
        `let ${suffixOr$(p.name, hook1(ctx.annotateLetin, p.init))} = ${genExpr$(ctx, p.init)};`,
      params,
    ),
  );
  return `${decls} while (true) { ${genLoopTail$(ctx, body, params)} }`;
};
const genLoopBlock: _Curry<[ctx: GCtx, params: LoopParam[], body: Expr], string> = _curry(
  3,
  genLoopBlock$,
);
const loopParamFree: <A, B>(params: ({ name: A } & B)[], i: number, seen: Set<A>) => boolean =
  _curry(3, <A, B>(params: ({ name: A } & B)[], i: number, seen: Set<A>) =>
    _Option_match(
      _Array_get(i, params),
      () => true,
      (p) => (_Set_has(p.name, seen) ? false : loopParamFree(params, i + 1, seen)),
    ),
  );
const genLambdaBody$ = (ctx: GCtx, e: Expr): string => {
  const $match = e;
  switch ($match._tag) {
    case "ERecord": {
      return `(${genExpr$(ctx, e)})`;
    }
    default: {
      return genExpr$(ctx, e);
    }
  }
};
const genLambdaBody: _Curry<[ctx: GCtx, e: Expr], string> = _curry(2, genLambdaBody$);
const paramNames: (p: LamParam) => string[] = (p: LamParam) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return paramNames(inner);
    }
    case "LPName": {
      const { name } = $match;
      return [name];
    }
    case "LPTuple": {
      const { names } = $match;
      return names;
    }
    case "LPRecord": {
      const { fields } = $match;
      return fields;
    }
    case "LPLabeled": {
      const { name } = $match;
      return [name];
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const genLabeledFill$ = (ctx: GCtx, labVar: string, lab: LamParam): string => {
  const $match = lab;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return genLabeledFill$(ctx, labVar, inner);
    }
    case "LPLabeled": {
      const { name, optional, defaultValue } = $match;
      const access: string = `(${labVar} ?? {}).${name}`;
      return _Option_match(
        defaultValue,
        () =>
          optional
            ? `const ${name} = ${access} != null ? { _tag: "Some", value: ${access} } : { _tag: "None" };`
            : `const ${name} = ${access};`,
        (d) => `const ${name} = ${access} != null ? ${access} : ${genExpr$(ctx, d)};`,
      );
    }
    default: {
      return "";
    }
  }
};
const genLabeledFill: _Curry<[ctx: GCtx, labVar: string, lab: LamParam], string> = _curry(
  3,
  genLabeledFill$,
);
const genFillDecls$ = (ctx: GCtx, fills: { labVar: string; labs: LamParam[] }[]): string =>
  ((_v) =>
    _v.length === 0
      ? ""
      : `${_Str_join(
          " ",
          map(
            (g: { labVar: string; labs: LamParam[] }) =>
              _Str_join(
                " ",
                map((lab: LamParam) => genLabeledFill$(ctx, g.labVar, lab), g.labs),
              ),
            fills,
          ),
        )} `)(fills);
const genFillDecls: _Curry<[ctx: GCtx, fills: { labVar: string; labs: LamParam[] }[]], string> =
  _curry(2, genFillDecls$);
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
              _curry(2, (s: Set<string>, lab: LamParam) => {
                const $match = lab;
                switch ($match._tag) {
                  case "LPSpanned": {
                    const { param: inner } = $match;
                    const $match$ = inner;
                    switch ($match$._tag) {
                      case "LPLabeled": {
                        const { name } = $match$;
                        return _Set_add(name, s);
                      }
                      default: {
                        return s;
                      }
                    }
                  }
                  case "LPLabeled": {
                    const { name } = $match;
                    return _Set_add(name, s);
                  }
                  default: {
                    return s;
                  }
                }
              }),
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
    _Option_match(
      _Array_get(i, names),
      () => acc,
      (n) => addNames(names, i + 1, _Set_add(n, acc)),
    ),
);
const paramNameSet$ = (params: LamParam[], i: number, acc: Set<string>): Set<string> =>
  _Option_match(
    _Array_get(i, params),
    () => acc,
    (p) => paramNameSet$(params, i + 1, addNames(paramNames(p), 0, acc)),
  );
const paramNameSet: _Curry<[params: LamParam[], i: number, acc: Set<string>], Set<string>> = _curry(
  3,
  paramNameSet$,
);
const letBlockLoop$ = (
  ctx: GCtx,
  e: Expr,
  seen: Set<string>,
  decls: string[],
): [string[], Expr, Set<string>] => {
  const $match = e;
  switch ($match._tag) {
    case "ELetIn": {
      const { name, value, body } = $match;
      return or(
        _Set_has(name, seen),
        ((_v) =>
          _v._tag === "ELambda"
            ? false
            : _Set_has(name, exprRefs$(ctx, value, _Set_fromArray([] as string[]))))(value),
      )
        ? _tuple(decls, e, seen)
        : letBlockLoop$(
            ctx,
            body,
            _Set_add(name, seen),
            _Array_append(
              `const ${suffixOr$(name, hook1(ctx.annotateLetin, value))} = ${genExpr$(ctx, value)};`,
              decls,
            ),
          );
    }
    default: {
      return _tuple(decls, e, seen);
    }
  }
};
const letBlockLoop: _Curry<
  [ctx: GCtx, e: Expr, seen: Set<string>, decls: string[]],
  [string[], Expr, Set<string>]
> = _curry(4, letBlockLoop$);
const genLambdaBodyIn$ = (ctx: GCtx, e: Expr, bound: Set<string>, prefix: string): string =>
  (([decls, rest, seen]: [string[], Expr, Set<string>]) =>
    length(decls) === 0
      ? ((_v) =>
          _v._tag === "ELoop"
            ? (({ params, body }) =>
                loopParamFree(params, 0, bound)
                  ? `{ ${prefix}${genLoopBlock$(ctx, params, body)} }`
                  : prefix === ""
                    ? genLambdaBody$(ctx, e)
                    : `{ ${prefix}return ${genLambdaBody$(ctx, e)}; }`)(_v)
            : _v._tag === "EMatch"
              ? (({ scrutinee, arms }) =>
                  canFunctionMatch$(ctx, scrutinee, arms)
                    ? `{ ${prefix}${genFunctionMatch$(ctx, scrutinee, arms)} }`
                    : prefix === ""
                      ? genLambdaBody$(ctx, e)
                      : `{ ${prefix}return ${genLambdaBody$(ctx, e)}; }`)(_v)
              : prefix === ""
                ? genLambdaBody$(ctx, e)
                : `{ ${prefix}return ${genLambdaBody$(ctx, e)}; }`)(e)
      : ((block: string) =>
          ((_v) =>
            _v._tag === "ELoop"
              ? (({ params, body }) =>
                  loopParamFree(params, 0, seen)
                    ? `{ ${prefix}${block} ${genLoopBlock$(ctx, params, body)} }`
                    : `{ ${prefix}${block} return ${genExpr$(ctx, rest)}; }`)(_v)
              : _v._tag === "EMatch"
                ? (({ scrutinee, arms }) =>
                    canFunctionMatch$(ctx, scrutinee, arms)
                      ? `{ ${prefix}${block} ${genFunctionMatch$(ctx, scrutinee, arms)} }`
                      : `{ ${prefix}${block} return ${genExpr$(ctx, rest)}; }`)(_v)
                : `{ ${prefix}${block} return ${genExpr$(ctx, rest)}; }`)(rest))(
          _Str_join(" ", decls),
        ))(letBlockLoop$(ctx, e, bound, [] as string[]));
const genLambdaBodyIn: _Curry<[ctx: GCtx, e: Expr, bound: Set<string>, prefix: string], string> =
  _curry(4, genLambdaBodyIn$);
const functionMatchArms: <A, B>(
  arms: ({ guard: Option<A>; pattern: Pattern } & B)[],
  tags: Set<string>,
) => boolean = _curry(
  2,
  <A, B>(arms: ({ guard: Option<A>; pattern: Pattern } & B)[], tags: Set<string>) =>
    match(arms)
      .with(
        (_v) => _v.length === 0,
        () => _Set_size(tags) > 0,
      )
      .with(
        (_v) => _v.length >= 1,
        ([a, ...rest]) =>
          and(
            _Option_isNone(a.guard),
            ((_v) =>
              _v._tag === "PCtor"
                ? (({ ctor: name, args }) =>
                    and(
                      and(
                        !_Set_has(name, tags),
                        allOf((p: Pattern) => {
                          const $match = p;
                          switch ($match._tag) {
                            case "PBind": {
                              return true;
                            }
                            case "PWild": {
                              return true;
                            }
                            default: {
                              return false;
                            }
                          }
                        }, args),
                      ),
                      functionMatchArms(rest, _Set_add(name, tags)),
                    ))(_v)
                : _v._tag === "PBind"
                  ? and(length(rest) === 0, _Set_size(tags) > 0)
                  : _v._tag === "PWild"
                    ? and(length(rest) === 0, _Set_size(tags) > 0)
                    : false)(a.pattern),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const canFunctionMatch$ = (ctx: GCtx, scrutinee: Expr, arms: MatchArm[]): boolean =>
  and(
    _Option_isNone(builtinMatchPlan(ctx, scrutinee, arms)),
    ((_v) =>
      _v._tag === "EField" && _v.optional === true
        ? false
        : functionMatchArms(arms, _Set_fromArray([] as string[])))(scrutinee),
  );
const canFunctionMatch: _Curry<[ctx: GCtx, scrutinee: Expr, arms: MatchArm[]], boolean> = _curry(
  3,
  canFunctionMatch$,
);
const functionPatternNames: (pattern: Pattern) => string[] = (pattern: Pattern) => {
  const $match = pattern;
  switch ($match._tag) {
    case "PCtor": {
      const { args } = $match;
      return _Array_flatMap((p: Pattern) => {
        const $match$ = p;
        switch ($match$._tag) {
          case "PBind": {
            const { name } = $match$;
            return [name];
          }
          default: {
            return [] as string[];
          }
        }
      }, args);
    }
    case "PBind": {
      const { name } = $match;
      return [name];
    }
    default: {
      return [] as string[];
    }
  }
};
const genFunctionTail$ = (ctx: GCtx, e: Expr, bound: Set<string>): string =>
  (([decls, rest, seen]: [string[], Expr, Set<string>]) => {
    const prefix: string = _Str_join(" ", decls);
    const $match = rest;
    switch ($match._tag) {
      case "EMatch": {
        const { scrutinee, arms } = $match;
        return canFunctionMatch$(ctx, scrutinee, arms)
          ? `${prefix} ${genFunctionMatch$(ctx, scrutinee, arms)}`
          : `${prefix} return ${genExpr$(ctx, rest)};`;
      }
      case "ELoop": {
        const { params, body } = $match;
        return loopParamFree(params, 0, seen)
          ? `${prefix} ${genLoopBlock$(ctx, params, body)}`
          : `${prefix} return ${genExpr$(ctx, rest)};`;
      }
      default: {
        return `${prefix} return ${genExpr$(ctx, rest)};`;
      }
    }
  })(letBlockLoop$(ctx, e, bound, [] as string[]));
const genFunctionTail: _Curry<[ctx: GCtx, e: Expr, bound: Set<string>], string> = _curry(
  3,
  genFunctionTail$,
);
const genFunctionCases$ = (ctx: GCtx, arms: MatchArm[], root: string): string =>
  _Str_join(
    " ",
    map((a: MatchArm) => {
      const label: string = ((_v) =>
        _v._tag === "PCtor" ? (({ ctor: name }) => `case ${jsStringLit(name)}:`)(_v) : "default:")(
        a.pattern,
      );
      const slot: string = patSlot(ctx.keys, a.pattern);
      const bind: string = slot === "" ? "" : `const ${slot} = ${root}; `;
      const bound: Set<string> = _Set_fromArray(functionPatternNames(a.pattern));
      return `${label} { ${bind}${genFunctionTail$(ctx, a.body, bound)} }`;
    }, arms),
  );
const genFunctionCases: _Curry<[ctx: GCtx, arms: MatchArm[], root: string], string> = _curry(
  3,
  genFunctionCases$,
);
const genFunctionMatch$ = (ctx: GCtx, scrutinee: Expr, arms: MatchArm[]): string => {
  const root: string = tempName$(ctx, "$match");
  const nestedCtx: GCtx = { ...ctx, userNames: _Set_add(root, ctx.userNames) };
  const fallback: string = someOf((a: MatchArm) => isCatchAll(a.pattern), arms)
    ? ""
    : 'default: { throw new Error("non-exhaustive match"); }';
  return `const ${root} = ${genExpr$(ctx, scrutinee)}; switch (${root}._tag) { ${genFunctionCases$(nestedCtx, arms, root)} ${fallback} }`;
};
const genFunctionMatch: _Curry<[ctx: GCtx, scrutinee: Expr, arms: MatchArm[]], string> = _curry(
  3,
  genFunctionMatch$,
);
const isCatchAll: (p: Pattern) => boolean = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return isCatchAll(pat);
    }
    case "PWild": {
      return true;
    }
    case "PUnit": {
      return true;
    }
    case "PBind": {
      return true;
    }
    case "PRecord": {
      const { fields } = $match;
      return allOf((f: PatField) => isCatchAll(f.pat), fields);
    }
    case "PTuple": {
      const { elems } = $match;
      return allOf(isCatchAll, elems);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return and(length(elems) === 0, _Option_isSome(rest));
    }
    case "PList": {
      const { elems, rest } = $match;
      return and(length(elems) === 0, _Option_isSome(rest));
    }
    default: {
      return false;
    }
  }
};
const isPList: (p: Pattern) => boolean = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PList": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const catchAllParam$ = (ctx: GCtx, p: Pattern): string => {
  const $match = p;
  switch ($match._tag) {
    case "PArr": {
      const { rest } = $match;
      return ((_v) =>
        _v._tag === "Some" && _v.value._tag === "PBind"
          ? (({ value: { name } }) => `(${name})`)(
              _v as Extract<Option<Pattern>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<Pattern>, { _tag: "Some" }>["value"],
                  { _tag: "PBind" }
                >;
              },
            )
          : "()")(rest);
    }
    case "PList": {
      const { rest } = $match;
      return ((_v) =>
        _v._tag === "Some" && _v.value._tag === "PBind"
          ? (({ value: { name } }) => `(${name})`)(
              _v as Extract<Option<Pattern>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<Pattern>, { _tag: "Some" }>["value"],
                  { _tag: "PBind" }
                >;
              },
            )
          : "()")(rest);
    }
    default: {
      const slot: string = patSlot(ctx.keys, p);
      return slot === "" ? "()" : `(${slot})`;
    }
  }
};
const catchAllParam: _Curry<[ctx: GCtx, p: Pattern], string> = _curry(2, catchAllParam$);
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
const listArmGuards$ = (ctx: GCtx, elems: Pattern[], i: number): string[] =>
  _Option_match(
    _Array_get(i, elems),
    () => [] as string[],
    (el) =>
      _Array_concat(patConds(ctx.keys, el, `_b[${show(i)}]`), listArmGuards$(ctx, elems, i + 1)),
  );
const listArmGuards: _Curry<[ctx: GCtx, elems: Pattern[], i: number], string[]> = _curry(
  3,
  listArmGuards$,
);
const listArmBinds$ = (ctx: GCtx, elems: Pattern[], i: number): [string[], string[]] =>
  _Option_match(
    _Array_get(i, elems),
    () => _tuple([] as string[], [] as string[]),
    (el) =>
      (([restParams, restArgs]: [string[], string[]]) => {
        const slot: string = patSlot(ctx.keys, el);
        return slot === ""
          ? _tuple(restParams, restArgs)
          : _tuple(_Array_prepend(slot, restParams), _Array_prepend(`_b[${show(i)}]`, restArgs));
      })(listArmBinds$(ctx, elems, i + 1)),
  );
const listArmBinds: _Curry<[ctx: GCtx, elems: Pattern[], i: number], [string[], string[]]> = _curry(
  3,
  listArmBinds$,
);
const genListArm$ = (ctx: GCtx, p: Pattern, body: Expr): string => {
  const $match = p;
  switch ($match._tag) {
    case "PList": {
      const { elems, rest } = $match;
      const n: number = length(elems);
      const guards: string[] = listArmGuards$(ctx, elems, 0);
      const head: string = _Option_isSome(rest)
        ? `_pull(${show(n)})`
        : `!_pull(${show(n + 1)}) && _b.length === ${show(n)}`;
      const cond: string = _Str_join(" && ", _Array_prepend(head, guards));
      return (([params0, args0]: [string[], string[]]) =>
        (([params, args]: [string[], string[]]) =>
          `  if (${cond}) return ((${_Str_join(", ", params)}) => ${genLambdaBody$(ctx, body)})(${_Str_join(", ", args)});`)(
          ((_v) =>
            _v._tag === "Some" && _v.value._tag === "PBind"
              ? (({ value: { name } }) =>
                  _tuple(_Array_append(name, params0), _Array_append(listTail(n), args0)))(
                  _v as Extract<Option<Pattern>, { _tag: "Some" }> & {
                    value: Extract<
                      Extract<Option<Pattern>, { _tag: "Some" }>["value"],
                      { _tag: "PBind" }
                    >;
                  },
                )
              : _tuple(params0, args0))(rest),
        ))(listArmBinds$(ctx, elems, 0));
    }
    default: {
      return "";
    }
  }
};
const genListArm: _Curry<[ctx: GCtx, p: Pattern, body: Expr], string> = _curry(3, genListArm$);
const listMatchLoop$ = (ctx: GCtx, arms: MatchArm[], i: number): [string[], string] =>
  _Option_match(
    _Array_get(i, arms),
    () =>
      _tuple([] as string[], '(() => { throw new Error("non-exhaustive lazy-list switch"); })()'),
    (a) =>
      and(isPList(a.pattern), !isCatchAll(a.pattern))
        ? (([restLines, fallback]: [string[], string]) =>
            _tuple(_Array_prepend(genListArm$(ctx, a.pattern, a.body), restLines), fallback))(
            listMatchLoop$(ctx, arms, i + 1),
          )
        : isCatchAll(a.pattern)
          ? ((restName: Option<string>) =>
              ((fallback: string) => _tuple([] as string[], fallback))(
                _Option_match(
                  restName,
                  () => genExpr$(ctx, a.body),
                  (name) => `((${name}) => ${genLambdaBody$(ctx, a.body)})(${listTail(0)})`,
                ),
              ))(
              ((_v) =>
                _v._tag === "PList" && _v.rest._tag === "Some" && _v.rest.value._tag === "PBind"
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
          : listMatchLoop$(ctx, arms, i + 1),
  );
const listMatchLoop: _Curry<[ctx: GCtx, arms: MatchArm[], i: number], [string[], string]> = _curry(
  3,
  listMatchLoop$,
);
const genListMatch$ = (ctx: GCtx, scrutinee: Expr, arms: MatchArm[]): string =>
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
        genExpr$(ctx, scrutinee),
      ),
      "[Symbol.iterator]())",
    ))(listMatchLoop$(ctx, arms, 0));
const genListMatch: _Curry<[ctx: GCtx, scrutinee: Expr, arms: MatchArm[]], string> = _curry(
  3,
  genListMatch$,
);
const matchArmsLoop$ = (
  ctx: GCtx,
  arms: MatchArm[],
  i: number,
  base: Option<string>,
): [string[], Option<[Pattern, Expr]>] =>
  _Option_match(
    _Array_get(i, arms),
    () => _tuple([] as string[], None as Option<[Pattern, Expr]>),
    (a) =>
      (([restLines, restCatch]: [string[], Option<[Pattern, Expr]>]) =>
        _Option_match(
          a.guard,
          () =>
            isCatchAll(a.pattern)
              ? _tuple(restLines, Some(_tuple(a.pattern, a.body)) as Option<[Pattern, Expr]>)
              : _tuple(
                  _Array_prepend(`  ${genWithArm$(ctx, a.pattern, a.body, base)}`, restLines),
                  restCatch,
                ),
          (g) =>
            _tuple(
              _Array_prepend(
                `  ${genGuardArm$(ctx, a.pattern, a.body, Some(g) as Option<Expr>, base)}`,
                restLines,
              ),
              restCatch,
            ),
        ))(matchArmsLoop$(ctx, arms, i + 1, base)),
  );
const matchArmsLoop: _Curry<
  [ctx: GCtx, arms: MatchArm[], i: number, base: Option<string>],
  [string[], Option<[Pattern, Expr]>]
> = _curry(4, matchArmsLoop$);
/**
 * Any eager-array arm? Decides the ADR 0038 close-out below.
 */
const hasArrArm: <A>(arms: ({ pattern: Pattern } & A)[]) => boolean = <A>(
  arms: ({ pattern: Pattern } & A)[],
) =>
  someOf((a: { pattern: Pattern } & A) => {
    const $match = a.pattern;
    switch ($match._tag) {
      case "PArr": {
        return true;
      }
      default: {
        return false;
      }
    }
  }, arms);
const isShallowArm$ = (ctx: GCtx, p: Pattern): boolean => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return isShallowPat(pat);
    }
    default: {
      return or(isShallowPat(p), patSlot(ctx.keys, p) === "");
    }
  }
};
/**
 * Does TypeScript's own narrowing on `_v` type this arm's bindings? A
 * discriminant or literal test on `_v` itself does; a test on a nested field
 * narrows only that field, so a destructuring that reaches past it needs the
 * arm's `patTarget` (ADR 0031).
 */
const isShallowArm: _Curry<[ctx: GCtx, p: Pattern], boolean> = _curry(2, isShallowArm$);
const isShallowPat: (p: Pattern) => boolean = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PCtor": {
      const { args } = $match;
      return allOf(isFlatSub, args);
    }
    case "PRecord": {
      const { fields } = $match;
      return allOf((f: PatField) => isFlatSub(f.pat), fields);
    }
    case "PLit": {
      return true;
    }
    case "PBool": {
      return true;
    }
    case "PStr": {
      return true;
    }
    default: {
      return isCatchAll(p);
    }
  }
};
const armView$ = (ctx: GCtx, p: Pattern, base: Option<string>): string =>
  ((_v) =>
    _v._tag === "Some" && (({ value: b }) => !isShallowArm$(ctx, p))(_v)
      ? (({ value: b }) =>
          ((target: string) => (eq(target, b) ? "_v" : `(_v as ${target})`))(
            patTarget(ctx.keys, p, b),
          ))(_v)
      : "_v")(base);
/**
 * `_v` as an arm's bindings see it: cast to the arm's narrowed type when the
 * tests do not narrow it themselves and that type refines the base. The tests just proved the cast, as they
 * prove the `_v is T` predicate of the `match()` form.
 */
const armView: _Curry<[ctx: GCtx, p: Pattern, base: Option<string>], string> = _curry(3, armView$);
const underBinds$ = (ctx: GCtx, p: Pattern, view: string, body: string): string => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat, name } = $match;
      const slot: string = patSlot(ctx.keys, pat);
      return slot === ""
        ? `((${name}) => ${body})(${view})`
        : `((${name}) => ((${slot}) => ${body})(${name}))(${view})`;
    }
    default: {
      const slot: string = patSlot(ctx.keys, p);
      return slot === "" ? body : `((${slot}) => ${body})(${view})`;
    }
  }
};
/**
 * Run `body` under the pattern's bindings, destructured from `view`.
 */
const underBinds: _Curry<[ctx: GCtx, p: Pattern, view: string, body: string], string> = _curry(
  4,
  underBinds$,
);
const ternArmTest$ = (
  ctx: GCtx,
  p: Pattern,
  guardOpt: Option<Expr>,
  base: Option<string>,
): string => {
  const conds: string[] = patConds(ctx.keys, p, "_v");
  const all: string[] = _Option_match(
    guardOpt,
    () => conds,
    (g) =>
      _Array_append(underBinds$(ctx, p, armView$(ctx, p, base), `(${genExpr$(ctx, g)})`), conds),
  );
  return length(all) === 0 ? "true" : _Str_join(" && ", all);
};
const ternArmTest: _Curry<
  [ctx: GCtx, p: Pattern, guardOpt: Option<Expr>, base: Option<string>],
  string
> = _curry(4, ternArmTest$);
const ternArms$ = (ctx: GCtx, arms: MatchArm[], i: number, base: Option<string>): string =>
  _Option_match(
    _Array_get(i, arms),
    () => '(() => { throw new Error("non-exhaustive match"); })()',
    (a) => {
      const body: string = `(${genLambdaBody$(ctx, a.body)})`;
      return and(_Option_isNone(a.guard), isCatchAll(a.pattern))
        ? ((_v) => (_v === "()" ? body : ((param) => `(${param} => ${body})(_v)`)(_v)))(
            catchAllParam$(ctx, a.pattern),
          )
        : `${ternArmTest$(ctx, a.pattern, a.guard, base)}
    ? ${underBinds$(ctx, a.pattern, armView$(ctx, a.pattern, base), body)}
    : ${ternArms$(ctx, arms, i + 1, base)}`;
    },
  );
const ternArms: _Curry<[ctx: GCtx, arms: MatchArm[], i: number, base: Option<string>], string> =
  _curry(4, ternArms$);
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
    allOf((a: { pattern: Pattern } & B) => isShallowArm$(ctx, a.pattern), arms),
  ),
);

const isOptionalNone: (pattern: Pattern) => boolean = (pattern: Pattern) =>
  ((_v) =>
    _v._tag === "PCtor" && _v.ctor === "None"
      ? (({ args, ns }) => and(length(args) === 0, _Option_isNone(ns)))(_v)
      : false)(pattern);
const optionalMatchPair: <A, C, E, F>(
  present: { guard: Option<A>; pattern: Pattern; body: Expr } & E,
  absent: { guard: Option<C>; pattern: Pattern; body: Expr } & F,
) => Option<OptionalMatch> = _curry(
  2,
  <A, C, E, F>(
    present: { guard: Option<A>; pattern: Pattern; body: Expr } & E,
    absent: { guard: Option<C>; pattern: Pattern; body: Expr } & F,
  ) =>
    or(
      or(_Option_isSome(present.guard), _Option_isSome(absent.guard)),
      !isOptionalNone(absent.pattern),
    )
      ? None
      : ((_v) =>
          _v._tag === "PCtor" && _v.ctor === "Some"
            ? (({ args, ns }) =>
                and(length(args) === 1, _Option_isNone(ns))
                  ? ((_v) =>
                      _v._tag === "Some" && _v.value._tag === "PBind"
                        ? (({ value: { name } }) =>
                            Some({ binding: name, present: present.body, absent: absent.body }))(
                            _v as Extract<Option<Pattern>, { _tag: "Some" }> & {
                              value: Extract<
                                Extract<Option<Pattern>, { _tag: "Some" }>["value"],
                                { _tag: "PBind" }
                              >;
                            },
                          )
                        : _v._tag === "Some" && _v.value._tag === "PWild"
                          ? Some({ binding: "", present: present.body, absent: absent.body })
                          : None)(_Array_get(0, args))
                  : None)(_v)
            : None)(present.pattern),
);
const optionalMatch: <A, C>(
  arms: ({ guard: Option<A>; pattern: Pattern; body: Expr } & C)[],
) => Option<OptionalMatch> = <A, C>(
  arms: ({ guard: Option<A>; pattern: Pattern; body: Expr } & C)[],
) =>
  match(arms)
    .with(
      (_v) => _v.length === 2,
      ([a, b]) =>
        _Option_match(
          optionalMatchPair(a, b),
          () => optionalMatchPair(b, a),
          (plan) => Some(plan),
        ),
    )
    .otherwise(() => None);
const genOptionalMatch$ = (ctx: GCtx, scrutinee: Expr, arms: MatchArm[]): Option<string> =>
  ((_v) =>
    _v._tag === "EField" && _v.optional === true
      ? (({ target, name }) =>
          ((_v) =>
            _v[0]._tag === "Some" &&
            _v[0].value.length === 1 &&
            _v[0].value[0] === "value" &&
            _v[1]._tag === "Some" &&
            _v[1].value.length === 0
              ? _Option_match(
                  optionalMatch(arms),
                  () => None as Option<string>,
                  (plan) => Some(genOptionalBranches$(ctx, target, name, plan)) as Option<string>,
                )
              : (None as Option<string>))(
            _tuple(_Map_get("Some", ctx.keys), _Map_get("None", ctx.keys)),
          ))(_v)
      : (None as Option<string>))(scrutinee);
const genOptionalMatch: _Curry<
  [ctx: GCtx, scrutinee: Expr, arms: MatchArm[]],
  Option<string>
> = _curry(3, genOptionalMatch$);
const genOptionalBranches$ = (
  ctx: GCtx,
  target: Expr,
  name: string,
  plan: OptionalMatch,
): string => {
  const value: string = tempName$(ctx, "$optional");
  const bind: string = plan.binding === "" ? "" : `const ${plan.binding} = ${value}; `;
  return `((${value}) => { if (${value} != null) { ${bind}return ${genExpr$(ctx, plan.present)}; } return ${genExpr$(ctx, plan.absent)}; })(${genMember$(ctx, target)}.${name})`;
};
const genOptionalBranches: _Curry<
  [ctx: GCtx, target: Expr, name: string, plan: OptionalMatch],
  string
> = _curry(4, genOptionalBranches$);
const genMatch$ = (ctx: GCtx, scrutinee: Expr, arms: MatchArm[]): string =>
  _Option_match(
    genOptionalMatch$(ctx, scrutinee, arms),
    () => genOrdinaryMatch$(ctx, scrutinee, arms),
    (fused) => fused,
  );
const genMatch: _Curry<[ctx: GCtx, scrutinee: Expr, arms: MatchArm[]], string> = _curry(
  3,
  genMatch$,
);
const genOrdinaryMatch$ = (ctx: GCtx, scrutinee: Expr, arms: MatchArm[]): string =>
  _Option_match(
    builtinMatchPlan(ctx, scrutinee, arms),
    () =>
      isListMatch(arms)
        ? genListMatch$(ctx, scrutinee, arms)
        : ((base: Option<string>) =>
            ternaryTypes(ctx, arms, base)
              ? `((_v) => ${ternArms$(ctx, arms, 0, base)})(${genExpr$(ctx, scrutinee)})`
              : genMatchChain$(ctx, scrutinee, arms, base))(hook1(ctx.guardBaseType, scrutinee)),
    (plan) => genBuiltinMatch$(ctx, scrutinee, plan),
  );
const genOrdinaryMatch: _Curry<[ctx: GCtx, scrutinee: Expr, arms: MatchArm[]], string> = _curry(
  3,
  genOrdinaryMatch$,
);

const builtinPayload$ = (pattern: Pattern, ctor: string, arity: number): Option<string> =>
  ((_v) =>
    _v._tag === "PCtor" &&
    _v.ns._tag === "None" &&
    (({ ctor: name, args }) => eq(name, ctor))(
      _v as Extract<Pattern, { _tag: "PCtor" }> & {
        ns: Extract<Extract<Pattern, { _tag: "PCtor" }>["ns"], { _tag: "None" }>;
      },
    )
      ? (({ ctor: name, args }) =>
          ((_v) =>
            _v[0] === 0 && _v[1].length === 0
              ? (Some("") as Option<string>)
              : _v[0] === 1 && _v[1].length === 1 && _v[1][0]._tag === "PBind"
                ? (([, [{ name }]]) => Some(name) as Option<string>)(
                    _v as [
                      [number, Pattern[]][0],
                      [Extract<[number, Pattern[]][1][number], { _tag: "PBind" }>],
                    ],
                  )
                : _v[0] === 1 && _v[1].length === 1 && _v[1][0]._tag === "PWild"
                  ? (Some("") as Option<string>)
                  : (None as Option<string>))(_tuple(arity, args)))(
          _v as Extract<Pattern, { _tag: "PCtor" }> & {
            ns: Extract<Extract<Pattern, { _tag: "PCtor" }>["ns"], { _tag: "None" }>;
          },
        )
      : (None as Option<string>))(pattern);
const builtinPayload: _Curry<
  [pattern: Pattern, ctor: string, arity: number],
  Option<string>
> = _curry(3, builtinPayload$);
const builtinPair: <A, C, E, F>(
  ctx: GCtx,
  left: { guard: Option<A>; pattern: Pattern; body: Expr } & E,
  right: { guard: Option<C>; pattern: Pattern; body: Expr } & F,
  helper: string,
  leftCtor: string,
  rightCtor: string,
  leftArity: number,
) => Option<BuiltinMatchPlan> = _curry(
  7,
  <A, C, E, F>(
    ctx: GCtx,
    left: { guard: Option<A>; pattern: Pattern; body: Expr } & E,
    right: { guard: Option<C>; pattern: Pattern; body: Expr } & F,
    helper: string,
    leftCtor: string,
    rightCtor: string,
    leftArity: number,
  ) =>
    or(
      or(
        or(
          or(_Option_isSome(left.guard), _Option_isSome(right.guard)),
          _Map_has(leftCtor, ctx.customCtorKeys),
        ),
        _Map_has(rightCtor, ctx.customCtorKeys),
      ),
      _Set_has(helper, ctx.userNames),
    )
      ? None
      : ((_v) =>
          _v[0]._tag === "Some" && _v[1]._tag === "Some"
            ? (([{ value: leftBinding }, { value: rightBinding }]) =>
                Some({
                  helper: helper,
                  leftBinding: leftBinding,
                  left: left.body,
                  rightBinding: rightBinding,
                  right: right.body,
                }))(
                _v as [
                  Extract<[Option<string>, Option<string>][0], { _tag: "Some" }>,
                  Extract<[Option<string>, Option<string>][1], { _tag: "Some" }>,
                ],
              )
            : None)(
          _tuple(
            builtinPayload$(left.pattern, leftCtor, leftArity),
            builtinPayload$(right.pattern, rightCtor, 1),
          ),
        ),
);
const builtinMatchPair: <A, C, E, F>(
  ctx: GCtx,
  left: { guard: Option<A>; pattern: Pattern; body: Expr } & E,
  right: { guard: Option<C>; pattern: Pattern; body: Expr } & F,
) => Option<BuiltinMatchPlan> = _curry(
  3,
  <A, C, E, F>(
    ctx: GCtx,
    left: { guard: Option<A>; pattern: Pattern; body: Expr } & E,
    right: { guard: Option<C>; pattern: Pattern; body: Expr } & F,
  ) =>
    ((_v) =>
      _v[0]._tag === "Some" &&
      _v[0].value.length === 1 &&
      _v[0].value[0] === "error" &&
      _v[1]._tag === "Some" &&
      _v[1].value.length === 1 &&
      _v[1].value[0] === "value"
        ? _Option_match(
            builtinPair(ctx, left, right, "_Result_match", "Err", "Ok", 1),
            () => builtinOptionPair(ctx, left, right),
            (plan) => Some(plan),
          )
        : builtinOptionPair(ctx, left, right))(
      _tuple(_Map_get("Err", ctx.keys), _Map_get("Ok", ctx.keys)),
    ),
);
const builtinOptionPair: <A, C, E, F>(
  ctx: GCtx,
  left: { guard: Option<A>; pattern: Pattern; body: Expr } & E,
  right: { guard: Option<C>; pattern: Pattern; body: Expr } & F,
) => Option<BuiltinMatchPlan> = _curry(
  3,
  <A, C, E, F>(
    ctx: GCtx,
    left: { guard: Option<A>; pattern: Pattern; body: Expr } & E,
    right: { guard: Option<C>; pattern: Pattern; body: Expr } & F,
  ) =>
    ((_v) =>
      _v[0]._tag === "Some" &&
      _v[0].value.length === 0 &&
      _v[1]._tag === "Some" &&
      _v[1].value.length === 1 &&
      _v[1].value[0] === "value"
        ? builtinPair(ctx, left, right, "_Option_match", "None", "Some", 0)
        : None)(_tuple(_Map_get("None", ctx.keys), _Map_get("Some", ctx.keys))),
);
const builtinMatchPlan: <A, C>(
  ctx: GCtx,
  scrutinee: Expr,
  arms: ({ guard: Option<A>; pattern: Pattern; body: Expr } & C)[],
) => Option<BuiltinMatchPlan> = _curry(
  3,
  <A, C>(
    ctx: GCtx,
    scrutinee: Expr,
    arms: ({ guard: Option<A>; pattern: Pattern; body: Expr } & C)[],
  ) =>
    ((_v) =>
      _v._tag === "EField" && _v.optional === true && _Option_isSome(optionalMatch(arms))
        ? None
        : match(arms)
            .with(
              (_v) => _v.length === 2,
              ([left, right]) =>
                _Option_match(
                  builtinMatchPair(ctx, left, right),
                  () => builtinMatchPair(ctx, right, left),
                  (plan) => Some(plan),
                ),
            )
            .otherwise(() => None))(scrutinee),
);
const genBuiltinHandler$ = (ctx: GCtx, binding: string, body: Expr): string => {
  const bound: Set<string> =
    binding === "" ? _Set_fromArray([] as string[]) : _Set_fromArray([binding]);
  return `(${binding}) => ${genLambdaBodyIn$(ctx, body, bound, "")}`;
};
const genBuiltinHandler: _Curry<[ctx: GCtx, binding: string, body: Expr], string> = _curry(
  3,
  genBuiltinHandler$,
);
const genBuiltinMatch$ = (ctx: GCtx, scrutinee: Expr, plan: BuiltinMatchPlan): string =>
  `${plan.helper}(${genExpr$(ctx, scrutinee)}, ${genBuiltinHandler$(ctx, plan.leftBinding, plan.left)}, ${genBuiltinHandler$(ctx, plan.rightBinding, plan.right)})`;
const genBuiltinMatch: _Curry<[ctx: GCtx, scrutinee: Expr, plan: BuiltinMatchPlan], string> =
  _curry(3, genBuiltinMatch$);
const genMatchChain$ = (
  ctx: GCtx,
  scrutinee: Expr,
  arms: MatchArm[],
  base: Option<string>,
): string =>
  (([armLines, catchAll]: [string[], Option<[Pattern, Expr]>]) => {
    const tail: string = ((_v) =>
      _v._tag === "Some"
        ? (({ value: [p, body] }) =>
            `  .otherwise(${catchAllParam$(ctx, p)} => ${genLambdaBody$(ctx, body)})`)(
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
      _Array_concat(_Array_prepend(`match(${genExpr$(ctx, scrutinee)})`, armLines), [tail]),
    );
  })(matchArmsLoop$(ctx, arms, 0, base));
/**
 * The `@onrails/pattern` chain.
 */
const genMatchChain: _Curry<
  [ctx: GCtx, scrutinee: Expr, arms: MatchArm[], base: Option<string>],
  string
> = _curry(4, genMatchChain$);
const genGuardArm$ = (
  ctx: GCtx,
  p: Pattern,
  body: Expr,
  guardOpt: Option<Expr>,
  base: Option<string>,
): string => {
  const root: string = _Option_isSome(base) ? "_g" : "_v";
  const conds0: string[] = patConds(ctx.keys, p, root);
  const slot: string = ((_v) =>
    _v._tag === "PAs" ? (({ pat }) => patSlot(ctx.keys, pat))(_v) : patSlot(ctx.keys, p))(p);
  const conds: string[] = _Option_match(
    guardOpt,
    () => conds0,
    (g) => {
      const $match = p;
      switch ($match._tag) {
        case "PAs": {
          const { name } = $match;
          return _Array_append(
            slot === ""
              ? `((${name}) => ${genExpr$(ctx, g)})(${root})`
              : `((${name}) => ((${slot}) => ${genExpr$(ctx, g)})(${name}))(${root})`,
            conds0,
          );
        }
        default: {
          return _Array_append(
            slot === "" ? `(${genExpr$(ctx, g)})` : `((${slot}) => ${genExpr$(ctx, g)})(${root})`,
            conds0,
          );
        }
      }
    },
  );
  const test: string = length(conds) === 0 ? "true" : _Str_join(" && ", conds);
  const handler: string = ((_v) =>
    _v._tag === "PAs"
      ? (({ name }) =>
          `(${name}) => ${slot === "" ? genLambdaBody$(ctx, body) : `((${slot}) => ${genLambdaBody$(ctx, body)})(${name})`}`)(
          _v,
        )
      : `${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody$(ctx, body)}`)(p);
  return _Option_match(
    base,
    () => `.with((_v) => ${test}, ${handler})`,
    (b) => {
      const target: string = patTarget(ctx.keys, p, b);
      return eq(target, b)
        ? `.with((_v) => { const _g: any = _v; return ${test}; }, ${handler})`
        : `.with((_v): _v is ${target} => { const _g: any = _v; return ${test}; }, ${handler})`;
    },
  );
};
const genGuardArm: _Curry<
  [ctx: GCtx, p: Pattern, body: Expr, guardOpt: Option<Expr>, base: Option<string>],
  string
> = _curry(5, genGuardArm$);
const isFlatSub: (p: Pattern) => boolean = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      return false;
    }
    case "PBind": {
      return true;
    }
    case "PWild": {
      return true;
    }
    case "PLit": {
      return true;
    }
    case "PBool": {
      return true;
    }
    case "PStr": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const recordLits: <A>(fields: ({ pat: Pattern; label: string } & A)[], i: number) => string[] =
  _curry(2, <A>(fields: ({ pat: Pattern; label: string } & A)[], i: number) =>
    _Option_match(
      _Array_get(i, fields),
      () => [] as string[],
      (f) => {
        const rest: string[] = recordLits(fields, i + 1);
        const $match = f.pat;
        switch ($match._tag) {
          case "PLit": {
            return _Array_prepend(`${f.label}: ${litValue(f.pat)}`, rest);
          }
          case "PBool": {
            return _Array_prepend(`${f.label}: ${litValue(f.pat)}`, rest);
          }
          case "PStr": {
            return _Array_prepend(`${f.label}: ${litValue(f.pat)}`, rest);
          }
          default: {
            return rest;
          }
        }
      },
    ),
  );
const ctorArgParts$ = (ctx: GCtx, ctor: string, args: Pattern[], i: number): [string[], string[]] =>
  _Option_match(
    _Array_get(i, args),
    () => _tuple([] as string[], [] as string[]),
    (a) =>
      (([restBinds, restLits]: [string[], string[]]) => {
        const key: string = keyAt$(ctx, ctor, i);
        const $match = a;
        switch ($match._tag) {
          case "PBind": {
            const { name } = $match;
            return _tuple(
              _Array_prepend(eq(key, name) ? key : `${key}: ${name}`, restBinds),
              restLits,
            );
          }
          case "PLit": {
            return _tuple(restBinds, _Array_prepend(`${key}: ${litValue(a)}`, restLits));
          }
          case "PBool": {
            return _tuple(restBinds, _Array_prepend(`${key}: ${litValue(a)}`, restLits));
          }
          case "PStr": {
            return _tuple(restBinds, _Array_prepend(`${key}: ${litValue(a)}`, restLits));
          }
          default: {
            return _tuple(restBinds, restLits);
          }
        }
      })(ctorArgParts$(ctx, ctor, args, i + 1)),
  );
const ctorArgParts: _Curry<
  [ctx: GCtx, ctor: string, args: Pattern[], i: number],
  [string[], string[]]
> = _curry(4, ctorArgParts$);
const genWithArm$ = (ctx: GCtx, p: Pattern, body: Expr, base: Option<string>): string => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      return genGuardArm$(ctx, p, body, None as Option<Expr>, base);
    }
    case "PArr": {
      return genGuardArm$(ctx, p, body, None as Option<Expr>, base);
    }
    case "PTuple": {
      return genGuardArm$(ctx, p, body, None as Option<Expr>, base);
    }
    case "POr": {
      return genGuardArm$(ctx, p, body, None as Option<Expr>, base);
    }
    case "PLit": {
      return `.with(${litValue(p)}, () => ${genLambdaBody$(ctx, body)})`;
    }
    case "PBool": {
      return `.with(${litValue(p)}, () => ${genLambdaBody$(ctx, body)})`;
    }
    case "PStr": {
      return `.with(${litValue(p)}, () => ${genLambdaBody$(ctx, body)})`;
    }
    case "PRecord": {
      const { fields } = $match;
      return allOf((f: PatField) => isFlatSub(f.pat), fields)
        ? ((lits: string[]) =>
            ((slot: string) =>
              `.with({ ${_Str_join(", ", lits)} }, ${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody$(ctx, body)})`)(
              patSlot(ctx.keys, p),
            ))(recordLits(fields, 0))
        : genGuardArm$(ctx, p, body, None as Option<Expr>, base);
    }
    case "PCtor": {
      const { ctor, args } = $match;
      return allOf(isFlatSub, args)
        ? (([binds, litFields]: [string[], string[]]) => {
            const patObj: string = _Str_join(
              ", ",
              _Array_prepend(`_tag: ${jsStringLit(ctor)}`, litFields),
            );
            const param: string = length(binds) === 0 ? "()" : `({ ${_Str_join(", ", binds)} })`;
            return `.with({ ${patObj} }, ${param} => ${genLambdaBody$(ctx, body)})`;
          })(ctorArgParts$(ctx, ctor, args, 0))
        : genGuardArm$(ctx, p, body, None as Option<Expr>, base);
    }
    default: {
      return genGuardArm$(ctx, p, body, None as Option<Expr>, base);
    }
  }
};
const genWithArm: _Curry<[ctx: GCtx, p: Pattern, body: Expr, base: Option<string>], string> =
  _curry(4, genWithArm$);
const typedCtorParams$ = (keys: string[], paramTypes: string[], i: number): string[] =>
  _Option_match(
    _Array_get(i, keys),
    () => [] as string[],
    (k) =>
      _Array_prepend(
        `${k}: ${_Option_unwrapOr("unknown", _Array_get(i, paramTypes))}`,
        typedCtorParams$(keys, paramTypes, i + 1),
      ),
  );
/**
 * `k0: T0, k1: T1` — a typed factory's parameter list.
 */
const typedCtorParams: _Curry<[keys: string[], paramTypes: string[], i: number], string[]> = _curry(
  3,
  typedCtorParams$,
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
      ? _Option_match(
          ts,
          () => `const ${c.name} = { _tag: ${tag} };`,
          (t) => `const ${c.name}: ${t.retMono} = { _tag: ${tag} };`,
        )
      : ((keys: string[]) =>
          ((params: string) =>
            ((impl: string) =>
              length(c.fields) >= 2
                ? ((curried: string) =>
                    _Option_match(
                      ts,
                      () => `const ${c.name} = ${curried};`,
                      (t) =>
                        `const ${c.name} = ${curried} as ${t.generics}(${_Str_join(", ", typedCtorParams$(keys, t.paramTypes, 0))}) => ${t.ret};`,
                    ))(`_curry(${show(length(c.fields))}, ${impl})`)
                : _Option_match(
                    ts,
                    () => `const ${c.name} = ${impl};`,
                    (t) =>
                      `const ${c.name} = ${t.generics}(${_Str_join(", ", typedCtorParams$(keys, t.paramTypes, 0))}): ${t.ret} => ({ _tag: ${tag}, ${params} });`,
                  ))(`(${params}) => ({ _tag: ${tag}, ${params} })`))(_Str_join(", ", keys)))(
          keysOf(c.fields),
        );
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
    _Option_match(
      _Array_get(i, ctors),
      () => [] as string[],
      (c) => {
        const rest: string[] = genCtorsFrom(s, ctors, h, refs, exported, i + 1);
        return or(exported, _Set_has(c.name, refs))
          ? _Array_prepend(genCtor(c, hook2(h, s, c)), rest)
          : rest;
      },
    ),
);
const genType$ = (ctx: GCtx, s: Stmt): string => {
  const $match = s;
  switch ($match._tag) {
    case "SType": {
      const { ctors, exported } = $match;
      return _Str_join("\n", genCtorsFrom(s, ctors, ctx.annotateCtor, ctx.valueRefs, exported, 0));
    }
    default: {
      return "";
    }
  }
};
const genType: _Curry<[ctx: GCtx, s: Stmt], string> = _curry(2, genType$);
/**
 * Top-level arrow spine length (`a -> b -> c` → 2).
 */
const typeExprArity: (te: TypeExpr) => number = (te: TypeExpr) => {
  const $match = te;
  switch ($match._tag) {
    case "TyArrow": {
      const { to } = $match;
      return 1 + typeExprArity(to);
    }
    default: {
      return 0;
    }
  }
};
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
      {
        const $recur0: number = i + 1;
        const $recur1: string = acc === "" ? `$a${show(i)}` : `${acc}, $a${show(i)}`;
        i = $recur0;
        acc = $recur1;
        continue;
      }
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
      {
        const $recur0: number = i + 1;
        const $recur1: string = `${acc}($a${show(i)})`;
        i = $recur0;
        acc = $recur1;
        continue;
      }
    }
  }
};
/**
 * extern → ESM import. Arity ≥ 2 wraps the host in `_curry` (ADR 0005 / #24).
 * `imported == "default"` emits a default import (ADR 0009 / styled-cva).
 */
const genExtern: (s: Stmt) => string = (s: Stmt) => {
  const $match = s;
  switch ($match._tag) {
    case "SExtern": {
      const { name, typeExpr, module: modName, imported, curried } = $match;
      return _Str_startsWith("mochi:global:", modName)
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
                        ? ((spec: string) => `import { ${spec} } from ${jsStringLit(modName)};`)(
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
                            ))(_Str_concat("$", name)))(typeExprArity(typeExpr));
    }
    default: {
      return "";
    }
  }
};
const stripAlExt: (s: string) => string = (s: string) =>
  _Str_endsWith(".mochi", s) ? _Str_slice(0, _Str_length(s) - 6, s) : s;
const rewriteImportPath$ = (from: string, ext: string): string => {
  const bare: string = stripAlExt(from);
  return or(_Str_startsWith("./", bare), _Str_startsWith("../", bare)) ? `${bare}${ext}` : bare;
};
/**
 * Relative `./` / `../` get `ext` (`.js` for the JS backend, `""` for TS —
 * tsc resolves the extensionless sibling); bare package specs keep their
 * name, since a suffix would break package `exports` (ADR 0015).
 */
const rewriteImportPath: _Curry<[from: string, ext: string], string> = _curry(
  2,
  rewriteImportPath$,
);
const genImport$ = (s: Stmt, ext: string): string => {
  const $match = s;
  switch ($match._tag) {
    case "SImport": {
      const { names, from } = $match;
      const nameList: string = _Str_join(
        ", ",
        map((n: Name) => n.name, names),
      );
      const path: string = rewriteImportPath$(from, ext);
      return `import { ${nameList} } from ${jsStringLit(path)};`;
    }
    case "SImportNs": {
      const { alias, from } = $match;
      const path: string = rewriteImportPath$(from, ext);
      return `import * as ${alias.name} from ${jsStringLit(path)};`;
    }
    default: {
      return "";
    }
  }
};
const genImport: _Curry<[s: Stmt, ext: string], string> = _curry(2, genImport$);
const exportLine: (l: string) => string = (l: string) => `export ${l}`;
const jsDocLine: (l: string) => string = (l: string) =>
  _Str_length(l) > 0 ? ` * ${_Str_replace("*/", "*\\/", l)}` : " *";
export const jsDoc: (docOpt: Option<string>) => string = (docOpt: Option<string>) =>
  _Option_match(
    docOpt,
    () => "",
    (doc) => {
      const lines: string[] = map(jsDocLine, _Str_split("\n", doc));
      return `/**
${_Str_join("\n", lines)}
 */
`;
    },
  );
const rawArityOf$ = (locals: Set<string>, s: Stmt): Option<number> =>
  ((_v) =>
    _v._tag === "SLet" &&
    _v.value._tag === "ELambda" &&
    (({ name, value: { params, body } }) =>
      and(!_Str_startsWith("$", name), !_Set_has(name, locals)))(
      _v as Extract<Stmt, { _tag: "SLet" }> & {
        value: Extract<Extract<Stmt, { _tag: "SLet" }>["value"], { _tag: "ELambda" }>;
      },
    )
      ? (({ name, value: { params, body } }) =>
          (([cparams, , fills]: [LamParam[], Expr, { labVar: string; labs: LamParam[] }[]]) =>
            and(length(cparams) >= 2, length(fills) === 0)
              ? (Some(length(cparams)) as Option<number>)
              : (None as Option<number>))(collapseLambda$(params, body)))(
          _v as Extract<Stmt, { _tag: "SLet" }> & {
            value: Extract<Extract<Stmt, { _tag: "SLet" }>["value"], { _tag: "ELambda" }>;
          },
        )
      : (None as Option<number>))(s);
/**
 * Arity of a top-level `let` that gets a raw twin (ADR 0149): a lambda whose
 * collapsed spine has >= 2 plain params, bound under a name no local binder
 * reuses anywhere in the module (so a call by that name is always this one).
 */
const rawArityOf: _Curry<[locals: Set<string>, s: Stmt], Option<number>> = _curry(2, rawArityOf$);
const rawTwinAllowed$ = (ctx: GCtx, name: string, value: Expr): boolean =>
  _Option_match(
    ctx.annotateRaw,
    () => true,
    (h) => _Option_isSome(h(name, value)),
  );
/**
 * The backend may decline a twin: the JS backend has no `annotateRaw` hook
 * and takes every eligible function; the TS backend's hook answers `None` for
 * a binding it cannot annotate strict-clean.
 */
const rawTwinAllowed: _Curry<[ctx: GCtx, name: string, value: Expr], boolean> = _curry(
  3,
  rawTwinAllowed$,
);
const withRawTwins$ = (ctx: GCtx, locals: Set<string>, stmts: Stmt[], i: number): GCtx =>
  _Option_match(
    _Array_get(i, stmts),
    () => ctx,
    (s) =>
      ((_v) =>
        _v[0]._tag === "SLet" &&
        _v[1]._tag === "Some" &&
        (([{ name, value }, { value: n }]) => rawTwinAllowed$(ctx, name, value))(
          _v as [
            Extract<[Stmt, Option<number>][0], { _tag: "SLet" }>,
            Extract<[Stmt, Option<number>][1], { _tag: "Some" }>,
          ],
        )
          ? (([{ name, value }, { value: n }]) =>
              ((next: GCtx) => withRawTwins$(next, locals, stmts, i + 1))({
                ...ctx,
                rawNames: _Map_set(name, tempName$(ctx, `${name}$`), ctx.rawNames),
                rawArity: _Map_set(name, n, ctx.rawArity),
              }))(
              _v as [
                Extract<[Stmt, Option<number>][0], { _tag: "SLet" }>,
                Extract<[Stmt, Option<number>][1], { _tag: "Some" }>,
              ],
            )
          : withRawTwins$(ctx, locals, stmts, i + 1))(_tuple(s, rawArityOf$(locals, s))),
  );
/**
 * Register a raw twin for every eligible top-level function. The raw name
 * goes through `tempName`, so it cannot capture a bound name or value ref.
 */
const withRawTwins: _Curry<[ctx: GCtx, locals: Set<string>, stmts: Stmt[], i: number], GCtx> =
  _curry(4, withRawTwins$);
const genStmt$ = (ctx: GCtx, s: Stmt): string => {
  const $match = s;
  switch ($match._tag) {
    case "SError": {
      const { span: sp } = $match;
      return `throw new Error("codegen invariant: error node reached codegen at ${show(sp.start)}");`;
    }
    case "SImport": {
      return genImport$(s, ctx.moduleExt);
    }
    case "SImportNs": {
      return genImport$(s, ctx.moduleExt);
    }
    case "SType": {
      const { exported } = $match;
      const decls: string = genType$(ctx, s);
      return decls === ""
        ? ""
        : exported
          ? _Str_join("\n", map(exportLine, _Str_split("\n", decls)))
          : decls;
    }
    case "SExtern": {
      const { name, exported, doc } = $match;
      const docComment: string = ctx.docs ? jsDoc(doc) : "";
      return exported
        ? `${docComment}${genExtern(s)}
export { ${name} };`
        : `${docComment}${genExtern(s)}`;
    }
    case "SLet": {
      const { name, value, exported, doc } = $match;
      const doExport: boolean = and(exported, !_Str_startsWith("$", name));
      const docComment: string = and(ctx.docs, !_Str_startsWith("$", name)) ? jsDoc(doc) : "";
      const annot: string = _Option_unwrapOr("", hook2(ctx.annotateLet, name, value));
      const head: string = `${docComment}${doExport ? "export " : ""}const ${name}${annot} = `;
      return ((_v) =>
        _v[0]._tag === "Some" && _v[1]._tag === "ELambda"
          ? (([{ value: raw }, { params, body, span: sp }]) =>
              (([arrow, arity]: [string, number]) => `const ${raw} = ${arrow};
${head}_curry(${show(arity)}, ${raw});`)(
                genArrow$(
                  ctx,
                  params,
                  body,
                  sp,
                  _Option_unwrapOr("", hook2(ctx.annotateRaw, name, value)),
                ),
              ))(
              _v as [
                Extract<[Option<string>, Expr][0], { _tag: "Some" }>,
                Extract<[Option<string>, Expr][1], { _tag: "ELambda" }>,
              ],
            )
          : `${head}${genExpr$(ctx, value)};`)(_tuple(_Map_get(name, ctx.rawNames), value));
    }
    case "SExpr": {
      const { value } = $match;
      return `${genExpr$(ctx, value)};`;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const genStmt: _Curry<[ctx: GCtx, s: Stmt], string> = _curry(2, genStmt$);
const usesMatchLibArm$ = (ctx: GCtx, a: MatchArm): boolean =>
  or(
    _Option_match(
      a.guard,
      () => false,
      (g) => usesMatchLib$(ctx, g),
    ),
    usesMatchLib$(ctx, a.body),
  );
const usesMatchLibArm: _Curry<[ctx: GCtx, a: MatchArm], boolean> = _curry(2, usesMatchLibArm$);
const usesMatchLib$ = (ctx: GCtx, e: Expr): boolean => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return false;
    }
    case "EUnit": {
      return false;
    }
    case "EBool": {
      return false;
    }
    case "EStr": {
      return false;
    }
    case "ERef": {
      return false;
    }
    case "ECall": {
      const { fn, args } = $match;
      return or(
        usesMatchLib$(ctx, fn),
        someOf((x: Expr) => usesMatchLib$(ctx, x), args),
      );
    }
    case "ELambda": {
      const { body } = $match;
      return usesMatchLib$(ctx, body);
    }
    case "ELetIn": {
      const { value, body } = $match;
      return or(usesMatchLib$(ctx, value), usesMatchLib$(ctx, body));
    }
    case "ELetBind": {
      const { value, body } = $match;
      return or(usesMatchLib$(ctx, value), usesMatchLib$(ctx, body));
    }
    case "EPipe": {
      const { left, right } = $match;
      return or(usesMatchLib$(ctx, left), usesMatchLib$(ctx, right));
    }
    case "EDo": {
      const { exprs } = $match;
      return someOf((x: Expr) => usesMatchLib$(ctx, x), exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return or(usesMatchLib$(ctx, cond), or(usesMatchLib$(ctx, thenE), usesMatchLib$(ctx, elseE)));
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return or(
        and(!isListMatch(arms), !ternaryTypes(ctx, arms, hook1(ctx.guardBaseType, scrutinee))),
        or(
          usesMatchLib$(ctx, scrutinee),
          someOf((a: MatchArm) => usesMatchLibArm$(ctx, a), arms),
        ),
      );
    }
    case "ELoop": {
      const { params, body } = $match;
      return or(
        someOf((p: LoopParam) => usesMatchLib$(ctx, p.init), params),
        usesMatchLib$(ctx, body),
      );
    }
    case "ERecur": {
      const { args } = $match;
      return someOf((x: Expr) => usesMatchLib$(ctx, x), args);
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return or(
        _Option_match(
          spread,
          () => false,
          (s) => usesMatchLib$(ctx, s),
        ),
        someOf((f: Field) => usesMatchLib$(ctx, f.value), fields),
      );
    }
    case "EField": {
      const { target } = $match;
      return usesMatchLib$(ctx, target);
    }
    case "ETuple": {
      const { elements } = $match;
      return someOf((x: Expr) => usesMatchLib$(ctx, x), elements);
    }
    case "EArr": {
      const { elements } = $match;
      return someOf(
        (el: SeqElem) =>
          usesMatchLib$(
            ctx,
            ((_v) =>
              _v._tag === "SEExpr"
                ? (({ expr: e }) => e)(_v)
                : _v._tag === "SESpread"
                  ? (({ expr: e }) => e)(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(el),
          ),
        elements,
      );
    }
    case "EList": {
      const { elements } = $match;
      return someOf(
        (el: SeqElem) =>
          usesMatchLib$(
            ctx,
            ((_v) =>
              _v._tag === "SEExpr"
                ? (({ expr: e }) => e)(_v)
                : _v._tag === "SESpread"
                  ? (({ expr: e }) => e)(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(el),
          ),
        elements,
      );
    }
    case "ESet": {
      const { elements } = $match;
      return someOf(
        (el: SeqElem) =>
          usesMatchLib$(
            ctx,
            ((_v) =>
              _v._tag === "SEExpr"
                ? (({ expr: e }) => e)(_v)
                : _v._tag === "SESpread"
                  ? (({ expr: e }) => e)(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(el),
          ),
        elements,
      );
    }
    case "EMap": {
      const { entries } = $match;
      return someOf(
        (en: MapEntry) => or(usesMatchLib$(ctx, en.key), usesMatchLib$(ctx, en.value)),
        entries,
      );
    }
    case "EInterp": {
      const { parts } = $match;
      return someOf((p: InterpPart) => {
        const $match$ = p;
        switch ($match$._tag) {
          case "IPLit": {
            return false;
          }
          case "IPExpr": {
            const { expr: ex } = $match$;
            return usesMatchLib$(ctx, ex);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const usesMatchLib: _Curry<[ctx: GCtx, e: Expr], boolean> = _curry(2, usesMatchLib$);
const loopInitRefsFrom$ = (
  ctx: GCtx,
  params: LoopParam[],
  i: number,
  acc: Set<string>,
): Set<string> =>
  _Option_match(
    _Array_get(i, params),
    () => acc,
    (p) => loopInitRefsFrom$(ctx, params, i + 1, exprRefs$(ctx, p.init, acc)),
  );
const loopInitRefsFrom: _Curry<
  [ctx: GCtx, params: LoopParam[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, loopInitRefsFrom$);
const exprRefsListFrom$ = (ctx: GCtx, xs: Expr[], i: number, acc: Set<string>): Set<string> =>
  _Option_match(
    _Array_get(i, xs),
    () => acc,
    (x) => exprRefsListFrom$(ctx, xs, i + 1, exprRefs$(ctx, x, acc)),
  );
const exprRefsListFrom: _Curry<
  [ctx: GCtx, xs: Expr[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, exprRefsListFrom$);
const exprRefsInterpPartsFrom$ = (
  ctx: GCtx,
  parts: InterpPart[],
  i: number,
  acc: Set<string>,
): Set<string> =>
  _Option_match(
    _Array_get(i, parts),
    () => acc,
    (p) =>
      exprRefsInterpPartsFrom$(
        ctx,
        parts,
        i + 1,
        ((_v) =>
          _v._tag === "IPLit"
            ? acc
            : _v._tag === "IPExpr"
              ? (({ expr: ex }) => exprRefs$(ctx, ex, acc))(_v)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(p),
      ),
  );
const exprRefsInterpPartsFrom: _Curry<
  [ctx: GCtx, parts: InterpPart[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, exprRefsInterpPartsFrom$);
const exprRefsArmsFrom$ = (ctx: GCtx, arms: MatchArm[], i: number, acc: Set<string>): Set<string> =>
  _Option_match(
    _Array_get(i, arms),
    () => acc,
    (a) => {
      const acc1: Set<string> = _Option_match(
        a.guard,
        () => acc,
        (g) => exprRefs$(ctx, g, acc),
      );
      return exprRefsArmsFrom$(ctx, arms, i + 1, exprRefs$(ctx, a.body, acc1));
    },
  );
const exprRefsArmsFrom: _Curry<
  [ctx: GCtx, arms: MatchArm[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, exprRefsArmsFrom$);
const exprRefsFieldsFrom$ = (
  ctx: GCtx,
  fields: Field[],
  i: number,
  acc: Set<string>,
): Set<string> =>
  _Option_match(
    _Array_get(i, fields),
    () => acc,
    (f) => exprRefsFieldsFrom$(ctx, fields, i + 1, exprRefs$(ctx, f.value, acc)),
  );
const exprRefsFieldsFrom: _Curry<
  [ctx: GCtx, fields: Field[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, exprRefsFieldsFrom$);
const exprRefsEntriesFrom$ = (
  ctx: GCtx,
  entries: MapEntry[],
  i: number,
  acc: Set<string>,
): Set<string> =>
  _Option_match(
    _Array_get(i, entries),
    () => acc,
    (en) =>
      exprRefsEntriesFrom$(
        ctx,
        entries,
        i + 1,
        exprRefs$(ctx, en.value, exprRefs$(ctx, en.key, acc)),
      ),
  );
const exprRefsEntriesFrom: _Curry<
  [ctx: GCtx, entries: MapEntry[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, exprRefsEntriesFrom$);
const exprRefs$ = (ctx: GCtx, e: Expr, acc: Set<string>): Set<string> => {
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
      return _Set_add(name, acc);
    }
    case "ECall": {
      const { fn, args } = $match;
      return exprRefsListFrom$(ctx, args, 0, exprRefs$(ctx, fn, acc));
    }
    case "ELambda": {
      const { params, body } = $match;
      return (([cparams, cbody, fills]: [
        LamParam[],
        Expr,
        { labVar: string; labs: LamParam[] }[],
      ]) => {
        const acc2: Set<string> = length(cparams) >= 2 ? _Set_add("_curry", acc) : acc;
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
                      }) => exprRefs$(ctx, d, b))(
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
                      ? (({ defaultValue: { value: d } }) => exprRefs$(ctx, d, b))(
                          _v as Extract<LamParam, { _tag: "LPLabeled" }> & {
                            defaultValue: Extract<
                              Extract<LamParam, { _tag: "LPLabeled" }>["defaultValue"],
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
        return exprRefs$(ctx, cbody, acc3);
      })(collapseLambda$(params, body));
    }
    case "ELetIn": {
      const { value, body } = $match;
      return exprRefs$(ctx, body, exprRefs$(ctx, value, acc));
    }
    case "ELetBind": {
      const { monad, value, body } = $match;
      return exprRefs$(ctx, body, exprRefs$(ctx, value, _Set_add(bindRuntime(monad), acc)));
    }
    case "EPipe": {
      const { left, right } = $match;
      return exprRefs$(ctx, right, exprRefs$(ctx, left, acc));
    }
    case "EDo": {
      const { exprs } = $match;
      return exprRefsListFrom$(ctx, exprs, 0, acc);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return exprRefs$(ctx, elseE, exprRefs$(ctx, thenE, exprRefs$(ctx, cond, acc)));
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      const acc1: Set<string> = exprRefs$(ctx, scrutinee, acc);
      const acc2: Set<string> = someOf(
        (a: MatchArm) =>
          ((_v) =>
            _v._tag === "PList" && _v.rest._tag === "Some" && _v.rest.value._tag === "PBind"
              ? true
              : false)(a.pattern),
        arms,
      )
        ? _Set_add("_list", acc1)
        : acc1;
      return exprRefsArmsFrom$(
        ctx,
        arms,
        0,
        _Option_match(
          builtinMatchPlan(ctx, scrutinee, arms),
          () => acc2,
          (plan) => _Set_add(plan.helper, acc2),
        ),
      );
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return exprRefsFieldsFrom$(
        ctx,
        fields,
        0,
        _Option_match(
          spread,
          () => acc,
          (s) => exprRefs$(ctx, s, acc),
        ),
      );
    }
    case "EField": {
      const { target, name } = $match;
      return _Option_match(
        emptyNsEmit$(target, name, None as Option<string>),
        () =>
          _Option_match(
            nsRuntimeId$(ctx, target, name),
            () => exprRefs$(ctx, target, acc),
            (rt) => _Set_add(rt, acc),
          ),
        () =>
          ((_v) => (_v._tag === "ERef" && _v.name === "List" ? _Set_add("_list", acc) : acc))(
            target,
          ),
      );
    }
    case "ELoop": {
      const { params, body } = $match;
      const acc1: Set<string> = loopNeedsStep(ctx, body, params)
        ? _Set_add("_recur", _Set_add("_done", acc))
        : acc;
      const acc2: Set<string> = loopInitRefsFrom$(ctx, params, 0, acc1);
      return exprRefs$(ctx, body, acc2);
    }
    case "ERecur": {
      const { args } = $match;
      return exprRefsListFrom$(ctx, args, 0, acc);
    }
    case "ETuple": {
      const { elements } = $match;
      return exprRefsListFrom$(ctx, elements, 0, acc);
    }
    case "EArr": {
      const { elements } = $match;
      return exprRefsListFrom$(
        ctx,
        map((el: SeqElem) => {
          const $match$ = el;
          switch ($match$._tag) {
            case "SEExpr": {
              const { expr: e } = $match$;
              return e;
            }
            case "SESpread": {
              const { expr: e } = $match$;
              return e;
            }
            default: {
              throw new Error("non-exhaustive match");
            }
          }
        }, elements),
        0,
        acc,
      );
    }
    case "EList": {
      const { elements } = $match;
      return exprRefsListFrom$(
        ctx,
        map((el: SeqElem) => {
          const $match$ = el;
          switch ($match$._tag) {
            case "SEExpr": {
              const { expr: e } = $match$;
              return e;
            }
            case "SESpread": {
              const { expr: e } = $match$;
              return e;
            }
            default: {
              throw new Error("non-exhaustive match");
            }
          }
        }, elements),
        0,
        _Set_add("_list", acc),
      );
    }
    case "ESet": {
      const { elements } = $match;
      return exprRefsListFrom$(
        ctx,
        map((el: SeqElem) => {
          const $match$ = el;
          switch ($match$._tag) {
            case "SEExpr": {
              const { expr: e } = $match$;
              return e;
            }
            case "SESpread": {
              const { expr: e } = $match$;
              return e;
            }
            default: {
              throw new Error("non-exhaustive match");
            }
          }
        }, elements),
        0,
        acc,
      );
    }
    case "EMap": {
      const { entries } = $match;
      return exprRefsEntriesFrom$(ctx, entries, 0, acc);
    }
    case "EInterp": {
      const { parts } = $match;
      return exprRefsInterpPartsFrom$(ctx, parts, 0, acc);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const exprRefs: _Curry<[ctx: GCtx, e: Expr, acc: Set<string>], Set<string>> = _curry(3, exprRefs$);
const boundNamesFrom$ = (
  valueRefs: Set<string>,
  stmts: Stmt[],
  i: number,
  acc: Set<string>,
): Set<string> =>
  _Option_match(
    _Array_get(i, stmts),
    () => acc,
    (s) =>
      boundNamesFrom$(
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
                          filter((c: Ctor) => or(exported, _Set_has(c.name, valueRefs)), ctors),
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
      ),
  );
const boundNamesFrom: _Curry<
  [valueRefs: Set<string>, stmts: Stmt[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, boundNamesFrom$);
const boundNames$ = (valueRefs: Set<string>, stmts: Stmt[]): Set<string> =>
  boundNamesFrom$(valueRefs, stmts, 0, _Set_fromArray([] as string[]));
const boundNames: _Curry<[valueRefs: Set<string>, stmts: Stmt[]], Set<string>> = _curry(
  2,
  boundNames$,
);
const collectValueRefs$ = (ctx: GCtx, stmts: Stmt[], i: number, acc: Set<string>): Set<string> =>
  _Option_match(
    _Array_get(i, stmts),
    () => acc,
    (s) =>
      collectValueRefs$(
        ctx,
        stmts,
        i + 1,
        ((_v) =>
          _v._tag === "SLet"
            ? (({ value }) => exprRefs$(ctx, value, acc))(_v)
            : _v._tag === "SExpr"
              ? (({ value }) => exprRefs$(ctx, value, acc))(_v)
              : acc)(s),
      ),
  );
/**
 * Names referenced in let/expr values — not patterns. `| TLet =>` does not
 * count, so a local unused ctor factory can be dropped.
 */
const collectValueRefs: _Curry<
  [ctx: GCtx, stmts: Stmt[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, collectValueRefs$);
const refsForStmt$ = (ctx: GCtx, s: Stmt): Set<string> => {
  const $match = s;
  switch ($match._tag) {
    case "SLet": {
      const { value } = $match;
      return exprRefs$(ctx, value, _Set_fromArray([] as string[]));
    }
    case "SExpr": {
      const { value } = $match;
      return exprRefs$(ctx, value, _Set_fromArray([] as string[]));
    }
    case "SType": {
      const { ctors, exported } = $match;
      return someOf(
        (c: Ctor) => and(length(c.fields) >= 2, or(exported, _Set_has(c.name, ctx.valueRefs))),
        ctors,
      )
        ? _Set_add("_curry", _Set_fromArray([] as string[]))
        : _Set_fromArray([] as string[]);
    }
    case "SExtern": {
      const { typeExpr } = $match;
      return typeExprArity(typeExpr) >= 2
        ? _Set_add("_curry", _Set_fromArray([] as string[]))
        : _Set_fromArray([] as string[]);
    }
    default: {
      return _Set_fromArray([] as string[]);
    }
  }
};
const refsForStmt: _Curry<[ctx: GCtx, s: Stmt], Set<string>> = _curry(2, refsForStmt$);
const collectRefsFrom$ = (ctx: GCtx, stmts: Stmt[], i: number, acc: Set<string>): Set<string> =>
  _Option_match(
    _Array_get(i, stmts),
    () => acc,
    (s) => collectRefsFrom$(ctx, stmts, i + 1, _Set_union(acc, refsForStmt$(ctx, s))),
  );
const collectRefsFrom: _Curry<
  [ctx: GCtx, stmts: Stmt[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, collectRefsFrom$);
const addDepsFrom: <A>(deps: A[], j: number, refs: Set<A>, queue: A[]) => [Set<A>, A[]] = _curry(
  4,
  <A>(deps: A[], j: number, refs: Set<A>, queue: A[]) =>
    _Option_match(
      _Array_get(j, deps),
      () => _tuple(refs, queue),
      (d) =>
        _Set_has(d, refs)
          ? addDepsFrom(deps, j + 1, refs, queue)
          : addDepsFrom(deps, j + 1, _Set_add(d, refs), _Array_append(d, queue)),
    ),
);
const closeRefsFrom: <A>(queue: A[], i: number, refs: Set<A>, runtimeDeps: Map<A, A[]>) => Set<A> =
  _curry(4, <A>(queue: A[], i: number, refs: Set<A>, runtimeDeps: Map<A, A[]>) =>
    _Option_match(
      _Array_get(i, queue),
      () => refs,
      (r) => {
        const deps = _Option_unwrapOr([] as A[], _Map_get(r, runtimeDeps));
        return (([refs2, queue2]: [Set<A>, A[]]) =>
          closeRefsFrom(queue2, i + 1, refs2, runtimeDeps))(addDepsFrom(deps, 0, refs, queue));
      },
    ),
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
    const refs0: Set<string> = collectRefsFrom$(ctx, stmts, 0, _Set_fromArray([] as string[]));
    const refs: Set<string> = closeRefsFrom(_Set_toArray(refs0), 0, refs0, runtimeDeps);
    const bound: Set<string> = boundNames$(ctx.valueRefs, stmts);
    return filter((n: string) => and(_Set_has(n, refs), !_Set_has(n, bound)), _Map_keys(jsDefs));
  },
);
const preludePreamble$ = (
  ctx: GCtx,
  stmts: Stmt[],
  jsDefs: Map<string, string>,
  runtimeDeps: Map<string, string[]>,
): string => {
  const names: string[] = runtimeRefNames(ctx, stmts, jsDefs, runtimeDeps);
  const defs: string[] = map((n: string) => _Map_getOr("", n, jsDefs), names);
  return length(defs) === 0
    ? ""
    : `${_Str_join("\n", defs)}

`;
};
const preludePreamble: _Curry<
  [ctx: GCtx, stmts: Stmt[], jsDefs: Map<string, string>, runtimeDeps: Map<string, string[]>],
  string
> = _curry(4, preludePreamble$);
const genStmtAllFrom$ = (ctx: GCtx, stmts: Stmt[], i: number): string[] =>
  _Option_match(
    _Array_get(i, stmts),
    () => [] as string[],
    (s) => _Array_prepend(genStmt$(ctx, s), genStmtAllFrom$(ctx, stmts, i + 1)),
  );
const genStmtAllFrom: _Curry<[ctx: GCtx, stmts: Stmt[], i: number], string[]> = _curry(
  3,
  genStmtAllFrom$,
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
    annotateRaw: Option<(a: string, b: Expr) => Option<string>>;
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
      annotateRaw: Option<(a: string, b: Expr) => Option<string>>;
      annotateLet: Option<(a: string, b: Expr) => Option<string>>;
    } & A,
  ) => {
    const keys0: Map<string, string[]> = ctorKeysFromStmts(stmts, imported);
    const keys: Map<string, string[]> = seedBuiltinCtorKeys(stmts, keys0);
    const ctx0: GCtx = {
      keys: keys,
      customCtorKeys: keys0,
      ns: ns,
      annotateLet: opts.annotateLet,
      annotateRaw: opts.annotateRaw,
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
      rawNames: new Map([]),
      rawArity: new Map([]),
      valueRefs: _Set_fromArray([]),
      userNames: _Set_union(
        boundNames$(_Set_fromArray([] as string[]), stmts),
        localBinderNames(stmts),
      ),
      docs: opts.docs,
    };
    const valueRefs: Set<string> = collectValueRefs$(
      ctx0,
      stmts,
      0,
      _Set_fromArray([] as string[]),
    );
    const userNames: Set<string> = _Set_union(
      boundNames$(valueRefs, stmts),
      localBinderNames(stmts),
    );
    const ctx: GCtx = withRawTwins$(
      { ...ctx0, valueRefs: valueRefs, userNames: userNames },
      localBinderNames(stmts),
      stmts,
      0,
    );
    const needsMatch: boolean = someOf((s: Stmt) => {
      const $match = s;
      switch ($match._tag) {
        case "SLet": {
          const { value } = $match;
          return usesMatchLib$(ctx, value);
        }
        case "SExpr": {
          const { value } = $match;
          return usesMatchLib$(ctx, value);
        }
        default: {
          return false;
        }
      }
    }, stmts);
    const header: string = needsMatch ? 'import { match } from "@onrails/pattern";\n\n' : "";
    const preamble: string = useRuntime ? preludePreamble$(ctx, stmts, jsDefs, runtimeDeps) : "";
    const body: string = _Str_join("\n", genStmtAllFrom$(ctx, stmts, 0));
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
    const keys0: Map<string, string[]> = ctorKeysFromStmts(stmts, imported);
    const keys: Map<string, string[]> = seedBuiltinCtorKeys(stmts, keys0);
    const ctx0: GCtx = {
      keys: keys,
      customCtorKeys: keys0,
      ns: ns,
      annotateLet: None,
      annotateRaw: None,
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
      rawNames: new Map([]),
      rawArity: new Map([]),
      valueRefs: _Set_fromArray([]),
      userNames: _Set_union(
        boundNames$(_Set_fromArray([] as string[]), stmts),
        localBinderNames(stmts),
      ),
      docs: false,
    };
    const valueRefs: Set<string> = collectValueRefs$(
      ctx0,
      stmts,
      0,
      _Set_fromArray([] as string[]),
    );
    return runtimeRefNames({ ...ctx0, valueRefs: valueRefs }, stmts, jsDefs, runtimeDeps);
  },
);
const codegen$ = (
  stmts: Stmt[],
  imported: Map<string, string[]>,
  useRuntime: boolean,
  ns: Map<string, Map<string, string>>,
  jsDefs: Map<string, string>,
  runtimeDeps: Map<string, string[]>,
): string => codegenWith(stmts, imported, useRuntime, ns, jsDefs, runtimeDeps, jsGenOpts);
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
> = _curry(6, codegen$);
