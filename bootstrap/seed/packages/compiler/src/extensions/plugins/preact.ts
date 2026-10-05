import type { Expr } from "../../ast/ast";
import type { Row, SpanAt, St, Ty } from "../../infer/types";
import type { BoundErr } from "./jsx";

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_get,
  _Option_match,
  _Result_flatMap,
  _Result_map,
  _curry,
  _keyOf,
  _tuple,
  and,
  eq,
  length,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "../../ast/ast";
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
} from "../../infer/types";
import { widenLits } from "../../infer/schemes";
const arrOf: (elem: Ty) => Ty = (elem: Ty) => tCon("Array", [elem]);
const setStateDomain: (state: Ty) => Ty = (state: Ty) => tUnion([state, tArrow(state, state)]);
const isRef$ = (fn: Expr, name: string): boolean => {
  const $match = fn;
  switch ($match._tag) {
    case "ERef": {
      const { name: actual } = $match;
      return eq(actual, name);
    }
    default: {
      return false;
    }
  }
};
const isRef: _Curry<[fn: Expr, name: string], boolean> = _curry(2, isRef$);
const preactSpan: (e: Expr) => SpanAt = (e: Expr) => {
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
          _Result_flatMap(([, st1]: [C, B]) => inferArgs(rest, st1, inferExpr), inferExpr(arg, st)),
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
    and(isRef$(fn, "useState"), length(args) === 1)
      ? _Option_match(
          _Array_get(0, args),
          () => Ok(None as Option<[Ty, St]>),
          (init) =>
            _Result_map(
              ([state, st1]: [Ty, St]) => {
                const value: Ty = widenLits(zonk(state, st1));
                return Some(
                  _tuple(tTuple([value, tArrow(setStateDomain(value), tUnit)]), st1),
                ) as Option<[Ty, St]>;
              },
              api.inferExpr(init, st),
            ),
        )
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
    and(isRef$(fn, "useLazyState"), length(args) === 1)
      ? _Option_match(
          _Array_get(0, args),
          () => Ok(None as Option<[Ty, St]>),
          (thunk) =>
            (([state, st1]: [Ty, { next: number } & D]) =>
              _Result_flatMap(
                ([thunkT, st2]: [A, B]) =>
                  _Result_map(
                    (st3: St) => {
                      const value: Ty = widenLits(zonk(state, st3));
                      return Some(
                        _tuple(tTuple([value, tArrow(setStateDomain(value), tUnit)]), st3),
                      ) as Option<[Ty, St]>;
                    },
                    api.unify(thunkT, tArrow(tUnit, state), st2, preactSpan(thunk)),
                  ),
                api.inferExpr(thunk, st1),
              ))(freshVar(st)),
        )
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
    and(isRef$(fn, "useRef"), length(args) === 1)
      ? _Option_match(
          _Array_get(0, args),
          () => Ok(None as Option<[Ty, St]>),
          (init) =>
            _Result_map(
              ([state, st1]: [Ty, St]) =>
                Some(
                  _tuple(tRecord(rExtend("current", zonk(state, st1), RowEmpty as Row)), st1),
                ) as Option<[Ty, St]>,
              api.inferExpr(init, st),
            ),
        )
      : Ok(None as Option<[Ty, St]>),
);
const inferDeps: <A, B, E, F>(
  args: Expr[],
  st: A,
  api: {
    unify: (a: B, b: Ty, c: { next: number } & E, d: SpanAt) => Result<A, BoundErr>;
    inferExpr: (a: Expr, b: A) => Result<[B, { next: number } & E], BoundErr>;
  } & F,
  name: string,
) => Result<A, BoundErr> = _curry(
  4,
  <A, B, E, F>(
    args: Expr[],
    st: A,
    api: {
      unify: (a: B, b: Ty, c: { next: number } & E, d: SpanAt) => Result<A, BoundErr>;
      inferExpr: (a: Expr, b: A) => Result<[B, { next: number } & E], BoundErr>;
    } & F,
    name: string,
  ) =>
    _Option_match(
      _Array_get(2, args),
      () =>
        _Option_match(
          _Array_get(1, args),
          () => Ok(st),
          (deps) =>
            _Result_flatMap(
              ([depsT, st1]: [B, { next: number } & E]) =>
                (([elem, st2]: [Ty, { next: number } & E]) =>
                  api.unify(depsT, arrOf(elem), st2, preactSpan(deps)))(freshVar(st1)),
              api.inferExpr(deps, st),
            ),
        ),
      (surplus) => {
        const sp: SpanAt = preactSpan(surplus);
        return Err({
          message: `${name} takes one dependency array after its callback`,
          start: sp.start,
          end: sp.end,
          help: None,
          suggestions: [] as { end: number; replaceWith: string; start: number; title: string }[],
        });
      },
    ),
);
const inferEffectLike: <A, D, E, F>(
  fn: Expr,
  args: Expr[],
  st: { next: number } & D,
  api: {
    unify: (
      a: A,
      b: Ty,
      c: { next: number } & E,
      d: SpanAt,
    ) => Result<{ next: number } & D, BoundErr>;
    inferExpr: (a: Expr, b: { next: number } & D) => Result<[A, { next: number } & E], BoundErr>;
  } & F,
  name: string,
) => Result<Option<[Ty, { next: number } & D]>, BoundErr> = _curry(
  5,
  <A, D, E, F>(
    fn: Expr,
    args: Expr[],
    st: { next: number } & D,
    api: {
      unify: (
        a: A,
        b: Ty,
        c: { next: number } & E,
        d: SpanAt,
      ) => Result<{ next: number } & D, BoundErr>;
      inferExpr: (a: Expr, b: { next: number } & D) => Result<[A, { next: number } & E], BoundErr>;
    } & F,
    name: string,
  ) =>
    and(isRef$(fn, name), length(args) >= 1)
      ? _Option_match(
          _Array_get(0, args),
          () => Ok(None),
          (effect) =>
            (([cleanup, st1]: [Ty, { next: number } & D]) =>
              _Result_flatMap(
                ([effectT, st2]: [A, { next: number } & E]) =>
                  _Result_flatMap(
                    (st3: { next: number } & D) =>
                      length(args) === 1
                        ? (([dep, st4]: [Ty, { next: number } & D]) =>
                            Ok(Some(_tuple(tArrow(arrOf(dep), tUnit), st4))))(freshVar(st3))
                        : _Result_map(
                            (st4: { next: number } & D) => Some(_tuple(tUnit, st4)),
                            inferDeps(args, st3, api, name),
                          ),
                    api.unify(effectT, tArrow(tUnit, cleanup), st2, preactSpan(effect)),
                  ),
                api.inferExpr(effect, st1),
              ))(freshVar(st)),
        )
      : Ok(None),
);
const inferUseCallback: <C>(
  fn: Expr,
  args: Expr[],
  st: St,
  api: {
    unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
    inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
  } & C,
) => Result<Option<[Ty, St]>, BoundErr> = _curry(
  4,
  <C>(
    fn: Expr,
    args: Expr[],
    st: St,
    api: {
      unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
      inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
    } & C,
  ) =>
    and(isRef$(fn, "useCallback"), length(args) >= 1)
      ? _Option_match(
          _Array_get(0, args),
          () => Ok(None as Option<[Ty, St]>),
          (callback) =>
            _Result_flatMap(
              ([callbackT, st1]: [Ty, St]) =>
                length(args) === 1
                  ? (([dep, st2]: [Ty, St]) =>
                      Ok(
                        Some(_tuple(tArrow(arrOf(dep), zonk(callbackT, st2)), st2)) as Option<
                          [Ty, St]
                        >,
                      ))(freshVar(st1))
                  : _Result_map(
                      (st2: St) => Some(_tuple(zonk(callbackT, st2), st2)) as Option<[Ty, St]>,
                      inferDeps(args, st1, api, "useCallback"),
                    ),
              api.inferExpr(callback, st),
            ),
        )
      : Ok(None as Option<[Ty, St]>),
);
const inferUseMemo: <A, D, E>(
  fn: Expr,
  args: Expr[],
  st: St,
  api: {
    unify: (a: A, b: Ty, c: { next: number } & D, d: SpanAt) => Result<St, BoundErr>;
    inferExpr: (a: Expr, b: St) => Result<[A, { next: number } & D], BoundErr>;
  } & E,
) => Result<Option<[Ty, St]>, BoundErr> = _curry(
  4,
  <A, D, E>(
    fn: Expr,
    args: Expr[],
    st: St,
    api: {
      unify: (a: A, b: Ty, c: { next: number } & D, d: SpanAt) => Result<St, BoundErr>;
      inferExpr: (a: Expr, b: St) => Result<[A, { next: number } & D], BoundErr>;
    } & E,
  ) =>
    and(isRef$(fn, "useMemo"), length(args) >= 1)
      ? _Option_match(
          _Array_get(0, args),
          () => Ok(None as Option<[Ty, St]>),
          (thunk) =>
            (([value, st1]: [Ty, St]) =>
              _Result_flatMap(
                ([thunkT, st2]: [A, { next: number } & D]) =>
                  _Result_flatMap(
                    (st3: St) =>
                      length(args) === 1
                        ? (([dep, st4]: [Ty, St]) =>
                            Ok(
                              Some(_tuple(tArrow(arrOf(dep), zonk(value, st4)), st4)) as Option<
                                [Ty, St]
                              >,
                            ))(freshVar(st3))
                        : _Result_map(
                            (st4: St) => Some(_tuple(zonk(value, st4), st4)) as Option<[Ty, St]>,
                            inferDeps(args, st3, api, "useMemo"),
                          ),
                    api.unify(thunkT, tArrow(tUnit, value), st2, preactSpan(thunk)),
                  ),
                api.inferExpr(thunk, st1),
              ))(freshVar(st)),
        )
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
    const expected: Option<number> = isRef$(fn, "hookDeps0")
      ? (Some(0) as Option<number>)
      : isRef$(fn, "hookDeps1")
        ? (Some(1) as Option<number>)
        : isRef$(fn, "hookDeps2")
          ? (Some(2) as Option<number>)
          : isRef$(fn, "hookDeps")
            ? (Some(3) as Option<number>)
            : (None as Option<number>);
    return _Option_match(
      expected,
      () => Ok(None),
      (n) =>
        eq(length(args), n)
          ? _Result_map(
              (st1: { next: number } & D) =>
                (([elem, st2]: [Ty, { next: number } & D]) => Some(_tuple(arrOf(elem), st2)))(
                  freshVar(st1),
                ),
              inferArgs(args, st, api.inferExpr),
            )
          : Ok(None),
    );
  },
);
export const inferPreactCall: <A, D>(
  fn: Expr,
  args: Expr[],
  _origin: A,
  st: St,
  api: {
    inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
    unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
  } & D,
) => Result<Option<[Ty, St]>, BoundErr> = _curry(
  5,
  <A, D>(
    fn: Expr,
    args: Expr[],
    _origin: A,
    st: St,
    api: {
      inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
      unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
    } & D,
  ) =>
    _Result_flatMap(
      (first) =>
        _Option_match(
          first,
          () =>
            _Result_flatMap(
              (lazy) =>
                _Option_match(
                  lazy,
                  () =>
                    _Result_flatMap(
                      (ref) =>
                        _Option_match(
                          ref,
                          () =>
                            _Result_flatMap(
                              (effect) =>
                                _Option_match(
                                  effect,
                                  () =>
                                    _Result_flatMap(
                                      (layout) =>
                                        _Option_match(
                                          layout,
                                          () =>
                                            _Result_flatMap(
                                              (callback) =>
                                                _Option_match(
                                                  callback,
                                                  () =>
                                                    _Result_flatMap(
                                                      (memo) =>
                                                        _Option_match(
                                                          memo,
                                                          () => inferHookDeps(fn, args, st, api),
                                                          () => Ok(memo),
                                                        ),
                                                      inferUseMemo(fn, args, st, api),
                                                    ),
                                                  () => Ok(callback),
                                                ),
                                              inferUseCallback(fn, args, st, api),
                                            ),
                                          () => Ok(layout),
                                        ),
                                      inferEffectLike(fn, args, st, api, "useLayoutEffect"),
                                    ),
                                  () => Ok(effect),
                                ),
                              inferEffectLike(fn, args, st, api, "useEffect"),
                            ),
                          () => Ok(ref),
                        ),
                      inferUseRef(fn, args, st, api),
                    ),
                  () => Ok(lazy),
                ),
              inferUseLazyState(fn, args, st, api),
            ),
          () => Ok(first),
        ),
      inferUseState(fn, args, st, api),
    ),
);
export const preactPlugin = {
  name: "preact",
  parse: None,
  inferCall: Some(inferPreactCall),
  format: None,
  formatDoc: None,
  dtsBinding: None,
  bindingType: None,
};
