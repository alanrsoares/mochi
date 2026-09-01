export type Span = { start: number; end: number };
export type Name = { name: string; span: Span };
export type LamParam =
  | { _tag: "LPName"; name: string; annot: Option<TypeExpr> }
  | { _tag: "LPRecord"; fields: string[] }
  | { _tag: "LPTuple"; names: string[] }
  | {
      _tag: "LPLabeled";
      name: string;
      annot: Option<TypeExpr>;
      optional: boolean;
      defaultValue: Option<Expr>;
    }
  | { _tag: "LPSpanned"; param: LamParam; nameSpans: Span[] };
export type Field = { name: string; value: Expr };
export type MapEntry = { key: Expr; value: Expr };
export type MatchArm = { pattern: Pattern; guard: Option<Expr>; body: Expr };
export type LoopParam = { name: string; nameSpan: Span; init: Expr };
export type PatField = { label: string; pat: Pattern };
/**
 * One slot in an Array / List / Set literal (ADR 0001).
 */
export type SeqElem = { _tag: "SEExpr"; expr: Expr } | { _tag: "SESpread"; expr: Expr };
export type Expr =
  | { _tag: "ENum"; value: number; raw: string; span: Span }
  | { _tag: "EUnit"; span: Span }
  | { _tag: "EBool"; value: boolean; span: Span }
  | { _tag: "EStr"; value: string; span: Span }
  | { _tag: "ERef"; name: string; span: Span }
  | { _tag: "ECall"; fn: Expr; args: Expr[]; origin: Option<string>; span: Span }
  | { _tag: "ELambda"; params: LamParam[]; body: Expr; span: Span }
  | { _tag: "ELetIn"; name: string; nameSpan: Span; value: Expr; body: Expr; span: Span }
  | {
      _tag: "ELetBind";
      param: LamParam;
      paramSpan: Span;
      monad: string;
      value: Expr;
      body: Expr;
      span: Span;
    }
  | { _tag: "EPipe"; left: Expr; right: Expr; fast: boolean; span: Span }
  | { _tag: "EDo"; exprs: Expr[]; span: Span }
  | { _tag: "ETernary"; cond: Expr; thenE: Expr; elseE: Expr; span: Span }
  | { _tag: "EMatch"; scrutinee: Expr; arms: MatchArm[]; span: Span }
  | { _tag: "ERecord"; fields: Field[]; spread: Option<Expr>; span: Span }
  | { _tag: "EField"; target: Expr; name: string; optional: boolean; span: Span }
  | { _tag: "ETuple"; elements: Expr[]; span: Span }
  | { _tag: "EArr"; elements: SeqElem[]; span: Span }
  | { _tag: "EList"; elements: SeqElem[]; span: Span }
  | { _tag: "ESet"; elements: SeqElem[]; span: Span }
  | { _tag: "EMap"; entries: MapEntry[]; span: Span }
  | { _tag: "ELoop"; params: LoopParam[]; body: Expr; span: Span }
  | { _tag: "ERecur"; args: Expr[]; span: Span }
  | { _tag: "EInterp"; parts: InterpPart[]; span: Span };
export type InterpPart = { _tag: "IPLit"; value: string } | { _tag: "IPExpr"; expr: Expr };
export type Pattern =
  | { _tag: "PWild"; span: Span }
  | { _tag: "PUnit"; span: Span }
  | { _tag: "PBind"; name: string; span: Span }
  | { _tag: "PAs"; pat: Pattern; name: string; nameSpan: Span; span: Span }
  | { _tag: "PLit"; value: number; raw: string; span: Span }
  | { _tag: "PBool"; value: boolean; span: Span }
  | { _tag: "PStr"; value: string; span: Span }
  | { _tag: "PTuple"; elems: Pattern[]; span: Span }
  | { _tag: "PRecord"; fields: PatField[]; span: Span }
  | { _tag: "PCtor"; ctor: string; args: Pattern[]; ns: Option<string>; span: Span }
  | { _tag: "PArr"; elems: Pattern[]; rest: Option<Pattern>; span: Span }
  | { _tag: "PList"; elems: Pattern[]; rest: Option<Pattern>; span: Span }
  | { _tag: "POr"; alts: Pattern[]; span: Span };
export type TypeExpr =
  | { _tag: "TyName"; name: string; span: Span }
  | { _tag: "TyArrow"; from: TypeExpr; to: TypeExpr; span: Span }
  | { _tag: "TyApp"; ctor: string; args: TypeExpr[]; span: Span }
  | { _tag: "TyTuple"; elems: TypeExpr[]; span: Span }
  | { _tag: "TyList"; elem: TypeExpr; span: Span }
  | { _tag: "TyQual"; alias: string; name: string; nameSpan: Span; args: TypeExpr[]; span: Span }
  | { _tag: "TyLit"; value: string; span: Span }
  | { _tag: "TyUnion"; members: TypeExpr[]; span: Span };
export type CtorField = { name: Option<string>; fieldType: TypeExpr };
export type Ctor = { name: string; fields: CtorField[] };
export type AliasField = { name: string; fieldType: TypeExpr; optional: boolean };
export type Stmt =
  | {
      _tag: "SLet";
      name: string;
      nameSpan: Span;
      annot: Option<TypeExpr>;
      value: Expr;
      exported: boolean;
      doc: Option<string>;
      span: Span;
    }
  | {
      _tag: "SType";
      name: string;
      params: string[];
      ctors: Ctor[];
      alias: Option<AliasField[]>;
      aliasType: Option<TypeExpr>;
      exported: boolean;
      doc: Option<string>;
      span: Span;
    }
  | {
      _tag: "SExtern";
      name: string;
      nameSpan: Span;
      params: string[];
      typeExpr: TypeExpr;
      module: string;
      imported: string;
      curried: boolean;
      exported: boolean;
      doc: Option<string>;
      span: Span;
    }
  | { _tag: "SImport"; names: Name[]; from: string; span: Span }
  | { _tag: "SImportNs"; alias: Name; from: string; span: Span }
  | { _tag: "SExpr"; value: Expr; span: Span }
  | { _tag: "SError"; span: Span };

import type { Option } from "@mochi/compiler/runtime";

import { _curry } from "@mochi/compiler/runtime";

export const LPName = _curry(2, (name, annot) => ({ _tag: "LPName", name, annot })) as (
  name: string,
  annot: Option<TypeExpr>,
) => LamParam;
export const LPRecord = (fields: string[]): LamParam => ({ _tag: "LPRecord", fields });
export const LPTuple = (names: string[]): LamParam => ({ _tag: "LPTuple", names });
export const LPLabeled = _curry(4, (name, annot, optional, defaultValue) => ({
  _tag: "LPLabeled",
  name,
  annot,
  optional,
  defaultValue,
})) as (
  name: string,
  annot: Option<TypeExpr>,
  optional: boolean,
  defaultValue: Option<Expr>,
) => LamParam;
export const LPSpanned = _curry(2, (param, nameSpans) => ({
  _tag: "LPSpanned",
  param,
  nameSpans,
})) as (param: LamParam, nameSpans: Span[]) => LamParam;

export const SEExpr = (expr: Expr): SeqElem => ({ _tag: "SEExpr", expr });
export const SESpread = (expr: Expr): SeqElem => ({ _tag: "SESpread", expr });
export const ENum = _curry(3, (value, raw, span) => ({ _tag: "ENum", value, raw, span })) as (
  value: number,
  raw: string,
  span: Span,
) => Expr;
export const EUnit = (span: Span): Expr => ({ _tag: "EUnit", span });
export const EBool = _curry(2, (value, span) => ({ _tag: "EBool", value, span })) as (
  value: boolean,
  span: Span,
) => Expr;
export const EStr = _curry(2, (value, span) => ({ _tag: "EStr", value, span })) as (
  value: string,
  span: Span,
) => Expr;
export const ERef = _curry(2, (name, span) => ({ _tag: "ERef", name, span })) as (
  name: string,
  span: Span,
) => Expr;
export const ECall = _curry(4, (fn, args, origin, span) => ({
  _tag: "ECall",
  fn,
  args,
  origin,
  span,
})) as (fn: Expr, args: Expr[], origin: Option<string>, span: Span) => Expr;
export const ELambda = _curry(3, (params, body, span) => ({
  _tag: "ELambda",
  params,
  body,
  span,
})) as (params: LamParam[], body: Expr, span: Span) => Expr;
export const ELetIn = _curry(5, (name, nameSpan, value, body, span) => ({
  _tag: "ELetIn",
  name,
  nameSpan,
  value,
  body,
  span,
})) as (name: string, nameSpan: Span, value: Expr, body: Expr, span: Span) => Expr;
export const ELetBind = _curry(6, (param, paramSpan, monad, value, body, span) => ({
  _tag: "ELetBind",
  param,
  paramSpan,
  monad,
  value,
  body,
  span,
})) as (
  param: LamParam,
  paramSpan: Span,
  monad: string,
  value: Expr,
  body: Expr,
  span: Span,
) => Expr;
export const EPipe = _curry(4, (left, right, fast, span) => ({
  _tag: "EPipe",
  left,
  right,
  fast,
  span,
})) as (left: Expr, right: Expr, fast: boolean, span: Span) => Expr;
export const EDo = _curry(2, (exprs, span) => ({ _tag: "EDo", exprs, span })) as (
  exprs: Expr[],
  span: Span,
) => Expr;
export const ETernary = _curry(4, (cond, thenE, elseE, span) => ({
  _tag: "ETernary",
  cond,
  thenE,
  elseE,
  span,
})) as (cond: Expr, thenE: Expr, elseE: Expr, span: Span) => Expr;
export const EMatch = _curry(3, (scrutinee, arms, span) => ({
  _tag: "EMatch",
  scrutinee,
  arms,
  span,
})) as (scrutinee: Expr, arms: MatchArm[], span: Span) => Expr;
export const ERecord = _curry(3, (fields, spread, span) => ({
  _tag: "ERecord",
  fields,
  spread,
  span,
})) as (fields: Field[], spread: Option<Expr>, span: Span) => Expr;
export const EField = _curry(4, (target, name, optional, span) => ({
  _tag: "EField",
  target,
  name,
  optional,
  span,
})) as (target: Expr, name: string, optional: boolean, span: Span) => Expr;
export const ETuple = _curry(2, (elements, span) => ({ _tag: "ETuple", elements, span })) as (
  elements: Expr[],
  span: Span,
) => Expr;
export const EArr = _curry(2, (elements, span) => ({ _tag: "EArr", elements, span })) as (
  elements: SeqElem[],
  span: Span,
) => Expr;
export const EList = _curry(2, (elements, span) => ({ _tag: "EList", elements, span })) as (
  elements: SeqElem[],
  span: Span,
) => Expr;
export const ESet = _curry(2, (elements, span) => ({ _tag: "ESet", elements, span })) as (
  elements: SeqElem[],
  span: Span,
) => Expr;
export const EMap = _curry(2, (entries, span) => ({ _tag: "EMap", entries, span })) as (
  entries: MapEntry[],
  span: Span,
) => Expr;
export const ELoop = _curry(3, (params, body, span) => ({ _tag: "ELoop", params, body, span })) as (
  params: LoopParam[],
  body: Expr,
  span: Span,
) => Expr;
export const ERecur = _curry(2, (args, span) => ({ _tag: "ERecur", args, span })) as (
  args: Expr[],
  span: Span,
) => Expr;
export const EInterp = _curry(2, (parts, span) => ({ _tag: "EInterp", parts, span })) as (
  parts: InterpPart[],
  span: Span,
) => Expr;
export const IPLit = (value: string): InterpPart => ({ _tag: "IPLit", value });
export const IPExpr = (expr: Expr): InterpPart => ({ _tag: "IPExpr", expr });
export const PWild = (span: Span): Pattern => ({ _tag: "PWild", span });
export const PUnit = (span: Span): Pattern => ({ _tag: "PUnit", span });
export const PBind = _curry(2, (name, span) => ({ _tag: "PBind", name, span })) as (
  name: string,
  span: Span,
) => Pattern;
export const PAs = _curry(4, (pat, name, nameSpan, span) => ({
  _tag: "PAs",
  pat,
  name,
  nameSpan,
  span,
})) as (pat: Pattern, name: string, nameSpan: Span, span: Span) => Pattern;
export const PLit = _curry(3, (value, raw, span) => ({ _tag: "PLit", value, raw, span })) as (
  value: number,
  raw: string,
  span: Span,
) => Pattern;
export const PBool = _curry(2, (value, span) => ({ _tag: "PBool", value, span })) as (
  value: boolean,
  span: Span,
) => Pattern;
export const PStr = _curry(2, (value, span) => ({ _tag: "PStr", value, span })) as (
  value: string,
  span: Span,
) => Pattern;
export const PTuple = _curry(2, (elems, span) => ({ _tag: "PTuple", elems, span })) as (
  elems: Pattern[],
  span: Span,
) => Pattern;
export const PRecord = _curry(2, (fields, span) => ({ _tag: "PRecord", fields, span })) as (
  fields: PatField[],
  span: Span,
) => Pattern;
export const PCtor = _curry(4, (ctor, args, ns, span) => ({
  _tag: "PCtor",
  ctor,
  args,
  ns,
  span,
})) as (ctor: string, args: Pattern[], ns: Option<string>, span: Span) => Pattern;
export const PArr = _curry(3, (elems, rest, span) => ({ _tag: "PArr", elems, rest, span })) as (
  elems: Pattern[],
  rest: Option<Pattern>,
  span: Span,
) => Pattern;
export const PList = _curry(3, (elems, rest, span) => ({ _tag: "PList", elems, rest, span })) as (
  elems: Pattern[],
  rest: Option<Pattern>,
  span: Span,
) => Pattern;
export const POr = _curry(2, (alts, span) => ({ _tag: "POr", alts, span })) as (
  alts: Pattern[],
  span: Span,
) => Pattern;
export const TyName = _curry(2, (name, span) => ({ _tag: "TyName", name, span })) as (
  name: string,
  span: Span,
) => TypeExpr;
export const TyArrow = _curry(3, (from, to, span) => ({ _tag: "TyArrow", from, to, span })) as (
  from: TypeExpr,
  to: TypeExpr,
  span: Span,
) => TypeExpr;
export const TyApp = _curry(3, (ctor, args, span) => ({ _tag: "TyApp", ctor, args, span })) as (
  ctor: string,
  args: TypeExpr[],
  span: Span,
) => TypeExpr;
export const TyTuple = _curry(2, (elems, span) => ({ _tag: "TyTuple", elems, span })) as (
  elems: TypeExpr[],
  span: Span,
) => TypeExpr;
export const TyList = _curry(2, (elem, span) => ({ _tag: "TyList", elem, span })) as (
  elem: TypeExpr,
  span: Span,
) => TypeExpr;
export const TyQual = _curry(5, (alias, name, nameSpan, args, span) => ({
  _tag: "TyQual",
  alias,
  name,
  nameSpan,
  args,
  span,
})) as (alias: string, name: string, nameSpan: Span, args: TypeExpr[], span: Span) => TypeExpr;
export const TyLit = _curry(2, (value, span) => ({ _tag: "TyLit", value, span })) as (
  value: string,
  span: Span,
) => TypeExpr;
export const TyUnion = _curry(2, (members, span) => ({ _tag: "TyUnion", members, span })) as (
  members: TypeExpr[],
  span: Span,
) => TypeExpr;

export const SLet = _curry(7, (name, nameSpan, annot, value, exported, doc, span) => ({
  _tag: "SLet",
  name,
  nameSpan,
  annot,
  value,
  exported,
  doc,
  span,
})) as (
  name: string,
  nameSpan: Span,
  annot: Option<TypeExpr>,
  value: Expr,
  exported: boolean,
  doc: Option<string>,
  span: Span,
) => Stmt;
export const SType = _curry(8, (name, params, ctors, alias, aliasType, exported, doc, span) => ({
  _tag: "SType",
  name,
  params,
  ctors,
  alias,
  aliasType,
  exported,
  doc,
  span,
})) as (
  name: string,
  params: string[],
  ctors: Ctor[],
  alias: Option<AliasField[]>,
  aliasType: Option<TypeExpr>,
  exported: boolean,
  doc: Option<string>,
  span: Span,
) => Stmt;
export const SExtern = _curry(
  10,
  (name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span) => ({
    _tag: "SExtern",
    name,
    nameSpan,
    params,
    typeExpr,
    module,
    imported,
    curried,
    exported,
    doc,
    span,
  }),
) as (
  name: string,
  nameSpan: Span,
  params: string[],
  typeExpr: TypeExpr,
  module: string,
  imported: string,
  curried: boolean,
  exported: boolean,
  doc: Option<string>,
  span: Span,
) => Stmt;
export const SImport = _curry(3, (names, from, span) => ({
  _tag: "SImport",
  names,
  from,
  span,
})) as (names: Name[], from: string, span: Span) => Stmt;
export const SImportNs = _curry(3, (alias, from, span) => ({
  _tag: "SImportNs",
  alias,
  from,
  span,
})) as (alias: Name, from: string, span: Span) => Stmt;
export const SExpr = _curry(2, (value, span) => ({ _tag: "SExpr", value, span })) as (
  value: Expr,
  span: Span,
) => Stmt;
export const SError = (span: Span): Stmt => ({ _tag: "SError", span });
