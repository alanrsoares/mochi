// @bun
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
var offsetLocTok = _curry2(2, (lt, by) => ({ tok: lt.tok, start: lt.start + by, end: lt.end + by, doc: lt.doc }));
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
import { Err as Err5, None as None8, Ok as Ok6, Some as Some8, _Array_append as _Array_append6, _Array_concat as _Array_concat3, _Array_get as _Array_get6, _Array_prepend as _Array_prepend2, _Option_exists as _Option_exists3, _Option_unwrapOr as _Option_unwrapOr3, _Result_flatMap as _Result_flatMap4, _Result_map as _Result_map4, _Str_codeAt as _Str_codeAt4, _curry as _curry9, _done as _done3, _recur as _recur3, _tuple as _tuple5, and as and6, eq as eq8, length as length6, map as map3, not as not5, or as or5, show as show3 } from "@mochi/compiler/runtime";
import { match as match8 } from "@onrails/pattern";

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

import { Err as Err4, None as None7, Ok as Ok5, Some as Some7, _Array_append as _Array_append5, _Array_concat as _Array_concat2, _Array_get as _Array_get5, _curry as _curry8, eq as eq7, length as length5 } from "@mochi/compiler/runtime";
import { match as match7 } from "@onrails/pattern";

import { Err as Err3, None as None5, Ok as Ok3, Some as Some5, _Array_append as _Array_append4, _Array_concat, _Array_find, _Array_get as _Array_get3, _Map_get as _Map_get2, _Map_keys as _Map_keys2, _Option_exists as _Option_exists2, _Option_isSome, _Option_unwrapOr as _Option_unwrapOr2, _Result_flatMap as _Result_flatMap2, _Result_map as _Result_map2, _Str_codeAt as _Str_codeAt3, _Str_contains, _Str_join as _Str_join3, _Str_length as _Str_length3, _Str_slice as _Str_slice2, _Str_split, _Str_startsWith as _Str_startsWith2, _curry as _curry6, _tuple as _tuple3, and as and4, eq as eq5, length as length3, map as map2, not as not4, or as or4, show as show2 } from "@mochi/compiler/runtime";
import { match as match5 } from "@onrails/pattern";

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

import { None as None4, Some as Some4, _Array_append as _Array_append3, _Array_get as _Array_get2, _Str_codeAt as _Str_codeAt2, _Str_get as _Str_get3, _Str_length as _Str_length2, _Str_startsWith, _curry as _curry5, _tuple as _tuple2, and as and3, eq as eq4, floor, max, min, not as not3, or as or3 } from "@mochi/compiler/runtime";
import { match as match4 } from "@onrails/pattern";
var at = _curry5(3, (xs, i, fallback) => match4(_Array_get2(i, xs)).with({ _tag: "Some" }, ({ value: v }) => v).with({ _tag: "None" }, () => fallback).exhaustive());
var charsEq = _curry5(4, (a, i, b, j) => match4(_tuple2(_Str_get3(i, a), _Str_get3(j, b))).with((_v) => {
  const _g = _v;
  return _g[0]._tag === "Some" && _g[1]._tag === "Some";
}, ([{ value: x }, { value: y }]) => eq4(x, y)).otherwise(() => false));
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
  return eq4(m, 0) ? n : eq4(n, 0) ? m : levFrom(a, b, m, n);
});
var upperStart = (s) => match4(_Str_codeAt2(0, s)).with({ _tag: "Some" }, ({ value: n }) => and3(n >= 65, n <= 90)).with({ _tag: "None" }, () => false).exhaustive();
var sameCaseClass = _curry5(2, (a, b) => eq4(upperStart(a), upperStart(b)));
var skipName = _curry5(2, (want, n) => or3(or3(or3(or3(eq4(n, ""), eq4(n, want)), _Str_startsWith("$", n)), _Str_startsWith("_", n)), not3(sameCaseClass(want, n))));
var consider = _curry5(5, (want, budget, best, bestDist, n) => skipName(want, n) ? _tuple2(best, bestDist) : ((d) => and3(d <= budget, d < bestDist) ? _tuple2(Some4(n), d) : _tuple2(best, bestDist))(lev(want, n)));
var closestFrom = _curry5(6, (want, names, i, budget, best, bestDist) => match4(_Array_get2(i, names)).with({ _tag: "None" }, () => best).with({ _tag: "Some" }, ({ value: n }) => (([next, dist]) => closestFrom(want, names, i + 1, budget, next, dist))(consider(want, budget, best, bestDist, n))).exhaustive());
var closestName = _curry5(2, (want, names) => {
  const budget = max(1, floor(_Str_length2(want) / 3));
  return closestFrom(want, names, 0, budget, None4, _Str_length2(want) + 2);
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

var jxTokName = (t) => match5(t).with({ _tag: "TEq" }, () => "eq").with({ _tag: "TLbrace" }, () => "lbrace").with({ _tag: "TRbrace" }, () => "rbrace").with({ _tag: "TSpread" }, () => "spread").with({ _tag: "TSlash" }, () => "slash").with({ _tag: "TLt" }, () => "lt").with({ _tag: "TGt" }, () => "gt").with({ _tag: "TId" }, () => "id").with({ _tag: "TStr" }, () => "str").with({ _tag: "TNum" }, () => "num").with({ _tag: "TBool" }, () => "bool").with({ _tag: "TEof" }, () => "eof").otherwise(() => "tok");
var jxEofTok = { tok: TEof, start: 0, end: 0, doc: None5 };
var jxTokAt = _curry6(2, (toks, i) => _Option_unwrapOr2(jxEofTok, _Array_get3(i, toks)));
var jxSpanOf = (lt) => ({ start: lt.start, end: lt.end });
var jxToEnd = _curry6(3, (start, toks, pos) => ({ start: start.start, end: jxTokAt(toks, pos - 1).end }));
var jxErrAt = _curry6(2, (message, lt) => Err3({ message, start: lt.start, end: lt.end }));
var jxExpectTok = _curry6(3, (t, toks, pos) => {
  const lt = jxTokAt(toks, pos);
  return eq5(lt.tok, t) ? Ok3(pos + 1) : jxErrAt(`expected ${jxTokName(t)}, got ${jxTokName(lt.tok)}`, lt);
});
var jxExpectId = _curry6(2, (toks, pos) => {
  const lt = jxTokAt(toks, pos);
  return match5(lt.tok).with({ _tag: "TId" }, ({ value: name }) => Ok3(_tuple3({ name, span: jxSpanOf(lt) }, pos + 1))).otherwise((t) => jxErrAt(`expected id, got ${jxTokName(t)}`, lt));
});
var jxKeywordText = (t) => match5(t).with({ _tag: "TLet" }, () => Some5("let")).with({ _tag: "TType" }, () => Some5("type")).with({ _tag: "TExtern" }, () => Some5("extern")).with({ _tag: "TSwitch" }, () => Some5("switch")).with({ _tag: "TLoop" }, () => Some5("loop")).with({ _tag: "TRecur" }, () => Some5("recur")).with({ _tag: "TDo" }, () => Some5("do")).with({ _tag: "TImport" }, () => Some5("import")).with({ _tag: "TExport" }, () => Some5("export")).otherwise(() => None5);
var jxExpectLabel = _curry6(2, (toks, pos) => {
  const lt = jxTokAt(toks, pos);
  return match5(jxKeywordText(lt.tok)).with({ _tag: "Some" }, ({ value: name }) => Ok3(_tuple3({ name, span: jxSpanOf(lt) }, pos + 1))).with({ _tag: "None" }, () => jxExpectId(toks, pos)).exhaustive();
});
var jxAttrNameFrom = _curry6(3, (toks, pos, acc) => {
  const minusTok = jxTokAt(toks, pos);
  const partTok = jxTokAt(toks, pos + 1);
  return and4(and4(eq5(minusTok.tok, TMinus), eq5(minusTok.start, acc.span.end)), eq5(partTok.start, minusTok.end)) ? match5(jxExpectLabel(toks, pos + 1)).with((_v) => {
    const _g = _v;
    return _g._tag === "Ok";
  }, ({ value: [part, p1] }) => jxAttrNameFrom(toks, p1, { name: `${acc.name}-${part.name}`, span: { start: acc.span.start, end: part.span.end } })).with({ _tag: "Err" }, () => _tuple3(acc, pos)).exhaustive() : _tuple3(acc, pos);
});
var jxExpectAttrName = _curry6(2, (toks, pos) => _Result_map2(([head, p1]) => jxAttrNameFrom(toks, p1, head), jxExpectLabel(toks, pos)));
var jxIsUpper = (s) => _Option_exists2((n) => and4(n >= 65, n <= 90), _Str_codeAt3(0, s));
var jxExprSpan = (e) => match5(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var makeJsxCall = _curry6(7, (tagExpr, fields, spreadOpt, children, startTok, toks, endPos) => {
  const fullSpan = jxToEnd(jxSpanOf(startTok), toks, endPos);
  const pragmaRef = ERef("h", jxSpanOf(startTok));
  const propsRecord = ERecord(fields, spreadOpt, fullSpan);
  const childrenArr = EArr(children, fullSpan);
  return ECall(pragmaRef, [tagExpr, propsRecord, childrenArr], Some5("jsx"), fullSpan);
});
var parseJsxAttributes = _curry6(5, (toks, pos, fieldsAcc, spreadAcc, parseExpr) => {
  const tk = jxTokAt(toks, pos).tok;
  const nxt = jxTokAt(toks, pos + 1).tok;
  return or4(eq5(tk, TGt), and4(eq5(tk, TSlash), eq5(nxt, TGt))) ? Ok3(_tuple3(fieldsAcc, spreadAcc, pos)) : eq5(tk, TLbrace) ? _Result_flatMap2((p1) => _Result_flatMap2(([spExpr, p2]) => _Result_flatMap2((p3) => parseJsxAttributes(toks, p3, fieldsAcc, Some5(spExpr), parseExpr), jxExpectTok(TRbrace, toks, p2)), parseExpr(toks, p1)), jxExpectTok(TSpread, toks, pos + 1)) : _Result_flatMap2(([attrId, p1]) => (([valExpr, p2]) => {
    const field = { name: attrId.name, value: valExpr };
    return parseJsxAttributes(toks, p2, _Array_append4(field, fieldsAcc), spreadAcc, parseExpr);
  })(eq5(jxTokAt(toks, p1).tok, TEq) ? ((pEq) => match5(jxTokAt(toks, pEq).tok).with({ _tag: "TStr" }, ({ value: v }) => _tuple3(EStr(v, jxSpanOf(jxTokAt(toks, pEq))), pEq + 1)).with({ _tag: "TLbrace" }, () => match5(parseExpr(toks, pEq + 1)).with((_v) => {
    const _g = _v;
    return _g._tag === "Ok";
  }, ({ value: [e, pR] }) => _tuple3(e, pR + 1)).with({ _tag: "Err" }, () => _tuple3(EBool(true, attrId.span), pEq)).exhaustive()).otherwise(() => _tuple3(EBool(true, attrId.span), pEq)))(p1 + 1) : _tuple3(EBool(true, attrId.span), p1)), jxExpectAttrName(toks, pos));
});
var parseJsxChildren = _curry6(5, (expectedTag, toks, pos, acc, parseExpr) => {
  const lt = jxTokAt(toks, pos);
  const nxt = jxTokAt(toks, pos + 1);
  return eq5(lt.tok, TEof) ? jxErrAt(eq5(expectedTag, "") ? "unclosed JSX fragment" : "unclosed JSX tag", lt) : and4(eq5(lt.tok, TLt), eq5(nxt.tok, TSlash)) ? eq5(expectedTag, "") ? _Result_flatMap2((p1) => Ok3(_tuple3(acc, p1)), jxExpectTok(TGt, toks, pos + 2)) : _Result_flatMap2(([closingId, p1]) => _Result_flatMap2((p2) => eq5(closingId.name, expectedTag) ? Ok3(_tuple3(acc, p2)) : jxErrAt("mismatched JSX closing tag", lt), jxExpectTok(TGt, toks, p1)), jxExpectId(toks, pos + 2)) : eq5(lt.tok, TLt) ? _Result_flatMap2(([childJsx, p1]) => parseJsxChildren(expectedTag, toks, p1, _Array_append4(SEExpr(childJsx), acc), parseExpr), parseJsx(toks, pos, parseExpr)) : eq5(lt.tok, TLbrace) ? eq5(nxt.tok, TSpread) ? _Result_flatMap2(([spChild, p1]) => _Result_flatMap2((p2) => parseJsxChildren(expectedTag, toks, p2, _Array_append4(SESpread(spChild), acc), parseExpr), jxExpectTok(TRbrace, toks, p1)), parseExpr(toks, pos + 2)) : _Result_flatMap2(([childExpr, p1]) => _Result_flatMap2((p2) => parseJsxChildren(expectedTag, toks, p2, _Array_append4(SEExpr(childExpr), acc), parseExpr), jxExpectTok(TRbrace, toks, p1)), parseExpr(toks, pos + 1)) : match5(lt.tok).with({ _tag: "TStr" }, ({ value: v }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append4(SEExpr(EStr(v, jxSpanOf(lt))), acc), parseExpr)).with({ _tag: "TNum" }, ({ value: v, raw }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append4(SEExpr(ENum(v, raw, jxSpanOf(lt))), acc), parseExpr)).with({ _tag: "TBool" }, ({ value: v }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append4(SEExpr(EBool(v, jxSpanOf(lt))), acc), parseExpr)).with({ _tag: "TId" }, ({ value: v }) => parseJsxChildren(expectedTag, toks, pos + 1, _Array_append4(SEExpr(EStr(v, jxSpanOf(lt))), acc), parseExpr)).otherwise(() => jxErrAt("unexpected token in JSX children", lt));
});
var parseJsx = _curry6(3, (toks, pos, parseExpr) => {
  const startTok = jxTokAt(toks, pos);
  const nxt = jxTokAt(toks, pos + 1);
  return eq5(nxt.tok, TGt) ? _Result_flatMap2(([children, p1]) => Ok3(_tuple3(makeJsxCall(EStr("Fragment", jxSpanOf(startTok)), [], None5, children, startTok, toks, p1), p1)), parseJsxChildren("", toks, pos + 2, [], parseExpr)) : _Result_flatMap2(([firstId, p1]) => ((tagRef) => ((tagNameStr) => _Result_flatMap2(([fields, spreadOpt, p2]) => {
    const isSelfClosing = eq5(jxTokAt(toks, p2).tok, TSlash);
    return _Result_flatMap2((p3) => isSelfClosing ? Ok3(_tuple3(makeJsxCall(tagRef, fields, spreadOpt, [], startTok, toks, p3), p3)) : _Result_flatMap2(([children, p4]) => Ok3(_tuple3(makeJsxCall(tagRef, fields, spreadOpt, children, startTok, toks, p4), p4)), parseJsxChildren(tagNameStr, toks, p3, [], parseExpr)), isSelfClosing ? jxExpectTok(TGt, toks, p2 + 1) : jxExpectTok(TGt, toks, p2));
  }, parseJsxAttributes(toks, p1, [], None5, parseExpr)))(firstId.name))(jxIsUpper(firstId.name) ? ERef(firstId.name, firstId.span) : EStr(firstId.name, firstId.span)), jxExpectId(toks, pos + 1));
});
var parseJsxAtom = _curry6(3, (toks, pos, parseExpr) => eq5(jxTokAt(toks, pos).tok, TLt) ? _Result_map2((claim) => Some5(claim), parseJsx(toks, pos, parseExpr)) : Ok3(None5));
var seqElemExpr = (el) => match5(el).with({ _tag: "SEExpr" }, ({ expr: e }) => e).with({ _tag: "SESpread" }, ({ expr: e }) => e).exhaustive();
var inferJsxArrElems = _curry6(3, (elements, st, inferExpr) => match5(elements).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok3(st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([el, ...rest]) => _Result_flatMap2(([_, st1]) => inferJsxArrElems(rest, st1, inferExpr), inferExpr(seqElemExpr(el), st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferJsxChildren = _curry6(3, (children, st, inferExpr) => match5(children).with((_v) => {
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
var rowField = _curry6(2, (row, label) => match5(row).with({ _tag: "RowExtend" }, ({ label: l, fieldType, rest }) => eq5(l, label) ? Some5(fieldType) : rowField(rest, label)).with({ _tag: "RowEmpty" }, () => None5).with({ _tag: "RowVar" }, () => None5).exhaustive());
var fieldNamed = _curry6(2, (label, fields) => match5(fields).with((_v) => _v.length === 0, () => false).with((_v) => _v.length >= 1, ([f, ...rest]) => or4(eq5(f.name, label), fieldNamed(label, rest))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var recordHasAttr = _curry6(2, (expr, label) => match5(expr).with({ _tag: "ERecord" }, ({ fields }) => fieldNamed(label, fields)).otherwise(() => false));
var jsxChildCount = (restArgs) => match5(restArgs).with((_v) => {
  const _g = _v;
  return _g.length >= 1 && _g[0]._tag === "EArr";
}, ([{ elements }]) => length3(elements)).otherwise(() => 0);
var jsxPropsWithSynthesizedChildren = _curry6(4, (propsT, propsExpr, expectedRow, restArgs) => match5(rowField(expectedRow, "children")).with({ _tag: "None" }, () => propsT).with({ _tag: "Some" }, ({ value: expectedChildren }) => match5(propsT).with({ _tag: "TyRecord" }, ({ row: prow }) => or4(recordHasAttr(propsExpr, "children"), eq5(jsxChildCount(restArgs), 0)) ? propsT : tRecord(rExtend("children", expectedChildren, prow))).otherwise(() => propsT)).exhaustive());
var attrKindType = (kind) => eq5(kind, "string") ? Some5(tPrim("string")) : eq5(kind, "number") ? Some5(tPrim("number")) : eq5(kind, "bool") ? Some5(tPrim("bool")) : eq5(kind, "string|number") ? Some5(tUnion([tPrim("string"), tPrim("number")])) : eq5(kind, "string|bool") ? Some5(tUnion([tPrim("string"), tPrim("bool")])) : _Str_startsWith2("enum:", kind) ? Some5(tUnion(map2(tLit, _Str_split(",", _Str_slice2(5, _Str_length3(kind), kind))))) : None5;
var mismatchHint = (name) => match5(name).with("class", () => Some5("In JSX, use 'className' instead of 'class'.")).with("for", () => Some5("In JSX, use 'htmlFor' instead of 'for'.")).with("tabindex", () => Some5("In JSX, use 'tabIndex' instead of 'tabindex'.")).with("autofocus", () => Some5("In JSX, use 'autoFocus' instead of 'autofocus'.")).with("autocomplete", () => Some5("In JSX, use 'autoComplete' instead of 'autocomplete'.")).with("readonly", () => Some5("In JSX, use 'readOnly' instead of 'readonly'.")).with("maxlength", () => Some5("In JSX, use 'maxLength' instead of 'maxlength'.")).with("minlength", () => Some5("In JSX, use 'minLength' instead of 'minlength'.")).with("spellcheck", () => Some5("In JSX, use 'spellCheck' instead of 'spellcheck'.")).with("contenteditable", () => Some5("In JSX, use 'contentEditable' instead of 'contenteditable'.")).with("viewbox", () => Some5("In JSX, use 'viewBox' instead of 'viewbox'.")).with("strokewidth", () => Some5("In JSX, use 'strokeWidth' instead of 'strokewidth'.")).with("strokelinecap", () => Some5("In JSX, use 'strokeLinecap' instead of 'strokelinecap'.")).with("strokelinejoin", () => Some5("In JSX, use 'strokeLinejoin' instead of 'strokelinejoin'.")).with("onclick", () => Some5("In JSX, event handlers are camelCase: use 'onClick' instead of 'onclick'.")).with("onchange", () => Some5("In JSX, event handlers are camelCase: use 'onChange' instead of 'onchange'.")).with("oninput", () => Some5("In JSX, event handlers are camelCase: use 'onInput' instead of 'oninput'.")).with("onkeydown", () => Some5("In JSX, event handlers are camelCase: use 'onKeyDown' instead of 'onkeydown'.")).with("onkeyup", () => Some5("In JSX, event handlers are camelCase: use 'onKeyUp' instead of 'onkeyup'.")).with("onsubmit", () => Some5("In JSX, event handlers are camelCase: use 'onSubmit' instead of 'onsubmit'.")).with("onfocus", () => Some5("In JSX, event handlers are camelCase: use 'onFocus' instead of 'onfocus'.")).with("onblur", () => Some5("In JSX, event handlers are camelCase: use 'onBlur' instead of 'onblur'.")).otherwise(() => None5);
var noJxSuggestions = [];
var jxTypeErr = _curry6(2, (message, sp) => Err3({ message, start: sp.start, end: sp.end, help: None5, suggestions: noJxSuggestions }));
var isHandlerName = (name) => and4(and4(_Str_startsWith2("on", name), _Str_length3(name) > 2), jxIsUpper(_Str_slice2(2, 3, name)));
var isFnOrOpen = (t) => match5(t).with({ _tag: "TyFn" }, () => true).with({ _tag: "TyVar" }, () => true).with({ _tag: "TyCon" }, ({ name }) => eq5(name, "any")).otherwise(() => false);
var checkHandler = _curry6(5, (name, value, st, api, cont) => _Result_flatMap2(([valT, st1]) => isFnOrOpen(zonk(valT, st1)) ? cont(st1) : jxTypeErr(`Expected function for event handler '${name}'`, jxExprSpan(value)), api.inferExpr(value, st)));
var unknownProp = _curry6(4, (tag, name, value, schema) => {
  const hint = closestName(name, _Map_keys2(schema));
  const did = match5(hint).with({ _tag: "Some" }, ({ value: s }) => ` Did you mean '${s}'?`).with({ _tag: "None" }, () => "").exhaustive();
  return jxTypeErr(`Property '${name}' does not exist on '<${tag}>'.${did}`, jxExprSpan(value));
});
var inferIntrinsicFields = _curry6(5, (tag, fields, st, api, schema) => match5(fields).with((_v) => _v.length === 0, () => Ok3(st)).with((_v) => _v.length >= 1, ([f, ...rest]) => ((cont) => match5(mismatchHint(f.name)).with({ _tag: "Some" }, ({ value: msg }) => jxTypeErr(msg, jxExprSpan(f.value))).with({ _tag: "None" }, () => or4(_Str_startsWith2("data-", f.name), _Str_startsWith2("aria-", f.name)) ? _Result_flatMap2(([_, st1]) => cont(st1), api.inferExpr(f.value, st)) : match5(schema).with({ _tag: "None" }, () => _Result_flatMap2(([_, st1]) => cont(st1), api.inferExpr(f.value, st))).with({ _tag: "Some" }, ({ value: m }) => ((expected) => match5(expected).with({ _tag: "None" }, () => unknownProp(tag, f.name, f.value, m)).with({ _tag: "Some" }, ({ value: kind }) => eq5(kind, "event") ? checkHandler(f.name, f.value, st, api, cont) : eq5(kind, "any") ? _Result_flatMap2(([_, st1]) => cont(st1), api.inferExpr(f.value, st)) : match5(attrKindType(kind)).with({ _tag: "Some" }, ({ value: expectedT }) => _Result_flatMap2(([valT, st1]) => _Result_flatMap2((st2) => cont(st2), api.unify(valT, expectedT, st1, jxExprSpan(f.value))), api.inferExpr(f.value, st))).with({ _tag: "None" }, () => _Result_flatMap2(([_, st1]) => cont(st1), api.inferExpr(f.value, st))).exhaustive()).exhaustive())(match5(_Map_get2(f.name, m)).with({ _tag: "Some" }, ({ value: k }) => Some5(k)).with({ _tag: "None" }, () => isHandlerName(f.name) ? Some5("event") : None5).exhaustive())).exhaustive()).exhaustive())((st1) => inferIntrinsicFields(tag, rest, st1, api, schema))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferFragmentFields = _curry6(3, (fields, st, api) => match5(fields).with((_v) => _v.length === 0, () => Ok3(st)).with((_v) => _v.length >= 1, ([f, ...rest]) => eq5(f.name, "key") ? _Result_flatMap2(([_, st1]) => inferFragmentFields(rest, st1, api), api.inferExpr(f.value, st)) : jxTypeErr(`JSX fragments only accept the 'key' prop, got '${f.name}'`, jxExprSpan(f.value))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var unknownTagErr = _curry6(2, (tagName, sp) => {
  const hint = closestName(tagName, _Map_keys2(intrinsicElements));
  const did = match5(hint).with({ _tag: "Some" }, ({ value: s }) => ` Did you mean '<${s}>'?`).with({ _tag: "None" }, () => "").exhaustive();
  return jxTypeErr(`Unknown JSX element '<${tagName}>'.${did}`, sp);
});
var inferStringTag = _curry6(5, (tagName, tagExpr, fields, st, api) => eq5(tagName, "Fragment") ? inferFragmentFields(fields, st, api) : match5(_Map_get2(tagName, intrinsicElements)).with({ _tag: "Some" }, ({ value: schema }) => inferIntrinsicFields(tagName, fields, st, api, Some5(schema))).with({ _tag: "None" }, () => _Str_contains("-", tagName) ? inferIntrinsicFields(tagName, fields, st, api, None5) : unknownTagErr(tagName, jxExprSpan(tagExpr))).exhaustive());
var inferJsxCall = _curry6(5, (tagExpr, propsExpr, restArgs, st, api) => _Result_flatMap2(([tagT, st1]) => _Result_flatMap2(([propsT, st2]) => _Result_flatMap2((st3) => {
  const zonkedTag = zonk(tagT, st3);
  return match5(zonkedTag).with({ _tag: "TyFn" }, ({ from, to }) => match5(from).with({ _tag: "TyRecord" }, ({ row: expectedRow }) => ((propsForCheck) => _Result_map2((st4) => _tuple3(zonk(to, st4), st4), api.unify(propsForCheck, from, st3, jxExprSpan(propsExpr))))(jsxPropsWithSynthesizedChildren(propsT, propsExpr, expectedRow, restArgs))).otherwise(() => Ok3(_tuple3(tPrim("VNode"), st3)))).otherwise(() => match5(tagExpr).with({ _tag: "EStr" }, ({ value: tagName }) => match5(propsExpr).with({ _tag: "ERecord" }, ({ fields }) => _Result_map2((st4) => _tuple3(tPrim("VNode"), st4), inferStringTag(tagName, tagExpr, fields, st3, api))).otherwise(() => Ok3(_tuple3(tPrim("VNode"), st3)))).otherwise(() => Ok3(_tuple3(tPrim("VNode"), st3))));
}, inferJsxChildren(restArgs, st2, api.inferExpr)), api.inferExpr(propsExpr, st1)), api.inferExpr(tagExpr, st)));
var inferJsxCallHook = _curry6(5, (_fn, args, origin, st, api) => match5(origin).with({ _tag: "Some" }, ({ value: o }) => eq5(o, "jsx") ? match5(args).with((_v) => {
  const _g = _v;
  return _g.length >= 2;
}, ([tagExpr, propsExpr, ...rest]) => _Result_map2((r) => Some5(r), inferJsxCall(tagExpr, propsExpr, rest, st, api))).otherwise(() => Ok3(None5)) : Ok3(None5)).with({ _tag: "None" }, () => Ok3(None5)).exhaustive());
var returnsVNode = (t) => match5(t).with({ _tag: "TyFn" }, ({ to: toT }) => returnsVNode(toT)).with({ _tag: "TyCon", name: "VNode" }, () => true).otherwise(() => false);
var isComponentType = (t) => match5(t).with({ _tag: "TyFn" }, ({ to: toT }) => returnsVNode(toT)).otherwise(() => false);
var jsxBodied = (body) => match5(body).with({ _tag: "ELambda" }, ({ body: inner }) => jsxBodied(inner)).with((_v) => {
  const _g = _v;
  return _g._tag === "ECall" && _g.origin._tag === "Some" && _g.origin.value === "jsx";
}, () => true).otherwise(() => false);
var isJsxComponentLambda = (value) => match5(value).with({ _tag: "ELambda" }, ({ body }) => jsxBodied(body)).otherwise(() => false);
var isHandlerLabel = (label) => {
  const third = _Option_exists2((n) => and4(n >= 65, n <= 90), _Str_codeAt3(2, label));
  return and4(_Str_startsWith2("on", label), third);
};
var componentPropFieldTs = _curry6(3, (label, t, api) => match5(t).with({ _tag: "TyVar" }, () => isHandlerLabel(label) ? "() => void" : "unknown").with({ _tag: "TyCon", name: "VNode" }, () => "unknown").otherwise(() => api.tsType(t)));
var propFieldsFrom = _curry6(3, (row, api, acc) => match5(row).with({ _tag: "RowExtend" }, ({ label, fieldType, rest }) => propFieldsFrom(rest, api, _Array_append4(`${label}: ${componentPropFieldTs(label, fieldType, api)}`, acc))).with({ _tag: "RowVar" }, () => _tuple3(acc, true)).otherwise(() => _tuple3(acc, false)));
var hasField = _curry6(2, (fields, name) => _Option_isSome(_Array_find((f) => _Str_startsWith2(`${name}:`, f), fields)));
var componentPropsTs = _curry6(2, (row, api) => (([fields0, open]) => {
  const fields1 = and4(open, not4(hasField(fields0, "children"))) ? _Array_append4("children?: any", fields0) : fields0;
  const fields = and4(open, not4(hasField(fields1, "className"))) ? _Array_append4("className?: string", fields1) : fields1;
  return eq5(length3(fields), 0) ? "{}" : `{ ${_Str_join3("; ", fields)} }`;
})(propFieldsFrom(row, api, [])));
var componentPropsParamTs = _curry6(2, (t, api) => match5(t).with({ _tag: "TyRecord" }, ({ row }) => match5(api.aliasOf(row)).with({ _tag: "Some" }, ({ value: name }) => name).with({ _tag: "None" }, () => componentPropsTs(row, api)).exhaustive()).with({ _tag: "TyVar" }, () => "Record<string, unknown>").otherwise(() => api.tsType(t)));
var extraParamTs = _curry6(2, (t, api) => match5(t).with({ _tag: "TyVar" }, () => "unknown").with({ _tag: "TyCon", name: "VNode" }, () => "any").otherwise(() => api.tsType(t)));
var extraParamsFrom = _curry6(4, (t, api, i, acc) => match5(t).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => extraParamsFrom(toT, api, i + 1, _Array_append4(`_${show2(i)}: ${extraParamTs(fromT, api)}`, acc))).otherwise(() => acc));
var componentSig = _curry6(2, (t, api) => match5(t).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => ((props) => ((extras) => eq5(length3(extras), 0) ? `(${props}) => any` : `_Curry<[${_Str_join3(", ", _Array_concat([props], extras))}], any>`)(extraParamsFrom(toT, api, 1, [])))(`props: ${componentPropsParamTs(fromT, api)}`)).otherwise(() => "(props: Record<string, unknown>) => any"));
var componentBindingTs = _curry6(3, (value, t, api) => match5(t).with((_v) => {
  const _g = _v;
  return _g._tag === "TyCon" && _g.name === "VNode" && _g.args.length === 0;
}, () => Some5("any")).otherwise(() => or4(isComponentType(t), isJsxComponentLambda(value)) ? Some5(componentSig(t, api)) : None5));
var jsxPlugin = { name: "jsx", parse: Some5(parseJsxAtom), inferCall: Some5(inferJsxCallHook), format: None5, dtsBinding: None5, bindingType: Some5(componentBindingTs) };

import { None as None6, Ok as Ok4, Some as Some6, _Array_drop, _Array_get as _Array_get4, _Result_flatMap as _Result_flatMap3, _Result_map as _Result_map3, _curry as _curry7, _tuple as _tuple4, and as and5, eq as eq6, length as length4 } from "@mochi/compiler/runtime";
import { match as match6 } from "@onrails/pattern";
var arrOf = (elem) => tCon("Array", [elem]);
var setStateDomain = (state) => tUnion([state, tArrow(state, state)]);
var isRef = _curry7(2, (fn, name) => match6(fn).with({ _tag: "ERef" }, ({ name: actual }) => eq6(actual, name)).otherwise(() => false));
var preactSpan = (e) => match6(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var inferArgs = _curry7(3, (args, st, inferExpr) => match6(args).with((_v) => _v.length === 0, () => Ok4(st)).with((_v) => _v.length >= 1, ([arg, ...rest]) => _Result_flatMap3(([_, st1]) => inferArgs(rest, st1, inferExpr), inferExpr(arg, st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var inferUseState = _curry7(4, (fn, args, st, api) => and5(isRef(fn, "useState"), eq6(length4(args), 1)) ? match6(_Array_get4(0, args)).with({ _tag: "None" }, () => Ok4(None6)).with({ _tag: "Some" }, ({ value: init }) => _Result_map3(([state, st1]) => Some6(_tuple4(tTuple([zonk(state, st1), tArrow(setStateDomain(zonk(state, st1)), tUnit)]), st1)), api.inferExpr(init, st))).exhaustive() : Ok4(None6));
var inferUseLazyState = _curry7(4, (fn, args, st, api) => and5(isRef(fn, "useLazyState"), eq6(length4(args), 1)) ? match6(_Array_get4(0, args)).with({ _tag: "None" }, () => Ok4(None6)).with({ _tag: "Some" }, ({ value: thunk }) => (([state, st1]) => _Result_flatMap3(([thunkT, st2]) => _Result_map3((st3) => {
  const value = zonk(state, st3);
  return Some6(_tuple4(tTuple([value, tArrow(setStateDomain(value), tUnit)]), st3));
}, api.unify(thunkT, tArrow(tUnit, state), st2, preactSpan(thunk))), api.inferExpr(thunk, st1)))(freshVar(st))).exhaustive() : Ok4(None6));
var inferUseRef = _curry7(4, (fn, args, st, api) => and5(isRef(fn, "useRef"), eq6(length4(args), 1)) ? match6(_Array_get4(0, args)).with({ _tag: "None" }, () => Ok4(None6)).with({ _tag: "Some" }, ({ value: init }) => _Result_map3(([state, st1]) => Some6(_tuple4(tRecord(rExtend("current", zonk(state, st1), RowEmpty)), st1)), api.inferExpr(init, st))).exhaustive() : Ok4(None6));
var inferEffectLike = _curry7(5, (fn, args, st, api, name) => and5(isRef(fn, name), length4(args) >= 1) ? match6(_Array_get4(0, args)).with({ _tag: "None" }, () => Ok4(None6)).with({ _tag: "Some" }, ({ value: effect }) => (([cleanup, st1]) => _Result_flatMap3(([effectT, st2]) => _Result_flatMap3((st3) => eq6(length4(args), 1) ? (([dep, st4]) => Ok4(Some6(_tuple4(tArrow(arrOf(dep), tUnit), st4))))(freshVar(st3)) : _Result_map3((st4) => Some6(_tuple4(tUnit, st4)), inferArgs(_Array_drop(1, args), st3, api.inferExpr)), api.unify(effectT, tArrow(tUnit, cleanup), st2, preactSpan(effect))), api.inferExpr(effect, st1)))(freshVar(st))).exhaustive() : Ok4(None6));
var inferUseCallback = _curry7(4, (fn, args, st, api) => and5(isRef(fn, "useCallback"), length4(args) >= 1) ? match6(_Array_get4(0, args)).with({ _tag: "None" }, () => Ok4(None6)).with({ _tag: "Some" }, ({ value: callback }) => _Result_flatMap3(([callbackT, st1]) => eq6(length4(args), 1) ? (([dep, st2]) => Ok4(Some6(_tuple4(tArrow(arrOf(dep), zonk(callbackT, st2)), st2))))(freshVar(st1)) : _Result_map3((st2) => Some6(_tuple4(zonk(callbackT, st2), st2)), inferArgs(_Array_drop(1, args), st1, api.inferExpr)), api.inferExpr(callback, st))).exhaustive() : Ok4(None6));
var inferUseMemo = _curry7(4, (fn, args, st, api) => and5(isRef(fn, "useMemo"), length4(args) >= 1) ? match6(_Array_get4(0, args)).with({ _tag: "None" }, () => Ok4(None6)).with({ _tag: "Some" }, ({ value: thunk }) => (([value, st1]) => _Result_flatMap3(([thunkT, st2]) => _Result_flatMap3((st3) => eq6(length4(args), 1) ? (([dep, st4]) => Ok4(Some6(_tuple4(tArrow(arrOf(dep), zonk(value, st4)), st4))))(freshVar(st3)) : _Result_map3((st4) => Some6(_tuple4(zonk(value, st4), st4)), inferArgs(_Array_drop(1, args), st3, api.inferExpr)), api.unify(thunkT, tArrow(tUnit, value), st2, preactSpan(thunk))), api.inferExpr(thunk, st1)))(freshVar(st))).exhaustive() : Ok4(None6));
var inferHookDeps = _curry7(4, (fn, args, st, api) => {
  const expected = isRef(fn, "hookDeps0") ? Some6(0) : isRef(fn, "hookDeps1") ? Some6(1) : isRef(fn, "hookDeps2") ? Some6(2) : isRef(fn, "hookDeps") ? Some6(3) : None6;
  return match6(expected).with({ _tag: "Some" }, ({ value: n }) => eq6(length4(args), n) ? _Result_map3((st1) => (([elem, st2]) => Some6(_tuple4(arrOf(elem), st2)))(freshVar(st1)), inferArgs(args, st, api.inferExpr)) : Ok4(None6)).with({ _tag: "None" }, () => Ok4(None6)).exhaustive();
});
var inferPreactCall = _curry7(5, (fn, args, _origin, st, api) => _Result_flatMap3((first) => match6(first).with({ _tag: "Some" }, () => Ok4(first)).with({ _tag: "None" }, () => _Result_flatMap3((lazy) => match6(lazy).with({ _tag: "Some" }, () => Ok4(lazy)).with({ _tag: "None" }, () => _Result_flatMap3((ref) => match6(ref).with({ _tag: "Some" }, () => Ok4(ref)).with({ _tag: "None" }, () => _Result_flatMap3((effect) => match6(effect).with({ _tag: "Some" }, () => Ok4(effect)).with({ _tag: "None" }, () => _Result_flatMap3((layout) => match6(layout).with({ _tag: "Some" }, () => Ok4(layout)).with({ _tag: "None" }, () => _Result_flatMap3((callback) => match6(callback).with({ _tag: "Some" }, () => Ok4(callback)).with({ _tag: "None" }, () => _Result_flatMap3((memo) => match6(memo).with({ _tag: "Some" }, () => Ok4(memo)).with({ _tag: "None" }, () => inferHookDeps(fn, args, st, api)).exhaustive(), inferUseMemo(fn, args, st, api))).exhaustive(), inferUseCallback(fn, args, st, api))).exhaustive(), inferEffectLike(fn, args, st, api, "useLayoutEffect"))).exhaustive(), inferEffectLike(fn, args, st, api, "useEffect"))).exhaustive(), inferUseRef(fn, args, st, api))).exhaustive(), inferUseLazyState(fn, args, st, api))).exhaustive(), inferUseState(fn, args, st, api)));
var preactPlugin = { name: "preact", parse: None6, inferCall: Some6(inferPreactCall), format: None6, dtsBinding: None6, bindingType: None6 };

var DEFAULT_PLUGINS = [jsxPlugin];
var resolvePlugins = _curry8(2, (pluginsOpt, builtins) => match7(pluginsOpt).with({ _tag: "None" }, () => builtins).with({ _tag: "Some" }, ({ value: ps }) => eq7(length5(ps), 0) ? [] : _Array_concat2(builtins, ps)).exhaustive());
var resolvePluginsDefault = (pluginsOpt) => resolvePlugins(pluginsOpt, DEFAULT_PLUGINS);
var parseHooksFrom = _curry8(3, (plugins, i, acc) => match7(_Array_get5(i, plugins)).with({ _tag: "None" }, () => acc).with((_v) => _v._tag === "Some", ({ value: { parse } }) => match7(parse).with({ _tag: "Some" }, ({ value: hook }) => parseHooksFrom(plugins, i + 1, _Array_append5(hook, acc))).with({ _tag: "None" }, () => parseHooksFrom(plugins, i + 1, acc)).exhaustive()).exhaustive());
var parseHooksOf = (plugins) => parseHooksFrom(plugins, 0, []);
var inferHooksFrom = _curry8(3, (plugins, i, acc) => match7(_Array_get5(i, plugins)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => match7(p.inferCall).with({ _tag: "Some" }, ({ value: hook }) => inferHooksFrom(plugins, i + 1, _Array_append5(hook, acc))).with({ _tag: "None" }, () => inferHooksFrom(plugins, i + 1, acc)).exhaustive()).exhaustive());
var runParseHooks = _curry8(4, (hooks, toks, pos, parseExpr) => match7(hooks).with((_v) => _v.length === 0, () => Ok5(None7)).with((_v) => _v.length >= 1, ([hook, ...rest]) => match7(hook(toks, pos, parseExpr)).with({ _tag: "Err" }, ({ error: e }) => Err4(e)).with({ _tag: "Ok" }, ({ value: v }) => match7(v).with({ _tag: "None" }, () => runParseHooks(rest, toks, pos, parseExpr)).with({ _tag: "Some" }, ({ value: claim }) => Ok5(Some7(claim))).exhaustive()).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var runInferCallHooks = _curry8(6, (hooks, fn, args, origin, st, api) => match7(hooks).with((_v) => _v.length === 0, () => Ok5(None7)).with((_v) => _v.length >= 1, ([hook, ...rest]) => match7(hook(fn, args, origin, st, api)).with({ _tag: "Err" }, ({ error: e }) => Err4(e)).with({ _tag: "Ok" }, ({ value: v }) => match7(v).with({ _tag: "None" }, () => runInferCallHooks(rest, fn, args, origin, st, api)).with({ _tag: "Some" }, ({ value: claim }) => Ok5(Some7(claim))).exhaustive()).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var formatHooksFrom = _curry8(3, (plugins, i, acc) => match7(_Array_get5(i, plugins)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => match7(p.format).with({ _tag: "Some" }, ({ value: hook }) => formatHooksFrom(plugins, i + 1, _Array_append5(hook, acc))).with({ _tag: "None" }, () => formatHooksFrom(plugins, i + 1, acc)).exhaustive()).exhaustive());
var formatHooksOf = (plugins) => formatHooksFrom(plugins, 0, []);
var formatHooksFor = (pluginsOpt) => formatHooksOf(resolvePluginsDefault(pluginsOpt));
var dtsHooksFrom = _curry8(3, (plugins, i, acc) => match7(_Array_get5(i, plugins)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => match7(p.dtsBinding).with({ _tag: "Some" }, ({ value: hook }) => dtsHooksFrom(plugins, i + 1, _Array_append5(hook, acc))).with({ _tag: "None" }, () => dtsHooksFrom(plugins, i + 1, acc)).exhaustive()).exhaustive());
var runFormatHooks = _curry8(2, (hooks, e) => match7(hooks).with((_v) => _v.length === 0, () => None7).with((_v) => _v.length >= 1, ([hook, ...rest]) => match7(hook(e)).with({ _tag: "Some" }, ({ value: out }) => Some7(out)).with({ _tag: "None" }, () => runFormatHooks(rest, e)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var runDtsHooks = _curry8(5, (hooks, name, value, ty, api) => match7(hooks).with((_v) => _v.length === 0, () => None7).with((_v) => _v.length >= 1, ([hook, ...rest]) => match7(hook(name, value, ty, api)).with({ _tag: "Some" }, ({ value: ts }) => Some7(ts)).with({ _tag: "None" }, () => runDtsHooks(rest, name, value, ty, api)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var bindingHooksFrom = _curry8(3, (plugins, i, acc) => match7(_Array_get5(i, plugins)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => match7(p.bindingType).with({ _tag: "Some" }, ({ value: hook }) => bindingHooksFrom(plugins, i + 1, _Array_append5(hook, acc))).with({ _tag: "None" }, () => bindingHooksFrom(plugins, i + 1, acc)).exhaustive()).exhaustive());
var runBindingHooks = _curry8(4, (hooks, value, ty, api) => match7(hooks).with((_v) => _v.length === 0, () => None7).with((_v) => _v.length >= 1, ([hook, ...rest]) => match7(hook(value, ty, api)).with({ _tag: "Some" }, ({ value: ts }) => Some7(ts)).with({ _tag: "None" }, () => runBindingHooks(rest, value, ty, api)).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));

var tokName = (t) => match8(t).with({ _tag: "TLet" }, () => "let").with({ _tag: "TType" }, () => "type").with({ _tag: "TExtern" }, () => "extern").with({ _tag: "TSwitch" }, () => "switch").with({ _tag: "TLoop" }, () => "loop").with({ _tag: "TRecur" }, () => "recur").with({ _tag: "TDo" }, () => "do").with({ _tag: "TImport" }, () => "import").with({ _tag: "TExport" }, () => "export").with({ _tag: "TEq" }, () => "eq").with({ _tag: "TArrow" }, () => "arrow").with({ _tag: "TTarrow" }, () => "tarrow").with({ _tag: "TPipe" }, () => "pipe").with({ _tag: "TCompose" }, () => "compose").with({ _tag: "TConcat" }, () => "concat").with({ _tag: "TBar" }, () => "bar").with({ _tag: "TLparen" }, () => "lparen").with({ _tag: "TRparen" }, () => "rparen").with({ _tag: "TLbrace" }, () => "lbrace").with({ _tag: "TRbrace" }, () => "rbrace").with({ _tag: "TLbracket" }, () => "lbracket").with({ _tag: "TRbracket" }, () => "rbracket").with({ _tag: "TSpread" }, () => "spread").with({ _tag: "TPlus" }, () => "plus").with({ _tag: "TMinus" }, () => "minus").with({ _tag: "TStar" }, () => "star").with({ _tag: "TSlash" }, () => "slash").with({ _tag: "TPercent" }, () => "percent").with({ _tag: "TAt" }, () => "at").with({ _tag: "THash" }, () => "hash").with({ _tag: "TTilde" }, () => "tilde").with({ _tag: "TDot" }, () => "dot").with({ _tag: "TColon" }, () => "colon").with({ _tag: "TQuestion" }, () => "question").with({ _tag: "TEqeq" }, () => "eqeq").with({ _tag: "TNeq" }, () => "neq").with({ _tag: "TLte" }, () => "lte").with({ _tag: "TGte" }, () => "gte").with({ _tag: "TLt" }, () => "lt").with({ _tag: "TGt" }, () => "gt").with({ _tag: "TAndand" }, () => "andand").with({ _tag: "TOror" }, () => "oror").with({ _tag: "TBang" }, () => "bang").with({ _tag: "TBacktick" }, () => "backtick").with({ _tag: "TComma" }, () => "comma").with({ _tag: "TSemi" }, () => "semi").with({ _tag: "TNum" }, () => "num").with({ _tag: "TBool" }, () => "bool").with({ _tag: "TStr" }, () => "str").with({ _tag: "TTmplStart" }, () => "tmplstart").with({ _tag: "TTmplMid" }, () => "tmplmid").with({ _tag: "TTmplEnd" }, () => "tmplend").with({ _tag: "TId" }, () => "id").with({ _tag: "TEof" }, () => "eof").exhaustive();
var eofTok = { tok: TEof, start: 0, end: 0, doc: None8 };
var tokAt = _curry9(2, (toks, i) => _Option_unwrapOr3(eofTok, _Array_get6(i, toks)));
var spanOf = (lt) => ({ start: lt.start, end: lt.end });
var spanning = _curry9(2, (a, b) => ({ start: a.start, end: b.end }));
var toEnd = _curry9(3, (start, toks, pos) => ({ start: start.start, end: tokAt(toks, pos - 1).end }));
var errAt = _curry9(2, (message, lt) => Err5({ message, start: lt.start, end: lt.end }));
var expectTok = _curry9(3, (t, toks, pos) => {
  const lt = tokAt(toks, pos);
  return eq8(lt.tok, t) ? Ok6(pos + 1) : errAt(`expected ${tokName(t)}, got ${tokName(lt.tok)}`, lt);
});
var expectId = _curry9(2, (toks, pos) => {
  const lt = tokAt(toks, pos);
  return match8(lt.tok).with({ _tag: "TId" }, ({ value: name }) => Ok6(_tuple5({ name, span: spanOf(lt) }, pos + 1))).otherwise((t) => errAt(`expected id, got ${tokName(t)}`, lt));
});
var keywordText = (t) => match8(t).with({ _tag: "TLet" }, () => Some8("let")).with({ _tag: "TType" }, () => Some8("type")).with({ _tag: "TExtern" }, () => Some8("extern")).with({ _tag: "TSwitch" }, () => Some8("switch")).with({ _tag: "TLoop" }, () => Some8("loop")).with({ _tag: "TRecur" }, () => Some8("recur")).with({ _tag: "TDo" }, () => Some8("do")).with({ _tag: "TImport" }, () => Some8("import")).with({ _tag: "TExport" }, () => Some8("export")).otherwise(() => None8);
var expectLabel = _curry9(2, (toks, pos) => {
  const lt = tokAt(toks, pos);
  return match8(keywordText(lt.tok)).with({ _tag: "Some" }, ({ value: name }) => Ok6(_tuple5({ name, span: spanOf(lt) }, pos + 1))).with({ _tag: "None" }, () => expectId(toks, pos)).exhaustive();
});
var expectStr = _curry9(2, (toks, pos) => {
  const lt = tokAt(toks, pos);
  return match8(lt.tok).with({ _tag: "TStr" }, ({ value }) => Ok6(_tuple5(value, pos + 1))).otherwise((t) => errAt(`expected str, got ${tokName(t)}`, lt));
});
var expectIn = _curry9(2, (toks, pos) => _Result_flatMap4(([kw, p]) => eq8(kw.name, "in") ? Ok6(p) : errAt(`expected 'in' after let binding, got '${kw.name}'`, tokAt(toks, p)), expectId(toks, pos)));
var isUpper = (s) => _Option_exists3((n) => and6(n >= 65, n <= 90), _Str_codeAt4(0, s));
var sepBy = _curry9(4, (parseItem, toks, pos, acc) => _Result_flatMap4(([item, p]) => {
  const items = _Array_append6(item, acc);
  return eq8(tokAt(toks, p).tok, TComma) ? sepBy(parseItem, toks, p + 1, items) : Ok6(_tuple5(items, p));
}, parseItem(toks, pos)));
var sepByH = _curry9(5, (parseItem, toks, pos, acc, hooks) => _Result_flatMap4(([item, p]) => {
  const items = _Array_append6(item, acc);
  return eq8(tokAt(toks, p).tok, TComma) ? sepByH(parseItem, toks, p + 1, items, hooks) : Ok6(_tuple5(items, p));
}, parseItem(toks, pos, hooks)));
var listUntil = _curry9(4, (close, parseItem, toks, pos) => eq8(tokAt(toks, pos).tok, close) ? Ok6(_tuple5([], pos)) : sepBy(parseItem, toks, pos, []));
var listUntilH = _curry9(5, (close, parseItem, toks, pos, hooks) => eq8(tokAt(toks, pos).tok, close) ? Ok6(_tuple5([], pos)) : sepByH(parseItem, toks, pos, [], hooks));
var scanLambdaDepth = _curry9(3, (toks, k, depth) => match8(tokAt(toks, k).tok).with({ _tag: "TLparen" }, () => scanLambdaDepth(toks, k + 1, depth + 1)).with({ _tag: "TRparen" }, () => eq8(depth, 1) ? eq8(tokAt(toks, k + 1).tok, TArrow) : scanLambdaDepth(toks, k + 1, depth - 1)).with({ _tag: "TEof" }, () => false).otherwise(() => scanLambdaDepth(toks, k + 1, depth)));
var looksLikeLambda = _curry9(2, (toks, pos) => match8(tokAt(toks, pos).tok).with({ _tag: "TId" }, () => eq8(tokAt(toks, pos + 1).tok, TArrow)).with({ _tag: "TLparen" }, () => scanLambdaDepth(toks, pos, 0)).otherwise(() => false));
var exprSpan = (e) => match8(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var tySpan = (t) => match8(t).with({ _tag: "TyName" }, ({ span: sp }) => sp).with({ _tag: "TyArrow" }, ({ span: sp }) => sp).with({ _tag: "TyApp" }, ({ span: sp }) => sp).with({ _tag: "TyTuple" }, ({ span: sp }) => sp).with({ _tag: "TyList" }, ({ span: sp }) => sp).with({ _tag: "TyQual" }, ({ span: sp }) => sp).with({ _tag: "TyLit" }, ({ span: sp }) => sp).with({ _tag: "TyUnion" }, ({ span: sp }) => sp).exhaustive();
var parseParam = _curry9(2, (toks, pos) => match8(tokAt(toks, pos).tok).with({ _tag: "TLbrace" }, () => _Result_flatMap4(([fields, p]) => _Result_flatMap4((p2) => Ok6(_tuple5(LPSpanned(LPRecord(map3((f) => f.name, fields)), map3((f) => f.span, fields)), p2)), expectTok(TRbrace, toks, p)), listUntil(TRbrace, expectId, toks, pos + 1))).with({ _tag: "TLparen" }, () => _Result_flatMap4(([names, p]) => _Result_flatMap4((p2) => Ok6(match8(names).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([single]) => _tuple5(LPSpanned(LPName(single.name, None8), [single.span]), p2)).otherwise((many) => _tuple5(LPSpanned(LPTuple(map3((n) => n.name, many)), map3((n) => n.span, many)), p2))), expectTok(TRparen, toks, p)), sepBy(expectId, toks, pos + 1, []))).otherwise(() => _Result_flatMap4(([nm, p]) => eq8(tokAt(toks, p).tok, TColon) ? _Result_map4(([annot, p2]) => _tuple5(LPSpanned(LPName(nm.name, Some8(annot)), [nm.span]), p2), parseTypeExpr(toks, p + 1)) : Ok6(_tuple5(LPSpanned(LPName(nm.name, None8), [nm.span]), p)), expectId(toks, pos))));
var parseLabeledParam = _curry9(3, (toks, pos, hooks) => _Result_flatMap4((p0) => _Result_flatMap4(([nm, p1]) => ((optional) => ((p2) => _Result_flatMap4(([annot, p3]) => eq8(tokAt(toks, p3).tok, TEq) ? _Result_map4(([d, k]) => _tuple5(LPSpanned(LPLabeled(nm.name, annot, optional, Some8(d)), [nm.span]), k), parseExpr(toks, p3 + 1, hooks)) : Ok6(_tuple5(LPSpanned(LPLabeled(nm.name, annot, optional, None8), [nm.span]), p3)), eq8(tokAt(toks, p2).tok, TColon) ? _Result_map4(([t, k]) => _tuple5(Some8(t), k), parseTypeExpr(toks, p2 + 1)) : Ok6(_tuple5(None8, p2))))(optional ? p1 + 1 : p1))(eq8(tokAt(toks, p1).tok, TQuestion)), expectLabel(toks, p0)), expectTok(TTilde, toks, pos)));
var parseLamParam = _curry9(3, (toks, pos, hooks) => eq8(tokAt(toks, pos).tok, TTilde) ? parseLabeledParam(toks, pos, hooks) : parseParam(toks, pos));
var isLabeledParam = (p) => match8(p).with({ _tag: "LPLabeled" }, () => true).with({ _tag: "LPSpanned" }, ({ param: inner }) => isLabeledParam(inner)).otherwise(() => false);
var labeledTrailing = _curry9(2, (params, seen) => match8(params).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => true).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => isLabeledParam(p) ? labeledTrailing(rest, true) : and6(not5(seen), labeledTrailing(rest, false))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var parseLambda = _curry9(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return match8(tokAt(toks, pos).tok).with({ _tag: "TId" }, ({ value: name }) => _Result_flatMap4((p) => _Result_flatMap4(([body, p2]) => Ok6(_tuple5(ELambda([LPSpanned(LPName(name, None8), [spanOf(tokAt(toks, pos))])], body, toEnd(start, toks, p2)), p2)), parseLambdaBody(toks, p, hooks)), expectTok(TArrow, toks, pos + 1))).otherwise(() => _Result_flatMap4((p) => _Result_flatMap4(([params, p2]) => _Result_flatMap4((p3) => labeledTrailing(params, false) ? _Result_flatMap4((p4) => _Result_flatMap4(([body, p5]) => Ok6(_tuple5(ELambda(params, body, toEnd(start, toks, p5)), p5)), parseLambdaBody(toks, p4, hooks)), expectTok(TArrow, toks, p3)) : errAt("labeled parameters must be a trailing group", tokAt(toks, p)), expectTok(TRparen, toks, p2)), listUntilH(TRparen, parseLamParam, toks, p, hooks)), expectTok(TLparen, toks, pos)));
});
var parseLambdaBody = _curry9(3, (toks, pos, hooks) => and6(eq8(tokAt(toks, pos).tok, TLbrace), arrowBodyIsDoBlock(toks, pos, 0)) ? parseDoBlock(toks, pos, hooks) : parseExpr(toks, pos, hooks));
var arrowBodyIsDoBlock = _curry9(3, (toks, pos, depth) => match8(tokAt(toks, pos).tok).with({ _tag: "TLbrace" }, () => arrowBodyIsDoBlock(toks, pos + 1, depth + 1)).with({ _tag: "TRbrace" }, () => eq8(depth, 1) ? false : arrowBodyIsDoBlock(toks, pos + 1, depth - 1)).with({ _tag: "TSemi" }, () => or5(eq8(depth, 1), arrowBodyIsDoBlock(toks, pos + 1, depth))).with({ _tag: "TEof" }, () => false).otherwise(() => arrowBodyIsDoBlock(toks, pos + 1, depth)));
var parseLetIn = _curry9(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => or5(eq8(tokAt(toks, p).tok, TQuestion), eq8(tokAt(toks, p).tok, TBang)) ? ((monad) => ((paramSpan) => _Result_flatMap4(([param, p1]) => _Result_flatMap4((p2) => _Result_flatMap4(([value, p3]) => _Result_flatMap4((p4) => _Result_flatMap4(([body, p5]) => Ok6(_tuple5(ELetBind(param, paramSpan, monad, value, body, toEnd(start, toks, p5)), p5)), parseExpr(toks, p4, hooks)), expectIn(toks, p3)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, p1)), parseParam(toks, p + 1)))(spanOf(tokAt(toks, p + 1))))(eq8(tokAt(toks, p).tok, TQuestion) ? "Result" : "Task") : eq8(tokAt(toks, p).tok, TLparen) ? ((paramStart) => _Result_flatMap4(([param, p1]) => _Result_flatMap4((p2) => _Result_flatMap4(([value, p3]) => _Result_flatMap4((p4) => _Result_flatMap4(([body, p5]) => ((fn) => Ok6(_tuple5(ECall(fn, [value], None8, toEnd(start, toks, p5)), p5)))(ELambda([param], body, toEnd(paramStart, toks, p5))), parseExpr(toks, p4, hooks)), expectIn(toks, p3)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, p1)), parseParam(toks, p)))(spanOf(tokAt(toks, p))) : _Result_flatMap4(([nm, p1]) => _Result_flatMap4(([annot, pA]) => _Result_flatMap4((p2) => _Result_flatMap4(([value, p3]) => _Result_flatMap4((p4) => _Result_flatMap4(([body, p5]) => Ok6(_tuple5(ELetIn(nm.name, nm.span, annot, value, body, toEnd(start, toks, p5)), p5)), parseExpr(toks, p4, hooks)), expectIn(toks, p3)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, pA)), eq8(tokAt(toks, p1).tok, TColon) ? _Result_map4(([ty, k]) => _tuple5(Some8(ty), k), parseTypeExpr(toks, p1 + 1)) : Ok6(_tuple5(None8, p1))), expectId(toks, p)), expectTok(TLet, toks, pos));
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
var mkBinCall = _curry9(4, (fnName, opSpan, left, right) => ECall(ERef(fnName, opSpan), [left, right], None8, spanning(exprSpan(left), exprSpan(right))));
var opFnName = (t) => match8(t).with({ _tag: "TPlus" }, () => "add").with({ _tag: "TMinus" }, () => "sub").with({ _tag: "TStar" }, () => "mul").with({ _tag: "TSlash" }, () => "div").with({ _tag: "TPercent" }, () => "mod").with({ _tag: "TAndand" }, () => "and").with({ _tag: "TOror" }, () => "or").with({ _tag: "TConcat" }, () => "concat").with({ _tag: "TEqeq" }, () => "eq").with({ _tag: "TLt" }, () => "lt").with({ _tag: "TLte" }, () => "lte").with({ _tag: "TGt" }, () => "gt").with({ _tag: "TGte" }, () => "gte").otherwise(() => "eq");
var isSectionOp = (t) => match8(t).with({ _tag: "TPlus" }, () => true).with({ _tag: "TMinus" }, () => true).with({ _tag: "TStar" }, () => true).with({ _tag: "TSlash" }, () => true).with({ _tag: "TPercent" }, () => true).with({ _tag: "TAndand" }, () => true).with({ _tag: "TOror" }, () => true).with({ _tag: "TConcat" }, () => true).with({ _tag: "TEqeq" }, () => true).with({ _tag: "TNeq" }, () => true).with({ _tag: "TLt" }, () => true).with({ _tag: "TLte" }, () => true).with({ _tag: "TGt" }, () => true).with({ _tag: "TGte" }, () => true).otherwise(() => false);
var sectionBody = _curry9(4, (opTok, x, y, opSpan) => {
  const full = spanning(exprSpan(x), exprSpan(y));
  return eq8(opTok, TNeq) ? ECall(ERef("not", opSpan), [mkBinCall("eq", opSpan, x, y)], None8, full) : mkBinCall(opFnName(opTok), opSpan, x, y);
});
var sectionLeft = _curry9(2, (provided, opLt) => {
  const opSpan = spanOf(opLt);
  const paramRef = ERef("$s", opSpan);
  return ELambda([LPName("$s", None8)], sectionBody(opLt.tok, provided, paramRef, opSpan), spanning(exprSpan(provided), opSpan));
});
var parseRightSection = _curry9(4, (toks, lparenSpan, pos, hooks) => {
  const lt = tokAt(toks, pos);
  return _Result_flatMap4(([y, p1]) => _Result_flatMap4((p2) => ((paramRef) => Ok6(_tuple5(ELambda([LPName("$s", None8)], sectionBody(lt.tok, paramRef, y, spanOf(lt)), toEnd(lparenSpan, toks, p2)), p2)))(ERef("$s", spanOf(lt))), expectTok(TRparen, toks, p1)), parseExpr(toks, pos + 1, hooks));
});
var binCallOrLeftSection = _curry9(7, (toks, left, lt, pos, bp, fnName, hooks) => eq8(tokAt(toks, pos + 1).tok, TRparen) ? Ok6({ left: sectionLeft(left, lt), p: pos + 1, matched: true }) : _Result_flatMap4(([right, p]) => Ok6({ left: mkBinCall(fnName, spanOf(lt), left, right), p, matched: true }), parseExprBp(toks, bp + 1, pos + 1, hooks)));
var isCmpTok = (t) => match8(t).with({ _tag: "TEqeq" }, () => true).with({ _tag: "TNeq" }, () => true).with({ _tag: "TLt" }, () => true).with({ _tag: "TLte" }, () => true).with({ _tag: "TGt" }, () => true).with({ _tag: "TGte" }, () => true).otherwise(() => false);
var cmpFnName = (t) => match8(t).with({ _tag: "TLt" }, () => "lt").with({ _tag: "TLte" }, () => "lte").with({ _tag: "TGt" }, () => "gt").with({ _tag: "TGte" }, () => "gte").otherwise(() => "eq");
var parseInfix = _curry9(5, (toks, minBp, left, pos, hooks) => {
  const lt = tokAt(toks, pos);
  return and6(eq8(lt.tok, TPipe), PIPE_BP >= minBp) ? _Result_flatMap4(([right, p]) => Ok6({ left: EPipe(left, right, false, spanning(exprSpan(left), exprSpan(right))), p, matched: true }), parseAtomOrCall(toks, pos + 1, hooks)) : and6(eq8(lt.tok, TTarrow), FAST_PIPE_BP >= minBp) ? _Result_flatMap4(([right, p]) => match8(right).with({ _tag: "ECall" }, ({ span: rightSpan }) => Ok6({ left: EPipe(left, right, true, spanning(exprSpan(left), rightSpan)), p, matched: true })).otherwise(() => errAt("fast pipe needs a call on the right, like `a -> f(b)`", lt)), parseAtomOrCall(toks, pos + 1, hooks)) : and6(eq8(lt.tok, TCompose), COMPOSE_BP >= minBp) ? _Result_flatMap4(([right, p]) => ((opSpan) => ((xRef) => ((innerCall) => ((outerCall) => ((fn) => Ok6({ left: fn, p, matched: true }))(ELambda([LPName("$x", None8)], outerCall, spanning(exprSpan(left), exprSpan(right)))))(ECall(right, [innerCall], None8, spanning(exprSpan(left), exprSpan(right)))))(ECall(left, [xRef], None8, exprSpan(left))))(ERef("$x", opSpan)))(spanOf(lt)), parseExprBp(toks, COMPOSE_BP + 1, pos + 1, hooks)) : and6(isCmpTok(lt.tok), CMP_BP >= minBp) ? eq8(tokAt(toks, pos + 1).tok, TRparen) ? Ok6({ left: sectionLeft(left, lt), p: pos + 1, matched: true }) : _Result_flatMap4(([right, p]) => ((opSpan) => ((inner) => ((result) => Ok6({ left: result, p, matched: true }))(eq8(lt.tok, TNeq) ? ECall(ERef("not", opSpan), [inner], None8, spanning(exprSpan(left), exprSpan(right))) : inner))(mkBinCall(cmpFnName(lt.tok), opSpan, left, right)))(spanOf(lt)), parseExprBp(toks, CMP_BP + 1, pos + 1, hooks)) : and6(or5(eq8(lt.tok, TAndand), eq8(lt.tok, TOror)), (eq8(lt.tok, TAndand) ? AND_BP : OR_BP) >= minBp) ? ((bp) => ((fnName) => binCallOrLeftSection(toks, left, lt, pos, bp, fnName, hooks))(eq8(lt.tok, TAndand) ? "and" : "or"))(eq8(lt.tok, TAndand) ? AND_BP : OR_BP) : and6(eq8(lt.tok, TConcat), CONCAT_BP >= minBp) ? binCallOrLeftSection(toks, left, lt, pos, CONCAT_BP, "concat", hooks) : and6(eq8(lt.tok, TBacktick), BACKTICK_BP >= minBp) ? _Result_flatMap4(([fnExpr, p1]) => _Result_flatMap4((p2) => _Result_flatMap4(([right, p3]) => Ok6({ left: ECall(fnExpr, [left, right], None8, spanning(exprSpan(left), exprSpan(right))), p: p3, matched: true }), parseExprBp(toks, BACKTICK_BP + 1, p2, hooks)), expectTok(TBacktick, toks, p1)), parseAtomOrCall(toks, pos + 1, hooks)) : and6(or5(eq8(lt.tok, TPlus), eq8(lt.tok, TMinus)), ADD_BP >= minBp) ? ((fnName) => binCallOrLeftSection(toks, left, lt, pos, ADD_BP, fnName, hooks))(eq8(lt.tok, TPlus) ? "add" : "sub") : and6(or5(eq8(lt.tok, TStar), or5(eq8(lt.tok, TSlash), eq8(lt.tok, TPercent))), MUL_BP >= minBp) ? ((fnName) => binCallOrLeftSection(toks, left, lt, pos, MUL_BP, fnName, hooks))(eq8(lt.tok, TStar) ? "mul" : eq8(lt.tok, TSlash) ? "div" : "mod") : Ok6({ left, p: pos, matched: false });
});
var infixLoop = _curry9(5, (toks, minBp, left, pos, hooks) => _Result_flatMap4((res) => res.matched ? infixLoop(toks, minBp, res.left, res.p, hooks) : Ok6(_tuple5(res.left, res.p)), parseInfix(toks, minBp, left, pos, hooks)));
var ternaryTail = _curry9(4, (toks, cond, pos, hooks) => eq8(tokAt(toks, pos).tok, TQuestion) ? _Result_flatMap4(([thenE, p1]) => _Result_flatMap4((p2) => _Result_flatMap4(([elseE, p3]) => Ok6(_tuple5(ETernary(cond, thenE, elseE, spanning(exprSpan(cond), exprSpan(elseE))), p3)), parseExpr(toks, p2, hooks)), expectTok(TColon, toks, p1)), parseExpr(toks, pos + 1, hooks)) : Ok6(_tuple5(cond, pos)));
var parseExprBp = _curry9(4, (toks, minBp, pos, hooks) => match8(tokAt(toks, pos).tok).with({ _tag: "TLet" }, () => parseLetIn(toks, pos, hooks)).otherwise(() => and6(eq8(minBp, 0), looksLikeLambda(toks, pos)) ? parseLambda(toks, pos, hooks) : _Result_flatMap4(([left, p]) => _Result_flatMap4(([left2, p2]) => eq8(minBp, 0) ? ternaryTail(toks, left2, p2, hooks) : Ok6(_tuple5(left2, p2)), infixLoop(toks, minBp, left, p, hooks)), parseAtomOrCall(toks, pos, hooks))));
var parseExpr = _curry9(3, (toks, pos, hooks) => parseExprBp(toks, 0, pos, hooks));
var CPPos = (value) => ({ _tag: "CPPos", value });
var CPLab = _curry9(3, (name, value, labelSpan) => ({ _tag: "CPLab", name, value, labelSpan }));
var parseCallPart = _curry9(3, (toks, pos, hooks) => eq8(tokAt(toks, pos).tok, TTilde) ? _Result_flatMap4(([nm, p]) => eq8(tokAt(toks, p).tok, TEq) ? _Result_map4(([v, k]) => _tuple5(CPLab(nm.name, v, nm.span), k), parseExpr(toks, p + 1, hooks)) : Ok6(_tuple5(CPLab(nm.name, ERef(nm.name, nm.span), nm.span), p)), expectLabel(toks, pos + 1)) : _Result_map4(([v, k]) => _tuple5(CPPos(v), k), parseExpr(toks, pos, hooks)));
var callPartSpan = (p) => match8(p).with({ _tag: "CPPos" }, ({ value }) => exprSpan(value)).with({ _tag: "CPLab" }, ({ value, labelSpan }) => spanning(labelSpan, exprSpan(value))).exhaustive();
var splitCallParts = _curry9(3, (parts, positional, labeled) => match8(parts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => Ok6(_tuple5(positional, labeled))).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => match8(p).with({ _tag: "CPLab" }, () => splitCallParts(rest, positional, _Array_append6(p, labeled))).with({ _tag: "CPPos" }, ({ value }) => match8(labeled).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => splitCallParts(rest, _Array_append6(value, positional), labeled)).otherwise(() => errAt("labeled arguments must be a trailing group", callPartSpan(p)))).exhaustive()).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var labeledField = (p) => match8(p).with({ _tag: "CPLab" }, ({ name, value }) => ({ name, value })).with({ _tag: "CPPos" }, ({ value }) => ({ name: "", value })).exhaustive();
var unionSpans = _curry9(2, (parts, acc) => match8(parts).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([p, ...rest]) => unionSpans(rest, spanning(acc, callPartSpan(p)))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var callArgsOf = (parts) => _Result_map4(([positional, labeled]) => match8(labeled).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple5(positional, None8)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([first, ...rest]) => _tuple5(_Array_append6(ERecord(map3(labeledField, labeled), None8, unionSpans(rest, callPartSpan(first))), positional), Some8("labeled"))).otherwise(() => {
  throw new Error("non-exhaustive match");
}), splitCallParts(parts, [], []));
var postfixLoop = _curry9(4, (toks, e, pos, hooks) => match8(tokAt(toks, pos).tok).with({ _tag: "TLparen" }, () => _Result_flatMap4(([parts, p]) => _Result_flatMap4((p2) => _Result_flatMap4(([args, origin]) => postfixLoop(toks, ECall(e, args, origin, toEnd(exprSpan(e), toks, p2)), p2, hooks), callArgsOf(parts)), expectTok(TRparen, toks, p)), listUntilH(TRparen, parseCallPart, toks, pos + 1, hooks))).with({ _tag: "TDot" }, () => _Result_flatMap4(([id, p]) => postfixLoop(toks, EField(e, id.name, false, spanning(exprSpan(e), id.span)), p, hooks), expectLabel(toks, pos + 1))).otherwise(() => Ok6(_tuple5(e, pos))));
var parseAtomOrCall = _curry9(3, (toks, pos, hooks) => {
  const lt = tokAt(toks, pos);
  return or5(eq8(lt.tok, TMinus), eq8(lt.tok, TBang)) ? _Result_flatMap4(([operand, p]) => ((fnName) => Ok6(_tuple5(ECall(ERef(fnName, spanOf(lt)), [operand], None8, spanning(spanOf(lt), exprSpan(operand))), p)))(eq8(lt.tok, TMinus) ? "negate" : "not"), parseAtomOrCall(toks, pos + 1, hooks)) : _Result_flatMap4(([e, p]) => postfixLoop(toks, e, p, hooks), parseAtom(toks, pos, hooks));
});
var parseAtom = _curry9(3, (toks, pos, hooks) => {
  const lt = tokAt(toks, pos);
  const sp = spanOf(lt);
  return match8(lt.tok).with({ _tag: "TSwitch" }, () => parseMatch(toks, pos, hooks)).with({ _tag: "TDo" }, () => parseDo(toks, pos, hooks)).with({ _tag: "TLoop" }, () => parseLoop(toks, pos, hooks)).with({ _tag: "TRecur" }, () => parseRecur(toks, pos, hooks)).with({ _tag: "TLbrace" }, () => parseRecord(toks, pos, hooks)).with({ _tag: "TLbracket" }, () => parseArr(toks, pos, hooks)).with({ _tag: "TAt" }, () => parseList(toks, pos, hooks)).with({ _tag: "THash" }, () => parseHash(toks, pos, hooks)).with({ _tag: "TTmplStart" }, () => parseInterp(toks, pos, hooks)).otherwise(() => _Result_flatMap4((claimed) => match8(claimed).with((_v) => {
    const _g = _v;
    return _g._tag === "Some";
  }, ({ value: [e, p] }) => Ok6(_tuple5(e, p))).with({ _tag: "None" }, () => match8(lt.tok).with({ _tag: "TNum" }, ({ value, raw }) => Ok6(_tuple5(ENum(value, raw, sp), pos + 1))).with({ _tag: "TBool" }, ({ value }) => Ok6(_tuple5(EBool(value, sp), pos + 1))).with({ _tag: "TStr" }, ({ value }) => Ok6(_tuple5(EStr(value, sp), pos + 1))).with({ _tag: "TId" }, ({ value: name }) => Ok6(_tuple5(ERef(name, sp), pos + 1))).with({ _tag: "TLparen" }, () => ((nxt) => eq8(nxt.tok, TRparen) ? Ok6(_tuple5(EUnit(toEnd(sp, toks, pos + 2)), pos + 2)) : and6(isSectionOp(nxt.tok), not5(eq8(nxt.tok, TMinus))) ? parseRightSection(toks, sp, pos + 1, hooks) : _Result_flatMap4(([first, p]) => eq8(tokAt(toks, p).tok, TComma) ? _Result_flatMap4(([elements, p2]) => _Result_flatMap4((p3) => Ok6(_tuple5(ETuple(elements, toEnd(sp, toks, p3)), p3)), expectTok(TRparen, toks, p2)), sepByH(parseExpr, toks, p + 1, [first], hooks)) : _Result_map4((p2) => _tuple5(first, p2), expectTok(TRparen, toks, p)), parseExpr(toks, pos + 1, hooks)))(tokAt(toks, pos + 1))).otherwise((t) => errAt(`unexpected token ${tokName(t)}`, lt))).exhaustive(), runParseHooks(hooks, toks, pos, _curry9(2, (t, p) => parseExpr(t, p, hooks)))));
});
var parseInterpLoop = _curry9(5, (toks, pos, start, acc, hooks) => _Result_flatMap4(([holeExpr, p]) => ((acc2) => ((lt) => match8(lt.tok).with({ _tag: "TTmplMid" }, ({ value }) => parseInterpLoop(toks, p + 1, start, _Array_append6(IPLit(value), acc2), hooks)).with({ _tag: "TTmplEnd" }, ({ value }) => Ok6(_tuple5(EInterp(_Array_append6(IPLit(value), acc2), toEnd(start, toks, p + 1)), p + 1))).otherwise((t) => errAt(`expected \${...} to close, got ${tokName(t)}`, lt)))(tokAt(toks, p)))(_Array_append6(IPExpr(holeExpr), acc)), parseExpr(toks, pos, hooks)));
var parseInterp = _curry9(3, (toks, pos, hooks) => {
  const lt = tokAt(toks, pos);
  return match8(lt.tok).with({ _tag: "TTmplStart" }, ({ value }) => parseInterpLoop(toks, pos + 1, spanOf(lt), [IPLit(value)], hooks)).otherwise((t) => errAt(`expected tmplstart, got ${tokName(t)}`, lt));
});
var parseField = _curry9(3, (toks, pos, hooks) => {
  const lt = tokAt(toks, pos);
  return _Result_flatMap4(([nm, p]) => eq8(tokAt(toks, p).tok, TColon) ? _Result_flatMap4(([value, p2]) => Ok6(_tuple5({ name: nm.name, value }, p2)), parseExpr(toks, p + 1, hooks)) : not5(eq8(keywordText(lt.tok), None8)) ? errAt(`'${nm.name}' is a keyword \u2014 write '${nm.name}: <expr>'`, lt) : Ok6(_tuple5({ name: nm.name, value: ERef(nm.name, nm.span) }, p)), expectLabel(toks, pos));
});
var parseRecord = _curry9(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => eq8(tokAt(toks, p).tok, TSpread) ? _Result_flatMap4(([spreadExpr, p1]) => _Result_flatMap4((p2) => _Result_flatMap4(([fields, p3]) => _Result_flatMap4((p4) => Ok6(_tuple5(ERecord(fields, Some8(spreadExpr), toEnd(start, toks, p4)), p4)), expectTok(TRbrace, toks, p3)), listUntilH(TRbrace, parseField, toks, p2, hooks)), eq8(tokAt(toks, p1).tok, TRbrace) ? Ok6(p1) : expectTok(TComma, toks, p1)), parseExpr(toks, p + 1, hooks)) : _Result_flatMap4(([fields, p1]) => _Result_flatMap4((p2) => Ok6(_tuple5(ERecord(fields, None8, toEnd(start, toks, p2)), p2)), expectTok(TRbrace, toks, p1)), listUntilH(TRbrace, parseField, toks, p, hooks)), expectTok(TLbrace, toks, pos));
});
var parseSeqElem = _curry9(3, (toks, pos, hooks) => eq8(tokAt(toks, pos).tok, TSpread) ? _Result_flatMap4(([ex, p]) => Ok6(_tuple5(SESpread(ex), p)), parseExpr(toks, pos + 1, hooks)) : _Result_flatMap4(([ex, p]) => Ok6(_tuple5(SEExpr(ex), p)), parseExpr(toks, pos, hooks)));
var parseArr = _curry9(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4(([elements, p2]) => _Result_flatMap4((p3) => Ok6(_tuple5(EArr(elements, toEnd(start, toks, p3)), p3)), expectTok(TRbracket, toks, p2)), listUntilH(TRbracket, parseSeqElem, toks, p, hooks)), expectTok(TLbracket, toks, pos));
});
var parseList = _curry9(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4((p1) => _Result_flatMap4(([elements, p2]) => _Result_flatMap4((p3) => Ok6(_tuple5(EList(elements, toEnd(start, toks, p3)), p3)), expectTok(TRbrace, toks, p2)), listUntilH(TRbrace, parseSeqElem, toks, p1, hooks)), expectTok(TLbrace, toks, p)), expectTok(TAt, toks, pos));
});
var parseMapEntry = _curry9(3, (toks, pos, hooks) => _Result_flatMap4(([key, p]) => _Result_flatMap4((p2) => _Result_flatMap4(([value, p3]) => Ok6(_tuple5({ key, value }, p3)), parseExpr(toks, p2, hooks)), expectTok(TColon, toks, p)), parseExpr(toks, pos, hooks)));
var parseHash = _curry9(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4((p1) => eq8(tokAt(toks, p1).tok, TRbrace) ? _Result_flatMap4((p2) => Ok6(_tuple5(EMap([], toEnd(start, toks, p2)), p2)), expectTok(TRbrace, toks, p1)) : eq8(tokAt(toks, p1).tok, TSpread) ? _Result_flatMap4(([elements, p2]) => _Result_flatMap4((p3) => Ok6(_tuple5(ESet(elements, toEnd(start, toks, p3)), p3)), expectTok(TRbrace, toks, p2)), listUntilH(TRbrace, parseSeqElem, toks, p1, hooks)) : _Result_flatMap4(([first, p2]) => eq8(tokAt(toks, p2).tok, TColon) ? _Result_flatMap4((p3) => _Result_flatMap4(([value, p4]) => _Result_flatMap4(([rest, p5]) => _Result_flatMap4((p6) => Ok6(_tuple5(EMap(_Array_prepend2({ key: first, value }, rest), toEnd(start, toks, p6)), p6)), expectTok(TRbrace, toks, p5)), eq8(tokAt(toks, p4).tok, TComma) ? listUntilH(TRbrace, parseMapEntry, toks, p4 + 1, hooks) : Ok6(_tuple5([], p4))), parseExpr(toks, p3, hooks)), expectTok(TColon, toks, p2)) : _Result_flatMap4(([rest, p3]) => _Result_flatMap4((p4) => Ok6(_tuple5(ESet(_Array_prepend2(SEExpr(first), rest), toEnd(start, toks, p4)), p4)), expectTok(TRbrace, toks, p3)), eq8(tokAt(toks, p2).tok, TComma) ? listUntilH(TRbrace, parseSeqElem, toks, p2 + 1, hooks) : Ok6(_tuple5([], p2))), parseExpr(toks, p1, hooks)), expectTok(TLbrace, toks, p)), expectTok(THash, toks, pos));
});
var parseGuard = _curry9(3, (toks, pos, hooks) => match8(tokAt(toks, pos).tok).with({ _tag: "TId", value: "when" }, () => _Result_map4(([g, p]) => _tuple5(Some8(g), p), parseExpr(toks, pos + 1, hooks))).otherwise(() => Ok6(_tuple5(None8, pos))));
var patSpan = (p) => match8(p).with({ _tag: "PWild" }, ({ span: sp }) => sp).with({ _tag: "PUnit" }, ({ span: sp }) => sp).with({ _tag: "PBind" }, ({ span: sp }) => sp).with({ _tag: "PAs" }, ({ span: sp }) => sp).with({ _tag: "PLit" }, ({ span: sp }) => sp).with({ _tag: "PBool" }, ({ span: sp }) => sp).with({ _tag: "PStr" }, ({ span: sp }) => sp).with({ _tag: "PTuple" }, ({ span: sp }) => sp).with({ _tag: "PRecord" }, ({ span: sp }) => sp).with({ _tag: "PCtor" }, ({ span: sp }) => sp).with({ _tag: "PArr" }, ({ span: sp }) => sp).with({ _tag: "PList" }, ({ span: sp }) => sp).with({ _tag: "POr" }, ({ span: sp }) => sp).exhaustive();
var altsLoop = _curry9(4, (toks, pos, acc, lastSpan) => eq8(tokAt(toks, pos).tok, TBar) ? _Result_flatMap4(([alt, p1]) => altsLoop(toks, p1, _Array_append6(alt, acc), patSpan(alt)), parsePattern(toks, pos + 1)) : Ok6(_tuple5(acc, pos, lastSpan)));
var armsLoop = _curry9(4, (toks, pos, acc, hooks) => eq8(tokAt(toks, pos).tok, TBar) ? _Result_flatMap4(([first, p1]) => _Result_flatMap4(([alts, p2, lastSpan]) => ((pattern) => _Result_flatMap4(([guard, p3]) => _Result_flatMap4((p4) => _Result_flatMap4(([body, p5]) => armsLoop(toks, p5, _Array_append6({ pattern, guard, body }, acc), hooks), parseExpr(toks, p4, hooks)), expectTok(TArrow, toks, p3)), parseGuard(toks, p2, hooks)))(eq8(length6(alts), 1) ? first : POr(alts, spanning(patSpan(first), lastSpan))), altsLoop(toks, p1, [first], patSpan(first))), parsePattern(toks, pos + 1)) : Ok6(_tuple5(acc, pos)));
var parseDo = _curry9(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => parseDoBlockFrom(toks, start, p, hooks), expectTok(TDo, toks, pos));
});
var parseDoBlock = _curry9(3, (toks, pos, hooks) => parseDoBlockFrom(toks, spanOf(tokAt(toks, pos)), pos, hooks));
var parseDoBlockFrom = _curry9(4, (toks, start, pos, hooks) => _Result_flatMap4((p1) => eq8(tokAt(toks, p1).tok, TRbrace) ? errAt("do block needs a final expression", tokAt(toks, p1)) : _Result_flatMap4(([exprs, p2]) => eq8(tokAt(toks, p2).tok, TSemi) ? errAt("do block cannot end with a semicolon", tokAt(toks, p2)) : _Result_flatMap4((p3) => Ok6(_tuple5(EDo(exprs, toEnd(start, toks, p3)), p3)), expectTok(TRbrace, toks, p2)), parseDoExprs(toks, p1, [], hooks)), expectTok(TLbrace, toks, pos)));
var parseDoExprs = _curry9(4, (toks, pos, acc, hooks) => _Result_flatMap4(([expr, p]) => ((next) => eq8(tokAt(toks, p).tok, TSemi) ? parseDoExprs(toks, p + 1, next, hooks) : Ok6(_tuple5(next, p)))(_Array_append6(expr, acc)), parseExpr(toks, pos, hooks)));
var parseLoop = _curry9(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4((p1) => _Result_flatMap4(([params, p2]) => _Result_flatMap4((p3) => _Result_flatMap4((p4) => _Result_flatMap4(([body, p5]) => _Result_map4((p6) => _tuple5(ELoop(params, body, toEnd(start, toks, p6)), p6), expectTok(TRbrace, toks, p5)), parseExpr(toks, p4, hooks)), expectTok(TLbrace, toks, p3)), expectTok(TRparen, toks, p2)), loopParamsLoop(toks, p1, [], hooks)), expectTok(TLparen, toks, p)), expectTok(TLoop, toks, pos));
});
var loopParamsLoop = _curry9(4, (toks, pos, acc, hooks) => _Result_flatMap4(([id, pid]) => _Result_flatMap4((p) => _Result_flatMap4(([init, p1]) => ((next) => match8(tokAt(toks, p1).tok).with({ _tag: "TComma" }, () => loopParamsLoop(toks, p1 + 1, next, hooks)).otherwise(() => Ok6(_tuple5(next, p1))))(_Array_append6({ name: id.name, nameSpan: id.span, init }, acc)), parseExpr(toks, p, hooks)), expectTok(TEq, toks, pid)), expectId(toks, pos)));
var parseRecur = _curry9(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4((p1) => match8(tokAt(toks, p1).tok).with({ _tag: "TRparen" }, () => Ok6(_tuple5(ERecur([], toEnd(start, toks, p1 + 1)), p1 + 1))).otherwise(() => _Result_flatMap4(([args, p2]) => _Result_map4((p3) => _tuple5(ERecur(args, toEnd(start, toks, p3)), p3), expectTok(TRparen, toks, p2)), sepByH(parseExpr, toks, p1, [], hooks))), expectTok(TLparen, toks, p)), expectTok(TRecur, toks, pos));
});
var parseMatch = _curry9(3, (toks, pos, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4(([scrutinee, p1]) => _Result_flatMap4((p2) => _Result_flatMap4(([arms, p3]) => match8(length6(arms)).with(0, () => errAt("switch needs at least one | arm", tokAt(toks, p3))).otherwise(() => _Result_map4((p4) => _tuple5(EMatch(scrutinee, arms, toEnd(start, toks, p4)), p4), expectTok(TRbrace, toks, p3))), armsLoop(toks, p2, [], hooks)), expectTok(TLbrace, toks, p1)), parseExpr(toks, p, hooks)), expectTok(TSwitch, toks, pos));
});
var parseCtorArgs = _curry9(5, (toks, ctor, ns, nameSpan, pos) => eq8(tokAt(toks, pos).tok, TLparen) ? _Result_flatMap4(([args, p]) => _Result_flatMap4((p2) => Ok6(_tuple5(PCtor(ctor, args, ns, toEnd(nameSpan, toks, p2)), p2)), expectTok(TRparen, toks, p)), listUntil(TRparen, parsePattern, toks, pos + 1)) : Ok6(_tuple5(PCtor(ctor, [], ns, toEnd(nameSpan, toks, pos)), pos)));
var parsePatternAtom = _curry9(2, (toks, pos) => {
  const lt = tokAt(toks, pos);
  const sp = spanOf(lt);
  return match8(lt.tok).with({ _tag: "TNum" }, ({ value, raw }) => Ok6(_tuple5(PLit2(value, raw, sp), pos + 1))).with({ _tag: "TBool" }, ({ value }) => Ok6(_tuple5(PBool(value, sp), pos + 1))).with({ _tag: "TStr" }, ({ value }) => Ok6(_tuple5(PStr(value, sp), pos + 1))).with({ _tag: "TLparen" }, () => eq8(tokAt(toks, pos + 1).tok, TRparen) ? Ok6(_tuple5(PUnit(toEnd(sp, toks, pos + 2)), pos + 2)) : _Result_flatMap4(([elems, p]) => _Result_flatMap4((p2) => Ok6(match8(elems).with((_v) => {
    const _g = _v;
    return _g.length === 1;
  }, ([single]) => _tuple5(single, p2)).otherwise((many) => _tuple5(PTuple(many, toEnd(sp, toks, p2)), p2))), expectTok(TRparen, toks, p)), sepBy(parsePattern, toks, pos + 1, []))).with({ _tag: "TLbrace" }, () => _Result_flatMap4(([fields, p]) => _Result_flatMap4((p2) => Ok6(_tuple5(PRecord(fields, toEnd(sp, toks, p2)), p2)), expectTok(TRbrace, toks, p)), listUntil(TRbrace, parsePatField, toks, pos + 1))).with({ _tag: "TLbracket" }, () => parseArrPattern(toks, pos)).with({ _tag: "TAt" }, () => parseListPattern(toks, pos)).with({ _tag: "TId", value: "_" }, () => Ok6(_tuple5(PWild(sp), pos + 1))).with({ _tag: "TId" }, ({ value: name }) => eq8(tokAt(toks, pos + 1).tok, TDot) ? _Result_flatMap4(([c, p1]) => isUpper(c.name) ? parseCtorArgs(toks, c.name, Some8(name), sp, p1) : errAt(`expected constructor after '${name}.', got '${c.name}'`, tokAt(toks, p1)), expectId(toks, pos + 2)) : isUpper(name) ? parseCtorArgs(toks, name, None8, sp, pos + 1) : Ok6(_tuple5(PBind(name, sp), pos + 1))).otherwise((t) => errAt(`unexpected token in pattern: ${tokName(t)}`, lt));
});
var parsePattern = _curry9(2, (toks, pos) => _Result_flatMap4(([pat, p]) => match8(tokAt(toks, p).tok).with({ _tag: "TId", value: "as" }, () => _Result_flatMap4(([nm, p2]) => Ok6(_tuple5(PAs(pat, nm.name, nm.span, spanning(patSpan(pat), nm.span)), p2)), expectId(toks, p + 1))).otherwise(() => Ok6(_tuple5(pat, p))), parsePatternAtom(toks, pos)));
var restOk = (rest) => match8(rest).with({ _tag: "None" }, () => true).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PBind";
}, () => true).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "PWild";
}, () => true).with({ _tag: "Some" }, () => false).exhaustive();
var patElemsLoop = _curry9(3, (toks, pos, acc) => match8(tokAt(toks, pos).tok).with({ _tag: "TSpread" }, () => _Result_flatMap4(([rest, p]) => Ok6(_tuple5(acc, Some8(rest), p)), parsePattern(toks, pos + 1))).otherwise(() => _Result_flatMap4(([pat, p]) => ((elems) => eq8(tokAt(toks, p).tok, TComma) ? patElemsLoop(toks, p + 1, elems) : Ok6(_tuple5(elems, None8, p)))(_Array_append6(pat, acc)), parsePattern(toks, pos))));
var parseArrPattern = _curry9(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => eq8(tokAt(toks, p).tok, TRbracket) ? Ok6(_tuple5(PArr([], None8, toEnd(start, toks, p + 1)), p + 1)) : _Result_flatMap4(([elems, rest, p2]) => restOk(rest) ? _Result_map4((p3) => _tuple5(PArr(elems, rest, toEnd(start, toks, p3)), p3), expectTok(TRbracket, toks, p2)) : errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2)), patElemsLoop(toks, p, [])), expectTok(TLbracket, toks, pos));
});
var parseListPattern = _curry9(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4((p1) => eq8(tokAt(toks, p1).tok, TRbrace) ? Ok6(_tuple5(PList([], None8, toEnd(start, toks, p1 + 1)), p1 + 1)) : _Result_flatMap4(([elems, rest, p2]) => restOk(rest) ? _Result_map4((p3) => _tuple5(PList(elems, rest, toEnd(start, toks, p3)), p3), expectTok(TRbrace, toks, p2)) : errAt("list `...` rest must bind a name or `_`", tokAt(toks, p2)), patElemsLoop(toks, p1, [])), expectTok(TLbrace, toks, p)), expectTok(TAt, toks, pos));
});
var parsePatField = _curry9(2, (toks, pos) => {
  const lt = tokAt(toks, pos);
  return _Result_flatMap4(([nm, p]) => eq8(tokAt(toks, p).tok, TColon) ? _Result_flatMap4(([pat, p2]) => Ok6(_tuple5({ label: nm.name, pat }, p2)), parsePattern(toks, p + 1)) : not5(eq8(keywordText(lt.tok), None8)) ? errAt(`'${nm.name}' is a keyword \u2014 write '${nm.name}: <pattern>'`, lt) : Ok6(_tuple5({ label: nm.name, pat: PBind(nm.name, nm.span) }, p)), expectLabel(toks, pos));
});
var parseTypeAtom = _curry9(2, (toks, pos) => {
  const lt = tokAt(toks, pos);
  const sp = spanOf(lt);
  return match8(lt.tok).with({ _tag: "TLparen" }, () => eq8(tokAt(toks, pos + 1).tok, TRparen) ? Ok6(_tuple5(TyName("unit", toEnd(sp, toks, pos + 2)), pos + 2)) : _Result_flatMap4(([inner, p]) => eq8(tokAt(toks, p).tok, TComma) ? _Result_flatMap4(([elems, p2]) => _Result_flatMap4((p3) => Ok6(_tuple5(TyTuple(elems, toEnd(sp, toks, p3)), p3)), expectTok(TRparen, toks, p2)), sepBy(parseTypeExpr, toks, p + 1, [inner])) : _Result_map4((p2) => _tuple5(inner, p2), expectTok(TRparen, toks, p)), parseTypeExpr(toks, pos + 1))).with({ _tag: "TLbracket" }, () => _Result_flatMap4(([elem, p]) => _Result_flatMap4((p2) => Ok6(_tuple5(TyList(elem, toEnd(sp, toks, p2)), p2)), expectTok(TRbracket, toks, p)), parseTypeExpr(toks, pos + 1))).with({ _tag: "TStr" }, ({ value }) => Ok6(_tuple5(TyLit(value, sp), pos + 1))).otherwise(() => _Result_flatMap4(([nm, p]) => and6(isUpper(nm.name), eq8(tokAt(toks, p).tok, TDot)) ? _Result_flatMap4(([q, p2]) => isUpper(q.name) ? Ok6(_tuple5(TyQual(nm.name, q.name, q.span, [], spanning(nm.span, q.span)), p2)) : errAt(`a type variable cannot be qualified; expected a constructor after '${nm.name}.', got '${q.name}'`, tokAt(toks, p2)), expectId(toks, p + 1)) : Ok6(_tuple5(TyName(nm.name, nm.span), p)), expectId(toks, pos)));
});
var startsTypeAtom = (t) => match8(t).with({ _tag: "TId" }, () => true).with({ _tag: "TLparen" }, () => true).with({ _tag: "TLbracket" }, () => true).with({ _tag: "TStr" }, () => true).otherwise(() => false);
var legacyTypeArgsLoop = _curry9(4, (toks, pos, acc, lastSp) => startsTypeAtom(tokAt(toks, pos).tok) ? _Result_flatMap4(([a, p]) => legacyTypeArgsLoop(toks, p, _Array_append6(a, acc), Some8(tySpan(a))), parseTypeAtom(toks, pos)) : Ok6(_tuple5(acc, lastSp, pos)));
var parseTypeApp = _curry9(2, (toks, pos) => _Result_flatMap4(([head, p]) => match8(head).with((_v) => {
  const _g = _v;
  return _g._tag === "TyName" && (({ name, span: sp }) => isUpper(name))(_g);
}, ({ name, span: sp }) => eq8(tokAt(toks, p).tok, TLt) ? _Result_flatMap4(([args, p1]) => _Result_flatMap4((p2) => Ok6(_tuple5(TyApp(name, args, toEnd(sp, toks, p2)), p2)), expectTok(TGt, toks, p1)), listUntil(TGt, parseTypeExpr, toks, p + 1)) : _Result_flatMap4(([args, lastSp, p2]) => Ok6(match8(lastSp).with({ _tag: "None" }, () => _tuple5(head, p2)).with({ _tag: "Some" }, ({ value: ls }) => _tuple5(TyApp(name, args, spanning(sp, ls)), p2)).exhaustive()), legacyTypeArgsLoop(toks, p, [], None8))).with({ _tag: "TyQual" }, ({ alias, name: nm, nameSpan, span: sp }) => eq8(tokAt(toks, p).tok, TLt) ? _Result_flatMap4(([args, p1]) => _Result_flatMap4((p2) => Ok6(_tuple5(TyQual(alias, nm, nameSpan, args, toEnd(sp, toks, p2)), p2)), expectTok(TGt, toks, p1)), listUntil(TGt, parseTypeExpr, toks, p + 1)) : _Result_flatMap4(([args, lastSp, p2]) => Ok6(match8(lastSp).with({ _tag: "None" }, () => _tuple5(head, p2)).with({ _tag: "Some" }, ({ value: ls }) => _tuple5(TyQual(alias, nm, nameSpan, args, spanning(sp, ls)), p2)).exhaustive()), legacyTypeArgsLoop(toks, p, [], None8))).otherwise(() => Ok6(_tuple5(head, p))), parseTypeAtom(toks, pos)));
var parseTypeUnionRest = _curry9(4, (toks, pos, acc, lastSp) => eq8(tokAt(toks, pos).tok, TBar) ? _Result_flatMap4(([m, p]) => parseTypeUnionRest(toks, p, _Array_append6(m, acc), tySpan(m)), parseTypeApp(toks, pos + 1)) : Ok6(_tuple5(acc, lastSp, pos)));
var parseTypeUnion = _curry9(2, (toks, pos) => _Result_flatMap4(([first, p]) => eq8(tokAt(toks, p).tok, TBar) ? _Result_flatMap4(([members, lastSp, p2]) => Ok6(_tuple5(TyUnion(members, spanning(tySpan(first), lastSp)), p2)), parseTypeUnionRest(toks, p, [first], tySpan(first))) : Ok6(_tuple5(first, p)), parseTypeApp(toks, pos)));
var parseTypeExpr = _curry9(2, (toks, pos) => _Result_flatMap4(([from, p]) => eq8(tokAt(toks, p).tok, TTarrow) ? _Result_flatMap4(([to, p2]) => Ok6(_tuple5(TyArrow(from, to, spanning(tySpan(from), tySpan(to))), p2)), parseTypeExpr(toks, p + 1)) : Ok6(_tuple5(from, p)), parseTypeUnion(toks, pos)));
var parseCtorField = _curry9(2, (toks, pos) => {
  const isLabel = match8(tokAt(toks, pos).tok).with({ _tag: "TId" }, () => eq8(tokAt(toks, pos + 1).tok, TColon)).otherwise(() => false);
  return isLabel ? _Result_flatMap4(([nm, p]) => _Result_flatMap4(([t, p2]) => Ok6(_tuple5({ name: Some8(nm.name), fieldType: t }, p2)), parseTypeExpr(toks, p + 1)), expectId(toks, pos)) : _Result_map4(([t, p]) => _tuple5({ name: None8, fieldType: t }, p), parseTypeExpr(toks, pos));
});
var parseCtor = _curry9(2, (toks, pos) => _Result_flatMap4(([nm, p]) => eq8(tokAt(toks, p).tok, TLparen) ? _Result_flatMap4(([fields, p2]) => _Result_flatMap4((p3) => Ok6(_tuple5({ name: nm.name, fields, span: toEnd(nm.span, toks, p3) }, p3)), expectTok(TRparen, toks, p2)), listUntil(TRparen, parseCtorField, toks, p + 1)) : Ok6(_tuple5({ name: nm.name, fields: [], span: nm.span }, p)), expectId(toks, pos)));
var ctorsLoop = _curry9(3, (toks, pos, acc) => _Result_flatMap4(([c, p]) => ((cs) => eq8(tokAt(toks, p).tok, TBar) ? ctorsLoop(toks, p + 1, cs) : Ok6(_tuple5(cs, p)))(_Array_append6(c, acc)), parseCtor(toks, pos)));
var parseAliasField = _curry9(2, (toks, pos) => _Result_flatMap4(([nm, p]) => ((optional) => ((p1) => _Result_flatMap4((p2) => _Result_flatMap4(([t, p3]) => Ok6(_tuple5({ name: nm.name, fieldType: t, optional }, p3)), parseTypeExpr(toks, p2)), expectTok(TColon, toks, p1)))(optional ? p + 1 : p))(eq8(tokAt(toks, p).tok, TQuestion)), expectLabel(toks, pos)));
var parseAliasBody = _curry9(2, (toks, pos) => _Result_flatMap4((p) => _Result_flatMap4(([fields, p2]) => _Result_flatMap4((p3) => Ok6(_tuple5(fields, p3)), expectTok(TRbrace, toks, p2)), listUntil(TRbrace, parseAliasField, toks, p)), expectTok(TLbrace, toks, pos)));
var typeParamsLoop = _curry9(3, (toks, pos, acc) => match8(tokAt(toks, pos).tok).with({ _tag: "TId" }, ({ value: name }) => typeParamsLoop(toks, pos + 1, _Array_append6(name, acc))).otherwise(() => Ok6(_tuple5(acc, pos))));
var parseTypeParams = _curry9(2, (toks, pos) => eq8(tokAt(toks, pos).tok, TLt) ? _Result_flatMap4(([names, p]) => _Result_map4((p2) => _tuple5(map3((n) => n.name, names), p2), expectTok(TGt, toks, p)), listUntil(TGt, expectId, toks, pos + 1)) : typeParamsLoop(toks, pos, []));
var startsTypeSynonym = (t) => match8(t).with({ _tag: "TStr" }, () => true).with({ _tag: "TLparen" }, () => true).with({ _tag: "TLbracket" }, () => true).otherwise(() => false);
var parseType = _curry9(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4(([nm, p1]) => _Result_flatMap4(([params, p2]) => _Result_flatMap4((p3) => eq8(tokAt(toks, p3).tok, TLbrace) ? _Result_map4(([alias, p4]) => _tuple5(SType(nm.name, params, [], Some8(alias), None8, false, None8, toEnd(start, toks, p4)), p4), parseAliasBody(toks, p3)) : startsTypeSynonym(tokAt(toks, p3).tok) ? _Result_flatMap4(([te, p4]) => Ok6(_tuple5(SType(nm.name, params, [], None8, Some8(te), false, None8, toEnd(start, toks, p4)), p4)), parseTypeExpr(toks, p3)) : ((afterBar) => _Result_map4(([ctors, p4]) => _tuple5(SType(nm.name, params, ctors, None8, None8, false, None8, toEnd(start, toks, p4)), p4), ctorsLoop(toks, afterBar, [])))(eq8(tokAt(toks, p3).tok, TBar) ? p3 + 1 : p3), expectTok(TEq, toks, p2)), parseTypeParams(toks, p1)), expectId(toks, p)), expectTok(TType, toks, pos));
});
var parseExtern = _curry9(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => eq8(tokAt(toks, p).tok, TType) ? _Result_flatMap4((p1) => _Result_flatMap4(([nm, p2]) => Ok6(_tuple5(SType(nm.name, [], [], None8, None8, false, None8, toEnd(start, toks, p2)), p2)), expectId(toks, p1)), expectTok(TType, toks, p)) : _Result_flatMap4(([nm, p1]) => _Result_flatMap4(([params, p2]) => _Result_flatMap4((p3) => _Result_flatMap4(([t, p4]) => _Result_flatMap4((p5) => ((isCurried) => ((pConv) => ((nextTok) => or5(or5(or5(or5(eq8(nextTok, TId("global")), eq8(nextTok, TId("send"))), eq8(nextTok, TId("get"))), eq8(nextTok, TId("set"))), eq8(nextTok, TId("new"))) ? isCurried ? errAt("'curried' applies to a module extern, not a JS convention \u2014 give the host's module and export instead", tokAt(toks, pConv)) : _Result_flatMap4(([convention, p6]) => _Result_flatMap4(([first, p7]) => ((hasSecond) => _Result_flatMap4(([second, p8]) => Ok6(_tuple5(SExtern(nm.name, nm.span, params, t, `mochi:${convention.name}:${first}`, second, false, false, None8, toEnd(start, toks, p8)), p8)), hasSecond ? expectStr(toks, p7) : Ok6(_tuple5("", p7))))(match8(tokAt(toks, p7).tok).with({ _tag: "TStr" }, () => or5(eq8(convention.name, "global"), eq8(convention.name, "new"))).otherwise(() => false)), expectStr(toks, p6)), expectId(toks, pConv)) : _Result_flatMap4(([moduleName, p6]) => _Result_flatMap4(([importedName, p7]) => Ok6(_tuple5(SExtern(nm.name, nm.span, params, t, moduleName, importedName, isCurried, false, None8, toEnd(start, toks, p7)), p7)), expectStr(toks, p6)), expectStr(toks, pConv)))(tokAt(toks, pConv).tok))(isCurried ? p5 + 1 : p5))(eq8(tokAt(toks, p5).tok, TId("curried"))), expectTok(TEq, toks, p4)), parseTypeExpr(toks, p3)), expectTok(TColon, toks, p2)), eq8(tokAt(toks, p1).tok, TLt) ? _Result_flatMap4(([names, pParams]) => _Result_flatMap4((pAfter) => Ok6(_tuple5(map3((n) => n.name, names), pAfter)), expectTok(TGt, toks, pParams)), listUntil(TGt, expectId, toks, p1 + 1)) : Ok6(_tuple5([], p1))), expectId(toks, p)), expectTok(TExtern, toks, pos));
});
var parseImportNs = _curry9(3, (toks, start, pos) => _Result_flatMap4(([asKw, p1]) => eq8(asKw.name, "as") ? _Result_flatMap4(([alias, p2]) => _Result_flatMap4(([kw, p3]) => eq8(kw.name, "from") ? _Result_map4(([path, p4]) => _tuple5(SImportNs(alias, path, toEnd(start, toks, p4)), p4), expectStr(toks, p3)) : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt(toks, p3)), expectId(toks, p2)), expectId(toks, p1)) : errAt(`expected 'as' in namespace import, got '${asKw.name}'`, tokAt(toks, p1)), expectId(toks, pos)));
var parseImport = _curry9(2, (toks, pos) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => eq8(tokAt(toks, p).tok, TStar) ? _Result_flatMap4((p1) => parseImportNs(toks, start, p1), expectTok(TStar, toks, p)) : _Result_flatMap4((p1) => _Result_flatMap4(([names, p2]) => _Result_flatMap4((p3) => _Result_flatMap4(([kw, p4]) => eq8(kw.name, "from") ? _Result_map4(([path, p5]) => _tuple5(SImport(names, path, toEnd(start, toks, p5)), p5), expectStr(toks, p4)) : errAt(`expected 'from' in import, got '${kw.name}'`, tokAt(toks, p4)), expectId(toks, p3)), expectTok(TRbrace, toks, p2)), listUntil(TRbrace, expectId, toks, p1)), expectTok(TLbrace, toks, p)), expectTok(TImport, toks, pos));
});
var parseRecordDestructure = _curry9(5, (toks, start, pos, tmp, hooks) => {
  const openSp = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => _Result_flatMap4(([fields, p1]) => ((closeSp) => _Result_flatMap4((p2) => _Result_flatMap4((p3) => _Result_flatMap4(([value, p4]) => ((whole) => ((patSpan) => ((tmpName) => ((header) => ((access) => Ok6(_tuple5(_Array_prepend2(header, map3(access, fields)), p4, tmp + 1)))((f) => SLet(f.name, f.span, None8, EField(ERef(tmpName, f.span), f.name, false, f.span), false, None8, f.span)))(SLet(tmpName, patSpan, None8, value, false, None8, whole)))(`$d${show3(tmp)}`))(spanning(openSp, closeSp)))(toEnd(start, toks, p4)), parseExpr(toks, p3, hooks)), expectTok(TEq, toks, p2)), expectTok(TRbrace, toks, p1)))(spanOf(tokAt(toks, p1))), listUntil(TRbrace, expectId, toks, p)), expectTok(TLbrace, toks, pos));
});
var parseLet = _curry9(4, (toks, pos, tmp, hooks) => {
  const start = spanOf(tokAt(toks, pos));
  return _Result_flatMap4((p) => eq8(tokAt(toks, p).tok, TLbrace) ? parseRecordDestructure(toks, start, p, tmp, hooks) : _Result_flatMap4(([nm, p1]) => _Result_flatMap4(([annot, pA]) => _Result_flatMap4((p2) => _Result_flatMap4(([value, p3]) => Ok6(_tuple5([SLet(nm.name, nm.span, annot, value, false, None8, toEnd(start, toks, p3))], p3, tmp)), parseExpr(toks, p2, hooks)), expectTok(TEq, toks, pA)), eq8(tokAt(toks, p1).tok, TColon) ? _Result_map4(([ty, p]) => _tuple5(Some8(ty), p), parseTypeExpr(toks, p1 + 1)) : Ok6(_tuple5(None8, p1))), expectId(toks, p)), expectTok(TLet, toks, pos));
});
var setLetMeta = _curry9(3, (exported, doc, s) => match8(s).with({ _tag: "SLet" }, ({ name, nameSpan, annot, value, span }) => SLet(name, nameSpan, annot, value, exported, doc, span)).otherwise((other) => other));
var setTypeMeta = _curry9(3, (exported, doc, s) => match8(s).with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, span }) => SType(name, params, ctors, alias, aliasType, exported, doc, span)).otherwise((other) => other));
var setExternMeta = _curry9(3, (exported, doc, s) => match8(s).with({ _tag: "SExtern" }, ({ name, nameSpan, params, typeExpr: t, module: m, imported: i, curried, span }) => SExtern(name, nameSpan, params, t, m, i, curried, exported, doc, span)).with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, span }) => SType(name, params, ctors, alias, aliasType, exported, doc, span)).otherwise((other) => other));
var parseExprStmt = _curry9(4, (toks, pos, tmp, hooks) => {
  const start = tokAt(toks, pos);
  return _Result_flatMap4(([value, p]) => ((p2) => Ok6(_tuple5([SExpr(value, toEnd(spanOf(start), toks, p))], p2, tmp)))(eq8(tokAt(toks, p).tok, TSemi) ? p + 1 : p), parseExpr(toks, pos, hooks));
});
var parseStmt = _curry9(4, (toks, pos, tmp, hooks) => {
  const lt = tokAt(toks, pos);
  const doc = lt.doc;
  return match8(lt.tok).with({ _tag: "TImport" }, () => _Result_map4(([s, p]) => _tuple5([s], p, tmp), parseImport(toks, pos))).with({ _tag: "TExport" }, () => ((exportSp) => match8(tokAt(toks, pos + 1).tok).with({ _tag: "TType" }, () => _Result_map4(([s, p]) => _tuple5([widenToExport(exportSp, setTypeMeta(true, doc, s))], p, tmp), parseType(toks, pos + 1))).with({ _tag: "TExtern" }, () => _Result_map4(([s, p]) => _tuple5([widenToExport(exportSp, setExternMeta(true, doc, s))], p, tmp), parseExtern(toks, pos + 1))).with({ _tag: "TLet" }, () => _Result_map4(([stmts, p, tmp2]) => _tuple5(widenHeadToExport(exportSp, map3(setLetMeta(true, doc), stmts)), p, tmp2), parseLet(toks, pos + 1, tmp, hooks))).otherwise(() => errAt("`export` must precede let, type, or extern", tokAt(toks, pos + 1))))(spanOf(lt))).with({ _tag: "TType" }, () => _Result_map4(([s, p]) => _tuple5([setTypeMeta(false, doc, s)], p, tmp), parseType(toks, pos))).with({ _tag: "TExtern" }, () => _Result_map4(([s, p]) => _tuple5([setExternMeta(false, doc, s)], p, tmp), parseExtern(toks, pos))).with({ _tag: "TLet" }, () => _Result_map4(([stmts, p, tmp2]) => _tuple5(map3(setLetMeta(false, doc), stmts), p, tmp2), parseLet(toks, pos, tmp, hooks))).otherwise(() => parseExprStmt(toks, pos, tmp, hooks));
});
var widenToExport = _curry9(2, (start, s) => match8(s).with({ _tag: "SLet" }, ({ name, nameSpan, annot, value, exported, doc, span }) => SLet(name, nameSpan, annot, value, exported, doc, spanning(start, span))).with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, exported, doc, span }) => SType(name, params, ctors, alias, aliasType, exported, doc, spanning(start, span))).with({ _tag: "SExtern" }, ({ name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, span }) => SExtern(name, nameSpan, params, typeExpr, module, imported, curried, exported, doc, spanning(start, span))).otherwise((other) => other));
var widenHeadToExport = _curry9(2, (start, stmts) => match8(stmts).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([head, ...rest]) => _Array_prepend2(widenToExport(start, head), rest)).otherwise(() => stmts));
var isSyncTok = (t) => match8(t).with({ _tag: "TLet" }, () => true).with({ _tag: "TType" }, () => true).with({ _tag: "TExtern" }, () => true).with({ _tag: "TImport" }, () => true).with({ _tag: "TExport" }, () => true).otherwise(() => false);
var isOpener = (t) => or5(or5(eq8(t, TLparen), eq8(t, TLbrace)), eq8(t, TLbracket));
var isCloser = (t) => or5(or5(eq8(t, TRparen), eq8(t, TRbrace)), eq8(t, TRbracket));
var maxParseErrors = 100;
var resumeAt = _curry9(3, (toks, pos, at) => and6(pos + 1 < length6(toks), tokAt(toks, pos).start < at) ? resumeAt(toks, pos + 1, at) : pos);
var skipToSync = _curry9(3, (toks, pos, depth) => {
  const t = tokAt(toks, pos).tok;
  return or5(eq8(t, TEof), and6(eq8(depth, 0), isSyncTok(t))) ? pos : skipToSync(toks, pos + 1, isOpener(t) ? depth + 1 : and6(isCloser(t), depth > 0) ? depth - 1 : depth);
});
var recoverFrom = _curry9(4, (toks, before, failedAt, at) => {
  const resume = resumeAt(toks, before, at);
  const start = eq8(resume, before) ? before + 1 : resume;
  const final = skipToSync(toks, start, 0);
  return { node: SError({ start: failedAt.start, end: tokAt(toks, final - 1).end }), pos: final };
});
var stmtsLoop = _curry9(6, (toks, pos0, tmp0, acc0, diags0, hooks) => {
  let pos = pos0;
  let tmp = tmp0;
  let acc = acc0;
  let diags = diags0;
  while (true) {
    if (eq8(tokAt(toks, pos).tok, TEof)) {
      return { stmts: acc, diagnostics: diags };
    } else {
      {
        const failedAt = tokAt(toks, pos);
        const _step = match8(parseStmt(toks, pos, tmp, hooks)).with((_v) => {
          const _g = _v;
          return _g._tag === "Ok";
        }, ({ value: [stmts, p, tmp2] }) => eq8(p, pos) ? ((r) => _recur3(r.pos, tmp, _Array_append6(r.node, acc), _Array_append6({ message: `unexpected token ${tokName(failedAt.tok)}`, start: failedAt.start, end: failedAt.end }, diags)))(recoverFrom(toks, pos, failedAt, failedAt.start)) : _recur3(p, tmp2, _Array_concat3(acc, stmts), diags)).with({ _tag: "Err" }, ({ error: d }) => ((ds) => length6(ds) >= maxParseErrors ? _done3({ stmts: _Array_append6(SError({ start: failedAt.start, end: tokAt(toks, length6(toks) - 1).end }), acc), diagnostics: _Array_append6({ message: "too many parse errors; stopping", start: failedAt.start, end: failedAt.end }, ds) }) : ((r) => _recur3(r.pos, tmp, _Array_append6(r.node, acc), ds))(recoverFrom(toks, pos, failedAt, d.start)))(_Array_append6(d, diags))).exhaustive();
        if (_step._tag === "recur") {
          [pos, tmp, acc, diags] = _step.args;
          continue;
        }
        return _step.value;
      }
    }
  }
});
var parseRecovering = _curry9(2, (toks, pluginsOpt) => {
  const hooks = parseHooksOf(resolvePluginsDefault(pluginsOpt));
  return stmtsLoop(toks, match8(tokAt(toks, 0).tok).with({ _tag: "TStr" }, ({ value }) => eq8(value, "use open") ? 1 : 0).otherwise(() => 0), 0, [], [], hooks);
});
var parse = (toks) => parseWith(toks, None8);
var parseWith = _curry9(2, (toks, pluginsOpt) => {
  const r = parseRecovering(toks, pluginsOpt);
  return match8(_Array_get6(0, r.diagnostics)).with({ _tag: "Some" }, ({ value: d }) => Err5(d)).with({ _tag: "None" }, () => Ok6(r.stmts)).exhaustive();
});
import { None as None10, Some as Some10, _Array_append as _Array_append8, _Array_concat as _Array_concat4, _Array_find as _Array_find2, _Array_flatMap, _Array_get as _Array_get8, _Array_prepend as _Array_prepend3, _Array_sortBy, _Array_take, _Map_delete, _Map_get as _Map_get3, _Map_keys as _Map_keys3, _Map_set as _Map_set2, _Option_contains as _Option_contains3, _Option_isNone, _Option_isSome as _Option_isSome2, _Option_unwrapOr as _Option_unwrapOr5, _Set_fromArray, _Set_has, _Set_union, _Str_chars as _Str_chars2, _Str_codeAt as _Str_codeAt5, _Str_contains as _Str_contains2, _Str_fromCode as _Str_fromCode2, _Str_get as _Str_get4, _Str_join as _Str_join5, _Str_length as _Str_length5, _Str_slice as _Str_slice3, _Str_split as _Str_split3, _Str_startsWith as _Str_startsWith3, _Str_toNumber as _Str_toNumber2, _Str_trim, _curry as _curry12, _tuple as _tuple6, and as and8, concat, eq as eq11, filter, length as length9, map as map5, not as not7, or as or7, reduce, show as show4 } from "@mochi/compiler/runtime";
import { match as match11 } from "@onrails/pattern";

import { _Array_append as _Array_append7, _Array_get as _Array_get7, _Option_unwrapOr as _Option_unwrapOr4, _Str_length as _Str_length4, _Str_split as _Str_split2, _curry as _curry10, _done as _done4, _recur as _recur4, and as and7, eq as eq9, length as length7, not as not6, or as or6 } from "@mochi/compiler/runtime";
import { match as match9 } from "@onrails/pattern";
var DText = (s) => ({ _tag: "DText", s });
var DVerbatim = (s) => ({ _tag: "DVerbatim", s });
var DLine = _curry10(2, (hard, soft) => ({ _tag: "DLine", hard, soft }));
var DCat = (parts) => ({ _tag: "DCat", parts });
var DIndent = (doc) => ({ _tag: "DIndent", doc });
var DGroup = (doc) => ({ _tag: "DGroup", doc });
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
var group = (doc) => DGroup(doc);
var lineSuffix = (doc) => DLineSuffix(doc);
var joinFrom = _curry10(4, (sep, parts, i, acc) => match9(_Array_get7(i, parts)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: p }) => joinFrom(sep, parts, i + 1, eq9(i, 0) ? _Array_append7(p, acc) : _Array_append7(p, _Array_append7(sep, acc)))).exhaustive());
var join = _curry10(2, (sep, parts) => DCat(joinFrom(sep, parts, 0, [])));
var WNil = { _tag: "WNil" };
var WCons = _curry10(2, (head, tail) => ({ _tag: "WCons", head, tail }));
var consParts = _curry10(4, (parts, i, m, tail) => {
  let k = length7(parts) - 1;
  let w = tail;
  while (true) {
    if (k < 0) {
      return w;
    } else {
      const _step = match9(_Array_get7(k, parts)).with({ _tag: "None" }, () => _done4(w)).with({ _tag: "Some" }, ({ value: d }) => _recur4(k - 1, WCons({ i, m, d }, w))).exhaustive();
      if (_step._tag === "recur") {
        [k, w] = _step.args;
        continue;
      }
      return _step.value;
    }
  }
});
var fits2 = _curry10(2, (width, start) => {
  let rem = width;
  let work = start;
  while (true) {
    if (rem < 0) {
      return false;
    } else {
      const _step = match9(work).with({ _tag: "WNil" }, () => _done4(true)).with((_v) => {
        const _g = _v;
        return _g._tag === "WCons";
      }, ({ head: { i, m, d }, tail }) => match9(d).with({ _tag: "DText" }, ({ s }) => _recur4(rem - _Str_length4(s), tail)).with({ _tag: "DVerbatim" }, () => _done4(true)).with({ _tag: "DCat" }, ({ parts }) => _recur4(rem, consParts(parts, i, m, tail))).with({ _tag: "DIndent" }, ({ doc: inner }) => _recur4(rem, WCons({ i: i + INDENT, m, d: inner }, tail))).with({ _tag: "DGroup" }, ({ doc: inner }) => _recur4(rem, WCons({ i, m: "flat", d: inner }, tail))).with({ _tag: "DLine" }, ({ hard, soft }) => or6(hard, eq9(m, "break")) ? _done4(true) : _recur4(rem - (soft ? 0 : 1), tail)).with({ _tag: "DLineSuffix" }, ({ doc: inner }) => _recur4(rem, WCons({ i, m, d: inner }, tail))).with({ _tag: "DBreakParent" }, () => _recur4(rem, tail)).exhaustive()).exhaustive();
      if (_step._tag === "recur") {
        [rem, work] = _step.args;
        continue;
      }
      return _step.value;
    }
  }
});
var anyForcesBreak = _curry10(2, (parts, i) => match9(_Array_get7(i, parts)).with({ _tag: "None" }, () => false).with({ _tag: "Some" }, ({ value: p }) => or6(forcesBreak(p), anyForcesBreak(parts, i + 1))).exhaustive());
var forcesBreak = (d) => match9(d).with({ _tag: "DBreakParent" }, () => true).with({ _tag: "DVerbatim" }, () => true).with({ _tag: "DLine" }, ({ hard }) => hard).with({ _tag: "DCat" }, ({ parts }) => anyForcesBreak(parts, 0)).with({ _tag: "DIndent" }, ({ doc: inner }) => forcesBreak(inner)).with({ _tag: "DGroup" }, ({ doc: inner }) => forcesBreak(inner)).with({ _tag: "DLineSuffix" }, () => false).with({ _tag: "DText" }, () => false).exhaustive();
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
var posAfter = _curry10(2, (pos, s) => {
  const parts = _Str_split2(`
`, s);
  return eq9(length7(parts), 1) ? pos + _Str_length4(s) : _Str_length4(_Option_unwrapOr4("", _Array_get7(length7(parts) - 1, parts)));
});
var consItems = _curry10(2, (items, tail) => {
  let k = length7(items) - 1;
  let w = tail;
  while (true) {
    if (k < 0) {
      return w;
    } else {
      const _step = match9(_Array_get7(k, items)).with({ _tag: "None" }, () => _done4(w)).with({ _tag: "Some" }, ({ value: it }) => _recur4(k - 1, WCons(it, w))).exhaustive();
      if (_step._tag === "recur") {
        [k, w] = _step.args;
        continue;
      }
      return _step.value;
    }
  }
});
var render = _curry10(2, (root, width) => {
  let out = "";
  let pos = 0;
  let work = WCons({ i: 0, m: "break", d: root }, WNil);
  let sfx = [];
  while (true) {
    const _step = match9(work).with({ _tag: "WNil" }, () => eq9(length7(sfx), 0) ? _done4(out) : _recur4(out, pos, consItems(sfx, WNil), [])).with((_v) => {
      const _g = _v;
      return _g._tag === "WCons";
    }, ({ head: { i, m, d }, tail }) => match9(d).with({ _tag: "DText" }, ({ s }) => _recur4(`${out}${s}`, pos + _Str_length4(s), tail, sfx)).with({ _tag: "DVerbatim" }, ({ s }) => _recur4(`${out}${s}`, posAfter(pos, s), tail, sfx)).with({ _tag: "DCat" }, ({ parts }) => _recur4(out, pos, consParts(parts, i, m, tail), sfx)).with({ _tag: "DIndent" }, ({ doc: inner }) => _recur4(out, pos, WCons({ i: i + INDENT, m, d: inner }, tail), sfx)).with({ _tag: "DLine" }, ({ hard, soft }) => and7(eq9(m, "flat"), not6(hard)) ? ((s) => _recur4(`${out}${s}`, pos + _Str_length4(s), tail, sfx))(soft ? "" : " ") : eq9(length7(sfx), 0) ? _recur4(`${out}
${spaces(i)}`, i, tail, []) : _recur4(out, pos, consItems(sfx, WCons({ i, m, d }, tail)), [])).with({ _tag: "DGroup" }, ({ doc: inner }) => forcesBreak(inner) ? _recur4(out, pos, WCons({ i, m: "break", d: inner }, tail), sfx) : ((cand) => fits2(width - pos, cand) ? _recur4(out, pos, cand, sfx) : _recur4(out, pos, WCons({ i, m: "break", d: inner }, tail), sfx))(WCons({ i, m: "flat", d: inner }, tail))).with({ _tag: "DLineSuffix" }, ({ doc: inner }) => _recur4(out, pos, tail, _Array_append7({ i, m, d: inner }, sfx))).with({ _tag: "DBreakParent" }, () => _recur4(out, pos, tail, sfx)).exhaustive()).exhaustive();
    if (_step._tag === "recur") {
      [out, pos, work, sfx] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var flat = (d) => render(d, 1e9);

import { _Str_chars, _Str_endsWith, _Str_join as _Str_join4, _curry as _curry11, eq as eq10, length as length8, map as map4 } from "@mochi/compiler/runtime";
import { match as match10 } from "@onrails/pattern";
var escChar2 = (c) => match10(c).with("\\", () => "\\\\").with('"', () => "\\\"").with(`
`, () => "\\n").with("\t", () => "\\t").otherwise(() => c);
var strLit = (s) => `"${_Str_join4("", map4(escChar2, _Str_chars(s)))}"`;
var typeArg = (te) => {
  const shown = showTypeExpr(te);
  return _Str_endsWith(">", shown) ? `${shown} ` : shown;
};
var joinWith = _curry11(3, (f, sep, tes) => _Str_join4(sep, map4(f, tes)));
var showTypeExpr = (te) => match10(te).with({ _tag: "TyName" }, ({ name }) => eq10(name, "unit") ? "()" : name).with({ _tag: "TyApp" }, ({ ctor, args }) => `${ctor}<${joinWith(typeArg, ", ", args)}>`).with({ _tag: "TyTuple" }, ({ elems }) => `(${joinWith(showTypeExpr, ", ", elems)})`).with({ _tag: "TyList" }, ({ elem }) => `[${showTypeExpr(elem)}]`).with({ _tag: "TyQual" }, ({ alias, name, args }) => ((head) => eq10(length8(args), 0) ? head : `${head}<${joinWith(typeArg, ", ", args)}>`)(`${alias}.${name}`)).with({ _tag: "TyLit" }, ({ value }) => strLit(value)).with({ _tag: "TyUnion" }, ({ members }) => joinWith(parenArrow, " | ", members)).with({ _tag: "TyArrow" }, ({ from, to }) => `${parenArrow(from)} -> ${showTypeExpr(to)}`).exhaustive();
var parenArrow = (te) => match10(te).with({ _tag: "TyArrow" }, () => `(${showTypeExpr(te)})`).otherwise(() => showTypeExpr(te));

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

var escChar3 = (c) => match11(c).with("\\", () => "\\\\").with('"', () => "\\\"").with(`
`, () => "\\n").with("\t", () => "\\t").otherwise(() => c);
var escFrom = _curry12(3, (chars, i, acc) => match11(_Array_get8(i, chars)).with({ _tag: "None" }, () => acc).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value === "$" && _Option_contains3("{", _Array_get8(i + 1, chars));
}, () => escFrom(chars, i + 2, `${acc}\\\${`)).with({ _tag: "Some" }, ({ value: c }) => escFrom(chars, i + 1, `${acc}${escChar3(c)}`)).exhaustive());
var escStrBody = (s) => escFrom(_Str_chars2(s), 0, "");
var strLit2 = (s) => `"${escStrBody(s)}"`;
var WIDTH = 80;
var commaJoin = _curry12(2, (f, xs) => _Str_join5(", ", map5(f, xs)));
var patField = (f) => match11(f.pat).with((_v) => {
  const _g = _v;
  return _g._tag === "PBind" && (({ name }) => eq11(name, f.label))(_g);
}, ({ name }) => f.label).otherwise(() => `${f.label}: ${pattern(f.pat)}`);
var restOf = (rest) => match11(rest).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: p }) => [`...${pattern(p)}`]).exhaustive();
var pattern = (p) => match11(p).with({ _tag: "PAs" }, ({ pat: inner, name }) => `${pattern(inner)} as ${name}`).with({ _tag: "PWild" }, () => "_").with({ _tag: "PUnit" }, () => "()").with({ _tag: "PBind" }, ({ name }) => name).with({ _tag: "PLit" }, ({ raw }) => raw).with({ _tag: "PBool" }, ({ value }) => show4(value)).with({ _tag: "PStr" }, ({ value }) => strLit2(value)).with({ _tag: "PRecord" }, ({ fields }) => `{ ${commaJoin(patField, fields)} }`).with({ _tag: "PTuple" }, ({ elems }) => `(${commaJoin(pattern, elems)})`).with({ _tag: "PCtor" }, ({ ctor: ctorName, args, ns }) => ((head) => eq11(length9(args), 0) ? head : `${head}(${commaJoin(pattern, args)})`)(match11(ns).with({ _tag: "None" }, () => ctorName).with({ _tag: "Some" }, ({ value: alias }) => `${alias}.${ctorName}`).exhaustive())).with({ _tag: "PArr" }, ({ elems, rest }) => `[${_Str_join5(", ", _Array_concat4(map5(pattern, elems), restOf(rest)))}]`).with({ _tag: "PList" }, ({ elems, rest }) => `@{${_Str_join5(", ", _Array_concat4(map5(pattern, elems), restOf(rest)))}}`).with({ _tag: "POr" }, ({ alts }) => _Str_join5(" | ", map5(pattern, alts))).exhaustive();
var ctorField = (f) => match11(f.name).with({ _tag: "None" }, () => showTypeExpr(f.fieldType)).with({ _tag: "Some" }, ({ value: name }) => `${name}: ${showTypeExpr(f.fieldType)}`).exhaustive();
var ctorText = (c) => eq11(length9(c.fields), 0) ? c.name : `${c.name}(${commaJoin(ctorField, c.fields)})`;
var generics = (params) => eq11(length9(params), 0) ? "" : `<${_Str_join5(", ", params)}>`;
var conventionOf = (module) => _Array_get8(0, filter((c) => _Str_startsWith3(`mochi:${c}:`, module), ["global", "send", "get", "set", "new"]));
var externStmt = _curry12(6, (name, params, typeExpr, module, imported, curried) => {
  const head = `extern ${name}${generics(params)} : ${showTypeExpr(typeExpr)} = `;
  return match11(conventionOf(module)).with({ _tag: "None" }, () => `${head}${curried ? "curried " : ""}${strLit2(module)} ${strLit2(imported)}`).with({ _tag: "Some" }, ({ value: convention }) => ((first) => ((second) => `${head}${convention} ${strLit2(first)}${second}`)(eq11(imported, "") ? "" : ` ${strLit2(imported)}`))(_Str_slice3(_Str_length5(`mochi:${convention}:`), _Str_length5(module), module))).exhaustive();
});
var sepLine = cat([txt(","), line]);
var bracketed = _curry12(3, (open, close, items) => eq11(length9(items), 0) ? txt(`${open}${close}`) : group(cat([txt(open), indent(cat([softline, join(sepLine, items)])), softline, txt(close)])));
var braced = _curry12(3, (open, close, items) => eq11(length9(items), 0) ? txt(`${open}${close}`) : group(cat([txt(open), indent(cat([line, join(sepLine, items)])), line, txt(close)])));
var parenIf = _curry12(2, (cond, d) => cond ? cat([txt("("), d, txt(")")]) : d);
var loosePrefix = _curry12(2, (cts, e) => match11(e).with({ _tag: "ETernary" }, () => true).with({ _tag: "EPipe" }, () => true).otherwise(() => printsAsLambda(cts, e)));
var unspan = (p) => match11(p).with({ _tag: "LPSpanned" }, ({ param: inner }) => inner).otherwise(() => p);
var exprSpan2 = (e) => match11(e).with({ _tag: "ENum" }, ({ span: sp }) => sp).with({ _tag: "EUnit" }, ({ span: sp }) => sp).with({ _tag: "EBool" }, ({ span: sp }) => sp).with({ _tag: "EStr" }, ({ span: sp }) => sp).with({ _tag: "ERef" }, ({ span: sp }) => sp).with({ _tag: "ECall" }, ({ span: sp }) => sp).with({ _tag: "ELambda" }, ({ span: sp }) => sp).with({ _tag: "ELetIn" }, ({ span: sp }) => sp).with({ _tag: "ELetBind" }, ({ span: sp }) => sp).with({ _tag: "EPipe" }, ({ span: sp }) => sp).with({ _tag: "EDo" }, ({ span: sp }) => sp).with({ _tag: "ETernary" }, ({ span: sp }) => sp).with({ _tag: "EMatch" }, ({ span: sp }) => sp).with({ _tag: "ERecord" }, ({ span: sp }) => sp).with({ _tag: "EField" }, ({ span: sp }) => sp).with({ _tag: "ETuple" }, ({ span: sp }) => sp).with({ _tag: "EArr" }, ({ span: sp }) => sp).with({ _tag: "EList" }, ({ span: sp }) => sp).with({ _tag: "ESet" }, ({ span: sp }) => sp).with({ _tag: "EMap" }, ({ span: sp }) => sp).with({ _tag: "ELoop" }, ({ span: sp }) => sp).with({ _tag: "ERecur" }, ({ span: sp }) => sp).with({ _tag: "EInterp" }, ({ span: sp }) => sp).exhaustive();
var noComments = { leading: new Map, trailing: new Map, flatArity: new Map, shadowed: _Set_fromArray([]), etaSkip: false, formatHooks: [], commentStarts: [] };
var spanKey = _curry12(2, (kind, sp) => `${kind}:${show4(sp.start)}:${show4(sp.end)}`);
var STMT = "s";
var EXPR = "e";
var CTOR = "c";
var atKey = _curry12(2, (table, key) => match11(_Map_get3(key, table)).with({ _tag: "Some" }, ({ value: cs }) => cs).with({ _tag: "None" }, () => []).exhaustive());
var pushAt = _curry12(3, (key, c, table) => _Map_set2(key, _Array_append8(c, atKey(table, key)), table));
var lineEndFrom = _curry12(2, (src, i) => match11(_Str_get4(i, src)).with({ _tag: "None" }, () => i).with({ _tag: "Some", value: `
` }, () => i).with({ _tag: "Some" }, () => lineEndFrom(src, i + 1)).exhaustive());
var trimEndFrom = _curry12(2, (s, n) => eq11(n, 0) ? "" : match11(_Str_codeAt5(n - 1, s)).with({ _tag: "Some", value: 32 }, () => trimEndFrom(s, n - 1)).with({ _tag: "Some", value: 9 }, () => trimEndFrom(s, n - 1)).with({ _tag: "Some", value: 13 }, () => trimEndFrom(s, n - 1)).otherwise(() => _Str_slice3(0, n, s)));
var trimEnd = (s) => trimEndFrom(s, _Str_length5(s));
var commentAt = _curry12(3, (src, i, end) => {
  const lineEnd = lineEndFrom(src, end + 1);
  return { start: i, end, text: trimEnd(_Str_slice3(i, end, src)), blankAfter: eq11(_Str_trim(_Str_slice3(end + 1, lineEnd, src)), ""), trailing: false };
});
var scanComments = _curry12(4, (src, i, lineHasToken, acc) => match11(_Str_get4(i, src)).with({ _tag: "None" }, () => acc).with({ _tag: "Some", value: `
` }, () => scanComments(src, i + 1, false, acc)).with({ _tag: "Some", value: " " }, () => scanComments(src, i + 1, lineHasToken, acc)).with({ _tag: "Some", value: "\t" }, () => scanComments(src, i + 1, lineHasToken, acc)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && eq11(_Str_codeAt5(i, src), Some10(13));
}, () => scanComments(src, i + 1, lineHasToken, acc)).with({ _tag: "Some", value: '"' }, () => match11(skipStringLiteral(src, i)).with({ _tag: "Some" }, ({ value: end }) => scanComments(src, end, true, acc)).with({ _tag: "None" }, () => scanComments(src, i + 1, true, acc)).exhaustive()).with({ _tag: "Some", value: "/" }, () => eq11(_Str_get4(i + 1, src), Some10("/")) ? ((end) => ((c) => scanComments(src, end, lineHasToken, _Array_append8({ ...c, trailing: lineHasToken }, acc)))(commentAt(src, i, end)))(lineEndFrom(src, i)) : scanComments(src, i + 1, true, acc)).with({ _tag: "Some" }, () => scanComments(src, i + 1, true, acc)).exhaustive());
var collectComments = (src) => scanComments(src, 0, false, []);
var seqElemExpr2 = (el) => match11(el).with({ _tag: "SEExpr" }, ({ expr: e }) => e).with({ _tag: "SESpread" }, ({ expr: e }) => e).exhaustive();
var exprAnchors = (e) => _Array_append8({ kind: EXPR, sp: exprSpan2(e) }, match11(e).with({ _tag: "ECall" }, ({ fn, args }) => _Array_concat4(exprAnchors(fn), _Array_flatMap(exprAnchors, args))).with({ _tag: "ELambda" }, ({ params, body }) => _Array_concat4(exprAnchors(body), _Array_flatMap((p) => match11(unspan(p)).with((_v) => {
  const _g = _v;
  return _g._tag === "LPLabeled" && _g.defaultValue._tag === "Some";
}, ({ defaultValue: { value: d } }) => exprAnchors(d)).otherwise(() => []), params))).with({ _tag: "ELetIn" }, ({ value, body }) => _Array_concat4(exprAnchors(value), exprAnchors(body))).with({ _tag: "ELetBind" }, ({ value, body }) => _Array_concat4(exprAnchors(value), exprAnchors(body))).with({ _tag: "EPipe" }, ({ left, right }) => _Array_concat4(exprAnchors(left), exprAnchors(right))).with({ _tag: "EDo" }, ({ exprs }) => _Array_flatMap(exprAnchors, exprs)).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => _Array_concat4(exprAnchors(cond), _Array_concat4(exprAnchors(thenE), exprAnchors(elseE)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => _Array_concat4(exprAnchors(scrutinee), _Array_flatMap((a) => _Array_concat4(match11(a.guard).with({ _tag: "Some" }, ({ value: g }) => exprAnchors(g)).with({ _tag: "None" }, () => []).exhaustive(), exprAnchors(a.body)), arms))).with({ _tag: "ERecord" }, ({ fields, spread }) => _Array_concat4(match11(spread).with({ _tag: "Some" }, ({ value: sp }) => exprAnchors(sp)).with({ _tag: "None" }, () => []).exhaustive(), _Array_flatMap((f) => exprAnchors(f.value), fields))).with({ _tag: "EField" }, ({ target }) => exprAnchors(target)).with({ _tag: "ELoop" }, ({ params, body }) => _Array_concat4(_Array_flatMap((prm) => exprAnchors(prm.init), params), exprAnchors(body))).with({ _tag: "ERecur" }, ({ args }) => _Array_flatMap(exprAnchors, args)).with({ _tag: "ETuple" }, ({ elements }) => _Array_flatMap(exprAnchors, elements)).with({ _tag: "EArr" }, ({ elements }) => _Array_flatMap((el) => exprAnchors(seqElemExpr2(el)), elements)).with({ _tag: "EList" }, ({ elements }) => _Array_flatMap((el) => exprAnchors(seqElemExpr2(el)), elements)).with({ _tag: "ESet" }, ({ elements }) => _Array_flatMap((el) => exprAnchors(seqElemExpr2(el)), elements)).with({ _tag: "EMap" }, ({ entries }) => _Array_flatMap((en) => _Array_concat4(exprAnchors(en.key), exprAnchors(en.value)), entries)).with({ _tag: "EInterp" }, ({ parts }) => _Array_flatMap((prt) => match11(prt).with({ _tag: "IPLit" }, () => []).with({ _tag: "IPExpr" }, ({ expr: ex }) => exprAnchors(ex)).exhaustive(), parts)).otherwise(() => []));
var SPAN_SCALE = 1e7;
var anchorKey = (a) => a.sp.start * SPAN_SCALE - a.sp.end;
var sortAnchors = _Array_sortBy(anchorKey);
var trailedByFrom = _curry12(5, (anchors, i, c, src, best) => match11(_Array_get8(i, anchors)).with({ _tag: "None" }, () => best).with({ _tag: "Some" }, ({ value: a }) => ((fits) => ((better) => trailedByFrom(anchors, i + 1, c, src, better ? Some10(a) : best))(and8(fits, match11(best).with({ _tag: "None" }, () => true).with({ _tag: "Some" }, ({ value: b }) => a.sp.end > b.sp.end).exhaustive())))(and8(a.sp.end <= c.start, not7(_Str_contains2(`
`, _Str_slice3(a.sp.end, c.start, src)))))).exhaustive());
var trailedBy = _curry12(3, (anchors, c, src) => trailedByFrom(anchors, 0, c, src, None10));
var leadTargetFrom = _curry12(3, (anchors, i, c) => match11(_Array_get8(i, anchors)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: a }) => a.sp.start >= c.end ? Some10(a) : leadTargetFrom(anchors, i + 1, c)).exhaustive());
var leadTarget = _curry12(2, (anchors, c) => leadTargetFrom(anchors, 0, c));
var attachOne = _curry12(4, (anchors, src, c, tbl) => {
  const trailed = c.trailing ? trailedBy(anchors, c, src) : None10;
  return match11(trailed).with({ _tag: "Some" }, ({ value: a }) => Some10({ ...tbl, trailing: pushAt(spanKey(a.kind, a.sp), c, tbl.trailing) })).with({ _tag: "None" }, () => match11(leadTarget(anchors, c)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: a }) => Some10({ ...tbl, leading: pushAt(spanKey(a.kind, a.sp), c, tbl.leading) })).exhaustive()).exhaustive();
});
var attachFrom = _curry12(5, (comments, i, anchors, src, acc) => match11(_Array_get8(i, comments)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: c }) => attachFrom(comments, i + 1, anchors, src, match11(attachOne(anchors, src, c, acc.table)).with({ _tag: "Some" }, ({ value: table }) => ({ table, tail: acc.tail })).with({ _tag: "None" }, () => ({ table: acc.table, tail: _Array_append8(c, acc.tail) })).exhaustive())).exhaustive());
var commentsForExpr = _curry12(2, (src, e) => attachFrom(collectComments(src), 0, sortAnchors(exprAnchors(e)), src, { table: noComments, tail: [] }).table);
var leadingDocs = _curry12(3, (cts, kind, sp) => _Array_flatMap((c) => c.blankAfter ? [txt(c.text), hardline, hardline] : [txt(c.text), hardline], atKey(cts.leading, spanKey(kind, sp))));
var trailingDocs = _curry12(3, (cts, kind, sp) => _Array_flatMap((c) => [lineSuffix(txt(` ${c.text}`)), breakParent], atKey(cts.trailing, spanKey(kind, sp))));
var hasLead = _curry12(3, (cts, kind, sp) => length9(atKey(cts.leading, spanKey(kind, sp))) > 0);
var withComments = _curry12(4, (cts, kind, sp, doc) => {
  const lead = leadingDocs(cts, kind, sp);
  const trail = trailingDocs(cts, kind, sp);
  return and8(eq11(length9(lead), 0), eq11(length9(trail), 0)) ? doc : cat([...lead, doc, ...trail]);
});
var curryArityFrom = _curry12(3, (def, i, acc) => match11(_Str_codeAt5(i, def)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: code }) => and8(code >= 48, code <= 57) ? curryArityFrom(def, i + 1, `${acc}${_Str_fromCode2(code)}`) : acc).exhaustive());
var commaCountFrom = _curry12(3, (s, i, acc) => match11(_Str_get4(i, s)).with({ _tag: "None" }, () => acc).with({ _tag: "Some", value: "," }, () => commaCountFrom(s, i + 1, acc + 1)).with({ _tag: "Some" }, () => commaCountFrom(s, i + 1, acc)).exhaustive());
var indexOfFrom = _curry12(3, (needle, s, i) => i + _Str_length5(needle) > _Str_length5(s) ? -1 : eq11(_Str_slice3(i, i + _Str_length5(needle), s), needle) ? i : indexOfFrom(needle, s, i + 1));
var arityOfDef = (def) => {
  const curried = indexOfFrom("_curry(", def, 0);
  return curried >= 0 ? ((digits) => eq11(_Str_length5(digits), 0) ? 0 : _Option_unwrapOr5(0, _Str_toNumber2(digits)))(curryArityFrom(def, curried + 7, "")) : ((open) => open < 0 ? 0 : ((close) => close < 0 ? 0 : ((params) => eq11(_Str_length5(params), 0) ? 0 : commaCountFrom(params, 0, 1))(_Str_trim(_Str_slice3(open + 3, close, def))))(indexOfFrom(") =>", def, open)))(indexOfFrom("= (", def, 0));
};
var runtimeArityOf = (jsId) => match11(_Map_get3(jsId, preludeJsDefs)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: def }) => ((n) => n >= 2 ? Some10(n) : None10)(arityOfDef(def))).exhaustive();
var namespaceArity = _curry12(3, (shadowed, target, member) => match11(target).with({ _tag: "ERef" }, ({ name: nsName }) => _Set_has(nsName, shadowed) ? None10 : match11(_Map_get3(nsName, namespaceRuntime)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: members }) => match11(_Map_get3(member, members)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: jsId }) => runtimeArityOf(jsId)).exhaustive()).exhaustive()).otherwise(() => None10));
var labeledCount = (params) => length9(filter((p) => match11(unspan(p)).with({ _tag: "LPLabeled" }, () => true).otherwise(() => false), params));
var jsArity = (params) => {
  const labs = labeledCount(params);
  return length9(params) - labs + (labs > 0 ? 1 : 0);
};
var collapsedArity = (e) => match11(e).with({ _tag: "ELambda" }, ({ params, body }) => jsArity(params) + collapsedArity(body)).otherwise(() => 0);
var patNames = (p) => match11(p).with({ _tag: "PBind" }, ({ name }) => [name]).with({ _tag: "PAs" }, ({ pat: inner, name }) => _Array_append8(name, patNames(inner))).with({ _tag: "PTuple" }, ({ elems }) => _Array_flatMap(patNames, elems)).with({ _tag: "PRecord" }, ({ fields }) => _Array_flatMap((f) => patNames(f.pat), fields)).with({ _tag: "PCtor" }, ({ args }) => _Array_flatMap(patNames, args)).with({ _tag: "PArr" }, ({ elems, rest }) => _Array_concat4(_Array_flatMap(patNames, elems), match11(rest).with({ _tag: "Some" }, ({ value: r }) => patNames(r)).with({ _tag: "None" }, () => []).exhaustive())).with({ _tag: "PList" }, ({ elems, rest }) => _Array_concat4(_Array_flatMap(patNames, elems), match11(rest).with({ _tag: "Some" }, ({ value: r }) => patNames(r)).with({ _tag: "None" }, () => []).exhaustive())).with({ _tag: "POr" }, ({ alts }) => _Array_flatMap(patNames, alts)).otherwise(() => []);
var paramNames = (p) => match11(unspan(p)).with({ _tag: "LPName" }, ({ name }) => [name]).with({ _tag: "LPLabeled" }, ({ name }) => [name]).with({ _tag: "LPTuple" }, ({ names }) => names).with({ _tag: "LPRecord" }, ({ fields }) => fields).otherwise(() => []);
var innerNames = (e) => match11(e).with({ _tag: "ELambda" }, ({ params, body }) => _Array_concat4(_Array_flatMap(paramNames, params), _Array_concat4(innerNames(body), _Array_flatMap((p) => match11(unspan(p)).with((_v) => {
  const _g = _v;
  return _g._tag === "LPLabeled" && _g.defaultValue._tag === "Some";
}, ({ defaultValue: { value: d } }) => innerNames(d)).otherwise(() => []), params)))).with({ _tag: "ELetIn" }, ({ name, value, body }) => _Array_append8(name, _Array_concat4(innerNames(value), innerNames(body)))).with({ _tag: "ELetBind" }, ({ param, value, body }) => _Array_concat4(paramNames(param), _Array_concat4(innerNames(value), innerNames(body)))).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => _Array_concat4(innerNames(scrutinee), _Array_flatMap((a) => _Array_concat4(patNames(a.pattern), _Array_concat4(match11(a.guard).with({ _tag: "Some" }, ({ value: g }) => innerNames(g)).with({ _tag: "None" }, () => []).exhaustive(), innerNames(a.body))), arms))).with({ _tag: "ELoop" }, ({ params, body }) => _Array_concat4(map5((p) => p.name, params), _Array_concat4(_Array_flatMap((p) => innerNames(p.init), params), innerNames(body)))).with({ _tag: "ECall" }, ({ fn, args }) => _Array_concat4(innerNames(fn), _Array_flatMap(innerNames, args))).with({ _tag: "EPipe" }, ({ left: l, right: r }) => _Array_concat4(innerNames(l), innerNames(r))).with({ _tag: "EDo" }, ({ exprs }) => _Array_flatMap(innerNames, exprs)).with({ _tag: "ETernary" }, ({ cond: c, thenE: t, elseE: f }) => _Array_concat4(innerNames(c), _Array_concat4(innerNames(t), innerNames(f)))).with({ _tag: "ERecord" }, ({ fields, spread }) => _Array_concat4(match11(spread).with({ _tag: "Some" }, ({ value: s }) => innerNames(s)).with({ _tag: "None" }, () => []).exhaustive(), _Array_flatMap((f) => innerNames(f.value), fields))).with({ _tag: "EField" }, ({ target }) => innerNames(target)).with({ _tag: "ETuple" }, ({ elements: els }) => _Array_flatMap(innerNames, els)).with({ _tag: "EArr" }, ({ elements: els }) => _Array_flatMap((el) => innerNames(seqElemExpr2(el)), els)).with({ _tag: "EList" }, ({ elements: els }) => _Array_flatMap((el) => innerNames(seqElemExpr2(el)), els)).with({ _tag: "ESet" }, ({ elements: els }) => _Array_flatMap((el) => innerNames(seqElemExpr2(el)), els)).with({ _tag: "EMap" }, ({ entries }) => _Array_flatMap((en) => _Array_concat4(innerNames(en.key), innerNames(en.value)), entries)).with({ _tag: "ERecur" }, ({ args }) => _Array_flatMap(innerNames, args)).with({ _tag: "EInterp" }, ({ parts }) => _Array_flatMap((p) => match11(p).with({ _tag: "IPLit" }, () => []).with({ _tag: "IPExpr" }, ({ expr: ex }) => innerNames(ex)).exhaustive(), parts)).otherwise(() => []);
var stmtInnerNames = (s) => match11(s).with({ _tag: "SLet" }, ({ value }) => innerNames(value)).with({ _tag: "SExpr" }, ({ value }) => innerNames(value)).with({ _tag: "SImport" }, ({ names }) => map5((n) => n.name, names)).with({ _tag: "SImportNs" }, ({ alias }) => [alias.name]).otherwise(() => []);
var topLevelNames = (stmts) => _Array_flatMap((s) => match11(s).with({ _tag: "SLet" }, ({ name }) => [name]).with({ _tag: "SExtern" }, ({ name }) => [name]).otherwise(() => []), stmts);
var preludeArity = (innerBound) => reduce(_curry12(2, (acc, name) => _Set_has(name, innerBound) ? acc : match11(runtimeArityOf(name)).with({ _tag: "Some" }, ({ value: n }) => _Map_set2(name, n, acc)).with({ _tag: "None" }, () => acc).exhaustive()), new Map, _Map_keys3(preludeJsDefs));
var withLetArities = _curry12(3, (stmts, innerBound, base) => reduce(_curry12(2, (acc, s) => match11(s).with({ _tag: "SLet" }, ({ name, value }) => _Set_has(name, innerBound) ? _Map_delete(name, acc) : ((n) => n >= 2 ? _Map_set2(name, n, acc) : _Map_delete(name, acc))(collapsedArity(value))).with({ _tag: "SExtern" }, ({ name }) => _Map_delete(name, acc)).otherwise(() => acc)), base, stmts));
var buildFlatArity = _curry12(2, (stmts, innerBound) => withLetArities(stmts, innerBound, preludeArity(innerBound)));
var isInert = (e) => match11(e).with({ _tag: "ERef" }, () => true).with({ _tag: "ENum" }, () => true).with({ _tag: "EBool" }, () => true).with({ _tag: "EStr" }, () => true).with({ _tag: "EUnit" }, () => true).with({ _tag: "EField" }, ({ target }) => isInert(target)).otherwise(() => false);
var mentionsRef = _curry12(2, (e, name) => match11(e).with({ _tag: "ERef" }, ({ name: n }) => eq11(n, name)).with({ _tag: "EField" }, ({ target }) => mentionsRef(target, name)).otherwise(() => false));
var calleeArity = _curry12(2, (ctx, fn) => match11(fn).with({ _tag: "ERef" }, ({ name }) => _Map_get3(name, ctx.flatArity)).with({ _tag: "EField" }, ({ target, name: member }) => namespaceArity(ctx.shadowed, target, member)).otherwise(() => None10));
var etaCalleeArity = _curry12(2, (ctx, fn) => match11(fn).with({ _tag: "ERef" }, ({ name }) => _Set_has(name, ctx.shadowed) ? None10 : runtimeArityOf(name)).with({ _tag: "EField" }, ({ target, name: member }) => namespaceArity(ctx.shadowed, target, member)).otherwise(() => None10));
var PIPE_PREC = 5;
var FAST_PIPE_PREC = 21;
var NEQ_PREC = 8;
var CONCAT_PREC = 10;
var binOpInfo = (name) => match11(name).with("or", () => Some10({ symbol: "||", prec: 7 })).with("and", () => Some10({ symbol: "&&", prec: 7 })).with("eq", () => Some10({ symbol: "==", prec: 8 })).with("lt", () => Some10({ symbol: "<", prec: 8 })).with("lte", () => Some10({ symbol: "<=", prec: 8 })).with("gt", () => Some10({ symbol: ">", prec: 8 })).with("gte", () => Some10({ symbol: ">=", prec: 8 })).with("concat", () => Some10({ symbol: "++", prec: 10 })).with("add", () => Some10({ symbol: "+", prec: 10 })).with("sub", () => Some10({ symbol: "-", prec: 10 })).with("mul", () => Some10({ symbol: "*", prec: 20 })).with("div", () => Some10({ symbol: "/", prec: 20 })).with("mod", () => Some10({ symbol: "%", prec: 20 })).otherwise(() => None10);
var isLambdaExpr = (e) => match11(e).with({ _tag: "ELambda" }, () => true).otherwise(() => false);
var printsAsLambda = _curry12(2, (cts, e) => match11(e).with({ _tag: "ELambda" }, ({ params, body }) => or7(cts.etaSkip, _Option_isNone(etaPartial(cts, params, body)))).otherwise(() => false));
var isLambdaOrTernary = _curry12(2, (cts, e) => match11(e).with({ _tag: "ETernary" }, () => true).otherwise(() => printsAsLambda(cts, e)));
var binOpFor = _curry12(2, (fn, args) => match11(_tuple6(fn, args)).with((_v) => {
  const _g = _v;
  return _g[0]._tag === "ERef" && _g[1].length === 2;
}, ([{ name }]) => binOpInfo(name)).otherwise(() => None10));
var binOpOf = (e) => match11(e).with({ _tag: "ECall" }, ({ fn, args }) => binOpFor(fn, args)).otherwise(() => None10);
var unaryOpOf = (name) => match11(name).with("not", () => Some10("!")).with("negate", () => Some10("-")).otherwise(() => None10);
var pipePrecOf = (e) => match11(e).with({ _tag: "EPipe" }, ({ fast }) => Some10(fast ? FAST_PIPE_PREC : PIPE_PREC)).otherwise(() => None10);
var neqFor = _curry12(2, (fn, args) => match11(_tuple6(fn, args)).with((_v) => {
  const _g = _v;
  return _g[0]._tag === "ERef" && _g[0].name === "not" && _g[1].length === 1 && _g[1][0]._tag === "ECall" && _g[1][0].fn._tag === "ERef" && _g[1][0].fn.name === "eq" && _g[1][0].args.length === 2;
}, ([, [{ args: [l, r] }]]) => Some10(_tuple6(l, r))).otherwise(() => None10));
var neqOperands = (e) => match11(e).with({ _tag: "ECall" }, ({ fn, args }) => neqFor(fn, args)).otherwise(() => None10);
var infixPrec = (e) => match11(pipePrecOf(e)).with({ _tag: "Some" }, ({ value: p }) => Some10(p)).with({ _tag: "None" }, () => match11(binOpOf(e)).with({ _tag: "Some" }, ({ value: info }) => Some10(info.prec)).with({ _tag: "None" }, () => match11(neqOperands(e)).with({ _tag: "Some" }, () => Some10(NEQ_PREC)).with({ _tag: "None" }, () => None10).exhaustive()).exhaustive()).exhaustive();
var binOperandD = _curry12(4, (cts, e, parentPrec, isRight) => isLambdaOrTernary(cts, e) ? cat([txt("("), exprD(cts, e), txt(")")]) : match11(infixPrec(e)).with({ _tag: "Some" }, ({ value: prec }) => parenIf(isRight ? prec <= parentPrec : prec < parentPrec, exprD(cts, e))).with({ _tag: "None" }, () => exprD(cts, e)).exhaustive());
var pipeLeftD = _curry12(3, (cts, e, parentPrec) => isLambdaOrTernary(cts, e) ? cat([txt("("), exprD(cts, e), txt(")")]) : match11(infixPrec(e)).with({ _tag: "Some" }, ({ value: prec }) => parenIf(prec < parentPrec, exprD(cts, e))).with({ _tag: "None" }, () => exprD(cts, e)).exhaustive());
var concatSegmentsFrom = _curry12(2, (e, acc) => match11(e).with((_v) => {
  const _g = _v;
  return _g._tag === "ECall" && _g.fn._tag === "ERef" && _g.fn.name === "concat" && _g.args.length === 2;
}, ({ args: [l, r] }) => concatSegmentsFrom(l, _Array_prepend3(r, acc))).otherwise(() => _Array_prepend3(e, acc)));
var concatD = _curry12(3, (cts, l, r) => match11(concatSegmentsFrom(l, [r])).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => txt("")).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([head, ...rest]) => group(cat([binOperandD(cts, head, CONCAT_PREC, false), indent(cat(map5((s) => cat([line, txt("++ "), binOperandD(cts, s, CONCAT_PREC, true)]), rest)))]))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var binaryD = _curry12(3, (cts, fn, args) => match11(neqFor(fn, args)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some";
}, ({ value: [l, r] }) => Some10(group(cat([binOperandD(cts, l, NEQ_PREC, false), txt(" != "), binOperandD(cts, r, NEQ_PREC, true)])))).with({ _tag: "None" }, () => match11(binOpFor(fn, args)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: info }) => match11(args).with((_v) => {
  const _g = _v;
  return _g.length === 2;
}, ([l, r]) => eq11(info.symbol, "++") ? Some10(concatD(cts, l, r)) : Some10(group(cat([binOperandD(cts, l, info.prec, false), txt(` ${info.symbol} `), binOperandD(cts, r, info.prec, true)])))).otherwise(() => None10)).exhaustive()).exhaustive());
var unaryD = _curry12(3, (cts, fn, args) => match11(_tuple6(fn, args)).with((_v) => {
  const _g = _v;
  return _g[0]._tag === "ERef" && _g[1].length === 1;
}, ([{ name }, [operand]]) => match11(unaryOpOf(name)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: symbol }) => ((forced) => Some10(cat([txt(symbol), parenIf(forced, exprD(cts, operand))])))(or7(or7(loosePrefix(cts, operand), _Option_isSome2(binOpOf(operand))), _Option_isSome2(neqOperands(operand))))).exhaustive()).otherwise(() => None10));
var etaPartial = _curry12(3, (ctx, params, body) => match11(params).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([only]) => match11(unspan(only)).with((_v) => {
  const _g = _v;
  return _g._tag === "LPName" && _g.annot._tag === "None";
}, ({ name }) => _Str_startsWith3("$", name) ? None10 : match11(body).with({ _tag: "ECall" }, () => ((flat) => match11(flat).with((_v) => {
  const _g = _v;
  return _g._tag === "ECall" && _g.origin._tag === "None";
}, ({ fn, args, span: sp }) => ((n) => eq11(n, 0) ? None10 : match11(_Array_get8(n - 1, args)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "ERef";
}, ({ value: { name: lastName } }) => not7(eq11(lastName, name)) ? None10 : ((prefix) => and8(and8(and8(isInert(fn), allInert(prefix)), not7(mentionsRef(fn, name))), not7(anyMentions(prefix, name))) ? match11(etaCalleeArity(ctx, fn)).with({ _tag: "Some" }, ({ value: arity }) => eq11(n, arity) ? Some10(ECall(fn, prefix, None10, sp)) : None10).with({ _tag: "None" }, () => None10).exhaustive() : None10)(_Array_take(n - 1, args))).otherwise(() => None10))(length9(args))).otherwise(() => None10))(match11(flattenCallSpine(ctx, body)).with({ _tag: "Some" }, ({ value: f }) => f).with({ _tag: "None" }, () => body).exhaustive())).otherwise(() => None10)).otherwise(() => None10)).otherwise(() => None10));
var allInert = (args) => eq11(length9(filter((a) => not7(isInert(a)), args)), 0);
var anyMentions = _curry12(2, (args, name) => length9(filter((a) => mentionsRef(a, name), args)) > 0);
var spineGroups = _curry12(2, (e, acc) => match11(e).with((_v) => {
  const _g = _v;
  return _g._tag === "ECall" && _g.origin._tag === "Some";
}, () => None10).with((_v) => {
  const _g = _v;
  return _g._tag === "ECall" && _g.origin._tag === "None";
}, ({ fn, args }) => spineGroups(fn, _Array_prepend3(args, acc))).otherwise(() => Some10(_tuple6(e, acc))));
var flattenCallSpine = _curry12(2, (ctx, e) => match11(spineGroups(e, [])).with({ _tag: "None" }, () => None10).with((_v) => {
  const _g = _v;
  return _g._tag === "Some";
}, ({ value: [head, groups] }) => (([callee, allGroups]) => or7(length9(allGroups) < 2, anyEmptyGroup(allGroups)) ? None10 : match11(calleeArity(ctx, callee)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: arity }) => ((args) => or7(length9(args) > arity, anyUnit(args)) ? None10 : Some10(ECall(callee, args, None10, exprSpan2(e))))(_Array_flatMap((g) => g, allGroups))).exhaustive())(match11(head).with({ _tag: "ELambda" }, ({ params, body: lbody }) => match11(etaPartial(ctx, params, lbody)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "ECall";
}, ({ value: { fn: efn, args: eargs } }) => _tuple6(efn, _Array_prepend3(eargs, groups))).otherwise(() => _tuple6(head, groups))).otherwise(() => _tuple6(head, groups)))).exhaustive());
var anyEmptyGroup = (groups) => length9(filter((g) => eq11(length9(g), 0), groups)) > 0;
var anyUnit = (args) => length9(filter((a) => match11(a).with({ _tag: "EUnit" }, () => true).otherwise(() => false), args)) > 0;
var isSectionParam = (p) => match11(unspan(p)).with({ _tag: "LPName", name: "$s" }, () => true).otherwise(() => false);
var isRef2 = _curry12(2, (e, name) => match11(e).with({ _tag: "ERef" }, ({ name: n }) => eq11(n, name)).otherwise(() => false));
var sectionParts = (body) => match11(neqOperands(body)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some";
}, ({ value: [l, r] }) => Some10(_tuple6({ symbol: "!=", prec: NEQ_PREC }, l, r))).with({ _tag: "None" }, () => match11(binOpOf(body)).with({ _tag: "None" }, () => None10).with({ _tag: "Some" }, ({ value: info }) => match11(body).with((_v) => {
  const _g = _v;
  return _g._tag === "ECall" && _g.args.length === 2;
}, ({ args: [l, r] }) => Some10(_tuple6(info, l, r))).otherwise(() => None10)).exhaustive()).exhaustive();
var sectionOf = _curry12(3, (cts, params, body) => match11(params).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([only]) => isSectionParam(only) ? match11(sectionParts(body)).with({ _tag: "None" }, () => None10).with((_v) => {
  const _g = _v;
  return _g._tag === "Some";
}, ({ value: [info, l, r] }) => ((lIsParam) => ((rIsParam) => eq11(lIsParam, rIsParam) ? None10 : lIsParam ? Some10(cat([txt(`(${info.symbol} `), binOperandD(cts, r, info.prec, true), txt(")")])) : Some10(cat([txt("("), binOperandD(cts, l, info.prec, false), txt(` ${info.symbol})`)])))(isRef2(r, "$s")))(isRef2(l, "$s"))).exhaustive() : None10).otherwise(() => None10));
var composeParts = _curry12(2, (params, body) => match11(_tuple6(params, body)).with((_v) => {
  const _g = _v;
  return _g[0].length === 1 && _g[1]._tag === "ECall" && _g[1].args.length === 1 && _g[1].args[0]._tag === "ECall" && _g[1].args[0].args.length === 1;
}, ([[p], { fn: right, args: [{ fn: left, args: [inner] }] }]) => match11(unspan(p)).with({ _tag: "LPName", name: "$x" }, () => isRef2(inner, "$x") ? Some10(_tuple6(left, right)) : None10).otherwise(() => None10)).otherwise(() => None10));
var composeSegmentsFrom = _curry12(2, (e, acc) => match11(e).with({ _tag: "ELambda" }, ({ params, body }) => match11(composeParts(params, body)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some";
}, ({ value: [left, right] }) => composeSegmentsFrom(left, _Array_prepend3(right, acc))).with({ _tag: "None" }, () => _Array_prepend3(e, acc)).exhaustive()).otherwise(() => _Array_prepend3(e, acc)));
var destructureLetD = _curry12(3, (cts, fn, args) => match11(_tuple6(fn, args)).with((_v) => {
  const _g = _v;
  return _g[0]._tag === "ELambda" && _g[0].params.length === 1 && _g[1].length === 1;
}, ([{ params: [p], body: lbody }, [value]]) => match11(unspan(p)).with({ _tag: "LPName" }, () => None10).otherwise(() => Some10(letLikeD(cts, `let ${paramText(cts, p)}`, value, lbody)))).otherwise(() => None10));
var refoldCall = _curry12(3, (cts, fn, args) => match11(destructureLetD(cts, fn, args)).with({ _tag: "Some" }, ({ value: d }) => Some10(d)).with({ _tag: "None" }, () => match11(binaryD(cts, fn, args)).with({ _tag: "Some" }, ({ value: d }) => Some10(d)).with({ _tag: "None" }, () => unaryD(cts, fn, args)).exhaustive()).exhaustive());
var labeledFieldD = _curry12(2, (cts, f) => match11(f.value).with((_v) => {
  const _g = _v;
  return _g._tag === "ERef" && (({ name }) => eq11(name, f.name))(_g);
}, ({ name }) => txt(`~${f.name}`)).otherwise(() => cat([txt(`~${f.name}=`), exprD(cts, f.value)])));
var callArgDocs = _curry12(3, (cts, args, origin) => match11(origin).with({ _tag: "Some", value: "labeled" }, () => match11(_Array_get8(length9(args) - 1, args)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "ERecord" && _g.value.spread._tag === "None";
}, ({ value: { fields } }) => _Array_concat4(map5((x) => exprD(cts, x), _Array_take(length9(args) - 1, args)), map5((f) => labeledFieldD(cts, f), fields))).otherwise(() => map5((x) => exprD(cts, x), args))).otherwise(() => map5((x) => exprD(cts, x), args)));
var labeledParamText = _curry12(5, (cts, name, annot, optional, defaultValue) => {
  const ann = match11(annot).with({ _tag: "Some" }, ({ value: te }) => `: ${showTypeExpr(te)}`).with({ _tag: "None" }, () => "").exhaustive();
  const def = match11(defaultValue).with({ _tag: "Some" }, ({ value: d }) => ` = ${flat(exprD(cts, d))}`).with({ _tag: "None" }, () => "").exhaustive();
  return `~${name}${optional ? "?" : ""}${ann}${def}`;
});
var paramText = _curry12(2, (cts, p) => match11(unspan(p)).with({ _tag: "LPName" }, ({ name, annot }) => match11(annot).with({ _tag: "Some" }, ({ value: te }) => `${name}: ${showTypeExpr(te)}`).with({ _tag: "None" }, () => name).exhaustive()).with({ _tag: "LPTuple" }, ({ names }) => `(${_Str_join5(", ", names)})`).with({ _tag: "LPRecord" }, ({ fields }) => `{ ${_Str_join5(", ", fields)} }`).with({ _tag: "LPLabeled" }, ({ name, annot, optional, defaultValue }) => labeledParamText(cts, name, annot, optional, defaultValue)).with({ _tag: "LPSpanned" }, () => "").exhaustive());
var paramsText = _curry12(2, (cts, ps) => match11(ps).with((_v) => {
  const _g = _v;
  return _g.length === 1;
}, ([only]) => match11(unspan(only)).with((_v) => {
  const _g = _v;
  return _g._tag === "LPName" && _g.annot._tag === "None";
}, ({ name }) => name).otherwise(() => `(${commaJoin((p) => paramText(cts, p), ps)})`)).otherwise(() => `(${commaJoin((p) => paramText(cts, p), ps)})`));
var quoted = (body) => concat(concat('"', body), '"');
var interpText = _curry12(2, (cts, parts) => {
  const hole = (ex) => concat(concat(concat("$", "{"), flat(exprD(cts, ex))), "}");
  return quoted(_Str_join5("", map5((p) => match11(p).with({ _tag: "IPLit" }, ({ value }) => escStrBody(value)).with({ _tag: "IPExpr" }, ({ expr: ex }) => hole(ex)).exhaustive(), parts)));
});
var discardedFrom = _curry12(2, (e, acc) => match11(e).with({ _tag: "ELetIn", name: "_" }, ({ value, body }) => discardedFrom(body, _Array_append8(value, acc))).otherwise(() => eq11(length9(acc), 0) ? None10 : Some10(_Array_append8(e, acc))));
var discardedLetExprs = (e) => discardedFrom(e, []);
var doBlockD = _curry12(2, (cts, exprs) => cat([txt("{"), indent(cat([hardline, join(cat([txt(";"), hardline]), map5((x) => exprD(cts, x), exprs))])), hardline, txt("}")]));
var doD = _curry12(2, (cts, exprs) => cat([txt("do "), doBlockD(cts, exprs)]));
var lambdaD = _curry12(3, (cts, params, body) => match11(sectionOf(cts, params, body)).with({ _tag: "Some" }, ({ value: section }) => section).with({ _tag: "None" }, () => match11(cts.etaSkip ? None10 : etaPartial(cts, params, body)).with({ _tag: "Some" }, ({ value: eta }) => exprD(cts, eta)).with({ _tag: "None" }, () => match11(composeParts(params, body)).with({ _tag: "Some" }, () => match11(composeSegmentsFrom(ELambda(params, body, { start: 0, end: 0 }), [])).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => txt("")).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([head, ...rest]) => group(cat([operandD(cts, head), indent(cat(map5((s) => cat([line, txt(">> "), operandD(cts, s)]), rest)))]))).otherwise(() => {
  throw new Error("non-exhaustive match");
})).with({ _tag: "None" }, () => plainLambdaD({ ...cts, etaSkip: isLambdaExpr(body) }, params, body)).exhaustive()).exhaustive()).exhaustive());
var plainLambdaD = _curry12(3, (cts, params, body) => {
  const head = txt(`${paramsText(cts, params)} =>`);
  return match11(body).with({ _tag: "EDo" }, ({ exprs }) => cat([head, txt(" "), doBlockD(cts, exprs)])).otherwise(() => match11(discardedLetExprs(body)).with({ _tag: "Some" }, ({ value: exprs }) => cat([head, txt(" "), doBlockD(cts, exprs)])).with({ _tag: "None" }, () => match11(body).with((_v) => {
    const _g = _v;
    return _g._tag === "EMatch" && not7(hasLead(cts, EXPR, exprSpan2(body)));
  }, () => cat([head, txt(" "), exprD(cts, body)])).otherwise(() => group(cat([head, indent(cat([line, exprD(cts, body)]))])))).exhaustive());
});
var condD = _curry12(2, (cts, c) => match11(c).with({ _tag: "ETernary" }, () => cat([txt("("), exprD(cts, c), txt(")")])).otherwise(() => exprD(cts, c)));
var branchD = _curry12(3, (cts, marker, e) => hasLead(cts, EXPR, exprSpan2(e)) ? cat([txt(marker), indent(cat([hardline, exprD(cts, e)]))]) : cat([txt(`${marker} `), exprD(cts, e)]));
var ternaryArmsFrom = _curry12(2, (e, acc) => match11(e).with({ _tag: "ETernary" }, ({ cond, thenE, elseE }) => ternaryArmsFrom(elseE, _Array_append8({ cond, thenE }, acc))).otherwise(() => _tuple6(acc, e)));
var ternaryRestParts = _curry12(3, (cts, arms, i) => match11(_Array_get8(i, arms)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: a }) => [line, hasLead(cts, EXPR, exprSpan2(a.cond)) ? cat([txt(":"), indent(cat([hardline, condD(cts, a.cond)]))]) : cat([txt(": "), condD(cts, a.cond)]), line, branchD(cts, "?", a.thenE), ...ternaryRestParts(cts, arms, i + 1)]).exhaustive());
var ternaryD = _curry12(2, (cts, e) => (([arms, elseE]) => match11(_Array_get8(0, arms)).with({ _tag: "None" }, () => txt("")).with({ _tag: "Some" }, ({ value: first }) => group(cat([condD(cts, first.cond), indent(cat([line, branchD(cts, "?", first.thenE), ...ternaryRestParts(cts, arms, 1), line, branchD(cts, ":", elseE)]))]))).exhaustive())(ternaryArmsFrom(e, [])));
var printsAsLet = (e) => match11(e).with({ _tag: "ELetIn" }, () => _Option_isNone(discardedLetExprs(e))).with({ _tag: "ELetBind" }, () => true).with((_v) => {
  const _g = _v;
  return _g._tag === "ECall" && _g.fn._tag === "ELambda" && _g.fn.params.length === 1 && _g.args.length === 1;
}, ({ fn: { params: [p] } }) => match11(unspan(p)).with({ _tag: "LPName" }, () => false).otherwise(() => true)).otherwise(() => false);
var letLikeD = _curry12(4, (cts, head, value, body) => {
  const cont = printsAsLet(body) ? cat([line, exprD(cts, body)]) : indent(cat([line, exprD(cts, body)]));
  return group(cat([txt(`${head} = `), ...leadingDocs(cts, EXPR, exprSpan2(value)), exprRaw(cts, value), txt(" in"), ...trailingDocs(cts, EXPR, exprSpan2(value)), cont]));
});
var recordFieldD = _curry12(2, (cts, f) => match11(f.value).with((_v) => {
  const _g = _v;
  return _g._tag === "ERef" && (({ name }) => eq11(name, f.name))(_g);
}, ({ name }) => exprD(cts, f.value)).otherwise(() => cat([txt(`${f.name}: `), exprD(cts, f.value)])));
var recordD = _curry12(3, (cts, fields, spread) => {
  const fieldDocs = map5((f) => recordFieldD(cts, f), fields);
  return braced("{", "}", match11(spread).with({ _tag: "Some" }, ({ value: s }) => _Array_prepend3(cat([txt("..."), exprD(cts, s)]), fieldDocs)).with({ _tag: "None" }, () => fieldDocs).exhaustive());
});
var seqElemD = _curry12(2, (cts, el) => match11(el).with({ _tag: "SEExpr" }, ({ expr: e }) => exprD(cts, e)).with({ _tag: "SESpread" }, ({ expr: e }) => cat([txt("..."), exprD(cts, e)])).exhaustive());
var pipeSegmentsFrom = _curry12(2, (e, acc) => match11(e).with({ _tag: "EPipe", fast: false }, ({ left, right }) => pipeSegmentsFrom(left, _Array_prepend3(right, acc))).otherwise(() => _Array_prepend3(e, acc)));
var matchArmD = _curry12(2, (cts, a) => {
  const guard = match11(a.guard).with({ _tag: "Some" }, ({ value: g }) => ` when ${flat(exprD(cts, g))}`).with({ _tag: "None" }, () => "").exhaustive();
  const head = txt(`| ${pattern(a.pattern)}${guard} =>`);
  return hasLead(cts, EXPR, exprSpan2(a.body)) ? cat([head, indent(cat([hardline, exprD(cts, a.body)]))]) : cat([head, txt(" "), indent(exprD(cts, a.body))]);
});
var matchD = _curry12(3, (cts, scrutinee, arms) => group(cat([txt(`switch ${flat(exprD(cts, scrutinee))} {`), indent(cat(map5((a) => cat([line, matchArmD(cts, a)]), arms))), line, txt("}")])));
var loopD = _curry12(3, (cts, params, body) => group(cat([txt("loop ("), join(txt(", "), map5((p) => cat([txt(`${p.name} = `), exprD(cts, p.init)]), params)), txt(") {"), indent(cat([line, exprD(cts, body)])), line, txt("}")])));
var lastArgHugs = (body) => match11(body).with({ _tag: "EMatch" }, () => true).with({ _tag: "ELoop" }, () => true).with({ _tag: "EDo" }, () => true).otherwise(() => _Option_isSome2(discardedLetExprs(body)));
var callArgsD = _curry12(5, (cts, fn, args, origin, asCallee) => match11(refoldCall(cts, fn, args)).with({ _tag: "Some" }, ({ value: d }) => d).with({ _tag: "None" }, () => match11(flattenCallSpine(cts, ECall(fn, args, origin, { start: 0, end: 0 }))).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "ECall";
}, ({ value: { fn: ffn, args: fargs, origin: forigin } }) => plainCallD(cts, ffn, fargs, forigin, asCallee)).otherwise(() => plainCallD(cts, fn, args, origin, asCallee))).exhaustive());
var plainCallD = _curry12(5, (cts, fn, args, origin, asCallee) => {
  const fnD = calleeD(cts, fn);
  return match11(args).with((_v) => {
    const _g = _v;
    return _g.length === 0;
  }, () => cat([fnD, txt("()")])).with((_v) => {
    const _g = _v;
    return _g.length === 1 && _g[0]._tag === "ETuple";
  }, ([{ elements, span: tsp }]) => group(cat([fnD, txt("("), exprD(cts, ETuple(elements, tsp)), txt(")")]))).otherwise(() => ((argDocs) => match11(_Array_get8(length9(args) - 1, args)).with((_v) => {
    const _g = _v;
    return _g._tag === "Some" && _g.value._tag === "ELambda";
  }, ({ value: { body: lbody } }) => group(cat([fnD, txt("("), join(txt(", "), argDocs), or7(lastArgHugs(lbody), not7(asCallee)) ? txt(")") : cat([softline, txt(")")])]))).otherwise(() => cat([fnD, group(cat([txt("("), indent(cat([softline, join(cat([txt(","), line]), argDocs)])), softline, txt(")")]))])))(callArgDocs(cts, args, origin)));
});
var callD = _curry12(4, (cts, fn, args, origin) => callArgsD(cts, fn, args, origin, false));
var calleeD = _curry12(2, (cts, e) => match11(hooked(cts, e)).with({ _tag: "ECall" }, ({ fn, args, origin }) => callArgsD(cts, fn, args, origin, true)).otherwise(() => parenIf(loosePrefix(cts, e), exprD(cts, e))));
var operandD = _curry12(2, (cts, e) => parenIf(loosePrefix(cts, e), exprD(cts, e)));
var memberD = _curry12(2, (cts, e) => match11(e).with({ _tag: "ERecord" }, () => cat([txt("("), exprD(cts, e), txt(")")])).otherwise(() => parenIf(loosePrefix(cts, e), exprD(cts, e))));
var pipeD = _curry12(2, (cts, e) => match11(e).with((_v) => {
  const _g = _v;
  return _g._tag === "EPipe" && _g.right._tag === "ECall" && _g.fast === true;
}, ({ left, right: { fn: rfn, args: rargs, origin: rorigin } }) => cat([pipeLeftD(cts, left, FAST_PIPE_PREC), txt("->"), callD(cts, rfn, rargs, rorigin)])).otherwise(() => ((segments) => match11(segments).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => txt("")).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([head, ...rest]) => group(cat([pipeLeftD(cts, head, PIPE_PREC), indent(cat(map5((s) => cat([line, txt("|> "), operandD(cts, s)]), rest)))]))).otherwise(() => {
  throw new Error("non-exhaustive match");
}))(pipeSegmentsFrom(e, []))));
var letBindHead = _curry12(3, (cts, monad, param) => `let${eq11(monad, "Task") ? "!" : "?"} ${paramText(cts, param)}`);
var hooked = _curry12(2, (cts, e) => eq11(length9(cts.formatHooks), 0) ? e : ((sp) => _Option_isSome2(_Array_find2((s) => and8(s > sp.start, s < sp.end), cts.commentStarts)) ? e : _Option_unwrapOr5(e, runFormatHooks(cts.formatHooks, e)))(exprSpan2(e)));
var exprRaw = _curry12(2, (cts, e) => exprRawOf(cts, hooked(cts, e)));
var exprRawOf = _curry12(2, (cts, e) => match11(e).with({ _tag: "ENum" }, ({ raw }) => txt(raw)).with({ _tag: "EUnit" }, () => txt("()")).with({ _tag: "EBool" }, ({ value }) => txt(show4(value))).with({ _tag: "EStr" }, ({ value }) => txt(strLit2(value))).with({ _tag: "EInterp" }, ({ parts }) => txt(interpText(cts, parts))).with({ _tag: "ERef" }, ({ name }) => txt(name)).with({ _tag: "ECall" }, ({ fn, args, origin }) => callD(cts, fn, args, origin)).with({ _tag: "ELambda" }, ({ params, body }) => lambdaD(cts, params, body)).with({ _tag: "EPipe" }, () => pipeD(cts, e)).with({ _tag: "EDo" }, ({ exprs }) => doD(cts, exprs)).with({ _tag: "ETernary" }, () => ternaryD(cts, e)).with({ _tag: "ERecord" }, ({ fields, spread }) => recordD(cts, fields, spread)).with({ _tag: "EField" }, ({ target, name }) => cat([memberD(cts, target), txt(`.${name}`)])).with({ _tag: "EMatch" }, ({ scrutinee, arms }) => matchD(cts, scrutinee, arms)).with({ _tag: "ELetIn" }, ({ name, annot, value, body }) => match11(discardedLetExprs(e)).with({ _tag: "Some" }, ({ value: exprs }) => doD(cts, exprs)).with({ _tag: "None" }, () => ((ann) => letLikeD(cts, `let ${name}${ann}`, value, body))(match11(annot).with({ _tag: "Some" }, ({ value: te }) => ` : ${showTypeExpr(te)}`).with({ _tag: "None" }, () => "").exhaustive())).exhaustive()).with({ _tag: "ELetBind" }, ({ param, monad, value, body }) => letLikeD(cts, letBindHead(cts, monad, param), value, body)).with({ _tag: "ELoop" }, ({ params, body }) => loopD(cts, params, body)).with({ _tag: "ERecur" }, ({ args }) => cat([txt("recur"), bracketed("(", ")", map5((x) => exprD(cts, x), args))])).with({ _tag: "ETuple" }, ({ elements }) => bracketed("(", ")", map5((x) => exprD(cts, x), elements))).with({ _tag: "EArr" }, ({ elements }) => bracketed("[", "]", map5((el) => seqElemD(cts, el), elements))).with({ _tag: "EList" }, ({ elements }) => bracketed("@{", "}", map5((el) => seqElemD(cts, el), elements))).with({ _tag: "ESet" }, ({ elements }) => bracketed("#{", "}", map5((el) => seqElemD(cts, el), elements))).with({ _tag: "EMap" }, ({ entries }) => braced("#{", "}", map5((en) => cat([exprD(cts, en.key), txt(": "), exprD(cts, en.value)]), entries))).exhaustive());
var aliasFieldText = (f) => `${f.name}${f.optional ? "?" : ""}: ${showTypeExpr(f.fieldType)}`;
var ctorArms = _curry12(3, (cts, ctors, i) => match11(_Array_get8(i, ctors)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: c }) => _Array_prepend3(cat([hardline, withComments(cts, CTOR, c.span, txt(`| ${ctorText(c)}`))]), ctorArms(cts, ctors, i + 1))).exhaustive());
var typeStmtD = _curry12(6, (cts, name, params, ctors, alias, aliasType) => {
  const head = `type ${name}${generics(params)}`;
  return match11(alias).with({ _tag: "Some" }, ({ value: fields }) => cat([txt(`${head} = `), braced("{", "}", map5((f) => txt(aliasFieldText(f)), fields))])).with({ _tag: "None" }, () => match11(aliasType).with({ _tag: "Some" }, ({ value: te }) => txt(`${head} = ${showTypeExpr(te)}`)).with({ _tag: "None" }, () => eq11(length9(ctors), 0) ? txt(`extern ${head}`) : cat([txt(`${head} =`), indent(cat(ctorArms(cts, ctors, 0)))])).exhaustive()).exhaustive();
});
var importStmtD = _curry12(2, (names, from) => group(cat([txt("import "), braced("{", "}", map5((n) => txt(n.name), names)), txt(` from ${strLit2(from)}`)])));
var importNsStmtD = _curry12(2, (alias, from) => txt(`import * as ${alias} from ${strLit2(from)}`));
var exprD = _curry12(2, (cts, e) => withComments(cts, EXPR, exprSpan2(e), exprRaw(cts, e)));
var expPrefix = (exported) => exported ? "export " : "";
var fieldOf = _curry12(2, (e, tmp) => match11(e).with((_v) => {
  const _g = _v;
  return _g._tag === "EField" && _g.target._tag === "ERef";
}, ({ target: { name: target }, name }) => eq11(target, tmp) ? Some10(name) : None10).otherwise(() => None10));
var destructureFieldsFrom = _curry12(4, (stmts, j, tmp, acc) => match11(_Array_get8(j, stmts)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SLet";
}, ({ value: { name, value } }) => match11(fieldOf(value, tmp)).with({ _tag: "Some" }, ({ value: f }) => eq11(f, name) ? destructureFieldsFrom(stmts, j + 1, tmp, _Array_append8(f, acc)) : acc).with({ _tag: "None" }, () => acc).exhaustive()).otherwise(() => acc));
var stmtDoc = _curry12(4, (cts, stmts, i, src) => match11(_Array_get8(i, stmts)).with({ _tag: "None" }, () => ({ doc: txt(""), consumed: 1 })).with({ _tag: "Some" }, ({ value: s }) => match11(s).with({ _tag: "SImport" }, ({ names, from }) => ({ doc: importStmtD(names, from), consumed: 1 })).with({ _tag: "SImportNs" }, ({ alias, from }) => ({ doc: importNsStmtD(alias.name, from), consumed: 1 })).with({ _tag: "SType" }, ({ name, params, ctors, alias, aliasType, exported }) => ({ doc: cat([txt(expPrefix(exported)), typeStmtD(cts, name, params, ctors, alias, aliasType)]), consumed: 1 })).with({ _tag: "SExtern" }, ({ name, params, typeExpr: te, module, imported, curried, exported }) => ({ doc: txt(`${expPrefix(exported)}${externStmt(name, params, te, module, imported, curried)}`), consumed: 1 })).with({ _tag: "SError" }, ({ span: sp }) => ({ doc: verbatim(_Str_slice3(sp.start, sp.end, src)), consumed: 1 })).with({ _tag: "SExpr" }, ({ value }) => ({ doc: exprD(cts, value), consumed: 1 })).with({ _tag: "SLet" }, ({ name, annot, value, exported }) => _Str_startsWith3("$", name) ? ((fields) => ({ doc: cat([txt(`${expPrefix(exported)}let { ${_Str_join5(", ", fields)} } = `), exprD(cts, value)]), consumed: length9(fields) + 1 }))(destructureFieldsFrom(stmts, i + 1, name, [])) : ((ann) => ({ doc: cat([txt(`${expPrefix(exported)}let ${name}${ann} = `), exprD(cts, value)]), consumed: 1 }))(match11(annot).with({ _tag: "Some" }, ({ value: te }) => ` : ${showTypeExpr(te)}`).with({ _tag: "None" }, () => "").exhaustive())).exhaustive()).exhaustive());
var stmtSpan = (s) => match11(s).with({ _tag: "SLet" }, ({ span: sp }) => sp).with({ _tag: "SType" }, ({ span: sp }) => sp).with({ _tag: "SExtern" }, ({ span: sp }) => sp).with({ _tag: "SImport" }, ({ span: sp }) => sp).with({ _tag: "SImportNs" }, ({ span: sp }) => sp).with({ _tag: "SExpr" }, ({ span: sp }) => sp).with({ _tag: "SError" }, ({ span: sp }) => sp).exhaustive();
var blankBetweenFrom = _curry12(3, (s, i, seenNl) => match11(_Str_get4(i, s)).with({ _tag: "None" }, () => false).with({ _tag: "Some", value: `
` }, () => or7(seenNl, blankBetweenFrom(s, i + 1, true))).with({ _tag: "Some", value: " " }, () => blankBetweenFrom(s, i + 1, seenNl)).with({ _tag: "Some", value: "\t" }, () => blankBetweenFrom(s, i + 1, seenNl)).with({ _tag: "Some", value: "r" }, () => blankBetweenFrom(s, i + 1, seenNl)).with({ _tag: "Some" }, () => blankBetweenFrom(s, i + 1, false)).exhaustive());
var blankBetween = (gap) => blankBetweenFrom(gap, 0, false);
var anchorStart = _curry12(2, (cts, s) => {
  const sp = stmtSpan(s);
  return match11(_Array_get8(0, atKey(cts.leading, spanKey(STMT, sp)))).with({ _tag: "Some" }, ({ value: c }) => c.start).with({ _tag: "None" }, () => sp.start).exhaustive();
});
var stmtParts = _curry12(6, (cts, stmts, i, src, prevEnd, acc) => match11(_Array_get8(i, stmts)).with({ _tag: "None" }, () => _tuple6(acc, prevEnd)).with({ _tag: "Some" }, ({ value: cur }) => ((sep) => ((printed) => ((lastIdx) => ((end) => stmtParts(cts, stmts, i + printed.consumed, src, Some10(end), _Array_concat4(acc, _Array_append8(withComments(cts, STMT, stmtSpan(cur), printed.doc), sep))))(match11(_Array_get8(lastIdx, stmts)).with({ _tag: "Some" }, ({ value: last }) => stmtSpan(last).end).with({ _tag: "None" }, () => 0).exhaustive()))(i + printed.consumed - 1))(stmtDoc(cts, stmts, i, src)))(match11(prevEnd).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: pe }) => blankBetween(_Str_slice3(pe, anchorStart(cts, cur), src)) ? [hardline, hardline] : [hardline]).exhaustive())).exhaustive());
var tailParts = _curry12(3, (tail, src, prevEnd) => match11(_Array_get8(0, tail)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: first }) => ((sep) => _Array_append8(join(hardline, map5((c) => txt(c.text), tail)), sep))(match11(prevEnd).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: pe }) => blankBetween(_Str_slice3(pe, first.start, src)) ? [hardline, hardline] : [hardline]).exhaustive())).exhaustive());
var programDoc = _curry12(4, (cts, stmts, src, tail) => (([parts, prevEnd]) => cat(_Array_concat4(_Array_concat4(parts, tailParts(tail, src, prevEnd)), [hardline])))(stmtParts(cts, stmts, 0, src, None10, [])));
var stmtAnchors = (s) => _Array_append8({ kind: STMT, sp: stmtSpan(s) }, match11(s).with({ _tag: "SLet" }, ({ value }) => exprAnchors(value)).with({ _tag: "SExpr" }, ({ value }) => exprAnchors(value)).with({ _tag: "SType" }, ({ ctors }) => map5((c) => ({ kind: CTOR, sp: c.span }), ctors)).otherwise(() => []));
var inErrorSpanFrom = _curry12(3, (stmts, i, c) => match11(_Array_get8(i, stmts)).with({ _tag: "None" }, () => false).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SError";
}, ({ value: { span: sp } }) => or7(and8(c.start >= sp.start, c.start < sp.end), inErrorSpanFrom(stmts, i + 1, c))).with({ _tag: "Some" }, () => inErrorSpanFrom(stmts, i + 1, c)).exhaustive());
var inErrorSpan = _curry12(2, (stmts, c) => inErrorSpanFrom(stmts, 0, c));
var hasOpenDirective = (src) => match11(_Array_get8(0, _Str_split3(`
`, _Str_trim(src)))).with({ _tag: "Some" }, ({ value: first }) => eq11(_Str_trim(first), '"use open"')).with({ _tag: "None" }, () => false).exhaustive();
var formatProgram = _curry12(2, (stmts, src) => formatProgramWith(stmts, src, []));
var formatProgramWith = _curry12(3, (stmts, src, formatHooks) => {
  const innerBound = _Set_fromArray(_Array_flatMap(stmtInnerNames, stmts));
  const shadowed = _Set_union(innerBound, _Set_fromArray(topLevelNames(stmts)));
  const comments = filter((c) => not7(inErrorSpan(stmts, c)), collectComments(src));
  const base = { ...noComments, flatArity: buildFlatArity(stmts, innerBound), shadowed, formatHooks, commentStarts: map5((c) => c.start, comments) };
  const attached = attachFrom(comments, 0, sortAnchors(_Array_flatMap(stmtAnchors, stmts)), src, { table: base, tail: [] });
  const body = render(programDoc(attached.table, stmts, src, attached.tail), WIDTH);
  return hasOpenDirective(src) ? `"use open"

${body}` : body;
});
import { _Array_contains, _Array_prepend as _Array_prepend5, _Map_get as _Map_get4, _Map_getOr, _Map_set as _Map_set4, _Map_values, _Set_add, _Set_diff, _Set_fromArray as _Set_fromArray2, _Set_has as _Set_has2, _Set_toArray, _Str_codeAt as _Str_codeAt6, _curry as _curry14, _tuple as _tuple7, and as and9, map as map7 } from "@mochi/compiler/runtime";
import { match as match13 } from "@onrails/pattern";

import { Err as Err6, Ok as Ok7, Some as Some11, _Array_get as _Array_get9, _Array_prepend as _Array_prepend4, _Map_has, _Map_set as _Map_set3, _Option_unwrapOr as _Option_unwrapOr6, _Result_flatMap as _Result_flatMap5, _Result_map as _Result_map5, _curry as _curry13, _done as _done5, _recur as _recur5, eq as eq12, filter as filter2, length as length10, map as map6, not as not8, show as show5 } from "@mochi/compiler/runtime";
import { match as match12 } from "@onrails/pattern";
var emptyRegistry = { ctors: new Map, types: new Map };
var primTypeNames = ["number", "int", "float", "string", "bool", "unit"];
var keysOfFrom = _curry13(2, (fields, i) => match12(_Array_get9(i, fields)).with({ _tag: "None" }, () => []).with({ _tag: "Some" }, ({ value: f }) => _Array_prepend4(_Option_unwrapOr6(`_${show5(i)}`, f.name), keysOfFrom(fields, i + 1))).exhaustive());
var keysOf = (fields) => keysOfFrom(fields, 0);
var builtinSpan = { start: 0, end: 0 };
var builtinTypeDecls = [{ name: "Option", params: ["a"], ctors: [{ name: "Some", fields: [{ name: Some11("value"), fieldType: TyName("a", builtinSpan) }], span: builtinSpan }, { name: "None", fields: [], span: builtinSpan }] }, { name: "Result", params: ["a", "e"], ctors: [{ name: "Ok", fields: [{ name: Some11("value"), fieldType: TyName("a", builtinSpan) }], span: builtinSpan }, { name: "Err", fields: [{ name: Some11("error"), fieldType: TyName("e", builtinSpan) }], span: builtinSpan }] }];
var declaresType = _curry13(3, (stmts, i, name) => match12(_Array_get9(i, stmts)).with({ _tag: "None" }, () => false).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { name: n } }) => eq12(n, name) ? true : declaresType(stmts, i + 1, name)).with({ _tag: "Some" }, () => declaresType(stmts, i + 1, name)).exhaustive());
var builtinDeclsFor = (stmts) => filter2((bt) => not8(declaresType(stmts, 0, bt.name)), builtinTypeDecls);
var seedRegCtorsFrom = _curry13(4, (ctors, i, owner, acc) => match12(_Array_get9(i, ctors)).with({ _tag: "None" }, () => acc).with({ _tag: "Some" }, ({ value: c }) => seedRegCtorsFrom(ctors, i + 1, owner, _Map_has(c.name, acc) ? acc : _Map_set3(c.name, { owner, arity: length10(c.fields) }, acc))).exhaustive());
var seedRegDeclsFrom = _curry13(3, (decls, i, reg) => match12(_Array_get9(i, decls)).with({ _tag: "None" }, () => reg).with({ _tag: "Some" }, ({ value: bt }) => seedRegDeclsFrom(decls, i + 1, { ctors: seedRegCtorsFrom(bt.ctors, 0, bt.name, reg.ctors), types: _Map_set3(bt.name, map6((c) => c.name, bt.ctors), reg.types) })).exhaustive());
var ctorErr = _curry13(2, (message, sp) => ({ message, start: sp.start, end: sp.end }));
var ctorsInto = _curry13(5, (ctors, i, owner, sp, acc) => match12(_Array_get9(i, ctors)).with({ _tag: "None" }, () => Ok7(acc)).with({ _tag: "Some" }, ({ value: c }) => _Map_has(c.name, acc) ? Err6(ctorErr(`duplicate constructor '${c.name}'`, sp)) : ctorsInto(ctors, i + 1, owner, sp, _Map_set3(c.name, { owner, arity: length10(c.fields) }, acc))).exhaustive());
var buildLoop = _curry13(3, (stmts, i, reg) => match12(_Array_get9(i, stmts)).with({ _tag: "None" }, () => Ok7(reg)).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { name, ctors, span: sp } }) => _Map_has(name, reg.types) ? Err6(ctorErr(`duplicate type '${name}'`, sp)) : _Result_flatMap5((cs) => buildLoop(stmts, i + 1, { ctors: cs, types: _Map_set3(name, map6((c) => c.name, ctors), reg.types) }), ctorsInto(ctors, 0, name, sp, reg.ctors))).with({ _tag: "Some" }, () => buildLoop(stmts, i + 1, reg)).exhaustive());
var exportedRegLoop = _curry13(3, (stmts, i0, reg0) => {
  let i = i0;
  let reg = reg0;
  while (true) {
    const _step = match12(_Array_get9(i, stmts)).with({ _tag: "None" }, () => _done5(reg)).with((_v) => {
      const _g = _v;
      return _g._tag === "Some" && _g.value._tag === "SType" && _g.value.exported === true;
    }, ({ value: { name, ctors } }) => _recur5(i + 1, { ctors: seedRegCtorsFrom(ctors, 0, name, reg.ctors), types: _Map_set3(name, map6((c) => c.name, ctors), reg.types) })).with({ _tag: "Some" }, () => _recur5(i + 1, reg)).exhaustive();
    if (_step._tag === "recur") {
      [i, reg] = _step.args;
      continue;
    }
    return _step.value;
  }
});
var ctorKeysInto = _curry13(3, (ctors, i, m) => match12(_Array_get9(i, ctors)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { name, fields } }) => ctorKeysInto(ctors, i + 1, _Map_set3(name, keysOf(fields), m))).exhaustive());
var ctorKeysFrom = _curry13(3, (stmts, i, m) => match12(_Array_get9(i, stmts)).with({ _tag: "None" }, () => m).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType";
}, ({ value: { ctors } }) => ctorKeysFrom(stmts, i + 1, ctorKeysInto(ctors, 0, m))).with({ _tag: "Some" }, () => ctorKeysFrom(stmts, i + 1, m)).exhaustive());
var ctorKeysFromStmts = _curry13(2, (stmts, m) => ctorKeysFrom(stmts, 0, m));
var seedKeyCtorsFrom = _curry13(3, (ctors, i, m) => match12(_Array_get9(i, ctors)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { name, fields } }) => seedKeyCtorsFrom(ctors, i + 1, _Map_has(name, m) ? m : _Map_set3(name, keysOf(fields), m))).exhaustive());
var seedKeyDeclsFrom = _curry13(3, (decls, i, m) => match12(_Array_get9(i, decls)).with({ _tag: "None" }, () => m).with((_v) => _v._tag === "Some", ({ value: { ctors } }) => seedKeyDeclsFrom(decls, i + 1, seedKeyCtorsFrom(ctors, 0, m))).exhaustive());
var seedBuiltinCtorKeys = _curry13(2, (stmts, m) => seedKeyDeclsFrom(builtinDeclsFor(stmts), 0, m));
var exportedCtorKeysFrom = _curry13(3, (stmts, i, m) => match12(_Array_get9(i, stmts)).with({ _tag: "None" }, () => m).with((_v) => {
  const _g = _v;
  return _g._tag === "Some" && _g.value._tag === "SType" && _g.value.exported === true;
}, ({ value: { ctors } }) => exportedCtorKeysFrom(stmts, i + 1, ctorKeysInto(ctors, 0, m))).with({ _tag: "Some" }, () => exportedCtorKeysFrom(stmts, i + 1, m)).exhaustive());

var tNumber = tPrim("number");
var tBool = tPrim("bool");
var tString = tPrim("string");
var primType = (name) => match13(name).with("float", () => tNumber).with("int", () => tNumber).with("string", () => tString).with("bool", () => tBool).otherwise(() => tPrim(name));
var emptyVarSets = { tv: _Set_fromArray2([]), rv: _Set_fromArray2([]) };
var diffVarSets = _curry14(2, (a, b) => ({ tv: _Set_diff(a.tv, b.tv), rv: _Set_diff(a.rv, b.rv) }));
var collect = _curry14(2, (t, acc) => match13(t).with({ _tag: "TyVar" }, ({ id }) => ({ tv: _Set_add(id, acc.tv), rv: acc.rv })).with({ _tag: "TyCon" }, ({ args }) => collectArgs(args, acc)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => collect(toT, collect(fromT, acc))).with({ _tag: "TyRecord" }, ({ row }) => collectRow(row, acc)).with({ _tag: "TySingleton" }, () => acc).with({ _tag: "TyOneOf" }, ({ members }) => collectArgs(members, acc)).exhaustive());
var collectArgs = _curry14(2, (args, acc) => match13(args).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([a, ...rest]) => collectArgs(rest, collect(a, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var collectRow = _curry14(2, (row, acc) => match13(row).with({ _tag: "RowVar" }, ({ id }) => ({ tv: acc.tv, rv: _Set_add(id, acc.rv) })).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => collectRow(rest, collect(fieldType, acc))).with({ _tag: "RowEmpty" }, () => acc).exhaustive());
var freeInType = (t) => collect(t, emptyVarSets);
var collectFree = _curry14(4, (t, bound, st, acc) => match13(t).with({ _tag: "TyVar" }, ({ id }) => _Set_has2(id, bound.tv) ? acc : match13(_Map_get4(id, st.tv)).with({ _tag: "Some" }, ({ value: next }) => collectFree(next, bound, st, acc)).with({ _tag: "None" }, () => ({ tv: _Set_add(id, acc.tv), rv: acc.rv })).exhaustive()).with({ _tag: "TyCon" }, ({ args }) => collectFreeArgs(args, bound, st, acc)).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => collectFree(toT, bound, st, collectFree(fromT, bound, st, acc))).with({ _tag: "TyRecord" }, ({ row }) => collectFreeRow(row, bound, st, acc)).with({ _tag: "TySingleton" }, () => acc).with({ _tag: "TyOneOf" }, ({ members }) => collectFreeArgs(members, bound, st, acc)).exhaustive());
var collectFreeArgs = _curry14(4, (args, bound, st, acc) => match13(args).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => acc).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([a, ...rest]) => collectFreeArgs(rest, bound, st, collectFree(a, bound, st, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var collectFreeRow = _curry14(4, (row, bound, st, acc) => match13(row).with({ _tag: "RowVar" }, ({ id }) => _Set_has2(id, bound.rv) ? acc : match13(_Map_get4(id, st.rv)).with({ _tag: "Some" }, ({ value: next }) => collectFreeRow(next, bound, st, acc)).with({ _tag: "None" }, () => ({ tv: acc.tv, rv: _Set_add(id, acc.rv) })).exhaustive()).with({ _tag: "RowExtend" }, ({ fieldType, rest }) => collectFreeRow(rest, bound, st, collectFree(fieldType, bound, st, acc))).with({ _tag: "RowEmpty" }, () => acc).exhaustive());
var freeInScheme = _curry14(3, (sc, st, acc) => collectFree(sc.ty, { tv: _Set_fromArray2(sc.vars), rv: _Set_fromArray2(sc.rvars) }, st, acc));
var freeInEnvFrom = _curry14(3, (schemes, st, acc) => match13(schemes).with((_v) => _v.length === 0, () => acc).with((_v) => _v.length >= 1, ([sc, ...rest]) => freeInEnvFrom(rest, st, freeInScheme(sc, st, acc))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var freeInEnv = _curry14(2, (env, st) => freeInEnvFrom(_Map_values(env), st, emptyVarSets));
var generalize = _curry14(4, (env, t, st, widen) => {
  const zt = widen ? widenLits(zonk(t, st)) : zonk(t, st);
  const free = diffVarSets(freeInType(zt), freeInEnv(env, st));
  return { vars: _Set_toArray(free.tv), rvars: _Set_toArray(free.rv), ty: zt };
});
var widenLits = (t) => match13(t).with({ _tag: "TySingleton", base: "string" }, () => tString).with({ _tag: "TySingleton" }, () => tNumber).with({ _tag: "TyOneOf" }, ({ members }) => tUnion(map7((m) => match13(m).with({ _tag: "TySingleton" }, () => m).otherwise(() => widenLits(m)), members))).with({ _tag: "TyCon" }, ({ name, args }) => tCon(name, map7(widenLits, args))).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tArrow(widenLits(fromT), widenLits(toT))).with({ _tag: "TyRecord" }, ({ row }) => tRecord(widenRow(row))).with({ _tag: "TyVar" }, () => t).exhaustive();
var widenRow = (row) => match13(row).with({ _tag: "RowEmpty" }, () => row).with({ _tag: "RowVar" }, () => row).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => rField(label, widenLits(fieldType), widenRow(rest), optional)).exhaustive();
var instMapFrom = _curry14(3, (vars, acc, st) => match13(vars).with((_v) => _v.length === 0, () => _tuple7(acc, st)).with((_v) => _v.length >= 1, ([v, ...rest]) => (([fv, st1]) => instMapFrom(rest, _Map_set4(v, fv, acc), st1))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var instRowMapFrom = _curry14(3, (vars, acc, st) => match13(vars).with((_v) => _v.length === 0, () => _tuple7(acc, st)).with((_v) => _v.length >= 1, ([v, ...rest]) => (([fr, st1]) => instRowMapFrom(rest, _Map_set4(v, fr, acc), st1))(freshRowVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var instSub = _curry14(3, (t, tmap, rmap) => match13(t).with({ _tag: "TyVar" }, ({ id }) => _Map_getOr(t, id, tmap)).with({ _tag: "TyCon" }, ({ name, args }) => tCon(name, map7((a) => instSub(a, tmap, rmap), args))).with({ _tag: "TyFn" }, ({ from: fromT, to: toT }) => tArrow(instSub(fromT, tmap, rmap), instSub(toT, tmap, rmap))).with({ _tag: "TyRecord" }, ({ row }) => tRecord(instSubRow(row, tmap, rmap))).with({ _tag: "TySingleton" }, ({ base, value }) => TySingleton(base, value)).with({ _tag: "TyOneOf" }, ({ members }) => tUnion(map7((m) => instSub(m, tmap, rmap), members))).exhaustive());
var instSubRow = _curry14(3, (row, tmap, rmap) => match13(row).with({ _tag: "RowVar" }, ({ id }) => _Map_getOr(row, id, rmap)).with({ _tag: "RowExtend" }, ({ label, fieldType, optional, rest }) => rField(label, instSub(fieldType, tmap, rmap), instSubRow(rest, tmap, rmap), optional)).with({ _tag: "RowEmpty" }, () => row).exhaustive());
var instantiate = _curry14(2, (sc, st) => (([tmap, st1]) => (([rmap, st2]) => _tuple7(instSub(sc.ty, tmap, rmap), st2))(instRowMapFrom(sc.rvars, new Map, st1)))(instMapFrom(sc.vars, new Map, st)));
var isUpperStart = (s) => match13(_Str_codeAt6(0, s)).with({ _tag: "Some" }, ({ value: c }) => and9(c >= 65, c <= 90)).with({ _tag: "None" }, () => false).exhaustive();
var typeExprListToType = _curry14(5, (tes, vars, st, aliases, expanding) => match13(tes).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple7([], vars, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([te, ...rest]) => (([t, vars1, st1]) => (([restTs, vars2, st2]) => _tuple7(_Array_prepend5(t, restTs), vars2, st2))(typeExprListToType(rest, vars1, st1, aliases, expanding)))(typeExprToType(te, vars, st, aliases, expanding))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var typeExprName = _curry14(5, (name, vars, st, aliases, expanding) => _Array_contains(name, primTypeNames) ? _tuple7(primType(name), vars, st) : match13(_Map_get4(name, vars)).with({ _tag: "Some" }, ({ value: v }) => _tuple7(v, vars, st)).with({ _tag: "None" }, () => match13(_Map_get4(name, aliases)).with({ _tag: "Some" }, ({ value: info }) => (([t, st1]) => _tuple7(t, vars, st1))(aliasRow(name, info, [], st, aliases, expanding))).with({ _tag: "None" }, () => isUpperStart(name) ? _tuple7(tPrim(name), vars, st) : (([v, st1]) => _tuple7(v, _Map_set4(name, v, vars), st1))(freshVar(st))).exhaustive()).exhaustive());
var typeExprToType = _curry14(5, (te, vars, st, aliases, expanding) => match13(te).with({ _tag: "TyArrow" }, ({ from: fromTe, to: toTe }) => (([fromT, vars1, st1]) => (([toT, vars2, st2]) => _tuple7(tArrow(fromT, toT), vars2, st2))(typeExprToType(toTe, vars1, st1, aliases, expanding)))(typeExprToType(fromTe, vars, st, aliases, expanding))).with({ _tag: "TyApp" }, ({ ctor, args: argTes }) => (([args, vars1, st1]) => match13(_Map_get4(ctor, aliases)).with({ _tag: "Some" }, ({ value: info }) => (([t, st2]) => _tuple7(t, vars1, st2))(aliasRow(ctor, info, args, st1, aliases, expanding))).with({ _tag: "None" }, () => _tuple7(tCon(ctor, args), vars1, st1)).exhaustive())(typeExprListToType(argTes, vars, st, aliases, expanding))).with({ _tag: "TyTuple" }, ({ elems: elemTes }) => (([elems, vars1, st1]) => _tuple7(tTuple(elems), vars1, st1))(typeExprListToType(elemTes, vars, st, aliases, expanding))).with({ _tag: "TyList" }, ({ elem: elemTe }) => (([elemT, vars1, st1]) => _tuple7(tCon("Array", [elemT]), vars1, st1))(typeExprToType(elemTe, vars, st, aliases, expanding))).with({ _tag: "TyName" }, ({ name }) => typeExprName(name, vars, st, aliases, expanding)).with({ _tag: "TyQual" }, ({ alias, name, args: argTes }) => (([args, vars1, st1]) => match13(_Map_get4(`${alias}.${name}`, aliases)).with({ _tag: "Some" }, ({ value: info }) => (([t, st2]) => _tuple7(t, vars1, st2))(aliasRow(name, info, args, st1, aliases, expanding))).with({ _tag: "None" }, () => _tuple7(tCon(name, args), vars1, st1)).exhaustive())(typeExprListToType(argTes, vars, st, aliases, expanding))).with({ _tag: "TyLit" }, ({ value }) => _tuple7(tLit(value), vars, st)).with({ _tag: "TyUnion" }, ({ members }) => (([ts, vars1, st1]) => _tuple7(tUnion(ts), vars1, st1))(typeExprListToType(members, vars, st, aliases, expanding))).exhaustive());
var aliasLocalVarsFrom = _curry14(3, (params, args, st) => match13(params).with((_v) => _v.length === 0, () => _tuple7(new Map, st)).with((_v) => _v.length >= 1, ([p, ...restParams]) => match13(args).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([a, ...restArgs]) => (([restMap, st1]) => _tuple7(_Map_set4(p, a, restMap), st1))(aliasLocalVarsFrom(restParams, restArgs, st))).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => (([v, st1]) => (([restMap, st2]) => _tuple7(_Map_set4(p, v, restMap), st2))(aliasLocalVarsFrom(restParams, [], st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
})).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var aliasFieldsFrom = _curry14(5, (fields, vars, st, aliases, expanding) => match13(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple7(RowEmpty, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([fld, ...rest]) => (([ft, vars1, st1]) => (([restRow, st2]) => _tuple7(rField(fld.name, ft, restRow, fld.optional), st2))(aliasFieldsFrom(rest, vars1, st1, aliases, expanding)))(typeExprToType(fld.fieldType, vars, st, aliases, expanding))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var aliasRow = _curry14(6, (name, info, args, st, aliases, expanding) => _Set_has2(name, expanding) ? _tuple7(tCon(name, args), st) : match13(info.expr).with({ _tag: "Some" }, ({ value: te }) => (([local, st1]) => (([t, _, st2]) => _tuple7(t, st2))(typeExprToType(te, local, st1, aliases, _Set_add(name, expanding))))(aliasLocalVarsFrom(info.params, args, st))).with({ _tag: "None" }, () => (([local, st1]) => {
  const next = _Set_add(name, expanding);
  return (([row, st2]) => _tuple7(tRecord(row), st2))(aliasFieldsFrom(info.fields, local, st1, aliases, next));
})(aliasLocalVarsFrom(info.params, args, st))).exhaustive());
var pvarsFrom = _curry14(2, (params, st) => match13(params).with((_v) => _v.length === 0, () => _tuple7(new Map, [], st)).with((_v) => _v.length >= 1, ([p, ...rest]) => (([v, st1]) => (([restMap, restVars, st2]) => _tuple7(_Map_set4(p, v, restMap), _Array_prepend5(v, restVars), st2))(pvarsFrom(rest, st1)))(freshVar(st))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var ctorFieldsArrowFrom = _curry14(5, (fields, pvars, st, aliases, result) => match13(fields).with((_v) => {
  const _g = _v;
  return _g.length === 0;
}, () => _tuple7(result, st)).with((_v) => {
  const _g = _v;
  return _g.length >= 1;
}, ([fld, ...rest]) => (([ft, _, st1]) => (([restT, st2]) => _tuple7(tArrow(ft, restT), st2))(ctorFieldsArrowFrom(rest, pvars, st1, aliases, result)))(typeExprToType(fld.fieldType, pvars, st, aliases, _Set_fromArray2([])))).otherwise(() => {
  throw new Error("non-exhaustive match");
}));
var ctorScheme = _curry14(5, (typeName, params, c, st, aliases) => (([pvars, pvarTypes, st1]) => {
  const result = tCon(typeName, pvarTypes);
  return (([ty, st2]) => {
    const sets = collect(ty, emptyVarSets);
    return _tuple7({ vars: _Set_toArray(sets.tv), rvars: _Set_toArray(sets.rv), ty }, st2);
  })(ctorFieldsArrowFrom(c.fields, pvars, st1, aliases, result));
})(pvarsFrom(params, st)));
export {
  UNIT,
  formatHooksFor,
  formatProgram,
  formatProgramWith,
  freshRowVar,
  freshVar,
  lex,
  parse,
  parseRecovering,
  rExtend,
  tArrow,
  tBool,
  tCon,
  tLit,
  tNumber,
  tPrim,
  tRecord,
  tString,
  tUnion,
  zonk
};
