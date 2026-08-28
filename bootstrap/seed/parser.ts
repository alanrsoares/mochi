import type {
  AliasField,
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
  Span,
  Stmt,
  TypeExpr,
} from "./ast";
import type { St, Ty } from "./types";

export type Option<A> = { _tag: "Some"; value: A } | { _tag: "None" };
export type Result<A, B> = { _tag: "Ok"; value: A } | { _tag: "Err"; error: B };
export type Tok =
  | { _tag: "TLet" }
  | { _tag: "TType" }
  | { _tag: "TExtern" }
  | { _tag: "TSwitch" }
  | { _tag: "TLoop" }
  | { _tag: "TRecur" }
  | { _tag: "TDo" }
  | { _tag: "TImport" }
  | { _tag: "TExport" }
  | { _tag: "TEq" }
  | { _tag: "TArrow" }
  | { _tag: "TTarrow" }
  | { _tag: "TPipe" }
  | { _tag: "TCompose" }
  | { _tag: "TConcat" }
  | { _tag: "TBar" }
  | { _tag: "TLparen" }
  | { _tag: "TRparen" }
  | { _tag: "TLbrace" }
  | { _tag: "TRbrace" }
  | { _tag: "TLbracket" }
  | { _tag: "TRbracket" }
  | { _tag: "TSpread" }
  | { _tag: "TPlus" }
  | { _tag: "TMinus" }
  | { _tag: "TStar" }
  | { _tag: "TSlash" }
  | { _tag: "TPercent" }
  | { _tag: "TAt" }
  | { _tag: "THash" }
  | { _tag: "TDot" }
  | { _tag: "TColon" }
  | { _tag: "TQuestion" }
  | { _tag: "TEqeq" }
  | { _tag: "TNeq" }
  | { _tag: "TLte" }
  | { _tag: "TGte" }
  | { _tag: "TLt" }
  | { _tag: "TGt" }
  | { _tag: "TAndand" }
  | { _tag: "TOror" }
  | { _tag: "TBang" }
  | { _tag: "TBacktick" }
  | { _tag: "TComma" }
  | { _tag: "TSemi" }
  | { _tag: "TNum"; value: number; raw: string }
  | { _tag: "TBool"; value: boolean }
  | { _tag: "TStr"; value: string }
  | { _tag: "TTmplStart"; value: string }
  | { _tag: "TTmplMid"; value: string }
  | { _tag: "TTmplEnd"; value: string }
  | { _tag: "TId"; value: string }
  | { _tag: "TEof" };
export type LocTok = { tok: Tok; start: number; end: number; doc: Option<string> };
export type PErr = { message: string; start: number; end: number };

import {
  _curry,
  _recur,
  _done,
  Some,
  None,
  Ok,
  Err,
  add,
  sub,
  eq,
  show,
  lt,
  gt,
  gte,
  lte,
  not,
  and,
  or,
  length,
  map,
  _Option_exists,
  _Option_unwrapOr,
  _Result_map,
  _Result_flatMap,
  _Array_get,
  _Array_concat,
  _Array_append,
  _Array_prepend,
  _Str_codeAt,
  _tuple,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

const TLet: Tok = { _tag: "TLet" };
const TType: Tok = { _tag: "TType" };
const TExtern: Tok = { _tag: "TExtern" };
const TSwitch: Tok = { _tag: "TSwitch" };
const TLoop: Tok = { _tag: "TLoop" };
const TRecur: Tok = { _tag: "TRecur" };
const TDo: Tok = { _tag: "TDo" };
const TImport: Tok = { _tag: "TImport" };
const TEq: Tok = { _tag: "TEq" };
const TArrow: Tok = { _tag: "TArrow" };
const TTarrow: Tok = { _tag: "TTarrow" };
const TPipe: Tok = { _tag: "TPipe" };
const TCompose: Tok = { _tag: "TCompose" };
const TConcat: Tok = { _tag: "TConcat" };
const TBar: Tok = { _tag: "TBar" };
const TLparen: Tok = { _tag: "TLparen" };
const TRparen: Tok = { _tag: "TRparen" };
const TLbrace: Tok = { _tag: "TLbrace" };
const TRbrace: Tok = { _tag: "TRbrace" };
const TLbracket: Tok = { _tag: "TLbracket" };
const TRbracket: Tok = { _tag: "TRbracket" };
const TSpread: Tok = { _tag: "TSpread" };
const TPlus: Tok = { _tag: "TPlus" };
const TMinus: Tok = { _tag: "TMinus" };
const TStar: Tok = { _tag: "TStar" };
const TSlash: Tok = { _tag: "TSlash" };
const TPercent: Tok = { _tag: "TPercent" };
const TAt: Tok = { _tag: "TAt" };
const THash: Tok = { _tag: "THash" };
const TDot: Tok = { _tag: "TDot" };
const TColon: Tok = { _tag: "TColon" };
const TQuestion: Tok = { _tag: "TQuestion" };
const TNeq: Tok = { _tag: "TNeq" };
const TLt: Tok = { _tag: "TLt" };
const TGt: Tok = { _tag: "TGt" };
const TAndand: Tok = { _tag: "TAndand" };
const TOror: Tok = { _tag: "TOror" };
const TBang: Tok = { _tag: "TBang" };
const TBacktick: Tok = { _tag: "TBacktick" };
const TComma: Tok = { _tag: "TComma" };
const TSemi: Tok = { _tag: "TSemi" };
const TId = (value: string): Tok => ({ _tag: "TId", value });
const TEof: Tok = { _tag: "TEof" };
import * as Ast from "./ast";
import { parseHooksOf, resolvePluginsDefault, runParseHooks } from "./extensions";

const tokName: (t: Tok) => string = (t: Tok) =>
  match(t)
    .with({ _tag: "TLet" }, () => "let")
    .with({ _tag: "TType" }, () => "type")
    .with({ _tag: "TExtern" }, () => "extern")
    .with({ _tag: "TSwitch" }, () => "switch")
    .with({ _tag: "TLoop" }, () => "loop")
    .with({ _tag: "TRecur" }, () => "recur")
    .with({ _tag: "TDo" }, () => "do")
    .with({ _tag: "TImport" }, () => "import")
    .with({ _tag: "TExport" }, () => "export")
    .with({ _tag: "TEq" }, () => "eq")
    .with({ _tag: "TArrow" }, () => "arrow")
    .with({ _tag: "TTarrow" }, () => "tarrow")
    .with({ _tag: "TPipe" }, () => "pipe")
    .with({ _tag: "TCompose" }, () => "compose")
    .with({ _tag: "TConcat" }, () => "concat")
    .with({ _tag: "TBar" }, () => "bar")
    .with({ _tag: "TLparen" }, () => "lparen")
    .with({ _tag: "TRparen" }, () => "rparen")
    .with({ _tag: "TLbrace" }, () => "lbrace")
    .with({ _tag: "TRbrace" }, () => "rbrace")
    .with({ _tag: "TLbracket" }, () => "lbracket")
    .with({ _tag: "TRbracket" }, () => "rbracket")
    .with({ _tag: "TSpread" }, () => "spread")
    .with({ _tag: "TPlus" }, () => "plus")
    .with({ _tag: "TMinus" }, () => "minus")
    .with({ _tag: "TStar" }, () => "star")
    .with({ _tag: "TSlash" }, () => "slash")
    .with({ _tag: "TPercent" }, () => "percent")
    .with({ _tag: "TAt" }, () => "at")
    .with({ _tag: "THash" }, () => "hash")
    .with({ _tag: "TDot" }, () => "dot")
    .with({ _tag: "TColon" }, () => "colon")
    .with({ _tag: "TQuestion" }, () => "question")
    .with({ _tag: "TEqeq" }, () => "eqeq")
    .with({ _tag: "TNeq" }, () => "neq")
    .with({ _tag: "TLte" }, () => "lte")
    .with({ _tag: "TGte" }, () => "gte")
    .with({ _tag: "TLt" }, () => "lt")
    .with({ _tag: "TGt" }, () => "gt")
    .with({ _tag: "TAndand" }, () => "andand")
    .with({ _tag: "TOror" }, () => "oror")
    .with({ _tag: "TBang" }, () => "bang")
    .with({ _tag: "TBacktick" }, () => "backtick")
    .with({ _tag: "TComma" }, () => "comma")
    .with({ _tag: "TSemi" }, () => "semi")
    .with({ _tag: "TNum" }, () => "num")
    .with({ _tag: "TBool" }, () => "bool")
    .with({ _tag: "TStr" }, () => "str")
    .with({ _tag: "TTmplStart" }, () => "tmplstart")
    .with({ _tag: "TTmplMid" }, () => "tmplmid")
    .with({ _tag: "TTmplEnd" }, () => "tmplend")
    .with({ _tag: "TId" }, () => "id")
    .with({ _tag: "TEof" }, () => "eof")
    .exhaustive();
const eofTok = { tok: TEof as Tok, start: 0, end: 0, doc: None };
const tokAt: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  i: number,
) => { tok: Tok; start: number; end: number; doc: Option<A> } = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], i: number) =>
    _Option_unwrapOr(eofTok, _Array_get(i, toks)),
);
const spanOf: <A, B, C>(lt: { end: A; start: B } & C) => { start: B; end: A } = <A, B, C>(
  lt: { end: A; start: B } & C,
) => ({ start: lt.start, end: lt.end });
const spanning: <A, B, C, D>(a: { start: A } & C, b: { end: B } & D) => { start: A; end: B } =
  _curry(2, <A, B, C, D>(a: { start: A } & C, b: { end: B } & D) => ({
    start: a.start,
    end: b.end,
  }));
const toEnd: <A, B, C>(
  start: { start: A } & C,
  toks: { tok: Tok; start: number; end: number; doc: Option<B> }[],
  pos: number,
) => { start: A; end: number } = _curry(
  3,
  <A, B, C>(
    start: { start: A } & C,
    toks: { tok: Tok; start: number; end: number; doc: Option<B> }[],
    pos: number,
  ) => ({ start: start.start, end: tokAt(toks, sub(pos, 1)).end }),
);
const errAt: <A, B, C, D, E>(
  message: A,
  lt: { end: B; start: C } & E,
) => Result<D, { message: A; start: C; end: B }> = _curry(
  2,
  <A, B, C, D, E>(message: A, lt: { end: B; start: C } & E) =>
    Err({ message: message, start: lt.start, end: lt.end }),
);
const expectTok: <A>(
  t: Tok,
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<number, PErr> = _curry(
  3,
  <A>(t: Tok, toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const lt = tokAt(toks, pos);
    return eq(lt.tok, t)
      ? (Ok(add(pos, 1)) as Result<number, PErr>)
      : errAt(`expected ${tokName(t)}, got ${tokName(lt.tok)}`, lt);
  },
);
const expectId: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[Name, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const lt = tokAt(toks, pos);
    return match(lt.tok)
      .with(
        { _tag: "TId" },
        ({ value: name }) =>
          Ok(_tuple({ name: name, span: spanOf(lt) }, add(pos, 1))) as Result<[Name, number], PErr>,
      )
      .otherwise((t) => errAt(`expected id, got ${tokName(t)}`, lt));
  },
);
const keywordText: (t: Tok) => Option<string> = (t: Tok) =>
  match(t)
    .with({ _tag: "TLet" }, () => Some("let") as Option<string>)
    .with({ _tag: "TType" }, () => Some("type") as Option<string>)
    .with({ _tag: "TExtern" }, () => Some("extern") as Option<string>)
    .with({ _tag: "TSwitch" }, () => Some("switch") as Option<string>)
    .with({ _tag: "TLoop" }, () => Some("loop") as Option<string>)
    .with({ _tag: "TRecur" }, () => Some("recur") as Option<string>)
    .with({ _tag: "TDo" }, () => Some("do") as Option<string>)
    .with({ _tag: "TImport" }, () => Some("import") as Option<string>)
    .with({ _tag: "TExport" }, () => Some("export") as Option<string>)
    .otherwise(() => None as Option<string>);
const expectLabel: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[Name, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const lt = tokAt(toks, pos);
    return match(keywordText(lt.tok))
      .with(
        { _tag: "Some" },
        ({ value: name }) =>
          Ok(_tuple({ name: name, span: spanOf(lt) }, add(pos, 1))) as Result<[Name, number], PErr>,
      )
      .with({ _tag: "None" }, () => expectId(toks, pos))
      .exhaustive();
  },
);
const expectStr: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[string, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const lt = tokAt(toks, pos);
    return match(lt.tok)
      .with(
        { _tag: "TStr" },
        ({ value }) => Ok(_tuple(value, add(pos, 1))) as Result<[string, number], PErr>,
      )
      .otherwise((t) => errAt(`expected str, got ${tokName(t)}`, lt));
  },
);
const expectIn: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<number, PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) =>
    _Result_flatMap(
      ([kw, p]) =>
        eq(kw.name, "in")
          ? (Ok(p) as Result<number, PErr>)
          : errAt(`expected 'in' after let binding, got '${kw.name}'`, tokAt(toks, p)),
      expectId(toks, pos),
    ),
);
const isUpper: (s: string) => boolean = (s: string) =>
  _Option_exists((n: number) => and(gte(n, 65), lte(n, 90)), _Str_codeAt(0, s));
const sepBy: <A, B, C>(
  parseItem: (
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
  ) => Result<[B, number], C>,
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: B[],
) => Result<[B[], number], C> = _curry(
  4,
  <A, B, C>(
    parseItem: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[B, number], C>,
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    acc: B[],
  ) =>
    _Result_flatMap(
      ([item, p]: [B, number]) => {
        const items = _Array_append(item, acc);
        return eq(tokAt(toks, p).tok, TComma as Tok)
          ? sepBy(parseItem, toks, add(p, 1), items)
          : Ok(_tuple(items, p));
      },
      parseItem(toks, pos),
    ),
);
const sepByH: <A, B, C, D>(
  parseItem: (
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: B,
  ) => Result<[C, number], D>,
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: C[],
  hooks: B,
) => Result<[C[], number], D> = _curry(
  5,
  <A, B, C, D>(
    parseItem: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: B,
    ) => Result<[C, number], D>,
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    acc: C[],
    hooks: B,
  ) =>
    _Result_flatMap(
      ([item, p]: [C, number]) => {
        const items = _Array_append(item, acc);
        return eq(tokAt(toks, p).tok, TComma as Tok)
          ? sepByH(parseItem, toks, add(p, 1), items, hooks)
          : Ok(_tuple(items, p));
      },
      parseItem(toks, pos, hooks),
    ),
);
const listUntil: <A, B, C>(
  close: Tok,
  parseItem: (
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
  ) => Result<[B, number], C>,
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[B[], number], C> = _curry(
  4,
  <A, B, C>(
    close: Tok,
    parseItem: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[B, number], C>,
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
  ) =>
    eq(tokAt(toks, pos).tok, close)
      ? Ok(_tuple([] as B[], pos))
      : sepBy(parseItem, toks, pos, [] as B[]),
);
const listUntilH: <A, B, C, D>(
  close: Tok,
  parseItem: (
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: B,
  ) => Result<[C, number], D>,
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: B,
) => Result<[C[], number], D> = _curry(
  5,
  <A, B, C, D>(
    close: Tok,
    parseItem: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: B,
    ) => Result<[C, number], D>,
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: B,
  ) =>
    eq(tokAt(toks, pos).tok, close)
      ? Ok(_tuple([] as C[], pos))
      : sepByH(parseItem, toks, pos, [] as C[], hooks),
);
const scanLambdaDepth: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  k: number,
  depth: number,
) => boolean = _curry(
  3,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], k: number, depth: number) =>
    match(tokAt(toks, k).tok)
      .with({ _tag: "TLparen" }, () => scanLambdaDepth(toks, add(k, 1), add(depth, 1)))
      .with({ _tag: "TRparen" }, () =>
        eq(depth, 1)
          ? eq(tokAt(toks, add(k, 1)).tok, TArrow as Tok)
          : scanLambdaDepth(toks, add(k, 1), sub(depth, 1)),
      )
      .with({ _tag: "TEof" }, () => false)
      .otherwise(() => scanLambdaDepth(toks, add(k, 1), depth)),
);
const looksLikeLambda: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => boolean = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) =>
    match(tokAt(toks, pos).tok)
      .with({ _tag: "TId" }, () => eq(tokAt(toks, add(pos, 1)).tok, TArrow as Tok))
      .with({ _tag: "TLparen" }, () => scanLambdaDepth(toks, pos, 0))
      .otherwise(() => false),
);
const exprSpan: (e: Expr) => Span = (e: Expr) =>
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
const tySpan: (t: TypeExpr) => Span = (t: TypeExpr) =>
  match(t)
    .with({ _tag: "TyName" }, ({ span: sp }) => sp)
    .with({ _tag: "TyArrow" }, ({ span: sp }) => sp)
    .with({ _tag: "TyApp" }, ({ span: sp }) => sp)
    .with({ _tag: "TyTuple" }, ({ span: sp }) => sp)
    .with({ _tag: "TyList" }, ({ span: sp }) => sp)
    .with({ _tag: "TyQual" }, ({ span: sp }) => sp)
    .with({ _tag: "TyLit" }, ({ span: sp }) => sp)
    .with({ _tag: "TyUnion" }, ({ span: sp }) => sp)
    .exhaustive();
const parseParam: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[LamParam, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) =>
    match(tokAt(toks, pos).tok)
      .with({ _tag: "TLbrace" }, () =>
        _Result_flatMap(
          ([fields, p]) =>
            _Result_flatMap(
              (p2) =>
                Ok(_tuple(Ast.LPRecord(map((f: Name) => f.name, fields)), p2)) as Result<
                  [LamParam, number],
                  PErr
                >,
              expectTok(TRbrace as Tok, toks, p),
            ),
          listUntil(TRbrace as Tok, expectId, toks, add(pos, 1)),
        ),
      )
      .with({ _tag: "TLparen" }, () =>
        _Result_flatMap(
          ([names, p]) =>
            _Result_flatMap(
              (p2) =>
                Ok(
                  match(names)
                    .with(
                      (_v) => {
                        const _g: any = _v;
                        return _g.length === 1;
                      },
                      ([single]) => _tuple(Ast.LPName(single.name, None as Option<TypeExpr>), p2),
                    )
                    .otherwise((many) => _tuple(Ast.LPTuple(map((n: Name) => n.name, many)), p2)),
                ) as Result<[LamParam, number], PErr>,
              expectTok(TRparen as Tok, toks, p),
            ),
          sepBy(expectId, toks, add(pos, 1), [] as Name[]),
        ),
      )
      .otherwise(() =>
        _Result_flatMap(
          ([nm, p]) =>
            eq(tokAt(toks, p).tok, TColon as Tok)
              ? _Result_map(
                  ([annot, p2]: [TypeExpr, number]) =>
                    _tuple(Ast.LPName(nm.name, Some(annot) as Option<TypeExpr>), p2),
                  parseTypeExpr(toks, add(p, 1)),
                )
              : (Ok(_tuple(Ast.LPName(nm.name, None as Option<TypeExpr>), p)) as Result<
                  [LamParam, number],
                  PErr
                >),
          expectId(toks, pos),
        ),
      ),
);
const parseLambda: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return match(tokAt(toks, pos).tok)
      .with({ _tag: "TId" }, ({ value: name }) =>
        _Result_flatMap(
          (p) =>
            _Result_flatMap(
              ([body, p2]) =>
                Ok(
                  _tuple(
                    Ast.ELambda(
                      [Ast.LPName(name, None as Option<TypeExpr>)],
                      body,
                      spanning(start, exprSpan(body)),
                    ),
                    p2,
                  ),
                ) as Result<[Expr, number], PErr>,
              parseLambdaBody(toks, p, hooks),
            ),
          expectTok(TArrow as Tok, toks, add(pos, 1)),
        ),
      )
      .otherwise(() =>
        _Result_flatMap(
          (p) =>
            _Result_flatMap(
              ([params, p2]) =>
                _Result_flatMap(
                  (p3) =>
                    _Result_flatMap(
                      (p4) =>
                        _Result_flatMap(
                          ([body, p5]) =>
                            Ok(
                              _tuple(
                                Ast.ELambda(params, body, spanning(start, exprSpan(body))),
                                p5,
                              ),
                            ) as Result<[Expr, number], PErr>,
                          parseLambdaBody(toks, p4, hooks),
                        ),
                      expectTok(TArrow as Tok, toks, p3),
                    ),
                  expectTok(TRparen as Tok, toks, p2),
                ),
              listUntil(TRparen as Tok, parseParam, toks, p),
            ),
          expectTok(TLparen as Tok, toks, pos),
        ),
      );
  },
);
const parseLambdaBody: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    and(eq(tokAt(toks, pos).tok, TLbrace as Tok), arrowBodyIsDoBlock(toks, pos, 0))
      ? parseDoBlock(toks, pos, hooks)
      : parseExpr(toks, pos, hooks),
);
const arrowBodyIsDoBlock: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  depth: number,
) => boolean = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    depth: number,
  ) =>
    match(tokAt(toks, pos).tok)
      .with({ _tag: "TLbrace" }, () => arrowBodyIsDoBlock(toks, add(pos, 1), add(depth, 1)))
      .with({ _tag: "TRbrace" }, () =>
        eq(depth, 1) ? false : arrowBodyIsDoBlock(toks, add(pos, 1), sub(depth, 1)),
      )
      .with({ _tag: "TSemi" }, () => or(eq(depth, 1), arrowBodyIsDoBlock(toks, add(pos, 1), depth)))
      .with({ _tag: "TEof" }, () => false)
      .otherwise(() => arrowBodyIsDoBlock(toks, add(pos, 1), depth)),
);
const parseLetIn: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        or(eq(tokAt(toks, p).tok, TQuestion as Tok), eq(tokAt(toks, p).tok, TBang as Tok))
          ? ((monad: string) =>
              ((paramSpan: Span) =>
                _Result_flatMap(
                  ([param, p1]) =>
                    _Result_flatMap(
                      (p2) =>
                        _Result_flatMap(
                          ([value, p3]) =>
                            _Result_flatMap(
                              (p4) =>
                                _Result_flatMap(
                                  ([body, p5]) =>
                                    Ok(
                                      _tuple(
                                        Ast.ELetBind(
                                          param,
                                          paramSpan,
                                          monad,
                                          value,
                                          body,
                                          spanning(start, exprSpan(body)),
                                        ),
                                        p5,
                                      ),
                                    ) as Result<[Expr, number], PErr>,
                                  parseExpr(toks, p4, hooks),
                                ),
                              expectIn(toks, p3),
                            ),
                          parseExpr(toks, p2, hooks),
                        ),
                      expectTok(TEq as Tok, toks, p1),
                    ),
                  parseParam(toks, add(p, 1)),
                ))(spanOf(tokAt(toks, add(p, 1)))))(
              eq(tokAt(toks, p).tok, TQuestion as Tok) ? "Result" : "Task",
            )
          : eq(tokAt(toks, p).tok, TLparen as Tok)
            ? ((paramStart: Span) =>
                _Result_flatMap(
                  ([param, p1]) =>
                    _Result_flatMap(
                      (p2) =>
                        _Result_flatMap(
                          ([value, p3]) =>
                            _Result_flatMap(
                              (p4) =>
                                _Result_flatMap(
                                  ([body, p5]) =>
                                    ((fn: Expr) =>
                                      Ok(
                                        _tuple(
                                          Ast.ECall(
                                            fn,
                                            [value],
                                            None as Option<string>,
                                            spanning(start, exprSpan(body)),
                                          ),
                                          p5,
                                        ),
                                      ) as Result<[Expr, number], PErr>)(
                                      Ast.ELambda(
                                        [param],
                                        body,
                                        spanning(paramStart, exprSpan(body)),
                                      ),
                                    ),
                                  parseExpr(toks, p4, hooks),
                                ),
                              expectIn(toks, p3),
                            ),
                          parseExpr(toks, p2, hooks),
                        ),
                      expectTok(TEq as Tok, toks, p1),
                    ),
                  parseParam(toks, p),
                ))(spanOf(tokAt(toks, p)))
            : _Result_flatMap(
                ([nm, p1]) =>
                  _Result_flatMap(
                    (p2) =>
                      _Result_flatMap(
                        ([value, p3]) =>
                          _Result_flatMap(
                            (p4) =>
                              _Result_flatMap(
                                ([body, p5]) =>
                                  Ok(
                                    _tuple(
                                      Ast.ELetIn(
                                        nm.name,
                                        nm.span,
                                        value,
                                        body,
                                        spanning(start, exprSpan(body)),
                                      ),
                                      p5,
                                    ),
                                  ) as Result<[Expr, number], PErr>,
                                parseExpr(toks, p4, hooks),
                              ),
                            expectIn(toks, p3),
                          ),
                        parseExpr(toks, p2, hooks),
                      ),
                    expectTok(TEq as Tok, toks, p1),
                  ),
                expectId(toks, p),
              ),
      expectTok(TLet as Tok, toks, pos),
    );
  },
);
const PIPE_BP: number = 5;
const COMPOSE_BP: number = 6;
const OR_BP: number = 7;
const AND_BP: number = 7;
const CMP_BP: number = 8;
const CONCAT_BP: number = 10;
const ADD_BP: number = 10;
const BACKTICK_BP: number = 15;
const MUL_BP: number = 20;
const FAST_PIPE_BP: number = 21;
const mkBinCall: {
  (fnName: string): (opSpan: Span) => (left: Expr) => (right: Expr) => Expr;
  (fnName: string): (opSpan: Span) => (left: Expr, right: Expr) => Expr;
  (fnName: string): (opSpan: Span, left: Expr) => (right: Expr) => Expr;
  (fnName: string, opSpan: Span): (left: Expr) => (right: Expr) => Expr;
  (fnName: string): (opSpan: Span, left: Expr, right: Expr) => Expr;
  (fnName: string, opSpan: Span): (left: Expr, right: Expr) => Expr;
  (fnName: string, opSpan: Span, left: Expr): (right: Expr) => Expr;
  (fnName: string, opSpan: Span, left: Expr, right: Expr): Expr;
} = _curry(4, (fnName: string, opSpan: Span, left: Expr, right: Expr) =>
  Ast.ECall(
    Ast.ERef(fnName, opSpan),
    [left, right],
    None as Option<string>,
    spanning(exprSpan(left), exprSpan(right)),
  ),
);
const opFnName: (t: Tok) => string = (t: Tok) =>
  match(t)
    .with({ _tag: "TPlus" }, () => "add")
    .with({ _tag: "TMinus" }, () => "sub")
    .with({ _tag: "TStar" }, () => "mul")
    .with({ _tag: "TSlash" }, () => "div")
    .with({ _tag: "TPercent" }, () => "mod")
    .with({ _tag: "TAndand" }, () => "and")
    .with({ _tag: "TOror" }, () => "or")
    .with({ _tag: "TConcat" }, () => "concat")
    .with({ _tag: "TEqeq" }, () => "eq")
    .with({ _tag: "TLt" }, () => "lt")
    .with({ _tag: "TLte" }, () => "lte")
    .with({ _tag: "TGt" }, () => "gt")
    .with({ _tag: "TGte" }, () => "gte")
    .otherwise(() => "eq");
const isSectionOp: (t: Tok) => boolean = (t: Tok) =>
  match(t)
    .with({ _tag: "TPlus" }, () => true)
    .with({ _tag: "TMinus" }, () => true)
    .with({ _tag: "TStar" }, () => true)
    .with({ _tag: "TSlash" }, () => true)
    .with({ _tag: "TPercent" }, () => true)
    .with({ _tag: "TAndand" }, () => true)
    .with({ _tag: "TOror" }, () => true)
    .with({ _tag: "TConcat" }, () => true)
    .with({ _tag: "TEqeq" }, () => true)
    .with({ _tag: "TNeq" }, () => true)
    .with({ _tag: "TLt" }, () => true)
    .with({ _tag: "TLte" }, () => true)
    .with({ _tag: "TGt" }, () => true)
    .with({ _tag: "TGte" }, () => true)
    .otherwise(() => false);
const sectionBody: {
  (opTok: Tok): (x: Expr) => (y: Expr) => (opSpan: Span) => Expr;
  (opTok: Tok): (x: Expr) => (y: Expr, opSpan: Span) => Expr;
  (opTok: Tok): (x: Expr, y: Expr) => (opSpan: Span) => Expr;
  (opTok: Tok, x: Expr): (y: Expr) => (opSpan: Span) => Expr;
  (opTok: Tok): (x: Expr, y: Expr, opSpan: Span) => Expr;
  (opTok: Tok, x: Expr): (y: Expr, opSpan: Span) => Expr;
  (opTok: Tok, x: Expr, y: Expr): (opSpan: Span) => Expr;
  (opTok: Tok, x: Expr, y: Expr, opSpan: Span): Expr;
} = _curry(4, (opTok: Tok, x: Expr, y: Expr, opSpan: Span) => {
  const full: Span = spanning(exprSpan(x), exprSpan(y));
  return eq(opTok, TNeq as Tok)
    ? Ast.ECall(
        Ast.ERef("not", opSpan),
        [mkBinCall("eq", opSpan, x, y)],
        None as Option<string>,
        full,
      )
    : mkBinCall(opFnName(opTok), opSpan, x, y);
});
const sectionLeft: <A>(provided: Expr, opLt: { end: number; start: number; tok: Tok } & A) => Expr =
  _curry(2, <A>(provided: Expr, opLt: { end: number; start: number; tok: Tok } & A) => {
    const opSpan: Span = spanOf(opLt);
    const paramRef: Expr = Ast.ERef("$s", opSpan);
    return Ast.ELambda(
      [Ast.LPName("$s", None as Option<TypeExpr>)],
      sectionBody(opLt.tok, provided, paramRef, opSpan),
      spanning(exprSpan(provided), opSpan),
    );
  });
const parseRightSection: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  lparenSpan: Span,
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  4,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    lparenSpan: Span,
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const lt = tokAt(toks, pos);
    return _Result_flatMap(
      ([y, p1]) =>
        _Result_flatMap(
          (p2) =>
            ((paramRef: Expr) =>
              Ok(
                _tuple(
                  Ast.ELambda(
                    [Ast.LPName("$s", None as Option<TypeExpr>)],
                    sectionBody(lt.tok, paramRef, y, spanOf(lt)),
                    toEnd(lparenSpan, toks, p2),
                  ),
                  p2,
                ),
              ) as Result<[Expr, number], PErr>)(Ast.ERef("$s", spanOf(lt))),
          expectTok(TRparen as Tok, toks, p1),
        ),
      parseExpr(toks, add(pos, 1), hooks),
    );
  },
);
const binCallOrLeftSection: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  left: Expr,
  lt: { end: number; start: number; tok: Tok; doc: Option<A> },
  pos: number,
  bp: number,
  fnName: string,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<{ left: Expr; p: number; matched: boolean }, PErr> = _curry(
  7,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    left: Expr,
    lt: { end: number; start: number; tok: Tok; doc: Option<A> },
    pos: number,
    bp: number,
    fnName: string,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    eq(tokAt(toks, add(pos, 1)).tok, TRparen as Tok)
      ? (Ok({ left: sectionLeft(left, lt), p: add(pos, 1), matched: true }) as Result<
          { left: Expr; p: number; matched: boolean },
          PErr
        >)
      : _Result_flatMap(
          ([right, p]) =>
            Ok({ left: mkBinCall(fnName, spanOf(lt), left, right), p: p, matched: true }) as Result<
              { left: Expr; p: number; matched: boolean },
              PErr
            >,
          parseExprBp(toks, add(bp, 1), add(pos, 1), hooks),
        ),
);
const isCmpTok: (t: Tok) => boolean = (t: Tok) =>
  match(t)
    .with({ _tag: "TEqeq" }, () => true)
    .with({ _tag: "TNeq" }, () => true)
    .with({ _tag: "TLt" }, () => true)
    .with({ _tag: "TLte" }, () => true)
    .with({ _tag: "TGt" }, () => true)
    .with({ _tag: "TGte" }, () => true)
    .otherwise(() => false);
const cmpFnName: (t: Tok) => string = (t: Tok) =>
  match(t)
    .with({ _tag: "TLt" }, () => "lt")
    .with({ _tag: "TLte" }, () => "lte")
    .with({ _tag: "TGt" }, () => "gt")
    .with({ _tag: "TGte" }, () => "gte")
    .otherwise(() => "eq");
const parseInfix: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  minBp: number,
  left: Expr,
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<{ left: Expr; p: number; matched: boolean }, PErr> = _curry(
  5,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    minBp: number,
    left: Expr,
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const lt = tokAt(toks, pos);
    return and(eq(lt.tok, TPipe as Tok), gte(PIPE_BP, minBp))
      ? _Result_flatMap(
          ([right, p]) =>
            Ok({
              left: Ast.EPipe(left, right, spanning(exprSpan(left), exprSpan(right))),
              p: p,
              matched: true,
            }) as Result<{ left: Expr; p: number; matched: boolean }, PErr>,
          parseAtomOrCall(toks, add(pos, 1), hooks),
        )
      : and(eq(lt.tok, TTarrow as Tok), gte(FAST_PIPE_BP, minBp))
        ? _Result_flatMap(
            ([right, p]) =>
              match(right)
                .with(
                  { _tag: "ECall" },
                  ({ fn, args, origin, span: rightSpan }) =>
                    Ok({
                      left: Ast.ECall(
                        fn,
                        _Array_prepend(left, args),
                        origin,
                        spanning(exprSpan(left), rightSpan),
                      ),
                      p: p,
                      matched: true,
                    }) as Result<
                      { left: Expr; p: number; matched: boolean },
                      { message: string; start: number; end: number }
                    >,
                )
                .otherwise(() =>
                  errAt("fast pipe needs a call on the right, like `a -> f(b)`", lt),
                ),
            parseAtomOrCall(toks, add(pos, 1), hooks),
          )
        : and(eq(lt.tok, TCompose as Tok), gte(COMPOSE_BP, minBp))
          ? _Result_flatMap(
              ([right, p]) =>
                ((opSpan: Span) =>
                  ((xRef: Expr) =>
                    ((innerCall: Expr) =>
                      ((outerCall: Expr) =>
                        ((fn: Expr) =>
                          Ok({ left: fn, p: p, matched: true }) as Result<
                            { left: Expr; p: number; matched: boolean },
                            PErr
                          >)(
                          Ast.ELambda(
                            [Ast.LPName("$x", None as Option<TypeExpr>)],
                            outerCall,
                            spanning(exprSpan(left), exprSpan(right)),
                          ),
                        ))(
                        Ast.ECall(
                          right,
                          [innerCall],
                          None as Option<string>,
                          spanning(exprSpan(left), exprSpan(right)),
                        ),
                      ))(Ast.ECall(left, [xRef], None as Option<string>, exprSpan(left))))(
                    Ast.ERef("$x", opSpan),
                  ))(spanOf(lt)),
              parseExprBp(toks, add(COMPOSE_BP, 1), add(pos, 1), hooks),
            )
          : and(isCmpTok(lt.tok), gte(CMP_BP, minBp))
            ? eq(tokAt(toks, add(pos, 1)).tok, TRparen as Tok)
              ? (Ok({ left: sectionLeft(left, lt), p: add(pos, 1), matched: true }) as Result<
                  { left: Expr; p: number; matched: boolean },
                  PErr
                >)
              : _Result_flatMap(
                  ([right, p]) =>
                    ((opSpan: Span) =>
                      ((inner: Expr) =>
                        ((result: Expr) =>
                          Ok({ left: result, p: p, matched: true }) as Result<
                            { left: Expr; p: number; matched: boolean },
                            PErr
                          >)(
                          eq(lt.tok, TNeq as Tok)
                            ? Ast.ECall(
                                Ast.ERef("not", opSpan),
                                [inner],
                                None as Option<string>,
                                spanning(exprSpan(left), exprSpan(right)),
                              )
                            : inner,
                        ))(mkBinCall(cmpFnName(lt.tok), opSpan, left, right)))(spanOf(lt)),
                  parseExprBp(toks, add(CMP_BP, 1), add(pos, 1), hooks),
                )
            : and(
                  or(eq(lt.tok, TAndand as Tok), eq(lt.tok, TOror as Tok)),
                  gte(eq(lt.tok, TAndand as Tok) ? AND_BP : OR_BP, minBp),
                )
              ? ((bp: number) =>
                  ((fnName: string) =>
                    binCallOrLeftSection(toks, left, lt, pos, bp, fnName, hooks))(
                    eq(lt.tok, TAndand as Tok) ? "and" : "or",
                  ))(eq(lt.tok, TAndand as Tok) ? AND_BP : OR_BP)
              : and(eq(lt.tok, TConcat as Tok), gte(CONCAT_BP, minBp))
                ? binCallOrLeftSection(toks, left, lt, pos, CONCAT_BP, "concat", hooks)
                : and(eq(lt.tok, TBacktick as Tok), gte(BACKTICK_BP, minBp))
                  ? _Result_flatMap(
                      ([fnExpr, p1]) =>
                        _Result_flatMap(
                          (p2) =>
                            _Result_flatMap(
                              ([right, p3]) =>
                                Ok({
                                  left: Ast.ECall(
                                    fnExpr,
                                    [left, right],
                                    None as Option<string>,
                                    spanning(exprSpan(left), exprSpan(right)),
                                  ),
                                  p: p3,
                                  matched: true,
                                }) as Result<{ left: Expr; p: number; matched: boolean }, PErr>,
                              parseExprBp(toks, add(BACKTICK_BP, 1), p2, hooks),
                            ),
                          expectTok(TBacktick as Tok, toks, p1),
                        ),
                      parseAtomOrCall(toks, add(pos, 1), hooks),
                    )
                  : and(or(eq(lt.tok, TPlus as Tok), eq(lt.tok, TMinus as Tok)), gte(ADD_BP, minBp))
                    ? ((fnName: string) =>
                        binCallOrLeftSection(toks, left, lt, pos, ADD_BP, fnName, hooks))(
                        eq(lt.tok, TPlus as Tok) ? "add" : "sub",
                      )
                    : and(
                          or(
                            eq(lt.tok, TStar as Tok),
                            or(eq(lt.tok, TSlash as Tok), eq(lt.tok, TPercent as Tok)),
                          ),
                          gte(MUL_BP, minBp),
                        )
                      ? ((fnName: string) =>
                          binCallOrLeftSection(toks, left, lt, pos, MUL_BP, fnName, hooks))(
                          eq(lt.tok, TStar as Tok)
                            ? "mul"
                            : eq(lt.tok, TSlash as Tok)
                              ? "div"
                              : "mod",
                        )
                      : (Ok({ left: left, p: pos, matched: false }) as Result<
                          { left: Expr; p: number; matched: boolean },
                          PErr
                        >);
  },
);
const infixLoop: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  minBp: number,
  left: Expr,
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  5,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    minBp: number,
    left: Expr,
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    _Result_flatMap(
      (res) =>
        res.matched
          ? infixLoop(toks, minBp, res.left, res.p, hooks)
          : (Ok(_tuple(res.left, res.p)) as Result<[Expr, number], PErr>),
      parseInfix(toks, minBp, left, pos, hooks),
    ),
);
const ternaryTail: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  cond: Expr,
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  4,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    cond: Expr,
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    eq(tokAt(toks, pos).tok, TQuestion as Tok)
      ? _Result_flatMap(
          ([thenE, p1]) =>
            _Result_flatMap(
              (p2) =>
                _Result_flatMap(
                  ([elseE, p3]) =>
                    Ok(
                      _tuple(
                        Ast.ETernary(cond, thenE, elseE, spanning(exprSpan(cond), exprSpan(elseE))),
                        p3,
                      ),
                    ) as Result<[Expr, number], PErr>,
                  parseExpr(toks, p2, hooks),
                ),
              expectTok(TColon as Tok, toks, p1),
            ),
          parseExpr(toks, add(pos, 1), hooks),
        )
      : (Ok(_tuple(cond, pos)) as Result<[Expr, number], PErr>),
);
const parseExprBp: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  minBp: number,
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  4,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    minBp: number,
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    match(tokAt(toks, pos).tok)
      .with({ _tag: "TLet" }, () => parseLetIn(toks, pos, hooks))
      .otherwise(() =>
        and(eq(minBp, 0), looksLikeLambda(toks, pos))
          ? parseLambda(toks, pos, hooks)
          : _Result_flatMap(
              ([left, p]) =>
                _Result_flatMap(
                  ([left2, p2]) =>
                    eq(minBp, 0)
                      ? ternaryTail(toks, left2, p2, hooks)
                      : (Ok(_tuple(left2, p2)) as Result<[Expr, number], PErr>),
                  infixLoop(toks, minBp, left, p, hooks),
                ),
              parseAtomOrCall(toks, pos, hooks),
            ),
      ),
);
const parseExpr: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => parseExprBp(toks, 0, pos, hooks),
);
const postfixLoop: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  e: Expr,
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  4,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    e: Expr,
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    match(tokAt(toks, pos).tok)
      .with({ _tag: "TLparen" }, () =>
        _Result_flatMap(
          ([args, p]) =>
            _Result_flatMap(
              (p2) =>
                postfixLoop(
                  toks,
                  Ast.ECall(e, args, None as Option<string>, toEnd(exprSpan(e), toks, p2)),
                  p2,
                  hooks,
                ),
              expectTok(TRparen as Tok, toks, p),
            ),
          listUntilH(TRparen as Tok, parseExpr, toks, add(pos, 1), hooks),
        ),
      )
      .with({ _tag: "TDot" }, () =>
        _Result_flatMap(
          ([id, p]) =>
            postfixLoop(toks, Ast.EField(e, id.name, spanning(exprSpan(e), id.span)), p, hooks),
          expectLabel(toks, add(pos, 1)),
        ),
      )
      .otherwise(() => Ok(_tuple(e, pos)) as Result<[Expr, number], PErr>),
);
const parseAtomOrCall: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const lt = tokAt(toks, pos);
    return or(eq(lt.tok, TMinus as Tok), eq(lt.tok, TBang as Tok))
      ? _Result_flatMap(
          ([operand, p]) =>
            ((fnName: string) =>
              Ok(
                _tuple(
                  Ast.ECall(
                    Ast.ERef(fnName, spanOf(lt)),
                    [operand],
                    None as Option<string>,
                    spanning(spanOf(lt), exprSpan(operand)),
                  ),
                  p,
                ),
              ) as Result<[Expr, number], PErr>)(eq(lt.tok, TMinus as Tok) ? "negate" : "not"),
          parseAtomOrCall(toks, add(pos, 1), hooks),
        )
      : _Result_flatMap(([e, p]) => postfixLoop(toks, e, p, hooks), parseAtom(toks, pos, hooks));
  },
);
const parseAtom: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const lt = tokAt(toks, pos);
    const sp: Span = spanOf(lt);
    return match(lt.tok)
      .with({ _tag: "TSwitch" }, () => parseMatch(toks, pos, hooks))
      .with({ _tag: "TDo" }, () => parseDo(toks, pos, hooks))
      .with({ _tag: "TLoop" }, () => parseLoop(toks, pos, hooks))
      .with({ _tag: "TRecur" }, () => parseRecur(toks, pos, hooks))
      .with({ _tag: "TLbrace" }, () => parseRecord(toks, pos, hooks))
      .with({ _tag: "TLbracket" }, () => parseArr(toks, pos, hooks))
      .with({ _tag: "TAt" }, () => parseList(toks, pos, hooks))
      .with({ _tag: "THash" }, () => parseHash(toks, pos, hooks))
      .with({ _tag: "TTmplStart" }, () => parseInterp(toks, pos, hooks))
      .otherwise(() =>
        _Result_flatMap(
          (claimed) =>
            match(claimed)
              .with(
                (_v): _v is Extract<Option<[Expr, number]>, { _tag: "Some" }> => {
                  const _g: any = _v;
                  return _g._tag === "Some";
                },
                ({ value: [e, p] }) => Ok(_tuple(e, p)) as Result<[Expr, number], PErr>,
              )
              .with({ _tag: "None" }, () =>
                match(lt.tok)
                  .with(
                    { _tag: "TNum" },
                    ({ value, raw }) =>
                      Ok(_tuple(Ast.ENum(value, raw, sp), add(pos, 1))) as Result<
                        [Expr, number],
                        PErr
                      >,
                  )
                  .with(
                    { _tag: "TBool" },
                    ({ value }) =>
                      Ok(_tuple(Ast.EBool(value, sp), add(pos, 1))) as Result<[Expr, number], PErr>,
                  )
                  .with(
                    { _tag: "TStr" },
                    ({ value }) =>
                      Ok(_tuple(Ast.EStr(value, sp), add(pos, 1))) as Result<[Expr, number], PErr>,
                  )
                  .with(
                    { _tag: "TId" },
                    ({ value: name }) =>
                      Ok(_tuple(Ast.ERef(name, sp), add(pos, 1))) as Result<[Expr, number], PErr>,
                  )
                  .with({ _tag: "TLparen" }, () =>
                    ((nxt) =>
                      eq(nxt.tok, TRparen as Tok)
                        ? (Ok(
                            _tuple(Ast.EUnit(toEnd(sp, toks, add(pos, 2))), add(pos, 2)),
                          ) as Result<[Expr, number], PErr>)
                        : and(isSectionOp(nxt.tok), not(eq(nxt.tok, TMinus as Tok)))
                          ? parseRightSection(toks, sp, add(pos, 1), hooks)
                          : _Result_flatMap(
                              ([first, p]) =>
                                eq(tokAt(toks, p).tok, TComma as Tok)
                                  ? _Result_flatMap(
                                      ([elements, p2]) =>
                                        _Result_flatMap(
                                          (p3) =>
                                            Ok(
                                              _tuple(Ast.ETuple(elements, toEnd(sp, toks, p3)), p3),
                                            ) as Result<[Expr, number], PErr>,
                                          expectTok(TRparen as Tok, toks, p2),
                                        ),
                                      sepByH(parseExpr, toks, add(p, 1), [first], hooks),
                                    )
                                  : _Result_map(
                                      (p2: number) => _tuple(first, p2),
                                      expectTok(TRparen as Tok, toks, p),
                                    ),
                              parseExpr(toks, add(pos, 1), hooks),
                            ))(tokAt(toks, add(pos, 1))),
                  )
                  .otherwise((t) => errAt(`unexpected token ${tokName(t)}`, lt)),
              )
              .exhaustive(),
          runParseHooks(
            hooks,
            toks,
            pos,
            _curry(2, (t: { tok: Tok; start: number; end: number; doc: Option<A> }[], p: number) =>
              parseExpr(t, p, hooks),
            ),
          ),
        ),
      );
  },
);
const parseInterpLoop: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  start: Span,
  acc: InterpPart[],
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  5,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    start: Span,
    acc: InterpPart[],
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    _Result_flatMap(
      ([holeExpr, p]) =>
        ((acc2: InterpPart[]) =>
          ((lt) =>
            match(lt.tok)
              .with({ _tag: "TTmplMid" }, ({ value }) =>
                parseInterpLoop(
                  toks,
                  add(p, 1),
                  start,
                  _Array_append(Ast.IPLit(value), acc2),
                  hooks,
                ),
              )
              .with(
                { _tag: "TTmplEnd" },
                ({ value }) =>
                  Ok(
                    _tuple(
                      Ast.EInterp(
                        _Array_append(Ast.IPLit(value), acc2),
                        toEnd(start, toks, add(p, 1)),
                      ),
                      add(p, 1),
                    ),
                  ) as Result<[Expr, number], PErr>,
              )
              .otherwise((t) => errAt(`expected \${...} to close, got ${tokName(t)}`, lt)))(
            tokAt(toks, p),
          ))(_Array_append(Ast.IPExpr(holeExpr), acc)),
      parseExpr(toks, pos, hooks),
    ),
);
const parseInterp: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const lt = tokAt(toks, pos);
    return match(lt.tok)
      .with({ _tag: "TTmplStart" }, ({ value }) =>
        parseInterpLoop(toks, add(pos, 1), spanOf(lt), [Ast.IPLit(value)], hooks),
      )
      .otherwise((t) => errAt(`expected tmplstart, got ${tokName(t)}`, lt));
  },
);
const parseField: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Field, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const lt = tokAt(toks, pos);
    return _Result_flatMap(
      ([nm, p]) =>
        eq(tokAt(toks, p).tok, TColon as Tok)
          ? _Result_flatMap(
              ([value, p2]) =>
                Ok(_tuple({ name: nm.name, value: value }, p2)) as Result<[Field, number], PErr>,
              parseExpr(toks, add(p, 1), hooks),
            )
          : not(eq(keywordText(lt.tok), None as Option<string>))
            ? errAt(`'${nm.name}' is a keyword — write '${nm.name}: <expr>'`, lt)
            : (Ok(_tuple({ name: nm.name, value: Ast.ERef(nm.name, nm.span) }, p)) as Result<
                [Field, number],
                PErr
              >),
      expectLabel(toks, pos),
    );
  },
);
const parseRecord: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        eq(tokAt(toks, p).tok, TSpread as Tok)
          ? _Result_flatMap(
              ([spreadExpr, p1]) =>
                _Result_flatMap(
                  (p2) =>
                    _Result_flatMap(
                      ([fields, p3]) =>
                        _Result_flatMap(
                          (p4) =>
                            Ok(
                              _tuple(
                                Ast.ERecord(
                                  fields,
                                  Some(spreadExpr) as Option<Expr>,
                                  toEnd(start, toks, p4),
                                ),
                                p4,
                              ),
                            ) as Result<[Expr, number], PErr>,
                          expectTok(TRbrace as Tok, toks, p3),
                        ),
                      listUntilH(TRbrace as Tok, parseField, toks, p2, hooks),
                    ),
                  eq(tokAt(toks, p1).tok, TRbrace as Tok)
                    ? (Ok(p1) as Result<number, PErr>)
                    : expectTok(TComma as Tok, toks, p1),
                ),
              parseExpr(toks, add(p, 1), hooks),
            )
          : _Result_flatMap(
              ([fields, p1]) =>
                _Result_flatMap(
                  (p2) =>
                    Ok(
                      _tuple(Ast.ERecord(fields, None as Option<Expr>, toEnd(start, toks, p2)), p2),
                    ) as Result<[Expr, number], PErr>,
                  expectTok(TRbrace as Tok, toks, p1),
                ),
              listUntilH(TRbrace as Tok, parseField, toks, p, hooks),
            ),
      expectTok(TLbrace as Tok, toks, pos),
    );
  },
);
const parseSeqElem: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[SeqElem, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    eq(tokAt(toks, pos).tok, TSpread as Tok)
      ? _Result_flatMap(
          ([ex, p]) => Ok(_tuple(Ast.SESpread(ex), p)) as Result<[SeqElem, number], PErr>,
          parseExpr(toks, add(pos, 1), hooks),
        )
      : _Result_flatMap(
          ([ex, p]) => Ok(_tuple(Ast.SEExpr(ex), p)) as Result<[SeqElem, number], PErr>,
          parseExpr(toks, pos, hooks),
        ),
);
const parseArr: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        _Result_flatMap(
          ([elements, p2]) =>
            _Result_flatMap(
              (p3) =>
                Ok(_tuple(Ast.EArr(elements, toEnd(start, toks, p3)), p3)) as Result<
                  [Expr, number],
                  PErr
                >,
              expectTok(TRbracket as Tok, toks, p2),
            ),
          listUntilH(TRbracket as Tok, parseSeqElem, toks, p, hooks),
        ),
      expectTok(TLbracket as Tok, toks, pos),
    );
  },
);
const parseList: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        _Result_flatMap(
          (p1) =>
            _Result_flatMap(
              ([elements, p2]) =>
                _Result_flatMap(
                  (p3) =>
                    Ok(_tuple(Ast.EList(elements, toEnd(start, toks, p3)), p3)) as Result<
                      [Expr, number],
                      PErr
                    >,
                  expectTok(TRbrace as Tok, toks, p2),
                ),
              listUntilH(TRbrace as Tok, parseSeqElem, toks, p1, hooks),
            ),
          expectTok(TLbrace as Tok, toks, p),
        ),
      expectTok(TAt as Tok, toks, pos),
    );
  },
);
const parseMapEntry: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[MapEntry, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    _Result_flatMap(
      ([key, p]) =>
        _Result_flatMap(
          (p2) =>
            _Result_flatMap(
              ([value, p3]) =>
                Ok(_tuple({ key: key, value: value }, p3)) as Result<[MapEntry, number], PErr>,
              parseExpr(toks, p2, hooks),
            ),
          expectTok(TColon as Tok, toks, p),
        ),
      parseExpr(toks, pos, hooks),
    ),
);
const parseHash: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        _Result_flatMap(
          (p1) =>
            eq(tokAt(toks, p1).tok, TRbrace as Tok)
              ? _Result_flatMap(
                  (p2) =>
                    Ok(_tuple(Ast.EMap([] as MapEntry[], toEnd(start, toks, p2)), p2)) as Result<
                      [Expr, number],
                      PErr
                    >,
                  expectTok(TRbrace as Tok, toks, p1),
                )
              : eq(tokAt(toks, p1).tok, TSpread as Tok)
                ? _Result_flatMap(
                    ([elements, p2]) =>
                      _Result_flatMap(
                        (p3) =>
                          Ok(_tuple(Ast.ESet(elements, toEnd(start, toks, p3)), p3)) as Result<
                            [Expr, number],
                            PErr
                          >,
                        expectTok(TRbrace as Tok, toks, p2),
                      ),
                    listUntilH(TRbrace as Tok, parseSeqElem, toks, p1, hooks),
                  )
                : _Result_flatMap(
                    ([first, p2]) =>
                      eq(tokAt(toks, p2).tok, TColon as Tok)
                        ? _Result_flatMap(
                            (p3) =>
                              _Result_flatMap(
                                ([value, p4]) =>
                                  _Result_flatMap(
                                    ([rest, p5]) =>
                                      _Result_flatMap(
                                        (p6) =>
                                          Ok(
                                            _tuple(
                                              Ast.EMap(
                                                _Array_prepend({ key: first, value: value }, rest),
                                                toEnd(start, toks, p6),
                                              ),
                                              p6,
                                            ),
                                          ) as Result<[Expr, number], PErr>,
                                        expectTok(TRbrace as Tok, toks, p5),
                                      ),
                                    eq(tokAt(toks, p4).tok, TComma as Tok)
                                      ? listUntilH(
                                          TRbrace as Tok,
                                          parseMapEntry,
                                          toks,
                                          add(p4, 1),
                                          hooks,
                                        )
                                      : (Ok(_tuple([] as MapEntry[], p4)) as Result<
                                          [MapEntry[], number],
                                          PErr
                                        >),
                                  ),
                                parseExpr(toks, p3, hooks),
                              ),
                            expectTok(TColon as Tok, toks, p2),
                          )
                        : _Result_flatMap(
                            ([rest, p3]) =>
                              _Result_flatMap(
                                (p4) =>
                                  Ok(
                                    _tuple(
                                      Ast.ESet(
                                        _Array_prepend(Ast.SEExpr(first), rest),
                                        toEnd(start, toks, p4),
                                      ),
                                      p4,
                                    ),
                                  ) as Result<[Expr, number], PErr>,
                                expectTok(TRbrace as Tok, toks, p3),
                              ),
                            eq(tokAt(toks, p2).tok, TComma as Tok)
                              ? listUntilH(TRbrace as Tok, parseSeqElem, toks, add(p2, 1), hooks)
                              : (Ok(_tuple([] as SeqElem[], p2)) as Result<
                                  [SeqElem[], number],
                                  PErr
                                >),
                          ),
                    parseExpr(toks, p1, hooks),
                  ),
          expectTok(TLbrace as Tok, toks, p),
        ),
      expectTok(THash as Tok, toks, pos),
    );
  },
);
const parseGuard: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Option<Expr>, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    match(tokAt(toks, pos).tok)
      .with({ _tag: "TId", value: "when" }, () =>
        _Result_map(
          ([g, p]: [Expr, number]) => _tuple(Some(g) as Option<Expr>, p),
          parseExpr(toks, add(pos, 1), hooks),
        ),
      )
      .otherwise(
        () => Ok(_tuple(None as Option<Expr>, pos)) as Result<[Option<Expr>, number], PErr>,
      ),
);
const patSpan: (p: Pattern) => Span = (p: Pattern) =>
  match(p)
    .with({ _tag: "PWild" }, ({ span: sp }) => sp)
    .with({ _tag: "PUnit" }, ({ span: sp }) => sp)
    .with({ _tag: "PBind" }, ({ span: sp }) => sp)
    .with({ _tag: "PAs" }, ({ span: sp }) => sp)
    .with({ _tag: "PLit" }, ({ span: sp }) => sp)
    .with({ _tag: "PBool" }, ({ span: sp }) => sp)
    .with({ _tag: "PStr" }, ({ span: sp }) => sp)
    .with({ _tag: "PTuple" }, ({ span: sp }) => sp)
    .with({ _tag: "PRecord" }, ({ span: sp }) => sp)
    .with({ _tag: "PCtor" }, ({ span: sp }) => sp)
    .with({ _tag: "PArr" }, ({ span: sp }) => sp)
    .with({ _tag: "PList" }, ({ span: sp }) => sp)
    .with({ _tag: "POr" }, ({ span: sp }) => sp)
    .exhaustive();
const altsLoop: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: Pattern[],
  lastSpan: Span,
) => Result<[Pattern[], number, Span], PErr> = _curry(
  4,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    acc: Pattern[],
    lastSpan: Span,
  ) =>
    eq(tokAt(toks, pos).tok, TBar as Tok)
      ? _Result_flatMap(
          ([alt, p1]) => altsLoop(toks, p1, _Array_append(alt, acc), patSpan(alt)),
          parsePattern(toks, add(pos, 1)),
        )
      : (Ok(_tuple(acc, pos, lastSpan)) as Result<[Pattern[], number, Span], PErr>),
);
const armsLoop: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: MatchArm[],
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[MatchArm[], number], PErr> = _curry(
  4,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    acc: MatchArm[],
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    eq(tokAt(toks, pos).tok, TBar as Tok)
      ? _Result_flatMap(
          ([first, p1]) =>
            _Result_flatMap(
              ([alts, p2, lastSpan]) =>
                ((pattern: Pattern) =>
                  _Result_flatMap(
                    ([guard, p3]) =>
                      _Result_flatMap(
                        (p4) =>
                          _Result_flatMap(
                            ([body, p5]) =>
                              armsLoop(
                                toks,
                                p5,
                                _Array_append({ pattern: pattern, guard: guard, body: body }, acc),
                                hooks,
                              ),
                            parseExpr(toks, p4, hooks),
                          ),
                        expectTok(TArrow as Tok, toks, p3),
                      ),
                    parseGuard(toks, p2, hooks),
                  ))(
                  eq(length(alts), 1) ? first : Ast.POr(alts, spanning(patSpan(first), lastSpan)),
                ),
              altsLoop(toks, p1, [first], patSpan(first)),
            ),
          parsePattern(toks, add(pos, 1)),
        )
      : (Ok(_tuple(acc, pos)) as Result<[MatchArm[], number], PErr>),
);
const parseDo: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) => parseDoBlockFrom(toks, start, p, hooks),
      expectTok(TDo as Tok, toks, pos),
    );
  },
);
const parseDoBlock: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => parseDoBlockFrom(toks, spanOf(tokAt(toks, pos)), pos, hooks),
);
const parseDoBlockFrom: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  start: Span,
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  4,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    start: Span,
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    _Result_flatMap(
      (p1) =>
        eq(tokAt(toks, p1).tok, TRbrace as Tok)
          ? errAt("do block needs a final expression", tokAt(toks, p1))
          : _Result_flatMap(
              ([exprs, p2]) =>
                eq(tokAt(toks, p2).tok, TSemi as Tok)
                  ? errAt("do block cannot end with a semicolon", tokAt(toks, p2))
                  : _Result_flatMap(
                      (p3) =>
                        Ok(_tuple(Ast.EDo(exprs, toEnd(start, toks, p3)), p3)) as Result<
                          [Expr, number],
                          PErr
                        >,
                      expectTok(TRbrace as Tok, toks, p2),
                    ),
              parseDoExprs(toks, p1, [] as Expr[], hooks),
            ),
      expectTok(TLbrace as Tok, toks, pos),
    ),
);
const parseDoExprs: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: Expr[],
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr[], number], PErr> = _curry(
  4,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    acc: Expr[],
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    _Result_flatMap(
      ([expr, p]) =>
        ((next: Expr[]) =>
          eq(tokAt(toks, p).tok, TSemi as Tok)
            ? parseDoExprs(toks, add(p, 1), next, hooks)
            : (Ok(_tuple(next, p)) as Result<[Expr[], number], PErr>))(_Array_append(expr, acc)),
      parseExpr(toks, pos, hooks),
    ),
);
const parseLoop: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        _Result_flatMap(
          (p1) =>
            _Result_flatMap(
              ([params, p2]) =>
                _Result_flatMap(
                  (p3) =>
                    _Result_flatMap(
                      (p4) =>
                        _Result_flatMap(
                          ([body, p5]) =>
                            _Result_map(
                              (p6: number) =>
                                _tuple(Ast.ELoop(params, body, toEnd(start, toks, p6)), p6),
                              expectTok(TRbrace as Tok, toks, p5),
                            ),
                          parseExpr(toks, p4, hooks),
                        ),
                      expectTok(TLbrace as Tok, toks, p3),
                    ),
                  expectTok(TRparen as Tok, toks, p2),
                ),
              loopParamsLoop(toks, p1, [] as LoopParam[], hooks),
            ),
          expectTok(TLparen as Tok, toks, p),
        ),
      expectTok(TLoop as Tok, toks, pos),
    );
  },
);
const loopParamsLoop: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: LoopParam[],
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[LoopParam[], number], PErr> = _curry(
  4,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    acc: LoopParam[],
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) =>
    _Result_flatMap(
      ([id, pid]) =>
        _Result_flatMap(
          (p) =>
            _Result_flatMap(
              ([init, p1]) =>
                ((next: LoopParam[]) =>
                  match(tokAt(toks, p1).tok)
                    .with({ _tag: "TComma" }, () => loopParamsLoop(toks, add(p1, 1), next, hooks))
                    .otherwise(() => Ok(_tuple(next, p1)) as Result<[LoopParam[], number], PErr>))(
                  _Array_append({ name: id.name, nameSpan: id.span, init: init }, acc),
                ),
              parseExpr(toks, p, hooks),
            ),
          expectTok(TEq as Tok, toks, pid),
        ),
      expectId(toks, pos),
    ),
);
const parseRecur: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        _Result_flatMap(
          (p1) =>
            match(tokAt(toks, p1).tok)
              .with(
                { _tag: "TRparen" },
                () =>
                  Ok(
                    _tuple(Ast.ERecur([] as Expr[], toEnd(start, toks, add(p1, 1))), add(p1, 1)),
                  ) as Result<[Expr, number], PErr>,
              )
              .otherwise(() =>
                _Result_flatMap(
                  ([args, p2]) =>
                    _Result_map(
                      (p3: number) => _tuple(Ast.ERecur(args, toEnd(start, toks, p3)), p3),
                      expectTok(TRparen as Tok, toks, p2),
                    ),
                  sepByH(parseExpr, toks, p1, [] as Expr[], hooks),
                ),
              ),
          expectTok(TLparen as Tok, toks, p),
        ),
      expectTok(TRecur as Tok, toks, pos),
    );
  },
);
const parseMatch: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Expr, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        _Result_flatMap(
          ([scrutinee, p1]) =>
            _Result_flatMap(
              (p2) =>
                _Result_flatMap(
                  ([arms, p3]) =>
                    match(length(arms))
                      .with(0, () => errAt("switch needs at least one | arm", tokAt(toks, p3)))
                      .otherwise(() =>
                        _Result_map(
                          (p4: number) =>
                            _tuple(Ast.EMatch(scrutinee, arms, toEnd(start, toks, p4)), p4),
                          expectTok(TRbrace as Tok, toks, p3),
                        ),
                      ),
                  armsLoop(toks, p2, [] as MatchArm[], hooks),
                ),
              expectTok(TLbrace as Tok, toks, p1),
            ),
          parseExpr(toks, p, hooks),
        ),
      expectTok(TSwitch as Tok, toks, pos),
    );
  },
);
const parseCtorArgs: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  ctor: string,
  ns: Option<string>,
  nameSpan: Span,
  pos: number,
) => Result<[Pattern, number], PErr> = _curry(
  5,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    ctor: string,
    ns: Option<string>,
    nameSpan: Span,
    pos: number,
  ) =>
    eq(tokAt(toks, pos).tok, TLparen as Tok)
      ? _Result_flatMap(
          ([args, p]) =>
            _Result_flatMap(
              (p2) =>
                Ok(_tuple(Ast.PCtor(ctor, args, ns, toEnd(nameSpan, toks, p2)), p2)) as Result<
                  [Pattern, number],
                  PErr
                >,
              expectTok(TRparen as Tok, toks, p),
            ),
          listUntil(TRparen as Tok, parsePattern, toks, add(pos, 1)),
        )
      : (Ok(
          _tuple(Ast.PCtor(ctor, [] as Pattern[], ns, toEnd(nameSpan, toks, pos)), pos),
        ) as Result<[Pattern, number], PErr>),
);
const parsePatternAtom: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[Pattern, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const lt = tokAt(toks, pos);
    const sp: Span = spanOf(lt);
    return match(lt.tok)
      .with(
        { _tag: "TNum" },
        ({ value, raw }) =>
          Ok(_tuple(Ast.PLit(value, raw, sp), add(pos, 1))) as Result<[Pattern, number], PErr>,
      )
      .with(
        { _tag: "TBool" },
        ({ value }) =>
          Ok(_tuple(Ast.PBool(value, sp), add(pos, 1))) as Result<[Pattern, number], PErr>,
      )
      .with(
        { _tag: "TStr" },
        ({ value }) =>
          Ok(_tuple(Ast.PStr(value, sp), add(pos, 1))) as Result<[Pattern, number], PErr>,
      )
      .with({ _tag: "TLparen" }, () =>
        eq(tokAt(toks, add(pos, 1)).tok, TRparen as Tok)
          ? (Ok(_tuple(Ast.PUnit(toEnd(sp, toks, add(pos, 2))), add(pos, 2))) as Result<
              [Pattern, number],
              PErr
            >)
          : _Result_flatMap(
              ([elems, p]) =>
                _Result_flatMap(
                  (p2) =>
                    Ok(
                      match(elems)
                        .with(
                          (_v) => {
                            const _g: any = _v;
                            return _g.length === 1;
                          },
                          ([single]) => _tuple(single, p2),
                        )
                        .otherwise((many) => _tuple(Ast.PTuple(many, toEnd(sp, toks, p2)), p2)),
                    ) as Result<[Pattern, number], PErr>,
                  expectTok(TRparen as Tok, toks, p),
                ),
              sepBy(parsePattern, toks, add(pos, 1), [] as Pattern[]),
            ),
      )
      .with({ _tag: "TLbrace" }, () =>
        _Result_flatMap(
          ([fields, p]) =>
            _Result_flatMap(
              (p2) =>
                Ok(_tuple(Ast.PRecord(fields, toEnd(sp, toks, p2)), p2)) as Result<
                  [Pattern, number],
                  PErr
                >,
              expectTok(TRbrace as Tok, toks, p),
            ),
          listUntil(TRbrace as Tok, parsePatField, toks, add(pos, 1)),
        ),
      )
      .with({ _tag: "TLbracket" }, () => parseArrPattern(toks, pos))
      .with({ _tag: "TAt" }, () => parseListPattern(toks, pos))
      .with(
        { _tag: "TId", value: "_" },
        () => Ok(_tuple(Ast.PWild(sp), add(pos, 1))) as Result<[Pattern, number], PErr>,
      )
      .with({ _tag: "TId" }, ({ value: name }) =>
        eq(tokAt(toks, add(pos, 1)).tok, TDot as Tok)
          ? _Result_flatMap(
              ([c, p1]) =>
                isUpper(c.name)
                  ? parseCtorArgs(toks, c.name, Some(name) as Option<string>, sp, p1)
                  : errAt(
                      `expected constructor after '${name}.', got '${c.name}'`,
                      tokAt(toks, p1),
                    ),
              expectId(toks, add(pos, 2)),
            )
          : isUpper(name)
            ? parseCtorArgs(toks, name, None as Option<string>, sp, add(pos, 1))
            : (Ok(_tuple(Ast.PBind(name, sp), add(pos, 1))) as Result<[Pattern, number], PErr>),
      )
      .otherwise((t) => errAt(`unexpected token in pattern: ${tokName(t)}`, lt));
  },
);
const parsePattern: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[Pattern, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) =>
    _Result_flatMap(
      ([pat, p]) =>
        match(tokAt(toks, p).tok)
          .with({ _tag: "TId", value: "as" }, () =>
            _Result_flatMap(
              ([nm, p2]) =>
                Ok(
                  _tuple(Ast.PAs(pat, nm.name, nm.span, spanning(patSpan(pat), nm.span)), p2),
                ) as Result<[Pattern, number], PErr>,
              expectId(toks, add(p, 1)),
            ),
          )
          .otherwise(() => Ok(_tuple(pat, p)) as Result<[Pattern, number], PErr>),
      parsePatternAtom(toks, pos),
    ),
);
const restOk: (rest: Option<Pattern>) => boolean = (rest: Option<Pattern>) =>
  match(rest)
    .with({ _tag: "None" }, () => true)
    .with(
      (
        _v,
      ): _v is Extract<Option<Pattern>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<Pattern>, { _tag: "Some" }>["value"], { _tag: "PBind" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "PBind";
      },
      () => true,
    )
    .with(
      (
        _v,
      ): _v is Extract<Option<Pattern>, { _tag: "Some" }> & {
        value: Extract<Extract<Option<Pattern>, { _tag: "Some" }>["value"], { _tag: "PWild" }>;
      } => {
        const _g: any = _v;
        return _g._tag === "Some" && _g.value._tag === "PWild";
      },
      () => true,
    )
    .with({ _tag: "Some" }, () => false)
    .exhaustive();
const patElemsLoop: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: Pattern[],
) => Result<[Pattern[], Option<Pattern>, number], PErr> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    acc: Pattern[],
  ) =>
    match(tokAt(toks, pos).tok)
      .with({ _tag: "TSpread" }, () =>
        _Result_flatMap(
          ([rest, p]) =>
            Ok(_tuple(acc, Some(rest) as Option<Pattern>, p)) as Result<
              [Pattern[], Option<Pattern>, number],
              PErr
            >,
          parsePattern(toks, add(pos, 1)),
        ),
      )
      .otherwise(() =>
        _Result_flatMap(
          ([pat, p]) =>
            ((elems: Pattern[]) =>
              eq(tokAt(toks, p).tok, TComma as Tok)
                ? patElemsLoop(toks, add(p, 1), elems)
                : (Ok(_tuple(elems, None as Option<Pattern>, p)) as Result<
                    [Pattern[], Option<Pattern>, number],
                    PErr
                  >))(_Array_append(pat, acc)),
          parsePattern(toks, pos),
        ),
      ),
);
const parseArrPattern: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[Pattern, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        eq(tokAt(toks, p).tok, TRbracket as Tok)
          ? (Ok(
              _tuple(
                Ast.PArr([] as Pattern[], None as Option<Pattern>, toEnd(start, toks, add(p, 1))),
                add(p, 1),
              ),
            ) as Result<[Pattern, number], PErr>)
          : _Result_flatMap(
              ([elems, rest, p2]) =>
                restOk(rest)
                  ? _Result_map(
                      (p3: number) => _tuple(Ast.PArr(elems, rest, toEnd(start, toks, p3)), p3),
                      expectTok(TRbracket as Tok, toks, p2),
                    )
                  : errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2)),
              patElemsLoop(toks, p, [] as Pattern[]),
            ),
      expectTok(TLbracket as Tok, toks, pos),
    );
  },
);
const parseListPattern: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[Pattern, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        _Result_flatMap(
          (p1) =>
            eq(tokAt(toks, p1).tok, TRbrace as Tok)
              ? (Ok(
                  _tuple(
                    Ast.PList(
                      [] as Pattern[],
                      None as Option<Pattern>,
                      toEnd(start, toks, add(p1, 1)),
                    ),
                    add(p1, 1),
                  ),
                ) as Result<[Pattern, number], PErr>)
              : _Result_flatMap(
                  ([elems, rest, p2]) =>
                    restOk(rest)
                      ? _Result_map(
                          (p3: number) =>
                            _tuple(Ast.PList(elems, rest, toEnd(start, toks, p3)), p3),
                          expectTok(TRbrace as Tok, toks, p2),
                        )
                      : errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2)),
                  patElemsLoop(toks, p1, [] as Pattern[]),
                ),
          expectTok(TLbrace as Tok, toks, p),
        ),
      expectTok(TAt as Tok, toks, pos),
    );
  },
);
const parsePatField: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[PatField, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const lt = tokAt(toks, pos);
    return _Result_flatMap(
      ([nm, p]) =>
        eq(tokAt(toks, p).tok, TColon as Tok)
          ? _Result_flatMap(
              ([pat, p2]) =>
                Ok(_tuple({ label: nm.name, pat: pat }, p2)) as Result<[PatField, number], PErr>,
              parsePattern(toks, add(p, 1)),
            )
          : not(eq(keywordText(lt.tok), None as Option<string>))
            ? errAt(`'${nm.name}' is a keyword — write '${nm.name}: <pattern>'`, lt)
            : (Ok(_tuple({ label: nm.name, pat: Ast.PBind(nm.name, nm.span) }, p)) as Result<
                [PatField, number],
                PErr
              >),
      expectLabel(toks, pos),
    );
  },
);
const parseTypeAtom: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[TypeExpr, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const lt = tokAt(toks, pos);
    const sp: Span = spanOf(lt);
    return match(lt.tok)
      .with({ _tag: "TLparen" }, () =>
        eq(tokAt(toks, add(pos, 1)).tok, TRparen as Tok)
          ? (Ok(_tuple(Ast.TyName("unit", toEnd(sp, toks, add(pos, 2))), add(pos, 2))) as Result<
              [TypeExpr, number],
              PErr
            >)
          : _Result_flatMap(
              ([inner, p]) =>
                eq(tokAt(toks, p).tok, TComma as Tok)
                  ? _Result_flatMap(
                      ([elems, p2]) =>
                        _Result_flatMap(
                          (p3) =>
                            Ok(_tuple(Ast.TyTuple(elems, toEnd(sp, toks, p3)), p3)) as Result<
                              [TypeExpr, number],
                              PErr
                            >,
                          expectTok(TRparen as Tok, toks, p2),
                        ),
                      sepBy(parseTypeExpr, toks, add(p, 1), [inner]),
                    )
                  : _Result_map(
                      (p2: number) => _tuple(inner, p2),
                      expectTok(TRparen as Tok, toks, p),
                    ),
              parseTypeExpr(toks, add(pos, 1)),
            ),
      )
      .with({ _tag: "TLbracket" }, () =>
        _Result_flatMap(
          ([elem, p]) =>
            _Result_flatMap(
              (p2) =>
                Ok(_tuple(Ast.TyList(elem, toEnd(sp, toks, p2)), p2)) as Result<
                  [TypeExpr, number],
                  PErr
                >,
              expectTok(TRbracket as Tok, toks, p),
            ),
          parseTypeExpr(toks, add(pos, 1)),
        ),
      )
      .with(
        { _tag: "TStr" },
        ({ value }) =>
          Ok(_tuple(Ast.TyLit(value, sp), add(pos, 1))) as Result<[TypeExpr, number], PErr>,
      )
      .otherwise(() =>
        _Result_flatMap(
          ([nm, p]) =>
            and(isUpper(nm.name), eq(tokAt(toks, p).tok, TDot as Tok))
              ? _Result_flatMap(
                  ([q, p2]) =>
                    isUpper(q.name)
                      ? (Ok(
                          _tuple(
                            Ast.TyQual(
                              nm.name,
                              q.name,
                              q.span,
                              [] as TypeExpr[],
                              spanning(nm.span, q.span),
                            ),
                            p2,
                          ),
                        ) as Result<[TypeExpr, number], PErr>)
                      : errAt(
                          `a type variable cannot be qualified; expected a constructor after '${nm.name}.', got '${q.name}'`,
                          tokAt(toks, p2),
                        ),
                  expectId(toks, add(p, 1)),
                )
              : (Ok(_tuple(Ast.TyName(nm.name, nm.span), p)) as Result<[TypeExpr, number], PErr>),
          expectId(toks, pos),
        ),
      );
  },
);
const startsTypeAtom: (t: Tok) => boolean = (t: Tok) =>
  match(t)
    .with({ _tag: "TId" }, () => true)
    .with({ _tag: "TLparen" }, () => true)
    .with({ _tag: "TLbracket" }, () => true)
    .with({ _tag: "TStr" }, () => true)
    .otherwise(() => false);
const legacyTypeArgsLoop: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: TypeExpr[],
  lastSp: Option<Span>,
) => Result<[TypeExpr[], Option<Span>, number], PErr> = _curry(
  4,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    acc: TypeExpr[],
    lastSp: Option<Span>,
  ) =>
    startsTypeAtom(tokAt(toks, pos).tok)
      ? _Result_flatMap(
          ([a, p]) =>
            legacyTypeArgsLoop(toks, p, _Array_append(a, acc), Some(tySpan(a)) as Option<Span>),
          parseTypeAtom(toks, pos),
        )
      : (Ok(_tuple(acc, lastSp, pos)) as Result<[TypeExpr[], Option<Span>, number], PErr>),
);
const parseTypeApp: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[TypeExpr, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) =>
    _Result_flatMap(
      ([head, p]) =>
        match(head)
          .with(
            (_v): _v is Extract<TypeExpr, { _tag: "TyName" }> => {
              const _g: any = _v;
              return _g._tag === "TyName" && (({ name, span: sp }) => isUpper(name))(_g);
            },
            ({ name, span: sp }) =>
              eq(tokAt(toks, p).tok, TLt as Tok)
                ? _Result_flatMap(
                    ([args, p1]) =>
                      _Result_flatMap(
                        (p2) =>
                          Ok(_tuple(Ast.TyApp(name, args, toEnd(sp, toks, p2)), p2)) as Result<
                            [TypeExpr, number],
                            PErr
                          >,
                        expectTok(TGt as Tok, toks, p1),
                      ),
                    listUntil(TGt as Tok, parseTypeExpr, toks, add(p, 1)),
                  )
                : _Result_flatMap(
                    ([args, lastSp, p2]) =>
                      Ok(
                        match(lastSp)
                          .with({ _tag: "None" }, () => _tuple(head, p2))
                          .with({ _tag: "Some" }, ({ value: ls }) =>
                            _tuple(Ast.TyApp(name, args, spanning(sp, ls)), p2),
                          )
                          .exhaustive(),
                      ) as Result<[TypeExpr, number], PErr>,
                    legacyTypeArgsLoop(toks, p, [] as TypeExpr[], None as Option<Span>),
                  ),
          )
          .with({ _tag: "TyQual" }, ({ alias, name: nm, nameSpan, span: sp }) =>
            eq(tokAt(toks, p).tok, TLt as Tok)
              ? _Result_flatMap(
                  ([args, p1]) =>
                    _Result_flatMap(
                      (p2) =>
                        Ok(
                          _tuple(Ast.TyQual(alias, nm, nameSpan, args, toEnd(sp, toks, p2)), p2),
                        ) as Result<[TypeExpr, number], PErr>,
                      expectTok(TGt as Tok, toks, p1),
                    ),
                  listUntil(TGt as Tok, parseTypeExpr, toks, add(p, 1)),
                )
              : _Result_flatMap(
                  ([args, lastSp, p2]) =>
                    Ok(
                      match(lastSp)
                        .with({ _tag: "None" }, () => _tuple(head, p2))
                        .with({ _tag: "Some" }, ({ value: ls }) =>
                          _tuple(Ast.TyQual(alias, nm, nameSpan, args, spanning(sp, ls)), p2),
                        )
                        .exhaustive(),
                    ) as Result<[TypeExpr, number], PErr>,
                  legacyTypeArgsLoop(toks, p, [] as TypeExpr[], None as Option<Span>),
                ),
          )
          .otherwise(() => Ok(_tuple(head, p)) as Result<[TypeExpr, number], PErr>),
      parseTypeAtom(toks, pos),
    ),
);
const parseTypeUnionRest: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: TypeExpr[],
  lastSp: Span,
) => Result<[TypeExpr[], Span, number], PErr> = _curry(
  4,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    acc: TypeExpr[],
    lastSp: Span,
  ) =>
    eq(tokAt(toks, pos).tok, TBar as Tok)
      ? _Result_flatMap(
          ([m, p]) => parseTypeUnionRest(toks, p, _Array_append(m, acc), tySpan(m)),
          parseTypeApp(toks, add(pos, 1)),
        )
      : (Ok(_tuple(acc, lastSp, pos)) as Result<[TypeExpr[], Span, number], PErr>),
);
const parseTypeUnion: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[TypeExpr, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) =>
    _Result_flatMap(
      ([first, p]) =>
        eq(tokAt(toks, p).tok, TBar as Tok)
          ? _Result_flatMap(
              ([members, lastSp, p2]) =>
                Ok(_tuple(Ast.TyUnion(members, spanning(tySpan(first), lastSp)), p2)) as Result<
                  [TypeExpr, number],
                  PErr
                >,
              parseTypeUnionRest(toks, p, [first], tySpan(first)),
            )
          : (Ok(_tuple(first, p)) as Result<[TypeExpr, number], PErr>),
      parseTypeApp(toks, pos),
    ),
);
const parseTypeExpr: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[TypeExpr, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) =>
    _Result_flatMap(
      ([from, p]) =>
        eq(tokAt(toks, p).tok, TTarrow as Tok)
          ? _Result_flatMap(
              ([to, p2]) =>
                Ok(_tuple(Ast.TyArrow(from, to, spanning(tySpan(from), tySpan(to))), p2)) as Result<
                  [TypeExpr, number],
                  PErr
                >,
              parseTypeExpr(toks, add(p, 1)),
            )
          : (Ok(_tuple(from, p)) as Result<[TypeExpr, number], PErr>),
      parseTypeUnion(toks, pos),
    ),
);
const parseCtorField: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[CtorField, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const isLabel: boolean = match(tokAt(toks, pos).tok)
      .with({ _tag: "TId" }, () => eq(tokAt(toks, add(pos, 1)).tok, TColon as Tok))
      .otherwise(() => false);
    return isLabel
      ? _Result_flatMap(
          ([nm, p]) =>
            _Result_flatMap(
              ([t, p2]) =>
                Ok(_tuple({ name: Some(nm.name) as Option<string>, fieldType: t }, p2)) as Result<
                  [CtorField, number],
                  PErr
                >,
              parseTypeExpr(toks, add(p, 1)),
            ),
          expectId(toks, pos),
        )
      : _Result_map(
          ([t, p]: [TypeExpr, number]) => _tuple({ name: None as Option<string>, fieldType: t }, p),
          parseTypeExpr(toks, pos),
        );
  },
);
const parseCtor: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[Ctor, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) =>
    _Result_flatMap(
      ([nm, p]) =>
        eq(tokAt(toks, p).tok, TLparen as Tok)
          ? _Result_flatMap(
              ([fields, p2]) =>
                _Result_flatMap(
                  (p3) =>
                    Ok(_tuple({ name: nm.name, fields: fields }, p3)) as Result<
                      [Ctor, number],
                      PErr
                    >,
                  expectTok(TRparen as Tok, toks, p2),
                ),
              listUntil(TRparen as Tok, parseCtorField, toks, add(p, 1)),
            )
          : (Ok(_tuple({ name: nm.name, fields: [] as CtorField[] }, p)) as Result<
              [Ctor, number],
              PErr
            >),
      expectId(toks, pos),
    ),
);
const ctorsLoop: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: Ctor[],
) => Result<[Ctor[], number], PErr> = _curry(
  3,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number, acc: Ctor[]) =>
    _Result_flatMap(
      ([c, p]) =>
        ((cs: Ctor[]) =>
          eq(tokAt(toks, p).tok, TBar as Tok)
            ? ctorsLoop(toks, add(p, 1), cs)
            : (Ok(_tuple(cs, p)) as Result<[Ctor[], number], PErr>))(_Array_append(c, acc)),
      parseCtor(toks, pos),
    ),
);
const parseAliasField: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[AliasField, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) =>
    _Result_flatMap(
      ([nm, p]) =>
        _Result_flatMap(
          (p2) =>
            _Result_flatMap(
              ([t, p3]) =>
                Ok(_tuple({ name: nm.name, fieldType: t }, p3)) as Result<
                  [AliasField, number],
                  PErr
                >,
              parseTypeExpr(toks, p2),
            ),
          expectTok(TColon as Tok, toks, p),
        ),
      expectLabel(toks, pos),
    ),
);
const parseAliasBody: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[AliasField[], number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) =>
    _Result_flatMap(
      (p) =>
        _Result_flatMap(
          ([fields, p2]) =>
            _Result_flatMap(
              (p3) => Ok(_tuple(fields, p3)) as Result<[AliasField[], number], PErr>,
              expectTok(TRbrace as Tok, toks, p2),
            ),
          listUntil(TRbrace as Tok, parseAliasField, toks, p),
        ),
      expectTok(TLbrace as Tok, toks, pos),
    ),
);
const typeParamsLoop: <A, B>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: string[],
) => Result<[string[], number], B> = _curry(
  3,
  <A, B>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    acc: string[],
  ) =>
    match(tokAt(toks, pos).tok)
      .with({ _tag: "TId" }, ({ value: name }) =>
        typeParamsLoop(toks, add(pos, 1), _Array_append(name, acc)),
      )
      .otherwise(() => Ok(_tuple(acc, pos))),
);
const parseTypeParams: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[string[], number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) =>
    eq(tokAt(toks, pos).tok, TLt as Tok)
      ? _Result_flatMap(
          ([names, p]) =>
            _Result_map(
              (p2: number) =>
                _tuple(
                  map((n: Name) => n.name, names),
                  p2,
                ),
              expectTok(TGt as Tok, toks, p),
            ),
          listUntil(TGt as Tok, expectId, toks, add(pos, 1)),
        )
      : typeParamsLoop(toks, pos, [] as string[]),
);
const startsTypeSynonym: (t: Tok) => boolean = (t: Tok) =>
  match(t)
    .with({ _tag: "TStr" }, () => true)
    .with({ _tag: "TLparen" }, () => true)
    .with({ _tag: "TLbracket" }, () => true)
    .otherwise(() => false);
const parseType: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[Stmt, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        _Result_flatMap(
          ([nm, p1]) =>
            _Result_flatMap(
              ([params, p2]) =>
                _Result_flatMap(
                  (p3) =>
                    eq(tokAt(toks, p3).tok, TLbrace as Tok)
                      ? _Result_map(
                          ([alias, p4]: [AliasField[], number]) =>
                            _tuple(
                              Ast.SType(
                                nm.name,
                                params,
                                [] as Ctor[],
                                Some(alias) as Option<AliasField[]>,
                                None as Option<TypeExpr>,
                                false,
                                None as Option<string>,
                                toEnd(start, toks, p4),
                              ),
                              p4,
                            ),
                          parseAliasBody(toks, p3),
                        )
                      : startsTypeSynonym(tokAt(toks, p3).tok)
                        ? _Result_flatMap(
                            ([te, p4]) =>
                              Ok(
                                _tuple(
                                  Ast.SType(
                                    nm.name,
                                    params,
                                    [] as Ctor[],
                                    None as Option<AliasField[]>,
                                    Some(te) as Option<TypeExpr>,
                                    false,
                                    None as Option<string>,
                                    toEnd(start, toks, p4),
                                  ),
                                  p4,
                                ),
                              ) as Result<[Stmt, number], PErr>,
                            parseTypeExpr(toks, p3),
                          )
                        : ((afterBar: number) =>
                            _Result_map(
                              ([ctors, p4]: [Ctor[], number]) =>
                                _tuple(
                                  Ast.SType(
                                    nm.name,
                                    params,
                                    ctors,
                                    None as Option<AliasField[]>,
                                    None as Option<TypeExpr>,
                                    false,
                                    None as Option<string>,
                                    toEnd(start, toks, p4),
                                  ),
                                  p4,
                                ),
                              ctorsLoop(toks, afterBar, [] as Ctor[]),
                            ))(eq(tokAt(toks, p3).tok, TBar as Tok) ? add(p3, 1) : p3),
                  expectTok(TEq as Tok, toks, p2),
                ),
              parseTypeParams(toks, p1),
            ),
          expectId(toks, p),
        ),
      expectTok(TType as Tok, toks, pos),
    );
  },
);
const parseExtern: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[Stmt, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        eq(tokAt(toks, p).tok, TType as Tok)
          ? _Result_flatMap(
              (p1) =>
                _Result_flatMap(
                  ([nm, p2]) =>
                    Ok(
                      _tuple(
                        Ast.SType(
                          nm.name,
                          [] as string[],
                          [] as Ctor[],
                          None as Option<AliasField[]>,
                          None as Option<TypeExpr>,
                          false,
                          None as Option<string>,
                          toEnd(start, toks, p2),
                        ),
                        p2,
                      ),
                    ) as Result<[Stmt, number], PErr>,
                  expectId(toks, p1),
                ),
              expectTok(TType as Tok, toks, p),
            )
          : _Result_flatMap(
              ([nm, p1]) =>
                _Result_flatMap(
                  ([params, p2]) =>
                    _Result_flatMap(
                      (p3) =>
                        _Result_flatMap(
                          ([t, p4]) =>
                            _Result_flatMap(
                              (p5) =>
                                ((isCurried: boolean) =>
                                  ((pConv: number) =>
                                    ((nextTok: Tok) =>
                                      or(
                                        or(
                                          or(
                                            or(
                                              eq(nextTok, TId("global")),
                                              eq(nextTok, TId("send")),
                                            ),
                                            eq(nextTok, TId("get")),
                                          ),
                                          eq(nextTok, TId("set")),
                                        ),
                                        eq(nextTok, TId("new")),
                                      )
                                        ? isCurried
                                          ? errAt(
                                              "'curried' applies to a module extern, not a JS convention — give the host's module and export instead",
                                              tokAt(toks, pConv),
                                            )
                                          : _Result_flatMap(
                                              ([convention, p6]) =>
                                                _Result_flatMap(
                                                  ([first, p7]) =>
                                                    ((hasSecond: boolean) =>
                                                      _Result_flatMap(
                                                        ([second, p8]) =>
                                                          Ok(
                                                            _tuple(
                                                              Ast.SExtern(
                                                                nm.name,
                                                                nm.span,
                                                                params,
                                                                t,
                                                                `mochi:${convention.name}:${first}`,
                                                                second,
                                                                false,
                                                                false,
                                                                None as Option<string>,
                                                                toEnd(start, toks, p8),
                                                              ),
                                                              p8,
                                                            ),
                                                          ) as Result<[Stmt, number], PErr>,
                                                        hasSecond
                                                          ? expectStr(toks, p7)
                                                          : (Ok(_tuple("", p7)) as Result<
                                                              [string, number],
                                                              PErr
                                                            >),
                                                      ))(
                                                      match(tokAt(toks, p7).tok)
                                                        .with({ _tag: "TStr" }, () =>
                                                          or(
                                                            eq(convention.name, "global"),
                                                            eq(convention.name, "new"),
                                                          ),
                                                        )
                                                        .otherwise(() => false),
                                                    ),
                                                  expectStr(toks, p6),
                                                ),
                                              expectId(toks, pConv),
                                            )
                                        : _Result_flatMap(
                                            ([moduleName, p6]) =>
                                              _Result_flatMap(
                                                ([importedName, p7]) =>
                                                  Ok(
                                                    _tuple(
                                                      Ast.SExtern(
                                                        nm.name,
                                                        nm.span,
                                                        params,
                                                        t,
                                                        moduleName,
                                                        importedName,
                                                        isCurried,
                                                        false,
                                                        None as Option<string>,
                                                        toEnd(start, toks, p7),
                                                      ),
                                                      p7,
                                                    ),
                                                  ) as Result<[Stmt, number], PErr>,
                                                expectStr(toks, p6),
                                              ),
                                            expectStr(toks, pConv),
                                          ))(tokAt(toks, pConv).tok))(isCurried ? add(p5, 1) : p5))(
                                  eq(tokAt(toks, p5).tok, TId("curried")),
                                ),
                              expectTok(TEq as Tok, toks, p4),
                            ),
                          parseTypeExpr(toks, p3),
                        ),
                      expectTok(TColon as Tok, toks, p2),
                    ),
                  eq(tokAt(toks, p1).tok, TLt as Tok)
                    ? _Result_flatMap(
                        ([names, pParams]) =>
                          _Result_flatMap(
                            (pAfter) =>
                              Ok(
                                _tuple(
                                  map((n: Name) => n.name, names),
                                  pAfter,
                                ),
                              ) as Result<[string[], number], PErr>,
                            expectTok(TGt as Tok, toks, pParams),
                          ),
                        listUntil(TGt as Tok, expectId, toks, add(p1, 1)),
                      )
                    : (Ok(_tuple([] as string[], p1)) as Result<[string[], number], PErr>),
                ),
              expectId(toks, p),
            ),
      expectTok(TExtern as Tok, toks, pos),
    );
  },
);
const parseImportNs: <A, B>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  start: { start: number } & B,
  pos: number,
) => Result<[Stmt, number], PErr> = _curry(
  3,
  <A, B>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    start: { start: number } & B,
    pos: number,
  ) =>
    _Result_flatMap(
      ([asKw, p1]) =>
        eq(asKw.name, "as")
          ? _Result_flatMap(
              ([alias, p2]) =>
                _Result_flatMap(
                  ([kw, p3]) =>
                    eq(kw.name, "from")
                      ? _Result_map(
                          ([path, p4]: [string, number]) =>
                            _tuple(Ast.SImportNs(alias, path, toEnd(start, toks, p4)), p4),
                          expectStr(toks, p3),
                        )
                      : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt(toks, p3)),
                  expectId(toks, p2),
                ),
              expectId(toks, p1),
            )
          : errAt(`expected 'as' in namespace import, got '${asKw.name}'`, tokAt(toks, p1)),
      expectId(toks, pos),
    ),
);
const parseImport: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[Stmt, number], PErr> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        eq(tokAt(toks, p).tok, TStar as Tok)
          ? _Result_flatMap(
              (p1) => parseImportNs(toks, start, p1),
              expectTok(TStar as Tok, toks, p),
            )
          : _Result_flatMap(
              (p1) =>
                _Result_flatMap(
                  ([names, p2]) =>
                    _Result_flatMap(
                      (p3) =>
                        _Result_flatMap(
                          ([kw, p4]) =>
                            eq(kw.name, "from")
                              ? _Result_map(
                                  ([path, p5]: [string, number]) =>
                                    _tuple(Ast.SImport(names, path, toEnd(start, toks, p5)), p5),
                                  expectStr(toks, p4),
                                )
                              : errAt(
                                  `expected 'from' in import, got '${kw.name}'`,
                                  tokAt(toks, p4),
                                ),
                          expectId(toks, p3),
                        ),
                      expectTok(TRbrace as Tok, toks, p2),
                    ),
                  listUntil(TRbrace as Tok, expectId, toks, p1),
                ),
              expectTok(TLbrace as Tok, toks, p),
            ),
      expectTok(TImport as Tok, toks, pos),
    );
  },
);
const parseRecordDestructure: <A, B>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  start: { start: number } & B,
  pos: number,
  tmp: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Stmt[], number, number], PErr> = _curry(
  5,
  <A, B>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    start: { start: number } & B,
    pos: number,
    tmp: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const openSp: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        _Result_flatMap(
          ([fields, p1]) =>
            ((closeSp: Span) =>
              _Result_flatMap(
                (p2) =>
                  _Result_flatMap(
                    (p3) =>
                      _Result_flatMap(
                        ([value, p4]) =>
                          ((whole: Span) =>
                            ((patSpan: Span) =>
                              ((tmpName: string) =>
                                ((header: Stmt) =>
                                  ((access: (a: Name) => Stmt) =>
                                    Ok(
                                      _tuple(
                                        _Array_prepend(header, map(access, fields)),
                                        p4,
                                        add(tmp, 1),
                                      ),
                                    ) as Result<[Stmt[], number, number], PErr>)(
                                    (f: { name: string; span: Span }) =>
                                      Ast.SLet(
                                        f.name,
                                        f.span,
                                        None as Option<TypeExpr>,
                                        Ast.EField(Ast.ERef(tmpName, f.span), f.name, f.span),
                                        false,
                                        None as Option<string>,
                                        f.span,
                                      ),
                                  ))(
                                  Ast.SLet(
                                    tmpName,
                                    patSpan,
                                    None as Option<TypeExpr>,
                                    value,
                                    false,
                                    None as Option<string>,
                                    whole,
                                  ),
                                ))(`$d${show(tmp)}`))(spanning(openSp, closeSp)))(
                            spanning(start, exprSpan(value)),
                          ),
                        parseExpr(toks, p3, hooks),
                      ),
                    expectTok(TEq as Tok, toks, p2),
                  ),
                expectTok(TRbrace as Tok, toks, p1),
              ))(spanOf(tokAt(toks, p1))),
          listUntil(TRbrace as Tok, expectId, toks, p),
        ),
      expectTok(TLbrace as Tok, toks, pos),
    );
  },
);
const parseLet: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  tmp: number,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Stmt[], number, number], PErr> = _curry(
  4,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    tmp: number,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start: Span = spanOf(tokAt(toks, pos));
    return _Result_flatMap(
      (p) =>
        eq(tokAt(toks, p).tok, TLbrace as Tok)
          ? parseRecordDestructure(toks, start, p, tmp, hooks)
          : _Result_flatMap(
              ([nm, p1]) =>
                _Result_flatMap(
                  ([annot, pA]) =>
                    _Result_flatMap(
                      (p2) =>
                        _Result_flatMap(
                          ([value, p3]) =>
                            Ok(
                              _tuple(
                                [
                                  Ast.SLet(
                                    nm.name,
                                    nm.span,
                                    annot,
                                    value,
                                    false,
                                    None as Option<string>,
                                    spanning(start, exprSpan(value)),
                                  ),
                                ],
                                p3,
                                tmp,
                              ),
                            ) as Result<[Stmt[], number, number], PErr>,
                          parseExpr(toks, p2, hooks),
                        ),
                      expectTok(TEq as Tok, toks, pA),
                    ),
                  eq(tokAt(toks, p1).tok, TColon as Tok)
                    ? _Result_map(
                        ([ty, p]: [TypeExpr, number]) => _tuple(Some(ty) as Option<TypeExpr>, p),
                        parseTypeExpr(toks, add(p1, 1)),
                      )
                    : (Ok(_tuple(None as Option<TypeExpr>, p1)) as Result<
                        [Option<TypeExpr>, number],
                        PErr
                      >),
                ),
              expectId(toks, p),
            ),
      expectTok(TLet as Tok, toks, pos),
    );
  },
);
const setLetMeta: {
  (exported: boolean): (doc: Option<string>) => (s: Stmt) => Stmt;
  (exported: boolean): (doc: Option<string>, s: Stmt) => Stmt;
  (exported: boolean, doc: Option<string>): (s: Stmt) => Stmt;
  (exported: boolean, doc: Option<string>, s: Stmt): Stmt;
} = _curry(3, (exported: boolean, doc: Option<string>, s: Stmt) =>
  match(s)
    .with({ _tag: "SLet" }, ({ name, nameSpan, annot, value, span }) =>
      Ast.SLet(name, nameSpan, annot, value, exported, doc, span),
    )
    .otherwise((other) => other),
);
const setTypeMeta: {
  (exported: boolean): (doc: Option<string>) => (s: Stmt) => Stmt;
  (exported: boolean): (doc: Option<string>, s: Stmt) => Stmt;
  (exported: boolean, doc: Option<string>): (s: Stmt) => Stmt;
  (exported: boolean, doc: Option<string>, s: Stmt): Stmt;
} = _curry(3, (exported: boolean, doc: Option<string>, s: Stmt) =>
  match(s)
    .with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, span }) =>
      Ast.SType(name, params, ctors, alias, aliasType, exported, doc, span),
    )
    .otherwise((other) => other),
);
const setExternMeta: {
  (exported: boolean): (doc: Option<string>) => (s: Stmt) => Stmt;
  (exported: boolean): (doc: Option<string>, s: Stmt) => Stmt;
  (exported: boolean, doc: Option<string>): (s: Stmt) => Stmt;
  (exported: boolean, doc: Option<string>, s: Stmt): Stmt;
} = _curry(3, (exported: boolean, doc: Option<string>, s: Stmt) =>
  match(s)
    .with(
      { _tag: "SExtern" },
      ({ name, nameSpan, params, typeExpr: t, module: m, imported: i, curried, span }) =>
        Ast.SExtern(name, nameSpan, params, t, m, i, curried, exported, doc, span),
    )
    .with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, span }) =>
      Ast.SType(name, params, ctors, alias, aliasType, exported, doc, span),
    )
    .otherwise((other) => other),
);
const setExternExported = setExternMeta(true, None as Option<string>);
const parseExprStmt: <A, B>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  tmp: B,
  hooks: ((
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
    c: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Stmt[], number, B], PErr> = _curry(
  4,
  <A, B>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    tmp: B,
    hooks: ((
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
      c: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start = tokAt(toks, pos);
    return _Result_flatMap(
      ([value, p]) =>
        ((p2: number) => Ok(_tuple([Ast.SExpr(value, spanning(start, exprSpan(value)))], p2, tmp)))(
          eq(tokAt(toks, p).tok, TSemi as Tok) ? add(p, 1) : p,
        ),
      parseExpr(toks, pos, hooks),
    );
  },
);
const parseStmt: {
  (
    toks: LocTok[],
  ): (
    pos: number,
  ) => (
    tmp: number,
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => Result<[Stmt[], number, number], PErr>;
  (
    toks: LocTok[],
  ): (
    pos: number,
  ) => (
    tmp: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => Result<[Stmt[], number, number], PErr>;
  (
    toks: LocTok[],
  ): (
    pos: number,
    tmp: number,
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => Result<[Stmt[], number, number], PErr>;
  (
    toks: LocTok[],
    pos: number,
  ): (
    tmp: number,
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => Result<[Stmt[], number, number], PErr>;
  (
    toks: LocTok[],
  ): (
    pos: number,
    tmp: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => Result<[Stmt[], number, number], PErr>;
  (
    toks: LocTok[],
    pos: number,
  ): (
    tmp: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => Result<[Stmt[], number, number], PErr>;
  (
    toks: LocTok[],
    pos: number,
    tmp: number,
  ): (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => Result<[Stmt[], number, number], PErr>;
  (
    toks: LocTok[],
    pos: number,
    tmp: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ): Result<[Stmt[], number, number], PErr>;
} = _curry(
  4,
  (
    toks: LocTok[],
    pos: number,
    tmp: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const lt: LocTok = tokAt(toks, pos);
    const doc: Option<string> = lt.doc;
    return match(lt.tok)
      .with({ _tag: "TImport" }, () =>
        _Result_map(([s, p]: [Stmt, number]) => _tuple([s], p, tmp), parseImport(toks, pos)),
      )
      .with({ _tag: "TExport" }, () =>
        match(tokAt(toks, add(pos, 1)).tok)
          .with({ _tag: "TType" }, () =>
            _Result_map(
              ([s, p]: [Stmt, number]) => _tuple([setTypeMeta(true, doc, s)], p, tmp),
              parseType(toks, add(pos, 1)),
            ),
          )
          .with({ _tag: "TExtern" }, () =>
            _Result_map(
              ([s, p]: [Stmt, number]) => _tuple([setExternMeta(true, doc, s)], p, tmp),
              parseExtern(toks, add(pos, 1)),
            ),
          )
          .with({ _tag: "TLet" }, () =>
            _Result_map(
              ([stmts, p, tmp2]: [Stmt[], number, number]) =>
                _tuple(map(setLetMeta(true, doc), stmts), p, tmp2),
              parseLet(toks, add(pos, 1), tmp, hooks),
            ),
          )
          .otherwise(() =>
            errAt("`export` must precede let, type, or extern", tokAt(toks, add(pos, 1))),
          ),
      )
      .with({ _tag: "TType" }, () =>
        _Result_map(
          ([s, p]: [Stmt, number]) => _tuple([setTypeMeta(false, doc, s)], p, tmp),
          parseType(toks, pos),
        ),
      )
      .with({ _tag: "TExtern" }, () =>
        _Result_map(
          ([s, p]: [Stmt, number]) => _tuple([setExternMeta(false, doc, s)], p, tmp),
          parseExtern(toks, pos),
        ),
      )
      .with({ _tag: "TLet" }, () =>
        _Result_map(
          ([stmts, p, tmp2]: [Stmt[], number, number]) =>
            _tuple(map(setLetMeta(false, doc), stmts), p, tmp2),
          parseLet(toks, pos, tmp, hooks),
        ),
      )
      .otherwise(() => parseExprStmt(toks, pos, tmp, hooks));
  },
);
const isSyncTok: (t: Tok) => boolean = (t: Tok) =>
  match(t)
    .with({ _tag: "TLet" }, () => true)
    .with({ _tag: "TType" }, () => true)
    .with({ _tag: "TExtern" }, () => true)
    .with({ _tag: "TImport" }, () => true)
    .with({ _tag: "TExport" }, () => true)
    .otherwise(() => false);
const isOpener: (t: Tok) => boolean = (t: Tok) =>
  or(or(eq(t, TLparen as Tok), eq(t, TLbrace as Tok)), eq(t, TLbracket as Tok));
const isCloser: (t: Tok) => boolean = (t: Tok) =>
  or(or(eq(t, TRparen as Tok), eq(t, TRbrace as Tok)), eq(t, TRbracket as Tok));
const maxParseErrors: number = 100;
const resumeAt: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  at: number,
) => number = _curry(
  3,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number, at: number) =>
    and(lt(add(pos, 1), length(toks)), lt(tokAt(toks, pos).start, at))
      ? resumeAt(toks, add(pos, 1), at)
      : pos,
);
const skipToSync: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  depth: number,
) => number = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    depth: number,
  ) => {
    const t: Tok = tokAt(toks, pos).tok;
    return or(eq(t, TEof as Tok), and(eq(depth, 0), isSyncTok(t)))
      ? pos
      : skipToSync(
          toks,
          add(pos, 1),
          isOpener(t) ? add(depth, 1) : and(isCloser(t), gt(depth, 0)) ? sub(depth, 1) : depth,
        );
  },
);
const recoverFrom: <A, B>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  before: number,
  failedAt: { start: number } & B,
  at: number,
) => { node: Stmt; pos: number } = _curry(
  4,
  <A, B>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    before: number,
    failedAt: { start: number } & B,
    at: number,
  ) => {
    const resume: number = resumeAt(toks, before, at);
    const start: number = eq(resume, before) ? add(before, 1) : resume;
    const final: number = skipToSync(toks, start, 0);
    return {
      node: Ast.SError({ start: failedAt.start, end: tokAt(toks, sub(final, 1)).end }),
      pos: final,
    };
  },
);
const stmtsLoop: {
  (
    toks: LocTok[],
  ): (
    pos0: number,
  ) => (
    tmp0: number,
  ) => (
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
  ) => (
    tmp0: number,
  ) => (
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
  ) => (
    tmp0: number,
  ) => (
    acc0: Stmt[],
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
  ) => (
    tmp0: number,
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
    tmp0: number,
  ) => (
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
  ): (
    tmp0: number,
  ) => (
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
  ) => (
    tmp0: number,
  ) => (
    acc0: Stmt[],
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
  ) => (
    tmp0: number,
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
  ) => (
    tmp0: number,
    acc0: Stmt[],
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
    tmp0: number,
  ) => (
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
    tmp0: number,
  ) => (
    acc0: Stmt[],
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
    tmp0: number,
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
  ): (
    tmp0: number,
  ) => (
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
  ): (
    tmp0: number,
  ) => (
    acc0: Stmt[],
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
  ): (
    tmp0: number,
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
    tmp0: number,
  ): (
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
  ) => (
    tmp0: number,
    acc0: Stmt[],
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
    tmp0: number,
  ) => (
    acc0: Stmt[],
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
    tmp0: number,
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
    tmp0: number,
    acc0: Stmt[],
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
  ): (
    tmp0: number,
  ) => (
    acc0: Stmt[],
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
  ): (
    tmp0: number,
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
  ): (
    tmp0: number,
    acc0: Stmt[],
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
    tmp0: number,
  ): (
    acc0: Stmt[],
  ) => (
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
    tmp0: number,
  ): (
    acc0: Stmt[],
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
    tmp0: number,
    acc0: Stmt[],
  ): (
    diags0: PErr[],
  ) => (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
  ): (
    pos0: number,
    tmp0: number,
    acc0: Stmt[],
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
  ): (
    tmp0: number,
    acc0: Stmt[],
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
    tmp0: number,
  ): (
    acc0: Stmt[],
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
    tmp0: number,
    acc0: Stmt[],
  ): (
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
    tmp0: number,
    acc0: Stmt[],
    diags0: PErr[],
  ): (
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => { stmts: Stmt[]; diagnostics: PErr[] };
  (
    toks: LocTok[],
    pos0: number,
    tmp0: number,
    acc0: Stmt[],
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ): { stmts: Stmt[]; diagnostics: PErr[] };
} = _curry(
  6,
  (
    toks: LocTok[],
    pos0: number,
    tmp0: number,
    acc0: Stmt[],
    diags0: PErr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    let pos: number = pos0;
    let tmp: number = tmp0;
    let acc: Stmt[] = acc0;
    let diags: PErr[] = diags0;
    while (true) {
      if (eq(tokAt(toks, pos).tok, TEof as Tok)) {
        return { stmts: acc, diagnostics: diags };
      } else {
        {
          const failedAt: LocTok = tokAt(toks, pos);
          const _step = match(parseStmt(toks, pos, tmp, hooks))
            .with(
              (_v): _v is Extract<Result<[Stmt[], number, number], PErr>, { _tag: "Ok" }> => {
                const _g: any = _v;
                return _g._tag === "Ok";
              },
              ({ value: [stmts, p, tmp2] }) =>
                eq(p, pos)
                  ? ((r: { node: Stmt; pos: number }) =>
                      _recur(
                        r.pos,
                        tmp,
                        _Array_append(r.node, acc),
                        _Array_append(
                          {
                            message: `unexpected token ${tokName(failedAt.tok)}`,
                            start: failedAt.start,
                            end: failedAt.end,
                          },
                          diags,
                        ),
                      ))(recoverFrom(toks, pos, failedAt, failedAt.start))
                  : _recur(p, tmp2, _Array_concat(acc, stmts), diags),
            )
            .with({ _tag: "Err" }, ({ error: d }) =>
              ((ds: PErr[]) =>
                gte(length(ds), maxParseErrors)
                  ? _done({
                      stmts: _Array_append(
                        Ast.SError({
                          start: failedAt.start,
                          end: tokAt(toks, sub(length(toks), 1)).end,
                        }),
                        acc,
                      ),
                      diagnostics: _Array_append(
                        {
                          message: "too many parse errors; stopping",
                          start: failedAt.start,
                          end: failedAt.end,
                        },
                        ds,
                      ),
                    })
                  : ((r: { node: Stmt; pos: number }) =>
                      _recur(r.pos, tmp, _Array_append(r.node, acc), ds))(
                      recoverFrom(toks, pos, failedAt, d.start),
                    ))(_Array_append(d, diags)),
            )
            .exhaustive();
          if (_step._tag === "recur") {
            [pos, tmp, acc, diags] = _step.args;
            continue;
          }
          return _step.value;
        }
      }
    }
  },
);
export const parseRecovering: <A, B, C>(
  toks: LocTok[],
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: LocTok[],
          b: number,
          c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: A,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: Span) => Result<St, B>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], B>;
          } & C,
        ) => Result<Option<[Ty, St]>, B>
      >;
    }[]
  >,
) => { stmts: Stmt[]; diagnostics: PErr[] } = _curry(
  2,
  <A, B, C>(
    toks: LocTok[],
    pluginsOpt: Option<
      {
        name: string;
        parse: Option<
          (
            a: LocTok[],
            b: number,
            c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: A,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: {
              unify: (a: Ty, b: Ty, c: St, d: Span) => Result<St, B>;
              inferExpr: (a: Expr, b: St) => Result<[Ty, St], B>;
            } & C,
          ) => Result<Option<[Ty, St]>, B>
        >;
      }[]
    >,
  ) => {
    const hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[] = parseHooksOf(resolvePluginsDefault(pluginsOpt));
    return stmtsLoop(
      toks,
      match(tokAt(toks, 0).tok)
        .with({ _tag: "TStr" }, ({ value }) => (eq(value, "use open") ? 1 : 0))
        .otherwise(() => 0),
      0,
      [] as Stmt[],
      [] as PErr[],
      hooks,
    );
  },
);
export const parse: (toks: LocTok[]) => Result<Stmt[], PErr> = (toks: LocTok[]) =>
  parseWith(toks, None);
export const parseWith: <A, B, C>(
  toks: LocTok[],
  pluginsOpt: Option<
    {
      name: string;
      parse: Option<
        (
          a: LocTok[],
          b: number,
          c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
        ) => Result<Option<[Expr, number]>, PErr>
      >;
      inferCall: Option<
        (
          a: A,
          b: Expr[],
          c: Option<string>,
          d: St,
          e: {
            unify: (a: Ty, b: Ty, c: St, d: Span) => Result<St, B>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], B>;
          } & C,
        ) => Result<Option<[Ty, St]>, B>
      >;
    }[]
  >,
) => Result<Stmt[], PErr> = _curry(
  2,
  <A, B, C>(
    toks: LocTok[],
    pluginsOpt: Option<
      {
        name: string;
        parse: Option<
          (
            a: LocTok[],
            b: number,
            c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
          ) => Result<Option<[Expr, number]>, PErr>
        >;
        inferCall: Option<
          (
            a: A,
            b: Expr[],
            c: Option<string>,
            d: St,
            e: {
              unify: (a: Ty, b: Ty, c: St, d: Span) => Result<St, B>;
              inferExpr: (a: Expr, b: St) => Result<[Ty, St], B>;
            } & C,
          ) => Result<Option<[Ty, St]>, B>
        >;
      }[]
    >,
  ) => {
    const r: { stmts: Stmt[]; diagnostics: PErr[] } = parseRecovering(toks, pluginsOpt);
    return match(_Array_get(0, r.diagnostics))
      .with({ _tag: "Some" }, ({ value: d }) => Err(d) as Result<Stmt[], PErr>)
      .with({ _tag: "None" }, () => Ok(r.stmts) as Result<Stmt[], PErr>)
      .exhaustive();
  },
);
