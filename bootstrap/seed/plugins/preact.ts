import type { Expr } from "../ast";
import type { Row, SpanAt, St, Ty } from "../types";

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Ok,
  Some,
  _Array_drop,
  _Array_get,
  _Result_flatMap,
  _Result_map,
  _curry,
  _tuple,
  and,
  eq,
  length,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "../ast";
import {
  tCon,
  tArrow,
  tRecord,
  tTuple,
  tUnit,
  tUnion,
  rExtend,
  RowEmpty,
  zonk,
  freshVar,
} from "../types";
const arrOf: (elem: Ty) => Ty = (elem: Ty) => tCon("Array", [elem]);
const setStateDomain: (state: Ty) => Ty = (state: Ty) => tUnion([state, tArrow(state, state)]);
const isRef: _Curry<[fn: Expr, name: string], boolean> = _curry(2, (fn: Expr, name: string) =>
  match(fn)
    .with({ _tag: "ERef" }, ({ name: actual }) => eq(actual, name))
    .otherwise(() => false),
);
const preactSpan: (e: Expr) => SpanAt = (e: Expr) =>
  match(e)
    .with({ _tag: "ENum" }, ({ span: sp }) => sp)
    .with({ _tag: "EUnit" }, ({ span: sp }) => sp)
    .with({ _tag: "EBool" }, ({ span: sp }) => sp)
    .with({ _tag: "EStr" }, ({ span: sp }) => sp)
    .with({ _tag: "ERef" }, ({ span: sp }) => sp)
    .with({ _tag: "ECall" }, ({ span: sp }) => sp)
    .with({ _tag: "ELambda" }, ({ span: sp }) => sp)
    .with({ _tag: "ELetIn" }, ({ span: sp }) => sp)
    .with({ _tag: "ELetBind" }, ({ span: sp }) => sp)
    .with({ _tag: "EPipe" }, ({ span: sp }) => sp)
    .with({ _tag: "EDo" }, ({ span: sp }) => sp)
    .with({ _tag: "ETernary" }, ({ span: sp }) => sp)
    .with({ _tag: "EMatch" }, ({ span: sp }) => sp)
    .with({ _tag: "ELoop" }, ({ span: sp }) => sp)
    .with({ _tag: "ERecur" }, ({ span: sp }) => sp)
    .with({ _tag: "ERecord" }, ({ span: sp }) => sp)
    .with({ _tag: "EField" }, ({ span: sp }) => sp)
    .with({ _tag: "ETuple" }, ({ span: sp }) => sp)
    .with({ _tag: "EArr" }, ({ span: sp }) => sp)
    .with({ _tag: "EList" }, ({ span: sp }) => sp)
    .with({ _tag: "ESet" }, ({ span: sp }) => sp)
    .with({ _tag: "EMap" }, ({ span: sp }) => sp)
    .with({ _tag: "EInterp" }, ({ span: sp }) => sp)
    .exhaustive();
const inferArgs: <A, B, C, D>(
  args: A[],
  st: B,
  inferExpr: (a: A, b: B) => Result<[C, B], D>,
) => Result<B, D> = _curry(
  3,
  <A, B, C, D>(args: A[], st: B, inferExpr: (a: A, b: B) => Result<[C, B], D>) =>
    match(args)
      .with(
        (_v) => _v.length === 0,
        () => Ok(st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([arg, ...rest]) =>
          _Result_flatMap(
            ([_, st1]: [C, B]) => inferArgs(rest, st1, inferExpr),
            inferExpr(arg, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferUseState: <A, B, C, D>(
  fn: Expr,
  args: A[],
  st: B,
  api: { inferExpr: (a: A, b: B) => Result<[Ty, St], C> } & D,
) => Result<Option<[Ty, St]>, C> = _curry(
  4,
  <A, B, C, D>(
    fn: Expr,
    args: A[],
    st: B,
    api: { inferExpr: (a: A, b: B) => Result<[Ty, St], C> } & D,
  ) =>
    and(isRef(fn, "useState"), eq(length(args), 1))
      ? match(_Array_get(0, args))
          .with({ _tag: "None" }, () => Ok(None as Option<[Ty, St]>))
          .with({ _tag: "Some" }, ({ value: init }) =>
            _Result_map(
              ([state, st1]: [Ty, St]) =>
                Some(
                  _tuple(
                    tTuple([zonk(state, st1), tArrow(setStateDomain(zonk(state, st1)), tUnit)]),
                    st1,
                  ),
                ) as Option<[Ty, St]>,
              api.inferExpr(init, st),
            ),
          )
          .exhaustive()
      : Ok(None as Option<[Ty, St]>),
);
const inferUseLazyState: <A, B, C, D, E>(
  fn: Expr,
  args: Expr[],
  st: { next: number } & D,
  api: {
    unify: (a: A, b: Ty, c: B, d: SpanAt) => Result<St, C>;
    inferExpr: (a: Expr, b: { next: number } & D) => Result<[A, B], C>;
  } & E,
) => Result<Option<[Ty, St]>, C> = _curry(
  4,
  <A, B, C, D, E>(
    fn: Expr,
    args: Expr[],
    st: { next: number } & D,
    api: {
      unify: (a: A, b: Ty, c: B, d: SpanAt) => Result<St, C>;
      inferExpr: (a: Expr, b: { next: number } & D) => Result<[A, B], C>;
    } & E,
  ) =>
    and(isRef(fn, "useLazyState"), eq(length(args), 1))
      ? match(_Array_get(0, args))
          .with({ _tag: "None" }, () => Ok(None as Option<[Ty, St]>))
          .with({ _tag: "Some" }, ({ value: thunk }) =>
            (([state, st1]: [Ty, { next: number } & D]) =>
              _Result_flatMap(
                ([thunkT, st2]: [A, B]) =>
                  _Result_map(
                    (st3: St) => {
                      const value: Ty = zonk(state, st3);
                      return Some(
                        _tuple(tTuple([value, tArrow(setStateDomain(value), tUnit)]), st3),
                      ) as Option<[Ty, St]>;
                    },
                    api.unify(thunkT, tArrow(tUnit, state), st2, preactSpan(thunk)),
                  ),
                api.inferExpr(thunk, st1),
              ))(freshVar(st)),
          )
          .exhaustive()
      : Ok(None as Option<[Ty, St]>),
);
const inferUseRef: <A, B, C, D>(
  fn: Expr,
  args: A[],
  st: B,
  api: { inferExpr: (a: A, b: B) => Result<[Ty, St], C> } & D,
) => Result<Option<[Ty, St]>, C> = _curry(
  4,
  <A, B, C, D>(
    fn: Expr,
    args: A[],
    st: B,
    api: { inferExpr: (a: A, b: B) => Result<[Ty, St], C> } & D,
  ) =>
    and(isRef(fn, "useRef"), eq(length(args), 1))
      ? match(_Array_get(0, args))
          .with({ _tag: "None" }, () => Ok(None as Option<[Ty, St]>))
          .with({ _tag: "Some" }, ({ value: init }) =>
            _Result_map(
              ([state, st1]: [Ty, St]) =>
                Some(
                  _tuple(tRecord(rExtend("current", zonk(state, st1), RowEmpty as Row)), st1),
                ) as Option<[Ty, St]>,
              api.inferExpr(init, st),
            ),
          )
          .exhaustive()
      : Ok(None as Option<[Ty, St]>),
);
const inferEffectLike: <A, B, C, D>(
  fn: Expr,
  args: Expr[],
  st: { next: number } & C,
  api: {
    inferExpr: (a: Expr, b: { next: number } & C) => Result<[A, { next: number } & C], B>;
    unify: (a: A, b: Ty, c: { next: number } & C, d: SpanAt) => Result<{ next: number } & C, B>;
  } & D,
  name: string,
) => Result<Option<[Ty, { next: number } & C]>, B> = _curry(
  5,
  <A, B, C, D>(
    fn: Expr,
    args: Expr[],
    st: { next: number } & C,
    api: {
      inferExpr: (a: Expr, b: { next: number } & C) => Result<[A, { next: number } & C], B>;
      unify: (a: A, b: Ty, c: { next: number } & C, d: SpanAt) => Result<{ next: number } & C, B>;
    } & D,
    name: string,
  ) =>
    and(isRef(fn, name), length(args) >= 1)
      ? match(_Array_get(0, args))
          .with({ _tag: "None" }, () => Ok(None))
          .with({ _tag: "Some" }, ({ value: effect }) =>
            (([cleanup, st1]: [Ty, { next: number } & C]) =>
              _Result_flatMap(
                ([effectT, st2]: [A, { next: number } & C]) =>
                  _Result_flatMap(
                    (st3: { next: number } & C) =>
                      eq(length(args), 1)
                        ? (([dep, st4]: [Ty, { next: number } & C]) =>
                            Ok(Some(_tuple(tArrow(arrOf(dep), tUnit), st4))))(freshVar(st3))
                        : _Result_map(
                            (st4: { next: number } & C) => Some(_tuple(tUnit, st4)),
                            inferArgs(_Array_drop(1, args), st3, api.inferExpr),
                          ),
                    api.unify(effectT, tArrow(tUnit, cleanup), st2, preactSpan(effect)),
                  ),
                api.inferExpr(effect, st1),
              ))(freshVar(st)),
          )
          .exhaustive()
      : Ok(None),
);
const inferUseCallback: <A, B, C>(
  fn: Expr,
  args: A[],
  st: St,
  api: { inferExpr: (a: A, b: St) => Result<[Ty, St], B> } & C,
) => Result<Option<[Ty, St]>, B> = _curry(
  4,
  <A, B, C>(
    fn: Expr,
    args: A[],
    st: St,
    api: { inferExpr: (a: A, b: St) => Result<[Ty, St], B> } & C,
  ) =>
    and(isRef(fn, "useCallback"), length(args) >= 1)
      ? match(_Array_get(0, args))
          .with({ _tag: "None" }, () => Ok(None as Option<[Ty, St]>))
          .with({ _tag: "Some" }, ({ value: callback }) =>
            _Result_flatMap(
              ([callbackT, st1]: [Ty, St]) =>
                eq(length(args), 1)
                  ? (([dep, st2]: [Ty, St]) =>
                      Ok(
                        Some(_tuple(tArrow(arrOf(dep), zonk(callbackT, st2)), st2)) as Option<
                          [Ty, St]
                        >,
                      ))(freshVar(st1))
                  : _Result_map(
                      (st2: St) => Some(_tuple(zonk(callbackT, st2), st2)) as Option<[Ty, St]>,
                      inferArgs(_Array_drop(1, args), st1, api.inferExpr),
                    ),
              api.inferExpr(callback, st),
            ),
          )
          .exhaustive()
      : Ok(None as Option<[Ty, St]>),
);
const inferUseMemo: <A, B, C>(
  fn: Expr,
  args: Expr[],
  st: St,
  api: {
    inferExpr: (a: Expr, b: St) => Result<[A, St], B>;
    unify: (a: A, b: Ty, c: St, d: SpanAt) => Result<St, B>;
  } & C,
) => Result<Option<[Ty, St]>, B> = _curry(
  4,
  <A, B, C>(
    fn: Expr,
    args: Expr[],
    st: St,
    api: {
      inferExpr: (a: Expr, b: St) => Result<[A, St], B>;
      unify: (a: A, b: Ty, c: St, d: SpanAt) => Result<St, B>;
    } & C,
  ) =>
    and(isRef(fn, "useMemo"), length(args) >= 1)
      ? match(_Array_get(0, args))
          .with({ _tag: "None" }, () => Ok(None as Option<[Ty, St]>))
          .with({ _tag: "Some" }, ({ value: thunk }) =>
            (([value, st1]: [Ty, St]) =>
              _Result_flatMap(
                ([thunkT, st2]: [A, St]) =>
                  _Result_flatMap(
                    (st3: St) =>
                      eq(length(args), 1)
                        ? (([dep, st4]: [Ty, St]) =>
                            Ok(
                              Some(_tuple(tArrow(arrOf(dep), zonk(value, st4)), st4)) as Option<
                                [Ty, St]
                              >,
                            ))(freshVar(st3))
                        : _Result_map(
                            (st4: St) => Some(_tuple(zonk(value, st4), st4)) as Option<[Ty, St]>,
                            inferArgs(_Array_drop(1, args), st3, api.inferExpr),
                          ),
                    api.unify(thunkT, tArrow(tUnit, value), st2, preactSpan(thunk)),
                  ),
                api.inferExpr(thunk, st1),
              ))(freshVar(st)),
          )
          .exhaustive()
      : Ok(None as Option<[Ty, St]>),
);
const inferHookDeps: <A, B, C, D, E>(
  fn: Expr,
  args: A[],
  st: { next: number } & D,
  api: { inferExpr: (a: A, b: { next: number } & D) => Result<[B, { next: number } & D], C> } & E,
) => Result<Option<[Ty, { next: number } & D]>, C> = _curry(
  4,
  <A, B, C, D, E>(
    fn: Expr,
    args: A[],
    st: { next: number } & D,
    api: { inferExpr: (a: A, b: { next: number } & D) => Result<[B, { next: number } & D], C> } & E,
  ) => {
    const expected: Option<number> = isRef(fn, "hookDeps0")
      ? (Some(0) as Option<number>)
      : isRef(fn, "hookDeps1")
        ? (Some(1) as Option<number>)
        : isRef(fn, "hookDeps2")
          ? (Some(2) as Option<number>)
          : isRef(fn, "hookDeps")
            ? (Some(3) as Option<number>)
            : (None as Option<number>);
    return match(expected)
      .with({ _tag: "Some" }, ({ value: n }) =>
        eq(length(args), n)
          ? _Result_map(
              (st1: { next: number } & D) =>
                (([elem, st2]: [Ty, { next: number } & D]) => Some(_tuple(arrOf(elem), st2)))(
                  freshVar(st1),
                ),
              inferArgs(args, st, api.inferExpr),
            )
          : Ok(None),
      )
      .with({ _tag: "None" }, () => Ok(None))
      .exhaustive();
  },
);
export const inferPreactCall: <A, B, C>(
  fn: Expr,
  args: Expr[],
  _origin: A,
  st: St,
  api: {
    inferExpr: (a: Expr, b: St) => Result<[Ty, St], B>;
    unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, B>;
  } & C,
) => Result<Option<[Ty, St]>, B> = _curry(
  5,
  <A, B, C>(
    fn: Expr,
    args: Expr[],
    _origin: A,
    st: St,
    api: {
      inferExpr: (a: Expr, b: St) => Result<[Ty, St], B>;
      unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, B>;
    } & C,
  ) =>
    _Result_flatMap(
      (first) =>
        match(first)
          .with({ _tag: "Some" }, () => Ok(first))
          .with({ _tag: "None" }, () =>
            _Result_flatMap(
              (lazy) =>
                match(lazy)
                  .with({ _tag: "Some" }, () => Ok(lazy))
                  .with({ _tag: "None" }, () =>
                    _Result_flatMap(
                      (ref) =>
                        match(ref)
                          .with({ _tag: "Some" }, () => Ok(ref))
                          .with({ _tag: "None" }, () =>
                            _Result_flatMap(
                              (effect) =>
                                match(effect)
                                  .with({ _tag: "Some" }, () => Ok(effect))
                                  .with({ _tag: "None" }, () =>
                                    _Result_flatMap(
                                      (layout) =>
                                        match(layout)
                                          .with({ _tag: "Some" }, () => Ok(layout))
                                          .with({ _tag: "None" }, () =>
                                            _Result_flatMap(
                                              (callback) =>
                                                match(callback)
                                                  .with({ _tag: "Some" }, () => Ok(callback))
                                                  .with({ _tag: "None" }, () =>
                                                    _Result_flatMap(
                                                      (memo) =>
                                                        match(memo)
                                                          .with({ _tag: "Some" }, () => Ok(memo))
                                                          .with({ _tag: "None" }, () =>
                                                            inferHookDeps(fn, args, st, api),
                                                          )
                                                          .exhaustive(),
                                                      inferUseMemo(fn, args, st, api),
                                                    ),
                                                  )
                                                  .exhaustive(),
                                              inferUseCallback(fn, args, st, api),
                                            ),
                                          )
                                          .exhaustive(),
                                      inferEffectLike(fn, args, st, api, "useLayoutEffect"),
                                    ),
                                  )
                                  .exhaustive(),
                              inferEffectLike(fn, args, st, api, "useEffect"),
                            ),
                          )
                          .exhaustive(),
                      inferUseRef(fn, args, st, api),
                    ),
                  )
                  .exhaustive(),
              inferUseLazyState(fn, args, st, api),
            ),
          )
          .exhaustive(),
      inferUseState(fn, args, st, api),
    ),
);
export const preactPlugin = { name: "preact", parse: None, inferCall: Some(inferPreactCall) };
