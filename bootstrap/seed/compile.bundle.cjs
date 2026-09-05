// @bun
import { Ok as Ok10, _Result_flatMap as _Result_flatMap8, _Str_get as _Str_get4, _Str_startsWith as _Str_startsWith5, _Str_trim, _curry as _curry18, _tuple as _tuple11, and as and12, map as map12, or as or9 } from "@mochi/compiler/runtime";
import { match as match17 } from "@onrails/pattern";

import { Err, None as None2, Ok, Some as Some2, _Array_append, _Array_head, _Array_tail, _Option_contains as _Option_contains2, _Option_exists, _Option_unwrapOr, _Str_codeAt, _Str_fromCode, _Str_get as _Str_get2, _Str_join, _Str_length, _Str_slice, _Str_toNumber, _curry as _curry2, _done as _done2, _recur as _recur2, and, eq as eq2, length, not, or } from "@mochi/compiler/runtime";
import { match as match2 } from "@onrails/pattern";

import { None, Some, _Option_contains, _Str_get, _curry, _done, _recur, eq } from "@mochi/compiler/runtime";
import { match } from "@onrails/pattern";
var skipStrLoop = _curry(2, (src, j0) => {
  let j = j0;
  while (true) {
    const _step = match(_Str_get(j, src)).with({ _tag: "None" }, () => _done(None)).with({ _tag: "Some", value: '"' }, () => _done(Some(j + 1))).with({ _tag: "Some", value: "\\" }, () => match(_Str_get(j + 1, src)).with({ _tag: "Some" }, () => _recur(j + 2)).with({ _tag: "None" }, () => _recur(j + 1)).exhaustive()).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value === "$" && _Option_contains("{", _Str_get(j + 1, src));
    }, () => match(findHoleEnd(src, j + 2)).with({ _tag: "Some" }, ({ value: hEnd }) => _recur(hEnd)).with({ _tag: "None" }, () => _done(None)).exhaustive()).with({ _tag: "Some" }, () => _recur(j + 1)).exhaustive();
    if (_step._tag === "recur") {
      j = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var skipStringLiteral = _curry(2, (src, i) => skipStrLoop(src, i + 1));
var skipLineCommentTo = _curry(2, (src, j) => match(_Str_get(j, src)).with({ _tag: "None" }, () => j).with({ _tag: "Some", value: `
` }, () => j).with({ _tag: "Some" }, () => skipLineCommentTo(src, j + 1)).exhaustive());
var findHoleLoop = _curry(3, (src, j0, depth0) => {
  let j = j0;
  let depth = depth0;
  while (true) {
    const _step = match(_Str_get(j, src)).with({ _tag: "None" }, () => _done(None)).with({ _tag: "Some", value: '"' }, () => match(skipStringLiteral(src, j)).with({ _tag: "Some" }, ({ value: stop }) => _recur(stop, depth)).with({ _tag: "None" }, () => _done(None)).exhaustive()).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value === "/" && _Option_contains("/", _Str_get(j + 1, src));
    }, () => _recur(skipLineCommentTo(src, j), depth)).with({ _tag: "Some", value: "{" }, () => _recur(j + 1, depth + 1)).with({ _tag: "Some", value: "}" }, () => eq(depth, 1) ? _done(Some(j + 1)) : _recur(j + 1, depth - 1)).with({ _tag: "Some" }, () => _recur(j + 1, depth)).exhaustive();
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
var TCompose = { _tag: "TCompose" };
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
var isSpace = (c) => or(eq2(c, " "), or(eq2(c, "\t"), or(eq2(c, `
`), eq2(c, cr))));
var inRange = _curry2(3, (lo, hi, n) => and(n >= lo, n <= hi));
var isDigit = (c) => _Option_exists(inRange(48, 57), _Str_codeAt(0, c));
var isIdStart = (c) => _Option_exists((n) => or(inRange(65, 90, n), or(inRange(97, 122, n), or(eq2(n, 95), eq2(n, 36)))), _Str_codeAt(0, c));
var isIdChar = (c) => or(isIdStart(c), isDigit(c));
var isNumChar = (c) => or(isDigit(c), eq2(c, "."));
var keywordTok = (word) => match2(word).with("let", () => Some2(TLet)).with("type", () => Some2(TType)).with("extern", () => Some2(TExtern)).with("switch", () => Some2(TSwitch)).with("loop", () => Some2(TLoop)).with("recur", () => Some2(TRecur)).with("do", () => Some2(TDo)).with("import", () => Some2(TImport)).with("export", () => Some2(TExport)).with("true", () => Some2(TBool(true))).with("false", () => Some2(TBool(false))).otherwise(() => None2);
var identTok = (word) => _Option_unwrapOr(TId(word), keywordTok(word));
var digraphTok = (two) => match2(two).with("|>", () => Some2(TPipe)).with(">>", () => Some2(TCompose)).with("++", () => Some2(TConcat)).with("==", () => Some2(TEqeq)).with("!=", () => Some2(TNeq)).with("<=", () => Some2(TLte)).with(">=", () => Some2(TGte)).with("&&", () => Some2(TAndand)).with("||", () => Some2(TOror)).with("=>", () => Some2(TArrow)).with("->", () => Some2(TTarrow)).otherwise(() => None2);
var punctTok = (c) => match2(c).with("|", () => Some2(TBar)).with("=", () => Some2(TEq)).with("(", () => Some2(TLparen)).with(")", () => Some2(TRparen)).with("{", () => Some2(TLbrace)).with("}", () => Some2(TRbrace)).with("[", () => Some2(TLbracket)).with("]", () => Some2(TRbracket)).with(",", () => Some2(TComma)).with(";", () => Some2(TSemi)).with(".", () => Some2(TDot)).with(":", () => Some2(TColon)).with("?", () => Some2(TQuestion)).with("@", () => Some2(TAt)).with("#", () => Some2(THash)).with("~", () => Some2(TTilde)).with("+", () => Some2(TPlus)).with("-", () => Some2(TMinus)).with("*", () => Some2(TStar)).with("/", () => Some2(TSlash)).with("%", () => Some2(TPercent)).with("!", () => Some2(TBang)).with("`", () => Some2(TBacktick)).with("<", () => Some2(TLt)).with(">", () => Some2(TGt)).otherwise(() => None2);
var scanWhile = _curry2(3, (pred, src, j) => match2(_Str_get2(j, src)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && (({ value: c }) => pred(c))(_g);
}, ({ value: c }) => scanWhile(pred, src, j + 1)).otherwise(() => j));
var escChar = (n) => match2(n).with("n", () => `
`).with("t", () => "\t").otherwise((c) => c);
var PLit = (value) => ({ _tag: "PLit", value });
var PHole = _curry2(2, (start, end) => ({ _tag: "PHole", start, end }));
var literalTok = _curry2(3, (idx, total, value) => eq2(total, 1) ? TStr(value) : eq2(idx, 0) ? TTmplStart(value) : eq2(idx, total - 1) ? TTmplEnd(value) : TTmplMid(value));
var scanTemplateLoop = _curry2(4, (src, j0, value0, parts0) => {
  let j = j0;
  let value = value0;
  let parts = parts0;
  while (true) {
    const _step = match2(_Str_get2(j, src)).with({ _tag: "None" }, () => _done2(None2)).with({ _tag: "Some", value: '"' }, () => _done2(Some2({ parts: _Array_append(PLit(value), parts), end: j + 1 }))).with({ _tag: "Some", value: "\\" }, () => match2(_Str_get2(j + 1, src)).with({ _tag: "Some" }, ({ value: n }) => _recur2(j + 2, `${value}${escChar(n)}`, parts)).with({ _tag: "None" }, () => _recur2(j + 1, `${value}\\`, parts)).exhaustive()).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value === "$" && _Option_contains2("{", _Str_get2(j + 1, src));
    }, () => match2(findHoleEnd(src, j + 2)).with({ _tag: "None" }, () => _done2(None2)).with({ _tag: "Some" }, ({ value: holeEnd }) => ((withLit) => ((withHole) => _recur2(holeEnd, "", withHole))(_Array_append(PHole(j + 2, holeEnd - 1), withLit)))(_Array_append(PLit(value), parts))).exhaustive()).with({ _tag: "Some" }, ({ value: c }) => _recur2(j + 1, `${value}${c}`, parts)).exhaustive();
    if (_step._tag === "recur") {
      [j, value, parts] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var scanTemplate = _curry2(2, (src, i) => scanTemplateLoop(src, i + 1, "", []));
var notNewline = (c) => not(eq2(c, `
`));
var scanComment = _curry2(3, (src, start, lineTok) => {
  const stop = scanWhile(notNewline, src, start);
  return lineTok ? Trailing(stop) : _Option_contains2("/", _Str_get2(start + 2, src)) ? ((textStart) => DocLine(_Str_slice(textStart, stop, src), stop))(_Option_contains2(" ", _Str_get2(start + 3, src)) ? start + 4 : start + 3) : PlainOwn(stop);
});
var mkTok = _curry2(4, (tok, start, stop, doc) => match2(doc).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => ({ tok, start, end: stop, doc: None2 })).otherwise((lines) => ({ tok, start, end: stop, doc: Some2(_Str_join(`
`, lines)) })));
var lexError = _curry2(3, (message, start, stop) => Err({ message, start, end: stop }));
var numValue = (raw) => _Option_unwrapOr(0 / 0, _Str_toNumber(raw));
var numStart = _curry2(3, (src, i, c) => or(isDigit(c), and(eq2(c, "-"), _Option_exists(isDigit, _Str_get2(i + 1, src)))));
var offsetLocTok = _curry2(2, (lt2, by) => ({ tok: lt2.tok, start: lt2.start + by, end: lt2.end + by, doc: lt2.doc }));
var spliceHoleToks = _curry2(3, (holeToks, by, toks) => match2(_Array_head(holeToks)).with({ _tag: "None" }, () => toks).with({ _tag: "Some" }, ({ value: ht }) => ((toks2) => spliceHoleToks(_Array_tail(holeToks), by, toks2))(eq2(ht.tok, TEof) ? toks : _Array_append(offsetLocTok(ht, by), toks))).exhaustive());
var spliceHole = _curry2(4, (src, start, stop, toks) => match2(lex(_Str_slice(start, stop, src))).with({ _tag: "Ok" }, ({ value: holeToks }) => Ok(spliceHoleToks(holeToks, start, toks))).with({ _tag: "Err" }, ({ error: e }) => Err({ message: e.message, start: e.start + start, end: e.end + start })).exhaustive());
var lexParts = _curry2(8, (src, parts, idx, total, wholeStart, wholeEnd, doc, toks) => match2(_Array_head(parts)).with({ _tag: "None" }, () => Ok(toks)).with({ _tag: "Some" }, ({ value: part }) => match2(part).with({ _tag: "PLit" }, ({ value }) => ((t) => lexParts(src, _Array_tail(parts), idx + 1, total, wholeStart, wholeEnd, [], _Array_append(t, toks)))(mkTok(literalTok(idx, total, value), wholeStart, wholeEnd, doc))).with({ _tag: "PHole" }, ({ start: hs, end: he }) => match2(spliceHole(src, hs, he, toks)).with({ _tag: "Err" }, ({ error: e }) => Err(e)).with({ _tag: "Ok" }, ({ value: toks2 }) => lexParts(src, _Array_tail(parts), idx + 1, total, wholeStart, wholeEnd, doc, toks2)).exhaustive()).exhaustive()).exhaustive());
var emit = _curry2(6, (src, tok, start, stop, doc, toks) => go(src, stop, [], 0, true, _Array_append(mkTok(tok, start, stop, doc), toks)));
var lexString = _curry2(4, (src, i, doc, toks) => match2(scanTemplate(src, i)).with({ _tag: "None" }, () => lexError("unterminated string literal", i, _Str_length(src))).with({ _tag: "Some" }, ({ value: scanned }) => match2(lexParts(src, scanned.parts, 0, length(scanned.parts), i, scanned.end, doc, toks)).with({ _tag: "Err" }, ({ error: e }) => Err(e)).with({ _tag: "Ok" }, ({ value: toks2 }) => go(src, scanned.end, [], 0, true, toks2)).exhaustive()).exhaustive());
var go = _curry2(6, (src, i, doc, nlRun, lineTok, toks) => match2(_Str_get2(i, src)).with({ _tag: "None" }, () => Ok(_Array_append(mkTok(TEof, i, i, doc), toks))).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && (({ value: c }) => isSpace(c))(_g);
}, ({ value: c }) => eq2(c, `
`) ? ((n) => ((kept) => go(src, i + 1, kept, n, false, toks))(n < 2 ? doc : []))(nlRun + 1) : go(src, i + 1, doc, nlRun, lineTok, toks)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value === "/" && _Option_contains2("/", _Str_get2(i + 1, src));
}, () => match2(scanComment(src, i, lineTok)).with({ _tag: "Trailing" }, ({ stop }) => go(src, stop, doc, nlRun, lineTok, toks)).with({ _tag: "PlainOwn" }, ({ stop }) => go(src, stop, [], 0, lineTok, toks)).with({ _tag: "DocLine" }, ({ text, stop }) => go(src, stop, _Array_append(text, doc), 0, lineTok, toks)).exhaustive()).with({ _tag: "Some" }, ({ value: c }) => eq2(_Str_slice(i, i + 3, src), "...") ? emit(src, TSpread, i, i + 3, doc, toks) : match2(digraphTok(_Str_slice(i, i + 2, src))).with({ _tag: "Some" }, ({ value: t }) => emit(src, t, i, i + 2, doc, toks)).with({ _tag: "None" }, () => eq2(c, '"') ? lexString(src, i, doc, toks) : numStart(src, i, c) ? ((j) => ((raw) => emit(src, TNum(numValue(raw), raw), i, j, doc, toks))(_Str_slice(i, j, src)))(scanWhile(isNumChar, src, i + 1)) : match2(punctTok(c)).with({ _tag: "Some" }, ({ value: t }) => emit(src, t, i, i + 1, doc, toks)).with({ _tag: "None" }, () => isIdStart(c) ? ((j) => emit(src, identTok(_Str_slice(i, j, src)), i, j, doc, toks))(scanWhile(isIdChar, src, i + 1)) : lexError(`unexpected char '${c}'`, i, i + 1)).exhaustive()).exhaustive()).exhaustive());
var lex = (src) => go(src, 0, [], 0, false, []);

import { Err as Err5, None as None7, Ok as Ok6, Some as Some7, _Array_append as _Array_append5, _Array_concat as _Array_concat2, _Array_get as _Array_get5, _Array_prepend as _Array_prepend2, _Option_exists as _Option_exists3, _Option_unwrapOr as _Option_unwrapOr3, _Result_flatMap as _Result_flatMap4, _Result_map as _Result_map4, _Str_codeAt as _Str_codeAt3, _curry as _curry8, _done as _done3, _recur as _recur3, _tuple as _tuple4, and as and5, eq as eq7, length as length6, map as map3, not as not3, or as or4, show as show2 } from "@mochi/compiler/runtime";
import { match as match7 } from "@onrails/pattern";

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
var SType = _curry3(8, (name, params, ctors, alias, aliasType, exported, doc, span) => ({ _tag: "SType", name, params, ctors, alias, aliasType, exported, doc, span }));
var SExtern = _curry3(10, (name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span) => ({ _tag: "SExtern", name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span }));
var SImport = _curry3(3, (names, from, span) => ({ _tag: "SImport", names, from, span }));
var SImportNs = _curry3(3, (alias, from, span) => ({ _tag: "SImportNs", alias, from, span }));
var SExpr = _curry3(2, (value, span) => ({ _tag: "SExpr", value, span }));
var SError = (span) => ({ _tag: "SError", span });

import { Err as Err4, None as None6, Ok as Ok5, Some as Some6, _Array_append as _Array_append4, _Array_concat, _Array_get as _Array_get4, _curry as _curry7, eq as eq6, length as length5 } from "@mochi/compiler/runtime";
import { match as match6 } from "@onrails/pattern";

import { Err as Err3, None as None4, Ok as Ok3, Some as Some4, _Array_append as _Array_append3, _Array_get as _Array_get2, _Map_get as _Map_get2, _Option_exists as _Option_exists2, _Option_flatMap, _Option_unwrapOr as _Option_unwrapOr2, _Result_flatMap as _Result_flatMap2, _Result_map as _Result_map2, _Str_codeAt as _Str_codeAt2, _Str_length as _Str_length2, _Str_slice as _Str_slice2, _Str_split, _Str_startsWith, _curry as _curry5, _tuple as _tuple2, and as and3, eq as eq4, length as length3, map as map2, or as or3 } from "@mochi/compiler/runtime";
import { match as match4 } from "@onrails/pattern";

import { Err as Err2, None as None3, Ok as Ok2, Some as Some3, _Array_append as _Array_append2, _Array_get, _Array_prepend, _Map_get, _Map_keys, _Map_set, _Result_flatMap, _Result_map, _Str_join as _Str_join2, _curry as _curry4, _tuple, and as and2, eq as eq3, length as length2, map, not as not2, or as or2, show } from "@mochi/compiler/runtime";
import { match as match3 } from "@onrails/pattern";
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
var typeEq = _curry4(2, (a, b) => match3(a).with({ _tag: "TyVar" }, ({ id: aid }) => match3(b).with({ _tag: "TyVar" }, ({ id: bid }) => eq3(aid, bid)).otherwise(() => false)).with({ _tag: "TyCon" }, ({ name: aname, args: aargs }) => match3(b).with({ _tag: "TyCon" }, ({ name: bname, args: bargs }) => and2(and2(eq3(aname, bname), eq3(length2(aargs), length2(bargs))), typeEqList(aargs, bargs, 0))).otherwise(() => false)).with({ _tag: "TyFn" }, ({ from: af, to: at }) => match3(b).with({ _tag: "TyFn" }, ({ from: bf, to: bt }) => and2(typeEq(af, bf), typeEq(at, bt))).otherwise(() => false)).with({ _tag: "TyRecord" }, ({ row: arow }) => match3(b).with({ _tag: "TyRecord" }, ({ row: brow }) => rowEq(arow, brow)).otherwise(() => false)).with({ _tag: "TySingleton" }, ({ base: abase, value: aval }) => match3(b).with({ _tag: "TySingleton" }, ({ base: bbase, value: bval }) => and2(eq3(abase, bbase), eq3(aval, bval))).otherwise(() => false)).with({ _tag: "TyOneOf" }, ({ members: am }) => match3(b).with({ _tag: "TyOneOf" }, ({ members: bm }) => and2(eq3(length2(am), length2(bm)), allMembersIn(am, bm, 0))).otherwise(() => false)).exhaustive());
var typeEqList = _curry4(3, (as_, bs, i) => match3(_Array_get(i, as_)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: a }) => match3(_Array_get(i, bs)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: b }) => and2(typeEq(a, b), typeEqList(as_, bs, i + 1))).exhaustive()).exhaustive());
var memberEqIn = _curry4(3, (t, xs, i) => match3(_Array_get(i, xs)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: x }) => typeEq(t, x) ? true : memberEqIn(t, xs, i + 1)).exhaustive());
var allMembersIn = _curry4(3, (am, bm, i) => match3(_Array_get(i, am)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: m }) => and2(memberEqIn(m, bm, 0), allMembersIn(am, bm, i + 1))).exhaustive());
var rowEq = _curry4(2, (a, b) => match3(a).with({ _tag: "RowEmpty" }, () => match3(b).with({ _tag: "RowEmpty" }, () => true).otherwise(() => false)).with({ _tag: "RowVar" }, ({ id: aid }) => match3(b).with({ _tag: "RowVar" }, ({ id: bid }) => eq3(aid, bid)).otherwise(() => false)).with({ _tag: "RowExtend" }, ({ label: al, fieldType: at, optional: ao, rest: ar }) => match3(b).with({ _tag: "RowExtend" }, ({ label: bl, fieldType: bt, optional: bo, rest: br }) => and2(and2(and2(eq3(al, bl), eq3(ao, bo)), typeEq(at, bt)), rowEq(ar, br))).otherwise(() => false)).exhaustive());
var flattenUnionFrom = _curry4(3, (members, acc, i) => match3(_Array_get(i, members)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: t }) => match3(t).with({ _tag: "TyOneOf" }, ({ members: ms }) => flattenUnionFrom(members, flattenUnionFrom(ms, acc, 0), i + 1)).otherwise(() => flattenUnionFrom(members, memberEqIn(t, acc, 0) ? acc : _Array_append2(t, acc), i + 1))).exhaustive());
var tUnion = (members) => {
  const flat = flattenUnionFrom(members, [], 0);
  return match3(flat).with((_v) => {
    const _g = _v;
    return _g.length === 0;
  }, () => tPrim("string")).with((_v) => {
    const _g = _v;
    return _g.length === 1;
  }, ([only]) => only).otherwise(() => TyOneOf(flat));
};
var TUPLE = "tuple";
var tTuple = (elems) => TyCon(TUPLE, elems);
var UNIT = "unit";
var tUnit = TyCon(UNIT, []);
var isUnit = (t) => match3(t).with({ _tag: "TyCon" }, ({ name, args }) => and2(eq3(name, UNIT), eq3(length2(args), 0))).otherwise(() => false);
var rVar = (id) => RowVar(id);
var rExtend = _curry4(3, (label, fieldType, rest) => RowExtend(label, fieldType, false, rest));
var rField = _curry4(4, (label, fieldType, rest, optional) => RowExtend(label, fieldType, optional, rest));
var showTypeArgs = (args) => _Str_join2(", ", map(showType, args));
var showType = (t) => match3(t).with({ _tag: "TyVar" }, ({ id }) => `'t${show(id)}`).with({ _tag: "TyCon" }, ({ name, args }) => match3(args).with((_v) => {
  const _g = _v;
  return _g.length === 1 && (([elem]) => eq3(name, "Array"))(_g);
}, ([elem]) => `[${showType(elem)}]`).with((_v) => {
  const _g = _v;
  return _g.length === 0 && eq3(name, UNIT);
}, () => "()").otherwise(() => eq3(name, TUPLE) ? `(${showTypeArgs(args)})` : eq3(length2(args), 0) ? name : `${name}<${showTypeArgs(args)}>`)).with({ _tag: "TyFn" }, ({ from, to }) => ((fromS) => `${fromS} -> ${showType(to)}`)(match3(from).with({ _tag: "TyFn" }, () => `(${showType(from)})`).otherwise(() => showType(from)))).with({ _tag: "TyRecord" }, ({ row }) => showRow(row)).with({ _tag: "TySingleton" }, ({ base, value }) => eq3(base, "string") ? show(value) : value).with({ _tag: "TyOneOf" }, ({ members }) => _Str_join2(" | ", map(showType, members))).exhaustive();
var showRowFields = (row) => match3(row).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => (([fields, tailId]) => _tuple(_Array_prepend(`${label}${optional ? "?" : ""}: ${showType(fieldType)}`, fields), tailId))(showRowFields(rest))).with({ _tag: "RowVar" }, ({ id }) => _tuple([], Some3(id))).with({ _tag: "RowEmpty" }, () => _tuple([], None3)).exhaustive();
var showRow = (row) => (([fields, tailId]) => {
  const tail = match3(tailId).with({ _tag: "Some" }, ({ value: id }) => `${eq3(length2(fields), 0) ? "" : " "}| 'r${show(id)}`).with({ _tag: "None" }, () => "").exhaustive();
  return and2(eq3(length2(fields), 0), eq3(tail, "")) ? "{}" : `{ ${_Str_join2(", ", fields)}${tail} }`;
})(showRowFields(row));
var someOfFrom = _curry4(3, (f, xs, i) => match3(_Array_get(i, xs)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: x }) => f(x) ? true : someOfFrom(f, xs, i + 1)).exhaustive());
var someOf = _curry4(2, (f, xs) => someOfFrom(f, xs, 0));
var mkSt = (start) => ({ tv: new Map, rv: new Map, next: start, recorded: [], letSpans: new Map, letUses: new Map });
var recordAt = _curry4(3, (span, t, st) => ({ ...st, recorded: _Array_prepend({ span, ty: t }, st.recorded) }));
var spanKeyOf = (sp) => `${show(sp.start)}:${show(sp.end)}`;
var noteLet = _curry4(2, (span, st) => {
  const k = spanKeyOf(span);
  return { ...st, letSpans: _Map_set(k, span, st.letSpans), letUses: _Map_set(k, [], st.letUses) };
});
var noteUse = _curry4(3, (span, t, st) => {
  const k = spanKeyOf(span);
  return match3(_Map_get(k, st.letUses)).with({ _tag: "None" }, () => st).with({ _tag: "Some" }, ({ value: uses }) => ({ ...st, letUses: _Map_set(k, _Array_append2(t, uses), st.letUses) })).exhaustive();
});
var fail = (message) => Err2({ message });
var freshVar = (st) => _tuple(tVar(st.next), { ...st, next: st.next + 1 });
var freshRowVar = (st) => _tuple(rVar(st.next), { ...st, next: st.next + 1 });
var resolve = _curry4(2, (t, st) => match3(t).with({ _tag: "TyVar" }, ({ id }) => match3(_Map_get(id, st.tv)).with({ _tag: "Some" }, ({ value: next }) => resolve(next, st)).with({ _tag: "None" }, () => t).exhaustive()).otherwise(() => t));
var resolveRow = _curry4(2, (r, st) => match3(r).with({ _tag: "RowVar" }, ({ id }) => match3(_Map_get(id, st.rv)).with({ _tag: "Some" }, ({ value: next }) => resolveRow(next, st)).with({ _tag: "None" }, () => r).exhaustive()).otherwise(() => r));
var zonk = _curry4(2, (t, st) => match3(resolve(t, st)).with({ _tag: "TyVar" }, ({ id }) => tVar(id)).with({ _tag: "TyCon" }, ({ name, args }) => tCon(name, map((a) => zonk(a, st), args))).with({ _tag: "TyFn" }, ({ from, to }) => tArrow(zonk(from, st), zonk(to, st))).with({ _tag: "TyRecord" }, ({ row }) => tRecord(zonkRow(row, st))).with({ _tag: "TySingleton" }, ({ base, value }) => TySingleton(base, value)).with({ _tag: "TyOneOf" }, ({ members }) => tUnion(map((m) => zonk(m, st), members))).exhaustive());
var zonkRow = _curry4(2, (row, st) => match3(resolveRow(row, st)).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => rField(label, zonk(fieldType, st), zonkRow(rest, st), optional)).otherwise((r) => r));
var occurs = _curry4(3, (id, t, st) => match3(resolve(t, st)).with({ _tag: "TyVar" }, ({ id: rid }) => eq3(rid, id)).with({ _tag: "TyCon" }, ({ args }) => someOf((a) => occurs(id, a, st), args)).with({ _tag: "TyFn" }, ({ from, to }) => or2(occurs(id, from, st), occurs(id, to, st))).with({ _tag: "TyRecord" }, ({ row }) => occursRow(id, row, st)).with({ _tag: "TySingleton" }, () => false).with({ _tag: "TyOneOf" }, ({ members }) => someOf((m) => occurs(id, m, st), members)).exhaustive());
var occursRow = _curry4(3, (id, row, st) => match3(resolveRow(row, st)).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => or2(occurs(id, fieldType, st), occursRow(id, rest, st))).otherwise(() => false));
var rowVarOccurs = _curry4(3, (id, row, st) => match3(resolveRow(row, st)).with({ _tag: "RowVar" }, ({ id: rid }) => eq3(rid, id)).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => or2(rowVarOccursInType(id, fieldType, st), rowVarOccurs(id, rest, st))).with({ _tag: "RowEmpty" }, () => false).exhaustive());
var rowVarOccursInType = _curry4(3, (id, t, st) => match3(resolve(t, st)).with({ _tag: "TyVar" }, () => false).with({ _tag: "TyCon" }, ({ args }) => someOf((a) => rowVarOccursInType(id, a, st), args)).with({ _tag: "TyFn" }, ({ from, to }) => or2(rowVarOccursInType(id, from, st), rowVarOccursInType(id, to, st))).with({ _tag: "TyRecord" }, ({ row }) => rowVarOccurs(id, row, st)).with({ _tag: "TySingleton" }, () => false).with({ _tag: "TyOneOf" }, ({ members }) => someOf((m) => rowVarOccursInType(id, m, st), members)).exhaustive());
var isArrowT = (t) => match3(t).with({ _tag: "TyFn" }, () => true).otherwise(() => false);
var isCollection = (name) => or2(or2(or2(eq3(name, "Array"), eq3(name, "List")), eq3(name, "Set")), eq3(name, "Map"));
var isTupleT = (t) => match3(t).with({ _tag: "TyCon" }, ({ name }) => eq3(name, TUPLE)).otherwise(() => false);
var tupleParenMsg = _curry4(3, (a, b, shown) => not2(eq3(isTupleT(a), isTupleT(b))) ? `${shown} \u2014 ((a, b)) => takes one tuple; (a, b) => takes two arguments` : shown);
var collectionUnifyMsg = _curry4(3, (aname, bname, shown) => or2(or2(eq3(aname, bname), not2(isCollection(aname))), not2(isCollection(bname))) ? shown : ((other) => ((hint) => `${shown} \u2014 ${hint}`)(eq3(other, "List") ? "unqualified map/filter/length expect Array; use List.map" : eq3(other, "Set") ? "unqualified map/filter/length expect Array; convert with Set.toArray or use Set.*" : eq3(other, "Map") ? "unqualified map/filter/length expect Array; use Map.*" : `${aname} and ${bname} are distinct collections`))(eq3(aname, "Array") ? bname : eq3(bname, "Array") ? aname : ""));
var unifyMismatch = _curry4(2, (ra, rb) => not2(eq3(isArrowT(ra), isArrowT(rb))) ? (([fn, val]) => fail(tupleParenMsg(ra, rb, `cannot unify ${showType(ra)} with ${showType(rb)} \u2014 a function (${showType(fn)}) was used where a ${showType(val)} was expected; a call may be missing an argument`)))(isArrowT(ra) ? _tuple(ra, rb) : _tuple(rb, ra)) : fail(tupleParenMsg(ra, rb, `cannot unify ${showType(ra)} with ${showType(rb)}`)));
var unifyArgs = _curry4(4, (as_, bs, i, st) => match3(_Array_get(i, as_)).with({ _tag: "None" }, () => Ok2(st)).with({ _tag: "Some" }, ({ value: a }) => match3(_Array_get(i, bs)).with({ _tag: "None" }, () => Ok2(st)).with({ _tag: "Some" }, ({ value: b }) => _Result_flatMap((s1) => unifyArgs(as_, bs, i + 1, s1), unify(a, b, st))).exhaustive()).exhaustive());
var isPrimT = _curry4(2, (t, name) => match3(t).with({ _tag: "TyCon" }, ({ name: n, args }) => and2(eq3(n, name), eq3(length2(args), 0))).otherwise(() => false));
var isLitOnlyUnion = (members) => match3(members).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => true).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "TySingleton";
}, ([, ...rest]) => isLitOnlyUnion(rest)).otherwise(() => false);
var widenLitBindingsFrom = _curry4(3, (ids, lit, st) => match3(ids).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => st).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([id, ...rest]) => match3(_Map_get(id, st.tv)).with({ _tag: "Some" }, ({ value: t }) => match3(resolve(t, st)).with({ _tag: "TySingleton" }, ({ base, value }) => match3(lit).with({ _tag: "TySingleton" }, ({ base: lbase, value: lvalue }) => and2(eq3(base, lbase), eq3(value, lvalue)) ? widenLitBindingsFrom(rest, lit, { ...st, tv: _Map_set(id, tPrim(base), st.tv) }) : widenLitBindingsFrom(rest, lit, st)).otherwise(() => widenLitBindingsFrom(rest, lit, st))).otherwise(() => widenLitBindingsFrom(rest, lit, st))).with({ _tag: "None" }, () => widenLitBindingsFrom(rest, lit, st)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var widenLitBindings = _curry4(2, (lit, st) => widenLitBindingsFrom(_Map_keys(st.tv), lit, st));
var litInUnionFrom = _curry4(4, (lit, members, i, st) => match3(_Array_get(i, members)).with({ _tag: "None" }, () => fail(`cannot unify ${showType(lit)} with ${showType(TyOneOf(members))}`)).with({ _tag: "Some" }, ({ value: m }) => match3(m).with({ _tag: "TySingleton" }, ({ base, value }) => match3(lit).with({ _tag: "TySingleton" }, ({ base: lbase, value: lvalue }) => and2(eq3(base, lbase), eq3(value, lvalue)) ? Ok2(st) : litInUnionFrom(lit, members, i + 1, st)).otherwise(() => litInUnionFrom(lit, members, i + 1, st))).otherwise(() => match3(unify(lit, m, st)).with({ _tag: "Ok" }, ({ value: st1 }) => Ok2(st1)).with({ _tag: "Err" }, () => litInUnionFrom(lit, members, i + 1, st)).exhaustive())).exhaustive());
var unifyMemberAgainstUnionFrom = _curry4(4, (member, members, i, st) => match3(member).with({ _tag: "TySingleton" }, () => litInUnionFrom(member, members, 0, st)).otherwise(() => unifyConcreteAgainstUnionFrom(member, members, i, st)));
var unifyConcreteAgainstUnionFrom = _curry4(4, (member, members, i, st) => match3(_Array_get(i, members)).with({ _tag: "None" }, () => fail(`cannot unify ${showType(member)} with ${showType(TyOneOf(members))}`)).with({ _tag: "Some" }, ({ value: m }) => match3(unify(member, m, st)).with({ _tag: "Ok" }, ({ value: st1 }) => Ok2(st1)).with({ _tag: "Err" }, () => unifyConcreteAgainstUnionFrom(member, members, i + 1, st)).exhaustive()).exhaustive());
var unifyUnionMembersFrom = _curry4(4, (members, u, i, st) => match3(_Array_get(i, members)).with({ _tag: "None" }, () => Ok2(st)).with({ _tag: "Some" }, ({ value: m }) => match3(u).with({ _tag: "TyOneOf" }, ({ members: ums }) => _Result_flatMap((s1) => unifyUnionMembersFrom(members, u, i + 1, s1), unifyMemberAgainstUnionFrom(m, ums, 0, st))).otherwise(() => Ok2(st))).exhaustive());
var unifyLitUnion = _curry4(3, (a, b, st) => match3(a).with({ _tag: "TySingleton" }, ({ base: abase, value: aval }) => match3(b).with({ _tag: "TySingleton" }, ({ base: bbase, value: bval }) => and2(eq3(abase, bbase), eq3(aval, bval)) ? Ok2(st) : eq3(abase, bbase) ? Ok2(widenLitBindings(b, widenLitBindings(a, st))) : fail(`cannot unify ${showType(a)} with ${showType(b)}`)).with({ _tag: "TyOneOf" }, ({ members }) => litInUnionFrom(a, members, 0, st)).otherwise(() => isPrimT(b, abase) ? Ok2(st) : fail(`cannot unify ${showType(a)} with ${showType(b)}`))).with({ _tag: "TyOneOf" }, ({ members: amembers }) => match3(b).with({ _tag: "TySingleton" }, () => litInUnionFrom(b, amembers, 0, st)).with({ _tag: "TyOneOf" }, ({ members: bmembers }) => _Result_flatMap((s1) => unifyUnionMembersFrom(bmembers, a, 0, s1), unifyUnionMembersFrom(amembers, b, 0, st))).otherwise(() => isLitOnlyUnion(amembers) ? fail(`cannot unify ${showType(a)} with ${showType(b)}`) : unifyMemberAgainstUnionFrom(b, amembers, 0, st))).otherwise(() => match3(b).with({ _tag: "TySingleton" }, ({ base: bbase }) => isPrimT(a, bbase) ? Ok2(st) : fail(`cannot unify ${showType(a)} with ${showType(b)}`)).with({ _tag: "TyOneOf" }, ({ members: bmembers }) => isLitOnlyUnion(bmembers) ? fail(`cannot unify ${showType(a)} with ${showType(b)}`) : unifyMemberAgainstUnionFrom(a, bmembers, 0, st)).otherwise(() => fail(`cannot unify ${showType(a)} with ${showType(b)}`))));
var unify = _curry4(3, (a, b, st) => {
  const ra = resolve(a, st);
  const rb = resolve(b, st);
  return match3(ra).with({ _tag: "TyVar" }, ({ id: aid }) => match3(rb).with({ _tag: "TyVar" }, ({ id: bid }) => eq3(aid, bid) ? Ok2(st) : bindVar(aid, rb, st)).otherwise(() => bindVar(aid, rb, st))).with({ _tag: "TyCon" }, ({ name: aname, args: aargs }) => match3(rb).with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st)).with({ _tag: "TyCon" }, ({ name: bname, args: bargs }) => and2(eq3(aname, bname), eq3(length2(aargs), length2(bargs))) ? unifyArgs(aargs, bargs, 0, st) : fail(tupleParenMsg(ra, rb, collectionUnifyMsg(aname, bname, `cannot unify ${showType(ra)} with ${showType(rb)}`)))).with({ _tag: "TySingleton" }, () => unifyLitUnion(ra, rb, st)).with({ _tag: "TyOneOf" }, () => unifyLitUnion(ra, rb, st)).otherwise(() => unifyMismatch(ra, rb))).with({ _tag: "TyFn" }, ({ from: afrom, to: ato }) => match3(rb).with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st)).with({ _tag: "TyFn" }, ({ from: bfrom, to: bto }) => _Result_flatMap((s1) => unify(ato, bto, s1), unify(afrom, bfrom, st))).with({ _tag: "TySingleton" }, () => unifyLitUnion(ra, rb, st)).with({ _tag: "TyOneOf" }, () => unifyLitUnion(ra, rb, st)).otherwise(() => unifyMismatch(ra, rb))).with({ _tag: "TyRecord" }, ({ row: arow }) => match3(rb).with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st)).with({ _tag: "TyRecord" }, ({ row: brow }) => unifyRows(arow, brow, st)).with({ _tag: "TySingleton" }, () => unifyLitUnion(ra, rb, st)).with({ _tag: "TyOneOf" }, () => unifyLitUnion(ra, rb, st)).otherwise(() => unifyMismatch(ra, rb))).with({ _tag: "TySingleton" }, () => match3(rb).with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st)).otherwise(() => unifyLitUnion(ra, rb, st))).with({ _tag: "TyOneOf" }, () => match3(rb).with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st)).otherwise(() => unifyLitUnion(ra, rb, st))).exhaustive();
});
var bindVar = _curry4(3, (id, t, st) => occurs(id, t, st) ? fail(`infinite type: 't${show(id)} occurs in ${showType(zonk(t, st))}`) : Ok2({ ...st, tv: _Map_set(id, t, st.tv) }));
var rewriteRow = _curry4(3, (row, label, st) => match3(resolveRow(row, st)).with({ _tag: "RowEmpty" }, () => fail(`record missing field '${label}'`)).with({ _tag: "RowExtend" }, ({ label: rlabel, fieldType: rtype, optional: ropt, rest: rrest }) => eq3(rlabel, label) ? Ok2(_tuple(rtype, ropt, rrest, st)) : _Result_map(([subType, subOpt, subRest, subSt]) => _tuple(subType, subOpt, rField(rlabel, rtype, subRest, ropt), subSt), rewriteRow(rrest, label, st))).with({ _tag: "RowVar" }, ({ id: rid }) => (([freshT, st1]) => (([freshTail, st2]) => Ok2(_tuple(freshT, false, freshTail, { ...st2, rv: _Map_set(rid, rExtend(label, freshT, freshTail), st2.rv) })))(freshRowVar(st1)))(freshVar(st))).exhaustive());
var unifyRows = _curry4(3, (r1, r2, st) => {
  const a = resolveRow(r1, st);
  const b = resolveRow(r2, st);
  return match3(a).with({ _tag: "RowEmpty" }, () => match3(b).with({ _tag: "RowEmpty" }, () => Ok2(st)).with({ _tag: "RowVar" }, ({ id: bid }) => bindRowVar(bid, a, st)).with({ _tag: "RowExtend" }, ({ label }) => fail(`record missing field '${label}'`)).exhaustive()).with({ _tag: "RowVar" }, ({ id: aid }) => bindRowVar(aid, b, st)).with({ _tag: "RowExtend" }, ({ label: alabel, fieldType: atype, optional: aopt, rest: arest }) => match3(b).with({ _tag: "RowEmpty" }, () => fail(`record has extra field '${alabel}'`)).with({ _tag: "RowVar" }, ({ id: bid }) => bindRowVar(bid, a, st)).with({ _tag: "RowExtend" }, () => _Result_flatMap(([btype, bopt, brest, s1]) => eq3(aopt, bopt) ? _Result_flatMap((s2) => unifyRows(arest, brest, s2), unify(atype, btype, s1)) : fail(aopt ? `record field '${alabel}' is optional but required on the other side` : `record field '${alabel}' is required but optional on the other side`), rewriteRow(b, alabel, st))).exhaustive()).exhaustive();
});
var bindRowVar = _curry4(3, (id, row, st) => match3(resolveRow(row, st)).with((_v) => {
  const _g = _v;
  return _g._tag === "RowVar" && (({ id: rid }) => eq3(rid, id))(_g);
}, ({ id: rid }) => Ok2(st)).otherwise((r) => rowVarOccurs(id, r, st) ? fail("infinite record type") : Ok2({ ...st, rv: _Map_set(id, r, st.rv) })));
var fits = _curry4(3, (actual, expected, st) => {
  const ra = resolve(actual, st);
  const rb = resolve(expected, st);
  return match3(ra).with({ _tag: "TyVar" }, ({ id: aid }) => bindVar(aid, rb, st)).otherwise(() => match3(rb).with({ _tag: "TyVar" }, ({ id: bid }) => bindVar(bid, ra, st)).with({ _tag: "TyRecord" }, ({ row: erow }) => match3(ra).with({ _tag: "TyRecord" }, ({ row: arow }) => fitsRows(arow, erow, st)).otherwise(() => unify(actual, expected, st))).otherwise(() => unify(actual, expected, st)));
});
var fitsRows = _curry4(3, (actual, expected, st) => {
  const exp = resolveRow(expected, st);
  const act = resolveRow(actual, st);
  return match3(exp).with({ _tag: "RowVar" }, ({ id: eid }) => bindRowVar(eid, act, st)).with({ _tag: "RowEmpty" }, () => match3(act).with({ _tag: "RowEmpty" }, () => Ok2(st)).with({ _tag: "RowVar" }, ({ id: aid }) => bindRowVar(aid, exp, st)).with({ _tag: "RowExtend" }, ({ label }) => fail(`record has extra field '${label}'`)).exhaustive()).with({ _tag: "RowExtend" }, ({ label: elabel, fieldType: etype, optional: eopt, rest: erest }) => ((rw) => match3(rw).with({ _tag: "Err" }, () => eopt ? fitsRows(act, erest, st) : fail(`record missing field '${elabel}'`)).with({ _tag: "Ok" }, ({ value: hit }) => (([htype, hopt, hrest, s1]) => and2(hopt, not2(eopt)) ? fail(`record field '${elabel}' is required but missing or optional`) : _Result_flatMap((s2) => fitsRows(hrest, erest, s2), unify(htype, etype, s1)))(hit)).exhaustive())(rewriteRow(act, elabel, st))).exhaustive();
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

var jxTokName = (t) => match4(t).with({ _tag: "TEq" }, () => "eq").with({ _tag: "TLbrace" }, () => "lbrace").with({ _tag: "TRbrace" }, () => "rbrace").with({ _tag: "TSpread" }, () => "spread").with({ _tag: "TSlash" }, () => "slash").with({ _tag: "TLt" }, () => "lt").with({ _tag: "TGt" }, () => "gt").with({ _tag: "TId" }, () => "id").with({ _tag: "TStr" }, () => "str").with({ _tag: "TNum" }, () => "num").with({ _tag: "TBool" }, () => "bool").with({ _tag: "TEof" }, () => "eof").otherwise(() => "tok");
var jxEofTok = { tok: TEof, start: 0, end: 0, doc: None4 };
var jxTokAt = _curry5(2, (toks, i) => _Option_unwrapOr2(jxEofTok, _Array_get2(i, toks)));
var jxSpanOf = (lt3) => ({ start: lt3.start, end: lt3.end });
var jxToEnd = _curry5(3, (start, toks, pos) => ({ start: start.start, end: jxTokAt(toks, pos - 1).end }));
var jxErrAt = _curry5(2, (message, lt3) => Err3({ message, start: lt3.start, end: lt3.end }));
var jxExpectTok = _curry5(3, (t, toks, pos) => {
  const lt3 = jxTokAt(toks, pos);
  return eq4(lt3.tok, t) ? Ok3(pos + 1) : jxErrAt(`expected ${jxTokName(t)}, got ${jxTokName(lt3.tok)}`, lt3);
});
var jxExpectId = _curry5(2, (toks, pos) => {
  const lt3 = jxTokAt(toks, pos);
  return match4(lt3.tok).with({ _tag: "TId" }, ({ value: name }) => Ok3(_tuple2({ name, span: jxSpanOf(lt3) }, pos + 1))).otherwise((t) => jxErrAt(`expected id, got ${jxTokName(t)}`, lt3));
});
var jxKeywordText = (t) => match4(t).with({ _tag: "TLet" }, () => Some4("let")).with({ _tag: "TType" }, () => Some4("type")).with({ _tag: "TExtern" }, () => Some4("extern")).with({ _tag: "TSwitch" }, () => Some4("switch")).with({ _tag: "TLoop" }, () => Some4("loop")).with({ _tag: "TRecur" }, () => Some4("recur")).with({ _tag: "TDo" }, () => Some4("do")).with({ _tag: "TImport" }, () => Some4("import")).with({ _tag: "TExport" }, () => Some4("export")).otherwise(() => None4);
var jxExpectLabel = _curry5(2, (toks, pos) => {
  const lt3 = jxTokAt(toks, pos);
  return match4(jxKeywordText(lt3.tok)).with({ _tag: "Some" }, ({ value: name }) => Ok3(_tuple2({ name, span: jxSpanOf(lt3) }, pos + 1))).with({ _tag: "None" }, () => jxExpectId(toks, pos)).exhaustive();
});
var jxAttrNameFrom = _curry5(3, (toks, pos, acc) => {
  const minusTok = jxTokAt(toks, pos);
  const partTok = jxTokAt(toks, pos + 1);
  return and3(and3(eq4(minusTok.tok, TMinus), eq4(minusTok.start, acc.span.end)), eq4(partTok.start, minusTok.end)) ? match4(jxExpectLabel(toks, pos + 1)).with((_v) => {
    const _g = _v;
    return _g._tag === "Ok";
  }, ({ value: [part, p1] }) => jxAttrNameFrom(toks, p1, { name: `${acc.name}-${part.name}`, span: { start: acc.span.start, end: part.span.end } })).with({ _tag: "Err" }, () => _tuple2(acc, pos)).exhaustive() : _tuple2(acc, pos);
});
var jxExpectAttrName = _curry5(2, (toks, pos) => _Result_map2(([head, p1]) => jxAttrNameFrom(toks, p1, head), jxExpectLabel(toks, pos)));
var jxIsUpper = (s) => _Option_exists2((n) => and3(n >= 65, n <= 90), _Str_codeAt2(0, s));
var jxExprSpan = (e) => match4(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var makeJsxCall = _curry5(7, (tagExpr, fields, spreadOpt, children, startTok, toks, endPos) => {
  const fullSpan = jxToEnd(jxSpanOf(startTok), toks, endPos);
  const pragmaRef = ERef("h", jxSpanOf(startTok));
  const propsRecord = ERecord(fields, spreadOpt, fullSpan);
  const childrenArr = EArr(children, fullSpan);
  return ECall(pragmaRef, [tagExpr, propsRecord, childrenArr], Some4("jsx"), fullSpan);
});
var parseJsxAttributes = _curry5(5, (toks, pos, fieldsAcc, spreadAcc, parseExpr) => {
  const tk = jxTokAt(toks, pos).tok;
  const nxt = jxTokAt(toks, pos + 1).tok;
  return or3(eq4(tk, TGt), and3(eq4(tk, TSlash), eq4(nxt, TGt))) ? Ok3(_tuple2(fieldsAcc, spreadAcc, pos)) : eq4(tk, TLbrace) ? _Result_flatMap2((p1) => _Result_flatMap2(([spExpr, p2]) => _Result_flatMap2((p3) => parseJsxAttributes(toks, p3, fieldsAcc, Some4(spExpr), parseExpr), jxExpectTok(TRbrace, toks, p2)), parseExpr(toks, p1)), jxExpectTok(TSpread, toks, pos + 1)) : _Result_flatMap2(([attrId, p1]) => (([valExpr, p2]) => {
    const field = { name: attrId.name, value: valExpr };
    return parseJsxAttributes(toks, p2, _Array_append3(field, fieldsAcc), spreadAcc, parseExpr);
  })(eq4(jxTokAt(toks, p1).tok, TEq) ? ((pEq) => match4(jxTokAt(toks, pEq).tok).with({ _tag: "TStr" }, ({ value: v }) => _tuple2(EStr(v, jxSpanOf(jxTokAt(toks, pEq))), pEq + 1)).with({ _tag: "TLbrace" }, () => match4(parseExpr(toks, pEq + 1)).with((_v) => {
    const _g = _v;
    return _g._tag === "Ok";
  }, ({ value: [e, pR] }) => _tuple2(e, pR + 1)).with({ _tag: "Err" }, () => _tuple2(EBool(true, attrId.span), pEq)).exhaustive()).otherwise(() => _tuple2(EBool(true, attrId.span), pEq)))(p1 + 1) : _tuple2(EBool(true, attrId.span), p1)), jxExpectAttrName(toks, pos));
});
var parseJsxChildren = _curry5(5, (expectedTag, toks, pos, acc, parseExpr) => {
  const lt3 = jxTokAt(toks, pos);
  const nxt = jxTokAt(toks, pos + 1);
  return eq4(lt3.tok, TEof) ? jxErrAt(eq4(expectedTag, "") ? "unclosed JSX fragment" : "unclosed JSX tag", lt3) : and3(eq4(lt3.tok, TLt), eq4(nxt.tok, TSlash)) ? eq4(expectedTag, "") ? _Result_flatMap2((p1) => Ok3(_tuple2(acc, p1)), jxExpectTok(TGt, toks, pos + 2)) : _Result_flatMap2(([closingId, p1]) => _Result_flatMap2((p2) => eq4(closingId.name, expectedTag) ? Ok3(_tuple2(acc, p2)) : jxErrAt("mismatched JSX closing tag", lt3), jxExpectTok(TGt, toks, p1)), jxExpectId(toks, pos + 2)) : eq4(lt3.tok, TLt) ? _Result_flatMap2(([childJsx, p1]) => parseJsxChildren(expectedTag, toks, p1, _Array_append3(SEExpr(childJsx), acc), parseExpr), parseJsx(toks, pos, parseExpr)) : eq4(lt3.tok, TLbrace) ? eq4(nxt.tok, TSpread) ? _Result_flatMap2(([spChild, p1]) => _Result_flatMap2((p2) => parseJsxChildren(expectedTag, toks, p2, _Array_append3(SESpread(spChild), acc), parseExpr), jxExpectTok(TRbrace, toks, p1)), parseExpr(toks, pos + 2)) : _Result_flatMap2(([childExpr, p1]) => _Result_flatMap2((p2) => parseJsxChildren(expectedTag, toks, p2, _Array_append3(SEExpr(childExpr), acc), parseExpr), jxExpectTok(TRbrace, toks, p1)), parseExpr(toks, pos + 1)) : match4(lt3.tok).with({ _tag: "TStr" }, ({ value: v }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append3(SEExpr(EStr(v, jxSpanOf(lt3))), acc), parseExpr)).with({ _tag: "TNum" }, ({ value: v, raw }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append3(SEExpr(ENum(v, raw, jxSpanOf(lt3))), acc), parseExpr)).with({ _tag: "TBool" }, ({ value: v }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append3(SEExpr(EBool(v, jxSpanOf(lt3))), acc), parseExpr)).with({ _tag: "TId" }, ({ value: v }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append3(SEExpr(EStr(v, jxSpanOf(lt3))), acc), parseExpr)).otherwise(() => jxErrAt("unexpected token in JSX children", lt3));
});
var parseJsx = _curry5(3, (toks, pos, parseExpr) => {
  const startTok = jxTokAt(toks, pos);
  const nxt = jxTokAt(toks, pos + 1);
  return eq4(nxt.tok, TGt) ? _Result_flatMap2(([children, p1]) => Ok3(_tuple2(makeJsxCall(EStr("Fragment", jxSpanOf(startTok)), [], None4, children, startTok, toks, p1), p1)), parseJsxChildren("", toks, pos + 2, [], parseExpr)) : _Result_flatMap2(([firstId, p1]) => ((tagRef) => ((tagNameStr) => _Result_flatMap2(([fields, spreadOpt, p2]) => {
    const isSelfClosing = eq4(jxTokAt(toks, p2).tok, TSlash);
    return _Result_flatMap2((p3) => isSelfClosing ? Ok3(_tuple2(makeJsxCall(tagRef, fields, spreadOpt, [], startTok, toks, p3), p3)) : _Result_flatMap2(([children, p4]) => Ok3(_tuple2(makeJsxCall(tagRef, fields, spreadOpt, children, startTok, toks, p4), p4)), parseJsxChildren(tagNameStr, toks, p3, [], parseExpr)), isSelfClosing ? jxExpectTok(TGt, toks, p2 + 1) : jxExpectTok(TGt, toks, p2));
  }, parseJsxAttributes(toks, p1, [], None4, parseExpr)))(firstId.name))(jxIsUpper(firstId.name) ? ERef(firstId.name, firstId.span) : EStr(firstId.name, firstId.span)), jxExpectId(toks, pos + 1));
});
var parseJsxAtom = _curry5(3, (toks, pos, parseExpr) => eq4(jxTokAt(toks, pos).tok, TLt) ? _Result_map2((claim) => Some4(claim), parseJsx(toks, pos, parseExpr)) : Ok3(None4));
var seqElemExpr = (el) => match4(el).with({ _tag: "SEExpr" }, ({ expr: e }) => e).with({ _tag: "SESpread" }, ({ expr: e }) => e).exhaustive();
var inferJsxArrElems = _curry5(3, (elements, st, inferExpr) => match4(elements).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok3(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([el, ...rest]) => _Result_flatMap2(([_, st1]) => inferJsxArrElems(rest, st1, inferExpr), inferExpr(seqElemExpr(el), st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferJsxChildren = _curry5(3, (children, st, inferExpr) => match4(children).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok3(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "EArr";
}, ([{ elements }, ...rest]) => _Result_flatMap2((st1) => inferJsxChildren(rest, st1, inferExpr), inferJsxArrElems(elements, st, inferExpr))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([child, ...rest]) => _Result_flatMap2(([_, st1]) => inferJsxChildren(rest, st1, inferExpr), inferExpr(child, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var rowField = _curry5(2, (row, label) => match4(row).with({ _tag: "RowExtend" }, ({ label: l, fieldType, rest }) => eq4(l, label) ? Some4(fieldType) : rowField(rest, label)).with({ _tag: "RowEmpty" }, () => None4).with({ _tag: "RowVar" }, () => None4).exhaustive());
var fieldNamed = _curry5(2, (label, fields) => match4(fields).with((_v) => _v.length === 0, () => false).with((_v) => _v.length >= 1, ([f, ...rest]) => or3(eq4(f.name, label), fieldNamed(label, rest))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var recordHasAttr = _curry5(2, (expr, label) => match4(expr).with({ _tag: "ERecord" }, ({ fields }) => fieldNamed(label, fields)).otherwise(() => false));
var jsxChildCount = (restArgs) => match4(restArgs).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "EArr";
}, ([{ elements }]) => length3(elements)).otherwise(() => 0);
var jsxPropsWithSynthesizedChildren = _curry5(4, (propsT, propsExpr, expectedRow, restArgs) => match4(rowField(expectedRow, "children")).with({ _tag: "None" }, () => propsT).with({ _tag: "Some" }, ({ value: expectedChildren }) => match4(propsT).with({ _tag: "TyRecord" }, ({ row: prow }) => or3(recordHasAttr(propsExpr, "children"), eq4(jsxChildCount(restArgs), 0)) ? propsT : tRecord(rExtend("children", expectedChildren, prow))).otherwise(() => propsT)).exhaustive());
var attrKindType = (kind) => eq4(kind, "string") ? Some4(tPrim("string")) : eq4(kind, "number") ? Some4(tPrim("number")) : eq4(kind, "bool") ? Some4(tPrim("bool")) : eq4(kind, "string|number") ? Some4(tUnion([tPrim("string"), tPrim("number")])) : eq4(kind, "string|bool") ? Some4(tUnion([tPrim("string"), tPrim("bool")])) : _Str_startsWith("enum:", kind) ? Some4(tUnion(map2(tLit, _Str_split(",", _Str_slice2(5, _Str_length2(kind), kind))))) : None4;
var intrinsicAttrType = _curry5(2, (tag, attr) => _Option_flatMap(attrKindType, _Option_flatMap(_Map_get2(attr), _Map_get2(tag, intrinsicElements))));
var inferIntrinsicFields = _curry5(4, (tag, fields, st, api) => match4(fields).with((_v) => _v.length === 0, () => Ok3(st)).with((_v) => _v.length >= 1, ([f, ...rest]) => match4(intrinsicAttrType(tag, f.name)).with({ _tag: "Some" }, ({ value: expectedT }) => _Result_flatMap2(([valT, st1]) => _Result_flatMap2((st2) => inferIntrinsicFields(tag, rest, st2, api), api.unify(valT, expectedT, st1, jxExprSpan(f.value))), api.inferExpr(f.value, st))).with({ _tag: "None" }, () => _Result_flatMap2(([_, st1]) => inferIntrinsicFields(tag, rest, st1, api), api.inferExpr(f.value, st))).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferJsxCall = _curry5(5, (tagExpr, propsExpr, restArgs, st, api) => _Result_flatMap2(([tagT, st1]) => _Result_flatMap2(([propsT, st2]) => _Result_flatMap2((st3) => {
  const zonkedTag = zonk(tagT, st3);
  return match4(zonkedTag).with({ _tag: "TyFn" }, ({ from, to }) => match4(from).with({ _tag: "TyRecord" }, ({ row: expectedRow }) => ((propsForCheck) => _Result_map2((st4) => _tuple2(zonk(to, st4), st4), api.unify(propsForCheck, from, st3, jxExprSpan(propsExpr))))(jsxPropsWithSynthesizedChildren(propsT, propsExpr, expectedRow, restArgs))).otherwise(() => Ok3(_tuple2(tPrim("VNode"), st3)))).otherwise(() => match4(tagExpr).with({ _tag: "EStr" }, ({ value: tagName }) => match4(propsExpr).with({ _tag: "ERecord" }, ({ fields }) => _Result_map2((st4) => _tuple2(tPrim("VNode"), st4), inferIntrinsicFields(tagName, fields, st3, api))).otherwise(() => Ok3(_tuple2(tPrim("VNode"), st3)))).otherwise(() => Ok3(_tuple2(tPrim("VNode"), st3))));
}, inferJsxChildren(restArgs, st2, api.inferExpr)), api.inferExpr(propsExpr, st1)), api.inferExpr(tagExpr, st)));
var inferJsxCallHook = _curry5(5, (_fn, args, origin, st, api) => match4(origin).with({ _tag: "Some" }, ({ value: o }) => eq4(o, "jsx") ? match4(args).with((_v) => {
  const _g = _v;
  return _g.length >= 2;
}, ([tagExpr, propsExpr, ...rest]) => _Result_map2((r) => Some4(r), inferJsxCall(tagExpr, propsExpr, rest, st, api))).otherwise(() => Ok3(None4)) : Ok3(None4)).with({ _tag: "None" }, () => Ok3(None4)).exhaustive());
var jsxPlugin = { name: "jsx", parse: Some4(parseJsxAtom), inferCall: Some4(inferJsxCallHook) };

import { None as None5, Ok as Ok4, Some as Some5, _Array_drop, _Array_get as _Array_get3, _Result_flatMap as _Result_flatMap3, _Result_map as _Result_map3, _curry as _curry6, _tuple as _tuple3, and as and4, eq as eq5, length as length4 } from "@mochi/compiler/runtime";
import { match as match5 } from "@onrails/pattern";
var arrOf = (elem) => tCon("Array", [elem]);
var setStateDomain = (state) => tUnion([state, tArrow(state, state)]);
var isRef = _curry6(2, (fn, name) => match5(fn).with({ _tag: "ERef" }, ({ name: actual }) => eq5(actual, name)).otherwise(() => false));
var preactSpan = (e) => match5(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var inferArgs = _curry6(3, (args, st, inferExpr) => match5(args).with((_v) => _v.length === 0, () => Ok4(st)).with((_v) => _v.length >= 1, ([arg, ...rest]) => _Result_flatMap3(([_, st1]) => inferArgs(rest, st1, inferExpr), inferExpr(arg, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferUseState = _curry6(4, (fn, args, st, api) => and4(isRef(fn, "useState"), eq5(length4(args), 1)) ? match5(_Array_get3(0, args)).with({ _tag: "None" }, () => Ok4(None5)).with({ _tag: "Some" }, ({ value: init }) => _Result_map3(([state, st1]) => Some5(_tuple3(tTuple([zonk(state, st1), tArrow(setStateDomain(zonk(state, st1)), tUnit)]), st1)), api.inferExpr(init, st))).exhaustive() : Ok4(None5));
var inferUseLazyState = _curry6(4, (fn, args, st, api) => and4(isRef(fn, "useLazyState"), eq5(length4(args), 1)) ? match5(_Array_get3(0, args)).with({ _tag: "None" }, () => Ok4(None5)).with({ _tag: "Some" }, ({ value: thunk }) => (([state, st1]) => _Result_flatMap3(([thunkT, st2]) => _Result_map3((st3) => {
  const value = zonk(state, st3);
  return Some5(_tuple3(tTuple([value, tArrow(setStateDomain(value), tUnit)]), st3));
}, api.unify(thunkT, tArrow(tUnit, state), st2, preactSpan(thunk))), api.inferExpr(thunk, st1)))(freshVar(st))).exhaustive() : Ok4(None5));
var inferUseRef = _curry6(4, (fn, args, st, api) => and4(isRef(fn, "useRef"), eq5(length4(args), 1)) ? match5(_Array_get3(0, args)).with({ _tag: "None" }, () => Ok4(None5)).with({ _tag: "Some" }, ({ value: init }) => _Result_map3(([state, st1]) => Some5(_tuple3(tRecord(rExtend("current", zonk(state, st1), RowEmpty)), st1)), api.inferExpr(init, st))).exhaustive() : Ok4(None5));
var inferEffectLike = _curry6(5, (fn, args, st, api, name) => and4(isRef(fn, name), length4(args) >= 1) ? match5(_Array_get3(0, args)).with({ _tag: "None" }, () => Ok4(None5)).with({ _tag: "Some" }, ({ value: effect }) => (([cleanup, st1]) => _Result_flatMap3(([effectT, st2]) => _Result_flatMap3((st3) => eq5(length4(args), 1) ? (([dep, st4]) => Ok4(Some5(_tuple3(tArrow(arrOf(dep), tUnit), st4))))(freshVar(st3)) : _Result_map3((st4) => Some5(_tuple3(tUnit, st4)), inferArgs(_Array_drop(1, args), st3, api.inferExpr)), api.unify(effectT, tArrow(tUnit, cleanup), st2, preactSpan(effect))), api.inferExpr(effect, st1)))(freshVar(st))).exhaustive() : Ok4(None5));
var inferUseCallback = _curry6(4, (fn, args, st, api) => and4(isRef(fn, "useCallback"), length4(args) >= 1) ? match5(_Array_get3(0, args)).with({ _tag: "None" }, () => Ok4(None5)).with({ _tag: "Some" }, ({ value: callback }) => _Result_flatMap3(([callbackT, st1]) => eq5(length4(args), 1) ? (([dep, st2]) => Ok4(Some5(_tuple3(tArrow(arrOf(dep), zonk(callbackT, st2)), st2))))(freshVar(st1)) : _Result_map3((st2) => Some5(_tuple3(zonk(callbackT, st2), st2)), inferArgs(_Array_drop(1, args), st1, api.inferExpr)), api.inferExpr(callback, st))).exhaustive() : Ok4(None5));
var inferUseMemo = _curry6(4, (fn, args, st, api) => and4(isRef(fn, "useMemo"), length4(args) >= 1) ? match5(_Array_get3(0, args)).with({ _tag: "None" }, () => Ok4(None5)).with({ _tag: "Some" }, ({ value: thunk }) => (([value, st1]) => _Result_flatMap3(([thunkT, st2]) => _Result_flatMap3((st3) => eq5(length4(args), 1) ? (([dep, st4]) => Ok4(Some5(_tuple3(tArrow(arrOf(dep), zonk(value, st4)), st4))))(freshVar(st3)) : _Result_map3((st4) => Some5(_tuple3(zonk(value, st4), st4)), inferArgs(_Array_drop(1, args), st3, api.inferExpr)), api.unify(thunkT, tArrow(tUnit, value), st2, preactSpan(thunk))), api.inferExpr(thunk, st1)))(freshVar(st))).exhaustive() : Ok4(None5));
var inferHookDeps = _curry6(4, (fn, args, st, api) => {
  const expected = isRef(fn, "hookDeps0") ? Some5(0) : isRef(fn, "hookDeps1") ? Some5(1) : isRef(fn, "hookDeps2") ? Some5(2) : isRef(fn, "hookDeps") ? Some5(3) : None5;
  return match5(expected).with({ _tag: "Some" }, ({ value: n }) => eq5(length4(args), n) ? _Result_map3((st1) => (([elem, st2]) => Some5(_tuple3(arrOf(elem), st2)))(freshVar(st1)), inferArgs(args, st, api.inferExpr)) : Ok4(None5)).with({ _tag: "None" }, () => Ok4(None5)).exhaustive();
});
var inferPreactCall = _curry6(5, (fn, args, _origin, st, api) => _Result_flatMap3((first) => match5(first).with({ _tag: "Some" }, () => Ok4(first)).with({ _tag: "None" }, () => _Result_flatMap3((lazy) => match5(lazy).with({ _tag: "Some" }, () => Ok4(lazy)).with({ _tag: "None" }, () => _Result_flatMap3((ref) => match5(ref).with({ _tag: "Some" }, () => Ok4(ref)).with({ _tag: "None" }, () => _Result_flatMap3((effect) => match5(effect).with({ _tag: "Some" }, () => Ok4(effect)).with({ _tag: "None" }, () => _Result_flatMap3((layout) => match5(layout).with({ _tag: "Some" }, () => Ok4(layout)).with({ _tag: "None" }, () => _Result_flatMap3((callback) => match5(callback).with({ _tag: "Some" }, () => Ok4(callback)).with({ _tag: "None" }, () => _Result_flatMap3((memo) => match5(memo).with({ _tag: "Some" }, () => Ok4(memo)).with({ _tag: "None" }, () => inferHookDeps(fn, args, st, api)).exhaustive(), inferUseMemo(fn, args, st, api))).exhaustive(), inferUseCallback(fn, args, st, api))).exhaustive(), inferEffectLike(fn, args, st, api, "useLayoutEffect"))).exhaustive(), inferEffectLike(fn, args, st, api, "useEffect"))).exhaustive(), inferUseRef(fn, args, st, api))).exhaustive(), inferUseLazyState(fn, args, st, api))).exhaustive(), inferUseState(fn, args, st, api)));
var preactPlugin = { name: "preact", parse: None5, inferCall: Some5(inferPreactCall) };

var DEFAULT_PLUGINS = [jsxPlugin];
var resolvePlugins = _curry7(2, (pluginsOpt, builtins) => match6(pluginsOpt).with({ _tag: "None" }, () => builtins).with({ _tag: "Some" }, ({ value: ps }) => eq6(length5(ps), 0) ? [] : _Array_concat(builtins, ps)).exhaustive());
var resolvePluginsDefault = (pluginsOpt) => resolvePlugins(pluginsOpt, DEFAULT_PLUGINS);
var parseHooksFrom = _curry7(3, (plugins, i, acc) => match6(_Array_get4(i, plugins)).with({ _tag: "None" }, () => acc).with((_v) => _v._tag === "Some", ({ value: { parse } }) => match6(parse).with({ _tag: "Some" }, ({ value: hook }) => parseHooksFrom(plugins, i + 1, _Array_append4(hook, acc))).with({ _tag: "None" }, () => parseHooksFrom(plugins, i + 1, acc)).exhaustive()).exhaustive());
var parseHooksOf = (plugins) => parseHooksFrom(plugins, 0, []);
var inferHooksFrom = _curry7(3, (plugins, i, acc) => match6(_Array_get4(i, plugins)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => match6(p.inferCall).with({ _tag: "Some" }, ({ value: hook }) => inferHooksFrom(plugins, i + 1, _Array_append4(hook, acc))).with({ _tag: "None" }, () => inferHooksFrom(plugins, i + 1, acc)).exhaustive()).exhaustive());
var inferCallHooksOf = (plugins) => inferHooksFrom(plugins, 0, []);
var runParseHooks = _curry7(4, (hooks, toks, pos, parseExpr) => match6(hooks).with((_v) => _v.length === 0, () => Ok5(None6)).with((_v) => _v.length >= 1, ([hook, ...rest]) => match6(hook(toks, pos, parseExpr)).with({ _tag: "Err" }, ({ error: e }) => Err4(e)).with({ _tag: "Ok" }, ({ value: v }) => match6(v).with({ _tag: "None" }, () => runParseHooks(rest, toks, pos, parseExpr)).with({ _tag: "Some" }, ({ value: claim }) => Ok5(Some6(claim))).exhaustive()).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var runInferCallHooks = _curry7(6, (hooks, fn, args, origin, st, api) => match6(hooks).with((_v) => _v.length === 0, () => Ok5(None6)).with((_v) => _v.length >= 1, ([hook, ...rest]) => match6(hook(fn, args, origin, st, api)).with({ _tag: "Err" }, ({ error: e }) => Err4(e)).with({ _tag: "Ok" }, ({ value: v }) => match6(v).with({ _tag: "None" }, () => runInferCallHooks(rest, fn, args, origin, st, api)).with({ _tag: "Some" }, ({ value: claim }) => Ok5(Some6(claim))).exhaustive()).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));

var tokName = (t) => match7(t).with({ _tag: "TLet" }, () => "let").with({ _tag: "TType" }, () => "type").with({ _tag: "TExtern" }, () => "extern").with({ _tag: "TSwitch" }, () => "switch").with({ _tag: "TLoop" }, () => "loop").with({ _tag: "TRecur" }, () => "recur").with({ _tag: "TDo" }, () => "do").with({ _tag: "TImport" }, () => "import").with({ _tag: "TExport" }, () => "export").with({ _tag: "TEq" }, () => "eq").with({ _tag: "TArrow" }, () => "arrow").with({ _tag: "TTarrow" }, () => "tarrow").with({ _tag: "TPipe" }, () => "pipe").with({ _tag: "TCompose" }, () => "compose").with({ _tag: "TConcat" }, () => "concat").with({ _tag: "TBar" }, () => "bar").with({ _tag: "TLparen" }, () => "lparen").with({ _tag: "TRparen" }, () => "rparen").with({ _tag: "TLbrace" }, () => "lbrace").with({ _tag: "TRbrace" }, () => "rbrace").with({ _tag: "TLbracket" }, () => "lbracket").with({ _tag: "TRbracket" }, () => "rbracket").with({ _tag: "TSpread" }, () => "spread").with({ _tag: "TPlus" }, () => "plus").with({ _tag: "TMinus" }, () => "minus").with({ _tag: "TStar" }, () => "star").with({ _tag: "TSlash" }, () => "slash").with({ _tag: "TPercent" }, () => "percent").with({ _tag: "TAt" }, () => "at").with({ _tag: "THash" }, () => "hash").with({ _tag: "TTilde" }, () => "tilde").with({ _tag: "TDot" }, () => "dot").with({ _tag: "TColon" }, () => "colon").with({ _tag: "TQuestion" }, () => "question").with({ _tag: "TEqeq" }, () => "eqeq").with({ _tag: "TNeq" }, () => "neq").with({ _tag: "TLte" }, () => "lte").with({ _tag: "TGte" }, () => "gte").with({ _tag: "TLt" }, () => "lt").with({ _tag: "TGt" }, () => "gt").with({ _tag: "TAndand" }, () => "andand").with({ _tag: "TOror" }, () => "oror").with({ _tag: "TBang" }, () => "bang").with({ _tag: "TBacktick" }, () => "backtick").with({ _tag: "TComma" }, () => "comma").with({ _tag: "TSemi" }, () => "semi").with({ _tag: "TNum" }, () => "num").with({ _tag: "TBool" }, () => "bool").with({ _tag: "TStr" }, () => "str").with({ _tag: "TTmplStart" }, () => "tmplstart").with({ _tag: "TTmplMid" }, () => "tmplmid").with({ _tag: "TTmplEnd" }, () => "tmplend").with({ _tag: "TId" }, () => "id").with({ _tag: "TEof" }, () => "eof").exhaustive();
var eofTok = { tok: TEof, start: 0, end: 0, doc: None7 };
var tokAt = _curry8(2, (toks, i) => _Option_unwrapOr3(eofTok, _Array_get5(i, toks)));
var spanOf = (lt4) => ({ start: lt4.start, end: lt4.end });
var spanning = _curry8(2, (a, b) => ({ start: a.start, end: b.end }));
var toEnd = _curry8(3, (start, toks, pos) => ({ start: start.start, end: tokAt(toks, pos - 1).end }));
var errAt = _curry8(2, (message, lt4) => Err5({ message, start: lt4.start, end: lt4.end }));
var expectTok = _curry8(3, (t, toks, pos) => {
  const lt4 = tokAt(toks, pos);
  return eq7(lt4.tok, t) ? Ok6(pos + 1) : errAt(`expected ${tokName(t)}, got ${tokName(lt4.tok)}`, lt4);
});
var expectId = _curry8(2, (toks, pos) => {
  const lt4 = tokAt(toks, pos);
  return match7(lt4.tok).with({ _tag: "TId" }, ({ value: name }) => Ok6(_tuple4({ name, span: spanOf(lt4) }, pos + 1))).otherwise((t) => errAt(`expected id, got ${tokName(t)}`, lt4));
});
var keywordText = (t) => match7(t).with({ _tag: "TLet" }, () => Some7("let")).with({ _tag: "TType" }, () => Some7("type")).with({ _tag: "TExtern" }, () => Some7("extern")).with({ _tag: "TSwitch" }, () => Some7("switch")).with({ _tag: "TLoop" }, () => Some7("loop")).with({ _tag: "TRecur" }, () => Some7("recur")).with({ _tag: "TDo" }, () => Some7("do")).with({ _tag: "TImport" }, () => Some7("import")).with({ _tag: "TExport" }, () => Some7("export")).otherwise(() => None7);
var expectLabel = _curry8(2, (toks, pos) => {
  const lt4 = tokAt(toks, pos);
  return match7(keywordText(lt4.tok)).with({ _tag: "Some" }, ({ value: name }) => Ok6(_tuple4({ name, span: spanOf(lt4) }, pos + 1))).with({ _tag: "None" }, () => expectId(toks, pos)).exhaustive();
});
var expectStr = _curry8(2, (toks, pos) => {
  const lt4 = tokAt(toks, pos);
  return match7(lt4.tok).with({ _tag: "TStr" }, ({ value }) => Ok6(_tuple4(value, pos + 1))).otherwise((t) => errAt(`expected str, got ${tokName(t)}`, lt4));
});
var expectIn = _curry8(2, (toks, pos) => _Result_flatMap4(([kw, p]) => eq7(kw.name, "in") ? Ok6(p) : errAt(`expected 'in' after let binding, got '${kw.name}'`, tokAt(toks, p)), expectId(toks, pos)));
var isUpper = (s) => _Option_exists3((n) => and5(n >= 65, n <= 90), _Str_codeAt3(0, s));
var sepBy = _curry8(4, (parseItem, toks, pos, acc) => _Result_flatMap4(([item, p]) => {
  const items = _Array_append5(item, acc);
  return eq7(tokAt(toks, p).tok, TComma) ? sepBy(parseItem, toks, p + 1, items) : Ok6(_tuple4(items, p));
}, parseItem(toks, pos)));
var sepByH = _curry8(5, (parseItem, toks, pos, acc, hooks) => _Result_flatMap4(([item, p]) => {
  const items = _Array_append5(item, acc);
  return eq7(tokAt(toks, p).tok, TComma) ? sepByH(parseItem, toks, p + 1, items, hooks) : Ok6(_tuple4(items, p));
}, parseItem(toks, pos, hooks)));
var listUntil = _curry8(4, (close, parseItem, toks, pos) => eq7(tokAt(toks, pos).tok, close) ? Ok6(_tuple4([], pos)) : sepBy(parseItem, toks, pos, []));
var listUntilH = _curry8(5, (close, parseItem, toks, pos, hooks) => eq7(tokAt(toks, pos).tok, close) ? Ok6(_tuple4([], pos)) : sepByH(parseItem, toks, pos, [], hooks));
var scanLambdaDepth = _curry8(3, (toks, k, depth) => match7(tokAt(toks, k).tok).with({ _tag: "TLparen" }, () => scanLambdaDepth(toks, k + 1, depth + 1)).with({ _tag: "TRparen" }, () => eq7(depth, 1) ? eq7(tokAt(toks, k + 1).tok, TArrow) : scanLambdaDepth(toks, k + 1, depth - 1)).with({ _tag: "TEof" }, () => false).otherwise(() => scanLambdaDepth(toks, k + 1, depth)));
var looksLikeLambda = _curry8(2, (toks, pos) => match7(tokAt(toks, pos).tok).with({ _tag: "TId" }, () => eq7(tokAt(toks, pos + 1).tok, TArrow)).with({ _tag: "TLparen" }, () => scanLambdaDepth(toks, pos, 0)).otherwise(() => false));
var exprSpan = (e) => match7(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var tySpan = (t) => match7(t).with({ _tag: "TyName" }, ({ span: sp }) => sp).with({ _tag: "TyArrow" }, ({ span: sp }) => sp).with({ _tag: "TyApp" }, ({ span: sp }) => sp).with({ _tag: "TyTuple" }, ({ span: sp }) => sp).with({ _tag: "TyList" }, ({ span: sp }) => sp).with({ _tag: "TyQual" }, ({ span: sp }) => sp).with({ _tag: "TyLit" }, ({ span: sp }) => sp).with({ _tag: "TyUnion" }, ({ span: sp }) => sp).exhaustive();
var parseParam = _curry8(2, (toks, pos) => match7(tokAt(toks, pos).tok).with({ _tag: "TLbrace" }, () => _Result_flatMap4(([fields, p]) => _Result_flatMap4((p2) => Ok6(_tuple4(LPSpanned(LPRecord(map3((f) => f.name, fields)), map3((f) => f.span, fields)), p2)), expectTok(TRbrace, toks, p)), listUntil(TRbrace, expectId, toks, pos + 1))).with({ _tag: "TLparen" }, () => _Result_flatMap4(([names, p]) => _Result_flatMap4((p2) => Ok6(match7(names).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([single]) => _tuple4(LPSpanned(LPName(single.name, None7), [single.span]), p2)).otherwise((many) => _tuple4(LPSpanned(LPTuple(map3((n) => n.name, many)), map3((n) => n.span, many)), p2))), expectTok(TRparen, toks, p)), sepBy(expectId, toks, pos + 1, []))).otherwise(() => _Result_flatMap4(([nm, p]) => eq7(tokAt(toks, p).tok, TColon) ? _Result_map4(([annot, p2]) => _tuple4(LPSpanned(LPName(nm.name, Some7(annot)), [nm.span]), p2), parseTypeExpr(toks, p + 1)) : Ok6(_tuple4(LPSpanned(LPName(nm.name, None7), [nm.span]), p)), expectId(toks, pos))));
var parseLabeledParam = _curry8(3, (toks, pos, hooks) => _Result_flatMap4((p0) => _Result_flatMap4(([nm, p1]) => ((optional) => ((p2) => _Result_flatMap4(([annot, p3]) => eq7(tokAt(toks, p3).tok, TEq) ? _Result_map4(([d, k]) => _tuple4(LPSpanned(LPLabeled(nm.name, annot, optional, Some7(d)), [nm.span]), k), parseExpr(toks, p3 + 1, hooks)) : Ok6(_tuple4(LPSpanned(LPLabeled(nm.name, annot, optional, None7), [nm.span]), p3)), eq7(tokAt(toks, p2).tok, TColon) ? _Result_map4(([t, k]) => _tuple4(Some7(t), k), parseTypeExpr(toks, p2 + 1)) : Ok6(_tuple4(None7, p2))))(optional ? p1 + 1 : p1))(eq7(tokAt(toks, p1).tok, TQuestion)), expectLabel(toks, p0)), expectTok(TTilde, toks, pos)));
var parseLamParam = _curry8(3, (toks, pos, hooks) => eq7(tokAt(toks, pos).tok, TTilde) ? parseLabeledParam(toks, pos, hooks) : parseParam(toks, pos));
var isLabeledParam = (p) => match7(p).with({ _tag: "LPLabeled" }, () => true).with({ _tag: "LPSpanned" }, ({ param: inner }) => isLabeledParam(inner)).otherwise(() => false);
var labeledTrailing = _curry8(2, (params, seen) => match7(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => true).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => isLabeledParam(p) ? labeledTrailing(rest, true) : and5(not3(seen), labeledTrailing(rest, false))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var parseLambda = _curry8(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return match7(tokAt(toks, pos).tok).with({ _tag: "TId" }, ({ value: name }) => _Result_flatMap4((p) => _Result_flatMap4(([body, p2]) => Ok6(_tuple4(ELambda([LPSpanned(LPName(name, None7), [spanOf(tokAt(toks, pos))])], body, toEnd(start, toks, p2)), p2)), parseLambdaBody(toks, p, hooks)), expectTok(TArrow, toks, pos + 1))).otherwise(() => _Result_flatMap4((p) => _Result_flatMap4(([params, p2]) => _Result_flatMap4((p3) => labeledTrailing(params, false) ? _Result_flatMap4((p4) => _Result_flatMap4(([body, p5]) => Ok6(_tuple4(ELambda(params, body, toEnd(start, toks, p5)), p5)), parseLambdaBody(toks, p4, hooks)), expectTok(TArrow, toks, p3)) : errAt("labeled parameters must be a trailing group", tokAt(toks, p)), expectTok(TRparen, toks, p2)), listUntilH(TRparen, parseLamParam, toks, p, hooks)), expectTok(TLparen, toks, pos)));
});
var parseLambdaBody = _curry8(3, (toks, pos, hooks) => and5(eq7(tokAt(toks, pos).tok, TLbrace), arrowBodyIsDoBlock(toks, pos, 0)) ? parseDoBlock(toks, pos, hooks) : parseExpr(toks, pos, hooks));
var arrowBodyIsDoBlock = _curry8(3, (toks, pos, depth) => match7(tokAt(toks, pos).tok).with({ _tag: "TLbrace" }, () => arrowBodyIsDoBlock(toks, pos + 1, depth + 1)).with({ _tag: "TRbrace" }, () => eq7(depth, 1) ? false : arrowBodyIsDoBlock(toks, pos + 1, depth - 1)).with({ _tag: "TSemi" }, () => or4(eq7(depth, 1), arrowBodyIsDoBlock(toks, pos + 1, depth))).with({ _tag: "TEof" }, () => false).otherwise(() => arrowBodyIsDoBlock(toks, pos + 1, depth)));
var parseLetIn = _curry8(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => or4(eq7(tokAt(toks, p).tok, TQuestion), eq7(tokAt(toks, p).tok, TBang)) ? ((monad) => ((paramSpan) => _Result_flatMap4(([param, p1]) => _Result_flatMap4((p2) => _Result_flatMap4(([value, p3]) => _Result_flatMap4((p4) => _Result_flatMap4(([body, p5]) => Ok6(_tuple4(ELetBind(param, paramSpan, monad, value, body, toEnd(start, toks, p5)), p5)), parseExpr(toks, p4, hooks)), expectIn(toks, p3)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, p1)), parseParam(toks, p + 1)))(spanOf(tokAt(toks, p + 1))))(eq7(tokAt(toks, p).tok, TQuestion) ? "Result" : "Task") : eq7(tokAt(toks, p).tok, TLparen) ? ((paramStart) => _Result_flatMap4(([param, p1]) => _Result_flatMap4((p2) => _Result_flatMap4(([value, p3]) => _Result_flatMap4((p4) => _Result_flatMap4(([body, p5]) => ((fn) => Ok6(_tuple4(ECall(fn, [value], None7, toEnd(start, toks, p5)), p5)))(ELambda([param], body, toEnd(paramStart, toks, p5))), parseExpr(toks, p4, hooks)), expectIn(toks, p3)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, p1)), parseParam(toks, p)))(spanOf(tokAt(toks, p))) : _Result_flatMap4(([nm, p1]) => _Result_flatMap4(([annot, pA]) => _Result_flatMap4((p2) => _Result_flatMap4(([value, p3]) => _Result_flatMap4((p4) => _Result_flatMap4(([body, p5]) => Ok6(_tuple4(ELetIn(nm.name, nm.span, annot, value, body, toEnd(start, toks, p5)), p5)), parseExpr(toks, p4, hooks)), expectIn(toks, p3)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, pA)), eq7(tokAt(toks, p1).tok, TColon) ? _Result_map4(([ty, k]) => _tuple4(Some7(ty), k), parseTypeExpr(toks, p1 + 1)) : Ok6(_tuple4(None7, p1))), expectId(toks, p)), expectTok(TLet, toks, pos));
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
var mkBinCall = _curry8(4, (fnName, opSpan, left, right) => ECall(ERef(fnName, opSpan), [left, right], None7, spanning(exprSpan(left), exprSpan(right))));
var opFnName = (t) => match7(t).with({ _tag: "TPlus" }, () => "add").with({ _tag: "TMinus" }, () => "sub").with({ _tag: "TStar" }, () => "mul").with({ _tag: "TSlash" }, () => "div").with({ _tag: "TPercent" }, () => "mod").with({ _tag: "TAndand" }, () => "and").with({ _tag: "TOror" }, () => "or").with({ _tag: "TConcat" }, () => "concat").with({ _tag: "TEqeq" }, () => "eq").with({ _tag: "TLt" }, () => "lt").with({ _tag: "TLte" }, () => "lte").with({ _tag: "TGt" }, () => "gt").with({ _tag: "TGte" }, () => "gte").otherwise(() => "eq");
var isSectionOp = (t) => match7(t).with({ _tag: "TPlus" }, () => true).with({ _tag: "TMinus" }, () => true).with({ _tag: "TStar" }, () => true).with({ _tag: "TSlash" }, () => true).with({ _tag: "TPercent" }, () => true).with({ _tag: "TAndand" }, () => true).with({ _tag: "TOror" }, () => true).with({ _tag: "TConcat" }, () => true).with({ _tag: "TEqeq" }, () => true).with({ _tag: "TNeq" }, () => true).with({ _tag: "TLt" }, () => true).with({ _tag: "TLte" }, () => true).with({ _tag: "TGt" }, () => true).with({ _tag: "TGte" }, () => true).otherwise(() => false);
var sectionBody = _curry8(4, (opTok, x, y, opSpan) => {
  const full = spanning(exprSpan(x), exprSpan(y));
  return eq7(opTok, TNeq) ? ECall(ERef("not", opSpan), [mkBinCall("eq", opSpan, x, y)], None7, full) : mkBinCall(opFnName(opTok), opSpan, x, y);
});
var sectionLeft = _curry8(2, (provided, opLt) => {
  const opSpan = spanOf(opLt);
  const paramRef = ERef("$s", opSpan);
  return ELambda([LPName("$s", None7)], sectionBody(opLt.tok, provided, paramRef, opSpan), spanning(exprSpan(provided), opSpan));
});
var parseRightSection = _curry8(4, (toks, lparenSpan, pos, hooks) => {
  const lt4 = tokAt(toks, pos);
  return _Result_flatMap4(([y, p1]) => _Result_flatMap4((p2) => ((paramRef) => Ok6(_tuple4(ELambda([LPName("$s", None7)], sectionBody(lt4.tok, paramRef, y, spanOf(lt4)), toEnd(lparenSpan, toks, p2)), p2)))(ERef("$s", spanOf(lt4))), expectTok(TRparen, toks, p1)), parseExpr(toks, pos + 1, hooks));
});
var binCallOrLeftSection = _curry8(7, (toks, left, lt4, pos, bp, fnName, hooks) => eq7(tokAt(toks, pos + 1).tok, TRparen) ? Ok6({ left: sectionLeft(left, lt4), p: pos + 1, matched: true }) : _Result_flatMap4(([right, p]) => Ok6({ left: mkBinCall(fnName, spanOf(lt4), left, right), p, matched: true }), parseExprBp(toks, bp + 1, pos + 1, hooks)));
var isCmpTok = (t) => match7(t).with({ _tag: "TEqeq" }, () => true).with({ _tag: "TNeq" }, () => true).with({ _tag: "TLt" }, () => true).with({ _tag: "TLte" }, () => true).with({ _tag: "TGt" }, () => true).with({ _tag: "TGte" }, () => true).otherwise(() => false);
var cmpFnName = (t) => match7(t).with({ _tag: "TLt" }, () => "lt").with({ _tag: "TLte" }, () => "lte").with({ _tag: "TGt" }, () => "gt").with({ _tag: "TGte" }, () => "gte").otherwise(() => "eq");
var parseInfix = _curry8(5, (toks, minBp, left, pos, hooks) => {
  const lt4 = tokAt(toks, pos);
  return and5(eq7(lt4.tok, TPipe), PIPE_BP >= minBp) ? _Result_flatMap4(([right, p]) => Ok6({ left: EPipe(left, right, false, spanning(exprSpan(left), exprSpan(right))), p, matched: true }), parseAtomOrCall(toks, pos + 1, hooks)) : and5(eq7(lt4.tok, TTarrow), FAST_PIPE_BP >= minBp) ? _Result_flatMap4(([right, p]) => match7(right).with({ _tag: "ECall" }, ({ span: rightSpan }) => Ok6({ left: EPipe(left, right, true, spanning(exprSpan(left), rightSpan)), p, matched: true })).otherwise(() => errAt("fast pipe needs a call on the right, like `a -> f(b)`", lt4)), parseAtomOrCall(toks, pos + 1, hooks)) : and5(eq7(lt4.tok, TCompose), COMPOSE_BP >= minBp) ? _Result_flatMap4(([right, p]) => ((opSpan) => ((xRef) => ((innerCall) => ((outerCall) => ((fn) => Ok6({ left: fn, p, matched: true }))(ELambda([LPName("$x", None7)], outerCall, spanning(exprSpan(left), exprSpan(right)))))(ECall(right, [innerCall], None7, spanning(exprSpan(left), exprSpan(right)))))(ECall(left, [xRef], None7, exprSpan(left))))(ERef("$x", opSpan)))(spanOf(lt4)), parseExprBp(toks, COMPOSE_BP + 1, pos + 1, hooks)) : and5(isCmpTok(lt4.tok), CMP_BP >= minBp) ? eq7(tokAt(toks, pos + 1).tok, TRparen) ? Ok6({ left: sectionLeft(left, lt4), p: pos + 1, matched: true }) : _Result_flatMap4(([right, p]) => ((opSpan) => ((inner) => ((result) => Ok6({ left: result, p, matched: true }))(eq7(lt4.tok, TNeq) ? ECall(ERef("not", opSpan), [inner], None7, spanning(exprSpan(left), exprSpan(right))) : inner))(mkBinCall(cmpFnName(lt4.tok), opSpan, left, right)))(spanOf(lt4)), parseExprBp(toks, CMP_BP + 1, pos + 1, hooks)) : and5(or4(eq7(lt4.tok, TAndand), eq7(lt4.tok, TOror)), (eq7(lt4.tok, TAndand) ? AND_BP : OR_BP) >= minBp) ? ((bp) => ((fnName) => binCallOrLeftSection(toks, left, lt4, pos, bp, fnName, hooks))(eq7(lt4.tok, TAndand) ? "and" : "or"))(eq7(lt4.tok, TAndand) ? AND_BP : OR_BP) : and5(eq7(lt4.tok, TConcat), CONCAT_BP >= minBp) ? binCallOrLeftSection(toks, left, lt4, pos, CONCAT_BP, "concat", hooks) : and5(eq7(lt4.tok, TBacktick), BACKTICK_BP >= minBp) ? _Result_flatMap4(([fnExpr, p1]) => _Result_flatMap4((p2) => _Result_flatMap4(([right, p3]) => Ok6({ left: ECall(fnExpr, [left, right], None7, spanning(exprSpan(left), exprSpan(right))), p: p3, matched: true }), parseExprBp(toks, BACKTICK_BP + 1, p2, hooks)), expectTok(TBacktick, toks, p1)), parseAtomOrCall(toks, pos + 1, hooks)) : and5(or4(eq7(lt4.tok, TPlus), eq7(lt4.tok, TMinus)), ADD_BP >= minBp) ? ((fnName) => binCallOrLeftSection(toks, left, lt4, pos, ADD_BP, fnName, hooks))(eq7(lt4.tok, TPlus) ? "add" : "sub") : and5(or4(eq7(lt4.tok, TStar), or4(eq7(lt4.tok, TSlash), eq7(lt4.tok, TPercent))), MUL_BP >= minBp) ? ((fnName) => binCallOrLeftSection(toks, left, lt4, pos, MUL_BP, fnName, hooks))(eq7(lt4.tok, TStar) ? "mul" : eq7(lt4.tok, TSlash) ? "div" : "mod") : Ok6({ left, p: pos, matched: false });
});
var infixLoop = _curry8(5, (toks, minBp, left, pos, hooks) => _Result_flatMap4((res) => res.matched ? infixLoop(toks, minBp, res.left, res.p, hooks) : Ok6(_tuple4(res.left, res.p)), parseInfix(toks, minBp, left, pos, hooks)));
var ternaryTail = _curry8(4, (toks, cond, pos, hooks) => eq7(tokAt(toks, pos).tok, TQuestion) ? _Result_flatMap4(([thenE, p1]) => _Result_flatMap4((p2) => _Result_flatMap4(([elseE, p3]) => Ok6(_tuple4(ETernary(cond, thenE, elseE, spanning(exprSpan(cond), exprSpan(elseE))), p3)), parseExpr(toks, p2, hooks)), expectTok(TColon, toks, p1)), parseExpr(toks, pos + 1, hooks)) : Ok6(_tuple4(cond, pos)));
var parseExprBp = _curry8(4, (toks, minBp, pos, hooks) => match7(tokAt(toks, pos).tok).with({ _tag: "TLet" }, () => parseLetIn(toks, pos, hooks)).otherwise(() => and5(eq7(minBp, 0), looksLikeLambda(toks, pos)) ? parseLambda(toks, pos, hooks) : _Result_flatMap4(([left, p]) => _Result_flatMap4(([left2, p2]) => eq7(minBp, 0) ? ternaryTail(toks, left2, p2, hooks) : Ok6(_tuple4(left2, p2)), infixLoop(toks, minBp, left, p, hooks)), parseAtomOrCall(toks, pos, hooks))));
var parseExpr = _curry8(3, (toks, pos, hooks) => parseExprBp(toks, 0, pos, hooks));
var CPPos = (value) => ({ _tag: "CPPos", value });
var CPLab = _curry8(3, (name, value, labelSpan) => ({ _tag: "CPLab", name, value, labelSpan }));
var parseCallPart = _curry8(3, (toks, pos, hooks) => eq7(tokAt(toks, pos).tok, TTilde) ? _Result_flatMap4(([nm, p]) => eq7(tokAt(toks, p).tok, TEq) ? _Result_map4(([v, k]) => _tuple4(CPLab(nm.name, v, nm.span), k), parseExpr(toks, p + 1, hooks)) : Ok6(_tuple4(CPLab(nm.name, ERef(nm.name, nm.span), nm.span), p)), expectLabel(toks, pos + 1)) : _Result_map4(([v, k]) => _tuple4(CPPos(v), k), parseExpr(toks, pos, hooks)));
var callPartSpan = (p) => match7(p).with({ _tag: "CPPos" }, ({ value }) => exprSpan(value)).with({ _tag: "CPLab" }, ({ value, labelSpan }) => spanning(labelSpan, exprSpan(value))).exhaustive();
var splitCallParts = _curry8(3, (parts, positional, labeled) => match7(parts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok6(_tuple4(positional, labeled))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => match7(p).with({ _tag: "CPLab" }, () => splitCallParts(rest, positional, _Array_append5(p, labeled))).with({ _tag: "CPPos" }, ({ value }) => match7(labeled).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => splitCallParts(rest, _Array_append5(value, positional), labeled)).otherwise(() => errAt("labeled arguments must be a trailing group", callPartSpan(p)))).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var labeledField = (p) => match7(p).with({ _tag: "CPLab" }, ({ name, value }) => ({ name, value })).with({ _tag: "CPPos" }, ({ value }) => ({ name: "", value })).exhaustive();
var unionSpans = _curry8(2, (parts, acc) => match7(parts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => unionSpans(rest, spanning(acc, callPartSpan(p)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var callArgsOf = (parts) => _Result_map4(([positional, labeled]) => match7(labeled).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple4(positional, None7)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([first, ...rest]) => _tuple4(_Array_append5(ERecord(map3(labeledField, labeled), None7, unionSpans(rest, callPartSpan(first))), positional), Some7("labeled"))).otherwise(() => {
  throw new Error("non-exhaustive match");
}), splitCallParts(parts, [], []));
var postfixLoop = _curry8(4, (toks, e, pos, hooks) => match7(tokAt(toks, pos).tok).with({ _tag: "TLparen" }, () => _Result_flatMap4(([parts, p]) => _Result_flatMap4((p2) => _Result_flatMap4(([args, origin]) => postfixLoop(toks, ECall(e, args, origin, toEnd(exprSpan(e), toks, p2)), p2, hooks), callArgsOf(parts)), expectTok(TRparen, toks, p)), listUntilH(TRparen, parseCallPart, toks, pos + 1, hooks))).with({ _tag: "TDot" }, () => _Result_flatMap4(([id, p]) => postfixLoop(toks, EField(e, id.name, false, spanning(exprSpan(e), id.span)), p, hooks), expectLabel(toks, pos + 1))).otherwise(() => Ok6(_tuple4(e, pos))));
var parseAtomOrCall = _curry8(3, (toks, pos, hooks) => {
  const lt4 = tokAt(toks, pos);
  return or4(eq7(lt4.tok, TMinus), eq7(lt4.tok, TBang)) ? _Result_flatMap4(([operand, p]) => ((fnName) => Ok6(_tuple4(ECall(ERef(fnName, spanOf(lt4)), [operand], None7, spanning(spanOf(lt4), exprSpan(operand))), p)))(eq7(lt4.tok, TMinus) ? "negate" : "not"), parseAtomOrCall(toks, pos + 1, hooks)) : _Result_flatMap4(([e, p]) => postfixLoop(toks, e, p, hooks), parseAtom(toks, pos, hooks));
});
var parseAtom = _curry8(3, (toks, pos, hooks) => {
  const lt4 = tokAt(toks, pos);
  const sp = spanOf(lt4);
  return match7(lt4.tok).with({ _tag: "TSwitch" }, () => parseMatch(toks, pos, hooks)).with({ _tag: "TDo" }, () => parseDo(toks, pos, hooks)).with({ _tag: "TLoop" }, () => parseLoop(toks, pos, hooks)).with({ _tag: "TRecur" }, () => parseRecur(toks, pos, hooks)).with({ _tag: "TLbrace" }, () => parseRecord(toks, pos, hooks)).with({ _tag: "TLbracket" }, () => parseArr(toks, pos, hooks)).with({ _tag: "TAt" }, () => parseList(toks, pos, hooks)).with({ _tag: "THash" }, () => parseHash(toks, pos, hooks)).with({ _tag: "TTmplStart" }, () => parseInterp(toks, pos, hooks)).otherwise(() => _Result_flatMap4((claimed) => match7(claimed).with((_v) => {
    const _g = _v;
    return _g._tag === "Some";
  }, ({ value: [e, p] }) => Ok6(_tuple4(e, p))).with({ _tag: "None" }, () => match7(lt4.tok).with({ _tag: "TNum" }, ({ value, raw }) => Ok6(_tuple4(ENum(value, raw, sp), pos + 1))).with({ _tag: "TBool" }, ({ value }) => Ok6(_tuple4(EBool(value, sp), pos + 1))).with({ _tag: "TStr" }, ({ value }) => Ok6(_tuple4(EStr(value, sp), pos + 1))).with({ _tag: "TId" }, ({ value: name }) => Ok6(_tuple4(ERef(name, sp), pos + 1))).with({ _tag: "TLparen" }, () => ((nxt) => eq7(nxt.tok, TRparen) ? Ok6(_tuple4(EUnit(toEnd(sp, toks, pos + 2)), pos + 2)) : and5(isSectionOp(nxt.tok), not3(eq7(nxt.tok, TMinus))) ? parseRightSection(toks, sp, pos + 1, hooks) : _Result_flatMap4(([first, p]) => eq7(tokAt(toks, p).tok, TComma) ? _Result_flatMap4(([elements, p2]) => _Result_flatMap4((p3) => Ok6(_tuple4(ETuple(elements, toEnd(sp, toks, p3)), p3)), expectTok(TRparen, toks, p2)), sepByH(parseExpr, toks, p + 1, [first], hooks)) : _Result_map4((p2) => _tuple4(first, p2), expectTok(TRparen, toks, p)), parseExpr(toks, pos + 1, hooks)))(tokAt(toks, pos + 1))).otherwise((t) => errAt(`unexpected token ${tokName(t)}`, lt4))).exhaustive(), runParseHooks(hooks, toks, pos, _curry8(2, (t, p) => parseExpr(t, p, hooks)))));
});
var parseInterpLoop = _curry8(5, (toks, pos, start, acc, hooks) => _Result_flatMap4(([holeExpr, p]) => ((acc2) => ((lt4) => match7(lt4.tok).with({ _tag: "TTmplMid" }, ({ value }) => parseInterpLoop(toks, p + 1, start, _Array_append5(IPLit(value), acc2), hooks)).with({ _tag: "TTmplEnd" }, ({ value }) => Ok6(_tuple4(EInterp(_Array_append5(IPLit(value), acc2), toEnd(start, toks, p + 1)), p + 1))).otherwise((t) => errAt(`expected \${...} to close, got ${tokName(t)}`, lt4)))(tokAt(toks, p)))(_Array_append5(IPExpr(holeExpr), acc)), parseExpr(toks, pos, hooks)));
var parseInterp = _curry8(3, (toks, pos, hooks) => {
  const lt4 = tokAt(toks, pos);
  return match7(lt4.tok).with({ _tag: "TTmplStart" }, ({ value }) => parseInterpLoop(toks, pos + 1, spanOf(lt4), [IPLit(value)], hooks)).otherwise((t) => errAt(`expected tmplstart, got ${tokName(t)}`, lt4));
});
var parseField = _curry8(3, (toks, pos, hooks) => {
  const lt4 = tokAt(toks, pos);
  return _Result_flatMap4(([nm, p]) => eq7(tokAt(toks, p).tok, TColon) ? _Result_flatMap4(([value, p2]) => Ok6(_tuple4({ name: nm.name, value }, p2)), parseExpr(toks, p + 1, hooks)) : not3(eq7(keywordText(lt4.tok), None7)) ? errAt(`'${nm.name}' is a keyword \u2014 write '${nm.name}: <expr>'`, lt4) : Ok6(_tuple4({ name: nm.name, value: ERef(nm.name, nm.span) }, p)), expectLabel(toks, pos));
});
var parseRecord = _curry8(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => eq7(tokAt(toks, p).tok, TSpread) ? _Result_flatMap4(([spreadExpr, p1]) => _Result_flatMap4((p2) => _Result_flatMap4(([fields, p3]) => _Result_flatMap4((p4) => Ok6(_tuple4(ERecord(fields, Some7(spreadExpr), toEnd(start, toks, p4)), p4)), expectTok(TRbrace, toks, p3)), listUntilH(TRbrace, parseField, toks, p2, hooks)), eq7(tokAt(toks, p1).tok, TRbrace) ? Ok6(p1) : expectTok(TComma, toks, p1)), parseExpr(toks, p + 1, hooks)) : _Result_flatMap4(([fields, p1]) => _Result_flatMap4((p2) => Ok6(_tuple4(ERecord(fields, None7, toEnd(start, toks, p2)), p2)), expectTok(TRbrace, toks, p1)), listUntilH(TRbrace, parseField, toks, p, hooks)), expectTok(TLbrace, toks, pos));
});
var parseSeqElem = _curry8(3, (toks, pos, hooks) => eq7(tokAt(toks, pos).tok, TSpread) ? _Result_flatMap4(([ex, p]) => Ok6(_tuple4(SESpread(ex), p)), parseExpr(toks, pos + 1, hooks)) : _Result_flatMap4(([ex, p]) => Ok6(_tuple4(SEExpr(ex), p)), parseExpr(toks, pos, hooks)));
var parseArr = _curry8(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4(([elements, p2]) => _Result_flatMap4((p3) => Ok6(_tuple4(EArr(elements, toEnd(start, toks, p3)), p3)), expectTok(TRbracket, toks, p2)), listUntilH(TRbracket, parseSeqElem, toks, p, hooks)), expectTok(TLbracket, toks, pos));
});
var parseList = _curry8(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4((p1) => _Result_flatMap4(([elements, p2]) => _Result_flatMap4((p3) => Ok6(_tuple4(EList(elements, toEnd(start, toks, p3)), p3)), expectTok(TRbrace, toks, p2)), listUntilH(TRbrace, parseSeqElem, toks, p1, hooks)), expectTok(TLbrace, toks, p)), expectTok(TAt, toks, pos));
});
var parseMapEntry = _curry8(3, (toks, pos, hooks) => _Result_flatMap4(([key, p]) => _Result_flatMap4((p2) => _Result_flatMap4(([value, p3]) => Ok6(_tuple4({ key, value }, p3)), parseExpr(toks, p2, hooks)), expectTok(TColon, toks, p)), parseExpr(toks, pos, hooks)));
var parseHash = _curry8(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4((p1) => eq7(tokAt(toks, p1).tok, TRbrace) ? _Result_flatMap4((p2) => Ok6(_tuple4(EMap([], toEnd(start, toks, p2)), p2)), expectTok(TRbrace, toks, p1)) : eq7(tokAt(toks, p1).tok, TSpread) ? _Result_flatMap4(([elements, p2]) => _Result_flatMap4((p3) => Ok6(_tuple4(ESet(elements, toEnd(start, toks, p3)), p3)), expectTok(TRbrace, toks, p2)), listUntilH(TRbrace, parseSeqElem, toks, p1, hooks)) : _Result_flatMap4(([first, p2]) => eq7(tokAt(toks, p2).tok, TColon) ? _Result_flatMap4((p3) => _Result_flatMap4(([value, p4]) => _Result_flatMap4(([rest, p5]) => _Result_flatMap4((p6) => Ok6(_tuple4(EMap(_Array_prepend2({ key: first, value }, rest), toEnd(start, toks, p6)), p6)), expectTok(TRbrace, toks, p5)), eq7(tokAt(toks, p4).tok, TComma) ? listUntilH(TRbrace, parseMapEntry, toks, p4 + 1, hooks) : Ok6(_tuple4([], p4))), parseExpr(toks, p3, hooks)), expectTok(TColon, toks, p2)) : _Result_flatMap4(([rest, p3]) => _Result_flatMap4((p4) => Ok6(_tuple4(ESet(_Array_prepend2(SEExpr(first), rest), toEnd(start, toks, p4)), p4)), expectTok(TRbrace, toks, p3)), eq7(tokAt(toks, p2).tok, TComma) ? listUntilH(TRbrace, parseSeqElem, toks, p2 + 1, hooks) : Ok6(_tuple4([], p2))), parseExpr(toks, p1, hooks)), expectTok(TLbrace, toks, p)), expectTok(THash, toks, pos));
});
var parseGuard = _curry8(3, (toks, pos, hooks) => match7(tokAt(toks, pos).tok).with({ _tag: "TId", value: "when" }, () => _Result_map4(([g, p]) => _tuple4(Some7(g), p), parseExpr(toks, pos + 1, hooks))).otherwise(() => Ok6(_tuple4(None7, pos))));
var patSpan = (p) => match7(p).with({ _tag: "PWild" }, ({ span: sp }) => sp).with({ _tag: "PUnit" }, ({ span: sp }) => sp).with({ _tag: "PBind" }, ({ span: sp }) => sp).with({ _tag: "PAs" }, ({ span: sp }) => sp).with({ _tag: "PLit" }, ({ span: sp }) => sp).with({ _tag: "PBool" }, ({ span: sp }) => sp).with({ _tag: "PStr" }, ({ span: sp }) => sp).with({ _tag: "PTuple" }, ({ span: sp }) => sp).with({ _tag: "PRecord" }, ({ span: sp }) => sp).with({ _tag: "PCtor" }, ({ span: sp }) => sp).with({ _tag: "PArr" }, ({ span: sp }) => sp).with({ _tag: "PList" }, ({ span: sp }) => sp).with({ _tag: "POr" }, ({ span: sp }) => sp).exhaustive();
var altsLoop = _curry8(4, (toks, pos, acc, lastSpan) => eq7(tokAt(toks, pos).tok, TBar) ? _Result_flatMap4(([alt, p1]) => altsLoop(toks, p1, _Array_append5(alt, acc), patSpan(alt)), parsePattern(toks, pos + 1)) : Ok6(_tuple4(acc, pos, lastSpan)));
var armsLoop = _curry8(4, (toks, pos, acc, hooks) => eq7(tokAt(toks, pos).tok, TBar) ? _Result_flatMap4(([first, p1]) => _Result_flatMap4(([alts, p2, lastSpan]) => ((pattern) => _Result_flatMap4(([guard, p3]) => _Result_flatMap4((p4) => _Result_flatMap4(([body, p5]) => armsLoop(toks, p5, _Array_append5({ pattern, guard, body }, acc), hooks), parseExpr(toks, p4, hooks)), expectTok(TArrow, toks, p3)), parseGuard(toks, p2, hooks)))(eq7(length6(alts), 1) ? first : POr(alts, spanning(patSpan(first), lastSpan))), altsLoop(toks, p1, [first], patSpan(first))), parsePattern(toks, pos + 1)) : Ok6(_tuple4(acc, pos)));
var parseDo = _curry8(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => parseDoBlockFrom(toks, start, p, hooks), expectTok(TDo, toks, pos));
});
var parseDoBlock = _curry8(3, (toks, pos, hooks) => parseDoBlockFrom(toks, spanOf(tokAt(toks, pos)), pos, hooks));
var parseDoBlockFrom = _curry8(4, (toks, start, pos, hooks) => _Result_flatMap4((p1) => eq7(tokAt(toks, p1).tok, TRbrace) ? errAt("do block needs a final expression", tokAt(toks, p1)) : _Result_flatMap4(([exprs, p2]) => eq7(tokAt(toks, p2).tok, TSemi) ? errAt("do block cannot end with a semicolon", tokAt(toks, p2)) : _Result_flatMap4((p3) => Ok6(_tuple4(EDo(exprs, toEnd(start, toks, p3)), p3)), expectTok(TRbrace, toks, p2)), parseDoExprs(toks, p1, [], hooks)), expectTok(TLbrace, toks, pos)));
var parseDoExprs = _curry8(4, (toks, pos, acc, hooks) => _Result_flatMap4(([expr, p]) => ((next) => eq7(tokAt(toks, p).tok, TSemi) ? parseDoExprs(toks, p + 1, next, hooks) : Ok6(_tuple4(next, p)))(_Array_append5(expr, acc)), parseExpr(toks, pos, hooks)));
var parseLoop = _curry8(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4((p1) => _Result_flatMap4(([params, p2]) => _Result_flatMap4((p3) => _Result_flatMap4((p4) => _Result_flatMap4(([body, p5]) => _Result_map4((p6) => _tuple4(ELoop(params, body, toEnd(start, toks, p6)), p6), expectTok(TRbrace, toks, p5)), parseExpr(toks, p4, hooks)), expectTok(TLbrace, toks, p3)), expectTok(TRparen, toks, p2)), loopParamsLoop(toks, p1, [], hooks)), expectTok(TLparen, toks, p)), expectTok(TLoop, toks, pos));
});
var loopParamsLoop = _curry8(4, (toks, pos, acc, hooks) => _Result_flatMap4(([id, pid]) => _Result_flatMap4((p) => _Result_flatMap4(([init, p1]) => ((next) => match7(tokAt(toks, p1).tok).with({ _tag: "TComma" }, () => loopParamsLoop(toks, p1 + 1, next, hooks)).otherwise(() => Ok6(_tuple4(next, p1))))(_Array_append5({ name: id.name, nameSpan: id.span, init }, acc)), parseExpr(toks, p, hooks)), expectTok(TEq, toks, pid)), expectId(toks, pos)));
var parseRecur = _curry8(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4((p1) => match7(tokAt(toks, p1).tok).with({ _tag: "TRparen" }, () => Ok6(_tuple4(ERecur([], toEnd(start, toks, p1 + 1)), p1 + 1))).otherwise(() => _Result_flatMap4(([args, p2]) => _Result_map4((p3) => _tuple4(ERecur(args, toEnd(start, toks, p3)), p3), expectTok(TRparen, toks, p2)), sepByH(parseExpr, toks, p1, [], hooks))), expectTok(TLparen, toks, p)), expectTok(TRecur, toks, pos));
});
var parseMatch = _curry8(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4(([scrutinee, p1]) => _Result_flatMap4((p2) => _Result_flatMap4(([arms, p3]) => match7(length6(arms)).with(0, () => errAt("switch needs at least one | arm", tokAt(toks, p3))).otherwise(() => _Result_map4((p4) => _tuple4(EMatch(scrutinee, arms, toEnd(start, toks, p4)), p4), expectTok(TRbrace, toks, p3))), armsLoop(toks, p2, [], hooks)), expectTok(TLbrace, toks, p1)), parseExpr(toks, p, hooks)), expectTok(TSwitch, toks, pos));
});
var parseCtorArgs = _curry8(5, (toks, ctor, ns, nameSpan, pos) => eq7(tokAt(toks, pos).tok, TLparen) ? _Result_flatMap4(([args, p]) => _Result_flatMap4((p2) => Ok6(_tuple4(PCtor(ctor, args, ns, toEnd(nameSpan, toks, p2)), p2)), expectTok(TRparen, toks, p)), listUntil(TRparen, parsePattern, toks, pos + 1)) : Ok6(_tuple4(PCtor(ctor, [], ns, toEnd(nameSpan, toks, pos)), pos)));
var parsePatternAtom = _curry8(2, (toks, pos) => {
  const lt4 = tokAt(toks, pos);
  const sp = spanOf(lt4);
  return match7(lt4.tok).with({ _tag: "TNum" }, ({ value, raw }) => Ok6(_tuple4(PLit2(value, raw, sp), pos + 1))).with({ _tag: "TBool" }, ({ value }) => Ok6(_tuple4(PBool(value, sp), pos + 1))).with({ _tag: "TStr" }, ({ value }) => Ok6(_tuple4(PStr(value, sp), pos + 1))).with({ _tag: "TLparen" }, () => eq7(tokAt(toks, pos + 1).tok, TRparen) ? Ok6(_tuple4(PUnit(toEnd(sp, toks, pos + 2)), pos + 2)) : _Result_flatMap4(([elems, p]) => _Result_flatMap4((p2) => Ok6(match7(elems).with((_v) => {
    const _g = _v;
    return _g.length === 1;
  }, ([single]) => _tuple4(single, p2)).otherwise((many) => _tuple4(PTuple(many, toEnd(sp, toks, p2)), p2))), expectTok(TRparen, toks, p)), sepBy(parsePattern, toks, pos + 1, []))).with({ _tag: "TLbrace" }, () => _Result_flatMap4(([fields, p]) => _Result_flatMap4((p2) => Ok6(_tuple4(PRecord(fields, toEnd(sp, toks, p2)), p2)), expectTok(TRbrace, toks, p)), listUntil(TRbrace, parsePatField, toks, pos + 1))).with({ _tag: "TLbracket" }, () => parseArrPattern(toks, pos)).with({ _tag: "TAt" }, () => parseListPattern(toks, pos)).with({ _tag: "TId", value: "_" }, () => Ok6(_tuple4(PWild(sp), pos + 1))).with({ _tag: "TId" }, ({ value: name }) => eq7(tokAt(toks, pos + 1).tok, TDot) ? _Result_flatMap4(([c, p1]) => isUpper(c.name) ? parseCtorArgs(toks, c.name, Some7(name), sp, p1) : errAt(`expected constructor after '${name}.', got '${c.name}'`, tokAt(toks, p1)), expectId(toks, pos + 2)) : isUpper(name) ? parseCtorArgs(toks, name, None7, sp, pos + 1) : Ok6(_tuple4(PBind(name, sp), pos + 1))).otherwise((t) => errAt(`unexpected token in pattern: ${tokName(t)}`, lt4));
});
var parsePattern = _curry8(2, (toks, pos) => _Result_flatMap4(([pat, p]) => match7(tokAt(toks, p).tok).with({ _tag: "TId", value: "as" }, () => _Result_flatMap4(([nm, p2]) => Ok6(_tuple4(PAs(pat, nm.name, nm.span, spanning(patSpan(pat), nm.span)), p2)), expectId(toks, p + 1))).otherwise(() => Ok6(_tuple4(pat, p))), parsePatternAtom(toks, pos)));
var restOk = (rest) => match7(rest).with({ _tag: "None" }, () => true).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PBind";
}, () => true).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PWild";
}, () => true).with({ _tag: "Some" }, () => false).exhaustive();
var patElemsLoop = _curry8(3, (toks, pos, acc) => match7(tokAt(toks, pos).tok).with({ _tag: "TSpread" }, () => _Result_flatMap4(([rest, p]) => Ok6(_tuple4(acc, Some7(rest), p)), parsePattern(toks, pos + 1))).otherwise(() => _Result_flatMap4(([pat, p]) => ((elems) => eq7(tokAt(toks, p).tok, TComma) ? patElemsLoop(toks, p + 1, elems) : Ok6(_tuple4(elems, None7, p)))(_Array_append5(pat, acc)), parsePattern(toks, pos))));
var parseArrPattern = _curry8(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => eq7(tokAt(toks, p).tok, TRbracket) ? Ok6(_tuple4(PArr([], None7, toEnd(start, toks, p + 1)), p + 1)) : _Result_flatMap4(([elems, rest, p2]) => restOk(rest) ? _Result_map4((p3) => _tuple4(PArr(elems, rest, toEnd(start, toks, p3)), p3), expectTok(TRbracket, toks, p2)) : errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2)), patElemsLoop(toks, p, [])), expectTok(TLbracket, toks, pos));
});
var parseListPattern = _curry8(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4((p1) => eq7(tokAt(toks, p1).tok, TRbrace) ? Ok6(_tuple4(PList([], None7, toEnd(start, toks, p1 + 1)), p1 + 1)) : _Result_flatMap4(([elems, rest, p2]) => restOk(rest) ? _Result_map4((p3) => _tuple4(PList(elems, rest, toEnd(start, toks, p3)), p3), expectTok(TRbrace, toks, p2)) : errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2)), patElemsLoop(toks, p1, [])), expectTok(TLbrace, toks, p)), expectTok(TAt, toks, pos));
});
var parsePatField = _curry8(2, (toks, pos) => {
  const lt4 = tokAt(toks, pos);
  return _Result_flatMap4(([nm, p]) => eq7(tokAt(toks, p).tok, TColon) ? _Result_flatMap4(([pat, p2]) => Ok6(_tuple4({ label: nm.name, pat }, p2)), parsePattern(toks, p + 1)) : not3(eq7(keywordText(lt4.tok), None7)) ? errAt(`'${nm.name}' is a keyword \u2014 write '${nm.name}: <pattern>'`, lt4) : Ok6(_tuple4({ label: nm.name, pat: PBind(nm.name, nm.span) }, p)), expectLabel(toks, pos));
});
var parseTypeAtom = _curry8(2, (toks, pos) => {
  const lt4 = tokAt(toks, pos);
  const sp = spanOf(lt4);
  return match7(lt4.tok).with({ _tag: "TLparen" }, () => eq7(tokAt(toks, pos + 1).tok, TRparen) ? Ok6(_tuple4(TyName("unit", toEnd(sp, toks, pos + 2)), pos + 2)) : _Result_flatMap4(([inner, p]) => eq7(tokAt(toks, p).tok, TComma) ? _Result_flatMap4(([elems, p2]) => _Result_flatMap4((p3) => Ok6(_tuple4(TyTuple(elems, toEnd(sp, toks, p3)), p3)), expectTok(TRparen, toks, p2)), sepBy(parseTypeExpr, toks, p + 1, [inner])) : _Result_map4((p2) => _tuple4(inner, p2), expectTok(TRparen, toks, p)), parseTypeExpr(toks, pos + 1))).with({ _tag: "TLbracket" }, () => _Result_flatMap4(([elem, p]) => _Result_flatMap4((p2) => Ok6(_tuple4(TyList(elem, toEnd(sp, toks, p2)), p2)), expectTok(TRbracket, toks, p)), parseTypeExpr(toks, pos + 1))).with({ _tag: "TStr" }, ({ value }) => Ok6(_tuple4(TyLit(value, sp), pos + 1))).otherwise(() => _Result_flatMap4(([nm, p]) => and5(isUpper(nm.name), eq7(tokAt(toks, p).tok, TDot)) ? _Result_flatMap4(([q, p2]) => isUpper(q.name) ? Ok6(_tuple4(TyQual(nm.name, q.name, q.span, [], spanning(nm.span, q.span)), p2)) : errAt(`a type variable cannot be qualified; expected a constructor after '${nm.name}.', got '${q.name}'`, tokAt(toks, p2)), expectId(toks, p + 1)) : Ok6(_tuple4(TyName(nm.name, nm.span), p)), expectId(toks, pos)));
});
var startsTypeAtom = (t) => match7(t).with({ _tag: "TId" }, () => true).with({ _tag: "TLparen" }, () => true).with({ _tag: "TLbracket" }, () => true).with({ _tag: "TStr" }, () => true).otherwise(() => false);
var legacyTypeArgsLoop = _curry8(4, (toks, pos, acc, lastSp) => startsTypeAtom(tokAt(toks, pos).tok) ? _Result_flatMap4(([a, p]) => legacyTypeArgsLoop(toks, p, _Array_append5(a, acc), Some7(tySpan(a))), parseTypeAtom(toks, pos)) : Ok6(_tuple4(acc, lastSp, pos)));
var parseTypeApp = _curry8(2, (toks, pos) => _Result_flatMap4(([head, p]) => match7(head).with((_v) => {
  const _g = _v;
  return _g._tag === "TyName" && (({ name, span: sp }) => isUpper(name))(_g);
}, ({ name, span: sp }) => eq7(tokAt(toks, p).tok, TLt) ? _Result_flatMap4(([args, p1]) => _Result_flatMap4((p2) => Ok6(_tuple4(TyApp(name, args, toEnd(sp, toks, p2)), p2)), expectTok(TGt, toks, p1)), listUntil(TGt, parseTypeExpr, toks, p + 1)) : _Result_flatMap4(([args, lastSp, p2]) => Ok6(match7(lastSp).with({ _tag: "None" }, () => _tuple4(head, p2)).with({ _tag: "Some" }, ({ value: ls }) => _tuple4(TyApp(name, args, spanning(sp, ls)), p2)).exhaustive()), legacyTypeArgsLoop(toks, p, [], None7))).with({ _tag: "TyQual" }, ({ alias, name: nm, nameSpan, span: sp }) => eq7(tokAt(toks, p).tok, TLt) ? _Result_flatMap4(([args, p1]) => _Result_flatMap4((p2) => Ok6(_tuple4(TyQual(alias, nm, nameSpan, args, toEnd(sp, toks, p2)), p2)), expectTok(TGt, toks, p1)), listUntil(TGt, parseTypeExpr, toks, p + 1)) : _Result_flatMap4(([args, lastSp, p2]) => Ok6(match7(lastSp).with({ _tag: "None" }, () => _tuple4(head, p2)).with({ _tag: "Some" }, ({ value: ls }) => _tuple4(TyQual(alias, nm, nameSpan, args, spanning(sp, ls)), p2)).exhaustive()), legacyTypeArgsLoop(toks, p, [], None7))).otherwise(() => Ok6(_tuple4(head, p))), parseTypeAtom(toks, pos)));
var parseTypeUnionRest = _curry8(4, (toks, pos, acc, lastSp) => eq7(tokAt(toks, pos).tok, TBar) ? _Result_flatMap4(([m, p]) => parseTypeUnionRest(toks, p, _Array_append5(m, acc), tySpan(m)), parseTypeApp(toks, pos + 1)) : Ok6(_tuple4(acc, lastSp, pos)));
var parseTypeUnion = _curry8(2, (toks, pos) => _Result_flatMap4(([first, p]) => eq7(tokAt(toks, p).tok, TBar) ? _Result_flatMap4(([members, lastSp, p2]) => Ok6(_tuple4(TyUnion(members, spanning(tySpan(first), lastSp)), p2)), parseTypeUnionRest(toks, p, [first], tySpan(first))) : Ok6(_tuple4(first, p)), parseTypeApp(toks, pos)));
var parseTypeExpr = _curry8(2, (toks, pos) => _Result_flatMap4(([from, p]) => eq7(tokAt(toks, p).tok, TTarrow) ? _Result_flatMap4(([to, p2]) => Ok6(_tuple4(TyArrow(from, to, spanning(tySpan(from), tySpan(to))), p2)), parseTypeExpr(toks, p + 1)) : Ok6(_tuple4(from, p)), parseTypeUnion(toks, pos)));
var parseCtorField = _curry8(2, (toks, pos) => {
  const isLabel = match7(tokAt(toks, pos).tok).with({ _tag: "TId" }, () => eq7(tokAt(toks, pos + 1).tok, TColon)).otherwise(() => false);
  return isLabel ? _Result_flatMap4(([nm, p]) => _Result_flatMap4(([t, p2]) => Ok6(_tuple4({ name: Some7(nm.name), fieldType: t }, p2)), parseTypeExpr(toks, p + 1)), expectId(toks, pos)) : _Result_map4(([t, p]) => _tuple4({ name: None7, fieldType: t }, p), parseTypeExpr(toks, pos));
});
var parseCtor = _curry8(2, (toks, pos) => _Result_flatMap4(([nm, p]) => eq7(tokAt(toks, p).tok, TLparen) ? _Result_flatMap4(([fields, p2]) => _Result_flatMap4((p3) => Ok6(_tuple4({ name: nm.name, fields, span: toEnd(nm.span, toks, p3) }, p3)), expectTok(TRparen, toks, p2)), listUntil(TRparen, parseCtorField, toks, p + 1)) : Ok6(_tuple4({ name: nm.name, fields: [], span: nm.span }, p)), expectId(toks, pos)));
var ctorsLoop = _curry8(3, (toks, pos, acc) => _Result_flatMap4(([c, p]) => ((cs) => eq7(tokAt(toks, p).tok, TBar) ? ctorsLoop(toks, p + 1, cs) : Ok6(_tuple4(cs, p)))(_Array_append5(c, acc)), parseCtor(toks, pos)));
var parseAliasField = _curry8(2, (toks, pos) => _Result_flatMap4(([nm, p]) => ((optional) => ((p1) => _Result_flatMap4((p2) => _Result_flatMap4(([t, p3]) => Ok6(_tuple4({ name: nm.name, fieldType: t, optional }, p3)), parseTypeExpr(toks, p2)), expectTok(TColon, toks, p1)))(optional ? p + 1 : p))(eq7(tokAt(toks, p).tok, TQuestion)), expectLabel(toks, pos)));
var parseAliasBody = _curry8(2, (toks, pos) => _Result_flatMap4((p) => _Result_flatMap4(([fields, p2]) => _Result_flatMap4((p3) => Ok6(_tuple4(fields, p3)), expectTok(TRbrace, toks, p2)), listUntil(TRbrace, parseAliasField, toks, p)), expectTok(TLbrace, toks, pos)));
var typeParamsLoop = _curry8(3, (toks, pos, acc) => match7(tokAt(toks, pos).tok).with({ _tag: "TId" }, ({ value: name }) => typeParamsLoop(toks, pos + 1, _Array_append5(name, acc))).otherwise(() => Ok6(_tuple4(acc, pos))));
var parseTypeParams = _curry8(2, (toks, pos) => eq7(tokAt(toks, pos).tok, TLt) ? _Result_flatMap4(([names, p]) => _Result_map4((p2) => _tuple4(map3((n) => n.name, names), p2), expectTok(TGt, toks, p)), listUntil(TGt, expectId, toks, pos + 1)) : typeParamsLoop(toks, pos, []));
var startsTypeSynonym = (t) => match7(t).with({ _tag: "TStr" }, () => true).with({ _tag: "TLparen" }, () => true).with({ _tag: "TLbracket" }, () => true).otherwise(() => false);
var parseType = _curry8(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4(([nm, p1]) => _Result_flatMap4(([params, p2]) => _Result_flatMap4((p3) => eq7(tokAt(toks, p3).tok, TLbrace) ? _Result_map4(([alias, p4]) => _tuple4(SType(nm.name, params, [], Some7(alias), None7, false, None7, toEnd(start, toks, p4)), p4), parseAliasBody(toks, p3)) : startsTypeSynonym(tokAt(toks, p3).tok) ? _Result_flatMap4(([te, p4]) => Ok6(_tuple4(SType(nm.name, params, [], None7, Some7(te), false, None7, toEnd(start, toks, p4)), p4)), parseTypeExpr(toks, p3)) : ((afterBar) => _Result_map4(([ctors, p4]) => _tuple4(SType(nm.name, params, ctors, None7, None7, false, None7, toEnd(start, toks, p4)), p4), ctorsLoop(toks, afterBar, [])))(eq7(tokAt(toks, p3).tok, TBar) ? p3 + 1 : p3), expectTok(TEq, toks, p2)), parseTypeParams(toks, p1)), expectId(toks, p)), expectTok(TType, toks, pos));
});
var parseExtern = _curry8(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => eq7(tokAt(toks, p).tok, TType) ? _Result_flatMap4((p1) => _Result_flatMap4(([nm, p2]) => Ok6(_tuple4(SType(nm.name, [], [], None7, None7, false, None7, toEnd(start, toks, p2)), p2)), expectId(toks, p1)), expectTok(TType, toks, p)) : _Result_flatMap4(([nm, p1]) => _Result_flatMap4(([params, p2]) => _Result_flatMap4((p3) => _Result_flatMap4(([t, p4]) => _Result_flatMap4((p5) => ((isCurried) => ((pConv) => ((nextTok) => or4(or4(or4(or4(eq7(nextTok, TId("global")), eq7(nextTok, TId("send"))), eq7(nextTok, TId("get"))), eq7(nextTok, TId("set"))), eq7(nextTok, TId("new"))) ? isCurried ? errAt("'curried' applies to a module extern, not a JS convention \u2014 give the host's module and export instead", tokAt(toks, pConv)) : _Result_flatMap4(([convention, p6]) => _Result_flatMap4(([first, p7]) => ((hasSecond) => _Result_flatMap4(([second, p8]) => Ok6(_tuple4(SExtern(nm.name, nm.span, params, t, `mochi:${convention.name}:${first}`, second, false, false, None7, toEnd(start, toks, p8)), p8)), hasSecond ? expectStr(toks, p7) : Ok6(_tuple4("", p7))))(match7(tokAt(toks, p7).tok).with({ _tag: "TStr" }, () => or4(eq7(convention.name, "global"), eq7(convention.name, "new"))).otherwise(() => false)), expectStr(toks, p6)), expectId(toks, pConv)) : _Result_flatMap4(([moduleName, p6]) => _Result_flatMap4(([importedName, p7]) => Ok6(_tuple4(SExtern(nm.name, nm.span, params, t, moduleName, importedName, isCurried, false, None7, toEnd(start, toks, p7)), p7)), expectStr(toks, p6)), expectStr(toks, pConv)))(tokAt(toks, pConv).tok))(isCurried ? p5 + 1 : p5))(eq7(tokAt(toks, p5).tok, TId("curried"))), expectTok(TEq, toks, p4)), parseTypeExpr(toks, p3)), expectTok(TColon, toks, p2)), eq7(tokAt(toks, p1).tok, TLt) ? _Result_flatMap4(([names, pParams]) => _Result_flatMap4((pAfter) => Ok6(_tuple4(map3((n) => n.name, names), pAfter)), expectTok(TGt, toks, pParams)), listUntil(TGt, expectId, toks, p1 + 1)) : Ok6(_tuple4([], p1))), expectId(toks, p)), expectTok(TExtern, toks, pos));
});
var parseImportNs = _curry8(3, (toks, start, pos) => _Result_flatMap4(([asKw, p1]) => eq7(asKw.name, "as") ? _Result_flatMap4(([alias, p2]) => _Result_flatMap4(([kw, p3]) => eq7(kw.name, "from") ? _Result_map4(([path, p4]) => _tuple4(SImportNs(alias, path, toEnd(start, toks, p4)), p4), expectStr(toks, p3)) : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt(toks, p3)), expectId(toks, p2)), expectId(toks, p1)) : errAt(`expected 'as' in namespace import, got '${asKw.name}'`, tokAt(toks, p1)), expectId(toks, pos)));
var parseImport = _curry8(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => eq7(tokAt(toks, p).tok, TStar) ? _Result_flatMap4((p1) => parseImportNs(toks, start, p1), expectTok(TStar, toks, p)) : _Result_flatMap4((p1) => _Result_flatMap4(([names, p2]) => _Result_flatMap4((p3) => _Result_flatMap4(([kw, p4]) => eq7(kw.name, "from") ? _Result_map4(([path, p5]) => _tuple4(SImport(names, path, toEnd(start, toks, p5)), p5), expectStr(toks, p4)) : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt(toks, p4)), expectId(toks, p3)), expectTok(TRbrace, toks, p2)), listUntil(TRbrace, expectId, toks, p1)), expectTok(TLbrace, toks, p)), expectTok(TImport, toks, pos));
});
var parseRecordDestructure = _curry8(5, (toks, start, pos, tmp, hooks) => {
  const openSp = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4(([fields, p1]) => ((closeSp) => _Result_flatMap4((p2) => _Result_flatMap4((p3) => _Result_flatMap4(([value, p4]) => ((whole) => ((patSpan2) => ((tmpName) => ((header) => ((access) => Ok6(_tuple4(_Array_prepend2(header, map3(access, fields)), p4, tmp + 1)))((f) => SLet(f.name, f.span, None7, EField(ERef(tmpName, f.span), f.name, false, f.span), false, None7, f.span)))(SLet(tmpName, patSpan2, None7, value, false, None7, whole)))(`$d${show2(tmp)}`))(spanning(openSp, closeSp)))(toEnd(start, toks, p4)), parseExpr(toks, p3, hooks)), expectTok(TEq, toks, p2)), expectTok(TRbrace, toks, p1)))(spanOf(tokAt(toks, p1))), listUntil(TRbrace, expectId, toks, p)), expectTok(TLbrace, toks, pos));
});
var parseLet = _curry8(4, (toks, pos, tmp, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => eq7(tokAt(toks, p).tok, TLbrace) ? parseRecordDestructure(toks, start, p, tmp, hooks) : _Result_flatMap4(([nm, p1]) => _Result_flatMap4(([annot, pA]) => _Result_flatMap4((p2) => _Result_flatMap4(([value, p3]) => Ok6(_tuple4([SLet(nm.name, nm.span, annot, value, false, None7, toEnd(start, toks, p3))], p3, tmp)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, pA)), eq7(tokAt(toks, p1).tok, TColon) ? _Result_map4(([ty, p2]) => _tuple4(Some7(ty), p2), parseTypeExpr(toks, p1 + 1)) : Ok6(_tuple4(None7, p1))), expectId(toks, p)), expectTok(TLet, toks, pos));
});
var setLetMeta = _curry8(3, (exported, doc, s) => match7(s).with({ _tag: "SLet" }, ({ name, nameSpan, annot, value, span }) => SLet(name, nameSpan, annot, value, exported, doc, span)).otherwise((other) => other));
var setTypeMeta = _curry8(3, (exported, doc, s) => match7(s).with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, span }) => SType(name, params, ctors, alias, aliasType, exported, doc, span)).otherwise((other) => other));
var setExternMeta = _curry8(3, (exported, doc, s) => match7(s).with({ _tag: "SExtern" }, ({ name, nameSpan, params, typeExpr: t, module: m, imported: i, curried, span }) => SExtern(name, nameSpan, params, t, m, i, curried, exported, doc, span)).with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, span }) => SType(name, params, ctors, alias, aliasType, exported, doc, span)).otherwise((other) => other));
var parseExprStmt = _curry8(4, (toks, pos, tmp, hooks) => {
  const start = tokAt(toks, pos);
  return _Result_flatMap4(([value, p]) => ((p2) => Ok6(_tuple4([SExpr(value, toEnd(spanOf(start), toks, p))], p2, tmp)))(eq7(tokAt(toks, p).tok, TSemi) ? p + 1 : p), parseExpr(toks, pos, hooks));
});
var parseStmt = _curry8(4, (toks, pos, tmp, hooks) => {
  const lt4 = tokAt(toks, pos);
  const doc = lt4.doc;
  return match7(lt4.tok).with({ _tag: "TImport" }, () => _Result_map4(([s, p]) => _tuple4([s], p, tmp), parseImport(toks, pos))).with({ _tag: "TExport" }, () => ((exportSp) => match7(tokAt(toks, pos + 1).tok).with({ _tag: "TType" }, () => _Result_map4(([s, p]) => _tuple4([widenToExport(exportSp, setTypeMeta(true, doc, s))], p, tmp), parseType(toks, pos + 1))).with({ _tag: "TExtern" }, () => _Result_map4(([s, p]) => _tuple4([widenToExport(exportSp, setExternMeta(true, doc, s))], p, tmp), parseExtern(toks, pos + 1))).with({ _tag: "TLet" }, () => _Result_map4(([stmts, p, tmp2]) => _tuple4(widenHeadToExport(exportSp, map3(setLetMeta(true, doc), stmts)), p, tmp2), parseLet(toks, pos + 1, tmp, hooks))).otherwise(() => errAt("`export` must precede let, type, or extern", tokAt(toks, pos + 1))))(spanOf(lt4))).with({ _tag: "TType" }, () => _Result_map4(([s, p]) => _tuple4([setTypeMeta(false, doc, s)], p, tmp), parseType(toks, pos))).with({ _tag: "TExtern" }, () => _Result_map4(([s, p]) => _tuple4([setExternMeta(false, doc, s)], p, tmp), parseExtern(toks, pos))).with({ _tag: "TLet" }, () => _Result_map4(([stmts, p, tmp2]) => _tuple4(map3(setLetMeta(false, doc), stmts), p, tmp2), parseLet(toks, pos, tmp, hooks))).otherwise(() => parseExprStmt(toks, pos, tmp, hooks));
});
var widenToExport = _curry8(2, (start, s) => match7(s).with({ _tag: "SLet" }, ({ name, nameSpan, annot, value, exported, doc, span }) => SLet(name, nameSpan, annot, value, exported, doc, spanning(start, span))).with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, exported, doc, span }) => SType(name, params, ctors, alias, aliasType, exported, doc, spanning(start, span))).with({ _tag: "SExtern" }, ({ name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span }) => SExtern(name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, spanning(start, span))).otherwise((other) => other));
var widenHeadToExport = _curry8(2, (start, stmts) => match7(stmts).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([head, ...rest]) => _Array_prepend2(widenToExport(start, head), rest)).otherwise(() => stmts));
var isSyncTok = (t) => match7(t).with({ _tag: "TLet" }, () => true).with({ _tag: "TType" }, () => true).with({ _tag: "TExtern" }, () => true).with({ _tag: "TImport" }, () => true).with({ _tag: "TExport" }, () => true).otherwise(() => false);
var isOpener = (t) => or4(or4(eq7(t, TLparen), eq7(t, TLbrace)), eq7(t, TLbracket));
var isCloser = (t) => or4(or4(eq7(t, TRparen), eq7(t, TRbrace)), eq7(t, TRbracket));
var maxParseErrors = 100;
var resumeAt = _curry8(3, (toks, pos, at) => and5(pos + 1 < length6(toks), tokAt(toks, pos).start < at) ? resumeAt(toks, pos + 1, at) : pos);
var skipToSync = _curry8(3, (toks, pos, depth) => {
  const t = tokAt(toks, pos).tok;
  return or4(eq7(t, TEof), and5(eq7(depth, 0), isSyncTok(t))) ? pos : skipToSync(toks, pos + 1, isOpener(t) ? depth + 1 : and5(isCloser(t), depth > 0) ? depth - 1 : depth);
});
var recoverFrom = _curry8(4, (toks, before, failedAt, at) => {
  const resume = resumeAt(toks, before, at);
  const start = eq7(resume, before) ? before + 1 : resume;
  const final = skipToSync(toks, start, 0);
  return { node: SError({ start: failedAt.start, end: tokAt(toks, final - 1).end }), pos: final };
});
var stmtsLoop = _curry8(6, (toks, pos0, tmp0, acc0, diags0, hooks) => {
  let pos = pos0;
  let tmp = tmp0;
  let acc = acc0;
  let diags = diags0;
  while (true) {
    if (eq7(tokAt(toks, pos).tok, TEof)) {
      return { stmts: acc, diagnostics: diags };
    } else {
      {
        const failedAt = tokAt(toks, pos);
        const _step = match7(parseStmt(toks, pos, tmp, hooks)).with((_v) => {
          const _g = _v;
          return _g._tag === "Ok";
        }, ({ value: [stmts, p, tmp2] }) => eq7(p, pos) ? ((r) => _recur3(r.pos, tmp, _Array_append5(r.node, acc), _Array_append5({ message: `unexpected token ${tokName(failedAt.tok)}`, start: failedAt.start, end: failedAt.end }, diags)))(recoverFrom(toks, pos, failedAt, failedAt.start)) : _recur3(p, tmp2, _Array_concat2(acc, stmts), diags)).with({ _tag: "Err" }, ({ error: d }) => ((ds) => length6(ds) >= maxParseErrors ? _done3({ stmts: _Array_append5(SError({ start: failedAt.start, end: tokAt(toks, length6(toks) - 1).end }), acc), diagnostics: _Array_append5({ message: "too many parse errors; stopping", start: failedAt.start, end: failedAt.end }, ds) }) : ((r) => _recur3(r.pos, tmp, _Array_append5(r.node, acc), ds))(recoverFrom(toks, pos, failedAt, d.start)))(_Array_append5(d, diags))).exhaustive();
        if (_step._tag === "recur") {
          [pos, tmp, acc, diags] = _step.args;
          continue;
        }
        return _step.value;
      }
    }
  }
});
var parseRecovering = _curry8(2, (toks, pluginsOpt) => {
  const hooks = parseHooksOf(resolvePluginsDefault(pluginsOpt));
  return stmtsLoop(toks, match7(tokAt(toks, 0).tok).with({ _tag: "TStr" }, ({ value }) => eq7(value, "use open") ? 1 : 0).otherwise(() => 0), 0, [], [], hooks);
});
var parse = (toks) => parseWith(toks, None7);
var parseWith = _curry8(2, (toks, pluginsOpt) => {
  const r = parseRecovering(toks, pluginsOpt);
  return match7(_Array_get5(0, r.diagnostics)).with({ _tag: "Some" }, ({ value: d }) => Err5(d)).with({ _tag: "None" }, () => Ok6(r.stmts)).exhaustive();
});

import { Err as Err7, None as None10, Ok as Ok8, Some as Some10, _Array_append as _Array_append7, _Array_contains as _Array_contains2, _Array_flatMap as _Array_flatMap2, _Array_get as _Array_get8, _Array_head as _Array_head3, _Map_get as _Map_get4, _Map_getOr as _Map_getOr2, _Map_has as _Map_has2, _Map_keys as _Map_keys3, _Map_set as _Map_set3, _Option_isNone, _Option_isSome as _Option_isSome2, _Option_orElse, _Option_unwrapOr as _Option_unwrapOr6, _Result_flatMap as _Result_flatMap6, _Set_add, _Set_fromArray, _Set_has, _Str_codeAt as _Str_codeAt4, _Str_join as _Str_join4, _curry as _curry11, _done as _done5, _recur as _recur5, _tuple as _tuple5, and as and7, eq as eq10, filter as filter3, length as length9, map as map6, not as not6, or as or5, show as show5 } from "@mochi/compiler/runtime";
import { match as match10 } from "@onrails/pattern";

import { Err as Err6, Ok as Ok7, Some as Some8, _Array_get as _Array_get6, _Array_prepend as _Array_prepend3, _Map_has, _Map_set as _Map_set2, _Option_unwrapOr as _Option_unwrapOr4, _Result_flatMap as _Result_flatMap5, _Result_map as _Result_map5, _curry as _curry9, _done as _done4, _recur as _recur4, eq as eq8, filter, length as length7, map as map4, not as not4, show as show3 } from "@mochi/compiler/runtime";
import { match as match8 } from "@onrails/pattern";
var emptyRegistry = { ctors: new Map, types: new Map };
var primTypeNames = ["number", "int", "float", "string", "bool", "unit"];
var keysOfFrom = _curry9(2, (fields, i) => match8(_Array_get6(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => _Array_prepend3(_Option_unwrapOr4(`_${show3(i)}`, f.name), keysOfFrom(fields, i + 1))).exhaustive());
var keysOf = (fields) => keysOfFrom(fields, 0);
var builtinSpan = { start: 0, end: 0 };
var builtinTypeDecls = [{ name: "Option", params: ["a"], ctors: [{ name: "Some", fields: [{ name: Some8("value"), fieldType: TyName("a", builtinSpan) }], span: builtinSpan }, { name: "None", fields: [], span: builtinSpan }] }, { name: "Result", params: ["a", "e"], ctors: [{ name: "Ok", fields: [{ name: Some8("value"), fieldType: TyName("a", builtinSpan) }], span: builtinSpan }, { name: "Err", fields: [{ name: Some8("error"), fieldType: TyName("e", builtinSpan) }], span: builtinSpan }] }];
var declaresType = _curry9(3, (stmts, i, name) => match8(_Array_get6(i, stmts)).with({ _tag: "None" }, () => false).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { name: n } }) => eq8(n, name) ? true : declaresType(stmts, i + 1, name)).with({ _tag: "Some" }, () => declaresType(stmts, i + 1, name)).exhaustive());
var builtinDeclsFor = (stmts) => filter((bt) => not4(declaresType(stmts, 0, bt.name)), builtinTypeDecls);
var seedRegCtorsFrom = _curry9(4, (ctors, i, owner, acc) => match8(_Array_get6(i, ctors)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: c }) => seedRegCtorsFrom(ctors, i + 1, owner, _Map_has(c.name, acc) ? acc : _Map_set2(c.name, { owner, arity: length7(c.fields) }, acc))).exhaustive());
var seedRegDeclsFrom = _curry9(3, (decls, i, reg) => match8(_Array_get6(i, decls)).with({ _tag: "None" }, () => reg).with({ _tag: "Some" }, ({ value: bt }) => seedRegDeclsFrom(decls, i + 1, { ctors: seedRegCtorsFrom(bt.ctors, 0, bt.name, reg.ctors), types: _Map_set2(bt.name, map4((c) => c.name, bt.ctors), reg.types) })).exhaustive());
var ctorErr = _curry9(2, (message, sp) => ({ message, start: sp.start, end: sp.end }));
var ctorsInto = _curry9(5, (ctors, i, owner, sp, acc) => match8(_Array_get6(i, ctors)).with({ _tag: "None" }, () => Ok7(acc)).with({ _tag: "Some" }, ({ value: c }) => _Map_has(c.name, acc) ? Err6(ctorErr(`duplicate constructor '${c.name}'`, sp)) : ctorsInto(ctors, i + 1, owner, sp, _Map_set2(c.name, { owner, arity: length7(c.fields) }, acc))).exhaustive());
var buildLoop = _curry9(3, (stmts, i, reg) => match8(_Array_get6(i, stmts)).with({ _tag: "None" }, () => Ok7(reg)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { name, ctors, span: sp } }) => _Map_has(name, reg.types) ? Err6(ctorErr(`duplicate type '${name}'`, sp)) : _Result_flatMap5((cs) => buildLoop(stmts, i + 1, { ctors: cs, types: _Map_set2(name, map4((c) => c.name, ctors), reg.types) }), ctorsInto(ctors, 0, name, sp, reg.ctors))).with({ _tag: "Some" }, () => buildLoop(stmts, i + 1, reg)).exhaustive());
var buildRegistry = (stmts) => _Result_map5((reg) => seedRegDeclsFrom(builtinDeclsFor(stmts), 0, reg), buildLoop(stmts, 0, emptyRegistry));
var exportedRegLoop = _curry9(3, (stmts, i0, reg0) => {
  let i = i0;
  let reg = reg0;
  while (true) {
    const _step = match8(_Array_get6(i, stmts)).with({ _tag: "None" }, () => _done4(reg)).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value._tag === "SType" && _g.value.exported === true;
    }, ({ value: { name, ctors } }) => _recur4(i + 1, { ctors: seedRegCtorsFrom(ctors, 0, name, reg.ctors), types: _Map_set2(name, map4((c) => c.name, ctors), reg.types) })).with({ _tag: "Some" }, () => _recur4(i + 1, reg)).exhaustive();
    if (_step._tag === "recur") {
      [i, reg] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var ctorKeysInto = _curry9(3, (ctors, i, m) => match8(_Array_get6(i, ctors)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { name, fields } }) => ctorKeysInto(ctors, i + 1, _Map_set2(name, keysOf(fields), m))).exhaustive());
var ctorKeysFrom = _curry9(3, (stmts, i, m) => match8(_Array_get6(i, stmts)).with({ _tag: "None" }, () => m).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { ctors } }) => ctorKeysFrom(stmts, i + 1, ctorKeysInto(ctors, 0, m))).with({ _tag: "Some" }, () => ctorKeysFrom(stmts, i + 1, m)).exhaustive());
var ctorKeysFromStmts = _curry9(2, (stmts, m) => ctorKeysFrom(stmts, 0, m));
var seedKeyCtorsFrom = _curry9(3, (ctors, i, m) => match8(_Array_get6(i, ctors)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { name, fields } }) => seedKeyCtorsFrom(ctors, i + 1, _Map_has(name, m) ? m : _Map_set2(name, keysOf(fields), m))).exhaustive());
var seedKeyDeclsFrom = _curry9(3, (decls, i, m) => match8(_Array_get6(i, decls)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { ctors } }) => seedKeyDeclsFrom(decls, i + 1, seedKeyCtorsFrom(ctors, 0, m))).exhaustive());
var seedBuiltinCtorKeys = _curry9(2, (stmts, m) => seedKeyDeclsFrom(builtinDeclsFor(stmts), 0, m));
var exportedCtorKeysFrom = _curry9(3, (stmts, i, m) => match8(_Array_get6(i, stmts)).with({ _tag: "None" }, () => m).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType" && _g.value.exported === true;
}, ({ value: { ctors } }) => exportedCtorKeysFrom(stmts, i + 1, ctorKeysInto(ctors, 0, m))).with({ _tag: "Some" }, () => exportedCtorKeysFrom(stmts, i + 1, m)).exhaustive());

import { None as None9, Some as Some9, _Array_append as _Array_append6, _Array_concat as _Array_concat3, _Array_contains, _Array_drop as _Array_drop2, _Array_flatMap, _Array_get as _Array_get7, _Array_head as _Array_head2, _Array_prepend as _Array_prepend4, _Array_tail as _Array_tail2, _Array_take, _Map_get as _Map_get3, _Map_getOr, _Map_keys as _Map_keys2, _Option_isSome, _Option_unwrapOr as _Option_unwrapOr5, _Str_concat, _Str_endsWith, _Str_join as _Str_join3, _curry as _curry10, and as and6, eq as eq9, filter as filter2, length as length8, map as map5, not as not5, reduce, show as show4 } from "@mochi/compiler/runtime";
import { match as match9 } from "@onrails/pattern";
var MWild = { _tag: "MWild" };
var MCtor = _curry10(2, (name, args) => ({ _tag: "MCtor", name, args }));
var MBool = (value) => ({ _tag: "MBool", value });
var MNum = (value) => ({ _tag: "MNum", value });
var MStr = (value) => ({ _tag: "MStr", value });
var MTuple = (elems) => ({ _tag: "MTuple", elems });
var MRecord = _curry10(2, (labels, pats) => ({ _tag: "MRecord", labels, pats }));
var MArr = _curry10(2, (elems, rest) => ({ _tag: "MArr", elems, rest }));
var MOpaque = { _tag: "MOpaque" };
var HCtor = (name) => ({ _tag: "HCtor", name });
var HBool = (value) => ({ _tag: "HBool", value });
var HNum = (value) => ({ _tag: "HNum", value });
var HStr = (value) => ({ _tag: "HStr", value });
var HTuple = (arity) => ({ _tag: "HTuple", arity });
var HRecord = { _tag: "HRecord" };
var HArr = (len) => ({ _tag: "HArr", len });
var UNone = (fuel) => ({ _tag: "UNone", fuel });
var USome = _curry10(2, (row, fuel) => ({ _tag: "USome", row, fuel }));
var UFuel = { _tag: "UFuel" };
var ExOk = { _tag: "ExOk" };
var ExWitness = (witness) => ({ _tag: "ExWitness", witness });
var ExFuel = { _tag: "ExFuel" };
var mWilds = (n) => n <= 0 ? [] : _Array_prepend4(MWild, mWilds(n - 1));
var isWildMP = (mp) => match9(mp).with({ _tag: "MWild" }, () => true).otherwise(() => false);
var explodePat = (p) => match9(p).with({ _tag: "PAs" }, ({ pat }) => explodePat(pat)).with({ _tag: "POr" }, ({ alts }) => _Array_flatMap(explodePat, alts)).otherwise(() => [p]);
var toMP = (p) => match9(p).with({ _tag: "PAs" }, ({ pat }) => toMP(pat)).with({ _tag: "PWild" }, () => MWild).with({ _tag: "PUnit" }, () => MWild).with({ _tag: "PBind" }, () => MWild).with({ _tag: "PLit" }, ({ value: v }) => MNum(v)).with({ _tag: "PBool" }, ({ value: v }) => MBool(v)).with({ _tag: "PStr" }, ({ value: v }) => MStr(v)).with({ _tag: "PTuple" }, ({ elems }) => MTuple(map5(toMP, elems))).with({ _tag: "PCtor" }, ({ ctor: name, args }) => MCtor(name, map5(toMP, args))).with({ _tag: "PRecord" }, ({ fields }) => MRecord(map5((f) => f.label, fields), map5((f) => toMP(f.pat), fields))).with({ _tag: "PArr" }, ({ elems, rest }) => MArr(map5(toMP, elems), _Option_isSome(rest))).with({ _tag: "PList" }, () => MOpaque).with({ _tag: "POr" }, () => MOpaque).exhaustive();
var headOf = (mp) => match9(mp).with({ _tag: "MWild" }, () => None9).with({ _tag: "MOpaque" }, () => None9).with({ _tag: "MCtor" }, ({ name: n }) => Some9(HCtor(n))).with({ _tag: "MBool" }, ({ value: v }) => Some9(HBool(v))).with({ _tag: "MNum" }, ({ value: v }) => Some9(HNum(v))).with({ _tag: "MStr" }, ({ value: v }) => Some9(HStr(v))).with({ _tag: "MTuple" }, ({ elems }) => Some9(HTuple(length8(elems)))).with({ _tag: "MRecord" }, () => Some9(HRecord)).with({ _tag: "MArr" }, ({ elems }) => Some9(HArr(length8(elems)))).exhaustive();
var colOf = (m) => _Array_flatMap((row) => match9(_Array_head2(row)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: hd }) => [hd]).exhaustive(), m);
var headsOf = (col) => _Array_flatMap((mp) => match9(headOf(mp)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: h }) => [h]).exhaustive(), col);
var addLabel = _curry10(2, (acc, l) => _Array_contains(l, acc) ? acc : _Array_append6(l, acc));
var labelsOfMP = _curry10(2, (acc, mp) => match9(mp).with({ _tag: "MRecord" }, ({ labels: ls }) => reduce(addLabel, acc, ls)).otherwise(() => acc));
var recordLabelsOf = (col) => reduce(labelsOfMP, [], col);
var indexOfLabel = _curry10(3, (l, labels, i) => match9(_Array_get7(i, labels)).with({ _tag: "None" }, () => 0 - 1).with({ _tag: "Some" }, ({ value: x }) => eq9(x, l) ? i : indexOfLabel(l, labels, i + 1)).exhaustive());
var fieldOf = _curry10(3, (l, labels, pats) => {
  const i = indexOfLabel(l, labels, 0);
  return i < 0 ? MWild : _Option_unwrapOr5(MWild, _Array_get7(i, pats));
});
var arrShapeStep = _curry10(2, (acc, mp) => match9(mp).with({ _tag: "MArr" }, ({ elems, rest }) => ((n) => rest ? { fixed: acc.fixed, restFrom: match9(acc.restFrom).with({ _tag: "None" }, () => Some9(n)).with({ _tag: "Some" }, ({ value: m }) => Some9(m < n ? m : n)).exhaustive() } : { fixed: _Array_contains(n, acc.fixed) ? acc.fixed : _Array_append6(n, acc.fixed), restFrom: acc.restFrom })(length8(elems))).otherwise(() => acc));
var arrShapeOf = (col) => reduce(arrShapeStep, { fixed: [], restFrom: None9 }, col);
var rangeCovered = _curry10(3, (shape, i, n) => i >= n ? true : and6(_Array_contains(i, shape.fixed), rangeCovered(shape, i + 1, n)));
var arrComplete = (shape) => match9(shape.restFrom).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: r }) => rangeCovered(shape, 0, r)).exhaustive();
var arrMissingLen = _curry10(2, (shape, n) => and6(not5(_Array_contains(n, shape.fixed)), match9(shape.restFrom).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: r }) => n < r).exhaustive()) ? n : arrMissingLen(shape, n + 1));
var rangeArr = _curry10(2, (i, top) => i > top ? [] : _Array_prepend4(i, rangeArr(i + 1, top)));
var arrLengths = (shape) => {
  const top = reduce(_curry10(2, (a, x) => x > a ? x : a), _Option_unwrapOr5(0, shape.restFrom), shape.fixed);
  return rangeArr(0, top);
};
var specializeRow = _curry10(3, (h, mp, labels) => match9(h).with({ _tag: "HCtor" }, ({ name }) => match9(mp).with({ _tag: "MCtor" }, ({ name: n, args }) => eq9(n, name) ? Some9(args) : None9).otherwise(() => None9)).with({ _tag: "HBool" }, ({ value: v }) => match9(mp).with({ _tag: "MBool" }, ({ value: b }) => eq9(b, v) ? Some9([]) : None9).otherwise(() => None9)).with({ _tag: "HNum" }, ({ value: v }) => match9(mp).with({ _tag: "MNum" }, ({ value: x }) => eq9(x, v) ? Some9([]) : None9).otherwise(() => None9)).with({ _tag: "HStr" }, ({ value: v }) => match9(mp).with({ _tag: "MStr" }, ({ value: x }) => eq9(x, v) ? Some9([]) : None9).otherwise(() => None9)).with({ _tag: "HTuple" }, () => match9(mp).with({ _tag: "MTuple" }, ({ elems }) => Some9(elems)).otherwise(() => None9)).with({ _tag: "HRecord" }, () => match9(mp).with({ _tag: "MRecord" }, ({ labels: ls, pats: ps }) => Some9(map5((l) => fieldOf(l, ls, ps), labels))).otherwise(() => None9)).with({ _tag: "HArr" }, ({ len }) => match9(mp).with({ _tag: "MArr" }, ({ elems, rest }) => ((k) => rest ? k <= len ? Some9(_Array_concat3(elems, mWilds(len - k))) : None9 : eq9(k, len) ? Some9(elems) : None9)(length8(elems))).otherwise(() => None9)).exhaustive());
var specializeOne = _curry10(4, (h, arity, labels, row) => match9(_Array_head2(row)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: hd }) => ((rest) => isWildMP(hd) ? [_Array_concat3(mWilds(arity), rest)] : match9(specializeRow(h, hd, labels)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: sub3 }) => [_Array_concat3(sub3, rest)]).exhaustive())(_Array_tail2(row))).exhaustive());
var specializeM = _curry10(4, (m, h, arity, labels) => _Array_flatMap((row) => specializeOne(h, arity, labels, row), m));
var defaultM = (m) => _Array_flatMap((row) => match9(_Array_head2(row)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: hd }) => isWildMP(hd) ? [_Array_tail2(row)] : []).exhaustive(), m);
var rebuild = _curry10(3, (h, args, labels) => match9(h).with({ _tag: "HCtor" }, ({ name }) => MCtor(name, args)).with({ _tag: "HTuple" }, () => MTuple(args)).with({ _tag: "HRecord" }, () => MRecord(labels, args)).with({ _tag: "HArr" }, () => MArr(args, false)).with({ _tag: "HBool" }, ({ value: v }) => MBool(v)).with({ _tag: "HNum" }, ({ value: v }) => MNum(v)).with({ _tag: "HStr" }, ({ value: v }) => MStr(v)).exhaustive());
var takenNums = (heads) => _Array_flatMap((h) => match9(h).with({ _tag: "HNum" }, ({ value: v }) => [v]).otherwise(() => []), heads);
var freshNum = _curry10(2, (taken, i) => _Array_contains(i, taken) ? freshNum(taken, i + 1) : i);
var takenStrs = (heads) => _Array_flatMap((h) => match9(h).with({ _tag: "HStr" }, ({ value: v }) => [v]).otherwise(() => []), heads);
var starsOf = (n) => n <= 0 ? "" : _Str_concat("*", starsOf(n - 1));
var freshStr = _curry10(2, (taken, i) => {
  const s = starsOf(i);
  return _Array_contains(s, taken) ? freshStr(taken, i + 1) : s;
});
var ctorNames = (heads) => _Array_flatMap((h) => match9(h).with({ _tag: "HCtor" }, ({ name: n }) => [n]).otherwise(() => []), heads);
var boolVals = (heads) => _Array_flatMap((h) => match9(h).with({ _tag: "HBool" }, ({ value: v }) => [v]).otherwise(() => []), heads);
var ctorInfoSuffixed = _curry10(3, (keys, reg, n) => match9(keys).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => None9).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([k, ...rest]) => _Str_endsWith(`.${n}`, k) ? _Map_get3(k, reg.ctors) : ctorInfoSuffixed(rest, reg, n)).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var ctorInfoOf = _curry10(2, (reg, n) => match9(_Map_get3(n, reg.ctors)).with({ _tag: "Some" }, ({ value: info }) => Some9(info)).with({ _tag: "None" }, () => ctorInfoSuffixed(_Map_keys2(reg.ctors), reg, n)).exhaustive());
var arityOfCtor = _curry10(2, (reg, n) => match9(ctorInfoOf(reg, n)).with({ _tag: "None" }, () => 0).with({ _tag: "Some" }, ({ value: info }) => info.arity).exhaustive());
var ownerOfCtor = _curry10(2, (reg, n) => match9(ctorInfoOf(reg, n)).with({ _tag: "None" }, () => None9).with({ _tag: "Some" }, ({ value: info }) => Some9(info.owner)).exhaustive());
var allNamesIn = _curry10(2, (all, names) => reduce(_curry10(2, (acc, n) => and6(acc, _Array_contains(n, names))), true, all));
var useful = _curry10(4, (m, width, reg, fuel) => fuel <= 0 ? UFuel : eq9(width, 0) ? eq9(length8(m), 0) ? USome([], fuel - 1) : UNone(fuel - 1) : eq9(length8(m), 0) ? USome(mWilds(width), fuel - 1) : usefulSplit(m, width, reg, fuel - 1));
var usefulSplit = _curry10(4, (m, width, reg, fuel) => {
  const col = colOf(m);
  const heads = headsOf(col);
  return match9(_Array_head2(heads)).with({ _tag: "None" }, () => prependWitness(MWild, useful(defaultM(m), width - 1, reg, fuel))).with({ _tag: "Some" }, ({ value: h0 }) => usefulHead(m, col, heads, h0, width, reg, fuel)).exhaustive();
});
var prependWitness = _curry10(2, (mp, r) => match9(r).with({ _tag: "UFuel" }, () => UFuel).with({ _tag: "UNone" }, ({ fuel: f }) => UNone(f)).with({ _tag: "USome" }, ({ row, fuel: f }) => USome(_Array_prepend4(mp, row), f)).exhaustive());
var tryHeads = _curry10(8, (m, heads, arities, labels, width, reg, fuel, i) => match9(_Array_get7(i, heads)).with({ _tag: "None" }, () => UNone(fuel)).with({ _tag: "Some" }, ({ value: h }) => ((arity) => match9(useful(specializeM(m, h, arity, labels), arity + width - 1, reg, fuel)).with({ _tag: "UFuel" }, () => UFuel).with({ _tag: "UNone" }, ({ fuel: f2 }) => tryHeads(m, heads, arities, labels, width, reg, f2, i + 1)).with({ _tag: "USome" }, ({ row, fuel: f2 }) => USome(_Array_prepend4(rebuild(h, _Array_take(arity, row), labels), _Array_drop2(arity, row)), f2)).exhaustive())(_Option_unwrapOr5(0, _Array_get7(i, arities)))).exhaustive());
var usefulHead = _curry10(7, (m, col, heads, h0, width, reg, fuel) => match9(h0).with({ _tag: "HTuple" }, ({ arity }) => tryHeads(m, [HTuple(arity)], [arity], [], width, reg, fuel, 0)).with({ _tag: "HRecord" }, () => ((labels) => tryHeads(m, [HRecord], [length8(labels)], labels, width, reg, fuel, 0))(recordLabelsOf(col))).with({ _tag: "HCtor" }, () => usefulCtor(m, heads, width, reg, fuel)).with({ _tag: "HBool" }, () => usefulBool(m, heads, width, reg, fuel)).with({ _tag: "HArr" }, () => usefulArr(m, col, width, reg, fuel)).with({ _tag: "HNum" }, () => prependWitness(MNum(freshNum(takenNums(heads), 0)), useful(defaultM(m), width - 1, reg, fuel))).with({ _tag: "HStr" }, () => prependWitness(MStr(freshStr(takenStrs(heads), 0)), useful(defaultM(m), width - 1, reg, fuel))).exhaustive());
var usefulCtor = _curry10(5, (m, heads, width, reg, fuel) => {
  const names = ctorNames(heads);
  const ownerOpt = match9(_Array_head2(names)).with({ _tag: "None" }, () => None9).with({ _tag: "Some" }, ({ value: n }) => ownerOfCtor(reg, n)).exhaustive();
  const all = match9(ownerOpt).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: o }) => _Map_getOr([], o, reg.types)).exhaustive();
  return and6(length8(all) > 0, allNamesIn(all, names)) ? tryHeads(m, map5((n) => HCtor(n), all), map5((n) => arityOfCtor(reg, n), all), [], width, reg, fuel, 0) : prependWitness(match9(_Array_head2(filter2((n) => not5(_Array_contains(n, names)), all))).with({ _tag: "None" }, () => MWild).with({ _tag: "Some" }, ({ value: n }) => MCtor(n, mWilds(arityOfCtor(reg, n)))).exhaustive(), useful(defaultM(m), width - 1, reg, fuel));
});
var usefulBool = _curry10(5, (m, heads, width, reg, fuel) => {
  const vs = boolVals(heads);
  const hasTrue = _Array_contains(true, vs);
  return and6(hasTrue, _Array_contains(false, vs)) ? tryHeads(m, [HBool(true), HBool(false)], [0, 0], [], width, reg, fuel, 0) : prependWitness(MBool(not5(hasTrue)), useful(defaultM(m), width - 1, reg, fuel));
});
var usefulArr = _curry10(5, (m, col, width, reg, fuel) => {
  const shape = arrShapeOf(col);
  return arrComplete(shape) ? ((lens) => tryHeads(m, map5((n) => HArr(n), lens), lens, [], width, reg, fuel, 0))(arrLengths(shape)) : prependWitness(MArr(mWilds(arrMissingLen(shape, 0)), false), useful(defaultM(m), width - 1, reg, fuel));
});
var showFields = _curry10(3, (labels, pats, i) => match9(_Array_get7(i, labels)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: l }) => _Array_prepend4(`${l}: ${showWitness(_Option_unwrapOr5(MWild, _Array_get7(i, pats)))}`, showFields(labels, pats, i + 1))).exhaustive());
var showWitness = (mp) => match9(mp).with({ _tag: "MWild" }, () => "_").with({ _tag: "MOpaque" }, () => "_").with({ _tag: "MBool" }, ({ value: v }) => show4(v)).with({ _tag: "MNum" }, ({ value: v }) => show4(v)).with({ _tag: "MStr" }, ({ value: v }) => show4(v)).with({ _tag: "MCtor" }, ({ name: n, args }) => eq9(length8(args), 0) ? n : `${n}(${_Str_join3(", ", map5(showWitness, args))})`).with({ _tag: "MTuple" }, ({ elems }) => `(${_Str_join3(", ", map5(showWitness, elems))})`).with({ _tag: "MRecord" }, ({ labels, pats }) => `{ ${_Str_join3(", ", showFields(labels, pats, 0))} }`).with({ _tag: "MArr" }, ({ elems, rest }) => `[${_Str_join3(", ", _Array_concat3(map5(showWitness, elems), rest ? ["..."] : []))}]`).exhaustive();
var isWideWitnessM = (mp) => match9(mp).with({ _tag: "MWild" }, () => true).with({ _tag: "MCtor" }, ({ args }) => reduce(_curry10(2, (acc, a) => and6(acc, isWildMP(a))), true, args)).otherwise(() => false);
var checkExhaustiveM = _curry10(2, (patterns, reg) => {
  const rows = _Array_flatMap((p) => map5((alt) => [toMP(alt)], explodePat(p)), patterns);
  return match9(useful(rows, 1, reg, 20000)).with({ _tag: "UFuel" }, () => ExFuel).with({ _tag: "UNone" }, () => ExOk).with({ _tag: "USome" }, ({ row }) => ExWitness(_Option_unwrapOr5(MWild, _Array_head2(row)))).exhaustive();
});

var checkErr = _curry11(2, (message, sp) => ({ message, start: sp.start, end: sp.end }));
var firstSomeFrom = _curry11(3, (f, xs, i0) => {
  let i = i0;
  while (true) {
    const _step = match10(_Array_get8(i, xs)).with({ _tag: "None" }, () => _done5(None10)).with({ _tag: "Some" }, ({ value: x }) => match10(f(x)).with({ _tag: "Some" }, ({ value: e }) => _done5(Some10(e))).with({ _tag: "None" }, () => _recur5(i + 1)).exhaustive()).exhaustive();
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var firstSome = _curry11(2, (f, xs) => firstSomeFrom(f, xs, 0));
var allOfFrom = _curry11(3, (f, xs, i0) => {
  let i = i0;
  while (true) {
    const _step = match10(_Array_get8(i, xs)).with({ _tag: "None" }, () => _done5(true)).with({ _tag: "Some" }, ({ value: x }) => f(x) ? _recur5(i + 1) : _done5(false)).exhaustive();
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var allOf = _curry11(2, (f, xs) => allOfFrom(f, xs, 0));
var someOfFrom2 = _curry11(3, (f, xs, i0) => {
  let i = i0;
  while (true) {
    const _step = match10(_Array_get8(i, xs)).with({ _tag: "None" }, () => _done5(false)).with({ _tag: "Some" }, ({ value: x }) => f(x) ? _done5(true) : _recur5(i + 1)).exhaustive();
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var someOf2 = _curry11(2, (f, xs) => someOfFrom2(f, xs, 0));
var exprSpan2 = (e) => match10(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var patSpan2 = (p) => match10(p).with({ _tag: "PWild" }, ({ span: sp }) => sp).with({ _tag: "PUnit" }, ({ span: sp }) => sp).with({ _tag: "PBind" }, ({ span: sp }) => sp).with({ _tag: "PAs" }, ({ span: sp }) => sp).with({ _tag: "PLit" }, ({ span: sp }) => sp).with({ _tag: "PBool" }, ({ span: sp }) => sp).with({ _tag: "PStr" }, ({ span: sp }) => sp).with({ _tag: "PTuple" }, ({ span: sp }) => sp).with({ _tag: "PRecord" }, ({ span: sp }) => sp).with({ _tag: "PCtor" }, ({ span: sp }) => sp).with({ _tag: "PArr" }, ({ span: sp }) => sp).with({ _tag: "PList" }, ({ span: sp }) => sp).with({ _tag: "POr" }, ({ span: sp }) => sp).exhaustive();
var isCatchAll = (p) => match10(p).with({ _tag: "PWild" }, () => true).with({ _tag: "PUnit" }, () => true).with({ _tag: "PBind" }, () => true).with({ _tag: "PAs" }, ({ pat }) => isCatchAll(pat)).with({ _tag: "PRecord" }, ({ fields }) => allOf((f) => isCatchAll(f.pat), fields)).with({ _tag: "PTuple" }, ({ elems }) => allOf(isCatchAll, elems)).with({ _tag: "PArr" }, ({ elems, rest }) => and7(eq10(length9(elems), 0), _Option_isSome2(rest))).with({ _tag: "PList" }, ({ elems, rest }) => and7(eq10(length9(elems), 0), _Option_isSome2(rest))).otherwise(() => false);
var isPList = (p) => match10(p).with({ _tag: "PList" }, () => true).otherwise(() => false);
var isPCtor = (p) => match10(p).with({ _tag: "PCtor" }, () => true).otherwise(() => false);
var ctorNameOf = (p) => match10(p).with({ _tag: "PCtor" }, ({ ctor: name }) => name).otherwise(() => "");
var patCtorKey = _curry11(2, (ctor, ns) => match10(ns).with({ _tag: "Some" }, ({ value: alias }) => `${alias}.${ctor}`).with({ _tag: "None" }, () => ctor).exhaustive());
var seqElemsRest = (p) => match10(p).with({ _tag: "PArr" }, ({ elems, rest }) => Some10(_tuple5(elems, rest))).with({ _tag: "PList" }, ({ elems, rest }) => Some10(_tuple5(elems, rest))).otherwise(() => None10);
var checkPattern = _curry11(3, (p, reg, top) => match10(p).with({ _tag: "PAs" }, ({ pat }) => checkPattern(pat, reg, top)).with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) => ((key) => match10(_Map_get4(key, reg.ctors)).with({ _tag: "None" }, () => Some10(checkErr(`unknown constructor '${key}'`, sp))).with({ _tag: "Some" }, ({ value: info }) => eq10(length9(args), info.arity) ? firstSome((a) => checkPattern(a, reg, false), args) : Some10(checkErr(`constructor '${ctor}' expects ${show5(info.arity)} arg(s), got ${show5(length9(args))}`, sp))).exhaustive())(patCtorKey(ctor, ns))).with({ _tag: "PRecord" }, ({ fields }) => firstSome((f) => checkPattern(f.pat, reg, false), fields)).with({ _tag: "PTuple" }, ({ elems }) => firstSome((el) => checkPattern(el, reg, false), elems)).with({ _tag: "PArr" }, ({ elems, rest }) => _Option_orElse(match10(rest).with({ _tag: "Some" }, ({ value: r }) => checkPattern(r, reg, false)).with({ _tag: "None" }, () => None10).exhaustive(), firstSome((el) => checkPattern(el, reg, false), elems))).with({ _tag: "PList" }, ({ elems, rest, span: sp }) => top ? _Option_orElse(match10(rest).with({ _tag: "Some" }, ({ value: r }) => checkPattern(r, reg, false)).with({ _tag: "None" }, () => None10).exhaustive(), firstSome((el) => checkPattern(el, reg, false), elems)) : Some10(checkErr("lazy-List pattern cannot nest inside another pattern (matching pulls from the sequence)", sp))).with({ _tag: "POr" }, ({ alts, span: sp }) => checkOrPattern(alts, sp, reg)).otherwise(() => None10));
var binderPathsArgs = _curry11(4, (args, i, at, acc) => match10(_Array_get8(i, args)).with({ _tag: "None" }, () => Ok8(acc)).with({ _tag: "Some" }, ({ value: a }) => _Result_flatMap6((acc2) => binderPathsArgs(args, i + 1, at, acc2), binderPaths(a, `${at}.a${show5(i)}`, acc))).exhaustive());
var binderPathsFields = _curry11(4, (fields, i, at, acc) => match10(_Array_get8(i, fields)).with({ _tag: "None" }, () => Ok8(acc)).with({ _tag: "Some" }, ({ value: f }) => _Result_flatMap6((acc2) => binderPathsFields(fields, i + 1, at, acc2), binderPaths(f.pat, `${at}.${f.label}`, acc))).exhaustive());
var binderPathsElems = _curry11(4, (elems, i, at, acc) => match10(_Array_get8(i, elems)).with({ _tag: "None" }, () => Ok8(acc)).with({ _tag: "Some" }, ({ value: e }) => _Result_flatMap6((acc2) => binderPathsElems(elems, i + 1, at, acc2), binderPaths(e, `${at}.t${show5(i)}`, acc))).exhaustive());
var binderPaths = _curry11(3, (p, at, acc) => match10(p).with({ _tag: "PAs" }, ({ pat, name, nameSpan: nameSp }) => _Result_flatMap6((acc1) => _Map_has2(name, acc1) ? Err7(checkErr(`pattern binds '${name}' more than once`, nameSp)) : Ok8(_Map_set3(name, at, acc1)), binderPaths(pat, at, acc))).with({ _tag: "PBind" }, ({ name, span: sp }) => _Map_has2(name, acc) ? Err7(checkErr(`pattern binds '${name}' more than once`, sp)) : Ok8(_Map_set3(name, at, acc))).with({ _tag: "PCtor" }, ({ args }) => binderPathsArgs(args, 0, at, acc)).with({ _tag: "PRecord" }, ({ fields }) => binderPathsFields(fields, 0, at, acc)).with({ _tag: "PTuple" }, ({ elems }) => binderPathsElems(elems, 0, at, acc)).otherwise(() => Ok8(acc)));
var altMapsFrom = _curry11(4, (alts, i, reg, acc) => match10(_Array_get8(i, alts)).with({ _tag: "None" }, () => Ok8(acc)).with({ _tag: "Some" }, ({ value: alt }) => isCatchAll(alt) ? Err7(checkErr("an or-pattern alternative can't be a catch-all (`_` or a bare binding)", patSpan2(alt))) : _Option_isSome2(seqElemsRest(alt)) ? Err7(checkErr("array/list patterns can't appear as an or-pattern alternative", patSpan2(alt))) : match10(checkPattern(alt, reg, false)).with({ _tag: "Some" }, ({ value: e }) => Err7(e)).with({ _tag: "None" }, () => _Result_flatMap6((m) => altMapsFrom(alts, i + 1, reg, _Array_append7(m, acc)), binderPaths(alt, "", new Map))).exhaustive()).exhaustive());
var missingNameErr = _curry11(2, (name, sp) => checkErr(`or-pattern alternatives must bind the same names ('${name}' is missing in an alternative)`, sp));
var consistentBindsFrom = _curry11(4, (maps, i, ref, sp) => match10(_Array_get8(i, maps)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: m }) => _Option_orElse(consistentBindsFrom(maps, i + 1, ref, sp), _Option_orElse(firstSome((name) => _Map_has2(name, ref) ? eq10(_Map_getOr2("", name, ref), _Map_getOr2("", name, m)) ? None10 : Some10(checkErr(`or-pattern binds '${name}' at a differing position across alternatives`, sp)) : Some10(missingNameErr(name, sp)), _Map_keys3(m)), firstSome((name) => _Map_has2(name, m) ? None10 : Some10(missingNameErr(name, sp)), _Map_keys3(ref))))).exhaustive());
var checkOrPattern = _curry11(3, (alts, sp, reg) => match10(altMapsFrom(alts, 0, reg, [])).with({ _tag: "Err" }, ({ error: e }) => Some10(e)).with({ _tag: "Ok" }, ({ value: maps }) => match10(_Array_head3(maps)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: ref }) => consistentBindsFrom(maps, 1, ref, sp)).exhaustive()).exhaustive());
var armUnguardedCatchAll = (a) => and7(isCatchAll(a.pattern), _Option_isNone(a.guard));
var guardErrs = _curry11(2, (arms, listSwitch) => firstSome((a) => match10(a.guard).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: g }) => or5(isPList(a.pattern), listSwitch) ? Some10(checkErr("`when` guards are unsupported in a lazy-List switch (matching pulls from the sequence)", exprSpan2(g))) : None10).exhaustive(), arms));
var firstCatchIdx = _curry11(2, (arms, i0) => {
  let i = i0;
  while (true) {
    const _step = match10(_Array_get8(i, arms)).with({ _tag: "None" }, () => _done5(None10)).with({ _tag: "Some" }, ({ value: a }) => armUnguardedCatchAll(a) ? _done5(Some10(i)) : _recur5(i + 1)).exhaustive();
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var unreachableAfterCatch = (arms) => match10(firstCatchIdx(arms, 0)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: i }) => match10(_Array_get8(i + 1, arms)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: a }) => Some10(checkErr("unreachable arm: a catch-all arm above it matches first", patSpan2(a.pattern)))).exhaustive()).exhaustive();
var SeqNotSeq = { _tag: "SeqNotSeq" };
var SeqTotal = { _tag: "SeqTotal" };
var SeqFail = (e) => ({ _tag: "SeqFail", e });
var checkSeqExhaustive = _curry11(2, (arms, mSpan) => {
  const seqs = map6((a) => a.pattern, filter3((a) => and7(_Option_isNone(a.guard), _Option_isSome2(seqElemsRest(a.pattern))), arms));
  return eq10(length9(seqs), 0) ? SeqNotSeq : ((hasEmpty) => ((hasCons) => and7(hasEmpty, hasCons) ? SeqTotal : SeqFail(checkErr("non-exhaustive list switch: cover `[]` and `[x, ...xs]` (or add `_`)", mSpan)))(someOf2((p) => match10(seqElemsRest(p)).with((_v) => {
    const _g = _v;
    return _g._tag === "Some";
  }, ({ value: [elems, rest] }) => and7(eq10(length9(elems), 1), _Option_isSome2(rest))).with({ _tag: "None" }, () => false).exhaustive(), seqs)))(someOf2((p) => match10(seqElemsRest(p)).with((_v) => {
    const _g = _v;
    return _g._tag === "Some";
  }, ({ value: [elems, rest] }) => and7(eq10(length9(elems), 0), _Option_isNone(rest))).with({ _tag: "None" }, () => false).exhaustive(), seqs));
});
var ctorLoop = _curry11(5, (arms, i, reg, owner, covered) => match10(_Array_get8(i, arms)).with({ _tag: "None" }, () => Ok8(_tuple5(owner, covered))).with({ _tag: "Some" }, ({ value: a }) => match10(a.pattern).with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) => ((key) => match10(_Map_get4(key, reg.ctors)).with({ _tag: "None" }, () => Err7(checkErr(`unknown constructor '${key}'`, sp))).with({ _tag: "Some" }, ({ value: info }) => not6(eq10(length9(args), info.arity)) ? Err7(checkErr(`constructor '${ctor}' expects ${show5(info.arity)} arg(s), got ${show5(length9(args))}`, sp)) : match10(owner).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && (({ value: own }) => not6(eq10(own, info.owner)))(_g);
}, ({ value: own }) => Err7(checkErr(`switch mixes variants of '${own}' and '${info.owner}'`, sp))).otherwise(() => ((covered2) => ctorLoop(arms, i + 1, reg, Some10(info.owner), covered2))(and7(allOf(isCatchAll, args), _Option_isNone(a.guard)) ? _Set_add(ctor, covered) : covered))).exhaustive())(patCtorKey(ctor, ns))).otherwise(() => ctorLoop(arms, i + 1, reg, owner, covered))).exhaustive());
var seqVerdict = _curry11(2, (arms, mSpan) => match10(checkSeqExhaustive(arms, mSpan)).with({ _tag: "SeqTotal" }, () => None10).with({ _tag: "SeqFail" }, ({ e }) => Some10(e)).with({ _tag: "SeqNotSeq" }, () => None10).exhaustive());
var unguardedPatterns = (arms) => _Array_flatMap2((a) => _Option_isNone(a.guard) ? [a.pattern] : [], arms);
var namedUnguarded = (leaves) => _Set_fromArray(_Array_flatMap2((a) => and7(isPCtor(a.pattern), _Option_isNone(a.guard)) ? [ctorNameOf(a.pattern)] : [], leaves));
var matrixVerdict = _curry11(5, (arms, leaves, ownerOpt, mSpan, reg) => match10(checkExhaustiveM(unguardedPatterns(arms), reg)).with({ _tag: "ExOk" }, () => None10).with({ _tag: "ExFuel" }, () => Some10(checkErr("switch too complex to prove exhaustive \u2014 add a `_` catch-all arm", mSpan))).with({ _tag: "ExWitness" }, ({ witness: w }) => ((own) => ((named) => ((absent) => and7(and7(isWideWitnessM(w), not6(eq10(own, ""))), length9(absent) > 0) ? Some10(checkErr(`non-exhaustive switch on '${own}': missing ${_Str_join4(", ", absent)}`, mSpan)) : Some10(checkErr(`non-exhaustive switch: '${showWitness(w)}' is not matched`, mSpan)))(filter3((c) => not6(_Set_has(c, named)), _Map_getOr2([], own, reg.types))))(namedUnguarded(leaves)))(_Option_unwrapOr6("", ownerOpt))).exhaustive());
var leavesOfArm = (a) => match10(a.pattern).with({ _tag: "POr" }, ({ alts }) => map6((alt) => ({ pattern: alt, guard: a.guard }), alts)).otherwise(() => [{ pattern: a.pattern, guard: a.guard }]);
var checkMatch = _curry11(3, (arms, mSpan, reg) => match10(firstSome((a) => checkPattern(a.pattern, reg, true), arms)).with({ _tag: "Some" }, ({ value: e }) => Some10(e)).with({ _tag: "None" }, () => ((listSwitch) => match10(guardErrs(arms, listSwitch)).with({ _tag: "Some" }, ({ value: e }) => Some10(e)).with({ _tag: "None" }, () => match10(unreachableAfterCatch(arms)).with({ _tag: "Some" }, ({ value: e }) => Some10(e)).with({ _tag: "None" }, () => ((hasCatchAll) => ((leaves) => ((ctorArms) => someOf2((a) => isPList(a.pattern), arms) ? hasCatchAll ? None10 : seqVerdict(arms, mSpan) : match10(ctorLoop(ctorArms, 0, reg, None10, _Set_fromArray([]))).with({ _tag: "Err" }, ({ error: e }) => Some10(e)).with((_v) => {
  const _g = _v;
  return _g._tag === "Ok";
}, ({ value: [ownerOpt] }) => matrixVerdict(arms, leaves, ownerOpt, mSpan, reg)).exhaustive())(filter3((a) => isPCtor(a.pattern), leaves)))(_Array_flatMap2(leavesOfArm, arms)))(someOf2(armUnguardedCatchAll, arms))).exhaustive()).exhaustive())(someOf2((a) => and7(isPList(a.pattern), not6(isCatchAll(a.pattern))), arms))).exhaustive());
var checkExpr = _curry11(2, (e, reg) => match10(e).with({ _tag: "ENum" }, () => None10).with({ _tag: "EUnit" }, () => None10).with({ _tag: "EBool" }, () => None10).with({ _tag: "EStr" }, () => None10).with({ _tag: "ERef" }, () => None10).with({ _tag: "ECall" }, ({ fn, args }) => _Option_orElse(firstSome((a) => checkExpr(a, reg), args), checkExpr(fn, reg))).with({ _tag: "ELambda" }, ({ body }) => checkExpr(body, reg)).with({ _tag: "ELetIn" }, ({ value, body }) => _Option_orElse(checkExpr(body, reg), checkExpr(value, reg))).with({ _tag: "ELetBind" }, ({ value, body }) => _Option_orElse(checkExpr(body, reg), checkExpr(value, reg))).with({ _tag: "EPipe" }, ({ left, right }) => _Option_orElse(checkExpr(right, reg), checkExpr(left, reg))).with({ _tag: "EDo" }, ({ exprs }) => firstSome((x) => checkExpr(x, reg), exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => _Option_orElse(checkExpr(elseE, reg), _Option_orElse(checkExpr(thenE, reg), checkExpr(cond, reg)))).with({ _tag: "EMatch" }, ({ scrutinee, arms, span: sp }) => _Option_orElse(checkMatch(arms, sp, reg), _Option_orElse(firstSome((a) => _Option_orElse(checkExpr(a.body, reg), match10(a.guard).with({ _tag: "Some" }, ({ value: g }) => checkExpr(g, reg)).with({ _tag: "None" }, () => None10).exhaustive()), arms), checkExpr(scrutinee, reg)))).with({ _tag: "ERecord" }, ({ fields, spread }) => _Option_orElse(firstSome((f) => checkExpr(f.value, reg), fields), match10(spread).with({ _tag: "Some" }, ({ value: s }) => checkExpr(s, reg)).with({ _tag: "None" }, () => None10).exhaustive())).with({ _tag: "EField" }, ({ target }) => checkExpr(target, reg)).with({ _tag: "ELoop" }, ({ params, body }) => _Option_orElse(checkExpr(body, reg), firstSome((p) => checkExpr(p.init, reg), params))).with({ _tag: "ERecur" }, ({ args }) => firstSome((a) => checkExpr(a, reg), args)).with({ _tag: "ETuple" }, ({ elements }) => firstSome((el) => checkExpr(el, reg), elements)).with({ _tag: "EArr" }, ({ elements }) => firstSome((el) => checkExpr(match10(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive(), reg), elements)).with({ _tag: "EList" }, ({ elements }) => firstSome((el) => checkExpr(match10(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive(), reg), elements)).with({ _tag: "ESet" }, ({ elements }) => firstSome((el) => checkExpr(match10(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive(), reg), elements)).with({ _tag: "EMap" }, ({ entries }) => firstSome((en) => _Option_orElse(checkExpr(en.value, reg), checkExpr(en.key, reg)), entries)).with({ _tag: "EInterp" }, ({ parts }) => firstSome((p) => match10(p).with({ _tag: "IPLit" }, () => None10).with({ _tag: "IPExpr" }, ({ expr: ex }) => checkExpr(ex, reg)).exhaustive(), parts)).exhaustive());
var checkExprs = _curry11(2, (e, reg) => match10(e).with({ _tag: "ENum" }, () => []).with({ _tag: "EUnit" }, () => []).with({ _tag: "EBool" }, () => []).with({ _tag: "EStr" }, () => []).with({ _tag: "ERef" }, () => []).with({ _tag: "ECall" }, ({ fn, args }) => [...checkExprs(fn, reg), ..._Array_flatMap2((a) => checkExprs(a, reg), args)]).with({ _tag: "ELambda" }, ({ body }) => checkExprs(body, reg)).with({ _tag: "ELetIn" }, ({ value, body }) => [...checkExprs(value, reg), ...checkExprs(body, reg)]).with({ _tag: "ELetBind" }, ({ value, body }) => [...checkExprs(value, reg), ...checkExprs(body, reg)]).with({ _tag: "EPipe" }, ({ left, right }) => [...checkExprs(left, reg), ...checkExprs(right, reg)]).with({ _tag: "EDo" }, ({ exprs }) => _Array_flatMap2((x) => checkExprs(x, reg), exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => [...checkExprs(cond, reg), ...checkExprs(thenE, reg), ...checkExprs(elseE, reg)]).with({ _tag: "EMatch" }, ({ scrutinee, arms, span: sp }) => [...checkExprs(scrutinee, reg), ..._Array_flatMap2((a) => [...match10(a.guard).with({ _tag: "Some" }, ({ value: g }) => checkExprs(g, reg)).with({ _tag: "None" }, () => []).exhaustive(), ...checkExprs(a.body, reg)], arms), ...match10(checkMatch(arms, sp, reg)).with({ _tag: "Some" }, ({ value: e2 }) => [e2]).with({ _tag: "None" }, () => []).exhaustive()]).with({ _tag: "ERecord" }, ({ fields, spread }) => [...match10(spread).with({ _tag: "Some" }, ({ value: s }) => checkExprs(s, reg)).with({ _tag: "None" }, () => []).exhaustive(), ..._Array_flatMap2((f) => checkExprs(f.value, reg), fields)]).with({ _tag: "EField" }, ({ target }) => checkExprs(target, reg)).with({ _tag: "ELoop" }, ({ params, body }) => [..._Array_flatMap2((p) => checkExprs(p.init, reg), params), ...checkExprs(body, reg)]).with({ _tag: "ERecur" }, ({ args }) => _Array_flatMap2((a) => checkExprs(a, reg), args)).with({ _tag: "ETuple" }, ({ elements }) => _Array_flatMap2((el) => checkExprs(el, reg), elements)).with({ _tag: "EArr" }, ({ elements }) => _Array_flatMap2((el) => match10(el).with({ _tag: "SEExpr" }, ({ expr: value }) => checkExprs(value, reg)).with({ _tag: "SESpread" }, ({ expr: value }) => checkExprs(value, reg)).exhaustive(), elements)).with({ _tag: "EList" }, ({ elements }) => _Array_flatMap2((el) => match10(el).with({ _tag: "SEExpr" }, ({ expr: value }) => checkExprs(value, reg)).with({ _tag: "SESpread" }, ({ expr: value }) => checkExprs(value, reg)).exhaustive(), elements)).with({ _tag: "ESet" }, ({ elements }) => _Array_flatMap2((el) => match10(el).with({ _tag: "SEExpr" }, ({ expr: value }) => checkExprs(value, reg)).with({ _tag: "SESpread" }, ({ expr: value }) => checkExprs(value, reg)).exhaustive(), elements)).with({ _tag: "EMap" }, ({ entries }) => _Array_flatMap2((entry) => [...checkExprs(entry.key, reg), ...checkExprs(entry.value, reg)], entries)).with({ _tag: "EInterp" }, ({ parts }) => _Array_flatMap2((part) => match10(part).with({ _tag: "IPLit" }, () => []).with({ _tag: "IPExpr" }, ({ expr: value }) => checkExprs(value, reg)).exhaustive(), parts)).exhaustive());
var reservedNames = ["Array", "List", "Set", "Map", "Option", "Result", "Str"];
var redeclarableTypes = ["Option", "Result"];
var reservedErr = _curry11(2, (name, sp) => checkErr(`'${name}' is a reserved collection namespace and cannot be bound`, sp));
var checkReservedNames = (stmts) => firstSome((s) => match10(s).with({ _tag: "SType" }, ({ name, span: sp }) => _Array_contains2(name, redeclarableTypes) ? None10 : _Array_contains2(name, reservedNames) ? Some10(reservedErr(name, sp)) : None10).with({ _tag: "SLet" }, ({ name, span: sp }) => _Array_contains2(name, reservedNames) ? Some10(reservedErr(name, sp)) : None10).with({ _tag: "SExtern" }, ({ name, span: sp }) => _Array_contains2(name, reservedNames) ? Some10(reservedErr(name, sp)) : None10).with({ _tag: "SImport" }, ({ names }) => firstSome((n) => _Array_contains2(n.name, reservedNames) ? Some10(checkErr(`'${n.name}' is a reserved collection namespace and cannot be imported`, n.span)) : None10, names)).with({ _tag: "SImportNs" }, ({ alias }) => _Array_contains2(alias.name, reservedNames) ? Some10(checkErr(`'${alias.name}' is a reserved collection namespace and cannot be imported`, alias.span)) : None10).with({ _tag: "SError" }, () => None10).with({ _tag: "SExpr" }, () => None10).exhaustive(), stmts);
var checkReservedNamesAll = (stmts) => _Array_flatMap2((s) => match10(s).with({ _tag: "SType" }, ({ name, span: sp }) => _Array_contains2(name, redeclarableTypes) ? [] : _Array_contains2(name, reservedNames) ? [reservedErr(name, sp)] : []).with({ _tag: "SLet" }, ({ name, span: sp }) => _Array_contains2(name, reservedNames) ? [reservedErr(name, sp)] : []).with({ _tag: "SExtern" }, ({ name, span: sp }) => _Array_contains2(name, reservedNames) ? [reservedErr(name, sp)] : []).with({ _tag: "SImport" }, ({ names }) => _Array_flatMap2((n) => _Array_contains2(n.name, reservedNames) ? [checkErr(`'${n.name}' is a reserved collection namespace and cannot be imported`, n.span)] : [], names)).with({ _tag: "SImportNs" }, ({ alias }) => _Array_contains2(alias.name, reservedNames) ? [checkErr(`'${alias.name}' is a reserved collection namespace and cannot be imported`, alias.span)] : []).otherwise(() => []), stmts);
var jsReserved = ["break", "case", "catch", "class", "const", "continue", "debugger", "default", "delete", "do", "else", "enum", "export", "extends", "false", "finally", "for", "function", "if", "import", "in", "instanceof", "new", "null", "return", "super", "switch", "this", "throw", "true", "try", "typeof", "var", "void", "while", "with", "yield", "let", "static", "implements", "interface", "package", "private", "protected", "public", "await"];
var reservedWord = _curry11(2, (name, sp) => _Array_contains2(name, jsReserved) ? [checkErr(`'${name}' is a JavaScript reserved word and can't be used as a binding name; rename it`, sp)] : []);
var typeExprSpan = (te) => match10(te).with({ _tag: "TyName" }, ({ span: sp }) => sp).with({ _tag: "TyArrow" }, ({ span: sp }) => sp).with({ _tag: "TyApp" }, ({ span: sp }) => sp).with({ _tag: "TyTuple" }, ({ span: sp }) => sp).with({ _tag: "TyList" }, ({ span: sp }) => sp).with({ _tag: "TyQual" }, ({ span: sp }) => sp).with({ _tag: "TyLit" }, ({ span: sp }) => sp).with({ _tag: "TyUnion" }, ({ span: sp }) => sp).exhaustive();
var checkReservedParam = _curry11(2, (param, sp) => match10(param).with({ _tag: "LPName" }, ({ name }) => reservedWord(name, sp)).with({ _tag: "LPRecord" }, ({ fields }) => _Array_flatMap2((name) => reservedWord(name, sp), fields)).with({ _tag: "LPTuple" }, ({ names }) => _Array_flatMap2((name) => reservedWord(name, sp), names)).with({ _tag: "LPLabeled" }, ({ name, defaultValue }) => [...reservedWord(name, sp), ...match10(defaultValue).with({ _tag: "Some" }, ({ value }) => checkReservedExpr(value)).with({ _tag: "None" }, () => []).exhaustive()]).with({ _tag: "LPSpanned" }, ({ param: inner }) => checkReservedParam(inner, sp)).exhaustive());
var checkReservedPattern = (pat) => match10(pat).with({ _tag: "PAs" }, ({ pat: inner, name, nameSpan: nameSp }) => [...checkReservedPattern(inner), ...reservedWord(name, nameSp)]).with({ _tag: "PBind" }, ({ name, span: sp }) => reservedWord(name, sp)).with({ _tag: "PTuple" }, ({ elems }) => _Array_flatMap2(checkReservedPattern, elems)).with({ _tag: "PRecord" }, ({ fields }) => _Array_flatMap2((field) => checkReservedPattern(field.pat), fields)).with({ _tag: "PCtor" }, ({ args }) => _Array_flatMap2(checkReservedPattern, args)).with({ _tag: "PArr" }, ({ elems, rest }) => [..._Array_flatMap2(checkReservedPattern, elems), ...match10(rest).with({ _tag: "Some" }, ({ value }) => checkReservedPattern(value)).with({ _tag: "None" }, () => []).exhaustive()]).with({ _tag: "PList" }, ({ elems, rest }) => [..._Array_flatMap2(checkReservedPattern, elems), ...match10(rest).with({ _tag: "Some" }, ({ value }) => checkReservedPattern(value)).with({ _tag: "None" }, () => []).exhaustive()]).with({ _tag: "POr" }, ({ alts }) => _Array_flatMap2(checkReservedPattern, alts)).otherwise(() => []);
var checkReservedSeqElem = (el) => match10(el).with({ _tag: "SEExpr" }, ({ expr: value }) => checkReservedExpr(value)).with({ _tag: "SESpread" }, ({ expr: value }) => checkReservedExpr(value)).exhaustive();
var checkReservedExpr = (expr) => match10(expr).with({ _tag: "ECall" }, ({ fn, args }) => [...checkReservedExpr(fn), ..._Array_flatMap2(checkReservedExpr, args)]).with({ _tag: "ELambda" }, ({ params, body, span: sp }) => [..._Array_flatMap2((param) => checkReservedParam(param, sp), params), ...checkReservedExpr(body)]).with({ _tag: "ELetIn" }, ({ name, nameSpan: nameSp, value, body }) => [...reservedWord(name, nameSp), ...checkReservedExpr(value), ...checkReservedExpr(body)]).with({ _tag: "ELetBind" }, ({ param, paramSpan: paramSp, value, body }) => [...checkReservedParam(param, paramSp), ...checkReservedExpr(value), ...checkReservedExpr(body)]).with({ _tag: "EPipe" }, ({ left, right }) => [...checkReservedExpr(left), ...checkReservedExpr(right)]).with({ _tag: "EDo" }, ({ exprs }) => _Array_flatMap2(checkReservedExpr, exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => [...checkReservedExpr(cond), ...checkReservedExpr(thenE), ...checkReservedExpr(elseE)]).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => [...checkReservedExpr(scrutinee), ..._Array_flatMap2((arm) => [...checkReservedPattern(arm.pattern), ...match10(arm.guard).with({ _tag: "Some" }, ({ value: guard }) => checkReservedExpr(guard)).with({ _tag: "None" }, () => []).exhaustive(), ...checkReservedExpr(arm.body)], arms)]).with({ _tag: "ERecord" }, ({ fields, spread }) => [...match10(spread).with({ _tag: "Some" }, ({ value }) => checkReservedExpr(value)).with({ _tag: "None" }, () => []).exhaustive(), ..._Array_flatMap2((field) => checkReservedExpr(field.value), fields)]).with({ _tag: "EField" }, ({ target }) => checkReservedExpr(target)).with({ _tag: "ELoop" }, ({ params, body }) => [..._Array_flatMap2((param) => reservedWord(param.name, param.nameSpan), params), ..._Array_flatMap2((param) => checkReservedExpr(param.init), params), ...checkReservedExpr(body)]).with({ _tag: "ERecur" }, ({ args }) => _Array_flatMap2(checkReservedExpr, args)).with({ _tag: "ETuple" }, ({ elements }) => _Array_flatMap2(checkReservedExpr, elements)).with({ _tag: "EArr" }, ({ elements }) => _Array_flatMap2(checkReservedSeqElem, elements)).with({ _tag: "EList" }, ({ elements }) => _Array_flatMap2(checkReservedSeqElem, elements)).with({ _tag: "ESet" }, ({ elements }) => _Array_flatMap2(checkReservedSeqElem, elements)).with({ _tag: "EMap" }, ({ entries }) => _Array_flatMap2((entry) => [...checkReservedExpr(entry.key), ...checkReservedExpr(entry.value)], entries)).with({ _tag: "EInterp" }, ({ parts }) => _Array_flatMap2((part) => match10(part).with({ _tag: "IPLit" }, () => []).with({ _tag: "IPExpr" }, ({ expr: value }) => checkReservedExpr(value)).exhaustive(), parts)).otherwise(() => []);
var checkReservedWordsAll = (stmts) => _Array_flatMap2((stmt) => match10(stmt).with({ _tag: "SLet" }, ({ name, nameSpan: nameSp, value }) => [...reservedWord(name, nameSp), ...checkReservedExpr(value)]).with({ _tag: "SExpr" }, ({ value }) => checkReservedExpr(value)).with({ _tag: "SExtern" }, ({ name, nameSpan: nameSp }) => reservedWord(name, nameSp)).with({ _tag: "SType" }, ({ ctors }) => _Array_flatMap2((ctor) => _Array_flatMap2((field) => match10(field.name).with({ _tag: "Some" }, ({ value: name }) => reservedWord(name, typeExprSpan(field.fieldType))).with({ _tag: "None" }, () => []).exhaustive(), ctor.fields), ctors)).otherwise(() => []), stmts);
var checkReservedWords = (stmts) => _Array_head3(checkReservedWordsAll(stmts));
var isUpperStart = (s) => match10(_Str_codeAt4(0, s)).with({ _tag: "Some" }, ({ value: c }) => and7(c >= 65, c <= 90)).with({ _tag: "None" }, () => false).exhaustive();
var strayTypeVar = _curry11(2, (params, te) => match10(te).with({ _tag: "TyName" }, ({ name, span: sp }) => or5(isUpperStart(name), or5(_Array_contains2(name, primTypeNames), _Array_contains2(name, params))) ? None10 : Some10(_tuple5(name, sp))).with({ _tag: "TyArrow" }, ({ from, to }) => _Option_orElse(strayTypeVar(params, to), strayTypeVar(params, from))).with({ _tag: "TyApp" }, ({ args }) => firstSome(strayTypeVar(params), args)).with({ _tag: "TyTuple" }, ({ elems }) => firstSome(strayTypeVar(params), elems)).with({ _tag: "TyList" }, ({ elem }) => strayTypeVar(params, elem)).with({ _tag: "TyQual" }, ({ args }) => firstSome(strayTypeVar(params), args)).with({ _tag: "TyLit" }, () => None10).with({ _tag: "TyUnion" }, ({ members }) => firstSome(strayTypeVar(params), members)).exhaustive());
var checkCtorFieldVars = (stmts) => firstSome((s) => match10(s).with({ _tag: "SType" }, ({ name, params, ctors }) => firstSome((c) => firstSome((f) => match10(strayTypeVar(params, f.fieldType)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some";
}, ({ value: [vn, vsp] }) => Some10(checkErr(`unknown type parameter '${vn}' in constructor '${c.name}' \u2014 declare it: type ${name} ${_Str_join4(" ", _Array_append7(vn, params))} = ...`, vsp))).with({ _tag: "None" }, () => None10).exhaustive(), c.fields), ctors)).otherwise(() => None10), stmts);
var checkCtorFieldVarsAll = (stmts) => _Array_flatMap2((s) => match10(s).with({ _tag: "SType" }, ({ name, params, ctors }) => _Array_flatMap2((c) => _Array_flatMap2((f) => match10(strayTypeVar(params, f.fieldType)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some";
}, ({ value: [vn, vsp] }) => [checkErr(`unknown type parameter '${vn}' in constructor '${c.name}' \u2014 declare it: type ${name} ${_Str_join4(" ", _Array_append7(vn, params))} = ...`, vsp)]).with({ _tag: "None" }, () => []).exhaustive(), c.fields), ctors)).otherwise(() => []), stmts);
var qualRefsFrom = (te) => match10(te).with({ _tag: "TyName" }, () => []).with({ _tag: "TyArrow" }, ({ from, to }) => [...qualRefsFrom(from), ...qualRefsFrom(to)]).with({ _tag: "TyApp" }, ({ args }) => _Array_flatMap2(qualRefsFrom, args)).with({ _tag: "TyTuple" }, ({ elems }) => _Array_flatMap2(qualRefsFrom, elems)).with({ _tag: "TyList" }, ({ elem }) => qualRefsFrom(elem)).with({ _tag: "TyQual" }, ({ alias, name, nameSpan, args, span: sp }) => [{ alias, name, nameSpan, qualSpan: sp }, ..._Array_flatMap2(qualRefsFrom, args)]).with({ _tag: "TyLit" }, () => []).with({ _tag: "TyUnion" }, ({ members }) => _Array_flatMap2(qualRefsFrom, members)).exhaustive();
var letInAnnots = (e) => match10(e).with({ _tag: "ENum" }, () => []).with({ _tag: "EUnit" }, () => []).with({ _tag: "EBool" }, () => []).with({ _tag: "EStr" }, () => []).with({ _tag: "ERef" }, () => []).with({ _tag: "ECall" }, ({ fn, args }) => [...letInAnnots(fn), ..._Array_flatMap2(letInAnnots, args)]).with({ _tag: "ELambda" }, ({ params, body }) => [...letInAnnots(body), ..._Array_flatMap2((p) => match10(p).with((_v) => {
  const _g = _v;
  return _g._tag === "LPSpanned" && _g.param._tag === "LPLabeled" && _g.param.defaultValue._tag === "Some";
}, ({ param: { defaultValue: { value: d } } }) => letInAnnots(d)).with((_v) => {
  const _g = _v;
  return _g._tag === "LPLabeled" && _g.defaultValue._tag === "Some";
}, ({ defaultValue: { value: d } }) => letInAnnots(d)).otherwise(() => []), params)]).with({ _tag: "ELetIn" }, ({ annot, value, body }) => [...letInAnnots(value), ...letInAnnots(body), ...match10(annot).with({ _tag: "Some" }, ({ value: te }) => [te]).with({ _tag: "None" }, () => []).exhaustive()]).with({ _tag: "ELetBind" }, ({ value, body }) => [...letInAnnots(value), ...letInAnnots(body)]).with({ _tag: "EPipe" }, ({ left, right }) => [...letInAnnots(left), ...letInAnnots(right)]).with({ _tag: "EDo" }, ({ exprs }) => _Array_flatMap2(letInAnnots, exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => [...letInAnnots(cond), ...letInAnnots(thenE), ...letInAnnots(elseE)]).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => [...letInAnnots(scrutinee), ..._Array_flatMap2((a) => [...match10(a.guard).with({ _tag: "Some" }, ({ value: g }) => letInAnnots(g)).with({ _tag: "None" }, () => []).exhaustive(), ...letInAnnots(a.body)], arms)]).with({ _tag: "ERecord" }, ({ fields, spread }) => [...match10(spread).with({ _tag: "Some" }, ({ value: sp }) => letInAnnots(sp)).with({ _tag: "None" }, () => []).exhaustive(), ..._Array_flatMap2((f) => letInAnnots(f.value), fields)]).with({ _tag: "EField" }, ({ target }) => letInAnnots(target)).with({ _tag: "ELoop" }, ({ params, body }) => [..._Array_flatMap2((prm) => letInAnnots(prm.init), params), ...letInAnnots(body)]).with({ _tag: "ERecur" }, ({ args }) => _Array_flatMap2(letInAnnots, args)).with({ _tag: "ETuple" }, ({ elements }) => _Array_flatMap2(letInAnnots, elements)).with({ _tag: "EArr" }, ({ elements }) => _Array_flatMap2(seqElemAnnots, elements)).with({ _tag: "EList" }, ({ elements }) => _Array_flatMap2(seqElemAnnots, elements)).with({ _tag: "ESet" }, ({ elements }) => _Array_flatMap2(seqElemAnnots, elements)).with({ _tag: "EMap" }, ({ entries }) => _Array_flatMap2((en) => [...letInAnnots(en.key), ...letInAnnots(en.value)], entries)).with({ _tag: "EInterp" }, ({ parts }) => _Array_flatMap2((prt) => match10(prt).with({ _tag: "IPLit" }, () => []).with({ _tag: "IPExpr" }, ({ expr: ex }) => letInAnnots(ex)).exhaustive(), parts)).exhaustive();
var seqElemAnnots = (el) => match10(el).with({ _tag: "SEExpr" }, ({ expr: e }) => letInAnnots(e)).with({ _tag: "SESpread" }, ({ expr: e }) => letInAnnots(e)).exhaustive();
var writtenTypeExprs = (stmts) => _Array_flatMap2((s) => match10(s).with({ _tag: "SExtern" }, ({ typeExpr: te }) => [te]).with({ _tag: "SLet" }, ({ annot, value }) => [...match10(annot).with({ _tag: "Some" }, ({ value: te }) => [te]).with({ _tag: "None" }, () => []).exhaustive(), ...letInAnnots(value)]).with({ _tag: "SExpr" }, ({ value }) => letInAnnots(value)).with({ _tag: "SType" }, ({ ctors, alias, aliasType }) => [..._Array_flatMap2((c) => map6((f) => f.fieldType, c.fields), ctors), ...match10(alias).with({ _tag: "Some" }, ({ value: fields }) => map6((f) => f.fieldType, fields)).with({ _tag: "None" }, () => []).exhaustive(), ...match10(aliasType).with({ _tag: "Some" }, ({ value: te }) => [te]).with({ _tag: "None" }, () => []).exhaustive()]).otherwise(() => []), stmts);
var emptyQuals = new Map;
var checkQualifiedTypeNames = _curry11(2, (stmts, quals) => {
  const nsAliases = _Set_fromArray(_Array_flatMap2((s) => match10(s).with({ _tag: "SImportNs" }, ({ alias }) => [alias.name]).otherwise(() => []), stmts));
  return firstSome((q) => _Set_has(q.alias, nsAliases) ? match10(_Map_get4(q.alias, quals)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: dep }) => _Set_has(q.name, dep.types) ? None10 : Some10(checkErr(`module alias '${q.alias}' has no exported type '${q.name}' \u2014 export it from the imported module ('export type ${q.name} = \u2026')`, q.nameSpan))).exhaustive() : Some10(checkErr(`unknown module alias '${q.alias}' in type '${q.alias}.${q.name}' \u2014 a qualified type name needs a matching 'import * as ${q.alias} from "\u2026"'`, q.qualSpan)), _Array_flatMap2(qualRefsFrom, writtenTypeExprs(stmts)));
});
var checkQualifiedTypeNamesAll = _curry11(2, (stmts, quals) => {
  const nsAliases = _Set_fromArray(_Array_flatMap2((s) => match10(s).with({ _tag: "SImportNs" }, ({ alias }) => [alias.name]).otherwise(() => []), stmts));
  return _Array_flatMap2((q) => _Set_has(q.alias, nsAliases) ? match10(_Map_get4(q.alias, quals)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: dep }) => _Set_has(q.name, dep.types) ? [] : [checkErr(`module alias '${q.alias}' has no exported type '${q.name}' \u2014 export it from the imported module ('export type ${q.name} = \u2026')`, q.nameSpan)]).exhaustive() : [checkErr(`unknown module alias '${q.alias}' in type '${q.alias}.${q.name}' \u2014 a qualified type name needs a matching 'import * as ${q.alias} from "\u2026"'`, q.qualSpan)], _Array_flatMap2(qualRefsFrom, writtenTypeExprs(stmts)));
});
var duplicateLoopParam = (params) => {
  let i = 0;
  let seen = _Set_fromArray([]);
  while (true) {
    const _step = match10(_Array_get8(i, params)).with({ _tag: "None" }, () => _done5(None10)).with({ _tag: "Some" }, ({ value: p }) => _Set_has(p.name, seen) ? _done5(Some10(checkErr(`duplicate loop param '${p.name}'`, p.nameSpan))) : _recur5(i + 1, _Set_add(p.name, seen))).exhaustive();
    if (_step._tag === "recur") {
      [i, seen] = _step.args;
      continue;
    }
    return _step.value;
  }
};
var checkLoopDo = _curry11(3, (exprs, frame, tail) => {
  let i = 0;
  while (true) {
    const _step = match10(_Array_get8(i, exprs)).with({ _tag: "None" }, () => _done5(None10)).with({ _tag: "Some" }, ({ value: expr }) => _Option_isNone(_Array_get8(i + 1, exprs)) ? _done5(checkLoopExpr(expr, frame, tail)) : match10(checkLoopExpr(expr, frame, false)).with({ _tag: "Some" }, ({ value: error }) => _done5(Some10(error))).with({ _tag: "None" }, () => _recur5(i + 1)).exhaustive()).exhaustive();
    if (_step._tag === "recur") {
      i = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var checkLoopExpr = _curry11(3, (e, frame, tail) => match10(e).with({ _tag: "ELoop" }, ({ params, body }) => _Option_orElse(checkLoopExpr(body, Some10({ arity: length9(params), names: _Set_fromArray(map6((p) => p.name, params)) }), true), _Option_orElse(firstSome((p) => checkLoopExpr(p.init, frame, false), params), duplicateLoopParam(params)))).with({ _tag: "ERecur" }, ({ args, span: sp }) => match10(frame).with({ _tag: "None" }, () => Some10(checkErr("'recur' is only legal inside a loop body", sp))).with({ _tag: "Some" }, ({ value: current }) => not6(tail) ? Some10(checkErr("'recur' must be in tail position of its enclosing loop", sp)) : not6(eq10(length9(args), current.arity)) ? Some10(checkErr(`'recur' takes ${show5(current.arity)} argument${eq10(current.arity, 1) ? "" : "s"} (one per loop param), got ${show5(length9(args))}`, sp)) : firstSome((a) => checkLoopExpr(a, frame, false), args)).exhaustive()).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => _Option_orElse(checkLoopExpr(elseE, frame, tail), _Option_orElse(checkLoopExpr(thenE, frame, tail), checkLoopExpr(cond, frame, false)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => _Option_orElse(firstSome((arm) => match10(arm.guard).with({ _tag: "Some" }, ({ value: guard }) => _Option_orElse(checkLoopExpr(arm.body, frame, tail), checkLoopExpr(guard, frame, false))).with({ _tag: "None" }, () => checkLoopExpr(arm.body, frame, tail)).exhaustive(), arms), checkLoopExpr(scrutinee, frame, false))).with({ _tag: "ELetIn" }, ({ name, nameSpan: nameSp, value, body }) => _Option_orElse(checkLoopExpr(body, frame, tail), _Option_orElse(match10(frame).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && (({ value: current }) => _Set_has(name, current.names))(_g);
}, ({ value: current }) => Some10(checkErr(`'${name}' shadows a loop param inside the loop body; rename it`, nameSp))).otherwise(() => None10), checkLoopExpr(value, frame, false)))).with({ _tag: "ELetBind" }, ({ value, body }) => _Option_orElse(checkLoopExpr(body, None10, false), checkLoopExpr(value, frame, false))).with({ _tag: "ELambda" }, ({ body }) => checkLoopExpr(body, None10, false)).with({ _tag: "ECall" }, ({ fn, args }) => _Option_orElse(firstSome((a) => checkLoopExpr(a, frame, false), args), checkLoopExpr(fn, frame, false))).with({ _tag: "EPipe" }, ({ left, right }) => _Option_orElse(checkLoopExpr(right, frame, false), checkLoopExpr(left, frame, false))).with({ _tag: "EDo" }, ({ exprs }) => checkLoopDo(exprs, frame, tail)).with({ _tag: "ERecord" }, ({ fields, spread }) => _Option_orElse(firstSome((field) => checkLoopExpr(field.value, frame, false), fields), match10(spread).with({ _tag: "Some" }, ({ value }) => checkLoopExpr(value, frame, false)).with({ _tag: "None" }, () => None10).exhaustive())).with({ _tag: "EField" }, ({ target }) => checkLoopExpr(target, frame, false)).with({ _tag: "ETuple" }, ({ elements }) => firstSome((el) => checkLoopExpr(el, frame, false), elements)).with({ _tag: "EArr" }, ({ elements }) => firstSome((el) => match10(el).with({ _tag: "SEExpr" }, ({ expr: value }) => checkLoopExpr(value, frame, false)).with({ _tag: "SESpread" }, ({ expr: value }) => checkLoopExpr(value, frame, false)).exhaustive(), elements)).with({ _tag: "EList" }, ({ elements }) => firstSome((el) => match10(el).with({ _tag: "SEExpr" }, ({ expr: value }) => checkLoopExpr(value, frame, false)).with({ _tag: "SESpread" }, ({ expr: value }) => checkLoopExpr(value, frame, false)).exhaustive(), elements)).with({ _tag: "ESet" }, ({ elements }) => firstSome((el) => match10(el).with({ _tag: "SEExpr" }, ({ expr: value }) => checkLoopExpr(value, frame, false)).with({ _tag: "SESpread" }, ({ expr: value }) => checkLoopExpr(value, frame, false)).exhaustive(), elements)).with({ _tag: "EMap" }, ({ entries }) => firstSome((entry) => _Option_orElse(checkLoopExpr(entry.value, frame, false), checkLoopExpr(entry.key, frame, false)), entries)).with({ _tag: "EInterp" }, ({ parts }) => firstSome((part) => match10(part).with({ _tag: "IPLit" }, () => None10).with({ _tag: "IPExpr" }, ({ expr: value }) => checkLoopExpr(value, frame, false)).exhaustive(), parts)).otherwise(() => None10));
var checkLoops = (stmts) => firstSome((stmt) => match10(stmt).with({ _tag: "SLet" }, ({ value }) => checkLoopExpr(value, None10, false)).with({ _tag: "SExpr" }, ({ value }) => checkLoopExpr(value, None10, false)).otherwise(() => None10), stmts);
var loopParamErrors = (params) => {
  let i = 0;
  let seen = _Set_fromArray([]);
  let errors = [];
  while (true) {
    const _step = match10(_Array_get8(i, params)).with({ _tag: "None" }, () => _done5(errors)).with({ _tag: "Some" }, ({ value: p }) => _recur5(i + 1, _Set_add(p.name, seen), _Set_has(p.name, seen) ? [...errors, checkErr(`duplicate loop param '${p.name}'`, p.nameSpan)] : errors)).exhaustive();
    if (_step._tag === "recur") {
      [i, seen, errors] = _step.args;
      continue;
    }
    return _step.value;
  }
};
var checkLoopDoAll = _curry11(3, (exprs, frame, tail) => {
  let i = 0;
  let errors = [];
  while (true) {
    const _step = match10(_Array_get8(i, exprs)).with({ _tag: "None" }, () => _done5(errors)).with({ _tag: "Some" }, ({ value: expr }) => ((isLast) => _recur5(i + 1, [...errors, ...checkLoopExprs(expr, frame, isLast ? tail : false)]))(_Option_isNone(_Array_get8(i + 1, exprs)))).exhaustive();
    if (_step._tag === "recur") {
      [i, errors] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var checkLoopExprs = _curry11(3, (e, frame, tail) => match10(e).with({ _tag: "ELoop" }, ({ params, body }) => [...loopParamErrors(params), ..._Array_flatMap2((p) => checkLoopExprs(p.init, frame, false), params), ...checkLoopExprs(body, Some10({ arity: length9(params), names: _Set_fromArray(map6((p) => p.name, params)) }), true)]).with({ _tag: "ERecur" }, ({ args, span: sp }) => ((siteErrors) => [...siteErrors, ..._Array_flatMap2((a) => checkLoopExprs(a, frame, false), args)])(match10(frame).with({ _tag: "None" }, () => [checkErr("'recur' is only legal inside a loop body", sp)]).with({ _tag: "Some" }, ({ value: current }) => [...not6(tail) ? [checkErr("'recur' must be in tail position of its enclosing loop", sp)] : [], ...not6(eq10(length9(args), current.arity)) ? [checkErr(`'recur' takes ${show5(current.arity)} argument${eq10(current.arity, 1) ? "" : "s"} (one per loop param), got ${show5(length9(args))}`, sp)] : []]).exhaustive())).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => [...checkLoopExprs(cond, frame, false), ...checkLoopExprs(thenE, frame, tail), ...checkLoopExprs(elseE, frame, tail)]).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => [...checkLoopExprs(scrutinee, frame, false), ..._Array_flatMap2((arm) => [...match10(arm.guard).with({ _tag: "Some" }, ({ value: guard }) => checkLoopExprs(guard, frame, false)).with({ _tag: "None" }, () => []).exhaustive(), ...checkLoopExprs(arm.body, frame, tail)], arms)]).with({ _tag: "ELetIn" }, ({ name, nameSpan: nameSp, value, body }) => [...match10(frame).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && (({ value: current }) => _Set_has(name, current.names))(_g);
}, ({ value: current }) => [checkErr(`'${name}' shadows a loop param inside the loop body; rename it`, nameSp)]).otherwise(() => []), ...checkLoopExprs(value, frame, false), ...checkLoopExprs(body, frame, tail)]).with({ _tag: "ELetBind" }, ({ value, body }) => [...checkLoopExprs(value, frame, false), ...checkLoopExprs(body, None10, false)]).with({ _tag: "ELambda" }, ({ body }) => checkLoopExprs(body, None10, false)).with({ _tag: "ECall" }, ({ fn, args }) => [...checkLoopExprs(fn, frame, false), ..._Array_flatMap2((a) => checkLoopExprs(a, frame, false), args)]).with({ _tag: "EPipe" }, ({ left, right }) => [...checkLoopExprs(left, frame, false), ...checkLoopExprs(right, frame, false)]).with({ _tag: "EDo" }, ({ exprs }) => checkLoopDoAll(exprs, frame, tail)).with({ _tag: "ERecord" }, ({ fields, spread }) => [...match10(spread).with({ _tag: "Some" }, ({ value }) => checkLoopExprs(value, frame, false)).with({ _tag: "None" }, () => []).exhaustive(), ..._Array_flatMap2((field) => checkLoopExprs(field.value, frame, false), fields)]).with({ _tag: "EField" }, ({ target }) => checkLoopExprs(target, frame, false)).with({ _tag: "ETuple" }, ({ elements }) => _Array_flatMap2((el) => checkLoopExprs(el, frame, false), elements)).with({ _tag: "EArr" }, ({ elements }) => _Array_flatMap2((el) => match10(el).with({ _tag: "SEExpr" }, ({ expr: value }) => checkLoopExprs(value, frame, false)).with({ _tag: "SESpread" }, ({ expr: value }) => checkLoopExprs(value, frame, false)).exhaustive(), elements)).with({ _tag: "EList" }, ({ elements }) => _Array_flatMap2((el) => match10(el).with({ _tag: "SEExpr" }, ({ expr: value }) => checkLoopExprs(value, frame, false)).with({ _tag: "SESpread" }, ({ expr: value }) => checkLoopExprs(value, frame, false)).exhaustive(), elements)).with({ _tag: "ESet" }, ({ elements }) => _Array_flatMap2((el) => match10(el).with({ _tag: "SEExpr" }, ({ expr: value }) => checkLoopExprs(value, frame, false)).with({ _tag: "SESpread" }, ({ expr: value }) => checkLoopExprs(value, frame, false)).exhaustive(), elements)).with({ _tag: "EMap" }, ({ entries }) => _Array_flatMap2((entry) => [...checkLoopExprs(entry.key, frame, false), ...checkLoopExprs(entry.value, frame, false)], entries)).with({ _tag: "EInterp" }, ({ parts }) => _Array_flatMap2((part) => match10(part).with({ _tag: "IPLit" }, () => []).with({ _tag: "IPExpr" }, ({ expr: value }) => checkLoopExprs(value, frame, false)).exhaustive(), parts)).otherwise(() => []));
var checkLoopsAll = (stmts) => _Array_flatMap2((stmt) => match10(stmt).with({ _tag: "SLet" }, ({ value }) => checkLoopExprs(value, None10, false)).with({ _tag: "SExpr" }, ({ value }) => checkLoopExprs(value, None10, false)).otherwise(() => []), stmts);
var mergeMissing = _curry11(3, (keys, from, into) => match10(keys).with((_v) => _v.length === 0, () => into).with((_v) => _v.length >= 1, ([k, ...rest]) => match10(_Map_get4(k, from)).with({ _tag: "Some" }, ({ value: v }) => mergeMissing(rest, from, _Map_has2(k, into) ? into : _Map_set3(k, v, into))).with({ _tag: "None" }, () => mergeMissing(rest, from, into)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var checkWith = _curry11(3, (stmts, imported, quals) => match10(checkReservedNames(stmts)).with({ _tag: "Some" }, ({ value: e }) => Err7(e)).with({ _tag: "None" }, () => match10(checkReservedWords(stmts)).with({ _tag: "Some" }, ({ value: e }) => Err7(e)).with({ _tag: "None" }, () => match10(checkCtorFieldVars(stmts)).with({ _tag: "Some" }, ({ value: e }) => Err7(e)).with({ _tag: "None" }, () => match10(checkQualifiedTypeNames(stmts, quals)).with({ _tag: "Some" }, ({ value: e }) => Err7(e)).with({ _tag: "None" }, () => match10(checkLoops(stmts)).with({ _tag: "Some" }, ({ value: e }) => Err7(e)).with({ _tag: "None" }, () => _Result_flatMap6((reg0) => ((reg) => match10(firstSome((s) => match10(s).with({ _tag: "SLet" }, ({ value }) => checkExpr(value, reg)).with({ _tag: "SExpr" }, ({ value }) => checkExpr(value, reg)).otherwise(() => None10), stmts)).with({ _tag: "Some" }, ({ value: e }) => Err7(e)).with({ _tag: "None" }, () => Ok8(stmts)).exhaustive())({ ctors: mergeMissing(_Map_keys3(imported.ctors), imported.ctors, reg0.ctors), types: mergeMissing(_Map_keys3(imported.types), imported.types, reg0.types) }), buildRegistry(stmts))).exhaustive()).exhaustive()).exhaustive()).exhaustive()).exhaustive());
var check = (stmts) => checkWith(stmts, { ctors: new Map, types: new Map }, emptyQuals);
var checkAllWith = _curry11(3, (stmts, imported, quals) => match10(buildRegistry(stmts)).with({ _tag: "Err" }, ({ error: e }) => ((errors) => eq10(length9(errors), 0) ? Ok8(stmts) : Err7(errors))([...checkReservedNamesAll(stmts), ...checkReservedWordsAll(stmts), ...checkCtorFieldVarsAll(stmts), ...checkQualifiedTypeNamesAll(stmts, quals), ...checkLoopsAll(stmts), e])).with({ _tag: "Ok" }, ({ value: reg0 }) => ((reg) => ((errors) => eq10(length9(errors), 0) ? Ok8(stmts) : Err7(errors))([...checkReservedNamesAll(stmts), ...checkReservedWordsAll(stmts), ...checkCtorFieldVarsAll(stmts), ...checkQualifiedTypeNamesAll(stmts, quals), ...checkLoopsAll(stmts), ..._Array_flatMap2((stmt) => match10(stmt).with({ _tag: "SLet" }, ({ value }) => checkExprs(value, reg)).with({ _tag: "SExpr" }, ({ value }) => checkExprs(value, reg)).otherwise(() => []), stmts)]))({ ctors: mergeMissing(_Map_keys3(imported.ctors), imported.ctors, reg0.ctors), types: mergeMissing(_Map_keys3(imported.types), imported.types, reg0.types) })).exhaustive());

import { Err as Err8, None as None13, Ok as Ok9, Some as Some13, _Array_append as _Array_append9, _Array_concat as _Array_concat4, _Array_flatMap as _Array_flatMap3, _Array_get as _Array_get10, _Array_head as _Array_head4, _Array_prepend as _Array_prepend6, _Array_reverse, _Map_delete, _Map_get as _Map_get6, _Map_getOr as _Map_getOr5, _Map_has as _Map_has4, _Map_keys as _Map_keys4, _Map_set as _Map_set6, _Option_map, _Result_flatMap as _Result_flatMap7, _Result_map as _Result_map6, _Set_add as _Set_add4, _Set_fromArray as _Set_fromArray4, _Set_has as _Set_has4, _Set_size, _Set_toArray as _Set_toArray2, _Str_startsWith as _Str_startsWith2, _curry as _curry14, _done as _done7, _recur as _recur7, _tuple as _tuple7, and as and9, eq as eq13, map as map8, not as not7, or as or6, reduce as reduce2 } from "@mochi/compiler/runtime";
import { match as match13 } from "@onrails/pattern";

import { _Array_contains as _Array_contains3, _Array_prepend as _Array_prepend5, _Map_get as _Map_get5, _Map_getOr as _Map_getOr3, _Map_set as _Map_set4, _Map_values, _Set_add as _Set_add2, _Set_diff, _Set_fromArray as _Set_fromArray2, _Set_has as _Set_has2, _Set_toArray, _Str_codeAt as _Str_codeAt5, _curry as _curry12, _tuple as _tuple6, and as and8, map as map7 } from "@mochi/compiler/runtime";
import { match as match11 } from "@onrails/pattern";
var mono = (t) => ({ vars: [], rvars: [], ty: t });
var tNumber = tPrim("number");
var tBool = tPrim("bool");
var tString = tPrim("string");
var primType = (name) => match11(name).with("float", () => tNumber).with("int", () => tNumber).with("string", () => tString).with("bool", () => tBool).otherwise(() => tPrim(name));
var emptyVarSets = { tv: _Set_fromArray2([]), rv: _Set_fromArray2([]) };
var diffVarSets = _curry12(2, (a, b) => ({ tv: _Set_diff(a.tv, b.tv), rv: _Set_diff(a.rv, b.rv) }));
var collect = _curry12(2, (t, acc) => match11(t).with({ _tag: "TyVar" }, ({ id }) => ({ tv: _Set_add2(id, acc.tv), rv: acc.rv })).with({ _tag: "TyCon" }, ({ args }) => collectArgs(args, acc)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => collect(toT, collect(fromT, acc))).with({ _tag: "TyRecord" }, ({ row }) => collectRow(row, acc)).with({ _tag: "TySingleton" }, () => acc).with({ _tag: "TyOneOf" }, ({ members }) => collectArgs(members, acc)).exhaustive());
var collectArgs = _curry12(2, (args, acc) => match11(args).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([a, ...rest]) => collectArgs(rest, collect(a, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var collectRow = _curry12(2, (row, acc) => match11(row).with({ _tag: "RowVar" }, ({ id }) => ({ tv: acc.tv, rv: _Set_add2(id, acc.rv) })).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => collectRow(rest, collect(fieldType, acc))).with({ _tag: "RowEmpty" }, () => acc).exhaustive());
var freeInType = (t) => collect(t, emptyVarSets);
var collectFree = _curry12(4, (t, bound, st, acc) => match11(t).with({ _tag: "TyVar" }, ({ id }) => _Set_has2(id, bound.tv) ? acc : match11(_Map_get5(id, st.tv)).with({ _tag: "Some" }, ({ value: next }) => collectFree(next, bound, st, acc)).with({ _tag: "None" }, () => ({ tv: _Set_add2(id, acc.tv), rv: acc.rv })).exhaustive()).with({ _tag: "TyCon" }, ({ args }) => collectFreeArgs(args, bound, st, acc)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => collectFree(toT, bound, st, collectFree(fromT, bound, st, acc))).with({ _tag: "TyRecord" }, ({ row }) => collectFreeRow(row, bound, st, acc)).with({ _tag: "TySingleton" }, () => acc).with({ _tag: "TyOneOf" }, ({ members }) => collectFreeArgs(members, bound, st, acc)).exhaustive());
var collectFreeArgs = _curry12(4, (args, bound, st, acc) => match11(args).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([a, ...rest]) => collectFreeArgs(rest, bound, st, collectFree(a, bound, st, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var collectFreeRow = _curry12(4, (row, bound, st, acc) => match11(row).with({ _tag: "RowVar" }, ({ id }) => _Set_has2(id, bound.rv) ? acc : match11(_Map_get5(id, st.rv)).with({ _tag: "Some" }, ({ value: next }) => collectFreeRow(next, bound, st, acc)).with({ _tag: "None" }, () => ({ tv: acc.tv, rv: _Set_add2(id, acc.rv) })).exhaustive()).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => collectFreeRow(rest, bound, st, collectFree(fieldType, bound, st, acc))).with({ _tag: "RowEmpty" }, () => acc).exhaustive());
var freeInScheme = _curry12(3, (sc, st, acc) => collectFree(sc.ty, { tv: _Set_fromArray2(sc.vars), rv: _Set_fromArray2(sc.rvars) }, st, acc));
var freeInEnvFrom = _curry12(3, (schemes, st, acc) => match11(schemes).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([sc, ...rest]) => freeInEnvFrom(rest, st, freeInScheme(sc, st, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freeInEnv = _curry12(2, (env, st) => freeInEnvFrom(_Map_values(env), st, emptyVarSets));
var generalize = _curry12(4, (env, t, st, widen) => {
  const zt = widen ? widenLits(zonk(t, st)) : zonk(t, st);
  const free = diffVarSets(freeInType(zt), freeInEnv(env, st));
  return { vars: _Set_toArray(free.tv), rvars: _Set_toArray(free.rv), ty: zt };
});
var widenLits = (t) => match11(t).with({ _tag: "TySingleton", base: "string" }, () => tString).with({ _tag: "TySingleton" }, () => tNumber).with({ _tag: "TyOneOf" }, ({ members }) => tUnion(map7((m) => match11(m).with({ _tag: "TySingleton" }, () => m).otherwise(() => widenLits(m)), members))).with({ _tag: "TyCon" }, ({ name, args }) => tCon(name, map7(widenLits, args))).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tArrow(widenLits(fromT), widenLits(toT))).with({ _tag: "TyRecord" }, ({ row }) => tRecord(widenRow(row))).with({ _tag: "TyVar" }, () => t).exhaustive();
var widenRow = (row) => match11(row).with({ _tag: "RowEmpty" }, () => row).with({ _tag: "RowVar" }, () => row).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => rField(label, widenLits(fieldType), widenRow(rest), optional)).exhaustive();
var instMapFrom = _curry12(3, (vars, acc, st) => match11(vars).with((_v) => _v.length === 0, () => _tuple6(acc, st)).with((_v) => _v.length >= 1, ([v, ...rest]) => (([fv, st1]) => instMapFrom(rest, _Map_set4(v, fv, acc), st1))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var instRowMapFrom = _curry12(3, (vars, acc, st) => match11(vars).with((_v) => _v.length === 0, () => _tuple6(acc, st)).with((_v) => _v.length >= 1, ([v, ...rest]) => (([fr, st1]) => instRowMapFrom(rest, _Map_set4(v, fr, acc), st1))(freshRowVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var instSub = _curry12(3, (t, tmap, rmap) => match11(t).with({ _tag: "TyVar" }, ({ id }) => _Map_getOr3(t, id, tmap)).with({ _tag: "TyCon" }, ({ name, args }) => tCon(name, map7((a) => instSub(a, tmap, rmap), args))).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tArrow(instSub(fromT, tmap, rmap), instSub(toT, tmap, rmap))).with({ _tag: "TyRecord" }, ({ row }) => tRecord(instSubRow(row, tmap, rmap))).with({ _tag: "TySingleton" }, ({ base, value }) => TySingleton(base, value)).with({ _tag: "TyOneOf" }, ({ members }) => tUnion(map7((m) => instSub(m, tmap, rmap), members))).exhaustive());
var instSubRow = _curry12(3, (row, tmap, rmap) => match11(row).with({ _tag: "RowVar" }, ({ id }) => _Map_getOr3(row, id, rmap)).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => rField(label, instSub(fieldType, tmap, rmap), instSubRow(rest, tmap, rmap), optional)).with({ _tag: "RowEmpty" }, () => row).exhaustive());
var instantiate = _curry12(2, (sc, st) => (([tmap, st1]) => (([rmap, st2]) => _tuple6(instSub(sc.ty, tmap, rmap), st2))(instRowMapFrom(sc.rvars, new Map, st1)))(instMapFrom(sc.vars, new Map, st)));
var isUpperStart2 = (s) => match11(_Str_codeAt5(0, s)).with({ _tag: "Some" }, ({ value: c }) => and8(c >= 65, c <= 90)).with({ _tag: "None" }, () => false).exhaustive();
var typeExprListToType = _curry12(5, (tes, vars, st, aliases, expanding) => match11(tes).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple6([], vars, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([te, ...rest]) => (([t, vars1, st1]) => (([restTs, vars2, st2]) => _tuple6(_Array_prepend5(t, restTs), vars2, st2))(typeExprListToType(rest, vars1, st1, aliases, expanding)))(typeExprToType(te, vars, st, aliases, expanding))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var typeExprName = _curry12(5, (name, vars, st, aliases, expanding) => _Array_contains3(name, primTypeNames) ? _tuple6(primType(name), vars, st) : match11(_Map_get5(name, vars)).with({ _tag: "Some" }, ({ value: v }) => _tuple6(v, vars, st)).with({ _tag: "None" }, () => match11(_Map_get5(name, aliases)).with({ _tag: "Some" }, ({ value: info }) => (([t, st1]) => _tuple6(t, vars, st1))(aliasRow(name, info, [], st, aliases, expanding))).with({ _tag: "None" }, () => isUpperStart2(name) ? _tuple6(tPrim(name), vars, st) : (([v, st1]) => _tuple6(v, _Map_set4(name, v, vars), st1))(freshVar(st))).exhaustive()).exhaustive());
var typeExprToType = _curry12(5, (te, vars, st, aliases, expanding) => match11(te).with({ _tag: "TyArrow" }, ({ from: fromTe, to: toTe }) => (([fromT, vars1, st1]) => (([toT, vars2, st2]) => _tuple6(tArrow(fromT, toT), vars2, st2))(typeExprToType(toTe, vars1, st1, aliases, expanding)))(typeExprToType(fromTe, vars, st, aliases, expanding))).with({ _tag: "TyApp" }, ({ ctor, args: argTes }) => (([args, vars1, st1]) => match11(_Map_get5(ctor, aliases)).with({ _tag: "Some" }, ({ value: info }) => (([t, st2]) => _tuple6(t, vars1, st2))(aliasRow(ctor, info, args, st1, aliases, expanding))).with({ _tag: "None" }, () => _tuple6(tCon(ctor, args), vars1, st1)).exhaustive())(typeExprListToType(argTes, vars, st, aliases, expanding))).with({ _tag: "TyTuple" }, ({ elems: elemTes }) => (([elems, vars1, st1]) => _tuple6(tTuple(elems), vars1, st1))(typeExprListToType(elemTes, vars, st, aliases, expanding))).with({ _tag: "TyList" }, ({ elem: elemTe }) => (([elemT, vars1, st1]) => _tuple6(tCon("Array", [elemT]), vars1, st1))(typeExprToType(elemTe, vars, st, aliases, expanding))).with({ _tag: "TyName" }, ({ name }) => typeExprName(name, vars, st, aliases, expanding)).with({ _tag: "TyQual" }, ({ alias, name, args: argTes }) => (([args, vars1, st1]) => match11(_Map_get5(`${alias}.${name}`, aliases)).with({ _tag: "Some" }, ({ value: info }) => (([t, st2]) => _tuple6(t, vars1, st2))(aliasRow(name, info, args, st1, aliases, expanding))).with({ _tag: "None" }, () => _tuple6(tCon(name, args), vars1, st1)).exhaustive())(typeExprListToType(argTes, vars, st, aliases, expanding))).with({ _tag: "TyLit" }, ({ value }) => _tuple6(tLit(value), vars, st)).with({ _tag: "TyUnion" }, ({ members }) => (([ts, vars1, st1]) => _tuple6(tUnion(ts), vars1, st1))(typeExprListToType(members, vars, st, aliases, expanding))).exhaustive());
var aliasLocalVarsFrom = _curry12(3, (params, args, st) => match11(params).with((_v) => _v.length === 0, () => _tuple6(new Map, st)).with((_v) => _v.length >= 1, ([p, ...restParams]) => match11(args).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([a, ...restArgs]) => (([restMap, st1]) => _tuple6(_Map_set4(p, a, restMap), st1))(aliasLocalVarsFrom(restParams, restArgs, st))).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => (([v, st1]) => (([restMap, st2]) => _tuple6(_Map_set4(p, v, restMap), st2))(aliasLocalVarsFrom(restParams, [], st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
})).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var aliasFieldsFrom = _curry12(5, (fields, vars, st, aliases, expanding) => match11(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple6(RowEmpty, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([fld, ...rest]) => (([ft, vars1, st1]) => (([restRow, st2]) => _tuple6(rField(fld.name, ft, restRow, fld.optional), st2))(aliasFieldsFrom(rest, vars1, st1, aliases, expanding)))(typeExprToType(fld.fieldType, vars, st, aliases, expanding))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var aliasRow = _curry12(6, (name, info, args, st, aliases, expanding) => _Set_has2(name, expanding) ? _tuple6(tCon(name, args), st) : match11(info.expr).with({ _tag: "Some" }, ({ value: te }) => (([local, st1]) => (([t, _, st2]) => _tuple6(t, st2))(typeExprToType(te, local, st1, aliases, _Set_add2(name, expanding))))(aliasLocalVarsFrom(info.params, args, st))).with({ _tag: "None" }, () => (([local, st1]) => {
  const next = _Set_add2(name, expanding);
  return (([row, st2]) => _tuple6(tRecord(row), st2))(aliasFieldsFrom(info.fields, local, st1, aliases, next));
})(aliasLocalVarsFrom(info.params, args, st))).exhaustive());
var pvarsFrom = _curry12(2, (params, st) => match11(params).with((_v) => _v.length === 0, () => _tuple6(new Map, [], st)).with((_v) => _v.length >= 1, ([p, ...rest]) => (([v, st1]) => (([restMap, restVars, st2]) => _tuple6(_Map_set4(p, v, restMap), _Array_prepend5(v, restVars), st2))(pvarsFrom(rest, st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var ctorFieldsArrowFrom = _curry12(5, (fields, pvars, st, aliases, result) => match11(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple6(result, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([fld, ...rest]) => (([ft, _, st1]) => (([restT, st2]) => _tuple6(tArrow(ft, restT), st2))(ctorFieldsArrowFrom(rest, pvars, st1, aliases, result)))(typeExprToType(fld.fieldType, pvars, st, aliases, _Set_fromArray2([])))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var ctorScheme = _curry12(5, (typeName, params, c, st, aliases) => (([pvars, pvarTypes, st1]) => {
  const result = tCon(typeName, pvarTypes);
  return (([ty, st2]) => {
    const sets = collect(ty, emptyVarSets);
    return _tuple6({ vars: _Set_toArray(sets.tv), rvars: _Set_toArray(sets.rv), ty }, st2);
  })(ctorFieldsArrowFrom(c.fields, pvars, st1, aliases, result));
})(pvarsFrom(params, st)));

import { _Array_append as _Array_append8, _Array_drop as _Array_drop3, _Array_get as _Array_get9, _Array_take as _Array_take2, _Map_getOr as _Map_getOr4, _Map_has as _Map_has3, _Map_set as _Map_set5, _Set_add as _Set_add3, _Set_diff as _Set_diff2, _Set_fromArray as _Set_fromArray3, _Set_has as _Set_has3, _curry as _curry13, _done as _done6, _recur as _recur6, eq as eq12, length as length10, min } from "@mochi/compiler/runtime";
import { match as match12 } from "@onrails/pattern";
var hasIndex = _curry13(2, (v, st) => _Map_has3(v, st.index));
var indexOfV = _curry13(2, (v, st) => _Map_getOr4(-1, v, st.index));
var lowOfV = _curry13(2, (v, st) => _Map_getOr4(-1, v, st.low));
var neighborsOf = _curry13(2, (v, adj) => match12(_Array_get9(v, adj)).with({ _tag: "Some" }, ({ value: ws }) => ws).with({ _tag: "None" }, () => []).exhaustive());
var indexOfFrom = _curry13(3, (v, xs, i) => {
  let j = i;
  while (true) {
    const _step = match12(_Array_get9(j, xs)).with({ _tag: "None" }, () => _done6(-1)).with({ _tag: "Some" }, ({ value: x }) => eq12(x, v) ? _done6(j) : _recur6(j + 1)).exhaustive();
    if (_step._tag === "recur") {
      j = _step.args[0];
      continue;
    }
    return _step.value;
  }
});
var visitNeighbors = _curry13(4, (v, ws, adj, st) => {
  let remaining = ws;
  let current = st;
  while (true) {
    const _step = match12(remaining).with((_v) => {
      const _g = _v;
      return _g.length === 0;
    }, () => _done6(current)).with((_v) => {
      const _g = _v;
      return _g.length >= 1;
    }, ([w, ...rest]) => hasIndex(w, current) ? _Set_has3(w, current.onStack) ? _recur6(rest, { ...current, low: _Map_set5(v, min(lowOfV(v, current), indexOfV(w, current)), current.low) }) : _recur6(rest, current) : ((next) => _recur6(rest, { ...next, low: _Map_set5(v, min(lowOfV(v, next), lowOfV(w, next)), next.low) }))(connect(w, adj, current))).otherwise(() => {
      throw new Error("non-exhaustive match");
    });
    if (_step._tag === "recur") {
      [remaining, current] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var connect = _curry13(3, (v, adj, st) => {
  const st1 = { ...st, index: _Map_set5(v, st.counter, st.index), low: _Map_set5(v, st.counter, st.low), onStack: _Set_add3(v, st.onStack), stack: _Array_append8(v, st.stack), counter: st.counter + 1 };
  const st2 = visitNeighbors(v, neighborsOf(v, adj), adj, st1);
  return eq12(lowOfV(v, st2), indexOfV(v, st2)) ? ((start) => ((comp) => ({ ...st2, onStack: _Set_diff2(st2.onStack, _Set_fromArray3(comp)), stack: _Array_take2(start, st2.stack), sccs: _Array_append8(comp, st2.sccs) }))(_Array_drop3(start, st2.stack)))(indexOfFrom(v, st2.stack, 0)) : st2;
});
var connectAllFrom = _curry13(4, (i, n, adj, st) => {
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
  const n = length10(adj);
  const initSt = { index: new Map([]), low: new Map([]), onStack: _Set_fromArray3([]), stack: [], counter: 0, sccs: [] };
  return connectAllFrom(0, n, adj, initSt).sccs;
};

var setLetBindMonad = _curry14(2, ($receiver, $value) => $receiver["monad"] = $value);
var setFieldOptional = _curry14(2, ($receiver, $value) => $receiver["optional"] = $value);
var exprSpan3 = (e) => match13(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var patSpan3 = (p) => match13(p).with({ _tag: "PWild" }, ({ span: sp }) => sp).with({ _tag: "PUnit" }, ({ span: sp }) => sp).with({ _tag: "PBind" }, ({ span: sp }) => sp).with({ _tag: "PAs" }, ({ span: sp }) => sp).with({ _tag: "PLit" }, ({ span: sp }) => sp).with({ _tag: "PBool" }, ({ span: sp }) => sp).with({ _tag: "PStr" }, ({ span: sp }) => sp).with({ _tag: "PTuple" }, ({ span: sp }) => sp).with({ _tag: "PRecord" }, ({ span: sp }) => sp).with({ _tag: "PCtor" }, ({ span: sp }) => sp).with({ _tag: "PArr" }, ({ span: sp }) => sp).with({ _tag: "PList" }, ({ span: sp }) => sp).with({ _tag: "POr" }, ({ span: sp }) => sp).exhaustive();
var annotSpan = (t) => match13(t).with({ _tag: "TyName" }, ({ span: sp }) => sp).with({ _tag: "TyArrow" }, ({ span: sp }) => sp).with({ _tag: "TyApp" }, ({ span: sp }) => sp).with({ _tag: "TyTuple" }, ({ span: sp }) => sp).with({ _tag: "TyList" }, ({ span: sp }) => sp).with({ _tag: "TyQual" }, ({ span: sp }) => sp).with({ _tag: "TyLit" }, ({ span: sp }) => sp).with({ _tag: "TyUnion" }, ({ span: sp }) => sp).exhaustive();
var typeErr = _curry14(2, (msg, sp) => ({ message: msg, start: sp.start, end: sp.end }));
var u = _curry14(4, (a, b, st, sp) => match13(unify(a, b, st)).with({ _tag: "Ok" }, ({ value: newSt }) => Ok9(newSt)).with({ _tag: "Err" }, ({ error: e }) => Err8(typeErr(e.message, sp))).exhaustive());
var checkFits = _curry14(4, (actual, expected, st, sp) => match13(fits(actual, expected, st)).with({ _tag: "Ok" }, ({ value: newSt }) => Ok9(newSt)).with({ _tag: "Err" }, ({ error: e }) => Err8(typeErr(e.message, sp))).exhaustive());
var bindParamNamesFrom = _curry14(3, (names, env, st) => match13(names).with((_v) => _v.length === 0, () => _tuple7([], env, st)).with((_v) => _v.length >= 1, ([n, ...rest]) => (([t, st1]) => (([restTs, env2, st2]) => _tuple7(_Array_prepend6(t, restTs), env2, st2))(bindParamNamesFrom(rest, _Map_set6(n, mono(t), env), st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var bindParamFieldsFrom = _curry14(4, (fields, env, row, st) => match13(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple7(row, env, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([f, ...rest]) => (([ft, st1]) => bindParamFieldsFrom(rest, _Map_set6(f, mono(ft), env), rExtend(f, ft, row), st1))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var bindParam = _curry14(3, (p, env, st) => match13(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => bindParam(inner, env, st)).with({ _tag: "LPName" }, ({ name }) => (([t, st1]) => _tuple7(t, _Map_set6(name, mono(t), env), st1))(freshVar(st))).with({ _tag: "LPTuple" }, ({ names }) => (([elems, env1, st1]) => _tuple7(tTuple(elems), env1, st1))(bindParamNamesFrom(names, env, st))).with({ _tag: "LPRecord" }, ({ fields }) => (([rowBase, st1]) => (([row, env1, st2]) => _tuple7(tRecord(row), env1, st2))(bindParamFieldsFrom(fields, env, rowBase, st1)))(freshRowVar(st))).with({ _tag: "LPLabeled" }, ({ name }) => (([t, st1]) => _tuple7(t, _Map_set6(name, mono(t), env), st1))(freshVar(st))).exhaustive());
var bindParamsFrom = _curry14(3, (params, env, st) => match13(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple7([], env, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => (([t, env1, st1]) => (([restTs, env2, st2]) => _tuple7(_Array_prepend6(t, restTs), env2, st2))(bindParamsFrom(rest, env1, st1)))(bindParam(p, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var constrainParamAnnotsFrom = _curry14(5, (ctx, params, paramTypes, vars, st) => match13(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(_tuple7(vars, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([param, ...rest]) => match13(paramTypes).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(_tuple7(vars, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([paramT, ...restTypes]) => match13(param).with((_v) => {
  const _g = _v;
  return _g._tag === "LPSpanned" && _g.param._tag === "LPName" && _g.param.annot._tag === "Some";
}, ({ param: { annot: { value: te } } }) => (([annotT, vars1, st1]) => _Result_flatMap7((st2) => constrainParamAnnotsFrom(ctx, rest, restTypes, vars1, st2), checkFits(paramT, annotT, st1, annotSpan(te))))(typeExprToType(te, vars, st, ctx.aliasMap, _Set_fromArray4([])))).otherwise(() => constrainParamAnnotsFrom(ctx, rest, restTypes, vars, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
})).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var arrowChain = _curry14(2, (paramTypes, resultT) => match13(paramTypes).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => tArrow(tUnit, resultT)).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([p]) => tArrow(p, resultT)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => tArrow(p, arrowChain(rest, resultT))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var ctxWithEnv = _curry14(2, (ctx, env) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: ctx.loopStack, letOwner: ctx.letOwner }));
var ctxWithLets = _curry14(3, (ctx, env, letOwner) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: ctx.loopStack, letOwner }));
var ctxWithLoop = _curry14(4, (ctx, env, frame, letOwner) => ({ env, open: ctx.open, ns: ctx.ns, aliasMap: ctx.aliasMap, plugins: ctx.plugins, loopStack: _Array_prepend6(frame, ctx.loopStack), letOwner }));
var inferLoopParamsFrom = _curry14(7, (ctx, params, i, envAcc, frameAcc, ownerAcc, st) => match13(_Array_get10(i, params)).with({ _tag: "None" }, () => Ok9(_tuple7(frameAcc, envAcc, ownerAcc, st))).with({ _tag: "Some" }, ({ value: p }) => _Result_flatMap7(([t, st1]) => ((sp) => inferLoopParamsFrom(ctx, params, i + 1, _Map_set6(p.name, mono(t), envAcc), _Array_append9(t, frameAcc), _Map_set6(p.name, sp, ownerAcc), noteLet(sp, st1)))(exprSpan3(p.init)), inferExpr(ctx, p.init, st))).exhaustive());
var unifyRecurArgsFrom = _curry14(5, (ctx, args, frame, i, st) => match13(_Array_get10(i, args)).with({ _tag: "None" }, () => Ok9(st)).with({ _tag: "Some" }, ({ value: a }) => _Result_flatMap7(([at, st1]) => match13(_Array_get10(i, frame)).with({ _tag: "None" }, () => unifyRecurArgsFrom(ctx, args, frame, i + 1, st1)).with({ _tag: "Some" }, ({ value: pt }) => _Result_flatMap7((st2) => unifyRecurArgsFrom(ctx, args, frame, i + 1, st2), u(at, pt, st1, exprSpan3(a)))).exhaustive(), inferExpr(ctx, a, st))).exhaustive());
var inferRecur = _curry14(4, (ctx, args, sp, st) => match13(ctx.loopStack).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Err8(typeErr("'recur' is only legal inside a loop body", sp))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([frame]) => _Result_flatMap7((st1) => (([t, st2]) => Ok9(_tuple7(t, st2)))(freshVar(st1)), unifyRecurArgsFrom(ctx, args, frame, 0, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var rowHasOptional = (row) => match13(row).with({ _tag: "RowExtend" }, ({ optional, rest }) => or6(optional, rowHasOptional(rest))).otherwise(() => false);
var domainNeedsFits = _curry14(2, (t, st) => match13(zonk(t, st)).with({ _tag: "TyRecord" }, ({ row }) => rowHasOptional(row)).otherwise(() => false));
var rowAllOptional = (row) => match13(row).with({ _tag: "RowExtend" }, ({ optional, rest }) => and9(optional, rowAllOptional(rest))).otherwise(() => true);
var domainIsOmittableRecord = _curry14(2, (t, st) => match13(zonk(t, st)).with({ _tag: "TyRecord" }, ({ row }) => rowAllOptional(row)).otherwise(() => false));
var isLabeledParam2 = (p) => match13(p).with({ _tag: "LPLabeled" }, () => true).with({ _tag: "LPSpanned" }, ({ param: inner }) => isLabeledParam2(inner)).otherwise(() => false);
var splitLamParams = _curry14(3, (params, positional, labeled) => match13(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple7(positional, labeled)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => isLabeledParam2(p) ? splitLamParams(rest, positional, _Array_append9(p, labeled)) : splitLamParams(rest, _Array_append9(p, positional), labeled)).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var labFieldsFrom = _curry14(5, (ctx, labs, env, vars, st) => match13(labs).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(_tuple7([], st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([lab, ...rest]) => match13(lab).with({ _tag: "LPSpanned" }, ({ param: inner }) => labFieldsFrom(ctx, [inner, ...rest], env, vars, st)).with({ _tag: "LPLabeled" }, ({ name, annot, optional, defaultValue }) => (([fieldT, vars1, st1]) => _Result_flatMap7(([fieldT1, st2]) => ((bodyT) => ((omittable) => _Result_flatMap7(([fields, stN]) => Ok9(_tuple7(_Array_prepend6({ name, fieldType: fieldT1, omittable, bodyType: bodyT }, fields), stN)), labFieldsFrom(ctx, rest, env, vars1, st2)))(or6(optional, match13(defaultValue).with({ _tag: "Some" }, () => true).with({ _tag: "None" }, () => false).exhaustive())))(match13(defaultValue).with({ _tag: "Some" }, () => fieldT1).with({ _tag: "None" }, () => optional ? tCon("Option", [fieldT1]) : fieldT1).exhaustive()), match13(defaultValue).with({ _tag: "None" }, () => Ok9(_tuple7(fieldT, st1))).with({ _tag: "Some" }, ({ value: d }) => _Result_flatMap7(([dt, s2]) => match13(annot).with({ _tag: "Some" }, () => _Result_flatMap7((s3) => Ok9(_tuple7(fieldT, s3)), checkFits(dt, fieldT, s2, exprSpan3(d)))).with({ _tag: "None" }, () => ((widened) => _Result_flatMap7((s3) => Ok9(_tuple7(widened, s3)), u(fieldT, widened, s2, exprSpan3(d))))(widenLits(zonk(dt, s2)))).exhaustive(), inferExpr(ctxWithEnv(ctx, env), d, st1))).exhaustive()))(match13(annot).with({ _tag: "Some" }, ({ value: te }) => typeExprToType(te, vars, st, ctx.aliasMap, _Set_fromArray4([]))).with({ _tag: "None" }, () => (([t, s1]) => _tuple7(t, vars, s1))(freshVar(st))).exhaustive())).otherwise(() => labFieldsFrom(ctx, rest, env, vars, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var rowOfLabFields = (fields) => match13(fields).with((_v) => _v.length === 0, () => RowEmpty).with((_v) => _v.length >= 1, ([f, ...rest]) => rField(f.name, f.fieldType, rowOfLabFields(rest), f.omittable)).otherwise(() => {
  throw new Error("non-exhaustive match");
});
var envWithLabFields = _curry14(2, (fields, env) => match13(fields).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([f, ...rest]) => envWithLabFields(rest, _Map_set6(f.name, mono(f.bodyType), env))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferCallArgs = _curry14(5, (ctx, fnT, args, st, callSpan) => match13(args).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(_tuple7(fnT, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([arg, ...rest]) => _Result_flatMap7(([argT, st1]) => match13(resolve(fnT, st1)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => domainNeedsFits(fromT, st1) ? _Result_flatMap7((st2) => inferCallArgs(ctx, toT, rest, st2, callSpan), checkFits(argT, fromT, st1, exprSpan3(arg))) : (([resultT, st2]) => _Result_flatMap7((st3) => inferCallArgs(ctx, resultT, rest, st3, callSpan), u(fnT, tArrow(argT, resultT), st2, exprSpan3(arg))))(freshVar(st1))).otherwise(() => (([resultT, st2]) => _Result_flatMap7((st3) => inferCallArgs(ctx, resultT, rest, st3, callSpan), u(fnT, tArrow(argT, resultT), st2, exprSpan3(arg))))(freshVar(st1))), inferExpr(ctx, arg, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferNormalCall = _curry14(4, (ctx, fn, args, st) => _Result_flatMap7(([fnT, st1]) => match13(args).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => match13(resolve(fnT, st1)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => domainIsOmittableRecord(fromT, st1) ? _Result_flatMap7((st2) => Ok9(_tuple7(toT, st2)), checkFits(tRecord(RowEmpty), fromT, st1, exprSpan3(fn))) : (([resultT, st2]) => _Result_flatMap7((st3) => Ok9(_tuple7(resultT, st3)), u(fnT, tArrow(tUnit, resultT), st2, exprSpan3(fn))))(freshVar(st1))).otherwise(() => (([resultT, st2]) => _Result_flatMap7((st3) => Ok9(_tuple7(resultT, st3)), u(fnT, tArrow(tUnit, resultT), st2, exprSpan3(fn))))(freshVar(st1)))).otherwise(() => inferCallArgs(ctx, fnT, args, st1, exprSpan3(fn))), inferExpr(ctx, fn, st)));
var inferTernary = _curry14(5, (ctx, cond, thenE, elseE, st) => _Result_flatMap7(([condT, st1]) => _Result_flatMap7((st2) => _Result_flatMap7(([thenT, st3]) => _Result_flatMap7(([elseT, st4]) => _Result_flatMap7((st5) => Ok9(_tuple7(thenT, st5)), u(thenT, elseT, st4, exprSpan3(elseE))), inferExpr(ctx, elseE, st3)), inferExpr(ctx, thenE, st2)), u(condT, tBool, st1, exprSpan3(cond))), inferExpr(ctx, cond, st)));
var inferBindBody = _curry14(7, (ctx, param, paramSpan, body, payloadT, mkBody, st) => (([paramT, bodyEnv, st1]) => _Result_flatMap7((st2) => _Result_flatMap7(([bodyT, st3]) => (([resT, st4]) => {
  const wantBody = mkBody(resT);
  return _Result_flatMap7((st5) => Ok9(_tuple7(wantBody, st5)), u(bodyT, wantBody, st4, exprSpan3(body)));
})(freshVar(st3)), inferExpr(ctxWithEnv(ctx, bodyEnv), body, st2)), u(paramT, payloadT, st1, paramSpan)))(bindParam(param, ctx.env, st)));
var inferTwoSlotBind = _curry14(8, (ctx, param, paramSpan, value, body, valT, ctor, st) => (([payloadT, st1]) => (([errT, st2]) => _Result_flatMap7((st3) => inferBindBody(ctx, param, paramSpan, body, payloadT, (resT) => tCon(ctor, [resT, errT]), st3), u(valT, tCon(ctor, [payloadT, errT]), st2, exprSpan3(value))))(freshVar(st1)))(freshVar(st)));
var inferQuestionBind = _curry14(8, (ctx, bind, param, paramSpan, value, body, valT, st) => match13(resolve(valT, st)).with({ _tag: "TyVar" }, () => (($written) => inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Result", st))(setLetBindMonad(bind, "Result"))).with({ _tag: "TyCon" }, ({ name }) => eq13(name, "Option") ? (($written) => (([payloadT, st1]) => _Result_flatMap7((st2) => inferBindBody(ctx, param, paramSpan, body, payloadT, (resT) => tCon("Option", [resT]), st2), u(valT, tCon("Option", [payloadT]), st1, exprSpan3(value))))(freshVar(st)))(setLetBindMonad(bind, "Option")) : eq13(name, "Result") ? (($written) => inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Result", st))(setLetBindMonad(bind, "Result")) : Err8(typeErr(`let? requires Option or Result, got ${showType(zonk(valT, st))}`, exprSpan3(value)))).otherwise(() => Err8(typeErr(`let? requires Option or Result, got ${showType(zonk(valT, st))}`, exprSpan3(value)))));
var inferLetBind = _curry14(8, (ctx, bind, param, paramSpan, monad, value, body, st) => _Result_flatMap7(([valT, st1]) => eq13(monad, "Task") ? inferTwoSlotBind(ctx, param, paramSpan, value, body, valT, "Task", st1) : inferQuestionBind(ctx, bind, param, paramSpan, value, body, valT, st1), inferExpr(ctx, value, st)));
var inferRecordRow = _curry14(3, (ctx, fields, st) => match13(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(_tuple7(RowEmpty, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([f, ...rest]) => _Result_flatMap7(([restRow, st1]) => _Result_flatMap7(([ft, st2]) => Ok9(_tuple7(rExtend(f.name, ft, restRow), st2)), inferExpr(ctx, f.value, st1)), inferRecordRow(ctx, rest, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var rWithTail = _curry14(2, (row, tail) => match13(row).with({ _tag: "RowEmpty" }, () => tail).with({ _tag: "RowVar" }, ({ id }) => rVar(id)).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => rField(label, fieldType, rWithTail(rest, tail), optional)).exhaustive());
var lookupField = _curry14(2, (row, name) => match13(row).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => eq13(label, name) ? Some13(_tuple7(fieldType, optional)) : lookupField(rest, name)).otherwise(() => None13));
var rowEndsEmpty = (row) => match13(row).with({ _tag: "RowEmpty" }, () => true).with({ _tag: "RowExtend" }, ({ rest }) => rowEndsEmpty(rest)).with({ _tag: "RowVar" }, () => false).exhaustive();
var inferFieldAccess = _curry14(6, (ctx, field, target, name, sp, st) => _Result_flatMap7(([targetT, st1]) => ((zonked) => match13(zonked).with({ _tag: "TyRecord" }, ({ row }) => match13(lookupField(row, name)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some";
}, ({ value: [ft, optional] }) => optional ? (($written) => Ok9(_tuple7(tCon("Option", [ft]), st1)))(setFieldOptional(field, true)) : Ok9(_tuple7(ft, st1))).with({ _tag: "None" }, () => rowEndsEmpty(row) ? Err8(typeErr(`record missing field '${name}'`, sp)) : inferDuckField(targetT, name, sp, st1)).exhaustive()).otherwise(() => inferDuckField(targetT, name, sp, st1)))(zonk(targetT, st1)), inferExpr(ctx, target, st)));
var inferDuckField = _curry14(4, (targetT, name, sp, st) => (([fieldT, st2]) => (([restRow, st3]) => _Result_flatMap7((st4) => Ok9(_tuple7(fieldT, st4)), u(targetT, tRecord(rExtend(name, fieldT, restRow)), st3, sp)))(freshRowVar(st2)))(freshVar(st)));
var inferNsField = _curry14(5, (ctx, tname, name, sp, st) => match13(_Map_get6(name, _Map_getOr5(new Map, tname, ctx.ns))).with({ _tag: "Some" }, ({ value: sc }) => (([t, st1]) => Ok9(_tuple7(t, st1)))(instantiate(sc, st))).with({ _tag: "None" }, () => Err8(typeErr(`'${tname}' has no member '${name}'`, sp))).exhaustive());
var inferInterpParts = _curry14(3, (ctx, parts, st) => match13(parts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "IPLit";
}, ([, ...rest]) => inferInterpParts(ctx, rest, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "IPExpr";
}, ([{ expr: ex }, ...rest]) => _Result_flatMap7(([t, st1]) => _Result_flatMap7((st2) => inferInterpParts(ctx, rest, st2), u(t, tString, st1, exprSpan3(ex))), inferExpr(ctx, ex, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferTupleElems = _curry14(3, (ctx, elements, st) => match13(elements).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(_tuple7([], st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([el, ...rest]) => _Result_flatMap7(([t, st1]) => _Result_flatMap7(([restTs, st2]) => Ok9(_tuple7(_Array_prepend6(t, restTs), st2)), inferTupleElems(ctx, rest, st1)), inferExpr(ctx, el, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seqElemExpr2 = (el) => match13(el).with({ _tag: "SEExpr" }, ({ expr: e }) => e).with({ _tag: "SESpread" }, ({ expr: e }) => e).exhaustive();
var inferSeqSlotsElems = _curry14(5, (ctx, con, elem, elements, st) => match13(elements).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([slot, ...rest]) => ((ex) => _Result_flatMap7(([et, st1]) => ((want) => _Result_flatMap7((st2) => inferSeqSlotsElems(ctx, con, elem, rest, st2), u(want, et, st1, exprSpan3(ex))))(match13(slot).with({ _tag: "SEExpr" }, () => elem).with({ _tag: "SESpread" }, () => tCon(con, [elem])).exhaustive()), inferExpr(ctx, ex, st)))(seqElemExpr2(slot))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferSeqSlots = _curry14(4, (ctx, con, elements, st) => (([elem, st1]) => _Result_flatMap7((st2) => Ok9(_tuple7(tCon(con, [elem]), st2)), inferSeqSlotsElems(ctx, con, elem, elements, st1)))(freshVar(st)));
var inferMapEntries = _curry14(5, (ctx, k, v, entries, st) => match13(entries).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([ent, ...rest]) => _Result_flatMap7(([kt, st1]) => _Result_flatMap7((st2) => _Result_flatMap7(([vt, st3]) => _Result_flatMap7((st4) => inferMapEntries(ctx, k, v, rest, st4), u(v, vt, st3, exprSpan3(ent.value))), inferExpr(ctx, ent.value, st2)), u(k, kt, st1, exprSpan3(ent.key))), inferExpr(ctx, ent.key, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferMapExpr = _curry14(3, (ctx, entries, st) => (([k, st1]) => (([v, st2]) => _Result_flatMap7((st3) => Ok9(_tuple7(tCon("Map", [k, v]), st3)), inferMapEntries(ctx, k, v, entries, st2)))(freshVar(st1)))(freshVar(st)));
var mergeBindingMapsFrom = _curry14(3, (keys, src, dest) => match13(keys).with((_v) => _v.length === 0, () => dest).with((_v) => _v.length >= 1, ([k, ...rest]) => match13(_Map_get6(k, src)).with({ _tag: "Some" }, ({ value: v }) => mergeBindingMapsFrom(rest, src, _Map_set6(k, v, dest))).with({ _tag: "None" }, () => mergeBindingMapsFrom(rest, src, dest)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var mergeBindingMaps = _curry14(2, (dest, src) => mergeBindingMapsFrom(_Map_keys4(src), src, dest));
var mergeEnvBindingsFrom = _curry14(3, (keys, bindings, env) => match13(keys).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([k, ...rest]) => match13(_Map_get6(k, bindings)).with({ _tag: "Some" }, ({ value: t }) => mergeEnvBindingsFrom(rest, bindings, _Map_set6(k, mono(t), env))).with({ _tag: "None" }, () => mergeEnvBindingsFrom(rest, bindings, env)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var mergeEnvBindings = _curry14(2, (bindings, env) => mergeEnvBindingsFrom(_Map_keys4(bindings), bindings, env));
var inferArms = _curry14(5, (ctx, scrutT, resultT, arms, st) => match13(arms).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([arm, ...rest]) => _Result_flatMap7(([patT, bindings, st1]) => _Result_flatMap7((st2) => ((armCtx) => _Result_flatMap7((st3) => _Result_flatMap7(([bodyT, st4]) => _Result_flatMap7((st5) => inferArms(ctx, scrutT, resultT, rest, st5), u(resultT, bodyT, st4, exprSpan3(arm.body))), inferExpr(armCtx, arm.body, st3)), match13(arm.guard).with({ _tag: "None" }, () => Ok9(st2)).with({ _tag: "Some" }, ({ value: g }) => _Result_flatMap7(([guardT, stg]) => u(tBool, guardT, stg, exprSpan3(g)), inferExpr(armCtx, g, st2))).exhaustive()))(ctxWithEnv(ctx, mergeEnvBindings(bindings, ctx.env))), u(scrutT, patT, st1, patSpan3(arm.pattern))), inferPat(ctx, arm.pattern, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferMatch = _curry14(4, (ctx, scrutinee, arms, st) => _Result_flatMap7(([scrutT, st1]) => (([resultT, st2]) => _Result_flatMap7((st3) => Ok9(_tuple7(resultT, st3)), inferArms(ctx, scrutT, resultT, arms, st2)))(freshVar(st1)), inferExpr(ctx, scrutinee, st)));
var inferExpr = _curry14(3, (ctx, e, st) => _Result_flatMap7(([t, st1]) => Ok9(_tuple7(t, recordAt(exprSpan3(e), t, st1))), inferExprRaw(ctx, e, st)));
var inferExprRaw = _curry14(3, (ctx, e, st) => match13(e).with({ _tag: "ENum" }, () => Ok9(_tuple7(tNumber, st))).with({ _tag: "EUnit" }, () => Ok9(_tuple7(tUnit, st))).with({ _tag: "EBool" }, () => Ok9(_tuple7(tBool, st))).with({ _tag: "EStr" }, ({ value }) => Ok9(_tuple7(tLit(value), st))).with({ _tag: "ERef" }, ({ name, span: sp }) => match13(_Map_get6(name, ctx.env)).with({ _tag: "Some" }, ({ value: sc }) => (([t, st1]) => Ok9(_tuple7(t, match13(_Map_get6(name, ctx.letOwner)).with({ _tag: "Some" }, ({ value: vsp }) => noteUse(vsp, t, st1)).with({ _tag: "None" }, () => st1).exhaustive())))(instantiate(sc, st))).with({ _tag: "None" }, () => ctx.open ? (([t, st1]) => Ok9(_tuple7(t, st1)))(freshVar(st)) : Err8(typeErr(`unbound variable '${name}'`, sp))).exhaustive()).with({ _tag: "ELambda" }, ({ params, body }) => (([posParams, labParams]) => (([paramTypes, bodyEnv, st1]) => _Result_flatMap7(([annotVars, st2]) => _Result_flatMap7(([labFields, st3]) => ((allTypes) => _Result_flatMap7(([bodyT, st4]) => Ok9(_tuple7(arrowChain(allTypes, bodyT), st4)), inferExpr(ctxWithEnv(ctx, envWithLabFields(labFields, bodyEnv)), body, st3)))(match13(labParams).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => paramTypes).otherwise(() => _Array_append9(tRecord(rowOfLabFields(labFields)), paramTypes))), labFieldsFrom(ctx, labParams, bodyEnv, annotVars, st2)), constrainParamAnnotsFrom(ctx, posParams, paramTypes, new Map, st1)))(bindParamsFrom(posParams, ctx.env, st)))(splitLamParams(params, [], []))).with({ _tag: "ELetIn" }, ({ name, nameSpan: _nameSpan, annot, value, body, span: _span }) => match13(value).with({ _tag: "ELambda" }, () => ((lets) => ((idxOf) => ((tail) => _Result_flatMap7(([localCtx, localSt]) => inferExpr(localCtx, tail, localSt), processGroupsFrom(ctx, stronglyConnected(adjOf(lets, idxOf)), lets, st)))(localTail(e)))(idxOfMap(lets)))(localLetsFrom(e))).otherwise(() => _Result_flatMap7(([valT, st1]) => _Result_flatMap7(([pinned, st2]) => ((widen) => ((sc) => ((vsp) => (($ctx) => inferExpr($ctx, body, noteLet(vsp, st2)))(ctxWithLets(ctx, _Map_set6(name, sc, ctx.env), _Map_set6(name, vsp, ctx.letOwner))))(exprSpan3(value)))(generalize(ctx.env, pinned, st2, widen)))(match13(annot).with({ _tag: "Some" }, () => false).with({ _tag: "None" }, () => true).exhaustive()), match13(annot).with({ _tag: "Some" }, ({ value: te }) => (([at, _, stA]) => _Result_map6((stB) => _tuple7(at, stB), checkFits(valT, at, stA, annotSpan(te))))(typeExprToType(te, new Map, st1, ctx.aliasMap, _Set_fromArray4([])))).with({ _tag: "None" }, () => Ok9(_tuple7(valT, st1))).exhaustive()), inferExpr(ctx, value, st)))).with({ _tag: "ELetBind" }, ({ param, paramSpan, monad, value, body }) => inferLetBind(ctx, e, param, paramSpan, monad, value, body, st)).with({ _tag: "ECall" }, ({ fn, args, origin }) => ((api) => _Result_flatMap7((claimed) => match13(claimed).with({ _tag: "Some" }, ({ value: r }) => Ok9(r)).with({ _tag: "None" }, () => inferNormalCall(ctx, fn, args, st)).exhaustive(), runInferCallHooks(inferCallHooksOf(ctx.plugins), fn, args, origin, st, api)))({ inferExpr: _curry14(2, (e2, st0) => inferExpr(ctx, e2, st0)), unify: u })).with({ _tag: "EPipe", fast: true }, ({ left, right, span: sp }) => match13(right).with({ _tag: "ECall" }, ({ fn: rfn, args: rargs, origin }) => inferExpr(ctx, ECall(rfn, _Array_prepend6(left, rargs), origin, sp), st)).otherwise(() => inferExpr(ctx, ECall(right, [left], None13, sp), st))).with({ _tag: "EPipe" }, ({ left, right, span: sp }) => inferExpr(ctx, ECall(right, [left], None13, sp), st)).with({ _tag: "EDo" }, ({ exprs }) => inferDo(ctx, exprs, st)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => inferTernary(ctx, cond, thenE, elseE, st)).with({ _tag: "ERecord" }, ({ fields, spread, span: sp }) => match13(spread).with({ _tag: "None" }, () => _Result_flatMap7(([row, st1]) => Ok9(_tuple7(tRecord(row), st1)), inferRecordRow(ctx, fields, st))).with({ _tag: "Some" }, ({ value: spreadExpr }) => _Result_flatMap7(([row, st1]) => _Result_flatMap7(([baseT, st2]) => (([tailVar, st3]) => _Result_flatMap7((st4) => Ok9(_tuple7(baseT, st4)), u(baseT, tRecord(rWithTail(row, tailVar)), st3, sp)))(freshRowVar(st2)), inferExpr(ctx, spreadExpr, st1)), inferRecordRow(ctx, fields, st))).exhaustive()).with({ _tag: "EField" }, ({ target, name, span: sp }) => match13(target).with({ _tag: "ERef" }, ({ name: tname }) => and9(_Map_has4(tname, ctx.ns), not7(_Map_has4(tname, ctx.env))) ? inferNsField(ctx, tname, name, sp, st) : inferFieldAccess(ctx, e, target, name, sp, st)).otherwise(() => inferFieldAccess(ctx, e, target, name, sp, st))).with({ _tag: "ETuple" }, ({ elements }) => _Result_flatMap7(([elems, st1]) => Ok9(_tuple7(tTuple(elems), st1)), inferTupleElems(ctx, elements, st))).with({ _tag: "EArr" }, ({ elements }) => inferSeqSlots(ctx, "Array", elements, st)).with({ _tag: "EList" }, ({ elements }) => inferSeqSlots(ctx, "List", elements, st)).with({ _tag: "ESet" }, ({ elements }) => inferSeqSlots(ctx, "Set", elements, st)).with({ _tag: "EMap" }, ({ entries }) => inferMapExpr(ctx, entries, st)).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => inferMatch(ctx, scrutinee, arms, st)).with({ _tag: "ELoop" }, ({ params, body }) => _Result_flatMap7(([frame, bodyEnv, bodyOwner, st1]) => inferExpr(ctxWithLoop(ctx, bodyEnv, frame, bodyOwner), body, st1), inferLoopParamsFrom(ctx, params, 0, ctx.env, [], ctx.letOwner, st))).with({ _tag: "ERecur" }, ({ args, span: sp }) => inferRecur(ctx, args, sp, st)).with({ _tag: "EInterp" }, ({ parts }) => _Result_flatMap7((st1) => Ok9(_tuple7(tString, st1)), inferInterpParts(ctx, parts, st))).exhaustive());
var inferDo = _curry14(3, (ctx, exprs, st) => match13(exprs).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Err8(typeErr("internal: empty do block", { start: 0, end: 0 }))).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([last]) => inferExpr(ctx, last, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([first, ...rest]) => _Result_flatMap7(([_, st1]) => inferDo(ctx, rest, st1), inferExpr(ctx, first, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferPatRecordFrom = _curry14(5, (ctx, fields, row, bindings, st) => match13(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(_tuple7(row, bindings, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([f, ...rest]) => _Result_flatMap7(([subT, subBindings, st1]) => inferPatRecordFrom(ctx, rest, rExtend(f.label, subT, row), mergeBindingMaps(bindings, subBindings), st1), inferPat(ctx, f.pat, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferPatRecord = _curry14(3, (ctx, fields, st) => (([rowBase, st1]) => _Result_flatMap7(([row, bindings, st2]) => Ok9(_tuple7(tRecord(row), bindings, st2)), inferPatRecordFrom(ctx, fields, rowBase, new Map, st1)))(freshRowVar(st)));
var inferPatCtorArgs = _curry14(7, (ctx, ctor, curT, args, st, bindings, sp) => match13(args).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(_tuple7(curT, bindings, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([argPat, ...rest]) => match13(resolve(curT, st)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => _Result_flatMap7(([subT, subBindings, st1]) => _Result_flatMap7((st2) => inferPatCtorArgs(ctx, ctor, toT, rest, st2, mergeBindingMaps(bindings, subBindings), sp), u(fromT, subT, st1, patSpan3(argPat))), inferPat(ctx, argPat, st))).otherwise(() => Err8(typeErr(`constructor '${ctor}' applied to too many arguments`, sp)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferPatTupleFrom = _curry14(3, (ctx, elems, st) => match13(elems).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(_tuple7([], new Map, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([ep, ...rest]) => _Result_flatMap7(([t, bindings, st1]) => _Result_flatMap7(([restTs, restBindings, st2]) => Ok9(_tuple7(_Array_prepend6(t, restTs), mergeBindingMaps(restBindings, bindings), st2)), inferPatTupleFrom(ctx, rest, st1)), inferPat(ctx, ep, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferPatTuple = _curry14(3, (ctx, elems, st) => _Result_flatMap7(([elemTs, bindings, st1]) => Ok9(_tuple7(tTuple(elemTs), bindings, st1)), inferPatTupleFrom(ctx, elems, st)));
var inferSeqPatElems = _curry14(4, (ctx, elem, elems, st) => match13(elems).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(_tuple7(new Map, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([ep, ...rest]) => _Result_flatMap7(([subT, subBindings, st1]) => _Result_flatMap7((st2) => _Result_flatMap7(([restBindings, st3]) => Ok9(_tuple7(mergeBindingMaps(restBindings, subBindings), st3)), inferSeqPatElems(ctx, elem, rest, st2)), u(elem, subT, st1, patSpan3(ep))), inferPat(ctx, ep, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferSeqPat = _curry14(5, (ctx, con, elems, restPat, st) => (([elem, st1]) => {
  const seqT = tCon(con, [elem]);
  return _Result_flatMap7(([bindings, st2]) => match13(restPat).with({ _tag: "None" }, () => Ok9(_tuple7(seqT, bindings, st2))).with({ _tag: "Some" }, ({ value: r }) => _Result_flatMap7(([subT, subBindings, st3]) => _Result_flatMap7((st4) => Ok9(_tuple7(seqT, mergeBindingMaps(bindings, subBindings), st4)), u(subT, seqT, st3, patSpan3(r))), inferPat(ctx, r, st2))).exhaustive(), inferSeqPatElems(ctx, elem, elems, st1));
})(freshVar(st)));
var inferPat = _curry14(3, (ctx, p, st) => _Result_flatMap7(([t, bindings, st1]) => Ok9(_tuple7(t, bindings, recordAt(patSpan3(p), t, st1))), inferPatRaw(ctx, p, st)));
var inferPatRaw = _curry14(3, (ctx, p, st) => match13(p).with({ _tag: "PAs" }, ({ pat, name }) => _Result_flatMap7(([t, bindings, st1]) => Ok9(_tuple7(t, _Map_set6(name, t, bindings), st1)), inferPat(ctx, pat, st))).with({ _tag: "PWild" }, () => (([t, st1]) => Ok9(_tuple7(t, new Map, st1)))(freshVar(st))).with({ _tag: "PUnit" }, () => Ok9(_tuple7(tUnit, new Map, st))).with({ _tag: "PLit" }, () => Ok9(_tuple7(tNumber, new Map, st))).with({ _tag: "PBool" }, () => Ok9(_tuple7(tBool, new Map, st))).with({ _tag: "PStr" }, ({ value }) => Ok9(_tuple7(tLit(value), new Map, st))).with({ _tag: "PBind" }, ({ name }) => (([t, st1]) => Ok9(_tuple7(t, _Map_set6(name, t, new Map), st1)))(freshVar(st))).with({ _tag: "PRecord" }, ({ fields }) => inferPatRecord(ctx, fields, st)).with({ _tag: "PCtor" }, ({ ctor, args, ns, span: sp }) => match13(ns).with({ _tag: "Some" }, ({ value: alias }) => match13(_Map_get6(ctor, _Map_getOr5(new Map, alias, ctx.ns))).with({ _tag: "None" }, () => Err8(typeErr(`'${alias}' has no member '${ctor}'`, sp))).with({ _tag: "Some" }, ({ value: sc }) => (([curT, st1]) => inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map, sp))(instantiate(sc, st))).exhaustive()).with({ _tag: "None" }, () => match13(_Map_get6(ctor, ctx.env)).with({ _tag: "None" }, () => Err8(typeErr(`unknown constructor '${ctor}'`, sp))).with({ _tag: "Some" }, ({ value: sc }) => (([curT, st1]) => inferPatCtorArgs(ctx, ctor, curT, args, st1, new Map, sp))(instantiate(sc, st))).exhaustive()).exhaustive()).with({ _tag: "PTuple" }, ({ elems }) => inferPatTuple(ctx, elems, st)).with({ _tag: "PArr" }, ({ elems, rest }) => inferSeqPat(ctx, "Array", elems, rest, st)).with({ _tag: "PList" }, ({ elems, rest }) => inferSeqPat(ctx, "List", elems, rest, st)).with({ _tag: "POr" }, ({ alts, span: sp }) => inferOrPat(ctx, alts, sp, st)).exhaustive());
var unifyOrPatBinding = _curry14(5, (name, altBindings, bindings, st, sp) => match13(_Map_get6(name, bindings)).with({ _tag: "None" }, () => Ok9(st)).with({ _tag: "Some" }, ({ value: prevT }) => match13(_Map_get6(name, altBindings)).with({ _tag: "None" }, () => Ok9(st)).with({ _tag: "Some" }, ({ value: ty }) => u(prevT, ty, st, sp)).exhaustive()).exhaustive());
var unifyOrPatBindings = _curry14(5, (names, altBindings, bindings, st, sp) => match13(names).with((_v) => _v.length === 0, () => Ok9(st)).with((_v) => _v.length >= 1, ([name, ...rest]) => _Result_flatMap7((st1) => unifyOrPatBindings(rest, altBindings, bindings, st1, sp), unifyOrPatBinding(name, altBindings, bindings, st, sp))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferOrPatAlts = _curry14(6, (ctx, alts, i, t, bindings, st) => match13(_Array_get10(i, alts)).with({ _tag: "None" }, () => Ok9(st)).with({ _tag: "Some" }, ({ value: alt }) => _Result_flatMap7(([altT, altBindings, st1]) => _Result_flatMap7((st2) => _Result_flatMap7((st3) => inferOrPatAlts(ctx, alts, i + 1, t, bindings, st3), unifyOrPatBindings(_Map_keys4(altBindings), altBindings, bindings, st2, patSpan3(alt))), u(t, altT, st1, patSpan3(alt))), inferPat(ctx, alt, st))).exhaustive());
var inferOrPat = _curry14(4, (ctx, alts, sp, st) => match13(alts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Err8(typeErr("or-pattern needs at least one alternative", sp))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([first, ...rest]) => _Result_flatMap7(([t, bindings, st1]) => _Result_flatMap7((st2) => Ok9(_tuple7(t, bindings, st2)), inferOrPatAlts(ctx, rest, 0, t, bindings, st1)), inferPat(ctx, first, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var patternBindsOpt = (rest) => match13(rest).with({ _tag: "Some" }, ({ value: r }) => patternBinds(r)).with({ _tag: "None" }, () => []).exhaustive();
var patternBinds = (p) => match13(p).with({ _tag: "PAs" }, ({ pat, name }) => _Array_append9(name, patternBinds(pat))).with({ _tag: "PBind" }, ({ name }) => [name]).with({ _tag: "PRecord" }, ({ fields }) => _Array_flatMap3((f) => patternBinds(f.pat), fields)).with({ _tag: "PCtor" }, ({ args }) => _Array_flatMap3(patternBinds, args)).with({ _tag: "PTuple" }, ({ elems }) => _Array_flatMap3(patternBinds, elems)).with({ _tag: "PArr" }, ({ elems, rest }) => _Array_concat4(_Array_flatMap3(patternBinds, elems), patternBindsOpt(rest))).with({ _tag: "PList" }, ({ elems, rest }) => _Array_concat4(_Array_flatMap3(patternBinds, elems), patternBindsOpt(rest))).with({ _tag: "POr" }, ({ alts }) => match13(_Array_head4(alts)).with({ _tag: "Some" }, ({ value: first }) => patternBinds(first)).with({ _tag: "None" }, () => []).exhaustive()).otherwise(() => []);
var addAllFrom = _curry14(2, (names, set) => match13(names).with((_v) => _v.length === 0, () => set).with((_v) => _v.length >= 1, ([n, ...rest]) => addAllFrom(rest, _Set_add4(n, set))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var paramBound = _curry14(2, (p, bound) => match13(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => paramBound(inner, bound)).with({ _tag: "LPName" }, ({ name }) => _Set_add4(name, bound)).with({ _tag: "LPTuple" }, ({ names }) => addAllFrom(names, bound)).with({ _tag: "LPRecord" }, ({ fields }) => addAllFrom(fields, bound)).with({ _tag: "LPLabeled" }, ({ name }) => _Set_add4(name, bound)).exhaustive());
var lambdaBound = _curry14(2, (params, bound) => match13(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => bound).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => lambdaBound(rest, paramBound(p, bound))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var labeledDefaultRefs = _curry14(3, (params, bound, acc) => match13(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => match13(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => labeledDefaultRefs([inner, ...rest], bound, acc)).with((_v) => {
  const _g = _v;
  return _g._tag === "LPLabeled" && _g.defaultValue._tag === "Some";
}, ({ defaultValue: { value: d } }) => labeledDefaultRefs(rest, bound, freeRefs(d, bound, acc))).otherwise(() => labeledDefaultRefs(rest, bound, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var loopBound = _curry14(2, (params, bound) => reduce2(_curry14(2, (b, p) => _Set_add4(p.name, b)), bound, params));
var loopInitRefsFrom = _curry14(4, (params, i, bound, acc) => match13(_Array_get10(i, params)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => loopInitRefsFrom(params, i + 1, bound, freeRefs(p.init, bound, acc))).exhaustive());
var freeRefsList = _curry14(3, (es, bound, acc) => match13(es).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([e, ...rest]) => freeRefsList(rest, bound, freeRefs(e, bound, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freeRefsFields = _curry14(3, (fields, bound, acc) => match13(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([f, ...rest]) => freeRefsFields(rest, bound, freeRefs(f.value, bound, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freeRefsEntries = _curry14(3, (entries, bound, acc) => match13(entries).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([ent, ...rest]) => freeRefsEntries(rest, bound, freeRefs(ent.value, bound, freeRefs(ent.key, bound, acc)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freeRefsInterpParts = _curry14(3, (parts, bound, acc) => match13(parts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "IPLit";
}, ([, ...rest]) => freeRefsInterpParts(rest, bound, acc)).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "IPExpr";
}, ([{ expr: ex }, ...rest]) => freeRefsInterpParts(rest, bound, freeRefs(ex, bound, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freeRefsArms = _curry14(3, (arms, bound, acc) => match13(arms).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([arm, ...rest]) => ((armBound) => ((acc1) => freeRefsArms(rest, bound, freeRefs(arm.body, armBound, acc1)))(match13(arm.guard).with({ _tag: "Some" }, ({ value: g }) => freeRefs(g, armBound, acc)).with({ _tag: "None" }, () => acc).exhaustive()))(addAllFrom(patternBinds(arm.pattern), bound))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freeRefs = _curry14(3, (e, bound, acc) => match13(e).with({ _tag: "ENum" }, () => acc).with({ _tag: "EUnit" }, () => acc).with({ _tag: "EBool" }, () => acc).with({ _tag: "EStr" }, () => acc).with({ _tag: "ERef" }, ({ name }) => _Set_has4(name, bound) ? acc : _Set_add4(name, acc)).with({ _tag: "ECall" }, ({ fn, args }) => freeRefsList(args, bound, freeRefs(fn, bound, acc))).with({ _tag: "ELambda" }, ({ params, body }) => freeRefs(body, lambdaBound(params, bound), labeledDefaultRefs(params, bound, acc))).with({ _tag: "ELetIn" }, ({ name, value, body }) => ((valueBound) => ((acc1) => freeRefs(body, _Set_add4(name, bound), acc1))(freeRefs(value, valueBound, acc)))(match13(value).with({ _tag: "ELambda" }, () => _Set_add4(name, bound)).otherwise(() => bound))).with({ _tag: "ELetBind" }, ({ param, value, body }) => ((acc1) => freeRefs(body, paramBound(param, bound), acc1))(freeRefs(value, bound, acc))).with({ _tag: "EPipe" }, ({ left, right }) => freeRefs(right, bound, freeRefs(left, bound, acc))).with({ _tag: "EDo" }, ({ exprs }) => freeRefsList(exprs, bound, acc)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => freeRefs(elseE, bound, freeRefs(thenE, bound, freeRefs(cond, bound, acc)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => freeRefsArms(arms, bound, freeRefs(scrutinee, bound, acc))).with({ _tag: "ELoop" }, ({ params, body }) => freeRefs(body, loopBound(params, bound), loopInitRefsFrom(params, 0, bound, acc))).with({ _tag: "ERecur" }, ({ args }) => freeRefsList(args, bound, acc)).with({ _tag: "ERecord" }, ({ fields, spread }) => freeRefsFields(fields, bound, match13(spread).with({ _tag: "Some" }, ({ value: s }) => freeRefs(s, bound, acc)).with({ _tag: "None" }, () => acc).exhaustive())).with({ _tag: "EField" }, ({ target }) => freeRefs(target, bound, acc)).with({ _tag: "ETuple" }, ({ elements }) => freeRefsList(elements, bound, acc)).with({ _tag: "EArr" }, ({ elements }) => freeRefsList(map8(seqElemExpr2, elements), bound, acc)).with({ _tag: "EList" }, ({ elements }) => freeRefsList(map8(seqElemExpr2, elements), bound, acc)).with({ _tag: "ESet" }, ({ elements }) => freeRefsList(map8(seqElemExpr2, elements), bound, acc)).with({ _tag: "EMap" }, ({ entries }) => freeRefsEntries(entries, bound, acc)).with({ _tag: "EInterp" }, ({ parts }) => freeRefsInterpParts(parts, bound, acc)).exhaustive());
var seedBuiltinsFrom = _curry14(4, (keys, builtins, env, st) => match13(keys).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([n, ...rest]) => match13(_Map_get6(n, builtins)).with({ _tag: "Some" }, ({ value: t }) => seedBuiltinsFrom(rest, builtins, _Map_set6(n, generalize(env, t, st, true), env), st)).with({ _tag: "None" }, () => seedBuiltinsFrom(rest, builtins, env, st)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedBuiltins = _curry14(3, (builtins, env, st) => seedBuiltinsFrom(_Map_keys4(builtins), builtins, env, st));
var seedNsMembersFrom = _curry14(5, (keys, members, env, st, acc) => match13(keys).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([m, ...rest]) => match13(_Map_get6(m, members)).with({ _tag: "Some" }, ({ value: t }) => seedNsMembersFrom(rest, members, env, st, _Map_set6(m, generalize(env, t, st, true), acc))).with({ _tag: "None" }, () => seedNsMembersFrom(rest, members, env, st, acc)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedNsFrom = _curry14(5, (nsNames, namespaces, env, st, acc) => match13(nsNames).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([nsName, ...rest]) => match13(_Map_get6(nsName, namespaces)).with({ _tag: "Some" }, ({ value: members }) => seedNsFrom(rest, namespaces, env, st, _Map_set6(nsName, seedNsMembersFrom(_Map_keys4(members), members, env, st, new Map), acc))).with({ _tag: "None" }, () => seedNsFrom(rest, namespaces, env, st, acc)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedNs = _curry14(3, (namespaces, env, st) => seedNsFrom(_Map_keys4(namespaces), namespaces, env, st, new Map));
var seedNsImportsFrom = _curry14(3, (aliases, nsImports, ns) => match13(aliases).with((_v) => _v.length === 0, () => ns).with((_v) => _v.length >= 1, ([alias, ...rest]) => match13(_Map_get6(alias, nsImports)).with({ _tag: "Some" }, ({ value: members }) => seedNsImportsFrom(rest, nsImports, _Map_set6(alias, members, ns))).with({ _tag: "None" }, () => seedNsImportsFrom(rest, nsImports, ns)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedNsImports = _curry14(2, (nsImports, ns) => seedNsImportsFrom(_Map_keys4(nsImports), nsImports, ns));
var aliasMapFrom = _curry14(2, (stmts, acc) => match13(stmts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match13(s).with((_v) => {
  const _g = _v;
  return _g._tag === "SType" && _g.alias._tag === "Some";
}, ({ name, params, alias: { value: fields } }) => aliasMapFrom(rest, _Map_set6(name, { params, fields, expr: None13 }, acc))).with((_v) => {
  const _g = _v;
  return _g._tag === "SType" && _g.aliasType._tag === "Some";
}, ({ name, params, aliasType: { value: te } }) => aliasMapFrom(rest, _Map_set6(name, { params, fields: [], expr: Some13(te) }, acc))).otherwise(() => aliasMapFrom(rest, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerCtorsFrom = _curry14(6, (ctors, typeName, params, aliasMap, env, st) => match13(ctors).with((_v) => _v.length === 0, () => _tuple7(env, st)).with((_v) => _v.length >= 1, ([c, ...rest]) => (([sc, st1]) => registerCtorsFrom(rest, typeName, params, aliasMap, _Map_set6(c.name, sc, env), st1))(ctorScheme(typeName, params, c, st, aliasMap))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerUserCtorsFrom = _curry14(4, (stmts, aliasMap, env, st) => match13(stmts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple7(env, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match13(s).with({ _tag: "SType" }, ({ name, params, ctors }) => (([env1, st1]) => registerUserCtorsFrom(rest, aliasMap, env1, st1))(registerCtorsFrom(ctors, name, params, aliasMap, env, st))).otherwise(() => registerUserCtorsFrom(rest, aliasMap, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerBuiltinCtorGroup = _curry14(6, (ctors, typeName, params, aliasMap, env, st) => match13(ctors).with((_v) => _v.length === 0, () => _tuple7(env, st)).with((_v) => _v.length >= 1, ([c, ...rest]) => _Map_has4(c.name, env) ? registerBuiltinCtorGroup(rest, typeName, params, aliasMap, env, st) : (([sc, st1]) => registerBuiltinCtorGroup(rest, typeName, params, aliasMap, _Map_set6(c.name, sc, env), st1))(ctorScheme(typeName, params, c, st, aliasMap))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerBuiltinCtorsFrom = _curry14(4, (decls, aliasMap, env, st) => match13(decls).with((_v) => _v.length === 0, () => _tuple7(env, st)).with((_v) => _v.length >= 1, ([d, ...rest]) => (([env1, st1]) => registerBuiltinCtorsFrom(rest, aliasMap, env1, st1))(registerBuiltinCtorGroup(d.ctors, d.name, d.params, aliasMap, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var registerExternsFrom = _curry14(4, (stmts, aliasMap, env, st) => match13(stmts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple7(env, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match13(s).with({ _tag: "SExtern" }, ({ name, params, typeExpr }) => (([vars, st0]) => (([t, _, st1]) => registerExternsFrom(rest, aliasMap, _Map_set6(name, generalize(env, t, st1, false), env), st1))(typeExprToType(typeExpr, vars, st0, aliasMap, _Set_fromArray4([]))))(reduce2(_curry14(2, ([vs, s2], param) => (([v, s1]) => _tuple7(_Map_set6(param, v, vs), s1))(freshVar(s2))), _tuple7(new Map, st), params))).otherwise(() => registerExternsFrom(rest, aliasMap, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var letsOfFrom = (stmts) => match13(stmts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => []).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match13(s).with({ _tag: "SLet" }, () => _Array_prepend6(s, letsOfFrom(rest))).otherwise(() => letsOfFrom(rest))).otherwise(() => {
  throw new Error("non-exhaustive match");
});
var localLetsFrom = (e) => {
  const collect2 = _curry14(2, (current, acc) => match13(current).with({ _tag: "ELetIn" }, ({ name, nameSpan, annot, value, body, span }) => match13(value).with({ _tag: "ELambda" }, () => collect2(body, _Array_append9(SLet(name, nameSpan, annot, value, false, None13, span), acc))).otherwise(() => acc)).otherwise(() => acc));
  return collect2(e, []);
};
var localTail = (e) => match13(e).with((_v) => {
  const _g = _v;
  return _g._tag === "ELetIn" && _g.value._tag === "ELambda";
}, ({ body }) => localTail(body)).otherwise(() => e);
var idxOfFrom = _curry14(3, (lets, i0, acc0) => {
  let i = i0;
  let acc = acc0;
  while (true) {
    const _step = match13(_Array_get10(i, lets)).with({ _tag: "None" }, () => _done7(acc)).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value._tag === "SLet";
    }, ({ value: { name } }) => _recur7(i + 1, _Map_set6(name, i, acc))).with({ _tag: "Some" }, () => _recur7(i + 1, acc)).exhaustive();
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var idxOfMap = (lets) => idxOfFrom(lets, 0, new Map);
var depsOf = _curry14(2, (letStmt, idxOf) => match13(letStmt).with({ _tag: "SLet" }, ({ value }) => _Array_flatMap3((r) => match13(_Map_get6(r, idxOf)).with({ _tag: "Some" }, ({ value: j }) => [j]).with({ _tag: "None" }, () => []).exhaustive(), _Set_toArray2(freeRefs(value, _Set_fromArray4([]), _Set_fromArray4([]))))).otherwise(() => []));
var adjOf = _curry14(2, (lets, idxOf) => map8((s) => depsOf(s, idxOf), lets));
var groupOfFrom = _curry14(2, (idxs, lets) => match13(idxs).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => []).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([i, ...rest]) => match13(_Array_get10(i, lets)).with({ _tag: "Some" }, ({ value: s }) => _Array_prepend6(s, groupOfFrom(rest, lets))).with({ _tag: "None" }, () => groupOfFrom(rest, lets)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var preBindGroupFrom = _curry14(3, (group, env, st) => match13(group).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple7(env, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match13(s).with({ _tag: "SLet" }, ({ name }) => (([v, st1]) => preBindGroupFrom(rest, _Map_set6(name, mono(v), env), st1))(freshVar(st))).otherwise(() => preBindGroupFrom(rest, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferGroupFrom = _curry14(3, (ctx, group, st) => match13(group).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(_tuple7(new Map, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match13(s).with({ _tag: "SLet" }, ({ name, annot, value, span }) => _Result_flatMap7(([t, st1]) => match13(_Map_get6(name, ctx.env)).with({ _tag: "Some" }, ({ value: selfSc }) => _Result_flatMap7((st2) => _Result_flatMap7(([pinned, st3]) => _Result_flatMap7(([restTypes, st4]) => Ok9(_tuple7(_Map_set6(name, pinned, restTypes), st4)), inferGroupFrom(ctx, rest, st3)), match13(annot).with({ _tag: "Some" }, ({ value: te }) => (([at, _, stA]) => _Result_map6((stB) => _tuple7(at, stB), checkFits(t, at, stA, annotSpan(te))))(typeExprToType(te, new Map, st2, ctx.aliasMap, _Set_fromArray4([])))).with({ _tag: "None" }, () => Ok9(_tuple7(t, st2))).exhaustive()), u(selfSc.ty, t, st1, span))).with({ _tag: "None" }, () => Err8(typeErr(`internal: missing self-binding for '${name}'`, span))).exhaustive(), inferExpr(ctx, value, st))).otherwise(() => inferGroupFrom(ctx, rest, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var dropGroupFrom = _curry14(2, (group, env) => match13(group).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => env).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match13(s).with({ _tag: "SLet" }, ({ name }) => dropGroupFrom(rest, _Map_delete(name, env))).otherwise(() => dropGroupFrom(rest, env))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var generalizeGroupFrom = _curry14(4, (group, bodyTypes, env, st) => match13(group).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => env).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match13(s).with({ _tag: "SLet" }, ({ name, annot }) => match13(_Map_get6(name, bodyTypes)).with({ _tag: "Some" }, ({ value: t }) => ((widen) => generalizeGroupFrom(rest, bodyTypes, _Map_set6(name, generalize(env, t, st, widen), env), st))(match13(annot).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, () => false).exhaustive())).with({ _tag: "None" }, () => generalizeGroupFrom(rest, bodyTypes, env, st)).exhaustive()).otherwise(() => generalizeGroupFrom(rest, bodyTypes, env, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var noteGroupLets = _curry14(3, (group, letOwner, st) => match13(group).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple7(letOwner, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match13(s).with((_v) => {
  const _g = _v;
  return _g._tag === "SLet" && (({ name, value }) => not7(_Str_startsWith2("$", name)))(_g);
}, ({ name, value }) => ((sp) => noteGroupLets(rest, _Map_set6(name, sp, letOwner), noteLet(sp, st)))(exprSpan3(value))).otherwise(() => noteGroupLets(rest, letOwner, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var processGroupsFrom = _curry14(4, (ctx, sccs, lets, st) => match13(sccs).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(_tuple7(ctx, st))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([comp, ...restSccs]) => ((group) => (([preEnv, st1]) => {
  const preCtx = ctxWithEnv(ctx, preEnv);
  return _Result_flatMap7(([bodyTypes, st2]) => ((finalEnv) => (([finalOwner, st3]) => processGroupsFrom(ctxWithLets(ctx, finalEnv, finalOwner), restSccs, lets, st3))(noteGroupLets(group, ctx.letOwner, st2)))(generalizeGroupFrom(group, bodyTypes, dropGroupFrom(group, preEnv), st2)), inferGroupFrom(preCtx, group, st1));
})(preBindGroupFrom(group, ctx.env, st)))(groupOfFrom(comp, lets))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferExprStmtsFrom = _curry14(3, (ctx, stmts, st) => match13(stmts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok9(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => match13(s).with({ _tag: "SExpr" }, ({ value, span }) => _Result_flatMap7(([t, st1]) => _Result_flatMap7((st2) => inferExprStmtsFrom(ctx, rest, st2), u(t, tUnit, st1, span)), inferExpr(ctx, value, st))).otherwise(() => inferExprStmtsFrom(ctx, rest, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var seedImportsFrom = _curry14(3, (keys, imports, env) => match13(keys).with((_v) => _v.length === 0, () => env).with((_v) => _v.length >= 1, ([k, ...rest]) => match13(_Map_get6(k, imports)).with({ _tag: "Some" }, ({ value: sc }) => seedImportsFrom(rest, imports, _Map_set6(k, sc, env))).with({ _tag: "None" }, () => seedImportsFrom(rest, imports, env)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var qualifyTe = _curry14(3, (te, alias, from) => match13(te).with({ _tag: "TyName" }, ({ name, span: sp }) => _Map_has4(name, from) ? TyQual(alias, name, sp, [], sp) : te).with({ _tag: "TyApp" }, ({ ctor, args, span: sp }) => ((args1) => _Map_has4(ctor, from) ? TyQual(alias, ctor, sp, args1, sp) : TyApp(ctor, args1, sp))(map8((a) => qualifyTe(a, alias, from), args))).with({ _tag: "TyArrow" }, ({ from: fromTe, to: toTe, span: sp }) => TyArrow(qualifyTe(fromTe, alias, from), qualifyTe(toTe, alias, from), sp)).with({ _tag: "TyTuple" }, ({ elems, span: sp }) => TyTuple(map8((e) => qualifyTe(e, alias, from), elems), sp)).with({ _tag: "TyList" }, ({ elem, span: sp }) => TyList(qualifyTe(elem, alias, from), sp)).with({ _tag: "TyUnion" }, ({ members, span: sp }) => TyUnion(map8((m) => qualifyTe(m, alias, from), members), sp)).otherwise(() => te));
var qualifyField = _curry14(3, (fld, alias, from) => ({ name: fld.name, fieldType: qualifyTe(fld.fieldType, alias, from), optional: fld.optional }));
var qualifyInfo = _curry14(3, (info, alias, from) => ({ params: info.params, fields: map8((f) => qualifyField(f, alias, from), info.fields), expr: _Option_map((te) => qualifyTe(te, alias, from), info.expr) }));
var qualAliasSeedFrom = _curry14(4, (names, alias, from, acc) => match13(names).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([n, ...rest]) => qualAliasSeedFrom(rest, alias, from, match13(_Map_get6(n, from)).with({ _tag: "Some" }, ({ value: info }) => _Map_set6(`${alias}.${n}`, qualifyInfo(info, alias, from), acc)).with({ _tag: "None" }, () => acc).exhaustive())).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var qualAliasSeed = _curry14(3, (stmts, quals, acc) => match13(stmts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([s, ...rest]) => qualAliasSeed(rest, quals, match13(s).with({ _tag: "SImportNs" }, ({ alias }) => match13(_Map_get6(alias.name, quals)).with({ _tag: "Some" }, ({ value: dep }) => qualAliasSeedFrom(_Map_keys4(dep.aliases), alias.name, dep.aliases, acc)).with({ _tag: "None" }, () => acc).exhaustive()).otherwise(() => acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var zonkRecorded = _curry14(2, (recorded, st) => map8((r) => ({ span: r.span, ty: zonk(r.ty, st) }), _Array_reverse(recorded)));
var isConcrete = (t) => {
  const f = freeInType(t);
  return and9(eq13(_Set_size(f.tv), 0), eq13(_Set_size(f.rv), 0));
};
var allSameConcreteFrom = _curry14(3, (shown, uses, i) => match13(_Array_get10(i, uses)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: t }) => and9(isConcrete(t), eq13(showType(t), shown)) ? allSameConcreteFrom(shown, uses, i + 1) : false).exhaustive());
var allSameConcrete = _curry14(2, (shown, uses) => allSameConcreteFrom(shown, uses, 0));
var resolveLetParamsFrom = _curry14(2, (keys, st) => match13(keys).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => []).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([k, ...rest]) => ((tail) => ((uses) => match13(_Array_get10(0, uses)).with({ _tag: "None" }, () => tail).with({ _tag: "Some" }, ({ value: first }) => allSameConcrete(showType(first), uses) ? match13(_Map_get6(k, st.letSpans)).with({ _tag: "Some" }, ({ value: span }) => _Array_prepend6({ span, ty: first }, tail)).with({ _tag: "None" }, () => tail).exhaustive() : tail).exhaustive())(map8((t) => zonk(t, st), _Map_getOr5([], k, st.letUses))))(resolveLetParamsFrom(rest, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var resolveLetParams = (st) => resolveLetParamsFrom(_Map_keys4(st.letSpans), st);
var runInferImports = _curry14(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => {
  const plugins = resolvePluginsDefault(pluginsOpt);
  const st0 = mkSt(1000);
  const env0 = seedBuiltins(builtins, new Map, st0);
  const ns0 = seedNsImports(nsImports, seedNs(namespaces, env0, st0));
  const aliasMap = aliasMapFrom(stmts, qualAliasSeed(stmts, quals, new Map));
  return (([env1, st1]) => (([env2, st2]) => (([env3, st3]) => {
    const env4 = seedImportsFrom(_Map_keys4(imports), imports, env3);
    const lets = letsOfFrom(stmts);
    const idxOf = idxOfMap(lets);
    const sccs = stronglyConnected(adjOf(lets, idxOf));
    return match13(processGroupsFrom({ env: env4, open: openMode, ns: ns0, aliasMap, plugins, loopStack: [], letOwner: new Map }, sccs, lets, st3)).with((_v) => {
      const _g = _v;
      return _g._tag === "Ok";
    }, ({ value: [finalCtx, st4] }) => match13(inferExprStmtsFrom(finalCtx, stmts, st4)).with({ _tag: "Ok" }, ({ value: st5 }) => Ok9({ env: finalCtx.env, types: zonkRecorded(st5.recorded, st5), aliases: aliasMap, letParams: resolveLetParams(st5) })).with({ _tag: "Err" }, ({ error: e }) => Err8(e)).exhaustive()).with({ _tag: "Err" }, ({ error: e }) => Err8(e)).exhaustive();
  })(registerExternsFrom(stmts, aliasMap, env2, st2)))(registerBuiltinCtorsFrom(builtinDeclsFor(stmts), aliasMap, env1, st1)))(registerUserCtorsFrom(stmts, aliasMap, env0, st0));
});
var inferProgramImports = _curry14(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => _Result_map6((r) => r.env, runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt)));
var emptyQuals2 = new Map;
var inferProgram = _curry14(4, (stmts, builtins, namespaces, openMode) => inferProgramImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, None13));
var inferProgramImportsTypes = _curry14(8, (stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt) => runInferImports(stmts, builtins, namespaces, openMode, imports, nsImports, quals, pluginsOpt));
var inferProgramTypes = _curry14(4, (stmts, builtins, namespaces, openMode) => runInferImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, None13));
var inferProgramWith = _curry14(5, (stmts, builtins, namespaces, openMode, pluginsOpt) => inferProgramImports(stmts, builtins, namespaces, openMode, new Map, new Map, emptyQuals2, pluginsOpt));
var takeScheme = _curry14(3, (name, env, acc) => match13(_Map_get6(name, env)).with({ _tag: "Some" }, ({ value: sc }) => _Map_set6(name, sc, acc)).with({ _tag: "None" }, () => acc).exhaustive());
var exportCtorsInto = _curry14(4, (ctors, i, env, acc) => match13(_Array_get10(i, ctors)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: c }) => exportCtorsInto(ctors, i + 1, env, takeScheme(c.name, env, acc))).exhaustive());
var exportedSchemesFrom = _curry14(4, (stmts, i0, env, acc0) => {
  let i = i0;
  let acc = acc0;
  while (true) {
    const _step = match13(_Array_get10(i, stmts)).with({ _tag: "None" }, () => _done7(acc)).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value._tag === "SLet" && _g.value.exported === true;
    }, ({ value: { name } }) => _recur7(i + 1, takeScheme(name, env, acc))).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value._tag === "SExtern" && _g.value.exported === true;
    }, ({ value: { name } }) => _recur7(i + 1, takeScheme(name, env, acc))).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value._tag === "SType" && _g.value.exported === true;
    }, ({ value: { ctors } }) => _recur7(i + 1, exportCtorsInto(ctors, 0, env, acc))).with({ _tag: "Some" }, () => _recur7(i + 1, acc)).exhaustive();
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var exportedSchemes = _curry14(2, (stmts, env) => exportedSchemesFrom(stmts, 0, env, new Map));

import { None as None14, Some as Some14, _Array_append as _Array_append10, _Array_concat as _Array_concat5, _Array_get as _Array_get11, _Array_head as _Array_head5, _Array_prepend as _Array_prepend7, _Map_get as _Map_get7, _Map_getOr as _Map_getOr6, _Map_keys as _Map_keys5, _Option_contains as _Option_contains3, _Option_exists as _Option_exists4, _Option_isSome as _Option_isSome3, _Option_unwrapOr as _Option_unwrapOr7, _Set_add as _Set_add5, _Set_fromArray as _Set_fromArray5, _Set_has as _Set_has5, _Set_toArray as _Set_toArray3, _Set_union, _Str_chars, _Str_codeAt as _Str_codeAt6, _Str_concat as _Str_concat2, _Str_endsWith as _Str_endsWith2, _Str_join as _Str_join5, _Str_length as _Str_length3, _Str_replace, _Str_slice as _Str_slice3, _Str_split as _Str_split2, _Str_startsWith as _Str_startsWith3, _curry as _curry15, _done as _done8, _recur as _recur8, _tuple as _tuple8, and as and10, concat, eq as eq14, filter as filter4, length as length11, map as map9, not as not8, or as or7, reduce as reduce3, show as show6 } from "@mochi/compiler/runtime";
import { match as match14 } from "@onrails/pattern";
var jsGenOpts = { annotateLet: None14, annotateCtor: None14, annotateParams: None14, annotateEmpty: None14, annotateLetin: None14, annotateCall: None14, guardBaseType: None14, flattenPipe: false, tupleHelper: false, preserveInfix: false, preserveJsx: false, moduleExt: ".js", docs: true };
var hook1 = _curry15(2, (h, x) => match14(h).with({ _tag: "None" }, () => None14).with({ _tag: "Some" }, ({ value: f }) => f(x)).exhaustive());
var hook2 = _curry15(3, (h, x, y) => match14(h).with({ _tag: "None" }, () => None14).with({ _tag: "Some" }, ({ value: f }) => f(x, y)).exhaustive());
var emptyNsCtor = _curry15(2, (con, ann) => match14(ann).with({ _tag: "None" }, () => `new ${con}()`).with({ _tag: "Some" }, ({ value: t }) => `new ${t}()`).exhaustive());
var isIdentStart = (c) => or7(or7(or7(and10(c >= 65, c <= 90), and10(c >= 97, c <= 122)), eq14(c, 95)), eq14(c, 36));
var isIdentPart = (c) => or7(isIdentStart(c), and10(c >= 48, c <= 57));
var identPartsFrom = _curry15(2, (s, i) => match14(_Str_codeAt6(i, s)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: c }) => and10(isIdentPart(c), identPartsFrom(s, i + 1))).exhaustive());
var isJsIdent = (s) => match14(_Str_codeAt6(0, s)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: c }) => and10(isIdentStart(c), identPartsFrom(s, 1))).exhaustive();
var isUpperStart3 = (s) => _Option_exists4((n) => and10(n >= 65, n <= 90), _Str_codeAt6(0, s));
var isNullaryCtor = _curry15(2, (name, keys) => _Option_exists4((ks) => eq14(length11(ks), 0), _Map_get7(name, keys)));
var isCtorRef = (fn) => match14(fn).with({ _tag: "ERef" }, ({ name }) => isUpperStart3(name)).otherwise(() => false);
var suffixOr = _curry15(2, (name, ann) => match14(ann).with({ _tag: "None" }, () => name).with({ _tag: "Some" }, ({ value: t }) => `${name}: ${t}`).exhaustive());
var bareParamAnnots = { generics: "", params: [] };
var paramAnnotsFor = _curry15(3, (h, sp, arity) => match14(h).with({ _tag: "None" }, () => bareParamAnnots).with({ _tag: "Some" }, ({ value: f }) => f(sp, arity)).exhaustive());
var annotatedParams = _curry15(3, (cparams, annots, i) => match14(_Array_get11(i, cparams)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: p }) => _Array_prepend7(suffixOr(genParam(p), _Option_unwrapOr7(None14, _Array_get11(i, annots))), annotatedParams(cparams, annots, i + 1))).exhaustive());
var castOr = _curry15(2, (js, ann) => match14(ann).with({ _tag: "None" }, () => js).with({ _tag: "Some" }, ({ value: t }) => `(${js} as ${t})`).exhaustive());
var bindRuntime = (monad) => eq14(monad, "Option") ? "_Option_flatMap" : eq14(monad, "Result") ? "_Result_flatMap" : "_Task_andThen";
var allOfFrom2 = _curry15(3, (f, xs, i) => match14(_Array_get11(i, xs)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: x }) => f(x) ? allOfFrom2(f, xs, i + 1) : false).exhaustive());
var allOf2 = _curry15(2, (f, xs) => allOfFrom2(f, xs, 0));
var someOfFrom3 = _curry15(3, (f, xs, i) => match14(_Array_get11(i, xs)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: x }) => f(x) ? true : someOfFrom3(f, xs, i + 1)).exhaustive());
var someOf3 = _curry15(2, (f, xs) => someOfFrom3(f, xs, 0));
var escChar2 = (c) => match14(c).with("\\", () => "\\\\").with('"', () => "\\\"").with(`
`, () => "\\n").with("\t", () => "\\t").otherwise(() => c);
var jsStringLit = (s) => `"${_Str_join5("", map9(escChar2, _Str_chars(s)))}"`;
var escTemplateLoop = _curry15(3, (chars, i0, acc0) => {
  let i = i0;
  let acc = acc0;
  while (true) {
    const _step = match14(_Array_get11(i, chars)).with({ _tag: "None" }, () => _done8(acc)).with({ _tag: "Some", value: "\\" }, () => _recur8(i + 1, `${acc}\\\\`)).with({ _tag: "Some", value: "`" }, () => _recur8(i + 1, `${acc}\\\``)).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value === "$" && _Option_contains3("{", _Array_get11(i + 1, chars));
    }, () => _recur8(i + 2, `${acc}\\\${`)).with({ _tag: "Some" }, ({ value: c }) => _recur8(i + 1, `${acc}${c}`)).exhaustive();
    if (_step._tag === "recur") {
      [i, acc] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var escapeTemplateLiteral = (s) => escTemplateLoop(_Str_chars(s), 0, "");
var keyAt = _curry15(3, (ctx, ctor, i) => match14(_Map_get7(ctor, ctx.keys)).with({ _tag: "Some" }, ({ value: ks }) => _Option_unwrapOr7(`_${show6(i)}`, _Array_get11(i, ks))).with({ _tag: "None" }, () => `_${show6(i)}`).exhaustive());
var nsRuntimeId = _curry15(3, (ctx, target, name) => match14(target).with({ _tag: "ERef" }, ({ name: refName }) => match14(_Map_get7(refName, ctx.ns)).with({ _tag: "Some" }, ({ value: members }) => _Map_get7(name, members)).with({ _tag: "None" }, () => None14).exhaustive()).otherwise(() => None14));
var emptyNsEmit = _curry15(3, (target, name, ann) => match14(target).with({ _tag: "ERef" }, ({ name: refName }) => eq14(name, "empty") ? eq14(refName, "Set") ? Some14(emptyNsCtor("Set", ann)) : eq14(refName, "Map") ? Some14(emptyNsCtor("Map", ann)) : eq14(refName, "List") ? Some14("_list(function* () {})") : None14 : None14).otherwise(() => None14));
var isLabeledParam3 = (p) => match14(p).with({ _tag: "LPLabeled" }, () => true).with({ _tag: "LPSpanned" }, ({ param: inner }) => isLabeledParam3(inner)).otherwise(() => false);
var splitLamParams2 = _curry15(3, (params, positional, labeled) => match14(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple8(positional, labeled)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => isLabeledParam3(p) ? splitLamParams2(rest, positional, _Array_append10(p, labeled)) : splitLamParams2(rest, _Array_append10(p, positional), labeled)).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var absorbParams = _curry15(4, (params, acc, fills, labN) => (([positional, labeled]) => {
  const acc1 = _Array_concat5(acc, positional);
  return match14(labeled).with((_v) => {
    const _g = _v;
    return _g.length === 0;
  }, () => _tuple8(acc1, fills, labN)).otherwise(() => ((labVar) => _tuple8(_Array_append10(LPName(labVar, None14), acc1), _Array_append10({ labVar, labs: labeled }, fills), labN + 1))(eq14(labN, 0) ? "$lab" : `$lab${show6(labN)}`));
})(splitLamParams2(params, [], [])));
var collapseLambdaFrom = _curry15(5, (params, body, acc, fills, labN) => (([acc1, fills1, labN1]) => match14(body).with({ _tag: "ELambda" }, ({ params: params2, body: body2 }) => collapseLambdaFrom(params2, body2, acc1, fills1, labN1)).otherwise(() => _tuple8(acc1, body, fills1)))(absorbParams(params, acc, fills, labN)));
var collapseLambda = _curry15(2, (params, body) => collapseLambdaFrom(params, body, [], [], 0));
var tsInfix = _curry15(3, (ctx, fn, args) => not8(ctx.preserveInfix) ? None14 : match14(_tuple8(fn, args)).with((_v) => {
  const _g = _v;
  return _g[0]._tag === "ERef" && _g[1].length === 2;
}, ([{ name }, [left, right]]) => match14(name).with("add", () => Some14(`(${genExpr(ctx, left)} + ${genExpr(ctx, right)})`)).with("sub", () => Some14(`(${genExpr(ctx, left)} - ${genExpr(ctx, right)})`)).with("mul", () => Some14(`(${genExpr(ctx, left)} * ${genExpr(ctx, right)})`)).with("div", () => Some14(`(${genExpr(ctx, left)} / ${genExpr(ctx, right)})`)).with("lt", () => Some14(`(${genExpr(ctx, left)} < ${genExpr(ctx, right)})`)).with("lte", () => Some14(`(${genExpr(ctx, left)} <= ${genExpr(ctx, right)})`)).with("gt", () => Some14(`(${genExpr(ctx, left)} > ${genExpr(ctx, right)})`)).with("gte", () => Some14(`(${genExpr(ctx, left)} >= ${genExpr(ctx, right)})`)).otherwise(() => None14)).otherwise(() => None14));
var jsxHasSpread = (children) => match14(children).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => false).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "SESpread";
}, () => true).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([, ...rest]) => jsxHasSpread(rest)).otherwise(() => {
  throw new Error("non-exhaustive match");
});
var jsxAttrs = _curry15(3, (ctx, fields, spread) => {
  const head = match14(spread).with({ _tag: "None" }, () => "").with({ _tag: "Some" }, ({ value }) => ` {...${genExpr(ctx, value)}}`).exhaustive();
  return `${head}${_Str_join5("", map9((f) => match14(f.value).with({ _tag: "EBool", value: true }, () => ` ${f.name}`).otherwise((value) => ` ${f.name}={${genExpr(ctx, value)}}`), fields))}`;
});
var tsxArgs = _curry15(2, (ctx, args) => match14(args).with((_v) => {
  const _g = _v;
  return _g.length === 3 && _g[1]._tag === "ERecord" && _g[2]._tag === "EArr";
}, ([tag, { fields, spread }, { elements: children }]) => jsxHasSpread(children) ? None14 : ((fragment) => ((name) => ((attrs) => and10(eq14(length11(children), 0), not8(fragment)) ? Some14(`<${name}${attrs} />`) : ((body) => fragment ? Some14(`<>${body}</>`) : Some14(`<${name}${attrs}>${body}</${name}>`))(_Str_join5("", map9((child) => match14(child).with({ _tag: "SEExpr" }, ({ expr: value }) => `{${genExpr(ctx, value)}}`).with({ _tag: "SESpread" }, () => "").exhaustive(), children))))(jsxAttrs(ctx, fields, spread)))(fragment ? "" : match14(tag).with({ _tag: "EStr" }, ({ value }) => value).otherwise(() => genMember(ctx, tag))))(match14(tag).with({ _tag: "EStr", value: "Fragment" }, () => true).otherwise(() => false))).otherwise(() => None14));
var tsxCall = _curry15(4, (ctx, fn, args, origin) => not8(ctx.preserveJsx) ? None14 : match14(origin).with({ _tag: "Some", value: "jsx" }, () => match14(fn).with({ _tag: "ERef", name: "h" }, () => tsxArgs(ctx, args)).otherwise(() => None14)).otherwise(() => None14));
var genExpr = _curry15(2, (ctx, e) => match14(e).with({ _tag: "ENum" }, ({ raw }) => raw).with({ _tag: "EUnit" }, () => "undefined").with({ _tag: "EBool" }, ({ value }) => value ? "true" : "false").with({ _tag: "EStr" }, ({ value }) => jsStringLit(value)).with({ _tag: "ERef" }, ({ name }) => castOr(name, isNullaryCtor(name, ctx.keys) ? hook1(ctx.annotateEmpty, e) : None14)).with({ _tag: "ECall" }, ({ fn, args, origin }) => match14(tsxCall(ctx, fn, args, origin)).with({ _tag: "Some" }, ({ value: jsx }) => jsx).with({ _tag: "None" }, () => match14(tsInfix(ctx, fn, args)).with({ _tag: "Some" }, ({ value: infix }) => infix).with({ _tag: "None" }, () => ((inner) => castOr(inner, isCtorRef(fn) ? hook1(ctx.annotateCall, e) : None14))(`${genCallee(ctx, fn)}(${_Str_join5(", ", map9((a) => genExpr(ctx, a), args))})`)).exhaustive()).exhaustive()).with({ _tag: "ELambda" }, ({ params, body, span: sp }) => (([cparams, cbody, fills]) => {
  const bound = fillNames(fills, paramNameSet(cparams, 0, _Set_fromArray5([])));
  const annots = paramAnnotsFor(ctx.annotateParams, sp, length11(cparams));
  const arrow = `${annots.generics}(${_Str_join5(", ", annotatedParams(cparams, annots.params, 0))}) => ${genLambdaBodyIn(ctx, cbody, bound, genFillDecls(ctx, fills))}`;
  return length11(cparams) >= 2 ? `_curry(${show6(length11(cparams))}, ${arrow})` : arrow;
})(collapseLambda(params, body))).with({ _tag: "ELetIn" }, ({ name, value, body }) => ((param) => `((${param}) => ${genLambdaBody(ctx, body)})(${genExpr(ctx, value)})`)(suffixOr(name, hook1(ctx.annotateLetin, value)))).with({ _tag: "ELetBind" }, ({ param, monad, value, body }) => ((rt) => ((f) => ((v) => ctx.flattenPipe ? `${rt}(${f}, ${v})` : `${rt}(${f})(${v})`)(genExpr(ctx, value)))(`(${genParam(param)}) => ${genLambdaBody(ctx, body)}`))(bindRuntime(monad))).with({ _tag: "EPipe" }, ({ left, right, fast, span: sp }) => fast ? match14(right).with({ _tag: "ECall" }, ({ fn: rfn, args: rargs, origin }) => genExpr(ctx, ECall(rfn, _Array_prepend7(left, rargs), origin, sp))).otherwise(() => genExpr(ctx, ECall(right, [left], None14, sp))) : match14(right).with((_v) => {
  const _g = _v;
  return _g._tag === "ECall" && (({ fn: rfn, args: rargs }) => ctx.flattenPipe)(_g);
}, ({ fn: rfn, args: rargs }) => `${genCallee(ctx, rfn)}(${_Str_join5(", ", map9((a) => genExpr(ctx, a), _Array_append10(left, rargs)))})`).otherwise(() => `${genCallee(ctx, right)}(${genExpr(ctx, left)})`)).with({ _tag: "EDo" }, ({ exprs }) => genDo(ctx, exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => `(${genExpr(ctx, cond)} ? ${genExpr(ctx, thenE)} : ${genExpr(ctx, elseE)})`).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => genMatch(ctx, scrutinee, arms)).with({ _tag: "ELoop" }, ({ params, body }) => `(() => { ${genLoopBlock(ctx, params, body)} })()`).with({ _tag: "ERecur" }, ({ args }) => `_recur(${_Str_join5(", ", map9((a) => genExpr(ctx, a), args))})`).with({ _tag: "ERecord" }, ({ fields, spread }) => ((fieldStrs) => match14(spread).with({ _tag: "None" }, () => eq14(length11(fields), 0) ? "{}" : `{ ${fieldStrs} }`).with({ _tag: "Some" }, ({ value: s }) => ((spreadStr) => eq14(length11(fields), 0) ? `{ ${spreadStr} }` : `{ ${spreadStr}, ${fieldStrs} }`)(`...${genExpr(ctx, s)}`)).exhaustive())(_Str_join5(", ", map9((f) => `${isJsIdent(f.name) ? f.name : jsStringLit(f.name)}: ${genExpr(ctx, f.value)}`, fields)))).with({ _tag: "EField" }, ({ target, name, optional }) => match14(emptyNsEmit(target, name, hook1(ctx.annotateEmpty, e))).with({ _tag: "Some" }, ({ value: js }) => js).with({ _tag: "None" }, () => match14(nsRuntimeId(ctx, target, name)).with({ _tag: "Some" }, ({ value: rt }) => rt).with({ _tag: "None" }, () => ((member) => optional ? `((v) => v != null ? { _tag: "Some", value: v } : { _tag: "None" })(${member})` : member)(`${genMember(ctx, target)}.${name}`)).exhaustive()).exhaustive()).with({ _tag: "ETuple" }, ({ elements }) => ((elems) => ctx.tupleHelper ? `_tuple(${elems})` : `[${elems}]`)(_Str_join5(", ", map9((el) => genExpr(ctx, el), elements)))).with({ _tag: "EArr" }, ({ elements }) => ((body) => castOr(body, eq14(length11(elements), 0) ? hook1(ctx.annotateEmpty, e) : None14))(`[${_Str_join5(", ", map9((el) => genSeqSlot(ctx, el), elements))}]`)).with({ _tag: "EList" }, ({ elements }) => genList(ctx, elements)).with({ _tag: "ESet" }, ({ elements }) => `new Set([${_Str_join5(", ", map9((el) => genSeqSlot(ctx, el), elements))}])`).with({ _tag: "EMap" }, ({ entries }) => match14(eq14(length11(entries), 0) ? hook1(ctx.annotateEmpty, e) : None14).with({ _tag: "Some" }, ({ value: t }) => `new ${t}()`).with({ _tag: "None" }, () => `new Map([${_Str_join5(", ", map9((en) => `[${genExpr(ctx, en.key)}, ${genExpr(ctx, en.value)}]`, entries))}])`).exhaustive()).with({ _tag: "EInterp" }, ({ parts }) => ((body) => `\`${body}\``)(_Str_join5("", map9((p) => match14(p).with({ _tag: "IPLit" }, ({ value }) => escapeTemplateLiteral(value)).with({ _tag: "IPExpr" }, ({ expr: ex }) => `\${${genExpr(ctx, ex)}}`).exhaustive(), parts)))).exhaustive());
var genDo = _curry15(2, (ctx, exprs) => `(() => { ${genDoSteps(ctx, exprs)} })()`);
var genDoSteps = _curry15(2, (ctx, exprs) => match14(exprs).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([last]) => `return ${genExpr(ctx, last)};`).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([first, ...rest]) => `${genExpr(ctx, first)}; ${genDoSteps(ctx, rest)}`).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => 'throw new Error("empty do block");').otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var genSeqSlot = _curry15(2, (ctx, el) => match14(el).with({ _tag: "SEExpr" }, ({ expr: ex }) => genExpr(ctx, ex)).with({ _tag: "SESpread" }, ({ expr: ex }) => `...${genExpr(ctx, ex)}`).exhaustive());
var genList = _curry15(2, (ctx, elements) => {
  const yields = _Str_join5(" ", map9((el) => match14(el).with({ _tag: "SEExpr" }, ({ expr: ex }) => `yield (${genExpr(ctx, ex)});`).with({ _tag: "SESpread" }, ({ expr: ex }) => `yield* (${genExpr(ctx, ex)});`).exhaustive(), elements));
  return `_list(function* () {${eq14(yields, "") ? "" : ` ${yields} `}})`;
});
var genParam = (p) => match14(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => genParam(inner)).with({ _tag: "LPName" }, ({ name }) => name).with({ _tag: "LPTuple" }, ({ names }) => `[${_Str_join5(", ", names)}]`).with({ _tag: "LPRecord" }, ({ fields }) => `{ ${_Str_join5(", ", fields)} }`).with({ _tag: "LPLabeled" }, ({ name }) => name).exhaustive();
var genCallee = _curry15(2, (ctx, e) => match14(e).with({ _tag: "ELambda" }, () => `(${genExpr(ctx, e)})`).otherwise(() => genExpr(ctx, e)));
var genMember = _curry15(2, (ctx, e) => match14(e).with({ _tag: "ERecord" }, () => `(${genExpr(ctx, e)})`).with({ _tag: "ELambda" }, () => `(${genExpr(ctx, e)})`).otherwise(() => genExpr(ctx, e)));
var seqElemExpr3 = (el) => match14(el).with({ _tag: "SEExpr" }, ({ expr: e }) => e).with({ _tag: "SESpread" }, ({ expr: e }) => e).exhaustive();
var hasRecur = (e) => match14(e).with({ _tag: "ERecur" }, () => true).with({ _tag: "ELoop" }, () => false).with({ _tag: "ELambda" }, () => false).with({ _tag: "ELetBind" }, () => false).with({ _tag: "EInterp" }, ({ parts }) => someOf3((p) => match14(p).with({ _tag: "IPExpr" }, ({ expr: x }) => hasRecur(x)).with({ _tag: "IPLit" }, () => false).exhaustive(), parts)).with({ _tag: "ECall" }, ({ fn, args }) => or7(hasRecur(fn), someOf3(hasRecur, args))).with({ _tag: "ELetIn" }, ({ value, body }) => or7(hasRecur(value), hasRecur(body))).with({ _tag: "EPipe" }, ({ left, right }) => or7(hasRecur(left), hasRecur(right))).with({ _tag: "EDo" }, ({ exprs }) => someOf3(hasRecur, exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => or7(hasRecur(cond), or7(hasRecur(thenE), hasRecur(elseE)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => or7(hasRecur(scrutinee), someOf3((a) => or7(match14(a.guard).with({ _tag: "Some" }, ({ value: g }) => hasRecur(g)).with({ _tag: "None" }, () => false).exhaustive(), hasRecur(a.body)), arms))).with({ _tag: "ERecord" }, ({ fields, spread }) => or7(match14(spread).with({ _tag: "Some" }, ({ value: sp }) => hasRecur(sp)).with({ _tag: "None" }, () => false).exhaustive(), someOf3((f) => hasRecur(f.value), fields))).with({ _tag: "EField" }, ({ target }) => hasRecur(target)).with({ _tag: "ETuple" }, ({ elements }) => someOf3(hasRecur, elements)).with({ _tag: "EArr" }, ({ elements }) => someOf3((el) => hasRecur(seqElemExpr3(el)), elements)).with({ _tag: "EList" }, ({ elements }) => someOf3((el) => hasRecur(seqElemExpr3(el)), elements)).with({ _tag: "ESet" }, ({ elements }) => someOf3((el) => hasRecur(seqElemExpr3(el)), elements)).with({ _tag: "EMap" }, ({ entries }) => someOf3((en) => or7(hasRecur(en.key), hasRecur(en.value)), entries)).otherwise(() => false);
var loopNeedsStep = (e) => match14(e).with({ _tag: "ETernary" }, ({ thenE, elseE }) => or7(loopNeedsStep(thenE), loopNeedsStep(elseE))).with({ _tag: "ELetIn" }, ({ body }) => loopNeedsStep(body)).with({ _tag: "EDo" }, ({ exprs }) => loopNeedsStep(lastDoExpr(exprs))).with({ _tag: "EMatch" }, () => hasRecur(e)).otherwise(() => false);
var lastDoExpr = (exprs) => match14(exprs).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([last]) => last).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([, ...rest]) => lastDoExpr(rest)).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => EUnit({ start: 0, end: 0 })).otherwise(() => {
  throw new Error("non-exhaustive match");
});
var wrapStepTails = _curry15(2, (e, sp) => match14(e).with({ _tag: "ERecur" }, () => e).with({ _tag: "ETernary" }, ({ cond, thenE, elseE, span: tsp }) => ETernary(cond, wrapStepTails(thenE, sp), wrapStepTails(elseE, sp), tsp)).with({ _tag: "ELetIn" }, ({ name, nameSpan, annot, value, body, span: lsp }) => ELetIn(name, nameSpan, annot, value, wrapStepTails(body, sp), lsp)).with({ _tag: "EDo" }, ({ exprs, span: dsp }) => EDo(wrapDoStepTail(exprs, sp), dsp)).with({ _tag: "EMatch" }, ({ scrutinee, arms, span: msp }) => EMatch(scrutinee, map9((a) => ({ pattern: a.pattern, guard: a.guard, body: wrapStepTails(a.body, sp) }), arms), msp)).otherwise(() => ECall(ERef("_done", sp), [e], None14, sp)));
var wrapDoStepTail = _curry15(2, (exprs, sp) => match14(exprs).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([last]) => [wrapStepTails(last, sp)]).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([first, ...rest]) => [first, ...wrapDoStepTail(rest, sp)]).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => []).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var loopParamNames = (params) => _Str_join5(", ", map9((p) => p.name, params));
var genLoopTail = _curry15(3, (ctx, e, params) => match14(e).with({ _tag: "ERecur" }, ({ args }) => match14(_tuple8(params, args)).with((_v) => {
  const _g = _v;
  return _g[0].length === 1 && _g[1].length === 1;
}, ([[p], [a]]) => `${p.name} = ${genExpr(ctx, a)}; continue;`).otherwise(() => `[${loopParamNames(params)}] = [${_Str_join5(", ", map9((a) => genExpr(ctx, a), args))}]; continue;`)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => hasRecur(e) ? `if (${genExpr(ctx, cond)}) { ${genLoopTail(ctx, thenE, params)} } else { ${genLoopTail(ctx, elseE, params)} }` : `return ${genExpr(ctx, e)};`).with({ _tag: "ELetIn" }, ({ name, value, body }) => hasRecur(e) ? `{ const ${suffixOr(name, hook1(ctx.annotateLetin, value))} = ${genExpr(ctx, value)}; ${genLoopTail(ctx, body, params)} }` : `return ${genExpr(ctx, e)};`).with({ _tag: "EDo" }, ({ exprs }) => hasRecur(e) ? `{ ${genDoLoopTail(ctx, exprs, params)} }` : `return ${genExpr(ctx, e)};`).with({ _tag: "EMatch" }, ({ span: sp }) => hasRecur(e) ? ((step) => ((rebind) => `const _step = ${step}; if (_step._tag === ${jsStringLit("recur")}) { ${rebind} continue; } return _step.value;`)(match14(params).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([p]) => `${p.name} = _step.args[0];`).otherwise(() => `[${loopParamNames(params)}] = _step.args;`)))(genExpr(ctx, wrapStepTails(e, sp))) : `return ${genExpr(ctx, e)};`).otherwise(() => `return ${genExpr(ctx, e)};`));
var genDoLoopTail = _curry15(3, (ctx, exprs, params) => match14(exprs).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([last]) => genLoopTail(ctx, last, params)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([first, ...rest]) => `${genExpr(ctx, first)}; ${genDoLoopTail(ctx, rest, params)}`).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => "return undefined;").otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var genLoopBlock = _curry15(3, (ctx, params, body) => {
  const decls = _Str_join5(" ", map9((p) => `let ${suffixOr(p.name, hook1(ctx.annotateLetin, p.init))} = ${genExpr(ctx, p.init)};`, params));
  return `${decls} while (true) { ${genLoopTail(ctx, body, params)} }`;
});
var loopParamFree = _curry15(3, (params, i, seen) => match14(_Array_get11(i, params)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: p }) => _Set_has5(p.name, seen) ? false : loopParamFree(params, i + 1, seen)).exhaustive());
var genLambdaBody = _curry15(2, (ctx, e) => match14(e).with({ _tag: "ERecord" }, () => `(${genExpr(ctx, e)})`).otherwise(() => genExpr(ctx, e)));
var paramNames = (p) => match14(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => paramNames(inner)).with({ _tag: "LPName" }, ({ name }) => [name]).with({ _tag: "LPTuple" }, ({ names }) => names).with({ _tag: "LPRecord" }, ({ fields }) => fields).with({ _tag: "LPLabeled" }, ({ name }) => [name]).exhaustive();
var genLabeledFill = _curry15(3, (ctx, labVar, lab) => match14(lab).with({ _tag: "LPSpanned" }, ({ param: inner }) => genLabeledFill(ctx, labVar, inner)).with({ _tag: "LPLabeled" }, ({ name, optional, defaultValue }) => ((access) => match14(defaultValue).with({ _tag: "Some" }, ({ value: d }) => `const ${name} = ${access} != null ? ${access} : ${genExpr(ctx, d)};`).with({ _tag: "None" }, () => optional ? `const ${name} = ${access} != null ? { _tag: "Some", value: ${access} } : { _tag: "None" };` : `const ${name} = ${access};`).exhaustive())(`(${labVar} ?? {}).${name}`)).otherwise(() => ""));
var genFillDecls = _curry15(2, (ctx, fills) => match14(fills).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => "").otherwise(() => `${_Str_join5(" ", map9((g) => _Str_join5(" ", map9((lab) => genLabeledFill(ctx, g.labVar, lab), g.labs)), fills))} `));
var fillNames = _curry15(2, (fills, acc) => match14(fills).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([g, ...rest]) => fillNames(rest, reduce3(_curry15(2, (s, lab) => match14(lab).with({ _tag: "LPSpanned" }, ({ param: inner }) => match14(inner).with({ _tag: "LPLabeled" }, ({ name }) => _Set_add5(name, s)).otherwise(() => s)).with({ _tag: "LPLabeled" }, ({ name }) => _Set_add5(name, s)).otherwise(() => s)), acc, g.labs))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var addNames = _curry15(3, (names, i, acc) => match14(_Array_get11(i, names)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: n }) => addNames(names, i + 1, _Set_add5(n, acc))).exhaustive());
var paramNameSet = _curry15(3, (params, i, acc) => match14(_Array_get11(i, params)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => paramNameSet(params, i + 1, addNames(paramNames(p), 0, acc))).exhaustive());
var letBlockLoop = _curry15(4, (ctx, e, seen, decls) => match14(e).with({ _tag: "ELetIn" }, ({ name, value, body }) => or7(_Set_has5(name, seen), match14(value).with({ _tag: "ELambda" }, () => false).otherwise(() => _Set_has5(name, exprRefs(ctx, value, _Set_fromArray5([]))))) ? _tuple8(decls, e, seen) : letBlockLoop(ctx, body, _Set_add5(name, seen), _Array_append10(`const ${suffixOr(name, hook1(ctx.annotateLetin, value))} = ${genExpr(ctx, value)};`, decls))).otherwise(() => _tuple8(decls, e, seen)));
var genLambdaBodyIn = _curry15(4, (ctx, e, bound, prefix) => (([decls, rest, seen]) => eq14(length11(decls), 0) ? match14(e).with({ _tag: "ELoop" }, ({ params, body }) => loopParamFree(params, 0, bound) ? `{ ${prefix}${genLoopBlock(ctx, params, body)} }` : eq14(prefix, "") ? genLambdaBody(ctx, e) : `{ ${prefix}return ${genLambdaBody(ctx, e)}; }`).otherwise(() => eq14(prefix, "") ? genLambdaBody(ctx, e) : `{ ${prefix}return ${genLambdaBody(ctx, e)}; }`) : ((block) => match14(rest).with({ _tag: "ELoop" }, ({ params, body }) => loopParamFree(params, 0, seen) ? `{ ${prefix}${block} ${genLoopBlock(ctx, params, body)} }` : `{ ${prefix}${block} return ${genExpr(ctx, rest)}; }`).otherwise(() => `{ ${prefix}${block} return ${genExpr(ctx, rest)}; }`))(_Str_join5(" ", decls)))(letBlockLoop(ctx, e, bound, [])));
var isCatchAll2 = (p) => match14(p).with({ _tag: "PAs" }, ({ pat }) => isCatchAll2(pat)).with({ _tag: "PWild" }, () => true).with({ _tag: "PUnit" }, () => true).with({ _tag: "PBind" }, () => true).with({ _tag: "PRecord" }, ({ fields }) => allOf2((f) => isCatchAll2(f.pat), fields)).with({ _tag: "PTuple" }, ({ elems }) => allOf2(isCatchAll2, elems)).with({ _tag: "PArr" }, ({ elems, rest }) => and10(eq14(length11(elems), 0), _Option_isSome3(rest))).with({ _tag: "PList" }, ({ elems, rest }) => and10(eq14(length11(elems), 0), _Option_isSome3(rest))).otherwise(() => false);
var isPList2 = (p) => match14(p).with({ _tag: "PList" }, () => true).otherwise(() => false);
var keyedSlot = _curry15(2, (key, sub4) => eq14(sub4, key) ? key : `${key}: ${sub4}`);
var pctorEntries = _curry15(4, (ctx, ctor, args, i) => match14(_Array_get11(i, args)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: a }) => ((s) => ((restEntries) => eq14(s, "") ? restEntries : _Array_prepend7(keyedSlot(keyAt(ctx, ctor, i), s), restEntries))(pctorEntries(ctx, ctor, args, i + 1)))(patSlot(ctx, a))).exhaustive());
var precordEntries = _curry15(3, (ctx, fields, i) => match14(_Array_get11(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => ((s) => ((restEntries) => eq14(s, "") ? restEntries : _Array_prepend7(keyedSlot(f.label, s), restEntries))(precordEntries(ctx, fields, i + 1)))(patSlot(ctx, f.pat))).exhaustive());
var patSlot = _curry15(2, (ctx, p) => match14(p).with({ _tag: "PAs" }, ({ pat, name }) => ((inner) => eq14(inner, "") ? name : `${inner}, ${name}`)(patSlot(ctx, pat))).with({ _tag: "PBind" }, ({ name }) => name).with({ _tag: "PWild" }, () => "").with({ _tag: "PUnit" }, () => "").with({ _tag: "PLit" }, () => "").with({ _tag: "PBool" }, () => "").with({ _tag: "PStr" }, () => "").with({ _tag: "PList" }, () => "").with({ _tag: "PCtor" }, ({ ctor, args }) => ((entries) => eq14(length11(entries), 0) ? "" : `{ ${_Str_join5(", ", entries)} }`)(pctorEntries(ctx, ctor, args, 0))).with({ _tag: "PRecord" }, ({ fields }) => ((entries) => eq14(length11(entries), 0) ? "" : `{ ${_Str_join5(", ", entries)} }`)(precordEntries(ctx, fields, 0))).with({ _tag: "PTuple" }, ({ elems }) => ((slots) => someOf3((s) => not8(eq14(s, "")), slots) ? `[${_Str_join5(", ", slots)}]` : "")(map9((el) => patSlot(ctx, el), elems))).with({ _tag: "PArr" }, ({ elems, rest }) => ((slots) => ((slots2) => someOf3((s) => not8(eq14(s, "")), slots2) ? `[${_Str_join5(", ", slots2)}]` : "")(match14(rest).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PBind";
}, ({ value: { name } }) => _Array_append10(`...${name}`, slots)).otherwise(() => slots)))(map9((el) => patSlot(ctx, el), elems))).with({ _tag: "POr" }, ({ alts }) => match14(_Array_head5(alts)).with({ _tag: "Some" }, ({ value: first }) => patSlot(ctx, first)).with({ _tag: "None" }, () => "").exhaustive()).exhaustive());
var pctorConds = _curry15(5, (ctx, ctor, args, i, path) => match14(_Array_get11(i, args)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: a }) => _Array_concat5(patConds(ctx, a, `${path}.${keyAt(ctx, ctor, i)}`), pctorConds(ctx, ctor, args, i + 1, path))).exhaustive());
var precordConds = _curry15(4, (ctx, fields, i, path) => match14(_Array_get11(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => _Array_concat5(patConds(ctx, f.pat, `${path}.${f.label}`), precordConds(ctx, fields, i + 1, path))).exhaustive());
var ptupleConds = _curry15(4, (ctx, elems, i, path) => match14(_Array_get11(i, elems)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: el }) => _Array_concat5(patConds(ctx, el, `${path}[${show6(i)}]`), ptupleConds(ctx, elems, i + 1, path))).exhaustive());
var parrConds = _curry15(4, (ctx, elems, i, path) => match14(_Array_get11(i, elems)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: el }) => _Array_concat5(patConds(ctx, el, `${path}[${show6(i)}]`), parrConds(ctx, elems, i + 1, path))).exhaustive());
var patConds = _curry15(3, (ctx, p, path) => match14(p).with({ _tag: "PAs" }, ({ pat }) => patConds(ctx, pat, path)).with({ _tag: "PWild" }, () => []).with({ _tag: "PUnit" }, () => []).with({ _tag: "PBind" }, () => []).with({ _tag: "PList" }, () => []).with({ _tag: "PLit" }, () => [`${path} === ${litValue(p)}`]).with({ _tag: "PBool" }, () => [`${path} === ${litValue(p)}`]).with({ _tag: "PStr" }, () => [`${path} === ${litValue(p)}`]).with({ _tag: "PCtor" }, ({ ctor, args }) => _Array_prepend7(`${path}._tag === ${jsStringLit(ctor)}`, pctorConds(ctx, ctor, args, 0, path))).with({ _tag: "PRecord" }, ({ fields }) => precordConds(ctx, fields, 0, path)).with({ _tag: "PTuple" }, ({ elems }) => ptupleConds(ctx, elems, 0, path)).with({ _tag: "PArr" }, ({ elems, rest }) => _Array_prepend7(`${path}.length ${_Option_isSome3(rest) ? ">=" : "==="} ${show6(length11(elems))}`, parrConds(ctx, elems, 0, path))).with({ _tag: "POr" }, ({ alts }) => ((altCond) => [_Str_join5(" || ", map9((alt) => `(${altCond(alt)})`, alts))])((alt) => {
  const conds = patConds(ctx, alt, path);
  return eq14(length11(conds), 0) ? "true" : _Str_join5(" && ", map9((c) => `(${c})`, conds));
})).exhaustive());
var catchAllParam = _curry15(2, (ctx, p) => match14(p).with({ _tag: "PArr" }, ({ rest }) => match14(rest).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PBind";
}, ({ value: { name } }) => `(${name})`).otherwise(() => "()")).with({ _tag: "PList" }, ({ rest }) => match14(rest).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PBind";
}, ({ value: { name } }) => `(${name})`).otherwise(() => "()")).otherwise(() => ((slot) => eq14(slot, "") ? "()" : `(${slot})`)(patSlot(ctx, p))));
var isListMatch = (arms) => someOf3((a) => and10(isPList2(a.pattern), not8(isCatchAll2(a.pattern))), arms);
var listTail = (from) => concat(concat(concat("_list(function* () { for (let _i = ", show6(from)), "; _i < _b.length; _i++) yield _b[_i]; "), "if (!_done) { let _s; while (!(_s = _it.next()).done) yield _s.value; } })");
var listArmGuards = _curry15(3, (ctx, elems, i) => match14(_Array_get11(i, elems)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: el }) => _Array_concat5(patConds(ctx, el, `_b[${show6(i)}]`), listArmGuards(ctx, elems, i + 1))).exhaustive());
var listArmBinds = _curry15(3, (ctx, elems, i) => match14(_Array_get11(i, elems)).with({ _tag: "None" }, () => _tuple8([], [])).with({ _tag: "Some" }, ({ value: el }) => (([restParams, restArgs]) => {
  const slot = patSlot(ctx, el);
  return eq14(slot, "") ? _tuple8(restParams, restArgs) : _tuple8(_Array_prepend7(slot, restParams), _Array_prepend7(`_b[${show6(i)}]`, restArgs));
})(listArmBinds(ctx, elems, i + 1))).exhaustive());
var genListArm = _curry15(3, (ctx, p, body) => match14(p).with({ _tag: "PList" }, ({ elems, rest }) => ((n) => ((guards) => ((head) => ((cond) => (([params0, args0]) => (([params, args]) => `  if (${cond}) return ((${_Str_join5(", ", params)}) => ${genLambdaBody(ctx, body)})(${_Str_join5(", ", args)});`)(match14(rest).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PBind";
}, ({ value: { name } }) => _tuple8(_Array_append10(name, params0), _Array_append10(listTail(n), args0))).otherwise(() => _tuple8(params0, args0))))(listArmBinds(ctx, elems, 0)))(_Str_join5(" && ", _Array_prepend7(head, guards))))(_Option_isSome3(rest) ? `_pull(${show6(n)})` : `!_pull(${show6(n + 1)}) && _b.length === ${show6(n)}`))(listArmGuards(ctx, elems, 0)))(length11(elems))).otherwise(() => ""));
var listMatchLoop = _curry15(3, (ctx, arms, i) => match14(_Array_get11(i, arms)).with({ _tag: "None" }, () => _tuple8([], '(() => { throw new Error("non-exhaustive lazy-list switch"); })()')).with({ _tag: "Some" }, ({ value: a }) => and10(isPList2(a.pattern), not8(isCatchAll2(a.pattern))) ? (([restLines, fallback]) => _tuple8(_Array_prepend7(genListArm(ctx, a.pattern, a.body), restLines), fallback))(listMatchLoop(ctx, arms, i + 1)) : isCatchAll2(a.pattern) ? ((restName) => ((fallback) => _tuple8([], fallback))(match14(restName).with({ _tag: "Some" }, ({ value: name }) => `((${name}) => ${genLambdaBody(ctx, a.body)})(${listTail(0)})`).with({ _tag: "None" }, () => genExpr(ctx, a.body)).exhaustive()))(match14(a.pattern).with((_v) => {
  const _g = _v;
  return _g._tag === "PList" && _g.rest._tag === "Some" && _g.rest.value._tag === "PBind";
}, ({ rest: { value: { name } } }) => Some14(name)).otherwise(() => None14)) : listMatchLoop(ctx, arms, i + 1)).exhaustive());
var genListMatch = _curry15(3, (ctx, scrutinee, arms) => (([armLines, fallback]) => concat(concat(concat(concat(concat(concat(concat(concat("((_it) => { const _b = []; let _done = false; ", "const _pull = (_n) => { while (_b.length < _n && !_done) { const _s = _it.next(); "), `if (_s.done) _done = true; else _b.push(_s.value); } return _b.length >= _n; };
`), _Str_join5(`
`, armLines)), `
  return `), fallback), `;
})(`), genExpr(ctx, scrutinee)), "[Symbol.iterator]())"))(listMatchLoop(ctx, arms, 0)));
var matchArmsLoop = _curry15(4, (ctx, arms, i, base) => match14(_Array_get11(i, arms)).with({ _tag: "None" }, () => _tuple8([], None14)).with({ _tag: "Some" }, ({ value: a }) => (([restLines, restCatch]) => match14(a.guard).with({ _tag: "Some" }, ({ value: g }) => _tuple8(_Array_prepend7(`  ${genGuardArm(ctx, a.pattern, a.body, Some14(g), base)}`, restLines), restCatch)).with({ _tag: "None" }, () => isCatchAll2(a.pattern) ? _tuple8(restLines, Some14(_tuple8(a.pattern, a.body))) : _tuple8(_Array_prepend7(`  ${genWithArm(ctx, a.pattern, a.body, base)}`, restLines), restCatch)).exhaustive())(matchArmsLoop(ctx, arms, i + 1, base))).exhaustive());
var hasArrArm = (arms) => someOf3((a) => match14(a.pattern).with({ _tag: "PArr" }, () => true).otherwise(() => false), arms);
var genMatch = _curry15(3, (ctx, scrutinee, arms) => isListMatch(arms) ? genListMatch(ctx, scrutinee, arms) : ((base) => (([armLines, catchAll]) => {
  const tail = match14(catchAll).with((_v) => {
    const _g = _v;
    return _g._tag === "Some";
  }, ({ value: [p, body] }) => `  .otherwise(${catchAllParam(ctx, p)} => ${genLambdaBody(ctx, body)})`).with({ _tag: "None" }, () => and10(_Option_isSome3(ctx.guardBaseType), hasArrArm(arms)) ? '  .otherwise(() => { throw new Error("non-exhaustive match"); })' : "  .exhaustive()").exhaustive();
  return _Str_join5(`
`, _Array_concat5(_Array_prepend7(`match(${genExpr(ctx, scrutinee)})`, armLines), [tail]));
})(matchArmsLoop(ctx, arms, 0, base)))(hook1(ctx.guardBaseType, scrutinee)));
var litValue = (p) => match14(p).with({ _tag: "PStr" }, ({ value: v }) => jsStringLit(v)).with({ _tag: "PLit" }, ({ raw }) => raw).with({ _tag: "PBool" }, ({ value: v }) => v ? "true" : "false").otherwise(() => "");
var fieldRefine = _curry15(3, (ctx, p, fieldBase) => match14(p).with({ _tag: "PCtor" }, () => Some14(patTarget(ctx, p, fieldBase))).with({ _tag: "PRecord" }, () => ((t) => eq14(t, fieldBase) ? None14 : Some14(t))(patTarget(ctx, p, fieldBase))).with({ _tag: "PTuple" }, () => ((t) => eq14(t, fieldBase) ? None14 : Some14(t))(patTarget(ctx, p, fieldBase))).with({ _tag: "PArr" }, () => ((t) => eq14(t, fieldBase) ? None14 : Some14(t))(patTarget(ctx, p, fieldBase))).otherwise(() => None14));
var ctorRefines = _curry15(5, (ctx, args, keys, member, i) => match14(_Array_get11(i, args)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: a }) => ((rest) => ((key) => match14(fieldRefine(ctx, a, `${member}[${jsStringLit(key)}]`)).with({ _tag: "Some" }, ({ value: sub4 }) => _Array_prepend7(`${jsStringLit(key)}: ${sub4}`, rest)).with({ _tag: "None" }, () => rest).exhaustive())(_Option_unwrapOr7(`_${show6(i)}`, _Array_get11(i, keys))))(ctorRefines(ctx, args, keys, member, i + 1))).exhaustive());
var recordRefines = _curry15(4, (ctx, fields, base, i) => match14(_Array_get11(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => ((rest) => match14(fieldRefine(ctx, f.pat, `${base}[${jsStringLit(f.label)}]`)).with({ _tag: "Some" }, ({ value: sub4 }) => _Array_prepend7(`${jsStringLit(f.label)}: ${sub4}`, rest)).with({ _tag: "None" }, () => rest).exhaustive())(recordRefines(ctx, fields, base, i + 1))).exhaustive());
var tupleSlotBase = _curry15(2, (base, i) => `(${base})[${show6(i)}]`);
var tupleTargets = _curry15(4, (ctx, elems, base, i) => match14(_Array_get11(i, elems)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: el }) => ((slotBase) => _Array_prepend7(_Option_unwrapOr7(slotBase, fieldRefine(ctx, el, slotBase)), tupleTargets(ctx, elems, base, i + 1)))(tupleSlotBase(base, i))).exhaustive());
var tupleRefines = _curry15(4, (ctx, elems, base, i) => match14(_Array_get11(i, elems)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: el }) => or7(_Option_isSome3(fieldRefine(ctx, el, tupleSlotBase(base, i))), tupleRefines(ctx, elems, base, i + 1))).exhaustive());
var arrTargets = _curry15(4, (ctx, elems, elemBase, i) => match14(_Array_get11(i, elems)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: el }) => _Array_prepend7(_Option_unwrapOr7(elemBase, fieldRefine(ctx, el, elemBase)), arrTargets(ctx, elems, elemBase, i + 1))).exhaustive());
var arrRefines = _curry15(4, (ctx, elems, elemBase, i) => match14(_Array_get11(i, elems)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: el }) => or7(_Option_isSome3(fieldRefine(ctx, el, elemBase)), arrRefines(ctx, elems, elemBase, i + 1))).exhaustive());
var patTarget = _curry15(3, (ctx, p, base) => match14(p).with({ _tag: "PAs" }, ({ pat }) => patTarget(ctx, pat, base)).with({ _tag: "PCtor" }, ({ ctor, args }) => ((member) => ((keys) => ((refines) => eq14(length11(refines), 0) ? member : `${member} & { ${_Str_join5("; ", refines)} }`)(ctorRefines(ctx, args, keys, member, 0)))(_Option_unwrapOr7([], _Map_get7(ctor, ctx.keys))))(`Extract<${base}, { _tag: ${jsStringLit(ctor)} }>`)).with({ _tag: "PRecord" }, ({ fields }) => ((refines) => eq14(length11(refines), 0) ? base : `${base} & { ${_Str_join5("; ", refines)} }`)(recordRefines(ctx, fields, base, 0))).with({ _tag: "PTuple" }, ({ elems }) => not8(tupleRefines(ctx, elems, base, 0)) ? base : `[${_Str_join5(", ", tupleTargets(ctx, elems, base, 0))}]`).with({ _tag: "PArr" }, ({ elems, rest: restOpt }) => ((elemBase) => not8(arrRefines(ctx, elems, elemBase, 0)) ? base : ((heads) => match14(restOpt).with({ _tag: "Some" }, () => `[${heads}, ...${base}]`).with({ _tag: "None" }, () => `[${heads}]`).exhaustive())(_Str_join5(", ", arrTargets(ctx, elems, elemBase, 0))))(`(${base})[number]`)).otherwise(() => base));
var genGuardArm = _curry15(5, (ctx, p, body, guardOpt, base) => {
  const root = _Option_isSome3(base) ? "_g" : "_v";
  const conds0 = patConds(ctx, p, root);
  const slot = match14(p).with({ _tag: "PAs" }, ({ pat }) => patSlot(ctx, pat)).otherwise(() => patSlot(ctx, p));
  const conds = match14(guardOpt).with({ _tag: "Some" }, ({ value: g }) => match14(p).with({ _tag: "PAs" }, ({ name }) => _Array_append10(eq14(slot, "") ? `((${name}) => ${genExpr(ctx, g)})(${root})` : `((${name}) => ((${slot}) => ${genExpr(ctx, g)})(${name}))(${root})`, conds0)).otherwise(() => _Array_append10(eq14(slot, "") ? `(${genExpr(ctx, g)})` : `((${slot}) => ${genExpr(ctx, g)})(${root})`, conds0))).with({ _tag: "None" }, () => conds0).exhaustive();
  const test = eq14(length11(conds), 0) ? "true" : _Str_join5(" && ", conds);
  const handler = match14(p).with({ _tag: "PAs" }, ({ name }) => `(${name}) => ${eq14(slot, "") ? genLambdaBody(ctx, body) : `((${slot}) => ${genLambdaBody(ctx, body)})(${name})`}`).otherwise(() => `${eq14(slot, "") ? "()" : `(${slot})`} => ${genLambdaBody(ctx, body)}`);
  return match14(base).with({ _tag: "None" }, () => `.with((_v) => ${test}, ${handler})`).with({ _tag: "Some" }, ({ value: b }) => ((target) => eq14(target, b) ? `.with((_v) => { const _g: any = _v; return ${test}; }, ${handler})` : `.with((_v): _v is ${target} => { const _g: any = _v; return ${test}; }, ${handler})`)(patTarget(ctx, p, b))).exhaustive();
});
var isFlatSub = (p) => match14(p).with({ _tag: "PAs" }, () => false).with({ _tag: "PBind" }, () => true).with({ _tag: "PWild" }, () => true).with({ _tag: "PLit" }, () => true).with({ _tag: "PBool" }, () => true).with({ _tag: "PStr" }, () => true).otherwise(() => false);
var recordLits = _curry15(2, (fields, i) => match14(_Array_get11(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => ((rest) => match14(f.pat).with({ _tag: "PLit" }, () => _Array_prepend7(`${f.label}: ${litValue(f.pat)}`, rest)).with({ _tag: "PBool" }, () => _Array_prepend7(`${f.label}: ${litValue(f.pat)}`, rest)).with({ _tag: "PStr" }, () => _Array_prepend7(`${f.label}: ${litValue(f.pat)}`, rest)).otherwise(() => rest))(recordLits(fields, i + 1))).exhaustive());
var ctorArgParts = _curry15(4, (ctx, ctor, args, i) => match14(_Array_get11(i, args)).with({ _tag: "None" }, () => _tuple8([], [])).with({ _tag: "Some" }, ({ value: a }) => (([restBinds, restLits]) => {
  const key = keyAt(ctx, ctor, i);
  return match14(a).with({ _tag: "PBind" }, ({ name }) => _tuple8(_Array_prepend7(keyedSlot(key, name), restBinds), restLits)).with({ _tag: "PLit" }, () => _tuple8(restBinds, _Array_prepend7(`${key}: ${litValue(a)}`, restLits))).with({ _tag: "PBool" }, () => _tuple8(restBinds, _Array_prepend7(`${key}: ${litValue(a)}`, restLits))).with({ _tag: "PStr" }, () => _tuple8(restBinds, _Array_prepend7(`${key}: ${litValue(a)}`, restLits))).otherwise(() => _tuple8(restBinds, restLits));
})(ctorArgParts(ctx, ctor, args, i + 1))).exhaustive());
var genWithArm = _curry15(4, (ctx, p, body, base) => match14(p).with({ _tag: "PAs" }, () => genGuardArm(ctx, p, body, None14, base)).with({ _tag: "PArr" }, () => genGuardArm(ctx, p, body, None14, base)).with({ _tag: "PTuple" }, () => genGuardArm(ctx, p, body, None14, base)).with({ _tag: "POr" }, () => genGuardArm(ctx, p, body, None14, base)).with({ _tag: "PLit" }, () => `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`).with({ _tag: "PBool" }, () => `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`).with({ _tag: "PStr" }, () => `.with(${litValue(p)}, () => ${genLambdaBody(ctx, body)})`).with({ _tag: "PRecord" }, ({ fields }) => allOf2((f) => isFlatSub(f.pat), fields) ? ((lits) => ((slot) => `.with({ ${_Str_join5(", ", lits)} }, ${eq14(slot, "") ? "()" : `(${slot})`} => ${genLambdaBody(ctx, body)})`)(patSlot(ctx, p)))(recordLits(fields, 0)) : genGuardArm(ctx, p, body, None14, base)).with({ _tag: "PCtor" }, ({ ctor, args }) => allOf2(isFlatSub, args) ? (([binds, litFields]) => {
  const patObj = _Str_join5(", ", _Array_prepend7(`_tag: ${jsStringLit(ctor)}`, litFields));
  const param = eq14(length11(binds), 0) ? "()" : `({ ${_Str_join5(", ", binds)} })`;
  return `.with({ ${patObj} }, ${param} => ${genLambdaBody(ctx, body)})`;
})(ctorArgParts(ctx, ctor, args, 0)) : genGuardArm(ctx, p, body, None14, base)).otherwise(() => genGuardArm(ctx, p, body, None14, base)));
var typedCtorParams = _curry15(3, (keys, paramTypes, i) => match14(_Array_get11(i, keys)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: k }) => _Array_prepend7(`${k}: ${_Option_unwrapOr7("unknown", _Array_get11(i, paramTypes))}`, typedCtorParams(keys, paramTypes, i + 1))).exhaustive());
var genCtor = _curry15(2, (c, ts) => {
  const tag = jsStringLit(c.name);
  return eq14(length11(c.fields), 0) ? match14(ts).with({ _tag: "Some" }, ({ value: t }) => `const ${c.name}: ${t.retMono} = { _tag: ${tag} };`).with({ _tag: "None" }, () => `const ${c.name} = { _tag: ${tag} };`).exhaustive() : ((keys) => ((params) => ((impl) => length11(c.fields) >= 2 ? ((curried) => match14(ts).with({ _tag: "Some" }, ({ value: t }) => `const ${c.name} = ${curried} as ${t.generics}(${_Str_join5(", ", typedCtorParams(keys, t.paramTypes, 0))}) => ${t.ret};`).with({ _tag: "None" }, () => `const ${c.name} = ${curried};`).exhaustive())(`_curry(${show6(length11(c.fields))}, ${impl})`) : match14(ts).with({ _tag: "Some" }, ({ value: t }) => `const ${c.name} = ${t.generics}(${_Str_join5(", ", typedCtorParams(keys, t.paramTypes, 0))}): ${t.ret} => ({ _tag: ${tag}, ${params} });`).with({ _tag: "None" }, () => `const ${c.name} = ${impl};`).exhaustive())(`(${params}) => ({ _tag: ${tag}, ${params} })`))(_Str_join5(", ", keys)))(keysOf(c.fields));
});
var genCtorsFrom = _curry15(6, (s, ctors, h, refs, exported, i) => match14(_Array_get11(i, ctors)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: c }) => ((rest) => or7(exported, _Set_has5(c.name, refs)) ? _Array_prepend7(genCtor(c, hook2(h, s, c)), rest) : rest)(genCtorsFrom(s, ctors, h, refs, exported, i + 1))).exhaustive());
var genType = _curry15(2, (ctx, s) => match14(s).with({ _tag: "SType" }, ({ ctors, exported }) => _Str_join5(`
`, genCtorsFrom(s, ctors, ctx.annotateCtor, ctx.valueRefs, exported, 0))).otherwise(() => ""));
var typeExprArity = (te) => match14(te).with({ _tag: "TyArrow" }, ({ to }) => 1 + typeExprArity(to)).otherwise(() => 0);
var externArgs = (n) => {
  let i = 0;
  let acc = "";
  while (true) {
    if (i >= n) {
      return acc;
    } else {
      [i, acc] = [i + 1, eq14(acc, "") ? `$a${show6(i)}` : `${acc}, $a${show6(i)}`];
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
      [i, acc] = [i + 1, `${acc}($a${show6(i)})`];
      continue;
    }
  }
};
var genExtern = (s) => match14(s).with({ _tag: "SExtern" }, ({ name, typeExpr, module: modName, imported, curried }) => _Str_startsWith3("mochi:global:", modName) ? ((target) => ((base) => `const ${name} = ${eq14(imported, "") ? base : `${base}[${jsStringLit(imported)}]`};`)(`globalThis[${jsStringLit(target)}]`))(_Str_slice3(13, _Str_length3(modName), modName)) : _Str_startsWith3("mochi:get:", modName) ? ((target) => `const ${name} = ($receiver) => $receiver[${jsStringLit(target)}];`)(_Str_slice3(10, _Str_length3(modName), modName)) : _Str_startsWith3("mochi:set:", modName) ? ((target) => `const ${name} = _curry(2, ($receiver, $value) => ($receiver[${jsStringLit(target)}] = $value));`)(_Str_slice3(10, _Str_length3(modName), modName)) : _Str_startsWith3("mochi:new:", modName) ? ((target) => ((arity) => ((args) => not8(eq14(imported, "")) ? ((raw) => ((importLine) => ((ctor) => eq14(arity, 0) ? `${importLine}
const ${name} = () => ${ctor};` : `${importLine}
const ${name} = _curry(${show6(arity)}, (${args}) => ${ctor});`)(`new ${raw}(${args})`))(`import { ${imported} as ${raw} } from ${jsStringLit(target)};`))(_Str_concat2("$", name)) : eq14(arity, 0) ? `const ${name} = () => new globalThis[${jsStringLit(target)}]();` : `const ${name} = _curry(${show6(arity)}, (${args}) => new globalThis[${jsStringLit(target)}](${args}));`)(externArgs(arity)))(typeExprArity(typeExpr)))(_Str_slice3(10, _Str_length3(modName), modName)) : _Str_startsWith3("mochi:send:", modName) ? ((target) => ((arity) => ((args) => ((fn) => arity < 2 ? `const ${name} = ${fn};` : `const ${name} = _curry(${show6(arity)}, ${fn});`)(eq14(args, "") ? `($receiver) => $receiver[${jsStringLit(target)}]()` : `($receiver, ${args}) => $receiver[${jsStringLit(target)}](${args})`))(externArgs(arity - 1)))(typeExprArity(typeExpr)))(_Str_slice3(11, _Str_length3(modName), modName)) : eq14(imported, "default") ? `import ${name} from ${jsStringLit(modName)};` : ((arity) => arity <= 1 ? ((spec) => `import { ${spec} } from ${jsStringLit(modName)};`)(eq14(imported, name) ? name : `${imported} as ${name}`) : ((raw) => ((flat) => `import { ${imported} as ${raw} } from ${jsStringLit(modName)};
const ${name} = _curry(${show6(arity)}, ${flat});`)(curried ? `(${externArgs(arity)}) => ${raw}${externApplied(arity)}` : raw))(_Str_concat2("$", name)))(typeExprArity(typeExpr))).otherwise(() => "");
var stripAlExt = (s) => _Str_endsWith2(".mochi", s) ? _Str_slice3(0, _Str_length3(s) - 6, s) : s;
var rewriteImportPath = _curry15(2, (from, ext) => {
  const bare = stripAlExt(from);
  return or7(_Str_startsWith3("./", bare), _Str_startsWith3("../", bare)) ? `${bare}${ext}` : bare;
});
var genImport = _curry15(2, (s, ext) => match14(s).with({ _tag: "SImport" }, ({ names, from }) => ((nameList) => ((path) => `import { ${nameList} } from ${jsStringLit(path)};`)(rewriteImportPath(from, ext)))(_Str_join5(", ", map9((n) => n.name, names)))).with({ _tag: "SImportNs" }, ({ alias, from }) => ((path) => `import * as ${alias.name} from ${jsStringLit(path)};`)(rewriteImportPath(from, ext))).otherwise(() => ""));
var exportLine = (l) => `export ${l}`;
var jsDocLine = (l) => _Str_length3(l) > 0 ? ` * ${_Str_replace("*/", "*\\/", l)}` : " *";
var jsDoc = (docOpt) => match14(docOpt).with({ _tag: "None" }, () => "").with({ _tag: "Some" }, ({ value: doc }) => ((lines) => `/**
${_Str_join5(`
`, lines)}
 */
`)(map9(jsDocLine, _Str_split2(`
`, doc)))).exhaustive();
var genStmt = _curry15(2, (ctx, s) => match14(s).with({ _tag: "SError" }, ({ span: sp }) => `throw new Error("codegen invariant: error node reached codegen at ${show6(sp.start)}");`).with({ _tag: "SImport" }, () => genImport(s, ctx.moduleExt)).with({ _tag: "SImportNs" }, () => genImport(s, ctx.moduleExt)).with({ _tag: "SType" }, ({ exported }) => ((decls) => eq14(decls, "") ? "" : exported ? _Str_join5(`
`, map9(exportLine, _Str_split2(`
`, decls))) : decls)(genType(ctx, s))).with({ _tag: "SExtern" }, ({ name, exported, doc }) => ((docComment) => exported ? `${docComment}${genExtern(s)}
export { ${name} };` : `${docComment}${genExtern(s)}`)(ctx.docs ? jsDoc(doc) : "")).with({ _tag: "SLet" }, ({ name, value, exported, doc }) => ((doExport) => ((docComment) => `${docComment}${doExport ? "export " : ""}const ${name}${_Option_unwrapOr7("", hook2(ctx.annotateLet, name, value))} = ${genExpr(ctx, value)};`)(and10(ctx.docs, not8(_Str_startsWith3("$", name))) ? jsDoc(doc) : ""))(and10(exported, not8(_Str_startsWith3("$", name))))).with({ _tag: "SExpr" }, ({ value }) => `${genExpr(ctx, value)};`).exhaustive());
var usesMatchLibArm = (a) => or7(match14(a.guard).with({ _tag: "Some" }, ({ value: g }) => usesMatchLib(g)).with({ _tag: "None" }, () => false).exhaustive(), usesMatchLib(a.body));
var usesMatchLib = (e) => match14(e).with({ _tag: "ENum" }, () => false).with({ _tag: "EUnit" }, () => false).with({ _tag: "EBool" }, () => false).with({ _tag: "EStr" }, () => false).with({ _tag: "ERef" }, () => false).with({ _tag: "ECall" }, ({ fn, args }) => or7(usesMatchLib(fn), someOf3(usesMatchLib, args))).with({ _tag: "ELambda" }, ({ body }) => usesMatchLib(body)).with({ _tag: "ELetIn" }, ({ value, body }) => or7(usesMatchLib(value), usesMatchLib(body))).with({ _tag: "ELetBind" }, ({ value, body }) => or7(usesMatchLib(value), usesMatchLib(body))).with({ _tag: "EPipe" }, ({ left, right }) => or7(usesMatchLib(left), usesMatchLib(right))).with({ _tag: "EDo" }, ({ exprs }) => someOf3(usesMatchLib, exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => or7(usesMatchLib(cond), or7(usesMatchLib(thenE), usesMatchLib(elseE)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => or7(not8(isListMatch(arms)), or7(usesMatchLib(scrutinee), someOf3(usesMatchLibArm, arms)))).with({ _tag: "ELoop" }, ({ params, body }) => or7(someOf3((p) => usesMatchLib(p.init), params), usesMatchLib(body))).with({ _tag: "ERecur" }, ({ args }) => someOf3(usesMatchLib, args)).with({ _tag: "ERecord" }, ({ fields, spread }) => or7(match14(spread).with({ _tag: "Some" }, ({ value: s }) => usesMatchLib(s)).with({ _tag: "None" }, () => false).exhaustive(), someOf3((f) => usesMatchLib(f.value), fields))).with({ _tag: "EField" }, ({ target }) => usesMatchLib(target)).with({ _tag: "ETuple" }, ({ elements }) => someOf3(usesMatchLib, elements)).with({ _tag: "EArr" }, ({ elements }) => someOf3((el) => usesMatchLib(match14(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive()), elements)).with({ _tag: "EList" }, ({ elements }) => someOf3((el) => usesMatchLib(match14(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive()), elements)).with({ _tag: "ESet" }, ({ elements }) => someOf3((el) => usesMatchLib(match14(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive()), elements)).with({ _tag: "EMap" }, ({ entries }) => someOf3((en) => or7(usesMatchLib(en.key), usesMatchLib(en.value)), entries)).with({ _tag: "EInterp" }, ({ parts }) => someOf3((p) => match14(p).with({ _tag: "IPLit" }, () => false).with({ _tag: "IPExpr" }, ({ expr: ex }) => usesMatchLib(ex)).exhaustive(), parts)).exhaustive();
var loopInitRefsFrom2 = _curry15(4, (ctx, params, i, acc) => match14(_Array_get11(i, params)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => loopInitRefsFrom2(ctx, params, i + 1, exprRefs(ctx, p.init, acc))).exhaustive());
var exprRefsListFrom = _curry15(4, (ctx, xs, i, acc) => match14(_Array_get11(i, xs)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: x }) => exprRefsListFrom(ctx, xs, i + 1, exprRefs(ctx, x, acc))).exhaustive());
var exprRefsInterpPartsFrom = _curry15(4, (ctx, parts, i, acc) => match14(_Array_get11(i, parts)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => exprRefsInterpPartsFrom(ctx, parts, i + 1, match14(p).with({ _tag: "IPLit" }, () => acc).with({ _tag: "IPExpr" }, ({ expr: ex }) => exprRefs(ctx, ex, acc)).exhaustive())).exhaustive());
var exprRefsArmsFrom = _curry15(4, (ctx, arms, i, acc) => match14(_Array_get11(i, arms)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: a }) => ((acc1) => exprRefsArmsFrom(ctx, arms, i + 1, exprRefs(ctx, a.body, acc1)))(match14(a.guard).with({ _tag: "Some" }, ({ value: g }) => exprRefs(ctx, g, acc)).with({ _tag: "None" }, () => acc).exhaustive())).exhaustive());
var exprRefsFieldsFrom = _curry15(4, (ctx, fields, i, acc) => match14(_Array_get11(i, fields)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: f }) => exprRefsFieldsFrom(ctx, fields, i + 1, exprRefs(ctx, f.value, acc))).exhaustive());
var exprRefsEntriesFrom = _curry15(4, (ctx, entries, i, acc) => match14(_Array_get11(i, entries)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: en }) => exprRefsEntriesFrom(ctx, entries, i + 1, exprRefs(ctx, en.value, exprRefs(ctx, en.key, acc)))).exhaustive());
var exprRefs = _curry15(3, (ctx, e, acc) => match14(e).with({ _tag: "ENum" }, () => acc).with({ _tag: "EUnit" }, () => acc).with({ _tag: "EBool" }, () => acc).with({ _tag: "EStr" }, () => acc).with({ _tag: "ERef" }, ({ name }) => _Set_add5(name, acc)).with({ _tag: "ECall" }, ({ fn, args }) => exprRefsListFrom(ctx, args, 0, exprRefs(ctx, fn, acc))).with({ _tag: "ELambda" }, ({ params, body }) => (([cparams, cbody, fills]) => {
  const acc2 = length11(cparams) >= 2 ? _Set_add5("_curry", acc) : acc;
  const acc3 = reduce3(_curry15(2, (a, g) => reduce3(_curry15(2, (b, lab) => match14(lab).with((_v) => {
    const _g = _v;
    return _g._tag === "LPSpanned" && _g.param._tag === "LPLabeled" && _g.param.defaultValue._tag === "Some";
  }, ({ param: { defaultValue: { value: d } } }) => exprRefs(ctx, d, b)).with((_v) => {
    const _g = _v;
    return _g._tag === "LPLabeled" && _g.defaultValue._tag === "Some";
  }, ({ defaultValue: { value: d } }) => exprRefs(ctx, d, b)).otherwise(() => b)), a, g.labs)), acc2, fills);
  return exprRefs(ctx, cbody, acc3);
})(collapseLambda(params, body))).with({ _tag: "ELetIn" }, ({ value, body }) => exprRefs(ctx, body, exprRefs(ctx, value, acc))).with({ _tag: "ELetBind" }, ({ monad, value, body }) => exprRefs(ctx, body, exprRefs(ctx, value, _Set_add5(bindRuntime(monad), acc)))).with({ _tag: "EPipe" }, ({ left, right }) => exprRefs(ctx, right, exprRefs(ctx, left, acc))).with({ _tag: "EDo" }, ({ exprs }) => exprRefsListFrom(ctx, exprs, 0, acc)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => exprRefs(ctx, elseE, exprRefs(ctx, thenE, exprRefs(ctx, cond, acc)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => ((acc1) => ((acc2) => exprRefsArmsFrom(ctx, arms, 0, acc2))(someOf3((a) => match14(a.pattern).with((_v) => {
  const _g = _v;
  return _g._tag === "PList" && _g.rest._tag === "Some" && _g.rest.value._tag === "PBind";
}, () => true).otherwise(() => false), arms) ? _Set_add5("_list", acc1) : acc1))(exprRefs(ctx, scrutinee, acc))).with({ _tag: "ERecord" }, ({ fields, spread }) => exprRefsFieldsFrom(ctx, fields, 0, match14(spread).with({ _tag: "Some" }, ({ value: s }) => exprRefs(ctx, s, acc)).with({ _tag: "None" }, () => acc).exhaustive())).with({ _tag: "EField" }, ({ target, name }) => match14(emptyNsEmit(target, name, None14)).with({ _tag: "Some" }, () => match14(target).with({ _tag: "ERef", name: "List" }, () => _Set_add5("_list", acc)).otherwise(() => acc)).with({ _tag: "None" }, () => match14(nsRuntimeId(ctx, target, name)).with({ _tag: "Some" }, ({ value: rt }) => _Set_add5(rt, acc)).with({ _tag: "None" }, () => exprRefs(ctx, target, acc)).exhaustive()).exhaustive()).with({ _tag: "ELoop" }, ({ params, body }) => ((acc1) => ((acc2) => exprRefs(ctx, body, acc2))(loopInitRefsFrom2(ctx, params, 0, acc1)))(loopNeedsStep(body) ? _Set_add5("_recur", _Set_add5("_done", acc)) : acc)).with({ _tag: "ERecur" }, ({ args }) => exprRefsListFrom(ctx, args, 0, acc)).with({ _tag: "ETuple" }, ({ elements }) => exprRefsListFrom(ctx, elements, 0, acc)).with({ _tag: "EArr" }, ({ elements }) => exprRefsListFrom(ctx, map9((el) => match14(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive(), elements), 0, acc)).with({ _tag: "EList" }, ({ elements }) => exprRefsListFrom(ctx, map9((el) => match14(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive(), elements), 0, _Set_add5("_list", acc))).with({ _tag: "ESet" }, ({ elements }) => exprRefsListFrom(ctx, map9((el) => match14(el).with({ _tag: "SEExpr" }, ({ expr: e2 }) => e2).with({ _tag: "SESpread" }, ({ expr: e2 }) => e2).exhaustive(), elements), 0, acc)).with({ _tag: "EMap" }, ({ entries }) => exprRefsEntriesFrom(ctx, entries, 0, acc)).with({ _tag: "EInterp" }, ({ parts }) => exprRefsInterpPartsFrom(ctx, parts, 0, acc)).exhaustive());
var boundNamesFrom = _curry15(3, (stmts, i, acc) => match14(_Array_get11(i, stmts)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: s }) => boundNamesFrom(stmts, i + 1, match14(s).with({ _tag: "SLet" }, ({ name }) => _Set_add5(name, acc)).with({ _tag: "SExtern" }, ({ name }) => _Set_add5(name, acc)).with({ _tag: "SType" }, ({ ctors }) => _Set_union(acc, _Set_fromArray5(map9((c) => c.name, ctors)))).with({ _tag: "SImport" }, ({ names }) => _Set_union(acc, _Set_fromArray5(map9((n) => n.name, names)))).with({ _tag: "SImportNs" }, ({ alias }) => _Set_add5(alias.name, acc)).with({ _tag: "SError" }, () => acc).with({ _tag: "SExpr" }, () => acc).exhaustive())).exhaustive());
var boundNames = (stmts) => boundNamesFrom(stmts, 0, _Set_fromArray5([]));
var collectValueRefs = _curry15(4, (ctx, stmts, i, acc) => match14(_Array_get11(i, stmts)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: s }) => collectValueRefs(ctx, stmts, i + 1, match14(s).with({ _tag: "SLet" }, ({ value }) => exprRefs(ctx, value, acc)).with({ _tag: "SExpr" }, ({ value }) => exprRefs(ctx, value, acc)).otherwise(() => acc))).exhaustive());
var refsForStmt = _curry15(2, (ctx, s) => match14(s).with({ _tag: "SLet" }, ({ value }) => exprRefs(ctx, value, _Set_fromArray5([]))).with({ _tag: "SExpr" }, ({ value }) => exprRefs(ctx, value, _Set_fromArray5([]))).with({ _tag: "SType" }, ({ ctors, exported }) => someOf3((c) => and10(length11(c.fields) >= 2, or7(exported, _Set_has5(c.name, ctx.valueRefs))), ctors) ? _Set_add5("_curry", _Set_fromArray5([])) : _Set_fromArray5([])).with({ _tag: "SExtern" }, ({ typeExpr }) => typeExprArity(typeExpr) >= 2 ? _Set_add5("_curry", _Set_fromArray5([])) : _Set_fromArray5([])).otherwise(() => _Set_fromArray5([])));
var collectRefsFrom = _curry15(4, (ctx, stmts, i, acc) => match14(_Array_get11(i, stmts)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: s }) => collectRefsFrom(ctx, stmts, i + 1, _Set_union(acc, refsForStmt(ctx, s)))).exhaustive());
var addDepsFrom = _curry15(4, (deps, j, refs, queue) => match14(_Array_get11(j, deps)).with({ _tag: "None" }, () => _tuple8(refs, queue)).with({ _tag: "Some" }, ({ value: d }) => _Set_has5(d, refs) ? addDepsFrom(deps, j + 1, refs, queue) : addDepsFrom(deps, j + 1, _Set_add5(d, refs), _Array_append10(d, queue))).exhaustive());
var closeRefsFrom = _curry15(4, (queue, i, refs, runtimeDeps) => match14(_Array_get11(i, queue)).with({ _tag: "None" }, () => refs).with({ _tag: "Some" }, ({ value: r }) => ((deps) => (([refs2, queue2]) => closeRefsFrom(queue2, i + 1, refs2, runtimeDeps))(addDepsFrom(deps, 0, refs, queue)))(_Option_unwrapOr7([], _Map_get7(r, runtimeDeps)))).exhaustive());
var runtimeRefNames = _curry15(4, (ctx, stmts, jsDefs, runtimeDeps) => {
  const refs0 = collectRefsFrom(ctx, stmts, 0, _Set_fromArray5([]));
  const refs = closeRefsFrom(_Set_toArray3(refs0), 0, refs0, runtimeDeps);
  const bound = boundNames(stmts);
  return filter4((n) => and10(_Set_has5(n, refs), not8(_Set_has5(n, bound))), _Map_keys5(jsDefs));
});
var preludePreamble = _curry15(4, (ctx, stmts, jsDefs, runtimeDeps) => {
  const names = runtimeRefNames(ctx, stmts, jsDefs, runtimeDeps);
  const defs = map9((n) => _Map_getOr6("", n, jsDefs), names);
  return eq14(length11(defs), 0) ? "" : `${_Str_join5(`
`, defs)}

`;
});
var genStmtAllFrom = _curry15(3, (ctx, stmts, i) => match14(_Array_get11(i, stmts)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: s }) => _Array_prepend7(genStmt(ctx, s), genStmtAllFrom(ctx, stmts, i + 1))).exhaustive());
var codegenWith = _curry15(7, (stmts, imported, useRuntime, ns, jsDefs, runtimeDeps, opts) => {
  const keys0 = ctorKeysFromStmts(stmts, imported);
  const keys = seedBuiltinCtorKeys(stmts, keys0);
  const ctx0 = { keys, ns, annotateLet: opts.annotateLet, annotateCtor: opts.annotateCtor, annotateParams: opts.annotateParams, annotateEmpty: opts.annotateEmpty, annotateLetin: opts.annotateLetin, annotateCall: opts.annotateCall, guardBaseType: opts.guardBaseType, flattenPipe: opts.flattenPipe, tupleHelper: opts.tupleHelper, preserveInfix: opts.preserveInfix, preserveJsx: opts.preserveJsx, moduleExt: opts.moduleExt, valueRefs: _Set_fromArray5([]), docs: opts.docs };
  const valueRefs = collectValueRefs(ctx0, stmts, 0, _Set_fromArray5([]));
  const ctx = { ...ctx0, valueRefs };
  const needsMatch = someOf3((s) => match14(s).with({ _tag: "SLet" }, ({ value }) => usesMatchLib(value)).with({ _tag: "SExpr" }, ({ value }) => usesMatchLib(value)).otherwise(() => false), stmts);
  const header = needsMatch ? `import { match } from "@onrails/pattern";

` : "";
  const preamble = useRuntime ? preludePreamble(ctx, stmts, jsDefs, runtimeDeps) : "";
  const body = _Str_join5(`
`, genStmtAllFrom(ctx, stmts, 0));
  return `${header}${preamble}${body}
`;
});
var runtimeDepNames = _curry15(5, (stmts, imported, ns, jsDefs, runtimeDeps) => {
  const keys = seedBuiltinCtorKeys(stmts, ctorKeysFromStmts(stmts, imported));
  const ctx0 = { keys, ns, annotateLet: None14, annotateCtor: None14, annotateParams: None14, annotateEmpty: None14, annotateLetin: None14, annotateCall: None14, guardBaseType: None14, flattenPipe: false, tupleHelper: false, preserveInfix: false, preserveJsx: false, moduleExt: ".js", valueRefs: _Set_fromArray5([]), docs: false };
  const valueRefs = collectValueRefs(ctx0, stmts, 0, _Set_fromArray5([]));
  return runtimeRefNames({ ...ctx0, valueRefs }, stmts, jsDefs, runtimeDeps);
});
var codegen = _curry15(6, (stmts, imported, useRuntime, ns, jsDefs, runtimeDeps) => codegenWith(stmts, imported, useRuntime, ns, jsDefs, runtimeDeps, jsGenOpts));

import { None as None16, Some as Some16, _Array_append as _Array_append12, _Array_concat as _Array_concat7, _Array_contains as _Array_contains4, _Array_dedupeBy, _Array_drop as _Array_drop4, _Array_get as _Array_get13, _Array_prepend as _Array_prepend9, _Array_reverse as _Array_reverse2, _Array_sort as _Array_sort2, _Array_sortBy, _Array_take as _Array_take3, _Map_delete as _Map_delete2, _Map_get as _Map_get9, _Map_keys as _Map_keys6, _Map_set as _Map_set8, _Map_size as _Map_size2, _Map_values as _Map_values2, _Option_flatMap as _Option_flatMap3, _Option_isSome as _Option_isSome4, _Option_map as _Option_map3, _Option_unwrapOr as _Option_unwrapOr9, _Set_add as _Set_add6, _Set_fromArray as _Set_fromArray6, _Set_has as _Set_has6, _Str_contains, _Str_fromCode as _Str_fromCode3, _Str_join as _Str_join7, _Str_split as _Str_split3, _Str_startsWith as _Str_startsWith4, _curry as _curry17, _tuple as _tuple10, and as and11, concat as concat2, eq as eq16, filter as filter5, length as length13, map as map11, not as not10, or as or8, reduce as reduce4, show as show8 } from "@mochi/compiler/runtime";
import { match as match16 } from "@onrails/pattern";

import { None as None15, Some as Some15, _Array_append as _Array_append11, _Array_concat as _Array_concat6, _Array_get as _Array_get12, _Array_prepend as _Array_prepend8, _Array_sort, _Map_get as _Map_get8, _Map_set as _Map_set7, _Map_size, _Option_flatMap as _Option_flatMap2, _Option_map as _Option_map2, _Option_unwrapOr as _Option_unwrapOr8, _Str_fromCode as _Str_fromCode2, _Str_get as _Str_get3, _Str_join as _Str_join6, _curry as _curry16, _tuple as _tuple9, eq as eq15, length as length12, map as map10, not as not9, show as show7 } from "@mochi/compiler/runtime";
import { match as match15 } from "@onrails/pattern";
var tsEnv = _curry16(2, (vars, recs) => ({ vars, recs }));
var noVars = new Map;
var noRecs = new Map;
var plainEnv = (vars) => tsEnv(vars, noRecs);
var recsEnv = (recs) => tsEnv(noVars, recs);
var letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var letterAt = (i) => _Option_unwrapOr8(`T${show7(i)}`, _Str_get3(i, letters));
var genericNames = (sc) => genericNamesFrom(_Array_concat6(sc.vars, sc.rvars), 0, new Map);
var genericNamesFrom = _curry16(3, (ids, i, names) => match15(_Array_get12(i, ids)).with({ _tag: "None" }, () => names).with({ _tag: "Some" }, ({ value: id }) => genericNamesFrom(ids, i + 1, _Map_set7(id, letterAt(i), names))).exhaustive());
var primitiveTs = (name) => match15(name).with("number", () => "number").with("int", () => "number").with("float", () => "number").with("string", () => "string").with("bool", () => "boolean").with("unit", () => "undefined").otherwise(() => name);
var namesOf = _curry16(2, (ts, env) => _Str_join6(", ", map10((t) => tsOfRaw(t, env), ts)));
var nominal = _curry16(3, (name, args, env) => eq15(length12(args), 0) ? primitiveTs(name) : `${name}<${namesOf(args, env)}>`);
var tsRowFields = _curry16(2, (row, env) => match15(row).with({ _tag: "RowEmpty" }, () => _tuple9([], None15)).with({ _tag: "RowVar" }, ({ id }) => _tuple9([], Some15(id))).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => (([fields, tail]) => _tuple9(_Array_prepend8(`${label}${optional ? "?" : ""}: ${tsOfRaw(fieldType, env)}`, fields), tail))(tsRowFields(rest, env))).exhaustive());
var shapeFieldsFrom = _curry16(2, (row, vars) => match15(row).with({ _tag: "RowEmpty" }, () => Some15([])).with({ _tag: "RowVar" }, () => None15).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => _Option_map2((fs) => _Array_prepend8(`${label}${optional ? "?" : ""}: ${tsOf(fieldType, plainEnv(vars))}`, fs), shapeFieldsFrom(rest, vars))).exhaustive());
var rowShapeKey = _curry16(2, (row, vars) => _Option_map2((fs) => _Str_join6("; ", _Array_sort(fs)), shapeFieldsFrom(row, vars)));
var aliasNameFor = _curry16(2, (row, env) => eq15(_Map_size(env.recs), 0) ? None15 : _Option_flatMap2((k) => _Map_get8(k, env.recs), rowShapeKey(row, env.vars)));
var tsRow = _curry16(2, (row, env) => match15(aliasNameFor(row, env)).with({ _tag: "Some" }, ({ value: alias }) => alias).with({ _tag: "None" }, () => (([fields, tail]) => {
  const body = eq15(length12(fields), 0) ? "{}" : `{ ${_Str_join6("; ", fields)} }`;
  return match15(tail).with({ _tag: "None" }, () => body).with({ _tag: "Some" }, ({ value: id }) => match15(_Map_get8(id, env.vars)).with({ _tag: "None" }, () => body).with({ _tag: "Some" }, ({ value: name }) => eq15(length12(fields), 0) ? name : `(${body} & ${name})`).exhaustive()).exhaustive();
})(tsRowFields(row, env))).exhaustive());
var tsArrow = _curry16(3, (fromT, toT, env) => isUnit(fromT) ? `() => ${tsOfRaw(toT, env)}` : tsArrowParams(fromT, toT, env, 0, []));
var tsArrowParams = _curry16(5, (fromT, toT, env, i, params) => {
  const params1 = _Array_append11(`${_Str_fromCode2(97 + i)}: ${tsOfRaw(fromT, env)}`, params);
  return match15(toT).with((_v) => {
    const _g = _v;
    return _g._tag === "TyFn" && (({ from: nextFrom, to: nextTo }) => not9(isUnit(nextFrom)))(_g);
  }, ({ from: nextFrom, to: nextTo }) => tsArrowParams(nextFrom, nextTo, env, i + 1, params1)).otherwise(() => `(${_Str_join6(", ", params1)}) => ${tsOfRaw(toT, env)}`);
});
var tsOf = _curry16(2, (t, env) => tsOfRaw(widenLits(t), env));
var tsOfRaw = _curry16(2, (t, env) => match15(t).with({ _tag: "TyVar" }, ({ id }) => _Option_unwrapOr8("unknown", _Map_get8(id, env.vars))).with((_v) => {
  const _g = _v;
  return _g._tag === "TyCon" && _g.name === "Array" && _g.args.length === 1;
}, ({ args: [elem] }) => ((inner) => match15(elem).with({ _tag: "TyFn" }, () => `(${inner})[]`).with({ _tag: "TyOneOf" }, () => `(${inner})[]`).otherwise(() => `${inner}[]`))(tsOfRaw(elem, env))).with((_v) => {
  const _g = _v;
  return _g._tag === "TyCon" && _g.name === "List" && _g.args.length === 1;
}, ({ args: [elem] }) => `Iterable<${tsOfRaw(elem, env)}>`).with((_v) => {
  const _g = _v;
  return _g._tag === "TyCon" && _g.name === "Task" && _g.args.length === 2;
}, ({ args: [value, error] }) => `() => Promise<Result<${tsOfRaw(value, env)}, ${tsOfRaw(error, env)}>>`).with({ _tag: "TyCon", name: "tuple" }, ({ args: elems }) => `[${namesOf(elems, env)}]`).with({ _tag: "TyCon" }, ({ name, args }) => nominal(name, args, env)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tsArrow(fromT, toT, env)).with({ _tag: "TyRecord" }, ({ row }) => tsRow(row, env)).with({ _tag: "TySingleton", base: "string" }, ({ value }) => `"${value}"`).with({ _tag: "TySingleton" }, ({ value }) => value).with({ _tag: "TyOneOf" }, ({ members }) => _Str_join6(" | ", map10((m) => tsOfRaw(m, env), members))).exhaustive());

var paramVarsFrom = _curry17(2, (params, i) => match16(_Array_get13(i, params)).with({ _tag: "None" }, () => new Map).with({ _tag: "Some" }, ({ value: p }) => _Map_set8(p, tVar(i), paramVarsFrom(params, i + 1))).exhaustive());
var paramNamesFrom = _curry17(2, (params, i) => match16(_Array_get13(i, params)).with({ _tag: "None" }, () => new Map).with({ _tag: "Some" }, () => _Map_set8(i, letterAt(i), paramNamesFrom(params, i + 1))).exhaustive());
var genericHead = _curry17(3, (params, i, acc) => match16(_Array_get13(i, params)).with({ _tag: "None" }, () => eq16(length13(acc), 0) ? "" : `<${_Str_join7(", ", acc)}>`).with({ _tag: "Some" }, () => genericHead(params, i + 1, _Array_append12(letterAt(i), acc))).exhaustive());
var fieldTs = _curry17(4, (te, params, aliases, recs) => {
  const vars = paramVarsFrom(params, 0);
  const names = paramNamesFrom(params, 0);
  return (([t, _vars, _st]) => tsOf(t, tsEnv(names, recs)))(typeExprToType(te, vars, mkSt(length13(params)), aliases, _Set_fromArray6([])));
});
var ctorFieldsFrom = _curry17(6, (fields, keys, params, aliases, recs, i) => match16(_Array_get13(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: fld }) => _Array_prepend9(`${_Option_unwrapOr9(`_${show8(i)}`, _Array_get13(i, keys))}: ${fieldTs(fld.fieldType, params, aliases, recs)}`, ctorFieldsFrom(fields, keys, params, aliases, recs, i + 1))).exhaustive());
var ctorVariant = _curry17(4, (c, params, aliases, recs) => {
  const fields = ctorFieldsFrom(c.fields, keysOf(c.fields), params, aliases, recs, 0);
  return eq16(length13(fields), 0) ? `{ _tag: "${c.name}" }` : `{ _tag: "${c.name}"; ${_Str_join7("; ", fields)} }`;
});
var ctorVariantsFrom = _curry17(5, (ctors, params, aliases, recs, i) => match16(_Array_get13(i, ctors)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: c }) => _Array_prepend9(`  | ${ctorVariant(c, params, aliases, recs)}`, ctorVariantsFrom(ctors, params, aliases, recs, i + 1))).exhaustive());
var typeDecl = _curry17(5, (name, params, ctors, aliases, recs) => {
  const head = `${name}${genericHead(params, 0, [])}`;
  return `export type ${head} =
${_Str_join7(`
`, ctorVariantsFrom(ctors, params, aliases, recs, 0))};`;
});
var aliasFieldsFrom2 = _curry17(5, (fields, params, aliases, recs, i) => match16(_Array_get13(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => _Array_prepend9(`${f.name}${f.optional ? "?" : ""}: ${fieldTs(f.fieldType, params, aliases, recs)}`, aliasFieldsFrom2(fields, params, aliases, recs, i + 1))).exhaustive());
var recordAliasDecl = _curry17(5, (name, params, fields, aliases, recs) => {
  const head = `${name}${genericHead(params, 0, [])}`;
  const body = aliasFieldsFrom2(fields, params, aliases, recs, 0);
  return eq16(length13(body), 0) ? `export type ${head} = {};` : `export type ${head} = { ${_Str_join7("; ", body)} };`;
});
var aliasTsDecl = _curry17(5, (name, params, template, aliases, recs) => {
  const head = `${name}${genericHead(params, 0, [])}`;
  return `export type ${head} = ${fieldTs(template, params, aliases, recs)};`;
});
var mergeInto = _curry17(4, (keys, src, acc, i) => match16(_Array_get13(i, keys)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: k }) => mergeInto(keys, src, match16(_Map_get9(k, src)).with({ _tag: "Some" }, ({ value: v }) => _Map_set8(k, v, acc)).with({ _tag: "None" }, () => acc).exhaustive(), i + 1)).exhaustive());
var unionNamesFrom = _curry17(3, (schemes, i, acc) => match16(_Array_get13(i, schemes)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: sc }) => ((names) => unionNamesFrom(schemes, i + 1, mergeInto(_Map_keys6(names), names, acc, 0)))(genericNames(sc))).exhaustive());
var unionGenericNames = (schemes) => unionNamesFrom(schemes, 0, new Map);
var allVarsIn = _curry17(2, (t, names) => match16(t).with({ _tag: "TyVar" }, ({ id }) => _Option_isSome4(_Map_get9(id, names))).with({ _tag: "TyCon" }, ({ args }) => allVarsInAll(args, names, 0)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => and11(allVarsIn(fromT, names), allVarsIn(toT, names))).with({ _tag: "TyRecord" }, ({ row }) => allVarsInRow(row, names)).with({ _tag: "TySingleton" }, () => true).with({ _tag: "TyOneOf" }, ({ members }) => allVarsInAll(members, names, 0)).exhaustive());
var allVarsInAll = _curry17(3, (ts, names, i) => match16(_Array_get13(i, ts)).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: t }) => and11(allVarsIn(t, names), allVarsInAll(ts, names, i + 1))).exhaustive());
var allVarsInRow = _curry17(2, (row, names) => match16(row).with({ _tag: "RowEmpty" }, () => true).with({ _tag: "RowVar" }, ({ id }) => _Option_isSome4(_Map_get9(id, names))).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => and11(allVarsIn(fieldType, names), allVarsInRow(rest, names))).exhaustive());
var isConcrete2 = (t) => allVarsIn(t, new Map([]));
var emptyCollTs = _curry17(2, (t, env) => allVarsIn(t, env.vars) ? Some16(tsOf(t, env)) : None16);
var ctorCallTs = _curry17(2, (t, recs) => match16(t).with({ _tag: "TyCon" }, ({ args }) => or8(eq16(length13(args), 0), not10(isConcrete2(t))) ? None16 : Some16(tsOf(t, recsEnv(recs)))).otherwise(() => None16));
var guardParamTs = _curry17(2, (t, recs) => isConcrete2(t) ? Some16(tsOf(t, recsEnv(recs))) : None16);
var lambdaParamsFrom = _curry17(4, (t, arity, env, i) => i >= arity ? [] : match16(t).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => _Array_prepend9(allVarsIn(fromT, env.vars) ? Some16(tsOf(fromT, env)) : isConcrete2(fromT) ? Some16(tsOf(fromT, recsEnv(env.recs))) : None16, lambdaParamsFrom(toT, arity, env, i + 1))).otherwise(() => _Array_prepend9(None16, lambdaParamsFrom(t, arity, env, i + 1))));
var lambdaParamTypesTs = _curry17(3, (lamType, arity, env) => lambdaParamsFrom(lamType, arity, env, 0));
var genericParamsFrom = _curry17(4, (t, arity, env, i) => i >= arity ? [] : match16(t).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => _Array_prepend9(Some16(tsOf(fromT, env)), genericParamsFrom(toT, arity, env, i + 1))).otherwise(() => _Array_prepend9(None16, genericParamsFrom(t, arity, env, i + 1))));
var genericLambdaParams = _curry17(3, (sc, arity, recs) => {
  const names = genericNames(sc);
  const env = tsEnv(names, recs);
  return eq16(_Map_size2(names), 0) ? None16 : Some16({ generics: `<${_Str_join7(", ", _Map_values2(names))}>`, params: genericParamsFrom(sc.ty, arity, env, 0) });
});
var neverArgs = _curry17(3, (params, i, acc) => match16(_Array_get13(i, params)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, () => neverArgs(params, i + 1, _Array_append12("never", acc))).exhaustive());
var ctorParamTypes = _curry17(5, (fields, params, aliases, recs, i) => match16(_Array_get13(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: fld }) => _Array_prepend9(fieldTs(fld.fieldType, params, aliases, recs), ctorParamTypes(fields, params, aliases, recs, i + 1))).exhaustive());
var ctorFactoryTs = _curry17(5, (typeName, params, c, aliases, recs) => {
  const head = genericHead(params, 0, []);
  const monos = neverArgs(params, 0, []);
  return { generics: head, paramTypes: ctorParamTypes(c.fields, params, aliases, recs, 0), ret: `${typeName}${head}`, retMono: eq16(length13(monos), 0) ? typeName : `${typeName}<${_Str_join7(", ", monos)}>` };
});
var paramDeclName = _curry17(2, (p, i) => match16(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => paramDeclName(inner, i)).with({ _tag: "LPName" }, ({ name }) => name).with({ _tag: "LPLabeled" }, () => "$lab").otherwise(() => `_${show8(i)}`));
var compositions = (n) => eq16(n, 0) ? [[]] : compositionsFrom(n, 1);
var compositionsFrom = _curry17(2, (n, k) => k > n ? [] : _Array_concat7(map11(_Array_prepend9(k), compositions(n - k)), compositionsFrom(n, k + 1)));
var sliceGroups = _curry17(4, (params, groups, i, at) => match16(_Array_get13(i, groups)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: g }) => _Array_prepend9(_Array_take3(g, _Array_drop4(at, params)), sliceGroups(params, groups, i + 1, at + g))).exhaustive());
var curriedTail = _curry17(3, (slices, i, acc) => i < 1 ? acc : curriedTail(slices, i - 1, `(${_Str_join7(", ", _Option_unwrapOr9([], _Array_get13(i, slices)))}) => ${acc}`));
var overloadSig = _curry17(4, (head, params, ret, groups) => {
  const slices = sliceGroups(params, groups, 0, 0);
  const tail = curriedTail(slices, length13(slices) - 1, ret);
  return `${head}(${_Str_join7(", ", _Option_unwrapOr9([], _Array_get13(0, slices)))}): ${tail};`;
});
var curriedOverloads = _curry17(3, (head, params, ret) => length13(params) <= 1 ? `${head}(${_Str_join7(", ", params)}) => ${ret}` : `{ ${_Str_join7(" ", map11(overloadSig(head, params, ret), _Array_sortBy((g) => 0 - length13(g), compositions(length13(params)))))} }`);
var curriedFnType = _curry17(2, (params, ret) => length13(params) <= 1 ? `(${_Str_join7(", ", params)}) => ${ret}` : `_Curry<[${_Str_join7(", ", params)}], ${ret}>`);
var flatParamsFrom = _curry17(5, (t, value, env, n, acc) => match16(value).with({ _tag: "ELambda" }, ({ params, body }) => eq16(length13(params), 0) ? ((next) => flatParamsFrom(next, body, env, n, acc))(match16(t).with((_v) => {
  const _g = _v;
  return _g._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_g);
}, ({ from: fromT, to: toT }) => toT).otherwise(() => t)) : (([t1, n1, acc1]) => flatParamsFrom(t1, body, env, n1, acc1))(takeParams(t, params, env, 0, n, acc))).otherwise(() => _tuple10(acc, tsOf(t, env))));
var takeParams = _curry17(6, (t, params, env, i, n, acc) => match16(_Array_get13(i, params)).with({ _tag: "None" }, () => _tuple10(t, n, acc)).with({ _tag: "Some" }, ({ value: p }) => match16(t).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => takeParams(toT, params, env, i + 1, n + 1, _Array_append12(`${paramDeclName(p, n)}: ${tsOf(fromT, env)}`, acc))).otherwise(() => _tuple10(t, n, acc))).exhaustive());
var declType = _curry17(3, (t, value, env) => match16(value).with({ _tag: "ELambda" }, ({ params, body }) => eq16(length13(params), 0) ? ((next) => `() => ${declType(next, body, env)}`)(match16(t).with((_v) => {
  const _g = _v;
  return _g._tag === "TyFn" && (({ from: fromT, to: toT }) => isUnit(fromT))(_g);
}, ({ from: fromT, to: toT }) => toT).otherwise(() => t)) : (([t1, _n, ps]) => `(${_Str_join7(", ", ps)}) => ${declType(t1, body, env)}`)(takeParams(t, params, env, 0, 0, []))).otherwise(() => tsOf(t, env)));
var bindingTsType = _curry17(3, (sc, value, recs) => {
  const names = genericNames(sc);
  const env = tsEnv(names, recs);
  const head = eq16(_Map_size2(names), 0) ? "" : `<${_Str_join7(", ", _Map_values2(names))}>`;
  return match16(value).with({ _tag: "ELambda" }, () => eq16(head, "") ? (([params, ret]) => curriedFnType(params, ret))(flatParamsFrom(sc.ty, value, env, 0, [])) : `${head}${declType(sc.ty, value, env)}`).otherwise(() => tsOf(sc.ty, recsEnv(recs)));
});
var spanKey = (sp) => `${show8(sp.start)}:${show8(sp.end)}`;
var typeAtFrom = _curry17(3, (types, i, acc) => match16(_Array_get13(i, types)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: r }) => typeAtFrom(types, i + 1, _Map_set8(spanKey(r.span), r.ty, acc))).exhaustive());
var typeAtTable = (types) => typeAtFrom(types, 0, new Map);
var consInTy = _curry17(2, (t, acc) => match16(t).with((_v) => {
  const _g = _v;
  return _g._tag === "TyCon" && _g.name === "Task" && _g.args.length === 2;
}, ({ args: [value, error] }) => consInTy(error, consInTy(value, _Set_add6("Result", _Set_add6("Task", acc))))).with({ _tag: "TyCon" }, ({ name, args }) => consInAll(args, _Set_add6(name, acc), 0)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => consInTy(toT, consInTy(fromT, acc))).with({ _tag: "TyRecord" }, ({ row }) => consInRow(row, acc)).with({ _tag: "TyOneOf" }, ({ members }) => consInAll(members, acc, 0)).otherwise(() => acc));
var consInAll = _curry17(3, (ts, acc, i) => match16(_Array_get13(i, ts)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: t }) => consInAll(ts, consInTy(t, acc), i + 1)).exhaustive());
var consInRow = _curry17(2, (row, acc) => match16(row).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => consInRow(rest, consInTy(fieldType, acc))).otherwise(() => acc));
var declaredTypeNames = _curry17(3, (stmts, i, acc) => match16(_Array_get13(i, stmts)).with({ _tag: "None" }, () => acc).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { name } }) => declaredTypeNames(stmts, i + 1, _Set_add6(name, acc))).with({ _tag: "Some" }, () => declaredTypeNames(stmts, i + 1, acc)).exhaustive());
var referencedCons = _curry17(4, (stmts, env, i, acc) => match16(_Array_get13(i, stmts)).with({ _tag: "None" }, () => acc).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet";
}, ({ value: { name } }) => referencedCons(stmts, env, i + 1, _Str_startsWith4("$", name) ? acc : match16(_Map_get9(name, env)).with({ _tag: "Some" }, ({ value: sc }) => consInTy(sc.ty, acc)).with({ _tag: "None" }, () => acc).exhaustive())).with({ _tag: "Some" }, () => referencedCons(stmts, env, i + 1, acc)).exhaustive());
var builtinTypeNamesFor = _curry17(4, (declared, wanted, body, i) => match16(_Array_get13(i, builtinTypeDecls)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: bt }) => ((rest) => and11(not10(_Set_has6(bt.name, declared)), or8(_Set_has6(bt.name, wanted), _Str_contains(bt.name, body))) ? _Array_prepend9(bt.name, rest) : rest)(builtinTypeNamesFor(declared, wanted, body, i + 1))).exhaustive());
var aliasRowOf = _curry17(3, (fields, aliases, i) => match16(_Array_get13(i, fields)).with({ _tag: "None" }, () => RowEmpty).with({ _tag: "Some" }, ({ value: f }) => (([t, _vars, _st]) => RowExtend(f.name, t, f.optional, aliasRowOf(fields, aliases, i + 1)))(typeExprToType(f.fieldType, new Map, mkSt(0), aliases, _Set_fromArray6([])))).exhaustive());
var aliasShapeKey = _curry17(2, (fields, aliases) => rowShapeKey(aliasRowOf(fields, aliases, 0), new Map));
var bareName = (name) => {
  const parts = _Str_split3(".", name);
  return _Option_unwrapOr9(name, _Array_get13(length13(parts) - 1, parts));
};
var indexAlias = _curry17(4, (key, name, aliases, acc) => match16(_Map_get9(key, aliases)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: info }) => match16(info.expr).with({ _tag: "Some" }, () => acc).with({ _tag: "None" }, () => or8(not10(eq16(length13(info.params), 0)), eq16(length13(info.fields), 0)) ? acc : match16(aliasShapeKey(info.fields, aliases)).with({ _tag: "Some" }, ({ value: k }) => _Map_set8(k, name, acc)).with({ _tag: "None" }, () => acc).exhaustive()).exhaustive()).exhaustive());
var recordAliasIndexFrom = _curry17(4, (keys, aliases, i, acc) => match16(_Array_get13(i, keys)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: key }) => recordAliasIndexFrom(keys, aliases, i + 1, indexAlias(key, bareName(key), aliases, acc))).exhaustive());
var recordAliasIndex = (aliases) => recordAliasIndexFrom(_Array_sort2(_Map_keys6(aliases)), aliases, 0, new Map);
var withoutOwnShape = _curry17(4, (fields, params, aliases, recs) => match16(_Array_get13(0, params)).with({ _tag: "Some" }, () => recs).with({ _tag: "None" }, () => match16(aliasShapeKey(fields, aliases)).with({ _tag: "Some" }, ({ value: k }) => _Map_delete2(k, recs)).with({ _tag: "None" }, () => recs).exhaustive()).exhaustive());
var typeHeaderFrom = _curry17(4, (stmts, aliases, recs, i) => match16(_Array_get13(i, stmts)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { name, params, ctors, alias, aliasType, doc } }) => ((rest) => ((docComment) => match16(alias).with({ _tag: "Some" }, ({ value: fields }) => _Array_prepend9(`${docComment}${recordAliasDecl(name, params, fields, aliases, withoutOwnShape(fields, params, aliases, recs))}`, rest)).with({ _tag: "None" }, () => match16(aliasType).with({ _tag: "Some" }, ({ value: te }) => _Array_prepend9(`${docComment}${aliasTsDecl(name, params, te, aliases, recs)}`, rest)).with({ _tag: "None" }, () => eq16(length13(ctors), 0) ? _Array_prepend9(`declare const ${name}: unique symbol;
${docComment}type ${name} = { readonly [${name}]: never };`, rest) : _Array_prepend9(`${docComment}${typeDecl(name, params, ctors, aliases, recs)}`, rest)).exhaustive()).exhaustive())(jsDoc(doc)))(typeHeaderFrom(stmts, aliases, recs, i + 1))).with({ _tag: "Some" }, () => typeHeaderFrom(stmts, aliases, recs, i + 1)).exhaustive());
var genericLambdasFrom = _curry17(4, (stmts, env, i, acc) => match16(_Array_get13(i, stmts)).with({ _tag: "None" }, () => acc).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet";
}, ({ value: { name, value } }) => genericLambdasFrom(stmts, env, i + 1, match16(value).with((_v) => {
  const _g = _v;
  return _g._tag === "ELambda" && (({ span: sp }) => not10(_Str_startsWith4("$", name)))(_g);
}, ({ span: sp }) => match16(_Map_get9(name, env)).with({ _tag: "Some" }, ({ value: sc }) => or8(length13(sc.vars) > 0, length13(sc.rvars) > 0) ? _Map_set8(spanKey(sp), sc, acc) : acc).with({ _tag: "None" }, () => acc).exhaustive()).otherwise(() => acc))).with({ _tag: "Some" }, () => genericLambdasFrom(stmts, env, i + 1, acc)).exhaustive());
var scopedSpans = (e) => match16(e).with({ _tag: "ELambda" }, ({ body, span: sp }) => _Array_prepend9(sp, scopedSpans(body))).with({ _tag: "ECall" }, ({ fn, args }) => _Array_concat7(scopedSpans(fn), scopedSpansAt(args, 0))).with({ _tag: "ELetIn" }, ({ value, body }) => _Array_concat7(scopedSpans(value), scopedSpans(body))).with({ _tag: "ELetBind" }, ({ value, body }) => _Array_concat7(scopedSpans(value), scopedSpans(body))).with({ _tag: "EPipe" }, ({ left, right }) => _Array_concat7(scopedSpans(left), scopedSpans(right))).with({ _tag: "EDo" }, ({ exprs }) => scopedSpansAt(exprs, 0)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => _Array_concat7(scopedSpans(cond), _Array_concat7(scopedSpans(thenE), scopedSpans(elseE)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => _Array_concat7(scopedSpans(scrutinee), scopedSpansInArms(arms, 0))).with({ _tag: "ERecord" }, ({ fields, spread }) => _Array_concat7(scopedSpansInFields(fields, 0), match16(spread).with({ _tag: "Some" }, ({ value: s }) => scopedSpans(s)).with({ _tag: "None" }, () => []).exhaustive())).with({ _tag: "EField" }, ({ target, name, span: sp }) => ((rest) => and11(eq16(name, "empty"), isRefExpr(target)) ? _Array_prepend9(sp, rest) : rest)(scopedSpans(target))).with({ _tag: "ETuple" }, ({ elements }) => scopedSpansAt(elements, 0)).with({ _tag: "EArr" }, ({ elements, span: sp }) => scopedSpansInSeq(elements, sp)).with({ _tag: "EList" }, ({ elements, span: sp }) => scopedSpansInSeq(elements, sp)).with({ _tag: "ESet" }, ({ elements, span: sp }) => scopedSpansInSeq(elements, sp)).with({ _tag: "EMap" }, ({ entries, span: sp }) => ((inner) => eq16(length13(entries), 0) ? _Array_prepend9(sp, inner) : inner)(scopedSpansInEntries(entries, 0))).with({ _tag: "ELoop" }, ({ params, body }) => _Array_concat7(scopedSpansInLoop(params, 0), scopedSpans(body))).with({ _tag: "ERecur" }, ({ args }) => scopedSpansAt(args, 0)).with({ _tag: "EInterp" }, ({ parts }) => scopedSpansInParts(parts, 0)).otherwise(() => []);
var isRefExpr = (e) => match16(e).with({ _tag: "ERef" }, () => true).otherwise(() => false);
var scopedSpansAt = _curry17(2, (exprs, i) => match16(_Array_get13(i, exprs)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: e }) => _Array_concat7(scopedSpans(e), scopedSpansAt(exprs, i + 1))).exhaustive());
var scopedSpansInArms = _curry17(2, (arms, i) => match16(_Array_get13(i, arms)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: a }) => _Array_concat7(match16(a.guard).with({ _tag: "Some" }, ({ value: g }) => scopedSpans(g)).with({ _tag: "None" }, () => []).exhaustive(), _Array_concat7(scopedSpans(a.body), scopedSpansInArms(arms, i + 1)))).exhaustive());
var scopedSpansInFields = _curry17(2, (fields, i) => match16(_Array_get13(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => _Array_concat7(scopedSpans(f.value), scopedSpansInFields(fields, i + 1))).exhaustive());
var scopedSpansInEntries = _curry17(2, (entries, i) => match16(_Array_get13(i, entries)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: en }) => _Array_concat7(scopedSpans(en.key), _Array_concat7(scopedSpans(en.value), scopedSpansInEntries(entries, i + 1)))).exhaustive());
var scopedSpansInElems = _curry17(2, (elements, i) => match16(_Array_get13(i, elements)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SEExpr";
}, ({ value: { expr: e } }) => _Array_concat7(scopedSpans(e), scopedSpansInElems(elements, i + 1))).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SESpread";
}, ({ value: { expr: e } }) => _Array_concat7(scopedSpans(e), scopedSpansInElems(elements, i + 1))).exhaustive());
var scopedSpansInSeq = _curry17(2, (elements, sp) => {
  const inner = scopedSpansInElems(elements, 0);
  return eq16(length13(elements), 0) ? _Array_prepend9(sp, inner) : inner;
});
var scopedSpansInLoop = _curry17(2, (params, i) => match16(_Array_get13(i, params)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: p }) => _Array_concat7(scopedSpans(p.init), scopedSpansInLoop(params, i + 1))).exhaustive());
var scopedSpansInParts = _curry17(2, (parts, i) => match16(_Array_get13(i, parts)).with({ _tag: "None" }, () => []).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "IPExpr";
}, ({ value: { expr: e } }) => _Array_concat7(scopedSpans(e), scopedSpansInParts(parts, i + 1))).with({ _tag: "Some" }, () => scopedSpansInParts(parts, i + 1)).exhaustive());
var scopedNamesAt = _curry17(4, (spans, i, names, acc) => match16(_Array_get13(i, spans)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: sp }) => scopedNamesAt(spans, i + 1, names, _Map_set8(spanKey(sp), names, acc))).exhaustive());
var scopedNamesFrom = _curry17(4, (stmts, env, i, acc) => match16(_Array_get13(i, stmts)).with({ _tag: "None" }, () => acc).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet";
}, ({ value: { name, value } }) => scopedNamesFrom(stmts, env, i + 1, match16(value).with((_v) => {
  const _g = _v;
  return _g._tag === "ELambda" && not10(_Str_startsWith4("$", name));
}, () => match16(_Map_get9(name, env)).with({ _tag: "Some" }, ({ value: sc }) => or8(length13(sc.vars) > 0, length13(sc.rvars) > 0) ? scopedNamesAt(scopedSpans(value), 0, unionGenericNames([sc]), acc) : acc).with({ _tag: "None" }, () => acc).exhaustive()).otherwise(() => acc))).with({ _tag: "Some" }, () => scopedNamesFrom(stmts, env, i + 1, acc)).exhaustive());
var tsGenOpts = _curry17(5, (stmts, env, types, letParams, aliases) => {
  const typeAt = typeAtTable(types);
  const letParamAt = typeAtTable(letParams);
  const genericLams = genericLambdasFrom(stmts, env, 0, new Map);
  const scopedNames = scopedNamesFrom(stmts, env, 0, new Map);
  const recs = recordAliasIndex(aliases);
  const typeOf = (e) => _Map_get9(spanKey(exprSpan3(e)), typeAt);
  const envAt = (key) => match16(_Map_get9(key, scopedNames)).with({ _tag: "Some" }, ({ value: vars }) => tsEnv(vars, recs)).with({ _tag: "None" }, () => recsEnv(recs)).exhaustive();
  return { ...jsGenOpts, annotateLet: Some16(_curry17(2, (name, value) => _Str_startsWith4("$", name) ? None16 : match16(value).with({ _tag: "ELambda" }, () => match16(_Map_get9(name, env)).with({ _tag: "Some" }, ({ value: sc }) => Some16(`: ${bindingTsType(sc, value, recs)}`)).with({ _tag: "None" }, () => None16).exhaustive()).otherwise(() => _Option_map3((ts) => `: ${ts}`, _Option_flatMap3((t) => emptyCollTs(t, recsEnv(recs)), _Map_get9(spanKey(exprSpan3(value)), letParamAt)))))), annotateCtor: Some16(_curry17(2, (s, c) => match16(s).with({ _tag: "SType" }, ({ name, params }) => Some16(ctorFactoryTs(name, params, c, aliases, recs))).otherwise(() => None16))), annotateParams: Some16(_curry17(2, (sp, arity) => match16(_Map_get9(spanKey(sp), genericLams)).with({ _tag: "Some" }, ({ value: sc }) => _Option_unwrapOr9({ generics: "", params: [] }, genericLambdaParams(sc, arity, recs))).with({ _tag: "None" }, () => ({ generics: "", params: match16(_Map_get9(spanKey(sp), typeAt)).with({ _tag: "Some" }, ({ value: t }) => lambdaParamTypesTs(t, arity, envAt(spanKey(sp)))).with({ _tag: "None" }, () => []).exhaustive() })).exhaustive())), annotateEmpty: Some16((e) => {
    const key = spanKey(exprSpan3(e));
    return _Option_flatMap3((t) => emptyCollTs(t, envAt(key)), _Map_get9(key, typeAt));
  }), annotateLetin: Some16((value) => _Option_flatMap3((t) => emptyCollTs(t, recsEnv(recs)), _Map_get9(spanKey(exprSpan3(value)), letParamAt))), annotateCall: Some16((e) => _Option_flatMap3((t) => ctorCallTs(t, recs), typeOf(e))), guardBaseType: Some16((e) => _Option_flatMap3((t) => guardParamTs(t, recs), typeOf(e))), flattenPipe: true, tupleHelper: true, preserveInfix: true, preserveJsx: true, moduleExt: "" };
});
var anyOf = _curry17(2, (f, xs) => reduce4(_curry17(2, (acc, x) => or8(acc, f(x))), false, xs));
var hasJsxExpr = (e) => match16(e).with((_v) => {
  const _g = _v;
  return _g._tag === "ECall" && _g.origin._tag === "Some" && _g.origin.value === "jsx";
}, () => true).with({ _tag: "ECall" }, ({ fn, args }) => or8(hasJsxExpr(fn), anyOf(hasJsxExpr, args))).with({ _tag: "ELambda" }, ({ body }) => hasJsxExpr(body)).with({ _tag: "ELetIn" }, ({ value, body }) => or8(hasJsxExpr(value), hasJsxExpr(body))).with({ _tag: "ELetBind" }, ({ value, body }) => or8(hasJsxExpr(value), hasJsxExpr(body))).with({ _tag: "EPipe" }, ({ left, right }) => or8(hasJsxExpr(left), hasJsxExpr(right))).with({ _tag: "EDo" }, ({ exprs }) => anyOf(hasJsxExpr, exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => or8(or8(hasJsxExpr(cond), hasJsxExpr(thenE)), hasJsxExpr(elseE))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => or8(hasJsxExpr(scrutinee), anyOf((a) => or8(match16(a.guard).with({ _tag: "Some" }, ({ value: g }) => hasJsxExpr(g)).with({ _tag: "None" }, () => false).exhaustive(), hasJsxExpr(a.body)), arms))).with({ _tag: "ERecord" }, ({ fields, spread }) => or8(anyOf((f) => hasJsxExpr(f.value), fields), match16(spread).with({ _tag: "Some" }, ({ value }) => hasJsxExpr(value)).with({ _tag: "None" }, () => false).exhaustive())).with({ _tag: "EField" }, ({ target }) => hasJsxExpr(target)).with({ _tag: "ETuple" }, ({ elements }) => anyOf(hasJsxExpr, elements)).with({ _tag: "EArr" }, ({ elements }) => anyOf((el) => match16(el).with({ _tag: "SEExpr" }, ({ expr: value }) => hasJsxExpr(value)).with({ _tag: "SESpread" }, ({ expr: value }) => hasJsxExpr(value)).exhaustive(), elements)).with({ _tag: "EList" }, ({ elements }) => anyOf((el) => match16(el).with({ _tag: "SEExpr" }, ({ expr: value }) => hasJsxExpr(value)).with({ _tag: "SESpread" }, ({ expr: value }) => hasJsxExpr(value)).exhaustive(), elements)).with({ _tag: "ESet" }, ({ elements }) => anyOf((el) => match16(el).with({ _tag: "SEExpr" }, ({ expr: value }) => hasJsxExpr(value)).with({ _tag: "SESpread" }, ({ expr: value }) => hasJsxExpr(value)).exhaustive(), elements)).with({ _tag: "EMap" }, ({ entries }) => anyOf((entry) => or8(hasJsxExpr(entry.key), hasJsxExpr(entry.value)), entries)).with({ _tag: "ELoop" }, ({ params, body }) => or8(anyOf((p) => hasJsxExpr(p.init), params), hasJsxExpr(body))).with({ _tag: "ERecur" }, ({ args }) => anyOf(hasJsxExpr, args)).with({ _tag: "EInterp" }, ({ parts }) => anyOf((part) => match16(part).with({ _tag: "IPLit" }, () => false).with({ _tag: "IPExpr" }, ({ expr: value }) => hasJsxExpr(value)).exhaustive(), parts)).otherwise(() => false);
var hasJsxStmts = (stmts) => anyOf((stmt) => match16(stmt).with({ _tag: "SLet" }, ({ value }) => hasJsxExpr(value)).with({ _tag: "SExpr" }, ({ value }) => hasJsxExpr(value)).otherwise(() => false), stmts);
var emitTsModuleWith = _curry17(12, (stmts, env, types, letParams, aliases, imported, importLines, ns, jsDefs, runtimeDeps, runtimeImport, docs) => {
  const declared = declaredTypeNames(stmts, 0, _Set_fromArray6([]));
  const wanted = referencedCons(stmts, env, 0, _Set_fromArray6([]));
  const recs = recordAliasIndex(aliases);
  const typeHeader = typeHeaderFrom(stmts, aliases, recs, 0);
  const body = codegenWith(stmts, imported, false, ns, jsDefs, runtimeDeps, { ...tsGenOpts(stmts, env, types, letParams, aliases), docs });
  const deps0 = runtimeDepNames(stmts, imported, ns, jsDefs, runtimeDeps);
  const deps = _Str_contains("_tuple(", body) ? _Array_append12("_tuple", deps0) : deps0;
  return ((deps2) => ((runtimeLine) => ((header) => ((typeDeps) => ((typeImportLine) => concat2(`${hasJsxStmts(stmts) ? `/** @jsx h */

` : ""}${_Str_join7(`

`, filter5((part) => not10(eq16(part, "")), [_Str_join7(`
`, header), _Str_join7(`
`, importLines), typeImportLine, runtimeLine, body]))}`, `
`))(eq16(length13(typeDeps), 0) ? "" : `import type { ${_Str_join7(", ", _Array_sort2(typeDeps))} } from "${runtimeImport}";`))(_Array_concat7(_Str_contains("_Curry<", `${_Str_join7(`
`, header)}
${body}`) ? ["_Curry"] : [], builtinTypeNamesFor(declared, wanted, body, 0))))(typeHeader))(eq16(length13(deps2), 0) ? "" : `import { ${_Str_join7(", ", _Array_sort2(deps2))} } from "${runtimeImport}";`))(filter5((d) => or8(and11(and11(and11(and11(and11(and11(and11(not10(eq16(d, "add")), not10(eq16(d, "sub"))), not10(eq16(d, "mul"))), not10(eq16(d, "div"))), not10(eq16(d, "lt"))), not10(eq16(d, "lte"))), not10(eq16(d, "gt"))), not10(eq16(d, "gte"))), _Str_contains(d, body)), deps));
});
var emitTsModule = _curry17(11, (stmts, env, types, letParams, aliases, imported, importLines, ns, jsDefs, runtimeDeps, runtimeImport) => emitTsModuleWith(stmts, env, types, letParams, aliases, imported, importLines, ns, jsDefs, runtimeDeps, runtimeImport, true));
var freeIdsIn = _curry17(2, (t, acc) => match16(t).with({ _tag: "TyVar" }, ({ id }) => _Array_contains4(id, acc) ? acc : _Array_append12(id, acc)).with({ _tag: "TyCon" }, ({ args }) => freeIdsInAll(args, acc)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => freeIdsIn(toT, freeIdsIn(fromT, acc))).with({ _tag: "TyRecord" }, ({ row }) => freeIdsInRow(row, acc)).with({ _tag: "TySingleton" }, () => acc).with({ _tag: "TyOneOf" }, ({ members }) => freeIdsInAll(members, acc)).exhaustive());
var freeIdsInAll = _curry17(2, (ts, acc) => reduce4(_curry17(2, (a, t) => freeIdsIn(t, a)), acc, ts));
var freeIdsInRow = _curry17(2, (row, acc) => match16(row).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => freeIdsInRow(rest, freeIdsIn(fieldType, acc))).otherwise(() => acc));
var lettersFor = _curry17(3, (ids, i, acc) => match16(_Array_get13(i, ids)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: id }) => lettersFor(ids, i + 1, _Map_set8(id, letterAt(i), acc))).exhaustive());
var anyFor = (ids) => reduce4(_curry17(2, (acc, id) => _Map_set8(id, "any", acc)), new Map, ids);
var genericHeadOf = _curry17(2, (ids, names) => eq16(length13(ids), 0) ? "" : `<${_Str_join7(", ", _Map_values2(names))}>`);
var arrowCount = (t) => match16(t).with({ _tag: "TyFn" }, ({ to: toT }) => 1 + arrowCount(toT)).otherwise(() => 0);
var hostParams = _curry17(4, (t, arity, names, i) => i >= arity ? [] : match16(t).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => _Array_prepend9(`${_Str_fromCode3(97 + i)}: ${tsOf(fromT, plainEnv(names))}`, hostParams(toT, arity, names, i + 1))).otherwise(() => []));
var hostReturn = _curry17(3, (t, arity, i) => i >= arity ? t : match16(t).with({ _tag: "TyFn" }, ({ to: toT }) => hostReturn(toT, arity, i + 1)).otherwise(() => t));
var curriedHostType = _curry17(2, (t, arity) => {
  const ids = freeIdsIn(t, []);
  const names = lettersFor(ids, 0, new Map);
  return `${genericHeadOf(ids, names)}${reduce4(_curry17(2, (acc, p) => `(${p}) => ${acc}`), tsOf(hostReturn(t, arity, 0), plainEnv(names)), _Array_reverse2(hostParams(t, arity, names, 0)))}`;
});
var flatHostType = _curry17(2, (t, arity) => {
  const ids = freeIdsIn(t, []);
  const names = lettersFor(ids, 0, new Map);
  const head = genericHeadOf(ids, names);
  return eq16(arity, 0) ? `${head}${tsOf(t, plainEnv(names))}` : curriedOverloads(head, hostParams(t, arity, names, 0), tsOf(hostReturn(t, arity, 0), plainEnv(names)));
});
var externDecl = (e) => {
  const t = e.scheme.ty;
  const n = arrowCount(t);
  return and11(n >= 1, e.curried) ? `export declare const ${e.imported}: ${curriedHostType(t, n)};` : eq16(n, 0) ? `export declare const ${e.imported}: ${tsOf(t, plainEnv(anyFor(freeIdsIn(t, []))))};` : `export declare const ${e.imported}: ${flatHostType(t, n)};`;
};
var externModuleDts = _curry17(2, (externs, aliases) => {
  const wanted = reduce4(_curry17(2, (acc, e) => consInTy(e.scheme.ty, acc)), _Set_fromArray6([]), externs);
  return concat2(_Str_join7(`
`, _Array_concat7(map11((bt) => typeDecl(bt.name, bt.params, bt.ctors, aliases, new Map), filter5((bt) => _Set_has6(bt.name, wanted), builtinTypeDecls)), map11(externDecl, _Array_dedupeBy((e) => e.imported, externs)))), `
`);
});

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
  _curry: `const _curry = (n, f) => function c(...a) {
  if (a.length < n)
    return (...b) => c(...a, ...b);
  if (a.length === n)
    return f(...a);
  return a.slice(n).reduce((g, x) => g(x), f(...a.slice(0, n)));
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
  show: 'const show = (x) => {\n  const t = typeof x;\n  if (t === "string")\n    return JSON.stringify(x);\n  if (t !== "object" || x === null)\n    return String(x);\n  if (Array.isArray(x))\n    return `[${x.map(show).join(", ")}]`;\n  if (x instanceof Map)\n    return `#{${[...x.entries()].map((e) => `${show(e[0])}: ${show(e[1])}`).join(", ")}}`;\n  if (x instanceof Set)\n    return `#{${[...x].map(show).join(", ")}}`;\n  if (typeof x[Symbol.iterator] === "function")\n    return "<List>";\n  if (typeof x._tag === "string") {\n    const ks = Object.keys(x).filter((k) => k !== "_tag");\n    return ks.length === 0 ? x._tag : `${x._tag}(${ks.map((k) => show(x[k])).join(", ")})`;\n  }\n  const ks = Object.keys(x);\n  if (ks.length === 0)\n    return String(x);\n  return `{ ${ks.map((k) => `${k}: ${show(x[k])}`).join(", ")} }`;\n};',
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

var defaultOpts = { open: false, runtime: true, docs: true, moduleExt: ".js", strictEntry: false };
var afterBlanks = _curry18(2, (s, i) => match17(_Str_get4(i, s)).with({ _tag: "Some", value: " " }, () => afterBlanks(s, i + 1)).with({ _tag: "Some", value: "\t" }, () => afterBlanks(s, i + 1)).otherwise((other) => other));
var openDirective = (src) => {
  const t = _Str_trim(src);
  return and12(_Str_startsWith5('"use open"', t), match17(afterBlanks(t, 10)).with({ _tag: "None" }, () => true).with({ _tag: "Some", value: `
` }, () => true).with({ _tag: "Some", value: "r" }, () => true).otherwise(() => false));
};
var openMode = _curry18(2, (src, requested) => or9(requested, openDirective(src)));
var typecheckWith = _curry18(2, (prog, open) => _Result_flatMap8(($env) => Ok10(prog), inferProgram(prog, builtins, namespaces, open)));
var frontend = ($x) => _Result_flatMap8(check)((($x2) => _Result_flatMap8(parse)(lex($x2)))($x));
var pipelineWith = _curry18(2, (src, open) => _Result_flatMap8((stmts) => typecheckWith(stmts, open), frontend(src)));
var typedProgramWith = _curry18(2, (src, opts) => _Result_flatMap8((stmts) => _Result_flatMap8((r) => Ok10(_tuple11(stmts, r)), inferProgramTypes(stmts, builtins, namespaces, openMode(src, opts.open))), frontend(src)));
var typedProgram = (src) => typedProgramWith(src, defaultOpts);
var inferTypesWith = _curry18(2, (src, opts) => _Result_flatMap8((stmts) => _Result_flatMap8((r) => Ok10({ env: r.env, types: map12((hit) => ({ span: hit.span, ty: hit.ty, display: showType(widenLits(hit.ty)) }), r.types), aliases: r.aliases, letParams: r.letParams }), inferProgramTypes(stmts, builtins, namespaces, openMode(src, opts.open))), frontend(src)));
var inferTypes = (src) => inferTypesWith(src, defaultOpts);
var compileWith = _curry18(2, (src, opts) => _Result_flatMap8((prog) => Ok10(codegenWith(prog, new Map, opts.runtime, namespaceRuntime, preludeJsDefs, runtimeDeps, { ...jsGenOpts, docs: opts.docs, moduleExt: opts.moduleExt })), pipelineWith(src, openMode(src, opts.open))));
var compile = (src) => compileWith(src, defaultOpts);
var noImportedKeys = new Map;
var compileTsWith = _curry18(3, (src, runtimeImport, opts) => _Result_flatMap8((stmts) => _Result_flatMap8((r) => Ok10(emitTsModuleWith(stmts, r.env, r.types, r.letParams, r.aliases, noImportedKeys, [], namespaceRuntime, preludeJsDefs, runtimeDeps, runtimeImport, opts.docs)), inferProgramTypes(stmts, builtins, namespaces, openMode(src, opts.open))), frontend(src)));
var compileTs = _curry18(2, (src, runtimeImport) => compileTsWith(src, runtimeImport, defaultOpts));
export {
  compile,
  compileTs,
  compileTsWith,
  compileWith,
  defaultOpts,
  inferTypes,
  inferTypesWith,
  openDirective,
  openMode,
  typedProgram,
  typedProgramWith
};
