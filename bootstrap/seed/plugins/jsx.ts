import type { Tok } from "../lexer";
import type { Expr, Field, Name, SeqElem } from "../ast";
import type { Row, SpanAt, St, Ty } from "../types";
import type { Ctx } from "../infer";

export type LocTok = { tok: Tok; start: number; end: number; doc: Option<string> };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_append,
  _Array_get,
  _Map_get,
  _Option_exists,
  _Option_flatMap,
  _Option_unwrapOr,
  _Result_flatMap,
  _Result_map,
  _Str_codeAt,
  _Str_length,
  _Str_slice,
  _Str_split,
  _Str_startsWith,
  _curry,
  _tuple,
  and,
  eq,
  length,
  lt,
  map,
  or,
} from "@mochi/compiler/runtime";

import { match } from "@onrails/pattern";

import * as Ast from "../ast";
import {
  zonk,
  tPrim,
  tRecord,
  tLit,
  tUnion,
  rExtend,
  TyFn,
  TyRecord,
  RowExtend,
  RowEmpty,
  RowVar,
} from "../types";
import * as Lexer from "../lexer";
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
} from "../lexer";

const jxTokName: (t: Tok) => string = (t: Tok) =>
  match(t)
    .with({ _tag: "TEq" }, () => "eq")
    .with({ _tag: "TLbrace" }, () => "lbrace")
    .with({ _tag: "TRbrace" }, () => "rbrace")
    .with({ _tag: "TSpread" }, () => "spread")
    .with({ _tag: "TSlash" }, () => "slash")
    .with({ _tag: "TLt" }, () => "lt")
    .with({ _tag: "TGt" }, () => "gt")
    .with({ _tag: "TId" }, () => "id")
    .with({ _tag: "TStr" }, () => "str")
    .with({ _tag: "TNum" }, () => "num")
    .with({ _tag: "TBool" }, () => "bool")
    .with({ _tag: "TEof" }, () => "eof")
    .otherwise(() => "tok");
const jxEofTok = { tok: TEof as Tok, start: 0, end: 0, doc: None };
const jxTokAt: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  i: number,
) => { tok: Tok; start: number; end: number; doc: Option<A> } = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], i: number) =>
    _Option_unwrapOr(jxEofTok, _Array_get(i, toks)),
);
const jxSpanOf: <A, B, C>(lt: { end: A; start: B } & C) => { start: B; end: A } = <A, B, C>(
  lt: { end: A; start: B } & C,
) => ({ start: lt.start, end: lt.end });
const jxToEnd: <A, B, C>(
  start: { start: A } & C,
  toks: { tok: Tok; start: number; end: number; doc: Option<B> }[],
  pos: number,
) => { start: A; end: number } = _curry(
  3,
  <A, B, C>(
    start: { start: A } & C,
    toks: { tok: Tok; start: number; end: number; doc: Option<B> }[],
    pos: number,
  ) => ({ start: start.start, end: jxTokAt(toks, pos - 1).end }),
);
const jxErrAt: <A, B, C, D, E>(
  message: A,
  lt: { end: B; start: C } & E,
) => Result<D, { message: A; start: C; end: B }> = _curry(
  2,
  <A, B, C, D, E>(message: A, lt: { end: B; start: C } & E) =>
    Err({ message: message, start: lt.start, end: lt.end }),
);
const jxExpectTok: <A>(
  t: Tok,
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<number, { message: string; start: number; end: number }> = _curry(
  3,
  <A>(t: Tok, toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const lt = jxTokAt(toks, pos);
    return eq(lt.tok, t)
      ? (Ok(pos + 1) as Result<number, { message: string; start: number; end: number }>)
      : jxErrAt(`expected ${jxTokName(t)}, got ${jxTokName(lt.tok)}`, lt);
  },
);
const jxExpectId: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[Name, number], { message: string; start: number; end: number }> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const lt = jxTokAt(toks, pos);
    return match(lt.tok)
      .with(
        { _tag: "TId" },
        ({ value: name }) =>
          Ok(_tuple({ name: name, span: jxSpanOf(lt) }, pos + 1)) as Result<
            [Name, number],
            { message: string; start: number; end: number }
          >,
      )
      .otherwise((t) => jxErrAt(`expected id, got ${jxTokName(t)}`, lt));
  },
);
/**
 * Keyword spelling, mirroring `parser.mochi`'s `keywordText` (ADR 0077). The
 * plugin carries its own copy for the same reason it carries `jxTokName`: it
 * sees the token stream, not the parser's internals.
 */
const jxKeywordText: (t: Tok) => Option<string> = (t: Tok) =>
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
/**
 * Attribute name. A keyword is legal here (ADR 0077) — `type="button"` is the
 * case that forced it. A valueless attr lowers to `true`, not a reference, so
 * there is no pun to reject.
 */
const jxExpectLabel: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<[Name, number], { message: string; start: number; end: number }> = _curry(
  2,
  <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) => {
    const lt = jxTokAt(toks, pos);
    return match(jxKeywordText(lt.tok))
      .with(
        { _tag: "Some" },
        ({ value: name }) =>
          Ok(_tuple({ name: name, span: jxSpanOf(lt) }, pos + 1)) as Result<
            [Name, number],
            { message: string; start: number; end: number }
          >,
      )
      .with({ _tag: "None" }, () => jxExpectId(toks, pos))
      .exhaustive();
  },
);
/**
 * Attribute names may contain hyphens (`data-testid`, `aria-label`). The lexer
 * splits those into label/minus/label, so glue the parts back together — but
 * only while the tokens are ADJACENT, or `<div id - x="1">` would silently
 * become `id-x`.
 */
const jxAttrNameFrom: <A, B>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: { span: { end: number; start: B }; name: string },
) => [{ span: { end: number; start: B }; name: string }, number] = _curry(
  3,
  <A, B>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    acc: { span: { end: number; start: B }; name: string },
  ) => {
    const minusTok = jxTokAt(toks, pos);
    const partTok = jxTokAt(toks, pos + 1);
    return and(
      and(eq(minusTok.tok, TMinus as Tok), eq(minusTok.start, acc.span.end)),
      eq(partTok.start, minusTok.end),
    )
      ? match(jxExpectLabel(toks, pos + 1))
          .with(
            (
              _v,
            ): _v is Extract<
              Result<[Name, number], { message: string; start: number; end: number }>,
              { _tag: "Ok" }
            > => {
              const _g: any = _v;
              return _g._tag === "Ok";
            },
            ({ value: [part, p1] }) =>
              jxAttrNameFrom(toks, p1, {
                name: `${acc.name}-${part.name}`,
                span: { start: acc.span.start, end: part.span.end },
              }),
          )
          .with({ _tag: "Err" }, () => _tuple(acc, pos))
          .exhaustive()
      : _tuple(acc, pos);
  },
);
/**
 * `jxExpectLabel` plus any adjacent `-part` continuations.
 */
const jxExpectAttrName: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
) => Result<
  [{ span: SpanAt; name: string }, number],
  { message: string; start: number; end: number }
> = _curry(2, <A>(toks: { tok: Tok; start: number; end: number; doc: Option<A> }[], pos: number) =>
  _Result_map(
    ([head, p1]: [{ span: SpanAt; name: string }, number]) => jxAttrNameFrom(toks, p1, head),
    jxExpectLabel(toks, pos),
  ),
);
const jxIsUpper: (s: string) => boolean = (s: string) =>
  _Option_exists((n: number) => and(n >= 65, n <= 90), _Str_codeAt(0, s));
const jxExprSpan: (e: Expr) => SpanAt = (e: Expr) =>
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
const makeJsxCall: <A, B>(
  tagExpr: Expr,
  fields: Field[],
  spreadOpt: Option<Expr>,
  children: SeqElem[],
  startTok: { end: number; start: number } & B,
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  endPos: number,
) => Expr = _curry(
  7,
  <A, B>(
    tagExpr: Expr,
    fields: Field[],
    spreadOpt: Option<Expr>,
    children: SeqElem[],
    startTok: { end: number; start: number } & B,
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
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
const parseJsxAttributes: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  fieldsAcc: Field[],
  spreadAcc: Option<Expr>,
  parseExpr: (
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
  ) => Result<[Expr, number], { message: string; start: number; end: number }>,
) => Result<[Field[], Option<Expr>, number], { message: string; start: number; end: number }> =
  _curry(
    5,
    <A>(
      toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      pos: number,
      fieldsAcc: Field[],
      spreadAcc: Option<Expr>,
      parseExpr: (
        a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
        b: number,
      ) => Result<[Expr, number], { message: string; start: number; end: number }>,
    ) => {
      const tk: Tok = jxTokAt(toks, pos).tok;
      const nxt: Tok = jxTokAt(toks, pos + 1).tok;
      return or(eq(tk, TGt as Tok), and(eq(tk, TSlash as Tok), eq(nxt, TGt as Tok)))
        ? (Ok(_tuple(fieldsAcc, spreadAcc, pos)) as Result<
            [Field[], Option<Expr>, number],
            { message: string; start: number; end: number }
          >)
        : eq(tk, TLbrace as Tok)
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
                  const field: Field = { name: attrId.name, value: valExpr };
                  return parseJsxAttributes(
                    toks,
                    p2,
                    _Array_append(field, fieldsAcc),
                    spreadAcc,
                    parseExpr,
                  );
                })(
                  eq(jxTokAt(toks, p1).tok, TEq as Tok)
                    ? ((pEq: number) =>
                        match(jxTokAt(toks, pEq).tok)
                          .with({ _tag: "TStr" }, ({ value: v }) =>
                            _tuple(Ast.EStr(v, jxSpanOf(jxTokAt(toks, pEq))), pEq + 1),
                          )
                          .with({ _tag: "TLbrace" }, () =>
                            match(parseExpr(toks, pEq + 1))
                              .with(
                                (
                                  _v,
                                ): _v is Extract<
                                  Result<
                                    [Expr, number],
                                    { message: string; start: number; end: number }
                                  >,
                                  { _tag: "Ok" }
                                > => {
                                  const _g: any = _v;
                                  return _g._tag === "Ok";
                                },
                                ({ value: [e, pR] }) => _tuple(e, pR + 1),
                              )
                              .with({ _tag: "Err" }, () =>
                                _tuple(Ast.EBool(true, attrId.span), pEq),
                              )
                              .exhaustive(),
                          )
                          .otherwise(() => _tuple(Ast.EBool(true, attrId.span), pEq)))(p1 + 1)
                    : _tuple(Ast.EBool(true, attrId.span), p1),
                ),
              jxExpectAttrName(toks, pos),
            );
    },
  );
const parseJsxChildren: <A>(
  expectedTag: string,
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  acc: SeqElem[],
  parseExpr: (
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
  ) => Result<[Expr, number], { message: string; start: number; end: number }>,
) => Result<[SeqElem[], number], { message: string; start: number; end: number }> = _curry(
  5,
  <A>(
    expectedTag: string,
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    acc: SeqElem[],
    parseExpr: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], { message: string; start: number; end: number }>,
  ) => {
    const lt = jxTokAt(toks, pos);
    const nxt = jxTokAt(toks, pos + 1);
    return eq(lt.tok, TEof as Tok)
      ? jxErrAt(eq(expectedTag, "") ? "unclosed JSX fragment" : "unclosed JSX tag", lt)
      : and(eq(lt.tok, TLt as Tok), eq(nxt.tok, TSlash as Tok))
        ? eq(expectedTag, "")
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
        : eq(lt.tok, TLt as Tok)
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
          : eq(lt.tok, TLbrace as Tok)
            ? eq(nxt.tok, TSpread as Tok)
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
            : match(lt.tok)
                .with({ _tag: "TStr" }, ({ value: v }) =>
                  parseJsxChildren(
                    expectedTag,
                    toks,
                    pos + 1,
                    _Array_append(Ast.SEExpr(Ast.EStr(v, jxSpanOf(lt))), acc),
                    parseExpr,
                  ),
                )
                .with({ _tag: "TNum" }, ({ value: v, raw }) =>
                  parseJsxChildren(
                    expectedTag,
                    toks,
                    pos + 1,
                    _Array_append(Ast.SEExpr(Ast.ENum(v, raw, jxSpanOf(lt))), acc),
                    parseExpr,
                  ),
                )
                .with({ _tag: "TBool" }, ({ value: v }) =>
                  parseJsxChildren(
                    expectedTag,
                    toks,
                    pos + 1,
                    _Array_append(Ast.SEExpr(Ast.EBool(v, jxSpanOf(lt))), acc),
                    parseExpr,
                  ),
                )
                .with({ _tag: "TId" }, ({ value: v }) =>
                  parseJsxChildren(
                    expectedTag,
                    toks,
                    pos + 1,
                    _Array_append(Ast.SEExpr(Ast.EStr(v, jxSpanOf(lt))), acc),
                    parseExpr,
                  ),
                )
                .otherwise(() => jxErrAt("unexpected token in JSX children", lt));
  },
);
const parseJsx: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  parseExpr: (
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
  ) => Result<[Expr, number], { message: string; start: number; end: number }>,
) => Result<[Expr, number], { message: string; start: number; end: number }> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    parseExpr: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], { message: string; start: number; end: number }>,
  ) => {
    const startTok = jxTokAt(toks, pos);
    const nxt = jxTokAt(toks, pos + 1);
    return eq(nxt.tok, TGt as Tok)
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
                    const isSelfClosing: boolean = eq(jxTokAt(toks, p2).tok, TSlash as Tok);
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
  },
);
/**
 * Parse hook: claim a leading `<…>`; otherwise Ok(None) fall-through.
 */
export const parseJsxAtom: <A>(
  toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
  pos: number,
  parseExpr: (
    a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    b: number,
  ) => Result<[Expr, number], { message: string; start: number; end: number }>,
) => Result<Option<[Expr, number]>, { message: string; start: number; end: number }> = _curry(
  3,
  <A>(
    toks: { tok: Tok; start: number; end: number; doc: Option<A> }[],
    pos: number,
    parseExpr: (
      a: { tok: Tok; start: number; end: number; doc: Option<A> }[],
      b: number,
    ) => Result<[Expr, number], { message: string; start: number; end: number }>,
  ) =>
    eq(jxTokAt(toks, pos).tok, TLt as Tok)
      ? _Result_map(
          (claim: [Expr, number]) => Some(claim) as Option<[Expr, number]>,
          parseJsx(toks, pos, parseExpr),
        )
      : (Ok(None as Option<[Expr, number]>) as Result<
          Option<[Expr, number]>,
          { message: string; start: number; end: number }
        >),
);
const seqElemExpr: (el: SeqElem) => Expr = (el: SeqElem) =>
  match(el)
    .with({ _tag: "SEExpr" }, ({ expr: e }) => e)
    .with({ _tag: "SESpread" }, ({ expr: e }) => e)
    .exhaustive();
const inferJsxArrElems: <A, B, C>(
  elements: SeqElem[],
  st: A,
  inferExpr: (a: Expr, b: A) => Result<[B, A], C>,
) => Result<A, C> = _curry(
  3,
  <A, B, C>(elements: SeqElem[], st: A, inferExpr: (a: Expr, b: A) => Result<[B, A], C>) =>
    match(elements)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([el, ...rest]) =>
          _Result_flatMap(
            ([_, st1]: [B, A]) => inferJsxArrElems(rest, st1, inferExpr),
            inferExpr(seqElemExpr(el), st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferJsxChildren: <A, B, C>(
  children: Expr[],
  st: A,
  inferExpr: (a: Expr, b: A) => Result<[B, A], C>,
) => Result<A, C> = _curry(
  3,
  <A, B, C>(children: Expr[], st: A, inferExpr: (a: Expr, b: A) => Result<[B, A], C>) =>
    match(children)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => Ok(st),
      )
      .with(
        (_v): _v is [Extract<Expr[][number], { _tag: "EArr" }>, ...Expr[]] => {
          const _g: any = _v;
          return _g.length >= 1 && _g[0]._tag === "EArr";
        },
        ([{ elements }, ...rest]) =>
          _Result_flatMap(
            (st1: A) => inferJsxChildren(rest, st1, inferExpr),
            inferJsxArrElems(elements, st, inferExpr),
          ),
      )
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length >= 1;
        },
        ([child, ...rest]) =>
          _Result_flatMap(
            ([_, st1]: [B, A]) => inferJsxChildren(rest, st1, inferExpr),
            inferExpr(child, st),
          ),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
/**
 * Walk a row for `label`; open tails / missing labels → None.
 */
const rowField: _Curry<[row: Row, label: string], Option<Ty>> = _curry(
  2,
  (row: Row, label: string) =>
    match(row)
      .with({ _tag: "RowExtend" }, ({ label: l, fieldType, rest }) =>
        eq(l, label) ? (Some(fieldType) as Option<Ty>) : rowField(rest, label),
      )
      .with({ _tag: "RowEmpty" }, () => None as Option<Ty>)
      .with({ _tag: "RowVar" }, () => None as Option<Ty>)
      .exhaustive(),
);
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
const recordHasAttr: _Curry<[expr: Expr, label: string], boolean> = _curry(
  2,
  (expr: Expr, label: string) =>
    match(expr)
      .with({ _tag: "ERecord" }, ({ fields }) => fieldNamed(label, fields))
      .otherwise(() => false),
);
const jsxChildCount: (restArgs: Expr[]) => number = (restArgs: Expr[]) =>
  match(restArgs)
    .with(
      (_v): _v is [Extract<Expr[][number], { _tag: "EArr" }>, ...Expr[]] => {
        const _g: any = _v;
        return _g.length >= 1 && _g[0]._tag === "EArr";
      },
      ([{ elements }]) => length(elements),
    )
    .otherwise(() => 0);
/**
 * Runtime hosts fold h's 3rd arg into props.children. When the component
 * expects that field and the JSX body supplied kids, synthesize it onto the
 * attrs type before unify (mirrors TS `jsxPropsWithSynthesizedChildren`).
 */
const jsxPropsWithSynthesizedChildren: _Curry<
  [propsT: Ty, propsExpr: Expr, expectedRow: Row, restArgs: Expr[]],
  Ty
> = _curry(4, (propsT: Ty, propsExpr: Expr, expectedRow: Row, restArgs: Expr[]) =>
  match(rowField(expectedRow, "children"))
    .with({ _tag: "None" }, () => propsT)
    .with({ _tag: "Some" }, ({ value: expectedChildren }) =>
      match(propsT)
        .with({ _tag: "TyRecord" }, ({ row: prow }) =>
          or(recordHasAttr(propsExpr, "children"), eq(jsxChildCount(restArgs), 0))
            ? propsT
            : tRecord(rExtend("children", expectedChildren, prow)),
        )
        .otherwise(() => propsT),
    )
    .exhaustive(),
);
import { intrinsicElements as jsxIntrinsicElements } from "./jsx-schema.gen.mjs";
/**
 * A kind string from the generated schema as an HM type. `event` and `any` are
 * SHAPE checks rather than unifications, so they carry no expected type here.
 */
const attrKindType: (kind: string) => Option<Ty> = (kind: string) =>
  eq(kind, "string")
    ? (Some(tPrim("string")) as Option<Ty>)
    : eq(kind, "number")
      ? (Some(tPrim("number")) as Option<Ty>)
      : eq(kind, "bool")
        ? (Some(tPrim("bool")) as Option<Ty>)
        : eq(kind, "string|number")
          ? (Some(tUnion([tPrim("string"), tPrim("number")])) as Option<Ty>)
          : eq(kind, "string|bool")
            ? (Some(tUnion([tPrim("string"), tPrim("bool")])) as Option<Ty>)
            : _Str_startsWith("enum:", kind)
              ? (Some(
                  tUnion(map(tLit, _Str_split(",", _Str_slice(5, _Str_length(kind), kind)))),
                ) as Option<Ty>)
              : (None as Option<Ty>);
const intrinsicAttrType: _Curry<[tag: string, attr: string], Option<Ty>> = _curry(
  2,
  (tag: string, attr: string) =>
    _Option_flatMap(
      attrKindType,
      _Option_flatMap(_Map_get(attr), _Map_get(tag, jsxIntrinsicElements)),
    ),
);
const inferIntrinsicFields: <A, B, C, D, E>(
  tag: string,
  fields: ({ name: string; value: Expr } & D)[],
  st: A,
  api: {
    unify: (a: B, b: Ty, c: A, d: SpanAt) => Result<A, C>;
    inferExpr: (a: Expr, b: A) => Result<[B, A], C>;
  } & E,
) => Result<A, C> = _curry(
  4,
  <A, B, C, D, E>(
    tag: string,
    fields: ({ name: string; value: Expr } & D)[],
    st: A,
    api: {
      unify: (a: B, b: Ty, c: A, d: SpanAt) => Result<A, C>;
      inferExpr: (a: Expr, b: A) => Result<[B, A], C>;
    } & E,
  ) =>
    match(fields)
      .with(
        (_v) => _v.length === 0,
        () => Ok(st),
      )
      .with(
        (_v) => _v.length >= 1,
        ([f, ...rest]) =>
          match(intrinsicAttrType(tag, f.name))
            .with({ _tag: "Some" }, ({ value: expectedT }) =>
              _Result_flatMap(
                ([valT, st1]: [B, A]) =>
                  _Result_flatMap(
                    (st2: A) => inferIntrinsicFields(tag, rest, st2, api),
                    api.unify(valT, expectedT, st1, jxExprSpan(f.value)),
                  ),
                api.inferExpr(f.value, st),
              ),
            )
            .with({ _tag: "None" }, () =>
              _Result_flatMap(
                ([_, st1]: [B, A]) => inferIntrinsicFields(tag, rest, st1, api),
                api.inferExpr(f.value, st),
              ),
            )
            .exhaustive(),
      )
      .otherwise(() => {
        throw new Error("non-exhaustive match");
      }),
);
const inferJsxCall: <A, B>(
  tagExpr: Expr,
  propsExpr: Expr,
  restArgs: Expr[],
  st: St,
  api: {
    unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, A>;
    inferExpr: (a: Expr, b: St) => Result<[Ty, St], A>;
  } & B,
) => Result<[Ty, St], A> = _curry(
  5,
  <A, B>(
    tagExpr: Expr,
    propsExpr: Expr,
    restArgs: Expr[],
    st: St,
    api: {
      unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, A>;
      inferExpr: (a: Expr, b: St) => Result<[Ty, St], A>;
    } & B,
  ) =>
    _Result_flatMap(
      ([tagT, st1]: [Ty, St]) =>
        _Result_flatMap(
          ([propsT, st2]: [Ty, St]) =>
            _Result_flatMap(
              (st3: St) => {
                const zonkedTag: Ty = zonk(tagT, st3);
                return match(zonkedTag)
                  .with({ _tag: "TyFn" }, ({ from, to }) =>
                    match(from)
                      .with({ _tag: "TyRecord" }, ({ row: expectedRow }) =>
                        ((propsForCheck: Ty) =>
                          _Result_map(
                            (st4: St) => _tuple(zonk(to, st4), st4),
                            api.unify(propsForCheck, from, st3, jxExprSpan(propsExpr)),
                          ))(
                          jsxPropsWithSynthesizedChildren(propsT, propsExpr, expectedRow, restArgs),
                        ),
                      )
                      .otherwise(() => Ok(_tuple(tPrim("VNode"), st3))),
                  )
                  .otherwise(() =>
                    match(tagExpr)
                      .with({ _tag: "EStr" }, ({ value: tagName }) =>
                        match(propsExpr)
                          .with({ _tag: "ERecord" }, ({ fields }) =>
                            _Result_map(
                              (st4: St) => _tuple(tPrim("VNode"), st4),
                              inferIntrinsicFields(tagName, fields, st3, api),
                            ),
                          )
                          .otherwise(() => Ok(_tuple(tPrim("VNode"), st3))),
                      )
                      .otherwise(() => Ok(_tuple(tPrim("VNode"), st3))),
                  );
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
export const inferJsxCallHook: <A, B, C>(
  _fn: A,
  args: Expr[],
  origin: Option<string>,
  st: St,
  api: {
    unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, B>;
    inferExpr: (a: Expr, b: St) => Result<[Ty, St], B>;
  } & C,
) => Result<Option<[Ty, St]>, B> = _curry(
  5,
  <A, B, C>(
    _fn: A,
    args: Expr[],
    origin: Option<string>,
    st: St,
    api: {
      unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, B>;
      inferExpr: (a: Expr, b: St) => Result<[Ty, St], B>;
    } & C,
  ) =>
    match(origin)
      .with({ _tag: "Some" }, ({ value: o }) =>
        eq(o, "jsx")
          ? match(args)
              .with(
                (_v) => {
                  const _g: any = _v;
                  return _g.length >= 2;
                },
                ([tagExpr, propsExpr, ...rest]) =>
                  _Result_map(
                    (r: [Ty, St]) => Some(r) as Option<[Ty, St]>,
                    inferJsxCall(tagExpr, propsExpr, rest, st, api),
                  ),
              )
              .otherwise(() => Ok(None as Option<[Ty, St]>))
          : Ok(None as Option<[Ty, St]>),
      )
      .with({ _tag: "None" }, () => Ok(None as Option<[Ty, St]>))
      .exhaustive(),
);
export const jsxPlugin = {
  name: "jsx",
  parse: Some(parseJsxAtom),
  inferCall: Some(inferJsxCallHook),
};
