import type { Tok } from "../lexer/lexer";
import type { Expr } from "../ast/ast";
import type { Row, SpanAt, St, Ty } from "../infer/types";
import type { Doc } from "../doc/doc";
import type { FormatApi } from "../format/format-api";
import type { BoundErr } from "./plugins/jsx";

import type { Option, Result } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_append,
  _Array_concat,
  _Array_find,
  _Array_get,
  _curry,
  eq,
  filter,
  length,
  map,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import { jsxPlugin } from "./plugins/jsx";
import { preactPlugin } from "./plugins/preact";
export const DEFAULT_PLUGINS = [jsxPlugin];
/**
 * Vendor adapters remain opt-in. Exporting Preact from the self-hosted graph
 * makes the reference implementation available to hosts without making hooks
 * part of the language's default surface.
 */
export const PREACT_PLUGIN = preactPlugin;
/**
 * A caller plugin named like builtin `b` takes its slot (ADR 0049).
 */
const shadowing: <A, B>(ps: ({ name: A } & B)[], b: { name: A } & B) => { name: A } & B = _curry(
  2,
  <A, B>(ps: ({ name: A } & B)[], b: { name: A } & B) =>
    ((_v) =>
      _v._tag === "Some"
        ? (({ value: p }) => p)(_v)
        : _v._tag === "None"
          ? b
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_find((p: { name: A } & B) => eq(p.name, b.name), ps)),
);
/**
 * `pluginsOpt` is Option [LanguagePlugin]: None = default, Some([]) = opt-out.
 * Otherwise builtins first, each replaced in place by a same-named caller
 * plugin (a hook-less stub disables it), then the rest of the caller list.
 */
export const resolvePlugins: <A, B>(
  pluginsOpt: Option<({ name: A } & B)[]>,
  builtins: ({ name: A } & B)[],
) => ({ name: A } & B)[] = _curry(
  2,
  <A, B>(pluginsOpt: Option<({ name: A } & B)[]>, builtins: ({ name: A } & B)[]) =>
    ((_v) =>
      _v._tag === "None"
        ? builtins
        : _v._tag === "Some"
          ? (({ value: ps }) =>
              length(ps) === 0
                ? ([] as ({ name: A } & B)[])
                : _Array_concat(
                    map((b: { name: A } & B) => shadowing(ps, b), builtins),
                    filter(
                      (p: { name: A } & B) =>
                        length(filter((b: { name: A } & B) => eq(b.name, p.name), builtins)) === 0,
                      ps,
                    ),
                  ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(pluginsOpt),
);
export const resolvePluginsDefault: <B, C, D, E, F>(
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], { message: string; start: number; end: number }>,
        ) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
      >;
      inferCall: Option<
        (
          a: B,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
          } & E,
        ) => Result<Option<[Ty, St]>, BoundErr>
      >;
      format: Option<C>;
      formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & F,
        ) => Option<string>
      >;
    }[]
  >,
) => {
  name: string;
  parse: Option<
    (
      a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
        b: number,
      ) => Result<[Expr, number], { message: string; start: number; end: number }>,
    ) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
  >;
  inferCall: Option<
    (
      a: B,
      b: Expr[],
      c: Option<string>,
      d: St,
      e: {
        unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
        inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
      } & E,
    ) => Result<Option<[Ty, St]>, BoundErr>
  >;
  format: Option<C>;
  formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
  dtsBinding: Option<D>;
  bindingType: Option<
    (
      a: Expr,
      b: Ty,
      c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & F,
    ) => Option<string>
  >;
}[] = <B, C, D, E, F>(
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], { message: string; start: number; end: number }>,
        ) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
      >;
      inferCall: Option<
        (
          a: B,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
          } & E,
        ) => Result<Option<[Ty, St]>, BoundErr>
      >;
      format: Option<C>;
      formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & F,
        ) => Option<string>
      >;
    }[]
  >,
) => resolvePlugins(pluginsOpt, DEFAULT_PLUGINS);
/**
 * Collect parse hooks (skip plugins with None parse).
 */
const parseHooksFrom: <A, B>(plugins: ({ parse: Option<A> } & B)[], i: number, acc: A[]) => A[] =
  _curry(3, <A, B>(plugins: ({ parse: Option<A> } & B)[], i: number, acc: A[]) =>
    match(_Array_get(i, plugins))
      .with({ _tag: "None" }, () => acc)
      .with(
        (_v) => _v._tag === "Some",
        ({ value: { parse } }) =>
          ((_v) =>
            _v._tag === "Some"
              ? (({ value: hook }) => parseHooksFrom(plugins, i + 1, _Array_append(hook, acc)))(_v)
              : _v._tag === "None"
                ? parseHooksFrom(plugins, i + 1, acc)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(parse),
      )
      .exhaustive(),
  );
export const parseHooksOf: <A, B>(plugins: ({ parse: Option<A> } & B)[]) => A[] = <A, B>(
  plugins: ({ parse: Option<A> } & B)[],
) => parseHooksFrom(plugins, 0, [] as A[]);
const inferHooksFrom: <A, B>(
  plugins: ({ inferCall: Option<A> } & B)[],
  i: number,
  acc: A[],
) => A[] = _curry(3, <A, B>(plugins: ({ inferCall: Option<A> } & B)[], i: number, acc: A[]) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: p }) =>
            ((_v) =>
              _v._tag === "Some"
                ? (({ value: hook }) => inferHooksFrom(plugins, i + 1, _Array_append(hook, acc)))(
                    _v,
                  )
                : _v._tag === "None"
                  ? inferHooksFrom(plugins, i + 1, acc)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(p.inferCall))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, plugins)),
);
export const inferCallHooksOf: <A, B>(plugins: ({ inferCall: Option<A> } & B)[]) => A[] = <A, B>(
  plugins: ({ inferCall: Option<A> } & B)[],
) => inferHooksFrom(plugins, 0, [] as A[]);
/**
 * First hook to claim wins. Ok(None) = fall through; Ok(Some((e, pos))) =
 * claimed; Err = parse diagnostic. `parseExpr` is (toks, pos) -> Result.
 */
export const runParseHooks: <A, B, C, D, E>(
  hooks: ((a: A, b: B, c: C) => Result<Option<D>, E>)[],
  toks: A,
  pos: B,
  parseExpr: C,
) => Result<Option<D>, E> = _curry(
  4,
  <A, B, C, D, E>(
    hooks: ((a: A, b: B, c: C) => Result<Option<D>, E>)[],
    toks: A,
    pos: B,
    parseExpr: C,
  ) =>
    match(hooks)
      .with(
        (_v) => _v.length === 0,
        () => Ok(None),
      )
      .with(
        (_v) => _v.length >= 1,
        ([hook, ...rest]) =>
          ((_v) =>
            _v._tag === "Err"
              ? (({ error: e }) => Err(e))(_v)
              : _v._tag === "Ok"
                ? (({ value: v }) =>
                    ((_v) =>
                      _v._tag === "None"
                        ? runParseHooks(rest, toks, pos, parseExpr)
                        : _v._tag === "Some"
                          ? (({ value: claim }) => Ok(Some(claim)))(_v)
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(v))(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(hook(toks, pos, parseExpr)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * First hook to claim wins. Ok(None) = fall through to core call inference.
 */
export const runInferCallHooks: <A, B, C, D, E, F, G>(
  hooks: ((a: A, b: B, c: C, d: D, e: E) => Result<Option<F>, G>)[],
  fn: A,
  args: B,
  origin: C,
  st: D,
  api: E,
) => Result<Option<F>, G> = _curry(
  6,
  <A, B, C, D, E, F, G>(
    hooks: ((a: A, b: B, c: C, d: D, e: E) => Result<Option<F>, G>)[],
    fn: A,
    args: B,
    origin: C,
    st: D,
    api: E,
  ) =>
    match(hooks)
      .with(
        (_v) => _v.length === 0,
        () => Ok(None),
      )
      .with(
        (_v) => _v.length >= 1,
        ([hook, ...rest]) =>
          ((_v) =>
            _v._tag === "Err"
              ? (({ error: e }) => Err(e))(_v)
              : _v._tag === "Ok"
                ? (({ value: v }) =>
                    ((_v) =>
                      _v._tag === "None"
                        ? runInferCallHooks(rest, fn, args, origin, st, api)
                        : _v._tag === "Some"
                          ? (({ value: claim }) => Ok(Some(claim)))(_v)
                          : (() => {
                              throw new Error("non-exhaustive match");
                            })())(v))(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(hook(fn, args, origin, st, api)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const formatHooksFrom: <A, B>(plugins: ({ format: Option<A> } & B)[], i: number, acc: A[]) => A[] =
  _curry(3, <A, B>(plugins: ({ format: Option<A> } & B)[], i: number, acc: A[]) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some"
          ? (({ value: p }) =>
              ((_v) =>
                _v._tag === "Some"
                  ? (({ value: hook }) =>
                      formatHooksFrom(plugins, i + 1, _Array_append(hook, acc)))(_v)
                  : _v._tag === "None"
                    ? formatHooksFrom(plugins, i + 1, acc)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(p.format))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, plugins)),
  );
const formatDocHooksFrom: <A, B>(
  plugins: ({ formatDoc: Option<A> } & B)[],
  i: number,
  acc: A[],
) => A[] = _curry(3, <A, B>(plugins: ({ formatDoc: Option<A> } & B)[], i: number, acc: A[]) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: p }) =>
            ((_v) =>
              _v._tag === "Some"
                ? (({ value: hook }) =>
                    formatDocHooksFrom(plugins, i + 1, _Array_append(hook, acc)))(_v)
                : _v._tag === "None"
                  ? formatDocHooksFrom(plugins, i + 1, acc)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(p.formatDoc))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, plugins)),
);
/**
 * Both kinds of format hook (ADR 0112): `rewrite` swaps a node for another
 * before layout, `layout` prints a node itself.
 */
export const formatHooksOf: <A, B, C>(
  plugins: ({ formatDoc: Option<A>; format: Option<B> } & C)[],
) => { rewrite: B[]; layout: A[] } = <A, B, C>(
  plugins: ({ formatDoc: Option<A>; format: Option<B> } & C)[],
) => ({
  rewrite: formatHooksFrom(plugins, 0, [] as B[]),
  layout: formatDocHooksFrom(plugins, 0, [] as A[]),
});
/**
 * The format hooks a caller's `pluginsOpt` resolves to (builtins included).
 */
export const formatHooksFor: <B, C, D, E, F>(
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], { message: string; start: number; end: number }>,
        ) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
      >;
      inferCall: Option<
        (
          a: B,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
          } & E,
        ) => Result<Option<[Ty, St]>, BoundErr>
      >;
      format: Option<C>;
      formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & F,
        ) => Option<string>
      >;
    }[]
  >,
) => { rewrite: C[]; layout: ((a: Expr, b: FormatApi) => Option<Doc>)[] } = <B, C, D, E, F>(
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], { message: string; start: number; end: number }>,
        ) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
      >;
      inferCall: Option<
        (
          a: B,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
          } & E,
        ) => Result<Option<[Ty, St]>, BoundErr>
      >;
      format: Option<C>;
      formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & F,
        ) => Option<string>
      >;
    }[]
  >,
) => formatHooksOf(resolvePluginsDefault(pluginsOpt));
const dtsHooksFrom: <A, B>(plugins: ({ dtsBinding: Option<A> } & B)[], i: number, acc: A[]) => A[] =
  _curry(3, <A, B>(plugins: ({ dtsBinding: Option<A> } & B)[], i: number, acc: A[]) =>
    ((_v) =>
      _v._tag === "None"
        ? acc
        : _v._tag === "Some"
          ? (({ value: p }) =>
              ((_v) =>
                _v._tag === "Some"
                  ? (({ value: hook }) => dtsHooksFrom(plugins, i + 1, _Array_append(hook, acc)))(
                      _v,
                    )
                  : _v._tag === "None"
                    ? dtsHooksFrom(plugins, i + 1, acc)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(p.dtsBinding))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_get(i, plugins)),
  );
export const dtsHooksFor: <B, C, D, E, F>(
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], { message: string; start: number; end: number }>,
        ) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
      >;
      inferCall: Option<
        (
          a: B,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
          } & E,
        ) => Result<Option<[Ty, St]>, BoundErr>
      >;
      format: Option<C>;
      formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & F,
        ) => Option<string>
      >;
    }[]
  >,
) => D[] = <B, C, D, E, F>(
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], { message: string; start: number; end: number }>,
        ) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
      >;
      inferCall: Option<
        (
          a: B,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
          } & E,
        ) => Result<Option<[Ty, St]>, BoundErr>
      >;
      format: Option<C>;
      formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & F,
        ) => Option<string>
      >;
    }[]
  >,
) => dtsHooksFrom(resolvePluginsDefault(pluginsOpt), 0, [] as D[]);
/**
 * First hook to claim wins: `Some(rewritten)` replaces the node for printing.
 */
export const runFormatHooks: <A, B>(hooks: ((a: A) => Option<B>)[], e: A) => Option<B> = _curry(
  2,
  <A, B>(hooks: ((a: A) => Option<B>)[], e: A) =>
    match(hooks)
      .with(
        (_v) => _v.length === 0,
        () => None,
      )
      .with(
        (_v) => _v.length >= 1,
        ([hook, ...rest]) =>
          ((_v) =>
            _v._tag === "Some"
              ? (({ value: out }) => Some(out))(_v)
              : _v._tag === "None"
                ? runFormatHooks(rest, e)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(hook(e)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * First hook to claim wins: `Some(doc)` is the node's layout.
 */
export const runFormatDocHooks: <A, B, C>(
  hooks: ((a: A, b: B) => Option<C>)[],
  e: A,
  api: B,
) => Option<C> = _curry(3, <A, B, C>(hooks: ((a: A, b: B) => Option<C>)[], e: A, api: B) =>
  match(hooks)
    .with(
      (_v) => _v.length === 0,
      () => None,
    )
    .with(
      (_v) => _v.length >= 1,
      ([hook, ...rest]) =>
        ((_v) =>
          _v._tag === "Some"
            ? (({ value: doc }) => Some(doc))(_v)
            : _v._tag === "None"
              ? runFormatDocHooks(rest, e, api)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(hook(e, api)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
/**
 * First hook to claim wins: `Some(ts)` is the binding's declared type text.
 */
export const runDtsHooks: <A, B, C, D, E>(
  hooks: ((a: A, b: B, c: C, d: D) => Option<E>)[],
  name: A,
  value: B,
  ty: C,
  api: D,
) => Option<E> = _curry(
  5,
  <A, B, C, D, E>(
    hooks: ((a: A, b: B, c: C, d: D) => Option<E>)[],
    name: A,
    value: B,
    ty: C,
    api: D,
  ) =>
    match(hooks)
      .with(
        (_v) => _v.length === 0,
        () => None,
      )
      .with(
        (_v) => _v.length >= 1,
        ([hook, ...rest]) =>
          ((_v) =>
            _v._tag === "Some"
              ? (({ value: ts }) => Some(ts))(_v)
              : _v._tag === "None"
                ? runDtsHooks(rest, name, value, ty, api)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(hook(name, value, ty, api)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const bindingHooksFrom: <A, B>(
  plugins: ({ bindingType: Option<A> } & B)[],
  i: number,
  acc: A[],
) => A[] = _curry(3, <A, B>(plugins: ({ bindingType: Option<A> } & B)[], i: number, acc: A[]) =>
  ((_v) =>
    _v._tag === "None"
      ? acc
      : _v._tag === "Some"
        ? (({ value: p }) =>
            ((_v) =>
              _v._tag === "Some"
                ? (({ value: hook }) => bindingHooksFrom(plugins, i + 1, _Array_append(hook, acc)))(
                    _v,
                  )
                : _v._tag === "None"
                  ? bindingHooksFrom(plugins, i + 1, acc)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(p.bindingType))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(_Array_get(i, plugins)),
);
export const bindingHooksFor: <B, C, D, E, F>(
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], { message: string; start: number; end: number }>,
        ) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
      >;
      inferCall: Option<
        (
          a: B,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
          } & E,
        ) => Result<Option<[Ty, St]>, BoundErr>
      >;
      format: Option<C>;
      formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & F,
        ) => Option<string>
      >;
    }[]
  >,
) => ((
  a: Expr,
  b: Ty,
  c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & F,
) => Option<string>)[] = <B, C, D, E, F>(
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<string> }[],
            b: number,
          ) => Result<[Expr, number], { message: string; start: number; end: number }>,
        ) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
      >;
      inferCall: Option<
        (
          a: B,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
          } & E,
        ) => Result<Option<[Ty, St]>, BoundErr>
      >;
      format: Option<C>;
      formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & F,
        ) => Option<string>
      >;
    }[]
  >,
) =>
  bindingHooksFrom(
    resolvePluginsDefault(pluginsOpt),
    0,
    [] as ((
      a: Expr,
      b: Ty,
      c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & F,
    ) => Option<string>)[],
  );
/**
 * First hook to claim wins: `Some(ts)` replaces the binding's TS type.
 */
export const runBindingHooks: <A, B, C, D>(
  hooks: ((a: A, b: B, c: C) => Option<D>)[],
  value: A,
  ty: B,
  api: C,
) => Option<D> = _curry(
  4,
  <A, B, C, D>(hooks: ((a: A, b: B, c: C) => Option<D>)[], value: A, ty: B, api: C) =>
    match(hooks)
      .with(
        (_v) => _v.length === 0,
        () => None,
      )
      .with(
        (_v) => _v.length >= 1,
        ([hook, ...rest]) =>
          ((_v) =>
            _v._tag === "Some"
              ? (({ value: ts }) => Some(ts))(_v)
              : _v._tag === "None"
                ? runBindingHooks(rest, value, ty, api)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(hook(value, ty, api)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
