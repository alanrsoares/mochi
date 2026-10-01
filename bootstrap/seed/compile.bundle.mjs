import { Err as Err10, None as None21, Some as Some21, _Map_get as _Map_get11, _Map_keys as _Map_keys11, _Option_flatMap as _Option_flatMap4, _Option_map as _Option_map4, _Option_unwrapOr as _Option_unwrapOr13, _Result_flatMap as _Result_flatMap8, _Result_map as _Result_map7, _Result_mapErr, _Str_get as _Str_get5, _Str_startsWith as _Str_startsWith8, _Str_trim as _Str_trim2, _curry as _curry22, _tuple as _tuple13, and as and16, eq as eq18, map as map14, or as or13, reduce as reduce8 } from "@mochi/compiler/runtime";

import { Err, None as None2, Ok, Some as Some2, _Array_append, _Array_concat, _Array_flatMap, _Array_get, _Array_head, _Array_tail, _Array_take, _Option_contains as _Option_contains2, _Option_exists, _Option_unwrapOr, _Str_codeAt, _Str_fromCode, _Str_get as _Str_get2, _Str_join, _Str_length, _Str_slice, _Str_toNumber, _curry as _curry2, _done as _done2, _recur as _recur2, and, eq, length, lt, or } from "@mochi/compiler/runtime";

import { None, Some, _Option_contains, _Str_get, _curry, _done, _recur } from "@mochi/compiler/runtime";
var skipStrLoop = _curry(2, (src, j0) => {
  let j = j0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done(None) : _v._tag === "Some" && _v.value === '"' ? _done(Some(j + 1)) : _v._tag === "Some" && _v.value === "\\" ? ((_v) => _v._tag === "Some" ? _recur(j + 2) : _v._tag === "None" ? _recur(j + 1) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Str_get(j + 1, src)) : _v._tag === "Some" && _v.value === "$" && _Option_contains("{", _Str_get(j + 1, src)) ? ((_v) => _v._tag === "Some" ? (({ value: hEnd }) => _recur(hEnd))(_v) : _v._tag === "None" ? _done(None) : (() => {
      throw new Error("non-exhaustive match");
    })())(findHoleEnd(src, j + 2)) : _v._tag === "Some" ? _recur(j + 1) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Str_get(j, src));
    if (_step._tag === "recur") {
      j = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var skipStringLiteral = _curry(2, (src, i) => skipStrLoop(src, i + 1));
var skipLineCommentTo = _curry(2, (src, j) => ((_v) => _v._tag === "None" ? j : _v._tag === "Some" && _v.value === `
` ? j : _v._tag === "Some" ? skipLineCommentTo(src, j + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_get(j, src)));
var findHoleLoop = _curry(3, (src, j0, depth0) => {
  let j = j0;
  let depth = depth0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done(None) : _v._tag === "Some" && _v.value === '"' ? ((_v) => _v._tag === "Some" ? (({ value: stop }) => _recur(stop, depth))(_v) : _v._tag === "None" ? _done(None) : (() => {
      throw new Error("non-exhaustive match");
    })())(skipStringLiteral(src, j)) : _v._tag === "Some" && _v.value === "/" && _Option_contains("/", _Str_get(j + 1, src)) ? _recur(skipLineCommentTo(src, j), depth) : _v._tag === "Some" && _v.value === "{" ? _recur(j + 1, depth + 1) : _v._tag === "Some" && _v.value === "}" ? depth === 1 ? _done(Some(j + 1)) : _recur(j + 1, depth - 1) : _v._tag === "Some" ? _recur(j + 1, depth) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Str_get(j, src));
    if (_step._tag === "recur") {
      [j, depth] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var findHoleEnd = _curry(2, (src, start) => findHoleLoop(src, start, 1));

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
var inRange = _curry2(3, (lo, hi, n) => and(n >= lo, n <= hi));
var isDigit = (c) => _Option_exists(inRange(48, 57), _Str_codeAt(0, c));
var isIdStart = (c) => _Option_exists((n) => or(inRange(65, 90, n), or(inRange(97, 122, n), or(n === 95, n === 36))), _Str_codeAt(0, c));
var isIdChar = (c) => or(isIdStart(c), isDigit(c));
var isNumChar = (c) => or(isDigit(c), c === ".");
var keywordTok = (word) => ((_v) => _v === "let" ? Some2(TLet) : _v === "type" ? Some2(TType) : _v === "extern" ? Some2(TExtern) : _v === "switch" ? Some2(TSwitch) : _v === "loop" ? Some2(TLoop) : _v === "recur" ? Some2(TRecur) : _v === "do" ? Some2(TDo) : _v === "import" ? Some2(TImport) : _v === "export" ? Some2(TExport) : _v === "true" ? Some2(TBool(true)) : _v === "false" ? Some2(TBool(false)) : None2)(word);
var identTok = (word) => _Option_unwrapOr(TId(word), keywordTok(word));
var digraphTok = (two) => ((_v) => _v === "|>" ? Some2(TPipe) : _v === "++" ? Some2(TConcat) : _v === "==" ? Some2(TEqeq) : _v === "!=" ? Some2(TNeq) : _v === "<=" ? Some2(TLte) : _v === ">=" ? Some2(TGte) : _v === "&&" ? Some2(TAndand) : _v === "||" ? Some2(TOror) : _v === "=>" ? Some2(TArrow) : _v === "->" ? Some2(TTarrow) : None2)(two);
var punctTok = (c) => ((_v) => _v === "|" ? Some2(TBar) : _v === "=" ? Some2(TEq) : _v === "(" ? Some2(TLparen) : _v === ")" ? Some2(TRparen) : _v === "{" ? Some2(TLbrace) : _v === "}" ? Some2(TRbrace) : _v === "[" ? Some2(TLbracket) : _v === "]" ? Some2(TRbracket) : _v === "," ? Some2(TComma) : _v === ";" ? Some2(TSemi) : _v === "." ? Some2(TDot) : _v === ":" ? Some2(TColon) : _v === "?" ? Some2(TQuestion) : _v === "@" ? Some2(TAt) : _v === "#" ? Some2(THash) : _v === "~" ? Some2(TTilde) : _v === "+" ? Some2(TPlus) : _v === "-" ? Some2(TMinus) : _v === "*" ? Some2(TStar) : _v === "/" ? Some2(TSlash) : _v === "%" ? Some2(TPercent) : _v === "!" ? Some2(TBang) : _v === "`" ? Some2(TBacktick) : _v === "<" ? Some2(TLt) : _v === ">" ? Some2(TGt) : None2)(c);
var scanWhile = _curry2(3, (pred, src, j) => ((_v) => _v._tag === "Some" && (({ value: c }) => pred(c))(_v) ? (({ value: c }) => scanWhile(pred, src, j + 1))(_v) : j)(_Str_get2(j, src)));
var escChar = (n) => ((_v) => _v === "n" ? `
` : _v === "t" ? "\t" : ((c) => c)(_v))(n);
var PLit = (value) => ({ _tag: "PLit", value });
var PHole = _curry2(2, (start, end) => ({ _tag: "PHole", start, end }));
var literalTok = _curry2(3, (idx, total, value) => total === 1 ? TStr(value) : idx === 0 ? TTmplStart(value) : eq(idx, total - 1) ? TTmplEnd(value) : TTmplMid(value));
var scanTemplateLoop = _curry2(4, (src, j0, value0, parts0) => {
  let j = j0;
  let value = value0;
  let parts = parts0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done2(None2) : _v._tag === "Some" && _v.value === '"' ? _done2(Some2({ parts: _Array_append(PLit(value), parts), end: j + 1 })) : _v._tag === "Some" && _v.value === "\\" ? ((_v) => _v._tag === "Some" ? (({ value: n }) => _recur2(j + 2, `${value}${escChar(n)}`, parts))(_v) : _v._tag === "None" ? _recur2(j + 1, `${value}\\`, parts) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Str_get2(j + 1, src)) : _v._tag === "Some" && _v.value === "$" && _Option_contains2("{", _Str_get2(j + 1, src)) ? ((_v) => _v._tag === "None" ? _done2(None2) : _v._tag === "Some" ? (({ value: holeEnd }) => ((withLit) => ((withHole) => _recur2(holeEnd, "", withHole))(_Array_append(PHole(j + 2, holeEnd - 1), withLit)))(_Array_append(PLit(value), parts)))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(findHoleEnd(src, j + 2)) : _v._tag === "Some" ? (({ value: c }) => _recur2(j + 1, `${value}${c}`, parts))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Str_get2(j, src));
    if (_step._tag === "recur") {
      [j, value, parts] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var scanTemplate = _curry2(2, (src, i) => scanTemplateLoop(src, i + 1, "", []));
var notNewline = (c) => c !== `
`;
var scanComment = _curry2(3, (src, start, lineTok) => {
  const stop = scanWhile(notNewline, src, start);
  return lineTok ? Trailing(stop) : _Option_contains2("/", _Str_get2(start + 2, src)) ? ((textStart) => DocLine(_Str_slice(textStart, stop, src), stop))(_Option_contains2(" ", _Str_get2(start + 3, src)) ? start + 4 : start + 3) : PlainOwn(stop);
});
var mkTok = _curry2(4, (tok, start, stop, doc) => ((_v) => _v.length === 0 ? { tok, start, end: stop, doc: None2 } : ((lines) => ({ tok, start, end: stop, doc: Some2(_Str_join(`
`, lines)) }))(_v))(doc));
var pushRun = _curry2(2, (run, buf) => {
  const n = length(buf);
  return ((_v) => _v._tag === "Some" && (({ value: top }) => length(top) <= length(run))(_v) ? (({ value: top }) => pushRun(_Array_concat(top, run), _Array_take(n - 1, buf)))(_v) : _Array_append(run, buf))(_Array_get(n - 1, buf));
});
var pushTok = _curry2(2, (t, buf) => pushRun([t], buf));
var bufToks = (buf) => _Array_flatMap((run) => run, buf);
var lexError = _curry2(3, (message, start, stop) => Err({ message, start, end: stop }));
var numValue = (raw) => _Option_unwrapOr(0 / 0, _Str_toNumber(raw));
var numStart = _curry2(3, (src, i, c) => or(isDigit(c), and(c === "-", _Option_exists(isDigit, _Str_get2(i + 1, src)))));
var offsetLocTok = _curry2(2, (lt, by) => ({ tok: lt.tok, start: lt.start + by, end: lt.end + by, doc: lt.doc }));
var spliceHoleToks = _curry2(3, (holeToks, by, toks) => ((_v) => _v._tag === "None" ? toks : _v._tag === "Some" ? (({ value: ht }) => ((toks2) => spliceHoleToks(_Array_tail(holeToks), by, toks2))(ht.tok._tag === "TEof" ? toks : pushTok(offsetLocTok(ht, by), toks)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_head(holeToks)));
var spliceHole = _curry2(4, (src, start, stop, toks) => ((_v) => _v._tag === "Ok" ? (({ value: holeToks }) => Ok(spliceHoleToks(holeToks, start, toks)))(_v) : _v._tag === "Err" ? (({ error: e }) => Err({ message: e.message, start: e.start + start, end: e.end + start }))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(lex(_Str_slice(start, stop, src))));
var lexParts = _curry2(8, (src, parts, idx, total, wholeStart, wholeEnd, doc, toks) => ((_v) => _v._tag === "None" ? Ok(toks) : _v._tag === "Some" ? (({ value: part }) => ((_v) => _v._tag === "PLit" ? (({ value }) => ((t) => lexParts(src, _Array_tail(parts), idx + 1, total, wholeStart, wholeEnd, [], pushTok(t, toks)))(mkTok(literalTok(idx, total, value), wholeStart, wholeEnd, doc)))(_v) : _v._tag === "PHole" ? (({ start: hs, end: he }) => ((_v) => _v._tag === "Err" ? (({ error: e }) => Err(e))(_v) : _v._tag === "Ok" ? (({ value: toks2 }) => lexParts(src, _Array_tail(parts), idx + 1, total, wholeStart, wholeEnd, doc, toks2))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(spliceHole(src, hs, he, toks)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(part))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_head(parts)));
var emit = _curry2(6, (src, tok, start, stop, doc, toks) => go(src, stop, [], 0, true, pushTok(mkTok(tok, start, stop, doc), toks)));
var lexString = _curry2(4, (src, i, doc, toks) => ((_v) => _v._tag === "None" ? lexError("unterminated string literal", i, _Str_length(src)) : _v._tag === "Some" ? (({ value: scanned }) => ((_v) => _v._tag === "Err" ? (({ error: e }) => Err(e))(_v) : _v._tag === "Ok" ? (({ value: toks2 }) => go(src, scanned.end, [], 0, true, toks2))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(lexParts(src, scanned.parts, 0, length(scanned.parts), i, scanned.end, doc, toks)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(scanTemplate(src, i)));
var go = _curry2(6, (src, i, doc, nlRun, lineTok, toks) => ((_v) => _v._tag === "None" ? Ok(bufToks(pushTok(mkTok(TEof, i, i, doc), toks))) : _v._tag === "Some" && (({ value: c }) => isSpace(c))(_v) ? (({ value: c }) => c === `
` ? ((n) => ((kept) => go(src, i + 1, kept, n, false, toks))(lt(n, 2) ? doc : []))(nlRun + 1) : go(src, i + 1, doc, nlRun, lineTok, toks))(_v) : _v._tag === "Some" && _v.value === "/" && _Option_contains2("/", _Str_get2(i + 1, src)) ? ((_v) => _v._tag === "Trailing" ? (({ stop }) => go(src, stop, doc, nlRun, lineTok, toks))(_v) : _v._tag === "PlainOwn" ? (({ stop }) => go(src, stop, [], 0, lineTok, toks))(_v) : _v._tag === "DocLine" ? (({ text, stop }) => go(src, stop, _Array_append(text, doc), 0, lineTok, toks))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(scanComment(src, i, lineTok)) : _v._tag === "Some" ? (({ value: c }) => _Str_slice(i, i + 3, src) === "..." ? emit(src, TSpread, i, i + 3, doc, toks) : ((_v) => _v._tag === "Some" ? (({ value: t }) => emit(src, t, i, i + 2, doc, toks))(_v) : _v._tag === "None" ? c === '"' ? lexString(src, i, doc, toks) : numStart(src, i, c) ? ((j) => ((raw) => emit(src, TNum(numValue(raw), raw), i, j, doc, toks))(_Str_slice(i, j, src)))(scanWhile(isNumChar, src, i + 1)) : ((_v) => _v._tag === "Some" ? (({ value: t }) => emit(src, t, i, i + 1, doc, toks))(_v) : _v._tag === "None" ? isIdStart(c) ? ((j) => emit(src, identTok(_Str_slice(i, j, src)), i, j, doc, toks))(scanWhile(isIdChar, src, i + 1)) : lexError(`unexpected char '${c}'`, i, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(punctTok(c)) : (() => {
  throw new Error("non-exhaustive match");
})())(digraphTok(_Str_slice(i, i + 2, src))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_get2(i, src)));
var lex = (src) => go(src, 0, [], 0, false, []);

import { Err as Err7, None as None11, Ok as Ok7, Some as Some11, _Array_append as _Array_append8, _Array_concat as _Array_concat5, _Array_get as _Array_get10, _Array_prepend as _Array_prepend4, _Option_exists as _Option_exists3, _Option_unwrapOr as _Option_unwrapOr6, _Result_flatMap as _Result_flatMap5, _Result_map as _Result_map5, _Str_codeAt as _Str_codeAt5, _curry as _curry12, _done as _done5, _recur as _recur5, _tuple as _tuple6, and as and8, eq as eq9, length as length9, lt as lt4, map as map6, or as or6, show as show4 } from "@mochi/compiler/runtime";

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

import { Err as Err6, None as None10, Ok as Ok6, Some as Some10, _Array_append as _Array_append7, _Array_concat as _Array_concat4, _Array_find as _Array_find3, _Array_get as _Array_get9, _curry as _curry11, eq as eq8, filter as filter3, length as length8, map as map5 } from "@mochi/compiler/runtime";
import { match as match5 } from "@onrails/pattern";

import { Err as Err3, None as None6, Ok as Ok3, Some as Some6, _Array_append as _Array_append5, _Array_concat as _Array_concat3, _Array_find, _Array_get as _Array_get5, _Map_get as _Map_get2, _Map_keys as _Map_keys2, _Option_exists as _Option_exists2, _Option_isSome, _Option_unwrapOr as _Option_unwrapOr3, _Result_flatMap as _Result_flatMap2, _Result_map as _Result_map2, _Str_codeAt as _Str_codeAt3, _Str_contains, _Str_join as _Str_join3, _Str_length as _Str_length4, _Str_slice as _Str_slice2, _Str_split as _Str_split2, _Str_startsWith as _Str_startsWith2, _curry as _curry7, _tuple as _tuple3, and as and5, eq as eq4, length as length4, map as map2, or as or5, reduce, show as show2 } from "@mochi/compiler/runtime";
import { match } from "@onrails/pattern";

import { Err as Err2, None as None3, Ok as Ok2, Some as Some3, _Array_append as _Array_append2, _Array_concat as _Array_concat2, _Array_flatMap as _Array_flatMap2, _Array_get as _Array_get2, _Array_prepend, _Map_get, _Map_getOr, _Map_keys, _Map_set, _Map_values, _Result_flatMap, _Result_map, _Str_join as _Str_join2, _curry as _curry4, _tuple, and as and2, eq as eq2, floor, length as length2, map, or as or2, show } from "@mochi/compiler/runtime";
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
var tCon = _curry4(2, (name, args) => TyCon(name, args));
var tArrow = _curry4(2, (fromT, toT) => TyFn(fromT, toT));
var tRecord = (row) => TyRecord(row);
var tPrim = (name) => TyCon(name, []);
var tLit = (value) => TySingleton("string", value);
var typeEq = _curry4(2, (a, b) => ((_v) => _v._tag === "TyVar" ? (({ id: aid }) => ((_v) => _v._tag === "TyVar" ? (({ id: bid }) => eq2(aid, bid))(_v) : false)(b))(_v) : _v._tag === "TyCon" ? (({ name: aname, args: aargs }) => ((_v) => _v._tag === "TyCon" ? (({ name: bname, args: bargs }) => and2(and2(eq2(aname, bname), eq2(length2(aargs), length2(bargs))), typeEqList(aargs, bargs, 0)))(_v) : false)(b))(_v) : _v._tag === "TyFn" ? (({ from: af, to: at }) => ((_v) => _v._tag === "TyFn" ? (({ from: bf, to: bt }) => and2(typeEq(af, bf), typeEq(at, bt)))(_v) : false)(b))(_v) : _v._tag === "TyRecord" ? (({ row: arow }) => ((_v) => _v._tag === "TyRecord" ? (({ row: brow }) => rowEq(arow, brow))(_v) : false)(b))(_v) : _v._tag === "TySingleton" ? (({ base: abase, value: aval }) => ((_v) => _v._tag === "TySingleton" ? (({ base: bbase, value: bval }) => and2(eq2(abase, bbase), eq2(aval, bval)))(_v) : false)(b))(_v) : _v._tag === "TyOneOf" ? (({ members: am }) => ((_v) => _v._tag === "TyOneOf" ? (({ members: bm }) => and2(eq2(length2(am), length2(bm)), allMembersIn(am, bm, 0)))(_v) : false)(b))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(a));
var typeEqList = _curry4(3, (as_, bs, i) => ((_v) => _v._tag === "None" ? true : _v._tag === "Some" ? (({ value: a }) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" ? (({ value: b }) => and2(typeEq(a, b), typeEqList(as_, bs, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get2(i, bs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get2(i, as_)));
var memberEqIn = _curry4(3, (t, xs, i) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" ? (({ value: x }) => typeEq(t, x) ? true : memberEqIn(t, xs, i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get2(i, xs)));
var allMembersIn = _curry4(3, (am, bm, i) => ((_v) => _v._tag === "None" ? true : _v._tag === "Some" ? (({ value: m }) => and2(memberEqIn(m, bm, 0), allMembersIn(am, bm, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get2(i, am)));
var rowEq = _curry4(2, (a, b) => ((_v) => _v._tag === "RowEmpty" ? ((_v) => _v._tag === "RowEmpty" ? true : false)(b) : _v._tag === "RowVar" ? (({ id: aid }) => ((_v) => _v._tag === "RowVar" ? (({ id: bid }) => eq2(aid, bid))(_v) : false)(b))(_v) : _v._tag === "RowExtend" ? (({ label: al, fieldType: at, optional: ao, rest: ar }) => ((_v) => _v._tag === "RowExtend" ? (({ label: bl, fieldType: bt, optional: bo, rest: br }) => and2(and2(and2(eq2(al, bl), eq2(ao, bo)), typeEq(at, bt)), rowEq(ar, br)))(_v) : false)(b))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(a));
var flattenUnionFrom = _curry4(3, (members, acc, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: t }) => ((_v) => _v._tag === "TyOneOf" ? (({ members: ms }) => flattenUnionFrom(members, flattenUnionFrom(ms, acc, 0), i + 1))(_v) : flattenUnionFrom(members, memberEqIn(t, acc, 0) ? acc : _Array_append2(t, acc), i + 1))(t))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get2(i, members)));
var tUnion = (members) => {
  const flat = flattenUnionFrom(members, [], 0);
  return ((_v) => _v.length === 0 ? tPrim("string") : _v.length === 1 && _v[0]._tag === "TySingleton" ? TyOneOf(flat) : _v.length === 1 ? (([only]) => only)(_v) : TyOneOf(flat))(flat);
};
var TUPLE = "tuple";
var tTuple = (elems) => TyCon(TUPLE, elems);
var UNIT = "unit";
var tUnit = TyCon(UNIT, []);
var isUnit = (t) => ((_v) => _v._tag === "TyCon" ? (({ name, args }) => and2(eq2(name, UNIT), length2(args) === 0))(_v) : false)(t);
var rVar = (id) => RowVar(id);
var rExtend = _curry4(3, (label, fieldType, rest) => RowExtend(label, fieldType, false, rest));
var rField = _curry4(4, (label, fieldType, rest, optional) => RowExtend(label, fieldType, optional, rest));
var showTypeArgs = (args) => _Str_join2(", ", map(showType, args));
var showType = (t) => ((_v) => _v._tag === "TyVar" ? (({ id }) => `'t${show(id)}`)(_v) : _v._tag === "TyCon" ? (({ name, args }) => ((_v) => _v.length === 1 && (([elem]) => name === "Array")(_v) ? (([elem]) => `[${showType(elem)}]`)(_v) : _v.length === 0 && eq2(name, UNIT) ? "()" : eq2(name, TUPLE) ? `(${showTypeArgs(args)})` : length2(args) === 0 ? name : `${name}<${showTypeArgs(args)}>`)(args))(_v) : _v._tag === "TyFn" ? (({ from, to }) => ((fromS) => `${fromS} -> ${showType(to)}`)(((_v) => _v._tag === "TyFn" ? `(${showType(from)})` : showType(from))(from)))(_v) : _v._tag === "TyRecord" ? (({ row }) => showRow(row))(_v) : _v._tag === "TySingleton" ? (({ base, value }) => base === "string" ? show(value) : value)(_v) : _v._tag === "TyOneOf" ? (({ members }) => _Str_join2(" | ", map(showType, members)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(t);
var showRowFields = (row) => ((_v) => _v._tag === "RowExtend" ? (({ label, fieldType, optional, rest }) => (([fields, tailId]) => _tuple(_Array_prepend(`${label}${optional ? "?" : ""}: ${showType(fieldType)}`, fields), tailId))(showRowFields(rest)))(_v) : _v._tag === "RowVar" ? (({ id }) => _tuple([], Some3(id)))(_v) : _v._tag === "RowEmpty" ? _tuple([], None3) : (() => {
  throw new Error("non-exhaustive match");
})())(row);
var showRow = (row) => (([fields, tailId]) => {
  const tail = ((_v) => _v._tag === "Some" ? (({ value: id }) => `${length2(fields) === 0 ? "" : " "}| 'r${show(id)}`)(_v) : _v._tag === "None" ? "" : (() => {
    throw new Error("non-exhaustive match");
  })())(tailId);
  return and2(length2(fields) === 0, tail === "") ? "{}" : `{ ${_Str_join2(", ", fields)}${tail} }`;
})(showRowFields(row));
var someOfFrom = _curry4(3, (f, xs, i) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" ? (({ value: x }) => f(x) ? true : someOfFrom(f, xs, i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get2(i, xs)));
var someOf = _curry4(2, (f, xs) => someOfFrom(f, xs, 0));
var mkSt = (start) => ({ tv: new Map, rv: new Map, next: start, recorded: { cur: [], full: [] }, letSpans: new Map, letUses: new Map });
var ID_CHUNK = 64;
var idGet = _curry4(2, (id, m) => ((_v) => _v._tag === "Some" ? (({ value: chunk }) => _Map_get(id, chunk))(_v) : _v._tag === "None" ? None3 : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get(floor(id / ID_CHUNK), m)));
var idSet = _curry4(3, (id, v, m) => {
  const k = floor(id / ID_CHUNK);
  return _Map_set(k, _Map_set(id, v, _Map_getOr(new Map, k, m)), m);
});
var idKeys = (m) => _Array_flatMap2(_Map_keys, _Map_values(m));
var recordSymAt = _curry4(4, (span, t, sym, st) => {
  const rec = st.recorded;
  const at = { span, ty: t, sym };
  return { ...st, recorded: length2(rec.cur) < ID_CHUNK ? { cur: _Array_append2(at, rec.cur), full: rec.full } : { cur: [at], full: _Array_append2(rec.cur, rec.full) } };
});
var recordAt = _curry4(3, (span, t, st) => recordSymAt(span, t, None3, st));
var recordBinder = _curry4(6, (span, t, kind, name, doc, st) => recordSymAt(span, t, Some3({ kind, name, doc }), st));
var recordedTypes = (st) => _Array_concat2(_Array_flatMap2((c) => c, st.recorded.full), st.recorded.cur);
var spanKeyOf = (sp) => `${show(sp.start)}:${show(sp.end)}`;
var noteLet = _curry4(2, (span, st) => {
  const k = spanKeyOf(span);
  return { ...st, letSpans: _Map_set(k, span, st.letSpans), letUses: _Map_set(k, [], st.letUses) };
});
var noteUse = _curry4(3, (span, t, st) => {
  const k = spanKeyOf(span);
  return ((_v) => _v._tag === "None" ? st : _v._tag === "Some" ? (({ value: uses }) => ({ ...st, letUses: _Map_set(k, _Array_append2(t, uses), st.letUses) }))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(_Map_get(k, st.letUses));
});
var fail = (message) => Err2({ message });
var freshVar = (st) => _tuple(tVar(st.next), { ...st, next: st.next + 1 });
var freshRowVar = (st) => _tuple(rVar(st.next), { ...st, next: st.next + 1 });
var resolve = _curry4(2, (t, st) => ((_v) => _v._tag === "TyVar" ? (({ id }) => ((_v) => _v._tag === "Some" ? (({ value: next }) => resolve(next, st))(_v) : _v._tag === "None" ? t : (() => {
  throw new Error("non-exhaustive match");
})())(idGet(id, st.tv)))(_v) : t)(t));
var resolveRow = _curry4(2, (r, st) => ((_v) => _v._tag === "RowVar" ? (({ id }) => ((_v) => _v._tag === "Some" ? (({ value: next }) => resolveRow(next, st))(_v) : _v._tag === "None" ? r : (() => {
  throw new Error("non-exhaustive match");
})())(idGet(id, st.rv)))(_v) : r)(r));
var zonk = _curry4(2, (t, st) => ((_v) => _v._tag === "TyVar" ? (({ id }) => tVar(id))(_v) : _v._tag === "TyCon" ? (({ name, args }) => tCon(name, map((a) => zonk(a, st), args)))(_v) : _v._tag === "TyFn" ? (({ from, to }) => tArrow(zonk(from, st), zonk(to, st)))(_v) : _v._tag === "TyRecord" ? (({ row }) => tRecord(zonkRow(row, st)))(_v) : _v._tag === "TySingleton" ? (({ base, value }) => TySingleton(base, value))(_v) : _v._tag === "TyOneOf" ? (({ members }) => tUnion(map((m) => zonk(m, st), members)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(resolve(t, st)));
var zonkRow = _curry4(2, (row, st) => ((_v) => _v._tag === "RowExtend" ? (({ label, fieldType, optional, rest }) => rField(label, zonk(fieldType, st), zonkRow(rest, st), optional))(_v) : ((r) => r)(_v))(resolveRow(row, st)));
var occurs = _curry4(3, (id, t, st) => ((_v) => _v._tag === "TyVar" ? (({ id: rid }) => eq2(rid, id))(_v) : _v._tag === "TyCon" ? (({ args }) => someOf((a) => occurs(id, a, st), args))(_v) : _v._tag === "TyFn" ? (({ from, to }) => or2(occurs(id, from, st), occurs(id, to, st)))(_v) : _v._tag === "TyRecord" ? (({ row }) => occursRow(id, row, st))(_v) : _v._tag === "TySingleton" ? false : _v._tag === "TyOneOf" ? (({ members }) => someOf((m) => occurs(id, m, st), members))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(resolve(t, st)));
var occursRow = _curry4(3, (id, row, st) => ((_v) => _v._tag === "RowExtend" ? (({ fieldType, rest }) => or2(occurs(id, fieldType, st), occursRow(id, rest, st)))(_v) : false)(resolveRow(row, st)));
var rowVarOccurs = _curry4(3, (id, row, st) => ((_v) => _v._tag === "RowVar" ? (({ id: rid }) => eq2(rid, id))(_v) : _v._tag === "RowExtend" ? (({ fieldType, rest }) => or2(rowVarOccursInType(id, fieldType, st), rowVarOccurs(id, rest, st)))(_v) : _v._tag === "RowEmpty" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(resolveRow(row, st)));
var rowVarOccursInType = _curry4(3, (id, t, st) => ((_v) => _v._tag === "TyVar" ? false : _v._tag === "TyCon" ? (({ args }) => someOf((a) => rowVarOccursInType(id, a, st), args))(_v) : _v._tag === "TyFn" ? (({ from, to }) => or2(rowVarOccursInType(id, from, st), rowVarOccursInType(id, to, st)))(_v) : _v._tag === "TyRecord" ? (({ row }) => rowVarOccurs(id, row, st))(_v) : _v._tag === "TySingleton" ? false : _v._tag === "TyOneOf" ? (({ members }) => someOf((m) => rowVarOccursInType(id, m, st), members))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(resolve(t, st)));
var isArrowT = (t) => ((_v) => _v._tag === "TyFn" ? true : false)(t);
var isCollection = (name) => or2(or2(or2(name === "Array", name === "List"), name === "Set"), name === "Map");
var isTupleT = (t) => ((_v) => _v._tag === "TyCon" ? (({ name }) => eq2(name, TUPLE))(_v) : false)(t);
var tupleParenMsg = _curry4(3, (a, b, shown) => !eq2(isTupleT(a), isTupleT(b)) ? `${shown} — ((a, b)) => takes one tuple; (a, b) => takes two arguments` : shown);
var collectionUnifyMsg = _curry4(3, (aname, bname, shown) => or2(or2(eq2(aname, bname), !isCollection(aname)), !isCollection(bname)) ? shown : ((other) => ((hint) => `${shown} — ${hint}`)(other === "List" ? "unqualified map/filter/length expect Array; use List.map" : other === "Set" ? "unqualified map/filter/length expect Array; convert with Set.toArray or use Set.*" : other === "Map" ? "unqualified map/filter/length expect Array; use Map.*" : `${aname} and ${bname} are distinct collections`))(aname === "Array" ? bname : bname === "Array" ? aname : ""));
var unifyMismatch = _curry4(2, (ra, rb) => !eq2(isArrowT(ra), isArrowT(rb)) ? (([fn, val]) => fail(tupleParenMsg(ra, rb, `cannot unify ${showType(ra)} with ${showType(rb)} — a function (${showType(fn)}) was used where a ${showType(val)} was expected; a call may be missing an argument`)))(isArrowT(ra) ? _tuple(ra, rb) : _tuple(rb, ra)) : fail(tupleParenMsg(ra, rb, `cannot unify ${showType(ra)} with ${showType(rb)}`)));
var unifyArgs = _curry4(4, (as_, bs, i, st) => ((_v) => _v._tag === "None" ? Ok2(st) : _v._tag === "Some" ? (({ value: a }) => ((_v) => _v._tag === "None" ? Ok2(st) : _v._tag === "Some" ? (({ value: b }) => _Result_flatMap((s1) => unifyArgs(as_, bs, i + 1, s1), unify(a, b, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get2(i, bs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get2(i, as_)));
var isPrimT = _curry4(2, (t, name) => ((_v) => _v._tag === "TyCon" ? (({ name: n, args }) => and2(eq2(n, name), length2(args) === 0))(_v) : false)(t));
var isLitOnlyUnion = (members) => ((_v) => _v.length === 0 ? true : _v.length >= 1 && _v[0]._tag === "TySingleton" ? (([, ...rest]) => isLitOnlyUnion(rest))(_v) : false)(members);
var widenLitBindingsFrom = _curry4(4, (ids, i, lit, st) => ((_v) => _v._tag === "None" ? st : _v._tag === "Some" ? (({ value: id }) => ((_v) => _v._tag === "Some" ? (({ value: t }) => ((_v) => _v._tag === "TySingleton" ? (({ base, value }) => ((_v) => _v._tag === "TySingleton" ? (({ base: lbase, value: lvalue }) => and2(eq2(base, lbase), eq2(value, lvalue)) ? widenLitBindingsFrom(ids, i + 1, lit, { ...st, tv: idSet(id, tPrim(base), st.tv) }) : widenLitBindingsFrom(ids, i + 1, lit, st))(_v) : widenLitBindingsFrom(ids, i + 1, lit, st))(lit))(_v) : widenLitBindingsFrom(ids, i + 1, lit, st))(resolve(t, st)))(_v) : _v._tag === "None" ? widenLitBindingsFrom(ids, i + 1, lit, st) : (() => {
  throw new Error("non-exhaustive match");
})())(idGet(id, st.tv)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get2(i, ids)));
var widenLitBindings = _curry4(2, (lit, st) => widenLitBindingsFrom(idKeys(st.tv), 0, lit, st));
var litInUnionFrom = _curry4(4, (lit, members, i, st) => ((_v) => _v._tag === "None" ? fail(`cannot unify ${showType(lit)} with ${showType(TyOneOf(members))}`) : _v._tag === "Some" ? (({ value: m }) => ((_v) => _v._tag === "TySingleton" ? (({ base, value }) => ((_v) => _v._tag === "TySingleton" ? (({ base: lbase, value: lvalue }) => and2(eq2(base, lbase), eq2(value, lvalue)) ? Ok2(st) : litInUnionFrom(lit, members, i + 1, st))(_v) : litInUnionFrom(lit, members, i + 1, st))(lit))(_v) : ((_v) => _v._tag === "Ok" ? (({ value: st1 }) => Ok2(st1))(_v) : _v._tag === "Err" ? litInUnionFrom(lit, members, i + 1, st) : (() => {
  throw new Error("non-exhaustive match");
})())(unify(lit, m, st)))(m))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get2(i, members)));
var unifyMemberAgainstUnionFrom = _curry4(4, (member, members, i, st) => ((_v) => _v._tag === "TySingleton" ? litInUnionFrom(member, members, 0, st) : unifyConcreteAgainstUnionFrom(member, members, i, st))(member));
var unifyConcreteAgainstUnionFrom = _curry4(4, (member, members, i, st) => ((_v) => _v._tag === "None" ? fail(`cannot unify ${showType(member)} with ${showType(TyOneOf(members))}`) : _v._tag === "Some" ? (({ value: m }) => ((_v) => _v._tag === "Ok" ? (({ value: st1 }) => Ok2(st1))(_v) : _v._tag === "Err" ? unifyConcreteAgainstUnionFrom(member, members, i + 1, st) : (() => {
  throw new Error("non-exhaustive match");
})())(unify(member, m, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get2(i, members)));
var unifyUnionMembersFrom = _curry4(4, (members, u, i, st) => ((_v) => _v._tag === "None" ? Ok2(st) : _v._tag === "Some" ? (({ value: m }) => ((_v) => _v._tag === "TyOneOf" ? (({ members: ums }) => _Result_flatMap((s1) => unifyUnionMembersFrom(members, u, i + 1, s1), unifyMemberAgainstUnionFrom(m, ums, 0, st)))(_v) : Ok2(st))(u))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get2(i, members)));
var unifyLitUnion = _curry4(3, (a, b, st) => ((_v) => _v._tag === "TySingleton" ? (({ base: abase, value: aval }) => ((_v) => _v._tag === "TySingleton" ? (({ base: bbase, value: bval }) => and2(eq2(abase, bbase), eq2(aval, bval)) ? Ok2(st) : eq2(abase, bbase) ? Ok2(widenLitBindings(b, widenLitBindings(a, st))) : fail(`cannot unify ${showType(a)} with ${showType(b)}`))(_v) : _v._tag === "TyOneOf" ? (({ members }) => litInUnionFrom(a, members, 0, st))(_v) : isPrimT(b, abase) ? Ok2(st) : fail(`cannot unify ${showType(a)} with ${showType(b)}`))(b))(_v) : _v._tag === "TyOneOf" ? (({ members: amembers }) => ((_v) => _v._tag === "TySingleton" ? litInUnionFrom(b, amembers, 0, st) : _v._tag === "TyOneOf" ? (({ members: bmembers }) => _Result_flatMap((s1) => unifyUnionMembersFrom(bmembers, a, 0, s1), unifyUnionMembersFrom(amembers, b, 0, st)))(_v) : isLitOnlyUnion(amembers) ? fail(`cannot unify ${showType(a)} with ${showType(b)}`) : unifyMemberAgainstUnionFrom(b, amembers, 0, st))(b))(_v) : ((_v) => _v._tag === "TySingleton" ? (({ base: bbase }) => isPrimT(a, bbase) ? Ok2(st) : fail(`cannot unify ${showType(a)} with ${showType(b)}`))(_v) : _v._tag === "TyOneOf" ? (({ members: bmembers }) => isLitOnlyUnion(bmembers) ? fail(`cannot unify ${showType(a)} with ${showType(b)}`) : unifyMemberAgainstUnionFrom(a, bmembers, 0, st))(_v) : fail(`cannot unify ${showType(a)} with ${showType(b)}`))(b))(a));
var unify = _curry4(3, (a, b, st) => {
  const ra = resolve(a, st);
  const rb = resolve(b, st);
  return ((_v) => _v._tag === "TyVar" ? (({ id: aid }) => ((_v) => _v._tag === "TyVar" ? (({ id: bid }) => eq2(aid, bid) ? Ok2(st) : bindVar(aid, rb, st))(_v) : bindVar(aid, rb, st))(rb))(_v) : _v._tag === "TyCon" ? (({ name: aname, args: aargs }) => ((_v) => _v._tag === "TyVar" ? (({ id: bid }) => bindVar(bid, ra, st))(_v) : _v._tag === "TyCon" ? (({ name: bname, args: bargs }) => and2(eq2(aname, bname), eq2(length2(aargs), length2(bargs))) ? unifyArgs(aargs, bargs, 0, st) : fail(tupleParenMsg(ra, rb, collectionUnifyMsg(aname, bname, `cannot unify ${showType(ra)} with ${showType(rb)}`))))(_v) : _v._tag === "TySingleton" ? unifyLitUnion(ra, rb, st) : _v._tag === "TyOneOf" ? unifyLitUnion(ra, rb, st) : unifyMismatch(ra, rb))(rb))(_v) : _v._tag === "TyFn" ? (({ from: afrom, to: ato }) => ((_v) => _v._tag === "TyVar" ? (({ id: bid }) => bindVar(bid, ra, st))(_v) : _v._tag === "TyFn" ? (({ from: bfrom, to: bto }) => _Result_flatMap((s1) => unify(ato, bto, s1), unify(afrom, bfrom, st)))(_v) : _v._tag === "TySingleton" ? unifyLitUnion(ra, rb, st) : _v._tag === "TyOneOf" ? unifyLitUnion(ra, rb, st) : unifyMismatch(ra, rb))(rb))(_v) : _v._tag === "TyRecord" ? (({ row: arow }) => ((_v) => _v._tag === "TyVar" ? (({ id: bid }) => bindVar(bid, ra, st))(_v) : _v._tag === "TyRecord" ? (({ row: brow }) => unifyRows(arow, brow, st))(_v) : _v._tag === "TySingleton" ? unifyLitUnion(ra, rb, st) : _v._tag === "TyOneOf" ? unifyLitUnion(ra, rb, st) : unifyMismatch(ra, rb))(rb))(_v) : _v._tag === "TySingleton" ? ((_v) => _v._tag === "TyVar" ? (({ id: bid }) => bindVar(bid, ra, st))(_v) : unifyLitUnion(ra, rb, st))(rb) : _v._tag === "TyOneOf" ? ((_v) => _v._tag === "TyVar" ? (({ id: bid }) => bindVar(bid, ra, st))(_v) : unifyLitUnion(ra, rb, st))(rb) : (() => {
    throw new Error("non-exhaustive match");
  })())(ra);
});
var bindVar = _curry4(3, (id, t, st) => occurs(id, t, st) ? fail(`infinite type: 't${show(id)} occurs in ${showType(zonk(t, st))}`) : Ok2({ ...st, tv: idSet(id, t, st.tv) }));
var rewriteRow = _curry4(3, (row, label, st) => ((_v) => _v._tag === "RowEmpty" ? fail(`record missing field '${label}'`) : _v._tag === "RowExtend" ? (({ label: rlabel, fieldType: rtype, optional: ropt, rest: rrest }) => eq2(rlabel, label) ? Ok2(_tuple(rtype, ropt, rrest, st)) : _Result_map(([subType, subOpt, subRest, subSt]) => _tuple(subType, subOpt, rField(rlabel, rtype, subRest, ropt), subSt), rewriteRow(rrest, label, st)))(_v) : _v._tag === "RowVar" ? (({ id: rid }) => (([freshT, st1]) => (([freshTail, st2]) => Ok2(_tuple(freshT, false, freshTail, { ...st2, rv: idSet(rid, rExtend(label, freshT, freshTail), st2.rv) })))(freshRowVar(st1)))(freshVar(st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(resolveRow(row, st)));
var unifyRows = _curry4(3, (r1, r2, st) => {
  const a = resolveRow(r1, st);
  const b = resolveRow(r2, st);
  return ((_v) => _v._tag === "RowEmpty" ? ((_v) => _v._tag === "RowEmpty" ? Ok2(st) : _v._tag === "RowVar" ? (({ id: bid }) => bindRowVar(bid, a, st))(_v) : _v._tag === "RowExtend" ? (({ label }) => fail(`record missing field '${label}'`))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(b) : _v._tag === "RowVar" ? (({ id: aid }) => bindRowVar(aid, b, st))(_v) : _v._tag === "RowExtend" ? (({ label: alabel, fieldType: atype, optional: aopt, rest: arest }) => ((_v) => _v._tag === "RowEmpty" ? fail(`record has extra field '${alabel}'`) : _v._tag === "RowVar" ? (({ id: bid }) => bindRowVar(bid, a, st))(_v) : _v._tag === "RowExtend" ? _Result_flatMap(([btype, bopt, brest, s1]) => eq2(aopt, bopt) ? _Result_flatMap((s2) => unifyRows(arest, brest, s2), unify(atype, btype, s1)) : fail(aopt ? `record field '${alabel}' is optional but required on the other side` : `record field '${alabel}' is required but optional on the other side`), rewriteRow(b, alabel, st)) : (() => {
    throw new Error("non-exhaustive match");
  })())(b))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(a);
});
var bindRowVar = _curry4(3, (id, row, st) => ((_v) => _v._tag === "RowVar" && (({ id: rid }) => eq2(rid, id))(_v) ? (({ id: rid }) => Ok2(st))(_v) : ((r) => rowVarOccurs(id, r, st) ? fail("infinite record type") : Ok2({ ...st, rv: idSet(id, r, st.rv) }))(_v))(resolveRow(row, st)));
var fits = _curry4(3, (actual, expected, st) => {
  const ra = resolve(actual, st);
  const rb = resolve(expected, st);
  return ((_v) => _v._tag === "TyVar" ? (({ id: aid }) => bindVar(aid, rb, st))(_v) : ((_v) => _v._tag === "TyVar" ? (({ id: bid }) => bindVar(bid, ra, st))(_v) : _v._tag === "TyRecord" ? (({ row: erow }) => ((_v) => _v._tag === "TyRecord" ? (({ row: arow }) => fitsRows(arow, erow, st))(_v) : unify(actual, expected, st))(ra))(_v) : unify(actual, expected, st))(rb))(ra);
});
var fitsRows = _curry4(3, (actual, expected, st) => {
  const exp = resolveRow(expected, st);
  const act = resolveRow(actual, st);
  return ((_v) => _v._tag === "RowVar" ? (({ id: eid }) => bindRowVar(eid, act, st))(_v) : _v._tag === "RowEmpty" ? ((_v) => _v._tag === "RowEmpty" ? Ok2(st) : _v._tag === "RowVar" ? (({ id: aid }) => bindRowVar(aid, exp, st))(_v) : _v._tag === "RowExtend" ? (({ label }) => fail(`record has extra field '${label}'`))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(act) : _v._tag === "RowExtend" ? (({ label: elabel, fieldType: etype, optional: eopt, rest: erest }) => ((rw) => ((_v) => _v._tag === "Err" ? eopt ? fitsRows(act, erest, st) : fail(`record missing field '${elabel}'`) : _v._tag === "Ok" ? (({ value: hit }) => (([htype, hopt, hrest, s1]) => and2(hopt, !eopt) ? fail(`record field '${elabel}' is required but missing or optional`) : _Result_flatMap((s2) => fitsRows(hrest, erest, s2), unify(htype, etype, s1)))(hit))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(rw))(rewriteRow(act, elabel, st)))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(exp);
});

import { None as None4, Some as Some4, _Array_append as _Array_append3, _Array_get as _Array_get3, _Str_codeAt as _Str_codeAt2, _Str_get as _Str_get3, _Str_length as _Str_length2, _Str_startsWith, _curry as _curry5, _tuple as _tuple2, and as and3, eq as eq3, floor as floor2, max, min, or as or3 } from "@mochi/compiler/runtime";
var at = _curry5(3, (xs, i, fallback) => ((_v) => _v._tag === "Some" ? (({ value: v }) => v)(_v) : _v._tag === "None" ? fallback : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get3(i, xs)));
var charsEq = _curry5(4, (a, i, b, j) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" ? (([{ value: x }, { value: y }]) => eq3(x, y))(_v) : false)(_tuple2(_Str_get3(i, a), _Str_get3(j, b))));
var initRow = (n) => {
  let j = 0;
  let row = [];
  while (true) {
    if (j > n) {
      return row;
    } else {
      [j, row] = [j + 1, _Array_append3(j, row)];
      continue;
    }
  }
};
var cellAt = _curry5(6, (a, b, i, j, prev, cur) => {
  const cost = charsEq(a, i - 1, b, j - 1) ? 0 : 1;
  return min(min(at(cur, j - 1, 0) + 1, at(prev, j, 0) + 1), at(prev, j - 1, 0) + cost);
});
var fillRow = _curry5(5, (a, b, i, prev, n) => {
  let j = 1;
  let cur = [i];
  while (true) {
    if (j > n) {
      return cur;
    } else {
      [j, cur] = [j + 1, _Array_append3(cellAt(a, b, i, j, prev, cur), cur)];
      continue;
    }
  }
});
var levFrom = _curry5(4, (a, b, m, n) => {
  let i = 1;
  let prev = initRow(n);
  while (true) {
    if (i > m) {
      return at(prev, n, n);
    } else {
      [i, prev] = [i + 1, fillRow(a, b, i, prev, n)];
      continue;
    }
  }
});
var lev = _curry5(2, (a, b) => {
  const m = _Str_length2(a);
  const n = _Str_length2(b);
  return m === 0 ? n : n === 0 ? m : levFrom(a, b, m, n);
});
var upperStart = (s) => ((_v) => _v._tag === "Some" ? (({ value: n }) => and3(n >= 65, n <= 90))(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_codeAt2(0, s));
var sameCaseClass = _curry5(2, (a, b) => eq3(upperStart(a), upperStart(b)));
var skipName = _curry5(2, (want, n) => or3(or3(or3(or3(n === "", eq3(n, want)), _Str_startsWith("$", n)), _Str_startsWith("_", n)), !sameCaseClass(want, n)));
var consider = _curry5(5, (want, budget, best, bestDist, n) => skipName(want, n) ? _tuple2(best, bestDist) : ((d) => and3(d <= budget, d < bestDist) ? _tuple2(Some4(n), d) : _tuple2(best, bestDist))(lev(want, n)));
var closestFrom = _curry5(6, (want, names, i, budget, best, bestDist) => ((_v) => _v._tag === "None" ? best : _v._tag === "Some" ? (({ value: n }) => (([next, dist]) => closestFrom(want, names, i + 1, budget, next, dist))(consider(want, budget, best, bestDist, n)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get3(i, names)));
var closestName = _curry5(2, (want, names) => {
  const budget = max(1, floor2(_Str_length2(want) / 3));
  return closestFrom(want, names, 0, budget, None4, _Str_length2(want) + 2);
});

import { _Array_append as _Array_append4, _Array_get as _Array_get4, _Option_unwrapOr as _Option_unwrapOr2, _Str_length as _Str_length3, _Str_split, _curry as _curry6, _done as _done3, _recur as _recur3, and as and4, length as length3, or as or4 } from "@mochi/compiler/runtime";
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
var joinFrom = _curry6(4, (sep, parts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: p }) => joinFrom(sep, parts, i + 1, i === 0 ? _Array_append4(p, acc) : _Array_append4(p, _Array_append4(sep, acc))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get4(i, parts)));
var join = _curry6(2, (sep, parts) => DCat(joinFrom(sep, parts, 0, [])));
var WNil = { _tag: "WNil" };
var WCons = _curry6(2, (head, tail) => ({ _tag: "WCons", head, tail }));
var consParts = _curry6(4, (parts, i, m, tail) => {
  let k = length3(parts) - 1;
  let w = tail;
  while (true) {
    if (k < 0) {
      return w;
    } else {
      const _step = ((_v) => _v._tag === "None" ? _done3(w) : _v._tag === "Some" ? (({ value: d }) => _recur3(k - 1, WCons({ i, m, d }, w)))(_v) : (() => {
        throw new Error("non-exhaustive match");
      })())(_Array_get4(k, parts));
      if (_step._tag === "recur") {
        [k, w] = _step.args;
        continue;
      }
      return _step.value;
    }
  }
});
var fits2 = _curry6(2, (width, start) => {
  let rem = width;
  let work = start;
  while (true) {
    if (rem < 0) {
      return false;
    } else {
      const _step = ((_v) => _v._tag === "WNil" ? _done3(true) : _v._tag === "WCons" ? (({ head: { i, m, d }, tail }) => ((_v) => _v._tag === "DText" ? (({ s }) => _recur3(rem - _Str_length3(s), tail))(_v) : _v._tag === "DVerbatim" ? _done3(true) : _v._tag === "DCat" ? (({ parts }) => _recur3(rem, consParts(parts, i, m, tail)))(_v) : _v._tag === "DIndent" ? (({ doc: inner }) => _recur3(rem, WCons({ i: i + INDENT, m, d: inner }, tail)))(_v) : _v._tag === "DGroup" ? (({ doc: inner }) => _recur3(rem, WCons({ i, m: "flat", d: inner }, tail)))(_v) : _v._tag === "DLine" ? (({ hard, soft }) => or4(hard, m === "break") ? _done3(true) : _recur3(rem - (soft ? 0 : 1), tail))(_v) : _v._tag === "DLineSuffix" ? (({ doc: inner }) => _recur3(rem, WCons({ i, m, d: inner }, tail)))(_v) : _v._tag === "DBreakParent" ? _recur3(rem, tail) : (() => {
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
});
var anyForcesBreak = _curry6(2, (parts, i) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" ? (({ value: p }) => or4(forcesBreak(p), anyForcesBreak(parts, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get4(i, parts)));
var forcesBreak = (d) => ((_v) => _v._tag === "DBreakParent" ? true : _v._tag === "DVerbatim" ? true : _v._tag === "DLine" ? (({ hard }) => hard)(_v) : _v._tag === "DCat" ? (({ parts }) => anyForcesBreak(parts, 0))(_v) : _v._tag === "DIndent" ? (({ doc: inner }) => forcesBreak(inner))(_v) : _v._tag === "DGroup" ? (({ breaks }) => breaks)(_v) : _v._tag === "DLineSuffix" ? false : _v._tag === "DText" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(d);
var spaces = (n) => {
  let k = n;
  let acc = "";
  while (true) {
    if (k <= 0) {
      return acc;
    } else {
      [k, acc] = [k - 1, `${acc} `];
      continue;
    }
  }
};
var posAfter = _curry6(2, (pos, s) => {
  const parts = _Str_split(`
`, s);
  return length3(parts) === 1 ? pos + _Str_length3(s) : _Str_length3(_Option_unwrapOr2("", _Array_get4(length3(parts) - 1, parts)));
});
var consItems = _curry6(2, (items, tail) => {
  let k = length3(items) - 1;
  let w = tail;
  while (true) {
    if (k < 0) {
      return w;
    } else {
      const _step = ((_v) => _v._tag === "None" ? _done3(w) : _v._tag === "Some" ? (({ value: it }) => _recur3(k - 1, WCons(it, w)))(_v) : (() => {
        throw new Error("non-exhaustive match");
      })())(_Array_get4(k, items));
      if (_step._tag === "recur") {
        [k, w] = _step.args;
        continue;
      }
      return _step.value;
    }
  }
});
var render = _curry6(2, (root, width) => {
  let out = "";
  let pos = 0;
  let work = WCons({ i: 0, m: "break", d: root }, WNil);
  let sfx = [];
  while (true) {
    const _step = ((_v) => _v._tag === "WNil" ? length3(sfx) === 0 ? _done3(out) : _recur3(out, pos, consItems(sfx, WNil), []) : _v._tag === "WCons" ? (({ head: { i, m, d }, tail }) => ((_v) => _v._tag === "DText" ? (({ s }) => _recur3(`${out}${s}`, pos + _Str_length3(s), tail, sfx))(_v) : _v._tag === "DVerbatim" ? (({ s }) => _recur3(`${out}${s}`, posAfter(pos, s), tail, sfx))(_v) : _v._tag === "DCat" ? (({ parts }) => _recur3(out, pos, consParts(parts, i, m, tail), sfx))(_v) : _v._tag === "DIndent" ? (({ doc: inner }) => _recur3(out, pos, WCons({ i: i + INDENT, m, d: inner }, tail), sfx))(_v) : _v._tag === "DLine" ? (({ hard, soft }) => and4(m === "flat", !hard) ? ((s) => _recur3(`${out}${s}`, pos + _Str_length3(s), tail, sfx))(soft ? "" : " ") : length3(sfx) === 0 ? _recur3(`${out}
${spaces(i)}`, i, tail, []) : _recur3(out, pos, consItems(sfx, WCons({ i, m, d }, tail)), []))(_v) : _v._tag === "DGroup" ? (({ doc: inner, breaks }) => m === "flat" ? _recur3(out, pos, WCons({ i, m, d: inner }, tail), sfx) : breaks ? _recur3(out, pos, WCons({ i, m: "break", d: inner }, tail), sfx) : ((cand) => fits2(width - pos, cand) ? _recur3(out, pos, cand, sfx) : _recur3(out, pos, WCons({ i, m: "break", d: inner }, tail), sfx))(WCons({ i, m: "flat", d: inner }, tail)))(_v) : _v._tag === "DLineSuffix" ? (({ doc: inner }) => _recur3(out, pos, tail, _Array_append4({ i, m, d: inner }, sfx)))(_v) : _v._tag === "DBreakParent" ? _recur3(out, pos, tail, sfx) : (() => {
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
});

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

var jxTokName = (t) => ((_v) => _v._tag === "TEq" ? "eq" : _v._tag === "TLbrace" ? "lbrace" : _v._tag === "TRbrace" ? "rbrace" : _v._tag === "TSpread" ? "spread" : _v._tag === "TSlash" ? "slash" : _v._tag === "TLt" ? "lt" : _v._tag === "TGt" ? "gt" : _v._tag === "TId" ? "id" : _v._tag === "TStr" ? "str" : _v._tag === "TNum" ? "num" : _v._tag === "TBool" ? "bool" : _v._tag === "TEof" ? "eof" : "tok")(t);
var jxEofTok = { tok: TEof, start: 0, end: 0, doc: None6 };
var jxTokAt = _curry7(2, (toks, i) => _Option_unwrapOr3(jxEofTok, _Array_get5(i, toks)));
var jxSpanOf = (lt) => ({ start: lt.start, end: lt.end });
var jxToEnd = _curry7(3, (start, toks, pos) => ({ start: start.start, end: jxTokAt(toks, pos - 1).end }));
var jxErrAt = _curry7(2, (message, lt) => Err3({ message, start: lt.start, end: lt.end }));
var jxExpectTok = _curry7(3, (t, toks, pos) => {
  const lt = jxTokAt(toks, pos);
  return eq4(lt.tok, t) ? Ok3(pos + 1) : jxErrAt(`expected ${jxTokName(t)}, got ${jxTokName(lt.tok)}`, lt);
});
var jxExpectId = _curry7(2, (toks, pos) => {
  const lt = jxTokAt(toks, pos);
  return ((_v) => _v._tag === "TId" ? (({ value: name }) => Ok3(_tuple3({ name, span: jxSpanOf(lt) }, pos + 1)))(_v) : ((t) => jxErrAt(`expected id, got ${jxTokName(t)}`, lt))(_v))(lt.tok);
});
var jxKeywordText = (t) => ((_v) => _v._tag === "TLet" ? Some6("let") : _v._tag === "TType" ? Some6("type") : _v._tag === "TExtern" ? Some6("extern") : _v._tag === "TSwitch" ? Some6("switch") : _v._tag === "TLoop" ? Some6("loop") : _v._tag === "TRecur" ? Some6("recur") : _v._tag === "TDo" ? Some6("do") : _v._tag === "TImport" ? Some6("import") : _v._tag === "TExport" ? Some6("export") : None6)(t);
var jxExpectLabel = _curry7(2, (toks, pos) => {
  const lt = jxTokAt(toks, pos);
  return ((_v) => _v._tag === "Some" ? (({ value: name }) => Ok3(_tuple3({ name, span: jxSpanOf(lt) }, pos + 1)))(_v) : _v._tag === "None" ? jxExpectId(toks, pos) : (() => {
    throw new Error("non-exhaustive match");
  })())(jxKeywordText(lt.tok));
});
var jxAttrNameFrom = _curry7(3, (toks, pos, acc) => {
  const minusTok = jxTokAt(toks, pos);
  const partTok = jxTokAt(toks, pos + 1);
  return and5(and5(minusTok.tok._tag === "TMinus", eq4(minusTok.start, acc.span.end)), eq4(partTok.start, minusTok.end)) ? ((_v) => _v._tag === "Ok" ? (({ value: [part, p1] }) => jxAttrNameFrom(toks, p1, { name: `${acc.name}-${part.name}`, span: { start: acc.span.start, end: part.span.end } }))(_v) : _v._tag === "Err" ? _tuple3(acc, pos) : (() => {
    throw new Error("non-exhaustive match");
  })())(jxExpectLabel(toks, pos + 1)) : _tuple3(acc, pos);
});
var jxExpectAttrName = _curry7(2, (toks, pos) => _Result_map2(([head, p1]) => jxAttrNameFrom(toks, p1, head), jxExpectLabel(toks, pos)));
var jxIsUpper = (s) => _Option_exists2((n) => and5(n >= 65, n <= 90), _Str_codeAt3(0, s));
var jxExprSpan = (e) => ((_v) => _v._tag === "ENum" ? (({ span: sp }) => sp)(_v) : _v._tag === "EUnit" ? (({ span: sp }) => sp)(_v) : _v._tag === "EBool" ? (({ span: sp }) => sp)(_v) : _v._tag === "EStr" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERef" ? (({ span: sp }) => sp)(_v) : _v._tag === "ECall" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELambda" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELetIn" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELetBind" ? (({ span: sp }) => sp)(_v) : _v._tag === "EPipe" ? (({ span: sp }) => sp)(_v) : _v._tag === "EDo" ? (({ span: sp }) => sp)(_v) : _v._tag === "ETernary" ? (({ span: sp }) => sp)(_v) : _v._tag === "EMatch" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELoop" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERecur" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERecord" ? (({ span: sp }) => sp)(_v) : _v._tag === "EField" ? (({ span: sp }) => sp)(_v) : _v._tag === "ETuple" ? (({ span: sp }) => sp)(_v) : _v._tag === "EArr" ? (({ span: sp }) => sp)(_v) : _v._tag === "EList" ? (({ span: sp }) => sp)(_v) : _v._tag === "ESet" ? (({ span: sp }) => sp)(_v) : _v._tag === "EMap" ? (({ span: sp }) => sp)(_v) : _v._tag === "EInterp" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e);
var makeJsxCall = _curry7(7, (tagExpr, fields, spreadOpt, children, startTok, toks, endPos) => {
  const fullSpan = jxToEnd(jxSpanOf(startTok), toks, endPos);
  const pragmaRef = ERef("h", jxSpanOf(startTok));
  const propsRecord = ERecord(fields, spreadOpt, fullSpan);
  const childrenArr = EArr(children, fullSpan);
  return ECall(pragmaRef, [tagExpr, propsRecord, childrenArr], Some6("jsx"), fullSpan);
});
var parseJsxAttributes = _curry7(5, (toks, pos, fieldsAcc, spreadAcc, parseExpr) => {
  const tk = jxTokAt(toks, pos).tok;
  const nxt = jxTokAt(toks, pos + 1).tok;
  return or5(tk._tag === "TGt", and5(tk._tag === "TSlash", nxt._tag === "TGt")) ? Ok3(_tuple3(fieldsAcc, spreadAcc, pos)) : tk._tag === "TLbrace" ? _Result_flatMap2((p1) => _Result_flatMap2(([spExpr, p2]) => _Result_flatMap2((p3) => parseJsxAttributes(toks, p3, fieldsAcc, Some6(spExpr), parseExpr), jxExpectTok(TRbrace, toks, p2)), parseExpr(toks, p1)), jxExpectTok(TSpread, toks, pos + 1)) : _Result_flatMap2(([attrId, p1]) => (([valExpr, p2]) => {
    const field = { name: attrId.name, nameSpan: attrId.span, value: valExpr };
    return parseJsxAttributes(toks, p2, _Array_append5(field, fieldsAcc), spreadAcc, parseExpr);
  })(jxTokAt(toks, p1).tok._tag === "TEq" ? ((pEq) => ((_v) => _v._tag === "TStr" ? (({ value: v }) => _tuple3(EStr(v, jxSpanOf(jxTokAt(toks, pEq))), pEq + 1))(_v) : _v._tag === "TLbrace" ? ((_v) => _v._tag === "Ok" ? (({ value: [e, pR] }) => _tuple3(e, pR + 1))(_v) : _v._tag === "Err" ? _tuple3(EBool(true, attrId.span), pEq) : (() => {
    throw new Error("non-exhaustive match");
  })())(parseExpr(toks, pEq + 1)) : _tuple3(EBool(true, attrId.span), pEq))(jxTokAt(toks, pEq).tok))(p1 + 1) : _tuple3(EBool(true, attrId.span), p1)), jxExpectAttrName(toks, pos));
});
var parseJsxChildren = _curry7(5, (expectedTag, toks, pos, acc, parseExpr) => {
  const lt = jxTokAt(toks, pos);
  const nxt = jxTokAt(toks, pos + 1);
  return lt.tok._tag === "TEof" ? jxErrAt(expectedTag === "" ? "unclosed JSX fragment" : "unclosed JSX tag", lt) : and5(lt.tok._tag === "TLt", nxt.tok._tag === "TSlash") ? expectedTag === "" ? _Result_flatMap2((p1) => Ok3(_tuple3(acc, p1)), jxExpectTok(TGt, toks, pos + 2)) : _Result_flatMap2(([closingId, p1]) => _Result_flatMap2((p2) => eq4(closingId.name, expectedTag) ? Ok3(_tuple3(acc, p2)) : jxErrAt("mismatched JSX closing tag", lt), jxExpectTok(TGt, toks, p1)), jxExpectId(toks, pos + 2)) : lt.tok._tag === "TLt" ? _Result_flatMap2(([childJsx, p1]) => parseJsxChildren(expectedTag, toks, p1, _Array_append5(SEExpr(childJsx), acc), parseExpr), parseJsx(toks, pos, parseExpr)) : lt.tok._tag === "TLbrace" ? nxt.tok._tag === "TSpread" ? _Result_flatMap2(([spChild, p1]) => _Result_flatMap2((p2) => parseJsxChildren(expectedTag, toks, p2, _Array_append5(SESpread(spChild), acc), parseExpr), jxExpectTok(TRbrace, toks, p1)), parseExpr(toks, pos + 2)) : _Result_flatMap2(([childExpr, p1]) => _Result_flatMap2((p2) => parseJsxChildren(expectedTag, toks, p2, _Array_append5(SEExpr(childExpr), acc), parseExpr), jxExpectTok(TRbrace, toks, p1)), parseExpr(toks, pos + 1)) : ((_v) => _v._tag === "TStr" ? (({ value: v }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append5(SEExpr(EStr(v, jxSpanOf(lt))), acc), parseExpr))(_v) : _v._tag === "TNum" ? (({ value: v, raw }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append5(SEExpr(ENum(v, raw, jxSpanOf(lt))), acc), parseExpr))(_v) : _v._tag === "TBool" ? (({ value: v }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append5(SEExpr(EBool(v, jxSpanOf(lt))), acc), parseExpr))(_v) : _v._tag === "TId" ? (({ value: v }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append5(SEExpr(EStr(v, jxSpanOf(lt))), acc), parseExpr))(_v) : jxErrAt("unexpected token in JSX children", lt))(lt.tok);
});
var parseJsx = _curry7(3, (toks, pos, parseExpr) => {
  const startTok = jxTokAt(toks, pos);
  const nxt = jxTokAt(toks, pos + 1);
  return nxt.tok._tag === "TGt" ? _Result_flatMap2(([children, p1]) => Ok3(_tuple3(makeJsxCall(EStr("Fragment", jxSpanOf(startTok)), [], None6, children, startTok, toks, p1), p1)), parseJsxChildren("", toks, pos + 2, [], parseExpr)) : _Result_flatMap2(([firstId, p1]) => ((tagRef) => ((tagNameStr) => _Result_flatMap2(([fields, spreadOpt, p2]) => {
    const isSelfClosing = jxTokAt(toks, p2).tok._tag === "TSlash";
    return _Result_flatMap2((p3) => isSelfClosing ? Ok3(_tuple3(makeJsxCall(tagRef, fields, spreadOpt, [], startTok, toks, p3), p3)) : _Result_flatMap2(([children, p4]) => Ok3(_tuple3(makeJsxCall(tagRef, fields, spreadOpt, children, startTok, toks, p4), p4)), parseJsxChildren(tagNameStr, toks, p3, [], parseExpr)), isSelfClosing ? jxExpectTok(TGt, toks, p2 + 1) : jxExpectTok(TGt, toks, p2));
  }, parseJsxAttributes(toks, p1, [], None6, parseExpr)))(firstId.name))(jxIsUpper(firstId.name) ? ERef(firstId.name, firstId.span) : EStr(firstId.name, firstId.span)), jxExpectId(toks, pos + 1));
});
var parseJsxAtom = _curry7(3, (toks, pos, parseExpr) => jxTokAt(toks, pos).tok._tag === "TLt" ? _Result_map2((claim) => Some6(claim), parseJsx(toks, pos, parseExpr)) : Ok3(None6));
var seqElemExpr = (el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el);
var inferJsxArrElems = _curry7(3, (elements, st, inferExpr) => ((_v) => _v.length === 0 ? Ok3(st) : _v.length >= 1 ? (([el, ...rest]) => _Result_flatMap2(([_, st1]) => inferJsxArrElems(rest, st1, inferExpr), inferExpr(seqElemExpr(el), st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elements));
var inferJsxChildren = _curry7(3, (children, st, inferExpr) => ((_v) => _v.length === 0 ? Ok3(st) : _v.length >= 1 && _v[0]._tag === "EArr" ? (([{ elements }, ...rest]) => _Result_flatMap2((st1) => inferJsxChildren(rest, st1, inferExpr), inferJsxArrElems(elements, st, inferExpr)))(_v) : _v.length >= 1 ? (([child, ...rest]) => _Result_flatMap2(([_, st1]) => inferJsxChildren(rest, st1, inferExpr), inferExpr(child, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(children));
var rowField = _curry7(2, (row, label) => ((_v) => _v._tag === "RowExtend" ? (({ label: l, fieldType, rest }) => eq4(l, label) ? Some6(fieldType) : rowField(rest, label))(_v) : _v._tag === "RowEmpty" ? None6 : _v._tag === "RowVar" ? None6 : (() => {
  throw new Error("non-exhaustive match");
})())(row));
var fieldNamed = _curry7(2, (label, fields) => match(fields).with((_v) => _v.length === 0, () => false).with((_v) => _v.length >= 1, ([f, ...rest]) => or5(eq4(f.name, label), fieldNamed(label, rest))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var recordHasAttr = _curry7(2, (expr, label) => ((_v) => _v._tag === "ERecord" ? (({ fields }) => fieldNamed(label, fields))(_v) : false)(expr));
var jsxChildCount = (restArgs) => ((_v) => _v.length >= 1 && _v[0]._tag === "EArr" ? (([{ elements }]) => length4(elements))(_v) : 0)(restArgs);
var jsxPropsWithSynthesizedChildren = _curry7(4, (propsT, propsExpr, expectedRow, restArgs) => ((_v) => _v._tag === "None" ? propsT : _v._tag === "Some" ? (({ value: expectedChildren }) => ((_v) => _v._tag === "TyRecord" ? (({ row: prow }) => or5(recordHasAttr(propsExpr, "children"), jsxChildCount(restArgs) === 0) ? propsT : tRecord(rExtend("children", expectedChildren, prow)))(_v) : propsT)(propsT))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(rowField(expectedRow, "children")));
var attrKindType = (kind) => kind === "string" ? Some6(tPrim("string")) : kind === "number" ? Some6(tPrim("number")) : kind === "bool" ? Some6(tPrim("bool")) : kind === "string|number" ? Some6(tUnion([tPrim("string"), tPrim("number")])) : kind === "string|bool" ? Some6(tUnion([tPrim("string"), tPrim("bool")])) : _Str_startsWith2("enum:", kind) ? Some6(tUnion(map2(tLit, _Str_split2(",", _Str_slice2(5, _Str_length4(kind), kind))))) : None6;
var mismatchHint = (name) => ((_v) => _v === "class" ? Some6("In JSX, use 'className' instead of 'class'.") : _v === "for" ? Some6("In JSX, use 'htmlFor' instead of 'for'.") : _v === "tabindex" ? Some6("In JSX, use 'tabIndex' instead of 'tabindex'.") : _v === "autofocus" ? Some6("In JSX, use 'autoFocus' instead of 'autofocus'.") : _v === "autocomplete" ? Some6("In JSX, use 'autoComplete' instead of 'autocomplete'.") : _v === "readonly" ? Some6("In JSX, use 'readOnly' instead of 'readonly'.") : _v === "maxlength" ? Some6("In JSX, use 'maxLength' instead of 'maxlength'.") : _v === "minlength" ? Some6("In JSX, use 'minLength' instead of 'minlength'.") : _v === "spellcheck" ? Some6("In JSX, use 'spellCheck' instead of 'spellcheck'.") : _v === "contenteditable" ? Some6("In JSX, use 'contentEditable' instead of 'contenteditable'.") : _v === "viewbox" ? Some6("In JSX, use 'viewBox' instead of 'viewbox'.") : _v === "strokewidth" ? Some6("In JSX, use 'strokeWidth' instead of 'strokewidth'.") : _v === "strokelinecap" ? Some6("In JSX, use 'strokeLinecap' instead of 'strokelinecap'.") : _v === "strokelinejoin" ? Some6("In JSX, use 'strokeLinejoin' instead of 'strokelinejoin'.") : _v === "onclick" ? Some6("In JSX, event handlers are camelCase: use 'onClick' instead of 'onclick'.") : _v === "onchange" ? Some6("In JSX, event handlers are camelCase: use 'onChange' instead of 'onchange'.") : _v === "oninput" ? Some6("In JSX, event handlers are camelCase: use 'onInput' instead of 'oninput'.") : _v === "onkeydown" ? Some6("In JSX, event handlers are camelCase: use 'onKeyDown' instead of 'onkeydown'.") : _v === "onkeyup" ? Some6("In JSX, event handlers are camelCase: use 'onKeyUp' instead of 'onkeyup'.") : _v === "onsubmit" ? Some6("In JSX, event handlers are camelCase: use 'onSubmit' instead of 'onsubmit'.") : _v === "onfocus" ? Some6("In JSX, event handlers are camelCase: use 'onFocus' instead of 'onfocus'.") : _v === "onblur" ? Some6("In JSX, event handlers are camelCase: use 'onBlur' instead of 'onblur'.") : None6)(name);
var noJxSuggestions = [];
var jxTypeErr = _curry7(2, (message, sp) => Err3({ message, start: sp.start, end: sp.end, help: None6, suggestions: noJxSuggestions }));
var isHandlerName = (name) => and5(and5(_Str_startsWith2("on", name), _Str_length4(name) > 2), jxIsUpper(_Str_slice2(2, 3, name)));
var isFnOrOpen = (t) => ((_v) => _v._tag === "TyFn" ? true : _v._tag === "TyVar" ? true : _v._tag === "TyCon" ? (({ name }) => name === "any")(_v) : false)(t);
var checkHandler = _curry7(5, (name, value, st, api, cont) => _Result_flatMap2(([valT, st1]) => isFnOrOpen(zonk(valT, st1)) ? cont(st1) : jxTypeErr(`Expected function for event handler '${name}'`, jxExprSpan(value)), api.inferExpr(value, st)));
var unknownProp = _curry7(4, (tag, name, value, schema) => {
  const hint = closestName(name, _Map_keys2(schema));
  const did = ((_v) => _v._tag === "Some" ? (({ value: s }) => ` Did you mean '${s}'?`)(_v) : _v._tag === "None" ? "" : (() => {
    throw new Error("non-exhaustive match");
  })())(hint);
  return jxTypeErr(`Property '${name}' does not exist on '<${tag}>'.${did}`, jxExprSpan(value));
});
var noteProp = _curry7(3, (f, t, st) => recordBinder(f.nameSpan, t, "property", f.name, None6, st));
var handlerType = TyFn(tPrim("Event"), tPrim("unit"));
var inferIntrinsicFields = _curry7(5, (tag, fields, st, api, schema) => ((_v) => _v.length === 0 ? Ok3(st) : _v.length >= 1 ? (([f, ...rest]) => ((cont) => ((_v) => _v._tag === "Some" ? (({ value: msg }) => jxTypeErr(msg, jxExprSpan(f.value)))(_v) : _v._tag === "None" ? or5(_Str_startsWith2("data-", f.name), _Str_startsWith2("aria-", f.name)) ? _Result_flatMap2(([valT, st1]) => cont(noteProp(f, valT, st1)), api.inferExpr(f.value, st)) : ((_v) => _v._tag === "None" ? _Result_flatMap2(([valT, st1]) => cont(noteProp(f, valT, st1)), api.inferExpr(f.value, st)) : _v._tag === "Some" ? (({ value: m }) => ((expected) => ((_v) => _v._tag === "None" ? unknownProp(tag, f.name, f.value, m) : _v._tag === "Some" ? (({ value: kind }) => kind === "event" ? checkHandler(f.name, f.value, st, api, (st1) => cont(noteProp(f, handlerType, st1))) : kind === "any" ? _Result_flatMap2(([_, st1]) => cont(noteProp(f, tPrim("any"), st1)), api.inferExpr(f.value, st)) : ((_v) => _v._tag === "Some" ? (({ value: expectedT }) => _Result_flatMap2(([valT, st1]) => _Result_flatMap2((st2) => cont(noteProp(f, expectedT, st2)), api.unify(valT, expectedT, st1, jxExprSpan(f.value))), api.inferExpr(f.value, st)))(_v) : _v._tag === "None" ? _Result_flatMap2(([_, st1]) => cont(st1), api.inferExpr(f.value, st)) : (() => {
  throw new Error("non-exhaustive match");
})())(attrKindType(kind)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(expected))(((_v) => _v._tag === "Some" ? (({ value: k }) => Some6(k))(_v) : _v._tag === "None" ? isHandlerName(f.name) ? Some6("event") : None6 : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get2(f.name, m))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(schema) : (() => {
  throw new Error("non-exhaustive match");
})())(mismatchHint(f.name)))((st1) => inferIntrinsicFields(tag, rest, st1, api, schema)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields));
var inferFragmentFields = _curry7(3, (fields, st, api) => match(fields).with((_v) => _v.length === 0, () => Ok3(st)).with((_v) => _v.length >= 1, ([f, ...rest]) => f.name === "key" ? _Result_flatMap2(([_, st1]) => inferFragmentFields(rest, st1, api), api.inferExpr(f.value, st)) : jxTypeErr(`JSX fragments only accept the 'key' prop, got '${f.name}'`, jxExprSpan(f.value))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var unknownTagErr = _curry7(2, (tagName, sp) => {
  const hint = closestName(tagName, _Map_keys2(intrinsicElements));
  const did = ((_v) => _v._tag === "Some" ? (({ value: s }) => ` Did you mean '<${s}>'?`)(_v) : _v._tag === "None" ? "" : (() => {
    throw new Error("non-exhaustive match");
  })())(hint);
  return jxTypeErr(`Unknown JSX element '<${tagName}>'.${did}`, sp);
});
var inferStringTag = _curry7(5, (tagName, tagExpr, fields, st, api) => tagName === "Fragment" ? inferFragmentFields(fields, st, api) : ((_v) => _v._tag === "Some" ? (({ value: schema }) => inferIntrinsicFields(tagName, fields, st, api, Some6(schema)))(_v) : _v._tag === "None" ? _Str_contains("-", tagName) ? inferIntrinsicFields(tagName, fields, st, api, None6) : unknownTagErr(tagName, jxExprSpan(tagExpr)) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get2(tagName, intrinsicElements)));
var noteComponentProps = _curry7(3, (propsExpr, expectedRow, st) => ((_v) => _v._tag === "ERecord" ? (({ fields }) => reduce(_curry7(2, (acc, f) => ((_v) => _v._tag === "Some" ? (({ value: t }) => noteProp(f, zonk(t, acc), acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(rowField(expectedRow, f.name))), st, fields))(_v) : st)(propsExpr));
var inferJsxCall = _curry7(5, (tagExpr, propsExpr, restArgs, st, api) => _Result_flatMap2(([tagT, st1]) => _Result_flatMap2(([propsT, st2]) => _Result_flatMap2((st3) => {
  const zonkedTag = zonk(tagT, st3);
  return ((_v) => _v._tag === "TyFn" ? (({ from, to }) => ((_v) => _v._tag === "TyRecord" ? (({ row: expectedRow }) => ((propsForCheck) => _Result_map2((st4) => _tuple3(zonk(to, st4), noteComponentProps(propsExpr, expectedRow, st4)), api.unify(propsForCheck, from, st3, jxExprSpan(propsExpr))))(jsxPropsWithSynthesizedChildren(propsT, propsExpr, expectedRow, restArgs)))(_v) : Ok3(_tuple3(tPrim("VNode"), st3)))(from))(_v) : ((_v) => _v._tag === "EStr" ? (({ value: tagName }) => ((_v) => _v._tag === "ERecord" ? (({ fields }) => _Result_map2((st4) => _tuple3(tPrim("VNode"), st4), inferStringTag(tagName, tagExpr, fields, st3, api)))(_v) : Ok3(_tuple3(tPrim("VNode"), st3)))(propsExpr))(_v) : Ok3(_tuple3(tPrim("VNode"), st3)))(tagExpr))(zonkedTag);
}, inferJsxChildren(restArgs, st2, api.inferExpr)), api.inferExpr(propsExpr, st1)), api.inferExpr(tagExpr, st)));
var inferJsxCallHook = _curry7(5, (_fn, args, origin, st, api) => ((_v) => _v._tag === "Some" ? (({ value: o }) => o === "jsx" ? ((_v) => _v.length >= 2 ? (([tagExpr, propsExpr, ...rest]) => _Result_map2((r) => Some6(r), inferJsxCall(tagExpr, propsExpr, rest, st, api)))(_v) : Ok3(None6))(args) : Ok3(None6))(_v) : _v._tag === "None" ? Ok3(None6) : (() => {
  throw new Error("non-exhaustive match");
})())(origin));
var returnsVNode = (t) => ((_v) => _v._tag === "TyFn" ? (({ to: toT }) => returnsVNode(toT))(_v) : _v._tag === "TyCon" && _v.name === "VNode" ? true : false)(t);
var isComponentType = (t) => ((_v) => _v._tag === "TyFn" ? (({ to: toT }) => returnsVNode(toT))(_v) : false)(t);
var jsxBodied = (body) => ((_v) => _v._tag === "ELambda" ? (({ body: inner }) => jsxBodied(inner))(_v) : _v._tag === "ECall" && _v.origin._tag === "Some" && _v.origin.value === "jsx" ? true : false)(body);
var isJsxComponentLambda = (value) => ((_v) => _v._tag === "ELambda" ? (({ body }) => jsxBodied(body))(_v) : false)(value);
var isHandlerLabel = (label) => {
  const third = _Option_exists2((n) => and5(n >= 65, n <= 90), _Str_codeAt3(2, label));
  return and5(_Str_startsWith2("on", label), third);
};
var componentPropFieldTs = _curry7(3, (label, t, api) => ((_v) => _v._tag === "TyVar" ? isHandlerLabel(label) ? "() => void" : "unknown" : _v._tag === "TyCon" && _v.name === "VNode" ? "unknown" : api.tsType(t))(t));
var propFieldsFrom = _curry7(3, (row, api, acc) => ((_v) => _v._tag === "RowExtend" ? (({ label, fieldType, rest }) => propFieldsFrom(rest, api, _Array_append5(`${label}: ${componentPropFieldTs(label, fieldType, api)}`, acc)))(_v) : _v._tag === "RowVar" ? _tuple3(acc, true) : _tuple3(acc, false))(row));
var hasField = _curry7(2, (fields, name) => _Option_isSome(_Array_find((f) => _Str_startsWith2(`${name}:`, f), fields)));
var componentPropsTs = _curry7(2, (row, api) => (([fields0, open]) => {
  const fields1 = and5(open, !hasField(fields0, "children")) ? _Array_append5("children?: any", fields0) : fields0;
  const fields = and5(open, !hasField(fields1, "className")) ? _Array_append5("className?: string", fields1) : fields1;
  return length4(fields) === 0 ? "{}" : `{ ${_Str_join3("; ", fields)} }`;
})(propFieldsFrom(row, api, [])));
var componentPropsParamTs = _curry7(2, (t, api) => ((_v) => _v._tag === "TyRecord" ? (({ row }) => ((_v) => _v._tag === "Some" ? (({ value: name }) => name)(_v) : _v._tag === "None" ? componentPropsTs(row, api) : (() => {
  throw new Error("non-exhaustive match");
})())(api.aliasOf(row)))(_v) : _v._tag === "TyVar" ? "Record<string, unknown>" : api.tsType(t))(t));
var extraParamTs = _curry7(2, (t, api) => ((_v) => _v._tag === "TyVar" ? "unknown" : _v._tag === "TyCon" && _v.name === "VNode" ? "any" : api.tsType(t))(t));
var extraParamsFrom = _curry7(4, (t, api, i, acc) => ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => extraParamsFrom(toT, api, i + 1, _Array_append5(`_${show2(i)}: ${extraParamTs(fromT, api)}`, acc)))(_v) : acc)(t));
var componentSig = _curry7(2, (t, api) => ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => ((props) => ((extras) => length4(extras) === 0 ? `(${props}) => any` : `_Curry<[${_Str_join3(", ", _Array_concat3([props], extras))}], any>`)(extraParamsFrom(toT, api, 1, [])))(`props: ${componentPropsParamTs(fromT, api)}`))(_v) : "(props: Record<string, unknown>) => any")(t));
var componentBindingTs = _curry7(3, (value, t, api) => ((_v) => _v._tag === "TyCon" && _v.name === "VNode" && _v.args.length === 0 ? Some6("any") : or5(isComponentType(t), isJsxComponentLambda(value)) ? Some6(componentSig(t, api)) : None6)(t));
var jsxShape = (e) => ((_v) => _v._tag === "ECall" && _v.fn._tag === "ERef" && _v.fn.name === "h" && _v.args.length === 3 && _v.args[1]._tag === "ERecord" && _v.args[2]._tag === "EArr" && _v.origin._tag === "Some" && _v.origin.value === "jsx" ? (({ args: [tag, { fields, spread }, { elements: children }] }) => Some6({ tag, fields, spread, children }))(_v) : None6)(e);
var isFragment = (tag) => ((_v) => _v._tag === "EStr" && _v.value === "Fragment" ? true : false)(tag);
var jsxTag = _curry7(2, (tag, api) => ((_v) => _v._tag === "EStr" ? (({ value }) => value)(_v) : api.flat(api.memberD(tag)))(tag));
var jsxHoleD = _curry7(3, (open, e, api) => cat([txt(open), api.exprD(e), txt("}")]));
var jsxAttrD = _curry7(3, (name, value, api) => ((_v) => _v._tag === "EBool" && _v.value === true ? (({ span: sp }) => eq4(api.sourceText(sp.start, sp.end), name) ? txt(name) : jsxHoleD(`${name}={`, value, api))(_v) : _v._tag === "EStr" ? (({ value: v }) => txt(`${name}=${api.strLit(v)}`))(_v) : jsxHoleD(`${name}={`, value, api))(value));
var jsxOpenD = _curry7(3, (tag, attrs, selfClosing) => length4(attrs) === 0 ? txt(selfClosing ? `<${tag} />` : `<${tag}>`) : group(cat([txt(`<${tag}`), indent(cat(map2((attr) => cat([line, attr]), attrs))), selfClosing ? line : softline, txt(selfClosing ? "/>" : ">")])));
var jsxChildD = _curry7(2, (child, api) => ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => _Option_isSome(jsxShape(e)) ? api.exprD(e) : jsxHoleD("{", e, api))(_v) : _v._tag === "SESpread" ? (({ expr: e }) => jsxHoleD("{...", e, api))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(child));
var jsxAttrsD = _curry7(2, (shape, api) => {
  const spreadD = ((_v) => _v._tag === "Some" ? (({ value: sp }) => [jsxHoleD("{...", sp, api)])(_v) : _v._tag === "None" ? [] : (() => {
    throw new Error("non-exhaustive match");
  })())(shape.spread);
  return _Array_concat3(spreadD, map2((f) => jsxAttrD(f.name, f.value, api), shape.fields));
});
var formatJsx = _curry7(2, (e, api) => ((_v) => _v._tag === "None" ? None6 : _v._tag === "Some" ? (({ value: shape }) => ((fragment) => ((tag) => ((attrs) => and5(length4(shape.children) === 0, !fragment) ? Some6(jsxOpenD(tag, attrs, true)) : Some6(group(cat([fragment ? txt("<>") : jsxOpenD(tag, attrs, false), indent(cat(map2((child) => cat([softline, jsxChildD(child, api)]), shape.children))), softline, txt(fragment ? "</>" : `</${tag}>`)]))))(jsxAttrsD(shape, api)))(fragment ? "" : jsxTag(shape.tag, api)))(isFragment(shape.tag)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(jsxShape(e)));
var jsxPlugin = { name: "jsx", parse: Some6(parseJsxAtom), inferCall: Some6(inferJsxCallHook), format: None6, formatDoc: Some6(formatJsx), dtsBinding: None6, bindingType: Some6(componentBindingTs) };

import { Err as Err5, None as None9, Ok as Ok5, Some as Some9, _Array_get as _Array_get8, _Result_flatMap as _Result_flatMap4, _Result_map as _Result_map4, _curry as _curry10, _tuple as _tuple5, and as and7, eq as eq7, length as length7 } from "@mochi/compiler/runtime";
import { match as match4 } from "@onrails/pattern";

import { None as None8, Some as Some8, _Array_append as _Array_append6, _Array_contains, _Array_find as _Array_find2, _Array_get as _Array_get7, _Array_prepend as _Array_prepend3, _Map_get as _Map_get3, _Map_getOr as _Map_getOr2, _Map_has as _Map_has2, _Map_keys as _Map_keys3, _Map_set as _Map_set3, _Map_values as _Map_values2, _Option_flatMap, _Option_unwrapOr as _Option_unwrapOr5, _Set_add, _Set_diff, _Set_fromArray, _Set_has, _Set_size, _Set_toArray, _Str_codeAt as _Str_codeAt4, _Str_split as _Str_split3, _curry as _curry9, _tuple as _tuple4, and as and6, eq as eq6, filter as filter2, length as length6, map as map4, reduce as reduce2 } from "@mochi/compiler/runtime";
import { match as match3 } from "@onrails/pattern";

import { Err as Err4, Ok as Ok4, Some as Some7, _Array_get as _Array_get6, _Array_prepend as _Array_prepend2, _Map_has, _Map_set as _Map_set2, _Option_unwrapOr as _Option_unwrapOr4, _Result_flatMap as _Result_flatMap3, _Result_map as _Result_map3, _curry as _curry8, _done as _done4, _recur as _recur4, eq as eq5, filter, length as length5, map as map3, show as show3 } from "@mochi/compiler/runtime";
import { match as match2 } from "@onrails/pattern";
var emptyRegistry = { ctors: new Map, types: new Map };
var primTypeNames = ["number", "int", "float", "string", "bool", "unit"];
var keysOfFrom = _curry8(2, (fields, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: f }) => _Array_prepend2(_Option_unwrapOr4(`_${show3(i)}`, f.name), keysOfFrom(fields, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get6(i, fields)));
var keysOf = (fields) => keysOfFrom(fields, 0);
var builtinSpan = { start: 0, end: 0 };
var builtinTypeDecls = [{ name: "Option", params: ["a"], ctors: [{ name: "Some", fields: [{ name: Some7("value"), fieldType: TyName("a", builtinSpan) }], span: builtinSpan }, { name: "None", fields: [], span: builtinSpan }] }, { name: "Result", params: ["a", "e"], ctors: [{ name: "Ok", fields: [{ name: Some7("value"), fieldType: TyName("a", builtinSpan) }], span: builtinSpan }, { name: "Err", fields: [{ name: Some7("error"), fieldType: TyName("e", builtinSpan) }], span: builtinSpan }] }];
var declaresType = _curry8(3, (stmts, i, name) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { name: n } }) => eq5(n, name) ? true : declaresType(stmts, i + 1, name))(_v) : _v._tag === "Some" ? declaresType(stmts, i + 1, name) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get6(i, stmts)));
var builtinDeclsFor = (stmts) => filter((bt) => !declaresType(stmts, 0, bt.name), builtinTypeDecls);
var seedRegCtorsFrom = _curry8(4, (ctors, i, owner, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: c }) => seedRegCtorsFrom(ctors, i + 1, owner, _Map_has(c.name, acc) ? acc : _Map_set2(c.name, { owner, arity: length5(c.fields) }, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get6(i, ctors)));
var seedRegDeclsFrom = _curry8(3, (decls, i, reg) => ((_v) => _v._tag === "None" ? reg : _v._tag === "Some" ? (({ value: bt }) => seedRegDeclsFrom(decls, i + 1, { ctors: seedRegCtorsFrom(bt.ctors, 0, bt.name, reg.ctors), types: _Map_set2(bt.name, map3((c) => c.name, bt.ctors), reg.types) }))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get6(i, decls)));
var ctorErr = _curry8(2, (message, sp) => ({ message, start: sp.start, end: sp.end }));
var ctorsInto = _curry8(5, (ctors, i, owner, sp, acc) => ((_v) => _v._tag === "None" ? Ok4(acc) : _v._tag === "Some" ? (({ value: c }) => _Map_has(c.name, acc) ? Err4(ctorErr(`duplicate constructor '${c.name}'`, sp)) : ctorsInto(ctors, i + 1, owner, sp, _Map_set2(c.name, { owner, arity: length5(c.fields) }, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get6(i, ctors)));
var buildLoop = _curry8(3, (stmts, i, reg) => ((_v) => _v._tag === "None" ? Ok4(reg) : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { name, ctors, span: sp } }) => _Map_has(name, reg.types) ? Err4(ctorErr(`duplicate type '${name}'`, sp)) : _Result_flatMap3((cs) => buildLoop(stmts, i + 1, { ctors: cs, types: _Map_set2(name, map3((c) => c.name, ctors), reg.types) }), ctorsInto(ctors, 0, name, sp, reg.ctors)))(_v) : _v._tag === "Some" ? buildLoop(stmts, i + 1, reg) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get6(i, stmts)));
var buildRegistry = (stmts) => _Result_map3((reg) => seedRegDeclsFrom(builtinDeclsFor(stmts), 0, reg), buildLoop(stmts, 0, emptyRegistry));
var exportedRegLoop = _curry8(3, (stmts, i0, reg0) => {
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
});
var ctorKeysInto = _curry8(3, (ctors, i, m) => match2(_Array_get6(i, ctors)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { name, fields } }) => ctorKeysInto(ctors, i + 1, _Map_set2(name, keysOf(fields), m))).exhaustive());
var ctorKeysFrom = _curry8(3, (stmts, i, m) => ((_v) => _v._tag === "None" ? m : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { ctors } }) => ctorKeysFrom(stmts, i + 1, ctorKeysInto(ctors, 0, m)))(_v) : _v._tag === "Some" ? ctorKeysFrom(stmts, i + 1, m) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get6(i, stmts)));
var ctorKeysFromStmts = _curry8(2, (stmts, m) => ctorKeysFrom(stmts, 0, m));
var seedKeyCtorsFrom = _curry8(3, (ctors, i, m) => match2(_Array_get6(i, ctors)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { name, fields } }) => seedKeyCtorsFrom(ctors, i + 1, _Map_has(name, m) ? m : _Map_set2(name, keysOf(fields), m))).exhaustive());
var seedKeyDeclsFrom = _curry8(3, (decls, i, m) => match2(_Array_get6(i, decls)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { ctors } }) => seedKeyDeclsFrom(decls, i + 1, seedKeyCtorsFrom(ctors, 0, m))).exhaustive());
var seedBuiltinCtorKeys = _curry8(2, (stmts, m) => seedKeyDeclsFrom(builtinDeclsFor(stmts), 0, m));
var exportedCtorKeysFrom = _curry8(3, (stmts, i, m) => ((_v) => _v._tag === "None" ? m : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true ? (({ value: { ctors } }) => exportedCtorKeysFrom(stmts, i + 1, ctorKeysInto(ctors, 0, m)))(_v) : _v._tag === "Some" ? exportedCtorKeysFrom(stmts, i + 1, m) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get6(i, stmts)));

var mono = (t) => ({ vars: [], rvars: [], ty: t });
var tNumber = tPrim("number");
var tBool = tPrim("bool");
var tString = tPrim("string");
var primType = (name) => ((_v) => _v === "float" ? tNumber : _v === "int" ? tNumber : _v === "string" ? tString : _v === "bool" ? tBool : tPrim(name))(name);
var emptyVarSets = { tv: _Set_fromArray([]), rv: _Set_fromArray([]) };
var diffVarSets = _curry9(2, (a, b) => ({ tv: _Set_diff(a.tv, b.tv), rv: _Set_diff(a.rv, b.rv) }));
var collect = _curry9(2, (t, acc) => ((_v) => _v._tag === "TyVar" ? (({ id }) => ({ tv: _Set_add(id, acc.tv), rv: acc.rv }))(_v) : _v._tag === "TyCon" ? (({ args }) => collectArgs(args, acc))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => collect(toT, collect(fromT, acc)))(_v) : _v._tag === "TyRecord" ? (({ row }) => collectRow(row, acc))(_v) : _v._tag === "TySingleton" ? acc : _v._tag === "TyOneOf" ? (({ members }) => collectArgs(members, acc))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(t));
var collectArgs = _curry9(2, (args, acc) => collectArgsFrom(args, 0, acc));
var collectArgsFrom = _curry9(3, (args, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: a }) => collectArgsFrom(args, i + 1, collect(a, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get7(i, args)));
var collectRow = _curry9(2, (row, acc) => ((_v) => _v._tag === "RowVar" ? (({ id }) => ({ tv: acc.tv, rv: _Set_add(id, acc.rv) }))(_v) : _v._tag === "RowExtend" ? (({ fieldType, rest }) => collectRow(rest, collect(fieldType, acc)))(_v) : _v._tag === "RowEmpty" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(row));
var freeInType = (t) => collect(t, emptyVarSets);
var collectFree = _curry9(4, (t, bound, st, acc) => ((_v) => _v._tag === "TyVar" ? (({ id }) => _Set_has(id, bound.tv) ? acc : ((_v) => _v._tag === "Some" ? (({ value: next }) => collectFree(next, bound, st, acc))(_v) : _v._tag === "None" ? { tv: _Set_add(id, acc.tv), rv: acc.rv } : (() => {
  throw new Error("non-exhaustive match");
})())(idGet(id, st.tv)))(_v) : _v._tag === "TyCon" ? (({ args }) => collectFreeArgs(args, bound, st, acc))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => collectFree(toT, bound, st, collectFree(fromT, bound, st, acc)))(_v) : _v._tag === "TyRecord" ? (({ row }) => collectFreeRow(row, bound, st, acc))(_v) : _v._tag === "TySingleton" ? acc : _v._tag === "TyOneOf" ? (({ members }) => collectFreeArgs(members, bound, st, acc))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(t));
var collectFreeArgs = _curry9(4, (args, bound, st, acc) => collectFreeArgsFrom(args, 0, bound, st, acc));
var collectFreeArgsFrom = _curry9(5, (args, i, bound, st, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: a }) => collectFreeArgsFrom(args, i + 1, bound, st, collectFree(a, bound, st, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get7(i, args)));
var collectFreeRow = _curry9(4, (row, bound, st, acc) => ((_v) => _v._tag === "RowVar" ? (({ id }) => _Set_has(id, bound.rv) ? acc : ((_v) => _v._tag === "Some" ? (({ value: next }) => collectFreeRow(next, bound, st, acc))(_v) : _v._tag === "None" ? { tv: acc.tv, rv: _Set_add(id, acc.rv) } : (() => {
  throw new Error("non-exhaustive match");
})())(idGet(id, st.rv)))(_v) : _v._tag === "RowExtend" ? (({ fieldType, rest }) => collectFreeRow(rest, bound, st, collectFree(fieldType, bound, st, acc)))(_v) : _v._tag === "RowEmpty" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(row));
var freeInScheme = _curry9(3, (sc, st, acc) => collectFree(sc.ty, { tv: _Set_fromArray(sc.vars), rv: _Set_fromArray(sc.rvars) }, st, acc));
var freeInEnvFrom = _curry9(4, (schemes, i, st, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: sc }) => freeInEnvFrom(schemes, i + 1, st, freeInScheme(sc, st, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get7(i, schemes)));
var freeInEnv = _curry9(2, (env, st) => freeInEnvFrom(_Map_values2(env), 0, st, emptyVarSets));
var freeInNamedFrom = _curry9(5, (names, i, env, st, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: n }) => freeInNamedFrom(names, i + 1, env, st, ((_v) => _v._tag === "Some" ? (({ value: sc }) => freeInScheme(sc, st, acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get3(n, env))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get7(i, names)));
var generalizeAgainst = _curry9(4, (envFree, t, st, widen) => {
  const zt = widen ? widenLits(zonk(t, st)) : zonk(t, st);
  const own = freeInType(zt);
  const free = and6(_Set_size(own.tv) === 0, _Set_size(own.rv) === 0) ? own : diffVarSets(own, envFree());
  return { vars: _Set_toArray(free.tv), rvars: _Set_toArray(free.rv), ty: zt };
});
var generalize = _curry9(4, (env, t, st, widen) => generalizeAgainst(() => freeInEnv(env, st), t, st, widen));
var generalizeOver = _curry9(5, (env, names, t, st, widen) => generalizeAgainst(() => freeInNamedFrom(names, 0, env, st, emptyVarSets), t, st, widen));
var widenLits = (t) => ((_v) => _v._tag === "TySingleton" && _v.base === "string" ? tString : _v._tag === "TySingleton" ? tNumber : _v._tag === "TyOneOf" ? (({ members }) => tUnion(map4((m) => ((_v) => _v._tag === "TySingleton" ? m : widenLits(m))(m), members)))(_v) : _v._tag === "TyCon" ? (({ name, args }) => tCon(name, map4(widenLits, args)))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => tArrow(widenLits(fromT), widenLits(toT)))(_v) : _v._tag === "TyRecord" ? (({ row }) => tRecord(widenRow(row)))(_v) : _v._tag === "TyVar" ? t : (() => {
  throw new Error("non-exhaustive match");
})())(t);
var widenRow = (row) => ((_v) => _v._tag === "RowEmpty" ? row : _v._tag === "RowVar" ? row : _v._tag === "RowExtend" ? (({ label, fieldType, optional, rest }) => rField(label, widenLits(fieldType), widenRow(rest), optional))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(row);
var instMapFrom = _curry9(3, (vars, acc, st) => match3(vars).with((_v) => _v.length === 0, () => _tuple4(acc, st)).with((_v) => _v.length >= 1, ([v, ...rest]) => (([fv, st1]) => instMapFrom(rest, _Map_set3(v, fv, acc), st1))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var instRowMapFrom = _curry9(3, (vars, acc, st) => match3(vars).with((_v) => _v.length === 0, () => _tuple4(acc, st)).with((_v) => _v.length >= 1, ([v, ...rest]) => (([fr, st1]) => instRowMapFrom(rest, _Map_set3(v, fr, acc), st1))(freshRowVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var instSub = _curry9(3, (t, tmap, rmap) => ((_v) => _v._tag === "TyVar" ? (({ id }) => _Map_getOr2(t, id, tmap))(_v) : _v._tag === "TyCon" ? (({ name, args }) => tCon(name, map4((a) => instSub(a, tmap, rmap), args)))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => tArrow(instSub(fromT, tmap, rmap), instSub(toT, tmap, rmap)))(_v) : _v._tag === "TyRecord" ? (({ row }) => tRecord(instSubRow(row, tmap, rmap)))(_v) : _v._tag === "TySingleton" ? (({ base, value }) => TySingleton(base, value))(_v) : _v._tag === "TyOneOf" ? (({ members }) => tUnion(map4((m) => instSub(m, tmap, rmap), members)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(t));
var instSubRow = _curry9(3, (row, tmap, rmap) => ((_v) => _v._tag === "RowVar" ? (({ id }) => _Map_getOr2(row, id, rmap))(_v) : _v._tag === "RowExtend" ? (({ label, fieldType, optional, rest }) => rField(label, instSub(fieldType, tmap, rmap), instSubRow(rest, tmap, rmap), optional))(_v) : _v._tag === "RowEmpty" ? row : (() => {
  throw new Error("non-exhaustive match");
})())(row));
var instantiate = _curry9(2, (sc, st) => (([tmap, st1]) => (([rmap, st2]) => _tuple4(instSub(sc.ty, tmap, rmap), st2))(instRowMapFrom(sc.rvars, new Map, st1)))(instMapFrom(sc.vars, new Map, st)));
var isUpperStart = (s) => ((_v) => _v._tag === "Some" ? (({ value: c }) => and6(c >= 65, c <= 90))(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_codeAt4(0, s));
var typeExprListToType = _curry9(5, (tes, vars, st, aliases, expanding) => ((_v) => _v.length === 0 ? _tuple4([], vars, st) : _v.length >= 1 ? (([te, ...rest]) => (([t, vars1, st1]) => (([restTs, vars2, st2]) => _tuple4(_Array_prepend3(t, restTs), vars2, st2))(typeExprListToType(rest, vars1, st1, aliases, expanding)))(typeExprToType(te, vars, st, aliases, expanding)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(tes));
var typeExprName = _curry9(5, (name, vars, st, aliases, expanding) => _Array_contains(name, primTypeNames) ? _tuple4(primType(name), vars, st) : ((_v) => _v._tag === "Some" ? (({ value: v }) => _tuple4(v, vars, st))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: info }) => (([t, st1]) => _tuple4(t, vars, st1))(aliasRow(name, info, [], st, aliases, expanding)))(_v) : _v._tag === "None" ? isUpperStart(name) ? _tuple4(tPrim(name), vars, st) : (([v, st1]) => _tuple4(v, _Map_set3(name, v, vars), st1))(freshVar(st)) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get3(name, aliases)) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get3(name, vars)));
var typeExprToType = _curry9(5, (te, vars, st, aliases, expanding) => ((_v) => _v._tag === "TyArrow" ? (({ from: fromTe, to: toTe }) => (([fromT, vars1, st1]) => (([toT, vars2, st2]) => _tuple4(tArrow(fromT, toT), vars2, st2))(typeExprToType(toTe, vars1, st1, aliases, expanding)))(typeExprToType(fromTe, vars, st, aliases, expanding)))(_v) : _v._tag === "TyApp" ? (({ ctor, args: argTes }) => (([args, vars1, st1]) => ((_v) => _v._tag === "Some" ? (({ value: info }) => (([t, st2]) => _tuple4(t, vars1, st2))(aliasRow(ctor, info, args, st1, aliases, expanding)))(_v) : _v._tag === "None" ? _tuple4(tCon(ctor, args), vars1, st1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get3(ctor, aliases)))(typeExprListToType(argTes, vars, st, aliases, expanding)))(_v) : _v._tag === "TyTuple" ? (({ elems: elemTes }) => (([elems, vars1, st1]) => _tuple4(tTuple(elems), vars1, st1))(typeExprListToType(elemTes, vars, st, aliases, expanding)))(_v) : _v._tag === "TyList" ? (({ elem: elemTe }) => (([elemT, vars1, st1]) => _tuple4(tCon("Array", [elemT]), vars1, st1))(typeExprToType(elemTe, vars, st, aliases, expanding)))(_v) : _v._tag === "TyName" ? (({ name }) => typeExprName(name, vars, st, aliases, expanding))(_v) : _v._tag === "TyQual" ? (({ alias, name, args: argTes }) => (([args, vars1, st1]) => ((_v) => _v._tag === "Some" ? (({ value: info }) => (([t, st2]) => _tuple4(t, vars1, st2))(aliasRow(name, info, args, st1, aliases, expanding)))(_v) : _v._tag === "None" ? _tuple4(tCon(name, args), vars1, st1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get3(`${alias}.${name}`, aliases)))(typeExprListToType(argTes, vars, st, aliases, expanding)))(_v) : _v._tag === "TyLit" ? (({ value }) => _tuple4(tLit(value), vars, st))(_v) : _v._tag === "TyUnion" ? (({ members }) => (([ts, vars1, st1]) => _tuple4(tUnion(ts), vars1, st1))(typeExprListToType(members, vars, st, aliases, expanding)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(te));
var aliasLocalVarsFrom = _curry9(3, (params, args, st) => match3(params).with((_v) => _v.length === 0, () => _tuple4(new Map, st)).with((_v) => _v.length >= 1, ([p, ...restParams]) => ((_v) => _v.length >= 1 ? (([a, ...restArgs]) => (([restMap, st1]) => _tuple4(_Map_set3(p, a, restMap), st1))(aliasLocalVarsFrom(restParams, restArgs, st)))(_v) : _v.length === 0 ? (([v, st1]) => (([restMap, st2]) => _tuple4(_Map_set3(p, v, restMap), st2))(aliasLocalVarsFrom(restParams, [], st1)))(freshVar(st)) : (() => {
  throw new Error("non-exhaustive match");
})())(args)).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var aliasFieldsFrom = _curry9(5, (fields, vars, st, aliases, expanding) => ((_v) => _v.length === 0 ? _tuple4(RowEmpty, st) : _v.length >= 1 ? (([fld, ...rest]) => (([ft, vars1, st1]) => (([restRow, st2]) => _tuple4(rField(fld.name, ft, restRow, fld.optional), st2))(aliasFieldsFrom(rest, vars1, st1, aliases, expanding)))(typeExprToType(fld.fieldType, vars, st, aliases, expanding)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields));
var aliasRow = _curry9(6, (name, info, args, st, aliases, expanding) => _Set_has(name, expanding) ? _tuple4(tCon(name, args), st) : ((_v) => _v._tag === "Some" ? (({ value: te }) => (([local, st1]) => (([t, _, st2]) => _tuple4(t, st2))(typeExprToType(te, local, st1, aliases, _Set_add(name, expanding))))(aliasLocalVarsFrom(info.params, args, st)))(_v) : _v._tag === "None" ? (([local, st1]) => {
  const next = _Set_add(name, expanding);
  return (([row, st2]) => _tuple4(tRecord(row), st2))(aliasFieldsFrom(info.fields, local, st1, aliases, next));
})(aliasLocalVarsFrom(info.params, args, st)) : (() => {
  throw new Error("non-exhaustive match");
})())(info.expr));
var pvarsFrom = _curry9(2, (params, st) => match3(params).with((_v) => _v.length === 0, () => _tuple4(new Map, [], st)).with((_v) => _v.length >= 1, ([p, ...rest]) => (([v, st1]) => (([restMap, restVars, st2]) => _tuple4(_Map_set3(p, v, restMap), _Array_prepend3(v, restVars), st2))(pvarsFrom(rest, st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var ctorFieldsArrowFrom = _curry9(5, (fields, pvars, st, aliases, result) => ((_v) => _v.length === 0 ? _tuple4(result, st) : _v.length >= 1 ? (([fld, ...rest]) => (([ft, _, st1]) => (([restT, st2]) => _tuple4(tArrow(ft, restT), st2))(ctorFieldsArrowFrom(rest, pvars, st1, aliases, result)))(typeExprToType(fld.fieldType, pvars, st, aliases, _Set_fromArray([]))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields));
var ctorScheme = _curry9(5, (typeName, params, c, st, aliases) => (([pvars, pvarTypes, st1]) => {
  const result = tCon(typeName, pvarTypes);
  return (([ty, st2]) => {
    const sets = collect(ty, emptyVarSets);
    return _tuple4({ vars: _Set_toArray(sets.tv), rvars: _Set_toArray(sets.rv), ty }, st2);
  })(ctorFieldsArrowFrom(c.fields, pvars, st1, aliases, result));
})(pvarsFrom(params, st)));
var matchTysFrom = _curry9(5, (tpls, actuals, params, binds, i) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" ? (([{ value: tpl }, { value: actual }]) => _Option_flatMap((b) => matchTysFrom(tpls, actuals, params, b, i + 1), matchTy(tpl, actual, params, binds)))(_v) : Some8(binds))(_tuple4(_Array_get7(i, tpls), _Array_get7(i, actuals))));
var closedFieldsOf = _curry9(2, (row, acc) => ((_v) => _v._tag === "RowEmpty" ? Some8(acc) : _v._tag === "RowVar" ? None8 : _v._tag === "RowExtend" ? (({ label, fieldType, optional, rest }) => closedFieldsOf(rest, _Array_append6({ label, fieldType, optional }, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(row));
var matchFieldsFrom = _curry9(5, (tpls, actuals, params, binds, i) => ((_v) => _v._tag === "None" ? Some8(binds) : _v._tag === "Some" ? (({ value: t }) => ((_v) => _v._tag === "Some" ? (({ value: a }) => eq6(a.optional, t.optional) ? _Option_flatMap((b) => matchFieldsFrom(tpls, actuals, params, b, i + 1), matchTy(t.fieldType, a.fieldType, params, binds)) : None8)(_v) : _v._tag === "None" ? None8 : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_find2((a) => eq6(a.label, t.label), actuals)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get7(i, tpls)));
var matchTy = _curry9(4, (tpl, actual, params, binds) => ((_v) => _v[0]._tag === "TyVar" && (([{ id }]) => _Set_has(id, params))(_v) ? (([{ id }]) => ((_v) => _v._tag === "Some" ? (({ value: prev }) => eq6(showType(prev), showType(actual)) ? Some8(binds) : None8)(_v) : _v._tag === "None" ? Some8(_Map_set3(id, actual, binds)) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get3(id, binds)))(_v) : _v[0]._tag === "TyVar" && _v[1]._tag === "TyVar" ? (([{ id: a }, { id: b }]) => eq6(a, b) ? Some8(binds) : None8)(_v) : _v[0]._tag === "TyCon" && _v[1]._tag === "TyCon" ? (([{ name: n, args: targs }, { name: m, args: aargs }]) => and6(eq6(n, m), eq6(length6(targs), length6(aargs))) ? matchTysFrom(targs, aargs, params, binds, 0) : None8)(_v) : _v[0]._tag === "TyFn" && _v[1]._tag === "TyFn" ? (([{ from: tf, to: tt }, { from: af, to: at }]) => _Option_flatMap((b) => matchTy(tt, at, params, b), matchTy(tf, af, params, binds)))(_v) : _v[0]._tag === "TyRecord" && _v[1]._tag === "TyRecord" ? (([{ row: trow }, { row: arow }]) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" ? (([{ value: tfs }, { value: afs }]) => eq6(length6(tfs), length6(afs)) ? matchFieldsFrom(tfs, afs, params, binds, 0) : None8)(_v) : None8)(_tuple4(closedFieldsOf(trow, []), closedFieldsOf(arow, []))))(_v) : _v[0]._tag === "TySingleton" && _v[1]._tag === "TySingleton" ? (([{ base: tb, value: tv }, { base: ab, value: av }]) => and6(eq6(tb, ab), eq6(tv, av)) ? Some8(binds) : None8)(_v) : _v[0]._tag === "TyOneOf" && _v[1]._tag === "TyOneOf" ? eq6(showType(tpl), showType(actual)) ? Some8(binds) : None8 : None8)(_tuple4(tpl, actual)));
var templateRowFrom = _curry9(4, (fields, vars, aliases, i) => ((_v) => _v._tag === "None" ? RowEmpty : _v._tag === "Some" ? (({ value: f }) => (([t, _vars, _st]) => RowExtend(f.name, t, f.optional, templateRowFrom(fields, vars, aliases, i + 1)))(typeExprToType(f.fieldType, vars, mkSt(0), aliases, _Set_fromArray([]))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get7(i, fields)));
var templateVars = (params) => reduce2(_curry9(2, ([vs, ids], p) => {
  const id = -1e6 - length6(ids);
  return _tuple4(_Map_set3(p, TyVar(id), vs), _Array_append6(id, ids));
}), _tuple4(new Map, []), params);
var allBound = _curry9(2, (ids, binds) => length6(filter2((id) => !_Map_has2(id, binds), ids)) === 0);
var bareAliasName = (key) => {
  const parts = _Str_split3(".", key);
  return _Option_unwrapOr5(key, _Array_get7(length6(parts) - 1, parts));
};
var foldingAliasFrom = _curry9(4, (t, keys, aliases, i) => ((_v) => _v._tag === "None" ? None8 : _v._tag === "Some" ? (({ value: key }) => ((next) => ((_v) => _v._tag === "Some" ? (({ value: info }) => ((_v) => _v._tag === "Some" ? next() : _v._tag === "None" ? (([vars, ids]) => {
  const tpl = TyRecord(templateRowFrom(info.fields, vars, aliases, 0));
  return ((_v) => _v._tag === "Some" ? (({ value: binds }) => allBound(ids, binds) ? Some8(bareAliasName(key)) : next())(_v) : _v._tag === "None" ? next() : (() => {
    throw new Error("non-exhaustive match");
  })())(matchTy(tpl, t, _Set_fromArray(ids), new Map));
})(templateVars(info.params)) : (() => {
  throw new Error("non-exhaustive match");
})())(info.expr))(_v) : _v._tag === "None" ? next() : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get3(key, aliases)))(() => foldingAliasFrom(t, keys, aliases, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get7(i, keys)));
var nominalTypeName = _curry9(2, (t, aliases) => ((_v) => _v._tag === "TyCon" ? (({ name }) => isUpperStart(name) ? Some8(name) : None8)(_v) : _v._tag === "TyRecord" ? (({ row }) => foldingAliasFrom(TyRecord(row), _Map_keys3(aliases), aliases, 0))(_v) : None8)(widenLits(t)));
var foldTemplatesFrom = _curry9(4, (keys, aliases, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: key }) => ((_v) => _v._tag === "None" ? foldTemplatesFrom(keys, aliases, i + 1, acc) : _v._tag === "Some" ? (({ value: info }) => (([_vars, ids]) => {
  const name = bareAliasName(key);
  return (([tpl, _st]) => foldTemplatesFrom(keys, aliases, i + 1, _Array_append6({ name, ids, tpl }, acc)))(aliasRow(name, info, map4((id) => TyVar(id), ids), mkSt(0), aliases, _Set_fromArray([])));
})(templateVars(info.params)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get3(key, aliases)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get7(i, keys)));
var foldHeadFrom = _curry9(3, (t, tpls, i) => ((_v) => _v._tag === "None" ? None8 : _v._tag === "Some" ? (({ value: a }) => ((_v) => _v._tag === "Some" ? (({ value: binds }) => allBound(a.ids, binds) ? Some8(_tuple4(a.name, map4((id) => _Map_getOr2(t, id, binds), a.ids))) : foldHeadFrom(t, tpls, i + 1))(_v) : _v._tag === "None" ? foldHeadFrom(t, tpls, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(matchTy(a.tpl, t, _Set_fromArray(a.ids), new Map)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get7(i, tpls)));
var foldWith = _curry9(2, (t, tpls) => ((_v) => _v._tag === "Some" ? (({ value: [name, args] }) => tCon(name, map4((a) => foldWith(a, tpls), args)))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "TyCon" ? (({ name, args }) => tCon(name, map4((a) => foldWith(a, tpls), args)))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => tArrow(foldWith(fromT, tpls), foldWith(toT, tpls)))(_v) : _v._tag === "TyRecord" ? (({ row }) => tRecord(foldRowWith(row, tpls)))(_v) : _v._tag === "TyOneOf" ? (({ members }) => tUnion(map4((m) => foldWith(m, tpls), members)))(_v) : t)(t) : (() => {
  throw new Error("non-exhaustive match");
})())(foldHeadFrom(t, tpls, 0)));
var foldRowWith = _curry9(2, (row, tpls) => ((_v) => _v._tag === "RowExtend" ? (({ label, fieldType, optional, rest }) => RowExtend(label, foldWith(fieldType, tpls), optional, foldRowWith(rest, tpls)))(_v) : row)(row));
var foldAliases = _curry9(2, (t, aliases) => foldAliasesAt(t, _Map_keys3(aliases), aliases));
var foldAliasesAt = _curry9(3, (t, keys, aliases) => foldWith(t, foldTemplatesFrom(keys, aliases, 0, [])));

var arrOf = (elem) => tCon("Array", [elem]);
var setStateDomain = (state) => tUnion([state, tArrow(state, state)]);
var isRef = _curry10(2, (fn, name) => ((_v) => _v._tag === "ERef" ? (({ name: actual }) => eq7(actual, name))(_v) : false)(fn));
var preactSpan = (e) => ((_v) => _v._tag === "ENum" ? (({ span: sp }) => sp)(_v) : _v._tag === "EUnit" ? (({ span: sp }) => sp)(_v) : _v._tag === "EBool" ? (({ span: sp }) => sp)(_v) : _v._tag === "EStr" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERef" ? (({ span: sp }) => sp)(_v) : _v._tag === "ECall" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELambda" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELetIn" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELetBind" ? (({ span: sp }) => sp)(_v) : _v._tag === "EPipe" ? (({ span: sp }) => sp)(_v) : _v._tag === "EDo" ? (({ span: sp }) => sp)(_v) : _v._tag === "ETernary" ? (({ span: sp }) => sp)(_v) : _v._tag === "EMatch" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELoop" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERecur" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERecord" ? (({ span: sp }) => sp)(_v) : _v._tag === "EField" ? (({ span: sp }) => sp)(_v) : _v._tag === "ETuple" ? (({ span: sp }) => sp)(_v) : _v._tag === "EArr" ? (({ span: sp }) => sp)(_v) : _v._tag === "EList" ? (({ span: sp }) => sp)(_v) : _v._tag === "ESet" ? (({ span: sp }) => sp)(_v) : _v._tag === "EMap" ? (({ span: sp }) => sp)(_v) : _v._tag === "EInterp" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e);
var inferArgs = _curry10(3, (args, st, inferExpr) => match4(args).with((_v) => _v.length === 0, () => Ok5(st)).with((_v) => _v.length >= 1, ([arg, ...rest]) => _Result_flatMap4(([_, st1]) => inferArgs(rest, st1, inferExpr), inferExpr(arg, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferUseState = _curry10(4, (fn, args, st, api) => and7(isRef(fn, "useState"), length7(args) === 1) ? ((_v) => _v._tag === "None" ? Ok5(None9) : _v._tag === "Some" ? (({ value: init }) => _Result_map4(([state, st1]) => {
  const value = widenLits(zonk(state, st1));
  return Some9(_tuple5(tTuple([value, tArrow(setStateDomain(value), tUnit)]), st1));
}, api.inferExpr(init, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get8(0, args)) : Ok5(None9));
var inferUseLazyState = _curry10(4, (fn, args, st, api) => and7(isRef(fn, "useLazyState"), length7(args) === 1) ? ((_v) => _v._tag === "None" ? Ok5(None9) : _v._tag === "Some" ? (({ value: thunk }) => (([state, st1]) => _Result_flatMap4(([thunkT, st2]) => _Result_map4((st3) => {
  const value = widenLits(zonk(state, st3));
  return Some9(_tuple5(tTuple([value, tArrow(setStateDomain(value), tUnit)]), st3));
}, api.unify(thunkT, tArrow(tUnit, state), st2, preactSpan(thunk))), api.inferExpr(thunk, st1)))(freshVar(st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get8(0, args)) : Ok5(None9));
var inferUseRef = _curry10(4, (fn, args, st, api) => and7(isRef(fn, "useRef"), length7(args) === 1) ? ((_v) => _v._tag === "None" ? Ok5(None9) : _v._tag === "Some" ? (({ value: init }) => _Result_map4(([state, st1]) => Some9(_tuple5(tRecord(rExtend("current", zonk(state, st1), RowEmpty)), st1)), api.inferExpr(init, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get8(0, args)) : Ok5(None9));
var inferDeps = _curry10(4, (args, st, api, name) => ((_v) => _v._tag === "Some" ? (({ value: surplus }) => ((sp) => Err5({ message: `${name} takes one dependency array after its callback`, start: sp.start, end: sp.end, help: None9, suggestions: [] }))(preactSpan(surplus)))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "None" ? Ok5(st) : _v._tag === "Some" ? (({ value: deps }) => _Result_flatMap4(([depsT, st1]) => (([elem, st2]) => api.unify(depsT, arrOf(elem), st2, preactSpan(deps)))(freshVar(st1)), api.inferExpr(deps, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get8(1, args)) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get8(2, args)));
var inferEffectLike = _curry10(5, (fn, args, st, api, name) => and7(isRef(fn, name), length7(args) >= 1) ? ((_v) => _v._tag === "None" ? Ok5(None9) : _v._tag === "Some" ? (({ value: effect }) => (([cleanup, st1]) => _Result_flatMap4(([effectT, st2]) => _Result_flatMap4((st3) => length7(args) === 1 ? (([dep, st4]) => Ok5(Some9(_tuple5(tArrow(arrOf(dep), tUnit), st4))))(freshVar(st3)) : _Result_map4((st4) => Some9(_tuple5(tUnit, st4)), inferDeps(args, st3, api, name)), api.unify(effectT, tArrow(tUnit, cleanup), st2, preactSpan(effect))), api.inferExpr(effect, st1)))(freshVar(st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get8(0, args)) : Ok5(None9));
var inferUseCallback = _curry10(4, (fn, args, st, api) => and7(isRef(fn, "useCallback"), length7(args) >= 1) ? ((_v) => _v._tag === "None" ? Ok5(None9) : _v._tag === "Some" ? (({ value: callback }) => _Result_flatMap4(([callbackT, st1]) => length7(args) === 1 ? (([dep, st2]) => Ok5(Some9(_tuple5(tArrow(arrOf(dep), zonk(callbackT, st2)), st2))))(freshVar(st1)) : _Result_map4((st2) => Some9(_tuple5(zonk(callbackT, st2), st2)), inferDeps(args, st1, api, "useCallback")), api.inferExpr(callback, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get8(0, args)) : Ok5(None9));
var inferUseMemo = _curry10(4, (fn, args, st, api) => and7(isRef(fn, "useMemo"), length7(args) >= 1) ? ((_v) => _v._tag === "None" ? Ok5(None9) : _v._tag === "Some" ? (({ value: thunk }) => (([value, st1]) => _Result_flatMap4(([thunkT, st2]) => _Result_flatMap4((st3) => length7(args) === 1 ? (([dep, st4]) => Ok5(Some9(_tuple5(tArrow(arrOf(dep), zonk(value, st4)), st4))))(freshVar(st3)) : _Result_map4((st4) => Some9(_tuple5(zonk(value, st4), st4)), inferDeps(args, st3, api, "useMemo")), api.unify(thunkT, tArrow(tUnit, value), st2, preactSpan(thunk))), api.inferExpr(thunk, st1)))(freshVar(st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get8(0, args)) : Ok5(None9));
var inferHookDeps = _curry10(4, (fn, args, st, api) => {
  const expected = isRef(fn, "hookDeps0") ? Some9(0) : isRef(fn, "hookDeps1") ? Some9(1) : isRef(fn, "hookDeps2") ? Some9(2) : isRef(fn, "hookDeps") ? Some9(3) : None9;
  return ((_v) => _v._tag === "Some" ? (({ value: n }) => eq7(length7(args), n) ? _Result_map4((st1) => (([elem, st2]) => Some9(_tuple5(arrOf(elem), st2)))(freshVar(st1)), inferArgs(args, st, api.inferExpr)) : Ok5(None9))(_v) : _v._tag === "None" ? Ok5(None9) : (() => {
    throw new Error("non-exhaustive match");
  })())(expected);
});
var inferPreactCall = _curry10(5, (fn, args, _origin, st, api) => _Result_flatMap4((first) => ((_v) => _v._tag === "Some" ? Ok5(first) : _v._tag === "None" ? _Result_flatMap4((lazy) => ((_v) => _v._tag === "Some" ? Ok5(lazy) : _v._tag === "None" ? _Result_flatMap4((ref) => ((_v) => _v._tag === "Some" ? Ok5(ref) : _v._tag === "None" ? _Result_flatMap4((effect) => ((_v) => _v._tag === "Some" ? Ok5(effect) : _v._tag === "None" ? _Result_flatMap4((layout) => ((_v) => _v._tag === "Some" ? Ok5(layout) : _v._tag === "None" ? _Result_flatMap4((callback) => ((_v) => _v._tag === "Some" ? Ok5(callback) : _v._tag === "None" ? _Result_flatMap4((memo) => ((_v) => _v._tag === "Some" ? Ok5(memo) : _v._tag === "None" ? inferHookDeps(fn, args, st, api) : (() => {
  throw new Error("non-exhaustive match");
})())(memo), inferUseMemo(fn, args, st, api)) : (() => {
  throw new Error("non-exhaustive match");
})())(callback), inferUseCallback(fn, args, st, api)) : (() => {
  throw new Error("non-exhaustive match");
})())(layout), inferEffectLike(fn, args, st, api, "useLayoutEffect")) : (() => {
  throw new Error("non-exhaustive match");
})())(effect), inferEffectLike(fn, args, st, api, "useEffect")) : (() => {
  throw new Error("non-exhaustive match");
})())(ref), inferUseRef(fn, args, st, api)) : (() => {
  throw new Error("non-exhaustive match");
})())(lazy), inferUseLazyState(fn, args, st, api)) : (() => {
  throw new Error("non-exhaustive match");
})())(first), inferUseState(fn, args, st, api)));
var preactPlugin = { name: "preact", parse: None9, inferCall: Some9(inferPreactCall), format: None9, formatDoc: None9, dtsBinding: None9, bindingType: None9 };

var DEFAULT_PLUGINS = [jsxPlugin];
var shadowing = _curry11(2, (ps, b) => ((_v) => _v._tag === "Some" ? (({ value: p }) => p)(_v) : _v._tag === "None" ? b : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_find3((p) => eq8(p.name, b.name), ps)));
var resolvePlugins = _curry11(2, (pluginsOpt, builtins) => ((_v) => _v._tag === "None" ? builtins : _v._tag === "Some" ? (({ value: ps }) => length8(ps) === 0 ? [] : _Array_concat4(map5((b) => shadowing(ps, b), builtins), filter3((p) => length8(filter3((b) => eq8(b.name, p.name), builtins)) === 0, ps)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(pluginsOpt));
var resolvePluginsDefault = (pluginsOpt) => resolvePlugins(pluginsOpt, DEFAULT_PLUGINS);
var parseHooksFrom = _curry11(3, (plugins, i, acc) => match5(_Array_get9(i, plugins)).with({ _tag: "None" }, () => acc).with((_v) => _v._tag === "Some", ({ value: { parse } }) => ((_v) => _v._tag === "Some" ? (({ value: hook }) => parseHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))(_v) : _v._tag === "None" ? parseHooksFrom(plugins, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(parse)).exhaustive());
var parseHooksOf = (plugins) => parseHooksFrom(plugins, 0, []);
var inferHooksFrom = _curry11(3, (plugins, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: p }) => ((_v) => _v._tag === "Some" ? (({ value: hook }) => inferHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))(_v) : _v._tag === "None" ? inferHooksFrom(plugins, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(p.inferCall))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get9(i, plugins)));
var inferCallHooksOf = (plugins) => inferHooksFrom(plugins, 0, []);
var runParseHooks = _curry11(4, (hooks, toks, pos, parseExpr) => match5(hooks).with((_v) => _v.length === 0, () => Ok6(None10)).with((_v) => _v.length >= 1, ([hook, ...rest]) => ((_v) => _v._tag === "Err" ? (({ error: e }) => Err6(e))(_v) : _v._tag === "Ok" ? (({ value: v }) => ((_v) => _v._tag === "None" ? runParseHooks(rest, toks, pos, parseExpr) : _v._tag === "Some" ? (({ value: claim }) => Ok6(Some10(claim)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(v))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(hook(toks, pos, parseExpr))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var runInferCallHooks = _curry11(6, (hooks, fn, args, origin, st, api) => match5(hooks).with((_v) => _v.length === 0, () => Ok6(None10)).with((_v) => _v.length >= 1, ([hook, ...rest]) => ((_v) => _v._tag === "Err" ? (({ error: e }) => Err6(e))(_v) : _v._tag === "Ok" ? (({ value: v }) => ((_v) => _v._tag === "None" ? runInferCallHooks(rest, fn, args, origin, st, api) : _v._tag === "Some" ? (({ value: claim }) => Ok6(Some10(claim)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(v))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(hook(fn, args, origin, st, api))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var formatHooksFrom = _curry11(3, (plugins, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: p }) => ((_v) => _v._tag === "Some" ? (({ value: hook }) => formatHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))(_v) : _v._tag === "None" ? formatHooksFrom(plugins, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(p.format))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get9(i, plugins)));
var formatDocHooksFrom = _curry11(3, (plugins, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: p }) => ((_v) => _v._tag === "Some" ? (({ value: hook }) => formatDocHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))(_v) : _v._tag === "None" ? formatDocHooksFrom(plugins, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(p.formatDoc))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get9(i, plugins)));
var dtsHooksFrom = _curry11(3, (plugins, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: p }) => ((_v) => _v._tag === "Some" ? (({ value: hook }) => dtsHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))(_v) : _v._tag === "None" ? dtsHooksFrom(plugins, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(p.dtsBinding))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get9(i, plugins)));
var dtsHooksFor = (pluginsOpt) => dtsHooksFrom(resolvePluginsDefault(pluginsOpt), 0, []);
var runFormatHooks = _curry11(2, (hooks, e) => match5(hooks).with((_v) => _v.length === 0, () => None10).with((_v) => _v.length >= 1, ([hook, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: out }) => Some10(out))(_v) : _v._tag === "None" ? runFormatHooks(rest, e) : (() => {
  throw new Error("non-exhaustive match");
})())(hook(e))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var runFormatDocHooks = _curry11(3, (hooks, e, api) => match5(hooks).with((_v) => _v.length === 0, () => None10).with((_v) => _v.length >= 1, ([hook, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: doc }) => Some10(doc))(_v) : _v._tag === "None" ? runFormatDocHooks(rest, e, api) : (() => {
  throw new Error("non-exhaustive match");
})())(hook(e, api))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var runDtsHooks = _curry11(5, (hooks, name, value, ty, api) => match5(hooks).with((_v) => _v.length === 0, () => None10).with((_v) => _v.length >= 1, ([hook, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: ts }) => Some10(ts))(_v) : _v._tag === "None" ? runDtsHooks(rest, name, value, ty, api) : (() => {
  throw new Error("non-exhaustive match");
})())(hook(name, value, ty, api))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var bindingHooksFrom = _curry11(3, (plugins, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: p }) => ((_v) => _v._tag === "Some" ? (({ value: hook }) => bindingHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))(_v) : _v._tag === "None" ? bindingHooksFrom(plugins, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(p.bindingType))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get9(i, plugins)));
var bindingHooksFor = (pluginsOpt) => bindingHooksFrom(resolvePluginsDefault(pluginsOpt), 0, []);
var runBindingHooks = _curry11(4, (hooks, value, ty, api) => match5(hooks).with((_v) => _v.length === 0, () => None10).with((_v) => _v.length >= 1, ([hook, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: ts }) => Some10(ts))(_v) : _v._tag === "None" ? runBindingHooks(rest, value, ty, api) : (() => {
  throw new Error("non-exhaustive match");
})())(hook(value, ty, api))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));

var tokName = (t) => ((_v) => _v._tag === "TLet" ? "let" : _v._tag === "TType" ? "type" : _v._tag === "TExtern" ? "extern" : _v._tag === "TSwitch" ? "switch" : _v._tag === "TLoop" ? "loop" : _v._tag === "TRecur" ? "recur" : _v._tag === "TDo" ? "do" : _v._tag === "TImport" ? "import" : _v._tag === "TExport" ? "export" : _v._tag === "TEq" ? "eq" : _v._tag === "TArrow" ? "arrow" : _v._tag === "TTarrow" ? "tarrow" : _v._tag === "TPipe" ? "pipe" : _v._tag === "TConcat" ? "concat" : _v._tag === "TBar" ? "bar" : _v._tag === "TLparen" ? "lparen" : _v._tag === "TRparen" ? "rparen" : _v._tag === "TLbrace" ? "lbrace" : _v._tag === "TRbrace" ? "rbrace" : _v._tag === "TLbracket" ? "lbracket" : _v._tag === "TRbracket" ? "rbracket" : _v._tag === "TSpread" ? "spread" : _v._tag === "TPlus" ? "plus" : _v._tag === "TMinus" ? "minus" : _v._tag === "TStar" ? "star" : _v._tag === "TSlash" ? "slash" : _v._tag === "TPercent" ? "percent" : _v._tag === "TAt" ? "at" : _v._tag === "THash" ? "hash" : _v._tag === "TTilde" ? "tilde" : _v._tag === "TDot" ? "dot" : _v._tag === "TColon" ? "colon" : _v._tag === "TQuestion" ? "question" : _v._tag === "TEqeq" ? "eqeq" : _v._tag === "TNeq" ? "neq" : _v._tag === "TLte" ? "lte" : _v._tag === "TGte" ? "gte" : _v._tag === "TLt" ? "lt" : _v._tag === "TGt" ? "gt" : _v._tag === "TAndand" ? "andand" : _v._tag === "TOror" ? "oror" : _v._tag === "TBang" ? "bang" : _v._tag === "TBacktick" ? "backtick" : _v._tag === "TComma" ? "comma" : _v._tag === "TSemi" ? "semi" : _v._tag === "TNum" ? "num" : _v._tag === "TBool" ? "bool" : _v._tag === "TStr" ? "str" : _v._tag === "TTmplStart" ? "tmplstart" : _v._tag === "TTmplMid" ? "tmplmid" : _v._tag === "TTmplEnd" ? "tmplend" : _v._tag === "TId" ? "id" : _v._tag === "TEof" ? "eof" : (() => {
  throw new Error("non-exhaustive match");
})())(t);
var eofTok = { tok: TEof, start: 0, end: 0, doc: None11 };
var tokAt = _curry12(2, (toks, i) => _Option_unwrapOr6(eofTok, _Array_get10(i, toks)));
var spanOf = (lt) => ({ start: lt.start, end: lt.end });
var spanning = _curry12(2, (a, b) => ({ start: a.start, end: b.end }));
var toEnd = _curry12(3, (start, toks, pos) => ({ start: start.start, end: tokAt(toks, pos - 1).end }));
var errAt = _curry12(2, (message, lt) => Err7({ message, start: lt.start, end: lt.end }));
var expectTok = _curry12(3, (t, toks, pos) => {
  const lt = tokAt(toks, pos);
  return eq9(lt.tok, t) ? Ok7(pos + 1) : errAt(`expected ${tokName(t)}, got ${tokName(lt.tok)}`, lt);
});
var expectId = _curry12(2, (toks, pos) => {
  const lt = tokAt(toks, pos);
  return ((_v) => _v._tag === "TId" ? (({ value: name }) => Ok7(_tuple6({ name, span: spanOf(lt) }, pos + 1)))(_v) : ((t) => errAt(`expected id, got ${tokName(t)}`, lt))(_v))(lt.tok);
});
var keywordText = (t) => ((_v) => _v._tag === "TLet" ? Some11("let") : _v._tag === "TType" ? Some11("type") : _v._tag === "TExtern" ? Some11("extern") : _v._tag === "TSwitch" ? Some11("switch") : _v._tag === "TLoop" ? Some11("loop") : _v._tag === "TRecur" ? Some11("recur") : _v._tag === "TDo" ? Some11("do") : _v._tag === "TImport" ? Some11("import") : _v._tag === "TExport" ? Some11("export") : None11)(t);
var expectLabel = _curry12(2, (toks, pos) => {
  const lt = tokAt(toks, pos);
  return ((_v) => _v._tag === "Some" ? (({ value: name }) => Ok7(_tuple6({ name, span: spanOf(lt) }, pos + 1)))(_v) : _v._tag === "None" ? expectId(toks, pos) : (() => {
    throw new Error("non-exhaustive match");
  })())(keywordText(lt.tok));
});
var expectStr = _curry12(2, (toks, pos) => {
  const lt = tokAt(toks, pos);
  return ((_v) => _v._tag === "TStr" ? (({ value }) => Ok7(_tuple6(value, pos + 1)))(_v) : ((t) => errAt(`expected str, got ${tokName(t)}`, lt))(_v))(lt.tok);
});
var expectIn = _curry12(2, (toks, pos) => _Result_flatMap5(([kw, p]) => kw.name === "in" ? Ok7(p) : errAt(`expected 'in' after let binding, got '${kw.name}'`, tokAt(toks, p)), expectId(toks, pos)));
var isUpper = (s) => _Option_exists3((n) => and8(n >= 65, n <= 90), _Str_codeAt5(0, s));
var sepBy = _curry12(4, (parseItem, toks, pos, acc) => _Result_flatMap5(([item, p]) => {
  const items = _Array_append8(item, acc);
  return tokAt(toks, p).tok._tag === "TComma" ? sepBy(parseItem, toks, p + 1, items) : Ok7(_tuple6(items, p));
}, parseItem(toks, pos)));
var sepByH = _curry12(5, (parseItem, toks, pos, acc, hooks) => _Result_flatMap5(([item, p]) => {
  const items = _Array_append8(item, acc);
  return tokAt(toks, p).tok._tag === "TComma" ? sepByH(parseItem, toks, p + 1, items, hooks) : Ok7(_tuple6(items, p));
}, parseItem(toks, pos, hooks)));
var listUntil = _curry12(4, (close, parseItem, toks, pos) => eq9(tokAt(toks, pos).tok, close) ? Ok7(_tuple6([], pos)) : sepBy(parseItem, toks, pos, []));
var listUntilH = _curry12(5, (close, parseItem, toks, pos, hooks) => eq9(tokAt(toks, pos).tok, close) ? Ok7(_tuple6([], pos)) : sepByH(parseItem, toks, pos, [], hooks));
var scanLambdaDepth = _curry12(3, (toks, k, depth) => ((_v) => _v._tag === "TLparen" ? scanLambdaDepth(toks, k + 1, depth + 1) : _v._tag === "TRparen" ? depth === 1 ? tokAt(toks, k + 1).tok._tag === "TArrow" : scanLambdaDepth(toks, k + 1, depth - 1) : _v._tag === "TEof" ? false : scanLambdaDepth(toks, k + 1, depth))(tokAt(toks, k).tok));
var looksLikeLambda = _curry12(2, (toks, pos) => ((_v) => _v._tag === "TId" ? tokAt(toks, pos + 1).tok._tag === "TArrow" : _v._tag === "TLparen" ? scanLambdaDepth(toks, pos, 0) : false)(tokAt(toks, pos).tok));
var exprSpan = (e) => ((_v) => _v._tag === "ENum" ? (({ span: sp }) => sp)(_v) : _v._tag === "EUnit" ? (({ span: sp }) => sp)(_v) : _v._tag === "EBool" ? (({ span: sp }) => sp)(_v) : _v._tag === "EStr" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERef" ? (({ span: sp }) => sp)(_v) : _v._tag === "ECall" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELambda" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELetIn" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELetBind" ? (({ span: sp }) => sp)(_v) : _v._tag === "EPipe" ? (({ span: sp }) => sp)(_v) : _v._tag === "EDo" ? (({ span: sp }) => sp)(_v) : _v._tag === "ETernary" ? (({ span: sp }) => sp)(_v) : _v._tag === "EMatch" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELoop" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERecur" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERecord" ? (({ span: sp }) => sp)(_v) : _v._tag === "EField" ? (({ span: sp }) => sp)(_v) : _v._tag === "ETuple" ? (({ span: sp }) => sp)(_v) : _v._tag === "EArr" ? (({ span: sp }) => sp)(_v) : _v._tag === "EList" ? (({ span: sp }) => sp)(_v) : _v._tag === "ESet" ? (({ span: sp }) => sp)(_v) : _v._tag === "EMap" ? (({ span: sp }) => sp)(_v) : _v._tag === "EInterp" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e);
var tySpan = (t) => ((_v) => _v._tag === "TyName" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyArrow" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyApp" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyTuple" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyList" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyQual" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyLit" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyUnion" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(t);
var parseParam = _curry12(2, (toks, pos) => ((_v) => _v._tag === "TLbrace" ? _Result_flatMap5(([fields, p]) => _Result_flatMap5((p2) => Ok7(_tuple6(LPSpanned(LPRecord(map6((f) => f.name, fields)), map6((f) => f.span, fields)), p2)), expectTok(TRbrace, toks, p)), listUntil(TRbrace, expectId, toks, pos + 1)) : _v._tag === "TLparen" ? _Result_flatMap5(([names, p]) => _Result_flatMap5((p2) => Ok7(((_v) => _v.length === 1 ? (([single]) => _tuple6(LPSpanned(LPName(single.name, None11), [single.span]), p2))(_v) : ((many) => _tuple6(LPSpanned(LPTuple(map6((n) => n.name, many)), map6((n) => n.span, many)), p2))(_v))(names)), expectTok(TRparen, toks, p)), sepBy(expectId, toks, pos + 1, [])) : _Result_flatMap5(([nm, p]) => tokAt(toks, p).tok._tag === "TColon" ? _Result_map5(([annot, p2]) => _tuple6(LPSpanned(LPName(nm.name, Some11(annot)), [nm.span]), p2), parseTypeExpr(toks, p + 1)) : Ok7(_tuple6(LPSpanned(LPName(nm.name, None11), [nm.span]), p)), expectId(toks, pos)))(tokAt(toks, pos).tok));
var parseLabeledParam = _curry12(3, (toks, pos, hooks) => _Result_flatMap5((p0) => _Result_flatMap5(([nm, p1]) => ((optional) => ((p2) => _Result_flatMap5(([annot, p3]) => tokAt(toks, p3).tok._tag === "TEq" ? _Result_map5(([d, k]) => _tuple6(LPSpanned(LPLabeled(nm.name, annot, optional, Some11(d)), [nm.span]), k), parseExpr(toks, p3 + 1, hooks)) : Ok7(_tuple6(LPSpanned(LPLabeled(nm.name, annot, optional, None11), [nm.span]), p3)), tokAt(toks, p2).tok._tag === "TColon" ? _Result_map5(([t, k]) => _tuple6(Some11(t), k), parseTypeExpr(toks, p2 + 1)) : Ok7(_tuple6(None11, p2))))(optional ? p1 + 1 : p1))(tokAt(toks, p1).tok._tag === "TQuestion"), expectLabel(toks, p0)), expectTok(TTilde, toks, pos)));
var parseLamParam = _curry12(3, (toks, pos, hooks) => tokAt(toks, pos).tok._tag === "TTilde" ? parseLabeledParam(toks, pos, hooks) : parseParam(toks, pos));
var isLabeledParam = (p) => ((_v) => _v._tag === "LPLabeled" ? true : _v._tag === "LPSpanned" ? (({ param: inner }) => isLabeledParam(inner))(_v) : false)(p);
var labeledTrailing = _curry12(2, (params, seen) => ((_v) => _v.length === 0 ? true : _v.length >= 1 ? (([p, ...rest]) => isLabeledParam(p) ? labeledTrailing(rest, true) : and8(!seen, labeledTrailing(rest, false)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params));
var parseLambda = _curry12(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return ((_v) => _v._tag === "TId" ? (({ value: name }) => _Result_flatMap5((p) => _Result_flatMap5(([body, p2]) => Ok7(_tuple6(ELambda([LPSpanned(LPName(name, None11), [spanOf(tokAt(toks, pos))])], body, toEnd(start, toks, p2)), p2)), parseLambdaBody(toks, p, hooks)), expectTok(TArrow, toks, pos + 1)))(_v) : _Result_flatMap5((p) => _Result_flatMap5(([params, p2]) => _Result_flatMap5((p3) => labeledTrailing(params, false) ? _Result_flatMap5((p4) => _Result_flatMap5(([body, p5]) => Ok7(_tuple6(ELambda(params, body, toEnd(start, toks, p5)), p5)), parseLambdaBody(toks, p4, hooks)), expectTok(TArrow, toks, p3)) : errAt("labeled parameters must be a trailing group", tokAt(toks, p)), expectTok(TRparen, toks, p2)), listUntilH(TRparen, parseLamParam, toks, p, hooks)), expectTok(TLparen, toks, pos)))(tokAt(toks, pos).tok);
});
var parseLambdaBody = _curry12(3, (toks, pos, hooks) => and8(tokAt(toks, pos).tok._tag === "TLbrace", arrowBodyIsDoBlock(toks, pos, 0)) ? parseDoBlock(toks, pos, hooks) : parseExpr(toks, pos, hooks));
var arrowBodyIsDoBlock = _curry12(3, (toks, pos, depth) => ((_v) => _v._tag === "TLbrace" ? arrowBodyIsDoBlock(toks, pos + 1, depth + 1) : _v._tag === "TRbrace" ? depth === 1 ? false : arrowBodyIsDoBlock(toks, pos + 1, depth - 1) : _v._tag === "TSemi" ? or6(depth === 1, arrowBodyIsDoBlock(toks, pos + 1, depth)) : _v._tag === "TEof" ? false : arrowBodyIsDoBlock(toks, pos + 1, depth))(tokAt(toks, pos).tok));
var parseLetIn = _curry12(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => or6(tokAt(toks, p).tok._tag === "TQuestion", tokAt(toks, p).tok._tag === "TBang") ? ((monad) => ((paramSpan) => _Result_flatMap5(([param, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([value, p3]) => _Result_flatMap5((p4) => _Result_flatMap5(([body, p5]) => Ok7(_tuple6(ELetBind(param, paramSpan, monad, value, body, toEnd(start, toks, p5)), p5)), parseExpr(toks, p4, hooks)), expectIn(toks, p3)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, p1)), parseParam(toks, p + 1)))(spanOf(tokAt(toks, p + 1))))(tokAt(toks, p).tok._tag === "TQuestion" ? "Result" : "Task") : tokAt(toks, p).tok._tag === "TLparen" ? ((paramStart) => _Result_flatMap5(([param, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([value, p3]) => _Result_flatMap5((p4) => _Result_flatMap5(([body, p5]) => ((fn) => Ok7(_tuple6(ECall(fn, [value], None11, toEnd(start, toks, p5)), p5)))(ELambda([param], body, toEnd(paramStart, toks, p5))), parseExpr(toks, p4, hooks)), expectIn(toks, p3)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, p1)), parseParam(toks, p)))(spanOf(tokAt(toks, p))) : _Result_flatMap5(([nm, p1]) => _Result_flatMap5(([annot, pA]) => _Result_flatMap5((p2) => _Result_flatMap5(([value, p3]) => _Result_flatMap5((p4) => _Result_flatMap5(([body, p5]) => Ok7(_tuple6(ELetIn(nm.name, nm.span, annot, value, body, toEnd(start, toks, p5)), p5)), parseExpr(toks, p4, hooks)), expectIn(toks, p3)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, pA)), tokAt(toks, p1).tok._tag === "TColon" ? _Result_map5(([ty, k]) => _tuple6(Some11(ty), k), parseTypeExpr(toks, p1 + 1)) : Ok7(_tuple6(None11, p1))), expectId(toks, p)), expectTok(TLet, toks, pos));
});
var composeAt = _curry12(2, (toks, pos) => {
  const a = tokAt(toks, pos);
  const b = tokAt(toks, pos + 1);
  return and8(and8(a.tok._tag === "TGt", b.tok._tag === "TGt"), eq9(a.end, b.start));
});
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
var mkBinCall = _curry12(4, (fnName, opSpan, left, right) => ECall(ERef(fnName, opSpan), [left, right], None11, spanning(exprSpan(left), exprSpan(right))));
var opFnName = (t) => ((_v) => _v._tag === "TPlus" ? "add" : _v._tag === "TMinus" ? "sub" : _v._tag === "TStar" ? "mul" : _v._tag === "TSlash" ? "div" : _v._tag === "TPercent" ? "mod" : _v._tag === "TAndand" ? "and" : _v._tag === "TOror" ? "or" : _v._tag === "TConcat" ? "concat" : _v._tag === "TEqeq" ? "eq" : _v._tag === "TLt" ? "lt" : _v._tag === "TLte" ? "lte" : _v._tag === "TGt" ? "gt" : _v._tag === "TGte" ? "gte" : "eq")(t);
var isSectionOp = (t) => ((_v) => _v._tag === "TPlus" ? true : _v._tag === "TMinus" ? true : _v._tag === "TStar" ? true : _v._tag === "TSlash" ? true : _v._tag === "TPercent" ? true : _v._tag === "TAndand" ? true : _v._tag === "TOror" ? true : _v._tag === "TConcat" ? true : _v._tag === "TEqeq" ? true : _v._tag === "TNeq" ? true : _v._tag === "TLt" ? true : _v._tag === "TLte" ? true : _v._tag === "TGt" ? true : _v._tag === "TGte" ? true : false)(t);
var sectionBody = _curry12(4, (opTok, x, y, opSpan) => {
  const full = spanning(exprSpan(x), exprSpan(y));
  return opTok._tag === "TNeq" ? ECall(ERef("not", opSpan), [mkBinCall("eq", opSpan, x, y)], None11, full) : mkBinCall(opFnName(opTok), opSpan, x, y);
});
var sectionLeft = _curry12(2, (provided, opLt) => {
  const opSpan = spanOf(opLt);
  const paramRef = ERef("$s", opSpan);
  return ELambda([LPName("$s", None11)], sectionBody(opLt.tok, provided, paramRef, opSpan), spanning(exprSpan(provided), opSpan));
});
var parseRightSection = _curry12(4, (toks, lparenSpan, pos, hooks) => {
  const lt = tokAt(toks, pos);
  return _Result_flatMap5(([y, p1]) => _Result_flatMap5((p2) => ((paramRef) => Ok7(_tuple6(ELambda([LPName("$s", None11)], sectionBody(lt.tok, paramRef, y, spanOf(lt)), toEnd(lparenSpan, toks, p2)), p2)))(ERef("$s", spanOf(lt))), expectTok(TRparen, toks, p1)), parseExpr(toks, pos + 1, hooks));
});
var binCallOrLeftSection = _curry12(7, (toks, left, lt, pos, bp, fnName, hooks) => tokAt(toks, pos + 1).tok._tag === "TRparen" ? Ok7({ left: sectionLeft(left, lt), p: pos + 1, matched: true }) : _Result_flatMap5(([right, p]) => Ok7({ left: mkBinCall(fnName, spanOf(lt), left, right), p, matched: true }), parseExprBp(toks, bp + 1, pos + 1, hooks)));
var isCmpTok = (t) => ((_v) => _v._tag === "TEqeq" ? true : _v._tag === "TNeq" ? true : _v._tag === "TLt" ? true : _v._tag === "TLte" ? true : _v._tag === "TGt" ? true : _v._tag === "TGte" ? true : false)(t);
var cmpFnName = (t) => ((_v) => _v._tag === "TLt" ? "lt" : _v._tag === "TLte" ? "lte" : _v._tag === "TGt" ? "gt" : _v._tag === "TGte" ? "gte" : "eq")(t);
var parseInfix = _curry12(5, (toks, minBp, left, pos, hooks) => {
  const lt = tokAt(toks, pos);
  return and8(lt.tok._tag === "TPipe", PIPE_BP >= minBp) ? _Result_flatMap5(([right, p]) => Ok7({ left: EPipe(left, right, false, spanning(exprSpan(left), exprSpan(right))), p, matched: true }), parseAtomOrCall(toks, pos + 1, hooks)) : and8(lt.tok._tag === "TTarrow", FAST_PIPE_BP >= minBp) ? _Result_flatMap5(([right, p]) => ((_v) => _v._tag === "ECall" ? (({ span: rightSpan }) => Ok7({ left: EPipe(left, right, true, spanning(exprSpan(left), rightSpan)), p, matched: true }))(_v) : errAt("fast pipe needs a call on the right, like `a -> f(b)`", lt))(right), parseAtomOrCall(toks, pos + 1, hooks)) : and8(composeAt(toks, pos), COMPOSE_BP >= minBp) ? _Result_flatMap5(([right, p]) => ((opSpan) => ((xRef) => ((innerCall) => ((outerCall) => ((fn) => Ok7({ left: fn, p, matched: true }))(ELambda([LPName("$x", None11)], outerCall, spanning(exprSpan(left), exprSpan(right)))))(ECall(right, [innerCall], None11, spanning(exprSpan(left), exprSpan(right)))))(ECall(left, [xRef], None11, exprSpan(left))))(ERef("$x", opSpan)))({ start: lt.start, end: lt.start + 2 }), parseExprBp(toks, COMPOSE_BP + 1, pos + 2, hooks)) : and8(and8(isCmpTok(lt.tok), !composeAt(toks, pos)), CMP_BP >= minBp) ? tokAt(toks, pos + 1).tok._tag === "TRparen" ? Ok7({ left: sectionLeft(left, lt), p: pos + 1, matched: true }) : _Result_flatMap5(([right, p]) => ((opSpan) => ((inner) => ((result) => Ok7({ left: result, p, matched: true }))(lt.tok._tag === "TNeq" ? ECall(ERef("not", opSpan), [inner], None11, spanning(exprSpan(left), exprSpan(right))) : inner))(mkBinCall(cmpFnName(lt.tok), opSpan, left, right)))(spanOf(lt)), parseExprBp(toks, CMP_BP + 1, pos + 1, hooks)) : and8(or6(lt.tok._tag === "TAndand", lt.tok._tag === "TOror"), (lt.tok._tag === "TAndand" ? AND_BP : OR_BP) >= minBp) ? ((bp) => ((fnName) => binCallOrLeftSection(toks, left, lt, pos, bp, fnName, hooks))(lt.tok._tag === "TAndand" ? "and" : "or"))(lt.tok._tag === "TAndand" ? AND_BP : OR_BP) : and8(lt.tok._tag === "TConcat", CONCAT_BP >= minBp) ? binCallOrLeftSection(toks, left, lt, pos, CONCAT_BP, "concat", hooks) : and8(lt.tok._tag === "TBacktick", BACKTICK_BP >= minBp) ? _Result_flatMap5(([fnExpr, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([right, p3]) => Ok7({ left: ECall(fnExpr, [left, right], None11, spanning(exprSpan(left), exprSpan(right))), p: p3, matched: true }), parseExprBp(toks, BACKTICK_BP + 1, p2, hooks)), expectTok(TBacktick, toks, p1)), parseAtomOrCall(toks, pos + 1, hooks)) : and8(or6(lt.tok._tag === "TPlus", lt.tok._tag === "TMinus"), ADD_BP >= minBp) ? ((fnName) => binCallOrLeftSection(toks, left, lt, pos, ADD_BP, fnName, hooks))(lt.tok._tag === "TPlus" ? "add" : "sub") : and8(or6(lt.tok._tag === "TStar", or6(lt.tok._tag === "TSlash", lt.tok._tag === "TPercent")), MUL_BP >= minBp) ? ((fnName) => binCallOrLeftSection(toks, left, lt, pos, MUL_BP, fnName, hooks))(lt.tok._tag === "TStar" ? "mul" : lt.tok._tag === "TSlash" ? "div" : "mod") : Ok7({ left, p: pos, matched: false });
});
var infixLoop = _curry12(5, (toks, minBp, left, pos, hooks) => _Result_flatMap5((res) => res.matched ? infixLoop(toks, minBp, res.left, res.p, hooks) : Ok7(_tuple6(res.left, res.p)), parseInfix(toks, minBp, left, pos, hooks)));
var ternaryTail = _curry12(4, (toks, cond, pos, hooks) => tokAt(toks, pos).tok._tag === "TQuestion" ? _Result_flatMap5(([thenE, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([elseE, p3]) => Ok7(_tuple6(ETernary(cond, thenE, elseE, spanning(exprSpan(cond), exprSpan(elseE))), p3)), parseExpr(toks, p2, hooks)), expectTok(TColon, toks, p1)), parseExpr(toks, pos + 1, hooks)) : Ok7(_tuple6(cond, pos)));
var parseExprBp = _curry12(4, (toks, minBp, pos, hooks) => ((_v) => _v._tag === "TLet" ? parseLetIn(toks, pos, hooks) : and8(minBp === 0, looksLikeLambda(toks, pos)) ? parseLambda(toks, pos, hooks) : _Result_flatMap5(([left, p]) => _Result_flatMap5(([left2, p2]) => minBp === 0 ? ternaryTail(toks, left2, p2, hooks) : Ok7(_tuple6(left2, p2)), infixLoop(toks, minBp, left, p, hooks)), parseAtomOrCall(toks, pos, hooks)))(tokAt(toks, pos).tok));
var parseExpr = _curry12(3, (toks, pos, hooks) => parseExprBp(toks, 0, pos, hooks));
var CPPos = (value) => ({ _tag: "CPPos", value });
var CPLab = _curry12(3, (name, value, labelSpan) => ({ _tag: "CPLab", name, value, labelSpan }));
var parseCallPart = _curry12(3, (toks, pos, hooks) => tokAt(toks, pos).tok._tag === "TTilde" ? _Result_flatMap5(([nm, p]) => tokAt(toks, p).tok._tag === "TEq" ? _Result_map5(([v, k]) => _tuple6(CPLab(nm.name, v, nm.span), k), parseExpr(toks, p + 1, hooks)) : Ok7(_tuple6(CPLab(nm.name, ERef(nm.name, nm.span), nm.span), p)), expectLabel(toks, pos + 1)) : _Result_map5(([v, k]) => _tuple6(CPPos(v), k), parseExpr(toks, pos, hooks)));
var callPartSpan = (p) => ((_v) => _v._tag === "CPPos" ? (({ value }) => exprSpan(value))(_v) : _v._tag === "CPLab" ? (({ value, labelSpan }) => spanning(labelSpan, exprSpan(value)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p);
var splitCallParts = _curry12(3, (parts, positional, labeled) => ((_v) => _v.length === 0 ? Ok7(_tuple6(positional, labeled)) : _v.length >= 1 ? (([p, ...rest]) => ((_v) => _v._tag === "CPLab" ? splitCallParts(rest, positional, _Array_append8(p, labeled)) : _v._tag === "CPPos" ? (({ value }) => ((_v) => _v.length === 0 ? splitCallParts(rest, _Array_append8(value, positional), labeled) : errAt("labeled arguments must be a trailing group", callPartSpan(p)))(labeled))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(parts));
var labeledField = (p) => ((_v) => _v._tag === "CPLab" ? (({ name, value, labelSpan }) => ({ name, nameSpan: labelSpan, value }))(_v) : _v._tag === "CPPos" ? (({ value }) => ({ name: "", nameSpan: exprSpan(value), value }))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p);
var unionSpans = _curry12(2, (parts, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([p, ...rest]) => unionSpans(rest, spanning(acc, callPartSpan(p))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(parts));
var callArgsOf = (parts) => _Result_map5(([positional, labeled]) => ((_v) => _v.length === 0 ? _tuple6(positional, None11) : _v.length >= 1 ? (([first, ...rest]) => _tuple6(_Array_append8(ERecord(map6(labeledField, labeled), None11, unionSpans(rest, callPartSpan(first))), positional), Some11("labeled")))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(labeled), splitCallParts(parts, [], []));
var postfixLoop = _curry12(4, (toks, e, pos, hooks) => ((_v) => _v._tag === "TLparen" ? _Result_flatMap5(([parts, p]) => _Result_flatMap5((p2) => _Result_flatMap5(([args, origin]) => postfixLoop(toks, ECall(e, args, origin, toEnd(exprSpan(e), toks, p2)), p2, hooks), callArgsOf(parts)), expectTok(TRparen, toks, p)), listUntilH(TRparen, parseCallPart, toks, pos + 1, hooks)) : _v._tag === "TDot" ? _Result_flatMap5(([id, p]) => postfixLoop(toks, EField(e, id.name, false, spanning(exprSpan(e), id.span)), p, hooks), expectLabel(toks, pos + 1)) : Ok7(_tuple6(e, pos)))(tokAt(toks, pos).tok));
var parseAtomOrCall = _curry12(3, (toks, pos, hooks) => {
  const lt = tokAt(toks, pos);
  return or6(lt.tok._tag === "TMinus", lt.tok._tag === "TBang") ? _Result_flatMap5(([operand, p]) => ((fnName) => Ok7(_tuple6(ECall(ERef(fnName, spanOf(lt)), [operand], None11, spanning(spanOf(lt), exprSpan(operand))), p)))(lt.tok._tag === "TMinus" ? "negate" : "not"), parseAtomOrCall(toks, pos + 1, hooks)) : _Result_flatMap5(([e, p]) => postfixLoop(toks, e, p, hooks), parseAtom(toks, pos, hooks));
});
var parseAtom = _curry12(3, (toks, pos, hooks) => {
  const lt = tokAt(toks, pos);
  const sp = spanOf(lt);
  return ((_v) => _v._tag === "TSwitch" ? parseMatch(toks, pos, hooks) : _v._tag === "TDo" ? parseDo(toks, pos, hooks) : _v._tag === "TLoop" ? parseLoop(toks, pos, hooks) : _v._tag === "TRecur" ? parseRecur(toks, pos, hooks) : _v._tag === "TLbrace" ? parseRecord(toks, pos, hooks) : _v._tag === "TLbracket" ? parseArr(toks, pos, hooks) : _v._tag === "TAt" ? parseList(toks, pos, hooks) : _v._tag === "THash" ? parseHash(toks, pos, hooks) : _v._tag === "TTmplStart" ? parseInterp(toks, pos, hooks) : _Result_flatMap5((claimed) => ((_v) => _v._tag === "Some" ? (({ value: [e, p] }) => Ok7(_tuple6(e, p)))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "TNum" ? (({ value, raw }) => Ok7(_tuple6(ENum(value, raw, sp), pos + 1)))(_v) : _v._tag === "TBool" ? (({ value }) => Ok7(_tuple6(EBool(value, sp), pos + 1)))(_v) : _v._tag === "TStr" ? (({ value }) => Ok7(_tuple6(EStr(value, sp), pos + 1)))(_v) : _v._tag === "TId" ? (({ value: name }) => Ok7(_tuple6(ERef(name, sp), pos + 1)))(_v) : _v._tag === "TLparen" ? ((nxt) => nxt.tok._tag === "TRparen" ? Ok7(_tuple6(EUnit(toEnd(sp, toks, pos + 2)), pos + 2)) : and8(isSectionOp(nxt.tok), nxt.tok._tag !== "TMinus") ? parseRightSection(toks, sp, pos + 1, hooks) : _Result_flatMap5(([first, p]) => tokAt(toks, p).tok._tag === "TComma" ? _Result_flatMap5(([elements, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6(ETuple(elements, toEnd(sp, toks, p3)), p3)), expectTok(TRparen, toks, p2)), sepByH(parseExpr, toks, p + 1, [first], hooks)) : _Result_map5((p2) => _tuple6(first, p2), expectTok(TRparen, toks, p)), parseExpr(toks, pos + 1, hooks)))(tokAt(toks, pos + 1)) : ((t) => errAt(`unexpected token ${tokName(t)}`, lt))(_v))(lt.tok) : (() => {
    throw new Error("non-exhaustive match");
  })())(claimed), runParseHooks(hooks, toks, pos, _curry12(2, (t, p) => parseExpr(t, p, hooks)))))(lt.tok);
});
var parseInterpLoop = _curry12(5, (toks, pos, start, acc, hooks) => _Result_flatMap5(([holeExpr, p]) => ((acc2) => ((lt) => ((_v) => _v._tag === "TTmplMid" ? (({ value }) => parseInterpLoop(toks, p + 1, start, _Array_append8(IPLit(value), acc2), hooks))(_v) : _v._tag === "TTmplEnd" ? (({ value }) => Ok7(_tuple6(EInterp(_Array_append8(IPLit(value), acc2), toEnd(start, toks, p + 1)), p + 1)))(_v) : ((t) => errAt(`expected \${...} to close, got ${tokName(t)}`, lt))(_v))(lt.tok))(tokAt(toks, p)))(_Array_append8(IPExpr(holeExpr), acc)), parseExpr(toks, pos, hooks)));
var parseInterp = _curry12(3, (toks, pos, hooks) => {
  const lt = tokAt(toks, pos);
  return ((_v) => _v._tag === "TTmplStart" ? (({ value }) => parseInterpLoop(toks, pos + 1, spanOf(lt), [IPLit(value)], hooks))(_v) : ((t) => errAt(`expected tmplstart, got ${tokName(t)}`, lt))(_v))(lt.tok);
});
var parseField = _curry12(3, (toks, pos, hooks) => {
  const lt = tokAt(toks, pos);
  return _Result_flatMap5(([nm, p]) => tokAt(toks, p).tok._tag === "TColon" ? _Result_flatMap5(([value, p2]) => Ok7(_tuple6({ name: nm.name, nameSpan: nm.span, value }, p2)), parseExpr(toks, p + 1, hooks)) : keywordText(lt.tok)._tag !== "None" ? errAt(`'${nm.name}' is a keyword — write '${nm.name}: <expr>'`, lt) : Ok7(_tuple6({ name: nm.name, nameSpan: nm.span, value: ERef(nm.name, nm.span) }, p)), expectLabel(toks, pos));
});
var parseRecord = _curry12(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => tokAt(toks, p).tok._tag === "TSpread" ? _Result_flatMap5(([spreadExpr, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([fields, p3]) => _Result_flatMap5((p4) => Ok7(_tuple6(ERecord(fields, Some11(spreadExpr), toEnd(start, toks, p4)), p4)), expectTok(TRbrace, toks, p3)), listUntilH(TRbrace, parseField, toks, p2, hooks)), tokAt(toks, p1).tok._tag === "TRbrace" ? Ok7(p1) : expectTok(TComma, toks, p1)), parseExpr(toks, p + 1, hooks)) : _Result_flatMap5(([fields, p1]) => _Result_flatMap5((p2) => Ok7(_tuple6(ERecord(fields, None11, toEnd(start, toks, p2)), p2)), expectTok(TRbrace, toks, p1)), listUntilH(TRbrace, parseField, toks, p, hooks)), expectTok(TLbrace, toks, pos));
});
var parseSeqElem = _curry12(3, (toks, pos, hooks) => tokAt(toks, pos).tok._tag === "TSpread" ? _Result_flatMap5(([ex, p]) => Ok7(_tuple6(SESpread(ex), p)), parseExpr(toks, pos + 1, hooks)) : _Result_flatMap5(([ex, p]) => Ok7(_tuple6(SEExpr(ex), p)), parseExpr(toks, pos, hooks)));
var parseArr = _curry12(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5(([elements, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6(EArr(elements, toEnd(start, toks, p3)), p3)), expectTok(TRbracket, toks, p2)), listUntilH(TRbracket, parseSeqElem, toks, p, hooks)), expectTok(TLbracket, toks, pos));
});
var parseList = _curry12(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5((p1) => _Result_flatMap5(([elements, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6(EList(elements, toEnd(start, toks, p3)), p3)), expectTok(TRbrace, toks, p2)), listUntilH(TRbrace, parseSeqElem, toks, p1, hooks)), expectTok(TLbrace, toks, p)), expectTok(TAt, toks, pos));
});
var parseMapEntry = _curry12(3, (toks, pos, hooks) => _Result_flatMap5(([key, p]) => _Result_flatMap5((p2) => _Result_flatMap5(([value, p3]) => Ok7(_tuple6({ key, value }, p3)), parseExpr(toks, p2, hooks)), expectTok(TColon, toks, p)), parseExpr(toks, pos, hooks)));
var parseHash = _curry12(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5((p1) => tokAt(toks, p1).tok._tag === "TRbrace" ? _Result_flatMap5((p2) => Ok7(_tuple6(EMap([], toEnd(start, toks, p2)), p2)), expectTok(TRbrace, toks, p1)) : tokAt(toks, p1).tok._tag === "TSpread" ? _Result_flatMap5(([elements, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6(ESet(elements, toEnd(start, toks, p3)), p3)), expectTok(TRbrace, toks, p2)), listUntilH(TRbrace, parseSeqElem, toks, p1, hooks)) : _Result_flatMap5(([first, p2]) => tokAt(toks, p2).tok._tag === "TColon" ? _Result_flatMap5((p3) => _Result_flatMap5(([value, p4]) => _Result_flatMap5(([rest, p5]) => _Result_flatMap5((p6) => Ok7(_tuple6(EMap(_Array_prepend4({ key: first, value }, rest), toEnd(start, toks, p6)), p6)), expectTok(TRbrace, toks, p5)), tokAt(toks, p4).tok._tag === "TComma" ? listUntilH(TRbrace, parseMapEntry, toks, p4 + 1, hooks) : Ok7(_tuple6([], p4))), parseExpr(toks, p3, hooks)), expectTok(TColon, toks, p2)) : _Result_flatMap5(([rest, p3]) => _Result_flatMap5((p4) => Ok7(_tuple6(ESet(_Array_prepend4(SEExpr(first), rest), toEnd(start, toks, p4)), p4)), expectTok(TRbrace, toks, p3)), tokAt(toks, p2).tok._tag === "TComma" ? listUntilH(TRbrace, parseSeqElem, toks, p2 + 1, hooks) : Ok7(_tuple6([], p2))), parseExpr(toks, p1, hooks)), expectTok(TLbrace, toks, p)), expectTok(THash, toks, pos));
});
var parseGuard = _curry12(3, (toks, pos, hooks) => ((_v) => _v._tag === "TId" && _v.value === "when" ? _Result_map5(([g, p]) => _tuple6(Some11(g), p), parseExpr(toks, pos + 1, hooks)) : Ok7(_tuple6(None11, pos)))(tokAt(toks, pos).tok));
var patSpan = (p) => ((_v) => _v._tag === "PWild" ? (({ span: sp }) => sp)(_v) : _v._tag === "PUnit" ? (({ span: sp }) => sp)(_v) : _v._tag === "PBind" ? (({ span: sp }) => sp)(_v) : _v._tag === "PAs" ? (({ span: sp }) => sp)(_v) : _v._tag === "PLit" ? (({ span: sp }) => sp)(_v) : _v._tag === "PBool" ? (({ span: sp }) => sp)(_v) : _v._tag === "PStr" ? (({ span: sp }) => sp)(_v) : _v._tag === "PTuple" ? (({ span: sp }) => sp)(_v) : _v._tag === "PRecord" ? (({ span: sp }) => sp)(_v) : _v._tag === "PCtor" ? (({ span: sp }) => sp)(_v) : _v._tag === "PArr" ? (({ span: sp }) => sp)(_v) : _v._tag === "PList" ? (({ span: sp }) => sp)(_v) : _v._tag === "POr" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p);
var altsLoop = _curry12(4, (toks, pos, acc, lastSpan) => tokAt(toks, pos).tok._tag === "TBar" ? _Result_flatMap5(([alt, p1]) => altsLoop(toks, p1, _Array_append8(alt, acc), patSpan(alt)), parsePattern(toks, pos + 1)) : Ok7(_tuple6(acc, pos, lastSpan)));
var armsLoop = _curry12(4, (toks, pos, acc, hooks) => tokAt(toks, pos).tok._tag === "TBar" ? _Result_flatMap5(([first, p1]) => _Result_flatMap5(([alts, p2, lastSpan]) => ((pattern) => _Result_flatMap5(([guard, p3]) => _Result_flatMap5((p4) => _Result_flatMap5(([body, p5]) => armsLoop(toks, p5, _Array_append8({ pattern, guard, body }, acc), hooks), parseExpr(toks, p4, hooks)), expectTok(TArrow, toks, p3)), parseGuard(toks, p2, hooks)))(length9(alts) === 1 ? first : POr(alts, spanning(patSpan(first), lastSpan))), altsLoop(toks, p1, [first], patSpan(first))), parsePattern(toks, pos + 1)) : Ok7(_tuple6(acc, pos)));
var parseDo = _curry12(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => parseDoBlockFrom(toks, start, p, hooks), expectTok(TDo, toks, pos));
});
var parseDoBlock = _curry12(3, (toks, pos, hooks) => parseDoBlockFrom(toks, spanOf(tokAt(toks, pos)), pos, hooks));
var parseDoBlockFrom = _curry12(4, (toks, start, pos, hooks) => _Result_flatMap5((p1) => tokAt(toks, p1).tok._tag === "TRbrace" ? errAt("do block needs a final expression", tokAt(toks, p1)) : _Result_flatMap5(([exprs, p2]) => tokAt(toks, p2).tok._tag === "TSemi" ? errAt("do block cannot end with a semicolon", tokAt(toks, p2)) : _Result_flatMap5((p3) => Ok7(_tuple6(EDo(exprs, toEnd(start, toks, p3)), p3)), expectTok(TRbrace, toks, p2)), parseDoExprs(toks, p1, [], hooks)), expectTok(TLbrace, toks, pos)));
var parseDoExprs = _curry12(4, (toks, pos, acc, hooks) => _Result_flatMap5(([expr, p]) => ((next) => tokAt(toks, p).tok._tag === "TSemi" ? parseDoExprs(toks, p + 1, next, hooks) : Ok7(_tuple6(next, p)))(_Array_append8(expr, acc)), parseExpr(toks, pos, hooks)));
var parseLoop = _curry12(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5((p1) => _Result_flatMap5(([params, p2]) => _Result_flatMap5((p3) => _Result_flatMap5((p4) => _Result_flatMap5(([body, p5]) => _Result_map5((p6) => _tuple6(ELoop(params, body, toEnd(start, toks, p6)), p6), expectTok(TRbrace, toks, p5)), parseExpr(toks, p4, hooks)), expectTok(TLbrace, toks, p3)), expectTok(TRparen, toks, p2)), loopParamsLoop(toks, p1, [], hooks)), expectTok(TLparen, toks, p)), expectTok(TLoop, toks, pos));
});
var loopParamsLoop = _curry12(4, (toks, pos, acc, hooks) => _Result_flatMap5(([id, pid]) => _Result_flatMap5((p) => _Result_flatMap5(([init, p1]) => ((next) => ((_v) => _v._tag === "TComma" ? loopParamsLoop(toks, p1 + 1, next, hooks) : Ok7(_tuple6(next, p1)))(tokAt(toks, p1).tok))(_Array_append8({ name: id.name, nameSpan: id.span, init }, acc)), parseExpr(toks, p, hooks)), expectTok(TEq, toks, pid)), expectId(toks, pos)));
var parseRecur = _curry12(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5((p1) => ((_v) => _v._tag === "TRparen" ? Ok7(_tuple6(ERecur([], toEnd(start, toks, p1 + 1)), p1 + 1)) : _Result_flatMap5(([args, p2]) => _Result_map5((p3) => _tuple6(ERecur(args, toEnd(start, toks, p3)), p3), expectTok(TRparen, toks, p2)), sepByH(parseExpr, toks, p1, [], hooks)))(tokAt(toks, p1).tok), expectTok(TLparen, toks, p)), expectTok(TRecur, toks, pos));
});
var parseMatch = _curry12(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5(([scrutinee, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([arms, p3]) => ((_v) => _v === 0 ? errAt("switch needs at least one | arm", tokAt(toks, p3)) : _Result_map5((p4) => _tuple6(EMatch(scrutinee, arms, toEnd(start, toks, p4)), p4), expectTok(TRbrace, toks, p3)))(length9(arms)), armsLoop(toks, p2, [], hooks)), expectTok(TLbrace, toks, p1)), parseExpr(toks, p, hooks)), expectTok(TSwitch, toks, pos));
});
var parseCtorArgs = _curry12(5, (toks, ctor, ns, nameSpan, pos) => tokAt(toks, pos).tok._tag === "TLparen" ? _Result_flatMap5(([args, p]) => _Result_flatMap5((p2) => Ok7(_tuple6(PCtor(ctor, args, ns, toEnd(nameSpan, toks, p2)), p2)), expectTok(TRparen, toks, p)), listUntil(TRparen, parsePattern, toks, pos + 1)) : Ok7(_tuple6(PCtor(ctor, [], ns, toEnd(nameSpan, toks, pos)), pos)));
var parsePatternAtom = _curry12(2, (toks, pos) => {
  const lt = tokAt(toks, pos);
  const sp = spanOf(lt);
  return ((_v) => _v._tag === "TNum" ? (({ value, raw }) => Ok7(_tuple6(PLit2(value, raw, sp), pos + 1)))(_v) : _v._tag === "TBool" ? (({ value }) => Ok7(_tuple6(PBool(value, sp), pos + 1)))(_v) : _v._tag === "TStr" ? (({ value }) => Ok7(_tuple6(PStr(value, sp), pos + 1)))(_v) : _v._tag === "TLparen" ? tokAt(toks, pos + 1).tok._tag === "TRparen" ? Ok7(_tuple6(PUnit(toEnd(sp, toks, pos + 2)), pos + 2)) : _Result_flatMap5(([elems, p]) => _Result_flatMap5((p2) => Ok7(((_v) => _v.length === 1 ? (([single]) => _tuple6(single, p2))(_v) : ((many) => _tuple6(PTuple(many, toEnd(sp, toks, p2)), p2))(_v))(elems)), expectTok(TRparen, toks, p)), sepBy(parsePattern, toks, pos + 1, [])) : _v._tag === "TLbrace" ? _Result_flatMap5(([fields, p]) => _Result_flatMap5((p2) => Ok7(_tuple6(PRecord(fields, toEnd(sp, toks, p2)), p2)), expectTok(TRbrace, toks, p)), listUntil(TRbrace, parsePatField, toks, pos + 1)) : _v._tag === "TLbracket" ? parseArrPattern(toks, pos) : _v._tag === "TAt" ? parseListPattern(toks, pos) : _v._tag === "TId" && _v.value === "_" ? Ok7(_tuple6(PWild(sp), pos + 1)) : _v._tag === "TId" ? (({ value: name }) => tokAt(toks, pos + 1).tok._tag === "TDot" ? _Result_flatMap5(([c, p1]) => isUpper(c.name) ? parseCtorArgs(toks, c.name, Some11(name), sp, p1) : errAt(`expected constructor after '${name}.', got '${c.name}'`, tokAt(toks, p1)), expectId(toks, pos + 2)) : isUpper(name) ? parseCtorArgs(toks, name, None11, sp, pos + 1) : Ok7(_tuple6(PBind(name, sp), pos + 1)))(_v) : ((t) => errAt(`unexpected token in pattern: ${tokName(t)}`, lt))(_v))(lt.tok);
});
var parsePattern = _curry12(2, (toks, pos) => _Result_flatMap5(([pat, p]) => ((_v) => _v._tag === "TId" && _v.value === "as" ? _Result_flatMap5(([nm, p2]) => Ok7(_tuple6(PAs(pat, nm.name, nm.span, spanning(patSpan(pat), nm.span)), p2)), expectId(toks, p + 1)) : Ok7(_tuple6(pat, p)))(tokAt(toks, p).tok), parsePatternAtom(toks, pos)));
var restOk = (rest) => ((_v) => _v._tag === "None" ? true : _v._tag === "Some" && _v.value._tag === "PBind" ? true : _v._tag === "Some" && _v.value._tag === "PWild" ? true : _v._tag === "Some" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(rest);
var patElemsLoop = _curry12(3, (toks, pos, acc) => ((_v) => _v._tag === "TSpread" ? _Result_flatMap5(([rest, p]) => Ok7(_tuple6(acc, Some11(rest), p)), parsePattern(toks, pos + 1)) : _Result_flatMap5(([pat, p]) => ((elems) => tokAt(toks, p).tok._tag === "TComma" ? patElemsLoop(toks, p + 1, elems) : Ok7(_tuple6(elems, None11, p)))(_Array_append8(pat, acc)), parsePattern(toks, pos)))(tokAt(toks, pos).tok));
var parseArrPattern = _curry12(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => tokAt(toks, p).tok._tag === "TRbracket" ? Ok7(_tuple6(PArr([], None11, toEnd(start, toks, p + 1)), p + 1)) : _Result_flatMap5(([elems, rest, p2]) => restOk(rest) ? _Result_map5((p3) => _tuple6(PArr(elems, rest, toEnd(start, toks, p3)), p3), expectTok(TRbracket, toks, p2)) : errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2)), patElemsLoop(toks, p, [])), expectTok(TLbracket, toks, pos));
});
var parseListPattern = _curry12(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5((p1) => tokAt(toks, p1).tok._tag === "TRbrace" ? Ok7(_tuple6(PList([], None11, toEnd(start, toks, p1 + 1)), p1 + 1)) : _Result_flatMap5(([elems, rest, p2]) => restOk(rest) ? _Result_map5((p3) => _tuple6(PList(elems, rest, toEnd(start, toks, p3)), p3), expectTok(TRbrace, toks, p2)) : errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2)), patElemsLoop(toks, p1, [])), expectTok(TLbrace, toks, p)), expectTok(TAt, toks, pos));
});
var parsePatField = _curry12(2, (toks, pos) => {
  const lt = tokAt(toks, pos);
  return _Result_flatMap5(([nm, p]) => tokAt(toks, p).tok._tag === "TColon" ? _Result_flatMap5(([pat, p2]) => Ok7(_tuple6({ label: nm.name, labelSpan: nm.span, pat }, p2)), parsePattern(toks, p + 1)) : keywordText(lt.tok)._tag !== "None" ? errAt(`'${nm.name}' is a keyword — write '${nm.name}: <pattern>'`, lt) : Ok7(_tuple6({ label: nm.name, labelSpan: nm.span, pat: PBind(nm.name, nm.span) }, p)), expectLabel(toks, pos));
});
var parseTypeAtom = _curry12(2, (toks, pos) => {
  const lt = tokAt(toks, pos);
  const sp = spanOf(lt);
  return ((_v) => _v._tag === "TLparen" ? tokAt(toks, pos + 1).tok._tag === "TRparen" ? Ok7(_tuple6(TyName("unit", toEnd(sp, toks, pos + 2)), pos + 2)) : _Result_flatMap5(([inner, p]) => tokAt(toks, p).tok._tag === "TComma" ? _Result_flatMap5(([elems, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6(TyTuple(elems, toEnd(sp, toks, p3)), p3)), expectTok(TRparen, toks, p2)), sepBy(parseTypeExpr, toks, p + 1, [inner])) : _Result_map5((p2) => _tuple6(inner, p2), expectTok(TRparen, toks, p)), parseTypeExpr(toks, pos + 1)) : _v._tag === "TLbracket" ? _Result_flatMap5(([elem, p]) => _Result_flatMap5((p2) => Ok7(_tuple6(TyList(elem, toEnd(sp, toks, p2)), p2)), expectTok(TRbracket, toks, p)), parseTypeExpr(toks, pos + 1)) : _v._tag === "TStr" ? (({ value }) => Ok7(_tuple6(TyLit(value, sp), pos + 1)))(_v) : _Result_flatMap5(([nm, p]) => and8(isUpper(nm.name), tokAt(toks, p).tok._tag === "TDot") ? _Result_flatMap5(([q, p2]) => isUpper(q.name) ? Ok7(_tuple6(TyQual(nm.name, q.name, q.span, [], spanning(nm.span, q.span)), p2)) : errAt(`a type variable cannot be qualified; expected a constructor after '${nm.name}.', got '${q.name}'`, tokAt(toks, p2)), expectId(toks, p + 1)) : Ok7(_tuple6(TyName(nm.name, nm.span), p)), expectId(toks, pos)))(lt.tok);
});
var startsTypeAtom = (t) => ((_v) => _v._tag === "TId" ? true : _v._tag === "TLparen" ? true : _v._tag === "TLbracket" ? true : _v._tag === "TStr" ? true : false)(t);
var legacyTypeArgsLoop = _curry12(4, (toks, pos, acc, lastSp) => startsTypeAtom(tokAt(toks, pos).tok) ? _Result_flatMap5(([a, p]) => legacyTypeArgsLoop(toks, p, _Array_append8(a, acc), Some11(tySpan(a))), parseTypeAtom(toks, pos)) : Ok7(_tuple6(acc, lastSp, pos)));
var parseTypeApp = _curry12(2, (toks, pos) => _Result_flatMap5(([head, p]) => ((_v) => _v._tag === "TyName" && (({ name, span: sp }) => isUpper(name))(_v) ? (({ name, span: sp }) => tokAt(toks, p).tok._tag === "TLt" ? _Result_flatMap5(([args, p1]) => _Result_flatMap5((p2) => Ok7(_tuple6(TyApp(name, args, toEnd(sp, toks, p2)), p2)), expectTok(TGt, toks, p1)), listUntil(TGt, parseTypeExpr, toks, p + 1)) : _Result_flatMap5(([args, lastSp, p2]) => Ok7(((_v) => _v._tag === "None" ? _tuple6(head, p2) : _v._tag === "Some" ? (({ value: ls }) => _tuple6(TyApp(name, args, spanning(sp, ls)), p2))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(lastSp)), legacyTypeArgsLoop(toks, p, [], None11)))(_v) : _v._tag === "TyQual" ? (({ alias, name: nm, nameSpan, span: sp }) => tokAt(toks, p).tok._tag === "TLt" ? _Result_flatMap5(([args, p1]) => _Result_flatMap5((p2) => Ok7(_tuple6(TyQual(alias, nm, nameSpan, args, toEnd(sp, toks, p2)), p2)), expectTok(TGt, toks, p1)), listUntil(TGt, parseTypeExpr, toks, p + 1)) : _Result_flatMap5(([args, lastSp, p2]) => Ok7(((_v) => _v._tag === "None" ? _tuple6(head, p2) : _v._tag === "Some" ? (({ value: ls }) => _tuple6(TyQual(alias, nm, nameSpan, args, spanning(sp, ls)), p2))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(lastSp)), legacyTypeArgsLoop(toks, p, [], None11)))(_v) : Ok7(_tuple6(head, p)))(head), parseTypeAtom(toks, pos)));
var parseTypeUnionRest = _curry12(4, (toks, pos, acc, lastSp) => tokAt(toks, pos).tok._tag === "TBar" ? _Result_flatMap5(([m, p]) => parseTypeUnionRest(toks, p, _Array_append8(m, acc), tySpan(m)), parseTypeApp(toks, pos + 1)) : Ok7(_tuple6(acc, lastSp, pos)));
var parseTypeUnion = _curry12(2, (toks, pos) => _Result_flatMap5(([first, p]) => tokAt(toks, p).tok._tag === "TBar" ? _Result_flatMap5(([members, lastSp, p2]) => Ok7(_tuple6(TyUnion(members, spanning(tySpan(first), lastSp)), p2)), parseTypeUnionRest(toks, p, [first], tySpan(first))) : Ok7(_tuple6(first, p)), parseTypeApp(toks, pos)));
var parseTypeExpr = _curry12(2, (toks, pos) => _Result_flatMap5(([from, p]) => tokAt(toks, p).tok._tag === "TTarrow" ? _Result_flatMap5(([to, p2]) => Ok7(_tuple6(TyArrow(from, to, spanning(tySpan(from), tySpan(to))), p2)), parseTypeExpr(toks, p + 1)) : Ok7(_tuple6(from, p)), parseTypeUnion(toks, pos)));
var parseCtorField = _curry12(2, (toks, pos) => {
  const isLabel = ((_v) => _v._tag === "TId" ? tokAt(toks, pos + 1).tok._tag === "TColon" : false)(tokAt(toks, pos).tok);
  return isLabel ? _Result_flatMap5(([nm, p]) => _Result_flatMap5(([t, p2]) => Ok7(_tuple6({ name: Some11(nm.name), fieldType: t }, p2)), parseTypeExpr(toks, p + 1)), expectId(toks, pos)) : _Result_map5(([t, p]) => _tuple6({ name: None11, fieldType: t }, p), parseTypeExpr(toks, pos));
});
var parseCtor = _curry12(2, (toks, pos) => _Result_flatMap5(([nm, p]) => tokAt(toks, p).tok._tag === "TLparen" ? _Result_flatMap5(([fields, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6({ name: nm.name, fields, span: toEnd(nm.span, toks, p3) }, p3)), expectTok(TRparen, toks, p2)), listUntil(TRparen, parseCtorField, toks, p + 1)) : Ok7(_tuple6({ name: nm.name, fields: [], span: nm.span }, p)), expectId(toks, pos)));
var ctorsLoop = _curry12(3, (toks, pos, acc) => _Result_flatMap5(([c, p]) => ((cs) => tokAt(toks, p).tok._tag === "TBar" ? ctorsLoop(toks, p + 1, cs) : Ok7(_tuple6(cs, p)))(_Array_append8(c, acc)), parseCtor(toks, pos)));
var parseAliasField = _curry12(2, (toks, pos) => _Result_flatMap5(([nm, p]) => ((optional) => ((p1) => _Result_flatMap5((p2) => _Result_flatMap5(([t, p3]) => Ok7(_tuple6({ name: nm.name, nameSpan: nm.span, fieldType: t, optional }, p3)), parseTypeExpr(toks, p2)), expectTok(TColon, toks, p1)))(optional ? p + 1 : p))(tokAt(toks, p).tok._tag === "TQuestion"), expectLabel(toks, pos)));
var parseAliasBody = _curry12(2, (toks, pos) => _Result_flatMap5((p) => _Result_flatMap5(([fields, p2]) => _Result_flatMap5((p3) => Ok7(_tuple6(fields, p3)), expectTok(TRbrace, toks, p2)), listUntil(TRbrace, parseAliasField, toks, p)), expectTok(TLbrace, toks, pos)));
var typeParamsLoop = _curry12(3, (toks, pos, acc) => ((_v) => _v._tag === "TId" ? (({ value: name }) => typeParamsLoop(toks, pos + 1, _Array_append8(name, acc)))(_v) : Ok7(_tuple6(acc, pos)))(tokAt(toks, pos).tok));
var parseTypeParams = _curry12(2, (toks, pos) => tokAt(toks, pos).tok._tag === "TLt" ? _Result_flatMap5(([names, p]) => _Result_map5((p2) => _tuple6(map6((n) => n.name, names), p2), expectTok(TGt, toks, p)), listUntil(TGt, expectId, toks, pos + 1)) : typeParamsLoop(toks, pos, []));
var startsTypeSynonym = (t) => ((_v) => _v._tag === "TStr" ? true : _v._tag === "TLparen" ? true : _v._tag === "TLbracket" ? true : false)(t);
var parseType = _curry12(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5(([nm, p1]) => _Result_flatMap5(([params, p2]) => _Result_flatMap5((p3) => tokAt(toks, p3).tok._tag === "TLbrace" ? _Result_map5(([alias, p4]) => _tuple6(SType(nm.name, nm.span, params, [], Some11(alias), None11, false, None11, toEnd(start, toks, p4)), p4), parseAliasBody(toks, p3)) : startsTypeSynonym(tokAt(toks, p3).tok) ? _Result_flatMap5(([te, p4]) => Ok7(_tuple6(SType(nm.name, nm.span, params, [], None11, Some11(te), false, None11, toEnd(start, toks, p4)), p4)), parseTypeExpr(toks, p3)) : ((afterBar) => _Result_map5(([ctors, p4]) => _tuple6(SType(nm.name, nm.span, params, ctors, None11, None11, false, None11, toEnd(start, toks, p4)), p4), ctorsLoop(toks, afterBar, [])))(tokAt(toks, p3).tok._tag === "TBar" ? p3 + 1 : p3), expectTok(TEq, toks, p2)), parseTypeParams(toks, p1)), expectId(toks, p)), expectTok(TType, toks, pos));
});
var parseExtern = _curry12(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => tokAt(toks, p).tok._tag === "TType" ? _Result_flatMap5((p1) => _Result_flatMap5(([nm, p2]) => Ok7(_tuple6(SType(nm.name, nm.span, [], [], None11, None11, false, None11, toEnd(start, toks, p2)), p2)), expectId(toks, p1)), expectTok(TType, toks, p)) : _Result_flatMap5(([nm, p1]) => _Result_flatMap5(([params, p2]) => _Result_flatMap5((p3) => _Result_flatMap5(([t, p4]) => _Result_flatMap5((p5) => ((isCurried) => ((pConv) => ((nextTok) => or6(or6(or6(or6(eq9(nextTok, TId("global")), eq9(nextTok, TId("send"))), eq9(nextTok, TId("get"))), eq9(nextTok, TId("set"))), eq9(nextTok, TId("new"))) ? isCurried ? errAt("'curried' applies to a module extern, not a JS convention — give the host's module and export instead", tokAt(toks, pConv)) : _Result_flatMap5(([convention, p6]) => _Result_flatMap5(([first, p7]) => ((hasSecond) => _Result_flatMap5(([second, p8]) => Ok7(_tuple6(SExtern(nm.name, nm.span, params, t, `mochi:${convention.name}:${first}`, second, false, false, None11, toEnd(start, toks, p8)), p8)), hasSecond ? expectStr(toks, p7) : Ok7(_tuple6("", p7))))(((_v) => _v._tag === "TStr" ? or6(convention.name === "global", convention.name === "new") : false)(tokAt(toks, p7).tok)), expectStr(toks, p6)), expectId(toks, pConv)) : _Result_flatMap5(([moduleName, p6]) => _Result_flatMap5(([importedName, p7]) => Ok7(_tuple6(SExtern(nm.name, nm.span, params, t, moduleName, importedName, isCurried, false, None11, toEnd(start, toks, p7)), p7)), expectStr(toks, p6)), expectStr(toks, pConv)))(tokAt(toks, pConv).tok))(isCurried ? p5 + 1 : p5))(eq9(tokAt(toks, p5).tok, TId("curried"))), expectTok(TEq, toks, p4)), parseTypeExpr(toks, p3)), expectTok(TColon, toks, p2)), tokAt(toks, p1).tok._tag === "TLt" ? _Result_flatMap5(([names, pParams]) => _Result_flatMap5((pAfter) => Ok7(_tuple6(map6((n) => n.name, names), pAfter)), expectTok(TGt, toks, pParams)), listUntil(TGt, expectId, toks, p1 + 1)) : Ok7(_tuple6([], p1))), expectId(toks, p)), expectTok(TExtern, toks, pos));
});
var parseImportNs = _curry12(3, (toks, start, pos) => _Result_flatMap5(([asKw, p1]) => asKw.name === "as" ? _Result_flatMap5(([alias, p2]) => _Result_flatMap5(([kw, p3]) => kw.name === "from" ? _Result_map5(([path, p4]) => _tuple6(SImportNs(alias, path, toEnd(start, toks, p4)), p4), expectStr(toks, p3)) : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt(toks, p3)), expectId(toks, p2)), expectId(toks, p1)) : errAt(`expected 'as' in namespace import, got '${asKw.name}'`, tokAt(toks, p1)), expectId(toks, pos)));
var parseImport = _curry12(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => tokAt(toks, p).tok._tag === "TStar" ? _Result_flatMap5((p1) => parseImportNs(toks, start, p1), expectTok(TStar, toks, p)) : _Result_flatMap5((p1) => _Result_flatMap5(([names, p2]) => _Result_flatMap5((p3) => _Result_flatMap5(([kw, p4]) => kw.name === "from" ? _Result_map5(([path, p5]) => _tuple6(SImport(names, path, toEnd(start, toks, p5)), p5), expectStr(toks, p4)) : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt(toks, p4)), expectId(toks, p3)), expectTok(TRbrace, toks, p2)), listUntil(TRbrace, expectId, toks, p1)), expectTok(TLbrace, toks, p)), expectTok(TImport, toks, pos));
});
var parseRecordDestructure = _curry12(5, (toks, start, pos, tmp, hooks) => {
  const openSp = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => _Result_flatMap5(([fields, p1]) => ((closeSp) => _Result_flatMap5((p2) => _Result_flatMap5((p3) => _Result_flatMap5(([value, p4]) => ((whole) => ((patSpan) => ((tmpName) => ((header) => ((access) => Ok7(_tuple6(_Array_prepend4(header, map6(access, fields)), p4, tmp + 1)))((f) => SLet(f.name, f.span, None11, EField(ERef(tmpName, f.span), f.name, false, f.span), false, None11, f.span)))(SLet(tmpName, patSpan, None11, value, false, None11, whole)))(`$d${show4(tmp)}`))(spanning(openSp, closeSp)))(toEnd(start, toks, p4)), parseExpr(toks, p3, hooks)), expectTok(TEq, toks, p2)), expectTok(TRbrace, toks, p1)))(spanOf(tokAt(toks, p1))), listUntil(TRbrace, expectId, toks, p)), expectTok(TLbrace, toks, pos));
});
var parseLet = _curry12(4, (toks, pos, tmp, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap5((p) => tokAt(toks, p).tok._tag === "TLbrace" ? parseRecordDestructure(toks, start, p, tmp, hooks) : _Result_flatMap5(([nm, p1]) => _Result_flatMap5(([annot, pA]) => _Result_flatMap5((p2) => _Result_flatMap5(([value, p3]) => Ok7(_tuple6([SLet(nm.name, nm.span, annot, value, false, None11, toEnd(start, toks, p3))], p3, tmp)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, pA)), tokAt(toks, p1).tok._tag === "TColon" ? _Result_map5(([ty, p]) => _tuple6(Some11(ty), p), parseTypeExpr(toks, p1 + 1)) : Ok7(_tuple6(None11, p1))), expectId(toks, p)), expectTok(TLet, toks, pos));
});
var setLetMeta = _curry12(3, (exported, doc, s) => ((_v) => _v._tag === "SLet" ? (({ name, nameSpan, annot, value, span }) => SLet(name, nameSpan, annot, value, exported, doc, span))(_v) : ((other) => other)(_v))(s));
var setTypeMeta = _curry12(3, (exported, doc, s) => ((_v) => _v._tag === "SType" ? (({ name, nameSpan, params, ctors, alias, aliasType, span }) => SType(name, nameSpan, params, ctors, alias, aliasType, exported, doc, span))(_v) : ((other) => other)(_v))(s));
var setExternMeta = _curry12(3, (exported, doc, s) => ((_v) => _v._tag === "SExtern" ? (({ name, nameSpan, params, typeExpr: t, module: m, imported: i, curried, span }) => SExtern(name, nameSpan, params, t, m, i, curried, exported, doc, span))(_v) : _v._tag === "SType" ? (({ name, nameSpan, params, ctors, alias, aliasType, span }) => SType(name, nameSpan, params, ctors, alias, aliasType, exported, doc, span))(_v) : ((other) => other)(_v))(s));
var parseExprStmt = _curry12(4, (toks, pos, tmp, hooks) => {
  const start = tokAt(toks, pos);
  return _Result_flatMap5(([value, p]) => ((p2) => Ok7(_tuple6([SExpr(value, toEnd(spanOf(start), toks, p))], p2, tmp)))(tokAt(toks, p).tok._tag === "TSemi" ? p + 1 : p), parseExpr(toks, pos, hooks));
});
var parseStmt = _curry12(4, (toks, pos, tmp, hooks) => {
  const lt = tokAt(toks, pos);
  const doc = lt.doc;
  return ((_v) => _v._tag === "TImport" ? _Result_map5(([s, p]) => _tuple6([s], p, tmp), parseImport(toks, pos)) : _v._tag === "TExport" ? ((exportSp) => ((_v) => _v._tag === "TType" ? _Result_map5(([s, p]) => _tuple6([widenToExport(exportSp, setTypeMeta(true, doc, s))], p, tmp), parseType(toks, pos + 1)) : _v._tag === "TExtern" ? _Result_map5(([s, p]) => _tuple6([widenToExport(exportSp, setExternMeta(true, doc, s))], p, tmp), parseExtern(toks, pos + 1)) : _v._tag === "TLet" ? _Result_map5(([stmts, p, tmp2]) => _tuple6(widenHeadToExport(exportSp, map6(setLetMeta(true, doc), stmts)), p, tmp2), parseLet(toks, pos + 1, tmp, hooks)) : errAt("`export` must precede let, type, or extern", tokAt(toks, pos + 1)))(tokAt(toks, pos + 1).tok))(spanOf(lt)) : _v._tag === "TType" ? _Result_map5(([s, p]) => _tuple6([setTypeMeta(false, doc, s)], p, tmp), parseType(toks, pos)) : _v._tag === "TExtern" ? _Result_map5(([s, p]) => _tuple6([setExternMeta(false, doc, s)], p, tmp), parseExtern(toks, pos)) : _v._tag === "TLet" ? _Result_map5(([stmts, p, tmp2]) => _tuple6(map6(setLetMeta(false, doc), stmts), p, tmp2), parseLet(toks, pos, tmp, hooks)) : parseExprStmt(toks, pos, tmp, hooks))(lt.tok);
});
var widenToExport = _curry12(2, (start, s) => ((_v) => _v._tag === "SLet" ? (({ name, nameSpan, annot, value, exported, doc, span }) => SLet(name, nameSpan, annot, value, exported, doc, spanning(start, span)))(_v) : _v._tag === "SType" ? (({ name, nameSpan, params, ctors, alias, aliasType, exported, doc, span }) => SType(name, nameSpan, params, ctors, alias, aliasType, exported, doc, spanning(start, span)))(_v) : _v._tag === "SExtern" ? (({ name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span }) => SExtern(name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, spanning(start, span)))(_v) : ((other) => other)(_v))(s));
var widenHeadToExport = _curry12(2, (start, stmts) => ((_v) => _v.length >= 1 ? (([head, ...rest]) => _Array_prepend4(widenToExport(start, head), rest))(_v) : stmts)(stmts));
var isSyncTok = (t) => ((_v) => _v._tag === "TLet" ? true : _v._tag === "TType" ? true : _v._tag === "TExtern" ? true : _v._tag === "TImport" ? true : _v._tag === "TExport" ? true : false)(t);
var isOpener = (t) => or6(or6(t._tag === "TLparen", t._tag === "TLbrace"), t._tag === "TLbracket");
var isCloser = (t) => or6(or6(t._tag === "TRparen", t._tag === "TRbrace"), t._tag === "TRbracket");
var maxParseErrors = 100;
var resumeAt = _curry12(3, (toks, pos, at) => and8(lt4(pos + 1, length9(toks)), lt4(tokAt(toks, pos).start, at)) ? resumeAt(toks, pos + 1, at) : pos);
var skipToSync = _curry12(3, (toks, pos, depth) => {
  const t = tokAt(toks, pos).tok;
  return or6(t._tag === "TEof", and8(depth === 0, isSyncTok(t))) ? pos : skipToSync(toks, pos + 1, isOpener(t) ? depth + 1 : and8(isCloser(t), depth > 0) ? depth - 1 : depth);
});
var recoverFrom = _curry12(4, (toks, before, failedAt, at) => {
  const resume = resumeAt(toks, before, at);
  const start = eq9(resume, before) ? before + 1 : resume;
  const final = skipToSync(toks, start, 0);
  return { node: SError({ start: failedAt.start, end: tokAt(toks, final - 1).end }), pos: final };
});
var stmtsLoop = _curry12(6, (toks, pos0, tmp0, acc0, diags0, hooks) => {
  let pos = pos0;
  let tmp = tmp0;
  let acc = acc0;
  let diags = diags0;
  while (true) {
    if (tokAt(toks, pos).tok._tag === "TEof") {
      return { stmts: acc, diagnostics: diags };
    } else {
      {
        const failedAt = tokAt(toks, pos);
        const _step = ((_v) => _v._tag === "Ok" ? (({ value: [stmts, p, tmp2] }) => eq9(p, pos) ? ((r) => _recur5(r.pos, tmp, _Array_append8(r.node, acc), _Array_append8({ message: `unexpected token ${tokName(failedAt.tok)}`, start: failedAt.start, end: failedAt.end }, diags)))(recoverFrom(toks, pos, failedAt, failedAt.start)) : _recur5(p, tmp2, _Array_concat5(acc, stmts), diags))(_v) : _v._tag === "Err" ? (({ error: d }) => ((ds) => length9(ds) >= maxParseErrors ? _done5({ stmts: _Array_append8(SError({ start: failedAt.start, end: tokAt(toks, length9(toks) - 1).end }), acc), diagnostics: _Array_append8({ message: "too many parse errors; stopping", start: failedAt.start, end: failedAt.end }, ds) }) : ((r) => _recur5(r.pos, tmp, _Array_append8(r.node, acc), ds))(recoverFrom(toks, pos, failedAt, d.start)))(_Array_append8(d, diags)))(_v) : (() => {
          throw new Error("non-exhaustive match");
        })())(parseStmt(toks, pos, tmp, hooks));
        if (_step._tag === "recur") {
          [pos, tmp, acc, diags] = _step.args;
          continue;
        }
        return _step.value;
      }
    }
  }
});
var parseRecovering = _curry12(2, (toks, pluginsOpt) => {
  const hooks = parseHooksOf(resolvePluginsDefault(pluginsOpt));
  return stmtsLoop(toks, ((_v) => _v._tag === "TStr" ? (({ value }) => value === "use open" ? 1 : 0)(_v) : 0)(tokAt(toks, 0).tok), 0, [], [], hooks);
});
var parseWith = _curry12(2, (toks, pluginsOpt) => {
  const r = parseRecovering(toks, pluginsOpt);
  return ((_v) => _v._tag === "Some" ? (({ value: d }) => Err7(d))(_v) : _v._tag === "None" ? Ok7(r.stmts) : (() => {
    throw new Error("non-exhaustive match");
  })())(_Array_get10(0, r.diagnostics));
});

import { Err as Err8, None as None13, Ok as Ok8, Some as Some13, _Array_append as _Array_append10, _Array_contains as _Array_contains3, _Array_flatMap as _Array_flatMap4, _Array_get as _Array_get12, _Array_head as _Array_head3, _Map_get as _Map_get5, _Map_getOr as _Map_getOr4, _Map_has as _Map_has3, _Map_keys as _Map_keys5, _Map_set as _Map_set4, _Option_isNone, _Option_isSome as _Option_isSome3, _Option_orElse, _Option_unwrapOr as _Option_unwrapOr8, _Result_flatMap as _Result_flatMap6, _Set_add as _Set_add2, _Set_fromArray as _Set_fromArray2, _Set_has as _Set_has2, _Str_codeAt as _Str_codeAt6, _Str_join as _Str_join5, _curry as _curry14, _done as _done6, _recur as _recur6, _tuple as _tuple7, and as and10, eq as eq11, filter as filter5, length as length11, map as map8, or as or7, show as show6 } from "@mochi/compiler/runtime";
import { match as match6 } from "@onrails/pattern";

import { None as None12, Some as Some12, _Array_append as _Array_append9, _Array_concat as _Array_concat6, _Array_contains as _Array_contains2, _Array_drop, _Array_flatMap as _Array_flatMap3, _Array_get as _Array_get11, _Array_head as _Array_head2, _Array_prepend as _Array_prepend5, _Array_tail as _Array_tail2, _Array_take as _Array_take2, _Map_get as _Map_get4, _Map_getOr as _Map_getOr3, _Map_keys as _Map_keys4, _Option_isSome as _Option_isSome2, _Option_unwrapOr as _Option_unwrapOr7, _Str_concat, _Str_endsWith, _Str_join as _Str_join4, _curry as _curry13, and as and9, eq as eq10, filter as filter4, length as length10, map as map7, reduce as reduce3, show as show5, sub as sub5 } from "@mochi/compiler/runtime";
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
var isWildMP = (mp) => ((_v) => _v._tag === "MWild" ? true : false)(mp);
var explodePat = (p) => ((_v) => _v._tag === "PAs" ? (({ pat }) => explodePat(pat))(_v) : _v._tag === "POr" ? (({ alts }) => _Array_flatMap3(explodePat, alts))(_v) : [p])(p);
var toMP = (p) => ((_v) => _v._tag === "PAs" ? (({ pat }) => toMP(pat))(_v) : _v._tag === "PWild" ? MWild : _v._tag === "PUnit" ? MWild : _v._tag === "PBind" ? MWild : _v._tag === "PLit" ? (({ value: v }) => MNum(v))(_v) : _v._tag === "PBool" ? (({ value: v }) => MBool(v))(_v) : _v._tag === "PStr" ? (({ value: v }) => MStr(v))(_v) : _v._tag === "PTuple" ? (({ elems }) => MTuple(map7(toMP, elems)))(_v) : _v._tag === "PCtor" ? (({ ctor: name, args }) => MCtor(name, map7(toMP, args)))(_v) : _v._tag === "PRecord" ? (({ fields }) => MRecord(map7((f) => f.label, fields), map7((f) => toMP(f.pat), fields)))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => MArr(map7(toMP, elems), _Option_isSome2(rest)))(_v) : _v._tag === "PList" ? MOpaque : _v._tag === "POr" ? MOpaque : (() => {
  throw new Error("non-exhaustive match");
})())(p);
var headOf = (mp) => ((_v) => _v._tag === "MWild" ? None12 : _v._tag === "MOpaque" ? None12 : _v._tag === "MCtor" ? (({ name: n }) => Some12(HCtor(n)))(_v) : _v._tag === "MBool" ? (({ value: v }) => Some12(HBool(v)))(_v) : _v._tag === "MNum" ? (({ value: v }) => Some12(HNum(v)))(_v) : _v._tag === "MStr" ? (({ value: v }) => Some12(HStr(v)))(_v) : _v._tag === "MTuple" ? (({ elems }) => Some12(HTuple(length10(elems))))(_v) : _v._tag === "MRecord" ? Some12(HRecord) : _v._tag === "MArr" ? (({ elems }) => Some12(HArr(length10(elems))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(mp);
var colOf = (m) => _Array_flatMap3((row) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: hd }) => [hd])(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_head2(row)), m);
var headsOf = (col) => _Array_flatMap3((mp) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: h }) => [h])(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(headOf(mp)), col);
var addLabel = _curry13(2, (acc, l) => _Array_contains2(l, acc) ? acc : _Array_append9(l, acc));
var labelsOfMP = _curry13(2, (acc, mp) => ((_v) => _v._tag === "MRecord" ? (({ labels: ls }) => reduce3(addLabel, acc, ls))(_v) : acc)(mp));
var recordLabelsOf = (col) => reduce3(labelsOfMP, [], col);
var indexOfLabel = _curry13(3, (l, labels, i) => ((_v) => _v._tag === "None" ? sub5(0, 1) : _v._tag === "Some" ? (({ value: x }) => eq10(x, l) ? i : indexOfLabel(l, labels, i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(i, labels)));
var fieldOf = _curry13(3, (l, labels, pats) => {
  const i = indexOfLabel(l, labels, 0);
  return i < 0 ? MWild : _Option_unwrapOr7(MWild, _Array_get11(i, pats));
});
var arrShapeStep = _curry13(2, (acc, mp) => ((_v) => _v._tag === "MArr" ? (({ elems, rest }) => ((n) => rest ? { fixed: acc.fixed, restFrom: ((_v) => _v._tag === "None" ? Some12(n) : _v._tag === "Some" ? (({ value: m }) => Some12(m < n ? m : n))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(acc.restFrom) } : { fixed: _Array_contains2(n, acc.fixed) ? acc.fixed : _Array_append9(n, acc.fixed), restFrom: acc.restFrom })(length10(elems)))(_v) : acc)(mp));
var arrShapeOf = (col) => reduce3(arrShapeStep, { fixed: [], restFrom: None12 }, col);
var rangeCovered = _curry13(3, (shape, i, n) => i >= n ? true : and9(_Array_contains2(i, shape.fixed), rangeCovered(shape, i + 1, n)));
var arrComplete = (shape) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" ? (({ value: r }) => rangeCovered(shape, 0, r))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(shape.restFrom);
var arrMissingLen = _curry13(2, (shape, n) => and9(!_Array_contains2(n, shape.fixed), ((_v) => _v._tag === "None" ? true : _v._tag === "Some" ? (({ value: r }) => n < r)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(shape.restFrom)) ? n : arrMissingLen(shape, n + 1));
var rangeArr = _curry13(2, (i, top) => i > top ? [] : _Array_prepend5(i, rangeArr(i + 1, top)));
var arrLengths = (shape) => {
  const top = reduce3(_curry13(2, (a, x) => x > a ? x : a), _Option_unwrapOr7(0, shape.restFrom), shape.fixed);
  return rangeArr(0, top);
};
var specializeRow = _curry13(3, (h, mp, labels) => ((_v) => _v._tag === "HCtor" ? (({ name }) => ((_v) => _v._tag === "MCtor" ? (({ name: n, args }) => eq10(n, name) ? Some12(args) : None12)(_v) : None12)(mp))(_v) : _v._tag === "HBool" ? (({ value: v }) => ((_v) => _v._tag === "MBool" ? (({ value: b }) => eq10(b, v) ? Some12([]) : None12)(_v) : None12)(mp))(_v) : _v._tag === "HNum" ? (({ value: v }) => ((_v) => _v._tag === "MNum" ? (({ value: x }) => eq10(x, v) ? Some12([]) : None12)(_v) : None12)(mp))(_v) : _v._tag === "HStr" ? (({ value: v }) => ((_v) => _v._tag === "MStr" ? (({ value: x }) => eq10(x, v) ? Some12([]) : None12)(_v) : None12)(mp))(_v) : _v._tag === "HTuple" ? ((_v) => _v._tag === "MTuple" ? (({ elems }) => Some12(elems))(_v) : None12)(mp) : _v._tag === "HRecord" ? ((_v) => _v._tag === "MRecord" ? (({ labels: ls, pats: ps }) => Some12(map7((l) => fieldOf(l, ls, ps), labels)))(_v) : None12)(mp) : _v._tag === "HArr" ? (({ len }) => ((_v) => _v._tag === "MArr" ? (({ elems, rest }) => ((k) => rest ? k <= len ? Some12(_Array_concat6(elems, mWilds(sub5(len, k)))) : None12 : eq10(k, len) ? Some12(elems) : None12)(length10(elems)))(_v) : None12)(mp))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(h));
var specializeOne = _curry13(4, (h, arity, labels, row) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: hd }) => ((rest) => isWildMP(hd) ? [_Array_concat6(mWilds(arity), rest)] : ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: sub }) => [_Array_concat6(sub, rest)])(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(specializeRow(h, hd, labels)))(_Array_tail2(row)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_head2(row)));
var specializeM = _curry13(4, (m, h, arity, labels) => _Array_flatMap3((row) => specializeOne(h, arity, labels, row), m));
var defaultM = (m) => _Array_flatMap3((row) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: hd }) => isWildMP(hd) ? [_Array_tail2(row)] : [])(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_head2(row)), m);
var rebuild = _curry13(3, (h, args, labels) => ((_v) => _v._tag === "HCtor" ? (({ name }) => MCtor(name, args))(_v) : _v._tag === "HTuple" ? MTuple(args) : _v._tag === "HRecord" ? MRecord(labels, args) : _v._tag === "HArr" ? MArr(args, false) : _v._tag === "HBool" ? (({ value: v }) => MBool(v))(_v) : _v._tag === "HNum" ? (({ value: v }) => MNum(v))(_v) : _v._tag === "HStr" ? (({ value: v }) => MStr(v))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(h));
var takenNums = (heads) => _Array_flatMap3((h) => ((_v) => _v._tag === "HNum" ? (({ value: v }) => [v])(_v) : [])(h), heads);
var freshNum = _curry13(2, (taken, i) => _Array_contains2(i, taken) ? freshNum(taken, i + 1) : i);
var takenStrs = (heads) => _Array_flatMap3((h) => ((_v) => _v._tag === "HStr" ? (({ value: v }) => [v])(_v) : [])(h), heads);
var starsOf = (n) => n <= 0 ? "" : _Str_concat("*", starsOf(sub5(n, 1)));
var freshStr = _curry13(2, (taken, i) => {
  const s = starsOf(i);
  return _Array_contains2(s, taken) ? freshStr(taken, i + 1) : s;
});
var ctorNames = (heads) => _Array_flatMap3((h) => ((_v) => _v._tag === "HCtor" ? (({ name: n }) => [n])(_v) : [])(h), heads);
var boolVals = (heads) => _Array_flatMap3((h) => ((_v) => _v._tag === "HBool" ? (({ value: v }) => [v])(_v) : [])(h), heads);
var ctorInfoSuffixed = _curry13(3, (keys, reg, n) => ((_v) => _v.length === 0 ? None12 : _v.length >= 1 ? (([k, ...rest]) => _Str_endsWith(`.${n}`, k) ? _Map_get4(k, reg.ctors) : ctorInfoSuffixed(rest, reg, n))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(keys));
var ctorInfoOf = _curry13(2, (reg, n) => ((_v) => _v._tag === "Some" ? (({ value: info }) => Some12(info))(_v) : _v._tag === "None" ? ctorInfoSuffixed(_Map_keys4(reg.ctors), reg, n) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get4(n, reg.ctors)));
var arityOfCtor = _curry13(2, (reg, n) => ((_v) => _v._tag === "None" ? 0 : _v._tag === "Some" ? (({ value: info }) => info.arity)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(ctorInfoOf(reg, n)));
var ownerOfCtor = _curry13(2, (reg, n) => ((_v) => _v._tag === "None" ? None12 : _v._tag === "Some" ? (({ value: info }) => Some12(info.owner))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(ctorInfoOf(reg, n)));
var allNamesIn = _curry13(2, (all, names) => reduce3(_curry13(2, (acc, n) => and9(acc, _Array_contains2(n, names))), true, all));
var useful = _curry13(4, (m, width, reg, fuel) => fuel <= 0 ? UFuel : width === 0 ? length10(m) === 0 ? USome([], sub5(fuel, 1)) : UNone(sub5(fuel, 1)) : length10(m) === 0 ? USome(mWilds(width), sub5(fuel, 1)) : usefulSplit(m, width, reg, sub5(fuel, 1)));
var usefulSplit = _curry13(4, (m, width, reg, fuel) => {
  const col = colOf(m);
  const heads = headsOf(col);
  return ((_v) => _v._tag === "None" ? prependWitness(MWild, useful(defaultM(m), sub5(width, 1), reg, fuel)) : _v._tag === "Some" ? (({ value: h0 }) => usefulHead(m, col, heads, h0, width, reg, fuel))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(_Array_head2(heads));
});
var prependWitness = _curry13(2, (mp, r) => ((_v) => _v._tag === "UFuel" ? UFuel : _v._tag === "UNone" ? (({ fuel: f }) => UNone(f))(_v) : _v._tag === "USome" ? (({ row, fuel: f }) => USome(_Array_prepend5(mp, row), f))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(r));
var tryHeads = _curry13(8, (m, heads, arities, labels, width, reg, fuel, i) => ((_v) => _v._tag === "None" ? UNone(fuel) : _v._tag === "Some" ? (({ value: h }) => ((arity) => ((_v) => _v._tag === "UFuel" ? UFuel : _v._tag === "UNone" ? (({ fuel: f2 }) => tryHeads(m, heads, arities, labels, width, reg, f2, i + 1))(_v) : _v._tag === "USome" ? (({ row, fuel: f2 }) => USome(_Array_prepend5(rebuild(h, _Array_take2(arity, row), labels), _Array_drop(arity, row)), f2))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(useful(specializeM(m, h, arity, labels), sub5(arity + width, 1), reg, fuel)))(_Option_unwrapOr7(0, _Array_get11(i, arities))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(i, heads)));
var usefulHead = _curry13(7, (m, col, heads, h0, width, reg, fuel) => ((_v) => _v._tag === "HTuple" ? (({ arity }) => tryHeads(m, [HTuple(arity)], [arity], [], width, reg, fuel, 0))(_v) : _v._tag === "HRecord" ? ((labels) => tryHeads(m, [HRecord], [length10(labels)], labels, width, reg, fuel, 0))(recordLabelsOf(col)) : _v._tag === "HCtor" ? usefulCtor(m, heads, width, reg, fuel) : _v._tag === "HBool" ? usefulBool(m, heads, width, reg, fuel) : _v._tag === "HArr" ? usefulArr(m, col, width, reg, fuel) : _v._tag === "HNum" ? prependWitness(MNum(freshNum(takenNums(heads), 0)), useful(defaultM(m), sub5(width, 1), reg, fuel)) : _v._tag === "HStr" ? prependWitness(MStr(freshStr(takenStrs(heads), 0)), useful(defaultM(m), sub5(width, 1), reg, fuel)) : (() => {
  throw new Error("non-exhaustive match");
})())(h0));
var usefulCtor = _curry13(5, (m, heads, width, reg, fuel) => {
  const names = ctorNames(heads);
  const ownerOpt = ((_v) => _v._tag === "None" ? None12 : _v._tag === "Some" ? (({ value: n }) => ownerOfCtor(reg, n))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(_Array_head2(names));
  const all = ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: o }) => _Map_getOr3([], o, reg.types))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(ownerOpt);
  return and9(length10(all) > 0, allNamesIn(all, names)) ? tryHeads(m, map7((n) => HCtor(n), all), map7((n) => arityOfCtor(reg, n), all), [], width, reg, fuel, 0) : prependWitness(((_v) => _v._tag === "None" ? MWild : _v._tag === "Some" ? (({ value: n }) => MCtor(n, mWilds(arityOfCtor(reg, n))))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(_Array_head2(filter4((n) => !_Array_contains2(n, names), all))), useful(defaultM(m), sub5(width, 1), reg, fuel));
});
var usefulBool = _curry13(5, (m, heads, width, reg, fuel) => {
  const vs = boolVals(heads);
  const hasTrue = _Array_contains2(true, vs);
  return and9(hasTrue, _Array_contains2(false, vs)) ? tryHeads(m, [HBool(true), HBool(false)], [0, 0], [], width, reg, fuel, 0) : prependWitness(MBool(!hasTrue), useful(defaultM(m), sub5(width, 1), reg, fuel));
});
var usefulArr = _curry13(5, (m, col, width, reg, fuel) => {
  const shape = arrShapeOf(col);
  return arrComplete(shape) ? ((lens) => tryHeads(m, map7((n) => HArr(n), lens), lens, [], width, reg, fuel, 0))(arrLengths(shape)) : prependWitness(MArr(mWilds(arrMissingLen(shape, 0)), false), useful(defaultM(m), sub5(width, 1), reg, fuel));
});
var showFields = _curry13(3, (labels, pats, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: l }) => _Array_prepend5(`${l}: ${showWitness(_Option_unwrapOr7(MWild, _Array_get11(i, pats)))}`, showFields(labels, pats, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(i, labels)));
var showWitness = (mp) => ((_v) => _v._tag === "MWild" ? "_" : _v._tag === "MOpaque" ? "_" : _v._tag === "MBool" ? (({ value: v }) => show5(v))(_v) : _v._tag === "MNum" ? (({ value: v }) => show5(v))(_v) : _v._tag === "MStr" ? (({ value: v }) => show5(v))(_v) : _v._tag === "MCtor" ? (({ name: n, args }) => length10(args) === 0 ? n : `${n}(${_Str_join4(", ", map7(showWitness, args))})`)(_v) : _v._tag === "MTuple" ? (({ elems }) => `(${_Str_join4(", ", map7(showWitness, elems))})`)(_v) : _v._tag === "MRecord" ? (({ labels, pats }) => `{ ${_Str_join4(", ", showFields(labels, pats, 0))} }`)(_v) : _v._tag === "MArr" ? (({ elems, rest }) => `[${_Str_join4(", ", _Array_concat6(map7(showWitness, elems), rest ? ["..."] : []))}]`)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(mp);
var isWideWitnessM = (mp) => ((_v) => _v._tag === "MWild" ? true : _v._tag === "MCtor" ? (({ args }) => reduce3(_curry13(2, (acc, a) => and9(acc, isWildMP(a))), true, args))(_v) : false)(mp);
var checkExhaustiveM = _curry13(2, (patterns, reg) => {
  const rows = _Array_flatMap3((p) => map7((alt) => [toMP(alt)], explodePat(p)), patterns);
  return ((_v) => _v._tag === "UFuel" ? ExFuel : _v._tag === "UNone" ? ExOk : _v._tag === "USome" ? (({ row }) => ExWitness(_Option_unwrapOr7(MWild, _Array_head2(row))))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(useful(rows, 1, reg, 20000));
});

var checkErr = _curry14(2, (message, sp) => ({ message, start: sp.start, end: sp.end }));
var firstSomeFrom = _curry14(3, (f, xs, i0) => {
  let i = i0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done6(None13) : _v._tag === "Some" ? (({ value: x }) => ((_v) => _v._tag === "Some" ? (({ value: e }) => _done6(Some13(e)))(_v) : _v._tag === "None" ? _recur6(i + 1) : (() => {
      throw new Error("non-exhaustive match");
    })())(f(x)))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get12(i, xs));
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var firstSome = _curry14(2, (f, xs) => firstSomeFrom(f, xs, 0));
var allOfFrom = _curry14(3, (f, xs, i0) => {
  let i = i0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done6(true) : _v._tag === "Some" ? (({ value: x }) => f(x) ? _recur6(i + 1) : _done6(false))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get12(i, xs));
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var allOf = _curry14(2, (f, xs) => allOfFrom(f, xs, 0));
var someOfFrom2 = _curry14(3, (f, xs, i0) => {
  let i = i0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done6(false) : _v._tag === "Some" ? (({ value: x }) => f(x) ? _done6(true) : _recur6(i + 1))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get12(i, xs));
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var someOf2 = _curry14(2, (f, xs) => someOfFrom2(f, xs, 0));
var exprSpan2 = (e) => ((_v) => _v._tag === "ENum" ? (({ span: sp }) => sp)(_v) : _v._tag === "EUnit" ? (({ span: sp }) => sp)(_v) : _v._tag === "EBool" ? (({ span: sp }) => sp)(_v) : _v._tag === "EStr" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERef" ? (({ span: sp }) => sp)(_v) : _v._tag === "ECall" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELambda" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELetIn" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELetBind" ? (({ span: sp }) => sp)(_v) : _v._tag === "EPipe" ? (({ span: sp }) => sp)(_v) : _v._tag === "EDo" ? (({ span: sp }) => sp)(_v) : _v._tag === "ETernary" ? (({ span: sp }) => sp)(_v) : _v._tag === "EMatch" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELoop" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERecur" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERecord" ? (({ span: sp }) => sp)(_v) : _v._tag === "EField" ? (({ span: sp }) => sp)(_v) : _v._tag === "ETuple" ? (({ span: sp }) => sp)(_v) : _v._tag === "EArr" ? (({ span: sp }) => sp)(_v) : _v._tag === "EList" ? (({ span: sp }) => sp)(_v) : _v._tag === "ESet" ? (({ span: sp }) => sp)(_v) : _v._tag === "EMap" ? (({ span: sp }) => sp)(_v) : _v._tag === "EInterp" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e);
var patSpan2 = (p) => ((_v) => _v._tag === "PWild" ? (({ span: sp }) => sp)(_v) : _v._tag === "PUnit" ? (({ span: sp }) => sp)(_v) : _v._tag === "PBind" ? (({ span: sp }) => sp)(_v) : _v._tag === "PAs" ? (({ span: sp }) => sp)(_v) : _v._tag === "PLit" ? (({ span: sp }) => sp)(_v) : _v._tag === "PBool" ? (({ span: sp }) => sp)(_v) : _v._tag === "PStr" ? (({ span: sp }) => sp)(_v) : _v._tag === "PTuple" ? (({ span: sp }) => sp)(_v) : _v._tag === "PRecord" ? (({ span: sp }) => sp)(_v) : _v._tag === "PCtor" ? (({ span: sp }) => sp)(_v) : _v._tag === "PArr" ? (({ span: sp }) => sp)(_v) : _v._tag === "PList" ? (({ span: sp }) => sp)(_v) : _v._tag === "POr" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p);
var isCatchAll = (p) => ((_v) => _v._tag === "PWild" ? true : _v._tag === "PUnit" ? true : _v._tag === "PBind" ? true : _v._tag === "PAs" ? (({ pat }) => isCatchAll(pat))(_v) : _v._tag === "PRecord" ? (({ fields }) => allOf((f) => isCatchAll(f.pat), fields))(_v) : _v._tag === "PTuple" ? (({ elems }) => allOf(isCatchAll, elems))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => and10(length11(elems) === 0, _Option_isSome3(rest)))(_v) : _v._tag === "PList" ? (({ elems, rest }) => and10(length11(elems) === 0, _Option_isSome3(rest)))(_v) : false)(p);
var isPList = (p) => ((_v) => _v._tag === "PList" ? true : false)(p);
var isPCtor = (p) => ((_v) => _v._tag === "PCtor" ? true : false)(p);
var ctorNameOf = (p) => ((_v) => _v._tag === "PCtor" ? (({ ctor: name }) => name)(_v) : "")(p);
var patCtorKey = _curry14(2, (ctor, ns) => ((_v) => _v._tag === "Some" ? (({ value: alias }) => `${alias}.${ctor}`)(_v) : _v._tag === "None" ? ctor : (() => {
  throw new Error("non-exhaustive match");
})())(ns));
var seqElemsRest = (p) => ((_v) => _v._tag === "PArr" ? (({ elems, rest }) => Some13(_tuple7(elems, rest)))(_v) : _v._tag === "PList" ? (({ elems, rest }) => Some13(_tuple7(elems, rest)))(_v) : None13)(p);
var checkPattern = _curry14(3, (p, reg, top) => ((_v) => _v._tag === "PAs" ? (({ pat }) => checkPattern(pat, reg, top))(_v) : _v._tag === "PCtor" ? (({ ctor, args, ns, span: sp }) => ((key) => ((_v) => _v._tag === "None" ? Some13(checkErr(`unknown constructor '${key}'`, sp)) : _v._tag === "Some" ? (({ value: info }) => eq11(length11(args), info.arity) ? firstSome((a) => checkPattern(a, reg, false), args) : Some13(checkErr(`constructor '${ctor}' expects ${show6(info.arity)} arg(s), got ${show6(length11(args))}`, sp)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get5(key, reg.ctors)))(patCtorKey(ctor, ns)))(_v) : _v._tag === "PRecord" ? (({ fields }) => firstSome((f) => checkPattern(f.pat, reg, false), fields))(_v) : _v._tag === "PTuple" ? (({ elems }) => firstSome((el) => checkPattern(el, reg, false), elems))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => _Option_orElse(((_v) => _v._tag === "Some" ? (({ value: r }) => checkPattern(r, reg, false))(_v) : _v._tag === "None" ? None13 : (() => {
  throw new Error("non-exhaustive match");
})())(rest), firstSome((el) => checkPattern(el, reg, false), elems)))(_v) : _v._tag === "PList" ? (({ elems, rest, span: sp }) => top ? _Option_orElse(((_v) => _v._tag === "Some" ? (({ value: r }) => checkPattern(r, reg, false))(_v) : _v._tag === "None" ? None13 : (() => {
  throw new Error("non-exhaustive match");
})())(rest), firstSome((el) => checkPattern(el, reg, false), elems)) : Some13(checkErr("lazy-List pattern cannot nest inside another pattern (matching pulls from the sequence)", sp)))(_v) : _v._tag === "POr" ? (({ alts, span: sp }) => checkOrPattern(alts, sp, reg))(_v) : None13)(p));
var binderPathsArgs = _curry14(4, (args, i, at, acc) => ((_v) => _v._tag === "None" ? Ok8(acc) : _v._tag === "Some" ? (({ value: a }) => _Result_flatMap6((acc2) => binderPathsArgs(args, i + 1, at, acc2), binderPaths(a, `${at}.a${show6(i)}`, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get12(i, args)));
var binderPathsFields = _curry14(4, (fields, i, at, acc) => ((_v) => _v._tag === "None" ? Ok8(acc) : _v._tag === "Some" ? (({ value: f }) => _Result_flatMap6((acc2) => binderPathsFields(fields, i + 1, at, acc2), binderPaths(f.pat, `${at}.${f.label}`, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get12(i, fields)));
var binderPathsElems = _curry14(4, (elems, i, at, acc) => ((_v) => _v._tag === "None" ? Ok8(acc) : _v._tag === "Some" ? (({ value: e }) => _Result_flatMap6((acc2) => binderPathsElems(elems, i + 1, at, acc2), binderPaths(e, `${at}.t${show6(i)}`, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get12(i, elems)));
var binderPaths = _curry14(3, (p, at, acc) => ((_v) => _v._tag === "PAs" ? (({ pat, name, nameSpan: nameSp }) => _Result_flatMap6((acc1) => _Map_has3(name, acc1) ? Err8(checkErr(`pattern binds '${name}' more than once`, nameSp)) : Ok8(_Map_set4(name, at, acc1)), binderPaths(pat, at, acc)))(_v) : _v._tag === "PBind" ? (({ name, span: sp }) => _Map_has3(name, acc) ? Err8(checkErr(`pattern binds '${name}' more than once`, sp)) : Ok8(_Map_set4(name, at, acc)))(_v) : _v._tag === "PCtor" ? (({ args }) => binderPathsArgs(args, 0, at, acc))(_v) : _v._tag === "PRecord" ? (({ fields }) => binderPathsFields(fields, 0, at, acc))(_v) : _v._tag === "PTuple" ? (({ elems }) => binderPathsElems(elems, 0, at, acc))(_v) : Ok8(acc))(p));
var altMapsFrom = _curry14(4, (alts, i, reg, acc) => ((_v) => _v._tag === "None" ? Ok8(acc) : _v._tag === "Some" ? (({ value: alt }) => isCatchAll(alt) ? Err8(checkErr("an or-pattern alternative can't be a catch-all (`_` or a bare binding)", patSpan2(alt))) : _Option_isSome3(seqElemsRest(alt)) ? Err8(checkErr("array/list patterns can't appear as an or-pattern alternative", patSpan2(alt))) : ((_v) => _v._tag === "Some" ? (({ value: e }) => Err8(e))(_v) : _v._tag === "None" ? _Result_flatMap6((m) => altMapsFrom(alts, i + 1, reg, _Array_append10(m, acc)), binderPaths(alt, "", new Map)) : (() => {
  throw new Error("non-exhaustive match");
})())(checkPattern(alt, reg, false)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get12(i, alts)));
var missingNameErr = _curry14(2, (name, sp) => checkErr(`or-pattern alternatives must bind the same names ('${name}' is missing in an alternative)`, sp));
var consistentBindsFrom = _curry14(4, (maps, i, ref, sp) => ((_v) => _v._tag === "None" ? None13 : _v._tag === "Some" ? (({ value: m }) => _Option_orElse(consistentBindsFrom(maps, i + 1, ref, sp), _Option_orElse(firstSome((name) => _Map_has3(name, ref) ? eq11(_Map_getOr4("", name, ref), _Map_getOr4("", name, m)) ? None13 : Some13(checkErr(`or-pattern binds '${name}' at a differing position across alternatives`, sp)) : Some13(missingNameErr(name, sp)), _Map_keys5(m)), firstSome((name) => _Map_has3(name, m) ? None13 : Some13(missingNameErr(name, sp)), _Map_keys5(ref)))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get12(i, maps)));
var checkOrPattern = _curry14(3, (alts, sp, reg) => ((_v) => _v._tag === "Err" ? (({ error: e }) => Some13(e))(_v) : _v._tag === "Ok" ? (({ value: maps }) => ((_v) => _v._tag === "None" ? None13 : _v._tag === "Some" ? (({ value: ref }) => consistentBindsFrom(maps, 1, ref, sp))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_head3(maps)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(altMapsFrom(alts, 0, reg, [])));
var armUnguardedCatchAll = (a) => and10(isCatchAll(a.pattern), _Option_isNone(a.guard));
var guardErrs = _curry14(2, (arms, listSwitch) => firstSome((a) => ((_v) => _v._tag === "None" ? None13 : _v._tag === "Some" ? (({ value: g }) => or7(isPList(a.pattern), listSwitch) ? Some13(checkErr("`when` guards are unsupported in a lazy-List switch (matching pulls from the sequence)", exprSpan2(g))) : None13)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(a.guard), arms));
var firstCatchIdx = _curry14(2, (arms, i0) => {
  let i = i0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done6(None13) : _v._tag === "Some" ? (({ value: a }) => armUnguardedCatchAll(a) ? _done6(Some13(i)) : _recur6(i + 1))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get12(i, arms));
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var unreachableAfterCatch = (arms) => ((_v) => _v._tag === "None" ? None13 : _v._tag === "Some" ? (({ value: i }) => ((_v) => _v._tag === "None" ? None13 : _v._tag === "Some" ? (({ value: a }) => Some13(checkErr("unreachable arm: a catch-all arm above it matches first", patSpan2(a.pattern))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get12(i + 1, arms)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(firstCatchIdx(arms, 0));
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
var ctorLoop = _curry14(5, (arms, i, reg, owner, covered) => ((_v) => _v._tag === "None" ? Ok8(_tuple7(owner, covered)) : _v._tag === "Some" ? (({ value: a }) => ((_v) => _v._tag === "PCtor" ? (({ ctor, args, ns, span: sp }) => ((key) => ((_v) => _v._tag === "None" ? Err8(checkErr(`unknown constructor '${key}'`, sp)) : _v._tag === "Some" ? (({ value: info }) => !eq11(length11(args), info.arity) ? Err8(checkErr(`constructor '${ctor}' expects ${show6(info.arity)} arg(s), got ${show6(length11(args))}`, sp)) : ((_v) => _v._tag === "Some" && (({ value: own }) => !eq11(own, info.owner))(_v) ? (({ value: own }) => Err8(checkErr(`switch mixes variants of '${own}' and '${info.owner}'`, sp)))(_v) : ((covered2) => ctorLoop(arms, i + 1, reg, Some13(info.owner), covered2))(and10(allOf(isCatchAll, args), _Option_isNone(a.guard)) ? _Set_add2(ctor, covered) : covered))(owner))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get5(key, reg.ctors)))(patCtorKey(ctor, ns)))(_v) : ctorLoop(arms, i + 1, reg, owner, covered))(a.pattern))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get12(i, arms)));
var seqVerdict = _curry14(2, (arms, mSpan) => ((_v) => _v._tag === "SeqTotal" ? None13 : _v._tag === "SeqFail" ? (({ e }) => Some13(e))(_v) : _v._tag === "SeqNotSeq" ? None13 : (() => {
  throw new Error("non-exhaustive match");
})())(checkSeqExhaustive(arms, mSpan)));
var unguardedPatterns = (arms) => _Array_flatMap4((a) => _Option_isNone(a.guard) ? [a.pattern] : [], arms);
var namedUnguarded = (leaves) => _Set_fromArray2(_Array_flatMap4((a) => and10(isPCtor(a.pattern), _Option_isNone(a.guard)) ? [ctorNameOf(a.pattern)] : [], leaves));
var matrixVerdict = _curry14(5, (arms, leaves, ownerOpt, mSpan, reg) => ((_v) => _v._tag === "ExOk" ? None13 : _v._tag === "ExFuel" ? Some13(checkErr("switch too complex to prove exhaustive — add a `_` catch-all arm", mSpan)) : _v._tag === "ExWitness" ? (({ witness: w }) => ((own) => ((named) => ((absent) => and10(and10(isWideWitnessM(w), own !== ""), length11(absent) > 0) ? Some13(checkErr(`non-exhaustive switch on '${own}': missing ${_Str_join5(", ", absent)}`, mSpan)) : Some13(checkErr(`non-exhaustive switch: '${showWitness(w)}' is not matched`, mSpan)))(filter5((c) => !_Set_has2(c, named), _Map_getOr4([], own, reg.types))))(namedUnguarded(leaves)))(_Option_unwrapOr8("", ownerOpt)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(checkExhaustiveM(unguardedPatterns(arms), reg)));
var leavesOfArm = (a) => ((_v) => _v._tag === "POr" ? (({ alts }) => map8((alt) => ({ pattern: alt, guard: a.guard }), alts))(_v) : [{ pattern: a.pattern, guard: a.guard }])(a.pattern);
var checkMatch = _curry14(3, (arms, mSpan, reg) => ((_v) => _v._tag === "Some" ? (({ value: e }) => Some13(e))(_v) : _v._tag === "None" ? ((listSwitch) => ((_v) => _v._tag === "Some" ? (({ value: e }) => Some13(e))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: e }) => Some13(e))(_v) : _v._tag === "None" ? ((hasCatchAll) => ((leaves) => ((ctorArms) => someOf2((a) => isPList(a.pattern), arms) ? hasCatchAll ? None13 : seqVerdict(arms, mSpan) : ((_v) => _v._tag === "Err" ? (({ error: e }) => Some13(e))(_v) : _v._tag === "Ok" ? (({ value: [ownerOpt] }) => matrixVerdict(arms, leaves, ownerOpt, mSpan, reg))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(ctorLoop(ctorArms, 0, reg, None13, _Set_fromArray2([]))))(filter5((a) => isPCtor(a.pattern), leaves)))(_Array_flatMap4(leavesOfArm, arms)))(someOf2(armUnguardedCatchAll, arms)) : (() => {
  throw new Error("non-exhaustive match");
})())(unreachableAfterCatch(arms)) : (() => {
  throw new Error("non-exhaustive match");
})())(guardErrs(arms, listSwitch)))(someOf2((a) => and10(isPList(a.pattern), !isCatchAll(a.pattern)), arms)) : (() => {
  throw new Error("non-exhaustive match");
})())(firstSome((a) => checkPattern(a.pattern, reg, true), arms)));
var checkExpr = _curry14(2, (e, reg) => ((_v) => _v._tag === "ENum" ? None13 : _v._tag === "EUnit" ? None13 : _v._tag === "EBool" ? None13 : _v._tag === "EStr" ? None13 : _v._tag === "ERef" ? None13 : _v._tag === "ECall" ? (({ fn, args }) => _Option_orElse(firstSome((a) => checkExpr(a, reg), args), checkExpr(fn, reg)))(_v) : _v._tag === "ELambda" ? (({ body }) => checkExpr(body, reg))(_v) : _v._tag === "ELetIn" ? (({ value, body }) => _Option_orElse(checkExpr(body, reg), checkExpr(value, reg)))(_v) : _v._tag === "ELetBind" ? (({ value, body }) => _Option_orElse(checkExpr(body, reg), checkExpr(value, reg)))(_v) : _v._tag === "EPipe" ? (({ left, right }) => _Option_orElse(checkExpr(right, reg), checkExpr(left, reg)))(_v) : _v._tag === "EDo" ? (({ exprs }) => firstSome((x) => checkExpr(x, reg), exprs))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => _Option_orElse(checkExpr(elseE, reg), _Option_orElse(checkExpr(thenE, reg), checkExpr(cond, reg))))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms, span: sp }) => _Option_orElse(checkMatch(arms, sp, reg), _Option_orElse(firstSome((a) => _Option_orElse(checkExpr(a.body, reg), ((_v) => _v._tag === "Some" ? (({ value: g }) => checkExpr(g, reg))(_v) : _v._tag === "None" ? None13 : (() => {
  throw new Error("non-exhaustive match");
})())(a.guard)), arms), checkExpr(scrutinee, reg))))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => _Option_orElse(firstSome((f) => checkExpr(f.value, reg), fields), ((_v) => _v._tag === "Some" ? (({ value: s }) => checkExpr(s, reg))(_v) : _v._tag === "None" ? None13 : (() => {
  throw new Error("non-exhaustive match");
})())(spread)))(_v) : _v._tag === "EField" ? (({ target }) => checkExpr(target, reg))(_v) : _v._tag === "ELoop" ? (({ params, body }) => _Option_orElse(checkExpr(body, reg), firstSome((p) => checkExpr(p.init, reg), params)))(_v) : _v._tag === "ERecur" ? (({ args }) => firstSome((a) => checkExpr(a, reg), args))(_v) : _v._tag === "ETuple" ? (({ elements }) => firstSome((el) => checkExpr(el, reg), elements))(_v) : _v._tag === "EArr" ? (({ elements }) => firstSome((el) => checkExpr(((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), reg), elements))(_v) : _v._tag === "EList" ? (({ elements }) => firstSome((el) => checkExpr(((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), reg), elements))(_v) : _v._tag === "ESet" ? (({ elements }) => firstSome((el) => checkExpr(((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), reg), elements))(_v) : _v._tag === "EMap" ? (({ entries }) => firstSome((en) => _Option_orElse(checkExpr(en.value, reg), checkExpr(en.key, reg)), entries))(_v) : _v._tag === "EInterp" ? (({ parts }) => firstSome((p) => ((_v) => _v._tag === "IPLit" ? None13 : _v._tag === "IPExpr" ? (({ expr: ex }) => checkExpr(ex, reg))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p), parts))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e));
var checkExprs = _curry14(2, (e, reg) => ((_v) => _v._tag === "ENum" ? [] : _v._tag === "EUnit" ? [] : _v._tag === "EBool" ? [] : _v._tag === "EStr" ? [] : _v._tag === "ERef" ? [] : _v._tag === "ECall" ? (({ fn, args }) => [...checkExprs(fn, reg), ..._Array_flatMap4((a) => checkExprs(a, reg), args)])(_v) : _v._tag === "ELambda" ? (({ body }) => checkExprs(body, reg))(_v) : _v._tag === "ELetIn" ? (({ value, body }) => [...checkExprs(value, reg), ...checkExprs(body, reg)])(_v) : _v._tag === "ELetBind" ? (({ value, body }) => [...checkExprs(value, reg), ...checkExprs(body, reg)])(_v) : _v._tag === "EPipe" ? (({ left, right }) => [...checkExprs(left, reg), ...checkExprs(right, reg)])(_v) : _v._tag === "EDo" ? (({ exprs }) => _Array_flatMap4((x) => checkExprs(x, reg), exprs))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => [...checkExprs(cond, reg), ...checkExprs(thenE, reg), ...checkExprs(elseE, reg)])(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms, span: sp }) => [...checkExprs(scrutinee, reg), ..._Array_flatMap4((a) => [...((_v) => _v._tag === "Some" ? (({ value: g }) => checkExprs(g, reg))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(a.guard), ...checkExprs(a.body, reg)], arms), ...((_v) => _v._tag === "Some" ? (({ value: e }) => [e])(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(checkMatch(arms, sp, reg))])(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => [...((_v) => _v._tag === "Some" ? (({ value: s }) => checkExprs(s, reg))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(spread), ..._Array_flatMap4((f) => checkExprs(f.value, reg), fields)])(_v) : _v._tag === "EField" ? (({ target }) => checkExprs(target, reg))(_v) : _v._tag === "ELoop" ? (({ params, body }) => [..._Array_flatMap4((p) => checkExprs(p.init, reg), params), ...checkExprs(body, reg)])(_v) : _v._tag === "ERecur" ? (({ args }) => _Array_flatMap4((a) => checkExprs(a, reg), args))(_v) : _v._tag === "ETuple" ? (({ elements }) => _Array_flatMap4((el) => checkExprs(el, reg), elements))(_v) : _v._tag === "EArr" ? (({ elements }) => _Array_flatMap4((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => checkExprs(value, reg))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => checkExprs(value, reg))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements))(_v) : _v._tag === "EList" ? (({ elements }) => _Array_flatMap4((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => checkExprs(value, reg))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => checkExprs(value, reg))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements))(_v) : _v._tag === "ESet" ? (({ elements }) => _Array_flatMap4((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => checkExprs(value, reg))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => checkExprs(value, reg))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements))(_v) : _v._tag === "EMap" ? (({ entries }) => _Array_flatMap4((entry) => [...checkExprs(entry.key, reg), ...checkExprs(entry.value, reg)], entries))(_v) : _v._tag === "EInterp" ? (({ parts }) => _Array_flatMap4((part) => ((_v) => _v._tag === "IPLit" ? [] : _v._tag === "IPExpr" ? (({ expr: value }) => checkExprs(value, reg))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(part), parts))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e));
var reservedNames = ["Array", "List", "Set", "Map", "Option", "Result", "Task", "Str"];
var redeclarableTypes = ["Option", "Result"];
var reservedErr = _curry14(2, (name, sp) => checkErr(`'${name}' is a reserved collection namespace and cannot be bound`, sp));
var checkReservedNames = (stmts) => firstSome((s) => ((_v) => _v._tag === "SType" ? (({ name, span: sp }) => _Array_contains3(name, redeclarableTypes) ? None13 : _Array_contains3(name, reservedNames) ? Some13(reservedErr(name, sp)) : None13)(_v) : _v._tag === "SLet" ? (({ name, span: sp }) => _Array_contains3(name, reservedNames) ? Some13(reservedErr(name, sp)) : None13)(_v) : _v._tag === "SExtern" ? (({ name, span: sp }) => _Array_contains3(name, reservedNames) ? Some13(reservedErr(name, sp)) : None13)(_v) : _v._tag === "SImport" ? (({ names }) => firstSome((n) => _Array_contains3(n.name, reservedNames) ? Some13(checkErr(`'${n.name}' is a reserved collection namespace and cannot be imported`, n.span)) : None13, names))(_v) : _v._tag === "SImportNs" ? (({ alias }) => _Array_contains3(alias.name, reservedNames) ? Some13(checkErr(`'${alias.name}' is a reserved collection namespace and cannot be imported`, alias.span)) : None13)(_v) : _v._tag === "SError" ? None13 : _v._tag === "SExpr" ? None13 : (() => {
  throw new Error("non-exhaustive match");
})())(s), stmts);
var checkReservedNamesAll = (stmts) => _Array_flatMap4((s) => ((_v) => _v._tag === "SType" ? (({ name, span: sp }) => _Array_contains3(name, redeclarableTypes) ? [] : _Array_contains3(name, reservedNames) ? [reservedErr(name, sp)] : [])(_v) : _v._tag === "SLet" ? (({ name, span: sp }) => _Array_contains3(name, reservedNames) ? [reservedErr(name, sp)] : [])(_v) : _v._tag === "SExtern" ? (({ name, span: sp }) => _Array_contains3(name, reservedNames) ? [reservedErr(name, sp)] : [])(_v) : _v._tag === "SImport" ? (({ names }) => _Array_flatMap4((n) => _Array_contains3(n.name, reservedNames) ? [checkErr(`'${n.name}' is a reserved collection namespace and cannot be imported`, n.span)] : [], names))(_v) : _v._tag === "SImportNs" ? (({ alias }) => _Array_contains3(alias.name, reservedNames) ? [checkErr(`'${alias.name}' is a reserved collection namespace and cannot be imported`, alias.span)] : [])(_v) : [])(s), stmts);
var jsReserved = ["break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "null", "return", "super", "switch", "this", "throw", "true", "try", "typeof", "var", "void", "while", "with", "yield", "let", "static", "implements", "interface", "package", "private", "protected", "public", "await"];
var reservedWord = _curry14(2, (name, sp) => _Array_contains3(name, jsReserved) ? [checkErr(`'${name}' is a JavaScript reserved word and can't be used as a binding name; rename it`, sp)] : []);
var typeExprSpan = (te) => ((_v) => _v._tag === "TyName" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyArrow" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyApp" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyTuple" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyList" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyQual" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyLit" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyUnion" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(te);
var checkReservedParam = _curry14(2, (param, sp) => ((_v) => _v._tag === "LPName" ? (({ name }) => reservedWord(name, sp))(_v) : _v._tag === "LPRecord" ? (({ fields }) => _Array_flatMap4((name) => reservedWord(name, sp), fields))(_v) : _v._tag === "LPTuple" ? (({ names }) => _Array_flatMap4((name) => reservedWord(name, sp), names))(_v) : _v._tag === "LPLabeled" ? (({ name, defaultValue }) => [...reservedWord(name, sp), ...((_v) => _v._tag === "Some" ? (({ value }) => checkReservedExpr(value))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(defaultValue)])(_v) : _v._tag === "LPSpanned" ? (({ param: inner }) => checkReservedParam(inner, sp))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(param));
var checkReservedPattern = (pat) => ((_v) => _v._tag === "PAs" ? (({ pat: inner, name, nameSpan: nameSp }) => [...checkReservedPattern(inner), ...reservedWord(name, nameSp)])(_v) : _v._tag === "PBind" ? (({ name, span: sp }) => reservedWord(name, sp))(_v) : _v._tag === "PTuple" ? (({ elems }) => _Array_flatMap4(checkReservedPattern, elems))(_v) : _v._tag === "PRecord" ? (({ fields }) => _Array_flatMap4((field) => checkReservedPattern(field.pat), fields))(_v) : _v._tag === "PCtor" ? (({ args }) => _Array_flatMap4(checkReservedPattern, args))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => [..._Array_flatMap4(checkReservedPattern, elems), ...((_v) => _v._tag === "Some" ? (({ value }) => checkReservedPattern(value))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(rest)])(_v) : _v._tag === "PList" ? (({ elems, rest }) => [..._Array_flatMap4(checkReservedPattern, elems), ...((_v) => _v._tag === "Some" ? (({ value }) => checkReservedPattern(value))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(rest)])(_v) : _v._tag === "POr" ? (({ alts }) => _Array_flatMap4(checkReservedPattern, alts))(_v) : [])(pat);
var checkReservedSeqElem = (el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => checkReservedExpr(value))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => checkReservedExpr(value))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el);
var checkReservedExpr = (expr) => ((_v) => _v._tag === "ECall" ? (({ fn, args }) => [...checkReservedExpr(fn), ..._Array_flatMap4(checkReservedExpr, args)])(_v) : _v._tag === "ELambda" ? (({ params, body, span: sp }) => [..._Array_flatMap4((param) => checkReservedParam(param, sp), params), ...checkReservedExpr(body)])(_v) : _v._tag === "ELetIn" ? (({ name, nameSpan: nameSp, value, body }) => [...reservedWord(name, nameSp), ...checkReservedExpr(value), ...checkReservedExpr(body)])(_v) : _v._tag === "ELetBind" ? (({ param, paramSpan: paramSp, value, body }) => [...checkReservedParam(param, paramSp), ...checkReservedExpr(value), ...checkReservedExpr(body)])(_v) : _v._tag === "EPipe" ? (({ left, right }) => [...checkReservedExpr(left), ...checkReservedExpr(right)])(_v) : _v._tag === "EDo" ? (({ exprs }) => _Array_flatMap4(checkReservedExpr, exprs))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => [...checkReservedExpr(cond), ...checkReservedExpr(thenE), ...checkReservedExpr(elseE)])(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => [...checkReservedExpr(scrutinee), ..._Array_flatMap4((arm) => [...checkReservedPattern(arm.pattern), ...((_v) => _v._tag === "Some" ? (({ value: guard }) => checkReservedExpr(guard))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(arm.guard), ...checkReservedExpr(arm.body)], arms)])(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => [...((_v) => _v._tag === "Some" ? (({ value }) => checkReservedExpr(value))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(spread), ..._Array_flatMap4((field) => checkReservedExpr(field.value), fields)])(_v) : _v._tag === "EField" ? (({ target }) => checkReservedExpr(target))(_v) : _v._tag === "ELoop" ? (({ params, body }) => [..._Array_flatMap4((param) => reservedWord(param.name, param.nameSpan), params), ..._Array_flatMap4((param) => checkReservedExpr(param.init), params), ...checkReservedExpr(body)])(_v) : _v._tag === "ERecur" ? (({ args }) => _Array_flatMap4(checkReservedExpr, args))(_v) : _v._tag === "ETuple" ? (({ elements }) => _Array_flatMap4(checkReservedExpr, elements))(_v) : _v._tag === "EArr" ? (({ elements }) => _Array_flatMap4(checkReservedSeqElem, elements))(_v) : _v._tag === "EList" ? (({ elements }) => _Array_flatMap4(checkReservedSeqElem, elements))(_v) : _v._tag === "ESet" ? (({ elements }) => _Array_flatMap4(checkReservedSeqElem, elements))(_v) : _v._tag === "EMap" ? (({ entries }) => _Array_flatMap4((entry) => [...checkReservedExpr(entry.key), ...checkReservedExpr(entry.value)], entries))(_v) : _v._tag === "EInterp" ? (({ parts }) => _Array_flatMap4((part) => ((_v) => _v._tag === "IPLit" ? [] : _v._tag === "IPExpr" ? (({ expr: value }) => checkReservedExpr(value))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(part), parts))(_v) : [])(expr);
var checkReservedWordsAll = (stmts) => _Array_flatMap4((stmt) => ((_v) => _v._tag === "SLet" ? (({ name, nameSpan: nameSp, value }) => [...reservedWord(name, nameSp), ...checkReservedExpr(value)])(_v) : _v._tag === "SExpr" ? (({ value }) => checkReservedExpr(value))(_v) : _v._tag === "SExtern" ? (({ name, nameSpan: nameSp }) => reservedWord(name, nameSp))(_v) : _v._tag === "SType" ? (({ ctors }) => _Array_flatMap4((ctor) => _Array_flatMap4((field) => ((_v) => _v._tag === "Some" ? (({ value: name }) => reservedWord(name, typeExprSpan(field.fieldType)))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(field.name), ctor.fields), ctors))(_v) : [])(stmt), stmts);
var checkReservedWords = (stmts) => _Array_head3(checkReservedWordsAll(stmts));
var isUpperStart2 = (s) => ((_v) => _v._tag === "Some" ? (({ value: c }) => and10(c >= 65, c <= 90))(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_codeAt6(0, s));
var strayTypeVar = _curry14(2, (params, te) => ((_v) => _v._tag === "TyName" ? (({ name, span: sp }) => or7(isUpperStart2(name), or7(_Array_contains3(name, primTypeNames), _Array_contains3(name, params))) ? None13 : Some13(_tuple7(name, sp)))(_v) : _v._tag === "TyArrow" ? (({ from, to }) => _Option_orElse(strayTypeVar(params, to), strayTypeVar(params, from)))(_v) : _v._tag === "TyApp" ? (({ args }) => firstSome(strayTypeVar(params), args))(_v) : _v._tag === "TyTuple" ? (({ elems }) => firstSome(strayTypeVar(params), elems))(_v) : _v._tag === "TyList" ? (({ elem }) => strayTypeVar(params, elem))(_v) : _v._tag === "TyQual" ? (({ args }) => firstSome(strayTypeVar(params), args))(_v) : _v._tag === "TyLit" ? None13 : _v._tag === "TyUnion" ? (({ members }) => firstSome(strayTypeVar(params), members))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(te));
var checkCtorFieldVars = (stmts) => firstSome((s) => ((_v) => _v._tag === "SType" ? (({ name, params, ctors }) => firstSome((c) => firstSome((f) => ((_v) => _v._tag === "Some" ? (({ value: [vn, vsp] }) => Some13(checkErr(`unknown type parameter '${vn}' in constructor '${c.name}' — declare it: type ${name} ${_Str_join5(" ", _Array_append10(vn, params))} = ...`, vsp)))(_v) : _v._tag === "None" ? None13 : (() => {
  throw new Error("non-exhaustive match");
})())(strayTypeVar(params, f.fieldType)), c.fields), ctors))(_v) : None13)(s), stmts);
var checkCtorFieldVarsAll = (stmts) => _Array_flatMap4((s) => ((_v) => _v._tag === "SType" ? (({ name, params, ctors }) => _Array_flatMap4((c) => _Array_flatMap4((f) => ((_v) => _v._tag === "Some" ? (({ value: [vn, vsp] }) => [checkErr(`unknown type parameter '${vn}' in constructor '${c.name}' — declare it: type ${name} ${_Str_join5(" ", _Array_append10(vn, params))} = ...`, vsp)])(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(strayTypeVar(params, f.fieldType)), c.fields), ctors))(_v) : [])(s), stmts);
var qualRefsFrom = (te) => ((_v) => _v._tag === "TyName" ? [] : _v._tag === "TyArrow" ? (({ from, to }) => [...qualRefsFrom(from), ...qualRefsFrom(to)])(_v) : _v._tag === "TyApp" ? (({ args }) => _Array_flatMap4(qualRefsFrom, args))(_v) : _v._tag === "TyTuple" ? (({ elems }) => _Array_flatMap4(qualRefsFrom, elems))(_v) : _v._tag === "TyList" ? (({ elem }) => qualRefsFrom(elem))(_v) : _v._tag === "TyQual" ? (({ alias, name, nameSpan, args, span: sp }) => [{ alias, name, nameSpan, qualSpan: sp }, ..._Array_flatMap4(qualRefsFrom, args)])(_v) : _v._tag === "TyLit" ? [] : _v._tag === "TyUnion" ? (({ members }) => _Array_flatMap4(qualRefsFrom, members))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(te);
var letInAnnots = (e) => ((_v) => _v._tag === "ENum" ? [] : _v._tag === "EUnit" ? [] : _v._tag === "EBool" ? [] : _v._tag === "EStr" ? [] : _v._tag === "ERef" ? [] : _v._tag === "ECall" ? (({ fn, args }) => [...letInAnnots(fn), ..._Array_flatMap4(letInAnnots, args)])(_v) : _v._tag === "ELambda" ? (({ params, body }) => [...letInAnnots(body), ..._Array_flatMap4((p) => ((_v) => _v._tag === "LPSpanned" && _v.param._tag === "LPLabeled" && _v.param.defaultValue._tag === "Some" ? (({ param: { defaultValue: { value: d } } }) => letInAnnots(d))(_v) : _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some" ? (({ defaultValue: { value: d } }) => letInAnnots(d))(_v) : [])(p), params)])(_v) : _v._tag === "ELetIn" ? (({ annot, value, body }) => [...letInAnnots(value), ...letInAnnots(body), ...((_v) => _v._tag === "Some" ? (({ value: te }) => [te])(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(annot)])(_v) : _v._tag === "ELetBind" ? (({ value, body }) => [...letInAnnots(value), ...letInAnnots(body)])(_v) : _v._tag === "EPipe" ? (({ left, right }) => [...letInAnnots(left), ...letInAnnots(right)])(_v) : _v._tag === "EDo" ? (({ exprs }) => _Array_flatMap4(letInAnnots, exprs))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => [...letInAnnots(cond), ...letInAnnots(thenE), ...letInAnnots(elseE)])(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => [...letInAnnots(scrutinee), ..._Array_flatMap4((a) => [...((_v) => _v._tag === "Some" ? (({ value: g }) => letInAnnots(g))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(a.guard), ...letInAnnots(a.body)], arms)])(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => [...((_v) => _v._tag === "Some" ? (({ value: sp }) => letInAnnots(sp))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(spread), ..._Array_flatMap4((f) => letInAnnots(f.value), fields)])(_v) : _v._tag === "EField" ? (({ target }) => letInAnnots(target))(_v) : _v._tag === "ELoop" ? (({ params, body }) => [..._Array_flatMap4((prm) => letInAnnots(prm.init), params), ...letInAnnots(body)])(_v) : _v._tag === "ERecur" ? (({ args }) => _Array_flatMap4(letInAnnots, args))(_v) : _v._tag === "ETuple" ? (({ elements }) => _Array_flatMap4(letInAnnots, elements))(_v) : _v._tag === "EArr" ? (({ elements }) => _Array_flatMap4(seqElemAnnots, elements))(_v) : _v._tag === "EList" ? (({ elements }) => _Array_flatMap4(seqElemAnnots, elements))(_v) : _v._tag === "ESet" ? (({ elements }) => _Array_flatMap4(seqElemAnnots, elements))(_v) : _v._tag === "EMap" ? (({ entries }) => _Array_flatMap4((en) => [...letInAnnots(en.key), ...letInAnnots(en.value)], entries))(_v) : _v._tag === "EInterp" ? (({ parts }) => _Array_flatMap4((prt) => ((_v) => _v._tag === "IPLit" ? [] : _v._tag === "IPExpr" ? (({ expr: ex }) => letInAnnots(ex))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(prt), parts))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e);
var seqElemAnnots = (el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => letInAnnots(e))(_v) : _v._tag === "SESpread" ? (({ expr: e }) => letInAnnots(e))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el);
var writtenTypeExprs = (stmts) => _Array_flatMap4((s) => ((_v) => _v._tag === "SExtern" ? (({ typeExpr: te }) => [te])(_v) : _v._tag === "SLet" ? (({ annot, value }) => [...((_v) => _v._tag === "Some" ? (({ value: te }) => [te])(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(annot), ...letInAnnots(value)])(_v) : _v._tag === "SExpr" ? (({ value }) => letInAnnots(value))(_v) : _v._tag === "SType" ? (({ ctors, alias, aliasType }) => [..._Array_flatMap4((c) => map8((f) => f.fieldType, c.fields), ctors), ...((_v) => _v._tag === "Some" ? (({ value: fields }) => map8((f) => f.fieldType, fields))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(alias), ...((_v) => _v._tag === "Some" ? (({ value: te }) => [te])(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(aliasType)])(_v) : [])(s), stmts);
var emptyQuals = new Map;
var checkQualifiedTypeNames = _curry14(2, (stmts, quals) => {
  const nsAliases = _Set_fromArray2(_Array_flatMap4((s) => ((_v) => _v._tag === "SImportNs" ? (({ alias }) => [alias.name])(_v) : [])(s), stmts));
  return firstSome((q) => _Set_has2(q.alias, nsAliases) ? ((_v) => _v._tag === "None" ? None13 : _v._tag === "Some" ? (({ value: dep }) => _Set_has2(q.name, dep.types) ? None13 : Some13(checkErr(`module alias '${q.alias}' has no exported type '${q.name}' — export it from the imported module ('export type ${q.name} = …')`, q.nameSpan)))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(_Map_get5(q.alias, quals)) : Some13(checkErr(`unknown module alias '${q.alias}' in type '${q.alias}.${q.name}' — a qualified type name needs a matching 'import * as ${q.alias} from "…"'`, q.qualSpan)), _Array_flatMap4(qualRefsFrom, writtenTypeExprs(stmts)));
});
var checkQualifiedTypeNamesAll = _curry14(2, (stmts, quals) => {
  const nsAliases = _Set_fromArray2(_Array_flatMap4((s) => ((_v) => _v._tag === "SImportNs" ? (({ alias }) => [alias.name])(_v) : [])(s), stmts));
  return _Array_flatMap4((q) => _Set_has2(q.alias, nsAliases) ? ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: dep }) => _Set_has2(q.name, dep.types) ? [] : [checkErr(`module alias '${q.alias}' has no exported type '${q.name}' — export it from the imported module ('export type ${q.name} = …')`, q.nameSpan)])(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(_Map_get5(q.alias, quals)) : [checkErr(`unknown module alias '${q.alias}' in type '${q.alias}.${q.name}' — a qualified type name needs a matching 'import * as ${q.alias} from "…"'`, q.qualSpan)], _Array_flatMap4(qualRefsFrom, writtenTypeExprs(stmts)));
});
var duplicateLoopParam = (params) => {
  let i = 0;
  let seen = _Set_fromArray2([]);
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done6(None13) : _v._tag === "Some" ? (({ value: p }) => _Set_has2(p.name, seen) ? _done6(Some13(checkErr(`duplicate loop param '${p.name}'`, p.nameSpan))) : _recur6(i + 1, _Set_add2(p.name, seen)))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get12(i, params));
    if (_step._tag === "recur") {
      [i, seen] = _step.args;
      continue;
    }
    return _step.value;
  }
};
var checkLoopDo = _curry14(3, (exprs, frame, tail) => {
  let i = 0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done6(None13) : _v._tag === "Some" ? (({ value: expr }) => _Option_isNone(_Array_get12(i + 1, exprs)) ? _done6(checkLoopExpr(expr, frame, tail)) : ((_v) => _v._tag === "Some" ? (({ value: error }) => _done6(Some13(error)))(_v) : _v._tag === "None" ? _recur6(i + 1) : (() => {
      throw new Error("non-exhaustive match");
    })())(checkLoopExpr(expr, frame, false)))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get12(i, exprs));
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var checkLoopExpr = _curry14(3, (e, frame, tail) => ((_v) => _v._tag === "ELoop" ? (({ params, body }) => _Option_orElse(checkLoopExpr(body, Some13({ arity: length11(params), names: _Set_fromArray2(map8((p) => p.name, params)) }), true), _Option_orElse(firstSome((p) => checkLoopExpr(p.init, frame, false), params), duplicateLoopParam(params))))(_v) : _v._tag === "ERecur" ? (({ args, span: sp }) => ((_v) => _v._tag === "None" ? Some13(checkErr("'recur' is only legal inside a loop body", sp)) : _v._tag === "Some" ? (({ value: current }) => !tail ? Some13(checkErr("'recur' must be in tail position of its enclosing loop", sp)) : !eq11(length11(args), current.arity) ? Some13(checkErr(`'recur' takes ${show6(current.arity)} argument${current.arity === 1 ? "" : "s"} (one per loop param), got ${show6(length11(args))}`, sp)) : firstSome((a) => checkLoopExpr(a, frame, false), args))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(frame))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => _Option_orElse(checkLoopExpr(elseE, frame, tail), _Option_orElse(checkLoopExpr(thenE, frame, tail), checkLoopExpr(cond, frame, false))))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => _Option_orElse(firstSome((arm) => ((_v) => _v._tag === "Some" ? (({ value: guard }) => _Option_orElse(checkLoopExpr(arm.body, frame, tail), checkLoopExpr(guard, frame, false)))(_v) : _v._tag === "None" ? checkLoopExpr(arm.body, frame, tail) : (() => {
  throw new Error("non-exhaustive match");
})())(arm.guard), arms), checkLoopExpr(scrutinee, frame, false)))(_v) : _v._tag === "ELetIn" ? (({ name, nameSpan: nameSp, value, body }) => _Option_orElse(checkLoopExpr(body, frame, tail), _Option_orElse(((_v) => _v._tag === "Some" && (({ value: current }) => _Set_has2(name, current.names))(_v) ? (({ value: current }) => Some13(checkErr(`'${name}' shadows a loop param inside the loop body; rename it`, nameSp)))(_v) : None13)(frame), checkLoopExpr(value, frame, false))))(_v) : _v._tag === "ELetBind" ? (({ value, body }) => _Option_orElse(checkLoopExpr(body, None13, false), checkLoopExpr(value, frame, false)))(_v) : _v._tag === "ELambda" ? (({ body }) => checkLoopExpr(body, None13, false))(_v) : _v._tag === "ECall" ? (({ fn, args }) => _Option_orElse(firstSome((a) => checkLoopExpr(a, frame, false), args), checkLoopExpr(fn, frame, false)))(_v) : _v._tag === "EPipe" ? (({ left, right }) => _Option_orElse(checkLoopExpr(right, frame, false), checkLoopExpr(left, frame, false)))(_v) : _v._tag === "EDo" ? (({ exprs }) => checkLoopDo(exprs, frame, tail))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => _Option_orElse(firstSome((field) => checkLoopExpr(field.value, frame, false), fields), ((_v) => _v._tag === "Some" ? (({ value }) => checkLoopExpr(value, frame, false))(_v) : _v._tag === "None" ? None13 : (() => {
  throw new Error("non-exhaustive match");
})())(spread)))(_v) : _v._tag === "EField" ? (({ target }) => checkLoopExpr(target, frame, false))(_v) : _v._tag === "ETuple" ? (({ elements }) => firstSome((el) => checkLoopExpr(el, frame, false), elements))(_v) : _v._tag === "EArr" ? (({ elements }) => firstSome((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => checkLoopExpr(value, frame, false))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => checkLoopExpr(value, frame, false))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements))(_v) : _v._tag === "EList" ? (({ elements }) => firstSome((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => checkLoopExpr(value, frame, false))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => checkLoopExpr(value, frame, false))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements))(_v) : _v._tag === "ESet" ? (({ elements }) => firstSome((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => checkLoopExpr(value, frame, false))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => checkLoopExpr(value, frame, false))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements))(_v) : _v._tag === "EMap" ? (({ entries }) => firstSome((entry) => _Option_orElse(checkLoopExpr(entry.value, frame, false), checkLoopExpr(entry.key, frame, false)), entries))(_v) : _v._tag === "EInterp" ? (({ parts }) => firstSome((part) => ((_v) => _v._tag === "IPLit" ? None13 : _v._tag === "IPExpr" ? (({ expr: value }) => checkLoopExpr(value, frame, false))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(part), parts))(_v) : None13)(e));
var checkLoops = (stmts) => firstSome((stmt) => ((_v) => _v._tag === "SLet" ? (({ value }) => checkLoopExpr(value, None13, false))(_v) : _v._tag === "SExpr" ? (({ value }) => checkLoopExpr(value, None13, false))(_v) : None13)(stmt), stmts);
var loopParamErrors = (params) => {
  let i = 0;
  let seen = _Set_fromArray2([]);
  let errors = [];
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done6(errors) : _v._tag === "Some" ? (({ value: p }) => _recur6(i + 1, _Set_add2(p.name, seen), _Set_has2(p.name, seen) ? [...errors, checkErr(`duplicate loop param '${p.name}'`, p.nameSpan)] : errors))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get12(i, params));
    if (_step._tag === "recur") {
      [i, seen, errors] = _step.args;
      continue;
    }
    return _step.value;
  }
};
var checkLoopDoAll = _curry14(3, (exprs, frame, tail) => {
  let i = 0;
  let errors = [];
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done6(errors) : _v._tag === "Some" ? (({ value: expr }) => ((isLast) => _recur6(i + 1, [...errors, ...checkLoopExprs(expr, frame, isLast ? tail : false)]))(_Option_isNone(_Array_get12(i + 1, exprs))))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get12(i, exprs));
    if (_step._tag === "recur") {
      [i, errors] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var checkLoopExprs = _curry14(3, (e, frame, tail) => ((_v) => _v._tag === "ELoop" ? (({ params, body }) => [...loopParamErrors(params), ..._Array_flatMap4((p) => checkLoopExprs(p.init, frame, false), params), ...checkLoopExprs(body, Some13({ arity: length11(params), names: _Set_fromArray2(map8((p) => p.name, params)) }), true)])(_v) : _v._tag === "ERecur" ? (({ args, span: sp }) => ((siteErrors) => [...siteErrors, ..._Array_flatMap4((a) => checkLoopExprs(a, frame, false), args)])(((_v) => _v._tag === "None" ? [checkErr("'recur' is only legal inside a loop body", sp)] : _v._tag === "Some" ? (({ value: current }) => [...!tail ? [checkErr("'recur' must be in tail position of its enclosing loop", sp)] : [], ...!eq11(length11(args), current.arity) ? [checkErr(`'recur' takes ${show6(current.arity)} argument${current.arity === 1 ? "" : "s"} (one per loop param), got ${show6(length11(args))}`, sp)] : []])(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(frame)))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => [...checkLoopExprs(cond, frame, false), ...checkLoopExprs(thenE, frame, tail), ...checkLoopExprs(elseE, frame, tail)])(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => [...checkLoopExprs(scrutinee, frame, false), ..._Array_flatMap4((arm) => [...((_v) => _v._tag === "Some" ? (({ value: guard }) => checkLoopExprs(guard, frame, false))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(arm.guard), ...checkLoopExprs(arm.body, frame, tail)], arms)])(_v) : _v._tag === "ELetIn" ? (({ name, nameSpan: nameSp, value, body }) => [...((_v) => _v._tag === "Some" && (({ value: current }) => _Set_has2(name, current.names))(_v) ? (({ value: current }) => [checkErr(`'${name}' shadows a loop param inside the loop body; rename it`, nameSp)])(_v) : [])(frame), ...checkLoopExprs(value, frame, false), ...checkLoopExprs(body, frame, tail)])(_v) : _v._tag === "ELetBind" ? (({ value, body }) => [...checkLoopExprs(value, frame, false), ...checkLoopExprs(body, None13, false)])(_v) : _v._tag === "ELambda" ? (({ body }) => checkLoopExprs(body, None13, false))(_v) : _v._tag === "ECall" ? (({ fn, args }) => [...checkLoopExprs(fn, frame, false), ..._Array_flatMap4((a) => checkLoopExprs(a, frame, false), args)])(_v) : _v._tag === "EPipe" ? (({ left, right }) => [...checkLoopExprs(left, frame, false), ...checkLoopExprs(right, frame, false)])(_v) : _v._tag === "EDo" ? (({ exprs }) => checkLoopDoAll(exprs, frame, tail))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => [...((_v) => _v._tag === "Some" ? (({ value }) => checkLoopExprs(value, frame, false))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(spread), ..._Array_flatMap4((field) => checkLoopExprs(field.value, frame, false), fields)])(_v) : _v._tag === "EField" ? (({ target }) => checkLoopExprs(target, frame, false))(_v) : _v._tag === "ETuple" ? (({ elements }) => _Array_flatMap4((el) => checkLoopExprs(el, frame, false), elements))(_v) : _v._tag === "EArr" ? (({ elements }) => _Array_flatMap4((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => checkLoopExprs(value, frame, false))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => checkLoopExprs(value, frame, false))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements))(_v) : _v._tag === "EList" ? (({ elements }) => _Array_flatMap4((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => checkLoopExprs(value, frame, false))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => checkLoopExprs(value, frame, false))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements))(_v) : _v._tag === "ESet" ? (({ elements }) => _Array_flatMap4((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => checkLoopExprs(value, frame, false))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => checkLoopExprs(value, frame, false))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements))(_v) : _v._tag === "EMap" ? (({ entries }) => _Array_flatMap4((entry) => [...checkLoopExprs(entry.key, frame, false), ...checkLoopExprs(entry.value, frame, false)], entries))(_v) : _v._tag === "EInterp" ? (({ parts }) => _Array_flatMap4((part) => ((_v) => _v._tag === "IPLit" ? [] : _v._tag === "IPExpr" ? (({ expr: value }) => checkLoopExprs(value, frame, false))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(part), parts))(_v) : [])(e));
var checkLoopsAll = (stmts) => _Array_flatMap4((stmt) => ((_v) => _v._tag === "SLet" ? (({ value }) => checkLoopExprs(value, None13, false))(_v) : _v._tag === "SExpr" ? (({ value }) => checkLoopExprs(value, None13, false))(_v) : [])(stmt), stmts);
var mergeMissing = _curry14(3, (keys, from, into) => match6(keys).with((_v) => _v.length === 0, () => into).with((_v) => _v.length >= 1, ([k, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: v }) => mergeMissing(rest, from, _Map_has3(k, into) ? into : _Map_set4(k, v, into)))(_v) : _v._tag === "None" ? mergeMissing(rest, from, into) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get5(k, from))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var checkWith = _curry14(3, (stmts, imported, quals) => ((_v) => _v._tag === "Some" ? (({ value: e }) => Err8(e))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: e }) => Err8(e))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: e }) => Err8(e))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: e }) => Err8(e))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: e }) => Err8(e))(_v) : _v._tag === "None" ? _Result_flatMap6((reg0) => ((reg) => ((_v) => _v._tag === "Some" ? (({ value: e }) => Err8(e))(_v) : _v._tag === "None" ? Ok8(stmts) : (() => {
  throw new Error("non-exhaustive match");
})())(firstSome((s) => ((_v) => _v._tag === "SLet" ? (({ value }) => checkExpr(value, reg))(_v) : _v._tag === "SExpr" ? (({ value }) => checkExpr(value, reg))(_v) : None13)(s), stmts)))({ ctors: mergeMissing(_Map_keys5(imported.ctors), imported.ctors, reg0.ctors), types: mergeMissing(_Map_keys5(imported.types), imported.types, reg0.types) }), buildRegistry(stmts)) : (() => {
  throw new Error("non-exhaustive match");
})())(checkLoops(stmts)) : (() => {
  throw new Error("non-exhaustive match");
})())(checkQualifiedTypeNames(stmts, quals)) : (() => {
  throw new Error("non-exhaustive match");
})())(checkCtorFieldVars(stmts)) : (() => {
  throw new Error("non-exhaustive match");
})())(checkReservedWords(stmts)) : (() => {
  throw new Error("non-exhaustive match");
})())(checkReservedNames(stmts)));
var checkAllWith = _curry14(3, (stmts, imported, quals) => ((_v) => _v._tag === "Err" ? (({ error: e }) => ((errors) => length11(errors) === 0 ? Ok8(stmts) : Err8(errors))([...checkReservedNamesAll(stmts), ...checkReservedWordsAll(stmts), ...checkCtorFieldVarsAll(stmts), ...checkQualifiedTypeNamesAll(stmts, quals), ...checkLoopsAll(stmts), e]))(_v) : _v._tag === "Ok" ? (({ value: reg0 }) => ((reg) => ((errors) => length11(errors) === 0 ? Ok8(stmts) : Err8(errors))([...checkReservedNamesAll(stmts), ...checkReservedWordsAll(stmts), ...checkCtorFieldVarsAll(stmts), ...checkQualifiedTypeNamesAll(stmts, quals), ...checkLoopsAll(stmts), ..._Array_flatMap4((stmt) => ((_v) => _v._tag === "SLet" ? (({ value }) => checkExprs(value, reg))(_v) : _v._tag === "SExpr" ? (({ value }) => checkExprs(value, reg))(_v) : [])(stmt), stmts)]))({ ctors: mergeMissing(_Map_keys5(imported.ctors), imported.ctors, reg0.ctors), types: mergeMissing(_Map_keys5(imported.types), imported.types, reg0.types) }))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(buildRegistry(stmts)));
var checkAll = (stmts) => checkAllWith(stmts, { ctors: new Map, types: new Map }, emptyQuals);

import { Err as Err9, None as None16, Ok as Ok9, Some as Some16, _Array_append as _Array_append12, _Array_concat as _Array_concat7, _Array_find as _Array_find4, _Array_flatMap as _Array_flatMap5, _Array_get as _Array_get15, _Array_head as _Array_head4, _Array_prepend as _Array_prepend6, _Map_delete, _Map_get as _Map_get6, _Map_getOr as _Map_getOr6, _Map_has as _Map_has5, _Map_keys as _Map_keys6, _Map_set as _Map_set6, _Option_map, _Option_unwrapOr as _Option_unwrapOr9, _Result_flatMap as _Result_flatMap7, _Result_map as _Result_map6, _Set_add as _Set_add5, _Set_fromArray as _Set_fromArray5, _Set_has as _Set_has4, _Set_size as _Set_size2, _Set_toArray as _Set_toArray2, _Str_length as _Str_length5, _Str_replace, _Str_split as _Str_split4, _Str_startsWith as _Str_startsWith3, _curry as _curry17, _done as _done8, _recur as _recur8, _tuple as _tuple8, and as and11, eq as eq13, length as length13, map as map9, or as or8, reduce as reduce4 } from "@mochi/compiler/runtime";
import { match as match8 } from "@onrails/pattern";

import { _Array_get as _Array_get13, _Set_add as _Set_add3, _Set_fromArray as _Set_fromArray3, _curry as _curry15 } from "@mochi/compiler/runtime";
import { match as match7 } from "@onrails/pattern";
var addBinderNames = _curry15(2, (names, out) => match7(names).with((_v) => _v.length === 0, () => out).with((_v) => _v.length >= 1, ([n, ...rest]) => addBinderNames(rest, _Set_add3(n, out))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var patternNamesOpt = _curry15(2, (p, out) => ((_v) => _v._tag === "None" ? out : _v._tag === "Some" ? (({ value: pat }) => patternNames(pat, out))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p));
var patternNamesAll = _curry15(2, (pats, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([p, ...rest]) => patternNamesAll(rest, patternNames(p, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(pats));
var patternNamesFields = _curry15(2, (fields, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([f, ...rest]) => patternNamesFields(rest, patternNames(f.pat, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields));
var patternNames = _curry15(2, (p, out) => ((_v) => _v._tag === "PAs" ? (({ pat, name }) => patternNames(pat, _Set_add3(name, out)))(_v) : _v._tag === "PBind" ? (({ name }) => _Set_add3(name, out))(_v) : _v._tag === "PTuple" ? (({ elems }) => patternNamesAll(elems, out))(_v) : _v._tag === "PRecord" ? (({ fields }) => patternNamesFields(fields, out))(_v) : _v._tag === "PCtor" ? (({ args }) => patternNamesAll(args, out))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => patternNamesOpt(rest, patternNamesAll(elems, out)))(_v) : _v._tag === "PList" ? (({ elems, rest }) => patternNamesOpt(rest, patternNamesAll(elems, out)))(_v) : _v._tag === "POr" ? (({ alts }) => patternNamesAll(alts, out))(_v) : _v._tag === "PWild" ? out : _v._tag === "PUnit" ? out : _v._tag === "PLit" ? out : _v._tag === "PBool" ? out : _v._tag === "PStr" ? out : (() => {
  throw new Error("non-exhaustive match");
})())(p));
var exprNamesAll = _curry15(2, (exprs, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([e, ...rest]) => exprNamesAll(rest, exprNames(e, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(exprs));
var exprNamesOpt = _curry15(2, (e, out) => ((_v) => _v._tag === "None" ? out : _v._tag === "Some" ? (({ value: ex }) => exprNames(ex, out))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e));
var seqNames = _curry15(2, (elems, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 && _v[0]._tag === "SEExpr" ? (([{ expr: e }, ...rest]) => seqNames(rest, exprNames(e, out)))(_v) : _v.length >= 1 && _v[0]._tag === "SESpread" ? (([{ expr: e }, ...rest]) => seqNames(rest, exprNames(e, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elems));
var fieldNames = _curry15(2, (fields, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([f, ...rest]) => fieldNames(rest, exprNames(f.value, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields));
var entryNames = _curry15(2, (entries, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([ent, ...rest]) => entryNames(rest, exprNames(ent.value, exprNames(ent.key, out))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(entries));
var interpNames = _curry15(2, (parts, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 && _v[0]._tag === "IPLit" ? (([, ...rest]) => interpNames(rest, out))(_v) : _v.length >= 1 && _v[0]._tag === "IPExpr" ? (([{ expr: e }, ...rest]) => interpNames(rest, exprNames(e, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(parts));
var armNames = _curry15(2, (arms, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([arm, ...rest]) => ((out1) => ((out2) => armNames(rest, exprNames(arm.body, out2)))(exprNamesOpt(arm.guard, out1)))(patternNames(arm.pattern, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(arms));
var loopBinderNames = _curry15(2, (params, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([p, ...rest]) => loopBinderNames(rest, exprNames(p.init, _Set_add3(p.name, out))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params));
var paramBinderNames = _curry15(2, (p, out) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => paramBinderNames(inner, out))(_v) : _v._tag === "LPName" ? (({ name }) => _Set_add3(name, out))(_v) : _v._tag === "LPTuple" ? (({ names }) => addBinderNames(names, out))(_v) : _v._tag === "LPRecord" ? (({ fields }) => addBinderNames(fields, out))(_v) : _v._tag === "LPLabeled" ? (({ name, defaultValue }) => exprNamesOpt(defaultValue, _Set_add3(name, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p));
var paramNamesAll = _curry15(2, (params, out) => ((_v) => _v.length === 0 ? out : _v.length >= 1 ? (([p, ...rest]) => paramNamesAll(rest, paramBinderNames(p, out)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params));
var exprNames = _curry15(2, (e, out) => ((_v) => _v._tag === "ENum" ? out : _v._tag === "EUnit" ? out : _v._tag === "EBool" ? out : _v._tag === "EStr" ? out : _v._tag === "ERef" ? out : _v._tag === "EInterp" ? (({ parts }) => interpNames(parts, out))(_v) : _v._tag === "ECall" ? (({ fn, args }) => exprNamesAll(args, exprNames(fn, out)))(_v) : _v._tag === "ELambda" ? (({ params, body }) => exprNames(body, paramNamesAll(params, out)))(_v) : _v._tag === "ELetIn" ? (({ name, value, body }) => exprNames(body, exprNames(value, _Set_add3(name, out))))(_v) : _v._tag === "ELetBind" ? (({ param, value, body }) => exprNames(body, paramBinderNames(param, exprNames(value, out))))(_v) : _v._tag === "EPipe" ? (({ left, right }) => exprNames(right, exprNames(left, out)))(_v) : _v._tag === "EDo" ? (({ exprs }) => exprNamesAll(exprs, out))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => exprNames(elseE, exprNames(thenE, exprNames(cond, out))))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => armNames(arms, exprNames(scrutinee, out)))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => fieldNames(fields, exprNamesOpt(spread, out)))(_v) : _v._tag === "EField" ? (({ target }) => exprNames(target, out))(_v) : _v._tag === "ELoop" ? (({ params, body }) => exprNames(body, loopBinderNames(params, out)))(_v) : _v._tag === "ERecur" ? (({ args }) => exprNamesAll(args, out))(_v) : _v._tag === "ETuple" ? (({ elements }) => exprNamesAll(elements, out))(_v) : _v._tag === "EArr" ? (({ elements }) => seqNames(elements, out))(_v) : _v._tag === "EList" ? (({ elements }) => seqNames(elements, out))(_v) : _v._tag === "ESet" ? (({ elements }) => seqNames(elements, out))(_v) : _v._tag === "EMap" ? (({ entries }) => entryNames(entries, out))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e));
var namesFromStmts = _curry15(3, (stmts, i, out) => ((_v) => _v._tag === "None" ? out : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { value } }) => namesFromStmts(stmts, i + 1, exprNames(value, out)))(_v) : _v._tag === "Some" && _v.value._tag === "SExpr" ? (({ value: { value } }) => namesFromStmts(stmts, i + 1, exprNames(value, out)))(_v) : _v._tag === "Some" ? namesFromStmts(stmts, i + 1, out) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get13(i, stmts)));
var localBinderNames = (stmts) => namesFromStmts(stmts, 0, _Set_fromArray3([]));

import { _Array_append as _Array_append11, _Array_drop as _Array_drop2, _Array_get as _Array_get14, _Array_take as _Array_take3, _Map_getOr as _Map_getOr5, _Map_has as _Map_has4, _Map_set as _Map_set5, _Set_add as _Set_add4, _Set_diff as _Set_diff2, _Set_fromArray as _Set_fromArray4, _Set_has as _Set_has3, _curry as _curry16, _done as _done7, _recur as _recur7, eq as eq12, length as length12, min as min2 } from "@mochi/compiler/runtime";
var hasIndex = _curry16(2, (v, st) => _Map_has4(v, st.index));
var indexOfV = _curry16(2, (v, st) => _Map_getOr5(-1, v, st.index));
var lowOfV = _curry16(2, (v, st) => _Map_getOr5(-1, v, st.low));
var neighborsOf = _curry16(2, (v, adj) => ((_v) => _v._tag === "Some" ? (({ value: ws }) => ws)(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get14(v, adj)));
var indexOfFrom = _curry16(3, (v, xs, i) => {
  let j = i;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done7(-1) : _v._tag === "Some" ? (({ value: x }) => eq12(x, v) ? _done7(j) : _recur7(j + 1))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get14(j, xs));
    if (_step._tag === "recur") {
      j = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var visitNeighbors = _curry16(4, (v, ws, adj, st) => {
  let remaining = ws;
  let current = st;
  while (true) {
    const _step = ((_v) => _v.length === 0 ? _done7(current) : _v.length >= 1 ? (([w, ...rest]) => hasIndex(w, current) ? _Set_has3(w, current.onStack) ? _recur7(rest, { ...current, low: _Map_set5(v, min2(lowOfV(v, current), indexOfV(w, current)), current.low) }) : _recur7(rest, current) : ((next) => _recur7(rest, { ...next, low: _Map_set5(v, min2(lowOfV(v, next), lowOfV(w, next)), next.low) }))(connect(w, adj, current)))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(remaining);
    if (_step._tag === "recur") {
      [remaining, current] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var connect = _curry16(3, (v, adj, st) => {
  const st1 = { ...st, index: _Map_set5(v, st.counter, st.index), low: _Map_set5(v, st.counter, st.low), onStack: _Set_add4(v, st.onStack), stack: _Array_append11(v, st.stack), counter: st.counter + 1 };
  const st2 = visitNeighbors(v, neighborsOf(v, adj), adj, st1);
  return eq12(lowOfV(v, st2), indexOfV(v, st2)) ? ((start) => ((comp) => ({ ...st2, onStack: _Set_diff2(st2.onStack, _Set_fromArray4(comp)), stack: _Array_take3(start, st2.stack), sccs: _Array_append11(comp, st2.sccs) }))(_Array_drop2(start, st2.stack)))(indexOfFrom(v, st2.stack, 0)) : st2;
});
var connectAllFrom = _curry16(4, (i, n, adj, st) => {
  let j = i;
  let current = st;
  while (true) {
    if (j >= n) {
      return current;
    } else {
      [j, current] = [j + 1, hasIndex(j, current) ? current : connect(j, adj, current)];
      continue;
    }
  }
});
var stronglyConnected = (adj) => {
  const n = length12(adj);
  const initSt = { index: new Map([]), low: new Map([]), onStack: _Set_fromArray4([]), stack: [], counter: 0, sccs: [] };
  return connectAllFrom(0, n, adj, initSt).sccs;
};

var setLetBindMonad = _curry17(2, ($receiver, $value) => $receiver["monad"] = $value);
var setFieldOptional = _curry17(2, ($receiver, $value) => $receiver["optional"] = $value);
var exprSpan3 = (e) => ((_v) => _v._tag === "ENum" ? (({ span: sp }) => sp)(_v) : _v._tag === "EUnit" ? (({ span: sp }) => sp)(_v) : _v._tag === "EBool" ? (({ span: sp }) => sp)(_v) : _v._tag === "EStr" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERef" ? (({ span: sp }) => sp)(_v) : _v._tag === "ECall" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELambda" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELetIn" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELetBind" ? (({ span: sp }) => sp)(_v) : _v._tag === "EPipe" ? (({ span: sp }) => sp)(_v) : _v._tag === "EDo" ? (({ span: sp }) => sp)(_v) : _v._tag === "ETernary" ? (({ span: sp }) => sp)(_v) : _v._tag === "EMatch" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELoop" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERecur" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERecord" ? (({ span: sp }) => sp)(_v) : _v._tag === "EField" ? (({ span: sp }) => sp)(_v) : _v._tag === "ETuple" ? (({ span: sp }) => sp)(_v) : _v._tag === "EArr" ? (({ span: sp }) => sp)(_v) : _v._tag === "EList" ? (({ span: sp }) => sp)(_v) : _v._tag === "ESet" ? (({ span: sp }) => sp)(_v) : _v._tag === "EMap" ? (({ span: sp }) => sp)(_v) : _v._tag === "EInterp" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e);
var patSpan3 = (p) => ((_v) => _v._tag === "PWild" ? (({ span: sp }) => sp)(_v) : _v._tag === "PUnit" ? (({ span: sp }) => sp)(_v) : _v._tag === "PBind" ? (({ span: sp }) => sp)(_v) : _v._tag === "PAs" ? (({ span: sp }) => sp)(_v) : _v._tag === "PLit" ? (({ span: sp }) => sp)(_v) : _v._tag === "PBool" ? (({ span: sp }) => sp)(_v) : _v._tag === "PStr" ? (({ span: sp }) => sp)(_v) : _v._tag === "PTuple" ? (({ span: sp }) => sp)(_v) : _v._tag === "PRecord" ? (({ span: sp }) => sp)(_v) : _v._tag === "PCtor" ? (({ span: sp }) => sp)(_v) : _v._tag === "PArr" ? (({ span: sp }) => sp)(_v) : _v._tag === "PList" ? (({ span: sp }) => sp)(_v) : _v._tag === "POr" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p);
var noSuggestions = [];
var noErrs = [];
var annotSpan = (t) => ((_v) => _v._tag === "TyName" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyArrow" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyApp" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyTuple" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyList" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyQual" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyLit" ? (({ span: sp }) => sp)(_v) : _v._tag === "TyUnion" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(t);
var typeErr = _curry17(2, (msg, sp) => ({ message: msg, start: sp.start, end: sp.end, help: None16, suggestions: noSuggestions }));
var typeErrHelp = _curry17(3, (msg, sp, help) => ({ message: msg, start: sp.start, end: sp.end, help: Some16(help), suggestions: noSuggestions }));
var typeErrSuggest = _curry17(4, (msg, sp, help, hint) => ({ message: msg, start: sp.start, end: sp.end, help: Some16(help), suggestions: [{ title: `Did you mean '${hint}'?`, start: sp.start, end: sp.end, replaceWith: hint }] }));
var lastSeg = (name) => {
  const parts = _Str_split4(".", name);
  return _Option_unwrapOr9(name, _Array_get15(length13(parts) - 1, parts));
};
var aliasRowFrom = _curry17(3, (fields, aliases, i) => ((_v) => _v._tag === "None" ? RowEmpty : _v._tag === "Some" ? (({ value: f }) => (([t, _vars, _st]) => rField(f.name, t, aliasRowFrom(fields, aliases, i + 1), f.optional))(typeExprToType(f.fieldType, new Map, mkSt(0), aliases, _Set_fromArray5([]))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(i, fields)));
var shownOfAlias = _curry17(2, (info, aliases) => length13(info.params) !== 0 ? None16 : ((_v) => _v._tag === "Some" ? None16 : _v._tag === "None" ? length13(info.fields) === 0 ? None16 : Some16(showType(tRecord(aliasRowFrom(info.fields, aliases, 0)))) : (() => {
  throw new Error("non-exhaustive match");
})())(info.expr));
var longerPrint = _curry17(2, (p, q) => _Str_length5(p.shown) >= _Str_length5(q.shown));
var insertPrint = _curry17(2, (p, xs) => match8(xs).with((_v) => _v.length === 0, () => [p]).with((_v) => _v.length >= 1, ([q, ...rest]) => longerPrint(p, q) ? _Array_prepend6(p, xs) : _Array_prepend6(q, insertPrint(p, rest))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var printsFrom = _curry17(4, (keys, aliases, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: key }) => ((_v) => _v._tag === "None" ? printsFrom(keys, aliases, i + 1, acc) : _v._tag === "Some" ? (({ value: info }) => ((_v) => _v._tag === "None" ? printsFrom(keys, aliases, i + 1, acc) : _v._tag === "Some" ? (({ value: shown }) => printsFrom(keys, aliases, i + 1, insertPrint({ shown, name: lastSeg(key) }, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(shownOfAlias(info, aliases)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(key, aliases)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(i, keys)));
var applyPrints = _curry17(3, (msg, prints, i) => ((_v) => _v._tag === "None" ? msg : _v._tag === "Some" ? (({ value: p }) => applyPrints(_Str_replace(p.shown, p.name, msg), prints, i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(i, prints)));
var nameAliases = _curry17(2, (msg, aliases) => applyPrints(msg, printsFrom(_Map_keys6(aliases), aliases, 0, []), 0));
var u = _curry17(5, (ctx, left, right, st, sp) => ((_v) => _v._tag === "Ok" ? (({ value: newSt }) => Ok9(newSt))(_v) : _v._tag === "Err" ? (({ error: e }) => Err9(typeErr(nameAliases(e.message, ctx.aliasMap), sp)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(unify(left, right, st)));
var checkFits = _curry17(5, (ctx, actual, expected, st, sp) => ((_v) => _v._tag === "Ok" ? (({ value: newSt }) => Ok9(newSt))(_v) : _v._tag === "Err" ? (({ error: e }) => Err9(typeErr(nameAliases(e.message, ctx.aliasMap), sp)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fits(actual, expected, st)));
var bindParamNamesFrom = _curry17(3, (names, env, st) => match8(names).with((_v) => _v.length === 0, () => _tuple8([], env, st)).with((_v) => _v.length >= 1, ([n, ...rest]) => (([t, st1]) => (([restTs, env2, st2]) => _tuple8(_Array_prepend6(t, restTs), env2, st2))(bindParamNamesFrom(rest, _Map_set6(n, mono(t), env), st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var bindParamFieldsFrom = _curry17(4, (fields, env, row, st) => ((_v) => _v.length === 0 ? _tuple8(row, env, st) : _v.length >= 1 ? (([f, ...rest]) => (([ft, st1]) => bindParamFieldsFrom(rest, _Map_set6(f, mono(ft), env), rExtend(f, ft, row), st1))(freshVar(st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields));
var recordParamNamesFrom = _curry17(5, (names, spans, types, i, st) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" && _v[2]._tag === "Some" ? (([{ value: n }, { value: sp }, { value: t }]) => recordParamNamesFrom(names, spans, types, i + 1, recordBinder(sp, t, "parameter", n, None16, st)))(_v) : st)(_tuple8(_Array_get15(i, names), _Array_get15(i, spans), _Array_get15(i, types))));
var envTypesOf = _curry17(2, (names, env) => _Array_flatMap5((n) => ((_v) => _v._tag === "Some" ? (({ value: sc }) => [sc.ty])(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(n, env)), names));
var bindParam = _curry17(3, (p, env, st) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner, nameSpans: spans }) => (([t, env1, st1]) => ((_v) => _v._tag === "LPTuple" ? (({ names }) => ((elems) => _tuple8(t, env1, recordParamNamesFrom(names, spans, elems, 0, st1)))(((_v) => _v._tag === "TyCon" ? (({ args: ts }) => ts)(_v) : [])(t)))(_v) : _v._tag === "LPRecord" ? (({ fields }) => _tuple8(t, env1, recordParamNamesFrom(fields, spans, envTypesOf(fields, env1), 0, st1)))(_v) : _tuple8(t, env1, st1))(inner))(bindParam(inner, env, st)))(_v) : _v._tag === "LPName" ? (({ name }) => (([t, st1]) => _tuple8(t, _Map_set6(name, mono(t), env), st1))(freshVar(st)))(_v) : _v._tag === "LPTuple" ? (({ names }) => (([elems, env1, st1]) => _tuple8(tTuple(elems), env1, st1))(bindParamNamesFrom(names, env, st)))(_v) : _v._tag === "LPRecord" ? (({ fields }) => (([rowBase, st1]) => (([row, env1, st2]) => _tuple8(tRecord(row), env1, st2))(bindParamFieldsFrom(fields, env, rowBase, st1)))(freshRowVar(st)))(_v) : _v._tag === "LPLabeled" ? (({ name }) => (([t, st1]) => _tuple8(t, _Map_set6(name, mono(t), env), st1))(freshVar(st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p));
var bindParamsFrom = _curry17(3, (params, env, st) => ((_v) => _v.length === 0 ? _tuple8([], env, st) : _v.length >= 1 ? (([p, ...rest]) => (([t, env1, st1]) => (([restTs, env2, st2]) => _tuple8(_Array_prepend6(t, restTs), env2, st2))(bindParamsFrom(rest, env1, st1)))(bindParam(p, env, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params));
var constrainParamAnnotsFrom = _curry17(5, (ctx, params, paramTypes, vars, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8(vars, st)) : _v.length >= 1 ? (([param, ...rest]) => ((_v) => _v.length === 0 ? Ok9(_tuple8(vars, st)) : _v.length >= 1 ? (([paramT, ...restTypes]) => ((_v) => _v._tag === "LPSpanned" && _v.param._tag === "LPName" && _v.param.annot._tag === "Some" ? (({ param: { annot: { value: te } } }) => (([annotT, vars1, st1]) => _Result_flatMap7((st2) => constrainParamAnnotsFrom(ctx, rest, restTypes, vars1, st2), checkFits(ctx, paramT, annotT, st1, annotSpan(te))))(typeExprToType(te, vars, st, ctx.aliasMap, _Set_fromArray5([]))))(_v) : constrainParamAnnotsFrom(ctx, rest, restTypes, vars, st))(param))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(paramTypes))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params));
var arrowChain = _curry17(2, (paramTypes, resultT) => ((_v) => _v.length === 0 ? tArrow(tUnit, resultT) : _v.length === 1 ? (([p]) => tArrow(p, resultT))(_v) : _v.length >= 1 ? (([p, ...rest]) => tArrow(p, arrowChain(rest, resultT)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(paramTypes));
var ctxWithEnv = _curry17(2, (ctx, env) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: ctx.loopStack, letOwner: ctx.letOwner, localNames: ctx.localNames, scopeNames: ctx.scopeNames }));
var ctxWithGroup = _curry17(3, (ctx, env, names) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: ctx.loopStack, letOwner: ctx.letOwner, localNames: ctx.localNames, scopeNames: _Array_concat7(names, ctx.scopeNames) }));
var ctxWithLets = _curry17(3, (ctx, env, letOwner) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: ctx.loopStack, letOwner, localNames: ctx.localNames, scopeNames: ctx.scopeNames }));
var ctxWithLoop = _curry17(4, (ctx, env, frame, letOwner) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: _Array_prepend6(frame, ctx.loopStack), letOwner, localNames: ctx.localNames, scopeNames: ctx.scopeNames }));
var inferLoopParamsFrom = _curry17(7, (ctx, params, i, envAcc, frameAcc, ownerAcc, st) => ((_v) => _v._tag === "None" ? Ok9(_tuple8(frameAcc, envAcc, ownerAcc, st)) : _v._tag === "Some" ? (({ value: p }) => _Result_flatMap7(([t, st1]) => ((sp) => inferLoopParamsFrom(ctx, params, i + 1, _Map_set6(p.name, mono(t), envAcc), _Array_append12(t, frameAcc), _Map_set6(p.name, sp, ownerAcc), noteLet(sp, recordBinder(p.nameSpan, t, "let", p.name, None16, st1))))(exprSpan3(p.init)), inferExpr(ctx, p.init, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(i, params)));
var unifyRecurArgsFrom = _curry17(5, (ctx, args, frame, i, st) => ((_v) => _v._tag === "None" ? Ok9(st) : _v._tag === "Some" ? (({ value: a }) => _Result_flatMap7(([at, st1]) => ((_v) => _v._tag === "None" ? unifyRecurArgsFrom(ctx, args, frame, i + 1, st1) : _v._tag === "Some" ? (({ value: pt }) => _Result_flatMap7((st2) => unifyRecurArgsFrom(ctx, args, frame, i + 1, st2), u(ctx, at, pt, st1, exprSpan3(a))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(i, frame)), inferExpr(ctx, a, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(i, args)));
var inferRecur = _curry17(4, (ctx, args, sp, st) => ((_v) => _v.length === 0 ? Err9(typeErr("'recur' is only legal inside a loop body", sp)) : _v.length >= 1 ? (([frame]) => _Result_flatMap7((st1) => (([t, st2]) => Ok9(_tuple8(t, st2)))(freshVar(st1)), unifyRecurArgsFrom(ctx, args, frame, 0, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(ctx.loopStack));
var rowHasOptional = (row) => ((_v) => _v._tag === "RowExtend" ? (({ optional, rest }) => or8(optional, rowHasOptional(rest)))(_v) : false)(row);
var domainNeedsFits = _curry17(2, (t, st) => ((_v) => _v._tag === "TyRecord" ? (({ row }) => rowHasOptional(row))(_v) : false)(zonk(t, st)));
var rowAllOptional = (row) => ((_v) => _v._tag === "RowExtend" ? (({ optional, rest }) => and11(optional, rowAllOptional(rest)))(_v) : true)(row);
var domainIsOmittableRecord = _curry17(2, (t, st) => ((_v) => _v._tag === "TyRecord" ? (({ row }) => rowAllOptional(row))(_v) : false)(zonk(t, st)));
var isLabeledParam2 = (p) => ((_v) => _v._tag === "LPLabeled" ? true : _v._tag === "LPSpanned" ? (({ param: inner }) => isLabeledParam2(inner))(_v) : false)(p);
var splitLamParams = _curry17(3, (params, positional, labeled) => ((_v) => _v.length === 0 ? _tuple8(positional, labeled) : _v.length >= 1 ? (([p, ...rest]) => isLabeledParam2(p) ? splitLamParams(rest, positional, _Array_append12(p, labeled)) : splitLamParams(rest, _Array_append12(p, positional), labeled))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params));
var labFieldsFrom = _curry17(5, (ctx, labs, env, vars, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8([], st)) : _v.length >= 1 ? (([lab, ...rest]) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => labFieldsFrom(ctx, [inner, ...rest], env, vars, st))(_v) : _v._tag === "LPLabeled" ? (({ name, annot, optional, defaultValue }) => (([fieldT, vars1, st1]) => _Result_flatMap7(([fieldT1, st2]) => ((bodyT) => ((omittable) => _Result_flatMap7(([fields, stN]) => Ok9(_tuple8(_Array_prepend6({ name, fieldType: fieldT1, omittable, bodyType: bodyT }, fields), stN)), labFieldsFrom(ctx, rest, env, vars1, st2)))(or8(optional, ((_v) => _v._tag === "Some" ? true : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(defaultValue))))(((_v) => _v._tag === "Some" ? fieldT1 : _v._tag === "None" ? optional ? tCon("Option", [fieldT1]) : fieldT1 : (() => {
  throw new Error("non-exhaustive match");
})())(defaultValue)), ((_v) => _v._tag === "None" ? Ok9(_tuple8(fieldT, st1)) : _v._tag === "Some" ? (({ value: d }) => _Result_flatMap7(([dt, s2]) => ((_v) => _v._tag === "Some" ? _Result_flatMap7((s3) => Ok9(_tuple8(fieldT, s3)), checkFits(ctx, dt, fieldT, s2, exprSpan3(d))) : _v._tag === "None" ? ((widened) => _Result_flatMap7((s3) => Ok9(_tuple8(widened, s3)), u(ctx, fieldT, widened, s2, exprSpan3(d))))(widenLits(zonk(dt, s2))) : (() => {
  throw new Error("non-exhaustive match");
})())(annot), inferExpr(ctxWithEnv(ctx, env), d, st1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(defaultValue)))(((_v) => _v._tag === "Some" ? (({ value: te }) => typeExprToType(te, vars, st, ctx.aliasMap, _Set_fromArray5([])))(_v) : _v._tag === "None" ? (([t, s1]) => _tuple8(t, vars, s1))(freshVar(st)) : (() => {
  throw new Error("non-exhaustive match");
})())(annot)))(_v) : labFieldsFrom(ctx, rest, env, vars, st))(lab))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(labs));
var rowOfLabFields = (fields) => match8(fields).with((_v) => _v.length === 0, () => RowEmpty).with((_v) => _v.length >= 1, ([f, ...rest]) => rField(f.name, f.fieldType, rowOfLabFields(rest), f.omittable)).otherwise(() => {
  throw new Error("non-exhaustive match");
});
var envWithLabFields = _curry17(2, (fields, env) => match8(fields).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([f, ...rest]) => envWithLabFields(rest, _Map_set6(f.name, mono(f.bodyType), env))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var recordLabParamsFrom = _curry17(3, (labs, fields, st) => ((_v) => _v.length === 0 ? st : _v.length >= 1 && _v[0]._tag === "LPSpanned" && _v[0].param._tag === "LPLabeled" && _v[0].nameSpans.length >= 1 ? (([{ param: { name }, nameSpans: [sp] }, ...rest]) => recordLabParamsFrom(rest, fields, ((_v) => _v._tag === "Some" ? (({ value: f }) => recordBinder(sp, f.bodyType, "parameter", name, None16, st))(_v) : _v._tag === "None" ? st : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_find4((f) => eq13(f.name, name), fields))))(_v) : _v.length >= 1 ? (([, ...rest]) => recordLabParamsFrom(rest, fields, st))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(labs));
var recordNameParamsFrom = _curry17(3, (params, types, st) => ((_v) => _v[0].length >= 1 && _v[0][0]._tag === "LPSpanned" && _v[0][0].param._tag === "LPName" && _v[0][0].nameSpans.length >= 1 && _v[1].length >= 1 ? (([[{ param: { name }, nameSpans: [sp] }, ...rest], [t, ...ts]]) => recordNameParamsFrom(rest, ts, recordBinder(sp, t, "parameter", name, None16, st)))(_v) : _v[0].length >= 1 && _v[1].length >= 1 ? (([[, ...rest], [, ...ts]]) => recordNameParamsFrom(rest, ts, st))(_v) : st)(_tuple8(params, types)));
var inferCallArgs = _curry17(5, (ctx, fnT, args, st, callSpan) => ((_v) => _v.length === 0 ? Ok9(_tuple8(fnT, st)) : _v.length >= 1 ? (([arg, ...rest]) => _Result_flatMap7(([argT, st1]) => ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => domainNeedsFits(fromT, st1) ? _Result_flatMap7((st2) => inferCallArgs(ctx, toT, rest, st2, callSpan), checkFits(ctx, argT, fromT, st1, exprSpan3(arg))) : (([resultT, st2]) => _Result_flatMap7((st3) => inferCallArgs(ctx, resultT, rest, st3, callSpan), u(ctx, fnT, tArrow(argT, resultT), st2, exprSpan3(arg))))(freshVar(st1)))(_v) : (([resultT, st2]) => _Result_flatMap7((st3) => inferCallArgs(ctx, resultT, rest, st3, callSpan), u(ctx, fnT, tArrow(argT, resultT), st2, exprSpan3(arg))))(freshVar(st1)))(resolve(fnT, st1)), inferExpr(ctx, arg, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(args));
var isTupleParam = (p) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => isTupleParam(inner))(_v) : _v._tag === "LPTuple" ? true : false)(p);
var inferTupleLet = _curry17(6, (ctx, param, body, lamSpan, value, st) => _Result_flatMap7(([valueT, st1]) => (([paramT, bodyEnv, st2]) => _Result_flatMap7((st3) => _Result_flatMap7(([bodyT, st4]) => Ok9(_tuple8(bodyT, recordAt(lamSpan, tArrow(paramT, bodyT), st4))), inferExpr(ctxWithEnv(ctx, bodyEnv), body, st3)), u(ctx, paramT, valueT, st2, exprSpan3(value))))(bindParam(param, ctx.env, st1)), inferExpr(ctx, value, st)));
var inferApplied = _curry17(4, (ctx, fn, args, st) => _Result_flatMap7(([fnT, st1]) => ((_v) => _v.length === 0 ? ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => domainIsOmittableRecord(fromT, st1) ? _Result_flatMap7((st2) => Ok9(_tuple8(toT, st2)), checkFits(ctx, tRecord(RowEmpty), fromT, st1, exprSpan3(fn))) : (([resultT, st2]) => _Result_flatMap7((st3) => Ok9(_tuple8(resultT, st3)), u(ctx, fnT, tArrow(tUnit, resultT), st2, exprSpan3(fn))))(freshVar(st1)))(_v) : (([resultT, st2]) => _Result_flatMap7((st3) => Ok9(_tuple8(resultT, st3)), u(ctx, fnT, tArrow(tUnit, resultT), st2, exprSpan3(fn))))(freshVar(st1)))(resolve(fnT, st1)) : inferCallArgs(ctx, fnT, args, st1, exprSpan3(fn)))(args), inferExpr(ctx, fn, st)));
var inferNormalCall = _curry17(4, (ctx, fn, args, st) => ((_v) => _v[0]._tag === "ELambda" && _v[0].params.length === 1 && _v[1].length === 1 ? (([{ params: [param], body, span: lamSpan }, [value]]) => isTupleParam(param) ? inferTupleLet(ctx, param, body, lamSpan, value, st) : inferApplied(ctx, fn, args, st))(_v) : inferApplied(ctx, fn, args, st))(_tuple8(fn, args)));
var inferTernary = _curry17(5, (ctx, cond, thenE, elseE, st) => _Result_flatMap7(([condT, st1]) => _Result_flatMap7((st2) => _Result_flatMap7(([thenT, st3]) => _Result_flatMap7(([elseT, st4]) => _Result_flatMap7((st5) => Ok9(_tuple8(thenT, st5)), u(ctx, thenT, elseT, st4, exprSpan3(elseE))), inferExpr(ctx, elseE, st3)), inferExpr(ctx, thenE, st2)), u(ctx, condT, tBool, st1, exprSpan3(cond))), inferExpr(ctx, cond, st)));
var bindNameOf = (p) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => bindNameOf(inner))(_v) : _v._tag === "LPName" ? (({ name }) => Some16(name))(_v) : None16)(p);
var inferBindBody = _curry17(7, (ctx, param, paramSpan, body, payloadT, mkBody, st) => (([paramT, bodyEnv, st1]) => _Result_flatMap7((st2) => ((stNamed) => _Result_flatMap7(([bodyT, st3]) => (([resT, st4]) => {
  const wantBody = mkBody(resT);
  return _Result_flatMap7((st5) => Ok9(_tuple8(wantBody, st5)), u(ctx, bodyT, wantBody, st4, exprSpan3(body)));
})(freshVar(st3)), inferExpr(ctxWithEnv(ctx, bodyEnv), body, stNamed)))(((_v) => _v._tag === "Some" ? (({ value: name }) => recordBinder(paramSpan, payloadT, "let", name, None16, st2))(_v) : _v._tag === "None" ? st2 : (() => {
  throw new Error("non-exhaustive match");
})())(bindNameOf(param))), u(ctx, paramT, payloadT, st1, paramSpan)))(bindParam(param, ctx.env, st)));
var inferTwoSlotBind = _curry17(8, (ctx, param, paramSpan, value, body, valT, ctor, st) => (([payloadT, st1]) => (([errT, st2]) => _Result_flatMap7((st3) => inferBindBody(ctx, param, paramSpan, body, payloadT, (resT) => tCon(ctor, [resT, errT]), st3), u(ctx, valT, tCon(ctor, [payloadT, errT]), st2, exprSpan3(value))))(freshVar(st1)))(freshVar(st)));
var inferQuestionBind = _curry17(8, (ctx, bind, param, paramSpan, value, body, valT, st) => ((_v) => _v._tag === "TyVar" ? (($written) => inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Result", st))(setLetBindMonad(bind, "Result")) : _v._tag === "TyCon" ? (({ name }) => name === "Option" ? (($written) => (([payloadT, st1]) => _Result_flatMap7((st2) => inferBindBody(ctx, param, paramSpan, body, payloadT, (resT) => tCon("Option", [resT]), st2), u(ctx, valT, tCon("Option", [payloadT]), st1, exprSpan3(value))))(freshVar(st)))(setLetBindMonad(bind, "Option")) : name === "Result" ? (($written) => inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Result", st))(setLetBindMonad(bind, "Result")) : Err9(typeErr(`let? requires Option or Result, got ${showType(zonk(valT, st))}`, exprSpan3(value))))(_v) : Err9(typeErr(`let? requires Option or Result, got ${showType(zonk(valT, st))}`, exprSpan3(value))))(resolve(valT, st)));
var inferLetBind = _curry17(8, (ctx, bind, param, paramSpan, monad, value, body, st) => _Result_flatMap7(([valT, st1]) => monad === "Task" ? inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Task", st1) : inferQuestionBind(ctx, bind, param, paramSpan, value, body, valT, st1), inferExpr(ctx, value, st)));
var inferRecordRow = _curry17(3, (ctx, fields, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8(RowEmpty, st)) : _v.length >= 1 ? (([f, ...rest]) => _Result_flatMap7(([restRow, st1]) => _Result_flatMap7(([ft, st2]) => Ok9(_tuple8(rExtend(f.name, ft, restRow), st2)), inferExpr(ctx, f.value, st1)), inferRecordRow(ctx, rest, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields));
var rWithTail = _curry17(2, (row, tail) => ((_v) => _v._tag === "RowEmpty" ? tail : _v._tag === "RowVar" ? (({ id }) => rVar(id))(_v) : _v._tag === "RowExtend" ? (({ label, fieldType, optional, rest }) => rField(label, fieldType, rWithTail(rest, tail), optional))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(row));
var lookupField = _curry17(2, (row, name) => ((_v) => _v._tag === "RowExtend" ? (({ label, fieldType, optional, rest }) => eq13(label, name) ? Some16(_tuple8(fieldType, optional)) : lookupField(rest, name))(_v) : None16)(row));
var rowEndsEmpty = (row) => ((_v) => _v._tag === "RowEmpty" ? true : _v._tag === "RowExtend" ? (({ rest }) => rowEndsEmpty(rest))(_v) : _v._tag === "RowVar" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(row);
var inferFieldAccess = _curry17(6, (ctx, field, target, name, sp, st) => _Result_flatMap7(([targetT, st1]) => ((zonked) => ((_v) => _v._tag === "TyRecord" ? (({ row }) => ((_v) => _v._tag === "Some" ? (({ value: [ft, optional] }) => optional ? (($written) => Ok9(_tuple8(tCon("Option", [ft]), st1)))(setFieldOptional(field, true)) : Ok9(_tuple8(ft, st1)))(_v) : _v._tag === "None" ? rowEndsEmpty(row) ? Err9(typeErr(`record missing field '${name}'`, sp)) : inferDuckField(ctx, targetT, name, sp, st1) : (() => {
  throw new Error("non-exhaustive match");
})())(lookupField(row, name)))(_v) : inferDuckField(ctx, targetT, name, sp, st1))(zonked))(zonk(targetT, st1)), inferExpr(ctx, target, st)));
var inferDuckField = _curry17(5, (ctx, targetT, name, sp, st) => (([fieldT, st2]) => (([restRow, st3]) => _Result_flatMap7((st4) => Ok9(_tuple8(fieldT, st4)), u(ctx, targetT, tRecord(rExtend(name, fieldT, restRow)), st3, sp)))(freshRowVar(st2)))(freshVar(st)));
var inferNsField = _curry17(5, (ctx, tname, name, sp, st) => ((_v) => _v._tag === "Some" ? (({ value: sc }) => (([t, st1]) => Ok9(_tuple8(t, st1)))(instantiate(sc, st)))(_v) : _v._tag === "None" ? Err9(typeErr(`'${tname}' has no member '${name}'`, sp)) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(name, _Map_getOr6(new Map, tname, ctx.ns))));
var inferInterpParts = _curry17(3, (ctx, parts, st) => ((_v) => _v.length === 0 ? Ok9(st) : _v.length >= 1 && _v[0]._tag === "IPLit" ? (([, ...rest]) => inferInterpParts(ctx, rest, st))(_v) : _v.length >= 1 && _v[0]._tag === "IPExpr" ? (([{ expr: ex }, ...rest]) => _Result_flatMap7(([t, st1]) => _Result_flatMap7((st2) => inferInterpParts(ctx, rest, st2), u(ctx, t, tString, st1, exprSpan3(ex))), inferExpr(ctx, ex, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(parts));
var inferTupleElems = _curry17(3, (ctx, elements, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8([], st)) : _v.length >= 1 ? (([el, ...rest]) => _Result_flatMap7(([t, st1]) => _Result_flatMap7(([restTs, st2]) => Ok9(_tuple8(_Array_prepend6(t, restTs), st2)), inferTupleElems(ctx, rest, st1)), inferExpr(ctx, el, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elements));
var seqElemExpr2 = (el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el);
var inferSeqSlotsElems = _curry17(5, (ctx, con, elem, elements, st) => ((_v) => _v.length === 0 ? Ok9(st) : _v.length >= 1 ? (([slot, ...rest]) => ((ex) => _Result_flatMap7(([et, st1]) => ((want) => _Result_flatMap7((st2) => inferSeqSlotsElems(ctx, con, elem, rest, st2), u(ctx, want, et, st1, exprSpan3(ex))))(((_v) => _v._tag === "SEExpr" ? elem : _v._tag === "SESpread" ? tCon(con, [elem]) : (() => {
  throw new Error("non-exhaustive match");
})())(slot)), inferExpr(ctx, ex, st)))(seqElemExpr2(slot)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elements));
var inferSeqSlots = _curry17(4, (ctx, con, elements, st) => (([elem, st1]) => _Result_flatMap7((st2) => Ok9(_tuple8(tCon(con, [elem]), st2)), inferSeqSlotsElems(ctx, con, elem, elements, st1)))(freshVar(st)));
var inferMapEntries = _curry17(5, (ctx, k, v, entries, st) => ((_v) => _v.length === 0 ? Ok9(st) : _v.length >= 1 ? (([ent, ...rest]) => _Result_flatMap7(([kt, st1]) => _Result_flatMap7((st2) => _Result_flatMap7(([vt, st3]) => _Result_flatMap7((st4) => inferMapEntries(ctx, k, v, rest, st4), u(ctx, v, vt, st3, exprSpan3(ent.value))), inferExpr(ctx, ent.value, st2)), u(ctx, k, kt, st1, exprSpan3(ent.key))), inferExpr(ctx, ent.key, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(entries));
var inferMapExpr = _curry17(3, (ctx, entries, st) => (([k, st1]) => (([v, st2]) => _Result_flatMap7((st3) => Ok9(_tuple8(tCon("Map", [k, v]), st3)), inferMapEntries(ctx, k, v, entries, st2)))(freshVar(st1)))(freshVar(st)));
var mergeBindingMapsFrom = _curry17(3, (keys, src, dest) => match8(keys).with((_v) => _v.length === 0, () => dest).with((_v) => _v.length >= 1, ([k, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: v }) => mergeBindingMapsFrom(rest, src, _Map_set6(k, v, dest)))(_v) : _v._tag === "None" ? mergeBindingMapsFrom(rest, src, dest) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(k, src))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var mergeBindingMaps = _curry17(2, (dest, src) => mergeBindingMapsFrom(_Map_keys6(src), src, dest));
var mergeEnvBindingsFrom = _curry17(3, (keys, bindings, env) => match8(keys).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([k, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: t }) => mergeEnvBindingsFrom(rest, bindings, _Map_set6(k, mono(t), env)))(_v) : _v._tag === "None" ? mergeEnvBindingsFrom(rest, bindings, env) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(k, bindings))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var mergeEnvBindings = _curry17(2, (bindings, env) => mergeEnvBindingsFrom(_Map_keys6(bindings), bindings, env));
var inferArms = _curry17(5, (ctx, scrutT, resultT, arms, st) => ((_v) => _v.length === 0 ? Ok9(st) : _v.length >= 1 ? (([arm, ...rest]) => _Result_flatMap7(([patT, bindings, st1]) => _Result_flatMap7((st2) => ((armCtx) => _Result_flatMap7((st3) => _Result_flatMap7(([bodyT, st4]) => _Result_flatMap7((st5) => inferArms(ctx, scrutT, resultT, rest, st5), u(ctx, resultT, bodyT, st4, exprSpan3(arm.body))), inferExpr(armCtx, arm.body, st3)), ((_v) => _v._tag === "None" ? Ok9(st2) : _v._tag === "Some" ? (({ value: g }) => _Result_flatMap7(([guardT, stg]) => u(ctx, tBool, guardT, stg, exprSpan3(g)), inferExpr(armCtx, g, st2)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(arm.guard)))(ctxWithEnv(ctx, mergeEnvBindings(bindings, ctx.env))), u(ctx, scrutT, patT, st1, patSpan3(arm.pattern))), inferPat(ctx, arm.pattern, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(arms));
var inferMatch = _curry17(4, (ctx, scrutinee, arms, st) => _Result_flatMap7(([scrutT, st1]) => (([resultT, st2]) => _Result_flatMap7((st3) => Ok9(_tuple8(resultT, st3)), inferArms(ctx, scrutT, resultT, arms, st2)))(freshVar(st1)), inferExpr(ctx, scrutinee, st)));
var inferExpr = _curry17(3, (ctx, e, st) => _Result_flatMap7(([t, st1]) => Ok9(_tuple8(t, ((_v) => _v._tag === "EField" ? (({ name, span: sp }) => recordBinder(sp, t, "property", name, None16, st1))(_v) : recordAt(exprSpan3(e), t, st1))(e))), inferExprRaw(ctx, e, st)));
var inferExprRaw = _curry17(3, (ctx, e, st) => ((_v) => _v._tag === "ENum" ? Ok9(_tuple8(tNumber, st)) : _v._tag === "EUnit" ? Ok9(_tuple8(tUnit, st)) : _v._tag === "EBool" ? Ok9(_tuple8(tBool, st)) : _v._tag === "EStr" ? (({ value }) => Ok9(_tuple8(tLit(value), st)))(_v) : _v._tag === "ERef" ? (({ name, span: sp }) => ((_v) => _v._tag === "Some" ? (({ value: sc }) => (([t, st1]) => Ok9(_tuple8(t, ((_v) => _v._tag === "Some" ? (({ value: vsp }) => noteUse(vsp, t, st1))(_v) : _v._tag === "None" ? st1 : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(name, ctx.letOwner)))))(instantiate(sc, st)))(_v) : _v._tag === "None" ? ctx.open ? _Set_has4(name, ctx.localNames) ? Err9(typeErrHelp(`'${name}' is not in scope here`, sp, "it is bound elsewhere in this file, but not around this use — check the binder's extent")) : (([t, st1]) => Ok9(_tuple8(t, st1)))(freshVar(st)) : ((_v) => _v._tag === "Some" ? (({ value: hint }) => Err9(typeErrSuggest(`unbound variable '${name}'`, sp, `did you mean '${hint}'?`, hint)))(_v) : _v._tag === "None" ? Err9(typeErrHelp(`unbound variable '${name}'`, sp, "bind the name before using it, or check the spelling")) : (() => {
  throw new Error("non-exhaustive match");
})())(closestName(name, _Map_keys6(ctx.env))) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(name, ctx.env)))(_v) : _v._tag === "ELambda" ? (({ params, body }) => (([posParams, labParams]) => (([paramTypes, bodyEnv, st1]) => _Result_flatMap7(([annotVars, st2]) => _Result_flatMap7(([labFields, st3]) => ((allTypes) => ((st3Labs) => _Result_flatMap7(([bodyT, st4]) => Ok9(_tuple8(arrowChain(allTypes, bodyT), recordNameParamsFrom(posParams, paramTypes, st4))), inferExpr(ctxWithEnv(ctx, envWithLabFields(labFields, bodyEnv)), body, st3Labs)))(recordLabParamsFrom(labParams, labFields, st3)))(((_v) => _v.length === 0 ? paramTypes : _Array_append12(tRecord(rowOfLabFields(labFields)), paramTypes))(labParams)), labFieldsFrom(ctx, labParams, bodyEnv, annotVars, st2)), constrainParamAnnotsFrom(ctx, posParams, paramTypes, new Map, st1)))(bindParamsFrom(posParams, ctx.env, st)))(splitLamParams(params, [], [])))(_v) : _v._tag === "ELetIn" ? (({ name, nameSpan, annot, value, body, span: _span }) => ((_v) => _v._tag === "ELambda" ? ((lets) => ((idxOf) => ((tail) => (([localCtx, localSt, localErrs]) => ((_v) => _v._tag === "Some" ? (({ value: firstErr }) => Err9(firstErr))(_v) : _v._tag === "None" ? inferExpr(localCtx, tail, localSt) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(0, localErrs)))(processGroupsFrom(ctx, stronglyConnected(adjOf(lets, idxOf)), lets, st, noErrs)))(localTail(e)))(idxOfMap(lets)))(localLetsFrom(e)) : _Result_flatMap7(([valT, st1]) => _Result_flatMap7(([pinned, st2]) => ((widen) => ((sc) => ((vsp) => (($ctx) => inferExpr($ctx, body, noteLet(vsp, recordBinder(nameSpan, pinned, "let", name, None16, st2))))(ctxWithLets(ctx, _Map_set6(name, sc, ctx.env), _Map_set6(name, vsp, ctx.letOwner))))(exprSpan3(value)))(generalizeOver(ctx.env, ctx.scopeNames, pinned, st2, widen)))(((_v) => _v._tag === "Some" ? false : _v._tag === "None" ? true : (() => {
  throw new Error("non-exhaustive match");
})())(annot)), ((_v) => _v._tag === "Some" ? (({ value: te }) => (([at, _, stA]) => _Result_map6((stB) => _tuple8(at, stB), checkFits(ctx, valT, at, stA, annotSpan(te))))(typeExprToType(te, new Map, st1, ctx.aliasMap, _Set_fromArray5([]))))(_v) : _v._tag === "None" ? Ok9(_tuple8(valT, st1)) : (() => {
  throw new Error("non-exhaustive match");
})())(annot)), inferExpr(ctx, value, st)))(value))(_v) : _v._tag === "ELetBind" ? (({ param, paramSpan, monad, value, body }) => inferLetBind(ctx, e, param, paramSpan, monad, value, body, st))(_v) : _v._tag === "ECall" ? (({ fn, args, origin }) => ((api) => _Result_flatMap7((claimed) => ((_v) => _v._tag === "Some" ? (({ value: r }) => Ok9(r))(_v) : _v._tag === "None" ? inferNormalCall(ctx, fn, args, st) : (() => {
  throw new Error("non-exhaustive match");
})())(claimed), runInferCallHooks(inferCallHooksOf(ctx.plugins), fn, args, origin, st, api)))({ inferExpr: _curry17(2, (e, st0) => inferExpr(ctx, e, st0)), unify: _curry17(4, (left, right, st0, sp) => u(ctx, left, right, st0, sp)) }))(_v) : _v._tag === "EPipe" && _v.fast === true ? (({ left, right, span: sp }) => ((_v) => _v._tag === "ECall" ? (({ fn: rfn, args: rargs, origin }) => inferExpr(ctx, ECall(rfn, _Array_prepend6(left, rargs), origin, sp), st))(_v) : inferExpr(ctx, ECall(right, [left], None16, sp), st))(right))(_v) : _v._tag === "EPipe" ? (({ left, right, span: sp }) => inferExpr(ctx, ECall(right, [left], None16, sp), st))(_v) : _v._tag === "EDo" ? (({ exprs }) => inferDo(ctx, exprs, st))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => inferTernary(ctx, cond, thenE, elseE, st))(_v) : _v._tag === "ERecord" ? (({ fields, spread, span: sp }) => ((_v) => _v._tag === "None" ? _Result_flatMap7(([row, st1]) => Ok9(_tuple8(tRecord(row), st1)), inferRecordRow(ctx, fields, st)) : _v._tag === "Some" ? (({ value: spreadExpr }) => _Result_flatMap7(([row, st1]) => _Result_flatMap7(([baseT, st2]) => (([tailVar, st3]) => _Result_flatMap7((st4) => Ok9(_tuple8(baseT, st4)), u(ctx, baseT, tRecord(rWithTail(row, tailVar)), st3, sp)))(freshRowVar(st2)), inferExpr(ctx, spreadExpr, st1)), inferRecordRow(ctx, fields, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(spread))(_v) : _v._tag === "EField" ? (({ target, name, span: sp }) => ((_v) => _v._tag === "ERef" ? (({ name: tname }) => and11(_Map_has5(tname, ctx.ns), !_Map_has5(tname, ctx.env)) ? inferNsField(ctx, tname, name, sp, st) : inferFieldAccess(ctx, e, target, name, sp, st))(_v) : inferFieldAccess(ctx, e, target, name, sp, st))(target))(_v) : _v._tag === "ETuple" ? (({ elements }) => _Result_flatMap7(([elems, st1]) => Ok9(_tuple8(tTuple(elems), st1)), inferTupleElems(ctx, elements, st)))(_v) : _v._tag === "EArr" ? (({ elements }) => inferSeqSlots(ctx, "Array", elements, st))(_v) : _v._tag === "EList" ? (({ elements }) => inferSeqSlots(ctx, "List", elements, st))(_v) : _v._tag === "ESet" ? (({ elements }) => inferSeqSlots(ctx, "Set", elements, st))(_v) : _v._tag === "EMap" ? (({ entries }) => inferMapExpr(ctx, entries, st))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => inferMatch(ctx, scrutinee, arms, st))(_v) : _v._tag === "ELoop" ? (({ params, body }) => _Result_flatMap7(([frame, bodyEnv, bodyOwner, st1]) => inferExpr(ctxWithLoop(ctx, bodyEnv, frame, bodyOwner), body, st1), inferLoopParamsFrom(ctx, params, 0, ctx.env, [], ctx.letOwner, st)))(_v) : _v._tag === "ERecur" ? (({ args, span: sp }) => inferRecur(ctx, args, sp, st))(_v) : _v._tag === "EInterp" ? (({ parts }) => _Result_flatMap7((st1) => Ok9(_tuple8(tString, st1)), inferInterpParts(ctx, parts, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e));
var inferDo = _curry17(3, (ctx, exprs, st) => ((_v) => _v.length === 0 ? Err9(typeErr("internal: empty do block", { start: 0, end: 0 })) : _v.length === 1 ? (([last]) => inferExpr(ctx, last, st))(_v) : _v.length >= 1 ? (([first, ...rest]) => _Result_flatMap7(([_, st1]) => inferDo(ctx, rest, st1), inferExpr(ctx, first, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(exprs));
var inferPatRecordFrom = _curry17(5, (ctx, fields, row, bindings, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8(row, bindings, st)) : _v.length >= 1 ? (([f, ...rest]) => _Result_flatMap7(([subT, subBindings, st1]) => inferPatRecordFrom(ctx, rest, rExtend(f.label, subT, row), mergeBindingMaps(bindings, subBindings), recordBinder(f.labelSpan, subT, "property", f.label, None16, st1)), inferPat(ctx, f.pat, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields));
var inferPatRecord = _curry17(3, (ctx, fields, st) => (([rowBase, st1]) => _Result_flatMap7(([row, bindings, st2]) => Ok9(_tuple8(tRecord(row), bindings, st2)), inferPatRecordFrom(ctx, fields, rowBase, new Map, st1)))(freshRowVar(st)));
var inferPatCtorArgs = _curry17(7, (ctx, ctor, curT, args, st, bindings, sp) => ((_v) => _v.length === 0 ? Ok9(_tuple8(curT, bindings, st)) : _v.length >= 1 ? (([argPat, ...rest]) => ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => _Result_flatMap7(([subT, subBindings, st1]) => _Result_flatMap7((st2) => inferPatCtorArgs(ctx, ctor, toT, rest, st2, mergeBindingMaps(bindings, subBindings), sp), u(ctx, fromT, subT, st1, patSpan3(argPat))), inferPat(ctx, argPat, st)))(_v) : Err9(typeErr(`constructor '${ctor}' applied to too many arguments`, sp)))(resolve(curT, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(args));
var inferPatTupleFrom = _curry17(3, (ctx, elems, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8([], new Map, st)) : _v.length >= 1 ? (([ep, ...rest]) => _Result_flatMap7(([t, bindings, st1]) => _Result_flatMap7(([restTs, restBindings, st2]) => Ok9(_tuple8(_Array_prepend6(t, restTs), mergeBindingMaps(restBindings, bindings), st2)), inferPatTupleFrom(ctx, rest, st1)), inferPat(ctx, ep, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elems));
var inferPatTuple = _curry17(3, (ctx, elems, st) => _Result_flatMap7(([elemTs, bindings, st1]) => Ok9(_tuple8(tTuple(elemTs), bindings, st1)), inferPatTupleFrom(ctx, elems, st)));
var inferSeqPatElems = _curry17(4, (ctx, elem, elems, st) => ((_v) => _v.length === 0 ? Ok9(_tuple8(new Map, st)) : _v.length >= 1 ? (([ep, ...rest]) => _Result_flatMap7(([subT, subBindings, st1]) => _Result_flatMap7((st2) => _Result_flatMap7(([restBindings, st3]) => Ok9(_tuple8(mergeBindingMaps(restBindings, subBindings), st3)), inferSeqPatElems(ctx, elem, rest, st2)), u(ctx, elem, subT, st1, patSpan3(ep))), inferPat(ctx, ep, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elems));
var inferSeqPat = _curry17(5, (ctx, con, elems, restPat, st) => (([elem, st1]) => {
  const seqT = tCon(con, [elem]);
  return _Result_flatMap7(([bindings, st2]) => ((_v) => _v._tag === "None" ? Ok9(_tuple8(seqT, bindings, st2)) : _v._tag === "Some" ? (({ value: r }) => _Result_flatMap7(([subT, subBindings, st3]) => _Result_flatMap7((st4) => Ok9(_tuple8(seqT, mergeBindingMaps(bindings, subBindings), st4)), u(ctx, subT, seqT, st3, patSpan3(r))), inferPat(ctx, r, st2)))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(restPat), inferSeqPatElems(ctx, elem, elems, st1));
})(freshVar(st)));
var inferPat = _curry17(3, (ctx, p, st) => _Result_flatMap7(([t, bindings, st1]) => Ok9(_tuple8(t, bindings, ((_v) => _v._tag === "PBind" ? (({ name, span: sp }) => recordBinder(sp, t, "parameter", name, None16, st1))(_v) : recordAt(patSpan3(p), t, st1))(p))), inferPatRaw(ctx, p, st)));
var inferPatRaw = _curry17(3, (ctx, p, st) => ((_v) => _v._tag === "PAs" ? (({ pat, name, nameSpan }) => _Result_flatMap7(([t, bindings, st1]) => Ok9(_tuple8(t, _Map_set6(name, t, bindings), recordBinder(nameSpan, t, "parameter", name, None16, st1))), inferPat(ctx, pat, st)))(_v) : _v._tag === "PWild" ? (([t, st1]) => Ok9(_tuple8(t, new Map, st1)))(freshVar(st)) : _v._tag === "PUnit" ? Ok9(_tuple8(tUnit, new Map, st)) : _v._tag === "PLit" ? Ok9(_tuple8(tNumber, new Map, st)) : _v._tag === "PBool" ? Ok9(_tuple8(tBool, new Map, st)) : _v._tag === "PStr" ? (({ value }) => Ok9(_tuple8(tLit(value), new Map, st)))(_v) : _v._tag === "PBind" ? (({ name }) => (([t, st1]) => Ok9(_tuple8(t, _Map_set6(name, t, new Map), st1)))(freshVar(st)))(_v) : _v._tag === "PRecord" ? (({ fields }) => inferPatRecord(ctx, fields, st))(_v) : _v._tag === "PCtor" ? (({ ctor, args, ns, span: sp }) => ((_v) => _v._tag === "Some" ? (({ value: alias }) => ((_v) => _v._tag === "None" ? Err9(typeErr(`'${alias}' has no member '${ctor}'`, sp)) : _v._tag === "Some" ? (({ value: sc }) => (([curT, st1]) => inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map, sp))(instantiate(sc, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(ctor, _Map_getOr6(new Map, alias, ctx.ns))))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "None" ? Err9(typeErr(`unknown constructor '${ctor}'`, sp)) : _v._tag === "Some" ? (({ value: sc }) => (([curT, st1]) => inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map, sp))(instantiate(sc, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(ctor, ctx.env)) : (() => {
  throw new Error("non-exhaustive match");
})())(ns))(_v) : _v._tag === "PTuple" ? (({ elems }) => inferPatTuple(ctx, elems, st))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => inferSeqPat(ctx, "Array", elems, rest, st))(_v) : _v._tag === "PList" ? (({ elems, rest }) => inferSeqPat(ctx, "List", elems, rest, st))(_v) : _v._tag === "POr" ? (({ alts, span: sp }) => inferOrPat(ctx, alts, sp, st))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p));
var unifyOrPatBinding = _curry17(6, (ctx, name, altBindings, bindings, st, sp) => ((_v) => _v._tag === "None" ? Ok9(st) : _v._tag === "Some" ? (({ value: prevT }) => ((_v) => _v._tag === "None" ? Ok9(st) : _v._tag === "Some" ? (({ value: ty }) => u(ctx, prevT, ty, st, sp))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(name, altBindings)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(name, bindings)));
var unifyOrPatBindings = _curry17(6, (ctx, names, altBindings, bindings, st, sp) => match8(names).with((_v) => _v.length === 0, () => Ok9(st)).with((_v) => _v.length >= 1, ([name, ...rest]) => _Result_flatMap7((st1) => unifyOrPatBindings(ctx, rest, altBindings, bindings, st1, sp), unifyOrPatBinding(ctx, name, altBindings, bindings, st, sp))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferOrPatAlts = _curry17(6, (ctx, alts, i, t, bindings, st) => ((_v) => _v._tag === "None" ? Ok9(st) : _v._tag === "Some" ? (({ value: alt }) => _Result_flatMap7(([altT, altBindings, st1]) => _Result_flatMap7((st2) => _Result_flatMap7((st3) => inferOrPatAlts(ctx, alts, i + 1, t, bindings, st3), unifyOrPatBindings(ctx, _Map_keys6(altBindings), altBindings, bindings, st2, patSpan3(alt))), u(ctx, t, altT, st1, patSpan3(alt))), inferPat(ctx, alt, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(i, alts)));
var inferOrPat = _curry17(4, (ctx, alts, sp, st) => ((_v) => _v.length === 0 ? Err9(typeErr("or-pattern needs at least one alternative", sp)) : _v.length >= 1 ? (([first, ...rest]) => _Result_flatMap7(([t, bindings, st1]) => _Result_flatMap7((st2) => Ok9(_tuple8(t, bindings, st2)), inferOrPatAlts(ctx, rest, 0, t, bindings, st1)), inferPat(ctx, first, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(alts));
var patternBindsOpt = (rest) => ((_v) => _v._tag === "Some" ? (({ value: r }) => patternBinds(r))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(rest);
var patternBinds = (p) => ((_v) => _v._tag === "PAs" ? (({ pat, name }) => _Array_append12(name, patternBinds(pat)))(_v) : _v._tag === "PBind" ? (({ name }) => [name])(_v) : _v._tag === "PRecord" ? (({ fields }) => _Array_flatMap5((f) => patternBinds(f.pat), fields))(_v) : _v._tag === "PCtor" ? (({ args }) => _Array_flatMap5(patternBinds, args))(_v) : _v._tag === "PTuple" ? (({ elems }) => _Array_flatMap5(patternBinds, elems))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => _Array_concat7(_Array_flatMap5(patternBinds, elems), patternBindsOpt(rest)))(_v) : _v._tag === "PList" ? (({ elems, rest }) => _Array_concat7(_Array_flatMap5(patternBinds, elems), patternBindsOpt(rest)))(_v) : _v._tag === "POr" ? (({ alts }) => ((_v) => _v._tag === "Some" ? (({ value: first }) => patternBinds(first))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_head4(alts)))(_v) : [])(p);
var addAllFrom = _curry17(2, (names, set) => match8(names).with((_v) => _v.length === 0, () => set).with((_v) => _v.length >= 1, ([n, ...rest]) => addAllFrom(rest, _Set_add5(n, set))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var paramBound = _curry17(2, (p, bound) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => paramBound(inner, bound))(_v) : _v._tag === "LPName" ? (({ name }) => _Set_add5(name, bound))(_v) : _v._tag === "LPTuple" ? (({ names }) => addAllFrom(names, bound))(_v) : _v._tag === "LPRecord" ? (({ fields }) => addAllFrom(fields, bound))(_v) : _v._tag === "LPLabeled" ? (({ name }) => _Set_add5(name, bound))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p));
var lambdaBound = _curry17(2, (params, bound) => ((_v) => _v.length === 0 ? bound : _v.length >= 1 ? (([p, ...rest]) => lambdaBound(rest, paramBound(p, bound)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params));
var labeledDefaultRefs = _curry17(3, (params, bound, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([p, ...rest]) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => labeledDefaultRefs([inner, ...rest], bound, acc))(_v) : _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some" ? (({ defaultValue: { value: d } }) => labeledDefaultRefs(rest, bound, freeRefs(d, bound, acc)))(_v) : labeledDefaultRefs(rest, bound, acc))(p))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params));
var loopBound = _curry17(2, (params, bound) => reduce4(_curry17(2, (b, p) => _Set_add5(p.name, b)), bound, params));
var loopInitRefsFrom = _curry17(4, (params, i, bound, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: p }) => loopInitRefsFrom(params, i + 1, bound, freeRefs(p.init, bound, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(i, params)));
var freeRefsList = _curry17(3, (es, bound, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([e, ...rest]) => freeRefsList(rest, bound, freeRefs(e, bound, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(es));
var freeRefsFields = _curry17(3, (fields, bound, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([f, ...rest]) => freeRefsFields(rest, bound, freeRefs(f.value, bound, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fields));
var freeRefsEntries = _curry17(3, (entries, bound, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([ent, ...rest]) => freeRefsEntries(rest, bound, freeRefs(ent.value, bound, freeRefs(ent.key, bound, acc))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(entries));
var freeRefsInterpParts = _curry17(3, (parts, bound, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 && _v[0]._tag === "IPLit" ? (([, ...rest]) => freeRefsInterpParts(rest, bound, acc))(_v) : _v.length >= 1 && _v[0]._tag === "IPExpr" ? (([{ expr: ex }, ...rest]) => freeRefsInterpParts(rest, bound, freeRefs(ex, bound, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(parts));
var freeRefsArms = _curry17(3, (arms, bound, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([arm, ...rest]) => ((armBound) => ((acc1) => freeRefsArms(rest, bound, freeRefs(arm.body, armBound, acc1)))(((_v) => _v._tag === "Some" ? (({ value: g }) => freeRefs(g, armBound, acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(arm.guard)))(addAllFrom(patternBinds(arm.pattern), bound)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(arms));
var freeRefs = _curry17(3, (e, bound, acc) => ((_v) => _v._tag === "ENum" ? acc : _v._tag === "EUnit" ? acc : _v._tag === "EBool" ? acc : _v._tag === "EStr" ? acc : _v._tag === "ERef" ? (({ name }) => _Set_has4(name, bound) ? acc : _Set_add5(name, acc))(_v) : _v._tag === "ECall" ? (({ fn, args }) => freeRefsList(args, bound, freeRefs(fn, bound, acc)))(_v) : _v._tag === "ELambda" ? (({ params, body }) => freeRefs(body, lambdaBound(params, bound), labeledDefaultRefs(params, bound, acc)))(_v) : _v._tag === "ELetIn" ? (({ name, value, body }) => ((valueBound) => ((acc1) => freeRefs(body, _Set_add5(name, bound), acc1))(freeRefs(value, valueBound, acc)))(((_v) => _v._tag === "ELambda" ? _Set_add5(name, bound) : bound)(value)))(_v) : _v._tag === "ELetBind" ? (({ param, value, body }) => ((acc1) => freeRefs(body, paramBound(param, bound), acc1))(freeRefs(value, bound, acc)))(_v) : _v._tag === "EPipe" ? (({ left, right }) => freeRefs(right, bound, freeRefs(left, bound, acc)))(_v) : _v._tag === "EDo" ? (({ exprs }) => freeRefsList(exprs, bound, acc))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => freeRefs(elseE, bound, freeRefs(thenE, bound, freeRefs(cond, bound, acc))))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => freeRefsArms(arms, bound, freeRefs(scrutinee, bound, acc)))(_v) : _v._tag === "ELoop" ? (({ params, body }) => freeRefs(body, loopBound(params, bound), loopInitRefsFrom(params, 0, bound, acc)))(_v) : _v._tag === "ERecur" ? (({ args }) => freeRefsList(args, bound, acc))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => freeRefsFields(fields, bound, ((_v) => _v._tag === "Some" ? (({ value: s }) => freeRefs(s, bound, acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(spread)))(_v) : _v._tag === "EField" ? (({ target }) => freeRefs(target, bound, acc))(_v) : _v._tag === "ETuple" ? (({ elements }) => freeRefsList(elements, bound, acc))(_v) : _v._tag === "EArr" ? (({ elements }) => freeRefsList(map9(seqElemExpr2, elements), bound, acc))(_v) : _v._tag === "EList" ? (({ elements }) => freeRefsList(map9(seqElemExpr2, elements), bound, acc))(_v) : _v._tag === "ESet" ? (({ elements }) => freeRefsList(map9(seqElemExpr2, elements), bound, acc))(_v) : _v._tag === "EMap" ? (({ entries }) => freeRefsEntries(entries, bound, acc))(_v) : _v._tag === "EInterp" ? (({ parts }) => freeRefsInterpParts(parts, bound, acc))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e));
var seedBuiltinsFrom = _curry17(4, (keys, builtins, env, st) => match8(keys).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([n, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: t }) => seedBuiltinsFrom(rest, builtins, _Map_set6(n, generalize(env, t, st, true), env), st))(_v) : _v._tag === "None" ? seedBuiltinsFrom(rest, builtins, env, st) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(n, builtins))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedBuiltins = _curry17(3, (builtins, env, st) => seedBuiltinsFrom(_Map_keys6(builtins), builtins, env, st));
var seedNsMembersFrom = _curry17(5, (keys, members, env, st, acc) => match8(keys).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([m, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: t }) => seedNsMembersFrom(rest, members, env, st, _Map_set6(m, generalize(env, t, st, true), acc)))(_v) : _v._tag === "None" ? seedNsMembersFrom(rest, members, env, st, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(m, members))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedNsFrom = _curry17(5, (nsNames, namespaces, env, st, acc) => match8(nsNames).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([nsName, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: members }) => seedNsFrom(rest, namespaces, env, st, _Map_set6(nsName, seedNsMembersFrom(_Map_keys6(members), members, env, st, new Map), acc)))(_v) : _v._tag === "None" ? seedNsFrom(rest, namespaces, env, st, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(nsName, namespaces))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedNs = _curry17(3, (namespaces, env, st) => seedNsFrom(_Map_keys6(namespaces), namespaces, env, st, new Map));
var seedNsImportsFrom = _curry17(3, (aliases, nsImports, ns) => match8(aliases).with((_v) => _v.length === 0, () => ns).with((_v) => _v.length >= 1, ([alias, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: members }) => seedNsImportsFrom(rest, nsImports, _Map_set6(alias, members, ns)))(_v) : _v._tag === "None" ? seedNsImportsFrom(rest, nsImports, ns) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(alias, nsImports))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedNsImports = _curry17(2, (nsImports, ns) => seedNsImportsFrom(_Map_keys6(nsImports), nsImports, ns));
var aliasMapFrom = _curry17(2, (stmts, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SType" && _v.alias._tag === "Some" ? (({ name, params, alias: { value: fields } }) => aliasMapFrom(rest, _Map_set6(name, { params, fields, expr: None16 }, acc)))(_v) : _v._tag === "SType" && _v.aliasType._tag === "Some" ? (({ name, params, aliasType: { value: te } }) => aliasMapFrom(rest, _Map_set6(name, { params, fields: [], expr: Some16(te) }, acc)))(_v) : aliasMapFrom(rest, acc))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(stmts));
var registerCtorsFrom = _curry17(6, (ctors, typeName, params, aliasMap, env, st) => match8(ctors).with((_v) => _v.length === 0, () => _tuple8(env, st)).with((_v) => _v.length >= 1, ([c, ...rest]) => (([sc, st1]) => registerCtorsFrom(rest, typeName, params, aliasMap, _Map_set6(c.name, sc, env), st1))(ctorScheme(typeName, params, c, st, aliasMap))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerUserCtorsFrom = _curry17(4, (stmts, aliasMap, env, st) => ((_v) => _v.length === 0 ? _tuple8(env, st) : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SType" ? (({ name, params, ctors }) => (([env1, st1]) => registerUserCtorsFrom(rest, aliasMap, env1, st1))(registerCtorsFrom(ctors, name, params, aliasMap, env, st)))(_v) : registerUserCtorsFrom(rest, aliasMap, env, st))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(stmts));
var registerBuiltinCtorGroup = _curry17(6, (ctors, typeName, params, aliasMap, env, st) => match8(ctors).with((_v) => _v.length === 0, () => _tuple8(env, st)).with((_v) => _v.length >= 1, ([c, ...rest]) => _Map_has5(c.name, env) ? registerBuiltinCtorGroup(rest, typeName, params, aliasMap, env, st) : (([sc, st1]) => registerBuiltinCtorGroup(rest, typeName, params, aliasMap, _Map_set6(c.name, sc, env), st1))(ctorScheme(typeName, params, c, st, aliasMap))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerBuiltinCtorsFrom = _curry17(4, (decls, aliasMap, env, st) => match8(decls).with((_v) => _v.length === 0, () => _tuple8(env, st)).with((_v) => _v.length >= 1, ([d, ...rest]) => (([env1, st1]) => registerBuiltinCtorsFrom(rest, aliasMap, env1, st1))(registerBuiltinCtorGroup(d.ctors, d.name, d.params, aliasMap, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerExternsFrom = _curry17(4, (stmts, aliasMap, env, st) => ((_v) => _v.length === 0 ? _tuple8(env, st) : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SExtern" ? (({ name, nameSpan, params, typeExpr, doc }) => (([vars, st0]) => (([t, _, st1]) => {
  const sc = generalize(env, t, st1, false);
  return registerExternsFrom(rest, aliasMap, _Map_set6(name, sc, env), recordBinder(nameSpan, sc.ty, "extern", name, doc, st1));
})(typeExprToType(typeExpr, vars, st0, aliasMap, _Set_fromArray5([]))))(reduce4(_curry17(2, ([vs, s], param) => (([v, s1]) => _tuple8(_Map_set6(param, v, vs), s1))(freshVar(s))), _tuple8(new Map, st), params)))(_v) : registerExternsFrom(rest, aliasMap, env, st))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(stmts));
var letsOfFrom = (stmts) => ((_v) => _v.length === 0 ? [] : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" ? _Array_prepend6(s, letsOfFrom(rest)) : letsOfFrom(rest))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(stmts);
var localLetsFrom = (e) => {
  const collect = _curry17(2, (current, acc) => ((_v) => _v._tag === "ELetIn" ? (({ name, nameSpan, annot, value, body, span }) => ((_v) => _v._tag === "ELambda" ? collect(body, _Array_append12(SLet(name, nameSpan, annot, value, false, None16, span), acc)) : acc)(value))(_v) : acc)(current));
  return collect(e, []);
};
var localTail = (e) => ((_v) => _v._tag === "ELetIn" && _v.value._tag === "ELambda" ? (({ body }) => localTail(body))(_v) : e)(e);
var idxOfFrom = _curry17(3, (lets, i0, acc0) => {
  let i = i0;
  let acc = acc0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done8(acc) : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { name } }) => _recur8(i + 1, _Map_set6(name, i, acc)))(_v) : _v._tag === "Some" ? _recur8(i + 1, acc) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get15(i, lets));
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var idxOfMap = (lets) => idxOfFrom(lets, 0, new Map);
var depsOf = _curry17(2, (letStmt, idxOf) => ((_v) => _v._tag === "SLet" ? (({ value }) => _Array_flatMap5((r) => ((_v) => _v._tag === "Some" ? (({ value: j }) => [j])(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(r, idxOf)), _Set_toArray2(freeRefs(value, _Set_fromArray5([]), _Set_fromArray5([])))))(_v) : [])(letStmt));
var adjOf = _curry17(2, (lets, idxOf) => map9((s) => depsOf(s, idxOf), lets));
var groupOfFrom = _curry17(2, (idxs, lets) => ((_v) => _v.length === 0 ? [] : _v.length >= 1 ? (([i, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: s }) => _Array_prepend6(s, groupOfFrom(rest, lets)))(_v) : _v._tag === "None" ? groupOfFrom(rest, lets) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(i, lets)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(idxs));
var preBindGroupFrom = _curry17(3, (group, env, st) => ((_v) => _v.length === 0 ? _tuple8(env, st) : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" ? (({ name }) => (([v, st1]) => preBindGroupFrom(rest, _Map_set6(name, mono(v), env), st1))(freshVar(st)))(_v) : preBindGroupFrom(rest, env, st))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(group));
var inferMember = _curry17(6, (ctx, name, annot, value, span, st) => ((_v) => _v._tag === "Err" ? (({ error: e }) => Err9({ err: e, st }))(_v) : _v._tag === "Ok" ? (({ value: [t, st1] }) => ((_v) => _v._tag === "None" ? Err9({ err: typeErr(`internal: missing self-binding for '${name}'`, span), st: st1 }) : _v._tag === "Some" ? (({ value: selfSc }) => ((_v) => _v._tag === "Err" ? (({ error: e }) => Err9({ err: e, st: st1 }))(_v) : _v._tag === "Ok" ? (({ value: st2 }) => ((_v) => _v._tag === "Some" ? (({ value: te }) => (([at, _, stA]) => ((_v) => _v._tag === "Ok" ? (({ value: stB }) => Ok9(_tuple8(at, stB)))(_v) : _v._tag === "Err" ? (({ error: e }) => Err9({ err: e, st: stA }))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(checkFits(ctx, t, at, stA, annotSpan(te))))(typeExprToType(te, new Map, st2, ctx.aliasMap, _Set_fromArray5([]))))(_v) : _v._tag === "None" ? Ok9(_tuple8(t, st2)) : (() => {
  throw new Error("non-exhaustive match");
})())(annot))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(u(ctx, selfSc.ty, t, st1, span)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(name, ctx.env)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(inferExpr(ctx, value, st)));
var inferGroupFrom = _curry17(4, (ctx, group, st, errs) => ((_v) => _v.length === 0 ? _tuple8(new Map, st, errs) : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" ? (({ name, nameSpan, annot, value, doc, span }) => ((_v) => _v._tag === "Err" ? (({ error: me }) => inferGroupFrom(ctx, rest, me.st, _Array_append12(me.err, errs)))(_v) : _v._tag === "Ok" ? (({ value: [pinned, st3] }) => ((stNamed) => (([restTypes, st4, errs1]) => _tuple8(_Map_set6(name, pinned, restTypes), st4, errs1))(inferGroupFrom(ctx, rest, stNamed, errs)))(_Str_startsWith3("$", name) ? st3 : recordBinder(nameSpan, pinned, "let", name, doc, st3)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(inferMember(ctx, name, annot, value, span, st)))(_v) : inferGroupFrom(ctx, rest, st, errs))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(group));
var dropGroupFrom = _curry17(2, (group, env) => ((_v) => _v.length === 0 ? env : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" ? (({ name }) => dropGroupFrom(rest, _Map_delete(name, env)))(_v) : dropGroupFrom(rest, env))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(group));
var groupNamesFrom = _curry17(2, (group, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" ? (({ name }) => groupNamesFrom(rest, _Array_append12(name, acc)))(_v) : groupNamesFrom(rest, acc))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(group));
var generalizeGroupFrom = _curry17(6, (group, bodyTypes, preEnv, env, names, st) => ((_v) => _v.length === 0 ? env : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" ? (({ name, annot }) => ((_v) => _v._tag === "Some" ? (({ value: t }) => ((widen) => generalizeGroupFrom(rest, bodyTypes, preEnv, _Map_set6(name, generalizeOver(env, names, t, st, widen), env), names, st))(((_v) => _v._tag === "None" ? true : _v._tag === "Some" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(annot)))(_v) : _v._tag === "None" ? generalizeGroupFrom(rest, bodyTypes, preEnv, ((_v) => _v._tag === "Some" ? (({ value: sc }) => _Map_set6(name, sc, env))(_v) : _v._tag === "None" ? env : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(name, preEnv)), names, st) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(name, bodyTypes)))(_v) : generalizeGroupFrom(rest, bodyTypes, preEnv, env, names, st))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(group));
var noteGroupLets = _curry17(3, (group, letOwner, st) => ((_v) => _v.length === 0 ? _tuple8(letOwner, st) : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SLet" && (({ name, value }) => !_Str_startsWith3("$", name))(_v) ? (({ name, value }) => ((sp) => noteGroupLets(rest, _Map_set6(name, sp, letOwner), noteLet(sp, st)))(exprSpan3(value)))(_v) : noteGroupLets(rest, letOwner, st))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(group));
var processGroupsFrom = _curry17(5, (ctx, sccs, lets, st, errs) => ((_v) => _v.length === 0 ? _tuple8(ctx, st, errs) : _v.length >= 1 ? (([comp, ...restSccs]) => ((group) => (([preEnv, st1]) => {
  const preCtx = ctxWithGroup(ctx, preEnv, groupNamesFrom(group, []));
  return (([bodyTypes, st2, errs1]) => {
    const finalEnv = generalizeGroupFrom(group, bodyTypes, preEnv, dropGroupFrom(group, preEnv), ctx.scopeNames, st2);
    return (([finalOwner, st3]) => processGroupsFrom(ctxWithLets(ctx, finalEnv, finalOwner), restSccs, lets, st3, errs1))(noteGroupLets(group, ctx.letOwner, st2));
  })(inferGroupFrom(preCtx, group, st1, errs));
})(preBindGroupFrom(group, ctx.env, st)))(groupOfFrom(comp, lets)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(sccs));
var inferExprStmtsFrom = _curry17(4, (ctx, stmts, st, errs) => ((_v) => _v.length === 0 ? _tuple8(st, errs) : _v.length >= 1 ? (([s, ...rest]) => ((_v) => _v._tag === "SExpr" ? (({ value, span }) => ((_v) => _v._tag === "Err" ? (({ error: e }) => inferExprStmtsFrom(ctx, rest, st, _Array_append12(e, errs)))(_v) : _v._tag === "Ok" ? (({ value: [t, st1] }) => ((_v) => _v._tag === "Err" ? (({ error: e }) => inferExprStmtsFrom(ctx, rest, st1, _Array_append12(e, errs)))(_v) : _v._tag === "Ok" ? (({ value: st2 }) => inferExprStmtsFrom(ctx, rest, st2, errs))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(u(ctx, t, tUnit, st1, span)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(inferExpr(ctx, value, st)))(_v) : inferExprStmtsFrom(ctx, rest, st, errs))(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(stmts));
var seedImportsFrom = _curry17(3, (keys, imports, env) => match8(keys).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([k, ...rest]) => ((_v) => _v._tag === "Some" ? (({ value: sc }) => seedImportsFrom(rest, imports, _Map_set6(k, sc, env)))(_v) : _v._tag === "None" ? seedImportsFrom(rest, imports, env) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(k, imports))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var qualifyTe = _curry17(3, (te, alias, from) => ((_v) => _v._tag === "TyName" ? (({ name, span: sp }) => _Map_has5(name, from) ? TyQual(alias, name, sp, [], sp) : te)(_v) : _v._tag === "TyApp" ? (({ ctor, args, span: sp }) => ((args1) => _Map_has5(ctor, from) ? TyQual(alias, ctor, sp, args1, sp) : TyApp(ctor, args1, sp))(map9((a) => qualifyTe(a, alias, from), args)))(_v) : _v._tag === "TyArrow" ? (({ from: fromTe, to: toTe, span: sp }) => TyArrow(qualifyTe(fromTe, alias, from), qualifyTe(toTe, alias, from), sp))(_v) : _v._tag === "TyTuple" ? (({ elems, span: sp }) => TyTuple(map9((e) => qualifyTe(e, alias, from), elems), sp))(_v) : _v._tag === "TyList" ? (({ elem, span: sp }) => TyList(qualifyTe(elem, alias, from), sp))(_v) : _v._tag === "TyUnion" ? (({ members, span: sp }) => TyUnion(map9((m) => qualifyTe(m, alias, from), members), sp))(_v) : _v._tag === "TyQual" ? (({ alias: inner, name, nameSpan: nsp, args, span: sp }) => ((args1) => _Map_has5(`${inner}.${name}`, from) ? TyQual(alias, `${inner}.${name}`, nsp, args1, sp) : TyQual(inner, name, nsp, args1, sp))(map9((a) => qualifyTe(a, alias, from), args)))(_v) : te)(te));
var qualifyField = _curry17(3, (fld, alias, from) => ({ name: fld.name, nameSpan: fld.nameSpan, fieldType: qualifyTe(fld.fieldType, alias, from), optional: fld.optional }));
var qualifyInfo = _curry17(3, (info, alias, from) => ({ params: info.params, fields: map9((f) => qualifyField(f, alias, from), info.fields), expr: _Option_map((te) => qualifyTe(te, alias, from), info.expr) }));
var qualAliasSeedFrom = _curry17(4, (names, alias, from, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([n, ...rest]) => qualAliasSeedFrom(rest, alias, from, ((_v) => _v._tag === "Some" ? (({ value: info }) => _Map_set6(`${alias}.${n}`, qualifyInfo(info, alias, from), acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(n, from))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(names));
var qualAliasSeed = _curry17(3, (stmts, quals, acc) => ((_v) => _v.length === 0 ? acc : _v.length >= 1 ? (([s, ...rest]) => qualAliasSeed(rest, quals, ((_v) => _v._tag === "SImportNs" ? (({ alias }) => ((_v) => _v._tag === "Some" ? (({ value: dep }) => qualAliasSeedFrom(_Map_keys6(dep.aliases), alias.name, dep.aliases, acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(alias.name, quals)))(_v) : acc)(s)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(stmts));
var zonkRecorded = (st) => map9((r) => ({ span: r.span, ty: zonk(r.ty, st), sym: r.sym }), recordedTypes(st));
var isConcrete = (t) => {
  const f = freeInType(t);
  return and11(_Set_size2(f.tv) === 0, _Set_size2(f.rv) === 0);
};
var allSameConcreteFrom = _curry17(3, (shown, uses, i) => ((_v) => _v._tag === "None" ? true : _v._tag === "Some" ? (({ value: t }) => and11(isConcrete(t), eq13(showType(t), shown)) ? allSameConcreteFrom(shown, uses, i + 1) : false)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(i, uses)));
var allSameConcrete = _curry17(2, (shown, uses) => allSameConcreteFrom(shown, uses, 0));
var resolveLetParamsFrom = _curry17(2, (keys, st) => ((_v) => _v.length === 0 ? [] : _v.length >= 1 ? (([k, ...rest]) => ((tail) => ((uses) => ((_v) => _v._tag === "None" ? tail : _v._tag === "Some" ? (({ value: first }) => allSameConcrete(showType(first), uses) ? ((_v) => _v._tag === "Some" ? (({ value: span }) => _Array_prepend6({ span, ty: first, sym: None16 }, tail))(_v) : _v._tag === "None" ? tail : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(k, st.letSpans)) : tail)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(0, uses)))(map9((t) => zonk(t, st), _Map_getOr6([], k, st.letUses))))(resolveLetParamsFrom(rest, st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(keys));
var resolveLetParams = (st) => resolveLetParamsFrom(_Map_keys6(st.letSpans), st);
var runInferImports = _curry17(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => {
  const plugins = resolvePluginsDefault(pluginsOpt);
  const st0 = mkSt(1000);
  const env0 = seedBuiltins(builtins, new Map, st0);
  const ns0 = seedNsImports(nsImports, seedNs(namespaces, env0, st0));
  const aliasMap = aliasMapFrom(stmts, qualAliasSeed(stmts, quals, new Map));
  return (([env1, st1]) => (([env2, st2]) => (([env3, st3]) => {
    const env4 = seedImportsFrom(_Map_keys6(imports), imports, env3);
    const lets = letsOfFrom(stmts);
    const idxOf = idxOfMap(lets);
    const sccs = stronglyConnected(adjOf(lets, idxOf));
    const localNames = localBinderNames(stmts);
    return (([finalCtx, st4, errs]) => (([st5, errs1]) => ((_v) => _v.length === 0 ? Ok9({ env: finalCtx.env, types: zonkRecorded(st5), aliases: aliasMap, letParams: resolveLetParams(st5) }) : Err9(errs1))(errs1))(inferExprStmtsFrom(finalCtx, stmts, st4, errs)))(processGroupsFrom({ env: env4, open: openMode, ns: ns0, aliasMap, plugins, loopStack: [], letOwner: new Map, localNames, scopeNames: _Set_toArray2(localNames) }, sccs, lets, st3, noErrs));
  })(registerExternsFrom(stmts, aliasMap, env2, st2)))(registerBuiltinCtorsFrom(builtinDeclsFor(stmts), aliasMap, env1, st1)))(registerUserCtorsFrom(stmts, aliasMap, env0, st0));
});
var scopeAliases = _curry17(2, (stmts, quals) => aliasMapFrom(stmts, qualAliasSeed(stmts, quals, new Map)));
var inferProgramImports = _curry17(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => _Result_map6((r) => r.env, runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt)));
var emptyQuals2 = new Map;
var inferProgram = _curry17(4, (stmts, builtins, namespaces, openMode) => inferProgramImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, None16));
var inferProgramImportsTypes = _curry17(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt));
var inferProgramTypes = _curry17(4, (stmts, builtins, namespaces, openMode) => runInferImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, None16));
var inferProgramTypesWith = _curry17(5, (stmts, builtins, namespaces, openMode, pluginsOpt) => runInferImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, pluginsOpt));
var inferProgramWith = _curry17(5, (stmts, builtins, namespaces, openMode, pluginsOpt) => inferProgramImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, pluginsOpt));
var takeScheme = _curry17(3, (name, env, acc) => ((_v) => _v._tag === "Some" ? (({ value: sc }) => _Map_set6(name, sc, acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get6(name, env)));
var exportCtorsInto = _curry17(4, (ctors, i, env, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: c }) => exportCtorsInto(ctors, i + 1, env, takeScheme(c.name, env, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get15(i, ctors)));
var exportedSchemesFrom = _curry17(4, (stmts, i0, env, acc0) => {
  let i = i0;
  let acc = acc0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done8(acc) : _v._tag === "Some" && _v.value._tag === "SLet" && _v.value.exported === true ? (({ value: { name } }) => _recur8(i + 1, takeScheme(name, env, acc)))(_v) : _v._tag === "Some" && _v.value._tag === "SExtern" && _v.value.exported === true ? (({ value: { name } }) => _recur8(i + 1, takeScheme(name, env, acc)))(_v) : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true ? (({ value: { ctors } }) => _recur8(i + 1, exportCtorsInto(ctors, 0, env, acc)))(_v) : _v._tag === "Some" ? _recur8(i + 1, acc) : (() => {
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

import { None as None17, Some as Some17, _Array_append as _Array_append13, _Array_concat as _Array_concat8, _Array_get as _Array_get16, _Array_head as _Array_head5, _Array_prepend as _Array_prepend7, _Map_get as _Map_get7, _Map_getOr as _Map_getOr7, _Map_keys as _Map_keys7, _Option_contains as _Option_contains3, _Option_exists as _Option_exists4, _Option_isNone as _Option_isNone2, _Option_isSome as _Option_isSome4, _Option_unwrapOr as _Option_unwrapOr10, _Set_add as _Set_add6, _Set_fromArray as _Set_fromArray6, _Set_has as _Set_has5, _Set_toArray as _Set_toArray3, _Set_union, _Str_chars, _Str_codeAt as _Str_codeAt7, _Str_concat as _Str_concat2, _Str_endsWith as _Str_endsWith2, _Str_join as _Str_join6, _Str_length as _Str_length6, _Str_replace as _Str_replace2, _Str_slice as _Str_slice3, _Str_split as _Str_split5, _Str_startsWith as _Str_startsWith4, _curry as _curry18, _done as _done9, _recur as _recur9, _tuple as _tuple9, and as and12, concat, eq as eq14, filter as filter6, length as length14, map as map10, or as or9, reduce as reduce5, show as show7, sub as sub7 } from "@mochi/compiler/runtime";
import { match as match9 } from "@onrails/pattern";
var jsGenOpts = { annotateLet: None17, annotateCtor: None17, annotateParams: None17, annotateEmpty: None17, annotateLetin: None17, annotateCall: None17, guardBaseType: None17, flattenPipe: false, tupleHelper: false, preserveInfix: false, preserveJsx: false, moduleExt: ".js", docs: true };
var hook1 = _curry18(2, (h, x) => ((_v) => _v._tag === "None" ? None17 : _v._tag === "Some" ? (({ value: f }) => f(x))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(h));
var hook2 = _curry18(3, (h, x, y) => ((_v) => _v._tag === "None" ? None17 : _v._tag === "Some" ? (({ value: f }) => f(x, y))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(h));
var emptyNsCtor = _curry18(2, (con, ann) => ((_v) => _v._tag === "None" ? `new ${con}()` : _v._tag === "Some" ? (({ value: t }) => `new ${t}()`)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(ann));
var isIdentStart = (c) => or9(or9(or9(and12(c >= 65, c <= 90), and12(c >= 97, c <= 122)), c === 95), c === 36);
var isIdentPart = (c) => or9(isIdentStart(c), and12(c >= 48, c <= 57));
var identPartsFrom = _curry18(2, (s, i) => ((_v) => _v._tag === "None" ? true : _v._tag === "Some" ? (({ value: c }) => and12(isIdentPart(c), identPartsFrom(s, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_codeAt7(i, s)));
var isJsIdent = (s) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" ? (({ value: c }) => and12(isIdentStart(c), identPartsFrom(s, 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_codeAt7(0, s));
var isUpperStart3 = (s) => _Option_exists4((n) => and12(n >= 65, n <= 90), _Str_codeAt7(0, s));
var isNullaryCtor = _curry18(2, (name, keys) => _Option_exists4((ks) => length14(ks) === 0, _Map_get7(name, keys)));
var isCtorRef = (fn) => ((_v) => _v._tag === "ERef" ? (({ name }) => isUpperStart3(name))(_v) : false)(fn);
var suffixOr = _curry18(2, (name, ann) => ((_v) => _v._tag === "None" ? name : _v._tag === "Some" ? (({ value: t }) => `${name}: ${t}`)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(ann));
var bareParamAnnots = { generics: "", params: [] };
var paramAnnotsFor = _curry18(3, (h, sp, arity) => ((_v) => _v._tag === "None" ? bareParamAnnots : _v._tag === "Some" ? (({ value: f }) => f(sp, arity))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(h));
var annotatedParams = _curry18(3, (cparams, annots, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: p }) => _Array_prepend7(suffixOr(genParam(p), _Option_unwrapOr10(None17, _Array_get16(i, annots))), annotatedParams(cparams, annots, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, cparams)));
var castOr = _curry18(2, (js, ann) => ((_v) => _v._tag === "None" ? js : _v._tag === "Some" ? (({ value: t }) => `(${js} as ${t})`)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(ann));
var bindRuntime = (monad) => monad === "Option" ? "_Option_flatMap" : monad === "Result" ? "_Result_flatMap" : "_Task_andThen";
var allOfFrom2 = _curry18(3, (f, xs, i) => ((_v) => _v._tag === "None" ? true : _v._tag === "Some" ? (({ value: x }) => f(x) ? allOfFrom2(f, xs, i + 1) : false)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, xs)));
var allOf2 = _curry18(2, (f, xs) => allOfFrom2(f, xs, 0));
var someOfFrom3 = _curry18(3, (f, xs, i) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" ? (({ value: x }) => f(x) ? true : someOfFrom3(f, xs, i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, xs)));
var someOf3 = _curry18(2, (f, xs) => someOfFrom3(f, xs, 0));
var escChar2 = (c) => ((_v) => _v === "\\" ? "\\\\" : _v === '"' ? "\\\"" : _v === `
` ? "\\n" : _v === "\t" ? "\\t" : c)(c);
var jsStringLit = (s) => `"${_Str_join6("", map10(escChar2, _Str_chars(s)))}"`;
var escTemplateLoop = _curry18(3, (chars, i0, acc0) => {
  let i = i0;
  let acc = acc0;
  while (true) {
    const _step = ((_v) => _v._tag === "None" ? _done9(acc) : _v._tag === "Some" && _v.value === "\\" ? _recur9(i + 1, `${acc}\\\\`) : _v._tag === "Some" && _v.value === "`" ? _recur9(i + 1, `${acc}\\\``) : _v._tag === "Some" && _v.value === "$" && _Option_contains3("{", _Array_get16(i + 1, chars)) ? _recur9(i + 2, `${acc}\\\${`) : _v._tag === "Some" ? (({ value: c }) => _recur9(i + 1, `${acc}${c}`))(_v) : (() => {
      throw new Error("non-exhaustive match");
    })())(_Array_get16(i, chars));
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var escapeTemplateLiteral = (s) => escTemplateLoop(_Str_chars(s), 0, "");
var keyAt = _curry18(3, (ctx, ctor, i) => ((_v) => _v._tag === "Some" ? (({ value: ks }) => _Option_unwrapOr10(`_${show7(i)}`, _Array_get16(i, ks)))(_v) : _v._tag === "None" ? `_${show7(i)}` : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get7(ctor, ctx.keys)));
var nsRuntimeId = _curry18(3, (ctx, target, name) => ((_v) => _v._tag === "ERef" ? (({ name: refName }) => ((_v) => _v._tag === "Some" ? (({ value: members }) => _Map_get7(name, members))(_v) : _v._tag === "None" ? None17 : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get7(refName, ctx.ns)))(_v) : None17)(target));
var emptyNsEmit = _curry18(3, (target, name, ann) => ((_v) => _v._tag === "ERef" ? (({ name: refName }) => name === "empty" ? refName === "Set" ? Some17(emptyNsCtor("Set", ann)) : refName === "Map" ? Some17(emptyNsCtor("Map", ann)) : refName === "List" ? Some17("_list(function* () {})") : None17 : None17)(_v) : None17)(target));
var isLabeledParam3 = (p) => ((_v) => _v._tag === "LPLabeled" ? true : _v._tag === "LPSpanned" ? (({ param: inner }) => isLabeledParam3(inner))(_v) : false)(p);
var splitLamParams2 = _curry18(3, (params, positional, labeled) => ((_v) => _v.length === 0 ? _tuple9(positional, labeled) : _v.length >= 1 ? (([p, ...rest]) => isLabeledParam3(p) ? splitLamParams2(rest, positional, _Array_append13(p, labeled)) : splitLamParams2(rest, _Array_append13(p, positional), labeled))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(params));
var absorbParams = _curry18(4, (params, acc, fills, labN) => (([positional, labeled]) => {
  const acc1 = _Array_concat8(acc, positional);
  return ((_v) => _v.length === 0 ? _tuple9(acc1, fills, labN) : ((labVar) => _tuple9(_Array_append13(LPName(labVar, None17), acc1), _Array_append13({ labVar, labs: labeled }, fills), labN + 1))(labN === 0 ? "$lab" : `$lab${show7(labN)}`))(labeled);
})(splitLamParams2(params, [], [])));
var collapseLambdaFrom = _curry18(5, (params, body, acc, fills, labN) => (([acc1, fills1, labN1]) => ((_v) => _v._tag === "ELambda" ? (({ params: params2, body: body2 }) => collapseLambdaFrom(params2, body2, acc1, fills1, labN1))(_v) : _tuple9(acc1, body, fills1))(body))(absorbParams(params, acc, fills, labN)));
var collapseLambda = _curry18(2, (params, body) => collapseLambdaFrom(params, body, [], [], 0));
var isPrimLit = (e) => ((_v) => _v._tag === "ENum" ? true : _v._tag === "EStr" ? true : _v._tag === "EBool" ? true : false)(e);
var eqTest = _curry18(4, (ctx, left, right, op) => ((_v) => _v[1]._tag === "ERef" && (([, { name: c }]) => isNullaryCtor(c, ctx.keys))(_v) ? (([, { name: c }]) => Some17(`(${genMember(ctx, left)}._tag ${op} "${c}")`))(_v) : _v[0]._tag === "ERef" && (([{ name: c }]) => isNullaryCtor(c, ctx.keys))(_v) ? (([{ name: c }]) => Some17(`(${genMember(ctx, right)}._tag ${op} "${c}")`))(_v) : or9(isPrimLit(left), isPrimLit(right)) ? Some17(`(${genExpr(ctx, left)} ${op} ${genExpr(ctx, right)})`) : None17)(_tuple9(left, right)));
var isUserCall = _curry18(2, (ctx, fn) => ((_v) => _v._tag === "ERef" ? (({ name }) => _Set_has5(name, ctx.userNames))(_v) : false)(fn));
var tsInfix = _curry18(3, (ctx, fn, args) => or9(!ctx.preserveInfix, isUserCall(ctx, fn)) ? None17 : ((_v) => _v[0]._tag === "ERef" && _v[0].name === "eq" && _v[1].length === 2 ? (([, [left, right]]) => eqTest(ctx, left, right, "==="))(_v) : _v[0]._tag === "ERef" && _v[0].name === "not" && _v[1].length === 1 ? (([, [operand]]) => ((_v) => _v._tag === "ECall" && _v.fn._tag === "ERef" && _v.fn.name === "eq" && _v.args.length === 2 && (({ args: [left, right] }) => !_Set_has5("eq", ctx.userNames))(_v) ? (({ args: [left, right] }) => ((_v) => _v._tag === "Some" ? (({ value: test }) => Some17(test))(_v) : _v._tag === "None" ? Some17(`!(${genExpr(ctx, operand)})`) : (() => {
  throw new Error("non-exhaustive match");
})())(eqTest(ctx, left, right, "!==")))(_v) : Some17(`!(${genExpr(ctx, operand)})`))(operand))(_v) : _v[0]._tag === "ERef" && _v[1].length === 2 ? (([{ name }, [left, right]]) => ((_v) => _v === "add" ? Some17(`(${genExpr(ctx, left)} + ${genExpr(ctx, right)})`) : _v === "sub" ? Some17(`(${genExpr(ctx, left)} - ${genExpr(ctx, right)})`) : _v === "mul" ? Some17(`(${genExpr(ctx, left)} * ${genExpr(ctx, right)})`) : _v === "div" ? Some17(`(${genExpr(ctx, left)} / ${genExpr(ctx, right)})`) : _v === "lt" ? Some17(`(${genExpr(ctx, left)} < ${genExpr(ctx, right)})`) : _v === "lte" ? Some17(`(${genExpr(ctx, left)} <= ${genExpr(ctx, right)})`) : _v === "gt" ? Some17(`(${genExpr(ctx, left)} > ${genExpr(ctx, right)})`) : _v === "gte" ? Some17(`(${genExpr(ctx, left)} >= ${genExpr(ctx, right)})`) : None17)(name))(_v) : None17)(_tuple9(fn, args)));
var jsxHasSpread = (children) => ((_v) => _v.length === 0 ? false : _v.length >= 1 && _v[0]._tag === "SESpread" ? true : _v.length >= 1 ? (([, ...rest]) => jsxHasSpread(rest))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(children);
var jsxAttrs = _curry18(3, (ctx, fields, spread) => {
  const head = ((_v) => _v._tag === "None" ? "" : _v._tag === "Some" ? (({ value }) => ` {...${genExpr(ctx, value)}}`)(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(spread);
  return `${head}${_Str_join6("", map10((f) => ((_v) => _v._tag === "EBool" && _v.value === true ? ` ${f.name}` : ((value) => ` ${f.name}={${genExpr(ctx, value)}}`)(_v))(f.value), fields))}`;
});
var tsxArgs = _curry18(2, (ctx, args) => ((_v) => _v.length === 3 && _v[1]._tag === "ERecord" && _v[2]._tag === "EArr" ? (([tag, { fields, spread }, { elements: children }]) => jsxHasSpread(children) ? None17 : ((fragment) => ((name) => ((attrs) => and12(length14(children) === 0, !fragment) ? Some17(`<${name}${attrs} />`) : ((body) => fragment ? Some17(`<>${body}</>`) : Some17(`<${name}${attrs}>${body}</${name}>`))(_Str_join6("", map10((child) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => `{${genExpr(ctx, value)}}`)(_v) : _v._tag === "SESpread" ? "" : (() => {
  throw new Error("non-exhaustive match");
})())(child), children))))(jsxAttrs(ctx, fields, spread)))(fragment ? "" : ((_v) => _v._tag === "EStr" ? (({ value }) => value)(_v) : genMember(ctx, tag))(tag)))(((_v) => _v._tag === "EStr" && _v.value === "Fragment" ? true : false)(tag)))(_v) : None17)(args));
var tsxCall = _curry18(4, (ctx, fn, args, origin) => !ctx.preserveJsx ? None17 : ((_v) => _v._tag === "Some" && _v.value === "jsx" ? ((_v) => _v._tag === "ERef" && _v.name === "h" ? tsxArgs(ctx, args) : None17)(fn) : None17)(origin));
var genExpr = _curry18(2, (ctx, e) => ((_v) => _v._tag === "ENum" ? (({ raw }) => raw)(_v) : _v._tag === "EUnit" ? "undefined" : _v._tag === "EBool" ? (({ value }) => value ? "true" : "false")(_v) : _v._tag === "EStr" ? (({ value }) => jsStringLit(value))(_v) : _v._tag === "ERef" ? (({ name }) => castOr(name, isNullaryCtor(name, ctx.keys) ? hook1(ctx.annotateEmpty, e) : None17))(_v) : _v._tag === "ECall" ? (({ fn, args, origin }) => ((_v) => _v._tag === "Some" ? (({ value: jsx }) => jsx)(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: infix }) => infix)(_v) : _v._tag === "None" ? ((inner) => castOr(inner, isCtorRef(fn) ? hook1(ctx.annotateCall, e) : None17))(`${genCallee(ctx, fn)}(${_Str_join6(", ", map10((a) => genExpr(ctx, a), args))})`) : (() => {
  throw new Error("non-exhaustive match");
})())(tsInfix(ctx, fn, args)) : (() => {
  throw new Error("non-exhaustive match");
})())(tsxCall(ctx, fn, args, origin)))(_v) : _v._tag === "ELambda" ? (({ params, body, span: sp }) => (([cparams, cbody, fills]) => {
  const bound = fillNames(fills, paramNameSet(cparams, 0, _Set_fromArray6([])));
  const annots = paramAnnotsFor(ctx.annotateParams, sp, length14(cparams));
  const arrow = `${annots.generics}(${_Str_join6(", ", annotatedParams(cparams, annots.params, 0))}) => ${genLambdaBodyIn(ctx, cbody, bound, genFillDecls(ctx, fills))}`;
  return length14(cparams) >= 2 ? `_curry(${show7(length14(cparams))}, ${arrow})` : arrow;
})(collapseLambda(params, body)))(_v) : _v._tag === "ELetIn" ? (({ name, value, body }) => ((param) => `((${param}) => ${genLambdaBody(ctx, body)})(${genExpr(ctx, value)})`)(suffixOr(name, hook1(ctx.annotateLetin, value))))(_v) : _v._tag === "ELetBind" ? (({ param, monad, value, body }) => ((rt) => ((f) => ((v) => ctx.flattenPipe ? `${rt}(${f}, ${v})` : `${rt}(${f})(${v})`)(genExpr(ctx, value)))(`(${genParam(param)}) => ${genLambdaBody(ctx, body)}`))(bindRuntime(monad)))(_v) : _v._tag === "EPipe" ? (({ left, right, fast, span: sp }) => fast ? ((_v) => _v._tag === "ECall" ? (({ fn: rfn, args: rargs, origin }) => genExpr(ctx, ECall(rfn, _Array_prepend7(left, rargs), origin, sp)))(_v) : genExpr(ctx, ECall(right, [left], None17, sp)))(right) : ((_v) => _v._tag === "ECall" && (({ fn: rfn, args: rargs }) => ctx.flattenPipe)(_v) ? (({ fn: rfn, args: rargs }) => `${genCallee(ctx, rfn)}(${_Str_join6(", ", map10((a) => genExpr(ctx, a), _Array_append13(left, rargs)))})`)(_v) : `${genCallee(ctx, right)}(${genExpr(ctx, left)})`)(right))(_v) : _v._tag === "EDo" ? (({ exprs }) => genDo(ctx, exprs))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => `(${genExpr(ctx, cond)} ? ${genExpr(ctx, thenE)} : ${genExpr(ctx, elseE)})`)(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => genMatch(ctx, scrutinee, arms))(_v) : _v._tag === "ELoop" ? (({ params, body }) => `(() => { ${genLoopBlock(ctx, params, body)} })()`)(_v) : _v._tag === "ERecur" ? (({ args }) => `_recur(${_Str_join6(", ", map10((a) => genExpr(ctx, a), args))})`)(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => ((fieldStrs) => ((_v) => _v._tag === "None" ? length14(fields) === 0 ? "{}" : `{ ${fieldStrs} }` : _v._tag === "Some" ? (({ value: s }) => ((spreadStr) => length14(fields) === 0 ? `{ ${spreadStr} }` : `{ ${spreadStr}, ${fieldStrs} }`)(`...${genExpr(ctx, s)}`))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(spread))(_Str_join6(", ", map10((f) => `${isJsIdent(f.name) ? f.name : jsStringLit(f.name)}: ${genExpr(ctx, f.value)}`, fields))))(_v) : _v._tag === "EField" ? (({ target, name, optional }) => ((_v) => _v._tag === "Some" ? (({ value: js }) => js)(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: rt }) => rt)(_v) : _v._tag === "None" ? ((member) => optional ? `((v) => v != null ? { _tag: "Some", value: v } : { _tag: "None" })(${member})` : member)(`${genMember(ctx, target)}.${name}`) : (() => {
  throw new Error("non-exhaustive match");
})())(nsRuntimeId(ctx, target, name)) : (() => {
  throw new Error("non-exhaustive match");
})())(emptyNsEmit(target, name, hook1(ctx.annotateEmpty, e))))(_v) : _v._tag === "ETuple" ? (({ elements }) => ((elems) => ctx.tupleHelper ? `_tuple(${elems})` : `[${elems}]`)(_Str_join6(", ", map10((el) => genExpr(ctx, el), elements))))(_v) : _v._tag === "EArr" ? (({ elements }) => ((body) => castOr(body, length14(elements) === 0 ? hook1(ctx.annotateEmpty, e) : None17))(`[${_Str_join6(", ", map10((el) => genSeqSlot(ctx, el), elements))}]`))(_v) : _v._tag === "EList" ? (({ elements }) => genList(ctx, elements))(_v) : _v._tag === "ESet" ? (({ elements }) => `new Set([${_Str_join6(", ", map10((el) => genSeqSlot(ctx, el), elements))}])`)(_v) : _v._tag === "EMap" ? (({ entries }) => ((_v) => _v._tag === "Some" ? (({ value: t }) => `new ${t}()`)(_v) : _v._tag === "None" ? `new Map([${_Str_join6(", ", map10((en) => `[${genExpr(ctx, en.key)}, ${genExpr(ctx, en.value)}]`, entries))}])` : (() => {
  throw new Error("non-exhaustive match");
})())(length14(entries) === 0 ? hook1(ctx.annotateEmpty, e) : None17))(_v) : _v._tag === "EInterp" ? (({ parts }) => ((body) => `\`${body}\``)(_Str_join6("", map10((p) => ((_v) => _v._tag === "IPLit" ? (({ value }) => escapeTemplateLiteral(value))(_v) : _v._tag === "IPExpr" ? (({ expr: ex }) => `\${${genExpr(ctx, ex)}}`)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p), parts))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e));
var genDo = _curry18(2, (ctx, exprs) => `(() => { ${genDoSteps(ctx, exprs)} })()`);
var genDoSteps = _curry18(2, (ctx, exprs) => ((_v) => _v.length === 1 ? (([last]) => `return ${genExpr(ctx, last)};`)(_v) : _v.length >= 1 ? (([first, ...rest]) => `${genExpr(ctx, first)}; ${genDoSteps(ctx, rest)}`)(_v) : _v.length === 0 ? 'throw new Error("empty do block");' : (() => {
  throw new Error("non-exhaustive match");
})())(exprs));
var genSeqSlot = _curry18(2, (ctx, el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: ex }) => genExpr(ctx, ex))(_v) : _v._tag === "SESpread" ? (({ expr: ex }) => `...${genExpr(ctx, ex)}`)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el));
var genList = _curry18(2, (ctx, elements) => {
  const yields = _Str_join6(" ", map10((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: ex }) => `yield (${genExpr(ctx, ex)});`)(_v) : _v._tag === "SESpread" ? (({ expr: ex }) => `yield* (${genExpr(ctx, ex)});`)(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(el), elements));
  return `_list(function* () {${yields === "" ? "" : ` ${yields} `}})`;
});
var genParam = (p) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => genParam(inner))(_v) : _v._tag === "LPName" ? (({ name }) => name)(_v) : _v._tag === "LPTuple" ? (({ names }) => `[${_Str_join6(", ", names)}]`)(_v) : _v._tag === "LPRecord" ? (({ fields }) => `{ ${_Str_join6(", ", fields)} }`)(_v) : _v._tag === "LPLabeled" ? (({ name }) => name)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p);
var genCallee = _curry18(2, (ctx, e) => ((_v) => _v._tag === "ELambda" ? `(${genExpr(ctx, e)})` : genExpr(ctx, e))(e));
var genMember = _curry18(2, (ctx, e) => ((_v) => _v._tag === "ERecord" ? `(${genExpr(ctx, e)})` : _v._tag === "ELambda" ? `(${genExpr(ctx, e)})` : genExpr(ctx, e))(e));
var seqElemExpr3 = (el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el);
var hasRecur = (e) => ((_v) => _v._tag === "ERecur" ? true : _v._tag === "ELoop" ? false : _v._tag === "ELambda" ? false : _v._tag === "ELetBind" ? false : _v._tag === "EInterp" ? (({ parts }) => someOf3((p) => ((_v) => _v._tag === "IPExpr" ? (({ expr: x }) => hasRecur(x))(_v) : _v._tag === "IPLit" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(p), parts))(_v) : _v._tag === "ECall" ? (({ fn, args }) => or9(hasRecur(fn), someOf3(hasRecur, args)))(_v) : _v._tag === "ELetIn" ? (({ value, body }) => or9(hasRecur(value), hasRecur(body)))(_v) : _v._tag === "EPipe" ? (({ left, right }) => or9(hasRecur(left), hasRecur(right)))(_v) : _v._tag === "EDo" ? (({ exprs }) => someOf3(hasRecur, exprs))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => or9(hasRecur(cond), or9(hasRecur(thenE), hasRecur(elseE))))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => or9(hasRecur(scrutinee), someOf3((a) => or9(((_v) => _v._tag === "Some" ? (({ value: g }) => hasRecur(g))(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(a.guard), hasRecur(a.body)), arms)))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => or9(((_v) => _v._tag === "Some" ? (({ value: sp }) => hasRecur(sp))(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(spread), someOf3((f) => hasRecur(f.value), fields)))(_v) : _v._tag === "EField" ? (({ target }) => hasRecur(target))(_v) : _v._tag === "ETuple" ? (({ elements }) => someOf3(hasRecur, elements))(_v) : _v._tag === "EArr" ? (({ elements }) => someOf3((el) => hasRecur(seqElemExpr3(el)), elements))(_v) : _v._tag === "EList" ? (({ elements }) => someOf3((el) => hasRecur(seqElemExpr3(el)), elements))(_v) : _v._tag === "ESet" ? (({ elements }) => someOf3((el) => hasRecur(seqElemExpr3(el)), elements))(_v) : _v._tag === "EMap" ? (({ entries }) => someOf3((en) => or9(hasRecur(en.key), hasRecur(en.value)), entries))(_v) : false)(e);
var loopNeedsStep = (e) => ((_v) => _v._tag === "ETernary" ? (({ thenE, elseE }) => or9(loopNeedsStep(thenE), loopNeedsStep(elseE)))(_v) : _v._tag === "ELetIn" ? (({ body }) => loopNeedsStep(body))(_v) : _v._tag === "EDo" ? (({ exprs }) => loopNeedsStep(lastDoExpr(exprs)))(_v) : _v._tag === "EMatch" ? hasRecur(e) : false)(e);
var lastDoExpr = (exprs) => ((_v) => _v.length === 1 ? (([last]) => last)(_v) : _v.length >= 1 ? (([, ...rest]) => lastDoExpr(rest))(_v) : _v.length === 0 ? EUnit({ start: 0, end: 0 }) : (() => {
  throw new Error("non-exhaustive match");
})())(exprs);
var wrapStepTails = _curry18(2, (e, sp) => ((_v) => _v._tag === "ERecur" ? e : _v._tag === "ETernary" ? (({ cond, thenE, elseE, span: tsp }) => ETernary(cond, wrapStepTails(thenE, sp), wrapStepTails(elseE, sp), tsp))(_v) : _v._tag === "ELetIn" ? (({ name, nameSpan, annot, value, body, span: lsp }) => ELetIn(name, nameSpan, annot, value, wrapStepTails(body, sp), lsp))(_v) : _v._tag === "EDo" ? (({ exprs, span: dsp }) => EDo(wrapDoStepTail(exprs, sp), dsp))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms, span: msp }) => EMatch(scrutinee, map10((a) => ({ pattern: a.pattern, guard: a.guard, body: wrapStepTails(a.body, sp) }), arms), msp))(_v) : ECall(ERef("_done", sp), [e], None17, sp))(e));
var wrapDoStepTail = _curry18(2, (exprs, sp) => ((_v) => _v.length === 1 ? (([last]) => [wrapStepTails(last, sp)])(_v) : _v.length >= 1 ? (([first, ...rest]) => [first, ...wrapDoStepTail(rest, sp)])(_v) : _v.length === 0 ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(exprs));
var loopParamNames = (params) => _Str_join6(", ", map10((p) => p.name, params));
var genLoopTail = _curry18(3, (ctx, e, params) => ((_v) => _v._tag === "ERecur" ? (({ args }) => ((_v) => _v[0].length === 1 && _v[1].length === 1 ? (([[p], [a]]) => `${p.name} = ${genExpr(ctx, a)}; continue;`)(_v) : `[${loopParamNames(params)}] = [${_Str_join6(", ", map10((a) => genExpr(ctx, a), args))}]; continue;`)(_tuple9(params, args)))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => hasRecur(e) ? `if (${genExpr(ctx, cond)}) { ${genLoopTail(ctx, thenE, params)} } else { ${genLoopTail(ctx, elseE, params)} }` : `return ${genExpr(ctx, e)};`)(_v) : _v._tag === "ELetIn" ? (({ name, value, body }) => hasRecur(e) ? `{ const ${suffixOr(name, hook1(ctx.annotateLetin, value))} = ${genExpr(ctx, value)}; ${genLoopTail(ctx, body, params)} }` : `return ${genExpr(ctx, e)};`)(_v) : _v._tag === "EDo" ? (({ exprs }) => hasRecur(e) ? `{ ${genDoLoopTail(ctx, exprs, params)} }` : `return ${genExpr(ctx, e)};`)(_v) : _v._tag === "EMatch" ? (({ span: sp }) => hasRecur(e) ? ((step) => ((rebind) => `const _step = ${step}; if (_step._tag === ${jsStringLit("recur")}) { ${rebind} continue; } return _step.value;`)(((_v) => _v.length === 1 ? (([p]) => `${p.name} = _step.args[0];`)(_v) : `[${loopParamNames(params)}] = _step.args;`)(params)))(genExpr(ctx, wrapStepTails(e, sp))) : `return ${genExpr(ctx, e)};`)(_v) : `return ${genExpr(ctx, e)};`)(e));
var genDoLoopTail = _curry18(3, (ctx, exprs, params) => ((_v) => _v.length === 1 ? (([last]) => genLoopTail(ctx, last, params))(_v) : _v.length >= 1 ? (([first, ...rest]) => `${genExpr(ctx, first)}; ${genDoLoopTail(ctx, rest, params)}`)(_v) : _v.length === 0 ? "return undefined;" : (() => {
  throw new Error("non-exhaustive match");
})())(exprs));
var genLoopBlock = _curry18(3, (ctx, params, body) => {
  const decls = _Str_join6(" ", map10((p) => `let ${suffixOr(p.name, hook1(ctx.annotateLetin, p.init))} = ${genExpr(ctx, p.init)};`, params));
  return `${decls} while (true) { ${genLoopTail(ctx, body, params)} }`;
});
var loopParamFree = _curry18(3, (params, i, seen) => ((_v) => _v._tag === "None" ? true : _v._tag === "Some" ? (({ value: p }) => _Set_has5(p.name, seen) ? false : loopParamFree(params, i + 1, seen))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, params)));
var genLambdaBody = _curry18(2, (ctx, e) => ((_v) => _v._tag === "ERecord" ? `(${genExpr(ctx, e)})` : genExpr(ctx, e))(e));
var paramNames = (p) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => paramNames(inner))(_v) : _v._tag === "LPName" ? (({ name }) => [name])(_v) : _v._tag === "LPTuple" ? (({ names }) => names)(_v) : _v._tag === "LPRecord" ? (({ fields }) => fields)(_v) : _v._tag === "LPLabeled" ? (({ name }) => [name])(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p);
var genLabeledFill = _curry18(3, (ctx, labVar, lab) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => genLabeledFill(ctx, labVar, inner))(_v) : _v._tag === "LPLabeled" ? (({ name, optional, defaultValue }) => ((access) => ((_v) => _v._tag === "Some" ? (({ value: d }) => `const ${name} = ${access} != null ? ${access} : ${genExpr(ctx, d)};`)(_v) : _v._tag === "None" ? optional ? `const ${name} = ${access} != null ? { _tag: "Some", value: ${access} } : { _tag: "None" };` : `const ${name} = ${access};` : (() => {
  throw new Error("non-exhaustive match");
})())(defaultValue))(`(${labVar} ?? {}).${name}`))(_v) : "")(lab));
var genFillDecls = _curry18(2, (ctx, fills) => ((_v) => _v.length === 0 ? "" : `${_Str_join6(" ", map10((g) => _Str_join6(" ", map10((lab) => genLabeledFill(ctx, g.labVar, lab), g.labs)), fills))} `)(fills));
var fillNames = _curry18(2, (fills, acc) => match9(fills).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([g, ...rest]) => fillNames(rest, reduce5(_curry18(2, (s, lab) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => ((_v) => _v._tag === "LPLabeled" ? (({ name }) => _Set_add6(name, s))(_v) : s)(inner))(_v) : _v._tag === "LPLabeled" ? (({ name }) => _Set_add6(name, s))(_v) : s)(lab)), acc, g.labs))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var addNames = _curry18(3, (names, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: n }) => addNames(names, i + 1, _Set_add6(n, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, names)));
var paramNameSet = _curry18(3, (params, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: p }) => paramNameSet(params, i + 1, addNames(paramNames(p), 0, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, params)));
var letBlockLoop = _curry18(4, (ctx, e, seen, decls) => ((_v) => _v._tag === "ELetIn" ? (({ name, value, body }) => or9(_Set_has5(name, seen), ((_v) => _v._tag === "ELambda" ? false : _Set_has5(name, exprRefs(ctx, value, _Set_fromArray6([]))))(value)) ? _tuple9(decls, e, seen) : letBlockLoop(ctx, body, _Set_add6(name, seen), _Array_append13(`const ${suffixOr(name, hook1(ctx.annotateLetin, value))} = ${genExpr(ctx, value)};`, decls)))(_v) : _tuple9(decls, e, seen))(e));
var genLambdaBodyIn = _curry18(4, (ctx, e, bound, prefix) => (([decls, rest, seen]) => length14(decls) === 0 ? ((_v) => _v._tag === "ELoop" ? (({ params, body }) => loopParamFree(params, 0, bound) ? `{ ${prefix}${genLoopBlock(ctx, params, body)} }` : prefix === "" ? genLambdaBody(ctx, e) : `{ ${prefix}return ${genLambdaBody(ctx, e)}; }`)(_v) : prefix === "" ? genLambdaBody(ctx, e) : `{ ${prefix}return ${genLambdaBody(ctx, e)}; }`)(e) : ((block) => ((_v) => _v._tag === "ELoop" ? (({ params, body }) => loopParamFree(params, 0, seen) ? `{ ${prefix}${block} ${genLoopBlock(ctx, params, body)} }` : `{ ${prefix}${block} return ${genExpr(ctx, rest)}; }`)(_v) : `{ ${prefix}${block} return ${genExpr(ctx, rest)}; }`)(rest))(_Str_join6(" ", decls)))(letBlockLoop(ctx, e, bound, [])));
var isCatchAll2 = (p) => ((_v) => _v._tag === "PAs" ? (({ pat }) => isCatchAll2(pat))(_v) : _v._tag === "PWild" ? true : _v._tag === "PUnit" ? true : _v._tag === "PBind" ? true : _v._tag === "PRecord" ? (({ fields }) => allOf2((f) => isCatchAll2(f.pat), fields))(_v) : _v._tag === "PTuple" ? (({ elems }) => allOf2(isCatchAll2, elems))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => and12(length14(elems) === 0, _Option_isSome4(rest)))(_v) : _v._tag === "PList" ? (({ elems, rest }) => and12(length14(elems) === 0, _Option_isSome4(rest)))(_v) : false)(p);
var isPList2 = (p) => ((_v) => _v._tag === "PList" ? true : false)(p);
var keyedSlot = _curry18(2, (key, sub) => eq14(sub, key) ? key : `${key}: ${sub}`);
var pctorEntries = _curry18(4, (ctx, ctor, args, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: a }) => ((s) => ((restEntries) => s === "" ? restEntries : _Array_prepend7(keyedSlot(keyAt(ctx, ctor, i), s), restEntries))(pctorEntries(ctx, ctor, args, i + 1)))(patSlot(ctx, a)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, args)));
var precordEntries = _curry18(3, (ctx, fields, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: f }) => ((s) => ((restEntries) => s === "" ? restEntries : _Array_prepend7(keyedSlot(f.label, s), restEntries))(precordEntries(ctx, fields, i + 1)))(patSlot(ctx, f.pat)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, fields)));
var patSlot = _curry18(2, (ctx, p) => ((_v) => _v._tag === "PAs" ? (({ pat, name }) => ((inner) => inner === "" ? name : `${inner}, ${name}`)(patSlot(ctx, pat)))(_v) : _v._tag === "PBind" ? (({ name }) => name)(_v) : _v._tag === "PWild" ? "" : _v._tag === "PUnit" ? "" : _v._tag === "PLit" ? "" : _v._tag === "PBool" ? "" : _v._tag === "PStr" ? "" : _v._tag === "PList" ? "" : _v._tag === "PCtor" ? (({ ctor, args }) => ((entries) => length14(entries) === 0 ? "" : `{ ${_Str_join6(", ", entries)} }`)(pctorEntries(ctx, ctor, args, 0)))(_v) : _v._tag === "PRecord" ? (({ fields }) => ((entries) => length14(entries) === 0 ? "" : `{ ${_Str_join6(", ", entries)} }`)(precordEntries(ctx, fields, 0)))(_v) : _v._tag === "PTuple" ? (({ elems }) => ((slots) => someOf3((s) => s !== "", slots) ? `[${_Str_join6(", ", slots)}]` : "")(map10((el) => patSlot(ctx, el), elems)))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => ((slots) => ((slots2) => someOf3((s) => s !== "", slots2) ? `[${_Str_join6(", ", slots2)}]` : "")(((_v) => _v._tag === "Some" && _v.value._tag === "PBind" ? (({ value: { name } }) => _Array_append13(`...${name}`, slots))(_v) : slots)(rest)))(map10((el) => patSlot(ctx, el), elems)))(_v) : _v._tag === "POr" ? (({ alts }) => ((_v) => _v._tag === "Some" ? (({ value: first }) => patSlot(ctx, first))(_v) : _v._tag === "None" ? "" : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_head5(alts)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p));
var pctorConds = _curry18(5, (ctx, ctor, args, i, path) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: a }) => _Array_concat8(patConds(ctx, a, `${path}.${keyAt(ctx, ctor, i)}`), pctorConds(ctx, ctor, args, i + 1, path)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, args)));
var precordConds = _curry18(4, (ctx, fields, i, path) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: f }) => _Array_concat8(patConds(ctx, f.pat, `${path}.${f.label}`), precordConds(ctx, fields, i + 1, path)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, fields)));
var ptupleConds = _curry18(4, (ctx, elems, i, path) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: el }) => _Array_concat8(patConds(ctx, el, `${path}[${show7(i)}]`), ptupleConds(ctx, elems, i + 1, path)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, elems)));
var parrConds = _curry18(4, (ctx, elems, i, path) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: el }) => _Array_concat8(patConds(ctx, el, `${path}[${show7(i)}]`), parrConds(ctx, elems, i + 1, path)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, elems)));
var patConds = _curry18(3, (ctx, p, path) => ((_v) => _v._tag === "PAs" ? (({ pat }) => patConds(ctx, pat, path))(_v) : _v._tag === "PWild" ? [] : _v._tag === "PUnit" ? [] : _v._tag === "PBind" ? [] : _v._tag === "PList" ? [] : _v._tag === "PLit" ? [`${path} === ${litValue(p)}`] : _v._tag === "PBool" ? [`${path} === ${litValue(p)}`] : _v._tag === "PStr" ? [`${path} === ${litValue(p)}`] : _v._tag === "PCtor" ? (({ ctor, args }) => _Array_prepend7(`${path}._tag === ${jsStringLit(ctor)}`, pctorConds(ctx, ctor, args, 0, path)))(_v) : _v._tag === "PRecord" ? (({ fields }) => precordConds(ctx, fields, 0, path))(_v) : _v._tag === "PTuple" ? (({ elems }) => ptupleConds(ctx, elems, 0, path))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => _Array_prepend7(`${path}.length ${_Option_isSome4(rest) ? ">=" : "==="} ${show7(length14(elems))}`, parrConds(ctx, elems, 0, path)))(_v) : _v._tag === "POr" ? (({ alts }) => ((altCond) => [_Str_join6(" || ", map10((alt) => `(${altCond(alt)})`, alts))])((alt) => {
  const conds = patConds(ctx, alt, path);
  return length14(conds) === 0 ? "true" : _Str_join6(" && ", map10((c) => `(${c})`, conds));
}))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p));
var catchAllParam = _curry18(2, (ctx, p) => ((_v) => _v._tag === "PArr" ? (({ rest }) => ((_v) => _v._tag === "Some" && _v.value._tag === "PBind" ? (({ value: { name } }) => `(${name})`)(_v) : "()")(rest))(_v) : _v._tag === "PList" ? (({ rest }) => ((_v) => _v._tag === "Some" && _v.value._tag === "PBind" ? (({ value: { name } }) => `(${name})`)(_v) : "()")(rest))(_v) : ((slot) => slot === "" ? "()" : `(${slot})`)(patSlot(ctx, p)))(p));
var isListMatch = (arms) => someOf3((a) => and12(isPList2(a.pattern), !isCatchAll2(a.pattern)), arms);
var listTail = (from) => concat(concat(concat("_list(function* () { for (let _i = ", show7(from)), "; _i < _b.length; _i++) yield _b[_i]; "), "if (!_done) { let _s; while (!(_s = _it.next()).done) yield _s.value; } })");
var listArmGuards = _curry18(3, (ctx, elems, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: el }) => _Array_concat8(patConds(ctx, el, `_b[${show7(i)}]`), listArmGuards(ctx, elems, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, elems)));
var listArmBinds = _curry18(3, (ctx, elems, i) => ((_v) => _v._tag === "None" ? _tuple9([], []) : _v._tag === "Some" ? (({ value: el }) => (([restParams, restArgs]) => {
  const slot = patSlot(ctx, el);
  return slot === "" ? _tuple9(restParams, restArgs) : _tuple9(_Array_prepend7(slot, restParams), _Array_prepend7(`_b[${show7(i)}]`, restArgs));
})(listArmBinds(ctx, elems, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, elems)));
var genListArm = _curry18(3, (ctx, p, body) => ((_v) => _v._tag === "PList" ? (({ elems, rest }) => ((n) => ((guards) => ((head) => ((cond) => (([params0, args0]) => (([params, args]) => `  if (${cond}) return ((${_Str_join6(", ", params)}) => ${genLambdaBody(ctx, body)})(${_Str_join6(", ", args)});`)(((_v) => _v._tag === "Some" && _v.value._tag === "PBind" ? (({ value: { name } }) => _tuple9(_Array_append13(name, params0), _Array_append13(listTail(n), args0)))(_v) : _tuple9(params0, args0))(rest)))(listArmBinds(ctx, elems, 0)))(_Str_join6(" && ", _Array_prepend7(head, guards))))(_Option_isSome4(rest) ? `_pull(${show7(n)})` : `!_pull(${show7(n + 1)}) && _b.length === ${show7(n)}`))(listArmGuards(ctx, elems, 0)))(length14(elems)))(_v) : "")(p));
var listMatchLoop = _curry18(3, (ctx, arms, i) => ((_v) => _v._tag === "None" ? _tuple9([], '(() => { throw new Error("non-exhaustive lazy-list switch"); })()') : _v._tag === "Some" ? (({ value: a }) => and12(isPList2(a.pattern), !isCatchAll2(a.pattern)) ? (([restLines, fallback]) => _tuple9(_Array_prepend7(genListArm(ctx, a.pattern, a.body), restLines), fallback))(listMatchLoop(ctx, arms, i + 1)) : isCatchAll2(a.pattern) ? ((restName) => ((fallback) => _tuple9([], fallback))(((_v) => _v._tag === "Some" ? (({ value: name }) => `((${name}) => ${genLambdaBody(ctx, a.body)})(${listTail(0)})`)(_v) : _v._tag === "None" ? genExpr(ctx, a.body) : (() => {
  throw new Error("non-exhaustive match");
})())(restName)))(((_v) => _v._tag === "PList" && _v.rest._tag === "Some" && _v.rest.value._tag === "PBind" ? (({ rest: { value: { name } } }) => Some17(name))(_v) : None17)(a.pattern)) : listMatchLoop(ctx, arms, i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, arms)));
var genListMatch = _curry18(3, (ctx, scrutinee, arms) => (([armLines, fallback]) => concat(concat(concat(concat(concat(concat(concat(concat("((_it) => { const _b = []; let _done = false; ", "const _pull = (_n) => { while (_b.length < _n && !_done) { const _s = _it.next(); "), `if (_s.done) _done = true; else _b.push(_s.value); } return _b.length >= _n; };
`), _Str_join6(`
`, armLines)), `
  return `), fallback), `;
})(`), genExpr(ctx, scrutinee)), "[Symbol.iterator]())"))(listMatchLoop(ctx, arms, 0)));
var matchArmsLoop = _curry18(4, (ctx, arms, i, base) => ((_v) => _v._tag === "None" ? _tuple9([], None17) : _v._tag === "Some" ? (({ value: a }) => (([restLines, restCatch]) => ((_v) => _v._tag === "Some" ? (({ value: g }) => _tuple9(_Array_prepend7(`  ${genGuardArm(ctx, a.pattern, a.body, Some17(g), base)}`, restLines), restCatch))(_v) : _v._tag === "None" ? isCatchAll2(a.pattern) ? _tuple9(restLines, Some17(_tuple9(a.pattern, a.body))) : _tuple9(_Array_prepend7(`  ${genWithArm(ctx, a.pattern, a.body, base)}`, restLines), restCatch) : (() => {
  throw new Error("non-exhaustive match");
})())(a.guard))(matchArmsLoop(ctx, arms, i + 1, base)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, arms)));
var hasArrArm = (arms) => someOf3((a) => ((_v) => _v._tag === "PArr" ? true : false)(a.pattern), arms);
var isShallowArm = _curry18(2, (ctx, p) => ((_v) => _v._tag === "PAs" ? (({ pat }) => isShallowPat(pat))(_v) : or9(isShallowPat(p), patSlot(ctx, p) === ""))(p));
var isShallowPat = (p) => ((_v) => _v._tag === "PCtor" ? (({ args }) => allOf2(isFlatSub, args))(_v) : _v._tag === "PRecord" ? (({ fields }) => allOf2((f) => isFlatSub(f.pat), fields))(_v) : _v._tag === "PLit" ? true : _v._tag === "PBool" ? true : _v._tag === "PStr" ? true : isCatchAll2(p))(p);
var armView = _curry18(3, (ctx, p, base) => ((_v) => _v._tag === "Some" && (({ value: b }) => !isShallowArm(ctx, p))(_v) ? (({ value: b }) => ((target) => eq14(target, b) ? "_v" : `(_v as ${target})`)(patTarget(ctx, p, b)))(_v) : "_v")(base));
var underBinds = _curry18(4, (ctx, p, view, body) => ((_v) => _v._tag === "PAs" ? (({ pat, name }) => ((slot) => slot === "" ? `((${name}) => ${body})(${view})` : `((${name}) => ((${slot}) => ${body})(${name}))(${view})`)(patSlot(ctx, pat)))(_v) : ((slot) => slot === "" ? body : `((${slot}) => ${body})(${view})`)(patSlot(ctx, p)))(p));
var ternArmTest = _curry18(4, (ctx, p, guardOpt, base) => {
  const conds = patConds(ctx, p, "_v");
  const all = ((_v) => _v._tag === "Some" ? (({ value: g }) => _Array_append13(underBinds(ctx, p, armView(ctx, p, base), `(${genExpr(ctx, g)})`), conds))(_v) : _v._tag === "None" ? conds : (() => {
    throw new Error("non-exhaustive match");
  })())(guardOpt);
  return length14(all) === 0 ? "true" : _Str_join6(" && ", all);
});
var ternArms = _curry18(4, (ctx, arms, i, base) => ((_v) => _v._tag === "None" ? '(() => { throw new Error("non-exhaustive match"); })()' : _v._tag === "Some" ? (({ value: a }) => ((body) => and12(_Option_isNone2(a.guard), isCatchAll2(a.pattern)) ? ((_v) => _v === "()" ? body : ((param) => `(${param} => ${body})(_v)`)(_v))(catchAllParam(ctx, a.pattern)) : `${ternArmTest(ctx, a.pattern, a.guard, base)}
    ? ${underBinds(ctx, a.pattern, armView(ctx, a.pattern, base), body)}
    : ${ternArms(ctx, arms, i + 1, base)}`)(`(${genLambdaBody(ctx, a.body)})`))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, arms)));
var ternaryTypes = _curry18(3, (ctx, arms, base) => or9(or9(_Option_isNone2(ctx.guardBaseType), _Option_isSome4(base)), allOf2((a) => isShallowArm(ctx, a.pattern), arms)));
var genMatch = _curry18(3, (ctx, scrutinee, arms) => isListMatch(arms) ? genListMatch(ctx, scrutinee, arms) : ((base) => ternaryTypes(ctx, arms, base) ? `((_v) => ${ternArms(ctx, arms, 0, base)})(${genExpr(ctx, scrutinee)})` : genMatchChain(ctx, scrutinee, arms, base))(hook1(ctx.guardBaseType, scrutinee)));
var genMatchChain = _curry18(4, (ctx, scrutinee, arms, base) => (([armLines, catchAll]) => {
  const tail = ((_v) => _v._tag === "Some" ? (({ value: [p, body] }) => `  .otherwise(${catchAllParam(ctx, p)} => ${genLambdaBody(ctx, body)})`)(_v) : _v._tag === "None" ? and12(_Option_isSome4(ctx.guardBaseType), hasArrArm(arms)) ? '  .otherwise(() => { throw new Error("non-exhaustive match"); })' : "  .exhaustive()" : (() => {
    throw new Error("non-exhaustive match");
  })())(catchAll);
  return _Str_join6(`
`, _Array_concat8(_Array_prepend7(`match(${genExpr(ctx, scrutinee)})`, armLines), [tail]));
})(matchArmsLoop(ctx, arms, 0, base)));
var litValue = (p) => ((_v) => _v._tag === "PStr" ? (({ value: v }) => jsStringLit(v))(_v) : _v._tag === "PLit" ? (({ raw }) => raw)(_v) : _v._tag === "PBool" ? (({ value: v }) => v ? "true" : "false")(_v) : "")(p);
var fieldRefine = _curry18(3, (ctx, p, fieldBase) => ((_v) => _v._tag === "PCtor" ? Some17(patTarget(ctx, p, fieldBase)) : _v._tag === "PRecord" ? ((t) => eq14(t, fieldBase) ? None17 : Some17(t))(patTarget(ctx, p, fieldBase)) : _v._tag === "PTuple" ? ((t) => eq14(t, fieldBase) ? None17 : Some17(t))(patTarget(ctx, p, fieldBase)) : _v._tag === "PArr" ? ((t) => eq14(t, fieldBase) ? None17 : Some17(t))(patTarget(ctx, p, fieldBase)) : None17)(p));
var ctorRefines = _curry18(5, (ctx, args, keys, member, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: a }) => ((rest) => ((key) => ((_v) => _v._tag === "Some" ? (({ value: sub }) => _Array_prepend7(`${jsStringLit(key)}: ${sub}`, rest))(_v) : _v._tag === "None" ? rest : (() => {
  throw new Error("non-exhaustive match");
})())(fieldRefine(ctx, a, `${member}[${jsStringLit(key)}]`)))(_Option_unwrapOr10(`_${show7(i)}`, _Array_get16(i, keys))))(ctorRefines(ctx, args, keys, member, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, args)));
var recordRefines = _curry18(4, (ctx, fields, base, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: f }) => ((rest) => ((_v) => _v._tag === "Some" ? (({ value: sub }) => _Array_prepend7(`${jsStringLit(f.label)}: ${sub}`, rest))(_v) : _v._tag === "None" ? rest : (() => {
  throw new Error("non-exhaustive match");
})())(fieldRefine(ctx, f.pat, `${base}[${jsStringLit(f.label)}]`)))(recordRefines(ctx, fields, base, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, fields)));
var tupleSlotBase = _curry18(2, (base, i) => `(${base})[${show7(i)}]`);
var tupleTargets = _curry18(4, (ctx, elems, base, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: el }) => ((slotBase) => _Array_prepend7(_Option_unwrapOr10(slotBase, fieldRefine(ctx, el, slotBase)), tupleTargets(ctx, elems, base, i + 1)))(tupleSlotBase(base, i)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, elems)));
var tupleRefines = _curry18(4, (ctx, elems, base, i) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" ? (({ value: el }) => or9(_Option_isSome4(fieldRefine(ctx, el, tupleSlotBase(base, i))), tupleRefines(ctx, elems, base, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, elems)));
var arrTargets = _curry18(4, (ctx, elems, elemBase, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: el }) => _Array_prepend7(_Option_unwrapOr10(elemBase, fieldRefine(ctx, el, elemBase)), arrTargets(ctx, elems, elemBase, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, elems)));
var arrRefines = _curry18(4, (ctx, elems, elemBase, i) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" ? (({ value: el }) => or9(_Option_isSome4(fieldRefine(ctx, el, elemBase)), arrRefines(ctx, elems, elemBase, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, elems)));
var patTarget = _curry18(3, (ctx, p, base) => ((_v) => _v._tag === "PAs" ? (({ pat }) => patTarget(ctx, pat, base))(_v) : _v._tag === "PCtor" ? (({ ctor, args }) => ((member) => ((keys) => ((refines) => length14(refines) === 0 ? member : `${member} & { ${_Str_join6("; ", refines)} }`)(ctorRefines(ctx, args, keys, member, 0)))(_Option_unwrapOr10([], _Map_get7(ctor, ctx.keys))))(`Extract<${base}, { _tag: ${jsStringLit(ctor)} }>`))(_v) : _v._tag === "PRecord" ? (({ fields }) => ((refines) => length14(refines) === 0 ? base : `${base} & { ${_Str_join6("; ", refines)} }`)(recordRefines(ctx, fields, base, 0)))(_v) : _v._tag === "PTuple" ? (({ elems }) => !tupleRefines(ctx, elems, base, 0) ? base : `[${_Str_join6(", ", tupleTargets(ctx, elems, base, 0))}]`)(_v) : _v._tag === "PArr" ? (({ elems, rest: restOpt }) => ((elemBase) => !arrRefines(ctx, elems, elemBase, 0) ? base : ((heads) => ((_v) => _v._tag === "Some" ? `[${heads}, ...${base}]` : _v._tag === "None" ? `[${heads}]` : (() => {
  throw new Error("non-exhaustive match");
})())(restOpt))(_Str_join6(", ", arrTargets(ctx, elems, elemBase, 0))))(`(${base})[number]`))(_v) : base)(p));
var genGuardArm = _curry18(5, (ctx, p, body, guardOpt, base) => {
  const root = _Option_isSome4(base) ? "_g" : "_v";
  const conds0 = patConds(ctx, p, root);
  const slot = ((_v) => _v._tag === "PAs" ? (({ pat }) => patSlot(ctx, pat))(_v) : patSlot(ctx, p))(p);
  const conds = ((_v) => _v._tag === "Some" ? (({ value: g }) => ((_v) => _v._tag === "PAs" ? (({ name }) => _Array_append13(slot === "" ? `((${name}) => ${genExpr(ctx, g)})(${root})` : `((${name}) => ((${slot}) => ${genExpr(ctx, g)})(${name}))(${root})`, conds0))(_v) : _Array_append13(slot === "" ? `(${genExpr(ctx, g)})` : `((${slot}) => ${genExpr(ctx, g)})(${root})`, conds0))(p))(_v) : _v._tag === "None" ? conds0 : (() => {
    throw new Error("non-exhaustive match");
  })())(guardOpt);
  const test = length14(conds) === 0 ? "true" : _Str_join6(" && ", conds);
  const handler = ((_v) => _v._tag === "PAs" ? (({ name }) => `(${name}) => ${slot === "" ? genLambdaBody(ctx, body) : `((${slot}) => ${genLambdaBody(ctx, body)})(${name})`}`)(_v) : `${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody(ctx, body)}`)(p);
  return ((_v) => _v._tag === "None" ? `.with((_v) => ${test}, ${handler})` : _v._tag === "Some" ? (({ value: b }) => ((target) => eq14(target, b) ? `.with((_v) => { const _g: any = _v; return ${test}; }, ${handler})` : `.with((_v): _v is ${target} => { const _g: any = _v; return ${test}; }, ${handler})`)(patTarget(ctx, p, b)))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(base);
});
var isFlatSub = (p) => ((_v) => _v._tag === "PAs" ? false : _v._tag === "PBind" ? true : _v._tag === "PWild" ? true : _v._tag === "PLit" ? true : _v._tag === "PBool" ? true : _v._tag === "PStr" ? true : false)(p);
var recordLits = _curry18(2, (fields, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: f }) => ((rest) => ((_v) => _v._tag === "PLit" ? _Array_prepend7(`${f.label}: ${litValue(f.pat)}`, rest) : _v._tag === "PBool" ? _Array_prepend7(`${f.label}: ${litValue(f.pat)}`, rest) : _v._tag === "PStr" ? _Array_prepend7(`${f.label}: ${litValue(f.pat)}`, rest) : rest)(f.pat))(recordLits(fields, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, fields)));
var ctorArgParts = _curry18(4, (ctx, ctor, args, i) => ((_v) => _v._tag === "None" ? _tuple9([], []) : _v._tag === "Some" ? (({ value: a }) => (([restBinds, restLits]) => {
  const key = keyAt(ctx, ctor, i);
  return ((_v) => _v._tag === "PBind" ? (({ name }) => _tuple9(_Array_prepend7(keyedSlot(key, name), restBinds), restLits))(_v) : _v._tag === "PLit" ? _tuple9(restBinds, _Array_prepend7(`${key}: ${litValue(a)}`, restLits)) : _v._tag === "PBool" ? _tuple9(restBinds, _Array_prepend7(`${key}: ${litValue(a)}`, restLits)) : _v._tag === "PStr" ? _tuple9(restBinds, _Array_prepend7(`${key}: ${litValue(a)}`, restLits)) : _tuple9(restBinds, restLits))(a);
})(ctorArgParts(ctx, ctor, args, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, args)));
var genWithArm = _curry18(4, (ctx, p, body, base) => ((_v) => _v._tag === "PAs" ? genGuardArm(ctx, p, body, None17, base) : _v._tag === "PArr" ? genGuardArm(ctx, p, body, None17, base) : _v._tag === "PTuple" ? genGuardArm(ctx, p, body, None17, base) : _v._tag === "POr" ? genGuardArm(ctx, p, body, None17, base) : _v._tag === "PLit" ? `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})` : _v._tag === "PBool" ? `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})` : _v._tag === "PStr" ? `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})` : _v._tag === "PRecord" ? (({ fields }) => allOf2((f) => isFlatSub(f.pat), fields) ? ((lits) => ((slot) => `.with({ ${_Str_join6(", ", lits)} }, ${slot === "" ? "()" : `(${slot})`} => ${genLambdaBody(ctx, body)})`)(patSlot(ctx, p)))(recordLits(fields, 0)) : genGuardArm(ctx, p, body, None17, base))(_v) : _v._tag === "PCtor" ? (({ ctor, args }) => allOf2(isFlatSub, args) ? (([binds, litFields]) => {
  const patObj = _Str_join6(", ", _Array_prepend7(`_tag: ${jsStringLit(ctor)}`, litFields));
  const param = length14(binds) === 0 ? "()" : `({ ${_Str_join6(", ", binds)} })`;
  return `.with({ ${patObj} }, ${param} => ${genLambdaBody(ctx, body)})`;
})(ctorArgParts(ctx, ctor, args, 0)) : genGuardArm(ctx, p, body, None17, base))(_v) : genGuardArm(ctx, p, body, None17, base))(p));
var typedCtorParams = _curry18(3, (keys, paramTypes, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: k }) => _Array_prepend7(`${k}: ${_Option_unwrapOr10("unknown", _Array_get16(i, paramTypes))}`, typedCtorParams(keys, paramTypes, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, keys)));
var genCtor = _curry18(2, (c, ts) => {
  const tag = jsStringLit(c.name);
  return length14(c.fields) === 0 ? ((_v) => _v._tag === "Some" ? (({ value: t }) => `const ${c.name}: ${t.retMono} = { _tag: ${tag} };`)(_v) : _v._tag === "None" ? `const ${c.name} = { _tag: ${tag} };` : (() => {
    throw new Error("non-exhaustive match");
  })())(ts) : ((keys) => ((params) => ((impl) => length14(c.fields) >= 2 ? ((curried) => ((_v) => _v._tag === "Some" ? (({ value: t }) => `const ${c.name} = ${curried} as ${t.generics}(${_Str_join6(", ", typedCtorParams(keys, t.paramTypes, 0))}) => ${t.ret};`)(_v) : _v._tag === "None" ? `const ${c.name} = ${curried};` : (() => {
    throw new Error("non-exhaustive match");
  })())(ts))(`_curry(${show7(length14(c.fields))}, ${impl})`) : ((_v) => _v._tag === "Some" ? (({ value: t }) => `const ${c.name} = ${t.generics}(${_Str_join6(", ", typedCtorParams(keys, t.paramTypes, 0))}): ${t.ret} => ({ _tag: ${tag}, ${params} });`)(_v) : _v._tag === "None" ? `const ${c.name} = ${impl};` : (() => {
    throw new Error("non-exhaustive match");
  })())(ts))(`(${params}) => ({ _tag: ${tag}, ${params} })`))(_Str_join6(", ", keys)))(keysOf(c.fields));
});
var genCtorsFrom = _curry18(6, (s, ctors, h, refs, exported, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: c }) => ((rest) => or9(exported, _Set_has5(c.name, refs)) ? _Array_prepend7(genCtor(c, hook2(h, s, c)), rest) : rest)(genCtorsFrom(s, ctors, h, refs, exported, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, ctors)));
var genType = _curry18(2, (ctx, s) => ((_v) => _v._tag === "SType" ? (({ ctors, exported }) => _Str_join6(`
`, genCtorsFrom(s, ctors, ctx.annotateCtor, ctx.valueRefs, exported, 0)))(_v) : "")(s));
var typeExprArity = (te) => ((_v) => _v._tag === "TyArrow" ? (({ to }) => 1 + typeExprArity(to))(_v) : 0)(te);
var externArgs = (n) => {
  let i = 0;
  let acc = "";
  while (true) {
    if (i >= n) {
      return acc;
    } else {
      [i, acc] = [i + 1, acc === "" ? `$a${show7(i)}` : `${acc}, $a${show7(i)}`];
      continue;
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
      [i, acc] = [i + 1, `${acc}($a${show7(i)})`];
      continue;
    }
  }
};
var genExtern = (s) => ((_v) => _v._tag === "SExtern" ? (({ name, typeExpr, module: modName, imported, curried }) => _Str_startsWith4("mochi:global:", modName) ? ((target) => ((base) => `const ${name} = ${imported === "" ? base : `${base}[${jsStringLit(imported)}]`};`)(`globalThis[${jsStringLit(target)}]`))(_Str_slice3(13, _Str_length6(modName), modName)) : _Str_startsWith4("mochi:get:", modName) ? ((target) => `const ${name} = ($receiver) => $receiver[${jsStringLit(target)}];`)(_Str_slice3(10, _Str_length6(modName), modName)) : _Str_startsWith4("mochi:set:", modName) ? ((target) => `const ${name} = _curry(2, ($receiver, $value) => ($receiver[${jsStringLit(target)}] = $value));`)(_Str_slice3(10, _Str_length6(modName), modName)) : _Str_startsWith4("mochi:new:", modName) ? ((target) => ((arity) => ((args) => imported !== "" ? ((raw) => ((importLine) => ((ctor) => arity === 0 ? `${importLine}
const ${name} = () => ${ctor};` : `${importLine}
const ${name} = _curry(${show7(arity)}, (${args}) => ${ctor});`)(`new ${raw}(${args})`))(`import { ${imported} as ${raw} } from ${jsStringLit(target)};`))(_Str_concat2("$", name)) : arity === 0 ? `const ${name} = () => new globalThis[${jsStringLit(target)}]();` : `const ${name} = _curry(${show7(arity)}, (${args}) => new globalThis[${jsStringLit(target)}](${args}));`)(externArgs(arity)))(typeExprArity(typeExpr)))(_Str_slice3(10, _Str_length6(modName), modName)) : _Str_startsWith4("mochi:send:", modName) ? ((target) => ((arity) => ((args) => ((fn) => arity < 2 ? `const ${name} = ${fn};` : `const ${name} = _curry(${show7(arity)}, ${fn});`)(args === "" ? `($receiver) => $receiver[${jsStringLit(target)}]()` : `($receiver, ${args}) => $receiver[${jsStringLit(target)}](${args})`))(externArgs(sub7(arity, 1))))(typeExprArity(typeExpr)))(_Str_slice3(11, _Str_length6(modName), modName)) : imported === "default" ? `import ${name} from ${jsStringLit(modName)};` : ((arity) => arity <= 1 ? ((spec) => `import { ${spec} } from ${jsStringLit(modName)};`)(eq14(imported, name) ? name : `${imported} as ${name}`) : ((raw) => ((flat) => `import { ${imported} as ${raw} } from ${jsStringLit(modName)};
const ${name} = _curry(${show7(arity)}, ${flat});`)(curried ? `(${externArgs(arity)}) => ${raw}${externApplied(arity)}` : raw))(_Str_concat2("$", name)))(typeExprArity(typeExpr)))(_v) : "")(s);
var stripAlExt = (s) => _Str_endsWith2(".mochi", s) ? _Str_slice3(0, sub7(_Str_length6(s), 6), s) : s;
var rewriteImportPath = _curry18(2, (from, ext) => {
  const bare = stripAlExt(from);
  return or9(_Str_startsWith4("./", bare), _Str_startsWith4("../", bare)) ? `${bare}${ext}` : bare;
});
var genImport = _curry18(2, (s, ext) => ((_v) => _v._tag === "SImport" ? (({ names, from }) => ((nameList) => ((path) => `import { ${nameList} } from ${jsStringLit(path)};`)(rewriteImportPath(from, ext)))(_Str_join6(", ", map10((n) => n.name, names))))(_v) : _v._tag === "SImportNs" ? (({ alias, from }) => ((path) => `import * as ${alias.name} from ${jsStringLit(path)};`)(rewriteImportPath(from, ext)))(_v) : "")(s));
var exportLine = (l) => `export ${l}`;
var jsDocLine = (l) => _Str_length6(l) > 0 ? ` * ${_Str_replace2("*/", "*\\/", l)}` : " *";
var jsDoc = (docOpt) => ((_v) => _v._tag === "None" ? "" : _v._tag === "Some" ? (({ value: doc }) => ((lines) => `/**
${_Str_join6(`
`, lines)}
 */
`)(map10(jsDocLine, _Str_split5(`
`, doc))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(docOpt);
var genStmt = _curry18(2, (ctx, s) => ((_v) => _v._tag === "SError" ? (({ span: sp }) => `throw new Error("codegen invariant: error node reached codegen at ${show7(sp.start)}");`)(_v) : _v._tag === "SImport" ? genImport(s, ctx.moduleExt) : _v._tag === "SImportNs" ? genImport(s, ctx.moduleExt) : _v._tag === "SType" ? (({ exported }) => ((decls) => decls === "" ? "" : exported ? _Str_join6(`
`, map10(exportLine, _Str_split5(`
`, decls))) : decls)(genType(ctx, s)))(_v) : _v._tag === "SExtern" ? (({ name, exported, doc }) => ((docComment) => exported ? `${docComment}${genExtern(s)}
export { ${name} };` : `${docComment}${genExtern(s)}`)(ctx.docs ? jsDoc(doc) : ""))(_v) : _v._tag === "SLet" ? (({ name, value, exported, doc }) => ((doExport) => ((docComment) => `${docComment}${doExport ? "export " : ""}const ${name}${_Option_unwrapOr10("", hook2(ctx.annotateLet, name, value))} = ${genExpr(ctx, value)};`)(and12(ctx.docs, !_Str_startsWith4("$", name)) ? jsDoc(doc) : ""))(and12(exported, !_Str_startsWith4("$", name))))(_v) : _v._tag === "SExpr" ? (({ value }) => `${genExpr(ctx, value)};`)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(s));
var usesMatchLibArm = _curry18(2, (ctx, a) => or9(((_v) => _v._tag === "Some" ? (({ value: g }) => usesMatchLib(ctx, g))(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(a.guard), usesMatchLib(ctx, a.body)));
var usesMatchLib = _curry18(2, (ctx, e) => ((_v) => _v._tag === "ENum" ? false : _v._tag === "EUnit" ? false : _v._tag === "EBool" ? false : _v._tag === "EStr" ? false : _v._tag === "ERef" ? false : _v._tag === "ECall" ? (({ fn, args }) => or9(usesMatchLib(ctx, fn), someOf3((x) => usesMatchLib(ctx, x), args)))(_v) : _v._tag === "ELambda" ? (({ body }) => usesMatchLib(ctx, body))(_v) : _v._tag === "ELetIn" ? (({ value, body }) => or9(usesMatchLib(ctx, value), usesMatchLib(ctx, body)))(_v) : _v._tag === "ELetBind" ? (({ value, body }) => or9(usesMatchLib(ctx, value), usesMatchLib(ctx, body)))(_v) : _v._tag === "EPipe" ? (({ left, right }) => or9(usesMatchLib(ctx, left), usesMatchLib(ctx, right)))(_v) : _v._tag === "EDo" ? (({ exprs }) => someOf3((x) => usesMatchLib(ctx, x), exprs))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => or9(usesMatchLib(ctx, cond), or9(usesMatchLib(ctx, thenE), usesMatchLib(ctx, elseE))))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => or9(and12(!isListMatch(arms), !ternaryTypes(ctx, arms, hook1(ctx.guardBaseType, scrutinee))), or9(usesMatchLib(ctx, scrutinee), someOf3((a) => usesMatchLibArm(ctx, a), arms))))(_v) : _v._tag === "ELoop" ? (({ params, body }) => or9(someOf3((p) => usesMatchLib(ctx, p.init), params), usesMatchLib(ctx, body)))(_v) : _v._tag === "ERecur" ? (({ args }) => someOf3((x) => usesMatchLib(ctx, x), args))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => or9(((_v) => _v._tag === "Some" ? (({ value: s }) => usesMatchLib(ctx, s))(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(spread), someOf3((f) => usesMatchLib(ctx, f.value), fields)))(_v) : _v._tag === "EField" ? (({ target }) => usesMatchLib(ctx, target))(_v) : _v._tag === "ETuple" ? (({ elements }) => someOf3((x) => usesMatchLib(ctx, x), elements))(_v) : _v._tag === "EArr" ? (({ elements }) => someOf3((el) => usesMatchLib(ctx, ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el)), elements))(_v) : _v._tag === "EList" ? (({ elements }) => someOf3((el) => usesMatchLib(ctx, ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el)), elements))(_v) : _v._tag === "ESet" ? (({ elements }) => someOf3((el) => usesMatchLib(ctx, ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el)), elements))(_v) : _v._tag === "EMap" ? (({ entries }) => someOf3((en) => or9(usesMatchLib(ctx, en.key), usesMatchLib(ctx, en.value)), entries))(_v) : _v._tag === "EInterp" ? (({ parts }) => someOf3((p) => ((_v) => _v._tag === "IPLit" ? false : _v._tag === "IPExpr" ? (({ expr: ex }) => usesMatchLib(ctx, ex))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p), parts))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e));
var loopInitRefsFrom2 = _curry18(4, (ctx, params, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: p }) => loopInitRefsFrom2(ctx, params, i + 1, exprRefs(ctx, p.init, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, params)));
var exprRefsListFrom = _curry18(4, (ctx, xs, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: x }) => exprRefsListFrom(ctx, xs, i + 1, exprRefs(ctx, x, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, xs)));
var exprRefsInterpPartsFrom = _curry18(4, (ctx, parts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: p }) => exprRefsInterpPartsFrom(ctx, parts, i + 1, ((_v) => _v._tag === "IPLit" ? acc : _v._tag === "IPExpr" ? (({ expr: ex }) => exprRefs(ctx, ex, acc))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, parts)));
var exprRefsArmsFrom = _curry18(4, (ctx, arms, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: a }) => ((acc1) => exprRefsArmsFrom(ctx, arms, i + 1, exprRefs(ctx, a.body, acc1)))(((_v) => _v._tag === "Some" ? (({ value: g }) => exprRefs(ctx, g, acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(a.guard)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, arms)));
var exprRefsFieldsFrom = _curry18(4, (ctx, fields, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: f }) => exprRefsFieldsFrom(ctx, fields, i + 1, exprRefs(ctx, f.value, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, fields)));
var exprRefsEntriesFrom = _curry18(4, (ctx, entries, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: en }) => exprRefsEntriesFrom(ctx, entries, i + 1, exprRefs(ctx, en.value, exprRefs(ctx, en.key, acc))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, entries)));
var exprRefs = _curry18(3, (ctx, e, acc) => ((_v) => _v._tag === "ENum" ? acc : _v._tag === "EUnit" ? acc : _v._tag === "EBool" ? acc : _v._tag === "EStr" ? acc : _v._tag === "ERef" ? (({ name }) => _Set_add6(name, acc))(_v) : _v._tag === "ECall" ? (({ fn, args }) => exprRefsListFrom(ctx, args, 0, exprRefs(ctx, fn, acc)))(_v) : _v._tag === "ELambda" ? (({ params, body }) => (([cparams, cbody, fills]) => {
  const acc2 = length14(cparams) >= 2 ? _Set_add6("_curry", acc) : acc;
  const acc3 = reduce5(_curry18(2, (a, g) => reduce5(_curry18(2, (b, lab) => ((_v) => _v._tag === "LPSpanned" && _v.param._tag === "LPLabeled" && _v.param.defaultValue._tag === "Some" ? (({ param: { defaultValue: { value: d } } }) => exprRefs(ctx, d, b))(_v) : _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some" ? (({ defaultValue: { value: d } }) => exprRefs(ctx, d, b))(_v) : b)(lab)), a, g.labs)), acc2, fills);
  return exprRefs(ctx, cbody, acc3);
})(collapseLambda(params, body)))(_v) : _v._tag === "ELetIn" ? (({ value, body }) => exprRefs(ctx, body, exprRefs(ctx, value, acc)))(_v) : _v._tag === "ELetBind" ? (({ monad, value, body }) => exprRefs(ctx, body, exprRefs(ctx, value, _Set_add6(bindRuntime(monad), acc))))(_v) : _v._tag === "EPipe" ? (({ left, right }) => exprRefs(ctx, right, exprRefs(ctx, left, acc)))(_v) : _v._tag === "EDo" ? (({ exprs }) => exprRefsListFrom(ctx, exprs, 0, acc))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => exprRefs(ctx, elseE, exprRefs(ctx, thenE, exprRefs(ctx, cond, acc))))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => ((acc1) => ((acc2) => exprRefsArmsFrom(ctx, arms, 0, acc2))(someOf3((a) => ((_v) => _v._tag === "PList" && _v.rest._tag === "Some" && _v.rest.value._tag === "PBind" ? true : false)(a.pattern), arms) ? _Set_add6("_list", acc1) : acc1))(exprRefs(ctx, scrutinee, acc)))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => exprRefsFieldsFrom(ctx, fields, 0, ((_v) => _v._tag === "Some" ? (({ value: s }) => exprRefs(ctx, s, acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(spread)))(_v) : _v._tag === "EField" ? (({ target, name }) => ((_v) => _v._tag === "Some" ? ((_v) => _v._tag === "ERef" && _v.name === "List" ? _Set_add6("_list", acc) : acc)(target) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: rt }) => _Set_add6(rt, acc))(_v) : _v._tag === "None" ? exprRefs(ctx, target, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(nsRuntimeId(ctx, target, name)) : (() => {
  throw new Error("non-exhaustive match");
})())(emptyNsEmit(target, name, None17)))(_v) : _v._tag === "ELoop" ? (({ params, body }) => ((acc1) => ((acc2) => exprRefs(ctx, body, acc2))(loopInitRefsFrom2(ctx, params, 0, acc1)))(loopNeedsStep(body) ? _Set_add6("_recur", _Set_add6("_done", acc)) : acc))(_v) : _v._tag === "ERecur" ? (({ args }) => exprRefsListFrom(ctx, args, 0, acc))(_v) : _v._tag === "ETuple" ? (({ elements }) => exprRefsListFrom(ctx, elements, 0, acc))(_v) : _v._tag === "EArr" ? (({ elements }) => exprRefsListFrom(ctx, map10((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements), 0, acc))(_v) : _v._tag === "EList" ? (({ elements }) => exprRefsListFrom(ctx, map10((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements), 0, _Set_add6("_list", acc)))(_v) : _v._tag === "ESet" ? (({ elements }) => exprRefsListFrom(ctx, map10((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements), 0, acc))(_v) : _v._tag === "EMap" ? (({ entries }) => exprRefsEntriesFrom(ctx, entries, 0, acc))(_v) : _v._tag === "EInterp" ? (({ parts }) => exprRefsInterpPartsFrom(ctx, parts, 0, acc))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e));
var boundNamesFrom = _curry18(4, (valueRefs, stmts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: s }) => boundNamesFrom(valueRefs, stmts, i + 1, ((_v) => _v._tag === "SLet" ? (({ name }) => _Set_add6(name, acc))(_v) : _v._tag === "SExtern" ? (({ name }) => _Set_add6(name, acc))(_v) : _v._tag === "SType" ? (({ ctors, exported }) => _Set_union(acc, _Set_fromArray6(map10((c) => c.name, filter6((c) => or9(exported, _Set_has5(c.name, valueRefs)), ctors)))))(_v) : _v._tag === "SImport" ? (({ names }) => _Set_union(acc, _Set_fromArray6(map10((n) => n.name, names))))(_v) : _v._tag === "SImportNs" ? (({ alias }) => _Set_add6(alias.name, acc))(_v) : _v._tag === "SError" ? acc : _v._tag === "SExpr" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(s)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, stmts)));
var boundNames = _curry18(2, (valueRefs, stmts) => boundNamesFrom(valueRefs, stmts, 0, _Set_fromArray6([])));
var collectValueRefs = _curry18(4, (ctx, stmts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: s }) => collectValueRefs(ctx, stmts, i + 1, ((_v) => _v._tag === "SLet" ? (({ value }) => exprRefs(ctx, value, acc))(_v) : _v._tag === "SExpr" ? (({ value }) => exprRefs(ctx, value, acc))(_v) : acc)(s)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, stmts)));
var refsForStmt = _curry18(2, (ctx, s) => ((_v) => _v._tag === "SLet" ? (({ value }) => exprRefs(ctx, value, _Set_fromArray6([])))(_v) : _v._tag === "SExpr" ? (({ value }) => exprRefs(ctx, value, _Set_fromArray6([])))(_v) : _v._tag === "SType" ? (({ ctors, exported }) => someOf3((c) => and12(length14(c.fields) >= 2, or9(exported, _Set_has5(c.name, ctx.valueRefs))), ctors) ? _Set_add6("_curry", _Set_fromArray6([])) : _Set_fromArray6([]))(_v) : _v._tag === "SExtern" ? (({ typeExpr }) => typeExprArity(typeExpr) >= 2 ? _Set_add6("_curry", _Set_fromArray6([])) : _Set_fromArray6([]))(_v) : _Set_fromArray6([]))(s));
var collectRefsFrom = _curry18(4, (ctx, stmts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: s }) => collectRefsFrom(ctx, stmts, i + 1, _Set_union(acc, refsForStmt(ctx, s))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, stmts)));
var addDepsFrom = _curry18(4, (deps, j, refs, queue) => ((_v) => _v._tag === "None" ? _tuple9(refs, queue) : _v._tag === "Some" ? (({ value: d }) => _Set_has5(d, refs) ? addDepsFrom(deps, j + 1, refs, queue) : addDepsFrom(deps, j + 1, _Set_add6(d, refs), _Array_append13(d, queue)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(j, deps)));
var closeRefsFrom = _curry18(4, (queue, i, refs, runtimeDeps) => ((_v) => _v._tag === "None" ? refs : _v._tag === "Some" ? (({ value: r }) => ((deps) => (([refs2, queue2]) => closeRefsFrom(queue2, i + 1, refs2, runtimeDeps))(addDepsFrom(deps, 0, refs, queue)))(_Option_unwrapOr10([], _Map_get7(r, runtimeDeps))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, queue)));
var runtimeRefNames = _curry18(4, (ctx, stmts, jsDefs, runtimeDeps) => {
  const refs0 = collectRefsFrom(ctx, stmts, 0, _Set_fromArray6([]));
  const refs = closeRefsFrom(_Set_toArray3(refs0), 0, refs0, runtimeDeps);
  const bound = boundNames(ctx.valueRefs, stmts);
  return filter6((n) => and12(_Set_has5(n, refs), !_Set_has5(n, bound)), _Map_keys7(jsDefs));
});
var preludePreamble = _curry18(4, (ctx, stmts, jsDefs, runtimeDeps) => {
  const names = runtimeRefNames(ctx, stmts, jsDefs, runtimeDeps);
  const defs = map10((n) => _Map_getOr7("", n, jsDefs), names);
  return length14(defs) === 0 ? "" : `${_Str_join6(`
`, defs)}

`;
});
var genStmtAllFrom = _curry18(3, (ctx, stmts, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: s }) => _Array_prepend7(genStmt(ctx, s), genStmtAllFrom(ctx, stmts, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get16(i, stmts)));
var codegenWith = _curry18(7, (stmts, imported, useRuntime, ns, jsDefs, runtimeDeps, opts) => {
  const keys0 = ctorKeysFromStmts(stmts, imported);
  const keys = seedBuiltinCtorKeys(stmts, keys0);
  const ctx0 = { keys, ns, annotateLet: opts.annotateLet, annotateCtor: opts.annotateCtor, annotateParams: opts.annotateParams, annotateEmpty: opts.annotateEmpty, annotateLetin: opts.annotateLetin, annotateCall: opts.annotateCall, guardBaseType: opts.guardBaseType, flattenPipe: opts.flattenPipe, tupleHelper: opts.tupleHelper, preserveInfix: opts.preserveInfix, preserveJsx: opts.preserveJsx, moduleExt: opts.moduleExt, valueRefs: _Set_fromArray6([]), userNames: _Set_fromArray6([]), docs: opts.docs };
  const valueRefs = collectValueRefs(ctx0, stmts, 0, _Set_fromArray6([]));
  const userNames = _Set_union(boundNames(valueRefs, stmts), localBinderNames(stmts));
  const ctx = { ...ctx0, valueRefs, userNames };
  const needsMatch = someOf3((s) => ((_v) => _v._tag === "SLet" ? (({ value }) => usesMatchLib(ctx, value))(_v) : _v._tag === "SExpr" ? (({ value }) => usesMatchLib(ctx, value))(_v) : false)(s), stmts);
  const header = needsMatch ? `import { match } from "@onrails/pattern";

` : "";
  const preamble = useRuntime ? preludePreamble(ctx, stmts, jsDefs, runtimeDeps) : "";
  const body = _Str_join6(`
`, genStmtAllFrom(ctx, stmts, 0));
  return `${header}${preamble}${body}
`;
});
var runtimeDepNames = _curry18(5, (stmts, imported, ns, jsDefs, runtimeDeps) => {
  const keys = seedBuiltinCtorKeys(stmts, ctorKeysFromStmts(stmts, imported));
  const ctx0 = { keys, ns, annotateLet: None17, annotateCtor: None17, annotateParams: None17, annotateEmpty: None17, annotateLetin: None17, annotateCall: None17, guardBaseType: None17, flattenPipe: false, tupleHelper: false, preserveInfix: false, preserveJsx: false, moduleExt: ".js", valueRefs: _Set_fromArray6([]), userNames: _Set_fromArray6([]), docs: false };
  const valueRefs = collectValueRefs(ctx0, stmts, 0, _Set_fromArray6([]));
  return runtimeRefNames({ ...ctx0, valueRefs }, stmts, jsDefs, runtimeDeps);
});
var codegen = _curry18(6, (stmts, imported, useRuntime, ns, jsDefs, runtimeDeps) => codegenWith(stmts, imported, useRuntime, ns, jsDefs, runtimeDeps, jsGenOpts));

import { None as None19, Some as Some19, _Array_append as _Array_append15, _Array_concat as _Array_concat10, _Array_contains as _Array_contains4, _Array_dedupeBy, _Array_drop as _Array_drop3, _Array_get as _Array_get18, _Array_prepend as _Array_prepend9, _Array_reverse, _Array_sort as _Array_sort2, _Array_sortBy, _Array_take as _Array_take4, _Map_delete as _Map_delete3, _Map_get as _Map_get9, _Map_keys as _Map_keys9, _Map_set as _Map_set8, _Map_size as _Map_size2, _Map_values as _Map_values3, _Option_flatMap as _Option_flatMap3, _Option_isSome as _Option_isSome5, _Option_map as _Option_map3, _Option_unwrapOr as _Option_unwrapOr12, _Set_add as _Set_add8, _Set_fromArray as _Set_fromArray8, _Set_has as _Set_has7, _Str_contains as _Str_contains3, _Str_fromCode as _Str_fromCode3, _Str_join as _Str_join8, _Str_split as _Str_split6, _Str_startsWith as _Str_startsWith6, _curry as _curry20, _tuple as _tuple11, and as and14, concat as concat2, eq as eq16, filter as filter8, length as length16, map as map12, or as or11, reduce as reduce6, show as show9 } from "@mochi/compiler/runtime";

import { None as None18, Some as Some18, _Array_append as _Array_append14, _Array_concat as _Array_concat9, _Array_get as _Array_get17, _Array_prepend as _Array_prepend8, _Array_sort, _Map_delete as _Map_delete2, _Map_get as _Map_get8, _Map_has as _Map_has6, _Map_keys as _Map_keys8, _Map_set as _Map_set7, _Map_size, _Option_flatMap as _Option_flatMap2, _Option_map as _Option_map2, _Option_unwrapOr as _Option_unwrapOr11, _Set_add as _Set_add7, _Set_fromArray as _Set_fromArray7, _Set_has as _Set_has6, _Str_codeAt as _Str_codeAt8, _Str_contains as _Str_contains2, _Str_fromCode as _Str_fromCode2, _Str_get as _Str_get4, _Str_join as _Str_join7, _Str_length as _Str_length7, _Str_slice as _Str_slice4, _Str_startsWith as _Str_startsWith5, _Str_trim, _curry as _curry19, _tuple as _tuple10, and as and13, eq as eq15, filter as filter7, length as length15, map as map11, or as or10, show as show8 } from "@mochi/compiler/runtime";
var tsEnv = _curry19(2, (vars, recs) => ({ vars, recs }));
var noVars = new Map;
var noRecs = new Map;
var plainEnv = (vars) => tsEnv(vars, noRecs);
var recsEnv = (recs) => tsEnv(noVars, recs);
var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var letterAt = (i) => _Option_unwrapOr11(`T${show8(i)}`, _Str_get4(i, letters));
var genericNames = (sc) => genericNamesFrom(_Array_concat9(sc.vars, sc.rvars), 0, new Map);
var genericNamesFrom = _curry19(3, (ids, i, names) => ((_v) => _v._tag === "None" ? names : _v._tag === "Some" ? (({ value: id }) => genericNamesFrom(ids, i + 1, _Map_set7(id, letterAt(i), names)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get17(i, ids)));
var primitiveTs = (name) => ((_v) => _v === "number" ? "number" : _v === "int" ? "number" : _v === "float" ? "number" : _v === "string" ? "string" : _v === "bool" ? "boolean" : _v === "unit" ? "undefined" : name)(name);
var namesOf = _curry19(2, (ts, env) => _Str_join7(", ", map11((t) => tsOfRaw(t, env), ts)));
var qualifiedCon = _curry19(2, (name, env) => ((_v) => _v._tag === "Some" && (({ value: qual }) => _Str_contains2(".", qual))(_v) ? (({ value: qual }) => qual)(_v) : primitiveTs(name))(_Map_get8(name, env.recs)));
var nominal = _curry19(3, (name, args, env) => {
  const shown = qualifiedCon(name, env);
  return length15(args) === 0 ? shown : `${shown}<${namesOf(args, env)}>`;
});
var tsRowFields = _curry19(2, (row, env) => ((_v) => _v._tag === "RowEmpty" ? _tuple10([], None18) : _v._tag === "RowVar" ? (({ id }) => _tuple10([], Some18(id)))(_v) : _v._tag === "RowExtend" ? (({ label, fieldType, optional, rest }) => (([fields, tail]) => _tuple10(_Array_prepend8(`${label}${optional ? "?" : ""}: ${tsOfRaw(fieldType, env)}`, fields), tail))(tsRowFields(rest, env)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(row));
var shapeFieldsFrom = _curry19(2, (row, vars) => ((_v) => _v._tag === "RowEmpty" ? Some18([]) : _v._tag === "RowVar" ? None18 : _v._tag === "RowExtend" ? (({ label, fieldType, optional, rest }) => _Option_map2((fs) => _Array_prepend8(`${label}${optional ? "?" : ""}: ${shapeType(fieldType, vars)}`, fs), shapeFieldsFrom(rest, vars)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(row));
var shapeJoined = _curry19(2, (ts, vars) => _Str_join7(", ", map11((t) => shapeType(t, vars), ts)));
var shapeType = _curry19(2, (t, vars) => ((_v) => _v._tag === "TyRecord" ? (({ row }) => ((_v) => _v._tag === "None" ? tsOf(t, plainEnv(vars)) : _v._tag === "Some" ? (({ value: fs }) => length15(fs) === 0 ? "{}" : `{ ${_Str_join7("; ", _Array_sort(fs))} }`)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(shapeFieldsFrom(row, vars)))(_v) : _v._tag === "TyCon" && _v.name === "Array" && _v.args.length === 1 ? (({ args: [elem] }) => ((inner) => ((_v) => _v._tag === "TyCon" && _v.name === "Task" && _v.args.length === 2 ? `(${inner})[]` : _v._tag === "TyFn" ? `(${inner})[]` : _v._tag === "TyOneOf" ? `(${inner})[]` : `${inner}[]`)(widenLits(elem)))(shapeType(elem, vars)))(_v) : _v._tag === "TyCon" && _v.name === "List" && _v.args.length === 1 ? (({ args: [elem] }) => `Iterable<${shapeType(elem, vars)}>`)(_v) : _v._tag === "TyCon" && _v.name === "Task" && _v.args.length === 2 ? (({ args: [value, error] }) => `() => Promise<Result<${shapeType(value, vars)}, ${shapeType(error, vars)}>>`)(_v) : _v._tag === "TyCon" && _v.name === "tuple" ? (({ args: elems }) => `[${shapeJoined(elems, vars)}]`)(_v) : _v._tag === "TyCon" ? (({ name, args }) => length15(args) === 0 ? primitiveTs(name) : `${name}<${shapeJoined(args, vars)}>`)(_v) : _v._tag === "TyOneOf" ? (({ members }) => _Str_join7(" | ", map11((m) => ((_v) => _v._tag === "TySingleton" && _v.base === "string" ? (({ value }) => `"${value}"`)(_v) : _v._tag === "TySingleton" ? (({ value }) => value)(_v) : shapeType(m, vars))(m), members)))(_v) : tsOf(t, plainEnv(vars)))(widenLits(t)));
var rowShapeKey = _curry19(2, (row, vars) => _Option_map2((fs) => _Str_join7("; ", _Array_sort(fs)), shapeFieldsFrom(row, vars)));
var aliasNameFor = _curry19(2, (row, env) => _Map_size(env.recs) === 0 ? None18 : _Option_flatMap2((k) => ((_v) => _v._tag === "Some" && _v.value === "" ? None18 : _v._tag === "Some" ? (({ value: name }) => Some18(name))(_v) : _v._tag === "None" ? None18 : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get8(k, env.recs)), rowShapeKey(row, env.vars)));
var rowAliasName = _curry19(2, (row, recs) => aliasNameFor(row, recsEnv(recs)));
var tsRow = _curry19(2, (row, env) => ((_v) => _v._tag === "Some" ? (({ value: alias }) => alias)(_v) : _v._tag === "None" ? (([fields, tail]) => {
  const body = length15(fields) === 0 ? "{}" : `{ ${_Str_join7("; ", fields)} }`;
  return ((_v) => _v._tag === "None" ? body : _v._tag === "Some" ? (({ value: id }) => ((_v) => _v._tag === "None" ? body : _v._tag === "Some" ? (({ value: name }) => length15(fields) === 0 ? name : `(${body} & ${name})`)(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(_Map_get8(id, env.vars)))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(tail);
})(tsRowFields(row, env)) : (() => {
  throw new Error("non-exhaustive match");
})())(aliasNameFor(row, env)));
var tsReturn = _curry19(2, (t, env) => isUnit(t) ? "void" : tsOfRaw(t, env));
var tsArrow = _curry19(3, (fromT, toT, env) => isUnit(fromT) ? `() => ${tsReturn(toT, env)}` : tsArrowParams(fromT, toT, env, 0, []));
var tsArrowParams = _curry19(5, (fromT, toT, env, i, params) => {
  const params1 = _Array_append14(`${_Str_fromCode2(97 + i)}: ${tsOfRaw(fromT, env)}`, params);
  return ((_v) => _v._tag === "TyFn" && (({ from: nextFrom, to: nextTo }) => !isUnit(nextFrom))(_v) ? (({ from: nextFrom, to: nextTo }) => tsArrowParams(nextFrom, nextTo, env, i + 1, params1))(_v) : `(${_Str_join7(", ", params1)}) => ${tsReturn(toT, env)}`)(toT);
});
var tsOf = _curry19(2, (t, env) => tsOfRaw(widenLits(t), env));
var tsOfRaw = _curry19(2, (t, env) => ((_v) => _v._tag === "TyVar" ? (({ id }) => _Option_unwrapOr11("unknown", _Map_get8(id, env.vars)))(_v) : _v._tag === "TyCon" && _v.name === "Array" && _v.args.length === 1 ? (({ args: [elem] }) => ((inner) => ((_v) => _v._tag === "TyCon" && _v.name === "Task" && _v.args.length === 2 ? `(${inner})[]` : _v._tag === "TyFn" ? `(${inner})[]` : _v._tag === "TyOneOf" ? `(${inner})[]` : `${inner}[]`)(elem))(tsOfRaw(elem, env)))(_v) : _v._tag === "TyCon" && _v.name === "List" && _v.args.length === 1 ? (({ args: [elem] }) => `Iterable<${tsOfRaw(elem, env)}>`)(_v) : _v._tag === "TyCon" && _v.name === "Task" && _v.args.length === 2 ? (({ args: [value, error] }) => `() => Promise<Result<${tsOfRaw(value, env)}, ${tsOfRaw(error, env)}>>`)(_v) : _v._tag === "TyCon" && _v.name === "tuple" ? (({ args: elems }) => `[${namesOf(elems, env)}]`)(_v) : _v._tag === "TyCon" ? (({ name, args }) => nominal(name, args, env))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => tsArrow(fromT, toT, env))(_v) : _v._tag === "TyRecord" ? (({ row }) => tsRow(row, env))(_v) : _v._tag === "TySingleton" && _v.base === "string" ? (({ value }) => `"${value}"`)(_v) : _v._tag === "TySingleton" ? (({ value }) => value)(_v) : _v._tag === "TyOneOf" ? (({ members }) => _Str_join7(" | ", map11((m) => tsOfRaw(m, env), members)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(t));
var isDigitChar = (ch) => ((_v) => _v._tag === "Some" ? (({ value: n }) => and13(n >= 48, n <= 57))(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_codeAt8(0, ch));
var isUpperChar = (ch) => ((_v) => _v._tag === "Some" ? (({ value: n }) => and13(n >= 65, n <= 90))(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_codeAt8(0, ch));
var allDigitsFrom = _curry19(2, (s, i) => i >= _Str_length7(s) ? i > 1 : and13(isDigitChar(_Str_slice4(i, i + 1, s)), allDigitsFrom(s, i + 1)));
var isTypeLetter = (s) => _Str_length7(s) === 1 ? isUpperChar(s) : and13(and13(_Str_length7(s) > 1, _Str_slice4(0, 1, s) === "T"), allDigitsFrom(s, 1));
var depthStep = _curry19(3, (s, i, depth) => {
  const ch = _Str_slice4(i, i + 1, s);
  return or10(or10(or10(ch === "<", ch === "{"), ch === "("), ch === "[") ? depth + 1 : or10(or10(ch === "}", ch === ")"), ch === "]") ? depth - 1 : and13(ch === ">", or10(i === 0, _Str_slice4(i - 1, i, s) !== "=")) ? depth - 1 : depth;
});
var hasSuffix = _curry19(2, (suf, s) => {
  const n = _Str_length7(suf);
  const m = _Str_length7(s);
  return and13(m >= n, eq15(_Str_slice4(m - n, m, s), suf));
});
var splitTop = _curry19(2, (sep, s) => splitTopAt(sep, s, 0, 0, 0, []));
var splitTopAt = _curry19(6, (sep, s, i, depth, start, acc) => i >= _Str_length7(s) ? _Array_append14(_Str_slice4(start, _Str_length7(s), s), acc) : ((n) => and13(and13(depth === 0, i + n <= _Str_length7(s)), eq15(_Str_slice4(i, i + n, s), sep)) ? splitTopAt(sep, s, i + n, 0, i + n, _Array_append14(_Str_slice4(start, i, s), acc)) : splitTopAt(sep, s, i + 1, depthStep(s, i, depth), start, acc))(_Str_length7(sep)));
var findTop = _curry19(4, (ch, s, i, depth) => i >= _Str_length7(s) ? None18 : and13(depth === 0, eq15(_Str_slice4(i, i + 1, s), ch)) ? Some18(i) : findTop(ch, s, i + 1, depthStep(s, i, depth)));
var bindLetter = _curry19(3, (letter, concrete, subst) => ((_v) => _v._tag === "None" ? Some18(_Map_set7(letter, concrete, subst)) : _v._tag === "Some" ? (({ value: prev }) => eq15(prev, concrete) ? Some18(subst) : None18)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get8(letter, subst)));
var agreeList = _curry19(4, (useTs, aliasTs, subst, i) => !eq15(length15(useTs), length15(aliasTs)) ? None18 : i >= length15(useTs) ? Some18(subst) : ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: u }) => ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: a }) => ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: subst1 }) => agreeList(useTs, aliasTs, subst1, i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(typesAgree(u, a, subst)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get17(i, aliasTs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get17(i, useTs)));
var peelApp = (s) => ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: i }) => and13(hasSuffix(">", s), i > 0) ? Some18({ name: _Str_slice4(0, i, s), args: _Str_slice4(i + 1, _Str_length7(s) - 1, s) }) : None18)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(findTop("<", s, 0, 0));
var wrapped = _curry19(3, (open, close, s) => and13(and13(_Str_startsWith5(open, s), hasSuffix(close, s)), _Str_length7(s) >= 2));
var innerOf = (s) => _Str_slice4(1, _Str_length7(s) - 1, s);
var stripParens = (s) => wrapped("(", ")", s) ? _Str_slice4(1, _Str_length7(s) - 1, s) : s;
var agreeArray = _curry19(3, (useT, aliasT, subst) => and13(hasSuffix("[]", useT), hasSuffix("[]", aliasT)) ? typesAgree(stripParens(_Str_slice4(0, _Str_length7(useT) - 2, useT)), stripParens(_Str_slice4(0, _Str_length7(aliasT) - 2, aliasT)), subst) : None18);
var agreeApp = _curry19(3, (useT, aliasT, subst) => ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: u }) => ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: a }) => eq15(u.name, a.name) ? agreeList(splitTop(", ", u.args), splitTop(", ", a.args), subst, 0) : None18)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(peelApp(aliasT)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(peelApp(useT)));
var splitLabel = (s) => ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: i }) => Some18({ label: _Str_slice4(0, i, s), ty: _Str_slice4(i + 1, _Str_length7(s), s) }))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(findTop(":", s, 0, 0));
var fieldAgree = _curry19(3, (useF, aliasF, subst) => ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: u }) => ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: a }) => eq15(_Str_trim(u.label), _Str_trim(a.label)) ? typesAgree(_Str_trim(u.ty), _Str_trim(a.ty), subst) : None18)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(splitLabel(aliasF)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(splitLabel(useF)));
var fieldsAgree = _curry19(3, (useFs, aliasFs, subst) => agreeFields(useFs, aliasFs, subst, 0));
var agreeFields = _curry19(4, (useFs, aliasFs, subst, i) => !eq15(length15(useFs), length15(aliasFs)) ? None18 : i >= length15(useFs) ? Some18(subst) : ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: u }) => ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: a }) => ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: subst1 }) => agreeFields(useFs, aliasFs, subst1, i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fieldAgree(u, a, subst)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get17(i, aliasFs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get17(i, useFs)));
var agreeBrace = _curry19(3, (useT, aliasT, subst) => and13(wrapped("{", "}", useT), wrapped("{", "}", aliasT)) ? fieldsAgree(splitTop("; ", innerOf(useT)), splitTop("; ", innerOf(aliasT)), subst) : None18);
var agreeTuple = _curry19(3, (useT, aliasT, subst) => and13(wrapped("[", "]", useT), wrapped("[", "]", aliasT)) ? agreeList(splitTop(", ", innerOf(useT)), splitTop(", ", innerOf(aliasT)), subst, 0) : None18);
var agreeUnion = _curry19(3, (useT, aliasT, subst) => {
  const us = splitTop(" | ", useT);
  const als = splitTop(" | ", aliasT);
  return and13(length15(us) > 1, eq15(length15(us), length15(als))) ? agreeList(us, als, subst, 0) : None18;
});
var firstSome2 = _curry19(2, (a, b) => ((_v) => _v._tag === "Some" ? a : _v._tag === "None" ? b : (() => {
  throw new Error("non-exhaustive match");
})())(a));
var typesAgree = _curry19(3, (useT, aliasT, subst) => eq15(useT, aliasT) ? Some18(subst) : isTypeLetter(useT) ? bindLetter(useT, aliasT, subst) : firstSome2(agreeArray(useT, aliasT, subst), firstSome2(agreeApp(useT, aliasT, subst), firstSome2(agreeBrace(useT, aliasT, subst), firstSome2(agreeTuple(useT, aliasT, subst), agreeUnion(useT, aliasT, subst))))));
var uniqueSubst = _curry19(4, (useKey, keys, i, found) => ((_v) => _v._tag === "None" ? found : _v._tag === "Some" ? (({ value: k }) => ((_v) => _v._tag === "None" ? uniqueSubst(useKey, keys, i + 1, found) : _v._tag === "Some" ? (({ value: subst }) => ((_v) => _v._tag === "None" ? uniqueSubst(useKey, keys, i + 1, Some18(subst)) : _v._tag === "Some" ? uniqueSubst(useKey, keys, i + 1, Some18(new Map([["*", ""]]))) : (() => {
  throw new Error("non-exhaustive match");
})())(found))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(fieldsAgree(splitTop("; ", useKey), splitTop("; ", k), new Map)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get17(i, keys)));
var substOf = _curry19(2, (useKey, env) => ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: subst }) => _Map_has6("*", subst) ? None18 : Some18(subst))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(uniqueSubst(useKey, _Map_keys8(env.recs), 0, None18)));
var idForLetter = _curry19(4, (letter, ids, vars, i) => ((_v) => _v._tag === "None" ? None18 : _v._tag === "Some" ? (({ value: id }) => ((_v) => _v._tag === "Some" ? (({ value: name }) => eq15(name, letter) ? Some18(id) : idForLetter(letter, ids, vars, i + 1))(_v) : _v._tag === "None" ? idForLetter(letter, ids, vars, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get8(id, vars)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get17(i, ids)));
var notePin = _curry19(3, (id, concrete, st) => _Set_has6(id, st.bad) ? st : ((_v) => _v._tag === "None" ? { pins: _Map_set7(id, concrete, st.pins), bad: st.bad } : _v._tag === "Some" ? (({ value: prev }) => eq15(prev, concrete) ? st : { pins: _Map_delete2(id, st.pins), bad: _Set_add7(id, st.bad) })(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get8(id, st.pins)));
var mergeSubst = _curry19(6, (letters, subst, vars, ids, st, i) => ((_v) => _v._tag === "None" ? st : _v._tag === "Some" ? (({ value: letter }) => ((_v) => _v._tag === "None" ? mergeSubst(letters, subst, vars, ids, st, i + 1) : _v._tag === "Some" ? (({ value: concrete }) => ((_v) => _v._tag === "None" ? mergeSubst(letters, subst, vars, ids, st, i + 1) : _v._tag === "Some" ? (({ value: id }) => mergeSubst(letters, subst, vars, ids, notePin(id, concrete, st), i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(idForLetter(letter, ids, vars, 0)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get8(letter, subst)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get17(i, letters)));
var emptyPins = { pins: new Map([]), bad: _Set_fromArray7([]) };
var considerClosed = _curry19(3, (row, env, st) => ((_v) => _v._tag === "None" ? st : _v._tag === "Some" ? (({ value: key }) => ((_v) => _v._tag === "Some" ? st : _v._tag === "None" ? ((_v) => _v._tag === "None" ? st : _v._tag === "Some" ? (({ value: subst }) => mergeSubst(_Map_keys8(subst), subst, env.vars, _Map_keys8(env.vars), st, 0))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(substOf(key, env)) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get8(key, env.recs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(rowShapeKey(row, env.vars)));
var pinInTys = _curry19(4, (ts, env, st, i) => ((_v) => _v._tag === "None" ? st : _v._tag === "Some" ? (({ value: t }) => pinInTys(ts, env, pinInTy(t, env, st), i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get17(i, ts)));
var pinInRow = _curry19(3, (row, env, st) => ((_v) => _v._tag === "RowExtend" ? (({ fieldType: ft, rest }) => pinInRow(rest, env, pinInTy(ft, env, st)))(_v) : st)(row));
var pinInTy = _curry19(3, (t, env, st) => ((_v) => _v._tag === "TyRecord" ? (({ row }) => pinInRow(row, env, considerClosed(row, env, st)))(_v) : _v._tag === "TyFn" ? (({ from: a, to: b }) => pinInTy(b, env, pinInTy(a, env, st)))(_v) : _v._tag === "TyCon" ? (({ args }) => pinInTys(args, env, st, 0))(_v) : _v._tag === "TyOneOf" ? (({ members: ms }) => pinInTys(ms, env, st, 0))(_v) : st)(t));
var pinAliasVars = _curry19(2, (t, env) => pinInTy(t, env, emptyPins).pins);
var overlayPins = _curry19(4, (ids, pins, names, i) => ((_v) => _v._tag === "None" ? names : _v._tag === "Some" ? (({ value: id }) => ((_v) => _v._tag === "Some" ? (({ value: concrete }) => overlayPins(ids, pins, _Map_set7(id, concrete, names), i + 1))(_v) : _v._tag === "None" ? overlayPins(ids, pins, names, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get8(id, pins)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get17(i, ids)));
var headLetters = _curry19(2, (names, pins) => {
  const letters = map11((id) => _Option_unwrapOr11("", _Map_get8(id, names)), filter7((id) => !_Map_has6(id, pins), _Map_keys8(names)));
  return length15(letters) === 0 ? "" : `<${_Str_join7(", ", letters)}>`;
});
var schemeRender = _curry19(2, (sc, recs) => {
  const names = genericNames(sc);
  const pins = pinAliasVars(sc.ty, tsEnv(names, recs));
  return { env: tsEnv(overlayPins(_Map_keys8(pins), pins, names, 0), recs), head: headLetters(names, pins), pins };
});

var paramVarsFrom = _curry20(2, (params, i) => ((_v) => _v._tag === "None" ? new Map : _v._tag === "Some" ? (({ value: p }) => _Map_set8(p, tVar(i), paramVarsFrom(params, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, params)));
var paramNamesFrom = _curry20(2, (params, i) => ((_v) => _v._tag === "None" ? new Map : _v._tag === "Some" ? _Map_set8(i, letterAt(i), paramNamesFrom(params, i + 1)) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, params)));
var genericHead = _curry20(3, (params, i, acc) => ((_v) => _v._tag === "None" ? length16(acc) === 0 ? "" : `<${_Str_join8(", ", acc)}>` : _v._tag === "Some" ? genericHead(params, i + 1, _Array_append15(letterAt(i), acc)) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, params)));
var fieldTs = _curry20(4, (te, params, aliases, recs) => {
  const vars = paramVarsFrom(params, 0);
  const names = paramNamesFrom(params, 0);
  return (([t, _vars, _st]) => tsOf(t, tsEnv(names, recs)))(typeExprToType(te, vars, mkSt(length16(params)), aliases, _Set_fromArray8([])));
});
var ctorFieldsFrom = _curry20(6, (fields, keys, params, aliases, recs, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: fld }) => _Array_prepend9(`${_Option_unwrapOr12(`_${show9(i)}`, _Array_get18(i, keys))}: ${fieldTs(fld.fieldType, params, aliases, recs)}`, ctorFieldsFrom(fields, keys, params, aliases, recs, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, fields)));
var ctorVariant = _curry20(4, (c, params, aliases, recs) => {
  const fields = ctorFieldsFrom(c.fields, keysOf(c.fields), params, aliases, recs, 0);
  return length16(fields) === 0 ? `{ _tag: "${c.name}" }` : `{ _tag: "${c.name}"; ${_Str_join8("; ", fields)} }`;
});
var ctorVariantsFrom = _curry20(5, (ctors, params, aliases, recs, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: c }) => _Array_prepend9(`  | ${ctorVariant(c, params, aliases, recs)}`, ctorVariantsFrom(ctors, params, aliases, recs, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, ctors)));
var typeDecl = _curry20(5, (name, params, ctors, aliases, recs) => {
  const head = `${name}${genericHead(params, 0, [])}`;
  return `export type ${head} =
${_Str_join8(`
`, ctorVariantsFrom(ctors, params, aliases, recs, 0))};`;
});
var aliasFieldsFrom2 = _curry20(5, (fields, params, aliases, recs, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: f }) => _Array_prepend9(`${f.name}${f.optional ? "?" : ""}: ${fieldTs(f.fieldType, params, aliases, recs)}`, aliasFieldsFrom2(fields, params, aliases, recs, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, fields)));
var recordAliasDecl = _curry20(5, (name, params, fields, aliases, recs) => {
  const head = `${name}${genericHead(params, 0, [])}`;
  const body = aliasFieldsFrom2(fields, params, aliases, recs, 0);
  return length16(body) === 0 ? `export type ${head} = {};` : `export type ${head} = { ${_Str_join8("; ", body)} };`;
});
var aliasTsDecl = _curry20(5, (name, params, template, aliases, recs) => {
  const head = `${name}${genericHead(params, 0, [])}`;
  return `export type ${head} = ${fieldTs(template, params, aliases, recs)};`;
});
var opaqueTypeDecl = (name) => `declare const ${name}: unique symbol;
export type ${name} = { readonly [${name}]: never };`;
var mergeInto = _curry20(4, (keys, src, acc, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: k }) => mergeInto(keys, src, ((_v) => _v._tag === "Some" ? (({ value: v }) => _Map_set8(k, v, acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get9(k, src)), i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, keys)));
var unionNamesFrom = _curry20(3, (schemes, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: sc }) => ((names) => unionNamesFrom(schemes, i + 1, mergeInto(_Map_keys9(names), names, acc, 0)))(genericNames(sc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, schemes)));
var allVarsIn = _curry20(2, (t, names) => ((_v) => _v._tag === "TyVar" ? (({ id }) => _Option_isSome5(_Map_get9(id, names)))(_v) : _v._tag === "TyCon" ? (({ args }) => allVarsInAll(args, names, 0))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => and14(allVarsIn(fromT, names), allVarsIn(toT, names)))(_v) : _v._tag === "TyRecord" ? (({ row }) => allVarsInRow(row, names))(_v) : _v._tag === "TySingleton" ? true : _v._tag === "TyOneOf" ? (({ members }) => allVarsInAll(members, names, 0))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(t));
var allVarsInAll = _curry20(3, (ts, names, i) => ((_v) => _v._tag === "None" ? true : _v._tag === "Some" ? (({ value: t }) => and14(allVarsIn(t, names), allVarsInAll(ts, names, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, ts)));
var allVarsInRow = _curry20(2, (row, names) => ((_v) => _v._tag === "RowEmpty" ? true : _v._tag === "RowVar" ? (({ id }) => _Option_isSome5(_Map_get9(id, names)))(_v) : _v._tag === "RowExtend" ? (({ fieldType, rest }) => and14(allVarsIn(fieldType, names), allVarsInRow(rest, names)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(row));
var isConcrete2 = (t) => allVarsIn(t, new Map([]));
var emptyCollTs = _curry20(2, (t, env) => allVarsIn(t, env.vars) ? Some19(tsOf(t, env)) : None19);
var ctorCallTs = _curry20(2, (t, recs) => ((_v) => _v._tag === "TyCon" ? (({ args }) => or11(length16(args) === 0, !isConcrete2(t)) ? None19 : Some19(tsOf(t, recsEnv(recs))))(_v) : None19)(t));
var guardParamTs = _curry20(2, (t, recs) => isConcrete2(t) ? Some19(tsOf(t, recsEnv(recs))) : None19);
var lambdaParamsFrom = _curry20(4, (t, arity, env, i) => i >= arity ? [] : ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => _Array_prepend9(allVarsIn(fromT, env.vars) ? Some19(tsOf(fromT, env)) : isConcrete2(fromT) ? Some19(tsOf(fromT, recsEnv(env.recs))) : None19, lambdaParamsFrom(toT, arity, env, i + 1)))(_v) : _Array_prepend9(None19, lambdaParamsFrom(t, arity, env, i + 1)))(t));
var lambdaParamTypesTs = _curry20(3, (lamType, arity, env) => lambdaParamsFrom(lamType, arity, env, 0));
var genericParamsFrom = _curry20(4, (t, arity, env, i) => i >= arity ? [] : ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => _Array_prepend9(Some19(tsOf(fromT, env)), genericParamsFrom(toT, arity, env, i + 1)))(_v) : _Array_prepend9(None19, genericParamsFrom(t, arity, env, i + 1)))(t));
var genericLambdaParams = _curry20(3, (sc, arity, recs) => _Map_size2(genericNames(sc)) === 0 ? None19 : ((rendered) => Some19({ generics: rendered.head, params: genericParamsFrom(sc.ty, arity, rendered.env, 0) }))(schemeRender(sc, recs)));
var neverArgs = _curry20(3, (params, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? neverArgs(params, i + 1, _Array_append15("never", acc)) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, params)));
var ctorParamTypes = _curry20(5, (fields, params, aliases, recs, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: fld }) => _Array_prepend9(fieldTs(fld.fieldType, params, aliases, recs), ctorParamTypes(fields, params, aliases, recs, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, fields)));
var ctorFactoryTs = _curry20(5, (typeName, params, c, aliases, recs) => {
  const head = genericHead(params, 0, []);
  const monos = neverArgs(params, 0, []);
  return { generics: head, paramTypes: ctorParamTypes(c.fields, params, aliases, recs, 0), ret: `${typeName}${head}`, retMono: length16(monos) === 0 ? typeName : `${typeName}<${_Str_join8(", ", monos)}>` };
});
var paramDeclName = _curry20(2, (p, i) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => paramDeclName(inner, i))(_v) : _v._tag === "LPName" ? (({ name }) => name)(_v) : _v._tag === "LPLabeled" ? "$lab" : `_${show9(i)}`)(p));
var compositions = (n) => n === 0 ? [[]] : compositionsFrom(n, 1);
var compositionsFrom = _curry20(2, (n, k) => k > n ? [] : _Array_concat10(map12(_Array_prepend9(k), compositions(n - k)), compositionsFrom(n, k + 1)));
var sliceGroups = _curry20(4, (params, groups, i, at) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: g }) => _Array_prepend9(_Array_take4(g, _Array_drop3(at, params)), sliceGroups(params, groups, i + 1, at + g)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, groups)));
var curriedTail = _curry20(3, (slices, i, acc) => i < 1 ? acc : curriedTail(slices, i - 1, `(${_Str_join8(", ", _Option_unwrapOr12([], _Array_get18(i, slices)))}) => ${acc}`));
var overloadSig = _curry20(4, (head, params, ret, groups) => {
  const slices = sliceGroups(params, groups, 0, 0);
  const tail = curriedTail(slices, length16(slices) - 1, ret);
  return `${head}(${_Str_join8(", ", _Option_unwrapOr12([], _Array_get18(0, slices)))}): ${tail};`;
});
var curriedOverloads = _curry20(3, (head, params, ret) => length16(params) <= 1 ? `${head}(${_Str_join8(", ", params)}) => ${ret}` : `{ ${_Str_join8(" ", map12(overloadSig(head, params, ret), _Array_sortBy((g) => 0 - length16(g), compositions(length16(params)))))} }`);
var curriedFnType = _curry20(2, (params, ret) => length16(params) <= 1 ? `(${_Str_join8(", ", params)}) => ${ret}` : `_Curry<[${_Str_join8(", ", params)}], ${ret}>`);
var flatParamsFrom = _curry20(5, (t, value, env, n, acc) => ((_v) => _v._tag === "ELambda" ? (({ params, body }) => length16(params) === 0 ? ((next) => flatParamsFrom(next, body, env, n, acc))(((_v) => _v._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_v) ? (({ from: fromT, to: toT }) => toT)(_v) : t)(t)) : (([t1, n1, acc1]) => flatParamsFrom(t1, body, env, n1, acc1))(takeParams(t, params, env, 0, n, acc)))(_v) : _tuple11(acc, tsOf(t, env)))(value));
var takeParams = _curry20(6, (t, params, env, i, n, acc) => ((_v) => _v._tag === "None" ? _tuple11(t, n, acc) : _v._tag === "Some" ? (({ value: p }) => ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => takeParams(toT, params, env, i + 1, n + 1, _Array_append15(`${paramDeclName(p, n)}: ${tsOf(fromT, env)}`, acc)))(_v) : _tuple11(t, n, acc))(t))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, params)));
var declType = _curry20(3, (t, value, env) => ((_v) => _v._tag === "ELambda" ? (({ params, body }) => length16(params) === 0 ? ((next) => `() => ${declType(next, body, env)}`)(((_v) => _v._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_v) ? (({ from: fromT, to: toT }) => toT)(_v) : t)(t)) : (([t1, _n, ps]) => `(${_Str_join8(", ", ps)}) => ${declType(t1, body, env)}`)(takeParams(t, params, env, 0, 0, [])))(_v) : tsOf(t, env))(value));
var tsApiFor = (recs) => ({ tsType: (t) => tsOf(t, recsEnv(recs)), aliasOf: (row) => rowAliasName(row, recs) });
var bindingTsType = _curry20(4, (sc, value, recs, bindingHooks) => ((_v) => _v._tag === "Some" ? (({ value: ts }) => ts)(_v) : _v._tag === "None" ? coreBindingTsType(sc, value, recs) : (() => {
  throw new Error("non-exhaustive match");
})())(runBindingHooks(bindingHooks, value, sc.ty, tsApiFor(recs))));
var coreBindingTsType = _curry20(3, (sc, value, recs) => {
  const rendered = schemeRender(sc, recs);
  return ((_v) => _v._tag === "ELambda" ? rendered.head === "" ? (([params, ret]) => curriedFnType(params, ret))(flatParamsFrom(sc.ty, value, rendered.env, 0, [])) : `${rendered.head}${declType(sc.ty, value, rendered.env)}` : tsOf(sc.ty, tsEnv(rendered.pins, recs)))(value);
});
var spanKey = (sp) => `${show9(sp.start)}:${show9(sp.end)}`;
var typeAtFrom = _curry20(3, (types, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: r }) => typeAtFrom(types, i + 1, _Map_set8(spanKey(r.span), r.ty, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, types)));
var typeAtTable = (types) => typeAtFrom(types, 0, new Map);
var consInTy = _curry20(2, (t, acc) => ((_v) => _v._tag === "TyCon" && _v.name === "Task" && _v.args.length === 2 ? (({ args: [value, error] }) => consInTy(error, consInTy(value, _Set_add8("Result", _Set_add8("Task", acc)))))(_v) : _v._tag === "TyCon" ? (({ name, args }) => consInAll(args, _Set_add8(name, acc), 0))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => consInTy(toT, consInTy(fromT, acc)))(_v) : _v._tag === "TyRecord" ? (({ row }) => consInRow(row, acc))(_v) : _v._tag === "TyOneOf" ? (({ members }) => consInAll(members, acc, 0))(_v) : acc)(t));
var consInAll = _curry20(3, (ts, acc, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: t }) => consInAll(ts, consInTy(t, acc), i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, ts)));
var consInRow = _curry20(2, (row, acc) => ((_v) => _v._tag === "RowExtend" ? (({ fieldType, rest }) => consInRow(rest, consInTy(fieldType, acc)))(_v) : acc)(row));
var declaredTypeNames = _curry20(3, (stmts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { name } }) => declaredTypeNames(stmts, i + 1, _Set_add8(name, acc)))(_v) : _v._tag === "Some" ? declaredTypeNames(stmts, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, stmts)));
var nullaryLocalNames = _curry20(3, (stmts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.alias._tag === "Some" ? (({ value: { name, params, alias: { value: fields } } }) => nullaryLocalNames(stmts, i + 1, and14(length16(params) === 0, length16(fields) > 0) ? _Set_add8(name, acc) : acc))(_v) : _v._tag === "Some" ? nullaryLocalNames(stmts, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, stmts)));
var referencedCons = _curry20(4, (stmts, env, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { name } }) => referencedCons(stmts, env, i + 1, _Str_startsWith6("$", name) ? acc : ((_v) => _v._tag === "Some" ? (({ value: sc }) => consInTy(sc.ty, acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get9(name, env))))(_v) : _v._tag === "Some" ? referencedCons(stmts, env, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, stmts)));
var builtinTypeNamesFor = _curry20(4, (declared, wanted, body, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: bt }) => ((rest) => and14(!_Set_has7(bt.name, declared), or11(_Set_has7(bt.name, wanted), _Str_contains3(bt.name, body))) ? _Array_prepend9(bt.name, rest) : rest)(builtinTypeNamesFor(declared, wanted, body, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, builtinTypeDecls)));
var aliasRowOf = _curry20(3, (fields, aliases, i) => ((_v) => _v._tag === "None" ? RowEmpty : _v._tag === "Some" ? (({ value: f }) => (([t, _vars, _st]) => RowExtend(f.name, t, f.optional, aliasRowOf(fields, aliases, i + 1)))(typeExprToType(f.fieldType, new Map, mkSt(0), aliases, _Set_fromArray8([]))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, fields)));
var aliasShapeKey = _curry20(2, (fields, aliases) => rowShapeKey(aliasRowOf(fields, aliases, 0), new Map));
var bareName = (name) => {
  const parts = _Str_split6(".", name);
  return _Option_unwrapOr12(name, _Array_get18(length16(parts) - 1, parts));
};
var indexAlias = _curry20(4, (key, name, aliases, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: info }) => ((_v) => _v._tag === "Some" ? acc : _v._tag === "None" ? or11(length16(info.params) !== 0, length16(info.fields) === 0) ? acc : ((_v) => _v._tag === "Some" ? (({ value: k }) => _Map_set8(k, name, acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(aliasShapeKey(info.fields, aliases)) : (() => {
  throw new Error("non-exhaustive match");
})())(info.expr))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get9(key, aliases)));
var recordAliasIndexFrom = _curry20(4, (keys, aliases, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: key }) => recordAliasIndexFrom(keys, aliases, i + 1, indexAlias(key, bareName(key), aliases, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, keys)));
var recordAliasIndex = (aliases) => recordAliasIndexFrom(_Array_sort2(_Map_keys9(aliases)), aliases, 0, new Map);
var parameterizedBares = _curry20(4, (keys, aliases, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: key }) => ((_v) => _v._tag === "Some" ? (({ value: info }) => parameterizedBares(keys, aliases, i + 1, length16(info.params) > 0 ? _Set_add8(bareName(key), acc) : acc))(_v) : _v._tag === "None" ? parameterizedBares(keys, aliases, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get9(key, aliases)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, keys)));
var printableName = _curry20(6, (keys, shape, aliases, bad, acc, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: key }) => ((bare) => ((_v) => _v._tag === "None" ? printableName(keys, shape, aliases, bad, acc, i + 1) : _v._tag === "Some" ? (({ value: info }) => printableName(keys, shape, aliases, bad, ((_v) => _v._tag === "Some" ? acc : _v._tag === "None" ? or11(or11(_Set_has7(bare, bad), length16(info.params) !== 0), length16(info.fields) === 0) ? acc : ((_v) => _v._tag === "Some" ? (({ value: k }) => eq16(k, shape) ? bare : acc)(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(aliasShapeKey(info.fields, aliases)) : (() => {
  throw new Error("non-exhaustive match");
})())(info.expr), i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get9(key, aliases)))(bareName(key)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, keys)));
var dropAmbiguous = _curry20(7, (keys, recs, aliases, bad, localNames, aliasKeys, i) => ((_v) => _v._tag === "None" ? recs : _v._tag === "Some" ? (({ value: k }) => ((_v) => _v._tag === "Some" ? (({ value: name }) => dropAmbiguous(keys, and14(_Set_has7(name, bad), !_Set_has7(name, localNames)) ? _Map_set8(k, printableName(aliasKeys, k, aliases, bad, "", 0), recs) : recs, aliases, bad, localNames, aliasKeys, i + 1))(_v) : _v._tag === "None" ? dropAmbiguous(keys, recs, aliases, bad, localNames, aliasKeys, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get9(k, recs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, keys)));
var withoutAmbiguousAlias = _curry20(3, (recs, aliases, localNames) => {
  const aliasKeys = _Array_sort2(_Map_keys9(aliases));
  return dropAmbiguous(_Map_keys9(recs), recs, aliases, parameterizedBares(aliasKeys, aliases, 0, _Set_fromArray8([])), localNames, aliasKeys, 0);
});
var withoutOwnShape = _curry20(4, (fields, params, aliases, recs) => ((_v) => _v._tag === "Some" ? recs : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: k }) => _Map_delete3(k, recs))(_v) : _v._tag === "None" ? recs : (() => {
  throw new Error("non-exhaustive match");
})())(aliasShapeKey(fields, aliases)) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(0, params)));
var typeHeaderFrom = _curry20(5, (stmts, aliases, recs, docs, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { name, params, ctors, alias, aliasType, doc } }) => ((rest) => ((docComment) => ((_v) => _v._tag === "Some" ? (({ value: fields }) => _Array_prepend9(`${docComment}${recordAliasDecl(name, params, fields, aliases, withoutOwnShape(fields, params, aliases, recs))}`, rest))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: te }) => _Array_prepend9(`${docComment}${aliasTsDecl(name, params, te, aliases, recs)}`, rest))(_v) : _v._tag === "None" ? length16(ctors) === 0 ? _Array_prepend9(`declare const ${name}: unique symbol;
${docComment}type ${name} = { readonly [${name}]: never };`, rest) : _Array_prepend9(`${docComment}${typeDecl(name, params, ctors, aliases, recs)}`, rest) : (() => {
  throw new Error("non-exhaustive match");
})())(aliasType) : (() => {
  throw new Error("non-exhaustive match");
})())(alias))(docs ? jsDoc(doc) : ""))(typeHeaderFrom(stmts, aliases, recs, docs, i + 1)))(_v) : _v._tag === "Some" ? typeHeaderFrom(stmts, aliases, recs, docs, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, stmts)));
var genericLambdasFrom = _curry20(4, (stmts, env, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { name, value } }) => genericLambdasFrom(stmts, env, i + 1, ((_v) => _v._tag === "ELambda" && (({ span: sp }) => !_Str_startsWith6("$", name))(_v) ? (({ span: sp }) => ((_v) => _v._tag === "Some" ? (({ value: sc }) => or11(length16(sc.vars) > 0, length16(sc.rvars) > 0) ? _Map_set8(spanKey(sp), sc, acc) : acc)(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get9(name, env)))(_v) : acc)(value)))(_v) : _v._tag === "Some" ? genericLambdasFrom(stmts, env, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, stmts)));
var scopedSpans = (e) => ((_v) => _v._tag === "ELambda" ? (({ body, span: sp }) => _Array_prepend9(sp, scopedSpans(body)))(_v) : _v._tag === "ECall" ? (({ fn, args }) => _Array_concat10(scopedSpans(fn), scopedSpansAt(args, 0)))(_v) : _v._tag === "ELetIn" ? (({ value, body }) => _Array_concat10(scopedSpans(value), scopedSpans(body)))(_v) : _v._tag === "ELetBind" ? (({ value, body }) => _Array_concat10(scopedSpans(value), scopedSpans(body)))(_v) : _v._tag === "EPipe" ? (({ left, right }) => _Array_concat10(scopedSpans(left), scopedSpans(right)))(_v) : _v._tag === "EDo" ? (({ exprs }) => scopedSpansAt(exprs, 0))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => _Array_concat10(scopedSpans(cond), _Array_concat10(scopedSpans(thenE), scopedSpans(elseE))))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => _Array_concat10(scopedSpans(scrutinee), scopedSpansInArms(arms, 0)))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => _Array_concat10(scopedSpansInFields(fields, 0), ((_v) => _v._tag === "Some" ? (({ value: s }) => scopedSpans(s))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(spread)))(_v) : _v._tag === "EField" ? (({ target, name, span: sp }) => ((rest) => and14(name === "empty", isRefExpr(target)) ? _Array_prepend9(sp, rest) : rest)(scopedSpans(target)))(_v) : _v._tag === "ETuple" ? (({ elements }) => scopedSpansAt(elements, 0))(_v) : _v._tag === "EArr" ? (({ elements, span: sp }) => scopedSpansInSeq(elements, sp))(_v) : _v._tag === "EList" ? (({ elements, span: sp }) => scopedSpansInSeq(elements, sp))(_v) : _v._tag === "ESet" ? (({ elements, span: sp }) => scopedSpansInSeq(elements, sp))(_v) : _v._tag === "EMap" ? (({ entries, span: sp }) => ((inner) => length16(entries) === 0 ? _Array_prepend9(sp, inner) : inner)(scopedSpansInEntries(entries, 0)))(_v) : _v._tag === "ELoop" ? (({ params, body }) => _Array_concat10(scopedSpansInLoop(params, 0), scopedSpans(body)))(_v) : _v._tag === "ERecur" ? (({ args }) => scopedSpansAt(args, 0))(_v) : _v._tag === "EInterp" ? (({ parts }) => scopedSpansInParts(parts, 0))(_v) : [])(e);
var isRefExpr = (e) => ((_v) => _v._tag === "ERef" ? true : false)(e);
var scopedSpansAt = _curry20(2, (exprs, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: e }) => _Array_concat10(scopedSpans(e), scopedSpansAt(exprs, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, exprs)));
var scopedSpansInArms = _curry20(2, (arms, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: a }) => _Array_concat10(((_v) => _v._tag === "Some" ? (({ value: g }) => scopedSpans(g))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(a.guard), _Array_concat10(scopedSpans(a.body), scopedSpansInArms(arms, i + 1))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, arms)));
var scopedSpansInFields = _curry20(2, (fields, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: f }) => _Array_concat10(scopedSpans(f.value), scopedSpansInFields(fields, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, fields)));
var scopedSpansInEntries = _curry20(2, (entries, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: en }) => _Array_concat10(scopedSpans(en.key), _Array_concat10(scopedSpans(en.value), scopedSpansInEntries(entries, i + 1))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, entries)));
var scopedSpansInElems = _curry20(2, (elements, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" && _v.value._tag === "SEExpr" ? (({ value: { expr: e } }) => _Array_concat10(scopedSpans(e), scopedSpansInElems(elements, i + 1)))(_v) : _v._tag === "Some" && _v.value._tag === "SESpread" ? (({ value: { expr: e } }) => _Array_concat10(scopedSpans(e), scopedSpansInElems(elements, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, elements)));
var scopedSpansInSeq = _curry20(2, (elements, sp) => {
  const inner = scopedSpansInElems(elements, 0);
  return length16(elements) === 0 ? _Array_prepend9(sp, inner) : inner;
});
var scopedSpansInLoop = _curry20(2, (params, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: p }) => _Array_concat10(scopedSpans(p.init), scopedSpansInLoop(params, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, params)));
var scopedSpansInParts = _curry20(2, (parts, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" && _v.value._tag === "IPExpr" ? (({ value: { expr: e } }) => _Array_concat10(scopedSpans(e), scopedSpansInParts(parts, i + 1)))(_v) : _v._tag === "Some" ? scopedSpansInParts(parts, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, parts)));
var scopedNamesAt = _curry20(4, (spans, i, names, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: sp }) => scopedNamesAt(spans, i + 1, names, _Map_set8(spanKey(sp), names, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, spans)));
var scopedNamesFrom = _curry20(5, (stmts, env, recs, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { name, value } }) => scopedNamesFrom(stmts, env, recs, i + 1, ((_v) => _v._tag === "ELambda" && !_Str_startsWith6("$", name) ? ((_v) => _v._tag === "Some" ? (({ value: sc }) => or11(length16(sc.vars) > 0, length16(sc.rvars) > 0) ? scopedNamesAt(scopedSpans(value), 0, schemeRender(sc, recs).env.vars, acc) : acc)(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get9(name, env)) : acc)(value)))(_v) : _v._tag === "Some" ? scopedNamesFrom(stmts, env, recs, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, stmts)));
var tsGenOpts = _curry20(6, (stmts, env, types, letParams, aliases, bindingHooks) => {
  const typeAt = typeAtTable(types);
  const letParamAt = typeAtTable(letParams);
  const genericLams = genericLambdasFrom(stmts, env, 0, new Map);
  const recs = withoutAmbiguousAlias(recordAliasIndex(aliases), aliases, nullaryLocalNames(stmts, 0, _Set_fromArray8([])));
  const scopedNames = scopedNamesFrom(stmts, env, recs, 0, new Map);
  const typeOf = (e) => _Map_get9(spanKey(exprSpan3(e)), typeAt);
  const envAt = (key) => ((_v) => _v._tag === "Some" ? (({ value: vars }) => tsEnv(vars, recs))(_v) : _v._tag === "None" ? recsEnv(recs) : (() => {
    throw new Error("non-exhaustive match");
  })())(_Map_get9(key, scopedNames));
  return { ...jsGenOpts, annotateLet: Some19(_curry20(2, (name, value) => _Str_startsWith6("$", name) ? None19 : ((_v) => _v._tag === "ELambda" ? ((_v) => _v._tag === "Some" ? (({ value: sc }) => Some19(`: ${bindingTsType(sc, value, recs, bindingHooks)}`))(_v) : _v._tag === "None" ? None19 : (() => {
    throw new Error("non-exhaustive match");
  })())(_Map_get9(name, env)) : _Option_map3((ts) => `: ${ts}`, _Option_flatMap3((t) => emptyCollTs(t, recsEnv(recs)), _Map_get9(spanKey(exprSpan3(value)), letParamAt))))(value))), annotateCtor: Some19(_curry20(2, (s, c) => ((_v) => _v._tag === "SType" ? (({ name, params }) => Some19(ctorFactoryTs(name, params, c, aliases, recs)))(_v) : None19)(s))), annotateParams: Some19(_curry20(2, (sp, arity) => ((_v) => _v._tag === "Some" ? (({ value: sc }) => _Option_unwrapOr12({ generics: "", params: [] }, genericLambdaParams(sc, arity, recs)))(_v) : _v._tag === "None" ? { generics: "", params: ((_v) => _v._tag === "Some" ? (({ value: t }) => lambdaParamTypesTs(t, arity, envAt(spanKey(sp))))(_v) : _v._tag === "None" ? [] : (() => {
    throw new Error("non-exhaustive match");
  })())(_Map_get9(spanKey(sp), typeAt)) } : (() => {
    throw new Error("non-exhaustive match");
  })())(_Map_get9(spanKey(sp), genericLams)))), annotateEmpty: Some19((e) => {
    const key = spanKey(exprSpan3(e));
    return _Option_flatMap3((t) => emptyCollTs(t, envAt(key)), _Map_get9(key, typeAt));
  }), annotateLetin: Some19((value) => _Option_flatMap3((t) => emptyCollTs(t, recsEnv(recs)), _Map_get9(spanKey(exprSpan3(value)), letParamAt))), annotateCall: Some19((e) => _Option_flatMap3((t) => ctorCallTs(t, recs), typeOf(e))), guardBaseType: Some19((e) => _Option_flatMap3((t) => guardParamTs(t, recs), typeOf(e))), flattenPipe: true, tupleHelper: true, preserveInfix: true, preserveJsx: true, moduleExt: "" };
});
var anyOf = _curry20(2, (f, xs) => reduce6(_curry20(2, (acc, x) => or11(acc, f(x))), false, xs));
var hasJsxExpr = (e) => ((_v) => _v._tag === "ECall" && _v.origin._tag === "Some" && _v.origin.value === "jsx" ? true : _v._tag === "ECall" ? (({ fn, args }) => or11(hasJsxExpr(fn), anyOf(hasJsxExpr, args)))(_v) : _v._tag === "ELambda" ? (({ body }) => hasJsxExpr(body))(_v) : _v._tag === "ELetIn" ? (({ value, body }) => or11(hasJsxExpr(value), hasJsxExpr(body)))(_v) : _v._tag === "ELetBind" ? (({ value, body }) => or11(hasJsxExpr(value), hasJsxExpr(body)))(_v) : _v._tag === "EPipe" ? (({ left, right }) => or11(hasJsxExpr(left), hasJsxExpr(right)))(_v) : _v._tag === "EDo" ? (({ exprs }) => anyOf(hasJsxExpr, exprs))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => or11(or11(hasJsxExpr(cond), hasJsxExpr(thenE)), hasJsxExpr(elseE)))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => or11(hasJsxExpr(scrutinee), anyOf((a) => or11(((_v) => _v._tag === "Some" ? (({ value: g }) => hasJsxExpr(g))(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(a.guard), hasJsxExpr(a.body)), arms)))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => or11(anyOf((f) => hasJsxExpr(f.value), fields), ((_v) => _v._tag === "Some" ? (({ value }) => hasJsxExpr(value))(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(spread)))(_v) : _v._tag === "EField" ? (({ target }) => hasJsxExpr(target))(_v) : _v._tag === "ETuple" ? (({ elements }) => anyOf(hasJsxExpr, elements))(_v) : _v._tag === "EArr" ? (({ elements }) => anyOf((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => hasJsxExpr(value))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => hasJsxExpr(value))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements))(_v) : _v._tag === "EList" ? (({ elements }) => anyOf((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => hasJsxExpr(value))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => hasJsxExpr(value))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements))(_v) : _v._tag === "ESet" ? (({ elements }) => anyOf((el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: value }) => hasJsxExpr(value))(_v) : _v._tag === "SESpread" ? (({ expr: value }) => hasJsxExpr(value))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el), elements))(_v) : _v._tag === "EMap" ? (({ entries }) => anyOf((entry) => or11(hasJsxExpr(entry.key), hasJsxExpr(entry.value)), entries))(_v) : _v._tag === "ELoop" ? (({ params, body }) => or11(anyOf((p) => hasJsxExpr(p.init), params), hasJsxExpr(body)))(_v) : _v._tag === "ERecur" ? (({ args }) => anyOf(hasJsxExpr, args))(_v) : _v._tag === "EInterp" ? (({ parts }) => anyOf((part) => ((_v) => _v._tag === "IPLit" ? false : _v._tag === "IPExpr" ? (({ expr: value }) => hasJsxExpr(value))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(part), parts))(_v) : false)(e);
var hasJsxStmts = (stmts) => anyOf((stmt) => ((_v) => _v._tag === "SLet" ? (({ value }) => hasJsxExpr(value))(_v) : _v._tag === "SExpr" ? (({ value }) => hasJsxExpr(value))(_v) : false)(stmt), stmts);
var emitTsModuleWith = _curry20(13, (stmts, env, types, letParams, aliases, imported, importLines, ns, jsDefs, runtimeDeps, runtimeImport, docs, bindingHooks) => {
  const declared = declaredTypeNames(stmts, 0, _Set_fromArray8([]));
  const wanted = referencedCons(stmts, env, 0, _Set_fromArray8([]));
  const recs = withoutAmbiguousAlias(recordAliasIndex(aliases), aliases, nullaryLocalNames(stmts, 0, _Set_fromArray8([])));
  const typeHeader = typeHeaderFrom(stmts, aliases, recs, docs, 0);
  const body = codegenWith(stmts, imported, false, ns, jsDefs, runtimeDeps, { ...tsGenOpts(stmts, env, types, letParams, aliases, bindingHooks), docs });
  const deps0 = runtimeDepNames(stmts, imported, ns, jsDefs, runtimeDeps);
  const deps = _Str_contains3("_tuple(", body) ? _Array_append15("_tuple", deps0) : deps0;
  return ((deps) => ((runtimeLine) => ((header) => ((typeDeps) => ((typeImportLine) => concat2(`${hasJsxStmts(stmts) ? `/** @jsx h */

` : ""}${_Str_join8(`

`, filter8((part) => part !== "", [_Str_join8(`
`, header), _Str_join8(`
`, importLines), typeImportLine, runtimeLine, body]))}`, `
`))(length16(typeDeps) === 0 ? "" : `import type { ${_Str_join8(", ", _Array_sort2(typeDeps))} } from "${runtimeImport}";`))(_Array_concat10(_Str_contains3("_Curry<", `${_Str_join8(`
`, header)}
${body}`) ? ["_Curry"] : [], builtinTypeNamesFor(declared, wanted, body, 0))))(typeHeader))(length16(deps) === 0 ? "" : `import { ${_Str_join8(", ", _Array_sort2(deps))} } from "${runtimeImport}";`))(filter8((d) => or11(and14(and14(and14(and14(and14(and14(and14(and14(and14(d !== "add", d !== "sub"), d !== "mul"), d !== "div"), d !== "lt"), d !== "lte"), d !== "gt"), d !== "gte"), d !== "eq"), d !== "not"), _Str_contains3(d, body)), deps));
});
var emitTsModule = _curry20(11, (stmts, env, types, letParams, aliases, imported, importLines, ns, jsDefs, runtimeDeps, runtimeImport) => emitTsModuleWith(stmts, env, types, letParams, aliases, imported, importLines, ns, jsDefs, runtimeDeps, runtimeImport, true, bindingHooksFor(None19)));
var freeIdsIn = _curry20(2, (t, acc) => ((_v) => _v._tag === "TyVar" ? (({ id }) => _Array_contains4(id, acc) ? acc : _Array_append15(id, acc))(_v) : _v._tag === "TyCon" ? (({ args }) => freeIdsInAll(args, acc))(_v) : _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => freeIdsIn(toT, freeIdsIn(fromT, acc)))(_v) : _v._tag === "TyRecord" ? (({ row }) => freeIdsInRow(row, acc))(_v) : _v._tag === "TySingleton" ? acc : _v._tag === "TyOneOf" ? (({ members }) => freeIdsInAll(members, acc))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(t));
var freeIdsInAll = _curry20(2, (ts, acc) => reduce6(_curry20(2, (a, t) => freeIdsIn(t, a)), acc, ts));
var freeIdsInRow = _curry20(2, (row, acc) => ((_v) => _v._tag === "RowExtend" ? (({ fieldType, rest }) => freeIdsInRow(rest, freeIdsIn(fieldType, acc)))(_v) : acc)(row));
var lettersFor = _curry20(3, (ids, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: id }) => lettersFor(ids, i + 1, _Map_set8(id, letterAt(i), acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get18(i, ids)));
var anyFor = (ids) => reduce6(_curry20(2, (acc, id) => _Map_set8(id, "any", acc)), new Map, ids);
var genericHeadOf = _curry20(2, (ids, names) => length16(ids) === 0 ? "" : `<${_Str_join8(", ", _Map_values3(names))}>`);
var arrowCount = (t) => ((_v) => _v._tag === "TyFn" ? (({ to: toT }) => 1 + arrowCount(toT))(_v) : 0)(t);
var hostParams = _curry20(4, (t, arity, names, i) => i >= arity ? [] : ((_v) => _v._tag === "TyFn" ? (({ from: fromT, to: toT }) => _Array_prepend9(`${_Str_fromCode3(97 + i)}: ${tsOf(fromT, plainEnv(names))}`, hostParams(toT, arity, names, i + 1)))(_v) : [])(t));
var hostReturn = _curry20(3, (t, arity, i) => i >= arity ? t : ((_v) => _v._tag === "TyFn" ? (({ to: toT }) => hostReturn(toT, arity, i + 1))(_v) : t)(t));
var curriedHostType = _curry20(2, (t, arity) => {
  const ids = freeIdsIn(t, []);
  const names = lettersFor(ids, 0, new Map);
  return `${genericHeadOf(ids, names)}${reduce6(_curry20(2, (acc, p) => `(${p}) => ${acc}`), tsOf(hostReturn(t, arity, 0), plainEnv(names)), _Array_reverse(hostParams(t, arity, names, 0)))}`;
});
var flatHostType = _curry20(2, (t, arity) => {
  const ids = freeIdsIn(t, []);
  const names = lettersFor(ids, 0, new Map);
  const head = genericHeadOf(ids, names);
  return arity === 0 ? `${head}${tsOf(t, plainEnv(names))}` : curriedOverloads(head, hostParams(t, arity, names, 0), tsOf(hostReturn(t, arity, 0), plainEnv(names)));
});
var externDecl = (e) => {
  const t = e.scheme.ty;
  const n = arrowCount(t);
  return and14(n >= 1, e.curried) ? `export declare const ${e.imported}: ${curriedHostType(t, n)};` : n === 0 ? `export declare const ${e.imported}: ${tsOf(t, plainEnv(anyFor(freeIdsIn(t, []))))};` : `export declare const ${e.imported}: ${flatHostType(t, n)};`;
};
var externModuleDts = _curry20(2, (externs, aliases) => {
  const wanted = reduce6(_curry20(2, (acc, e) => consInTy(e.scheme.ty, acc)), _Set_fromArray8([]), externs);
  return concat2(_Str_join8(`
`, _Array_concat10(map12((bt) => typeDecl(bt.name, bt.params, bt.ctors, aliases, new Map), filter8((bt) => _Set_has7(bt.name, wanted), builtinTypeDecls)), map12(externDecl, _Array_dedupeBy((e) => e.imported, externs)))), `
`);
});

import { None as None20, Some as Some20, _Array_append as _Array_append16, _Array_concat as _Array_concat11, _Array_contains as _Array_contains5, _Array_flatMap as _Array_flatMap6, _Array_get as _Array_get19, _Map_get as _Map_get10, _Map_keys as _Map_keys10, _Map_set as _Map_set9, _Map_size as _Map_size3, _Str_codeAt as _Str_codeAt9, _Str_length as _Str_length8, _Str_startsWith as _Str_startsWith7, _curry as _curry21, _tuple as _tuple12, and as and15, eq as eq17, filter as filter9, map as map13, or as or12, reduce as reduce7 } from "@mochi/compiler/runtime";
import { match as match10 } from "@onrails/pattern";
var emptyOrigins = { values: new Map, types: new Map, ctors: new Map };
var occ = _curry21(5, (name, space, def, span, role) => ({ name, space, defPath: def.path, defStart: def.start, defEnd: def.end, start: span.start, end: span.end, role }));
var locOf = _curry21(2, (env, span) => ({ path: env.path, start: span.start, end: span.end }));
var upperStart2 = (s) => ((_v) => _v._tag === "Some" ? (({ value: c }) => and15(c >= 65, c <= 90))(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_codeAt9(0, s));
var parked = _Str_startsWith7("$");
var orElse = _curry21(2, (first, second) => ((_v) => _v._tag === "Some" ? (({ value: loc }) => Some20(loc))(_v) : _v._tag === "None" ? second() : (() => {
  throw new Error("non-exhaustive match");
})())(first));
var lookup = _curry21(3, (env, space, name) => ((_v) => _v === "value" ? orElse(_Map_get10(name, env.locals), () => orElse(_Map_get10(name, env.top.values), () => _Map_get10(name, env.prelude.origins.values))) : _v === "type" ? orElse(_Map_get10(name, env.top.types), () => _Map_get10(name, env.prelude.origins.types)) : orElse(_Map_get10(name, env.top.ctors), () => _Map_get10(name, env.prelude.origins.ctors)))(space));
var use = _curry21(4, (env, space, name, span) => ((_v) => _v._tag === "Some" ? (({ value: def }) => [occ(name, space, def, span, "use")])(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(lookup(env, space, name)));
var walked = _curry21(2, (occs, fields) => ({ occs, fields, frames: [] }));
var none = (fields) => walked([], fields);
var andThen = _curry21(2, (first, rest) => {
  const second = rest(first.fields);
  return { occs: _Array_concat11(first.occs, second.occs), fields: second.fields, frames: _Array_concat11(first.frames, second.frames) };
});
var prefixed = _curry21(2, (occs, w) => ({ occs: _Array_concat11(occs, w.occs), fields: w.fields, frames: w.frames }));
var sameLoc = _curry21(2, (a, b) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" ? (([{ value: x }, { value: y }]) => and15(and15(eq17(x.start, y.start), eq17(x.end, y.end)), eq17(x.path, y.path)))(_v) : _v[0]._tag === "None" && _v[1]._tag === "None" ? true : false)(_tuple12(a, b)));
var newBinds = _curry21(2, (outer, inner) => reduce7(_curry21(2, (acc, name) => or12(sameLoc(_Map_get10(name, outer.locals), _Map_get10(name, inner.locals)), parked(name)) ? acc : ((_v) => _v._tag === "Some" ? (({ value: def }) => _Map_set9(name, def, acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get10(name, inner.locals))), new Map, _Map_keys10(inner.locals)));
var framed = _curry21(4, (outer, inner, sp, w) => {
  const binds = newBinds(outer, inner);
  return _Map_size3(binds) === 0 ? w : { occs: w.occs, fields: w.fields, frames: _Array_append16({ start: sp.start, end: sp.end, binds }, w.frames) };
});
var touchField = _curry21(4, (env, name, span, fields) => ((_v) => _v._tag === "Some" ? (({ value: def }) => walked([occ(name, "field", def, span, "use")], fields))(_v) : _v._tag === "None" ? ((def) => walked([occ(name, "field", def, span, "def")], _Map_set9(name, def, fields)))(locOf(env, span)) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get10(name, fields)));
var bindLocal = _curry21(3, (env, name, span) => {
  const def = locOf(env, span);
  return { env: { path: env.path, top: env.top, prelude: env.prelude, locals: _Map_set9(name, def, env.locals) }, occ: occ(name, "value", def, span, "def") };
});
var bound = _curry21(3, (env, occs, fields) => ({ env, occs, fields, frames: [] }));
var boundWith = _curry21(3, (env, occs, w) => ({ env, occs, fields: w.fields, frames: w.frames }));
var bindName = _curry21(4, (env, name, span, fields) => {
  const b = bindLocal(env, name, span);
  return bound(b.env, [b.occ], fields);
});
var boundThen = _curry21(2, (first, rest) => {
  const second = rest(first.env, first.fields);
  return { env: second.env, occs: _Array_concat11(first.occs, second.occs), fields: second.fields, frames: _Array_concat11(first.frames, second.frames) };
});
var bindNames = _curry21(5, (env, names, spans, i, fields) => ((_v) => _v[0]._tag === "Some" && _v[1]._tag === "Some" ? (([{ value: name }, { value: span }]) => boundThen(bindName(env, name, span, fields), _curry21(2, (e, fs) => bindNames(e, names, spans, i + 1, fs))))(_v) : bound(env, [], fields))(_tuple12(_Array_get19(i, names), _Array_get19(i, spans))));
var walkTypes = _curry21(3, (env, types, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: t }) => _Array_concat11(walkType(env, t), walkTypes(env, types, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, types)));
var walkType = _curry21(2, (env, t) => ((_v) => _v._tag === "TyName" ? (({ name, span }) => upperStart2(name) ? use(env, "type", name, span) : [])(_v) : _v._tag === "TyArrow" ? (({ from, to }) => _Array_concat11(walkType(env, from), walkType(env, to)))(_v) : _v._tag === "TyApp" ? (({ ctor, args, span }) => _Array_concat11(use(env, "type", ctor, span), walkTypes(env, args, 0)))(_v) : _v._tag === "TyTuple" ? (({ elems }) => walkTypes(env, elems, 0))(_v) : _v._tag === "TyList" ? (({ elem }) => walkType(env, elem))(_v) : _v._tag === "TyQual" ? (({ alias, name, nameSpan, args }) => _Array_concat11(use(env, "type", `${alias}.${name}`, nameSpan), walkTypes(env, args, 0)))(_v) : _v._tag === "TyLit" ? [] : _v._tag === "TyUnion" ? (({ members }) => walkTypes(env, members, 0))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(t));
var walkAnnot = _curry21(2, (env, annot) => ((_v) => _v._tag === "Some" ? (({ value: t }) => walkType(env, t))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(annot));
var bindParam2 = _curry21(3, (env, param, fields) => ((_v) => _v._tag === "LPSpanned" && _v.param._tag === "LPName" && _v.nameSpans.length === 1 ? (({ param: { name, annot }, nameSpans: [span] }) => ((annotOccs) => parked(name) ? bound(env, annotOccs, fields) : ((b) => bound(b.env, _Array_append16(b.occ, annotOccs), fields))(bindLocal(env, name, span)))(walkAnnot(env, annot)))(_v) : _v._tag === "LPSpanned" && _v.param._tag === "LPLabeled" && _v.nameSpans.length === 1 ? (({ param: { name, annot, defaultValue }, nameSpans: [span] }) => ((annotOccs) => ((dflt) => ((before) => parked(name) ? boundWith(env, before, dflt) : ((b) => boundWith(b.env, _Array_append16(b.occ, before), dflt))(bindLocal(env, name, span)))(_Array_concat11(annotOccs, dflt.occs)))(((_v) => _v._tag === "Some" ? (({ value: e }) => walkExpr(env, e, fields))(_v) : _v._tag === "None" ? none(fields) : (() => {
  throw new Error("non-exhaustive match");
})())(defaultValue)))(walkAnnot(env, annot)))(_v) : _v._tag === "LPSpanned" && _v.param._tag === "LPTuple" ? (({ param: { names }, nameSpans: spans }) => bindNames(env, names, spans, 0, fields))(_v) : _v._tag === "LPSpanned" && _v.param._tag === "LPRecord" ? (({ param: { fields: names }, nameSpans: spans }) => bindNames(env, names, spans, 0, fields))(_v) : _v._tag === "LPName" ? (({ annot }) => bound(env, walkAnnot(env, annot), fields))(_v) : _v._tag === "LPLabeled" ? (({ annot, defaultValue }) => ((dflt) => boundWith(env, _Array_concat11(walkAnnot(env, annot), dflt.occs), dflt))(((_v) => _v._tag === "Some" ? (({ value: e }) => walkExpr(env, e, fields))(_v) : _v._tag === "None" ? none(fields) : (() => {
  throw new Error("non-exhaustive match");
})())(defaultValue)))(_v) : bound(env, [], fields))(param));
var bindParams = _curry21(4, (env, params, i, fields) => ((_v) => _v._tag === "None" ? bound(env, [], fields) : _v._tag === "Some" ? (({ value: param }) => boundThen(bindParam2(env, param, fields), _curry21(2, (e, fs) => bindParams(e, params, i + 1, fs))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, params)));
var walkPatOpt = _curry21(3, (env, pat, fields) => ((_v) => _v._tag === "Some" ? (({ value: p }) => walkPat(env, p, fields))(_v) : _v._tag === "None" ? bound(env, [], fields) : (() => {
  throw new Error("non-exhaustive match");
})())(pat));
var walkPats = _curry21(4, (env, pats, i, fields) => ((_v) => _v._tag === "None" ? bound(env, [], fields) : _v._tag === "Some" ? (({ value: p }) => boundThen(walkPat(env, p, fields), _curry21(2, (e, fs) => walkPats(e, pats, i + 1, fs))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, pats)));
var walkPatFields = _curry21(4, (env, pfs, i, fields) => ((_v) => _v._tag === "None" ? bound(env, [], fields) : _v._tag === "Some" ? (({ value: pf }) => ((label) => boundThen(boundThen(bound(env, label.occs, label.fields), _curry21(2, (e, fs) => walkPat(e, pf.pat, fs))), _curry21(2, (e, fs) => walkPatFields(e, pfs, i + 1, fs))))(touchField(env, pf.label, pf.labelSpan, fields)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, pfs)));
var walkPat = _curry21(3, (env, pat, fields) => ((_v) => _v._tag === "PAs" ? (({ pat: inner, name, nameSpan }) => boundThen(walkPat(env, inner, fields), _curry21(2, (e, fs) => bindName(e, name, nameSpan, fs))))(_v) : _v._tag === "PBind" ? (({ name, span }) => name === "_" ? bound(env, [], fields) : bindName(env, name, span, fields))(_v) : _v._tag === "PCtor" ? (({ ctor, args, span }) => boundThen(bound(env, use(env, "ctor", ctor, span), fields), _curry21(2, (e, fs) => walkPats(e, args, 0, fs))))(_v) : _v._tag === "PRecord" ? (({ fields: pfs }) => walkPatFields(env, pfs, 0, fields))(_v) : _v._tag === "PTuple" ? (({ elems }) => walkPats(env, elems, 0, fields))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => boundThen(walkPats(env, elems, 0, fields), _curry21(2, (e, fs) => walkPatOpt(e, rest, fs))))(_v) : _v._tag === "PList" ? (({ elems, rest }) => boundThen(walkPats(env, elems, 0, fields), _curry21(2, (e, fs) => walkPatOpt(e, rest, fs))))(_v) : _v._tag === "POr" ? (({ alts }) => ((_v) => _v.length >= 1 ? (([first, ...rest]) => boundThen(walkPat(env, first, fields), _curry21(2, (e, fs) => {
  const uses = walkPatUsesList(e, rest, 0, fs);
  return bound(e, uses.occs, uses.fields);
})))(_v) : _v.length === 0 ? bound(env, [], fields) : (() => {
  throw new Error("non-exhaustive match");
})())(alts))(_v) : bound(env, [], fields))(pat));
var walkPatUsesList = _curry21(4, (env, pats, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" ? (({ value: p }) => andThen(walkPatUses(env, p, fields), (fs) => walkPatUsesList(env, pats, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, pats)));
var walkPatUsesOpt = _curry21(3, (env, pat, fields) => ((_v) => _v._tag === "Some" ? (({ value: p }) => walkPatUses(env, p, fields))(_v) : _v._tag === "None" ? none(fields) : (() => {
  throw new Error("non-exhaustive match");
})())(pat));
var walkPatFieldUses = _curry21(4, (env, pfs, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" ? (({ value: pf }) => andThen(andThen(touchField(env, pf.label, pf.labelSpan, fields), (fs) => walkPatUses(env, pf.pat, fs)), (fs) => walkPatFieldUses(env, pfs, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, pfs)));
var walkPatUses = _curry21(3, (env, pat, fields) => ((_v) => _v._tag === "PAs" ? (({ pat: inner }) => walkPatUses(env, inner, fields))(_v) : _v._tag === "PCtor" ? (({ ctor, args, span }) => prefixed(use(env, "ctor", ctor, span), walkPatUsesList(env, args, 0, fields)))(_v) : _v._tag === "PRecord" ? (({ fields: pfs }) => walkPatFieldUses(env, pfs, 0, fields))(_v) : _v._tag === "PTuple" ? (({ elems }) => walkPatUsesList(env, elems, 0, fields))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => andThen(walkPatUsesList(env, elems, 0, fields), (fs) => walkPatUsesOpt(env, rest, fs)))(_v) : _v._tag === "PList" ? (({ elems, rest }) => andThen(walkPatUsesList(env, elems, 0, fields), (fs) => walkPatUsesOpt(env, rest, fs)))(_v) : _v._tag === "POr" ? (({ alts }) => walkPatUsesList(env, alts, 0, fields))(_v) : none(fields))(pat));
var walkExprs = _curry21(4, (env, exprs, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" ? (({ value: e }) => andThen(walkExpr(env, e, fields), (fs) => walkExprs(env, exprs, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, exprs)));
var walkSeqs = _curry21(4, (env, elems, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" && _v.value._tag === "SEExpr" ? (({ value: { expr: e } }) => andThen(walkExpr(env, e, fields), (fs) => walkSeqs(env, elems, i + 1, fs)))(_v) : _v._tag === "Some" && _v.value._tag === "SESpread" ? (({ value: { expr: e } }) => andThen(walkExpr(env, e, fields), (fs) => walkSeqs(env, elems, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, elems)));
var walkInterp = _curry21(4, (env, parts, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" && _v.value._tag === "IPLit" ? walkInterp(env, parts, i + 1, fields) : _v._tag === "Some" && _v.value._tag === "IPExpr" ? (({ value: { expr: e } }) => andThen(walkExpr(env, e, fields), (fs) => walkInterp(env, parts, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, parts)));
var walkRecordFields = _curry21(4, (env, rfs, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" ? (({ value: f }) => andThen(andThen(touchField(env, f.name, f.nameSpan, fields), (fs) => walkExpr(env, f.value, fs)), (fs) => walkRecordFields(env, rfs, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, rfs)));
var walkEntries = _curry21(4, (env, entries, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" ? (({ value: entry }) => andThen(andThen(walkExpr(env, entry.key, fields), (fs) => walkExpr(env, entry.value, fs)), (fs) => walkEntries(env, entries, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, entries)));
var walkArms = _curry21(4, (env, arms, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" ? (({ value: arm }) => ((pat) => ((guard) => ((body) => ((armSpan) => andThen(framed(env, pat.env, armSpan, body), (fs) => walkArms(env, arms, i + 1, fs)))({ start: patSpan3(arm.pattern).start, end: exprSpan3(arm.body).end }))(andThen(prefixed(pat.occs, guard), (fs) => walkExpr(pat.env, arm.body, fs))))(((_v) => _v._tag === "Some" ? (({ value: g }) => walkExpr(pat.env, g, pat.fields))(_v) : _v._tag === "None" ? none(pat.fields) : (() => {
  throw new Error("non-exhaustive match");
})())(arm.guard)))(walkPat(env, arm.pattern, fields)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, arms)));
var walkLoopInits = _curry21(4, (env, params, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" ? (({ value: param }) => andThen(walkExpr(env, param.init, fields), (fs) => walkLoopInits(env, params, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, params)));
var bindLoopParams = _curry21(4, (env, params, i, fields) => ((_v) => _v._tag === "None" ? bound(env, [], fields) : _v._tag === "Some" ? (({ value: param }) => boundThen(bindName(env, param.name, param.nameSpan, fields), _curry21(2, (e, fs) => bindLoopParams(e, params, i + 1, fs))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, params)));
var letRun = _curry21(2, (e, acc) => ((_v) => _v._tag === "ELetIn" ? (({ name, nameSpan, annot, value, body }) => ((_v) => _v._tag === "ELambda" ? letRun(body, _Array_append16(_tuple12(name, nameSpan, annot, value), acc)) : { binders: acc, tail: e })(value))(_v) : { binders: acc, tail: e })(e));
var bindRun = _curry21(4, (env, binders, i, fields) => match10(_Array_get19(i, binders)).with({ _tag: "None" }, () => bound(env, [], fields)).with((_v) => _v._tag === "Some", ({ value: [name, nameSpan, ,] }) => boundThen(bindName(env, name, nameSpan, fields), _curry21(2, (e, fs) => bindRun(e, binders, i + 1, fs)))).exhaustive());
var walkRunValues = _curry21(4, (env, binders, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" ? (({ value: [, , annot, value] }) => andThen(prefixed(walkAnnot(env, annot), walkExpr(env, value, fields)), (fs) => walkRunValues(env, binders, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, binders)));
var walkLetRun = _curry21(3, (env, run, fields) => {
  const scope = bindRun(env, run.binders, 0, fields);
  return framed(env, scope.env, exprSpan3(run.tail), prefixed(scope.occs, andThen(walkRunValues(scope.env, run.binders, 0, scope.fields), (fs) => walkExpr(scope.env, run.tail, fs))));
});
var fieldNameSpan = _curry21(2, (span, name) => ({ start: span.end - _Str_length8(name), end: span.end }));
var walkFieldAccess = _curry21(5, (env, target, name, span, fields) => {
  const nameSpan = fieldNameSpan(span, name);
  const member = ((_v) => _v._tag === "ERef" ? (({ name: ns }) => _Map_get10(`${ns}.${name}`, env.prelude.members))(_v) : None20)(target);
  return andThen(walkExpr(env, target, fields), (fs) => ((_v) => _v._tag === "Some" ? (({ value: def }) => walked([occ(name, "value", def, nameSpan, "use")], fs))(_v) : _v._tag === "None" ? touchField(env, name, nameSpan, fs) : (() => {
    throw new Error("non-exhaustive match");
  })())(member));
});
var walkExpr = _curry21(3, (env, expr, fields) => ((_v) => _v._tag === "ERef" ? (({ name, span }) => parked(name) ? none(fields) : and15(upperStart2(name), lookup(env, "ctor", name)._tag !== "None") ? walked(use(env, "ctor", name, span), fields) : walked(use(env, "value", name, span), fields))(_v) : _v._tag === "EInterp" ? (({ parts }) => walkInterp(env, parts, 0, fields))(_v) : _v._tag === "ECall" ? (({ fn, args }) => andThen(walkExpr(env, fn, fields), (fs) => walkExprs(env, args, 0, fs)))(_v) : _v._tag === "ELambda" ? (({ params, body, span: sp }) => ((scope) => ((inner) => framed(env, scope.env, sp, { occs: _Array_concat11(scope.occs, inner.occs), fields: inner.fields, frames: _Array_concat11(scope.frames, inner.frames) }))(walkExpr(scope.env, body, scope.fields)))(bindParams(env, params, 0, fields)))(_v) : _v._tag === "ELetIn" ? (({ name, nameSpan, annot, value, body }) => ((_v) => _v._tag === "ELambda" ? walkLetRun(env, letRun(expr, []), fields) : ((v) => ((scope) => ((inner) => ({ occs: _Array_concat11(_Array_concat11(v.occs, _Array_concat11(walkAnnot(env, annot), scope.occs)), inner.occs), fields: inner.fields, frames: _Array_concat11(v.frames, inner.frames) }))(framed(env, scope.env, exprSpan3(body), walkExpr(scope.env, body, scope.fields))))(bindName(env, name, nameSpan, v.fields)))(walkExpr(env, value, fields)))(value))(_v) : _v._tag === "ELetBind" ? (({ param, value, body }) => ((v) => ((scope) => ((inner) => ({ occs: _Array_concat11(_Array_concat11(v.occs, scope.occs), inner.occs), fields: inner.fields, frames: _Array_concat11(_Array_concat11(v.frames, scope.frames), inner.frames) }))(framed(env, scope.env, exprSpan3(body), walkExpr(scope.env, body, scope.fields))))(bindParam2(env, param, v.fields)))(walkExpr(env, value, fields)))(_v) : _v._tag === "ELoop" ? (({ params, body }) => ((inits) => ((scope) => ((inner) => ({ occs: _Array_concat11(_Array_concat11(inits.occs, scope.occs), inner.occs), fields: inner.fields, frames: _Array_concat11(inits.frames, inner.frames) }))(framed(env, scope.env, exprSpan3(body), walkExpr(scope.env, body, scope.fields))))(bindLoopParams(env, params, 0, inits.fields)))(walkLoopInits(env, params, 0, fields)))(_v) : _v._tag === "ERecur" ? (({ args }) => walkExprs(env, args, 0, fields))(_v) : _v._tag === "EPipe" ? (({ left, right }) => andThen(walkExpr(env, left, fields), (fs) => walkExpr(env, right, fs)))(_v) : _v._tag === "EDo" ? (({ exprs }) => walkExprs(env, exprs, 0, fields))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => walkExprs(env, [cond, thenE, elseE], 0, fields))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => andThen(walkExpr(env, scrutinee, fields), (fs) => walkArms(env, arms, 0, fs)))(_v) : _v._tag === "ERecord" ? (({ fields: rfs, spread }) => ((_v) => _v._tag === "Some" ? (({ value: base }) => andThen(walkExpr(env, base, fields), (fs) => walkRecordFields(env, rfs, 0, fs)))(_v) : _v._tag === "None" ? walkRecordFields(env, rfs, 0, fields) : (() => {
  throw new Error("non-exhaustive match");
})())(spread))(_v) : _v._tag === "EField" ? (({ target, name, span }) => walkFieldAccess(env, target, name, span, fields))(_v) : _v._tag === "ETuple" ? (({ elements }) => walkExprs(env, elements, 0, fields))(_v) : _v._tag === "EArr" ? (({ elements }) => walkSeqs(env, elements, 0, fields))(_v) : _v._tag === "EList" ? (({ elements }) => walkSeqs(env, elements, 0, fields))(_v) : _v._tag === "ESet" ? (({ elements }) => walkSeqs(env, elements, 0, fields))(_v) : _v._tag === "EMap" ? (({ entries }) => walkEntries(env, entries, 0, fields))(_v) : none(fields))(expr));
var withValue = _curry21(3, (o, name, def) => ({ values: _Map_set9(name, def, o.values), types: o.types, ctors: o.ctors }));
var withType = _curry21(3, (o, name, def) => ({ values: o.values, types: _Map_set9(name, def, o.types), ctors: o.ctors }));
var withCtor = _curry21(3, (o, name, def) => ({ values: o.values, types: o.types, ctors: _Map_set9(name, def, o.ctors) }));
var topThen = _curry21(4, (first, occs, top, fields) => ({ top, occs: _Array_concat11(first.occs, occs), fields }));
var bindImport = _curry21(5, (env, origins, acc, name, span) => ((_v) => _v[0]._tag === "Some" ? (([{ value: def }, ,]) => topThen(acc, [occ(name, "ctor", def, span, "use")], withValue(withCtor(acc.top, name, def), name, def), acc.fields))(_v) : _v[0]._tag === "None" && _v[1]._tag === "Some" ? (([, { value: def }]) => topThen(acc, [occ(name, "value", def, span, "use")], withValue(acc.top, name, def), acc.fields))(_v) : _v[0]._tag === "None" && _v[1]._tag === "None" && _v[2]._tag === "Some" ? (([, , { value: def }]) => topThen(acc, [occ(name, "type", def, span, "use")], withType(acc.top, name, def), acc.fields))(_v) : ((def) => topThen(acc, [occ(name, "value", def, span, "def")], withValue(acc.top, name, def), acc.fields))(locOf(env, span)))(_tuple12(_Map_get10(name, origins.ctors), _Map_get10(name, origins.values), _Map_get10(name, origins.types))));
var bindImports = _curry21(5, (env, origins, acc, names, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: n }) => bindImports(env, origins, bindImport(env, origins, acc, n.name, n.span), names, i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, names)));
var bindCtors = _curry21(4, (env, acc, ctors, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: c }) => ((def) => bindCtors(env, topThen(acc, [occ(c.name, "ctor", def, c.span, "def")], withCtor(acc.top, c.name, def), acc.fields), ctors, i + 1))(locOf(env, c.span)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, ctors)));
var touchAliasFields = _curry21(4, (env, acc, afs, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: f }) => ((w) => touchAliasFields(env, topThen(acc, w.occs, acc.top, w.fields), afs, i + 1))(touchField(env, f.name, f.nameSpan, acc.fields)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, afs)));
var bindTopValue = _curry21(4, (env, acc, name, span) => {
  const def = locOf(env, span);
  return topThen(acc, [occ(name, "value", def, span, "def")], withValue(acc.top, name, def), acc.fields);
});
var bindTopLevels = _curry21(5, (env, origins, stmts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: stmt }) => bindTopLevels(env, origins, stmts, i + 1, ((_v) => _v._tag === "SImportNs" ? (({ alias }) => bindTopValue(env, acc, alias.name, alias.span))(_v) : _v._tag === "SImport" ? (({ names }) => bindImports(env, origins, acc, names, 0))(_v) : _v._tag === "SType" ? (({ name, nameSpan, ctors, alias }) => ((def) => ((withCtors) => ((_v) => _v._tag === "Some" ? (({ value: afs }) => touchAliasFields(env, withCtors, afs, 0))(_v) : _v._tag === "None" ? withCtors : (() => {
  throw new Error("non-exhaustive match");
})())(alias))(bindCtors(env, topThen(acc, [occ(name, "type", def, nameSpan, "def")], withType(acc.top, name, def), acc.fields), ctors, 0)))(locOf(env, nameSpan)))(_v) : _v._tag === "SLet" ? (({ name, nameSpan }) => parked(name) ? acc : bindTopValue(env, acc, name, nameSpan))(_v) : _v._tag === "SExtern" ? (({ name, nameSpan }) => bindTopValue(env, acc, name, nameSpan))(_v) : acc)(stmt)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, stmts)));
var ctorFieldTypes = (ctors) => _Array_flatMap6((c) => map13((f) => f.fieldType, c.fields), ctors);
var walkStmt = _curry21(3, (env, stmt, fields) => ((_v) => _v._tag === "SLet" ? (({ annot, value }) => prefixed(walkAnnot(env, annot), walkExpr(env, value, fields)))(_v) : _v._tag === "SExpr" ? (({ value }) => walkExpr(env, value, fields))(_v) : _v._tag === "SExtern" ? (({ typeExpr }) => walked(walkType(env, typeExpr), fields))(_v) : _v._tag === "SType" ? (({ ctors, alias, aliasType }) => ((aliasTypes) => walked(_Array_concat11(walkTypes(env, _Array_concat11(ctorFieldTypes(ctors), aliasTypes), 0), walkAnnot(env, aliasType)), fields))(((_v) => _v._tag === "Some" ? (({ value: afs }) => map13((f) => f.fieldType, afs))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(alias)))(_v) : none(fields))(stmt));
var walkStmts = _curry21(4, (env, stmts, i, fields) => ((_v) => _v._tag === "None" ? none(fields) : _v._tag === "Some" ? (({ value: stmt }) => andThen(walkStmt(env, stmt, fields), (fs) => walkStmts(env, stmts, i + 1, fs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, stmts)));
var indexWith = _curry21(4, (path, origins, prelude, stmts) => {
  const env0 = { path, top: emptyOrigins, prelude, locals: new Map([]) };
  const tops = bindTopLevels(env0, origins, stmts, 0, { top: emptyOrigins, occs: [], fields: new Map });
  const body = walkStmts({ path, top: tops.top, prelude, locals: new Map }, stmts, 0, tops.fields);
  return { occurrences: _Array_concat11(tops.occs, body.occs), top: tops.top, fields: body.fields, frames: body.frames };
});
var originsFrom = _curry21(4, (path, stmts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SLet" && _v.value.exported === true ? (({ value: { name, nameSpan } }) => originsFrom(path, stmts, i + 1, withValue(acc, name, { path, start: nameSpan.start, end: nameSpan.end })))(_v) : _v._tag === "Some" && _v.value._tag === "SExtern" && _v.value.exported === true ? (({ value: { name, nameSpan } }) => originsFrom(path, stmts, i + 1, withValue(acc, name, { path, start: nameSpan.start, end: nameSpan.end })))(_v) : _v._tag === "Some" && _v.value._tag === "SType" && _v.value.exported === true ? (({ value: { name, nameSpan, ctors } }) => originsFrom(path, stmts, i + 1, reduce7(_curry21(2, (o, c) => {
  const at = { path, start: c.span.start, end: c.span.end };
  return withValue(withCtor(o, c.name, at), c.name, at);
}), withType(acc, name, { path, start: nameSpan.start, end: nameSpan.end }), ctors)))(_v) : _v._tag === "Some" ? originsFrom(path, stmts, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get19(i, stmts)));
var originsOf = _curry21(2, (path, stmts) => originsFrom(path, stmts, 0, emptyOrigins));

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
      if (!y.has(k) || !eq(v, y.get(k)))
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
      if (!y.has(v))
        return false;
    return true;
  }
  if (typeof x[Symbol.iterator] === "function" || typeof y[Symbol.iterator] === "function")
    throw new TypeError("eq on List: force it first with List.toArray");
  const kx = Object.keys(x), ky = Object.keys(y);
  if (kx.length !== ky.length)
    return false;
  for (const k of kx)
    if (!eq(x[k], y[k]))
      return false;
  return true;
});`,
  compare: `const compare = _curry(2, (x, y) => {
  if (x === y)
    return 0;
  const t = typeof x;
  if (t === "number" || t === "string" || t === "boolean")
    return x < y ? -1 : x > y ? 1 : 0;
  if (Array.isArray(x) && Array.isArray(y)) {
    const n = Math.min(x.length, y.length);
    for (let i = 0;i < n; i++) {
      const c = compare(x[i], y[i]);
      if (c !== 0)
        return c;
    }
    return compare(x.length, y.length);
  }
  if (x instanceof Map && y instanceof Map) {
    const kx = [...x.keys()].sort(compare), ky = [...y.keys()].sort(compare);
    const n = Math.min(kx.length, ky.length);
    for (let i = 0;i < n; i++) {
      const kc = compare(kx[i], ky[i]);
      if (kc !== 0)
        return kc;
      const vc = compare(x.get(kx[i]), y.get(ky[i]));
      if (vc !== 0)
        return vc;
    }
    return compare(kx.length, ky.length);
  }
  if (x instanceof Set && y instanceof Set) {
    const ex = [...x].sort(compare), ey = [...y].sort(compare);
    const n = Math.min(ex.length, ey.length);
    for (let i = 0;i < n; i++) {
      const c = compare(ex[i], ey[i]);
      if (c !== 0)
        return c;
    }
    return compare(ex.length, ey.length);
  }
  if (typeof x === "object" && x !== null && !Array.isArray(x) && typeof x[Symbol.iterator] === "function")
    throw new TypeError("compare on List: force it first with List.toArray");
  const sx = JSON.stringify(x), sy = JSON.stringify(y);
  return sx < sy ? -1 : sx > sy ? 1 : 0;
});`,
  show: 'const show = (x) => {\n  const t = typeof x;\n  if (t === "string")\n    return JSON.stringify(x);\n  if (t !== "object" || x === null)\n    return String(x);\n  if (Array.isArray(x))\n    return `[${x.map(show).join(", ")}]`;\n  if (x instanceof Map)\n    return `#{${[...x.entries()].map((e) => `${show(e[0])}: ${show(e[1])}`).join(", ")}}`;\n  if (x instanceof Set)\n    return `#{${[...x].map(show).join(", ")}}`;\n  if (typeof x[Symbol.iterator] === "function")\n    return "<List>";\n  if (typeof x._tag === "string") {\n    const ks = Object.keys(x).filter((k) => k !== "_tag");\n    return ks.length === 0 ? x._tag : `${x._tag}(${ks.map((k) => show(x[k])).join(", ")})`;\n  }\n  const ks = Object.keys(x);\n  return ks.length === 0 ? String(x) : `{ ${ks.map((k) => `${k}: ${show(x[k])}`).join(", ")} }`;\n};',
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
  _Set_has: "const _Set_has = _curry(2, (x, s) => s.has(x));",
  _Set_add: "const _Set_add = _curry(2, (x, s) => new Set(s).add(x));",
  _Set_delete: `const _Set_delete = _curry(2, (x, s) => {
  const n = new Set(s);
  n.delete(x);
  return n;
});`,
  _Set_size: "const _Set_size = (s) => s.size;",
  _Set_toArray: "const _Set_toArray = (s) => [...s];",
  _Set_fromArray: "const _Set_fromArray = (xs) => new Set(xs);",
  _Set_union: "const _Set_union = _curry(2, (a, b) => new Set([...a, ...b]));",
  _Set_intersect: "const _Set_intersect = _curry(2, (a, b) => new Set([...a].filter((x) => b.has(x))));",
  _Set_diff: "const _Set_diff = _curry(2, (a, b) => new Set([...a].filter((x) => !b.has(x))));",
  _Map_has: "const _Map_has = _curry(2, (k, m) => m.has(k));",
  _Map_getOr: "const _Map_getOr = _curry(3, (d, k, m) => m.has(k) ? m.get(k) : d);",
  _Map_set: `const _Map_set = _curry(3, (k, v, m) => {
  const n = new Map(m);
  n.set(k, v);
  return n;
});`,
  _Map_delete: `const _Map_delete = _curry(2, (k, m) => {
  const n = new Map(m);
  n.delete(k);
  return n;
});`,
  _Map_size: "const _Map_size = (m) => m.size;",
  _Map_keys: "const _Map_keys = (m) => [...m.keys()];",
  _Map_values: "const _Map_values = (m) => [...m.values()];",
  _Map_get: "const _Map_get = _curry(2, (k, m) => m.has(k) ? Some(m.get(k)) : None);",
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
  const seen = [];
  return xs.filter((x) => {
    const k = f(x);
    if (seen.some((s) => eq(s, k)))
      return false;
    seen.push(k);
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
    "_curry"
  ],
  compare: [
    "_curry"
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
  _Set_has: [
    "_curry"
  ],
  _Set_add: [
    "_curry"
  ],
  _Set_delete: [
    "_curry"
  ],
  _Set_union: [
    "_curry"
  ],
  _Set_intersect: [
    "_curry"
  ],
  _Set_diff: [
    "_curry"
  ],
  _Map_has: [
    "_curry"
  ],
  _Map_getOr: [
    "_curry"
  ],
  _Map_set: [
    "_curry"
  ],
  _Map_delete: [
    "_curry"
  ],
  _Map_get: [
    "_curry",
    "Some",
    "None"
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

var runtimeAnnotation = _curry22(2, (name, arity) => {
  const ty = ((_v) => _v._tag === "Some" ? (({ value: t }) => Some21(t))(_v) : _v._tag === "None" ? reduce8(_curry22(2, (found, ns) => {
    const members = _Option_unwrapOr13(new Map, _Map_get11(ns, namespaceRuntime));
    return reduce8(_curry22(2, (acc, key) => eq18(_Map_get11(key, members), Some21(name)) ? _Option_flatMap4(_Map_get11(key), _Map_get11(ns, namespaces)) : acc), found, _Map_keys11(members));
  }), None21, _Map_keys11(namespaceRuntime)) : (() => {
    throw new Error("non-exhaustive match");
  })())(_Map_get11(name, builtins));
  return _Option_map4((t) => flatHostType(t, arity), ty);
});
var defaultOpts = { open: false, runtime: true, docs: true, moduleExt: ".js", strictEntry: false, plugins: None21 };
var afterBlanks = _curry22(2, (s, i) => ((_v) => _v._tag === "Some" && _v.value === " " ? afterBlanks(s, i + 1) : _v._tag === "Some" && _v.value === "\t" ? afterBlanks(s, i + 1) : ((other) => other)(_v))(_Str_get5(i, s)));
var openDirective = (src) => {
  const t = _Str_trim2(src);
  return and16(_Str_startsWith8('"use open"', t), ((_v) => _v._tag === "None" ? true : _v._tag === "Some" && _v.value === `
` ? true : _v._tag === "Some" && _v.value === "r" ? true : false)(afterBlanks(t, 10)));
};
var openMode = _curry22(2, (src, requested) => or13(requested, openDirective(src)));
var noSuggestions2 = [];
var stampStage = _curry22(2, (kind, e) => ({ kind, message: e.message, start: e.start, end: e.end, help: None21, suggestions: noSuggestions2 }));
var stampType = (e) => ({ kind: "type", message: e.message, start: e.start, end: e.end, help: e.help, suggestions: e.suggestions });
var typecheckWith = _curry22(3, (prog, open, plugins) => _Result_mapErr((es) => map14(stampType, es), _Result_map7((_) => prog, inferProgramWith(prog, builtins, namespaces, open, plugins))));
var frontend = _curry22(2, (src, plugins) => ((_v) => _v._tag === "Err" ? (({ error: e }) => Err10([stampStage("lex", e)]))(_v) : _v._tag === "Ok" ? (({ value: tokens }) => ((parsed) => ((_v) => _v.length === 0 ? _Result_mapErr((es) => map14((e) => stampStage("check", e), es), checkAll(parsed.stmts)) : ((ds) => Err10(map14((e) => stampStage("parse", e), ds)))(_v))(parsed.diagnostics))(parseRecovering(tokens, plugins)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(lex(src)));
var pipelineWith = _curry22(3, (src, open, plugins) => _Result_flatMap8((stmts) => typecheckWith(stmts, open, plugins), frontend(src, plugins)));
var typedProgramWith = _curry22(2, (src, opts) => _Result_flatMap8((stmts) => _Result_mapErr((es) => map14(stampType, es), _Result_map7((r) => _tuple13(stmts, r), inferProgramTypesWith(stmts, builtins, namespaces, openMode(src, opts.open), opts.plugins))), frontend(src, opts.plugins)));
var typedProgram = (src) => typedProgramWith(src, defaultOpts);
var typedQuery = _curry22(3, (src, stmts, opts) => _Result_mapErr((es) => map14(stampType, es), _Result_map7((r) => ({ env: r.env, types: map14((hit) => ({ span: hit.span, ty: hit.ty, display: showType(widenLits(hit.ty)), sym: hit.sym }), r.types), aliases: r.aliases, letParams: r.letParams }), inferProgramTypesWith(stmts, builtins, namespaces, openMode(src, opts.open), opts.plugins))));
var inferTypesWith = _curry22(2, (src, opts) => _Result_flatMap8((stmts) => typedQuery(src, stmts, opts), frontend(src, opts.plugins)));
var inferTypesRecoveringWith = _curry22(2, (src, opts) => ((_v) => _v._tag === "Err" ? (({ error: e }) => Err10([stampStage("lex", e)]))(_v) : _v._tag === "Ok" ? (({ value: tokens }) => ((parsed) => _Result_flatMap8((stmts) => typedQuery(src, stmts, opts), _Result_mapErr((es) => map14((e) => stampStage("check", e), es), checkAll(parsed.stmts))))(parseRecovering(tokens, opts.plugins)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(lex(src)));
var inferTypes = (src) => inferTypesWith(src, defaultOpts);
var nominalTypeName2 = _curry22(2, (ty, aliases) => nominalTypeName(ty, aliases));
var symbolIndexSync = _curry22(4, (path, origins, prelude, stmts) => indexWith(path, origins, prelude, stmts));
var emitJsWith = _curry22(2, (stmts, opts) => codegenWith(stmts, new Map, opts.runtime, namespaceRuntime, preludeJsDefs, runtimeDeps, { ...jsGenOpts, docs: opts.docs, moduleExt: opts.moduleExt }));
var compileWith = _curry22(2, (src, opts) => _Result_map7((prog) => emitJsWith(prog, opts), pipelineWith(src, openMode(src, opts.open), opts.plugins)));
var compile = (src) => compileWith(src, defaultOpts);
var noImportedKeys = new Map;
var emitTsWith = _curry22(4, (stmts, r, runtimeImport, opts) => emitTsModuleWith(stmts, r.env, r.types, r.letParams, r.aliases, noImportedKeys, [], namespaceRuntime, preludeJsDefs, runtimeDeps, runtimeImport, opts.docs, bindingHooksFor(opts.plugins)));
var compileTsWith = _curry22(3, (src, runtimeImport, opts) => _Result_flatMap8((stmts) => _Result_mapErr((es) => map14(stampType, es), _Result_map7((r) => emitTsWith(stmts, r, runtimeImport, opts), inferProgramTypesWith(stmts, builtins, namespaces, openMode(src, opts.open), opts.plugins))), frontend(src, opts.plugins)));
var compileTs = _curry22(2, (src, runtimeImport) => compileTsWith(src, runtimeImport, defaultOpts));
import { None as None22, _Array_append as _Array_append17, _Array_concat as _Array_concat12, _Array_contains as _Array_contains6, _Array_get as _Array_get20, _Array_prepend as _Array_prepend10, _Map_get as _Map_get12, _Map_getOr as _Map_getOr8, _Map_has as _Map_has7, _Map_keys as _Map_keys12, _Map_set as _Map_set10, _Option_isSome as _Option_isSome6, _Option_unwrapOr as _Option_unwrapOr14, _Result_map as _Result_map8, _Set_add as _Set_add9, _Set_fromArray as _Set_fromArray9, _Set_has as _Set_has8, _Set_toArray as _Set_toArray4, _Str_contains as _Str_contains4, _Str_endsWith as _Str_endsWith3, _Str_join as _Str_join9, _Str_length as _Str_length9, _Str_slice as _Str_slice5, _Str_startsWith as _Str_startsWith9, _curry as _curry23, and as and17, length as length17, map as map15, or as or14 } from "@mochi/compiler/runtime";
var writtenQualsIn = _curry23(3, (te, local, acc) => ((_v) => _v._tag === "TyName" ? acc : _v._tag === "TyLit" ? acc : _v._tag === "TyArrow" ? (({ from, to }) => writtenQualsIn(to, local, writtenQualsIn(from, local, acc)))(_v) : _v._tag === "TyApp" ? (({ args }) => writtenQualsInAll(args, local, acc, 0))(_v) : _v._tag === "TyTuple" ? (({ elems }) => writtenQualsInAll(elems, local, acc, 0))(_v) : _v._tag === "TyList" ? (({ elem }) => writtenQualsIn(elem, local, acc))(_v) : _v._tag === "TyUnion" ? (({ members }) => writtenQualsInAll(members, local, acc, 0))(_v) : _v._tag === "TyQual" ? (({ alias, name, args }) => ((acc1) => writtenQualsInAll(args, local, acc1, 0))(or14(_Set_has8(name, local), _Map_has7(name, acc)) ? acc : _Map_set10(name, `${alias}.${name}`, acc)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(te));
var writtenQualsInAll = _curry23(4, (tes, local, acc, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: te }) => writtenQualsInAll(tes, local, writtenQualsIn(te, local, acc), i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, tes)));
var ctorQualsFrom = _curry23(4, (ctors, local, acc, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: c }) => ctorQualsFrom(ctors, local, writtenQualsInAll(map15((f) => f.fieldType, c.fields), local, acc, 0), i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, ctors)));
var writtenQualsFrom = _curry23(4, (stmts, local, acc, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SExtern" ? (({ value: { typeExpr: te } }) => writtenQualsFrom(stmts, local, writtenQualsIn(te, local, acc), i + 1))(_v) : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { annot } }) => writtenQualsFrom(stmts, local, ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: te }) => writtenQualsIn(te, local, acc))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(annot), i + 1))(_v) : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { ctors, alias, aliasType } }) => ((acc1) => ((acc2) => ((acc3) => writtenQualsFrom(stmts, local, acc3, i + 1))(((_v) => _v._tag === "None" ? acc2 : _v._tag === "Some" ? (({ value: te }) => writtenQualsIn(te, local, acc2))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(aliasType)))(((_v) => _v._tag === "None" ? acc1 : _v._tag === "Some" ? (({ value: fields }) => writtenQualsInAll(map15((f) => f.fieldType, fields), local, acc1, 0))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(alias)))(ctorQualsFrom(ctors, local, acc, 0)))(_v) : _v._tag === "Some" ? writtenQualsFrom(stmts, local, acc, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, stmts)));
var qualifyRow = _curry23(2, (row, qualify) => ((_v) => _v._tag === "RowEmpty" ? RowEmpty : _v._tag === "RowVar" ? (({ id }) => RowVar(id))(_v) : _v._tag === "RowExtend" ? (({ label, fieldType, optional, rest }) => RowExtend(label, qualifyTy(fieldType, qualify), optional, qualifyRow(rest, qualify)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(row));
var qualifyTy = _curry23(2, (t, qualify) => ((_v) => _v._tag === "TyVar" ? (({ id }) => TyVar(id))(_v) : _v._tag === "TyCon" ? (({ name, args }) => TyCon(_Map_getOr8(name, name, qualify), map15((a) => qualifyTy(a, qualify), args)))(_v) : _v._tag === "TyFn" ? (({ from, to }) => TyFn(qualifyTy(from, qualify), qualifyTy(to, qualify)))(_v) : _v._tag === "TyRecord" ? (({ row }) => TyRecord(qualifyRow(row, qualify)))(_v) : _v._tag === "TySingleton" ? (({ base, value }) => TySingleton(base, value))(_v) : _v._tag === "TyOneOf" ? (({ members }) => TyOneOf(map15((m) => qualifyTy(m, qualify), members)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(t));
var qualifyTe2 = _curry23(2, (te, qualify) => ((_v) => _v._tag === "TyName" ? (({ name, span }) => TyName(_Map_getOr8(name, name, qualify), span))(_v) : _v._tag === "TyArrow" ? (({ from, to, span }) => TyArrow(qualifyTe2(from, qualify), qualifyTe2(to, qualify), span))(_v) : _v._tag === "TyApp" ? (({ ctor, args, span }) => TyApp(_Map_getOr8(ctor, ctor, qualify), map15((a) => qualifyTe2(a, qualify), args), span))(_v) : _v._tag === "TyTuple" ? (({ elems, span }) => TyTuple(map15((e) => qualifyTe2(e, qualify), elems), span))(_v) : _v._tag === "TyList" ? (({ elem, span }) => TyList(qualifyTe2(elem, qualify), span))(_v) : _v._tag === "TyQual" ? (({ alias, name, nameSpan, args, span }) => TyQual(alias, name, nameSpan, map15((a) => qualifyTe2(a, qualify), args), span))(_v) : _v._tag === "TyLit" ? (({ value, span }) => TyLit(value, span))(_v) : _v._tag === "TyUnion" ? (({ members, span }) => TyUnion(map15((m) => qualifyTe2(m, qualify), members), span))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(te));
var qualifyField2 = _curry23(2, (f, qualify) => ({ name: f.name, fieldType: qualifyTe2(f.fieldType, qualify) }));
var qualifyCtor = _curry23(2, (c, qualify) => ({ name: c.name, fields: map15((f) => qualifyField2(f, qualify), c.fields), span: c.span }));
var qualifyAliasField = _curry23(2, (f, qualify) => ({ name: f.name, nameSpan: f.nameSpan, fieldType: qualifyTe2(f.fieldType, qualify), optional: f.optional }));
var typeDeclsFrom = _curry23(6, (stmts, aliases, recs, qualify, docs, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { name, params, ctors, alias, aliasType, doc } }) => ((rest) => ((docComment) => ((_v) => _v._tag === "Some" ? (({ value: fields }) => _Array_prepend10(`${docComment}${recordAliasDecl(name, params, map15((f) => qualifyAliasField(f, qualify), fields), aliases, withoutOwnShape(fields, params, aliases, recs))}`, rest))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: te }) => _Array_prepend10(`${docComment}${aliasTsDecl(name, params, qualifyTe2(te, qualify), aliases, recs)}`, rest))(_v) : _v._tag === "None" ? length17(ctors) === 0 ? _Array_prepend10(`${docComment}${opaqueTypeDecl(name)}`, rest) : _Array_prepend10(`${docComment}${typeDecl(name, params, map15((c) => qualifyCtor(c, qualify), ctors), aliases, recs)}`, rest) : (() => {
  throw new Error("non-exhaustive match");
})())(aliasType) : (() => {
  throw new Error("non-exhaustive match");
})())(alias))(docs ? jsDoc(doc) : ""))(typeDeclsFrom(stmts, aliases, recs, qualify, docs, i + 1)))(_v) : _v._tag === "Some" ? typeDeclsFrom(stmts, aliases, recs, qualify, docs, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, stmts)));
var localAliasKeys = _curry23(3, (stmts, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value._tag === "SType" ? (({ value: { name, alias, aliasType } }) => localAliasKeys(stmts, i + 1, or14(_Option_isSome6(alias), _Option_isSome6(aliasType)) ? _Array_append17(name, acc) : acc))(_v) : _v._tag === "Some" ? localAliasKeys(stmts, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, stmts)));
var bindingDeclsFrom = _curry23(10, (stmts, env, aliases, keys, recs, qualify, docs, dtsHooks, bindingHooks, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { name, value, doc } }) => ((rest) => ((decl) => _Str_startsWith9("$", name) ? rest : ((_v) => _v._tag === "None" ? rest : _v._tag === "Some" ? (({ value: sc }) => ((ty) => _Array_prepend10(decl(_Option_unwrapOr14(bindingTsType({ vars: sc.vars, rvars: sc.rvars, ty: foldAliasesAt(ty, keys, aliases) }, value, recs, bindingHooks), runDtsHooks(dtsHooks, name, value, ty, tsApiFor(recs)))), rest))(qualifyTy(sc.ty, qualify)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get12(name, env)))((ts) => `${docs ? jsDoc(doc) : ""}export declare const ${name}: ${ts};`))(bindingDeclsFrom(stmts, env, aliases, keys, recs, qualify, docs, dtsHooks, bindingHooks, i + 1)))(_v) : _v._tag === "Some" ? bindingDeclsFrom(stmts, env, aliases, keys, recs, qualify, docs, dtsHooks, bindingHooks, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, stmts)));
var builtinDeclsFor2 = _curry23(4, (names, aliases, recs, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: bt }) => ((rest) => _Array_contains6(bt.name, names) ? _Array_prepend10(typeDecl(bt.name, bt.params, bt.ctors, aliases, recs), rest) : rest)(builtinDeclsFor2(names, aliases, recs, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, builtinTypeDecls)));
var mochiDtsSpec = (from) => {
  const bare = _Str_endsWith3(".mochi", from) ? _Str_slice5(0, _Str_length9(from) - 6, from) : from;
  return or14(_Str_startsWith9("./", bare), _Str_startsWith9("../", bare)) ? `${bare}.mochi` : from;
};
var nsTypeImportsFrom = _curry23(4, (stmts, body, seen, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" && _v.value._tag === "SImportNs" ? (({ value: { alias, from } }) => or14(_Set_has8(alias.name, seen), !_Str_contains4(`${alias.name}.`, body)) ? nsTypeImportsFrom(stmts, body, seen, i + 1) : _Array_prepend10(`import type * as ${alias.name} from "${mochiDtsSpec(from)}";`, nsTypeImportsFrom(stmts, body, _Set_add9(alias.name, seen), i + 1)))(_v) : _v._tag === "Some" ? nsTypeImportsFrom(stmts, body, seen, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, stmts)));
var blankNonLocal = _curry23(4, (keys, recs, locals, i) => ((_v) => _v._tag === "None" ? recs : _v._tag === "Some" ? (({ value: k }) => ((_v) => _v._tag === "None" ? blankNonLocal(keys, recs, locals, i + 1) : _v._tag === "Some" ? (({ value: name }) => blankNonLocal(keys, and17(name !== "", !_Set_has8(name, locals)) ? _Map_set10(k, "", recs) : recs, locals, i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get12(k, recs)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, keys)));
var declarationRecs = _curry23(2, (stmts, aliases) => {
  const locals = nullaryLocalNames(stmts, 0, _Set_fromArray9([]));
  const indexed = recordAliasIndex(aliases);
  return blankNonLocal(_Map_keys12(indexed), withoutAmbiguousAlias(indexed, aliases, locals), locals, 0);
});
var qualConRecs = _curry23(5, (keys, qualify, aliases, recs, i) => ((_v) => _v._tag === "None" ? recs : _v._tag === "Some" ? (({ value: name }) => qualConRecs(keys, qualify, aliases, ((_v) => _v._tag === "None" ? recs : _v._tag === "Some" ? (({ value: qual }) => ((_v) => _v._tag === "None" ? recs : _v._tag === "Some" ? (({ value: info }) => ((_v) => _v._tag === "Some" ? recs : _v._tag === "None" ? and17(length17(info.fields) > 0, !_Map_has7(name, recs)) ? _Map_set10(name, qual, recs) : recs : (() => {
  throw new Error("non-exhaustive match");
})())(info.expr))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get12(qual, aliases)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get12(name, qualify)), i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, keys)));
var emitDtsFromTypedWith = _curry23(8, (stmts, env, aliases, qualify, runtimeImport, docs, dtsHooks, bindingHooks) => {
  const local = declaredTypeNames(stmts, 0, _Set_fromArray9([]));
  const quals = writtenQualsFrom(stmts, local, qualify, 0);
  const recs = qualConRecs(_Map_keys12(quals), quals, aliases, declarationRecs(stmts, aliases), 0);
  const types = typeDeclsFrom(stmts, aliases, recs, quals, docs, 0);
  const bindings = bindingDeclsFrom(stmts, env, aliases, localAliasKeys(stmts, 0, []), recs, quals, docs, dtsHooks, bindingHooks, 0);
  const declared = declaredTypeNames(stmts, 0, _Set_fromArray9([]));
  const wanted = referencedCons(stmts, env, 0, _Set_fromArray9([]));
  const core = _Str_join9(`
`, _Array_concat12(types, bindings));
  const builtinNames = builtinTypeNamesFor(declared, wanted, core, 0);
  const body = `${_Str_join9(`
`, _Array_concat12(builtinDeclsFor2(builtinNames, aliases, recs, 0), _Array_concat12(types, bindings)))}
`;
  const curry = _Str_contains4("_Curry<", body) ? [`import type { _Curry } from "${runtimeImport}";`] : [];
  const imports = _Array_concat12(curry, nsTypeImportsFrom(stmts, body, _Set_fromArray9([]), 0));
  return length17(imports) === 0 ? body : `${_Str_join9(`
`, imports)}
${body}`;
});
var addQuals = _curry23(5, (alias, names, local, acc, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: name }) => addQuals(alias, names, local, or14(_Set_has8(name, local), _Map_has7(name, acc)) ? acc : _Map_set10(name, `${alias}.${name}`, acc), i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, names)));
var qualsFromAliases = _curry23(5, (aliases, quals, local, acc, i) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: alias }) => ((_v) => _v._tag === "None" ? qualsFromAliases(aliases, quals, local, acc, i + 1) : _v._tag === "Some" ? (({ value: scope }) => qualsFromAliases(aliases, quals, local, addQuals(alias, _Set_toArray4(scope.types), local, acc, 0), i + 1))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get12(alias, quals)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get20(i, aliases)));
var qualifierMapOf = _curry23(2, (quals, local) => qualsFromAliases(_Map_keys12(quals), quals, local, new Map, 0));
var emitDtsFromTyped = _curry23(5, (stmts, env, aliases, qualify, runtimeImport) => emitDtsFromTypedWith(stmts, env, aliases, qualify, runtimeImport, true, [], bindingHooksFor(None22)));
var emitDtsTextWith = _curry23(3, (src, runtimeImport, opts) => _Result_map8(([stmts, r]) => emitDtsFromTypedWith(stmts, r.env, r.aliases, new Map, runtimeImport, opts.docs, dtsHooksFor(opts.plugins), bindingHooksFor(opts.plugins)), typedProgramWith(src, opts)));
var emitDtsText = _curry23(2, (src, runtimeImport) => emitDtsTextWith(src, runtimeImport, defaultOpts));
var compileTargetsWith = _curry23(3, (src, runtimeImport, opts) => _Result_map8(([stmts, r]) => ({ js: emitJsWith(stmts, opts), ts: emitTsWith(stmts, r, runtimeImport, opts), dts: emitDtsFromTypedWith(stmts, r.env, r.aliases, new Map, runtimeImport, opts.docs, dtsHooksFor(opts.plugins), bindingHooksFor(opts.plugins)) }), typedProgramWith(src, opts)));
export {
  compile,
  compileTargetsWith,
  compileTs,
  compileTsWith,
  compileWith,
  defaultOpts,
  emitDtsTextWith,
  emitJsWith,
  emitTsWith,
  inferTypes,
  inferTypesRecoveringWith,
  inferTypesWith,
  nominalTypeName2 as nominalTypeName,
  openDirective,
  openMode,
  runtimeAnnotation,
  symbolIndexSync,
  typedProgram,
  typedProgramWith
};
