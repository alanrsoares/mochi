import type {
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
} from "./ast";

import type { Option, _Curry } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_get,
  _Set_add,
  _Set_fromArray,
  _curry,
  add,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "./ast";
const addNames: <A>(names: A[], out: Set<A>) => Set<A> = _curry(2, <A>(names: A[], out: Set<A>) =>
  match(names)
    .with(
      (_v) => _v.length === 0,
      () => out,
    )
    .with(
      (_v) => _v.length >= 1,
      ([n, ...rest]) => addNames(rest, _Set_add(n, out)),
    )
    .otherwise(() => {
      throw new Error("non-exhaustive match");
    }),
);
const patternNamesOpt: _Curry<[p: Option<Pattern>, out: Set<string>], Set<string>> = _curry(
  2,
  (p: Option<Pattern>, out: Set<string>) =>
    ((_v) =>
      _v._tag === "None"
        ? out
        : _v._tag === "Some"
          ? (({ value: pat }) => patternNames(pat, out))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(p),
);
const patternNamesAll: _Curry<[pats: Pattern[], out: Set<string>], Set<string>> = _curry(
  2,
  (pats: Pattern[], out: Set<string>) =>
    ((_v) =>
      _v.length === 0
        ? out
        : _v.length >= 1
          ? (([p, ...rest]) => patternNamesAll(rest, patternNames(p, out)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(pats),
);
const patternNamesFields: _Curry<[fields: PatField[], out: Set<string>], Set<string>> = _curry(
  2,
  (fields: PatField[], out: Set<string>) =>
    ((_v) =>
      _v.length === 0
        ? out
        : _v.length >= 1
          ? (([f, ...rest]) => patternNamesFields(rest, patternNames(f.pat, out)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(fields),
);
const patternNames: _Curry<[p: Pattern, out: Set<string>], Set<string>> = _curry(
  2,
  (p: Pattern, out: Set<string>) =>
    ((_v) =>
      _v._tag === "PAs"
        ? (({ pat, name }) => patternNames(pat, _Set_add(name, out)))(_v)
        : _v._tag === "PBind"
          ? (({ name }) => _Set_add(name, out))(_v)
          : _v._tag === "PTuple"
            ? (({ elems }) => patternNamesAll(elems, out))(_v)
            : _v._tag === "PRecord"
              ? (({ fields }) => patternNamesFields(fields, out))(_v)
              : _v._tag === "PCtor"
                ? (({ args }) => patternNamesAll(args, out))(_v)
                : _v._tag === "PArr"
                  ? (({ elems, rest }) => patternNamesOpt(rest, patternNamesAll(elems, out)))(_v)
                  : _v._tag === "PList"
                    ? (({ elems, rest }) => patternNamesOpt(rest, patternNamesAll(elems, out)))(_v)
                    : _v._tag === "POr"
                      ? (({ alts }) => patternNamesAll(alts, out))(_v)
                      : _v._tag === "PWild"
                        ? out
                        : _v._tag === "PUnit"
                          ? out
                          : _v._tag === "PLit"
                            ? out
                            : _v._tag === "PBool"
                              ? out
                              : _v._tag === "PStr"
                                ? out
                                : (() => {
                                    throw new Error("non-exhaustive match");
                                  })())(p),
);
const exprNamesAll: _Curry<[exprs: Expr[], out: Set<string>], Set<string>> = _curry(
  2,
  (exprs: Expr[], out: Set<string>) =>
    ((_v) =>
      _v.length === 0
        ? out
        : _v.length >= 1
          ? (([e, ...rest]) => exprNamesAll(rest, exprNames(e, out)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(exprs),
);
const exprNamesOpt: _Curry<[e: Option<Expr>, out: Set<string>], Set<string>> = _curry(
  2,
  (e: Option<Expr>, out: Set<string>) =>
    ((_v) =>
      _v._tag === "None"
        ? out
        : _v._tag === "Some"
          ? (({ value: ex }) => exprNames(ex, out))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(e),
);
const seqNames: _Curry<[elems: SeqElem[], out: Set<string>], Set<string>> = _curry(
  2,
  (elems: SeqElem[], out: Set<string>) =>
    ((_v) =>
      _v.length === 0
        ? out
        : _v.length >= 1 && _v[0]._tag === "SEExpr"
          ? (([{ expr: e }, ...rest]) => seqNames(rest, exprNames(e, out)))(
              _v as [Extract<SeqElem[][number], { _tag: "SEExpr" }>, ...SeqElem[]],
            )
          : _v.length >= 1 && _v[0]._tag === "SESpread"
            ? (([{ expr: e }, ...rest]) => seqNames(rest, exprNames(e, out)))(
                _v as [Extract<SeqElem[][number], { _tag: "SESpread" }>, ...SeqElem[]],
              )
            : (() => {
                throw new Error("non-exhaustive match");
              })())(elems),
);
const fieldNames: _Curry<[fields: Field[], out: Set<string>], Set<string>> = _curry(
  2,
  (fields: Field[], out: Set<string>) =>
    ((_v) =>
      _v.length === 0
        ? out
        : _v.length >= 1
          ? (([f, ...rest]) => fieldNames(rest, exprNames(f.value, out)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(fields),
);
const entryNames: _Curry<[entries: MapEntry[], out: Set<string>], Set<string>> = _curry(
  2,
  (entries: MapEntry[], out: Set<string>) =>
    ((_v) =>
      _v.length === 0
        ? out
        : _v.length >= 1
          ? (([ent, ...rest]) => entryNames(rest, exprNames(ent.value, exprNames(ent.key, out))))(
              _v,
            )
          : (() => {
              throw new Error("non-exhaustive match");
            })())(entries),
);
const interpNames: _Curry<[parts: InterpPart[], out: Set<string>], Set<string>> = _curry(
  2,
  (parts: InterpPart[], out: Set<string>) =>
    ((_v) =>
      _v.length === 0
        ? out
        : _v.length >= 1 && _v[0]._tag === "IPLit"
          ? (([, ...rest]) => interpNames(rest, out))(
              _v as [Extract<InterpPart[][number], { _tag: "IPLit" }>, ...InterpPart[]],
            )
          : _v.length >= 1 && _v[0]._tag === "IPExpr"
            ? (([{ expr: e }, ...rest]) => interpNames(rest, exprNames(e, out)))(
                _v as [Extract<InterpPart[][number], { _tag: "IPExpr" }>, ...InterpPart[]],
              )
            : (() => {
                throw new Error("non-exhaustive match");
              })())(parts),
);
const armNames: _Curry<[arms: MatchArm[], out: Set<string>], Set<string>> = _curry(
  2,
  (arms: MatchArm[], out: Set<string>) =>
    ((_v) =>
      _v.length === 0
        ? out
        : _v.length >= 1
          ? (([arm, ...rest]) =>
              ((out1: Set<string>) =>
                ((out2: Set<string>) => armNames(rest, exprNames(arm.body, out2)))(
                  exprNamesOpt(arm.guard, out1),
                ))(patternNames(arm.pattern, out)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(arms),
);
const loopParamNames: _Curry<[params: LoopParam[], out: Set<string>], Set<string>> = _curry(
  2,
  (params: LoopParam[], out: Set<string>) =>
    ((_v) =>
      _v.length === 0
        ? out
        : _v.length >= 1
          ? (([p, ...rest]) => loopParamNames(rest, exprNames(p.init, _Set_add(p.name, out))))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(params),
);
const paramNames: _Curry<[p: LamParam, out: Set<string>], Set<string>> = _curry(
  2,
  (p: LamParam, out: Set<string>) =>
    ((_v) =>
      _v._tag === "LPSpanned"
        ? (({ param: inner }) => paramNames(inner, out))(_v)
        : _v._tag === "LPName"
          ? (({ name }) => _Set_add(name, out))(_v)
          : _v._tag === "LPTuple"
            ? (({ names }) => addNames(names, out))(_v)
            : _v._tag === "LPRecord"
              ? (({ fields }) => addNames(fields, out))(_v)
              : _v._tag === "LPLabeled"
                ? (({ name, defaultValue }) => exprNamesOpt(defaultValue, _Set_add(name, out)))(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(p),
);
const paramNamesAll: _Curry<[params: LamParam[], out: Set<string>], Set<string>> = _curry(
  2,
  (params: LamParam[], out: Set<string>) =>
    ((_v) =>
      _v.length === 0
        ? out
        : _v.length >= 1
          ? (([p, ...rest]) => paramNamesAll(rest, paramNames(p, out)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(params),
);
const exprNames: _Curry<[e: Expr, out: Set<string>], Set<string>> = _curry(
  2,
  (e: Expr, out: Set<string>) =>
    ((_v) =>
      _v._tag === "ENum"
        ? out
        : _v._tag === "EUnit"
          ? out
          : _v._tag === "EBool"
            ? out
            : _v._tag === "EStr"
              ? out
              : _v._tag === "ERef"
                ? out
                : _v._tag === "EInterp"
                  ? (({ parts }) => interpNames(parts, out))(_v)
                  : _v._tag === "ECall"
                    ? (({ fn, args }) => exprNamesAll(args, exprNames(fn, out)))(_v)
                    : _v._tag === "ELambda"
                      ? (({ params, body }) => exprNames(body, paramNamesAll(params, out)))(_v)
                      : _v._tag === "ELetIn"
                        ? (({ name, value, body }) =>
                            exprNames(body, exprNames(value, _Set_add(name, out))))(_v)
                        : _v._tag === "ELetBind"
                          ? (({ param, value, body }) =>
                              exprNames(body, paramNames(param, exprNames(value, out))))(_v)
                          : _v._tag === "EPipe"
                            ? (({ left, right }) => exprNames(right, exprNames(left, out)))(_v)
                            : _v._tag === "EDo"
                              ? (({ exprs }) => exprNamesAll(exprs, out))(_v)
                              : _v._tag === "ETernary"
                                ? (({ cond, thenE, elseE }) =>
                                    exprNames(elseE, exprNames(thenE, exprNames(cond, out))))(_v)
                                : _v._tag === "EMatch"
                                  ? (({ scrutinee, arms }) =>
                                      armNames(arms, exprNames(scrutinee, out)))(_v)
                                  : _v._tag === "ERecord"
                                    ? (({ fields, spread }) =>
                                        fieldNames(fields, exprNamesOpt(spread, out)))(_v)
                                    : _v._tag === "EField"
                                      ? (({ target }) => exprNames(target, out))(_v)
                                      : _v._tag === "ELoop"
                                        ? (({ params, body }) =>
                                            exprNames(body, loopParamNames(params, out)))(_v)
                                        : _v._tag === "ERecur"
                                          ? (({ args }) => exprNamesAll(args, out))(_v)
                                          : _v._tag === "ETuple"
                                            ? (({ elements }) => exprNamesAll(elements, out))(_v)
                                            : _v._tag === "EArr"
                                              ? (({ elements }) => seqNames(elements, out))(_v)
                                              : _v._tag === "EList"
                                                ? (({ elements }) => seqNames(elements, out))(_v)
                                                : _v._tag === "ESet"
                                                  ? (({ elements }) => seqNames(elements, out))(_v)
                                                  : _v._tag === "EMap"
                                                    ? (({ entries }) => entryNames(entries, out))(
                                                        _v,
                                                      )
                                                    : (() => {
                                                        throw new Error("non-exhaustive match");
                                                      })())(e),
);
const namesFromStmts: _Curry<[stmts: Stmt[], i: number, out: Set<string>], Set<string>> = _curry(
  3,
  (stmts: Stmt[], i: number, out: Set<string>) =>
    ((_v) =>
      _v._tag === "None"
        ? out
        : _v._tag === "Some" && _v.value._tag === "SLet"
          ? (({ value: { value } }) => namesFromStmts(stmts, i + 1, exprNames(value, out)))(
              _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SLet" }>;
              },
            )
          : _v._tag === "Some" && _v.value._tag === "SExpr"
            ? (({ value: { value } }) => namesFromStmts(stmts, i + 1, exprNames(value, out)))(
                _v as Extract<Option<Stmt>, { _tag: "Some" }> & {
                  value: Extract<
                    Extract<Option<Stmt>, { _tag: "Some" }>["value"],
                    { _tag: "SExpr" }
                  >;
                },
              )
            : _v._tag === "Some"
              ? namesFromStmts(stmts, i + 1, out)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(_Array_get(i, stmts)),
);
/**
 * Every local binder in `stmts`.
 */
export const localBinderNames: (stmts: Stmt[]) => Set<string> = (stmts: Stmt[]) =>
  namesFromStmts(stmts, 0, _Set_fromArray([] as string[]));
