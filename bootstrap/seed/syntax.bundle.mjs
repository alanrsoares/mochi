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
      {
        const $recur0 = j + 1;
        const $recur1 = _Array_append3(cellAt(a, b, i, j, prev, cur), cur);
        j = $recur0;
        cur = $recur1;
        continue;
      }
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
      {
        const $recur0 = i + 1;
        const $recur1 = fillRow(a, b, i, prev, n);
        i = $recur0;
        prev = $recur1;
        continue;
      }
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
var DVerbatim = (s) => ({ _tag: "DVerbatim", s });
var DLine = _curry6(2, (hard, soft) => ({ _tag: "DLine", hard, soft }));
var DCat = (parts) => ({ _tag: "DCat", parts });
var DIndent = (doc) => ({ _tag: "DIndent", doc });
var DGroup = _curry6(2, (doc, breaks) => ({ _tag: "DGroup", doc, breaks }));
var DLineSuffix = (doc) => ({ _tag: "DLineSuffix", doc });
var DBreakParent = { _tag: "DBreakParent" };
var INDENT = 2;
var txt = (s) => DText(s);
var verbatim = (s) => DVerbatim(s);
var cat = (parts) => DCat(parts);
var line = DLine(false, false);
var softline = DLine(false, true);
var hardline = DLine(true, false);
var breakParent = DBreakParent;
var indent = (doc) => DIndent(doc);
var group = (doc) => DGroup(doc, forcesBreak(doc));
var lineSuffix = (doc) => DLineSuffix(doc);
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
var flat = (d) => render(d, 1e9);

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
var inferJsxArrElems = _curry7(3, (elements, st, inferExpr) => ((_v) => _v.length === 0 ? Ok3(st) : _v.length >= 1 ? (([el, ...rest]) => _Result_flatMap2(([, st1]) => inferJsxArrElems(rest, st1, inferExpr), inferExpr(seqElemExpr(el), st)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(elements));
var inferJsxChildren = _curry7(3, (children, st, inferExpr) => ((_v) => _v.length === 0 ? Ok3(st) : _v.length >= 1 && _v[0]._tag === "EArr" ? (([{ elements }, ...rest]) => _Result_flatMap2((st1) => inferJsxChildren(rest, st1, inferExpr), inferJsxArrElems(elements, st, inferExpr)))(_v) : _v.length >= 1 ? (([child, ...rest]) => _Result_flatMap2(([, st1]) => inferJsxChildren(rest, st1, inferExpr), inferExpr(child, st)))(_v) : (() => {
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
var inferIntrinsicFields = _curry7(5, (tag, fields, st, api, schema) => ((_v) => _v.length === 0 ? Ok3(st) : _v.length >= 1 ? (([f, ...rest]) => ((cont) => ((_v) => _v._tag === "Some" ? (({ value: msg }) => jxTypeErr(msg, jxExprSpan(f.value)))(_v) : _v._tag === "None" ? or5(_Str_startsWith2("data-", f.name), _Str_startsWith2("aria-", f.name)) ? _Result_flatMap2(([valT, st1]) => cont(noteProp(f, valT, st1)), api.inferExpr(f.value, st)) : ((_v) => _v._tag === "None" ? _Result_flatMap2(([valT, st1]) => cont(noteProp(f, valT, st1)), api.inferExpr(f.value, st)) : _v._tag === "Some" ? (({ value: m }) => ((expected) => ((_v) => _v._tag === "None" ? unknownProp(tag, f.name, f.value, m) : _v._tag === "Some" ? (({ value: kind }) => kind === "event" ? checkHandler(f.name, f.value, st, api, (st1) => cont(noteProp(f, handlerType, st1))) : kind === "any" ? _Result_flatMap2(([, st1]) => cont(noteProp(f, tPrim("any"), st1)), api.inferExpr(f.value, st)) : ((_v) => _v._tag === "Some" ? (({ value: expectedT }) => _Result_flatMap2(([valT, st1]) => _Result_flatMap2((st2) => cont(noteProp(f, expectedT, st2)), api.unify(valT, expectedT, st1, jxExprSpan(f.value))), api.inferExpr(f.value, st)))(_v) : _v._tag === "None" ? _Result_flatMap2(([, st1]) => cont(st1), api.inferExpr(f.value, st)) : (() => {
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
var inferFragmentFields = _curry7(3, (fields, st, api) => match(fields).with((_v) => _v.length === 0, () => Ok3(st)).with((_v) => _v.length >= 1, ([f, ...rest]) => f.name === "key" ? _Result_flatMap2(([, st1]) => inferFragmentFields(rest, st1, api), api.inferExpr(f.value, st)) : jxTypeErr(`JSX fragments only accept the 'key' prop, got '${f.name}'`, jxExprSpan(f.value))).otherwise(() => {
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
var aliasRow = _curry9(6, (name, info, args, st, aliases, expanding) => _Set_has(name, expanding) ? _tuple4(tCon(name, args), st) : ((_v) => _v._tag === "Some" ? (({ value: te }) => (([local, st1]) => (([t, , st2]) => _tuple4(t, st2))(typeExprToType(te, local, st1, aliases, _Set_add(name, expanding))))(aliasLocalVarsFrom(info.params, args, st)))(_v) : _v._tag === "None" ? (([local, st1]) => {
  const next = _Set_add(name, expanding);
  return (([row, st2]) => _tuple4(tRecord(row), st2))(aliasFieldsFrom(info.fields, local, st1, aliases, next));
})(aliasLocalVarsFrom(info.params, args, st)) : (() => {
  throw new Error("non-exhaustive match");
})())(info.expr));
var pvarsFrom = _curry9(2, (params, st) => match3(params).with((_v) => _v.length === 0, () => _tuple4(new Map, [], st)).with((_v) => _v.length >= 1, ([p, ...rest]) => (([v, st1]) => (([restMap, restVars, st2]) => _tuple4(_Map_set3(p, v, restMap), _Array_prepend3(v, restVars), st2))(pvarsFrom(rest, st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var ctorFieldsArrowFrom = _curry9(5, (fields, pvars, st, aliases, result) => ((_v) => _v.length === 0 ? _tuple4(result, st) : _v.length >= 1 ? (([fld, ...rest]) => (([ft, , st1]) => (([restT, st2]) => _tuple4(tArrow(ft, restT), st2))(ctorFieldsArrowFrom(rest, pvars, st1, aliases, result)))(typeExprToType(fld.fieldType, pvars, st, aliases, _Set_fromArray([]))))(_v) : (() => {
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
var inferArgs = _curry10(3, (args, st, inferExpr) => match4(args).with((_v) => _v.length === 0, () => Ok5(st)).with((_v) => _v.length >= 1, ([arg, ...rest]) => _Result_flatMap4(([, st1]) => inferArgs(rest, st1, inferExpr), inferExpr(arg, st))).otherwise(() => {
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
var formatHooksOf = (plugins) => ({ rewrite: formatHooksFrom(plugins, 0, []), layout: formatDocHooksFrom(plugins, 0, []) });
var formatHooksFor = (pluginsOpt) => formatHooksOf(resolvePluginsDefault(pluginsOpt));
var dtsHooksFrom = _curry11(3, (plugins, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: p }) => ((_v) => _v._tag === "Some" ? (({ value: hook }) => dtsHooksFrom(plugins, i + 1, _Array_append7(hook, acc)))(_v) : _v._tag === "None" ? dtsHooksFrom(plugins, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(p.dtsBinding))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get9(i, plugins)));
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
  return and8(lt.tok._tag === "TPipe", PIPE_BP >= minBp) ? _Result_flatMap5(([right, p]) => Ok7({ left: EPipe(left, right, false, spanning(exprSpan(left), exprSpan(right))), p, matched: true }), parseAtomOrCall(toks, pos + 1, hooks)) : and8(lt.tok._tag === "TTarrow", FAST_PIPE_BP >= minBp) ? _Result_flatMap5(([right, p]) => ((_v) => _v._tag === "ECall" ? (({ span: rightSpan }) => Ok7({ left: EPipe(left, right, true, spanning(exprSpan(left), rightSpan)), p, matched: true }))(_v) : errAt("fast pipe needs a call on the right, like `a -> f(b)`; use `|>` for a bare function or operator section, like `a |> f` or `a |> (+ 3)`", lt))(right), parseAtomOrCall(toks, pos + 1, hooks)) : and8(composeAt(toks, pos), COMPOSE_BP >= minBp) ? _Result_flatMap5(([right, p]) => ((opSpan) => ((xRef) => ((innerCall) => ((outerCall) => ((fn) => Ok7({ left: fn, p, matched: true }))(ELambda([LPName("$x", None11)], outerCall, spanning(exprSpan(left), exprSpan(right)))))(ECall(right, [innerCall], None11, spanning(exprSpan(left), exprSpan(right)))))(ECall(left, [xRef], None11, exprSpan(left))))(ERef("$x", opSpan)))({ start: lt.start, end: lt.start + 2 }), parseExprBp(toks, COMPOSE_BP + 1, pos + 2, hooks)) : and8(and8(isCmpTok(lt.tok), !composeAt(toks, pos)), CMP_BP >= minBp) ? tokAt(toks, pos + 1).tok._tag === "TRparen" ? Ok7({ left: sectionLeft(left, lt), p: pos + 1, matched: true }) : _Result_flatMap5(([right, p]) => ((opSpan) => ((inner) => ((result) => Ok7({ left: result, p, matched: true }))(lt.tok._tag === "TNeq" ? ECall(ERef("not", opSpan), [inner], None11, spanning(exprSpan(left), exprSpan(right))) : inner))(mkBinCall(cmpFnName(lt.tok), opSpan, left, right)))(spanOf(lt)), parseExprBp(toks, CMP_BP + 1, pos + 1, hooks)) : and8(or6(lt.tok._tag === "TAndand", lt.tok._tag === "TOror"), (lt.tok._tag === "TAndand" ? AND_BP : OR_BP) >= minBp) ? ((bp) => ((fnName) => binCallOrLeftSection(toks, left, lt, pos, bp, fnName, hooks))(lt.tok._tag === "TAndand" ? "and" : "or"))(lt.tok._tag === "TAndand" ? AND_BP : OR_BP) : and8(lt.tok._tag === "TConcat", CONCAT_BP >= minBp) ? binCallOrLeftSection(toks, left, lt, pos, CONCAT_BP, "concat", hooks) : and8(lt.tok._tag === "TBacktick", BACKTICK_BP >= minBp) ? _Result_flatMap5(([fnExpr, p1]) => _Result_flatMap5((p2) => _Result_flatMap5(([right, p3]) => Ok7({ left: ECall(fnExpr, [left, right], None11, spanning(exprSpan(left), exprSpan(right))), p: p3, matched: true }), parseExprBp(toks, BACKTICK_BP + 1, p2, hooks)), expectTok(TBacktick, toks, p1)), parseAtomOrCall(toks, pos + 1, hooks)) : and8(or6(lt.tok._tag === "TPlus", lt.tok._tag === "TMinus"), ADD_BP >= minBp) ? ((fnName) => binCallOrLeftSection(toks, left, lt, pos, ADD_BP, fnName, hooks))(lt.tok._tag === "TPlus" ? "add" : "sub") : and8(or6(lt.tok._tag === "TStar", or6(lt.tok._tag === "TSlash", lt.tok._tag === "TPercent")), MUL_BP >= minBp) ? ((fnName) => binCallOrLeftSection(toks, left, lt, pos, MUL_BP, fnName, hooks))(lt.tok._tag === "TStar" ? "mul" : lt.tok._tag === "TSlash" ? "div" : "mod") : Ok7({ left, p: pos, matched: false });
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
var parse = (toks) => parseWith(toks, None11);
var parseWith = _curry12(2, (toks, pluginsOpt) => {
  const r = parseRecovering(toks, pluginsOpt);
  return ((_v) => _v._tag === "Some" ? (({ value: d }) => Err7(d))(_v) : _v._tag === "None" ? Ok7(r.stmts) : (() => {
    throw new Error("non-exhaustive match");
  })())(_Array_get10(0, r.diagnostics));
});
import { None as None12, Some as Some12, _Array_append as _Array_append9, _Array_concat as _Array_concat6, _Array_find as _Array_find4, _Array_flatMap as _Array_flatMap3, _Array_get as _Array_get11, _Array_prepend as _Array_prepend5, _Array_sortBy, _Array_take as _Array_take2, _Map_delete, _Map_get as _Map_get4, _Map_keys as _Map_keys4, _Map_set as _Map_set4, _Option_contains as _Option_contains3, _Option_isNone, _Option_isSome as _Option_isSome2, _Option_unwrapOr as _Option_unwrapOr7, _Set_fromArray as _Set_fromArray2, _Set_has as _Set_has2, _Set_union, _Str_chars as _Str_chars2, _Str_codeAt as _Str_codeAt6, _Str_fromCode as _Str_fromCode2, _Str_get as _Str_get4, _Str_join as _Str_join5, _Str_length as _Str_length5, _Str_slice as _Str_slice3, _Str_split as _Str_split4, _Str_startsWith as _Str_startsWith3, _Str_toNumber as _Str_toNumber2, _Str_trim, _curry as _curry14, _tuple as _tuple7, and as and9, concat, eq as eq10, filter as filter4, floor as floor3, length as length11, map as map8, or as or7, reduce as reduce3, show as show5 } from "@mochi/compiler/runtime";

import { _Str_chars, _Str_join as _Str_join4, _curry as _curry13, length as length10, map as map7 } from "@mochi/compiler/runtime";
var escChar2 = (c) => ((_v) => _v === "\\" ? "\\\\" : _v === '"' ? "\\\"" : _v === `
` ? "\\n" : _v === "\t" ? "\\t" : c)(c);
var strLit = (s) => `"${_Str_join4("", map7(escChar2, _Str_chars(s)))}"`;
var joinWith = _curry13(3, (f, sep, tes) => _Str_join4(sep, map7(f, tes)));
var showTypeExpr = (te) => ((_v) => _v._tag === "TyName" ? (({ name }) => name === "unit" ? "()" : name)(_v) : _v._tag === "TyApp" ? (({ ctor, args }) => `${ctor}<${joinWith(showTypeExpr, ", ", args)}>`)(_v) : _v._tag === "TyTuple" ? (({ elems }) => `(${joinWith(showTypeExpr, ", ", elems)})`)(_v) : _v._tag === "TyList" ? (({ elem }) => `[${showTypeExpr(elem)}]`)(_v) : _v._tag === "TyQual" ? (({ alias, name, args }) => ((head) => length10(args) === 0 ? head : `${head}<${joinWith(showTypeExpr, ", ", args)}>`)(`${alias}.${name}`))(_v) : _v._tag === "TyLit" ? (({ value }) => strLit(value))(_v) : _v._tag === "TyUnion" ? (({ members }) => joinWith(parenArrow, " | ", members))(_v) : _v._tag === "TyArrow" ? (({ from, to }) => `${parenArrow(from)} -> ${showTypeExpr(to)}`)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(te);
var parenArrow = (te) => ((_v) => _v._tag === "TyArrow" ? `(${showTypeExpr(te)})` : showTypeExpr(te))(te);

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
    if (!Object.prototype.propertyIsEnumerable.call(y, k) || !eq(x[k], y[k]))
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

var escChar3 = (c) => ((_v) => _v === "\\" ? "\\\\" : _v === '"' ? "\\\"" : _v === `
` ? "\\n" : _v === "\t" ? "\\t" : c)(c);
var escFrom = _curry14(3, (chars, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value === "$" && _Option_contains3("{", _Array_get11(i + 1, chars)) ? escFrom(chars, i + 2, `${acc}\\\${`) : _v._tag === "Some" ? (({ value: c }) => escFrom(chars, i + 1, `${acc}${escChar3(c)}`))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(i, chars)));
var escStrBody = (s) => escFrom(_Str_chars2(s), 0, "");
var strLit2 = (s) => `"${escStrBody(s)}"`;
var WIDTH = 80;
var commaJoin = _curry14(2, (f, xs) => _Str_join5(", ", map8(f, xs)));
var patField = (f) => ((_v) => _v._tag === "PBind" && (({ name }) => eq10(name, f.label))(_v) ? (({ name }) => f.label)(_v) : `${f.label}: ${pattern(f.pat)}`)(f.pat);
var restOf = (rest) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: p }) => [`...${pattern(p)}`])(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(rest);
var pattern = (p) => ((_v) => _v._tag === "PAs" ? (({ pat: inner, name }) => `${pattern(inner)} as ${name}`)(_v) : _v._tag === "PWild" ? "_" : _v._tag === "PUnit" ? "()" : _v._tag === "PBind" ? (({ name }) => name)(_v) : _v._tag === "PLit" ? (({ raw }) => raw)(_v) : _v._tag === "PBool" ? (({ value }) => show5(value))(_v) : _v._tag === "PStr" ? (({ value }) => strLit2(value))(_v) : _v._tag === "PRecord" ? (({ fields }) => `{ ${commaJoin(patField, fields)} }`)(_v) : _v._tag === "PTuple" ? (({ elems }) => `(${commaJoin(pattern, elems)})`)(_v) : _v._tag === "PCtor" ? (({ ctor: ctorName, args, ns }) => ((head) => length11(args) === 0 ? head : `${head}(${commaJoin(pattern, args)})`)(((_v) => _v._tag === "None" ? ctorName : _v._tag === "Some" ? (({ value: alias }) => `${alias}.${ctorName}`)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(ns)))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => `[${_Str_join5(", ", _Array_concat6(map8(pattern, elems), restOf(rest)))}]`)(_v) : _v._tag === "PList" ? (({ elems, rest }) => `@{${_Str_join5(", ", _Array_concat6(map8(pattern, elems), restOf(rest)))}}`)(_v) : _v._tag === "POr" ? (({ alts }) => _Str_join5(" | ", map8(pattern, alts)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p);
var ctorField = (f) => ((_v) => _v._tag === "None" ? showTypeExpr(f.fieldType) : _v._tag === "Some" ? (({ value: name }) => `${name}: ${showTypeExpr(f.fieldType)}`)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(f.name);
var ctorText = (c) => length11(c.fields) === 0 ? c.name : `${c.name}(${commaJoin(ctorField, c.fields)})`;
var generics = (params) => length11(params) === 0 ? "" : `<${_Str_join5(", ", params)}>`;
var conventionOf = (module) => _Array_get11(0, filter4((c) => _Str_startsWith3(`mochi:${c}:`, module), ["global", "send", "get", "set", "new"]));
var externStmt = _curry14(6, (name, params, typeExpr, module, imported, curried) => {
  const head = `extern ${name}${generics(params)} : ${showTypeExpr(typeExpr)} = `;
  return ((_v) => _v._tag === "None" ? `${head}${curried ? "curried " : ""}${strLit2(module)} ${strLit2(imported)}` : _v._tag === "Some" ? (({ value: convention }) => ((first) => ((second) => `${head}${convention} ${strLit2(first)}${second}`)(imported === "" ? "" : ` ${strLit2(imported)}`))(_Str_slice3(_Str_length5(`mochi:${convention}:`), _Str_length5(module), module)))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(conventionOf(module));
});
var sepLine = cat([txt(","), line]);
var bracketed = _curry14(3, (open, close, items) => length11(items) === 0 ? txt(`${open}${close}`) : group(cat([txt(open), indent(cat([softline, join(sepLine, items)])), softline, txt(close)])));
var braced = _curry14(3, (open, close, items) => length11(items) === 0 ? txt(`${open}${close}`) : group(cat([txt(open), indent(cat([line, join(sepLine, items)])), line, txt(close)])));
var parenIf = _curry14(2, (cond, d) => cond ? cat([txt("("), d, txt(")")]) : d);
var loosePrefix = _curry14(2, (cts, e) => ((_v) => _v._tag === "ETernary" ? true : _v._tag === "EPipe" ? true : printsAsLambda(cts, e))(e));
var unspan = (p) => ((_v) => _v._tag === "LPSpanned" ? (({ param: inner }) => inner)(_v) : p)(p);
var exprSpan2 = (e) => ((_v) => _v._tag === "ENum" ? (({ span: sp }) => sp)(_v) : _v._tag === "EUnit" ? (({ span: sp }) => sp)(_v) : _v._tag === "EBool" ? (({ span: sp }) => sp)(_v) : _v._tag === "EStr" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERef" ? (({ span: sp }) => sp)(_v) : _v._tag === "ECall" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELambda" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELetIn" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELetBind" ? (({ span: sp }) => sp)(_v) : _v._tag === "EPipe" ? (({ span: sp }) => sp)(_v) : _v._tag === "EDo" ? (({ span: sp }) => sp)(_v) : _v._tag === "ETernary" ? (({ span: sp }) => sp)(_v) : _v._tag === "EMatch" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERecord" ? (({ span: sp }) => sp)(_v) : _v._tag === "EField" ? (({ span: sp }) => sp)(_v) : _v._tag === "ETuple" ? (({ span: sp }) => sp)(_v) : _v._tag === "EArr" ? (({ span: sp }) => sp)(_v) : _v._tag === "EList" ? (({ span: sp }) => sp)(_v) : _v._tag === "ESet" ? (({ span: sp }) => sp)(_v) : _v._tag === "EMap" ? (({ span: sp }) => sp)(_v) : _v._tag === "ELoop" ? (({ span: sp }) => sp)(_v) : _v._tag === "ERecur" ? (({ span: sp }) => sp)(_v) : _v._tag === "EInterp" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e);
var noComments = { leading: new Map, trailing: new Map, flatArity: new Map, shadowed: _Set_fromArray2([]), etaSkip: false, formatHooks: [], formatDocHooks: [], commentStarts: [], src: "" };
var spanKey = _curry14(2, (kind, sp) => `${kind}:${show5(sp.start)}:${show5(sp.end)}`);
var STMT = "s";
var EXPR = "e";
var CTOR = "c";
var atKey = _curry14(2, (table, key) => ((_v) => _v._tag === "Some" ? (({ value: cs }) => cs)(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get4(key, table)));
var pushAt = _curry14(3, (key, c, table) => _Map_set4(key, _Array_append9(c, atKey(table, key)), table));
var lineEndFrom = _curry14(2, (src, i) => ((_v) => _v._tag === "None" ? i : _v._tag === "Some" && _v.value === `
` ? i : _v._tag === "Some" ? lineEndFrom(src, i + 1) : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_get4(i, src)));
var trimEndFrom = _curry14(2, (s, n) => n === 0 ? "" : ((_v) => _v._tag === "Some" && _v.value === 32 ? trimEndFrom(s, n - 1) : _v._tag === "Some" && _v.value === 9 ? trimEndFrom(s, n - 1) : _v._tag === "Some" && _v.value === 13 ? trimEndFrom(s, n - 1) : _Str_slice3(0, n, s))(_Str_codeAt6(n - 1, s)));
var trimEnd = (s) => trimEndFrom(s, _Str_length5(s));
var commentAt = _curry14(3, (src, i, end) => {
  const lineEnd = lineEndFrom(src, end + 1);
  return { start: i, end, text: trimEnd(_Str_slice3(i, end, src)), blankAfter: _Str_trim(_Str_slice3(end + 1, lineEnd, src)) === "", trailing: false };
});
var scanComments = _curry14(4, (src, i, lineHasToken, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value === `
` ? scanComments(src, i + 1, false, acc) : _v._tag === "Some" && _v.value === " " ? scanComments(src, i + 1, lineHasToken, acc) : _v._tag === "Some" && _v.value === "\t" ? scanComments(src, i + 1, lineHasToken, acc) : _v._tag === "Some" && eq10(_Str_codeAt6(i, src), Some12(13)) ? scanComments(src, i + 1, lineHasToken, acc) : _v._tag === "Some" && _v.value === '"' ? ((_v) => _v._tag === "Some" ? (({ value: end }) => scanComments(src, end, true, acc))(_v) : _v._tag === "None" ? scanComments(src, i + 1, true, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(skipStringLiteral(src, i)) : _v._tag === "Some" && _v.value === "/" ? eq10(_Str_get4(i + 1, src), Some12("/")) ? ((end) => ((c) => scanComments(src, end, lineHasToken, _Array_append9({ ...c, trailing: lineHasToken }, acc)))(commentAt(src, i, end)))(lineEndFrom(src, i)) : scanComments(src, i + 1, true, acc) : _v._tag === "Some" ? scanComments(src, i + 1, true, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_get4(i, src)));
var collectComments = (src) => scanComments(src, 0, false, []);
var seqElemExpr2 = (el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => e)(_v) : _v._tag === "SESpread" ? (({ expr: e }) => e)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el);
var exprAnchors = (e) => _Array_append9({ kind: EXPR, sp: exprSpan2(e) }, ((_v) => _v._tag === "ECall" ? (({ fn, args }) => _Array_concat6(exprAnchors(fn), _Array_flatMap3(exprAnchors, args)))(_v) : _v._tag === "ELambda" ? (({ params, body }) => _Array_concat6(exprAnchors(body), _Array_flatMap3((p) => ((_v) => _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some" ? (({ defaultValue: { value: d } }) => exprAnchors(d))(_v) : [])(unspan(p)), params)))(_v) : _v._tag === "ELetIn" ? (({ value, body }) => _Array_concat6(exprAnchors(value), exprAnchors(body)))(_v) : _v._tag === "ELetBind" ? (({ value, body }) => _Array_concat6(exprAnchors(value), exprAnchors(body)))(_v) : _v._tag === "EPipe" ? (({ left, right }) => _Array_concat6(exprAnchors(left), exprAnchors(right)))(_v) : _v._tag === "EDo" ? (({ exprs }) => _Array_flatMap3(exprAnchors, exprs))(_v) : _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => _Array_concat6(exprAnchors(cond), _Array_concat6(exprAnchors(thenE), exprAnchors(elseE))))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => _Array_concat6(exprAnchors(scrutinee), _Array_flatMap3((a) => _Array_concat6(((_v) => _v._tag === "Some" ? (({ value: g }) => exprAnchors(g))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(a.guard), exprAnchors(a.body)), arms)))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => _Array_concat6(((_v) => _v._tag === "Some" ? (({ value: sp }) => exprAnchors(sp))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(spread), _Array_flatMap3((f) => exprAnchors(f.value), fields)))(_v) : _v._tag === "EField" ? (({ target }) => exprAnchors(target))(_v) : _v._tag === "ELoop" ? (({ params, body }) => _Array_concat6(_Array_flatMap3((prm) => exprAnchors(prm.init), params), exprAnchors(body)))(_v) : _v._tag === "ERecur" ? (({ args }) => _Array_flatMap3(exprAnchors, args))(_v) : _v._tag === "ETuple" ? (({ elements }) => _Array_flatMap3(exprAnchors, elements))(_v) : _v._tag === "EArr" ? (({ elements }) => _Array_flatMap3((el) => exprAnchors(seqElemExpr2(el)), elements))(_v) : _v._tag === "EList" ? (({ elements }) => _Array_flatMap3((el) => exprAnchors(seqElemExpr2(el)), elements))(_v) : _v._tag === "ESet" ? (({ elements }) => _Array_flatMap3((el) => exprAnchors(seqElemExpr2(el)), elements))(_v) : _v._tag === "EMap" ? (({ entries }) => _Array_flatMap3((en) => _Array_concat6(exprAnchors(en.key), exprAnchors(en.value)), entries))(_v) : _v._tag === "EInterp" ? (({ parts }) => _Array_flatMap3((prt) => ((_v) => _v._tag === "IPLit" ? [] : _v._tag === "IPExpr" ? (({ expr: ex }) => exprAnchors(ex))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(prt), parts))(_v) : [])(e));
var SPAN_SCALE = 1e7;
var anchorKey = (a) => a.sp.start * SPAN_SCALE - a.sp.end;
var sortAnchors = _Array_sortBy(anchorKey);
var anchorIndex = (sorted) => ({ byStart: sorted, byEnd: _Array_sortBy((a) => a.sp.end, sorted) });
var lowerBound = _curry14(5, (anchors, key, target, lo, hi) => lo >= hi ? lo : ((mid) => ((_v) => _v._tag === "Some" && (({ value: a }) => key(a) < target)(_v) ? (({ value: a }) => lowerBound(anchors, key, target, mid + 1, hi))(_v) : lowerBound(anchors, key, target, lo, mid))(_Array_get11(mid, anchors)))(floor3((lo + hi) / 2)));
var startOf = (a) => a.sp.start;
var endOf = (a) => a.sp.end;
var lineStartOf = _curry14(2, (src, i) => i <= 0 ? 0 : _Option_contains3(`
`, _Str_get4(i - 1, src)) ? i : lineStartOf(src, i - 1));
var trailedBy = _curry14(3, (idx, c, src) => {
  const n = length11(idx.byEnd);
  const past = lowerBound(idx.byEnd, endOf, c.start + 1, 0, n);
  return ((_v) => _v._tag === "Some" && (({ value: last }) => last.sp.end >= lineStartOf(src, c.start))(_v) ? (({ value: last }) => _Array_get11(lowerBound(idx.byEnd, endOf, last.sp.end, 0, n), idx.byEnd))(_v) : None12)(_Array_get11(past - 1, idx.byEnd));
});
var leadTarget = _curry14(2, (idx, c) => _Array_get11(lowerBound(idx.byStart, startOf, c.end, 0, length11(idx.byStart)), idx.byStart));
var attachOne = _curry14(4, (idx, src, c, tbl) => {
  const trailed = c.trailing ? trailedBy(idx, c, src) : None12;
  return ((_v) => _v._tag === "Some" ? (({ value: a }) => Some12({ ...tbl, trailing: pushAt(spanKey(a.kind, a.sp), c, tbl.trailing) }))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "None" ? None12 : _v._tag === "Some" ? (({ value: a }) => Some12({ ...tbl, leading: pushAt(spanKey(a.kind, a.sp), c, tbl.leading) }))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(leadTarget(idx, c)) : (() => {
    throw new Error("non-exhaustive match");
  })())(trailed);
});
var attachFrom = _curry14(5, (comments, i, idx, src, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: c }) => attachFrom(comments, i + 1, idx, src, ((_v) => _v._tag === "Some" ? (({ value: table }) => ({ table, tail: acc.tail }))(_v) : _v._tag === "None" ? { table: acc.table, tail: _Array_append9(c, acc.tail) } : (() => {
  throw new Error("non-exhaustive match");
})())(attachOne(idx, src, c, acc.table))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(i, comments)));
var commentsForExpr = _curry14(2, (src, e) => attachFrom(collectComments(src), 0, anchorIndex(sortAnchors(exprAnchors(e))), src, { table: noComments, tail: [] }).table);
var leadingDocs = _curry14(3, (cts, kind, sp) => _Array_flatMap3((c) => c.blankAfter ? [txt(c.text), hardline, hardline] : [txt(c.text), hardline], atKey(cts.leading, spanKey(kind, sp))));
var trailingDocs = _curry14(3, (cts, kind, sp) => _Array_flatMap3((c) => [lineSuffix(txt(` ${c.text}`)), breakParent], atKey(cts.trailing, spanKey(kind, sp))));
var hasLead = _curry14(3, (cts, kind, sp) => length11(atKey(cts.leading, spanKey(kind, sp))) > 0);
var withComments = _curry14(4, (cts, kind, sp, doc) => {
  const lead = leadingDocs(cts, kind, sp);
  const trail = trailingDocs(cts, kind, sp);
  return and9(length11(lead) === 0, length11(trail) === 0) ? doc : cat([...lead, doc, ...trail]);
});
var curryArityFrom = _curry14(3, (def, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" ? (({ value: code }) => and9(code >= 48, code <= 57) ? curryArityFrom(def, i + 1, `${acc}${_Str_fromCode2(code)}`) : acc)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_codeAt6(i, def)));
var commaCountFrom = _curry14(3, (s, i, acc) => ((_v) => _v._tag === "None" ? acc : _v._tag === "Some" && _v.value === "," ? commaCountFrom(s, i + 1, acc + 1) : _v._tag === "Some" ? commaCountFrom(s, i + 1, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_get4(i, s)));
var indexOfFrom = _curry14(3, (needle, s, i) => i + _Str_length5(needle) > _Str_length5(s) ? -1 : eq10(_Str_slice3(i, i + _Str_length5(needle), s), needle) ? i : indexOfFrom(needle, s, i + 1));
var arityOfDef = (def) => {
  const curried = indexOfFrom("_curry(", def, 0);
  return curried >= 0 ? ((digits) => _Str_length5(digits) === 0 ? 0 : _Option_unwrapOr7(0, _Str_toNumber2(digits)))(curryArityFrom(def, curried + 7, "")) : ((open) => open < 0 ? 0 : ((close) => close < 0 ? 0 : ((params) => _Str_length5(params) === 0 ? 0 : commaCountFrom(params, 0, 1))(_Str_trim(_Str_slice3(open + 3, close, def))))(indexOfFrom(") =>", def, open)))(indexOfFrom("= (", def, 0));
};
var runtimeArityOf = (jsId) => ((_v) => _v._tag === "None" ? None12 : _v._tag === "Some" ? (({ value: def }) => ((n) => n >= 2 ? Some12(n) : None12)(arityOfDef(def)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get4(jsId, preludeJsDefs));
var namespaceArity = _curry14(3, (shadowed, target, member) => ((_v) => _v._tag === "ERef" ? (({ name: nsName }) => _Set_has2(nsName, shadowed) ? None12 : ((_v) => _v._tag === "None" ? None12 : _v._tag === "Some" ? (({ value: members }) => ((_v) => _v._tag === "None" ? None12 : _v._tag === "Some" ? (({ value: jsId }) => runtimeArityOf(jsId))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get4(member, members)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Map_get4(nsName, namespaceRuntime)))(_v) : None12)(target));
var labeledCount = (params) => length11(filter4((p) => ((_v) => _v._tag === "LPLabeled" ? true : false)(unspan(p)), params));
var jsArity = (params) => {
  const labs = labeledCount(params);
  return length11(params) - labs + (labs > 0 ? 1 : 0);
};
var collapsedArity = (e) => ((_v) => _v._tag === "ELambda" ? (({ params, body }) => jsArity(params) + collapsedArity(body))(_v) : 0)(e);
var patNames = (p) => ((_v) => _v._tag === "PBind" ? (({ name }) => [name])(_v) : _v._tag === "PAs" ? (({ pat: inner, name }) => _Array_append9(name, patNames(inner)))(_v) : _v._tag === "PTuple" ? (({ elems }) => _Array_flatMap3(patNames, elems))(_v) : _v._tag === "PRecord" ? (({ fields }) => _Array_flatMap3((f) => patNames(f.pat), fields))(_v) : _v._tag === "PCtor" ? (({ args }) => _Array_flatMap3(patNames, args))(_v) : _v._tag === "PArr" ? (({ elems, rest }) => _Array_concat6(_Array_flatMap3(patNames, elems), ((_v) => _v._tag === "Some" ? (({ value: r }) => patNames(r))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(rest)))(_v) : _v._tag === "PList" ? (({ elems, rest }) => _Array_concat6(_Array_flatMap3(patNames, elems), ((_v) => _v._tag === "Some" ? (({ value: r }) => patNames(r))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(rest)))(_v) : _v._tag === "POr" ? (({ alts }) => _Array_flatMap3(patNames, alts))(_v) : [])(p);
var paramNames = (p) => ((_v) => _v._tag === "LPName" ? (({ name }) => [name])(_v) : _v._tag === "LPLabeled" ? (({ name }) => [name])(_v) : _v._tag === "LPTuple" ? (({ names }) => names)(_v) : _v._tag === "LPRecord" ? (({ fields }) => fields)(_v) : [])(unspan(p));
var innerNames = (e) => ((_v) => _v._tag === "ELambda" ? (({ params, body }) => _Array_concat6(_Array_flatMap3(paramNames, params), _Array_concat6(innerNames(body), _Array_flatMap3((p) => ((_v) => _v._tag === "LPLabeled" && _v.defaultValue._tag === "Some" ? (({ defaultValue: { value: d } }) => innerNames(d))(_v) : [])(unspan(p)), params))))(_v) : _v._tag === "ELetIn" ? (({ name, value, body }) => _Array_append9(name, _Array_concat6(innerNames(value), innerNames(body))))(_v) : _v._tag === "ELetBind" ? (({ param, value, body }) => _Array_concat6(paramNames(param), _Array_concat6(innerNames(value), innerNames(body))))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => _Array_concat6(innerNames(scrutinee), _Array_flatMap3((a) => _Array_concat6(patNames(a.pattern), _Array_concat6(((_v) => _v._tag === "Some" ? (({ value: g }) => innerNames(g))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(a.guard), innerNames(a.body))), arms)))(_v) : _v._tag === "ELoop" ? (({ params, body }) => _Array_concat6(map8((p) => p.name, params), _Array_concat6(_Array_flatMap3((p) => innerNames(p.init), params), innerNames(body))))(_v) : _v._tag === "ECall" ? (({ fn, args }) => _Array_concat6(innerNames(fn), _Array_flatMap3(innerNames, args)))(_v) : _v._tag === "EPipe" ? (({ left: l, right: r }) => _Array_concat6(innerNames(l), innerNames(r)))(_v) : _v._tag === "EDo" ? (({ exprs }) => _Array_flatMap3(innerNames, exprs))(_v) : _v._tag === "ETernary" ? (({ cond: c, thenE: t, elseE: f }) => _Array_concat6(innerNames(c), _Array_concat6(innerNames(t), innerNames(f))))(_v) : _v._tag === "ERecord" ? (({ fields, spread }) => _Array_concat6(((_v) => _v._tag === "Some" ? (({ value: s }) => innerNames(s))(_v) : _v._tag === "None" ? [] : (() => {
  throw new Error("non-exhaustive match");
})())(spread), _Array_flatMap3((f) => innerNames(f.value), fields)))(_v) : _v._tag === "EField" ? (({ target }) => innerNames(target))(_v) : _v._tag === "ETuple" ? (({ elements: els }) => _Array_flatMap3(innerNames, els))(_v) : _v._tag === "EArr" ? (({ elements: els }) => _Array_flatMap3((el) => innerNames(seqElemExpr2(el)), els))(_v) : _v._tag === "EList" ? (({ elements: els }) => _Array_flatMap3((el) => innerNames(seqElemExpr2(el)), els))(_v) : _v._tag === "ESet" ? (({ elements: els }) => _Array_flatMap3((el) => innerNames(seqElemExpr2(el)), els))(_v) : _v._tag === "EMap" ? (({ entries }) => _Array_flatMap3((en) => _Array_concat6(innerNames(en.key), innerNames(en.value)), entries))(_v) : _v._tag === "ERecur" ? (({ args }) => _Array_flatMap3(innerNames, args))(_v) : _v._tag === "EInterp" ? (({ parts }) => _Array_flatMap3((p) => ((_v) => _v._tag === "IPLit" ? [] : _v._tag === "IPExpr" ? (({ expr: ex }) => innerNames(ex))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(p), parts))(_v) : [])(e);
var stmtInnerNames = (s) => ((_v) => _v._tag === "SLet" ? (({ value }) => innerNames(value))(_v) : _v._tag === "SExpr" ? (({ value }) => innerNames(value))(_v) : _v._tag === "SImport" ? (({ names }) => map8((n) => n.name, names))(_v) : _v._tag === "SImportNs" ? (({ alias }) => [alias.name])(_v) : [])(s);
var topLevelNames = (stmts) => _Array_flatMap3((s) => ((_v) => _v._tag === "SLet" ? (({ name }) => [name])(_v) : _v._tag === "SExtern" ? (({ name }) => [name])(_v) : [])(s), stmts);
var preludeArity = (innerBound) => reduce3(_curry14(2, (acc, name) => _Set_has2(name, innerBound) ? acc : ((_v) => _v._tag === "Some" ? (({ value: n }) => _Map_set4(name, n, acc))(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(runtimeArityOf(name))), new Map, _Map_keys4(preludeJsDefs));
var withLetArities = _curry14(3, (stmts, innerBound, base) => reduce3(_curry14(2, (acc, s) => ((_v) => _v._tag === "SLet" ? (({ name, value }) => _Set_has2(name, innerBound) ? _Map_delete(name, acc) : ((n) => n >= 2 ? _Map_set4(name, n, acc) : _Map_delete(name, acc))(collapsedArity(value)))(_v) : _v._tag === "SExtern" ? (({ name }) => _Map_delete(name, acc))(_v) : acc)(s)), base, stmts));
var buildFlatArity = _curry14(2, (stmts, innerBound) => withLetArities(stmts, innerBound, preludeArity(innerBound)));
var isInert = (e) => ((_v) => _v._tag === "ERef" ? true : _v._tag === "ENum" ? true : _v._tag === "EBool" ? true : _v._tag === "EStr" ? true : _v._tag === "EUnit" ? true : _v._tag === "EField" ? (({ target }) => isInert(target))(_v) : false)(e);
var mentionsRef = _curry14(2, (e, name) => ((_v) => _v._tag === "ERef" ? (({ name: n }) => eq10(n, name))(_v) : _v._tag === "EField" ? (({ target }) => mentionsRef(target, name))(_v) : false)(e));
var calleeArity = _curry14(2, (ctx, fn) => ((_v) => _v._tag === "ERef" ? (({ name }) => _Map_get4(name, ctx.flatArity))(_v) : _v._tag === "EField" ? (({ target, name: member }) => namespaceArity(ctx.shadowed, target, member))(_v) : None12)(fn));
var etaCalleeArity = _curry14(2, (ctx, fn) => ((_v) => _v._tag === "ERef" ? (({ name }) => _Set_has2(name, ctx.shadowed) ? None12 : runtimeArityOf(name))(_v) : _v._tag === "EField" ? (({ target, name: member }) => namespaceArity(ctx.shadowed, target, member))(_v) : None12)(fn));
var PIPE_PREC = 5;
var FAST_PIPE_PREC = 21;
var NEQ_PREC = 8;
var CONCAT_PREC = 10;
var binOpInfo = (name) => ((_v) => _v === "or" ? Some12({ symbol: "||", prec: 7 }) : _v === "and" ? Some12({ symbol: "&&", prec: 7 }) : _v === "eq" ? Some12({ symbol: "==", prec: 8 }) : _v === "lt" ? Some12({ symbol: "<", prec: 8 }) : _v === "lte" ? Some12({ symbol: "<=", prec: 8 }) : _v === "gt" ? Some12({ symbol: ">", prec: 8 }) : _v === "gte" ? Some12({ symbol: ">=", prec: 8 }) : _v === "concat" ? Some12({ symbol: "++", prec: 10 }) : _v === "add" ? Some12({ symbol: "+", prec: 10 }) : _v === "sub" ? Some12({ symbol: "-", prec: 10 }) : _v === "mul" ? Some12({ symbol: "*", prec: 20 }) : _v === "div" ? Some12({ symbol: "/", prec: 20 }) : _v === "mod" ? Some12({ symbol: "%", prec: 20 }) : None12)(name);
var isLambdaExpr = (e) => ((_v) => _v._tag === "ELambda" ? true : false)(e);
var printsAsLambda = _curry14(2, (cts, e) => ((_v) => _v._tag === "ELambda" ? (({ params, body }) => or7(cts.etaSkip, _Option_isNone(etaPartial(cts, params, body))))(_v) : false)(e));
var isLambdaOrTernary = _curry14(2, (cts, e) => ((_v) => _v._tag === "ETernary" ? true : printsAsLambda(cts, e))(e));
var binOpFor = _curry14(2, (fn, args) => ((_v) => _v[0]._tag === "ERef" && _v[1].length === 2 ? (([{ name }]) => binOpInfo(name))(_v) : None12)(_tuple7(fn, args)));
var binOpOf = (e) => ((_v) => _v._tag === "ECall" ? (({ fn, args }) => binOpFor(fn, args))(_v) : None12)(e);
var unaryOpOf = (name) => ((_v) => _v === "not" ? Some12("!") : _v === "negate" ? Some12("-") : None12)(name);
var pipePrecOf = (e) => ((_v) => _v._tag === "EPipe" ? (({ fast }) => Some12(fast ? FAST_PIPE_PREC : PIPE_PREC))(_v) : None12)(e);
var neqFor = _curry14(2, (fn, args) => ((_v) => _v[0]._tag === "ERef" && _v[0].name === "not" && _v[1].length === 1 && _v[1][0]._tag === "ECall" && _v[1][0].fn._tag === "ERef" && _v[1][0].fn.name === "eq" && _v[1][0].args.length === 2 ? (([, [{ args: [l, r] }]]) => Some12(_tuple7(l, r)))(_v) : None12)(_tuple7(fn, args)));
var neqOperands = (e) => ((_v) => _v._tag === "ECall" ? (({ fn, args }) => neqFor(fn, args))(_v) : None12)(e);
var infixPrec = (e) => ((_v) => _v._tag === "Some" ? (({ value: p }) => Some12(p))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: info }) => Some12(info.prec))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? Some12(NEQ_PREC) : _v._tag === "None" ? None12 : (() => {
  throw new Error("non-exhaustive match");
})())(neqOperands(e)) : (() => {
  throw new Error("non-exhaustive match");
})())(binOpOf(e)) : (() => {
  throw new Error("non-exhaustive match");
})())(pipePrecOf(e));
var binOperandD = _curry14(4, (cts, e, parentPrec, isRight) => isLambdaOrTernary(cts, e) ? cat([txt("("), exprD(cts, e), txt(")")]) : ((_v) => _v._tag === "Some" ? (({ value: prec }) => parenIf(isRight ? prec <= parentPrec : prec < parentPrec, exprD(cts, e)))(_v) : _v._tag === "None" ? exprD(cts, e) : (() => {
  throw new Error("non-exhaustive match");
})())(infixPrec(e)));
var pipeLeftD = _curry14(3, (cts, e, parentPrec) => isLambdaOrTernary(cts, e) ? cat([txt("("), exprD(cts, e), txt(")")]) : ((_v) => _v._tag === "Some" ? (({ value: prec }) => parenIf(prec < parentPrec, exprD(cts, e)))(_v) : _v._tag === "None" ? exprD(cts, e) : (() => {
  throw new Error("non-exhaustive match");
})())(infixPrec(e)));
var concatSegmentsFrom = _curry14(2, (e, acc) => ((_v) => _v._tag === "ECall" && _v.fn._tag === "ERef" && _v.fn.name === "concat" && _v.args.length === 2 ? (({ args: [l, r] }) => concatSegmentsFrom(l, _Array_prepend5(r, acc)))(_v) : _Array_prepend5(e, acc))(e));
var concatD = _curry14(3, (cts, l, r) => ((_v) => _v.length === 0 ? txt("") : _v.length >= 1 ? (([head, ...rest]) => group(cat([binOperandD(cts, head, CONCAT_PREC, false), indent(cat(map8((s) => cat([line, txt("++ "), binOperandD(cts, s, CONCAT_PREC, true)]), rest)))])))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(concatSegmentsFrom(l, [r])));
var binaryD = _curry14(3, (cts, fn, args) => ((_v) => _v._tag === "Some" ? (({ value: [l, r] }) => Some12(group(cat([binOperandD(cts, l, NEQ_PREC, false), txt(" != "), binOperandD(cts, r, NEQ_PREC, true)]))))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "None" ? None12 : _v._tag === "Some" ? (({ value: info }) => ((_v) => _v.length === 2 ? (([l, r]) => info.symbol === "++" ? Some12(concatD(cts, l, r)) : Some12(group(cat([binOperandD(cts, l, info.prec, false), txt(` ${info.symbol} `), binOperandD(cts, r, info.prec, true)]))))(_v) : None12)(args))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(binOpFor(fn, args)) : (() => {
  throw new Error("non-exhaustive match");
})())(neqFor(fn, args)));
var unaryD = _curry14(3, (cts, fn, args) => ((_v) => _v[0]._tag === "ERef" && _v[1].length === 1 ? (([{ name }, [operand]]) => ((_v) => _v._tag === "None" ? None12 : _v._tag === "Some" ? (({ value: symbol }) => ((forced) => Some12(cat([txt(symbol), parenIf(forced, exprD(cts, operand))])))(or7(or7(loosePrefix(cts, operand), _Option_isSome2(binOpOf(operand))), _Option_isSome2(neqOperands(operand)))))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(unaryOpOf(name)))(_v) : None12)(_tuple7(fn, args)));
var etaPartial = _curry14(3, (ctx, params, body) => ((_v) => _v.length === 1 ? (([only]) => ((_v) => _v._tag === "LPName" && _v.annot._tag === "None" ? (({ name }) => _Str_startsWith3("$", name) ? None12 : ((_v) => _v._tag === "ECall" ? ((flat) => ((_v) => _v._tag === "ECall" && _v.origin._tag === "None" ? (({ fn, args, span: sp }) => ((n) => n === 0 ? None12 : ((_v) => _v._tag === "Some" && _v.value._tag === "ERef" ? (({ value: { name: lastName } }) => !eq10(lastName, name) ? None12 : ((prefix) => and9(and9(and9(isInert(fn), allInert(prefix)), !mentionsRef(fn, name)), !anyMentions(prefix, name)) ? ((_v) => _v._tag === "Some" ? (({ value: arity }) => eq10(n, arity) ? Some12(ECall(fn, prefix, None12, sp)) : None12)(_v) : _v._tag === "None" ? None12 : (() => {
  throw new Error("non-exhaustive match");
})())(etaCalleeArity(ctx, fn)) : None12)(_Array_take2(n - 1, args)))(_v) : None12)(_Array_get11(n - 1, args)))(length11(args)))(_v) : None12)(flat))(((_v) => _v._tag === "Some" ? (({ value: f }) => f)(_v) : _v._tag === "None" ? body : (() => {
  throw new Error("non-exhaustive match");
})())(flattenCallSpine(ctx, body))) : None12)(body))(_v) : None12)(unspan(only)))(_v) : None12)(params));
var allInert = (args) => length11(filter4((a) => !isInert(a), args)) === 0;
var anyMentions = _curry14(2, (args, name) => length11(filter4((a) => mentionsRef(a, name), args)) > 0);
var spineGroups = _curry14(2, (e, acc) => ((_v) => _v._tag === "ECall" && _v.origin._tag === "Some" ? None12 : _v._tag === "ECall" && _v.origin._tag === "None" ? (({ fn, args }) => spineGroups(fn, _Array_prepend5(args, acc)))(_v) : Some12(_tuple7(e, acc)))(e));
var flattenCallSpine = _curry14(2, (ctx, e) => ((_v) => _v._tag === "None" ? None12 : _v._tag === "Some" ? (({ value: [head, groups] }) => (([callee, allGroups]) => or7(length11(allGroups) < 2, anyEmptyGroup(allGroups)) ? None12 : ((_v) => _v._tag === "None" ? None12 : _v._tag === "Some" ? (({ value: arity }) => ((args) => or7(length11(args) > arity, anyUnit(args)) ? None12 : Some12(ECall(callee, args, None12, exprSpan2(e))))(_Array_flatMap3((g) => g, allGroups)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(calleeArity(ctx, callee)))(((_v) => _v._tag === "ELambda" ? (({ params, body: lbody }) => ((_v) => _v._tag === "Some" && _v.value._tag === "ECall" ? (({ value: { fn: efn, args: eargs } }) => _tuple7(efn, _Array_prepend5(eargs, groups)))(_v) : _tuple7(head, groups))(etaPartial(ctx, params, lbody)))(_v) : _tuple7(head, groups))(head)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(spineGroups(e, [])));
var anyEmptyGroup = (groups) => length11(filter4((g) => length11(g) === 0, groups)) > 0;
var anyUnit = (args) => length11(filter4((a) => ((_v) => _v._tag === "EUnit" ? true : false)(a), args)) > 0;
var isSectionParam = (p) => ((_v) => _v._tag === "LPName" && _v.name === "$s" ? true : false)(unspan(p));
var isRef2 = _curry14(2, (e, name) => ((_v) => _v._tag === "ERef" ? (({ name: n }) => eq10(n, name))(_v) : false)(e));
var sectionParts = (body) => ((_v) => _v._tag === "Some" ? (({ value: [l, r] }) => Some12(_tuple7({ symbol: "!=", prec: NEQ_PREC }, l, r)))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "None" ? None12 : _v._tag === "Some" ? (({ value: info }) => ((_v) => _v._tag === "ECall" && _v.args.length === 2 ? (({ args: [l, r] }) => Some12(_tuple7(info, l, r)))(_v) : None12)(body))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(binOpOf(body)) : (() => {
  throw new Error("non-exhaustive match");
})())(neqOperands(body));
var sectionOf = _curry14(3, (cts, params, body) => ((_v) => _v.length === 1 ? (([only]) => isSectionParam(only) ? ((_v) => _v._tag === "None" ? None12 : _v._tag === "Some" ? (({ value: [info, l, r] }) => ((lIsParam) => ((rIsParam) => eq10(lIsParam, rIsParam) ? None12 : lIsParam ? Some12(cat([txt(`(${info.symbol} `), binOperandD(cts, r, info.prec, true), txt(")")])) : Some12(cat([txt("("), binOperandD(cts, l, info.prec, false), txt(` ${info.symbol})`)])))(isRef2(r, "$s")))(isRef2(l, "$s")))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(sectionParts(body)) : None12)(_v) : None12)(params));
var composeParts = _curry14(2, (params, body) => ((_v) => _v[0].length === 1 && _v[1]._tag === "ECall" && _v[1].args.length === 1 && _v[1].args[0]._tag === "ECall" && _v[1].args[0].args.length === 1 ? (([[p], { fn: right, args: [{ fn: left, args: [inner] }] }]) => ((_v) => _v._tag === "LPName" && _v.name === "$x" ? isRef2(inner, "$x") ? Some12(_tuple7(left, right)) : None12 : None12)(unspan(p)))(_v) : None12)(_tuple7(params, body)));
var composeSegmentsFrom = _curry14(2, (e, acc) => ((_v) => _v._tag === "ELambda" ? (({ params, body }) => ((_v) => _v._tag === "Some" ? (({ value: [left, right] }) => composeSegmentsFrom(left, _Array_prepend5(right, acc)))(_v) : _v._tag === "None" ? _Array_prepend5(e, acc) : (() => {
  throw new Error("non-exhaustive match");
})())(composeParts(params, body)))(_v) : _Array_prepend5(e, acc))(e));
var destructureLetD = _curry14(3, (cts, fn, args) => ((_v) => _v[0]._tag === "ELambda" && _v[0].params.length === 1 && _v[1].length === 1 ? (([{ params: [p], body: lbody }, [value]]) => ((_v) => _v._tag === "LPName" ? None12 : Some12(letLikeD(cts, `let ${paramText(cts, p)}`, value, lbody)))(unspan(p)))(_v) : None12)(_tuple7(fn, args)));
var refoldCall = _curry14(3, (cts, fn, args) => ((_v) => _v._tag === "Some" ? (({ value: d }) => Some12(d))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: d }) => Some12(d))(_v) : _v._tag === "None" ? unaryD(cts, fn, args) : (() => {
  throw new Error("non-exhaustive match");
})())(binaryD(cts, fn, args)) : (() => {
  throw new Error("non-exhaustive match");
})())(destructureLetD(cts, fn, args)));
var labeledFieldD = _curry14(2, (cts, f) => ((_v) => _v._tag === "ERef" && (({ name }) => eq10(name, f.name))(_v) ? (({ name }) => txt(`~${f.name}`))(_v) : cat([txt(`~${f.name}=`), exprD(cts, f.value)]))(f.value));
var callArgDocs = _curry14(3, (cts, args, origin) => ((_v) => _v._tag === "Some" && _v.value === "labeled" ? ((_v) => _v._tag === "Some" && _v.value._tag === "ERecord" && _v.value.spread._tag === "None" ? (({ value: { fields } }) => _Array_concat6(map8((x) => exprD(cts, x), _Array_take2(length11(args) - 1, args)), map8((f) => labeledFieldD(cts, f), fields)))(_v) : map8((x) => exprD(cts, x), args))(_Array_get11(length11(args) - 1, args)) : map8((x) => exprD(cts, x), args))(origin));
var labeledParamText = _curry14(5, (cts, name, annot, optional, defaultValue) => {
  const ann = ((_v) => _v._tag === "Some" ? (({ value: te }) => `: ${showTypeExpr(te)}`)(_v) : _v._tag === "None" ? "" : (() => {
    throw new Error("non-exhaustive match");
  })())(annot);
  const def = ((_v) => _v._tag === "Some" ? (({ value: d }) => ` = ${flat(exprD(cts, d))}`)(_v) : _v._tag === "None" ? "" : (() => {
    throw new Error("non-exhaustive match");
  })())(defaultValue);
  return `~${name}${optional ? "?" : ""}${ann}${def}`;
});
var paramText = _curry14(2, (cts, p) => ((_v) => _v._tag === "LPName" ? (({ name, annot }) => ((_v) => _v._tag === "Some" ? (({ value: te }) => `${name}: ${showTypeExpr(te)}`)(_v) : _v._tag === "None" ? name : (() => {
  throw new Error("non-exhaustive match");
})())(annot))(_v) : _v._tag === "LPTuple" ? (({ names }) => `(${_Str_join5(", ", names)})`)(_v) : _v._tag === "LPRecord" ? (({ fields }) => `{ ${_Str_join5(", ", fields)} }`)(_v) : _v._tag === "LPLabeled" ? (({ name, annot, optional, defaultValue }) => labeledParamText(cts, name, annot, optional, defaultValue))(_v) : _v._tag === "LPSpanned" ? "" : (() => {
  throw new Error("non-exhaustive match");
})())(unspan(p)));
var paramsText = _curry14(2, (cts, ps) => ((_v) => _v.length === 1 ? (([only]) => ((_v) => _v._tag === "LPName" && _v.annot._tag === "None" ? (({ name }) => name)(_v) : `(${commaJoin((p) => paramText(cts, p), ps)})`)(unspan(only)))(_v) : `(${commaJoin((p) => paramText(cts, p), ps)})`)(ps));
var quoted = (body) => concat(concat('"', body), '"');
var interpText = _curry14(2, (cts, parts) => {
  const hole = (ex) => concat(concat(concat("$", "{"), flat(exprD(cts, ex))), "}");
  return quoted(_Str_join5("", map8((p) => ((_v) => _v._tag === "IPLit" ? (({ value }) => escStrBody(value))(_v) : _v._tag === "IPExpr" ? (({ expr: ex }) => hole(ex))(_v) : (() => {
    throw new Error("non-exhaustive match");
  })())(p), parts)));
});
var discardedFrom = _curry14(2, (e, acc) => ((_v) => _v._tag === "ELetIn" && _v.name === "_" ? (({ value, body }) => discardedFrom(body, _Array_append9(value, acc)))(_v) : length11(acc) === 0 ? None12 : Some12(_Array_append9(e, acc)))(e));
var discardedLetExprs = (e) => discardedFrom(e, []);
var doBlockD = _curry14(2, (cts, exprs) => cat([txt("{"), indent(cat([hardline, join(cat([txt(";"), hardline]), map8((x) => exprD(cts, x), exprs))])), hardline, txt("}")]));
var doD = _curry14(2, (cts, exprs) => cat([txt("do "), doBlockD(cts, exprs)]));
var lambdaD = _curry14(3, (cts, params, body) => ((_v) => _v._tag === "Some" ? (({ value: section }) => section)(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: eta }) => exprD(cts, eta))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? ((_v) => _v.length === 0 ? txt("") : _v.length >= 1 ? (([head, ...rest]) => group(cat([operandD(cts, head), indent(cat(map8((s) => cat([line, txt(">> "), operandD(cts, s)]), rest)))])))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(composeSegmentsFrom(ELambda(params, body, { start: 0, end: 0 }), [])) : _v._tag === "None" ? plainLambdaD({ ...cts, etaSkip: isLambdaExpr(body) }, params, body) : (() => {
  throw new Error("non-exhaustive match");
})())(composeParts(params, body)) : (() => {
  throw new Error("non-exhaustive match");
})())(cts.etaSkip ? None12 : etaPartial(cts, params, body)) : (() => {
  throw new Error("non-exhaustive match");
})())(sectionOf(cts, params, body)));
var plainLambdaD = _curry14(3, (cts, params, body) => {
  const head = txt(`${paramsText(cts, params)} =>`);
  return ((_v) => _v._tag === "EDo" ? (({ exprs }) => cat([head, txt(" "), doBlockD(cts, exprs)]))(_v) : ((_v) => _v._tag === "Some" ? (({ value: exprs }) => cat([head, txt(" "), doBlockD(cts, exprs)]))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "EMatch" && !hasLead(cts, EXPR, exprSpan2(body)) ? cat([head, txt(" "), exprD(cts, body)]) : group(cat([head, indent(cat([line, exprD(cts, body)]))])))(body) : (() => {
    throw new Error("non-exhaustive match");
  })())(discardedLetExprs(body)))(body);
});
var condD = _curry14(2, (cts, c) => ((_v) => _v._tag === "ETernary" ? cat([txt("("), exprD(cts, c), txt(")")]) : exprD(cts, c))(c));
var branchD = _curry14(3, (cts, marker, e) => hasLead(cts, EXPR, exprSpan2(e)) ? cat([txt(marker), indent(cat([hardline, exprD(cts, e)]))]) : cat([txt(`${marker} `), exprD(cts, e)]));
var ternaryArmsFrom = _curry14(2, (e, acc) => ((_v) => _v._tag === "ETernary" ? (({ cond, thenE, elseE }) => ternaryArmsFrom(elseE, _Array_append9({ cond, thenE }, acc)))(_v) : _tuple7(acc, e))(e));
var ternaryRestParts = _curry14(3, (cts, arms, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: a }) => [line, hasLead(cts, EXPR, exprSpan2(a.cond)) ? cat([txt(":"), indent(cat([hardline, condD(cts, a.cond)]))]) : cat([txt(": "), condD(cts, a.cond)]), line, branchD(cts, "?", a.thenE), ...ternaryRestParts(cts, arms, i + 1)])(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(i, arms)));
var ternaryD = _curry14(2, (cts, e) => (([arms, elseE]) => ((_v) => _v._tag === "None" ? txt("") : _v._tag === "Some" ? (({ value: first }) => group(cat([condD(cts, first.cond), indent(cat([line, branchD(cts, "?", first.thenE), ...ternaryRestParts(cts, arms, 1), line, branchD(cts, ":", elseE)]))])))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(0, arms)))(ternaryArmsFrom(e, [])));
var printsAsLet = (e) => ((_v) => _v._tag === "ELetIn" ? _Option_isNone(discardedLetExprs(e)) : _v._tag === "ELetBind" ? true : _v._tag === "ECall" && _v.fn._tag === "ELambda" && _v.fn.params.length === 1 && _v.args.length === 1 ? (({ fn: { params: [p] } }) => ((_v) => _v._tag === "LPName" ? false : true)(unspan(p)))(_v) : false)(e);
var letLikeD = _curry14(4, (cts, head, value, body) => {
  const cont = printsAsLet(body) ? cat([line, exprD(cts, body)]) : indent(cat([line, exprD(cts, body)]));
  return group(cat([txt(`${head} = `), ...leadingDocs(cts, EXPR, exprSpan2(value)), exprRaw(cts, value), txt(" in"), ...trailingDocs(cts, EXPR, exprSpan2(value)), cont]));
});
var recordFieldD = _curry14(2, (cts, f) => ((_v) => _v._tag === "ERef" && (({ name }) => eq10(name, f.name))(_v) ? (({ name }) => exprD(cts, f.value))(_v) : cat([txt(`${f.name}: `), exprD(cts, f.value)]))(f.value));
var recordD = _curry14(3, (cts, fields, spread) => {
  const fieldDocs = map8((f) => recordFieldD(cts, f), fields);
  return braced("{", "}", ((_v) => _v._tag === "Some" ? (({ value: s }) => _Array_prepend5(cat([txt("..."), exprD(cts, s)]), fieldDocs))(_v) : _v._tag === "None" ? fieldDocs : (() => {
    throw new Error("non-exhaustive match");
  })())(spread));
});
var seqElemD = _curry14(2, (cts, el) => ((_v) => _v._tag === "SEExpr" ? (({ expr: e }) => exprD(cts, e))(_v) : _v._tag === "SESpread" ? (({ expr: e }) => cat([txt("..."), exprD(cts, e)]))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(el));
var pipeSegmentsFrom = _curry14(2, (e, acc) => ((_v) => _v._tag === "EPipe" && _v.fast === false ? (({ left, right }) => pipeSegmentsFrom(left, _Array_prepend5(right, acc)))(_v) : _Array_prepend5(e, acc))(e));
var matchArmD = _curry14(2, (cts, a) => {
  const guard = ((_v) => _v._tag === "Some" ? (({ value: g }) => ` when ${flat(exprD(cts, g))}`)(_v) : _v._tag === "None" ? "" : (() => {
    throw new Error("non-exhaustive match");
  })())(a.guard);
  const head = txt(`| ${pattern(a.pattern)}${guard} =>`);
  return hasLead(cts, EXPR, exprSpan2(a.body)) ? cat([head, indent(cat([hardline, exprD(cts, a.body)]))]) : cat([head, txt(" "), indent(exprD(cts, a.body))]);
});
var matchD = _curry14(3, (cts, scrutinee, arms) => group(cat([txt(`switch ${flat(exprD(cts, scrutinee))} {`), indent(cat(map8((a) => cat([line, matchArmD(cts, a)]), arms))), line, txt("}")])));
var loopD = _curry14(3, (cts, params, body) => group(cat([txt("loop ("), join(txt(", "), map8((p) => cat([txt(`${p.name} = `), exprD(cts, p.init)]), params)), txt(") {"), indent(cat([line, exprD(cts, body)])), line, txt("}")])));
var lastArgHugs = (body) => ((_v) => _v._tag === "EMatch" ? true : _v._tag === "ELoop" ? true : _v._tag === "EDo" ? true : _Option_isSome2(discardedLetExprs(body)))(body);
var callArgsD = _curry14(5, (cts, fn, args, origin, asCallee) => ((_v) => _v._tag === "Some" ? (({ value: d }) => d)(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" && _v.value._tag === "ECall" ? (({ value: { fn: ffn, args: fargs, origin: forigin } }) => callArgsD(cts, ffn, fargs, forigin, asCallee))(_v) : plainCallD(cts, fn, args, origin, asCallee))(flattenCallSpine(cts, ECall(fn, args, origin, { start: 0, end: 0 }))) : (() => {
  throw new Error("non-exhaustive match");
})())(refoldCall(cts, fn, args)));
var plainCallD = _curry14(5, (cts, fn, args, origin, asCallee) => {
  const fnD = calleeD(cts, fn);
  return ((_v) => _v.length === 0 ? cat([fnD, txt("()")]) : _v.length === 1 && _v[0]._tag === "ETuple" ? (([{ elements, span: tsp }]) => group(cat([fnD, txt("("), exprD(cts, ETuple(elements, tsp)), txt(")")])))(_v) : ((argDocs) => ((_v) => _v._tag === "Some" && _v.value._tag === "ELambda" ? (({ value: { body: lbody } }) => group(cat([fnD, txt("("), join(txt(", "), argDocs), or7(lastArgHugs(lbody), !asCallee) ? txt(")") : cat([softline, txt(")")])])))(_v) : cat([fnD, group(cat([txt("("), indent(cat([softline, join(cat([txt(","), line]), argDocs)])), softline, txt(")")]))]))(_Array_get11(length11(args) - 1, args)))(callArgDocs(cts, args, origin)))(args);
});
var callD = _curry14(4, (cts, fn, args, origin) => callArgsD(cts, fn, args, origin, false));
var calleeD = _curry14(2, (cts, e) => ((_v) => _v._tag === "ECall" ? (({ fn, args, origin }) => callArgsD(cts, fn, args, origin, true))(_v) : parenIf(loosePrefix(cts, e), exprD(cts, e)))(hooked(cts, e)));
var operandD = _curry14(2, (cts, e) => parenIf(loosePrefix(cts, e), exprD(cts, e)));
var memberD = _curry14(2, (cts, e) => ((_v) => _v._tag === "ERecord" ? cat([txt("("), exprD(cts, e), txt(")")]) : parenIf(loosePrefix(cts, e), exprD(cts, e)))(e));
var pipeD = _curry14(2, (cts, e) => ((_v) => _v._tag === "EPipe" && _v.right._tag === "ECall" && _v.fast === true ? (({ left, right: { fn: rfn, args: rargs, origin: rorigin } }) => cat([pipeLeftD(cts, left, FAST_PIPE_PREC), txt("->"), callD(cts, rfn, rargs, rorigin)]))(_v) : ((segments) => ((_v) => _v.length === 0 ? txt("") : _v.length >= 1 ? (([head, ...rest]) => group(cat([pipeLeftD(cts, head, PIPE_PREC), indent(cat(map8((s) => cat([line, txt("|> "), operandD(cts, s)]), rest)))])))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(segments))(pipeSegmentsFrom(e, [])))(e));
var letBindHead = _curry14(3, (cts, monad, param) => `let${monad === "Task" ? "!" : "?"} ${paramText(cts, param)}`);
var hooked = _curry14(2, (cts, e) => length11(cts.formatHooks) === 0 ? e : ((sp) => _Option_isSome2(_Array_find4((s) => and9(s > sp.start, s < sp.end), cts.commentStarts)) ? e : _Option_unwrapOr7(e, runFormatHooks(cts.formatHooks, e)))(exprSpan2(e)));
var formatApi = (cts) => ({ exprD: (e) => exprD(cts, e), memberD: (e) => memberD(cts, e), flat, strLit: strLit2, sourceText: _curry14(2, (start, end) => _Str_slice3(start, end, cts.src)) });
var exprRaw = _curry14(2, (cts, e) => {
  const node = hooked(cts, e);
  return length11(cts.formatDocHooks) === 0 ? exprRawOf(cts, node) : ((_v) => _v._tag === "Some" ? (({ value: doc }) => doc)(_v) : _v._tag === "None" ? exprRawOf(cts, node) : (() => {
    throw new Error("non-exhaustive match");
  })())(runFormatDocHooks(cts.formatDocHooks, node, formatApi(cts)));
});
var exprRawOf = _curry14(2, (cts, e) => ((_v) => _v._tag === "ENum" ? (({ raw }) => txt(raw))(_v) : _v._tag === "EUnit" ? txt("()") : _v._tag === "EBool" ? (({ value }) => txt(show5(value)))(_v) : _v._tag === "EStr" ? (({ value }) => txt(strLit2(value)))(_v) : _v._tag === "EInterp" ? (({ parts }) => txt(interpText(cts, parts)))(_v) : _v._tag === "ERef" ? (({ name }) => txt(name))(_v) : _v._tag === "ECall" ? (({ fn, args, origin }) => callD(cts, fn, args, origin))(_v) : _v._tag === "ELambda" ? (({ params, body }) => lambdaD(cts, params, body))(_v) : _v._tag === "EPipe" ? pipeD(cts, e) : _v._tag === "EDo" ? (({ exprs }) => doD(cts, exprs))(_v) : _v._tag === "ETernary" ? ternaryD(cts, e) : _v._tag === "ERecord" ? (({ fields, spread }) => recordD(cts, fields, spread))(_v) : _v._tag === "EField" ? (({ target, name }) => cat([memberD(cts, target), txt(`.${name}`)]))(_v) : _v._tag === "EMatch" ? (({ scrutinee, arms }) => matchD(cts, scrutinee, arms))(_v) : _v._tag === "ELetIn" ? (({ name, annot, value, body }) => ((_v) => _v._tag === "Some" ? (({ value: exprs }) => doD(cts, exprs))(_v) : _v._tag === "None" ? ((ann) => letLikeD(cts, `let ${name}${ann}`, value, body))(((_v) => _v._tag === "Some" ? (({ value: te }) => ` : ${showTypeExpr(te)}`)(_v) : _v._tag === "None" ? "" : (() => {
  throw new Error("non-exhaustive match");
})())(annot)) : (() => {
  throw new Error("non-exhaustive match");
})())(discardedLetExprs(e)))(_v) : _v._tag === "ELetBind" ? (({ param, monad, value, body }) => letLikeD(cts, letBindHead(cts, monad, param), value, body))(_v) : _v._tag === "ELoop" ? (({ params, body }) => loopD(cts, params, body))(_v) : _v._tag === "ERecur" ? (({ args }) => cat([txt("recur"), bracketed("(", ")", map8((x) => exprD(cts, x), args))]))(_v) : _v._tag === "ETuple" ? (({ elements }) => bracketed("(", ")", map8((x) => exprD(cts, x), elements)))(_v) : _v._tag === "EArr" ? (({ elements }) => bracketed("[", "]", map8((el) => seqElemD(cts, el), elements)))(_v) : _v._tag === "EList" ? (({ elements }) => bracketed("@{", "}", map8((el) => seqElemD(cts, el), elements)))(_v) : _v._tag === "ESet" ? (({ elements }) => bracketed("#{", "}", map8((el) => seqElemD(cts, el), elements)))(_v) : _v._tag === "EMap" ? (({ entries }) => braced("#{", "}", map8((en) => cat([exprD(cts, en.key), txt(": "), exprD(cts, en.value)]), entries)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(e));
var aliasFieldText = (f) => `${f.name}${f.optional ? "?" : ""}: ${showTypeExpr(f.fieldType)}`;
var ctorArms = _curry14(3, (cts, ctors, i) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: c }) => _Array_prepend5(cat([hardline, withComments(cts, CTOR, c.span, txt(`| ${ctorText(c)}`))]), ctorArms(cts, ctors, i + 1)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(i, ctors)));
var typeStmtD = _curry14(6, (cts, name, params, ctors, alias, aliasType) => {
  const head = `type ${name}${generics(params)}`;
  return ((_v) => _v._tag === "Some" ? (({ value: fields }) => cat([txt(`${head} = `), braced("{", "}", map8((f) => txt(aliasFieldText(f)), fields))]))(_v) : _v._tag === "None" ? ((_v) => _v._tag === "Some" ? (({ value: te }) => txt(`${head} = ${showTypeExpr(te)}`))(_v) : _v._tag === "None" ? length11(ctors) === 0 ? txt(`extern ${head}`) : cat([txt(`${head} =`), indent(cat(ctorArms(cts, ctors, 0)))]) : (() => {
    throw new Error("non-exhaustive match");
  })())(aliasType) : (() => {
    throw new Error("non-exhaustive match");
  })())(alias);
});
var importStmtD = _curry14(2, (names, from) => group(cat([txt("import "), braced("{", "}", map8((n) => txt(n.name), names)), txt(` from ${strLit2(from)}`)])));
var importNsStmtD = _curry14(2, (alias, from) => txt(`import * as ${alias} from ${strLit2(from)}`));
var exprD = _curry14(2, (cts, e) => withComments(cts, EXPR, exprSpan2(e), exprRaw(cts, e)));
var expPrefix = (exported) => exported ? "export " : "";
var fieldOf = _curry14(2, (e, tmp) => ((_v) => _v._tag === "EField" && _v.target._tag === "ERef" ? (({ target: { name: target }, name }) => eq10(target, tmp) ? Some12(name) : None12)(_v) : None12)(e));
var destructureFieldsFrom = _curry14(4, (stmts, j, tmp, acc) => ((_v) => _v._tag === "Some" && _v.value._tag === "SLet" ? (({ value: { name, value } }) => ((_v) => _v._tag === "Some" ? (({ value: f }) => eq10(f, name) ? destructureFieldsFrom(stmts, j + 1, tmp, _Array_append9(f, acc)) : acc)(_v) : _v._tag === "None" ? acc : (() => {
  throw new Error("non-exhaustive match");
})())(fieldOf(value, tmp)))(_v) : acc)(_Array_get11(j, stmts)));
var stmtDoc = _curry14(4, (cts, stmts, i, src) => ((_v) => _v._tag === "None" ? { doc: txt(""), consumed: 1 } : _v._tag === "Some" ? (({ value: s }) => ((_v) => _v._tag === "SImport" ? (({ names, from }) => ({ doc: importStmtD(names, from), consumed: 1 }))(_v) : _v._tag === "SImportNs" ? (({ alias, from }) => ({ doc: importNsStmtD(alias.name, from), consumed: 1 }))(_v) : _v._tag === "SType" ? (({ name, params, ctors, alias, aliasType, exported }) => ({ doc: cat([txt(expPrefix(exported)), typeStmtD(cts, name, params, ctors, alias, aliasType)]), consumed: 1 }))(_v) : _v._tag === "SExtern" ? (({ name, params, typeExpr: te, module, imported, curried, exported }) => ({ doc: txt(`${expPrefix(exported)}${externStmt(name, params, te, module, imported, curried)}`), consumed: 1 }))(_v) : _v._tag === "SError" ? (({ span: sp }) => ({ doc: verbatim(_Str_slice3(sp.start, sp.end, src)), consumed: 1 }))(_v) : _v._tag === "SExpr" ? (({ value }) => ({ doc: exprD(cts, value), consumed: 1 }))(_v) : _v._tag === "SLet" ? (({ name, annot, value, exported }) => _Str_startsWith3("$", name) ? ((fields) => ({ doc: cat([txt(`${expPrefix(exported)}let { ${_Str_join5(", ", fields)} } = `), exprD(cts, value)]), consumed: length11(fields) + 1 }))(destructureFieldsFrom(stmts, i + 1, name, [])) : ((ann) => ({ doc: cat([txt(`${expPrefix(exported)}let ${name}${ann} = `), exprD(cts, value)]), consumed: 1 }))(((_v) => _v._tag === "Some" ? (({ value: te }) => ` : ${showTypeExpr(te)}`)(_v) : _v._tag === "None" ? "" : (() => {
  throw new Error("non-exhaustive match");
})())(annot)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(s))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(i, stmts)));
var stmtSpan = (s) => ((_v) => _v._tag === "SLet" ? (({ span: sp }) => sp)(_v) : _v._tag === "SType" ? (({ span: sp }) => sp)(_v) : _v._tag === "SExtern" ? (({ span: sp }) => sp)(_v) : _v._tag === "SImport" ? (({ span: sp }) => sp)(_v) : _v._tag === "SImportNs" ? (({ span: sp }) => sp)(_v) : _v._tag === "SExpr" ? (({ span: sp }) => sp)(_v) : _v._tag === "SError" ? (({ span: sp }) => sp)(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(s);
var blankBetweenFrom = _curry14(3, (s, i, seenNl) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" && _v.value === `
` ? or7(seenNl, blankBetweenFrom(s, i + 1, true)) : _v._tag === "Some" && _v.value === " " ? blankBetweenFrom(s, i + 1, seenNl) : _v._tag === "Some" && _v.value === "\t" ? blankBetweenFrom(s, i + 1, seenNl) : _v._tag === "Some" && _v.value === "r" ? blankBetweenFrom(s, i + 1, seenNl) : _v._tag === "Some" ? blankBetweenFrom(s, i + 1, false) : (() => {
  throw new Error("non-exhaustive match");
})())(_Str_get4(i, s)));
var blankBetween = (gap) => blankBetweenFrom(gap, 0, false);
var anchorStart = _curry14(2, (cts, s) => {
  const sp = stmtSpan(s);
  return ((_v) => _v._tag === "Some" ? (({ value: c }) => c.start)(_v) : _v._tag === "None" ? sp.start : (() => {
    throw new Error("non-exhaustive match");
  })())(_Array_get11(0, atKey(cts.leading, spanKey(STMT, sp))));
});
var stmtParts = _curry14(6, (cts, stmts, i, src, prevEnd, acc) => ((_v) => _v._tag === "None" ? _tuple7(acc, prevEnd) : _v._tag === "Some" ? (({ value: cur }) => ((sep) => ((printed) => ((lastIdx) => ((end) => stmtParts(cts, stmts, i + printed.consumed, src, Some12(end), _Array_concat6(acc, _Array_append9(withComments(cts, STMT, stmtSpan(cur), printed.doc), sep))))(((_v) => _v._tag === "Some" ? (({ value: last }) => stmtSpan(last).end)(_v) : _v._tag === "None" ? 0 : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(lastIdx, stmts))))(i + printed.consumed - 1))(stmtDoc(cts, stmts, i, src)))(((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: pe }) => blankBetween(_Str_slice3(pe, anchorStart(cts, cur), src)) ? [hardline, hardline] : [hardline])(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(prevEnd)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(i, stmts)));
var tailParts = _curry14(3, (tail, src, prevEnd) => ((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: first }) => ((sep) => _Array_append9(join(hardline, map8((c) => txt(c.text), tail)), sep))(((_v) => _v._tag === "None" ? [] : _v._tag === "Some" ? (({ value: pe }) => blankBetween(_Str_slice3(pe, first.start, src)) ? [hardline, hardline] : [hardline])(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(prevEnd)))(_v) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(0, tail)));
var programDoc = _curry14(4, (cts, stmts, src, tail) => (([parts, prevEnd]) => cat(_Array_concat6(_Array_concat6(parts, tailParts(tail, src, prevEnd)), [hardline])))(stmtParts(cts, stmts, 0, src, None12, [])));
var stmtAnchors = (s) => _Array_append9({ kind: STMT, sp: stmtSpan(s) }, ((_v) => _v._tag === "SLet" ? (({ value }) => exprAnchors(value))(_v) : _v._tag === "SExpr" ? (({ value }) => exprAnchors(value))(_v) : _v._tag === "SType" ? (({ ctors }) => map8((c) => ({ kind: CTOR, sp: c.span }), ctors))(_v) : [])(s));
var inErrorSpanFrom = _curry14(3, (stmts, i, c) => ((_v) => _v._tag === "None" ? false : _v._tag === "Some" && _v.value._tag === "SError" ? (({ value: { span: sp } }) => or7(and9(c.start >= sp.start, c.start < sp.end), inErrorSpanFrom(stmts, i + 1, c)))(_v) : _v._tag === "Some" ? inErrorSpanFrom(stmts, i + 1, c) : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(i, stmts)));
var inErrorSpan = _curry14(2, (stmts, c) => inErrorSpanFrom(stmts, 0, c));
var hasOpenDirective = (src) => ((_v) => _v._tag === "Some" ? (({ value: first }) => _Str_trim(first) === '"use open"')(_v) : _v._tag === "None" ? false : (() => {
  throw new Error("non-exhaustive match");
})())(_Array_get11(0, _Str_split4(`
`, _Str_trim(src))));
var formatProgram = _curry14(2, (stmts, src) => {
  const hooks = formatHooksFor(None12);
  return formatProgramWith(stmts, src, hooks);
});
var formatProgramWith = _curry14(3, (stmts, src, hooks) => {
  const innerBound = _Set_fromArray2(_Array_flatMap3(stmtInnerNames, stmts));
  const shadowed = _Set_union(innerBound, _Set_fromArray2(topLevelNames(stmts)));
  const comments = filter4((c) => !inErrorSpan(stmts, c), collectComments(src));
  const base = { ...noComments, flatArity: buildFlatArity(stmts, innerBound), shadowed, formatHooks: hooks.rewrite, formatDocHooks: hooks.layout, commentStarts: map8((c) => c.start, comments), src };
  const attached = attachFrom(comments, 0, anchorIndex(sortAnchors(_Array_flatMap3(stmtAnchors, stmts))), src, { table: base, tail: [] });
  const body = render(programDoc(attached.table, stmts, src, attached.tail), WIDTH);
  return hasOpenDirective(src) ? `"use open"

${body}` : body;
});
export {
  UNIT,
  foldAliases,
  formatHooksFor,
  formatProgram,
  formatProgramWith,
  freshRowVar,
  freshVar,
  lex,
  parse,
  parseRecovering,
  parseWith,
  rExtend,
  showType,
  tArrow,
  tBool,
  tCon,
  tLit,
  tNumber,
  tPrim,
  tRecord,
  tString,
  tTuple,
  tUnion,
  widenLits,
  zonk
};
