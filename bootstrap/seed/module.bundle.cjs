// @bun
import { Err as Err12, None as None24, Ok as Ok13, Some as Some24, _Array_append as _Array_append19, _Array_concat as _Array_concat14, _Array_flatMap as _Array_flatMap8, _Array_get as _Array_get22, _Array_sort as _Array_sort3, _Map_delete as _Map_delete4, _Map_get as _Map_get14, _Map_getOr as _Map_getOr9, _Map_has as _Map_has9, _Map_keys as _Map_keys13, _Map_set as _Map_set12, _Option_mapOr, _Option_match as _Option_match24, _Option_unwrapOr as _Option_unwrapOr16, _Result_flatMap as _Result_flatMap9, _Result_mapErr as _Result_mapErr2, _Result_match as _Result_match7, _Set_add as _Set_add10, _Set_fromArray as _Set_fromArray10, _Set_has as _Set_has9, _Str_codeAt as _Str_codeAt10, _Str_get as _Str_get6, _Str_join as _Str_join12, _Str_length as _Str_length10, _Str_split as _Str_split7, _Str_startsWith as _Str_startsWith10, _Str_trim as _Str_trim3, _curry as _curry26, and as and18, eq as eq21, filter as filter11, length as length19, map as map18, or as or17, reduce as reduce10 } from "@mochi/compiler/runtime";
import { match as match11 } from "@onrails/pattern";

import { Err, None as None2, Ok, Some as Some2, _Array_append, _Array_concat, _Array_flatMap, _Array_get, _Array_head, _Array_tail, _Array_take, _Option_contains as _Option_contains2, _Option_exists, _Option_match as _Option_match2, _Option_unwrapOr, _Result_match, _Str_codeAt, _Str_fromCode, _Str_get as _Str_get2, _Str_join, _Str_length, _Str_slice, _Str_toNumber, _curry as _curry2, _done as _done2, _recur as _recur2, and, eq, length, lt, or } from "@mochi/compiler/runtime";

import { None, Some, _Option_contains, _Option_match, _Str_get, _curry, _done, _recur } from "@mochi/compiler/runtime";
var skipStrLoop$ = (src, j0) => {
  let j = j0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done(None) : _v._tag === "Some" && _v.value === '"' ? _done(Some(j + 1)) : _v._tag === "Some" && _v.value === "\\" ? _Option_match(_Str_get(j + 1, src), () => _recur(j + 1), () => _recur(j + 2)) : _v._tag === "Some" && _v.value === "$" && _Option_contains("{", _Str_get(j + 1, src)) ? _Option_match(findHoleEnd$(src, j + 2), () => _done(None), (hEnd) => _recur(hEnd)) : _v._tag === "Some" ? _recur(j + 1) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Str_get(j, src));
    if (_step._tag === "recur") {
      j = _step.args[0];
      continue;
    }
    return _step.value;
  }
};
var skipStrLoop = _curry(2, skipStrLoop$);
var skipStringLiteral$ = (src, i) => skipStrLoop$(src, i + 1);
var skipStringLiteral = _curry(2, skipStringLiteral$);
var skipLineCommentTo$ = (src, j) => ((_v) => _v._tag === "None" ? j : _v._tag === "Some" && _v.value === `
` ? j : _v._tag === "Some" ? skipLineCommentTo$(src, j + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_get(j, src));
var skipLineCommentTo = _curry(2, skipLineCommentTo$);
var findHoleLoop$ = (src, j0, depth0) => {
  let j = j0;
  let depth = depth0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done(None) : _v._tag === "Some" && _v.value === '"' ? _Option_match(skipStringLiteral$(src, j), () => _done(None), (stop) => _recur(stop, depth)) : _v._tag === "Some" && _v.value === "/" && _Option_contains("/", _Str_get(j + 1, src)) ? _recur(skipLineCommentTo$(src, j), depth) : _v._tag === "Some" && _v.value === "{" ? _recur(j + 1, depth + 1) : _v._tag === "Some" && _v.value === "}" ? depth === 1 ? _done(Some(j + 1)) : _recur(j + 1, depth - 1) : _v._tag === "Some" ? _recur(j + 1, depth) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Str_get(j, src));
    if (_step._tag === "recur") {
      [j, depth] = _step.args;
      continue;
    }
    return _step.value;
  }
};
var findHoleLoop = _curry(3, findHoleLoop$);
var findHoleEnd$ = (src, start) => findHoleLoop$(src, start, 1);
var findHoleEnd = _curry(2, findHoleEnd$);

var TLet = { _tag: "TLet" };
var TType = { _tag: "TType" };
var TExtern = { _tag: "TExtern" };
var TSwitch = { _tag: "TSwitch" };
var TLoop = { _tag: "TLoop" };
var TRecur = { _tag: "TRecur" };
var TDo = { _tag: "TDo" };
var TImport = { _tag: "TImport" };
var TExport = { _tag: "TExport" };
var TEq = { _tag: "TEq" };
var TArrow = { _tag: "TArrow" };
var TTarrow = { _tag: "TTarrow" };
var TPipe = { _tag: "TPipe" };
var TConcat = { _tag: "TConcat" };
var TBar = { _tag: "TBar" };
var TLparen = { _tag: "TLparen" };
var TRparen = { _tag: "TRparen" };
var TLbrace = { _tag: "TLbrace" };
var TRbrace = { _tag: "TRbrace" };
var TLbracket = { _tag: "TLbracket" };
var TRbracket = { _tag: "TRbracket" };
var TSpread = { _tag: "TSpread" };
var TPlus = { _tag: "TPlus" };
var TMinus = { _tag: "TMinus" };
var TStar = { _tag: "TStar" };
var TSlash = { _tag: "TSlash" };
var TPercent = { _tag: "TPercent" };
var TAt = { _tag: "TAt" };
var THash = { _tag: "THash" };
var TTilde = { _tag: "TTilde" };
var TDot = { _tag: "TDot" };
var TColon = { _tag: "TColon" };
var TQuestion = { _tag: "TQuestion" };
var TEqeq = { _tag: "TEqeq" };
var TNeq = { _tag: "TNeq" };
var TLte = { _tag: "TLte" };
var TGte = { _tag: "TGte" };
var TLt = { _tag: "TLt" };
var TGt = { _tag: "TGt" };
var TAndand = { _tag: "TAndand" };
var TOror = { _tag: "TOror" };
var TBang = { _tag: "TBang" };
var TBacktick = { _tag: "TBacktick" };
var TComma = { _tag: "TComma" };
var TSemi = { _tag: "TSemi" };
var TNum = _curry2(2, (value, raw) => ({ _tag: "TNum", value, raw }));
var TBool = (value) => ({ _tag: "TBool", value });
var TStr = (value) => ({ _tag: "TStr", value });
var TTmplStart = (value) => ({ _tag: "TTmplStart", value });
var TTmplMid = (value) => ({ _tag: "TTmplMid", value });
var TTmplEnd = (value) => ({ _tag: "TTmplEnd", value });
var TId = (value) => ({ _tag: "TId", value });
var TEof = { _tag: "TEof" };
var DocLine = _curry2(2, (text, stop) => ({ _tag: "DocLine", text, stop }));
var PlainOwn = (stop) => ({ _tag: "PlainOwn", stop });
var Trailing = (stop) => ({ _tag: "Trailing", stop });
var cr = _Str_fromCode(13);
var isSpace = (c) => or(c === " ", or(c === "\t", or(c === `
`, eq(c, cr))));
var inRange$ = (lo, hi, n) => and(n >= lo, n <= hi);
var inRange = _curry2(3, inRange$);
var isDigit = (c) => _Option_exists(inRange(48, 57), _Str_codeAt(0, c));
var isIdStart = (c) => _Option_exists((n) => or(inRange$(65, 90, n), or(inRange$(97, 122, n), or(n === 95, n === 36))), _Str_codeAt(0, c));
var isIdChar = (c) => or(isIdStart(c), isDigit(c));
var isNumChar = (c) => or(isDigit(c), c === ".");
var keywordTok = (word) => ((_v) => _v === "let" ? Some2(TLet) : _v === "type" ? Some2(TType) : _v === "extern" ? Some2(TExtern) : _v === "switch" ? Some2(TSwitch) : _v === "loop" ? Some2(TLoop) : _v === "recur" ? Some2(TRecur) : _v === "do" ? Some2(TDo) : _v === "import" ? Some2(TImport) : _v === "export" ? Some2(TExport) : _v === "true" ? Some2(TBool(true)) : _v === "false" ? Some2(TBool(false)) : None2)(word);
var identTok = (word) => _Option_unwrapOr(TId(word), keywordTok(word));
var digraphTok = (two) => ((_v) => _v === "|>" ? Some2(TPipe) : _v === "++" ? Some2(TConcat) : _v === "==" ? Some2(TEqeq) : _v === "!=" ? Some2(TNeq) : _v === "<=" ? Some2(TLte) : _v === ">=" ? Some2(TGte) : _v === "&&" ? Some2(TAndand) : _v === "||" ? Some2(TOror) : _v === "=>" ? Some2(TArrow) : _v === "->" ? Some2(TTarrow) : None2)(two);
var punctTok = (c) => ((_v) => _v === "|" ? Some2(TBar) : _v === "=" ? Some2(TEq) : _v === "(" ? Some2(TLparen) : _v === ")" ? Some2(TRparen) : _v === "{" ? Some2(TLbrace) : _v === "}" ? Some2(TRbrace) : _v === "[" ? Some2(TLbracket) : _v === "]" ? Some2(TRbracket) : _v === "," ? Some2(TComma) : _v === ";" ? Some2(TSemi) : _v === "." ? Some2(TDot) : _v === ":" ? Some2(TColon) : _v === "?" ? Some2(TQuestion) : _v === "@" ? Some2(TAt) : _v === "#" ? Some2(THash) : _v === "~" ? Some2(TTilde) : _v === "+" ? Some2(TPlus) : _v === "-" ? Some2(TMinus) : _v === "*" ? Some2(TStar) : _v === "/" ? Some2(TSlash) : _v === "%" ? Some2(TPercent) : _v === "!" ? Some2(TBang) : _v === "`" ? Some2(TBacktick) : _v === "<" ? Some2(TLt) : _v === ">" ? Some2(TGt) : None2)(c);
var scanWhile$ = (pred, src, j) => ((_v) => _v._tag === "Some" && (({ value: c }) => pred(c))(_v) ? (({ value: c }) => scanWhile$(pred, src, j + 1))(_v) : j)(_Str_get2(j, src));
var scanWhile = _curry2(3, scanWhile$);
var escChar = (n) => ((_v) => _v === "n" ? `
` : _v === "t" ? "\t" : ((c) => c)(_v))(n);
var PLit = (value) => ({ _tag: "PLit", value });
var PHole = _curry2(2, (start, end) => ({ _tag: "PHole", start, end }));
var literalTok$ = (idx, total, value) => total === 1 ? TStr(value) : idx === 0 ? TTmplStart(value) : eq(idx, total - 1) ? TTmplEnd(value) : TTmplMid(value);
var literalTok = _curry2(3, literalTok$);
var scanTemplateLoop$ = (src, j0, value0, parts0) => {
  let j = j0;
  let value = value0;
  let parts = parts0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done2(None2) : _v._tag === "Some" && _v.value === '"' ? _done2(Some2({ parts: _Array_append(PLit(value), parts), end: j + 1 })) : _v._tag === "Some" && _v.value === "\\" ? _Option_match2(_Str_get2(j + 1, src), () => _recur2(j + 1, `${value}\\`, parts), (n) => _recur2(j + 2, `${value}${escChar(n)}`, parts)) : _v._tag === "Some" && _v.value === "$" && _Option_contains2("{", _Str_get2(j + 1, src)) ? _Option_match2(findHoleEnd(src, j + 2), () => _done2(None2), (holeEnd) => {
      const withLit = _Array_append(PLit(value), parts);
      const withHole = _Array_append(PHole(j + 2, holeEnd - 1), withLit);
      return _recur2(holeEnd, "", withHole);
    }) : _v._tag === "Some" ? (({ value: c }) => _recur2(j + 1, `${value}${c}`, parts))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Str_get2(j, src));
    if (_step._tag === "recur") {
      [j, value, parts] = _step.args;
      continue;
    }
    return _step.value;
  }
};
var scanTemplateLoop = _curry2(4, scanTemplateLoop$);
var scanTemplate$ = (src, i) => scanTemplateLoop$(src, i + 1, "", []);
var scanTemplate = _curry2(2, scanTemplate$);
var notNewline = (c) => c !== `
`;
var scanComment$ = (src, start, lineTok) => {
  const stop = scanWhile$(notNewline, src, start);
  return lineTok ? Trailing(stop) : _Option_contains2("/", _Str_get2(start + 2, src)) ? ((textStart) => DocLine(_Str_slice(textStart, stop, src), stop))(_Option_contains2(" ", _Str_get2(start + 3, src)) ? start + 4 : start + 3) : PlainOwn(stop);
};
var scanComment = _curry2(3, scanComment$);
var mkTok$ = (tok, start, stop, doc) => ((_v) => _v.length === 0 ? { tok, start, end: stop, doc: None2 } : ((lines) => ({ tok, start, end: stop, doc: Some2(_Str_join(`
`, lines)) }))(_v))(doc);
var mkTok = _curry2(4, mkTok$);
var pushRun$ = (run, buf) => {
  const n = length(buf);
  return ((_v) => _v._tag === "Some" && (({ value: top }) => length(top) <= length(run))(_v) ? (({ value: top }) => pushRun$(_Array_concat(top, run), _Array_take(n - 1, buf)))(_v) : _Array_append(run, buf))(_Array_get(n - 1, buf));
};
var pushRun = _curry2(2, pushRun$);
var pushTok$ = (t, buf) => pushRun$([t], buf);
var pushTok = _curry2(2, pushTok$);
var bufToks = (buf) => _Array_flatMap((run) => run, buf);
var lexError = _curry2(3, (message, start, stop) => Err({ message, start, end: stop }));
var numValue = (raw) => _Option_unwrapOr(0 / 0, _Str_toNumber(raw));
var numStart$ = (src, i, c) => or(isDigit(c), and(c === "-", _Option_exists(isDigit, _Str_get2(i + 1, src))));
var numStart = _curry2(3, numStart$);
var offsetLocTok = _curry2(2, (lt, by) => ({ tok: lt.tok, start: lt.start + by, end: lt.end + by, doc: lt.doc }));
var spliceHoleToks = _curry2(3, (holeToks, by, toks) => _Option_match2(_Array_head(holeToks), () => toks, (ht) => {
  const toks2 = ht.tok._tag === "TEof" ? toks : pushTok$(offsetLocTok(ht, by), toks);
  return spliceHoleToks(_Array_tail(holeToks), by, toks2);
}));
var spliceHole$ = (src, start, stop, toks) => _Result_match(lex(_Str_slice(start, stop, src)), (e) => Err({ message: e.message, start: e.start + start, end: e.end + start }), (holeToks) => Ok(spliceHoleToks(holeToks, start, toks)));
var spliceHole = _curry2(4, spliceHole$);
var lexParts$ = (src, parts, idx, total, wholeStart, wholeEnd, doc, toks) => _Option_match2(_Array_head(parts), () => Ok(toks), (part) => {
  const $match = part;
  switch ($match._tag) {
    case "PLit": {
      const { value } = $match;
      const t = mkTok$(literalTok$(idx, total, value), wholeStart, wholeEnd, doc);
      return lexParts$(src, _Array_tail(parts), idx + 1, total, wholeStart, wholeEnd, [], pushTok$(t, toks));
    }
    case "PHole": {
      const { start: hs, end: he } = $match;
      return _Result_match(spliceHole$(src, hs, he, toks), (e) => Err(e), (toks2) => lexParts$(src, _Array_tail(parts), idx + 1, total, wholeStart, wholeEnd, doc, toks2));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
var lexParts = _curry2(8, lexParts$);
var emit$ = (src, tok, start, stop, doc, toks) => go$(src, stop, [], 0, true, pushTok$(mkTok$(tok, start, stop, doc), toks));
var emit = _curry2(6, emit$);
var lexString$ = (src, i, doc, toks) => _Option_match2(scanTemplate$(src, i), () => lexError("unterminated string literal", i, _Str_length(src)), (scanned) => _Result_match(lexParts$(src, scanned.parts, 0, length(scanned.parts), i, scanned.end, doc, toks), (e) => Err(e), (toks2) => go$(src, scanned.end, [], 0, true, toks2)));
var lexString = _curry2(4, lexString$);
var go$ = (src, i, doc, nlRun, lineTok, toks) => ((_v) => _v._tag === "None" ? Ok(bufToks(pushTok$(mkTok$(TEof, i, i, doc), toks))) : _v._tag === "Some" && (({ value: c }) => isSpace(c))(_v) ? (({ value: c }) => c === `
` ? ((n) => ((kept) => go$(src, i + 1, kept, n, false, toks))(lt(n, 2) ? doc : []))(nlRun + 1) : go$(src, i + 1, doc, nlRun, lineTok, toks))(_v) : _v._tag === "Some" && _v.value === "/" && _Option_contains2("/", _Str_get2(i + 1, src)) ? ((_v) => _v._tag === "Trailing" ? (({ stop }) => go$(src, stop, doc, nlRun, lineTok, toks))(_v) : _v._tag === "PlainOwn" ? (({ stop }) => go$(src, stop, [], 0, lineTok, toks))(_v) : _v._tag === "DocLine" ? (({ text, stop }) => go$(src, stop, _Array_append(text, doc), 0, lineTok, toks))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(scanComment$(src, i, lineTok)) : _v._tag === "Some" ? (({ value: c }) => _Str_slice(i, i + 3, src) === "..." ? emit$(src, TSpread, i, i + 3, doc, toks) : _Option_match2(digraphTok(_Str_slice(i, i + 2, src)), () => c === '"' ? lexString$(src, i, doc, toks) : numStart$(src, i, c) ? ((j) => ((raw) => emit$(src, TNum(numValue(raw), raw), i, j, doc, toks))(_Str_slice(i, j, src)))(scanWhile$(isNumChar, src, i + 1)) : _Option_match2(punctTok(c), () => isIdStart(c) ? ((j) => emit$(src, identTok(_Str_slice(i, j, src)), i, j, doc, toks))(scanWhile$(isIdChar, src, i + 1)) : lexError(`unexpected char '${c}'`, i, i + 1), (t) => emit$(src, t, i, i + 1, doc, toks)), (t) => emit$(src, t, i, i + 2, doc, toks)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_get2(i, src));
var go = _curry2(6, go$);
var lex = (src) => go$(src, 0, [], 0, false, []);

import { Err as Err7, None as None11, Ok as Ok7, Some as Some11, _Array_append as _Array_append8, _Array_concat as _Array_concat5, _Array_get as _Array_get10, _Array_prepend as _Array_prepend4, _Option_exists as _Option_exists3, _Option_match as _Option_match11, _Option_unwrapOr as _Option_unwrapOr6, _Result_flatMap as _Result_flatMap5, _Result_map as _Result_map5, _Str_codeAt as _Str_codeAt5, _curry as _curry12, _done as _done5, _recur as _recur5, _tuple as _tuple6, and as and8, eq as eq9, length as length9, lt as lt5, map as map6, or as or7, show as show4 } from "@mochi/compiler/runtime";

import { _curry as _curry3 } from "@mochi/compiler/runtime";
var LPName = _curry3(2, (name, annot) => ({ _tag: "LPName", name, annot }));
var LPRecord = (fields) => ({ _tag: "LPRecord", fields });
var LPTuple = (names) => ({ _tag: "LPTuple", names });
var LPLabeled = _curry3(4, (name, annot, optional, defaultValue) => ({ _tag: "LPLabeled", name, annot, optional, defaultValue }));
var LPSpanned = _curry3(2, (param, nameSpans) => ({ _tag: "LPSpanned", param, nameSpans }));
var SEExpr = (expr) => ({ _tag: "SEExpr", expr });
var SESpread = (expr) => ({ _tag: "SESpread", expr });
var ENum = _curry3(3, (value, raw, span) => ({ _tag: "ENum", value, raw, span }));
var EUnit = (span) => ({ _tag: "EUnit", span });
var EBool = _curry3(2, (value, span) => ({ _tag: "EBool", value, span }));
var EStr = _curry3(2, (value, span) => ({ _tag: "EStr", value, span }));
var ERef = _curry3(2, (name, span) => ({ _tag: "ERef", name, span }));
var ECall = _curry3(4, (fn, args, origin, span) => ({ _tag: "ECall", fn, args, origin, span }));
var ELambda = _curry3(3, (params, body, span) => ({ _tag: "ELambda", params, body, span }));
var ELetIn = _curry3(6, (name, nameSpan, annot, value, body, span) => ({ _tag: "ELetIn", name, nameSpan, annot, value, body, span }));
var ELetBind = _curry3(6, (param, paramSpan, monad, value, body, span) => ({ _tag: "ELetBind", param, paramSpan, monad, value, body, span }));
var EPipe = _curry3(4, (left, right, fast, span) => ({ _tag: "EPipe", left, right, fast, span }));
var EDo = _curry3(2, (exprs, span) => ({ _tag: "EDo", exprs, span }));
var ETernary = _curry3(4, (cond, thenE, elseE, span) => ({ _tag: "ETernary", cond, thenE, elseE, span }));
var EMatch = _curry3(3, (scrutinee, arms, span) => ({ _tag: "EMatch", scrutinee, arms, span }));
var ERecord = _curry3(3, (fields, spread, span) => ({ _tag: "ERecord", fields, spread, span }));
var EField = _curry3(4, (target, name, optional, span) => ({ _tag: "EField", target, name, optional, span }));
var ETuple = _curry3(2, (elements, span) => ({ _tag: "ETuple", elements, span }));
var EArr = _curry3(2, (elements, span) => ({ _tag: "EArr", elements, span }));
var EList = _curry3(2, (elements, span) => ({ _tag: "EList", elements, span }));
var ESet = _curry3(2, (elements, span) => ({ _tag: "ESet", elements, span }));
var EMap = _curry3(2, (entries, span) => ({ _tag: "EMap", entries, span }));
var ELoop = _curry3(3, (params, body, span) => ({ _tag: "ELoop", params, body, span }));
var ERecur = _curry3(2, (args, span) => ({ _tag: "ERecur", args, span }));
var EInterp = _curry3(2, (parts, span) => ({ _tag: "EInterp", parts, span }));
var IPLit = (value) => ({ _tag: "IPLit", value });
var IPExpr = (expr) => ({ _tag: "IPExpr", expr });
var PWild = (span) => ({ _tag: "PWild", span });
var PUnit = (span) => ({ _tag: "PUnit", span });
var PBind = _curry3(2, (name, span) => ({ _tag: "PBind", name, span }));
var PAs = _curry3(4, (pat, name, nameSpan, span) => ({ _tag: "PAs", pat, name, nameSpan, span }));
var PLit2 = _curry3(3, (value, raw, span) => ({ _tag: "PLit", value, raw, span }));
var PBool = _curry3(2, (value, span) => ({ _tag: "PBool", value, span }));
var PStr = _curry3(2, (value, span) => ({ _tag: "PStr", value, span }));
var PTuple = _curry3(2, (elems, span) => ({ _tag: "PTuple", elems, span }));
var PRecord = _curry3(2, (fields, span) => ({ _tag: "PRecord", fields, span }));
var PCtor = _curry3(4, (ctor, args, ns, span) => ({ _tag: "PCtor", ctor, args, ns, span }));
var PArr = _curry3(3, (elems, rest, span) => ({ _tag: "PArr", elems, rest, span }));
var PList = _curry3(3, (elems, rest, span) => ({ _tag: "PList", elems, rest, span }));
var POr = _curry3(2, (alts, span) => ({ _tag: "POr", alts, span }));
var TyName = _curry3(2, (name, span) => ({ _tag: "TyName", name, span }));
var TyArrow = _curry3(3, (from, to, span) => ({ _tag: "TyArrow", from, to, span }));
var TyApp = _curry3(3, (ctor, args, span) => ({ _tag: "TyApp", ctor, args, span }));
var TyTuple = _curry3(2, (elems, span) => ({ _tag: "TyTuple", elems, span }));
var TyList = _curry3(2, (elem, span) => ({ _tag: "TyList", elem, span }));
var TyQual = _curry3(5, (alias, name, nameSpan, args, span) => ({ _tag: "TyQual", alias, name, nameSpan, args, span }));
var TyLit = _curry3(2, (value, span) => ({ _tag: "TyLit", value, span }));
var TyUnion = _curry3(2, (members, span) => ({ _tag: "TyUnion", members, span }));
var SLet = _curry3(7, (name, nameSpan, annot, value, exported, doc, span) => ({ _tag: "SLet", name, nameSpan, annot, value, exported, doc, span }));
var SType = _curry3(9, (name, nameSpan, params, ctors, alias, aliasType, exported, doc, span) => ({ _tag: "SType", name, nameSpan, params, ctors, alias, aliasType, exported, doc, span }));
var SExtern = _curry3(10, (name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span) => ({ _tag: "SExtern", name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span }));
var SImport = _curry3(3, (names, from, span) => ({ _tag: "SImport", names, from, span }));
var SImportNs = _curry3(3, (alias, from, span) => ({ _tag: "SImportNs", alias, from, span }));
var SExpr = _curry3(2, (value, span) => ({ _tag: "SExpr", value, span }));
var SError = (span) => ({ _tag: "SError", span });

import { Err as Err6, None as None10, Ok as Ok6, Some as Some10, _Array_append as _Array_append7, _Array_concat as _Array_concat4, _Array_find as _Array_find3, _Array_get as _Array_get9, _Option_match as _Option_match10, _Result_match as _Result_match3, _curry as _curry11, eq as eq8, filter as filter3, length as length8, map as map5 } from "@mochi/compiler/runtime";
import { match as match5 } from "@onrails/pattern";

import { Err as Err3, None as None6, Ok as Ok3, Some as Some6, _Array_append as _Array_append5, _Array_concat as _Array_concat3, _Array_find, _Array_get as _Array_get5, _Map_get as _Map_get2, _Map_keys as _Map_keys2, _Option_exists as _Option_exists2, _Option_isSome, _Option_match as _Option_match6, _Option_unwrapOr as _Option_unwrapOr3, _Result_flatMap as _Result_flatMap2, _Result_map as _Result_map2, _Str_codeAt as _Str_codeAt3, _Str_contains, _Str_join as _Str_join3, _Str_length as _Str_length4, _Str_slice as _Str_slice2, _Str_split as _Str_split2, _Str_startsWith as _Str_startsWith2, _curry as _curry7, _tuple as _tuple3, and as and5, eq as eq4, length as length4, map as map2, or as or5, reduce, show as show2 } from "@mochi/compiler/runtime";
import { match } from "@onrails/pattern";

import { Err as Err2, None as None3, Ok as Ok2, Some as Some3, _Array_append as _Array_append2, _Array_concat as _Array_concat2, _Array_flatMap as _Array_flatMap2, _Array_get as _Array_get2, _Array_prepend, _Map_get, _Map_getOr, _Map_keys, _Map_set, _Map_values, _Option_match as _Option_match3, _Result_flatMap, _Result_map, _Result_match as _Result_match2, _Str_join as _Str_join2, _curry as _curry4, _tuple, and as and2, eq as eq2, floor, length as length2, map, or as or2, show } from "@mochi/compiler/runtime";
var TyVar = (id) => ({ _tag: "TyVar", id });
var TyCon = _curry4(2, (name, args) => ({ _tag: "TyCon", name, args }));
var TyFn = _curry4(2, (from, to) => ({ _tag: "TyFn", from, to }));
var TyRecord = (row) => ({ _tag: "TyRecord", row });
var TySingleton = _curry4(2, (base, value) => ({ _tag: "TySingleton", base, value }));
var TyOneOf = (members) => ({ _tag: "TyOneOf", members });
var RowEmpty = { _tag: "RowEmpty" };
var RowVar = (id) => ({ _tag: "RowVar", id });
var RowExtend = _curry4(4, (label, fieldType, optional, rest) => ({ _tag: "RowExtend", label, fieldType, optional, rest }));
var tVar = (id) => TyVar(id);
var tCon$ = (name, args) => TyCon(name, args);
var tCon = _curry4(2, tCon$);
var tArrow$ = (fromT, toT) => TyFn(fromT, toT);
var tArrow = _curry4(2, tArrow$);
var tRecord = (row) => TyRecord(row);
var tPrim = (name) => TyCon(name, []);
var tLit = (value) => TySingleton("string", value);
var typeEq$ = (a, b) => {
  const $match = a;
  switch ($match._tag) {
    case "TyVar": {
      const { id: aid } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return eq2(aid, bid);
        }
        default: {
          return false;
        }
      }
    }
    case "TyCon": {
      const { name: aname, args: aargs } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TyCon": {
          const { name: bname, args: bargs } = $match$;
          return and2(and2(eq2(aname, bname), eq2(length2(aargs), length2(bargs))), typeEqList$(aargs, bargs, 0));
        }
        default: {
          return false;
        }
      }
    }
    case "TyFn": {
      const { from: af, to: at } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TyFn": {
          const { from: bf, to: bt } = $match$;
          return and2(typeEq$(af, bf), typeEq$(at, bt));
        }
        default: {
          return false;
        }
      }
    }
    case "TyRecord": {
      const { row: arow } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TyRecord": {
          const { row: brow } = $match$;
          return rowEq$(arow, brow);
        }
        default: {
          return false;
        }
      }
    }
    case "TySingleton": {
      const { base: abase, value: aval } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TySingleton": {
          const { base: bbase, value: bval } = $match$;
          return and2(eq2(abase, bbase), eq2(aval, bval));
        }
        default: {
          return false;
        }
      }
    }
    case "TyOneOf": {
      const { members: am } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TyOneOf": {
          const { members: bm } = $match$;
          return and2(eq2(length2(am), length2(bm)), allMembersIn$(am, bm, 0));
        }
        default: {
          return false;
        }
      }
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var typeEq = _curry4(2, typeEq$);
var typeEqList$ = (as_, bs, i) => _Option_match3(_Array_get2(i, as_), () => true, (a) => _Option_match3(_Array_get2(i, bs), () => false, (b) => and2(typeEq$(a, b), typeEqList$(as_, bs, i + 1))));
var typeEqList = _curry4(3, typeEqList$);
var memberEqIn$ = (t, xs, i) => _Option_match3(_Array_get2(i, xs), () => false, (x) => typeEq$(t, x) ? true : memberEqIn$(t, xs, i + 1));
var memberEqIn = _curry4(3, memberEqIn$);
var allMembersIn$ = (am, bm, i) => _Option_match3(_Array_get2(i, am), () => true, (m) => and2(memberEqIn$(m, bm, 0), allMembersIn$(am, bm, i + 1)));
var allMembersIn = _curry4(3, allMembersIn$);
var rowEq$ = (a, b) => {
  const $match = a;
  switch ($match._tag) {
    case "RowEmpty": {
      const $match$ = b;
      switch ($match$._tag) {
        case "RowEmpty": {
          return true;
        }
        default: {
          return false;
        }
      }
    }
    case "RowVar": {
      const { id: aid } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "RowVar": {
          const { id: bid } = $match$;
          return eq2(aid, bid);
        }
        default: {
          return false;
        }
      }
    }
    case "RowExtend": {
      const { label: al, fieldType: at, optional: ao, rest: ar } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "RowExtend": {
          const { label: bl, fieldType: bt, optional: bo, rest: br } = $match$;
          return and2(and2(and2(eq2(al, bl), eq2(ao, bo)), typeEq$(at, bt)), rowEq$(ar, br));
        }
        default: {
          return false;
        }
      }
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var rowEq = _curry4(2, rowEq$);
var flattenUnionFrom$ = (members, acc, i) => _Option_match3(_Array_get2(i, members), () => acc, (t) => {
  const $match = t;
  switch ($match._tag) {
    case "TyOneOf": {
      const { members: ms } = $match;
      return flattenUnionFrom$(members, flattenUnionFrom$(ms, acc, 0), i + 1);
    }
    default: {
      return flattenUnionFrom$(members, memberEqIn$(t, acc, 0) ? acc : _Array_append2(t, acc), i + 1);
    }
  }
});
var flattenUnionFrom = _curry4(3, flattenUnionFrom$);
var tUnion = (members) => {
  const flat = flattenUnionFrom$(members, [], 0);
  return ((_v) => _v.length === 0 ? tPrim("string") : _v.length === 1 && _v[0]._tag === "TySingleton" ? TyOneOf(flat) : _v.length === 1 ? (([only]) => only)(_v) : TyOneOf(flat))(flat);
};
var TUPLE = "tuple";
var tTuple = (elems) => TyCon(TUPLE, elems);
var UNIT = "unit";
var tUnit = TyCon(UNIT, []);
var isUnit = (t) => {
  const $match = t;
  switch ($match._tag) {
    case "TyCon": {
      const { name, args } = $match;
      return and2(eq2(name, UNIT), length2(args) === 0);
    }
    default: {
      return false;
    }
  }
};
var rVar = (id) => RowVar(id);
var rExtend$ = (label, fieldType, rest) => RowExtend(label, fieldType, false, rest);
var rExtend = _curry4(3, rExtend$);
var rField$ = (label, fieldType, rest, optional) => RowExtend(label, fieldType, optional, rest);
var rField = _curry4(4, rField$);
var showTypeArgs = (args) => _Str_join2(", ", map(showType, args));
var showType = (t) => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return `'t${show(id)}`;
    }
    case "TyCon": {
      const { name, args } = $match;
      return ((_v) => _v.length === 1 && (([elem]) => name === "Array")(_v) ? (([elem]) => `[${showType(elem)}]`)(_v) : _v.length === 0 && eq2(name, UNIT) ? "()" : eq2(name, TUPLE) ? `(${showTypeArgs(args)})` : length2(args) === 0 ? name : `${name}<${showTypeArgs(args)}>`)(args);
    }
    case "TyFn": {
      const { from, to } = $match;
      const fromS = ((_v) => _v._tag === "TyFn" ? `(${showType(from)})` : showType(from))(from);
      return `${fromS} -> ${showType(to)}`;
    }
    case "TyRecord": {
      const { row } = $match;
      return showRow(row);
    }
    case "TySingleton": {
      const { base, value } = $match;
      return base === "string" ? show(value) : value;
    }
    case "TyOneOf": {
      const { members } = $match;
      return _Str_join2(" | ", map(showType, members));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var showRowFields = (row) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return (([fields, tailId]) => _tuple(_Array_prepend(`${label}${optional ? "?" : ""}: ${showType(fieldType)}`, fields), tailId))(showRowFields(rest));
    }
    case "RowVar": {
      const { id } = $match;
      return _tuple([], Some3(id));
    }
    case "RowEmpty": {
      return _tuple([], None3);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var showRow = (row) => (([fields, tailId]) => {
  const tail = _Option_match3(tailId, () => "", (id) => `${length2(fields) === 0 ? "" : " "}| 'r${show(id)}`);
  return and2(length2(fields) === 0, tail === "") ? "{}" : `{ ${_Str_join2(", ", fields)}${tail} }`;
})(showRowFields(row));
var someOfFrom = _curry4(3, (f, xs, i) => _Option_match3(_Array_get2(i, xs), () => false, (x) => f(x) ? true : someOfFrom(f, xs, i + 1)));
var someOf = _curry4(2, (f, xs) => someOfFrom(f, xs, 0));
var mkSt = (start) => ({ tv: new Map, rv: new Map, next: start, recorded: { cur: [], full: [] }, letSpans: new Map, letUses: new Map });
var ID_CHUNK = 64;
var idGet = _curry4(2, (id, m) => _Option_match3(_Map_get(floor(id / ID_CHUNK), m), () => None3, (chunk) => _Map_get(id, chunk)));
var idSet = _curry4(3, (id, v, m) => {
  const k = floor(id / ID_CHUNK);
  return _Map_set(k, _Map_set(id, v, _Map_getOr(new Map, k, m)), m);
});
var idKeys = (m) => _Array_flatMap2(_Map_keys, _Map_values(m));
var recordSymAt$ = (span, t, sym, st) => {
  const rec = st.recorded;
  const at = { span, ty: t, sym };
  return { ...st, recorded: length2(rec.cur) < ID_CHUNK ? { cur: _Array_append2(at, rec.cur), full: rec.full } : { cur: [at], full: _Array_append2(rec.cur, rec.full) } };
};
var recordSymAt = _curry4(4, recordSymAt$);
var recordAt$ = (span, t, st) => recordSymAt$(span, t, None3, st);
var recordAt = _curry4(3, recordAt$);
var recordBinder$ = (span, t, kind, name, doc, st) => recordSymAt$(span, t, Some3({ kind, name, doc }), st);
var recordBinder = _curry4(6, recordBinder$);
var recordedTypes = (st) => _Array_concat2(_Array_flatMap2((c) => c, st.recorded.full), st.recorded.cur);
var spanKeyOf = (sp) => `${show(sp.start)}:${show(sp.end)}`;
var noteLet$ = (span, st) => {
  const k = spanKeyOf(span);
  return { ...st, letSpans: _Map_set(k, span, st.letSpans), letUses: _Map_set(k, [], st.letUses) };
};
var noteLet = _curry4(2, noteLet$);
var noteUse = _curry4(3, (span, t, st) => {
  const k = spanKeyOf(span);
  return _Option_match3(_Map_get(k, st.letUses), () => st, (uses) => ({ ...st, letUses: _Map_set(k, _Array_append2(t, uses), st.letUses) }));
});
var fail = (message) => Err2({ message });
var freshVar = (st) => _tuple(tVar(st.next), { ...st, next: st.next + 1 });
var freshRowVar = (st) => _tuple(rVar(st.next), { ...st, next: st.next + 1 });
var resolve$ = (t, st) => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return _Option_match3(idGet(id, st.tv), () => t, (next) => resolve$(next, st));
    }
    default: {
      return t;
    }
  }
};
var resolve = _curry4(2, resolve$);
var resolveRow$ = (r, st) => {
  const $match = r;
  switch ($match._tag) {
    case "RowVar": {
      const { id } = $match;
      return _Option_match3(idGet(id, st.rv), () => r, (next) => resolveRow$(next, st));
    }
    default: {
      return r;
    }
  }
};
var resolveRow = _curry4(2, resolveRow$);
var zonk$ = (t, st) => {
  const $match = resolve$(t, st);
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return tVar(id);
    }
    case "TyCon": {
      const { name, args } = $match;
      return tCon$(name, map((a) => zonk$(a, st), args));
    }
    case "TyFn": {
      const { from, to } = $match;
      return tArrow$(zonk$(from, st), zonk$(to, st));
    }
    case "TyRecord": {
      const { row } = $match;
      return tRecord(zonkRow$(row, st));
    }
    case "TySingleton": {
      const { base, value } = $match;
      return TySingleton(base, value);
    }
    case "TyOneOf": {
      const { members } = $match;
      return tUnion(map((m) => zonk$(m, st), members));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var zonk = _curry4(2, zonk$);
var zonkRow$ = (row, st) => {
  const $match = resolveRow$(row, st);
  switch ($match._tag) {
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return rField$(label, zonk$(fieldType, st), zonkRow$(rest, st), optional);
    }
    default: {
      const r = $match;
      return r;
    }
  }
};
var zonkRow = _curry4(2, zonkRow$);
var occurs$ = (id, t, st) => {
  const $match = resolve$(t, st);
  switch ($match._tag) {
    case "TyVar": {
      const { id: rid } = $match;
      return eq2(rid, id);
    }
    case "TyCon": {
      const { args } = $match;
      return someOf((a) => occurs$(id, a, st), args);
    }
    case "TyFn": {
      const { from, to } = $match;
      return or2(occurs$(id, from, st), occurs$(id, to, st));
    }
    case "TyRecord": {
      const { row } = $match;
      return occursRow$(id, row, st);
    }
    case "TySingleton": {
      return false;
    }
    case "TyOneOf": {
      const { members } = $match;
      return someOf((m) => occurs$(id, m, st), members);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var occurs = _curry4(3, occurs$);
var occursRow$ = (id, row, st) => {
  const $match = resolveRow$(row, st);
  switch ($match._tag) {
    case "RowExtend": {
      const { fieldType, rest } = $match;
      return or2(occurs$(id, fieldType, st), occursRow$(id, rest, st));
    }
    default: {
      return false;
    }
  }
};
var occursRow = _curry4(3, occursRow$);
var rowVarOccurs$ = (id, row, st) => {
  const $match = resolveRow$(row, st);
  switch ($match._tag) {
    case "RowVar": {
      const { id: rid } = $match;
      return eq2(rid, id);
    }
    case "RowExtend": {
      const { fieldType, rest } = $match;
      return or2(rowVarOccursInType$(id, fieldType, st), rowVarOccurs$(id, rest, st));
    }
    case "RowEmpty": {
      return false;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var rowVarOccurs = _curry4(3, rowVarOccurs$);
var rowVarOccursInType$ = (id, t, st) => {
  const $match = resolve$(t, st);
  switch ($match._tag) {
    case "TyVar": {
      return false;
    }
    case "TyCon": {
      const { args } = $match;
      return someOf((a) => rowVarOccursInType$(id, a, st), args);
    }
    case "TyFn": {
      const { from, to } = $match;
      return or2(rowVarOccursInType$(id, from, st), rowVarOccursInType$(id, to, st));
    }
    case "TyRecord": {
      const { row } = $match;
      return rowVarOccurs$(id, row, st);
    }
    case "TySingleton": {
      return false;
    }
    case "TyOneOf": {
      const { members } = $match;
      return someOf((m) => rowVarOccursInType$(id, m, st), members);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var rowVarOccursInType = _curry4(3, rowVarOccursInType$);
var isArrowT = (t) => {
  const $match = t;
  switch ($match._tag) {
    case "TyFn": {
      return true;
    }
    default: {
      return false;
    }
  }
};
var isCollection = (name) => or2(or2(or2(or2(name === "Array", name === "List"), name === "Set"), name === "Map"), name === "Dict");
var isTupleT = (t) => {
  const $match = t;
  switch ($match._tag) {
    case "TyCon": {
      const { name } = $match;
      return eq2(name, TUPLE);
    }
    default: {
      return false;
    }
  }
};
var tupleParenMsg$ = (a, b, shown) => !eq2(isTupleT(a), isTupleT(b)) ? `${shown} \u2014 ((a, b)) => takes one tuple; (a, b) => takes two arguments` : shown;
var tupleParenMsg = _curry4(3, tupleParenMsg$);
var collectionUnifyMsg$ = (aname, bname, shown) => or2(or2(eq2(aname, bname), !isCollection(aname)), !isCollection(bname)) ? shown : ((other) => ((hint) => `${shown} \u2014 ${hint}`)(other === "List" ? "unqualified map/filter/length expect Array; use List.map" : other === "Set" ? "unqualified map/filter/length expect Array; convert with Set.toArray or use Set.*" : other === "Map" ? "unqualified map/filter/length expect Array; use Map.*" : `${aname} and ${bname} are distinct collections`))(aname === "Array" ? bname : bname === "Array" ? aname : "");
var collectionUnifyMsg = _curry4(3, collectionUnifyMsg$);
var unifyMismatch = _curry4(2, (ra, rb) => !eq2(isArrowT(ra), isArrowT(rb)) ? (([fn, val]) => fail(tupleParenMsg$(ra, rb, `cannot unify ${showType(ra)} with ${showType(rb)} \u2014 a function (${showType(fn)}) was used where a ${showType(val)} was expected; a call may be missing an argument`)))(isArrowT(ra) ? _tuple(ra, rb) : _tuple(rb, ra)) : fail(tupleParenMsg$(ra, rb, `cannot unify ${showType(ra)} with ${showType(rb)}`)));
var unifyArgs$ = (as_, bs, i, st) => _Option_match3(_Array_get2(i, as_), () => Ok2(st), (a) => _Option_match3(_Array_get2(i, bs), () => Ok2(st), (b) => _Result_flatMap((s1) => unifyArgs$(as_, bs, i + 1, s1), unify$(a, b, st))));
var unifyArgs = _curry4(4, unifyArgs$);
var isPrimT$ = (t, name) => {
  const $match = t;
  switch ($match._tag) {
    case "TyCon": {
      const { name: n, args } = $match;
      return and2(eq2(n, name), length2(args) === 0);
    }
    default: {
      return false;
    }
  }
};
var isPrimT = _curry4(2, isPrimT$);
var isLitOnlyUnion = (members) => ((_v) => _v.length === 0 ? true : _v.length >= 1 && _v[0]._tag === "TySingleton" ? (([, ...rest]) => isLitOnlyUnion(rest))(_v) : false)(members);
var widenLitBindingsFrom$ = (ids, i, lit, st) => _Option_match3(_Array_get2(i, ids), () => st, (id) => _Option_match3(idGet(id, st.tv), () => widenLitBindingsFrom$(ids, i + 1, lit, st), (t) => {
  const $match = resolve$(t, st);
  switch ($match._tag) {
    case "TySingleton": {
      const { base, value } = $match;
      const $match$ = lit;
      switch ($match$._tag) {
        case "TySingleton": {
          const { base: lbase, value: lvalue } = $match$;
          return and2(eq2(base, lbase), eq2(value, lvalue)) ? widenLitBindingsFrom$(ids, i + 1, lit, { ...st, tv: idSet(id, tPrim(base), st.tv) }) : widenLitBindingsFrom$(ids, i + 1, lit, st);
        }
        default: {
          return widenLitBindingsFrom$(ids, i + 1, lit, st);
        }
      }
    }
    default: {
      return widenLitBindingsFrom$(ids, i + 1, lit, st);
    }
  }
}));
var widenLitBindingsFrom = _curry4(4, widenLitBindingsFrom$);
var widenLitBindings$ = (lit, st) => widenLitBindingsFrom$(idKeys(st.tv), 0, lit, st);
var widenLitBindings = _curry4(2, widenLitBindings$);
var litInUnionFrom$ = (lit, members, i, st) => _Option_match3(_Array_get2(i, members), () => fail(`cannot unify ${showType(lit)} with ${showType(TyOneOf(members))}`), (m) => {
  const $match = m;
  switch ($match._tag) {
    case "TySingleton": {
      const { base, value } = $match;
      const $match$ = lit;
      switch ($match$._tag) {
        case "TySingleton": {
          const { base: lbase, value: lvalue } = $match$;
          return and2(eq2(base, lbase), eq2(value, lvalue)) ? Ok2(st) : litInUnionFrom$(lit, members, i + 1, st);
        }
        default: {
          return litInUnionFrom$(lit, members, i + 1, st);
        }
      }
    }
    default: {
      return _Result_match2(unify$(lit, m, st), () => litInUnionFrom$(lit, members, i + 1, st), (st1) => Ok2(st1));
    }
  }
});
var litInUnionFrom = _curry4(4, litInUnionFrom$);
var unifyMemberAgainstUnionFrom$ = (member, members, i, st) => {
  const $match = member;
  switch ($match._tag) {
    case "TySingleton": {
      return litInUnionFrom$(member, members, 0, st);
    }
    default: {
      return unifyConcreteAgainstUnionFrom$(member, members, i, st);
    }
  }
};
var unifyMemberAgainstUnionFrom = _curry4(4, unifyMemberAgainstUnionFrom$);
var unifyConcreteAgainstUnionFrom$ = (member, members, i, st) => _Option_match3(_Array_get2(i, members), () => fail(`cannot unify ${showType(member)} with ${showType(TyOneOf(members))}`), (m) => _Result_match2(unify$(member, m, st), () => unifyConcreteAgainstUnionFrom$(member, members, i + 1, st), (st1) => Ok2(st1)));
var unifyConcreteAgainstUnionFrom = _curry4(4, unifyConcreteAgainstUnionFrom$);
var unifyUnionMembersFrom$ = (members, u, i, st) => _Option_match3(_Array_get2(i, members), () => Ok2(st), (m) => {
  const $match = u;
  switch ($match._tag) {
    case "TyOneOf": {
      const { members: ums } = $match;
      return _Result_flatMap((s1) => unifyUnionMembersFrom$(members, u, i + 1, s1), unifyMemberAgainstUnionFrom$(m, ums, 0, st));
    }
    default: {
      return Ok2(st);
    }
  }
});
var unifyUnionMembersFrom = _curry4(4, unifyUnionMembersFrom$);
var unifyLitUnion$ = (a, b, st) => {
  const $match = a;
  switch ($match._tag) {
    case "TySingleton": {
      const { base: abase, value: aval } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TySingleton": {
          const { base: bbase, value: bval } = $match$;
          return and2(eq2(abase, bbase), eq2(aval, bval)) ? Ok2(st) : eq2(abase, bbase) ? Ok2(widenLitBindings$(b, widenLitBindings$(a, st))) : fail(`cannot unify ${showType(a)} with ${showType(b)}`);
        }
        case "TyOneOf": {
          const { members } = $match$;
          return litInUnionFrom$(a, members, 0, st);
        }
        default: {
          return isPrimT$(b, abase) ? Ok2(st) : fail(`cannot unify ${showType(a)} with ${showType(b)}`);
        }
      }
    }
    case "TyOneOf": {
      const { members: amembers } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "TySingleton": {
          return litInUnionFrom$(b, amembers, 0, st);
        }
        case "TyOneOf": {
          const { members: bmembers } = $match$;
          return _Result_flatMap((s1) => unifyUnionMembersFrom$(bmembers, a, 0, s1), unifyUnionMembersFrom$(amembers, b, 0, st));
        }
        default: {
          return isLitOnlyUnion(amembers) ? fail(`cannot unify ${showType(a)} with ${showType(b)}`) : unifyMemberAgainstUnionFrom$(b, amembers, 0, st);
        }
      }
    }
    default: {
      const $match$ = b;
      switch ($match$._tag) {
        case "TySingleton": {
          const { base: bbase } = $match$;
          return isPrimT$(a, bbase) ? Ok2(st) : fail(`cannot unify ${showType(a)} with ${showType(b)}`);
        }
        case "TyOneOf": {
          const { members: bmembers } = $match$;
          return isLitOnlyUnion(bmembers) ? fail(`cannot unify ${showType(a)} with ${showType(b)}`) : unifyMemberAgainstUnionFrom$(a, bmembers, 0, st);
        }
        default: {
          return fail(`cannot unify ${showType(a)} with ${showType(b)}`);
        }
      }
    }
  }
};
var unifyLitUnion = _curry4(3, unifyLitUnion$);
var unify$ = (a, b, st) => {
  const ra = resolve$(a, st);
  const rb = resolve$(b, st);
  const $match = ra;
  switch ($match._tag) {
    case "TyVar": {
      const { id: aid } = $match;
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return eq2(aid, bid) ? Ok2(st) : bindVar$(aid, rb, st);
        }
        default: {
          return bindVar$(aid, rb, st);
        }
      }
    }
    case "TyCon": {
      const { name: aname, args: aargs } = $match;
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return bindVar$(bid, ra, st);
        }
        case "TyCon": {
          const { name: bname, args: bargs } = $match$;
          return and2(eq2(aname, bname), eq2(length2(aargs), length2(bargs))) ? unifyArgs$(aargs, bargs, 0, st) : fail(tupleParenMsg$(ra, rb, collectionUnifyMsg$(aname, bname, `cannot unify ${showType(ra)} with ${showType(rb)}`)));
        }
        case "TySingleton": {
          return unifyLitUnion$(ra, rb, st);
        }
        case "TyOneOf": {
          return unifyLitUnion$(ra, rb, st);
        }
        default: {
          return unifyMismatch(ra, rb);
        }
      }
    }
    case "TyFn": {
      const { from: afrom, to: ato } = $match;
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return bindVar$(bid, ra, st);
        }
        case "TyFn": {
          const { from: bfrom, to: bto } = $match$;
          return _Result_flatMap((s1) => unify$(ato, bto, s1), unify$(afrom, bfrom, st));
        }
        case "TySingleton": {
          return unifyLitUnion$(ra, rb, st);
        }
        case "TyOneOf": {
          return unifyLitUnion$(ra, rb, st);
        }
        default: {
          return unifyMismatch(ra, rb);
        }
      }
    }
    case "TyRecord": {
      const { row: arow } = $match;
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return bindVar$(bid, ra, st);
        }
        case "TyRecord": {
          const { row: brow } = $match$;
          return unifyRows$(arow, brow, st);
        }
        case "TySingleton": {
          return unifyLitUnion$(ra, rb, st);
        }
        case "TyOneOf": {
          return unifyLitUnion$(ra, rb, st);
        }
        default: {
          return unifyMismatch(ra, rb);
        }
      }
    }
    case "TySingleton": {
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return bindVar$(bid, ra, st);
        }
        default: {
          return unifyLitUnion$(ra, rb, st);
        }
      }
    }
    case "TyOneOf": {
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return bindVar$(bid, ra, st);
        }
        default: {
          return unifyLitUnion$(ra, rb, st);
        }
      }
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var unify = _curry4(3, unify$);
var bindVar$ = (id, t, st) => occurs$(id, t, st) ? fail(`infinite type: 't${show(id)} occurs in ${showType(zonk$(t, st))}`) : Ok2({ ...st, tv: idSet(id, t, st.tv) });
var bindVar = _curry4(3, bindVar$);
var rewriteRow$ = (row, label, st) => {
  const $match = resolveRow$(row, st);
  switch ($match._tag) {
    case "RowEmpty": {
      return fail(`record missing field '${label}'`);
    }
    case "RowExtend": {
      const { label: rlabel, fieldType: rtype, optional: ropt, rest: rrest } = $match;
      return eq2(rlabel, label) ? Ok2(_tuple(rtype, ropt, rrest, st)) : _Result_map(([subType, subOpt, subRest, subSt]) => _tuple(subType, subOpt, rField$(rlabel, rtype, subRest, ropt), subSt), rewriteRow$(rrest, label, st));
    }
    case "RowVar": {
      const { id: rid } = $match;
      return (([freshT, st1]) => (([freshTail, st2]) => Ok2(_tuple(freshT, false, freshTail, { ...st2, rv: idSet(rid, rExtend$(label, freshT, freshTail), st2.rv) })))(freshRowVar(st1)))(freshVar(st));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var rewriteRow = _curry4(3, rewriteRow$);
var unifyRows$ = (r1, r2, st) => {
  const a = resolveRow$(r1, st);
  const b = resolveRow$(r2, st);
  const $match = a;
  switch ($match._tag) {
    case "RowEmpty": {
      const $match$ = b;
      switch ($match$._tag) {
        case "RowEmpty": {
          return Ok2(st);
        }
        case "RowVar": {
          const { id: bid } = $match$;
          return bindRowVar$(bid, a, st);
        }
        case "RowExtend": {
          const { label } = $match$;
          return fail(`record missing field '${label}'`);
        }
        default: {
          throw new Error("non-exhaustive match");
        }
      }
    }
    case "RowVar": {
      const { id: aid } = $match;
      return bindRowVar$(aid, b, st);
    }
    case "RowExtend": {
      const { label: alabel, fieldType: atype, optional: aopt, rest: arest } = $match;
      const $match$ = b;
      switch ($match$._tag) {
        case "RowEmpty": {
          return fail(`record has extra field '${alabel}'`);
        }
        case "RowVar": {
          const { id: bid } = $match$;
          return bindRowVar$(bid, a, st);
        }
        case "RowExtend": {
          return _Result_flatMap(([btype, bopt, brest, s1]) => eq2(aopt, bopt) ? _Result_flatMap((s2) => unifyRows$(arest, brest, s2), unify$(atype, btype, s1)) : fail(aopt ? `record field '${alabel}' is optional but required on the other side` : `record field '${alabel}' is required but optional on the other side`), rewriteRow$(b, alabel, st));
        }
        default: {
          throw new Error("non-exhaustive match");
        }
      }
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var unifyRows = _curry4(3, unifyRows$);
var bindRowVar$ = (id, row, st) => ((_v) => _v._tag === "RowVar" && (({ id: rid }) => eq2(rid, id))(_v) ? (({ id: rid }) => Ok2(st))(_v) : ((r) => rowVarOccurs$(id, r, st) ? fail("infinite record type") : Ok2({ ...st, rv: idSet(id, r, st.rv) }))(_v))(resolveRow$(row, st));
var bindRowVar = _curry4(3, bindRowVar$);
var fits$ = (actual, expected, st) => {
  const ra = resolve$(actual, st);
  const rb = resolve$(expected, st);
  const $match = ra;
  switch ($match._tag) {
    case "TyVar": {
      const { id: aid } = $match;
      return bindVar$(aid, rb, st);
    }
    default: {
      const $match$ = rb;
      switch ($match$._tag) {
        case "TyVar": {
          const { id: bid } = $match$;
          return bindVar$(bid, ra, st);
        }
        case "TyRecord": {
          const { row: erow } = $match$;
          const $match$$ = ra;
          switch ($match$$._tag) {
            case "TyRecord": {
              const { row: arow } = $match$$;
              return fitsRows$(arow, erow, st);
            }
            default: {
              return unify$(actual, expected, st);
            }
          }
        }
        default: {
          return unify$(actual, expected, st);
        }
      }
    }
  }
};
var fits = _curry4(3, fits$);
var fitsRows$ = (actual, expected, st) => {
  const exp = resolveRow$(expected, st);
  const act = resolveRow$(actual, st);
  const $match = exp;
  switch ($match._tag) {
    case "RowVar": {
      const { id: eid } = $match;
      return bindRowVar$(eid, act, st);
    }
    case "RowEmpty": {
      const $match$ = act;
      switch ($match$._tag) {
        case "RowEmpty": {
          return Ok2(st);
        }
        case "RowVar": {
          const { id: aid } = $match$;
          return bindRowVar$(aid, exp, st);
        }
        case "RowExtend": {
          const { label } = $match$;
          return fail(`record has extra field '${label}'`);
        }
        default: {
          throw new Error("non-exhaustive match");
        }
      }
    }
    case "RowExtend": {
      const { label: elabel, fieldType: etype, optional: eopt, rest: erest } = $match;
      const rw = rewriteRow$(act, elabel, st);
      return _Result_match2(rw, () => eopt ? fitsRows$(act, erest, st) : fail(`record missing field '${elabel}'`), (hit) => (([htype, hopt, hrest, s1]) => and2(hopt, !eopt) ? fail(`record field '${elabel}' is required but missing or optional`) : _Result_flatMap((s2) => fitsRows$(hrest, erest, s2), unify$(htype, etype, s1)))(hit));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var fitsRows = _curry4(3, fitsRows$);

import { None as None4, Some as Some4, _Array_append as _Array_append3, _Array_get as _Array_get3, _Option_match as _Option_match4, _Str_codeAt as _Str_codeAt2, _Str_get as _Str_get3, _Str_length as _Str_length2, _Str_startsWith, _curry as _curry5, _tuple as _tuple2, and as and3, eq as eq3, floor as floor2, max, min, or as or3 } from "@mochi/compiler/runtime";
var at = _curry5(3, (xs, i, fallback) => _Option_match4(_Array_get3(i, xs), () => fallback, (v) => v));
var charsEq$ = (a, i, b, j) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" ? (([{ value: x }, { value: y }]) => eq3(x, y))(_v) : false)(_tuple2(_Str_get3(i, a), _Str_get3(j, b)));
var charsEq = _curry5(4, charsEq$);
var initRow = (n) => {
  let j = 0;
  let row = [];
  while (true) {
    if (j > n) {
      return row;
    } else {
      {
        const $recur0 = j + 1;
        const $recur1 = _Array_append3(j, row);
        j = $recur0;
        row = $recur1;
        continue;
      }
    }
  }
};
var cellAt$ = (a, b, i, j, prev, cur) => {
  const cost = charsEq$(a, i - 1, b, j - 1) ? 0 : 1;
  return min(min(at(cur, j - 1, 0) + 1, at(prev, j, 0) + 1), at(prev, j - 1, 0) + cost);
};
var cellAt = _curry5(6, cellAt$);
var fillRow$ = (a, b, i, prev, n) => {
  let j = 1;
  let cur = [i];
  while (true) {
    if (j > n) {
      return cur;
    } else {
      {
        const $recur0 = j + 1;
        const $recur1 = _Array_append3(cellAt$(a, b, i, j, prev, cur), cur);
        j = $recur0;
        cur = $recur1;
        continue;
      }
    }
  }
};
var fillRow = _curry5(5, fillRow$);
var levFrom$ = (a, b, m, n) => {
  let i = 1;
  let prev = initRow(n);
  while (true) {
    if (i > m) {
      return at(prev, n, n);
    } else {
      {
        const $recur0 = i + 1;
        const $recur1 = fillRow$(a, b, i, prev, n);
        i = $recur0;
        prev = $recur1;
        continue;
      }
    }
  }
};
var levFrom = _curry5(4, levFrom$);
var lev$ = (a, b) => {
  const m = _Str_length2(a);
  const n = _Str_length2(b);
  return m === 0 ? n : n === 0 ? m : levFrom$(a, b, m, n);
};
var lev = _curry5(2, lev$);
var upperStart = (s) => _Option_match4(_Str_codeAt2(0, s), () => false, (n) => and3(n >= 65, n <= 90));
var sameCaseClass$ = (a, b) => eq3(upperStart(a), upperStart(b));
var sameCaseClass = _curry5(2, sameCaseClass$);
var skipName$ = (want, n) => or3(or3(or3(or3(n === "", eq3(n, want)), _Str_startsWith("$", n)), _Str_startsWith("_", n)), !sameCaseClass$(want, n));
var skipName = _curry5(2, skipName$);
var consider$ = (want, budget, best, bestDist, n) => skipName$(want, n) ? _tuple2(best, bestDist) : ((d) => and3(d <= budget, d < bestDist) ? _tuple2(Some4(n), d) : _tuple2(best, bestDist))(lev$(want, n));
var consider = _curry5(5, consider$);
var closestFrom$ = (want, names, i, budget, best, bestDist) => _Option_match4(_Array_get3(i, names), () => best, (n) => (([next, dist]) => closestFrom$(want, names, i + 1, budget, next, dist))(consider$(want, budget, best, bestDist, n)));
var closestFrom = _curry5(6, closestFrom$);
var closestName$ = (want, names) => {
  const budget = max(1, floor2(_Str_length2(want) / 3));
  return closestFrom$(want, names, 0, budget, None4, _Str_length2(want) + 2);
};
var closestName = _curry5(2, closestName$);

import { _Array_append as _Array_append4, _Array_get as _Array_get4, _Option_match as _Option_match5, _Option_unwrapOr as _Option_unwrapOr2, _Str_length as _Str_length3, _Str_split, _curry as _curry6, _done as _done3, _recur as _recur3, and as and4, length as length3, or as or4 } from "@mochi/compiler/runtime";
var DText = (s) => ({ _tag: "DText", s });
var DLine = _curry6(2, (hard, soft) => ({ _tag: "DLine", hard, soft }));
var DCat = (parts) => ({ _tag: "DCat", parts });
var DIndent = (doc) => ({ _tag: "DIndent", doc });
var DGroup = _curry6(2, (doc, breaks) => ({ _tag: "DGroup", doc, breaks }));
var INDENT = 2;
var txt = (s) => DText(s);
var cat = (parts) => DCat(parts);
var line = DLine(false, false);
var softline = DLine(false, true);
var hardline = DLine(true, false);
var indent = (doc) => DIndent(doc);
var group = (doc) => DGroup(doc, forcesBreak(doc));
var joinFrom = _curry6(4, (sep, parts, i, acc) => _Option_match5(_Array_get4(i, parts), () => acc, (p) => joinFrom(sep, parts, i + 1, i === 0 ? _Array_append4(p, acc) : _Array_append4(p, _Array_append4(sep, acc)))));
var join$ = (sep, parts) => DCat(joinFrom(sep, parts, 0, []));
var join = _curry6(2, join$);
var WNil = { _tag: "WNil" };
var WCons = _curry6(2, (head, tail) => ({ _tag: "WCons", head, tail }));
var consParts$ = (parts, i, m, tail) => {
  let k = length3(parts) - 1;
  let w = tail;
  while (true) {
    if (k < 0) {
      return w;
    } else {
      {
        const $loopMatch = _Array_get4(k, parts);
        if ($loopMatch._tag === "None") {
          return w;
        }
        if ($loopMatch._tag === "Some") {
          const { value: d } = $loopMatch;
          {
            const $recur0 = k - 1;
            const $recur1 = WCons({ i, m, d }, w);
            k = $recur0;
            w = $recur1;
            continue;
          }
        }
        throw new Error("non-exhaustive match");
      }
    }
  }
};
var consParts = _curry6(4, consParts$);
var fits$2 = (width, start) => {
  let rem = width;
  let work = start;
  while (true) {
    if (rem < 0) {
      return false;
    } else {
      const _step = ((_v) => _v._tag === "WNil" ? _done3(true) : _v._tag === "WCons" ? (({ head: { i, m, d }, tail }) => ((_v) => _v._tag === "DText" ? (({ s }) => _recur3(rem - _Str_length3(s), tail))(_v) : _v._tag === "DVerbatim" ? _done3(true) : _v._tag === "DCat" ? (({ parts }) => _recur3(rem, consParts$(parts, i, m, tail)))(_v) : _v._tag === "DIndent" ? (({ doc: inner }) => _recur3(rem, WCons({ i: i + INDENT, m, d: inner }, tail)))(_v) : _v._tag === "DGroup" ? (({ doc: inner }) => _recur3(rem, WCons({ i, m: "flat", d: inner }, tail)))(_v) : _v._tag === "DLine" ? (({ hard, soft }) => or4(hard, m === "break") ? _done3(true) : _recur3(rem - (soft ? 0 : 1), tail))(_v) : _v._tag === "DLineSuffix" ? (({ doc: inner }) => _recur3(rem, WCons({ i, m, d: inner }, tail)))(_v) : _v._tag === "DBreakParent" ? _recur3(rem, tail) : (() => {
        throw new Error("non-exhaustive match");
      })())(d))(_v) : (() => {
        throw new Error("non-exhaustive match");
      })())(work);
      if (_step._tag === "recur") {
        [rem, work] = _step.args;
        continue;
      }
      return _step.value;
    }
  }
};
var fits2 = _curry6(2, fits$2);
var anyForcesBreak$ = (parts, i) => _Option_match5(_Array_get4(i, parts), () => false, (p) => or4(forcesBreak(p), anyForcesBreak$(parts, i + 1)));
var anyForcesBreak = _curry6(2, anyForcesBreak$);
var forcesBreak = (d) => {
  const $match = d;
  switch ($match._tag) {
    case "DBreakParent": {
      return true;
    }
    case "DVerbatim": {
      return true;
    }
    case "DLine": {
      const { hard } = $match;
      return hard;
    }
    case "DCat": {
      const { parts } = $match;
      return anyForcesBreak$(parts, 0);
    }
    case "DIndent": {
      const { doc: inner } = $match;
      return forcesBreak(inner);
    }
    case "DGroup": {
      const { breaks } = $match;
      return breaks;
    }
    case "DLineSuffix": {
      return false;
    }
    case "DText": {
      return false;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var spaces = (n) => {
  let k = n;
  let acc = "";
  while (true) {
    if (k <= 0) {
      return acc;
    } else {
      {
        const $recur0 = k - 1;
        const $recur1 = `${acc} `;
        k = $recur0;
        acc = $recur1;
        continue;
      }
    }
  }
};
var posAfter$ = (pos, s) => {
  const parts = _Str_split(`
`, s);
  return length3(parts) === 1 ? pos + _Str_length3(s) : _Str_length3(_Option_unwrapOr2("", _Array_get4(length3(parts) - 1, parts)));
};
var posAfter = _curry6(2, posAfter$);
var consItems$ = (items, tail) => {
  let k = length3(items) - 1;
  let w = tail;
  while (true) {
    if (k < 0) {
      return w;
    } else {
      {
        const $loopMatch = _Array_get4(k, items);
        if ($loopMatch._tag === "None") {
          return w;
        }
        if ($loopMatch._tag === "Some") {
          const { value: it } = $loopMatch;
          {
            const $recur0 = k - 1;
            const $recur1 = WCons(it, w);
            k = $recur0;
            w = $recur1;
            continue;
          }
        }
        throw new Error("non-exhaustive match");
      }
    }
  }
};
var consItems = _curry6(2, consItems$);
var render$ = (root, width) => {
  let out = "";
  let pos = 0;
  let work = WCons({ i: 0, m: "break", d: root }, WNil);
  let sfx = [];
  while (true) {
    const _step = ((_v) => _v._tag === "WNil" ? length3(sfx) === 0 ? _done3(out) : _recur3(out, pos, consItems$(sfx, WNil), []) : _v._tag === "WCons" ? (({ head: { i, m, d }, tail }) => ((_v) => _v._tag === "DText" ? (({ s }) => _recur3(`${out}${s}`, pos + _Str_length3(s), tail, sfx))(_v) : _v._tag === "DVerbatim" ? (({ s }) => _recur3(`${out}${s}`, posAfter$(pos, s), tail, sfx))(_v) : _v._tag === "DCat" ? (({ parts }) => _recur3(out, pos, consParts$(parts, i, m, tail), sfx))(_v) : _v._tag === "DIndent" ? (({ doc: inner }) => _recur3(out, pos, WCons({ i: i + INDENT, m, d: inner }, tail), sfx))(_v) : _v._tag === "DLine" ? (({ hard, soft }) => and4(m === "flat", !hard) ? ((s) => _recur3(`${out}${s}`, pos + _Str_length3(s), tail, sfx))(soft ? "" : " ") : length3(sfx) === 0 ? _recur3(`${out}
${spaces(i)}`, i, tail, []) : _recur3(out, pos, consItems$(sfx, WCons({ i, m, d }, tail)), []))(_v) : _v._tag === "DGroup" ? (({ doc: inner, breaks }) => m === "flat" ? _recur3(out, pos, WCons({ i, m, d: inner }, tail), sfx) : breaks ? _recur3(out, pos, WCons({ i, m: "break", d: inner }, tail), sfx) : ((cand) => fits$2(width - pos, cand) ? _recur3(out, pos, cand, sfx) : _recur3(out, pos, WCons({ i, m: "break", d: inner }, tail), sfx))(WCons({ i, m: "flat", d: inner }, tail)))(_v) : _v._tag === "DLineSuffix" ? (({ doc: inner }) => _recur3(out, pos, tail, _Array_append4({ i, m, d: inner }, sfx)))(_v) : _v._tag === "DBreakParent" ? _recur3(out, pos, tail, sfx) : (() => {
      throw new Error("non-exhaustive match");
    })())(d))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(work);
    if (_step._tag === "recur") {
      [out, pos, work, sfx] = _step.args;
      continue;
    }
    return _step.value;
  }
};
var render = _curry6(2, render$);

var _t0 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t1 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["xmlns", "string"]
]);
var _t2 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["href", "string"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["target", "string"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t3 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["value", "string|number"]
]);
var _t4 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["name", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t5 = new Map([
  ["accessKey", "string"],
  ["alt", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["coords", "string"],
  ["dir", "enum:ltr,rtl,auto"],
  ["download", "string"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["href", "string"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["rel", "string"],
  ["role", "string"],
  ["shape", "enum:rect,circle,poly,default"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["target", "string"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t6 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["height", "string|number"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["src", "string"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["type", "string"],
  ["width", "string|number"]
]);
var _t7 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["data", "string"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["form", "string"],
  ["height", "string|number"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["name", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["type", "string"],
  ["width", "string|number"]
]);
var _t8 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["form", "string"],
  ["hidden", "bool"],
  ["htmlFor", "string"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["name", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t9 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["disabled", "bool"],
  ["draggable", "bool"],
  ["form", "string"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["name", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t10 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["autoFocus", "bool"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["disabled", "bool"],
  ["draggable", "bool"],
  ["form", "string"],
  ["formAction", "string"],
  ["formMethod", "string"],
  ["formNoValidate", "bool"],
  ["formTarget", "string"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["name", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["type", "enum:button,submit,reset"],
  ["value", "string"]
]);
var _t11 = new Map([
  ["accept", "string"],
  ["accessKey", "string"],
  ["alt", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoComplete", "string"],
  ["autoCorrect", "string"],
  ["autoFocus", "bool"],
  ["capture", "string|bool"],
  ["checked", "bool"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["defaultChecked", "bool"],
  ["defaultValue", "string|number"],
  ["dir", "enum:ltr,rtl,auto"],
  ["disabled", "bool"],
  ["draggable", "bool"],
  ["form", "string"],
  ["formAction", "string"],
  ["formMethod", "string"],
  ["formNoValidate", "bool"],
  ["formTarget", "string"],
  ["height", "string|number"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["list", "string"],
  ["max", "string|number"],
  ["maxLength", "number"],
  ["min", "string|number"],
  ["minLength", "number"],
  ["multiple", "bool"],
  ["name", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["pattern", "string"],
  ["placeholder", "string"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["readOnly", "bool"],
  ["ref", "any"],
  ["required", "bool"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["src", "string"],
  ["step", "string|number"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["type", "enum:text,password,checkbox,radio,number,email,file,hidden,image,range,reset,search,submit,tel,url,date,datetime-local,month,time,week,color"],
  ["value", "string|number"],
  ["width", "string|number"]
]);
var _t12 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["download", "string|bool"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["href", "string"],
  ["hrefLang", "string"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["ping", "string"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["referrerPolicy", "string"],
  ["rel", "string"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["target", "enum:_blank,_self,_parent,_top"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["type", "string"]
]);
var _t13 = new Map([
  ["accessKey", "string"],
  ["alt", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["crossOrigin", "enum:anonymous,use-credentials,"],
  ["decoding", "enum:async,sync,auto"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["height", "string|number"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["isMap", "bool"],
  ["key", "string|number"],
  ["lang", "string"],
  ["loading", "enum:lazy,eager"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["referrerPolicy", "string"],
  ["role", "string"],
  ["sizes", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["src", "string"],
  ["srcSet", "string"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["useMap", "string"],
  ["width", "string|number"]
]);
var _t14 = new Map([
  ["accessKey", "string"],
  ["action", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoComplete", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["encType", "string"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["method", "enum:get,post,dialog"],
  ["name", "string"],
  ["noValidate", "bool"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["target", "string"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t15 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoComplete", "string"],
  ["autoCorrect", "string"],
  ["autoFocus", "bool"],
  ["className", "string"],
  ["cols", "number"],
  ["contentEditable", "string|bool"],
  ["defaultValue", "string"],
  ["dir", "enum:ltr,rtl,auto"],
  ["disabled", "bool"],
  ["draggable", "bool"],
  ["form", "string"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["maxLength", "number"],
  ["minLength", "number"],
  ["name", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["placeholder", "string"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["readOnly", "bool"],
  ["ref", "any"],
  ["required", "bool"],
  ["role", "string"],
  ["rows", "number"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["value", "string"],
  ["wrap", "string"]
]);
var _t16 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoComplete", "string"],
  ["autoCorrect", "string"],
  ["autoFocus", "bool"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["defaultValue", "string|number"],
  ["dir", "enum:ltr,rtl,auto"],
  ["disabled", "bool"],
  ["draggable", "bool"],
  ["form", "string"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["multiple", "bool"],
  ["name", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["required", "bool"],
  ["role", "string"],
  ["size", "number"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["value", "string|number"]
]);
var _t17 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["disabled", "bool"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["label", "string"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["selected", "bool"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["value", "string|number"]
]);
var _t18 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["disabled", "bool"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["label", "string"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t19 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["form", "string"],
  ["hidden", "bool"],
  ["htmlFor", "string"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t20 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["height", "string|number"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["width", "string|number"]
]);
var _t21 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["open", "bool"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t22 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["autoPlay", "bool"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["controls", "bool"],
  ["crossOrigin", "string"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["loop", "bool"],
  ["muted", "bool"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["preload", "enum:none,metadata,auto,"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["src", "string"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t23 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["autoPlay", "bool"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["controls", "bool"],
  ["crossOrigin", "string"],
  ["dir", "enum:ltr,rtl,auto"],
  ["disablePictureInPicture", "bool"],
  ["disableRemotePlayback", "bool"],
  ["draggable", "bool"],
  ["height", "string|number"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["loop", "bool"],
  ["muted", "bool"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["playsInline", "bool"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["poster", "string"],
  ["preload", "enum:none,metadata,auto,"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["src", "string"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["width", "string|number"]
]);
var _t24 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["height", "string|number"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["media", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["sizes", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["src", "string"],
  ["srcSet", "string"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["type", "string"],
  ["width", "string|number"]
]);
var _t25 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["default", "bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["kind", "enum:subtitles,captions,descriptions,chapters,metadata"],
  ["label", "string"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["src", "string"],
  ["srclang", "string"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t26 = new Map([
  ["accessKey", "string"],
  ["allow", "string"],
  ["allowFullScreen", "bool"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["height", "string|number"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["loading", "enum:lazy,eager"],
  ["name", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["referrerPolicy", "string"],
  ["role", "string"],
  ["sandbox", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["src", "string"],
  ["srcDoc", "string"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["width", "string|number"]
]);
var _t27 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["cellPadding", "string|number"],
  ["cellSpacing", "string|number"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t28 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["colSpan", "number"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["headers", "string"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["rowSpan", "number"],
  ["scope", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t29 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["colSpan", "number"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["headers", "string"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["rowSpan", "number"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t30 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["span", "number"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t31 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["reversed", "bool"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["start", "number"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["type", "string"]
]);
var _t32 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["value", "number"]
]);
var _t33 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["charSet", "string"],
  ["className", "string"],
  ["content", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["httpEquiv", "string"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["name", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["property", "string"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t34 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["as", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["crossOrigin", "string"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["href", "string"],
  ["hrefLang", "string"],
  ["id", "string"],
  ["inputMode", "string"],
  ["integrity", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["media", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["referrerPolicy", "string"],
  ["rel", "string"],
  ["role", "string"],
  ["sizes", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["type", "string"]
]);
var _t35 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["async", "bool"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["crossOrigin", "string"],
  ["defer", "bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["integrity", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["noModule", "bool"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["referrerPolicy", "string"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["src", "string"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["type", "string"]
]);
var _t36 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["media", "string"],
  ["nonce", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t37 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["max", "string|number"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["value", "string|number"]
]);
var _t38 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["form", "string"],
  ["hidden", "bool"],
  ["high", "string|number"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["low", "string|number"],
  ["max", "string|number"],
  ["min", "string|number"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["optimum", "string|number"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"],
  ["value", "string|number"]
]);
var _t39 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dateTime", "string"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t40 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["cite", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t41 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["cite", "string"],
  ["className", "string"],
  ["contentEditable", "string|bool"],
  ["dateTime", "string"],
  ["dir", "enum:ltr,rtl,auto"],
  ["draggable", "bool"],
  ["hidden", "bool"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["ref", "any"],
  ["role", "string"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["title", "string"],
  ["translate", "enum:yes,no"]
]);
var _t42 = new Map([
  ["accessKey", "string"],
  ["ariaAtomic", "string|bool"],
  ["ariaBusy", "string|bool"],
  ["ariaChecked", "string|bool"],
  ["ariaColCount", "number"],
  ["ariaColIndex", "number"],
  ["ariaColSpan", "number"],
  ["ariaControls", "string"],
  ["ariaCurrent", "string|bool"],
  ["ariaDescribedBy", "string"],
  ["ariaDetails", "string"],
  ["ariaDisabled", "string|bool"],
  ["ariaErrorMessage", "string"],
  ["ariaExpanded", "string|bool"],
  ["ariaFlowTo", "string"],
  ["ariaHasPopup", "string|bool"],
  ["ariaHidden", "string|bool"],
  ["ariaInvalid", "string|bool"],
  ["ariaKeyShortcuts", "string"],
  ["ariaLabel", "string"],
  ["ariaLabelledBy", "string"],
  ["ariaLive", "enum:off,polite,assertive"],
  ["ariaModal", "string|bool"],
  ["ariaMultiSelectable", "string|bool"],
  ["ariaMultiline", "string|bool"],
  ["ariaOrientation", "enum:horizontal,vertical"],
  ["ariaPlaceholder", "string"],
  ["ariaPressed", "string|bool"],
  ["ariaReadOnly", "string|bool"],
  ["ariaRelevant", "string"],
  ["ariaRequired", "string|bool"],
  ["ariaRoleDescription", "string"],
  ["ariaRowCount", "number"],
  ["ariaRowIndex", "number"],
  ["ariaRowSpan", "number"],
  ["ariaSelected", "string|bool"],
  ["ariaSort", "enum:none,ascending,descending,other"],
  ["ariaValueMax", "number"],
  ["ariaValueMin", "number"],
  ["ariaValueNow", "number"],
  ["ariaValueText", "string"],
  ["autoCapitalize", "string"],
  ["autoCorrect", "string"],
  ["className", "string"],
  ["clipPath", "string"],
  ["contentEditable", "string|bool"],
  ["cx", "string|number"],
  ["cy", "string|number"],
  ["d", "string"],
  ["dir", "enum:ltr,rtl,auto"],
  ["dominantBaseline", "string"],
  ["draggable", "bool"],
  ["fill", "string"],
  ["fillOpacity", "string|number"],
  ["fillRule", "enum:nonzero,evenodd,inherit"],
  ["fontFamily", "string"],
  ["fontSize", "string|number"],
  ["fontWeight", "string|number"],
  ["gradientTransform", "string"],
  ["gradientUnits", "enum:userSpaceOnUse,objectBoundingBox"],
  ["height", "string|number"],
  ["hidden", "bool"],
  ["href", "string"],
  ["id", "string"],
  ["inputMode", "string"],
  ["key", "string|number"],
  ["lang", "string"],
  ["markerHeight", "string|number"],
  ["markerWidth", "string|number"],
  ["mask", "string"],
  ["offset", "string|number"],
  ["onAnimationEnd", "event"],
  ["onAnimationIteration", "event"],
  ["onAnimationStart", "event"],
  ["onAuxClick", "event"],
  ["onBlur", "event"],
  ["onCancel", "event"],
  ["onChange", "event"],
  ["onClick", "event"],
  ["onClose", "event"],
  ["onContextMenu", "event"],
  ["onCopy", "event"],
  ["onCut", "event"],
  ["onDoubleClick", "event"],
  ["onDrag", "event"],
  ["onDragEnd", "event"],
  ["onDragEnter", "event"],
  ["onDragLeave", "event"],
  ["onDragOver", "event"],
  ["onDragStart", "event"],
  ["onDrop", "event"],
  ["onError", "event"],
  ["onFocus", "event"],
  ["onGotPointerCapture", "event"],
  ["onInput", "event"],
  ["onInvalid", "event"],
  ["onKeyDown", "event"],
  ["onKeyPress", "event"],
  ["onKeyUp", "event"],
  ["onLoad", "event"],
  ["onLostPointerCapture", "event"],
  ["onMouseDown", "event"],
  ["onMouseEnter", "event"],
  ["onMouseLeave", "event"],
  ["onMouseMove", "event"],
  ["onMouseOut", "event"],
  ["onMouseOver", "event"],
  ["onMouseUp", "event"],
  ["onPaste", "event"],
  ["onPointerCancel", "event"],
  ["onPointerDown", "event"],
  ["onPointerEnter", "event"],
  ["onPointerLeave", "event"],
  ["onPointerMove", "event"],
  ["onPointerOut", "event"],
  ["onPointerOver", "event"],
  ["onPointerUp", "event"],
  ["onReset", "event"],
  ["onScroll", "event"],
  ["onScrollEnd", "event"],
  ["onSelect", "event"],
  ["onSubmit", "event"],
  ["onToggle", "event"],
  ["onTouchCancel", "event"],
  ["onTouchEnd", "event"],
  ["onTouchMove", "event"],
  ["onTouchStart", "event"],
  ["onTransitionCancel", "event"],
  ["onTransitionEnd", "event"],
  ["onTransitionRun", "event"],
  ["onTransitionStart", "event"],
  ["onWheel", "event"],
  ["opacity", "string|number"],
  ["orient", "string"],
  ["patternContentUnits", "enum:userSpaceOnUse,objectBoundingBox"],
  ["patternUnits", "enum:userSpaceOnUse,objectBoundingBox"],
  ["points", "string"],
  ["popover", "string|bool"],
  ["popoverTarget", "string"],
  ["popoverTargetAction", "enum:toggle,show,hide"],
  ["preserveAspectRatio", "string"],
  ["r", "string|number"],
  ["ref", "any"],
  ["refX", "string|number"],
  ["refY", "string|number"],
  ["role", "string"],
  ["rx", "string|number"],
  ["ry", "string|number"],
  ["slot", "string"],
  ["spellCheck", "bool"],
  ["spreadMethod", "enum:pad,reflect,repeat"],
  ["stopColor", "string"],
  ["stopOpacity", "string|number"],
  ["stroke", "string"],
  ["strokeDasharray", "string|number"],
  ["strokeDashoffset", "string|number"],
  ["strokeLinecap", "enum:butt,round,square,inherit"],
  ["strokeLinejoin", "enum:miter,round,bevel,inherit"],
  ["strokeOpacity", "string|number"],
  ["strokeWidth", "string|number"],
  ["style", "any"],
  ["tabIndex", "number"],
  ["textAnchor", "enum:start,middle,end,inherit"],
  ["title", "string"],
  ["transform", "string"],
  ["translate", "enum:yes,no"],
  ["viewBox", "string"],
  ["width", "string|number"],
  ["x", "string|number"],
  ["x1", "string|number"],
  ["x2", "string|number"],
  ["xlinkHref", "string"],
  ["xmlns", "string"],
  ["y", "string|number"],
  ["y1", "string|number"],
  ["y2", "string|number"]
]);
var intrinsicElements = new Map([
  ["a", _t12],
  ["abbr", _t0],
  ["address", _t0],
  ["area", _t5],
  ["article", _t0],
  ["aside", _t0],
  ["audio", _t22],
  ["b", _t0],
  ["base", _t2],
  ["bdi", _t0],
  ["bdo", _t0],
  ["blockquote", _t40],
  ["body", _t0],
  ["br", _t0],
  ["button", _t10],
  ["canvas", _t20],
  ["caption", _t0],
  ["circle", _t42],
  ["cite", _t0],
  ["clipPath", _t42],
  ["code", _t0],
  ["col", _t30],
  ["colgroup", _t30],
  ["data", _t3],
  ["datalist", _t0],
  ["dd", _t0],
  ["defs", _t42],
  ["del", _t41],
  ["details", _t21],
  ["dfn", _t0],
  ["dialog", _t21],
  ["div", _t0],
  ["dl", _t0],
  ["dt", _t0],
  ["em", _t0],
  ["embed", _t6],
  ["fieldset", _t9],
  ["figcaption", _t0],
  ["figure", _t0],
  ["footer", _t0],
  ["foreignObject", _t42],
  ["form", _t14],
  ["g", _t42],
  ["h1", _t0],
  ["h2", _t0],
  ["h3", _t0],
  ["h4", _t0],
  ["h5", _t0],
  ["h6", _t0],
  ["head", _t0],
  ["header", _t0],
  ["hgroup", _t0],
  ["hr", _t0],
  ["html", _t1],
  ["i", _t0],
  ["iframe", _t26],
  ["image", _t42],
  ["img", _t13],
  ["input", _t11],
  ["ins", _t41],
  ["kbd", _t0],
  ["label", _t19],
  ["legend", _t0],
  ["li", _t32],
  ["line", _t42],
  ["linearGradient", _t42],
  ["link", _t34],
  ["main", _t0],
  ["map", _t4],
  ["mark", _t0],
  ["marker", _t42],
  ["mask", _t42],
  ["menu", _t0],
  ["meta", _t33],
  ["meter", _t38],
  ["nav", _t0],
  ["noscript", _t0],
  ["object", _t7],
  ["ol", _t31],
  ["optgroup", _t18],
  ["option", _t17],
  ["output", _t8],
  ["p", _t0],
  ["path", _t42],
  ["pattern", _t42],
  ["picture", _t0],
  ["polygon", _t42],
  ["polyline", _t42],
  ["pre", _t0],
  ["progress", _t37],
  ["q", _t40],
  ["radialGradient", _t42],
  ["rect", _t42],
  ["rp", _t0],
  ["rt", _t0],
  ["ruby", _t0],
  ["s", _t0],
  ["samp", _t0],
  ["script", _t35],
  ["search", _t0],
  ["section", _t0],
  ["select", _t16],
  ["slot", _t4],
  ["small", _t0],
  ["source", _t24],
  ["span", _t0],
  ["stop", _t42],
  ["strong", _t0],
  ["style", _t36],
  ["sub", _t0],
  ["summary", _t0],
  ["sup", _t0],
  ["svg", _t42],
  ["symbol", _t42],
  ["table", _t27],
  ["tbody", _t0],
  ["td", _t29],
  ["template", _t0],
  ["text", _t42],
  ["textarea", _t15],
  ["tfoot", _t0],
  ["th", _t28],
  ["thead", _t0],
  ["time", _t39],
  ["title", _t0],
  ["tr", _t0],
  ["track", _t25],
  ["tspan", _t42],
  ["u", _t0],
  ["ul", _t0],
  ["use", _t42],
  ["var", _t0],
  ["video", _t23],
  ["wbr", _t0]
]);
var jsxMismatchHints = new Map([
  ["autocomplete", "In JSX, use 'autoComplete' instead of 'autocomplete'."],
  ["autofocus", "In JSX, use 'autoFocus' instead of 'autofocus'."],
  ["class", "In JSX, use 'className' instead of 'class'."],
  ["contenteditable", "In JSX, use 'contentEditable' instead of 'contenteditable'."],
  ["for", "In JSX, use 'htmlFor' instead of 'for'."],
  ["maxlength", "In JSX, use 'maxLength' instead of 'maxlength'."],
  ["minlength", "In JSX, use 'minLength' instead of 'minlength'."],
  ["onblur", "In JSX, event handlers are camelCase: use 'onBlur' instead of 'onblur'."],
  ["onchange", "In JSX, event handlers are camelCase: use 'onChange' instead of 'onchange'."],
  ["onclick", "In JSX, event handlers are camelCase: use 'onClick' instead of 'onclick'."],
  ["onfocus", "In JSX, event handlers are camelCase: use 'onFocus' instead of 'onfocus'."],
  ["oninput", "In JSX, event handlers are camelCase: use 'onInput' instead of 'oninput'."],
  ["onkeydown", "In JSX, event handlers are camelCase: use 'onKeyDown' instead of 'onkeydown'."],
  ["onkeyup", "In JSX, event handlers are camelCase: use 'onKeyUp' instead of 'onkeyup'."],
  ["onsubmit", "In JSX, event handlers are camelCase: use 'onSubmit' instead of 'onsubmit'."],
  ["readonly", "In JSX, use 'readOnly' instead of 'readonly'."],
  ["spellcheck", "In JSX, use 'spellCheck' instead of 'spellcheck'."],
  ["strokelinecap", "In JSX, use 'strokeLinecap' instead of 'strokelinecap'."],
  ["strokelinejoin", "In JSX, use 'strokeLinejoin' instead of 'strokelinejoin'."],
  ["strokewidth", "In JSX, use 'strokeWidth' instead of 'strokewidth'."],
  ["tabindex", "In JSX, use 'tabIndex' instead of 'tabindex'."],
  ["viewbox", "In JSX, use 'viewBox' instead of 'viewbox'."]
]);

var jxTokName = (t) => {
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
var jxEofTok = { tok: TEof, start: 0, end: 0, doc: None6 };
var jxTokAt$ = (toks, i) => _Option_unwrapOr3(jxEofTok, _Array_get5(i, toks));
var jxTokAt = _curry7(2, jxTokAt$);
var jxSpanOf = (lt) => ({ start: lt.start, end: lt.end });
var jxToEnd = _curry7(3, (start, toks, pos) => ({ start: start.start, end: jxTokAt$(toks, pos - 1).end }));
var jxErrAt = _curry7(2, (message, lt) => Err3({ message, start: lt.start, end: lt.end }));
var jxExpectTok$ = (t, toks, pos) => {
  const lt = jxTokAt$(toks, pos);
  return eq4(lt.tok, t) ? Ok3(pos + 1) : jxErrAt(`expected ${jxTokName(t)}, got ${jxTokName(lt.tok)}`, lt);
};
var jxExpectTok = _curry7(3, jxExpectTok$);
var jxExpectId$ = (toks, pos) => {
  const lt = jxTokAt$(toks, pos);
  const $match = lt.tok;
  switch ($match._tag) {
    case "TId": {
      const { value: name } = $match;
      return Ok3(_tuple3({ name, span: jxSpanOf(lt) }, pos + 1));
    }
    default: {
      const t = $match;
      return jxErrAt(`expected id, got ${jxTokName(t)}`, lt);
    }
  }
};
var jxExpectId = _curry7(2, jxExpectId$);
var jxKeywordText = (t) => {
  const $match = t;
  switch ($match._tag) {
    case "TLet": {
      return Some6("let");
    }
    case "TType": {
      return Some6("type");
    }
    case "TExtern": {
      return Some6("extern");
    }
    case "TSwitch": {
      return Some6("switch");
    }
    case "TLoop": {
      return Some6("loop");
    }
    case "TRecur": {
      return Some6("recur");
    }
    case "TDo": {
      return Some6("do");
    }
    case "TImport": {
      return Some6("import");
    }
    case "TExport": {
      return Some6("export");
    }
    default: {
      return None6;
    }
  }
};
var jxExpectLabel$ = (toks, pos) => {
  const lt = jxTokAt$(toks, pos);
  return _Option_match6(jxKeywordText(lt.tok), () => jxExpectId$(toks, pos), (name) => Ok3(_tuple3({ name, span: jxSpanOf(lt) }, pos + 1)));
};
var jxExpectLabel = _curry7(2, jxExpectLabel$);
var jxAttrNameFrom$ = (toks, pos, acc) => {
  const minusTok = jxTokAt$(toks, pos);
  const partTok = jxTokAt$(toks, pos + 1);
  return and5(and5(minusTok.tok._tag === "TMinus", eq4(minusTok.start, acc.span.end)), eq4(partTok.start, minusTok.end)) ? ((_v) => _v._tag === "Ok" ? (({ value: [part, p1] }) => jxAttrNameFrom$(toks, p1, { name: `${acc.name}-${part.name}`, span: { start: acc.span.start, end: part.span.end } }))(_v) : _v._tag === "Err" ? _tuple3(acc, pos) : (() => {
    throw new Error("non-exhaustive match");
  })())(jxExpectLabel$(toks, pos + 1)) : _tuple3(acc, pos);
};
var jxAttrNameFrom = _curry7(3, jxAttrNameFrom$);
var jxExpectAttrName$ = (toks, pos) => _Result_map2(([head, p1]) => jxAttrNameFrom$(toks, p1, head), jxExpectLabel$(toks, pos));
var jxExpectAttrName = _curry7(2, jxExpectAttrName$);
var jxIsUpper = (s) => _Option_exists2((n) => and5(n >= 65, n <= 90), _Str_codeAt3(0, s));
var jxExprSpan = (e) => {
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
var makeJsxCall = _curry7(7, (tagExpr, fields, spreadOpt, children, startTok, toks, endPos) => {
  const fullSpan = jxToEnd(jxSpanOf(startTok), toks, endPos);
  const pragmaRef = ERef("h", jxSpanOf(startTok));
  const propsRecord = ERecord(fields, spreadOpt, fullSpan);
  const childrenArr = EArr(children, fullSpan);
  return ECall(pragmaRef, [tagExpr, propsRecord, childrenArr], Some6("jsx"), fullSpan);
});
var parseJsxAttributes$ = (toks, pos, fieldsAcc, spreadAcc, parseExpr) => {
  const tk = jxTokAt$(toks, pos).tok;
  const nxt = jxTokAt$(toks, pos + 1).tok;
  return or5(tk._tag === "TGt", and5(tk._tag === "TSlash", nxt._tag === "TGt")) ? Ok3(_tuple3(fieldsAcc, spreadAcc, pos)) : tk._tag === "TLbrace" ? _Result_flatMap2((p1) => _Result_flatMap2(([spExpr, p2]) => _Result_flatMap2((p3) => parseJsxAttributes$(toks, p3, fieldsAcc, Some6(spExpr), parseExpr), jxExpectTok$(TRbrace, toks, p2)), parseExpr(toks, p1)), jxExpectTok$(TSpread, toks, pos + 1)) : _Result_flatMap2(([attrId, p1]) => (([valExpr, p2]) => {
    const field = { name: attrId.name, nameSpan: attrId.span, value: valExpr };
    return parseJsxAttributes$(toks, p2, _Array_append5(field, fieldsAcc), spreadAcc, parseExpr);
  })(jxTokAt$(toks, p1).tok._tag === "TEq" ? ((pEq) => ((_v) => _v._tag === "TStr" ? (({ value: v }) => _tuple3(EStr(v, jxSpanOf(jxTokAt$(toks, pEq))), pEq + 1))(_v) : _v._tag === "TLbrace" ? ((_v) => _v._tag === "Ok" ? (({ value: [e, pR] }) => _tuple3(e, pR + 1))(_v) : _v._tag === "Err" ? _tuple3(EBool(true, attrId.span), pEq) : (() => {
    throw new Error("non-exhaustive match");
  })())(parseExpr(toks, pEq + 1)) : _tuple3(EBool(true, attrId.span), pEq))(jxTokAt$(toks, pEq).tok))(p1 + 1) : _tuple3(EBool(true, attrId.span), p1)), jxExpectAttrName$(toks, pos));
};
var parseJsxAttributes = _curry7(5, parseJsxAttributes$);
var parseJsxChildren$ = (expectedTag, toks, pos, acc, parseExpr) => {
  const lt = jxTokAt$(toks, pos);
  const nxt = jxTokAt$(toks, pos + 1);
  return lt.tok._tag === "TEof" ? jxErrAt(expectedTag === "" ? "unclosed JSX fragment" : "unclosed JSX tag", lt) : and5(lt.tok._tag === "TLt", nxt.tok._tag === "TSlash") ? expectedTag === "" ? _Result_flatMap2((p1) => Ok3(_tuple3(acc, p1)), jxExpectTok$(TGt, toks, pos + 2)) : _Result_flatMap2(([closingId, p1]) => _Result_flatMap2((p2) => eq4(closingId.name, expectedTag) ? Ok3(_tuple3(acc, p2)) : jxErrAt("mismatched JSX closing tag", lt), jxExpectTok$(TGt, toks, p1)), jxExpectId$(toks, pos + 2)) : lt.tok._tag === "TLt" ? _Result_flatMap2(([childJsx, p1]) => parseJsxChildren$(expectedTag, toks, p1, _Array_append5(SEExpr(childJsx), acc), parseExpr), parseJsx$(toks, pos, parseExpr)) : lt.tok._tag === "TLbrace" ? nxt.tok._tag === "TSpread" ? _Result_flatMap2(([spChild, p1]) => _Result_flatMap2((p2) => parseJsxChildren$(expectedTag, toks, p2, _Array_append5(SESpread(spChild), acc), parseExpr), jxExpectTok$(TRbrace, toks, p1)), parseExpr(toks, pos + 2)) : _Result_flatMap2(([childExpr, p1]) => _Result_flatMap2((p2) => parseJsxChildren$(expectedTag, toks, p2, _Array_append5(SEExpr(childExpr), acc), parseExpr), jxExpectTok$(TRbrace, toks, p1)), parseExpr(toks, pos + 1)) : ((_v) => _v._tag === "TStr" ? (({ value: v }) => parseJsxChildren$(expectedTag, toks, pos + 1, _Array_append5(SEExpr(EStr(v, jxSpanOf(lt))), acc), parseExpr))(_v) : _v._tag === "TNum" ? (({ value: v, raw }) => parseJsxChildren$(expectedTag, toks, pos + 1, _Array_append5(SEExpr(ENum(v, raw, jxSpanOf(lt))), acc), parseExpr))(_v) : _v._tag === "TBool" ? (({ value: v }) => parseJsxChildren$(expectedTag, toks, pos + 1, _Array_append5(SEExpr(EBool(v, jxSpanOf(lt))), acc), parseExpr))(_v) : _v._tag === "TId" ? (({ value: v }) => parseJsxChildren$(expectedTag, toks, pos + 1, _Array_append5(SEExpr(EStr(v, jxSpanOf(lt))), acc), parseExpr))(_v) : jxErrAt("unexpected token in JSX children", lt))(lt.tok);
};
var parseJsxChildren = _curry7(5, parseJsxChildren$);
var parseJsx$ = (toks, pos, parseExpr) => {
  const startTok = jxTokAt$(toks, pos);
  const nxt = jxTokAt$(toks, pos + 1);
  return nxt.tok._tag === "TGt" ? _Result_flatMap2(([children, p1]) => Ok3(_tuple3(makeJsxCall(EStr("Fragment", jxSpanOf(startTok)), [], None6, children, startTok, toks, p1), p1)), parseJsxChildren$("", toks, pos + 2, [], parseExpr)) : _Result_flatMap2(([firstId, p1]) => ((tagRef) => ((tagNameStr) => _Result_flatMap2(([fields, spreadOpt, p2]) => {
    const isSelfClosing = jxTokAt$(toks, p2).tok._tag === "TSlash";
    return _Result_flatMap2((p3) => isSelfClosing ? Ok3(_tuple3(makeJsxCall(tagRef, fields, spreadOpt, [], startTok, toks, p3), p3)) : _Result_flatMap2(([children, p4]) => Ok3(_tuple3(makeJsxCall(tagRef, fields, spreadOpt, children, startTok, toks, p4), p4)), parseJsxChildren$(tagNameStr, toks, p3, [], parseExpr)), isSelfClosing ? jxExpectTok$(TGt, toks, p2 + 1) : jxExpectTok$(TGt, toks, p2));
  }, parseJsxAttributes$(toks, p1, [], None6, parseExpr)))(firstId.name))(jxIsUpper(firstId.name) ? ERef(firstId.name, firstId.span) : EStr(firstId.name, firstId.span)), jxExpectId$(toks, pos + 1));
};
var parseJsx = _curry7(3, parseJsx$);
var parseJsxAtom$ = (toks, pos, parseExpr) => jxTokAt$(toks, pos).tok._tag === "TLt" ? _Result_map2((claim) => Some6(claim), parseJsx$(toks, pos, parseExpr)) : Ok3(None6);
var parseJsxAtom = _curry7(3, parseJsxAtom$);
var seqElemExpr = (el) => {
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
var inferJsxArrElems = _curry7(3, (elements, st, inferExpr) => ((_v) => _v.length === 0 ? Ok3(st) : _v.length >= 1 ? (([el, ...rest]) => _Result_flatMap2(([, st1]) => inferJsxArrElems(rest, st1, inferExpr), inferExpr(seqElemExpr(el), st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elements));
var inferJsxChildren = _curry7(3, (children, st, inferExpr) => ((_v) => _v.length === 0 ? Ok3(st) : _v.length >= 1 && _v[0]._tag === "EArr" ? (([{ elements }, ...rest]) => _Result_flatMap2((st1) => inferJsxChildren(rest, st1, inferExpr), inferJsxArrElems(elements, st, inferExpr)))(_v) : _v.length >= 1 ? (([child, ...rest]) => _Result_flatMap2(([, st1]) => inferJsxChildren(rest, st1, inferExpr), inferExpr(child, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(children));
var rowField$ = (row, label) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { label: l, fieldType, rest } = $match;
      return eq4(l, label) ? Some6(fieldType) : rowField$(rest, label);
    }
    case "RowEmpty": {
      return None6;
    }
    case "RowVar": {
      return None6;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var rowField = _curry7(2, rowField$);
var fieldNamed = _curry7(2, (label, fields) => match(fields).with((_v) => _v.length === 0, () => false).with((_v) => _v.length >= 1, ([f, ...rest]) => or5(eq4(f.name, label), fieldNamed(label, rest))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var recordHasAttr$ = (expr, label) => {
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
var recordHasAttr = _curry7(2, recordHasAttr$);
var jsxChildCount = (restArgs) => ((_v) => _v.length >= 1 && _v[0]._tag === "EArr" ? (([{ elements }]) => length4(elements))(_v) : 0)(restArgs);
var jsxPropsWithSynthesizedChildren$ = (propsT, propsExpr, expectedRow, restArgs) => _Option_match6(rowField$(expectedRow, "children"), () => propsT, (expectedChildren) => {
  const $match = propsT;
  switch ($match._tag) {
    case "TyRecord": {
      const { row: prow } = $match;
      return or5(recordHasAttr$(propsExpr, "children"), jsxChildCount(restArgs) === 0) ? propsT : tRecord(rExtend("children", expectedChildren, prow));
    }
    default: {
      return propsT;
    }
  }
});
var jsxPropsWithSynthesizedChildren = _curry7(4, jsxPropsWithSynthesizedChildren$);
var attrKindType = (kind) => kind === "string" ? Some6(tPrim("string")) : kind === "number" ? Some6(tPrim("number")) : kind === "bool" ? Some6(tPrim("bool")) : kind === "string|number" ? Some6(tUnion([tPrim("string"), tPrim("number")])) : kind === "string|bool" ? Some6(tUnion([tPrim("string"), tPrim("bool")])) : _Str_startsWith2("enum:", kind) ? Some6(tUnion(map2(tLit, _Str_split2(",", _Str_slice2(5, _Str_length4(kind), kind))))) : None6;
var mismatchHint = (name) => ((_v) => _v === "class" ? Some6("In JSX, use 'className' instead of 'class'.") : _v === "for" ? Some6("In JSX, use 'htmlFor' instead of 'for'.") : _v === "tabindex" ? Some6("In JSX, use 'tabIndex' instead of 'tabindex'.") : _v === "autofocus" ? Some6("In JSX, use 'autoFocus' instead of 'autofocus'.") : _v === "autocomplete" ? Some6("In JSX, use 'autoComplete' instead of 'autocomplete'.") : _v === "readonly" ? Some6("In JSX, use 'readOnly' instead of 'readonly'.") : _v === "maxlength" ? Some6("In JSX, use 'maxLength' instead of 'maxlength'.") : _v === "minlength" ? Some6("In JSX, use 'minLength' instead of 'minlength'.") : _v === "spellcheck" ? Some6("In JSX, use 'spellCheck' instead of 'spellcheck'.") : _v === "contenteditable" ? Some6("In JSX, use 'contentEditable' instead of 'contenteditable'.") : _v === "viewbox" ? Some6("In JSX, use 'viewBox' instead of 'viewbox'.") : _v === "strokewidth" ? Some6("In JSX, use 'strokeWidth' instead of 'strokewidth'.") : _v === "strokelinecap" ? Some6("In JSX, use 'strokeLinecap' instead of 'strokelinecap'.") : _v === "strokelinejoin" ? Some6("In JSX, use 'strokeLinejoin' instead of 'strokelinejoin'.") : _v === "onclick" ? Some6("In JSX, event handlers are camelCase: use 'onClick' instead of 'onclick'.") : _v === "onchange" ? Some6("In JSX, event handlers are camelCase: use 'onChange' instead of 'onchange'.") : _v === "oninput" ? Some6("In JSX, event handlers are camelCase: use 'onInput' instead of 'oninput'.") : _v === "onkeydown" ? Some6("In JSX, event handlers are camelCase: use 'onKeyDown' instead of 'onkeydown'.") : _v === "onkeyup" ? Some6("In JSX, event handlers are camelCase: use 'onKeyUp' instead of 'onkeyup'.") : _v === "onsubmit" ? Some6("In JSX, event handlers are camelCase: use 'onSubmit' instead of 'onsubmit'.") : _v === "onfocus" ? Some6("In JSX, event handlers are camelCase: use 'onFocus' instead of 'onfocus'.") : _v === "onblur" ? Some6("In JSX, event handlers are camelCase: use 'onBlur' instead of 'onblur'.") : None6)(name);
var noJxSuggestions = [];
var jxTypeErr = _curry7(2, (message, sp) => Err3({ message, start: sp.start, end: sp.end, help: None6, suggestions: noJxSuggestions }));
var isHandlerName = (name) => and5(and5(_Str_startsWith2("on", name), _Str_length4(name) > 2), jxIsUpper(_Str_slice2(2, 3, name)));
var isFnOrOpen = (t) => {
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
var checkHandler = _curry7(5, (name, value, st, api, cont) => _Result_flatMap2(([valT, st1]) => isFnOrOpen(zonk(valT, st1)) ? cont(st1) : jxTypeErr(`Expected function for event handler '${name}'`, jxExprSpan(value)), api.inferExpr(value, st)));
var unknownProp = _curry7(4, (tag, name, value, schema) => {
  const hint = closestName(name, _Map_keys2(schema));
  const did = _Option_match6(hint, () => "", (s) => ` Did you mean '${s}'?`);
  return jxTypeErr(`Property '${name}' does not exist on '<${tag}>'.${did}`, jxExprSpan(value));
});
var noteProp$ = (f, t, st) => recordBinder(f.nameSpan, t, "property", f.name, None6, st);
var noteProp = _curry7(3, noteProp$);
var handlerType = TyFn(tPrim("Event"), tPrim("unit"));
var inferIntrinsicFields = _curry7(5, (tag, fields, st, api, schema) => ((_v) => _v.length === 0 ? Ok3(st) : _v.length >= 1 ? (([f, ...rest]) => ((cont) => _Option_match6(mismatchHint(f.name), () => or5(_Str_startsWith2("data-", f.name), _Str_startsWith2("aria-", f.name)) ? _Result_flatMap2(([valT, st1]) => cont(noteProp$(f, valT, st1)), api.inferExpr(f.value, st)) : _Option_match6(schema, () => _Result_flatMap2(([valT, st1]) => cont(noteProp$(f, valT, st1)), api.inferExpr(f.value, st)), (m) => {
  const expected = _Option_match6(_Map_get2(f.name, m), () => isHandlerName(f.name) ? Some6("event") : None6, (k) => Some6(k));
  return _Option_match6(expected, () => unknownProp(tag, f.name, f.value, m), (kind) => kind === "event" ? checkHandler(f.name, f.value, st, api, (st1) => cont(noteProp$(f, handlerType, st1))) : kind === "any" ? _Result_flatMap2(([, st1]) => cont(noteProp$(f, tPrim("any"), st1)), api.inferExpr(f.value, st)) : _Option_match6(attrKindType(kind), () => _Result_flatMap2(([, st1]) => cont(st1), api.inferExpr(f.value, st)), (expectedT) => _Result_flatMap2(([valT, st1]) => _Result_flatMap2((st2) => cont(noteProp$(f, expectedT, st2)), api.unify(valT, expectedT, st1, jxExprSpan(f.value))), api.inferExpr(f.value, st))));
}), (msg) => jxTypeErr(msg, jxExprSpan(f.value))))((st1) => inferIntrinsicFields(tag, rest, st1, api, schema)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields));
var inferFragmentFields = _curry7(3, (fields, st, api) => match(fields).with((_v) => _v.length === 0, () => Ok3(st)).with((_v) => _v.length >= 1, ([f, ...rest]) => f.name === "key" ? _Result_flatMap2(([, st1]) => inferFragmentFields(rest, st1, api), api.inferExpr(f.value, st)) : jxTypeErr(`JSX fragments only accept the 'key' prop, got '${f.name}'`, jxExprSpan(f.value))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var unknownTagErr = _curry7(2, (tagName, sp) => {
  const hint = closestName(tagName, _Map_keys2(intrinsicElements));
  const did = _Option_match6(hint, () => "", (s) => ` Did you mean '<${s}>'?`);
  return jxTypeErr(`Unknown JSX element '<${tagName}>'.${did}`, sp);
});
var inferStringTag = _curry7(5, (tagName, tagExpr, fields, st, api) => tagName === "Fragment" ? inferFragmentFields(fields, st, api) : _Option_match6(_Map_get2(tagName, intrinsicElements), () => _Str_contains("-", tagName) ? inferIntrinsicFields(tagName, fields, st, api, None6) : unknownTagErr(tagName, jxExprSpan(tagExpr)), (schema) => inferIntrinsicFields(tagName, fields, st, api, Some6(schema))));
var noteComponentProps$ = (propsExpr, expectedRow, st) => {
  const $match = propsExpr;
  switch ($match._tag) {
    case "ERecord": {
      const { fields } = $match;
      return reduce(_curry7(2, (acc, f) => _Option_match6(rowField$(expectedRow, f.name), () => acc, (t) => noteProp$(f, zonk(t, acc), acc))), st, fields);
    }
    default: {
      return st;
    }
  }
};
var noteComponentProps = _curry7(3, noteComponentProps$);
var inferJsxCall = _curry7(5, (tagExpr, propsExpr, restArgs, st, api) => _Result_flatMap2(([tagT, st1]) => _Result_flatMap2(([propsT, st2]) => _Result_flatMap2((st3) => {
  const zonkedTag = zonk(tagT, st3);
  const $match = zonkedTag;
  switch ($match._tag) {
    case "TyFn": {
      const { from, to } = $match;
      const $match$ = from;
      switch ($match$._tag) {
        case "TyRecord": {
          const { row: expectedRow } = $match$;
          const propsForCheck = jsxPropsWithSynthesizedChildren$(propsT, propsExpr, expectedRow, restArgs);
          return _Result_map2((st4) => _tuple3(zonk(to, st4), noteComponentProps$(propsExpr, expectedRow, st4)), api.unify(propsForCheck, from, st3, jxExprSpan(propsExpr)));
        }
        default: {
          return Ok3(_tuple3(tPrim("VNode"), st3));
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
              return _Result_map2((st4) => _tuple3(tPrim("VNode"), st4), inferStringTag(tagName, tagExpr, fields, st3, api));
            }
            default: {
              return Ok3(_tuple3(tPrim("VNode"), st3));
            }
          }
        }
        default: {
          return Ok3(_tuple3(tPrim("VNode"), st3));
        }
      }
    }
  }
}, inferJsxChildren(restArgs, st2, api.inferExpr)), api.inferExpr(propsExpr, st1)), api.inferExpr(tagExpr, st)));
var inferJsxCallHook = _curry7(5, (_fn, args, origin, st, api) => _Option_match6(origin, () => Ok3(None6), (o) => o === "jsx" ? ((_v) => _v.length >= 2 ? (([tagExpr, propsExpr, ...rest]) => _Result_map2((r) => Some6(r), inferJsxCall(tagExpr, propsExpr, rest, st, api)))(_v) : Ok3(None6))(args) : Ok3(None6)));
var vnodeTs = (api) => {
  const printed = api.tsType(TyCon("VNode", []));
  return printed === "VNode" ? "any" : printed;
};
var returnsVNode = (t) => ((_v) => _v._tag === "TyFn" ? (({ to: toT }) => returnsVNode(toT))(_v) : _v._tag === "TyCon" && _v.name === "VNode" ? true : false)(t);
var isComponentType = (t) => {
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
var jsxBodied = (body) => ((_v) => _v._tag === "ELambda" ? (({ body: inner }) => jsxBodied(inner))(_v) : _v._tag === "ECall" && _v.origin._tag === "Some" && _v.origin.value === "jsx" ? true : false)(body);
var isJsxComponentLambda = (value) => {
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
var isHandlerLabel = (label) => {
  const third = _Option_exists2((n) => and5(n >= 65, n <= 90), _Str_codeAt3(2, label));
  return and5(_Str_startsWith2("on", label), third);
};
var componentPropFieldTs = _curry7(3, (label, t, api) => ((_v) => _v._tag === "TyVar" ? isHandlerLabel(label) ? "() => void" : "unknown" : _v._tag === "TyCon" && _v.name === "VNode" ? ((printed) => printed === "any" ? "unknown" : printed)(vnodeTs(api)) : api.tsType(t))(t));
var propFieldsFrom = _curry7(3, (row, api, acc) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { label, fieldType, rest } = $match;
      return propFieldsFrom(rest, api, _Array_append5(`${label}: ${componentPropFieldTs(label, fieldType, api)}`, acc));
    }
    case "RowVar": {
      return _tuple3(acc, true);
    }
    default: {
      return _tuple3(acc, false);
    }
  }
});
var hasField$ = (fields, name) => _Option_isSome(_Array_find((f) => _Str_startsWith2(`${name}:`, f), fields));
var hasField = _curry7(2, hasField$);
var componentPropsTs = _curry7(2, (row, api) => (([fields0, open]) => {
  const fields1 = and5(open, !hasField$(fields0, "children")) ? _Array_append5("children?: any", fields0) : fields0;
  const fields = and5(open, !hasField$(fields1, "className")) ? _Array_append5("className?: string", fields1) : fields1;
  return length4(fields) === 0 ? "{}" : `{ ${_Str_join3("; ", fields)} }`;
})(propFieldsFrom(row, api, [])));
var componentPropsParamTs = _curry7(2, (t, api) => {
  const $match = t;
  switch ($match._tag) {
    case "TyRecord": {
      const { row } = $match;
      return _Option_match6(api.aliasOf(row), () => componentPropsTs(row, api), (name) => name);
    }
    case "TyVar": {
      return "Record<string, unknown>";
    }
    default: {
      return api.tsType(t);
    }
  }
});
var extraParamTs = _curry7(2, (t, api) => ((_v) => _v._tag === "TyVar" ? "unknown" : _v._tag === "TyCon" && _v.name === "VNode" ? vnodeTs(api) : api.tsType(t))(t));
var extraParamsFrom = _curry7(4, (t, api, i, acc) => {
  const $match = t;
  switch ($match._tag) {
    case "TyFn": {
      const { from: fromT, to: toT } = $match;
      return extraParamsFrom(toT, api, i + 1, _Array_append5(`_${show2(i)}: ${extraParamTs(fromT, api)}`, acc));
    }
    default: {
      return acc;
    }
  }
});
var componentSig = _curry7(2, (t, api) => {
  const $match = t;
  switch ($match._tag) {
    case "TyFn": {
      const { from: fromT, to: toT } = $match;
      const props = `props: ${componentPropsParamTs(fromT, api)}`;
      const extras = extraParamsFrom(toT, api, 1, []);
      return length4(extras) === 0 ? `(${props}) => ${vnodeTs(api)}` : `_Curry<[${_Str_join3(", ", _Array_concat3([props], extras))}], ${vnodeTs(api)}>`;
    }
    default: {
      return `(props: Record<string, unknown>) => ${vnodeTs(api)}`;
    }
  }
});
var componentBindingTs = _curry7(3, (value, t, api) => ((_v) => _v._tag === "TyCon" && _v.name === "VNode" && _v.args.length === 0 ? Some6(vnodeTs(api)) : or5(isComponentType(t), isJsxComponentLambda(value)) ? Some6(componentSig(t, api)) : None6)(t));
var jsxShape = (e) => ((_v) => _v._tag === "ECall" && _v.fn._tag === "ERef" && _v.fn.name === "h" && _v.args.length === 3 && _v.args[1]._tag === "ERecord" && _v.args[2]._tag === "EArr" && _v.origin._tag === "Some" && _v.origin.value === "jsx" ? (({ args: [tag, { fields, spread }, { elements: children }] }) => Some6({ tag, fields, spread, children }))(_v) : None6)(e);
var isFragment = (tag) => ((_v) => _v._tag === "EStr" && _v.value === "Fragment" ? true : false)(tag);
var jsxTag$ = (tag, api) => {
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
var jsxTag = _curry7(2, jsxTag$);
var jsxHoleD$ = (open, e, api) => cat([txt(open), api.exprD(e), txt("}")]);
var jsxHoleD = _curry7(3, jsxHoleD$);
var jsxAttrD$ = (name, value, api) => ((_v) => _v._tag === "EBool" && _v.value === true ? (({ span: sp }) => eq4(api.sourceText(sp.start, sp.end), name) ? txt(name) : jsxHoleD$(`${name}={`, value, api))(_v) : _v._tag === "EStr" ? (({ value: v }) => txt(`${name}=${api.strLit(v)}`))(_v) : jsxHoleD$(`${name}={`, value, api))(value);
var jsxAttrD = _curry7(3, jsxAttrD$);
var jsxOpenD$ = (tag, attrs, selfClosing) => length4(attrs) === 0 ? txt(selfClosing ? `<${tag} />` : `<${tag}>`) : group(cat([txt(`<${tag}`), indent(cat(map2((attr) => cat([line, attr]), attrs))), selfClosing ? line : softline, txt(selfClosing ? "/>" : ">")]));
var jsxOpenD = _curry7(3, jsxOpenD$);
var jsxChildD$ = (child, api) => {
  const $match = child;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: e } = $match;
      return _Option_isSome(jsxShape(e)) ? api.exprD(e) : jsxHoleD$("{", e, api);
    }
    case "SESpread": {
      const { expr: e } = $match;
      return jsxHoleD$("{...", e, api);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var jsxChildD = _curry7(2, jsxChildD$);
var jsxAttrsD$ = (shape, api) => {
  const spreadD = _Option_match6(shape.spread, () => [], (sp) => [jsxHoleD$("{...", sp, api)]);
  return _Array_concat3(spreadD, map2((f) => jsxAttrD$(f.name, f.value, api), shape.fields));
};
var jsxAttrsD = _curry7(2, jsxAttrsD$);
var formatJsx$ = (e, api) => _Option_match6(jsxShape(e), () => None6, (shape) => {
  const fragment = isFragment(shape.tag);
  const tag = fragment ? "" : jsxTag$(shape.tag, api);
  const attrs = jsxAttrsD$(shape, api);
  return and5(length4(shape.children) === 0, !fragment) ? Some6(jsxOpenD$(tag, attrs, true)) : Some6(group(cat([fragment ? txt("<>") : jsxOpenD$(tag, attrs, false), indent(cat(map2((child) => cat([softline, jsxChildD$(child, api)]), shape.children))), softline, txt(fragment ? "</>" : `</${tag}>`)])));
});
var formatJsx = _curry7(2, formatJsx$);
var jsxPlugin = { name: "jsx", parse: Some6(parseJsxAtom), inferCall: Some6(inferJsxCallHook), format: None6, formatDoc: Some6(formatJsx), dtsBinding: None6, bindingType: Some6(componentBindingTs) };

import { Err as Err5, None as None9, Ok as Ok5, Some as Some9, _Array_get as _Array_get8, _Option_match as _Option_match9, _Result_flatMap as _Result_flatMap4, _Result_map as _Result_map4, _curry as _curry10, _tuple as _tuple5, and as and7, eq as eq7, length as length7 } from "@mochi/compiler/runtime";
import { match as match4 } from "@onrails/pattern";

import { None as None8, Some as Some8, _Array_append as _Array_append6, _Array_contains, _Array_find as _Array_find2, _Array_get as _Array_get7, _Array_prepend as _Array_prepend3, _Map_get as _Map_get3, _Map_getOr as _Map_getOr2, _Map_has as _Map_has2, _Map_keys as _Map_keys3, _Map_set as _Map_set3, _Map_values as _Map_values2, _Option_flatMap, _Option_match as _Option_match8, _Option_unwrapOr as _Option_unwrapOr5, _Set_add, _Set_diff, _Set_fromArray, _Set_has, _Set_size, _Set_toArray, _Str_codeAt as _Str_codeAt4, _Str_split as _Str_split3, _curry as _curry9, _tuple as _tuple4, and as and6, eq as eq6, filter as filter2, length as length6, map as map4, or as or6, reduce as reduce2 } from "@mochi/compiler/runtime";
import { match as match3 } from "@onrails/pattern";

import { Err as Err4, Ok as Ok4, Some as Some7, _Array_get as _Array_get6, _Array_prepend as _Array_prepend2, _Map_has, _Map_set as _Map_set2, _Option_match as _Option_match7, _Option_unwrapOr as _Option_unwrapOr4, _Result_flatMap as _Result_flatMap3, _Result_map as _Result_map3, _curry as _curry8, _done as _done4, _recur as _recur4, eq as eq5, filter, length as length5, map as map3, show as show3 } from "@mochi/compiler/runtime";
import { match as match2 } from "@onrails/pattern";
var emptyRegistry = { ctors: new Map, types: new Map };
var primTypeNames = ["number", "int", "float", "string", "bool", "unit"];
var keysOfFrom = _curry8(2, (fields, i) => _Option_match7(_Array_get6(i, fields), () => [], (f) => _Array_prepend2(_Option_unwrapOr4(`_${show3(i)}`, f.name), keysOfFrom(fields, i + 1))));
var keysOf = (fields) => keysOfFrom(fields, 0);
var builtinSpan = { start: 0, end: 0 };
var builtinTypeDecls = [{ name: "Option", params: ["a"], ctors: [{ name: "Some", fields: [{ name: Some7("value"), fieldType: TyName("a", builtinSpan) }], span: builtinSpan }, { name: "None", fields: [], span: builtinSpan }] }, { name: "Result", params: ["a", "e"], ctors: [{ name: "Ok", fields: [{ name: Some7("value"), fieldType: TyName("a", builtinSpan) }], span: builtinSpan }, { name: "Err", fields: [{ name: Some7("error"), fieldType: TyName("e", builtinSpan) }], span: builtinSpan }] }];
var declaresType$ = (stmts, i, name) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { name: n } }) => eq5(n, name) ? true : declaresType$(stmts, i + 1, name))(_v) : _v._tag === "Some" ? declaresType$(stmts, i + 1, name) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get6(i, stmts));
var declaresType = _curry8(3, declaresType$);
var builtinDeclsFor = (stmts) => filter((bt) => !declaresType$(stmts, 0, bt.name), builtinTypeDecls);
var seedRegCtorsFrom = _curry8(4, (ctors, i, owner, acc) => _Option_match7(_Array_get6(i, ctors), () => acc, (c) => seedRegCtorsFrom(ctors, i + 1, owner, _Map_has(c.name, acc) ? acc : _Map_set2(c.name, { owner, arity: length5(c.fields) }, acc))));
var seedRegDeclsFrom = _curry8(3, (decls, i, reg) => _Option_match7(_Array_get6(i, decls), () => reg, (bt) => seedRegDeclsFrom(decls, i + 1, { ctors: seedRegCtorsFrom(bt.ctors, 0, bt.name, reg.ctors), types: _Map_set2(bt.name, map3((c) => c.name, bt.ctors), reg.types) })));
var ctorErr = _curry8(2, (message, sp) => ({ message, start: sp.start, end: sp.end }));
var ctorsInto = _curry8(5, (ctors, i, owner, sp, acc) => _Option_match7(_Array_get6(i, ctors), () => Ok4(acc), (c) => _Map_has(c.name, acc) ? Err4(ctorErr(`duplicate constructor '${c.name}'`, sp)) : ctorsInto(ctors, i + 1, owner, sp, _Map_set2(c.name, { owner, arity: length5(c.fields) }, acc))));
var buildLoop$ = (stmts, i, reg) => ((_v) => _v._tag === "None" ? Ok4(reg) : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { name, ctors, span: sp } }) => _Map_has(name, reg.types) ? Err4(ctorErr(`duplicate type '${name}'`, sp)) : _Result_flatMap3((cs) => buildLoop$(stmts, i + 1, { ctors: cs, types: _Map_set2(name, map3((c) => c.name, ctors), reg.types) }), ctorsInto(ctors, 0, name, sp, reg.ctors)))(_v) : _v._tag === "Some" ? buildLoop$(stmts, i + 1, reg) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get6(i, stmts));
var buildLoop = _curry8(3, buildLoop$);
var buildRegistry = (stmts) => _Result_map3((reg) => seedRegDeclsFrom(builtinDeclsFor(stmts), 0, reg), buildLoop$(stmts, 0, emptyRegistry));
var exportedRegLoop$ = (stmts, i0, reg0) => {
  let i = i0;
  let reg = reg0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done4(reg) : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true ? (({ value: { name, ctors } }) => _recur4(i + 1, { ctors: seedRegCtorsFrom(ctors, 0, name, reg.ctors), types: _Map_set2(name, map3((c) => c.name, ctors), reg.types) }))(_v) : _v._tag === "Some" ? _recur4(i + 1, reg) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get6(i, stmts));
    if (_step._tag === "recur") {
      [i, reg] = _step.args;
      continue;
    }
    return _step.value;
  }
};
var exportedRegLoop = _curry8(3, exportedRegLoop$);
var exportedRegistry = (stmts) => exportedRegLoop$(stmts, 0, emptyRegistry);
var ctorKeysInto = _curry8(3, (ctors, i, m) => match2(_Array_get6(i, ctors)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { name, fields } }) => ctorKeysInto(ctors, i + 1, _Map_set2(name, keysOf(fields), m))).exhaustive());
var ctorKeysFrom$ = (stmts, i, m) => ((_v) => _v._tag === "None" ? m : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { ctors } }) => ctorKeysFrom$(stmts, i + 1, ctorKeysInto(ctors, 0, m)))(_v) : _v._tag === "Some" ? ctorKeysFrom$(stmts, i + 1, m) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get6(i, stmts));
var ctorKeysFrom = _curry8(3, ctorKeysFrom$);
var ctorKeysFromStmts$ = (stmts, m) => ctorKeysFrom$(stmts, 0, m);
var ctorKeysFromStmts = _curry8(2, ctorKeysFromStmts$);
var seedKeyCtorsFrom = _curry8(3, (ctors, i, m) => match2(_Array_get6(i, ctors)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { name, fields } }) => seedKeyCtorsFrom(ctors, i + 1, _Map_has(name, m) ? m : _Map_set2(name, keysOf(fields), m))).exhaustive());
var seedKeyDeclsFrom = _curry8(3, (decls, i, m) => match2(_Array_get6(i, decls)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { ctors } }) => seedKeyDeclsFrom(decls, i + 1, seedKeyCtorsFrom(ctors, 0, m))).exhaustive());
var seedBuiltinCtorKeys$ = (stmts, m) => seedKeyDeclsFrom(builtinDeclsFor(stmts), 0, m);
var seedBuiltinCtorKeys = _curry8(2, seedBuiltinCtorKeys$);
var exportedCtorKeysFrom$ = (stmts, i, m) => ((_v) => _v._tag === "None" ? m : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true ? (({ value: { ctors } }) => exportedCtorKeysFrom$(stmts, i + 1, ctorKeysInto(ctors, 0, m)))(_v) : _v._tag === "Some" ? exportedCtorKeysFrom$(stmts, i + 1, m) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get6(i, stmts));
var exportedCtorKeysFrom = _curry8(3, exportedCtorKeysFrom$);
var exportedCtorKeys = (stmts) => exportedCtorKeysFrom$(stmts, 0, new Map);

var mono = (t) => ({ vars: [], rvars: [], ty: t });
var tNumber = tPrim("number");
var tBool = tPrim("bool");
var tString = tPrim("string");
var primType = (name) => ((_v) => _v === "float" ? tNumber : _v === "int" ? tNumber : _v === "string" ? tString : _v === "bool" ? tBool : tPrim(name))(name);
var emptyVarSets = { tv: _Set_fromArray([]), rv: _Set_fromArray([]) };
var diffVarSets = _curry9(2, (a, b) => ({ tv: _Set_diff(a.tv, b.tv), rv: _Set_diff(a.rv, b.rv) }));
var collect$ = (t, acc) => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return { tv: _Set_add(id, acc.tv), rv: acc.rv };
    }
    case "TyCon": {
      const { args } = $match;
      return collectArgs$(args, acc);
    }
    case "TyFn": {
      const { from: fromT, to: toT } = $match;
      return collect$(toT, collect$(fromT, acc));
    }
    case "TyRecord": {
      const { row } = $match;
      return collectRow$(row, acc);
    }
    case "TySingleton": {
      return acc;
    }
    case "TyOneOf": {
      const { members } = $match;
      return collectArgs$(members, acc);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var collect = _curry9(2, collect$);
var collectArgs$ = (args, acc) => collectArgsFrom$(args, 0, acc);
var collectArgs = _curry9(2, collectArgs$);
var collectArgsFrom$ = (args, i, acc) => _Option_match8(_Array_get7(i, args), () => acc, (a) => collectArgsFrom$(args, i + 1, collect$(a, acc)));
var collectArgsFrom = _curry9(3, collectArgsFrom$);
var collectRow$ = (row, acc) => {
  const $match = row;
  switch ($match._tag) {
    case "RowVar": {
      const { id } = $match;
      return { tv: acc.tv, rv: _Set_add(id, acc.rv) };
    }
    case "RowExtend": {
      const { fieldType, rest } = $match;
      return collectRow$(rest, collect$(fieldType, acc));
    }
    case "RowEmpty": {
      return acc;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var collectRow = _curry9(2, collectRow$);
var freeInType = (t) => collect$(t, emptyVarSets);
var collectFree$ = (t, bound, st, acc) => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return _Set_has(id, bound.tv) ? acc : _Option_match8(idGet(id, st.tv), () => ({ tv: _Set_add(id, acc.tv), rv: acc.rv }), (next) => collectFree$(next, bound, st, acc));
    }
    case "TyCon": {
      const { args } = $match;
      return collectFreeArgs$(args, bound, st, acc);
    }
    case "TyFn": {
      const { from: fromT, to: toT } = $match;
      return collectFree$(toT, bound, st, collectFree$(fromT, bound, st, acc));
    }
    case "TyRecord": {
      const { row } = $match;
      return collectFreeRow$(row, bound, st, acc);
    }
    case "TySingleton": {
      return acc;
    }
    case "TyOneOf": {
      const { members } = $match;
      return collectFreeArgs$(members, bound, st, acc);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var collectFree = _curry9(4, collectFree$);
var collectFreeArgs$ = (args, bound, st, acc) => collectFreeArgsFrom$(args, 0, bound, st, acc);
var collectFreeArgs = _curry9(4, collectFreeArgs$);
var collectFreeArgsFrom$ = (args, i, bound, st, acc) => _Option_match8(_Array_get7(i, args), () => acc, (a) => collectFreeArgsFrom$(args, i + 1, bound, st, collectFree$(a, bound, st, acc)));
var collectFreeArgsFrom = _curry9(5, collectFreeArgsFrom$);
var collectFreeRow$ = (row, bound, st, acc) => {
  const $match = row;
  switch ($match._tag) {
    case "RowVar": {
      const { id } = $match;
      return _Set_has(id, bound.rv) ? acc : _Option_match8(idGet(id, st.rv), () => ({ tv: acc.tv, rv: _Set_add(id, acc.rv) }), (next) => collectFreeRow$(next, bound, st, acc));
    }
    case "RowExtend": {
      const { fieldType, rest } = $match;
      return collectFreeRow$(rest, bound, st, collectFree$(fieldType, bound, st, acc));
    }
    case "RowEmpty": {
      return acc;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var collectFreeRow = _curry9(4, collectFreeRow$);
var freeInScheme = _curry9(3, (sc, st, acc) => collectFree$(sc.ty, { tv: _Set_fromArray(sc.vars), rv: _Set_fromArray(sc.rvars) }, st, acc));
var freeInEnvFrom = _curry9(4, (schemes, i, st, acc) => _Option_match8(_Array_get7(i, schemes), () => acc, (sc) => freeInEnvFrom(schemes, i + 1, st, freeInScheme(sc, st, acc))));
var freeInEnv = _curry9(2, (env, st) => freeInEnvFrom(_Map_values2(env), 0, st, emptyVarSets));
var freeInNamedFrom = _curry9(5, (names, i, env, st, acc) => _Option_match8(_Array_get7(i, names), () => acc, (n) => freeInNamedFrom(names, i + 1, env, st, _Option_match8(_Map_get3(n, env), () => acc, (sc) => freeInScheme(sc, st, acc)))));
var generalizeAgainst = _curry9(4, (envFree, t, st, widen) => {
  const zt = widen ? widenLits(zonk(t, st)) : zonk(t, st);
  const own = freeInType(zt);
  const free = and6(_Set_size(own.tv) === 0, _Set_size(own.rv) === 0) ? own : diffVarSets(own, envFree());
  return { vars: _Set_toArray(free.tv), rvars: _Set_toArray(free.rv), ty: zt };
});
var generalize = _curry9(4, (env, t, st, widen) => generalizeAgainst(() => freeInEnv(env, st), t, st, widen));
var generalizeOver = _curry9(5, (env, names, t, st, widen) => generalizeAgainst(() => freeInNamedFrom(names, 0, env, st, emptyVarSets), t, st, widen));
var widenLits = (t) => ((_v) => _v._tag === "TySingleton" && _v.base === "string" ? tString : _v._tag === "TySingleton" ? tNumber : _v._tag === "TyOneOf" ? (({ members }) => tUnion(map4((m) => {
  const $match = m;
  switch ($match._tag) {
    case "TySingleton": {
      return m;
    }
    default: {
      return widenLits(m);
    }
  }
}, members)))(_v) : _v._tag === "TyCon" ? (({ name, args }) => tCon(name, map4(widenLits, args)))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => tArrow(widenLits(fromT), widenLits(toT)))(_v) : _v._tag === "TyRecord" ? (({ row }) => tRecord(widenRow(row)))(_v) : _v._tag === "TyVar" ? t : (() => {
  throw new Error("non-exhaustive match");
})())(t);
var widenRow = (row) => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return row;
    }
    case "RowVar": {
      return row;
    }
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return rField(label, widenLits(fieldType), widenRow(rest), optional);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var instMapFrom = _curry9(3, (vars, acc, st) => match3(vars).with((_v) => _v.length === 0, () => _tuple4(acc, st)).with((_v) => _v.length >= 1, ([v, ...rest]) => (([fv, st1]) => instMapFrom(rest, _Map_set3(v, fv, acc), st1))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var instRowMapFrom = _curry9(3, (vars, acc, st) => match3(vars).with((_v) => _v.length === 0, () => _tuple4(acc, st)).with((_v) => _v.length >= 1, ([v, ...rest]) => (([fr, st1]) => instRowMapFrom(rest, _Map_set3(v, fr, acc), st1))(freshRowVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var instSub$ = (t, tmap, rmap) => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return _Map_getOr2(t, id, tmap);
    }
    case "TyCon": {
      const { name, args } = $match;
      return tCon(name, map4((a) => instSub$(a, tmap, rmap), args));
    }
    case "TyFn": {
      const { from: fromT, to: toT } = $match;
      return tArrow(instSub$(fromT, tmap, rmap), instSub$(toT, tmap, rmap));
    }
    case "TyRecord": {
      const { row } = $match;
      return tRecord(instSubRow$(row, tmap, rmap));
    }
    case "TySingleton": {
      const { base, value } = $match;
      return TySingleton(base, value);
    }
    case "TyOneOf": {
      const { members } = $match;
      return tUnion(map4((m) => instSub$(m, tmap, rmap), members));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var instSub = _curry9(3, instSub$);
var instSubRow$ = (row, tmap, rmap) => {
  const $match = row;
  switch ($match._tag) {
    case "RowVar": {
      const { id } = $match;
      return _Map_getOr2(row, id, rmap);
    }
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return rField(label, instSub$(fieldType, tmap, rmap), instSubRow$(rest, tmap, rmap), optional);
    }
    case "RowEmpty": {
      return row;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var instSubRow = _curry9(3, instSubRow$);
var instantiate = _curry9(2, (sc, st) => (([tmap, st1]) => (([rmap, st2]) => _tuple4(instSub$(sc.ty, tmap, rmap), st2))(instRowMapFrom(sc.rvars, new Map, st1)))(instMapFrom(sc.vars, new Map, st)));
var isUpperStart = (s) => _Option_match8(_Str_codeAt4(0, s), () => false, (c) => and6(c >= 65, c <= 90));
var typeExprListToType$ = (tes, vars, st, aliases, expanding) => ((_v) => _v.length === 0 ? _tuple4([], vars, st) : _v.length >= 1 ? (([te, ...rest]) => (([t, vars1, st1]) => (([restTs, vars2, st2]) => _tuple4(_Array_prepend3(t, restTs), vars2, st2))(typeExprListToType$(rest, vars1, st1, aliases, expanding)))(typeExprToType$(te, vars, st, aliases, expanding)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(tes);
var typeExprListToType = _curry9(5, typeExprListToType$);
var typeExprName$ = (name, vars, st, aliases, expanding) => _Array_contains(name, primTypeNames) ? _tuple4(primType(name), vars, st) : _Option_match8(_Map_get3(name, vars), () => _Option_match8(_Map_get3(name, aliases), () => isUpperStart(name) ? _tuple4(tPrim(name), vars, st) : (([v, st1]) => _tuple4(v, _Map_set3(name, v, vars), st1))(freshVar(st)), (info) => (([t, st1]) => _tuple4(t, vars, st1))(aliasRow$(name, info, [], st, aliases, expanding))), (v) => _tuple4(v, vars, st));
var typeExprName = _curry9(5, typeExprName$);
var typeExprToType$ = (te, vars, st, aliases, expanding) => {
  const $match = te;
  switch ($match._tag) {
    case "TyArrow": {
      const { from: fromTe, to: toTe } = $match;
      return (([fromT, vars1, st1]) => (([toT, vars2, st2]) => _tuple4(tArrow(fromT, toT), vars2, st2))(typeExprToType$(toTe, vars1, st1, aliases, expanding)))(typeExprToType$(fromTe, vars, st, aliases, expanding));
    }
    case "TyApp": {
      const { ctor, args: argTes } = $match;
      return (([args, vars1, st1]) => _Option_match8(_Map_get3(ctor, aliases), () => _tuple4(tCon(ctor, args), vars1, st1), (info) => (([t, st2]) => _tuple4(t, vars1, st2))(aliasRow$(ctor, info, args, st1, aliases, expanding))))(typeExprListToType$(argTes, vars, st, aliases, expanding));
    }
    case "TyTuple": {
      const { elems: elemTes } = $match;
      return (([elems, vars1, st1]) => _tuple4(tTuple(elems), vars1, st1))(typeExprListToType$(elemTes, vars, st, aliases, expanding));
    }
    case "TyList": {
      const { elem: elemTe } = $match;
      return (([elemT, vars1, st1]) => _tuple4(tCon("Array", [elemT]), vars1, st1))(typeExprToType$(elemTe, vars, st, aliases, expanding));
    }
    case "TyName": {
      const { name } = $match;
      return typeExprName$(name, vars, st, aliases, expanding);
    }
    case "TyQual": {
      const { alias, name, args: argTes } = $match;
      return (([args, vars1, st1]) => _Option_match8(_Map_get3(`${alias}.${name}`, aliases), () => _tuple4(tCon(name, args), vars1, st1), (info) => (([t, st2]) => _tuple4(t, vars1, st2))(aliasRow$(name, info, args, st1, aliases, expanding))))(typeExprListToType$(argTes, vars, st, aliases, expanding));
    }
    case "TyLit": {
      const { value } = $match;
      return _tuple4(tLit(value), vars, st);
    }
    case "TyUnion": {
      const { members } = $match;
      return (([ts, vars1, st1]) => _tuple4(tUnion(ts), vars1, st1))(typeExprListToType$(members, vars, st, aliases, expanding));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var typeExprToType = _curry9(5, typeExprToType$);
var aliasLocalVarsFrom = _curry9(3, (params, args, st) => match3(params).with((_v) => _v.length === 0, () => _tuple4(new Map, st)).with((_v) => _v.length >= 1, ([p, ...restParams]) => ((_v) => _v.length >= 1 ? (([a, ...restArgs]) => (([restMap, st1]) => _tuple4(_Map_set3(p, a, restMap), st1))(aliasLocalVarsFrom(restParams, restArgs, st)))(_v) : _v.length === 0 ? (([v, st1]) => (([restMap, st2]) => _tuple4(_Map_set3(p, v, restMap), st2))(aliasLocalVarsFrom(restParams, [], st1)))(freshVar(st)) : (() => {
  throw new Error("non-exhaustive match");
})())(args)).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var rowHasLabel$ = (label, row) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { label: l, rest } = $match;
      return or6(eq6(l, label), rowHasLabel$(label, rest));
    }
    default: {
      return false;
    }
  }
};
var rowHasLabel = _curry9(2, rowHasLabel$);
var spreadRowInto$ = (spread, rest) => {
  const $match = spread;
  switch ($match._tag) {
    case "TyRecord": {
      const { row } = $match;
      return spreadFieldsInto$(row, rest);
    }
    default: {
      return rest;
    }
  }
};
var spreadRowInto = _curry9(2, spreadRowInto$);
var spreadFieldsInto$ = (row, rest) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { label: l, fieldType: t, optional: o, rest: tail } = $match;
      return rowHasLabel$(l, rest) ? spreadFieldsInto$(tail, rest) : RowExtend(l, t, o, spreadFieldsInto$(tail, rest));
    }
    default: {
      return rest;
    }
  }
};
var spreadFieldsInto = _curry9(2, spreadFieldsInto$);
var aliasFieldsFrom$ = (fields, vars, st, aliases, expanding) => ((_v) => _v.length === 0 ? _tuple4(RowEmpty, st) : _v.length >= 1 ? (([fld, ...rest]) => (([ft, vars1, st1]) => (([restRow, st2]) => fld.spread ? _tuple4(spreadRowInto$(ft, restRow), st2) : rowHasLabel$(fld.name, restRow) ? _tuple4(restRow, st2) : _tuple4(rField(fld.name, ft, restRow, fld.optional), st2))(aliasFieldsFrom$(rest, vars1, st1, aliases, expanding)))(typeExprToType$(fld.fieldType, vars, st, aliases, expanding)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields);
var aliasFieldsFrom = _curry9(5, aliasFieldsFrom$);
var aliasRow$ = (name, info, args, st, aliases, expanding) => _Set_has(name, expanding) ? _tuple4(tCon(name, args), st) : _Option_match8(info.expr, () => (([local, st1]) => {
  const next = _Set_add(name, expanding);
  return (([row, st2]) => _tuple4(tRecord(row), st2))(aliasFieldsFrom$(info.fields, local, st1, aliases, next));
})(aliasLocalVarsFrom(info.params, args, st)), (te) => (([local, st1]) => (([t, , st2]) => _tuple4(t, st2))(typeExprToType$(te, local, st1, aliases, _Set_add(name, expanding))))(aliasLocalVarsFrom(info.params, args, st)));
var aliasRow = _curry9(6, aliasRow$);
var pvarsFrom = _curry9(2, (params, st) => match3(params).with((_v) => _v.length === 0, () => _tuple4(new Map, [], st)).with((_v) => _v.length >= 1, ([p, ...rest]) => (([v, st1]) => (([restMap, restVars, st2]) => _tuple4(_Map_set3(p, v, restMap), _Array_prepend3(v, restVars), st2))(pvarsFrom(rest, st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var ctorFieldsArrowFrom$ = (fields, pvars, st, aliases, result) => ((_v) => _v.length === 0 ? _tuple4(result, st) : _v.length >= 1 ? (([fld, ...rest]) => (([ft, , st1]) => (([restT, st2]) => _tuple4(tArrow(ft, restT), st2))(ctorFieldsArrowFrom$(rest, pvars, st1, aliases, result)))(typeExprToType$(fld.fieldType, pvars, st, aliases, _Set_fromArray([]))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields);
var ctorFieldsArrowFrom = _curry9(5, ctorFieldsArrowFrom$);
var ctorScheme = _curry9(5, (typeName, params, c, st, aliases) => (([pvars, pvarTypes, st1]) => {
  const result = tCon(typeName, pvarTypes);
  return (([ty, st2]) => {
    const sets = collect$(ty, emptyVarSets);
    return _tuple4({ vars: _Set_toArray(sets.tv), rvars: _Set_toArray(sets.rv), ty }, st2);
  })(ctorFieldsArrowFrom$(c.fields, pvars, st1, aliases, result));
})(pvarsFrom(params, st)));
var matchTysFrom$ = (tpls, actuals, params, binds, i) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" ? (([{ value: tpl }, { value: actual }]) => _Option_flatMap((b) => matchTysFrom$(tpls, actuals, params, b, i + 1), matchTy$(tpl, actual, params, binds)))(_v) : Some8(binds))(_tuple4(_Array_get7(i, tpls), _Array_get7(i, actuals)));
var matchTysFrom = _curry9(5, matchTysFrom$);
var closedFieldsOf$ = (row, acc) => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return Some8(acc);
    }
    case "RowVar": {
      return None8;
    }
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return closedFieldsOf$(rest, _Array_append6({ label, fieldType, optional }, acc));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var closedFieldsOf = _curry9(2, closedFieldsOf$);
var matchFieldsFrom$ = (tpls, actuals, params, binds, i) => _Option_match8(_Array_get7(i, tpls), () => Some8(binds), (t) => _Option_match8(_Array_find2((a) => eq6(a.label, t.label), actuals), () => None8, (a) => eq6(a.optional, t.optional) ? _Option_flatMap((b) => matchFieldsFrom$(tpls, actuals, params, b, i + 1), matchTy$(t.fieldType, a.fieldType, params, binds)) : None8));
var matchFieldsFrom = _curry9(5, matchFieldsFrom$);
var matchTy$ = (tpl, actual, params, binds) => ((_v) => _v[0]._tag === "TyVar" && (([{ id }]) => _Set_has(id, params))(_v) ? (([{ id }]) => _Option_match8(_Map_get3(id, binds), () => Some8(_Map_set3(id, actual, binds)), (prev) => eq6(prev, actual) ? Some8(binds) : None8))(_v) : _v[0]._tag === "TyVar" && _v[1]._tag === "TyVar" ? (([{ id: a }, { id: b }]) => eq6(a, b) ? Some8(binds) : None8)(_v) : _v[0]._tag === "TyCon" && _v[1]._tag === "TyCon" ? (([{ name: n, args: targs }, { name: m, args: aargs }]) => and6(eq6(n, m), eq6(length6(targs), length6(aargs))) ? matchTysFrom$(targs, aargs, params, binds, 0) : None8)(_v) : _v[0]._tag === "TyFn" && _v[1]._tag === "TyFn" ? (([{ from: tf, to: tt }, { from: af, to: at }]) => _Option_flatMap((b) => matchTy$(tt, at, params, b), matchTy$(tf, af, params, binds)))(_v) : _v[0]._tag === "TyRecord" && _v[1]._tag === "TyRecord" ? (([{ row: trow }, { row: arow }]) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" ? (([{ value: tfs }, { value: afs }]) => eq6(length6(tfs), length6(afs)) ? matchFieldsFrom$(tfs, afs, params, binds, 0) : None8)(_v) : None8)(_tuple4(closedFieldsOf$(trow, []), closedFieldsOf$(arow, []))))(_v) : _v[0]._tag === "TySingleton" && _v[1]._tag === "TySingleton" ? (([{ base: tb, value: tv }, { base: ab, value: av }]) => and6(eq6(tb, ab), eq6(tv, av)) ? Some8(binds) : None8)(_v) : _v[0]._tag === "TyOneOf" && _v[1]._tag === "TyOneOf" ? eq6(tpl, actual) ? Some8(binds) : None8 : None8)(_tuple4(tpl, actual));
var matchTy = _curry9(4, matchTy$);
var templateRowFrom$ = (fields, vars, aliases, i) => _Option_match8(_Array_get7(i, fields), () => RowEmpty, (f) => (([t, _vars, _st]) => {
  const rest = templateRowFrom$(fields, vars, aliases, i + 1);
  return f.spread ? spreadRowInto$(t, rest) : rowHasLabel$(f.name, rest) ? rest : RowExtend(f.name, t, f.optional, rest);
})(typeExprToType$(f.fieldType, vars, mkSt(0), aliases, _Set_fromArray([]))));
var templateRowFrom = _curry9(4, templateRowFrom$);
var templateVars = (params) => reduce2(_curry9(2, ([vs, ids], p) => {
  const id = -1e6 - length6(ids);
  return _tuple4(_Map_set3(p, TyVar(id), vs), _Array_append6(id, ids));
}), _tuple4(new Map, []), params);
var allBound$ = (ids, binds) => length6(filter2((id) => !_Map_has2(id, binds), ids)) === 0;
var allBound = _curry9(2, allBound$);
var bareAliasName = (key) => {
  const parts = _Str_split3(".", key);
  return _Option_unwrapOr5(key, _Array_get7(length6(parts) - 1, parts));
};
var foldingAliasFrom$ = (t, keys, aliases, i) => _Option_match8(_Array_get7(i, keys), () => None8, (key) => {
  const next = () => foldingAliasFrom$(t, keys, aliases, i + 1);
  return _Option_match8(_Map_get3(key, aliases), () => next(), (info) => _Option_match8(info.expr, () => (([vars, ids]) => {
    const tpl = TyRecord(templateRowFrom$(info.fields, vars, aliases, 0));
    return _Option_match8(matchTy$(tpl, t, _Set_fromArray(ids), new Map), () => next(), (binds) => allBound$(ids, binds) ? Some8(bareAliasName(key)) : next());
  })(templateVars(info.params)), () => next()));
});
var foldingAliasFrom = _curry9(4, foldingAliasFrom$);
var nominalTypeName$ = (t, aliases) => {
  const $match = widenLits(t);
  switch ($match._tag) {
    case "TyCon": {
      const { name } = $match;
      return isUpperStart(name) ? Some8(name) : None8;
    }
    case "TyRecord": {
      const { row } = $match;
      return foldingAliasFrom$(TyRecord(row), _Map_keys3(aliases), aliases, 0);
    }
    default: {
      return None8;
    }
  }
};
var nominalTypeName = _curry9(2, nominalTypeName$);
var foldTemplatesFrom$ = (keys, aliases, i, acc) => _Option_match8(_Array_get7(i, keys), () => acc, (key) => _Option_match8(_Map_get3(key, aliases), () => foldTemplatesFrom$(keys, aliases, i + 1, acc), (info) => (([_vars, ids]) => {
  const name = bareAliasName(key);
  return (([tpl, _st]) => foldTemplatesFrom$(keys, aliases, i + 1, _Array_append6({ name, ids, tpl }, acc)))(aliasRow$(name, info, map4((id) => TyVar(id), ids), mkSt(0), aliases, _Set_fromArray([])));
})(templateVars(info.params))));
var foldTemplatesFrom = _curry9(4, foldTemplatesFrom$);
var foldHeadFrom$ = (t, tpls, i) => _Option_match8(_Array_get7(i, tpls), () => None8, (a) => _Option_match8(matchTy$(a.tpl, t, _Set_fromArray(a.ids), new Map), () => foldHeadFrom$(t, tpls, i + 1), (binds) => allBound$(a.ids, binds) ? Some8(_tuple4(a.name, map4((id) => _Map_getOr2(t, id, binds), a.ids))) : foldHeadFrom$(t, tpls, i + 1)));
var foldHeadFrom = _curry9(3, foldHeadFrom$);
var foldWith$ = (t, tpls) => ((_v) => _v._tag === "Some" ? (({ value: [name, args] }) => tCon(name, map4((a) => foldWith$(a, tpls), args)))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "TyCon" ? (({ name, args }) => tCon(name, map4((a) => foldWith$(a, tpls), args)))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => tArrow(foldWith$(fromT, tpls), foldWith$(toT, tpls)))(_v) : _v._tag === "TyRecord" ? (({ row }) => tRecord(foldRowWith$(row, tpls)))(_v) : _v._tag === "TyOneOf" ? (({ members }) => tUnion(map4((m) => foldWith$(m, tpls), members)))(_v) : t)(t) : (() => {
  throw new Error("non-exhaustive match");
})())(foldHeadFrom$(t, tpls, 0));
var foldWith = _curry9(2, foldWith$);
var foldRowWith$ = (row, tpls) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return RowExtend(label, foldWith$(fieldType, tpls), optional, foldRowWith$(rest, tpls));
    }
    default: {
      return row;
    }
  }
};
var foldRowWith = _curry9(2, foldRowWith$);
var foldAliases$ = (t, aliases) => foldAliasesAt$(t, _Map_keys3(aliases), aliases);
var foldAliases = _curry9(2, foldAliases$);
var foldAliasesAt$ = (t, keys, aliases) => foldWith$(t, foldTemplatesFrom$(keys, aliases, 0, []));
var foldAliasesAt = _curry9(3, foldAliasesAt$);

var arrOf = (elem) => tCon("Array", [elem]);
var setStateDomain = (state) => tUnion([state, tArrow(state, state)]);
var isRef$ = (fn, name) => {
  const $match = fn;
  switch ($match._tag) {
    case "ERef": {
      const { name: actual } = $match;
      return eq7(actual, name);
    }
    default: {
      return false;
    }
  }
};
var isRef = _curry10(2, isRef$);
var preactSpan = (e) => {
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
var inferArgs = _curry10(3, (args, st, inferExpr) => match4(args).with((_v) => _v.length === 0, () => Ok5(st)).with((_v) => _v.length >= 1, ([arg, ...rest]) => _Result_flatMap4(([, st1]) => inferArgs(rest, st1, inferExpr), inferExpr(arg, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferUseState = _curry10(4, (fn, args, st, api) => and7(isRef$(fn, "useState"), length7(args) === 1) ? _Option_match9(_Array_get8(0, args), () => Ok5(None9), (init) => _Result_map4(([state, st1]) => {
  const value = widenLits(zonk(state, st1));
  return Some9(_tuple5(tTuple([value, tArrow(setStateDomain(value), tUnit)]), st1));
}, api.inferExpr(init, st))) : Ok5(None9));
var inferUseLazyState = _curry10(4, (fn, args, st, api) => and7(isRef$(fn, "useLazyState"), length7(args) === 1) ? _Option_match9(_Array_get8(0, args), () => Ok5(None9), (thunk) => (([state, st1]) => _Result_flatMap4(([thunkT, st2]) => _Result_map4((st3) => {
  const value = widenLits(zonk(state, st3));
  return Some9(_tuple5(tTuple([value, tArrow(setStateDomain(value), tUnit)]), st3));
}, api.unify(thunkT, tArrow(tUnit, state), st2, preactSpan(thunk))), api.inferExpr(thunk, st1)))(freshVar(st))) : Ok5(None9));
var inferUseRef = _curry10(4, (fn, args, st, api) => and7(isRef$(fn, "useRef"), length7(args) === 1) ? _Option_match9(_Array_get8(0, args), () => Ok5(None9), (init) => _Result_map4(([state, st1]) => Some9(_tuple5(tRecord(rExtend("current", zonk(state, st1), RowEmpty)), st1)), api.inferExpr(init, st))) : Ok5(None9));
var inferDeps = _curry10(4, (args, st, api, name) => _Option_match9(_Array_get8(2, args), () => _Option_match9(_Array_get8(1, args), () => Ok5(st), (deps) => _Result_flatMap4(([depsT, st1]) => (([elem, st2]) => api.unify(depsT, arrOf(elem), st2, preactSpan(deps)))(freshVar(st1)), api.inferExpr(deps, st))), (surplus) => {
  const sp = preactSpan(surplus);
  return Err5({ message: `${name} takes one dependency array after its callback`, start: sp.start, end: sp.end, help: None9, suggestions: [] });
}));
var inferEffectLike = _curry10(5, (fn, args, st, api, name) => and7(isRef$(fn, name), length7(args) >= 1) ? _Option_match9(_Array_get8(0, args), () => Ok5(None9), (effect) => (([cleanup, st1]) => _Result_flatMap4(([effectT, st2]) => _Result_flatMap4((st3) => length7(args) === 1 ? (([dep, st4]) => Ok5(Some9(_tuple5(tArrow(arrOf(dep), tUnit), st4))))(freshVar(st3)) : _Result_map4((st4) => Some9(_tuple5(tUnit, st4)), inferDeps(args, st3, api, name)), api.unify(effectT, tArrow(tUnit, cleanup), st2, preactSpan(effect))), api.inferExpr(effect, st1)))(freshVar(st))) : Ok5(None9));
var inferUseCallback = _curry10(4, (fn, args, st, api) => and7(isRef$(fn, "useCallback"), length7(args) >= 1) ? _Option_match9(_Array_get8(0, args), () => Ok5(None9), (callback) => _Result_flatMap4(([callbackT, st1]) => length7(args) === 1 ? (([dep, st2]) => Ok5(Some9(_tuple5(tArrow(arrOf(dep), zonk(callbackT, st2)), st2))))(freshVar(st1)) : _Result_map4((st2) => Some9(_tuple5(zonk(callbackT, st2), st2)), inferDeps(args, st1, api, "useCallback")), api.inferExpr(callback, st))) : Ok5(None9));
var inferUseMemo = _curry10(4, (fn, args, st, api) => and7(isRef$(fn, "useMemo"), length7(args) >= 1) ? _Option_match9(_Array_get8(0, args), () => Ok5(None9), (thunk) => (([value, st1]) => _Result_flatMap4(([thunkT, st2]) => _Result_flatMap4((st3) => length7(args) === 1 ? (([dep, st4]) => Ok5(Some9(_tuple5(tArrow(arrOf(dep), zonk(value, st4)), st4))))(freshVar(st3)) : _Result_map4((st4) => Some9(_tuple5(zonk(value, st4), st4)), inferDeps(args, st3, api, "useMemo")), api.unify(thunkT, tArrow(tUnit, value), st2, preactSpan(thunk))), api.inferExpr(thunk, st1)))(freshVar(st))) : Ok5(None9));
var inferHookDeps = _curry10(4, (fn, args, st, api) => {
  const expected = isRef$(fn, "hookDeps0") ? Some9(0) : isRef$(fn, "hookDeps1") ? Some9(1) : isRef$(fn, "hookDeps2") ? Some9(2) : isRef$(fn, "hookDeps") ? Some9(3) : None9;
  return _Option_match9(expected, () => Ok5(None9), (n) => eq7(length7(args), n) ? _Result_map4((st1) => (([elem, st2]) => Some9(_tuple5(arrOf(elem), st2)))(freshVar(st1)), inferArgs(args, st, api.inferExpr)) : Ok5(None9));
});
var inferPreactCall = _curry10(5, (fn, args, _origin, st, api) => _Result_flatMap4((first) => _Option_match9(first, () => _Result_flatMap4((lazy) => _Option_match9(lazy, () => _Result_flatMap4((ref) => _Option_match9(ref, () => _Result_flatMap4((effect) => _Option_match9(effect, () => _Result_flatMap4((layout) => _Option_match9(layout, () => _Result_flatMap4((callback) => _Option_match9(callback, () => _Result_flatMap4((memo) => _Option_match9(memo, () => inferHookDeps(fn, args, st, api), () => Ok5(memo)), inferUseMemo(fn, args, st, api)), () => Ok5(callback)), inferUseCallback(fn, args, st, api)), () => Ok5(layout)), inferEffectLike(fn, args, st, api, "useLayoutEffect")), () => Ok5(effect)), inferEffectLike(fn, args, st, api, "useEffect")), () => Ok5(ref)), inferUseRef(fn, args, st, api)), () => Ok5(lazy)), inferUseLazyState(fn, args, st, api)), () => Ok5(first)), inferUseState(fn, args, st, api)));
var preactPlugin = { name: "preact", parse: None9, inferCall: Some9(inferPreactCall), format: None9, formatDoc: None9, dtsBinding: None9, bindingType: None9 };

var DEFAULT_PLUGINS = [jsxPlugin];
var shadowing = _curry11(2, (ps, b) => _Option_match10(_Array_find3((p) => eq8(p.name, b.name), ps), () => b, (p) => p));
var resolvePlugins = _curry11(2, (pluginsOpt, builtins) => _Option_match10(pluginsOpt, () => builtins, (ps) => length8(ps) === 0 ? [] : _Array_concat4(map5((b) => shadowing(ps, b), builtins), filter3((p) => length8(filter3((b) => eq8(b.name, p.name), builtins)) === 0, ps))));
var resolvePluginsDefault = (pluginsOpt) => resolvePlugins(pluginsOpt, DEFAULT_PLUGINS);
var parseHooksFrom = _curry11(3, (plugins, i, acc) => match5(_Array_get9(i, plugins)).with({ _tag: "None" }, () => acc).with((_v) => _v._tag === "Some", ({ value: { parse } }) => _Option_match10(parse, () => parseHooksFrom(plugins, i + 1, acc), (hook) => parseHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))).exhaustive());
var parseHooksOf = (plugins) => parseHooksFrom(plugins, 0, []);
var inferHooksFrom = _curry11(3, (plugins, i, acc) => _Option_match10(_Array_get9(i, plugins), () => acc, (p) => _Option_match10(p.inferCall, () => inferHooksFrom(plugins, i + 1, acc), (hook) => inferHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))));
var inferCallHooksOf = (plugins) => inferHooksFrom(plugins, 0, []);
var runParseHooks = _curry11(4, (hooks, toks, pos, parseExpr) => match5(hooks).with((_v) => _v.length === 0, () => Ok6(None10)).with((_v) => _v.length >= 1, ([hook, ...rest]) => _Result_match3(hook(toks, pos, parseExpr), (e) => Err6(e), (v) => _Option_match10(v, () => runParseHooks(rest, toks, pos, parseExpr), (claim) => Ok6(Some10(claim))))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var runInferCallHooks = _curry11(6, (hooks, fn, args, origin, st, api) => match5(hooks).with((_v) => _v.length === 0, () => Ok6(None10)).with((_v) => _v.length >= 1, ([hook, ...rest]) => _Result_match3(hook(fn, args, origin, st, api), (e) => Err6(e), (v) => _Option_match10(v, () => runInferCallHooks(rest, fn, args, origin, st, api), (claim) => Ok6(Some10(claim))))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var formatHooksFrom = _curry11(3, (plugins, i, acc) => _Option_match10(_Array_get9(i, plugins), () => acc, (p) => _Option_match10(p.format, () => formatHooksFrom(plugins, i + 1, acc), (hook) => formatHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))));
var formatDocHooksFrom = _curry11(3, (plugins, i, acc) => _Option_match10(_Array_get9(i, plugins), () => acc, (p) => _Option_match10(p.formatDoc, () => formatDocHooksFrom(plugins, i + 1, acc), (hook) => formatDocHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))));
var dtsHooksFrom = _curry11(3, (plugins, i, acc) => _Option_match10(_Array_get9(i, plugins), () => acc, (p) => _Option_match10(p.dtsBinding, () => dtsHooksFrom(plugins, i + 1, acc), (hook) => dtsHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))));
var dtsHooksFor = (pluginsOpt) => dtsHooksFrom(resolvePluginsDefault(pluginsOpt), 0, []);
var runFormatHooks = _curry11(2, (hooks, e) => match5(hooks).with((_v) => _v.length === 0, () => None10).with((_v) => _v.length >= 1, ([hook, ...rest]) => _Option_match10(hook(e), () => runFormatHooks(rest, e), (out) => Some10(out))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var runFormatDocHooks = _curry11(3, (hooks, e, api) => match5(hooks).with((_v) => _v.length === 0, () => None10).with((_v) => _v.length >= 1, ([hook, ...rest]) => _Option_match10(hook(e, api), () => runFormatDocHooks(rest, e, api), (doc) => Some10(doc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var runDtsHooks = _curry11(5, (hooks, name, value, ty, api) => match5(hooks).with((_v) => _v.length === 0, () => None10).with((_v) => _v.length >= 1, ([hook, ...rest]) => _Option_match10(hook(name, value, ty, api), () => runDtsHooks(rest, name, value, ty, api), (ts) => Some10(ts))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var bindingHooksFrom = _curry11(3, (plugins, i, acc) => _Option_match10(_Array_get9(i, plugins), () => acc, (p) => _Option_match10(p.bindingType, () => bindingHooksFrom(plugins, i + 1, acc), (hook) => bindingHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))));
var bindingHooksFor = (pluginsOpt) => bindingHooksFrom(resolvePluginsDefault(pluginsOpt), 0, []);
var runBindingHooks = _curry11(4, (hooks, value, ty, api) => match5(hooks).with((_v) => _v.length === 0, () => None10).with((_v) => _v.length >= 1, ([hook, ...rest]) => _Option_match10(hook(value, ty, api), () => runBindingHooks(rest, value, ty, api), (ts) => Some10(ts))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));

var tokName = (t) => {
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
var eofTok = { tok: TEof, start: 0, end: 0, doc: None11 };
var tokAt$ = (toks, i) => _Option_unwrapOr6(eofTok, _Array_get10(i, toks));
var tokAt = _curry12(2, tokAt$);
var spanOf = (lt) => ({ start: lt.start, end: lt.end });
var spanning = _curry12(2, (a, b) => ({ start: a.start, end: b.end }));
var toEnd = _curry12(3, (start, toks, pos) => ({ start: start.start, end: tokAt$(toks, pos - 1).end }));
var errAt = _curry12(2, (message, lt) => Err7({ message, start: lt.start, end: lt.end }));
var expectTok$ = (t, toks, pos) => {
  const lt = tokAt$(toks, pos);
  return eq9(lt.tok, t) ? Ok7(pos + 1) : errAt(`expected ${tokName(t)}, got ${tokName(lt.tok)}`, lt);
};
var expectTok = _curry12(3, expectTok$);
var expectId$ = (toks, pos) => {
  const lt = tokAt$(toks, pos);
  const $match = lt.tok;
  switch ($match._tag) {
    case "TId": {
      const { value: name } = $match;
      return Ok7(_tuple6({ name, span: spanOf(lt) }, pos + 1));
    }
    default: {
      const t = $match;
      return errAt(`expected id, got ${tokName(t)}`, lt);
    }
  }
};
var expectId = _curry12(2, expectId$);
var keywordText = (t) => {
  const $match = t;
  switch ($match._tag) {
    case "TLet": {
      return Some11("let");
    }
    case "TType": {
      return Some11("type");
    }
    case "TExtern": {
      return Some11("extern");
    }
    case "TSwitch": {
      return Some11("switch");
    }
    case "TLoop": {
      return Some11("loop");
    }
    case "TRecur": {
      return Some11("recur");
    }
    case "TDo": {
      return Some11("do");
    }
    case "TImport": {
      return Some11("import");
    }
    case "TExport": {
      return Some11("export");
    }
    default: {
      return None11;
    }
  }
};
var expectLabel$ = (toks, pos) => {
  const lt = tokAt$(toks, pos);
  return _Option_match11(keywordText(lt.tok), () => expectId$(toks, pos), (name) => Ok7(_tuple6({ name, span: spanOf(lt) }, pos + 1)));
};
var expectLabel = _curry12(2, expectLabel$);
var expectStr$ = (toks, pos) => {
  const lt = tokAt$(toks, pos);
  const $match = lt.tok;
  switch ($match._tag) {
    case "TStr": {
      const { value } = $match;
      return Ok7(_tuple6(value, pos + 1));
    }
    default: {
      const t = $match;
      return errAt(`expected str, got ${tokName(t)}`, lt);
    }
  }
};
var expectStr = _curry12(2, expectStr$);
var expectIn$ = (toks, pos) => _Result_flatMap5(([kw, p]) => kw.name === "in" ? Ok7(p) : errAt(`expected 'in' after let binding, got '${kw.name}'`, tokAt$(toks, p)), expectId$(toks, pos));
var expectIn = _curry12(2, expectIn$);
var isUpper = (s) => _Option_exists3((n) => and8(n >= 65, n <= 90), _Str_codeAt5(0, s));
var sepBy = _curry12(4, (parseItem, toks, pos, acc) => _Result_flatMap5(([item, p]) => {
  const items = _Array_append8(item, acc);
  return tokAt$(toks, p).tok._tag === "TComma" ? sepBy(parseItem, toks, p + 1, items) : Ok7(_tuple6(items, p));
}, parseItem(toks, pos)));
var sepByH = _curry12(5, (parseItem, toks, pos, acc, hooks) => _Result_flatMap5(([item, p]) => {
  const items = _Array_append8(item, acc);
  return tokAt$(toks, p).tok._tag === "TComma" ? sepByH(parseItem, toks, p + 1, items, hooks) : Ok7(_tuple6(items, p));
}, parseItem(toks, pos, hooks)));
var listUntil = _curry12(4, (close, parseItem, toks, pos) => eq9(tokAt$(toks, pos).tok, close) ? Ok7(_tuple6([], pos)) : sepBy(parseItem, toks, pos, []));
var listUntilH = _curry12(5, (close, parseItem, toks, pos, hooks) => eq9(tokAt$(toks, pos).tok, close) ? Ok7(_tuple6([], pos)) : sepByH(parseItem, toks, pos, [], hooks));
var scanLambdaDepth$ = (toks, k, depth) => {
  const $match = tokAt$(toks, k).tok;
  switch ($match._tag) {
    case "TLparen": {
      return scanLambdaDepth$(toks, k + 1, depth + 1);
    }
    case "TRparen": {
      return depth === 1 ? tokAt$(toks, k + 1).tok._tag === "TArrow" : scanLambdaDepth$(toks, k + 1, depth - 1);
    }
    case "TEof": {
      return false;
    }
    default: {
      return scanLambdaDepth$(toks, k + 1, depth);
    }
  }
};
var scanLambdaDepth = _curry12(3, scanLambdaDepth$);
var looksLikeLambda$ = (toks, pos) => {
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
var looksLikeLambda = _curry12(2, looksLikeLambda$);
var exprSpan = (e) => {
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
var tySpan = (t) => {
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
var parseParam$ = (toks, pos) => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TLbrace": {
      return _Result_flatMap5(([fields, p]) => _Result_flatMap5((p2) => Ok7(_tuple6(LPSpanned(LPRecord(map6((f) => f.name, fields)), map6((f) => f.span, fields)), p2)), expectTok$(TRbrace, toks, p)), listUntil(TRbrace, expectId, toks, pos + 1));
    }
    case "TLparen": {
      return _Result_flatMap5(([names, p]) => _Result_flatMap5((p2) => Ok7(((_v) => _v.length === 1 ? (([single]) => _tuple6(LPSpanned(LPName(single.name, None11), [single.span]), p2))(_v) : ((many) => _tuple6(LPSpanned(LPTuple(map6((n) => n.name, many)), map6((n) => n.span, many)), p2))(_v))(names)), expectTok$(TRparen, toks, p)), sepBy(expectId, toks, pos + 1, []));
    }
    default: {
      return _Result_flatMap5(([nm, p]) => tokAt$(toks, p).tok._tag === "TColon" ? _Result_map5(([annot, p2]) => _tuple6(LPSpanned(LPName(nm.name, Some11(annot)), [nm.span]), p2), parseTypeExpr$(toks, p + 1)) : Ok7(_tuple6(LPSpanned(LPName(nm.name, None11), [nm.span]), p)), expectId$(toks, pos));
    }
  }
};
var parseParam = _curry12(2, parseParam$);
var parseLabeledParam$ = (toks, pos, hooks) => _Result_flatMap5((p0) => _Result_flatMap5(([nm, p1]) => ((optional) => ((p2) => _Result_flatMap5(([annot, p3]) => tokAt$(toks, p3).tok._tag === "TEq" ? _Result_map5(([d, k]) => _tuple6(LPSpanned(LPLabeled(nm.name, annot, optional, Some11(d)), [nm.span]), k), parseExpr$(toks, p3 + 1, hooks)) : Ok7(_tuple6(LPSpanned(LPLabeled(nm.name, annot, optional, None11), [nm.span]), p3)), tokAt$(toks, p2).tok._tag === "TColon" ? _Result_map5(([t, k]) => _tuple6(Some11(t), k), parseTypeExpr$(toks, p2 + 1)) : Ok7(_tuple6(None11, p2))))(optional ? p1 + 1 : p1))(tokAt$(toks, p1).tok._tag === "TQuestion"), expectLabel$(toks, p0)), expectTok$(TTilde, toks, pos));
var parseLabeledParam = _curry12(3, parseLabeledParam$);
var parseLamParam$ = (toks, pos, hooks) => tokAt$(toks, pos).tok._tag === "TTilde" ? parseLabeledParam$(toks, pos, hooks) : parseParam$(toks, pos);
var parseLamParam = _curry12(3, parseLamParam$);
var isLabeledParam = (p) => {
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
var labeledTrailing$ = (params, seen) => ((_v) => _v.length === 0 ? true : _v.length >= 1 ? (([p, ...rest]) => isLabeledParam(p) ? labeledTrailing$(rest, true) : and8(!seen, labeledTrailing$(rest, false)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params);
var labeledTrailing = _curry12(2, labeledTrailing$);
var parseLambda$ = (toks, pos, hooks) => {
  const start = spanOf(tokAt$(toks, pos));
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TId": {
      const { value: name } = $match;
      return _Result_flatMap5((p) => _Result_flatMap5(([body, p2]) => Ok7(_tuple6(ELambda([LPSpanned(LPName(name, None11), [spanOf(tokAt$(toks, pos))])], body, toEnd(start, toks, p2)), p2)), parseLambdaBody$(toks, p, hooks)), expectTok$(TArrow, toks, pos + 1));
    }
    default: {
      return _Result_flatMap5((p) => _Result_flatMap5(([params, p2]) => _Result_flatMap5((p3) => labeledTrailing$(params, false) ? _Result_flatMap5((p4) => _Result_flatMap5(([body, p5]) => Ok7(_tuple6(ELambda(params, body, toEnd(start, toks, p5)), p5)), parseLambdaBody$(toks, p4, hooks)), expectTok$(TArrow, toks, p3)) : errAt("labeled parameters must be a trailing group", tokAt$(toks, p)), expectTok$(TRparen, toks, p2)), listUntilH(TRparen, parseLamParam, toks, p, hooks)), expectTok$(TLparen, toks, pos));
    }
  }
};
var parseLambda = _curry12(3, parseLambda$);
var parseLambdaBody$ = (toks, pos, hooks) => and8(tokAt$(toks, pos).tok._tag === "TLbrace", arrowBodyIsDoBlock$(toks, pos, 0)) ? parseDoBlock$(toks, pos, hooks) : parseExpr$(toks, pos, hooks);
var parseLambdaBody = _curry12(3, parseLambdaBody$);
var arrowBodyIsDoBlock$ = (toks, pos, depth) => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TLbrace": {
      return arrowBodyIsDoBlock$(toks, pos + 1, depth + 1);
    }
    case "TRbrace": {
      return depth === 1 ? false : arrowBodyIsDoBlock$(toks, pos + 1, depth - 1);
    }
    case "TSemi": {
      return or7(depth === 1, arrowBodyIsDoBlock$(toks, pos + 1, depth));
    }
    case "TEof": {
      return false;
    }
    default: {
      return arrowBodyIsDoBlock$(toks, pos + 1, depth);
    }
  }
};
var arrowBodyIsDoBlock = _curry12(3, arrowBodyIsDoBlock$);
var parseLetIn$ = (toks, pos, hooks) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => or7(tokAt$(toks, p).tok._tag === "TQuestion", tokAt$(toks, p).tok._tag === "TBang") ? ((monad) => ((paramSpan) => _Result_flatMap5(([param, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([value, p3]) => _Result_flatMap5((p4) => _Result_flatMap5(([body, p5]) => Ok7(_tuple6(ELetBind(param, paramSpan, monad, value, body, toEnd(start, toks, p5)), p5)), parseExpr$(toks, p4, hooks)), expectIn$(toks, p3)), parseExpr$(toks, p2, hooks)), expectTok$(TEq, toks, p1)), parseParam$(toks, p + 1)))(spanOf(tokAt$(toks, p + 1))))(tokAt$(toks, p).tok._tag === "TQuestion" ? "Result" : "Task") : tokAt$(toks, p).tok._tag === "TLparen" ? ((paramStart) => _Result_flatMap5(([param, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([value, p3]) => _Result_flatMap5((p4) => _Result_flatMap5(([body, p5]) => ((fn) => Ok7(_tuple6(ECall(fn, [value], None11, toEnd(start, toks, p5)), p5)))(ELambda([param], body, toEnd(paramStart, toks, p5))), parseExpr$(toks, p4, hooks)), expectIn$(toks, p3)), parseExpr$(toks, p2, hooks)), expectTok$(TEq, toks, p1)), parseParam$(toks, p)))(spanOf(tokAt$(toks, p))) : _Result_flatMap5(([nm, p1]) => _Result_flatMap5(([annot, pA]) => _Result_flatMap5((p2) => _Result_flatMap5(([value, p3]) => _Result_flatMap5((p4) => _Result_flatMap5(([body, p5]) => Ok7(_tuple6(ELetIn(nm.name, nm.span, annot, value, body, toEnd(start, toks, p5)), p5)), parseExpr$(toks, p4, hooks)), expectIn$(toks, p3)), parseExpr$(toks, p2, hooks)), expectTok$(TEq, toks, pA)), tokAt$(toks, p1).tok._tag === "TColon" ? _Result_map5(([ty, k]) => _tuple6(Some11(ty), k), parseTypeExpr$(toks, p1 + 1)) : Ok7(_tuple6(None11, p1))), expectId$(toks, p)), expectTok$(TLet, toks, pos));
};
var parseLetIn = _curry12(3, parseLetIn$);
var composeAt$ = (toks, pos) => {
  const a = tokAt$(toks, pos);
  const b = tokAt$(toks, pos + 1);
  return and8(and8(a.tok._tag === "TGt", b.tok._tag === "TGt"), eq9(a.end, b.start));
};
var composeAt = _curry12(2, composeAt$);
var PIPE_BP = 5;
var COMPOSE_BP = 6;
var OR_BP = 7;
var AND_BP = 7;
var CMP_BP = 8;
var CONCAT_BP = 10;
var ADD_BP = 10;
var BACKTICK_BP = 15;
var MUL_BP = 20;
var FAST_PIPE_BP = 21;
var mkBinCall$ = (fnName, opSpan, left, right) => ECall(ERef(fnName, opSpan), [left, right], None11, spanning(exprSpan(left), exprSpan(right)));
var mkBinCall = _curry12(4, mkBinCall$);
var opFnName = (t) => {
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
var isSectionOp = (t) => {
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
var sectionBody$ = (opTok, x, y, opSpan) => {
  const full = spanning(exprSpan(x), exprSpan(y));
  return opTok._tag === "TNeq" ? ECall(ERef("not", opSpan), [mkBinCall$("eq", opSpan, x, y)], None11, full) : mkBinCall$(opFnName(opTok), opSpan, x, y);
};
var sectionBody = _curry12(4, sectionBody$);
var sectionLeft = _curry12(2, (provided, opLt) => {
  const opSpan = spanOf(opLt);
  const paramRef = ERef("$s", opSpan);
  return ELambda([LPName("$s", None11)], sectionBody$(opLt.tok, provided, paramRef, opSpan), spanning(exprSpan(provided), opSpan));
});
var parseRightSection$ = (toks, lparenSpan, pos, hooks) => {
  const lt = tokAt$(toks, pos);
  return _Result_flatMap5(([y, p1]) => _Result_flatMap5((p2) => ((paramRef) => Ok7(_tuple6(ELambda([LPName("$s", None11)], sectionBody$(lt.tok, paramRef, y, spanOf(lt)), toEnd(lparenSpan, toks, p2)), p2)))(ERef("$s", spanOf(lt))), expectTok$(TRparen, toks, p1)), parseExpr$(toks, pos + 1, hooks));
};
var parseRightSection = _curry12(4, parseRightSection$);
var binCallOrLeftSection$ = (toks, left, lt, pos, bp, fnName, hooks) => tokAt$(toks, pos + 1).tok._tag === "TRparen" ? Ok7({ left: sectionLeft(left, lt), p: pos + 1, matched: true }) : _Result_flatMap5(([right, p]) => Ok7({ left: mkBinCall$(fnName, spanOf(lt), left, right), p, matched: true }), parseExprBp$(toks, bp + 1, pos + 1, hooks));
var binCallOrLeftSection = _curry12(7, binCallOrLeftSection$);
var isCmpTok = (t) => {
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
var cmpFnName = (t) => {
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
var parseInfix$ = (toks, minBp, left, pos, hooks) => {
  const lt = tokAt$(toks, pos);
  return and8(lt.tok._tag === "TPipe", PIPE_BP >= minBp) ? _Result_flatMap5(([right, p]) => Ok7({ left: EPipe(left, right, false, spanning(exprSpan(left), exprSpan(right))), p, matched: true }), parseAtomOrCall$(toks, pos + 1, hooks)) : and8(lt.tok._tag === "TTarrow", FAST_PIPE_BP >= minBp) ? _Result_flatMap5(([right, p]) => ((_v) => _v._tag === "ECall" ? (({ span: rightSpan }) => Ok7({ left: EPipe(left, right, true, spanning(exprSpan(left), rightSpan)), p, matched: true }))(_v) : errAt("fast pipe needs a call on the right, like `a -> f(b)`; use `|>` for a bare function or operator section, like `a |> f` or `a |> (+ 3)`", lt))(right), parseAtomOrCall$(toks, pos + 1, hooks)) : and8(composeAt$(toks, pos), COMPOSE_BP >= minBp) ? _Result_flatMap5(([right, p]) => ((opSpan) => ((xRef) => ((innerCall) => ((outerCall) => ((fn) => Ok7({ left: fn, p, matched: true }))(ELambda([LPName("$x", None11)], outerCall, spanning(exprSpan(left), exprSpan(right)))))(ECall(right, [innerCall], None11, spanning(exprSpan(left), exprSpan(right)))))(ECall(left, [xRef], None11, exprSpan(left))))(ERef("$x", opSpan)))({ start: lt.start, end: lt.start + 2 }), parseExprBp$(toks, COMPOSE_BP + 1, pos + 2, hooks)) : and8(and8(isCmpTok(lt.tok), !composeAt$(toks, pos)), CMP_BP >= minBp) ? tokAt$(toks, pos + 1).tok._tag === "TRparen" ? Ok7({ left: sectionLeft(left, lt), p: pos + 1, matched: true }) : _Result_flatMap5(([right, p]) => ((opSpan) => ((inner) => ((result) => Ok7({ left: result, p, matched: true }))(lt.tok._tag === "TNeq" ? ECall(ERef("not", opSpan), [inner], None11, spanning(exprSpan(left), exprSpan(right))) : inner))(mkBinCall$(cmpFnName(lt.tok), opSpan, left, right)))(spanOf(lt)), parseExprBp$(toks, CMP_BP + 1, pos + 1, hooks)) : and8(or7(lt.tok._tag === "TAndand", lt.tok._tag === "TOror"), (lt.tok._tag === "TAndand" ? AND_BP : OR_BP) >= minBp) ? ((bp) => ((fnName) => binCallOrLeftSection$(toks, left, lt, pos, bp, fnName, hooks))(lt.tok._tag === "TAndand" ? "and" : "or"))(lt.tok._tag === "TAndand" ? AND_BP : OR_BP) : and8(lt.tok._tag === "TConcat", CONCAT_BP >= minBp) ? binCallOrLeftSection$(toks, left, lt, pos, CONCAT_BP, "concat", hooks) : and8(lt.tok._tag === "TBacktick", BACKTICK_BP >= minBp) ? _Result_flatMap5(([fnExpr, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([right, p3]) => Ok7({ left: ECall(fnExpr, [left, right], None11, spanning(exprSpan(left), exprSpan(right))), p: p3, matched: true }), parseExprBp$(toks, BACKTICK_BP + 1, p2, hooks)), expectTok$(TBacktick, toks, p1)), parseAtomOrCall$(toks, pos + 1, hooks)) : and8(or7(lt.tok._tag === "TPlus", lt.tok._tag === "TMinus"), ADD_BP >= minBp) ? ((fnName) => binCallOrLeftSection$(toks, left, lt, pos, ADD_BP, fnName, hooks))(lt.tok._tag === "TPlus" ? "add" : "sub") : and8(or7(lt.tok._tag === "TStar", or7(lt.tok._tag === "TSlash", lt.tok._tag === "TPercent")), MUL_BP >= minBp) ? ((fnName) => binCallOrLeftSection$(toks, left, lt, pos, MUL_BP, fnName, hooks))(lt.tok._tag === "TStar" ? "mul" : lt.tok._tag === "TSlash" ? "div" : "mod") : Ok7({ left, p: pos, matched: false });
};
var parseInfix = _curry12(5, parseInfix$);
var infixLoop$ = (toks, minBp, left, pos, hooks) => _Result_flatMap5((res) => res.matched ? infixLoop$(toks, minBp, res.left, res.p, hooks) : Ok7(_tuple6(res.left, res.p)), parseInfix$(toks, minBp, left, pos, hooks));
var infixLoop = _curry12(5, infixLoop$);
var ternaryTail$ = (toks, cond, pos, hooks) => tokAt$(toks, pos).tok._tag === "TQuestion" ? _Result_flatMap5(([thenE, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([elseE, p3]) => Ok7(_tuple6(ETernary(cond, thenE, elseE, spanning(exprSpan(cond), exprSpan(elseE))), p3)), parseExpr$(toks, p2, hooks)), expectTok$(TColon, toks, p1)), parseExpr$(toks, pos + 1, hooks)) : Ok7(_tuple6(cond, pos));
var ternaryTail = _curry12(4, ternaryTail$);
var parseExprBp$ = (toks, minBp, pos, hooks) => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TLet": {
      return parseLetIn$(toks, pos, hooks);
    }
    default: {
      return and8(minBp === 0, looksLikeLambda$(toks, pos)) ? parseLambda$(toks, pos, hooks) : _Result_flatMap5(([left, p]) => _Result_flatMap5(([left2, p2]) => minBp === 0 ? ternaryTail$(toks, left2, p2, hooks) : Ok7(_tuple6(left2, p2)), infixLoop$(toks, minBp, left, p, hooks)), parseAtomOrCall$(toks, pos, hooks));
    }
  }
};
var parseExprBp = _curry12(4, parseExprBp$);
var parseExpr$ = (toks, pos, hooks) => parseExprBp$(toks, 0, pos, hooks);
var parseExpr = _curry12(3, parseExpr$);
var CPPos = (value) => ({ _tag: "CPPos", value });
var CPLab = _curry12(3, (name, value, labelSpan) => ({ _tag: "CPLab", name, value, labelSpan }));
var parseCallPart$ = (toks, pos, hooks) => tokAt$(toks, pos).tok._tag === "TTilde" ? _Result_flatMap5(([nm, p]) => tokAt$(toks, p).tok._tag === "TEq" ? _Result_map5(([v, k]) => _tuple6(CPLab(nm.name, v, nm.span), k), parseExpr$(toks, p + 1, hooks)) : Ok7(_tuple6(CPLab(nm.name, ERef(nm.name, nm.span), nm.span), p)), expectLabel$(toks, pos + 1)) : _Result_map5(([v, k]) => _tuple6(CPPos(v), k), parseExpr$(toks, pos, hooks));
var parseCallPart = _curry12(3, parseCallPart$);
var callPartSpan = (p) => {
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
var splitCallParts$ = (parts, positional, labeled) => ((_v) => _v.length === 0 ? Ok7(_tuple6(positional, labeled)) : _v.length >= 1 ? (([p, ...rest]) => ((_v) => _v._tag === "CPLab" ? splitCallParts$(rest, positional, _Array_append8(p, labeled)) : _v._tag === "CPPos" ? (({ value }) => ((_v) => _v.length === 0 ? splitCallParts$(rest, _Array_append8(value, positional), labeled) : errAt("labeled arguments must be a trailing group", callPartSpan(p)))(labeled))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(parts);
var splitCallParts = _curry12(3, splitCallParts$);
var labeledField = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "CPLab": {
      const { name, value, labelSpan } = $match;
      return { name, nameSpan: labelSpan, value };
    }
    case "CPPos": {
      const { value } = $match;
      return { name: "", nameSpan: exprSpan(value), value };
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var unionSpans$ = (parts, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([p, ...rest]) => unionSpans$(rest, spanning(acc, callPartSpan(p))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(parts);
var unionSpans = _curry12(2, unionSpans$);
var callArgsOf = (parts) => _Result_map5(([positional, labeled]) => ((_v) => _v.length === 0 ? _tuple6(positional, None11) : _v.length >= 1 ? (([first, ...rest]) => _tuple6(_Array_append8(ERecord(map6(labeledField, labeled), None11, unionSpans$(rest, callPartSpan(first))), positional), Some11("labeled")))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(labeled), splitCallParts$(parts, [], []));
var postfixLoop$ = (toks, e, pos, hooks) => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TLparen": {
      return _Result_flatMap5(([parts, p]) => _Result_flatMap5((p2) => _Result_flatMap5(([args, origin]) => postfixLoop$(toks, ECall(e, args, origin, toEnd(exprSpan(e), toks, p2)), p2, hooks), callArgsOf(parts)), expectTok$(TRparen, toks, p)), listUntilH(TRparen, parseCallPart, toks, pos + 1, hooks));
    }
    case "TDot": {
      return _Result_flatMap5(([id, p]) => postfixLoop$(toks, EField(e, id.name, false, spanning(exprSpan(e), id.span)), p, hooks), expectLabel$(toks, pos + 1));
    }
    default: {
      return Ok7(_tuple6(e, pos));
    }
  }
};
var postfixLoop = _curry12(4, postfixLoop$);
var parseAtomOrCall$ = (toks, pos, hooks) => {
  const lt = tokAt$(toks, pos);
  return or7(lt.tok._tag === "TMinus", lt.tok._tag === "TBang") ? _Result_flatMap5(([operand, p]) => ((fnName) => Ok7(_tuple6(ECall(ERef(fnName, spanOf(lt)), [operand], None11, spanning(spanOf(lt), exprSpan(operand))), p)))(lt.tok._tag === "TMinus" ? "negate" : "not"), parseAtomOrCall$(toks, pos + 1, hooks)) : _Result_flatMap5(([e, p]) => postfixLoop$(toks, e, p, hooks), parseAtom$(toks, pos, hooks));
};
var parseAtomOrCall = _curry12(3, parseAtomOrCall$);
var parseAtom$ = (toks, pos, hooks) => {
  const lt = tokAt$(toks, pos);
  const sp = spanOf(lt);
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
      return _Result_flatMap5((claimed) => ((_v) => _v._tag === "Some" ? (({ value: [e, p] }) => Ok7(_tuple6(e, p)))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "TNum" ? (({ value, raw }) => Ok7(_tuple6(ENum(value, raw, sp), pos + 1)))(_v) : _v._tag === "TBool" ? (({ value }) => Ok7(_tuple6(EBool(value, sp), pos + 1)))(_v) : _v._tag === "TStr" ? (({ value }) => Ok7(_tuple6(EStr(value, sp), pos + 1)))(_v) : _v._tag === "TId" ? (({ value: name }) => Ok7(_tuple6(ERef(name, sp), pos + 1)))(_v) : _v._tag === "TLparen" ? ((nxt) => nxt.tok._tag === "TRparen" ? Ok7(_tuple6(EUnit(toEnd(sp, toks, pos + 2)), pos + 2)) : and8(isSectionOp(nxt.tok), nxt.tok._tag !== "TMinus") ? parseRightSection$(toks, sp, pos + 1, hooks) : _Result_flatMap5(([first, p]) => tokAt$(toks, p).tok._tag === "TComma" ? _Result_flatMap5(([elements, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6(ETuple(elements, toEnd(sp, toks, p3)), p3)), expectTok$(TRparen, toks, p2)), sepByH(parseExpr, toks, p + 1, [first], hooks)) : _Result_map5((p2) => _tuple6(first, p2), expectTok$(TRparen, toks, p)), parseExpr$(toks, pos + 1, hooks)))(tokAt$(toks, pos + 1)) : ((t) => errAt(`unexpected token ${tokName(t)}`, lt))(_v))(lt.tok) : (() => {
        throw new Error("non-exhaustive match");
      })())(claimed), runParseHooks(hooks, toks, pos, _curry12(2, (t, p) => parseExpr$(t, p, hooks))));
    }
  }
};
var parseAtom = _curry12(3, parseAtom$);
var parseInterpLoop$ = (toks, pos, start, acc, hooks) => _Result_flatMap5(([holeExpr, p]) => ((acc2) => ((lt) => ((_v) => _v._tag === "TTmplMid" ? (({ value }) => parseInterpLoop$(toks, p + 1, start, _Array_append8(IPLit(value), acc2), hooks))(_v) : _v._tag === "TTmplEnd" ? (({ value }) => Ok7(_tuple6(EInterp(_Array_append8(IPLit(value), acc2), toEnd(start, toks, p + 1)), p + 1)))(_v) : ((t) => errAt(`expected \${...} to close, got ${tokName(t)}`, lt))(_v))(lt.tok))(tokAt$(toks, p)))(_Array_append8(IPExpr(holeExpr), acc)), parseExpr$(toks, pos, hooks));
var parseInterpLoop = _curry12(5, parseInterpLoop$);
var parseInterp$ = (toks, pos, hooks) => {
  const lt = tokAt$(toks, pos);
  const $match = lt.tok;
  switch ($match._tag) {
    case "TTmplStart": {
      const { value } = $match;
      return parseInterpLoop$(toks, pos + 1, spanOf(lt), [IPLit(value)], hooks);
    }
    default: {
      const t = $match;
      return errAt(`expected tmplstart, got ${tokName(t)}`, lt);
    }
  }
};
var parseInterp = _curry12(3, parseInterp$);
var parseField$ = (toks, pos, hooks) => {
  const lt = tokAt$(toks, pos);
  return _Result_flatMap5(([nm, p]) => tokAt$(toks, p).tok._tag === "TColon" ? _Result_flatMap5(([value, p2]) => Ok7(_tuple6({ name: nm.name, nameSpan: nm.span, value }, p2)), parseExpr$(toks, p + 1, hooks)) : keywordText(lt.tok)._tag !== "None" ? errAt(`'${nm.name}' is a keyword \u2014 write '${nm.name}: <expr>'`, lt) : Ok7(_tuple6({ name: nm.name, nameSpan: nm.span, value: ERef(nm.name, nm.span) }, p)), expectLabel$(toks, pos));
};
var parseField = _curry12(3, parseField$);
var parseRecord$ = (toks, pos, hooks) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => tokAt$(toks, p).tok._tag === "TSpread" ? _Result_flatMap5(([spreadExpr, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([fields, p3]) => _Result_flatMap5((p4) => Ok7(_tuple6(ERecord(fields, Some11(spreadExpr), toEnd(start, toks, p4)), p4)), expectTok$(TRbrace, toks, p3)), listUntilH(TRbrace, parseField, toks, p2, hooks)), tokAt$(toks, p1).tok._tag === "TRbrace" ? Ok7(p1) : expectTok$(TComma, toks, p1)), parseExpr$(toks, p + 1, hooks)) : _Result_flatMap5(([fields, p1]) => _Result_flatMap5((p2) => Ok7(_tuple6(ERecord(fields, None11, toEnd(start, toks, p2)), p2)), expectTok$(TRbrace, toks, p1)), listUntilH(TRbrace, parseField, toks, p, hooks)), expectTok$(TLbrace, toks, pos));
};
var parseRecord = _curry12(3, parseRecord$);
var parseSeqElem$ = (toks, pos, hooks) => tokAt$(toks, pos).tok._tag === "TSpread" ? _Result_flatMap5(([ex, p]) => Ok7(_tuple6(SESpread(ex), p)), parseExpr$(toks, pos + 1, hooks)) : _Result_flatMap5(([ex, p]) => Ok7(_tuple6(SEExpr(ex), p)), parseExpr$(toks, pos, hooks));
var parseSeqElem = _curry12(3, parseSeqElem$);
var parseArr$ = (toks, pos, hooks) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5(([elements, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6(EArr(elements, toEnd(start, toks, p3)), p3)), expectTok$(TRbracket, toks, p2)), listUntilH(TRbracket, parseSeqElem, toks, p, hooks)), expectTok$(TLbracket, toks, pos));
};
var parseArr = _curry12(3, parseArr$);
var parseList$ = (toks, pos, hooks) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5((p1) => _Result_flatMap5(([elements, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6(EList(elements, toEnd(start, toks, p3)), p3)), expectTok$(TRbrace, toks, p2)), listUntilH(TRbrace, parseSeqElem, toks, p1, hooks)), expectTok$(TLbrace, toks, p)), expectTok$(TAt, toks, pos));
};
var parseList = _curry12(3, parseList$);
var parseMapEntry$ = (toks, pos, hooks) => _Result_flatMap5(([key, p]) => _Result_flatMap5((p2) => _Result_flatMap5(([value, p3]) => Ok7(_tuple6({ key, value }, p3)), parseExpr$(toks, p2, hooks)), expectTok$(TColon, toks, p)), parseExpr$(toks, pos, hooks));
var parseMapEntry = _curry12(3, parseMapEntry$);
var parseHash$ = (toks, pos, hooks) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5((p1) => tokAt$(toks, p1).tok._tag === "TRbrace" ? _Result_flatMap5((p2) => Ok7(_tuple6(EMap([], toEnd(start, toks, p2)), p2)), expectTok$(TRbrace, toks, p1)) : tokAt$(toks, p1).tok._tag === "TSpread" ? _Result_flatMap5(([elements, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6(ESet(elements, toEnd(start, toks, p3)), p3)), expectTok$(TRbrace, toks, p2)), listUntilH(TRbrace, parseSeqElem, toks, p1, hooks)) : _Result_flatMap5(([first, p2]) => tokAt$(toks, p2).tok._tag === "TColon" ? _Result_flatMap5((p3) => _Result_flatMap5(([value, p4]) => _Result_flatMap5(([rest, p5]) => _Result_flatMap5((p6) => Ok7(_tuple6(EMap(_Array_prepend4({ key: first, value }, rest), toEnd(start, toks, p6)), p6)), expectTok$(TRbrace, toks, p5)), tokAt$(toks, p4).tok._tag === "TComma" ? listUntilH(TRbrace, parseMapEntry, toks, p4 + 1, hooks) : Ok7(_tuple6([], p4))), parseExpr$(toks, p3, hooks)), expectTok$(TColon, toks, p2)) : _Result_flatMap5(([rest, p3]) => _Result_flatMap5((p4) => Ok7(_tuple6(ESet(_Array_prepend4(SEExpr(first), rest), toEnd(start, toks, p4)), p4)), expectTok$(TRbrace, toks, p3)), tokAt$(toks, p2).tok._tag === "TComma" ? listUntilH(TRbrace, parseSeqElem, toks, p2 + 1, hooks) : Ok7(_tuple6([], p2))), parseExpr$(toks, p1, hooks)), expectTok$(TLbrace, toks, p)), expectTok$(THash, toks, pos));
};
var parseHash = _curry12(3, parseHash$);
var parseGuard$ = (toks, pos, hooks) => ((_v) => _v._tag === "TId" && _v.value === "when" ? _Result_map5(([g, p]) => _tuple6(Some11(g), p), parseExpr$(toks, pos + 1, hooks)) : Ok7(_tuple6(None11, pos)))(tokAt$(toks, pos).tok);
var parseGuard = _curry12(3, parseGuard$);
var patSpan = (p) => {
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
var altsLoop$ = (toks, pos, acc, lastSpan) => tokAt$(toks, pos).tok._tag === "TBar" ? _Result_flatMap5(([alt, p1]) => altsLoop$(toks, p1, _Array_append8(alt, acc), patSpan(alt)), parsePattern$(toks, pos + 1)) : Ok7(_tuple6(acc, pos, lastSpan));
var altsLoop = _curry12(4, altsLoop$);
var armsLoop$ = (toks, pos, acc, hooks) => tokAt$(toks, pos).tok._tag === "TBar" ? _Result_flatMap5(([first, p1]) => _Result_flatMap5(([alts, p2, lastSpan]) => ((pattern) => _Result_flatMap5(([guard, p3]) => _Result_flatMap5((p4) => _Result_flatMap5(([body, p5]) => armsLoop$(toks, p5, _Array_append8({ pattern, guard, body }, acc), hooks), parseExpr$(toks, p4, hooks)), expectTok$(TArrow, toks, p3)), parseGuard$(toks, p2, hooks)))(length9(alts) === 1 ? first : POr(alts, spanning(patSpan(first), lastSpan))), altsLoop$(toks, p1, [first], patSpan(first))), parsePattern$(toks, pos + 1)) : Ok7(_tuple6(acc, pos));
var armsLoop = _curry12(4, armsLoop$);
var parseDo$ = (toks, pos, hooks) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => parseDoBlockFrom$(toks, start, p, hooks), expectTok$(TDo, toks, pos));
};
var parseDo = _curry12(3, parseDo$);
var parseDoBlock$ = (toks, pos, hooks) => parseDoBlockFrom$(toks, spanOf(tokAt$(toks, pos)), pos, hooks);
var parseDoBlock = _curry12(3, parseDoBlock$);
var parseDoBlockFrom$ = (toks, start, pos, hooks) => _Result_flatMap5((p1) => tokAt$(toks, p1).tok._tag === "TRbrace" ? errAt("do block needs a final expression", tokAt$(toks, p1)) : _Result_flatMap5(([exprs, p2]) => tokAt$(toks, p2).tok._tag === "TSemi" ? errAt("do block cannot end with a semicolon", tokAt$(toks, p2)) : _Result_flatMap5((p3) => Ok7(_tuple6(EDo(exprs, toEnd(start, toks, p3)), p3)), expectTok$(TRbrace, toks, p2)), parseDoExprs$(toks, p1, [], hooks)), expectTok$(TLbrace, toks, pos));
var parseDoBlockFrom = _curry12(4, parseDoBlockFrom$);
var parseDoExprs$ = (toks, pos, acc, hooks) => _Result_flatMap5(([expr, p]) => ((next) => tokAt$(toks, p).tok._tag === "TSemi" ? parseDoExprs$(toks, p + 1, next, hooks) : Ok7(_tuple6(next, p)))(_Array_append8(expr, acc)), parseExpr$(toks, pos, hooks));
var parseDoExprs = _curry12(4, parseDoExprs$);
var parseLoop$ = (toks, pos, hooks) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5((p1) => _Result_flatMap5(([params, p2]) => _Result_flatMap5((p3) => _Result_flatMap5((p4) => _Result_flatMap5(([body, p5]) => _Result_map5((p6) => _tuple6(ELoop(params, body, toEnd(start, toks, p6)), p6), expectTok$(TRbrace, toks, p5)), parseExpr$(toks, p4, hooks)), expectTok$(TLbrace, toks, p3)), expectTok$(TRparen, toks, p2)), loopParamsLoop$(toks, p1, [], hooks)), expectTok$(TLparen, toks, p)), expectTok$(TLoop, toks, pos));
};
var parseLoop = _curry12(3, parseLoop$);
var loopParamsLoop$ = (toks, pos, acc, hooks) => _Result_flatMap5(([id, pid]) => _Result_flatMap5((p) => _Result_flatMap5(([init, p1]) => ((next) => ((_v) => _v._tag === "TComma" ? loopParamsLoop$(toks, p1 + 1, next, hooks) : Ok7(_tuple6(next, p1)))(tokAt$(toks, p1).tok))(_Array_append8({ name: id.name, nameSpan: id.span, init }, acc)), parseExpr$(toks, p, hooks)), expectTok$(TEq, toks, pid)), expectId$(toks, pos));
var loopParamsLoop = _curry12(4, loopParamsLoop$);
var parseRecur$ = (toks, pos, hooks) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5((p1) => ((_v) => _v._tag === "TRparen" ? Ok7(_tuple6(ERecur([], toEnd(start, toks, p1 + 1)), p1 + 1)) : _Result_flatMap5(([args, p2]) => _Result_map5((p3) => _tuple6(ERecur(args, toEnd(start, toks, p3)), p3), expectTok$(TRparen, toks, p2)), sepByH(parseExpr, toks, p1, [], hooks)))(tokAt$(toks, p1).tok), expectTok$(TLparen, toks, p)), expectTok$(TRecur, toks, pos));
};
var parseRecur = _curry12(3, parseRecur$);
var parseMatch$ = (toks, pos, hooks) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5(([scrutinee, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([arms, p3]) => ((_v) => _v === 0 ? errAt("switch needs at least one | arm", tokAt$(toks, p3)) : _Result_map5((p4) => _tuple6(EMatch(scrutinee, arms, toEnd(start, toks, p4)), p4), expectTok$(TRbrace, toks, p3)))(length9(arms)), armsLoop$(toks, p2, [], hooks)), expectTok$(TLbrace, toks, p1)), parseExpr$(toks, p, hooks)), expectTok$(TSwitch, toks, pos));
};
var parseMatch = _curry12(3, parseMatch$);
var parseCtorArgs$ = (toks, ctor, ns, nameSpan, pos) => tokAt$(toks, pos).tok._tag === "TLparen" ? _Result_flatMap5(([args, p]) => _Result_flatMap5((p2) => Ok7(_tuple6(PCtor(ctor, args, ns, toEnd(nameSpan, toks, p2)), p2)), expectTok$(TRparen, toks, p)), listUntil(TRparen, parsePattern, toks, pos + 1)) : Ok7(_tuple6(PCtor(ctor, [], ns, toEnd(nameSpan, toks, pos)), pos));
var parseCtorArgs = _curry12(5, parseCtorArgs$);
var parsePatternAtom$ = (toks, pos) => {
  const lt = tokAt$(toks, pos);
  const sp = spanOf(lt);
  return ((_v) => _v._tag === "TNum" ? (({ value, raw }) => Ok7(_tuple6(PLit2(value, raw, sp), pos + 1)))(_v) : _v._tag === "TBool" ? (({ value }) => Ok7(_tuple6(PBool(value, sp), pos + 1)))(_v) : _v._tag === "TStr" ? (({ value }) => Ok7(_tuple6(PStr(value, sp), pos + 1)))(_v) : _v._tag === "TLparen" ? tokAt$(toks, pos + 1).tok._tag === "TRparen" ? Ok7(_tuple6(PUnit(toEnd(sp, toks, pos + 2)), pos + 2)) : _Result_flatMap5(([elems, p]) => _Result_flatMap5((p2) => Ok7(((_v) => _v.length === 1 ? (([single]) => _tuple6(single, p2))(_v) : ((many) => _tuple6(PTuple(many, toEnd(sp, toks, p2)), p2))(_v))(elems)), expectTok$(TRparen, toks, p)), sepBy(parsePattern, toks, pos + 1, [])) : _v._tag === "TLbrace" ? _Result_flatMap5(([fields, p]) => _Result_flatMap5((p2) => Ok7(_tuple6(PRecord(fields, toEnd(sp, toks, p2)), p2)), expectTok$(TRbrace, toks, p)), listUntil(TRbrace, parsePatField, toks, pos + 1)) : _v._tag === "TLbracket" ? parseArrPattern$(toks, pos) : _v._tag === "TAt" ? parseListPattern$(toks, pos) : _v._tag === "TId" && _v.value === "_" ? Ok7(_tuple6(PWild(sp), pos + 1)) : _v._tag === "TId" ? (({ value: name }) => tokAt$(toks, pos + 1).tok._tag === "TDot" ? _Result_flatMap5(([c, p1]) => isUpper(c.name) ? parseCtorArgs$(toks, c.name, Some11(name), sp, p1) : errAt(`expected constructor after '${name}.', got '${c.name}'`, tokAt$(toks, p1)), expectId$(toks, pos + 2)) : isUpper(name) ? parseCtorArgs$(toks, name, None11, sp, pos + 1) : Ok7(_tuple6(PBind(name, sp), pos + 1)))(_v) : ((t) => errAt(`unexpected token in pattern: ${tokName(t)}`, lt))(_v))(lt.tok);
};
var parsePatternAtom = _curry12(2, parsePatternAtom$);
var parsePattern$ = (toks, pos) => _Result_flatMap5(([pat, p]) => ((_v) => _v._tag === "TId" && _v.value === "as" ? _Result_flatMap5(([nm, p2]) => Ok7(_tuple6(PAs(pat, nm.name, nm.span, spanning(patSpan(pat), nm.span)), p2)), expectId$(toks, p + 1)) : Ok7(_tuple6(pat, p)))(tokAt$(toks, p).tok), parsePatternAtom$(toks, pos));
var parsePattern = _curry12(2, parsePattern$);
var restOk = (rest) => ((_v) => _v._tag === "None" ? true : _v._tag === "Some" && _v.value._tag === "PBind" ? true : _v._tag === "Some" && _v.value._tag === "PWild" ? true : _v._tag === "Some" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(rest);
var patElemsLoop$ = (toks, pos, acc) => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TSpread": {
      return _Result_flatMap5(([rest, p]) => Ok7(_tuple6(acc, Some11(rest), p)), parsePattern$(toks, pos + 1));
    }
    default: {
      return _Result_flatMap5(([pat, p]) => ((elems) => tokAt$(toks, p).tok._tag === "TComma" ? patElemsLoop$(toks, p + 1, elems) : Ok7(_tuple6(elems, None11, p)))(_Array_append8(pat, acc)), parsePattern$(toks, pos));
    }
  }
};
var patElemsLoop = _curry12(3, patElemsLoop$);
var parseArrPattern$ = (toks, pos) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => tokAt$(toks, p).tok._tag === "TRbracket" ? Ok7(_tuple6(PArr([], None11, toEnd(start, toks, p + 1)), p + 1)) : _Result_flatMap5(([elems, rest, p2]) => restOk(rest) ? _Result_map5((p3) => _tuple6(PArr(elems, rest, toEnd(start, toks, p3)), p3), expectTok$(TRbracket, toks, p2)) : errAt("list `...` rest must bind a name or `_`", tokAt$(toks, p2)), patElemsLoop$(toks, p, [])), expectTok$(TLbracket, toks, pos));
};
var parseArrPattern = _curry12(2, parseArrPattern$);
var parseListPattern$ = (toks, pos) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5((p1) => tokAt$(toks, p1).tok._tag === "TRbrace" ? Ok7(_tuple6(PList([], None11, toEnd(start, toks, p1 + 1)), p1 + 1)) : _Result_flatMap5(([elems, rest, p2]) => restOk(rest) ? _Result_map5((p3) => _tuple6(PList(elems, rest, toEnd(start, toks, p3)), p3), expectTok$(TRbrace, toks, p2)) : errAt("list `...` rest must bind a name or `_`", tokAt$(toks, p2)), patElemsLoop$(toks, p1, [])), expectTok$(TLbrace, toks, p)), expectTok$(TAt, toks, pos));
};
var parseListPattern = _curry12(2, parseListPattern$);
var parsePatField$ = (toks, pos) => {
  const lt = tokAt$(toks, pos);
  return _Result_flatMap5(([nm, p]) => tokAt$(toks, p).tok._tag === "TColon" ? _Result_flatMap5(([pat, p2]) => Ok7(_tuple6({ label: nm.name, labelSpan: nm.span, pat }, p2)), parsePattern$(toks, p + 1)) : keywordText(lt.tok)._tag !== "None" ? errAt(`'${nm.name}' is a keyword \u2014 write '${nm.name}: <pattern>'`, lt) : Ok7(_tuple6({ label: nm.name, labelSpan: nm.span, pat: PBind(nm.name, nm.span) }, p)), expectLabel$(toks, pos));
};
var parsePatField = _curry12(2, parsePatField$);
var parseTypeAtom$ = (toks, pos) => {
  const lt = tokAt$(toks, pos);
  const sp = spanOf(lt);
  const $match = lt.tok;
  switch ($match._tag) {
    case "TLparen": {
      return tokAt$(toks, pos + 1).tok._tag === "TRparen" ? Ok7(_tuple6(TyName("unit", toEnd(sp, toks, pos + 2)), pos + 2)) : _Result_flatMap5(([inner, p]) => tokAt$(toks, p).tok._tag === "TComma" ? _Result_flatMap5(([elems, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6(TyTuple(elems, toEnd(sp, toks, p3)), p3)), expectTok$(TRparen, toks, p2)), sepBy(parseTypeExpr, toks, p + 1, [inner])) : _Result_map5((p2) => _tuple6(inner, p2), expectTok$(TRparen, toks, p)), parseTypeExpr$(toks, pos + 1));
    }
    case "TLbracket": {
      return _Result_flatMap5(([elem, p]) => _Result_flatMap5((p2) => Ok7(_tuple6(TyList(elem, toEnd(sp, toks, p2)), p2)), expectTok$(TRbracket, toks, p)), parseTypeExpr$(toks, pos + 1));
    }
    case "TStr": {
      const { value } = $match;
      return Ok7(_tuple6(TyLit(value, sp), pos + 1));
    }
    default: {
      return _Result_flatMap5(([nm, p]) => and8(isUpper(nm.name), tokAt$(toks, p).tok._tag === "TDot") ? _Result_flatMap5(([q, p2]) => isUpper(q.name) ? Ok7(_tuple6(TyQual(nm.name, q.name, q.span, [], spanning(nm.span, q.span)), p2)) : errAt(`a type variable cannot be qualified; expected a constructor after '${nm.name}.', got '${q.name}'`, tokAt$(toks, p2)), expectId$(toks, p + 1)) : Ok7(_tuple6(TyName(nm.name, nm.span), p)), expectId$(toks, pos));
    }
  }
};
var parseTypeAtom = _curry12(2, parseTypeAtom$);
var startsTypeAtom = (t) => {
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
var legacyTypeArgsLoop$ = (toks, pos, acc, lastSp) => startsTypeAtom(tokAt$(toks, pos).tok) ? _Result_flatMap5(([a, p]) => legacyTypeArgsLoop$(toks, p, _Array_append8(a, acc), Some11(tySpan(a))), parseTypeAtom$(toks, pos)) : Ok7(_tuple6(acc, lastSp, pos));
var legacyTypeArgsLoop = _curry12(4, legacyTypeArgsLoop$);
var parseTypeApp$ = (toks, pos) => _Result_flatMap5(([head, p]) => ((_v) => _v._tag === "TyName" && (({ name, span: sp }) => isUpper(name))(_v) ? (({ name, span: sp }) => tokAt$(toks, p).tok._tag === "TLt" ? _Result_flatMap5(([args, p1]) => _Result_flatMap5((p2) => Ok7(_tuple6(TyApp(name, args, toEnd(sp, toks, p2)), p2)), expectTok$(TGt, toks, p1)), listUntil(TGt, parseTypeExpr, toks, p + 1)) : _Result_flatMap5(([args, lastSp, p2]) => Ok7(_Option_match11(lastSp, () => _tuple6(head, p2), (ls) => _tuple6(TyApp(name, args, spanning(sp, ls)), p2))), legacyTypeArgsLoop$(toks, p, [], None11)))(_v) : _v._tag === "TyQual" ? (({ alias, name: nm, nameSpan, span: sp }) => tokAt$(toks, p).tok._tag === "TLt" ? _Result_flatMap5(([args, p1]) => _Result_flatMap5((p2) => Ok7(_tuple6(TyQual(alias, nm, nameSpan, args, toEnd(sp, toks, p2)), p2)), expectTok$(TGt, toks, p1)), listUntil(TGt, parseTypeExpr, toks, p + 1)) : _Result_flatMap5(([args, lastSp, p2]) => Ok7(_Option_match11(lastSp, () => _tuple6(head, p2), (ls) => _tuple6(TyQual(alias, nm, nameSpan, args, spanning(sp, ls)), p2))), legacyTypeArgsLoop$(toks, p, [], None11)))(_v) : Ok7(_tuple6(head, p)))(head), parseTypeAtom$(toks, pos));
var parseTypeApp = _curry12(2, parseTypeApp$);
var parseTypeUnionRest$ = (toks, pos, acc, lastSp) => tokAt$(toks, pos).tok._tag === "TBar" ? _Result_flatMap5(([m, p]) => parseTypeUnionRest$(toks, p, _Array_append8(m, acc), tySpan(m)), parseTypeApp$(toks, pos + 1)) : Ok7(_tuple6(acc, lastSp, pos));
var parseTypeUnionRest = _curry12(4, parseTypeUnionRest$);
var parseTypeUnion$ = (toks, pos) => _Result_flatMap5(([first, p]) => tokAt$(toks, p).tok._tag === "TBar" ? _Result_flatMap5(([members, lastSp, p2]) => Ok7(_tuple6(TyUnion(members, spanning(tySpan(first), lastSp)), p2)), parseTypeUnionRest$(toks, p, [first], tySpan(first))) : Ok7(_tuple6(first, p)), parseTypeApp$(toks, pos));
var parseTypeUnion = _curry12(2, parseTypeUnion$);
var parseTypeExpr$ = (toks, pos) => _Result_flatMap5(([from, p]) => tokAt$(toks, p).tok._tag === "TTarrow" ? _Result_flatMap5(([to, p2]) => Ok7(_tuple6(TyArrow(from, to, spanning(tySpan(from), tySpan(to))), p2)), parseTypeExpr$(toks, p + 1)) : Ok7(_tuple6(from, p)), parseTypeUnion$(toks, pos));
var parseTypeExpr = _curry12(2, parseTypeExpr$);
var parseCtorField$ = (toks, pos) => {
  const isLabel = ((_v) => _v._tag === "TId" ? tokAt$(toks, pos + 1).tok._tag === "TColon" : false)(tokAt$(toks, pos).tok);
  return isLabel ? _Result_flatMap5(([nm, p]) => _Result_flatMap5(([t, p2]) => Ok7(_tuple6({ name: Some11(nm.name), fieldType: t }, p2)), parseTypeExpr$(toks, p + 1)), expectId$(toks, pos)) : _Result_map5(([t, p]) => _tuple6({ name: None11, fieldType: t }, p), parseTypeExpr$(toks, pos));
};
var parseCtorField = _curry12(2, parseCtorField$);
var parseCtor$ = (toks, pos) => _Result_flatMap5(([nm, p]) => tokAt$(toks, p).tok._tag === "TLparen" ? _Result_flatMap5(([fields, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6({ name: nm.name, fields, span: toEnd(nm.span, toks, p3) }, p3)), expectTok$(TRparen, toks, p2)), listUntil(TRparen, parseCtorField, toks, p + 1)) : Ok7(_tuple6({ name: nm.name, fields: [], span: nm.span }, p)), expectId$(toks, pos));
var parseCtor = _curry12(2, parseCtor$);
var ctorsLoop$ = (toks, pos, acc) => _Result_flatMap5(([c, p]) => ((cs) => tokAt$(toks, p).tok._tag === "TBar" ? ctorsLoop$(toks, p + 1, cs) : Ok7(_tuple6(cs, p)))(_Array_append8(c, acc)), parseCtor$(toks, pos));
var ctorsLoop = _curry12(3, ctorsLoop$);
var parseAliasField$ = (toks, pos) => tokAt$(toks, pos).tok._tag === "TSpread" ? _Result_flatMap5(([t, p]) => Ok7(_tuple6({ name: "", nameSpan: tySpan(t), fieldType: t, optional: false, spread: true }, p)), parseTypeApp$(toks, pos + 1)) : _Result_flatMap5(([nm, p]) => ((optional) => ((p1) => _Result_flatMap5((p2) => _Result_flatMap5(([t, p3]) => Ok7(_tuple6({ name: nm.name, nameSpan: nm.span, fieldType: t, optional, spread: false }, p3)), parseTypeExpr$(toks, p2)), expectTok$(TColon, toks, p1)))(optional ? p + 1 : p))(tokAt$(toks, p).tok._tag === "TQuestion"), expectLabel$(toks, pos));
var parseAliasField = _curry12(2, parseAliasField$);
var parseAliasBody$ = (toks, pos) => _Result_flatMap5((p) => _Result_flatMap5(([fields, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6(fields, p3)), expectTok$(TRbrace, toks, p2)), listUntil(TRbrace, parseAliasField, toks, p)), expectTok$(TLbrace, toks, pos));
var parseAliasBody = _curry12(2, parseAliasBody$);
var typeParamsLoop = _curry12(3, (toks, pos, acc) => {
  const $match = tokAt$(toks, pos).tok;
  switch ($match._tag) {
    case "TId": {
      const { value: name } = $match;
      return typeParamsLoop(toks, pos + 1, _Array_append8(name, acc));
    }
    default: {
      return Ok7(_tuple6(acc, pos));
    }
  }
});
var parseTypeParams$ = (toks, pos) => tokAt$(toks, pos).tok._tag === "TLt" ? _Result_flatMap5(([names, p]) => _Result_map5((p2) => _tuple6(map6((n) => n.name, names), p2), expectTok$(TGt, toks, p)), listUntil(TGt, expectId, toks, pos + 1)) : typeParamsLoop(toks, pos, []);
var parseTypeParams = _curry12(2, parseTypeParams$);
var startsTypeSynonym = (t) => {
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
var parseType$ = (toks, pos) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5(([nm, p1]) => _Result_flatMap5(([params, p2]) => _Result_flatMap5((p3) => tokAt$(toks, p3).tok._tag === "TLbrace" ? _Result_map5(([alias, p4]) => _tuple6(SType(nm.name, nm.span, params, [], Some11(alias), None11, false, None11, toEnd(start, toks, p4)), p4), parseAliasBody$(toks, p3)) : startsTypeSynonym(tokAt$(toks, p3).tok) ? _Result_flatMap5(([te, p4]) => Ok7(_tuple6(SType(nm.name, nm.span, params, [], None11, Some11(te), false, None11, toEnd(start, toks, p4)), p4)), parseTypeExpr$(toks, p3)) : ((afterBar) => _Result_map5(([ctors, p4]) => _tuple6(SType(nm.name, nm.span, params, ctors, None11, None11, false, None11, toEnd(start, toks, p4)), p4), ctorsLoop$(toks, afterBar, [])))(tokAt$(toks, p3).tok._tag === "TBar" ? p3 + 1 : p3), expectTok$(TEq, toks, p2)), parseTypeParams$(toks, p1)), expectId$(toks, p)), expectTok$(TType, toks, pos));
};
var parseType = _curry12(2, parseType$);
var parseExtern$ = (toks, pos) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => tokAt$(toks, p).tok._tag === "TType" ? _Result_flatMap5((p1) => _Result_flatMap5(([nm, p2]) => Ok7(_tuple6(SType(nm.name, nm.span, [], [], None11, None11, false, None11, toEnd(start, toks, p2)), p2)), expectId$(toks, p1)), expectTok$(TType, toks, p)) : _Result_flatMap5(([nm, p1]) => _Result_flatMap5(([params, p2]) => _Result_flatMap5((p3) => _Result_flatMap5(([t, p4]) => _Result_flatMap5((p5) => ((isCurried) => ((pConv) => ((nextTok) => or7(or7(or7(or7(eq9(nextTok, TId("global")), eq9(nextTok, TId("send"))), eq9(nextTok, TId("get"))), eq9(nextTok, TId("set"))), eq9(nextTok, TId("new"))) ? isCurried ? errAt("'curried' applies to a module extern, not a JS convention \u2014 give the host's module and export instead", tokAt$(toks, pConv)) : _Result_flatMap5(([convention, p6]) => _Result_flatMap5(([first, p7]) => ((hasSecond) => _Result_flatMap5(([second, p8]) => Ok7(_tuple6(SExtern(nm.name, nm.span, params, t, `mochi:${convention.name}:${first}`, second, false, false, None11, toEnd(start, toks, p8)), p8)), hasSecond ? expectStr$(toks, p7) : Ok7(_tuple6("", p7))))(((_v) => _v._tag === "TStr" ? or7(convention.name === "global", convention.name === "new") : false)(tokAt$(toks, p7).tok)), expectStr$(toks, p6)), expectId$(toks, pConv)) : _Result_flatMap5(([moduleName, p6]) => _Result_flatMap5(([importedName, p7]) => Ok7(_tuple6(SExtern(nm.name, nm.span, params, t, moduleName, importedName, isCurried, false, None11, toEnd(start, toks, p7)), p7)), expectStr$(toks, p6)), expectStr$(toks, pConv)))(tokAt$(toks, pConv).tok))(isCurried ? p5 + 1 : p5))(eq9(tokAt$(toks, p5).tok, TId("curried"))), expectTok$(TEq, toks, p4)), parseTypeExpr$(toks, p3)), expectTok$(TColon, toks, p2)), tokAt$(toks, p1).tok._tag === "TLt" ? _Result_flatMap5(([names, pParams]) => _Result_flatMap5((pAfter) => Ok7(_tuple6(map6((n) => n.name, names), pAfter)), expectTok$(TGt, toks, pParams)), listUntil(TGt, expectId, toks, p1 + 1)) : Ok7(_tuple6([], p1))), expectId$(toks, p)), expectTok$(TExtern, toks, pos));
};
var parseExtern = _curry12(2, parseExtern$);
var parseImportNs = _curry12(3, (toks, start, pos) => _Result_flatMap5(([asKw, p1]) => asKw.name === "as" ? _Result_flatMap5(([alias, p2]) => _Result_flatMap5(([kw, p3]) => kw.name === "from" ? _Result_map5(([path, p4]) => _tuple6(SImportNs(alias, path, toEnd(start, toks, p4)), p4), expectStr$(toks, p3)) : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt$(toks, p3)), expectId$(toks, p2)), expectId$(toks, p1)) : errAt(`expected 'as' in namespace import, got '${asKw.name}'`, tokAt$(toks, p1)), expectId$(toks, pos)));
var parseImport$ = (toks, pos) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => tokAt$(toks, p).tok._tag === "TStar" ? _Result_flatMap5((p1) => parseImportNs(toks, start, p1), expectTok$(TStar, toks, p)) : _Result_flatMap5((p1) => _Result_flatMap5(([names, p2]) => _Result_flatMap5((p3) => _Result_flatMap5(([kw, p4]) => kw.name === "from" ? _Result_map5(([path, p5]) => _tuple6(SImport(names, path, toEnd(start, toks, p5)), p5), expectStr$(toks, p4)) : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt$(toks, p4)), expectId$(toks, p3)), expectTok$(TRbrace, toks, p2)), listUntil(TRbrace, expectId, toks, p1)), expectTok$(TLbrace, toks, p)), expectTok$(TImport, toks, pos));
};
var parseImport = _curry12(2, parseImport$);
var parseRecordDestructure = _curry12(5, (toks, start, pos, tmp, hooks) => {
  const openSp = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5(([fields, p1]) => ((closeSp) => _Result_flatMap5((p2) => _Result_flatMap5((p3) => _Result_flatMap5(([value, p4]) => ((whole) => ((patSpan) => ((tmpName) => ((header) => ((access) => Ok7(_tuple6(_Array_prepend4(header, map6(access, fields)), p4, tmp + 1)))((f) => SLet(f.name, f.span, None11, EField(ERef(tmpName, f.span), f.name, false, f.span), false, None11, f.span)))(SLet(tmpName, patSpan, None11, value, false, None11, whole)))(`$d${show4(tmp)}`))(spanning(openSp, closeSp)))(toEnd(start, toks, p4)), parseExpr$(toks, p3, hooks)), expectTok$(TEq, toks, p2)), expectTok$(TRbrace, toks, p1)))(spanOf(tokAt$(toks, p1))), listUntil(TRbrace, expectId, toks, p)), expectTok$(TLbrace, toks, pos));
});
var parseLet$ = (toks, pos, tmp, hooks) => {
  const start = spanOf(tokAt$(toks, pos));
  return _Result_flatMap5((p) => tokAt$(toks, p).tok._tag === "TLbrace" ? parseRecordDestructure(toks, start, p, tmp, hooks) : _Result_flatMap5(([nm, p1]) => _Result_flatMap5(([annot, pA]) => _Result_flatMap5((p2) => _Result_flatMap5(([value, p3]) => Ok7(_tuple6([SLet(nm.name, nm.span, annot, value, false, None11, toEnd(start, toks, p3))], p3, tmp)), parseExpr$(toks, p2, hooks)), expectTok$(TEq, toks, pA)), tokAt$(toks, p1).tok._tag === "TColon" ? _Result_map5(([ty, p]) => _tuple6(Some11(ty), p), parseTypeExpr$(toks, p1 + 1)) : Ok7(_tuple6(None11, p1))), expectId$(toks, p)), expectTok$(TLet, toks, pos));
};
var parseLet = _curry12(4, parseLet$);
var setLetMeta$ = (exported, doc, s) => {
  const $match = s;
  switch ($match._tag) {
    case "SLet": {
      const { name, nameSpan, annot, value, span } = $match;
      return SLet(name, nameSpan, annot, value, exported, doc, span);
    }
    default: {
      const other = $match;
      return other;
    }
  }
};
var setLetMeta = _curry12(3, setLetMeta$);
var setTypeMeta$ = (exported, doc, s) => {
  const $match = s;
  switch ($match._tag) {
    case "SType": {
      const { name, nameSpan, params, ctors, alias, aliasType, span } = $match;
      return SType(name, nameSpan, params, ctors, alias, aliasType, exported, doc, span);
    }
    default: {
      const other = $match;
      return other;
    }
  }
};
var setTypeMeta = _curry12(3, setTypeMeta$);
var setExternMeta$ = (exported, doc, s) => {
  const $match = s;
  switch ($match._tag) {
    case "SExtern": {
      const { name, nameSpan, params, typeExpr: t, module: m, imported: i, curried, span } = $match;
      return SExtern(name, nameSpan, params, t, m, i, curried, exported, doc, span);
    }
    case "SType": {
      const { name, nameSpan, params, ctors, alias, aliasType, span } = $match;
      return SType(name, nameSpan, params, ctors, alias, aliasType, exported, doc, span);
    }
    default: {
      const other = $match;
      return other;
    }
  }
};
var setExternMeta = _curry12(3, setExternMeta$);
var parseExprStmt = _curry12(4, (toks, pos, tmp, hooks) => {
  const start = tokAt$(toks, pos);
  return _Result_flatMap5(([value, p]) => ((p2) => Ok7(_tuple6([SExpr(value, toEnd(spanOf(start), toks, p))], p2, tmp)))(tokAt$(toks, p).tok._tag === "TSemi" ? p + 1 : p), parseExpr$(toks, pos, hooks));
});
var parseStmt$ = (toks, pos, tmp, hooks) => {
  const lt = tokAt$(toks, pos);
  const doc = lt.doc;
  const $match = lt.tok;
  switch ($match._tag) {
    case "TImport": {
      return _Result_map5(([s, p]) => _tuple6([s], p, tmp), parseImport$(toks, pos));
    }
    case "TExport": {
      const exportSp = spanOf(lt);
      const $match$ = tokAt$(toks, pos + 1).tok;
      switch ($match$._tag) {
        case "TType": {
          return _Result_map5(([s, p]) => _tuple6([widenToExport(exportSp, setTypeMeta$(true, doc, s))], p, tmp), parseType$(toks, pos + 1));
        }
        case "TExtern": {
          return _Result_map5(([s, p]) => _tuple6([widenToExport(exportSp, setExternMeta$(true, doc, s))], p, tmp), parseExtern$(toks, pos + 1));
        }
        case "TLet": {
          return _Result_map5(([stmts, p, tmp2]) => _tuple6(widenHeadToExport(exportSp, map6(setLetMeta(true, doc), stmts)), p, tmp2), parseLet$(toks, pos + 1, tmp, hooks));
        }
        default: {
          return errAt("`export` must precede let, type, or extern", tokAt$(toks, pos + 1));
        }
      }
    }
    case "TType": {
      return _Result_map5(([s, p]) => _tuple6([setTypeMeta$(false, doc, s)], p, tmp), parseType$(toks, pos));
    }
    case "TExtern": {
      return _Result_map5(([s, p]) => _tuple6([setExternMeta$(false, doc, s)], p, tmp), parseExtern$(toks, pos));
    }
    case "TLet": {
      return _Result_map5(([stmts, p, tmp2]) => _tuple6(map6(setLetMeta(false, doc), stmts), p, tmp2), parseLet$(toks, pos, tmp, hooks));
    }
    default: {
      return parseExprStmt(toks, pos, tmp, hooks);
    }
  }
};
var parseStmt = _curry12(4, parseStmt$);
var widenToExport = _curry12(2, (start, s) => {
  const $match = s;
  switch ($match._tag) {
    case "SLet": {
      const { name, nameSpan, annot, value, exported, doc, span } = $match;
      return SLet(name, nameSpan, annot, value, exported, doc, spanning(start, span));
    }
    case "SType": {
      const { name, nameSpan, params, ctors, alias, aliasType, exported, doc, span } = $match;
      return SType(name, nameSpan, params, ctors, alias, aliasType, exported, doc, spanning(start, span));
    }
    case "SExtern": {
      const { name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span } = $match;
      return SExtern(name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, spanning(start, span));
    }
    default: {
      const other = $match;
      return other;
    }
  }
});
var widenHeadToExport = _curry12(2, (start, stmts) => ((_v) => _v.length >= 1 ? (([head, ...rest]) => _Array_prepend4(widenToExport(start, head), rest))(_v) : stmts)(stmts));
var isSyncTok = (t) => {
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
var isOpener = (t) => or7(or7(t._tag === "TLparen", t._tag === "TLbrace"), t._tag === "TLbracket");
var isCloser = (t) => or7(or7(t._tag === "TRparen", t._tag === "TRbrace"), t._tag === "TRbracket");
var maxParseErrors = 100;
var resumeAt$ = (toks, pos, at) => and8(lt5(pos + 1, length9(toks)), lt5(tokAt$(toks, pos).start, at)) ? resumeAt$(toks, pos + 1, at) : pos;
var resumeAt = _curry12(3, resumeAt$);
var skipToSync$ = (toks, pos, depth) => {
  const t = tokAt$(toks, pos).tok;
  return or7(t._tag === "TEof", and8(depth === 0, isSyncTok(t))) ? pos : skipToSync$(toks, pos + 1, isOpener(t) ? depth + 1 : and8(isCloser(t), depth > 0) ? depth - 1 : depth);
};
var skipToSync = _curry12(3, skipToSync$);
var recoverFrom = _curry12(4, (toks, before, failedAt, at) => {
  const resume = resumeAt$(toks, before, at);
  const start = eq9(resume, before) ? before + 1 : resume;
  const final = skipToSync$(toks, start, 0);
  return { node: SError({ start: failedAt.start, end: tokAt$(toks, final - 1).end }), pos: final };
});
var stmtsLoop$ = (toks, pos0, tmp0, acc0, diags0, hooks) => {
  let pos = pos0;
  let tmp = tmp0;
  let acc = acc0;
  let diags = diags0;
  while (true) {
    if (tokAt$(toks, pos).tok._tag === "TEof") {
      return { stmts: acc, diagnostics: diags };
    } else {
      {
        const failedAt = tokAt$(toks, pos);
        const _step = ((_v) => _v._tag === "Ok" ? (({ value: [stmts, p, tmp2] }) => eq9(p, pos) ? ((r) => _recur5(r.pos, tmp, _Array_append8(r.node, acc), _Array_append8({ message: `unexpected token ${tokName(failedAt.tok)}`, start: failedAt.start, end: failedAt.end }, diags)))(recoverFrom(toks, pos, failedAt, failedAt.start)) : _recur5(p, tmp2, _Array_concat5(acc, stmts), diags))(_v) : _v._tag === "Err" ? (({ error: d }) => ((ds) => length9(ds) >= maxParseErrors ? _done5({ stmts: _Array_append8(SError({ start: failedAt.start, end: tokAt$(toks, length9(toks) - 1).end }), acc), diagnostics: _Array_append8({ message: "too many parse errors; stopping", start: failedAt.start, end: failedAt.end }, ds) }) : ((r) => _recur5(r.pos, tmp, _Array_append8(r.node, acc), ds))(recoverFrom(toks, pos, failedAt, d.start)))(_Array_append8(d, diags)))(_v) : (() => {
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
var stmtsLoop = _curry12(6, stmtsLoop$);
var parseRecovering = _curry12(2, (toks, pluginsOpt) => {
  const hooks = parseHooksOf(resolvePluginsDefault(pluginsOpt));
  return stmtsLoop$(toks, ((_v) => _v._tag === "TStr" ? (({ value }) => value === "use open" ? 1 : 0)(_v) : 0)(tokAt$(toks, 0).tok), 0, [], [], hooks);
});
var parseWith = _curry12(2, (toks, pluginsOpt) => {
  const r = parseRecovering(toks, pluginsOpt);
  return _Option_match11(_Array_get10(0, r.diagnostics), () => Ok7(r.stmts), (d) => Err7(d));
});

import { Err as Err8, None as None13, Ok as Ok8, Some as Some13, _Array_append as _Array_append10, _Array_contains as _Array_contains3, _Array_flatMap as _Array_flatMap4, _Array_get as _Array_get12, _Array_head as _Array_head3, _Map_get as _Map_get5, _Map_getOr as _Map_getOr4, _Map_has as _Map_has3, _Map_keys as _Map_keys5, _Map_set as _Map_set4, _Option_isNone, _Option_isSome as _Option_isSome3, _Option_match as _Option_match13, _Option_orElse, _Option_unwrapOr as _Option_unwrapOr8, _Result_flatMap as _Result_flatMap6, _Result_match as _Result_match4, _Set_add as _Set_add2, _Set_fromArray as _Set_fromArray2, _Set_has as _Set_has2, _Str_codeAt as _Str_codeAt6, _Str_join as _Str_join5, _curry as _curry14, _tuple as _tuple7, and as and10, eq as eq11, filter as filter5, length as length11, map as map8, or as or8, show as show6 } from "@mochi/compiler/runtime";
import { match as match6 } from "@onrails/pattern";

import { None as None12, Some as Some12, _Array_append as _Array_append9, _Array_concat as _Array_concat6, _Array_contains as _Array_contains2, _Array_drop, _Array_flatMap as _Array_flatMap3, _Array_get as _Array_get11, _Array_head as _Array_head2, _Array_prepend as _Array_prepend5, _Array_tail as _Array_tail2, _Array_take as _Array_take2, _Map_get as _Map_get4, _Map_getOr as _Map_getOr3, _Map_keys as _Map_keys4, _Option_isSome as _Option_isSome2, _Option_match as _Option_match12, _Option_unwrapOr as _Option_unwrapOr7, _Str_concat, _Str_endsWith, _Str_join as _Str_join4, _curry as _curry13, and as and9, eq as eq10, filter as filter4, length as length10, map as map7, reduce as reduce3, show as show5, sub as sub5 } from "@mochi/compiler/runtime";
var MWild = { _tag: "MWild" };
var MCtor = _curry13(2, (name, args) => ({ _tag: "MCtor", name, args }));
var MBool = (value) => ({ _tag: "MBool", value });
var MNum = (value) => ({ _tag: "MNum", value });
var MStr = (value) => ({ _tag: "MStr", value });
var MTuple = (elems) => ({ _tag: "MTuple", elems });
var MRecord = _curry13(2, (labels, pats) => ({ _tag: "MRecord", labels, pats }));
var MArr = _curry13(2, (elems, rest) => ({ _tag: "MArr", elems, rest }));
var MOpaque = { _tag: "MOpaque" };
var HCtor = (name) => ({ _tag: "HCtor", name });
var HBool = (value) => ({ _tag: "HBool", value });
var HNum = (value) => ({ _tag: "HNum", value });
var HStr = (value) => ({ _tag: "HStr", value });
var HTuple = (arity) => ({ _tag: "HTuple", arity });
var HRecord = { _tag: "HRecord" };
var HArr = (len) => ({ _tag: "HArr", len });
var UNone = (fuel) => ({ _tag: "UNone", fuel });
var USome = _curry13(2, (row, fuel) => ({ _tag: "USome", row, fuel }));
var UFuel = { _tag: "UFuel" };
var ExOk = { _tag: "ExOk" };
var ExWitness = (witness) => ({ _tag: "ExWitness", witness });
var ExFuel = { _tag: "ExFuel" };
var mWilds = (n) => n <= 0 ? [] : _Array_prepend5(MWild, mWilds(sub5(n, 1)));
var isWildMP = (mp) => {
  const $match = mp;
  switch ($match._tag) {
    case "MWild": {
      return true;
    }
    default: {
      return false;
    }
  }
};
var explodePat = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return explodePat(pat);
    }
    case "POr": {
      const { alts } = $match;
      return _Array_flatMap3(explodePat, alts);
    }
    default: {
      return [p];
    }
  }
};
var toMP = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return toMP(pat);
    }
    case "PWild": {
      return MWild;
    }
    case "PUnit": {
      return MWild;
    }
    case "PBind": {
      return MWild;
    }
    case "PLit": {
      const { value: v } = $match;
      return MNum(v);
    }
    case "PBool": {
      const { value: v } = $match;
      return MBool(v);
    }
    case "PStr": {
      const { value: v } = $match;
      return MStr(v);
    }
    case "PTuple": {
      const { elems } = $match;
      return MTuple(map7(toMP, elems));
    }
    case "PCtor": {
      const { ctor: name, args } = $match;
      return MCtor(name, map7(toMP, args));
    }
    case "PRecord": {
      const { fields } = $match;
      return MRecord(map7((f) => f.label, fields), map7((f) => toMP(f.pat), fields));
    }
    case "PArr": {
      const { elems, rest } = $match;
      return MArr(map7(toMP, elems), _Option_isSome2(rest));
    }
    case "PList": {
      return MOpaque;
    }
    case "POr": {
      return MOpaque;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var headOf = (mp) => {
  const $match = mp;
  switch ($match._tag) {
    case "MWild": {
      return None12;
    }
    case "MOpaque": {
      return None12;
    }
    case "MCtor": {
      const { name: n } = $match;
      return Some12(HCtor(n));
    }
    case "MBool": {
      const { value: v } = $match;
      return Some12(HBool(v));
    }
    case "MNum": {
      const { value: v } = $match;
      return Some12(HNum(v));
    }
    case "MStr": {
      const { value: v } = $match;
      return Some12(HStr(v));
    }
    case "MTuple": {
      const { elems } = $match;
      return Some12(HTuple(length10(elems)));
    }
    case "MRecord": {
      return Some12(HRecord);
    }
    case "MArr": {
      const { elems } = $match;
      return Some12(HArr(length10(elems)));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var colOf = (m) => _Array_flatMap3((row) => _Option_match12(_Array_head2(row), () => [], (hd) => [hd]), m);
var headsOf = (col) => _Array_flatMap3((mp) => _Option_match12(headOf(mp), () => [], (h) => [h]), col);
var addLabel = _curry13(2, (acc, l) => _Array_contains2(l, acc) ? acc : _Array_append9(l, acc));
var labelsOfMP$ = (acc, mp) => {
  const $match = mp;
  switch ($match._tag) {
    case "MRecord": {
      const { labels: ls } = $match;
      return reduce3(addLabel, acc, ls);
    }
    default: {
      return acc;
    }
  }
};
var labelsOfMP = _curry13(2, labelsOfMP$);
var recordLabelsOf = (col) => reduce3(labelsOfMP, [], col);
var indexOfLabel = _curry13(3, (l, labels, i) => _Option_match12(_Array_get11(i, labels), () => sub5(0, 1), (x) => eq10(x, l) ? i : indexOfLabel(l, labels, i + 1)));
var fieldOf = _curry13(3, (l, labels, pats) => {
  const i = indexOfLabel(l, labels, 0);
  return i < 0 ? MWild : _Option_unwrapOr7(MWild, _Array_get11(i, pats));
});
var arrShapeStep$ = (acc, mp) => {
  const $match = mp;
  switch ($match._tag) {
    case "MArr": {
      const { elems, rest } = $match;
      const n = length10(elems);
      return rest ? { fixed: acc.fixed, restFrom: _Option_match12(acc.restFrom, () => Some12(n), (m) => Some12(m < n ? m : n)) } : { fixed: _Array_contains2(n, acc.fixed) ? acc.fixed : _Array_append9(n, acc.fixed), restFrom: acc.restFrom };
    }
    default: {
      return acc;
    }
  }
};
var arrShapeStep = _curry13(2, arrShapeStep$);
var arrShapeOf = (col) => reduce3(arrShapeStep, { fixed: [], restFrom: None12 }, col);
var rangeCovered = _curry13(3, (shape, i, n) => i >= n ? true : and9(_Array_contains2(i, shape.fixed), rangeCovered(shape, i + 1, n)));
var arrComplete = (shape) => _Option_match12(shape.restFrom, () => false, (r) => rangeCovered(shape, 0, r));
var arrMissingLen = _curry13(2, (shape, n) => and9(!_Array_contains2(n, shape.fixed), _Option_match12(shape.restFrom, () => true, (r) => n < r)) ? n : arrMissingLen(shape, n + 1));
var rangeArr$ = (i, top) => i > top ? [] : _Array_prepend5(i, rangeArr$(i + 1, top));
var rangeArr = _curry13(2, rangeArr$);
var arrLengths = (shape) => {
  const top = reduce3(_curry13(2, (a, x) => x > a ? x : a), _Option_unwrapOr7(0, shape.restFrom), shape.fixed);
  return rangeArr$(0, top);
};
var specializeRow$ = (h, mp, labels) => {
  const $match = h;
  switch ($match._tag) {
    case "HCtor": {
      const { name } = $match;
      const $match$ = mp;
      switch ($match$._tag) {
        case "MCtor": {
          const { name: n, args } = $match$;
          return eq10(n, name) ? Some12(args) : None12;
        }
        default: {
          return None12;
        }
      }
    }
    case "HBool": {
      const { value: v } = $match;
      const $match$ = mp;
      switch ($match$._tag) {
        case "MBool": {
          const { value: b } = $match$;
          return eq10(b, v) ? Some12([]) : None12;
        }
        default: {
          return None12;
        }
      }
    }
    case "HNum": {
      const { value: v } = $match;
      const $match$ = mp;
      switch ($match$._tag) {
        case "MNum": {
          const { value: x } = $match$;
          return eq10(x, v) ? Some12([]) : None12;
        }
        default: {
          return None12;
        }
      }
    }
    case "HStr": {
      const { value: v } = $match;
      const $match$ = mp;
      switch ($match$._tag) {
        case "MStr": {
          const { value: x } = $match$;
          return eq10(x, v) ? Some12([]) : None12;
        }
        default: {
          return None12;
        }
      }
    }
    case "HTuple": {
      const $match$ = mp;
      switch ($match$._tag) {
        case "MTuple": {
          const { elems } = $match$;
          return Some12(elems);
        }
        default: {
          return None12;
        }
      }
    }
    case "HRecord": {
      const $match$ = mp;
      switch ($match$._tag) {
        case "MRecord": {
          const { labels: ls, pats: ps } = $match$;
          return Some12(map7((l) => fieldOf(l, ls, ps), labels));
        }
        default: {
          return None12;
        }
      }
    }
    case "HArr": {
      const { len } = $match;
      const $match$ = mp;
      switch ($match$._tag) {
        case "MArr": {
          const { elems, rest } = $match$;
          const k = length10(elems);
          return rest ? k <= len ? Some12(_Array_concat6(elems, mWilds(sub5(len, k)))) : None12 : eq10(k, len) ? Some12(elems) : None12;
        }
        default: {
          return None12;
        }
      }
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var specializeRow = _curry13(3, specializeRow$);
var specializeOne$ = (h, arity, labels, row) => _Option_match12(_Array_head2(row), () => [], (hd) => {
  const rest = _Array_tail2(row);
  return isWildMP(hd) ? [_Array_concat6(mWilds(arity), rest)] : _Option_match12(specializeRow$(h, hd, labels), () => [], (sub) => [_Array_concat6(sub, rest)]);
});
var specializeOne = _curry13(4, specializeOne$);
var specializeM$ = (m, h, arity, labels) => _Array_flatMap3((row) => specializeOne$(h, arity, labels, row), m);
var specializeM = _curry13(4, specializeM$);
var defaultM = (m) => _Array_flatMap3((row) => _Option_match12(_Array_head2(row), () => [], (hd) => isWildMP(hd) ? [_Array_tail2(row)] : []), m);
var rebuild$ = (h, args, labels) => {
  const $match = h;
  switch ($match._tag) {
    case "HCtor": {
      const { name } = $match;
      return MCtor(name, args);
    }
    case "HTuple": {
      return MTuple(args);
    }
    case "HRecord": {
      return MRecord(labels, args);
    }
    case "HArr": {
      return MArr(args, false);
    }
    case "HBool": {
      const { value: v } = $match;
      return MBool(v);
    }
    case "HNum": {
      const { value: v } = $match;
      return MNum(v);
    }
    case "HStr": {
      const { value: v } = $match;
      return MStr(v);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var rebuild = _curry13(3, rebuild$);
var takenNums = (heads) => _Array_flatMap3((h) => {
  const $match = h;
  switch ($match._tag) {
    case "HNum": {
      const { value: v } = $match;
      return [v];
    }
    default: {
      return [];
    }
  }
}, heads);
var freshNum$ = (taken, i) => _Array_contains2(i, taken) ? freshNum$(taken, i + 1) : i;
var freshNum = _curry13(2, freshNum$);
var takenStrs = (heads) => _Array_flatMap3((h) => {
  const $match = h;
  switch ($match._tag) {
    case "HStr": {
      const { value: v } = $match;
      return [v];
    }
    default: {
      return [];
    }
  }
}, heads);
var starsOf = (n) => n <= 0 ? "" : _Str_concat("*", starsOf(sub5(n, 1)));
var freshStr$ = (taken, i) => {
  const s = starsOf(i);
  return _Array_contains2(s, taken) ? freshStr$(taken, i + 1) : s;
};
var freshStr = _curry13(2, freshStr$);
var ctorNames = (heads) => _Array_flatMap3((h) => {
  const $match = h;
  switch ($match._tag) {
    case "HCtor": {
      const { name: n } = $match;
      return [n];
    }
    default: {
      return [];
    }
  }
}, heads);
var boolVals = (heads) => _Array_flatMap3((h) => {
  const $match = h;
  switch ($match._tag) {
    case "HBool": {
      const { value: v } = $match;
      return [v];
    }
    default: {
      return [];
    }
  }
}, heads);
var ctorInfoSuffixed$ = (keys, reg, n) => ((_v) => _v.length === 0 ? None12 : _v.length >= 1 ? (([k, ...rest]) => _Str_endsWith(`.${n}`, k) ? _Map_get4(k, reg.ctors) : ctorInfoSuffixed$(rest, reg, n))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(keys);
var ctorInfoSuffixed = _curry13(3, ctorInfoSuffixed$);
var ctorInfoOf$ = (reg, n) => _Option_match12(_Map_get4(n, reg.ctors), () => ctorInfoSuffixed$(_Map_keys4(reg.ctors), reg, n), (info) => Some12(info));
var ctorInfoOf = _curry13(2, ctorInfoOf$);
var arityOfCtor$ = (reg, n) => _Option_match12(ctorInfoOf$(reg, n), () => 0, (info) => info.arity);
var arityOfCtor = _curry13(2, arityOfCtor$);
var ownerOfCtor$ = (reg, n) => _Option_match12(ctorInfoOf$(reg, n), () => None12, (info) => Some12(info.owner));
var ownerOfCtor = _curry13(2, ownerOfCtor$);
var allNamesIn = _curry13(2, (all, names) => reduce3(_curry13(2, (acc, n) => and9(acc, _Array_contains2(n, names))), true, all));
var useful$ = (m, width, reg, fuel) => fuel <= 0 ? UFuel : width === 0 ? length10(m) === 0 ? USome([], sub5(fuel, 1)) : UNone(sub5(fuel, 1)) : length10(m) === 0 ? USome(mWilds(width), sub5(fuel, 1)) : usefulSplit$(m, width, reg, sub5(fuel, 1));
var useful = _curry13(4, useful$);
var usefulSplit$ = (m, width, reg, fuel) => {
  const col = colOf(m);
  const heads = headsOf(col);
  return _Option_match12(_Array_head2(heads), () => prependWitness$(MWild, useful$(defaultM(m), sub5(width, 1), reg, fuel)), (h0) => usefulHead$(m, col, heads, h0, width, reg, fuel));
};
var usefulSplit = _curry13(4, usefulSplit$);
var prependWitness$ = (mp, r) => {
  const $match = r;
  switch ($match._tag) {
    case "UFuel": {
      return UFuel;
    }
    case "UNone": {
      const { fuel: f } = $match;
      return UNone(f);
    }
    case "USome": {
      const { row, fuel: f } = $match;
      return USome(_Array_prepend5(mp, row), f);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var prependWitness = _curry13(2, prependWitness$);
var tryHeads$ = (m, heads, arities, labels, width, reg, fuel, i) => _Option_match12(_Array_get11(i, heads), () => UNone(fuel), (h) => {
  const arity = _Option_unwrapOr7(0, _Array_get11(i, arities));
  const $match = useful$(specializeM$(m, h, arity, labels), sub5(arity + width, 1), reg, fuel);
  switch ($match._tag) {
    case "UFuel": {
      return UFuel;
    }
    case "UNone": {
      const { fuel: f2 } = $match;
      return tryHeads$(m, heads, arities, labels, width, reg, f2, i + 1);
    }
    case "USome": {
      const { row, fuel: f2 } = $match;
      return USome(_Array_prepend5(rebuild$(h, _Array_take2(arity, row), labels), _Array_drop(arity, row)), f2);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
var tryHeads = _curry13(8, tryHeads$);
var usefulHead$ = (m, col, heads, h0, width, reg, fuel) => {
  const $match = h0;
  switch ($match._tag) {
    case "HTuple": {
      const { arity } = $match;
      return tryHeads$(m, [HTuple(arity)], [arity], [], width, reg, fuel, 0);
    }
    case "HRecord": {
      const labels = recordLabelsOf(col);
      return tryHeads$(m, [HRecord], [length10(labels)], labels, width, reg, fuel, 0);
    }
    case "HCtor": {
      return usefulCtor$(m, heads, width, reg, fuel);
    }
    case "HBool": {
      return usefulBool$(m, heads, width, reg, fuel);
    }
    case "HArr": {
      return usefulArr$(m, col, width, reg, fuel);
    }
    case "HNum": {
      return prependWitness$(MNum(freshNum$(takenNums(heads), 0)), useful$(defaultM(m), sub5(width, 1), reg, fuel));
    }
    case "HStr": {
      return prependWitness$(MStr(freshStr$(takenStrs(heads), 0)), useful$(defaultM(m), sub5(width, 1), reg, fuel));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var usefulHead = _curry13(7, usefulHead$);
var usefulCtor$ = (m, heads, width, reg, fuel) => {
  const names = ctorNames(heads);
  const ownerOpt = _Option_match12(_Array_head2(names), () => None12, (n) => ownerOfCtor$(reg, n));
  const all = _Option_match12(ownerOpt, () => [], (o) => _Map_getOr3([], o, reg.types));
  return and9(length10(all) > 0, allNamesIn(all, names)) ? tryHeads$(m, map7((n) => HCtor(n), all), map7((n) => arityOfCtor$(reg, n), all), [], width, reg, fuel, 0) : prependWitness$(_Option_match12(_Array_head2(filter4((n) => !_Array_contains2(n, names), all)), () => MWild, (n) => MCtor(n, mWilds(arityOfCtor$(reg, n)))), useful$(defaultM(m), sub5(width, 1), reg, fuel));
};
var usefulCtor = _curry13(5, usefulCtor$);
var usefulBool$ = (m, heads, width, reg, fuel) => {
  const vs = boolVals(heads);
  const hasTrue = _Array_contains2(true, vs);
  return and9(hasTrue, _Array_contains2(false, vs)) ? tryHeads$(m, [HBool(true), HBool(false)], [0, 0], [], width, reg, fuel, 0) : prependWitness$(MBool(!hasTrue), useful$(defaultM(m), sub5(width, 1), reg, fuel));
};
var usefulBool = _curry13(5, usefulBool$);
var usefulArr$ = (m, col, width, reg, fuel) => {
  const shape = arrShapeOf(col);
  return arrComplete(shape) ? ((lens) => tryHeads$(m, map7((n) => HArr(n), lens), lens, [], width, reg, fuel, 0))(arrLengths(shape)) : prependWitness$(MArr(mWilds(arrMissingLen(shape, 0)), false), useful$(defaultM(m), sub5(width, 1), reg, fuel));
};
var usefulArr = _curry13(5, usefulArr$);
var showFields$ = (labels, pats, i) => _Option_match12(_Array_get11(i, labels), () => [], (l) => _Array_prepend5(`${l}: ${showWitness(_Option_unwrapOr7(MWild, _Array_get11(i, pats)))}`, showFields$(labels, pats, i + 1)));
var showFields = _curry13(3, showFields$);
var showWitness = (mp) => {
  const $match = mp;
  switch ($match._tag) {
    case "MWild": {
      return "_";
    }
    case "MOpaque": {
      return "_";
    }
    case "MBool": {
      const { value: v } = $match;
      return show5(v);
    }
    case "MNum": {
      const { value: v } = $match;
      return show5(v);
    }
    case "MStr": {
      const { value: v } = $match;
      return show5(v);
    }
    case "MCtor": {
      const { name: n, args } = $match;
      return length10(args) === 0 ? n : `${n}(${_Str_join4(", ", map7(showWitness, args))})`;
    }
    case "MTuple": {
      const { elems } = $match;
      return `(${_Str_join4(", ", map7(showWitness, elems))})`;
    }
    case "MRecord": {
      const { labels, pats } = $match;
      return `{ ${_Str_join4(", ", showFields$(labels, pats, 0))} }`;
    }
    case "MArr": {
      const { elems, rest } = $match;
      return `[${_Str_join4(", ", _Array_concat6(map7(showWitness, elems), rest ? ["..."] : []))}]`;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var isWideWitnessM = (mp) => {
  const $match = mp;
  switch ($match._tag) {
    case "MWild": {
      return true;
    }
    case "MCtor": {
      const { args } = $match;
      return reduce3(_curry13(2, (acc, a) => and9(acc, isWildMP(a))), true, args);
    }
    default: {
      return false;
    }
  }
};
var checkExhaustiveM$ = (patterns, reg) => {
  const rows = _Array_flatMap3((p) => map7((alt) => [toMP(alt)], explodePat(p)), patterns);
  const $match = useful$(rows, 1, reg, 20000);
  switch ($match._tag) {
    case "UFuel": {
      return ExFuel;
    }
    case "UNone": {
      return ExOk;
    }
    case "USome": {
      const { row } = $match;
      return ExWitness(_Option_unwrapOr7(MWild, _Array_head2(row)));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var checkExhaustiveM = _curry13(2, checkExhaustiveM$);

var checkErr = _curry14(2, (message, sp) => ({ message, start: sp.start, end: sp.end }));
var firstSomeFrom = _curry14(3, (f, xs, i0) => {
  let i = i0;
  while (true) {
    {
      const $loopMatch = _Array_get12(i, xs);
      if ($loopMatch._tag === "None") {
        return None13;
      }
      if ($loopMatch._tag === "Some") {
        const { value: x } = $loopMatch;
        {
          const $loopMatch = f(x);
          if ($loopMatch._tag === "Some") {
            const { value: e } = $loopMatch;
            return Some13(e);
          }
          if ($loopMatch._tag === "None") {
            i = i + 1;
            continue;
          }
          throw new Error("non-exhaustive match");
        }
      }
      throw new Error("non-exhaustive match");
    }
  }
});
var firstSome = _curry14(2, (f, xs) => firstSomeFrom(f, xs, 0));
var allOfFrom = _curry14(3, (f, xs, i0) => {
  let i = i0;
  while (true) {
    {
      const $loopMatch = _Array_get12(i, xs);
      if ($loopMatch._tag === "None") {
        return true;
      }
      if ($loopMatch._tag === "Some") {
        const { value: x } = $loopMatch;
        if (f(x)) {
          i = i + 1;
          continue;
        } else {
          return false;
        }
      }
      throw new Error("non-exhaustive match");
    }
  }
});
var allOf = _curry14(2, (f, xs) => allOfFrom(f, xs, 0));
var someOfFrom2 = _curry14(3, (f, xs, i0) => {
  let i = i0;
  while (true) {
    {
      const $loopMatch = _Array_get12(i, xs);
      if ($loopMatch._tag === "None") {
        return false;
      }
      if ($loopMatch._tag === "Some") {
        const { value: x } = $loopMatch;
        if (f(x)) {
          return true;
        } else {
          i = i + 1;
          continue;
        }
      }
      throw new Error("non-exhaustive match");
    }
  }
});
var someOf2 = _curry14(2, (f, xs) => someOfFrom2(f, xs, 0));
var exprSpan2 = (e) => {
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
var patSpan2 = (p) => {
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
var isCatchAll = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PWild": {
      return true;
    }
    case "PUnit": {
      return true;
    }
    case "PBind": {
      return true;
    }
    case "PAs": {
      const { pat } = $match;
      return isCatchAll(pat);
    }
    case "PRecord": {
      const { fields } = $match;
      return allOf((f) => isCatchAll(f.pat), fields);
    }
    case "PTuple": {
      const { elems } = $match;
      return allOf(isCatchAll, elems);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return and10(length11(elems) === 0, _Option_isSome3(rest));
    }
    case "PList": {
      const { elems, rest } = $match;
      return and10(length11(elems) === 0, _Option_isSome3(rest));
    }
    default: {
      return false;
    }
  }
};
var isPList = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PList": {
      return true;
    }
    default: {
      return false;
    }
  }
};
var isPCtor = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PCtor": {
      return true;
    }
    default: {
      return false;
    }
  }
};
var ctorNameOf = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PCtor": {
      const { ctor: name } = $match;
      return name;
    }
    default: {
      return "";
    }
  }
};
var patCtorKey$ = (ctor, ns) => _Option_match13(ns, () => ctor, (alias) => `${alias}.${ctor}`);
var patCtorKey = _curry14(2, patCtorKey$);
var seqElemsRest = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PArr": {
      const { elems, rest } = $match;
      return Some13(_tuple7(elems, rest));
    }
    case "PList": {
      const { elems, rest } = $match;
      return Some13(_tuple7(elems, rest));
    }
    default: {
      return None13;
    }
  }
};
var checkPattern = _curry14(3, (p, reg, top) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return checkPattern(pat, reg, top);
    }
    case "PCtor": {
      const { ctor, args, ns, span: sp } = $match;
      const key = patCtorKey$(ctor, ns);
      return _Option_match13(_Map_get5(key, reg.ctors), () => Some13(checkErr(`unknown constructor '${key}'`, sp)), (info) => eq11(length11(args), info.arity) ? firstSome((a) => checkPattern(a, reg, false), args) : Some13(checkErr(`constructor '${ctor}' expects ${show6(info.arity)} arg(s), got ${show6(length11(args))}`, sp)));
    }
    case "PRecord": {
      const { fields } = $match;
      return firstSome((f) => checkPattern(f.pat, reg, false), fields);
    }
    case "PTuple": {
      const { elems } = $match;
      return firstSome((el) => checkPattern(el, reg, false), elems);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return _Option_orElse(_Option_match13(rest, () => None13, (r) => checkPattern(r, reg, false)), firstSome((el) => checkPattern(el, reg, false), elems));
    }
    case "PList": {
      const { elems, rest, span: sp } = $match;
      return top ? _Option_orElse(_Option_match13(rest, () => None13, (r) => checkPattern(r, reg, false)), firstSome((el) => checkPattern(el, reg, false), elems)) : Some13(checkErr("lazy-List pattern cannot nest inside another pattern (matching pulls from the sequence)", sp));
    }
    case "POr": {
      const { alts, span: sp } = $match;
      return checkOrPattern(alts, sp, reg);
    }
    default: {
      return None13;
    }
  }
});
var binderPathsArgs$ = (args, i, at, acc) => _Option_match13(_Array_get12(i, args), () => Ok8(acc), (a) => _Result_flatMap6((acc2) => binderPathsArgs$(args, i + 1, at, acc2), binderPaths$(a, `${at}.a${show6(i)}`, acc)));
var binderPathsArgs = _curry14(4, binderPathsArgs$);
var binderPathsFields$ = (fields, i, at, acc) => _Option_match13(_Array_get12(i, fields), () => Ok8(acc), (f) => _Result_flatMap6((acc2) => binderPathsFields$(fields, i + 1, at, acc2), binderPaths$(f.pat, `${at}.${f.label}`, acc)));
var binderPathsFields = _curry14(4, binderPathsFields$);
var binderPathsElems$ = (elems, i, at, acc) => _Option_match13(_Array_get12(i, elems), () => Ok8(acc), (e) => _Result_flatMap6((acc2) => binderPathsElems$(elems, i + 1, at, acc2), binderPaths$(e, `${at}.t${show6(i)}`, acc)));
var binderPathsElems = _curry14(4, binderPathsElems$);
var binderPaths$ = (p, at, acc) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat, name, nameSpan: nameSp } = $match;
      return _Result_flatMap6((acc1) => _Map_has3(name, acc1) ? Err8(checkErr(`pattern binds '${name}' more than once`, nameSp)) : Ok8(_Map_set4(name, at, acc1)), binderPaths$(pat, at, acc));
    }
    case "PBind": {
      const { name, span: sp } = $match;
      return _Map_has3(name, acc) ? Err8(checkErr(`pattern binds '${name}' more than once`, sp)) : Ok8(_Map_set4(name, at, acc));
    }
    case "PCtor": {
      const { args } = $match;
      return binderPathsArgs$(args, 0, at, acc);
    }
    case "PRecord": {
      const { fields } = $match;
      return binderPathsFields$(fields, 0, at, acc);
    }
    case "PTuple": {
      const { elems } = $match;
      return binderPathsElems$(elems, 0, at, acc);
    }
    default: {
      return Ok8(acc);
    }
  }
};
var binderPaths = _curry14(3, binderPaths$);
var altMapsFrom = _curry14(4, (alts, i, reg, acc) => _Option_match13(_Array_get12(i, alts), () => Ok8(acc), (alt) => isCatchAll(alt) ? Err8(checkErr("an or-pattern alternative can't be a catch-all (`_` or a bare binding)", patSpan2(alt))) : _Option_isSome3(seqElemsRest(alt)) ? Err8(checkErr("array/list patterns can't appear as an or-pattern alternative", patSpan2(alt))) : _Option_match13(checkPattern(alt, reg, false), () => _Result_flatMap6((m) => altMapsFrom(alts, i + 1, reg, _Array_append10(m, acc)), binderPaths$(alt, "", new Map)), (e) => Err8(e))));
var missingNameErr = _curry14(2, (name, sp) => checkErr(`or-pattern alternatives must bind the same names ('${name}' is missing in an alternative)`, sp));
var consistentBindsFrom = _curry14(4, (maps, i, ref, sp) => _Option_match13(_Array_get12(i, maps), () => None13, (m) => _Option_orElse(consistentBindsFrom(maps, i + 1, ref, sp), _Option_orElse(firstSome((name) => _Map_has3(name, ref) ? eq11(_Map_getOr4("", name, ref), _Map_getOr4("", name, m)) ? None13 : Some13(checkErr(`or-pattern binds '${name}' at a differing position across alternatives`, sp)) : Some13(missingNameErr(name, sp)), _Map_keys5(m)), firstSome((name) => _Map_has3(name, m) ? None13 : Some13(missingNameErr(name, sp)), _Map_keys5(ref))))));
var checkOrPattern = _curry14(3, (alts, sp, reg) => _Result_match4(altMapsFrom(alts, 0, reg, []), (e) => Some13(e), (maps) => _Option_match13(_Array_head3(maps), () => None13, (ref) => consistentBindsFrom(maps, 1, ref, sp))));
var armUnguardedCatchAll = (a) => and10(isCatchAll(a.pattern), _Option_isNone(a.guard));
var guardErrs$ = (arms, listSwitch) => firstSome((a) => _Option_match13(a.guard, () => None13, (g) => or8(isPList(a.pattern), listSwitch) ? Some13(checkErr("`when` guards are unsupported in a lazy-List switch (matching pulls from the sequence)", exprSpan2(g))) : None13), arms);
var guardErrs = _curry14(2, guardErrs$);
var firstCatchIdx$ = (arms, i0) => {
  let i = i0;
  while (true) {
    {
      const $loopMatch = _Array_get12(i, arms);
      if ($loopMatch._tag === "None") {
        return None13;
      }
      if ($loopMatch._tag === "Some") {
        const { value: a } = $loopMatch;
        if (armUnguardedCatchAll(a)) {
          return Some13(i);
        } else {
          i = i + 1;
          continue;
        }
      }
      throw new Error("non-exhaustive match");
    }
  }
};
var firstCatchIdx = _curry14(2, firstCatchIdx$);
var unreachableAfterCatch = (arms) => _Option_match13(firstCatchIdx$(arms, 0), () => None13, (i) => _Option_match13(_Array_get12(i + 1, arms), () => None13, (a) => Some13(checkErr("unreachable arm: a catch-all arm above it matches first", patSpan2(a.pattern)))));
var SeqNotSeq = { _tag: "SeqNotSeq" };
var SeqTotal = { _tag: "SeqTotal" };
var SeqFail = (e) => ({ _tag: "SeqFail", e });
var checkSeqExhaustive = _curry14(2, (arms, mSpan) => {
  const seqs = map8((a) => a.pattern, filter5((a) => and10(_Option_isNone(a.guard), _Option_isSome3(seqElemsRest(a.pattern))), arms));
  return length11(seqs) === 0 ? SeqNotSeq : ((hasEmpty) => ((hasCons) => and10(hasEmpty, hasCons) ? SeqTotal : SeqFail(checkErr("non-exhaustive list switch: cover `[]` and `[x, ...xs]` (or add `_`)", mSpan)))(someOf2((p) => ((_v) => _v._tag === "Some" ? (({ value: [elems, rest] }) => and10(length11(elems) === 1, _Option_isSome3(rest)))(_v) : _v._tag === "None" ? false : (() => {
    throw new Error("non-exhaustive match");
  })())(seqElemsRest(p)), seqs)))(someOf2((p) => ((_v) => _v._tag === "Some" ? (({ value: [elems, rest] }) => and10(length11(elems) === 0, _Option_isNone(rest)))(_v) : _v._tag === "None" ? false : (() => {
    throw new Error("non-exhaustive match");
  })())(seqElemsRest(p)), seqs));
});
var ctorLoop = _curry14(5, (arms, i, reg, owner, covered) => _Option_match13(_Array_get12(i, arms), () => Ok8(_tuple7(owner, covered)), (a) => {
  const $match = a.pattern;
  switch ($match._tag) {
    case "PCtor": {
      const { ctor, args, ns, span: sp } = $match;
      const key = patCtorKey$(ctor, ns);
      return _Option_match13(_Map_get5(key, reg.ctors), () => Err8(checkErr(`unknown constructor '${key}'`, sp)), (info) => !eq11(length11(args), info.arity) ? Err8(checkErr(`constructor '${ctor}' expects ${show6(info.arity)} arg(s), got ${show6(length11(args))}`, sp)) : ((_v) => _v._tag === "Some" && (({ value: own }) => !eq11(own, info.owner))(_v) ? (({ value: own }) => Err8(checkErr(`switch mixes variants of '${own}' and '${info.owner}'`, sp)))(_v) : ((covered2) => ctorLoop(arms, i + 1, reg, Some13(info.owner), covered2))(and10(allOf(isCatchAll, args), _Option_isNone(a.guard)) ? _Set_add2(ctor, covered) : covered))(owner));
    }
    default: {
      return ctorLoop(arms, i + 1, reg, owner, covered);
    }
  }
}));
var seqVerdict = _curry14(2, (arms, mSpan) => {
  const $match = checkSeqExhaustive(arms, mSpan);
  switch ($match._tag) {
    case "SeqTotal": {
      return None13;
    }
    case "SeqFail": {
      const { e } = $match;
      return Some13(e);
    }
    case "SeqNotSeq": {
      return None13;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
var unguardedPatterns = (arms) => _Array_flatMap4((a) => _Option_isNone(a.guard) ? [a.pattern] : [], arms);
var namedUnguarded = (leaves) => _Set_fromArray2(_Array_flatMap4((a) => and10(isPCtor(a.pattern), _Option_isNone(a.guard)) ? [ctorNameOf(a.pattern)] : [], leaves));
var matrixVerdict = _curry14(5, (arms, leaves, ownerOpt, mSpan, reg) => {
  const $match = checkExhaustiveM(unguardedPatterns(arms), reg);
  switch ($match._tag) {
    case "ExOk": {
      return None13;
    }
    case "ExFuel": {
      return Some13(checkErr("switch too complex to prove exhaustive \u2014 add a `_` catch-all arm", mSpan));
    }
    case "ExWitness": {
      const { witness: w } = $match;
      const own = _Option_unwrapOr8("", ownerOpt);
      const named = namedUnguarded(leaves);
      const absent = filter5((c) => !_Set_has2(c, named), _Map_getOr4([], own, reg.types));
      return and10(and10(isWideWitnessM(w), own !== ""), length11(absent) > 0) ? Some13(checkErr(`non-exhaustive switch on '${own}': missing ${_Str_join5(", ", absent)}`, mSpan)) : Some13(checkErr(`non-exhaustive switch: '${showWitness(w)}' is not matched`, mSpan));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
var leavesOfArm = (a) => {
  const $match = a.pattern;
  switch ($match._tag) {
    case "POr": {
      const { alts } = $match;
      return map8((alt) => ({ pattern: alt, guard: a.guard }), alts);
    }
    default: {
      return [{ pattern: a.pattern, guard: a.guard }];
    }
  }
};
var checkMatch = _curry14(3, (arms, mSpan, reg) => _Option_match13(firstSome((a) => checkPattern(a.pattern, reg, true), arms), () => {
  const listSwitch = someOf2((a) => and10(isPList(a.pattern), !isCatchAll(a.pattern)), arms);
  return _Option_match13(guardErrs$(arms, listSwitch), () => _Option_match13(unreachableAfterCatch(arms), () => {
    const hasCatchAll = someOf2(armUnguardedCatchAll, arms);
    const leaves = _Array_flatMap4(leavesOfArm, arms);
    const ctorArms = filter5((a) => isPCtor(a.pattern), leaves);
    return someOf2((a) => isPList(a.pattern), arms) ? hasCatchAll ? None13 : seqVerdict(arms, mSpan) : ((_v) => _v._tag === "Err" ? (({ error: e }) => Some13(e))(_v) : _v._tag === "Ok" ? (({ value: [ownerOpt] }) => matrixVerdict(arms, leaves, ownerOpt, mSpan, reg))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(ctorLoop(ctorArms, 0, reg, None13, _Set_fromArray2([])));
  }, (e) => Some13(e)), (e) => Some13(e));
}, (e) => Some13(e)));
var checkExpr$ = (e, reg) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return None13;
    }
    case "EUnit": {
      return None13;
    }
    case "EBool": {
      return None13;
    }
    case "EStr": {
      return None13;
    }
    case "ERef": {
      return None13;
    }
    case "ECall": {
      const { fn, args } = $match;
      return _Option_orElse(firstSome((a) => checkExpr$(a, reg), args), checkExpr$(fn, reg));
    }
    case "ELambda": {
      const { body } = $match;
      return checkExpr$(body, reg);
    }
    case "ELetIn": {
      const { value, body } = $match;
      return _Option_orElse(checkExpr$(body, reg), checkExpr$(value, reg));
    }
    case "ELetBind": {
      const { value, body } = $match;
      return _Option_orElse(checkExpr$(body, reg), checkExpr$(value, reg));
    }
    case "EPipe": {
      const { left, right } = $match;
      return _Option_orElse(checkExpr$(right, reg), checkExpr$(left, reg));
    }
    case "EDo": {
      const { exprs } = $match;
      return firstSome((x) => checkExpr$(x, reg), exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return _Option_orElse(checkExpr$(elseE, reg), _Option_orElse(checkExpr$(thenE, reg), checkExpr$(cond, reg)));
    }
    case "EMatch": {
      const { scrutinee, arms, span: sp } = $match;
      return _Option_orElse(checkMatch(arms, sp, reg), _Option_orElse(firstSome((a) => _Option_orElse(checkExpr$(a.body, reg), _Option_match13(a.guard, () => None13, (g) => checkExpr$(g, reg))), arms), checkExpr$(scrutinee, reg)));
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return _Option_orElse(firstSome((f) => checkExpr$(f.value, reg), fields), _Option_match13(spread, () => None13, (s) => checkExpr$(s, reg)));
    }
    case "EField": {
      const { target } = $match;
      return checkExpr$(target, reg);
    }
    case "ELoop": {
      const { params, body } = $match;
      return _Option_orElse(checkExpr$(body, reg), firstSome((p) => checkExpr$(p.init, reg), params));
    }
    case "ERecur": {
      const { args } = $match;
      return firstSome((a) => checkExpr$(a, reg), args);
    }
    case "ETuple": {
      const { elements } = $match;
      return firstSome((el) => checkExpr$(el, reg), elements);
    }
    case "EArr": {
      const { elements } = $match;
      return firstSome((el) => checkExpr$(((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
        throw new Error("non-exhaustive match");
      })())(el), reg), elements);
    }
    case "EList": {
      const { elements } = $match;
      return firstSome((el) => checkExpr$(((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
        throw new Error("non-exhaustive match");
      })())(el), reg), elements);
    }
    case "ESet": {
      const { elements } = $match;
      return firstSome((el) => checkExpr$(((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
        throw new Error("non-exhaustive match");
      })())(el), reg), elements);
    }
    case "EMap": {
      const { entries } = $match;
      return firstSome((en) => _Option_orElse(checkExpr$(en.value, reg), checkExpr$(en.key, reg)), entries);
    }
    case "EInterp": {
      const { parts } = $match;
      return firstSome((p) => {
        const $match$ = p;
        switch ($match$._tag) {
          case "IPLit": {
            return None13;
          }
          case "IPExpr": {
            const { expr: ex } = $match$;
            return checkExpr$(ex, reg);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var checkExpr = _curry14(2, checkExpr$);
var checkExprs$ = (e, reg) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return [];
    }
    case "EUnit": {
      return [];
    }
    case "EBool": {
      return [];
    }
    case "EStr": {
      return [];
    }
    case "ERef": {
      return [];
    }
    case "ECall": {
      const { fn, args } = $match;
      return [...checkExprs$(fn, reg), ..._Array_flatMap4((a) => checkExprs$(a, reg), args)];
    }
    case "ELambda": {
      const { body } = $match;
      return checkExprs$(body, reg);
    }
    case "ELetIn": {
      const { value, body } = $match;
      return [...checkExprs$(value, reg), ...checkExprs$(body, reg)];
    }
    case "ELetBind": {
      const { value, body } = $match;
      return [...checkExprs$(value, reg), ...checkExprs$(body, reg)];
    }
    case "EPipe": {
      const { left, right } = $match;
      return [...checkExprs$(left, reg), ...checkExprs$(right, reg)];
    }
    case "EDo": {
      const { exprs } = $match;
      return _Array_flatMap4((x) => checkExprs$(x, reg), exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return [...checkExprs$(cond, reg), ...checkExprs$(thenE, reg), ...checkExprs$(elseE, reg)];
    }
    case "EMatch": {
      const { scrutinee, arms, span: sp } = $match;
      return [...checkExprs$(scrutinee, reg), ..._Array_flatMap4((a) => [..._Option_match13(a.guard, () => [], (g) => checkExprs$(g, reg)), ...checkExprs$(a.body, reg)], arms), ..._Option_match13(checkMatch(arms, sp, reg), () => [], (e) => [e])];
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return [..._Option_match13(spread, () => [], (s) => checkExprs$(s, reg)), ..._Array_flatMap4((f) => checkExprs$(f.value, reg), fields)];
    }
    case "EField": {
      const { target } = $match;
      return checkExprs$(target, reg);
    }
    case "ELoop": {
      const { params, body } = $match;
      return [..._Array_flatMap4((p) => checkExprs$(p.init, reg), params), ...checkExprs$(body, reg)];
    }
    case "ERecur": {
      const { args } = $match;
      return _Array_flatMap4((a) => checkExprs$(a, reg), args);
    }
    case "ETuple": {
      const { elements } = $match;
      return _Array_flatMap4((el) => checkExprs$(el, reg), elements);
    }
    case "EArr": {
      const { elements } = $match;
      return _Array_flatMap4((el) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkExprs$(value, reg);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkExprs$(value, reg);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "EList": {
      const { elements } = $match;
      return _Array_flatMap4((el) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkExprs$(value, reg);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkExprs$(value, reg);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "ESet": {
      const { elements } = $match;
      return _Array_flatMap4((el) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkExprs$(value, reg);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkExprs$(value, reg);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "EMap": {
      const { entries } = $match;
      return _Array_flatMap4((entry) => [...checkExprs$(entry.key, reg), ...checkExprs$(entry.value, reg)], entries);
    }
    case "EInterp": {
      const { parts } = $match;
      return _Array_flatMap4((part) => {
        const $match$ = part;
        switch ($match$._tag) {
          case "IPLit": {
            return [];
          }
          case "IPExpr": {
            const { expr: value } = $match$;
            return checkExprs$(value, reg);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var checkExprs = _curry14(2, checkExprs$);
var reservedNames = ["Array", "List", "Set", "Map", "Dict", "Option", "Result", "Task", "Str"];
var redeclarableTypes = ["Option", "Result"];
var reservedErr = _curry14(2, (name, sp) => checkErr(`'${name}' is a reserved collection namespace and cannot be bound`, sp));
var checkReservedNames = (stmts) => firstSome((s) => {
  const $match = s;
  switch ($match._tag) {
    case "SType": {
      const { name, span: sp } = $match;
      return _Array_contains3(name, redeclarableTypes) ? None13 : _Array_contains3(name, reservedNames) ? Some13(reservedErr(name, sp)) : None13;
    }
    case "SLet": {
      const { name, span: sp } = $match;
      return _Array_contains3(name, reservedNames) ? Some13(reservedErr(name, sp)) : None13;
    }
    case "SExtern": {
      const { name, span: sp } = $match;
      return _Array_contains3(name, reservedNames) ? Some13(reservedErr(name, sp)) : None13;
    }
    case "SImport": {
      const { names } = $match;
      return firstSome((n) => _Array_contains3(n.name, reservedNames) ? Some13(checkErr(`'${n.name}' is a reserved collection namespace and cannot be imported`, n.span)) : None13, names);
    }
    case "SImportNs": {
      const { alias } = $match;
      return _Array_contains3(alias.name, reservedNames) ? Some13(checkErr(`'${alias.name}' is a reserved collection namespace and cannot be imported`, alias.span)) : None13;
    }
    case "SError": {
      return None13;
    }
    case "SExpr": {
      return None13;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
}, stmts);
var checkReservedNamesAll = (stmts) => _Array_flatMap4((s) => {
  const $match = s;
  switch ($match._tag) {
    case "SType": {
      const { name, span: sp } = $match;
      return _Array_contains3(name, redeclarableTypes) ? [] : _Array_contains3(name, reservedNames) ? [reservedErr(name, sp)] : [];
    }
    case "SLet": {
      const { name, span: sp } = $match;
      return _Array_contains3(name, reservedNames) ? [reservedErr(name, sp)] : [];
    }
    case "SExtern": {
      const { name, span: sp } = $match;
      return _Array_contains3(name, reservedNames) ? [reservedErr(name, sp)] : [];
    }
    case "SImport": {
      const { names } = $match;
      return _Array_flatMap4((n) => _Array_contains3(n.name, reservedNames) ? [checkErr(`'${n.name}' is a reserved collection namespace and cannot be imported`, n.span)] : [], names);
    }
    case "SImportNs": {
      const { alias } = $match;
      return _Array_contains3(alias.name, reservedNames) ? [checkErr(`'${alias.name}' is a reserved collection namespace and cannot be imported`, alias.span)] : [];
    }
    default: {
      return [];
    }
  }
}, stmts);
var jsReserved = ["break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "null", "return", "super", "switch", "this", "throw", "true", "try", "typeof", "var", "void", "while", "with", "yield", "let", "static", "implements", "interface", "package", "private", "protected", "public", "await"];
var reservedWord = _curry14(2, (name, sp) => _Array_contains3(name, jsReserved) ? [checkErr(`'${name}' is a JavaScript reserved word and can't be used as a binding name; rename it`, sp)] : []);
var typeExprSpan = (te) => {
  const $match = te;
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
var checkReservedParam$ = (param, sp) => {
  const $match = param;
  switch ($match._tag) {
    case "LPName": {
      const { name } = $match;
      return reservedWord(name, sp);
    }
    case "LPRecord": {
      const { fields } = $match;
      return _Array_flatMap4((name) => reservedWord(name, sp), fields);
    }
    case "LPTuple": {
      const { names } = $match;
      return _Array_flatMap4((name) => reservedWord(name, sp), names);
    }
    case "LPLabeled": {
      const { name, defaultValue } = $match;
      return [...reservedWord(name, sp), ..._Option_match13(defaultValue, () => [], (value) => checkReservedExpr(value))];
    }
    case "LPSpanned": {
      const { param: inner } = $match;
      return checkReservedParam$(inner, sp);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var checkReservedParam = _curry14(2, checkReservedParam$);
var checkReservedPattern = (pat) => {
  const $match = pat;
  switch ($match._tag) {
    case "PAs": {
      const { pat: inner, name, nameSpan: nameSp } = $match;
      return [...checkReservedPattern(inner), ...reservedWord(name, nameSp)];
    }
    case "PBind": {
      const { name, span: sp } = $match;
      return reservedWord(name, sp);
    }
    case "PTuple": {
      const { elems } = $match;
      return _Array_flatMap4(checkReservedPattern, elems);
    }
    case "PRecord": {
      const { fields } = $match;
      return _Array_flatMap4((field) => checkReservedPattern(field.pat), fields);
    }
    case "PCtor": {
      const { args } = $match;
      return _Array_flatMap4(checkReservedPattern, args);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return [..._Array_flatMap4(checkReservedPattern, elems), ..._Option_match13(rest, () => [], (value) => checkReservedPattern(value))];
    }
    case "PList": {
      const { elems, rest } = $match;
      return [..._Array_flatMap4(checkReservedPattern, elems), ..._Option_match13(rest, () => [], (value) => checkReservedPattern(value))];
    }
    case "POr": {
      const { alts } = $match;
      return _Array_flatMap4(checkReservedPattern, alts);
    }
    default: {
      return [];
    }
  }
};
var checkReservedSeqElem = (el) => {
  const $match = el;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: value } = $match;
      return checkReservedExpr(value);
    }
    case "SESpread": {
      const { expr: value } = $match;
      return checkReservedExpr(value);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var checkReservedExpr = (expr) => {
  const $match = expr;
  switch ($match._tag) {
    case "ECall": {
      const { fn, args } = $match;
      return [...checkReservedExpr(fn), ..._Array_flatMap4(checkReservedExpr, args)];
    }
    case "ELambda": {
      const { params, body, span: sp } = $match;
      return [..._Array_flatMap4((param) => checkReservedParam$(param, sp), params), ...checkReservedExpr(body)];
    }
    case "ELetIn": {
      const { name, nameSpan: nameSp, value, body } = $match;
      return [...reservedWord(name, nameSp), ...checkReservedExpr(value), ...checkReservedExpr(body)];
    }
    case "ELetBind": {
      const { param, paramSpan: paramSp, value, body } = $match;
      return [...checkReservedParam$(param, paramSp), ...checkReservedExpr(value), ...checkReservedExpr(body)];
    }
    case "EPipe": {
      const { left, right } = $match;
      return [...checkReservedExpr(left), ...checkReservedExpr(right)];
    }
    case "EDo": {
      const { exprs } = $match;
      return _Array_flatMap4(checkReservedExpr, exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return [...checkReservedExpr(cond), ...checkReservedExpr(thenE), ...checkReservedExpr(elseE)];
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return [...checkReservedExpr(scrutinee), ..._Array_flatMap4((arm) => [...checkReservedPattern(arm.pattern), ..._Option_match13(arm.guard, () => [], (guard) => checkReservedExpr(guard)), ...checkReservedExpr(arm.body)], arms)];
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return [..._Option_match13(spread, () => [], (value) => checkReservedExpr(value)), ..._Array_flatMap4((field) => checkReservedExpr(field.value), fields)];
    }
    case "EField": {
      const { target } = $match;
      return checkReservedExpr(target);
    }
    case "ELoop": {
      const { params, body } = $match;
      return [..._Array_flatMap4((param) => reservedWord(param.name, param.nameSpan), params), ..._Array_flatMap4((param) => checkReservedExpr(param.init), params), ...checkReservedExpr(body)];
    }
    case "ERecur": {
      const { args } = $match;
      return _Array_flatMap4(checkReservedExpr, args);
    }
    case "ETuple": {
      const { elements } = $match;
      return _Array_flatMap4(checkReservedExpr, elements);
    }
    case "EArr": {
      const { elements } = $match;
      return _Array_flatMap4(checkReservedSeqElem, elements);
    }
    case "EList": {
      const { elements } = $match;
      return _Array_flatMap4(checkReservedSeqElem, elements);
    }
    case "ESet": {
      const { elements } = $match;
      return _Array_flatMap4(checkReservedSeqElem, elements);
    }
    case "EMap": {
      const { entries } = $match;
      return _Array_flatMap4((entry) => [...checkReservedExpr(entry.key), ...checkReservedExpr(entry.value)], entries);
    }
    case "EInterp": {
      const { parts } = $match;
      return _Array_flatMap4((part) => {
        const $match$ = part;
        switch ($match$._tag) {
          case "IPLit": {
            return [];
          }
          case "IPExpr": {
            const { expr: value } = $match$;
            return checkReservedExpr(value);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    default: {
      return [];
    }
  }
};
var checkReservedWordsAll = (stmts) => _Array_flatMap4((stmt) => {
  const $match = stmt;
  switch ($match._tag) {
    case "SLet": {
      const { name, nameSpan: nameSp, value } = $match;
      return [...reservedWord(name, nameSp), ...checkReservedExpr(value)];
    }
    case "SExpr": {
      const { value } = $match;
      return checkReservedExpr(value);
    }
    case "SExtern": {
      const { name, nameSpan: nameSp } = $match;
      return reservedWord(name, nameSp);
    }
    case "SType": {
      const { ctors } = $match;
      return _Array_flatMap4((ctor) => _Array_flatMap4((field) => _Option_match13(field.name, () => [], (name) => reservedWord(name, typeExprSpan(field.fieldType))), ctor.fields), ctors);
    }
    default: {
      return [];
    }
  }
}, stmts);
var checkReservedWords = (stmts) => _Array_head3(checkReservedWordsAll(stmts));
var isUpperStart2 = (s) => _Option_match13(_Str_codeAt6(0, s), () => false, (c) => and10(c >= 65, c <= 90));
var strayTypeVar$ = (params, te) => {
  const $match = te;
  switch ($match._tag) {
    case "TyName": {
      const { name, span: sp } = $match;
      return or8(isUpperStart2(name), or8(_Array_contains3(name, primTypeNames), _Array_contains3(name, params))) ? None13 : Some13(_tuple7(name, sp));
    }
    case "TyArrow": {
      const { from, to } = $match;
      return _Option_orElse(strayTypeVar$(params, to), strayTypeVar$(params, from));
    }
    case "TyApp": {
      const { args } = $match;
      return firstSome(strayTypeVar(params), args);
    }
    case "TyTuple": {
      const { elems } = $match;
      return firstSome(strayTypeVar(params), elems);
    }
    case "TyList": {
      const { elem } = $match;
      return strayTypeVar$(params, elem);
    }
    case "TyQual": {
      const { args } = $match;
      return firstSome(strayTypeVar(params), args);
    }
    case "TyLit": {
      return None13;
    }
    case "TyUnion": {
      const { members } = $match;
      return firstSome(strayTypeVar(params), members);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var strayTypeVar = _curry14(2, strayTypeVar$);
var checkCtorFieldVars = (stmts) => firstSome((s) => {
  const $match = s;
  switch ($match._tag) {
    case "SType": {
      const { name, params, ctors } = $match;
      return firstSome((c) => firstSome((f) => ((_v) => _v._tag === "Some" ? (({ value: [vn, vsp] }) => Some13(checkErr(`unknown type parameter '${vn}' in constructor '${c.name}' \u2014 declare it: type ${name} ${_Str_join5(" ", _Array_append10(vn, params))} = ...`, vsp)))(_v) : _v._tag === "None" ? None13 : (() => {
        throw new Error("non-exhaustive match");
      })())(strayTypeVar$(params, f.fieldType)), c.fields), ctors);
    }
    default: {
      return None13;
    }
  }
}, stmts);
var checkCtorFieldVarsAll = (stmts) => _Array_flatMap4((s) => {
  const $match = s;
  switch ($match._tag) {
    case "SType": {
      const { name, params, ctors } = $match;
      return _Array_flatMap4((c) => _Array_flatMap4((f) => ((_v) => _v._tag === "Some" ? (({ value: [vn, vsp] }) => [checkErr(`unknown type parameter '${vn}' in constructor '${c.name}' \u2014 declare it: type ${name} ${_Str_join5(" ", _Array_append10(vn, params))} = ...`, vsp)])(_v) : _v._tag === "None" ? [] : (() => {
        throw new Error("non-exhaustive match");
      })())(strayTypeVar$(params, f.fieldType)), c.fields), ctors);
    }
    default: {
      return [];
    }
  }
}, stmts);
var qualRefsFrom = (te) => {
  const $match = te;
  switch ($match._tag) {
    case "TyName": {
      return [];
    }
    case "TyArrow": {
      const { from, to } = $match;
      return [...qualRefsFrom(from), ...qualRefsFrom(to)];
    }
    case "TyApp": {
      const { args } = $match;
      return _Array_flatMap4(qualRefsFrom, args);
    }
    case "TyTuple": {
      const { elems } = $match;
      return _Array_flatMap4(qualRefsFrom, elems);
    }
    case "TyList": {
      const { elem } = $match;
      return qualRefsFrom(elem);
    }
    case "TyQual": {
      const { alias, name, nameSpan, args, span: sp } = $match;
      return [{ alias, name, nameSpan, qualSpan: sp }, ..._Array_flatMap4(qualRefsFrom, args)];
    }
    case "TyLit": {
      return [];
    }
    case "TyUnion": {
      const { members } = $match;
      return _Array_flatMap4(qualRefsFrom, members);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var letInAnnots = (e) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return [];
    }
    case "EUnit": {
      return [];
    }
    case "EBool": {
      return [];
    }
    case "EStr": {
      return [];
    }
    case "ERef": {
      return [];
    }
    case "ECall": {
      const { fn, args } = $match;
      return [...letInAnnots(fn), ..._Array_flatMap4(letInAnnots, args)];
    }
    case "ELambda": {
      const { params, body } = $match;
      return [...letInAnnots(body), ..._Array_flatMap4((p) => ((_v) => _v._tag === "LPSpanned" && _v.param._tag === "LPLabeled" && _v.param.defaultValue._tag === "Some" ? (({ param: { defaultValue: { value: d } } }) => letInAnnots(d))(_v) : _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some" ? (({ defaultValue: { value: d } }) => letInAnnots(d))(_v) : [])(p), params)];
    }
    case "ELetIn": {
      const { annot, value, body } = $match;
      return [...letInAnnots(value), ...letInAnnots(body), ..._Option_match13(annot, () => [], (te) => [te])];
    }
    case "ELetBind": {
      const { value, body } = $match;
      return [...letInAnnots(value), ...letInAnnots(body)];
    }
    case "EPipe": {
      const { left, right } = $match;
      return [...letInAnnots(left), ...letInAnnots(right)];
    }
    case "EDo": {
      const { exprs } = $match;
      return _Array_flatMap4(letInAnnots, exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return [...letInAnnots(cond), ...letInAnnots(thenE), ...letInAnnots(elseE)];
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return [...letInAnnots(scrutinee), ..._Array_flatMap4((a) => [..._Option_match13(a.guard, () => [], (g) => letInAnnots(g)), ...letInAnnots(a.body)], arms)];
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return [..._Option_match13(spread, () => [], (sp) => letInAnnots(sp)), ..._Array_flatMap4((f) => letInAnnots(f.value), fields)];
    }
    case "EField": {
      const { target } = $match;
      return letInAnnots(target);
    }
    case "ELoop": {
      const { params, body } = $match;
      return [..._Array_flatMap4((prm) => letInAnnots(prm.init), params), ...letInAnnots(body)];
    }
    case "ERecur": {
      const { args } = $match;
      return _Array_flatMap4(letInAnnots, args);
    }
    case "ETuple": {
      const { elements } = $match;
      return _Array_flatMap4(letInAnnots, elements);
    }
    case "EArr": {
      const { elements } = $match;
      return _Array_flatMap4(seqElemAnnots, elements);
    }
    case "EList": {
      const { elements } = $match;
      return _Array_flatMap4(seqElemAnnots, elements);
    }
    case "ESet": {
      const { elements } = $match;
      return _Array_flatMap4(seqElemAnnots, elements);
    }
    case "EMap": {
      const { entries } = $match;
      return _Array_flatMap4((en) => [...letInAnnots(en.key), ...letInAnnots(en.value)], entries);
    }
    case "EInterp": {
      const { parts } = $match;
      return _Array_flatMap4((prt) => {
        const $match$ = prt;
        switch ($match$._tag) {
          case "IPLit": {
            return [];
          }
          case "IPExpr": {
            const { expr: ex } = $match$;
            return letInAnnots(ex);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var seqElemAnnots = (el) => {
  const $match = el;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: e } = $match;
      return letInAnnots(e);
    }
    case "SESpread": {
      const { expr: e } = $match;
      return letInAnnots(e);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var writtenTypeExprs = (stmts) => _Array_flatMap4((s) => {
  const $match = s;
  switch ($match._tag) {
    case "SExtern": {
      const { typeExpr: te } = $match;
      return [te];
    }
    case "SLet": {
      const { annot, value } = $match;
      return [..._Option_match13(annot, () => [], (te) => [te]), ...letInAnnots(value)];
    }
    case "SExpr": {
      const { value } = $match;
      return letInAnnots(value);
    }
    case "SType": {
      const { ctors, alias, aliasType } = $match;
      return [..._Array_flatMap4((c) => map8((f) => f.fieldType, c.fields), ctors), ..._Option_match13(alias, () => [], (fields) => map8((f) => f.fieldType, fields)), ..._Option_match13(aliasType, () => [], (te) => [te])];
    }
    default: {
      return [];
    }
  }
}, stmts);
var emptyQuals = new Map;
var checkQualifiedTypeNames = _curry14(2, (stmts, quals) => {
  const nsAliases = _Set_fromArray2(_Array_flatMap4((s) => {
    const $match = s;
    switch ($match._tag) {
      case "SImportNs": {
        const { alias } = $match;
        return [alias.name];
      }
      default: {
        return [];
      }
    }
  }, stmts));
  return firstSome((q) => _Set_has2(q.alias, nsAliases) ? _Option_match13(_Map_get5(q.alias, quals), () => None13, (dep) => _Set_has2(q.name, dep.types) ? None13 : Some13(checkErr(`module alias '${q.alias}' has no exported type '${q.name}' \u2014 export it from the imported module ('export type ${q.name} = \u2026')`, q.nameSpan))) : Some13(checkErr(`unknown module alias '${q.alias}' in type '${q.alias}.${q.name}' \u2014 a qualified type name needs a matching 'import * as ${q.alias} from "\u2026"'`, q.qualSpan)), _Array_flatMap4(qualRefsFrom, writtenTypeExprs(stmts)));
});
var checkQualifiedTypeNamesAll = _curry14(2, (stmts, quals) => {
  const nsAliases = _Set_fromArray2(_Array_flatMap4((s) => {
    const $match = s;
    switch ($match._tag) {
      case "SImportNs": {
        const { alias } = $match;
        return [alias.name];
      }
      default: {
        return [];
      }
    }
  }, stmts));
  return _Array_flatMap4((q) => _Set_has2(q.alias, nsAliases) ? _Option_match13(_Map_get5(q.alias, quals), () => [], (dep) => _Set_has2(q.name, dep.types) ? [] : [checkErr(`module alias '${q.alias}' has no exported type '${q.name}' \u2014 export it from the imported module ('export type ${q.name} = \u2026')`, q.nameSpan)]) : [checkErr(`unknown module alias '${q.alias}' in type '${q.alias}.${q.name}' \u2014 a qualified type name needs a matching 'import * as ${q.alias} from "\u2026"'`, q.qualSpan)], _Array_flatMap4(qualRefsFrom, writtenTypeExprs(stmts)));
});
var duplicateLoopParam = (params) => {
  let i = 0;
  let seen = _Set_fromArray2([]);
  while (true) {
    {
      const $loopMatch = _Array_get12(i, params);
      if ($loopMatch._tag === "None") {
        return None13;
      }
      if ($loopMatch._tag === "Some") {
        const { value: p } = $loopMatch;
        if (_Set_has2(p.name, seen)) {
          return Some13(checkErr(`duplicate loop param '${p.name}'`, p.nameSpan));
        } else {
          {
            const $recur0 = i + 1;
            const $recur1 = _Set_add2(p.name, seen);
            i = $recur0;
            seen = $recur1;
            continue;
          }
        }
      }
      throw new Error("non-exhaustive match");
    }
  }
};
var checkLoopDo$ = (exprs, frame, tail) => {
  let i = 0;
  while (true) {
    {
      const $loopMatch = _Array_get12(i, exprs);
      if ($loopMatch._tag === "None") {
        return None13;
      }
      if ($loopMatch._tag === "Some") {
        const { value: expr } = $loopMatch;
        if (_Option_isNone(_Array_get12(i + 1, exprs))) {
          return checkLoopExpr$(expr, frame, tail);
        } else {
          {
            const $loopMatch = checkLoopExpr$(expr, frame, false);
            if ($loopMatch._tag === "Some") {
              const { value: error } = $loopMatch;
              return Some13(error);
            }
            if ($loopMatch._tag === "None") {
              i = i + 1;
              continue;
            }
            throw new Error("non-exhaustive match");
          }
        }
      }
      throw new Error("non-exhaustive match");
    }
  }
};
var checkLoopDo = _curry14(3, checkLoopDo$);
var checkLoopExpr$ = (e, frame, tail) => {
  const $match = e;
  switch ($match._tag) {
    case "ELoop": {
      const { params, body } = $match;
      return _Option_orElse(checkLoopExpr$(body, Some13({ arity: length11(params), names: _Set_fromArray2(map8((p) => p.name, params)) }), true), _Option_orElse(firstSome((p) => checkLoopExpr$(p.init, frame, false), params), duplicateLoopParam(params)));
    }
    case "ERecur": {
      const { args, span: sp } = $match;
      return _Option_match13(frame, () => Some13(checkErr("'recur' is only legal inside a loop body", sp)), (current) => !tail ? Some13(checkErr("'recur' must be in tail position of its enclosing loop", sp)) : !eq11(length11(args), current.arity) ? Some13(checkErr(`'recur' takes ${show6(current.arity)} argument${current.arity === 1 ? "" : "s"} (one per loop param), got ${show6(length11(args))}`, sp)) : firstSome((a) => checkLoopExpr$(a, frame, false), args));
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return _Option_orElse(checkLoopExpr$(elseE, frame, tail), _Option_orElse(checkLoopExpr$(thenE, frame, tail), checkLoopExpr$(cond, frame, false)));
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return _Option_orElse(firstSome((arm) => _Option_match13(arm.guard, () => checkLoopExpr$(arm.body, frame, tail), (guard) => _Option_orElse(checkLoopExpr$(arm.body, frame, tail), checkLoopExpr$(guard, frame, false))), arms), checkLoopExpr$(scrutinee, frame, false));
    }
    case "ELetIn": {
      const { name, nameSpan: nameSp, value, body } = $match;
      return _Option_orElse(checkLoopExpr$(body, frame, tail), _Option_orElse(((_v) => _v._tag === "Some" && (({ value: current }) => _Set_has2(name, current.names))(_v) ? (({ value: current }) => Some13(checkErr(`'${name}' shadows a loop param inside the loop body; rename it`, nameSp)))(_v) : None13)(frame), checkLoopExpr$(value, frame, false)));
    }
    case "ELetBind": {
      const { value, body } = $match;
      return _Option_orElse(checkLoopExpr$(body, None13, false), checkLoopExpr$(value, frame, false));
    }
    case "ELambda": {
      const { body } = $match;
      return checkLoopExpr$(body, None13, false);
    }
    case "ECall": {
      const { fn, args } = $match;
      return _Option_orElse(firstSome((a) => checkLoopExpr$(a, frame, false), args), checkLoopExpr$(fn, frame, false));
    }
    case "EPipe": {
      const { left, right } = $match;
      return _Option_orElse(checkLoopExpr$(right, frame, false), checkLoopExpr$(left, frame, false));
    }
    case "EDo": {
      const { exprs } = $match;
      return checkLoopDo$(exprs, frame, tail);
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return _Option_orElse(firstSome((field) => checkLoopExpr$(field.value, frame, false), fields), _Option_match13(spread, () => None13, (value) => checkLoopExpr$(value, frame, false)));
    }
    case "EField": {
      const { target } = $match;
      return checkLoopExpr$(target, frame, false);
    }
    case "ETuple": {
      const { elements } = $match;
      return firstSome((el) => checkLoopExpr$(el, frame, false), elements);
    }
    case "EArr": {
      const { elements } = $match;
      return firstSome((el) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkLoopExpr$(value, frame, false);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkLoopExpr$(value, frame, false);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "EList": {
      const { elements } = $match;
      return firstSome((el) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkLoopExpr$(value, frame, false);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkLoopExpr$(value, frame, false);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "ESet": {
      const { elements } = $match;
      return firstSome((el) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkLoopExpr$(value, frame, false);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkLoopExpr$(value, frame, false);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "EMap": {
      const { entries } = $match;
      return firstSome((entry) => _Option_orElse(checkLoopExpr$(entry.value, frame, false), checkLoopExpr$(entry.key, frame, false)), entries);
    }
    case "EInterp": {
      const { parts } = $match;
      return firstSome((part) => {
        const $match$ = part;
        switch ($match$._tag) {
          case "IPLit": {
            return None13;
          }
          case "IPExpr": {
            const { expr: value } = $match$;
            return checkLoopExpr$(value, frame, false);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    default: {
      return None13;
    }
  }
};
var checkLoopExpr = _curry14(3, checkLoopExpr$);
var checkLoops = (stmts) => firstSome((stmt) => {
  const $match = stmt;
  switch ($match._tag) {
    case "SLet": {
      const { value } = $match;
      return checkLoopExpr$(value, None13, false);
    }
    case "SExpr": {
      const { value } = $match;
      return checkLoopExpr$(value, None13, false);
    }
    default: {
      return None13;
    }
  }
}, stmts);
var loopParamErrors = (params) => {
  let i = 0;
  let seen = _Set_fromArray2([]);
  let errors = [];
  while (true) {
    {
      const $loopMatch = _Array_get12(i, params);
      if ($loopMatch._tag === "None") {
        return errors;
      }
      if ($loopMatch._tag === "Some") {
        const { value: p } = $loopMatch;
        {
          const $recur0 = i + 1;
          const $recur1 = _Set_add2(p.name, seen);
          const $recur2 = _Set_has2(p.name, seen) ? [...errors, checkErr(`duplicate loop param '${p.name}'`, p.nameSpan)] : errors;
          i = $recur0;
          seen = $recur1;
          errors = $recur2;
          continue;
        }
      }
      throw new Error("non-exhaustive match");
    }
  }
};
var checkLoopDoAll$ = (exprs, frame, tail) => {
  let i = 0;
  let errors = [];
  while (true) {
    {
      const $loopMatch = _Array_get12(i, exprs);
      if ($loopMatch._tag === "None") {
        return errors;
      }
      if ($loopMatch._tag === "Some") {
        const { value: expr } = $loopMatch;
        {
          const isLast = _Option_isNone(_Array_get12(i + 1, exprs));
          {
            const $recur0 = i + 1;
            const $recur1 = [...errors, ...checkLoopExprs$(expr, frame, isLast ? tail : false)];
            i = $recur0;
            errors = $recur1;
            continue;
          }
        }
      }
      throw new Error("non-exhaustive match");
    }
  }
};
var checkLoopDoAll = _curry14(3, checkLoopDoAll$);
var checkLoopExprs$ = (e, frame, tail) => {
  const $match = e;
  switch ($match._tag) {
    case "ELoop": {
      const { params, body } = $match;
      return [...loopParamErrors(params), ..._Array_flatMap4((p) => checkLoopExprs$(p.init, frame, false), params), ...checkLoopExprs$(body, Some13({ arity: length11(params), names: _Set_fromArray2(map8((p) => p.name, params)) }), true)];
    }
    case "ERecur": {
      const { args, span: sp } = $match;
      const siteErrors = _Option_match13(frame, () => [checkErr("'recur' is only legal inside a loop body", sp)], (current) => [...!tail ? [checkErr("'recur' must be in tail position of its enclosing loop", sp)] : [], ...!eq11(length11(args), current.arity) ? [checkErr(`'recur' takes ${show6(current.arity)} argument${current.arity === 1 ? "" : "s"} (one per loop param), got ${show6(length11(args))}`, sp)] : []]);
      return [...siteErrors, ..._Array_flatMap4((a) => checkLoopExprs$(a, frame, false), args)];
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return [...checkLoopExprs$(cond, frame, false), ...checkLoopExprs$(thenE, frame, tail), ...checkLoopExprs$(elseE, frame, tail)];
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return [...checkLoopExprs$(scrutinee, frame, false), ..._Array_flatMap4((arm) => [..._Option_match13(arm.guard, () => [], (guard) => checkLoopExprs$(guard, frame, false)), ...checkLoopExprs$(arm.body, frame, tail)], arms)];
    }
    case "ELetIn": {
      const { name, nameSpan: nameSp, value, body } = $match;
      return [...((_v) => _v._tag === "Some" && (({ value: current }) => _Set_has2(name, current.names))(_v) ? (({ value: current }) => [checkErr(`'${name}' shadows a loop param inside the loop body; rename it`, nameSp)])(_v) : [])(frame), ...checkLoopExprs$(value, frame, false), ...checkLoopExprs$(body, frame, tail)];
    }
    case "ELetBind": {
      const { value, body } = $match;
      return [...checkLoopExprs$(value, frame, false), ...checkLoopExprs$(body, None13, false)];
    }
    case "ELambda": {
      const { body } = $match;
      return checkLoopExprs$(body, None13, false);
    }
    case "ECall": {
      const { fn, args } = $match;
      return [...checkLoopExprs$(fn, frame, false), ..._Array_flatMap4((a) => checkLoopExprs$(a, frame, false), args)];
    }
    case "EPipe": {
      const { left, right } = $match;
      return [...checkLoopExprs$(left, frame, false), ...checkLoopExprs$(right, frame, false)];
    }
    case "EDo": {
      const { exprs } = $match;
      return checkLoopDoAll$(exprs, frame, tail);
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return [..._Option_match13(spread, () => [], (value) => checkLoopExprs$(value, frame, false)), ..._Array_flatMap4((field) => checkLoopExprs$(field.value, frame, false), fields)];
    }
    case "EField": {
      const { target } = $match;
      return checkLoopExprs$(target, frame, false);
    }
    case "ETuple": {
      const { elements } = $match;
      return _Array_flatMap4((el) => checkLoopExprs$(el, frame, false), elements);
    }
    case "EArr": {
      const { elements } = $match;
      return _Array_flatMap4((el) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkLoopExprs$(value, frame, false);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkLoopExprs$(value, frame, false);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "EList": {
      const { elements } = $match;
      return _Array_flatMap4((el) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkLoopExprs$(value, frame, false);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkLoopExprs$(value, frame, false);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "ESet": {
      const { elements } = $match;
      return _Array_flatMap4((el) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: value } = $match$;
            return checkLoopExprs$(value, frame, false);
          }
          case "SESpread": {
            const { expr: value } = $match$;
            return checkLoopExprs$(value, frame, false);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements);
    }
    case "EMap": {
      const { entries } = $match;
      return _Array_flatMap4((entry) => [...checkLoopExprs$(entry.key, frame, false), ...checkLoopExprs$(entry.value, frame, false)], entries);
    }
    case "EInterp": {
      const { parts } = $match;
      return _Array_flatMap4((part) => {
        const $match$ = part;
        switch ($match$._tag) {
          case "IPLit": {
            return [];
          }
          case "IPExpr": {
            const { expr: value } = $match$;
            return checkLoopExprs$(value, frame, false);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    default: {
      return [];
    }
  }
};
var checkLoopExprs = _curry14(3, checkLoopExprs$);
var checkLoopsAll = (stmts) => _Array_flatMap4((stmt) => {
  const $match = stmt;
  switch ($match._tag) {
    case "SLet": {
      const { value } = $match;
      return checkLoopExprs$(value, None13, false);
    }
    case "SExpr": {
      const { value } = $match;
      return checkLoopExprs$(value, None13, false);
    }
    default: {
      return [];
    }
  }
}, stmts);
var mergeMissing = _curry14(3, (keys, from, into) => match6(keys).with((_v) => _v.length === 0, () => into).with((_v) => _v.length >= 1, ([k, ...rest]) => _Option_match13(_Map_get5(k, from), () => mergeMissing(rest, from, into), (v) => mergeMissing(rest, from, _Map_has3(k, into) ? into : _Map_set4(k, v, into)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var checkWith = _curry14(3, (stmts, imported, quals) => _Option_match13(checkReservedNames(stmts), () => _Option_match13(checkReservedWords(stmts), () => _Option_match13(checkCtorFieldVars(stmts), () => _Option_match13(checkQualifiedTypeNames(stmts, quals), () => _Option_match13(checkLoops(stmts), () => _Result_flatMap6((reg0) => ((reg) => _Option_match13(firstSome((s) => {
  const $match = s;
  switch ($match._tag) {
    case "SLet": {
      const { value } = $match;
      return checkExpr$(value, reg);
    }
    case "SExpr": {
      const { value } = $match;
      return checkExpr$(value, reg);
    }
    default: {
      return None13;
    }
  }
}, stmts), () => Ok8(stmts), (e) => Err8(e)))({ ctors: mergeMissing(_Map_keys5(imported.ctors), imported.ctors, reg0.ctors), types: mergeMissing(_Map_keys5(imported.types), imported.types, reg0.types) }), buildRegistry(stmts)), (e) => Err8(e)), (e) => Err8(e)), (e) => Err8(e)), (e) => Err8(e)), (e) => Err8(e)));
var checkAllWith = _curry14(3, (stmts, imported, quals) => _Result_match4(buildRegistry(stmts), (e) => {
  const errors = [...checkReservedNamesAll(stmts), ...checkReservedWordsAll(stmts), ...checkCtorFieldVarsAll(stmts), ...checkQualifiedTypeNamesAll(stmts, quals), ...checkLoopsAll(stmts), e];
  return length11(errors) === 0 ? Ok8(stmts) : Err8(errors);
}, (reg0) => {
  const reg = { ctors: mergeMissing(_Map_keys5(imported.ctors), imported.ctors, reg0.ctors), types: mergeMissing(_Map_keys5(imported.types), imported.types, reg0.types) };
  const errors = [...checkReservedNamesAll(stmts), ...checkReservedWordsAll(stmts), ...checkCtorFieldVarsAll(stmts), ...checkQualifiedTypeNamesAll(stmts, quals), ...checkLoopsAll(stmts), ..._Array_flatMap4((stmt) => {
    const $match = stmt;
    switch ($match._tag) {
      case "SLet": {
        const { value } = $match;
        return checkExprs$(value, reg);
      }
      case "SExpr": {
        const { value } = $match;
        return checkExprs$(value, reg);
      }
      default: {
        return [];
      }
    }
  }, stmts)];
  return length11(errors) === 0 ? Ok8(stmts) : Err8(errors);
}));
var checkAll = (stmts) => checkAllWith(stmts, { ctors: new Map, types: new Map }, emptyQuals);

import { Err as Err9, None as None16, Ok as Ok9, Some as Some16, _Array_append as _Array_append12, _Array_concat as _Array_concat7, _Array_find as _Array_find4, _Array_flatMap as _Array_flatMap5, _Array_get as _Array_get15, _Array_head as _Array_head4, _Array_prepend as _Array_prepend6, _Map_delete, _Map_get as _Map_get6, _Map_getOr as _Map_getOr6, _Map_has as _Map_has5, _Map_keys as _Map_keys6, _Map_set as _Map_set6, _Option_map, _Option_match as _Option_match16, _Option_unwrapOr as _Option_unwrapOr9, _Result_flatMap as _Result_flatMap7, _Result_map as _Result_map6, _Result_match as _Result_match5, _Set_add as _Set_add5, _Set_fromArray as _Set_fromArray5, _Set_has as _Set_has4, _Set_size as _Set_size2, _Set_toArray as _Set_toArray2, _Str_length as _Str_length5, _Str_replace, _Str_split as _Str_split4, _Str_startsWith as _Str_startsWith3, _curry as _curry17, _done as _done7, _recur as _recur7, _tuple as _tuple8, and as and11, eq as eq14, filter as filter6, length as length13, map as map9, or as or9, reduce as reduce4 } from "@mochi/compiler/runtime";
import { match as match8 } from "@onrails/pattern";

import { _Array_get as _Array_get13, _Option_match as _Option_match14, _Set_add as _Set_add3, _Set_fromArray as _Set_fromArray3, _curry as _curry15 } from "@mochi/compiler/runtime";
import { match as match7 } from "@onrails/pattern";
var addBinderNames = _curry15(2, (names, out) => match7(names).with((_v) => _v.length === 0, () => out).with((_v) => _v.length >= 1, ([n, ...rest]) => addBinderNames(rest, _Set_add3(n, out))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var patternNamesOpt$ = (p, out) => _Option_match14(p, () => out, (pat) => patternNames$(pat, out));
var patternNamesOpt = _curry15(2, patternNamesOpt$);
var patternNamesAll$ = (pats, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([p, ...rest]) => patternNamesAll$(rest, patternNames$(p, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(pats);
var patternNamesAll = _curry15(2, patternNamesAll$);
var patternNamesFields$ = (fields, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([f, ...rest]) => patternNamesFields$(rest, patternNames$(f.pat, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields);
var patternNamesFields = _curry15(2, patternNamesFields$);
var patternNames$ = (p, out) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat, name } = $match;
      return patternNames$(pat, _Set_add3(name, out));
    }
    case "PBind": {
      const { name } = $match;
      return _Set_add3(name, out);
    }
    case "PTuple": {
      const { elems } = $match;
      return patternNamesAll$(elems, out);
    }
    case "PRecord": {
      const { fields } = $match;
      return patternNamesFields$(fields, out);
    }
    case "PCtor": {
      const { args } = $match;
      return patternNamesAll$(args, out);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return patternNamesOpt$(rest, patternNamesAll$(elems, out));
    }
    case "PList": {
      const { elems, rest } = $match;
      return patternNamesOpt$(rest, patternNamesAll$(elems, out));
    }
    case "POr": {
      const { alts } = $match;
      return patternNamesAll$(alts, out);
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
var patternNames = _curry15(2, patternNames$);
var exprNamesAll$ = (exprs, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([e, ...rest]) => exprNamesAll$(rest, exprNames$(e, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(exprs);
var exprNamesAll = _curry15(2, exprNamesAll$);
var exprNamesOpt$ = (e, out) => _Option_match14(e, () => out, (ex) => exprNames$(ex, out));
var exprNamesOpt = _curry15(2, exprNamesOpt$);
var seqNames$ = (elems, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 && _v[0]._tag === "SEExpr" ? (([{ expr: e }, ...rest]) => seqNames$(rest, exprNames$(e, out)))(_v) : _v.length >= 1 && _v[0]._tag === "SESpread" ? (([{ expr: e }, ...rest]) => seqNames$(rest, exprNames$(e, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elems);
var seqNames = _curry15(2, seqNames$);
var fieldNames$ = (fields, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([f, ...rest]) => fieldNames$(rest, exprNames$(f.value, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields);
var fieldNames = _curry15(2, fieldNames$);
var entryNames$ = (entries, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([ent, ...rest]) => entryNames$(rest, exprNames$(ent.value, exprNames$(ent.key, out))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(entries);
var entryNames = _curry15(2, entryNames$);
var interpNames$ = (parts, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 && _v[0]._tag === "IPLit" ? (([, ...rest]) => interpNames$(rest, out))(_v) : _v.length >= 1 && _v[0]._tag === "IPExpr" ? (([{ expr: e }, ...rest]) => interpNames$(rest, exprNames$(e, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(parts);
var interpNames = _curry15(2, interpNames$);
var armNames$ = (arms, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([arm, ...rest]) => ((out1) => ((out2) => armNames$(rest, exprNames$(arm.body, out2)))(exprNamesOpt$(arm.guard, out1)))(patternNames$(arm.pattern, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(arms);
var armNames = _curry15(2, armNames$);
var loopBinderNames$ = (params, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([p, ...rest]) => loopBinderNames$(rest, exprNames$(p.init, _Set_add3(p.name, out))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params);
var loopBinderNames = _curry15(2, loopBinderNames$);
var paramBinderNames$ = (p, out) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return paramBinderNames$(inner, out);
    }
    case "LPName": {
      const { name } = $match;
      return _Set_add3(name, out);
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
      return exprNamesOpt$(defaultValue, _Set_add3(name, out));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var paramBinderNames = _curry15(2, paramBinderNames$);
var paramNamesAll$ = (params, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([p, ...rest]) => paramNamesAll$(rest, paramBinderNames$(p, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params);
var paramNamesAll = _curry15(2, paramNamesAll$);
var exprNames$ = (e, out) => {
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
      return interpNames$(parts, out);
    }
    case "ECall": {
      const { fn, args } = $match;
      return exprNamesAll$(args, exprNames$(fn, out));
    }
    case "ELambda": {
      const { params, body } = $match;
      return exprNames$(body, paramNamesAll$(params, out));
    }
    case "ELetIn": {
      const { name, value, body } = $match;
      return exprNames$(body, exprNames$(value, _Set_add3(name, out)));
    }
    case "ELetBind": {
      const { param, value, body } = $match;
      return exprNames$(body, paramBinderNames$(param, exprNames$(value, out)));
    }
    case "EPipe": {
      const { left, right } = $match;
      return exprNames$(right, exprNames$(left, out));
    }
    case "EDo": {
      const { exprs } = $match;
      return exprNamesAll$(exprs, out);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return exprNames$(elseE, exprNames$(thenE, exprNames$(cond, out)));
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return armNames$(arms, exprNames$(scrutinee, out));
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return fieldNames$(fields, exprNamesOpt$(spread, out));
    }
    case "EField": {
      const { target } = $match;
      return exprNames$(target, out);
    }
    case "ELoop": {
      const { params, body } = $match;
      return exprNames$(body, loopBinderNames$(params, out));
    }
    case "ERecur": {
      const { args } = $match;
      return exprNamesAll$(args, out);
    }
    case "ETuple": {
      const { elements } = $match;
      return exprNamesAll$(elements, out);
    }
    case "EArr": {
      const { elements } = $match;
      return seqNames$(elements, out);
    }
    case "EList": {
      const { elements } = $match;
      return seqNames$(elements, out);
    }
    case "ESet": {
      const { elements } = $match;
      return seqNames$(elements, out);
    }
    case "EMap": {
      const { entries } = $match;
      return entryNames$(entries, out);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var exprNames = _curry15(2, exprNames$);
var namesFromStmts$ = (stmts, i, out) => ((_v) => _v._tag === "None" ? out : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { value } }) => namesFromStmts$(stmts, i + 1, exprNames$(value, out)))(_v) : _v._tag === "Some" && _v.value._tag === "SExpr" ? (({ value: { value } }) => namesFromStmts$(stmts, i + 1, exprNames$(value, out)))(_v) : _v._tag === "Some" ? namesFromStmts$(stmts, i + 1, out) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get13(i, stmts));
var namesFromStmts = _curry15(3, namesFromStmts$);
var localBinderNames = (stmts) => namesFromStmts$(stmts, 0, _Set_fromArray3([]));

import { _Array_append as _Array_append11, _Array_drop as _Array_drop2, _Array_get as _Array_get14, _Array_take as _Array_take3, _Map_getOr as _Map_getOr5, _Map_has as _Map_has4, _Map_set as _Map_set5, _Option_match as _Option_match15, _Set_add as _Set_add4, _Set_diff as _Set_diff2, _Set_fromArray as _Set_fromArray4, _Set_has as _Set_has3, _curry as _curry16, _done as _done6, _recur as _recur6, eq as eq13, length as length12, min as min2 } from "@mochi/compiler/runtime";
var hasIndex = _curry16(2, (v, st) => _Map_has4(v, st.index));
var indexOfV = _curry16(2, (v, st) => _Map_getOr5(-1, v, st.index));
var lowOfV = _curry16(2, (v, st) => _Map_getOr5(-1, v, st.low));
var neighborsOf = _curry16(2, (v, adj) => _Option_match15(_Array_get14(v, adj), () => [], (ws) => ws));
var indexOfFrom = _curry16(3, (v, xs, i) => {
  let j = i;
  while (true) {
    {
      const $loopMatch = _Array_get14(j, xs);
      if ($loopMatch._tag === "None") {
        return -1;
      }
      if ($loopMatch._tag === "Some") {
        const { value: x } = $loopMatch;
        if (eq13(x, v)) {
          return j;
        } else {
          j = j + 1;
          continue;
        }
      }
      throw new Error("non-exhaustive match");
    }
  }
});
var visitNeighbors$ = (v, ws, adj, st) => {
  let remaining = ws;
  let current = st;
  while (true) {
    const _step = ((_v) => _v.length === 0 ? _done6(current) : _v.length >= 1 ? (([w, ...rest]) => hasIndex(w, current) ? _Set_has3(w, current.onStack) ? _recur6(rest, { ...current, low: _Map_set5(v, min2(lowOfV(v, current), indexOfV(w, current)), current.low) }) : _recur6(rest, current) : ((next) => _recur6(rest, { ...next, low: _Map_set5(v, min2(lowOfV(v, next), lowOfV(w, next)), next.low) }))(connect$(w, adj, current)))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(remaining);
    if (_step._tag === "recur") {
      [remaining, current] = _step.args;
      continue;
    }
    return _step.value;
  }
};
var visitNeighbors = _curry16(4, visitNeighbors$);
var connect$ = (v, adj, st) => {
  const st1 = { ...st, index: _Map_set5(v, st.counter, st.index), low: _Map_set5(v, st.counter, st.low), onStack: _Set_add4(v, st.onStack), stack: _Array_append11(v, st.stack), counter: st.counter + 1 };
  const st2 = visitNeighbors$(v, neighborsOf(v, adj), adj, st1);
  return eq13(lowOfV(v, st2), indexOfV(v, st2)) ? ((start) => ((comp) => ({ ...st2, onStack: _Set_diff2(st2.onStack, _Set_fromArray4(comp)), stack: _Array_take3(start, st2.stack), sccs: _Array_append11(comp, st2.sccs) }))(_Array_drop2(start, st2.stack)))(indexOfFrom(v, st2.stack, 0)) : st2;
};
var connect = _curry16(3, connect$);
var connectAllFrom$ = (i, n, adj, st) => {
  let j = i;
  let current = st;
  while (true) {
    if (j >= n) {
      return current;
    } else {
      {
        const $recur0 = j + 1;
        const $recur1 = hasIndex(j, current) ? current : connect$(j, adj, current);
        j = $recur0;
        current = $recur1;
        continue;
      }
    }
  }
};
var connectAllFrom = _curry16(4, connectAllFrom$);
var stronglyConnected = (adj) => {
  const n = length12(adj);
  const initSt = { index: new Map([]), low: new Map([]), onStack: _Set_fromArray4([]), stack: [], counter: 0, sccs: [] };
  return connectAllFrom$(0, n, adj, initSt).sccs;
};

var setLetBindMonad = _curry17(2, ($receiver, $value) => $receiver["monad"] = $value);
var setFieldOptional = _curry17(2, ($receiver, $value) => $receiver["optional"] = $value);
var exprSpan3 = (e) => {
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
var patSpan3 = (p) => {
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
var noSuggestions = [];
var noErrs = [];
var annotSpan = (t) => {
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
var typeErr$ = (msg, sp) => ({ message: msg, start: sp.start, end: sp.end, help: None16, suggestions: noSuggestions });
var typeErr = _curry17(2, typeErr$);
var typeErrHelp$ = (msg, sp, help) => ({ message: msg, start: sp.start, end: sp.end, help: Some16(help), suggestions: noSuggestions });
var typeErrHelp = _curry17(3, typeErrHelp$);
var typeErrSuggest$ = (msg, sp, help, hint) => ({ message: msg, start: sp.start, end: sp.end, help: Some16(help), suggestions: [{ title: `Did you mean '${hint}'?`, start: sp.start, end: sp.end, replaceWith: hint }] });
var typeErrSuggest = _curry17(4, typeErrSuggest$);
var lastSeg = (name) => {
  const parts = _Str_split4(".", name);
  return _Option_unwrapOr9(name, _Array_get15(length13(parts) - 1, parts));
};
var aliasRowFrom = _curry17(3, (fields, aliases, i) => _Option_match16(_Array_get15(i, fields), () => RowEmpty, (f) => (([t, _vars, _st]) => rField(f.name, t, aliasRowFrom(fields, aliases, i + 1), f.optional))(typeExprToType(f.fieldType, new Map, mkSt(0), aliases, _Set_fromArray5([])))));
var shownOfAlias = _curry17(2, (info, aliases) => length13(info.params) !== 0 ? None16 : _Option_match16(info.expr, () => length13(info.fields) === 0 ? None16 : Some16(showType(tRecord(aliasRowFrom(info.fields, aliases, 0)))), () => None16));
var longerPrint = _curry17(2, (p, q) => _Str_length5(p.shown) >= _Str_length5(q.shown));
var insertPrint = _curry17(2, (p, xs) => match8(xs).with((_v) => _v.length === 0, () => [p]).with((_v) => _v.length >= 1, ([q, ...rest]) => longerPrint(p, q) ? _Array_prepend6(p, xs) : _Array_prepend6(q, insertPrint(p, rest))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var printsFrom$ = (keys, aliases, i, acc) => _Option_match16(_Array_get15(i, keys), () => acc, (key) => _Option_match16(_Map_get6(key, aliases), () => printsFrom$(keys, aliases, i + 1, acc), (info) => _Option_match16(shownOfAlias(info, aliases), () => printsFrom$(keys, aliases, i + 1, acc), (shown) => printsFrom$(keys, aliases, i + 1, insertPrint({ shown, name: lastSeg(key) }, acc)))));
var printsFrom = _curry17(4, printsFrom$);
var applyPrints = _curry17(3, (msg, prints, i) => _Option_match16(_Array_get15(i, prints), () => msg, (p) => applyPrints(_Str_replace(p.shown, p.name, msg), prints, i + 1)));
var nameAliases$ = (msg, aliases) => applyPrints(msg, printsFrom$(_Map_keys6(aliases), aliases, 0, []), 0);
var nameAliases = _curry17(2, nameAliases$);
var u$ = (ctx, left, right, st, sp) => _Result_match5(unify(left, right, st), (e) => Err9(typeErr$(nameAliases$(e.message, ctx.aliasMap), sp)), (newSt) => Ok9(newSt));
var u = _curry17(5, u$);
var checkFits$ = (ctx, actual, expected, st, sp) => _Result_match5(fits(actual, expected, st), (e) => Err9(typeErr$(nameAliases$(e.message, ctx.aliasMap), sp)), (newSt) => Ok9(newSt));
var checkFits = _curry17(5, checkFits$);
var bindParamNamesFrom = _curry17(3, (names, env, st) => match8(names).with((_v) => _v.length === 0, () => _tuple8([], env, st)).with((_v) => _v.length >= 1, ([n, ...rest]) => (([t, st1]) => (([restTs, env2, st2]) => _tuple8(_Array_prepend6(t, restTs), env2, st2))(bindParamNamesFrom(rest, _Map_set6(n, mono(t), env), st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var bindParamFieldsFrom$ = (fields, env, row, st) => ((_v) => _v.length === 0 ? _tuple8(row, env, st) : _v.length >= 1 ? (([f, ...rest]) => (([ft, st1]) => bindParamFieldsFrom$(rest, _Map_set6(f, mono(ft), env), rExtend(f, ft, row), st1))(freshVar(st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields);
var bindParamFieldsFrom = _curry17(4, bindParamFieldsFrom$);
var recordParamNamesFrom$ = (names, spans, types, i, st) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" && _v[2]._tag === "Some" ? (([{ value: n }, { value: sp }, { value: t }]) => recordParamNamesFrom$(names, spans, types, i + 1, recordBinder(sp, t, "parameter", n, None16, st)))(_v) : st)(_tuple8(_Array_get15(i, names), _Array_get15(i, spans), _Array_get15(i, types)));
var recordParamNamesFrom = _curry17(5, recordParamNamesFrom$);
var envTypesOf = _curry17(2, (names, env) => _Array_flatMap5((n) => _Option_match16(_Map_get6(n, env), () => [], (sc) => [sc.ty]), names));
var bindParam$ = (p, env, st) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner, nameSpans: spans } = $match;
      return (([t, env1, st1]) => {
        const $match$ = inner;
        switch ($match$._tag) {
          case "LPTuple": {
            const { names } = $match$;
            const elems = ((_v) => _v._tag === "TyCon" ? (({ args: ts }) => ts)(_v) : [])(t);
            return _tuple8(t, env1, recordParamNamesFrom$(names, spans, elems, 0, st1));
          }
          case "LPRecord": {
            const { fields } = $match$;
            return _tuple8(t, env1, recordParamNamesFrom$(fields, spans, envTypesOf(fields, env1), 0, st1));
          }
          default: {
            return _tuple8(t, env1, st1);
          }
        }
      })(bindParam$(inner, env, st));
    }
    case "LPName": {
      const { name } = $match;
      return (([t, st1]) => _tuple8(t, _Map_set6(name, mono(t), env), st1))(freshVar(st));
    }
    case "LPTuple": {
      const { names } = $match;
      return (([elems, env1, st1]) => _tuple8(tTuple(elems), env1, st1))(bindParamNamesFrom(names, env, st));
    }
    case "LPRecord": {
      const { fields } = $match;
      return (([rowBase, st1]) => (([row, env1, st2]) => _tuple8(tRecord(row), env1, st2))(bindParamFieldsFrom$(fields, env, rowBase, st1)))(freshRowVar(st));
    }
    case "LPLabeled": {
      const { name } = $match;
      return (([t, st1]) => _tuple8(t, _Map_set6(name, mono(t), env), st1))(freshVar(st));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var bindParam = _curry17(3, bindParam$);
var bindParamsFrom$ = (params, env, st) => ((_v) => _v.length === 0 ? _tuple8([], env, st) : _v.length >= 1 ? (([p, ...rest]) => (([t, env1, st1]) => (([restTs, env2, st2]) => _tuple8(_Array_prepend6(t, restTs), env2, st2))(bindParamsFrom$(rest, env1, st1)))(bindParam$(p, env, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params);
var bindParamsFrom = _curry17(3, bindParamsFrom$);
var constrainParamAnnotsFrom$ = (ctx, params, paramTypes, vars, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8(vars, st)) : _v.length >= 1 ? (([param, ...rest]) => ((_v) => _v.length === 0 ? Ok9(_tuple8(vars, st)) : _v.length >= 1 ? (([paramT, ...restTypes]) => ((_v) => _v._tag === "LPSpanned" && _v.param._tag === "LPName" && _v.param.annot._tag === "Some" ? (({ param: { annot: { value: te } } }) => (([annotT, vars1, st1]) => _Result_flatMap7((st2) => constrainParamAnnotsFrom$(ctx, rest, restTypes, vars1, st2), checkFits$(ctx, paramT, annotT, st1, annotSpan(te))))(typeExprToType(te, vars, st, ctx.aliasMap, _Set_fromArray5([]))))(_v) : constrainParamAnnotsFrom$(ctx, rest, restTypes, vars, st))(param))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(paramTypes))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params);
var constrainParamAnnotsFrom = _curry17(5, constrainParamAnnotsFrom$);
var arrowChain$ = (paramTypes, resultT) => ((_v) => _v.length === 0 ? tArrow(tUnit, resultT) : _v.length === 1 ? (([p]) => tArrow(p, resultT))(_v) : _v.length >= 1 ? (([p, ...rest]) => tArrow(p, arrowChain$(rest, resultT)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(paramTypes);
var arrowChain = _curry17(2, arrowChain$);
var ctxWithEnv = _curry17(2, (ctx, env) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: ctx.loopStack, letOwner: ctx.letOwner, localNames: ctx.localNames, scopeNames: ctx.scopeNames }));
var ctxWithGroup = _curry17(3, (ctx, env, names) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: ctx.loopStack, letOwner: ctx.letOwner, localNames: ctx.localNames, scopeNames: _Array_concat7(names, ctx.scopeNames) }));
var ctxWithLets = _curry17(3, (ctx, env, letOwner) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: ctx.loopStack, letOwner, localNames: ctx.localNames, scopeNames: ctx.scopeNames }));
var ctxWithLoop = _curry17(4, (ctx, env, frame, letOwner) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: _Array_prepend6(frame, ctx.loopStack), letOwner, localNames: ctx.localNames, scopeNames: ctx.scopeNames }));
var inferLoopParamsFrom$ = (ctx, params, i, envAcc, frameAcc, ownerAcc, st) => _Option_match16(_Array_get15(i, params), () => Ok9(_tuple8(frameAcc, envAcc, ownerAcc, st)), (p) => _Result_flatMap7(([t, st1]) => ((sp) => inferLoopParamsFrom$(ctx, params, i + 1, _Map_set6(p.name, mono(t), envAcc), _Array_append12(t, frameAcc), _Map_set6(p.name, sp, ownerAcc), noteLet(sp, recordBinder(p.nameSpan, t, "let", p.name, None16, st1))))(exprSpan3(p.init)), inferExpr$(ctx, p.init, st)));
var inferLoopParamsFrom = _curry17(7, inferLoopParamsFrom$);
var unifyRecurArgsFrom$ = (ctx, args, frame, i, st) => _Option_match16(_Array_get15(i, args), () => Ok9(st), (a) => _Result_flatMap7(([at, st1]) => _Option_match16(_Array_get15(i, frame), () => unifyRecurArgsFrom$(ctx, args, frame, i + 1, st1), (pt) => _Result_flatMap7((st2) => unifyRecurArgsFrom$(ctx, args, frame, i + 1, st2), u$(ctx, at, pt, st1, exprSpan3(a)))), inferExpr$(ctx, a, st)));
var unifyRecurArgsFrom = _curry17(5, unifyRecurArgsFrom$);
var inferRecur$ = (ctx, args, sp, st) => ((_v) => _v.length === 0 ? Err9(typeErr$("'recur' is only legal inside a loop body", sp)) : _v.length >= 1 ? (([frame]) => _Result_flatMap7((st1) => (([t, st2]) => Ok9(_tuple8(t, st2)))(freshVar(st1)), unifyRecurArgsFrom$(ctx, args, frame, 0, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(ctx.loopStack);
var inferRecur = _curry17(4, inferRecur$);
var rowHasOptional = (row) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { optional, rest } = $match;
      return or9(optional, rowHasOptional(rest));
    }
    default: {
      return false;
    }
  }
};
var domainNeedsFits$ = (t, st) => {
  const $match = zonk(t, st);
  switch ($match._tag) {
    case "TyRecord": {
      const { row } = $match;
      return rowHasOptional(row);
    }
    default: {
      return false;
    }
  }
};
var domainNeedsFits = _curry17(2, domainNeedsFits$);
var rowAllOptional = (row) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { optional, rest } = $match;
      return and11(optional, rowAllOptional(rest));
    }
    default: {
      return true;
    }
  }
};
var domainIsOmittableRecord$ = (t, st) => {
  const $match = zonk(t, st);
  switch ($match._tag) {
    case "TyRecord": {
      const { row } = $match;
      return rowAllOptional(row);
    }
    default: {
      return false;
    }
  }
};
var domainIsOmittableRecord = _curry17(2, domainIsOmittableRecord$);
var isLabeledParam2 = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "LPLabeled": {
      return true;
    }
    case "LPSpanned": {
      const { param: inner } = $match;
      return isLabeledParam2(inner);
    }
    default: {
      return false;
    }
  }
};
var splitLamParams$ = (params, positional, labeled) => ((_v) => _v.length === 0 ? _tuple8(positional, labeled) : _v.length >= 1 ? (([p, ...rest]) => isLabeledParam2(p) ? splitLamParams$(rest, positional, _Array_append12(p, labeled)) : splitLamParams$(rest, _Array_append12(p, positional), labeled))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params);
var splitLamParams = _curry17(3, splitLamParams$);
var labFieldsFrom$ = (ctx, labs, env, vars, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8([], st)) : _v.length >= 1 ? (([lab, ...rest]) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => labFieldsFrom$(ctx, [inner, ...rest], env, vars, st))(_v) : _v._tag === "LPLabeled" ? (({ name, annot, optional, defaultValue }) => (([fieldT, vars1, st1]) => _Result_flatMap7(([fieldT1, st2]) => ((bodyT) => ((omittable) => _Result_flatMap7(([fields, stN]) => Ok9(_tuple8(_Array_prepend6({ name, fieldType: fieldT1, omittable, bodyType: bodyT }, fields), stN)), labFieldsFrom$(ctx, rest, env, vars1, st2)))(or9(optional, _Option_match16(defaultValue, () => false, () => true))))(_Option_match16(defaultValue, () => optional ? tCon("Option", [fieldT1]) : fieldT1, () => fieldT1)), _Option_match16(defaultValue, () => Ok9(_tuple8(fieldT, st1)), (d) => _Result_flatMap7(([dt, s2]) => _Option_match16(annot, () => {
  const widened = widenLits(zonk(dt, s2));
  return _Result_flatMap7((s3) => Ok9(_tuple8(widened, s3)), u$(ctx, fieldT, widened, s2, exprSpan3(d)));
}, () => _Result_flatMap7((s3) => Ok9(_tuple8(fieldT, s3)), checkFits$(ctx, dt, fieldT, s2, exprSpan3(d)))), inferExpr$(ctxWithEnv(ctx, env), d, st1)))))(_Option_match16(annot, () => (([t, s1]) => _tuple8(t, vars, s1))(freshVar(st)), (te) => typeExprToType(te, vars, st, ctx.aliasMap, _Set_fromArray5([])))))(_v) : labFieldsFrom$(ctx, rest, env, vars, st))(lab))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(labs);
var labFieldsFrom = _curry17(5, labFieldsFrom$);
var rowOfLabFields = (fields) => match8(fields).with((_v) => _v.length === 0, () => RowEmpty).with((_v) => _v.length >= 1, ([f, ...rest]) => rField(f.name, f.fieldType, rowOfLabFields(rest), f.omittable)).otherwise(() => {
  throw new Error("non-exhaustive match");
});
var envWithLabFields = _curry17(2, (fields, env) => match8(fields).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([f, ...rest]) => envWithLabFields(rest, _Map_set6(f.name, mono(f.bodyType), env))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var recordLabParamsFrom = _curry17(3, (labs, fields, st) => ((_v) => _v.length === 0 ? st : _v.length >= 1 && _v[0]._tag === "LPSpanned" && _v[0].param._tag === "LPLabeled" && _v[0].nameSpans.length >= 1 ? (([{ param: { name }, nameSpans: [sp] }, ...rest]) => recordLabParamsFrom(rest, fields, _Option_match16(_Array_find4((f) => eq14(f.name, name), fields), () => st, (f) => recordBinder(sp, f.bodyType, "parameter", name, None16, st))))(_v) : _v.length >= 1 ? (([, ...rest]) => recordLabParamsFrom(rest, fields, st))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(labs));
var recordNameParamsFrom$ = (params, types, st) => ((_v) => _v[0].length >= 1 && _v[0][0]._tag === "LPSpanned" && _v[0][0].param._tag === "LPName" && _v[0][0].nameSpans.length >= 1 && _v[1].length >= 1 ? (([[{ param: { name }, nameSpans: [sp] }, ...rest], [t, ...ts]]) => recordNameParamsFrom$(rest, ts, recordBinder(sp, t, "parameter", name, None16, st)))(_v) : _v[0].length >= 1 && _v[1].length >= 1 ? (([[, ...rest], [, ...ts]]) => recordNameParamsFrom$(rest, ts, st))(_v) : st)(_tuple8(params, types));
var recordNameParamsFrom = _curry17(3, recordNameParamsFrom$);
var inferCallArgs$ = (ctx, fnT, args, st, callSpan) => ((_v) => _v.length === 0 ? Ok9(_tuple8(fnT, st)) : _v.length >= 1 ? (([arg, ...rest]) => _Result_flatMap7(([argT, st1]) => ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => domainNeedsFits$(fromT, st1) ? _Result_flatMap7((st2) => inferCallArgs$(ctx, toT, rest, st2, callSpan), checkFits$(ctx, argT, fromT, st1, exprSpan3(arg))) : (([resultT, st2]) => _Result_flatMap7((st3) => inferCallArgs$(ctx, resultT, rest, st3, callSpan), u$(ctx, fnT, tArrow(argT, resultT), st2, exprSpan3(arg))))(freshVar(st1)))(_v) : (([resultT, st2]) => _Result_flatMap7((st3) => inferCallArgs$(ctx, resultT, rest, st3, callSpan), u$(ctx, fnT, tArrow(argT, resultT), st2, exprSpan3(arg))))(freshVar(st1)))(resolve(fnT, st1)), inferExpr$(ctx, arg, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(args);
var inferCallArgs = _curry17(5, inferCallArgs$);
var isTupleParam = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return isTupleParam(inner);
    }
    case "LPTuple": {
      return true;
    }
    default: {
      return false;
    }
  }
};
var inferTupleLet$ = (ctx, param, body, lamSpan, value, st) => _Result_flatMap7(([valueT, st1]) => (([paramT, bodyEnv, st2]) => _Result_flatMap7((st3) => _Result_flatMap7(([bodyT, st4]) => Ok9(_tuple8(bodyT, recordAt(lamSpan, tArrow(paramT, bodyT), st4))), inferExpr$(ctxWithEnv(ctx, bodyEnv), body, st3)), u$(ctx, paramT, valueT, st2, exprSpan3(value))))(bindParam$(param, ctx.env, st1)), inferExpr$(ctx, value, st));
var inferTupleLet = _curry17(6, inferTupleLet$);
var inferApplied$ = (ctx, fn, args, st) => _Result_flatMap7(([fnT, st1]) => ((_v) => _v.length === 0 ? ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => domainIsOmittableRecord$(fromT, st1) ? _Result_flatMap7((st2) => Ok9(_tuple8(toT, st2)), checkFits$(ctx, tRecord(RowEmpty), fromT, st1, exprSpan3(fn))) : (([resultT, st2]) => _Result_flatMap7((st3) => Ok9(_tuple8(resultT, st3)), u$(ctx, fnT, tArrow(tUnit, resultT), st2, exprSpan3(fn))))(freshVar(st1)))(_v) : (([resultT, st2]) => _Result_flatMap7((st3) => Ok9(_tuple8(resultT, st3)), u$(ctx, fnT, tArrow(tUnit, resultT), st2, exprSpan3(fn))))(freshVar(st1)))(resolve(fnT, st1)) : inferCallArgs$(ctx, fnT, args, st1, exprSpan3(fn)))(args), inferExpr$(ctx, fn, st));
var inferApplied = _curry17(4, inferApplied$);
var inferNormalCall$ = (ctx, fn, args, st) => ((_v) => _v[0]._tag === "ELambda" && _v[0].params.length === 1 && _v[1].length === 1 ? (([{ params: [param], body, span: lamSpan }, [value]]) => isTupleParam(param) ? inferTupleLet$(ctx, param, body, lamSpan, value, st) : inferApplied$(ctx, fn, args, st))(_v) : inferApplied$(ctx, fn, args, st))(_tuple8(fn, args));
var inferNormalCall = _curry17(4, inferNormalCall$);
var inferTernary$ = (ctx, cond, thenE, elseE, st) => _Result_flatMap7(([condT, st1]) => _Result_flatMap7((st2) => _Result_flatMap7(([thenT, st3]) => _Result_flatMap7(([elseT, st4]) => _Result_flatMap7((st5) => Ok9(_tuple8(thenT, st5)), u$(ctx, thenT, elseT, st4, exprSpan3(elseE))), inferExpr$(ctx, elseE, st3)), inferExpr$(ctx, thenE, st2)), u$(ctx, condT, tBool, st1, exprSpan3(cond))), inferExpr$(ctx, cond, st));
var inferTernary = _curry17(5, inferTernary$);
var bindNameOf = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return bindNameOf(inner);
    }
    case "LPName": {
      const { name } = $match;
      return Some16(name);
    }
    default: {
      return None16;
    }
  }
};
var inferBindBody$ = (ctx, param, paramSpan, body, payloadT, mkBody, st) => (([paramT, bodyEnv, st1]) => _Result_flatMap7((st2) => ((stNamed) => _Result_flatMap7(([bodyT, st3]) => (([resT, st4]) => {
  const wantBody = mkBody(resT);
  return _Result_flatMap7((st5) => Ok9(_tuple8(wantBody, st5)), u$(ctx, bodyT, wantBody, st4, exprSpan3(body)));
})(freshVar(st3)), inferExpr$(ctxWithEnv(ctx, bodyEnv), body, stNamed)))(_Option_match16(bindNameOf(param), () => st2, (name) => recordBinder(paramSpan, payloadT, "let", name, None16, st2))), u$(ctx, paramT, payloadT, st1, paramSpan)))(bindParam$(param, ctx.env, st));
var inferBindBody = _curry17(7, inferBindBody$);
var inferTwoSlotBind$ = (ctx, param, paramSpan, value, body, valT, ctor, st) => (([payloadT, st1]) => (([errT, st2]) => _Result_flatMap7((st3) => inferBindBody$(ctx, param, paramSpan, body, payloadT, (resT) => tCon(ctor, [resT, errT]), st3), u$(ctx, valT, tCon(ctor, [payloadT, errT]), st2, exprSpan3(value))))(freshVar(st1)))(freshVar(st));
var inferTwoSlotBind = _curry17(8, inferTwoSlotBind$);
var inferQuestionBind$ = (ctx, bind, param, paramSpan, value, body, valT, st) => {
  const $match = resolve(valT, st);
  switch ($match._tag) {
    case "TyVar": {
      const $written = setLetBindMonad(bind, "Result");
      return inferTwoSlotBind$(ctx, param, paramSpan, value, body, valT, "Result", st);
    }
    case "TyCon": {
      const { name } = $match;
      return name === "Option" ? (($written) => (([payloadT, st1]) => _Result_flatMap7((st2) => inferBindBody$(ctx, param, paramSpan, body, payloadT, (resT) => tCon("Option", [resT]), st2), u$(ctx, valT, tCon("Option", [payloadT]), st1, exprSpan3(value))))(freshVar(st)))(setLetBindMonad(bind, "Option")) : name === "Result" ? (($written) => inferTwoSlotBind$(ctx, param, paramSpan, value, body, valT, "Result", st))(setLetBindMonad(bind, "Result")) : Err9(typeErr$(`let? requires Option or Result, got ${showType(zonk(valT, st))}`, exprSpan3(value)));
    }
    default: {
      return Err9(typeErr$(`let? requires Option or Result, got ${showType(zonk(valT, st))}`, exprSpan3(value)));
    }
  }
};
var inferQuestionBind = _curry17(8, inferQuestionBind$);
var inferLetBind$ = (ctx, bind, param, paramSpan, monad, value, body, st) => _Result_flatMap7(([valT, st1]) => monad === "Task" ? inferTwoSlotBind$(ctx, param, paramSpan, value, body, valT, "Task", st1) : inferQuestionBind$(ctx, bind, param, paramSpan, value, body, valT, st1), inferExpr$(ctx, value, st));
var inferLetBind = _curry17(8, inferLetBind$);
var inferRecordRow$ = (ctx, fields, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8(RowEmpty, st)) : _v.length >= 1 ? (([f, ...rest]) => _Result_flatMap7(([restRow, st1]) => _Result_flatMap7(([ft, st2]) => Ok9(_tuple8(rExtend(f.name, ft, restRow), st2)), inferExpr$(ctx, f.value, st1)), inferRecordRow$(ctx, rest, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields);
var inferRecordRow = _curry17(3, inferRecordRow$);
var rWithTail$ = (row, tail) => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return tail;
    }
    case "RowVar": {
      const { id } = $match;
      return rVar(id);
    }
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return rField(label, fieldType, rWithTail$(rest, tail), optional);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var rWithTail = _curry17(2, rWithTail$);
var lookupField$ = (row, name) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return eq14(label, name) ? Some16(_tuple8(fieldType, optional)) : lookupField$(rest, name);
    }
    default: {
      return None16;
    }
  }
};
var lookupField = _curry17(2, lookupField$);
var rowEndsEmpty = (row) => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return true;
    }
    case "RowExtend": {
      const { rest } = $match;
      return rowEndsEmpty(rest);
    }
    case "RowVar": {
      return false;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var inferFieldAccess$ = (ctx, field, target, name, sp, st) => _Result_flatMap7(([targetT, st1]) => ((zonked) => ((_v) => _v._tag === "TyRecord" ? (({ row }) => ((_v) => _v._tag === "Some" ? (({ value: [ft, optional] }) => optional ? (($written) => Ok9(_tuple8(tCon("Option", [ft]), st1)))(setFieldOptional(field, true)) : Ok9(_tuple8(ft, st1)))(_v) : _v._tag === "None" ? rowEndsEmpty(row) ? Err9(typeErr$(`record missing field '${name}'`, sp)) : inferDuckField$(ctx, targetT, name, sp, st1) : (() => {
  throw new Error("non-exhaustive match");
})())(lookupField$(row, name)))(_v) : inferDuckField$(ctx, targetT, name, sp, st1))(zonked))(zonk(targetT, st1)), inferExpr$(ctx, target, st));
var inferFieldAccess = _curry17(6, inferFieldAccess$);
var inferDuckField$ = (ctx, targetT, name, sp, st) => (([fieldT, st2]) => (([restRow, st3]) => _Result_flatMap7((st4) => Ok9(_tuple8(fieldT, st4)), u$(ctx, targetT, tRecord(rExtend(name, fieldT, restRow)), st3, sp)))(freshRowVar(st2)))(freshVar(st));
var inferDuckField = _curry17(5, inferDuckField$);
var inferNsField$ = (ctx, tname, name, sp, st) => _Option_match16(_Map_get6(name, _Map_getOr6(new Map, tname, ctx.ns)), () => Err9(typeErr$(`'${tname}' has no member '${name}'`, sp)), (sc) => (([t, st1]) => Ok9(_tuple8(t, st1)))(instantiate(sc, st)));
var inferNsField = _curry17(5, inferNsField$);
var inferInterpParts$ = (ctx, parts, st) => ((_v) => _v.length === 0 ? Ok9(st) : _v.length >= 1 && _v[0]._tag === "IPLit" ? (([, ...rest]) => inferInterpParts$(ctx, rest, st))(_v) : _v.length >= 1 && _v[0]._tag === "IPExpr" ? (([{ expr: ex }, ...rest]) => _Result_flatMap7(([t, st1]) => _Result_flatMap7((st2) => inferInterpParts$(ctx, rest, st2), u$(ctx, t, tString, st1, exprSpan3(ex))), inferExpr$(ctx, ex, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(parts);
var inferInterpParts = _curry17(3, inferInterpParts$);
var inferTupleElems$ = (ctx, elements, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8([], st)) : _v.length >= 1 ? (([el, ...rest]) => _Result_flatMap7(([t, st1]) => _Result_flatMap7(([restTs, st2]) => Ok9(_tuple8(_Array_prepend6(t, restTs), st2)), inferTupleElems$(ctx, rest, st1)), inferExpr$(ctx, el, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elements);
var inferTupleElems = _curry17(3, inferTupleElems$);
var seqElemExpr2 = (el) => {
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
var inferSeqSlotsElems$ = (ctx, con, elem, elements, st) => ((_v) => _v.length === 0 ? Ok9(st) : _v.length >= 1 ? (([slot, ...rest]) => ((ex) => _Result_flatMap7(([et, st1]) => ((want) => _Result_flatMap7((st2) => inferSeqSlotsElems$(ctx, con, elem, rest, st2), u$(ctx, want, et, st1, exprSpan3(ex))))(((_v) => _v._tag === "SEExpr" ? elem : _v._tag === "SESpread" ? tCon(con, [elem]) : (() => {
  throw new Error("non-exhaustive match");
})())(slot)), inferExpr$(ctx, ex, st)))(seqElemExpr2(slot)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elements);
var inferSeqSlotsElems = _curry17(5, inferSeqSlotsElems$);
var inferSeqSlots$ = (ctx, con, elements, st) => (([elem, st1]) => _Result_flatMap7((st2) => Ok9(_tuple8(tCon(con, [elem]), st2)), inferSeqSlotsElems$(ctx, con, elem, elements, st1)))(freshVar(st));
var inferSeqSlots = _curry17(4, inferSeqSlots$);
var inferMapEntries$ = (ctx, k, v, entries, st) => ((_v) => _v.length === 0 ? Ok9(st) : _v.length >= 1 ? (([ent, ...rest]) => _Result_flatMap7(([kt, st1]) => _Result_flatMap7((st2) => _Result_flatMap7(([vt, st3]) => _Result_flatMap7((st4) => inferMapEntries$(ctx, k, v, rest, st4), u$(ctx, v, vt, st3, exprSpan3(ent.value))), inferExpr$(ctx, ent.value, st2)), u$(ctx, k, kt, st1, exprSpan3(ent.key))), inferExpr$(ctx, ent.key, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(entries);
var inferMapEntries = _curry17(5, inferMapEntries$);
var inferMapExpr$ = (ctx, entries, st) => (([k, st1]) => (([v, st2]) => _Result_flatMap7((st3) => Ok9(_tuple8(tCon("Map", [k, v]), st3)), inferMapEntries$(ctx, k, v, entries, st2)))(freshVar(st1)))(freshVar(st));
var inferMapExpr = _curry17(3, inferMapExpr$);
var mergeBindingMapsFrom = _curry17(3, (keys, src, dest) => match8(keys).with((_v) => _v.length === 0, () => dest).with((_v) => _v.length >= 1, ([k, ...rest]) => _Option_match16(_Map_get6(k, src), () => mergeBindingMapsFrom(rest, src, dest), (v) => mergeBindingMapsFrom(rest, src, _Map_set6(k, v, dest)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var mergeBindingMaps = _curry17(2, (dest, src) => mergeBindingMapsFrom(_Map_keys6(src), src, dest));
var mergeEnvBindingsFrom = _curry17(3, (keys, bindings, env) => match8(keys).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([k, ...rest]) => _Option_match16(_Map_get6(k, bindings), () => mergeEnvBindingsFrom(rest, bindings, env), (t) => mergeEnvBindingsFrom(rest, bindings, _Map_set6(k, mono(t), env)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var mergeEnvBindings = _curry17(2, (bindings, env) => mergeEnvBindingsFrom(_Map_keys6(bindings), bindings, env));
var inferArms$ = (ctx, scrutT, resultT, arms, st) => ((_v) => _v.length === 0 ? Ok9(st) : _v.length >= 1 ? (([arm, ...rest]) => _Result_flatMap7(([patT, bindings, st1]) => _Result_flatMap7((st2) => ((armCtx) => _Result_flatMap7((st3) => _Result_flatMap7(([bodyT, st4]) => _Result_flatMap7((st5) => inferArms$(ctx, scrutT, resultT, rest, st5), u$(ctx, resultT, bodyT, st4, exprSpan3(arm.body))), inferExpr$(armCtx, arm.body, st3)), _Option_match16(arm.guard, () => Ok9(st2), (g) => _Result_flatMap7(([guardT, stg]) => u$(ctx, tBool, guardT, stg, exprSpan3(g)), inferExpr$(armCtx, g, st2)))))(ctxWithEnv(ctx, mergeEnvBindings(bindings, ctx.env))), u$(ctx, scrutT, patT, st1, patSpan3(arm.pattern))), inferPat$(ctx, arm.pattern, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(arms);
var inferArms = _curry17(5, inferArms$);
var isPipeHole = (a) => ((_v) => _v._tag === "ERef" && _v.name === "_" ? true : false)(a);
var hasPipeHole = (right) => {
  const $match = right;
  switch ($match._tag) {
    case "ECall": {
      const { args: rargs } = $match;
      return length13(filter6(isPipeHole, rargs)) > 0;
    }
    default: {
      return false;
    }
  }
};
var isPipeAtom = (e) => {
  const $match = e;
  switch ($match._tag) {
    case "ERef": {
      return true;
    }
    case "ENum": {
      return true;
    }
    case "EStr": {
      return true;
    }
    case "EBool": {
      return true;
    }
    default: {
      return false;
    }
  }
};
var fillPipeHole$ = (left, right, sp) => {
  const $match = right;
  switch ($match._tag) {
    case "ECall": {
      const { fn: rfn, args: rargs, origin } = $match;
      const v = isPipeAtom(left) ? left : ERef("$pipe", sp);
      const call = ECall(rfn, map9((a) => isPipeHole(a) ? v : a, rargs), origin, sp);
      return isPipeAtom(left) ? call : ELetIn("$pipe", sp, None16, left, call, sp);
    }
    default: {
      return right;
    }
  }
};
var fillPipeHole = _curry17(3, fillPipeHole$);
var inferMatch$ = (ctx, scrutinee, arms, st) => _Result_flatMap7(([scrutT, st1]) => (([resultT, st2]) => _Result_flatMap7((st3) => Ok9(_tuple8(resultT, st3)), inferArms$(ctx, scrutT, resultT, arms, st2)))(freshVar(st1)), inferExpr$(ctx, scrutinee, st));
var inferMatch = _curry17(4, inferMatch$);
var inferExpr$ = (ctx, e, st) => _Result_flatMap7(([t, st1]) => Ok9(_tuple8(t, ((_v) => _v._tag === "EField" ? (({ name, span: sp }) => recordBinder(sp, t, "property", name, None16, st1))(_v) : recordAt(exprSpan3(e), t, st1))(e))), inferExprRaw$(ctx, e, st));
var inferExpr = _curry17(3, inferExpr$);
var inferExprRaw$ = (ctx, e, st) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return Ok9(_tuple8(tNumber, st));
    }
    case "EUnit": {
      return Ok9(_tuple8(tUnit, st));
    }
    case "EBool": {
      return Ok9(_tuple8(tBool, st));
    }
    case "EStr": {
      const { value } = $match;
      return Ok9(_tuple8(tLit(value), st));
    }
    case "ERef": {
      const { name, span: sp } = $match;
      return _Option_match16(_Map_get6(name, ctx.env), () => ctx.open ? _Set_has4(name, ctx.localNames) ? Err9(typeErrHelp$(`'${name}' is not in scope here`, sp, "it is bound elsewhere in this file, but not around this use \u2014 check the binder's extent")) : (([t, st1]) => Ok9(_tuple8(t, st1)))(freshVar(st)) : _Option_match16(closestName(name, _Map_keys6(ctx.env)), () => Err9(typeErrHelp$(`unbound variable '${name}'`, sp, "bind the name before using it, or check the spelling")), (hint) => Err9(typeErrSuggest$(`unbound variable '${name}'`, sp, `did you mean '${hint}'?`, hint))), (sc) => (([t, st1]) => Ok9(_tuple8(t, _Option_match16(_Map_get6(name, ctx.letOwner), () => st1, (vsp) => noteUse(vsp, t, st1)))))(instantiate(sc, st)));
    }
    case "ELambda": {
      const { params, body } = $match;
      return (([posParams, labParams]) => (([paramTypes, bodyEnv, st1]) => _Result_flatMap7(([annotVars, st2]) => _Result_flatMap7(([labFields, st3]) => ((allTypes) => ((st3Labs) => _Result_flatMap7(([bodyT, st4]) => Ok9(_tuple8(arrowChain$(allTypes, bodyT), recordNameParamsFrom$(posParams, paramTypes, st4))), inferExpr$(ctxWithEnv(ctx, envWithLabFields(labFields, bodyEnv)), body, st3Labs)))(recordLabParamsFrom(labParams, labFields, st3)))(((_v) => _v.length === 0 ? paramTypes : _Array_append12(tRecord(rowOfLabFields(labFields)), paramTypes))(labParams)), labFieldsFrom$(ctx, labParams, bodyEnv, annotVars, st2)), constrainParamAnnotsFrom$(ctx, posParams, paramTypes, new Map, st1)))(bindParamsFrom$(posParams, ctx.env, st)))(splitLamParams$(params, [], []));
    }
    case "ELetIn": {
      const { name, nameSpan, annot, value, body, span: _span } = $match;
      const $match$ = value;
      switch ($match$._tag) {
        case "ELambda": {
          const lets = localLetsFrom(e);
          const idxOf = idxOfMap(lets);
          const tail = localTail(e);
          return (([localCtx, localSt, localErrs]) => _Option_match16(_Array_get15(0, localErrs), () => inferExpr$(localCtx, tail, localSt), (firstErr) => Err9(firstErr)))(processGroupsFrom$(ctx, stronglyConnected(adjOf(lets, idxOf)), lets, st, noErrs));
        }
        default: {
          return _Result_flatMap7(([valT, st1]) => _Result_flatMap7(([pinned, st2]) => ((widen) => ((sc) => ((vsp) => (($ctx) => inferExpr$($ctx, body, noteLet(vsp, recordBinder(nameSpan, pinned, "let", name, None16, st2))))(ctxWithLets(ctx, _Map_set6(name, sc, ctx.env), _Map_set6(name, vsp, ctx.letOwner))))(exprSpan3(value)))(generalizeOver(ctx.env, ctx.scopeNames, pinned, st2, widen)))(_Option_match16(annot, () => true, () => false)), _Option_match16(annot, () => Ok9(_tuple8(valT, st1)), (te) => (([at, , stA]) => _Result_map6((stB) => _tuple8(at, stB), checkFits$(ctx, valT, at, stA, annotSpan(te))))(typeExprToType(te, new Map, st1, ctx.aliasMap, _Set_fromArray5([]))))), inferExpr$(ctx, value, st));
        }
      }
    }
    case "ELetBind": {
      const { param, paramSpan, monad, value, body } = $match;
      return inferLetBind$(ctx, e, param, paramSpan, monad, value, body, st);
    }
    case "ECall": {
      const { fn, args, origin } = $match;
      const api = { inferExpr: _curry17(2, (e, st0) => inferExpr$(ctx, e, st0)), unify: _curry17(4, (left, right, st0, sp) => u$(ctx, left, right, st0, sp)) };
      return _Result_flatMap7((claimed) => _Option_match16(claimed, () => inferNormalCall$(ctx, fn, args, st), (r) => Ok9(r)), runInferCallHooks(inferCallHooksOf(ctx.plugins), fn, args, origin, st, api));
    }
    case "EPipe": {
      const { left, right, fast, span: sp } = $match;
      return inferExpr$(ctx, hasPipeHole(right) ? fillPipeHole$(left, right, sp) : fast ? ((_v) => _v._tag === "ECall" ? (({ fn: rfn, args: rargs, origin }) => ECall(rfn, _Array_prepend6(left, rargs), origin, sp))(_v) : ECall(right, [left], None16, sp))(right) : ECall(right, [left], None16, sp), st);
    }
    case "EDo": {
      const { exprs } = $match;
      return inferDo$(ctx, exprs, st);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return inferTernary$(ctx, cond, thenE, elseE, st);
    }
    case "ERecord": {
      const { fields, spread, span: sp } = $match;
      return _Option_match16(spread, () => _Result_flatMap7(([row, st1]) => Ok9(_tuple8(tRecord(row), st1)), inferRecordRow$(ctx, fields, st)), (spreadExpr) => _Result_flatMap7(([row, st1]) => _Result_flatMap7(([baseT, st2]) => (([tailVar, st3]) => _Result_flatMap7((st4) => Ok9(_tuple8(baseT, st4)), u$(ctx, baseT, tRecord(rWithTail$(row, tailVar)), st3, sp)))(freshRowVar(st2)), inferExpr$(ctx, spreadExpr, st1)), inferRecordRow$(ctx, fields, st)));
    }
    case "EField": {
      const { target, name, span: sp } = $match;
      const $match$ = target;
      switch ($match$._tag) {
        case "ERef": {
          const { name: tname } = $match$;
          return and11(_Map_has5(tname, ctx.ns), !_Map_has5(tname, ctx.env)) ? inferNsField$(ctx, tname, name, sp, st) : inferFieldAccess$(ctx, e, target, name, sp, st);
        }
        default: {
          return inferFieldAccess$(ctx, e, target, name, sp, st);
        }
      }
    }
    case "ETuple": {
      const { elements } = $match;
      return _Result_flatMap7(([elems, st1]) => Ok9(_tuple8(tTuple(elems), st1)), inferTupleElems$(ctx, elements, st));
    }
    case "EArr": {
      const { elements } = $match;
      return inferSeqSlots$(ctx, "Array", elements, st);
    }
    case "EList": {
      const { elements } = $match;
      return inferSeqSlots$(ctx, "List", elements, st);
    }
    case "ESet": {
      const { elements } = $match;
      return inferSeqSlots$(ctx, "Set", elements, st);
    }
    case "EMap": {
      const { entries } = $match;
      return inferMapExpr$(ctx, entries, st);
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return inferMatch$(ctx, scrutinee, arms, st);
    }
    case "ELoop": {
      const { params, body } = $match;
      return _Result_flatMap7(([frame, bodyEnv, bodyOwner, st1]) => inferExpr$(ctxWithLoop(ctx, bodyEnv, frame, bodyOwner), body, st1), inferLoopParamsFrom$(ctx, params, 0, ctx.env, [], ctx.letOwner, st));
    }
    case "ERecur": {
      const { args, span: sp } = $match;
      return inferRecur$(ctx, args, sp, st);
    }
    case "EInterp": {
      const { parts } = $match;
      return _Result_flatMap7((st1) => Ok9(_tuple8(tString, st1)), inferInterpParts$(ctx, parts, st));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var inferExprRaw = _curry17(3, inferExprRaw$);
var inferDo$ = (ctx, exprs, st) => ((_v) => _v.length === 0 ? Err9(typeErr$("internal: empty do block", { start: 0, end: 0 })) : _v.length === 1 ? (([last]) => inferExpr$(ctx, last, st))(_v) : _v.length >= 1 ? (([first, ...rest]) => _Result_flatMap7(([, st1]) => inferDo$(ctx, rest, st1), inferExpr$(ctx, first, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(exprs);
var inferDo = _curry17(3, inferDo$);
var inferPatRecordFrom$ = (ctx, fields, row, bindings, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8(row, bindings, st)) : _v.length >= 1 ? (([f, ...rest]) => _Result_flatMap7(([subT, subBindings, st1]) => inferPatRecordFrom$(ctx, rest, rExtend(f.label, subT, row), mergeBindingMaps(bindings, subBindings), recordBinder(f.labelSpan, subT, "property", f.label, None16, st1)), inferPat$(ctx, f.pat, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields);
var inferPatRecordFrom = _curry17(5, inferPatRecordFrom$);
var inferPatRecord$ = (ctx, fields, st) => (([rowBase, st1]) => _Result_flatMap7(([row, bindings, st2]) => Ok9(_tuple8(tRecord(row), bindings, st2)), inferPatRecordFrom$(ctx, fields, rowBase, new Map, st1)))(freshRowVar(st));
var inferPatRecord = _curry17(3, inferPatRecord$);
var inferPatCtorArgs$ = (ctx, ctor, curT, args, st, bindings, sp) => ((_v) => _v.length === 0 ? Ok9(_tuple8(curT, bindings, st)) : _v.length >= 1 ? (([argPat, ...rest]) => ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => _Result_flatMap7(([subT, subBindings, st1]) => _Result_flatMap7((st2) => inferPatCtorArgs$(ctx, ctor, toT, rest, st2, mergeBindingMaps(bindings, subBindings), sp), u$(ctx, fromT, subT, st1, patSpan3(argPat))), inferPat$(ctx, argPat, st)))(_v) : Err9(typeErr$(`constructor '${ctor}' applied to too many arguments`, sp)))(resolve(curT, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(args);
var inferPatCtorArgs = _curry17(7, inferPatCtorArgs$);
var inferPatTupleFrom$ = (ctx, elems, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8([], new Map, st)) : _v.length >= 1 ? (([ep, ...rest]) => _Result_flatMap7(([t, bindings, st1]) => _Result_flatMap7(([restTs, restBindings, st2]) => Ok9(_tuple8(_Array_prepend6(t, restTs), mergeBindingMaps(restBindings, bindings), st2)), inferPatTupleFrom$(ctx, rest, st1)), inferPat$(ctx, ep, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elems);
var inferPatTupleFrom = _curry17(3, inferPatTupleFrom$);
var inferPatTuple$ = (ctx, elems, st) => _Result_flatMap7(([elemTs, bindings, st1]) => Ok9(_tuple8(tTuple(elemTs), bindings, st1)), inferPatTupleFrom$(ctx, elems, st));
var inferPatTuple = _curry17(3, inferPatTuple$);
var inferSeqPatElems$ = (ctx, elem, elems, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8(new Map, st)) : _v.length >= 1 ? (([ep, ...rest]) => _Result_flatMap7(([subT, subBindings, st1]) => _Result_flatMap7((st2) => _Result_flatMap7(([restBindings, st3]) => Ok9(_tuple8(mergeBindingMaps(restBindings, subBindings), st3)), inferSeqPatElems$(ctx, elem, rest, st2)), u$(ctx, elem, subT, st1, patSpan3(ep))), inferPat$(ctx, ep, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elems);
var inferSeqPatElems = _curry17(4, inferSeqPatElems$);
var inferSeqPat$ = (ctx, con, elems, restPat, st) => (([elem, st1]) => {
  const seqT = tCon(con, [elem]);
  return _Result_flatMap7(([bindings, st2]) => _Option_match16(restPat, () => Ok9(_tuple8(seqT, bindings, st2)), (r) => _Result_flatMap7(([subT, subBindings, st3]) => _Result_flatMap7((st4) => Ok9(_tuple8(seqT, mergeBindingMaps(bindings, subBindings), st4)), u$(ctx, subT, seqT, st3, patSpan3(r))), inferPat$(ctx, r, st2))), inferSeqPatElems$(ctx, elem, elems, st1));
})(freshVar(st));
var inferSeqPat = _curry17(5, inferSeqPat$);
var inferPat$ = (ctx, p, st) => _Result_flatMap7(([t, bindings, st1]) => Ok9(_tuple8(t, bindings, ((_v) => _v._tag === "PBind" ? (({ name, span: sp }) => recordBinder(sp, t, "parameter", name, None16, st1))(_v) : recordAt(patSpan3(p), t, st1))(p))), inferPatRaw$(ctx, p, st));
var inferPat = _curry17(3, inferPat$);
var inferPatRaw$ = (ctx, p, st) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat, name, nameSpan } = $match;
      return _Result_flatMap7(([t, bindings, st1]) => Ok9(_tuple8(t, _Map_set6(name, t, bindings), recordBinder(nameSpan, t, "parameter", name, None16, st1))), inferPat$(ctx, pat, st));
    }
    case "PWild": {
      return (([t, st1]) => Ok9(_tuple8(t, new Map, st1)))(freshVar(st));
    }
    case "PUnit": {
      return Ok9(_tuple8(tUnit, new Map, st));
    }
    case "PLit": {
      return Ok9(_tuple8(tNumber, new Map, st));
    }
    case "PBool": {
      return Ok9(_tuple8(tBool, new Map, st));
    }
    case "PStr": {
      const { value } = $match;
      return Ok9(_tuple8(tLit(value), new Map, st));
    }
    case "PBind": {
      const { name } = $match;
      return (([t, st1]) => Ok9(_tuple8(t, _Map_set6(name, t, new Map), st1)))(freshVar(st));
    }
    case "PRecord": {
      const { fields } = $match;
      return inferPatRecord$(ctx, fields, st);
    }
    case "PCtor": {
      const { ctor, args, ns, span: sp } = $match;
      return _Option_match16(ns, () => _Option_match16(_Map_get6(ctor, ctx.env), () => Err9(typeErr$(`unknown constructor '${ctor}'`, sp)), (sc) => (([curT, st1]) => inferPatCtorArgs$(ctx, ctor, curT, args, st1, new Map, sp))(instantiate(sc, st))), (alias) => _Option_match16(_Map_get6(ctor, _Map_getOr6(new Map, alias, ctx.ns)), () => Err9(typeErr$(`'${alias}' has no member '${ctor}'`, sp)), (sc) => (([curT, st1]) => inferPatCtorArgs$(ctx, ctor, curT, args, st1, new Map, sp))(instantiate(sc, st))));
    }
    case "PTuple": {
      const { elems } = $match;
      return inferPatTuple$(ctx, elems, st);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return inferSeqPat$(ctx, "Array", elems, rest, st);
    }
    case "PList": {
      const { elems, rest } = $match;
      return inferSeqPat$(ctx, "List", elems, rest, st);
    }
    case "POr": {
      const { alts, span: sp } = $match;
      return inferOrPat$(ctx, alts, sp, st);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var inferPatRaw = _curry17(3, inferPatRaw$);
var unifyOrPatBinding = _curry17(6, (ctx, name, altBindings, bindings, st, sp) => _Option_match16(_Map_get6(name, bindings), () => Ok9(st), (prevT) => _Option_match16(_Map_get6(name, altBindings), () => Ok9(st), (ty) => u$(ctx, prevT, ty, st, sp))));
var unifyOrPatBindings = _curry17(6, (ctx, names, altBindings, bindings, st, sp) => match8(names).with((_v) => _v.length === 0, () => Ok9(st)).with((_v) => _v.length >= 1, ([name, ...rest]) => _Result_flatMap7((st1) => unifyOrPatBindings(ctx, rest, altBindings, bindings, st1, sp), unifyOrPatBinding(ctx, name, altBindings, bindings, st, sp))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferOrPatAlts$ = (ctx, alts, i, t, bindings, st) => _Option_match16(_Array_get15(i, alts), () => Ok9(st), (alt) => _Result_flatMap7(([altT, altBindings, st1]) => _Result_flatMap7((st2) => _Result_flatMap7((st3) => inferOrPatAlts$(ctx, alts, i + 1, t, bindings, st3), unifyOrPatBindings(ctx, _Map_keys6(altBindings), altBindings, bindings, st2, patSpan3(alt))), u$(ctx, t, altT, st1, patSpan3(alt))), inferPat$(ctx, alt, st)));
var inferOrPatAlts = _curry17(6, inferOrPatAlts$);
var inferOrPat$ = (ctx, alts, sp, st) => ((_v) => _v.length === 0 ? Err9(typeErr$("or-pattern needs at least one alternative", sp)) : _v.length >= 1 ? (([first, ...rest]) => _Result_flatMap7(([t, bindings, st1]) => _Result_flatMap7((st2) => Ok9(_tuple8(t, bindings, st2)), inferOrPatAlts$(ctx, rest, 0, t, bindings, st1)), inferPat$(ctx, first, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(alts);
var inferOrPat = _curry17(4, inferOrPat$);
var patternBindsOpt = (rest) => _Option_match16(rest, () => [], (r) => patternBinds(r));
var patternBinds = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat, name } = $match;
      return _Array_append12(name, patternBinds(pat));
    }
    case "PBind": {
      const { name } = $match;
      return [name];
    }
    case "PRecord": {
      const { fields } = $match;
      return _Array_flatMap5((f) => patternBinds(f.pat), fields);
    }
    case "PCtor": {
      const { args } = $match;
      return _Array_flatMap5(patternBinds, args);
    }
    case "PTuple": {
      const { elems } = $match;
      return _Array_flatMap5(patternBinds, elems);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return _Array_concat7(_Array_flatMap5(patternBinds, elems), patternBindsOpt(rest));
    }
    case "PList": {
      const { elems, rest } = $match;
      return _Array_concat7(_Array_flatMap5(patternBinds, elems), patternBindsOpt(rest));
    }
    case "POr": {
      const { alts } = $match;
      return _Option_match16(_Array_head4(alts), () => [], (first) => patternBinds(first));
    }
    default: {
      return [];
    }
  }
};
var addAllFrom = _curry17(2, (names, set) => match8(names).with((_v) => _v.length === 0, () => set).with((_v) => _v.length >= 1, ([n, ...rest]) => addAllFrom(rest, _Set_add5(n, set))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var paramBound$ = (p, bound) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return paramBound$(inner, bound);
    }
    case "LPName": {
      const { name } = $match;
      return _Set_add5(name, bound);
    }
    case "LPTuple": {
      const { names } = $match;
      return addAllFrom(names, bound);
    }
    case "LPRecord": {
      const { fields } = $match;
      return addAllFrom(fields, bound);
    }
    case "LPLabeled": {
      const { name } = $match;
      return _Set_add5(name, bound);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var paramBound = _curry17(2, paramBound$);
var lambdaBound$ = (params, bound) => ((_v) => _v.length === 0 ? bound : _v.length >= 1 ? (([p, ...rest]) => lambdaBound$(rest, paramBound$(p, bound)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params);
var lambdaBound = _curry17(2, lambdaBound$);
var labeledDefaultRefs$ = (params, bound, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([p, ...rest]) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => labeledDefaultRefs$([inner, ...rest], bound, acc))(_v) : _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some" ? (({ defaultValue: { value: d } }) => labeledDefaultRefs$(rest, bound, freeRefs$(d, bound, acc)))(_v) : labeledDefaultRefs$(rest, bound, acc))(p))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params);
var labeledDefaultRefs = _curry17(3, labeledDefaultRefs$);
var loopBound = _curry17(2, (params, bound) => reduce4(_curry17(2, (b, p) => _Set_add5(p.name, b)), bound, params));
var loopInitRefsFrom$ = (params, i, bound, acc) => _Option_match16(_Array_get15(i, params), () => acc, (p) => loopInitRefsFrom$(params, i + 1, bound, freeRefs$(p.init, bound, acc)));
var loopInitRefsFrom = _curry17(4, loopInitRefsFrom$);
var freeRefsList$ = (es, bound, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([e, ...rest]) => freeRefsList$(rest, bound, freeRefs$(e, bound, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(es);
var freeRefsList = _curry17(3, freeRefsList$);
var freeRefsFields$ = (fields, bound, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([f, ...rest]) => freeRefsFields$(rest, bound, freeRefs$(f.value, bound, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields);
var freeRefsFields = _curry17(3, freeRefsFields$);
var freeRefsEntries$ = (entries, bound, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([ent, ...rest]) => freeRefsEntries$(rest, bound, freeRefs$(ent.value, bound, freeRefs$(ent.key, bound, acc))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(entries);
var freeRefsEntries = _curry17(3, freeRefsEntries$);
var freeRefsInterpParts$ = (parts, bound, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 && _v[0]._tag === "IPLit" ? (([, ...rest]) => freeRefsInterpParts$(rest, bound, acc))(_v) : _v.length >= 1 && _v[0]._tag === "IPExpr" ? (([{ expr: ex }, ...rest]) => freeRefsInterpParts$(rest, bound, freeRefs$(ex, bound, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(parts);
var freeRefsInterpParts = _curry17(3, freeRefsInterpParts$);
var freeRefsArms$ = (arms, bound, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([arm, ...rest]) => ((armBound) => ((acc1) => freeRefsArms$(rest, bound, freeRefs$(arm.body, armBound, acc1)))(_Option_match16(arm.guard, () => acc, (g) => freeRefs$(g, armBound, acc))))(addAllFrom(patternBinds(arm.pattern), bound)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(arms);
var freeRefsArms = _curry17(3, freeRefsArms$);
var freeRefs$ = (e, bound, acc) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return acc;
    }
    case "EUnit": {
      return acc;
    }
    case "EBool": {
      return acc;
    }
    case "EStr": {
      return acc;
    }
    case "ERef": {
      const { name } = $match;
      return _Set_has4(name, bound) ? acc : _Set_add5(name, acc);
    }
    case "ECall": {
      const { fn, args } = $match;
      return freeRefsList$(args, bound, freeRefs$(fn, bound, acc));
    }
    case "ELambda": {
      const { params, body } = $match;
      return freeRefs$(body, lambdaBound$(params, bound), labeledDefaultRefs$(params, bound, acc));
    }
    case "ELetIn": {
      const { name, value, body } = $match;
      const valueBound = ((_v) => _v._tag === "ELambda" ? _Set_add5(name, bound) : bound)(value);
      const acc1 = freeRefs$(value, valueBound, acc);
      return freeRefs$(body, _Set_add5(name, bound), acc1);
    }
    case "ELetBind": {
      const { param, value, body } = $match;
      const acc1 = freeRefs$(value, bound, acc);
      return freeRefs$(body, paramBound$(param, bound), acc1);
    }
    case "EPipe": {
      const { left, right } = $match;
      return freeRefs$(right, bound, freeRefs$(left, bound, acc));
    }
    case "EDo": {
      const { exprs } = $match;
      return freeRefsList$(exprs, bound, acc);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return freeRefs$(elseE, bound, freeRefs$(thenE, bound, freeRefs$(cond, bound, acc)));
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return freeRefsArms$(arms, bound, freeRefs$(scrutinee, bound, acc));
    }
    case "ELoop": {
      const { params, body } = $match;
      return freeRefs$(body, loopBound(params, bound), loopInitRefsFrom$(params, 0, bound, acc));
    }
    case "ERecur": {
      const { args } = $match;
      return freeRefsList$(args, bound, acc);
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return freeRefsFields$(fields, bound, _Option_match16(spread, () => acc, (s) => freeRefs$(s, bound, acc)));
    }
    case "EField": {
      const { target } = $match;
      return freeRefs$(target, bound, acc);
    }
    case "ETuple": {
      const { elements } = $match;
      return freeRefsList$(elements, bound, acc);
    }
    case "EArr": {
      const { elements } = $match;
      return freeRefsList$(map9(seqElemExpr2, elements), bound, acc);
    }
    case "EList": {
      const { elements } = $match;
      return freeRefsList$(map9(seqElemExpr2, elements), bound, acc);
    }
    case "ESet": {
      const { elements } = $match;
      return freeRefsList$(map9(seqElemExpr2, elements), bound, acc);
    }
    case "EMap": {
      const { entries } = $match;
      return freeRefsEntries$(entries, bound, acc);
    }
    case "EInterp": {
      const { parts } = $match;
      return freeRefsInterpParts$(parts, bound, acc);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var freeRefs = _curry17(3, freeRefs$);
var seedBuiltinsFrom = _curry17(4, (keys, builtins, env, st) => match8(keys).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([n, ...rest]) => _Option_match16(_Map_get6(n, builtins), () => seedBuiltinsFrom(rest, builtins, env, st), (t) => seedBuiltinsFrom(rest, builtins, _Map_set6(n, generalize(env, t, st, true), env), st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedBuiltins = _curry17(3, (builtins, env, st) => seedBuiltinsFrom(_Map_keys6(builtins), builtins, env, st));
var seedNsMembersFrom = _curry17(5, (keys, members, env, st, acc) => match8(keys).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([m, ...rest]) => _Option_match16(_Map_get6(m, members), () => seedNsMembersFrom(rest, members, env, st, acc), (t) => seedNsMembersFrom(rest, members, env, st, _Map_set6(m, generalize(env, t, st, true), acc)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedNsFrom = _curry17(5, (nsNames, namespaces, env, st, acc) => match8(nsNames).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([nsName, ...rest]) => _Option_match16(_Map_get6(nsName, namespaces), () => seedNsFrom(rest, namespaces, env, st, acc), (members) => seedNsFrom(rest, namespaces, env, st, _Map_set6(nsName, seedNsMembersFrom(_Map_keys6(members), members, env, st, new Map), acc)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedNs = _curry17(3, (namespaces, env, st) => seedNsFrom(_Map_keys6(namespaces), namespaces, env, st, new Map));
var seedNsImportsFrom = _curry17(3, (aliases, nsImports, ns) => match8(aliases).with((_v) => _v.length === 0, () => ns).with((_v) => _v.length >= 1, ([alias, ...rest]) => _Option_match16(_Map_get6(alias, nsImports), () => seedNsImportsFrom(rest, nsImports, ns), (members) => seedNsImportsFrom(rest, nsImports, _Map_set6(alias, members, ns)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedNsImports = _curry17(2, (nsImports, ns) => seedNsImportsFrom(_Map_keys6(nsImports), nsImports, ns));
var aliasMapFrom$ = (stmts, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SType" && _v.alias._tag === "Some" ? (({ name, params, alias: { value: fields } }) => aliasMapFrom$(rest, _Map_set6(name, { params, fields, expr: None16 }, acc)))(_v) : _v._tag === "SType" && _v.aliasType._tag === "Some" ? (({ name, params, aliasType: { value: te } }) => aliasMapFrom$(rest, _Map_set6(name, { params, fields: [], expr: Some16(te) }, acc)))(_v) : aliasMapFrom$(rest, acc))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(stmts);
var aliasMapFrom = _curry17(2, aliasMapFrom$);
var registerCtorsFrom = _curry17(6, (ctors, typeName, params, aliasMap, env, st) => match8(ctors).with((_v) => _v.length === 0, () => _tuple8(env, st)).with((_v) => _v.length >= 1, ([c, ...rest]) => (([sc, st1]) => registerCtorsFrom(rest, typeName, params, aliasMap, _Map_set6(c.name, sc, env), st1))(ctorScheme(typeName, params, c, st, aliasMap))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerUserCtorsFrom$ = (stmts, aliasMap, env, st) => ((_v) => _v.length === 0 ? _tuple8(env, st) : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SType" ? (({ name, params, ctors }) => (([env1, st1]) => registerUserCtorsFrom$(rest, aliasMap, env1, st1))(registerCtorsFrom(ctors, name, params, aliasMap, env, st)))(_v) : registerUserCtorsFrom$(rest, aliasMap, env, st))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(stmts);
var registerUserCtorsFrom = _curry17(4, registerUserCtorsFrom$);
var registerBuiltinCtorGroup = _curry17(6, (ctors, typeName, params, aliasMap, env, st) => match8(ctors).with((_v) => _v.length === 0, () => _tuple8(env, st)).with((_v) => _v.length >= 1, ([c, ...rest]) => _Map_has5(c.name, env) ? registerBuiltinCtorGroup(rest, typeName, params, aliasMap, env, st) : (([sc, st1]) => registerBuiltinCtorGroup(rest, typeName, params, aliasMap, _Map_set6(c.name, sc, env), st1))(ctorScheme(typeName, params, c, st, aliasMap))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerBuiltinCtorsFrom = _curry17(4, (decls, aliasMap, env, st) => match8(decls).with((_v) => _v.length === 0, () => _tuple8(env, st)).with((_v) => _v.length >= 1, ([d, ...rest]) => (([env1, st1]) => registerBuiltinCtorsFrom(rest, aliasMap, env1, st1))(registerBuiltinCtorGroup(d.ctors, d.name, d.params, aliasMap, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerExternsFrom$ = (stmts, aliasMap, env, st) => ((_v) => _v.length === 0 ? _tuple8(env, st) : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SExtern" ? (({ name, nameSpan, params, typeExpr, doc }) => (([vars, st0]) => (([t, , st1]) => {
  const sc = generalize(env, t, st1, false);
  return registerExternsFrom$(rest, aliasMap, _Map_set6(name, sc, env), recordBinder(nameSpan, sc.ty, "extern", name, doc, st1));
})(typeExprToType(typeExpr, vars, st0, aliasMap, _Set_fromArray5([]))))(reduce4(_curry17(2, ([vs, s], param) => (([v, s1]) => _tuple8(_Map_set6(param, v, vs), s1))(freshVar(s))), _tuple8(new Map, st), params)))(_v) : registerExternsFrom$(rest, aliasMap, env, st))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(stmts);
var registerExternsFrom = _curry17(4, registerExternsFrom$);
var letsOfFrom = (stmts) => ((_v) => _v.length === 0 ? [] : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" ? _Array_prepend6(s, letsOfFrom(rest)) : letsOfFrom(rest))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(stmts);
var localLetsFrom = (e) => {
  const collect = _curry17(2, (current, acc) => {
    const $match = current;
    switch ($match._tag) {
      case "ELetIn": {
        const { name, nameSpan, annot, value, body, span } = $match;
        const $match$ = value;
        switch ($match$._tag) {
          case "ELambda": {
            return collect(body, _Array_append12(SLet(name, nameSpan, annot, value, false, None16, span), acc));
          }
          default: {
            return acc;
          }
        }
      }
      default: {
        return acc;
      }
    }
  });
  return collect(e, []);
};
var localTail = (e) => ((_v) => _v._tag === "ELetIn" && _v.value._tag === "ELambda" ? (({ body }) => localTail(body))(_v) : e)(e);
var idxOfFrom$ = (lets, i0, acc0) => {
  let i = i0;
  let acc = acc0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done7(acc) : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { name } }) => _recur7(i + 1, _Map_set6(name, i, acc)))(_v) : _v._tag === "Some" ? _recur7(i + 1, acc) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get15(i, lets));
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
};
var idxOfFrom = _curry17(3, idxOfFrom$);
var idxOfMap = (lets) => idxOfFrom$(lets, 0, new Map);
var depsOf = _curry17(2, (letStmt, idxOf) => {
  const $match = letStmt;
  switch ($match._tag) {
    case "SLet": {
      const { value } = $match;
      return _Array_flatMap5((r) => _Option_match16(_Map_get6(r, idxOf), () => [], (j) => [j]), _Set_toArray2(freeRefs$(value, _Set_fromArray5([]), _Set_fromArray5([]))));
    }
    default: {
      return [];
    }
  }
});
var adjOf = _curry17(2, (lets, idxOf) => map9((s) => depsOf(s, idxOf), lets));
var groupOfFrom = _curry17(2, (idxs, lets) => ((_v) => _v.length === 0 ? [] : _v.length >= 1 ? (([i, ...rest]) => _Option_match16(_Array_get15(i, lets), () => groupOfFrom(rest, lets), (s) => _Array_prepend6(s, groupOfFrom(rest, lets))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(idxs));
var preBindGroupFrom$ = (group, env, st) => ((_v) => _v.length === 0 ? _tuple8(env, st) : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" ? (({ name }) => (([v, st1]) => preBindGroupFrom$(rest, _Map_set6(name, mono(v), env), st1))(freshVar(st)))(_v) : preBindGroupFrom$(rest, env, st))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(group);
var preBindGroupFrom = _curry17(3, preBindGroupFrom$);
var inferMember$ = (ctx, name, annot, value, span, st) => ((_v) => _v._tag === "Err" ? (({ error: e }) => Err9({ err: e, st }))(_v) : _v._tag === "Ok" ? (({ value: [t, st1] }) => _Option_match16(_Map_get6(name, ctx.env), () => Err9({ err: typeErr$(`internal: missing self-binding for '${name}'`, span), st: st1 }), (selfSc) => _Result_match5(u$(ctx, selfSc.ty, t, st1, span), (e) => Err9({ err: e, st: st1 }), (st2) => _Option_match16(annot, () => Ok9(_tuple8(t, st2)), (te) => (([at, , stA]) => _Result_match5(checkFits$(ctx, t, at, stA, annotSpan(te)), (e) => Err9({ err: e, st: stA }), (stB) => Ok9(_tuple8(at, stB))))(typeExprToType(te, new Map, st2, ctx.aliasMap, _Set_fromArray5([])))))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(inferExpr$(ctx, value, st));
var inferMember = _curry17(6, inferMember$);
var inferGroupFrom$ = (ctx, group, st, errs) => ((_v) => _v.length === 0 ? _tuple8(new Map, st, errs) : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" ? (({ name, nameSpan, annot, value, doc, span }) => ((_v) => _v._tag === "Err" ? (({ error: me }) => inferGroupFrom$(ctx, rest, me.st, _Array_append12(me.err, errs)))(_v) : _v._tag === "Ok" ? (({ value: [pinned, st3] }) => ((stNamed) => (([restTypes, st4, errs1]) => _tuple8(_Map_set6(name, pinned, restTypes), st4, errs1))(inferGroupFrom$(ctx, rest, stNamed, errs)))(_Str_startsWith3("$", name) ? st3 : recordBinder(nameSpan, pinned, "let", name, doc, st3)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(inferMember$(ctx, name, annot, value, span, st)))(_v) : inferGroupFrom$(ctx, rest, st, errs))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(group);
var inferGroupFrom = _curry17(4, inferGroupFrom$);
var dropGroupFrom = _curry17(2, (group, env) => ((_v) => _v.length === 0 ? env : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" ? (({ name }) => dropGroupFrom(rest, _Map_delete(name, env)))(_v) : dropGroupFrom(rest, env))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(group));
var groupNamesFrom$ = (group, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" ? (({ name }) => groupNamesFrom$(rest, _Array_append12(name, acc)))(_v) : groupNamesFrom$(rest, acc))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(group);
var groupNamesFrom = _curry17(2, groupNamesFrom$);
var generalizeGroupFrom$ = (group, bodyTypes, preEnv, env, names, st) => ((_v) => _v.length === 0 ? env : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" ? (({ name, annot }) => _Option_match16(_Map_get6(name, bodyTypes), () => generalizeGroupFrom$(rest, bodyTypes, preEnv, _Option_match16(_Map_get6(name, preEnv), () => env, (sc) => _Map_set6(name, sc, env)), names, st), (t) => {
  const widen = _Option_match16(annot, () => true, () => false);
  return generalizeGroupFrom$(rest, bodyTypes, preEnv, _Map_set6(name, generalizeOver(env, names, t, st, widen), env), names, st);
}))(_v) : generalizeGroupFrom$(rest, bodyTypes, preEnv, env, names, st))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(group);
var generalizeGroupFrom = _curry17(6, generalizeGroupFrom$);
var noteGroupLets$ = (group, letOwner, st) => ((_v) => _v.length === 0 ? _tuple8(letOwner, st) : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" && (({ name, value }) => !_Str_startsWith3("$", name))(_v) ? (({ name, value }) => ((sp) => noteGroupLets$(rest, _Map_set6(name, sp, letOwner), noteLet(sp, st)))(exprSpan3(value)))(_v) : noteGroupLets$(rest, letOwner, st))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(group);
var noteGroupLets = _curry17(3, noteGroupLets$);
var processGroupsFrom$ = (ctx, sccs, lets, st, errs) => ((_v) => _v.length === 0 ? _tuple8(ctx, st, errs) : _v.length >= 1 ? (([comp, ...restSccs]) => ((group) => (([preEnv, st1]) => {
  const preCtx = ctxWithGroup(ctx, preEnv, groupNamesFrom$(group, []));
  return (([bodyTypes, st2, errs1]) => {
    const finalEnv = generalizeGroupFrom$(group, bodyTypes, preEnv, dropGroupFrom(group, preEnv), ctx.scopeNames, st2);
    return (([finalOwner, st3]) => processGroupsFrom$(ctxWithLets(ctx, finalEnv, finalOwner), restSccs, lets, st3, errs1))(noteGroupLets$(group, ctx.letOwner, st2));
  })(inferGroupFrom$(preCtx, group, st1, errs));
})(preBindGroupFrom$(group, ctx.env, st)))(groupOfFrom(comp, lets)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(sccs);
var processGroupsFrom = _curry17(5, processGroupsFrom$);
var inferExprStmtsFrom$ = (ctx, stmts, st, errs) => ((_v) => _v.length === 0 ? _tuple8(st, errs) : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SExpr" ? (({ value, span }) => ((_v) => _v._tag === "Err" ? (({ error: e }) => inferExprStmtsFrom$(ctx, rest, st, _Array_append12(e, errs)))(_v) : _v._tag === "Ok" ? (({ value: [t, st1] }) => _Result_match5(u$(ctx, t, tUnit, st1, span), (e) => inferExprStmtsFrom$(ctx, rest, st1, _Array_append12(e, errs)), (st2) => inferExprStmtsFrom$(ctx, rest, st2, errs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(inferExpr$(ctx, value, st)))(_v) : inferExprStmtsFrom$(ctx, rest, st, errs))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(stmts);
var inferExprStmtsFrom = _curry17(4, inferExprStmtsFrom$);
var seedImportsFrom = _curry17(3, (keys, imports, env) => match8(keys).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([k, ...rest]) => _Option_match16(_Map_get6(k, imports), () => seedImportsFrom(rest, imports, env), (sc) => seedImportsFrom(rest, imports, _Map_set6(k, sc, env)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var qualifyTe = _curry17(3, (te, alias, from) => {
  const $match = te;
  switch ($match._tag) {
    case "TyName": {
      const { name, span: sp } = $match;
      return _Map_has5(name, from) ? TyQual(alias, name, sp, [], sp) : te;
    }
    case "TyApp": {
      const { ctor, args, span: sp } = $match;
      const args1 = map9((a) => qualifyTe(a, alias, from), args);
      return _Map_has5(ctor, from) ? TyQual(alias, ctor, sp, args1, sp) : TyApp(ctor, args1, sp);
    }
    case "TyArrow": {
      const { from: fromTe, to: toTe, span: sp } = $match;
      return TyArrow(qualifyTe(fromTe, alias, from), qualifyTe(toTe, alias, from), sp);
    }
    case "TyTuple": {
      const { elems, span: sp } = $match;
      return TyTuple(map9((e) => qualifyTe(e, alias, from), elems), sp);
    }
    case "TyList": {
      const { elem, span: sp } = $match;
      return TyList(qualifyTe(elem, alias, from), sp);
    }
    case "TyUnion": {
      const { members, span: sp } = $match;
      return TyUnion(map9((m) => qualifyTe(m, alias, from), members), sp);
    }
    case "TyQual": {
      const { alias: inner, name, nameSpan: nsp, args, span: sp } = $match;
      const args1 = map9((a) => qualifyTe(a, alias, from), args);
      return _Map_has5(`${inner}.${name}`, from) ? TyQual(alias, `${inner}.${name}`, nsp, args1, sp) : TyQual(inner, name, nsp, args1, sp);
    }
    default: {
      return te;
    }
  }
});
var qualifyField = _curry17(3, (fld, alias, from) => ({ ...fld, fieldType: qualifyTe(fld.fieldType, alias, from) }));
var qualifyInfo = _curry17(3, (info, alias, from) => ({ params: info.params, fields: map9((f) => qualifyField(f, alias, from), info.fields), expr: _Option_map((te) => qualifyTe(te, alias, from), info.expr) }));
var qualAliasSeedFrom = _curry17(4, (names, alias, from, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([n, ...rest]) => qualAliasSeedFrom(rest, alias, from, _Option_match16(_Map_get6(n, from), () => acc, (info) => _Map_set6(`${alias}.${n}`, qualifyInfo(info, alias, from), acc))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(names));
var qualAliasSeed = _curry17(3, (stmts, quals, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([s, ...rest]) => qualAliasSeed(rest, quals, ((_v) => _v._tag === "SImportNs" ? (({ alias }) => _Option_match16(_Map_get6(alias.name, quals), () => acc, (dep) => qualAliasSeedFrom(_Map_keys6(dep.aliases), alias.name, dep.aliases, acc)))(_v) : acc)(s)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(stmts));
var zonkRecorded = (st) => map9((r) => ({ span: r.span, ty: zonk(r.ty, st), sym: r.sym }), recordedTypes(st));
var isConcrete = (t) => {
  const f = freeInType(t);
  return and11(_Set_size2(f.tv) === 0, _Set_size2(f.rv) === 0);
};
var allSameConcreteFrom$ = (shown, uses, i) => _Option_match16(_Array_get15(i, uses), () => true, (t) => and11(isConcrete(t), eq14(showType(t), shown)) ? allSameConcreteFrom$(shown, uses, i + 1) : false);
var allSameConcreteFrom = _curry17(3, allSameConcreteFrom$);
var allSameConcrete$ = (shown, uses) => allSameConcreteFrom$(shown, uses, 0);
var allSameConcrete = _curry17(2, allSameConcrete$);
var resolveLetParamsFrom$ = (keys, st) => ((_v) => _v.length === 0 ? [] : _v.length >= 1 ? (([k, ...rest]) => ((tail) => ((uses) => _Option_match16(_Array_get15(0, uses), () => tail, (first) => allSameConcrete$(showType(first), uses) ? _Option_match16(_Map_get6(k, st.letSpans), () => tail, (span) => _Array_prepend6({ span, ty: first, sym: None16 }, tail)) : tail))(map9((t) => zonk(t, st), _Map_getOr6([], k, st.letUses))))(resolveLetParamsFrom$(rest, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(keys);
var resolveLetParamsFrom = _curry17(2, resolveLetParamsFrom$);
var resolveLetParams = (st) => resolveLetParamsFrom$(_Map_keys6(st.letSpans), st);
var runInferImports = _curry17(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => {
  const plugins = resolvePluginsDefault(pluginsOpt);
  const st0 = mkSt(1000);
  const env0 = seedBuiltins(builtins, new Map, st0);
  const ns0 = seedNsImports(nsImports, seedNs(namespaces, env0, st0));
  const aliasMap = aliasMapFrom$(stmts, qualAliasSeed(stmts, quals, new Map));
  return (([env1, st1]) => (([env2, st2]) => (([env3, st3]) => {
    const env4 = seedImportsFrom(_Map_keys6(imports), imports, env3);
    const lets = letsOfFrom(stmts);
    const idxOf = idxOfMap(lets);
    const sccs = stronglyConnected(adjOf(lets, idxOf));
    const localNames = localBinderNames(stmts);
    return (([finalCtx, st4, errs]) => (([st5, errs1]) => ((_v) => _v.length === 0 ? Ok9({ env: finalCtx.env, types: zonkRecorded(st5), aliases: aliasMap, letParams: resolveLetParams(st5) }) : Err9(errs1))(errs1))(inferExprStmtsFrom$(finalCtx, stmts, st4, errs)))(processGroupsFrom$({ env: env4, open: openMode, ns: ns0, aliasMap, plugins, loopStack: [], letOwner: new Map, localNames, scopeNames: _Set_toArray2(localNames) }, sccs, lets, st3, noErrs));
  })(registerExternsFrom$(stmts, aliasMap, env2, st2)))(registerBuiltinCtorsFrom(builtinDeclsFor(stmts), aliasMap, env1, st1)))(registerUserCtorsFrom$(stmts, aliasMap, env0, st0));
});
var scopeAliases = _curry17(2, (stmts, quals) => aliasMapFrom$(stmts, qualAliasSeed(stmts, quals, new Map)));
var inferProgramImports = _curry17(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => _Result_map6((r) => r.env, runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt)));
var emptyQuals2 = new Map;
var inferProgram$ = (stmts, builtins, namespaces, openMode) => inferProgramImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, None16);
var inferProgram = _curry17(4, inferProgram$);
var inferProgramImportsTypes = _curry17(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt));
var inferProgramTypes$ = (stmts, builtins, namespaces, openMode) => runInferImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, None16);
var inferProgramTypes = _curry17(4, inferProgramTypes$);
var inferProgramTypesWith$ = (stmts, builtins, namespaces, openMode, pluginsOpt) => runInferImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, pluginsOpt);
var inferProgramTypesWith = _curry17(5, inferProgramTypesWith$);
var inferProgramWith$ = (stmts, builtins, namespaces, openMode, pluginsOpt) => inferProgramImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, pluginsOpt);
var inferProgramWith = _curry17(5, inferProgramWith$);
var takeScheme = _curry17(3, (name, env, acc) => _Option_match16(_Map_get6(name, env), () => acc, (sc) => _Map_set6(name, sc, acc)));
var exportCtorsInto = _curry17(4, (ctors, i, env, acc) => _Option_match16(_Array_get15(i, ctors), () => acc, (c) => exportCtorsInto(ctors, i + 1, env, takeScheme(c.name, env, acc))));
var exportedSchemesFrom = _curry17(4, (stmts, i0, env, acc0) => {
  let i = i0;
  let acc = acc0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done7(acc) : _v._tag === "Some" && _v.value._tag === "SLet" && _v.value.exported === true ? (({ value: { name } }) => _recur7(i + 1, takeScheme(name, env, acc)))(_v) : _v._tag === "Some" && _v.value._tag === "SExtern" && _v.value.exported === true ? (({ value: { name } }) => _recur7(i + 1, takeScheme(name, env, acc)))(_v) : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true ? (({ value: { ctors } }) => _recur7(i + 1, exportCtorsInto(ctors, 0, env, acc)))(_v) : _v._tag === "Some" ? _recur7(i + 1, acc) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get15(i, stmts));
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var exportedSchemes = _curry17(2, (stmts, env) => exportedSchemesFrom(stmts, 0, env, new Map));

import { None as None18, Some as Some18, _Array_append as _Array_append14, _Array_concat as _Array_concat9, _Array_flatMap as _Array_flatMap6, _Array_get as _Array_get17, _Array_prepend as _Array_prepend8, _Map_get as _Map_get8, _Map_getOr as _Map_getOr7, _Map_has as _Map_has6, _Map_keys as _Map_keys7, _Map_set as _Map_set7, _Option_contains as _Option_contains3, _Option_exists as _Option_exists4, _Option_isNone as _Option_isNone2, _Option_isSome as _Option_isSome5, _Option_match as _Option_match18, _Option_unwrapOr as _Option_unwrapOr11, _Set_add as _Set_add6, _Set_fromArray as _Set_fromArray6, _Set_has as _Set_has5, _Set_size as _Set_size3, _Set_toArray as _Set_toArray3, _Set_union, _Str_chars as _Str_chars2, _Str_codeAt as _Str_codeAt7, _Str_concat as _Str_concat2, _Str_endsWith as _Str_endsWith2, _Str_join as _Str_join8, _Str_length as _Str_length6, _Str_replace as _Str_replace2, _Str_slice as _Str_slice3, _Str_split as _Str_split5, _Str_startsWith as _Str_startsWith4, _curry as _curry20, _done as _done8, _recur as _recur8, _tuple as _tuple9, and as and12, concat, eq as eq16, filter as filter7, length as length15, map as map12, or as or11, reduce as reduce5, show as show8 } from "@mochi/compiler/runtime";
import { match as match9 } from "@onrails/pattern";

import { None as None17, Some as Some17, _Array_append as _Array_append13, _Array_concat as _Array_concat8, _Array_get as _Array_get16, _Array_head as _Array_head5, _Array_prepend as _Array_prepend7, _Map_get as _Map_get7, _Option_isSome as _Option_isSome4, _Option_match as _Option_match17, _Option_unwrapOr as _Option_unwrapOr10, _Str_join as _Str_join7, _curry as _curry19, eq as eq15, length as length14, map as map11, or as or10, show as show7 } from "@mochi/compiler/runtime";

import { _Str_chars, _Str_join as _Str_join6, map as map10 } from "@mochi/compiler/runtime";
var escChar2 = (c) => ((_v) => _v === "\\" ? "\\\\" : _v === '"' ? "\\\"" : _v === `
` ? "\\n" : _v === "\t" ? "\\t" : c)(c);
var jsStringLit = (s) => `"${_Str_join6("", map10(escChar2, _Str_chars(s)))}"`;
var litValue = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PStr": {
      const { value: v } = $match;
      return jsStringLit(v);
    }
    case "PLit": {
      const { raw } = $match;
      return raw;
    }
    case "PBool": {
      const { value: v } = $match;
      return v ? "true" : "false";
    }
    default: {
      return "";
    }
  }
};

var someOfFrom3 = _curry19(3, (f, xs, i) => _Option_match17(_Array_get16(i, xs), () => false, (x) => f(x) ? true : someOfFrom3(f, xs, i + 1)));
var someOf3 = _curry19(2, (f, xs) => someOfFrom3(f, xs, 0));
var patternKeyAt$ = (ctorKeys, ctor, i) => _Option_match17(_Map_get7(ctor, ctorKeys), () => `_${show7(i)}`, (ks) => _Option_unwrapOr10(`_${show7(i)}`, _Array_get16(i, ks)));
var patternKeyAt = _curry19(3, patternKeyAt$);
var keyedSlot$ = (key, sub) => eq15(sub, key) ? key : `${key}: ${sub}`;
var keyedSlot = _curry19(2, keyedSlot$);
var pctorEntries$ = (ctorKeys, ctor, args, i) => _Option_match17(_Array_get16(i, args), () => [], (a) => {
  const s = patSlot$(ctorKeys, a);
  const restEntries = pctorEntries$(ctorKeys, ctor, args, i + 1);
  return s === "" ? restEntries : _Array_prepend7(keyedSlot$(patternKeyAt$(ctorKeys, ctor, i), s), restEntries);
});
var pctorEntries = _curry19(4, pctorEntries$);
var precordEntries$ = (ctorKeys, fields, i) => _Option_match17(_Array_get16(i, fields), () => [], (f) => {
  const s = patSlot$(ctorKeys, f.pat);
  const restEntries = precordEntries$(ctorKeys, fields, i + 1);
  return s === "" ? restEntries : _Array_prepend7(keyedSlot$(f.label, s), restEntries);
});
var precordEntries = _curry19(3, precordEntries$);
var patSlot$ = (ctorKeys, p) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat, name } = $match;
      const inner = patSlot$(ctorKeys, pat);
      return inner === "" ? name : `${inner}, ${name}`;
    }
    case "PBind": {
      const { name } = $match;
      return name;
    }
    case "PWild": {
      return "";
    }
    case "PUnit": {
      return "";
    }
    case "PLit": {
      return "";
    }
    case "PBool": {
      return "";
    }
    case "PStr": {
      return "";
    }
    case "PList": {
      return "";
    }
    case "PCtor": {
      const { ctor, args } = $match;
      const entries = pctorEntries$(ctorKeys, ctor, args, 0);
      return length14(entries) === 0 ? "" : `{ ${_Str_join7(", ", entries)} }`;
    }
    case "PRecord": {
      const { fields } = $match;
      const entries = precordEntries$(ctorKeys, fields, 0);
      return length14(entries) === 0 ? "" : `{ ${_Str_join7(", ", entries)} }`;
    }
    case "PTuple": {
      const { elems } = $match;
      const slots = map11((el) => patSlot$(ctorKeys, el), elems);
      return someOf3((s) => s !== "", slots) ? `[${_Str_join7(", ", slots)}]` : "";
    }
    case "PArr": {
      const { elems, rest } = $match;
      const slots = map11((el) => patSlot$(ctorKeys, el), elems);
      const slots2 = ((_v) => _v._tag === "Some" && _v.value._tag === "PBind" ? (({ value: { name } }) => _Array_append13(`...${name}`, slots))(_v) : slots)(rest);
      return someOf3((s) => s !== "", slots2) ? `[${_Str_join7(", ", slots2)}]` : "";
    }
    case "POr": {
      const { alts } = $match;
      return _Option_match17(_Array_head5(alts), () => "", (first) => patSlot$(ctorKeys, first));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var patSlot = _curry19(2, patSlot$);
var pctorConds$ = (ctorKeys, ctor, args, i, path) => _Option_match17(_Array_get16(i, args), () => [], (a) => _Array_concat8(patConds$(ctorKeys, a, `${path}.${patternKeyAt$(ctorKeys, ctor, i)}`), pctorConds$(ctorKeys, ctor, args, i + 1, path)));
var pctorConds = _curry19(5, pctorConds$);
var precordConds$ = (ctorKeys, fields, i, path) => _Option_match17(_Array_get16(i, fields), () => [], (f) => _Array_concat8(patConds$(ctorKeys, f.pat, `${path}.${f.label}`), precordConds$(ctorKeys, fields, i + 1, path)));
var precordConds = _curry19(4, precordConds$);
var ptupleConds$ = (ctorKeys, elems, i, path) => _Option_match17(_Array_get16(i, elems), () => [], (el) => _Array_concat8(patConds$(ctorKeys, el, `${path}[${show7(i)}]`), ptupleConds$(ctorKeys, elems, i + 1, path)));
var ptupleConds = _curry19(4, ptupleConds$);
var parrConds$ = (ctorKeys, elems, i, path) => _Option_match17(_Array_get16(i, elems), () => [], (el) => _Array_concat8(patConds$(ctorKeys, el, `${path}[${show7(i)}]`), parrConds$(ctorKeys, elems, i + 1, path)));
var parrConds = _curry19(4, parrConds$);
var patConds$ = (ctorKeys, p, path) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return patConds$(ctorKeys, pat, path);
    }
    case "PWild": {
      return [];
    }
    case "PUnit": {
      return [];
    }
    case "PBind": {
      return [];
    }
    case "PList": {
      return [];
    }
    case "PLit": {
      return [`${path} === ${litValue(p)}`];
    }
    case "PBool": {
      return [`${path} === ${litValue(p)}`];
    }
    case "PStr": {
      return [`${path} === ${litValue(p)}`];
    }
    case "PCtor": {
      const { ctor, args } = $match;
      return _Array_prepend7(`${path}._tag === ${jsStringLit(ctor)}`, pctorConds$(ctorKeys, ctor, args, 0, path));
    }
    case "PRecord": {
      const { fields } = $match;
      return precordConds$(ctorKeys, fields, 0, path);
    }
    case "PTuple": {
      const { elems } = $match;
      return ptupleConds$(ctorKeys, elems, 0, path);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return _Array_prepend7(`${path}.length ${_Option_isSome4(rest) ? ">=" : "==="} ${show7(length14(elems))}`, parrConds$(ctorKeys, elems, 0, path));
    }
    case "POr": {
      const { alts } = $match;
      const altCond = (alt) => {
        const conds = patConds$(ctorKeys, alt, path);
        return length14(conds) === 0 ? "true" : _Str_join7(" && ", map11((c) => `(${c})`, conds));
      };
      return [_Str_join7(" || ", map11((alt) => `(${altCond(alt)})`, alts))];
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var patConds = _curry19(3, patConds$);
var fieldRefine$ = (ctorKeys, p, fieldBase) => {
  const $match = p;
  switch ($match._tag) {
    case "PCtor": {
      return Some17(patTarget$(ctorKeys, p, fieldBase));
    }
    case "PRecord": {
      const t = patTarget$(ctorKeys, p, fieldBase);
      return eq15(t, fieldBase) ? None17 : Some17(t);
    }
    case "PTuple": {
      const t = patTarget$(ctorKeys, p, fieldBase);
      return eq15(t, fieldBase) ? None17 : Some17(t);
    }
    case "PArr": {
      const t = patTarget$(ctorKeys, p, fieldBase);
      return eq15(t, fieldBase) ? None17 : Some17(t);
    }
    default: {
      return None17;
    }
  }
};
var fieldRefine = _curry19(3, fieldRefine$);
var ctorRefines$ = (ctorKeys, args, keys, member, i) => _Option_match17(_Array_get16(i, args), () => [], (a) => {
  const rest = ctorRefines$(ctorKeys, args, keys, member, i + 1);
  const key = _Option_unwrapOr10(`_${show7(i)}`, _Array_get16(i, keys));
  return _Option_match17(fieldRefine$(ctorKeys, a, `${member}[${jsStringLit(key)}]`), () => rest, (sub) => _Array_prepend7(`${jsStringLit(key)}: ${sub}`, rest));
});
var ctorRefines = _curry19(5, ctorRefines$);
var recordRefines$ = (ctorKeys, fields, base, i) => _Option_match17(_Array_get16(i, fields), () => [], (f) => {
  const rest = recordRefines$(ctorKeys, fields, base, i + 1);
  return _Option_match17(fieldRefine$(ctorKeys, f.pat, `${base}[${jsStringLit(f.label)}]`), () => rest, (sub) => _Array_prepend7(`${jsStringLit(f.label)}: ${sub}`, rest));
});
var recordRefines = _curry19(4, recordRefines$);
var tupleSlotBase = _curry19(2, (base, i) => `(${base})[${show7(i)}]`);
var tupleTargets$ = (ctorKeys, elems, base, i) => _Option_match17(_Array_get16(i, elems), () => [], (el) => {
  const slotBase = tupleSlotBase(base, i);
  return _Array_prepend7(_Option_unwrapOr10(slotBase, fieldRefine$(ctorKeys, el, slotBase)), tupleTargets$(ctorKeys, elems, base, i + 1));
});
var tupleTargets = _curry19(4, tupleTargets$);
var tupleRefines$ = (ctorKeys, elems, base, i) => _Option_match17(_Array_get16(i, elems), () => false, (el) => or10(_Option_isSome4(fieldRefine$(ctorKeys, el, tupleSlotBase(base, i))), tupleRefines$(ctorKeys, elems, base, i + 1)));
var tupleRefines = _curry19(4, tupleRefines$);
var arrTargets$ = (ctorKeys, elems, elemBase, i) => _Option_match17(_Array_get16(i, elems), () => [], (el) => _Array_prepend7(_Option_unwrapOr10(elemBase, fieldRefine$(ctorKeys, el, elemBase)), arrTargets$(ctorKeys, elems, elemBase, i + 1)));
var arrTargets = _curry19(4, arrTargets$);
var arrRefines$ = (ctorKeys, elems, elemBase, i) => _Option_match17(_Array_get16(i, elems), () => false, (el) => or10(_Option_isSome4(fieldRefine$(ctorKeys, el, elemBase)), arrRefines$(ctorKeys, elems, elemBase, i + 1)));
var arrRefines = _curry19(4, arrRefines$);
var patTarget$ = (ctorKeys, p, base) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return patTarget$(ctorKeys, pat, base);
    }
    case "PCtor": {
      const { ctor, args } = $match;
      const member = `Extract<${base}, { _tag: ${jsStringLit(ctor)} }>`;
      const keys = _Option_unwrapOr10([], _Map_get7(ctor, ctorKeys));
      const refines = ctorRefines$(ctorKeys, args, keys, member, 0);
      return length14(refines) === 0 ? member : `${member} & { ${_Str_join7("; ", refines)} }`;
    }
    case "PRecord": {
      const { fields } = $match;
      const refines = recordRefines$(ctorKeys, fields, base, 0);
      return length14(refines) === 0 ? base : `${base} & { ${_Str_join7("; ", refines)} }`;
    }
    case "PTuple": {
      const { elems } = $match;
      return !tupleRefines$(ctorKeys, elems, base, 0) ? base : `[${_Str_join7(", ", tupleTargets$(ctorKeys, elems, base, 0))}]`;
    }
    case "PArr": {
      const { elems, rest: restOpt } = $match;
      const elemBase = `(${base})[number]`;
      return !arrRefines$(ctorKeys, elems, elemBase, 0) ? base : ((heads) => _Option_match17(restOpt, () => `[${heads}]`, () => `[${heads}, ...${base}]`))(_Str_join7(", ", arrTargets$(ctorKeys, elems, elemBase, 0)));
    }
    default: {
      return base;
    }
  }
};
var patTarget = _curry19(3, patTarget$);

var jsGenOpts = { annotateLet: None18, annotateRaw: None18, annotateCtor: None18, annotateParams: None18, annotateEmpty: None18, annotateLetin: None18, annotateCall: None18, guardBaseType: None18, flattenPipe: false, tupleHelper: false, preserveInfix: false, preserveJsx: false, moduleExt: ".js", docs: true };
var hook1 = _curry20(2, (h, x) => _Option_match18(h, () => None18, (f) => f(x)));
var hook2 = _curry20(3, (h, x, y) => _Option_match18(h, () => None18, (f) => f(x, y)));
var emptyNsCtor$ = (con, ann) => _Option_match18(ann, () => `new ${con}()`, (t) => `new ${t}()`);
var emptyNsCtor = _curry20(2, emptyNsCtor$);
var isIdentStart = (c) => or11(or11(or11(and12(c >= 65, c <= 90), and12(c >= 97, c <= 122)), c === 95), c === 36);
var isIdentPart = (c) => or11(isIdentStart(c), and12(c >= 48, c <= 57));
var identPartsFrom$ = (s, i) => _Option_match18(_Str_codeAt7(i, s), () => true, (c) => and12(isIdentPart(c), identPartsFrom$(s, i + 1)));
var identPartsFrom = _curry20(2, identPartsFrom$);
var isJsIdent = (s) => _Option_match18(_Str_codeAt7(0, s), () => false, (c) => and12(isIdentStart(c), identPartsFrom$(s, 1)));
var isUpperStart3 = (s) => _Option_exists4((n) => and12(n >= 65, n <= 90), _Str_codeAt7(0, s));
var isNullaryCtor = _curry20(2, (name, keys) => _Option_exists4((ks) => length15(ks) === 0, _Map_get8(name, keys)));
var isCtorRef = (fn) => {
  const $match = fn;
  switch ($match._tag) {
    case "ERef": {
      const { name } = $match;
      return isUpperStart3(name);
    }
    default: {
      return false;
    }
  }
};
var suffixOr$ = (name, ann) => _Option_match18(ann, () => name, (t) => `${name}: ${t}`);
var suffixOr = _curry20(2, suffixOr$);
var bareParamAnnots = { generics: "", params: [] };
var paramAnnotsFor = _curry20(3, (h, sp, arity) => _Option_match18(h, () => bareParamAnnots, (f) => f(sp, arity)));
var annotatedParams$ = (cparams, annots, i) => _Option_match18(_Array_get17(i, cparams), () => [], (p) => _Array_prepend8(suffixOr$(genParam(p), _Option_unwrapOr11(None18, _Array_get17(i, annots))), annotatedParams$(cparams, annots, i + 1)));
var annotatedParams = _curry20(3, annotatedParams$);
var castOr$ = (js, ann) => _Option_match18(ann, () => js, (t) => `(${js} as ${t})`);
var castOr = _curry20(2, castOr$);
var bindRuntime = (monad) => monad === "Option" ? "_Option_flatMap" : monad === "Result" ? "_Result_flatMap" : "_Task_andThen";
var allOfFrom2 = _curry20(3, (f, xs, i) => _Option_match18(_Array_get17(i, xs), () => true, (x) => f(x) ? allOfFrom2(f, xs, i + 1) : false));
var allOf2 = _curry20(2, (f, xs) => allOfFrom2(f, xs, 0));
var someOfFrom4 = _curry20(3, (f, xs, i) => _Option_match18(_Array_get17(i, xs), () => false, (x) => f(x) ? true : someOfFrom4(f, xs, i + 1)));
var someOf4 = _curry20(2, (f, xs) => someOfFrom4(f, xs, 0));
var escTemplateLoop$ = (chars, i0, acc0) => {
  let i = i0;
  let acc = acc0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done8(acc) : _v._tag === "Some" && _v.value === "\\" ? _recur8(i + 1, `${acc}\\\\`) : _v._tag === "Some" && _v.value === "`" ? _recur8(i + 1, `${acc}\\\``) : _v._tag === "Some" && _v.value === "$" && _Option_contains3("{", _Array_get17(i + 1, chars)) ? _recur8(i + 2, `${acc}\\\${`) : _v._tag === "Some" ? (({ value: c }) => _recur8(i + 1, `${acc}${c}`))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get17(i, chars));
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
};
var escTemplateLoop = _curry20(3, escTemplateLoop$);
var escapeTemplateLiteral = (s) => escTemplateLoop$(_Str_chars2(s), 0, "");
var keyAt$ = (ctx, ctor, i) => _Option_match18(_Map_get8(ctor, ctx.keys), () => `_${show8(i)}`, (ks) => _Option_unwrapOr11(`_${show8(i)}`, _Array_get17(i, ks)));
var keyAt = _curry20(3, keyAt$);
var nsRuntimeId$ = (ctx, target, name) => {
  const $match = target;
  switch ($match._tag) {
    case "ERef": {
      const { name: refName } = $match;
      return _Option_match18(_Map_get8(refName, ctx.ns), () => None18, (members) => _Map_get8(name, members));
    }
    default: {
      return None18;
    }
  }
};
var nsRuntimeId = _curry20(3, nsRuntimeId$);
var emptyNsEmit$ = (target, name, ann) => {
  const $match = target;
  switch ($match._tag) {
    case "ERef": {
      const { name: refName } = $match;
      return name === "empty" ? refName === "Set" ? Some18(emptyNsCtor$("Set", ann)) : refName === "Map" ? Some18(emptyNsCtor$("Map", ann)) : refName === "List" ? Some18("_list(function* () {})") : None18 : None18;
    }
    default: {
      return None18;
    }
  }
};
var emptyNsEmit = _curry20(3, emptyNsEmit$);
var isLabeledParam3 = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "LPLabeled": {
      return true;
    }
    case "LPSpanned": {
      const { param: inner } = $match;
      return isLabeledParam3(inner);
    }
    default: {
      return false;
    }
  }
};
var splitLamParams$2 = (params, positional, labeled) => ((_v) => _v.length === 0 ? _tuple9(positional, labeled) : _v.length >= 1 ? (([p, ...rest]) => isLabeledParam3(p) ? splitLamParams$2(rest, positional, _Array_append14(p, labeled)) : splitLamParams$2(rest, _Array_append14(p, positional), labeled))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params);
var splitLamParams2 = _curry20(3, splitLamParams$2);
var absorbParams$ = (params, acc, fills, labN) => (([positional, labeled]) => {
  const acc1 = _Array_concat9(acc, positional);
  return ((_v) => _v.length === 0 ? _tuple9(acc1, fills, labN) : ((labVar) => _tuple9(_Array_append14(LPName(labVar, None18), acc1), _Array_append14({ labVar, labs: labeled }, fills), labN + 1))(labN === 0 ? "$lab" : `$lab${show8(labN)}`))(labeled);
})(splitLamParams$2(params, [], []));
var absorbParams = _curry20(4, absorbParams$);
var collapseLambdaFrom$ = (params, body, acc, fills, labN) => (([acc1, fills1, labN1]) => {
  const $match = body;
  switch ($match._tag) {
    case "ELambda": {
      const { params: params2, body: body2 } = $match;
      return collapseLambdaFrom$(params2, body2, acc1, fills1, labN1);
    }
    default: {
      return _tuple9(acc1, body, fills1);
    }
  }
})(absorbParams$(params, acc, fills, labN));
var collapseLambdaFrom = _curry20(5, collapseLambdaFrom$);
var collapseLambda$ = (params, body) => collapseLambdaFrom$(params, body, [], [], 0);
var collapseLambda = _curry20(2, collapseLambda$);
var isPrimLit = (e) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return true;
    }
    case "EStr": {
      return true;
    }
    case "EBool": {
      return true;
    }
    default: {
      return false;
    }
  }
};
var eqTest$ = (ctx, left, right, op) => ((_v) => _v[1]._tag === "ERef" && (([, { name: c }]) => isNullaryCtor(c, ctx.keys))(_v) ? (([, { name: c }]) => Some18(`(${genMember$(ctx, left)}._tag ${op} "${c}")`))(_v) : _v[0]._tag === "ERef" && (([{ name: c }]) => isNullaryCtor(c, ctx.keys))(_v) ? (([{ name: c }]) => Some18(`(${genMember$(ctx, right)}._tag ${op} "${c}")`))(_v) : or11(isPrimLit(left), isPrimLit(right)) ? Some18(`(${genExpr$(ctx, left)} ${op} ${genExpr$(ctx, right)})`) : None18)(_tuple9(left, right));
var eqTest = _curry20(4, eqTest$);
var isUserCall$ = (ctx, fn) => {
  const $match = fn;
  switch ($match._tag) {
    case "ERef": {
      const { name } = $match;
      return _Set_has5(name, ctx.userNames);
    }
    default: {
      return false;
    }
  }
};
var isUserCall = _curry20(2, isUserCall$);
var tsInfix$ = (ctx, fn, args) => or11(!ctx.preserveInfix, isUserCall$(ctx, fn)) ? None18 : ((_v) => _v[0]._tag === "ERef" && _v[0].name === "eq" && _v[1].length === 2 ? (([, [left, right]]) => eqTest$(ctx, left, right, "==="))(_v) : _v[0]._tag === "ERef" && _v[0].name === "not" && _v[1].length === 1 ? (([, [operand]]) => ((_v) => _v._tag === "ECall" && _v.fn._tag === "ERef" && _v.fn.name === "eq" && _v.args.length === 2 && (({ args: [left, right] }) => !_Set_has5("eq", ctx.userNames))(_v) ? (({ args: [left, right] }) => _Option_match18(eqTest$(ctx, left, right, "!=="), () => Some18(`!(${genExpr$(ctx, operand)})`), (test) => Some18(test)))(_v) : Some18(`!(${genExpr$(ctx, operand)})`))(operand))(_v) : _v[0]._tag === "ERef" && _v[1].length === 2 ? (([{ name }, [left, right]]) => ((_v) => _v === "add" ? Some18(`(${genExpr$(ctx, left)} + ${genExpr$(ctx, right)})`) : _v === "sub" ? Some18(`(${genExpr$(ctx, left)} - ${genExpr$(ctx, right)})`) : _v === "mul" ? Some18(`(${genExpr$(ctx, left)} * ${genExpr$(ctx, right)})`) : _v === "div" ? Some18(`(${genExpr$(ctx, left)} / ${genExpr$(ctx, right)})`) : _v === "lt" ? Some18(`(${genExpr$(ctx, left)} < ${genExpr$(ctx, right)})`) : _v === "lte" ? Some18(`(${genExpr$(ctx, left)} <= ${genExpr$(ctx, right)})`) : _v === "gt" ? Some18(`(${genExpr$(ctx, left)} > ${genExpr$(ctx, right)})`) : _v === "gte" ? Some18(`(${genExpr$(ctx, left)} >= ${genExpr$(ctx, right)})`) : None18)(name))(_v) : None18)(_tuple9(fn, args));
var tsInfix = _curry20(3, tsInfix$);
var jsxHasSpread = (children) => ((_v) => _v.length === 0 ? false : _v.length >= 1 && _v[0]._tag === "SESpread" ? true : _v.length >= 1 ? (([, ...rest]) => jsxHasSpread(rest))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(children);
var jsxAttrs$ = (ctx, fields, spread) => {
  const head = _Option_match18(spread, () => "", (value) => ` {...${genExpr$(ctx, value)}}`);
  return `${head}${_Str_join8("", map12((f) => ((_v) => _v._tag === "EBool" && _v.value === true ? ` ${f.name}` : ((value) => ` ${f.name}={${genExpr$(ctx, value)}}`)(_v))(f.value), fields))}`;
};
var jsxAttrs = _curry20(3, jsxAttrs$);
var tsxArgs$ = (ctx, args) => ((_v) => _v.length === 3 && _v[1]._tag === "ERecord" && _v[2]._tag === "EArr" ? (([tag, { fields, spread }, { elements: children }]) => jsxHasSpread(children) ? None18 : ((fragment) => ((name) => ((attrs) => and12(length15(children) === 0, !fragment) ? Some18(`<${name}${attrs} />`) : ((body) => fragment ? Some18(`<>${body}</>`) : Some18(`<${name}${attrs}>${body}</${name}>`))(_Str_join8("", map12((child) => {
  const $match = child;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: value } = $match;
      return `{${genExpr$(ctx, value)}}`;
    }
    case "SESpread": {
      return "";
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
}, children))))(jsxAttrs$(ctx, fields, spread)))(fragment ? "" : ((_v) => _v._tag === "EStr" ? (({ value }) => value)(_v) : genMember$(ctx, tag))(tag)))(((_v) => _v._tag === "EStr" && _v.value === "Fragment" ? true : false)(tag)))(_v) : None18)(args);
var tsxArgs = _curry20(2, tsxArgs$);
var tsxCall$ = (ctx, fn, args, origin) => !ctx.preserveJsx ? None18 : ((_v) => _v._tag === "Some" && _v.value === "jsx" ? ((_v) => _v._tag === "ERef" && _v.name === "h" ? tsxArgs$(ctx, args) : None18)(fn) : None18)(origin);
var tsxCall = _curry20(4, tsxCall$);
var genArrow$ = (ctx, params, body, sp, ret) => (([cparams, cbody, fills]) => {
  const bound = fillNames(fills, paramNameSet$(cparams, 0, _Set_fromArray6([])));
  const annots = paramAnnotsFor(ctx.annotateParams, sp, length15(cparams));
  return _tuple9(`${annots.generics}(${_Str_join8(", ", annotatedParams$(cparams, annots.params, 0))})${ret} => ${genLambdaBodyIn$(ctx, cbody, bound, genFillDecls$(ctx, fills))}`, length15(cparams));
})(collapseLambda$(params, body));
var genArrow = _curry20(5, genArrow$);
var genCalleeFor$ = (ctx, fn, argc) => {
  const $match = fn;
  switch ($match._tag) {
    case "ERef": {
      const { name } = $match;
      return ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" && (([{ value: n }, { value: raw }]) => eq16(n, argc))(_v) ? (([{ value: n }, { value: raw }]) => raw)(_v) : genCallee$(ctx, fn))(_tuple9(_Map_get8(name, ctx.rawArity), _Map_get8(name, ctx.rawNames)));
    }
    default: {
      return genCallee$(ctx, fn);
    }
  }
};
var genCalleeFor = _curry20(3, genCalleeFor$);
var isPipeHole2 = (a) => ((_v) => _v._tag === "ERef" && _v.name === "_" ? true : false)(a);
var hasPipeHole2 = (right) => {
  const $match = right;
  switch ($match._tag) {
    case "ECall": {
      const { args: rargs } = $match;
      return someOf4(isPipeHole2, rargs);
    }
    default: {
      return false;
    }
  }
};
var isPipeAtom2 = (e) => {
  const $match = e;
  switch ($match._tag) {
    case "ERef": {
      return true;
    }
    case "ENum": {
      return true;
    }
    case "EStr": {
      return true;
    }
    case "EBool": {
      return true;
    }
    default: {
      return false;
    }
  }
};
var fillPipeHole$2 = (left, right, sp) => {
  const $match = right;
  switch ($match._tag) {
    case "ECall": {
      const { fn: rfn, args: rargs, origin } = $match;
      const v = isPipeAtom2(left) ? left : ERef("$pipe", sp);
      const call = ECall(rfn, map12((a) => isPipeHole2(a) ? v : a, rargs), origin, sp);
      return isPipeAtom2(left) ? call : ELetIn("$pipe", sp, None18, left, call, sp);
    }
    default: {
      return right;
    }
  }
};
var fillPipeHole2 = _curry20(3, fillPipeHole$2);
var genExpr$ = (ctx, e) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      const { raw } = $match;
      return raw;
    }
    case "EUnit": {
      return "undefined";
    }
    case "EBool": {
      const { value } = $match;
      return value ? "true" : "false";
    }
    case "EStr": {
      const { value } = $match;
      return jsStringLit(value);
    }
    case "ERef": {
      const { name } = $match;
      return castOr$(name, isNullaryCtor(name, ctx.keys) ? hook1(ctx.annotateEmpty, e) : None18);
    }
    case "ECall": {
      const { fn, args, origin } = $match;
      return _Option_match18(tsxCall$(ctx, fn, args, origin), () => _Option_match18(tsInfix$(ctx, fn, args), () => {
        const inner = `${genCalleeFor$(ctx, fn, length15(args))}(${_Str_join8(", ", map12((a) => genExpr$(ctx, a), args))})`;
        return castOr$(inner, isCtorRef(fn) ? hook1(ctx.annotateCall, e) : None18);
      }, (infix) => infix), (jsx) => jsx);
    }
    case "ELambda": {
      const { params, body, span: sp } = $match;
      return (([arrow, arity]) => arity >= 2 ? `_curry(${show8(arity)}, ${arrow})` : arrow)(genArrow$(ctx, params, body, sp, ""));
    }
    case "ELetIn": {
      const { name, value, body } = $match;
      const param = suffixOr$(name, hook1(ctx.annotateLetin, value));
      return `((${param}) => ${genLambdaBody$(ctx, body)})(${genExpr$(ctx, value)})`;
    }
    case "ELetBind": {
      const { param, monad, value, body } = $match;
      const rt = bindRuntime(monad);
      const f = `(${genParam(param)}) => ${genLambdaBody$(ctx, body)}`;
      const v = genExpr$(ctx, value);
      return ctx.flattenPipe ? `${rt}(${f}, ${v})` : `${rt}(${f})(${v})`;
    }
    case "EPipe": {
      const { left, right, fast, span: sp } = $match;
      return hasPipeHole2(right) ? genExpr$(ctx, fillPipeHole$2(left, right, sp)) : fast ? ((_v) => _v._tag === "ECall" ? (({ fn: rfn, args: rargs, origin }) => genExpr$(ctx, ECall(rfn, _Array_prepend8(left, rargs), origin, sp)))(_v) : genExpr$(ctx, ECall(right, [left], None18, sp)))(right) : ((_v) => _v._tag === "ECall" && (({ fn: rfn, args: rargs }) => ctx.flattenPipe)(_v) ? (({ fn: rfn, args: rargs }) => `${genCalleeFor$(ctx, rfn, length15(rargs) + 1)}(${_Str_join8(", ", map12((a) => genExpr$(ctx, a), _Array_append14(left, rargs)))})`)(_v) : `${genCallee$(ctx, right)}(${genExpr$(ctx, left)})`)(right);
    }
    case "EDo": {
      const { exprs } = $match;
      return genDo$(ctx, exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return `(${genExpr$(ctx, cond)} ? ${genExpr$(ctx, thenE)} : ${genExpr$(ctx, elseE)})`;
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return genMatch$(ctx, scrutinee, arms);
    }
    case "ELoop": {
      const { params, body } = $match;
      return `(() => { ${genLoopBlock$(ctx, params, body)} })()`;
    }
    case "ERecur": {
      const { args } = $match;
      return `_recur(${_Str_join8(", ", map12((a) => genExpr$(ctx, a), args))})`;
    }
    case "ERecord": {
      const { fields, spread } = $match;
      const fieldStrs = _Str_join8(", ", map12((f) => `${isJsIdent(f.name) ? f.name : jsStringLit(f.name)}: ${genExpr$(ctx, f.value)}`, fields));
      return _Option_match18(spread, () => length15(fields) === 0 ? "{}" : `{ ${fieldStrs} }`, (s) => {
        const spreadStr = `...${genExpr$(ctx, s)}`;
        return length15(fields) === 0 ? `{ ${spreadStr} }` : `{ ${spreadStr}, ${fieldStrs} }`;
      });
    }
    case "EField": {
      const { target, name, optional } = $match;
      return _Option_match18(emptyNsEmit$(target, name, hook1(ctx.annotateEmpty, e)), () => _Option_match18(nsRuntimeId$(ctx, target, name), () => {
        const member = `${genMember$(ctx, target)}.${name}`;
        return optional ? ((tagType) => `((v) => v != null ? { _tag: "Some"${tagType}, value: v } : { _tag: "None"${tagType} })(${member})`)(_Option_isSome5(ctx.guardBaseType) ? " as const" : "") : member;
      }, (rt) => rt), (js) => js);
    }
    case "ETuple": {
      const { elements } = $match;
      const elems = _Str_join8(", ", map12((el) => genExpr$(ctx, el), elements));
      return ctx.tupleHelper ? `_tuple(${elems})` : `[${elems}]`;
    }
    case "EArr": {
      const { elements } = $match;
      const body = `[${_Str_join8(", ", map12((el) => genSeqSlot$(ctx, el), elements))}]`;
      return castOr$(body, length15(elements) === 0 ? hook1(ctx.annotateEmpty, e) : None18);
    }
    case "EList": {
      const { elements } = $match;
      return genList$(ctx, elements);
    }
    case "ESet": {
      const { elements } = $match;
      return `new Set([${_Str_join8(", ", map12((el) => genSeqSlot$(ctx, el), elements))}])`;
    }
    case "EMap": {
      const { entries } = $match;
      return _Option_match18(length15(entries) === 0 ? hook1(ctx.annotateEmpty, e) : None18, () => `new Map([${_Str_join8(", ", map12((en) => `[${genExpr$(ctx, en.key)}, ${genExpr$(ctx, en.value)}]`, entries))}])`, (t) => `new ${t}()`);
    }
    case "EInterp": {
      const { parts } = $match;
      const body = _Str_join8("", map12((p) => {
        const $match$ = p;
        switch ($match$._tag) {
          case "IPLit": {
            const { value } = $match$;
            return escapeTemplateLiteral(value);
          }
          case "IPExpr": {
            const { expr: ex } = $match$;
            return `\${${genExpr$(ctx, ex)}}`;
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts));
      return `\`${body}\``;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var genExpr = _curry20(2, genExpr$);
var genDo$ = (ctx, exprs) => `(() => { ${genDoSteps$(ctx, exprs)} })()`;
var genDo = _curry20(2, genDo$);
var genDoSteps$ = (ctx, exprs) => ((_v) => _v.length === 1 ? (([last]) => `return ${genExpr$(ctx, last)};`)(_v) : _v.length >= 1 ? (([first, ...rest]) => `${genExpr$(ctx, first)}; ${genDoSteps$(ctx, rest)}`)(_v) : _v.length === 0 ? 'throw new Error("empty do block");' : (() => {
  throw new Error("non-exhaustive match");
})())(exprs);
var genDoSteps = _curry20(2, genDoSteps$);
var genSeqSlot$ = (ctx, el) => {
  const $match = el;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: ex } = $match;
      return genExpr$(ctx, ex);
    }
    case "SESpread": {
      const { expr: ex } = $match;
      return `...${genExpr$(ctx, ex)}`;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var genSeqSlot = _curry20(2, genSeqSlot$);
var genList$ = (ctx, elements) => {
  const yields = _Str_join8(" ", map12((el) => {
    const $match = el;
    switch ($match._tag) {
      case "SEExpr": {
        const { expr: ex } = $match;
        return `yield (${genExpr$(ctx, ex)});`;
      }
      case "SESpread": {
        const { expr: ex } = $match;
        return `yield* (${genExpr$(ctx, ex)});`;
      }
      default: {
        throw new Error("non-exhaustive match");
      }
    }
  }, elements));
  return `_list(function* () {${yields === "" ? "" : ` ${yields} `}})`;
};
var genList = _curry20(2, genList$);
var genParam = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return genParam(inner);
    }
    case "LPName": {
      const { name } = $match;
      return name;
    }
    case "LPTuple": {
      const { names } = $match;
      const slots = _Str_join8(", ", map12((name) => name === "_" ? "" : name, names));
      const tail = ((_v) => _v._tag === "Some" && _v.value === "_" ? "," : "")(_Array_get17(length15(names) - 1, names));
      return `[${slots}${tail}]`;
    }
    case "LPRecord": {
      const { fields } = $match;
      return `{ ${_Str_join8(", ", fields)} }`;
    }
    case "LPLabeled": {
      const { name } = $match;
      return name;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var genCallee$ = (ctx, e) => {
  const $match = e;
  switch ($match._tag) {
    case "ELambda": {
      return `(${genExpr$(ctx, e)})`;
    }
    default: {
      return genExpr$(ctx, e);
    }
  }
};
var genCallee = _curry20(2, genCallee$);
var genMember$ = (ctx, e) => {
  const $match = e;
  switch ($match._tag) {
    case "ERecord": {
      return `(${genExpr$(ctx, e)})`;
    }
    case "ELambda": {
      return `(${genExpr$(ctx, e)})`;
    }
    default: {
      return genExpr$(ctx, e);
    }
  }
};
var genMember = _curry20(2, genMember$);
var seqElemExpr3 = (el) => {
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
var hasRecur = (e) => {
  const $match = e;
  switch ($match._tag) {
    case "ERecur": {
      return true;
    }
    case "ELoop": {
      return false;
    }
    case "ELambda": {
      return false;
    }
    case "ELetBind": {
      return false;
    }
    case "EInterp": {
      const { parts } = $match;
      return someOf4((p) => {
        const $match$ = p;
        switch ($match$._tag) {
          case "IPExpr": {
            const { expr: x } = $match$;
            return hasRecur(x);
          }
          case "IPLit": {
            return false;
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    case "ECall": {
      const { fn, args } = $match;
      return or11(hasRecur(fn), someOf4(hasRecur, args));
    }
    case "ELetIn": {
      const { value, body } = $match;
      return or11(hasRecur(value), hasRecur(body));
    }
    case "EPipe": {
      const { left, right } = $match;
      return or11(hasRecur(left), hasRecur(right));
    }
    case "EDo": {
      const { exprs } = $match;
      return someOf4(hasRecur, exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return or11(hasRecur(cond), or11(hasRecur(thenE), hasRecur(elseE)));
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return or11(hasRecur(scrutinee), someOf4((a) => or11(_Option_match18(a.guard, () => false, (g) => hasRecur(g)), hasRecur(a.body)), arms));
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return or11(_Option_match18(spread, () => false, (sp) => hasRecur(sp)), someOf4((f) => hasRecur(f.value), fields));
    }
    case "EField": {
      const { target } = $match;
      return hasRecur(target);
    }
    case "ETuple": {
      const { elements } = $match;
      return someOf4(hasRecur, elements);
    }
    case "EArr": {
      const { elements } = $match;
      return someOf4((el) => hasRecur(seqElemExpr3(el)), elements);
    }
    case "EList": {
      const { elements } = $match;
      return someOf4((el) => hasRecur(seqElemExpr3(el)), elements);
    }
    case "ESet": {
      const { elements } = $match;
      return someOf4((el) => hasRecur(seqElemExpr3(el)), elements);
    }
    case "EMap": {
      const { entries } = $match;
      return someOf4((en) => or11(hasRecur(en.key), hasRecur(en.value)), entries);
    }
    default: {
      return false;
    }
  }
};
var loopNeedsStep = _curry20(3, (ctx, e, params) => {
  const $match = e;
  switch ($match._tag) {
    case "ETernary": {
      const { thenE, elseE } = $match;
      return or11(loopNeedsStep(ctx, thenE, params), loopNeedsStep(ctx, elseE, params));
    }
    case "ELetIn": {
      const { body } = $match;
      return loopNeedsStep(ctx, body, params);
    }
    case "EDo": {
      const { exprs } = $match;
      return loopNeedsStep(ctx, lastDoExpr(exprs), params);
    }
    case "EMatch": {
      const { arms } = $match;
      return and12(hasRecur(e), or11(!canStatementMatch(arms, params), someOf4((a) => loopNeedsStep(ctx, a.body, params), arms)));
    }
    default: {
      return false;
    }
  }
});
var loopBindingSafe = _curry20(2, (name, params) => !someOf4((p) => eq16(p.name, name), params));
var loopPayloadSafe = _curry20(2, (pattern, params) => {
  const $match = pattern;
  switch ($match._tag) {
    case "PBind": {
      const { name } = $match;
      return loopBindingSafe(name, params);
    }
    case "PWild": {
      return true;
    }
    default: {
      return false;
    }
  }
});
var loopPatternSafe = _curry20(2, (pattern, params) => {
  const $match = pattern;
  switch ($match._tag) {
    case "PCtor": {
      const { args } = $match;
      return allOf2((p) => loopPayloadSafe(p, params), args);
    }
    case "PBind": {
      const { name } = $match;
      return loopBindingSafe(name, params);
    }
    case "PWild": {
      return true;
    }
    case "PBool": {
      return true;
    }
    case "PLit": {
      return true;
    }
    case "PStr": {
      return true;
    }
    case "PUnit": {
      return true;
    }
    default: {
      return false;
    }
  }
});
var canStatementMatch = _curry20(2, (arms, params) => allOf2((a) => and12(_Option_isNone2(a.guard), loopPatternSafe(a.pattern, params)), arms));
var genLoopMatchArms$ = (ctx, arms, i, root, params) => _Option_match18(_Array_get17(i, arms), () => 'throw new Error("non-exhaustive match");', (a) => {
  const slot = patSlot(ctx.keys, a.pattern);
  const bind = slot === "" ? "" : `const ${slot} = ${root}; `;
  const body = `{ ${bind}${genLoopTail$(ctx, a.body, params)} }`;
  return isCatchAll2(a.pattern) ? body : ((conds) => `if (${_Str_join8(" && ", conds)}) ${body} ${genLoopMatchArms$(ctx, arms, i + 1, root, params)}`)(patConds(ctx.keys, a.pattern, root));
});
var genLoopMatchArms = _curry20(5, genLoopMatchArms$);
var genLoopMatch$ = (ctx, scrutinee, arms, params) => _Option_match18(genOptionalLoopMatch$(ctx, scrutinee, arms, params), () => {
  const root = tempName$(ctx, "$loopMatch");
  return `{ const ${root} = ${genExpr$(ctx, scrutinee)}; ${genLoopMatchArms$(ctx, arms, 0, root, params)} }`;
}, (fused) => fused);
var genLoopMatch = _curry20(4, genLoopMatch$);
var genOptionalLoopMatch$ = (ctx, scrutinee, arms, params) => ((_v) => _v._tag === "EField" && _v.optional === true ? (({ target, name }) => ((_v) => _v[0]._tag === "Some" && _v[0].value.length === 1 && _v[0].value[0] === "value" && _v[1]._tag === "Some" && _v[1].value.length === 0 ? _Option_match18(optionalMatch(arms), () => None18, (plan) => {
  const value = tempName$(ctx, "$optional");
  const bind = plan.binding === "" ? "" : `const ${plan.binding} = ${value}; `;
  return Some18(`{ const ${value} = ${genMember$(ctx, target)}.${name}; if (${value} != null) { ${bind}${genLoopTail$(ctx, plan.present, params)} } else { ${genLoopTail$(ctx, plan.absent, params)} } }`);
}) : None18)(_tuple9(_Map_get8("Some", ctx.keys), _Map_get8("None", ctx.keys))))(_v) : None18)(scrutinee);
var genOptionalLoopMatch = _curry20(4, genOptionalLoopMatch$);
var alwaysRecur = (e) => {
  const $match = e;
  switch ($match._tag) {
    case "ERecur": {
      return true;
    }
    case "ETernary": {
      const { thenE: a, elseE: b } = $match;
      return and12(alwaysRecur(a), alwaysRecur(b));
    }
    case "ELetIn": {
      const { body } = $match;
      return alwaysRecur(body);
    }
    case "EDo": {
      const { exprs } = $match;
      return alwaysRecur(lastDoExpr(exprs));
    }
    case "EMatch": {
      const { arms } = $match;
      return and12(length15(arms) > 0, allOf2((a) => alwaysRecur(a.body), arms));
    }
    default: {
      return false;
    }
  }
};
var lastDoExpr = (exprs) => ((_v) => _v.length === 1 ? (([last]) => last)(_v) : _v.length >= 1 ? (([, ...rest]) => lastDoExpr(rest))(_v) : _v.length === 0 ? EUnit({ start: 0, end: 0 }) : (() => {
  throw new Error("non-exhaustive match");
})())(exprs);
var wrapStepTails$ = (e, sp) => {
  const $match = e;
  switch ($match._tag) {
    case "ERecur": {
      return e;
    }
    case "ETernary": {
      const { cond, thenE, elseE, span: tsp } = $match;
      return ETernary(cond, wrapStepTails$(thenE, sp), wrapStepTails$(elseE, sp), tsp);
    }
    case "ELetIn": {
      const { name, nameSpan, annot, value, body, span: lsp } = $match;
      return ELetIn(name, nameSpan, annot, value, wrapStepTails$(body, sp), lsp);
    }
    case "EDo": {
      const { exprs, span: dsp } = $match;
      return EDo(wrapDoStepTail$(exprs, sp), dsp);
    }
    case "EMatch": {
      const { scrutinee, arms, span: msp } = $match;
      return EMatch(scrutinee, map12((a) => ({ pattern: a.pattern, guard: a.guard, body: wrapStepTails$(a.body, sp) }), arms), msp);
    }
    default: {
      return ECall(ERef("_done", sp), [e], None18, sp);
    }
  }
};
var wrapStepTails = _curry20(2, wrapStepTails$);
var wrapDoStepTail$ = (exprs, sp) => ((_v) => _v.length === 1 ? (([last]) => [wrapStepTails$(last, sp)])(_v) : _v.length >= 1 ? (([first, ...rest]) => [first, ...wrapDoStepTail$(rest, sp)])(_v) : _v.length === 0 ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(exprs);
var wrapDoStepTail = _curry20(2, wrapDoStepTail$);
var loopParamNames = (params) => _Str_join8(", ", map12((p) => p.name, params));
var tempName$ = (ctx, name) => or11(_Set_has5(name, ctx.userNames), _Set_has5(name, ctx.valueRefs)) ? tempName$(ctx, `${name}$`) : name;
var tempName = _curry20(2, tempName$);
var genRecurTemps$ = (ctx, args, params, i) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" ? (([{ value: a }, { value: p }]) => ((name) => `const ${suffixOr$(name, hook1(ctx.annotateLetin, p.init))} = ${genExpr$(ctx, a)}; ${genRecurTemps$(ctx, args, params, i + 1)}`)(tempName$(ctx, `$recur${show8(i)}`)))(_v) : "")(_tuple9(_Array_get17(i, args), _Array_get17(i, params)));
var genRecurTemps = _curry20(4, genRecurTemps$);
var genRecurAssignments = _curry20(3, (ctx, params, i) => _Option_match18(_Array_get17(i, params), () => "", (p) => `${p.name} = ${tempName$(ctx, `$recur${show8(i)}`)}; ${genRecurAssignments(ctx, params, i + 1)}`));
var genLoopTail$ = (ctx, e, params) => {
  const $match = e;
  switch ($match._tag) {
    case "ERecur": {
      const { args } = $match;
      return ((_v) => _v[0].length === 1 && _v[1].length === 1 ? (([[p], [a]]) => `${p.name} = ${genExpr$(ctx, a)}; continue;`)(_v) : `{ ${genRecurTemps$(ctx, args, params, 0)}${genRecurAssignments(ctx, params, 0)}continue; }`)(_tuple9(params, args));
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return hasRecur(e) ? `if (${genExpr$(ctx, cond)}) { ${genLoopTail$(ctx, thenE, params)} } else { ${genLoopTail$(ctx, elseE, params)} }` : `return ${genExpr$(ctx, e)};`;
    }
    case "ELetIn": {
      const { name, value, body } = $match;
      return hasRecur(e) ? `{ const ${suffixOr$(name, hook1(ctx.annotateLetin, value))} = ${genExpr$(ctx, value)}; ${genLoopTail$(ctx, body, params)} }` : `return ${genExpr$(ctx, e)};`;
    }
    case "EDo": {
      const { exprs } = $match;
      return hasRecur(e) ? `{ ${genDoLoopTail$(ctx, exprs, params)} }` : `return ${genExpr$(ctx, e)};`;
    }
    case "EMatch": {
      const { scrutinee, arms, span: sp } = $match;
      return hasRecur(e) ? canStatementMatch(arms, params) ? genLoopMatch$(ctx, scrutinee, arms, params) : ((step) => ((rebind) => alwaysRecur(e) ? `const _step = ${step}; ${rebind} continue;` : `const _step = ${step}; if (_step._tag === ${jsStringLit("recur")}) { ${rebind} continue; } return _step.value;`)(((_v) => _v.length === 1 ? (([p]) => `${p.name} = _step.args[0];`)(_v) : `[${loopParamNames(params)}] = _step.args;`)(params)))(genExpr$(ctx, wrapStepTails$(e, sp))) : `return ${genExpr$(ctx, e)};`;
    }
    default: {
      return `return ${genExpr$(ctx, e)};`;
    }
  }
};
var genLoopTail = _curry20(3, genLoopTail$);
var genDoLoopTail$ = (ctx, exprs, params) => ((_v) => _v.length === 1 ? (([last]) => genLoopTail$(ctx, last, params))(_v) : _v.length >= 1 ? (([first, ...rest]) => `${genExpr$(ctx, first)}; ${genDoLoopTail$(ctx, rest, params)}`)(_v) : _v.length === 0 ? "return undefined;" : (() => {
  throw new Error("non-exhaustive match");
})())(exprs);
var genDoLoopTail = _curry20(3, genDoLoopTail$);
var genLoopBlock$ = (ctx, params, body) => {
  const decls = _Str_join8(" ", map12((p) => `let ${suffixOr$(p.name, hook1(ctx.annotateLetin, p.init))} = ${genExpr$(ctx, p.init)};`, params));
  return `${decls} while (true) { ${genLoopTail$(ctx, body, params)} }`;
};
var genLoopBlock = _curry20(3, genLoopBlock$);
var loopParamFree = _curry20(3, (params, i, seen) => _Option_match18(_Array_get17(i, params), () => true, (p) => _Set_has5(p.name, seen) ? false : loopParamFree(params, i + 1, seen)));
var genLambdaBody$ = (ctx, e) => {
  const $match = e;
  switch ($match._tag) {
    case "ERecord": {
      return `(${genExpr$(ctx, e)})`;
    }
    default: {
      return genExpr$(ctx, e);
    }
  }
};
var genLambdaBody = _curry20(2, genLambdaBody$);
var paramNames = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return paramNames(inner);
    }
    case "LPName": {
      const { name } = $match;
      return [name];
    }
    case "LPTuple": {
      const { names } = $match;
      return names;
    }
    case "LPRecord": {
      const { fields } = $match;
      return fields;
    }
    case "LPLabeled": {
      const { name } = $match;
      return [name];
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var genLabeledFill$ = (ctx, labVar, lab) => {
  const $match = lab;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return genLabeledFill$(ctx, labVar, inner);
    }
    case "LPLabeled": {
      const { name, optional, defaultValue } = $match;
      const access = `(${labVar} ?? {}).${name}`;
      return _Option_match18(defaultValue, () => optional ? `const ${name} = ${access} != null ? { _tag: "Some", value: ${access} } : { _tag: "None" };` : `const ${name} = ${access};`, (d) => `const ${name} = ${access} != null ? ${access} : ${genExpr$(ctx, d)};`);
    }
    default: {
      return "";
    }
  }
};
var genLabeledFill = _curry20(3, genLabeledFill$);
var genFillDecls$ = (ctx, fills) => ((_v) => _v.length === 0 ? "" : `${_Str_join8(" ", map12((g) => _Str_join8(" ", map12((lab) => genLabeledFill$(ctx, g.labVar, lab), g.labs)), fills))} `)(fills);
var genFillDecls = _curry20(2, genFillDecls$);
var fillNames = _curry20(2, (fills, acc) => match9(fills).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([g, ...rest]) => fillNames(rest, reduce5(_curry20(2, (s, lab) => {
  const $match = lab;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      const $match$ = inner;
      switch ($match$._tag) {
        case "LPLabeled": {
          const { name } = $match$;
          return _Set_add6(name, s);
        }
        default: {
          return s;
        }
      }
    }
    case "LPLabeled": {
      const { name } = $match;
      return _Set_add6(name, s);
    }
    default: {
      return s;
    }
  }
}), acc, g.labs))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var addNames = _curry20(3, (names, i, acc) => _Option_match18(_Array_get17(i, names), () => acc, (n) => addNames(names, i + 1, _Set_add6(n, acc))));
var paramNameSet$ = (params, i, acc) => _Option_match18(_Array_get17(i, params), () => acc, (p) => paramNameSet$(params, i + 1, addNames(paramNames(p), 0, acc)));
var paramNameSet = _curry20(3, paramNameSet$);
var letBlockLoop$ = (ctx, e, seen, decls) => {
  const $match = e;
  switch ($match._tag) {
    case "ELetIn": {
      const { name, value, body } = $match;
      return or11(_Set_has5(name, seen), ((_v) => _v._tag === "ELambda" ? false : _Set_has5(name, exprRefs$(ctx, value, _Set_fromArray6([]))))(value)) ? _tuple9(decls, e, seen) : letBlockLoop$(ctx, body, _Set_add6(name, seen), _Array_append14(`const ${suffixOr$(name, hook1(ctx.annotateLetin, value))} = ${genExpr$(ctx, value)};`, decls));
    }
    default: {
      return _tuple9(decls, e, seen);
    }
  }
};
var letBlockLoop = _curry20(4, letBlockLoop$);
var genLambdaBodyIn$ = (ctx, e, bound, prefix) => (([decls, rest, seen]) => length15(decls) === 0 ? ((_v) => _v._tag === "ELoop" ? (({ params, body }) => loopParamFree(params, 0, bound) ? `{ ${prefix}${genLoopBlock$(ctx, params, body)} }` : prefix === "" ? genLambdaBody$(ctx, e) : `{ ${prefix}return ${genLambdaBody$(ctx, e)}; }`)(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => canFunctionMatch$(ctx, scrutinee, arms) ? `{ ${prefix}${genFunctionMatch$(ctx, scrutinee, arms)} }` : prefix === "" ? genLambdaBody$(ctx, e) : `{ ${prefix}return ${genLambdaBody$(ctx, e)}; }`)(_v) : prefix === "" ? genLambdaBody$(ctx, e) : `{ ${prefix}return ${genLambdaBody$(ctx, e)}; }`)(e) : ((block) => ((_v) => _v._tag === "ELoop" ? (({ params, body }) => loopParamFree(params, 0, seen) ? `{ ${prefix}${block} ${genLoopBlock$(ctx, params, body)} }` : `{ ${prefix}${block} return ${genExpr$(ctx, rest)}; }`)(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => canFunctionMatch$(ctx, scrutinee, arms) ? `{ ${prefix}${block} ${genFunctionMatch$(ctx, scrutinee, arms)} }` : `{ ${prefix}${block} return ${genExpr$(ctx, rest)}; }`)(_v) : `{ ${prefix}${block} return ${genExpr$(ctx, rest)}; }`)(rest))(_Str_join8(" ", decls)))(letBlockLoop$(ctx, e, bound, []));
var genLambdaBodyIn = _curry20(4, genLambdaBodyIn$);
var functionMatchArms = _curry20(2, (arms, tags) => match9(arms).with((_v) => _v.length === 0, () => _Set_size3(tags) > 0).with((_v) => _v.length >= 1, ([a, ...rest]) => and12(_Option_isNone2(a.guard), ((_v) => _v._tag === "PCtor" ? (({ ctor: name, args }) => and12(and12(!_Set_has5(name, tags), allOf2((p) => {
  const $match = p;
  switch ($match._tag) {
    case "PBind": {
      return true;
    }
    case "PWild": {
      return true;
    }
    default: {
      return false;
    }
  }
}, args)), functionMatchArms(rest, _Set_add6(name, tags))))(_v) : _v._tag === "PBind" ? and12(length15(rest) === 0, _Set_size3(tags) > 0) : _v._tag === "PWild" ? and12(length15(rest) === 0, _Set_size3(tags) > 0) : false)(a.pattern))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var canFunctionMatch$ = (ctx, scrutinee, arms) => and12(_Option_isNone2(builtinMatchPlan(ctx, scrutinee, arms)), ((_v) => _v._tag === "EField" && _v.optional === true ? false : functionMatchArms(arms, _Set_fromArray6([])))(scrutinee));
var canFunctionMatch = _curry20(3, canFunctionMatch$);
var functionPatternNames = (pattern) => {
  const $match = pattern;
  switch ($match._tag) {
    case "PCtor": {
      const { args } = $match;
      return _Array_flatMap6((p) => {
        const $match$ = p;
        switch ($match$._tag) {
          case "PBind": {
            const { name } = $match$;
            return [name];
          }
          default: {
            return [];
          }
        }
      }, args);
    }
    case "PBind": {
      const { name } = $match;
      return [name];
    }
    default: {
      return [];
    }
  }
};
var genFunctionTail$ = (ctx, e, bound) => (([decls, rest, seen]) => {
  const prefix = _Str_join8(" ", decls);
  const $match = rest;
  switch ($match._tag) {
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return canFunctionMatch$(ctx, scrutinee, arms) ? `${prefix} ${genFunctionMatch$(ctx, scrutinee, arms)}` : `${prefix} return ${genExpr$(ctx, rest)};`;
    }
    case "ELoop": {
      const { params, body } = $match;
      return loopParamFree(params, 0, seen) ? `${prefix} ${genLoopBlock$(ctx, params, body)}` : `${prefix} return ${genExpr$(ctx, rest)};`;
    }
    default: {
      return `${prefix} return ${genExpr$(ctx, rest)};`;
    }
  }
})(letBlockLoop$(ctx, e, bound, []));
var genFunctionTail = _curry20(3, genFunctionTail$);
var genFunctionCases$ = (ctx, arms, root) => _Str_join8(" ", map12((a) => {
  const label = ((_v) => _v._tag === "PCtor" ? (({ ctor: name }) => `case ${jsStringLit(name)}:`)(_v) : "default:")(a.pattern);
  const slot = patSlot(ctx.keys, a.pattern);
  const bind = slot === "" ? "" : `const ${slot} = ${root}; `;
  const bound = _Set_fromArray6(functionPatternNames(a.pattern));
  return `${label} { ${bind}${genFunctionTail$(ctx, a.body, bound)} }`;
}, arms));
var genFunctionCases = _curry20(3, genFunctionCases$);
var genFunctionMatch$ = (ctx, scrutinee, arms) => {
  const root = tempName$(ctx, "$match");
  const nestedCtx = { ...ctx, userNames: _Set_add6(root, ctx.userNames) };
  const fallback = someOf4((a) => isCatchAll2(a.pattern), arms) ? "" : 'default: { throw new Error("non-exhaustive match"); }';
  return `const ${root} = ${genExpr$(ctx, scrutinee)}; switch (${root}._tag) { ${genFunctionCases$(nestedCtx, arms, root)} ${fallback} }`;
};
var genFunctionMatch = _curry20(3, genFunctionMatch$);
var isCatchAll2 = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return isCatchAll2(pat);
    }
    case "PWild": {
      return true;
    }
    case "PUnit": {
      return true;
    }
    case "PBind": {
      return true;
    }
    case "PRecord": {
      const { fields } = $match;
      return allOf2((f) => isCatchAll2(f.pat), fields);
    }
    case "PTuple": {
      const { elems } = $match;
      return allOf2(isCatchAll2, elems);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return and12(length15(elems) === 0, _Option_isSome5(rest));
    }
    case "PList": {
      const { elems, rest } = $match;
      return and12(length15(elems) === 0, _Option_isSome5(rest));
    }
    default: {
      return false;
    }
  }
};
var isPList2 = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PList": {
      return true;
    }
    default: {
      return false;
    }
  }
};
var catchAllParam$ = (ctx, p) => {
  const $match = p;
  switch ($match._tag) {
    case "PArr": {
      const { rest } = $match;
      return ((_v) => _v._tag === "Some" && _v.value._tag === "PBind" ? (({ value: { name } }) => `(${name})`)(_v) : "()")(rest);
    }
    case "PList": {
      const { rest } = $match;
      return ((_v) => _v._tag === "Some" && _v.value._tag === "PBind" ? (({ value: { name } }) => `(${name})`)(_v) : "()")(rest);
    }
    default: {
      const slot = patSlot(ctx.keys, p);
      return slot === "" ? "()" : `(${slot})`;
    }
  }
};
var catchAllParam = _curry20(2, catchAllParam$);
var isListMatch = (arms) => someOf4((a) => and12(isPList2(a.pattern), !isCatchAll2(a.pattern)), arms);
var listTail = (from) => concat(concat(concat("_list(function* () { for (let _i = ", show8(from)), "; _i < _b.length; _i++) yield _b[_i]; "), "if (!_done) { let _s; while (!(_s = _it.next()).done) yield _s.value; } })");
var listArmGuards$ = (ctx, elems, i) => _Option_match18(_Array_get17(i, elems), () => [], (el) => _Array_concat9(patConds(ctx.keys, el, `_b[${show8(i)}]`), listArmGuards$(ctx, elems, i + 1)));
var listArmGuards = _curry20(3, listArmGuards$);
var listArmBinds$ = (ctx, elems, i) => _Option_match18(_Array_get17(i, elems), () => _tuple9([], []), (el) => (([restParams, restArgs]) => {
  const slot = patSlot(ctx.keys, el);
  return slot === "" ? _tuple9(restParams, restArgs) : _tuple9(_Array_prepend8(slot, restParams), _Array_prepend8(`_b[${show8(i)}]`, restArgs));
})(listArmBinds$(ctx, elems, i + 1)));
var listArmBinds = _curry20(3, listArmBinds$);
var genListArm$ = (ctx, p, body) => {
  const $match = p;
  switch ($match._tag) {
    case "PList": {
      const { elems, rest } = $match;
      const n = length15(elems);
      const guards = listArmGuards$(ctx, elems, 0);
      const head = _Option_isSome5(rest) ? `_pull(${show8(n)})` : `!_pull(${show8(n + 1)}) && _b.length === ${show8(n)}`;
      const cond = _Str_join8(" && ", _Array_prepend8(head, guards));
      return (([params0, args0]) => (([params, args]) => `  if (${cond}) return ((${_Str_join8(", ", params)}) => ${genLambdaBody$(ctx, body)})(${_Str_join8(", ", args)});`)(((_v) => _v._tag === "Some" && _v.value._tag === "PBind" ? (({ value: { name } }) => _tuple9(_Array_append14(name, params0), _Array_append14(listTail(n), args0)))(_v) : _tuple9(params0, args0))(rest)))(listArmBinds$(ctx, elems, 0));
    }
    default: {
      return "";
    }
  }
};
var genListArm = _curry20(3, genListArm$);
var listMatchLoop$ = (ctx, arms, i) => _Option_match18(_Array_get17(i, arms), () => _tuple9([], '(() => { throw new Error("non-exhaustive lazy-list switch"); })()'), (a) => and12(isPList2(a.pattern), !isCatchAll2(a.pattern)) ? (([restLines, fallback]) => _tuple9(_Array_prepend8(genListArm$(ctx, a.pattern, a.body), restLines), fallback))(listMatchLoop$(ctx, arms, i + 1)) : isCatchAll2(a.pattern) ? ((restName) => ((fallback) => _tuple9([], fallback))(_Option_match18(restName, () => genExpr$(ctx, a.body), (name) => `((${name}) => ${genLambdaBody$(ctx, a.body)})(${listTail(0)})`)))(((_v) => _v._tag === "PList" && _v.rest._tag === "Some" && _v.rest.value._tag === "PBind" ? (({ rest: { value: { name } } }) => Some18(name))(_v) : None18)(a.pattern)) : listMatchLoop$(ctx, arms, i + 1));
var listMatchLoop = _curry20(3, listMatchLoop$);
var genListMatch$ = (ctx, scrutinee, arms) => (([armLines, fallback]) => concat(concat(concat(concat(concat(concat(concat(concat("((_it) => { const _b = []; let _done = false; ", "const _pull = (_n) => { while (_b.length < _n && !_done) { const _s = _it.next(); "), `if (_s.done) _done = true; else _b.push(_s.value); } return _b.length >= _n; };
`), _Str_join8(`
`, armLines)), `
  return `), fallback), `;
})(`), genExpr$(ctx, scrutinee)), "[Symbol.iterator]())"))(listMatchLoop$(ctx, arms, 0));
var genListMatch = _curry20(3, genListMatch$);
var matchArmsLoop$ = (ctx, arms, i, base) => _Option_match18(_Array_get17(i, arms), () => _tuple9([], None18), (a) => (([restLines, restCatch]) => _Option_match18(a.guard, () => isCatchAll2(a.pattern) ? _tuple9(restLines, Some18(_tuple9(a.pattern, a.body))) : _tuple9(_Array_prepend8(`  ${genWithArm$(ctx, a.pattern, a.body, base)}`, restLines), restCatch), (g) => _tuple9(_Array_prepend8(`  ${genGuardArm$(ctx, a.pattern, a.body, Some18(g), base)}`, restLines), restCatch)))(matchArmsLoop$(ctx, arms, i + 1, base)));
var matchArmsLoop = _curry20(4, matchArmsLoop$);
var hasArrArm = (arms) => someOf4((a) => {
  const $match = a.pattern;
  switch ($match._tag) {
    case "PArr": {
      return true;
    }
    default: {
      return false;
    }
  }
}, arms);
var isShallowArm$ = (ctx, p) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat } = $match;
      return isShallowPat(pat);
    }
    default: {
      return or11(isShallowPat(p), patSlot(ctx.keys, p) === "");
    }
  }
};
var isShallowArm = _curry20(2, isShallowArm$);
var isShallowPat = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PCtor": {
      const { args } = $match;
      return allOf2(isFlatSub, args);
    }
    case "PRecord": {
      const { fields } = $match;
      return allOf2((f) => isFlatSub(f.pat), fields);
    }
    case "PLit": {
      return true;
    }
    case "PBool": {
      return true;
    }
    case "PStr": {
      return true;
    }
    default: {
      return isCatchAll2(p);
    }
  }
};
var armView$ = (ctx, p, base) => ((_v) => _v._tag === "Some" && (({ value: b }) => !isShallowArm$(ctx, p))(_v) ? (({ value: b }) => ((target) => eq16(target, b) ? "_v" : `(_v as ${target})`)(patTarget(ctx.keys, p, b)))(_v) : "_v")(base);
var armView = _curry20(3, armView$);
var underBinds$ = (ctx, p, view, body) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      const { pat, name } = $match;
      const slot = patSlot(ctx.keys, pat);
      return slot === "" ? `((${name}) => ${body})(${view})` : `((${name}) => ((${slot}) => ${body})(${name}))(${view})`;
    }
    default: {
      const slot = patSlot(ctx.keys, p);
      return slot === "" ? body : `((${slot}) => ${body})(${view})`;
    }
  }
};
var underBinds = _curry20(4, underBinds$);
var ternArmTest$ = (ctx, p, guardOpt, base) => {
  const conds = patConds(ctx.keys, p, "_v");
  const all = _Option_match18(guardOpt, () => conds, (g) => _Array_append14(underBinds$(ctx, p, armView$(ctx, p, base), `(${genExpr$(ctx, g)})`), conds));
  return length15(all) === 0 ? "true" : _Str_join8(" && ", all);
};
var ternArmTest = _curry20(4, ternArmTest$);
var ternArms$ = (ctx, arms, i, base) => _Option_match18(_Array_get17(i, arms), () => '(() => { throw new Error("non-exhaustive match"); })()', (a) => {
  const body = `(${genLambdaBody$(ctx, a.body)})`;
  return and12(_Option_isNone2(a.guard), isCatchAll2(a.pattern)) ? ((_v) => _v === "()" ? body : ((param) => `(${param} => ${body})(_v)`)(_v))(catchAllParam$(ctx, a.pattern)) : `${ternArmTest$(ctx, a.pattern, a.guard, base)}
    ? ${underBinds$(ctx, a.pattern, armView$(ctx, a.pattern, base), body)}
    : ${ternArms$(ctx, arms, i + 1, base)}`;
});
var ternArms = _curry20(4, ternArms$);
var ternaryTypes = _curry20(3, (ctx, arms, base) => or11(or11(_Option_isNone2(ctx.guardBaseType), _Option_isSome5(base)), allOf2((a) => isShallowArm$(ctx, a.pattern), arms)));
var isOptionalNone = (pattern) => ((_v) => _v._tag === "PCtor" && _v.ctor === "None" ? (({ args, ns }) => and12(length15(args) === 0, _Option_isNone2(ns)))(_v) : false)(pattern);
var optionalMatchPair = _curry20(2, (present, absent) => or11(or11(_Option_isSome5(present.guard), _Option_isSome5(absent.guard)), !isOptionalNone(absent.pattern)) ? None18 : ((_v) => _v._tag === "PCtor" && _v.ctor === "Some" ? (({ args, ns }) => and12(length15(args) === 1, _Option_isNone2(ns)) ? ((_v) => _v._tag === "Some" && _v.value._tag === "PBind" ? (({ value: { name } }) => Some18({ binding: name, present: present.body, absent: absent.body }))(_v) : _v._tag === "Some" && _v.value._tag === "PWild" ? Some18({ binding: "", present: present.body, absent: absent.body }) : None18)(_Array_get17(0, args)) : None18)(_v) : None18)(present.pattern));
var optionalMatch = (arms) => match9(arms).with((_v) => _v.length === 2, ([a, b]) => _Option_match18(optionalMatchPair(a, b), () => optionalMatchPair(b, a), (plan) => Some18(plan))).otherwise(() => None18);
var genOptionalMatch$ = (ctx, scrutinee, arms) => ((_v) => _v._tag === "EField" && _v.optional === true ? (({ target, name }) => ((_v) => _v[0]._tag === "Some" && _v[0].value.length === 1 && _v[0].value[0] === "value" && _v[1]._tag === "Some" && _v[1].value.length === 0 ? _Option_match18(optionalMatch(arms), () => None18, (plan) => Some18(genOptionalBranches$(ctx, target, name, plan))) : None18)(_tuple9(_Map_get8("Some", ctx.keys), _Map_get8("None", ctx.keys))))(_v) : None18)(scrutinee);
var genOptionalMatch = _curry20(3, genOptionalMatch$);
var genOptionalBranches$ = (ctx, target, name, plan) => {
  const value = tempName$(ctx, "$optional");
  const bind = plan.binding === "" ? "" : `const ${plan.binding} = ${value}; `;
  return `((${value}) => { if (${value} != null) { ${bind}return ${genExpr$(ctx, plan.present)}; } return ${genExpr$(ctx, plan.absent)}; })(${genMember$(ctx, target)}.${name})`;
};
var genOptionalBranches = _curry20(4, genOptionalBranches$);
var genMatch$ = (ctx, scrutinee, arms) => _Option_match18(genOptionalMatch$(ctx, scrutinee, arms), () => genOrdinaryMatch$(ctx, scrutinee, arms), (fused) => fused);
var genMatch = _curry20(3, genMatch$);
var genOrdinaryMatch$ = (ctx, scrutinee, arms) => _Option_match18(builtinMatchPlan(ctx, scrutinee, arms), () => isListMatch(arms) ? genListMatch$(ctx, scrutinee, arms) : ((base) => ternaryTypes(ctx, arms, base) ? `((_v) => ${ternArms$(ctx, arms, 0, base)})(${genExpr$(ctx, scrutinee)})` : genMatchChain$(ctx, scrutinee, arms, base))(hook1(ctx.guardBaseType, scrutinee)), (plan) => genBuiltinMatch$(ctx, scrutinee, plan));
var genOrdinaryMatch = _curry20(3, genOrdinaryMatch$);
var builtinPayload$ = (pattern, ctor, arity) => ((_v) => _v._tag === "PCtor" && _v.ns._tag === "None" && (({ ctor: name, args }) => eq16(name, ctor))(_v) ? (({ ctor: name, args }) => ((_v) => _v[0] === 0 && _v[1].length === 0 ? Some18("") : _v[0] === 1 && _v[1].length === 1 && _v[1][0]._tag === "PBind" ? (([, [{ name }]]) => Some18(name))(_v) : _v[0] === 1 && _v[1].length === 1 && _v[1][0]._tag === "PWild" ? Some18("") : None18)(_tuple9(arity, args)))(_v) : None18)(pattern);
var builtinPayload = _curry20(3, builtinPayload$);
var builtinPair = _curry20(7, (ctx, left, right, helper, leftCtor, rightCtor, leftArity) => or11(or11(or11(or11(_Option_isSome5(left.guard), _Option_isSome5(right.guard)), _Map_has6(leftCtor, ctx.customCtorKeys)), _Map_has6(rightCtor, ctx.customCtorKeys)), _Set_has5(helper, ctx.userNames)) ? None18 : ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" ? (([{ value: leftBinding }, { value: rightBinding }]) => Some18({ helper, leftBinding, left: left.body, rightBinding, right: right.body }))(_v) : None18)(_tuple9(builtinPayload$(left.pattern, leftCtor, leftArity), builtinPayload$(right.pattern, rightCtor, 1))));
var builtinMatchPair = _curry20(3, (ctx, left, right) => ((_v) => _v[0]._tag === "Some" && _v[0].value.length === 1 && _v[0].value[0] === "error" && _v[1]._tag === "Some" && _v[1].value.length === 1 && _v[1].value[0] === "value" ? _Option_match18(builtinPair(ctx, left, right, "_Result_match", "Err", "Ok", 1), () => builtinOptionPair(ctx, left, right), (plan) => Some18(plan)) : builtinOptionPair(ctx, left, right))(_tuple9(_Map_get8("Err", ctx.keys), _Map_get8("Ok", ctx.keys))));
var builtinOptionPair = _curry20(3, (ctx, left, right) => ((_v) => _v[0]._tag === "Some" && _v[0].value.length === 0 && _v[1]._tag === "Some" && _v[1].value.length === 1 && _v[1].value[0] === "value" ? builtinPair(ctx, left, right, "_Option_match", "None", "Some", 0) : None18)(_tuple9(_Map_get8("None", ctx.keys), _Map_get8("Some", ctx.keys))));
var builtinMatchPlan = _curry20(3, (ctx, scrutinee, arms) => ((_v) => _v._tag === "EField" && _v.optional === true && _Option_isSome5(optionalMatch(arms)) ? None18 : match9(arms).with((_v) => _v.length === 2, ([left, right]) => _Option_match18(builtinMatchPair(ctx, left, right), () => builtinMatchPair(ctx, right, left), (plan) => Some18(plan))).otherwise(() => None18))(scrutinee));
var genBuiltinHandler$ = (ctx, binding, body) => {
  const bound = binding === "" ? _Set_fromArray6([]) : _Set_fromArray6([binding]);
  return `(${binding}) => ${genLambdaBodyIn$(ctx, body, bound, "")}`;
};
var genBuiltinHandler = _curry20(3, genBuiltinHandler$);
var genBuiltinMatch$ = (ctx, scrutinee, plan) => `${plan.helper}(${genExpr$(ctx, scrutinee)}, ${genBuiltinHandler$(ctx, plan.leftBinding, plan.left)}, ${genBuiltinHandler$(ctx, plan.rightBinding, plan.right)})`;
var genBuiltinMatch = _curry20(3, genBuiltinMatch$);
var genMatchChain$ = (ctx, scrutinee, arms, base) => (([armLines, catchAll]) => {
  const tail = ((_v) => _v._tag === "Some" ? (({ value: [p, body] }) => `  .otherwise(${catchAllParam$(ctx, p)} => ${genLambdaBody$(ctx, body)})`)(_v) : _v._tag === "None" ? and12(_Option_isSome5(ctx.guardBaseType), hasArrArm(arms)) ? '  .otherwise(() => { throw new Error("non-exhaustive match"); })' : "  .exhaustive()" : (() => {
    throw new Error("non-exhaustive match");
  })())(catchAll);
  return _Str_join8(`
`, _Array_concat9(_Array_prepend8(`match(${genExpr$(ctx, scrutinee)})`, armLines), [tail]));
})(matchArmsLoop$(ctx, arms, 0, base));
var genMatchChain = _curry20(4, genMatchChain$);
var genGuardArm$ = (ctx, p, body, guardOpt, base) => {
  const root = _Option_isSome5(base) ? "_g" : "_v";
  const conds0 = patConds(ctx.keys, p, root);
  const slot = ((_v) => _v._tag === "PAs" ? (({ pat }) => patSlot(ctx.keys, pat))(_v) : patSlot(ctx.keys, p))(p);
  const conds = _Option_match18(guardOpt, () => conds0, (g) => {
    const $match = p;
    switch ($match._tag) {
      case "PAs": {
        const { name } = $match;
        return _Array_append14(slot === "" ? `((${name}) => ${genExpr$(ctx, g)})(${root})` : `((${name}) => ((${slot}) => ${genExpr$(ctx, g)})(${name}))(${root})`, conds0);
      }
      default: {
        return _Array_append14(slot === "" ? `(${genExpr$(ctx, g)})` : `((${slot}) => ${genExpr$(ctx, g)})(${root})`, conds0);
      }
    }
  });
  const test = length15(conds) === 0 ? "true" : _Str_join8(" && ", conds);
  const handler = ((_v) => _v._tag === "PAs" ? (({ name }) => `(${name}) => ${slot === "" ? genLambdaBody$(ctx, body) : `((${slot}) => ${genLambdaBody$(ctx, body)})(${name})`}`)(_v) : `${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody$(ctx, body)}`)(p);
  return _Option_match18(base, () => `.with((_v) => ${test}, ${handler})`, (b) => {
    const target = patTarget(ctx.keys, p, b);
    return eq16(target, b) ? `.with((_v) => { const _g: any = _v; return ${test}; }, ${handler})` : `.with((_v): _v is ${target} => { const _g: any = _v; return ${test}; }, ${handler})`;
  });
};
var genGuardArm = _curry20(5, genGuardArm$);
var isFlatSub = (p) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      return false;
    }
    case "PBind": {
      return true;
    }
    case "PWild": {
      return true;
    }
    case "PLit": {
      return true;
    }
    case "PBool": {
      return true;
    }
    case "PStr": {
      return true;
    }
    default: {
      return false;
    }
  }
};
var recordLits = _curry20(2, (fields, i) => _Option_match18(_Array_get17(i, fields), () => [], (f) => {
  const rest = recordLits(fields, i + 1);
  const $match = f.pat;
  switch ($match._tag) {
    case "PLit": {
      return _Array_prepend8(`${f.label}: ${litValue(f.pat)}`, rest);
    }
    case "PBool": {
      return _Array_prepend8(`${f.label}: ${litValue(f.pat)}`, rest);
    }
    case "PStr": {
      return _Array_prepend8(`${f.label}: ${litValue(f.pat)}`, rest);
    }
    default: {
      return rest;
    }
  }
}));
var ctorArgParts$ = (ctx, ctor, args, i) => _Option_match18(_Array_get17(i, args), () => _tuple9([], []), (a) => (([restBinds, restLits]) => {
  const key = keyAt$(ctx, ctor, i);
  const $match = a;
  switch ($match._tag) {
    case "PBind": {
      const { name } = $match;
      return _tuple9(_Array_prepend8(eq16(key, name) ? key : `${key}: ${name}`, restBinds), restLits);
    }
    case "PLit": {
      return _tuple9(restBinds, _Array_prepend8(`${key}: ${litValue(a)}`, restLits));
    }
    case "PBool": {
      return _tuple9(restBinds, _Array_prepend8(`${key}: ${litValue(a)}`, restLits));
    }
    case "PStr": {
      return _tuple9(restBinds, _Array_prepend8(`${key}: ${litValue(a)}`, restLits));
    }
    default: {
      return _tuple9(restBinds, restLits);
    }
  }
})(ctorArgParts$(ctx, ctor, args, i + 1)));
var ctorArgParts = _curry20(4, ctorArgParts$);
var genWithArm$ = (ctx, p, body, base) => {
  const $match = p;
  switch ($match._tag) {
    case "PAs": {
      return genGuardArm$(ctx, p, body, None18, base);
    }
    case "PArr": {
      return genGuardArm$(ctx, p, body, None18, base);
    }
    case "PTuple": {
      return genGuardArm$(ctx, p, body, None18, base);
    }
    case "POr": {
      return genGuardArm$(ctx, p, body, None18, base);
    }
    case "PLit": {
      return `.with(${litValue(p)}, () => ${genLambdaBody$(ctx, body)})`;
    }
    case "PBool": {
      return `.with(${litValue(p)}, () => ${genLambdaBody$(ctx, body)})`;
    }
    case "PStr": {
      return `.with(${litValue(p)}, () => ${genLambdaBody$(ctx, body)})`;
    }
    case "PRecord": {
      const { fields } = $match;
      return allOf2((f) => isFlatSub(f.pat), fields) ? ((lits) => ((slot) => `.with({ ${_Str_join8(", ", lits)} }, ${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody$(ctx, body)})`)(patSlot(ctx.keys, p)))(recordLits(fields, 0)) : genGuardArm$(ctx, p, body, None18, base);
    }
    case "PCtor": {
      const { ctor, args } = $match;
      return allOf2(isFlatSub, args) ? (([binds, litFields]) => {
        const patObj = _Str_join8(", ", _Array_prepend8(`_tag: ${jsStringLit(ctor)}`, litFields));
        const param = length15(binds) === 0 ? "()" : `({ ${_Str_join8(", ", binds)} })`;
        return `.with({ ${patObj} }, ${param} => ${genLambdaBody$(ctx, body)})`;
      })(ctorArgParts$(ctx, ctor, args, 0)) : genGuardArm$(ctx, p, body, None18, base);
    }
    default: {
      return genGuardArm$(ctx, p, body, None18, base);
    }
  }
};
var genWithArm = _curry20(4, genWithArm$);
var typedCtorParams$ = (keys, paramTypes, i) => _Option_match18(_Array_get17(i, keys), () => [], (k) => _Array_prepend8(`${k}: ${_Option_unwrapOr11("unknown", _Array_get17(i, paramTypes))}`, typedCtorParams$(keys, paramTypes, i + 1)));
var typedCtorParams = _curry20(3, typedCtorParams$);
var genCtor = _curry20(2, (c, ts) => {
  const tag = jsStringLit(c.name);
  return length15(c.fields) === 0 ? _Option_match18(ts, () => `const ${c.name} = { _tag: ${tag} };`, (t) => `const ${c.name}: ${t.retMono} = { _tag: ${tag} };`) : ((keys) => ((params) => ((impl) => length15(c.fields) >= 2 ? ((curried) => _Option_match18(ts, () => `const ${c.name} = ${curried};`, (t) => `const ${c.name} = ${curried} as ${t.generics}(${_Str_join8(", ", typedCtorParams$(keys, t.paramTypes, 0))}) => ${t.ret};`))(`_curry(${show8(length15(c.fields))}, ${impl})`) : _Option_match18(ts, () => `const ${c.name} = ${impl};`, (t) => `const ${c.name} = ${t.generics}(${_Str_join8(", ", typedCtorParams$(keys, t.paramTypes, 0))}): ${t.ret} => ({ _tag: ${tag}, ${params} });`))(`(${params}) => ({ _tag: ${tag}, ${params} })`))(_Str_join8(", ", keys)))(keysOf(c.fields));
});
var genCtorsFrom = _curry20(6, (s, ctors, h, refs, exported, i) => _Option_match18(_Array_get17(i, ctors), () => [], (c) => {
  const rest = genCtorsFrom(s, ctors, h, refs, exported, i + 1);
  return or11(exported, _Set_has5(c.name, refs)) ? _Array_prepend8(genCtor(c, hook2(h, s, c)), rest) : rest;
}));
var genType$ = (ctx, s) => {
  const $match = s;
  switch ($match._tag) {
    case "SType": {
      const { ctors, exported } = $match;
      return _Str_join8(`
`, genCtorsFrom(s, ctors, ctx.annotateCtor, ctx.valueRefs, exported, 0));
    }
    default: {
      return "";
    }
  }
};
var genType = _curry20(2, genType$);
var typeExprArity = (te) => {
  const $match = te;
  switch ($match._tag) {
    case "TyArrow": {
      const { to } = $match;
      return 1 + typeExprArity(to);
    }
    default: {
      return 0;
    }
  }
};
var externArgs = (n) => {
  let i = 0;
  let acc = "";
  while (true) {
    if (i >= n) {
      return acc;
    } else {
      {
        const $recur0 = i + 1;
        const $recur1 = acc === "" ? `$a${show8(i)}` : `${acc}, $a${show8(i)}`;
        i = $recur0;
        acc = $recur1;
        continue;
      }
    }
  }
};
var externApplied = (n) => {
  let i = 0;
  let acc = "";
  while (true) {
    if (i >= n) {
      return acc;
    } else {
      {
        const $recur0 = i + 1;
        const $recur1 = `${acc}($a${show8(i)})`;
        i = $recur0;
        acc = $recur1;
        continue;
      }
    }
  }
};
var genExtern = (s) => {
  const $match = s;
  switch ($match._tag) {
    case "SExtern": {
      const { name, typeExpr, module: modName, imported, curried } = $match;
      return _Str_startsWith4("mochi:global:", modName) ? ((target) => ((base) => `const ${name} = ${imported === "" ? base : `${base}[${jsStringLit(imported)}]`};`)(`globalThis[${jsStringLit(target)}]`))(_Str_slice3(13, _Str_length6(modName), modName)) : _Str_startsWith4("mochi:get:", modName) ? ((target) => `const ${name} = ($receiver) => $receiver[${jsStringLit(target)}];`)(_Str_slice3(10, _Str_length6(modName), modName)) : _Str_startsWith4("mochi:set:", modName) ? ((target) => `const ${name} = _curry(2, ($receiver, $value) => ($receiver[${jsStringLit(target)}] = $value));`)(_Str_slice3(10, _Str_length6(modName), modName)) : _Str_startsWith4("mochi:new:", modName) ? ((target) => ((arity) => ((args) => imported !== "" ? ((raw) => ((importLine) => ((ctor) => arity === 0 ? `${importLine}
const ${name} = () => ${ctor};` : `${importLine}
const ${name} = _curry(${show8(arity)}, (${args}) => ${ctor});`)(`new ${raw}(${args})`))(`import { ${imported} as ${raw} } from ${jsStringLit(target)};`))(_Str_concat2("$", name)) : arity === 0 ? `const ${name} = () => new globalThis[${jsStringLit(target)}]();` : `const ${name} = _curry(${show8(arity)}, (${args}) => new globalThis[${jsStringLit(target)}](${args}));`)(externArgs(arity)))(typeExprArity(typeExpr)))(_Str_slice3(10, _Str_length6(modName), modName)) : _Str_startsWith4("mochi:send:", modName) ? ((target) => ((arity) => ((args) => ((fn) => arity < 2 ? `const ${name} = ${fn};` : `const ${name} = _curry(${show8(arity)}, ${fn});`)(args === "" ? `($receiver) => $receiver[${jsStringLit(target)}]()` : `($receiver, ${args}) => $receiver[${jsStringLit(target)}](${args})`))(externArgs(arity - 1)))(typeExprArity(typeExpr)))(_Str_slice3(11, _Str_length6(modName), modName)) : imported === "default" ? `import ${name} from ${jsStringLit(modName)};` : ((arity) => arity <= 1 ? ((spec) => `import { ${spec} } from ${jsStringLit(modName)};`)(eq16(imported, name) ? name : `${imported} as ${name}`) : ((raw) => ((flat) => `import { ${imported} as ${raw} } from ${jsStringLit(modName)};
const ${name} = _curry(${show8(arity)}, ${flat});`)(curried ? `(${externArgs(arity)}) => ${raw}${externApplied(arity)}` : raw))(_Str_concat2("$", name)))(typeExprArity(typeExpr));
    }
    default: {
      return "";
    }
  }
};
var stripAlExt = (s) => _Str_endsWith2(".mochi", s) ? _Str_slice3(0, _Str_length6(s) - 6, s) : s;
var rewriteImportPath$ = (from, ext) => {
  const bare = stripAlExt(from);
  return or11(_Str_startsWith4("./", bare), _Str_startsWith4("../", bare)) ? `${bare}${ext}` : bare;
};
var rewriteImportPath = _curry20(2, rewriteImportPath$);
var genImport$ = (s, ext) => {
  const $match = s;
  switch ($match._tag) {
    case "SImport": {
      const { names, from } = $match;
      const nameList = _Str_join8(", ", map12((n) => n.name, names));
      const path = rewriteImportPath$(from, ext);
      return `import { ${nameList} } from ${jsStringLit(path)};`;
    }
    case "SImportNs": {
      const { alias, from } = $match;
      const path = rewriteImportPath$(from, ext);
      return `import * as ${alias.name} from ${jsStringLit(path)};`;
    }
    default: {
      return "";
    }
  }
};
var genImport = _curry20(2, genImport$);
var exportLine = (l) => `export ${l}`;
var jsDocLine = (l) => _Str_length6(l) > 0 ? ` * ${_Str_replace2("*/", "*\\/", l)}` : " *";
var jsDoc = (docOpt) => _Option_match18(docOpt, () => "", (doc) => {
  const lines = map12(jsDocLine, _Str_split5(`
`, doc));
  return `/**
${_Str_join8(`
`, lines)}
 */
`;
});
var rawArityOf$ = (locals, s) => ((_v) => _v._tag === "SLet" && _v.value._tag === "ELambda" && (({ name, value: { params, body } }) => and12(!_Str_startsWith4("$", name), !_Set_has5(name, locals)))(_v) ? (({ name, value: { params, body } }) => (([cparams, , fills]) => and12(length15(cparams) >= 2, length15(fills) === 0) ? Some18(length15(cparams)) : None18)(collapseLambda$(params, body)))(_v) : None18)(s);
var rawArityOf = _curry20(2, rawArityOf$);
var rawTwinAllowed$ = (ctx, name, value) => _Option_match18(ctx.annotateRaw, () => true, (h) => _Option_isSome5(h(name, value)));
var rawTwinAllowed = _curry20(3, rawTwinAllowed$);
var withRawTwins$ = (ctx, locals, stmts, i) => _Option_match18(_Array_get17(i, stmts), () => ctx, (s) => ((_v) => _v[0]._tag === "SLet" && _v[1]._tag === "Some" && (([{ name, value }, { value: n }]) => rawTwinAllowed$(ctx, name, value))(_v) ? (([{ name, value }, { value: n }]) => ((next) => withRawTwins$(next, locals, stmts, i + 1))({ ...ctx, rawNames: _Map_set7(name, tempName$(ctx, `${name}$`), ctx.rawNames), rawArity: _Map_set7(name, n, ctx.rawArity) }))(_v) : withRawTwins$(ctx, locals, stmts, i + 1))(_tuple9(s, rawArityOf$(locals, s))));
var withRawTwins = _curry20(4, withRawTwins$);
var genStmt$ = (ctx, s) => {
  const $match = s;
  switch ($match._tag) {
    case "SError": {
      const { span: sp } = $match;
      return `throw new Error("codegen invariant: error node reached codegen at ${show8(sp.start)}");`;
    }
    case "SImport": {
      return genImport$(s, ctx.moduleExt);
    }
    case "SImportNs": {
      return genImport$(s, ctx.moduleExt);
    }
    case "SType": {
      const { exported } = $match;
      const decls = genType$(ctx, s);
      return decls === "" ? "" : exported ? _Str_join8(`
`, map12(exportLine, _Str_split5(`
`, decls))) : decls;
    }
    case "SExtern": {
      const { name, exported, doc } = $match;
      const docComment = ctx.docs ? jsDoc(doc) : "";
      return exported ? `${docComment}${genExtern(s)}
export { ${name} };` : `${docComment}${genExtern(s)}`;
    }
    case "SLet": {
      const { name, value, exported, doc } = $match;
      const doExport = and12(exported, !_Str_startsWith4("$", name));
      const docComment = and12(ctx.docs, !_Str_startsWith4("$", name)) ? jsDoc(doc) : "";
      const annot = _Option_unwrapOr11("", hook2(ctx.annotateLet, name, value));
      const head = `${docComment}${doExport ? "export " : ""}const ${name}${annot} = `;
      return ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "ELambda" ? (([{ value: raw }, { params, body, span: sp }]) => (([arrow, arity]) => `const ${raw} = ${arrow};
${head}_curry(${show8(arity)}, ${raw});`)(genArrow$(ctx, params, body, sp, _Option_unwrapOr11("", hook2(ctx.annotateRaw, name, value)))))(_v) : `${head}${genExpr$(ctx, value)};`)(_tuple9(_Map_get8(name, ctx.rawNames), value));
    }
    case "SExpr": {
      const { value } = $match;
      return `${genExpr$(ctx, value)};`;
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var genStmt = _curry20(2, genStmt$);
var usesMatchLibArm$ = (ctx, a) => or11(_Option_match18(a.guard, () => false, (g) => usesMatchLib$(ctx, g)), usesMatchLib$(ctx, a.body));
var usesMatchLibArm = _curry20(2, usesMatchLibArm$);
var usesMatchLib$ = (ctx, e) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return false;
    }
    case "EUnit": {
      return false;
    }
    case "EBool": {
      return false;
    }
    case "EStr": {
      return false;
    }
    case "ERef": {
      return false;
    }
    case "ECall": {
      const { fn, args } = $match;
      return or11(usesMatchLib$(ctx, fn), someOf4((x) => usesMatchLib$(ctx, x), args));
    }
    case "ELambda": {
      const { body } = $match;
      return usesMatchLib$(ctx, body);
    }
    case "ELetIn": {
      const { value, body } = $match;
      return or11(usesMatchLib$(ctx, value), usesMatchLib$(ctx, body));
    }
    case "ELetBind": {
      const { value, body } = $match;
      return or11(usesMatchLib$(ctx, value), usesMatchLib$(ctx, body));
    }
    case "EPipe": {
      const { left, right } = $match;
      return or11(usesMatchLib$(ctx, left), usesMatchLib$(ctx, right));
    }
    case "EDo": {
      const { exprs } = $match;
      return someOf4((x) => usesMatchLib$(ctx, x), exprs);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return or11(usesMatchLib$(ctx, cond), or11(usesMatchLib$(ctx, thenE), usesMatchLib$(ctx, elseE)));
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return or11(and12(!isListMatch(arms), !ternaryTypes(ctx, arms, hook1(ctx.guardBaseType, scrutinee))), or11(usesMatchLib$(ctx, scrutinee), someOf4((a) => usesMatchLibArm$(ctx, a), arms)));
    }
    case "ELoop": {
      const { params, body } = $match;
      return or11(someOf4((p) => usesMatchLib$(ctx, p.init), params), usesMatchLib$(ctx, body));
    }
    case "ERecur": {
      const { args } = $match;
      return someOf4((x) => usesMatchLib$(ctx, x), args);
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return or11(_Option_match18(spread, () => false, (s) => usesMatchLib$(ctx, s)), someOf4((f) => usesMatchLib$(ctx, f.value), fields));
    }
    case "EField": {
      const { target } = $match;
      return usesMatchLib$(ctx, target);
    }
    case "ETuple": {
      const { elements } = $match;
      return someOf4((x) => usesMatchLib$(ctx, x), elements);
    }
    case "EArr": {
      const { elements } = $match;
      return someOf4((el) => usesMatchLib$(ctx, ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
        throw new Error("non-exhaustive match");
      })())(el)), elements);
    }
    case "EList": {
      const { elements } = $match;
      return someOf4((el) => usesMatchLib$(ctx, ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
        throw new Error("non-exhaustive match");
      })())(el)), elements);
    }
    case "ESet": {
      const { elements } = $match;
      return someOf4((el) => usesMatchLib$(ctx, ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
        throw new Error("non-exhaustive match");
      })())(el)), elements);
    }
    case "EMap": {
      const { entries } = $match;
      return someOf4((en) => or11(usesMatchLib$(ctx, en.key), usesMatchLib$(ctx, en.value)), entries);
    }
    case "EInterp": {
      const { parts } = $match;
      return someOf4((p) => {
        const $match$ = p;
        switch ($match$._tag) {
          case "IPLit": {
            return false;
          }
          case "IPExpr": {
            const { expr: ex } = $match$;
            return usesMatchLib$(ctx, ex);
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, parts);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var usesMatchLib = _curry20(2, usesMatchLib$);
var loopInitRefsFrom$2 = (ctx, params, i, acc) => _Option_match18(_Array_get17(i, params), () => acc, (p) => loopInitRefsFrom$2(ctx, params, i + 1, exprRefs$(ctx, p.init, acc)));
var loopInitRefsFrom2 = _curry20(4, loopInitRefsFrom$2);
var exprRefsListFrom$ = (ctx, xs, i, acc) => _Option_match18(_Array_get17(i, xs), () => acc, (x) => exprRefsListFrom$(ctx, xs, i + 1, exprRefs$(ctx, x, acc)));
var exprRefsListFrom = _curry20(4, exprRefsListFrom$);
var exprRefsInterpPartsFrom$ = (ctx, parts, i, acc) => _Option_match18(_Array_get17(i, parts), () => acc, (p) => exprRefsInterpPartsFrom$(ctx, parts, i + 1, ((_v) => _v._tag === "IPLit" ? acc : _v._tag === "IPExpr" ? (({ expr: ex }) => exprRefs$(ctx, ex, acc))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p)));
var exprRefsInterpPartsFrom = _curry20(4, exprRefsInterpPartsFrom$);
var exprRefsArmsFrom$ = (ctx, arms, i, acc) => _Option_match18(_Array_get17(i, arms), () => acc, (a) => {
  const acc1 = _Option_match18(a.guard, () => acc, (g) => exprRefs$(ctx, g, acc));
  return exprRefsArmsFrom$(ctx, arms, i + 1, exprRefs$(ctx, a.body, acc1));
});
var exprRefsArmsFrom = _curry20(4, exprRefsArmsFrom$);
var exprRefsFieldsFrom$ = (ctx, fields, i, acc) => _Option_match18(_Array_get17(i, fields), () => acc, (f) => exprRefsFieldsFrom$(ctx, fields, i + 1, exprRefs$(ctx, f.value, acc)));
var exprRefsFieldsFrom = _curry20(4, exprRefsFieldsFrom$);
var exprRefsEntriesFrom$ = (ctx, entries, i, acc) => _Option_match18(_Array_get17(i, entries), () => acc, (en) => exprRefsEntriesFrom$(ctx, entries, i + 1, exprRefs$(ctx, en.value, exprRefs$(ctx, en.key, acc))));
var exprRefsEntriesFrom = _curry20(4, exprRefsEntriesFrom$);
var exprRefs$ = (ctx, e, acc) => {
  const $match = e;
  switch ($match._tag) {
    case "ENum": {
      return acc;
    }
    case "EUnit": {
      return acc;
    }
    case "EBool": {
      return acc;
    }
    case "EStr": {
      return acc;
    }
    case "ERef": {
      const { name } = $match;
      return _Set_add6(name, acc);
    }
    case "ECall": {
      const { fn, args } = $match;
      return exprRefsListFrom$(ctx, args, 0, exprRefs$(ctx, fn, acc));
    }
    case "ELambda": {
      const { params, body } = $match;
      return (([cparams, cbody, fills]) => {
        const acc2 = length15(cparams) >= 2 ? _Set_add6("_curry", acc) : acc;
        const acc3 = reduce5(_curry20(2, (a, g) => reduce5(_curry20(2, (b, lab) => ((_v) => _v._tag === "LPSpanned" && _v.param._tag === "LPLabeled" && _v.param.defaultValue._tag === "Some" ? (({ param: { defaultValue: { value: d } } }) => exprRefs$(ctx, d, b))(_v) : _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some" ? (({ defaultValue: { value: d } }) => exprRefs$(ctx, d, b))(_v) : b)(lab)), a, g.labs)), acc2, fills);
        return exprRefs$(ctx, cbody, acc3);
      })(collapseLambda$(params, body));
    }
    case "ELetIn": {
      const { value, body } = $match;
      return exprRefs$(ctx, body, exprRefs$(ctx, value, acc));
    }
    case "ELetBind": {
      const { monad, value, body } = $match;
      return exprRefs$(ctx, body, exprRefs$(ctx, value, _Set_add6(bindRuntime(monad), acc)));
    }
    case "EPipe": {
      const { left, right } = $match;
      return exprRefs$(ctx, right, exprRefs$(ctx, left, acc));
    }
    case "EDo": {
      const { exprs } = $match;
      return exprRefsListFrom$(ctx, exprs, 0, acc);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return exprRefs$(ctx, elseE, exprRefs$(ctx, thenE, exprRefs$(ctx, cond, acc)));
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      const acc1 = exprRefs$(ctx, scrutinee, acc);
      const acc2 = someOf4((a) => ((_v) => _v._tag === "PList" && _v.rest._tag === "Some" && _v.rest.value._tag === "PBind" ? true : false)(a.pattern), arms) ? _Set_add6("_list", acc1) : acc1;
      return exprRefsArmsFrom$(ctx, arms, 0, _Option_match18(builtinMatchPlan(ctx, scrutinee, arms), () => acc2, (plan) => _Set_add6(plan.helper, acc2)));
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return exprRefsFieldsFrom$(ctx, fields, 0, _Option_match18(spread, () => acc, (s) => exprRefs$(ctx, s, acc)));
    }
    case "EField": {
      const { target, name } = $match;
      return _Option_match18(emptyNsEmit$(target, name, None18), () => _Option_match18(nsRuntimeId$(ctx, target, name), () => exprRefs$(ctx, target, acc), (rt) => _Set_add6(rt, acc)), () => ((_v) => _v._tag === "ERef" && _v.name === "List" ? _Set_add6("_list", acc) : acc)(target));
    }
    case "ELoop": {
      const { params, body } = $match;
      const acc1 = loopNeedsStep(ctx, body, params) ? _Set_add6("_recur", _Set_add6("_done", acc)) : acc;
      const acc2 = loopInitRefsFrom$2(ctx, params, 0, acc1);
      return exprRefs$(ctx, body, acc2);
    }
    case "ERecur": {
      const { args } = $match;
      return exprRefsListFrom$(ctx, args, 0, acc);
    }
    case "ETuple": {
      const { elements } = $match;
      return exprRefsListFrom$(ctx, elements, 0, acc);
    }
    case "EArr": {
      const { elements } = $match;
      return exprRefsListFrom$(ctx, map12((el) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: e } = $match$;
            return e;
          }
          case "SESpread": {
            const { expr: e } = $match$;
            return e;
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements), 0, acc);
    }
    case "EList": {
      const { elements } = $match;
      return exprRefsListFrom$(ctx, map12((el) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: e } = $match$;
            return e;
          }
          case "SESpread": {
            const { expr: e } = $match$;
            return e;
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements), 0, _Set_add6("_list", acc));
    }
    case "ESet": {
      const { elements } = $match;
      return exprRefsListFrom$(ctx, map12((el) => {
        const $match$ = el;
        switch ($match$._tag) {
          case "SEExpr": {
            const { expr: e } = $match$;
            return e;
          }
          case "SESpread": {
            const { expr: e } = $match$;
            return e;
          }
          default: {
            throw new Error("non-exhaustive match");
          }
        }
      }, elements), 0, acc);
    }
    case "EMap": {
      const { entries } = $match;
      return exprRefsEntriesFrom$(ctx, entries, 0, acc);
    }
    case "EInterp": {
      const { parts } = $match;
      return exprRefsInterpPartsFrom$(ctx, parts, 0, acc);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var exprRefs = _curry20(3, exprRefs$);
var boundNamesFrom$ = (valueRefs, stmts, i, acc) => _Option_match18(_Array_get17(i, stmts), () => acc, (s) => boundNamesFrom$(valueRefs, stmts, i + 1, ((_v) => _v._tag === "SLet" ? (({ name }) => _Set_add6(name, acc))(_v) : _v._tag === "SExtern" ? (({ name }) => _Set_add6(name, acc))(_v) : _v._tag === "SType" ? (({ ctors, exported }) => _Set_union(acc, _Set_fromArray6(map12((c) => c.name, filter7((c) => or11(exported, _Set_has5(c.name, valueRefs)), ctors)))))(_v) : _v._tag === "SImport" ? (({ names }) => _Set_union(acc, _Set_fromArray6(map12((n) => n.name, names))))(_v) : _v._tag === "SImportNs" ? (({ alias }) => _Set_add6(alias.name, acc))(_v) : _v._tag === "SError" ? acc : _v._tag === "SExpr" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(s)));
var boundNamesFrom = _curry20(4, boundNamesFrom$);
var boundNames$ = (valueRefs, stmts) => boundNamesFrom$(valueRefs, stmts, 0, _Set_fromArray6([]));
var boundNames = _curry20(2, boundNames$);
var collectValueRefs$ = (ctx, stmts, i, acc) => _Option_match18(_Array_get17(i, stmts), () => acc, (s) => collectValueRefs$(ctx, stmts, i + 1, ((_v) => _v._tag === "SLet" ? (({ value }) => exprRefs$(ctx, value, acc))(_v) : _v._tag === "SExpr" ? (({ value }) => exprRefs$(ctx, value, acc))(_v) : acc)(s)));
var collectValueRefs = _curry20(4, collectValueRefs$);
var refsForStmt$ = (ctx, s) => {
  const $match = s;
  switch ($match._tag) {
    case "SLet": {
      const { value } = $match;
      return exprRefs$(ctx, value, _Set_fromArray6([]));
    }
    case "SExpr": {
      const { value } = $match;
      return exprRefs$(ctx, value, _Set_fromArray6([]));
    }
    case "SType": {
      const { ctors, exported } = $match;
      return someOf4((c) => and12(length15(c.fields) >= 2, or11(exported, _Set_has5(c.name, ctx.valueRefs))), ctors) ? _Set_add6("_curry", _Set_fromArray6([])) : _Set_fromArray6([]);
    }
    case "SExtern": {
      const { typeExpr } = $match;
      return typeExprArity(typeExpr) >= 2 ? _Set_add6("_curry", _Set_fromArray6([])) : _Set_fromArray6([]);
    }
    default: {
      return _Set_fromArray6([]);
    }
  }
};
var refsForStmt = _curry20(2, refsForStmt$);
var collectRefsFrom$ = (ctx, stmts, i, acc) => _Option_match18(_Array_get17(i, stmts), () => acc, (s) => collectRefsFrom$(ctx, stmts, i + 1, _Set_union(acc, refsForStmt$(ctx, s))));
var collectRefsFrom = _curry20(4, collectRefsFrom$);
var addDepsFrom = _curry20(4, (deps, j, refs, queue) => _Option_match18(_Array_get17(j, deps), () => _tuple9(refs, queue), (d) => _Set_has5(d, refs) ? addDepsFrom(deps, j + 1, refs, queue) : addDepsFrom(deps, j + 1, _Set_add6(d, refs), _Array_append14(d, queue))));
var closeRefsFrom = _curry20(4, (queue, i, refs, runtimeDeps) => _Option_match18(_Array_get17(i, queue), () => refs, (r) => {
  const deps = _Option_unwrapOr11([], _Map_get8(r, runtimeDeps));
  return (([refs2, queue2]) => closeRefsFrom(queue2, i + 1, refs2, runtimeDeps))(addDepsFrom(deps, 0, refs, queue));
}));
var runtimeRefNames = _curry20(4, (ctx, stmts, jsDefs, runtimeDeps) => {
  const refs0 = collectRefsFrom$(ctx, stmts, 0, _Set_fromArray6([]));
  const refs = closeRefsFrom(_Set_toArray3(refs0), 0, refs0, runtimeDeps);
  const bound = boundNames$(ctx.valueRefs, stmts);
  return filter7((n) => and12(_Set_has5(n, refs), !_Set_has5(n, bound)), _Map_keys7(jsDefs));
});
var preludePreamble$ = (ctx, stmts, jsDefs, runtimeDeps) => {
  const names = runtimeRefNames(ctx, stmts, jsDefs, runtimeDeps);
  const defs = map12((n) => _Map_getOr7("", n, jsDefs), names);
  return length15(defs) === 0 ? "" : `${_Str_join8(`
`, defs)}

`;
};
var preludePreamble = _curry20(4, preludePreamble$);
var genStmtAllFrom$ = (ctx, stmts, i) => _Option_match18(_Array_get17(i, stmts), () => [], (s) => _Array_prepend8(genStmt$(ctx, s), genStmtAllFrom$(ctx, stmts, i + 1)));
var genStmtAllFrom = _curry20(3, genStmtAllFrom$);
var codegenWith = _curry20(7, (stmts, imported, useRuntime, ns, jsDefs, runtimeDeps, opts) => {
  const keys0 = ctorKeysFromStmts(stmts, imported);
  const keys = seedBuiltinCtorKeys(stmts, keys0);
  const ctx0 = { keys, customCtorKeys: keys0, ns, annotateLet: opts.annotateLet, annotateRaw: opts.annotateRaw, annotateCtor: opts.annotateCtor, annotateParams: opts.annotateParams, annotateEmpty: opts.annotateEmpty, annotateLetin: opts.annotateLetin, annotateCall: opts.annotateCall, guardBaseType: opts.guardBaseType, flattenPipe: opts.flattenPipe, tupleHelper: opts.tupleHelper, preserveInfix: opts.preserveInfix, preserveJsx: opts.preserveJsx, moduleExt: opts.moduleExt, rawNames: new Map([]), rawArity: new Map([]), valueRefs: _Set_fromArray6([]), userNames: _Set_union(boundNames$(_Set_fromArray6([]), stmts), localBinderNames(stmts)), docs: opts.docs };
  const valueRefs = collectValueRefs$(ctx0, stmts, 0, _Set_fromArray6([]));
  const userNames = _Set_union(boundNames$(valueRefs, stmts), localBinderNames(stmts));
  const ctx = withRawTwins$({ ...ctx0, valueRefs, userNames }, localBinderNames(stmts), stmts, 0);
  const needsMatch = someOf4((s) => {
    const $match = s;
    switch ($match._tag) {
      case "SLet": {
        const { value } = $match;
        return usesMatchLib$(ctx, value);
      }
      case "SExpr": {
        const { value } = $match;
        return usesMatchLib$(ctx, value);
      }
      default: {
        return false;
      }
    }
  }, stmts);
  const header = needsMatch ? `import { match } from "@onrails/pattern";

` : "";
  const preamble = useRuntime ? preludePreamble$(ctx, stmts, jsDefs, runtimeDeps) : "";
  const body = _Str_join8(`
`, genStmtAllFrom$(ctx, stmts, 0));
  return `${header}${preamble}${body}
`;
});
var runtimeDepNames = _curry20(5, (stmts, imported, ns, jsDefs, runtimeDeps) => {
  const keys0 = ctorKeysFromStmts(stmts, imported);
  const keys = seedBuiltinCtorKeys(stmts, keys0);
  const ctx0 = { keys, customCtorKeys: keys0, ns, annotateLet: None18, annotateRaw: None18, annotateCtor: None18, annotateParams: None18, annotateEmpty: None18, annotateLetin: None18, annotateCall: None18, guardBaseType: None18, flattenPipe: false, tupleHelper: false, preserveInfix: false, preserveJsx: false, moduleExt: ".js", rawNames: new Map([]), rawArity: new Map([]), valueRefs: _Set_fromArray6([]), userNames: _Set_union(boundNames$(_Set_fromArray6([]), stmts), localBinderNames(stmts)), docs: false };
  const valueRefs = collectValueRefs$(ctx0, stmts, 0, _Set_fromArray6([]));
  return runtimeRefNames({ ...ctx0, valueRefs }, stmts, jsDefs, runtimeDeps);
});
var codegen$ = (stmts, imported, useRuntime, ns, jsDefs, runtimeDeps) => codegenWith(stmts, imported, useRuntime, ns, jsDefs, runtimeDeps, jsGenOpts);
var codegen = _curry20(6, codegen$);

import { None as None20, Some as Some20, _Array_append as _Array_append16, _Array_concat as _Array_concat11, _Array_contains as _Array_contains4, _Array_dedupeBy, _Array_drop as _Array_drop3, _Array_get as _Array_get19, _Array_prepend as _Array_prepend10, _Array_reverse, _Array_sort as _Array_sort2, _Array_sortBy, _Array_take as _Array_take4, _Map_delete as _Map_delete3, _Map_get as _Map_get10, _Map_keys as _Map_keys9, _Map_set as _Map_set9, _Map_size as _Map_size2, _Map_values as _Map_values3, _Option_flatMap as _Option_flatMap3, _Option_isSome as _Option_isSome6, _Option_map as _Option_map3, _Option_match as _Option_match20, _Option_unwrapOr as _Option_unwrapOr13, _Set_add as _Set_add8, _Set_fromArray as _Set_fromArray8, _Set_has as _Set_has7, _Str_contains as _Str_contains2, _Str_fromCode as _Str_fromCode3, _Str_join as _Str_join10, _Str_split as _Str_split6, _Str_startsWith as _Str_startsWith6, _curry as _curry22, _tuple as _tuple11, and as and14, concat as concat2, eq as eq18, filter as filter9, length as length17, map as map14, or as or13, reduce as reduce6, show as show10 } from "@mochi/compiler/runtime";

import { None as None19, Some as Some19, _Array_append as _Array_append15, _Array_concat as _Array_concat10, _Array_get as _Array_get18, _Array_prepend as _Array_prepend9, _Array_sort, _Map_delete as _Map_delete2, _Map_get as _Map_get9, _Map_has as _Map_has7, _Map_keys as _Map_keys8, _Map_set as _Map_set8, _Map_size, _Option_flatMap as _Option_flatMap2, _Option_map as _Option_map2, _Option_match as _Option_match19, _Option_unwrapOr as _Option_unwrapOr12, _Set_add as _Set_add7, _Set_fromArray as _Set_fromArray7, _Set_has as _Set_has6, _Str_codeAt as _Str_codeAt8, _Str_fromCode as _Str_fromCode2, _Str_get as _Str_get4, _Str_join as _Str_join9, _Str_length as _Str_length7, _Str_slice as _Str_slice4, _Str_startsWith as _Str_startsWith5, _Str_trim, _curry as _curry21, _tuple as _tuple10, and as and13, eq as eq17, filter as filter8, length as length16, map as map13, or as or12, show as show9 } from "@mochi/compiler/runtime";
var tsEnv$ = (vars, recs) => ({ vars, recs });
var tsEnv = _curry21(2, tsEnv$);
var noVars = new Map;
var noRecs = new Map;
var plainEnv = (vars) => tsEnv$(vars, noRecs);
var recsEnv = (recs) => tsEnv$(noVars, recs);
var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var letterAt = (i) => _Option_unwrapOr12(`T${show9(i)}`, _Str_get4(i, letters));
var genericNames = (sc) => genericNamesFrom(_Array_concat10(sc.vars, sc.rvars), 0, new Map);
var genericNamesFrom = _curry21(3, (ids, i, names) => _Option_match19(_Array_get18(i, ids), () => names, (id) => genericNamesFrom(ids, i + 1, _Map_set8(id, letterAt(i), names))));
var primitiveTs = (name) => ((_v) => _v === "number" ? "number" : _v === "int" ? "number" : _v === "float" ? "number" : _v === "string" ? "string" : _v === "bool" ? "boolean" : _v === "unit" ? "undefined" : name)(name);
var namesOf$ = (ts, env) => _Str_join9(", ", map13((t) => tsOfRaw$(t, env), ts));
var namesOf = _curry21(2, namesOf$);
var qualifiedCon$ = (name, env) => ((_v) => _v._tag === "Some" && (({ value: qual }) => qual !== "")(_v) ? (({ value: qual }) => qual)(_v) : primitiveTs(name))(_Map_get9(name, env.recs));
var qualifiedCon = _curry21(2, qualifiedCon$);
var nominal$ = (name, args, env) => {
  const shown = qualifiedCon$(name, env);
  return length16(args) === 0 ? shown : `${shown}<${namesOf$(args, env)}>`;
};
var nominal = _curry21(3, nominal$);
var tsRowFields$ = (row, env) => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return _tuple10([], None19);
    }
    case "RowVar": {
      const { id } = $match;
      return _tuple10([], Some19(id));
    }
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return (([fields, tail]) => _tuple10(_Array_prepend9(`${label}${optional ? "?" : ""}: ${tsOfRaw$(fieldType, env)}`, fields), tail))(tsRowFields$(rest, env));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var tsRowFields = _curry21(2, tsRowFields$);
var shapeFieldsFrom$ = (row, vars) => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return Some19([]);
    }
    case "RowVar": {
      return None19;
    }
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return _Option_map2((fs) => _Array_prepend9(`${label}${optional ? "?" : ""}: ${shapeType$(fieldType, vars)}`, fs), shapeFieldsFrom$(rest, vars));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var shapeFieldsFrom = _curry21(2, shapeFieldsFrom$);
var shapeJoined$ = (ts, vars) => _Str_join9(", ", map13((t) => shapeType$(t, vars), ts));
var shapeJoined = _curry21(2, shapeJoined$);
var shapeType$ = (t, vars) => ((_v) => _v._tag === "TyRecord" ? (({ row }) => _Option_match19(shapeFieldsFrom$(row, vars), () => tsOf$(t, plainEnv(vars)), (fs) => length16(fs) === 0 ? "{}" : `{ ${_Str_join9("; ", _Array_sort(fs))} }`))(_v) : _v._tag === "TyCon" && _v.name === "Array" && _v.args.length === 1 ? (({ args: [elem] }) => ((inner) => ((_v) => _v._tag === "TyCon" && _v.name === "Task" && _v.args.length === 2 ? `(${inner})[]` : _v._tag === "TyFn" ? `(${inner})[]` : _v._tag === "TyOneOf" ? `(${inner})[]` : `${inner}[]`)(widenLits(elem)))(shapeType$(elem, vars)))(_v) : _v._tag === "TyCon" && _v.name === "List" && _v.args.length === 1 ? (({ args: [elem] }) => `Iterable<${shapeType$(elem, vars)}>`)(_v) : _v._tag === "TyCon" && _v.name === "Dict" && _v.args.length === 1 ? (({ args: [elem] }) => `Record<string, ${shapeType$(elem, vars)}>`)(_v) : _v._tag === "TyCon" && _v.name === "Task" && _v.args.length === 2 ? (({ args: [value, error] }) => `() => Promise<Result<${shapeType$(value, vars)}, ${shapeType$(error, vars)}>>`)(_v) : _v._tag === "TyCon" && _v.name === "tuple" ? (({ args: elems }) => `[${shapeJoined$(elems, vars)}]`)(_v) : _v._tag === "TyCon" ? (({ name, args }) => length16(args) === 0 ? primitiveTs(name) : `${name}<${shapeJoined$(args, vars)}>`)(_v) : _v._tag === "TyOneOf" ? (({ members }) => _Str_join9(" | ", map13((m) => ((_v) => _v._tag === "TySingleton" && _v.base === "string" ? (({ value }) => `"${value}"`)(_v) : _v._tag === "TySingleton" ? (({ value }) => value)(_v) : shapeType$(m, vars))(m), members)))(_v) : tsOf$(t, plainEnv(vars)))(widenLits(t));
var shapeType = _curry21(2, shapeType$);
var rowShapeKey$ = (row, vars) => _Option_map2((fs) => _Str_join9("; ", _Array_sort(fs)), shapeFieldsFrom$(row, vars));
var rowShapeKey = _curry21(2, rowShapeKey$);
var aliasNameFor$ = (row, env) => _Map_size(env.recs) === 0 ? None19 : _Option_flatMap2((k) => ((_v) => _v._tag === "Some" && _v.value === "" ? None19 : _v._tag === "Some" ? (({ value: name }) => Some19(name))(_v) : _v._tag === "None" ? None19 : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get9(k, env.recs)), rowShapeKey$(row, env.vars));
var aliasNameFor = _curry21(2, aliasNameFor$);
var rowAliasName$ = (row, recs) => aliasNameFor$(row, recsEnv(recs));
var rowAliasName = _curry21(2, rowAliasName$);
var tsRow$ = (row, env) => _Option_match19(aliasNameFor$(row, env), () => (([fields, tail]) => {
  const body = length16(fields) === 0 ? "{}" : `{ ${_Str_join9("; ", fields)} }`;
  return _Option_match19(tail, () => body, (id) => _Option_match19(_Map_get9(id, env.vars), () => body, (name) => length16(fields) === 0 ? name : `(${body} & ${name})`));
})(tsRowFields$(row, env)), (alias) => alias);
var tsRow = _curry21(2, tsRow$);
var tsReturn$ = (t, env) => isUnit(t) ? "void" : tsOfRaw$(t, env);
var tsReturn = _curry21(2, tsReturn$);
var tsArrow$ = (fromT, toT, env) => isUnit(fromT) ? `() => ${tsReturn$(toT, env)}` : tsArrowParams$(fromT, toT, env, 0, []);
var tsArrow = _curry21(3, tsArrow$);
var tsArrowParams$ = (fromT, toT, env, i, params) => {
  const params1 = _Array_append15(`${_Str_fromCode2(97 + i)}: ${tsOfRaw$(fromT, env)}`, params);
  return ((_v) => _v._tag === "TyFn" && (({ from: nextFrom, to: nextTo }) => !isUnit(nextFrom))(_v) ? (({ from: nextFrom, to: nextTo }) => tsArrowParams$(nextFrom, nextTo, env, i + 1, params1))(_v) : `(${_Str_join9(", ", params1)}) => ${tsReturn$(toT, env)}`)(toT);
};
var tsArrowParams = _curry21(5, tsArrowParams$);
var tsOf$ = (t, env) => tsOfRaw$(widenLits(t), env);
var tsOf = _curry21(2, tsOf$);
var tsOfRaw$ = (t, env) => ((_v) => _v._tag === "TyVar" ? (({ id }) => _Option_unwrapOr12("unknown", _Map_get9(id, env.vars)))(_v) : _v._tag === "TyCon" && _v.name === "Array" && _v.args.length === 1 ? (({ args: [elem] }) => ((inner) => ((_v) => _v._tag === "TyCon" && _v.name === "Task" && _v.args.length === 2 ? `(${inner})[]` : _v._tag === "TyFn" ? `(${inner})[]` : _v._tag === "TyOneOf" ? `(${inner})[]` : `${inner}[]`)(elem))(tsOfRaw$(elem, env)))(_v) : _v._tag === "TyCon" && _v.name === "List" && _v.args.length === 1 ? (({ args: [elem] }) => `Iterable<${tsOfRaw$(elem, env)}>`)(_v) : _v._tag === "TyCon" && _v.name === "Dict" && _v.args.length === 1 ? (({ args: [elem] }) => `Record<string, ${tsOfRaw$(elem, env)}>`)(_v) : _v._tag === "TyCon" && _v.name === "Task" && _v.args.length === 2 ? (({ args: [value, error] }) => `() => Promise<Result<${tsOfRaw$(value, env)}, ${tsOfRaw$(error, env)}>>`)(_v) : _v._tag === "TyCon" && _v.name === "tuple" ? (({ args: elems }) => `[${namesOf$(elems, env)}]`)(_v) : _v._tag === "TyCon" ? (({ name, args }) => nominal$(name, args, env))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => tsArrow$(fromT, toT, env))(_v) : _v._tag === "TyRecord" ? (({ row }) => tsRow$(row, env))(_v) : _v._tag === "TySingleton" && _v.base === "string" ? (({ value }) => `"${value}"`)(_v) : _v._tag === "TySingleton" ? (({ value }) => value)(_v) : _v._tag === "TyOneOf" ? (({ members }) => _Str_join9(" | ", map13((m) => tsOfRaw$(m, env), members)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(t);
var tsOfRaw = _curry21(2, tsOfRaw$);
var isDigitChar = (ch) => _Option_match19(_Str_codeAt8(0, ch), () => false, (n) => and13(n >= 48, n <= 57));
var isUpperChar = (ch) => _Option_match19(_Str_codeAt8(0, ch), () => false, (n) => and13(n >= 65, n <= 90));
var allDigitsFrom$ = (s, i) => i >= _Str_length7(s) ? i > 1 : and13(isDigitChar(_Str_slice4(i, i + 1, s)), allDigitsFrom$(s, i + 1));
var allDigitsFrom = _curry21(2, allDigitsFrom$);
var isTypeLetter = (s) => _Str_length7(s) === 1 ? isUpperChar(s) : and13(and13(_Str_length7(s) > 1, _Str_slice4(0, 1, s) === "T"), allDigitsFrom$(s, 1));
var depthStep$ = (s, i, depth) => {
  const ch = _Str_slice4(i, i + 1, s);
  return or12(or12(or12(ch === "<", ch === "{"), ch === "("), ch === "[") ? depth + 1 : or12(or12(ch === "}", ch === ")"), ch === "]") ? depth - 1 : and13(ch === ">", or12(i === 0, _Str_slice4(i - 1, i, s) !== "=")) ? depth - 1 : depth;
};
var depthStep = _curry21(3, depthStep$);
var hasSuffix$ = (suf, s) => {
  const n = _Str_length7(suf);
  const m = _Str_length7(s);
  return and13(m >= n, eq17(_Str_slice4(m - n, m, s), suf));
};
var hasSuffix = _curry21(2, hasSuffix$);
var splitTop$ = (sep, s) => splitTopAt$(sep, s, 0, 0, 0, []);
var splitTop = _curry21(2, splitTop$);
var splitTopAt$ = (sep, s, i, depth, start, acc) => i >= _Str_length7(s) ? _Array_append15(_Str_slice4(start, _Str_length7(s), s), acc) : ((n) => and13(and13(depth === 0, i + n <= _Str_length7(s)), eq17(_Str_slice4(i, i + n, s), sep)) ? splitTopAt$(sep, s, i + n, 0, i + n, _Array_append15(_Str_slice4(start, i, s), acc)) : splitTopAt$(sep, s, i + 1, depthStep$(s, i, depth), start, acc))(_Str_length7(sep));
var splitTopAt = _curry21(6, splitTopAt$);
var findTop$ = (ch, s, i, depth) => i >= _Str_length7(s) ? None19 : and13(depth === 0, eq17(_Str_slice4(i, i + 1, s), ch)) ? Some19(i) : findTop$(ch, s, i + 1, depthStep$(s, i, depth));
var findTop = _curry21(4, findTop$);
var bindLetter = _curry21(3, (letter, concrete, subst) => _Option_match19(_Map_get9(letter, subst), () => Some19(_Map_set8(letter, concrete, subst)), (prev) => eq17(prev, concrete) ? Some19(subst) : None19));
var agreeList$ = (useTs, aliasTs, subst, i) => !eq17(length16(useTs), length16(aliasTs)) ? None19 : i >= length16(useTs) ? Some19(subst) : _Option_match19(_Array_get18(i, useTs), () => None19, (u) => _Option_match19(_Array_get18(i, aliasTs), () => None19, (a) => _Option_match19(typesAgree$(u, a, subst), () => None19, (subst1) => agreeList$(useTs, aliasTs, subst1, i + 1))));
var agreeList = _curry21(4, agreeList$);
var peelApp = (s) => _Option_match19(findTop$("<", s, 0, 0), () => None19, (i) => and13(hasSuffix$(">", s), i > 0) ? Some19({ name: _Str_slice4(0, i, s), args: _Str_slice4(i + 1, _Str_length7(s) - 1, s) }) : None19);
var wrapped$ = (open, close, s) => and13(and13(_Str_startsWith5(open, s), hasSuffix$(close, s)), _Str_length7(s) >= 2);
var wrapped = _curry21(3, wrapped$);
var innerOf = (s) => _Str_slice4(1, _Str_length7(s) - 1, s);
var stripParens = (s) => wrapped$("(", ")", s) ? _Str_slice4(1, _Str_length7(s) - 1, s) : s;
var agreeArray$ = (useT, aliasT, subst) => and13(hasSuffix$("[]", useT), hasSuffix$("[]", aliasT)) ? typesAgree$(stripParens(_Str_slice4(0, _Str_length7(useT) - 2, useT)), stripParens(_Str_slice4(0, _Str_length7(aliasT) - 2, aliasT)), subst) : None19;
var agreeArray = _curry21(3, agreeArray$);
var agreeApp$ = (useT, aliasT, subst) => _Option_match19(peelApp(useT), () => None19, (u) => _Option_match19(peelApp(aliasT), () => None19, (a) => eq17(u.name, a.name) ? agreeList$(splitTop$(", ", u.args), splitTop$(", ", a.args), subst, 0) : None19));
var agreeApp = _curry21(3, agreeApp$);
var splitLabel = (s) => _Option_match19(findTop$(":", s, 0, 0), () => None19, (i) => Some19({ label: _Str_slice4(0, i, s), ty: _Str_slice4(i + 1, _Str_length7(s), s) }));
var fieldAgree$ = (useF, aliasF, subst) => _Option_match19(splitLabel(useF), () => None19, (u) => _Option_match19(splitLabel(aliasF), () => None19, (a) => eq17(_Str_trim(u.label), _Str_trim(a.label)) ? typesAgree$(_Str_trim(u.ty), _Str_trim(a.ty), subst) : None19));
var fieldAgree = _curry21(3, fieldAgree$);
var fieldsAgree$ = (useFs, aliasFs, subst) => agreeFields$(useFs, aliasFs, subst, 0);
var fieldsAgree = _curry21(3, fieldsAgree$);
var agreeFields$ = (useFs, aliasFs, subst, i) => !eq17(length16(useFs), length16(aliasFs)) ? None19 : i >= length16(useFs) ? Some19(subst) : _Option_match19(_Array_get18(i, useFs), () => None19, (u) => _Option_match19(_Array_get18(i, aliasFs), () => None19, (a) => _Option_match19(fieldAgree$(u, a, subst), () => None19, (subst1) => agreeFields$(useFs, aliasFs, subst1, i + 1))));
var agreeFields = _curry21(4, agreeFields$);
var agreeBrace$ = (useT, aliasT, subst) => and13(wrapped$("{", "}", useT), wrapped$("{", "}", aliasT)) ? fieldsAgree$(splitTop$("; ", innerOf(useT)), splitTop$("; ", innerOf(aliasT)), subst) : None19;
var agreeBrace = _curry21(3, agreeBrace$);
var agreeTuple$ = (useT, aliasT, subst) => and13(wrapped$("[", "]", useT), wrapped$("[", "]", aliasT)) ? agreeList$(splitTop$(", ", innerOf(useT)), splitTop$(", ", innerOf(aliasT)), subst, 0) : None19;
var agreeTuple = _curry21(3, agreeTuple$);
var agreeUnion$ = (useT, aliasT, subst) => {
  const us = splitTop$(" | ", useT);
  const als = splitTop$(" | ", aliasT);
  return and13(length16(us) > 1, eq17(length16(us), length16(als))) ? agreeList$(us, als, subst, 0) : None19;
};
var agreeUnion = _curry21(3, agreeUnion$);
var firstSome2 = _curry21(2, (a, b) => _Option_match19(a, () => b, () => a));
var typesAgree$ = (useT, aliasT, subst) => eq17(useT, aliasT) ? Some19(subst) : isTypeLetter(useT) ? bindLetter(useT, aliasT, subst) : firstSome2(agreeArray$(useT, aliasT, subst), firstSome2(agreeApp$(useT, aliasT, subst), firstSome2(agreeBrace$(useT, aliasT, subst), firstSome2(agreeTuple$(useT, aliasT, subst), agreeUnion$(useT, aliasT, subst)))));
var typesAgree = _curry21(3, typesAgree$);
var uniqueSubst$ = (useKey, keys, i, found) => _Option_match19(_Array_get18(i, keys), () => found, (k) => _Option_match19(fieldsAgree$(splitTop$("; ", useKey), splitTop$("; ", k), new Map), () => uniqueSubst$(useKey, keys, i + 1, found), (subst) => _Option_match19(found, () => uniqueSubst$(useKey, keys, i + 1, Some19(subst)), () => uniqueSubst$(useKey, keys, i + 1, Some19(new Map([["*", ""]]))))));
var uniqueSubst = _curry21(4, uniqueSubst$);
var substOf = _curry21(2, (useKey, env) => _Option_match19(uniqueSubst$(useKey, _Map_keys8(env.recs), 0, None19), () => None19, (subst) => _Map_has7("*", subst) ? None19 : Some19(subst)));
var idForLetter = _curry21(4, (letter, ids, vars, i) => _Option_match19(_Array_get18(i, ids), () => None19, (id) => _Option_match19(_Map_get9(id, vars), () => idForLetter(letter, ids, vars, i + 1), (name) => eq17(name, letter) ? Some19(id) : idForLetter(letter, ids, vars, i + 1))));
var notePin = _curry21(3, (id, concrete, st) => _Set_has6(id, st.bad) ? st : _Option_match19(_Map_get9(id, st.pins), () => ({ pins: _Map_set8(id, concrete, st.pins), bad: st.bad }), (prev) => eq17(prev, concrete) ? st : { pins: _Map_delete2(id, st.pins), bad: _Set_add7(id, st.bad) }));
var mergeSubst = _curry21(6, (letters, subst, vars, ids, st, i) => _Option_match19(_Array_get18(i, letters), () => st, (letter) => _Option_match19(_Map_get9(letter, subst), () => mergeSubst(letters, subst, vars, ids, st, i + 1), (concrete) => _Option_match19(idForLetter(letter, ids, vars, 0), () => mergeSubst(letters, subst, vars, ids, st, i + 1), (id) => mergeSubst(letters, subst, vars, ids, notePin(id, concrete, st), i + 1)))));
var emptyPins = { pins: new Map([]), bad: _Set_fromArray7([]) };
var considerClosed = _curry21(3, (row, env, st) => _Option_match19(rowShapeKey$(row, env.vars), () => st, (key) => _Option_match19(_Map_get9(key, env.recs), () => _Option_match19(substOf(key, env), () => st, (subst) => mergeSubst(_Map_keys8(subst), subst, env.vars, _Map_keys8(env.vars), st, 0)), () => st)));
var pinInTys = _curry21(4, (ts, env, st, i) => _Option_match19(_Array_get18(i, ts), () => st, (t) => pinInTys(ts, env, pinInTy(t, env, st), i + 1)));
var pinInRow = _curry21(3, (row, env, st) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { fieldType: ft, rest } = $match;
      return pinInRow(rest, env, pinInTy(ft, env, st));
    }
    default: {
      return st;
    }
  }
});
var pinInTy = _curry21(3, (t, env, st) => {
  const $match = t;
  switch ($match._tag) {
    case "TyRecord": {
      const { row } = $match;
      return pinInRow(row, env, considerClosed(row, env, st));
    }
    case "TyFn": {
      const { from: a, to: b } = $match;
      return pinInTy(b, env, pinInTy(a, env, st));
    }
    case "TyCon": {
      const { args } = $match;
      return pinInTys(args, env, st, 0);
    }
    case "TyOneOf": {
      const { members: ms } = $match;
      return pinInTys(ms, env, st, 0);
    }
    default: {
      return st;
    }
  }
});
var pinAliasVars = _curry21(2, (t, env) => pinInTy(t, env, emptyPins).pins);
var overlayPins = _curry21(4, (ids, pins, names, i) => _Option_match19(_Array_get18(i, ids), () => names, (id) => _Option_match19(_Map_get9(id, pins), () => overlayPins(ids, pins, names, i + 1), (concrete) => overlayPins(ids, pins, _Map_set8(id, concrete, names), i + 1))));
var headLetters = _curry21(2, (names, pins) => {
  const letters = map13((id) => _Option_unwrapOr12("", _Map_get9(id, names)), filter8((id) => !_Map_has7(id, pins), _Map_keys8(names)));
  return length16(letters) === 0 ? "" : `<${_Str_join9(", ", letters)}>`;
});
var schemeRender = _curry21(2, (sc, recs) => {
  const names = genericNames(sc);
  const pins = pinAliasVars(sc.ty, tsEnv$(names, recs));
  return { env: tsEnv$(overlayPins(_Map_keys8(pins), pins, names, 0), recs), head: headLetters(names, pins), pins };
});

var paramVarsFrom = _curry22(2, (params, i) => _Option_match20(_Array_get19(i, params), () => new Map, (p) => _Map_set9(p, tVar(i), paramVarsFrom(params, i + 1))));
var paramNamesFrom = _curry22(2, (params, i) => _Option_match20(_Array_get19(i, params), () => new Map, () => _Map_set9(i, letterAt(i), paramNamesFrom(params, i + 1))));
var genericHead = _curry22(3, (params, i, acc) => _Option_match20(_Array_get19(i, params), () => length17(acc) === 0 ? "" : `<${_Str_join10(", ", acc)}>`, () => genericHead(params, i + 1, _Array_append16(letterAt(i), acc))));
var fieldTs$ = (te, params, aliases, recs) => {
  const vars = paramVarsFrom(params, 0);
  const names = paramNamesFrom(params, 0);
  return (([t, _vars, _st]) => tsOf(t, tsEnv(names, recs)))(typeExprToType(te, vars, mkSt(length17(params)), aliases, _Set_fromArray8([])));
};
var fieldTs = _curry22(4, fieldTs$);
var ctorFieldsFrom$ = (fields, keys, params, aliases, recs, i) => _Option_match20(_Array_get19(i, fields), () => [], (fld) => _Array_prepend10(`${_Option_unwrapOr13(`_${show10(i)}`, _Array_get19(i, keys))}: ${fieldTs$(fld.fieldType, params, aliases, recs)}`, ctorFieldsFrom$(fields, keys, params, aliases, recs, i + 1)));
var ctorFieldsFrom = _curry22(6, ctorFieldsFrom$);
var ctorVariant$ = (c, params, aliases, recs) => {
  const fields = ctorFieldsFrom$(c.fields, keysOf(c.fields), params, aliases, recs, 0);
  return length17(fields) === 0 ? `{ _tag: "${c.name}" }` : `{ _tag: "${c.name}"; ${_Str_join10("; ", fields)} }`;
};
var ctorVariant = _curry22(4, ctorVariant$);
var ctorVariantsFrom$ = (ctors, params, aliases, recs, i) => _Option_match20(_Array_get19(i, ctors), () => [], (c) => _Array_prepend10(`  | ${ctorVariant$(c, params, aliases, recs)}`, ctorVariantsFrom$(ctors, params, aliases, recs, i + 1)));
var ctorVariantsFrom = _curry22(5, ctorVariantsFrom$);
var typeDecl$ = (name, params, ctors, aliases, recs) => {
  const head = `${name}${genericHead(params, 0, [])}`;
  return `export type ${head} =
${_Str_join10(`
`, ctorVariantsFrom$(ctors, params, aliases, recs, 0))};`;
};
var typeDecl = _curry22(5, typeDecl$);
var aliasFieldsFrom$2 = (fields, params, aliases, recs, i) => _Option_match20(_Array_get19(i, fields), () => [], (f) => or13(f.spread, _Array_contains4(f.name, laterSpreadLabelsFrom$(fields, params, aliases, i + 1))) ? aliasFieldsFrom$2(fields, params, aliases, recs, i + 1) : _Array_prepend10(`${f.name}${f.optional ? "?" : ""}: ${fieldTs$(f.fieldType, params, aliases, recs)}`, aliasFieldsFrom$2(fields, params, aliases, recs, i + 1)));
var aliasFieldsFrom2 = _curry22(5, aliasFieldsFrom$2);
var spreadLabelsOf$ = (te, params, aliases) => (([t, _vars, _st]) => {
  const $match = t;
  switch ($match._tag) {
    case "TyRecord": {
      const { row } = $match;
      return rowLabelsOf$(row, []);
    }
    default: {
      return [];
    }
  }
})(typeExprToType(te, paramVarsFrom(params, 0), mkSt(length17(params)), aliases, _Set_fromArray8([])));
var spreadLabelsOf = _curry22(3, spreadLabelsOf$);
var rowLabelsOf$ = (row, acc) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { label: l, rest } = $match;
      return rowLabelsOf$(rest, _Array_append16(l, acc));
    }
    default: {
      return acc;
    }
  }
};
var rowLabelsOf = _curry22(2, rowLabelsOf$);
var laterLabelsFrom$ = (fields, params, aliases, i) => _Option_match20(_Array_get19(i, fields), () => [], (f) => _Array_concat11(f.spread ? spreadLabelsOf$(f.fieldType, params, aliases) : [f.name], laterLabelsFrom$(fields, params, aliases, i + 1)));
var laterLabelsFrom = _curry22(4, laterLabelsFrom$);
var laterSpreadLabelsFrom$ = (fields, params, aliases, i) => _Option_match20(_Array_get19(i, fields), () => [], (f) => _Array_concat11(f.spread ? spreadLabelsOf$(f.fieldType, params, aliases) : [], laterSpreadLabelsFrom$(fields, params, aliases, i + 1)));
var laterSpreadLabelsFrom = _curry22(4, laterSpreadLabelsFrom$);
var spreadPartsFrom$ = (fields, params, aliases, recs, i) => _Option_match20(_Array_get19(i, fields), () => [], (f) => {
  const rest = spreadPartsFrom$(fields, params, aliases, recs, i + 1);
  return f.spread ? ((own) => ((shadowed) => _Array_prepend10(length17(shadowed) === 0 ? own : `Omit<${own}, ${_Str_join10(" | ", map14((l) => `"${l}"`, shadowed))}>`, rest))(filter9((l) => _Array_contains4(l, laterLabelsFrom$(fields, params, aliases, i + 1)), spreadLabelsOf$(f.fieldType, params, aliases))))(fieldTs$(f.fieldType, params, aliases, recs)) : rest;
});
var spreadPartsFrom = _curry22(5, spreadPartsFrom$);
var recordAliasDecl$ = (name, params, fields, aliases, recs) => {
  const head = `${name}${genericHead(params, 0, [])}`;
  const body = aliasFieldsFrom$2(fields, params, aliases, recs, 0);
  const spreads = spreadPartsFrom$(fields, params, aliases, recs, 0);
  const own = length17(body) === 0 ? length17(spreads) === 0 ? ["{}"] : [] : [`{ ${_Str_join10("; ", body)} }`];
  return `export type ${head} = ${_Str_join10(" & ", _Array_concat11(spreads, own))};`;
};
var recordAliasDecl = _curry22(5, recordAliasDecl$);
var aliasTsDecl$ = (name, params, template, aliases, recs) => {
  const head = `${name}${genericHead(params, 0, [])}`;
  return `export type ${head} = ${fieldTs$(template, params, aliases, recs)};`;
};
var aliasTsDecl = _curry22(5, aliasTsDecl$);
var opaqueTypeDecl = (name) => `declare const ${name}: unique symbol;
export type ${name} = { readonly [${name}]: never };`;
var mergeInto = _curry22(4, (keys, src, acc, i) => _Option_match20(_Array_get19(i, keys), () => acc, (k) => mergeInto(keys, src, _Option_match20(_Map_get10(k, src), () => acc, (v) => _Map_set9(k, v, acc)), i + 1)));
var unionNamesFrom = _curry22(3, (schemes, i, acc) => _Option_match20(_Array_get19(i, schemes), () => acc, (sc) => {
  const names = genericNames(sc);
  return unionNamesFrom(schemes, i + 1, mergeInto(_Map_keys9(names), names, acc, 0));
}));
var allVarsIn = _curry22(2, (t, names) => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return _Option_isSome6(_Map_get10(id, names));
    }
    case "TyCon": {
      const { args } = $match;
      return allVarsInAll(args, names, 0);
    }
    case "TyFn": {
      const { from: fromT, to: toT } = $match;
      return and14(allVarsIn(fromT, names), allVarsIn(toT, names));
    }
    case "TyRecord": {
      const { row } = $match;
      return allVarsInRow(row, names);
    }
    case "TySingleton": {
      return true;
    }
    case "TyOneOf": {
      const { members } = $match;
      return allVarsInAll(members, names, 0);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
var allVarsInAll = _curry22(3, (ts, names, i) => _Option_match20(_Array_get19(i, ts), () => true, (t) => and14(allVarsIn(t, names), allVarsInAll(ts, names, i + 1))));
var allVarsInRow = _curry22(2, (row, names) => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return true;
    }
    case "RowVar": {
      const { id } = $match;
      return _Option_isSome6(_Map_get10(id, names));
    }
    case "RowExtend": {
      const { fieldType, rest } = $match;
      return and14(allVarsIn(fieldType, names), allVarsInRow(rest, names));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
});
var isConcrete2 = (t) => allVarsIn(t, new Map([]));
var emptyCollTs$ = (t, env) => allVarsIn(t, env.vars) ? Some20(tsOf(t, env)) : None20;
var emptyCollTs = _curry22(2, emptyCollTs$);
var ctorCallTs$ = (t, recs) => {
  const $match = t;
  switch ($match._tag) {
    case "TyCon": {
      const { args } = $match;
      return or13(length17(args) === 0, !isConcrete2(t)) ? None20 : Some20(tsOf(t, recsEnv(recs)));
    }
    default: {
      return None20;
    }
  }
};
var ctorCallTs = _curry22(2, ctorCallTs$);
var guardParamTs$ = (t, recs) => isConcrete2(t) ? Some20(tsOf(t, recsEnv(recs))) : None20;
var guardParamTs = _curry22(2, guardParamTs$);
var lambdaParamsFrom$ = (t, arity, env, i) => i >= arity ? [] : ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => _Array_prepend10(allVarsIn(fromT, env.vars) ? Some20(tsOf(fromT, env)) : isConcrete2(fromT) ? Some20(tsOf(fromT, recsEnv(env.recs))) : None20, lambdaParamsFrom$(toT, arity, env, i + 1)))(_v) : _Array_prepend10(None20, lambdaParamsFrom$(t, arity, env, i + 1)))(t);
var lambdaParamsFrom = _curry22(4, lambdaParamsFrom$);
var lambdaParamTypesTs$ = (lamType, arity, env) => lambdaParamsFrom$(lamType, arity, env, 0);
var lambdaParamTypesTs = _curry22(3, lambdaParamTypesTs$);
var genericParamsFrom$ = (t, arity, env, i) => i >= arity ? [] : ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => _Array_prepend10(Some20(tsOf(fromT, env)), genericParamsFrom$(toT, arity, env, i + 1)))(_v) : _Array_prepend10(None20, genericParamsFrom$(t, arity, env, i + 1)))(t);
var genericParamsFrom = _curry22(4, genericParamsFrom$);
var genericLambdaParams = _curry22(3, (sc, arity, recs) => _Map_size2(genericNames(sc)) === 0 ? None20 : ((rendered) => Some20({ generics: rendered.head, params: genericParamsFrom$(sc.ty, arity, rendered.env, 0) }))(schemeRender(sc, recs)));
var neverArgs = _curry22(3, (params, i, acc) => _Option_match20(_Array_get19(i, params), () => acc, () => neverArgs(params, i + 1, _Array_append16("never", acc))));
var ctorParamTypes$ = (fields, params, aliases, recs, i) => _Option_match20(_Array_get19(i, fields), () => [], (fld) => _Array_prepend10(fieldTs$(fld.fieldType, params, aliases, recs), ctorParamTypes$(fields, params, aliases, recs, i + 1)));
var ctorParamTypes = _curry22(5, ctorParamTypes$);
var ctorFactoryTs$ = (typeName, params, c, aliases, recs) => {
  const head = genericHead(params, 0, []);
  const monos = neverArgs(params, 0, []);
  return { generics: head, paramTypes: ctorParamTypes$(c.fields, params, aliases, recs, 0), ret: `${typeName}${head}`, retMono: length17(monos) === 0 ? typeName : `${typeName}<${_Str_join10(", ", monos)}>` };
};
var ctorFactoryTs = _curry22(5, ctorFactoryTs$);
var paramDeclName = _curry22(2, (p, i) => {
  const $match = p;
  switch ($match._tag) {
    case "LPSpanned": {
      const { param: inner } = $match;
      return paramDeclName(inner, i);
    }
    case "LPName": {
      const { name } = $match;
      return name;
    }
    case "LPLabeled": {
      return "$lab";
    }
    default: {
      return `_${show10(i)}`;
    }
  }
});
var compositions = (n) => n === 0 ? [[]] : compositionsFrom$(n, 1);
var compositionsFrom$ = (n, k) => k > n ? [] : _Array_concat11(map14(_Array_prepend10(k), compositions(n - k)), compositionsFrom$(n, k + 1));
var compositionsFrom = _curry22(2, compositionsFrom$);
var sliceGroups = _curry22(4, (params, groups, i, at) => _Option_match20(_Array_get19(i, groups), () => [], (g) => _Array_prepend10(_Array_take4(g, _Array_drop3(at, params)), sliceGroups(params, groups, i + 1, at + g))));
var curriedTail$ = (slices, i, acc) => i < 1 ? acc : curriedTail$(slices, i - 1, `(${_Str_join10(", ", _Option_unwrapOr13([], _Array_get19(i, slices)))}) => ${acc}`);
var curriedTail = _curry22(3, curriedTail$);
var overloadSig$ = (head, params, ret, groups) => {
  const slices = sliceGroups(params, groups, 0, 0);
  const tail = curriedTail$(slices, length17(slices) - 1, ret);
  return `${head}(${_Str_join10(", ", _Option_unwrapOr13([], _Array_get19(0, slices)))}): ${tail};`;
};
var overloadSig = _curry22(4, overloadSig$);
var curriedOverloads$ = (head, params, ret) => length17(params) <= 1 ? `${head}(${_Str_join10(", ", params)}) => ${ret}` : `{ ${_Str_join10(" ", map14(overloadSig(head, params, ret), _Array_sortBy((g) => 0 - length17(g), compositions(length17(params)))))} }`;
var curriedOverloads = _curry22(3, curriedOverloads$);
var curriedFnType$ = (params, ret) => length17(params) <= 1 ? `(${_Str_join10(", ", params)}) => ${ret}` : `_Curry<[${_Str_join10(", ", params)}], ${ret}>`;
var curriedFnType = _curry22(2, curriedFnType$);
var flatParamsFrom$ = (t, value, env, n, acc) => {
  const $match = value;
  switch ($match._tag) {
    case "ELambda": {
      const { params, body } = $match;
      return length17(params) === 0 ? ((next) => flatParamsFrom$(next, body, env, n, acc))(((_v) => _v._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_v) ? (({ from: fromT, to: toT }) => toT)(_v) : t)(t)) : (([t1, n1, acc1]) => flatParamsFrom$(t1, body, env, n1, acc1))(takeParams$(t, params, env, 0, n, acc));
    }
    default: {
      return _tuple11(acc, tsOf(t, env));
    }
  }
};
var flatParamsFrom = _curry22(5, flatParamsFrom$);
var takeParams$ = (t, params, env, i, n, acc) => _Option_match20(_Array_get19(i, params), () => _tuple11(t, n, acc), (p) => {
  const $match = t;
  switch ($match._tag) {
    case "TyFn": {
      const { from: fromT, to: toT } = $match;
      return takeParams$(toT, params, env, i + 1, n + 1, _Array_append16(`${paramDeclName(p, n)}: ${tsOf(fromT, env)}`, acc));
    }
    default: {
      return _tuple11(t, n, acc);
    }
  }
});
var takeParams = _curry22(6, takeParams$);
var declType$ = (t, value, env) => {
  const $match = value;
  switch ($match._tag) {
    case "ELambda": {
      const { params, body } = $match;
      return length17(params) === 0 ? ((next) => `() => ${declType$(next, body, env)}`)(((_v) => _v._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_v) ? (({ from: fromT, to: toT }) => toT)(_v) : t)(t)) : (([t1, _n, ps]) => `(${_Str_join10(", ", ps)}) => ${declType$(t1, body, env)}`)(takeParams$(t, params, env, 0, 0, []));
    }
    default: {
      return tsOf(t, env);
    }
  }
};
var declType = _curry22(3, declType$);
var tsApiFor = (recs) => ({ tsType: (t) => tsOf(t, recsEnv(recs)), aliasOf: (row) => rowAliasName(row, recs) });
var bindingTsType = _curry22(4, (sc, value, recs, bindingHooks) => _Option_match20(runBindingHooks(bindingHooks, value, sc.ty, tsApiFor(recs)), () => coreBindingTsType(sc, value, recs), (ts) => ts));
var rawReturnTs = _curry22(3, (sc, value, recs) => {
  const rendered = schemeRender(sc, recs);
  return rendered.head === "" ? (([_params, ret]) => Some20(`: ${ret}`))(flatParamsFrom$(sc.ty, value, rendered.env, 0, [])) : None20;
});
var coreBindingTsType = _curry22(3, (sc, value, recs) => {
  const rendered = schemeRender(sc, recs);
  const $match = value;
  switch ($match._tag) {
    case "ELambda": {
      return rendered.head === "" ? (([params, ret]) => curriedFnType$(params, ret))(flatParamsFrom$(sc.ty, value, rendered.env, 0, [])) : `${rendered.head}${declType$(sc.ty, value, rendered.env)}`;
    }
    default: {
      return tsOf(sc.ty, tsEnv(rendered.pins, recs));
    }
  }
});
var spanKey = (sp) => `${show10(sp.start)}:${show10(sp.end)}`;
var typeAtFrom = _curry22(3, (types, i, acc) => _Option_match20(_Array_get19(i, types), () => acc, (r) => typeAtFrom(types, i + 1, _Map_set9(spanKey(r.span), r.ty, acc))));
var typeAtTable = (types) => typeAtFrom(types, 0, new Map);
var consInTy$ = (t, acc) => ((_v) => _v._tag === "TyCon" && _v.name === "Task" && _v.args.length === 2 ? (({ args: [value, error] }) => consInTy$(error, consInTy$(value, _Set_add8("Result", _Set_add8("Task", acc)))))(_v) : _v._tag === "TyCon" ? (({ name, args }) => consInAll$(args, _Set_add8(name, acc), 0))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => consInTy$(toT, consInTy$(fromT, acc)))(_v) : _v._tag === "TyRecord" ? (({ row }) => consInRow$(row, acc))(_v) : _v._tag === "TyOneOf" ? (({ members }) => consInAll$(members, acc, 0))(_v) : acc)(t);
var consInTy = _curry22(2, consInTy$);
var consInAll$ = (ts, acc, i) => _Option_match20(_Array_get19(i, ts), () => acc, (t) => consInAll$(ts, consInTy$(t, acc), i + 1));
var consInAll = _curry22(3, consInAll$);
var consInRow$ = (row, acc) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { fieldType, rest } = $match;
      return consInRow$(rest, consInTy$(fieldType, acc));
    }
    default: {
      return acc;
    }
  }
};
var consInRow = _curry22(2, consInRow$);
var declaredTypeNames$ = (stmts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { name } }) => declaredTypeNames$(stmts, i + 1, _Set_add8(name, acc)))(_v) : _v._tag === "Some" ? declaredTypeNames$(stmts, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, stmts));
var declaredTypeNames = _curry22(3, declaredTypeNames$);
var nullaryLocalNames$ = (stmts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.alias._tag === "Some" ? (({ value: { name, params, alias: { value: fields } } }) => nullaryLocalNames$(stmts, i + 1, and14(length17(params) === 0, length17(fields) > 0) ? _Set_add8(name, acc) : acc))(_v) : _v._tag === "Some" ? nullaryLocalNames$(stmts, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, stmts));
var nullaryLocalNames = _curry22(3, nullaryLocalNames$);
var referencedCons = _curry22(4, (stmts, env, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { name } }) => referencedCons(stmts, env, i + 1, _Str_startsWith6("$", name) ? acc : _Option_match20(_Map_get10(name, env), () => acc, (sc) => consInTy$(sc.ty, acc))))(_v) : _v._tag === "Some" ? referencedCons(stmts, env, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, stmts)));
var builtinTypeNamesFor$ = (declared, wanted, body, i) => _Option_match20(_Array_get19(i, builtinTypeDecls), () => [], (bt) => {
  const rest = builtinTypeNamesFor$(declared, wanted, body, i + 1);
  return and14(!_Set_has7(bt.name, declared), or13(_Set_has7(bt.name, wanted), _Str_contains2(bt.name, body))) ? _Array_prepend10(bt.name, rest) : rest;
});
var builtinTypeNamesFor = _curry22(4, builtinTypeNamesFor$);
var aliasRowOf$ = (fields, aliases, i) => _Option_match20(_Array_get19(i, fields), () => RowEmpty, (f) => (([t, _vars, _st]) => {
  const rest = aliasRowOf$(fields, aliases, i + 1);
  return f.spread ? spreadRowInto(t, rest) : rowHasLabel(f.name, rest) ? rest : RowExtend(f.name, t, f.optional, rest);
})(typeExprToType(f.fieldType, new Map, mkSt(0), aliases, _Set_fromArray8([]))));
var aliasRowOf = _curry22(3, aliasRowOf$);
var aliasShapeKey$ = (fields, aliases) => rowShapeKey(aliasRowOf$(fields, aliases, 0), new Map);
var aliasShapeKey = _curry22(2, aliasShapeKey$);
var bareName = (name) => {
  const parts = _Str_split6(".", name);
  return _Option_unwrapOr13(name, _Array_get19(length17(parts) - 1, parts));
};
var indexAlias = _curry22(4, (key, name, aliases, acc) => _Option_match20(_Map_get10(key, aliases), () => acc, (info) => _Option_match20(info.expr, () => or13(length17(info.params) !== 0, length17(info.fields) === 0) ? acc : _Option_match20(aliasShapeKey$(info.fields, aliases), () => acc, (k) => _Map_set9(k, name, acc)), () => acc)));
var recordAliasIndexFrom$ = (keys, aliases, i, acc) => _Option_match20(_Array_get19(i, keys), () => acc, (key) => recordAliasIndexFrom$(keys, aliases, i + 1, indexAlias(key, bareName(key), aliases, acc)));
var recordAliasIndexFrom = _curry22(4, recordAliasIndexFrom$);
var recordAliasIndex = (aliases) => recordAliasIndexFrom$(_Array_sort2(_Map_keys9(aliases)), aliases, 0, new Map);
var parameterizedBares$ = (keys, aliases, i, acc) => _Option_match20(_Array_get19(i, keys), () => acc, (key) => _Option_match20(_Map_get10(key, aliases), () => parameterizedBares$(keys, aliases, i + 1, acc), (info) => parameterizedBares$(keys, aliases, i + 1, length17(info.params) > 0 ? _Set_add8(bareName(key), acc) : acc)));
var parameterizedBares = _curry22(4, parameterizedBares$);
var printableName$ = (keys, shape, aliases, bad, acc, i) => _Option_match20(_Array_get19(i, keys), () => acc, (key) => {
  const bare = bareName(key);
  return _Option_match20(_Map_get10(key, aliases), () => printableName$(keys, shape, aliases, bad, acc, i + 1), (info) => printableName$(keys, shape, aliases, bad, _Option_match20(info.expr, () => or13(or13(_Set_has7(bare, bad), length17(info.params) !== 0), length17(info.fields) === 0) ? acc : _Option_match20(aliasShapeKey$(info.fields, aliases), () => acc, (k) => eq18(k, shape) ? bare : acc), () => acc), i + 1));
});
var printableName = _curry22(6, printableName$);
var dropAmbiguous$ = (keys, recs, aliases, bad, localNames, aliasKeys, i) => _Option_match20(_Array_get19(i, keys), () => recs, (k) => _Option_match20(_Map_get10(k, recs), () => dropAmbiguous$(keys, recs, aliases, bad, localNames, aliasKeys, i + 1), (name) => dropAmbiguous$(keys, and14(_Set_has7(name, bad), !_Set_has7(name, localNames)) ? _Map_set9(k, printableName$(aliasKeys, k, aliases, bad, "", 0), recs) : recs, aliases, bad, localNames, aliasKeys, i + 1)));
var dropAmbiguous = _curry22(7, dropAmbiguous$);
var withoutAmbiguousAlias$ = (recs, aliases, localNames) => {
  const aliasKeys = _Array_sort2(_Map_keys9(aliases));
  return dropAmbiguous$(_Map_keys9(recs), recs, aliases, parameterizedBares$(aliasKeys, aliases, 0, _Set_fromArray8([])), localNames, aliasKeys, 0);
};
var withoutAmbiguousAlias = _curry22(3, withoutAmbiguousAlias$);
var withoutOwnShape = _curry22(4, (fields, params, aliases, recs) => _Option_match20(_Array_get19(0, params), () => _Option_match20(aliasShapeKey$(fields, aliases), () => recs, (k) => _Map_delete3(k, recs)), () => recs));
var typeHeaderFrom$ = (stmts, aliases, recs, docs, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { name, params, ctors, alias, aliasType, doc } }) => ((rest) => ((docComment) => _Option_match20(alias, () => _Option_match20(aliasType, () => length17(ctors) === 0 ? _Array_prepend10(`declare const ${name}: unique symbol;
${docComment}type ${name} = { readonly [${name}]: never };`, rest) : _Array_prepend10(`${docComment}${typeDecl$(name, params, ctors, aliases, recs)}`, rest), (te) => _Array_prepend10(`${docComment}${aliasTsDecl$(name, params, te, aliases, recs)}`, rest)), (fields) => _Array_prepend10(`${docComment}${recordAliasDecl$(name, params, fields, aliases, withoutOwnShape(fields, params, aliases, recs))}`, rest)))(docs ? jsDoc(doc) : ""))(typeHeaderFrom$(stmts, aliases, recs, docs, i + 1)))(_v) : _v._tag === "Some" ? typeHeaderFrom$(stmts, aliases, recs, docs, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, stmts));
var typeHeaderFrom = _curry22(5, typeHeaderFrom$);
var genericLambdasFrom = _curry22(4, (stmts, env, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { name, value } }) => genericLambdasFrom(stmts, env, i + 1, ((_v) => _v._tag === "ELambda" && (({ span: sp }) => !_Str_startsWith6("$", name))(_v) ? (({ span: sp }) => _Option_match20(_Map_get10(name, env), () => acc, (sc) => or13(length17(sc.vars) > 0, length17(sc.rvars) > 0) ? _Map_set9(spanKey(sp), sc, acc) : acc))(_v) : acc)(value)))(_v) : _v._tag === "Some" ? genericLambdasFrom(stmts, env, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, stmts)));
var scopedSpans = (e) => {
  const $match = e;
  switch ($match._tag) {
    case "ELambda": {
      const { body, span: sp } = $match;
      return _Array_prepend10(sp, scopedSpans(body));
    }
    case "ECall": {
      const { fn, args } = $match;
      return _Array_concat11(scopedSpans(fn), scopedSpansAt$(args, 0));
    }
    case "ELetIn": {
      const { value, body } = $match;
      return _Array_concat11(scopedSpans(value), scopedSpans(body));
    }
    case "ELetBind": {
      const { value, body } = $match;
      return _Array_concat11(scopedSpans(value), scopedSpans(body));
    }
    case "EPipe": {
      const { left, right } = $match;
      return _Array_concat11(scopedSpans(left), scopedSpans(right));
    }
    case "EDo": {
      const { exprs } = $match;
      return scopedSpansAt$(exprs, 0);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return _Array_concat11(scopedSpans(cond), _Array_concat11(scopedSpans(thenE), scopedSpans(elseE)));
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return _Array_concat11(scopedSpans(scrutinee), scopedSpansInArms$(arms, 0));
    }
    case "ERecord": {
      const { fields, spread } = $match;
      return _Array_concat11(scopedSpansInFields$(fields, 0), _Option_match20(spread, () => [], (s) => scopedSpans(s)));
    }
    case "EField": {
      const { target, name, span: sp } = $match;
      const rest = scopedSpans(target);
      return and14(name === "empty", isRefExpr(target)) ? _Array_prepend10(sp, rest) : rest;
    }
    case "ETuple": {
      const { elements } = $match;
      return scopedSpansAt$(elements, 0);
    }
    case "EArr": {
      const { elements, span: sp } = $match;
      return scopedSpansInSeq$(elements, sp);
    }
    case "EList": {
      const { elements, span: sp } = $match;
      return scopedSpansInSeq$(elements, sp);
    }
    case "ESet": {
      const { elements, span: sp } = $match;
      return scopedSpansInSeq$(elements, sp);
    }
    case "EMap": {
      const { entries, span: sp } = $match;
      const inner = scopedSpansInEntries$(entries, 0);
      return length17(entries) === 0 ? _Array_prepend10(sp, inner) : inner;
    }
    case "ELoop": {
      const { params, body } = $match;
      return _Array_concat11(scopedSpansInLoop$(params, 0), scopedSpans(body));
    }
    case "ERecur": {
      const { args } = $match;
      return scopedSpansAt$(args, 0);
    }
    case "EInterp": {
      const { parts } = $match;
      return scopedSpansInParts$(parts, 0);
    }
    default: {
      return [];
    }
  }
};
var isRefExpr = (e) => {
  const $match = e;
  switch ($match._tag) {
    case "ERef": {
      return true;
    }
    default: {
      return false;
    }
  }
};
var scopedSpansAt$ = (exprs, i) => _Option_match20(_Array_get19(i, exprs), () => [], (e) => _Array_concat11(scopedSpans(e), scopedSpansAt$(exprs, i + 1)));
var scopedSpansAt = _curry22(2, scopedSpansAt$);
var scopedSpansInArms$ = (arms, i) => _Option_match20(_Array_get19(i, arms), () => [], (a) => _Array_concat11(_Option_match20(a.guard, () => [], (g) => scopedSpans(g)), _Array_concat11(scopedSpans(a.body), scopedSpansInArms$(arms, i + 1))));
var scopedSpansInArms = _curry22(2, scopedSpansInArms$);
var scopedSpansInFields$ = (fields, i) => _Option_match20(_Array_get19(i, fields), () => [], (f) => _Array_concat11(scopedSpans(f.value), scopedSpansInFields$(fields, i + 1)));
var scopedSpansInFields = _curry22(2, scopedSpansInFields$);
var scopedSpansInEntries$ = (entries, i) => _Option_match20(_Array_get19(i, entries), () => [], (en) => _Array_concat11(scopedSpans(en.key), _Array_concat11(scopedSpans(en.value), scopedSpansInEntries$(entries, i + 1))));
var scopedSpansInEntries = _curry22(2, scopedSpansInEntries$);
var scopedSpansInElems$ = (elements, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" && _v.value._tag === "SEExpr" ? (({ value: { expr: e } }) => _Array_concat11(scopedSpans(e), scopedSpansInElems$(elements, i + 1)))(_v) : _v._tag === "Some" && _v.value._tag === "SESpread" ? (({ value: { expr: e } }) => _Array_concat11(scopedSpans(e), scopedSpansInElems$(elements, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, elements));
var scopedSpansInElems = _curry22(2, scopedSpansInElems$);
var scopedSpansInSeq$ = (elements, sp) => {
  const inner = scopedSpansInElems$(elements, 0);
  return length17(elements) === 0 ? _Array_prepend10(sp, inner) : inner;
};
var scopedSpansInSeq = _curry22(2, scopedSpansInSeq$);
var scopedSpansInLoop$ = (params, i) => _Option_match20(_Array_get19(i, params), () => [], (p) => _Array_concat11(scopedSpans(p.init), scopedSpansInLoop$(params, i + 1)));
var scopedSpansInLoop = _curry22(2, scopedSpansInLoop$);
var scopedSpansInParts$ = (parts, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" && _v.value._tag === "IPExpr" ? (({ value: { expr: e } }) => _Array_concat11(scopedSpans(e), scopedSpansInParts$(parts, i + 1)))(_v) : _v._tag === "Some" ? scopedSpansInParts$(parts, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, parts));
var scopedSpansInParts = _curry22(2, scopedSpansInParts$);
var scopedNamesAt = _curry22(4, (spans, i, names, acc) => _Option_match20(_Array_get19(i, spans), () => acc, (sp) => scopedNamesAt(spans, i + 1, names, _Map_set9(spanKey(sp), names, acc))));
var scopedNamesFrom = _curry22(5, (stmts, env, recs, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { name, value } }) => scopedNamesFrom(stmts, env, recs, i + 1, ((_v) => _v._tag === "ELambda" && !_Str_startsWith6("$", name) ? _Option_match20(_Map_get10(name, env), () => acc, (sc) => or13(length17(sc.vars) > 0, length17(sc.rvars) > 0) ? scopedNamesAt(scopedSpans(value), 0, schemeRender(sc, recs).env.vars, acc) : acc) : acc)(value)))(_v) : _v._tag === "Some" ? scopedNamesFrom(stmts, env, recs, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, stmts)));
var tsGenOpts = _curry22(6, (stmts, env, types, letParams, aliases, bindingHooks) => {
  const typeAt = typeAtTable(types);
  const letParamAt = typeAtTable(letParams);
  const genericLams = genericLambdasFrom(stmts, env, 0, new Map);
  const recs = withoutAmbiguousAlias$(recordAliasIndex(aliases), aliases, nullaryLocalNames$(stmts, 0, _Set_fromArray8([])));
  const scopedNames = scopedNamesFrom(stmts, env, recs, 0, new Map);
  const typeOf = (e) => _Map_get10(spanKey(exprSpan3(e)), typeAt);
  const envAt = (key) => _Option_match20(_Map_get10(key, scopedNames), () => recsEnv(recs), (vars) => tsEnv(vars, recs));
  return { ...jsGenOpts, annotateLet: Some20(_curry22(2, (name, value) => _Str_startsWith6("$", name) ? None20 : ((_v) => _v._tag === "ELambda" ? _Option_match20(_Map_get10(name, env), () => None20, (sc) => Some20(`: ${bindingTsType(sc, value, recs, bindingHooks)}`)) : _Option_map3((ts) => `: ${ts}`, _Option_flatMap3((t) => emptyCollTs$(t, recsEnv(recs)), _Map_get10(spanKey(exprSpan3(value)), letParamAt))))(value))), annotateRaw: Some20(_curry22(2, (name, value) => _Str_startsWith6("$", name) ? None20 : ((_v) => _v._tag === "ELambda" ? _Option_match20(_Map_get10(name, env), () => None20, (sc) => rawReturnTs(sc, value, recs)) : None20)(value))), annotateCtor: Some20(_curry22(2, (s, c) => {
    const $match = s;
    switch ($match._tag) {
      case "SType": {
        const { name, params } = $match;
        return Some20(ctorFactoryTs$(name, params, c, aliases, recs));
      }
      default: {
        return None20;
      }
    }
  })), annotateParams: Some20(_curry22(2, (sp, arity) => _Option_match20(_Map_get10(spanKey(sp), genericLams), () => ({ generics: "", params: _Option_match20(_Map_get10(spanKey(sp), typeAt), () => [], (t) => lambdaParamTypesTs$(t, arity, envAt(spanKey(sp)))) }), (sc) => _Option_unwrapOr13({ generics: "", params: [] }, genericLambdaParams(sc, arity, recs))))), annotateEmpty: Some20((e) => {
    const key = spanKey(exprSpan3(e));
    return _Option_flatMap3((t) => emptyCollTs$(t, envAt(key)), _Map_get10(key, typeAt));
  }), annotateLetin: Some20((value) => _Option_flatMap3((t) => emptyCollTs$(t, recsEnv(recs)), _Map_get10(spanKey(exprSpan3(value)), letParamAt))), annotateCall: Some20((e) => _Option_flatMap3((t) => ctorCallTs$(t, recs), typeOf(e))), guardBaseType: Some20((e) => _Option_flatMap3((t) => guardParamTs$(t, recs), typeOf(e))), flattenPipe: true, tupleHelper: true, preserveInfix: true, preserveJsx: true, moduleExt: "" };
});
var anyOf = _curry22(2, (f, xs) => reduce6(_curry22(2, (acc, x) => or13(acc, f(x))), false, xs));
var hasJsxExpr = (e) => ((_v) => _v._tag === "ECall" && _v.origin._tag === "Some" && _v.origin.value === "jsx" ? true : _v._tag === "ECall" ? (({ fn, args }) => or13(hasJsxExpr(fn), anyOf(hasJsxExpr, args)))(_v) : _v._tag === "ELambda" ? (({ body }) => hasJsxExpr(body))(_v) : _v._tag === "ELetIn" ? (({ value, body }) => or13(hasJsxExpr(value), hasJsxExpr(body)))(_v) : _v._tag === "ELetBind" ? (({ value, body }) => or13(hasJsxExpr(value), hasJsxExpr(body)))(_v) : _v._tag === "EPipe" ? (({ left, right }) => or13(hasJsxExpr(left), hasJsxExpr(right)))(_v) : _v._tag === "EDo" ? (({ exprs }) => anyOf(hasJsxExpr, exprs))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => or13(or13(hasJsxExpr(cond), hasJsxExpr(thenE)), hasJsxExpr(elseE)))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => or13(hasJsxExpr(scrutinee), anyOf((a) => or13(_Option_match20(a.guard, () => false, (g) => hasJsxExpr(g)), hasJsxExpr(a.body)), arms)))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => or13(anyOf((f) => hasJsxExpr(f.value), fields), _Option_match20(spread, () => false, (value) => hasJsxExpr(value))))(_v) : _v._tag === "EField" ? (({ target }) => hasJsxExpr(target))(_v) : _v._tag === "ETuple" ? (({ elements }) => anyOf(hasJsxExpr, elements))(_v) : _v._tag === "EArr" ? (({ elements }) => anyOf((el) => {
  const $match = el;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: value } = $match;
      return hasJsxExpr(value);
    }
    case "SESpread": {
      const { expr: value } = $match;
      return hasJsxExpr(value);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
}, elements))(_v) : _v._tag === "EList" ? (({ elements }) => anyOf((el) => {
  const $match = el;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: value } = $match;
      return hasJsxExpr(value);
    }
    case "SESpread": {
      const { expr: value } = $match;
      return hasJsxExpr(value);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
}, elements))(_v) : _v._tag === "ESet" ? (({ elements }) => anyOf((el) => {
  const $match = el;
  switch ($match._tag) {
    case "SEExpr": {
      const { expr: value } = $match;
      return hasJsxExpr(value);
    }
    case "SESpread": {
      const { expr: value } = $match;
      return hasJsxExpr(value);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
}, elements))(_v) : _v._tag === "EMap" ? (({ entries }) => anyOf((entry) => or13(hasJsxExpr(entry.key), hasJsxExpr(entry.value)), entries))(_v) : _v._tag === "ELoop" ? (({ params, body }) => or13(anyOf((p) => hasJsxExpr(p.init), params), hasJsxExpr(body)))(_v) : _v._tag === "ERecur" ? (({ args }) => anyOf(hasJsxExpr, args))(_v) : _v._tag === "EInterp" ? (({ parts }) => anyOf((part) => {
  const $match = part;
  switch ($match._tag) {
    case "IPLit": {
      return false;
    }
    case "IPExpr": {
      const { expr: value } = $match;
      return hasJsxExpr(value);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
}, parts))(_v) : false)(e);
var hasJsxStmts = (stmts) => anyOf((stmt) => {
  const $match = stmt;
  switch ($match._tag) {
    case "SLet": {
      const { value } = $match;
      return hasJsxExpr(value);
    }
    case "SExpr": {
      const { value } = $match;
      return hasJsxExpr(value);
    }
    default: {
      return false;
    }
  }
}, stmts);
var emitTsModuleWith = _curry22(13, (stmts, env, types, letParams, aliases, imported, importLines, ns, jsDefs, runtimeDeps, runtimeImport, docs, bindingHooks) => {
  const declared = declaredTypeNames$(stmts, 0, _Set_fromArray8([]));
  const wanted = referencedCons(stmts, env, 0, _Set_fromArray8([]));
  const recs = withoutAmbiguousAlias$(recordAliasIndex(aliases), aliases, nullaryLocalNames$(stmts, 0, _Set_fromArray8([])));
  const typeHeader = typeHeaderFrom$(stmts, aliases, recs, docs, 0);
  const body = codegenWith(stmts, imported, false, ns, jsDefs, runtimeDeps, { ...tsGenOpts(stmts, env, types, letParams, aliases, bindingHooks), docs });
  const deps0 = runtimeDepNames(stmts, imported, ns, jsDefs, runtimeDeps);
  const deps = _Str_contains2("_tuple(", body) ? _Array_append16("_tuple", deps0) : deps0;
  return ((deps) => ((runtimeLine) => ((header) => ((typeDeps) => ((typeImportLine) => concat2(`${hasJsxStmts(stmts) ? `/** @jsx h */

` : ""}${_Str_join10(`

`, filter9((part) => part !== "", [_Str_join10(`
`, header), _Str_join10(`
`, importLines), typeImportLine, runtimeLine, body]))}`, `
`))(length17(typeDeps) === 0 ? "" : `import type { ${_Str_join10(", ", _Array_sort2(typeDeps))} } from "${runtimeImport}";`))(_Array_concat11(_Str_contains2("_Curry<", `${_Str_join10(`
`, header)}
${body}`) ? ["_Curry"] : [], builtinTypeNamesFor$(declared, wanted, body, 0))))(typeHeader))(length17(deps) === 0 ? "" : `import { ${_Str_join10(", ", _Array_sort2(deps))} } from "${runtimeImport}";`))(filter9((d) => or13(and14(and14(and14(and14(and14(and14(and14(and14(and14(d !== "add", d !== "sub"), d !== "mul"), d !== "div"), d !== "lt"), d !== "lte"), d !== "gt"), d !== "gte"), d !== "eq"), d !== "not"), _Str_contains2(d, body)), deps));
});
var emitTsModule = _curry22(11, (stmts, env, types, letParams, aliases, imported, importLines, ns, jsDefs, runtimeDeps, runtimeImport) => emitTsModuleWith(stmts, env, types, letParams, aliases, imported, importLines, ns, jsDefs, runtimeDeps, runtimeImport, true, bindingHooksFor(None20)));
var freeIdsIn$ = (t, acc) => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return _Array_contains4(id, acc) ? acc : _Array_append16(id, acc);
    }
    case "TyCon": {
      const { args } = $match;
      return freeIdsInAll$(args, acc);
    }
    case "TyFn": {
      const { from: fromT, to: toT } = $match;
      return freeIdsIn$(toT, freeIdsIn$(fromT, acc));
    }
    case "TyRecord": {
      const { row } = $match;
      return freeIdsInRow$(row, acc);
    }
    case "TySingleton": {
      return acc;
    }
    case "TyOneOf": {
      const { members } = $match;
      return freeIdsInAll$(members, acc);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var freeIdsIn = _curry22(2, freeIdsIn$);
var freeIdsInAll$ = (ts, acc) => reduce6(_curry22(2, (a, t) => freeIdsIn$(t, a)), acc, ts);
var freeIdsInAll = _curry22(2, freeIdsInAll$);
var freeIdsInRow$ = (row, acc) => {
  const $match = row;
  switch ($match._tag) {
    case "RowExtend": {
      const { fieldType, rest } = $match;
      return freeIdsInRow$(rest, freeIdsIn$(fieldType, acc));
    }
    default: {
      return acc;
    }
  }
};
var freeIdsInRow = _curry22(2, freeIdsInRow$);
var lettersFor = _curry22(3, (ids, i, acc) => _Option_match20(_Array_get19(i, ids), () => acc, (id) => lettersFor(ids, i + 1, _Map_set9(id, letterAt(i), acc))));
var anyFor = (ids) => reduce6(_curry22(2, (acc, id) => _Map_set9(id, "any", acc)), new Map, ids);
var genericHeadOf = _curry22(2, (ids, names) => length17(ids) === 0 ? "" : `<${_Str_join10(", ", _Map_values3(names))}>`);
var arrowCount = (t) => {
  const $match = t;
  switch ($match._tag) {
    case "TyFn": {
      const { to: toT } = $match;
      return 1 + arrowCount(toT);
    }
    default: {
      return 0;
    }
  }
};
var hostParams$ = (t, arity, names, i) => i >= arity ? [] : ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => _Array_prepend10(`${_Str_fromCode3(97 + i)}: ${tsOf(fromT, plainEnv(names))}`, hostParams$(toT, arity, names, i + 1)))(_v) : [])(t);
var hostParams = _curry22(4, hostParams$);
var hostReturn$ = (t, arity, i) => i >= arity ? t : ((_v) => _v._tag === "TyFn" ? (({ to: toT }) => hostReturn$(toT, arity, i + 1))(_v) : t)(t);
var hostReturn = _curry22(3, hostReturn$);
var curriedHostType$ = (t, arity) => {
  const ids = freeIdsIn$(t, []);
  const names = lettersFor(ids, 0, new Map);
  return `${genericHeadOf(ids, names)}${reduce6(_curry22(2, (acc, p) => `(${p}) => ${acc}`), tsOf(hostReturn$(t, arity, 0), plainEnv(names)), _Array_reverse(hostParams$(t, arity, names, 0)))}`;
};
var curriedHostType = _curry22(2, curriedHostType$);
var flatHostType$ = (t, arity) => {
  const ids = freeIdsIn$(t, []);
  const names = lettersFor(ids, 0, new Map);
  const head = genericHeadOf(ids, names);
  return arity === 0 ? `${head}${tsOf(t, plainEnv(names))}` : curriedOverloads$(head, hostParams$(t, arity, names, 0), tsOf(hostReturn$(t, arity, 0), plainEnv(names)));
};
var flatHostType = _curry22(2, flatHostType$);
var externDecl = (e) => {
  const t = e.scheme.ty;
  const n = arrowCount(t);
  return and14(n >= 1, e.curried) ? `export declare const ${e.imported}: ${curriedHostType$(t, n)};` : n === 0 ? `export declare const ${e.imported}: ${tsOf(t, plainEnv(anyFor(freeIdsIn$(t, []))))};` : `export declare const ${e.imported}: ${flatHostType$(t, n)};`;
};
var externModuleDts = _curry22(2, (externs, aliases) => {
  const wanted = reduce6(_curry22(2, (acc, e) => consInTy$(e.scheme.ty, acc)), _Set_fromArray8([]), externs);
  return concat2(_Str_join10(`
`, _Array_concat11(map14((bt) => typeDecl$(bt.name, bt.params, bt.ctors, aliases, new Map), filter9((bt) => _Set_has7(bt.name, wanted), builtinTypeDecls)), map14(externDecl, _Array_dedupeBy((e) => e.imported, externs)))), `
`);
});

import { None as None21, Some as Some21, _Array_append as _Array_append17, _Array_concat as _Array_concat12, _Array_contains as _Array_contains5, _Array_flatMap as _Array_flatMap7, _Array_get as _Array_get20, _Map_get as _Map_get11, _Map_keys as _Map_keys10, _Map_set as _Map_set10, _Map_size as _Map_size3, _Option_match as _Option_match21, _Str_codeAt as _Str_codeAt9, _Str_length as _Str_length8, _Str_startsWith as _Str_startsWith7, _curry as _curry23, _tuple as _tuple12, and as and15, eq as eq19, filter as filter10, map as map15, or as or14, reduce as reduce7 } from "@mochi/compiler/runtime";
import { match as match10 } from "@onrails/pattern";
var emptyOrigins = { values: new Map, types: new Map, ctors: new Map };
var occ$ = (name, space, def, span, role) => ({ name, space, defPath: def.path, defStart: def.start, defEnd: def.end, start: span.start, end: span.end, role });
var occ = _curry23(5, occ$);
var locOf$ = (env, span) => ({ path: env.path, start: span.start, end: span.end });
var locOf = _curry23(2, locOf$);
var upperStart2 = (s) => _Option_match21(_Str_codeAt9(0, s), () => false, (c) => and15(c >= 65, c <= 90));
var parked = _Str_startsWith7("$");
var orElse$ = (first, second) => _Option_match21(first, () => second(), (loc) => Some21(loc));
var orElse = _curry23(2, orElse$);
var lookup$ = (env, space, name) => ((_v) => _v === "value" ? orElse$(_Map_get11(name, env.locals), () => orElse$(_Map_get11(name, env.top.values), () => _Map_get11(name, env.prelude.origins.values))) : _v === "type" ? orElse$(_Map_get11(name, env.top.types), () => _Map_get11(name, env.prelude.origins.types)) : orElse$(_Map_get11(name, env.top.ctors), () => _Map_get11(name, env.prelude.origins.ctors)))(space);
var lookup = _curry23(3, lookup$);
var use$ = (env, space, name, span) => _Option_match21(lookup$(env, space, name), () => [], (def) => [occ$(name, space, def, span, "use")]);
var use = _curry23(4, use$);
var walked$ = (occs, fields) => ({ occs, fields, frames: [] });
var walked = _curry23(2, walked$);
var none = (fields) => walked$([], fields);
var andThen$ = (first, rest) => {
  const second = rest(first.fields);
  return { occs: _Array_concat12(first.occs, second.occs), fields: second.fields, frames: _Array_concat12(first.frames, second.frames) };
};
var andThen = _curry23(2, andThen$);
var prefixed$ = (occs, w) => ({ occs: _Array_concat12(occs, w.occs), fields: w.fields, frames: w.frames });
var prefixed = _curry23(2, prefixed$);
var sameLoc$ = (a, b) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" ? (([{ value: x }, { value: y }]) => and15(and15(eq19(x.start, y.start), eq19(x.end, y.end)), eq19(x.path, y.path)))(_v) : _v[0]._tag === "None" && _v[1]._tag === "None" ? true : false)(_tuple12(a, b));
var sameLoc = _curry23(2, sameLoc$);
var newBinds$ = (outer, inner) => reduce7(_curry23(2, (acc, name) => or14(sameLoc$(_Map_get11(name, outer.locals), _Map_get11(name, inner.locals)), parked(name)) ? acc : _Option_match21(_Map_get11(name, inner.locals), () => acc, (def) => _Map_set10(name, def, acc))), new Map, _Map_keys10(inner.locals));
var newBinds = _curry23(2, newBinds$);
var framed$ = (outer, inner, sp, w) => {
  const binds = newBinds$(outer, inner);
  return _Map_size3(binds) === 0 ? w : { occs: w.occs, fields: w.fields, frames: _Array_append17({ start: sp.start, end: sp.end, binds }, w.frames) };
};
var framed = _curry23(4, framed$);
var touchField$ = (env, name, span, fields) => _Option_match21(_Map_get11(name, fields), () => {
  const def = locOf$(env, span);
  return walked$([occ$(name, "field", def, span, "def")], _Map_set10(name, def, fields));
}, (def) => walked$([occ$(name, "field", def, span, "use")], fields));
var touchField = _curry23(4, touchField$);
var bindLocal$ = (env, name, span) => {
  const def = locOf$(env, span);
  return { env: { path: env.path, top: env.top, prelude: env.prelude, locals: _Map_set10(name, def, env.locals) }, occ: occ$(name, "value", def, span, "def") };
};
var bindLocal = _curry23(3, bindLocal$);
var bound$ = (env, occs, fields) => ({ env, occs, fields, frames: [] });
var bound = _curry23(3, bound$);
var boundWith$ = (env, occs, w) => ({ env, occs, fields: w.fields, frames: w.frames });
var boundWith = _curry23(3, boundWith$);
var bindName$ = (env, name, span, fields) => {
  const b = bindLocal$(env, name, span);
  return bound$(b.env, [b.occ], fields);
};
var bindName = _curry23(4, bindName$);
var boundThen$ = (first, rest) => {
  const second = rest(first.env, first.fields);
  return { env: second.env, occs: _Array_concat12(first.occs, second.occs), fields: second.fields, frames: _Array_concat12(first.frames, second.frames) };
};
var boundThen = _curry23(2, boundThen$);
var bindNames$ = (env, names, spans, i, fields) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" ? (([{ value: name }, { value: span }]) => boundThen$(bindName$(env, name, span, fields), _curry23(2, (e, fs) => bindNames$(e, names, spans, i + 1, fs))))(_v) : bound$(env, [], fields))(_tuple12(_Array_get20(i, names), _Array_get20(i, spans)));
var bindNames = _curry23(5, bindNames$);
var walkTypes$ = (env, types, i) => _Option_match21(_Array_get20(i, types), () => [], (t) => _Array_concat12(walkType$(env, t), walkTypes$(env, types, i + 1)));
var walkTypes = _curry23(3, walkTypes$);
var walkType$ = (env, t) => {
  const $match = t;
  switch ($match._tag) {
    case "TyName": {
      const { name, span } = $match;
      return upperStart2(name) ? use$(env, "type", name, span) : [];
    }
    case "TyArrow": {
      const { from, to } = $match;
      return _Array_concat12(walkType$(env, from), walkType$(env, to));
    }
    case "TyApp": {
      const { ctor, args, span } = $match;
      return _Array_concat12(use$(env, "type", ctor, span), walkTypes$(env, args, 0));
    }
    case "TyTuple": {
      const { elems } = $match;
      return walkTypes$(env, elems, 0);
    }
    case "TyList": {
      const { elem } = $match;
      return walkType$(env, elem);
    }
    case "TyQual": {
      const { alias, name, nameSpan, args } = $match;
      return _Array_concat12(use$(env, "type", `${alias}.${name}`, nameSpan), walkTypes$(env, args, 0));
    }
    case "TyLit": {
      return [];
    }
    case "TyUnion": {
      const { members } = $match;
      return walkTypes$(env, members, 0);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var walkType = _curry23(2, walkType$);
var walkAnnot$ = (env, annot) => _Option_match21(annot, () => [], (t) => walkType$(env, t));
var walkAnnot = _curry23(2, walkAnnot$);
var bindParam$2 = (env, param, fields) => ((_v) => _v._tag === "LPSpanned" && _v.param._tag === "LPName" && _v.nameSpans.length === 1 ? (({ param: { name, annot }, nameSpans: [span] }) => ((annotOccs) => parked(name) ? bound$(env, annotOccs, fields) : ((b) => bound$(b.env, _Array_append17(b.occ, annotOccs), fields))(bindLocal$(env, name, span)))(walkAnnot$(env, annot)))(_v) : _v._tag === "LPSpanned" && _v.param._tag === "LPLabeled" && _v.nameSpans.length === 1 ? (({ param: { name, annot, defaultValue }, nameSpans: [span] }) => ((annotOccs) => ((dflt) => ((before) => parked(name) ? boundWith$(env, before, dflt) : ((b) => boundWith$(b.env, _Array_append17(b.occ, before), dflt))(bindLocal$(env, name, span)))(_Array_concat12(annotOccs, dflt.occs)))(_Option_match21(defaultValue, () => none(fields), (e) => walkExpr$(env, e, fields))))(walkAnnot$(env, annot)))(_v) : _v._tag === "LPSpanned" && _v.param._tag === "LPTuple" ? (({ param: { names }, nameSpans: spans }) => bindNames$(env, names, spans, 0, fields))(_v) : _v._tag === "LPSpanned" && _v.param._tag === "LPRecord" ? (({ param: { fields: names }, nameSpans: spans }) => bindNames$(env, names, spans, 0, fields))(_v) : _v._tag === "LPName" ? (({ annot }) => bound$(env, walkAnnot$(env, annot), fields))(_v) : _v._tag === "LPLabeled" ? (({ annot, defaultValue }) => ((dflt) => boundWith$(env, _Array_concat12(walkAnnot$(env, annot), dflt.occs), dflt))(_Option_match21(defaultValue, () => none(fields), (e) => walkExpr$(env, e, fields))))(_v) : bound$(env, [], fields))(param);
var bindParam2 = _curry23(3, bindParam$2);
var bindParams$ = (env, params, i, fields) => _Option_match21(_Array_get20(i, params), () => bound$(env, [], fields), (param) => boundThen$(bindParam$2(env, param, fields), _curry23(2, (e, fs) => bindParams$(e, params, i + 1, fs))));
var bindParams = _curry23(4, bindParams$);
var walkPatOpt$ = (env, pat, fields) => _Option_match21(pat, () => bound$(env, [], fields), (p) => walkPat$(env, p, fields));
var walkPatOpt = _curry23(3, walkPatOpt$);
var walkPats$ = (env, pats, i, fields) => _Option_match21(_Array_get20(i, pats), () => bound$(env, [], fields), (p) => boundThen$(walkPat$(env, p, fields), _curry23(2, (e, fs) => walkPats$(e, pats, i + 1, fs))));
var walkPats = _curry23(4, walkPats$);
var walkPatFields$ = (env, pfs, i, fields) => _Option_match21(_Array_get20(i, pfs), () => bound$(env, [], fields), (pf) => {
  const label = touchField$(env, pf.label, pf.labelSpan, fields);
  return boundThen$(boundThen$(bound$(env, label.occs, label.fields), _curry23(2, (e, fs) => walkPat$(e, pf.pat, fs))), _curry23(2, (e, fs) => walkPatFields$(e, pfs, i + 1, fs)));
});
var walkPatFields = _curry23(4, walkPatFields$);
var walkPat$ = (env, pat, fields) => {
  const $match = pat;
  switch ($match._tag) {
    case "PAs": {
      const { pat: inner, name, nameSpan } = $match;
      return boundThen$(walkPat$(env, inner, fields), _curry23(2, (e, fs) => bindName$(e, name, nameSpan, fs)));
    }
    case "PBind": {
      const { name, span } = $match;
      return name === "_" ? bound$(env, [], fields) : bindName$(env, name, span, fields);
    }
    case "PCtor": {
      const { ctor, args, span } = $match;
      return boundThen$(bound$(env, use$(env, "ctor", ctor, span), fields), _curry23(2, (e, fs) => walkPats$(e, args, 0, fs)));
    }
    case "PRecord": {
      const { fields: pfs } = $match;
      return walkPatFields$(env, pfs, 0, fields);
    }
    case "PTuple": {
      const { elems } = $match;
      return walkPats$(env, elems, 0, fields);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return boundThen$(walkPats$(env, elems, 0, fields), _curry23(2, (e, fs) => walkPatOpt$(e, rest, fs)));
    }
    case "PList": {
      const { elems, rest } = $match;
      return boundThen$(walkPats$(env, elems, 0, fields), _curry23(2, (e, fs) => walkPatOpt$(e, rest, fs)));
    }
    case "POr": {
      const { alts } = $match;
      return ((_v) => _v.length >= 1 ? (([first, ...rest]) => boundThen$(walkPat$(env, first, fields), _curry23(2, (e, fs) => {
        const uses = walkPatUsesList$(e, rest, 0, fs);
        return bound$(e, uses.occs, uses.fields);
      })))(_v) : _v.length === 0 ? bound$(env, [], fields) : (() => {
        throw new Error("non-exhaustive match");
      })())(alts);
    }
    default: {
      return bound$(env, [], fields);
    }
  }
};
var walkPat = _curry23(3, walkPat$);
var walkPatUsesList$ = (env, pats, i, fields) => _Option_match21(_Array_get20(i, pats), () => none(fields), (p) => andThen$(walkPatUses$(env, p, fields), (fs) => walkPatUsesList$(env, pats, i + 1, fs)));
var walkPatUsesList = _curry23(4, walkPatUsesList$);
var walkPatUsesOpt$ = (env, pat, fields) => _Option_match21(pat, () => none(fields), (p) => walkPatUses$(env, p, fields));
var walkPatUsesOpt = _curry23(3, walkPatUsesOpt$);
var walkPatFieldUses$ = (env, pfs, i, fields) => _Option_match21(_Array_get20(i, pfs), () => none(fields), (pf) => andThen$(andThen$(touchField$(env, pf.label, pf.labelSpan, fields), (fs) => walkPatUses$(env, pf.pat, fs)), (fs) => walkPatFieldUses$(env, pfs, i + 1, fs)));
var walkPatFieldUses = _curry23(4, walkPatFieldUses$);
var walkPatUses$ = (env, pat, fields) => {
  const $match = pat;
  switch ($match._tag) {
    case "PAs": {
      const { pat: inner } = $match;
      return walkPatUses$(env, inner, fields);
    }
    case "PCtor": {
      const { ctor, args, span } = $match;
      return prefixed$(use$(env, "ctor", ctor, span), walkPatUsesList$(env, args, 0, fields));
    }
    case "PRecord": {
      const { fields: pfs } = $match;
      return walkPatFieldUses$(env, pfs, 0, fields);
    }
    case "PTuple": {
      const { elems } = $match;
      return walkPatUsesList$(env, elems, 0, fields);
    }
    case "PArr": {
      const { elems, rest } = $match;
      return andThen$(walkPatUsesList$(env, elems, 0, fields), (fs) => walkPatUsesOpt$(env, rest, fs));
    }
    case "PList": {
      const { elems, rest } = $match;
      return andThen$(walkPatUsesList$(env, elems, 0, fields), (fs) => walkPatUsesOpt$(env, rest, fs));
    }
    case "POr": {
      const { alts } = $match;
      return walkPatUsesList$(env, alts, 0, fields);
    }
    default: {
      return none(fields);
    }
  }
};
var walkPatUses = _curry23(3, walkPatUses$);
var walkExprs$ = (env, exprs, i, fields) => _Option_match21(_Array_get20(i, exprs), () => none(fields), (e) => andThen$(walkExpr$(env, e, fields), (fs) => walkExprs$(env, exprs, i + 1, fs)));
var walkExprs = _curry23(4, walkExprs$);
var walkSeqs$ = (env, elems, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" && _v.value._tag === "SEExpr" ? (({ value: { expr: e } }) => andThen$(walkExpr$(env, e, fields), (fs) => walkSeqs$(env, elems, i + 1, fs)))(_v) : _v._tag === "Some" && _v.value._tag === "SESpread" ? (({ value: { expr: e } }) => andThen$(walkExpr$(env, e, fields), (fs) => walkSeqs$(env, elems, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, elems));
var walkSeqs = _curry23(4, walkSeqs$);
var walkInterp$ = (env, parts, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" && _v.value._tag === "IPLit" ? walkInterp$(env, parts, i + 1, fields) : _v._tag === "Some" && _v.value._tag === "IPExpr" ? (({ value: { expr: e } }) => andThen$(walkExpr$(env, e, fields), (fs) => walkInterp$(env, parts, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, parts));
var walkInterp = _curry23(4, walkInterp$);
var walkRecordFields$ = (env, rfs, i, fields) => _Option_match21(_Array_get20(i, rfs), () => none(fields), (f) => andThen$(andThen$(touchField$(env, f.name, f.nameSpan, fields), (fs) => walkExpr$(env, f.value, fs)), (fs) => walkRecordFields$(env, rfs, i + 1, fs)));
var walkRecordFields = _curry23(4, walkRecordFields$);
var walkEntries$ = (env, entries, i, fields) => _Option_match21(_Array_get20(i, entries), () => none(fields), (entry) => andThen$(andThen$(walkExpr$(env, entry.key, fields), (fs) => walkExpr$(env, entry.value, fs)), (fs) => walkEntries$(env, entries, i + 1, fs)));
var walkEntries = _curry23(4, walkEntries$);
var walkArms$ = (env, arms, i, fields) => _Option_match21(_Array_get20(i, arms), () => none(fields), (arm) => {
  const pat = walkPat$(env, arm.pattern, fields);
  const guard = _Option_match21(arm.guard, () => none(pat.fields), (g) => walkExpr$(pat.env, g, pat.fields));
  const body = andThen$(prefixed$(pat.occs, guard), (fs) => walkExpr$(pat.env, arm.body, fs));
  const armSpan = { start: patSpan3(arm.pattern).start, end: exprSpan3(arm.body).end };
  return andThen$(framed$(env, pat.env, armSpan, body), (fs) => walkArms$(env, arms, i + 1, fs));
});
var walkArms = _curry23(4, walkArms$);
var walkLoopInits$ = (env, params, i, fields) => _Option_match21(_Array_get20(i, params), () => none(fields), (param) => andThen$(walkExpr$(env, param.init, fields), (fs) => walkLoopInits$(env, params, i + 1, fs)));
var walkLoopInits = _curry23(4, walkLoopInits$);
var bindLoopParams = _curry23(4, (env, params, i, fields) => _Option_match21(_Array_get20(i, params), () => bound$(env, [], fields), (param) => boundThen$(bindName$(env, param.name, param.nameSpan, fields), _curry23(2, (e, fs) => bindLoopParams(e, params, i + 1, fs)))));
var letRun$ = (e, acc) => {
  const $match = e;
  switch ($match._tag) {
    case "ELetIn": {
      const { name, nameSpan, annot, value, body } = $match;
      const $match$ = value;
      switch ($match$._tag) {
        case "ELambda": {
          return letRun$(body, _Array_append17(_tuple12(name, nameSpan, annot, value), acc));
        }
        default: {
          return { binders: acc, tail: e };
        }
      }
    }
    default: {
      return { binders: acc, tail: e };
    }
  }
};
var letRun = _curry23(2, letRun$);
var bindRun = _curry23(4, (env, binders, i, fields) => match10(_Array_get20(i, binders)).with({ _tag: "None" }, () => bound$(env, [], fields)).with((_v) => _v._tag === "Some", ({ value: [name, nameSpan, ,] }) => boundThen$(bindName$(env, name, nameSpan, fields), _curry23(2, (e, fs) => bindRun(e, binders, i + 1, fs)))).exhaustive());
var walkRunValues$ = (env, binders, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" ? (({ value: [, , annot, value] }) => andThen$(prefixed$(walkAnnot$(env, annot), walkExpr$(env, value, fields)), (fs) => walkRunValues$(env, binders, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, binders));
var walkRunValues = _curry23(4, walkRunValues$);
var walkLetRun$ = (env, run, fields) => {
  const scope = bindRun(env, run.binders, 0, fields);
  return framed$(env, scope.env, exprSpan3(run.tail), prefixed$(scope.occs, andThen$(walkRunValues$(scope.env, run.binders, 0, scope.fields), (fs) => walkExpr$(scope.env, run.tail, fs))));
};
var walkLetRun = _curry23(3, walkLetRun$);
var fieldNameSpan$ = (span, name) => ({ start: span.end - _Str_length8(name), end: span.end });
var fieldNameSpan = _curry23(2, fieldNameSpan$);
var walkFieldAccess$ = (env, target, name, span, fields) => {
  const nameSpan = fieldNameSpan$(span, name);
  const member = ((_v) => _v._tag === "ERef" ? (({ name: ns }) => _Map_get11(`${ns}.${name}`, env.prelude.members))(_v) : None21)(target);
  return andThen$(walkExpr$(env, target, fields), (fs) => _Option_match21(member, () => touchField$(env, name, nameSpan, fs), (def) => walked$([occ$(name, "value", def, nameSpan, "use")], fs)));
};
var walkFieldAccess = _curry23(5, walkFieldAccess$);
var walkExpr$ = (env, expr, fields) => {
  const $match = expr;
  switch ($match._tag) {
    case "ERef": {
      const { name, span } = $match;
      return parked(name) ? none(fields) : and15(upperStart2(name), lookup$(env, "ctor", name)._tag !== "None") ? walked$(use$(env, "ctor", name, span), fields) : walked$(use$(env, "value", name, span), fields);
    }
    case "EInterp": {
      const { parts } = $match;
      return walkInterp$(env, parts, 0, fields);
    }
    case "ECall": {
      const { fn, args } = $match;
      return andThen$(walkExpr$(env, fn, fields), (fs) => walkExprs$(env, args, 0, fs));
    }
    case "ELambda": {
      const { params, body, span: sp } = $match;
      const scope = bindParams$(env, params, 0, fields);
      const inner = walkExpr$(scope.env, body, scope.fields);
      return framed$(env, scope.env, sp, { occs: _Array_concat12(scope.occs, inner.occs), fields: inner.fields, frames: _Array_concat12(scope.frames, inner.frames) });
    }
    case "ELetIn": {
      const { name, nameSpan, annot, value, body } = $match;
      const $match$ = value;
      switch ($match$._tag) {
        case "ELambda": {
          return walkLetRun$(env, letRun$(expr, []), fields);
        }
        default: {
          const v = walkExpr$(env, value, fields);
          const scope = bindName$(env, name, nameSpan, v.fields);
          const inner = framed$(env, scope.env, exprSpan3(body), walkExpr$(scope.env, body, scope.fields));
          return { occs: _Array_concat12(_Array_concat12(v.occs, _Array_concat12(walkAnnot$(env, annot), scope.occs)), inner.occs), fields: inner.fields, frames: _Array_concat12(v.frames, inner.frames) };
        }
      }
    }
    case "ELetBind": {
      const { param, value, body } = $match;
      const v = walkExpr$(env, value, fields);
      const scope = bindParam$2(env, param, v.fields);
      const inner = framed$(env, scope.env, exprSpan3(body), walkExpr$(scope.env, body, scope.fields));
      return { occs: _Array_concat12(_Array_concat12(v.occs, scope.occs), inner.occs), fields: inner.fields, frames: _Array_concat12(_Array_concat12(v.frames, scope.frames), inner.frames) };
    }
    case "ELoop": {
      const { params, body } = $match;
      const inits = walkLoopInits$(env, params, 0, fields);
      const scope = bindLoopParams(env, params, 0, inits.fields);
      const inner = framed$(env, scope.env, exprSpan3(body), walkExpr$(scope.env, body, scope.fields));
      return { occs: _Array_concat12(_Array_concat12(inits.occs, scope.occs), inner.occs), fields: inner.fields, frames: _Array_concat12(inits.frames, inner.frames) };
    }
    case "ERecur": {
      const { args } = $match;
      return walkExprs$(env, args, 0, fields);
    }
    case "EPipe": {
      const { left, right } = $match;
      return andThen$(walkExpr$(env, left, fields), (fs) => walkExpr$(env, right, fs));
    }
    case "EDo": {
      const { exprs } = $match;
      return walkExprs$(env, exprs, 0, fields);
    }
    case "ETernary": {
      const { cond, thenE, elseE } = $match;
      return walkExprs$(env, [cond, thenE, elseE], 0, fields);
    }
    case "EMatch": {
      const { scrutinee, arms } = $match;
      return andThen$(walkExpr$(env, scrutinee, fields), (fs) => walkArms$(env, arms, 0, fs));
    }
    case "ERecord": {
      const { fields: rfs, spread } = $match;
      return _Option_match21(spread, () => walkRecordFields$(env, rfs, 0, fields), (base) => andThen$(walkExpr$(env, base, fields), (fs) => walkRecordFields$(env, rfs, 0, fs)));
    }
    case "EField": {
      const { target, name, span } = $match;
      return walkFieldAccess$(env, target, name, span, fields);
    }
    case "ETuple": {
      const { elements } = $match;
      return walkExprs$(env, elements, 0, fields);
    }
    case "EArr": {
      const { elements } = $match;
      return walkSeqs$(env, elements, 0, fields);
    }
    case "EList": {
      const { elements } = $match;
      return walkSeqs$(env, elements, 0, fields);
    }
    case "ESet": {
      const { elements } = $match;
      return walkSeqs$(env, elements, 0, fields);
    }
    case "EMap": {
      const { entries } = $match;
      return walkEntries$(env, entries, 0, fields);
    }
    default: {
      return none(fields);
    }
  }
};
var walkExpr = _curry23(3, walkExpr$);
var withValue$ = (o, name, def) => ({ values: _Map_set10(name, def, o.values), types: o.types, ctors: o.ctors });
var withValue = _curry23(3, withValue$);
var withType$ = (o, name, def) => ({ values: o.values, types: _Map_set10(name, def, o.types), ctors: o.ctors });
var withType = _curry23(3, withType$);
var withCtor$ = (o, name, def) => ({ values: o.values, types: o.types, ctors: _Map_set10(name, def, o.ctors) });
var withCtor = _curry23(3, withCtor$);
var topThen$ = (first, occs, top, fields) => ({ top, occs: _Array_concat12(first.occs, occs), fields });
var topThen = _curry23(4, topThen$);
var bindImport$ = (env, origins, acc, name, span) => ((_v) => _v[0]._tag === "Some" ? (([{ value: def }, ,]) => topThen$(acc, [occ$(name, "ctor", def, span, "use")], withValue$(withCtor$(acc.top, name, def), name, def), acc.fields))(_v) : _v[0]._tag === "None" && _v[1]._tag === "Some" ? (([, { value: def }]) => topThen$(acc, [occ$(name, "value", def, span, "use")], withValue$(acc.top, name, def), acc.fields))(_v) : _v[0]._tag === "None" && _v[1]._tag === "None" && _v[2]._tag === "Some" ? (([, , { value: def }]) => topThen$(acc, [occ$(name, "type", def, span, "use")], withType$(acc.top, name, def), acc.fields))(_v) : ((def) => topThen$(acc, [occ$(name, "value", def, span, "def")], withValue$(acc.top, name, def), acc.fields))(locOf$(env, span)))(_tuple12(_Map_get11(name, origins.ctors), _Map_get11(name, origins.values), _Map_get11(name, origins.types)));
var bindImport = _curry23(5, bindImport$);
var bindImports = _curry23(5, (env, origins, acc, names, i) => _Option_match21(_Array_get20(i, names), () => acc, (n) => bindImports(env, origins, bindImport$(env, origins, acc, n.name, n.span), names, i + 1)));
var bindCtors$ = (env, acc, ctors, i) => _Option_match21(_Array_get20(i, ctors), () => acc, (c) => {
  const def = locOf$(env, c.span);
  return bindCtors$(env, topThen$(acc, [occ$(c.name, "ctor", def, c.span, "def")], withCtor$(acc.top, c.name, def), acc.fields), ctors, i + 1);
});
var bindCtors = _curry23(4, bindCtors$);
var touchAliasFields$ = (env, acc, afs, i) => _Option_match21(_Array_get20(i, afs), () => acc, (f) => {
  const w = touchField$(env, f.name, f.nameSpan, acc.fields);
  return touchAliasFields$(env, topThen$(acc, w.occs, acc.top, w.fields), afs, i + 1);
});
var touchAliasFields = _curry23(4, touchAliasFields$);
var bindTopValue$ = (env, acc, name, span) => {
  const def = locOf$(env, span);
  return topThen$(acc, [occ$(name, "value", def, span, "def")], withValue$(acc.top, name, def), acc.fields);
};
var bindTopValue = _curry23(4, bindTopValue$);
var bindTopLevels$ = (env, origins, stmts, i, acc) => _Option_match21(_Array_get20(i, stmts), () => acc, (stmt) => bindTopLevels$(env, origins, stmts, i + 1, ((_v) => _v._tag === "SImportNs" ? (({ alias }) => bindTopValue$(env, acc, alias.name, alias.span))(_v) : _v._tag === "SImport" ? (({ names }) => bindImports(env, origins, acc, names, 0))(_v) : _v._tag === "SType" ? (({ name, nameSpan, ctors, alias }) => ((def) => ((withCtors) => _Option_match21(alias, () => withCtors, (afs) => touchAliasFields$(env, withCtors, afs, 0)))(bindCtors$(env, topThen$(acc, [occ$(name, "type", def, nameSpan, "def")], withType$(acc.top, name, def), acc.fields), ctors, 0)))(locOf$(env, nameSpan)))(_v) : _v._tag === "SLet" ? (({ name, nameSpan }) => parked(name) ? acc : bindTopValue$(env, acc, name, nameSpan))(_v) : _v._tag === "SExtern" ? (({ name, nameSpan }) => bindTopValue$(env, acc, name, nameSpan))(_v) : acc)(stmt)));
var bindTopLevels = _curry23(5, bindTopLevels$);
var ctorFieldTypes = (ctors) => _Array_flatMap7((c) => map15((f) => f.fieldType, c.fields), ctors);
var walkStmt$ = (env, stmt, fields) => {
  const $match = stmt;
  switch ($match._tag) {
    case "SLet": {
      const { annot, value } = $match;
      return prefixed$(walkAnnot$(env, annot), walkExpr$(env, value, fields));
    }
    case "SExpr": {
      const { value } = $match;
      return walkExpr$(env, value, fields);
    }
    case "SExtern": {
      const { typeExpr } = $match;
      return walked$(walkType$(env, typeExpr), fields);
    }
    case "SType": {
      const { ctors, alias, aliasType } = $match;
      const aliasTypes = _Option_match21(alias, () => [], (afs) => map15((f) => f.fieldType, afs));
      return walked$(_Array_concat12(walkTypes$(env, _Array_concat12(ctorFieldTypes(ctors), aliasTypes), 0), walkAnnot$(env, aliasType)), fields);
    }
    default: {
      return none(fields);
    }
  }
};
var walkStmt = _curry23(3, walkStmt$);
var walkStmts$ = (env, stmts, i, fields) => _Option_match21(_Array_get20(i, stmts), () => none(fields), (stmt) => andThen$(walkStmt$(env, stmt, fields), (fs) => walkStmts$(env, stmts, i + 1, fs)));
var walkStmts = _curry23(4, walkStmts$);
var indexWith$ = (path, origins, prelude, stmts) => {
  const env0 = { path, top: emptyOrigins, prelude, locals: new Map([]) };
  const tops = bindTopLevels$(env0, origins, stmts, 0, { top: emptyOrigins, occs: [], fields: new Map });
  const body = walkStmts$({ path, top: tops.top, prelude, locals: new Map }, stmts, 0, tops.fields);
  return { occurrences: _Array_concat12(tops.occs, body.occs), top: tops.top, fields: body.fields, frames: body.frames };
};
var indexWith = _curry23(4, indexWith$);
var originsFrom$ = (path, stmts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SLet" && _v.value.exported === true ? (({ value: { name, nameSpan } }) => originsFrom$(path, stmts, i + 1, withValue$(acc, name, { path, start: nameSpan.start, end: nameSpan.end })))(_v) : _v._tag === "Some" && _v.value._tag === "SExtern" && _v.value.exported === true ? (({ value: { name, nameSpan } }) => originsFrom$(path, stmts, i + 1, withValue$(acc, name, { path, start: nameSpan.start, end: nameSpan.end })))(_v) : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true ? (({ value: { name, nameSpan, ctors } }) => originsFrom$(path, stmts, i + 1, reduce7(_curry23(2, (o, c) => {
  const at = { path, start: c.span.start, end: c.span.end };
  return withValue$(withCtor$(o, c.name, at), c.name, at);
}), withType$(acc, name, { path, start: nameSpan.start, end: nameSpan.end }), ctors)))(_v) : _v._tag === "Some" ? originsFrom$(path, stmts, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, stmts));
var originsFrom = _curry23(4, originsFrom$);
var originsOf$ = (path, stmts) => originsFrom$(path, stmts, 0, emptyOrigins);
var originsOf = _curry23(2, originsOf$);
var importSpans = (stmts) => _Array_flatMap7((s) => {
  const $match = s;
  switch ($match._tag) {
    case "SImport": {
      const { names } = $match;
      return map15((n) => n.span.start, names);
    }
    case "SImportNs": {
      const { alias } = $match;
      return [alias.span.start];
    }
    default: {
      return [];
    }
  }
}, stmts);
var index = (stmts) => {
  const imports = importSpans(stmts);
  const noPrelude = { origins: emptyOrigins, members: new Map([]) };
  return map15((o) => ({ name: o.name, defStart: o.defStart, defEnd: o.defEnd, start: o.start, end: o.end, role: o.role }), filter10((o) => and15(o.space === "value", !_Array_contains5(o.defStart, imports)), indexWith$("", emptyOrigins, noPrelude, stmts).occurrences));
};

import { None as None23, _Array_append as _Array_append18, _Array_concat as _Array_concat13, _Array_contains as _Array_contains6, _Array_get as _Array_get21, _Array_prepend as _Array_prepend11, _Map_get as _Map_get13, _Map_getOr as _Map_getOr8, _Map_has as _Map_has8, _Map_keys as _Map_keys12, _Map_set as _Map_set11, _Option_isSome as _Option_isSome7, _Option_match as _Option_match23, _Option_unwrapOr as _Option_unwrapOr15, _Result_map as _Result_map8, _Set_add as _Set_add9, _Set_fromArray as _Set_fromArray9, _Set_has as _Set_has8, _Set_toArray as _Set_toArray4, _Str_contains as _Str_contains3, _Str_endsWith as _Str_endsWith3, _Str_join as _Str_join11, _Str_length as _Str_length9, _Str_slice as _Str_slice5, _Str_startsWith as _Str_startsWith9, _curry as _curry25, and as and17, length as length18, map as map17, or as or16, reduce as reduce9 } from "@mochi/compiler/runtime";

import { Err as Err10, None as None22, Some as Some22, _Map_get as _Map_get12, _Map_keys as _Map_keys11, _Option_flatMap as _Option_flatMap4, _Option_map as _Option_map4, _Option_match as _Option_match22, _Option_unwrapOr as _Option_unwrapOr14, _Result_flatMap as _Result_flatMap8, _Result_map as _Result_map7, _Result_mapErr, _Result_match as _Result_match6, _Str_get as _Str_get5, _Str_startsWith as _Str_startsWith8, _Str_trim as _Str_trim2, _curry as _curry24, _tuple as _tuple13, and as and16, eq as eq20, map as map16, or as or15, reduce as reduce8 } from "@mochi/compiler/runtime";

var _builtins = {
  add: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    }
  },
  sub: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    }
  },
  mul: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    }
  },
  div: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    }
  },
  square: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyCon",
      name: "number",
      args: []
    }
  },
  sqrt: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyCon",
      name: "number",
      args: []
    }
  },
  hypot: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    }
  },
  pi: {
    _tag: "TyCon",
    name: "number",
    args: []
  },
  concat: {
    _tag: "TyFn",
    from: {
      _tag: "TyVar",
      id: 0
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyVar",
        id: 0
      }
    }
  },
  eq: {
    _tag: "TyFn",
    from: {
      _tag: "TyVar",
      id: 0
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    }
  },
  compare: {
    _tag: "TyFn",
    from: {
      _tag: "TyVar",
      id: 0
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    }
  },
  show: {
    _tag: "TyFn",
    from: {
      _tag: "TyVar",
      id: 0
    },
    to: {
      _tag: "TyCon",
      name: "string",
      args: []
    }
  },
  ignore: {
    _tag: "TyFn",
    from: {
      _tag: "TyVar",
      id: 0
    },
    to: {
      _tag: "TyCon",
      name: "unit",
      args: []
    }
  },
  lt: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    }
  },
  gt: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    }
  },
  gte: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    }
  },
  lte: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    }
  },
  not: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "bool",
      args: []
    },
    to: {
      _tag: "TyCon",
      name: "bool",
      args: []
    }
  },
  and: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "bool",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "bool",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    }
  },
  or: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "bool",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "bool",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    }
  },
  min: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    }
  },
  max: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    }
  },
  pow: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    }
  },
  mod: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    }
  },
  abs: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyCon",
      name: "number",
      args: []
    }
  },
  floor: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyCon",
      name: "number",
      args: []
    }
  },
  ceil: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyCon",
      name: "number",
      args: []
    }
  },
  round: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyCon",
      name: "number",
      args: []
    }
  },
  sign: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyCon",
      name: "number",
      args: []
    }
  },
  negate: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyCon",
      name: "number",
      args: []
    }
  },
  length: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "Array",
      args: [
        {
          _tag: "TyVar",
          id: 0
        }
      ]
    },
    to: {
      _tag: "TyCon",
      name: "number",
      args: []
    }
  },
  map: {
    _tag: "TyFn",
    from: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyVar",
        id: 1
      }
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 1
          }
        ]
      }
    }
  },
  filter: {
    _tag: "TyFn",
    from: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    }
  },
  reduce: {
    _tag: "TyFn",
    from: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 1
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      }
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 1
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      }
    }
  },
  identity: {
    _tag: "TyFn",
    from: {
      _tag: "TyVar",
      id: 0
    },
    to: {
      _tag: "TyVar",
      id: 0
    }
  },
  always: {
    _tag: "TyFn",
    from: {
      _tag: "TyVar",
      id: 0
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 1
      },
      to: {
        _tag: "TyVar",
        id: 0
      }
    }
  },
  compose: {
    _tag: "TyFn",
    from: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 1
      },
      to: {
        _tag: "TyVar",
        id: 2
      }
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 2
        }
      }
    }
  },
  capitalize: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "string",
      args: []
    },
    to: {
      _tag: "TyCon",
      name: "string",
      args: []
    }
  },
  range: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "List",
        args: [
          {
            _tag: "TyCon",
            name: "number",
            args: []
          }
        ]
      }
    }
  },
  iterate: {
    _tag: "TyFn",
    from: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyVar",
        id: 0
      }
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyCon",
        name: "List",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    }
  },
  repeat: {
    _tag: "TyFn",
    from: {
      _tag: "TyVar",
      id: 0
    },
    to: {
      _tag: "TyCon",
      name: "List",
      args: [
        {
          _tag: "TyVar",
          id: 0
        }
      ]
    }
  },
  take: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "List",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "List",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    }
  },
  takeWhile: {
    _tag: "TyFn",
    from: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "List",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "List",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    }
  },
  drop: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "number",
      args: []
    },
    to: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "List",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "List",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    }
  },
  fromArray: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "Array",
      args: [
        {
          _tag: "TyVar",
          id: 0
        }
      ]
    },
    to: {
      _tag: "TyCon",
      name: "List",
      args: [
        {
          _tag: "TyVar",
          id: 0
        }
      ]
    }
  },
  toArray: {
    _tag: "TyFn",
    from: {
      _tag: "TyCon",
      name: "List",
      args: [
        {
          _tag: "TyVar",
          id: 0
        }
      ]
    },
    to: {
      _tag: "TyCon",
      name: "Array",
      args: [
        {
          _tag: "TyVar",
          id: 0
        }
      ]
    }
  }
};
var _namespaces = {
  Array: {
    map: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      }
    },
    filter: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    reduce: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 1
        },
        to: {
          _tag: "TyFn",
          from: {
            _tag: "TyVar",
            id: 0
          },
          to: {
            _tag: "TyVar",
            id: 1
          }
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 1
        },
        to: {
          _tag: "TyFn",
          from: {
            _tag: "TyCon",
            name: "Array",
            args: [
              {
                _tag: "TyVar",
                id: 0
              }
            ]
          },
          to: {
            _tag: "TyVar",
            id: 1
          }
        }
      }
    },
    length: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    },
    head: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Option",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    get: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    forEach: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyCon",
          name: "unit",
          args: []
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "unit",
          args: []
        }
      }
    },
    find: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    reverse: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    concat: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    append: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    prepend: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    flatMap: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      }
    },
    take: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    drop: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    tail: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    contains: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      }
    },
    sort: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    sortBy: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    dedupe: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    dedupeBy: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    max: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Option",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    min: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Option",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    maxBy: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    minBy: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    }
  },
  List: {
    map: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "List",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "List",
          args: [
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      }
    },
    filter: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "List",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "List",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    concat: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "List",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "List",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "List",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    flatMap: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyCon",
          name: "List",
          args: [
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "List",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "List",
          args: [
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      }
    },
    head: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "List",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Option",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    empty: {
      _tag: "TyCon",
      name: "List",
      args: [
        {
          _tag: "TyVar",
          id: 0
        }
      ]
    }
  },
  Set: {
    has: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Set",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      }
    },
    add: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Set",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Set",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    delete: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Set",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Set",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    size: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Set",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    },
    toArray: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Set",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    fromArray: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Set",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    empty: {
      _tag: "TyCon",
      name: "Set",
      args: [
        {
          _tag: "TyVar",
          id: 0
        }
      ]
    },
    union: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Set",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Set",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Set",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    intersect: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Set",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Set",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Set",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    diff: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Set",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Set",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Set",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    }
  },
  Map: {
    has: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Map",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      }
    },
    getOr: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 1
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyFn",
          from: {
            _tag: "TyCon",
            name: "Map",
            args: [
              {
                _tag: "TyVar",
                id: 0
              },
              {
                _tag: "TyVar",
                id: 1
              }
            ]
          },
          to: {
            _tag: "TyVar",
            id: 1
          }
        }
      }
    },
    set: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 1
        },
        to: {
          _tag: "TyFn",
          from: {
            _tag: "TyCon",
            name: "Map",
            args: [
              {
                _tag: "TyVar",
                id: 0
              },
              {
                _tag: "TyVar",
                id: 1
              }
            ]
          },
          to: {
            _tag: "TyCon",
            name: "Map",
            args: [
              {
                _tag: "TyVar",
                id: 0
              },
              {
                _tag: "TyVar",
                id: 1
              }
            ]
          }
        }
      }
    },
    delete: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Map",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Map",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      }
    },
    size: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Map",
        args: [
          {
            _tag: "TyVar",
            id: 0
          },
          {
            _tag: "TyVar",
            id: 1
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    },
    keys: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Map",
        args: [
          {
            _tag: "TyVar",
            id: 0
          },
          {
            _tag: "TyVar",
            id: 1
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    values: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Map",
        args: [
          {
            _tag: "TyVar",
            id: 0
          },
          {
            _tag: "TyVar",
            id: 1
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 1
          }
        ]
      }
    },
    get: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Map",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      }
    },
    empty: {
      _tag: "TyCon",
      name: "Map",
      args: [
        {
          _tag: "TyVar",
          id: 0
        },
        {
          _tag: "TyVar",
          id: 1
        }
      ]
    }
  },
  Dict: {
    empty: {
      _tag: "TyCon",
      name: "Dict",
      args: [
        {
          _tag: "TyVar",
          id: 0
        }
      ]
    },
    has: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Dict",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      }
    },
    get: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Dict",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    getOr: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "string",
          args: []
        },
        to: {
          _tag: "TyFn",
          from: {
            _tag: "TyCon",
            name: "Dict",
            args: [
              {
                _tag: "TyVar",
                id: 0
              }
            ]
          },
          to: {
            _tag: "TyVar",
            id: 0
          }
        }
      }
    },
    set: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyFn",
          from: {
            _tag: "TyCon",
            name: "Dict",
            args: [
              {
                _tag: "TyVar",
                id: 0
              }
            ]
          },
          to: {
            _tag: "TyCon",
            name: "Dict",
            args: [
              {
                _tag: "TyVar",
                id: 0
              }
            ]
          }
        }
      }
    },
    remove: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Dict",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Dict",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    size: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Dict",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    },
    keys: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Dict",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyCon",
            name: "string",
            args: []
          }
        ]
      }
    },
    values: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Dict",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    entries: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Dict",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyCon",
            name: "tuple",
            args: [
              {
                _tag: "TyCon",
                name: "string",
                args: []
              },
              {
                _tag: "TyVar",
                id: 0
              }
            ]
          }
        ]
      }
    },
    fromEntries: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyCon",
            name: "tuple",
            args: [
              {
                _tag: "TyCon",
                name: "string",
                args: []
              },
              {
                _tag: "TyVar",
                id: 0
              }
            ]
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Dict",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      }
    },
    map: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Dict",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Dict",
          args: [
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      }
    }
  },
  Option: {
    map: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      }
    },
    flatMap: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      }
    },
    mapOr: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 1
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyFn",
          from: {
            _tag: "TyVar",
            id: 0
          },
          to: {
            _tag: "TyVar",
            id: 1
          }
        },
        to: {
          _tag: "TyFn",
          from: {
            _tag: "TyCon",
            name: "Option",
            args: [
              {
                _tag: "TyVar",
                id: 0
              }
            ]
          },
          to: {
            _tag: "TyVar",
            id: 1
          }
        }
      }
    },
    exists: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      }
    },
    contains: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      }
    },
    unwrapOr: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyVar",
          id: 0
        }
      }
    },
    orElse: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Option",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        }
      }
    },
    isSome: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Option",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    },
    isNone: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Option",
        args: [
          {
            _tag: "TyVar",
            id: 0
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    }
  },
  Result: {
    map: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Result",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Result",
          args: [
            {
              _tag: "TyVar",
              id: 1
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        }
      }
    },
    mapErr: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 2
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Result",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Result",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      }
    },
    flatMap: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyCon",
          name: "Result",
          args: [
            {
              _tag: "TyVar",
              id: 1
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Result",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Result",
          args: [
            {
              _tag: "TyVar",
              id: 1
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        }
      }
    },
    unwrapOr: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Result",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        },
        to: {
          _tag: "TyVar",
          id: 0
        }
      }
    },
    isOk: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Result",
        args: [
          {
            _tag: "TyVar",
            id: 0
          },
          {
            _tag: "TyVar",
            id: 2
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    },
    isErr: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Result",
        args: [
          {
            _tag: "TyVar",
            id: 0
          },
          {
            _tag: "TyVar",
            id: 2
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "bool",
        args: []
      }
    }
  },
  Task: {
    of: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 0
      },
      to: {
        _tag: "TyCon",
        name: "Task",
        args: [
          {
            _tag: "TyVar",
            id: 0
          },
          {
            _tag: "TyVar",
            id: 2
          }
        ]
      }
    },
    fail: {
      _tag: "TyFn",
      from: {
        _tag: "TyVar",
        id: 2
      },
      to: {
        _tag: "TyCon",
        name: "Task",
        args: [
          {
            _tag: "TyVar",
            id: 0
          },
          {
            _tag: "TyVar",
            id: 2
          }
        ]
      }
    },
    map: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyVar",
              id: 1
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        }
      }
    },
    mapErr: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 2
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      }
    },
    andThen: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyVar",
              id: 1
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyVar",
              id: 1
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        }
      }
    },
    recover: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 2
        },
        to: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 1
            }
          ]
        }
      }
    },
    fromResult: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Result",
        args: [
          {
            _tag: "TyVar",
            id: 0
          },
          {
            _tag: "TyVar",
            id: 2
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Task",
        args: [
          {
            _tag: "TyVar",
            id: 0
          },
          {
            _tag: "TyVar",
            id: 2
          }
        ]
      }
    },
    match: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyVar",
          id: 1
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyFn",
          from: {
            _tag: "TyVar",
            id: 2
          },
          to: {
            _tag: "TyVar",
            id: 1
          }
        },
        to: {
          _tag: "TyFn",
          from: {
            _tag: "TyCon",
            name: "Task",
            args: [
              {
                _tag: "TyVar",
                id: 0
              },
              {
                _tag: "TyVar",
                id: 2
              }
            ]
          },
          to: {
            _tag: "TyCon",
            name: "Task",
            args: [
              {
                _tag: "TyVar",
                id: 1
              },
              {
                _tag: "TyVar",
                id: 3
              }
            ]
          }
        }
      }
    },
    delay: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyVar",
              id: 0
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        }
      }
    },
    run: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Task",
        args: [
          {
            _tag: "TyVar",
            id: 0
          },
          {
            _tag: "TyVar",
            id: 2
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Promise",
        args: [
          {
            _tag: "TyCon",
            name: "Result",
            args: [
              {
                _tag: "TyVar",
                id: 0
              },
              {
                _tag: "TyVar",
                id: 2
              }
            ]
          }
        ]
      }
    },
    all: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyCon",
            name: "Task",
            args: [
              {
                _tag: "TyVar",
                id: 0
              },
              {
                _tag: "TyVar",
                id: 2
              }
            ]
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Task",
        args: [
          {
            _tag: "TyCon",
            name: "Array",
            args: [
              {
                _tag: "TyVar",
                id: 0
              }
            ]
          },
          {
            _tag: "TyVar",
            id: 2
          }
        ]
      }
    },
    race: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyCon",
            name: "Task",
            args: [
              {
                _tag: "TyVar",
                id: 0
              },
              {
                _tag: "TyVar",
                id: 2
              }
            ]
          }
        ]
      },
      to: {
        _tag: "TyCon",
        name: "Task",
        args: [
          {
            _tag: "TyVar",
            id: 0
          },
          {
            _tag: "TyVar",
            id: 2
          }
        ]
      }
    },
    traverse: {
      _tag: "TyFn",
      from: {
        _tag: "TyFn",
        from: {
          _tag: "TyVar",
          id: 0
        },
        to: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyVar",
              id: 1
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        }
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyVar",
              id: 0
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "Task",
          args: [
            {
              _tag: "TyCon",
              name: "Array",
              args: [
                {
                  _tag: "TyVar",
                  id: 1
                }
              ]
            },
            {
              _tag: "TyVar",
              id: 2
            }
          ]
        }
      }
    }
  },
  Str: {
    length: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "number",
        args: []
      }
    },
    concat: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "string",
          args: []
        },
        to: {
          _tag: "TyCon",
          name: "string",
          args: []
        }
      }
    },
    toUpper: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "string",
        args: []
      }
    },
    toLower: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "string",
        args: []
      }
    },
    trim: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "string",
        args: []
      }
    },
    split: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "string",
          args: []
        },
        to: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyCon",
              name: "string",
              args: []
            }
          ]
        }
      }
    },
    join: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "Array",
          args: [
            {
              _tag: "TyCon",
              name: "string",
              args: []
            }
          ]
        },
        to: {
          _tag: "TyCon",
          name: "string",
          args: []
        }
      }
    },
    contains: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "string",
          args: []
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      }
    },
    startsWith: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "string",
          args: []
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      }
    },
    endsWith: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "string",
          args: []
        },
        to: {
          _tag: "TyCon",
          name: "bool",
          args: []
        }
      }
    },
    slice: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "number",
          args: []
        },
        to: {
          _tag: "TyFn",
          from: {
            _tag: "TyCon",
            name: "string",
            args: []
          },
          to: {
            _tag: "TyCon",
            name: "string",
            args: []
          }
        }
      }
    },
    replace: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "string",
          args: []
        },
        to: {
          _tag: "TyFn",
          from: {
            _tag: "TyCon",
            name: "string",
            args: []
          },
          to: {
            _tag: "TyCon",
            name: "string",
            args: []
          }
        }
      }
    },
    get: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "string",
          args: []
        },
        to: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyCon",
              name: "string",
              args: []
            }
          ]
        }
      }
    },
    codeAt: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyFn",
        from: {
          _tag: "TyCon",
          name: "string",
          args: []
        },
        to: {
          _tag: "TyCon",
          name: "Option",
          args: [
            {
              _tag: "TyCon",
              name: "number",
              args: []
            }
          ]
        }
      }
    },
    fromCode: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "number",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "string",
        args: []
      }
    },
    chars: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "Array",
        args: [
          {
            _tag: "TyCon",
            name: "string",
            args: []
          }
        ]
      }
    },
    toNumber: {
      _tag: "TyFn",
      from: {
        _tag: "TyCon",
        name: "string",
        args: []
      },
      to: {
        _tag: "TyCon",
        name: "Option",
        args: [
          {
            _tag: "TyCon",
            name: "number",
            args: []
          }
        ]
      }
    }
  }
};
var _namespaceRuntime = {
  Array: {
    map: "map",
    filter: "filter",
    reduce: "reduce",
    length: "length",
    head: "_Array_head",
    get: "_Array_get",
    forEach: "_Array_forEach",
    find: "_Array_find",
    reverse: "_Array_reverse",
    concat: "_Array_concat",
    append: "_Array_append",
    prepend: "_Array_prepend",
    flatMap: "_Array_flatMap",
    take: "_Array_take",
    drop: "_Array_drop",
    tail: "_Array_tail",
    contains: "_Array_contains",
    sort: "_Array_sort",
    sortBy: "_Array_sortBy",
    dedupe: "_Array_dedupe",
    dedupeBy: "_Array_dedupeBy",
    max: "_Array_max",
    min: "_Array_min",
    maxBy: "_Array_maxBy",
    minBy: "_Array_minBy"
  },
  List: {
    map: "_List_map",
    filter: "_List_filter",
    concat: "_List_concat",
    flatMap: "_List_flatMap",
    head: "_List_head"
  },
  Set: {
    has: "_Set_has",
    add: "_Set_add",
    delete: "_Set_delete",
    size: "_Set_size",
    toArray: "_Set_toArray",
    fromArray: "_Set_fromArray",
    union: "_Set_union",
    intersect: "_Set_intersect",
    diff: "_Set_diff"
  },
  Map: {
    has: "_Map_has",
    getOr: "_Map_getOr",
    set: "_Map_set",
    delete: "_Map_delete",
    size: "_Map_size",
    keys: "_Map_keys",
    values: "_Map_values",
    get: "_Map_get"
  },
  Dict: {
    empty: "_Dict_empty",
    has: "_Dict_has",
    get: "_Dict_get",
    getOr: "_Dict_getOr",
    set: "_Dict_set",
    remove: "_Dict_remove",
    size: "_Dict_size",
    keys: "_Dict_keys",
    values: "_Dict_values",
    entries: "_Dict_entries",
    fromEntries: "_Dict_fromEntries",
    map: "_Dict_map"
  },
  Option: {
    map: "_Option_map",
    flatMap: "_Option_flatMap",
    mapOr: "_Option_mapOr",
    exists: "_Option_exists",
    contains: "_Option_contains",
    unwrapOr: "_Option_unwrapOr",
    orElse: "_Option_orElse",
    isSome: "_Option_isSome",
    isNone: "_Option_isNone"
  },
  Result: {
    map: "_Result_map",
    mapErr: "_Result_mapErr",
    flatMap: "_Result_flatMap",
    unwrapOr: "_Result_unwrapOr",
    isOk: "_Result_isOk",
    isErr: "_Result_isErr"
  },
  Task: {
    of: "_Task_of",
    fail: "_Task_fail",
    map: "_Task_map",
    mapErr: "_Task_mapErr",
    andThen: "_Task_andThen",
    recover: "_Task_recover",
    fromResult: "_Task_fromResult",
    match: "_Task_match",
    delay: "_Task_delay",
    run: "_Task_run",
    all: "_Task_all",
    race: "_Task_race",
    traverse: "_Task_traverse"
  },
  Str: {
    length: "_Str_length",
    concat: "_Str_concat",
    toUpper: "_Str_toUpper",
    toLower: "_Str_toLower",
    trim: "_Str_trim",
    split: "_Str_split",
    join: "_Str_join",
    contains: "_Str_contains",
    startsWith: "_Str_startsWith",
    endsWith: "_Str_endsWith",
    slice: "_Str_slice",
    replace: "_Str_replace",
    get: "_Str_get",
    codeAt: "_Str_codeAt",
    fromCode: "_Str_fromCode",
    chars: "_Str_chars",
    toNumber: "_Str_toNumber"
  }
};
var _preludeJsDefs = {
  _Result_match: `const _Result_match = (result, onErr, onOk) => {
  if (result._tag === "Err")
    return onErr(result.error);
  if (result._tag === "Ok")
    return onOk(result.value);
  throw new Error("non-exhaustive match");
};`,
  _Option_match: `const _Option_match = (option, onNone, onSome) => {
  if (option._tag === "None")
    return onNone();
  if (option._tag === "Some")
    return onSome(option.value);
  throw new Error("non-exhaustive match");
};`,
  _list: "const _list = (g) => ({ [Symbol.iterator]: g });",
  _curry: `const _curry = (n, f) => {
  const apply = (a) => {
    switch (a.length) {
      case 2:
        return f(a[0], a[1]);
      case 3:
        return f(a[0], a[1], a[2]);
      case 4:
        return f(a[0], a[1], a[2], a[3]);
      case 5:
        return f(a[0], a[1], a[2], a[3], a[4]);
      case 6:
        return f(a[0], a[1], a[2], a[3], a[4], a[5]);
      default:
        return f(...a);
    }
  };
  function c(...a) {
    if (a.length === n)
      return apply(a);
    if (a.length < n)
      return (...b) => c(...a, ...b);
    return a.slice(n).reduce((g, x) => g(x), apply(a.slice(0, n)));
  }
  if (n === 2)
    return (...a) => {
      if (a.length === 2)
        return f(a[0], a[1]);
      if (a.length !== 1)
        return c(...a);
      const x = a[0];
      return (...b) => b.length === 1 ? f(x, b[0]) : c(x, ...b);
    };
  if (n === 3)
    return (...a) => {
      if (a.length === 3)
        return f(a[0], a[1], a[2]);
      if (a.length === 2) {
        const [x, y] = a;
        return (...b) => b.length === 1 ? f(x, y, b[0]) : c(x, y, ...b);
      }
      if (a.length !== 1)
        return c(...a);
      const x = a[0];
      return _curry(2, (y, z) => f(x, y, z));
    };
  return c;
};`,
  _tuple: "const _tuple = (...xs) => xs;",
  _recur: `const _recur = (...args) => ({
  _tag: "recur",
  args
});`,
  _done: 'const _done = (value) => ({ _tag: "done", value });',
  Some: 'const Some = (value) => ({ _tag: "Some", value });',
  None: 'const None = { _tag: "None" };',
  Ok: 'const Ok = (value) => ({ _tag: "Ok", value });',
  Err: 'const Err = (error) => ({ _tag: "Err", error });',
  add: "const add = _curry(2, (a, b) => a + b);",
  sub: "const sub = _curry(2, (a, b) => a - b);",
  mul: "const mul = _curry(2, (a, b) => a * b);",
  div: "const div = _curry(2, (a, b) => a / b);",
  square: "const square = (x) => x * x;",
  sqrt: "const sqrt = (x) => Math.sqrt(x);",
  hypot: "const hypot = _curry(2, (a, b) => Math.hypot(a, b));",
  pi: "const pi = Math.PI;",
  concat: 'const concat = _curry(2, (a, b) => typeof a === "string" ? a + b : Array.isArray(a) ? a.concat(b) : _List_concat(a, b));',
  eq: `const eq = _curry(2, (x, y) => {
  if (x === y)
    return true;
  if (typeof x !== "object" || x === null || typeof y !== "object" || y === null)
    return false;
  const ax = Array.isArray(x);
  if (ax !== Array.isArray(y))
    return false;
  if (ax) {
    if (x.length !== y.length)
      return false;
    for (let i = 0;i < x.length; i++)
      if (!eq(x[i], y[i]))
        return false;
    return true;
  }
  if (x instanceof Map || y instanceof Map) {
    if (!(x instanceof Map) || !(y instanceof Map))
      return false;
    if (x.size !== y.size)
      return false;
    for (const [k, v] of x) {
      const key = _keyOf(y, k);
      if (!y.has(key) || !eq(v, y.get(key)))
        return false;
    }
    return true;
  }
  if (x instanceof Set || y instanceof Set) {
    if (!(x instanceof Set) || !(y instanceof Set))
      return false;
    if (x.size !== y.size)
      return false;
    for (const v of x)
      if (!y.has(_keyOf(y, v)))
        return false;
    return true;
  }
  if (typeof x[Symbol.iterator] === "function" || typeof y[Symbol.iterator] === "function")
    throw new TypeError("eq on List: force it first with List.toArray");
  const kx = Object.keys(x), ky = Object.keys(y);
  if (kx.length !== ky.length)
    return false;
  for (const k of kx)
    if (!Object.prototype.propertyIsEnumerable.call(y, k) || !eq(x[k], y[k]))
      return false;
  return true;
});`,
  _compareFieldNames: `const _compareFieldNames = (a, b) => {
  const ax = /^_(0|[1-9]\\d*)$/.test(a), bx = /^_(0|[1-9]\\d*)$/.test(b);
  if (ax !== bx)
    return ax ? -1 : 1;
  if (ax && a.length !== b.length)
    return a.length < b.length ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
};`,
  _compareSortedKeys: `const _compareSortedKeys = (keys, tagged) => {
  for (let i = 1;i < keys.length; i++) {
    const order = tagged ? _compareFieldNames(keys[i - 1], keys[i]) : keys[i - 1] < keys[i] ? -1 : 1;
    if (order > 0) {
      if (keys.length > 16)
        return keys.slice().sort(tagged ? _compareFieldNames : undefined);
      const sorted = keys.slice();
      for (let at = i;at < sorted.length; at++) {
        const key = sorted[at];
        let before = at - 1;
        while (before >= 0 && (tagged ? _compareFieldNames(sorted[before], key) > 0 : sorted[before] > key)) {
          sorted[before + 1] = sorted[before];
          before -= 1;
        }
        sorted[before + 1] = key;
      }
      return sorted;
    }
  }
  return keys;
};`,
  _compareFirstKey: `const _compareFirstKey = (keys, tagged) => {
  let first = keys[0];
  for (let i = 1;i < keys.length; i++) {
    const key = keys[i];
    if (tagged ? _compareFieldNames(key, first) < 0 : key < first)
      first = key;
  }
  return first;
};`,
  _compareRecords: `const _compareRecords = (x, y) => {
  const keysX = Object.keys(x), keysY = Object.keys(y);
  const tx = Object.getPrototypeOf(x) !== null && keysX.includes("_tag") ? x._tag : undefined, ty = Object.getPrototypeOf(y) !== null && keysY.includes("_tag") ? y._tag : undefined;
  const tagged = typeof tx === "string", otherTagged = typeof ty === "string";
  if (tagged !== otherTagged)
    return tagged ? -1 : 1;
  if (tagged) {
    const tag = _compare(tx, ty);
    if (tag !== 0)
      return tag;
  }
  const fieldsX = tagged ? keysX.filter((k) => k !== "_tag") : keysX, fieldsY = tagged ? keysY.filter((k) => k !== "_tag") : keysY;
  if (fieldsX.length === 0 || fieldsY.length === 0)
    return _compare(fieldsX.length, fieldsY.length);
  let sameKeys = fieldsX.length === fieldsY.length;
  for (let i = 0;sameKeys && i < fieldsX.length; i++) {
    if (fieldsX[i] !== fieldsY[i])
      sameKeys = false;
  }
  const firstX = _compareFirstKey(fieldsX, tagged), firstY = sameKeys ? firstX : _compareFirstKey(fieldsY, tagged);
  if (firstX !== firstY)
    return tagged ? _compareFieldNames(firstX, firstY) : _compare(firstX, firstY);
  const firstLeft = x[firstX], firstRight = y[firstY];
  if (firstLeft !== firstRight) {
    const firstValue = _compare(firstLeft, firstRight);
    if (firstValue !== 0)
      return firstValue;
  }
  const kx = _compareSortedKeys(fieldsX, tagged), ky = sameKeys ? kx : _compareSortedKeys(fieldsY, tagged);
  const n = Math.min(kx.length, ky.length);
  for (let i = 1;i < n; i++) {
    if (kx[i] !== ky[i])
      return tagged ? _compareFieldNames(kx[i], ky[i]) : _compare(kx[i], ky[i]);
    const left = x[kx[i]], right = y[ky[i]];
    if (left !== right) {
      const value = _compare(left, right);
      if (value !== 0)
        return value;
    }
  }
  return _compare(kx.length, ky.length);
};`,
  _compare: `const _compare = (x, y) => {
  if (x === y)
    return 0;
  if (x === undefined || y === undefined)
    return x === undefined ? -1 : 1;
  if (x === null || y === null)
    return x === null ? -1 : 1;
  const t = typeof x;
  if (t === "number" || t === "string" || t === "boolean")
    return x < y ? -1 : x > y ? 1 : 0;
  if (Array.isArray(x) && Array.isArray(y)) {
    const n = Math.min(x.length, y.length);
    for (let i = 0;i < n; i++) {
      const c = _compare(x[i], y[i]);
      if (c !== 0)
        return c;
    }
    return _compare(x.length, y.length);
  }
  if (x instanceof Map && y instanceof Map) {
    const kx = [...x.keys()].sort(_compare), ky = [...y.keys()].sort(_compare);
    const n = Math.min(kx.length, ky.length);
    for (let i = 0;i < n; i++) {
      const kc = _compare(kx[i], ky[i]);
      if (kc !== 0)
        return kc;
      const vc = _compare(x.get(kx[i]), y.get(ky[i]));
      if (vc !== 0)
        return vc;
    }
    return _compare(kx.length, ky.length);
  }
  if (x instanceof Set && y instanceof Set) {
    const ex = [...x].sort(_compare), ey = [...y].sort(_compare);
    const n = Math.min(ex.length, ey.length);
    for (let i = 0;i < n; i++) {
      const c = _compare(ex[i], ey[i]);
      if (c !== 0)
        return c;
    }
    return _compare(ex.length, ey.length);
  }
  if (typeof x === "object" && x !== null && (!Array.isArray(x) && typeof x[Symbol.iterator] === "function" || typeof y === "object" && !Array.isArray(y) && typeof y[Symbol.iterator] === "function"))
    throw new TypeError("compare on List: force it first with List.toArray");
  if (typeof x !== "object" || typeof y !== "object")
    return 0;
  return _compareRecords(x, y);
};`,
  compare: "const compare = _curry(2, _compare);",
  show: 'const show = (x) => {\n  const t = typeof x;\n  if (t === "string")\n    return JSON.stringify(x);\n  if (t !== "object" || x === null)\n    return String(x);\n  if (Array.isArray(x))\n    return `[${x.map(show).join(", ")}]`;\n  if (x instanceof Map)\n    return `#{${[...x.entries()].map((e) => `${show(e[0])}: ${show(e[1])}`).join(", ")}}`;\n  if (x instanceof Set)\n    return `#{${[...x].map(show).join(", ")}}`;\n  if (typeof x[Symbol.iterator] === "function")\n    return "<List>";\n  const dict = Object.getPrototypeOf(x) === null;\n  if (!dict && typeof x._tag === "string") {\n    const ks = Object.keys(x).filter((k) => k !== "_tag");\n    return ks.length === 0 ? x._tag : `${x._tag}(${ks.map((k) => show(x[k])).join(", ")})`;\n  }\n  const ks = Object.keys(x);\n  return ks.length === 0 ? dict ? "{}" : String(x) : `{ ${ks.map((k) => `${k}: ${show(x[k])}`).join(", ")} }`;\n};',
  ignore: `const ignore = (_x) => {
  return;
};`,
  lt: "const lt = _curry(2, (a, b) => a < b);",
  gt: "const gt = _curry(2, (a, b) => a > b);",
  gte: "const gte = _curry(2, (a, b) => a >= b);",
  lte: "const lte = _curry(2, (a, b) => a <= b);",
  not: "const not = (b) => !b;",
  and: "const and = _curry(2, (a, b) => a && b);",
  or: "const or = _curry(2, (a, b) => a || b);",
  min: "const min = _curry(2, (a, b) => Math.min(a, b));",
  max: "const max = _curry(2, (a, b) => Math.max(a, b));",
  pow: "const pow = _curry(2, (a, b) => a ** b);",
  mod: "const mod = _curry(2, (a, b) => (a % b + b) % b);",
  abs: "const abs = (x) => Math.abs(x);",
  floor: "const floor = (x) => Math.floor(x);",
  ceil: "const ceil = (x) => Math.ceil(x);",
  round: "const round = (x) => Math.round(x);",
  sign: "const sign = (x) => Math.sign(x);",
  negate: "const negate = (x) => -x;",
  length: "const length = (xs) => xs.length;",
  map: "const map = _curry(2, (f, xs) => xs.map((x) => f(x)));",
  filter: "const filter = _curry(2, (f, xs) => xs.filter((x) => f(x)));",
  reduce: "const reduce = _curry(3, (f, init, xs) => xs.reduce((acc, x) => f(acc)(x), init));",
  identity: "const identity = (x) => x;",
  always: "const always = _curry(2, (x, _y) => x);",
  compose: "const compose = _curry(3, (f, g, x) => f(g(x)));",
  capitalize: "const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);",
  range: `const range = _curry(2, (lo, hi) => _list(function* () {
  for (let i = lo;i < hi; i++)
    yield i;
}));`,
  iterate: `const iterate = _curry(2, (f, x) => _list(function* () {
  let v = x;
  for (;; ) {
    yield v;
    v = f(v);
  }
}));`,
  repeat: `const repeat = (x) => _list(function* () {
  for (;; )
    yield x;
});`,
  take: `const take = _curry(2, (n, xs) => _list(function* () {
  let i = 0;
  for (const x of xs) {
    if (i >= n)
      break;
    yield x;
    i++;
  }
}));`,
  takeWhile: `const takeWhile = _curry(2, (p, xs) => _list(function* () {
  for (const x of xs) {
    if (!p(x))
      break;
    yield x;
  }
}));`,
  drop: `const drop = _curry(2, (n, xs) => _list(function* () {
  let i = 0;
  for (const x of xs) {
    if (i < n) {
      i++;
      continue;
    }
    yield x;
  }
}));`,
  fromArray: `const fromArray = (xs) => _list(function* () {
  yield* xs;
});`,
  toArray: "const toArray = (xs) => [...xs];",
  _List_map: `const _List_map = _curry(2, (f, xs) => _list(function* () {
  for (const x of xs)
    yield f(x);
}));`,
  _List_filter: `const _List_filter = _curry(2, (p, xs) => _list(function* () {
  for (const x of xs)
    if (p(x))
      yield x;
}));`,
  _List_concat: `const _List_concat = _curry(2, (xs, ys) => _list(function* () {
  yield* xs;
  yield* ys;
}));`,
  _List_flatMap: `const _List_flatMap = _curry(2, (f, xs) => _list(function* () {
  for (const x of xs)
    yield* f(x);
}));`,
  _keyOf: `const _keyOf = (c, k) => {
  if (k === null || typeof k !== "object" || c.has(k))
    return k;
  for (const x of c.keys())
    if (eq(k, x))
      return x;
  return k;
};`,
  _setAdd: "const _setAdd = (s, x) => s.add(_keyOf(s, x));",
  _Set_has: "const _Set_has = _curry(2, (x, s) => s.has(_keyOf(s, x)));",
  _Set_add: "const _Set_add = _curry(2, (x, s) => _setAdd(new Set(s), x));",
  _Set_delete: `const _Set_delete = _curry(2, (x, s) => {
  const n = new Set(s);
  n.delete(_keyOf(s, x));
  return n;
});`,
  _Set_size: "const _Set_size = (s) => s.size;",
  _Set_toArray: "const _Set_toArray = (s) => [...s];",
  _Set_fromArray: `const _Set_fromArray = (xs) => {
  const n = new Set;
  for (const x of xs)
    _setAdd(n, x);
  return n;
};`,
  _Set_union: `const _Set_union = _curry(2, (a, b) => {
  const n = new Set(a);
  for (const x of b)
    _setAdd(n, x);
  return n;
});`,
  _Set_intersect: "const _Set_intersect = _curry(2, (a, b) => new Set([...a].filter((x) => b.has(_keyOf(b, x)))));",
  _Set_diff: "const _Set_diff = _curry(2, (a, b) => new Set([...a].filter((x) => !b.has(_keyOf(b, x)))));",
  _Map_has: "const _Map_has = _curry(2, (k, m) => m.has(_keyOf(m, k)));",
  _Map_getOr: `const _Map_getOr = _curry(3, (d, k, m) => {
  const key = _keyOf(m, k);
  return m.has(key) ? m.get(key) : d;
});`,
  _Map_set: `const _Map_set = _curry(3, (k, v, m) => {
  const n = new Map(m);
  n.set(_keyOf(m, k), v);
  return n;
});`,
  _Map_delete: `const _Map_delete = _curry(2, (k, m) => {
  const n = new Map(m);
  n.delete(_keyOf(m, k));
  return n;
});`,
  _Map_size: "const _Map_size = (m) => m.size;",
  _Map_keys: "const _Map_keys = (m) => [...m.keys()];",
  _Map_values: "const _Map_values = (m) => [...m.values()];",
  _Map_get: `const _Map_get = _curry(2, (k, m) => {
  const key = _keyOf(m, k);
  return m.has(key) ? Some(m.get(key)) : None;
});`,
  _dictFrom: `const _dictFrom = (entries) => {
  const d = Object.create(null);
  for (const [k, v] of entries)
    d[k] = v;
  return d;
};`,
  _dictHas: "const _dictHas = (k, d) => Object.getOwnPropertyDescriptor(d, k) !== undefined;",
  _Dict_empty: "const _Dict_empty = Object.freeze(Object.create(null));",
  _Dict_has: "const _Dict_has = _curry(2, (k, d) => _dictHas(k, d));",
  _Dict_get: "const _Dict_get = _curry(2, (k, d) => _dictHas(k, d) ? Some(d[k]) : None);",
  _Dict_getOr: "const _Dict_getOr = _curry(3, (def, k, d) => _dictHas(k, d) ? d[k] : def);",
  _Dict_set: `const _Dict_set = _curry(3, (k, v, d) => {
  const n = _dictFrom(Object.entries(d));
  n[k] = v;
  return n;
});`,
  _Dict_remove: `const _Dict_remove = _curry(2, (k, d) => {
  const n = _dictFrom(Object.entries(d));
  delete n[k];
  return n;
});`,
  _Dict_size: "const _Dict_size = (d) => Object.keys(d).length;",
  _Dict_keys: "const _Dict_keys = (d) => Object.keys(d);",
  _Dict_values: "const _Dict_values = (d) => Object.values(d);",
  _Dict_entries: "const _Dict_entries = (d) => Object.entries(d);",
  _Dict_fromEntries: "const _Dict_fromEntries = (es) => _dictFrom(es);",
  _Dict_map: "const _Dict_map = _curry(2, (f, d) => _dictFrom(Object.entries(d).map(([k, v]) => [k, f(v)])));",
  _Option_map: 'const _Option_map = _curry(2, (f, o) => o._tag === "Some" ? Some(f(o.value)) : None);',
  _Option_flatMap: 'const _Option_flatMap = _curry(2, (f, o) => o._tag === "Some" ? f(o.value) : None);',
  _Option_mapOr: 'const _Option_mapOr = _curry(3, (d, f, o) => o._tag === "Some" ? f(o.value) : d);',
  _Option_exists: 'const _Option_exists = _curry(2, (p, o) => o._tag === "Some" && p(o.value));',
  _Option_contains: 'const _Option_contains = _curry(2, (x, o) => o._tag === "Some" && eq(x, o.value));',
  _Option_unwrapOr: 'const _Option_unwrapOr = _curry(2, (d, o) => o._tag === "Some" ? o.value : d);',
  _Option_orElse: 'const _Option_orElse = _curry(2, (fb, o) => o._tag === "Some" ? o : fb);',
  _Option_isSome: 'const _Option_isSome = (o) => o._tag === "Some";',
  _Option_isNone: 'const _Option_isNone = (o) => o._tag === "None";',
  _Result_map: 'const _Result_map = _curry(2, (f, r) => r._tag === "Ok" ? Ok(f(r.value)) : r);',
  _Result_mapErr: 'const _Result_mapErr = _curry(2, (f, r) => r._tag === "Err" ? Err(f(r.error)) : r);',
  _Result_flatMap: 'const _Result_flatMap = _curry(2, (f, r) => r._tag === "Ok" ? f(r.value) : r);',
  _Result_unwrapOr: 'const _Result_unwrapOr = _curry(2, (d, r) => r._tag === "Ok" ? r.value : d);',
  _Result_isOk: 'const _Result_isOk = (r) => r._tag === "Ok";',
  _Result_isErr: 'const _Result_isErr = (r) => r._tag === "Err";',
  _List_head: `const _List_head = (xs) => {
  for (const x of xs)
    return Some(x);
  return None;
};`,
  _Array_head: "const _Array_head = (xs) => xs.length > 0 ? Some(xs[0]) : None;",
  _Array_forEach: `const _Array_forEach = _curry(2, (f, xs) => {
  for (const x of xs)
    f(x);
});`,
  _Array_get: "const _Array_get = _curry(2, (i, xs) => i >= 0 && i < xs.length ? Some(xs[i]) : None);",
  _Array_find: `const _Array_find = _curry(2, (p, xs) => {
  for (const x of xs)
    if (p(x))
      return Some(x);
  return None;
});`,
  _Array_reverse: "const _Array_reverse = (xs) => [...xs].reverse();",
  _Array_concat: "const _Array_concat = _curry(2, (xs, ys) => xs.concat(ys));",
  _Array_append: "const _Array_append = _curry(2, (x, xs) => [...xs, x]);",
  _Array_prepend: "const _Array_prepend = _curry(2, (x, xs) => [x, ...xs]);",
  _Array_flatMap: "const _Array_flatMap = _curry(2, (f, xs) => xs.flatMap((x) => f(x)));",
  _Array_take: "const _Array_take = _curry(2, (n, xs) => xs.slice(0, n));",
  _Array_drop: "const _Array_drop = _curry(2, (n, xs) => xs.slice(n));",
  _Array_tail: "const _Array_tail = (xs) => xs.slice(1);",
  _Array_contains: "const _Array_contains = _curry(2, (x, xs) => xs.some((y) => eq(x, y)));",
  _Array_sort: "const _Array_sort = (xs) => [...xs].sort(compare);",
  _Array_sortBy: "const _Array_sortBy = _curry(2, (f, xs) => [...xs].sort((a, b) => compare(f(a), f(b))));",
  _Array_dedupe: "const _Array_dedupe = (xs) => xs.filter((x, i) => xs.findIndex((y) => eq(x, y)) === i);",
  _Array_dedupeBy: `const _Array_dedupeBy = _curry(2, (f, xs) => {
  const primitive = new Set;
  const structural = [];
  return xs.filter((x) => {
    const k = f(x);
    if (k !== null && typeof k === "object") {
      if (structural.some((s) => eq(s, k)))
        return false;
      structural.push(k);
      return true;
    }
    if (Number.isNaN(k))
      return true;
    if (primitive.has(k))
      return false;
    primitive.add(k);
    return true;
  });
});`,
  _Array_max: "const _Array_max = (xs) => xs.length ? Some(xs.reduce((a, b) => compare(a, b) >= 0 ? a : b)) : None;",
  _Array_min: "const _Array_min = (xs) => xs.length ? Some(xs.reduce((a, b) => compare(a, b) <= 0 ? a : b)) : None;",
  _Array_maxBy: "const _Array_maxBy = _curry(2, (f, xs) => xs.length ? Some(xs.reduce((a, b) => compare(f(a), f(b)) >= 0 ? a : b)) : None);",
  _Array_minBy: "const _Array_minBy = _curry(2, (f, xs) => xs.length ? Some(xs.reduce((a, b) => compare(f(a), f(b)) <= 0 ? a : b)) : None);",
  _Str_length: "const _Str_length = (s) => s.length;",
  _Str_concat: "const _Str_concat = _curry(2, (a, b) => a + b);",
  _Str_toUpper: "const _Str_toUpper = (s) => s.toUpperCase();",
  _Str_toLower: "const _Str_toLower = (s) => s.toLowerCase();",
  _Str_trim: "const _Str_trim = (s) => s.trim();",
  _Str_split: "const _Str_split = _curry(2, (sep, s) => s.split(sep));",
  _Str_join: "const _Str_join = _curry(2, (sep, xs) => xs.join(sep));",
  _Str_contains: "const _Str_contains = _curry(2, (needle, s) => s.includes(needle));",
  _Str_startsWith: "const _Str_startsWith = _curry(2, (p, s) => s.startsWith(p));",
  _Str_endsWith: "const _Str_endsWith = _curry(2, (p, s) => s.endsWith(p));",
  _Str_slice: "const _Str_slice = _curry(3, (start, end, s) => s.slice(start, end));",
  _Str_replace: "const _Str_replace = _curry(3, (find, repl, s) => s.replaceAll(find, repl));",
  _Str_get: "const _Str_get = _curry(2, (i, s) => i >= 0 && i < s.length ? Some(s[i]) : None);",
  _Str_codeAt: "const _Str_codeAt = _curry(2, (i, s) => i >= 0 && i < s.length ? Some(s.charCodeAt(i)) : None);",
  _Str_fromCode: "const _Str_fromCode = (n) => String.fromCharCode(n);",
  _Str_chars: "const _Str_chars = (s) => [...s];",
  _Str_toNumber: `const _Str_toNumber = (s) => {
  const n = Number(s);
  return Number.isNaN(n) ? None : Some(n);
};`,
  _Task_of: "const _Task_of = (x) => () => Promise.resolve(Ok(x));",
  _Task_fail: "const _Task_fail = (e) => () => Promise.resolve(Err(e));",
  _Task_map: 'const _Task_map = _curry(2, (f, t) => () => t().then((r) => r._tag === "Ok" ? Ok(f(r.value)) : r));',
  _Task_mapErr: 'const _Task_mapErr = _curry(2, (f, t) => () => t().then((r) => r._tag === "Err" ? Err(f(r.error)) : r));',
  _Task_andThen: 'const _Task_andThen = _curry(2, (f, t) => () => t().then((r) => r._tag === "Ok" ? f(r.value)() : r));',
  _Task_recover: 'const _Task_recover = _curry(2, (f, t) => () => t().then((r) => r._tag === "Err" ? f(r.error)() : r));',
  _Task_fromResult: "const _Task_fromResult = (r) => () => Promise.resolve(r);",
  _Task_match: 'const _Task_match = _curry(3, (onOk, onErr, t) => () => t().then((r) => Ok(r._tag === "Ok" ? onOk(r.value) : onErr(r.error))));',
  _Task_delay: "const _Task_delay = _curry(2, (ms, x) => () => new Promise((res) => setTimeout(() => res(Ok(x)), ms)));",
  _Task_run: "const _Task_run = (t) => t();",
  _Task_all: `const _Task_all = (ts) => () => new Promise((res) => {
  const out = new Array(ts.length);
  let left = ts.length;
  let settled = false;
  if (left === 0) {
    res(Ok(out));
    return;
  }
  ts.forEach((t, i) => {
    t().then((r) => {
      if (settled)
        return;
      if (r._tag === "Err") {
        settled = true;
        res(r);
        return;
      }
      out[i] = r.value;
      left -= 1;
      if (left === 0) {
        settled = true;
        res(Ok(out));
      }
    });
  });
});`,
  _Task_race: `const _Task_race = (ts) => () => new Promise((res) => {
  let settled = false;
  ts.forEach((t) => {
    t().then((r) => {
      if (settled)
        return;
      settled = true;
      res(r);
    });
  });
});`,
  _Task_traverse: "const _Task_traverse = _curry(2, (f, xs) => _Task_all(xs.map(f)));"
};
var _runtimeDeps = {
  add: [
    "_curry"
  ],
  sub: [
    "_curry"
  ],
  mul: [
    "_curry"
  ],
  div: [
    "_curry"
  ],
  hypot: [
    "_curry"
  ],
  concat: [
    "_curry",
    "_List_concat"
  ],
  eq: [
    "_curry",
    "_keyOf"
  ],
  _compareSortedKeys: [
    "_compareFieldNames"
  ],
  _compareFirstKey: [
    "_compareFieldNames"
  ],
  _compareRecords: [
    "_compareFieldNames",
    "_compareSortedKeys",
    "_compareFirstKey",
    "_compare"
  ],
  _compare: [
    "_compareRecords"
  ],
  compare: [
    "_curry",
    "_compare"
  ],
  lt: [
    "_curry"
  ],
  gt: [
    "_curry"
  ],
  gte: [
    "_curry"
  ],
  lte: [
    "_curry"
  ],
  and: [
    "_curry"
  ],
  or: [
    "_curry"
  ],
  min: [
    "_curry"
  ],
  max: [
    "_curry"
  ],
  pow: [
    "_curry"
  ],
  mod: [
    "_curry"
  ],
  map: [
    "_curry"
  ],
  filter: [
    "_curry"
  ],
  reduce: [
    "_curry"
  ],
  always: [
    "_curry"
  ],
  compose: [
    "_curry"
  ],
  range: [
    "_list",
    "_curry"
  ],
  iterate: [
    "_list",
    "_curry"
  ],
  repeat: [
    "_list"
  ],
  take: [
    "_list",
    "_curry"
  ],
  takeWhile: [
    "_list",
    "_curry"
  ],
  drop: [
    "_list",
    "_curry"
  ],
  fromArray: [
    "_list"
  ],
  _List_map: [
    "_list",
    "_curry"
  ],
  _List_filter: [
    "_list",
    "_curry"
  ],
  _List_concat: [
    "_list",
    "_curry"
  ],
  _List_flatMap: [
    "_list",
    "_curry"
  ],
  _keyOf: [
    "eq"
  ],
  _setAdd: [
    "_keyOf"
  ],
  _Set_has: [
    "_curry",
    "_keyOf"
  ],
  _Set_add: [
    "_curry",
    "_setAdd"
  ],
  _Set_delete: [
    "_curry",
    "_keyOf"
  ],
  _Set_fromArray: [
    "_setAdd"
  ],
  _Set_union: [
    "_curry",
    "_setAdd"
  ],
  _Set_intersect: [
    "_curry",
    "_keyOf"
  ],
  _Set_diff: [
    "_curry",
    "_keyOf"
  ],
  _Map_has: [
    "_curry",
    "_keyOf"
  ],
  _Map_getOr: [
    "_curry",
    "_keyOf"
  ],
  _Map_set: [
    "_curry",
    "_keyOf"
  ],
  _Map_delete: [
    "_curry",
    "_keyOf"
  ],
  _Map_get: [
    "_curry",
    "Some",
    "None",
    "_keyOf"
  ],
  _Dict_has: [
    "_curry",
    "_dictHas"
  ],
  _Dict_get: [
    "_curry",
    "Some",
    "None",
    "_dictHas"
  ],
  _Dict_getOr: [
    "_curry",
    "_dictHas"
  ],
  _Dict_set: [
    "_curry",
    "_dictFrom"
  ],
  _Dict_remove: [
    "_curry",
    "_dictFrom"
  ],
  _Dict_fromEntries: [
    "_dictFrom"
  ],
  _Dict_map: [
    "_curry",
    "_dictFrom"
  ],
  _Option_map: [
    "_curry",
    "Some",
    "None"
  ],
  _Option_flatMap: [
    "_curry",
    "None"
  ],
  _Option_mapOr: [
    "_curry"
  ],
  _Option_exists: [
    "_curry"
  ],
  _Option_contains: [
    "_curry",
    "eq"
  ],
  _Option_unwrapOr: [
    "_curry"
  ],
  _Option_orElse: [
    "_curry"
  ],
  _Result_map: [
    "_curry",
    "Ok"
  ],
  _Result_mapErr: [
    "_curry",
    "Err"
  ],
  _Result_flatMap: [
    "_curry"
  ],
  _Result_unwrapOr: [
    "_curry"
  ],
  _List_head: [
    "Some",
    "None"
  ],
  _Array_head: [
    "Some",
    "None"
  ],
  _Array_forEach: [
    "_curry"
  ],
  _Array_get: [
    "_curry",
    "Some",
    "None"
  ],
  _Array_find: [
    "_curry",
    "Some",
    "None"
  ],
  _Array_concat: [
    "_curry"
  ],
  _Array_append: [
    "_curry"
  ],
  _Array_prepend: [
    "_curry"
  ],
  _Array_flatMap: [
    "_curry"
  ],
  _Array_take: [
    "_curry"
  ],
  _Array_drop: [
    "_curry"
  ],
  _Array_contains: [
    "_curry",
    "eq"
  ],
  _Array_sort: [
    "compare"
  ],
  _Array_sortBy: [
    "_curry",
    "compare"
  ],
  _Array_dedupe: [
    "eq"
  ],
  _Array_dedupeBy: [
    "_curry",
    "eq"
  ],
  _Array_max: [
    "Some",
    "None",
    "compare"
  ],
  _Array_min: [
    "Some",
    "None",
    "compare"
  ],
  _Array_maxBy: [
    "_curry",
    "Some",
    "None",
    "compare"
  ],
  _Array_minBy: [
    "_curry",
    "Some",
    "None",
    "compare"
  ],
  _Str_concat: [
    "_curry"
  ],
  _Str_split: [
    "_curry"
  ],
  _Str_join: [
    "_curry"
  ],
  _Str_contains: [
    "_curry"
  ],
  _Str_startsWith: [
    "_curry"
  ],
  _Str_endsWith: [
    "_curry"
  ],
  _Str_slice: [
    "_curry"
  ],
  _Str_replace: [
    "_curry"
  ],
  _Str_get: [
    "_curry",
    "Some",
    "None"
  ],
  _Str_codeAt: [
    "_curry",
    "Some",
    "None"
  ],
  _Str_toNumber: [
    "Some",
    "None"
  ],
  _Task_of: [
    "Ok"
  ],
  _Task_fail: [
    "Err"
  ],
  _Task_map: [
    "_curry",
    "Ok"
  ],
  _Task_mapErr: [
    "_curry",
    "Err"
  ],
  _Task_andThen: [
    "_curry"
  ],
  _Task_recover: [
    "_curry"
  ],
  _Task_match: [
    "_curry",
    "Ok"
  ],
  _Task_delay: [
    "_curry",
    "Ok"
  ],
  _Task_all: [
    "Ok"
  ],
  _Task_traverse: [
    "_curry",
    "_Task_all"
  ]
};
var _map = (o) => new Map(Object.entries(o));
var _mapmap = (o) => new Map(Object.entries(o).map(([k, v]) => [k, _map(v)]));
var builtins = _map(_builtins);
var namespaces = _mapmap(_namespaces);
var namespaceRuntime = _mapmap(_namespaceRuntime);
var preludeJsDefs = _map(_preludeJsDefs);
var runtimeDeps = _map(_runtimeDeps);

var runtimeAnnotation$ = (name, arity) => {
  const ty = _Option_match22(_Map_get12(name, builtins), () => reduce8(_curry24(2, (found, ns) => {
    const members = _Option_unwrapOr14(new Map, _Map_get12(ns, namespaceRuntime));
    return reduce8(_curry24(2, (acc, key) => eq20(_Map_get12(key, members), Some22(name)) ? _Option_flatMap4(_Map_get12(key), _Map_get12(ns, namespaces)) : acc), found, _Map_keys11(members));
  }), None22, _Map_keys11(namespaceRuntime)), (t) => Some22(t));
  return _Option_map4((t) => flatHostType(t, arity), ty);
};
var runtimeAnnotation = _curry24(2, runtimeAnnotation$);
var defaultOpts = { open: false, runtime: true, docs: true, moduleExt: ".js", strictEntry: false, plugins: None22, dtsTypeNames: new Map };
var afterBlanks$ = (s, i) => ((_v) => _v._tag === "Some" && _v.value === " " ? afterBlanks$(s, i + 1) : _v._tag === "Some" && _v.value === "\t" ? afterBlanks$(s, i + 1) : ((other) => other)(_v))(_Str_get5(i, s));
var afterBlanks = _curry24(2, afterBlanks$);
var openDirective = (src) => {
  const t = _Str_trim2(src);
  return and16(_Str_startsWith8('"use open"', t), ((_v) => _v._tag === "None" ? true : _v._tag === "Some" && _v.value === `
` ? true : _v._tag === "Some" && _v.value === "r" ? true : false)(afterBlanks$(t, 10)));
};
var openMode$ = (src, requested) => or15(requested, openDirective(src));
var openMode = _curry24(2, openMode$);
var noSuggestions2 = [];
var stampStage$ = (kind, e) => ({ kind, message: e.message, start: e.start, end: e.end, help: None22, suggestions: noSuggestions2 });
var stampStage = _curry24(2, stampStage$);
var stampType = (e) => ({ kind: "type", message: e.message, start: e.start, end: e.end, help: e.help, suggestions: e.suggestions });
var typecheckWith$ = (prog, open, plugins) => _Result_mapErr((es) => map16(stampType, es), _Result_map7((_) => prog, inferProgramWith(prog, builtins, namespaces, open, plugins)));
var typecheckWith = _curry24(3, typecheckWith$);
var frontend$ = (src, plugins) => _Result_match6(lex(src), (e) => Err10([stampStage$("lex", e)]), (tokens) => {
  const parsed = parseRecovering(tokens, plugins);
  return ((_v) => _v.length === 0 ? _Result_mapErr((es) => map16((e) => stampStage$("check", e), es), checkAll(parsed.stmts)) : ((ds) => Err10(map16((e) => stampStage$("parse", e), ds)))(_v))(parsed.diagnostics);
});
var frontend = _curry24(2, frontend$);
var pipelineWith$ = (src, open, plugins) => _Result_flatMap8((stmts) => typecheckWith$(stmts, open, plugins), frontend$(src, plugins));
var pipelineWith = _curry24(3, pipelineWith$);
var typedProgramWith$ = (src, opts) => _Result_flatMap8((stmts) => _Result_mapErr((es) => map16(stampType, es), _Result_map7((r) => _tuple13(stmts, r), inferProgramTypesWith(stmts, builtins, namespaces, openMode$(src, opts.open), opts.plugins))), frontend$(src, opts.plugins));
var typedProgramWith = _curry24(2, typedProgramWith$);
var typedQuery$ = (src, stmts, opts) => _Result_mapErr((es) => map16(stampType, es), _Result_map7((r) => ({ env: r.env, types: map16((hit) => ({ span: hit.span, ty: hit.ty, display: showType(widenLits(hit.ty)), sym: hit.sym }), r.types), aliases: r.aliases, letParams: r.letParams }), inferProgramTypesWith(stmts, builtins, namespaces, openMode$(src, opts.open), opts.plugins)));
var typedQuery = _curry24(3, typedQuery$);
var inferTypesWith$ = (src, opts) => _Result_flatMap8((stmts) => typedQuery$(src, stmts, opts), frontend$(src, opts.plugins));
var inferTypesWith = _curry24(2, inferTypesWith$);
var inferTypesRecoveringWith$ = (src, opts) => _Result_match6(lex(src), (e) => Err10([stampStage$("lex", e)]), (tokens) => {
  const parsed = parseRecovering(tokens, opts.plugins);
  return _Result_flatMap8((stmts) => typedQuery$(src, stmts, opts), _Result_mapErr((es) => map16((e) => stampStage$("check", e), es), checkAll(parsed.stmts)));
});
var inferTypesRecoveringWith = _curry24(2, inferTypesRecoveringWith$);
var nominalTypeName$2 = (ty, aliases) => nominalTypeName(ty, aliases);
var nominalTypeName2 = _curry24(2, nominalTypeName$2);
var symbolIndexSync$ = (path, origins, prelude, stmts) => indexWith(path, origins, prelude, stmts);
var symbolIndexSync = _curry24(4, symbolIndexSync$);
var emitJsWith$ = (stmts, opts) => codegenWith(stmts, new Map, opts.runtime, namespaceRuntime, preludeJsDefs, runtimeDeps, { ...jsGenOpts, docs: opts.docs, moduleExt: opts.moduleExt });
var emitJsWith = _curry24(2, emitJsWith$);
var compileWith$ = (src, opts) => _Result_map7((prog) => emitJsWith$(prog, opts), pipelineWith$(src, openMode$(src, opts.open), opts.plugins));
var compileWith = _curry24(2, compileWith$);
var noImportedKeys = new Map;
var emitTsWith = _curry24(4, (stmts, r, runtimeImport, opts) => emitTsModuleWith(stmts, r.env, r.types, r.letParams, r.aliases, noImportedKeys, [], namespaceRuntime, preludeJsDefs, runtimeDeps, runtimeImport, opts.docs, bindingHooksFor(opts.plugins)));
var compileTsWith$ = (src, runtimeImport, opts) => _Result_flatMap8((stmts) => _Result_mapErr((es) => map16(stampType, es), _Result_map7((r) => emitTsWith(stmts, r, runtimeImport, opts), inferProgramTypesWith(stmts, builtins, namespaces, openMode$(src, opts.open), opts.plugins))), frontend$(src, opts.plugins));
var compileTsWith = _curry24(3, compileTsWith$);
var compileTs$ = (src, runtimeImport) => compileTsWith$(src, runtimeImport, defaultOpts);
var compileTs = _curry24(2, compileTs$);

var writtenQualsIn$ = (te, local, acc) => {
  const $match = te;
  switch ($match._tag) {
    case "TyName": {
      return acc;
    }
    case "TyLit": {
      return acc;
    }
    case "TyArrow": {
      const { from, to } = $match;
      return writtenQualsIn$(to, local, writtenQualsIn$(from, local, acc));
    }
    case "TyApp": {
      const { args } = $match;
      return writtenQualsInAll$(args, local, acc, 0);
    }
    case "TyTuple": {
      const { elems } = $match;
      return writtenQualsInAll$(elems, local, acc, 0);
    }
    case "TyList": {
      const { elem } = $match;
      return writtenQualsIn$(elem, local, acc);
    }
    case "TyUnion": {
      const { members } = $match;
      return writtenQualsInAll$(members, local, acc, 0);
    }
    case "TyQual": {
      const { alias, name, args } = $match;
      const acc1 = or16(_Set_has8(name, local), _Map_has8(name, acc)) ? acc : _Map_set11(name, `${alias}.${name}`, acc);
      return writtenQualsInAll$(args, local, acc1, 0);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var writtenQualsIn = _curry25(3, writtenQualsIn$);
var writtenQualsInAll$ = (tes, local, acc, i) => _Option_match23(_Array_get21(i, tes), () => acc, (te) => writtenQualsInAll$(tes, local, writtenQualsIn$(te, local, acc), i + 1));
var writtenQualsInAll = _curry25(4, writtenQualsInAll$);
var ctorQualsFrom$ = (ctors, local, acc, i) => _Option_match23(_Array_get21(i, ctors), () => acc, (c) => ctorQualsFrom$(ctors, local, writtenQualsInAll$(map17((f) => f.fieldType, c.fields), local, acc, 0), i + 1));
var ctorQualsFrom = _curry25(4, ctorQualsFrom$);
var writtenQualsFrom$ = (stmts, local, acc, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SExtern" ? (({ value: { typeExpr: te } }) => writtenQualsFrom$(stmts, local, writtenQualsIn$(te, local, acc), i + 1))(_v) : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { annot } }) => writtenQualsFrom$(stmts, local, _Option_match23(annot, () => acc, (te) => writtenQualsIn$(te, local, acc)), i + 1))(_v) : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { ctors, alias, aliasType } }) => ((acc1) => ((acc2) => ((acc3) => writtenQualsFrom$(stmts, local, acc3, i + 1))(_Option_match23(aliasType, () => acc2, (te) => writtenQualsIn$(te, local, acc2))))(_Option_match23(alias, () => acc1, (fields) => writtenQualsInAll$(map17((f) => f.fieldType, fields), local, acc1, 0))))(ctorQualsFrom$(ctors, local, acc, 0)))(_v) : _v._tag === "Some" ? writtenQualsFrom$(stmts, local, acc, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get21(i, stmts));
var writtenQualsFrom = _curry25(4, writtenQualsFrom$);
var qualifyRow$ = (row, qualify) => {
  const $match = row;
  switch ($match._tag) {
    case "RowEmpty": {
      return RowEmpty;
    }
    case "RowVar": {
      const { id } = $match;
      return RowVar(id);
    }
    case "RowExtend": {
      const { label, fieldType, optional, rest } = $match;
      return RowExtend(label, qualifyTy$(fieldType, qualify), optional, qualifyRow$(rest, qualify));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var qualifyRow = _curry25(2, qualifyRow$);
var qualifyTy$ = (t, qualify) => {
  const $match = t;
  switch ($match._tag) {
    case "TyVar": {
      const { id } = $match;
      return TyVar(id);
    }
    case "TyCon": {
      const { name, args } = $match;
      return TyCon(_Map_getOr8(name, name, qualify), map17((a) => qualifyTy$(a, qualify), args));
    }
    case "TyFn": {
      const { from, to } = $match;
      return TyFn(qualifyTy$(from, qualify), qualifyTy$(to, qualify));
    }
    case "TyRecord": {
      const { row } = $match;
      return TyRecord(qualifyRow$(row, qualify));
    }
    case "TySingleton": {
      const { base, value } = $match;
      return TySingleton(base, value);
    }
    case "TyOneOf": {
      const { members } = $match;
      return TyOneOf(map17((m) => qualifyTy$(m, qualify), members));
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var qualifyTy = _curry25(2, qualifyTy$);
var qualifyTe$ = (te, qualify) => {
  const $match = te;
  switch ($match._tag) {
    case "TyName": {
      const { name, span } = $match;
      return TyName(_Map_getOr8(name, name, qualify), span);
    }
    case "TyArrow": {
      const { from, to, span } = $match;
      return TyArrow(qualifyTe$(from, qualify), qualifyTe$(to, qualify), span);
    }
    case "TyApp": {
      const { ctor, args, span } = $match;
      return TyApp(_Map_getOr8(ctor, ctor, qualify), map17((a) => qualifyTe$(a, qualify), args), span);
    }
    case "TyTuple": {
      const { elems, span } = $match;
      return TyTuple(map17((e) => qualifyTe$(e, qualify), elems), span);
    }
    case "TyList": {
      const { elem, span } = $match;
      return TyList(qualifyTe$(elem, qualify), span);
    }
    case "TyQual": {
      const { alias, name, nameSpan, args, span } = $match;
      return TyQual(alias, name, nameSpan, map17((a) => qualifyTe$(a, qualify), args), span);
    }
    case "TyLit": {
      const { value, span } = $match;
      return TyLit(value, span);
    }
    case "TyUnion": {
      const { members, span } = $match;
      return TyUnion(map17((m) => qualifyTe$(m, qualify), members), span);
    }
    default: {
      throw new Error("non-exhaustive match");
    }
  }
};
var qualifyTe2 = _curry25(2, qualifyTe$);
var qualifyField$ = (f, qualify) => ({ name: f.name, fieldType: qualifyTe$(f.fieldType, qualify) });
var qualifyField2 = _curry25(2, qualifyField$);
var qualifyCtor$ = (c, qualify) => ({ name: c.name, fields: map17((f) => qualifyField$(f, qualify), c.fields), span: c.span });
var qualifyCtor = _curry25(2, qualifyCtor$);
var qualifyAliasField$ = (f, qualify) => ({ name: f.name, nameSpan: f.nameSpan, fieldType: qualifyTe$(f.fieldType, qualify), optional: f.optional, spread: f.spread });
var qualifyAliasField = _curry25(2, qualifyAliasField$);
var typeDeclsFrom$ = (stmts, aliases, recs, qualify, docs, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { name, params, ctors, alias, aliasType, doc } }) => ((rest) => ((docComment) => _Option_match23(alias, () => _Option_match23(aliasType, () => length18(ctors) === 0 ? _Array_prepend11(`${docComment}${opaqueTypeDecl(name)}`, rest) : _Array_prepend11(`${docComment}${typeDecl(name, params, map17((c) => qualifyCtor$(c, qualify), ctors), aliases, recs)}`, rest), (te) => _Array_prepend11(`${docComment}${aliasTsDecl(name, params, qualifyTe$(te, qualify), aliases, recs)}`, rest)), (fields) => _Array_prepend11(`${docComment}${recordAliasDecl(name, params, map17((f) => qualifyAliasField$(f, qualify), fields), aliases, withoutOwnShape(fields, params, aliases, recs))}`, rest)))(docs ? jsDoc(doc) : ""))(typeDeclsFrom$(stmts, aliases, recs, qualify, docs, i + 1)))(_v) : _v._tag === "Some" ? typeDeclsFrom$(stmts, aliases, recs, qualify, docs, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get21(i, stmts));
var typeDeclsFrom = _curry25(6, typeDeclsFrom$);
var localAliasKeys$ = (stmts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { name, alias, aliasType } }) => localAliasKeys$(stmts, i + 1, or16(_Option_isSome7(alias), _Option_isSome7(aliasType)) ? _Array_append18(name, acc) : acc))(_v) : _v._tag === "Some" ? localAliasKeys$(stmts, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get21(i, stmts));
var localAliasKeys = _curry25(3, localAliasKeys$);
var bindingDeclsFrom = _curry25(10, (stmts, env, aliases, keys, recs, qualify, docs, dtsHooks, bindingHooks, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { name, value, doc } }) => ((rest) => ((decl) => _Str_startsWith9("$", name) ? rest : _Option_match23(_Map_get13(name, env), () => rest, (sc) => {
  const ty = qualifyTy$(sc.ty, qualify);
  return _Array_prepend11(decl(_Option_unwrapOr15(bindingTsType({ vars: sc.vars, rvars: sc.rvars, ty: foldAliasesAt(ty, keys, aliases) }, value, recs, bindingHooks), runDtsHooks(dtsHooks, name, value, ty, tsApiFor(recs)))), rest);
}))((ts) => `${docs ? jsDoc(doc) : ""}export declare const ${name}: ${ts};`))(bindingDeclsFrom(stmts, env, aliases, keys, recs, qualify, docs, dtsHooks, bindingHooks, i + 1)))(_v) : _v._tag === "Some" ? bindingDeclsFrom(stmts, env, aliases, keys, recs, qualify, docs, dtsHooks, bindingHooks, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get21(i, stmts)));
var builtinDeclsFor$ = (names, aliases, recs, i) => _Option_match23(_Array_get21(i, builtinTypeDecls), () => [], (bt) => {
  const rest = builtinDeclsFor$(names, aliases, recs, i + 1);
  return _Array_contains6(bt.name, names) ? _Array_prepend11(typeDecl(bt.name, bt.params, bt.ctors, aliases, recs), rest) : rest;
});
var builtinDeclsFor2 = _curry25(4, builtinDeclsFor$);
var mochiDtsSpec = (from) => {
  const bare = _Str_endsWith3(".mochi", from) ? _Str_slice5(0, _Str_length9(from) - 6, from) : from;
  return or16(_Str_startsWith9("./", bare), _Str_startsWith9("../", bare)) ? `${bare}.mochi` : from;
};
var nsTypeImportsFrom$ = (stmts, body, seen, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" && _v.value._tag === "SImportNs" ? (({ value: { alias, from } }) => or16(_Set_has8(alias.name, seen), !_Str_contains3(`${alias.name}.`, body)) ? nsTypeImportsFrom$(stmts, body, seen, i + 1) : _Array_prepend11(`import type * as ${alias.name} from "${mochiDtsSpec(from)}";`, nsTypeImportsFrom$(stmts, body, _Set_add9(alias.name, seen), i + 1)))(_v) : _v._tag === "Some" ? nsTypeImportsFrom$(stmts, body, seen, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get21(i, stmts));
var nsTypeImportsFrom = _curry25(4, nsTypeImportsFrom$);
var blankNonLocal = _curry25(4, (keys, recs, locals, i) => _Option_match23(_Array_get21(i, keys), () => recs, (k) => _Option_match23(_Map_get13(k, recs), () => blankNonLocal(keys, recs, locals, i + 1), (name) => blankNonLocal(keys, and17(name !== "", !_Set_has8(name, locals)) ? _Map_set11(k, "", recs) : recs, locals, i + 1))));
var declarationRecs$ = (stmts, aliases) => {
  const locals = nullaryLocalNames(stmts, 0, _Set_fromArray9([]));
  const indexed = recordAliasIndex(aliases);
  return blankNonLocal(_Map_keys12(indexed), withoutAmbiguousAlias(indexed, aliases, locals), locals, 0);
};
var declarationRecs = _curry25(2, declarationRecs$);
var qualConRecs = _curry25(5, (keys, qualify, aliases, recs, i) => _Option_match23(_Array_get21(i, keys), () => recs, (name) => qualConRecs(keys, qualify, aliases, _Option_match23(_Map_get13(name, qualify), () => recs, (qual) => _Option_match23(_Map_get13(qual, aliases), () => recs, (info) => _Option_match23(info.expr, () => and17(length18(info.fields) > 0, !_Map_has8(name, recs)) ? _Map_set11(name, qual, recs) : recs, () => recs))), i + 1)));
var hostTypeRecs = _curry25(3, (names, local, recs) => reduce9(_curry25(2, (acc, name) => or16(_Set_has8(name, local), _Map_has8(name, acc)) ? acc : _Map_set11(name, _Map_getOr8("", name, names), acc)), recs, _Map_keys12(names)));
var emitDtsFromTypedWith = _curry25(9, (stmts, env, aliases, qualify, runtimeImport, docs, dtsHooks, bindingHooks, dtsTypeNames) => {
  const local = declaredTypeNames(stmts, 0, _Set_fromArray9([]));
  const quals = writtenQualsFrom$(stmts, local, qualify, 0);
  const recs = hostTypeRecs(dtsTypeNames, local, qualConRecs(_Map_keys12(quals), quals, aliases, declarationRecs$(stmts, aliases), 0));
  const types = typeDeclsFrom$(stmts, aliases, recs, quals, docs, 0);
  const bindings = bindingDeclsFrom(stmts, env, aliases, localAliasKeys$(stmts, 0, []), recs, quals, docs, dtsHooks, bindingHooks, 0);
  const declared = declaredTypeNames(stmts, 0, _Set_fromArray9([]));
  const wanted = referencedCons(stmts, env, 0, _Set_fromArray9([]));
  const core = _Str_join11(`
`, _Array_concat13(types, bindings));
  const builtinNames = builtinTypeNamesFor(declared, wanted, core, 0);
  const body = `${_Str_join11(`
`, _Array_concat13(builtinDeclsFor$(builtinNames, aliases, recs, 0), _Array_concat13(types, bindings)))}
`;
  const curry = _Str_contains3("_Curry<", body) ? [`import type { _Curry } from "${runtimeImport}";`] : [];
  const imports = _Array_concat13(curry, nsTypeImportsFrom$(stmts, body, _Set_fromArray9([]), 0));
  return length18(imports) === 0 ? body : `${_Str_join11(`
`, imports)}
${body}`;
});
var addQuals$ = (alias, names, local, acc, i) => _Option_match23(_Array_get21(i, names), () => acc, (name) => addQuals$(alias, names, local, or16(_Set_has8(name, local), _Map_has8(name, acc)) ? acc : _Map_set11(name, `${alias}.${name}`, acc), i + 1));
var addQuals = _curry25(5, addQuals$);
var qualsFromAliases = _curry25(5, (aliases, quals, local, acc, i) => _Option_match23(_Array_get21(i, aliases), () => acc, (alias) => _Option_match23(_Map_get13(alias, quals), () => qualsFromAliases(aliases, quals, local, acc, i + 1), (scope) => qualsFromAliases(aliases, quals, local, addQuals$(alias, _Set_toArray4(scope.types), local, acc, 0), i + 1))));
var qualifierMapOf = _curry25(2, (quals, local) => qualsFromAliases(_Map_keys12(quals), quals, local, new Map, 0));
var emitDtsFromTyped = _curry25(5, (stmts, env, aliases, qualify, runtimeImport) => emitDtsFromTypedWith(stmts, env, aliases, qualify, runtimeImport, true, [], bindingHooksFor(None23), new Map));
var emitDtsTextWith$ = (src, runtimeImport, opts) => _Result_map8(([stmts, r]) => emitDtsFromTypedWith(stmts, r.env, r.aliases, new Map, runtimeImport, opts.docs, dtsHooksFor(opts.plugins), bindingHooksFor(opts.plugins), opts.dtsTypeNames), typedProgramWith(src, opts));
var emitDtsTextWith = _curry25(3, emitDtsTextWith$);
var emitDtsText$ = (src, runtimeImport) => emitDtsTextWith$(src, runtimeImport, defaultOpts);
var emitDtsText = _curry25(2, emitDtsText$);
var compileTargetsWith$ = (src, runtimeImport, opts) => _Result_map8(([stmts, r]) => ({ js: emitJsWith(stmts, opts), ts: emitTsWith(stmts, r, runtimeImport, opts), dts: emitDtsFromTypedWith(stmts, r.env, r.aliases, new Map, runtimeImport, opts.docs, dtsHooksFor(opts.plugins), bindingHooksFor(opts.plugins), opts.dtsTypeNames) }), typedProgramWith(src, opts));
var compileTargetsWith = _curry25(3, compileTargetsWith$);

import { readFileSync, writeFileSync } from "fs";
import { createRequire } from "module";
import { dirname, relative, resolve as resolve2 } from "path";
var Ok12 = (value) => ({ _tag: "Ok", value });
var Err11 = (error) => ({ _tag: "Err", error });
var msg = (e) => String(e && e.message || e);
var readFile = (path) => {
  try {
    return Ok12(readFileSync(path, "utf8"));
  } catch (e) {
    return Err11(msg(e));
  }
};
var resolveImport = (importer, spec) => {
  const isPath = spec.startsWith("./") || spec.startsWith("../") || spec.startsWith("/") || /^[A-Za-z]:[\\/]/.test(spec);
  if (isPath)
    return resolve2(dirname(importer), `${spec.replace(/\.mochi$/, "")}.mochi`);
  try {
    return createRequire(importer).resolve(spec);
  } catch {
    return resolve2(dirname(importer), `${spec}.mochi`);
  }
};
var relSpec = (from, to) => {
  const rel = relative(dirname(from), to).replace(/\.mochi$/, "");
  return rel.startsWith(".") ? rel : `./${rel}`;
};
var externDtsPath = (importer, module) => {
  const base = module.replace(/\.m?[jt]s$/, "");
  const ext = /\.mjs$/.test(module) ? ".d.mts" : ".d.ts";
  return `${resolve2(dirname(importer), base)}${ext}`;
};
var absPath = (p) => resolve2(p);
var argv = process.argv.slice(2);

var emitDts$ = (src, runtimeImport) => emitDtsText(src, runtimeImport);
var emitDts = _curry26(2, emitDts$);
var symbolOccurrences = (stmts) => index(stmts);
var symbolIndex$ = (path, origins, prelude, stmts) => indexWith(path, origins, prelude, stmts);
var symbolIndex = _curry26(4, symbolIndex$);
var exportedOrigins$ = (path, stmts) => originsOf(path, stmts);
var exportedOrigins = _curry26(2, exportedOrigins$);
var defaultOpts2 = { open: false, runtime: true, docs: true, moduleExt: ".js", strictEntry: false, plugins: None24, dtsTypeNames: new Map };
var resolveImport2 = _curry26(2, resolveImport);
var mErr = (message) => ({ kind: "check", message, start: 0, end: 0 });
var stamp = _curry26(2, (kind, e) => ({ kind, message: e.message, start: e.start, end: e.end }));
var recoveryScheme = { vars: [0], rvars: [], ty: tVar(0) };
var atPath = _curry26(3, (kind, path, e) => ({ kind, message: `module '${path}': ${e.message}`, start: e.start, end: e.end }));
var firstAtPath = _curry26(2, (path, es) => _Option_match24(_Array_get22(0, es), () => ({ kind: "type", message: `module '${path}': type error`, start: 0, end: 0 }), (e) => atPath("type", path, e)));
var parseModule$ = (src, plugins) => _Result_match7(lex(src), (e) => Err12(stamp("lex", e)), (toks) => _Result_match7(parseWith(toks, plugins), (e) => Err12(stamp("parse", e)), (stmts) => Ok13(stmts)));
var parseModule = _curry26(2, parseModule$);
var importFromsFrom$ = (stmts, i, acc) => _Option_match24(_Array_get22(i, stmts), () => acc, (s) => {
  const $match = s;
  switch ($match._tag) {
    case "SImport": {
      const { from } = $match;
      return importFromsFrom$(stmts, i + 1, _Array_append19(from, acc));
    }
    case "SImportNs": {
      const { from } = $match;
      return importFromsFrom$(stmts, i + 1, _Array_append19(from, acc));
    }
    default: {
      return importFromsFrom$(stmts, i + 1, acc);
    }
  }
});
var importFromsFrom = _curry26(3, importFromsFrom$);
var importFroms = (stmts) => importFromsFrom$(stmts, 0, []);
var visit$ = (path, acc, plugins) => ((_v) => _v._tag === "Some" && _v.value === "done" ? Ok13(acc) : _v._tag === "Some" && _v.value === "loading" ? Err12(mErr(`import cycle through '${path}'`)) : ((acc1) => _Result_match7(readFile(path), () => Err12(mErr(`cannot read module '${path}'`)), (src) => _Result_match7(parseModule$(src, plugins), (e) => Err12(e), (stmts) => _Result_match7(visitAll$(importFroms(stmts), path, acc1, plugins), (e) => Err12(e), (acc2) => Ok13({ state: _Map_set12(path, "done", acc2.state), order: _Array_append19({ path, src, stmts }, acc2.order) })))))({ state: _Map_set12(path, "loading", acc.state), order: acc.order }))(_Map_get14(path, acc.state));
var visit = _curry26(3, visit$);
var visitAll$ = (froms, importer, acc, plugins) => ((_v) => _v.length === 0 ? Ok13(acc) : _v.length >= 1 ? (([from, ...rest]) => _Result_match7(visit$(resolveImport2(importer, from), acc, plugins), (e) => Err12(e), (acc1) => visitAll$(rest, importer, acc1, plugins)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(froms);
var visitAll = _curry26(4, visitAll$);
var loadGraphWith$ = (entry, plugins) => _Result_flatMap9((acc) => Ok13(acc.order), visit$(absPath(entry), { state: new Map, order: [] }, plugins));
var loadGraphWith = _curry26(2, loadGraphWith$);
var loadGraph = (entry) => loadGraphWith$(entry, None24);
var emptyReg = { ctors: new Map, types: new Map };
var mergeInto2 = _curry26(3, (keys, from, into) => match11(keys).with((_v) => _v.length === 0, () => into).with((_v) => _v.length >= 1, ([k, ...rest]) => mergeInto2(rest, from, _Option_match24(_Map_get14(k, from), () => into, (v) => _Map_set12(k, v, into)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var mergeMap = _curry26(2, (from, into) => mergeInto2(_Map_keys13(from), from, into));
var exportedTypeNames = (stmts) => _Set_fromArray10(_Array_flatMap8((s) => ((_v) => _v._tag === "SType" && _v.exported === true ? (({ name }) => [name])(_v) : [])(s), stmts));
var aliasesOf = (stmts) => reduce10(_curry26(2, (acc, s) => ((_v) => _v._tag === "SType" && _v.alias._tag === "Some" ? (({ name, params, alias: { value: fields } }) => _Map_set12(name, { params, fields, expr: None24 }, acc))(_v) : _v._tag === "SType" && _v.aliasType._tag === "Some" ? (({ name, params, aliasType: { value: te } }) => _Map_set12(name, { params, fields: [], expr: Some24(te) }, acc))(_v) : acc)(s)), new Map, stmts);
var qualScopeOf = _curry26(2, (stmts, quals) => ({ types: exportedTypeNames(stmts), aliases: scopeAliases(stmts, quals) }));
var withNamedCtor = _curry26(5, (name, info, depReg, depKeys, res) => ({ imports: res.imports, nsImports: res.nsImports, reg: { ctors: _Map_set12(name, info, res.reg.ctors), types: _Option_match24(_Map_get14(info.owner, depReg.types), () => res.reg.types, (cs) => _Map_set12(info.owner, cs, res.reg.types)) }, keys: _Option_match24(_Map_get14(name, depKeys), () => res.keys, (ks) => _Map_set12(name, ks, res.keys)), quals: res.quals }));
var takeNamedCtor = _curry26(5, (name, span, depReg, depKeys, res) => _Option_match24(_Map_get14(name, depReg.ctors), () => Ok13(res), (info) => _Option_match24(_Map_get14(name, res.reg.ctors), () => Ok13(withNamedCtor(name, info, depReg, depKeys, res)), (prior) => !eq21(prior.owner, info.owner) ? Err12({ kind: "check", message: `duplicate constructor '${name}'`, start: span.start, end: span.end }) : Ok13(withNamedCtor(name, info, depReg, depKeys, res)))));
var prefixCtorsInto = _curry26(4, (keys, alias, from, into) => ((_v) => _v.length === 0 ? into : _v.length >= 1 ? (([k, ...rest]) => prefixCtorsInto(rest, alias, from, _Option_match24(_Map_get14(k, from), () => into, (v) => _Map_set12(`${alias}.${k}`, v, into))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(keys));
var resolveNames = _curry26(7, (names, from, depExports, depReg, depKeys, res, recovering) => match11(names).with((_v) => _v.length === 0, () => Ok13(res)).with((_v) => _v.length >= 1, ([n, ...rest]) => _Option_match24(_Map_get14(n.name, depExports), () => recovering ? resolveNames(rest, from, depExports, depReg, depKeys, { imports: _Map_set12(n.name, recoveryScheme, res.imports), nsImports: res.nsImports, reg: res.reg, keys: res.keys, quals: res.quals }, recovering) : Err12({ kind: "check", message: `'${from}' has no export '${n.name}'`, start: n.span.start, end: n.span.end }), (sc) => _Result_match7(takeNamedCtor(n.name, n.span, depReg, depKeys, { imports: _Map_set12(n.name, sc, res.imports), nsImports: res.nsImports, reg: res.reg, keys: res.keys, quals: res.quals }), (e) => Err12(e), (res1) => resolveNames(rest, from, depExports, depReg, depKeys, res1, recovering)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var resolveImportsFrom = _curry26(6, (ctx, stmts, i, path, res, recovering) => ((_v) => _v._tag === "None" ? Ok13(res) : _v._tag === "Some" && _v.value._tag === "SImport" ? (({ value: { names, from } }) => ((dp) => ((depExports) => ((depReg) => ((depKeys) => _Result_match7(resolveNames(names, from, depExports, depReg, depKeys, res, recovering), (e) => Err12(e), (res1) => resolveImportsFrom(ctx, stmts, i + 1, path, res1, recovering)))(_Map_getOr9(new Map, dp, ctx.keysByPath)))(_Map_getOr9(emptyReg, dp, ctx.regByPath)))(_Map_getOr9(new Map, dp, ctx.exportsByPath)))(resolveImport2(path, from)))(_v) : _v._tag === "Some" && _v.value._tag === "SImportNs" ? (({ value: { alias, from } }) => ((dp) => ((depExports) => ((depReg) => ((depKeys) => resolveImportsFrom(ctx, stmts, i + 1, path, { imports: res.imports, nsImports: _Map_set12(alias.name, depExports, res.nsImports), reg: { ctors: prefixCtorsInto(_Map_keys13(depReg.ctors), alias.name, depReg.ctors, res.reg.ctors), types: mergeMap(depReg.types, res.reg.types) }, keys: mergeMap(depKeys, res.keys), quals: _Option_match24(_Map_get14(dp, ctx.qualsByPath), () => res.quals, (q) => _Map_set12(alias.name, q, res.quals)) }, recovering))(_Map_getOr9(new Map, dp, ctx.keysByPath)))(_Map_getOr9(emptyReg, dp, ctx.regByPath)))(_Map_getOr9(new Map, dp, ctx.exportsByPath)))(resolveImport2(path, from)))(_v) : _v._tag === "Some" ? resolveImportsFrom(ctx, stmts, i + 1, path, res, recovering) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get22(i, stmts)));
var openFor$ = (loaded, isEntry, opts) => and18(isEntry, opts.strictEntry) ? opts.open : openMode(loaded.src, opts.open);
var openFor = _curry26(3, openFor$);
var compileOne = _curry26(5, (ctx, loaded, recovering, isEntry, opts) => _Result_match7(resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, { imports: new Map, nsImports: new Map, reg: emptyReg, keys: new Map, quals: new Map }, recovering), (e) => Err12([atPath("check", loaded.path, e)]), (res) => _Result_match7(checkWith(loaded.stmts, res.reg, res.quals), (e) => Err12([atPath("check", loaded.path, e)]), () => _Result_match7(inferProgramImports(loaded.stmts, builtins, namespaces, openFor$(loaded, isEntry, opts), res.imports, res.nsImports, res.quals, opts.plugins), (es) => Err12(map18((e) => atPath("type", loaded.path, e), es)), (env) => {
  const js = codegenWith(loaded.stmts, res.keys, opts.runtime, namespaceRuntime, preludeJsDefs, runtimeDeps, { ...jsGenOpts, docs: opts.docs, moduleExt: opts.moduleExt });
  return Ok13({ exportsByPath: _Map_set12(loaded.path, exportedSchemes(loaded.stmts, env), ctx.exportsByPath), regByPath: _Map_set12(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath), keysByPath: _Map_set12(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath), qualsByPath: _Map_set12(loaded.path, qualScopeOf(loaded.stmts, res.quals), ctx.qualsByPath), outputs: [...ctx.outputs, { path: loaded.path, js }] });
}))));
var compileAll$ = (ctx, graph, opts) => ((_v) => _v.length === 0 ? Ok13(ctx.outputs) : _v.length >= 1 ? (([m, ...rest]) => _Result_match7(compileOne(ctx, m, false, length19(rest) === 0, opts), (e) => Err12(e), (ctx1) => compileAll$(ctx1, rest, opts)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(graph);
var compileAll = _curry26(3, compileAll$);
var compileGraphWith$ = (graph, opts) => compileAll$({ exportsByPath: new Map, regByPath: new Map, keysByPath: new Map, qualsByPath: new Map, outputs: [] }, graph, opts);
var compileGraphWith = _curry26(2, compileGraphWith$);
var compileGraph = (graph) => compileGraphWith$(graph, defaultOpts2);
var depsPublished = _curry26(4, (ctx, stmts, i, path) => ((_v) => _v._tag === "None" ? true : _v._tag === "Some" && _v.value._tag === "SImport" ? (({ value: { from } }) => and18(_Map_has9(resolveImport2(path, from), ctx.exportsByPath), depsPublished(ctx, stmts, i + 1, path)))(_v) : _v._tag === "Some" ? depsPublished(ctx, stmts, i + 1, path) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get22(i, stmts)));
var checkErrorsRecovering = _curry26(2, (ctx, loaded) => {
  const importErrors = depsPublished(ctx, loaded.stmts, 0, loaded.path) ? _Result_match7(resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, { imports: new Map, nsImports: new Map, reg: emptyReg, keys: new Map, quals: new Map }, false), (e) => [atPath("check", loaded.path, e)], () => []) : [];
  return _Result_match7(resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, { imports: new Map, nsImports: new Map, reg: emptyReg, keys: new Map, quals: new Map }, true), (e) => [atPath("check", loaded.path, e)], (res) => _Result_match7(checkAllWith(loaded.stmts, res.reg, res.quals), (es) => _Array_concat14(importErrors, map18((e) => atPath("check", loaded.path, e), es)), () => importErrors));
});
var sameErr$ = (a, b) => and18(and18(and18(eq21(a.kind, b.kind), eq21(a.message, b.message)), eq21(a.start, b.start)), eq21(a.end, b.end));
var sameErr = _curry26(2, sameErr$);
var mergeRecovered$ = (es, checks) => _Array_concat14(checks, filter11((e) => length19(filter11((c) => sameErr$(c, e), checks)) === 0, es));
var mergeRecovered = _curry26(2, mergeRecovered$);
var recoverOne$ = (ctx, m, isEntry, errors, opts) => _Result_match7(compileOne(ctx, m, true, isEntry, opts), (es) => {
  const checks = checkErrorsRecovering(ctx, m);
  return { ctx, errors: _Array_concat14(errors, mergeRecovered$(es, checks)) };
}, (ctx1) => ({ ctx: ctx1, errors }));
var recoverOne = _curry26(5, recoverOne$);
var compileAllRecovering$ = (ctx, graph, errors, opts) => ((_v) => _v.length === 0 ? { ctx, errors } : _v.length >= 1 ? (([m, ...rest]) => ((next) => compileAllRecovering$(next.ctx, rest, next.errors, opts))(recoverOne$(ctx, m, length19(rest) === 0, errors, opts)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(graph);
var compileAllRecovering = _curry26(4, compileAllRecovering$);
var freshRecoveryGraphState = () => ({ ctx: { exportsByPath: new Map, regByPath: new Map, keysByPath: new Map, qualsByPath: new Map, outputs: [] }, errors: [] });
var recoverGraphFromWith = _curry26(3, (state, graph, opts) => compileAllRecovering$(state.ctx, graph, state.errors, opts));
var recoverGraphFrom = _curry26(2, (state, graph) => recoverGraphFromWith(state, graph, defaultOpts2));
var recoverModuleWith$ = (state, loaded, isEntry, opts) => recoverOne$(state.ctx, loaded, isEntry, state.errors, opts);
var recoverModuleWith = _curry26(4, recoverModuleWith$);
var keepOnly = _curry26(4, (key, keys, i, m) => _Option_match24(_Array_get22(i, keys), () => m, (k) => keepOnly(key, keys, i + 1, eq21(k, key) ? m : _Map_delete4(k, m))));
var onlyAt = _curry26(2, (key, m) => keepOnly(key, _Map_keys13(m), 0, m));
var recoverySliceOf$ = (state, path) => ({ ctx: { exportsByPath: onlyAt(path, state.ctx.exportsByPath), regByPath: onlyAt(path, state.ctx.regByPath), keysByPath: onlyAt(path, state.ctx.keysByPath), qualsByPath: onlyAt(path, state.ctx.qualsByPath), outputs: filter11((o) => eq21(o.path, path), state.ctx.outputs) }, errors: [] });
var recoverySliceOf = _curry26(2, recoverySliceOf$);
var mergeRecoveryStates$ = (a, b) => ({ ctx: { exportsByPath: mergeMap(b.ctx.exportsByPath, a.ctx.exportsByPath), regByPath: mergeMap(b.ctx.regByPath, a.ctx.regByPath), keysByPath: mergeMap(b.ctx.keysByPath, a.ctx.keysByPath), qualsByPath: mergeMap(b.ctx.qualsByPath, a.ctx.qualsByPath), outputs: _Array_concat14(a.ctx.outputs, b.ctx.outputs) }, errors: _Array_concat14(a.errors, b.errors) });
var mergeRecoveryStates = _curry26(2, mergeRecoveryStates$);
var compileGraphRecoveringWith$ = (graph, opts) => {
  const state = recoverGraphFromWith(freshRecoveryGraphState(), graph, opts);
  return { outputs: state.ctx.outputs, errors: state.errors };
};
var compileGraphRecoveringWith = _curry26(2, compileGraphRecoveringWith$);
var compileGraphRecovering = (graph) => compileGraphRecoveringWith$(graph, defaultOpts2);
var inferOne = _curry26(3, (ctx, loaded, opts) => _Result_match7(resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, { imports: new Map, nsImports: new Map, reg: emptyReg, keys: new Map, quals: new Map }, false), (e) => Err12(atPath("check", loaded.path, e)), (res) => _Result_match7(checkWith(loaded.stmts, res.reg, res.quals), (e) => Err12(atPath("check", loaded.path, e)), () => _Result_match7(inferProgramImportsTypes(loaded.stmts, builtins, namespaces, openMode(loaded.src, opts.open), res.imports, res.nsImports, res.quals, opts.plugins), (es) => Err12(firstAtPath(loaded.path, es)), (r) => Ok13({ exportsByPath: _Map_set12(loaded.path, exportedSchemes(loaded.stmts, r.env), ctx.exportsByPath), regByPath: _Map_set12(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath), keysByPath: _Map_set12(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath), qualsByPath: _Map_set12(loaded.path, qualScopeOf(loaded.stmts, res.quals), ctx.qualsByPath), aliases: mergeMap(r.aliases, ctx.aliases), outputs: [...ctx.outputs, { path: loaded.path, types: map18((hit) => ({ span: hit.span, ty: hit.ty, display: showType(widenLits(hit.ty)), sym: hit.sym }), r.types), aliases: mergeMap(r.aliases, ctx.aliases), imports: res.imports, quals: res.quals }] })))));
var inferAll = _curry26(3, (ctx, graph, opts) => match11(graph).with((_v) => _v.length === 0, () => Ok13(ctx)).with((_v) => _v.length >= 1, ([m, ...rest]) => _Result_match7(inferOne(ctx, m, opts), (e) => Err12(e), (ctx1) => inferAll(ctx1, rest, opts))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freshInferGraphState = () => ({ exportsByPath: new Map, regByPath: new Map, keysByPath: new Map, qualsByPath: new Map, aliases: new Map, outputs: [] });
var inferGraphTypesFromWith = _curry26(3, (state, graph, opts) => inferAll(state, graph, opts));
var inferGraphTypesFrom = _curry26(2, (state, graph) => inferGraphTypesFromWith(state, graph, defaultOpts2));
var inferSliceOf = _curry26(2, (state, path) => ({ exportsByPath: onlyAt(path, state.exportsByPath), regByPath: onlyAt(path, state.regByPath), keysByPath: onlyAt(path, state.keysByPath), qualsByPath: onlyAt(path, state.qualsByPath), aliases: state.aliases, outputs: filter11((o) => eq21(o.path, path), state.outputs) }));
var mergeInferStates = _curry26(2, (a, b) => ({ exportsByPath: mergeMap(b.exportsByPath, a.exportsByPath), regByPath: mergeMap(b.regByPath, a.regByPath), keysByPath: mergeMap(b.keysByPath, a.keysByPath), qualsByPath: mergeMap(b.qualsByPath, a.qualsByPath), aliases: mergeMap(b.aliases, a.aliases), outputs: _Array_concat14(a.outputs, b.outputs) }));
var inferGraphTypesWith = _curry26(2, (graph, opts) => _Result_flatMap9((state) => Ok13(state.outputs), inferGraphTypesFromWith(freshInferGraphState(), graph, opts)));
var inferGraphTypes = (graph) => inferGraphTypesWith(graph, defaultOpts2);
var buildModulesWith$ = (entry, opts) => _Result_match7(loadGraphWith$(entry, opts.plugins), (e) => Err12([e]), (graph) => {
  const recovered = compileGraphRecoveringWith$(graph, opts);
  return length19(recovered.errors) === 0 ? compileGraphWith$(graph, opts) : Err12(recovered.errors);
});
var buildModulesWith = _curry26(2, buildModulesWith$);
var buildModules = (entry) => buildModulesWith$(entry, defaultOpts2);
var relSpec2 = _curry26(2, relSpec);
var externDtsPath2 = _curry26(2, externDtsPath);
var isIdentChar = (c) => _Option_match24(_Str_codeAt10(0, c), () => false, (n) => or17(or17(or17(or17(and18(n >= 48, n <= 57), and18(n >= 65, n <= 90)), and18(n >= 97, n <= 122)), n === 95), n === 36));
var endsAtBoundary = (part) => _Str_length10(part) === 0 ? true : !isIdentChar(_Option_unwrapOr16("", _Str_get6(_Str_length10(part) - 1, part)));
var startsAtBoundary = (part) => _Str_length10(part) === 0 ? true : !isIdentChar(_Option_unwrapOr16("", _Str_get6(0, part)));
var occursAsWordFrom$ = (parts, i) => _Option_match24(_Array_get22(i, parts), () => false, (after) => and18(_Option_mapOr(false, endsAtBoundary, _Array_get22(i - 1, parts)), startsAtBoundary(after)) ? true : occursAsWordFrom$(parts, i + 1));
var occursAsWordFrom = _curry26(2, occursAsWordFrom$);
var occursAsWord$ = (name, text) => occursAsWordFrom$(_Str_split7(name, text), 1);
var occursAsWord = _curry26(2, occursAsWord$);
var importedBinding = (spec) => {
  const parts = _Str_split7(" as ", spec);
  return _Str_trim3(_Option_unwrapOr16(spec, _Array_get22(length19(parts) - 1, parts)));
};
var bindingsInLine$ = (line, acc) => _Option_match24(_Array_get22(1, _Str_split7("{", line)), () => acc, (rest) => _Option_match24(_Array_get22(0, _Str_split7("}", rest)), () => acc, (names) => reduce10(_curry26(2, (a, n) => _Set_add10(importedBinding(n), a)), acc, _Str_split7(",", names))));
var bindingsInLine = _curry26(2, bindingsInLine$);
var valueImported = (ts) => reduce10(_curry26(2, (acc, line) => bindingsInLine$(line, acc)), _Set_fromArray10([]), filter11(_Str_startsWith10("import {"), _Str_split7(`
`, ts)));
var ownTypesInto = _curry26(3, (stmts, path, acc) => reduce10(_curry26(2, (a, s) => {
  const $match = s;
  switch ($match._tag) {
    case "SType": {
      const { name } = $match;
      return _Map_has9(name, a.owner) ? { owner: _Map_set12(name, path, a.owner), dups: _Set_add10(name, a.dups), dupNames: _Set_has9(name, a.dups) ? a.dupNames : _Array_append19(name, a.dupNames) } : { owner: _Map_set12(name, path, a.owner), dups: a.dups, dupNames: a.dupNames };
    }
    default: {
      return a;
    }
  }
}), acc, stmts));
var typeOwnerOf = (graph) => reduce10(_curry26(2, (acc, m) => ownTypesInto(m.stmts, m.path, acc)), { owner: new Map, dups: _Set_fromArray10([]), dupNames: [] }, graph);
var nullaryDeclared = _curry26(2, (name, local) => _Option_match24(_Map_get14(name, local), () => false, (info) => and18(length19(info.params) === 0, length19(info.fields) > 0)));
var addDupMarkers = _curry26(4, (names, local, acc, i) => _Option_match24(_Array_get22(i, names), () => acc, (name) => addDupMarkers(names, local, nullaryDeclared(name, local) ? acc : _Map_set12(`dup.${name}`, { params: ["_"], fields: [], expr: None24 }, acc), i + 1)));
var aliasesForTs = _curry26(3, (merged, local, dupNames) => addDupMarkers(dupNames, local, merged, 0));
var localTypeNames = (stmts) => _Set_fromArray10(_Array_flatMap8((s) => {
  const $match = s;
  switch ($match._tag) {
    case "SType": {
      const { name } = $match;
      return [name];
    }
    default: {
      return [];
    }
  }
}, stmts));
var groupByOwner = _curry26(2, (names, ctx) => reduce10(_curry26(2, (acc, name) => {
  const owner = _Map_getOr9("", name, ctx.typeOwner);
  return or17(or17(or17(eq21(owner, ctx.importer), _Set_has9(name, ctx.localTypes)), _Set_has9(name, ctx.bound)), !occursAsWord$(name, ctx.ts)) ? acc : ((spec) => _Map_set12(spec, _Array_append19(name, _Map_getOr9([], spec, acc)), acc))(relSpec2(ctx.importer, owner));
}), new Map, names));
var crossModuleTypeImports$ = (ts, importer, localTypes, typeOwner) => {
  const byOwner = groupByOwner(_Map_keys13(typeOwner), { ts, importer, localTypes, typeOwner, bound: valueImported(ts) });
  return map18((spec) => `import type { ${_Str_join12(", ", _Array_sort3(_Map_getOr9([], spec, byOwner)))} } from "${spec}";`, _Map_keys13(byOwner));
};
var crossModuleTypeImports = _curry26(4, crossModuleTypeImports$);
var externBindingsInto = _curry26(4, (stmts, path, env, acc) => reduce10(_curry26(2, (a, s) => {
  const $match = s;
  switch ($match._tag) {
    case "SExtern": {
      const { name, module: hostModule, imported, curried } = $match;
      return _Str_startsWith10("mochi:", hostModule) ? a : _Option_match24(_Map_get14(name, env), () => a, (sc) => {
        const dp = externDtsPath2(path, hostModule);
        return _Map_set12(dp, _Array_append19({ imported, scheme: sc, curried }, _Map_getOr9([], dp, a)), a);
      });
    }
    default: {
      return a;
    }
  }
}), acc, stmts));
var compileOneTs = _curry26(3, (ctx, loaded, opts) => _Result_match7(resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, { imports: new Map, nsImports: new Map, reg: emptyReg, keys: new Map, quals: new Map }, false), (e) => Err12(atPath("check", loaded.path, e)), (res) => _Result_match7(checkWith(loaded.stmts, res.reg, res.quals), (e) => Err12(atPath("check", loaded.path, e)), () => _Result_match7(inferProgramImportsTypes(loaded.stmts, builtins, namespaces, openMode(loaded.src, opts.open), res.imports, res.nsImports, res.quals, opts.plugins), (es) => Err12(firstAtPath(loaded.path, es)), (r) => {
  const body = emitTsModuleWith(loaded.stmts, r.env, r.types, r.letParams, aliasesForTs(mergeMap(r.aliases, ctx.aliases), aliasesOf(loaded.stmts), ctx.dupNames), res.keys, [], namespaceRuntime, preludeJsDefs, runtimeDeps, ctx.runtimeImport, opts.docs, bindingHooksFor(opts.plugins));
  const lines = crossModuleTypeImports$(body, loaded.path, localTypeNames(loaded.stmts), ctx.typeOwner);
  const ts = length19(lines) === 0 ? body : `${_Str_join12(`
`, lines)}

${body}`;
  return Ok13({ exportsByPath: _Map_set12(loaded.path, exportedSchemes(loaded.stmts, r.env), ctx.exportsByPath), regByPath: _Map_set12(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath), keysByPath: _Map_set12(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath), qualsByPath: _Map_set12(loaded.path, qualScopeOf(loaded.stmts, res.quals), ctx.qualsByPath), aliases: mergeMap(r.aliases, ctx.aliases), typeOwner: ctx.typeOwner, dupNames: ctx.dupNames, runtimeImport: ctx.runtimeImport, externs: externBindingsInto(loaded.stmts, loaded.path, r.env, ctx.externs), outputs: [...ctx.outputs, { path: loaded.path, js: ts }] });
}))));
var noAliases = aliasesOf([]);
var externOutputs = (externs) => map18((dp) => ({ path: dp, js: externModuleDts(_Map_getOr9([], dp, externs), noAliases) }), _Map_keys13(externs));
var compileAllTs = _curry26(3, (ctx, graph, opts) => match11(graph).with((_v) => _v.length === 0, () => Ok13(_Array_concat14(ctx.outputs, externOutputs(ctx.externs)))).with((_v) => _v.length >= 1, ([m, ...rest]) => _Result_match7(compileOneTs(ctx, m, opts), (e) => Err12(e), (ctx1) => compileAllTs(ctx1, rest, opts))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var compileGraphTsWith = _curry26(3, (graph, runtimeImport, opts) => {
  const noted = typeOwnerOf(graph);
  return compileAllTs({ exportsByPath: new Map, regByPath: new Map, keysByPath: new Map, qualsByPath: new Map, aliases: new Map, typeOwner: noted.owner, dupNames: noted.dupNames, runtimeImport, externs: new Map, outputs: [] }, graph, opts);
});
var compileGraphTs = _curry26(2, (graph, runtimeImport) => compileGraphTsWith(graph, runtimeImport, defaultOpts2));
var dtsOne = _curry26(3, (ctx, loaded, opts) => _Result_match7(resolveImportsFrom(ctx, loaded.stmts, 0, loaded.path, { imports: new Map, nsImports: new Map, reg: emptyReg, keys: new Map, quals: new Map }, false), (e) => Err12(atPath("check", loaded.path, e)), (res) => _Result_match7(checkWith(loaded.stmts, res.reg, res.quals), (e) => Err12(atPath("check", loaded.path, e)), () => _Result_match7(inferProgramImportsTypes(loaded.stmts, builtins, namespaces, openMode(loaded.src, opts.open), res.imports, res.nsImports, res.quals, opts.plugins), (es) => Err12(firstAtPath(loaded.path, es)), (r) => Ok13({ exportsByPath: _Map_set12(loaded.path, exportedSchemes(loaded.stmts, r.env), ctx.exportsByPath), regByPath: _Map_set12(loaded.path, exportedRegistry(loaded.stmts), ctx.regByPath), keysByPath: _Map_set12(loaded.path, exportedCtorKeys(loaded.stmts), ctx.keysByPath), qualsByPath: _Map_set12(loaded.path, qualScopeOf(loaded.stmts, res.quals), ctx.qualsByPath), aliases: mergeMap(r.aliases, ctx.aliases), runtimeImport: ctx.runtimeImport, target: ctx.target, dts: eq21(loaded.path, ctx.target) ? emitDtsFromTypedWith(loaded.stmts, r.env, mergeMap(r.aliases, ctx.aliases), qualifierMapOf(res.quals, localTypeNames(loaded.stmts)), ctx.runtimeImport, opts.docs, dtsHooksFor(opts.plugins), bindingHooksFor(opts.plugins), opts.dtsTypeNames) : ctx.dts })))));
var dtsAll = _curry26(3, (ctx, graph, opts) => match11(graph).with((_v) => _v.length === 0, () => Ok13(ctx.dts)).with((_v) => _v.length >= 1, ([m, ...rest]) => _Result_match7(dtsOne(ctx, m, opts), (e) => Err12(e), (ctx1) => dtsAll(ctx1, rest, opts))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var emitDtsForFileWith$ = (entry, runtimeImport, opts) => _Result_flatMap9((graph) => dtsAll({ exportsByPath: new Map, regByPath: new Map, keysByPath: new Map, qualsByPath: new Map, aliases: new Map, runtimeImport, target: absPath(entry), dts: "" }, graph, opts), loadGraphWith$(entry, opts.plugins));
var emitDtsForFileWith = _curry26(3, emitDtsForFileWith$);
var emitDtsForFile$ = (entry, runtimeImport) => emitDtsForFileWith$(entry, runtimeImport, defaultOpts2);
var emitDtsForFile = _curry26(2, emitDtsForFile$);
var buildModulesTsWith$ = (entry, runtimeImport, opts) => _Result_match7(loadGraphWith$(entry, opts.plugins), (e) => Err12([e]), (graph) => {
  const recovered = compileGraphRecoveringWith$(graph, { ...opts, strictEntry: false });
  return length19(recovered.errors) === 0 ? _Result_mapErr2((e) => [e], compileGraphTsWith(graph, runtimeImport, opts)) : Err12(recovered.errors);
});
var buildModulesTsWith = _curry26(3, buildModulesTsWith$);
var buildModulesTs$ = (entry, runtimeImport) => buildModulesTsWith$(entry, runtimeImport, defaultOpts2);
var buildModulesTs = _curry26(2, buildModulesTs$);
export {
  buildModules,
  buildModulesTs,
  buildModulesTsWith,
  buildModulesWith,
  compileGraph,
  compileGraphRecovering,
  compileGraphRecoveringWith,
  compileGraphTs,
  compileGraphTsWith,
  compileGraphWith,
  emitDts,
  emitDtsForFile,
  emitDtsForFileWith,
  exportedOrigins,
  freshInferGraphState,
  freshRecoveryGraphState,
  inferGraphTypes,
  inferGraphTypesFrom,
  inferGraphTypesFromWith,
  inferGraphTypesWith,
  inferSliceOf,
  loadGraph,
  loadGraphWith,
  mergeInferStates,
  mergeRecoveryStates,
  recoverGraphFrom,
  recoverGraphFromWith,
  recoverModuleWith,
  recoverySliceOf,
  symbolIndex,
  symbolOccurrences
};
