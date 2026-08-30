import type {
  Ctor,
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
  Span,
  Stmt,
  TypeExpr,
} from "./ast";
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
export type CtorLike = { name: string; fields: CtorFieldLike[] };
export type GenOpts = {
  annotateLet: Option<(a: string, b: Expr) => Option<string>>;
  annotateCtor: Option<(a: Stmt, b: CtorLike) => Option<CtorFactoryTs>>;
  annotateParams: Option<(a: Span, b: number) => ParamAnnots>;
  annotateEmpty: Option<(a: Expr) => Option<string>>;
  annotateLetin: Option<(a: Expr) => Option<string>>;
  annotateCall: Option<(a: Expr) => Option<string>>;
  guardBaseType: Option<(a: Expr) => Option<string>>;
  flattenPipe: boolean;
  tupleHelper: boolean;
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
  annotateCtor: Option<(a: Stmt, b: CtorLike) => Option<CtorFactoryTs>>;
  annotateParams: Option<(a: Span, b: number) => ParamAnnots>;
  annotateEmpty: Option<(a: Expr) => Option<string>>;
  annotateLetin: Option<(a: Expr) => Option<string>>;
  annotateCall: Option<(a: Expr) => Option<string>>;
  guardBaseType: Option<(a: Expr) => Option<string>>;
  flattenPipe: boolean;
  tupleHelper: boolean;
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
  annotateCtor: None as Option<(a: Stmt, b: CtorLike) => Option<CtorFactoryTs>>,
  annotateParams: None as Option<(a: Span, b: number) => ParamAnnots>,
  annotateEmpty: None as Option<(a: Expr) => Option<string>>,
  annotateLetin: None as Option<(a: Expr) => Option<string>>,
  annotateCall: None as Option<(a: Expr) => Option<string>>,
  guardBaseType: None as Option<(a: Expr) => Option<string>>,
  flattenPipe: false,
  tupleHelper: false,
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
    match(h)
      .with({ _tag: "None" }, () => None)
      .with({ _tag: "Some" }, ({ value: f }) => f(x))
      .exhaustive(),
);
/**
 * `hook1` for the two-argument hooks.
 */
const hook2: <A, B, C>(h: Option<(a: A, b: B) => Option<C>>, x: A, y: B) => Option<C> = _curry(
  3,
  <A, B, C>(h: Option<(a: A, b: B) => Option<C>>, x: A, y: B) =>
    match(h)
      .with({ _tag: "None" }, () => None)
      .with({ _tag: "Some" }, ({ value: f }) => f(x, y))
      .exhaustive(),
);
/**
 * `new Map<K, V>()` when annotated, `new Map()` otherwise.
 */
const emptyNsCtor: _Curry<[con: string, ann: Option<string>], string> = _curry(
  2,
  (con: string, ann: Option<string>) =>
    match(ann)
      .with({ _tag: "None" }, () => `new ${con}()`)
      .with({ _tag: "Some" }, ({ value: t }) => `new ${t}()`)
      .exhaustive(),
);
/**
 * Uppercase-initial name — a constructor, not an ordinary binding.
 * A record field name emits BARE only when it is a valid JS identifier;
 * anything else (`data-testid`, `aria-label`) must be quoted or the object
 * literal is a syntax error. Mirrors the oracle's `/^[$A-Za-z_][\w$]*$/`.
 */
const isIdentStart: (c: number) => boolean = (c: number) =>
  or(or(or(and(gte(c, 65), lte(c, 90)), and(gte(c, 97), lte(c, 122))), eq(c, 95)), eq(c, 36));
const isIdentPart: (c: number) => boolean = (c: number) =>
  or(isIdentStart(c), and(gte(c, 48), lte(c, 57)));
const identPartsFrom: _Curry<[s: string, i: number], boolean> = _curry(2, (s: string, i: number) =>
  match(_Str_codeAt(i, s))
    .with({ _tag: "None" }, () => true)
    .with({ _tag: "Some" }, ({ value: c }) => and(isIdentPart(c), identPartsFrom(s, add(i, 1))))
    .exhaustive(),
);
const isJsIdent: (s: string) => boolean = (s: string) =>
  match(_Str_codeAt(0, s))
    .with({ _tag: "None" }, () => false)
    .with({ _tag: "Some" }, ({ value: c }) => and(isIdentStart(c), identPartsFrom(s, 1)))
    .exhaustive();
const isUpperStart: (s: string) => boolean = (s: string) =>
  _Option_exists((n: number) => and(gte(n, 65), lte(n, 90)), _Str_codeAt(0, s));
/**
 * A 0-field ctor reference (`None`), per this program's ctor-key table.
 */
const isNullaryCtor: <A, B>(name: A, keys: Map<A, B[]>) => boolean = _curry(
  2,
  <A, B>(name: A, keys: Map<A, B[]>) =>
    _Option_exists((ks: B[]) => eq(length(ks), 0), _Map_get(name, keys)),
);
/**
 * Callee that is a bare uppercase ref — gates the applied-ctor cast.
 */
const isCtorRef: (fn: Expr) => boolean = (fn: Expr) =>
  match(fn)
    .with({ _tag: "ERef" }, ({ name }) => isUpperStart(name))
    .otherwise(() => false);
/**
 * `name: T` when annotated, bare name otherwise.
 */
const suffixOr: _Curry<[name: string, ann: Option<string>], string> = _curry(
  2,
  (name: string, ann: Option<string>) =>
    match(ann)
      .with({ _tag: "None" }, () => name)
      .with({ _tag: "Some" }, ({ value: t }) => `${name}: ${t}`)
      .exhaustive(),
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
  match(h)
    .with({ _tag: "None" }, () => bareParamAnnots)
    .with({ _tag: "Some" }, ({ value: f }) => f(sp, arity))
    .exhaustive(),
);
/**
 * Zip collapsed params with their annotations; a missing or `None` entry
 * leaves the param bare (generic position, or JS mode).
 */
const annotatedParams: _Curry<
  [cparams: LamParam[], annots: Option<string>[], i: number],
  string[]
> = _curry(3, (cparams: LamParam[], annots: Option<string>[], i: number) =>
  match(_Array_get(i, cparams))
    .with({ _tag: "None" }, () => [] as string[])
    .with({ _tag: "Some" }, ({ value: p }) =>
      _Array_prepend(
        suffixOr(genParam(p), _Option_unwrapOr(None as Option<string>, _Array_get(i, annots))),
        annotatedParams(cparams, annots, add(i, 1)),
      ),
    )
    .exhaustive(),
);
/**
 * `expr as T` when annotated, bare otherwise.
 */
const castOr: _Curry<[js: string, ann: Option<string>], string> = _curry(
  2,
  (js: string, ann: Option<string>) =>
    match(ann)
      .with({ _tag: "None" }, () => js)
      .with({ _tag: "Some" }, ({ value: t }) => `(${js} as ${t})`)
      .exhaustive(),
);
const bindRuntime: (monad: string) => string = (monad: string) =>
  eq(monad, "Option")
    ? "_Option_flatMap"
    : eq(monad, "Result")
      ? "_Result_flatMap"
      : "_Task_andThen";
const allOfFrom: <A>(f: (a: A) => boolean, xs: A[], i: number) => boolean = _curry(
  3,
  <A>(f: (a: A) => boolean, xs: A[], i: number) =>
    match(_Array_get(i, xs))
      .with({ _tag: "None" }, () => true)
      .with({ _tag: "Some" }, ({ value: x }) => (f(x) ? allOfFrom(f, xs, add(i, 1)) : false))
      .exhaustive(),
);
const allOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) => allOfFrom(f, xs, 0),
);
const someOfFrom: <A>(f: (a: A) => boolean, xs: A[], i: number) => boolean = _curry(
  3,
  <A>(f: (a: A) => boolean, xs: A[], i: number) =>
    match(_Array_get(i, xs))
      .with({ _tag: "None" }, () => false)
      .with({ _tag: "Some" }, ({ value: x }) => (f(x) ? true : someOfFrom(f, xs, add(i, 1))))
      .exhaustive(),
);
const someOf: <A>(f: (a: A) => boolean, xs: A[]) => boolean = _curry(
  2,
  <A>(f: (a: A) => boolean, xs: A[]) => someOfFrom(f, xs, 0),
);
const escChar: (c: string) => string = (c: string) =>
  match(c)
    .with("\\", () => "\\\\")
    .with('"', () => '\\"')
    .with("\n", () => "\\n")
    .with("\t", () => "\\t")
    .otherwise(() => c);
const jsStringLit: (s: string) => string = (s: string) =>
  `"${_Str_join("", map(escChar, _Str_chars(s)))}"`;
const escTemplateLoop: _Curry<[chars: string[], i0: number, acc0: string], string> = _curry(
  3,
  (chars: string[], i0: number, acc0: string) => {
    let i: number = i0;
    let acc: string = acc0;
    while (true) {
      const _step = match(_Array_get(i, chars))
        .with({ _tag: "None" }, () => _done(acc))
        .with({ _tag: "Some", value: "\\" }, () => _recur(add(i, 1), `${acc}\\\\`))
        .with({ _tag: "Some", value: "`" }, () => _recur(add(i, 1), `${acc}\\\``))
        .with(
          (_v): _v is Extract<Option<string>, { _tag: "Some" }> => {
            const _g: any = _v;
            return (
              _g._tag === "Some" &&
              _g.value === "$" &&
              _Option_contains("{", _Array_get(add(i, 1), chars))
            );
          },
          () => _recur(add(i, 2), `${acc}\\\${`),
        )
        .with({ _tag: "Some" }, ({ value: c }) => _recur(add(i, 1), `${acc}${c}`))
        .exhaustive();
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
    match(_Map_get(ctor, ctx.keys))
      .with({ _tag: "Some" }, ({ value: ks }) => _Option_unwrapOr(`_${show(i)}`, _Array_get(i, ks)))
      .with({ _tag: "None" }, () => `_${show(i)}`)
      .exhaustive(),
);
const nsRuntimeId: _Curry<[ctx: GCtx, target: Expr, name: string], Option<string>> = _curry(
  3,
  (ctx: GCtx, target: Expr, name: string) =>
    match(target)
      .with({ _tag: "ERef" }, ({ name: refName }) =>
        match(_Map_get(refName, ctx.ns))
          .with({ _tag: "Some" }, ({ value: members }) => _Map_get(name, members))
          .with({ _tag: "None" }, () => None as Option<string>)
          .exhaustive(),
      )
      .otherwise(() => None as Option<string>),
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
  match(target)
    .with({ _tag: "ERef" }, ({ name: refName }) =>
      eq(name, "empty")
        ? eq(refName, "Set")
          ? (Some(emptyNsCtor("Set", ann)) as Option<string>)
          : eq(refName, "Map")
            ? (Some(emptyNsCtor("Map", ann)) as Option<string>)
            : eq(refName, "List")
              ? (Some("_list(function* () {})") as Option<string>)
              : (None as Option<string>)
        : (None as Option<string>),
    )
    .otherwise(() => None as Option<string>),
);
const isLabeledParam: (p: LamParam) => boolean = (p: LamParam) =>
  match(p)
    .with({ _tag: "LPLabeled" }, () => true)
    .otherwise(() => false);
const splitLamParams: _Curry<
  [params: LamParam[], positional: LamParam[], labeled: LamParam[]],
  [LamParam[], LamParam[]]
> = _curry(3, (params: LamParam[], positional: LamParam[], labeled: LamParam[]) =>
  match(params)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => _tuple(positional, labeled),
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([p, ...rest]) =>
        isLabeledParam(p)
          ? splitLamParams(rest, positional, _Array_append(p, labeled))
          : splitLamParams(rest, _Array_append(p, positional), labeled),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
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
      return match(labeled)
        .with(
          (_v) => {
            const _g: any = _v;
            return _g.length === 0;
          },
          () => _tuple(acc1, fills, labN),
        )
        .otherwise(() =>
          ((labVar: string) =>
            _tuple(
              _Array_append(Ast.LPName(labVar, None as Option<TypeExpr>), acc1),
              _Array_append({ labVar: labVar, labs: labeled }, fills),
              add(labN, 1),
            ))(eq(labN, 0) ? "$lab" : `$lab${show(labN)}`),
        );
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
      match(body)
        .with({ _tag: "ELambda" }, ({ params: params2, body: body2 }) =>
          collapseLambdaFrom(params2, body2, acc1, fills1, labN1),
        )
        .otherwise(() => _tuple(acc1, body, fills1)))(absorbParams(params, acc, fills, labN)),
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
const genExpr: _Curry<[ctx: GCtx, e: Expr], string> = _curry(2, (ctx: GCtx, e: Expr) =>
  match(e)
    .with({ _tag: "ENum" }, ({ raw }) => raw)
    .with({ _tag: "EUnit" }, () => "undefined")
    .with({ _tag: "EBool" }, ({ value }) => (value ? "true" : "false"))
    .with({ _tag: "EStr" }, ({ value }) => jsStringLit(value))
    .with({ _tag: "ERef" }, ({ name }) =>
      castOr(
        name,
        isNullaryCtor(name, ctx.keys) ? hook1(ctx.annotateEmpty, e) : (None as Option<string>),
      ),
    )
    .with({ _tag: "ECall" }, ({ fn, args }) =>
      ((inner: string) =>
        castOr(inner, isCtorRef(fn) ? hook1(ctx.annotateCall, e) : (None as Option<string>)))(
        `${genCallee(ctx, fn)}(${_Str_join(
          ", ",
          map((a: Expr) => genExpr(ctx, a), args),
        )})`,
      ),
    )
    .with({ _tag: "ELambda" }, ({ params, body, span: sp }) =>
      (([cparams, cbody, fills]: [LamParam[], Expr, { labs: LamParam[]; labVar: string }[]]) => {
        const bound: Set<string> = fillNames(
          fills,
          paramNameSet(cparams, 0, _Set_fromArray([] as string[])),
        );
        const annots: ParamAnnots = paramAnnotsFor(ctx.annotateParams, sp, length(cparams));
        const arrow: string = `${annots.generics}(${_Str_join(", ", annotatedParams(cparams, annots.params, 0))}) => ${genLambdaBodyIn(ctx, cbody, bound, genFillDecls(ctx, fills))}`;
        return gte(length(cparams), 2) ? `_curry(${show(length(cparams))}, ${arrow})` : arrow;
      })(collapseLambda(params, body)),
    )
    .with({ _tag: "ELetIn" }, ({ name, value, body }) =>
      ((param: string) => `((${param}) => ${genLambdaBody(ctx, body)})(${genExpr(ctx, value)})`)(
        suffixOr(name, hook1(ctx.annotateLetin, value)),
      ),
    )
    .with({ _tag: "ELetBind" }, ({ param, monad, value, body }) =>
      ((rt: string) =>
        ((f: string) =>
          ((v: string) => (ctx.flattenPipe ? `${rt}(${f}, ${v})` : `${rt}(${f})(${v})`))(
            genExpr(ctx, value),
          ))(`(${genParam(param)}) => ${genLambdaBody(ctx, body)}`))(bindRuntime(monad)),
    )
    .with({ _tag: "EPipe" }, ({ left, right }) =>
      match(right)
        .with(
          (_v): _v is Extract<Expr, { _tag: "ECall" }> => {
            const _g: any = _v;
            return _g._tag === "ECall" && (({ fn: rfn, args: rargs }) => ctx.flattenPipe)(_g);
          },
          ({ fn: rfn, args: rargs }) =>
            `${genCallee(ctx, rfn)}(${_Str_join(
              ", ",
              map((a: Expr) => genExpr(ctx, a), _Array_append(left, rargs)),
            )})`,
        )
        .otherwise(() => `${genCallee(ctx, right)}(${genExpr(ctx, left)})`),
    )
    .with({ _tag: "EDo" }, ({ exprs }) => genDo(ctx, exprs))
    .with(
      { _tag: "ETernary" },
      ({ cond, thenE, elseE }) =>
        `(${genExpr(ctx, cond)} ? ${genExpr(ctx, thenE)} : ${genExpr(ctx, elseE)})`,
    )
    .with({ _tag: "EMatch" }, ({ scrutinee, arms }) => genMatch(ctx, scrutinee, arms))
    .with(
      { _tag: "ELoop" },
      ({ params, body }) => `(() => { ${genLoopBlock(ctx, params, body)} })()`,
    )
    .with(
      { _tag: "ERecur" },
      ({ args }) =>
        `_recur(${_Str_join(
          ", ",
          map((a: Expr) => genExpr(ctx, a), args),
        )})`,
    )
    .with({ _tag: "ERecord" }, ({ fields, spread }) =>
      ((fieldStrs: string) =>
        match(spread)
          .with({ _tag: "None" }, () => (eq(length(fields), 0) ? "{}" : `{ ${fieldStrs} }`))
          .with({ _tag: "Some" }, ({ value: s }) =>
            ((spreadStr: string) =>
              eq(length(fields), 0) ? `{ ${spreadStr} }` : `{ ${spreadStr}, ${fieldStrs} }`)(
              `...${genExpr(ctx, s)}`,
            ),
          )
          .exhaustive())(
        _Str_join(
          ", ",
          map(
            (f: Field) =>
              `${isJsIdent(f.name) ? f.name : jsStringLit(f.name)}: ${genExpr(ctx, f.value)}`,
            fields,
          ),
        ),
      ),
    )
    .with({ _tag: "EField" }, ({ target, name, optional }) =>
      match(emptyNsEmit(target, name, hook1(ctx.annotateEmpty, e)))
        .with({ _tag: "Some" }, ({ value: js }) => js)
        .with({ _tag: "None" }, () =>
          match(nsRuntimeId(ctx, target, name))
            .with({ _tag: "Some" }, ({ value: rt }) => rt)
            .with({ _tag: "None" }, () =>
              ((member: string) =>
                optional
                  ? `((v) => v != null ? { _tag: "Some", value: v } : { _tag: "None" })(${member})`
                  : member)(`${genMember(ctx, target)}.${name}`),
            )
            .exhaustive(),
        )
        .exhaustive(),
    )
    .with({ _tag: "ETuple" }, ({ elements }) =>
      ((elems: string) => (ctx.tupleHelper ? `_tuple(${elems})` : `[${elems}]`))(
        _Str_join(
          ", ",
          map((el: Expr) => genExpr(ctx, el), elements),
        ),
      ),
    )
    .with({ _tag: "EArr" }, ({ elements }) =>
      ((body: string) =>
        castOr(
          body,
          eq(length(elements), 0) ? hook1(ctx.annotateEmpty, e) : (None as Option<string>),
        ))(
        `[${_Str_join(
          ", ",
          map((el: SeqElem) => genSeqSlot(ctx, el), elements),
        )}]`,
      ),
    )
    .with({ _tag: "EList" }, ({ elements }) => genList(ctx, elements))
    .with(
      { _tag: "ESet" },
      ({ elements }) =>
        `new Set([${_Str_join(
          ", ",
          map((el: SeqElem) => genSeqSlot(ctx, el), elements),
        )}])`,
    )
    .with({ _tag: "EMap" }, ({ entries }) =>
      match(eq(length(entries), 0) ? hook1(ctx.annotateEmpty, e) : (None as Option<string>))
        .with({ _tag: "Some" }, ({ value: t }) => `new ${t}()`)
        .with(
          { _tag: "None" },
          () =>
            `new Map([${_Str_join(
              ", ",
              map(
                (en: MapEntry) => `[${genExpr(ctx, en.key)}, ${genExpr(ctx, en.value)}]`,
                entries,
              ),
            )}])`,
        )
        .exhaustive(),
    )
    .with({ _tag: "EInterp" }, ({ parts }) =>
      ((body: string) => `\`${body}\``)(
        _Str_join(
          "",
          map(
            (p: InterpPart) =>
              match(p)
                .with({ _tag: "IPLit" }, ({ value }) => escapeTemplateLiteral(value))
                .with({ _tag: "IPExpr" }, ({ expr: ex }) => `\${${genExpr(ctx, ex)}}`)
                .exhaustive(),
            parts,
          ),
        ),
      ),
    )
    .exhaustive(),
);
const genDo: _Curry<[ctx: GCtx, exprs: Expr[]], string> = _curry(
  2,
  (ctx: GCtx, exprs: Expr[]) => `(() => { ${genDoSteps(ctx, exprs)} })()`,
);
const genDoSteps: _Curry<[ctx: GCtx, exprs: Expr[]], string> = _curry(
  2,
  (ctx: GCtx, exprs: Expr[]) =>
    match(exprs)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 1;
        },
        ([last]) => `return ${genExpr(ctx, last)};`,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([first, ...rest]) => `${genExpr(ctx, first)}; ${genDoSteps(ctx, rest)}`,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => 'throw new Error("empty do block");',
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const genSeqSlot: _Curry<[ctx: GCtx, el: SeqElem], string> = _curry(2, (ctx: GCtx, el: SeqElem) =>
  match(el)
    .with({ _tag: "SEExpr" }, ({ expr: ex }) => genExpr(ctx, ex))
    .with({ _tag: "SESpread" }, ({ expr: ex }) => `...${genExpr(ctx, ex)}`)
    .exhaustive(),
);
const genList: _Curry<[ctx: GCtx, elements: SeqElem[]], string> = _curry(
  2,
  (ctx: GCtx, elements: SeqElem[]) => {
    const yields: string = _Str_join(
      " ",
      map(
        (el: SeqElem) =>
          match(el)
            .with({ _tag: "SEExpr" }, ({ expr: ex }) => `yield (${genExpr(ctx, ex)});`)
            .with({ _tag: "SESpread" }, ({ expr: ex }) => `yield* (${genExpr(ctx, ex)});`)
            .exhaustive(),
        elements,
      ),
    );
    return `_list(function* () {${eq(yields, "") ? "" : ` ${yields} `}})`;
  },
);
const genParam: (p: LamParam) => string = (p: LamParam) =>
  match(p)
    .with({ _tag: "LPName" }, ({ name }) => name)
    .with({ _tag: "LPTuple" }, ({ names }) => `[${_Str_join(", ", names)}]`)
    .with({ _tag: "LPRecord" }, ({ fields }) => `{ ${_Str_join(", ", fields)} }`)
    .with({ _tag: "LPLabeled" }, ({ name }) => name)
    .exhaustive();
const genCallee: _Curry<[ctx: GCtx, e: Expr], string> = _curry(2, (ctx: GCtx, e: Expr) =>
  match(e)
    .with({ _tag: "ELambda" }, () => `(${genExpr(ctx, e)})`)
    .otherwise(() => genExpr(ctx, e)),
);
const genMember: _Curry<[ctx: GCtx, e: Expr], string> = _curry(2, (ctx: GCtx, e: Expr) =>
  match(e)
    .with({ _tag: "ERecord" }, () => `(${genExpr(ctx, e)})`)
    .with({ _tag: "ELambda" }, () => `(${genExpr(ctx, e)})`)
    .otherwise(() => genExpr(ctx, e)),
);
const seqElemExpr: (el: SeqElem) => Expr = (el: SeqElem) =>
  match(el)
    .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
    .with({ _tag: "SESpread" }, ({ expr: e }) => e)
    .exhaustive();
const hasRecur: (e: Expr) => boolean = (e: Expr) =>
  match(e)
    .with({ _tag: "ERecur" }, () => true)
    .with({ _tag: "ELoop" }, () => false)
    .with({ _tag: "ELambda" }, () => false)
    .with({ _tag: "ELetBind" }, () => false)
    .with({ _tag: "EInterp" }, ({ parts }) =>
      someOf(
        (p: InterpPart) =>
          match(p)
            .with({ _tag: "IPExpr" }, ({ expr: x }) => hasRecur(x))
            .with({ _tag: "IPLit" }, () => false)
            .exhaustive(),
        parts,
      ),
    )
    .with({ _tag: "ECall" }, ({ fn, args }) => or(hasRecur(fn), someOf(hasRecur, args)))
    .with({ _tag: "ELetIn" }, ({ value, body }) => or(hasRecur(value), hasRecur(body)))
    .with({ _tag: "EPipe" }, ({ left, right }) => or(hasRecur(left), hasRecur(right)))
    .with({ _tag: "EDo" }, ({ exprs }) => someOf(hasRecur, exprs))
    .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
      or(hasRecur(cond), or(hasRecur(thenE), hasRecur(elseE))),
    )
    .with({ _tag: "EMatch" }, ({ scrutinee, arms }) =>
      or(
        hasRecur(scrutinee),
        someOf(
          (a: MatchArm) =>
            or(
              match(a.guard)
                .with({ _tag: "Some" }, ({ value: g }) => hasRecur(g))
                .with({ _tag: "None" }, () => false)
                .exhaustive(),
              hasRecur(a.body),
            ),
          arms,
        ),
      ),
    )
    .with({ _tag: "ERecord" }, ({ fields, spread }) =>
      or(
        match(spread)
          .with({ _tag: "Some" }, ({ value: sp }) => hasRecur(sp))
          .with({ _tag: "None" }, () => false)
          .exhaustive(),
        someOf((f: Field) => hasRecur(f.value), fields),
      ),
    )
    .with({ _tag: "EField" }, ({ target }) => hasRecur(target))
    .with({ _tag: "ETuple" }, ({ elements }) => someOf(hasRecur, elements))
    .with({ _tag: "EArr" }, ({ elements }) =>
      someOf((el: SeqElem) => hasRecur(seqElemExpr(el)), elements),
    )
    .with({ _tag: "EList" }, ({ elements }) =>
      someOf((el: SeqElem) => hasRecur(seqElemExpr(el)), elements),
    )
    .with({ _tag: "ESet" }, ({ elements }) =>
      someOf((el: SeqElem) => hasRecur(seqElemExpr(el)), elements),
    )
    .with({ _tag: "EMap" }, ({ entries }) =>
      someOf((en: MapEntry) => or(hasRecur(en.key), hasRecur(en.value)), entries),
    )
    .otherwise(() => false);
const loopNeedsStep: (e: Expr) => boolean = (e: Expr) =>
  match(e)
    .with({ _tag: "ETernary" }, ({ thenE, elseE }) =>
      or(loopNeedsStep(thenE), loopNeedsStep(elseE)),
    )
    .with({ _tag: "ELetIn" }, ({ body }) => loopNeedsStep(body))
    .with({ _tag: "EDo" }, ({ exprs }) => loopNeedsStep(lastDoExpr(exprs)))
    .with({ _tag: "EMatch" }, () => hasRecur(e))
    .otherwise(() => false);
const lastDoExpr: (exprs: Expr[]) => Expr = (exprs: Expr[]) =>
  match(exprs)
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 1;
      },
      ([last]) => last,
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length >= 1;
      },
      ([, ...rest]) => lastDoExpr(rest),
    )
    .with(
      (_v) => {
        const _g: any = _v;
        return _g.length === 0;
      },
      () => Ast.EUnit({ start: 0, end: 0 }),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    });
const wrapStepTails: _Curry<[e: Expr, sp: Span], Expr> = _curry(2, (e: Expr, sp: Span) =>
  match(e)
    .with({ _tag: "ERecur" }, () => e)
    .with({ _tag: "ETernary" }, ({ cond, thenE, elseE, span: tsp }) =>
      Ast.ETernary(cond, wrapStepTails(thenE, sp), wrapStepTails(elseE, sp), tsp),
    )
    .with({ _tag: "ELetIn" }, ({ name, nameSpan, value, body, span: lsp }) =>
      Ast.ELetIn(name, nameSpan, value, wrapStepTails(body, sp), lsp),
    )
    .with({ _tag: "EDo" }, ({ exprs, span: dsp }) => Ast.EDo(wrapDoStepTail(exprs, sp), dsp))
    .with({ _tag: "EMatch" }, ({ scrutinee, arms, span: msp }) =>
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
      ),
    )
    .otherwise(() => Ast.ECall(Ast.ERef("_done", sp), [e], None as Option<string>, sp)),
);
const wrapDoStepTail: _Curry<[exprs: Expr[], sp: Span], Expr[]> = _curry(
  2,
  (exprs: Expr[], sp: Span) =>
    match(exprs)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 1;
        },
        ([last]) => [wrapStepTails(last, sp)],
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([first, ...rest]) => [first, ...wrapDoStepTail(rest, sp)],
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => [] as Expr[],
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
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
    match(e)
      .with({ _tag: "ERecur" }, ({ args }) =>
        match(_tuple(params, args))
          .with(
            (_v) => {
              const _g: any = _v;
              return _g[0].length === 1 && _g[1].length === 1;
            },
            ([[p], [a]]) => `${p.name} = ${genExpr(ctx, a)}; continue;`,
          )
          .otherwise(
            () =>
              `[${loopParamNames(params)}] = [${_Str_join(
                ", ",
                map((a: Expr) => genExpr(ctx, a), args),
              )}]; continue;`,
          ),
      )
      .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
        hasRecur(e)
          ? `if (${genExpr(ctx, cond)}) { ${genLoopTail(ctx, thenE, params)} } else { ${genLoopTail(ctx, elseE, params)} }`
          : `return ${genExpr(ctx, e)};`,
      )
      .with({ _tag: "ELetIn" }, ({ name, value, body }) =>
        hasRecur(e)
          ? `{ const ${suffixOr(name, hook1(ctx.annotateLetin, value))} = ${genExpr(ctx, value)}; ${genLoopTail(ctx, body, params)} }`
          : `return ${genExpr(ctx, e)};`,
      )
      .with({ _tag: "EDo" }, ({ exprs }) =>
        hasRecur(e) ? `{ ${genDoLoopTail(ctx, exprs, params)} }` : `return ${genExpr(ctx, e)};`,
      )
      .with({ _tag: "EMatch" }, ({ span: sp }) =>
        hasRecur(e)
          ? ((step: string) =>
              ((rebind: string) =>
                `const _step = ${step}; if (_step._tag === ${jsStringLit("recur")}) { ${rebind} continue; } return _step.value;`)(
                match(params)
                  .with(
                    (_v) => {
                      const _g: any = _v;
                      return _g.length === 1;
                    },
                    ([p]) => `${p.name} = _step.args[0];`,
                  )
                  .otherwise(() => `[${loopParamNames(params)}] = _step.args;`),
              ))(genExpr(ctx, wrapStepTails(e, sp)))
          : `return ${genExpr(ctx, e)};`,
      )
      .otherwise(() => `return ${genExpr(ctx, e)};`),
);
const genDoLoopTail: _Curry<[ctx: GCtx, exprs: Expr[], params: LoopParam[]], string> = _curry(
  3,
  (ctx: GCtx, exprs: Expr[], params: LoopParam[]) =>
    match(exprs)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 1;
        },
        ([last]) => genLoopTail(ctx, last, params),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([first, ...rest]) => `${genExpr(ctx, first)}; ${genDoLoopTail(ctx, rest, params)}`,
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => "return undefined;",
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
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
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => true)
      .with({ _tag: "Some" }, ({ value: p }) =>
        _Set_has(p.name, seen) ? false : loopParamFree(params, add(i, 1), seen),
      )
      .exhaustive(),
  );
const genLambdaBody: _Curry<[ctx: GCtx, e: Expr], string> = _curry(2, (ctx: GCtx, e: Expr) =>
  match(e)
    .with({ _tag: "ERecord" }, () => `(${genExpr(ctx, e)})`)
    .otherwise(() => genExpr(ctx, e)),
);
const paramNames: (p: LamParam) => string[] = (p: LamParam) =>
  match(p)
    .with({ _tag: "LPName" }, ({ name }) => [name])
    .with({ _tag: "LPTuple" }, ({ names }) => names)
    .with({ _tag: "LPRecord" }, ({ fields }) => fields)
    .with({ _tag: "LPLabeled" }, ({ name }) => [name])
    .exhaustive();
const genLabeledFill: _Curry<[ctx: GCtx, labVar: string, lab: LamParam], string> = _curry(
  3,
  (ctx: GCtx, labVar: string, lab: LamParam) =>
    match(lab)
      .with({ _tag: "LPLabeled" }, ({ name, optional, defaultValue }) =>
        ((access: string) =>
          match(defaultValue)
            .with(
              { _tag: "Some" },
              ({ value: d }) =>
                `const ${name} = ${access} != null ? ${access} : ${genExpr(ctx, d)};`,
            )
            .with({ _tag: "None" }, () =>
              optional
                ? `const ${name} = ${access} != null ? { _tag: "Some", value: ${access} } : { _tag: "None" };`
                : `const ${name} = ${access};`,
            )
            .exhaustive())(`(${labVar} ?? {}).${name}`),
      )
      .otherwise(() => ""),
);
const genFillDecls: _Curry<[ctx: GCtx, fills: { labVar: string; labs: LamParam[] }[]], string> =
  _curry(2, (ctx: GCtx, fills: { labVar: string; labs: LamParam[] }[]) =>
    match(fills)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => "",
      )
      .otherwise(
        () =>
          `${_Str_join(
            " ",
            map(
              (g: { labVar: string; labs: LamParam[] }) =>
                _Str_join(
                  " ",
                  map((lab: LamParam) => genLabeledFill(ctx, g.labVar, lab), g.labs),
                ),
              fills,
            ),
          )} `,
      ),
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
                match(lab)
                  .with({ _tag: "LPLabeled" }, ({ name }) => _Set_add(name, s))
                  .otherwise(() => s),
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
    match(_Array_get(i, names))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: n }) => addNames(names, add(i, 1), _Set_add(n, acc)))
      .exhaustive(),
);
const paramNameSet: _Curry<[params: LamParam[], i: number, acc: Set<string>], Set<string>> = _curry(
  3,
  (params: LamParam[], i: number, acc: Set<string>) =>
    match(_Array_get(i, params))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: p }) =>
        paramNameSet(params, add(i, 1), addNames(paramNames(p), 0, acc)),
      )
      .exhaustive(),
);
const letBlockLoop: _Curry<
  [ctx: GCtx, e: Expr, seen: Set<string>, decls: string[]],
  [string[], Expr, Set<string>]
> = _curry(4, (ctx: GCtx, e: Expr, seen: Set<string>, decls: string[]) =>
  match(e)
    .with({ _tag: "ELetIn" }, ({ name, value, body }) =>
      or(
        _Set_has(name, seen),
        match(value)
          .with({ _tag: "ELambda" }, () => false)
          .otherwise(() => _Set_has(name, exprRefs(ctx, value, _Set_fromArray([] as string[])))),
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
          ),
    )
    .otherwise(() => _tuple(decls, e, seen)),
);
const genLambdaBodyIn: _Curry<[ctx: GCtx, e: Expr, bound: Set<string>, prefix: string], string> =
  _curry(4, (ctx: GCtx, e: Expr, bound: Set<string>, prefix: string) =>
    (([decls, rest, seen]: [string[], Expr, Set<string>]) =>
      eq(length(decls), 0)
        ? match(e)
            .with({ _tag: "ELoop" }, ({ params, body }) =>
              loopParamFree(params, 0, bound)
                ? `{ ${prefix}${genLoopBlock(ctx, params, body)} }`
                : eq(prefix, "")
                  ? genLambdaBody(ctx, e)
                  : `{ ${prefix}return ${genLambdaBody(ctx, e)}; }`,
            )
            .otherwise(() =>
              eq(prefix, "")
                ? genLambdaBody(ctx, e)
                : `{ ${prefix}return ${genLambdaBody(ctx, e)}; }`,
            )
        : ((block: string) =>
            match(rest)
              .with({ _tag: "ELoop" }, ({ params, body }) =>
                loopParamFree(params, 0, seen)
                  ? `{ ${prefix}${block} ${genLoopBlock(ctx, params, body)} }`
                  : `{ ${prefix}${block} return ${genExpr(ctx, rest)}; }`,
              )
              .otherwise(() => `{ ${prefix}${block} return ${genExpr(ctx, rest)}; }`))(
            _Str_join(" ", decls),
          ))(letBlockLoop(ctx, e, bound, [] as string[])),
  );
const isCatchAll: (p: Pattern) => boolean = (p: Pattern) =>
  match(p)
    .with({ _tag: "PAs" }, ({ pat }) => isCatchAll(pat))
    .with({ _tag: "PWild" }, () => true)
    .with({ _tag: "PUnit" }, () => true)
    .with({ _tag: "PBind" }, () => true)
    .with({ _tag: "PRecord" }, ({ fields }) => allOf((f: PatField) => isCatchAll(f.pat), fields))
    .with({ _tag: "PTuple" }, ({ elems }) => allOf(isCatchAll, elems))
    .with({ _tag: "PArr" }, ({ elems, rest }) => and(eq(length(elems), 0), _Option_isSome(rest)))
    .with({ _tag: "PList" }, ({ elems, rest }) => and(eq(length(elems), 0), _Option_isSome(rest)))
    .otherwise(() => false);
const isPList: (p: Pattern) => boolean = (p: Pattern) =>
  match(p)
    .with({ _tag: "PList" }, () => true)
    .otherwise(() => false);
const keyedSlot: _Curry<[key: string, sub: string], string> = _curry(
  2,
  (key: string, sub: string) => (eq(sub, key) ? key : `${key}: ${sub}`),
);
const pctorEntries: _Curry<[ctx: GCtx, ctor: string, args: Pattern[], i: number], string[]> =
  _curry(4, (ctx: GCtx, ctor: string, args: Pattern[], i: number) =>
    match(_Array_get(i, args))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: a }) =>
        ((s: string) =>
          ((restEntries: string[]) =>
            eq(s, "")
              ? restEntries
              : _Array_prepend(keyedSlot(keyAt(ctx, ctor, i), s), restEntries))(
            pctorEntries(ctx, ctor, args, add(i, 1)),
          ))(patSlot(ctx, a)),
      )
      .exhaustive(),
  );
const precordEntries: _Curry<[ctx: GCtx, fields: PatField[], i: number], string[]> = _curry(
  3,
  (ctx: GCtx, fields: PatField[], i: number) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: f }) =>
        ((s: string) =>
          ((restEntries: string[]) =>
            eq(s, "") ? restEntries : _Array_prepend(keyedSlot(f.label, s), restEntries))(
            precordEntries(ctx, fields, add(i, 1)),
          ))(patSlot(ctx, f.pat)),
      )
      .exhaustive(),
);
const patSlot: _Curry<[ctx: GCtx, p: Pattern], string> = _curry(2, (ctx: GCtx, p: Pattern) =>
  match(p)
    .with({ _tag: "PAs" }, ({ pat, name }) =>
      ((inner: string) => (eq(inner, "") ? name : `${inner}, ${name}`))(patSlot(ctx, pat)),
    )
    .with({ _tag: "PBind" }, ({ name }) => name)
    .with({ _tag: "PWild" }, () => "")
    .with({ _tag: "PUnit" }, () => "")
    .with({ _tag: "PLit" }, () => "")
    .with({ _tag: "PBool" }, () => "")
    .with({ _tag: "PStr" }, () => "")
    .with({ _tag: "PList" }, () => "")
    .with({ _tag: "PCtor" }, ({ ctor, args }) =>
      ((entries: string[]) => (eq(length(entries), 0) ? "" : `{ ${_Str_join(", ", entries)} }`))(
        pctorEntries(ctx, ctor, args, 0),
      ),
    )
    .with({ _tag: "PRecord" }, ({ fields }) =>
      ((entries: string[]) => (eq(length(entries), 0) ? "" : `{ ${_Str_join(", ", entries)} }`))(
        precordEntries(ctx, fields, 0),
      ),
    )
    .with({ _tag: "PTuple" }, ({ elems }) =>
      ((slots: string[]) =>
        someOf((s: string) => not(eq(s, "")), slots) ? `[${_Str_join(", ", slots)}]` : "")(
        map((el: Pattern) => patSlot(ctx, el), elems),
      ),
    )
    .with({ _tag: "PArr" }, ({ elems, rest }) =>
      ((slots: string[]) =>
        ((slots2: string[]) =>
          someOf((s: string) => not(eq(s, "")), slots2) ? `[${_Str_join(", ", slots2)}]` : "")(
          match(rest)
            .with(
              (
                _v,
              ): _v is Extract<Option<Pattern>, { _tag: "Some" }> & {
                value: Extract<
                  Extract<Option<Pattern>, { _tag: "Some" }>["value"],
                  { _tag: "PBind" }
                >;
              } => {
                const _g: any = _v;
                return _g._tag === "Some" && _g.value._tag === "PBind";
              },
              ({ value: { name } }) => _Array_append(`...${name}`, slots),
            )
            .otherwise(() => slots),
        ))(map((el: Pattern) => patSlot(ctx, el), elems)),
    )
    .with({ _tag: "POr" }, ({ alts }) =>
      match(_Array_head(alts))
        .with({ _tag: "Some" }, ({ value: first }) => patSlot(ctx, first))
        .with({ _tag: "None" }, () => "")
        .exhaustive(),
    )
    .exhaustive(),
);
const pctorConds: _Curry<
  [ctx: GCtx, ctor: string, args: Pattern[], i: number, path: string],
  string[]
> = _curry(5, (ctx: GCtx, ctor: string, args: Pattern[], i: number, path: string) =>
  match(_Array_get(i, args))
    .with({ _tag: "None" }, () => [] as string[])
    .with({ _tag: "Some" }, ({ value: a }) =>
      _Array_concat(
        patConds(ctx, a, `${path}.${keyAt(ctx, ctor, i)}`),
        pctorConds(ctx, ctor, args, add(i, 1), path),
      ),
    )
    .exhaustive(),
);
const precordConds: _Curry<[ctx: GCtx, fields: PatField[], i: number, path: string], string[]> =
  _curry(4, (ctx: GCtx, fields: PatField[], i: number, path: string) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: f }) =>
        _Array_concat(
          patConds(ctx, f.pat, `${path}.${f.label}`),
          precordConds(ctx, fields, add(i, 1), path),
        ),
      )
      .exhaustive(),
  );
const ptupleConds: _Curry<[ctx: GCtx, elems: Pattern[], i: number, path: string], string[]> =
  _curry(4, (ctx: GCtx, elems: Pattern[], i: number, path: string) =>
    match(_Array_get(i, elems))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: el }) =>
        _Array_concat(
          patConds(ctx, el, `${path}[${show(i)}]`),
          ptupleConds(ctx, elems, add(i, 1), path),
        ),
      )
      .exhaustive(),
  );
const parrConds: _Curry<[ctx: GCtx, elems: Pattern[], i: number, path: string], string[]> = _curry(
  4,
  (ctx: GCtx, elems: Pattern[], i: number, path: string) =>
    match(_Array_get(i, elems))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: el }) =>
        _Array_concat(
          patConds(ctx, el, `${path}[${show(i)}]`),
          parrConds(ctx, elems, add(i, 1), path),
        ),
      )
      .exhaustive(),
);
const patConds: _Curry<[ctx: GCtx, p: Pattern, path: string], string[]> = _curry(
  3,
  (ctx: GCtx, p: Pattern, path: string) =>
    match(p)
      .with({ _tag: "PAs" }, ({ pat }) => patConds(ctx, pat, path))
      .with({ _tag: "PWild" }, () => [] as string[])
      .with({ _tag: "PUnit" }, () => [] as string[])
      .with({ _tag: "PBind" }, () => [] as string[])
      .with({ _tag: "PList" }, () => [] as string[])
      .with({ _tag: "PLit" }, () => [`${path} === ${litValue(p)}`])
      .with({ _tag: "PBool" }, () => [`${path} === ${litValue(p)}`])
      .with({ _tag: "PStr" }, () => [`${path} === ${litValue(p)}`])
      .with({ _tag: "PCtor" }, ({ ctor, args }) =>
        _Array_prepend(
          `${path}._tag === ${jsStringLit(ctor)}`,
          pctorConds(ctx, ctor, args, 0, path),
        ),
      )
      .with({ _tag: "PRecord" }, ({ fields }) => precordConds(ctx, fields, 0, path))
      .with({ _tag: "PTuple" }, ({ elems }) => ptupleConds(ctx, elems, 0, path))
      .with({ _tag: "PArr" }, ({ elems, rest }) =>
        _Array_prepend(
          `${path}.length ${_Option_isSome(rest) ? ">=" : "==="} ${show(length(elems))}`,
          parrConds(ctx, elems, 0, path),
        ),
      )
      .with({ _tag: "POr" }, ({ alts }) =>
        ((altCond: (a: Pattern) => string) => [
          _Str_join(
            " || ",
            map((alt: Pattern) => `(${altCond(alt)})`, alts),
          ),
        ])((alt: Pattern) => {
          const conds: string[] = patConds(ctx, alt, path);
          return eq(length(conds), 0)
            ? "true"
            : _Str_join(
                " && ",
                map((c: string) => `(${c})`, conds),
              );
        }),
      )
      .exhaustive(),
);
const catchAllParam: _Curry<[ctx: GCtx, p: Pattern], string> = _curry(2, (ctx: GCtx, p: Pattern) =>
  match(p)
    .with({ _tag: "PArr" }, ({ rest }) =>
      match(rest)
        .with(
          (
            _v,
          ): _v is Extract<Option<Pattern>, { _tag: "Some" }> & {
            value: Extract<Extract<Option<Pattern>, { _tag: "Some" }>["value"], { _tag: "PBind" }>;
          } => {
            const _g: any = _v;
            return _g._tag === "Some" && _g.value._tag === "PBind";
          },
          ({ value: { name } }) => `(${name})`,
        )
        .otherwise(() => "()"),
    )
    .with({ _tag: "PList" }, ({ rest }) =>
      match(rest)
        .with(
          (
            _v,
          ): _v is Extract<Option<Pattern>, { _tag: "Some" }> & {
            value: Extract<Extract<Option<Pattern>, { _tag: "Some" }>["value"], { _tag: "PBind" }>;
          } => {
            const _g: any = _v;
            return _g._tag === "Some" && _g.value._tag === "PBind";
          },
          ({ value: { name } }) => `(${name})`,
        )
        .otherwise(() => "()"),
    )
    .otherwise(() => ((slot: string) => (eq(slot, "") ? "()" : `(${slot})`))(patSlot(ctx, p))),
);
const isListMatch: <A>(arms: ({ pattern: Pattern } & A)[]) => boolean = <A>(
  arms: ({ pattern: Pattern } & A)[],
) =>
  someOf(
    (a: { pattern: Pattern } & A) => and(isPList(a.pattern), not(isCatchAll(a.pattern))),
    arms,
  );
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
    match(_Array_get(i, elems))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: el }) =>
        _Array_concat(patConds(ctx, el, `_b[${show(i)}]`), listArmGuards(ctx, elems, add(i, 1))),
      )
      .exhaustive(),
);
const listArmBinds: _Curry<[ctx: GCtx, elems: Pattern[], i: number], [string[], string[]]> = _curry(
  3,
  (ctx: GCtx, elems: Pattern[], i: number) =>
    match(_Array_get(i, elems))
      .with({ _tag: "None" }, () => _tuple([] as string[], [] as string[]))
      .with({ _tag: "Some" }, ({ value: el }) =>
        (([restParams, restArgs]: [string[], string[]]) => {
          const slot: string = patSlot(ctx, el);
          return eq(slot, "")
            ? _tuple(restParams, restArgs)
            : _tuple(_Array_prepend(slot, restParams), _Array_prepend(`_b[${show(i)}]`, restArgs));
        })(listArmBinds(ctx, elems, add(i, 1))),
      )
      .exhaustive(),
);
const genListArm: _Curry<[ctx: GCtx, p: Pattern, body: Expr], string> = _curry(
  3,
  (ctx: GCtx, p: Pattern, body: Expr) =>
    match(p)
      .with({ _tag: "PList" }, ({ elems, rest }) =>
        ((n: number) =>
          ((guards: string[]) =>
            ((head: string) =>
              ((cond: string) =>
                (([params0, args0]: [string[], string[]]) =>
                  (([params, args]: [string[], string[]]) =>
                    `  if (${cond}) return ((${_Str_join(", ", params)}) => ${genLambdaBody(ctx, body)})(${_Str_join(", ", args)});`)(
                    match(rest)
                      .with(
                        (
                          _v,
                        ): _v is Extract<Option<Pattern>, { _tag: "Some" }> & {
                          value: Extract<
                            Extract<Option<Pattern>, { _tag: "Some" }>["value"],
                            { _tag: "PBind" }
                          >;
                        } => {
                          const _g: any = _v;
                          return _g._tag === "Some" && _g.value._tag === "PBind";
                        },
                        ({ value: { name } }) =>
                          _tuple(_Array_append(name, params0), _Array_append(listTail(n), args0)),
                      )
                      .otherwise(() => _tuple(params0, args0)),
                  ))(listArmBinds(ctx, elems, 0)))(
                _Str_join(" && ", _Array_prepend(head, guards)),
              ))(
              _Option_isSome(rest)
                ? `_pull(${show(n)})`
                : `!_pull(${show(add(n, 1))}) && _b.length === ${show(n)}`,
            ))(listArmGuards(ctx, elems, 0)))(length(elems)),
      )
      .otherwise(() => ""),
);
const listMatchLoop: _Curry<[ctx: GCtx, arms: MatchArm[], i: number], [string[], string]> = _curry(
  3,
  (ctx: GCtx, arms: MatchArm[], i: number) =>
    match(_Array_get(i, arms))
      .with({ _tag: "None" }, () =>
        _tuple([] as string[], '(() => { throw new Error("non-exhaustive lazy-list switch"); })()'),
      )
      .with({ _tag: "Some" }, ({ value: a }) =>
        and(isPList(a.pattern), not(isCatchAll(a.pattern)))
          ? (([restLines, fallback]: [string[], string]) =>
              _tuple(_Array_prepend(genListArm(ctx, a.pattern, a.body), restLines), fallback))(
              listMatchLoop(ctx, arms, add(i, 1)),
            )
          : isCatchAll(a.pattern)
            ? ((restName: Option<string>) =>
                ((fallback: string) => _tuple([] as string[], fallback))(
                  match(restName)
                    .with(
                      { _tag: "Some" },
                      ({ value: name }) =>
                        `((${name}) => ${genLambdaBody(ctx, a.body)})(${listTail(0)})`,
                    )
                    .with({ _tag: "None" }, () => genExpr(ctx, a.body))
                    .exhaustive(),
                ))(
                match(a.pattern)
                  .with(
                    (
                      _v,
                    ): _v is Extract<Pattern, { _tag: "PList" }> & {
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
                    } => {
                      const _g: any = _v;
                      return (
                        _g._tag === "PList" &&
                        _g.rest._tag === "Some" &&
                        _g.rest.value._tag === "PBind"
                      );
                    },
                    ({
                      rest: {
                        value: { name },
                      },
                    }) => Some(name) as Option<string>,
                  )
                  .otherwise(() => None as Option<string>),
              )
            : listMatchLoop(ctx, arms, add(i, 1)),
      )
      .exhaustive(),
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
  match(_Array_get(i, arms))
    .with({ _tag: "None" }, () => _tuple([] as string[], None as Option<[Pattern, Expr]>))
    .with({ _tag: "Some" }, ({ value: a }) =>
      (([restLines, restCatch]: [string[], Option<[Pattern, Expr]>]) =>
        match(a.guard)
          .with({ _tag: "Some" }, ({ value: g }) =>
            _tuple(
              _Array_prepend(
                `  ${genGuardArm(ctx, a.pattern, a.body, Some(g) as Option<Expr>, base)}`,
                restLines,
              ),
              restCatch,
            ),
          )
          .with({ _tag: "None" }, () =>
            isCatchAll(a.pattern)
              ? _tuple(restLines, Some(_tuple(a.pattern, a.body)) as Option<[Pattern, Expr]>)
              : _tuple(
                  _Array_prepend(`  ${genWithArm(ctx, a.pattern, a.body, base)}`, restLines),
                  restCatch,
                ),
          )
          .exhaustive())(matchArmsLoop(ctx, arms, add(i, 1), base)),
    )
    .exhaustive(),
);
/**
 * Any eager-array arm? Decides the ADR 0038 close-out below.
 */
const hasArrArm: <A>(arms: ({ pattern: Pattern } & A)[]) => boolean = <A>(
  arms: ({ pattern: Pattern } & A)[],
) =>
  someOf(
    (a: { pattern: Pattern } & A) =>
      match(a.pattern)
        .with({ _tag: "PArr" }, () => true)
        .otherwise(() => false),
    arms,
  );
const genMatch: _Curry<[ctx: GCtx, scrutinee: Expr, arms: MatchArm[]], string> = _curry(
  3,
  (ctx: GCtx, scrutinee: Expr, arms: MatchArm[]) =>
    isListMatch(arms)
      ? genListMatch(ctx, scrutinee, arms)
      : ((base: Option<string>) =>
          (([armLines, catchAll]: [string[], Option<[Pattern, Expr]>]) => {
            const tail: string = match(catchAll)
              .with(
                (_v): _v is Extract<Option<[Pattern, Expr]>, { _tag: "Some" }> => {
                  const _g: any = _v;
                  return _g._tag === "Some";
                },
                ({ value: [p, body] }) =>
                  `  .otherwise(${catchAllParam(ctx, p)} => ${genLambdaBody(ctx, body)})`,
              )
              .with({ _tag: "None" }, () =>
                and(_Option_isSome(ctx.guardBaseType), hasArrArm(arms))
                  ? '  .otherwise(() => { throw new Error("non-exhaustive match"); })'
                  : "  .exhaustive()",
              )
              .exhaustive();
            return _Str_join(
              "\n",
              _Array_concat(_Array_prepend(`match(${genExpr(ctx, scrutinee)})`, armLines), [tail]),
            );
          })(matchArmsLoop(ctx, arms, 0, base)))(hook1(ctx.guardBaseType, scrutinee)),
);
const litValue: (p: Pattern) => string = (p: Pattern) =>
  match(p)
    .with({ _tag: "PStr" }, ({ value: v }) => jsStringLit(v))
    .with({ _tag: "PLit" }, ({ raw }) => raw)
    .with({ _tag: "PBool" }, ({ value: v }) => (v ? "true" : "false"))
    .otherwise(() => "");
/**
 * A field's refined type when its sub-pattern narrows it, else `None` — a
 * bind/wildcard/literal needs no narrowing and keeps its declared type.
 */
const fieldRefine: _Curry<[ctx: GCtx, p: Pattern, fieldBase: string], Option<string>> = _curry(
  3,
  (ctx: GCtx, p: Pattern, fieldBase: string) =>
    match(p)
      .with({ _tag: "PCtor" }, () => Some(patTarget(ctx, p, fieldBase)) as Option<string>)
      .with({ _tag: "PRecord" }, () =>
        ((t: string) =>
          eq(t, fieldBase) ? (None as Option<string>) : (Some(t) as Option<string>))(
          patTarget(ctx, p, fieldBase),
        ),
      )
      .otherwise(() => None as Option<string>),
);
const ctorRefines: _Curry<
  [ctx: GCtx, args: Pattern[], keys: string[], member: string, i: number],
  string[]
> = _curry(5, (ctx: GCtx, args: Pattern[], keys: string[], member: string, i: number) =>
  match(_Array_get(i, args))
    .with({ _tag: "None" }, () => [] as string[])
    .with({ _tag: "Some" }, ({ value: a }) =>
      ((rest: string[]) =>
        ((key: string) =>
          match(fieldRefine(ctx, a, `${member}[${jsStringLit(key)}]`))
            .with({ _tag: "Some" }, ({ value: sub }) =>
              _Array_prepend(`${jsStringLit(key)}: ${sub}`, rest),
            )
            .with({ _tag: "None" }, () => rest)
            .exhaustive())(_Option_unwrapOr(`_${show(i)}`, _Array_get(i, keys))))(
        ctorRefines(ctx, args, keys, member, add(i, 1)),
      ),
    )
    .exhaustive(),
);
const recordRefines: _Curry<[ctx: GCtx, fields: PatField[], base: string, i: number], string[]> =
  _curry(4, (ctx: GCtx, fields: PatField[], base: string, i: number) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: f }) =>
        ((rest: string[]) =>
          match(fieldRefine(ctx, f.pat, `${base}[${jsStringLit(f.label)}]`))
            .with({ _tag: "Some" }, ({ value: sub }) =>
              _Array_prepend(`${jsStringLit(f.label)}: ${sub}`, rest),
            )
            .with({ _tag: "None" }, () => rest)
            .exhaustive())(recordRefines(ctx, fields, base, add(i, 1))),
      )
      .exhaustive(),
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
    match(_Array_get(i, elems))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: el }) =>
        ((slotBase: string) =>
          _Array_prepend(
            _Option_unwrapOr(slotBase, fieldRefine(ctx, el, slotBase)),
            tupleTargets(ctx, elems, base, add(i, 1)),
          ))(tupleSlotBase(base, i)),
      )
      .exhaustive(),
  );
const tupleRefines: _Curry<[ctx: GCtx, elems: Pattern[], base: string, i: number], boolean> =
  _curry(4, (ctx: GCtx, elems: Pattern[], base: string, i: number) =>
    match(_Array_get(i, elems))
      .with({ _tag: "None" }, () => false)
      .with({ _tag: "Some" }, ({ value: el }) =>
        or(
          _Option_isSome(fieldRefine(ctx, el, tupleSlotBase(base, i))),
          tupleRefines(ctx, elems, base, add(i, 1)),
        ),
      )
      .exhaustive(),
  );
/**
 * Array elements all share one element base (`T[number]`).
 */
const arrTargets: _Curry<[ctx: GCtx, elems: Pattern[], elemBase: string, i: number], string[]> =
  _curry(4, (ctx: GCtx, elems: Pattern[], elemBase: string, i: number) =>
    match(_Array_get(i, elems))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: el }) =>
        _Array_prepend(
          _Option_unwrapOr(elemBase, fieldRefine(ctx, el, elemBase)),
          arrTargets(ctx, elems, elemBase, add(i, 1)),
        ),
      )
      .exhaustive(),
  );
const arrRefines: _Curry<[ctx: GCtx, elems: Pattern[], elemBase: string, i: number], boolean> =
  _curry(4, (ctx: GCtx, elems: Pattern[], elemBase: string, i: number) =>
    match(_Array_get(i, elems))
      .with({ _tag: "None" }, () => false)
      .with({ _tag: "Some" }, ({ value: el }) =>
        or(
          _Option_isSome(fieldRefine(ctx, el, elemBase)),
          arrRefines(ctx, elems, elemBase, add(i, 1)),
        ),
      )
      .exhaustive(),
  );
/**
 * Refine `base` by everything the pattern structurally tests. An or-pattern
 * keeps the base — per-alternative narrowing would need a union target.
 */
const patTarget: _Curry<[ctx: GCtx, p: Pattern, base: string], string> = _curry(
  3,
  (ctx: GCtx, p: Pattern, base: string) =>
    match(p)
      .with({ _tag: "PAs" }, ({ pat }) => patTarget(ctx, pat, base))
      .with({ _tag: "PCtor" }, ({ ctor, args }) =>
        ((member: string) =>
          ((keys: string[]) =>
            ((refines: string[]) =>
              eq(length(refines), 0) ? member : `${member} & { ${_Str_join("; ", refines)} }`)(
              ctorRefines(ctx, args, keys, member, 0),
            ))(_Option_unwrapOr([] as string[], _Map_get(ctor, ctx.keys))))(
          `Extract<${base}, { _tag: ${jsStringLit(ctor)} }>`,
        ),
      )
      .with({ _tag: "PRecord" }, ({ fields }) =>
        ((refines: string[]) =>
          eq(length(refines), 0) ? base : `${base} & { ${_Str_join("; ", refines)} }`)(
          recordRefines(ctx, fields, base, 0),
        ),
      )
      .with({ _tag: "PTuple" }, ({ elems }) =>
        not(tupleRefines(ctx, elems, base, 0))
          ? base
          : `[${_Str_join(", ", tupleTargets(ctx, elems, base, 0))}]`,
      )
      .with({ _tag: "PArr" }, ({ elems, rest: restOpt }) =>
        ((elemBase: string) =>
          not(arrRefines(ctx, elems, elemBase, 0))
            ? base
            : ((heads: string) =>
                match(restOpt)
                  .with({ _tag: "Some" }, () => `[${heads}, ...${base}]`)
                  .with({ _tag: "None" }, () => `[${heads}]`)
                  .exhaustive())(_Str_join(", ", arrTargets(ctx, elems, elemBase, 0))))(
          `(${base})[number]`,
        ),
      )
      .otherwise(() => base),
);
const genGuardArm: _Curry<
  [ctx: GCtx, p: Pattern, body: Expr, guardOpt: Option<Expr>, base: Option<string>],
  string
> = _curry(5, (ctx: GCtx, p: Pattern, body: Expr, guardOpt: Option<Expr>, base: Option<string>) => {
  const root: string = _Option_isSome(base) ? "_g" : "_v";
  const conds0: string[] = patConds(ctx, p, root);
  const slot: string = match(p)
    .with({ _tag: "PAs" }, ({ pat }) => patSlot(ctx, pat))
    .otherwise(() => patSlot(ctx, p));
  const conds: string[] = match(guardOpt)
    .with({ _tag: "Some" }, ({ value: g }) =>
      match(p)
        .with({ _tag: "PAs" }, ({ name }) =>
          _Array_append(
            eq(slot, "")
              ? `((${name}) => ${genExpr(ctx, g)})(${root})`
              : `((${name}) => ((${slot}) => ${genExpr(ctx, g)})(${name}))(${root})`,
            conds0,
          ),
        )
        .otherwise(() =>
          _Array_append(
            eq(slot, "") ? `(${genExpr(ctx, g)})` : `((${slot}) => ${genExpr(ctx, g)})(${root})`,
            conds0,
          ),
        ),
    )
    .with({ _tag: "None" }, () => conds0)
    .exhaustive();
  const test: string = eq(length(conds), 0) ? "true" : _Str_join(" && ", conds);
  const handler: string = match(p)
    .with(
      { _tag: "PAs" },
      ({ name }) =>
        `(${name}) => ${eq(slot, "") ? genLambdaBody(ctx, body) : `((${slot}) => ${genLambdaBody(ctx, body)})(${name})`}`,
    )
    .otherwise(() => `${eq(slot, "") ? "()" : `(${slot})`} => ${genLambdaBody(ctx, body)}`);
  return match(base)
    .with({ _tag: "None" }, () => `.with((_v) => ${test}, ${handler})`)
    .with({ _tag: "Some" }, ({ value: b }) =>
      ((target: string) =>
        eq(target, b)
          ? `.with((_v) => { const _g: any = _v; return ${test}; }, ${handler})`
          : `.with((_v): _v is ${target} => { const _g: any = _v; return ${test}; }, ${handler})`)(
        patTarget(ctx, p, b),
      ),
    )
    .exhaustive();
});
const isFlatSub: (p: Pattern) => boolean = (p: Pattern) =>
  match(p)
    .with({ _tag: "PAs" }, () => false)
    .with({ _tag: "PBind" }, () => true)
    .with({ _tag: "PWild" }, () => true)
    .with({ _tag: "PLit" }, () => true)
    .with({ _tag: "PBool" }, () => true)
    .with({ _tag: "PStr" }, () => true)
    .otherwise(() => false);
const recordLits: <A>(fields: ({ pat: Pattern; label: string } & A)[], i: number) => string[] =
  _curry(2, <A>(fields: ({ pat: Pattern; label: string } & A)[], i: number) =>
    match(_Array_get(i, fields))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: f }) =>
        ((rest: string[]) =>
          match(f.pat)
            .with({ _tag: "PLit" }, () => _Array_prepend(`${f.label}: ${litValue(f.pat)}`, rest))
            .with({ _tag: "PBool" }, () => _Array_prepend(`${f.label}: ${litValue(f.pat)}`, rest))
            .with({ _tag: "PStr" }, () => _Array_prepend(`${f.label}: ${litValue(f.pat)}`, rest))
            .otherwise(() => rest))(recordLits(fields, add(i, 1))),
      )
      .exhaustive(),
  );
const ctorArgParts: _Curry<
  [ctx: GCtx, ctor: string, args: Pattern[], i: number],
  [string[], string[]]
> = _curry(4, (ctx: GCtx, ctor: string, args: Pattern[], i: number) =>
  match(_Array_get(i, args))
    .with({ _tag: "None" }, () => _tuple([] as string[], [] as string[]))
    .with({ _tag: "Some" }, ({ value: a }) =>
      (([restBinds, restLits]: [string[], string[]]) => {
        const key: string = keyAt(ctx, ctor, i);
        return match(a)
          .with({ _tag: "PBind" }, ({ name }) =>
            _tuple(_Array_prepend(keyedSlot(key, name), restBinds), restLits),
          )
          .with({ _tag: "PLit" }, () =>
            _tuple(restBinds, _Array_prepend(`${key}: ${litValue(a)}`, restLits)),
          )
          .with({ _tag: "PBool" }, () =>
            _tuple(restBinds, _Array_prepend(`${key}: ${litValue(a)}`, restLits)),
          )
          .with({ _tag: "PStr" }, () =>
            _tuple(restBinds, _Array_prepend(`${key}: ${litValue(a)}`, restLits)),
          )
          .otherwise(() => _tuple(restBinds, restLits));
      })(ctorArgParts(ctx, ctor, args, add(i, 1))),
    )
    .exhaustive(),
);
const genWithArm: _Curry<[ctx: GCtx, p: Pattern, body: Expr, base: Option<string>], string> =
  _curry(4, (ctx: GCtx, p: Pattern, body: Expr, base: Option<string>) =>
    match(p)
      .with({ _tag: "PAs" }, () => genGuardArm(ctx, p, body, None as Option<Expr>, base))
      .with({ _tag: "PArr" }, () => genGuardArm(ctx, p, body, None as Option<Expr>, base))
      .with({ _tag: "PTuple" }, () => genGuardArm(ctx, p, body, None as Option<Expr>, base))
      .with({ _tag: "POr" }, () => genGuardArm(ctx, p, body, None as Option<Expr>, base))
      .with({ _tag: "PLit" }, () => `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`)
      .with({ _tag: "PBool" }, () => `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`)
      .with({ _tag: "PStr" }, () => `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`)
      .with({ _tag: "PRecord" }, ({ fields }) =>
        allOf((f: PatField) => isFlatSub(f.pat), fields)
          ? ((lits: string[]) =>
              ((slot: string) =>
                `.with({ ${_Str_join(", ", lits)} }, ${eq(slot, "") ? "()" : `(${slot})`} => ${genLambdaBody(ctx, body)})`)(
                patSlot(ctx, p),
              ))(recordLits(fields, 0))
          : genGuardArm(ctx, p, body, None as Option<Expr>, base),
      )
      .with({ _tag: "PCtor" }, ({ ctor, args }) =>
        allOf(isFlatSub, args)
          ? (([binds, litFields]: [string[], string[]]) => {
              const patObj: string = _Str_join(
                ", ",
                _Array_prepend(`_tag: ${jsStringLit(ctor)}`, litFields),
              );
              const param: string = eq(length(binds), 0) ? "()" : `({ ${_Str_join(", ", binds)} })`;
              return `.with({ ${patObj} }, ${param} => ${genLambdaBody(ctx, body)})`;
            })(ctorArgParts(ctx, ctor, args, 0))
          : genGuardArm(ctx, p, body, None as Option<Expr>, base),
      )
      .otherwise(() => genGuardArm(ctx, p, body, None as Option<Expr>, base)),
  );
/**
 * `k0: T0, k1: T1` — a typed factory's parameter list.
 */
const typedCtorParams: _Curry<[keys: string[], paramTypes: string[], i: number], string[]> = _curry(
  3,
  (keys: string[], paramTypes: string[], i: number) =>
    match(_Array_get(i, keys))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: k }) =>
        _Array_prepend(
          `${k}: ${_Option_unwrapOr("unknown", _Array_get(i, paramTypes))}`,
          typedCtorParams(keys, paramTypes, add(i, 1)),
        ),
      )
      .exhaustive(),
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
    return eq(length(c.fields), 0)
      ? match(ts)
          .with(
            { _tag: "Some" },
            ({ value: t }) => `const ${c.name}: ${t.retMono} = { _tag: ${tag} };`,
          )
          .with({ _tag: "None" }, () => `const ${c.name} = { _tag: ${tag} };`)
          .exhaustive()
      : ((keys: string[]) =>
          ((params: string) =>
            ((impl: string) =>
              gte(length(c.fields), 2)
                ? ((curried: string) =>
                    match(ts)
                      .with(
                        { _tag: "Some" },
                        ({ value: t }) =>
                          `const ${c.name} = ${curried} as ${t.generics}(${_Str_join(", ", typedCtorParams(keys, t.paramTypes, 0))}) => ${t.ret};`,
                      )
                      .with({ _tag: "None" }, () => `const ${c.name} = ${curried};`)
                      .exhaustive())(`_curry(${show(length(c.fields))}, ${impl})`)
                : match(ts)
                    .with(
                      { _tag: "Some" },
                      ({ value: t }) =>
                        `const ${c.name} = ${t.generics}(${_Str_join(", ", typedCtorParams(keys, t.paramTypes, 0))}): ${t.ret} => ({ _tag: ${tag}, ${params} });`,
                    )
                    .with({ _tag: "None" }, () => `const ${c.name} = ${impl};`)
                    .exhaustive())(`(${params}) => ({ _tag: ${tag}, ${params} })`))(
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
    match(_Array_get(i, ctors))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: c }) =>
        ((rest: string[]) =>
          or(exported, _Set_has(c.name, refs))
            ? _Array_prepend(genCtor(c, hook2(h, s, c)), rest)
            : rest)(genCtorsFrom(s, ctors, h, refs, exported, add(i, 1))),
      )
      .exhaustive(),
);
const genType: _Curry<[ctx: GCtx, s: Stmt], string> = _curry(2, (ctx: GCtx, s: Stmt) =>
  match(s)
    .with({ _tag: "SType" }, ({ ctors, exported }) =>
      _Str_join("\n", genCtorsFrom(s, ctors, ctx.annotateCtor, ctx.valueRefs, exported, 0)),
    )
    .otherwise(() => ""),
);
/**
 * Top-level arrow spine length (`a -> b -> c` → 2).
 */
const typeExprArity: (te: TypeExpr) => number = (te: TypeExpr) =>
  match(te)
    .with({ _tag: "TyArrow" }, ({ to }) => add(1, typeExprArity(to)))
    .otherwise(() => 0);
/**
 * `$a0, $a1, …` — must stay byte-for-byte aligned with TS codegen.
 */
const externArgs: (n: number) => string = (n: number) => {
  let i: number = 0;
  let acc: string = "";
  while (true) {
    if (gte(i, n)) {
      return acc;
    } else {
      [i, acc] = [add(i, 1), eq(acc, "") ? `$a${show(i)}` : `${acc}, $a${show(i)}`];
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
    if (gte(i, n)) {
      return acc;
    } else {
      [i, acc] = [add(i, 1), `${acc}($a${show(i)})`];
      continue;
    }
  }
};
/**
 * extern → ESM import. Arity ≥ 2 wraps the host in `_curry` (ADR 0005 / #24).
 * `imported == "default"` emits a default import (ADR 0009 / styled-cva).
 */
const genExtern: (s: Stmt) => string = (s: Stmt) =>
  match(s)
    .with({ _tag: "SExtern" }, ({ name, typeExpr, module: modName, imported, curried }) =>
      _Str_startsWith("mochi:global:", modName)
        ? ((target: string) =>
            ((base: string) =>
              `const ${name} = ${eq(imported, "") ? base : `${base}[${jsStringLit(imported)}]`};`)(
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
                      not(eq(imported, ""))
                        ? ((raw: string) =>
                            ((importLine: string) =>
                              ((ctor: string) =>
                                eq(arity, 0)
                                  ? `${importLine}
const ${name} = () => ${ctor};`
                                  : `${importLine}
const ${name} = _curry(${show(arity)}, (${args}) => ${ctor});`)(`new ${raw}(${args})`))(
                              `import { ${imported} as ${raw} } from ${jsStringLit(target)};`,
                            ))(_Str_concat("$", name))
                        : eq(arity, 0)
                          ? `const ${name} = () => new globalThis[${jsStringLit(target)}]();`
                          : `const ${name} = _curry(${show(arity)}, (${args}) => new globalThis[${jsStringLit(target)}](${args}));`)(
                      externArgs(arity),
                    ))(typeExprArity(typeExpr)))(_Str_slice(10, _Str_length(modName), modName))
              : _Str_startsWith("mochi:send:", modName)
                ? ((target: string) =>
                    ((arity: number) =>
                      ((args: string) =>
                        ((fn: string) =>
                          lt(arity, 2)
                            ? `const ${name} = ${fn};`
                            : `const ${name} = _curry(${show(arity)}, ${fn});`)(
                          eq(args, "")
                            ? `($receiver) => $receiver[${jsStringLit(target)}]()`
                            : `($receiver, ${args}) => $receiver[${jsStringLit(target)}](${args})`,
                        ))(externArgs(sub(arity, 1))))(typeExprArity(typeExpr)))(
                    _Str_slice(11, _Str_length(modName), modName),
                  )
                : eq(imported, "default")
                  ? `import ${name} from ${jsStringLit(modName)};`
                  : ((arity: number) =>
                      lte(arity, 1)
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
                            ))(_Str_concat("$", name)))(typeExprArity(typeExpr)),
    )
    .otherwise(() => "");
const stripAlExt: (s: string) => string = (s: string) =>
  _Str_endsWith(".mochi", s) ? _Str_slice(0, sub(_Str_length(s), 6), s) : s;
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
  match(s)
    .with({ _tag: "SImport" }, ({ names, from }) =>
      ((nameList: string) =>
        ((path: string) => `import { ${nameList} } from ${jsStringLit(path)};`)(
          rewriteImportPath(from, ext),
        ))(
        _Str_join(
          ", ",
          map((n: Name) => n.name, names),
        ),
      ),
    )
    .with({ _tag: "SImportNs" }, ({ alias, from }) =>
      ((path: string) => `import * as ${alias.name} from ${jsStringLit(path)};`)(
        rewriteImportPath(from, ext),
      ),
    )
    .otherwise(() => ""),
);
const exportLine: (l: string) => string = (l: string) => `export ${l}`;
const jsDocLine: (l: string) => string = (l: string) =>
  gt(_Str_length(l), 0) ? ` * ${_Str_replace("*/", "*\\/", l)}` : " *";
export const jsDoc: (docOpt: Option<string>) => string = (docOpt: Option<string>) =>
  match(docOpt)
    .with({ _tag: "None" }, () => "")
    .with({ _tag: "Some" }, ({ value: doc }) =>
      ((lines: string[]) => `/**
${_Str_join("\n", lines)}
 */
`)(map(jsDocLine, _Str_split("\n", doc))),
    )
    .exhaustive();
const genStmt: _Curry<[ctx: GCtx, s: Stmt], string> = _curry(2, (ctx: GCtx, s: Stmt) =>
  match(s)
    .with(
      { _tag: "SError" },
      ({ span: sp }) =>
        `throw new Error("codegen invariant: error node reached codegen at ${show(sp.start)}");`,
    )
    .with({ _tag: "SImport" }, () => genImport(s, ctx.moduleExt))
    .with({ _tag: "SImportNs" }, () => genImport(s, ctx.moduleExt))
    .with({ _tag: "SType" }, ({ exported }) =>
      ((decls: string) =>
        eq(decls, "")
          ? ""
          : exported
            ? _Str_join("\n", map(exportLine, _Str_split("\n", decls)))
            : decls)(genType(ctx, s)),
    )
    .with({ _tag: "SExtern" }, ({ name, exported, doc }) =>
      ((docComment: string) =>
        exported
          ? `${docComment}${genExtern(s)}
export { ${name} };`
          : `${docComment}${genExtern(s)}`)(ctx.docs ? jsDoc(doc) : ""),
    )
    .with({ _tag: "SLet" }, ({ name, value, exported, doc }) =>
      ((doExport: boolean) =>
        ((docComment: string) =>
          `${docComment}${doExport ? "export " : ""}const ${name}${_Option_unwrapOr("", hook2(ctx.annotateLet, name, value))} = ${genExpr(ctx, value)};`)(
          and(ctx.docs, not(_Str_startsWith("$", name))) ? jsDoc(doc) : "",
        ))(and(exported, not(_Str_startsWith("$", name)))),
    )
    .with({ _tag: "SExpr" }, ({ value }) => `${genExpr(ctx, value)};`)
    .exhaustive(),
);
const usesMatchLibArm: (a: MatchArm) => boolean = (a: MatchArm) =>
  or(
    match(a.guard)
      .with({ _tag: "Some" }, ({ value: g }) => usesMatchLib(g))
      .with({ _tag: "None" }, () => false)
      .exhaustive(),
    usesMatchLib(a.body),
  );
const usesMatchLib: (e: Expr) => boolean = (e: Expr) =>
  match(e)
    .with({ _tag: "ENum" }, () => false)
    .with({ _tag: "EUnit" }, () => false)
    .with({ _tag: "EBool" }, () => false)
    .with({ _tag: "EStr" }, () => false)
    .with({ _tag: "ERef" }, () => false)
    .with({ _tag: "ECall" }, ({ fn, args }) => or(usesMatchLib(fn), someOf(usesMatchLib, args)))
    .with({ _tag: "ELambda" }, ({ body }) => usesMatchLib(body))
    .with({ _tag: "ELetIn" }, ({ value, body }) => or(usesMatchLib(value), usesMatchLib(body)))
    .with({ _tag: "ELetBind" }, ({ value, body }) => or(usesMatchLib(value), usesMatchLib(body)))
    .with({ _tag: "EPipe" }, ({ left, right }) => or(usesMatchLib(left), usesMatchLib(right)))
    .with({ _tag: "EDo" }, ({ exprs }) => someOf(usesMatchLib, exprs))
    .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
      or(usesMatchLib(cond), or(usesMatchLib(thenE), usesMatchLib(elseE))),
    )
    .with({ _tag: "EMatch" }, ({ scrutinee, arms }) =>
      or(not(isListMatch(arms)), or(usesMatchLib(scrutinee), someOf(usesMatchLibArm, arms))),
    )
    .with({ _tag: "ELoop" }, ({ params, body }) =>
      or(
        someOf((p: LoopParam) => usesMatchLib(p.init), params),
        usesMatchLib(body),
      ),
    )
    .with({ _tag: "ERecur" }, ({ args }) => someOf(usesMatchLib, args))
    .with({ _tag: "ERecord" }, ({ fields, spread }) =>
      or(
        match(spread)
          .with({ _tag: "Some" }, ({ value: s }) => usesMatchLib(s))
          .with({ _tag: "None" }, () => false)
          .exhaustive(),
        someOf((f: Field) => usesMatchLib(f.value), fields),
      ),
    )
    .with({ _tag: "EField" }, ({ target }) => usesMatchLib(target))
    .with({ _tag: "ETuple" }, ({ elements }) => someOf(usesMatchLib, elements))
    .with({ _tag: "EArr" }, ({ elements }) =>
      someOf(
        (el: SeqElem) =>
          usesMatchLib(
            match(el)
              .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
              .with({ _tag: "SESpread" }, ({ expr: e }) => e)
              .exhaustive(),
          ),
        elements,
      ),
    )
    .with({ _tag: "EList" }, ({ elements }) =>
      someOf(
        (el: SeqElem) =>
          usesMatchLib(
            match(el)
              .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
              .with({ _tag: "SESpread" }, ({ expr: e }) => e)
              .exhaustive(),
          ),
        elements,
      ),
    )
    .with({ _tag: "ESet" }, ({ elements }) =>
      someOf(
        (el: SeqElem) =>
          usesMatchLib(
            match(el)
              .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
              .with({ _tag: "SESpread" }, ({ expr: e }) => e)
              .exhaustive(),
          ),
        elements,
      ),
    )
    .with({ _tag: "EMap" }, ({ entries }) =>
      someOf((en: MapEntry) => or(usesMatchLib(en.key), usesMatchLib(en.value)), entries),
    )
    .with({ _tag: "EInterp" }, ({ parts }) =>
      someOf(
        (p: InterpPart) =>
          match(p)
            .with({ _tag: "IPLit" }, () => false)
            .with({ _tag: "IPExpr" }, ({ expr: ex }) => usesMatchLib(ex))
            .exhaustive(),
        parts,
      ),
    )
    .exhaustive();
const loopInitRefsFrom: _Curry<
  [ctx: GCtx, params: LoopParam[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, params: LoopParam[], i: number, acc: Set<string>) =>
  match(_Array_get(i, params))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: p }) =>
      loopInitRefsFrom(ctx, params, add(i, 1), exprRefs(ctx, p.init, acc)),
    )
    .exhaustive(),
);
const exprRefsListFrom: _Curry<
  [ctx: GCtx, xs: Expr[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, xs: Expr[], i: number, acc: Set<string>) =>
  match(_Array_get(i, xs))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: x }) =>
      exprRefsListFrom(ctx, xs, add(i, 1), exprRefs(ctx, x, acc)),
    )
    .exhaustive(),
);
const exprRefsInterpPartsFrom: _Curry<
  [ctx: GCtx, parts: InterpPart[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, parts: InterpPart[], i: number, acc: Set<string>) =>
  match(_Array_get(i, parts))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: p }) =>
      exprRefsInterpPartsFrom(
        ctx,
        parts,
        add(i, 1),
        match(p)
          .with({ _tag: "IPLit" }, () => acc)
          .with({ _tag: "IPExpr" }, ({ expr: ex }) => exprRefs(ctx, ex, acc))
          .exhaustive(),
      ),
    )
    .exhaustive(),
);
const exprRefsArmsFrom: _Curry<
  [ctx: GCtx, arms: MatchArm[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, arms: MatchArm[], i: number, acc: Set<string>) =>
  match(_Array_get(i, arms))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: a }) =>
      ((acc1: Set<string>) => exprRefsArmsFrom(ctx, arms, add(i, 1), exprRefs(ctx, a.body, acc1)))(
        match(a.guard)
          .with({ _tag: "Some" }, ({ value: g }) => exprRefs(ctx, g, acc))
          .with({ _tag: "None" }, () => acc)
          .exhaustive(),
      ),
    )
    .exhaustive(),
);
const exprRefsFieldsFrom: _Curry<
  [ctx: GCtx, fields: Field[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, fields: Field[], i: number, acc: Set<string>) =>
  match(_Array_get(i, fields))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: f }) =>
      exprRefsFieldsFrom(ctx, fields, add(i, 1), exprRefs(ctx, f.value, acc)),
    )
    .exhaustive(),
);
const exprRefsEntriesFrom: _Curry<
  [ctx: GCtx, entries: MapEntry[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, entries: MapEntry[], i: number, acc: Set<string>) =>
  match(_Array_get(i, entries))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: en }) =>
      exprRefsEntriesFrom(
        ctx,
        entries,
        add(i, 1),
        exprRefs(ctx, en.value, exprRefs(ctx, en.key, acc)),
      ),
    )
    .exhaustive(),
);
const exprRefs: _Curry<[ctx: GCtx, e: Expr, acc: Set<string>], Set<string>> = _curry(
  3,
  (ctx: GCtx, e: Expr, acc: Set<string>) =>
    match(e)
      .with({ _tag: "ENum" }, () => acc)
      .with({ _tag: "EUnit" }, () => acc)
      .with({ _tag: "EBool" }, () => acc)
      .with({ _tag: "EStr" }, () => acc)
      .with({ _tag: "ERef" }, ({ name }) => _Set_add(name, acc))
      .with({ _tag: "ECall" }, ({ fn, args }) =>
        exprRefsListFrom(ctx, args, 0, exprRefs(ctx, fn, acc)),
      )
      .with({ _tag: "ELambda" }, ({ params, body }) =>
        (([cparams, cbody, fills]: [LamParam[], Expr, { labs: LamParam[]; labVar: string }[]]) => {
          const acc2: Set<string> = gte(length(cparams), 2) ? _Set_add("_curry", acc) : acc;
          const acc3: Set<string> = reduce(
            _curry(2, (a: Set<string>, g: { labs: LamParam[]; labVar: string }) =>
              reduce(
                _curry(2, (b: Set<string>, lab: LamParam) =>
                  match(lab)
                    .with(
                      (
                        _v,
                      ): _v is Extract<LamParam, { _tag: "LPLabeled" }> & {
                        defaultValue: Extract<
                          Extract<LamParam, { _tag: "LPLabeled" }>["defaultValue"],
                          { _tag: "Some" }
                        >;
                      } => {
                        const _g: any = _v;
                        return _g._tag === "LPLabeled" && _g.defaultValue._tag === "Some";
                      },
                      ({ defaultValue: { value: d } }) => exprRefs(ctx, d, b),
                    )
                    .otherwise(() => b),
                ),
                a,
                g.labs,
              ),
            ),
            acc2,
            fills,
          );
          return exprRefs(ctx, cbody, acc3);
        })(collapseLambda(params, body)),
      )
      .with({ _tag: "ELetIn" }, ({ value, body }) => exprRefs(ctx, body, exprRefs(ctx, value, acc)))
      .with({ _tag: "ELetBind" }, ({ monad, value, body }) =>
        exprRefs(ctx, body, exprRefs(ctx, value, _Set_add(bindRuntime(monad), acc))),
      )
      .with({ _tag: "EPipe" }, ({ left, right }) => exprRefs(ctx, right, exprRefs(ctx, left, acc)))
      .with({ _tag: "EDo" }, ({ exprs }) => exprRefsListFrom(ctx, exprs, 0, acc))
      .with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) =>
        exprRefs(ctx, elseE, exprRefs(ctx, thenE, exprRefs(ctx, cond, acc))),
      )
      .with({ _tag: "EMatch" }, ({ scrutinee, arms }) =>
        ((acc1: Set<string>) =>
          ((acc2: Set<string>) => exprRefsArmsFrom(ctx, arms, 0, acc2))(
            someOf(
              (a: MatchArm) =>
                match(a.pattern)
                  .with(
                    (
                      _v,
                    ): _v is Extract<Pattern, { _tag: "PList" }> & {
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
                    } => {
                      const _g: any = _v;
                      return (
                        _g._tag === "PList" &&
                        _g.rest._tag === "Some" &&
                        _g.rest.value._tag === "PBind"
                      );
                    },
                    () => true,
                  )
                  .otherwise(() => false),
              arms,
            )
              ? _Set_add("_list", acc1)
              : acc1,
          ))(exprRefs(ctx, scrutinee, acc)),
      )
      .with({ _tag: "ERecord" }, ({ fields, spread }) =>
        exprRefsFieldsFrom(
          ctx,
          fields,
          0,
          match(spread)
            .with({ _tag: "Some" }, ({ value: s }) => exprRefs(ctx, s, acc))
            .with({ _tag: "None" }, () => acc)
            .exhaustive(),
        ),
      )
      .with({ _tag: "EField" }, ({ target, name }) =>
        match(emptyNsEmit(target, name, None as Option<string>))
          .with({ _tag: "Some" }, () =>
            match(target)
              .with({ _tag: "ERef", name: "List" }, () => _Set_add("_list", acc))
              .otherwise(() => acc),
          )
          .with({ _tag: "None" }, () =>
            match(nsRuntimeId(ctx, target, name))
              .with({ _tag: "Some" }, ({ value: rt }) => _Set_add(rt, acc))
              .with({ _tag: "None" }, () => exprRefs(ctx, target, acc))
              .exhaustive(),
          )
          .exhaustive(),
      )
      .with({ _tag: "ELoop" }, ({ params, body }) =>
        ((acc1: Set<string>) =>
          ((acc2: Set<string>) => exprRefs(ctx, body, acc2))(
            loopInitRefsFrom(ctx, params, 0, acc1),
          ))(loopNeedsStep(body) ? _Set_add("_recur", _Set_add("_done", acc)) : acc),
      )
      .with({ _tag: "ERecur" }, ({ args }) => exprRefsListFrom(ctx, args, 0, acc))
      .with({ _tag: "ETuple" }, ({ elements }) => exprRefsListFrom(ctx, elements, 0, acc))
      .with({ _tag: "EArr" }, ({ elements }) =>
        exprRefsListFrom(
          ctx,
          map(
            (el: SeqElem) =>
              match(el)
                .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
                .with({ _tag: "SESpread" }, ({ expr: e }) => e)
                .exhaustive(),
            elements,
          ),
          0,
          acc,
        ),
      )
      .with({ _tag: "EList" }, ({ elements }) =>
        exprRefsListFrom(
          ctx,
          map(
            (el: SeqElem) =>
              match(el)
                .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
                .with({ _tag: "SESpread" }, ({ expr: e }) => e)
                .exhaustive(),
            elements,
          ),
          0,
          _Set_add("_list", acc),
        ),
      )
      .with({ _tag: "ESet" }, ({ elements }) =>
        exprRefsListFrom(
          ctx,
          map(
            (el: SeqElem) =>
              match(el)
                .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
                .with({ _tag: "SESpread" }, ({ expr: e }) => e)
                .exhaustive(),
            elements,
          ),
          0,
          acc,
        ),
      )
      .with({ _tag: "EMap" }, ({ entries }) => exprRefsEntriesFrom(ctx, entries, 0, acc))
      .with({ _tag: "EInterp" }, ({ parts }) => exprRefsInterpPartsFrom(ctx, parts, 0, acc))
      .exhaustive(),
);
const boundNamesFrom: _Curry<[stmts: Stmt[], i: number, acc: Set<string>], Set<string>> = _curry(
  3,
  (stmts: Stmt[], i: number, acc: Set<string>) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: s }) =>
        boundNamesFrom(
          stmts,
          add(i, 1),
          match(s)
            .with({ _tag: "SLet" }, ({ name }) => _Set_add(name, acc))
            .with({ _tag: "SExtern" }, ({ name }) => _Set_add(name, acc))
            .with({ _tag: "SType" }, ({ ctors }) =>
              _Set_union(acc, _Set_fromArray(map((c: CtorLike) => c.name, ctors))),
            )
            .with({ _tag: "SImport" }, ({ names }) =>
              _Set_union(acc, _Set_fromArray(map((n: Name) => n.name, names))),
            )
            .with({ _tag: "SImportNs" }, ({ alias }) => _Set_add(alias.name, acc))
            .with({ _tag: "SError" }, () => acc)
            .with({ _tag: "SExpr" }, () => acc)
            .exhaustive(),
        ),
      )
      .exhaustive(),
);
const boundNames: (stmts: Stmt[]) => Set<string> = (stmts: Stmt[]) =>
  boundNamesFrom(stmts, 0, _Set_fromArray([] as string[]));
/**
 * Names referenced in let/expr values — not patterns. `| TLet =>` does not
 * count, so a local unused ctor factory can be dropped.
 */
const collectValueRefs: _Curry<
  [ctx: GCtx, stmts: Stmt[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, stmts: Stmt[], i: number, acc: Set<string>) =>
  match(_Array_get(i, stmts))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: s }) =>
      collectValueRefs(
        ctx,
        stmts,
        add(i, 1),
        match(s)
          .with({ _tag: "SLet" }, ({ value }) => exprRefs(ctx, value, acc))
          .with({ _tag: "SExpr" }, ({ value }) => exprRefs(ctx, value, acc))
          .otherwise(() => acc),
      ),
    )
    .exhaustive(),
);
const refsForStmt: _Curry<[ctx: GCtx, s: Stmt], Set<string>> = _curry(2, (ctx: GCtx, s: Stmt) =>
  match(s)
    .with({ _tag: "SLet" }, ({ value }) => exprRefs(ctx, value, _Set_fromArray([] as string[])))
    .with({ _tag: "SExpr" }, ({ value }) => exprRefs(ctx, value, _Set_fromArray([] as string[])))
    .with({ _tag: "SType" }, ({ ctors, exported }) =>
      someOf(
        (c: CtorLike) =>
          and(gte(length(c.fields), 2), or(exported, _Set_has(c.name, ctx.valueRefs))),
        ctors,
      )
        ? _Set_add("_curry", _Set_fromArray([] as string[]))
        : _Set_fromArray([] as string[]),
    )
    .with({ _tag: "SExtern" }, ({ typeExpr }) =>
      gte(typeExprArity(typeExpr), 2)
        ? _Set_add("_curry", _Set_fromArray([] as string[]))
        : _Set_fromArray([] as string[]),
    )
    .otherwise(() => _Set_fromArray([] as string[])),
);
const collectRefsFrom: _Curry<
  [ctx: GCtx, stmts: Stmt[], i: number, acc: Set<string>],
  Set<string>
> = _curry(4, (ctx: GCtx, stmts: Stmt[], i: number, acc: Set<string>) =>
  match(_Array_get(i, stmts))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: s }) =>
      collectRefsFrom(ctx, stmts, add(i, 1), _Set_union(acc, refsForStmt(ctx, s))),
    )
    .exhaustive(),
);
const addDepsFrom: <A>(deps: A[], j: number, refs: Set<A>, queue: A[]) => [Set<A>, A[]] = _curry(
  4,
  <A>(deps: A[], j: number, refs: Set<A>, queue: A[]) =>
    match(_Array_get(j, deps))
      .with({ _tag: "None" }, () => _tuple(refs, queue))
      .with({ _tag: "Some" }, ({ value: d }) =>
        _Set_has(d, refs)
          ? addDepsFrom(deps, add(j, 1), refs, queue)
          : addDepsFrom(deps, add(j, 1), _Set_add(d, refs), _Array_append(d, queue)),
      )
      .exhaustive(),
);
const closeRefsFrom: <A>(queue: A[], i: number, refs: Set<A>, runtimeDeps: Map<A, A[]>) => Set<A> =
  _curry(4, <A>(queue: A[], i: number, refs: Set<A>, runtimeDeps: Map<A, A[]>) =>
    match(_Array_get(i, queue))
      .with({ _tag: "None" }, () => refs)
      .with({ _tag: "Some" }, ({ value: r }) =>
        ((deps) =>
          (([refs2, queue2]: [Set<A>, A[]]) =>
            closeRefsFrom(queue2, add(i, 1), refs2, runtimeDeps))(
            addDepsFrom(deps, 0, refs, queue),
          ))(_Option_unwrapOr([] as A[], _Map_get(r, runtimeDeps))),
      )
      .exhaustive(),
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
    const bound: Set<string> = boundNames(stmts);
    return filter(
      (n: string) => and(_Set_has(n, refs), not(_Set_has(n, bound))),
      _Map_keys(jsDefs),
    );
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
    return eq(length(defs), 0)
      ? ""
      : `${_Str_join("\n", defs)}

`;
  },
);
const genStmtAllFrom: _Curry<[ctx: GCtx, stmts: Stmt[], i: number], string[]> = _curry(
  3,
  (ctx: GCtx, stmts: Stmt[], i: number) =>
    match(_Array_get(i, stmts))
      .with({ _tag: "None" }, () => [] as string[])
      .with({ _tag: "Some" }, ({ value: s }) =>
        _Array_prepend(genStmt(ctx, s), genStmtAllFrom(ctx, stmts, add(i, 1))),
      )
      .exhaustive(),
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
    tupleHelper: boolean;
    flattenPipe: boolean;
    guardBaseType: Option<(a: Expr) => Option<string>>;
    annotateCall: Option<(a: Expr) => Option<string>>;
    annotateLetin: Option<(a: Expr) => Option<string>>;
    annotateEmpty: Option<(a: Expr) => Option<string>>;
    annotateParams: Option<(a: Span, b: number) => ParamAnnots>;
    annotateCtor: Option<(a: Stmt, b: CtorLike) => Option<CtorFactoryTs>>;
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
      tupleHelper: boolean;
      flattenPipe: boolean;
      guardBaseType: Option<(a: Expr) => Option<string>>;
      annotateCall: Option<(a: Expr) => Option<string>>;
      annotateLetin: Option<(a: Expr) => Option<string>>;
      annotateEmpty: Option<(a: Expr) => Option<string>>;
      annotateParams: Option<(a: Span, b: number) => ParamAnnots>;
      annotateCtor: Option<(a: Stmt, b: CtorLike) => Option<CtorFactoryTs>>;
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
      moduleExt: opts.moduleExt,
      valueRefs: _Set_fromArray([]),
      docs: opts.docs,
    };
    const valueRefs: Set<string> = collectValueRefs(ctx0, stmts, 0, _Set_fromArray([] as string[]));
    const ctx: GCtx = { ...ctx0, valueRefs: valueRefs };
    const needsMatch: boolean = someOf(
      (s: Stmt) =>
        match(s)
          .with({ _tag: "SLet" }, ({ value }) => usesMatchLib(value))
          .with({ _tag: "SExpr" }, ({ value }) => usesMatchLib(value))
          .otherwise(() => false),
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
