import type { LocTok, Tok } from "../../lexer/lexer";
import type { Expr, Field, Name, SeqElem } from "../../ast/ast";
import type { Row, SpanAt, St, Ty } from "../../infer/types";
import type { Doc } from "../../doc/doc";
import type { FormatApi } from "../../format/format-api";
import type { Ctx } from "../../format/format";

export type Hint = { title: string; start: number; end: number; replaceWith: string };
export type BoundErr = {
  message: string;
  start: number;
  end: number;
  help: Option<string>;
  suggestions: Hint[];
};
export type JsxShape = { tag: Expr; fields: Field[]; spread: Option<Expr>; children: SeqElem[] };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_append,
  _Array_concat,
  _Array_find,
  _Array_get,
  _Map_get,
  _Map_keys,
  _Option_exists,
  _Option_isSome,
  _Option_match,
  _Option_unwrapOr,
  _Result_flatMap,
  _Result_map,
  _Str_codeAt,
  _Str_contains,
  _Str_join,
  _Str_length,
  _Str_slice,
  _Str_split,
  _Str_startsWith,
  _curry,
  _keyOf,
  _tuple,
  and,
  eq,
  gt,
  length,
  lt,
  map,
  not,
  or,
  reduce,
  show,
  sub,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "../../ast/ast";
import {
  recordBinder,
  zonk,
  tPrim,
  tRecord,
  tLit,
  tUnion,
  rExtend,
  TyFn,
  TyVar,
  TyCon,
  TyRecord,
  RowExtend,
  RowEmpty,
  RowVar,
} from "../../infer/types";
import { closestName } from "../../errors/suggest";
import * as Fmt from "../../format/format-api";
import { cat, group, indent, line, softline, txt } from "../../doc/doc";
import * as Lexer from "../../lexer/lexer";
import {
  TLet,
  TType,
  TExtern,
  TSwitch,
  TLoop,
  TRecur,
  TDo,
  TImport,
  TExport,
  TEq,
  TLbrace,
  TRbrace,
  TSpread,
  TSlash,
  TMinus,
  TLt,
  TGt,
  TNum,
  TBool,
  TStr,
  TId,
  TEof,
} from "../../lexer/lexer";
const jxTokName: (t: Tok) => string = (t: Tok) => {
  const $match = t;
  switch ($match._tag) {
    case "TEq": {
      return "eq";
    }
    case "TLbrace": {
      return "lbrace";
    }
    case "TRbrace": {
      return "rbrace";
    }
    case "TSpread": {
      return "spread";
    }
    case "TSlash": {
      return "slash";
    }
    case "TLt": {
      return "lt";
    }
    case "TGt": {
      return "gt";
    }
    case "TId": {
      return "id";
    }
    case "TStr": {
      return "str";
    }
    case "TNum": {
      return "num";
    }
    case "TBool": {
      return "bool";
    }
    case "TEof": {
      return "eof";
    }
    default: {
      return "tok";
    }
  }
};
const jxEofTok = { tok: TEof as Tok, start: 0, end: 0, doc: None };
const jxTokAt = (toks: LocTok[], i: number): LocTok =>
  _Option_unwrapOr(jxEofTok, _Array_get(i, toks));
const jxSpanOf: <C>(lt: { end: number; start: number } & C) => SpanAt = <C>(
  lt: { end: number; start: number } & C,
) => ({ start: lt.start, end: lt.end });
const jxToEnd: <C>(start: { start: number } & C, toks: LocTok[], pos: number) => SpanAt = _curry(
  3,
  <C>(start: { start: number } & C, toks: LocTok[], pos: number) => ({
    start: start.start,
    end: jxTokAt(toks, pos - 1).end,
  }),
);
const jxErrAt: <A, B, C, D, E>(
  message: A,
  lt: { end: B; start: C } & E,
) => Result<D, { message: A; start: C; end: B }> = _curry(
  2,
  <A, B, C, D, E>(message: A, lt: { end: B; start: C } & E) =>
    Err({ message: message, start: lt.start, end: lt.end }),
);
const jxExpectTok = (
  t: Tok,
  toks: LocTok[],
  pos: number,
): Result<number, { message: string; start: number; end: number }> => {
  const lt = jxTokAt(toks, pos);
  return eq(lt.tok, t)
    ? (Ok(pos + 1) as Result<number, { message: string; start: number; end: number }>)
    : jxErrAt(`expected ${jxTokName(t)}, got ${jxTokName(lt.tok)}`, lt);
};
const jxExpectId = (
  toks: LocTok[],
  pos: number,
): Result<[Name, number], { message: string; start: number; end: number }> => {
  const lt = jxTokAt(toks, pos);
  const $match = lt.tok;
  switch ($match._tag) {
    case "TId": {
      const { value: name } = $match;
      return Ok(_tuple({ name: name, span: jxSpanOf(lt) }, pos + 1)) as Result<
        [Name, number],
        { message: string; start: number; end: number }
      >;
    }
    default: {
      const t = $match;
      return jxErrAt(`expected id, got ${jxTokName(t)}`, lt);
    }
  }
};
/**
 * Keyword spelling, mirroring `parser.mochi`'s `keywordText` (ADR 0077). The
 * plugin carries its own copy for the same reason it carries `jxTokName`: it
 * sees the token stream, not the parser's internals.
 */
const jxKeywordText: (t: Tok) => Option<string> = (t: Tok) => {
  const $match = t;
  switch ($match._tag) {
    case "TLet": {
      return Some("let") as Option<string>;
    }
    case "TType": {
      return Some("type") as Option<string>;
    }
    case "TExtern": {
      return Some("extern") as Option<string>;
    }
    case "TSwitch": {
      return Some("switch") as Option<string>;
    }
    case "TLoop": {
      return Some("loop") as Option<string>;
    }
    case "TRecur": {
      return Some("recur") as Option<string>;
    }
    case "TDo": {
      return Some("do") as Option<string>;
    }
    case "TImport": {
      return Some("import") as Option<string>;
    }
    case "TExport": {
      return Some("export") as Option<string>;
    }
    default: {
      return None as Option<string>;
    }
  }
};
/**
 * Attribute name. A keyword is legal here (ADR 0077) — `type="button"` is the
 * case that forced it. A valueless attr lowers to `true`, not a reference, so
 * there is no pun to reject.
 */
const jxExpectLabel = (
  toks: LocTok[],
  pos: number,
): Result<[Name, number], { message: string; start: number; end: number }> => {
  const lt = jxTokAt(toks, pos);
  return _Option_match(
    jxKeywordText(lt.tok),
    () => jxExpectId(toks, pos),
    (name) =>
      Ok(_tuple({ name: name, span: jxSpanOf(lt) }, pos + 1)) as Result<
        [Name, number],
        { message: string; start: number; end: number }
      >,
  );
};
/**
 * Attribute names may contain hyphens (`data-testid`, `aria-label`). The lexer
 * splits those into label/minus/label, so glue the parts back together — but
 * only while the tokens are ADJACENT, or `<div id - x="1">` would silently
 * become `id-x`.
 */
const jxAttrNameFrom = (toks: LocTok[], pos: number, acc: Name): [Name, number] => {
  const minusTok = jxTokAt(toks, pos);
  const partTok = jxTokAt(toks, pos + 1);
  return and(
    and(minusTok.tok._tag === "TMinus", eq(minusTok.start, acc.span.end)),
    eq(partTok.start, minusTok.end),
  )
    ? ((_v) =>
        _v._tag === "Ok"
          ? (({ value: [part, p1] }) =>
              jxAttrNameFrom(toks, p1, {
                name: `${acc.name}-${part.name}`,
                span: { start: acc.span.start, end: part.span.end },
              }))(
              _v as Extract<
                Result<[Name, number], { message: string; start: number; end: number }>,
                { _tag: "Ok" }
              >,
            )
          : _v._tag === "Err"
            ? _tuple(acc, pos)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(jxExpectLabel(toks, pos + 1))
    : _tuple(acc, pos);
};
/**
 * `jxExpectLabel` plus any adjacent `-part` continuations.
 */
const jxExpectAttrName = (
  toks: LocTok[],
  pos: number,
): Result<[Name, number], { message: string; start: number; end: number }> =>
  _Result_map(
    ([head, p1]: [Name, number]) => jxAttrNameFrom(toks, p1, head),
    jxExpectLabel(toks, pos),
  );
const jxIsUpper: (s: string) => boolean = (s: string) =>
  _Option_exists((n: number) => and(n >= 65, n <= 90), _Str_codeAt(0, s));
const jxExprSpan: (e: Expr) => SpanAt = (e: Expr) => {
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
const makeJsxCall: <B>(
  tagExpr: Expr,
  fields: Field[],
  spreadOpt: Option<Expr>,
  children: SeqElem[],
  startTok: { end: number; start: number } & B,
  toks: LocTok[],
  endPos: number,
) => Expr = _curry(
  7,
  <B>(
    tagExpr: Expr,
    fields: Field[],
    spreadOpt: Option<Expr>,
    children: SeqElem[],
    startTok: { end: number; start: number } & B,
    toks: LocTok[],
    endPos: number,
  ) => {
    const fullSpan: SpanAt = jxToEnd(jxSpanOf(startTok), toks, endPos);
    const pragmaRef: Expr = Ast.ERef("h", jxSpanOf(startTok));
    const propsRecord: Expr = Ast.ERecord(fields, spreadOpt, fullSpan);
    const childrenArr: Expr = Ast.EArr(children, fullSpan);
    return Ast.ECall(
      pragmaRef,
      [tagExpr, propsRecord, childrenArr],
      Some("jsx") as Option<string>,
      fullSpan,
    );
  },
);
const parseJsxAttributes = (
  toks: LocTok[],
  pos: number,
  fieldsAcc: Field[],
  spreadAcc: Option<Expr>,
  parseExpr: (
    a: LocTok[],
    b: number,
  ) => Result<[Expr, number], { message: string; start: number; end: number }>,
): Result<[Field[], Option<Expr>, number], { message: string; start: number; end: number }> => {
  const tk: Tok = jxTokAt(toks, pos).tok;
  const nxt: Tok = jxTokAt(toks, pos + 1).tok;
  return or(tk._tag === "TGt", and(tk._tag === "TSlash", nxt._tag === "TGt"))
    ? (Ok(_tuple(fieldsAcc, spreadAcc, pos)) as Result<
        [Field[], Option<Expr>, number],
        { message: string; start: number; end: number }
      >)
    : tk._tag === "TLbrace"
      ? _Result_flatMap(
          (p1) =>
            _Result_flatMap(
              ([spExpr, p2]: [Expr, number]) =>
                _Result_flatMap(
                  (p3) =>
                    parseJsxAttributes(
                      toks,
                      p3,
                      fieldsAcc,
                      Some(spExpr) as Option<Expr>,
                      parseExpr,
                    ),
                  jxExpectTok(TRbrace as Tok, toks, p2),
                ),
              parseExpr(toks, p1),
            ),
          jxExpectTok(TSpread as Tok, toks, pos + 1),
        )
      : _Result_flatMap(
          ([attrId, p1]) =>
            (([valExpr, p2]: [Expr, number]) => {
              const field: Field = { name: attrId.name, nameSpan: attrId.span, value: valExpr };
              return parseJsxAttributes(
                toks,
                p2,
                _Array_append(field, fieldsAcc),
                spreadAcc,
                parseExpr,
              );
            })(
              jxTokAt(toks, p1).tok._tag === "TEq"
                ? ((pEq: number) =>
                    ((_v) =>
                      _v._tag === "TStr"
                        ? (({ value: v }) =>
                            _tuple(Ast.EStr(v, jxSpanOf(jxTokAt(toks, pEq))), pEq + 1))(_v)
                        : _v._tag === "TLbrace"
                          ? ((_v) =>
                              _v._tag === "Ok"
                                ? (({ value: [e, pR] }) => _tuple(e, pR + 1))(
                                    _v as Extract<
                                      Result<
                                        [Expr, number],
                                        { message: string; start: number; end: number }
                                      >,
                                      { _tag: "Ok" }
                                    >,
                                  )
                                : _v._tag === "Err"
                                  ? _tuple(Ast.EBool(true, attrId.span), pEq)
                                  : (() => {
                                      throw new Error("non-exhaustive match");
                                    })())(parseExpr(toks, pEq + 1))
                          : _tuple(Ast.EBool(true, attrId.span), pEq))(jxTokAt(toks, pEq).tok))(
                    p1 + 1,
                  )
                : _tuple(Ast.EBool(true, attrId.span), p1),
            ),
          jxExpectAttrName(toks, pos),
        );
};
const parseJsxChildren = (
  expectedTag: string,
  toks: LocTok[],
  pos: number,
  acc: SeqElem[],
  parseExpr: (
    a: LocTok[],
    b: number,
  ) => Result<[Expr, number], { message: string; start: number; end: number }>,
): Result<[SeqElem[], number], { message: string; start: number; end: number }> => {
  const lt = jxTokAt(toks, pos);
  const nxt = jxTokAt(toks, pos + 1);
  return lt.tok._tag === "TEof"
    ? jxErrAt(expectedTag === "" ? "unclosed JSX fragment" : "unclosed JSX tag", lt)
    : and(lt.tok._tag === "TLt", nxt.tok._tag === "TSlash")
      ? expectedTag === ""
        ? _Result_flatMap(
            (p1) =>
              Ok(_tuple(acc, p1)) as Result<
                [SeqElem[], number],
                { message: string; start: number; end: number }
              >,
            jxExpectTok(TGt as Tok, toks, pos + 2),
          )
        : _Result_flatMap(
            ([closingId, p1]) =>
              _Result_flatMap(
                (p2) =>
                  eq(closingId.name, expectedTag)
                    ? (Ok(_tuple(acc, p2)) as Result<
                        [SeqElem[], number],
                        { message: string; start: number; end: number }
                      >)
                    : jxErrAt("mismatched JSX closing tag", lt),
                jxExpectTok(TGt as Tok, toks, p1),
              ),
            jxExpectId(toks, pos + 2),
          )
      : lt.tok._tag === "TLt"
        ? _Result_flatMap(
            ([childJsx, p1]: [Expr, number]) =>
              parseJsxChildren(
                expectedTag,
                toks,
                p1,
                _Array_append(Ast.SEExpr(childJsx), acc),
                parseExpr,
              ),
            parseJsx(toks, pos, parseExpr),
          )
        : lt.tok._tag === "TLbrace"
          ? nxt.tok._tag === "TSpread"
            ? _Result_flatMap(
                ([spChild, p1]: [Expr, number]) =>
                  _Result_flatMap(
                    (p2) =>
                      parseJsxChildren(
                        expectedTag,
                        toks,
                        p2,
                        _Array_append(Ast.SESpread(spChild), acc),
                        parseExpr,
                      ),
                    jxExpectTok(TRbrace as Tok, toks, p1),
                  ),
                parseExpr(toks, pos + 2),
              )
            : _Result_flatMap(
                ([childExpr, p1]: [Expr, number]) =>
                  _Result_flatMap(
                    (p2) =>
                      parseJsxChildren(
                        expectedTag,
                        toks,
                        p2,
                        _Array_append(Ast.SEExpr(childExpr), acc),
                        parseExpr,
                      ),
                    jxExpectTok(TRbrace as Tok, toks, p1),
                  ),
                parseExpr(toks, pos + 1),
              )
          : ((_v) =>
              _v._tag === "TStr"
                ? (({ value: v }) =>
                    parseJsxChildren(
                      expectedTag,
                      toks,
                      pos + 1,
                      _Array_append(Ast.SEExpr(Ast.EStr(v, jxSpanOf(lt))), acc),
                      parseExpr,
                    ))(_v)
                : _v._tag === "TNum"
                  ? (({ value: v, raw }) =>
                      parseJsxChildren(
                        expectedTag,
                        toks,
                        pos + 1,
                        _Array_append(Ast.SEExpr(Ast.ENum(v, raw, jxSpanOf(lt))), acc),
                        parseExpr,
                      ))(_v)
                  : _v._tag === "TBool"
                    ? (({ value: v }) =>
                        parseJsxChildren(
                          expectedTag,
                          toks,
                          pos + 1,
                          _Array_append(Ast.SEExpr(Ast.EBool(v, jxSpanOf(lt))), acc),
                          parseExpr,
                        ))(_v)
                    : _v._tag === "TId"
                      ? (({ value: v }) =>
                          parseJsxChildren(
                            expectedTag,
                            toks,
                            pos + 1,
                            _Array_append(Ast.SEExpr(Ast.EStr(v, jxSpanOf(lt))), acc),
                            parseExpr,
                          ))(_v)
                      : jxErrAt("unexpected token in JSX children", lt))(lt.tok);
};
const parseJsx = (
  toks: LocTok[],
  pos: number,
  parseExpr: (
    a: LocTok[],
    b: number,
  ) => Result<[Expr, number], { message: string; start: number; end: number }>,
): Result<[Expr, number], { message: string; start: number; end: number }> => {
  const startTok = jxTokAt(toks, pos);
  const nxt = jxTokAt(toks, pos + 1);
  return nxt.tok._tag === "TGt"
    ? _Result_flatMap(
        ([children, p1]: [SeqElem[], number]) =>
          Ok(
            _tuple(
              makeJsxCall(
                Ast.EStr("Fragment", jxSpanOf(startTok)),
                [] as Field[],
                None as Option<Expr>,
                children,
                startTok,
                toks,
                p1,
              ),
              p1,
            ),
          ) as Result<[Expr, number], { message: string; start: number; end: number }>,
        parseJsxChildren("", toks, pos + 2, [] as SeqElem[], parseExpr),
      )
    : _Result_flatMap(
        ([firstId, p1]) =>
          ((tagRef: Expr) =>
            ((tagNameStr: string) =>
              _Result_flatMap(
                ([fields, spreadOpt, p2]: [Field[], Option<Expr>, number]) => {
                  const isSelfClosing: boolean = jxTokAt(toks, p2).tok._tag === "TSlash";
                  return _Result_flatMap(
                    (p3) =>
                      isSelfClosing
                        ? (Ok(
                            _tuple(
                              makeJsxCall(
                                tagRef,
                                fields,
                                spreadOpt,
                                [] as SeqElem[],
                                startTok,
                                toks,
                                p3,
                              ),
                              p3,
                            ),
                          ) as Result<
                            [Expr, number],
                            { message: string; start: number; end: number }
                          >)
                        : _Result_flatMap(
                            ([children, p4]: [SeqElem[], number]) =>
                              Ok(
                                _tuple(
                                  makeJsxCall(
                                    tagRef,
                                    fields,
                                    spreadOpt,
                                    children,
                                    startTok,
                                    toks,
                                    p4,
                                  ),
                                  p4,
                                ),
                              ) as Result<
                                [Expr, number],
                                { message: string; start: number; end: number }
                              >,
                            parseJsxChildren(tagNameStr, toks, p3, [] as SeqElem[], parseExpr),
                          ),
                    isSelfClosing
                      ? jxExpectTok(TGt as Tok, toks, p2 + 1)
                      : jxExpectTok(TGt as Tok, toks, p2),
                  );
                },
                parseJsxAttributes(toks, p1, [] as Field[], None as Option<Expr>, parseExpr),
              ))(firstId.name))(
            jxIsUpper(firstId.name)
              ? Ast.ERef(firstId.name, firstId.span)
              : Ast.EStr(firstId.name, firstId.span),
          ),
        jxExpectId(toks, pos + 1),
      );
};
const parseJsxAtom$ = (
  toks: LocTok[],
  pos: number,
  parseExpr: (
    a: LocTok[],
    b: number,
  ) => Result<[Expr, number], { message: string; start: number; end: number }>,
): Result<Option<[Expr, number]>, { message: string; start: number; end: number }> =>
  jxTokAt(toks, pos).tok._tag === "TLt"
    ? _Result_map(
        (claim: [Expr, number]) => Some(claim) as Option<[Expr, number]>,
        parseJsx(toks, pos, parseExpr),
      )
    : (Ok(None as Option<[Expr, number]>) as Result<
        Option<[Expr, number]>,
        { message: string; start: number; end: number }
      >);
/**
 * Parse hook: claim a leading `<…>`; otherwise Ok(None) fall-through.
 */
export const parseJsxAtom: _Curry<
  [
    toks: LocTok[],
    pos: number,
    parseExpr: (
      a: LocTok[],
      b: number,
    ) => Result<[Expr, number], { message: string; start: number; end: number }>,
  ],
  Result<Option<[Expr, number]>, { message: string; start: number; end: number }>
> = _curry(3, parseJsxAtom$);
const seqElemExpr: (el: SeqElem) => Expr = (el: SeqElem) => {
  const $match = el;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: e } = $match;
      return e;
    }
    case "SESpread": {
      const { expr: e } = $match;
      return e;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const inferJsxArrElems: <A, B, C>(
  elements: SeqElem[],
  st: A,
  inferExpr: (a: Expr, b: A) => Result<[B, A], C>,
) => Result<A, C> = _curry(
  3,
  <A, B, C>(elements: SeqElem[], st: A, inferExpr: (a: Expr, b: A) => Result<[B, A], C>) =>
    ((_v) =>
      _v.length === 0
        ? Ok(st)
        : _v.length >= 1
          ? (([el, ...rest]) =>
              _Result_flatMap(
                ([, st1]: [B, A]) => inferJsxArrElems(rest, st1, inferExpr),
                inferExpr(seqElemExpr(el), st),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(elements),
);
const inferJsxChildren: <A, B, C>(
  children: Expr[],
  st: A,
  inferExpr: (a: Expr, b: A) => Result<[B, A], C>,
) => Result<A, C> = _curry(
  3,
  <A, B, C>(children: Expr[], st: A, inferExpr: (a: Expr, b: A) => Result<[B, A], C>) =>
    ((_v) =>
      _v.length === 0
        ? Ok(st)
        : _v.length >= 1 && _v[0]._tag === "EArr"
          ? (([{ elements }, ...rest]) =>
              _Result_flatMap(
                (st1: A) => inferJsxChildren(rest, st1, inferExpr),
                inferJsxArrElems(elements, st, inferExpr),
              ))(_v as [Extract<Expr[][number], { _tag: "EArr" }>, ...Expr[]])
          : _v.length >= 1
            ? (([child, ...rest]) =>
                _Result_flatMap(
                  ([, st1]: [B, A]) => inferJsxChildren(rest, st1, inferExpr),
                  inferExpr(child, st),
                ))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(children),
);
/**
 * Walk a row for `label`; open tails / missing labels → None.
 */
const rowField = (row: Row, label: string): Option<Ty> => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { label: l, fieldType, rest } = $match;
      return eq(l, label) ? (Some(fieldType) as Option<Ty>) : rowField(rest, label);
    }
    case "RowEmpty": {
      return None as Option<Ty>;
    }
    case "RowVar": {
      return None as Option<Ty>;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const fieldNamed: <A, B>(label: A, fields: ({ name: A } & B)[]) => boolean = _curry(
  2,
  <A, B>(label: A, fields: ({ name: A } & B)[]) =>
    match(fields)
      .with(
        (_v) => _v.length === 0,
        () => false,
      )
      .with(
        (_v) => _v.length >= 1,
        ([f, ...rest]) => or(eq(f.name, label), fieldNamed(label, rest)),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const recordHasAttr = (expr: Expr, label: string): boolean => {
  const $match = expr;
  switch ($match._tag) {
    case "ERecord": {
      const { fields } = $match;
      return fieldNamed(label, fields);
    }
    default: {
      return false;
    }
  }
};
const jsxChildCount: (restArgs: Expr[]) => number = (restArgs: Expr[]) =>
  ((_v) =>
    _v.length >= 1 && _v[0]._tag === "EArr"
      ? (([{ elements }]) => length(elements))(
          _v as [Extract<Expr[][number], { _tag: "EArr" }>, ...Expr[]],
        )
      : 0)(restArgs);
/**
 * Runtime hosts fold h's 3rd arg into props.children. When the component
 * expects that field and the JSX body supplied kids, synthesize it onto the
 * attrs type before unify (mirrors TS `jsxPropsWithSynthesizedChildren`).
 */
const jsxPropsWithSynthesizedChildren = (
  propsT: Ty,
  propsExpr: Expr,
  expectedRow: Row,
  restArgs: Expr[],
): Ty =>
  _Option_match(
    rowField(expectedRow, "children"),
    () => propsT,
    (expectedChildren) => {
      const $match = propsT;
      switch ($match._tag) {
        case "TyRecord": {
          const { row: prow } = $match;
          return or(recordHasAttr(propsExpr, "children"), jsxChildCount(restArgs) === 0)
            ? propsT
            : tRecord(rExtend("children", expectedChildren, prow));
        }
        default: {
          return propsT;
        }
      }
    },
  );
import { intrinsicElements as jsxIntrinsicElements } from "./jsx-schema.gen.mjs";
/**
 * A kind string from the generated schema as an HM type. `event` and `any` are
 * SHAPE checks rather than unifications, so they carry no expected type here.
 */
const attrKindType: (kind: string) => Option<Ty> = (kind: string) =>
  kind === "string"
    ? (Some(tPrim("string")) as Option<Ty>)
    : kind === "number"
      ? (Some(tPrim("number")) as Option<Ty>)
      : kind === "bool"
        ? (Some(tPrim("bool")) as Option<Ty>)
        : kind === "string|number"
          ? (Some(tUnion([tPrim("string"), tPrim("number")])) as Option<Ty>)
          : kind === "string|bool"
            ? (Some(tUnion([tPrim("string"), tPrim("bool")])) as Option<Ty>)
            : _Str_startsWith("enum:", kind)
              ? (Some(
                  tUnion(map(tLit, _Str_split(",", _Str_slice(5, _Str_length(kind), kind)))),
                ) as Option<Ty>)
              : (None as Option<Ty>);
const mismatchHint: (name: string) => Option<string> = (name: string) =>
  ((_v) =>
    _v === "class"
      ? (Some("In JSX, use 'className' instead of 'class'.") as Option<string>)
      : _v === "for"
        ? (Some("In JSX, use 'htmlFor' instead of 'for'.") as Option<string>)
        : _v === "tabindex"
          ? (Some("In JSX, use 'tabIndex' instead of 'tabindex'.") as Option<string>)
          : _v === "autofocus"
            ? (Some("In JSX, use 'autoFocus' instead of 'autofocus'.") as Option<string>)
            : _v === "autocomplete"
              ? (Some("In JSX, use 'autoComplete' instead of 'autocomplete'.") as Option<string>)
              : _v === "readonly"
                ? (Some("In JSX, use 'readOnly' instead of 'readonly'.") as Option<string>)
                : _v === "maxlength"
                  ? (Some("In JSX, use 'maxLength' instead of 'maxlength'.") as Option<string>)
                  : _v === "minlength"
                    ? (Some("In JSX, use 'minLength' instead of 'minlength'.") as Option<string>)
                    : _v === "spellcheck"
                      ? (Some(
                          "In JSX, use 'spellCheck' instead of 'spellcheck'.",
                        ) as Option<string>)
                      : _v === "contenteditable"
                        ? (Some(
                            "In JSX, use 'contentEditable' instead of 'contenteditable'.",
                          ) as Option<string>)
                        : _v === "viewbox"
                          ? (Some("In JSX, use 'viewBox' instead of 'viewbox'.") as Option<string>)
                          : _v === "strokewidth"
                            ? (Some(
                                "In JSX, use 'strokeWidth' instead of 'strokewidth'.",
                              ) as Option<string>)
                            : _v === "strokelinecap"
                              ? (Some(
                                  "In JSX, use 'strokeLinecap' instead of 'strokelinecap'.",
                                ) as Option<string>)
                              : _v === "strokelinejoin"
                                ? (Some(
                                    "In JSX, use 'strokeLinejoin' instead of 'strokelinejoin'.",
                                  ) as Option<string>)
                                : _v === "onclick"
                                  ? (Some(
                                      "In JSX, event handlers are camelCase: use 'onClick' instead of 'onclick'.",
                                    ) as Option<string>)
                                  : _v === "onchange"
                                    ? (Some(
                                        "In JSX, event handlers are camelCase: use 'onChange' instead of 'onchange'.",
                                      ) as Option<string>)
                                    : _v === "oninput"
                                      ? (Some(
                                          "In JSX, event handlers are camelCase: use 'onInput' instead of 'oninput'.",
                                        ) as Option<string>)
                                      : _v === "onkeydown"
                                        ? (Some(
                                            "In JSX, event handlers are camelCase: use 'onKeyDown' instead of 'onkeydown'.",
                                          ) as Option<string>)
                                        : _v === "onkeyup"
                                          ? (Some(
                                              "In JSX, event handlers are camelCase: use 'onKeyUp' instead of 'onkeyup'.",
                                            ) as Option<string>)
                                          : _v === "onsubmit"
                                            ? (Some(
                                                "In JSX, event handlers are camelCase: use 'onSubmit' instead of 'onsubmit'.",
                                              ) as Option<string>)
                                            : _v === "onfocus"
                                              ? (Some(
                                                  "In JSX, event handlers are camelCase: use 'onFocus' instead of 'onfocus'.",
                                                ) as Option<string>)
                                              : _v === "onblur"
                                                ? (Some(
                                                    "In JSX, event handlers are camelCase: use 'onBlur' instead of 'onblur'.",
                                                  ) as Option<string>)
                                                : (None as Option<string>))(name);

const noJxSuggestions: Hint[] = [] as Hint[];
const jxTypeErr: <A>(message: string, sp: SpanAt) => Result<A, BoundErr> = _curry(
  2,
  <A>(message: string, sp: SpanAt) =>
    Err({
      message: message,
      start: sp.start,
      end: sp.end,
      help: None as Option<string>,
      suggestions: noJxSuggestions,
    }),
);
const isHandlerName: (name: string) => boolean = (name: string) =>
  and(and(_Str_startsWith("on", name), _Str_length(name) > 2), jxIsUpper(_Str_slice(2, 3, name)));
const isFnOrOpen: (t: Ty) => boolean = (t: Ty) => {
  const $match = t;
  switch ($match._tag) {
    case "TyFn": {
      return true;
    }
    case "TyVar": {
      return true;
    }
    case "TyCon": {
      const { name } = $match;
      return name === "any";
    }
    default: {
      return false;
    }
  }
};
const checkHandler: <A, B, C>(
  name: string,
  value: Expr,
  st: A,
  api: { inferExpr: (a: Expr, b: A) => Result<[Ty, St], BoundErr> } & C,
  cont: (a: St) => Result<B, BoundErr>,
) => Result<B, BoundErr> = _curry(
  5,
  <A, B, C>(
    name: string,
    value: Expr,
    st: A,
    api: { inferExpr: (a: Expr, b: A) => Result<[Ty, St], BoundErr> } & C,
    cont: (a: St) => Result<B, BoundErr>,
  ) =>
    _Result_flatMap(
      ([valT, st1]) =>
        isFnOrOpen(zonk(valT, st1))
          ? cont(st1)
          : jxTypeErr(`Expected function for event handler '${name}'`, jxExprSpan(value)),
      api.inferExpr(value, st),
    ),
);
const unknownProp: <A, B>(
  tag: string,
  name: string,
  value: Expr,
  schema: Map<string, A>,
) => Result<B, BoundErr> = _curry(
  4,
  <A, B>(tag: string, name: string, value: Expr, schema: Map<string, A>) => {
    const hint: Option<string> = closestName(name, _Map_keys(schema));
    const did: string = _Option_match(
      hint,
      () => "",
      (s) => ` Did you mean '${s}'?`,
    );
    return jxTypeErr(`Property '${name}' does not exist on '<${tag}>'.${did}`, jxExprSpan(value));
  },
);
/**
 * The prop type an attribute's name hovers with, as `(property) name: T`.
 */
const noteProp = (f: Field, t: Ty, st: St): St =>
  recordBinder(f.nameSpan, t, "property", f.name, None as Option<string>, st);
const handlerType: Ty = TyFn(tPrim("Event"), tPrim("unit"));
const inferIntrinsicFields: <A>(
  tag: string,
  fields: Field[],
  st: St,
  api: {
    inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
    unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
  } & A,
  schema: Option<Map<string, string>>,
) => Result<St, BoundErr> = _curry(
  5,
  <A>(
    tag: string,
    fields: Field[],
    st: St,
    api: {
      inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
      unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
    } & A,
    schema: Option<Map<string, string>>,
  ) =>
    ((_v) =>
      _v.length === 0
        ? (Ok(st) as Result<St, BoundErr>)
        : _v.length >= 1
          ? (([f, ...rest]) =>
              ((cont: (a: St) => Result<St, BoundErr>) =>
                _Option_match(
                  mismatchHint(f.name),
                  () =>
                    or(_Str_startsWith("data-", f.name), _Str_startsWith("aria-", f.name))
                      ? _Result_flatMap(
                          ([valT, st1]) => cont(noteProp(f, valT, st1)),
                          api.inferExpr(f.value, st),
                        )
                      : _Option_match(
                          schema,
                          () =>
                            _Result_flatMap(
                              ([valT, st1]) => cont(noteProp(f, valT, st1)),
                              api.inferExpr(f.value, st),
                            ),
                          (m) => {
                            const expected: Option<string> = _Option_match(
                              _Map_get(f.name, m),
                              () =>
                                isHandlerName(f.name)
                                  ? (Some("event") as Option<string>)
                                  : (None as Option<string>),
                              (k) => Some(k) as Option<string>,
                            );
                            return _Option_match(
                              expected,
                              () => unknownProp(tag, f.name, f.value, m),
                              (kind) =>
                                kind === "event"
                                  ? checkHandler(f.name, f.value, st, api, (st1: St) =>
                                      cont(noteProp(f, handlerType, st1)),
                                    )
                                  : kind === "any"
                                    ? _Result_flatMap(
                                        ([, st1]) => cont(noteProp(f, tPrim("any"), st1)),
                                        api.inferExpr(f.value, st),
                                      )
                                    : _Option_match(
                                        attrKindType(kind),
                                        () =>
                                          _Result_flatMap(
                                            ([, st1]) => cont(st1),
                                            api.inferExpr(f.value, st),
                                          ),
                                        (expectedT) =>
                                          _Result_flatMap(
                                            ([valT, st1]) =>
                                              _Result_flatMap(
                                                (st2) => cont(noteProp(f, expectedT, st2)),
                                                api.unify(
                                                  valT,
                                                  expectedT,
                                                  st1,
                                                  jxExprSpan(f.value),
                                                ),
                                              ),
                                            api.inferExpr(f.value, st),
                                          ),
                                      ),
                            );
                          },
                        ),
                  (msg) => jxTypeErr(msg, jxExprSpan(f.value)),
                ))((st1: St) => inferIntrinsicFields(tag, rest, st1, api, schema)))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(fields),
);
const inferFragmentFields: <A, B, C, D>(
  fields: ({ name: string; value: Expr } & C)[],
  st: A,
  api: { inferExpr: (a: Expr, b: A) => Result<[B, A], BoundErr> } & D,
) => Result<A, BoundErr> = _curry(
  3,
  <A, B, C, D>(
    fields: ({ name: string; value: Expr } & C)[],
    st: A,
    api: { inferExpr: (a: Expr, b: A) => Result<[B, A], BoundErr> } & D,
  ) =>
    match(fields)
      .with(
        (_v) => _v.length === 0,
        () => Ok(st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([f, ...rest]) =>
          f.name === "key"
            ? _Result_flatMap(
                ([, st1]) => inferFragmentFields(rest, st1, api),
                api.inferExpr(f.value, st),
              )
            : jxTypeErr(
                `JSX fragments only accept the 'key' prop, got '${f.name}'`,
                jxExprSpan(f.value),
              ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const unknownTagErr: <A>(tagName: string, sp: SpanAt) => Result<A, BoundErr> = _curry(
  2,
  <A>(tagName: string, sp: SpanAt) => {
    const hint: Option<string> = closestName(tagName, _Map_keys(jsxIntrinsicElements));
    const did: string = _Option_match(
      hint,
      () => "",
      (s) => ` Did you mean '<${s}>'?`,
    );
    return jxTypeErr(`Unknown JSX element '<${tagName}>'.${did}`, sp);
  },
);
const inferStringTag: <A>(
  tagName: string,
  tagExpr: Expr,
  fields: Field[],
  st: St,
  api: {
    inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
    unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
  } & A,
) => Result<St, BoundErr> = _curry(
  5,
  <A>(
    tagName: string,
    tagExpr: Expr,
    fields: Field[],
    st: St,
    api: {
      inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
      unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
    } & A,
  ) =>
    tagName === "Fragment"
      ? inferFragmentFields(fields, st, api)
      : _Option_match(
          _Map_get(tagName, jsxIntrinsicElements),
          () =>
            _Str_contains("-", tagName)
              ? inferIntrinsicFields(tagName, fields, st, api, None as Option<Map<string, string>>)
              : unknownTagErr(tagName, jxExprSpan(tagExpr)),
          (schema) =>
            inferIntrinsicFields(
              tagName,
              fields,
              st,
              api,
              Some(schema) as Option<Map<string, string>>,
            ),
        ),
);
/**
 * Each attribute of a component tag hovers with the prop type it fills.
 */
const noteComponentProps = (propsExpr: Expr, expectedRow: Row, st: St): St => {
  const $match = propsExpr;
  switch ($match._tag) {
    case "ERecord": {
      const { fields } = $match;
      return reduce(
        _curry(2, (acc: St, f: Field) =>
          _Option_match(
            rowField(expectedRow, f.name),
            () => acc,
            (t) => noteProp(f, zonk(t, acc), acc),
          ),
        ),
        st,
        fields,
      );
    }
    default: {
      return st;
    }
  }
};
const inferJsxCall: <A>(
  tagExpr: Expr,
  propsExpr: Expr,
  restArgs: Expr[],
  st: St,
  api: {
    unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
    inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
  } & A,
) => Result<[Ty, St], BoundErr> = _curry(
  5,
  <A>(
    tagExpr: Expr,
    propsExpr: Expr,
    restArgs: Expr[],
    st: St,
    api: {
      unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
      inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
    } & A,
  ) =>
    _Result_flatMap(
      ([tagT, st1]: [Ty, St]) =>
        _Result_flatMap(
          ([propsT, st2]: [Ty, St]) =>
            _Result_flatMap(
              (st3: St) => {
                const zonkedTag: Ty = zonk(tagT, st3);
                const $match = zonkedTag;
                switch ($match._tag) {
                  case "TyFn": {
                    const { from, to } = $match;
                    const $match$ = from;
                    switch ($match$._tag) {
                      case "TyRecord": {
                        const { row: expectedRow } = $match$;
                        const propsForCheck: Ty = jsxPropsWithSynthesizedChildren(
                          propsT,
                          propsExpr,
                          expectedRow,
                          restArgs,
                        );
                        return _Result_map(
                          (st4: St) =>
                            _tuple(zonk(to, st4), noteComponentProps(propsExpr, expectedRow, st4)),
                          api.unify(propsForCheck, from, st3, jxExprSpan(propsExpr)),
                        );
                      }
                      default: {
                        return Ok(_tuple(tPrim("VNode"), st3)) as Result<[Ty, St], BoundErr>;
                      }
                    }
                  }
                  default: {
                    const $match$ = tagExpr;
                    switch ($match$._tag) {
                      case "EStr": {
                        const { value: tagName } = $match$;
                        const $match$$ = propsExpr;
                        switch ($match$$._tag) {
                          case "ERecord": {
                            const { fields } = $match$$;
                            return _Result_map(
                              (st4: St) => _tuple(tPrim("VNode"), st4),
                              inferStringTag(tagName, tagExpr, fields, st3, api),
                            );
                          }
                          default: {
                            return Ok(_tuple(tPrim("VNode"), st3)) as Result<[Ty, St], BoundErr>;
                          }
                        }
                      }
                      default: {
                        return Ok(_tuple(tPrim("VNode"), st3)) as Result<[Ty, St], BoundErr>;
                      }
                    }
                  }
                }
              },
              inferJsxChildren(restArgs, st2, api.inferExpr),
            ),
          api.inferExpr(propsExpr, st1),
        ),
      api.inferExpr(tagExpr, st),
    ),
);
/**
 * Infer-call hook: claim `origin == Some("jsx")`; otherwise Ok(None).
 * `api.inferExpr` is `(expr, st) -> Result` — closes over Ctx so hooks stay
 * free of a recursive Ctx type (occurs-check).
 */
export const inferJsxCallHook: <A, B>(
  _fn: A,
  args: Expr[],
  origin: Option<string>,
  st: St,
  api: {
    unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
    inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
  } & B,
) => Result<Option<[Ty, St]>, BoundErr> = _curry(
  5,
  <A, B>(
    _fn: A,
    args: Expr[],
    origin: Option<string>,
    st: St,
    api: {
      unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
      inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
    } & B,
  ) =>
    _Option_match(
      origin,
      () => Ok(None as Option<[Ty, St]>) as Result<Option<[Ty, St]>, BoundErr>,
      (o) =>
        o === "jsx"
          ? ((_v) =>
              _v.length >= 2
                ? (([tagExpr, propsExpr, ...rest]) =>
                    _Result_map(
                      (r: [Ty, St]) => Some(r) as Option<[Ty, St]>,
                      inferJsxCall(tagExpr, propsExpr, rest, st, api),
                    ))(_v)
                : (Ok(None as Option<[Ty, St]>) as Result<Option<[Ty, St]>, BoundErr>))(args)
          : (Ok(None as Option<[Ty, St]>) as Result<Option<[Ty, St]>, BoundErr>),
    ),
);
const vnodeTs: <A>(api: { tsType: (a: Ty) => string } & A) => string = <A>(
  api: { tsType: (a: Ty) => string } & A,
) => {
  const printed: string = api.tsType(TyCon("VNode", [] as Ty[]));
  return printed === "VNode" ? "any" : printed;
};
/**
 * The final return of an arrow is `VNode`.
 */
const returnsVNode: (t: Ty) => boolean = (t: Ty) =>
  ((_v) =>
    _v._tag === "TyFn"
      ? (({ to: toT }) => returnsVNode(toT))(_v)
      : _v._tag === "TyCon" && _v.name === "VNode"
        ? true
        : false)(t);
const isComponentType: (t: Ty) => boolean = (t: Ty) => {
  const $match = t;
  switch ($match._tag) {
    case "TyFn": {
      const { to: toT } = $match;
      return returnsVNode(toT);
    }
    default: {
      return false;
    }
  }
};
/**
 * A lambda whose body is parser-synthesized JSX (ADR 0011 §5), for a binding
 * whose return has not pinned to `VNode` yet.
 */
const jsxBodied: (body: Expr) => boolean = (body: Expr) =>
  ((_v) =>
    _v._tag === "ELambda"
      ? (({ body: inner }) => jsxBodied(inner))(_v)
      : _v._tag === "ECall" && _v.origin._tag === "Some" && _v.origin.value === "jsx"
        ? true
        : false)(body);
const isJsxComponentLambda: (value: Expr) => boolean = (value: Expr) => {
  const $match = value;
  switch ($match._tag) {
    case "ELambda": {
      const { body } = $match;
      return jsxBodied(body);
    }
    default: {
      return false;
    }
  }
};
const isHandlerLabel: (label: string) => boolean = (label: string) => {
  const third: boolean = _Option_exists(
    (n: number) => and(n >= 65, n <= 90),
    _Str_codeAt(2, label),
  );
  return and(_Str_startsWith("on", label), third);
};
const componentPropFieldTs: <A>(
  label: string,
  t: Ty,
  api: { tsType: (a: Ty) => string } & A,
) => string = _curry(3, <A>(label: string, t: Ty, api: { tsType: (a: Ty) => string } & A) =>
  ((_v) =>
    _v._tag === "TyVar"
      ? isHandlerLabel(label)
        ? "() => void"
        : "unknown"
      : _v._tag === "TyCon" && _v.name === "VNode"
        ? ((printed: string) => (printed === "any" ? "unknown" : printed))(vnodeTs(api))
        : api.tsType(t))(t),
);
const propFieldsFrom: <A>(
  row: Row,
  api: { tsType: (a: Ty) => string } & A,
  acc: string[],
) => [string[], boolean] = _curry(
  3,
  <A>(row: Row, api: { tsType: (a: Ty) => string } & A, acc: string[]) => {
    const $match = row;
    switch ($match._tag) {
      case "RowExtend": {
        const { label, fieldType, rest } = $match;
        return propFieldsFrom(
          rest,
          api,
          _Array_append(`${label}: ${componentPropFieldTs(label, fieldType, api)}`, acc),
        );
      }
      case "RowVar": {
        return _tuple(acc, true);
      }
      default: {
        return _tuple(acc, false);
      }
    }
  },
);
const hasField = (fields: string[], name: string): boolean =>
  _Option_isSome(_Array_find((f: string) => _Str_startsWith(`${name}:`, f), fields));
/**
 * An open prop row takes the conventional host extras rather than an index
 * signature, which would fight `onX: () => void` under `--strict`.
 */
const componentPropsTs: <A>(row: Row, api: { tsType: (a: Ty) => string } & A) => string = _curry(
  2,
  <A>(row: Row, api: { tsType: (a: Ty) => string } & A) =>
    (([fields0, open]: [string[], boolean]) => {
      const fields1: string[] = and(open, !hasField(fields0, "children"))
        ? _Array_append("children?: any", fields0)
        : fields0;
      const fields: string[] = and(open, !hasField(fields1, "className"))
        ? _Array_append("className?: string", fields1)
        : fields1;
      return length(fields) === 0 ? "{}" : `{ ${_Str_join("; ", fields)} }`;
    })(propFieldsFrom(row, api, [] as string[])),
);
const componentPropsParamTs: <A>(
  t: Ty,
  api: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & A,
) => string = _curry(
  2,
  <A>(t: Ty, api: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & A) => {
    const $match = t;
    switch ($match._tag) {
      case "TyRecord": {
        const { row } = $match;
        return _Option_match(
          api.aliasOf(row),
          () => componentPropsTs(row, api),
          (name) => name,
        );
      }
      case "TyVar": {
        return "Record<string, unknown>";
      }
      default: {
        return api.tsType(t);
      }
    }
  },
);
const extraParamTs: <A>(t: Ty, api: { tsType: (a: Ty) => string } & A) => string = _curry(
  2,
  <A>(t: Ty, api: { tsType: (a: Ty) => string } & A) =>
    ((_v) =>
      _v._tag === "TyVar"
        ? "unknown"
        : _v._tag === "TyCon" && _v.name === "VNode"
          ? vnodeTs(api)
          : api.tsType(t))(t),
);
/**
 * Params after `props`, for a component that takes more than one.
 */
const extraParamsFrom: <A>(
  t: Ty,
  api: { tsType: (a: Ty) => string } & A,
  i: number,
  acc: string[],
) => string[] = _curry(
  4,
  <A>(t: Ty, api: { tsType: (a: Ty) => string } & A, i: number, acc: string[]) => {
    const $match = t;
    switch ($match._tag) {
      case "TyFn": {
        const { from: fromT, to: toT } = $match;
        return extraParamsFrom(
          toT,
          api,
          i + 1,
          _Array_append(`_${show(i)}: ${extraParamTs(fromT, api)}`, acc),
        );
      }
      default: {
        return acc;
      }
    }
  },
);
/**
 * A multi-param component is `_curry`'d like any other function, so it takes
 * the core's `_Curry` form (ADR 0093), with the host's VNode spelling when set.
 */
const componentSig: <A>(
  t: Ty,
  api: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & A,
) => string = _curry(
  2,
  <A>(t: Ty, api: { aliasOf: (a: Row) => Option<string>; tsType: (a: Ty) => string } & A) => {
    const $match = t;
    switch ($match._tag) {
      case "TyFn": {
        const { from: fromT, to: toT } = $match;
        const props: string = `props: ${componentPropsParamTs(fromT, api)}`;
        const extras: string[] = extraParamsFrom(toT, api, 1, [] as string[]);
        return length(extras) === 0
          ? `(${props}) => ${vnodeTs(api)}`
          : `_Curry<[${_Str_join(", ", _Array_concat([props], extras))}], ${vnodeTs(api)}>`;
      }
      default: {
        return `(props: Record<string, unknown>) => ${vnodeTs(api)}`;
      }
    }
  },
);
export const componentBindingTs: <A>(
  value: Expr,
  t: Ty,
  api: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & A,
) => Option<string> = _curry(
  3,
  <A>(
    value: Expr,
    t: Ty,
    api: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & A,
  ) =>
    ((_v) =>
      _v._tag === "TyCon" && _v.name === "VNode" && _v.args.length === 0
        ? (Some(vnodeTs(api)) as Option<string>)
        : or(isComponentType(t), isJsxComponentLambda(value))
          ? (Some(componentSig(t, api)) as Option<string>)
          : (None as Option<string>))(t),
);

/**
 * The exact call shape the parser emits; anything else prints as a plain call.
 */
const jsxShape: (e: Expr) => Option<JsxShape> = (e: Expr) =>
  ((_v) =>
    _v._tag === "ECall" &&
    _v.fn._tag === "ERef" &&
    _v.fn.name === "h" &&
    _v.args.length === 3 &&
    _v.args[1]._tag === "ERecord" &&
    _v.args[2]._tag === "EArr" &&
    _v.origin._tag === "Some" &&
    _v.origin.value === "jsx"
      ? (({ args: [tag, { fields, spread }, { elements: children }] }) =>
          Some({
            tag: tag,
            fields: fields,
            spread: spread,
            children: children,
          }) as Option<JsxShape>)(
          _v as Extract<Expr, { _tag: "ECall" }> & {
            fn: Extract<Extract<Expr, { _tag: "ECall" }>["fn"], { _tag: "ERef" }>;
            args: [
              Extract<Expr, { _tag: "ECall" }>["args"][number],
              Extract<Extract<Expr, { _tag: "ECall" }>["args"][number], { _tag: "ERecord" }>,
              Extract<Extract<Expr, { _tag: "ECall" }>["args"][number], { _tag: "EArr" }>,
            ];
            origin: Extract<Extract<Expr, { _tag: "ECall" }>["origin"], { _tag: "Some" }>;
          },
        )
      : (None as Option<JsxShape>))(e);
const isFragment: (tag: Expr) => boolean = (tag: Expr) =>
  ((_v) => (_v._tag === "EStr" && _v.value === "Fragment" ? true : false))(tag);
const jsxTag = (tag: Expr, api: FormatApi): string => {
  const $match = tag;
  switch ($match._tag) {
    case "EStr": {
      const { value } = $match;
      return value;
    }
    default: {
      return api.flat(api.memberD(tag));
    }
  }
};
const jsxHoleD = (open: string, e: Expr, api: FormatApi): Doc =>
  cat([txt(open), api.exprD(e), txt("}")]);
/**
 * A valueless attribute parses to `true` spanning its own name, so the name
 * still reads back from the source; an explicit `={true}` does not.
 */
const jsxAttrD = (name: string, value: Expr, api: FormatApi): Doc =>
  ((_v) =>
    _v._tag === "EBool" && _v.value === true
      ? (({ span: sp }) =>
          eq(api.sourceText(sp.start, sp.end), name)
            ? txt(name)
            : jsxHoleD(`${name}={`, value, api))(_v)
      : _v._tag === "EStr"
        ? (({ value: v }) => txt(`${name}=${api.strLit(v)}`))(_v)
        : jsxHoleD(`${name}={`, value, api))(value);
const jsxOpenD = (tag: string, attrs: Doc[], selfClosing: boolean): Doc =>
  length(attrs) === 0
    ? txt(selfClosing ? `<${tag} />` : `<${tag}>`)
    : group(
        cat([
          txt(`<${tag}`),
          indent(cat(map((attr: Doc) => cat([line, attr]), attrs))),
          selfClosing ? line : softline,
          txt(selfClosing ? "/>" : ">"),
        ]),
      );
const jsxChildD = (child: SeqElem, api: FormatApi): Doc => {
  const $match = child;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: e } = $match;
      return _Option_isSome(jsxShape(e)) ? api.exprD(e) : jsxHoleD("{", e, api);
    }
    case "SESpread": {
      const { expr: e } = $match;
      return jsxHoleD("{...", e, api);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const jsxAttrsD = (shape: JsxShape, api: FormatApi): Doc[] => {
  const spreadD: Doc[] = _Option_match(
    shape.spread,
    () => [] as Doc[],
    (sp) => [jsxHoleD("{...", sp, api)],
  );
  return _Array_concat(
    spreadD,
    map((f: Field) => jsxAttrD(f.name, f.value, api), shape.fields),
  );
};
const formatJsx$ = (e: Expr, api: FormatApi): Option<Doc> =>
  _Option_match(
    jsxShape(e),
    () => None as Option<Doc>,
    (shape) => {
      const fragment: boolean = isFragment(shape.tag);
      const tag: string = fragment ? "" : jsxTag(shape.tag, api);
      const attrs: Doc[] = jsxAttrsD(shape, api);
      return and(length(shape.children) === 0, !fragment)
        ? (Some(jsxOpenD(tag, attrs, true)) as Option<Doc>)
        : (Some(
            group(
              cat([
                fragment ? txt("<>") : jsxOpenD(tag, attrs, false),
                indent(
                  cat(
                    map((child: SeqElem) => cat([softline, jsxChildD(child, api)]), shape.children),
                  ),
                ),
                softline,
                txt(fragment ? "</>" : `</${tag}>`),
              ]),
            ),
          ) as Option<Doc>);
    },
  );
/**
 * Re-fold a parser-produced `h(tag, props, children)` into a tag; a
 * hand-written `h(...)` has no `jsx` origin and keeps call formatting.
 */
export const formatJsx: _Curry<[e: Expr, api: FormatApi], Option<Doc>> = _curry(2, formatJsx$);
export const jsxPlugin = {
  name: "jsx",
  parse: Some(parseJsxAtom),
  inferCall: Some(inferJsxCallHook),
  format: None,
  formatDoc: Some(formatJsx) as Option<(a: Expr, b: FormatApi) => Option<Doc>>,
  dtsBinding: None,
  bindingType: Some(componentBindingTs),
};
