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
export type Comment =
  | { _tag: "DocLine"; text: string; stop: number }
  | { _tag: "PlainOwn"; stop: number }
  | { _tag: "Trailing"; stop: number };
export type TPart = { _tag: "PLit"; value: string } | { _tag: "PHole"; start: number; end: number };

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
  div,
  eq,
  lt,
  gte,
  lte,
  not,
  and,
  or,
  length,
  _Option_exists,
  _Option_contains,
  _Option_unwrapOr,
  _Array_head,
  _Array_append,
  _Array_tail,
  _Str_length,
  _Str_join,
  _Str_slice,
  _Str_get,
  _Str_codeAt,
  _Str_fromCode,
  _Str_toNumber,
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
const TExport: Tok = { _tag: "TExport" };
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
const TEqeq: Tok = { _tag: "TEqeq" };
const TNeq: Tok = { _tag: "TNeq" };
const TLte: Tok = { _tag: "TLte" };
const TGte: Tok = { _tag: "TGte" };
const TLt: Tok = { _tag: "TLt" };
const TGt: Tok = { _tag: "TGt" };
const TAndand: Tok = { _tag: "TAndand" };
const TOror: Tok = { _tag: "TOror" };
const TBang: Tok = { _tag: "TBang" };
const TBacktick: Tok = { _tag: "TBacktick" };
const TComma: Tok = { _tag: "TComma" };
const TSemi: Tok = { _tag: "TSemi" };
const TNum = _curry(2, (value, raw) => ({ _tag: "TNum", value, raw })) as (
  value: number,
  raw: string,
) => Tok;
const TBool = (value: boolean): Tok => ({ _tag: "TBool", value });
const TStr = (value: string): Tok => ({ _tag: "TStr", value });
const TTmplStart = (value: string): Tok => ({ _tag: "TTmplStart", value });
const TTmplMid = (value: string): Tok => ({ _tag: "TTmplMid", value });
const TTmplEnd = (value: string): Tok => ({ _tag: "TTmplEnd", value });
const TId = (value: string): Tok => ({ _tag: "TId", value });
const TEof: Tok = { _tag: "TEof" };
const DocLine = _curry(2, (text, stop) => ({ _tag: "DocLine", text, stop })) as (
  text: string,
  stop: number,
) => Comment;
const PlainOwn = (stop: number): Comment => ({ _tag: "PlainOwn", stop });
const Trailing = (stop: number): Comment => ({ _tag: "Trailing", stop });
const cr: string = _Str_fromCode(13);
const isSpace: (c: string) => boolean = (c: string) =>
  or(eq(c, " "), or(eq(c, "\t"), or(eq(c, "\n"), eq(c, cr))));
const inRange: {
  (lo: number): (hi: number) => (n: number) => boolean;
  (lo: number): (hi: number, n: number) => boolean;
  (lo: number, hi: number): (n: number) => boolean;
  (lo: number, hi: number, n: number): boolean;
} = _curry(3, (lo: number, hi: number, n: number) => and(gte(n, lo), lte(n, hi)));
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
  match(word)
    .with("let", () => Some(TLet as Tok) as Option<Tok>)
    .with("type", () => Some(TType as Tok) as Option<Tok>)
    .with("extern", () => Some(TExtern as Tok) as Option<Tok>)
    .with("switch", () => Some(TSwitch as Tok) as Option<Tok>)
    .with("loop", () => Some(TLoop as Tok) as Option<Tok>)
    .with("recur", () => Some(TRecur as Tok) as Option<Tok>)
    .with("do", () => Some(TDo as Tok) as Option<Tok>)
    .with("import", () => Some(TImport as Tok) as Option<Tok>)
    .with("export", () => Some(TExport as Tok) as Option<Tok>)
    .with("true", () => Some(TBool(true)) as Option<Tok>)
    .with("false", () => Some(TBool(false)) as Option<Tok>)
    .otherwise(() => None as Option<Tok>);
const identTok: (word: string) => Tok = (word: string) =>
  _Option_unwrapOr(TId(word), keywordTok(word));
const digraphTok: (two: string) => Option<Tok> = (two: string) =>
  match(two)
    .with("|>", () => Some(TPipe as Tok) as Option<Tok>)
    .with(">>", () => Some(TCompose as Tok) as Option<Tok>)
    .with("++", () => Some(TConcat as Tok) as Option<Tok>)
    .with("==", () => Some(TEqeq as Tok) as Option<Tok>)
    .with("!=", () => Some(TNeq as Tok) as Option<Tok>)
    .with("<=", () => Some(TLte as Tok) as Option<Tok>)
    .with(">=", () => Some(TGte as Tok) as Option<Tok>)
    .with("&&", () => Some(TAndand as Tok) as Option<Tok>)
    .with("||", () => Some(TOror as Tok) as Option<Tok>)
    .with("=>", () => Some(TArrow as Tok) as Option<Tok>)
    .with("->", () => Some(TTarrow as Tok) as Option<Tok>)
    .otherwise(() => None as Option<Tok>);
const punctTok: (c: string) => Option<Tok> = (c: string) =>
  match(c)
    .with("|", () => Some(TBar as Tok) as Option<Tok>)
    .with("=", () => Some(TEq as Tok) as Option<Tok>)
    .with("(", () => Some(TLparen as Tok) as Option<Tok>)
    .with(")", () => Some(TRparen as Tok) as Option<Tok>)
    .with("{", () => Some(TLbrace as Tok) as Option<Tok>)
    .with("}", () => Some(TRbrace as Tok) as Option<Tok>)
    .with("[", () => Some(TLbracket as Tok) as Option<Tok>)
    .with("]", () => Some(TRbracket as Tok) as Option<Tok>)
    .with(",", () => Some(TComma as Tok) as Option<Tok>)
    .with(";", () => Some(TSemi as Tok) as Option<Tok>)
    .with(".", () => Some(TDot as Tok) as Option<Tok>)
    .with(":", () => Some(TColon as Tok) as Option<Tok>)
    .with("?", () => Some(TQuestion as Tok) as Option<Tok>)
    .with("@", () => Some(TAt as Tok) as Option<Tok>)
    .with("#", () => Some(THash as Tok) as Option<Tok>)
    .with("+", () => Some(TPlus as Tok) as Option<Tok>)
    .with("-", () => Some(TMinus as Tok) as Option<Tok>)
    .with("*", () => Some(TStar as Tok) as Option<Tok>)
    .with("/", () => Some(TSlash as Tok) as Option<Tok>)
    .with("%", () => Some(TPercent as Tok) as Option<Tok>)
    .with("!", () => Some(TBang as Tok) as Option<Tok>)
    .with("`", () => Some(TBacktick as Tok) as Option<Tok>)
    .with("<", () => Some(TLt as Tok) as Option<Tok>)
    .with(">", () => Some(TGt as Tok) as Option<Tok>)
    .otherwise(() => None as Option<Tok>);
const scanWhile: {
  (pred: (a: string) => boolean): (src: string) => (j: number) => number;
  (pred: (a: string) => boolean): (src: string, j: number) => number;
  (pred: (a: string) => boolean, src: string): (j: number) => number;
  (pred: (a: string) => boolean, src: string, j: number): number;
} = _curry(3, (pred: (a: string) => boolean, src: string, j: number) =>
  match(_Str_get(j, src))
    .with(
      (_v): _v is Extract<Option<string>, { _tag: "Some" }> => {
        const _g: any = _v;
        return _g._tag === "Some" && (({ value: c }) => pred(c))(_g);
      },
      ({ value: c }) => scanWhile(pred, src, add(j, 1)),
    )
    .otherwise(() => j),
);
const escChar: (n: string) => string = (n: string) =>
  match(n)
    .with("n", () => "\n")
    .with("t", () => "\t")
    .otherwise((c) => c);
const PLit = (value: string): TPart => ({ _tag: "PLit", value });
const PHole = _curry(2, (start, end) => ({ _tag: "PHole", start, end })) as (
  start: number,
  end: number,
) => TPart;
const skipStrLoop: {
  (src: string): (j0: number) => Option<number>;
  (src: string, j0: number): Option<number>;
} = _curry(2, (src: string, j0: number) => {
  let j: number = j0;
  while (true) {
    const _step = match(_Str_get(j, src))
      .with({ _tag: "None" }, () => _done(None as Option<number>))
      .with({ _tag: "Some", value: '"' }, () => _done(Some(add(j, 1)) as Option<number>))
      .with({ _tag: "Some", value: "\\" }, () =>
        match(_Str_get(add(j, 1), src))
          .with({ _tag: "Some" }, () => _recur(add(j, 2)))
          .with({ _tag: "None" }, () => _recur(add(j, 1)))
          .exhaustive(),
      )
      .with(
        (_v): _v is Extract<Option<string>, { _tag: "Some" }> => {
          const _g: any = _v;
          return (
            _g._tag === "Some" &&
            _g.value === "$" &&
            _Option_contains("{", _Str_get(add(j, 1), src))
          );
        },
        () =>
          match(findHoleEnd(src, add(j, 2)))
            .with({ _tag: "Some" }, ({ value: hEnd }) => _recur(hEnd))
            .with({ _tag: "None" }, () => _done(None as Option<number>))
            .exhaustive(),
      )
      .with({ _tag: "Some" }, () => _recur(add(j, 1)))
      .exhaustive();
    if (_step._tag === "recur") {
      j = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
const skipStringLiteral: {
  (src: string): (i: number) => Option<number>;
  (src: string, i: number): Option<number>;
} = _curry(2, (src: string, i: number) => skipStrLoop(src, add(i, 1)));
const skipLineCommentTo: {
  (src: string): (j: number) => number;
  (src: string, j: number): number;
} = _curry(2, (src: string, j: number) =>
  match(_Str_get(j, src))
    .with({ _tag: "None" }, () => j)
    .with({ _tag: "Some", value: "\n" }, () => j)
    .with({ _tag: "Some" }, () => skipLineCommentTo(src, add(j, 1)))
    .exhaustive(),
);
const findHoleLoop: {
  (src: string): (j0: number) => (depth0: number) => Option<number>;
  (src: string): (j0: number, depth0: number) => Option<number>;
  (src: string, j0: number): (depth0: number) => Option<number>;
  (src: string, j0: number, depth0: number): Option<number>;
} = _curry(3, (src: string, j0: number, depth0: number) => {
  let j: number = j0;
  let depth: number = depth0;
  while (true) {
    const _step = match(_Str_get(j, src))
      .with({ _tag: "None" }, () => _done(None as Option<number>))
      .with({ _tag: "Some", value: '"' }, () =>
        match(skipStringLiteral(src, j))
          .with({ _tag: "Some" }, ({ value: stop }) => _recur(stop, depth))
          .with({ _tag: "None" }, () => _done(None as Option<number>))
          .exhaustive(),
      )
      .with(
        (_v): _v is Extract<Option<string>, { _tag: "Some" }> => {
          const _g: any = _v;
          return (
            _g._tag === "Some" &&
            _g.value === "/" &&
            _Option_contains("/", _Str_get(add(j, 1), src))
          );
        },
        () => _recur(skipLineCommentTo(src, j), depth),
      )
      .with({ _tag: "Some", value: "{" }, () => _recur(add(j, 1), add(depth, 1)))
      .with({ _tag: "Some", value: "}" }, () =>
        eq(depth, 1) ? _done(Some(add(j, 1)) as Option<number>) : _recur(add(j, 1), sub(depth, 1)),
      )
      .with({ _tag: "Some" }, () => _recur(add(j, 1), depth))
      .exhaustive();
    if (_step._tag === "recur") {
      [j, depth] = _step.args;
      continue;
    }
    return _step.value;
  }
});
const findHoleEnd: {
  (src: string): (start: number) => Option<number>;
  (src: string, start: number): Option<number>;
} = _curry(2, (src: string, start: number) => findHoleLoop(src, start, 1));
const literalTok: {
  (idx: number): (total: number) => (value: string) => Tok;
  (idx: number): (total: number, value: string) => Tok;
  (idx: number, total: number): (value: string) => Tok;
  (idx: number, total: number, value: string): Tok;
} = _curry(3, (idx: number, total: number, value: string) =>
  eq(total, 1)
    ? TStr(value)
    : eq(idx, 0)
      ? TTmplStart(value)
      : eq(idx, sub(total, 1))
        ? TTmplEnd(value)
        : TTmplMid(value),
);
const scanTemplateLoop: {
  (
    src: string,
  ): (
    j0: number,
  ) => (value0: string) => (parts0: TPart[]) => Option<{ parts: TPart[]; end: number }>;
  (
    src: string,
  ): (j0: number) => (value0: string, parts0: TPart[]) => Option<{ parts: TPart[]; end: number }>;
  (
    src: string,
  ): (j0: number, value0: string) => (parts0: TPart[]) => Option<{ parts: TPart[]; end: number }>;
  (
    src: string,
    j0: number,
  ): (value0: string) => (parts0: TPart[]) => Option<{ parts: TPart[]; end: number }>;
  (
    src: string,
  ): (j0: number, value0: string, parts0: TPart[]) => Option<{ parts: TPart[]; end: number }>;
  (
    src: string,
    j0: number,
  ): (value0: string, parts0: TPart[]) => Option<{ parts: TPart[]; end: number }>;
  (
    src: string,
    j0: number,
    value0: string,
  ): (parts0: TPart[]) => Option<{ parts: TPart[]; end: number }>;
  (
    src: string,
    j0: number,
    value0: string,
    parts0: TPart[],
  ): Option<{ parts: TPart[]; end: number }>;
} = _curry(4, (src: string, j0: number, value0: string, parts0: TPart[]) => {
  let j: number = j0;
  let value: string = value0;
  let parts: TPart[] = parts0;
  while (true) {
    const _step = match(_Str_get(j, src))
      .with({ _tag: "None" }, () => _done(None as Option<{ parts: TPart[]; end: number }>))
      .with({ _tag: "Some", value: '"' }, () =>
        _done(
          Some({ parts: _Array_append(PLit(value), parts), end: add(j, 1) }) as Option<{
            parts: TPart[];
            end: number;
          }>,
        ),
      )
      .with({ _tag: "Some", value: "\\" }, () =>
        match(_Str_get(add(j, 1), src))
          .with({ _tag: "Some" }, ({ value: n }) =>
            _recur(add(j, 2), `${value}${escChar(n)}`, parts),
          )
          .with({ _tag: "None" }, () => _recur(add(j, 1), `${value}\\`, parts))
          .exhaustive(),
      )
      .with(
        (_v): _v is Extract<Option<string>, { _tag: "Some" }> => {
          const _g: any = _v;
          return (
            _g._tag === "Some" &&
            _g.value === "$" &&
            _Option_contains("{", _Str_get(add(j, 1), src))
          );
        },
        () =>
          match(findHoleEnd(src, add(j, 2)))
            .with({ _tag: "None" }, () => _done(None as Option<{ parts: TPart[]; end: number }>))
            .with({ _tag: "Some" }, ({ value: holeEnd }) =>
              ((withLit: TPart[]) =>
                ((withHole: TPart[]) => _recur(holeEnd, "", withHole))(
                  _Array_append(PHole(add(j, 2), sub(holeEnd, 1)), withLit),
                ))(_Array_append(PLit(value), parts)),
            )
            .exhaustive(),
      )
      .with({ _tag: "Some" }, ({ value: c }) => _recur(add(j, 1), `${value}${c}`, parts))
      .exhaustive();
    if (_step._tag === "recur") {
      [j, value, parts] = _step.args;
      continue;
    }
    return _step.value;
  }
});
const scanTemplate: {
  (src: string): (i: number) => Option<{ parts: TPart[]; end: number }>;
  (src: string, i: number): Option<{ parts: TPart[]; end: number }>;
} = _curry(2, (src: string, i: number) => scanTemplateLoop(src, add(i, 1), "", [] as TPart[]));
const notNewline: (c: string) => boolean = (c: string) => not(eq(c, "\n"));
const scanComment: {
  (src: string): (start: number) => (lineTok: boolean) => Comment;
  (src: string): (start: number, lineTok: boolean) => Comment;
  (src: string, start: number): (lineTok: boolean) => Comment;
  (src: string, start: number, lineTok: boolean): Comment;
} = _curry(3, (src: string, start: number, lineTok: boolean) => {
  const stop: number = scanWhile(notNewline, src, start);
  return lineTok
    ? Trailing(stop)
    : _Option_contains("/", _Str_get(add(start, 2), src))
      ? ((textStart: number) => DocLine(_Str_slice(textStart, stop, src), stop))(
          _Option_contains(" ", _Str_get(add(start, 3), src)) ? add(start, 4) : add(start, 3),
        )
      : PlainOwn(stop);
});
const mkTok: <A, B, C>(
  tok: A,
  start: B,
  stop: C,
  doc: string[],
) => { tok: A; start: B; end: C; doc: Option<string> } = _curry(
  4,
  <A, B, C>(tok: A, start: B, stop: C, doc: string[]) =>
    match(doc)
      .with(
        (_v) => {
          const _g: any = _v;
          return _g.length === 0;
        },
        () => ({ tok: tok, start: start, end: stop, doc: None as Option<string> }),
      )
      .otherwise((lines) => ({
        tok: tok,
        start: start,
        end: stop,
        doc: Some(_Str_join("\n", lines)) as Option<string>,
      })),
);
const lexError: <A, B, C, D>(
  message: A,
  start: B,
  stop: C,
) => Result<D, { message: A; start: B; end: C }> = _curry(
  3,
  <A, B, C, D>(message: A, start: B, stop: C) => Err({ message: message, start: start, end: stop }),
);
const numValue: (raw: string) => number = (raw: string) =>
  _Option_unwrapOr(div(0, 0), _Str_toNumber(raw));
const numStart: {
  (src: string): (i: number) => (c: string) => boolean;
  (src: string): (i: number, c: string) => boolean;
  (src: string, i: number): (c: string) => boolean;
  (src: string, i: number, c: string): boolean;
} = _curry(3, (src: string, i: number, c: string) =>
  or(isDigit(c), and(eq(c, "-"), _Option_exists(isDigit, _Str_get(add(i, 1), src)))),
);
const offsetLocTok: <A, B, C>(
  lt: { doc: A; end: number; start: number; tok: B } & C,
  by: number,
) => { tok: B; start: number; end: number; doc: A } = _curry(
  2,
  <A, B, C>(lt: { doc: A; end: number; start: number; tok: B } & C, by: number) => ({
    tok: lt.tok,
    start: add(lt.start, by),
    end: add(lt.end, by),
    doc: lt.doc,
  }),
);
const spliceHoleToks: <A, B>(
  holeToks: ({ tok: Tok; doc: A; end: number; start: number } & B)[],
  by: number,
  toks: { tok: Tok; start: number; end: number; doc: A }[],
) => { tok: Tok; start: number; end: number; doc: A }[] = _curry(
  3,
  <A, B>(
    holeToks: ({ tok: Tok; doc: A; end: number; start: number } & B)[],
    by: number,
    toks: { tok: Tok; start: number; end: number; doc: A }[],
  ) =>
    match(_Array_head(holeToks))
      .with({ _tag: "None" }, () => toks)
      .with({ _tag: "Some" }, ({ value: ht }) =>
        ((toks2) => spliceHoleToks(_Array_tail(holeToks), by, toks2))(
          eq(ht.tok, TEof as Tok) ? toks : _Array_append(offsetLocTok(ht, by), toks),
        ),
      )
      .exhaustive(),
);
const spliceHole: {
  (
    src: string,
  ): (
    start: number,
  ) => (
    stop: number,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
  ): (
    start: number,
  ) => (
    stop: number,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
  ): (
    start: number,
    stop: number,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
    start: number,
  ): (
    stop: number,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
  ): (
    start: number,
    stop: number,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
    start: number,
  ): (
    stop: number,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
    start: number,
    stop: number,
  ): (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
    start: number,
    stop: number,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ): Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { message: string; start: number; end: number }
  >;
} = _curry(
  4,
  (
    src: string,
    start: number,
    stop: number,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) =>
    match(lex(_Str_slice(start, stop, src)))
      .with(
        { _tag: "Ok" },
        ({ value: holeToks }) =>
          Ok(spliceHoleToks(holeToks, start, toks)) as Result<
            { tok: Tok; start: number; end: number; doc: Option<string> }[],
            { message: string; start: number; end: number }
          >,
      )
      .with(
        { _tag: "Err" },
        ({ error: e }) =>
          Err({ message: e.message, start: add(e.start, start), end: add(e.end, start) }) as Result<
            { tok: Tok; start: number; end: number; doc: Option<string> }[],
            { message: string; start: number; end: number }
          >,
      )
      .exhaustive(),
);
const lexParts: {
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
  ): (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
  ) => (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
  ): (
    wholeStart: number,
  ) => (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
  ): (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
  ): (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
  ): (
    wholeEnd: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
  ) => (
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
  ) => (
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
  ) => (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
  ): (
    wholeStart: number,
  ) => (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
  ): (
    wholeStart: number,
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
  ): (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
  ): (
    wholeEnd: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
  ): (
    wholeEnd: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ): (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
  ): (
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
  ): (
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
  ): (
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
  ): (
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
  ): (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
  ): (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ): Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
} = _curry(
  8,
  (
    src: string,
    parts: TPart[],
    idx: number,
    total: number,
    wholeStart: number,
    wholeEnd: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) =>
    match(_Array_head(parts))
      .with(
        { _tag: "None" },
        () =>
          Ok(toks) as Result<
            { tok: Tok; start: number; end: number; doc: Option<string> }[],
            { end: number; start: number; message: string }
          >,
      )
      .with({ _tag: "Some" }, ({ value: part }) =>
        match(part)
          .with({ _tag: "PLit" }, ({ value }) =>
            ((t: { tok: Tok; start: number; end: number; doc: Option<string> }) =>
              lexParts(
                src,
                _Array_tail(parts),
                add(idx, 1),
                total,
                wholeStart,
                wholeEnd,
                [] as string[],
                _Array_append(t, toks),
              ))(mkTok(literalTok(idx, total, value), wholeStart, wholeEnd, doc)),
          )
          .with({ _tag: "PHole" }, ({ start: hs, end: he }) =>
            match(spliceHole(src, hs, he, toks))
              .with(
                { _tag: "Err" },
                ({ error: e }) =>
                  Err(e) as Result<
                    { tok: Tok; start: number; end: number; doc: Option<string> }[],
                    { message: string; start: number; end: number }
                  >,
              )
              .with({ _tag: "Ok" }, ({ value: toks2 }) =>
                lexParts(
                  src,
                  _Array_tail(parts),
                  add(idx, 1),
                  total,
                  wholeStart,
                  wholeEnd,
                  doc,
                  toks2,
                ),
              )
              .exhaustive(),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const emit: {
  (
    src: string,
  ): (
    tok: Tok,
  ) => (
    start: number,
  ) => (
    stop: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
  ) => (
    start: number,
  ) => (
    stop: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
  ) => (
    start: number,
  ) => (
    stop: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
  ) => (
    start: number,
    stop: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
    start: number,
  ) => (
    stop: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
  ): (
    start: number,
  ) => (
    stop: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
  ) => (
    start: number,
  ) => (
    stop: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
  ) => (
    start: number,
    stop: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
  ) => (
    start: number,
    stop: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
    start: number,
  ) => (
    stop: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
    start: number,
  ) => (
    stop: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
    start: number,
    stop: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
  ): (
    start: number,
  ) => (
    stop: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
  ): (
    start: number,
  ) => (
    stop: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
  ): (
    start: number,
    stop: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
    start: number,
  ): (
    stop: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
  ) => (
    start: number,
    stop: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
    start: number,
  ) => (
    stop: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
    start: number,
    stop: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
    start: number,
    stop: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
  ): (
    start: number,
  ) => (
    stop: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
  ): (
    start: number,
    stop: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
  ): (
    start: number,
    stop: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
    start: number,
  ): (
    stop: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
    start: number,
  ): (
    stop: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
    start: number,
    stop: number,
  ): (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    tok: Tok,
    start: number,
    stop: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
  ): (
    start: number,
    stop: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
    start: number,
  ): (
    stop: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
    start: number,
    stop: number,
  ): (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
    start: number,
    stop: number,
    doc: string[],
  ): (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    tok: Tok,
    start: number,
    stop: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ): Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { end: number; start: number; message: string }
  >;
} = _curry(
  6,
  (
    src: string,
    tok: Tok,
    start: number,
    stop: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => go(src, stop, [] as string[], 0, true, _Array_append(mkTok(tok, start, stop, doc), toks)),
);
const lexString: {
  (
    src: string,
  ): (
    i: number,
  ) => (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
  ): (
    i: number,
  ) => (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
  ): (
    i: number,
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
    i: number,
  ): (
    doc: string[],
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
  ): (
    i: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
    i: number,
  ): (
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
    i: number,
    doc: string[],
  ): (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { message: string; start: number; end: number }
  >;
  (
    src: string,
    i: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ): Result<
    { tok: Tok; doc: Option<string>; end: number; start: number }[],
    { message: string; start: number; end: number }
  >;
} = _curry(
  4,
  (
    src: string,
    i: number,
    doc: string[],
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) =>
    match(scanTemplate(src, i))
      .with({ _tag: "None" }, () => lexError("unterminated string literal", i, _Str_length(src)))
      .with({ _tag: "Some" }, ({ value: scanned }) =>
        match(lexParts(src, scanned.parts, 0, length(scanned.parts), i, scanned.end, doc, toks))
          .with(
            { _tag: "Err" },
            ({ error: e }) =>
              Err(e) as Result<
                { tok: Tok; doc: Option<string>; end: number; start: number }[],
                { end: number; start: number; message: string }
              >,
          )
          .with({ _tag: "Ok" }, ({ value: toks2 }) =>
            go(src, scanned.end, [] as string[], 0, true, toks2),
          )
          .exhaustive(),
      )
      .exhaustive(),
);
const go: {
  (
    src: string,
  ): (
    i: number,
  ) => (
    doc: string[],
  ) => (
    nlRun: number,
  ) => (
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
  ) => (
    doc: string[],
  ) => (
    nlRun: number,
  ) => (
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
  ) => (
    doc: string[],
  ) => (
    nlRun: number,
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
  ) => (
    doc: string[],
    nlRun: number,
  ) => (
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
    doc: string[],
  ) => (
    nlRun: number,
  ) => (
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
  ): (
    doc: string[],
  ) => (
    nlRun: number,
  ) => (
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
  ) => (
    doc: string[],
  ) => (
    nlRun: number,
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
  ) => (
    doc: string[],
    nlRun: number,
  ) => (
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
  ) => (
    doc: string[],
    nlRun: number,
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
    doc: string[],
  ) => (
    nlRun: number,
  ) => (
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
    doc: string[],
  ) => (
    nlRun: number,
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
    doc: string[],
    nlRun: number,
  ) => (
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
  ): (
    doc: string[],
  ) => (
    nlRun: number,
  ) => (
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
  ): (
    doc: string[],
  ) => (
    nlRun: number,
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
  ): (
    doc: string[],
    nlRun: number,
  ) => (
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
    doc: string[],
  ): (
    nlRun: number,
  ) => (
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
  ) => (
    doc: string[],
    nlRun: number,
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
    doc: string[],
  ) => (
    nlRun: number,
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
    doc: string[],
    nlRun: number,
  ) => (
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
    doc: string[],
    nlRun: number,
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
  ): (
    doc: string[],
  ) => (
    nlRun: number,
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
  ): (
    doc: string[],
    nlRun: number,
  ) => (
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
  ): (
    doc: string[],
    nlRun: number,
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
    doc: string[],
  ): (
    nlRun: number,
  ) => (
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
    doc: string[],
  ): (
    nlRun: number,
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
    doc: string[],
    nlRun: number,
  ): (
    lineTok: boolean,
  ) => (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
  ): (
    i: number,
    doc: string[],
    nlRun: number,
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
  ): (
    doc: string[],
    nlRun: number,
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
    doc: string[],
  ): (
    nlRun: number,
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
    doc: string[],
    nlRun: number,
  ): (
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
    doc: string[],
    nlRun: number,
    lineTok: boolean,
  ): (
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) => Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
  (
    src: string,
    i: number,
    doc: string[],
    nlRun: number,
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ): Result<
    { tok: Tok; start: number; end: number; doc: Option<string> }[],
    { end: number; start: number; message: string }
  >;
} = _curry(
  6,
  (
    src: string,
    i: number,
    doc: string[],
    nlRun: number,
    lineTok: boolean,
    toks: { tok: Tok; start: number; end: number; doc: Option<string> }[],
  ) =>
    match(_Str_get(i, src))
      .with(
        { _tag: "None" },
        () =>
          Ok(_Array_append(mkTok(TEof as Tok, i, i, doc), toks)) as Result<
            { tok: Tok; start: number; end: number; doc: Option<string> }[],
            { end: number; start: number; message: string }
          >,
      )
      .with(
        (_v): _v is Extract<Option<string>, { _tag: "Some" }> => {
          const _g: any = _v;
          return _g._tag === "Some" && (({ value: c }) => isSpace(c))(_g);
        },
        ({ value: c }) =>
          eq(c, "\n")
            ? ((n: number) =>
                ((kept: string[]) => go(src, add(i, 1), kept, n, false, toks))(
                  lt(n, 2) ? doc : ([] as string[]),
                ))(add(nlRun, 1))
            : go(src, add(i, 1), doc, nlRun, lineTok, toks),
      )
      .with(
        (_v): _v is Extract<Option<string>, { _tag: "Some" }> => {
          const _g: any = _v;
          return (
            _g._tag === "Some" &&
            _g.value === "/" &&
            _Option_contains("/", _Str_get(add(i, 1), src))
          );
        },
        () =>
          match(scanComment(src, i, lineTok))
            .with({ _tag: "Trailing" }, ({ stop }) => go(src, stop, doc, nlRun, lineTok, toks))
            .with({ _tag: "PlainOwn" }, ({ stop }) =>
              go(src, stop, [] as string[], 0, lineTok, toks),
            )
            .with({ _tag: "DocLine" }, ({ text, stop }) =>
              go(src, stop, _Array_append(text, doc), 0, lineTok, toks),
            )
            .exhaustive(),
      )
      .with({ _tag: "Some" }, ({ value: c }) =>
        eq(_Str_slice(i, add(i, 3), src), "...")
          ? emit(src, TSpread as Tok, i, add(i, 3), doc, toks)
          : match(digraphTok(_Str_slice(i, add(i, 2), src)))
              .with({ _tag: "Some" }, ({ value: t }) => emit(src, t, i, add(i, 2), doc, toks))
              .with({ _tag: "None" }, () =>
                eq(c, '"')
                  ? lexString(src, i, doc, toks)
                  : numStart(src, i, c)
                    ? ((j: number) =>
                        ((raw: string) => emit(src, TNum(numValue(raw), raw), i, j, doc, toks))(
                          _Str_slice(i, j, src),
                        ))(scanWhile(isNumChar, src, add(i, 1)))
                    : match(punctTok(c))
                        .with({ _tag: "Some" }, ({ value: t }) =>
                          emit(src, t, i, add(i, 1), doc, toks),
                        )
                        .with({ _tag: "None" }, () =>
                          isIdStart(c)
                            ? ((j: number) =>
                                emit(src, identTok(_Str_slice(i, j, src)), i, j, doc, toks))(
                                scanWhile(isIdChar, src, add(i, 1)),
                              )
                            : lexError(`unexpected char '${c}'`, i, add(i, 1)),
                        )
                        .exhaustive(),
              )
              .exhaustive(),
      )
      .exhaustive(),
);
export const lex: (
  src: string,
) => Result<
  { tok: Tok; doc: Option<string>; end: number; start: number }[],
  { end: number; start: number; message: string }
> = (src: string) =>
  go(
    src,
    0,
    [] as string[],
    0,
    false,
    [] as { tok: Tok; start: number; end: number; doc: Option<string> }[],
  );
