import type { Tok } from "./parser";
import type { Expr } from "./ast";
import type { Row, Ty } from "./types";

export type Option<A> = { _tag: "Some"; value: A } | { _tag: "None" };
export type Result<A, B> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: B };

import {
  _curry,
  Some,
  None,
  Ok,
  Err,
  add,
  eq,
  length,
  _Array_get,
  _Array_concat,
  _Array_append,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import { jsxPlugin } from "./plugins/jsx";
export const DEFAULT_PLUGINS = [jsxPlugin];
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
export const resolvePluginsDefault: <A, B, C, D, E>(
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
            b: number,
          ) => Result<[Expr, number], { message: string; start: number; end: number }>,
        ) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
      >;
      inferCall: Option<
        (
          a: B,
          b: Expr[],
          c: Option<string>,
          d: { tv: Map<number, Ty>; rv: Map<number, Row> } & D,
          e: {
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row> } & D,
              d: { start: number; end: number },
            ) => Result<{ tv: Map<number, Ty>; rv: Map<number, Row> } & D, C>;
            inferExpr: (
              a: Expr,
              b: { tv: Map<number, Ty>; rv: Map<number, Row> } & D,
            ) => Result<[Ty, { tv: Map<number, Ty>; rv: Map<number, Row> } & D], C>;
          } & E,
        ) => Result<Option<[Ty, { tv: Map<number, Ty>; rv: Map<number, Row> } & D]>, C>
      >;
    }[]
  >,
) => {
  name: string;
  parse: Option<
    (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], { message: string; start: number; end: number }>,
    ) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
  >;
  inferCall: Option<
    (
      a: B,
      b: Expr[],
      c: Option<string>,
      d: { tv: Map<number, Ty>; rv: Map<number, Row> } & D,
      e: {
        unify: (
          a: Ty,
          b: Ty,
          c: { tv: Map<number, Ty>; rv: Map<number, Row> } & D,
          d: { start: number; end: number },
        ) => Result<{ tv: Map<number, Ty>; rv: Map<number, Row> } & D, C>;
        inferExpr: (
          a: Expr,
          b: { tv: Map<number, Ty>; rv: Map<number, Row> } & D,
        ) => Result<[Ty, { tv: Map<number, Ty>; rv: Map<number, Row> } & D], C>;
      } & E,
    ) => Result<Option<[Ty, { tv: Map<number, Ty>; rv: Map<number, Row> } & D]>, C>
  >;
}[] = <A, B, C, D, E>(
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
          b: number,
          c: (
            a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
            b: number,
          ) => Result<[Expr, number], { message: string; start: number; end: number }>,
        ) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
      >;
      inferCall: Option<
        (
          a: B,
          b: Expr[],
          c: Option<string>,
          d: { tv: Map<number, Ty>; rv: Map<number, Row> } & D,
          e: {
            unify: (
              a: Ty,
              b: Ty,
              c: { tv: Map<number, Ty>; rv: Map<number, Row> } & D,
              d: { start: number; end: number },
            ) => Result<{ tv: Map<number, Ty>; rv: Map<number, Row> } & D, C>;
            inferExpr: (
              a: Expr,
              b: { tv: Map<number, Ty>; rv: Map<number, Row> } & D,
            ) => Result<[Ty, { tv: Map<number, Ty>; rv: Map<number, Row> } & D], C>;
          } & E,
        ) => Result<Option<[Ty, { tv: Map<number, Ty>; rv: Map<number, Row> } & D]>, C>
      >;
    }[]
  >,
) => resolvePlugins(pluginsOpt, DEFAULT_PLUGINS);
const parseHooksFrom: <A, B>(plugins: ({ parse: Option<A> } & B)[], i: number, acc: A[]) => A[] =
  _curry(3, <A, B>(plugins: ({ parse: Option<A> } & B)[], i: number, acc: A[]) =>
    match(_Array_get(i, plugins))
      .with({ _tag: "None" }, () => acc)
      .with(
        (_v) => _v._tag === "Some",
        ({ value: { parse } }) =>
          match(parse)
            .with({ _tag: "Some" }, ({ value: hook }) =>
              parseHooksFrom(plugins, add(i, 1), _Array_append(hook, acc)),
            )
            .with({ _tag: "None" }, () => parseHooksFrom(plugins, add(i, 1), acc))
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
          inferHooksFrom(plugins, add(i, 1), _Array_append(hook, acc)),
        )
        .with({ _tag: "None" }, () => inferHooksFrom(plugins, add(i, 1), acc))
        .exhaustive(),
    )
    .exhaustive(),
);
export const inferCallHooksOf: <A, B>(plugins: ({ inferCall: Option<A> } & B)[]) => A[] = <A, B>(
  plugins: ({ inferCall: Option<A> } & B)[],
) => inferHooksFrom(plugins, 0, [] as A[]);
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
