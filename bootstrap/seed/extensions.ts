import type { Tok } from "./lexer";
import type { Expr } from "./ast";
import type { Row, SpanAt, St, Ty } from "./types";
import type { BoundErr } from "./plugins/jsx";

import type { Option, Result } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_append,
  _Array_concat,
  _Array_get,
  _curry,
  eq,
  length,
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
 * `pluginsOpt` is Option [LanguagePlugin]: None = default, Some([]) = opt-out.
 */
export const resolvePlugins: <A>(pluginsOpt: Option<A[]>, builtins: A[]) => A[] = _curry(
  2,
  <A>(pluginsOpt: Option<A[]>, builtins: A[]) =>
    match(pluginsOpt)
      .with({ _tag: "None" }, () => builtins)
      .with({ _tag: "Some" }, ({ value: ps }) =>
        eq(length(ps), 0) ? ([] as A[]) : _Array_concat(builtins, ps),
      )
      .exhaustive(),
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
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & F,
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
  dtsBinding: Option<D>;
  bindingType: Option<
    (
      a: Expr,
      b: Ty,
      c: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & F,
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
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & F,
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
          match(parse)
            .with({ _tag: "Some" }, ({ value: hook }) =>
              parseHooksFrom(plugins, i + 1, _Array_append(hook, acc)),
            )
            .with({ _tag: "None" }, () => parseHooksFrom(plugins, i + 1, acc))
            .exhaustive(),
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
  match(_Array_get(i, plugins))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: p }) =>
      match(p.inferCall)
        .with({ _tag: "Some" }, ({ value: hook }) =>
          inferHooksFrom(plugins, i + 1, _Array_append(hook, acc)),
        )
        .with({ _tag: "None" }, () => inferHooksFrom(plugins, i + 1, acc))
        .exhaustive(),
    )
    .exhaustive(),
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
          match(hook(toks, pos, parseExpr))
            .with({ _tag: "Err" }, ({ error: e }) => Err(e))
            .with({ _tag: "Ok" }, ({ value: v }) =>
              match(v)
                .with({ _tag: "None" }, () => runParseHooks(rest, toks, pos, parseExpr))
                .with({ _tag: "Some" }, ({ value: claim }) => Ok(Some(claim)))
                .exhaustive(),
            )
            .exhaustive(),
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
          match(hook(fn, args, origin, st, api))
            .with({ _tag: "Err" }, ({ error: e }) => Err(e))
            .with({ _tag: "Ok" }, ({ value: v }) =>
              match(v)
                .with({ _tag: "None" }, () => runInferCallHooks(rest, fn, args, origin, st, api))
                .with({ _tag: "Some" }, ({ value: claim }) => Ok(Some(claim)))
                .exhaustive(),
            )
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const formatHooksFrom: <A, B>(plugins: ({ format: Option<A> } & B)[], i: number, acc: A[]) => A[] =
  _curry(3, <A, B>(plugins: ({ format: Option<A> } & B)[], i: number, acc: A[]) =>
    match(_Array_get(i, plugins))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: p }) =>
        match(p.format)
          .with({ _tag: "Some" }, ({ value: hook }) =>
            formatHooksFrom(plugins, i + 1, _Array_append(hook, acc)),
          )
          .with({ _tag: "None" }, () => formatHooksFrom(plugins, i + 1, acc))
          .exhaustive(),
      )
      .exhaustive(),
  );
export const formatHooksOf: <A, B>(plugins: ({ format: Option<A> } & B)[]) => A[] = <A, B>(
  plugins: ({ format: Option<A> } & B)[],
) => formatHooksFrom(plugins, 0, [] as A[]);
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
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & F,
        ) => Option<string>
      >;
    }[]
  >,
) => C[] = <B, C, D, E, F>(
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
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & F,
        ) => Option<string>
      >;
    }[]
  >,
) => formatHooksOf(resolvePluginsDefault(pluginsOpt));
const dtsHooksFrom: <A, B>(plugins: ({ dtsBinding: Option<A> } & B)[], i: number, acc: A[]) => A[] =
  _curry(3, <A, B>(plugins: ({ dtsBinding: Option<A> } & B)[], i: number, acc: A[]) =>
    match(_Array_get(i, plugins))
      .with({ _tag: "None" }, () => acc)
      .with({ _tag: "Some" }, ({ value: p }) =>
        match(p.dtsBinding)
          .with({ _tag: "Some" }, ({ value: hook }) =>
            dtsHooksFrom(plugins, i + 1, _Array_append(hook, acc)),
          )
          .with({ _tag: "None" }, () => dtsHooksFrom(plugins, i + 1, acc))
          .exhaustive(),
      )
      .exhaustive(),
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
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & F,
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
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & F,
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
          match(hook(e))
            .with({ _tag: "Some" }, ({ value: out }) => Some(out))
            .with({ _tag: "None" }, () => runFormatHooks(rest, e))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * First hook to claim wins: `Some(ts)` is the binding's declared type text.
 */
export const runDtsHooks: <A, B, C>(
  hooks: ((a: A, b: B) => Option<C>)[],
  name: A,
  value: B,
) => Option<C> = _curry(3, <A, B, C>(hooks: ((a: A, b: B) => Option<C>)[], name: A, value: B) =>
  match(hooks)
    .with(
      (_v) => _v.length === 0,
      () => None,
    )
    .with(
      (_v) => _v.length >= 1,
      ([hook, ...rest]) =>
        match(hook(name, value))
          .with({ _tag: "Some" }, ({ value: ts }) => Some(ts))
          .with({ _tag: "None" }, () => runDtsHooks(rest, name, value))
          .exhaustive(),
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
  match(_Array_get(i, plugins))
    .with({ _tag: "None" }, () => acc)
    .with({ _tag: "Some" }, ({ value: p }) =>
      match(p.bindingType)
        .with({ _tag: "Some" }, ({ value: hook }) =>
          bindingHooksFrom(plugins, i + 1, _Array_append(hook, acc)),
        )
        .with({ _tag: "None" }, () => bindingHooksFrom(plugins, i + 1, acc))
        .exhaustive(),
    )
    .exhaustive(),
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
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & F,
        ) => Option<string>
      >;
    }[]
  >,
) => ((
  a: Expr,
  b: Ty,
  c: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & F,
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
      dtsBinding: Option<D>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & F,
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
      c: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & F,
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
          match(hook(value, ty, api))
            .with({ _tag: "Some" }, ({ value: ts }) => Some(ts))
            .with({ _tag: "None" }, () => runBindingHooks(rest, value, ty, api))
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
