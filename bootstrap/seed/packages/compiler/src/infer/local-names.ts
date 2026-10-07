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
} from "../ast/ast";

import type { Option } from "@mochi/compiler/runtime";

import {
  None,
  Some,
  _Array_get,
  _Option_match,
  _Set_add,
  _Set_fromArray,
  _curry,
  _keyOf,
  _setAdd,
  add,
  eq,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "../ast/ast";
const addBinderNames: <A>(names: A[], out: Set<A>) => Set<A> = _curry(
  2,
  <A>(names: A[], out: Set<A>) =>
    match(names)
      .with(
        (_v) => _v.length === 0,
        () => out,
      )
      .with(
        (_v) => _v.length >= 1,
        ([n, ...rest]) => addBinderNames(rest, _Set_add(n, out)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const patternNamesOpt = (p: Option<Pattern>, out: Set<string>): Set<string> =>
  _Option_match(
    p,
    () => out,
    (pat) => patternNames(pat, out),
  );
const patternNamesAll = (pats: Pattern[], out: Set<string>): Set<string> =>
  ((_v) =>
    _v.length === 0
      ? out
      : _v.length >= 1
        ? (([p, ...rest]) => patternNamesAll(rest, patternNames(p, out)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(pats);
const patternNamesFields = (fields: PatField[], out: Set<string>): Set<string> =>
  ((_v) =>
    _v.length === 0
      ? out
      : _v.length >= 1
        ? (([f, ...rest]) => patternNamesFields(rest, patternNames(f.pat, out)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(fields);
const patternNames = (p: Pattern, out: Set<string>): Set<string> => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat, name } = $match;
      return patternNames(pat, _Set_add(name, out));
    }
    case "PBind": {
      const { name } = $match;
      return _Set_add(name, out);
    }
    case "PTuple": {
      const { elems } = $match;
      return patternNamesAll(elems, out);
    }
    case "PRecord": {
      const { fields } = $match;
      return patternNamesFields(fields, out);
    }
    case "PCtor": {
      const { args } = $match;
      return patternNamesAll(args, out);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return patternNamesOpt(rest, patternNamesAll(elems, out));
    }
    case "PList": {
      const { elems, rest } = $match;
      return patternNamesOpt(rest, patternNamesAll(elems, out));
    }
    case "POr": {
      const { alts } = $match;
      return patternNamesAll(alts, out);
    }
    case "PWild": {
      return out;
    }
    case "PUnit": {
      return out;
    }
    case "PLit": {
      return out;
    }
    case "PBool": {
      return out;
    }
    case "PStr": {
      return out;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const exprNamesAll = (exprs: Expr[], out: Set<string>): Set<string> =>
  ((_v) =>
    _v.length === 0
      ? out
      : _v.length >= 1
        ? (([e, ...rest]) => exprNamesAll(rest, exprNames(e, out)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(exprs);
const exprNamesOpt = (e: Option<Expr>, out: Set<string>): Set<string> =>
  _Option_match(
    e,
    () => out,
    (ex) => exprNames(ex, out),
  );
const seqNames = (elems: SeqElem[], out: Set<string>): Set<string> =>
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
            })())(elems);
const fieldNames = (fields: Field[], out: Set<string>): Set<string> =>
  ((_v) =>
    _v.length === 0
      ? out
      : _v.length >= 1
        ? (([f, ...rest]) => fieldNames(rest, exprNames(f.value, out)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(fields);
const entryNames = (entries: MapEntry[], out: Set<string>): Set<string> =>
  ((_v) =>
    _v.length === 0
      ? out
      : _v.length >= 1
        ? (([ent, ...rest]) => entryNames(rest, exprNames(ent.value, exprNames(ent.key, out))))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(entries);
const interpNames = (parts: InterpPart[], out: Set<string>): Set<string> =>
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
            })())(parts);
const armNames = (arms: MatchArm[], out: Set<string>): Set<string> =>
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
          })())(arms);
const loopBinderNames = (params: LoopParam[], out: Set<string>): Set<string> =>
  ((_v) =>
    _v.length === 0
      ? out
      : _v.length >= 1
        ? (([p, ...rest]) => loopBinderNames(rest, exprNames(p.init, _Set_add(p.name, out))))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(params);
const paramBinderNames = (p: LamParam, out: Set<string>): Set<string> => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return paramBinderNames(inner, out);
    }
    case "LPName": {
      const { name } = $match;
      return _Set_add(name, out);
    }
    case "LPTuple": {
      const { names } = $match;
      return addBinderNames(names, out);
    }
    case "LPRecord": {
      const { fields } = $match;
      return addBinderNames(fields, out);
    }
    case "LPLabeled": {
      const { name, defaultValue } = $match;
      return exprNamesOpt(defaultValue, _Set_add(name, out));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const paramNamesAll = (params: LamParam[], out: Set<string>): Set<string> =>
  ((_v) =>
    _v.length === 0
      ? out
      : _v.length >= 1
        ? (([p, ...rest]) => paramNamesAll(rest, paramBinderNames(p, out)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(params);
const exprNames = (e: Expr, out: Set<string>): Set<string> => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return out;
    }
    case "EUnit": {
      return out;
    }
    case "EBool": {
      return out;
    }
    case "EStr": {
      return out;
    }
    case "ERef": {
      return out;
    }
    case "EInterp": {
      const { parts } = $match;
      return interpNames(parts, out);
    }
    case "ECall": {
      const { fn, args } = $match;
      return exprNamesAll(args, exprNames(fn, out));
    }
    case "ELambda": {
      const { params, body } = $match;
      return exprNames(body, paramNamesAll(params, out));
    }
    case "ELetIn": {
      const { name, value, body } = $match;
      return exprNames(body, exprNames(value, _Set_add(name, out)));
    }
    case "ELetBind": {
      const { param, value, body } = $match;
      return exprNames(body, paramBinderNames(param, exprNames(value, out)));
    }
    case "EPipe": {
      const { left, right } = $match;
      return exprNames(right, exprNames(left, out));
    }
    case "EDo": {
      const { exprs } = $match;
      return exprNamesAll(exprs, out);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return exprNames(elseE, exprNames(thenE, exprNames(cond, out)));
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return armNames(arms, exprNames(scrutinee, out));
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return fieldNames(fields, exprNamesOpt(spread, out));
    }
    case "EField": {
      const { target } = $match;
      return exprNames(target, out);
    }
    case "ELoop": {
      const { params, body } = $match;
      return exprNames(body, loopBinderNames(params, out));
    }
    case "ERecur": {
      const { args } = $match;
      return exprNamesAll(args, out);
    }
    case "ETuple": {
      const { elements } = $match;
      return exprNamesAll(elements, out);
    }
    case "EArr": {
      const { elements } = $match;
      return seqNames(elements, out);
    }
    case "EList": {
      const { elements } = $match;
      return seqNames(elements, out);
    }
    case "ESet": {
      const { elements } = $match;
      return seqNames(elements, out);
    }
    case "EMap": {
      const { entries } = $match;
      return entryNames(entries, out);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const namesFromStmts = (stmts: Stmt[], i: number, out: Set<string>): Set<string> =>
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
                value: Extract<Extract<Option<Stmt>, { _tag: "Some" }>["value"], { _tag: "SExpr" }>;
              },
            )
          : _v._tag === "Some"
            ? namesFromStmts(stmts, i + 1, out)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(_Array_get(i, stmts));
/**
 * Every local binder in `stmts`.
 */
export const localBinderNames: (stmts: Stmt[]) => Set<string> = (stmts: Stmt[]) =>
  namesFromStmts(stmts, 0, _Set_fromArray([] as string[]));
