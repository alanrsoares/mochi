import type { LocTok, Tok } from "../lexer/lexer";
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
} from "../ast/ast";
import type { Row, SpanAt, St, Ty } from "../infer/types";
import type { Doc } from "../doc/doc";
import type { FormatApi } from "../format/format-api";
import type { BoundErr } from "../extensions/plugins/jsx";
import type { Plugin } from "../infer/infer";

export type PErr = { message: string; start: number; end: number };
/**
 * One slot in `f(…)`: a positional expression, or `~name` / `~name = e`.
 */
export type CallPart =
  | { _tag: "CPPos"; value: Expr }
  | { _tag: "CPLab"; name: string; value: Expr; labelSpan: SpanAt };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_append,
  _Array_concat,
  _Array_get,
  _Array_prepend,
  _Option_exists,
  _Option_match,
  _Option_unwrapOr,
  _Result_flatMap,
  _Result_map,
  _Str_codeAt,
  _curry,
  _done,
  _keyOf,
  _recur,
  _tuple,
  add,
  and,
  eq,
  gt,
  gte,
  length,
  lt,
  lte,
  map,
  not,
  or,
  show,
  sub,
} from "@mochi/compiler/runtime";

import * as Ast from "../ast/ast";
import { parseHooksOf, resolvePluginsDefault, runParseHooks } from "../extensions/extensions";
import * as Lexer from "../lexer/lexer";
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
  TArrow,
  TTarrow,
  TPipe,
  TConcat,
  TBar,
  TLparen,
  TRparen,
  TLbrace,
  TRbrace,
  TLbracket,
  TRbracket,
  TSpread,
  TPlus,
  TMinus,
  TStar,
  TSlash,
  TPercent,
  TAt,
  THash,
  TTilde,
  TDot,
  TColon,
  TQuestion,
  TEqeq,
  TNeq,
  TLte,
  TGte,
  TLt,
  TGt,
  TAndand,
  TOror,
  TBang,
  TBacktick,
  TComma,
  TSemi,
  TNum,
  TBool,
  TStr,
  TTmplStart,
  TTmplMid,
  TTmplEnd,
  TId,
  TEof,
} from "../lexer/lexer";

/**
 * The TS `t` tag of a token — error messages must match the TS parser's.
 */
const tokName: (t: Tok) => string = (t: Tok) => {
  const $match = t;
  switch ($match._tag) {
    case "TLet": {
      return "let";
    }
    case "TType": {
      return "type";
    }
    case "TExtern": {
      return "extern";
    }
    case "TSwitch": {
      return "switch";
    }
    case "TLoop": {
      return "loop";
    }
    case "TRecur": {
      return "recur";
    }
    case "TDo": {
      return "do";
    }
    case "TImport": {
      return "import";
    }
    case "TExport": {
      return "export";
    }
    case "TEq": {
      return "eq";
    }
    case "TArrow": {
      return "arrow";
    }
    case "TTarrow": {
      return "tarrow";
    }
    case "TPipe": {
      return "pipe";
    }
    case "TConcat": {
      return "concat";
    }
    case "TBar": {
      return "bar";
    }
    case "TLparen": {
      return "lparen";
    }
    case "TRparen": {
      return "rparen";
    }
    case "TLbrace": {
      return "lbrace";
    }
    case "TRbrace": {
      return "rbrace";
    }
    case "TLbracket": {
      return "lbracket";
    }
    case "TRbracket": {
      return "rbracket";
    }
    case "TSpread": {
      return "spread";
    }
    case "TPlus": {
      return "plus";
    }
    case "TMinus": {
      return "minus";
    }
    case "TStar": {
      return "star";
    }
    case "TSlash": {
      return "slash";
    }
    case "TPercent": {
      return "percent";
    }
    case "TAt": {
      return "at";
    }
    case "THash": {
      return "hash";
    }
    case "TTilde": {
      return "tilde";
    }
    case "TDot": {
      return "dot";
    }
    case "TColon": {
      return "colon";
    }
    case "TQuestion": {
      return "question";
    }
    case "TEqeq": {
      return "eqeq";
    }
    case "TNeq": {
      return "neq";
    }
    case "TLte": {
      return "lte";
    }
    case "TGte": {
      return "gte";
    }
    case "TLt": {
      return "lt";
    }
    case "TGt": {
      return "gt";
    }
    case "TAndand": {
      return "andand";
    }
    case "TOror": {
      return "oror";
    }
    case "TBang": {
      return "bang";
    }
    case "TBacktick": {
      return "backtick";
    }
    case "TComma": {
      return "comma";
    }
    case "TSemi": {
      return "semi";
    }
    case "TNum": {
      return "num";
    }
    case "TBool": {
      return "bool";
    }
    case "TStr": {
      return "str";
    }
    case "TTmplStart": {
      return "tmplstart";
    }
    case "TTmplMid": {
      return "tmplmid";
    }
    case "TTmplEnd": {
      return "tmplend";
    }
    case "TId": {
      return "id";
    }
    case "TEof": {
      return "eof";
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
/**
 * The stream is TEof-terminated, so the fallback is unreachable in practice.
 */
const eofTok = { tok: TEof as Tok, start: 0, end: 0, doc: None };
const tokAt$ = (toks: LocTok[], i: number): LocTok => _Option_unwrapOr(eofTok, _Array_get(i, toks));
const tokAt: _Curry<[toks: LocTok[], i: number], LocTok> = _curry(2, tokAt$);
const spanOf: <C>(lt: { end: number; start: number } & C) => SpanAt = <C>(
  lt: { end: number; start: number } & C,
) => ({ start: lt.start, end: lt.end });
const spanning: <C, D>(a: { start: number } & C, b: { end: number } & D) => SpanAt = _curry(
  2,
  <C, D>(a: { start: number } & C, b: { end: number } & D) => ({ start: a.start, end: b.end }),
);
/**
 * Span from a start marker to the last consumed token (TS `to(start)`).
 */
const toEnd: <C>(start: { start: number } & C, toks: LocTok[], pos: number) => SpanAt = _curry(
  3,
  <C>(start: { start: number } & C, toks: LocTok[], pos: number) => ({
    start: start.start,
    end: tokAt$(toks, pos - 1).end,
  }),
);
const errAt: <D, E>(message: string, lt: { end: number; start: number } & E) => Result<D, PErr> =
  _curry(2, <D, E>(message: string, lt: { end: number; start: number } & E) =>
    Err({ message: message, start: lt.start, end: lt.end }),
  );
const expectTok$ = (t: Tok, toks: LocTok[], pos: number): Result<number, PErr> => {
  const lt = tokAt$(toks, pos);
  return eq(lt.tok, t)
    ? (Ok(pos + 1) as Result<number, PErr>)
    : errAt(`expected ${tokName(t)}, got ${tokName(lt.tok)}`, lt);
};
const expectTok: _Curry<[t: Tok, toks: LocTok[], pos: number], Result<number, PErr>> = _curry(
  3,
  expectTok$,
);
const expectId$ = (toks: LocTok[], pos: number): Result<[Name, number], PErr> => {
  const lt = tokAt$(toks, pos);
  const $match = lt.tok;
  switch ($match._tag) {
    case "TId": {
      const { value: name } = $match;
      return Ok(_tuple({ name: name, span: spanOf(lt) }, pos + 1)) as Result<[Name, number], PErr>;
    }
    default: {
      const t = $match;
      return errAt(`expected id, got ${tokName(t)}`, lt);
    }
  }
};
const expectId: _Curry<[toks: LocTok[], pos: number], Result<[Name, number], PErr>> = _curry(
  2,
  expectId$,
);
/**
 * The word a keyword token was written as, or `None` if `t` is not a keyword.
 * Mirrors `lexer.ts`'s `keywordText` (ADR 0077). `TBool` stays out: it carries
 * a value rather than a spelling, so `true`/`false` are not labels.
 */
const keywordText: (t: Tok) => Option<string> = (t: Tok) => {
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
const expectLabel$ = (toks: LocTok[], pos: number): Result<[Name, number], PErr> => {
  const lt = tokAt$(toks, pos);
  return _Option_match(
    keywordText(lt.tok),
    () => expectId$(toks, pos),
    (name) => Ok(_tuple({ name: name, span: spanOf(lt) }, pos + 1)) as Result<[Name, number], PErr>,
  );
};
/**
 * Label in JSX attrs / record fields / `.field` projection: `tone` or `$tone`
 * (styled-cva). Since ADR 0047 `$` is an ordinary identifier char, so a plain
 * label is just an id — the name survives as a seam because `parser.ts` exposes
 * it to plugins. A keyword is also a label (ADR 0077): nothing here can start a
 * statement or an expression, so `{ type: 1 }` and `x.type` are unambiguous.
 */
const expectLabel: _Curry<[toks: LocTok[], pos: number], Result<[Name, number], PErr>> = _curry(
  2,
  expectLabel$,
);
const expectStr$ = (toks: LocTok[], pos: number): Result<[string, number], PErr> => {
  const lt = tokAt$(toks, pos);
  const $match = lt.tok;
  switch ($match._tag) {
    case "TStr": {
      const { value } = $match;
      return Ok(_tuple(value, pos + 1)) as Result<[string, number], PErr>;
    }
    default: {
      const t = $match;
      return errAt(`expected str, got ${tokName(t)}`, lt);
    }
  }
};
const expectStr: _Curry<[toks: LocTok[], pos: number], Result<[string, number], PErr>> = _curry(
  2,
  expectStr$,
);
const expectIn$ = (toks: LocTok[], pos: number): Result<number, PErr> =>
  _Result_flatMap(
    ([kw, p]) =>
      kw.name === "in"
        ? (Ok(p) as Result<number, PErr>)
        : errAt(`expected 'in' after let binding, got '${kw.name}'`, tokAt$(toks, p)),
    expectId$(toks, pos),
  );
/**
 * Consume the contextual `in` keyword after a let binding's value.
 */
const expectIn: _Curry<[toks: LocTok[], pos: number], Result<number, PErr>> = _curry(2, expectIn$);
const isUpper: (s: string) => boolean = (s: string) =>
  _Option_exists((n: number) => and(n >= 65, n <= 90), _Str_codeAt(0, s));
/**
 * `item (, item)*` — at least one item; the caller peeks the closer for empty.
 */
const sepBy: <B, C>(
  parseItem: (a: LocTok[], b: number) => Result<[B, number], C>,
  toks: LocTok[],
  pos: number,
  acc: B[],
) => Result<[B[], number], C> = _curry(
  4,
  <B, C>(
    parseItem: (a: LocTok[], b: number) => Result<[B, number], C>,
    toks: LocTok[],
    pos: number,
    acc: B[],
  ) =>
    _Result_flatMap(
      ([item, p]: [B, number]) => {
        const items = _Array_append(item, acc);
        return tokAt$(toks, p).tok._tag === "TComma"
          ? sepBy(parseItem, toks, p + 1, items)
          : Ok(_tuple(items, p));
      },
      parseItem(toks, pos),
    ),
);
/**
 * Like `sepBy`, but `parseItem` takes `(toks, pos, hooks)` — used when the
 * item parser needs the plugin hook list (avoids a `_curry`-wrapped lambda
 * that would erase the element type under `tsc --strict`).
 */
const sepByH: <B, C, D>(
  parseItem: (a: LocTok[], b: number, c: B) => Result<[C, number], D>,
  toks: LocTok[],
  pos: number,
  acc: C[],
  hooks: B,
) => Result<[C[], number], D> = _curry(
  5,
  <B, C, D>(
    parseItem: (a: LocTok[], b: number, c: B) => Result<[C, number], D>,
    toks: LocTok[],
    pos: number,
    acc: C[],
    hooks: B,
  ) =>
    _Result_flatMap(
      ([item, p]: [C, number]) => {
        const items = _Array_append(item, acc);
        return tokAt$(toks, p).tok._tag === "TComma"
          ? sepByH(parseItem, toks, p + 1, items, hooks)
          : Ok(_tuple(items, p));
      },
      parseItem(toks, pos, hooks),
    ),
);
/**
 * A possibly-empty comma list ended by `close`; does NOT consume the closer.
 */
const listUntil: <B, C>(
  close: Tok,
  parseItem: (a: LocTok[], b: number) => Result<[B, number], C>,
  toks: LocTok[],
  pos: number,
) => Result<[B[], number], C> = _curry(
  4,
  <B, C>(
    close: Tok,
    parseItem: (a: LocTok[], b: number) => Result<[B, number], C>,
    toks: LocTok[],
    pos: number,
  ) =>
    eq(tokAt$(toks, pos).tok, close)
      ? Ok(_tuple([] as B[], pos))
      : sepBy(parseItem, toks, pos, [] as B[]),
);
const listUntilH: <B, C, D>(
  close: Tok,
  parseItem: (a: LocTok[], b: number, c: B) => Result<[C, number], D>,
  toks: LocTok[],
  pos: number,
  hooks: B,
) => Result<[C[], number], D> = _curry(
  5,
  <B, C, D>(
    close: Tok,
    parseItem: (a: LocTok[], b: number, c: B) => Result<[C, number], D>,
    toks: LocTok[],
    pos: number,
    hooks: B,
  ) =>
    eq(tokAt$(toks, pos).tok, close)
      ? Ok(_tuple([] as C[], pos))
      : sepByH(parseItem, toks, pos, [] as C[], hooks),
);
const scanLambdaDepth$ = (toks: LocTok[], k: number, depth: number): boolean => {
  const $match = tokAt$(toks, k).tok;
  switch ($match._tag) {
    case "TLparen": {
      return scanLambdaDepth$(toks, k + 1, depth + 1);
    }
    case "TRparen": {
      return depth === 1
        ? tokAt$(toks, k + 1).tok._tag === "TArrow"
        : scanLambdaDepth$(toks, k + 1, depth - 1);
    }
    case "TEof": {
      return false;
    }
    default: {
      return scanLambdaDepth$(toks, k + 1, depth);
    }
  }
};
/**
 * `(…) =>` needs unbounded lookahead: scan to the matching rparen.
 */
const scanLambdaDepth: _Curry<[toks: LocTok[], k: number, depth: number], boolean> = _curry(
  3,
  scanLambdaDepth$,
);
const looksLikeLambda$ = (toks: LocTok[], pos: number): boolean => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TId": {
      return tokAt$(toks, pos + 1).tok._tag === "TArrow";
    }
    case "TLparen": {
      return scanLambdaDepth$(toks, pos, 0);
    }
    default: {
      return false;
    }
  }
};
const looksLikeLambda: _Curry<[toks: LocTok[], pos: number], boolean> = _curry(2, looksLikeLambda$);
/**
 * The span of a node, for composite spans (TS reads `.span` directly).
 */
const exprSpan: (e: Expr) => SpanAt = (e: Expr) => {
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
const tySpan: (t: TypeExpr) => SpanAt = (t: TypeExpr) => {
  const $match = t;
  switch ($match._tag) {
    case "TyName": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyArrow": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyApp": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyTuple": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyList": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyQual": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyLit": {
      const { span: sp } = $match;
      return sp;
    }
    case "TyUnion": {
      const { span: sp } = $match;
      return sp;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const parseParam$ = (toks: LocTok[], pos: number): Result<[LamParam, number], PErr> => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TLbrace": {
      return _Result_flatMap(
        ([fields, p]) =>
          _Result_flatMap(
            (p2) =>
              Ok(
                _tuple(
                  Ast.LPSpanned(
                    Ast.LPRecord(map((f: Name) => f.name, fields)),
                    map((f: Name) => f.span, fields),
                  ),
                  p2,
                ),
              ) as Result<[LamParam, number], PErr>,
            expectTok$(TRbrace as Tok, toks, p),
          ),
        listUntil(TRbrace as Tok, expectId, toks, pos + 1),
      );
    }
    case "TLparen": {
      return _Result_flatMap(
        ([names, p]) =>
          _Result_flatMap(
            (p2) =>
              Ok(
                ((_v) =>
                  _v.length === 1
                    ? (([single]) =>
                        _tuple(
                          Ast.LPSpanned(Ast.LPName(single.name, None as Option<TypeExpr>), [
                            single.span,
                          ]),
                          p2,
                        ))(_v)
                    : ((many) =>
                        _tuple(
                          Ast.LPSpanned(
                            Ast.LPTuple(map((n: Name) => n.name, many)),
                            map((n: Name) => n.span, many),
                          ),
                          p2,
                        ))(_v))(names),
              ) as Result<[LamParam, number], PErr>,
            expectTok$(TRparen as Tok, toks, p),
          ),
        sepBy(expectId, toks, pos + 1, [] as Name[]),
      );
    }
    default: {
      return _Result_flatMap(
        ([nm, p]) =>
          tokAt$(toks, p).tok._tag === "TColon"
            ? _Result_map(
                ([annot, p2]: [TypeExpr, number]) =>
                  _tuple(
                    Ast.LPSpanned(Ast.LPName(nm.name, Some(annot) as Option<TypeExpr>), [nm.span]),
                    p2,
                  ),
                parseTypeExpr$(toks, p + 1),
              )
            : (Ok(
                _tuple(Ast.LPSpanned(Ast.LPName(nm.name, None as Option<TypeExpr>), [nm.span]), p),
              ) as Result<[LamParam, number], PErr>),
        expectId$(toks, pos),
      );
    }
  }
};
const parseParam: _Curry<[toks: LocTok[], pos: number], Result<[LamParam, number], PErr>> = _curry(
  2,
  parseParam$,
);
const parseLabeledParam$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[LamParam, number], PErr> =>
  _Result_flatMap(
    (p0) =>
      _Result_flatMap(
        ([nm, p1]) =>
          ((optional: boolean) =>
            ((p2: number) =>
              _Result_flatMap(
                ([annot, p3]) =>
                  tokAt$(toks, p3).tok._tag === "TEq"
                    ? _Result_map(
                        ([d, k]: [Expr, number]) =>
                          _tuple(
                            Ast.LPSpanned(
                              Ast.LPLabeled(nm.name, annot, optional, Some(d) as Option<Expr>),
                              [nm.span],
                            ),
                            k,
                          ),
                        parseExpr$(toks, p3 + 1, hooks),
                      )
                    : (Ok(
                        _tuple(
                          Ast.LPSpanned(
                            Ast.LPLabeled(nm.name, annot, optional, None as Option<Expr>),
                            [nm.span],
                          ),
                          p3,
                        ),
                      ) as Result<[LamParam, number], PErr>),
                tokAt$(toks, p2).tok._tag === "TColon"
                  ? _Result_map(
                      ([t, k]: [TypeExpr, number]) => _tuple(Some(t) as Option<TypeExpr>, k),
                      parseTypeExpr$(toks, p2 + 1),
                    )
                  : (Ok(_tuple(None as Option<TypeExpr>, p2)) as Result<
                      [Option<TypeExpr>, number],
                      PErr
                    >),
              ))(optional ? p1 + 1 : p1))(tokAt$(toks, p1).tok._tag === "TQuestion"),
        expectLabel$(toks, p0),
      ),
    expectTok$(TTilde as Tok, toks, pos),
  );
/**
 * `~name`, `~name?`, `~name: T`, `~name = e`, `~name: T = e` (ADR 0098 §2).
 * A labeled parameter is sugar: `inferLambda` folds a trailing labeled group
 * into ONE record parameter, so there is no second calling convention.
 */
const parseLabeledParam: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[LamParam, number], PErr>
> = _curry(3, parseLabeledParam$);
const parseLamParam$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[LamParam, number], PErr> =>
  tokAt$(toks, pos).tok._tag === "TTilde"
    ? parseLabeledParam$(toks, pos, hooks)
    : parseParam$(toks, pos);
const parseLamParam: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[LamParam, number], PErr>
> = _curry(3, parseLamParam$);
const isLabeledParam: (p: LamParam) => boolean = (p: LamParam) => {
  const $match = p;
  switch ($match._tag) {
    case "LPLabeled": {
      return true;
    }
    case "LPSpanned": {
      const { param: inner } = $match;
      return isLabeledParam(inner);
    }
    default: {
      return false;
    }
  }
};
const labeledTrailing$ = (params: LamParam[], seen: boolean): boolean =>
  ((_v) =>
    _v.length === 0
      ? true
      : _v.length >= 1
        ? (([p, ...rest]) =>
            isLabeledParam(p)
              ? labeledTrailing$(rest, true)
              : and(!seen, labeledTrailing$(rest, false)))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(params);
/**
 * True when every labeled parameter (if any) sits after every positional one.
 */
const labeledTrailing: _Curry<[params: LamParam[], seen: boolean], boolean> = _curry(
  2,
  labeledTrailing$,
);
const parseLambda$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TId": {
      const { value: name } = $match;
      return _Result_flatMap(
        (p) =>
          _Result_flatMap(
            ([body, p2]) =>
              Ok(
                _tuple(
                  Ast.ELambda(
                    [
                      Ast.LPSpanned(Ast.LPName(name, None as Option<TypeExpr>), [
                        spanOf(tokAt$(toks, pos)),
                      ]),
                    ],
                    body,
                    toEnd(start, toks, p2),
                  ),
                  p2,
                ),
              ) as Result<[Expr, number], PErr>,
            parseLambdaBody$(toks, p, hooks),
          ),
        expectTok$(TArrow as Tok, toks, pos + 1),
      );
    }
    default: {
      return _Result_flatMap(
        (p) =>
          _Result_flatMap(
            ([params, p2]) =>
              _Result_flatMap(
                (p3) =>
                  labeledTrailing$(params, false)
                    ? _Result_flatMap(
                        (p4) =>
                          _Result_flatMap(
                            ([body, p5]) =>
                              Ok(
                                _tuple(Ast.ELambda(params, body, toEnd(start, toks, p5)), p5),
                              ) as Result<[Expr, number], PErr>,
                            parseLambdaBody$(toks, p4, hooks),
                          ),
                        expectTok$(TArrow as Tok, toks, p3),
                      )
                    : errAt("labeled parameters must be a trailing group", tokAt$(toks, p)),
                expectTok$(TRparen as Tok, toks, p2),
              ),
            listUntilH(TRparen as Tok, parseLamParam, toks, p, hooks),
          ),
        expectTok$(TLparen as Tok, toks, pos),
      );
    }
  }
};
const parseLambda: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseLambda$);
const parseLambdaBody$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> =>
  and(tokAt$(toks, pos).tok._tag === "TLbrace", arrowBodyIsDoBlock$(toks, pos, 0))
    ? parseDoBlock$(toks, pos, hooks)
    : parseExpr$(toks, pos, hooks);
const parseLambdaBody: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseLambdaBody$);
const arrowBodyIsDoBlock$ = (toks: LocTok[], pos: number, depth: number): boolean => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TLbrace": {
      return arrowBodyIsDoBlock$(toks, pos + 1, depth + 1);
    }
    case "TRbrace": {
      return depth === 1 ? false : arrowBodyIsDoBlock$(toks, pos + 1, depth - 1);
    }
    case "TSemi": {
      return or(depth === 1, arrowBodyIsDoBlock$(toks, pos + 1, depth));
    }
    case "TEof": {
      return false;
    }
    default: {
      return arrowBodyIsDoBlock$(toks, pos + 1, depth);
    }
  }
};
const arrowBodyIsDoBlock: _Curry<[toks: LocTok[], pos: number, depth: number], boolean> = _curry(
  3,
  arrowBodyIsDoBlock$,
);
const parseLetIn$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  return _Result_flatMap(
    (p) =>
      or(tokAt$(toks, p).tok._tag === "TQuestion", tokAt$(toks, p).tok._tag === "TBang")
        ? ((monad: string) =>
            ((paramSpan: SpanAt) =>
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
                                        toEnd(start, toks, p5),
                                      ),
                                      p5,
                                    ),
                                  ) as Result<[Expr, number], PErr>,
                                parseExpr$(toks, p4, hooks),
                              ),
                            expectIn$(toks, p3),
                          ),
                        parseExpr$(toks, p2, hooks),
                      ),
                    expectTok$(TEq as Tok, toks, p1),
                  ),
                parseParam$(toks, p + 1),
              ))(spanOf(tokAt$(toks, p + 1))))(
            tokAt$(toks, p).tok._tag === "TQuestion" ? "Result" : "Task",
          )
        : tokAt$(toks, p).tok._tag === "TLparen"
          ? ((paramStart: SpanAt) =>
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
                                          toEnd(start, toks, p5),
                                        ),
                                        p5,
                                      ),
                                    ) as Result<[Expr, number], PErr>)(
                                    Ast.ELambda([param], body, toEnd(paramStart, toks, p5)),
                                  ),
                                parseExpr$(toks, p4, hooks),
                              ),
                            expectIn$(toks, p3),
                          ),
                        parseExpr$(toks, p2, hooks),
                      ),
                    expectTok$(TEq as Tok, toks, p1),
                  ),
                parseParam$(toks, p),
              ))(spanOf(tokAt$(toks, p)))
          : _Result_flatMap(
              ([nm, p1]) =>
                _Result_flatMap(
                  ([annot, pA]) =>
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
                                          annot,
                                          value,
                                          body,
                                          toEnd(start, toks, p5),
                                        ),
                                        p5,
                                      ),
                                    ) as Result<[Expr, number], PErr>,
                                  parseExpr$(toks, p4, hooks),
                                ),
                              expectIn$(toks, p3),
                            ),
                          parseExpr$(toks, p2, hooks),
                        ),
                      expectTok$(TEq as Tok, toks, pA),
                    ),
                  tokAt$(toks, p1).tok._tag === "TColon"
                    ? _Result_map(
                        ([ty, k]: [TypeExpr, number]) => _tuple(Some(ty) as Option<TypeExpr>, k),
                        parseTypeExpr$(toks, p1 + 1),
                      )
                    : (Ok(_tuple(None as Option<TypeExpr>, p1)) as Result<
                        [Option<TypeExpr>, number],
                        PErr
                      >),
                ),
              expectId$(toks, p),
            ),
    expectTok$(TLet as Tok, toks, pos),
  );
};
const parseLetIn: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseLetIn$);
const composeAt$ = (toks: LocTok[], pos: number): boolean => {
  const a = tokAt$(toks, pos);
  const b = tokAt$(toks, pos + 1);
  return and(and(a.tok._tag === "TGt", b.tok._tag === "TGt"), eq(a.end, b.start));
};
/**
 * `>>` lexes as two `>` so nested type arguments close one at a time
 * (`Map<string, Map<string, a>>`). In an expression, two touching `>` are the
 * composition operator.
 */
const composeAt: _Curry<[toks: LocTok[], pos: number], boolean> = _curry(2, composeAt$);
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
const mkBinCall$ = (fnName: string, opSpan: SpanAt, left: Expr, right: Expr): Expr =>
  Ast.ECall(
    Ast.ERef(fnName, opSpan),
    [left, right],
    None as Option<string>,
    spanning(exprSpan(left), exprSpan(right)),
  );
const mkBinCall: _Curry<[fnName: string, opSpan: SpanAt, left: Expr, right: Expr], Expr> = _curry(
  4,
  mkBinCall$,
);
const opFnName: (t: Tok) => string = (t: Tok) => {
  const $match = t;
  switch ($match._tag) {
    case "TPlus": {
      return "add";
    }
    case "TMinus": {
      return "sub";
    }
    case "TStar": {
      return "mul";
    }
    case "TSlash": {
      return "div";
    }
    case "TPercent": {
      return "mod";
    }
    case "TAndand": {
      return "and";
    }
    case "TOror": {
      return "or";
    }
    case "TConcat": {
      return "concat";
    }
    case "TEqeq": {
      return "eq";
    }
    case "TLt": {
      return "lt";
    }
    case "TLte": {
      return "lte";
    }
    case "TGt": {
      return "gt";
    }
    case "TGte": {
      return "gte";
    }
    default: {
      return "eq";
    }
  }
};
const isSectionOp: (t: Tok) => boolean = (t: Tok) => {
  const $match = t;
  switch ($match._tag) {
    case "TPlus": {
      return true;
    }
    case "TMinus": {
      return true;
    }
    case "TStar": {
      return true;
    }
    case "TSlash": {
      return true;
    }
    case "TPercent": {
      return true;
    }
    case "TAndand": {
      return true;
    }
    case "TOror": {
      return true;
    }
    case "TConcat": {
      return true;
    }
    case "TEqeq": {
      return true;
    }
    case "TNeq": {
      return true;
    }
    case "TLt": {
      return true;
    }
    case "TLte": {
      return true;
    }
    case "TGt": {
      return true;
    }
    case "TGte": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const sectionBody$ = (opTok: Tok, x: Expr, y: Expr, opSpan: SpanAt): Expr => {
  const full: SpanAt = spanning(exprSpan(x), exprSpan(y));
  return opTok._tag === "TNeq"
    ? Ast.ECall(
        Ast.ERef("not", opSpan),
        [mkBinCall$("eq", opSpan, x, y)],
        None as Option<string>,
        full,
      )
    : mkBinCall$(opFnName(opTok), opSpan, x, y);
};
const sectionBody: _Curry<[opTok: Tok, x: Expr, y: Expr, opSpan: SpanAt], Expr> = _curry(
  4,
  sectionBody$,
);
const sectionLeft: <A>(provided: Expr, opLt: { end: number; start: number; tok: Tok } & A) => Expr =
  _curry(2, <A>(provided: Expr, opLt: { end: number; start: number; tok: Tok } & A) => {
    const opSpan: SpanAt = spanOf(opLt);
    const paramRef: Expr = Ast.ERef("$s", opSpan);
    return Ast.ELambda(
      [Ast.LPName("$s", None as Option<TypeExpr>)],
      sectionBody$(opLt.tok, provided, paramRef, opSpan),
      spanning(exprSpan(provided), opSpan),
    );
  });
const parseRightSection$ = (
  toks: LocTok[],
  lparenSpan: SpanAt,
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const lt = tokAt$(toks, pos);
  return _Result_flatMap(
    ([y, p1]) =>
      _Result_flatMap(
        (p2) =>
          ((paramRef: Expr) =>
            Ok(
              _tuple(
                Ast.ELambda(
                  [Ast.LPName("$s", None as Option<TypeExpr>)],
                  sectionBody$(lt.tok, paramRef, y, spanOf(lt)),
                  toEnd(lparenSpan, toks, p2),
                ),
                p2,
              ),
            ) as Result<[Expr, number], PErr>)(Ast.ERef("$s", spanOf(lt))),
        expectTok$(TRparen as Tok, toks, p1),
      ),
    parseExpr$(toks, pos + 1, hooks),
  );
};
const parseRightSection: _Curry<
  [
    toks: LocTok[],
    lparenSpan: SpanAt,
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(4, parseRightSection$);
const binCallOrLeftSection$ = (
  toks: LocTok[],
  left: Expr,
  lt: LocTok,
  pos: number,
  bp: number,
  fnName: string,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<{ left: Expr; p: number; matched: boolean }, PErr> =>
  tokAt$(toks, pos + 1).tok._tag === "TRparen"
    ? (Ok({ left: sectionLeft(left, lt), p: pos + 1, matched: true }) as Result<
        { left: Expr; p: number; matched: boolean },
        PErr
      >)
    : _Result_flatMap(
        ([right, p]) =>
          Ok({ left: mkBinCall$(fnName, spanOf(lt), left, right), p: p, matched: true }) as Result<
            { left: Expr; p: number; matched: boolean },
            PErr
          >,
        parseExprBp$(toks, bp + 1, pos + 1, hooks),
      );
const binCallOrLeftSection: _Curry<
  [
    toks: LocTok[],
    left: Expr,
    lt: LocTok,
    pos: number,
    bp: number,
    fnName: string,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<{ left: Expr; p: number; matched: boolean }, PErr>
> = _curry(7, binCallOrLeftSection$);
const isCmpTok: (t: Tok) => boolean = (t: Tok) => {
  const $match = t;
  switch ($match._tag) {
    case "TEqeq": {
      return true;
    }
    case "TNeq": {
      return true;
    }
    case "TLt": {
      return true;
    }
    case "TLte": {
      return true;
    }
    case "TGt": {
      return true;
    }
    case "TGte": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const cmpFnName: (t: Tok) => string = (t: Tok) => {
  const $match = t;
  switch ($match._tag) {
    case "TLt": {
      return "lt";
    }
    case "TLte": {
      return "lte";
    }
    case "TGt": {
      return "gt";
    }
    case "TGte": {
      return "gte";
    }
    default: {
      return "eq";
    }
  }
};
const parseInfix$ = (
  toks: LocTok[],
  minBp: number,
  left: Expr,
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<{ left: Expr; p: number; matched: boolean }, PErr> => {
  const lt = tokAt$(toks, pos);
  return and(lt.tok._tag === "TPipe", PIPE_BP >= minBp)
    ? _Result_flatMap(
        ([right, p]) =>
          Ok({
            left: Ast.EPipe(left, right, false, spanning(exprSpan(left), exprSpan(right))),
            p: p,
            matched: true,
          }) as Result<{ left: Expr; p: number; matched: boolean }, PErr>,
        parseAtomOrCall$(toks, pos + 1, hooks),
      )
    : and(lt.tok._tag === "TTarrow", FAST_PIPE_BP >= minBp)
      ? _Result_flatMap(
          ([right, p]) =>
            ((_v) =>
              _v._tag === "ECall"
                ? (({ span: rightSpan }) =>
                    Ok({
                      left: Ast.EPipe(left, right, true, spanning(exprSpan(left), rightSpan)),
                      p: p,
                      matched: true,
                    }) as Result<{ left: Expr; p: number; matched: boolean }, PErr>)(_v)
                : errAt(
                    "fast pipe needs a call on the right, like `a -> f(b)`; use `|>` for a bare function or operator section, like `a |> f` or `a |> (+ 3)`",
                    lt,
                  ))(right),
          parseAtomOrCall$(toks, pos + 1, hooks),
        )
      : and(composeAt$(toks, pos), COMPOSE_BP >= minBp)
        ? _Result_flatMap(
            ([right, p]) =>
              ((opSpan: SpanAt) =>
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
                ))({ start: lt.start, end: lt.start + 2 }),
            parseExprBp$(toks, COMPOSE_BP + 1, pos + 2, hooks),
          )
        : and(and(isCmpTok(lt.tok), !composeAt$(toks, pos)), CMP_BP >= minBp)
          ? tokAt$(toks, pos + 1).tok._tag === "TRparen"
            ? (Ok({ left: sectionLeft(left, lt), p: pos + 1, matched: true }) as Result<
                { left: Expr; p: number; matched: boolean },
                PErr
              >)
            : _Result_flatMap(
                ([right, p]) =>
                  ((opSpan: SpanAt) =>
                    ((inner: Expr) =>
                      ((result: Expr) =>
                        Ok({ left: result, p: p, matched: true }) as Result<
                          { left: Expr; p: number; matched: boolean },
                          PErr
                        >)(
                        lt.tok._tag === "TNeq"
                          ? Ast.ECall(
                              Ast.ERef("not", opSpan),
                              [inner],
                              None as Option<string>,
                              spanning(exprSpan(left), exprSpan(right)),
                            )
                          : inner,
                      ))(mkBinCall$(cmpFnName(lt.tok), opSpan, left, right)))(spanOf(lt)),
                parseExprBp$(toks, CMP_BP + 1, pos + 1, hooks),
              )
          : and(
                or(lt.tok._tag === "TAndand", lt.tok._tag === "TOror"),
                (lt.tok._tag === "TAndand" ? AND_BP : OR_BP) >= minBp,
              )
            ? ((bp: number) =>
                ((fnName: string) => binCallOrLeftSection$(toks, left, lt, pos, bp, fnName, hooks))(
                  lt.tok._tag === "TAndand" ? "and" : "or",
                ))(lt.tok._tag === "TAndand" ? AND_BP : OR_BP)
            : and(lt.tok._tag === "TConcat", CONCAT_BP >= minBp)
              ? binCallOrLeftSection$(toks, left, lt, pos, CONCAT_BP, "concat", hooks)
              : and(lt.tok._tag === "TBacktick", BACKTICK_BP >= minBp)
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
                            parseExprBp$(toks, BACKTICK_BP + 1, p2, hooks),
                          ),
                        expectTok$(TBacktick as Tok, toks, p1),
                      ),
                    parseAtomOrCall$(toks, pos + 1, hooks),
                  )
                : and(or(lt.tok._tag === "TPlus", lt.tok._tag === "TMinus"), ADD_BP >= minBp)
                  ? ((fnName: string) =>
                      binCallOrLeftSection$(toks, left, lt, pos, ADD_BP, fnName, hooks))(
                      lt.tok._tag === "TPlus" ? "add" : "sub",
                    )
                  : and(
                        or(
                          lt.tok._tag === "TStar",
                          or(lt.tok._tag === "TSlash", lt.tok._tag === "TPercent"),
                        ),
                        MUL_BP >= minBp,
                      )
                    ? ((fnName: string) =>
                        binCallOrLeftSection$(toks, left, lt, pos, MUL_BP, fnName, hooks))(
                        lt.tok._tag === "TStar" ? "mul" : lt.tok._tag === "TSlash" ? "div" : "mod",
                      )
                    : (Ok({ left: left, p: pos, matched: false }) as Result<
                        { left: Expr; p: number; matched: boolean },
                        PErr
                      >);
};
const parseInfix: _Curry<
  [
    toks: LocTok[],
    minBp: number,
    left: Expr,
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<{ left: Expr; p: number; matched: boolean }, PErr>
> = _curry(5, parseInfix$);
const infixLoop$ = (
  toks: LocTok[],
  minBp: number,
  left: Expr,
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> =>
  _Result_flatMap(
    (res) =>
      res.matched
        ? infixLoop$(toks, minBp, res.left, res.p, hooks)
        : (Ok(_tuple(res.left, res.p)) as Result<[Expr, number], PErr>),
    parseInfix$(toks, minBp, left, pos, hooks),
  );
const infixLoop: _Curry<
  [
    toks: LocTok[],
    minBp: number,
    left: Expr,
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(5, infixLoop$);
const ternaryTail$ = (
  toks: LocTok[],
  cond: Expr,
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> =>
  tokAt$(toks, pos).tok._tag === "TQuestion"
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
                parseExpr$(toks, p2, hooks),
              ),
            expectTok$(TColon as Tok, toks, p1),
          ),
        parseExpr$(toks, pos + 1, hooks),
      )
    : (Ok(_tuple(cond, pos)) as Result<[Expr, number], PErr>);
const ternaryTail: _Curry<
  [
    toks: LocTok[],
    cond: Expr,
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(4, ternaryTail$);
const parseExprBp$ = (
  toks: LocTok[],
  minBp: number,
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TLet": {
      return parseLetIn$(toks, pos, hooks);
    }
    default: {
      return and(minBp === 0, looksLikeLambda$(toks, pos))
        ? parseLambda$(toks, pos, hooks)
        : _Result_flatMap(
            ([left, p]) =>
              _Result_flatMap(
                ([left2, p2]) =>
                  minBp === 0
                    ? ternaryTail$(toks, left2, p2, hooks)
                    : (Ok(_tuple(left2, p2)) as Result<[Expr, number], PErr>),
                infixLoop$(toks, minBp, left, p, hooks),
              ),
            parseAtomOrCall$(toks, pos, hooks),
          );
    }
  }
};
const parseExprBp: _Curry<
  [
    toks: LocTok[],
    minBp: number,
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(4, parseExprBp$);
const parseExpr$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => parseExprBp$(toks, 0, pos, hooks);
const parseExpr: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseExpr$);
const CPPos = (value: Expr): CallPart => ({ _tag: "CPPos", value });
const CPLab = _curry(3, (name, value, labelSpan) => ({
  _tag: "CPLab",
  name,
  value,
  labelSpan,
})) as (name: string, value: Expr, labelSpan: SpanAt) => CallPart;
const parseCallPart$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[CallPart, number], PErr> =>
  tokAt$(toks, pos).tok._tag === "TTilde"
    ? _Result_flatMap(
        ([nm, p]) =>
          tokAt$(toks, p).tok._tag === "TEq"
            ? _Result_map(
                ([v, k]: [Expr, number]) => _tuple(CPLab(nm.name, v, nm.span), k),
                parseExpr$(toks, p + 1, hooks),
              )
            : (Ok(_tuple(CPLab(nm.name, Ast.ERef(nm.name, nm.span), nm.span), p)) as Result<
                [CallPart, number],
                PErr
              >),
        expectLabel$(toks, pos + 1),
      )
    : _Result_map(([v, k]: [Expr, number]) => _tuple(CPPos(v), k), parseExpr$(toks, pos, hooks));
/**
 * `~name` alone is punning — it means `~name = name` (ADR 0098 §2).
 */
const parseCallPart: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[CallPart, number], PErr>
> = _curry(3, parseCallPart$);
const callPartSpan: (p: CallPart) => SpanAt = (p: CallPart) => {
  const $match = p;
  switch ($match._tag) {
    case "CPPos": {
      const { value } = $match;
      return exprSpan(value);
    }
    case "CPLab": {
      const { value, labelSpan } = $match;
      return spanning(labelSpan, exprSpan(value));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const splitCallParts$ = (
  parts: CallPart[],
  positional: Expr[],
  labeled: CallPart[],
): Result<[Expr[], CallPart[]], PErr> =>
  ((_v) =>
    _v.length === 0
      ? (Ok(_tuple(positional, labeled)) as Result<[Expr[], CallPart[]], PErr>)
      : _v.length >= 1
        ? (([p, ...rest]) =>
            ((_v) =>
              _v._tag === "CPLab"
                ? splitCallParts$(rest, positional, _Array_append(p, labeled))
                : _v._tag === "CPPos"
                  ? (({ value }) =>
                      ((_v) =>
                        _v.length === 0
                          ? splitCallParts$(rest, _Array_append(value, positional), labeled)
                          : errAt("labeled arguments must be a trailing group", callPartSpan(p)))(
                        labeled,
                      ))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(p))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(parts);
/**
 * Positionals first, then a single trailing labeled group; a positional after
 * a label is an error, so the record argument is always last.
 */
const splitCallParts: _Curry<
  [parts: CallPart[], positional: Expr[], labeled: CallPart[]],
  Result<[Expr[], CallPart[]], PErr>
> = _curry(3, splitCallParts$);
const labeledField: (p: CallPart) => Field = (p: CallPart) => {
  const $match = p;
  switch ($match._tag) {
    case "CPLab": {
      const { name, value, labelSpan } = $match;
      return { name: name, nameSpan: labelSpan, value: value };
    }
    case "CPPos": {
      const { value } = $match;
      return { name: "", nameSpan: exprSpan(value), value: value };
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const unionSpans$ = (parts: CallPart[], acc: SpanAt): SpanAt =>
  ((_v) =>
    _v.length === 0
      ? acc
      : _v.length >= 1
        ? (([p, ...rest]) => unionSpans$(rest, spanning(acc, callPartSpan(p))))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(parts);
const unionSpans: _Curry<[parts: CallPart[], acc: SpanAt], SpanAt> = _curry(2, unionSpans$);
/**
 * A trailing labeled group collapses to one record argument, tagged
 * `origin = Some("labeled")` so the formatter can re-fold the sugar.
 */
const callArgsOf: (parts: CallPart[]) => Result<[Expr[], Option<string>], PErr> = (
  parts: CallPart[],
) =>
  _Result_map(
    ([positional, labeled]: [Expr[], CallPart[]]) =>
      ((_v) =>
        _v.length === 0
          ? _tuple(positional, None as Option<string>)
          : _v.length >= 1
            ? (([first, ...rest]) =>
                _tuple(
                  _Array_append(
                    Ast.ERecord(
                      map(labeledField, labeled),
                      None as Option<Expr>,
                      unionSpans$(rest, callPartSpan(first)),
                    ),
                    positional,
                  ),
                  Some("labeled") as Option<string>,
                ))(_v)
            : (() => {
                throw new Error("non-exhaustive match");
              })())(labeled),
    splitCallParts$(parts, [] as Expr[], [] as CallPart[]),
  );
const postfixLoop$ = (
  toks: LocTok[],
  e: Expr,
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TLparen": {
      return _Result_flatMap(
        ([parts, p]) =>
          _Result_flatMap(
            (p2) =>
              _Result_flatMap(
                ([args, origin]) =>
                  postfixLoop$(
                    toks,
                    Ast.ECall(e, args, origin, toEnd(exprSpan(e), toks, p2)),
                    p2,
                    hooks,
                  ),
                callArgsOf(parts),
              ),
            expectTok$(TRparen as Tok, toks, p),
          ),
        listUntilH(TRparen as Tok, parseCallPart, toks, pos + 1, hooks),
      );
    }
    case "TDot": {
      return _Result_flatMap(
        ([id, p]) =>
          postfixLoop$(
            toks,
            Ast.EField(e, id.name, false, spanning(exprSpan(e), id.span)),
            p,
            hooks,
          ),
        expectLabel$(toks, pos + 1),
      );
    }
    default: {
      return Ok(_tuple(e, pos)) as Result<[Expr, number], PErr>;
    }
  }
};
const postfixLoop: _Curry<
  [
    toks: LocTok[],
    e: Expr,
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(4, postfixLoop$);
const parseAtomOrCall$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const lt = tokAt$(toks, pos);
  return or(lt.tok._tag === "TMinus", lt.tok._tag === "TBang")
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
            ) as Result<[Expr, number], PErr>)(lt.tok._tag === "TMinus" ? "negate" : "not"),
        parseAtomOrCall$(toks, pos + 1, hooks),
      )
    : _Result_flatMap(([e, p]) => postfixLoop$(toks, e, p, hooks), parseAtom$(toks, pos, hooks));
};
const parseAtomOrCall: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseAtomOrCall$);
const parseAtom$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const lt = tokAt$(toks, pos);
  const sp: SpanAt = spanOf(lt);
  const $match = lt.tok;
  switch ($match._tag) {
    case "TSwitch": {
      return parseMatch$(toks, pos, hooks);
    }
    case "TDo": {
      return parseDo$(toks, pos, hooks);
    }
    case "TLoop": {
      return parseLoop$(toks, pos, hooks);
    }
    case "TRecur": {
      return parseRecur$(toks, pos, hooks);
    }
    case "TLbrace": {
      return parseRecord$(toks, pos, hooks);
    }
    case "TLbracket": {
      return parseArr$(toks, pos, hooks);
    }
    case "TAt": {
      return parseList$(toks, pos, hooks);
    }
    case "THash": {
      return parseHash$(toks, pos, hooks);
    }
    case "TTmplStart": {
      return parseInterp$(toks, pos, hooks);
    }
    default: {
      return _Result_flatMap(
        (claimed) =>
          ((_v) =>
            _v._tag === "Some"
              ? (({ value: [e, p] }) => Ok(_tuple(e, p)) as Result<[Expr, number], PErr>)(
                  _v as Extract<Option<[Expr, number]>, { _tag: "Some" }>,
                )
              : _v._tag === "None"
                ? ((_v) =>
                    _v._tag === "TNum"
                      ? (({ value, raw }) =>
                          Ok(_tuple(Ast.ENum(value, raw, sp), pos + 1)) as Result<
                            [Expr, number],
                            PErr
                          >)(_v)
                      : _v._tag === "TBool"
                        ? (({ value }) =>
                            Ok(_tuple(Ast.EBool(value, sp), pos + 1)) as Result<
                              [Expr, number],
                              PErr
                            >)(_v)
                        : _v._tag === "TStr"
                          ? (({ value }) =>
                              Ok(_tuple(Ast.EStr(value, sp), pos + 1)) as Result<
                                [Expr, number],
                                PErr
                              >)(_v)
                          : _v._tag === "TId"
                            ? (({ value: name }) =>
                                Ok(_tuple(Ast.ERef(name, sp), pos + 1)) as Result<
                                  [Expr, number],
                                  PErr
                                >)(_v)
                            : _v._tag === "TLparen"
                              ? ((nxt) =>
                                  nxt.tok._tag === "TRparen"
                                    ? (Ok(
                                        _tuple(Ast.EUnit(toEnd(sp, toks, pos + 2)), pos + 2),
                                      ) as Result<[Expr, number], PErr>)
                                    : and(isSectionOp(nxt.tok), nxt.tok._tag !== "TMinus")
                                      ? parseRightSection$(toks, sp, pos + 1, hooks)
                                      : _Result_flatMap(
                                          ([first, p]) =>
                                            tokAt$(toks, p).tok._tag === "TComma"
                                              ? _Result_flatMap(
                                                  ([elements, p2]) =>
                                                    _Result_flatMap(
                                                      (p3) =>
                                                        Ok(
                                                          _tuple(
                                                            Ast.ETuple(
                                                              elements,
                                                              toEnd(sp, toks, p3),
                                                            ),
                                                            p3,
                                                          ),
                                                        ) as Result<[Expr, number], PErr>,
                                                      expectTok$(TRparen as Tok, toks, p2),
                                                    ),
                                                  sepByH(parseExpr, toks, p + 1, [first], hooks),
                                                )
                                              : _Result_map(
                                                  (p2: number) => _tuple(first, p2),
                                                  expectTok$(TRparen as Tok, toks, p),
                                                ),
                                          parseExpr$(toks, pos + 1, hooks),
                                        ))(tokAt$(toks, pos + 1))
                              : ((t) => errAt(`unexpected token ${tokName(t)}`, lt))(_v))(lt.tok)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(claimed),
        runParseHooks(
          hooks,
          toks,
          pos,
          _curry(2, (t: LocTok[], p: number) => parseExpr$(t, p, hooks)),
        ),
      );
    }
  }
};
const parseAtom: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseAtom$);
const parseInterpLoop$ = (
  toks: LocTok[],
  pos: number,
  start: SpanAt,
  acc: InterpPart[],
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> =>
  _Result_flatMap(
    ([holeExpr, p]) =>
      ((acc2: InterpPart[]) =>
        ((lt) =>
          ((_v) =>
            _v._tag === "TTmplMid"
              ? (({ value }) =>
                  parseInterpLoop$(
                    toks,
                    p + 1,
                    start,
                    _Array_append(Ast.IPLit(value), acc2),
                    hooks,
                  ))(_v)
              : _v._tag === "TTmplEnd"
                ? (({ value }) =>
                    Ok(
                      _tuple(
                        Ast.EInterp(
                          _Array_append(Ast.IPLit(value), acc2),
                          toEnd(start, toks, p + 1),
                        ),
                        p + 1,
                      ),
                    ) as Result<[Expr, number], PErr>)(_v)
                : ((t) => errAt(`expected \${...} to close, got ${tokName(t)}`, lt))(_v))(lt.tok))(
          tokAt$(toks, p),
        ))(_Array_append(Ast.IPExpr(holeExpr), acc)),
    parseExpr$(toks, pos, hooks),
  );
const parseInterpLoop: _Curry<
  [
    toks: LocTok[],
    pos: number,
    start: SpanAt,
    acc: InterpPart[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(5, parseInterpLoop$);
const parseInterp$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const lt = tokAt$(toks, pos);
  const $match = lt.tok;
  switch ($match._tag) {
    case "TTmplStart": {
      const { value } = $match;
      return parseInterpLoop$(toks, pos + 1, spanOf(lt), [Ast.IPLit(value)], hooks);
    }
    default: {
      const t = $match;
      return errAt(`expected tmplstart, got ${tokName(t)}`, lt);
    }
  }
};
const parseInterp: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseInterp$);
const parseField$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Field, number], PErr> => {
  const lt = tokAt$(toks, pos);
  return _Result_flatMap(
    ([nm, p]) =>
      tokAt$(toks, p).tok._tag === "TColon"
        ? _Result_flatMap(
            ([value, p2]) =>
              Ok(_tuple({ name: nm.name, nameSpan: nm.span, value: value }, p2)) as Result<
                [Field, number],
                PErr
              >,
            parseExpr$(toks, p + 1, hooks),
          )
        : keywordText(lt.tok)._tag !== "None"
          ? errAt(`'${nm.name}' is a keyword — write '${nm.name}: <expr>'`, lt)
          : (Ok(
              _tuple({ name: nm.name, nameSpan: nm.span, value: Ast.ERef(nm.name, nm.span) }, p),
            ) as Result<[Field, number], PErr>),
    expectLabel$(toks, pos),
  );
};
const parseField: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Field, number], PErr>
> = _curry(3, parseField$);
const parseRecord$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  return _Result_flatMap(
    (p) =>
      tokAt$(toks, p).tok._tag === "TSpread"
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
                        expectTok$(TRbrace as Tok, toks, p3),
                      ),
                    listUntilH(TRbrace as Tok, parseField, toks, p2, hooks),
                  ),
                tokAt$(toks, p1).tok._tag === "TRbrace"
                  ? (Ok(p1) as Result<number, PErr>)
                  : expectTok$(TComma as Tok, toks, p1),
              ),
            parseExpr$(toks, p + 1, hooks),
          )
        : _Result_flatMap(
            ([fields, p1]) =>
              _Result_flatMap(
                (p2) =>
                  Ok(
                    _tuple(Ast.ERecord(fields, None as Option<Expr>, toEnd(start, toks, p2)), p2),
                  ) as Result<[Expr, number], PErr>,
                expectTok$(TRbrace as Tok, toks, p1),
              ),
            listUntilH(TRbrace as Tok, parseField, toks, p, hooks),
          ),
    expectTok$(TLbrace as Tok, toks, pos),
  );
};
const parseRecord: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseRecord$);
const parseSeqElem$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[SeqElem, number], PErr> =>
  tokAt$(toks, pos).tok._tag === "TSpread"
    ? _Result_flatMap(
        ([ex, p]) => Ok(_tuple(Ast.SESpread(ex), p)) as Result<[SeqElem, number], PErr>,
        parseExpr$(toks, pos + 1, hooks),
      )
    : _Result_flatMap(
        ([ex, p]) => Ok(_tuple(Ast.SEExpr(ex), p)) as Result<[SeqElem, number], PErr>,
        parseExpr$(toks, pos, hooks),
      );
const parseSeqElem: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[SeqElem, number], PErr>
> = _curry(3, parseSeqElem$);
const parseArr$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
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
            expectTok$(TRbracket as Tok, toks, p2),
          ),
        listUntilH(TRbracket as Tok, parseSeqElem, toks, p, hooks),
      ),
    expectTok$(TLbracket as Tok, toks, pos),
  );
};
const parseArr: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseArr$);
const parseList$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
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
                expectTok$(TRbrace as Tok, toks, p2),
              ),
            listUntilH(TRbrace as Tok, parseSeqElem, toks, p1, hooks),
          ),
        expectTok$(TLbrace as Tok, toks, p),
      ),
    expectTok$(TAt as Tok, toks, pos),
  );
};
const parseList: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseList$);
const parseMapEntry$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[MapEntry, number], PErr> =>
  _Result_flatMap(
    ([key, p]) =>
      _Result_flatMap(
        (p2) =>
          _Result_flatMap(
            ([value, p3]) =>
              Ok(_tuple({ key: key, value: value }, p3)) as Result<[MapEntry, number], PErr>,
            parseExpr$(toks, p2, hooks),
          ),
        expectTok$(TColon as Tok, toks, p),
      ),
    parseExpr$(toks, pos, hooks),
  );
const parseMapEntry: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[MapEntry, number], PErr>
> = _curry(3, parseMapEntry$);
const parseHash$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  return _Result_flatMap(
    (p) =>
      _Result_flatMap(
        (p1) =>
          tokAt$(toks, p1).tok._tag === "TRbrace"
            ? _Result_flatMap(
                (p2) =>
                  Ok(_tuple(Ast.EMap([] as MapEntry[], toEnd(start, toks, p2)), p2)) as Result<
                    [Expr, number],
                    PErr
                  >,
                expectTok$(TRbrace as Tok, toks, p1),
              )
            : tokAt$(toks, p1).tok._tag === "TSpread"
              ? _Result_flatMap(
                  ([elements, p2]) =>
                    _Result_flatMap(
                      (p3) =>
                        Ok(_tuple(Ast.ESet(elements, toEnd(start, toks, p3)), p3)) as Result<
                          [Expr, number],
                          PErr
                        >,
                      expectTok$(TRbrace as Tok, toks, p2),
                    ),
                  listUntilH(TRbrace as Tok, parseSeqElem, toks, p1, hooks),
                )
              : _Result_flatMap(
                  ([first, p2]) =>
                    tokAt$(toks, p2).tok._tag === "TColon"
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
                                      expectTok$(TRbrace as Tok, toks, p5),
                                    ),
                                  tokAt$(toks, p4).tok._tag === "TComma"
                                    ? listUntilH(TRbrace as Tok, parseMapEntry, toks, p4 + 1, hooks)
                                    : (Ok(_tuple([] as MapEntry[], p4)) as Result<
                                        [MapEntry[], number],
                                        PErr
                                      >),
                                ),
                              parseExpr$(toks, p3, hooks),
                            ),
                          expectTok$(TColon as Tok, toks, p2),
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
                              expectTok$(TRbrace as Tok, toks, p3),
                            ),
                          tokAt$(toks, p2).tok._tag === "TComma"
                            ? listUntilH(TRbrace as Tok, parseSeqElem, toks, p2 + 1, hooks)
                            : (Ok(_tuple([] as SeqElem[], p2)) as Result<
                                [SeqElem[], number],
                                PErr
                              >),
                        ),
                  parseExpr$(toks, p1, hooks),
                ),
        expectTok$(TLbrace as Tok, toks, p),
      ),
    expectTok$(THash as Tok, toks, pos),
  );
};
const parseHash: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseHash$);
const parseGuard$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Option<Expr>, number], PErr> =>
  ((_v) =>
    _v._tag === "TId" && _v.value === "when"
      ? _Result_map(
          ([g, p]: [Expr, number]) => _tuple(Some(g) as Option<Expr>, p),
          parseExpr$(toks, pos + 1, hooks),
        )
      : (Ok(_tuple(None as Option<Expr>, pos)) as Result<[Option<Expr>, number], PErr>))(
    tokAt$(toks, pos).tok,
  );
const parseGuard: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Option<Expr>, number], PErr>
> = _curry(3, parseGuard$);
const patSpan: (p: Pattern) => SpanAt = (p: Pattern) => {
  const $match = p;
  switch ($match._tag) {
    case "PWild": {
      const { span: sp } = $match;
      return sp;
    }
    case "PUnit": {
      const { span: sp } = $match;
      return sp;
    }
    case "PBind": {
      const { span: sp } = $match;
      return sp;
    }
    case "PAs": {
      const { span: sp } = $match;
      return sp;
    }
    case "PLit": {
      const { span: sp } = $match;
      return sp;
    }
    case "PBool": {
      const { span: sp } = $match;
      return sp;
    }
    case "PStr": {
      const { span: sp } = $match;
      return sp;
    }
    case "PTuple": {
      const { span: sp } = $match;
      return sp;
    }
    case "PRecord": {
      const { span: sp } = $match;
      return sp;
    }
    case "PCtor": {
      const { span: sp } = $match;
      return sp;
    }
    case "PArr": {
      const { span: sp } = $match;
      return sp;
    }
    case "PList": {
      const { span: sp } = $match;
      return sp;
    }
    case "POr": {
      const { span: sp } = $match;
      return sp;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
const altsLoop$ = (
  toks: LocTok[],
  pos: number,
  acc: Pattern[],
  lastSpan: SpanAt,
): Result<[Pattern[], number, SpanAt], PErr> =>
  tokAt$(toks, pos).tok._tag === "TBar"
    ? _Result_flatMap(
        ([alt, p1]) => altsLoop$(toks, p1, _Array_append(alt, acc), patSpan(alt)),
        parsePattern$(toks, pos + 1),
      )
    : (Ok(_tuple(acc, pos, lastSpan)) as Result<[Pattern[], number, SpanAt], PErr>);
const altsLoop: _Curry<
  [toks: LocTok[], pos: number, acc: Pattern[], lastSpan: SpanAt],
  Result<[Pattern[], number, SpanAt], PErr>
> = _curry(4, altsLoop$);
const armsLoop$ = (
  toks: LocTok[],
  pos: number,
  acc: MatchArm[],
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[MatchArm[], number], PErr> =>
  tokAt$(toks, pos).tok._tag === "TBar"
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
                            armsLoop$(
                              toks,
                              p5,
                              _Array_append({ pattern: pattern, guard: guard, body: body }, acc),
                              hooks,
                            ),
                          parseExpr$(toks, p4, hooks),
                        ),
                      expectTok$(TArrow as Tok, toks, p3),
                    ),
                  parseGuard$(toks, p2, hooks),
                ))(length(alts) === 1 ? first : Ast.POr(alts, spanning(patSpan(first), lastSpan))),
            altsLoop$(toks, p1, [first], patSpan(first)),
          ),
        parsePattern$(toks, pos + 1),
      )
    : (Ok(_tuple(acc, pos)) as Result<[MatchArm[], number], PErr>);
const armsLoop: _Curry<
  [
    toks: LocTok[],
    pos: number,
    acc: MatchArm[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[MatchArm[], number], PErr>
> = _curry(4, armsLoop$);
const parseDo$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  return _Result_flatMap(
    (p) => parseDoBlockFrom$(toks, start, p, hooks),
    expectTok$(TDo as Tok, toks, pos),
  );
};
const parseDo: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseDo$);
const parseDoBlock$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => parseDoBlockFrom$(toks, spanOf(tokAt$(toks, pos)), pos, hooks);
const parseDoBlock: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseDoBlock$);
const parseDoBlockFrom$ = (
  toks: LocTok[],
  start: SpanAt,
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> =>
  _Result_flatMap(
    (p1) =>
      tokAt$(toks, p1).tok._tag === "TRbrace"
        ? errAt("do block needs a final expression", tokAt$(toks, p1))
        : _Result_flatMap(
            ([exprs, p2]) =>
              tokAt$(toks, p2).tok._tag === "TSemi"
                ? errAt("do block cannot end with a semicolon", tokAt$(toks, p2))
                : _Result_flatMap(
                    (p3) =>
                      Ok(_tuple(Ast.EDo(exprs, toEnd(start, toks, p3)), p3)) as Result<
                        [Expr, number],
                        PErr
                      >,
                    expectTok$(TRbrace as Tok, toks, p2),
                  ),
            parseDoExprs$(toks, p1, [] as Expr[], hooks),
          ),
    expectTok$(TLbrace as Tok, toks, pos),
  );
const parseDoBlockFrom: _Curry<
  [
    toks: LocTok[],
    start: SpanAt,
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(4, parseDoBlockFrom$);
const parseDoExprs$ = (
  toks: LocTok[],
  pos: number,
  acc: Expr[],
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr[], number], PErr> =>
  _Result_flatMap(
    ([expr, p]) =>
      ((next: Expr[]) =>
        tokAt$(toks, p).tok._tag === "TSemi"
          ? parseDoExprs$(toks, p + 1, next, hooks)
          : (Ok(_tuple(next, p)) as Result<[Expr[], number], PErr>))(_Array_append(expr, acc)),
    parseExpr$(toks, pos, hooks),
  );
const parseDoExprs: _Curry<
  [
    toks: LocTok[],
    pos: number,
    acc: Expr[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr[], number], PErr>
> = _curry(4, parseDoExprs$);
const parseLoop$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
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
                            expectTok$(TRbrace as Tok, toks, p5),
                          ),
                        parseExpr$(toks, p4, hooks),
                      ),
                    expectTok$(TLbrace as Tok, toks, p3),
                  ),
                expectTok$(TRparen as Tok, toks, p2),
              ),
            loopParamsLoop$(toks, p1, [] as LoopParam[], hooks),
          ),
        expectTok$(TLparen as Tok, toks, p),
      ),
    expectTok$(TLoop as Tok, toks, pos),
  );
};
const parseLoop: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseLoop$);
const loopParamsLoop$ = (
  toks: LocTok[],
  pos: number,
  acc: LoopParam[],
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[LoopParam[], number], PErr> =>
  _Result_flatMap(
    ([id, pid]) =>
      _Result_flatMap(
        (p) =>
          _Result_flatMap(
            ([init, p1]) =>
              ((next: LoopParam[]) =>
                ((_v) =>
                  _v._tag === "TComma"
                    ? loopParamsLoop$(toks, p1 + 1, next, hooks)
                    : (Ok(_tuple(next, p1)) as Result<[LoopParam[], number], PErr>))(
                  tokAt$(toks, p1).tok,
                ))(_Array_append({ name: id.name, nameSpan: id.span, init: init }, acc)),
            parseExpr$(toks, p, hooks),
          ),
        expectTok$(TEq as Tok, toks, pid),
      ),
    expectId$(toks, pos),
  );
const loopParamsLoop: _Curry<
  [
    toks: LocTok[],
    pos: number,
    acc: LoopParam[],
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[LoopParam[], number], PErr>
> = _curry(4, loopParamsLoop$);
const parseRecur$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  return _Result_flatMap(
    (p) =>
      _Result_flatMap(
        (p1) =>
          ((_v) =>
            _v._tag === "TRparen"
              ? (Ok(_tuple(Ast.ERecur([] as Expr[], toEnd(start, toks, p1 + 1)), p1 + 1)) as Result<
                  [Expr, number],
                  PErr
                >)
              : _Result_flatMap(
                  ([args, p2]) =>
                    _Result_map(
                      (p3: number) => _tuple(Ast.ERecur(args, toEnd(start, toks, p3)), p3),
                      expectTok$(TRparen as Tok, toks, p2),
                    ),
                  sepByH(parseExpr, toks, p1, [] as Expr[], hooks),
                ))(tokAt$(toks, p1).tok),
        expectTok$(TLparen as Tok, toks, p),
      ),
    expectTok$(TRecur as Tok, toks, pos),
  );
};
const parseRecur: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseRecur$);
const parseMatch$ = (
  toks: LocTok[],
  pos: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Expr, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  return _Result_flatMap(
    (p) =>
      _Result_flatMap(
        ([scrutinee, p1]) =>
          _Result_flatMap(
            (p2) =>
              _Result_flatMap(
                ([arms, p3]) =>
                  ((_v) =>
                    _v === 0
                      ? errAt("switch needs at least one | arm", tokAt$(toks, p3))
                      : _Result_map(
                          (p4: number) =>
                            _tuple(Ast.EMatch(scrutinee, arms, toEnd(start, toks, p4)), p4),
                          expectTok$(TRbrace as Tok, toks, p3),
                        ))(length(arms)),
                armsLoop$(toks, p2, [] as MatchArm[], hooks),
              ),
            expectTok$(TLbrace as Tok, toks, p1),
          ),
        parseExpr$(toks, p, hooks),
      ),
    expectTok$(TSwitch as Tok, toks, pos),
  );
};
const parseMatch: _Curry<
  [
    toks: LocTok[],
    pos: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Expr, number], PErr>
> = _curry(3, parseMatch$);
const parseCtorArgs$ = (
  toks: LocTok[],
  ctor: string,
  ns: Option<string>,
  nameSpan: SpanAt,
  pos: number,
): Result<[Pattern, number], PErr> =>
  tokAt$(toks, pos).tok._tag === "TLparen"
    ? _Result_flatMap(
        ([args, p]) =>
          _Result_flatMap(
            (p2) =>
              Ok(_tuple(Ast.PCtor(ctor, args, ns, toEnd(nameSpan, toks, p2)), p2)) as Result<
                [Pattern, number],
                PErr
              >,
            expectTok$(TRparen as Tok, toks, p),
          ),
        listUntil(TRparen as Tok, parsePattern, toks, pos + 1),
      )
    : (Ok(_tuple(Ast.PCtor(ctor, [] as Pattern[], ns, toEnd(nameSpan, toks, pos)), pos)) as Result<
        [Pattern, number],
        PErr
      >);
const parseCtorArgs: _Curry<
  [toks: LocTok[], ctor: string, ns: Option<string>, nameSpan: SpanAt, pos: number],
  Result<[Pattern, number], PErr>
> = _curry(5, parseCtorArgs$);
const parsePatternAtom$ = (toks: LocTok[], pos: number): Result<[Pattern, number], PErr> => {
  const lt = tokAt$(toks, pos);
  const sp: SpanAt = spanOf(lt);
  return ((_v) =>
    _v._tag === "TNum"
      ? (({ value, raw }) =>
          Ok(_tuple(Ast.PLit(value, raw, sp), pos + 1)) as Result<[Pattern, number], PErr>)(_v)
      : _v._tag === "TBool"
        ? (({ value }) =>
            Ok(_tuple(Ast.PBool(value, sp), pos + 1)) as Result<[Pattern, number], PErr>)(_v)
        : _v._tag === "TStr"
          ? (({ value }) =>
              Ok(_tuple(Ast.PStr(value, sp), pos + 1)) as Result<[Pattern, number], PErr>)(_v)
          : _v._tag === "TLparen"
            ? tokAt$(toks, pos + 1).tok._tag === "TRparen"
              ? (Ok(_tuple(Ast.PUnit(toEnd(sp, toks, pos + 2)), pos + 2)) as Result<
                  [Pattern, number],
                  PErr
                >)
              : _Result_flatMap(
                  ([elems, p]) =>
                    _Result_flatMap(
                      (p2) =>
                        Ok(
                          ((_v) =>
                            _v.length === 1
                              ? (([single]) => _tuple(single, p2))(_v)
                              : ((many) => _tuple(Ast.PTuple(many, toEnd(sp, toks, p2)), p2))(_v))(
                            elems,
                          ),
                        ) as Result<[Pattern, number], PErr>,
                      expectTok$(TRparen as Tok, toks, p),
                    ),
                  sepBy(parsePattern, toks, pos + 1, [] as Pattern[]),
                )
            : _v._tag === "TLbrace"
              ? _Result_flatMap(
                  ([fields, p]) =>
                    _Result_flatMap(
                      (p2) =>
                        Ok(_tuple(Ast.PRecord(fields, toEnd(sp, toks, p2)), p2)) as Result<
                          [Pattern, number],
                          PErr
                        >,
                      expectTok$(TRbrace as Tok, toks, p),
                    ),
                  listUntil(TRbrace as Tok, parsePatField, toks, pos + 1),
                )
              : _v._tag === "TLbracket"
                ? parseArrPattern$(toks, pos)
                : _v._tag === "TAt"
                  ? parseListPattern$(toks, pos)
                  : _v._tag === "TId" && _v.value === "_"
                    ? (Ok(_tuple(Ast.PWild(sp), pos + 1)) as Result<[Pattern, number], PErr>)
                    : _v._tag === "TId"
                      ? (({ value: name }) =>
                          tokAt$(toks, pos + 1).tok._tag === "TDot"
                            ? _Result_flatMap(
                                ([c, p1]) =>
                                  isUpper(c.name)
                                    ? parseCtorArgs$(
                                        toks,
                                        c.name,
                                        Some(name) as Option<string>,
                                        sp,
                                        p1,
                                      )
                                    : errAt(
                                        `expected constructor after '${name}.', got '${c.name}'`,
                                        tokAt$(toks, p1),
                                      ),
                                expectId$(toks, pos + 2),
                              )
                            : isUpper(name)
                              ? parseCtorArgs$(toks, name, None as Option<string>, sp, pos + 1)
                              : (Ok(_tuple(Ast.PBind(name, sp), pos + 1)) as Result<
                                  [Pattern, number],
                                  PErr
                                >))(_v)
                      : ((t) => errAt(`unexpected token in pattern: ${tokName(t)}`, lt))(_v))(
    lt.tok,
  );
};
const parsePatternAtom: _Curry<
  [toks: LocTok[], pos: number],
  Result<[Pattern, number], PErr>
> = _curry(2, parsePatternAtom$);
const parsePattern$ = (toks: LocTok[], pos: number): Result<[Pattern, number], PErr> =>
  _Result_flatMap(
    ([pat, p]) =>
      ((_v) =>
        _v._tag === "TId" && _v.value === "as"
          ? _Result_flatMap(
              ([nm, p2]) =>
                Ok(
                  _tuple(Ast.PAs(pat, nm.name, nm.span, spanning(patSpan(pat), nm.span)), p2),
                ) as Result<[Pattern, number], PErr>,
              expectId$(toks, p + 1),
            )
          : (Ok(_tuple(pat, p)) as Result<[Pattern, number], PErr>))(tokAt$(toks, p).tok),
    parsePatternAtom$(toks, pos),
  );
const parsePattern: _Curry<[toks: LocTok[], pos: number], Result<[Pattern, number], PErr>> = _curry(
  2,
  parsePattern$,
);
const restOk: (rest: Option<Pattern>) => boolean = (rest: Option<Pattern>) =>
  ((_v) =>
    _v._tag === "None"
      ? true
      : _v._tag === "Some" && _v.value._tag === "PBind"
        ? true
        : _v._tag === "Some" && _v.value._tag === "PWild"
          ? true
          : _v._tag === "Some"
            ? false
            : (() => {
                throw new Error("non-exhaustive match");
              })())(rest);
const patElemsLoop$ = (
  toks: LocTok[],
  pos: number,
  acc: Pattern[],
): Result<[Pattern[], Option<Pattern>, number], PErr> => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TSpread": {
      return _Result_flatMap(
        ([rest, p]) =>
          Ok(_tuple(acc, Some(rest) as Option<Pattern>, p)) as Result<
            [Pattern[], Option<Pattern>, number],
            PErr
          >,
        parsePattern$(toks, pos + 1),
      );
    }
    default: {
      return _Result_flatMap(
        ([pat, p]) =>
          ((elems: Pattern[]) =>
            tokAt$(toks, p).tok._tag === "TComma"
              ? patElemsLoop$(toks, p + 1, elems)
              : (Ok(_tuple(elems, None as Option<Pattern>, p)) as Result<
                  [Pattern[], Option<Pattern>, number],
                  PErr
                >))(_Array_append(pat, acc)),
        parsePattern$(toks, pos),
      );
    }
  }
};
const patElemsLoop: _Curry<
  [toks: LocTok[], pos: number, acc: Pattern[]],
  Result<[Pattern[], Option<Pattern>, number], PErr>
> = _curry(3, patElemsLoop$);
const parseArrPattern$ = (toks: LocTok[], pos: number): Result<[Pattern, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  return _Result_flatMap(
    (p) =>
      tokAt$(toks, p).tok._tag === "TRbracket"
        ? (Ok(
            _tuple(
              Ast.PArr([] as Pattern[], None as Option<Pattern>, toEnd(start, toks, p + 1)),
              p + 1,
            ),
          ) as Result<[Pattern, number], PErr>)
        : _Result_flatMap(
            ([elems, rest, p2]) =>
              restOk(rest)
                ? _Result_map(
                    (p3: number) => _tuple(Ast.PArr(elems, rest, toEnd(start, toks, p3)), p3),
                    expectTok$(TRbracket as Tok, toks, p2),
                  )
                : errAt("list `...` rest must bind a name or `_`", tokAt$(toks, p2)),
            patElemsLoop$(toks, p, [] as Pattern[]),
          ),
    expectTok$(TLbracket as Tok, toks, pos),
  );
};
const parseArrPattern: _Curry<
  [toks: LocTok[], pos: number],
  Result<[Pattern, number], PErr>
> = _curry(2, parseArrPattern$);
const parseListPattern$ = (toks: LocTok[], pos: number): Result<[Pattern, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  return _Result_flatMap(
    (p) =>
      _Result_flatMap(
        (p1) =>
          tokAt$(toks, p1).tok._tag === "TRbrace"
            ? (Ok(
                _tuple(
                  Ast.PList([] as Pattern[], None as Option<Pattern>, toEnd(start, toks, p1 + 1)),
                  p1 + 1,
                ),
              ) as Result<[Pattern, number], PErr>)
            : _Result_flatMap(
                ([elems, rest, p2]) =>
                  restOk(rest)
                    ? _Result_map(
                        (p3: number) => _tuple(Ast.PList(elems, rest, toEnd(start, toks, p3)), p3),
                        expectTok$(TRbrace as Tok, toks, p2),
                      )
                    : errAt("list `...` rest must bind a name or `_`", tokAt$(toks, p2)),
                patElemsLoop$(toks, p1, [] as Pattern[]),
              ),
        expectTok$(TLbrace as Tok, toks, p),
      ),
    expectTok$(TAt as Tok, toks, pos),
  );
};
const parseListPattern: _Curry<
  [toks: LocTok[], pos: number],
  Result<[Pattern, number], PErr>
> = _curry(2, parseListPattern$);
const parsePatField$ = (toks: LocTok[], pos: number): Result<[PatField, number], PErr> => {
  const lt = tokAt$(toks, pos);
  return _Result_flatMap(
    ([nm, p]) =>
      tokAt$(toks, p).tok._tag === "TColon"
        ? _Result_flatMap(
            ([pat, p2]) =>
              Ok(_tuple({ label: nm.name, labelSpan: nm.span, pat: pat }, p2)) as Result<
                [PatField, number],
                PErr
              >,
            parsePattern$(toks, p + 1),
          )
        : keywordText(lt.tok)._tag !== "None"
          ? errAt(`'${nm.name}' is a keyword — write '${nm.name}: <pattern>'`, lt)
          : (Ok(
              _tuple({ label: nm.name, labelSpan: nm.span, pat: Ast.PBind(nm.name, nm.span) }, p),
            ) as Result<[PatField, number], PErr>),
    expectLabel$(toks, pos),
  );
};
const parsePatField: _Curry<
  [toks: LocTok[], pos: number],
  Result<[PatField, number], PErr>
> = _curry(2, parsePatField$);
const parseTypeAtom$ = (toks: LocTok[], pos: number): Result<[TypeExpr, number], PErr> => {
  const lt = tokAt$(toks, pos);
  const sp: SpanAt = spanOf(lt);
  const $match = lt.tok;
  switch ($match._tag) {
    case "TLparen": {
      return tokAt$(toks, pos + 1).tok._tag === "TRparen"
        ? (Ok(_tuple(Ast.TyName("unit", toEnd(sp, toks, pos + 2)), pos + 2)) as Result<
            [TypeExpr, number],
            PErr
          >)
        : _Result_flatMap(
            ([inner, p]) =>
              tokAt$(toks, p).tok._tag === "TComma"
                ? _Result_flatMap(
                    ([elems, p2]) =>
                      _Result_flatMap(
                        (p3) =>
                          Ok(_tuple(Ast.TyTuple(elems, toEnd(sp, toks, p3)), p3)) as Result<
                            [TypeExpr, number],
                            PErr
                          >,
                        expectTok$(TRparen as Tok, toks, p2),
                      ),
                    sepBy(parseTypeExpr, toks, p + 1, [inner]),
                  )
                : _Result_map(
                    (p2: number) => _tuple(inner, p2),
                    expectTok$(TRparen as Tok, toks, p),
                  ),
            parseTypeExpr$(toks, pos + 1),
          );
    }
    case "TLbracket": {
      return _Result_flatMap(
        ([elem, p]) =>
          _Result_flatMap(
            (p2) =>
              Ok(_tuple(Ast.TyList(elem, toEnd(sp, toks, p2)), p2)) as Result<
                [TypeExpr, number],
                PErr
              >,
            expectTok$(TRbracket as Tok, toks, p),
          ),
        parseTypeExpr$(toks, pos + 1),
      );
    }
    case "TStr": {
      const { value } = $match;
      return Ok(_tuple(Ast.TyLit(value, sp), pos + 1)) as Result<[TypeExpr, number], PErr>;
    }
    default: {
      return _Result_flatMap(
        ([nm, p]) =>
          and(isUpper(nm.name), tokAt$(toks, p).tok._tag === "TDot")
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
                        tokAt$(toks, p2),
                      ),
                expectId$(toks, p + 1),
              )
            : (Ok(_tuple(Ast.TyName(nm.name, nm.span), p)) as Result<[TypeExpr, number], PErr>),
        expectId$(toks, pos),
      );
    }
  }
};
const parseTypeAtom: _Curry<
  [toks: LocTok[], pos: number],
  Result<[TypeExpr, number], PErr>
> = _curry(2, parseTypeAtom$);
const startsTypeAtom: (t: Tok) => boolean = (t: Tok) => {
  const $match = t;
  switch ($match._tag) {
    case "TId": {
      return true;
    }
    case "TLparen": {
      return true;
    }
    case "TLbracket": {
      return true;
    }
    case "TStr": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const legacyTypeArgsLoop$ = (
  toks: LocTok[],
  pos: number,
  acc: TypeExpr[],
  lastSp: Option<SpanAt>,
): Result<[TypeExpr[], Option<SpanAt>, number], PErr> =>
  startsTypeAtom(tokAt$(toks, pos).tok)
    ? _Result_flatMap(
        ([a, p]) =>
          legacyTypeArgsLoop$(toks, p, _Array_append(a, acc), Some(tySpan(a)) as Option<SpanAt>),
        parseTypeAtom$(toks, pos),
      )
    : (Ok(_tuple(acc, lastSp, pos)) as Result<[TypeExpr[], Option<SpanAt>, number], PErr>);
const legacyTypeArgsLoop: _Curry<
  [toks: LocTok[], pos: number, acc: TypeExpr[], lastSp: Option<SpanAt>],
  Result<[TypeExpr[], Option<SpanAt>, number], PErr>
> = _curry(4, legacyTypeArgsLoop$);
const parseTypeApp$ = (toks: LocTok[], pos: number): Result<[TypeExpr, number], PErr> =>
  _Result_flatMap(
    ([head, p]) =>
      ((_v) =>
        _v._tag === "TyName" && (({ name, span: sp }) => isUpper(name))(_v)
          ? (({ name, span: sp }) =>
              tokAt$(toks, p).tok._tag === "TLt"
                ? _Result_flatMap(
                    ([args, p1]) =>
                      _Result_flatMap(
                        (p2) =>
                          Ok(_tuple(Ast.TyApp(name, args, toEnd(sp, toks, p2)), p2)) as Result<
                            [TypeExpr, number],
                            PErr
                          >,
                        expectTok$(TGt as Tok, toks, p1),
                      ),
                    listUntil(TGt as Tok, parseTypeExpr, toks, p + 1),
                  )
                : _Result_flatMap(
                    ([args, lastSp, p2]) =>
                      Ok(
                        _Option_match(
                          lastSp,
                          () => _tuple(head, p2),
                          (ls) => _tuple(Ast.TyApp(name, args, spanning(sp, ls)), p2),
                        ),
                      ) as Result<[TypeExpr, number], PErr>,
                    legacyTypeArgsLoop$(toks, p, [] as TypeExpr[], None as Option<SpanAt>),
                  ))(_v)
          : _v._tag === "TyQual"
            ? (({ alias, name: nm, nameSpan, span: sp }) =>
                tokAt$(toks, p).tok._tag === "TLt"
                  ? _Result_flatMap(
                      ([args, p1]) =>
                        _Result_flatMap(
                          (p2) =>
                            Ok(
                              _tuple(
                                Ast.TyQual(alias, nm, nameSpan, args, toEnd(sp, toks, p2)),
                                p2,
                              ),
                            ) as Result<[TypeExpr, number], PErr>,
                          expectTok$(TGt as Tok, toks, p1),
                        ),
                      listUntil(TGt as Tok, parseTypeExpr, toks, p + 1),
                    )
                  : _Result_flatMap(
                      ([args, lastSp, p2]) =>
                        Ok(
                          _Option_match(
                            lastSp,
                            () => _tuple(head, p2),
                            (ls) =>
                              _tuple(Ast.TyQual(alias, nm, nameSpan, args, spanning(sp, ls)), p2),
                          ),
                        ) as Result<[TypeExpr, number], PErr>,
                      legacyTypeArgsLoop$(toks, p, [] as TypeExpr[], None as Option<SpanAt>),
                    ))(_v)
            : (Ok(_tuple(head, p)) as Result<[TypeExpr, number], PErr>))(head),
    parseTypeAtom$(toks, pos),
  );
const parseTypeApp: _Curry<
  [toks: LocTok[], pos: number],
  Result<[TypeExpr, number], PErr>
> = _curry(2, parseTypeApp$);
const parseTypeUnionRest$ = (
  toks: LocTok[],
  pos: number,
  acc: TypeExpr[],
  lastSp: SpanAt,
): Result<[TypeExpr[], SpanAt, number], PErr> =>
  tokAt$(toks, pos).tok._tag === "TBar"
    ? _Result_flatMap(
        ([m, p]) => parseTypeUnionRest$(toks, p, _Array_append(m, acc), tySpan(m)),
        parseTypeApp$(toks, pos + 1),
      )
    : (Ok(_tuple(acc, lastSp, pos)) as Result<[TypeExpr[], SpanAt, number], PErr>);
const parseTypeUnionRest: _Curry<
  [toks: LocTok[], pos: number, acc: TypeExpr[], lastSp: SpanAt],
  Result<[TypeExpr[], SpanAt, number], PErr>
> = _curry(4, parseTypeUnionRest$);
const parseTypeUnion$ = (toks: LocTok[], pos: number): Result<[TypeExpr, number], PErr> =>
  _Result_flatMap(
    ([first, p]) =>
      tokAt$(toks, p).tok._tag === "TBar"
        ? _Result_flatMap(
            ([members, lastSp, p2]) =>
              Ok(_tuple(Ast.TyUnion(members, spanning(tySpan(first), lastSp)), p2)) as Result<
                [TypeExpr, number],
                PErr
              >,
            parseTypeUnionRest$(toks, p, [first], tySpan(first)),
          )
        : (Ok(_tuple(first, p)) as Result<[TypeExpr, number], PErr>),
    parseTypeApp$(toks, pos),
  );
const parseTypeUnion: _Curry<
  [toks: LocTok[], pos: number],
  Result<[TypeExpr, number], PErr>
> = _curry(2, parseTypeUnion$);
const parseTypeExpr$ = (toks: LocTok[], pos: number): Result<[TypeExpr, number], PErr> =>
  _Result_flatMap(
    ([from, p]) =>
      tokAt$(toks, p).tok._tag === "TTarrow"
        ? _Result_flatMap(
            ([to, p2]) =>
              Ok(_tuple(Ast.TyArrow(from, to, spanning(tySpan(from), tySpan(to))), p2)) as Result<
                [TypeExpr, number],
                PErr
              >,
            parseTypeExpr$(toks, p + 1),
          )
        : (Ok(_tuple(from, p)) as Result<[TypeExpr, number], PErr>),
    parseTypeUnion$(toks, pos),
  );
const parseTypeExpr: _Curry<
  [toks: LocTok[], pos: number],
  Result<[TypeExpr, number], PErr>
> = _curry(2, parseTypeExpr$);
const parseCtorField$ = (toks: LocTok[], pos: number): Result<[CtorField, number], PErr> => {
  const isLabel: boolean = ((_v) =>
    _v._tag === "TId" ? tokAt$(toks, pos + 1).tok._tag === "TColon" : false)(tokAt$(toks, pos).tok);
  return isLabel
    ? _Result_flatMap(
        ([nm, p]) =>
          _Result_flatMap(
            ([t, p2]) =>
              Ok(_tuple({ name: Some(nm.name) as Option<string>, fieldType: t }, p2)) as Result<
                [CtorField, number],
                PErr
              >,
            parseTypeExpr$(toks, p + 1),
          ),
        expectId$(toks, pos),
      )
    : _Result_map(
        ([t, p]: [TypeExpr, number]) => _tuple({ name: None as Option<string>, fieldType: t }, p),
        parseTypeExpr$(toks, pos),
      );
};
const parseCtorField: _Curry<
  [toks: LocTok[], pos: number],
  Result<[CtorField, number], PErr>
> = _curry(2, parseCtorField$);
const parseCtor$ = (toks: LocTok[], pos: number): Result<[Ctor, number], PErr> =>
  _Result_flatMap(
    ([nm, p]) =>
      tokAt$(toks, p).tok._tag === "TLparen"
        ? _Result_flatMap(
            ([fields, p2]) =>
              _Result_flatMap(
                (p3) =>
                  Ok(
                    _tuple({ name: nm.name, fields: fields, span: toEnd(nm.span, toks, p3) }, p3),
                  ) as Result<[Ctor, number], PErr>,
                expectTok$(TRparen as Tok, toks, p2),
              ),
            listUntil(TRparen as Tok, parseCtorField, toks, p + 1),
          )
        : (Ok(_tuple({ name: nm.name, fields: [] as CtorField[], span: nm.span }, p)) as Result<
            [Ctor, number],
            PErr
          >),
    expectId$(toks, pos),
  );
const parseCtor: _Curry<[toks: LocTok[], pos: number], Result<[Ctor, number], PErr>> = _curry(
  2,
  parseCtor$,
);
const ctorsLoop$ = (toks: LocTok[], pos: number, acc: Ctor[]): Result<[Ctor[], number], PErr> =>
  _Result_flatMap(
    ([c, p]) =>
      ((cs: Ctor[]) =>
        tokAt$(toks, p).tok._tag === "TBar"
          ? ctorsLoop$(toks, p + 1, cs)
          : (Ok(_tuple(cs, p)) as Result<[Ctor[], number], PErr>))(_Array_append(c, acc)),
    parseCtor$(toks, pos),
  );
const ctorsLoop: _Curry<
  [toks: LocTok[], pos: number, acc: Ctor[]],
  Result<[Ctor[], number], PErr>
> = _curry(3, ctorsLoop$);
const parseAliasField$ = (toks: LocTok[], pos: number): Result<[AliasField, number], PErr> =>
  tokAt$(toks, pos).tok._tag === "TSpread"
    ? _Result_flatMap(
        ([t, p]) =>
          Ok(
            _tuple(
              { name: "", nameSpan: tySpan(t), fieldType: t, optional: false, spread: true },
              p,
            ),
          ) as Result<[AliasField, number], PErr>,
        parseTypeApp$(toks, pos + 1),
      )
    : _Result_flatMap(
        ([nm, p]) =>
          ((optional: boolean) =>
            ((p1: number) =>
              _Result_flatMap(
                (p2) =>
                  _Result_flatMap(
                    ([t, p3]) =>
                      Ok(
                        _tuple(
                          {
                            name: nm.name,
                            nameSpan: nm.span,
                            fieldType: t,
                            optional: optional,
                            spread: false,
                          },
                          p3,
                        ),
                      ) as Result<[AliasField, number], PErr>,
                    parseTypeExpr$(toks, p2),
                  ),
                expectTok$(TColon as Tok, toks, p1),
              ))(optional ? p + 1 : p))(tokAt$(toks, p).tok._tag === "TQuestion"),
        expectLabel$(toks, pos),
      );
const parseAliasField: _Curry<
  [toks: LocTok[], pos: number],
  Result<[AliasField, number], PErr>
> = _curry(2, parseAliasField$);
const parseAliasBody$ = (toks: LocTok[], pos: number): Result<[AliasField[], number], PErr> =>
  _Result_flatMap(
    (p) =>
      _Result_flatMap(
        ([fields, p2]) =>
          _Result_flatMap(
            (p3) => Ok(_tuple(fields, p3)) as Result<[AliasField[], number], PErr>,
            expectTok$(TRbrace as Tok, toks, p2),
          ),
        listUntil(TRbrace as Tok, parseAliasField, toks, p),
      ),
    expectTok$(TLbrace as Tok, toks, pos),
  );
const parseAliasBody: _Curry<
  [toks: LocTok[], pos: number],
  Result<[AliasField[], number], PErr>
> = _curry(2, parseAliasBody$);
const typeParamsLoop: <B>(
  toks: LocTok[],
  pos: number,
  acc: string[],
) => Result<[string[], number], B> = _curry(3, <B>(toks: LocTok[], pos: number, acc: string[]) => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TId": {
      const { value: name } = $match;
      return typeParamsLoop(toks, pos + 1, _Array_append(name, acc));
    }
    default: {
      return Ok(_tuple(acc, pos));
    }
  }
});
const parseTypeParams$ = (toks: LocTok[], pos: number): Result<[string[], number], PErr> =>
  tokAt$(toks, pos).tok._tag === "TLt"
    ? _Result_flatMap(
        ([names, p]) =>
          _Result_map(
            (p2: number) =>
              _tuple(
                map((n: Name) => n.name, names),
                p2,
              ),
            expectTok$(TGt as Tok, toks, p),
          ),
        listUntil(TGt as Tok, expectId, toks, pos + 1),
      )
    : typeParamsLoop(toks, pos, [] as string[]);
const parseTypeParams: _Curry<
  [toks: LocTok[], pos: number],
  Result<[string[], number], PErr>
> = _curry(2, parseTypeParams$);
const startsTypeSynonym: (t: Tok) => boolean = (t: Tok) => {
  const $match = t;
  switch ($match._tag) {
    case "TStr": {
      return true;
    }
    case "TLparen": {
      return true;
    }
    case "TLbracket": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const parseType$ = (toks: LocTok[], pos: number): Result<[Stmt, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  return _Result_flatMap(
    (p) =>
      _Result_flatMap(
        ([nm, p1]) =>
          _Result_flatMap(
            ([params, p2]) =>
              _Result_flatMap(
                (p3) =>
                  tokAt$(toks, p3).tok._tag === "TLbrace"
                    ? _Result_map(
                        ([alias, p4]: [AliasField[], number]) =>
                          _tuple(
                            Ast.SType(
                              nm.name,
                              nm.span,
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
                        parseAliasBody$(toks, p3),
                      )
                    : startsTypeSynonym(tokAt$(toks, p3).tok)
                      ? _Result_flatMap(
                          ([te, p4]) =>
                            Ok(
                              _tuple(
                                Ast.SType(
                                  nm.name,
                                  nm.span,
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
                          parseTypeExpr$(toks, p3),
                        )
                      : ((afterBar: number) =>
                          _Result_map(
                            ([ctors, p4]: [Ctor[], number]) =>
                              _tuple(
                                Ast.SType(
                                  nm.name,
                                  nm.span,
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
                            ctorsLoop$(toks, afterBar, [] as Ctor[]),
                          ))(tokAt$(toks, p3).tok._tag === "TBar" ? p3 + 1 : p3),
                expectTok$(TEq as Tok, toks, p2),
              ),
            parseTypeParams$(toks, p1),
          ),
        expectId$(toks, p),
      ),
    expectTok$(TType as Tok, toks, pos),
  );
};
const parseType: _Curry<[toks: LocTok[], pos: number], Result<[Stmt, number], PErr>> = _curry(
  2,
  parseType$,
);
const parseExtern$ = (toks: LocTok[], pos: number): Result<[Stmt, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  return _Result_flatMap(
    (p) =>
      tokAt$(toks, p).tok._tag === "TType"
        ? _Result_flatMap(
            (p1) =>
              _Result_flatMap(
                ([nm, p2]) =>
                  Ok(
                    _tuple(
                      Ast.SType(
                        nm.name,
                        nm.span,
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
                expectId$(toks, p1),
              ),
            expectTok$(TType as Tok, toks, p),
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
                                          or(eq(nextTok, TId("global")), eq(nextTok, TId("send"))),
                                          eq(nextTok, TId("get")),
                                        ),
                                        eq(nextTok, TId("set")),
                                      ),
                                      eq(nextTok, TId("new")),
                                    )
                                      ? isCurried
                                        ? errAt(
                                            "'curried' applies to a module extern, not a JS convention — give the host's module and export instead",
                                            tokAt$(toks, pConv),
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
                                                        ? expectStr$(toks, p7)
                                                        : (Ok(_tuple("", p7)) as Result<
                                                            [string, number],
                                                            PErr
                                                          >),
                                                    ))(
                                                    ((_v) =>
                                                      _v._tag === "TStr"
                                                        ? or(
                                                            convention.name === "global",
                                                            convention.name === "new",
                                                          )
                                                        : false)(tokAt$(toks, p7).tok),
                                                  ),
                                                expectStr$(toks, p6),
                                              ),
                                            expectId$(toks, pConv),
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
                                              expectStr$(toks, p6),
                                            ),
                                          expectStr$(toks, pConv),
                                        ))(tokAt$(toks, pConv).tok))(isCurried ? p5 + 1 : p5))(
                                eq(tokAt$(toks, p5).tok, TId("curried")),
                              ),
                            expectTok$(TEq as Tok, toks, p4),
                          ),
                        parseTypeExpr$(toks, p3),
                      ),
                    expectTok$(TColon as Tok, toks, p2),
                  ),
                tokAt$(toks, p1).tok._tag === "TLt"
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
                          expectTok$(TGt as Tok, toks, pParams),
                        ),
                      listUntil(TGt as Tok, expectId, toks, p1 + 1),
                    )
                  : (Ok(_tuple([] as string[], p1)) as Result<[string[], number], PErr>),
              ),
            expectId$(toks, p),
          ),
    expectTok$(TExtern as Tok, toks, pos),
  );
};
const parseExtern: _Curry<[toks: LocTok[], pos: number], Result<[Stmt, number], PErr>> = _curry(
  2,
  parseExtern$,
);
const parseImportNs: <B>(
  toks: LocTok[],
  start: { start: number } & B,
  pos: number,
) => Result<[Stmt, number], PErr> = _curry(
  3,
  <B>(toks: LocTok[], start: { start: number } & B, pos: number) =>
    _Result_flatMap(
      ([asKw, p1]) =>
        asKw.name === "as"
          ? _Result_flatMap(
              ([alias, p2]) =>
                _Result_flatMap(
                  ([kw, p3]) =>
                    kw.name === "from"
                      ? _Result_map(
                          ([path, p4]: [string, number]) =>
                            _tuple(Ast.SImportNs(alias, path, toEnd(start, toks, p4)), p4),
                          expectStr$(toks, p3),
                        )
                      : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt$(toks, p3)),
                  expectId$(toks, p2),
                ),
              expectId$(toks, p1),
            )
          : errAt(`expected 'as' in namespace import, got '${asKw.name}'`, tokAt$(toks, p1)),
      expectId$(toks, pos),
    ),
);
const parseImport$ = (toks: LocTok[], pos: number): Result<[Stmt, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  return _Result_flatMap(
    (p) =>
      tokAt$(toks, p).tok._tag === "TStar"
        ? _Result_flatMap((p1) => parseImportNs(toks, start, p1), expectTok$(TStar as Tok, toks, p))
        : _Result_flatMap(
            (p1) =>
              _Result_flatMap(
                ([names, p2]) =>
                  _Result_flatMap(
                    (p3) =>
                      _Result_flatMap(
                        ([kw, p4]) =>
                          kw.name === "from"
                            ? _Result_map(
                                ([path, p5]: [string, number]) =>
                                  _tuple(Ast.SImport(names, path, toEnd(start, toks, p5)), p5),
                                expectStr$(toks, p4),
                              )
                            : errAt(
                                `expected 'from' in import, got '${kw.name}'`,
                                tokAt$(toks, p4),
                              ),
                        expectId$(toks, p3),
                      ),
                    expectTok$(TRbrace as Tok, toks, p2),
                  ),
                listUntil(TRbrace as Tok, expectId, toks, p1),
              ),
            expectTok$(TLbrace as Tok, toks, p),
          ),
    expectTok$(TImport as Tok, toks, pos),
  );
};
const parseImport: _Curry<[toks: LocTok[], pos: number], Result<[Stmt, number], PErr>> = _curry(
  2,
  parseImport$,
);
const parseRecordDestructure: <B>(
  toks: LocTok[],
  start: { start: number } & B,
  pos: number,
  tmp: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Stmt[], number, number], PErr> = _curry(
  5,
  <B>(
    toks: LocTok[],
    start: { start: number } & B,
    pos: number,
    tmp: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const openSp: SpanAt = spanOf(tokAt$(toks, pos));
    return _Result_flatMap(
      (p) =>
        _Result_flatMap(
          ([fields, p1]) =>
            ((closeSp: SpanAt) =>
              _Result_flatMap(
                (p2) =>
                  _Result_flatMap(
                    (p3) =>
                      _Result_flatMap(
                        ([value, p4]) =>
                          ((whole: SpanAt) =>
                            ((patSpan: SpanAt) =>
                              ((tmpName: string) =>
                                ((header: Stmt) =>
                                  ((access: (a: Name) => Stmt) =>
                                    Ok(
                                      _tuple(
                                        _Array_prepend(header, map(access, fields)),
                                        p4,
                                        tmp + 1,
                                      ),
                                    ) as Result<[Stmt[], number, number], PErr>)((f) =>
                                    Ast.SLet(
                                      f.name,
                                      f.span,
                                      None as Option<TypeExpr>,
                                      Ast.EField(Ast.ERef(tmpName, f.span), f.name, false, f.span),
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
                            toEnd(start, toks, p4),
                          ),
                        parseExpr$(toks, p3, hooks),
                      ),
                    expectTok$(TEq as Tok, toks, p2),
                  ),
                expectTok$(TRbrace as Tok, toks, p1),
              ))(spanOf(tokAt$(toks, p1))),
          listUntil(TRbrace as Tok, expectId, toks, p),
        ),
      expectTok$(TLbrace as Tok, toks, pos),
    );
  },
);
const parseLet$ = (
  toks: LocTok[],
  pos: number,
  tmp: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Stmt[], number, number], PErr> => {
  const start: SpanAt = spanOf(tokAt$(toks, pos));
  return _Result_flatMap(
    (p) =>
      tokAt$(toks, p).tok._tag === "TLbrace"
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
                                  toEnd(start, toks, p3),
                                ),
                              ],
                              p3,
                              tmp,
                            ),
                          ) as Result<[Stmt[], number, number], PErr>,
                        parseExpr$(toks, p2, hooks),
                      ),
                    expectTok$(TEq as Tok, toks, pA),
                  ),
                tokAt$(toks, p1).tok._tag === "TColon"
                  ? _Result_map(
                      ([ty, p]: [TypeExpr, number]) => _tuple(Some(ty) as Option<TypeExpr>, p),
                      parseTypeExpr$(toks, p1 + 1),
                    )
                  : (Ok(_tuple(None as Option<TypeExpr>, p1)) as Result<
                      [Option<TypeExpr>, number],
                      PErr
                    >),
              ),
            expectId$(toks, p),
          ),
    expectTok$(TLet as Tok, toks, pos),
  );
};
const parseLet: _Curry<
  [
    toks: LocTok[],
    pos: number,
    tmp: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Stmt[], number, number], PErr>
> = _curry(4, parseLet$);
const setLetMeta$ = (exported: boolean, doc: Option<string>, s: Stmt): Stmt => {
  const $match = s;
  switch ($match._tag) {
    case "SLet": {
      const { name, nameSpan, annot, value, span } = $match;
      return Ast.SLet(name, nameSpan, annot, value, exported, doc, span);
    }
    default: {
      const other = $match;
      return other;
    }
  }
};
const setLetMeta: _Curry<[exported: boolean, doc: Option<string>, s: Stmt], Stmt> = _curry(
  3,
  setLetMeta$,
);
const setTypeMeta$ = (exported: boolean, doc: Option<string>, s: Stmt): Stmt => {
  const $match = s;
  switch ($match._tag) {
    case "SType": {
      const { name, nameSpan, params, ctors, alias, aliasType, span } = $match;
      return Ast.SType(name, nameSpan, params, ctors, alias, aliasType, exported, doc, span);
    }
    default: {
      const other = $match;
      return other;
    }
  }
};
const setTypeMeta: _Curry<[exported: boolean, doc: Option<string>, s: Stmt], Stmt> = _curry(
  3,
  setTypeMeta$,
);
const setExternMeta$ = (exported: boolean, doc: Option<string>, s: Stmt): Stmt => {
  const $match = s;
  switch ($match._tag) {
    case "SExtern": {
      const { name, nameSpan, params, typeExpr: t, module: m, imported: i, curried, span } = $match;
      return Ast.SExtern(name, nameSpan, params, t, m, i, curried, exported, doc, span);
    }
    case "SType": {
      const { name, nameSpan, params, ctors, alias, aliasType, span } = $match;
      return Ast.SType(name, nameSpan, params, ctors, alias, aliasType, exported, doc, span);
    }
    default: {
      const other = $match;
      return other;
    }
  }
};
const setExternMeta: _Curry<[exported: boolean, doc: Option<string>, s: Stmt], Stmt> = _curry(
  3,
  setExternMeta$,
);
const parseExprStmt: <B>(
  toks: LocTok[],
  pos: number,
  tmp: B,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
) => Result<[Stmt[], number, B], PErr> = _curry(
  4,
  <B>(
    toks: LocTok[],
    pos: number,
    tmp: B,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ) => {
    const start = tokAt$(toks, pos);
    return _Result_flatMap(
      ([value, p]) =>
        ((p2: number) => Ok(_tuple([Ast.SExpr(value, toEnd(spanOf(start), toks, p))], p2, tmp)))(
          tokAt$(toks, p).tok._tag === "TSemi" ? p + 1 : p,
        ),
      parseExpr$(toks, pos, hooks),
    );
  },
);
const parseStmt$ = (
  toks: LocTok[],
  pos: number,
  tmp: number,
  hooks: ((
    a: LocTok[],
    b: number,
    c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
  ) => Result<Option<[Expr, number]>, PErr>)[],
): Result<[Stmt[], number, number], PErr> => {
  const lt: LocTok = tokAt$(toks, pos);
  const doc: Option<string> = lt.doc;
  const $match = lt.tok;
  switch ($match._tag) {
    case "TImport": {
      return _Result_map(([s, p]: [Stmt, number]) => _tuple([s], p, tmp), parseImport$(toks, pos));
    }
    case "TExport": {
      const exportSp: SpanAt = spanOf(lt);
      const $match$ = tokAt$(toks, pos + 1).tok;
      switch ($match$._tag) {
        case "TType": {
          return _Result_map(
            ([s, p]: [Stmt, number]) =>
              _tuple([widenToExport(exportSp, setTypeMeta$(true, doc, s))], p, tmp),
            parseType$(toks, pos + 1),
          );
        }
        case "TExtern": {
          return _Result_map(
            ([s, p]: [Stmt, number]) =>
              _tuple([widenToExport(exportSp, setExternMeta$(true, doc, s))], p, tmp),
            parseExtern$(toks, pos + 1),
          );
        }
        case "TLet": {
          return _Result_map(
            ([stmts, p, tmp2]: [Stmt[], number, number]) =>
              _tuple(widenHeadToExport(exportSp, map(setLetMeta(true, doc), stmts)), p, tmp2),
            parseLet$(toks, pos + 1, tmp, hooks),
          );
        }
        default: {
          return errAt("`export` must precede let, type, or extern", tokAt$(toks, pos + 1));
        }
      }
    }
    case "TType": {
      return _Result_map(
        ([s, p]: [Stmt, number]) => _tuple([setTypeMeta$(false, doc, s)], p, tmp),
        parseType$(toks, pos),
      );
    }
    case "TExtern": {
      return _Result_map(
        ([s, p]: [Stmt, number]) => _tuple([setExternMeta$(false, doc, s)], p, tmp),
        parseExtern$(toks, pos),
      );
    }
    case "TLet": {
      return _Result_map(
        ([stmts, p, tmp2]: [Stmt[], number, number]) =>
          _tuple(map(setLetMeta(false, doc), stmts), p, tmp2),
        parseLet$(toks, pos, tmp, hooks),
      );
    }
    default: {
      return parseExprStmt(toks, pos, tmp, hooks);
    }
  }
};
const parseStmt: _Curry<
  [
    toks: LocTok[],
    pos: number,
    tmp: number,
    hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[],
  ],
  Result<[Stmt[], number, number], PErr>
> = _curry(4, parseStmt$);
/**
 * `export` precedes the statement it modifies, so the keyword is outside the
 * span the inner parser built. Grow the statement to cover it. Only the FIRST
 * statement of a group: `export let { x, y } = e` desugars to a header plus one
 * field-access `let` per name, and those keep their own field spans.
 */
const widenToExport: <A>(start: { start: number } & A, s: Stmt) => Stmt = _curry(
  2,
  <A>(start: { start: number } & A, s: Stmt) => {
    const $match = s;
    switch ($match._tag) {
      case "SLet": {
        const { name, nameSpan, annot, value, exported, doc, span } = $match;
        return Ast.SLet(name, nameSpan, annot, value, exported, doc, spanning(start, span));
      }
      case "SType": {
        const { name, nameSpan, params, ctors, alias, aliasType, exported, doc, span } = $match;
        return Ast.SType(
          name,
          nameSpan,
          params,
          ctors,
          alias,
          aliasType,
          exported,
          doc,
          spanning(start, span),
        );
      }
      case "SExtern": {
        const { name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span } =
          $match;
        return Ast.SExtern(
          name,
          nameSpan,
          params,
          typeExpr,
          module,
          imported,
          curried,
          exported,
          doc,
          spanning(start, span),
        );
      }
      default: {
        const other = $match;
        return other;
      }
    }
  },
);
const widenHeadToExport: <A>(start: { start: number } & A, stmts: Stmt[]) => Stmt[] = _curry(
  2,
  <A>(start: { start: number } & A, stmts: Stmt[]) =>
    ((_v) =>
      _v.length >= 1
        ? (([head, ...rest]) => _Array_prepend(widenToExport(start, head), rest))(_v)
        : stmts)(stmts),
);
/**
 * Core sync set for panic-mode recovery: the language's own declaration keywords.
 * TEof always terminates. Plugin recovery anchors retired in ADR 0130;
 * the shipped parser carries the core set only.
 */
const isSyncTok: (t: Tok) => boolean = (t: Tok) => {
  const $match = t;
  switch ($match._tag) {
    case "TLet": {
      return true;
    }
    case "TType": {
      return true;
    }
    case "TExtern": {
      return true;
    }
    case "TImport": {
      return true;
    }
    case "TExport": {
      return true;
    }
    default: {
      return false;
    }
  }
};
const isOpener: (t: Tok) => boolean = (t: Tok) =>
  or(or(t._tag === "TLparen", t._tag === "TLbrace"), t._tag === "TLbracket");
const isCloser: (t: Tok) => boolean = (t: Tok) =>
  or(or(t._tag === "TRparen", t._tag === "TRbrace"), t._tag === "TRbracket");
/**
 * Hard stop on pathological input, so one keystroke cannot publish a novel of
 * diagnostics (ADR 0045 decision 5).
 */
const maxParseErrors: number = 100;
const resumeAt$ = (toks: LocTok[], pos: number, at: number): number =>
  and(lt(pos + 1, length(toks)), lt(tokAt$(toks, pos).start, at))
    ? resumeAt$(toks, pos + 1, at)
    : pos;
/**
 * The first token at-or-after byte offset `at`, scanning forward from `pos`.
 * Recovering *by span* is what makes the rule mirrorable here: a `Result`
 * failure leaves no cursor behind, but the error record carries the offending
 * token's offsets, so TS and bootstrap resume on the same token.
 */
const resumeAt: _Curry<[toks: LocTok[], pos: number, at: number], number> = _curry(3, resumeAt$);
const skipToSync$ = (toks: LocTok[], pos: number, depth: number): number => {
  const t: Tok = tokAt$(toks, pos).tok;
  return or(t._tag === "TEof", and(depth === 0, isSyncTok(t)))
    ? pos
    : skipToSync$(
        toks,
        pos + 1,
        isOpener(t) ? depth + 1 : and(isCloser(t), depth > 0) ? depth - 1 : depth,
      );
};
/**
 * Panic-mode skip: stop at the first sync token whose bracket depth relative to
 * the resume point is 0 — never inside a half-open record, argument list or
 * `switch` block, where a `let` is a `let … in`.
 */
const skipToSync: _Curry<[toks: LocTok[], pos: number, depth: number], number> = _curry(
  3,
  skipToSync$,
);
/**
 * The skipped region as an `SError`, plus the position to resume parsing from.
 * Forward progress: when the offending token *is* the statement's own first
 * token there is nothing to rewind to, so consume one unconditionally.
 */
const recoverFrom: <B>(
  toks: LocTok[],
  before: number,
  failedAt: { start: number } & B,
  at: number,
) => { node: Stmt; pos: number } = _curry(
  4,
  <B>(toks: LocTok[], before: number, failedAt: { start: number } & B, at: number) => {
    const resume: number = resumeAt$(toks, before, at);
    const start: number = eq(resume, before) ? before + 1 : resume;
    const final: number = skipToSync$(toks, start, 0);
    return {
      node: Ast.SError({ start: failedAt.start, end: tokAt$(toks, final - 1).end }),
      pos: final,
    };
  },
);
const stmtsLoop$ = (
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
): { stmts: Stmt[]; diagnostics: PErr[] } => {
  let pos: number = pos0;
  let tmp: number = tmp0;
  let acc: Stmt[] = acc0;
  let diags: PErr[] = diags0;
  while (true) {
    if (tokAt$(toks, pos).tok._tag === "TEof") {
      return { stmts: acc, diagnostics: diags };
    } else {
      {
        const failedAt: LocTok = tokAt$(toks, pos);
        const _step = ((_v) =>
          _v._tag === "Ok"
            ? (({ value: [stmts, p, tmp2] }) =>
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
                  : _recur(p, tmp2, _Array_concat(acc, stmts), diags))(
                _v as Extract<Result<[Stmt[], number, number], PErr>, { _tag: "Ok" }>,
              )
            : _v._tag === "Err"
              ? (({ error: d }) =>
                  ((ds: PErr[]) =>
                    length(ds) >= maxParseErrors
                      ? _done({
                          stmts: _Array_append(
                            Ast.SError({
                              start: failedAt.start,
                              end: tokAt$(toks, length(toks) - 1).end,
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
                        ))(_Array_append(d, diags)))(_v)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(parseStmt$(toks, pos, tmp, hooks));
        if (_step._tag === "recur") {
          [pos, tmp, acc, diags] = _step.args;
          continue;
        }
        return _step.value;
      }
    }
  }
};
/**
 * The recovering statement loop: always yields statements (unparsable regions
 * become `SError`) plus every parse diagnostic in source order.
 */
const stmtsLoop: _Curry<
  [
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
  ],
  { stmts: Stmt[]; diagnostics: PErr[] }
> = _curry(6, stmtsLoop$);
/**
 * The recovering parse (ADR 0045). `parse` is the hard-fail wrapper over this;
 * tooling that wants the partial tree calls this and says so.
 */
export const parseRecovering: <A, B, C, D, E>(
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
            unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
          } & D,
        ) => Result<Option<[Ty, St]>, BoundErr>
      >;
      format: Option<B>;
      formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
      dtsBinding: Option<C>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & E,
        ) => Option<string>
      >;
    }[]
  >,
) => { stmts: Stmt[]; diagnostics: PErr[] } = _curry(
  2,
  <A, B, C, D, E>(
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
              unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
              inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
            } & D,
          ) => Result<Option<[Ty, St]>, BoundErr>
        >;
        format: Option<B>;
        formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
        dtsBinding: Option<C>;
        bindingType: Option<
          (
            a: Expr,
            b: Ty,
            c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & E,
          ) => Option<string>
        >;
      }[]
    >,
  ) => {
    const hooks: ((
      a: LocTok[],
      b: number,
      c: (a: LocTok[], b: number) => Result<[Expr, number], PErr>,
    ) => Result<Option<[Expr, number]>, PErr>)[] = parseHooksOf(resolvePluginsDefault(pluginsOpt));
    return stmtsLoop$(
      toks,
      ((_v) => (_v._tag === "TStr" ? (({ value }) => (value === "use open" ? 1 : 0))(_v) : 0))(
        tokAt$(toks, 0).tok,
      ),
      0,
      [] as Stmt[],
      [] as PErr[],
      hooks,
    );
  },
);
export const parse: (toks: LocTok[]) => Result<Stmt[], PErr> = (toks: LocTok[]) =>
  parseWith(toks, None);
/**
 * Hard-fail railway entry: the bootstrap railway carries one error record, so
 * this reports the first diagnostic in source order.
 * `pluginsOpt`: None = default builtins (JSX on); Some([]) = hard opt-out.
 */
export const parseWith: <A, B, C, D, E>(
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
            unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
            inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
          } & D,
        ) => Result<Option<[Ty, St]>, BoundErr>
      >;
      format: Option<B>;
      formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
      dtsBinding: Option<C>;
      bindingType: Option<
        (
          a: Expr,
          b: Ty,
          c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & E,
        ) => Option<string>
      >;
    }[]
  >,
) => Result<Stmt[], PErr> = _curry(
  2,
  <A, B, C, D, E>(
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
              unify: (a: Ty, b: Ty, c: St, d: SpanAt) => Result<St, BoundErr>;
              inferExpr: (a: Expr, b: St) => Result<[Ty, St], BoundErr>;
            } & D,
          ) => Result<Option<[Ty, St]>, BoundErr>
        >;
        format: Option<B>;
        formatDoc: Option<(a: Expr, b: FormatApi) => Option<Doc>>;
        dtsBinding: Option<C>;
        bindingType: Option<
          (
            a: Expr,
            b: Ty,
            c: { tsType: (a: Ty) => string; aliasOf: (a: Row) => Option<string> } & E,
          ) => Option<string>
        >;
      }[]
    >,
  ) => {
    const r: { stmts: Stmt[]; diagnostics: PErr[] } = parseRecovering(toks, pluginsOpt);
    return _Option_match(
      _Array_get(0, r.diagnostics),
      () => Ok(r.stmts) as Result<Stmt[], PErr>,
      (d) => Err(d) as Result<Stmt[], PErr>,
    );
  },
);
