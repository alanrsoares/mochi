/**
 * Shared with parser.mochi and plugins/jsx.mochi — one declaration, not
 * three structurally-equal ones.
 */
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
  | { _tag: "TTilde" }
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
export type Comment =
  | { _tag: "DocLine"; text: string; stop: number }
  | { _tag: "PlainOwn"; stop: number }
  | { _tag: "Trailing"; stop: number };
export type TPart = { _tag: "PLit"; value: string } | { _tag: "PHole"; start: number; end: number };
export type LocTok = { tok: Tok; start: number; end: number; doc: Option<string> };

import type { Option, Result, _Curry } from "@mochi/compiler/runtime";

import {
  Err,
  None,
  Ok,
  Some,
  _Array_append,
  _Array_concat,
  _Array_flatMap,
  _Array_get,
  _Array_head,
  _Array_tail,
  _Array_take,
  _Option_contains,
  _Option_exists,
  _Option_unwrapOr,
  _Str_codeAt,
  _Str_fromCode,
  _Str_get,
  _Str_join,
  _Str_length,
  _Str_slice,
  _Str_toNumber,
  _curry,
  _done,
  _recur,
  and,
  eq,
  length,
  lt,
  not,
  or,
} from "@mochi/compiler/runtime";

import { findHoleEnd, skipLineCommentTo, skipStringLiteral } from "./str-scan";
export const TLet: Tok = { _tag: "TLet" };
export const TType: Tok = { _tag: "TType" };
export const TExtern: Tok = { _tag: "TExtern" };
export const TSwitch: Tok = { _tag: "TSwitch" };
export const TLoop: Tok = { _tag: "TLoop" };
export const TRecur: Tok = { _tag: "TRecur" };
export const TDo: Tok = { _tag: "TDo" };
export const TImport: Tok = { _tag: "TImport" };
export const TExport: Tok = { _tag: "TExport" };
export const TEq: Tok = { _tag: "TEq" };
export const TArrow: Tok = { _tag: "TArrow" };
export const TTarrow: Tok = { _tag: "TTarrow" };
export const TPipe: Tok = { _tag: "TPipe" };
export const TCompose: Tok = { _tag: "TCompose" };
export const TConcat: Tok = { _tag: "TConcat" };
export const TBar: Tok = { _tag: "TBar" };
export const TLparen: Tok = { _tag: "TLparen" };
export const TRparen: Tok = { _tag: "TRparen" };
export const TLbrace: Tok = { _tag: "TLbrace" };
export const TRbrace: Tok = { _tag: "TRbrace" };
export const TLbracket: Tok = { _tag: "TLbracket" };
export const TRbracket: Tok = { _tag: "TRbracket" };
export const TSpread: Tok = { _tag: "TSpread" };
export const TPlus: Tok = { _tag: "TPlus" };
export const TMinus: Tok = { _tag: "TMinus" };
export const TStar: Tok = { _tag: "TStar" };
export const TSlash: Tok = { _tag: "TSlash" };
export const TPercent: Tok = { _tag: "TPercent" };
export const TAt: Tok = { _tag: "TAt" };
export const THash: Tok = { _tag: "THash" };
export const TTilde: Tok = { _tag: "TTilde" };
export const TDot: Tok = { _tag: "TDot" };
export const TColon: Tok = { _tag: "TColon" };
export const TQuestion: Tok = { _tag: "TQuestion" };
export const TEqeq: Tok = { _tag: "TEqeq" };
export const TNeq: Tok = { _tag: "TNeq" };
export const TLte: Tok = { _tag: "TLte" };
export const TGte: Tok = { _tag: "TGte" };
export const TLt: Tok = { _tag: "TLt" };
export const TGt: Tok = { _tag: "TGt" };
export const TAndand: Tok = { _tag: "TAndand" };
export const TOror: Tok = { _tag: "TOror" };
export const TBang: Tok = { _tag: "TBang" };
export const TBacktick: Tok = { _tag: "TBacktick" };
export const TComma: Tok = { _tag: "TComma" };
export const TSemi: Tok = { _tag: "TSemi" };
export const TNum = _curry(2, (value, raw) => ({ _tag: "TNum", value, raw })) as (
  value: number,
  raw: string,
) => Tok;
export const TBool = (value: boolean): Tok => ({ _tag: "TBool", value });
export const TStr = (value: string): Tok => ({ _tag: "TStr", value });
export const TTmplStart = (value: string): Tok => ({ _tag: "TTmplStart", value });
export const TTmplMid = (value: string): Tok => ({ _tag: "TTmplMid", value });
export const TTmplEnd = (value: string): Tok => ({ _tag: "TTmplEnd", value });
export const TId = (value: string): Tok => ({ _tag: "TId", value });
export const TEof: Tok = { _tag: "TEof" };
const DocLine = _curry(2, (text, stop) => ({ _tag: "DocLine", text, stop })) as (
  text: string,
  stop: number,
) => Comment;
const PlainOwn = (stop: number): Comment => ({ _tag: "PlainOwn", stop });
const Trailing = (stop: number): Comment => ({ _tag: "Trailing", stop });
const cr: string = _Str_fromCode(13);
const isSpace: (c: string) => boolean = (c: string) =>
  or(eq(c, " "), or(eq(c, "\t"), or(eq(c, "\n"), eq(c, cr))));
const inRange: _Curry<[lo: number, hi: number, n: number], boolean> = _curry(
  3,
  (lo: number, hi: number, n: number) => and(n >= lo, n <= hi),
);
const isDigit: (c: string) => boolean = (c: string) =>
  _Option_exists(inRange(48, 57), _Str_codeAt(0, c));
const isIdStart: (c: string) => boolean = (c: string) =>
  _Option_exists(
    (n: number) => or(inRange(65, 90, n), or(inRange(97, 122, n), or(eq(n, 95), eq(n, 36)))),
    _Str_codeAt(0, c),
  );
const isIdChar: (c: string) => boolean = (c: string) => or(isIdStart(c), isDigit(c));
const isNumChar: (c: string) => boolean = (c: string) => or(isDigit(c), eq(c, "."));
const keywordTok: (word: string) => Option<Tok> = (word: string) =>
  ((_v) =>
    _v === "let"
      ? (Some(TLet as Tok) as Option<Tok>)
      : _v === "type"
        ? (Some(TType as Tok) as Option<Tok>)
        : _v === "extern"
          ? (Some(TExtern as Tok) as Option<Tok>)
          : _v === "switch"
            ? (Some(TSwitch as Tok) as Option<Tok>)
            : _v === "loop"
              ? (Some(TLoop as Tok) as Option<Tok>)
              : _v === "recur"
                ? (Some(TRecur as Tok) as Option<Tok>)
                : _v === "do"
                  ? (Some(TDo as Tok) as Option<Tok>)
                  : _v === "import"
                    ? (Some(TImport as Tok) as Option<Tok>)
                    : _v === "export"
                      ? (Some(TExport as Tok) as Option<Tok>)
                      : _v === "true"
                        ? (Some(TBool(true)) as Option<Tok>)
                        : _v === "false"
                          ? (Some(TBool(false)) as Option<Tok>)
                          : (None as Option<Tok>))(word);
const identTok: (word: string) => Tok = (word: string) =>
  _Option_unwrapOr(TId(word), keywordTok(word));
const digraphTok: (two: string) => Option<Tok> = (two: string) =>
  ((_v) =>
    _v === "|>"
      ? (Some(TPipe as Tok) as Option<Tok>)
      : _v === ">>"
        ? (Some(TCompose as Tok) as Option<Tok>)
        : _v === "++"
          ? (Some(TConcat as Tok) as Option<Tok>)
          : _v === "=="
            ? (Some(TEqeq as Tok) as Option<Tok>)
            : _v === "!="
              ? (Some(TNeq as Tok) as Option<Tok>)
              : _v === "<="
                ? (Some(TLte as Tok) as Option<Tok>)
                : _v === ">="
                  ? (Some(TGte as Tok) as Option<Tok>)
                  : _v === "&&"
                    ? (Some(TAndand as Tok) as Option<Tok>)
                    : _v === "||"
                      ? (Some(TOror as Tok) as Option<Tok>)
                      : _v === "=>"
                        ? (Some(TArrow as Tok) as Option<Tok>)
                        : _v === "->"
                          ? (Some(TTarrow as Tok) as Option<Tok>)
                          : (None as Option<Tok>))(two);
const punctTok: (c: string) => Option<Tok> = (c: string) =>
  ((_v) =>
    _v === "|"
      ? (Some(TBar as Tok) as Option<Tok>)
      : _v === "="
        ? (Some(TEq as Tok) as Option<Tok>)
        : _v === "("
          ? (Some(TLparen as Tok) as Option<Tok>)
          : _v === ")"
            ? (Some(TRparen as Tok) as Option<Tok>)
            : _v === "{"
              ? (Some(TLbrace as Tok) as Option<Tok>)
              : _v === "}"
                ? (Some(TRbrace as Tok) as Option<Tok>)
                : _v === "["
                  ? (Some(TLbracket as Tok) as Option<Tok>)
                  : _v === "]"
                    ? (Some(TRbracket as Tok) as Option<Tok>)
                    : _v === ","
                      ? (Some(TComma as Tok) as Option<Tok>)
                      : _v === ";"
                        ? (Some(TSemi as Tok) as Option<Tok>)
                        : _v === "."
                          ? (Some(TDot as Tok) as Option<Tok>)
                          : _v === ":"
                            ? (Some(TColon as Tok) as Option<Tok>)
                            : _v === "?"
                              ? (Some(TQuestion as Tok) as Option<Tok>)
                              : _v === "@"
                                ? (Some(TAt as Tok) as Option<Tok>)
                                : _v === "#"
                                  ? (Some(THash as Tok) as Option<Tok>)
                                  : _v === "~"
                                    ? (Some(TTilde as Tok) as Option<Tok>)
                                    : _v === "+"
                                      ? (Some(TPlus as Tok) as Option<Tok>)
                                      : _v === "-"
                                        ? (Some(TMinus as Tok) as Option<Tok>)
                                        : _v === "*"
                                          ? (Some(TStar as Tok) as Option<Tok>)
                                          : _v === "/"
                                            ? (Some(TSlash as Tok) as Option<Tok>)
                                            : _v === "%"
                                              ? (Some(TPercent as Tok) as Option<Tok>)
                                              : _v === "!"
                                                ? (Some(TBang as Tok) as Option<Tok>)
                                                : _v === "`"
                                                  ? (Some(TBacktick as Tok) as Option<Tok>)
                                                  : _v === "<"
                                                    ? (Some(TLt as Tok) as Option<Tok>)
                                                    : _v === ">"
                                                      ? (Some(TGt as Tok) as Option<Tok>)
                                                      : (None as Option<Tok>))(c);
const scanWhile: _Curry<[pred: (a: string) => boolean, src: string, j: number], number> = _curry(
  3,
  (pred: (a: string) => boolean, src: string, j: number) =>
    ((_v) =>
      _v._tag === "Some" && (({ value: c }) => pred(c))(_v)
        ? (({ value: c }) => scanWhile(pred, src, j + 1))(_v)
        : j)(_Str_get(j, src)),
);
const escChar: (n: string) => string = (n: string) =>
  ((_v) => (_v === "n" ? "\n" : _v === "t" ? "\t" : ((c) => c)(_v)))(n);
const PLit = (value: string): TPart => ({ _tag: "PLit", value });
const PHole = _curry(2, (start, end) => ({ _tag: "PHole", start, end })) as (
  start: number,
  end: number,
) => TPart;
const literalTok: _Curry<[idx: number, total: number, value: string], Tok> = _curry(
  3,
  (idx: number, total: number, value: string) =>
    eq(total, 1)
      ? TStr(value)
      : eq(idx, 0)
        ? TTmplStart(value)
        : eq(idx, total - 1)
          ? TTmplEnd(value)
          : TTmplMid(value),
);
const scanTemplateLoop: _Curry<
  [src: string, j0: number, value0: string, parts0: TPart[]],
  Option<{ parts: TPart[]; end: number }>
> = _curry(4, (src: string, j0: number, value0: string, parts0: TPart[]) => {
  let j: number = j0;
  let value: string = value0;
  let parts: TPart[] = parts0;
  while (true) {
    const _step = ((_v) =>
      _v._tag === "None"
        ? _done(None as Option<{ parts: TPart[]; end: number }>)
        : _v._tag === "Some" && _v.value === '"'
          ? _done(
              Some({ parts: _Array_append(PLit(value), parts), end: j + 1 }) as Option<{
                parts: TPart[];
                end: number;
              }>,
            )
          : _v._tag === "Some" && _v.value === "\\"
            ? ((_v) =>
                _v._tag === "Some"
                  ? (({ value: n }) => _recur(j + 2, `${value}${escChar(n)}`, parts))(_v)
                  : _v._tag === "None"
                    ? _recur(j + 1, `${value}\\`, parts)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(_Str_get(j + 1, src))
            : _v._tag === "Some" && _v.value === "$" && _Option_contains("{", _Str_get(j + 1, src))
              ? ((_v) =>
                  _v._tag === "None"
                    ? _done(None as Option<{ parts: TPart[]; end: number }>)
                    : _v._tag === "Some"
                      ? (({ value: holeEnd }) =>
                          ((withLit: TPart[]) =>
                            ((withHole: TPart[]) => _recur(holeEnd, "", withHole))(
                              _Array_append(PHole(j + 2, holeEnd - 1), withLit),
                            ))(_Array_append(PLit(value), parts)))(_v)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(findHoleEnd(src, j + 2))
              : _v._tag === "Some"
                ? (({ value: c }) => _recur(j + 1, `${value}${c}`, parts))(_v)
                : (() => {
                    throw new Error("non-exhaustive match");
                  })())(_Str_get(j, src));
    if (_step._tag === "recur") {
      [j, value, parts] = _step.args;
      continue;
    }
    return _step.value;
  }
});
const scanTemplate: _Curry<
  [src: string, i: number],
  Option<{ parts: TPart[]; end: number }>
> = _curry(2, (src: string, i: number) => scanTemplateLoop(src, i + 1, "", [] as TPart[]));
const notNewline: (c: string) => boolean = (c: string) => not(eq(c, "\n"));
const scanComment: _Curry<[src: string, start: number, lineTok: boolean], Comment> = _curry(
  3,
  (src: string, start: number, lineTok: boolean) => {
    const stop: number = scanWhile(notNewline, src, start);
    return lineTok
      ? Trailing(stop)
      : _Option_contains("/", _Str_get(start + 2, src))
        ? ((textStart: number) => DocLine(_Str_slice(textStart, stop, src), stop))(
            _Option_contains(" ", _Str_get(start + 3, src)) ? start + 4 : start + 3,
          )
        : PlainOwn(stop);
  },
);
const mkTok: _Curry<[tok: Tok, start: number, stop: number, doc: string[]], LocTok> = _curry(
  4,
  (tok: Tok, start: number, stop: number, doc: string[]) =>
    ((_v) =>
      _v.length === 0
        ? { tok: tok, start: start, end: stop, doc: None as Option<string> }
        : ((lines) => ({
            tok: tok,
            start: start,
            end: stop,
            doc: Some(_Str_join("\n", lines)) as Option<string>,
          }))(_v))(doc),
);

const pushRun: _Curry<[run: LocTok[], buf: LocTok[][]], LocTok[][]> = _curry(
  2,
  (run: LocTok[], buf: LocTok[][]) => {
    const n: number = length(buf);
    return ((_v) =>
      _v._tag === "Some" && (({ value: top }) => length(top) <= length(run))(_v)
        ? (({ value: top }) => pushRun(_Array_concat(top, run), _Array_take(n - 1, buf)))(_v)
        : _Array_append(run, buf))(_Array_get(n - 1, buf));
  },
);
const pushTok: _Curry<[t: LocTok, buf: LocTok[][]], LocTok[][]> = _curry(
  2,
  (t: LocTok, buf: LocTok[][]) => pushRun([t], buf),
);
const bufToks: (buf: LocTok[][]) => LocTok[] = (buf: LocTok[][]) =>
  _Array_flatMap((run: LocTok[]) => run, buf);
const lexError: <A, B, C, D>(
  message: A,
  start: B,
  stop: C,
) => Result<D, { message: A; start: B; end: C }> = _curry(
  3,
  <A, B, C, D>(message: A, start: B, stop: C) => Err({ message: message, start: start, end: stop }),
);
const numValue: (raw: string) => number = (raw: string) =>
  _Option_unwrapOr(0 / 0, _Str_toNumber(raw));
const numStart: _Curry<[src: string, i: number, c: string], boolean> = _curry(
  3,
  (src: string, i: number, c: string) =>
    or(isDigit(c), and(eq(c, "-"), _Option_exists(isDigit, _Str_get(i + 1, src)))),
);
const offsetLocTok: <C>(
  lt: { doc: Option<string>; end: number; start: number; tok: Tok } & C,
  by: number,
) => LocTok = _curry(
  2,
  <C>(lt: { doc: Option<string>; end: number; start: number; tok: Tok } & C, by: number) => ({
    tok: lt.tok,
    start: lt.start + by,
    end: lt.end + by,
    doc: lt.doc,
  }),
);
const spliceHoleToks: <A>(
  holeToks: ({ tok: Tok; doc: Option<string>; end: number; start: number } & A)[],
  by: number,
  toks: LocTok[][],
) => LocTok[][] = _curry(
  3,
  <A>(
    holeToks: ({ tok: Tok; doc: Option<string>; end: number; start: number } & A)[],
    by: number,
    toks: LocTok[][],
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? toks
        : _v._tag === "Some"
          ? (({ value: ht }) =>
              ((toks2: LocTok[][]) => spliceHoleToks(_Array_tail(holeToks), by, toks2))(
                eq(ht.tok, TEof as Tok) ? toks : pushTok(offsetLocTok(ht, by), toks),
              ))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_head(holeToks)),
);
const spliceHole: _Curry<
  [src: string, start: number, stop: number, toks: LocTok[][]],
  Result<LocTok[][], { message: string; start: number; end: number }>
> = _curry(4, (src: string, start: number, stop: number, toks: LocTok[][]) =>
  ((_v) =>
    _v._tag === "Ok"
      ? (({ value: holeToks }) =>
          Ok(spliceHoleToks(holeToks, start, toks)) as Result<
            LocTok[][],
            { message: string; start: number; end: number }
          >)(_v)
      : _v._tag === "Err"
        ? (({ error: e }) =>
            Err({ message: e.message, start: e.start + start, end: e.end + start }) as Result<
              LocTok[][],
              { message: string; start: number; end: number }
            >)(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(lex(_Str_slice(start, stop, src))),
);
const lexParts: _Curry<
  [
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: LocTok[][],
  ],
  Result<LocTok[][], { end: number; start: number; message: string }>
> = _curry(
  8,
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: LocTok[][],
  ) =>
    ((_v) =>
      _v._tag === "None"
        ? (Ok(toks) as Result<LocTok[][], { end: number; start: number; message: string }>)
        : _v._tag === "Some"
          ? (({ value: part }) =>
              ((_v) =>
                _v._tag === "PLit"
                  ? (({ value }) =>
                      ((t: LocTok) =>
                        lexParts(
                          src,
                          _Array_tail(parts),
                          idx + 1,
                          total,
                          wholeStart,
                          wholeEnd,
                          [] as string[],
                          pushTok(t, toks),
                        ))(mkTok(literalTok(idx, total, value), wholeStart, wholeEnd, doc)))(_v)
                  : _v._tag === "PHole"
                    ? (({ start: hs, end: he }) =>
                        ((_v) =>
                          _v._tag === "Err"
                            ? (({ error: e }) =>
                                Err(e) as Result<
                                  LocTok[][],
                                  { message: string; start: number; end: number }
                                >)(_v)
                            : _v._tag === "Ok"
                              ? (({ value: toks2 }) =>
                                  lexParts(
                                    src,
                                    _Array_tail(parts),
                                    idx + 1,
                                    total,
                                    wholeStart,
                                    wholeEnd,
                                    doc,
                                    toks2,
                                  ))(_v)
                              : (() => {
                                  throw new Error("non-exhaustive match");
                                })())(spliceHole(src, hs, he, toks)))(_v)
                    : (() => {
                        throw new Error("non-exhaustive match");
                      })())(part))(_v)
          : (() => {
              throw new Error("non-exhaustive match");
            })())(_Array_head(parts)),
);
const emit: _Curry<
  [src: string, tok: Tok, start: number, stop: number, doc: string[], toks: LocTok[][]],
  Result<LocTok[], { end: number; start: number; message: string }>
> = _curry(
  6,
  (src: string, tok: Tok, start: number, stop: number, doc: string[], toks: LocTok[][]) =>
    go(src, stop, [] as string[], 0, true, pushTok(mkTok(tok, start, stop, doc), toks)),
);
const lexString: _Curry<
  [src: string, i: number, doc: string[], toks: LocTok[][]],
  Result<LocTok[], { message: string; start: number; end: number }>
> = _curry(4, (src: string, i: number, doc: string[], toks: LocTok[][]) =>
  ((_v) =>
    _v._tag === "None"
      ? lexError("unterminated string literal", i, _Str_length(src))
      : _v._tag === "Some"
        ? (({ value: scanned }) =>
            ((_v) =>
              _v._tag === "Err"
                ? (({ error: e }) =>
                    Err(e) as Result<LocTok[], { end: number; start: number; message: string }>)(_v)
                : _v._tag === "Ok"
                  ? (({ value: toks2 }) => go(src, scanned.end, [] as string[], 0, true, toks2))(_v)
                  : (() => {
                      throw new Error("non-exhaustive match");
                    })())(
              lexParts(src, scanned.parts, 0, length(scanned.parts), i, scanned.end, doc, toks),
            ))(_v)
        : (() => {
            throw new Error("non-exhaustive match");
          })())(scanTemplate(src, i)),
);
const go: _Curry<
  [src: string, i: number, doc: string[], nlRun: number, lineTok: boolean, toks: LocTok[][]],
  Result<LocTok[], { end: number; start: number; message: string }>
> = _curry(
  6,
  (src: string, i: number, doc: string[], nlRun: number, lineTok: boolean, toks: LocTok[][]) =>
    ((_v) =>
      _v._tag === "None"
        ? (Ok(bufToks(pushTok(mkTok(TEof as Tok, i, i, doc), toks))) as Result<
            LocTok[],
            { end: number; start: number; message: string }
          >)
        : _v._tag === "Some" && (({ value: c }) => isSpace(c))(_v)
          ? (({ value: c }) =>
              eq(c, "\n")
                ? ((n: number) =>
                    ((kept: string[]) => go(src, i + 1, kept, n, false, toks))(
                      n < 2 ? doc : ([] as string[]),
                    ))(nlRun + 1)
                : go(src, i + 1, doc, nlRun, lineTok, toks))(_v)
          : _v._tag === "Some" && _v.value === "/" && _Option_contains("/", _Str_get(i + 1, src))
            ? ((_v) =>
                _v._tag === "Trailing"
                  ? (({ stop }) => go(src, stop, doc, nlRun, lineTok, toks))(_v)
                  : _v._tag === "PlainOwn"
                    ? (({ stop }) => go(src, stop, [] as string[], 0, lineTok, toks))(_v)
                    : _v._tag === "DocLine"
                      ? (({ text, stop }) =>
                          go(src, stop, _Array_append(text, doc), 0, lineTok, toks))(_v)
                      : (() => {
                          throw new Error("non-exhaustive match");
                        })())(scanComment(src, i, lineTok))
            : _v._tag === "Some"
              ? (({ value: c }) =>
                  eq(_Str_slice(i, i + 3, src), "...")
                    ? emit(src, TSpread as Tok, i, i + 3, doc, toks)
                    : ((_v) =>
                        _v._tag === "Some"
                          ? (({ value: t }) => emit(src, t, i, i + 2, doc, toks))(_v)
                          : _v._tag === "None"
                            ? eq(c, '"')
                              ? lexString(src, i, doc, toks)
                              : numStart(src, i, c)
                                ? ((j: number) =>
                                    ((raw: string) =>
                                      emit(src, TNum(numValue(raw), raw), i, j, doc, toks))(
                                      _Str_slice(i, j, src),
                                    ))(scanWhile(isNumChar, src, i + 1))
                                : ((_v) =>
                                    _v._tag === "Some"
                                      ? (({ value: t }) => emit(src, t, i, i + 1, doc, toks))(_v)
                                      : _v._tag === "None"
                                        ? isIdStart(c)
                                          ? ((j: number) =>
                                              emit(
                                                src,
                                                identTok(_Str_slice(i, j, src)),
                                                i,
                                                j,
                                                doc,
                                                toks,
                                              ))(scanWhile(isIdChar, src, i + 1))
                                          : lexError(`unexpected char '${c}'`, i, i + 1)
                                        : (() => {
                                            throw new Error("non-exhaustive match");
                                          })())(punctTok(c))
                            : (() => {
                                throw new Error("non-exhaustive match");
                              })())(digraphTok(_Str_slice(i, i + 2, src))))(_v)
              : (() => {
                  throw new Error("non-exhaustive match");
                })())(_Str_get(i, src)),
);
export const lex: (
  src: string,
) => Result<LocTok[], { end: number; start: number; message: string }> = (src: string) =>
  go(src, 0, [] as string[], 0, false, [] as LocTok[][]);
